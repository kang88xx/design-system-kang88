// Generate docs/SOURCE_COVERAGE.md and docs/LICENSE_AND_ATTRIBUTION.md from curated data (numbers stay in sync with rebuilds).
import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname); const CUR = path.join(ROOT, 'data/curated'); const DOCS = path.join(ROOT, 'docs');
await mkdir(DOCS, { recursive: true });
const J = async (f, d = {}) => { try { return JSON.parse(await readFile(path.join(CUR, f), 'utf8')); } catch { return d; } };
const count = async (dir, re = /./) => (await readdir(path.join(ROOT, dir)).catch(() => [])).filter(f => re.test(f)).length;
const tokens = await J('tokens.json'), legacy = await J('legacy-tokens.json'), obs = await J('observations.json'), pages = await J('pages.json', []), boxes = await J('boxes.json', { items: [] }), effects = await J('effects.json', { groups: {} }), motion = await J('motion.json'), illos = await J('illustrations.json'), inter = await J('interactions.json'), crawl = JSON.parse(await readFile(path.join(ROOT, 'data/raw/crawl-index.json'), 'utf8'));
const clipNames = (await readdir(path.join(ROOT, 'captures/clips')).catch(() => [])).filter(f => f.endsWith('.mp4'));
const clipsMB = +((await Promise.all(clipNames.map(f => stat(path.join(ROOT, 'captures/clips', f)).then(x => x.size)))).reduce((a, b) => a + b, 0) / 1048576).toFixed(1);
const n = { pages: pages.length, hds: pages.filter(p => p.system === 'hds').length, legacy: pages.filter(p => p.system === 'legacy').length, css: crawl.css?.length || 0, cssHds: (crawl.css || []).filter(c => c.url.includes('mkt-ssr-statics')).length, cssLegacy: (crawl.css || []).filter(c => c.url.includes('mkt-statics-srv')).length, hdsTokens: tokens.counts?.light, dark: tokens.counts?.darkOverrides, legacyRoot: Object.keys(legacy.root || {}).length, themes: Object.keys(legacy.themes || {}).length, accents: Object.keys(legacy.accents || {}).length, flavors: Object.keys(legacy.flavors || {}).length, boxes: boxes.items.length, boxFamilies: boxes.summary?.families, boxHover: boxes.summary?.withHover, effects: Object.values(effects.groups).reduce((a, b) => a + b.length, 0), effectKinds: Object.keys(effects.groups).length, kfHds: motion.summary?.keyframes?.hds, kfLegacy: motion.summary?.keyframes?.legacy, kfOther: motion.summary?.keyframes?.other, cssAnim: motion.summary?.cssAnimationsObserved, waapi: motion.summary?.waapiUnique, transitions: motion.summary?.transitionProperties, frames: motion.summary?.frameSequences, illosInPage: illos.summary?.inPage, illosDownloaded: illos.summary?.downloaded, inlineSvg: illos.summary?.inlineSvgSaved, interactions: inter.captured?.length, hoverBoxes: inter.hoverBoxes?.length, icons: await count('assets/stripe/icons', /\.svg$/), logos: await count('assets/stripe/svg', /\.svg$/), pageShots: await count('captures/pages', /\.png$/), boxShots: await count('captures/boxes', /\.png$/), effectShots: await count('captures/effects', /\.png$/), motionShots: await count('captures/motion', /\.png$/), illoShots: await count('captures/illustrations', /\.png$/), interShots: await count('captures/interactions', /\.png$/), clips: await count('captures/clips', /\.mp4$/), clipsMB, compShots: await count('captures/components', /\.png$/), deepPages: (await readdir(path.join(ROOT, 'data/raw/effects'))).filter(f => f.endsWith('.json') && !f.startsWith('_')).length };
const date = new Date().toISOString().slice(0, 10);
const cov = `# Source coverage

Generated ${date} by \`node scripts/build-docs.mjs\`. Numbers come from \`data/curated/*.json\` and the capture folders.

## Crawl

| Item | Count |
| --- | --- |
| Pages crawled (1440×900, computed-style inventory + screenshots) | ${n.pages} |
| Pages on the new **HDS** system (\`--hds-*\`, \`.hds-*\`) | ${n.hds} |
| Pages on the **legacy MktRoot** system (\`.MktRoot\`, \`.theme--*\`, \`.flavor--*\`) | ${n.legacy} |
| Stylesheets saved to \`assets/stripe/css\` | ${n.css} (HDS bundle ${n.cssHds}, legacy \`v1-*.css\` ${n.cssLegacy}, rest = docs Sail / Sessions / Checkout) |
| Deep-pass pages (boxes, effects, motion, illustrations, interactions) | ${n.deepPages} |
| Page screenshots (\`captures/pages\`) | ${n.pageShots} |

## Tokens

| Item | Count |
| --- | --- |
| HDS custom properties resolved on \`:root\` | ${n.hdsTokens} |
| HDS dark-mode overrides (\`.hds-mode--dark\`) | ${n.dark} |
| HDS responsive overrides (640px / 940px) | ${tokens.counts?.tabletOverrides} / ${tokens.counts?.desktopOverrides} |
| HDS accent modes | ${Object.keys(tokens.color?.accents || {}).join(', ')} |
| HDS typography families | ${Object.keys(tokens.typography || {}).join(', ')} |
| Legacy root tokens (\`html\` + \`.MktRoot\`) | ${n.legacyRoot} |
| Legacy themes / accents / gradient flavors | ${n.themes} / ${n.accents} / ${n.flavors} |

## Boxes · effects · motion · illustrations · interactions

| Item | Count |
| --- | --- |
| Unique box sources (HTML + matched CSS via CDP) | ${n.boxes} in ${n.boxFamilies} families, ${n.boxHover} with hover deltas |
| Box screenshots (rest + hover) | ${n.boxShots} |
| Effect samples | ${n.effects} across ${n.effectKinds} kinds (${Object.entries(effects.groups).map(([k, v]) => `${k} ${v.length}`).join(', ')}) |
| Effect screenshots | ${n.effectShots} |
| \`@keyframes\` in stylesheets (HDS / legacy / other) | ${n.kfHds} / ${n.kfLegacy} / ${n.kfOther} |
| CSS animations observed running | ${n.cssAnim} |
| Web Animations API entries (unique type+name+keyframes+target) | ${n.waapi} |
| Transition properties observed | ${n.transitions} |
| Frame sequences (6 frames @160ms) | ${n.frames} (${n.motionShots} PNGs) |
| Illustrations in page (img/svg/video/canvas/DOM graphic) | ${n.illosInPage} (${n.illoShots} screenshots, ${n.inlineSvg} inline SVG files) |
| Illustration source files downloaded | ${n.illosDownloaded} (${Object.entries(illos.summary?.downloadedByType || {}).map(([k, v]) => `${k} ${v}`).join(', ')}) |
| Looping clips (\`captures/clips\`, mp4 15fps, element-cropped, cursor overlay) | ${n.clips} clips, ${n.clipsMB} MB |
| Interaction before/after captures | ${n.interactions} (${n.interShots} PNGs) + ${n.hoverBoxes} hover boxes + ${n.compShots} component-state captures |
| Duotone product icons (reused from 2026-07 collection) | ${n.icons} |
| Logo SVGs extracted | ${n.logos} |

## Systems observed on stripe.com (${date})

- **HDS** (\`b.stripecdn.com/mkt-ssr-statics\`, Next.js bundle): ${pages.filter(p => p.system === 'hds').map(p => p.path).join(', ')}
- **Legacy MktRoot** (\`b.stripecdn.com/mkt-statics-srv/assets/v1-*.css\`): ${pages.filter(p => p.system === 'legacy').map(p => p.path).join(', ')}
- Other systems touched but not catalogued in depth: docs.stripe.com **Sail** (\`--sail-color-*\`, 374 variables in \`data/raw/css-custom-properties-sail.json\`), stripesessions.com, js.stripe.com Checkout.

## Not collected

- Authenticated Dashboard UI, Stripe Apps UI, Figma files, private brand assets.
- WebGL shader source of the hero wave / legacy Gradient canvas (only frame captures and the CSS colour inputs).
- Full HTML of every page (only header/footer/box/effect snippets).
`;
await writeFile(path.join(DOCS, 'SOURCE_COVERAGE.md'), cov);
const lic = `# License and attribution

Everything in this folder was collected from the public website https://stripe.com/ on ${date} for **design reference and internal study**. Stripe, the Stripe wordmark, the duotone product icons, illustrations, photos and customer logos are the property of Stripe, Inc. or their respective owners.

- **Do not ship** Stripe's logo, icons, illustrations, photos, customer logos or copy in another product. Use them only to understand the system.
- **Fonts**: \`sohne-var\` (Söhne by Klim Type Foundry) is licensed to Stripe. The two \`.woff2\` files in \`assets/stripe/fonts\` exist only so the local viewer renders like the site; they must not be redistributed or used in production. \`SourceCodePro\` is OFL (Adobe).
- **CSS / tokens**: values (colours, spacing, easings, shadows) are facts about the site and are reused freely in \`data/curated/*.css\`; verbatim rule text in \`hds-components.css\` / \`legacy-components.css\` is quoted for reference.
- **Screenshots** in \`captures/\` are reproductions of stripe.com pages and belong to Stripe.
- The 193 duotone icons in \`assets/stripe/icons\` come from the 2026-07-15 collection at \`/Volumes/T9/02_Source/Icon_Stripe\` (same terms).
`;
await writeFile(path.join(DOCS, 'LICENSE_AND_ATTRIBUTION.md'), lic);
await writeFile(path.join(CUR, 'counts.json'), JSON.stringify(n, null, 2));
console.log(JSON.stringify(n));
