// Build curated token files from data/raw/css-custom-properties.json (+ font faces, keyframes, hds rules).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const RAW = path.join(ROOT, 'data/raw'); const CUR = path.join(ROOT, 'data/curated');
await mkdir(CUR, { recursive: true });
const vars = JSON.parse(await readFile(path.join(RAW, 'css-custom-properties.json'), 'utf8'));
const fontFaces = JSON.parse(await readFile(path.join(RAW, 'css-font-faces.json'), 'utf8'));
const keyframes = JSON.parse(await readFile(path.join(RAW, 'css-keyframes.json'), 'utf8'));
const hdsRules = JSON.parse(await readFile(path.join(RAW, 'css-hds-rules.json'), 'utf8'));

const norm = (v) => v.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();
const isGlobalSel = (s) => /^(:root|html|\.hds-mode--(light|dark)|\.hds-accent--[a-z]+|:where\(:lang\([a-z]+\)\))(\s*,\s*(:root|\.hds-mode--(light|dark)))*$/.test(s.trim());
const bp = (ctx) => ctx.includes('(min-width:940px)') ? 'desktop' : ctx.includes('(min-width:640px)') ? 'tablet' : ctx.includes('max-width') ? null : 'base';

// Scopes: light(base/tablet/desktop), dark, accent-*
const scopes = { light: { base: {}, tablet: {}, desktop: {} }, dark: {}, accents: {}, lang: {} };
const skipped = [];
for (const [name, entries] of Object.entries(vars)) {
  if (!name.startsWith('--hds-')) continue;
  for (const e of entries) {
    const sel = e.selector.trim(); const ctx = e.context || '';
    if (!isGlobalSel(sel)) { skipped.push({ name, selector: sel }); continue; }
    const v = norm(e.value); const b = bp(ctx); if (!b) continue;
    if (sel.includes('.hds-mode--dark')) { scopes.dark[name] = v; continue; }
    const acc = sel.match(/\.hds-accent--([a-z]+)/); if (acc) { (scopes.accents[acc[1]] ??= {})[name] = v; continue; }
    const lang = sel.match(/:lang\(([a-z]+)\)/); if (lang) { (scopes.lang[lang[1]] ??= {})[name] = v; continue; }
    if (b === 'base') scopes.light.base[name] ??= v; else scopes.light[b][name] = v;
  }
}
// Drop responsive entries identical to base
for (const b of ['tablet', 'desktop']) for (const k of Object.keys(scopes.light[b])) { const prev = b === 'desktop' ? (scopes.light.tablet[k] ?? scopes.light.base[k]) : scopes.light.base[k]; if (prev === scopes.light[b][k]) delete scopes.light[b][k]; }

// Resolver
function resolve(value, map, depth = 0) {
  if (depth > 12) return value;
  return value.replace(/var\((--[a-zA-Z0-9_-]+)(?:,([^()]*|\([^()]*\))*)?\)/g, (m, n) => {
    const v = map[n]; if (v == null) { const fb = m.match(/var\(--[^,]+,(.*)\)$/); return fb ? resolve(fb[1].trim(), map, depth + 1) : m; }
    return resolve(v, map, depth + 1);
  });
}
const lightMap = { ...scopes.light.base }; const darkMap = { ...scopes.light.base, ...scopes.dark };
const desktopMap = { ...scopes.light.base, ...scopes.light.tablet, ...scopes.light.desktop };
const tabletMap = { ...scopes.light.base, ...scopes.light.tablet };
const resolvedLight = Object.fromEntries(Object.keys(lightMap).map(k => [k, resolve(lightMap[k], lightMap)]));
const resolvedDark = Object.fromEntries(Object.keys(darkMap).map(k => [k, resolve(darkMap[k], darkMap)]));

