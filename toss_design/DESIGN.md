# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-09-07
- Primary product surfaces: 공개 홈 소스 라이브러리, 원본 모션 플레이어, 모션 실험실, 디자인 토큰·컴포넌트 스터디
- Evidence reviewed:
  - `data/toss-source-capture.json`: 2026-09-07 KST 공개 홈 1440×1000 / 390×844 전체 스크롤 수집, 551 resource URLs, 86 public documents, 675 CSS rules, 892 runtime animation samples
  - `data/toss-source-library.json`: 9개 범주, 1,558개 source entries; observed / recreated / source-context 구분
  - `data/toss-asset-manifest.json`: 503개 자산 중 477개 로컬 스터디 보관, 영상 15·폰트 10 원본 참조, 403 응답 1개 기록
  - `evidence/source/`, `evidence/qa/`: 최신 출처·구현 화면 및 동작 검증
  - 아래 2026-09-01 자료는 기존 스터디의 관찰 이력으로 보존한다.
  - `https://toss.im/`의 2026-09-01 실시간 화면, 전체 lazy DOM, 계산된 CSS
  - `evidence/03-toss-hero-desktop.png`
  - `evidence/04-toss-hero-mobile.png`
  - `evidence/10-toss-assets-desktop.png`
  - `evidence/11-toss-finance-desktop.png`
  - `evidence/12-toss-invest-desktop.png`
  - `evidence/14-toss-assets-mobile.png`
  - `evidence/15-toss-finance-mobile.png`
  - `evidence/16-toss-business-mobile.png`
  - `evidence/30-toss-motion-globe-reference.png`
  - `evidence/31-toss-page-rail-reference.png`
  - `evidence/44-catalog-shell-reference.png`
  - `evidence/45-catalog-shell-light-final.png`
  - `data/toss-live-design-inventory.json`: 2026-09-01 전체 11개 lazy anchor 로드 후 안정 상태 DOM 2,765개, CSS 26개/370,115바이트 수집
  - `data/toss-live-design-catalog.json`: 중복 제거한 live source catalog
  - `scripts/collect-live-design.js`, `scripts/build-live-catalog.mjs`
- Important limit: 이 문서는 토스의 공식 TDS 명세가 아니다. 공개된 웹 화면에서 관찰한 값과 패턴을 구현 가능한 형태로 정리한 스터디다.

### Evidence labels

- **Observed**: 화면 캡처, DOM, 계산된 CSS에서 직접 확인한 값
- **Inferred**: 반복 패턴을 일반화한 구현 규칙
- **Recreated**: 공개 화면을 참고해 독립적으로 만든 동작 예제. 원본 내부 구현과 동일하다고 주장하지 않는다.
- **Source context**: 연결된 선택자·CSS 변수·DOM이 필요한 원본 선언. 미확인 동적 변수는 코드 주석과 metadata에 표시한다.

## Brand

- Personality: 명확하고 친근하며 자신감 있지만 과장하지 않는다.
- Trust signals: 실제 생활 장면, 실제 제품 UI, 구체적인 혜택, 짧고 단정적인 문장, 일관된 상호작용 색상
- Avoid:
  - 금융 전문용어를 먼저 내세우는 설명
  - 효과를 증명하지 못하는 추상 장식
  - 같은 중요도로 나열된 카드 모자이크
  - 많은 색을 동시에 쓰거나 그림자로 계층을 만드는 방식
  - “혁신적인”, “최고의”, “올인원” 같은 검증되지 않은 수식어

## Product goals

- Goals: 공개 화면의 요소를 찾고, 원본·재현 여부를 판단하고, 코드 또는 파일로 가져갈 수 있게 한다. 실제 원본 프레임과 재현 예제 모두 직접 조작할 수 있어야 한다.
- Non-goals: 토스 비공개 저장소 복원, 공식 TDS 배포, 실제 금융 거래, 원본 자산의 재사용 권리 부여.
- Success signals: 9개 범주를 검색·필터링하고 상세 보기·복사·다운로드·JSON 내보내기를 완료한다. 주요 기능은 1440/768/390px와 키보드에서 동작한다.

## Personas and jobs

