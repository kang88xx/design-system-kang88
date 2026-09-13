#!/usr/bin/env python3
"""Build ARK-derived reusable proposal templates without third-party packages."""

from __future__ import annotations

import html
import json
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / "templates"
DATA = ROOT / "data"
W, H = 1920, 1080

COLORS = {
    "cobalt": "#011187",
    "navy": "#061A58",
    "icon": "#091955",
    "paper": "#F4F4F8",
    "ink": "#1A2646",
    "muted": "#516086",
    "amber": "#EEC12B",
    "amber_vector": "#F7C51E",
    "white": "#FFFFFF",
}

FONT = "'Malgun Gothic', Arial, sans-serif"
NEXT_PPT_ID = 2


SLIDES = [
    {
        "id": "cover",
        "name": "Cover",
        "description": "ARK PDF p4/p7/p10의 코발트 풀블리드, 넓은 여백, 하단 레일을 따른 표지 마스터.",
        "sourcePages": [4, 7, 10],
        "category": "slide",
        "title": "PROJECT\nPROPOSAL",
        "subtitle": "SAMPLE Business document system",
        "eyebrow": "SAMPLE ARK / PROJECT",
    },
    {
        "id": "contents",
        "name": "Contents",
        "description": "ARK PDF p3의 목차/인덱스 흐름을 기준으로 한 편집 가능한 리스트 마스터.",
        "sourcePages": [3],
        "category": "slide",
        "title": "CONTENTS",
        "subtitle": "SAMPLE / 예시: 제안의 흐름을 4-6개 장으로 정리",
        "eyebrow": "01",
    },
    {
        "id": "divider",
        "name": "Section Divider",
        "description": "ARK PDF p4/p10/p17/p27의 코발트 섹션 화면처럼 거대 번호를 우상단에 두고 제목을 좌하단에 배치한 디바이더.",
        "sourcePages": [4, 10, 17, 27],
        "category": "slide",
        "title": "MARKET\nCONTEXT",
        "subtitle": "핵심 메시지를 한 문장으로 압축",
        "eyebrow": "02",
    },
    {
        "id": "statement",
        "name": "Statement",
        "description": "긴 제안 문장을 강조하는 넓은 여백, 좌측 라인, 보조 노트 구조.",
        "sourcePages": [8, 9, 15],
        "category": "slide",
        "title": "전략은 숫자로 검증되고,\n문장은 간결해야 합니다.",
        "subtitle": "SAMPLE Problem / Insight / Recommendation",
        "eyebrow": "KEY STATEMENT",
    },
    {
        "id": "metrics",
        "name": "Metrics",
        "description": "ARK PDF p11/p13/p14/p50의 수치 강조와 여백 구조를 따른 성과 지표 마스터.",
        "sourcePages": [11, 13, 14, 50],
        "category": "slide",
        "title": "PERFORMANCE\nSNAPSHOT",
        "subtitle": "SAMPLE / 예시: 핵심 수치와 근거를 한 화면에 배치",
        "eyebrow": "03",
    },
    {
        "id": "comparison",
        "name": "Comparison",
        "description": "ARK PDF p19/p22/p24의 병렬 정보 배치를 따른 옵션/전후 비교 마스터.",
        "sourcePages": [19, 22, 24],
        "category": "slide",
        "title": "OPTION\nCOMPARISON",
        "subtitle": "SAMPLE / 예시: 차이를 빠르게 스캔하도록 규칙과 강조색을 제한",
        "eyebrow": "04",
    },
    {
        "id": "process",
        "name": "Process",
        "description": "ARK PDF p25/p46의 단계형 설명 구조를 따른 실행 프로세스 마스터.",
        "sourcePages": [25, 46],
        "category": "slide",
        "title": "EXECUTION\nPROCESS",
        "subtitle": "SAMPLE / 예시: 단계별 산출물과 책임 범위를 명료하게 표현",
        "eyebrow": "05",
    },
    {
        "id": "case-study",
        "name": "Case Study",
        "description": "ARK PDF p31/p33/p35의 사례/공간 소개 페이지 구조를 따른 케이스 스터디 마스터.",
        "sourcePages": [31, 33, 35],
        "category": "slide",
        "title": "CASE\nSTUDY",
        "subtitle": "SAMPLE / 예시: 상황과 결과를 정돈된 증거 구조로 연결",
        "eyebrow": "06",
    },
    {
        "id": "gallery",
        "name": "Gallery",
        "description": "ARK PDF p32/p34/p36/p41의 이미지 중심 구성과 균일 프레임을 따른 갤러리 마스터.",
        "sourcePages": [32, 34, 36, 41],
        "category": "slide",
        "title": "VISUAL\nREFERENCE",
        "subtitle": "SAMPLE / 예시: 이미지는 같은 톤의 프레임 안에서만 사용",
        "eyebrow": "07",
    },
    {
        "id": "closing",
        "name": "Closing",
        "description": "종결 메시지와 다음 행동을 남기는 클로징/컨택 마스터.",
        "sourcePages": [50, 51, 52],
        "category": "slide",
        "title": "THANK\nYOU",
        "subtitle": "SAMPLE Next discussion / Contact / Appendix",
        "eyebrow": "SAMPLE ARK / PROJECT",
    },
]

GUIDE_REF = "../prompts/guide.md"


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def text_lines(text: str, x: int, y: int, size: int, fill: str, weight: int = 400, line: int | None = None, anchor: str = "start") -> str:
    line = line or int(size * 1.18)
    parts = []
    for idx, raw in enumerate(text.split("\n")):
        dy = 0 if idx == 0 else line
        parts.append(f'<tspan x="{x}" dy="{dy if idx else 0}">{esc(raw)}</tspan>')
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" fill="{fill}">' + "".join(parts) + "</text>"


