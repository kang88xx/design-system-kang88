# Design QA: Light catalog shell redesign

## Comparison target

- Source visual truth: `evidence/44-catalog-shell-reference.png`
- Rendered implementation: `evidence/45-catalog-shell-light-final.png`
- Side-by-side comparison: `evidence/46-catalog-shell-qa-comparison.png`
- Viewport: 1551×799 CSS px, device scale factor 1
- State: Live source catalog, Icons tab selected, desktop sidebar visible
- Intentional difference: reference uses a dark theme; the requested implementation uses a light background while preserving the same shell hierarchy.

## Normalization

- Source: 3102×1598px at 2× density, normalized to 1551×799px.
- Implementation: 1551×799px browser capture at 1× density.
- Both show the fixed topbar, left navigation, main heading, section controls, and four-column card grid.

## Evidence

- Full shell comparison: `evidence/46-catalog-shell-qa-comparison.png`
- Preserved overview imagery: `evidence/47-catalog-shell-overview.png`
- Preserved rotating earth interaction: `evidence/48-catalog-shell-earth.png`
- Responsive mobile navigation: `evidence/49-catalog-shell-mobile-menu.png`

## Required fidelity surfaces

- Fonts and typography: Toss Product Sans remains active. The main catalog title is 65px on the target desktop viewport, with compact sidebar labels and count pills matching the reference hierarchy.
- Spacing and layout rhythm: 72px fixed topbar, 280px fixed sidebar, centered search field, 24px shell gutters, and four-column content cards reproduce the reference structure.
- Colors and visual tokens: shell background is intentionally light `#f7f8fa`; navigation and cards use white surfaces, grey borders, dark active states, and existing Toss semantic colors.
- Image quality and asset fidelity: all ten existing images, two canvas surfaces, live source SVGs, remote Toss assets, and earth binary remain in place. No existing asset was removed or replaced.
- Copy and content: all existing Toss study copy and live catalog data remain. New shell copy is limited to navigation and search labels.

## Interaction verification

- Top search routes category terms to Icons, Buttons, Shapes, Gradients, or Backgrounds and synchronizes the catalog search.
- Sidebar highlights the current section and preserves smooth anchor navigation.
- Mobile hides the sidebar and exposes every section through the existing menu drawer.
- Existing catalog tabs/search, content chips, keyboard tabs, switch, transfer loading/success, earth motion, page rail, and reduced-motion behavior remain functional.
- Browser console: no errors.
- Desktop and 390px mobile: no horizontal overflow.

## Findings and iteration history

### Iteration 1

- [P2] The source button expanded across the remaining header track.
- Fix: constrained it to intrinsic width and right-aligned it.

- [P2] Direct `#live-catalog` navigation left source-audit rows above the heading and made the catalog title feel smaller than the reference.
- Fix: realigned the catalog after data rendering and increased the desktop title to a responsive 48–76px scale.

### Final pass

- No actionable P0, P1, or P2 difference remains.
- P3: the implementation retains the compact page rail beside the content because the user explicitly asked to preserve existing interactions; the reference shell does not include it.
- P3: main card content differs because existing Toss images, SVGs, gradients, and interactions were preserved rather than replaced with the reference Montage shapes.

## Implementation checklist

- [x] Light fixed topbar with global search and source link
- [x] Light fixed library sidebar with counts and active state
- [x] Responsive mobile drawer
- [x] Light main surface and card sections
- [x] Existing images and all interactions retained
- [x] Browser, mobile, and interaction verification

final result: passed
