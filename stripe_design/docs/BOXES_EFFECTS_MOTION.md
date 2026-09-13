# Boxes · Effects · Motion · Illustrations · Interactions

데이터: `data/curated/boxes.json`, `effects.json`, `motion.json`, `illustrations.json`, `interactions.json`, `recipes.css`. 스크린샷: `captures/boxes|effects|motion|illustrations|interactions`.

## 박스 소스 (boxes.json)

수집 방법: 각 페이지에서 라운드·그림자·배경·보더가 있는 컨테이너를 찾아 `data-ds-id`를 붙이고, Chrome DevTools Protocol `CSS.getMatchedStylesForNode`로 **실제 매칭된 규칙**(선택자·선언·미디어·`::before/::after`·keyframes)을 그대로 저장했다. 함께 저장: computed style, outerHTML(SVG 생략), 직계 자식 5개의 레이아웃 규칙, rest/hover 스크린샷과 hover 변화량(background/color/border/box-shadow/transform/opacity/filter), hover 중 시작된 애니메이션.

대표 박스 패밀리:

| 패밀리 | 시스템 | 구성 |
| --- | --- | --- |
| `modular-solutions-bento-card` | HDS | 버튼형 벤토 카드. `__border` 레이어(`inset:-1px`, `clip-path: inset(... round 6px)`, `transition: clip-path var(--card-duration) var(--card-ease)`)가 radial-gradient 헤일로(`#7f7dfc → #f44bcc 33% → #e5edf5 66%`)를 드러낸다 |
| `browser-graphic__window` / `__page` | HDS | 글래스 창 `rgba(248,250,253,.45)` + `blur(12px)` + `rgba(23,23,23,.08) 0 15px 35px`, 안쪽 흰 페이지 `rgba(23,23,23,.06) 0 3px 6px`, radius 6px |
| `dom-graphic__content` | HDS | 흰 카드 `rgba(50,50,93,.12) 0 16px 32px`, 6px; `--graphic-reveal-duration 300ms cubic-bezier(.25,1,.5,1)` |
| `platform-graphic__feature-card` | HDS | 흰 카드 6px, conic 그라데이션 보더 스핀(`--border-angle`) |
| `no-code-graphic__card`, `integrated-*__card`, `developer-systems-animation__apps` | HDS dark | `#122054`(neutralDark-950) 카드, 내부 `#2b408a` 서브카드, 터미널 `#171055` 5px |
| `case-study-card__media`, `startups-program-card__inner`, `book-of-the-week` | HDS | `#e5edf5`/`#f8fafd` 면 + 6px, hover `transform` |
| `Card--border`, `Card--shadow*`, `ProductFeatureCard`, `PricingProductCard`, `AccentedCard` | 레거시 | `--cardBorderRadius 8px`, `--cardShadowSmall…XLarge`, `Card--accented::before` 8px 상단 액센트 바, bleed 변수 |
| `FormCard`, `PricingEnterprisePackageCard`, `BucketItem` | 레거시 | 흰 카드 + `#e6ebf1` 보더, 16px 패딩 |

`recipes.css`의 `.box-*` 클래스는 패밀리별 대표 박스의 computed 값을 그대로 독립 CSS로 만든 것이다(토큰 불필요). 원본 규칙은 `boxes.json[].source.rules`.

## 이펙트 (effects.json)

| 종류 | 관측 예 |
| --- | --- |
| gradient-text | 홈 히어로 `linear-gradient(90deg,#7232f1 3.13%,#fb76fa 50%,#ffcf5e)` + `background-clip:text`; 레거시 sticky 내비 CTA `linear-gradient(90deg,#e18638,#e17a38)` |
| radial-gradient (블롭·글로우) | `radial-gradient(50% 50%, rgba(83,58,253,.8) 62.5%, transparent)`, 마젠타 `rgba(243,99,243,.8)`, 레몬 `#ffcf5e`; 벤토 헤일로 `circle, #7f7dfc, #f44bcc 33%, #e5edf5 66%` |
| conic-gradient (보더 스핀) | `conic-gradient(from var(--border-angle), magenta-100 …)` + `agentic-commerce-graphic-border-spin`, `subscriptions-bento-graphic-gradient-border-rotate`, `csf-card-footer-border-spin` |
| backdrop-filter (글래스) | `blur(12px)` 창, 내비 메뉴 `rgba(255,255,255,.65)` 버튼 |
| mask | 내비 아이템 `url(#cutoutMask)`, 페이드 마스크 `linear-gradient(#fff 41.35%, transparent)` |
| clip-path | 벤토 보더 리빌 `inset(4px 4.8px round 6px)`, 결제 그래픽 단계 리빌 `inset(0 0 100%)` |
| mix-blend-mode | 히어로 텍스트 컨테이너 블렌드 |
| transform | 레거시 `Section__background { transform: skewY(var(--sectionAngle)) }` -6deg/-12deg, 그래픽 스케일/회전 |
| pseudo-layer | `::before/::after` 그라데이션·블러 레이어 (내비 CTA, 터미널 페이드) |
| 레거시 배경 | WebGL Gradient 캔버스: `.flavor--*` 의 `--gradientColorZero…Three`; 가이드 라인 `linear-gradient(rgba(66,71,112,.09) 50%, transparent 0)` |

