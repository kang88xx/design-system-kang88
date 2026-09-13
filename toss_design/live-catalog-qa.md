# Live source catalog QA

- Source: `https://toss.im/`, all eleven lazy-loaded homepage anchors
- Raw inventory: `data/toss-live-design-inventory.json`
- Normalized catalog: `data/toss-live-design-catalog.json`
- Catalog SHA-256: `9db75c018a8d250456149e64505d44c3238a77e9f65b055dde736ecbf1f1a650`
- Determinism: two consecutive catalog builds produced the same hash

## Collected totals

- Inline SVG: 70 instances, 36 unique, including 26 functional icons and 10 graphic SVGs
- Image icons: 7 unique
- CSS mask icons: 12 unique
- Button/link visual styles: 25 computed groups
- Shapes: 330 instances grouped into 45 direction-aware kind/radius groups
- Computed background colors: 136
- Computed background images: 26
- Declared gradients: 54
- Shadows: 16
- Figma variables: 137 across 3 collections and 4 Tokens Studio sets

## Browser evidence

- Icons: `evidence/37-live-catalog-icons.png`
- Buttons: `evidence/38-live-catalog-buttons.png`
- Gradients: `evidence/39-live-catalog-gradients.png`
- Shapes: `evidence/40-live-catalog-shapes.png`
- Backgrounds: `evidence/41-live-catalog-backgrounds.png`
- Mobile buttons: `evidence/42-live-catalog-mobile-buttons.png`
- Mobile gradients: `evidence/43-live-catalog-mobile-gradients.png`

## Verification

- Desktop catalog cards: icons 55, buttons 25, shapes 45, gradients 54, backgrounds 162
- Tabs, Left/Right/Home/End keyboard navigation, and search filter work
- Dark-source buttons receive a dark preview stage without changing the collected button style
- SVG defs, clipPath, gradient references, and computed fill/stroke are self-contained in each catalog specimen
- Sub-4px geometry is classified as line or micro; horizontal and vertical lines preserve direction
- 390px mobile has no horizontal page overflow; catalog tabs intentionally scroll horizontally
- Local load: 24ms in the audit browser
- Browser console: no errors

## Scope boundary

This is the complete inventory of the currently rendered public `toss.im` homepage after all lazy sections load. It is not a claim to contain private Toss app UI or every icon in the internal TDS package.

final result: passed
