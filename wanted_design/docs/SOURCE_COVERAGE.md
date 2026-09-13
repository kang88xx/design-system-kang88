# Source coverage and validation

Checked locally on 2026-09-07 (Asia/Seoul). Public source: https://montage.wanted.co.kr/.

## Captured source steps

1. Home: captured after scrolling through reveal sections; hero/shapes/resources/Behind/FAQ inspected. Healthy capture in `captures/refresh/source-home.png`.
2. Button Web: source variants and native controls rendered; healthy capture in `source-button.png`.
3. AnimationPresence / WithInteraction / Gradient: all three current public routes returned HTTP200; screenshots and computed styles saved. Initial guessed routes returned404 and were replaced with actual catalog URLs before final evidence capture.
4. Local catalog:13 views tested on desktop and mobile, with light/dark screenshots. Browser report and screenshot paths: `captures/refresh/browser-report.json`.

## Inventory

| Surface | Captured coverage |
| --- | --- |
| Documentation | 264 pages, 262 sitemap URLs, no missing/new/removed routes |
| Images | 697 original refs, all files hash-validated |
| Icons | 339 original SVGs plus20 independently exported upstream SVGs;359 unique names |
| Code | 580 substantial documented examples,53 components,52 utilities |
| Surface and motion recipes | 18 surfaces,10 motion recipes;2 observed,7 documented,1 approximation |
| Pinned upstream | v3.12.0, 965 package files, complete archive |

Reference capture and pinned upstream are distinct snapshots. The full re-crawl found identical code blocks, assets and themes relative to the baseline. Original339 icon files remain untouched; additional20 SVGs retain a separate name/version/brand manifest.

## Corrected findings

- Enabled the previously unexposed697-image inventory, code examples and SVG downloads.
- Added replayable motion, functioning native interaction demos, source provenance, and source/reference/reuse packages.
- Corrected gradient direction/mask output and loading/skeleton motion against pinned source.
- Preserved multicolor SVGs in dark/monochrome preview settings.
- Fixed inverse toast text token, weak metadata readability, keyboard tab focus, modal focus return and clipboard failure handling.
- Removed the optional external Pretext import and editable catalog descriptions.

## Reproduce

Start the README preview server, then run:

```bash
node scripts/validate-capture.mjs
node scripts/validate-reuse.mjs
node scripts/test-viewer.mjs
```

No package.json, TypeScript app build, or lint framework exists in this repository. Equivalent checks use Node syntax parsing, Python compilation, generated module parsing in Chromium, hashes/JSON/XML checks, ZIP integrity, and13 browser behavior groups. Screenshots alone are not treated as accessibility certification.

## Limits

Private Figma layers and authenticated internal implementations are not collected. The generic continuous marquee recipe is a local approximation. Original Lottie JSON is downloadable; lightweight hover previews are labelled approximations. Font CSS uses the original external CDN. Brand/reference assets remain identifiable and include source and licence notes.
