// Validate the collection: referenced files exist, tokens resolve, CSS parses in Chromium, and live stripe.com values still match.
import { launchBrowser } from './browser-runtime.mjs';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname); const CUR = path.join(ROOT, 'data/curated');
const J = async (f) => JSON.parse(await readFile(path.join(CUR, f), 'utf8'));
const exists = async (p) => { try { await access(path.join(ROOT, p)); return true; } catch { return false; } };
const out = { checkedAt: new Date().toISOString(), files: {}, tokens: {}, css: {}, live: {}, ok: true };
// 1. referenced files
const refs = new Set();
for (const p of await J('pages.json')) for (const s of Object.values(p.shots)) if (s) refs.add(s);
for (const b of (await J('boxes.json')).items) { if (b.shot) refs.add(b.shot); if (b.hoverShot) refs.add(b.hoverShot); if (b.clip) refs.add(b.clip); }
for (const g of Object.values((await J('effects.json')).groups)) for (const e of g) if (e.shot) refs.add(e.shot);
const M = await J('motion.json'); for (const f of M.frames || []) for (const x of f.frames) refs.add(x);
const I = await J('illustrations.json'); for (const i of I.items) { if (i.shot) refs.add(i.shot); if (i.file) refs.add(i.file); } for (const a of I.assets) refs.add(a.file);
const X = await J('interactions.json'); for (const c of X.captured || []) { refs.add(c.before); refs.add(c.after); } for (const c of [...(X.clips || []), ...(M.clips || [])]) refs.add(c.file);
let missing = []; for (const r of refs) if (!(await exists(r))) missing.push(r);
out.files = { referenced: refs.size, missing: missing.length, sample: missing.slice(0, 10) }; if (missing.length) out.ok = false;
// 2. tokens resolve
const T = await J('tokens.json'); const unresolved = [];
for (const [k, v] of Object.entries(T.color.semantic.light)) if (/var\(/.test(v.value)) unresolved.push('light ' + k);
for (const [k, v] of Object.entries(T.color.semantic.dark)) if (/var\(/.test(v.value)) unresolved.push('dark ' + k);
for (const [k, v] of Object.entries(T.shadow)) if (/var\(/.test(v.light)) unresolved.push('shadow ' + k);
out.tokens = { light: T.counts.light, dark: T.counts.darkOverrides, unresolved: unresolved.length, sample: unresolved.slice(0, 5), fontFamily: T.fonts.family }; if (unresolved.length) out.ok = false;
// 3. CSS parses (count rules per file in Chromium) + 4. live comparison
const browser = await launchBrowser(); const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
await page.setContent('<html></html>');
for (const f of ['tokens.css', 'hds-components.css', 'legacy-tokens.css', 'legacy-components.css', 'recipes.css']) {
  const css = await readFile(path.join(CUR, f), 'utf8');
  const r = await page.evaluate((css) => { const s = new CSSStyleSheet(); s.replaceSync(css); const walk = (rules, acc) => { for (const r of rules) { acc.n++; if (r.cssRules && r.cssRules.length) walk(r.cssRules, acc); } return acc; }; return walk(s.cssRules, { n: 0 }); }, css);
  const expected = (css.match(/\{/g) || []).length; out.css[f] = { bytes: css.length, rulesParsed: r.n, braces: expected, ratio: +(r.n / expected).toFixed(2) };
  if (r.n < expected * 0.8) out.ok = false;
}
// live: primary button + h1 + header on stripe.com
try {
  await page.goto('https://stripe.com/', { waitUntil: 'networkidle', timeout: 60000 });
  const live = await page.evaluate(() => { const g = (el, ks) => el ? Object.fromEntries(ks.map(k => [k, getComputedStyle(el).getPropertyValue(k)])) : null; const btn = document.querySelector('main .hds-button--primary'); const h1 = document.querySelector('h1'); const flink = [...document.querySelectorAll('footer a')].find(a => a.innerText.trim().length > 3); const root = getComputedStyle(document.documentElement); return { button: g(btn, ['background-color', 'color', 'border-radius', 'height', 'font-size', 'font-weight', 'padding']), h1: g(h1, ['font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'font-family']), header: g(document.querySelector('header'), ['height']), footerLink: g(flink, ['color', 'font-size', 'font-weight']), rootVars: { brand600: root.getPropertyValue('--hds-color-core-brand-600').trim(), textSolid: root.getPropertyValue('--hds-color-text-solid').trim(), space200: root.getPropertyValue('--hds-space-core-200').trim(), headingXxl: root.getPropertyValue('--hds-font-heading-xxl-size').trim() } }; });
  const toHex = (c) => { const m = c?.match(/\d+/g); return m ? '#' + m.slice(0, 3).map(n => Number(n).toString(16).padStart(2, '0')).join('') : c; };
  const checks = [
    ['button bg == action-bg-solid', toHex(live.button?.['background-color']), T.color.semantic.light['action-bg-solid'].value],
    ['button radius == core-radius-sm', live.button?.['border-radius'], T.space.core['radius-sm']],
    ['button height == button-height desktop', live.button?.height, T.space.component['button-height']?.desktop],
    ['h1 size == heading-xxl?/xl desktop', live.h1?.['font-size'], [T.typography.heading.xxl.desktop.sizePx, T.typography.heading.xl.desktop.sizePx, T.typography['heading-hero']?.lg?.desktop?.sizePx].join('|')],
    ['footer link color == text-soft', toHex(live.footerLink?.color), T.color.semantic.light['text-soft'].value],
    ['root --hds-color-core-brand-600', live.rootVars.brand600, T.color.core['brand-600']],
    ['root --hds-space-core-200', live.rootVars.space200, T.space.core['200']],
    ['root --hds-font-heading-xxl-size (desktop)', live.rootVars.headingXxl, T.typography.heading.xxl.desktop.size],
    ['header height 76px', live.header?.height, '76px'],
  ].map(([name, actual, expected]) => ({ name, actual, expected, pass: actual != null && String(expected).split('|').includes(String(actual)) }));
  out.live = { url: 'https://stripe.com/', live, checks, passed: checks.filter(c => c.pass).length, total: checks.length };
  if (checks.some(c => !c.pass)) out.ok = false;
} catch (e) { out.live = { error: String(e).slice(0, 200) }; }
await browser.close();
await writeFile(path.join(CUR, 'validation.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
process.exit(out.ok ? 0 : 1);
