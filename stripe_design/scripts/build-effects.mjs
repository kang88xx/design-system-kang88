// Curate deep-pass data (data/raw/effects/*.json) into boxes / effects / motion / illustrations / interactions + recipes.css
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const RAW = path.join(ROOT, 'data/raw'); const EFF = path.join(RAW, 'effects'); const CUR = path.join(ROOT, 'data/curated'); const INLINE = path.join(ROOT, 'assets/stripe/illustrations/inline');
await mkdir(INLINE, { recursive: true });
const readJ = async (p) => JSON.parse(await readFile(p, 'utf8'));
const files = (await readdir(EFF)).filter(f => f.endsWith('.json') && !f.startsWith('_')).sort();
const pages = []; for (const f of files) pages.push(await readJ(path.join(EFF, f)));
const pageIndex = await readJ(path.join(CUR, 'pages.json')).catch(() => []);
const systemOf = (slug) => pageIndex.find(p => p.slug === slug)?.system || 'unknown';
const manifest = await readJ(path.join(EFF, '_assets-manifest.json')).catch(() => ({ assets: [] }));
const comps = await readJ(path.join(RAW, 'component-captures.json')).catch(() => ({ items: [] }));
const kf = { hds: await readJ(path.join(RAW, 'css-keyframes.json')).catch(() => ({})), legacy: await readJ(path.join(RAW, 'css-keyframes-legacy.json')).catch(() => ({})), other: await readJ(path.join(RAW, 'css-keyframes-other.json')).catch(() => ({})) };
const CLIPS = path.join(RAW, 'clips'); const clipFiles = (await readdir(CLIPS).catch(() => [])).filter(f => f.endsWith('.json') && !f.startsWith('_'));
const clips = {}; const clipList = [];
for (const f of clipFiles) { const j = await readJ(path.join(CLIPS, f)); for (const c of j.clips || []) if (c.file) { clips[`${j.slug}-${c.id}`] = c; clipList.push({ page: j.slug, ...c }); } }
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const KEY = ['background-color', 'background-image', 'border', 'border-radius', 'box-shadow', 'padding', 'backdrop-filter', 'color', 'filter', 'mask-image', 'clip-path', 'transform', 'transition', 'gap', 'display', 'grid-template-columns', 'flex-direction', 'align-items', 'justify-content', 'overflow', 'min-height', 'max-width', 'outline', 'mix-blend-mode', 'opacity'];