## 모션 (motion.json)

- `@keyframes` 원문: HDS 40개(`nav-hover-arrow-in/out`, `bento-dialog-reveal-fade-in-up`, `*-border-spin/rotate`, `*-bar-grow`, `radar-hero-*`, `transaction-fraud-*`, `butterfly-fly`, `csf-card-footer-label-shimmer`…), 레거시 33개(`gradientBackgroundDrift`, `knockoutText`, `phone-shimmer`, `connectFlowDiagram*`, `ProductFeatureCardRotate*`, `refreshed-nav-hover-arrow-*`…), 기타 27개.
- 실행 중 관측: 페이지별 `animation-name/duration/timing/iteration` + 160ms 간격 6프레임 캡처.
- WAAPI: `document.getAnimations()` 스냅샷(초기 + 스크롤 중 600px 단위). DOM 그래픽은 대부분 `element.animate()`(이름 없는 `Animation`)로 움직이며 keyframes·timing을 JSON으로 저장했다. `CSSTransition` 은 속성별 duration/easing 히스토그램.
- 이징 규칙: HDS 기본 `cubic-bezier(.25,1,.5,1) 300ms`, 아코디언 `cubic-bezier(.65,.05,.36,1) 360ms`, 내비 `cubic-bezier(.45,.05,.55,.95) 240ms`, 다이얼로그 `cubic-bezier(.22,1,.36,1) 800ms`, 리소스 카드 `cubic-bezier(.46,.03,.52,.96) 300ms`, 그래픽 리빌 300ms. 레거시 `--hoverTransition 150ms cubic-bezier(.215,.61,.355,1)`, 메뉴 250ms.
- 히어로: `hero-wave-animation` WebGL 캔버스(1393×761), 프레임 캡처 `captures/motion/home-i5-f*.png`.

## 일러스트 (illustrations.json)

기법 4가지: (1) **DOM 그래픽** — 결제 화면·대시보드·단말기를 실제 HTML/CSS로 구성(`.dom-graphic`, `*-graphic__*`), 토큰·폰트 공유, WAAPI로 애니메이션; (2) **WebGL 캔버스** — 히어로 웨이브, 레거시 Gradient; (3) **인라인 SVG** — 라인 일러스트·듀오톤 아이콘(`--icon-gradient-start/middle/end`); (4) **래스터** — Contentful(`images.stripeassets.com`) 사진·고객 비주얼, GIF 루프, MP4. 다운로드한 원본은 `assets/stripe/illustrations/`, 인라인 SVG는 `inline/`, DOM 그래픽은 스크린샷과 박스 소스로 보관.

## 루프 클립 (captures/clips, motion.json/interactions.json `clips`)

`scripts/record-motion.mjs`가 페이지마다 Playwright 비디오(1440×900)를 녹화하면서 박스 hover(진입 1.1s → 이탈), 탭·아코디언·캐러셀·세그먼트 클릭, 메가메뉴 hover, 버튼·링크 hover, CSS/WAAPI 애니메이션 요소, 히어로 캔버스·DOM 그래픽을 2.4~3.2초씩 촬영한다. 가짜 커서(`#ds-cursor`)를 페이지에 합성해 hover 위치가 보이게 했고, 각 구간의 시작/끝 시각과 요소 뷰포트 좌표를 기록한 뒤 ffmpeg로 잘라 요소만 크롭(최대 720px, 15fps, H.264 CRF 28)한다. 클립은 `boxes.json[].clip`, `interactions.json.clips`, `motion.json.clips`/`frames[].clip`에 연결되며 뷰어에서 `<video autoplay muted loop>`로 재생된다.

## 인터랙션 (interactions.json)

- 버튼: primary rest `#533afd` → hover `#4032c8`(300ms), secondary `rgba(255,255,255,.65)` + `#b9b9f9` 보더 → hover 글자 `#2e2b8c`, 보더 `#4032c8`. focus 3px 소프트 아웃라인.
- 입력: 48px, 1px `#665efd` 보더(선택), outline `rgba(163,167,255,.25) 3px`.
- 내비: 76px 헤더, 트리거 14px/400, 메가메뉴 5컬럼 링크 14px `#533afd` + 설명 `#50617a`, hover 화살표 `nav-hover-arrow-in` (opacity+translateX(-3px)→0).
- 탭·아코디언·캐러셀·세그먼트: 클릭 전/후 스크린샷과 그 순간 실행된 애니메이션 목록.
- 박스 hover: transform/그림자/보더 변화량과 hover 스크린샷.