def footer(page: str, dark: bool = False) -> str:
    c = COLORS["white"] if dark else COLORS["ink"]
    muted = COLORS["white"] if dark else COLORS["muted"]
    opacity = ".72" if dark else "1"
    return f"""
  <line x1="60" y1="1032" x2="1860" y2="1032" stroke="{c}" stroke-opacity=".42" stroke-width="2"/>
  <text x="60" y="1058" font-family="{FONT}" font-size="20" fill="{muted}" opacity="{opacity}">ARK / PROJECT DOCUMENT SYSTEM</text>
  <text x="1860" y="1058" text-anchor="end" font-family="{FONT}" font-size="20" fill="{muted}" opacity="{opacity}">{page}</text>
"""


def svg_wrap(slide: dict, body: str, bg: str = "white") -> str:
    title = esc(slide["name"])
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="{title}">
  <title>{title}</title>
  <desc>{esc(slide["description"])} Source pages: {", ".join(map(str, slide["sourcePages"]))}. Icon adaptation guide: {GUIDE_REF}.</desc>
  <metadata data-guide-ref="{GUIDE_REF}"/>
  <rect width="{W}" height="{H}" fill="{bg}"/>
{body}
</svg>
"""


def icon_gold_bars(x: int, y: int, scale: float = 1.0) -> str:
    s = scale
    return f"""
  <g transform="translate({x} {y}) scale({s})" fill="none" stroke="{COLORS["icon"]}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <path d="M15 18h18l5 8H10l5-8Z"/>
    <path d="M18 18l3.5 8"/>
    <path d="M30 18l-3.5 8"/>
    <path d="M11 28h18l5 8H6l5-8Z"/>
    <path d="M14 28l3.5 8"/>
    <path d="M26 28l-3.5 8"/>
    <path d="M20 10h14l4 6H16l4-6Z"/>
    <path d="M23 10l2.5 6"/>
    <path d="M32 10l-2.5 6"/>
  </g>
"""


def render_slide(slide: dict, idx: int) -> str:
    s = slide["id"]
    if s == "cover":
        body = f"""
  <rect width="{W}" height="{H}" fill="{COLORS["cobalt"]}"/>
  <rect x="60" y="60" width="1800" height="4" fill="{COLORS["white"]}" opacity=".85"/>
  <text x="60" y="132" font-family="{FONT}" font-size="28" fill="{COLORS["white"]}" opacity=".82">{esc(slide["eyebrow"])}</text>
  {text_lines(slide["title"], 60, 430, 118, COLORS["white"], 500, 132)}
  <text x="60" y="728" font-family="{FONT}" font-size="30" fill="{COLORS["white"]}" opacity=".82">{esc(slide["subtitle"])}</text>
  <rect x="1330" y="348" width="420" height="420" fill="none" stroke="{COLORS["white"]}" stroke-width="3" opacity=".42"/>
  <path d="M1420 680 L1660 420 M1420 420 L1660 680" stroke="{COLORS["white"]}" stroke-width="4" opacity=".38"/>
  {footer(f"{idx:02d}", True)}
"""
        return svg_wrap(slide, body, COLORS["cobalt"])
    if s == "contents":
        rows = []
        for i, label in enumerate(["SAMPLE Context", "SAMPLE Approach", "SAMPLE Solution", "SAMPLE Execution", "SAMPLE Appendix"]):
            y = 308 + i * 112
            rows.append(f'<text x="240" y="{y}" font-family="{FONT}" font-size="34" fill="{COLORS["ink"]}">{label}</text><text x="1660" y="{y}" text-anchor="end" font-family="{FONT}" font-size="26" fill="{COLORS["muted"]}">0{i+1}</text><line x1="240" y1="{y+34}" x2="1660" y2="{y+34}" stroke="{COLORS["paper"]}" stroke-width="4"/>')
        body = f"""
  <rect x="0" y="0" width="180" height="{H}" fill="{COLORS["navy"]}"/>
  <text x="90" y="860" text-anchor="middle" font-family="{FONT}" font-size="188" font-weight="300" fill="{COLORS["white"]}" opacity=".16">{esc(slide["eyebrow"])}</text>
  {text_lines(slide["title"], 240, 144, 85, COLORS["ink"], 500)}
  <text x="240" y="210" font-family="{FONT}" font-size="25" fill="{COLORS["muted"]}">{esc(slide["subtitle"])}</text>
  {"".join(rows)}
  {footer(f"{idx:02d}")}
"""
        return svg_wrap(slide, body)
    if s == "divider":
        body = f"""
  <rect width="{W}" height="{H}" fill="{COLORS["cobalt"]}"/>
  <text x="1760" y="390" text-anchor="end" font-family="{FONT}" font-size="400" font-weight="300" fill="{COLORS["white"]}">{esc(slide["eyebrow"])}</text>
  <text x="60" y="132" font-family="{FONT}" font-size="28" fill="{COLORS["white"]}" opacity=".72">SAMPLE SECTION</text>
  {text_lines(slide["title"], 60, 760, 108, COLORS["white"], 500, 118)}
  <text x="60" y="914" font-family="{FONT}" font-size="28" fill="{COLORS["white"]}" opacity=".76">예시: {esc(slide["subtitle"])}</text>
  {footer(f"{idx:02d}", True)}
"""
        return svg_wrap(slide, body, COLORS["cobalt"])
    if s == "statement":
        body = f"""
  <rect x="60" y="112" width="8" height="720" fill="{COLORS["cobalt"]}"/>
  <text x="112" y="146" font-family="{FONT}" font-size="24" fill="{COLORS["muted"]}">{esc(slide["eyebrow"])}</text>
  {text_lines(slide["title"], 112, 368, 74, COLORS["ink"], 500, 92)}
  <rect x="112" y="682" width="108" height="6" fill="{COLORS["amber"]}"/>
  <text x="112" y="760" font-family="{FONT}" font-size="28" fill="{COLORS["muted"]}">{esc(slide["subtitle"])}</text>
  <text x="1260" y="216" font-family="{FONT}" font-size="24" fill="{COLORS["muted"]}">SAMPLE extension / guide.md</text>
  <rect x="1260" y="254" width="500" height="330" fill="{COLORS["paper"]}"/>
  {icon_gold_bars(1398, 312, 4.6)}
  <text x="1510" y="640" text-anchor="middle" font-family="{FONT}" font-size="24" fill="{COLORS["ink"]}">SAMPLE: house to gold bars</text>
  {footer(f"{idx:02d}")}
