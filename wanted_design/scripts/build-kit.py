import json, html, re, os, glob
from pathlib import Path

ROOT = str(Path(__file__).resolve().parents[1])
OUT = f"{ROOT}/viewer/montage-design-kit.html"

design_md = open(f"{ROOT}/DESIGN.md").read()
tokens_css = open(f"{ROOT}/data/curated/tokens.css").read()
sem = json.load(open(f"{ROOT}/data/curated/tokens.semantic.json"))
typo = json.load(open(f"{ROOT}/data/curated/typography.json"))
grid = json.load(open(f"{ROOT}/data/curated/grid.json"))
meta = json.load(open(f"{ROOT}/data/curated/metadata.json"))
comps = json.load(open(f"{ROOT}/data/curated/components.json"))
comps = comps if isinstance(comps, list) else list(comps.values())[0]
icons = json.load(open(f"{ROOT}/data/curated/icon-vectors.json"))
icons = icons if isinstance(icons, list) else icons.get("icons")

# --- dark block for system theme -------------------------------------------
m = re.search(r'\[data-theme="dark"\] \{\n(.*?)\n\}', tokens_css, re.S)
dark_body = m.group(1)
system_dark = '@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n' + \
    "\n".join("  " + l for l in dark_body.splitlines()) + "\n  }\n}\n"

# --- color groups -------------------------------------------------------------
color_tokens = [(k, v) for k, v in sem.items() if not k.endswith("-rgb") and not k.startswith("--semantic-elevation")]
groups = {}
for k, v in color_tokens:
    fam = k.split("-")[3]  # --semantic-<fam>-...
    groups.setdefault(fam, []).append((k, v))
group_order = ["primary", "label", "background", "line", "fill", "status", "interaction", "inverse", "static", "material", "accent"]
group_label = {
    "primary": "Primary", "label": "Label (텍스트)", "background": "Background", "line": "Line",
    "fill": "Fill", "status": "Status", "interaction": "Interaction", "inverse": "Inverse",
    "static": "Static", "material": "Material", "accent": "Accent",
}

def swatches(items):
    out = []
    for k, v in items:
        short = k.replace("--semantic-", "")
        out.append(f'''<div class="sw">
  <div class="sw-chips"><span class="chip chip-l" style="background:{v['light']}" title="light {v['light']}"></span><span class="chip chip-d" style="background:{v['dark']}" title="dark {v['dark']}"></span></div>
  <div class="sw-name">{html.escape(short)}</div>
  <div class="sw-vals"><span>{v['light']}</span><span>{v['dark']}</span></div>
</div>''')
    return "\n".join(out)

color_html = ""
for g in group_order:
    if g not in groups: continue
    color_html += f'<h3 class="sub">{group_label[g]} <span class="count">{len(groups[g])}</span></h3>\n<div class="sw-grid">\n{swatches(groups[g])}\n</div>\n'

# --- elevation ----------------------------------------------------------------
elev = [(k, v) for k, v in sem.items() if k.startswith("--semantic-elevation")]
elev_html = ""
for series, prop in (("normal", "box-shadow"), ("drop", "filter"), ("spread", "box-shadow")):
    items = [(k, v) for k, v in elev if f"-shadow-{series}-" in k]
    order = ["xsmall", "small", "medium", "large", "xlarge"]
    items.sort(key=lambda kv: order.index(kv[0].rsplit("-", 1)[1]))
    cards = "".join(
        f'<div class="el" style="{prop}:var({k})"><span>{k.rsplit("-",1)[1]}</span></div>' for k, v in items)
    elev_html += f'<h3 class="sub">shadow-{series} <span class="count">{prop}</span></h3><div class="el-row">{cards}</div>'

# --- typography ---------------------------------------------------------------
sample = "채용의 모든 것, 원티드 Aa"
typo_rows = "".join(
    f'<div class="ty"><div class="ty-meta"><b>{t["name"]}</b><span>{t["fontSize"]} / {t["lineHeight"]} / {t["letterSpacing"]}</span></div>'
    f'<div class="ty-spec" style="font-size:{t["fontSize"]};line-height:{t["lineHeight"]};letter-spacing:{t["letterSpacing"]};font-weight:{700 if t["name"].split()[0] in ("Display","Title","Heading","Headline") else 500 if t["name"].startswith("Label") else 400}">{sample}</div></div>'
    for t in typo)