- 개발자: 관찰한 CSS·SVG·미디어를 출처와 함께 가져와 적용한다. 필요한 변수와 원격 의존성을 구분한다.
- 디자이너: 색상·형태·타입·전환을 비교하고 원본 모션을 프레임 단위로 살펴본다.
- 사용 맥락: 데스크톱 작업, 모바일 검토, 네트워크 없이 로컬 스터디 자산 확인.

## Information architecture

- Primary navigation:
  - Desktop catalog shell: 높이 72px 고정 상단바, 240px 고정 라이브러리 사이드바, 전역 검색, 원본 링크
  - Mobile catalog shell: 사이드바를 숨기고 기존 메뉴 drawer에서 전체 섹션 제공
- Core routes/screens:
  - Overview → Source library → Original motion → Recreated motion lab → Foundations / patterns → Source coverage
- 기존 홈페이지 관찰 섹션:
  - 브랜드 약속
  - 송금
  - 자산 관리
  - 금융 비교
  - 투자
  - 쇼핑 및 판매자 도구
- Content hierarchy:
  1. 실제 사용 장면 또는 제품 결과
  2. 한 문장의 사용자 이점
  3. 짧은 근거 설명
  4. 한 개의 다음 행동
- Long-page orientation: 섹션 진행 표시는 보조 수단이다. 주요 섹션 제목과 배경 전환만으로도 현재 위치를 이해할 수 있어야 한다.

## Design principles

1. **Show the moment, then explain the product.** 제품 약속보다 실제 사용 장면을 먼저 보여준다.
2. **One section, one job.** 한 섹션은 한 가지 행동과 한 가지 이점만 설명한다.
3. **Complexity stays behind the interface.** 내부 복잡성은 숨기되 결과와 다음 행동은 구체적으로 보여준다.
4. **Hierarchy comes from scale and space.** 테두리와 그림자보다 글자 크기, 여백, 배경 전환으로 계층을 만든다.
5. **Motion reveals meaning.** 스크롤 효과는 장식이 아니라 과정, 전환, 상태 변화를 설명할 때만 쓴다.
- Tradeoffs:
  - 큰 이미지와 긴 스크롤은 브랜드 몰입을 높이지만 성능 비용이 크다. 모바일은 미디어 수와 동시 애니메이션을 줄인다.
  - 최소한의 크롬은 명료하지만 클릭 가능성이 약해질 수 있다. CTA는 형태, 대비, 문구 중 최소 두 가지 신호를 가진다.

## Visual language

### Color

Observed stylesheet frequency and semantic mapping:

| Role | Token | Value | Notes |
|---|---|---:|---|
| Brand action | `--color-blue-500` | `#3182f6` | CSS에서 가장 많이 등장한 유채색 |
| Brand action hover | `--color-blue-600` | `#1b64da` | 진한 상호작용 상태 |
| Brand soft | `--color-blue-50` | `#e8f3ff` | 선택/정보 배경 |
| Text strong | `--color-grey-900` | `#191f28` | 제목과 핵심 수치 |
| Text primary | `--color-grey-800` | `#333d4b` | 기본 본문과 내비게이션 |
| Text secondary | `--color-grey-700` | `#4e5968` | 보조 설명 |
| Text tertiary | `--color-grey-600` | `#6b7684` | 메타 정보 |
| Text muted | `--color-grey-500` | `#8b95a1` | 비활성/보조 라벨 |
| Border strong | `--color-grey-400` | `#b0b8c1` | 제한적으로 사용 |
| Border | `--color-grey-300` | `#d1d6db` | 입력/구획 |
| Surface muted | `--color-grey-100` | `#f2f4f6` | 버튼, 패널, 칩 |
| Surface subtle | `--color-grey-50` | `#f9fafb` | 페이지 분리 |
| Surface | `--color-white` | `#ffffff` | 기본 배경 |
| Danger | `--color-red-500` | `#f04452` | 오류/위험만 |
| Success | `--color-green-500` | `#03b26c` | 성공/상승만 |

Rules:

- 한 섹션의 기능 색상은 기본적으로 파랑 한 가지다.
- 본문 텍스트는 `grey-700`보다 옅게 쓰지 않는다.
- 장식 목적으로 상태 색상을 사용하지 않는다.
- 큰 이미지 위 텍스트는 실제 이미지 프레임마다 대비를 검사하고, 필요하면 국소 그라디언트 오버레이를 쓴다.

Current live source inventory:

- Computed background color: 136개. 전체 값과 사용 빈도는 `data/toss-live-design-catalog.json`에 보존한다.
- Current live grey: `#f6f7f9`, `#f2f4f7`, `#e8ebf0`, `#d4d9e1`, `#b8bdc5`, `#8f959e`, `#727780`, `#4e535c`, `#333840`, `#1c1f25`.
- Weak brand surface: `rgba(7, 25, 76, 0.05)`.
- Background image: computed 26개. 원본 URL과 gradient 조합을 catalog에서 확인한다.
- Gradient declaration: 54개. mask용 black/white gradient까지 포함하되 실제 surface에 쓰인 것과 구분한다.

Gradient roles:

- Surface tint: `--gradient-surface-blue-soft`
- Commerce action: `--gradient-commerce-action`
- Dark elevation: `--gradient-dark-elevation`
- Content fade: `--gradient-content-fade-up`, `--gradient-content-fade-down`
- Atmosphere: Global section은 CSS 근사 대신 공식 `footer-background.png`를 런타임에 사용한다.
- Gradient는 정보 전환, 대비 보호, mask, 상태 표현에만 사용한다. 빈 공간 장식용으로 추가하지 않는다.
- Catalog shell background: `--catalog-shell-background: #f7f8fa`, surface: `--catalog-shell-surface: #fff`.

### Typography

- Primary: `Toss Product Sans OTF`, `Toss Product Sans`
- Fallback: `Pretendard`, `Noto Sans KR`, sans-serif
- Weights: 400 body, 500 navigation/action, 700 headline
- Observed scale:

| Role | Desktop | Mobile | Weight |
|---|---|---|---:|
| Hero display | 80/96 | 40/46 | 700 |
| Section display | 56/67 | 36/46 | 700 |
| Section title | 40/56 | 28/41 | 700 |
| Card title | 20/30 | 20/29 | 700 |
| Body | 16/25.6 | 16/25.6 | 400 |
| Label/nav | 16/25.6 | 14/22.4 | 500 |
| Caption | 13/20 | 13/20 | 400–500 |

Rules:

- 한국어 제목의 자간은 기본값을 유지하거나 `-0.02em` 안에서만 줄인다.
- 제목은 의미 단위로 2–3줄 안에서 줄바꿈한다.
- 긴 본문은 36–42자 폭을 넘기지 않는다.
- 본문 최소 크기는 16px다.

### Spacing/layout rhythm

- Base unit: 4px
- Core scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 120, 160
- Observed desktop nav content width: 약 1,224px, 좌우 여백 108px at 1440px
- Observed hero: viewport 좌우 16px, nav 아래 시작, 큰 미디어 반경
- Observed mobile page gutter: 20px
- Content max widths:
  - Navigation: 1,224px
  - Narrative section: 1,296px
  - Readable copy: 560px
- Section spacing:
  - Desktop: 120–160px
  - Mobile: 80–120px

### Shape/radius/elevation

- Button: 12px
- Small component: 8–12px
- Card/panel: 20–32px
- Hero/media: 40px mobile, 48px desktop
- Pill: 100px or fully rounded
- Elevation: 기본은 없음. 떠 있는 상호작용 요소에만 낮은 블러 그림자를 쓴다.
- Live inventory: radius가 있는 330개 element를 direction-aware line, micro, circle, pill, control, panel, media의 45개 그룹으로 묶었다. 전체 sample width/height와 label은 catalog에 보존한다.
- Frequent observed groups: circle 50/80/100px, control 5/11/12/16px, panel 20/22/24/26/27px, media 32/33/36/40/48/50px, pill 100/9999px.

### Motion

- Fast feedback: 150ms (최신 공개 CSS 관찰)
- Component transition: 200ms (최신 공개 CSS 관찰)
- Section reveal: 600ms (스터디 재현 권장값)
- Recommended easing: `cubic-bezier(.2, .8, .2, 1)`
- Patterns:
  - scroll-driven image progression
  - copy focus/blur transition
  - UI state reveal tied to narrative
  - subtle button background/color transition
