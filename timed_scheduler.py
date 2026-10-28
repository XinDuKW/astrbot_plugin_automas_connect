"""定时队列代管：到点排队、不打断、播报实际用时。

AUTO-MAS 自己的定时到点是直接 add_task 起一个新任务。如果 14:00 那批还在跑，
15:00 的任务启动后，队列里被占用的脚本会被标成「跳过」（task_manager.py 的
「该任务已被其他任务调度器锁定」分支），于是 15:00 这次就白跑了。

所以想「三点到了不打断两点、等两点清完再顺着跑」只能由插件代管：
  1. 接管某个队列时，把它的 Info.TimeEnabled 写成 false（原值记在本地
     data/plugin_data/astrbot_plugin_automas_connect/timed.json），AUTO-MAS
     不再自己触发它，也不会再出现「跳过」；
  2. 插件每 20 秒扫一遍所有被接管队列的 TimeSet，按本机时间到点就把请求塞进
     queue_runner，排在已有任务后面整条跑；跑之前先播报上一批的实际用时。
"""

from __future__ import annotations

import asyncio
import json
import os
import tempfile
from datetime import datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any

from astrbot.api import logger

from .bindings import default_data_dir
from .mas_api import MasClient, MasError

DATA_FILE = "timed.json"
# AUTO-MAS 用这个值当「没设置时间」的零值哨兵（= 北京时间 2000-01-01 00:00）
ZERO_ISO_PREFIX = "1999-12-31T16:00:00"
MAX_RUNS = 60
GRACE_MINUTES = 30

WEEKDAY_ZH = {
    "Monday": "周一",
    "Tuesday": "周二",
    "Wednesday": "周三",
    "Thursday": "周四",
    "Friday": "周五",
    "Saturday": "周六",
    "Sunday": "周日",
}


def local_time_of(value: Any) -> time | None:
    """把 AUTO-MAS 存的 UTC ISO 时间转成本机时分；哨兵值返回 None。"""
    text = str(value or "").strip()
    if not text or text.startswith(ZERO_ISO_PREFIX):
        return None
    try:
        moment = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return None
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    return moment.astimezone().time().replace(second=0, microsecond=0)


def fmt_hm(moment: datetime) -> str:
    return f"{moment.hour:02d}:{moment.minute:02d}"


def fmt_duration(seconds: float) -> str:
    total = int(max(0, seconds))
    hours, rest = divmod(total, 3600)
    minutes, _ = divmod(rest, 60)
    if hours and minutes:
        return f"{hours} 小时 {minutes} 分"
    if hours:
        return f"{hours} 小时"
    return f"{minutes} 分钟"


class TimedStore:
    """接管开关、已触发记录、最近执行记录，都放一个 json 里。"""

    def __init__(self, data_dir: Path | None = None):
        self._dir = Path(data_dir) if data_dir else default_data_dir()
        self._file = self._dir / DATA_FILE
        self._data: dict[str, Any] = {"version": 1, "takeover": {}, "fired": {}, "runs": []}
        self.load()

    def load(self) -> dict[str, Any]:
        try:
            raw = self._file.read_text(encoding="utf-8")
            parsed = json.loads(raw)
        except (OSError, ValueError):
            parsed = {}
        if not isinstance(parsed, dict):
            parsed = {}
        for key, fallback in (("takeover", {}), ("fired", {}), ("runs", [])):
            if not isinstance(parsed.get(key), fallback.__class__):
                parsed[key] = fallback
        parsed.setdefault("version", 1)
        self._data = parsed
        return self._data

    def save(self) -> None:
        self._dir.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(self._data, ensure_ascii=False, indent=2)
        handle, tmp = tempfile.mkstemp(dir=str(self._dir), suffix=".tmp")
        try:
            with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as fh:
                fh.write(payload)
            os.replace(tmp, self._file)
        finally:
            if os.path.exists(tmp):
                os.unlink(tmp)

    # ---- 接管 ----

    def takeover_ids(self) -> set[str]:
        return set(self._data["takeover"].keys())

    def takeover_of(self, queue_id: str) -> dict[str, Any] | None:
        entry = self._data["takeover"].get(queue_id)
        return entry if isinstance(entry, dict) else None

    def set_takeover(self, queue_id: str, name: str, original: bool, on: bool) -> None:
        if on:
            self._data["takeover"][queue_id] = {
                "name": name,
                "originalTimeEnabled": bool(original),
            }
        else:
            self._data["takeover"].pop(queue_id, None)
        self.save()

    def rename(self, queue_id: str, name: str) -> None:
        entry = self._data["takeover"].get(queue_id)
        if isinstance(entry, dict) and entry.get("name") != name:
            entry["name"] = name
            self.save()

    # ---- 已触发 ----

    def fired(self, key: str) -> bool:
        return key in self._data["fired"]

    def mark_fired(self, key: str) -> None:
        self._data["fired"][key] = datetime.now().isoformat(timespec="seconds")
        # 只留最近两天，别让文件无限长
        cutoff = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")
        self._data["fired"] = {
            key: value
            for key, value in self._data["fired"].items()
            if key.rsplit("/", 1)[-1][:10] >= cutoff
        }
        self.save()

    # ---- 执行记录 ----

    def add_run(self, record: dict[str, Any]) -> None:
        runs = self._data["runs"]
        runs.append(record)
        if len(runs) > MAX_RUNS:
            del runs[:-MAX_RUNS]
        self.save()

    def runs(self, limit: int = 20) -> list[dict[str, Any]]:
        return list(self._data["runs"][-limit:])[::-1]

    def last_run(self) -> dict[str, Any] | None:
        runs = self._data["runs"]
        return runs[-1] if runs else None


