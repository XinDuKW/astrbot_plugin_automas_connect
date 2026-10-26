"""
从 AUTO-MAS 源码的 pydantic 配置模型里抽出「账号配置字段表」，塞进插件前端。

为什么要有这一步：AstrBot 面板里每个托管项（MAA / MaaEnd / OK-WW / OK-NTE / BetterGI…）
的账号配置字段完全不一样，字段的中文名、枚举取值只写在 AUTO-MAS 的模型里
（repo/app/models/config/script.py 的 Field(description=...) 和 Literal[...]）。
把这份表离线抽出来内嵌到 app.js，前端就能按真实字段渲染开关/下拉，不用手写表单。

用法（AUTO-MAS 升级后重跑一次）：
    python tools/gen_config_schema.py
    python tools/gen_config_schema.py --source "Y:\\AUTO-MAS\\repo\\app\\models\\config\\script.py"

它会：① 解析 script.py（自动跳过 PEP 695 的 type 别名，3.11 也能跑）；
       ② 生成 _schema.json 供检查；③ 把结果写回 pages/console/app.js 的 CONFIG_SCHEMA 常量。
"""
import argparse
import ast
import json
import os


def strip_type_alias(src):
    lines = src.split("\n")
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if ln.lstrip().startswith("type "):
            depth = ln.count("(") - ln.count(")")
            out.append("")
            i += 1
            while depth > 0 and i < len(lines):
                depth += lines[i].count("(") - lines[i].count(")")
                out.append("")
                i += 1
            continue
        out.append(ln)
        i += 1
    return "\n".join(out)

text = ""
tree = None
classes = {}
def walk(node, prefix):
    for st in node.body:
        if isinstance(st, ast.ClassDef):
            qn = (prefix + "." if prefix else "") + st.name
            classes[qn] = st
            walk(st, qn)

SOURCES = {}

def seg(n):
    path = getattr(n, "_src_path", None)
    source = SOURCES.get(path, text)
    return ast.get_source_segment(source, n).strip()

def split_top(s):
    parts, depth, cur, quote = [], 0, "", None
    for ch in s:
        if quote:
            cur += ch
            if ch == quote: quote = None
            continue
        if ch in "'\"": quote = ch; cur += ch; continue
        if ch in "[(": depth += 1
        if ch in ")]": depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur); cur = ""
        else:
            cur += ch
    if cur.strip(): parts.append(cur)
    return parts

def unwrap(s):
    s = s.strip()
    while True:
        if s.startswith("Annotated["):
            inner = s[len("Annotated["):-1]
            s = split_top(inner)[0].strip()
            continue
        if s.startswith("Optional[") and s.endswith("]"):
            s = s[len("Optional["):-1].strip()
            continue
        if s.endswith(" | None"):
            s = s[:-len(" | None")].strip()
            continue
        break
    return s

def literal_values(s):
    inner = s[len("Literal["):-1]
    vals = []
    for p in split_top(inner):
        p = p.strip()
        if len(p) >= 2 and p[0] in "'\"" and p[-1] == p[0]:
            vals.append(p[1:-1])
        else:
            vals.append(p)
    return vals

def const_of(node):
    if isinstance(node, ast.Constant): return True, node.value
    return False, None

def kwargs_of(node):
    out = {}
    if isinstance(node, ast.Call) and getattr(node.func, "id", "") == "Field":
        for kw in node.keywords:
            out[kw.arg] = kw.value
    return out

def meta_of(field_value, annotation):
    info = {}
    kw = kwargs_of(field_value)
    if "description" in kw:
        ok, v = const_of(kw["description"])
        if ok: info["label"] = v
    if "default" in kw:
        ok, v = const_of(kw["default"])
        if ok: info["default"] = v
    if isinstance(field_value, ast.Constant):
        info["default"] = field_value.value
    # Annotated 内的约束
    s = seg(annotation)
    if "Annotated[" in s:
        inner = s[s.index("Annotated[") + len("Annotated["):-1]
        for extra in split_top(inner)[1:]:
            extra = extra.strip()
            if extra.startswith("Field("):
                d = {}
                for part in split_top(extra[len("Field("):-1]):
                    if "=" in part:
                        k, _, v = part.partition("=")
                        d[k.strip()] = v.strip()
                for k in ("ge", "le", "gt", "lt"):
                    if k in d:
                        try: info[k] = int(d[k])
                        except Exception:
                            try: info[k] = float(d[k])
                            except Exception: pass
                if "description" not in info and "description" in d:
                    dv = d["description"].strip()
                    if len(dv) >= 2 and dv[0] in "'\"" and dv[-1] == dv[0]:
                        info["label"] = dv[1:-1]
    return info

