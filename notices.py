"""运行通知：订阅会话 + 逐脚本进度 + 卡住提醒 + 失败截图。

AUTO-MAS 自己的通知渠道是任务结束时推一条；插件这边补三件事：

* 每跑完一个脚本就汇报一次，让人知道任务确实在动；
* 长时间没有任何账号状态变化时提醒一句，防止「以为在跑其实卡死」；
* 失败时顺手截一张模拟器画面一起发出去。

订阅表存在 data/plugin_data/<插件名>/subscribers.json。谁在群里或私聊发
/mas 订阅，就把那个会话记下来，之后所有运行通知都发给它 —— 内向的用户
只私聊机器人也能收到，不必在群里抛头露面。
"""

from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any, Awaitable, Callable

from astrbot.api import logger

from .mas_api import MasError
from .bindings import default_data_dir

DATA_FILE = "subscribers.json"

# AUTO-MAS 里账号状态只有这几种：等待 / 运行 / 完成 / 异常 / 跳过
TERMINAL_STATUS = {"完成", "异常", "跳过"}
RUNNING_STATUS = {"运行"}

Sender = Callable[[str, "list[str]"], Awaitable[None]]
Capture = Callable[[str], Awaitable[str]]


def fmt_duration(seconds: float) -> str:
    """1 小时 13 分 / 12 分 3 秒 / 45 秒。"""
    total = max(0, int(round(float(seconds or 0))))
    hours, rest = divmod(total, 3600)
    minutes, secs = divmod(rest, 60)
    if hours:
        return f"{hours} 小时 {minutes} 分"
    if minutes:
        return f"{minutes} 分 {secs} 秒"
    return f"{secs} 秒"


