# Live evidence: three-circles-wbs.framer.website

Captured 2026-09-14 with Playwright (gstack bundle, Chromium 1234), `load` plus 2.5 s settling and a full scroll pass to trigger lazy images and appear animations. The page returned HTTP 200 and resolved to the same URL at all three viewports. No console or page errors were recorded.

## Evidence files

- `live-desktop.png` — 1440×1000 viewport, full page (page height 8,734 px). `live-desktop-first-view.png` is the first viewport only; `live-desktop-scrolled.png` is the viewport at 2,500 px scroll (sidebar stays fixed).
- `live-tablet.png` — 900×1000 viewport (page height 7,884 px). `live-mobile.png` — 390×844 viewport (page height 9,382 px), with `*-first-view.png` companions.
- `section-*.png` — element screenshots of the eight `id`-addressed sections; `section-results.png` and `section-footer.png` are crops of the full-page capture.
- `live-desktop.json`, `live-tablet.json`, `live-mobile.json` — computed-style frequency tables, 400 text samples with geometry, section boxes, links, images, media requests, font faces, running animations, Framer CSS variables.
- `live-components.json` — hover probes (rest vs hover computed styles), form fields, sidebar geometry, fixed/sticky elements. `live-boxes.json` — every element with a fill, border or shadow. `live-details.json` — nav card DOM, ticker, hero art, appear animation frame samples and the Framer appear manifest. `live-interactions.json` — first hover pass and section boxes. `hover-*.png` — clipped hover captures.
- `live-source.html` — the served HTML (827 KB) including Framer token declarations, font faces and the `__framer__breakpoints` / `__framer__appearAnimationsContent` scripts.
- `assets/` + `assets-manifest.json` — 48 downloaded files (logo, icons, client logos, hero circle photos, decoration, sample photos) with source URL, size and SHA-256.

## Exact observations

The page is a one-page Framer template ("three circles", Webestica). At 1440 px the layout is a 400 px sticky sidebar (`position: sticky; top: 0`, full viewport height, 20 px padding around a 360×960 orange panel) and a 980 px content column starting at x = 420 with a 40 px right margin. At 900 px the content column is 580 px wide; at 390 px it is 370 px with a 72 px orange top bar and a hamburger button. Framer declares three breakpoints: `(min-width: 1200px)`, `(min-width: 810px) and (max-width: 1199.98px)`, `(max-width: 809.98px)`.