def resolve(name, cur_qn):
    name = name.strip()
    if "." in name:
        head, _, tail = name.partition(".")
        if head in classes:
            cand = head
        else:
            cand = resolve(head, cur_qn)
        if cand and (cand + "." + tail) in classes:
            return cand + "." + tail
        return None
    parts = cur_qn.split(".") if cur_qn else []
    while parts:
        cand = ".".join(parts + [name])
        if cand in classes: return cand
        parts.pop()
    if name in classes: return name
    return None

def base_qns(qn):
    node = classes[qn]
    out = []
    for b in node.bases:
        bn = seg(b)
        r = resolve(bn, qn)
        if r: out.append(r)
    return out

def fields_of(qn, seen=()):
    if qn in seen: return {}
    acc = {}
    for b in base_qns(qn):
        acc.update(fields_of(b, seen + (qn,)))
    for st in classes[qn].body:
        if isinstance(st, ast.AnnAssign) and isinstance(st.target, ast.Name):
            acc[st.target.id] = (seg(st.annotation), st.value, qn)
    return acc

SCALAR_NAMES = {"bool","int","float","str","datetime","UUID","JsonDictString","WindowsNameString","Json", "Any"}

def describe(ann_src, value, cur_qn, depth, seen):
    s = unwrap(ann_src)
    meta = meta_of(value, ast.parse(ann_src, mode="eval").body) if False else {}
    kind = "str"
    extra = {}
    if s.startswith("Literal["):
        kind = "enum"; extra["options"] = literal_values(s)
    elif s.startswith("List[") or s.startswith("list["):
        kind = "list"; extra["item"] = unwrap(s[s.index("[")+1:-1])
    elif s.startswith("Dict[") or s.startswith("dict[") or s in ("JsonDictString", "Json", "dict"):
        kind = "json"
    elif s == "bool": kind = "bool"
    elif s == "int": kind = "int"
    elif s == "float": kind = "float"
    elif s == "str": kind = "str"
    else:
        r = resolve(s, cur_qn)
        if r:
            kind = "object"; extra["ref"] = r
        else:
            kind = "str"; extra["raw"] = s
    return kind, extra

SKIP_FIELD_NAMES = {"related_config"}

def is_skipped_field(fname, ann_src):
    if fname.startswith("_") or fname in SKIP_FIELD_NAMES:
        return True
    return ("ClassVar" in ann_src
            or "ConfigCollection" in ann_src
            or ann_src.strip().startswith("collection("))

def build(qn, depth=0, seen=()):
    fields = {}
    for fname, (ann_src, value, owner) in fields_of(qn, seen).items():
        if depth > 4 or is_skipped_field(fname, ann_src):
            continue
        kind, extra = describe(ann_src, value, owner, depth, seen)
        meta = meta_of(value, ast.parse(ann_src, mode="eval").body)
        node = {"kind": kind}
        for k, v in meta.items():
            node[k] = v
        if kind == "enum":
            node["options"] = extra["options"]
        elif kind == "object":
            node["ref"] = extra["ref"]
            node["fields"] = build(extra["ref"], depth + 1, seen + (qn,))
        elif kind == "list":
            item = extra["item"]
            if item.startswith("Literal["):
                sub_kind, sub_extra = "enum", {"options": literal_values(item)}
            else:
                sub_kind, sub_extra = describe(item, None, qn, depth, seen)
            node["itemKind"] = sub_kind
            if sub_kind == "enum": node["itemOptions"] = sub_extra["options"]
        elif kind == "str" and "raw" in extra:
            node["raw"] = extra["raw"]
        fields[fname] = node
    return fields




