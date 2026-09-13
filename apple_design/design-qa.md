# Design QA

final result: passed

## Cross-page Expansion

The expanded source library captures 13 public pages in Chrome for Testing 148.
It contains 164 independently rendered SVG assets plus one symbol-definition
library, 298 nonempty CSS shapes, 800 sampled motion rules with 124 complete
keyframes, and 77 observed token values. There are 240 unique indexed source
files across 241 URL/provenance records. This is a source inspection library,
not a claim that all product pages or private application states were cloned.

Final validation after asset normalization:

- `node scripts/verify-research.mjs`: 205 checks, no page errors or missing local requests.
- `node scripts/verify-svg-assets.mjs`: 164/164 SVG images decode and produce nontransparent pixels. One defs-only library remains separately preserved.
- `node scripts/verify-research-visual.mjs`: visible icon decoding, actual SVG clipboard, final desktop/mobile screenshots passed.
- `node scripts/verify.mjs`: baseline 48 checks passed again.
- Component and Sites contract tests: 8 passed again.
- `npm run build`: passed; built manifest includes the repaired SVG assets and code-only archive.

All six expanded routes passed overflow checks at 320, 390, 768 and 1440px.
Motion previews bind complete captured keyframes; fallback timing is labeled and
reduced motion disables animation. Shape previews are paginated inert frames.
Empty shapes and duplicate shape IDs were removed. Source file totals are deduplicated.
SVG namespaces and same-page symbol references were repaired without invented geometry.
Final visual evidence: `evidence/local/research-icons-final-1440.png` and
`evidence/local/research-icons-final-390.png`.

75 bounded interaction attempts produced 61 captured and 14 blocked records.
Blocked states are not marked captured. Six resource retrieval failures were
recovered; no directly referenced source maps were observed. Private account
tabs, internal repositories and unpublished server source remain outside access.
See `docs/cross-page-research.md` and `evidence/research-verification.json`.

## Scope and Evidence

Source: Apple US homepage, captured 2026-09-06 KST. Public DOM, CSS, JavaScript, menu JSON, fonts and media are archived. Internal source and server behavior are outside scope.

- Source visual truth: `evidence/source/desktop-clean.png`, `evidence/source/mobile-clean.png`.
- Implementation: `evidence/local/home-desktop.png`, `evidence/local/home-mobile.png`.
- Combined comparison inputs: `evidence/local/comparison-desktop.png`, `evidence/local/comparison-mobile.png`.
- Full-page evidence: `evidence/local/home-desktop-full.png`, `evidence/local/home-mobile-full.png`.
- Focused states: `evidence/local/home-menu.png`, `home-search.png`, `home-bag.png`, `home-mobile-menu.png`.
- Studio: `evidence/local/studio-desktop.png`, per-route `*-1440.png` and `*-390.png`.

Desktop CSS viewport/pixel dimensions: 1440x1000. Mobile: 390x844. Device scale factor: 1. Combined images use equal-height previews of the same-density captures; original files preserve full resolution. Locale banner dismissed on the source. Initial closed-navigation states are compared. The back-to-school video frame can differ with playback timing.

## Findings and Corrections

1. P1, initial local homepage used fallback fonts: corrected the font stylesheet path and retained locally available SF Pro Display/Text faces. Post-fix combined captures match headline wrapping, hierarchy and button geometry.
2. P1, menu flyout data was absent from initial HTML: captured the public flyout/default-search JSON and routed those requests locally. Desktop hover/keyboard, search opening and mobile menu now pass browser checks.
3. P1, dynamically imported motion modules were absent: recursively captured ESM dependencies using a JavaScript parser. Responsive WebM media are local; desktop/mobile videos reach readyState 4.
4. P2, transition timers could race when moving from menu to search: clear stale hover timers on pointer movement and Escape. The final menu/search workflow passes.
5. P2, the toggle input was not a usable pointer target: positioned the native checkbox over its switch. Disabled state and reduced-motion switch pass.
6. P2, component keyboard/visibility behavior: Astra-designated executor fixed segmented selection/focus, disabled link activation and hidden-tab autoplay. Four targeted contract tests pass.

No outstanding P0/P1/P2 issue was found in the inspected surfaces.

## Required Fidelity Surfaces

- Typography: original SF Pro fonts available locally; desktop/mobile first-screen wrapping compared. Authored reusable tokens use zero tracking; archived source keeps original tracking.
- Spacing/layout: source header, hero bands, section gaps and image crops retained; four studio widths 320/390/768/1440 tested without horizontal overflow. Navigation has an independent 833/834px boundary; products use 734/1068px.
- Colors/tokens: source foreground/background/action colors exposed as CSS and JSON tokens. Light and dark examples checked.
- Assets: actual product media, source SVG marks and fonts, not screenshot-based UI. Responsive video readiness and no broken images checked after full-page scrolling.
- Content: homepage copy and product links come from the captured source. Design-system studio is an intentionally new inspection surface, not an Apple production page.

## Verification

- `node scripts/verify.mjs`: 48 checks passed, zero page errors, zero failed local requests. Evidence: `evidence/verification.json`.
- `node scripts/verify-homepage.mjs`: desktop/mobile full-page overflow and image checks, video readiness, gallery selection, mobile footer expansion; zero page errors. Evidence: `evidence/homepage-verification.json`.
- `node --test tests/components-contract.test.mjs tests/sites-worker.test.mjs`: 8 passed.
- `npm run build`: passed using read/write fallback for the WSL drive's copyFile restrictions.
- Motion curve canvas checked for nonblank pixels; reduced-motion preview checked for zero-duration animations.

## Intentional Limits

Commerce, account and product-detail destinations stay external. Bag is a local empty-state preview; no real account session is reproduced. Tracking-only execution is excluded while its source remains archived. Some unused font variants are unavailable and recorded in the manifest. Animation-frame differences are expected; no exhaustive pixel-equivalence claim is made. Capture tools currently reference the installed local Playwright path.
