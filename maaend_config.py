"""MaaEnd 原生配置读写：把「AUTO-MAS 不管的 MaaEnd 参数」做成可视化。

AUTO-MAS 只接管 MaaEnd 的一部分任务开关和参数（理智策略、采集路线、库存目标
等），像「售卖弹性物资」的调度券溢出阈值、三档定价这些数字，只存在于 MaaEnd
自己的配置里：

    <MaaEnd>/config/mxu-MaaEnd.json -> instances[].tasks[].optionValues

MAS 的账号配置里没有对应字段，所以面板直接读写这份文件。选项的类型、候选和
默认值来自 MaaEnd 自己的 tasks/*.json（由 interface.json 的 import 串起来），
写回时只动用户改过的那几个键，其余原样保留。

注意：这份配置属于 MaaEnd 安装目录，物理上被所有「原生」基线的账号共用，
改动会全局生效；共享 / 独立基线的账号用的是 MAS 目录下的副本，改这里不影响。
"""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

from .mas_api import _merge_interface

CONFIG_REL = Path("config") / "mxu-MaaEnd.json"
LOCALE_REL = Path("locales") / "interface" / "zh_cn.json"
INTERFACE_REL = Path("interface.json")

# 同一个 MaaEnd 目录反复读同一份合并结果，按 mtime 失效
_CATALOG_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_LOCALE_CACHE: dict[str, tuple[float, dict[str, str]]] = {}


class MaaEndError(RuntimeError):
    """MaaEnd 配置读不了、写不进去，或者用户改的是不认识的值。"""


def _strip_comments(text: str) -> str:
    """MaaFramework 的 interface 文件允许 // 和 /* */ 注释。"""

    out: list[str] = []
    index = 0
    size = len(text)
    in_string = False
    escaped = False
    while index < size:
        char = text[index]
        if in_string:
            out.append(char)
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            index += 1
            continue
        if char == '"':
            in_string = True
            out.append(char)
            index += 1
            continue
        if char == "/" and index + 1 < size and text[index + 1] == "/":
            while index < size and text[index] not in "\r\n":
                index += 1
            continue
        if char == "/" and index + 1 < size and text[index + 1] == "*":
            index += 2
            while index + 1 < size and not (text[index] == "*" and text[index + 1] == "/"):
                index += 1
            index += 2
            continue
        out.append(char)
        index += 1
    return "".join(out)


def _read_json(path: Path) -> Any:
    try:
        text = path.read_text(encoding="utf-8-sig")
    except OSError as exc:
        raise MaaEndError(f"读不了 {path}：{exc}") from exc
    try:
        return json.loads(text)
    except ValueError:
        try:
            return json.loads(_strip_comments(text))
        except ValueError as exc:
            raise MaaEndError(f"{path} 不是合法 JSON：{exc}") from exc


def _write_json(path: Path, data: Any) -> None:
    """原子写：先落临时文件再替换，写一半崩掉不会留下半个配置。"""

    payload = json.dumps(data, ensure_ascii=False, indent=2)
    handle = None
    tmp_path = ""
    try:
        fd, tmp_path = tempfile.mkstemp(prefix=".mxu-", suffix=".json", dir=str(path.parent))
        handle = os.fdopen(fd, "w", encoding="utf-8", newline="\n")
        handle.write(payload)
        handle.close()
        handle = None
        os.replace(tmp_path, path)
    except OSError as exc:
        raise MaaEndError(f"写不进 {path}：{exc}") from exc
    finally:
        if handle is not None:
            handle.close()
        if tmp_path and Path(tmp_path).exists():
            try:
                Path(tmp_path).unlink()
            except OSError:
                pass


def config_path(root: str | Path) -> Path:
    base = Path(str(root).strip())
    if not str(base):
        raise MaaEndError("这个托管项没配 MaaEnd 路径")
    return base / CONFIG_REL


MAS_CONFIG_REL = Path("ConfigFile") / "mxu-MaaEnd.json"
BASE_LABELS = {"native": "原生", "shared": "共享", "independent": "独立"}


def normalize_base(value: Any) -> str:
    """把账号的 Info.Base 归一成 native / shared / independent（默认共享）。"""

    text = str(value or "").strip().lower()
    if text in ("native", "原生", "local", "default"):
        return "native"
    if text in ("independent", "独立", "user"):
        return "independent"
    return "shared"


