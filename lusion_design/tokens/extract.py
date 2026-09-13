#!/usr/bin/env python3
"""Extract the public Lusion token evidence used by this folder."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CSS_PATH = ROOT / "sources" / "site.css"
JS_PATH = ROOT / "sources" / "site.js"


def blocks(pattern: str, text: str) -> list[str]:
    return [match.group(0) for match in re.finditer(pattern, text)]


def main() -> None:
    css = CSS_PATH.read_text(encoding="utf-8")
    js = JS_PATH.read_text(encoding="utf-8")

    payload = {
        "rootBlocks": blocks(r"(?:(?:@media[^{}]+)\{)?(?::root\{[^}]+\}\}?)", css),
        "fontFaces": blocks(r"@font-face\{[^}]+\}", css),
        "textClasses": blocks(r"(?:@media[^{}]+\{)?\.text-[^{]+\{[^}]+\}\}?", css),
        "baseFontSelector": (re.search(r"html,body,h1,h2,h3,h4,button,input\{[^}]+\}", css) or [None])[0],
        "sectionGrid": (re.search(r"\.section\{[^}]+\}", css) or [None])[0],
        "sectionGridMobile": (
            re.search(r"@media \(max-width: 812px\)\{\.section\{[^}]+\}\}", css) or [None]
        )[0],
        "jsEasingNames": sorted(set(re.findall(r"ease\.[A-Za-z0-9_$]+", js))),
        "jsPreloaderConstants": (
            re.search(
                r"class Preloader\{percentTarget=0;percent=0;percentToStart=0;[^;]+;"
                r"MIN_PRELOAD_DURATION=[^;]+;PERCENT_BETWEEN_INIT_AND_START=[^;]+;"
                r"MIN_DURATION_BETWEEN_INIT_AND_START=[^;]+;HIDE_DURATION=[^;]+;",
                js,
            )
            or [None]
        )[0],
        "jsSettingsSnippet": (
            re.search(
                r"MOBILE_WIDTH=812;IS_SMALL_SCREEN=[^;]+;JUMP_SECTION=\"\";JUMP_OFFSET=0;"
                r"USE_HD=!1;SHOW_DETAILS=\"\";",
                js,
            )
            or [None]
        )[0],
    }

    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
