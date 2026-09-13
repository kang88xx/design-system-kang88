# Design

## Source of truth

Status: Active · 2026-09-10. 이 저장소는 stripe.com 공개 마케팅 사이트의 디자인 소스 카탈로그다. 목적은 Stripe를 복제하는 것이 아니라, 박스(카드/서피스) 구성 · 일러스트 기법 · 인터랙션 · 모션 · 이펙트를 근거와 함께 꺼내 써서 새 디자인 시스템을 만드는 것이다.

- 원본: https://stripe.com/ (70페이지 크롤, 30페이지 심층 수집). 시각 근거는 `captures/`, 원본 데이터는 `data/raw/`.
- 원본 CSS: `assets/stripe/css/` (HDS 번들 24개 + 레거시 `v1-*.css` 574개 + 기타).
- 재사용 소스: `data/curated/` (tokens.css, hds-components.css, legacy-*.css, recipes.css, boxes/effects/motion/illustrations/interactions.json).
- 생성기: `scripts/`. 생성된 HTML/JSON은 손으로 고치지 않고 스크립트를 고친다.
- 근거 등급: `documented`(원본 CSS 규칙·토큰) / `observed`(브라우저 계산값·스크린샷·WAAPI 스냅샷) / `approximation`(recipes.css의 재현 클래스처럼 원본을 단순화한 것).

## Brand

