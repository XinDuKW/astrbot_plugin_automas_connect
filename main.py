"""AUTO-MAS 联动插件：QQ 指令 + Plugin Pages 面板。

指令走 AstrBot，面板走 Plugin Pages，两边共用 mas_api.MasClient。
插件只额外保存一份「QQ → AUTO-MAS 账号」绑定表（bindings.py）和排队状态（queue_runner.py），
AUTO-MAS 本身仍然是托管的唯一事实来源。
"""

from __future__ import annotations

import asyncio
from typing import Any

import astrbot.api.message_components as Comp
from astrbot.api import AstrBotConfig, logger
from astrbot.api.event import AstrMessageEvent, MessageChain, filter
from astrbot.api.star import Context, Star

from .bindings import BindingStore
from .mas_api import DEFAULT_BASE_URL, MasClient, MasError, parse_runtime_snapshot
from .notices import ScriptProgress, SubscriberStore, guess_adb_path
from .queue_runner import QueueRunner
from .timed_scheduler import TimedScheduler

PLUGIN_NAME = "astrbot_plugin_automas_connect"

USAGE = """AUTO-MAS调度台 指令：
/mas 状态 —— 正在跑的任务 + 排队情况
/mas 托管 —— 列出所有托管项
/mas 账号 <托管名> —— 列出该托管下的账号
/mas 绑定 —— 看自己绑了哪些账号
/mas 绑定 <托管名> <账号名> —— 把这个账号绑到自己名下
/mas 解绑 [托管名] —— 解绑（不填就全解）
/mas 启动 —— 跑自己绑定的全部账号
/mas 启动 <托管名> [账号名,账号名|all] —— 只跑某个托管项
/mas 排队 [独占] —— 排队跑自己的绑定；独占=不与别人交叉
/mas 取消 —— 取消自己排队中的请求
/mas 订阅 —— 订阅运行通知（每个脚本跑完/失败/卡住都发到这个会话）
/mas 取消订阅 —— 退订
/mas 停止 [任务ID] —— 停止任务，不带 ID 时停掉全部
/mas 定时 —— 看各队列的定时和代管状态
/mas 定时 接管 <队列名> —— 交给插件代管定时（到点排队、不打断）
/mas 定时 取消接管 <队列名> —— 还回 AUTO-MAS
/mas 计划 —— 列出计划表"""

MODE_LABELS = {
    "AutoProxy": "自动代理",
    "ScriptConfig": "配置脚本",
    "CycleRun": "循环运行",
    "Update": "更新",
}