class TimedScheduler:
    """盯着被接管队列的定时槽，到点就往排队里塞一条定时任务。"""

    def __init__(self, plugin, runner):
        self._plugin = plugin
        self._runner = runner
        self._store = TimedStore()
        self._task: asyncio.Task | None = None
        self._stopping = False
        self._interval = 20

    # ---- 生命周期 ----

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._stopping = False
            self._task = asyncio.create_task(self._loop())

    async def shutdown(self) -> None:
        self._stopping = True
        if self._task is not None:
            self._task.cancel()
            self._task = None

    async def _loop(self) -> None:
        await asyncio.sleep(5)
        while not self._stopping:
            try:
                await self.tick()
            except asyncio.CancelledError:
                return
            except Exception as exc:  # noqa: BLE001 - 一轮出错不能停掉定时
                logger.warning(f"[automas] 定时接管轮询失败: {exc}")
            try:
                await asyncio.sleep(self._interval)
            except asyncio.CancelledError:
                return

    # ---- 轮询 ----

    async def tick(self) -> None:
        if not self._store.takeover_ids():
            return
        client = self._plugin.build_client()
        try:
            queues = await client.get_queues()
        except MasError as exc:
            logger.debug(f"[automas] 定时接管读不到队列: {exc}")
            return
        for entry in queues:
            queue_id = str(entry.get("uid") or "")
            if not queue_id or queue_id not in self._store.takeover_ids():
                continue
            raw = entry.get("data") or {}
            if not isinstance(raw, dict) or not raw:
                try:
                    raw = await client.get_queue_raw(queue_id)
                except MasError:
                    continue
            name = str((raw.get("Info") or {}).get("Name") or queue_id)
            self._store.rename(queue_id, name)
            try:
                times = await client.get_time_sets(queue_id)
            except MasError as exc:
                logger.debug(f"[automas] 定时接管读不到定时项 {name}: {exc}")
                continue
            self._fire_due(queue_id, name, raw, times)

    def _fire_due(
        self, queue_id: str, name: str, raw: dict[str, Any], times: list[dict[str, Any]]
    ) -> None:
        info = raw.get("Info") or {}
        if info.get("CycleEnabled"):
            return  # 循环队列由队列项自己的周期驱动
        now = datetime.now()
        today = now.strftime("%A")
        for time_set in times:
            time_set_id = str(time_set.get("uid") or "")
            slot_info = (time_set.get("data") or {}).get("Info") or {}
            if not slot_info.get("Enabled"):
                continue
            days = slot_info.get("Days") or []
            if today not in days:
                continue
            slot = local_time_of(slot_info.get("Time"))
            if slot is None:
                continue
            planned = now.replace(hour=slot.hour, minute=slot.minute, second=0, microsecond=0)
            if planned > now:
                continue
            if now - planned > timedelta(minutes=GRACE_MINUTES):
                continue
            key = f"{queue_id}/{time_set_id}/{planned:%Y-%m-%d %H:%M}"
            if self._store.fired(key):
                continue
            self._store.mark_fired(key)
            logger.info(
                f"[automas] 定时到点：{name} {fmt_hm(planned)}（今天 {WEEKDAY_ZH.get(today, today)}）"
            )
            self._runner.enqueue_timed(queue_id, name, planned, self.notify_umo())

    # ---- 接管开关 ----

    def notify_umo(self) -> str:
        try:
            return str(self._plugin._cfg_str("notify_umo") or "")
        except Exception:  # noqa: BLE001
            return ""

    async def set_takeover(self, queue_id: str, on: bool) -> dict[str, Any]:
        client = self._plugin.build_client()
        raw = await client.get_queue_raw(queue_id)
        info = raw.get("Info") or {}
        name = str(info.get("Name") or queue_id)
        original = bool(info.get("TimeEnabled"))
        if on:
            if original:
                await client.update_queue(queue_id, {"Info": {"TimeEnabled": False}})
            self._store.set_takeover(queue_id, name, original, True)
        else:
            entry = self._store.takeover_of(queue_id) or {}
            restore = bool(entry.get("originalTimeEnabled"))
            if restore and not info.get("TimeEnabled"):
                await client.update_queue(queue_id, {"Info": {"TimeEnabled": True}})
            self._store.set_takeover(queue_id, name, original, False)
        return {"queueId": queue_id, "name": name, "takeover": on}

    # ---- 执行记录（queue_runner 调） ----

    def record_run(self, record: dict[str, Any]) -> None:
        self._store.add_run(record)

    def last_run(self) -> dict[str, Any] | None:
        return self._store.last_run()

    def runs(self, limit: int = 20) -> list[dict[str, Any]]:
        return self._store.runs(limit)

    def previous_report(self, exclude_queue: str = "", exclude_planned: str = "") -> str:
        """上一批定时任务的用时播报，没有可播的就返回空串。"""
        for record in reversed(self._store.runs(10)):
            if exclude_queue and record.get("queueId") == exclude_queue and (
                record.get("planned") == exclude_planned
            ):
                continue
            planned = str(record.get("planned") or "")
            started = str(record.get("started") or "")
            finished = str(record.get("finished") or "")
            if not planned or not finished:
                continue
            status = str(record.get("status") or "")
            mark = "跑完了" if status == "success" else f"结束了（{record.get('detail') or status or '未成功'}）"
            try:
                start_at = datetime.fromisoformat(started)
                end_at = datetime.fromisoformat(finished)
                spent = fmt_duration((end_at - start_at).total_seconds())
            except ValueError:
                spent = "用时不明"
            head = f"{record.get('queueName') or record.get('queueId')} 这批（{planned[11:16]} 的定时）{mark}"
            return f"{head}：{started[11:16]} 开始、{finished[11:16]} 结束，用时 {spent}。"
        return ""

    # ---- 面板快照 ----

    async def snapshot(self) -> dict[str, Any]:
        client = self._plugin.build_client()
        queues: list[dict[str, Any]] = []
        try:
            entries = await client.get_queues()
        except MasError as exc:
            return {
                "error": str(exc),
                "queues": [],
                "runs": self.runs(),
                "takeover": sorted(self._store.takeover_ids()),
            }
        for entry in entries:
            queue_id = str(entry.get("uid") or "")
            raw = entry.get("data") or {}
            info = raw.get("Info") or {}
            try:
                times = await client.get_time_sets(queue_id)
            except MasError:
                times = []
            slots = []
            for time_set in times:
                time_set_id = str(time_set.get("uid") or "")
                slot_info = (time_set.get("data") or {}).get("Info") or {}
                slot = local_time_of(slot_info.get("Time"))
                slots.append(
                    {
                        "id": str(time_set_id),
                        "time": fmt_hm(datetime(2000, 1, 1, slot.hour, slot.minute)) if slot else "",
                        "days": [WEEKDAY_ZH.get(day, day) for day in (slot_info.get("Days") or [])],
                        "enabled": bool(slot_info.get("Enabled")),
                    }
                )
            slots.sort(key=lambda item: item["time"])
            queues.append(
                {
                    "queueId": queue_id,
                    "name": str(info.get("Name") or queue_id),
                    "cycle": bool(info.get("CycleEnabled")),
                    "timeEnabled": bool(info.get("TimeEnabled")),
                    "takeover": queue_id in self._store.takeover_ids(),
                    "slots": slots,
                }
            )
        queues.sort(key=lambda item: item["name"])
        return {
            "queues": queues,
            "runs": self.runs(),
            "takeover": sorted(self._store.takeover_ids()),
        }