MAP = {
    "MaaConfig": "MaaUserConfig",
    "MaaEndConfig": "MaaEndUserConfig",
    "SrcConfig": "SrcUserConfig",
    "HSRConfig": "HSRUserConfig",
    "MaaFWConfig": "MaaFWUserConfig",
    "M9AConfig": "M9AUserConfig",
    "MSSConfig": "MSSUserConfig",
    "GeneralConfig": "GeneralUserConfig",
    "OkwwConfig": "OkwwUserConfig",
    "OkNteConfig": "OkNteUserConfig",
    "BetterGIConfig": "BetterGIUserConfig",
    "ZzzOdConfig": "ZzzOdUserConfig",
    "BAAHConfig": "BAAHUserConfig",
    "WhimboxConfig": "WhimboxUserConfig",
}

# 托管项（脚本配置本身，不是账号配置）：API 里的 type -> 模型类
MAP_SCRIPT = {
    "MaaConfig": "MaaConfig",
    "MaaEndConfig": "MaaEndConfig",
    "SrcConfig": "SrcConfig",
    "HSRConfig": "HSRConfig",
    "MaaFWConfig": "MaaFWConfig",
    "M9AConfig": "M9AConfig",
    "MSSConfig": "MSSConfig",
    "GeneralConfig": "GeneralConfig",
    "OkwwConfig": "OkwwConfig",
    "OkNteConfig": "OkNteConfig",
    "BetterGIConfig": "BetterGIConfig",
    "ZzzOdConfig": "ZzzOdConfig",
    "BAAHConfig": "BAAHConfig",
    "WhimboxConfig": "WhimboxConfig",
}

# 模拟器与全局设置
MAP_EXTRA = {
    "emulator": {"EmulatorConfig": "EmulatorConfig"},
    "setting": {"GlobalConfig": "GlobalConfig"},
}

CANDIDATES = [
    r"Y:\AUTO-MAS\repo\app\models\config\script.py",
    r"D:\Automation\AUTO-MAS\repo\app\models\config\script.py",
    r"D:\Automation\AUTO-MAS\app\models\config\script.py",
]


def load(paths):
    """paths: 文件列表。多个模型文件一起解析，classes 合并（同名先到先得）。"""
    global text, tree, classes
    if isinstance(paths, str):
        paths = [paths]
    text, tree, classes = "", None, {}
    for path in paths:
        raw = open(path, encoding="utf-8").read()
        source = strip_type_alias(raw)
        SOURCES[path] = source
        parsed = ast.parse(source)
        for node in ast.walk(parsed):
            node._src_path = path
        text = source
        tree = parsed
        walk(parsed, "")


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default="")
    parser.add_argument("--app", default=os.path.join(root, "pages", "console", "app.js"))
    parser.add_argument("--out", default=os.path.join(root, "_schema.json"))
    args = parser.parse_args()

    source = args.source
    if not source:
        for cand in CANDIDATES:
            if os.path.exists(cand):
                source = cand
                break
    if not source or not os.path.exists(source):
        raise SystemExit("找不到 AUTO-MAS 的 config/script.py，用 --source 指定")
    sources = [source]
    model_dir = os.path.dirname(source)
    for extra_name in ("emulator.py", "setting.py"):
        extra = os.path.join(model_dir, extra_name)
        if os.path.exists(extra):
            sources.append(extra)
    load(sources)

    def group_of(mapping):
        return {name: build(cls) for name, cls in mapping.items() if cls in classes}

    user = group_of(MAP)
    script = group_of(MAP_SCRIPT)
    out = {"user": user, "script": script}
    for section, mapping in MAP_EXTRA.items():
        out[section] = group_of(mapping)

    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)

    app_path = args.app
    lines = open(app_path, encoding="utf-8").read().split("\n")
    constants = [
        ("CONFIG_SCHEMA", user),
        ("SCRIPT_SCHEMA", script),
        ("EMULATOR_SCHEMA", out.get("emulator", {})),
        ("SETTING_SCHEMA", out.get("setting", {})),
    ]
    for const_name, payload in constants:
        line = "const " + const_name + " = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";"
        hit = False
        for i, current in enumerate(lines):
            if current.startswith("const " + const_name + " = "):
                lines[i] = line
                hit = True
                break
        if not hit:
            raise SystemExit("app.js 里没找到 " + const_name + " 那一行，先手动加占位")
    open(app_path, "w", encoding="utf-8").write("\n".join(lines))
    print("user types:", len(user), "| script types:", len(script),
          "| emulator:", list(out.get("emulator", {})), "| setting:", list(out.get("setting", {})),
          "| app.js updated")


if __name__ == "__main__":
    main()
