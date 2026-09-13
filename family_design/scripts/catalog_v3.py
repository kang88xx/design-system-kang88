"""Compose the exhaustive source browser into the Edition 02 catalog."""
from __future__ import annotations

import pathlib
import re

from catalog_v2 import enhance as enhance_v2

ROOT = pathlib.Path(__file__).resolve().parents[1]


def _add_head_asset(page: str, href: str) -> str:
    if re.search(rf'<link\b[^>]*\bhref="{re.escape(href)}"', page):
        return page
    return page.replace("</head>", f'<link rel="stylesheet" href="{href}"></head>', 1)


def _add_body_script(page: str, src: str) -> str:
    if re.search(rf'<script\b[^>]*\bsrc="{re.escape(src)}"', page):
        return page
    return page.replace("</body>", f'<script src="{src}"></script></body>', 1)


def _section_after(page: str, section_id: str, insertion: str) -> str:
    marker = f'<section id="{section_id}"'
    start = page.find(marker)
    if start < 0 or insertion in page:
        return page
    end = page.find("</section>", start)
    if end < 0:
        return page
    end += len("</section>")
    return page[:end] + insertion + page[end:]


def _replace_nav(page: str) -> str:
    match = re.search(r'<nav aria-label="문서 목차">.*?</nav>', page, flags=re.S)
    if not match:
        return page
    nav = match.group(0)
    if "#source-library" in nav:
        return page
    nav = nav.replace(
        '<a href="#motion">01 · Motion playground <span>LIVE</span></a>',
        '<a href="#source-library">01 · Source browser <span>ALL</span></a>'
        '<a href="#motion">02 · Motion playground <span>LIVE</span></a>',
    )
    replacements = {
        "02 · Product films": "03 · Product films",
        "03 · Scene atlas": "04 · Scene atlas",
        "04 · Shapes & assets": "05 · Shapes & assets",
        "05 · Colors": "06 · Colors",
        "06 · Typography": "07 · Typography",
        "07 · Layout & shape": "08 · Layout & shape",
        "08 · Controls": "09 · Controls",
        "09 · Sources": "10 · Sources",
        "10 · Handoff": "11 · Handoff",
    }
    for old, new in replacements.items():
        nav = nav.replace(old, new)
    return page[: match.start()] + nav + page[match.end() :]


def _renumber_sections(page: str) -> str:
    replacements = {
        '<div class="section-label">01 / MOTION PLAYGROUND</div>': '<div class="section-label">02 / MOTION PLAYGROUND</div>',
        '<div class="section-label">02 / ORIGINAL PRODUCT FILMS</div>': '<div class="section-label">03 / ORIGINAL PRODUCT FILMS</div>',
        '<div class="section-label">03 / COMPLETE SCENE ATLAS</div>': '<div class="section-label">04 / COMPLETE SCENE ATLAS</div>',
        '<div class="section-label">04 / ORIGINAL SHAPES & ASSETS</div>': '<div class="section-label">05 / ORIGINAL SHAPES & ASSETS</div>',
        '<div class="section-label">05 / COLOR</div>': '<div class="section-label">06 / COLOR</div>',
        '<div class="section-label">06 / TYPOGRAPHY</div>': '<div class="section-label">07 / TYPOGRAPHY</div>',
        '<div class="section-label">07 / LAYOUT & SHAPE</div>': '<div class="section-label">08 / LAYOUT & SHAPE</div>',
        '<div class="section-label">08 / COMPONENTS</div>': '<div class="section-label">09 / COMPONENTS</div>',
        '<div class="section-label">09 / REFERENCE & RESEARCH</div>': '<div class="section-label">10 / REFERENCE & RESEARCH</div>',
        '<div class="section-label">10 / HANDOFF</div>': '<div class="section-label">11 / HANDOFF</div>',
    }
    for old, new in replacements.items():
        page = page.replace(old, new)
    return page


def _priority_overview_links(page: str) -> str:
    page = page.replace("VISUAL SYSTEM / EDITION 02", "VISUAL SYSTEM / EDITION 03", 1)
    needle = '<div class="tag-row">'
    if needle in page and 'href="#source-library"' not in page.split(needle, 1)[1].split("</div>", 1)[0]:
        page = page.replace(needle, '<div class="tag-row"><a href="#source-library">전체 소스 탐색 ↗</a>', 1)
    return page


