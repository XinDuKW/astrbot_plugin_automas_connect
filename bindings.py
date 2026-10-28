"""QQ 号 → AUTO-MAS 账号 的绑定表。

一个 QQ 可以在多个托管项下各绑一个账号（用户说「玩 abcde」就是 5 个脚本各一个账号）。
绑定关系存在 data/plugin_data/<插件名>/bindings.json，插件升级覆盖代码不会丢。

结构：
{
  "version": 1,
  "users": {
    "<qq>": {
      "display": "群昵称",
      "updated": "2026-10-28T12:00:00",
      "scripts": {
        "<scriptId>": {"userId": "...", "userName": "...", "scriptName": "..."}
      }
    }
  }
}
"""

from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

PLUGIN_NAME = "astrbot_plugin_automas_connect"
DATA_FILE = "bindings.json"


def default_data_dir() -> Path:
    """优先用 AstrBot 的 data/plugin_data/<插件名>，拿不到就退到插件目录下的 data/。"""
    try:
        from astrbot.core.star.star_tools import StarTools

        path = Path(StarTools.get_data_dir(PLUGIN_NAME))
        if path:
            return path
    except Exception:  # noqa: BLE001 - 不同 AstrBot 版本差异较大，失败就退
        pass
    return Path(__file__).resolve().parent / "data"


class BindingStore:
    """绑定表，读写都在这里，其他模块只调方法。"""

    def __init__(self, data_dir: Path | None = None):
        self._dir = Path(data_dir) if data_dir else default_data_dir()
        self._file = self._dir / DATA_FILE
        self._data: dict[str, Any] = {"version": 1, "users": {}}
        self.load()

    # ---- 读写 ----

    def load(self) -> dict[str, Any]:
        try:
            raw = self._file.read_text(encoding="utf-8")
            data = json.loads(raw)
        except (OSError, ValueError):
            data = {}
        if not isinstance(data, dict):
            data = {}
        users = data.get("users")
        if not isinstance(users, dict):
            users = {}
        data["users"] = users
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

    def has_user(self, qq: str) -> bool:
        return str(qq) in self._data["users"]

    def user_record(self, qq: str) -> dict[str, Any]:
        return self._data["users"].get(str(qq)) or {}

    def bindings_of(self, qq: str) -> list[dict[str, str]]:
        """返回这个 QQ 的所有绑定，按托管项名字排好。"""
        scripts = (self.user_record(qq).get("scripts") or {})
        result = []
        for script_id, item in scripts.items():
            if not isinstance(item, dict):
                continue
            result.append(
                {
                    "scriptId": str(script_id),
                    "scriptName": str(item.get("scriptName") or script_id),
                    "userId": str(item.get("userId") or ""),
                    "userName": str(item.get("userName") or ""),
                }
            )
        result.sort(key=lambda entry: entry["scriptName"])
        return result

    def owner_of(self, script_id: str, user_id: str) -> str:
        """反查：这个 AUTO-MAS 账号被哪个 QQ 绑了，没绑返回空串。"""
        want_script = str(script_id)
        want_user = str(user_id)
        for qq, record in self._data["users"].items():
            scripts = record.get("scripts") or {}
            item = scripts.get(want_script)
            if isinstance(item, dict) and str(item.get("userId") or "") == want_user:
                return str(qq)
        return ""

    def all_users(self) -> dict[str, Any]:
        return dict(self._data["users"])

    # ---- 修改 ----

    def set_binding(
        self,
        qq: str,
        display: str,
        script_id: str,
        script_name: str,
        user_id: str,
        user_name: str,
    ) -> None:
        qq = str(qq)
        record = self._data["users"].setdefault(qq, {"display": "", "scripts": {}})
        if display:
            record["display"] = str(display)
        scripts = record.setdefault("scripts", {})
        scripts[str(script_id)] = {
            "userId": str(user_id),
            "userName": str(user_name),
            "scriptName": str(script_name),
        }
        record["updated"] = datetime.now().isoformat(timespec="seconds")
        self.save()

    def remove_binding(self, qq: str, script_id: str = "") -> int:
        """解绑；script_id 为空表示这个人的绑定全清。返回删掉的条数。"""
        qq = str(qq)
        record = self._data["users"].get(qq)
        if not isinstance(record, dict):
            return 0
        scripts = record.get("scripts") or {}
        if not script_id:
            removed = len(scripts)
            self._data["users"].pop(qq, None)
            if removed:
                self.save()
            return removed
        if str(script_id) not in scripts:
            return 0
        scripts.pop(str(script_id), None)
        if scripts:
            record["updated"] = datetime.now().isoformat(timespec="seconds")
        else:
            self._data["users"].pop(qq, None)
        self.save()
        return 1

    # ---- 给面板用 ----

    def overview(self, script_names: dict[str, str]) -> list[dict[str, Any]]:
        """把绑定表摊平成列表，供面板渲染。"""
        rows = []
        for qq, record in sorted(self._data["users"].items()):
            scripts = record.get("scripts") or {}
            rows.append(
                {
                    "qq": qq,
                    "display": str(record.get("display") or ""),
                    "updated": str(record.get("updated") or ""),
                    "bindings": [
                        {
                            "scriptId": script_id,
                            "scriptName": str(script_names.get(script_id) or item.get("scriptName") or script_id),
                            "userId": str(item.get("userId") or ""),
                            "userName": str(item.get("userName") or ""),
                        }
                        for script_id, item in scripts.items()
                        if isinstance(item, dict)
                    ],
                }
            )
        return rows