- `prefers-reduced-motion: reduce`에서는 진행 애니메이션을 제거하고 최종 상태를 바로 보여준다.

### Imagery/iconography

- Imagery: 실제 생활의 조용한 순간, 자연광, 과장되지 않은 표정, 제품 사용 맥락이 분명한 프레이밍
- Product imagery: 기기만 보여주기보다 손과 행동을 포함해 “무엇이 쉬워졌는지” 드러낸다.
- Icons: 단순한 단색 아이콘, 기능을 보조할 때만 사용한다. 장식용 원형 아이콘 세트는 피한다.

## Icon system

- Normalized source: `icons.svg`의 재사용 가능한 SVG symbol
- Live source inventory: inline SVG instance 70개 → 고유 SVG 36개(기능 아이콘 26, graphic SVG 10), image icon 7, CSS mask icon 12.
- Live source는 `data/toss-live-design-inventory.json`에 shape markup과 원본 URL을 보존하고 HTML catalog에서 모두 렌더링한다.
- Grid: 24×24px, 시각 요소는 바깥에서 최소 2px 안쪽에 배치
- Stroke: 1.75px, `round` line-cap과 line-join
- Sizes: 16px inline, 20px compact control, 24px default control, 32px featured status
- Color: `currentColor` 단색이 기본이다. 성공, 경고, 오류처럼 의미가 있을 때만 semantic status color를 쓴다.
- Labels:
  - 검색, 닫기처럼 널리 알려진 아이콘도 icon-only button에서는 접근 가능한 이름을 제공한다.
  - 송금, 자산, 혜택처럼 제품 고유 행동은 처음 노출할 때 텍스트 라벨과 함께 쓴다.
  - 아이콘을 본문 bullet이나 빈 공간 장식으로 사용하지 않는다.
- Optical rules:
  - 같은 nominal size에서도 원형 아이콘은 사각형 아이콘보다 0.5–1px 크게 보정할 수 있다.
  - 서로 다른 아이콘을 한 줄에 둘 때 외곽 크기보다 중심선과 시각 무게를 맞춘다.

## Data visualization and infographics

- Purpose: 숫자를 꾸미는 것이 아니라 비교, 구성, 변화 중 하나를 빠르게 판단하게 한다.
- Chart selection:
  - Bar: 항목 간 크기 비교
  - Donut: 3개 이하의 part-to-whole 구성, 정확한 값은 legend에 함께 표시
  - Line: 시간 변화, 축과 기간을 명시
- Semantic chart colors:
  - Primary: `--color-chart-primary`
  - Secondary: `--color-chart-secondary`
  - Neutral: `--color-chart-neutral`
  - Positive/negative: `--color-chart-positive`, `--color-chart-negative`
- Accessibility:
  - 색만으로 계열을 구분하지 않고 label, value, position을 함께 사용한다.
  - SVG chart에는 `title`과 `desc`를 제공하고, 핵심 결론은 화면 텍스트로 반복한다.
  - 퍼센트에는 기준 전체를, 증감률에는 비교 기간을 함께 표기한다.
- Motion: 데이터가 바뀔 때 200ms 이내의 transform/opacity 전환만 사용한다. 첫 로드에서 장시간 숫자를 카운트업하지 않는다.

## Shape language

- Circle: 상태점, 진행 단계, 사람처럼 단일 대상을 표시
- Line: 시간, 연결, 이동 방향처럼 두 항목의 관계를 설명
- Pill: 짧은 선택, 필터, 상태 라벨
- Rounded rectangle: 관련 콘텐츠와 제어의 경계
- Radius hierarchy: control 12px, small panel 20px, panel 32px, media 48px, pill 100px
- Rules:
  - 도형은 정보 구조를 설명해야 한다. 빈 공간을 채우는 blob, wave, floating circle은 사용하지 않는다.
  - 연결선에는 방향이나 관계 label을 붙인다.
  - 같은 화면에서 panel radius를 무분별하게 혼합하지 않는다.

## Scroll narrative and earth motion