def _source_section() -> str:
    return """
<section id="source-library">
  <div class="section-label">01 / COMPLETE SOURCE BROWSER</div>
  <div class="section-heading">
    <div>
      <h2>All sources, searchable.</h2>
      <p>추출된 SVG, hero shape, 영상, 폰트, 토큰, 코드, 캡처와 대체 구현을 한 화면에서 확인합니다.<br>비공개이거나 구조가 확인되지 않은 앱 흐름은 원본 영상과 로컬 재구성을 분리해 표시합니다.</p>
    </div>
    <span class="count-bubble">ALL</span>
  </div>
  <div id="source-library-root"></div>
</section>"""


def _dialog() -> str:
    return '<dialog id="source-inspector" class="source-dialog" aria-label="소스 상세 검사"></dialog>'


def _handoff_links(page: str) -> str:
    marker = '<div class="downloads">'
    if marker not in page:
        return page
    links = (
        '<a href="system.html">프로젝트 적용 가이드 <span>↗</span></a>'
        '<a href="family-project-kit.zip" download>실무용 프로젝트 키트 <span>↓</span></a>'
        '<a href="family-design-system-1.0.0.tgz" download>npm 로컬 설치 패키지 <span>↓</span></a>'
        '<a href="source-library.json" download>Source manifest JSON <span>↓</span></a>'
        '<a href="source-library-data.js" download>Source embedded data <span>↓</span></a>'
        '<a href="source-library.css" download>Source browser CSS <span>↓</span></a>'
        '<a href="source-library.js" download>Source browser JS <span>↓</span></a>'
        '<a href="app-reconstructions.html">Private app substitutes <span>↗</span></a>'
        '<a href="app-reconstructions.css" download>App substitute CSS <span>↓</span></a>'
        '<a href="app-reconstructions.js" download>App substitute JS <span>↓</span></a>'
    )
    existing = page.find(marker)
    end = existing + len(marker)
    if "source-library.json" in page[existing : page.find("</div>", existing)]:
        return page
    return page[:end] + links + page[end:]


def _evidence_link(page: str) -> str:
    needle = '<div class="reference-notes"><h3>두 버전, 하나의 디자인 언어</h3>'
    if needle not in page or "app-reconstructions.html" in page.split(needle, 1)[1].split("</div>", 1)[0]:
        return page
    insert = (
        '<div class="reference-notes"><h3>두 버전, 하나의 디자인 언어</h3>'
        '<p>비공개 앱 내부 구조는 원본으로 단정하지 않고, 원본 MP4 옆에 조작 가능한 대체 구현으로 보완했습니다.</p>'
        '<a href="app-reconstructions.html">비공개 앱 흐름 대체 구현 열기 ↗</a>'
    )
    return page.replace(needle, insert, 1)


def enhance(page: str) -> str:
    """Return an Edition 03 catalog page with the full source browser added."""
    page = enhance_v2(page)
    page = _add_head_asset(page, "source-library.css")
    page = _priority_overview_links(page)
    page = page.replace("VISUAL SYSTEM / EDITION 03", "PROJECT SYSTEM / EDITION 04")
    page = page.replace('<nav aria-label="문서 목차">', '<nav aria-label="문서 목차"><a href="system.html">프로젝트에 적용하기 <span>1.0</span></a>', 1)
    page = page.replace('<div class="tag-row">', '<div class="tag-row"><a href="system.html">프로젝트 적용 가이드 ↗</a><a href="family-project-kit.zip" download>실무용 키트 ZIP ↓</a>', 1)
    page = _replace_nav(page)
    page = _renumber_sections(page)
    page = _section_after(page, "overview", _source_section())
    page = _handoff_links(page)
    page = _evidence_link(page)
    page = page.replace('<div id="toast"', _dialog() + '<div id="toast"', 1)
    if (ROOT / "source-library-data.js").exists():
        page = _add_body_script(page, "source-library-data.js")
    page = _add_body_script(page, "source-library.js")
    return page


# ==========================================================================
# Studio shell (Apple 포맷) — 규격 ../../All/shell/SPEC.md
# 조립이 끝난 페이지 문자열의 DOM 순서만 스튜디오 셸로 바꾼다.
# 텍스트·링크·id·data-* 는 하나도 지우지 않고 감싸는 요소와 위치만 바꾼다.
# 하위 페이지(system.html 등)는 page_shell_open() / page_sidebar() 를 쓴다.
# ==========================================================================