# --- grid ---------------------------------------------------------------------
def table(rows):
    head, *body = rows
    return "<table><thead><tr>" + "".join(f"<th>{html.escape(c)}</th>" for c in head) + "</tr></thead><tbody>" + \
        "".join("<tr>" + "".join(f"<td>{html.escape(c)}</td>" for c in r) + "</tr>" for r in body) + "</tbody></table>"

# --- components ---------------------------------------------------------------
cats = {}
for c in comps:
    cats.setdefault(c["category"], []).append(c)
comp_html = ""
for cat, items in cats.items():
    lis = "".join(
        f'<li><a href="https://montage.wanted.co.kr/docs/components/{cat.lower().replace(" ", "-")}/{c["slug"]}/design" target="_blank" rel="noopener">{html.escape(c["name"])}</a>'
        f'<span class="surf">{" · ".join(s for s in c.get("availableSurfaces", []) if s != "design")}</span></li>' for c in items)
    comp_html += f'<div class="comp-cat"><h3 class="sub">{html.escape(cat)} <span class="count">{len(items)}</span></h3><ul class="comp-list">{lis}</ul></div>'

# --- icons --------------------------------------------------------------------
icon_html = ""
for ic in icons:
    svg = open(f"{ROOT}/{ic['localPath']}").read().strip()
    svg = re.sub(r'\s(width|height)="\d+"', "", svg, count=2)
    icon_html += f'<figure class="ic" data-name="{ic["name"]}">{svg}<figcaption>{ic["name"]}</figcaption></figure>\n'

# --- instructions -------------------------------------------------------------
claude_block = """## Design System

Always read `DESIGN.md` before making visual or UI decisions.
Use `--semantic-*` CSS custom properties from `wds-tokens.css`; do not hard-code colors, shadows, or letter-spacing. Never reference `--atomic-*` directly in component CSS.
Do not deviate from DESIGN.md without explicit user approval. In QA mode, flag code that does not match it.
Source of truth: Wanted Montage design system (MIT), captured 2026-09-01."""

