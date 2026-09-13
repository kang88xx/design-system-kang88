// Aggregate per-page crawl JSON into curated observations + export logo SVGs.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const PAGES = path.join(ROOT, 'data/raw/pages'); const CUR = path.join(ROOT, 'data/curated'); const SVG = path.join(ROOT, 'assets/stripe/svg');
await mkdir(SVG, { recursive: true });
const tokens = JSON.parse(await readFile(path.join(CUR, 'tokens.json'), 'utf8'));
const files = (await readdir(PAGES)).filter(f => f.endsWith('.json')).sort();
const pages = []; for (const f of files) pages.push(JSON.parse(await readFile(path.join(PAGES, f), 'utf8')));
const ok = pages.filter(p => p.ok);
const systemOf = (p) => { const c = p.freq?.color || {}; const legacy = (c['rgb(10, 37, 64)'] || 0) + (c['rgb(66, 84, 102)'] || 0); const hds = (c['rgb(6, 27, 49)'] || 0) + (c['rgb(80, 97, 122)'] || 0); return legacy > hds ? 'legacy' : 'hds'; };
for (const p of pages) p.system = p.ok ? systemOf(p) : null;

// color helpers
const toHex = (c) => { const m = c.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); if (!m) return c; const h = (n) => Number(n).toString(16).padStart(2, '0'); const a = m[4] == null ? 1 : Number(m[4]); return `#${h(m[1])}${h(m[2])}${h(m[3])}${a < 1 ? h(Math.round(a * 255)) : ''}`; };
const expand = (hex) => hex.length === 4 ? '#' + [...hex.slice(1)].map(c => c + c).join('') : hex;
const tokenByHex = {};
for (const [k, v] of Object.entries(tokens.color.core)) if (/^#/.test(v)) (tokenByHex[expand(v).toLowerCase()] ??= []).push(`core-${k}`);
for (const [k, v] of Object.entries(tokens.color.semantic.light)) if (/^#/.test(v.value)) (tokenByHex[expand(v.value).toLowerCase()] ??= []).push(k);
const tokenFor = (hex) => tokenByHex[expand(hex).toLowerCase()] || [];

// aggregate freq
const agg = {}; const pagesWith = {};
for (const p of ok) for (const [prop, table] of Object.entries(p.freq || {})) for (const [v, n] of Object.entries(table)) { agg[prop] ??= {}; agg[prop][v] = (agg[prop][v] || 0) + n; pagesWith[prop] ??= {}; (pagesWith[prop][v] ??= new Set()).add(p.slug); }
const aggBy = { hds: {}, legacy: {} }; for (const p of ok) for (const [prop, table] of Object.entries(p.freq || {})) for (const [v, n] of Object.entries(table)) { aggBy[p.system][prop] ??= {}; aggBy[p.system][prop][v] = (aggBy[p.system][prop][v] || 0) + n; }
const topBy = (sys, prop, n = 40) => Object.entries(aggBy[sys][prop] || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count, hex: /rgb/.test(value) ? toHex(value) : undefined, tokens: /rgb/.test(value) ? tokenFor(toHex(value)) : undefined }));
const top = (prop, n = 60) => Object.entries(agg[prop] || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count, pages: pagesWith[prop][value].size }));
const colors = (prop) => top(prop, 80).map(x => ({ ...x, hex: toHex(x.value), tokens: tokenFor(toHex(x.value)) }));

// typography combos
const combos = {}; for (const p of ok) for (const [k, n] of (p.typeCombos || [])) combos[k] = (combos[k] || 0) + n;
const scale = []; for (const [fam, sizes] of Object.entries(tokens.typography)) for (const [sz, bps] of Object.entries(sizes)) scale.push({ name: `${fam}-${sz}`, px: parseFloat(bps.desktop.sizePx), weight: bps.desktop.weight, lh: parseFloat(bps.desktop.lineHeight), ls: bps.desktop.letterSpacing });
const matchScale = (sizePx, weight, lhPx) => { const s = parseFloat(sizePx); const cands = scale.filter(x => x.px === s && String(x.weight) === String(weight)); if (!cands.length) return null; const lh = parseFloat(lhPx) / s; cands.sort((a, b) => Math.abs(a.lh - lh) - Math.abs(b.lh - lh)); return Math.abs(cands[0].lh - lh) < 0.06 ? cands[0].name : null; };
const typeCombos = Object.entries(combos).sort((a, b) => b[1] - a[1]).slice(0, 80).map(([k, count]) => { const [family, size, weight, lineHeight, letterSpacing] = k.split('|'); return { family, size, weight, lineHeight, letterSpacing, count, hdsScale: matchScale(size, weight, lineHeight) }; });

