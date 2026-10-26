"""AUTO-MAS 本地 REST API 的最小异步客户端。

AUTO-MAS 正式版后端固定监听 0.0.0.0:36163，源码调试版是 36164，接口不鉴权。
本模块只依赖 httpx，不导入 astrbot，方便在纯 Python 环境里跑测试。

所有请求一律 trust_env=False：AUTO-MAS 跑在本机或内网，走系统代理会让
127.0.0.1 的请求被代理层接走，症状是明明程序在跑却一直"连不上"。
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import httpx

DEFAULT_BASE_URL = "http://127.0.0.1:36163"

# 这几项是开关游戏/切号的工具任务，列出来只会让人误勾
MAAEND_TASK_SKIP = {
    "CloseGame",
    "CloseGamePC",
    "AndroidOpenGame",
    "AccountSwitch",
    "AdbAutoFightTest",
    "DevTest",
}

# 只列高置信度的映射，脚本真实显示名以配置里的 Info.Name 为准
SCRIPT_TYPE_LABELS: dict[str, str] = {
    "MaaConfig": "MAA",
    "M9AConfig": "M9A",
    "HSRConfig": "星穹铁道",
    "BetterGIConfig": "BetterGI",
    "ZzzOdConfig": "绝区零",
    "BAAHConfig": "蔚蓝档案",
    "MSSConfig": "MSS",
    "MaaEndConfig": "终末地",
    "MaaFWConfig": "MaaFramework",
    "WhimboxConfig": "奇想盒",
    "SrcConfig": "SRC",
    "GeneralConfig": "通用",
    "OkwwConfig": "OKWW",
    "OkNteConfig": "OKNTE",
}

SCRIPT_ADD_TYPES: list[tuple[str, str]] = [
    ("MAA", "MAA"),
    ("MaaEnd", "终末地"),
    ("M9A", "M9A"),
    ("MaaFW", "MaaFramework"),
    ("HSR", "星穹铁道"),
    ("BetterGI", "BetterGI"),
    ("ZzzOd", "绝区零"),
    ("BAAH", "蔚蓝档案"),
    ("Whimbox", "奇想盒"),
    ("MSS", "MSS"),
    ("Okww", "OKWW"),
    ("OkNte", "OKNTE"),
    ("SRC", "SRC"),
    ("General", "通用"),
]

USER_TYPE_LABELS: dict[str, str] = {
    label.replace("Config", ""): name for label, name in SCRIPT_TYPE_LABELS.items()
}


def _strip_json_comments(text: str) -> str:
    """去掉 JSON 里的 // 和 /* */ 注释（MaaFramework 的 interface.json 允许注释）。"""
    out: list[str] = []
    i = 0
    n = len(text)
    in_str = False
    esc = False
    while i < n:
        ch = text[i]
        if in_str:
            out.append(ch)
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            i += 1
            continue
        if ch == '"':
            in_str = True
            out.append(ch)
            i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] not in "\r\n":
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            i += 2
            while i + 1 < n and not (text[i] == "*" and text[i + 1] == "/"):
                i += 1
            i += 2
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def _load_interface_file(path: Path) -> dict[str, Any]:
    raw = path.read_text(encoding="utf-8-sig")
    data = json.loads(_strip_json_comments(raw))
    return data if isinstance(data, dict) else {}


def _merge_interface(path: Path, seen: list[str] | None = None) -> dict[str, Any]:
    """把 interface.json 和它 import 的子文件合并成一份定义。"""
    seen = seen if seen is not None else []
    key = str(path)
    if key in seen:
        return {"task": [], "option": {}, "group": [], "preset": []}
    seen.append(key)
    try:
        data = _load_interface_file(path)
    except (OSError, ValueError):
        return {"task": [], "option": {}, "group": [], "preset": []}
    merged: dict[str, Any] = {
        "task": list(data.get("task") or []),
        "option": dict(data.get("option") or {}),
        "group": list(data.get("group") or []),
        "preset": list(data.get("preset") or []),
    }
    for rel in data.get("import") or []:
        if not isinstance(rel, str) or not rel.strip():
            continue
        sub_path = (path.parent / rel.strip()).resolve()
        sub = _merge_interface(sub_path, seen)
        merged["task"].extend(sub["task"])
        for name, cfg in sub["option"].items():
            merged["option"].setdefault(name, cfg)
        merged["group"].extend(sub["group"])
        merged["preset"].extend(sub["preset"])
    return merged


def _plain_text(value: Any, limit: int = 240) -> str:
    """把 MaaFW 的 HTML 描述压成一行纯文本。"""
    text = str(value or "")
    for token in ("<br/>", "<br>", "<br />", "</p>", "</div>"):
        text = text.replace(token, " ")
    out: list[str] = []
    skip = False
    for ch in text:
        if ch == "<":
            skip = True
            continue
        if ch == ">":
            skip = False
            continue
        if not skip:
            out.append(ch)
    cleaned = "".join(out)
    cleaned = cleaned.replace("![", " ")
    cleaned = " ".join(cleaned.split())
    return cleaned[:limit]

class MasError(RuntimeError):
    """AUTO-MAS 连不上、返回失败或返回了非 JSON。"""