"""
        return svg_wrap(slide, body)
    if s == "metrics":
        blocks = []
        for i, num in enumerate(["32%", "4.8×", "12w"]):
            x = 190 + i * 545
            blocks.append(f'<line x1="{x}" y1="374" x2="{x+360}" y2="374" stroke="{COLORS["cobalt"]}" stroke-width="4"/><text x="{x}" y="520" font-family="{FONT}" font-size="86" font-weight="500" fill="{COLORS["ink"]}">{num}</text><text x="{x}" y="582" font-family="{FONT}" font-size="25" fill="{COLORS["muted"]}">예시: 편집 가능한 지표 설명</text><text x="{x}" y="626" font-family="{FONT}" font-size="25" fill="{COLORS["muted"]}">SAMPLE evidence / source</text>')
        body = f"""
  {text_lines(slide["title"], 60, 152, 85, COLORS["ink"], 500, 92)}
  <text x="60" y="280" font-family="{FONT}" font-size="25" fill="{COLORS["muted"]}">{esc(slide["subtitle"])}</text>
  <text x="60" y="336" font-family="{FONT}" font-size="22" fill="{COLORS["muted"]}">예시 데이터 / SAMPLE</text>
  {"".join(blocks)}
  {footer(f"{idx:02d}")}
"""
        return svg_wrap(slide, body)
    if s == "comparison":
        body = f"""
  <rect width="{W}" height="{H}" fill="{COLORS["paper"]}"/>
  {text_lines(slide["title"], 60, 140, 85, COLORS["ink"], 500, 92)}
  <text x="60" y="268" font-family="{FONT}" font-size="25" fill="{COLORS["muted"]}">{esc(slide["subtitle"])}</text>
  <rect x="120" y="382" width="760" height="370" fill="{COLORS["white"]}"/>
  <rect x="1040" y="382" width="760" height="370" fill="{COLORS["white"]}"/>
  <text x="168" y="454" font-family="{FONT}" font-size="36" fill="{COLORS["ink"]}">SAMPLE Before / Option A</text>
  <text x="1088" y="454" font-family="{FONT}" font-size="36" fill="{COLORS["ink"]}">SAMPLE After / Option B</text>
  <line x1="168" y1="496" x2="832" y2="496" stroke="{COLORS["paper"]}" stroke-width="4"/>
  <line x1="1088" y1="496" x2="1752" y2="496" stroke="{COLORS["cobalt"]}" stroke-width="4"/>
  <text x="168" y="568" font-family="{FONT}" font-size="27" fill="{COLORS["muted"]}">예시: 비교 항목 01</text>
  <text x="1088" y="568" font-family="{FONT}" font-size="27" fill="{COLORS["muted"]}">예시: 차별화 메시지 01</text>
  <text x="168" y="636" font-family="{FONT}" font-size="27" fill="{COLORS["muted"]}">SAMPLE 비교 항목 02</text>
  <text x="1088" y="636" font-family="{FONT}" font-size="27" fill="{COLORS["muted"]}">SAMPLE 차별화 메시지 02</text>
  {footer(f"{idx:02d}")}
"""
        return svg_wrap(slide, body, COLORS["paper"])
    if s == "process":
        nodes = []
        for i, word in enumerate(["Discover", "Design", "Build", "Verify"]):
            x = 230 + i * 420
            nodes.append(f'<circle cx="{x}" cy="534" r="74" fill="{COLORS["paper"]}" stroke="{COLORS["cobalt"]}" stroke-width="4"/><text x="{x}" y="546" text-anchor="middle" font-family="{FONT}" font-size="32" fill="{COLORS["ink"]}">{i+1}</text><text x="{x}" y="674" text-anchor="middle" font-family="{FONT}" font-size="30" fill="{COLORS["ink"]}">SAMPLE {word}</text><text x="{x}" y="724" text-anchor="middle" font-family="{FONT}" font-size="24" fill="{COLORS["muted"]}">예시: 산출물 설명</text>')
        body = f"""
  {text_lines(slide["title"], 60, 148, 85, COLORS["ink"], 500, 92)}
  <text x="60" y="276" font-family="{FONT}" font-size="25" fill="{COLORS["muted"]}">{esc(slide["subtitle"])}</text>
  <line x1="230" y1="534" x2="1490" y2="534" stroke="{COLORS["paper"]}" stroke-width="8"/>
  {"".join(nodes)}
  {footer(f"{idx:02d}")}
"""
        return svg_wrap(slide, body)
    if s == "case-study":
        body = f"""
  <rect x="0" y="0" width="560" height="{H}" fill="{COLORS["navy"]}"/>
  {text_lines(slide["title"], 60, 166, 85, COLORS["white"], 500, 92)}
  <text x="60" y="354" font-family="{FONT}" font-size="25" fill="{COLORS["white"]}" opacity=".72">{esc(slide["subtitle"])}</text>
  <rect x="720" y="178" width="980" height="220" fill="{COLORS["paper"]}"/>
  <rect x="720" y="450" width="980" height="220" fill="{COLORS["paper"]}"/>
  <rect x="720" y="722" width="980" height="120" fill="{COLORS["cobalt"]}"/>
  <text x="770" y="255" font-family="{FONT}" font-size="36" fill="{COLORS["ink"]}">SAMPLE Challenge</text>
  <text x="770" y="527" font-family="{FONT}" font-size="36" fill="{COLORS["ink"]}">SAMPLE Approach</text>
  <text x="770" y="798" font-family="{FONT}" font-size="36" fill="{COLORS["white"]}">SAMPLE Result</text>
  {footer(f"{idx:02d}", True)}
