# Exact CSS excerpts from `live-styles.css`

These are readable, selector-mapped excerpts from the captured stylesheet. Class names are generated; preserve the values and map them to semantic tokens in the consuming system.

## Foundation and colors

```css
body { font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", ...; font-weight: 400; font-size: 16px; }
.container { width: 100%; max-width: calc(1008px + 2rem); margin: 0 auto; padding: 0 1rem; }
--app-green: #34C759; --app-gray: #747484; --app-blue: #018DFF; --app-pink: #F966AC;
--purple: #9553F9;
```

The stylesheet later overrides the four `--app-*` values with `color(display-p3 ...)` declarations inside a wide-gamut feature block. The hex values above are the direct sRGB fallbacks; P3 channel values should not be relabeled as equivalent sRGB hex values.

## Typography roles

| Selector | Family | Weight | Size / line-height | Tracking |
|---|---|---:|---:|---:|
| `.geYPoR` hero | Family | 500 | 68px / 1.1 | -0.02em |
| `.fuTHBv` heading | Family | 500 | 44px / 48px | -1.35px |
| `.gWkJEG`, `.dwgfHL` | Inter | 500 / 400 | 17px / 26px | -0.22px |
| `.jABlnH`, `.eHgZom` | Inter | 400 / 500 | 19px / 27px | -0.3px |
| `.hAxgce`, `.gPoOIL` | Inter | 500 / 400 | 15px / 22px | -0.13px |
| `.idDTlz`, `.hmrSHZ` | Inter | 400 / 600 | 14px / 20px | -0.09px |
| `.eMYCUu` | Inter | 500 | 23px / 25px | -0.44px |
| `.deiBcl`, `.jSGLSI` | Inter | 500 / 400 | 13px / 18px | -0.13px |
| `.cuLSUP` | Inter | 400 | 12px / 19px | -0.01px |
| `.iWutAh`, `.ieuDOz` | Inter | 500 | 17px / 26px | -0.22px |

At `max-width:580px`, `.geYPoR` becomes 44px/48px. At `max-width:420px`, `.fuTHBv` becomes 32px/35px with -0.69px tracking.

## Controls and navigation

`.dQyCQZ` is the primary dark pill: 17px, weight 500, 48px high, radius 32px, horizontal padding 22/24px, 12px icon gap, `background:#171717`, `color:#fff`, and `background-color 100ms ease`. `.cxKtcG` is its light variant (`#F6F4EF`, `#121212`). The compact `.hACioR`/`.fnjIlG` buttons are 32px high, radius 32px, 15px text, 14px horizontal padding.

`.jmGeWm` is the nav dropdown: absolute, top `calc(100% + 5px)`, width 316px, max-width `calc(100vw - 18px)`, 4px padding, radius 8px, white background, shadow `0 3px 16px rgba(0,0,0,.1)`. Menu links use 15px/600, radius 6px, with 100–200ms opacity/transform transitions.

## Layout and responsive rules

- `.iSKXBS`, `.cmwFAF`, `.iJVcKk`, `.kNTtOn`, `.iJVcKk`: two-column grids, `gap:5.75rem`, section padding roughly 5.625–8.5rem vertical. At 768px they become column flex layouts with 1rem gap and 2.5rem/3rem padding.
- `.llintP`: auto-fit columns with min 320px, `gap:6.0625rem 5rem`; at 768px one column and 2rem gap.
- `.cQxkDi`: auto-fit min 300px, 6.5rem/5.75rem vertical padding; mobile one column, 1.5rem gap, 2.5rem/4rem padding.
- `.bdsLl`: at min 880px, 3 columns × 2 rows, 34px gap; 880px and below, 2 columns × 3 rows; 580px and below, single-column flex with 1rem gap.
- `.kMPFrJ`, `.ilsiVB`: 3-column card grids, 2rem gap, top padding 3.1875rem; at 768px one column, 1.5rem gap, 2rem top padding, with child transforms explicitly disabled.
- `.jUQhDC`: two columns, 1.75rem gap, 7.25rem/6.75rem padding; at 768px one column, 1.5rem gap, 3rem/4rem padding.
- Footer `.dMZvyF`: 4.25rem/6rem padding; footer nav is 3 columns with 80px gap. At 768px it becomes stacked, 2-column nav, 2rem gap.

## Motion and triggers

```css
.kordEf img { transition: transform 180ms ease; }
.kordEf:hover img { transform: scale(1.02); }
.dsrLJw img { transition: transform 220ms cubic-bezier(.19,1,.22,1); }
.dIaiHi { transition: box-shadow .1s ease; }
.hACioR, .fnjIlG, .dQyCQZ, .cxKtcG { transition: background-color 100ms ease; }
```

Keyframes: `dLwxQl` shifts `background-position` 100%→-100%; `hBaPda` rotates 0→-360deg; `WxNdC` translates Y 0→100%, jumps to -100%, then returns; `fEWCgj` rotates 0→360deg; `hdKGda` translates X 0→-50%. The captured computed style reports `hdKGda` as a 120s linear infinite animation on desktop. On mobile, `.kMPFrJ` and `.ilsiVB` explicitly remove panel transforms to keep stacked cards static.
