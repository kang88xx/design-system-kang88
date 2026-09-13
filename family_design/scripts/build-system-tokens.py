#!/usr/bin/env python3
"""Compatibility wrapper for the portable kit token builder."""

from __future__ import annotations

import runpy
from pathlib import Path

TOOL = Path(__file__).resolve().parents[1] / "design-system" / "tools" / "build-tokens.py"

runpy.run_path(str(TOOL), run_name="__main__")