BRAND_BADGE = "WEB"
ORIGINAL_SITE = "https://family.co"
VERSION_LABEL = "2026.09"

# 히어로 통계 스트립 (개요 칩의 숫자를 숫자+라벨로 노출. 원래 칩 링크는 tag-row에 그대로 남는다)
STATS = [
    ("22", "interactive previews"),
    ("9", "original product films"),
    ("14", "reference scenes"),
    ("49", "color tokens"),
]

# .as-title-actions로 승격할 칩 (1차 CTA / 2차 링크). 나머지 칩은 tag-row에 남는다.
PRIMARY_CTA = '<a href="system.html">프로젝트 적용 가이드 ↗</a>'
SECONDARY_CTA = '<a href="#source-library">전체 소스 탐색 ↗</a>'


def _head(page: str) -> str:
    page = page.replace(
        '<link rel="stylesheet" href="tokens.css">',
        '<link rel="stylesheet" href="studio-shell.css"><link rel="stylesheet" href="tokens.css">',
        1,
    )
    return page.replace("</head>", '<link rel="stylesheet" href="studio-brand.css"></head>', 1)


def _open_studio(page: str) -> str:
    return page.replace(
        '<body><a class="skip" href="#main">',
        '<body><div class="as-studio"><a class="as-skip-link" href="#main">Skip to content</a>'
        '<a class="skip" href="#main">',
        1,
    )


def _nav(nav_html: str) -> str:
    """기존 메뉴의 순서·라벨·href를 그대로 두고 01부터 번호를 붙인다."""
    counter = [0]

    def item(m: re.Match) -> str:
        counter[0] += 1
        attrs, label, count = m.group(1), m.group(2), m.group(3)
        index = f'<span class="as-nav-index">{counter[0]:02d}</span>'
        tail = f'<span class="as-nav-count">{count}</span>' if count is not None else ""
        return f"<a{attrs}>{index}{label.rstrip()}{tail}</a>"

    return re.sub(r"<a([^>]*)>([^<]*?)(?:<span>([^<]*)</span>)?</a>", item, nav_html)


def _sidebar(page: str) -> str:
    match = re.search(r'<aside class="sidebar">(.*?)</aside>', page, flags=re.S)
    if not match:
        return page
    inner = match.group(1)
    nav_match = re.search(r'<nav aria-label="문서 목차">(.*?)</nav>', inner, flags=re.S)
    nav = _nav(nav_match.group(1)) if nav_match else ""
    caption = re.search(r'<div class="sidebar-caption">(.*?)</div>', inner, flags=re.S)
    caption_text = caption.group(1) if caption else ""

    sidebar = (
        '<aside id="as-nav" class="sidebar as-sidebar" aria-label="Navigation">'
        '<a class="wordmark as-brand" href="#overview">'
        '<span class="logo-mark as-brand-mark">✿</span>'
        "<div><strong>Family</strong><span class=\"small\">Design system</span></div>"
        f'<span class="as-brand-badge">{BRAND_BADGE}</span></a>'
        '<div class="as-sidebar-group">'
        '<span class="as-sidebar-label">WORKSPACE</span>'
        f'<div class="sidebar-caption as-sidebar-caption">{caption_text}</div>'
        f'<nav aria-label="문서 목차">{nav}</nav>'
        "</div>"
        '<div class="sidebar-bottom as-sidebar-bottom">'
        '<span class="status-dot as-status-dot"></span>'
        "<span> Captured 2026.09.06"
        '<small><a href="DESIGN.md">전체 명세 읽기 ↗</a> · <a href="tokens.json" download>JSON 다운로드 ↓</a></small>'
        "</span>"
        f'<a href="{ORIGINAL_SITE}" target="_blank" rel="noreferrer" aria-label="Open original website">↗</a>'
        "</div>"
        "</aside>"
        '<button class="as-sidebar-scrim" aria-label="Close navigation" hidden></button>'
    )
    return page[: match.start()] + sidebar + page[match.end() :]


