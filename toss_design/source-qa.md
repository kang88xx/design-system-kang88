# Source library verification — 2026-09-07

## Completed checks

- Original regression: `node scripts/test-live-catalog.mjs` passes. Existing SVG/shape classification evidence is preserved.
- Data integrity: `node scripts/test-source-library.mjs` passes for 1,558 unique entries, nine categories, both capture viewports, source/code/evidence fields, SVG IDs and local preview files.
- Every one of 477 archived files matches its recorded byte length and SHA-256. Manifest retains 25 remote references and one failed response.
- Figma generator validates four collections, 551 variables and five Tokens Studio sets (137 curated + 414 observed).
- Browser: `node scripts/test-system.mjs` passes at 1440×1000, 768×1024 and 390×844. Tested all nine categories, no horizontal overflow, global-category search, no-results/reset, provenance filter, pagination, arrow/Home keyboard focus, dialog opening/close/Escape/focus restoration, clipboard exact content, code-file exact content and filtered JSON.
- Recreated motion: scrub, sheet confirmation, accordion state, loading success, runtime reduced-motion change, interrupted progress returning to an enabled action.
- Original motion: three frame groups, 15 video references, decoded manual frame changes and responsive layout. Separate player smoke verifies frame play/pause, speed options, reduced-motion pause and no automatic video requests before explicit play. MP4 requests returned HTTP 206 but this Chromium reported MEDIA_ERR_SRC_NOT_SUPPORTED (code 4); poster/source-link/error recovery is verified, successful remote MP4 decoding is not claimed.
- Source-network outage: blocking HTTPS still leaves local source images available. The globe uses its archived binary/background.
- All exported inline SVG strings parse as valid SVG XML. Raster image/pattern and filter definitions survive the safe preview renderer.

## Fixes from verification

- Added missing xlink namespace and preserved safe SVG image/filter/pattern primitives.
- Removed failed asset from standalone image entries; dependent background entries display source status.
- Linked copied media code to the local archive and explicitly marked unresolved dynamic CSS variables and required source selectors.
- Fixed category keyboard focus after rerender, dialog close button action/stacking, copy status within modal, and video pause on close.
- Recovered progress buttons when animation is interrupted by visibility/reduced-motion changes.
- Reduced mobile header/filter/metadata density after reviewing screenshots.

## Evidence

`evidence/source/` contains current public source captures; `evidence/qa/` contains overview, source explorer, detail, original motion and reconstructed motion screenshots plus `results.json`. `.omx/state/source-library/ralph-progress.json` records qualitative visual iteration (final score 93). This is not a pixel-match claim against the homepage: the library is a different product surface using the observed visual language.

## Limits

Chromium headless was used. Safari, Firefox, physical devices and a full WCAG audit were not run. Network video playback depends on the source server. Some copied CSS requires the original selectors/dynamic tokens and is explicitly labeled. The public snapshot does not cover private source or every temporal interaction state.

- Final motion-player fixes: await image decode before screenshot, visible loading state, source hero/poster default, stale media-error reset, explicit video play, compact responsive section spacing.
