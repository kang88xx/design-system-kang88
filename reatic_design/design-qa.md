# Design QA

final result: passed

## Scope and Evidence

Source: reaticindustry.com public pages `/`, `/about`, `/portfolio`, `/contact`, captured 2026-09-13 KST. Public HTML, inline theme CSS, computed styles, screenshots, images, fonts and background videos are archived. Wix runtime, form backend and editor data are outside scope.

- Source visual truth: `evidence/source/screenshots/home-desktop-fold.png`, `home-desktop-full.png` (1440×9252), `about-desktop-full.png` (10753), `portfolio-desktop-full.png` (8310), `contact-desktop-full.png` (6232), mobile `*-mobile-full.png` (320 wide), 46 section clips, 8 hover captures.
- Measurements: `evidence/source/computed-styles.json` (text/section/button/input/video rects and styles), `component-measurements.json` (second pass, desktop + mobile), `static-extraction.json` (theme variables, font faces, keyframes, transitions, motion vars).
- Implementation: `evidence/local/studio-desktop.png`, per-route `*-1440.png` / `*-390.png`, `reconstruction-{home,about,portfolio,contact}-{1440,390}.png`, `document-template-{1440,390}.png`, `document-template.pdf`.

Desktop viewport 1440×900 (capture) / 1440×1000 (verification). Mobile 390×844 with iPhone UA; the site renders its own 320px canvas. Device scale factor 1. Headless captures can freeze entrance animations before they run, so source full-page screenshots show some blocks faded; section clips and computed values are unaffected.

## Findings and Corrections

1. P1, first-pass gallery spacing was estimated at 25px: second measurement pass read Pro Gallery item containers (651×366, gapX/gapY 20, container x=60 width 1320). Tokens, components.css and the layout page were corrected.
2. P1, `Work Sans SemiBold` is declared on Korean headlines but has no Hangul glyphs: recorded as OS fallback in the inventory; tokens declare `Noto Sans KR` explicitly so the reconstruction does not depend on the viewer's OS.
3. P2, studio component demos overflowed at 320px (fixed-width 288px CTA inside a grid cell): demo grid tracks set to `minmax(0,1fr)`, children `max-width:100%`, CTA full-width under 460px. Overflow checks now pass at 320.
4. P2, reconstruction pages timed out on `networkidle` because range-requested videos keep the network busy: verification waits for `load` and a fixed delay; the static server implements byte ranges for mp4.
5. P2, smooth scrolling produced mid-scroll screenshots: `scroll-behavior: smooth` removed from studio and reconstruction pages; verification forces auto scrolling before captures.
6. P2, 3D fold entrances (perspective rotateX) created a temporary 6px horizontal scroll on the home reconstruction at 1440: `.rt-section` and reconstruction `html, body` now use `overflow-x: clip`, matching the Wix master page clipping. Verified.
7. P3, original nav hover (`#f3f3f3` on white) and 12px DemiLight notes fall below AA contrast: kept as observed values, documented in DESIGN.md accessibility with recommended alternatives; focus outlines (amber 2px) added locally since the original has none.

No outstanding P0/P1 issue was found in the inspected surfaces.

## Required Fidelity Surfaces

- Typography: 32 observed sizes mapped to 15 token steps; leading 1.4 with the three observed exceptions; Noto Sans KR 300/700/900 + Work Sans 400/600 loaded from Google Fonts; licensed Avenir/DIN Next replaced by declared fallbacks.
- Spacing/layout: header 76 / logo 64 / nav 141×3, 980 text column, hero copy x=117, section heights and inner paddings from the capture, gallery 60/20, clients 150px cells, anchor dots 11/32/60, footer 48. Studio, reconstruction and template pass overflow checks at 1440/768/390/320.
- Colors/tokens: 33 colors including the observed `#f3f3f3` on-black text, `#8a8a8a` secondary, `#eea302` accent, `#ff4040` / `#926402` nav selection, `#282626` secondary button, slider track alpha. Light and dark scopes verified in the studio.
- Motion: six observed entrance keyframes re-implemented with the observed durations, delays, easings and offsets; hover transitions and gallery/slider timing reproduced; page transitions declared; reduced motion verified.
- Components: nav, three button variants, underline/box fields, select, checkbox, range, card, gallery tile, clients grid, anchor dots, scroll hint, CTA strip, footer — hover/current/focus/invalid/loading/disabled states verified in the browser.
- Assets: original logo PNG/GIF/OG, reconstructed SVG mark, 25 client logos, 74 source images, 7 videos, 55 fonts; SHA-256 indexed.
- Document template: cover, header/footer, heading scale, gray+black body, KPIs, table with numeric alignment, cards, callouts, steps, timeline, tags, buttons, signature, print CSS; A4 PDF generated in verification.

## Verification

- `node --test app/tests/*.test.mjs`: 9 passed.
- `node app/scripts/generate-tokens.mjs --check`: JSON and CSS match.
- `node app/scripts/build-library.mjs`: JSX syntax check passed, tarball packed.
- `node scripts/build-source-index.mjs`: 287 files, 0 missing referenced images/videos.
- `node scripts/verify.mjs`: 73 checks passed, zero page errors, zero failed local requests. Evidence: `evidence/verification.json`.

## Intentional Limits

Form submission, email and Wix editor data stay external. The slider is static (two cards) because auto-advance was not observed. Gallery tiles link to the five public YouTube videos the source linked; other tiles are non-interactive images. Videos are 720p renditions. Frame differences in autoplay video are expected; no pixel-equivalence claim is made. Capture tools reference the installed local Playwright path.