// ---------- BOXES ----------
const boxMap = new Map();
for (const p of pages) for (const b of p.boxes || []) {
  const key = `${b.sig}|${b.style['background-color'] || ''}|${b.style['border-radius'] || ''}|${(b.style['box-shadow'] || '').slice(0, 30)}`;
  if (boxMap.has(key)) { const ex = boxMap.get(key); ex.occurrences++; ex.pages.add(p.slug); const c = clips[`${p.slug}-${b.id}`]?.file; if (c && !ex.clip) { ex.clip = c; if (b.hoverDelta && !ex.hoverDelta) { ex.hoverDelta = b.hoverDelta; ex.hoverShot = b.hoverShot; } } continue; }
  const rules = (b.matchedCss?.rules || []).filter(r => !/^\*, ::after, ::before$|^\*$|^html|^body/.test(r.selector) && r.css.length > 0);
  boxMap.set(key, { id: `${p.slug}-${b.id}`, page: p.slug, system: systemOf(p.slug), sig: b.sig, path: b.path, rect: b.rect, text: b.text, dark: b.dark, interactive: b.interactive, hasImg: b.hasImg, style: Object.fromEntries(KEY.filter(k => b.style[k]).map(k => [k, b.style[k]])), before: b.before, after: b.after, source: { rules, pseudo: (b.matchedCss?.pseudo || []).map(pe => ({ pseudo: pe.pseudo, rules: pe.rules.filter(r => !/^\*, ::after, ::before$/.test(r.selector)) })).filter(pe => pe.rules.length), inline: b.matchedCss?.inline || '', keyframes: b.matchedCss?.keyframes || [] }, children: (b.children || []).map(c => ({ tag: c.tag, cls: c.cls, display: c.display, padding: c.padding, gap: c.gap, fontSize: c.fontSize, fontWeight: c.fontWeight, color: c.color, rules: (c.matchedCss?.rules || []).filter(r => !/^\*, ::after, ::before$|^\*$/.test(r.selector)).slice(0, 12) })), html: b.html, shot: b.shot, hoverShot: b.hoverShot, hoverDelta: b.hoverDelta, hoverAnimations: b.hoverAnimations, occurrences: 1, pages: new Set([p.slug]), clip: clips[`${p.slug}-${b.id}`]?.file || null });
}
const boxes = [...boxMap.values()].map(b => ({ ...b, pages: [...b.pages] }));
// Box recipes: standalone CSS from computed values
const recipeOf = (b) => { const s = b.style; const d = []; if (s['background-color']) d.push(`background-color: ${s['background-color']}`); if (s['background-image'] && !/^url\(/.test(s['background-image'])) d.push(`background-image: ${s['background-image']}`); if (s.border && !/^0px/.test(s.border)) d.push(`border: ${s.border}`); if (s['border-radius']) d.push(`border-radius: ${s['border-radius']}`); if (s['box-shadow']) d.push(`box-shadow: ${s['box-shadow']}`); if (s.padding) d.push(`padding: ${s.padding}`); if (s['backdrop-filter']) d.push(`backdrop-filter: ${s['backdrop-filter']}; -webkit-backdrop-filter: ${s['backdrop-filter']}`); if (s.color) d.push(`color: ${s.color}`); if (s['clip-path']) d.push(`clip-path: ${s['clip-path']}`); if (s.transition) d.push(`transition: ${s.transition}`); if (s.overflow) d.push(`overflow: ${s.overflow}`); return d; };
const boxFamilies = {}; for (const b of boxes) { const fam = slugify(b.sig.split(' ')[0].replace(/__.*$/, '') || b.page); (boxFamilies[fam] ??= []).push(b); }

// ---------- EFFECTS ----------
const effects = {}; const seenEff = new Set();
for (const p of pages) for (const e of p.effects || []) {
  const kindKey = e.kinds.filter(k => k !== 'transform' || e.kinds.length === 1)[0] || e.kinds[0];
  const sigStyle = JSON.stringify([e.style['background-image'], e.style['backdrop-filter'], e.style['mask-image'] || e.style['-webkit-mask-image'], e.style['clip-path'], e.style.transform, e.style['mix-blend-mode'], e.before?.['background-image'], e.after?.['background-image']]);
  const key = kindKey + '|' + e.path.split(' > ').pop() + '|' + sigStyle.slice(0, 120);
  if (seenEff.has(key)) continue; seenEff.add(key);
  (effects[kindKey] ??= []).push({ id: `${p.slug}-${e.id}`, page: p.slug, system: systemOf(p.slug), kinds: e.kinds, path: e.path, tag: e.tag, rect: e.rect, text: e.text, style: e.style, before: e.before, after: e.after, shot: e.shot, source: (e.matchedCss?.rules || []).filter(r => !/^\*, ::after, ::before$|^\*$/.test(r.selector)).slice(0, 14), pseudoSource: (e.matchedCss?.pseudo || []).map(pe => ({ pseudo: pe.pseudo, rules: pe.rules.filter(r => !/^\*, ::after, ::before$/.test(r.selector)).slice(0, 8) })).filter(pe => pe.rules.length) });
}
const chrome = (e) => /header|SiteHeader|navigation|nav\b|footer/i.test(e.path) ? 1 : 0;
for (const k of Object.keys(effects)) effects[k] = effects[k].sort((a, b) => chrome(a) - chrome(b) || (b.rect.w * b.rect.h) - (a.rect.w * a.rect.h)).slice(0, 80);

// ---------- MOTION ----------
const cssAnimations = {}; const frames = [];
for (const p of pages) for (const a of p.animated || []) { const k = a.animation.name; cssAnimations[k] ??= { name: k, usages: [], keyframes: a.matchedCss?.keyframes?.find(x => x.name === k)?.keyframes || null }; cssAnimations[k].usages.push({ page: p.slug, path: a.path, duration: a.animation.duration, timing: a.animation.timing, delay: a.animation.delay, iteration: a.animation.iteration, direction: a.animation.direction, fill: a.animation.fill, frames: a.frames }); if (a.frames?.length) frames.push({ page: p.slug, id: a.id, kind: 'css-animation', name: k, frames: a.frames, rect: a.rect, clip: clips[`${p.slug}-${a.id}`]?.file || null }); }
for (const p of pages) for (const i of p.illos || []) if (i.frames?.length) frames.push({ page: p.slug, id: i.id, kind: i.kind, frames: i.frames, rect: i.rect, src: i.src, clip: clips[`${p.slug}-${i.id}`]?.file || null });
const waapi = new Map(); const transitions = {};
for (const p of pages) for (const a of [...(p.waapi || []), ...(p.scrollAnimations || [])]) {
  if (a.type === 'CSSTransition') { const k = a.name; transitions[k] ??= { property: k, count: 0, durations: {}, easings: {} }; transitions[k].count++; const d = a.timing?.duration; if (d != null) transitions[k].durations[d] = (transitions[k].durations[d] || 0) + 1; const e = a.timing?.easing; if (e) transitions[k].easings[e] = (transitions[k].easings[e] || 0) + 1; continue; }
  const kfs = a.keyframes ? JSON.stringify(a.keyframes) : ''; const key = `${a.type}|${a.name}|${kfs.slice(0, 200)}|${a.target?.split(' > ').pop()}`;
  if (waapi.has(key)) { waapi.get(key).count++; waapi.get(key).pages.add(p.slug); continue; }
  waapi.set(key, { type: a.type, name: a.name, target: a.target, timing: a.timing, keyframes: a.keyframes || null, count: 1, pages: new Set([p.slug]) });
}
const waapiList = [...waapi.values()].map(w => ({ ...w, pages: [...w.pages] })).sort((a, b) => b.count - a.count).slice(0, 300);
const interactionsAnims = {}; for (const p of pages) for (const i of p.interactions || []) for (const a of i.animations || []) { const k = `${i.label}|${a.type}:${a.name}`; interactionsAnims[k] = (interactionsAnims[k] || 0) + 1; }
const motion = {
  summary: { clips: clipList.length, keyframes: { hds: Object.keys(kf.hds).length, legacy: Object.keys(kf.legacy).length, other: Object.keys(kf.other).length }, cssAnimationsObserved: Object.keys(cssAnimations).length, waapiUnique: waapiList.length, transitionProperties: Object.keys(transitions).length, frameSequences: frames.length },
  easings: { hds: { default: 'cubic-bezier(.25,1,.5,1) 300ms (buttons, links, inputs, ui-buttons)', accordion: 'cubic-bezier(0.65,0.05,0.36,1) 360ms', navigation: 'cubic-bezier(0.45,0.05,0.55,0.95) 240ms / 300ms slow / hamburger 250ms', dialogOpen: 'cubic-bezier(.22,1,.36,1) 800ms; close 300ms', resourceCard: 'cubic-bezier(0.46,0.03,0.52,0.96) 300ms', graphicReveal: 'cubic-bezier(0.25,1,0.5,1) 300ms', bookOfTheWeek: 'cubic-bezier(0.33,1,0.68,1) 500ms', reducedMotion: 'all transitions wrapped in @media (prefers-reduced-motion: no-preference)' }, legacy: { hoverTransition: '150ms cubic-bezier(0.215,0.61,0.355,1)  (--hoverTransition)', accordionCollapse: 'var(--accordionCollapseAnimationDuration) / easing', siteMenu: '250ms (--siteMenuTransition), 1ms under reduced motion', navCtaGradient: 'background .3s linear (gradient text CTA in sticky header)', hoverArrow: 'refreshed-nav-hover-arrow-in/out keyframes' } },
  keyframes: kf, cssAnimations, waapi: waapiList, transitions: Object.values(transitions).sort((a, b) => b.count - a.count), frames, interactionAnimations: interactionsAnims,
  hero: comps.items.find(i => i.id === 'hero-background') || null,
  clips: clipList.filter(c => c.kind === 'motion'),
};

// ---------- ILLUSTRATIONS ----------
const keepAsset = (a) => a.file && !/\.(bin|plain|javascript|html)$/.test(a.file) && (a.bytes >= 2048 || (/\.svg$/.test(a.file) && a.bytes >= 300)); // drop tracking pixels / beacons
const illos = []; let inlineCount = 0;
for (const p of pages) for (const i of p.illos || []) {
  let file = null; if (i.svg) { file = `assets/stripe/illustrations/inline/${p.slug}-${i.id}.svg`; await writeFile(path.join(ROOT, file), i.svg); inlineCount++; }
  const asset = i.src ? manifest.assets.filter(keepAsset).find(a => a.url === i.src || (i.src && a.url.split('?')[0] === i.src.split('?')[0])) : null;
  illos.push({ id: `${p.slug}-${i.id}`, page: p.slug, system: systemOf(p.slug), kind: i.kind, path: i.path, rect: i.rect, src: i.src, alt: i.alt, autoplay: i.autoplay, loop: i.loop, poster: i.poster, style: i.style, shot: i.shot, frames: i.frames, file: file || (asset?.file ? `assets/stripe/illustrations/${asset.file}` : null), bytes: asset?.bytes });
}
const kindRank = { 'dom-graphic': 0, canvas: 1, video: 2, svg: 3, img: 4 };
illos.sort((a, b) => (kindRank[a.kind] ?? 9) - (kindRank[b.kind] ?? 9) || (b.file ? 1 : 0) - (a.file ? 1 : 0) || (b.rect.w * b.rect.h) - (a.rect.w * a.rect.h));
const assetsList = manifest.assets.filter(keepAsset).map(a => ({ url: a.url, file: `assets/stripe/illustrations/${a.file}`, kind: a.kind, bytes: a.bytes, contentType: a.ct }));
const illustrations = { summary: { inPage: illos.length, inlineSvgSaved: inlineCount, downloaded: assetsList.length, byKind: illos.reduce((m, i) => (m[i.kind] = (m[i.kind] || 0) + 1, m), {}), downloadedByType: assetsList.reduce((m, a) => { const t = a.file.split('.').pop(); m[t] = (m[t] || 0) + 1; return m; }, {}), techniques: ['WebGL canvas (hero wave, legacy Gradient canvas)', 'DOM graphics: HTML/CSS composed product UIs (.dom-graphic, *-graphic__*) animated with WAAPI/CSS', 'Inline SVG line illustrations & duotone product icons (see assets/stripe/icons)', 'Contentful raster images (images.stripeassets.com) for photos/customer visuals', 'Lottie/JSON where present', 'GIF/MP4 loops'] }, items: illos, assets: assetsList };

// ---------- INTERACTIONS ----------
const interactions = { clips: clipList.filter(c => c.kind !== 'motion'), affordances: Object.fromEntries(pages.map(p => [p.slug, p.affordances])), captured: pages.flatMap(p => (p.interactions || []).filter(i => !i.error).map(i => ({ page: p.slug, ...i, clip: clips[`${p.slug}-x-${{ 'tabs: click 2nd tab': 'tabs', 'accordion: open item': 'accordion', 'carousel: next': 'carousel', 'segmented control: 2nd option': 'segmented', 'nav: open Products': 'nav', 'link hover arrow': 'link' }[i.label]}`]?.file || null }))), hoverBoxes: boxes.filter(b => b.hoverDelta).map(b => ({ id: b.id, page: b.page, sig: b.sig, clip: b.clip, hoverDelta: b.hoverDelta, hoverAnimations: b.hoverAnimations, shot: b.shot, hoverShot: b.hoverShot, transition: b.style.transition })), components: comps.items.filter(i => ['button-primary', 'button-secondary', 'textinput', 'nav-trigger', 'nav-products-menu', 'header', 'footer', 'tag', 'tabs', 'accordion', 'select'].includes(i.id)).map(i => { const c = { ...i }; delete c.html; if (c.menuLinks) c.menuLinks = c.menuLinks.slice(0, 40); return c; }) };

// ---------- RECIPES.CSS ----------
let css = `/* Stripe box & effect recipes — standalone CSS derived from computed styles observed on stripe.com (${new Date().toISOString().slice(0, 10)}).\n * Each recipe lists its source page/element; original matched rules live in data/curated/boxes.json[].source. */\n\n`;
const picked = []; for (const [fam, list] of Object.entries(boxFamilies)) { list.sort((a, b) => b.occurrences - a.occurrences); picked.push(list[0]); if (list[1] && list[1].dark !== list[0].dark) picked.push(list[1]); }
picked.sort((a, b) => b.occurrences - a.occurrences);
for (const b of picked.slice(0, 120)) { const d = recipeOf(b); if (d.length < 2) continue; const name = `.box-${slugify(b.sig.split(' ')[0])}`; css += `/* ${b.page} · ${b.path.slice(0, 90)} · ${b.rect.w}x${b.rect.h} · ${b.system} */\n${name} {\n  ${d.join(';\n  ')};\n}\n`; if (b.before) css += `${name}::before { ${Object.entries(b.before).map(([k, v]) => `${k}: ${v}`).join('; ')}; }\n`; if (b.after) css += `${name}::after { ${Object.entries(b.after).map(([k, v]) => `${k}: ${v}`).join('; ')}; }\n`; if (b.hoverDelta) css += `${name}:hover { ${Object.entries(b.hoverDelta).map(([k, v]) => `${k}: ${v.hover}`).join('; ')}; }\n`; css += `\n`; }
css += `\n/* ===== Effect recipes (HDS + legacy) ===== */\n`;
css += `.fx-gradient-text { background: linear-gradient(90deg, #7232f1 3.13%, #fb76fa 50%, #ffcf5e); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }\n`;
css += `.fx-nav-cta-gradient-text { background: linear-gradient(90deg, #e18638, #e17a38); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; transition: background .3s linear; } /* legacy SiteHeader NavCtaGradient (unstuck) */\n`;
css += `.fx-glass { background-color: rgba(248, 250, 253, 0.45); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 6px; box-shadow: rgba(23, 23, 23, 0.08) 0px 15px 35px 0px; } /* HDS browser-graphic__window */\n`;
css += `.fx-blob-brand { background: radial-gradient(50% 50%, rgba(83, 58, 253, 0.8) 62.5%, rgba(83, 58, 253, 0) 100%); filter: blur(40px); }\n.fx-blob-magenta { background: radial-gradient(50% 50%, rgba(243, 99, 243, 0.8) 53.85%, rgba(243, 99, 243, 0) 100%); filter: blur(40px); }\n.fx-blob-lemon { background: radial-gradient(50% 50%, rgb(255, 207, 94) 41.35%, rgba(255, 207, 94, 0) 100%); filter: blur(40px); }\n`;
css += `.fx-bento-halo { background: radial-gradient(circle, rgb(127, 125, 252), rgb(244, 75, 204) 33%, rgb(229, 237, 245) 66%); } /* HDS modular-solutions bento card hover halo */\n`;
css += `.fx-gradient-border { position: relative; border-radius: 6px; } .fx-gradient-border::before { content: ""; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: conic-gradient(from var(--border-angle, 0deg), #ffd7ef 0%, #f44bcc 25%, #533afd 50%, #ffd7ef 100%); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; animation: fx-border-spin 4s linear infinite; } @property --border-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; } @keyframes fx-border-spin { to { --border-angle: 360deg; } } /* HDS platform-graphic / agentic-commerce border spin */\n`;
css += `.fx-skew-section { --sectionAngle: -6deg; position: relative; } .fx-skew-section > .bg { position: absolute; inset: 0; transform: skewY(var(--sectionAngle)); transform-origin: 100% 0; background: var(--backgroundColor, #f6f9fc); } /* legacy .Section__background: --angleNormal -6deg, --angleStrong -12deg */\n`;
css += `.fx-legacy-gradient-canvas { --gradientColorZero: #a960ee; --gradientColorOne: #ff333d; --gradientColorTwo: #90e0ff; --gradientColorThree: #ffcb57; background: linear-gradient(-6deg, var(--gradientColorZero), var(--gradientColorOne), var(--gradientColorTwo), var(--gradientColorThree)); } /* static fallback of the legacy WebGL Gradient (flavor Chroma) */\n`;
css += `.fx-hover-lift { transition: transform 300ms cubic-bezier(.25,1,.5,1), box-shadow 300ms cubic-bezier(.25,1,.5,1); } .fx-hover-lift:hover { transform: translateY(-4px); }\n`;
css += `.fx-hover-arrow { display: inline-flex; align-items: center; gap: 4px; } .fx-hover-arrow svg { transition: transform 150ms cubic-bezier(0.215,0.61,0.355,1); } .fx-hover-arrow:hover svg { transform: translateX(3px); } /* HDS .hds-icon-hover-arrow / legacy .HoverArrow */\n`;
css += `.fx-card-shadow-xs { box-shadow: 0 2px 5px -1px rgba(50,50,93,.25), 0 1px 3px -1px rgba(0,0,0,.3); }\n.fx-card-shadow-sm { box-shadow: 0 6px 12px -2px rgba(50,50,93,.25), 0 3px 7px -3px rgba(0,0,0,.3); }\n.fx-card-shadow-md { box-shadow: 0 13px 27px -5px rgba(50,50,93,.25), 0 8px 16px -8px rgba(0,0,0,.3); }\n.fx-card-shadow-lg { box-shadow: 0 30px 60px -12px rgba(50,50,93,.25), 0 18px 36px -18px rgba(0,0,0,.3); }\n.fx-card-shadow-xl { box-shadow: 0 50px 100px -20px rgba(50,50,93,.25), 0 30px 60px -30px rgba(0,0,0,.3); }\n`;
css += `.fx-hds-shadow-xs { box-shadow: 0 2px 10px 0 rgba(0,55,112,.06), 0 1px 4px 0 rgba(0,59,137,.04); }\n.fx-hds-shadow-sm { box-shadow: 0 5px 14px 0 rgba(0,55,112,.08), 0 2px 8px 0 rgba(0,59,137,.05); }\n.fx-hds-shadow-md { box-shadow: 0 6px 22px 0 rgba(0,55,112,.1), 0 4px 8px 0 rgba(0,59,137,.02); }\n.fx-hds-shadow-lg { box-shadow: 0 15px 40px -2px rgba(0,55,112,.1), 0 5px 20px -2px rgba(0,59,137,.04); }\n.fx-hds-shadow-xl { box-shadow: 0 20px 80px -16px rgba(0,55,112,.1), 0 10px 60px -16px rgba(0,59,137,.04); }\n`;
await writeFile(path.join(CUR, 'recipes.css'), css);
await writeFile(path.join(CUR, 'boxes.json'), JSON.stringify({ summary: { unique: boxes.length, families: Object.keys(boxFamilies).length, withHover: boxes.filter(b => b.hoverDelta).length, dark: boxes.filter(b => b.dark).length, pages: pages.length }, items: boxes }, null, 1));
await writeFile(path.join(CUR, 'effects.json'), JSON.stringify({ summary: Object.fromEntries(Object.entries(effects).map(([k, v]) => [k, v.length])), groups: effects }, null, 1));
await writeFile(path.join(CUR, 'motion.json'), JSON.stringify(motion, null, 1));
await writeFile(path.join(CUR, 'illustrations.json'), JSON.stringify(illustrations, null, 1));
await writeFile(path.join(CUR, 'interactions.json'), JSON.stringify(interactions, null, 1));
console.log(JSON.stringify({ pages: pages.length, boxes: boxes.length, boxFamilies: Object.keys(boxFamilies).length, recipes: picked.length, effects: Object.fromEntries(Object.entries(effects).map(([k, v]) => [k, v.length])), motion: motion.summary, illustrations: illustrations.summary, interactions: { captured: interactions.captured.length, hoverBoxes: interactions.hoverBoxes.length }, clips: clipList.length }));
