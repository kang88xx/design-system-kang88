# Foundations

값은 `data/curated/tokens.json`(HDS)과 `legacy-tokens.json`(레거시)에서 온다. 전체 표는 뷰어의 색상·타이포·간격 탭이 최신이다.

## Color

### HDS core → semantic

| 역할 | light | dark |
| --- | --- | --- |
| text-solid | `#061b31` (neutral-990) | `#fff` |
| text-soft | `#50617a` (neutral-600) | `#a3b5d6` |
| text-subdued | `#64748d` (neutral-500) | `#839bc8` |
| text-quiet | `#7d8ba4` (neutral-400) | `#6480b2` |
| heading-solid / subdued | `#061b31` / `#64748d` | — |
| surface-bg-quiet | `#fff` | `#fff` |
| surface-bg-subdued | `#f8fafd` (neutral-25) | `#122054` |
| surface-border-quiet | `#e5edf5` (neutral-50) | `#182659` |
| action-bg-solid / hover | `#533afd` / `#4032c8` | `#533afd` / `#5d64fe` |
| action-bg-subdued / quiet | `#e2e4ff` / `#e8e9ff` | `#362baa` / `#2c2484` |
| action-text-solid / hover | `#533afd` / `#2e2b8c` | `#7389ff` / `#a8bfff` |
| button-primary bg/hover/disabled | `#533afd` / `#4032c8` / `#a8c3de4d` | — |
| button-secondary bg / border | `#ffffffa6` (translucent) / `#b9b9f9` | — |
| focus outer / soft | `#533afd` / `#5452fbbf` | `#92adff` / `#7b7eff96` |
| error / success | `#d8351e` / `#00b261` | 동일 |

Core 팔레트(brand 25…975, brandDark, neutral 0…990, neutralDark, error, success, lemon, magenta, orange, ruby)는 뷰어 색상 탭에 스와치로 있다. 다크 모드는 별도 팔레트(`*Dark`)를 semantic에 다시 매핑한다.

### Legacy

| 역할 | Light | Dark |
| --- | --- | --- |
| backgroundColor | `#f6f9fc` | `#0a2540` |
| titleColor | `#0a2540` | `#fff` |
| textColor | `#425466` | `#adbdcc` |
| cardBackground / border | `#fff` / `#cbd6e0` (soft `#e7ecf1`) | `#0c2e4e` / `#0f395e` |
| subcardBackground | `#f6f9fc` | `#1f4468` |
| knockoutColor (버튼 글자) | `#fff` | `#0a2540` |
| buttonHoverColor | `#0a2540` | `#fff` |
| inputBackground / placeholder | `#f6f9fc` / `#727f96` | `#0c2e4e` / `#b6c2cd` |
| annotationColor | `#8c9eb1` | `#8c9eb1` |

관측 상 가장 많이 쓰인 텍스트 색: `#0a2540`, `#727f96`, `#425466`, `#635bff`, `#3c4f69`; 배경: `#fff`, `#f6f9fc`, `#4247700f`(가이드 라인), `#e6ebf1`. 레거시 배지 색: Purple `#96f/#f0e8ff`, Blue `#0073e6/#d9eafb`, Cyan `#02bcf5/#d9f5fe`, Teal `#00c4c4/#d9f6f6`, Pink `#ff5996/#ffe6ef`.

## Typography

- 서체: `sohne-var` (Söhne Variable, weight 1–1000), 코드 `SourceCodePro` 500. 폴백 `"SF Pro Display", sans-serif` / 레거시 `"Helvetica Neue", Arial`.
- HDS 굵기: normal 300, bold 400 (중국어 400/500). 레거시: normal 300, semibold 425, bold 500, light 200.
- `-webkit-font-smoothing: antialiased`.

### HDS scale (mobile → tablet ≥640 → desktop ≥940)