def _topbar(page: str) -> str:
    """옛 topbar 줄은 히어로로 옮기고, 그 자리에 스튜디오 상단바를 세운다."""
    old = (
        '<main id="main"><header class="topbar">'
        "<span>FAMILY / SYSTEM LIBRARY</span>"
        '<span class="badge">SOURCE + RECONSTRUCTION</span></header>'
    )
    new = (
        '<div class="as-main-shell">'
        '<header class="as-topbar">'
        '<button class="as-mobile-nav-button" aria-controls="as-nav" aria-expanded="false" aria-label="Open navigation">☰</button>'
        '<div class="as-breadcrumb"><span>Design system</span><span>/</span><strong>Overview</strong></div>'
        '<div class="as-topbar-tools">'
        "__MOTION_TOGGLE__"
        '<a class="as-export-button" href="tokens.json" download>Export tokens <span aria-hidden="true">↧</span></a>'
        "</div></header>"
        '<main id="main" tabindex="-1" class="as-workspace as-page-overview">'
    )
    return page.replace(old, new, 1)


def _move_motion_toggle(page: str) -> str:
    """전역 토글(모션 줄이기)을 상단바 도구 영역으로 옮긴다. id·aria는 그대로."""
    match = re.search(r'<button id="motion-toggle"[^>]*>.*?</button>', page, flags=re.S)
    if not match:
        return page.replace("__MOTION_TOGGLE__", "", 1)
    button = match.group(0)
    page = page[: match.start()] + page[match.end() :]
    button = button.replace(
        'class="family-button secondary compact"',
        'class="family-button secondary compact as-motion-toggle"',
        1,
    )
    return page.replace("__MOTION_TOGGLE__", button, 1)


def _overview(page: str) -> str:
    match = re.search(r'<section id="overview" class="intro">(.*?)</section>', page, flags=re.S)
    if not match:
        return page
    inner = match.group(1)

    def grab(pattern: str) -> str:
        found = re.search(pattern, inner, flags=re.S)
        return found.group(0) if found else ""

    eyebrow = grab(r'<div class="eyebrow">.*?</div>')
    heading = grab(r"<h1>.*?</h1>")
    lead = grab(r'<p class="lead">.*?</p>')
    stickers = grab(r'<div class="intro-stickers[^"]*"[^>]*>.*?</div>')
    tag_row = grab(r'<div class="tag-row">.*?</div>')
    note = grab(r'<p class="note">.*?</p>')

    chips = tag_row.replace('<div class="tag-row">', "", 1)
    chips = chips[: chips.rfind("</div>")] if chips.endswith("</div>") else chips
    remaining = chips.replace(PRIMARY_CTA, "", 1).replace(SECONDARY_CTA, "", 1)

    primary = PRIMARY_CTA.replace("<a ", '<a class="as-button" ', 1)
    secondary = SECONDARY_CTA.replace("<a ", '<a class="as-text-command" ', 1)

    stats = "".join(f"<div><strong>{n}</strong><span>{label}</span></div>" for n, label in STATS)

    hero = (
        '<div class="as-overview-title">'
        '<header class="topbar as-title-meta"><span>FAMILY / SYSTEM LIBRARY</span>'
        '<span class="badge">SOURCE + RECONSTRUCTION</span></header>'
        + eyebrow.replace(
            '<div class="eyebrow">',
            '<div class="eyebrow as-eyebrow"><span class="as-status-dot"></span>',
            1,
        ).replace("</div>", f'<span class="as-version">{VERSION_LABEL}</span></div>', 1)
        + heading
        + lead.replace('<p class="lead">', '<p class="lead as-intro">', 1)
        + f'<div class="as-title-actions">{primary}{secondary}</div>'
        + stickers
        + "</div>"
        + f'<div class="as-stats-strip">{stats}</div>'
        + f'<div class="tag-row">{remaining}</div>'
        + note
    )
    return page[: match.start()] + f'<section id="overview" class="intro">{hero}</section>' + page[match.end() :]


def _section_headings(page: str) -> str:
    """섹션 머리를 .as-section-heading 으로 통일한다 (라벨·제목·설명·액션 보존)."""
    # 1) 이미 .section-heading 을 쓰는 섹션: 앞선 section-label 을 왼쪽 칼럼 안으로 옮긴다.
    page = re.sub(
        r'<div class="section-label">(.*?)</div>\s*<div class="section-heading">\s*<div>',
        lambda m: '<div class="section-heading as-section-heading"><div>'
        f'<div class="section-label as-eyebrow">{m.group(1)}</div>',
        page,
        flags=re.S,
    )
    # 2) section-label + h2 (+ p) 만 있는 섹션: .as-section-heading 으로 감싼다.
    page = re.sub(
        r'<div class="section-label">(.*?)</div>\s*<h2>(.*?)</h2>(<p>.*?</p>)?',
        lambda m: '<div class="as-section-heading"><div>'
        f'<div class="section-label as-eyebrow">{m.group(1)}</div>'
        f"<h2>{m.group(2)}</h2>{m.group(3) or ''}</div></div>",
        page,
        flags=re.S,
    )
    return page