class AutomasConnectPlugin(Star):
    def __init__(self, context: Context, config: AstrBotConfig):
        super().__init__(context)
        self.config = config
        self._watch_task: asyncio.Task | None = None
        self._watch_last_state: dict[str, dict[str, Any]] = {}
        self.bindings = BindingStore()
        self.notices = SubscriberStore()
        self.queue = QueueRunner(self)
        self.timed = TimedScheduler(self, self.queue)
        self._last_umo = ""

    # ---- 配置 ----

    def _cfg_str(self, key: str, default: str = "") -> str:
        value = self.config.get(key)
        return default if value is None else str(value).strip()

    def _cfg_int(self, key: str, default: int = 0) -> int:
        try:
            return int(self.config.get(key, default))
        except (TypeError, ValueError):
            return default

    def _cfg_bool(self, key: str, default: bool = False) -> bool:
        value = self.config.get(key, default)
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() in {"1", "true", "yes", "on", "是", "开启"}

    def build_client(self) -> MasClient:
        base_url = self._cfg_str("mas_base_url", DEFAULT_BASE_URL) or DEFAULT_BASE_URL
        return MasClient(base_url, self._cfg_int("request_timeout", 15))

    def queue_max_wait_seconds(self) -> int:
        return max(300, self._cfg_int("queue_task_timeout_minutes", 240) * 60)

    def queue_cross_limit(self) -> int:
        """同一个托管项一批最多合并几个人；0 表示不限。"""
        return max(0, self._cfg_int("queue_cross_limit", 3))

    # ---- 生命周期 ----

    async def initialize(self) -> None:
        info = f"AUTO-MAS 联动插件已加载，后端 {self.build_client().base_url}"
        try:
            await self.build_client().get_scripts()
        except MasError as exc:
            logger.warning(f"{info}；但连不上: {exc}")
        else:
            logger.info(info)

        try:
            from .webui import AutomasWebUIController

            register_web_api = getattr(self.context, "register_web_api", None)
            if callable(register_web_api):
                AutomasWebUIController(self, self.context)
                logger.info("AUTO-MAS 联动面板已注册")
            else:
                logger.info("当前 AstrBot 版本不支持 Plugin Pages，跳过后台面板")
        except ModuleNotFoundError as exc:
            logger.warning(f"跳过 AUTO-MAS 面板注册: {exc}")
        except Exception as exc:  # pragma: no cover - 面板注册失败不应影响主体
            logger.warning(f"AUTO-MAS 联动面板注册失败: {exc}")

        self.queue.start()
        self.timed.start()

        if self._cfg_int("auto_restart_seconds", 0) > 0:
            self._watch_task = asyncio.create_task(self._watch_tasks())

    async def terminate(self) -> None:
        if self._watch_task is not None:
            self._watch_task.cancel()
            self._watch_task = None
        await self.queue.shutdown()
        await self.timed.shutdown()

    # ---- 卡死兜底 ----

    async def _watch_tasks(self) -> None:
        """轮询运行快照，任务消失后查它的终态，失败才通知并重启。

        AUTO-MAS 自己会做失败重试（进程提前退出、日志静默超时），这里只是
        重试耗尽之后的最后一道兜底，所以默认关闭（auto_restart_seconds=0）。
        判定方式：快照里消失 → GET /api/dispatch/task/{taskId} 看 status，
        只有 status == "error" 才算失败，success / cancelled 一律忽略。
        """
        delay = self._cfg_int("auto_restart_seconds", 0)
        while True:
            try:
                await asyncio.sleep(30)
                client = self.build_client()
                current = {task["taskId"]: task for task in await client.running_tasks()}
                for task_id, info in self._watch_last_state.items():
                    if task_id in current:
                        continue
                    await self._check_finished(client, task_id, info, delay)
                self._watch_last_state = current
            except asyncio.CancelledError:
                return
            except Exception as exc:  # noqa: BLE001 - 后台任务不能因为一次失败退出
                logger.warning(f"[automas] 卡死监控轮询失败: {exc}")
                await asyncio.sleep(60)

    async def _check_finished(
        self, client: MasClient, task_id: str, info: dict[str, Any], delay: int
    ) -> None:
        try:
            status = await client.task_status(task_id)
        except MasError as exc:
            logger.warning(f"[automas] 查询任务 {task_id} 终态失败: {exc}")
            return
        if str(status.get("status") or "") != "error":
            return

        detail = str(status.get("error") or status.get("detail") or "").strip()
        logger.warning(f"[automas] 任务 {task_id} 失败: {detail}")
        await self._notify(
            f"任务 {task_id} 失败了：{detail or '没给原因'}\n{delay} 秒后自动重启"
        )
        await asyncio.sleep(delay)

        script_id = str(info.get("scriptId") or "")
        user_id = str(info.get("userId") or "")
        if not script_id:
            logger.warning(f"[automas] 任务 {task_id} 没有 scriptId，跳过重启")
            return
        try:
            new_id = await client.start_task(
                script_id, "AutoProxy", [user_id] if user_id else None
            )
            logger.info(f"[automas] 已重启 {script_id}，新任务 {new_id}")
        except MasError as exc:
            logger.warning(f"[automas] 自动重启失败: {exc}")

    def timed_umo(self) -> str:
        """定时队列的通知发哪：优先配置的 notify_umo，没配就发最近一次用指令的人。"""
        return self._cfg_str("notify_umo") or self._last_umo

    async def _notify(self, text: str) -> None:
        umo = self._cfg_str("notify_umo")
        if not umo:
            return
        await self.send_to_umo(umo, text)

    async def send_to_umo(
        self, umo: str, text: str, images: list[str] | None = None
    ) -> None:
        """发一条消息；images 是纯 base64 列表，会拼成图片段一起发。"""
        if not umo:
            return
        chain: list[Any] = [Comp.Plain(text)]
        for shot in images or []:
            if not shot:
                continue
            try:
                chain.append(Comp.Image.fromBase64(shot))
            except Exception as exc:  # noqa: BLE001 - 图片挂了正文还得发
                logger.debug(f"[automas] 图片段构造失败: {exc}")
        try:
            await self.context.send_message(umo, MessageChain(chain=chain))
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"[automas] 消息发送失败: {exc}")

    # ---- 运行通知 ----

    def notice_targets(self, primary: str = "") -> list[str]:
        """运行通知发给谁：触发的会话、配置的固定会话、所有订阅会话。"""
        targets: list[str] = []

        def add(umo: str) -> None:
            value = str(umo or "").strip()
            if value and value not in targets:
                targets.append(value)

        add(primary)
        add(self._cfg_str("notify_umo"))
        if self._cfg_bool("notify_subscribers", True):
            for umo in self.notices.umos():
                add(umo)
        return targets

    def make_progress(self, primary: str = "", label: str = "") -> ScriptProgress | None:
        """按配置造一个进度追踪器；关掉逐脚本通知就返回 None。"""
        if not self._cfg_bool("notify_progress", True):
            return None
        targets = self.notice_targets(primary)
        if not targets:
            return None

        async def send(text: str, images: list[str]) -> None:
            for umo in targets:
                await self.send_to_umo(umo, text, images)

        return ScriptProgress(
            send,
            capture=self.capture_failure,
            label=label,
            each_user=self._cfg_bool("notify_each_user", False),
            stuck_minutes=self._cfg_int("notify_stuck_minutes", 20),
        )

    async def capture_failure(self, script_id: str) -> str:
        """失败截图：按脚本绑定的模拟器槽位用 ADB 截一张，取不到就返回空串。"""
        if not self._cfg_bool("notify_screenshot", True):
            return ""
        client = self.build_client()
        try:
            cfg = await client.get_script_raw(script_id)
            emulator = cfg.get("Emulator") or {}
            emulator_id = str(emulator.get("Id") or "")
            index = str(emulator.get("Index") or "0")
            if not emulator_id:
                return ""
            status = await client.emulator_status()
            info = (status.get(emulator_id) or {}).get(index) or {}
            serial = str(info.get("adb_address") or "")
            if not serial:
                return ""
            adb_path = self._cfg_str("screenshot_adb_path")
            if not adb_path:
                emulators = await client.get_emulators()
                target = next(
                    (item for item in emulators if item.get("uid") == emulator_id), None
                )
                adb_path = guess_adb_path(str(target["path"] or "")) if target else ""
            if not adb_path:
                return ""
            return await client.screenshot_adb(adb_path, serial)
        except MasError as exc:
            logger.debug(f"[automas] 截图失败（{script_id}）: {exc}")
            return ""

    # ---- 指令 ----

    def _allowed(self, event: AstrMessageEvent) -> bool:
        if not self._cfg_bool("require_admin", True):
            return True
        try:
            return bool(event.is_admin())
        except Exception:  # pragma: no cover - 旧版本可能没有该方法
            return False

    def _is_admin(self, event: AstrMessageEvent) -> bool:
        try:
            return bool(event.is_admin())
        except Exception:  # pragma: no cover
            return False

    def _sender(self, event: AstrMessageEvent) -> tuple[str, str]:
        try:
            qq = str(event.get_sender_id() or "")
        except Exception:  # noqa: BLE001
            qq = ""
        try:
            name = str(event.get_sender_name() or "")
        except Exception:  # noqa: BLE001
            name = ""
        return qq, name

    def _resolve_script(self, scripts: list[dict[str, Any]], keyword: str) -> dict[str, Any] | None:
        keyword = keyword.strip()
        if not keyword:
            return None
        for item in scripts:
            if keyword in {item["uid"], item["name"]}:
                return item
        for item in scripts:
            if keyword in item["name"] or item["name"] in keyword:
                return item
        return None

    async def _find_queue(self, client: MasClient, keyword: str) -> dict[str, Any] | None:
        try:
            queues = await client.get_queues()
        except MasError:
            return None
        items = [
            {"uid": q["uid"], "name": str((q.get("data") or {}).get("Info", {}).get("Name") or q["uid"])}
            for q in queues
        ]
        keyword = keyword.strip()
        for item in items:
            if keyword in {item["uid"], item["name"]}:
                return item
        for item in items:
            if keyword in item["name"] or item["name"] in keyword:
                return item
        return None

    # ---- 绑定 / 排队工具 ----

    def _bound_items(self, qq: str) -> list[dict[str, str]]:
        return self.bindings.bindings_of(qq)

    async def _all_items(self, client: MasClient) -> list[dict[str, str]]:
        """全部托管项下的全部启用账号，给 /mas 启动 all 用。"""
        scripts = await client.get_scripts()
        items: list[dict[str, str]] = []
        for script in scripts:
            if not script.get("status"):
                continue
            users = await client.get_users(script["uid"])
            for user in users:
                if not user.get("status"):
                    continue
                items.append(
                    {
                        "scriptId": script["uid"],
                        "scriptName": script["name"],
                        "userId": user["uid"],
                        "userName": user["name"],
                    }
                )
        return items

    async def _script_items(
        self,
        client: MasClient,
        script: dict[str, Any],
        names: list[str],
        qq: str,
        want_all: bool,
        admin: bool,
    ) -> tuple[list[dict[str, str]], str]:
        """挑出这次要跑的账号：指定名字 > 全部（要管理员）> 自己绑定的。"""
        users = await client.get_users(script["uid"])
        if names:
            picked = []
            for name in names:
                matched = next(
                    (user for user in users if name in {user["name"], user["uid"]}),
                    None,
                )
                if matched is None:
                    return [], f"没找到账号「{name}」。"
                owner = self.bindings.owner_of(script["uid"], matched["uid"])
                if owner and owner != qq and not admin:
                    return [], f"账号「{name}」是 {owner} 的，你跑不了。"
                picked.append(matched)
        elif want_all:
            picked = [user for user in users if user.get("status")]
        else:
            mine = {
                row["userId"]
                for row in self.bindings.bindings_of(qq)
                if row["scriptId"] == script["uid"]
            }
            picked = [user for user in users if user["uid"] in mine and user.get("status")]
            if not picked:
                return [], (
                    f"你还没绑定 {script['name']} 下的账号，先 /mas 绑定 {script['name']} <账号名>；"
                    f"要一次跑全部可以 /mas 启动 {script['name']} all（管理员）。"
                )
        items = [
            {
                "scriptId": script["uid"],
                "scriptName": script["name"],
                "userId": user["uid"],
                "userName": user["name"],
            }
            for user in picked
            if user.get("status")
        ]
        if not items:
            return [], f"{script['name']} 下没有可跑的账号（都被停用了）。"
        return items, ""

    def _queue_reply(self, job) -> str:
        running = len(self.queue.snapshot()["running"])
        ahead = self.queue.waiting_count() - 1
        names = "、".join(
            f"{item['scriptName']}/{item['userName']}" for item in job.items[:6]
        )
        if len(job.items) > 6:
            names += f" 等 {len(job.items)} 个账号"
        if ahead > 0:
            return f"已排队（第 {ahead + 1} 位，{job.id}）：{names}\n前面还有 {ahead} 个请求，轮到你会说一声。"
        if running:
            return f"已排队（{job.id}）：{names}\n现在机器在跑别的任务，跑完就轮到你。"
        return f"开始执行（{job.id}）：{names}"

    @filter.command("mas", alias={"automas", "自动化托管"})
    async def mas_command(self, event: AstrMessageEvent):
        """AUTO-MAS 指令入口。"""
        tokens = event.message_str.strip().split()[1:]
        sub = tokens[0] if tokens else ""
        args = tokens[1:]

        features = self.config.get("features")
        if isinstance(features, dict) and features.get("qq_command") is False:
            yield event.plain_result("QQ 指令被插件配置关掉了。")
            return

        # 订阅是所有人都能用的，放在权限检查前面
        if sub in {"订阅", "subscribe"}:
            umo = getattr(event, "unified_msg_origin", "") or ""
            qq, display = self._sender(event)
            if args and args[0] in {"列表", "list"}:
                if not self._is_admin(event):
                    yield event.plain_result("看订阅列表要管理员权限。")
                    return
                rows = self.notices.items()
                if not rows:
                    yield event.plain_result("还没有人订阅运行通知。")
                    return
                lines = [f"共 {len(rows)} 个会话订阅了运行通知："]
                for index, row in enumerate(rows, 1):
                    who = str(row.get("display") or "") or str(row.get("qq") or "")
                    lines.append(f"{index}. {who or '未知'} · {row.get('umo') or ''}")
                yield event.plain_result("\n".join(lines))
                return
            if not umo:
                yield event.plain_result("这里拿不到会话标识，订阅失败。")
                return
            fresh = self.notices.subscribe(umo, qq, display)
            if fresh:
                yield event.plain_result("订阅好了，之后每个脚本跑完、失败、卡住都会发到这个会话。")
            else:
                yield event.plain_result("这个会话已经订阅过了。")
            return

        if sub in {"取消订阅", "退订", "unsubscribe"}:
            umo = getattr(event, "unified_msg_origin", "") or ""
            if self.notices.unsubscribe(umo):
                yield event.plain_result("已经退订了，不再收运行通知。")
            else:
                yield event.plain_result("这个会话本来就没订阅。")
            return

        if not self._allowed(event):
            yield event.plain_result("这个只有管理员能用。")
            return

        if sub in {"", "帮助", "help", "?"}:
            yield event.plain_result(USAGE)
            return

        qq, display = self._sender(event)
        umo = getattr(event, "unified_msg_origin", "") or ""
        if umo:
            self._last_umo = umo
        admin = self._is_admin(event)
        client = self.build_client()

        if sub in {"状态", "status"}:
            try:
                running = await client.running_tasks()
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            snap = self.queue.snapshot()
            lines: list[str] = []
            if running:
                lines.append(f"AUTO-MAS 正在跑 {len(running)} 个任务：")
                for task in running:
                    mode = MODE_LABELS.get(task["mode"], task["mode"] or "未知")
                    lines.append(f"· {task['taskId'][:8]} [{mode}]")
            else:
                lines.append("AUTO-MAS 现在没任务在跑。")
            if snap["running"]:
                lines.append(
                    "排队执行中：" + "、".join(job["display"] for job in snap["running"])
                )
            if snap["waiting"]:
                lines.append(
                    "排队等待：" + "、".join(f"{job['display']}({job['id']})" for job in snap["waiting"])
                )
            yield event.plain_result("\n".join(lines))
            return

        if sub in {"托管", "脚本", "list"}:
            try:
                scripts = await client.get_scripts()
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            if not scripts:
                yield event.plain_result("AUTO-MAS 里还没有任何托管项。")
                return
            lines = [f"共 {len(scripts)} 个托管项："]
            for index, item in enumerate(scripts, 1):
                mark = "" if item["status"] else "（已停用）"
                lines.append(f"{index}. {item['name']} · {item['typeLabel']}{mark}")
            yield event.plain_result("\n".join(lines))
            return

        if sub in {"账号", "users"}:
            if not args:
                yield event.plain_result("用法：/mas 账号 <托管名>")
                return
            try:
                scripts = await client.get_scripts()
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            target = self._resolve_script(scripts, args[0])
            if target is None:
                yield event.plain_result(f"没找到托管项「{args[0]}」。")
                return
            try:
                users = await client.get_users(target["uid"])
            except MasError as exc:
                yield event.plain_result(f"读取账号失败：{exc}")
                return
            if not users:
                yield event.plain_result(f"{target['name']} 下面还没有账号。")
                return
            lines = [f"{target['name']} 共 {len(users)} 个账号："]
            for index, user in enumerate(users, 1):
                owner = self.bindings.owner_of(target["uid"], user["uid"])
                tags = []
                if not user["status"]:
                    tags.append("已停用")
                if owner:
                    tags.append(f"绑给 {owner}")
                suffix = f"（{'，'.join(tags)}）" if tags else ""
                lines.append(f"{index}. {user['name']}{suffix}")
            yield event.plain_result("\n".join(lines))
            return

        if sub in {"绑定", "bind"}:
            # /mas 绑定                      → 看自己
            # /mas 绑定 <QQ>                 → 管理员看别人
            # /mas 绑定 <托管名> <账号名>     → 绑定
            if not args:
                rows = self._bound_items(qq)
                if not rows:
                    yield event.plain_result("你还没绑定任何账号。用 /mas 绑定 <托管名> <账号名> 绑一个。")
                    return
                lines = [f"你绑了 {len(rows)} 个账号："]
                lines.extend(f"· {row['scriptName']} / {row['userName']}" for row in rows)
                yield event.plain_result("\n".join(lines))
                return
            if len(args) == 1:
                if not admin:
                    yield event.plain_result("看别人的绑定要管理员权限。")
                    return
                rows = self._bound_items(args[0])
                if not rows:
                    yield event.plain_result(f"{args[0]} 没有绑定。")
                    return
                lines = [f"{args[0]} 绑了 {len(rows)} 个账号："]
                lines.extend(f"· {row['scriptName']} / {row['userName']}" for row in rows)
                yield event.plain_result("\n".join(lines))
                return
            if len(args) < 2:
                yield event.plain_result("用法：/mas 绑定 <托管名> <账号名>")
                return
            try:
                scripts = await client.get_scripts()
                target = self._resolve_script(scripts, args[0])
                if target is None:
                    yield event.plain_result(f"没找到托管项「{args[0]}」。")
                    return
                users = await client.get_users(target["uid"])
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            user = next(
                (item for item in users if args[1] in {item["name"], item["uid"]}),
                None,
            )
            if user is None:
                names = "、".join(item["name"] for item in users) or "（这个托管项下没有账号）"
                yield event.plain_result(f"没找到账号「{args[1]}」。现有：{names}")
                return
            owner = self.bindings.owner_of(target["uid"], user["uid"])
            if owner and owner != qq:
                yield event.plain_result(f"这个账号已经绑给 {owner} 了，要抢请让管理员处理。")
                return
            self.bindings.set_binding(
                qq, display, target["uid"], target["name"], user["uid"], user["name"]
            )
            yield event.plain_result(
                f"绑好了：{target['name']} / {user['name']}。以后 /mas 启动 就会跑它。"
            )
            return

        if sub in {"解绑", "unbind"}:
            keyword = args[0] if args else ""
            if not keyword:
                removed = self.bindings.remove_binding(qq)
                yield event.plain_result(f"已解绑全部 {removed} 个账号。" if removed else "你本来也没绑定。")
                return
            try:
                scripts = await client.get_scripts()
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            target = self._resolve_script(scripts, keyword)
            if target is None:
                yield event.plain_result(f"没找到托管项「{keyword}」。")
                return
            removed = self.bindings.remove_binding(qq, target["uid"])
            yield event.plain_result(
                f"已解绑 {target['name']}。" if removed else f"你没绑过 {target['name']}。"
            )
            return

        if sub in {"启动", "start", "运行"}:
            exclusive = any(arg in {"独占", "不交叉"} for arg in args)
            args = [arg for arg in args if arg not in {"独占", "不交叉"}]
            try:
                if not args:
                    items = self._bound_items(qq)
                    if not items:
                        yield event.plain_result(
                            "你还没绑定账号。用 /mas 绑定 <托管名> <账号名> 先绑，或用 /mas 启动 all 跑全部（管理员）。"
                        )
                        return
                else:
                    scripts = await client.get_scripts()
                    if args[0].lower() == "all":
                        if not admin:
                            yield event.plain_result("跑全部账号要管理员权限。")
                            return
                        items = await self._all_items(client)
                        if not items:
                            yield event.plain_result("没有可跑的账号。")
                            return
                    else:
                        target = self._resolve_script(scripts, args[0])
                        if target is None:
                            yield event.plain_result(f"没找到托管项「{args[0]}」。")
                            return
                        names = [part for part in args[1].replace("，", ",").split(",") if part]
                        want_all = bool(names) and names[0].lower() == "all"
                        if want_all:
                            if not admin:
                                yield event.plain_result("跑该托管项全部账号要管理员权限。")
                                return
                            names = []
                        picked, problem = await self._script_items(
                            client, target, names, qq, want_all, admin
                        )
                        if problem:
                            yield event.plain_result(problem)
                            return
                        items = picked
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            job = self.queue.enqueue(qq, display, umo, items, exclusive)
            yield event.plain_result(self._queue_reply(job))
            return

        if sub in {"排队", "queue"}:
            exclusive = not args or any(arg in {"独占", "不交叉"} for arg in args)
            if args and args[0] in {"交叉", "合并"}:
                exclusive = False
            items = self._bound_items(qq)
            if not items:
                yield event.plain_result("你还没绑定账号，排不了队。")
                return
            job = self.queue.enqueue(qq, display, umo, items, exclusive)
            extra = "（独占，不与他人交叉）" if exclusive else "（可与他人交叉合并）"
            yield event.plain_result(self._queue_reply(job) + "\n" + extra)
            return

        if sub in {"取消", "cancel"}:
            removed = self.queue.cancel(qq if not admin else "")
            if not removed:
                yield event.plain_result("你没有排队中的请求。")
                return
            yield event.plain_result(f"已取消 {len(removed)} 个请求。")
            return

        if sub in {"停止", "stop"}:
            try:
                if args:
                    await client.stop_task(args[0])
                    yield event.plain_result(f"已请求停止 {args[0]}。")
                    return
                running = await client.running_tasks()
                if not running:
                    yield event.plain_result("现在没任务在跑。")
                    return
                for task in running:
                    await client.stop_task(task["taskId"])
                yield event.plain_result(f"已停止 {len(running)} 个任务。")
            except MasError as exc:
                yield event.plain_result(f"停止失败：{exc}")
            return

        if sub in {"定时", "timed", "schedule"}:
            # /mas 定时                → 看各队列的定时和接管状态
            # /mas 定时 接管 <队列>     → 交给插件代管（关掉 MAS 自己的定时）
            # /mas 定时 取消接管 <队列> → 还给 AUTO-MAS
            mode_key = args[0] if args else ""
            if mode_key in {"接管", "on", "开"} and len(args) >= 2:
                target = await self._find_queue(client, args[1])
                if target is None:
                    yield event.plain_result(f"没找到队列「{args[1]}」。")
                    return
                try:
                    await self.timed.set_takeover(target["uid"], True)
                except MasError as exc:
                    yield event.plain_result(f"接管失败：{exc}")
                    return
                yield event.plain_result(
                    f"「{target['name']}」的定时改由插件代管。\n"
                    "到点不打断正在跑的那批，等它跑完再顺着跑；跑之前会把上一批的实际用时发出来。"
                )
                return
            if mode_key in {"取消接管", "off", "关"} and len(args) >= 2:
                target = await self._find_queue(client, args[1])
                if target is None:
                    yield event.plain_result(f"没找到队列「{args[1]}」。")
                    return
                try:
                    await self.timed.set_takeover(target["uid"], False)
                except MasError as exc:
                    yield event.plain_result(f"取消接管失败：{exc}")
                    return
                yield event.plain_result(f"「{target['name']}」的定时交回 AUTO-MAS 自己管了。")
                return
            try:
                snap = await self.timed.snapshot()
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            lines = []
            for queue in snap["queues"]:
                mark = "插件代管" if queue["takeover"] else ("MAS 自己管" if queue["timeEnabled"] else "定时关着")
                slots = "、".join(
                    f"{slot['time']}{'（关）' if not slot['enabled'] else ''}" for slot in queue["slots"]
                )
                lines.append(f"· {queue['name']}（{mark}）：{slots or '没有定时槽'}")
            runs = snap.get("runs") or []
            if runs:
                lines.append("最近一次：" + runs[0].get("queueName", "") + f" {runs[0].get('planned', '')} → {runs[0].get('finished', '')}")
            lines.append("接管：/mas 定时 接管 <队列名>；恢复：/mas 定时 取消接管 <队列名>")
            yield event.plain_result("\n".join(lines))
            return

        if sub in {"计划", "plan"}:
            try:
                plans = await client.get_plans()
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            if not plans:
                yield event.plain_result("还没有计划表。")
                return
            lines = [f"共 {len(plans)} 个计划表："]
            lines.extend(f"· {item['uid']} ({item['type']})" for item in plans)
            yield event.plain_result("\n".join(lines))
            return

        yield event.plain_result(f"不认识的子指令「{sub}」。\n{USAGE}")