"""
        return svg_wrap(slide, body)
    if s == "gallery":
        frames = []
        for i in range(3):
            x = 120 + i * 560
            frames.append(f'<rect x="{x}" y="350" width="440" height="330" fill="{COLORS["paper"]}" stroke="{COLORS["white"]}" stroke-width="0"/><path d="M{x+64} 604 L{x+186} 490 L{x+292} 570 L{x+370} 520" fill="none" stroke="{COLORS["muted"]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="{x+334}" cy="430" r="28" fill="{COLORS["amber"]}"/><text x="{x}" y="744" font-family="{FONT}" font-size="26" fill="{COLORS["white"]}" opacity=".76">SAMPLE Reference {i+1}</text>')
        body = f"""
  <rect width="{W}" height="{H}" fill="{COLORS["navy"]}"/>
  {text_lines(slide["title"], 60, 142, 85, COLORS["white"], 500, 92)}
  <text x="60" y="270" font-family="{FONT}" font-size="25" fill="{COLORS["white"]}" opacity=".72">{esc(slide["subtitle"])}</text>
  {"".join(frames)}
  {footer(f"{idx:02d}", True)}
"""
        return svg_wrap(slide, body, COLORS["navy"])
    if s == "closing":
        body = f"""
  <rect width="{W}" height="{H}" fill="{COLORS["cobalt"]}"/>
  <text x="60" y="134" font-family="{FONT}" font-size="28" fill="{COLORS["white"]}" opacity=".82">{esc(slide["eyebrow"])}</text>
  {text_lines(slide["title"], 60, 430, 118, COLORS["white"], 500, 132)}
  <text x="60" y="728" font-family="{FONT}" font-size="30" fill="{COLORS["white"]}" opacity=".82">{esc(slide["subtitle"])}</text>
  <line x1="1230" y1="368" x2="1730" y2="368" stroke="{COLORS["white"]}" stroke-width="4" opacity=".52"/>
  <line x1="1230" y1="508" x2="1730" y2="508" stroke="{COLORS["white"]}" stroke-width="4" opacity=".52"/>
  <line x1="1230" y1="648" x2="1730" y2="648" stroke="{COLORS["white"]}" stroke-width="4" opacity=".52"/>
  {footer(f"{idx:02d}", True)}
"""
        return svg_wrap(slide, body, COLORS["cobalt"])
    raise ValueError(s)


def write_svg_templates() -> list[dict]:
    records = []
    for idx, slide in enumerate(SLIDES, 1):
        filename = f"{slide['id']}.svg"
        path = TEMPLATES / filename
        path.write_text(render_slide(slide, idx), encoding="utf-8")
        records.append({k: slide[k] for k in ("id", "name", "description", "sourcePages", "category")} | {"svg": f"templates/{filename}"})
    return records


def a4_html() -> tuple[str, str]:
    css = f""":root {{
  --cobalt: {COLORS["cobalt"]};
  --navy: {COLORS["navy"]};
  --icon: {COLORS["icon"]};
  --paper: {COLORS["paper"]};
  --ink: {COLORS["ink"]};
  --muted: {COLORS["muted"]};
  --amber: {COLORS["amber"]};
}}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: #d9dbe5; color: var(--ink); font-family: "Malgun Gothic", Arial, sans-serif; }}
.toolbar {{ position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; align-items: center; justify-content: flex-end; padding: 12px 18px; background: rgba(255,255,255,.94); border-bottom: 1px solid #d6d9e5; }}
button {{ border: 0; background: var(--cobalt); color: white; min-height: 36px; padding: 0 14px; font-size: 14px; cursor: pointer; }}
.status {{ margin-right: auto; font-size: 13px; color: var(--muted); min-height: 18px; }}
main {{ display: grid; gap: 18px; justify-content: center; padding: 24px; }}
.page {{ width: 210mm; min-height: 297mm; background: white; padding: 18mm 16mm; position: relative; overflow: hidden; box-shadow: 0 10px 34px rgba(6,26,88,.18); }}
.cover {{ background: var(--cobalt); color: white; }}
.cover h1 {{ font-size: 54pt; line-height: .98; margin: 68mm 0 10mm; font-weight: 500; letter-spacing: 0; }}
.eyebrow {{ font-size: 11pt; letter-spacing: 0; color: inherit; opacity: .78; }}
h2 {{ margin: 0 0 10mm; font-size: 30pt; line-height: 1.05; font-weight: 500; letter-spacing: 0; }}
h3 {{ margin: 0 0 4mm; font-size: 15pt; font-weight: 500; }}
p, li {{ font-size: 10.5pt; line-height: 1.62; color: var(--muted); }}
.rule {{ height: 1.2mm; width: 34mm; background: var(--cobalt); margin: 8mm 0; }}
.cover .rule {{ background: white; opacity: .82; }}
.grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }}
.metric-row {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm; margin-top: 14mm; }}
.metric {{ border-top: 1.1mm solid var(--cobalt); padding-top: 6mm; }}
.metric strong {{ display: block; font-size: 26pt; line-height: 1; color: var(--ink); margin-bottom: 4mm; }}
.process {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; margin-top: 12mm; }}
.step {{ background: var(--paper); padding: 7mm 5mm; min-height: 42mm; }}
.page-footer {{ position: absolute; left: 16mm; right: 16mm; bottom: 10mm; border-top: .4mm solid rgba(26,38,70,.22); padding-top: 4mm; display: flex; justify-content: space-between; font-size: 8pt; color: var(--muted); }}
.cover .page-footer {{ color: rgba(255,255,255,.68); border-color: rgba(255,255,255,.4); }}
[contenteditable] {{ outline-color: var(--amber); }}
@media print {{
  @page {{ size: A4; margin: 0; }}
  body {{ background: white; }}
  .toolbar {{ display: none; }}
  main {{ padding: 0; gap: 0; }}
  .page {{ box-shadow: none; page-break-after: always; }}
  .page:last-child {{ page-break-after: auto; }}
}}
"""
    body = """<!doctype html>
