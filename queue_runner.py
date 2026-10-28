"""多人排队调度。

一台 AUTO-MAS 只有一套模拟器，切账号要重新登游戏，所以同一时刻只能跑一个任务。
这个模块把多个人的请求排成一条队，按脚本流水线走：

* 队首请求开跑后，同一个脚本上的其他人可以「边跑边插队」：a2a3 跑着的时候
  新来的 U4 会在 b 阶段被吸收进 b2b3b4，d 阶段再吸收 d2d4。
* 赶不上的脚本（比如 U4 的 a4，a 阶段已经过去了）不会丢，剩下的进 pending，
  这批结束后自动排回队首，下一轮开头补上。
* 请求带 exclusive 时独占整批：把它自己的脚本全跑完，中间不插别人。
* 同一个托管项一批里最多合并多少人由 queue_cross_limit 决定（0 表示不限）。
* AUTO-MAS 侧如果已经有别人手动开的任务在跑，就等它结束再上。
* 定时队列（timed_scheduler 到点塞进来的 TimedJob）单独占一整批：整条队列一个
  AUTO-MAS 任务，不跟别人的账号混合，也不会打断正在跑的那批 —— 排在它后面等。
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from typing import Any

from astrbot.api import logger

from .mas_api import MasClient, MasError

MODE_LABEL = "自动代理"
# AUTO-MAS 的 mode 字面量（定时队列整条跑，用 AutoProxy）
MODE_LABEL_MODE = "AutoProxy"

# 一批最多合并多少个请求（人），防止队列一次吞太多
MAX_MERGE = 8


def _script_counts(jobs: list["QueueJob"]) -> dict[str, int]:
    """数一数这批里每个托管项已经被几个人占了。"""
    counts: dict[str, int] = {}
    for job in jobs:
        for item in job.items:
            script_id = item["scriptId"]
            counts[script_id] = counts.get(script_id, 0) + 1
    return counts


def _merge_counts(counts: dict[str, int], job: "QueueJob") -> None:
    for item in job.items:
        script_id = item["scriptId"]
        counts[script_id] = counts.get(script_id, 0) + 1


def _would_exceed(counts: dict[str, int], job: "QueueJob", limit: int) -> bool:
    """把这个请求并进来会不会让某个游戏超员。"""
    seen: set[str] = set()
    for item in job.items:
        script_id = item["scriptId"]
        if script_id in seen:
            continue
        seen.add(script_id)
        if counts.get(script_id, 0) + 1 > limit:
            return True
    return False


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


class QueueJob:
    """一个人的一次排队请求。"""

    def __init__(
        self,
        qq: str,
        display: str,
        umo: str,
        items: list[dict[str, str]],
        exclusive: bool = False,
    ):
        self.id = uuid.uuid4().hex[:8]
        self.qq = qq
        self.display = display or qq
        self.umo = umo
        self.items = items
        # pending = 这次请求还没跑的账号（跑掉一个脚本就删掉对应条目）
        self.pending: list[dict[str, str]] = list(items)
        self.exclusive = bool(exclusive)
        self.created = _now()
        self.state = "waiting"  # waiting / running / done / error / cancelled
        self.detail = ""
        self.results: list[dict[str, str]] = []
        self.round = 0

    def describe(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "kind": "queue",
            "qq": self.qq,
            "display": self.display,
            "state": self.state,
            "detail": self.detail,
            "exclusive": self.exclusive,
            "created": self.created,
            "round": self.round,
            "items": self.items,
            "pending": self.pending,
            "results": self.results,
        }


class TimedJob:
    """一条定时队列任务：时间到了，整条队列排在这里等着轮到它。"""

    def __init__(self, queue_id: str, queue_name: str, planned: datetime, umo: str = ""):
        self.id = uuid.uuid4().hex[:8]
        self.kind = "timed"
        self.queue_id = queue_id
        self.queue_name = queue_name or queue_id
        self.planned = planned
        self.umo = umo
        self.created = _now()
        self.state = "waiting"
        self.detail = ""
        self.started: datetime | None = None
        self.finished: datetime | None = None
        self.results: list[dict[str, str]] = []

    def describe(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "kind": "timed",
            "qq": "",
            "display": self.queue_name,
            "state": self.state,
            "detail": self.detail,
            "exclusive": True,
            "created": self.created,
            "round": 0,
            "items": [],
            "pending": [],
            "results": self.results,
            "queueId": self.queue_id,
            "planned": self.planned.strftime("%Y-%m-%d %H:%M") if self.planned else "",
            "started": self.started.strftime("%Y-%m-%d %H:%M") if self.started else "",
            "finished": self.finished.strftime("%Y-%m-%d %H:%M") if self.finished else "",
        }


def _fmt_duration(seconds: float) -> str:
    total = int(max(0, seconds))
    hours, rest = divmod(total, 3600)
    minutes, _ = divmod(rest, 60)
    if hours and minutes:
        return f"{hours} 小时 {minutes} 分"
    if hours:
        return f"{hours} 小时"
    return f"{minutes} 分钟"


class QueueRunner:
    """串行执行排队请求，同一时刻只跑一批。"""

    def __init__(self, plugin):
        self._plugin = plugin
        self._jobs: list[QueueJob] = []
        self._current: list[QueueJob] = []
        self._wake = asyncio.Event()
        self._worker: asyncio.Task | None = None
        self._stopping = False
        self._poll_seconds = 10

    # ---- 生命周期 ----

    def start(self) -> None:
        if self._worker is None or self._worker.done():
            self._stopping = False
            self._worker = asyncio.create_task(self._loop())

    async def shutdown(self) -> None:
        self._stopping = True
        self._wake.set()
        if self._worker is not None:
            self._worker.cancel()
            self._worker = None

    # ---- 对外接口 ----

    def snapshot(self) -> dict[str, Any]:
        return {
            "running": [job.describe() for job in self._current],
            "waiting": [job.describe() for job in self._jobs],
        }

    def waiting_count(self) -> int:
        return len(self._jobs)

    def is_busy(self) -> bool:
        return bool(self._current) or bool(self._jobs)

    def enqueue(
        self,
        qq: str,
        display: str,
        umo: str,
        items: list[dict[str, str]],
        exclusive: bool = False,
    ) -> QueueJob:
        job = QueueJob(qq, display, umo, items, exclusive)
        self._jobs.append(job)
        self._wake.set()
        return job

    def enqueue_timed(
        self, queue_id: str, queue_name: str, planned: datetime, umo: str = ""
    ) -> TimedJob:
        """定时到点：整条队列排到队尾，前面那批跑完它才开始。"""
        job = TimedJob(queue_id, queue_name, planned, umo)
        self._jobs.append(job)
        self._wake.set()
        return job

    def cancel(self, qq: str = "") -> list[QueueJob]:
        """取消排队中的请求；传 qq 只取消这个人的。运行中的会请求停止当前任务。"""
        removed = []
        keep = []
        for job in self._jobs:
            if not qq or job.qq == qq:
                job.state = "cancelled"
                removed.append(job)
            else:
                keep.append(job)
        self._jobs = keep
        for job in self._current:
            if not qq or job.qq == qq:
                job.state = "cancelled"
                removed.append(job)
        if removed and self._current:
            asyncio.create_task(self._stop_current())
        return removed

    def jobs_of(self, qq: str) -> list[QueueJob]:
        return [job for job in self._jobs + self._current if job.qq == qq]

    # ---- 主循环 ----

    async def _loop(self) -> None:
        while not self._stopping:
            if not self._jobs:
                self._wake.clear()
                try:
                    await asyncio.wait_for(self._wake.wait(), timeout=60)
                except asyncio.TimeoutError:
                    pass
                continue
            batch = self._take_batch()
            self._current = batch
            try:
                await self._run_batch(batch)
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001 - 一批出错不能拖垮整个队列
                logger.warning(f"[automas] 排队批次执行失败: {exc}")
                for job in batch:
                    if job.state == "running":
                        job.state = "error"
                        job.detail = str(exc)
                        await self._finish(job)
            finally:
                self._current = []

    def _take_batch(self) -> list[QueueJob]:
        """从队首连续取请求合并成一批。

        两个上限：一批最多 MAX_MERGE 个请求；同一个托管项（游戏）一批里最多
        合并多少个人由 queue_cross_limit 决定（0 表示不限）。撞到上限就停手，
        剩下的等下一批 —— 免得一个游戏一次切太多账号，出问题也难定位。
        """
        limit = self._plugin.queue_cross_limit()
        first = self._jobs.pop(0)
        if isinstance(first, TimedJob):
            # 定时队列一次就是整条队列一个 AUTO-MAS 任务，独占整批
            return [first]
        first.round += 1
        batch = [first]
        if first.exclusive:
            return batch
        counts = _script_counts(batch)
        while self._jobs:
            nxt = self._jobs[0]
            if isinstance(nxt, TimedJob) or nxt.exclusive:
                break
            if len(batch) >= MAX_MERGE:
                break
            if limit > 0 and _would_exceed(counts, nxt, limit):
                break
            self._jobs.pop(0)
            nxt.round += 1
            batch.append(nxt)
            _merge_counts(counts, nxt)
        return batch

    async def _run_batch(self, batch: list[QueueJob]) -> None:
        if len(batch) == 1 and isinstance(batch[0], TimedJob):
            await self._run_timed(batch[0])
            return
        for job in batch:
            job.state = "running"

        order: list[str] = []
        names: dict[str, str] = {}
        for job in batch:
            for item in job.items:
                script_id = item["scriptId"]
                names[script_id] = item.get("scriptName") or script_id
                if script_id not in order:
                    order.append(script_id)

        done: set[str] = set()
        index = 0
        while index < len(order):
            script_id = order[index]
            index += 1
            if script_id in done:
                continue
            if all(job.state == "cancelled" for job in batch):
                break
            self._absorb(script_id, batch, order, names)
            entries = self._entries_for(batch, script_id)
            done.add(script_id)
            if not entries:
                continue
            outcome = await self._run_script(script_id, names.get(script_id, script_id), entries)
            for job, item in entries:
                job.results.append(
                    {
                        "scriptId": script_id,
                        "scriptName": names.get(script_id, script_id),
                        "userName": item.get("userName") or item.get("userId", ""),
                        "status": outcome["status"],
                        "detail": outcome["detail"],
                    }
                )
                if item in job.pending:
                    job.pending.remove(item)

        await self._settle(batch, names)

    def _absorb(
        self,
        script_id: str,
        batch: list[QueueJob],
        order: list[str],
        names: dict[str, str],
    ) -> None:
        """把等着跑这个脚本的人吸收进当前批（边跑边插队）。"""
        limit = self._plugin.queue_cross_limit()
        position = 0
        while position < len(self._jobs):
            if limit > 0 and self._headcount(batch, script_id) >= limit:
                return
            job = self._jobs[position]
            if job.state == "cancelled" or job.exclusive:
                position += 1
                continue
            if not _has_script(job.pending, script_id):
                position += 1
                continue
            self._jobs.pop(position)
            job.state = "running"
            job.round = max(1, job.round + 1)
            batch.append(job)
            for extra in job.pending:
                sid = extra["scriptId"]
                names.setdefault(sid, extra.get("scriptName") or sid)
                if sid not in order:
                    order.append(sid)
            logger.info(
                f"[automas] {job.display} 插进当前批，跟着跑 {names.get(script_id, script_id)}"
            )

    def _entries_for(
        self, batch: list[QueueJob], script_id: str
    ) -> list[tuple[QueueJob, dict[str, str]]]:
        entries: list[tuple[QueueJob, dict[str, str]]] = []
        seen: set[str] = set()
        for job in batch:
            if job.state == "cancelled":
                continue
            for item in job.pending:
                if item["scriptId"] != script_id:
                    continue
                user_id = item.get("userId") or ""
                if not user_id or user_id in seen:
                    continue
                seen.add(user_id)
                entries.append((job, item))
        return entries

    def _headcount(self, batch: list[QueueJob], script_id: str) -> int:
        return len(self._entries_for(batch, script_id))

    async def _settle(self, batch: list[QueueJob], names: dict[str, str]) -> None:
        """一批跑完：走干净的收尾通知，没跑完的排回队首下一轮补。"""
        pending_jobs: list[QueueJob] = []
        for job in batch:
            if job.state == "cancelled":
                continue
            if job.pending:
                pending_jobs.append(job)
                continue
            job.state = "done"
            failed = [row for row in job.results if row["status"] != "success"]
            job.detail = (
                f"{len(job.results) - len(failed)}/{len(job.results)} 成功"
                if job.results
                else "没有可跑的账号"
            )
            if failed:
                job.detail += "，" + "；".join(
                    f"{row['scriptName']} {row['userName']} {row['detail'] or '失败'}"
                    for row in failed[:3]
                )
            await self._finish(job)

        for job in pending_jobs:
            if job.state == "cancelled":
                continue
            job.state = "waiting"
            left = "、".join(
                f"{row.get('scriptName') or row['scriptId']} / {row.get('userName') or row['userId']}"
                for row in job.pending
            )
            job.detail = f"赶不上这轮，剩下的下一轮补：{left}"
            self._jobs.insert(0, job)
            self._wake.set()
            await self._notify_partial(job, left)

    async def _run_script(
        self, script_id: str, script_name: str, entries: list[tuple[QueueJob, dict[str, str]]]
    ) -> dict[str, str]:
        """跑一个托管项下的若干账号：先等机器空闲，再启动，再等它结束。"""
        client = self._plugin.build_client()
        user_ids = [item.get("userId") or "" for _, item in entries]
        try:
            await self._wait_idle(client)
            task_id = await client.start_task(script_id, MODE_LABEL, user_ids)
        except MasError as exc:
            return {"status": "error", "detail": f"启动失败：{exc}"}
        if not task_id:
            return {"status": "error", "detail": "启动失败：没拿到任务 ID"}
        logger.info(
            f"[automas] 排队执行 {script_name}（{len(user_ids)} 个账号），任务 {task_id}"
        )
        progress = self._plugin.make_progress(_entries_umo(entries), script_name)
        try:
            return await self._wait_task(client, task_id, progress)
        finally:
            if progress is not None:
                await progress.close()

    async def _run_timed(self, job: TimedJob) -> None:
        """跑到点的定时队列：先播报上一批用时，再整条队列启动，等它结束。"""
        job.state = "running"
        job.started = datetime.now()
        job.detail = f"{job.planned:%H:%M} 的定时，{job.started:%H:%M} 开始"
        scheduler = getattr(self._plugin, "timed", None)
        if scheduler is not None:
            try:
                previous = scheduler.previous_report(
                    job.queue_id, job.planned.strftime("%Y-%m-%d %H:%M")
                )
            except Exception:  # noqa: BLE001 - 播报失败不影响执行
                previous = ""
            if previous:
                late = int((job.started - job.planned).total_seconds() // 60)
                tail = (
                    f"现在开始 {job.planned:%H:%M} 这批。"
                    if late <= 0
                    else f"现在开始 {job.planned:%H:%M} 这批（比计划晚了 {late} 分钟）。"
                )
                await self._send(job, previous + tail)
        logger.info(f"[automas] 定时队列 {job.queue_name} 开始（{job.planned:%H:%M} 的定时）")
        client = self._plugin.build_client()
        outcome: dict[str, str]
        try:
            await self._wait_idle(client)
            task_id = await client.start_task(job.queue_id, MODE_LABEL_MODE)
        except MasError as exc:
            outcome = {"status": "error", "detail": f"启动失败：{exc}"}
            task_id = ""
        if task_id:
            progress = self._plugin.make_progress(job.umo, job.queue_name)
            try:
                outcome = await self._wait_task(client, task_id, progress)
            finally:
                if progress is not None:
                    await progress.close()
        job.finished = datetime.now()
        if outcome.get("status") == "success":
            job.state = "done"
            job.detail = ""
        else:
            job.state = "error"
            job.detail = outcome.get("detail") or outcome.get("status") or "未成功"
        job.results.append(
            {
                "scriptId": job.queue_id,
                "scriptName": job.queue_name,
                "userName": "",
                "status": outcome.get("status") or "unknown",
                "detail": job.detail,
            }
        )
        spent = (job.finished - job.started).total_seconds()
        record = {
            "queueId": job.queue_id,
            "queueName": job.queue_name,
            "planned": job.planned.strftime("%Y-%m-%d %H:%M"),
            "started": job.started.strftime("%Y-%m-%d %H:%M"),
            "finished": job.finished.strftime("%Y-%m-%d %H:%M"),
            "seconds": int(spent),
            "status": outcome.get("status") or "unknown",
            "detail": job.detail,
        }
        if scheduler is not None:
            try:
                scheduler.record_run(record)
            except Exception as exc:  # noqa: BLE001
                logger.warning(f"[automas] 定时执行记录写入失败: {exc}")
        lines = [
            f"{job.queue_name} 这批定时（{job.planned:%H:%M}）"
            + (
                f"跑完了：{job.started:%H:%M} → {job.finished:%H:%M}，"
                if job.state == "done"
                else f"没跑成（{job.detail}）：{job.started:%H:%M} → {job.finished:%H:%M}，"
            )
            + f"用时 {_fmt_duration(spent)}。"
        ]
        await self._send(job, "".join(lines))
        logger.info(f"[automas] 定时队列 {job.queue_name} 结束：{job.state} {job.detail}")
    async def _wait_idle(self, client: MasClient) -> None:
        """等 AUTO-MAS 空闲：别人手动开的任务也要等。"""
        deadline = asyncio.get_running_loop().time() + 3600
        while True:
            try:
                running = await client.running_tasks()
            except MasError:
                return
            if not running:
                return
            if asyncio.get_running_loop().time() > deadline:
                raise MasError("等了 1 小时 AUTO-MAS 还在跑别的任务")
            await asyncio.sleep(self._poll_seconds)

    async def _wait_task(
        self, client: MasClient, task_id: str, progress=None
    ) -> dict[str, str]:
        """等任务结束；progress 非空时每轮顺手汇报一次逐脚本进度。"""
        limit_seconds = max(60, self._plugin.queue_max_wait_seconds())
        waited = 0
        while waited < limit_seconds:
            await asyncio.sleep(self._poll_seconds)
            waited += self._poll_seconds
            if progress is not None:
                try:
                    await progress.poll(client, task_id)
                except Exception as exc:  # noqa: BLE001 - 进度失败不能影响执行
                    logger.debug(f"[automas] 进度刷新失败: {exc}")
            try:
                status = await client.task_status(task_id)
            except MasError:
                return {"status": "unknown", "detail": "查不到任务状态（可能已被清掉）"}
            state = str(status.get("status") or "")
            if state and state != "running":
                if state == "success":
                    return {"status": "success", "detail": ""}
                detail = str(status.get("error") or status.get("detail") or "").strip()
                return {"status": state or "error", "detail": detail or "未成功"}
        return {"status": "timeout", "detail": "等太久了，可能卡住"}

    async def _stop_current(self) -> None:
        client = self._plugin.build_client()
        try:
            running = await client.running_tasks()
        except MasError as exc:
            logger.warning(f"[automas] 取运行快照失败，取消不了: {exc}")
            return
        for task in running:
            try:
                await client.stop_task(task["taskId"])
            except MasError as exc:
                logger.warning(f"[automas] 停止任务 {task['taskId']} 失败: {exc}")

    async def _finish(self, job: QueueJob) -> None:
        logger.info(f"[automas] 排队请求 {job.id} 结束：{job.state} {job.detail}")
        text = self._report(job)
        if not text:
            return
        await self._send(job, text)

    async def _notify_partial(self, job: QueueJob, left: str) -> None:
        lines = [f"{job.display}：这轮先跑了这些 ——"]
        for row in job.results:
            mark = "成功" if row["status"] == "success" else f"失败·{row['detail'] or row['status']}"
            lines.append(f"· {row['scriptName']} / {row['userName']} —— {mark}")
        lines.append(f"没赶上的排在下一轮开头：{left}")
        await self._send(job, "\n".join(lines))

    async def _send(self, job: QueueJob, text: str) -> None:
        try:
            await self._plugin.send_to_umo(job.umo, text)
        except Exception as exc:  # noqa: BLE001 - 通知失败不影响队列
            logger.warning(f"[automas] 排队结果通知失败: {exc}")

    def _report(self, job: QueueJob) -> str:
        if job.state == "cancelled":
            return f"排队任务已取消（{job.display}）。"
        if job.state == "error":
            return f"排队任务出错（{job.display}）：{job.detail}"
        if not job.results:
            return f"排队任务跑完了（{job.display}），但没有账号可跑。"
        lines = [f"排队任务跑完了（{job.display}）："]
        for row in job.results:
            mark = "成功" if row["status"] == "success" else f"失败·{row['detail'] or row['status']}"
            lines.append(f"· {row['scriptName']} / {row['userName']} —— {mark}")
        return "\n".join(lines)


def _entries_umo(entries) -> str:
    """这批账号里第一个可用来回复的会话标识。"""
    for job, _ in entries:
        umo = getattr(job, "umo", "") or ""
        if umo:
            return str(umo)
    return ""


def _has_script(items: list[dict[str, str]], script_id: str) -> bool:
    return any(item["scriptId"] == script_id for item in items)