- Source observation: 라이브 `toss.im`의 마지막 Global 섹션과 로드된 JavaScript, canvas, network asset
- Rotating Earth:
  - `https://static.toss.im/assets/toss-im/asset/framer-globe-dots.bin`의 13,149개 unit-vector point를 로컬 스터디 사본에서 읽는다.
  - 위도·경도 선은 10° 간격, 선 위 샘플은 2° 간격으로 만든다.
  - 초기 회전은 longitude -15°, latitude -25°, 속도는 6°/s다.
  - 30fps를 목표로 하고 frame delta는 100ms로 제한한다.
  - canvas DPR은 1.5, backing-store는 최대 4,000,000px로 제한한다.
  - section이 보이고 document가 활성화된 동안에만 회전한다.
- Background:
  - 공식 `footer-background.png`의 로컬 스터디 사본을 불러와 navy-to-blue 대기감을 유지한다.
  - 원본 URL과 SHA-256은 asset manifest에 보존한다. 로딩 실패 시 `--color-motion-fallback` 단색을 사용한다.
- Scroll behavior:
  - 300vh 구간의 100svh sticky stage를 사용한다.
  - 시작에서는 Global 설명을 먼저 보여주고, 스크롤하면서 copy를 낮추고 지구본을 위로 이동한다.
  - `prefers-reduced-motion: reduce`에서는 회전과 별 움직임을 멈추고 의미 있는 정적 상태를 바로 표시한다.
- Page rail:
  - 실제 페이지 구조와 같은 11개 anchor를 사용하고 현재 section을 `aria-current="location"`으로 노출한다.
  - hover/focus에서는 section label을 보여주며, dark section에서는 line과 label theme을 반전한다.
  - 클릭 시 URL hash를 갱신하고 대상 section으로 이동한다.
- Related source found but not used for this reference:
  - 송금 hero는 별도의 1920×1080 AVIF 138-frame canvas sequence와 66-frame WebP fallback을 사용한다.
  - 프레임 자산은 이번 Global 지구본 구현과 다른 source surface다.

## Components

- SourceExplorer: 9개 범주, 전역 검색, 근거 필터, 24/48개 분할 렌더링, 상세 dialog, 코드 복사·파일 다운로드·필터 JSON 내보내기.
- OriginalMotionPlayer: 실제 관찰한 프레임 374개 중 3개 다중 프레임 그룹, 수동 스크럽·재생·속도·정지, 원본 영상 15개. viewport/document/reduced-motion에 따라 자동 재생을 중단한다.
- MotionLab: 스크럽, 순차 등장, 확인 패널, 선택 상태, 아코디언, 처리→완료의 독립 재현 6종. 각 standalone HTML은 `data/motion-recipes.json`에 보존한다.
- CompactOverview: 출처 캡처 원래 비율을 보존하고 데이터에서 실제 수량을 표시한다.
- SourceExplorer preview: 흰색 SVG는 어두운 배경; 내장 PNG/WebP·SVG 필터를 보존하면서 script/event handlers는 제거한다. 실패 자산은 깨진 이미지 대신 수집 상태로 노출한다.
- Export ownership: `scripts/build-source-library.mjs`, `scripts/build-package.mjs`; source archive와 코드의 URL 대응은 manifest가 소유한다.


- Existing components to reuse:
  - `SiteNavigation`: desktop 64px / mobile 56px
  - `MediaHero`: 큰 실제 장면 + 하단 고대비 헤드라인
  - `NarrativeSection`: 제목, 제품 시연, 설명, CTA의 단일 흐름
  - `ProductDemoPanel`: 실제 앱 UI를 핵심 증거로 쓰는 패널
  - `SoftButton`: 옅은 회색 표면의 36–48px 액션
  - `PrimaryButton`: 파란색 단일 주 행동
  - `PillSelector`: 대출/카드/보험 같은 짧은 선택
  - `StoryProgress`: 긴 스크롤의 현재 섹션 표시
  - `LiveSourceCatalog`: 아이콘, 버튼, 도형, gradient, background를 검색·탭으로 탐색
  - `CatalogShell`: 고정 상단 검색, 라이브러리 사이드바, count badge, active section, mobile drawer
