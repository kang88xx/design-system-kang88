#!/bin/bash
# 사용: console-check.sh <URL> [width]  — headless chrome으로 열어 JS 콘솔 오류·404를 출력한다. 출력이 비어 있으면 통과.
CHROME="${CHROME:-$HOME/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome}"
W="${2:-1440}"
"$CHROME" --headless=new --no-sandbox --disable-gpu --window-size=$W,900 --virtual-time-budget=8000 --enable-logging=stderr --v=0 --dump-dom "$1" 2>&1 >/dev/null \
 | grep -E "CONSOLE|Uncaught|Failed to load|404|ERROR" | grep -v "DevTools\|GPU\|gpu\|dbus\|sandbox\|fontconfig" | sed 's/^.*CONSOLE/CONSOLE/' | head -40