Rendered text uses two families only: `Bricolage Grotesque` (74 sampled nodes; weights 400/500/600/700 loaded from fonts.gstatic.com) for every heading, number and card title, and `Be Vietnam Pro` (94 nodes; weights 400/500/600 loaded from Fontshare via framerusercontent) for body, labels, chips and buttons. `Geist 700` appears only in the Framer badge and `Inter`/`Anonymous Pro` are declared but not used for visible text (Anonymous Pro is the footer input's code font). Nearly every text style sets `text-transform: lowercase` and `letter-spacing: 0em`; line-height is `1.2em` for body, `1.1em` for headings and `0.8em` for the hero.

Font sizes at desktop: hero 150 px/120 px 700 (tablet 90/72, mobile 74/59.2); section titles 50/55 700 (tablet 42, mobile 32); statement 44/48.4 700 (tablet 38, mobile 26); card titles 26/28.6 500; item titles 22/26.4 500; eyebrow 20/24 400 in orange; list titles 18/21.6 600; nav labels 18/21.6 600; body 16/19.2; small 14/16.8 (mobile 13); nav numbers 10/11 600.

Sixteen Framer color tokens are declared. The cream page `#FFFDEA`, muted surface `#FFF5D4`, accent yellow `#FFE479`, orange `#F06231`, ink `#1C1B18`, taupe text `#675E50`, stone border `#B7B0A5`, blockquote sand `#FBEFC7`, envelope peach `#FFDDAA`, white, black, a 10 % white, a 70 % ink scrim, transparent, and two tokens (`#C5E7FF` sky, `#BCF09C` lime) that were not observed on rendered desktop surfaces. The availability dot `rgb(103,185,53)` is a computed value without a token. Text colors by frequency: ink (96 nodes), taupe (53), cream (7, on dark surfaces), orange (4), white (4), vanilla (3), stone (1, footer meta).

Shape: 125 elements use a 6 px radius (cards, buttons, sidebar, footer, images), 45 use 2 px (chips and labels), 14 use 50 % (circle images, number badges), and a few use 100 px / 10000 px pills. Borders are `1px dashed #B7B0A5` on 140 elements (84 full boxes, 27 bottom-only dividers, 3 top-only) and one dark `1px dashed #1C1B18`. No component uses a box shadow; the only shadows belong to the Framer badge.

Interaction evidence: text links declare `color 0.3s cubic-bezier(0.44,0,0.56,1)`; surfaces declare `background 0.45s, box-shadow 0.45s` with the same easing; inputs declare `all 0.45s` on focus. Primary buttons contain a `Hover BG` child that goes from `matrix(0,0,0,0,-25,-25)` to `matrix(8,0,0,8,…)` (a 50 px circle scaled 8× to 400 px) while the label turns from vanilla to ink. Project rows expand a 1 px-wide thumbnail wrap to 90 px on hover and shrink the title column from 464 to 365 px. The "view all projects" image stack rotates its side cards from ±12° to 0°. Blog titles turn orange on hover. The hero's `Content Left` block has a Framer appear animation: opacity 0.001 → 1 and y 30 → 0 with a spring (stiffness 80, damping 30, mass 1, delay 0.05 s); sampled frames reach 95 % after about 1.2 s. The testimonial title is `position: sticky` (500 px wide) while four cards scroll over it. The client ticker (14 SVG logos, 38 px tall) is JS-driven; no CSS animation was exposed. Nav cards contain a hidden `Bottom` block (88–119 px) that a Framer hover variant reveals; the headless hover probe did not trigger it, so its timing is unverified.

The contact form has four real fields (Name, Email, Subject required; Message optional) rendered as dashed underlines with transparent backgrounds, plus hidden honeypot inputs. The footer email field uses a 10 % white background, a 1 px taupe border and a 6 px radius.

The page embeds no video. Images are served as AVIF/SVG from framerusercontent.com; 81 `img` elements were counted, including 14 client logos, 4 hero circle PNGs, 21 service thumbnails, 6 project images and 4 social icons.

## Effects audit (second pass, 2026-09-14)

`live-effects.json`, `live-effects-2.json`, `live-nav-cards.json` and the `nav-scroll-*.png`, `hover-*.png`, `mobile-menu-*.png` captures come from a second pass that re-tested every interactive surface with real pointer movement, timed sampling and scroll positions. Corrections to the first pass:

- **Sidebar nav cards expand on scroll, not on hover.** When a section is in view its card grows from 42 px to 150 px (projects, about), 181 px (services) or 169 px (contact) and reveals a hidden `Bottom` block; the anchor carries `data-highlight="true"`. Pointer hover alone never changes the height. The projects card does respond to hover: its four 48–55 px thumbnails re-fan (outer pair ±30° → 0°, inner pair 0° → ±30°, translateX ±30 → 0) over roughly 650 ms.
- **Client ticker speed is 40 px/s** with the pointer away and drops to 4 px/s while hovered. The `ul` has `cursor: ew-resize` (draggable), 14 items, `gap: 60px`, track width 2,376 px, so one loop takes about 59 s.
- **Featured project card**: hover scales the image to 1.05 inside the clipped 980×628 frame and turns the caption from taupe to ink. Its bottom 220 px carries a progressive blur: eight absolutely positioned 1100×220 layers with `backdrop-filter: blur()` doubling from 0.78 px to 100 px, each masked by a stepped `linear-gradient` band.
- **Project rows** also switch their meta text from taupe to ink on hover (in addition to the 1 → 90 px thumbnail reveal).
- **Availability dot** pulses: two green rings (24 px and 30 px) animate opacity 0.5 → 0 over 2,050 ms with a `linear()` spring curve, infinite.
- **Footer text links** turn from cream to flame on hover (300 ms); sidebar and footer social icons drop to opacity 0.7.
- **Mobile menu**: the 32×32 cream button holds two 20×2 taupe lines that rotate ±45° into an X; the ink-70 overlay fades in over about 450 ms; the panel (370×324, padding 10, radius 6) lays the four cards out as 172×28 "Default - Phone" variants (padding 4 12, radius 2, 16/600 label, 20 px badge) in two columns.
- No scroll-linked transforms, parallax, custom cursor or inline SVG were found. The only SVG masks belong to the Framer badge.
- The four PNGs previously labelled "hero-circle" are the projects nav card image fan; the hero letter photo is `Y1rpbPtKnTjQTLhSQ5SACNd6MM.jpg`. All 77 referenced images (including 12 service thumbnails, 6 project images, 7 avatars, 3 blog images, the results background and 2 head icons) are now in `assets/` with roles in `assets-manifest.json`.