- New/changed components:
  - 스터디 구현은 `index.html`과 `components.css`에서 위 구성 요소의 최소 예시를 제공한다.
- Variants and states:
  - Button: default, hover, active, focus-visible, disabled
  - Card/panel: default, interactive hover, selected, loading
  - Navigation: desktop expanded, mobile collapsed, mobile open
  - Demo: loading, result, error/unsupported
  - Live button inventory: 현재 홈의 계산 스타일 25개 그룹. 36px compact, 48px default/icon, 12px radius soft action, 100px circular/pill control, transparent navigation/text action을 구분한다.
  - Global catalog search: 모든 범주를 대상으로 검색하고 카드 수와 필터 상태를 함께 갱신한다.
- Token/component ownership:
  - Primitive and semantic tokens: `tokens.css`
  - Figma collections and modes: `figma/figma-variables.json`
  - Tokens Studio import artifact: `figma/tokens-studio.json`
  - Reusable vector icons: `icons.svg`
  - Earth canvas implementation: `earth-motion.js`
  - Live source collector: `scripts/collect-live-design.js`
  - Catalog normalizer: `scripts/build-live-catalog.mjs`
  - Raw and normalized source: `data/toss-live-design-inventory.json`, `data/toss-live-design-catalog.json`
  - Catalog renderer: `live-catalog.js`, `catalog.css`
  - Original media player: `source-media.js`, `source-media.css`
  - Recreated motion: `motion-lab.js`, `motion-lab.css`
  - Layout and components: `components.css`
  - Design contract: `DESIGN.md`

## Accessibility

- Target standard: WCAG 2.2 AA
- Keyboard/focus behavior:
  - 모든 링크와 버튼은 DOM 순서가 시각 순서와 같아야 한다.
  - `:focus-visible`에 2px 파란 링과 2px 오프셋을 제공한다.
  - 모바일 메뉴는 열림 상태를 `aria-expanded`로 노출하고 Escape로 닫힌다.
- Contrast/readability:
  - 본문 4.5:1 이상, 큰 글자 3:1 이상
  - 사진 위 흰색 텍스트는 장면별 대비 검증 필수
  - 흐림 효과 중에도 최종 텍스트를 읽을 수 있는 대체 상태 필요
- Screen-reader semantics:
  - 섹션마다 고유한 제목을 연결한다.
  - 제품 UI 데모가 장식이면 숨기고, 정보 전달이면 상태를 텍스트로 함께 제공한다.
  - 반복 링크는 목적을 포함한 접근 가능한 이름을 사용한다.
- Reduced motion and sensory considerations:
  - 스크롤 고정, 패럴랙스, 자동 진행을 끄는 정적 대체 레이아웃 제공
  - 색상만으로 상승/하락/오류를 구분하지 않는다.
- Screenshot-only audit risks:
  - 전환 중 흐려진 텍스트와 옅은 회색 보조 텍스트는 대비 위험이 있다.
  - 좌측 진행 인디케이터는 작고 색 대비가 낮아 현재 위치 전달 수단으로 단독 사용하기 어렵다.
  - 키보드 포커스, 메뉴 포커스 트랩, 스크린리더 이름은 스크린샷만으로 확인할 수 없다.

## Responsive behavior

- Supported breakpoints/devices:
  - Compact: 0–374px
  - Mobile: 375–767px
  - Tablet: 768–1023px
  - Desktop: 1024–1439px
  - Wide: 1440px+
- Layout adaptations:
  - 1024px 이상은 240px sidebar + 72px topbar shell을 사용한다.
  - 1023px 이하는 sidebar를 숨기고 topbar 검색 + mobile menu 조합으로 전환한다.
  - Desktop 내비게이션 전체 메뉴는 mobile에서 단일 메뉴 진입점으로 바뀐다.
  - Hero margin 16px desktop → 20px mobile, radius 48px → 40px.
  - Hero 제목 80px 한 줄 중심 → 40px, 2–3줄 중앙 정렬.
  - 2열 narrative는 mobile에서 제목 → 제품 시연 → 설명 → CTA 순서로 재배치한다.
  - 모바일에서는 제품 시연을 화면 너비에 맞추고 보조 카드 수를 줄인다.