<html lang="ko" data-exported="false">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ARK A4 Proposal Template</title>
  <style>__INLINE_CSS__</style>
</head>
<body>
  <div class="toolbar">
    <div id="saveStatus" class="status" role="status" aria-live="polite"></div>
    <button type="button" id="saveLocal">저장</button>
    <button type="button" id="downloadHtml">HTML 내려받기</button>
    <button type="button" onclick="window.print()">PDF 인쇄</button>
  </div>
  <main id="proposal">
    <section class="page cover">
      <div class="eyebrow" contenteditable="true">ARK / PROJECT</div>
      <h1 contenteditable="true">PROJECT<br>PROPOSAL</h1>
      <div class="rule"></div>
      <p contenteditable="true">SAMPLE / 예시: 비즈니스 제안의 핵심 메시지, 범위, 기대 효과를 한 문장으로 정리합니다.</p>
      <div class="page-footer"><span>ARK DOCUMENT SYSTEM</span><span>01</span></div>
    </section>
    <section class="page">
      <div class="eyebrow" contenteditable="true">01 / CONTEXT</div>
      <h2 contenteditable="true">문제 정의와<br>시장 맥락</h2>
      <div class="grid">
        <div><h3 contenteditable="true">SAMPLE Current Issue</h3><p contenteditable="true">예시: 현재 상황, 병목, 의사결정에 필요한 배경을 간결하게 작성합니다.</p></div>
        <div><h3 contenteditable="true">SAMPLE Opportunity</h3><p contenteditable="true">예시: 제안이 해결하는 기회와 기대되는 변화를 수치 또는 사례와 연결합니다.</p></div>
      </div>
      <div class="metric-row">
        <div class="metric"><strong contenteditable="true">32%</strong><p contenteditable="true">예시 데이터 / SAMPLE<br>evidence placeholder</p></div>
        <div class="metric"><strong contenteditable="true">4.8×</strong><p contenteditable="true">예시 데이터 / SAMPLE<br>evidence placeholder</p></div>
        <div class="metric"><strong contenteditable="true">12w</strong><p contenteditable="true">예시 데이터 / SAMPLE<br>evidence placeholder</p></div>
      </div>
      <div class="page-footer"><span>ARK DOCUMENT SYSTEM</span><span>02</span></div>
    </section>
    <section class="page">
      <div class="eyebrow" contenteditable="true">02 / SOLUTION</div>
      <h2 contenteditable="true">제안 방향과<br>실행 구조</h2>
      <p contenteditable="true">SAMPLE / 예시: 제안의 원칙, 범위, 산출물을 문서 전체에서 같은 어휘로 반복합니다. 강조색은 작은 신호에만 사용합니다.</p>
      <div class="process">
        <div class="step"><h3 contenteditable="true">SAMPLE Discover</h3><p contenteditable="true">예시: 자료 수집</p></div>
        <div class="step"><h3 contenteditable="true">SAMPLE Design</h3><p contenteditable="true">예시: 구조 설계</p></div>
        <div class="step"><h3 contenteditable="true">SAMPLE Build</h3><p contenteditable="true">예시: 산출물 제작</p></div>
        <div class="step"><h3 contenteditable="true">SAMPLE Verify</h3><p contenteditable="true">예시: 검수 및 보완</p></div>
      </div>
      <div class="page-footer"><span>ARK DOCUMENT SYSTEM</span><span>03</span></div>
    </section>
    <section class="page">
      <div class="eyebrow" contenteditable="true">03 / GUIDE</div>
      <h2 contenteditable="true">아이콘과 도형<br>확장 프롬프트</h2>
      <p contenteditable="true">SAMPLE / 예시: 새 아이콘은 prompts/guide.md를 따른다. 원본 아이콘에는 바이올렛/네이비 계열 그라디언트와 단색 outline family가 함께 존재하므로, 용도별 family를 먼저 고른다.</p>
      <p contenteditable="true">예시: 인쇄용 mono 확장은 48x48 SVG viewBox, currentColor 네이비 스트로크, 3-unit rounded stroke, no fill을 기준으로 한다. 집을 금괴로 바꿀 때 금색/광택/3D 표현은 쓰지 않는다.</p>
      <div class="page-footer"><span>ARK DOCUMENT SYSTEM</span><span>04</span></div>
    </section>
  </main>
  <script>
    const status = document.getElementById("saveStatus");
    const proposal = document.getElementById("proposal");
    const isExported = document.documentElement.dataset.exported === "true";
    const key = "ark-proposal-a4-html:" + location.pathname;
    function setStatus(message) {
      status.textContent = message;
    }
    function tryStorage(action) {
      try {
        return action();
      } catch (error) {
        setStatus("브라우저 저장소를 사용할 수 없습니다. HTML 내려받기를 사용하세요.");
        return null;
      }
    }
    if (!isExported) {
      const saved = tryStorage(() => localStorage.getItem(key));
      if (saved) proposal.innerHTML = saved;
    }
    document.getElementById("saveLocal").addEventListener("click", () => {
      if (tryStorage(() => localStorage.setItem(key, proposal.innerHTML)) !== null) {
        setStatus("저장되었습니다.");
      }
    });
    document.getElementById("downloadHtml").addEventListener("click", () => {
      tryStorage(() => localStorage.setItem(key, proposal.innerHTML));
      const cloned = document.documentElement.cloneNode(true);
      cloned.dataset.exported = "true";
      const liveStatus = cloned.querySelector("#saveStatus");
      if (liveStatus) liveStatus.textContent = "내려받은 HTML입니다. 저장 복원은 비활성화되어 있습니다.";
      const doc = "<!doctype html>\\n" + cloned.outerHTML;
      const url = URL.createObjectURL(new Blob([doc], {type: "text/html;charset=utf-8"}));
      const a = document.createElement("a");
      a.href = url;
      a.download = "ark-proposal-edited.html";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("HTML 파일을 내려받았습니다.");
    });
  </script>