// headings by level
const headings = {}; for (const p of ok) for (const h of p.headings || []) { const key = `${h.tag}|${h.style['font-size']}|${h.style['font-weight']}|${h.style['line-height']}|${h.style['letter-spacing']}|${h.style.color}`; headings[key] ??= { tag: h.tag, system: p.system, style: h.style, count: 0, sample: h.text, page: p.slug }; headings[key].count++; }
const headingStyles = Object.values(headings).sort((a, b) => a.tag.localeCompare(b.tag) || b.count - a.count).map(h => ({ ...h, colorHex: toHex(h.style.color), colorTokens: tokenFor(toHex(h.style.color)), hdsScale: matchScale(h.style['font-size'], h.style['font-weight'], h.style['line-height']) }));

// buttons by class signature
const btns = {}; for (const p of ok) for (const b of p.buttons || []) { const sig = (b.cls || b.tag).split(/\s+/).filter(c => /^hds-button|^hds-ui-button|^hds-link|Button|button|cta/i.test(c)).sort().join(' ') || b.tag; btns[sig] ??= { signature: sig, system: p.system, count: 0, samples: [] }; btns[sig].count++; if (btns[sig].samples.length < 2) btns[sig].samples.push({ text: b.text, page: p.slug, href: b.href, style: Object.fromEntries(['background-color','color','border','border-radius','padding','font-size','font-weight','line-height','height','gap','box-shadow'].map(k => [k, b.style[k]])), hasSvg: b.hasSvg, html: b.html.slice(0, 600) }); }
const buttons = Object.values(btns).sort((a, b) => b.count - a.count).slice(0, 40);

// links
const links = {}; for (const p of ok) for (const l of p.links || []) { const key = `${l.style.color}|${l.style['font-weight']}|${l.style['text-decoration']}`; links[key] ??= { style: l.style, count: 0, sample: l.text, page: p.slug }; links[key].count++; }
// cards
const cards = {}; for (const p of ok) for (const c of p.cards || []) { const key = `${c.style['background-color']}|${c.style['border-radius']}|${c.style['box-shadow']}|${c.style.border}`; cards[key] ??= { style: c.style, count: 0, sample: { page: p.slug, cls: c.cls.slice(0, 80), text: c.text.slice(0, 80), rect: c.rect }, pages: new Set() }; cards[key].count++; cards[key].pages.add(p.slug); }
const cardStyles = Object.values(cards).sort((a, b) => b.count - a.count).slice(0, 40).map(c => ({ ...c, pages: [...c.pages] }));
// sections
const sectionBgs = {}; for (const p of ok) for (const s of p.sections || []) { const k = `${s.style['background-color']}|${s.style['background-image'].slice(0, 120)}`; sectionBgs[k] ??= { bg: s.style['background-color'], bgHex: toHex(s.style['background-color']), tokens: tokenFor(toHex(s.style['background-color'])), image: s.style['background-image'].slice(0, 300), padding: s.style.padding, count: 0, pages: new Set(), cls: s.cls.slice(0, 80) }; sectionBgs[k].count++; sectionBgs[k].pages.add(p.slug); }