page = f'''<title>Montage Design Kit</title>
<meta name="description" content="Wanted Montage design system: agent-readable DESIGN.md, light/dark tokens.css, type scale, semantic colors, 339 icons.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap">
<style>
{tokens_css}
{system_dark}
:root {{
  --font: "Pretendard JP Variable", Pretendard, "Noto Sans KR", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --bg: var(--semantic-background-normal-normal);
  --bg-alt: var(--semantic-background-normal-alternative);
  --bg-el: var(--semantic-background-elevated-normal);
  --fg: var(--semantic-label-normal);
  --fg-2: var(--semantic-label-neutral);
  --fg-3: var(--semantic-label-alternative);
  --line: var(--semantic-line-solid-normal);
  --line-2: var(--semantic-line-normal-normal);
  --fill: var(--semantic-fill-normal);
  --primary: var(--semantic-primary-normal);
  --primary-rgb: var(--semantic-primary-normal-rgb);
}}
html {{ color-scheme: light dark; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--fg); font-family: var(--font); font-size: 15px; line-height: 22px; letter-spacing: 0.0096em; -webkit-font-smoothing: antialiased; }}
a {{ color: var(--primary); text-decoration: none; }}
a:hover {{ text-decoration: underline; }}
:focus-visible {{ outline: 2px solid var(--primary); outline-offset: 2px; }}
code, pre {{ font-family: var(--mono); }}
code {{ font-size: 13px; background: var(--fill); padding: 1px 5px; border-radius: 4px; }}
pre {{ font-size: 12.5px; line-height: 18px; background: var(--bg-alt); border: 1px solid var(--line); border-radius: 8px; padding: 16px; overflow-x: auto; margin: 0; white-space: pre; }}
pre code {{ background: none; padding: 0; font-size: inherit; }}

.wrap {{ max-width: var(--layout-max-width); margin: 0 auto; padding: 0 var(--layout-padding-inline); }}
@media (max-width: 768px) {{ .wrap {{ padding: 0 20px; }} }}

.gnb {{ height: var(--gnb-height); border-bottom: 1px solid var(--line); position: sticky; top: 0; background: rgba(var(--semantic-background-normal-normal-rgb), .88); backdrop-filter: blur(12px); z-index: 5; }}
.gnb .wrap {{ height: 100%; display: flex; align-items: center; gap: 24px; }}
.brand {{ font-weight: 700; font-size: 17px; letter-spacing: 0; display: flex; align-items: center; gap: 10px; }}
.brand i {{ width: 10px; height: 10px; border-radius: 3px; background: var(--primary); display: inline-block; }}
.gnb nav {{ display: flex; gap: 18px; margin-left: auto; font-size: 14px; font-weight: 500; overflow-x: auto; }}
.gnb nav a {{ color: var(--fg-2); white-space: nowrap; }}
.gnb nav a:hover {{ color: var(--fg); text-decoration: none; }}
.theme {{ border: 1px solid var(--line); background: var(--bg-el); color: var(--fg); font: inherit; font-size: 13px; padding: 5px 10px; border-radius: 6px; cursor: pointer; }}

header.hero {{ padding: 56px 0 40px; border-bottom: 1px solid var(--line); }}
.eyebrow {{ font-size: 12px; line-height: 16px; letter-spacing: 0.0252em; text-transform: uppercase; color: var(--primary); font-weight: 600; }}
h1 {{ font-size: 40px; line-height: 52px; letter-spacing: -0.0282em; font-weight: 700; margin: 8px 0 12px; text-wrap: balance; }}
.lede {{ font-size: 17px; line-height: 26px; letter-spacing: 0; color: var(--fg-2); max-width: 640px; margin: 0; }}
.stats {{ display: flex; flex-wrap: wrap; gap: 8px 28px; margin-top: 28px; font-variant-numeric: tabular-nums; }}
.stats div {{ font-size: 13px; color: var(--fg-3); }}
.stats b {{ display: block; font-size: 22px; line-height: 30px; letter-spacing: -0.0194em; color: var(--fg); font-weight: 700; }}

section {{ padding: 48px 0; border-bottom: 1px solid var(--line-2); }}
h2 {{ font-size: 24px; line-height: 32px; letter-spacing: -0.023em; font-weight: 700; margin: 0 0 6px; }}
.h2-note {{ color: var(--fg-3); margin: 0 0 24px; font-size: 14px; line-height: 20px; }}
h3.sub {{ font-size: 14px; line-height: 20px; letter-spacing: 0.0145em; font-weight: 600; margin: 28px 0 12px; display: flex; align-items: baseline; gap: 8px; }}
h3.sub .count {{ font-weight: 500; color: var(--fg-3); font-family: var(--mono); font-size: 12px; }}

.agent {{ background: var(--bg-alt); border: 1px solid var(--line); border-left: 3px solid var(--primary); border-radius: 8px; padding: 20px 24px; margin-top: 28px; }}
.agent h2 {{ font-size: 18px; line-height: 26px; letter-spacing: -0.002em; margin-bottom: 8px; }}
.agent ol {{ margin: 8px 0 0; padding-left: 20px; }}
.agent li {{ margin: 6px 0; }}

table {{ border-collapse: collapse; width: 100%; font-size: 14px; line-height: 20px; font-variant-numeric: tabular-nums; }}
th, td {{ text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line-2); vertical-align: top; }}
th {{ font-size: 12px; letter-spacing: 0.0252em; text-transform: uppercase; color: var(--fg-3); font-weight: 600; }}
.tbl {{ overflow-x: auto; }}

.ty {{ display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: baseline; padding: 14px 0; border-bottom: 1px solid var(--line-2); }}
.ty-meta b {{ display: block; font-size: 14px; font-weight: 600; }}
.ty-meta span {{ font-size: 12px; color: var(--fg-3); font-family: var(--mono); }}
.ty-spec {{ overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }}
@media (max-width: 768px) {{ .ty {{ grid-template-columns: 1fr; gap: 4px; }} }}

.sw-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }}
.sw {{ border: 1px solid var(--line); border-radius: 8px; padding: 8px; background: var(--bg-el); }}
.sw-chips {{ display: flex; height: 44px; border-radius: 5px; overflow: hidden; border: 1px solid var(--line-2); }}
.chip {{ flex: 1; }}
.chip-l {{ background-image: linear-gradient(45deg,#fff 25%,transparent 25%,transparent 75%,#fff 75%),linear-gradient(45deg,#fff 25%,#e8e8ea 25%,#e8e8ea 75%,#fff 75%); background-size: 12px 12px; background-position: 0 0,6px 6px; }}
.chip-d {{ background-image: linear-gradient(45deg,#1b1c1e 25%,transparent 25%,transparent 75%,#1b1c1e 75%),linear-gradient(45deg,#1b1c1e 25%,#2b2c2f 25%,#2b2c2f 75%,#1b1c1e 75%); background-size: 12px 12px; background-position: 0 0,6px 6px; }}
.sw-chips .chip {{ position: relative; }}
.sw-chips .chip::after {{ content: ""; position: absolute; inset: 0; background: inherit; }}
.sw-name {{ font-family: var(--mono); font-size: 11.5px; line-height: 16px; margin-top: 8px; word-break: break-all; }}
.sw-vals {{ display: flex; justify-content: space-between; font-family: var(--mono); font-size: 11px; color: var(--fg-3); margin-top: 2px; }}

.el-row {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 24px; padding: 12px 0 8px; }}
.el {{ height: 88px; border-radius: 12px; background: var(--bg-el); display: grid; place-items: center; font-family: var(--mono); font-size: 12px; color: var(--fg-2); }}

.comp-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0 32px; }}
.comp-list {{ list-style: none; margin: 0; padding: 0; }}
.comp-list li {{ display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--line-2); font-size: 14px; }}
.surf {{ font-size: 11px; color: var(--fg-3); font-family: var(--mono); white-space: nowrap; }}

.ic-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }}
.ic {{ margin: 0; border: 1px solid var(--line-2); border-radius: 8px; padding: 12px 6px 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--fg); background: var(--bg-el); }}
.ic svg {{ width: 24px; height: 24px; }}
.ic figcaption {{ font-family: var(--mono); font-size: 10px; line-height: 12px; color: var(--fg-3); text-align: center; word-break: break-all; }}
.ic-search {{ width: 100%; max-width: 360px; font: inherit; padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-el); color: var(--fg); margin-bottom: 16px; }}

details {{ margin-top: 16px; }}
summary {{ cursor: pointer; font-weight: 600; font-size: 14px; padding: 10px 0; }}
summary code {{ font-weight: 500; }}
footer {{ padding: 32px 0 56px; font-size: 13px; line-height: 18px; color: var(--fg-3); }}
footer p {{ margin: 4px 0; max-width: 640px; }}
@media (prefers-reduced-motion: no-preference) {{ .theme, .comp-list a {{ transition: color .15s; }} }}
</style>

<div class="gnb"><div class="wrap">
  <div class="brand"><i></i>Montage Design Kit</div>
  <nav><a href="index.html">Interactive catalog ↗</a><a href="#for-agents">Agent</a><a href="#type">Type</a><a href="#color">Color</a><a href="#elevation">Elevation</a><a href="#grid">Grid</a><a href="#components">Components</a><a href="#icons">Icons</a><a href="#sources">Sources</a></nav>
  <button class="theme" id="theme" type="button" aria-label="테마 전환">테마</button>
</div></div>

<header class="hero"><div class="wrap">
  <p><a href="index.html#sources">새 카탈로그: 모션·인터랙션·전체 자산·359개 아이콘·코드 복사 ↗</a> · <a href="../exports/montage-reuse.zip" download>재사용 ZIP 다운로드</a></p>
  <div class="eyebrow">Wanted Montage · captured {meta["collectedAt"][:10]}</div>
  <h1>원티드 Montage 디자인 시스템 키트</h1>
  <p class="lede">공개 디자인 시스템 <a href="https://montage.wanted.co.kr/" target="_blank" rel="noopener">montage.wanted.co.kr</a>에서 수집한 토큰·타이포·컴포넌트 규칙을 한 페이지에 담았다. 사람이 훑어보고, AI 에이전트가 읽어서 프로젝트에 그대로 적용할 수 있다.</p>
  <div class="stats">
    <div><b>{len([k for k in sem if not k.endswith('-rgb')])}</b>semantic tokens</div>
    <div><b>{len(comps)}</b>components</div>
    <div><b>{len(typo)}</b>type styles</div>
    <div><b>{len(icons)}</b>icons</div>
    <div><b>MIT</b>license</div>
  </div>
  <div class="agent" id="for-agents">
    <h2>AI 에이전트가 이 페이지를 읽었을 때 할 일</h2>
    <p style="margin:0;color:var(--fg-2)">"이 링크의 디자인 시스템을 읽어서 이 프로젝트에 적용해줘"라는 요청이면 아래 순서로 진행한다. 원본 파일은 이 문서 하단 <a href="#sources">Sources</a>의 <code>&lt;pre&gt;</code> 블록에 그대로 들어 있다.</p>
    <ol>
      <li><code>&lt;pre id="design-md"&gt;</code> 내용을 프로젝트 루트에 <code>DESIGN.md</code>로 저장한다. 이미 있으면 diff를 보여주고 사용자 결정에 따른다.</li>
      <li><code>&lt;pre id="tokens-css"&gt;</code> 내용을 스타일 디렉터리(<code>src/styles/</code>, <code>src/app/</code>, <code>styles/</code>, <code>app/</code> 순, 없으면 <code>design/</code>)에 <code>wds-tokens.css</code>로 저장한다. 라이트 값은 <code>:root</code>, 다크 값은 <code>[data-theme="dark"]</code> 블록이다.</li>
      <li>전역 CSS 상단에 <code>@import "./wds-tokens.css";</code>를 추가하고, Pretendard JP 폰트 CSS <code>https://static.wanted.co.kr/fonts/pretendard/pretendard-jp/pretendardvariable-jp-dynamic-subset.min.css</code>를 연결한다.</li>
      <li><code>&lt;pre id="claude-md-block"&gt;</code> 블록을 프로젝트 <code>CLAUDE.md</code>(없으면 <code>AGENTS.md</code>, 둘 다 없으면 <code>CLAUDE.md</code> 생성)에 추가한다. 같은 블록이 이미 있으면 건너뛴다.</li>
      <li>아이콘이 필요하면 <a href="#icons">Icons</a> 섹션의 <code>figure[data-name]</code> 안 inline SVG를 이름으로 찾아 필요한 것만 복사한다. 전부 복사하지 않는다.</li>
      <li>이후 UI 작업은 DESIGN.md 규칙을 따른다. 색·그림자·자간은 <code>--semantic-*</code> 토큰만 쓰고 hex를 하드코딩하지 않는다. 원티드 로고·브랜드 자산은 쓰지 않는다.</li>
    </ol>
  </div>
</div></header>

<section id="type"><div class="wrap">
  <h2>Typography</h2>
  <p class="h2-note">기본 글꼴 Pretendard JP. 제목류는 음수 자간, 본문·라벨·캡션은 양수 자간. 이 페이지에서는 Pretendard가 없으면 Noto Sans KR로 대체된다.</p>
  {typo_rows}
</div></section>

<section id="color"><div class="wrap">
  <h2>Semantic colors</h2>
  <p class="h2-note">각 칩의 왼쪽이 라이트, 오른쪽이 다크 값이다. 모든 토큰에 <code>-rgb</code> 짝이 있어 <code>rgba(var(--semantic-primary-normal-rgb), .2)</code>처럼 알파를 줄 수 있다. 컴포넌트 CSS에서 <code>--atomic-*</code>는 직접 쓰지 않는다.</p>
  {color_html}
</div></section>

<section id="elevation"><div class="wrap">
  <h2>Elevation</h2>
  <p class="h2-note"><code>normal</code>은 box-shadow, <code>drop</code>은 filter용 drop-shadow 체인, <code>spread</code>는 넓게 퍼지는 강조 그림자.</p>
  {elev_html}
</div></section>

<section id="grid"><div class="wrap">
  <h2>Grid &amp; layout</h2>
  <p class="h2-note">8px 기반, 권장 간격 4px 배수, 시각 보정 2px. Gutter 20px. 컬럼 모바일 2 · 태블릿 3 · 데스크탑 12. 컨테이너 <code>--layout-max-width: 1060px</code>, <code>--layout-padding-inline: 40px</code>, GNB <code>--gnb-height: 62px</code>.</p>
  <h3 class="sub">Breakpoints</h3><div class="tbl">{table(grid["breakpoints"])}</div>
  <h3 class="sub">Artboards</h3><div class="tbl">{table(grid["artboards"])}</div>
</div></section>

<section id="components"><div class="wrap">
  <h2>Components</h2>
  <p class="h2-note">{len(comps)}개, {len(cats)} 카테고리. 각 항목은 Montage 원본 문서로 연결된다. 오른쪽은 제공 플랫폼.</p>
  <div class="comp-grid">{comp_html}</div>
</div></section>

<section id="icons"><div class="wrap">
  <h2>Icons</h2>
  <p class="h2-note">24×24, <code>currentColor</code>. 부모의 <code>color</code>로 색을 준다. 이름으로 검색할 수 있다.</p>
  <input class="ic-search" id="ic-search" type="search" placeholder="아이콘 이름 검색 (예: Search, Chevron)" aria-label="아이콘 검색">
  <div class="ic-grid" id="ic-grid">
{icon_html}
  </div>
</div></section>

<section id="sources"><div class="wrap">
  <h2>Sources</h2>
  <p class="h2-note">아래 세 블록이 원본이다. 에이전트는 이 내용을 그대로 파일로 저장한다.</p>
  <details open><summary>DESIGN.md <code>#design-md</code></summary><pre id="design-md">{html.escape(design_md)}</pre></details>
  <details><summary>wds-tokens.css <code>#tokens-css</code> (light + dark, {len(tokens_css)//1024} KB)</summary><pre id="tokens-css">{html.escape(tokens_css)}</pre></details>
  <details open><summary>CLAUDE.md block <code>#claude-md-block</code></summary><pre id="claude-md-block">{html.escape(claude_block)}</pre></details>
</div></section>

<footer><div class="wrap">
  <p>Montage는 원티드가 MIT 라이선스로 공개한 디자인 시스템이다. 토큰·아이콘·컴포넌트 규칙은 저작권 표시와 함께 재사용할 수 있다.</p>
  <p>원티드 로고·워드마크·스크린샷·일러스트는 별도 브랜드 가이드라인을 따르며 이 키트에 포함하지 않았다. 원티드로 오인되도록 사용하지 않는다.</p>
  <p>Captured {meta["collectedAt"][:10]} from {meta["pageCount"]} public pages.</p>
</div></footer>

<script>
(function () {{
  var root = document.documentElement;
  var btn = document.getElementById('theme');
  function current() {{
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }}
  function label() {{ btn.textContent = current() === 'dark' ? '라이트로' : '다크로'; }}
  btn.addEventListener('click', function () {{
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {{ localStorage.setItem('montage-kit-theme', next); }} catch (e) {{}}
    label();
  }});
  try {{ var saved = localStorage.getItem('montage-kit-theme'); if (saved) root.setAttribute('data-theme', saved); }} catch (e) {{}}
  label();

  var q = document.getElementById('ic-search');
  var figs = Array.prototype.slice.call(document.querySelectorAll('#ic-grid .ic'));
  q.addEventListener('input', function () {{
    var s = q.value.trim().toLowerCase();
    figs.forEach(function (f) {{ f.hidden = s && f.dataset.name.toLowerCase().indexOf(s) === -1; }});
  }});
}})();
</script>
'''
open(OUT, "w").write(page)
print(OUT, len(page) // 1024, "KB")