def _footer_and_close(page: str) -> str:
    page = page.replace("<footer>Family / Design system extraction", '<footer class="as-studio-footer">Family / Design system extraction', 1)
    page = page.replace('</main><dialog id="film-dialog"', '</main></div><dialog id="film-dialog"', 1)
    page = page.replace(
        '<div id="toast" role="status" aria-live="polite"></div>',
        '<div id="toast" role="status" aria-live="polite"></div><div class="as-toast" role="status"></div></div>',
        1,
    )
    return page.replace('<script src="motion-library.js">', '<script src="studio-shell.js"></script><script src="motion-library.js">', 1)


def apply_studio_shell(page: str) -> str:
    page = _head(page)
    page = _open_studio(page)
    page = _sidebar(page)
    page = _topbar(page)
    page = _move_motion_toggle(page)
    page = _overview(page)
    page = _section_headings(page)
    page = _footer_and_close(page)
    return page


# ==========================================================================
# 하위 페이지(별도 HTML)용 공유 셸 — 사이드바 nav 는 페이지 링크, 현재 페이지에 aria-current
# ==========================================================================

PAGES = [
    ("index.html", "전체 라이브러리", None),
    ("system.html", "프로젝트에 적용하기", "1.0"),
    ("app-reconstructions.html", "앱 흐름 재구성", None),
    ("layout-recipes.html", "Layout recipes", None),
]


def page_sidebar(current: str) -> str:
    items = []
    for i, (href, label, count) in enumerate(PAGES, 1):
        cur = ' aria-current="page"' if href == current else ""
        tail = f'<span class="as-nav-count">{count}</span>' if count else ""
        items.append(f'<a href="{href}"{cur}><span class="as-nav-index">{i:02d}</span>{label}{tail}</a>')
    return (
        '<aside id="as-nav" class="as-sidebar" aria-label="Navigation">'
        '<a class="as-brand" href="index.html">'
        '<span class="as-brand-mark">✿</span>'
        '<div><strong>Family</strong><span class="small">Design system</span></div>'
        f'<span class="as-brand-badge">{BRAND_BADGE}</span></a>'
        '<div class="as-sidebar-group">'
        '<span class="as-sidebar-label">WORKSPACE</span>'
        '<div class="as-sidebar-caption">PROJECT SYSTEM / EDITION 04</div>'
        f'<nav aria-label="문서 목차">{"".join(items)}</nav>'
        "</div>"
        '<div class="as-sidebar-bottom"><span class="as-status-dot"></span>'
        "<span> Captured 2026.09.06"
        '<small><a href="DESIGN.md">전체 명세 읽기 ↗</a> · <a href="tokens.json" download>JSON 다운로드 ↓</a></small>'
        "</span>"
        f'<a href="{ORIGINAL_SITE}" target="_blank" rel="noreferrer" aria-label="Open original website">↗</a>'
        "</div></aside>"
        '<button class="as-sidebar-scrim" aria-label="Close navigation" hidden></button>'
    )


def page_topbar(label: str, tools: str = "") -> str:
    return (
        '<div class="as-main-shell"><header class="as-topbar">'
        '<button class="as-mobile-nav-button" aria-controls="as-nav" aria-expanded="false" aria-label="Open navigation">☰</button>'
        f'<div class="as-breadcrumb"><span>Design system</span><span>/</span><strong>{label}</strong></div>'
        f'<div class="as-topbar-tools">{tools}'
        '<a class="as-export-button" href="tokens.json" download>Export tokens <span aria-hidden="true">↧</span></a>'
        "</div></header>"
    )


def page_shell_open(current: str, label: str, skip_target: str, tools: str = "") -> str:
    return (
        '<div class="as-studio">'
        f'<a class="as-skip-link" href="{skip_target}">Skip to content</a>'
        + page_sidebar(current)
        + page_topbar(label, tools)
    )


def page_shell_close(footer_note: str) -> str:
    return (
        '<footer class="as-studio-footer"><span>Family · Design system study</span>'
        f"<span>{footer_note}</span></footer>"
        '</div><div class="as-toast" role="status"></div></div>'
    )
