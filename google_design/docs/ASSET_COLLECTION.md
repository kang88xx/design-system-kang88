# Asset Collection

## Distributable assets

### Material Symbols

- Source: `https://github.com/google/material-design-icons`
- License: Apache-2.0
- Use: interface icons only
- Exclusion: Gmail, Calendar, Drive, Meet, Google Finance product logos and product icons

### Noto Emoji

- Source: `https://github.com/googlefonts/noto-emoji`
- Font license: OFL-1.1
- SVG and most image resources: Apache-2.0
- Region flags: verify each file's provenance before redistribution

Noto Emoji sample grid is not displayed in the current catalog. The source remains in the license index only.

### Fonts

- Roboto: OFL-1.1
- Google Sans / Google Sans Flex: use only an official Google Fonts download and preserve the included license
- Product Sans or fonts extracted from browser caches: excluded

## Reference-only assets

- Authenticated product screenshots
- Google product logos and icons
- Product illustrations and onboarding graphics
- Google Doodles
- Third-party email, document, calendar, meeting, news, or market content

Downloaded image bytes belong under `references-private/` and are ignored by version control. Public viewer output does not embed or copy them. The product source registry may load a clearly labeled `reference-only` representative symbol directly from its official HTTPS host so the catalog can show the exact mark and color without turning it into a bundled implementation asset.

## Illustration classification

| Observation | Original | Distributable substitute |
| --- | --- | --- |
| Meet empty schedule | reference-only product illustration | Material Symbol `event_busy` on secondary container |
| Calendar onboarding | reference-only product illustration | Material Symbol `calendar_month` on primary container |
| Gmail Gemini banner mark | reference-only branded mark | Material Symbol `auto_awesome` without Google product branding |
| Drive recommendation empty state | independently reusable layout pattern | Material Symbol `folder_off` with whitespace-first empty state |

## Meet user-supplied reference set

| Asset | Source bbox | Observed colors | Box / gradient | Distribution |
| --- | --- | --- | --- | --- |
| Meet product mark | `38,22,350×55`; official PNG 124×40 | exact accents `#FBB100`, `#FECC05`, `#FECA03`, `#FFD00A`; neutral `#212226` | raster gradient visualization only | reference-only |
| Meeting nav selected | `44,212,112×112` | `#C9E6FD`, `#061C33`, `#1967D2` | 112×64, radius 32 | reference-only |
| Call nav inactive | `72,360,70×112` | `#454746`, `#5F6368` | no container | reference-only |
| Shield-lock icon | `80,70,56×73` | `#4285F4`, `#185ABC`, white | security banner child | reference-only |
| Security banner | `28,42,612×128` | `#D3E3FD`, `#454746`, `#4285F4`, `#185ABC`, white | height 128, radius 64 | reference-only |
| Empty-state illustration | `247,123,615×325` | `#FFC6EF`, `#FFDB0F`, `#FDFD6D`, `#1F1F1F`, black, white | official SVG gradient and 1px native strokes | reference-only |
| Video-plus icon | `499,726,35×33` | `#102613`, `#CDEDD2` | tonal CTA child | reference-only |
| New meeting CTA | `446,686,214×111` | `#C4EED0`, `#072711` | radius 56 | reference-only |

Original files are unchanged and hashed in `references-private/manifest.json`. The public catalog contains evidence IDs, dimensions, observed colors, distributable substitutes, and official-hosted representative URLs labeled `reference-only`.

## Exact observed platform image library

`scripts/export-observed-reference-assets.mjs` reads `data/raw/*.json` and downloads only allowlisted official image hosts. It never sends authentication cookies and excludes Google user-content hosts.

Current collection:

- 37 exact-source images, 0 failures
- Gmail 29 references, Calendar 9, Drive 7, Meet 4, Finance 1. Shared assets count toward each observing service.
- 18 Gmail UI icons, 5 product logos, 4 companion app icons, 4 Material icons, 2 illustrations, 1 security status icon, 1 launcher icon, 1 store badge, 1 sprite
- PNG 34, SVG 3

Each private manifest entry exposes service, category, source and resolved URL, MIME, natural width/height, byte size, SHA-256, palette, and vector metadata. SVG entries additionally expose path counts, fill/stroke colors, native stroke width, gradient vectors, and exact stops.

The official Meet empty-state SVG is the fidelity source of truth: 315×167, 12 paths, native default 1px strokes, fills `#FFC6EF`, `#FFDB0F`, `#FDFD6D`, and a two-stop official gradient from `45% #FFC6EF` to `61% #FFDB0F`.

## Product source registry

The public catalog lists nine source lanes: Gmail, Calendar, Drive, Meet, Finance, Keep, Contacts, Tasks, and Maps. Each card displays a representative symbol from an official Google-hosted URL, its natural dimensions, source type, product page, and policy link. Every mark remains `reference-only`; Maps is `conditional-attribution-reference` because API attribution rules apply only in the correct Maps product context.

Gmail and Meet are observed as horizontal lockups, so the service-map symbol slot clips only the leading icon region of the unchanged official image. Calendar, Drive, Keep, Contacts, Tasks, Maps, and the official Google Finance app icon use contain scaling without redrawing or CSS approximation.

The registry distinguishes source geometry from display geometry. Gmail and Meet show `source 109×40 / 124×40` and `display 40×40`; Calendar and Finance preserve their larger source dimensions but fit a maximum 52×52 optical box. Product icons are never enlarged beyond their natural size. Internal policy codes remain in JSON, while the viewer exposes readable Korean labels and separate `제품 페이지` / `사용 정책` actions.

The private viewer provides eight user-crop-to-official-source comparisons. It preserves the supplied crop, the official downloaded file, natural dimensions, exact palette, source URL, and SHA-256 side by side.

## Infographic and data patterns

- Finance market sparkline: reimplement with semantic positive/negative tokens, sign, direction icon, and data-driven chart path.
- Finance market summary: reimplement the information order; do not copy screenshot or article imagery.
- Calendar weekly time-grid: independently implement the spatial time model, today marker, current-time line, and event layer.
- Material documentation diagrams: reference-only. Recreate explanatory diagrams with original neutral shapes and copy.

## Manifest

`data/curated/asset-manifest.json` lists source URLs, license classification, icon names used by the catalog, and the Noto Emoji sample set.


## Commit-pinned open implementation sources

81개 Material Symbols Rounded SVG는 `assets/material-symbols/rounded/`에 원본 bytes 그대로 저장합니다. 기본 조합은 weight 500, fill 0, optical size 24입니다. `people` 이름은 공식 `groups` SVG에 대응하며 manifest의 `upstreamName`에서 확인할 수 있습니다.

`data/sources/open-source-manifest.json`에는 파일 경로, 공식 불변 URL, bytes, SHA-256, viewBox, license를 보관합니다. Material Web의 motion, shape, state, elevation SCSS와 양쪽 Apache-2.0 LICENSE도 `assets/upstream/`에 함께 저장합니다. 수집기는 `scripts/collect-open-design-assets.mjs`이며 허용된 공식 저장소만 접근합니다.

새 시각 자료는 `data/curated/design-library.json`에서 `observed` / `documented` / `reconstructed`로 구분합니다. 6개 새 gradient는 독립 구현이며 기존 2개 Meet 참고 gradient와 혼동하지 않습니다. 새 수집기 필드는 future capture용이며 기존 raw의 측정값을 채워 넣거나 변경하지 않습니다.
