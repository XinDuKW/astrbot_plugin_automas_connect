"""AUTO-MAS 联动插件：QQ 指令 + Plugin Pages 面板。

指令走 AstrBot，面板走 Plugin Pages，两边共用 mas_api.MasClient。
插件本身不保存任何状态，AUTO-MAS 才是唯一事实来源。
"""

from __future__ import annotations

import asyncio
from typing import Any

import astrbot.api.message_components as Comp
from astrbot.api import AstrBotConfig, logger
from astrbot.api.event import AstrMessageEvent, MessageChain, filter
from astrbot.api.star import Context, Star

from .mas_api import DEFAULT_BASE_URL, MasClient, MasError, parse_runtime_snapshot

PLUGIN_NAME = "astrbot_plugin_automas_connect"

USAGE = """AUTO-MAS调度台 指令：
/mas 状态 —— 查看正在跑的任务
/mas 托管 —— 列出所有脚本托管项
/mas 账号 <托管名> —— 列出该托管下的账号
/mas 启动 <托管名> [账号名,账号名] —— 启动托管（不带账号=全部）
/mas 停止 [任务ID] —— 停止任务，不带 ID 时停掉全部
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

        if self._cfg_int("auto_restart_seconds", 0) > 0:
            self._watch_task = asyncio.create_task(self._watch_tasks())

    async def terminate(self) -> None:
        if self._watch_task is not None:
            self._watch_task.cancel()
            self._watch_task = None

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

    async def _notify(self, text: str) -> None:
        umo = self._cfg_str("notify_umo")
        if not umo:
            return
        try:
            await self.context.send_message(umo, MessageChain(chain=[Comp.Plain(text)]))
        except Exception as exc:  # noqa: BLE001
            logger.warning(f"[automas] 通知发送失败: {exc}")

    # ---- 指令 ----

    def _allowed(self, event: AstrMessageEvent) -> bool:
        if not self._cfg_bool("require_admin", True):
            return True
        try:
            return bool(event.is_admin())
        except Exception:  # pragma: no cover - 旧版本可能没有该方法
            return False

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

        if not self._allowed(event):
            yield event.plain_result("这个只有管理员能用。")
            return

        if sub in {"", "帮助", "help", "?"}:
            yield event.plain_result(USAGE)
            return

        client = self.build_client()

        if sub in {"状态", "status"}:
            try:
                running = await client.running_tasks()
            except MasError as exc:
                yield event.plain_result(f"连不上 AUTO-MAS：{exc}")
                return
            if not running:
                yield event.plain_result("现在没任务在跑。")
                return
            lines = [f"正在跑 {len(running)} 个任务："]
            for task in running:
                mode = MODE_LABELS.get(task["mode"], task["mode"] or "未知")
                lines.append(f"· {task['taskId'][:8]} [{mode}]")
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
                mark = "" if user["status"] else "（已停用）"
                lines.append(f"{index}. {user['name']}{mark}")
            yield event.plain_result("\n".join(lines))
            return

        if sub in {"启动", "start", "运行"}:
            if not args:
                yield event.plain_result("用法：/mas 启动 <托管名> [账号名,账号名]")
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
            user_ids: list[str] | None = None
            if len(args) > 1:
                try:
                    users = await client.get_users(target["uid"])
                except MasError as exc:
                    yield event.plain_result(f"读取账号失败：{exc}")
                    return
                wanted = [part for part in args[1].replace("，", ",").split(",") if part]
                user_ids = []
                for name in wanted:
                    matched = next(
                        (user["uid"] for user in users if name in {user["name"], user["uid"]}),
                        None,
                    )
                    if matched is None:
                        yield event.plain_result(f"没找到账号「{name}」。")
                        return
                    user_ids.append(matched)
            try:
                task_id = await client.start_task(target["uid"], "AutoProxy", user_ids)
            except MasError as exc:
                yield event.plain_result(f"启动失败：{exc}")
                return
            yield event.plain_result(f"已启动 {target['name']}，任务 {task_id or '(无 ID)'}")
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



