# Motion Source Completion Audit

Date: 2026-09-06
Surface: `#motion` / `motion-library.js`
Server: `http://127.0.0.1:40565`

## Result

Passed after fixes.

The motion library exposes the exact 22 reconstructed demos in `motion-data.json`, keeps the 9 original product MP4s available in the broader design system, and now uses the extracted first-party emoji assets in the Fun carousel instead of SVG stand-ins. Cards now show a short source note so source-confirmed values, CSS/video evidence, and inferred private-app substitutes are easier to tell apart.

## Fixes

- `fun-carousel` now renders `references/assets/emoji-1.png` through `emoji-10.png`.
- Source labels now distinguish `원본 수치`, `원본 에셋`, `CSS 근거`, `토큰 근거`, and `영상 근거 · 추론 대체`.
- Each card includes a visible source note explaining whether the preview is source-confirmed, CSS-backed, token-backed, or an inferred private-app substitute.
- Details are labeled `구현 노트` and link directly to `motion-library.js` and `motion-library.css` without implying the prose note is the full implementation.
- `FamilyMotionLibrary.reveal()` now supports aliases including `footer`, `cta`, `nft`, `nft-media`, `dragdrop`, and `drag-drop`.
- `scripts/verify-motion-v3.cjs` locks exact 22-card coverage, local source assets, original video/poster/storyboard files, label clarity, implementation-note downloads, Fun emoji usage, dialog parity, reduced motion, keyboard reorder, and local resource/runtime errors.

## Evidence Checked

- Public bundle motion values: `references/v2-research/motion-source-report.md`
- Source coverage boundary: `references/v2-source/coverage-source.md`
- First-party emoji assets: `references/assets/emoji-1.png` through `emoji-10.png`
- 69 shape SVGs: `references/v2-source/previews/shape-00.svg` through `shape-68.svg`
- 9 original product videos, posters, and storyboards under `references/v2-source/videos/` and `references/v2-source/previews/`

## Screenshots

- Before desktop: `references/v3-review/motion-before-1440.png`
- Before mobile: `references/v3-review/motion-before-390.png`
- After desktop: `references/v3-review/motion-after-1440.png`
- After Fun source asset card: `references/v3-review/motion-after-fun-1440.png`
- After mobile: `references/v3-review/motion-after-390.png`

## Verification

- `node scripts/verify-motion-v3.cjs http://127.0.0.1:40565` -> passed
- `node scripts/verify-motion-v2.cjs http://127.0.0.1:40565` -> passed
- `node -c motion-library.js; node -c scripts/verify-motion-v3.cjs` -> passed

## Limits

The public marketing site exposes videos, CSS, image assets, inline SVGs, and minified bundle values. It does not expose private app React source, internal native code, server submission behavior, or source maps. Those unavailable states remain implemented as labeled inferred substitutes rather than original source code.