def _describe_http_error(response: httpx.Response) -> str:
    """把 FastAPI 的 422 detail 摘成人话，避免只看到一个光秃秃的状态码。"""
    try:
        body = response.json()
    except ValueError:
        text = (response.text or "").strip()
        return text[:200] if text else f"HTTP {response.status_code}"
    detail = body.get("detail") if isinstance(body, dict) else None
    if isinstance(detail, list):
        parts = []
        for item in detail[:5]:
            if not isinstance(item, dict):
                continue
            loc = ".".join(str(x) for x in (item.get("loc") or []))
            msg = str(item.get("msg") or "")
            parts.append(f"{loc}: {msg}" if loc else msg)
        if parts:
            return "；".join(parts)
    if isinstance(detail, str):
        return detail
    return f"HTTP {response.status_code}"


class MasClient:
    """按需创建 httpx 连接，单次调用自成一体。"""

    def __init__(self, base_url: str = DEFAULT_BASE_URL, timeout: float = 15.0):
        self.base_url = (base_url or DEFAULT_BASE_URL).rstrip("/")
        self.timeout = float(timeout)

    async def _request(
        self,
        method: str,
        path: str,
        payload: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        url = f"{self.base_url}{path}"
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout, trust_env=False
            ) as client:
                response = await client.request(method, url, json=payload, params=params)
                response.raise_for_status()
                body = response.json()
        except httpx.HTTPStatusError as exc:
            raise MasError(
                f"AUTO-MAS 拒绝了这次请求（{url}）: {_describe_http_error(exc.response)}"
            ) from exc
        except httpx.HTTPError as exc:
            raise MasError(f"连接 AUTO-MAS 失败（{url}）: {exc}") from exc
        except ValueError as exc:
            raise MasError(f"AUTO-MAS 返回了非 JSON 内容（{url}）") from exc

        if not isinstance(body, dict):
            raise MasError(f"AUTO-MAS 返回格式异常（{url}）")

        # OutBase.code 默认 200，业务失败时是 409 / 500
        if body.get("code", 200) != 200:
            raise MasError(str(body.get("message") or "AUTO-MAS 返回失败"))
        return body

    # ---- 脚本托管项 ----

    async def get_scripts(self) -> list[dict[str, Any]]:
        """返回脚本托管项列表，每项带 uid / type / 显示名 / 账号数。"""
        body = await self._request("POST", "/api/scripts/get", {})
        index = body.get("index") or []
        data = body.get("data") or {}
        result = []
        for item in index:
            uid = str(item.get("uid") or "")
            cfg = data.get(uid) or {}
            info = cfg.get("Info") or {}
            script_type = str(item.get("type") or "")
            result.append(
                {
                    "uid": uid,
                    "type": script_type,
                    "typeLabel": SCRIPT_TYPE_LABELS.get(script_type, script_type),
                    "name": str(info.get("Name") or uid),
                    # Info.Status 在真实配置里常常是 None（字段没写），
                    # 只有显式 false 才算停用
                    "status": info.get("Status") is not False,
                }
            )
        return result

    # ---- 账号（用户配置） ----

    async def get_users(self, script_id: str) -> list[dict[str, Any]]:
        """返回某个托管项下的账号列表。"""
        body = await self._request(
            "POST", "/api/scripts/user/get", {"scriptId": script_id}
        )
        index = body.get("index") or []
        data = body.get("data") or {}
        result = []
        for item in index:
            uid = str(item.get("uid") or "")
            cfg = data.get(uid) or {}
            info = cfg.get("Info") or {}
            result.append(
                {
                    "uid": uid,
                    "type": str(item.get("type") or ""),
                    "name": str(info.get("Name") or uid),
                    "status": info.get("Status") is not False,
                    "base": str(info.get("Base") or ""),
                    "quickConfig": info.get("IfQuickConfig") is not False,
                }
            )
        return result

    async def get_user_raw(self, script_id: str, user_id: str) -> dict[str, Any]:
        """返回单账号完整配置（含嵌套分组），用于表单回填与克隆。"""
        body = await self._request(
            "POST", "/api/scripts/user/get", {"scriptId": script_id, "userId": user_id}
        )
        data = body.get("data") or {}
        cfg = data.get(user_id)
        if not isinstance(cfg, dict):
            raise MasError(f"账号 {user_id} 的数据为空")
        return cfg

    async def add_user(self, script_id: str) -> dict[str, Any]:
        """新建一个默认配置的账号，返回 {userId, data}。"""
        body = await self._request(
            "POST", "/api/scripts/user/add", {"scriptId": script_id}
        )
        return {"userId": str(body.get("userId") or ""), "data": body.get("data") or {}}

    async def update_user(
        self, script_id: str, user_id: str, data: dict[str, Any]
    ) -> None:
        """覆盖写入账号配置。data 用 get_user_raw 拿到的完整结构，改完再写回。"""
        await self._request(
            "POST",
            "/api/scripts/user/update",
            {"scriptId": script_id, "userId": user_id, "data": data},
        )

    async def create_user(self, script_id: str, name: str = "") -> dict[str, Any]:
        """新建一个默认配置的账号，可顺手改名。返回 {userId, name}。"""
        created = await self.add_user(script_id)
        new_id = created["userId"]
        if not new_id:
            raise MasError("新建账号失败：AUTO-MAS 未返回 userId")
        data = created["data"]
        if name:
            info = data.setdefault("Info", {})
            info["Name"] = name
            await self.update_user(script_id, new_id, data)
        info = data.get("Info") or {}
        return {"userId": new_id, "name": str(info.get("Name") or "")}

    async def delete_user(self, script_id: str, user_id: str) -> None:
        """删除账号，连带 MAS 里的用户目录一起删。"""
        await self._request(
            "POST",
            "/api/scripts/user/delete",
            {"scriptId": script_id, "userId": user_id},
        )

    async def set_user_status(
        self, script_id: str, user_id: str, status: bool
    ) -> bool:
        """只改账号的启用状态（Info.Status），其余配置原样写回。"""
        data = await self.get_user_raw(script_id, user_id)
        info = data.get("Info")
        if not isinstance(info, dict):
            info = {}
            data["Info"] = info
        info["Status"] = bool(status)
        await self.update_user(script_id, user_id, data)
        return bool(status)

    async def clone_user(
        self, script_id: str, source_user_id: str, name: str = ""
    ) -> dict[str, Any]:
        """新建账号并复制源账号配置。

        AUTO-MAS 的 user/add 只接收 scriptId，不带配置，所以克隆必须两步：
        先 add_user 拿到新 userId，再把源账号的完整 data 改掉名字写进去。
        """
        source = await self.get_user_raw(script_id, source_user_id)
        created = await self.add_user(script_id)
        new_id = created["userId"]
        if not new_id:
            raise MasError("新建账号失败：AUTO-MAS 未返回 userId")

        cloned = _deepcopy_json(source)
        info = cloned.setdefault("Info", {})
        info["Name"] = name or f"{info.get('Name') or '账号'} 副本"
        await self.update_user(script_id, new_id, cloned)
        return {"userId": new_id, "name": info["Name"]}

    # ---- 任务调度 ----

    async def start_task(
        self,
        task_id: str,
        mode: str = "AutoProxy",
        user_ids: list[str] | None = None,
    ) -> str:
        """启动一个任务。mode=AutoProxy 跑脚本自动代理，taskId 传脚本 ID。"""
        payload: dict[str, Any] = {"mode": mode, "taskId": task_id}
        if user_ids:
            payload["userIds"] = user_ids
        body = await self._request("POST", "/api/dispatch/start", payload)
        return str(body.get("taskId") or "")

    async def stop_task(self, task_id: str) -> None:
        await self._request("POST", "/api/dispatch/stop", {"taskId": task_id})

    async def runtime_snapshot(self) -> dict[str, Any]:
        return await self._request("GET", "/api/dispatch/runtime-snapshot")

    async def task_status(self, task_id: str) -> dict[str, Any]:
        return await self._request("GET", f"/api/dispatch/task/{task_id}")

    # ---- 运行快照 ----

    async def running_tasks(self) -> list[dict[str, Any]]:
        """返回当前运行中的任务，已拍平成前端和指令都能直接用的形状。"""
        return parse_runtime_snapshot(await self.runtime_snapshot())

    # ---- 托管项（脚本）增删改 ----

    async def get_script_raw(self, script_id: str) -> dict[str, Any]:
        """返回单个托管项的完整配置（Emulator / Info / Run / Update）。"""
        body = await self._request("POST", "/api/scripts/get", {"scriptId": script_id})
        data = body.get("data") or {}
        cfg = data.get(script_id)
        if not isinstance(cfg, dict):
            raise MasError(f"托管项 {script_id} 的数据为空")
        return cfg

    async def add_script(self, script_type: str, copy_from: str = "") -> dict[str, Any]:
        """新建托管项；copy_from 非空时整份复制已有托管项（含它下面的账号）。"""
        payload: dict[str, Any] = {"type": script_type}
        if copy_from:
            payload["scriptId"] = copy_from
        body = await self._request("POST", "/api/scripts/add", payload)
        return {"scriptId": str(body.get("scriptId") or ""), "data": body.get("data") or {}}

    async def update_script(self, script_id: str, data: dict[str, Any]) -> None:
        """写回托管项配置，data 用 get_script_raw 拿到的完整结构。"""
        await self._request(
            "POST", "/api/scripts/update", {"scriptId": script_id, "data": data}
        )

    async def delete_script(self, script_id: str) -> None:
        """删除托管项，连带它下面的账号一起删。"""
        await self._request("POST", "/api/scripts/delete", {"scriptId": script_id})

    async def reorder_scripts(self, index_list: list[str]) -> None:
        await self._request("POST", "/api/scripts/order", {"indexList": index_list})

    # ---- 模拟器 ----

    async def get_emulators(self) -> list[dict[str, Any]]:
        body = await self._request("POST", "/api/emulator/get", {})
        index = body.get("index") or []
        data = body.get("data") or {}
        result = []
        for item in index:
            uid = str(item.get("uid") or "")
            cfg = data.get(uid) or {}
            info = cfg.get("Info") or {}
            result.append(
                {
                    "uid": uid,
                    "data": cfg,
                    "name": str(info.get("Name") or uid),
                    "type": str(info.get("Type") or ""),
                    "path": str(info.get("Path") or ""),
                    "slots": info.get("Slots") or "[]",
                }
            )
        return result

    async def emulator_status(self) -> dict[str, Any]:
        body = await self._request("POST", "/api/emulator/status", {})
        data = body.get("data")
        return data if isinstance(data, dict) else {}

    async def add_emulator(self) -> dict[str, Any]:
        body = await self._request("POST", "/api/emulator/add", {})
        return {"emulatorId": str(body.get("emulatorId") or ""), "data": body.get("data") or {}}

    async def update_emulator(self, emulator_id: str, data: dict[str, Any]) -> None:
        await self._request(
            "POST", "/api/emulator/update", {"emulatorId": emulator_id, "data": data}
        )

    async def delete_emulator(self, emulator_id: str) -> None:
        await self._request("POST", "/api/emulator/delete", {"emulatorId": emulator_id})

    async def operate_emulator(self, emulator_id: str, operate: str, index: str = "0") -> None:
        """operate 只认 open / close / show。"""
        await self._request(
            "POST",
            "/api/emulator/operate",
            {"emulatorId": emulator_id, "operate": operate, "index": index},
        )

    async def search_emulators(self) -> list[dict[str, Any]]:
        body = await self._request("POST", "/api/emulator/emulator/search", {})
        items = body.get("emulators") or []
        return [item for item in items if isinstance(item, dict)]

    # ---- 全局设置 / 通知渠道 ----

    async def get_stage_options(self) -> list[dict[str, Any]]:
        """从信息总览里取当前可用的理智关卡（Resource + 活动关）。"""
        body = await self._request("POST", "/api/info/get/overview", {})
        data = body.get("data") if isinstance(body.get("data"), dict) else {}
        stage = (data or {}).get("Stage") or {}
        result: list[dict[str, Any]] = []
        seen: set[str] = set()
        for group in ("Resource", "Activity"):
            entries = stage.get(group) or []
            if not isinstance(entries, list):
                continue
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                value = str(entry.get("Value") or "").strip()
                if not value or value in seen:
                    continue
                seen.add(value)
                display = str(entry.get("Display") or value)
                drop = str(entry.get("DropName") or "")
                act = entry.get("Activity") if isinstance(entry.get("Activity"), dict) else {}
                tip = str(act.get("Tip") or "")
                label = display
                if drop:
                    label = f"{label} · {drop}"
                if tip:
                    label = f"{label}（{tip}）"
                result.append(
                    {
                        "value": value,
                        "label": label,
                        "source": "activity" if group == "Activity" else "resource",
                        "drop": str(entry.get("Drop") or ""),
                        "dropName": str(entry.get("DropName") or ""),
                    }
                )
        return result

    async def scan_maaend_tasks(self, script_id: str) -> list[dict[str, Any]]:
        """列出这个终末地托管项能勾的 MaaEnd 任务名（含中文名）。

        任务名在 MaaEnd 项目里是固定的：locales/interface/zh_cn.json 的
        task.<Name>.label 就是官方中文名，比读 tasks/*.json 快得多。
        """
        script = await self.get_script_raw(script_id)
        root = str((script.get("Info") or {}).get("Path") or "").strip()
        if not root:
            return []
        locale = Path(root) / "locales" / "interface" / "zh_cn.json"
        if not locale.is_file():
            return []
        try:
            table = json.loads(locale.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            raise MasError(f"读不了 MaaEnd 语言表 {locale}：{exc}") from exc
        if not isinstance(table, dict):
            return []
        tasks: list[dict[str, Any]] = []
        for key, value in table.items():
            if not key.startswith("task.") or not key.endswith(".label"):
                continue
            name = key[len("task.") : -len(".label")]
            if not name or "." in name or name in MAAEND_TASK_SKIP:
                continue
            label = str(value or name)
            tasks.append({"value": name, "label": label})
        tasks.sort(key=lambda item: item["label"])
        return tasks

    async def scan_maafw_definition(self, script_id: str) -> dict[str, Any]:
        """读 MaaFW 项目自带的 interface.json，给出任务、选项和预设。

        MaaFramework 的界面文件支持注释，也会 import 拆成多个文件，这里合并成一份：
        任务（默认勾选、所属分组、HTML 描述压成纯文本）、每个任务的选项（switch /
        select / input，带候选与子选项）、以及官方的预设（一键套用任务清单）。
        """
        script = await self.get_script_raw(script_id)
        root = str((script.get("Info") or {}).get("Path") or "").strip()
        if not root:
            raise MasError("这个托管项没配路径，先到「托管」页把 Path 填上")
        path = Path(root) / "interface.json"
        if not path.is_file():
            raise MasError(f"没找到 {path}，这个目录里没有 interface.json")
        merged = _merge_interface(path)
        options = merged["option"]

        def option_def(opt_name: str) -> dict[str, Any] | None:
            cfg = options.get(opt_name)
            if not isinstance(cfg, dict):
                return None
            cases: list[dict[str, Any]] = []
            for case in cfg.get("cases") or []:
                if not isinstance(case, dict):
                    continue
                children: list[str] = []
                for child in case.get("option") or []:
                    child_name = child.get("name") if isinstance(child, dict) else child
                    if isinstance(child_name, str) and child_name:
                        children.append(child_name)
                cases.append(
                    {
                        "name": str(case.get("name") or ""),
                        "label": str(case.get("label") or case.get("name") or ""),
                        "options": children,
                    }
                )
            return {
                "name": opt_name,
                "label": str(cfg.get("label") or opt_name),
                "description": _plain_text(cfg.get("description")),
                "type": str(cfg.get("type") or "select"),
                "defaultCase": str(cfg.get("default_case") or ""),
                "cases": cases,
            }

        tasks: list[dict[str, Any]] = []
        for task in merged["task"]:
            if not isinstance(task, dict):
                continue
            task_name = str(task.get("name") or "").strip()
            if not task_name:
                continue
            items: list[dict[str, Any]] = []
            for opt_name in task.get("option") or []:
                if not isinstance(opt_name, str):
                    continue
                cfg = option_def(opt_name)
                if cfg:
                    items.append(cfg)
            tasks.append(
                {
                    "name": task_name,
                    "group": str(task.get("group") or ""),
                    "defaultCheck": bool(task.get("default_check")),
                    "description": _plain_text(task.get("description")),
                    "options": items,
                }
            )

        presets: list[dict[str, Any]] = []
        for preset in merged["preset"]:
            if not isinstance(preset, dict):
                continue
            entries: list[dict[str, Any]] = []
            for item in preset.get("task") or []:
                if not isinstance(item, dict):
                    continue
                entries.append(
                    {
                        "name": str(item.get("name") or ""),
                        "enabled": bool(item.get("enabled", True)),
                    }
                )
            presets.append(
                {
                    "name": str(preset.get("name") or ""),
                    "label": str(preset.get("label") or preset.get("name") or ""),
                    "tasks": entries,
                }
            )

        groups: list[str] = []
        for group in merged["group"]:
            if not isinstance(group, dict):
                continue
            group_name = str(group.get("name") or "")
            if group_name:
                groups.append(group_name)
        return {"dir": str(path), "tasks": tasks, "presets": presets, "groups": groups}

    async def get_maaend_options(self, script_id: str) -> dict[str, Any]:
        """MaaEnd（终末地）的可选项：采集路线、基质地点、控制器等，label 都是中文。"""
        body = await self._request(
            "POST", "/api/scripts/maaend/options", {"scriptId": script_id}
        )
        if not isinstance(body, dict):
            return {}
        return body

    async def get_oknte_configs(self, script_id: str, user_id: str) -> dict[str, Any]:
        """OK-NTE 的任务流程配置文件（7 份 json）连同字段 schema 一起取回。

        返回体形如 {code, status, message, data:[{filename, displayName, group, taskIndex,
        fieldCount, fields, currentData, parseError}], optionLabels, configPath}。
        fields 里每项含 name/type/label/description/value/options/children/itemDefinitions/min/max，
        上游脚本升级后字段会自己变，前端按 type 渲染即可。
        """
        body = await self._request(
            "POST",
            "/api/scripts/oknte/configs/list",
            params={"script_id": script_id, "user_id": user_id},
        )
        if not isinstance(body, dict):
            return {"files": [], "optionLabels": {}, "configPath": "", "message": ""}
        files = body.get("data")
        return {
            "files": files if isinstance(files, list) else [],
            "optionLabels": body.get("optionLabels") or {},
            "configPath": body.get("configPath") or "",
            "message": body.get("message") or "",
        }

    async def update_oknte_configs(
        self, script_id: str, user_id: str, configs: dict[str, Any]
    ) -> dict[str, Any]:
        """按文件写回 OK-NTE 任务流程配置（configs 形如 {filename: data}）。"""
        body = await self._request(
            "POST",
            "/api/scripts/oknte/configs/batch-update",
            {"script_id": script_id, "user_id": user_id, "configs": configs},
        )
        if not isinstance(body, dict):
            return {"updated": [], "message": ""}
        updated = body.get("data")
        return {
            "updated": updated if isinstance(updated, list) else [],
            "message": body.get("message") or "",
        }
    async def get_whimbox_catalog(self, script_id: str) -> dict[str, Any]:
        """Whimbox（奇想盒）一条龙任务目录：步骤开关 + 目标/参数字段。

        字段定义与值域由 AUTO-MAS 从上游安装目录三件套运行时转换，上游升级后自动生效。
        每一步不是稳定的接口形状，所以这里只做透传和字段重命名。
        """
        body = await self._request(
            "GET",
            "/api/scripts/whimbox/task-catalog",
            params={"scriptId": script_id},
        )
        if not isinstance(body, dict):
            return {"steps": [], "options": [], "version": "", "message": ""}
        data = body.get("data") or {}
        steps: list[dict[str, Any]] = []
        for item in data.get("steps") or []:
            if not isinstance(item, dict):
                continue
            key = str(item.get("key") or "")
            if not key:
                continue
            steps.append(
                {
                    "key": key,
                    "name": str(item.get("display") or key),
                    "section": str(item.get("section") or ""),
                }
            )
        options: list[dict[str, Any]] = []
        for item in data.get("options") or []:
            if not isinstance(item, dict):
                continue
            key = str(item.get("key") or "")
            if not key:
                continue
            options.append(
                {
                    "key": key,
                    "name": str(item.get("display") or key),
                    "section": str(item.get("section") or ""),
                    "type": str(item.get("field_type") or "text"),
                    "choices": [str(v) for v in (item.get("options") or []) if str(v) != ""],
                    "default": item.get("default"),
                }
            )
        return {
            "steps": steps,
            "options": options,
            "version": str(data.get("upstream_version") or ""),
            "message": str(body.get("message") or ""),
        }

    async def get_bettergi_one_dragon_configs(self, script_id: str) -> list[dict[str, str]]:
        """BetterGI 可选的一条龙配置名（安装目录 User/OneDragon/*.json）。"""
        body = await self._request(
            "GET",
            "/api/scripts/bettergi/one-dragon/configs",
            params={"scriptId": script_id},
        )
        items = body.get("data") or []
        result: list[dict[str, str]] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            value = str(item.get("value") or "")
            if not value:
                continue
            result.append({"value": value, "label": str(item.get("label") or value)})
        return result

    async def get_bettergi_custom_groups(
        self,
        script_id: str,
        user_id: str = "",
        config_name: str = "",
        use_mas_config: bool = False,
    ) -> list[dict[str, Any]]:
        """BetterGI 一条龙里的自定义配置组（非内置 8 组）及启用状态。

        use_mas_config=True（账号独立配置）时按 per-user 副本读，此时 userId 必填。
        """
        params: dict[str, Any] = {
            "scriptId": script_id,
            "useMasConfig": "true" if use_mas_config else "false",
        }
        if user_id:
            params["userId"] = user_id
        if config_name:
            params["configName"] = config_name
        body = await self._request(
            "GET", "/api/scripts/bettergi/one-dragon/custom-groups", params=params
        )
        items = body.get("data") or []
        result: list[dict[str, Any]] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name") or item.get("value") or "")
            if not name:
                continue
            result.append(
                {
                    "name": name,
                    "label": str(item.get("label") or name),
                    "enabled": item.get("enabled") is not False,
                }
            )
        return result

    async def get_zzzod_catalog(self, script_id: str) -> list[dict[str, Any]]:
        """绝区零一条龙的任务目录（app_id + 中文名 + 是否可配参数 + 排序权重）。"""
        body = await self._request(
            "GET", "/api/scripts/zzzod/catalog", params={"scriptId": script_id}
        )
        items = body.get("data") or []
        result: list[dict[str, Any]] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            app_id = str(item.get("app_id") or "")
            if not app_id:
                continue
            try:
                priority = int(item.get("priority") or 0)
            except (TypeError, ValueError):
                priority = 0
            result.append(
                {
                    "appId": app_id,
                    "name": str(item.get("app_name") or app_id),
                    "defaultGroup": bool(item.get("default_group")),
                    "configurable": bool(item.get("configurable")),
                    "jump": bool(item.get("jump")),
                    "priority": priority,
                }
            )
        result.sort(key=lambda entry: entry["priority"])
        return result

    async def get_depot_items(self, script_id: str) -> list[dict[str, str]]:
        """库存保持可选材料（DropId → 名称）。"""
        body = await self._request(
            "POST", "/api/scripts/maa/depot/items", {"scriptId": script_id}
        )
        items = body.get("data") or []
        result: list[dict[str, str]] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            value = str(item.get("value") or "")
            if not value:
                continue
            result.append({"value": value, "label": str(item.get("label") or value)})
        return result

    async def get_cultivate_operators(
        self, script_id: str, user_id: str
    ) -> list[dict[str, Any]]:
        """养成目标选择器用的干员目录（含技能与模组）。"""
        body = await self._request(
            "POST",
            "/api/scripts/maa/cultivate/operators",
            {"script": {"scriptId": script_id}, "userId": user_id},
        )
        items = body.get("data") or []
        return [item for item in items if isinstance(item, dict)]

    async def scan_infrast_files(self, script_id: str, directory: str = "") -> dict[str, Any]:
        """扫描 MAA 自定义基建排班表目录，返回可导入的 *.json 清单。

        插件和 AUTO-MAS 一般跑在同一台机器上，这里直接按本地路径读；目录默认取
        托管项 Info.Path 下的 resource/custom_infrast（MAA 官方放排班表的位置）。
        """
        script = await self.get_script_raw(script_id)
        root = str((script.get("Info") or {}).get("Path") or "").strip()
        target = str(directory or "").strip()
        if not target:
            if not root:
                raise MasError("这个托管项没配 MAA 路径，先到「托管」页把 Path 填上")
            target = str(Path(root) / "resource" / "custom_infrast")
        path = Path(target)
        if not path.is_dir():
            return {"dir": str(path), "exists": False, "files": [], "root": root}
        try:
            entries = sorted(path.glob("*.json"))
        except OSError as exc:
            raise MasError(f"读不了目录 {path}：{exc}") from exc
        files: list[dict[str, Any]] = []
        for entry in entries[:200]:
            item: dict[str, Any] = {
                "path": str(entry),
                "name": entry.name,
                "size": 0,
                "title": "",
                "description": "",
                "plans": 0,
                "valid": False,
                "problem": "",
            }
            try:
                stat = entry.stat()
            except OSError as exc:
                item["problem"] = f"读不了文件：{exc}"
                files.append(item)
                continue
            item["size"] = stat.st_size
            if stat.st_size > 4 * 1024 * 1024:
                item["problem"] = "文件超过 4MB，跳过"
                files.append(item)
                continue
            try:
                raw = json.loads(entry.read_text(encoding="utf-8-sig"))
            except (OSError, ValueError) as exc:
                item["problem"] = f"不是合法 JSON：{exc}"
                files.append(item)
                continue
            if not isinstance(raw, dict):
                item["problem"] = "顶层不是 JSON 对象"
                files.append(item)
                continue
            plans = raw.get("plans")
            item["title"] = str(raw.get("title") or "")
            item["description"] = str(raw.get("description") or "")
            if isinstance(plans, list) and plans:
                item["plans"] = len(plans)
                item["valid"] = True
            else:
                item["problem"] = "没有 plans 数组，不像排班表"
            files.append(item)
        files.sort(key=lambda f: (not f["valid"], str(f["name"]).lower()))
        return {"dir": str(path), "exists": True, "files": files, "root": root}

    async def import_infrast_file(
        self, script_id: str, user_id: str, json_file: str
    ) -> dict[str, Any]:
        """把排班表文件导进账号，走 AUTO-MAS 自己的 /scripts/user/infrastructure。

        jsonFile 是 AUTO-MAS 那台机器上的路径（同一台机器时就是普通本地路径），
        文件是否存在交给 AUTO-MAS 判断，插件这边不预先检查，跨机部署也能用。
        """
        target = str(json_file or "").strip()
        if not target:
            raise MasError("没给排班表文件路径")
        body = await self._request(
            "POST",
            "/api/scripts/user/infrastructure",
            {"scriptId": script_id, "userId": user_id, "jsonFile": target},
        )
        return {"message": str(body.get("message") or "导入成功")}

    async def get_setting(self) -> dict[str, Any]:
        body = await self._request("POST", "/api/setting/get", {})
        data = body.get("data")
        return data if isinstance(data, dict) else {}

    async def update_setting(self, data: dict[str, Any]) -> None:
        """只传要改的叶子字段（后端 exclude_unset），别整份写回：Replay.Password 是掩码。"""
        await self._request("POST", "/api/setting/update", {"data": data})

    async def test_notify(self) -> None:
        await self._request("POST", "/api/setting/test_notify", {})

    async def get_webhooks(self) -> list[dict[str, Any]]:
        body = await self._request("POST", "/api/setting/webhook/get", {})
        index = body.get("index") or []
        data = body.get("data") or {}
        result = []
        for item in index:
            uid = str(item.get("uid") or "")
            cfg = data.get(uid) or {}
            info = cfg.get("Info") or {}
            result.append(
                {
                    "uid": uid,
                    "data": cfg,
                    "name": str(info.get("Name") or uid),
                    "enabled": info.get("Enabled") is True,
                }
            )
        return result

    async def add_webhook(self) -> dict[str, Any]:
        body = await self._request("POST", "/api/setting/webhook/add", {})
        return {"webhookId": str(body.get("webhookId") or ""), "data": body.get("data") or {}}

    async def update_webhook(self, webhook_id: str, data: dict[str, Any]) -> None:
        await self._request(
            "POST", "/api/setting/webhook/update", {"webhookId": webhook_id, "data": data}
        )

    async def delete_webhook(self, webhook_id: str) -> None:
        await self._request("POST", "/api/setting/webhook/delete", {"webhookId": webhook_id})

    async def test_webhook(self, data: dict[str, Any]) -> None:
        await self._request("POST", "/api/setting/webhook/test", {"data": data})

    # ---- 计划表（定时） ----

    async def get_plans(self) -> list[dict[str, Any]]:
        body = await self._request("POST", "/api/plan/get", {})
        index = body.get("index") or []
        data = body.get("data") or {}
        result = []
        for item in index:
            uid = str(item.get("uid") or "")
            result.append(
                {"uid": uid, "type": str(item.get("type") or ""), "data": data.get(uid) or {}}
            )
        return result

    async def get_plan_raw(self, plan_id: str) -> dict[str, Any]:
        """返回单个计划表的完整配置（Info + ALL + Monday..Sunday + Day1..DayN）。"""
        body = await self._request("POST", "/api/plan/get", {"planId": plan_id})
        data = body.get("data") or {}
        cfg = data.get(plan_id)
        if not isinstance(cfg, dict):
            raise MasError(f"计划表 {plan_id} 的数据为空")
        return cfg

    async def add_plan(self, plan_type: str = "MaaPlan") -> dict[str, Any]:
        """新建计划表，plan_type 只认 MaaPlan / MaaEndPlan。"""
        body = await self._request("POST", "/api/plan/add", {"type": plan_type})
        return {"planId": str(body.get("planId") or ""), "data": body.get("data") or {}}

    async def update_plan(self, plan_id: str, data: dict[str, Any]) -> None:
        """整份写回计划表。已实测全量 roundtrip 一致，MAS 不会丢未知键。"""
        await self._request(
            "POST", "/api/plan/update", {"planId": plan_id, "data": data}
        )

    async def delete_plan(self, plan_id: str) -> None:
        await self._request("POST", "/api/plan/delete", {"planId": plan_id})

    # ---- 调度队列 ----

    async def get_queues(self) -> list[dict[str, Any]]:
        """返回全部调度队列（原始 data + Info）。"""
        body = await self._request("POST", "/api/queue/get", {})
        index = body.get("index") or []
        data = body.get("data") or {}
        result = []
        for item in index:
            uid = str(item.get("uid") or "")
            result.append({"uid": uid, "type": str(item.get("type") or ""), "data": data.get(uid) or {}})
        return result

    async def get_queue_raw(self, queue_id: str) -> dict[str, Any]:
        body = await self._request("POST", "/api/queue/get", {"queueId": queue_id})
        data = body.get("data") or {}
        cfg = data.get(queue_id)
        if not isinstance(cfg, dict):
            raise MasError(f"队列 {queue_id} 的数据为空")
        return cfg

    async def add_queue(self) -> dict[str, Any]:
        body = await self._request("POST", "/api/queue/add", {})
        return {"queueId": str(body.get("queueId") or ""), "data": body.get("data") or {}}

    async def update_queue(self, queue_id: str, data: dict[str, Any]) -> None:
        """只传要改的字段（后端走 exclude_unset，未传字段保持原值）。"""
        await self._request("POST", "/api/queue/update", {"queueId": queue_id, "data": data})

    async def delete_queue(self, queue_id: str) -> None:
        await self._request("POST", "/api/queue/delete", {"queueId": queue_id})

    async def get_time_sets(self, queue_id: str) -> list[dict[str, Any]]:
        body = await self._request("POST", "/api/queue/time/get", {"queueId": queue_id})
        index = body.get("index") or []
        data = body.get("data") or {}
        return [{"uid": str(i.get("uid") or ""), "data": data.get(str(i.get("uid") or "")) or {}} for i in index]

    async def add_time_set(self, queue_id: str) -> dict[str, Any]:
        body = await self._request("POST", "/api/queue/time/add", {"queueId": queue_id})
        return {"timeSetId": str(body.get("timeSetId") or ""), "data": body.get("data") or {}}

    async def update_time_set(self, queue_id: str, time_set_id: str, data: dict[str, Any]) -> None:
        await self._request(
            "POST", "/api/queue/time/update", {"queueId": queue_id, "timeSetId": time_set_id, "data": data}
        )

    async def delete_time_set(self, queue_id: str, time_set_id: str) -> None:
        await self._request(
            "POST", "/api/queue/time/delete", {"queueId": queue_id, "timeSetId": time_set_id}
        )

    async def get_queue_items(self, queue_id: str) -> list[dict[str, Any]]:
        body = await self._request("POST", "/api/queue/item/get", {"queueId": queue_id})
        index = body.get("index") or []
        data = body.get("data") or {}
        return [{"uid": str(i.get("uid") or ""), "data": data.get(str(i.get("uid") or "")) or {}} for i in index]

    async def add_queue_item(self, queue_id: str) -> dict[str, Any]:
        body = await self._request("POST", "/api/queue/item/add", {"queueId": queue_id})
        return {"queueItemId": str(body.get("queueItemId") or ""), "data": body.get("data") or {}}

    async def update_queue_item(self, queue_id: str, item_id: str, data: dict[str, Any]) -> None:
        await self._request(
            "POST", "/api/queue/item/update", {"queueId": queue_id, "queueItemId": item_id, "data": data}
        )

    async def delete_queue_item(self, queue_id: str, item_id: str) -> None:
        await self._request(
            "POST", "/api/queue/item/delete", {"queueId": queue_id, "queueItemId": item_id}
        )

    async def reorder_queue_items(self, queue_id: str, index_list: list[str]) -> None:
        await self._request(
            "POST", "/api/queue/item/order", {"queueId": queue_id, "indexList": index_list}
        )


    # ---- 运行历史 ----

    async def search_history(self, start_date: str, end_date: str, mode: str = "DAILY") -> dict[str, Any]:
        """按月/周/日搜历史，返回 {日期: {用户名: HistoryData}}。"""
        body = await self._request(
            "POST",
            "/api/history/search",
            {"mode": mode, "start_date": start_date, "end_date": end_date},
        )
        data = body.get("data")
        return data if isinstance(data, dict) else {}

    async def get_history_data(self, json_path: str) -> dict[str, Any]:
        """读某次运行的完整记录（含 log_content）。"""
        body = await self._request("POST", "/api/history/data", {"jsonPath": json_path})
        data = body.get("data")
        return data if isinstance(data, dict) else {}


def parse_runtime_snapshot(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    """解析 /api/dispatch/runtime-snapshot 的 tasks 数组。

    真实返回是 TaskRuntimeSnapshot 本体（没有 code/data 包装）：
    {"tasks": [{taskId, mode, isCycle, scriptId, userId, stopping, ...}], "scheduledScripts": [...]}
    """
    tasks = snapshot.get("tasks") if isinstance(snapshot, dict) else None
    if not isinstance(tasks, list):
        return []
    result: list[dict[str, Any]] = []
    for item in tasks:
        if not isinstance(item, dict):
            continue
        task_id = str(item.get("taskId") or "")
        if not task_id:
            continue
        result.append(
            {
                "taskId": task_id,
                "mode": str(item.get("mode") or ""),
                "scriptId": str(item.get("scriptId") or ""),
                "userId": str(item.get("userId") or ""),
                "isCycle": bool(item.get("isCycle")),
                "stopping": bool(item.get("stopping")),
            }
        )
    return result


def _deepcopy_json(value: Any) -> Any:
    """只处理 JSON 结构，避免为了深拷贝引入 import copy 的额外语义。"""
    if isinstance(value, dict):
        return {key: _deepcopy_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_deepcopy_json(item) for item in value]
    return value
