# Research: Google product observation catalog expansion

### Request Type

Current best-practice research and implementation-reference lookup. This is a
source-backed expansion brief for the Gmail, Calendar, Drive, Meet, and Finance
catalog; it is **not** an authenticated-product observation report.

### Direct Answer

Use a two-lane evidence model in the catalog:

1. `observed-product` is reserved for measurements already collected from a
   named product shell and viewport.
2. `official-reconstruction` is for the reusable Material values below. It can
   guide a faithful independent implementation, but must never be presented as
   a value observed in Gmail, Calendar, Drive, Meet, or Finance.

For every entry, include `sourceKind`, `sourceUrl`, `retrievedAt`, and
`confidence`. Keep gradients in a third lane: `reference-only` for a product
asset, or `original-reconstruction` for a newly drawn neutral illustration.
There is no general Material system-gradient token in the official sources
reviewed here.

### Recommended Concrete Catalog Expansion

| Catalog area | Add | Values / contract | Evidence label |
| --- | --- | --- | --- |
| `motion.system` | Full duration scale | `short1..4`: 50, 100, 150, 200ms; `medium1..4`: 250, 300, 350, 400ms; `long1..4`: 450, 500, 550, 600ms; `extraLong1..4`: 700, 800, 900, 1000ms | `official-reconstruction` |
| `motion.system` | Easing roles | `standard` `.2,0,0,1`; `standardAccelerate` `.3,0,1,1`; `standardDecelerate` `0,0,0,1`; `emphasizedAccelerate` `.3,0,.8,.15`; `emphasizedDecelerate` `.05,.7,.1,1`; `linear` `0,0,1,1`; retain legacy curve family only for old references | `official-reconstruction` |
| `states.stateLayer` | Opacity, color contract | hover `.08`, focus `.12`, pressed `.12`, dragged `.16`; select the layer color from the container's `on-*` role rather than hard-coding a color | `official-reconstruction` |
| `states.ripple` | Detailed press sample | Bounded inherited-radius layer; Material Web transitions hover color/opacity in 15ms, press fade-in in 105ms, fade-out in 375ms; keep this as a Material Web implementation sample, not a global product-motion rule | `official-reconstruction` |
| `shapes.system` | Canonical and directional shapes | none `0`, extraSmall `4`, small `8`, medium `12`, large `16`, extraLarge `28`, full `9999` px; include `extraLargeTop`, `extraSmallTop`, `largeTop`, `largeStart`, and `largeEnd` logical variants | `official-reconstruction` |
| `colors.roles` | Missing role coverage | Add role names `surfaceContainerLowest`, `surfaceContainerHighest`, `surfaceBright`, `surfaceVariant`, `inverseSurface`, `inverseOnSurface`, `inversePrimary`, `surfaceTint`, `shadow`, and `scrim`; derive actual light/dark literals as one verified scheme, never by simple inversion | `official-reconstruction` |
| `containers.reference` | Search, chip, action, feedback primitives | Search: 56px, full shape, `surfaceContainerHigh`, level 3; filter chip: 32px, small shape, 1px outline, selected `secondaryContainer`; filled button: 40px, full shape, 18px icon; snackbar: 48px single-line / 68px two-line, 4px shape, 24px icon, inverse surface at level 3 | `official-reconstruction` |
| `icons.symbols` | Variable-font contract | Families: Outlined, Rounded, Sharp. Default design-system setting: `FILL 0`, `wght 400`, `GRAD 0`, `opsz 24`; supported ranges are FILL 0–100, weight 100–700, grade -50–200, optical size 20–48. Use FILL animation only to express a true selected/toggled state. | `official-open-asset` |
| `components.states` | State matrix refinements | Add selected/unselected variants to icon buttons and filter chips; support focus-visible, disabled, soft-disabled (where explanatory focusability is useful), dragged, and keyboard equivalent actions. Dialogs keep focus trapped while open. | `official-reconstruction` |

Use the existing product-service annotations only to say a pattern is catalogued
for that service. Do not infer that the upstream Material default dimension,
motion, or color was captured from that service.

### Official Docs Evidence

