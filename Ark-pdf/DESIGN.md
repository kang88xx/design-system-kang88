# Design

## Source of truth
Status: Active. Date: 2026-09-07. Surfaces: proposal slides, printable A4 documents, local design-system library. Primary evidence: `ARK_Company Introduction .pdf`, 52 pages, 1920 × 1080 PDF units. All 52 page previews reviewed; machine-extracted provenance lives in `data/source-manifest.json`. Original observations and proposed extensions must be labeled separately. Existing HTML/CSS snapshots are preserved in `.omx/artifacts/baseline/`.

## Brand
Precise, spacious, architectural, confident. Trust comes from consistent alignment, measured figures with sources, original project photography, and a restrained palette. Avoid gratuitous gold accents, invented logos, generic gradients on every surface, excessive rounded cards, and mixing mascot/outline/filled icon families.

## Product goals
Let proposal writers find an original asset, verify its source, download it, choose an editable layout, and create a new subject in an established visual family. Success: all 52 pages inventoried, extractable images/fonts/geometry preserved, usable templates and tokens, working search/download/copy/prompt interactions. The library does not run an AI generation API. Historical company/market text is evidence, not current verified business information.

## Personas and jobs
Proposal writer: assemble a coherent deck quickly. Designer: inspect geometry, typography, and source provenance. AI-assisted creator: preserve style while changing subject. Reviewer: separate source facts from design extensions.

## Information architecture
Overview → foundations → asset library → layouts → components → prompt studio → source pages → downloads. Hash routes in a dependency-free local HTML application. Extracted archive, reusable assets, tokens, prompts, and templates are also directly usable without the application.

## Design principles
1. Source first: every derived component has page references.
2. Preserve originals: full-page outlined SVG and raw geometry complement curated crops.
3. Change meaning, preserve grammar: new icon subjects keep family geometry and optical weight.
4. Document composition before decoration: margins, hierarchy, tables and footers carry consistency.
5. Explicit provenance: original extraction, source-derived reconstruction, and new extension are distinct.

## Visual language
Observed fills: cobalt `#011187` (p4/7/10), deep navy `#061A58` (p5), icon navy `#091955`, paper `#F4F4F8` (p15/26), ink `#1A2646`, steel `#516086`. `#EEC12B` occurs in p9 text; yellow belongs mainly to mascot details, not a universal emphasis rule. PDF text uses Gotham Book/Medium/Light, also Bold/Black/Thin and small amounts of Helvetica/PingFang. Existing Pretendard/Geist labels were web choices, not extracted fonts. PDF font subsets are archival, not complete installable licensed web fonts. Application and new templates use local system Korean/sans-serif fallbacks.

Observed canvas 1920 × 1080 (16:9); raw coordinates are PDF units, not 1920 physical pixels or slide points. Common text sizes: 16/25/49/85/130 and 400 for divider numerals. Proposed accessible template body minimum 24 source units; A4 body 10–11 pt. New spacing scale 4/8/12/16/24/32/48/64/96 is a normalization, not a verbatim source scale. Main margins follow the ~48–60 source-unit rail. Five graphic families: blue-gradient outline utility icons (p15/26), filled quality symbols (p29), yellow mascot (p9), architectural wireframe (p5); soft volumetric chart shapes (p14) are a separate visualization family. The normalized icon gradient `#5C66D4 → #2733A1 → #051565` at 135° is sampled, not recovered PDF gradient metadata. Monochrome `#091955` icons are explicitly print extensions.

## Components
Document: cover, contents, divider, statement, metric block, comparison table, process, case study, gallery, closing, and A4 proposal. Source gallery: cards, category filter, text search, preview dialog, format downloads. Authoring: prompt builder with family/subject/context/output variables and explicit constraints. Canonical tokens in `tokens.json` and `tokens.css`. Observed and extension values have provenance metadata.

## Accessibility
Library targets WCAG 2.2 AA as an implementation objective, not certification. Native buttons/links/labels/dialog, visible keyboard focus, Escape and focus restoration, status live region, text alternatives, keyboard filtering. Dark navy on paper/white for body copy; pale PDF labels are archival only and should be darkened in new small text. No color-only meaning; motion obeys reduced-motion. Charts require labels and source captions.

## Responsive behavior
Desktop: 236px side navigation, flexible workspace. Below 1000px compact navigation; below 720px horizontal nav and single-column panels. Slide previews preserve 16:9; source assets use contain fitting. Tables scroll locally rather than expanding the viewport. Print documents have independent A4/slide page rules.

## Interaction states
Asset loading uses native image lazy loading. Empty searches show reset instructions. Clipboard failure exposes selectable text and an error message. Missing source-data script shows a recovery message. Dialogs close with Escape. Downloads are local files; no account or network-dependent generation is required.

## Content voice
Korean instructions with concise English family/technical labels. Explain observed vs proposed. Never imply prompt composition is AI execution. New sample figures and proposal claims are labeled examples and must be replaced before real use.

## Implementation constraints
Plain HTML/CSS/JavaScript, no build step and no runtime dependency. Avoid fetch so opening `index.html` directly works. Python tooling is only for reproducible extraction/packaging. SVG page exports outline text for visual preservation; semantic text and fonts are separate. Curated crops may retain original background. Extracted third-party logos remain reference assets; they are not a newly granted logo license.

## Open questions
- [ ] Preferred commercial production font; owner: document designer. Affects exact live-text matching, not outlined original SVG.
- [ ] Organization-specific proposal content and brand naming; owner: proposal author. Templates deliberately contain editable example copy.
- [ ] Full source Keynote/PPT assets are unavailable; owner: source owner. PDF extraction cannot restore native authoring groups or unavailable hidden objects.

## Studio shell
The library viewer (`index.html`) uses the shared Apple studio shell specification in `../All/shell/SPEC.md`. `studio-shell.css` and `studio-shell.js` are verbatim copies of that shell (fixed 232px sidebar, 65px sticky topbar with `Design system / {page}` breadcrumb and Export tokens, `.as-workspace` content column, off-canvas navigation below 640px); they are the skeleton and are not edited here.
`studio-brand.css` maps ARK tokens onto the shell variables (`--as-accent` cobalt `#011187`, `--as-ink` `#1A2646`, `--as-sidebar-bg` `#F5F5F2`, `--font-sans`/`--font-mono`, square `--as-radius: 0`) and neutralizes only the old viewer-shell rules that conflict with the new skeleton. Load order is `studio-shell.css` → `tokens.css` → `ark-system.css` → `studio-brand.css`.
Shell classes are additive: existing ids, `data-route`, `.panel`, search, filter, copy, download and dialog behaviour in `app.js` are unchanged, and every original label, count, link and asset remains in place.