def target_config_file(
    root: str | Path,
    mas_data_dir: str | Path,
    script_id: str,
    user_id: str,
    base: Any,
) -> tuple[Path, str]:
    """按账号基线算出要读写的那份 mxu-MaaEnd.json。

    native → MaaEnd 安装目录；shared → <MAS>/data/<scriptId>/Default/ConfigFile；
    independent → <MAS>/data/<scriptId>/<userId>/ConfigFile。
    """

    kind = normalize_base(base)
    if kind == "native":
        return config_path(root), kind
    mas_data = str(mas_data_dir or "").strip()
    if not mas_data:
        raise MaaEndError(
            f"这个账号用的是{BASE_LABELS[kind]}基线，配置在 AUTO-MAS 的 data 目录里；"
            "先在插件配置里填「AUTO-MAS data 目录」再回来改"
        )
    sid = str(script_id or "").strip()
    if not sid:
        raise MaaEndError("缺 scriptId，没法定位这份配置")
    owner = "Default"
    if kind == "independent":
        uid = str(user_id or "").strip()
        if not uid:
            raise MaaEndError("独立基线的配置按账号分目录，缺 userId")
        owner = uid
    return Path(mas_data) / sid / owner / MAS_CONFIG_REL, kind


def _locale(root: Path) -> dict[str, str]:
    path = root / LOCALE_REL
    if not path.is_file():
        return {}
    try:
        stamp = path.stat().st_mtime
    except OSError:
        return {}
    cached = _LOCALE_CACHE.get(str(path))
    if cached is not None and cached[0] == stamp:
        return cached[1]
    try:
        table = _read_json(path)
    except MaaEndError:
        return {}
    flat: dict[str, str] = {}
    if isinstance(table, dict):
        for key, value in table.items():
            if isinstance(value, str):
                flat[str(key)] = value
    _LOCALE_CACHE[str(path)] = (stamp, flat)
    return flat


def _label(value: Any, locale: dict[str, str], fallback: str = "") -> str:
    text = str(value or "").strip()
    if text.startswith("$"):
        key = text[1:]
        return locale.get(key) or fallback or key
    return text or fallback


def _catalog(root: Path) -> dict[str, Any]:
    interface = root / INTERFACE_REL
    if not interface.is_file():
        raise MaaEndError(f"没找到 {interface}，这个目录不像 MaaEnd 安装目录")
    try:
        stamp = interface.stat().st_mtime
    except OSError as exc:
        raise MaaEndError(f"读不了 {interface}：{exc}") from exc
    cached = _CATALOG_CACHE.get(str(interface))
    if cached is not None and cached[0] == stamp:
        return cached[1]
    merged = _merge_interface(interface)
    tasks: dict[str, dict[str, Any]] = {}
    for item in merged.get("task") or []:
        if isinstance(item, dict):
            name = str(item.get("name") or "").strip()
            if name:
                tasks[name] = item
    options = merged.get("option") or {}
    catalog = {
        "tasks": tasks,
        "options": options if isinstance(options, dict) else {},
    }
    _CATALOG_CACHE[str(interface)] = (stamp, catalog)
    return catalog


def _instance(config: dict[str, Any]) -> dict[str, Any]:
    instances = config.get("instances")
    if not isinstance(instances, list) or not instances:
        raise MaaEndError("MaaEnd 配置里没有实例，先在 MaaEnd 里建一个实例")
    wanted = str(config.get("lastActiveInstanceId") or "")
    for item in instances:
        if isinstance(item, dict) and str(item.get("id") or "") == wanted:
            return item
    for item in instances:
        if isinstance(item, dict) and str(item.get("id") or "") == "automas":
            return item
    for item in instances:
        if isinstance(item, dict):
            return item
    raise MaaEndError("MaaEnd 配置里的实例不是对象")


def _task_entry(instance: dict[str, Any], task_name: str) -> dict[str, Any] | None:
    tasks = instance.get("tasks")
    if not isinstance(tasks, list):
        return None
    for item in tasks:
        if isinstance(item, dict) and str(item.get("taskName") or "") == task_name:
            return item
    return None


