# Reatic design system, reconstruction and document template

Completed: 2026-09-13 (Asia/Seoul)
Workspace: /mnt/j/02_Source/reatic_design (J:\02_Source\reatic_design)

## Use

- Studio: `node scripts/serve.mjs 4180 .` → http://127.0.0.1:4180/app/
- Reconstruction: http://127.0.0.1:4180/app/public/reconstruction/home.html (about, portfolio, contact)
- Document system (single file, A4 print): templates/reatic-document.html
- React package: app/public/reatic-design-system-0.1.0.tgz · guide docs/project-integration.md
- Motion presets: app/src/system/motion.css · guide docs/motion-usage.md
- Tokens: app/src/system/tokens.json → tokens.css (studio **Export tokens.css**)
- Evidence index: evidence/source-index.json · evidence/completeness.json

## Delivered

4 public pages captured at 1440×900 and 390×844 (Wix mobile canvas 320): 5 HTML documents, computed styles, a second component-measurement pass, a static declaration inventory, 67 screenshots, 74 images, 55 web fonts and 7 background videos (720p). 287 indexed files, 103.4 MB, SHA-256 per file, 0 missing referenced images or videos.

Tokens: 33 colors, 5 font stacks, 15 type steps, 29 layout values, 18 section heights, 4 radii, 9 button dimensions, 26 motion values, 3 shadows, plus a dark scope. Corrections from the second pass are folded in: gallery gap 20 (not 25), gallery gutter 60 and tile 651×366, client cell 150, anchor dots 11px/32px at right 60, hero copy x=117, section inner padding 115/96 · 189/228 · 312/246, mobile nav 22px with selected #926402, slider track 702×2 rgba(243,243,243,.11) with 22px thumb, underline focus `0 2px 0 0 #f3f3f3`, gallery container `0.8s cubic-bezier(.13,.78,.53,.92)`.

System: components.css (14 components with hover/current/focus/invalid/loading/disabled and 750/1000px rules), motion.css (6 observed entrances as 19 presets, page transitions, reduced motion), components.jsx + index.d.ts (React 19, refs, native form props), library tarball. Studio with token copy/export, light/dark, motion replay with reduce-motion toggle, component state demos, source browser. Four reconstruction pages built only from the system and local media. Document template with 30 `doc-` patterns and print CSS.

## Verification

9 Node tests (tokens, component contract), token JSON/CSS sync check, esbuild JSX syntax check, and 73 browser checks in `scripts/verify.mjs`: studio overflow at 1440/768/390/320 across 9 routes, clipboard copy, tokens.css download, theme toggle, motion replay and reduced-motion, CTA hover → #f3f3f3, selected nav #ff4040, underline focus line, disabled/loading states, four reconstruction pages (overflow at 1440/390, no broken images, videos readyState ≥ 2, entrances ran), contact validation and success, document template render, print stylesheet, A4 PDF and 390 overflow. Zero page errors, zero failed local requests. Evidence: `evidence/verification.json`, `evidence/local/*.png`, `evidence/local/document-template.pdf`.

Package SHA-256: 268d7f8aed41b8595753558179b225e07f9c7292107e29c5597065f8f28ae6b5

## Limits

Wix runtime bundles, form backend and editor data are not captured. Slider auto-advance timing was not observed (static). Seven of 32 client logos are not 1080² PNGs and are kept only in `source/images`. Licensed fonts (Avenir, DIN Next, Helvetica W01, Proxima Nova) are archived but not redistributed; Google Fonts fallbacks are declared. The reconstruction is a schematic, token-faithful rebuild, not a pixel clone. Playwright is resolved from the current machine's installs; set `PLAYWRIGHT_MODULE` elsewhere.