</body>
</html>
""".replace("__INLINE_CSS__", css)
    return body, css


def ppt_text(x: int, y: int, w: int, h: int, text: str, size: int, color: str, bold: bool = False) -> str:
    shape_id = next_ppt_id()
    color = color.lstrip("#").upper()
    weight = ' b="1"' if bold else ""
    paragraphs = "".join(
        f'<a:p><a:r><a:rPr lang="ko-KR" sz="{size*100}"{weight}><a:solidFill><a:srgbClr val="{color}"/></a:solidFill><a:latin typeface="Arial"/><a:ea typeface="Malgun Gothic"/><a:cs typeface="Arial"/></a:rPr><a:t>{escape(part)}</a:t></a:r></a:p>'
        for part in text.split("\n")
    )
    return f"""<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="TextBox"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="{x*9525}" y="{y*9525}"/><a:ext cx="{w*9525}" cy="{h*9525}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
  <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>{paragraphs}</p:txBody>
</p:sp>"""


def ppt_rect(x: int, y: int, w: int, h: int, fill: str, line: str | None = None) -> str:
    shape_id = next_ppt_id()
    fillv = fill.lstrip("#").upper()
    ln = f'<a:ln w="12700"><a:solidFill><a:srgbClr val="{line.lstrip("#").upper()}"/></a:solidFill></a:ln>' if line else '<a:ln><a:noFill/></a:ln>'
    return f"""<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="Shape"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="{x*9525}" y="{y*9525}"/><a:ext cx="{w*9525}" cy="{h*9525}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{fillv}"/></a:solidFill>{ln}</p:spPr>
</p:sp>"""


def ppt_line(x: int, y: int, w: int, h: int, color: str, width: int = 2) -> str:
    shape_id = next_ppt_id()
    color = color.lstrip("#").upper()
    off_x = min(x, x + w)
    off_y = min(y, y + h)
    ext_w = abs(w)
    ext_h = abs(h)
    flips = ""
    if w < 0:
        flips += ' flipH="1"'
    if h < 0:
        flips += ' flipV="1"'
    return f"""<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="Line"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm{flips}><a:off x="{off_x*9525}" y="{off_y*9525}"/><a:ext cx="{ext_w*9525}" cy="{ext_h*9525}"/></a:xfrm><a:prstGeom prst="line"><a:avLst/></a:prstGeom><a:ln w="{width*12700}"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill></a:ln></p:spPr>
</p:sp>"""


def ppt_ellipse(x: int, y: int, w: int, h: int, fill: str, line: str | None = None, line_width: int = 2) -> str:
    shape_id = next_ppt_id()
    fillv = fill.lstrip("#").upper()
    ln = f'<a:ln w="{line_width*12700}"><a:solidFill><a:srgbClr val="{line.lstrip("#").upper()}"/></a:solidFill></a:ln>' if line else '<a:ln><a:noFill/></a:ln>'
    return f"""<p:sp>
  <p:nvSpPr><p:cNvPr id="{shape_id}" name="Ellipse"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr><a:xfrm><a:off x="{x*9525}" y="{y*9525}"/><a:ext cx="{w*9525}" cy="{h*9525}"/></a:xfrm><a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="{fillv}"/></a:solidFill>{ln}</p:spPr>