class SubscriberStore:
    """谁在哪个会话里订阅了运行通知。

    结构：
    {
      "version": 1,
      "items": {
        "<umo>": {"umo": "...", "qq": "123", "display": "群昵称",
                  "updated": "2026-10-28T13:00:00"}
      }
    }
    """

    def __init__(self, data_dir: Path | None = None):
        self._dir = Path(data_dir) if data_dir else default_data_dir()
        self._file = self._dir / DATA_FILE
        self._data: dict[str, Any] = {"version": 1, "items": {}}
        self.load()

    # ---- 读写 ----

    def load(self) -> dict[str, Any]:
        try:
            data = json.loads(self._file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            data = {}
        if not isinstance(data, dict):
            data = {}
        items = data.get("items")
        if not isinstance(items, dict):
            items = {}
        data["items"] = items
        data.setdefault("version", 1)
        self._data = data
        return self._data

    def save(self) -> None:
        self._dir.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(self._data, ensure_ascii=False, indent=2)
        handle, tmp = tempfile.mkstemp(dir=str(self._dir), suffix=".tmp")
        try:
            with os.fdopen(handle, "w", encoding="utf-8", newline="\n") as fh:
                fh.write(payload)
            os.replace(tmp, self._file)
        except OSError:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

    # ---- 查询 ----

    def items(self) -> list[dict[str, Any]]:
        rows = [dict(item) for item in self._data["items"].values() if isinstance(item, dict)]
        rows.sort(key=lambda row: str(row.get("updated") or ""), reverse=True)
        return rows

    def umos(self) -> list[str]:
        return [str(umo) for umo in self._data["items"] if umo]

    def has(self, umo: str) -> bool:
        return str(umo) in self._data["items"]

    # ---- 修改 ----

    def subscribe(self, umo: str, qq: str = "", display: str = "") -> bool:
        """记下这个会话；返回是不是第一次订阅。"""
        umo = str(umo or "").strip()
        if not umo:
            return False
        fresh = umo not in self._data["items"]
        record = self._data["items"].setdefault(umo, {})
        record["umo"] = umo
        if qq:
            record["qq"] = str(qq)
        if display:
            record["display"] = str(display)
        record["updated"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        self.save()
        return fresh

    def unsubscribe(self, umo: str) -> bool:
        umo = str(umo or "").strip()
        if umo in self._data["items"]:
            self._data["items"].pop(umo, None)
            self.save()
            return True
        return False

    def remove_qq(self, qq: str) -> int:
        """按 QQ 号退订（面板里点删除时用）。"""
        qq = str(qq or "")
        if not qq:
            return 0
        gone = [umo for umo, item in self._data["items"].items() if str(item.get("qq") or "") == qq]
        for umo in gone:
            self._data["items"].pop(umo, None)
        if gone:
            self.save()
        return len(gone)


class ScriptProgress:
    """跟一次执行里的账号状态，在合适的时点发进度。

    send(text, images) 由插件提供；capture(script_id) 失败时去截一张图。
    第一次 update 只建立基线不播报，避免把上一轮遗留的终态当成新的完成。
    """

    def __init__(
        self,
        send: Sender,
        *,
        capture: Capture | None = None,
        label: str = "",
        each_user: bool = False,
        stuck_minutes: int = 20,
    ):
        self._send = send
        self._capture = capture
        self._label = label or "任务"
        self._each_user = bool(each_user)
        self._stuck_seconds = max(0, int(stuck_minutes or 0)) * 60

        self._status: dict[str, dict[str, str]] = {}
        self._names: dict[str, str] = {}
        self._user_names: dict[str, dict[str, str]] = {}
        self._started: dict[str, datetime] = {}
        self._announced: set[str] = set()
        self._user_announced: set[tuple[str, str]] = set()
        self._last_change = datetime.now()
        self._stuck_reported = False
        self._primed = False

    # ---- 对外 ----

    async def poll(self, client, task_id: str) -> None:
        """拉一次运行快照，只处理自己这个任务。"""
        try:
            tasks = await client.running_tasks()
        except MasError as exc:
            logger.debug(f"[automas] 进度快照拉取失败: {exc}")
            return
        task = next((item for item in tasks if item.get("taskId") == task_id), None)
        if task is None:
            # 任务已经在结束路上、快照里没它了：进度拿不到，但卡住检测照常跑
            await self._maybe_stuck(datetime.now())
            return
        await self.update(task.get("taskInfo") or [])

    async def update(self, entries: list[dict[str, Any]]) -> None:
        if not isinstance(entries, list) or not entries:
            return
        now = datetime.now()
        changed = False

        for entry in entries:
            if not isinstance(entry, dict):
                continue
            script_id = str(entry.get("scriptId") or "")
            if not script_id:
                continue
            self._names.setdefault(script_id, str(entry.get("name") or script_id))
            self._started.setdefault(script_id, now)

            users: dict[str, str] = {}
            names = self._user_names.setdefault(script_id, {})
            for user in entry.get("users") or []:
                if not isinstance(user, dict):
                    continue
                user_id = str(user.get("userId") or "")
                if not user_id:
                    continue
                users[user_id] = str(user.get("status") or "")
                names.setdefault(user_id, str(user.get("name") or user_id))
            if not users:
                continue

            previous = self._status.get(script_id) or {}
            if users != previous:
                changed = True
            for user_id, status in users.items():
                if previous.get(user_id) != status and status in RUNNING_STATUS:
                    self._started[script_id] = now
            self._status[script_id] = users

            if not self._primed:
                continue

            if self._each_user:
                for user_id, status in users.items():
                    if status in TERMINAL_STATUS and (script_id, user_id) not in self._user_announced:
                        self._user_announced.add((script_id, user_id))
                        await self._announce_user(script_id, user_id, status, now)

            if script_id in self._announced:
                continue
            if self._finished(entry, users):
                self._announced.add(script_id)
                await self._announce_script(script_id, users, now)

        if changed:
            self._last_change = now

        if not self._primed:
            self._primed = True
            # 首轮就把已经终态的标成播报过，免得下一轮重复
            for script_id, users in self._status.items():
                if users and all(status in TERMINAL_STATUS for status in users.values()):
                    self._announced.add(script_id)
                    for user_id in users:
                        self._user_announced.add((script_id, user_id))
            return

        await self._maybe_stuck(now)

    async def close(self) -> None:
        """任务结束但还有脚本没播报过（被取消、超时）时补一句。"""
        now = datetime.now()
        left = [sid for sid in self._status if sid not in self._announced]
        if not left:
            return
        rows = []
        for script_id in left:
            self._announced.add(script_id)
            users = self._status.get(script_id) or {}
            pending = [
                self._user_names.get(script_id, {}).get(user_id, user_id)
                for user_id, status in users.items()
                if status not in TERMINAL_STATUS
            ]
            name = self._names.get(script_id, script_id)
            if pending:
                rows.append(f"{name} 没跑完：{'、'.join(pending)}")
        if not rows:
            return
        await self._send(f"{self._label}结束了，但还有脚本没走完 —— " + "；".join(rows) + "。", [])

    # ---- 内部 ----

    def _finished(self, entry: dict[str, Any], users: dict[str, str]) -> bool:
        script_status = str(entry.get("status") or "")
        if script_status in TERMINAL_STATUS:
            return True
        return bool(users) and all(status in TERMINAL_STATUS for status in users.values())

    def _spent(self, script_id: str, now: datetime) -> str:
        started = self._started.get(script_id) or now
        return fmt_duration((now - started).total_seconds())

    async def _announce_user(self, script_id: str, user_id: str, status: str, now: datetime) -> None:
        name = self._names.get(script_id, script_id)
        user_name = self._user_names.get(script_id, {}).get(user_id, user_id)
        spent = self._spent(script_id, now)
        if status == "完成":
            await self._send(f"{name} / {user_name} 清完了，用时 {spent}。", [])
            return
        images: list[str] = []
        if status == "异常" and self._capture is not None:
            images = await self._shots(script_id)
        await self._send(f"{name} / {user_name} {status}，用时 {spent}。", images)

    async def _announce_script(self, script_id: str, users: dict[str, str], now: datetime) -> None:
        name = self._names.get(script_id, script_id)
        spent = self._spent(script_id, now)
        total = len(users)
        failed = [(uid, status) for uid, status in users.items() if status == "异常"]
        skipped = [uid for uid, status in users.items() if status == "跳过"]
        count = f"（{total} 个账号）" if total > 1 else ""

        if not failed:
            text = f"{name} 跑完了{count}，用时 {spent}。"
            if skipped:
                text += f" 跳过 {len(skipped)} 个。"
            await self._send(text, [])
            return

        names = self._user_names.get(script_id, {})
        detail = "、".join(f"{names.get(uid, uid)}（{status}）" for uid, status in failed[:3])
        if len(failed) > 3:
            detail += f" 等 {len(failed)} 个"
        text = (
            f"{name} 出问题了{count}：{total - len(failed)}/{total} 通过，"
            f"失败的有 {detail}，用时 {spent}。"
        )
        images: list[str] = []
        if self._capture is not None:
            images = await self._shots(script_id)
        await self._send(text, images)

    async def _shots(self, script_id: str) -> list[str]:
        if self._capture is None:
            return []
        try:
            shot = await self._capture(script_id)
        except Exception as exc:  # noqa: BLE001 - 截图失败不能影响通知
            logger.debug(f"[automas] 失败截图没取到: {exc}")
            return []
        return [shot] if shot else []

    async def _maybe_stuck(self, now: datetime) -> None:
        if self._stuck_seconds <= 0 or self._stuck_reported:
            return
        idle = (now - self._last_change).total_seconds()
        if idle < self._stuck_seconds:
            return
        rows = []
        for script_id, users in self._status.items():
            if script_id in self._announced:
                continue
            names = self._user_names.get(script_id, {})
            for user_id, status in users.items():
                if status in TERMINAL_STATUS:
                    continue
                rows.append(f"{self._names.get(script_id, script_id)} / {names.get(user_id, user_id)}（{status or '未知'}）")
        if not rows:
            return
        self._stuck_reported = True
        minutes = int(idle // 60)
        await self._send(
            f"{self._label}好像卡住了：已经 {minutes} 分钟没有任何状态变化，"
            f"停在 {'、'.join(rows[:4])}。",
            [],
        )


def guess_adb_path(manager_path: str) -> str:
    """从模拟器管理端可执行文件位置推 adb。

    MuMu 12 的 MuMuManager.exe 在 nx_main 下，adb.exe 就在同一个目录；
    雷电之类多数把 adb 放在根目录或 shell 下，依次试一遍，都找不到就返回
    第一个候选路径让 AUTO-MAS 自己报「文件未找到」。
    """
    if not manager_path:
        return ""
    folder = Path(manager_path).parent
    candidates = [
        folder / "adb.exe",
        folder.parent / "adb.exe",
        folder.parent / "shell" / "adb.exe",
        folder / "adb" / "adb.exe",
    ]
    for item in candidates:
        try:
            if item.is_file():
                return str(item)
        except OSError:
            continue
    return str(candidates[0])