- Touch/hover differences:
  - 터치 대상 최소 44×44px
  - hover는 보조 신호다. 기본 상태만으로 클릭 가능성이 보여야 한다.
  - 스크롤 기반 핵심 정보는 터치 스크롤 한 구간 안에서 이해 가능해야 한다.

## Interaction states

- Loading: 스켈레톤은 최종 콘텐츠 구조와 같은 크기로 표시하고 레이아웃 이동을 막는다.
- Empty: 빈 이유, 사용자가 얻을 결과, 한 개의 다음 행동을 함께 제공한다.
- Error: 원인보다 복구 행동을 먼저 쓰고, 사용자의 입력이나 진행 상태를 보존한다.
- Success: 결과 수치와 완료된 행동을 즉시 보여주고 다음 행동은 하나만 제안한다.
- Disabled: 비활성 이유를 주변 문구 또는 도움말로 설명한다.
- Offline/slow network: 무거운 영상/3D 대신 정적 포스터와 텍스트를 먼저 렌더링한다.
- Tabs: `tablist`, `tab`, `tabpanel` 관계를 노출하고 Left/Right/Home/End 키를 지원한다.
- Switch: 현재 값을 `aria-checked`로 노출한다. 켜짐과 꺼짐을 색만으로 구분하지 않고 label을 갱신한다.
- Async action: 눌림은 150ms 안에 표시하고, 처리 중에는 `aria-busy`와 구체적인 진행 문구를 제공한다.
- Status message: 완료, 경고, 오류는 icon + headline + recovery/action text 조합을 쓴다.
- Reveal motion: 화면 진입은 600ms 이내의 opacity/transform으로 제한하고 reduced motion에서는 최종 상태를 즉시 표시한다.
- Page rail: 현재 section, hover label, hash 이동을 함께 제공하고 화면 폭 1024px 미만에서는 mobile menu가 같은 역할을 맡는다.
- Sidebar: viewport 중심 section을 `aria-current="location"`으로 표시하고 모든 기존 section anchor를 유지한다.
- Global search: `/` 단축키로 focus하고 Enter 시 모든 소스 범주를 검색한다.
- 원본 선언의 선택자·변수 의존성은 상세 설명·코드 주석에 표시한다.
- Dialog 닫기·Escape 모두 작동하고 시작 카드로 포커스가 돌아온다. 복사 결과는 dialog 안에서 안내한다.
- 처리 중 화면을 벗어나면 실행을 중단하고 다시 누를 수 있는 상태로 돌아온다.

## Content voice

- Tone: 쉬운 한국어, 짧은 문장, 사용자가 얻는 결과부터 설명
- Terminology:
  - 기능명보다 사용 행동을 우선한다. 예: “자산 통합 조회”보다 “내 자산 모아보기”
  - 금융 용어는 필요할 때만 쓰고 바로 풀어 쓴다.
- Microcopy rules:
  - 제목: 문제를 줄이거나 결과를 약속하는 한 문장
  - 설명: 두 문장 이내, 구체적인 과정 또는 범위
  - CTA: 명사보다 동사 중심. “대출”보다 “내게 맞는 대출 찾기”
  - 한 영역에 주 CTA는 하나만 둔다.

## Implementation constraints

- Framework/styling system: 현재 저장소는 프레임워크가 없으므로 HTML과 CSS만 사용한다.
- Design-token constraints:
  - 원시 색상은 직접 컴포넌트에서 쓰지 않고 semantic token을 거친다.
  - 새 간격과 반경은 기존 scale에 추가하기 전 이유를 문서화한다.
  - 사용자의 소스 수집 요청에 따라 공개 미디어는 로컬 스터디 사본을 보관한다. 폰트·영상은 원본 경로만 보존한다. 원본 자산 권리는 출처에 있으며 다운로드 키트는 공식 자산 라이선스를 부여하지 않는다.
  - Raw live source는 관찰 증거다. 제품 토큰으로 승격할 때는 `tokens.css`의 semantic alias를 거친다.
  - Gradient는 Figma variable에서 STRING으로 보존한다. 전체 54개 원본 선언은 catalog가 소유한다.
