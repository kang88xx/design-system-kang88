// Build legacy (mkt-statics-srv, .MktRoot) token + component CSS from data/raw/*-legacy.json
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const RAW = path.join(ROOT, 'data/raw'); const CUR = path.join(ROOT, 'data/curated');
const vars = JSON.parse(await readFile(path.join(RAW, 'css-custom-properties-legacy.json'), 'utf8'));
const rules = JSON.parse(await readFile(path.join(RAW, 'css-hds-rules-legacy.json'), 'utf8'));
const keyframes = JSON.parse(await readFile(path.join(RAW, 'css-keyframes-legacy.json'), 'utf8'));
const norm = (v) => v.replace(/\s+/g, ' ').trim();
const globalSel = /^(\.MktRoot|html|:root|body|\.theme--[A-Za-z]+|\.flavor--[A-Za-z]+(\.theme--[A-Za-z]+)?(\.accent--[A-Za-z]+)?|\.accent--[A-Za-z]+)(\s*,\s*[^{]+)?$/;
const scopes = {}; // selector+context -> {name: value}
for (const [name, entries] of Object.entries(vars)) for (const e of entries) {
  const sel = e.selector.trim(); if (!globalSel.test(sel)) continue;
  if (/\.flavor--/.test(sel) && !/^\.flavor--[A-Za-z]+(\.theme--Dark)?$/.test(sel.split(',')[0].trim())) { /* accent combos handled below */ }
  const key = sel + (e.context ? ' || ' + e.context : ''); (scopes[key] ??= {})[name] = norm(e.value);
}
// Accent palette: from .flavor--X.accent--Y selectors collect --accentColor values by accent name & theme
const accents = {}; for (const e of vars['--accentColor'] || []) { for (const part of e.selector.split(',')) { const m = part.match(/\.accent--([A-Za-z]+)/); if (!m) continue; const dark = /theme--Dark/.test(part); (accents[m[1]] ??= {})[dark ? 'dark' : 'light'] ??= norm(e.value); } }
// Flavors: gradient colors
const flavors = {}; for (const k of ['--gradientColorZero', '--gradientColorOne', '--gradientColorTwo', '--gradientColorThree', '--gradientColorZeroTransparent', '--gradientColorOneTransparent', '--gradientColorTwoTransparent', '--gradientColorThreeTransparent', '--stripeColor', '--shadeOneColor', '--shadeTwoColor']) for (const e of vars[k] || []) { const m = e.selector.match(/^\.flavor--([A-Za-z]+)$/); if (m) (flavors[m[1]] ??= {})[k] = norm(e.value); }
// Themes
const themes = {}; for (const [key, m] of Object.entries(scopes)) { const t = key.match(/^\.theme--([A-Za-z]+)$/); if (t) themes[t[1]] = m; }
const root = { ...(scopes['html'] || {}), ...(scopes['.MktRoot'] || {}) };
const responsive = Object.entries(scopes).filter(([k]) => /^html \|\| /.test(k)).map(([k, m]) => ({ media: k.split(' || ')[1], vars: m }));
// Component classes
const nestCtx = (ctx, body) => { const parts = (ctx || '').split(/\s+(?=@)/).map(x => x.trim()).filter(x => x && !/^@layer/.test(x)); return parts.reduceRight((acc, at) => `${at} { ${acc} }`, body); };
const comp = (sel) => sel.match(/\.([A-Z][A-Za-z0-9]+)/)?.[1] || 'misc';
const WANT = new Set(['Button', 'CtaButton', 'CtaGroup', 'Link', 'HoverArrow', 'Copy', 'CopyTitle', 'CopyBody', 'CopyCaption', 'CopyFootnote', 'Section', 'Card', 'FeatureCard', 'ProductFeatureCard', 'Badge', 'Accordion', 'AccordionItem', 'Tabs', 'TabsList', 'Table', 'TableBody', 'TableCell', 'TableHeader', 'List', 'GridLayout', 'SelectInput', 'TextInput', 'FormCard', 'TooltipButton', 'SiteHeader', 'SiteHeaderNavItem', 'SiteFooterSection', 'SegmentedControlButton', 'SegmentedControl', 'BucketItem', 'BucketListing', 'MktRoot', 'HubPage', 'Stripe', 'LogoRiver', 'Gradient', 'MediaCallout', 'StackedCarousel', 'PricingProductCard', 'PricingEnterprisePackageCard', 'AccentedCard', 'AccentedCardCarouselItem', 'CustomerLogo', 'Stat', 'StatCard']);
const byComp = {}; for (const r of rules) { const c = comp(r.selector); if (!WANT.has(c)) continue; (byComp[c] ??= []).push(r); }
let css = `/* Stripe legacy marketing system ("MktRoot", b.stripecdn.com/mkt-statics-srv v1-*.css) — tokens extracted ${new Date().toISOString().slice(0, 10)}.\n * Used by most product pages (payments, connect, pricing, ...). Apply .MktRoot on a wrapper plus a .theme--Light|Dark|SemiDark|White and optional .flavor--X.accent--Y.\n */\n`;
const emit = (sel, map, ind = '') => `${ind}${sel} {\n` + Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${ind}  ${k}: ${v};`).join('\n') + `\n${ind}}\n`;
css += emit(':root, .MktRoot', root);
for (const r of responsive) css += `\n${r.media} {\n` + emit(':root, .MktRoot', r.vars, '  ') + `}\n`;
for (const [t, m] of Object.entries(themes)) css += `\n` + emit(`.theme--${t}`, m);
for (const [a, m] of Object.entries(accents)) { css += `\n.accent--${a} { --accentColor: ${m.light}; }\n`; if (m.dark) css += `.theme--Dark.accent--${a}, .theme--Dark .accent--${a} { --accentColor: ${m.dark}; }\n`; }
for (const [f, m] of Object.entries(flavors)) css += `\n` + emit(`.flavor--${f}`, m);
await writeFile(path.join(CUR, 'legacy-tokens.css'), css);
let ccss = `/* Stripe legacy marketing components — verbatim rules from mkt-statics-srv v1-*.css. Requires legacy-tokens.css. */\n@layer stripe-legacy {\n`;
for (const c of Object.keys(byComp).sort()) { ccss += `\n  /* ===== ${c} ===== */\n`; for (const r of byComp[c]) { const body = `${r.selector} { ${r.declarations} }`; ccss += `  ${nestCtx(r.context, body)}\n`; } }
ccss += `\n  /* ===== keyframes ===== */\n`; for (const [n, b] of Object.entries(keyframes)) ccss += `  @keyframes ${n} { ${b.replace(/\s+/g, ' ')} }\n`;
ccss += `}\n`;
await writeFile(path.join(CUR, 'legacy-components.css'), ccss);
const summary = { root, responsive, themes, accents, flavors, components: Object.fromEntries(Object.entries(byComp).map(([k, v]) => [k, v.length])), keyframes: Object.keys(keyframes) };
await writeFile(path.join(CUR, 'legacy-tokens.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ root: Object.keys(root).length, themes: Object.keys(themes), accents: Object.keys(accents), flavors: Object.keys(flavors), components: Object.keys(byComp).length, rules: Object.values(byComp).reduce((a, b) => a + b.length, 0), keyframes: Object.keys(keyframes).length }));