def _sorted_option_keys(task_def: dict[str, Any], options: dict[str, Any]) -> list[str]:
    """任务直接挂的选项在前，case 里再挂的选项在后，去重保序。"""

    ordered: list[str] = []
    seen: set[str] = set()

    def walk(name: Any, depth: int) -> None:
        if depth > 6:
            return
        text = str(name or "").strip()
        if not text or text in seen or text not in options:
            return
        seen.add(text)
        ordered.append(text)
        definition = options.get(text)
        if not isinstance(definition, dict):
            return
        for case in definition.get("cases") or []:
            if not isinstance(case, dict):
                continue
            for child in case.get("option") or []:
                walk(child.get("name") if isinstance(child, dict) else child, depth + 1)

    for name in task_def.get("option") or []:
        walk(name, 0)
    return ordered


def _as_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return bool(value)
    text = str(value or "").strip().lower()
    if text in {"1", "true", "yes", "on"}:
        return True
    if text in {"0", "false", "no", "off"}:
        return False
    return default


def _input_is_number(spec: dict[str, Any]) -> bool:
    pipeline_type = str(spec.get("pipeline_type") or "").strip().lower()
    if pipeline_type in {"int", "float", "double"}:
        return True
    verify = str(spec.get("verify") or "")
    return verify in {r"^\d+$", r"^[0-9]+$"} or verify.startswith(r"^\d")


def _field_from_option(
    key: str,
    definition: dict[str, Any],
    entry: dict[str, Any] | None,
    locale: dict[str, str],
) -> dict[str, Any] | None:
    kind = str(definition.get("type") or "").strip().lower()
    label = _label(definition.get("label"), locale, key)
    values = entry.get("optionValues") if isinstance(entry, dict) else None
    stored = values.get(key) if isinstance(values, dict) else None
    stored = stored if isinstance(stored, dict) else {}

    if kind == "switch":
        default = str(definition.get("default_case") or "Yes")
        case_names = {
            str(case.get("name") or "").strip().lower()
            for case in definition.get("cases") or []
            if isinstance(case, dict)
        }
        if "value" in stored:
            current = _as_bool(stored.get("value"))
            source = "config"
        else:
            current = default.strip().lower() in {"yes", "true", "1", "on"} or default.strip().lower() in case_names
            source = "default"
        return {"key": key, "label": label, "kind": "switch", "value": current, "source": source}

    if kind == "select":
        cases: list[dict[str, Any]] = []
        for case in definition.get("cases") or []:
            if not isinstance(case, dict):
                continue
            name = str(case.get("name") or "").strip()
            if not name:
                continue
            cases.append({"value": name, "label": _label(case.get("label"), locale, name)})
        if not cases:
            return None
        default = str(definition.get("default_case") or cases[0]["value"])
        stored_case = str(stored.get("caseName") or "").strip()
        current = stored_case if stored_case in {item["value"] for item in cases} else default
        source = "config" if stored_case else "default"
        hint = _label(definition.get("label"), locale, "")
        return {
            "key": key,
            "label": hint or label,
            "kind": "select",
            "value": current,
            "source": source,
            "choices": cases,
        }

    if kind == "checkbox":
        cases = []
        for case in definition.get("cases") or []:
            if not isinstance(case, dict):
                continue
            name = str(case.get("name") or "").strip()
            if name:
                cases.append({"value": name, "label": _label(case.get("label"), locale, name)})
        selected = stored.get("caseNames")
        current = [str(item) for item in selected] if isinstance(selected, list) else []
        return {
            "key": key,
            "label": label,
            "kind": "checkbox",
            "value": current,
            "source": "config" if isinstance(selected, list) else "default",
            "choices": cases,
        }

    if kind == "input":
        inputs: list[dict[str, Any]] = []
        stored_values = stored.get("values") if isinstance(stored.get("values"), dict) else {}
        for spec in definition.get("inputs") or []:
            if not isinstance(spec, dict):
                continue
            name = str(spec.get("name") or "").strip()
            if not name:
                continue
            default = str(spec.get("default") or "")
            raw = stored_values.get(name)
            value = str(raw) if raw is not None else default
            inputs.append(
                {
                    "name": name,
                    "label": _label(spec.get("label"), locale, name),
                    "value": value,
                    "default": default,
                    "number": _input_is_number(spec),
                    "source": "config" if raw is not None else "default",
                }
            )
        if not inputs:
            return None
        return {"key": key, "label": label, "kind": "inputs", "inputs": inputs}

    return None


