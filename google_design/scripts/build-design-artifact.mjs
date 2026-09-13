#!/usr/bin/env node
// Builds a single self-contained HTML page that packages DESIGN.md, tokens.css,
// tokens.json, components.json and interactions.json so that another Claude
// session can read the design system from one artifact link and apply it.
//
// Usage: node scripts/build-design-artifact.mjs [outputPath]
// Default output: dist/google-design-artifact.html (gitignored)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), 'utf8');

const designMd = read('DESIGN.md');
const tokensCss = read('data/curated/tokens.css').trim();
const tokens = JSON.parse(read('data/curated/tokens.json'));
const components = JSON.parse(read('data/curated/components.json'));
const interactions = JSON.parse(read('data/curated/interactions.json'));

let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
} catch {}
const builtAt = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// --- minimal markdown renderer (headings, lists, tables, paragraphs, inline bold/code) ---
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1">$1</a>');

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').trim().replace(/\s+/g, '-');

function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  const toc = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+\s*/, '');
      if (level === 1) { i++; continue; } // page has its own title
      const id = 'design-' + slug(text);
      if (level === 2) toc.push({ id, text });
      out.push(`<h${level + 1} id="${id}">${inline(text)}</h${level + 1}>`);
      i++;
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      const body = rows.slice(2).map(cells);
      out.push('<div class="table-wrap"><table><thead><tr>' +
        head.map((h) => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>' +
        body.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
        '</tbody></table></div>');
      continue;
    }
    if (/^-\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^-\s/.test(lines[i])) { items.push(lines[i].replace(/^-\s*/, '')); i++; }
      out.push('<ul>' + items.map((t) => `<li>${inline(t)}</li>`).join('') + '</ul>');
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^(#|\||-\s)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return { html: out.join('\n'), toc };
}

const design = renderMarkdown(designMd);

// --- swatches from tokens ---
const swatchRoles = [
  ['primary', 'onPrimary'], ['primaryContainer', 'onPrimaryContainer'],
  ['secondaryContainer', 'onSecondaryContainer'], ['tertiary', 'onTertiary'],
  ['tertiaryContainer', 'onTertiaryContainer'], ['surface', 'onSurface'],
  ['surfaceDim', 'onSurface'], ['surfaceContainerLow', 'onSurface'],
  ['surfaceContainer', 'onSurface'], ['error', 'onError'],
  ['positive', 'onTertiary'], ['negative', 'onError'],
];
const swatches = (mode) => swatchRoles.map(([bg, fg]) => {
  const c = tokens.color[mode];
  return `<div class="swatch" style="background:${c[bg]};color:${c[fg]}"><span class="swatch-name">${bg}</span><span class="swatch-hex">${c[bg]}</span></div>`;
}).join('');

const typeRows = Object.entries(tokens.typography.scale).map(([name, t]) =>
  `<tr><td>${name}</td><td class="num">${t.size}</td><td class="num">${t.lineHeight}</td><td class="num">${t.weight}</td><td class="num">${t.tracking}</td></tr>`).join('');

const componentRows = components.map((c) =>
  `<tr><td>${esc(c.category)}</td><td><strong>${esc(c.title)}</strong><br><span class="muted">${esc(c.family)} / ${esc(c.variant)}</span></td><td>${c.anatomy.map(esc).join(', ')}</td><td>${c.states.map((s) => `<span class="chip">${esc(s)}</span>`).join(' ')}</td><td class="muted">${c.services.map(esc).join(', ')}</td></tr>`).join('');

const interactionRows = interactions.map((x) =>
  `<tr><td><strong>${esc(x.id)}</strong></td><td>${esc(x.trigger)}</td><td class="num">${esc(x.duration)}</td><td>${esc(x.result)}</td><td class="muted">${esc(x.evidence)}</td></tr>`).join('');

const machine = JSON.stringify({ commit, builtAt, tokens, components, interactions });

