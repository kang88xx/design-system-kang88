// Parse downloaded stripe.com CSS and extract custom properties, @font-face, keyframes, media queries, and hds-* component rules.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const CSSDIR = path.join(ROOT, 'assets/stripe/css');
const OUT = path.join(ROOT, 'data/raw');
await mkdir(OUT, { recursive: true });
const SOURCE = process.env.CSS_SOURCE || 'hds'; // hds => mkt-ssr-statics bundle; legacy => everything else
const allFiles = (await readdir(CSSDIR)).filter(f => f.endsWith('.css'));
const pick = { hds: f => f.includes('mkt_ssr_statics'), legacy: f => f.includes('mkt_statics_srv'), sail: f => f.includes('docs_statics_srv'), other: f => !/mkt_ssr_statics|mkt_statics_srv|docs_statics_srv/.test(f) }[SOURCE];
const files = allFiles.filter(pick);
const suffix = SOURCE === 'hds' ? '' : `-${SOURCE}`;
let css = '';
const perFile = [];
for (const f of files) { const t = await readFile(path.join(CSSDIR, f), 'utf8'); perFile.push({ file: f, bytes: t.length }); css += "\n" + t.replace(/\/\*[\s\S]*?\*\//g, ""); }

// Split into top-level blocks (handles nested @media by simple brace counting)
function splitRules(text) {
  const rules = []; let depth = 0, start = 0, selStart = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') { if (depth === 0) { selStart = start; } depth++; }
    else if (ch === '}') { depth--; if (depth === 0) { rules.push(text.slice(selStart, i + 1)); start = i + 1; } }
  }
  return rules;
}
const blocks = splitRules(css);

// 1) Custom properties with the selector context (root/media/theme)
const vars = {}; // name -> [{value, selector, context}]
const varRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;{}]+)/g;
function walk(block, context) {
  const m = block.match(/^\s*([^{]+)\{([\s\S]*)\}\s*$/); if (!m) return;
  const sel = m[1].trim(); const body = m[2];
  if (sel.startsWith('@media') || sel.startsWith('@supports') || sel.startsWith('@container') || sel.startsWith('@layer')) { for (const inner of splitRules(body)) walk(inner, [...context, sel]); return; }
  if (sel.startsWith('@')) return;
  let mm; varRe.lastIndex = 0;
  while ((mm = varRe.exec(body))) {
    const name = mm[1], value = mm[2].trim();
    (vars[name] ??= []).push({ value, selector: sel.slice(0, 200), context: context.join(' ') });
  }
}
for (const b of blocks) walk(b, []);
// Dedup entries
for (const k of Object.keys(vars)) { const seen = new Set(); vars[k] = vars[k].filter(e => { const key = e.value + '|' + e.selector + '|' + e.context; if (seen.has(key)) return false; seen.add(key); return true; }); }

// 2) @font-face
const fontFaces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => Object.fromEntries(m[1].split(';').filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; })));
const ffSeen = new Set(); const fontFacesU = fontFaces.filter(f => { const k = JSON.stringify(f); if (ffSeen.has(k)) return false; ffSeen.add(k); return true; });

// 3) keyframes
const keyframes = {}; for (const m of css.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g)) { const start = m.index + m[0].length - 1; let depth = 0, i = start; for (; i < css.length; i++) { if (css[i] === '{') depth++; else if (css[i] === '}') { depth--; if (!depth) break; } } keyframes[m[1]] = css.slice(start + 1, i).trim().slice(0, 2000); }

// 4) media queries
const media = {}; for (const m of css.matchAll(/@media\s*([^{]+)\{/g)) { const q = m[1].trim(); media[q] = (media[q] || 0) + 1; }

// 5) hds-* class rules: selector -> declarations
const hdsRules = []; const compRe = SOURCE === 'hds' ? /\.hds-[a-zA-Z0-9_-]+/ : /\.(Button|Link|Copy|Section|Card|Grid|Container|List|Tag|Badge|Input|Field|Select|Tabs|Nav|SiteHeader|SiteFooter|Footer|Header|Hero|Modal|Tooltip|Accordion|Table|Pill|Icon|Cta|Cards?)[A-Za-z0-9_-]*/;
function collectRules(block, context) {
  const m = block.match(/^\s*([^{]+)\{([\s\S]*)\}\s*$/); if (!m) return;
  const sel = m[1].trim(); const body = m[2];
  if (sel.startsWith('@media') || sel.startsWith('@supports') || sel.startsWith('@container') || sel.startsWith('@layer')) { for (const inner of splitRules(body)) collectRules(inner, [...context, sel]); return; }
  if (sel.startsWith('@')) return;
  if (compRe.test(sel) && !body.includes('{')) hdsRules.push({ selector: sel, context: context.join(' '), declarations: body.trim() });
}
for (const b of blocks) collectRules(b, []);

// 6) Group tokens by category
const groups = {};
for (const name of Object.keys(vars).sort()) {
  const cat = name.startsWith('--hds-') ? name.split('-')[3] : (name.startsWith('--') ? 'other' : 'other');
  (groups[cat] ??= []).push(name);
}
const summary = { source: SOURCE, files: perFile.length, fileList: perFile.slice(0, 400), totalBytes: css.length, customProperties: Object.keys(vars).length, hdsProperties: Object.keys(vars).filter(k => k.startsWith('--hds-')).length, groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])), fontFaces: fontFacesU.length, keyframes: Object.keys(keyframes).length, mediaQueries: Object.keys(media).length, hdsRules: hdsRules.length };
await writeFile(path.join(OUT, `css-custom-properties${suffix}.json`), JSON.stringify(vars, null, 1));
await writeFile(path.join(OUT, `css-font-faces${suffix}.json`), JSON.stringify(fontFacesU, null, 2));
await writeFile(path.join(OUT, `css-keyframes${suffix}.json`), JSON.stringify(keyframes, null, 1));
await writeFile(path.join(OUT, `css-media-queries${suffix}.json`), JSON.stringify(Object.entries(media).sort((a,b)=>b[1]-a[1]), null, 1));
await writeFile(path.join(OUT, `css-hds-rules${suffix}.json`), JSON.stringify(hdsRules, null, 1));
await writeFile(path.join(OUT, `css-summary${suffix}.json`), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
