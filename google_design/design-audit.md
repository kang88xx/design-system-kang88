# Design Audit — Product Symbols, Interaction Samples, Component Duplicates

Date: 2026-09-01

## Overall verdict

The three requested surfaces had real gaps: representative product imagery was replaced by CSS palette approximations and generic Material Symbols, interaction contracts were separated from a duplicated six-card playground, and multiple component cards reused the same navigation or button demo. All three issues are fixed in the generated viewer.

## Steps and health

1. **Official product source registry — healthy**
   - Before: text-only registry in the first supplied screenshot; the first implementation used palette-based CSS approximations. The later error report exposed internal codes, joined links, ambiguous dimensions, and uneven image canvases.
   - After: nine official-hosted images render with localized meaning, separate source/display sizes, normalized optical sizing, and distinct product/policy actions.
   - Evidence: `/private/tmp/google-design-final-audit/05-registry-comparison.png`.

2. **Interaction contracts — healthy**
   - Before: eight static contracts plus a separate six-sample playground repeated the same concepts and left hover, focus, press, and drag/drop without executable contract-level samples.
   - After: each of the eight contracts owns exactly one working sample in the same card. Pointer, keyboard, dialog, feedback, and drag/drop click fallback were exercised in-browser.
   - Evidence: `/private/tmp/google-design-audit/12-interactions-comparison.png`.

3. **Component catalog — healthy**
   - Before: top app bar, drawer, rail, and tabs rendered the same three-chip preview; button variants also reused a shared mixed demo.
   - After: all 19 component IDs and all 19 rendered demos are unique. Related entries expose `family` and `variant` instead of appearing as unexplained duplicates.
   - Evidence: `/private/tmp/google-design-audit/14-components-before-after.png`.

4. **Service map — healthy**
   - Before: generic monochrome Material Symbols represented each product.
   - After: Gmail, Calendar, Drive, Meet, and Finance use the same official-hosted representative source as the registry.
   - Evidence: `/private/tmp/google-design-audit/13-service-map-comparison.png`.

## Accessibility and responsive checks

- Every representative image has product-specific alternative text.
- Interactive samples expose visible output and relevant `aria-current`, `aria-expanded`, `aria-pressed`, `aria-live`, or native dialog behavior.
- All four modified sections have zero horizontal overflow at 390px.
- The final registry also has zero horizontal overflow at 768px and 2048px; all nine images loaded, duplicate IDs are 0, and every card exposes exactly two labeled actions without a redundant image link.
- Screenshot inspection cannot prove full WCAG compliance; runtime keyboard and state checks cover the changed controls only.