- Performance constraints:
  - 초기 핵심 화면의 텍스트는 미디어 로딩과 독립적으로 렌더링한다.
  - 영상은 poster, lazy loading, reduced-motion 대체를 갖는다.
  - 애니메이션은 transform/opacity 중심으로 구성한다.
- Compatibility constraints: 최신 2개 버전의 Chrome, Safari, Firefox, Edge; iOS Safari와 Android Chrome 우선 검증
- Test/screenshot expectations:
  - 1440×1000, 768×1024, 390×844에서 시각 검증
  - 키보드 탭 순서, 200% zoom, reduced motion, high contrast를 수동 점검
  - 색 대비는 자동 검사와 실제 이미지 프레임 샘플을 함께 확인
  - 최신 수집·빌드·검증 명령은 README.md와 source-coverage.md에 기록한다.
  - 기존 regression + `node scripts/test-source-library.mjs` + `node scripts/test-system.mjs`로 데이터·해시·브라우저 흐름을 검증한다.
  - Catalog shell visual baseline: `evidence/44-catalog-shell-reference.png`, final: `evidence/45-catalog-shell-light-final.png`

## Audit summary

1. **Hero and global navigation, healthy:** 브랜드, 내비게이션, 앱 CTA, 실제 사용 장면, 핵심 문장이 한 화면에서 명확한 순서를 가진다.
2. **Asset management section, healthy:** 제목 → 제품 화면 → 설명 → 행동 순서가 mobile에서 특히 분명하다.
3. **Financial comparison section, watch:** 흐림과 밝은 그라디언트 전환은 서사를 만들지만 중간 프레임의 가독성과 reduced-motion 대체가 필요하다.
4. **Investment section, healthy with density risk:** 세 개의 실제 기능 UI가 제품의 깊이를 증명하지만 작은 수치와 라벨은 확대/대비 검증이 필요하다.
5. **Commerce section, healthy:** 소비자 장면에서 판매자 도구로 넘어가도 큰 제목, 제품 예시, 짧은 근거라는 동일한 문법을 유지한다.

## Open questions

- [ ] Toss Product Sans의 정식 사용 권한과 배포 경로를 제품 소유자가 확인해야 한다. 미확인 시 Pretendard/Noto Sans KR fallback 사용.
- [ ] 실제 프로덕션에서 이미지 위 텍스트 대비를 프레임별로 자동 검증할지 결정 필요.
- [ ] 54,000px 이상 길이의 스크롤 서사를 그대로 유지할지, 제품 목적에 맞춰 섹션 수를 줄일지 결정 필요.
- [x] 모바일 메뉴 Escape·포커스 복귀, source dialog 복사·다운로드·키보드, reduced motion을 Chromium에서 검증했다.
- [ ] Safari·Firefox·실제 모바일 기기 및 전체 WCAG 자동검사는 후속 검증 범위다.

## Studio shell

- 뷰어의 셸(사이드바·상단바·워크스페이스·푸터)은 Apple 스튜디오 셸 공통 규격 `../All/shell/SPEC.md`를 따른다.
- 뼈대는 `studio-shell.css`(구조·치수)와 `studio-shell.js`(모바일 내비 토글·브레드크럼 동기화·토스트)가 담당하며, 두 파일은 `../All/shell/shell.css`·`shell.js`의 복사본이므로 직접 수정하지 않는다.
- 브랜드 색·서체는 `studio-brand.css`에서 `tokens.css`의 토큰을 `--as-*` 변수(`--as-accent`, `--as-ink`, `--as-line`, `--as-sidebar-bg` 등)에 매핑해 연결한다. 셸의 치수·간격·타입 크기는 바꾸지 않는다.
- 같은 파일에 옛 셸 규칙(고정 `.site-nav`, `.catalog-sidebar`, `main`/`.footer`의 사이드바 오프셋) 무력화와 `.as-sidebar-scrim[hidden]` 보정만 둔다.
- 사이드바는 기존 Library / Foundations / Patterns 그룹을 `.as-sidebar-label` + `<nav>` 반복으로 옮기고 01–14 번호를 이어서 매긴다. 전역 검색·`원본 보기`·`Export tokens`(→ `tokens.css`)는 `.as-topbar-tools`에 모인다.