| 이름 | 크기 | 행간 | 자간 |
| --- | --- | --- | --- |
| heading-xxl | 34 → 48 → 56px | 1.03 | -0.02 → -0.025em |
| heading-xl | 28 → 34 → 48px | 1.07 → 1.05 → 1.03 | -0.01 → -0.02em |
| heading-lg | 22 → 28 → 32px | 1.2 → 1.07 → 1.1 | -0.01 → -0.02em |
| heading-md | 20 → 22 → 26px | 1.2 → 1.1 → 1.12 | -0.01em |
| heading-sm | 18 → 20 → 22px | 1.25 → 1.12 → 1.1 | 0 → -0.01em |
| heading-xs / xxs | 16 / 14px (400) | 1.2 | 0 |
| heading-hero-lg | 28 → 40px | 1.1 → 1.2 | -0.02em |
| text-xxl | 28 → 34 → 48px | 1.07 → 1 | -0.02em |
| text-xl | 18 → 20px (soft color) | 1.4 | 0 → -0.01em |
| text-lg / md / sm | 18 / 16 / 14px | 1.4 | 0 |
| text-xs / xxs | 12→14 / 12px | 1.45 | 0 |
| quote-md | 18 → 26px | 1.4 → 1.12 | |
| input-text-md / label-md | 14px 300 / 14px 400 | 1.3 | |

관측: 홈 h1 48px/55.2px/-0.96px/300, h2 32px/35.2px/-0.64px, h3 26px/29.12px/-0.26px. 모바일 h1 34px.

### Legacy copy

`--ctaFont: 425 15px/1.6`, 본문 `CopyBody--variantSection` 18px/1.556, `--variantDetail` 15px/1.6, `--variantDisclaimer` 13px/1.6. 관측 헤딩: 38px/48px/-0.2px 500 (hero), 26px/36px 500 (section), 56px/68px/-1.12px 500 (hub hero), 15px 425 0.2px (eyebrow/label).

## Spacing · layout

- HDS core: 0,1,2,4,6,8,12,16,20,24,28,32,36,40,44,48,56,64…200px (`--hds-space-core-{0,1,25,50,75,100,150,200,…,2500}`).
- 레이아웃: 4/8/12 컬럼, gap 16px, 콘텐츠 마진 16px, 페이지 마진 0→16px. 관측 컨테이너: 1298px(pad 18), 1266px, 1080px(레거시 `--layoutWidthMax`), 810px(레거시 copy).
- 섹션 간격: sm 56→64→48px, md 56→64→96px, subsection top 40→40→64px.
- 버튼 높이 44→44→48px, 입력 48px, 탭 gap 16/24px, 탭 그룹 gap 24/32/40px.
- 레거시: `--paddingTop/Bottom 160px`, `--rowGap 8/24/32/64/88`, `--columnPadding 8/16/32/64/112`, 섹션 앵글 -6deg(sin .106) / -12deg.

## Radius · border · shadow

- HDS radius: 2 / 4 / 6 / 16 / 32px. 관측 최빈: 4px, 6px (HDS) · 8px, 16.5px(pill), 4px, 50% (레거시).
- HDS shadow (light): xs `0 2px 10px rgba(0,55,112,.06), 0 1px 4px rgba(0,59,137,.04)` · sm `0 5px 14px .08 / 0 2px 8px .05` · md `0 6px 22px .1 / 0 4px 8px .02` · lg `0 15px 40px -2px .1 / 0 5px 20px -2px .04` · xl `0 20px 80px -16px .1 / 0 10px 60px -16px .04`.
- 레거시 card shadow: XSmall `0 2px 5px -1px rgba(50,50,93,.25), 0 1px 3px -1px rgba(0,0,0,.3)` · Small `0 6px 12px -2px / 0 3px 7px -3px` · Medium `0 13px 27px -5px / 0 8px 16px -8px` · Large `0 30px 60px -12px / 0 18px 36px -18px` · XLarge `0 50px 100px -20px / 0 30px 60px -30px`.
- 관측 기타: `rgba(23,23,23,.08) 0 15px 35px` (글래스 창), `rgba(50,50,93,.12) 0 16px 32px` (캔버리 UI), `rgba(0,0,0,.1) 0 15px 35px, rgba(0,0,0,.07) 0 3px 10px`.
- 포커스: HDS `3px solid var(--hds-color-action-focus-outerSoft)` offset 3px(버튼 1px); 레거시 `0 0 0 2px #4d90fe, inset 0 0 0 2px hsla(0,0%,100%,.9)`.