// SVG logos: header/footer wordmarks + customer logos; skip duotone product icons (they use gradient fills with class icon*)
const svgs = {}; for (const p of ok) for (const s of p.svgs || []) { if (!s.html) continue; if (s.w < 40 || s.h < 10 || s.w / s.h < 1.2) continue; let label = s.label; if (!label || label === '[object SVGAnimatedString]') { const m = s.html.match(/aria-label="([^"]+)"|<title[^>]*>([^<]+)<\/title>|class="([^"]*logo[^"]*)"/i); label = (m && (m[1] || m[2] || m[3])) || ''; } s.label = label; if (!/logo|wordmark/i.test(label)) continue; const hash = createHash('sha1').update(s.html).digest('hex').slice(0, 10); svgs[hash] ??= { hash, label: s.label, viewBox: s.viewBox, w: s.w, h: s.h, fill: s.fill, html: s.html, pages: new Set() }; svgs[hash].pages.add(p.slug); }
const logos = []; for (const s of Object.values(svgs)) { const base = (s.label || 'logo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'logo'; const name = `${base}-${s.hash}.svg`; await writeFile(path.join(SVG, name), s.html); logos.push({ file: name, label: s.label, viewBox: s.viewBox, w: s.w, h: s.h, pages: [...s.pages] }); }

const pageIndex = pages.map(p => ({ slug: p.slug, path: p.path, system: p.system, ok: p.ok, status: p.status, title: p.title, description: p.description, h1: p.headings?.find(h => h.tag === 'h1')?.text, elementCount: p.elementCount, docHeight: p.docHeight, sections: p.sections?.length, buttons: p.buttons?.length, shots: { fold: `captures/pages/${p.slug}-1440-fold.png`, full: `captures/pages/${p.slug}-1440-full.png`, mobileFold: p.mobile ? `captures/pages/${p.slug}-390-fold.png` : null }, mobile: p.mobile || null, error: p.error }));
const home = pages.find(p => p.slug === 'home');
const observations = {
  meta: { builtAt: new Date().toISOString(), pagesCrawled: pages.length, pagesOk: ok.length, systems: { hds: ok.filter(p => p.system === 'hds').map(p => p.slug), legacy: ok.filter(p => p.system === 'legacy').map(p => p.slug) }, viewport: '1440x900 (+390x844 for home/payments/pricing)', elementsSampled: ok.reduce((a, p) => a + (p.elementCount || 0), 0) },
  body: home?.body, containers: [...new Set(ok.flatMap(p => p.containers || []))],
  colors: { text: colors('color'), background: colors('background-color'), border: colors('border-color') },
  gradients: top('background-image', 60), shadows: top('box-shadow', 40), radii: top('border-radius', 30), fontSizes: top('font-size', 30), fontWeights: top('font-weight'), lineHeights: top('line-height', 30), letterSpacings: top('letter-spacing', 30), fontFamilies: top('font-family'), padding: top('padding', 30), margin: top('margin', 30), gap: top('gap', 30), maxWidth: top('max-width', 20), transitions: top('transition', 40), animations: top('animation', 20), backdropFilters: top('backdrop-filter', 10), textTransforms: top('text-transform', 5),
  typeCombos, headingStyles, buttons, links: Object.values(links).sort((a, b) => b.count - a.count).slice(0, 20), cards: cardStyles, sections: Object.values(sectionBgs).sort((a, b) => b.count - a.count).slice(0, 40).map(s => ({ ...s, pages: [...s.pages] })),
  navigation: { header: home?.header ? { style: home.header.style, rect: home.header.rect } : null, navLinks: home?.navLinks, footerLinks: home?.footerLinks, footerStyle: home?.footer?.style },
  bySystem: Object.fromEntries(['hds', 'legacy'].map(sys => [sys, { text: topBy(sys, 'color'), background: topBy(sys, 'background-color'), border: topBy(sys, 'border-color', 20), radii: topBy(sys, 'border-radius', 15), shadows: topBy(sys, 'box-shadow', 15), gradients: topBy(sys, 'background-image', 25), fontSizes: topBy(sys, 'font-size', 20), fontWeights: topBy(sys, 'font-weight', 8), letterSpacings: topBy(sys, 'letter-spacing', 12), maxWidth: topBy(sys, 'max-width', 10), transitions: topBy(sys, 'transition', 15) }])),
  logos: logos.sort((a, b) => b.pages.length - a.pages.length),
};
await writeFile(path.join(CUR, 'observations.json'), JSON.stringify(observations, null, 1));
await writeFile(path.join(CUR, 'pages.json'), JSON.stringify(pageIndex, null, 1));
await writeFile(path.join(CUR, 'nav-footer-html.json'), JSON.stringify({ header: home?.header?.html, footer: home?.footer?.html }, null, 1));
console.log(JSON.stringify({ pages: pages.length, ok: ok.length, textColors: observations.colors.text.length, unmappedTextColors: observations.colors.text.filter(c => !c.tokens.length).slice(0, 8).map(c => c.hex + ':' + c.count), gradients: observations.gradients.length, typeCombos: typeCombos.length, matchedScale: typeCombos.filter(t => t.hdsScale).length, buttons: buttons.length, logos: logos.length, cards: cardStyles.length }, null, 1));