</p:sp>"""


def next_ppt_id() -> int:
    global NEXT_PPT_ID
    value = NEXT_PPT_ID
    NEXT_PPT_ID += 1
    return value


def slide_xml(slide: dict, idx: int) -> str:
    s = slide["id"]
    dark = s in {"cover", "divider", "gallery", "closing"}
    bg = COLORS["cobalt"] if s in {"cover", "divider", "closing"} else COLORS["navy"] if s == "gallery" else COLORS["paper"] if s == "comparison" else COLORS["white"]
    shapes = [ppt_rect(0, 0, W, H, bg)]

    def add_footer() -> None:
        c = COLORS["white"] if dark else COLORS["ink"]
        m = COLORS["white"] if dark else COLORS["muted"]
        shapes.append(ppt_line(60, 1032, 1800, 0, c, 1))
        shapes.append(ppt_text(60, 1040, 600, 30, "ARK / PROJECT DOCUMENT SYSTEM", 14, m))
        shapes.append(ppt_text(1760, 1040, 100, 30, f"{idx:02d}", 14, m))

    if s == "cover":
        shapes += [
            ppt_rect(60, 60, 1800, 4, COLORS["white"]),
            ppt_text(60, 104, 600, 40, slide["eyebrow"], 22, COLORS["white"]),
            ppt_text(60, 330, 980, 270, slide["title"], 72, COLORS["white"], True),
            ppt_text(60, 690, 760, 50, slide["subtitle"], 24, COLORS["white"]),
            ppt_rect(1330, 348, 420, 420, COLORS["cobalt"], COLORS["white"]),
            ppt_line(1420, 680, 240, -260, COLORS["white"], 3),
            ppt_line(1420, 420, 240, 260, COLORS["white"], 3),
        ]
    elif s == "contents":
        shapes += [
            ppt_rect(0, 0, 180, H, COLORS["navy"]),
            ppt_text(58, 700, 100, 160, slide["eyebrow"], 96, COLORS["white"]),
            ppt_text(240, 112, 650, 90, slide["title"], 56, COLORS["ink"], True),
            ppt_text(240, 198, 820, 40, slide["subtitle"], 20, COLORS["muted"]),
        ]
        for i, label in enumerate(["SAMPLE Context", "SAMPLE Approach", "SAMPLE Solution", "SAMPLE Execution", "SAMPLE Appendix"]):
            y = 278 + i * 112
            shapes += [
                ppt_text(240, y, 600, 42, label, 26, COLORS["ink"]),
                ppt_text(1600, y, 80, 36, f"0{i+1}", 20, COLORS["muted"]),
                ppt_line(240, y + 46, 1420, 0, COLORS["paper"], 3),
            ]
    elif s == "divider":
        shapes += [
            ppt_text(1260, 70, 500, 260, slide["eyebrow"], 180, COLORS["white"]),
            ppt_text(60, 96, 500, 44, "SAMPLE SECTION", 22, COLORS["white"]),
            ppt_text(60, 664, 920, 230, slide["title"], 66, COLORS["white"], True),
            ppt_text(60, 900, 900, 40, f"예시: {slide['subtitle']}", 22, COLORS["white"]),
        ]
    elif s == "statement":
        shapes += [
            ppt_rect(60, 112, 8, 720, COLORS["cobalt"]),
            ppt_text(112, 118, 420, 42, slide["eyebrow"], 18, COLORS["muted"]),
            ppt_text(112, 300, 940, 210, slide["title"], 44, COLORS["ink"], True),
            ppt_rect(112, 682, 108, 6, COLORS["amber"]),
            ppt_text(112, 730, 760, 50, slide["subtitle"], 22, COLORS["muted"]),
            ppt_text(1260, 188, 460, 40, "SAMPLE extension / guide.md", 18, COLORS["muted"]),
            ppt_rect(1260, 254, 500, 330, COLORS["paper"]),
            ppt_text(1340, 388, 360, 90, "SAMPLE\nicon extension", 28, COLORS["icon"], True),
            ppt_text(1340, 610, 420, 40, "SAMPLE: house to gold bars", 18, COLORS["ink"]),
        ]
    elif s == "metrics":
        shapes += [
            ppt_text(60, 116, 920, 180, slide["title"], 56, COLORS["ink"], True),
            ppt_text(60, 266, 860, 40, slide["subtitle"], 20, COLORS["muted"]),
        ]
        shapes.append(ppt_text(60, 328, 420, 32, "예시 데이터 / SAMPLE", 16, COLORS["muted"]))
        for i, num in enumerate(["32%", "4.8×", "12w"]):
            x = 190 + i * 545
            shapes += [
                ppt_line(x, 374, 360, 0, COLORS["cobalt"], 3),
                ppt_text(x, 440, 390, 90, num, 52, COLORS["ink"], True),
                ppt_text(x, 566, 390, 36, "예시: 편집 가능한 지표 설명", 18, COLORS["muted"]),
                ppt_text(x, 610, 390, 36, "SAMPLE evidence / source", 18, COLORS["muted"]),
            ]
    elif s == "comparison":
        shapes += [
            ppt_text(60, 104, 880, 170, slide["title"], 56, COLORS["ink"], True),
            ppt_text(60, 258, 900, 38, slide["subtitle"], 20, COLORS["muted"]),
            ppt_rect(120, 382, 760, 370, COLORS["white"]),
            ppt_rect(1040, 382, 760, 370, COLORS["white"]),
            ppt_text(168, 420, 650, 50, "SAMPLE Before / Option A", 26, COLORS["ink"]),
            ppt_text(1088, 420, 650, 50, "SAMPLE After / Option B", 26, COLORS["ink"]),
            ppt_line(168, 496, 664, 0, COLORS["paper"], 3),
            ppt_line(1088, 496, 664, 0, COLORS["cobalt"], 3),
            ppt_text(168, 542, 520, 38, "예시: 비교 항목 01", 20, COLORS["muted"]),
            ppt_text(1088, 542, 520, 38, "예시: 차별화 메시지 01", 20, COLORS["muted"]),
            ppt_text(168, 610, 520, 38, "SAMPLE 비교 항목 02", 20, COLORS["muted"]),
            ppt_text(1088, 610, 520, 38, "SAMPLE 차별화 메시지 02", 20, COLORS["muted"]),
        ]
    elif s == "process":
        shapes += [
            ppt_text(60, 112, 900, 180, slide["title"], 56, COLORS["ink"], True),
            ppt_text(60, 266, 880, 42, slide["subtitle"], 20, COLORS["muted"]),
            ppt_line(230, 534, 1260, 0, COLORS["paper"], 6),
        ]
        for i, word in enumerate(["Discover", "Design", "Build", "Verify"]):
            x = 230 + i * 420
            shapes += [
                ppt_ellipse(x - 74, 460, 148, 148, COLORS["paper"], COLORS["cobalt"], 3),
                ppt_text(x - 20, 510, 60, 40, str(i + 1), 24, COLORS["ink"]),
                ppt_text(x - 108, 644, 240, 40, f"SAMPLE {word}", 22, COLORS["ink"]),
                ppt_text(x - 108, 700, 240, 34, "예시: 산출물 설명", 18, COLORS["muted"]),
            ]
    elif s == "case-study":
        shapes += [
            ppt_rect(0, 0, 560, H, COLORS["navy"]),
            ppt_text(60, 126, 420, 180, slide["title"], 56, COLORS["white"], True),
            ppt_text(60, 340, 420, 42, slide["subtitle"], 20, COLORS["white"]),
            ppt_rect(720, 178, 980, 220, COLORS["paper"]),
            ppt_rect(720, 450, 980, 220, COLORS["paper"]),
            ppt_rect(720, 722, 980, 120, COLORS["cobalt"]),
            ppt_text(770, 228, 500, 50, "SAMPLE Challenge", 26, COLORS["ink"]),
            ppt_text(770, 500, 500, 50, "SAMPLE Approach", 26, COLORS["ink"]),
            ppt_text(770, 770, 500, 50, "SAMPLE Result", 26, COLORS["white"]),
        ]
    elif s == "gallery":
        shapes += [
            ppt_text(60, 108, 900, 180, slide["title"], 56, COLORS["white"], True),
            ppt_text(60, 260, 860, 42, slide["subtitle"], 20, COLORS["white"]),
        ]
        for i in range(3):
            x = 120 + i * 560
            shapes += [
                ppt_rect(x, 350, 440, 330, COLORS["paper"]),
                ppt_line(x + 64, 604, 122, -114, COLORS["muted"], 3),
                ppt_line(x + 186, 490, 106, 80, COLORS["muted"], 3),
                ppt_line(x + 292, 570, 78, -50, COLORS["muted"], 3),
                ppt_ellipse(x + 306, 402, 56, 56, COLORS["amber"]),
                ppt_text(x, 716, 360, 40, f"SAMPLE Reference {i+1}", 20, COLORS["white"]),
            ]
    elif s == "closing":
        shapes += [
            ppt_text(60, 104, 620, 42, slide["eyebrow"], 22, COLORS["white"]),
            ppt_text(60, 330, 900, 260, slide["title"], 72, COLORS["white"], True),
            ppt_text(60, 690, 760, 50, slide["subtitle"], 24, COLORS["white"]),
            ppt_line(1230, 368, 500, 0, COLORS["white"], 3),
            ppt_line(1230, 508, 500, 0, COLORS["white"], 3),
            ppt_line(1230, 648, 500, 0, COLORS["white"], 3),
        ]
    add_footer()
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    {"".join(shapes)}
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>"""