// tokens.css
let css = `/* Stripe HDS design tokens — extracted from stripe.com marketing CSS (b.stripecdn.com, ${new Date().toISOString().slice(0,10)}).\n * Source of truth: data/raw/css-custom-properties.json. Regenerate with node scripts/build-tokens.mjs.\n * Light values live on :root; add .hds-mode--dark to a container for dark mode; .hds-accent--{lemon|magenta|orange|ruby} switches the accent set.\n */\n`;
const emit = (sel, map, indent = '') => `${indent}${sel} {\n` + Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${indent}  ${k}: ${v};`).join('\n') + `\n${indent}}\n`;
css += emit(':root, .hds-mode--light', scopes.light.base);
css += `\n@media (min-width: 640px) {\n` + emit(':root', scopes.light.tablet, '  ') + `}\n`;
css += `\n@media (min-width: 940px) {\n` + emit(':root', scopes.light.desktop, '  ') + `}\n`;
css += `\n` + emit('.hds-mode--dark', scopes.dark);
for (const [a, m] of Object.entries(scopes.accents)) css += `\n` + emit(`.hds-accent--${a}`, m);
for (const [l, m] of Object.entries(scopes.lang)) css += `\n` + emit(`:where(:lang(${l}))`, m);
css += `\n/* Font faces (files served from stripe.com; sohne-var is a licensed font — see docs/LICENSE_AND_ATTRIBUTION.md) */\n`;
for (const f of fontFaces) css += `@font-face { ${Object.entries(f).map(([k, v]) => `${k}: ${v.replace(/url\((\/[^)]+\/([^/)]+))\)/g, 'url(../../assets/stripe/fonts/$2), url(https://b.stripecdn.com$1)')}`).join('; ')}; }\n`;
await writeFile(path.join(CUR, 'tokens.css'), css);

// tokens.json (resolved, grouped)
const px = (rem) => /rem$/.test(rem) ? `${parseFloat(rem) * 16}px` : rem;
const typo = {};
for (const k of Object.keys(scopes.light.base)) {
  const m = k.match(/^--hds-font-(heading-hero|heading|text|quote|quoteAttribution|input-description|input-groupHeading|input-label|input-text)-([a-zA-Z]+)-(size|lineHeight|letterSpacing|weight)$/); if (!m) continue;
  const [, fam, size, prop] = m; typo[fam] ??= {}; typo[fam][size] ??= { mobile: {}, tablet: {}, desktop: {} };
  typo[fam][size].mobile[prop] = lightMap[k]; typo[fam][size].tablet[prop] = tabletMap[k]; typo[fam][size].desktop[prop] = desktopMap[k];
}
for (const fam of Object.values(typo)) for (const s of Object.values(fam)) for (const b of Object.values(s)) if (b.size) b.sizePx = px(b.size);
const group = (prefix, map) => Object.fromEntries(Object.keys(map).filter(k => k.startsWith(prefix)).sort().map(k => [k.slice(prefix.length), map[k]]));
const tokens = {
  meta: { source: 'https://stripe.com/ (b.stripecdn.com/mkt-ssr-statics CSS)', system: 'HDS (Stripe marketing design system)', extractedAt: new Date().toISOString(), breakpoints: { tablet: '640px', desktop: '940px' }, prefersReducedMotion: true },
  fonts: { family: lightMap['--hds-font-family'], familyCode: lightMap['--hds-font-family-code'], weightNormal: lightMap['--hds-font-weight-normal'], weightBold: lightMap['--hds-font-weight-bold'], faces: fontFaces },
  color: {
    core: group('--hds-color-core-', lightMap),
    semantic: {
      light: Object.fromEntries(Object.keys(lightMap).filter(k => k.startsWith('--hds-color-') && !k.startsWith('--hds-color-core-')).sort().map(k => [k.slice('--hds-color-'.length), { ref: lightMap[k], value: resolvedLight[k] }])),
      dark: Object.fromEntries(Object.keys(darkMap).filter(k => k.startsWith('--hds-color-') && !k.startsWith('--hds-color-core-')).sort().map(k => [k.slice('--hds-color-'.length), { ref: darkMap[k], value: resolvedDark[k] }])),
    },
    accents: Object.fromEntries(Object.entries(scopes.accents).map(([a, m]) => [a, Object.fromEntries(Object.entries(m).map(([k, v]) => [k.slice('--hds-color-'.length), { ref: v, value: resolve(v, { ...lightMap, ...m }) }]))])),
  },
  typography: typo,
  space: { core: group('--hds-space-core-', lightMap), layout: Object.fromEntries(['columns','content-margin','gap','page-margin'].map(n => [n, { mobile: resolve(lightMap[`--hds-space-layout-${n}`], lightMap), tablet: resolve(tabletMap[`--hds-space-layout-${n}`], tabletMap), desktop: resolve(desktopMap[`--hds-space-layout-${n}`], desktopMap) }])),
    section: Object.fromEntries(Object.keys(lightMap).filter(k => k.startsWith('--hds-space-section-')).map(k => [k.slice('--hds-space-section-'.length), { mobile: resolve(lightMap[k], lightMap), tablet: resolve(tabletMap[k], tabletMap), desktop: resolve(desktopMap[k], desktopMap) }])),
    component: Object.fromEntries(Object.keys(lightMap).filter(k => k.startsWith('--hds-space-') && !/^--hds-space-(core|layout|section)-/.test(k)).map(k => [k.slice('--hds-space-'.length), { mobile: resolve(lightMap[k], lightMap), tablet: resolve(tabletMap[k], tabletMap), desktop: resolve(desktopMap[k], desktopMap) }])) },
  shadow: Object.fromEntries(['xs','sm','md','lg','xl'].map(s => [s, { light: resolvedLight[`--hds-shadow-${s}`], dark: resolvedDark[`--hds-shadow-${s}`] }])),
  focus: group('--hds-focus-', resolvedLight),
  motion: { keyframes, easings: { hdsDefault: 'cubic-bezier(.25,1,.5,1) 300ms', accordion: 'cubic-bezier(0.65,0.05,0.36,1) 360ms', navigation: 'cubic-bezier(0.45,0.05,0.55,0.95) 240ms', dialogOpen: 'cubic-bezier(.22,1,.36,1) 800ms', resourceCard: 'cubic-bezier(0.46,0.03,0.52,0.96) 300ms', graphicReveal: 'cubic-bezier(0.25,1,0.5,1) 300ms' } },
  counts: { light: Object.keys(lightMap).length, darkOverrides: Object.keys(scopes.dark).length, tabletOverrides: Object.keys(scopes.light.tablet).length, desktopOverrides: Object.keys(scopes.light.desktop).length, accents: Object.fromEntries(Object.entries(scopes.accents).map(([a, m]) => [a, Object.keys(m).length])), skippedScoped: skipped.length },
};
await writeFile(path.join(CUR, 'tokens.json'), JSON.stringify(tokens, null, 2));
await writeFile(path.join(RAW, 'css-scoped-variables.json'), JSON.stringify(skipped, null, 1));

// hds-components.css — verbatim HDS rules grouped by component and wrapped in their media queries
const nestCtx = (ctx, body) => { const parts = (ctx || '').split(/\s+(?=@)/).map(x => x.trim()).filter(x => x && !/^@layer/.test(x)); return parts.reduceRight((acc, at) => `${at} { ${acc} }`, body); };
const comp = (sel) => (sel.match(/\.hds-([a-z0-9]+(?:-[a-z0-9]+)*)/i)?.[1] || 'misc').split('__')[0].split('--')[0];
const byComp = {};
for (const r of hdsRules) { const ctx = r.context.replace(/@layer base\s*/g, '').trim(); (byComp[comp(r.selector)] ??= []).push({ ...r, ctx }); }
let ccss = `/* Stripe HDS component CSS — verbatim rules extracted from stripe.com marketing stylesheets. Requires tokens.css. Wrapped in @layer hds so app styles win. */\n@layer hds {\n`;
for (const c of Object.keys(byComp).sort()) {
  ccss += `\n  /* ===== ${c} ===== */\n`;
  for (const r of byComp[c]) { const body = `${r.selector} { ${r.declarations} }`; ccss += `  ${nestCtx(r.ctx, body)}\n`; }
}
ccss += `\n  /* ===== keyframes ===== */\n`; for (const [n, b] of Object.entries(keyframes)) ccss += `  @keyframes ${n} { ${b.replace(/\s+/g, ' ')} }\n`;
ccss += `}\n`;
await writeFile(path.join(CUR, 'hds-components.css'), ccss);
console.log(JSON.stringify({ ...tokens.counts, typographyFamilies: Object.keys(typo), components: Object.keys(byComp).length, shadowXs: tokens.shadow.xs.light }, null, 1));