const html = `<title>Google Design Contract</title>
<meta name="description" content="Google 제품 관찰 기반 디자인 시스템 계약서: DESIGN.md, 토큰, 컴포넌트, 인터랙션">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Roboto+Mono:wght@400;500&display=swap">
<style>
:root {
  --gds-color-primary: #0b57d0; --gds-color-on-primary: #ffffff;
  --gds-color-primary-container: #d3e3fd; --gds-color-on-primary-container: #041e49;
  --gds-color-secondary-container: #c2e7ff; --gds-color-on-secondary-container: #001d35;
  --gds-color-tertiary: #0b8043; --gds-color-tertiary-container: #c4eed0; --gds-color-on-tertiary-container: #072711;
  --gds-color-surface: #ffffff; --gds-color-surface-dim: #f8fafd;
  --gds-color-surface-container-low: #f2f6fc; --gds-color-surface-container: #e9eef6; --gds-color-surface-container-high: #e1e3e1;
  --gds-color-on-surface: #1f1f1f; --gds-color-on-surface-variant: #444746;
  --gds-color-outline: #747775; --gds-color-outline-variant: #c4c7c5;
  --gds-color-error: #b3261e; --gds-color-error-container: #f9dedc; --gds-color-on-error-container: #410e0b;
  --gds-elevation-level1: 0 1px 2px rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15);
  --gds-duration-standard: 200ms; --gds-easing-standard: cubic-bezier(.2,0,0,1);
  --font-ui: 'Google Sans Text', 'Google Sans', Roboto, Arial, sans-serif;
  --font-brand: 'Google Sans', 'Google Sans Text', Roboto, Arial, sans-serif;
  --font-mono: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --gds-color-primary: #a8c7fa; --gds-color-on-primary: #062e6f;
    --gds-color-primary-container: #0842a0; --gds-color-on-primary-container: #d3e3fd;
    --gds-color-secondary-container: #004a6f; --gds-color-on-secondary-container: #c2e7ff;
    --gds-color-tertiary: #a8dab5; --gds-color-tertiary-container: #146c2e; --gds-color-on-tertiary-container: #c4eed0;
    --gds-color-surface: #1f1f1f; --gds-color-surface-dim: #131314;
    --gds-color-surface-container-low: #1e1f20; --gds-color-surface-container: #282a2c; --gds-color-surface-container-high: #303134;
    --gds-color-on-surface: #e3e3e3; --gds-color-on-surface-variant: #c4c7c5;
    --gds-color-outline: #8e918f; --gds-color-outline-variant: #444746;
    --gds-color-error: #f2b8b5; --gds-color-error-container: #8c1d18; --gds-color-on-error-container: #f9dedc;
    --gds-elevation-level1: 0 1px 2px rgba(0,0,0,.5), 0 1px 3px 1px rgba(0,0,0,.3);
  }
}
:root[data-theme="dark"] {
  --gds-color-primary: #a8c7fa; --gds-color-on-primary: #062e6f;
  --gds-color-primary-container: #0842a0; --gds-color-on-primary-container: #d3e3fd;
  --gds-color-secondary-container: #004a6f; --gds-color-on-secondary-container: #c2e7ff;
  --gds-color-tertiary: #a8dab5; --gds-color-tertiary-container: #146c2e; --gds-color-on-tertiary-container: #c4eed0;
  --gds-color-surface: #1f1f1f; --gds-color-surface-dim: #131314;
  --gds-color-surface-container-low: #1e1f20; --gds-color-surface-container: #282a2c; --gds-color-surface-container-high: #303134;
  --gds-color-on-surface: #e3e3e3; --gds-color-on-surface-variant: #c4c7c5;
  --gds-color-outline: #8e918f; --gds-color-outline-variant: #444746;
  --gds-color-error: #f2b8b5; --gds-color-error-container: #8c1d18; --gds-color-on-error-container: #f9dedc;
  --gds-elevation-level1: 0 1px 2px rgba(0,0,0,.5), 0 1px 3px 1px rgba(0,0,0,.3);
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } * { transition: none !important; } }
body { margin: 0; background: var(--gds-color-surface-dim); color: var(--gds-color-on-surface); font-family: var(--font-ui); font-size: 14px; line-height: 20px; }
a { color: var(--gds-color-primary); }
code { font-family: var(--font-mono); font-size: 12.5px; background: var(--gds-color-surface-container); padding: 1px 5px; border-radius: 4px; }
pre { margin: 0; font-family: var(--font-mono); font-size: 12px; line-height: 18px; white-space: pre; }
pre code { background: none; padding: 0; font-size: inherit; }

.appbar { position: sticky; top: 0; z-index: 5; height: 64px; display: flex; align-items: center; gap: 16px; padding: 0 24px; background: var(--gds-color-surface-dim); }
.appbar .mark { width: 32px; height: 32px; border-radius: 8px; background: var(--gds-color-primary); color: var(--gds-color-on-primary); display: grid; place-items: center; font-family: var(--font-brand); font-weight: 500; font-size: 15px; letter-spacing: .02em; }
.appbar h1 { margin: 0; font-family: var(--font-brand); font-size: 22px; line-height: 28px; font-weight: 400; }
.appbar .meta { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
.chip { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 9999px; border: 1px solid var(--gds-color-outline-variant); font-size: 12px; line-height: 16px; font-weight: 500; letter-spacing: .3px; color: var(--gds-color-on-surface-variant); white-space: nowrap; }
.chip.tonal { border-color: transparent; background: var(--gds-color-secondary-container); color: var(--gds-color-on-secondary-container); }

.shell { display: grid; grid-template-columns: 256px minmax(0, 1fr); gap: 0 16px; padding: 0 24px 40px 8px; max-width: 1440px; margin: 0 auto; }
.drawer { position: sticky; top: 72px; align-self: start; padding: 8px 8px 8px 16px; }
.drawer .label { font-size: 11px; line-height: 16px; font-weight: 500; letter-spacing: .5px; text-transform: uppercase; color: var(--gds-color-on-surface-variant); padding: 8px 16px; }
.drawer a { display: flex; align-items: center; height: 32px; padding: 0 16px; border-radius: 9999px; color: var(--gds-color-on-surface); text-decoration: none; font-weight: 500; font-size: 14px; transition: background var(--gds-duration-standard) var(--gds-easing-standard); }
.drawer a:hover { background: var(--gds-color-surface-container); }
.drawer a:focus-visible { outline: 3px solid var(--gds-color-primary); outline-offset: 2px; }
.drawer a.sub { font-weight: 400; color: var(--gds-color-on-surface-variant); padding-left: 32px; height: 28px; font-size: 13px; }
.drawer a[aria-current="true"] { background: var(--gds-color-primary-container); color: var(--gds-color-on-primary-container); }

.main { background: var(--gds-color-surface); border-radius: 16px; padding: 32px 40px 48px; min-width: 0; }
.main > section + section { margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--gds-color-outline-variant); }
.eyebrow { font-size: 11px; line-height: 16px; font-weight: 500; letter-spacing: .5px; text-transform: uppercase; color: var(--gds-color-primary); margin: 0 0 4px; }
h2 { font-family: var(--font-brand); font-size: 28px; line-height: 36px; font-weight: 400; margin: 0 0 12px; text-wrap: balance; }
h3 { font-family: var(--font-brand); font-size: 20px; line-height: 28px; font-weight: 400; margin: 32px 0 8px; }
h4 { font-size: 16px; line-height: 24px; font-weight: 500; margin: 20px 0 6px; }
p, li { max-width: 72ch; }
p { margin: 0 0 12px; }
ul { margin: 0 0 12px; padding-left: 22px; }
li { margin: 2px 0; }
.lead { font-size: 16px; line-height: 24px; color: var(--gds-color-on-surface-variant); max-width: 68ch; }
.muted { color: var(--gds-color-on-surface-variant); }
.num { font-variant-numeric: tabular-nums; font-family: var(--font-mono); font-size: 12.5px; }

.table-wrap { overflow-x: auto; margin: 8px 0 16px; border: 1px solid var(--gds-color-outline-variant); border-radius: 12px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; line-height: 18px; }
th, td { text-align: left; vertical-align: top; padding: 10px 14px; border-bottom: 1px solid var(--gds-color-outline-variant); }
th { font-size: 12px; font-weight: 500; letter-spacing: .3px; color: var(--gds-color-on-surface-variant); background: var(--gds-color-surface-container-low); white-space: nowrap; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover td { background: var(--gds-color-surface-container-low); }
td code { white-space: nowrap; }

.steps { counter-reset: step; list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 10px; }
.steps li { counter-increment: step; display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: start; max-width: none; }
.steps li::before { content: counter(step); width: 32px; height: 32px; border-radius: 9999px; background: var(--gds-color-primary-container); color: var(--gds-color-on-primary-container); display: grid; place-items: center; font-weight: 500; font-size: 14px; }
.steps li > div { padding-top: 6px; }
.steps strong { display: block; font-weight: 500; }

.banner { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; background: var(--gds-color-tertiary-container); color: var(--gds-color-on-tertiary-container); border-radius: 12px; padding: 14px 16px; margin: 20px 0 0; }
.banner .icon { width: 24px; height: 24px; border-radius: 9999px; background: var(--gds-color-tertiary); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 13px; margin-top: 1px; }
.banner p { margin: 0; color: inherit; max-width: none; }
.banner.warn { background: var(--gds-color-error-container); color: var(--gds-color-on-error-container); }
.banner.warn .icon { background: var(--gds-color-error); }

.codeblock { position: relative; border: 1px solid var(--gds-color-outline-variant); border-radius: 12px; background: var(--gds-color-surface-container-low); overflow: hidden; margin: 8px 0 16px; }
.codeblock header { display: flex; align-items: center; gap: 8px; padding: 8px 12px 8px 16px; border-bottom: 1px solid var(--gds-color-outline-variant); font-size: 12px; font-weight: 500; color: var(--gds-color-on-surface-variant); font-family: var(--font-mono); }
.codeblock header .path { margin-right: auto; }
.codeblock .body { overflow: auto; max-height: 520px; padding: 14px 16px; }
.btn { font: inherit; font-weight: 500; font-size: 13px; height: 32px; padding: 0 14px; border-radius: 9999px; border: 1px solid var(--gds-color-outline-variant); background: transparent; color: var(--gds-color-primary); cursor: pointer; transition: background var(--gds-duration-standard) var(--gds-easing-standard); }
.btn:hover { background: var(--gds-color-surface-container); }
.btn:focus-visible { outline: 3px solid var(--gds-color-primary); outline-offset: 2px; }
.btn.tonal { border-color: transparent; background: var(--gds-color-primary-container); color: var(--gds-color-on-primary-container); }

.palette-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin: 8px 0 16px; }
.swatch { height: 72px; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--gds-color-outline-variant); }
.swatch-name { font-size: 12px; font-weight: 500; }
.swatch-hex { font-family: var(--font-mono); font-size: 12px; }
.mode-label { font-size: 12px; font-weight: 500; letter-spacing: .3px; color: var(--gds-color-on-surface-variant); margin: 16px 0 4px; }

.prompt { background: var(--gds-color-surface-container-low); border-radius: 12px; padding: 14px 16px; font-family: var(--font-mono); font-size: 13px; line-height: 20px; margin: 8px 0 16px; word-break: break-all; }

@media (max-width: 840px) {
  .shell { grid-template-columns: 1fr; padding: 0 12px 32px; }
  .drawer { position: static; padding: 8px 0 16px; display: flex; flex-wrap: wrap; gap: 4px; }
  .drawer .label, .drawer a.sub { display: none; }
  .drawer a { height: 32px; border: 1px solid var(--gds-color-outline-variant); }
  .main { padding: 24px 20px 32px; border-radius: 12px; }
  .appbar { padding: 0 16px; }
  .appbar .meta { display: none; }
}
</style>

<header class="appbar">
  <div class="mark" aria-hidden="true">G</div>
  <h1>Google Design Contract</h1>
  <div class="meta">
    <span class="chip tonal">commit ${esc(commit)}</span>
    <span class="chip">built ${esc(builtAt)}</span>
    <span class="chip">source kang88xx/google-design</span>
  </div>
</header>

<div class="shell">
  <nav class="drawer" aria-label="섹션">
    <div class="label">Contract</div>
    <a href="#apply" aria-current="true">에이전트 적용 지침</a>
    <a href="#design">DESIGN.md</a>
    ${design.toc.map((t) => `<a class="sub" href="#${t.id}">${esc(t.text)}</a>`).join('\n    ')}
    <div class="label">Data</div>
    <a href="#tokens">tokens.css</a>
    <a href="#palette">Color roles</a>
    <a href="#type">Type scale</a>
    <a href="#components">Components</a>
    <a href="#interactions">Interactions</a>
    <a href="#json">Machine-readable JSON</a>
  </nav>

  <main class="main">
    <section id="apply">
      <p class="eyebrow">For Claude sessions</p>
      <h2>이 디자인 시스템을 프로젝트에 적용하는 방법</h2>
      <p class="lead">이 페이지는 Gmail · Calendar · Drive · Meet · Finance 관찰에서 추출한 디자인 시스템 계약서입니다. 다른 세션에서 이 링크를 읽은 에이전트는 아래 순서대로 적용합니다. 모든 값은 이 페이지 안에 있으며 외부 파일이 필요 없습니다.</p>
      <ol class="steps">
        <li><div><strong>DESIGN.md를 프로젝트 루트에 만든다.</strong>아래 <a href="#design">DESIGN.md</a> 섹션의 내용을 그대로 옮긴다. 이미 있으면 덮어쓰지 말고 차이를 보여준 뒤 사용자에게 묻는다.</div></li>
        <li><div><strong>tokens.css를 <code>gds-tokens.css</code>로 저장한다.</strong>스타일 디렉터리 탐색 순서는 <code>src/styles/</code>, <code>src/app/</code>, <code>styles/</code>, <code>app/</code>, <code>public/</code>, 없으면 <code>design/</code>. 내용은 <a href="#tokens">tokens.css</a> 섹션에 있다.</div></li>
        <li><div><strong>전역 CSS 상단에서 import한다.</strong><code>globals.css</code>, <code>index.css</code>, <code>app.css</code> 등에 <code>@import "./gds-tokens.css";</code>를 추가한다. 다크 모드는 <code>&lt;html data-theme="dark"&gt;</code>로 전환된다.</div></li>
        <li><div><strong>CLAUDE.md(없으면 AGENTS.md)에 Design System 규칙 블록을 추가한다.</strong>아래 블록을 그대로 넣는다. 이미 같은 블록이 있으면 건너뛴다.</div></li>
        <li><div><strong>UI 코드는 <code>--gds-*</code> 변수만 사용한다.</strong>색·간격·radius·모션 값을 하드코딩하지 않는다. 폰트는 Google Sans → Google Sans Text → Roboto → Arial, 아이콘은 Material Symbols Rounded 24px.</div></li>
        <li><div><strong>적용 결과를 보고한다.</strong>생성·수정한 파일 목록과 이 페이지의 commit 해시(<code>${esc(commit)}</code>)를 함께 알린다.</div></li>
      </ol>

      <h4>CLAUDE.md에 넣을 블록</h4>
      <div class="codeblock">
        <header><span class="path">CLAUDE.md › ## Design System</header>
        <div class="body"><pre><code>## Design System

Always read \`DESIGN.md\` before making visual or UI decisions.
Use \`--gds-*\` CSS custom properties from \`gds-tokens.css\`; do not hard-code colors, spacing, radii, or motion values.
Do not deviate from DESIGN.md without explicit user approval. In QA mode, flag code that does not match it.
Source of truth: https://github.com/kang88xx/google-design (private) — this contract was published from commit ${esc(commit)}.</code></pre></div>
      </div>

      <div class="banner warn">
        <div class="icon" aria-hidden="true">!</div>
        <p><strong>자산 경계.</strong> Google 제품 로고·아이콘·스크린샷·일러스트·브랜드 워드마크는 재사용하지 않는다. 배포 가능한 것은 Material Symbols(Apache-2.0)와 Roboto(OFL-1.1)뿐이다. Google Sans는 공식 Google Fonts bundle과 라이선스가 함께 있을 때만 쓴다.</p>
      </div>
    </section>

    <section id="design">
      <p class="eyebrow">Source of truth</p>
      <h2>DESIGN.md</h2>
      <p class="lead">저장소 루트의 DESIGN.md 전문입니다. 프로젝트에는 이 내용을 그대로 복사합니다.</p>
      ${design.html}
    </section>

    <section id="tokens">
      <p class="eyebrow">Implementation contract</p>
      <h2>tokens.css</h2>
      <p class="lead">라이트 값은 <code>:root</code>, 다크 값은 <code>[data-theme="dark"]</code>에 들어 있습니다. 파일명 <code>gds-tokens.css</code>로 저장합니다. 간격 변수(<code>--gds-space-*</code>)는 단위 없는 px 배수입니다.</p>
      <div class="codeblock">
        <header><span class="path">data/curated/tokens.css</span><button class="btn tonal" type="button" data-copy="tokens-css">복사</button></header>
        <div class="body"><pre><code id="tokens-css">${esc(tokensCss)}</code></pre></div>
      </div>
    </section>

    <section id="palette">
      <p class="eyebrow">Color</p>
      <h2>Color roles</h2>
      <p class="lead">역할 기반 팔레트입니다. 각 칩의 글자색은 짝이 되는 on-role 값입니다.</p>
      <div class="mode-label">Light</div>
      <div class="palette-grid">${swatches('light')}</div>
      <div class="mode-label">Dark</div>
      <div class="palette-grid">${swatches('dark')}</div>
    </section>

    <section id="type">
      <p class="eyebrow">Typography</p>
      <h2>Type scale</h2>
      <p class="lead">Brand: <code>${esc(tokens.typography.family.brand)}</code><br>Body: <code>${esc(tokens.typography.family.body)}</code></p>
      <div class="table-wrap"><table>
        <thead><tr><th>Role</th><th>Size</th><th>Line height</th><th>Weight</th><th>Tracking</th></tr></thead>
        <tbody>${typeRows}</tbody>
      </table></div>
    </section>

    <section id="components">
      <p class="eyebrow">Components</p>
      <h2>Component contracts</h2>
      <p class="lead">시각 복제보다 anatomy와 state 계약을 우선합니다. 같은 anatomy는 family/variant로 묶고 중복 컴포넌트를 만들지 않습니다.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Category</th><th>Component</th><th>Anatomy</th><th>States</th><th>Observed in</th></tr></thead>
        <tbody>${componentRows}</tbody>
      </table></div>
      <h4>Behavior rules</h4>
      <ul>
        <li>선택된 navigation은 tonal container와 더 진한 icon/label 색을 쓴다.</li>
        <li>Dense row는 hover 시 primary text를 움직이지 않고 contextual action을 드러낸다.</li>
        <li>검색 컨트롤은 눈에 띄되 페이지의 primary action보다 강하지 않다.</li>
        <li>Icon button은 항상 접근 가능한 label 또는 tooltip과 40–48px hit area를 가진다.</li>
        <li>Finance positive/negative 카드는 색과 함께 부호·화살표 방향을 짝지어 쓴다.</li>
        <li>Dialog는 focus를 안으로 옮기고 가두며, 닫힐 때 원래 위치로 되돌린다.</li>
      </ul>
    </section>

    <section id="interactions">
      <p class="eyebrow">Motion</p>
      <h2>Interaction contracts</h2>
      <p class="lead">모든 인터랙티브 컴포넌트는 default, hover, pressed, focus, disabled를 정의하고 필요 시 selected, expanded, checked, drag를 더합니다. 기본 easing은 <code>cubic-bezier(.2,0,0,1)</code>이며 <code>prefers-reduced-motion</code>을 존중합니다.</p>
      <div class="table-wrap"><table>
        <thead><tr><th>Contract</th><th>Trigger</th><th>Duration</th><th>Result</th><th>Evidence</th></tr></thead>
        <tbody>${interactionRows}</tbody>
      </table></div>
      <h4>Accessibility</h4>
      <ul>
        <li>레이아웃이 허용하면 최소 48px 타깃</li>
        <li>컴포넌트 바깥 2–3px 가시 focus ring</li>
        <li>색만으로 의미를 전달하지 않는다</li>
        <li>hover 전용 action도 키보드로 도달 가능해야 한다</li>
      </ul>
    </section>

    <section id="json">
      <p class="eyebrow">Machine-readable</p>
      <h2>tokens.json + components.json + interactions.json</h2>
      <p class="lead">프로그램으로 읽어야 할 때 쓰는 원본 데이터입니다. 스크립트 태그 <code>#gds-data</code>에도 같은 JSON이 들어 있습니다.</p>
      <div class="codeblock">
        <header><span class="path">gds-data.json</span><button class="btn tonal" type="button" data-copy="gds-json">복사</button></header>
        <div class="body"><pre><code id="gds-json">${esc(JSON.stringify({ commit, builtAt, tokens, components, interactions }, null, 2))}</code></pre></div>
      </div>
    </section>
  </main>
</div>

<script type="application/json" id="gds-data">${machine.replace(/</g, '\\u003c')}</script>
<script>
(function () {
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-copy'));
      if (!el || !navigator.clipboard) return;
      navigator.clipboard.writeText(el.textContent).then(function () {
        var t = btn.textContent; btn.textContent = '복사됨';
        setTimeout(function () { btn.textContent = t; }, 1500);
      });
    });
  });
  var links = Array.prototype.slice.call(document.querySelectorAll('.drawer a:not(.sub)'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) current = e.target.id; });
      if (!current) return;
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + current) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-72px 0px -70% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }
})();
</script>
`;

const outPath = resolve(root, process.argv[2] || 'dist/google-design-artifact.html');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html);
console.log(`wrote ${outPath} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB, commit ${commit})`);
