# Design QA

## Comparison target

- Source visual truth:
  - `/var/folders/72/w_z25p4x67j6bz_72b8jdkk00000gn/T/codex-clipboard-E5okzK.png` — product registry request, 3106×1262px.
  - `/var/folders/72/w_z25p4x67j6bz_72b8jdkk00000gn/T/codex-clipboard-pbwVoy.png` — interaction contract request, 3082×1490px.
  - `/var/folders/72/w_z25p4x67j6bz_72b8jdkk00000gn/T/codex-clipboard-RFMKlR.png` — service map request, 3102×1060px.
  - `/private/tmp/google-design-audit/03-components-before.png` — duplicated component demos before correction, 1440×1000px.
  - `/var/folders/72/w_z25p4x67j6bz_72b8jdkk00000gn/T/codex-clipboard-LgNs0w.png` — final registry error report, 2282×1396px.
- Rendered implementation:
  - `/private/tmp/google-design-audit/05-assets-after.png`.
  - `/private/tmp/google-design-audit/06-interactions-after.png`.
  - `/private/tmp/google-design-audit/07-components-after.png`.
  - `/private/tmp/google-design-audit/08-overview-after.png`.
  - `/private/tmp/google-design-final-audit/03-registry-desktop-final.png`.
  - `/private/tmp/google-design-final-audit/04-registry-mobile-final.png`.
- CSS viewport: 2048×1227px desktop, 768×1024px tablet, and 390×844px mobile.
- Device scale factor: 1.
- State: light theme; default contract states plus exercised hover, focus, press, selection, expanded, snackbar, dialog, and dropped states.

## Normalization and comparison evidence

The supplied screenshots are focused content regions rather than full browser frames. Each source and implementation capture was normalized to 1000px height and placed in one side-by-side comparison input:

- `/private/tmp/google-design-audit/11-assets-comparison.png`
- `/private/tmp/google-design-audit/12-interactions-comparison.png`
- `/private/tmp/google-design-audit/13-service-map-comparison.png`
- `/private/tmp/google-design-audit/14-components-before-after.png`
- `/private/tmp/google-design-final-audit/05-registry-comparison.png`

These focused regions are sufficient because the requested changes are confined to the registry, contract cards, component demos, and service map. No additional full-page comparison is needed.

## Required fidelity surfaces

- Fonts and typography: existing Google Sans/Roboto hierarchy, weights, wrapping, and line heights are preserved.
- Spacing and layout rhythm: the 12-column grid is preserved; registry cards now use a stable 220px desktop height, 20px padding, separated 40px actions, and a compact mobile layout without overflow.
- Colors and visual tokens: CSS product-mark approximations were removed. All nine representative symbols load their exact official-hosted pixels; Material tokens continue to style surrounding UI only.
- Image quality and asset fidelity: nine of nine product images completed with non-zero natural dimensions. Gmail and Meet explicitly record a 40×40 display crop, square icons never exceed a 52×52 optical box, and Finance uses a white canvas so its source background does not appear nested. No copied brand image is stored in public assets.
- Copy and content: internal status/category/policy codes remain in JSON but are no longer exposed as UI copy. The registry now shows readable Korean labels, distinct source/display sizes, and separate `제품 페이지` / `사용 정책` actions.

## Comparison history

### Iteration 1

- P1: Product cards used CSS palette marks plus generic icons instead of the requested real symbols.
- P1: Interaction contracts were static and duplicated by a separate six-sample playground.
- P1: Navigation and button component cards repeated identical demo markup.
- P2: Drag/drop said it was not executed; Calendar grid demo did not match its documented anatomy.

Fixes:

- Replaced palette art with official-hosted reference-only images for nine products, including the official Google Finance app icon.
- Merged explanation and sample into eight contract cards; added drag/drop with click fallback.
- Added component-specific top bar, drawer, rail, tabs, button, and detailed Calendar grid demos plus family/variant metadata.

### Iteration 2

- P2: Gmail lockup crop exposed a small part of the following wordmark.

Fix:

- Reduced the leading-symbol crop frame from 48px to 40px while keeping the source image unchanged.

Post-fix evidence:

- Desktop comparisons 11–14 show the requested content in place.
- Mobile captures 09–10 show zero horizontal overflow.
- Browser runtime reports 9/9 images loaded, 8/8 contract samples present, 19/19 component demos unique, duplicate DOM IDs 0, and console errors 0.

### Iteration 3

- P1: Registry cards exposed internal codes such as `official-observed-reference`, `general-brand-guidance`, and `ask-first` as user-facing copy.
- P2: `official product source` and `policy` links visually ran together.
- P2: lockup source dimensions were presented beside a clipped symbol without distinguishing source size from display size.
- P2: Calendar and Finance rendered larger than the other product symbols, while the Finance source's white square appeared inside a tinted square.

Fixes:

- Localized status, category, policy, and count copy while preserving raw source codes in JSON.
- Replaced the joined text links with separate 40px `제품 페이지` and `사용 정책` actions.
- Removed the redundant raw-image link so each card contributes only the two named actions to keyboard navigation.
- Added explicit source and display geometry to every representative image record.
- Normalized square icons to a maximum 52×52 optical box and gave Finance a white canvas.

Post-fix evidence:

- `/private/tmp/google-design-final-audit/05-registry-comparison.png` shows the reported state and corrected registry together.
- Desktop, tablet, and mobile runtime checks report 9 cards, exactly 18 labeled links, two actions per card, all images loaded, raw visible codes false, duplicate IDs 0, horizontal overflow 0, and console errors 0.

## Findings

No actionable P0, P1, or P2 differences remain within the requested surfaces.

## Follow-up polish

No blocking polish remains. External product images require network access by design and retain their `reference-only` label.

final result: passed