def _task_fields(
    task_def: dict[str, Any],
    options: dict[str, Any],
    locale: dict[str, str],
    entry: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """按选项定义顺序，把某个任务被覆盖过的选项翻译成前端控件描述。"""

    fields: list[dict[str, Any]] = []
    for key in _sorted_option_keys(task_def, options):
        definition = options.get(key)
        if not isinstance(definition, dict):
            continue
        field = _field_from_option(key, definition, entry, locale)
        if field is not None:
            fields.append(field)
    return fields


def _load_config(
    root: str | Path, config_file: str | Path | None = None
) -> tuple[Path, dict[str, Any], dict[str, Any], dict[str, str]]:
    base = Path(str(root).strip())
    if not str(base):
        raise MaaEndError("这个托管项没配 MaaEnd 路径")
    path = Path(str(config_file).strip()) if str(config_file or "").strip() else config_path(base)
    if not path.is_file():
        raise MaaEndError(f"没找到 {path}，先在 MaaEnd 里保存一份配置")
    config = _read_json(path)
    if not isinstance(config, dict):
        raise MaaEndError(f"{path} 不是对象")
    return base, path, config, _catalog(base)


def _task_view(
    task_def: dict[str, Any],
    options: dict[str, Any],
    locale: dict[str, str],
    entry: dict[str, Any] | None,
    task_name: str,
) -> dict[str, Any]:
    return {
        "name": task_name,
        "label": _label(task_def.get("label"), locale, task_name),
        "present": entry is not None,
        "enabled": bool(entry.get("enabled")) if isinstance(entry, dict) else False,
        "entryId": str((entry or {}).get("id") or ""),
        "fields": _task_fields(task_def, options, locale, entry),
    }


def describe_all(root: str | Path, config_file: str | Path | None = None) -> dict[str, Any]:
    """一次读完 MaaEnd 配置里所有带参数的任务，供前端出多块折叠面板。

    root 是 MaaEnd 安装目录（读 interface.json / locales 用），config_file 是
    要读的那份 mxu-MaaEnd.json；不给就读安装目录里的原生配置。
    """

    base, path, config, catalog = _load_config(root, config_file)
    locale = _locale(base)
    instance = _instance(config)
    tasks: list[dict[str, Any]] = []
    skipped: list[str] = []
    for entry in instance.get("tasks") or []:
        if not isinstance(entry, dict):
            continue
        task_name = str(entry.get("taskName") or "").strip()
        if not task_name:
            continue
        task_def = catalog["tasks"].get(task_name)
        if not isinstance(task_def, dict):
            skipped.append(task_name)
            continue
        view = _task_view(task_def, catalog["options"], locale, entry, task_name)
        if not view["fields"]:
            skipped.append(task_name)
            continue
        tasks.append(view)
    stat = path.stat()
    return {
        "path": str(path),
        "exists": True,
        "mtime": stat.st_mtime,
        "size": stat.st_size,
        "instanceId": str(instance.get("id") or ""),
        "tasks": tasks,
        "skipped": skipped,
    }


def describe(root: str | Path, task_name: str, config_file: str | Path | None = None) -> dict[str, Any]:
    """读 MaaEnd 配置和任务定义，返回 {task, fields} 给前端出控件。"""

    base, path, config, catalog = _load_config(root, config_file)
    task_name = str(task_name or "").strip() or "AutoSell"
    task_def = catalog["tasks"].get(task_name)
    if not isinstance(task_def, dict):
        raise MaaEndError(f"MaaEnd 里没有叫 {task_name} 的任务（版本可能变了）")
    locale = _locale(base)
    instance = _instance(config)
    entry = _task_entry(instance, task_name)
    view = _task_view(task_def, catalog["options"], locale, entry, task_name)
    stat = path.stat()
    return {
        "path": str(path),
        "exists": True,
        "mtime": stat.st_mtime,
        "size": stat.st_size,
        "instanceId": str(instance.get("id") or ""),
        "task": {key: view[key] for key in ("name", "label", "present", "enabled", "entryId")},
        "fields": view["fields"],
    }


def _new_task_entry(task_name: str) -> dict[str, Any]:
    return {
        "taskName": task_name,
        "enabled": True,
        "enabledByController": {},
        "optionValues": {},
        "expanded": False,
    }


def apply(
    root: str | Path,
    task_name: str,
    patch: dict[str, Any],
    expect_mtime: Any = None,
    config_file: str | Path | None = None,
) -> dict[str, Any]:
    """把 patch 写回 mxu-MaaEnd.json。

    patch 的键是 option 名（switch / select / checkbox）或 input 名（inputs），
    值就是控件里的原始值；只覆盖这几个键，其余配置原样保留。
    """

    base = Path(str(root).strip())
    if not str(base):
        raise MaaEndError("这个托管项没配 MaaEnd 路径")
    path = Path(str(config_file).strip()) if str(config_file or "").strip() else config_path(base)
    if not path.is_file():
        raise MaaEndError(f"没找到 {path}，先在 MaaEnd 里保存一份配置")
    catalog = _catalog(base)
    task_name = str(task_name or "").strip() or "AutoSell"
    task_def = catalog["tasks"].get(task_name)
    if not isinstance(task_def, dict):
        raise MaaEndError(f"MaaEnd 里没有叫 {task_name} 的任务（版本可能变了）")
    options = catalog["options"]
    input_owner: dict[str, str] = {}
    for key in _sorted_option_keys(task_def, options):
        definition = options.get(key)
        if not isinstance(definition, dict) or str(definition.get("type") or "").lower() != "input":
            continue
        for spec in definition.get("inputs") or []:
            if isinstance(spec, dict) and str(spec.get("name") or "").strip():
                input_owner[str(spec["name"])] = key

    stat = path.stat()
    if expect_mtime not in (None, "", 0, "0"):
        try:
            expected = float(expect_mtime)
        except (TypeError, ValueError):
            expected = None
        if expected is not None and abs(expected - stat.st_mtime) > 0.001:
            raise MaaEndError("MaaEnd 配置在你编辑期间变过（可能刚跑过任务），刷新一下再改")

    config = _read_json(path)
    if not isinstance(config, dict):
        raise MaaEndError(f"{path} 不是对象")
    instance = _instance(config)
    tasks = instance.get("tasks")
    if not isinstance(tasks, list):
        tasks = []
        instance["tasks"] = tasks
    entry = _task_entry(instance, task_name)
    if entry is None:
        entry = _new_task_entry(task_name)
        tasks.append(entry)
    option_values = entry.get("optionValues")
    if not isinstance(option_values, dict):
        option_values = {}
        entry["optionValues"] = option_values

    changed: list[str] = []
    for raw_key, raw_value in patch.items():
        key = str(raw_key or "").strip()
        if not key:
            continue
        if key in input_owner:
            owner = input_owner[key]
            slot = option_values.get(owner)
            if not isinstance(slot, dict):
                slot = {"type": "input"}
                option_values[owner] = slot
            slot["type"] = "input"
            values = slot.get("values")
            if not isinstance(values, dict):
                values = {}
                slot["values"] = values
            values[key] = str(raw_value if raw_value is not None else "").strip()
            changed.append(key)
            continue
        definition = options.get(key)
        if not isinstance(definition, dict):
            raise MaaEndError(f"MaaEnd 里没有选项 {key}")
        kind = str(definition.get("type") or "").strip().lower()
        if kind == "switch":
            option_values[key] = {"type": "switch", "value": _as_bool(raw_value)}
        elif kind == "select":
            name = str(raw_value or "").strip()
            allowed = {str(case.get("name") or "").strip() for case in definition.get("cases") or [] if isinstance(case, dict)}
            if name not in allowed:
                raise MaaEndError(f"{key} 只能选 {sorted(allowed)}，收到的是 {name!r}")
            option_values[key] = {"type": "select", "caseName": name}
        elif kind == "checkbox":
            if isinstance(raw_value, str):
                picked = [item.strip() for item in raw_value.split(",") if item.strip()]
            elif isinstance(raw_value, (list, tuple)):
                picked = [str(item).strip() for item in raw_value if str(item).strip()]
            else:
                picked = []
            option_values[key] = {"type": "checkbox", "caseNames": picked}
        else:
            raise MaaEndError(f"选项 {key} 的类型 {kind or '未知'} 还不支持在面板里改")
        changed.append(key)

    if not changed:
        return {"path": str(path), "changed": [], "mtime": stat.st_mtime}

    _write_json(path, config)
    stat = path.stat()
    return {"path": str(path), "changed": changed, "mtime": stat.st_mtime}
