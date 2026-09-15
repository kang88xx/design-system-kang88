#!/usr/bin/env python3
"""Build scoped three circles design-system CSS variables from tokens.json."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

KIT_ROOT = Path(__file__).resolve().parents[1]
TOKEN_FILE = KIT_ROOT / "tokens.json"
OUTPUT_FILE = KIT_ROOT / "tokens.css"

ALIAS_RE = re.compile(r"^\{([a-zA-Z0-9_.-]+)\}$")
HEX_RE = re.compile(r"^#([0-9a-fA-F]{6})$")


class TokenError(ValueError):
    pass


def load_tokens() -> dict[str, Any]:
    with TOKEN_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def get_path(data: dict[str, Any], path: str) -> Any:
    current: Any = data
    for part in path.split("."):
        if not isinstance(current, dict) or part not in current:
            raise TokenError(f"Missing alias target: {{{path}}}")
        current = current[part]
    return current


def raw_value(node: Any) -> str:
    if isinstance(node, dict) and "value" in node:
        return str(node["value"])
    if isinstance(node, str):
        return node
    raise TokenError(f"Token node has no value: {node!r}")


def resolve(data: dict[str, Any], value: str, seen: tuple[str, ...] = ()) -> str:
    match = ALIAS_RE.match(value)
    if not match:
        return value
    path = match.group(1)
    if path in seen:
        raise TokenError(f"Circular alias: {' -> '.join((*seen, path))}")
    return resolve(data, raw_value(get_path(data, path)), (*seen, path))


def css_var_name(*parts: str) -> str:
    safe = "-".join(parts).replace("_", "-")
    return f"--tcs-{safe}"


def flatten_value_tokens(data: dict[str, Any], section: str) -> list[tuple[str, str]]:
    values: list[tuple[str, str]] = []

    def walk(node: Any, path: list[str]) -> None:
        if isinstance(node, dict) and "value" in node:
            values.append((css_var_name(*path), resolve(data, str(node["value"]))))
            return
        if isinstance(node, dict):
            for key, child in node.items():
                if key in {"meta", "validation"}:
                    continue
                walk(child, [*path, key])

    walk(data[section], [section])
    return values


def relative_luminance(hex_color: str) -> float:
    match = HEX_RE.match(hex_color)
    if not match:
        raise TokenError(f"Contrast validation requires 6-digit hex colors, got {hex_color}")
    raw = match.group(1)
    channels = [int(raw[index : index + 2], 16) / 255 for index in (0, 2, 4)]

    def linear(channel: float) -> float:
        if channel <= 0.03928:
            return channel / 12.92
        return ((channel + 0.055) / 1.055) ** 2.4

    r, g, b = [linear(channel) for channel in channels]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(foreground: str, background: str) -> float:
    fg = relative_luminance(foreground)
    bg = relative_luminance(background)
    lighter = max(fg, bg)
    darker = min(fg, bg)
    return (lighter + 0.05) / (darker + 0.05)


def validate(data: dict[str, Any]) -> None:
    for required in ["source", "color", "font", "space", "size", "radius", "shadow", "type", "motion", "z"]:
        if required not in data:
            raise TokenError(f"Missing required token section: {required}")

    for section in ["source", "color", "font", "space", "size", "radius", "shadow", "motion", "z"]:
        for name, value in flatten_value_tokens(data, section):
            resolved = resolve(data, value)
            if not isinstance(resolved, str) or not resolved:
                raise TokenError(f"{name} resolves to an empty value")

    for type_name, spec in data["type"].items():
        for prop in ["font", "size", "lineHeight", "weight", "letterSpacing"]:
            if prop not in spec:
                raise TokenError(f"type.{type_name} missing {prop}")
            if prop == "font":
                resolve(data, str(spec[prop]))

    for pair in data.get("validation", {}).get("contrastPairs", []):
        foreground = resolve(data, str(pair["foreground"]))
        background = resolve(data, str(pair["background"]))
        ratio = contrast_ratio(foreground, background)
        if ratio + 1e-9 < float(pair["min"]):
            raise TokenError(
                f"Contrast failed for {pair['name']}: {foreground} on {background} = {ratio:.2f}, need {pair['min']}"
            )


def declarations(items: list[tuple[str, str]], indent: str = "  ") -> str:
    return "\n".join(f"{indent}{name}: {value};" for name, value in items)


def semantic_map() -> dict[str, str]:
    return {
        "bg": "bg",
        "bg-muted": "bg-muted",
        "surface": "surface",
        "surface-muted": "surface-muted",
        "surface-raised": "surface-raised",
        "text": "text",
        "text-muted": "text-muted",
        "text-subtle": "text-subtle",
        "border": "border",
        "border-strong": "border-strong",
        "focus": "focus",
        "primary": "primary-bg",
        "on-primary": "primary-fg",
        "secondary": "secondary-bg",
        "on-secondary": "secondary-fg",
        "danger": "danger-bg",
        "on-danger": "danger-fg",
        "danger-surface": "danger-surface",
        "danger-text": "danger-text",
        "success": "success-bg",
        "on-success": "success-fg",
        "success-surface": "success-surface",
        "success-text": "success-text",
        "warning": "warning-bg",
        "on-warning": "warning-fg",
        "warning-surface": "warning-surface",
        "warning-text": "warning-text",
        "accent": "accent",
        "accent-surface": "accent-surface",
    }


def build_css(data: dict[str, Any]) -> str:
    source_items = [(css_var_name("source-color", name), resolve(data, str(spec["value"]))) for name, spec in data["source"]["color"].items()]
    role_map = semantic_map()

    def public_items(theme: str) -> list[tuple[str, str]]:
        return [
            (css_var_name(public), resolve(data, str(data["color"][theme][role]["value"])))
            for public, role in role_map.items()
        ]

    color_aliases = [
        (css_var_name("color", role), f"var({css_var_name(public)})")
        for public, role in role_map.items()
    ]
    light_items = public_items("light") + color_aliases
    dark_items = public_items("dark")
    base_items: list[tuple[str, str]] = []
    for section in ["font", "space", "size", "radius", "shadow", "motion", "z"]:
        base_items.extend(flatten_value_tokens(data, section))
    for name, spec in data["type"].items():
        base_items.extend(
            [
                (css_var_name("type", name, "font"), resolve(data, str(spec["font"]))),
                (css_var_name("type", name, "size"), str(spec["size"])),
                (css_var_name("type", name, "line-height"), str(spec["lineHeight"])),
                (css_var_name("type", name, "weight"), str(spec["weight"])),
                (css_var_name("type", name, "letter-spacing"), str(spec["letterSpacing"])),
            ]
        )

    p3_items = [
        (css_var_name("source-color", name), spec["displayP3"])
        for name, spec in data["source"]["color"].items()
        if isinstance(spec, dict) and spec.get("displayP3")
    ]

    return "\n".join(
        [
            "/* Generated by tools/build-tokens.py. Edit tokens.json instead. */",
            "/* Framework-neutral three circles design system variables. Scope: .tcs only. */",
            ".tcs {",
            declarations(source_items + light_items + base_items),
            "}",
            "",
            '.tcs[data-tcs-theme="dark"] {',
            declarations(dark_items),
            "}",
            "",
            "@supports (color: color(display-p3 1 1 1)) {",
            "  .tcs {",
            declarations(p3_items, "    "),
            "  }",
            "}",
            "",
        ]
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build or check three circles design system tokens.css.")
    parser.add_argument("--check", action="store_true", help="Validate that tokens.css is up to date without writing.")
    args = parser.parse_args(argv)

    try:
        data = load_tokens()
        validate(data)
        css = build_css(data)
        if args.check:
            current = OUTPUT_FILE.read_text(encoding="utf-8") if OUTPUT_FILE.exists() else ""
            if current != css:
                print("tokens.css is out of date. Run: python3 tools/build-tokens.py", file=sys.stderr)
                return 1
            return 0
        OUTPUT_FILE.write_text(css, encoding="utf-8")
    except TokenError as exc:
        print(f"token build failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