- [Material Web: Ripple](https://material-web.dev/components/ripple/) — a
  ripple is a state layer for hover and press; it must sit in a positioned
  container and is visual-only to assistive technology.
- [Material Web: Buttons](https://material-web.dev/components/button/) —
  defines five action-emphasis variants and documents disabled versus
  focusable `soft-disabled` behavior.
- [Material Web: Icon buttons](https://material-web.dev/components/icon-button/) —
  documents toggle/selected icon states and accessible labels.
- [Material Web: Chips](https://material-web.dev/components/chip/) — assigns
  filter chips to filtering and documents keyboard focusability for disabled
  chips when it improves discoverability.
- [Material Web: Dialogs](https://material-web.dev/components/dialog/) —
  dialogs retain keyboard navigation inside by default.
- [Material Web: Elevation](https://material-web.dev/components/elevation/) —
  levels 0–3 are resting elevation and the higher levels are interaction
  states; this supports the catalog's tonal-surface-first rule.
- [Material Symbols official repository](https://github.com/google/material-design-icons) —
  documents the three variable-font families, the four axes, and Apache-2.0
  distribution terms.

### Version Note

Retrieved **2026-09-07**. The pin for Material Web was current `main` commit
`c05b4b23485c803f68ff31cde52506cea5cc555a`; its generated token files identify
the contained token set as **Google Material 3 v0.192**, dynamic/web/3P context.
The pin for Material Symbols was current `master` commit
`0cbb08816df07faaae3dca060d4ebb10b66c214f`. These are upstream framework values,
not a statement about an individual Google product's private implementation.

### Source-Reference Evidence

- [Motion system](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-sys-motion.scss#L15-L54) — generated duration slots and standard, emphasized, legacy, and linear easing curves.
- [Shape system](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-sys-shape.scss#L15-L32) — exact 0/4/8/12/16/28/full shape values and directional variants.
- [State system](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-sys-state.scss#L15-L21) — exact hover, focus, pressed, and dragged state-layer opacities.
- [Color role set](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-sys-color.scss#L15-L125) — light/dark semantic roles, including the surface hierarchy and inverse roles.
- [Search-bar tokens](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-comp-search-bar.scss#L35-L80) — 56px full search container, surface/elevation role, and icon/text role mapping.
- [Filter-chip tokens](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-comp-filter-chip.scss#L35-L155) — small-shape 32px filtering control, selection, outline, and state-role mapping.
- [Filled-button tokens](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-comp-filled-button.scss#L35-L127) — 40px full-shape action, icon size, disabled opacity, and elevation behavior.
- [Snackbar tokens](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-comp-snackbar.scss#L35-L129) — inverse feedback surface, 4px shape, 24px icon, and single/two-line heights.
- [Primary navigation tab tokens](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-comp-primary-navigation-tab.scss#L35-L145) — selected indicator and three state-layer color/opacity mappings.
- [Navigation drawer tokens](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/tokens/versions/v0_192/_md-comp-navigation-drawer.scss#L35-L180) — active indicator, default/modal surfaces, 24px icons, and state mappings.
- [Ripple implementation](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/ripple/internal/_ripple.scss#L46-L91) — bounded inherited-radius rendering and 15/105/375ms implementation timing.
- [Default dialog animations](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/dialog/internal/animations.ts#L49-L161) — the exact Material Web dialog sample: 500ms entry, 150ms exit, `0.32` scrim, and staged content/actions.
- [Material Symbols axes](https://github.com/google/material-design-icons/blob/0cbb08816df07faaae3dca060d4ebb10b66c214f/README.md#L50-L73) — Outlined/Rounded/Sharp families, FILL animation use, axis ranges, and 20/24px pixel-grid caveat.
- [Material Symbols license statement](https://github.com/google/material-design-icons/blob/0cbb08816df07faaae3dca060d4ebb10b66c214f/README.md#L138-L141) — Apache-2.0 is the distributable icon lane; it does not grant product-mark rights.
- [Material Color Utilities: dynamic scheme](https://github.com/material-foundation/material-color-utilities/blob/5b3618b16fdc3825e21d5679bafd144662088ea1/concepts/dynamic_color_scheme.md) — roles map tonal palettes to UI functions and are designed around contrast/fidelity, so semantic role names should be stable while literals remain scheme-specific.

### Caveats / Ambiguity Flags

- **Emphasized easing conflicts upstream.** The generated Material 3 token set
  calls it `cubic-bezier(0.2, 0, 0, 1)`, while Material Web's handwritten
  `EASING.EMPHASIZED` uses `cubic-bezier(.3,0,0,1)` and explicitly calls its
  accuracy unknown in [the source](https://github.com/material-components/material-web/blob/c05b4b23485c803f68ff31cde52506cea5cc555a/internal/motion/animation.ts#L7-L21).
  Keep `.2,0,0,1` as the catalog's canonical token and record `.3,0,0,1` only
  as a component-implementation exception.
- The Material Web dialog animation is a useful open-source reference, but it
  is more expressive than the existing catalog's compact product-shell dialog
  observation. Store it as `materialWebDefault`, not as the default for every
  catalog sample.
- Material Symbols are Apache-2.0, but Google product logos, product icons,
  screenshots, illustrations, and brand treatments remain reference-only under
  this project's source policy and its Google brand guidance.
- This research did not authenticate into Gmail, Calendar, Drive, Meet, or
  Finance. It supplies no new claim about those product UIs.

### Reusable Takeaway

Expand the catalog with a clearly labeled Material reconstruction library:
complete motion and shape scales, role-based state layers, component-container
defaults, semantic surface roles, and a licensed variable-icon contract. Keep
service-specific values tied only to captured evidence; make all upstream
values traceable to their immutable commit URL.