Stripe의 시각 언어는 **차분한 네이비 텍스트 위에 블러플(#533afd/#635bff) 액센트, 아주 밝은 회청색 면(#f6f9fc/#f8fafd), 얇은 라인(#e6ebf1/#e5edf5)** 위에 **선명한 다색 그라데이션(보라→핑크→오렌지→노랑)** 을 한 번에 크게 쓰는 대비로 만들어진다. 글자는 Söhne 가변 폰트를 **가늘게(300)** 쓰고 헤드라인은 음수 자간으로 조인다. 큰 라운드보다 4–8px의 작은 라운드, 넓게 퍼지는 부드러운 그림자, 제품 UI를 HTML/CSS로 직접 그린 "DOM 그래픽"이 특징이다.

## Product goals

박스 하나를 고르면 스크린샷 · computed style · HTML · 실제 매칭 CSS · 호버 변화가 같이 나온다. 이펙트는 종류별로, 모션은 키프레임과 타이밍까지, 일러스트는 원본 파일과 기법까지 확인한다. 모든 값은 페이지·선택자 출처를 가진다.

## Information architecture

뷰어 탭: 개요 → 색상 → 타이포 → 간격·레이아웃 → 박스 소스 → 이펙트 → 모션 → 일러스트 → 인터랙션 → 컴포넌트 → 아이콘·로고 → 출처. 검색과 시스템(HDS/레거시) 필터를 제공한다.

## Two systems

### HDS (Home Design System, 2025–)

- 토큰: `--hds-color-core-{brand|brandDark|neutral|neutralDark|error|success|lemon|magenta|orange|ruby}-{25…990}` → semantic `--hds-color-{text|heading|surface|action|button|input|icon|shadow|accent}-*`. `.hds-mode--dark`가 같은 semantic 이름을 다크 값으로 바꾼다. `.hds-accent--{lemon|magenta|orange|ruby}`가 액센트 세트를 바꾼다.
- 타이포: `--hds-font-{heading|heading-hero|text|quote|input-*}-{xxs…xxl}-{size|lineHeight|letterSpacing|weight}`; 브레이크포인트 640px/940px에서 값이 바뀐다. heading-xxl 데스크톱 56px/1.03/-0.025em/300.
- 간격: `--hds-space-core-{0…2500}` 4px 배수(8=100), radius xs 2 / sm 4 / md 6 / lg 16 / xl 32, border 1/1.25/2. 섹션 상하 56→64→96px. 12컬럼 16px gap, 페이지 마진 16px.
- 그림자: xs/sm/md/lg/xl 두 겹(top+bottom), 색은 `rgba(0,55,112,.06~.1)` + `rgba(0,59,137,.02~.05)`.
- 모션: 기본 300ms `cubic-bezier(.25,1,.5,1)`; 아코디언 360ms `cubic-bezier(.65,.05,.36,1)`; 내비 240ms; 다이얼로그 열기 800ms `cubic-bezier(.22,1,.36,1)`. 모든 transition은 `@media (prefers-reduced-motion: no-preference)` 안에 있다.
- 컴포넌트: `.hds-button(--primary|--secondary|--secondary-on-quiet|--transparent|--compact)`, `.hds-ui-button`, `.hds-link(--secondary|--alternate)`, `.hds-tag(--md|--sm)`, `.hds-heading--*`, `.hds-text--*`, `.hds-textinput`, `.hds-checkbox`, `.hds-switch`, `.hds-select`, `.hds-dialog`, `.hds-tooltip`, `.hds-accordion/.hds-details`, `.hds-stat`, `.hds-resource-card`, `.hds-navigation-menu`.

### Legacy MktRoot (2019–)

- 루트: `.MktRoot`/`html`에 `--fontFamily`, `--fontWeightNormal 300 / Semibold 425 / Bold 500`, `--ctaFont 425 15px/1.6`, `--hoverTransition 150ms cubic-bezier(.215,.61,.355,1)`, `--cardShadow{XSmall…XLarge}`, `--angleNormal -6deg / --angleStrong -12deg`, `--layoutWidthMax 1080px`, `--columnPadding*`, `--rowGap{Normal 8…XXLarge 88}`, `--focusBoxShadow`.
- 테마: `.theme--Light|White|Dark|SemiDark|Transparent|LegacyLight|LegacyDark|HubLight|HubDark` 가 `--backgroundColor/--titleColor/--textColor/--cardBackground/--cardBorderColor/--buttonColor/--knockoutColor/--linkColor/--inputBackground…` 를 바꾼다.
- 액센트: `.accent--Blurple #635bff | Blue #0073e6 | Cyan #02bcf5 | Teal #00c4c4 | Green #15be53 | Yellow #fab000 | Orange #ff7600 | Pink #f363f3 | Raspberry #ff5996 | Purple #96f | Slate #0a2540` (다크 값 별도).
- 플레이버: `.flavor--Chroma|CottonCandy|LemonLime|Overcast|Perennial|Pomegranate|Sunburst|Tropical|Twilight|Wintergreen` 가 WebGL Gradient 캔버스의 `--gradientColorZero…Three` 를 정의한다.
- 컴포넌트: `.CtaButton(variant--Button|Link|Google, --arrow)`, `.Button`, `.Badge(color--*, --accented, variant--Squared)`, `.Copy/.CopyTitle/.CopyBody(--variantHero|Section|Detail|Stat|Disclaimer)`, `.Section(--angleTop|Bottom|Both)`, `.Card(--border, --shadow*, --accented)`, `.AccordionItem`, `.Tabs`, `.Table`, `.SiteHeader`, `.SiteFooterSection`.

## Visual language rules for the new system

1. **박스**: 흰 면 + 1px `#e6ebf1` 또는 그림자 중 하나만. 라운드 4–8px (다이얼로그 16px). 다크 박스는 `#0a2540/#0c2e4e`(레거시) 또는 `#0d1738/#122054`(HDS neutralDark). 그래픽 패널은 글래스(`rgba(248,250,253,.45)` + `blur(12px)`) 위에 흰 창을 겹친다.
2. **이펙트**: 그라데이션은 배경·텍스트·보더 세 자리에만. radial 블롭(브랜드/마젠타/레몬)은 `filter: blur`로 뒤에 깔고, conic 보더 스핀은 `@property --border-angle`로 돌린다. 섹션 앵글은 -6deg.
3. **모션**: 300ms `cubic-bezier(.25,1,.5,1)` 기본, 마이크로 인터랙션 150ms. 등장은 opacity+translateY(30px) 페이드업. reduced-motion 존중.
4. **인터랙션**: 버튼 hover는 배경 어둡게(#533afd→#4032c8), 링크 hover는 색만(#533afd→#2e2b8c), 카드 hover는 translate/그림자. 포커스는 3px 소프트 아웃라인 + 오프셋.
5. **일러스트**: 제품 UI는 실제 DOM으로 그리고(폰트·토큰 공유), 배경만 캔버스/이미지. 아이콘은 듀오톤 그라데이션(`--icon-gradient-start/middle/end`).

## Studio shell

뷰어의 셸(뼈대)은 Apple 스튜디오 셸 공통 규격 [`../All/shell/SPEC.md`](../All/shell/SPEC.md)을 따른다. 구조·치수는 `viewer/studio-shell.css`(`All/shell/shell.css` 사본)와 `viewer/studio-shell.js`(모바일 내비 · 브레드크럼 동기화 · 토스트)가 담당하고, 모든 셸 클래스는 `as-` 접두어를 쓴다.

브랜드 색·서체는 `viewer/studio-brand.css`에서 Stripe 토큰을 `--as-*`로 매핑한다: `--as-ink #061b31`, `--as-accent #533afd`, `--as-surface/--as-sidebar-bg #f8fafd`, `--as-line #e5edf5`, 서체 `sohne-var`. 셸 치수·간격·타입 크기는 바꾸지 않는다.

레이아웃: 좌측 232px 사이드바(브랜드 마크 = `assets/stripe/svg/stripe-logo-abbb70ca1f.svg`, WORKSPACE nav = 기존 탭 12개에 01–12 번호와 `aria-current`) + 65px 상단바(브레드크럼 · Export tokens = `data/curated/tokens.css` 다운로드) + `.as-workspace` 본문. 탭 컨테이너는 `#tabs`, 뷰 컨테이너는 `#main`으로 그대로여서 `scripts/test-viewer.mjs`가 계속 동작한다.

뷰어 HTML은 생성물이므로 셸을 고칠 때도 `scripts/build-viewer.mjs`의 템플릿을 고친다.
