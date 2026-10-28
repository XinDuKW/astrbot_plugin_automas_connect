"""AUTO-MAS 联动插件的 Plugin Pages 后端接口。

前端只跟这一层打交道，所有 AUTO-MAS 调用都走 MasClient，错误统一翻译成
HTTP 状态码，避免把 httpx 的异常栈丢给浏览器。
"""

from __future__ import annotations

import asyncio
from typing import Any

from astrbot.api import logger
from astrbot.api.web import error_response, json_response, request

from . import bettergi_order, maaend_config
from .mas_api import SCRIPT_ADD_TYPES, MasError, parse_runtime_snapshot

PLUGIN_NAME = "astrbot_plugin_automas_connect"
DISPATCH_MODES = ("AutoProxy", "ScriptConfig", "CycleRun", "Update")

# 任务完成后的电源操作。真实枚举是大驼峰，小写会被 AUTO-MAS 判 422。
POWER_OPTIONS = (
    ("NoAction", "不操作"),
    ("Shutdown", "关机"),
    ("ShutdownForce", "强制关机"),
    ("Reboot", "重启"),
    ("Hibernate", "休眠"),
    ("Sleep", "睡眠"),
    ("KillSelf", "退出 AUTO-MAS"),
    ("RestartSelf", "重启 AUTO-MAS"),
    ("Logoff", "注销"),
)
POWER_SIGNALS = tuple(value for value, _ in POWER_OPTIONS)

# 调度台日志只传最近这一段，和 AUTO-MAS 官方「调度台仅显示最近内容」一致
SCHED_LOG_TAIL = 12000

# 功能开关，键名必须和 _conf_schema.json 里 features.items 一致。
FEATURE_KEYS = (
    "accounts",
    "task_config",
    "plans",
    "queue",
    "scripts",
    "emulator",
    "history",
    "settings",
    "qq_command",
    "scheduler",
    "binding",
    "timed",
)


