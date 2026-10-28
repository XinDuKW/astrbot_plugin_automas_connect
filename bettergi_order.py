#   AUTO-MAS 调度台：BetterGI 一条龙的「真实执行顺序」
#   一条龙的顺序由 AUTO-MAS 的 OneDragon.Queue（可视化队列）决定，不是 Groups 数组顺序：
#   Groups 只是 8 个内置组的开关表，Queue 为空时运行时沿用 BGI 配置里 TaskOrder 的相对顺序。
#   这个模块读「实际会按什么顺序跑」，并给出候选条目（内置组 / 自定义配置组 / JS / 录制 / 路径）。
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

CONFIG_REL = Path("User") / "OneDragon"
DEFAULT_CONFIG_NAME = "默认配置"

BUILTIN_GROUPS = [
    "领取邮件",
    "合成树脂",
    "自动幽境危战",
    "自动地脉花",
    "自动首领讨伐",
    "自动秘境",
    "领取尘歌壶奖励",
    "领取每日奖励",
]

_KINDS = ("builtin", "js", "pathing", "scriptgroup", "keymouse", "custom")


def config_name(value: str) -> str:
    return (value or "").strip() or DEFAULT_CONFIG_NAME


def parse_queue(raw: Any) -> list[dict[str, Any]]:
    """把账号里的 OneDragon.Queue（JSON 字符串或列表）解析成有序条目。"""
    if isinstance(raw, list):
        data = raw
    elif isinstance(raw, str):
        text = raw.strip()
        if not text:
            return []
        try:
            data = json.loads(text)
        except (TypeError, ValueError):
            return []
        if not isinstance(data, list):
            return []
    else:
        return []
    items: list[dict[str, Any]] = []
    for entry in data:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name") or "").strip()
        if not name:
            continue
        kind = "builtin" if name in BUILTIN_GROUPS else str(entry.get("kind") or "").strip()
        if kind not in _KINDS:
            kind = "custom"
        items.append(
            {
                "kind": kind,
                "name": name,
                "enabled": entry.get("enabled") is not False,
            }
        )
    return items


def queue_payload(items: list[dict[str, Any]]) -> str:
    """把有序条目写回 OneDragon.Queue（JSON 字符串）。"""
    out: list[dict[str, Any]] = []
    for entry in items or []:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name") or "").strip()
        if not name:
            continue
        kind = "builtin" if name in BUILTIN_GROUPS else str(entry.get("kind") or "").strip()
        if kind not in _KINDS:
            kind = "custom"
        out.append({"kind": kind, "name": name, "enabled": entry.get("enabled") is not False})
    return json.dumps(out, ensure_ascii=False)


def groups_for(items: list[dict[str, Any]]) -> list[str]:
    """Groups 只放「启用中的内置组」，顺序按队列；战斗 4 项的启停靠它。"""
    seen: list[str] = []
    for entry in items or []:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name") or "").strip()
        if name in BUILTIN_GROUPS and entry.get("enabled") is not False and name not in seen:
            seen.append(name)
    return seen


def resolve_config_path(
    root: str,
    mas_data_dir: str,
    script_id: str,
    user_id: str,
    base: str,
    name: str = "",
) -> Path | None:
    """定位一条龙配置文件：独立基线读 MAS 的 per-user 副本，其余读 BGI 安装目录。

    与 AUTO-MAS 的 one_dragon.per_user_one_dragon_path / one_dragon_path 同规则。
    """
    stem = config_name(name)
    if (base or "").strip().lower() == "independent" and user_id:
        data_dir = (mas_data_dir or "").strip()
        if data_dir:
            return Path(data_dir) / script_id / user_id / "OneDragon" / f"{stem}.json"
    root_text = (root or "").strip()
    if not root_text:
        return None
    return Path(root_text) / CONFIG_REL / f"{stem}.json"


def read_config(path: Path | None) -> dict[str, Any] | None:
    if path is None or not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def order_from_config(config: dict[str, Any] | None) -> list[dict[str, Any]]:
    """BGI 配置里的 TaskOrder + TaskEnabledList → 有序条目。"""
    if not isinstance(config, dict):
        return []
    definitions = config.get("TaskDefinitions") or {}
    enabled = config.get("TaskEnabledList") or {}
    order = config.get("TaskOrder") or []
    items: list[dict[str, Any]] = []
    for uid in order:
        name = str(definitions.get(uid) or "").strip()
        if not name:
            continue
        items.append(
            {
                "kind": "builtin" if name in BUILTIN_GROUPS else "custom",
                "name": name,
                "enabled": enabled.get(uid) is not False,
            }
        )
    return items


def build_order(
    one_dragon: dict[str, Any],
    config: dict[str, Any] | None,
    custom_groups: list[dict[str, Any]] | None = None,
    config_path: Path | None = None,
) -> dict[str, Any]:
    """给出当前「实际执行顺序」及其来源（可视化队列 / BGI 配置 / 只有 Groups 兜底）。"""
    custom_names = {str(item.get("name") or "") for item in (custom_groups or []) if item}
    custom_enabled = {
        str(item.get("name") or ""): item.get("enabled") is not False
        for item in (custom_groups or [])
        if item
    }

    items = parse_queue((one_dragon or {}).get("Queue"))
    source = "queue"
    if not items:
        items = order_from_config(config)
        source = "config"
    if not items:
        groups = (one_dragon or {}).get("Groups") or []
        items = [
            {"kind": "builtin", "name": str(name).strip(), "enabled": True}
            for name in groups
            if str(name).strip()
        ]
        source = "groups"

    for entry in items:
        if entry["kind"] != "builtin" and entry["name"] in custom_names:
            entry["kind"] = "scriptgroup"
            entry["enabled"] = bool(entry.get("enabled", True)) and custom_enabled.get(
                entry["name"], True
            )

    return {
        "source": source,
        "configPath": str(config_path) if config_path is not None else "",
        "items": items,
    }