def make_pptx() -> None:
    global NEXT_PPT_ID
    NEXT_PPT_ID = 2
    pptx = TEMPLATES / "ark-proposal.pptx"
    if pptx.exists():
        pptx.unlink()
    slide_count = len(SLIDES)
    content_types = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">']
    for part, ctype in [
        ("/_rels/.rels", "application/vnd.openxmlformats-package.relationships+xml"),
        ("/ppt/presentation.xml", "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"),
        ("/ppt/slideMasters/slideMaster1.xml", "application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"),
        ("/ppt/slideLayouts/slideLayout1.xml", "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"),
        ("/ppt/theme/theme1.xml", "application/vnd.openxmlformats-officedocument.theme+xml"),
        ("/docProps/core.xml", "application/vnd.openxmlformats-package.core-properties+xml"),
        ("/docProps/app.xml", "application/vnd.openxmlformats-officedocument.extended-properties+xml"),
    ]:
        content_types.append(f'<Override PartName="{part}" ContentType="{ctype}"/>')
    for i in range(1, slide_count + 1):
        content_types.append(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')
    content_types.append("</Types>")

    presentation_rels = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">']
    for i in range(1, slide_count + 1):
        presentation_rels.append(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i}.xml"/>')
    presentation_rels.append(f'<Relationship Id="rId{slide_count+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>')
    presentation_rels.append(f'<Relationship Id="rId{slide_count+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>')
    presentation_rels.append("</Relationships>")

    slide_ids = "".join(f'<p:sldId id="{255+i}" r:id="rId{i}"/>' for i in range(1, slide_count + 1))
    presentation = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId{slide_count+1}"/></p:sldMasterIdLst>
  <p:sldIdLst>{slide_ids}</p:sldIdLst>
  <p:sldSz cx="{W*9525}" cy="{H*9525}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>"""

    color_map = '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
    blank_master = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>{color_map}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>"""
    blank_layout = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>"""
    theme = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="ARK"><a:themeElements><a:clrScheme name="ARK"><a:dk1><a:srgbClr val="1A2646"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="061A58"/></a:dk2><a:lt2><a:srgbClr val="F4F4F8"/></a:lt2><a:accent1><a:srgbClr val="011187"/></a:accent1><a:accent2><a:srgbClr val="EEC12B"/></a:accent2><a:accent3><a:srgbClr val="516086"/></a:accent3><a:accent4><a:srgbClr val="091955"/></a:accent4><a:accent5><a:srgbClr val="F7C51E"/></a:accent5><a:accent6><a:srgbClr val="D6D9E5"/></a:accent6><a:hlink><a:srgbClr val="011187"/></a:hlink><a:folHlink><a:srgbClr val="061A58"/></a:folHlink></a:clrScheme><a:fontScheme name="ARK"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface="Malgun Gothic"/><a:cs typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface="Malgun Gothic"/><a:cs typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="ARK"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"/></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="1"/></a:gradFill><a:noFill/></a:fillStyleLst><a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"/></a:gs><a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="50000"/></a:schemeClr></a:gs></a:gsLst><a:lin ang="5400000" scaled="1"/></a:gradFill><a:noFill/></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>"""

    with zipfile.ZipFile(pptx, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", "".join(content_types))
        z.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>""")
        z.writestr("docProps/core.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>ARK Proposal Templates</dc:title><dc:creator>Codex</dc:creator></cp:coreProperties>""")
        z.writestr("docProps/app.xml", f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Codex</Application><Slides>{slide_count}</Slides></Properties>""")
        z.writestr("ppt/presentation.xml", presentation)
        z.writestr("ppt/_rels/presentation.xml.rels", "".join(presentation_rels))
        z.writestr("ppt/slideMasters/slideMaster1.xml", blank_master)
        z.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>""")
        z.writestr("ppt/slideLayouts/slideLayout1.xml", blank_layout)
        z.writestr("ppt/slideLayouts/_rels/slideLayout1.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>""")
        z.writestr("ppt/theme/theme1.xml", theme)
        for i, slide in enumerate(SLIDES, 1):
            z.writestr(f"ppt/slides/slide{i}.xml", slide_xml(slide, i))
            z.writestr(f"ppt/slides/_rels/slide{i}.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>""")


def main() -> None:
    TEMPLATES.mkdir(exist_ok=True)
    DATA.mkdir(exist_ok=True)
    for old in TEMPLATES.glob("*.svg"):
        old.unlink()
    records = write_svg_templates()
    body, css = a4_html()
    (TEMPLATES / "proposal-a4.html").write_text(body, encoding="utf-8")
    (TEMPLATES / "proposal-a4.css").write_text(css, encoding="utf-8")
    make_pptx()
    records.append({
        "id": "proposal-a4",
        "name": "A4 Proposal",
        "description": "편집, 로컬 저장, HTML 다운로드, 인쇄가 가능한 4페이지 A4 제안서 템플릿.",
        "sourcePages": [4, 15, 26, 52],
        "svg": "templates/proposal-a4.html",
        "category": "document",
    })
    (DATA / "templates.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(SLIDES)} SVG masters, A4 HTML/CSS, PPTX, and data/templates.json")


if __name__ == "__main__":
    main()