class AutomasWebUIController:
    """注册并实现联动面板所需的 Web API。"""

    def __init__(self, plugin: Any, context: Any):
        self.plugin = plugin
        self.context = context
        self._register_routes()

    def _register_routes(self) -> None:
        routes = (
            ("overview", self.overview, ["GET"], "AUTO-MAS 概览"),
            ("users", self.users, ["GET"], "托管项下的账号列表"),
            ("user/detail", self.user_detail, ["POST"], "账号完整配置"),
            ("user/save", self.user_save, ["POST"], "保存账号配置"),
            ("user/create", self.user_create, ["POST"], "新建账号"),
            ("user/delete", self.user_delete, ["POST"], "删除账号"),
        ("user/status", self.user_status, ["POST"], "启用/停用账号"),
            ("user/clone", self.user_clone, ["POST"], "克隆账号配置"),
            ("plans", self.plans, ["GET"], "计划表列表"),
            ("plan/detail", self.plan_detail, ["POST"], "计划表完整配置"),
            ("plan/save", self.plan_save, ["POST"], "保存计划表"),
            ("plan/create", self.plan_create, ["POST"], "新建计划表"),
            ("plan/delete", self.plan_delete, ["POST"], "删除计划表"),
            ("queues", self.queues, ["GET"], "调度队列列表"),
            ("queue/detail", self.queue_detail, ["POST"], "队列详情与成员"),
            ("queue/save", self.queue_save, ["POST"], "保存队列设置"),
            ("queue/create", self.queue_create, ["POST"], "新建队列"),
            ("queue/delete", self.queue_delete, ["POST"], "删除队列"),
            ("queue/run", self.queue_run, ["POST"], "运行整个队列"),
            ("queue/item/add", self.queue_item_add, ["POST"], "新增队列项"),
            ("queue/item/delete", self.queue_item_delete, ["POST"], "删除队列项"),
            ("queue/item/save", self.queue_item_save, ["POST"], "保存队列项"),
            ("queue/item/order", self.queue_item_order, ["POST"], "队列项排序"),
            ("queue/time/add", self.queue_time_add, ["POST"], "新增定时项"),
            ("queue/time/save", self.queue_time_save, ["POST"], "保存定时项"),
            ("queue/time/delete", self.queue_time_delete, ["POST"], "删除定时项"),
            ("history/search", self.history_search, ["POST"], "搜索运行历史"),
            ("history/detail", self.history_detail, ["POST"], "查看单次运行详情"),
            ("script/detail", self.script_detail, ["POST"], "托管项完整配置"),
            ("script/create", self.script_create, ["POST"], "新建托管项"),
            ("script/delete", self.script_delete, ["POST"], "删除托管项"),
            ("script/save", self.script_save, ["POST"], "保存托管项"),
            ("script/order", self.script_order, ["POST"], "托管项排序"),
            ("emulators", self.emulators, ["GET"], "模拟器列表与状态"),
            ("emulator/detail", self.emulator_detail, ["POST"], "模拟器完整配置"),
            ("emulator/save", self.emulator_save, ["POST"], "保存模拟器"),
            ("emulator/create", self.emulator_create, ["POST"], "新建模拟器项"),
            ("emulator/delete", self.emulator_delete, ["POST"], "删除模拟器项"),
            ("emulator/operate", self.emulator_operate, ["POST"], "启停模拟器"),
            ("emulator/search", self.emulator_search, ["POST"], "搜索本机模拟器"),
            ("stage/options", self.stage_options, ["GET"], "理智关卡选项"),
            ("depot/items", self.depot_items, ["GET"], "库存保持可选材料"),
            ("customInfrast/scan", self.infrast_scan, ["POST"], "扫描自定义基建目录"),
            ("customInfrast/import", self.infrast_import, ["POST"], "导入自定义基建排班表"),
            ("cultivate/operators", self.cultivate_operators, ["POST"], "养成目标干员目录"),
            ("maaend/options", self.maaend_options, ["GET"], "终末地可选项（采集路线 / 基质地点 / 控制器）"),
            ("maaend/tasks", self.maaend_tasks, ["GET"], "终末地任务名清单"),
            ("maafw/definition", self.maafw_definition, ["GET"], "MaaFW 任务 / 选项 / 预设定义"),
            ("bettergi/configs", self.bettergi_configs, ["GET"], "BetterGI 一条龙配置名"),
            ("bettergi/customGroups", self.bettergi_custom_groups, ["GET"], "BetterGI 自定义配置组"),
            ("zzzod/catalog", self.zzzod_catalog, ["GET"], "绝区零一条龙任务目录"),
            ("zzzod/teams", self.zzzod_teams, ["GET"], "绝区零预备编队"),
            ("zzzod/teams/save", self.zzzod_teams_save, ["POST"], "保存绝区零预备编队"),
            ("whimbox/catalog", self.whimbox_catalog, ["GET"], "奇想盒一条龙任务目录"),
            ("oknte/configs", self.oknte_configs, ["POST"], "OK-NTE 任务流程配置"),
            ("oknte/save", self.oknte_save, ["POST"], "保存 OK-NTE 任务流程配置"),
            ("setting/get", self.setting_get, ["GET"], "全局设置"),
            ("setting/save", self.setting_save, ["POST"], "保存全局设置"),
            ("setting/test_notify", self.setting_test_notify, ["POST"], "测试通知"),
            ("webhooks", self.webhooks, ["GET"], "通知渠道列表"),
            ("webhook/detail", self.webhook_detail, ["POST"], "通知渠道完整配置"),
            ("webhook/save", self.webhook_save, ["POST"], "保存通知渠道"),
            ("webhook/create", self.webhook_create, ["POST"], "新建通知渠道"),
            ("webhook/delete", self.webhook_delete, ["POST"], "删除通知渠道"),
            ("webhook/test", self.webhook_test, ["POST"], "测试通知渠道"),
            ("dispatch/start", self.dispatch_start, ["POST"], "启动托管任务"),
            ("dispatch/stop", self.dispatch_stop, ["POST"], "停止托管任务"),
            ("scheduler", self.scheduler, ["GET"], "调度中心"),
            ("scheduler/running", self.scheduler_running, ["GET"], "运行中任务与电源倒计时"),
            ("scheduler/power", self.scheduler_power, ["POST"], "设置任务完成后的电源操作"),
            ("scheduler/power/cancel", self.scheduler_power_cancel, ["POST"], "取消电源倒计时"),
            ("scheduler/scope", self.scheduler_scope, ["GET"], "队列本次能跑到的脚本与账号"),
            ("bindings", self.bindings, ["GET"], "QQ 与账号的绑定表"),
            ("binding/add", self.binding_add, ["POST"], "新增绑定"),
            ("binding/remove", self.binding_remove, ["POST"], "解除绑定"),
            ("queue/status", self.queue_status, ["GET"], "排队状态"),
            ("queue/cancel", self.queue_cancel, ["POST"], "取消排队请求"),
            ("timed", self.timed, ["GET"], "定时队列代管状态"),
            ("timed/takeover", self.timed_takeover, ["POST"], "开关定时代管"),
            ("notifications", self.notifications, ["GET"], "运行通知订阅者"),
            ("notification/remove", self.notification_remove, ["POST"], "移除运行通知订阅者"),
            ("maaend/native", self.maaend_native, ["GET"], "MaaEnd 原生任务参数"),
            ("maaend/native/save", self.maaend_native_save, ["POST"], "保存 MaaEnd 原生任务参数"),
            ("bettergi/order", self.bettergi_order, ["GET"], "BetterGI 一条龙执行顺序"),
            ("bettergi/order/save", self.bettergi_order_save, ["POST"], "保存 BetterGI 一条龙执行顺序"),
        )
        for endpoint, handler, methods, description in routes:
            self.context.register_web_api(
                f"/{PLUGIN_NAME}/{endpoint}",
                handler,
                methods,
                description,
            )

    # ---- 通用工具 ----

    def _build_client(self) -> Any:
        return self.plugin.build_client()

    def _features(self) -> dict[str, bool]:
        """读取插件配置里的功能开关，缺省一律开启。"""
        config = getattr(self.plugin, "config", None)
        raw = config.get("features") if isinstance(config, dict) else None
        if not isinstance(raw, dict):
            raw = {}
        return {key: bool(raw.get(key, True)) for key in FEATURE_KEYS}

    def _mas_data_dir(self) -> str:
        """AUTO-MAS 的 data 目录（独立/共享基线的配置放在它下面）。"""

        config = getattr(self.plugin, "config", None)
        if isinstance(config, dict):
            return self._text(config.get("mas_data_dir"))
        return ""

    async def _maaend_target(self, script_id: str, user_id: str) -> tuple[str, str, str]:
        """按账号基线解析出要读写的 mxu-MaaEnd.json，返回 (安装目录, 配置文件, 基线)。"""

        client = self._build_client()
        script = await client.get_script_raw(script_id)
        root = str((script.get("Info") or {}).get("Path") or "").strip()
        base: Any = "native"
        if user_id:
            config = await client.get_user_raw(script_id, user_id)
            base = (config.get("Info") or {}).get("Base") or "shared"
        path, kind = maaend_config.target_config_file(
            root, self._mas_data_dir(), script_id, user_id, base
        )
        return root, str(path), kind

    @staticmethod
    async def _payload() -> dict[str, Any] | None:
        body = await request.json(default={})
        if not isinstance(body, dict):
            return None
        return body

    @staticmethod
    def _text(value: Any) -> str:
        return value.strip() if isinstance(value, str) else ""

    # ---- 多人绑定 ----

    def _binding_store(self) -> Any:
        return getattr(self.plugin, "bindings", None)

    def _queue_runner(self) -> Any:
        return getattr(self.plugin, "queue", None)

    async def bindings(self) -> Any:
        store = self._binding_store()
        if store is None:
            return json_response({"bindings": []})
        try:
            scripts = await self._build_client().get_scripts()
            names = {item["uid"]: item["name"] for item in scripts}
        except MasError:
            names = {}
        return json_response({"bindings": store.overview(names)})

    async def binding_add(self) -> Any:
        store = self._binding_store()
        if store is None:
            return error_response("绑定表没初始化", status_code=500)
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        qq = self._text(body.get("qq"))
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        display = self._text(body.get("display"))
        if not qq or not script_id or not user_id:
            return error_response("qq / scriptId / userId 都不能为空", status_code=400)
        owner = store.owner_of(script_id, user_id)
        if owner and owner != qq:
            return error_response(f"这个账号已经绑给 {owner} 了", status_code=409)
        try:
            client = self._build_client()
            scripts = await client.get_scripts()
            script = next((item for item in scripts if item["uid"] == script_id), None)
            if script is None:
                return error_response("托管项不存在", status_code=404)
            accounts = await client.get_users(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        user = next((item for item in accounts if item["uid"] == user_id), None)
        if user is None:
            return error_response("账号不存在", status_code=404)
        store.set_binding(qq, display, script_id, script["name"], user_id, user["name"])
        return json_response(
            {
                "binding": {
                    "qq": qq,
                    "scriptId": script_id,
                    "scriptName": script["name"],
                    "userId": user_id,
                    "userName": user["name"],
                }
            }
        )

    async def binding_remove(self) -> Any:
        store = self._binding_store()
        if store is None:
            return error_response("绑定表没初始化", status_code=500)
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        qq = self._text(body.get("qq"))
        if not qq:
            return error_response("缺少 qq", status_code=400)
        removed = store.remove_binding(qq, self._text(body.get("scriptId")))
        return json_response({"removed": removed})

    # ---- 排队 ----

    async def queue_status(self) -> Any:
        runner = self._queue_runner()
        if runner is None:
            return json_response({"running": [], "waiting": []})
        return json_response(runner.snapshot())

    async def queue_cancel(self) -> Any:
        runner = self._queue_runner()
        if runner is None:
            return json_response({"cancelled": 0})
        body = await self._payload()
        qq = self._text((body or {}).get("qq"))
        removed = runner.cancel(qq)
        return json_response({"cancelled": len(removed)})

    # ---- 定时代管 ----

    async def timed(self) -> Any:
        scheduler = getattr(self.plugin, "timed", None)
        if scheduler is None:
            return json_response({"queues": [], "runs": [], "takeover": []})
        try:
            return json_response(await scheduler.snapshot())
        except MasError as exc:
            return error_response(f"连接 AUTO-MAS 失败：{exc}")

    async def timed_takeover(self) -> Any:
        scheduler = getattr(self.plugin, "timed", None)
        if scheduler is None:
            return error_response("这个版本没启用定时代管", status_code=400)
        body = await self._payload()
        queue_id = self._text((body or {}).get("queueId"))
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        raw_on = (body or {}).get("on")
        on = raw_on if isinstance(raw_on, bool) else str(raw_on or "").strip().lower() in {"1", "true", "yes", "on"}
        try:
            result = await scheduler.set_takeover(queue_id, on)
        except MasError as exc:
            return error_response(f"切换定时代管失败：{exc}")
        return json_response(result)

    # ---- 运行通知订阅者 ----

    async def notifications(self) -> Any:
        store = getattr(self.plugin, "notices", None)
        if store is None:
            return json_response({"subscribers": []})
        return json_response({"subscribers": store.items()})

    async def notification_remove(self) -> Any:
        store = getattr(self.plugin, "notices", None)
        if store is None:
            return error_response("这个版本没有运行通知", status_code=400)
        body = await self._payload()
        umo = self._text((body or {}).get("umo"))
        if not umo:
            return error_response("缺少 umo", status_code=400)
        removed = store.unsubscribe(umo)
        return json_response({"removed": bool(removed)})

    # ---- 接口实现 ----

    async def overview(self) -> Any:
        client = self._build_client()
        try:
            scripts = await client.get_scripts()
            snapshot = await client.runtime_snapshot()
            plans = await client.get_plans()
        except MasError as exc:
            logger.warning(f"[automas] 概览读取失败: {exc}")
            return json_response(
                {
                    "online": False,
                    "error": str(exc),
                    "scripts": [],
                    "plans": [],
                    "running": [],
                    "features": self._features(),
                }
            )
        name_by_id = {item["uid"]: item["name"] for item in scripts}
        running = [
            {**task, "name": name_by_id.get(task["scriptId"], "")}
            for task in parse_runtime_snapshot(snapshot)
        ]
        return json_response(
            {
                "online": True,
                "scripts": scripts,
                "plans": plans,
                "running": running,
                "baseUrl": client.base_url,
                "features": self._features(),
            }
        )

    async def users(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            accounts = await self._build_client().get_users(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"users": accounts})

    async def user_detail(self) -> Any:
        body = await self._payload()
        if body is None:
            logger.warning(
                "[automas] user/detail body 解析失败 content_type=%s query=%s",
                request.content_type,
                request.query,
            )
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        if not script_id or not user_id:
            logger.warning(
                "[automas] user/detail 缺参数 body=%s query=%s",
                body,
                request.query,
            )
            return error_response("缺少 scriptId 或 userId", status_code=400)
        client = self._build_client()
        try:
            data = await client.get_user_raw(script_id, user_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        # 计划表列表用来填 Stage.StageMode 的下拉；取不到不算致命，给空列表让前端退回 Fixed。
        plan_items: list[dict[str, Any]] = []
        try:
            for plan in await client.get_plans():
                info = (plan.get("data") or {}).get("Info") or {}
                plan_items.append(
                    {
                        "uid": str(plan.get("uid") or ""),
                        "type": str(plan.get("type") or ""),
                        "name": str(info.get("Name") or plan.get("uid") or ""),
                    }
                )
        except MasError:
            plan_items = []
        return json_response({"userId": user_id, "config": data, "plans": plan_items})

    async def user_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        data = body.get("data")
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        if not isinstance(data, dict):
            return error_response("data 必须是对象", status_code=400)
        try:
            await self._build_client().update_user(script_id, user_id, data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "userId": user_id})

    async def user_create(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            created = await self._build_client().create_user(
                script_id, self._text(body.get("name"))
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(created)

    async def user_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        try:
            await self._build_client().delete_user(script_id, user_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"userId": user_id, "deleted": True})

    async def user_status(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        raw_status = body.get("status")
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        if isinstance(raw_status, str):
            enabled = raw_status.strip().lower() in ("1", "true", "yes", "on")
        else:
            enabled = bool(raw_status)
        try:
            saved = await self._build_client().set_user_status(
                script_id, user_id, enabled
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"userId": user_id, "status": saved})

    async def user_clone(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        source_user_id = self._text(body.get("sourceUserId"))
        name = self._text(body.get("name"))
        if not script_id or not source_user_id:
            return error_response("缺少 scriptId 或 sourceUserId", status_code=400)
        try:
            created = await self._build_client().clone_user(script_id, source_user_id, name)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(created)

    # ---- 计划表 ----

    async def plans(self) -> Any:
        try:
            items = await self._build_client().get_plans()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(
            {
                "plans": [
                    {
                        "uid": item["uid"],
                        "type": item["type"],
                        "name": str(((item.get("data") or {}).get("Info") or {}).get("Name") or item["uid"]),
                        "mode": str(((item.get("data") or {}).get("Info") or {}).get("Mode") or ""),
                        "rotateDays": ((item.get("data") or {}).get("Info") or {}).get("RotateDays"),
                    }
                    for item in items
                ]
            }
        )

    async def plan_detail(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        plan_id = self._text(body.get("planId"))
        if not plan_id:
            return error_response("缺少 planId", status_code=400)
        try:
            data = await self._build_client().get_plan_raw(plan_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"planId": plan_id, "config": data})

    async def plan_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        plan_id = self._text(body.get("planId"))
        data = body.get("data")
        if not plan_id:
            return error_response("缺少 planId", status_code=400)
        if not isinstance(data, dict):
            return error_response("data 必须是对象", status_code=400)
        try:
            await self._build_client().update_plan(plan_id, data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "planId": plan_id})

    async def plan_create(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        plan_type = self._text(body.get("type")) or "MaaPlan"
        if plan_type not in ("MaaPlan", "MaaEndPlan"):
            return error_response(f"未知的计划表类型: {plan_type}", status_code=400)
        try:
            created = await self._build_client().add_plan(plan_type)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(created)

    async def plan_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        plan_id = self._text(body.get("planId"))
        if not plan_id:
            return error_response("缺少 planId", status_code=400)
        try:
            await self._build_client().delete_plan(plan_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"planId": plan_id, "deleted": True})

    # ---- 调度队列 ----

    async def queues(self) -> Any:
        try:
            items = await self._build_client().get_queues()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(
            {
                "queues": [
                    {
                        "uid": item["uid"],
                        "name": str(((item.get("data") or {}).get("Info") or {}).get("Name") or item["uid"]),
                        "timeEnabled": ((item.get("data") or {}).get("Info") or {}).get("TimeEnabled") is True,
                        "startUpMode": str(((item.get("data") or {}).get("Info") or {}).get("StartUpMode") or ""),
                    }
                    for item in items
                ]
            }
        )

    async def queue_detail(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        client = self._build_client()
        try:
            cfg = await client.get_queue_raw(queue_id)
            raw_items = await client.get_queue_items(queue_id)
            raw_times = await client.get_time_sets(queue_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        script_items: list[dict[str, Any]] = []
        try:
            script_items = await client.get_scripts()
        except MasError:
            script_items = []
        name_by_id = {item["uid"]: item["name"] for item in script_items}
        items = []
        for entry in raw_items:
            info = (entry.get("data") or {}).get("Info") or {}
            script_id = str(info.get("ScriptId") or "-")
            items.append(
                {
                    "uid": entry["uid"],
                    "scriptId": script_id,
                    # "-" 是 MAS 里“未选择”的占位
                    "scriptName": "" if script_id in ("", "-") else name_by_id.get(script_id, script_id),
                    "schedule": (entry.get("data") or {}).get("Schedule") or {},
                }
            )
        times = []
        for entry in raw_times:
            info = dict((entry.get("data") or {}).get("Info") or {})
            info.setdefault("Enabled", True)
            info.setdefault("Days", [])
            info.setdefault("Time", "")
            times.append({"uid": entry["uid"], "info": info})
        return json_response(
            {
                "queueId": queue_id,
                "config": cfg,
                "items": items,
                "times": times,
                "scripts": [
                    {"uid": item["uid"], "name": item["name"], "typeLabel": item["typeLabel"]}
                    for item in script_items
                ],
            }
        )

    async def queue_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        info = body.get("info")
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        if not isinstance(info, dict):
            return error_response("info 必须是对象", status_code=400)
        try:
            await self._build_client().update_queue(queue_id, {"Info": info})
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "queueId": queue_id})

    async def queue_create(self) -> Any:
        try:
            created = await self._build_client().add_queue()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(created)

    async def queue_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        try:
            await self._build_client().delete_queue(queue_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"deleted": True, "queueId": queue_id})

    async def queue_run(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        try:
            task_id = await self._build_client().start_task(queue_id, "AutoProxy")
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"taskId": task_id})

    async def queue_item_add(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        try:
            created = await self._build_client().add_queue_item(queue_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(created)

    async def queue_item_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        item_id = self._text(body.get("queueItemId"))
        if not queue_id or not item_id:
            return error_response("缺少 queueId 或 queueItemId", status_code=400)
        try:
            await self._build_client().delete_queue_item(queue_id, item_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"deleted": True, "queueItemId": item_id})

    async def queue_item_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        item_id = self._text(body.get("queueItemId"))
        script_id = self._text(body.get("scriptId"))
        if not queue_id or not item_id:
            return error_response("缺少 queueId 或 queueItemId", status_code=400)
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        payload: dict[str, Any] = {"Info": {"ScriptId": script_id}}
        schedule = body.get("schedule")
        if isinstance(schedule, dict) and schedule:
            payload["Schedule"] = schedule
        try:
            await self._build_client().update_queue_item(queue_id, item_id, payload)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "queueItemId": item_id})

    async def queue_item_order(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        raw_list = body.get("indexList")
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        if not isinstance(raw_list, list) or not raw_list:
            return error_response("indexList 必须是非空数组", status_code=400)
        index_list = [str(item) for item in raw_list]
        try:
            await self._build_client().reorder_queue_items(queue_id, index_list)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True})

    async def queue_time_add(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        try:
            created = await self._build_client().add_time_set(queue_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(created)

    async def queue_time_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        time_set_id = self._text(body.get("timeSetId"))
        info = body.get("info")
        if not queue_id or not time_set_id:
            return error_response("缺少 queueId 或 timeSetId", status_code=400)
        if not isinstance(info, dict):
            return error_response("info 必须是对象", status_code=400)
        try:
            await self._build_client().update_time_set(queue_id, time_set_id, {"Info": info})
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "timeSetId": time_set_id})

    async def queue_time_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        queue_id = self._text(body.get("queueId"))
        time_set_id = self._text(body.get("timeSetId"))
        if not queue_id or not time_set_id:
            return error_response("缺少 queueId 或 timeSetId", status_code=400)
        try:
            await self._build_client().delete_time_set(queue_id, time_set_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"deleted": True, "timeSetId": time_set_id})

    # ---- 运行历史 ----

    async def history_search(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        start = self._text(body.get("startDate"))
        end = self._text(body.get("endDate"))
        mode = (self._text(body.get("mode")) or "DAILY").upper()
        if mode not in ("DAILY", "WEEKLY", "MONTHLY"):
            mode = "DAILY"
        if not start or not end:
            return error_response("缺少 startDate 或 endDate", status_code=400)
        try:
            raw = await self._build_client().search_history(start, end, mode)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        days = []
        for day in sorted(raw.keys(), reverse=True):
            users = raw.get(day)
            if not isinstance(users, dict):
                continue
            entries = []
            for name, item in users.items():
                info = item if isinstance(item, dict) else {}
                runs = []
                for run in info.get("index") or []:
                    if not isinstance(run, dict):
                        continue
                    runs.append(
                        {
                            "date": str(run.get("date") or ""),
                            "status": str(run.get("status") or ""),
                            "result": str(run.get("result") or ""),
                            "jsonFile": str(run.get("jsonFile") or ""),
                        }
                    )
                entries.append(
                    {
                        "name": str(name),
                        "runs": runs,
                        "errorInfo": info.get("error_info") or {},
                    }
                )
            entries.sort(key=lambda row: row["name"])
            days.append({"date": day, "users": entries})
        return json_response({"mode": mode, "days": days})

    async def history_detail(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        json_path = self._text(body.get("jsonPath"))
        if not json_path:
            return error_response("缺少 jsonPath", status_code=400)
        try:
            data = await self._build_client().get_history_data(json_path)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        log_text = data.get("log_content")
        if not isinstance(log_text, str):
            log_text = ""
        return json_response(
            {
                "jsonPath": json_path,
                "logContent": log_text,
                "config": data,
            }
        )

    # ---- 调度中心 ----

    async def scheduler(self) -> Any:
        """调度中心首屏：运行中任务 + 定时托管项 + 账号范围 + 电源操作。"""
        client = self._build_client()
        try:
            scripts, snapshot, queues = await asyncio.gather(
                client.get_scripts(),
                client.runtime_snapshot(),
                client.get_queues(),
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(
            {
                "tasks": [_trim_task_log(task) for task in parse_runtime_snapshot(snapshot)],
                "scheduled": _parse_scheduled(snapshot),
                "scripts": scripts,
                "queues": queues,
                "power": await self._power_state(client),
                "powerOptions": [{"value": v, "label": l} for v, l in POWER_OPTIONS],
                "modes": list(DISPATCH_MODES),
            }
        )

    async def scheduler_running(self) -> Any:
        """轮询用：只返回任务与电源倒计时，比首屏轻。"""
        client = self._build_client()
        try:
            snapshot = await client.runtime_snapshot()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(
            {
                "tasks": [_trim_task_log(task) for task in parse_runtime_snapshot(snapshot)],
                "scheduled": _parse_scheduled(snapshot),
                "power": await self._power_state(client),
            }
        )

    @staticmethod
    async def _power_state(client: Any) -> dict[str, Any]:
        """电源操作读取失败不该拖垮整个调度台，单独兜住。"""
        signal = ""
        countdown: dict[str, Any] = {}
        try:
            signal = await client.power_signal()
        except MasError:
            signal = ""
        try:
            countdown = await client.power_countdown()
        except MasError:
            countdown = {}
        return {"signal": signal, "countdown": countdown}

    async def scheduler_power(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        signal = self._text(body.get("signal"))
        if signal not in POWER_SIGNALS:
            return error_response(f"未知的电源操作: {signal}", status_code=400)
        try:
            await self._build_client().set_power(signal)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"signal": signal})

    async def scheduler_power_cancel(self) -> Any:
        try:
            await self._build_client().cancel_power()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"cancelled": True})

    async def scheduler_scope(self) -> Any:
        """队列模式下的运行范围：这个队列会跑到哪些脚本，每个脚本下有哪些账号。"""
        queue_id = self._text(request.query.get("queueId"))
        if not queue_id:
            return error_response("缺少 queueId", status_code=400)
        client = self._build_client()
        try:
            scripts = await client.get_scripts()
            items = await client.get_queue_items(queue_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        name_by_id = {str(item["uid"]): item["name"] for item in scripts}
        script_ids: list[str] = []
        for item in items:
            info = (item.get("data") or {}).get("Info") or {}
            script_id = str(info.get("ScriptId") or "")
            if script_id in ("", "-") or script_id not in name_by_id:
                continue
            if script_id not in script_ids:
                script_ids.append(script_id)
        async def _users(script_id: str) -> list[dict[str, Any]]:
            try:
                return await client.get_users(script_id)
            except MasError:
                return []

        fetched = await asyncio.gather(*[_users(script_id) for script_id in script_ids])
        scope = [
            {
                "scriptId": script_id,
                "scriptName": name_by_id.get(script_id, script_id),
                "users": [
                    {"uid": user["uid"], "name": user["name"], "status": user["status"]}
                    for user in users
                ],
            }
            for script_id, users in zip(script_ids, fetched)
        ]
        return json_response({"queueId": queue_id, "items": scope})

    async def dispatch_start(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        # 队列任务传 taskId（队列 ID），单个托管项沿用 scriptId，两者都认。
        task_id_in = self._text(body.get("taskId")) or self._text(body.get("scriptId"))
        mode = self._text(body.get("mode")) or "AutoProxy"
        resume_from = self._text(body.get("resumeFromScriptId"))
        raw_user_ids = body.get("userIds")
        user_ids = [str(item) for item in raw_user_ids] if isinstance(raw_user_ids, list) else None
        raw_queue_user_ids = body.get("queueUserIds")
        queue_user_ids = None
        if isinstance(raw_queue_user_ids, dict):
            queue_user_ids = {
                str(key): [str(item) for item in value]
                for key, value in raw_queue_user_ids.items()
                if isinstance(value, list)
            }
        if not task_id_in:
            return error_response("缺少 taskId", status_code=400)
        if mode not in DISPATCH_MODES:
            return error_response(f"未知的任务模式: {mode}", status_code=400)
        try:
            task_id = await self._build_client().start_task(
                task_id_in, mode, user_ids, queue_user_ids, resume_from
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"taskId": task_id})

    async def dispatch_stop(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        task_id = self._text(body.get("taskId"))
        if not task_id:
            return error_response("缺少 taskId", status_code=400)
        try:
            await self._build_client().stop_task(task_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"stopped": True, "taskId": task_id})

    # ---- 托管项 ----

    async def script_detail(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            data = await self._build_client().get_script_raw(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"scriptId": script_id, "config": data})

    async def script_create(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_type = self._text(body.get("type")) or "MAA"
        if script_type not in {item[0] for item in SCRIPT_ADD_TYPES}:
            return error_response(f"未知的脚本类型: {script_type}", status_code=400)
        copy_from = self._text(body.get("copyFrom"))
        name = self._text(body.get("name"))
        client = self._build_client()
        try:
            created = await client.add_script(script_type, copy_from)
            script_id = created["scriptId"]
            if not script_id:
                return error_response("AUTO-MAS 未返回新的托管项 ID", status_code=502)
            if name:
                data = created["data"] or await client.get_script_raw(script_id)
                info = data.setdefault("Info", {})
                info["Name"] = name
                await client.update_script(script_id, data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"scriptId": script_id, "name": name})

    async def script_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            await self._build_client().delete_script(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"deleted": True, "scriptId": script_id})

    async def script_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        data = body.get("data")
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        if not isinstance(data, dict):
            return error_response("data 必须是对象", status_code=400)
        try:
            await self._build_client().update_script(script_id, data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "scriptId": script_id})

    async def script_order(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        raw_list = body.get("indexList")
        if not isinstance(raw_list, list) or not raw_list:
            return error_response("indexList 必须是非空数组", status_code=400)
        index_list = [self._text(item) for item in raw_list if self._text(item)]
        if not index_list:
            return error_response("indexList 里没有有效 ID", status_code=400)
        try:
            await self._build_client().reorder_scripts(index_list)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"order": index_list})

    # ---- 模拟器 ----

    async def emulators(self) -> Any:
        client = self._build_client()
        try:
            items = await client.get_emulators()
            try:
                status = await client.emulator_status()
            except MasError:
                status = {}
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        result = []
        for item in items:
            uid = item["uid"]
            devices = []
            for slot_index, device in (status.get(uid) or {}).items():
                if not isinstance(device, dict):
                    continue
                devices.append(
                    {
                        "index": str(slot_index),
                        "title": str(device.get("title") or ""),
                        "status": device.get("status"),
                        "adb": str(device.get("adb_address") or ""),
                    }
                )
            devices.sort(key=lambda row: row["index"])
            result.append(
                {
                    "uid": uid,
                    "name": item["name"],
                    "type": item["type"],
                    "path": item["path"],
                    "devices": devices,
                }
            )
        return json_response({"emulators": result})

    async def emulator_detail(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        emulator_id = self._text(body.get("emulatorId"))
        if not emulator_id:
            return error_response("缺少 emulatorId", status_code=400)
        try:
            items = await self._build_client().get_emulators()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        for item in items:
            if item["uid"] == emulator_id:
                return json_response({"emulatorId": emulator_id, "config": item["data"]})
        return error_response("找不到这个模拟器项", status_code=404)

    async def emulator_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        emulator_id = self._text(body.get("emulatorId"))
        data = body.get("data")
        if not emulator_id:
            return error_response("缺少 emulatorId", status_code=400)
        if not isinstance(data, dict):
            return error_response("data 必须是对象", status_code=400)
        try:
            await self._build_client().update_emulator(emulator_id, data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "emulatorId": emulator_id})

    async def emulator_create(self) -> Any:
        try:
            created = await self._build_client().add_emulator()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"emulatorId": created["emulatorId"], "config": created["data"]})

    async def emulator_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        emulator_id = self._text(body.get("emulatorId"))
        if not emulator_id:
            return error_response("缺少 emulatorId", status_code=400)
        try:
            await self._build_client().delete_emulator(emulator_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"deleted": True, "emulatorId": emulator_id})

    async def emulator_operate(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        emulator_id = self._text(body.get("emulatorId"))
        operate = self._text(body.get("operate")) or "open"
        index = self._text(body.get("index")) or "0"
        if not emulator_id:
            return error_response("缺少 emulatorId", status_code=400)
        if operate not in ("open", "close", "show"):
            return error_response("operate 只支持 open / close / show", status_code=400)
        try:
            await self._build_client().operate_emulator(emulator_id, operate, index)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"emulatorId": emulator_id, "operate": operate})

    async def emulator_search(self) -> Any:
        try:
            items = await self._build_client().search_emulators()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"emulators": items})

    # ---- 全局设置 / 通知渠道 ----

    async def stage_options(self) -> Any:
        try:
            items = await self._build_client().get_stage_options()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"stages": items})

    async def infrast_scan(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            scan = await self._build_client().scan_infrast_files(
                script_id, self._text(body.get("dir"))
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"scan": scan})

    async def infrast_import(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        json_file = self._text(body.get("jsonFile"))
        if not script_id or not user_id or not json_file:
            return error_response("缺少 scriptId / userId / jsonFile", status_code=400)
        try:
            result = await self._build_client().import_infrast_file(
                script_id, user_id, json_file
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"imported": result})

    async def depot_items(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            items = await self._build_client().get_depot_items(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"items": items})

    async def maaend_tasks(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            tasks = await self._build_client().scan_maaend_tasks(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"tasks": tasks})

    async def maaend_options(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            options = await self._build_client().get_maaend_options(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"options": options})

    async def maaend_native(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        user_id = self._text(request.query.get("userId"))
        task_name = self._text(request.query.get("task"))
        try:
            root, config_path, kind = await self._maaend_target(script_id, user_id)
            if task_name:
                info = maaend_config.describe(root, task_name, config_path)
            else:
                info = maaend_config.describe_all(root, config_path)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        except maaend_config.MaaEndError as exc:
            return error_response(str(exc), status_code=400)
        info["base"] = kind
        info["baseLabel"] = maaend_config.BASE_LABELS.get(kind, kind)
        info["configPath"] = config_path
        info["userScoped"] = bool(user_id)
        return json_response({"native": info})

    async def maaend_native_save(self) -> Any:
        body = await request.json(default={})
        script_id = self._text(body.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        user_id = self._text(body.get("userId"))
        values = body.get("values")
        if not isinstance(values, dict) or not values:
            return error_response("没有要保存的值", status_code=400)
        task_name = self._text(body.get("task")) or "AutoSell"
        raw_mtime = body.get("mtime")
        expect = float(raw_mtime) if isinstance(raw_mtime, (int, float)) else None
        try:
            root, config_path, kind = await self._maaend_target(script_id, user_id)
            result = maaend_config.apply(
                root,
                task_name,
                {str(key): value for key, value in values.items()},
                expect,
                config_path,
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        except maaend_config.MaaEndError as exc:
            return error_response(str(exc), status_code=400)
        return json_response(
            {
                "saved": True,
                "path": result["path"],
                "changed": result["changed"],
                "mtime": result["mtime"],
                "base": kind,
            }
        )

    async def maafw_definition(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            definition = await self._build_client().scan_maafw_definition(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"definition": definition})
    async def whimbox_catalog(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            catalog = await self._build_client().get_whimbox_catalog(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"catalog": catalog})

    async def oknte_configs(self) -> Any:
        body = await request.json(default={})
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        try:
            payload = await self._build_client().get_oknte_configs(script_id, user_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(payload)

    async def oknte_save(self) -> Any:
        body = await request.json(default={})
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        configs = body.get("configs")
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        if not isinstance(configs, dict) or not configs:
            return error_response("configs 必须是非空的 {文件名: 配置} 对象", status_code=400)
        try:
            result = await self._build_client().update_oknte_configs(
                script_id, user_id, configs
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(result)
    async def bettergi_configs(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            items = await self._build_client().get_bettergi_one_dragon_configs(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"configs": items})

    async def bettergi_custom_groups(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        use_mas = (self._text(request.query.get("useMasConfig")) or "").lower() in (
            "1",
            "true",
            "yes",
        )
        try:
            items = await self._build_client().get_bettergi_custom_groups(
                script_id,
                self._text(request.query.get("userId")),
                self._text(request.query.get("configName")),
                use_mas,
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"groups": items})

    async def _bettergi_one_dragon(
        self, script_id: str, user_id: str
    ) -> tuple[str, str, str, dict[str, Any], dict[str, Any]]:
        """取 BetterGI 的 (安装目录, 基线, 配置文件路径, 一条龙配置, 账号/脚本配置)。"""

        client = self._build_client()
        script = await client.get_script_raw(script_id)
        info = script.get("Info") or {}
        root = str(info.get("RootPath") or info.get("Path") or "").strip()
        base = "shared"
        one_dragon: dict[str, Any] = {}
        config: dict[str, Any] = script
        if user_id:
            config = await client.get_user_raw(script_id, user_id)
            base = str((config.get("Info") or {}).get("Base") or "shared").strip() or "shared"
        one_dragon = config.get("OneDragon") or {}
        if not isinstance(one_dragon, dict):
            one_dragon = {}
        return root, base, str(info.get("Name") or ""), one_dragon, config

    async def bettergi_order(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        user_id = self._text(request.query.get("userId"))
        config_name = self._text(request.query.get("configName"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        client = self._build_client()
        try:
            root, base, _, one_dragon, config = await self._bettergi_one_dragon(
                script_id, user_id
            )
            path = bettergi_order.resolve_config_path(
                root, self._mas_data_dir(), script_id, user_id, base, config_name
            )
            file_config = bettergi_order.read_config(path)
            try:
                custom_groups = await client.get_bettergi_custom_groups(
                    script_id, user_id, config_name, base.lower() == "independent"
                )
            except MasError:
                custom_groups = []
            order = bettergi_order.build_order(
                one_dragon, file_config, custom_groups, path
            )
        except MasError as exc:
            return error_response(str(exc), status_code=502)

        async def safe(coro: Any) -> list[dict[str, str]]:
            try:
                return await coro
            except MasError:
                return []

        candidates = {
            "js": await safe(client.get_bettergi_js_scripts(script_id)),
            "keymouse": await safe(client.get_bettergi_key_mouse_scripts(script_id)),
            "pathing": await safe(client.get_bettergi_pathing(script_id)),
            "scriptgroup": await safe(
                client.get_bettergi_script_groups(script_id, user_id)
            ),
        }
        return json_response(
            {
                "order": order,
                "builtin": bettergi_order.BUILTIN_GROUPS,
                "custom": custom_groups,
                "candidates": candidates,
                "base": base,
                "scriptName": str((config.get("Info") or {}).get("Name") or ""),
                "configName": bettergi_order.config_name(config_name),
            }
        )

    async def bettergi_order_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求体必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        items = body.get("items")
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        if not isinstance(items, list) or not items:
            return error_response("items 必须是非空的顺序列表", status_code=400)
        queue = bettergi_order.queue_payload(items)
        groups = bettergi_order.groups_for(items)
        client = self._build_client()
        try:
            if user_id:
                config = await client.get_user_raw(script_id, user_id)
                one_dragon = config.get("OneDragon")
                if not isinstance(one_dragon, dict):
                    one_dragon = {}
                    config["OneDragon"] = one_dragon
                one_dragon["Queue"] = queue
                one_dragon["Groups"] = groups
                await client.update_user(script_id, user_id, config)
            else:
                script = await client.get_script_raw(script_id)
                one_dragon = script.get("OneDragon")
                if not isinstance(one_dragon, dict):
                    one_dragon = {}
                    script["OneDragon"] = one_dragon
                one_dragon["Queue"] = queue
                one_dragon["Groups"] = groups
                await client.update_script(script_id, script)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "queue": queue, "groups": groups})

    async def zzzod_catalog(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        if not script_id:
            return error_response("缺少 scriptId", status_code=400)
        try:
            items = await self._build_client().get_zzzod_catalog(script_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"catalog": items})

    async def zzzod_teams(self) -> Any:
        script_id = self._text(request.query.get("scriptId"))
        user_id = self._text(request.query.get("userId"))
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        instance_idx = self._text(request.query.get("instanceIdx"))
        try:
            data = await self._build_client().get_zzzod_teams(
                script_id, user_id, int(instance_idx) if instance_idx else None
            )
        except ValueError:
            return error_response("instanceIdx 必须是整数", status_code=400)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(data)

    async def zzzod_teams_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        teams = body.get("teams")
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        if not isinstance(teams, list) or not teams:
            return error_response("teams 必须是非空数组", status_code=400)
        instance_idx = body.get("instanceIdx")
        try:
            saved = await self._build_client().save_zzzod_teams(
                script_id,
                user_id,
                teams,
                int(instance_idx) if instance_idx is not None else None,
            )
        except (TypeError, ValueError):
            return error_response("instanceIdx 必须是整数", status_code=400)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": saved})

    async def cultivate_operators(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        script_id = self._text(body.get("scriptId"))
        user_id = self._text(body.get("userId"))
        if not script_id or not user_id:
            return error_response("缺少 scriptId 或 userId", status_code=400)
        try:
            items = await self._build_client().get_cultivate_operators(script_id, user_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"operators": items})

    async def setting_get(self) -> Any:
        try:
            data = await self._build_client().get_setting()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"config": data, "masked": "Replay.Password"})

    async def setting_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        data = body.get("data")
        if not isinstance(data, dict) or not data:
            return error_response("data 必须是非空对象", status_code=400)
        # 掩码字段原样写回会把密码改成掩码串，直接拒绝
        replay = data.get("Replay")
        if isinstance(replay, dict) and "Password" in replay:
            return error_response("Replay.Password 是掩码，不能这样写回", status_code=400)
        try:
            await self._build_client().update_setting(data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True})

    async def setting_test_notify(self) -> Any:
        try:
            await self._build_client().test_notify()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"sent": True})

    async def webhooks(self) -> Any:
        try:
            items = await self._build_client().get_webhooks()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response(
            {
                "webhooks": [
                    {
                        "uid": item["uid"],
                        "name": item["name"],
                        "enabled": item["enabled"],
                        "method": str(((item["data"] or {}).get("Data") or {}).get("Method") or ""),
                        "url": str(((item["data"] or {}).get("Data") or {}).get("Url") or ""),
                    }
                    for item in items
                ]
            }
        )

    async def webhook_detail(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        webhook_id = self._text(body.get("webhookId"))
        if not webhook_id:
            return error_response("缺少 webhookId", status_code=400)
        try:
            items = await self._build_client().get_webhooks()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        for item in items:
            if item["uid"] == webhook_id:
                return json_response({"webhookId": webhook_id, "config": item["data"]})
        return error_response("找不到这个通知渠道", status_code=404)

    async def webhook_save(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        webhook_id = self._text(body.get("webhookId"))
        data = body.get("data")
        if not webhook_id:
            return error_response("缺少 webhookId", status_code=400)
        if not isinstance(data, dict):
            return error_response("data 必须是对象", status_code=400)
        try:
            await self._build_client().update_webhook(webhook_id, data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"saved": True, "webhookId": webhook_id})

    async def webhook_create(self) -> Any:
        try:
            created = await self._build_client().add_webhook()
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"webhookId": created["webhookId"], "config": created["data"]})

    async def webhook_delete(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        webhook_id = self._text(body.get("webhookId"))
        if not webhook_id:
            return error_response("缺少 webhookId", status_code=400)
        try:
            await self._build_client().delete_webhook(webhook_id)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"deleted": True, "webhookId": webhook_id})

    async def webhook_test(self) -> Any:
        body = await self._payload()
        if body is None:
            return error_response("请求内容必须是 JSON 对象", status_code=400)
        data = body.get("data")
        if not isinstance(data, dict):
            return error_response("data 必须是对象", status_code=400)
        try:
            await self._build_client().test_webhook(data)
        except MasError as exc:
            return error_response(str(exc), status_code=502)
        return json_response({"sent": True})


def _trim_task_log(task: dict[str, Any]) -> dict[str, Any]:
    """长日志只留尾部，避免每 3 秒轮询搬几十 KB。"""
    log = task.get("log")
    if isinstance(log, str) and len(log) > SCHED_LOG_TAIL:
        return {**task, "log": "…（前面内容已省略）…\n" + log[-SCHED_LOG_TAIL:]}
    return task


def _parse_scheduled(snapshot: Any) -> list[dict[str, str]]:
    """当前启用了定时的托管项（它们到点会自己跑，调度台要列出来）。"""
    raw = snapshot.get("scheduledScripts") if isinstance(snapshot, dict) else None
    if not isinstance(raw, list):
        return []
    out: list[dict[str, str]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        script_id = str(item.get("scriptId") or "")
        if not script_id:
            continue
        out.append(
            {
                "scriptId": script_id,
                "scriptType": str(item.get("scriptType") or ""),
            }
        )
    return out

