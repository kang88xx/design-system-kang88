# Foundations

## Evidence model

Foundations combine two evidence types:

1. Authenticated product-shell observation from Gmail, Calendar, Drive, Meet, and Finance
2. Semantic role reconciliation against Material 3 and its official open-source implementations

Observed computed values are in `data/raw/*.json`. The implementation contract is `data/curated/tokens.json` and `tokens.css`.

## Color roles

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Primary | `#0b57d0` | `#a8c7fa` | primary action, focus, selected indicator |
| Primary container | `#d3e3fd` | `#0842a0` | selected navigation, tonal action |
| Secondary container | `#c2e7ff` | `#004a6f` | information and auxiliary selections |
| Tertiary | `#0b8043` | `#a8dab5` | success, safe state, positive data |
| Surface | `#ffffff` | `#1f1f1f` | primary surface |
| Surface dim | `#f8fafd` | `#131314` | application backdrop |
| Surface container low | `#f2f6fc` | `#1e1f20` | search, drawer, low-emphasis surface |
| On surface | `#1f1f1f` | `#e3e3e3` | primary text |
| On surface variant | `#444746` | `#c4c7c5` | secondary text and icon |
| Outline variant | `#c4c7c5` | `#444746` | dividers and card outlines |
| Error | `#b3261e` | `#f2b8b5` | destructive or failure state |

Finance uses explicit positive/negative colors but never color alone. Pair them with sign, icon, or label.

## Typography

The cross-product dominant sizes are 14px and 16px. Calendar uses 10–13px for dense time/grid labels; Finance uses 10–12px for metadata; display headings use 24–36px.

Use Google Sans/Google Sans Text only from an official Google Fonts bundle with its license. Roboto is the open fallback.

## Spacing and density

- Base: 4px
- High-frequency observed values: 4, 8, 12, 16, 24px
- Dense rows: 40–52px
- Search bars: 48–52px
- Icon buttons: 40–48px target, 20–24px glyph
- Cards and large surfaces: 16–28px radius
- Chips and compact actions: full radius

## Elevation

Google product shells rely more on tonal surfaces and outlines than shadow. Use elevation for floating primary actions, hover rows, menus, dialogs, and snackbars only.

## Layout

- Persistent top utility area
- Search as a first-class task entry
- Left task navigation, compact or expanded
- Optional right utility/research rail
- Rounded main content surface on pale app background
- Desktop reference viewport: 1440×1000
