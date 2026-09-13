# Design

## Source of truth

Status: Active · 2026-09-07. 이 저장소는 Wanted Montage 공개 사이트의 재사용 카탈로그다. 제품 UI 복제 대신 디자인 자산·토큰·예제·동작을 탐색하고 꺼내 쓰는 것이 목적이다.

- 원본: https://montage.wanted.co.kr/ · 2026-09-01 정규화 캡처를 보존하고 2026-09-07에 264페이지를 재검증했다.
- 공식 구현: `assets/montage/source/upstream/`, `data/curated/source-manifest.json`의 고정 버전·해시를 따른다. 웹 캡처와 패키지 버전을 동일시하지 않는다.
- 시각 근거: `captures/refresh/source-*.png`, `data/raw/live-home-evidence.json`, `data/raw/site-observations.json`.
- 카탈로그 생성 소스: `scripts/build-viewer.mjs`. 생성 HTML만 수정하지 않는다.
- 재사용: `data/curated/tokens.css`, `recipes.css`, `reuse-library.json`. 원본 확인은 `docs/SOURCE_RESEARCH.md`.

## Brand

밝고 명료한 정보 계층, 원티드 블루, 중립적인 면, 둥근 형태와 부드러운 도형 그라데이션을 유지한다. Wanted 자산은 출처 확인용으로 전시한다. 다른 제품을 원티드로 오인하게 만드는 로고 사용을 피한다.

## Product goals

모든 공개 문서와 수집 자산에 도달할 수 있고, 코드·SVG·CSS·JSON을 실제로 복사하거나 다운로드할 수 있게 한다. 확인된 동작과 유사 구현의 경계를 설명한다. 비공개 Figma 레이어, 서버 코드, 인증 자료는 수집했다고 주장하지 않는다.

## Personas and jobs

디자이너는 색·도형·표면·컴포넌트 상태를 비교한다. 개발자는 플랫폼별 원문 예제와 CSS 레시피를 꺼내 쓴다. 유지보수자는 출처·버전·수집 범위와 해시를 확인한다.

## Information architecture

기존 Overview, Foundations, Components, Tokens, Gradients, Shapes, Icons, Utilities를 유지한다. Motion, Interactions, Surfaces, Assets, Sources를 추가해 동작·원본 이미지·코드/파일 내보내기를 연결한다. 검색은 현재 영역에 적용하고 결과 수와 빈 상태를 보여 준다.

## Design principles

원본 자산과 기존 토큰 우선. 실제 코드와 생성한 데모는 분리해서 표시. 필요한 정보만 펼쳐 보이는 구조. 라이트·다크·키보드·모바일에서 같은 작업을 완료할 수 있는 것을 우선한다.

## Visual language

색·타입·간격·그림자는 아래 수집 기준을 사용한다. 재사용 클래스에는 시멘틱 토큰을 적용한다. 원문 또는 브라우저에서 관찰한 값은 출처와 함께 보관하고, 출처가 불분명한 보완 값은 `approximation`으로 표시한다.

### 원칙

- Extensibility: 컴포넌트 확장성을 유지하는 구조
- Consistency: 일관된 사용자 경험
- Efficiency: 일관된 품질로 제품 개발 효율 향상

### 타이포그래피

기본 글꼴은 Pretendard JP (한·영·일 지원). 브랜드 표기용으로 Wanted Sans 변수도 정의돼 있다.

```css
@import url("https://static.wanted.co.kr/fonts/pretendard/pretendard-jp/pretendardvariable-jp-dynamic-subset.min.css");
@import url("https://static.wanted.co.kr/fonts/wantedsans/WantedSansVariable.min.css");

body { font-family: "Pretendard JP Variable", Pretendard, var(--font-family-wanted-sans); }
```

| Style | Size | Line height | Letter spacing | 용도 |
| --- | --- | --- | --- | --- |
| Display 1 | 56px | 72px | -0.0319em | 히어로 |
| Display 2 | 40px | 52px | -0.0282em | 랜딩 헤드라인 |
| Display 3 | 36px | 48px | -0.027em | |
| Title 1 | 32px | 44px | -0.0253em | 페이지 제목 |
| Title 2 | 28px | 38px | -0.0236em | |
| Title 3 | 24px | 32px | -0.023em | 섹션 제목 |
| Heading 1 | 22px | 30px | -0.0194em | 카드·다이얼로그 제목 |
| Heading 2 | 20px | 28px | -0.012em | |
| Headline 1 | 18px | 26px | -0.002em | 리스트 제목 |
| Headline 2 | 17px | 26px | 0em | |
| Body 1/Normal | 16px | 24px | 0.0057em | 본문 기본 |
| Body 1/Reading | 16px | 26px | 0.0057em | 긴 글 |
| Body 2/Normal | 15px | 22px | 0.0096em | 보조 본문 |
| Body 2/Reading | 15px | 24px | 0.0096em | |
| Label 1/Normal | 14px | 20px | 0.0145em | 버튼·폼 라벨 |
| Label 1/Reading | 14px | 22px | 0.0145em | |
| Label 2 | 13px | 18px | 0.0194em | 작은 라벨 |
| Caption 1 | 12px | 16px | 0.0252em | 캡션·메타 |
| Caption 2 | 11px | 14px | 0.0311em | 배지 |

제목류(Display~Headline)는 음수 자간, 본문·라벨·캡션은 양수 자간이다. 굵기는 제목 600~700, 본문 400, 라벨 500~600을 기본으로 한다.

### 색

시멘틱 토큰만 쓴다(`--semantic-*`). 아토믹 토큰(`--atomic-*`, 14개 팔레트 × 명도 단계)은 새 시멘틱 값을 정의할 때만 참조한다.
모든 색 토큰은 `-rgb` 짝(`--semantic-primary-normal-rgb: 0, 102, 255`)이 있어 `rgba(var(--…-rgb), .2)` 형태로 알파를 줄 수 있다.
라이트 값은 `:root`, 다크 값은 `[data-theme="dark"]` 블록에 있다. 다크 모드는 `<html data-theme="dark">`로 켠다.

### 핵심 역할 (light / dark)

| 역할 | 토큰 | Light | Dark |
| --- | --- | --- | --- |
| Primary | `--semantic-primary-normal` | `#0066ff` | `#3385ff` |
| Primary 강조 1단계 | `--semantic-primary-strong` | `#005eeb` | |
| Primary 강조 2단계 | `--semantic-primary-heavy` | `#0054d1` | |
| 페이지 배경 | `--semantic-background-normal-normal` | `#ffffff` | `#1b1c1e` |
| 페이지 배경(대안) | `--semantic-background-normal-alternative` | `#f7f7f8` | `#0f0f10` |
| 떠 있는 면 | `--semantic-background-elevated-normal` | `#ffffff` | `#212225` |
| 본문 텍스트 | `--semantic-label-normal` | `#171719` | `#f7f7f8` |
| 강조 텍스트 | `--semantic-label-strong` | `#000000` | |
| 보조 텍스트 | `--semantic-label-neutral` | `#2e2f33e0` | |
| 3차 텍스트 | `--semantic-label-alternative` | `#37383c9c` | `#aeb0b69c` |
| 힌트 텍스트 | `--semantic-label-assistive` | `#37383c47` | |
| 비활성 텍스트 | `--semantic-label-disable` | `#37383c29` | |
| 구분선(투명) | `--semantic-line-normal-normal` | `#70737c38` | |
| 구분선(불투명) | `--semantic-line-solid-normal` | `#e1e2e4` | `#37383c` |
| 필드·칩 채움 | `--semantic-fill-normal` | `#70737c14` | |
| 성공 | `--semantic-status-positive` | `#00bf40` | `#1ed45a` |
| 경고 | `--semantic-status-cautionary` | `#ff9200` | `#ffa938` |
| 오류 | `--semantic-status-negative` | `#ff4242` | `#ff6363` |
| 상태 배경 | `--semantic-background-status-{positive,cautionary,negative}` | 8% 틴트 | |
| 비활성 면 | `--semantic-interaction-disable` | `#f4f4f5` | |
| 비활성 컨트롤 | `--semantic-interaction-inactive` | `#989ba2` | |
| 딤 | `--semantic-material-dimmer` | `#17171985` | |
| 반전(다크 카드 등) | `--semantic-inverse-{background,label,primary}` | | |
| 고정 흑백 | `--semantic-static-{black,white}` | | |

### 액센트

`--semantic-accent-foreground-{blue,cyan,green,lightBlue,lime,orange,pink,purple,red,redOrange,violet}`(텍스트·아이콘용, 대비 확보),
`--semantic-accent-background-{cyan,lightBlue,lime,pink,purple,redOrange,violet}`(배경·태그용). 브랜드 강조가 아닌 분류·데이터 구분에만 쓴다.

### 간격·그리드

- 8px 기반 체계, 권장 간격은 4px 배수. 시각 보정은 2px, 불가피할 때 1px.
- Gutter 20px. 컬럼: 모바일 2, 태블릿 3, 데스크탑 12.
- 컨테이너: `--layout-max-width: 1060px`, `--layout-padding-inline: 40px`. GNB 높이 `--gnb-height: 62px`.
- 브레이크포인트: xs 0–768, sm 768–992, md 992–1200, lg 1200–1600 (max 1100px), xl 1600~ (max 1440px).
- 아트보드: Web 1440×960, Mobile 375×635, iOS 375×812pt, Android 360×800dp.

### 엘리베이션

그림자는 토큰만 쓴다. 세 계열이 있다.

- `--semantic-elevation-shadow-normal-{xsmall,small,medium,large,xlarge}`: `box-shadow`용. 카드·드롭다운·팝오버·모달 순으로 단계를 올린다.
- `--semantic-elevation-shadow-drop-{xsmall…xlarge}`: `filter`용 `drop-shadow` 체인. 비정형 도형·이미지에 쓴다.
- `--semantic-elevation-shadow-spread-{small,medium}`: 넓게 퍼지는 강조 그림자. 히어로 카드 정도에만 쓴다.

### 아이콘

- 24×24 SVG 339종, `currentColor` 유지. 이름은 `Icon{PascalCase}` (예: `IconSearch`, `IconChevronRight`).
- 파일: `assets/montage/icons/{Name}.svg`, 메타: `data/curated/icon-vectors.json`.
- 색은 부모의 `color`로 준다. 기본 크기 24px, 작은 UI는 20px/16px로 축소.

### 컴포넌트

53개, 6 카테고리. 상세 anatomy·상태·플랫폼별 코드는 `data/curated/components.json`과 `docs/COMPONENTS.md`.

- Actions: Action area, Button, Chip, Icon button, Text button
- Contents: Accordion, Avatar, Avatar group, Card, Content badge, List card, List cell, Play badge, Section header, Table, Thumbnail
- Feedback: Alert, Fallback view, Push badge, Section message, Snackbar, Toast
- Loading: Loading, Skeleton
- Navigations: Bottom navigation, Category, Page counter, Pagination, Pagination dots, Progress indicator, Progress tracker, Tab, Top navigation
- Presentation: Autocomplete, Bottom sheet, Menu, Popover, Popup, Tooltip
- Selection and input: Check mark, Checkbox, Date picker, Filter button, Framed style, Radio, Search field, Segmented control, Select, Slider, Switch, Text area, Text field, Time picker

버튼 기본 규칙: Primary는 `primary-normal` 채움 + `static-white` 텍스트. hover/pressed 상태색은 원본 문서에 명시돼 있지 않으므로 `primary-strong` → `primary-heavy` 순으로 쓰되 추정값임을 밝힌다. disabled는 `interaction-disable` 배경 + `label-disable` 텍스트. Secondary는 `fill-normal` 배경 + `label-normal` 텍스트. 라벨은 Label 1 (14px/600).


## Components

53개 컴포넌트의 원문·플랫폼·예제를 유지한다. 컴포넌트 갤러리에서는 원문 코드를, Interactions에서는 로컬에서 작동하는 네이티브 데모를 제공한다. Box·radius·elevation·gradient 레시피는 `reuse-library.json`과 `recipes.css`에서 생성한다.

## Accessibility

명시적 라벨, semantic HTML, 키보드 focus-visible, 상태 알림 aria-live, 다이얼로그 Escape·포커스 복귀를 적용한다. 모션은 사용자 실행을 기본으로 하고 `prefers-reduced-motion`에서 반복·이동을 제한한다. 스크린샷만으로 WCAG 준수를 주장하지 않는다.

## Responsive behavior

1440px 데스크톱과 390px 모바일에서 검증한다. 탐색은 작은 화면에서 흐름에 맞게 재배치하고, 카드·코드·이미지는 화면 밖으로 넘치지 않는다. 긴 코드는 코드 영역 안에서 스크롤한다. 호버 기능은 버튼·키보드로도 접근 가능해야 한다.

## Interaction states

검색 결과 없음, 클립보드 실패, 복사 성공, 다운로드, 버튼 로딩/disabled, switch/checkbox/radio, accordion, tabs, range, dialog, toast를 확인한다. hover와 press는 상태를 분명히 하고, 비활성 컨트롤은 실행되지 않는다. 원본 Lottie JSON과 정적 SVG는 별도 다운로드로 제공하고, 임시 프리뷰 모션을 원본 Lottie 재생이라고 부르지 않는다.

## Content voice

한국어로 짧고 구체적으로 안내한다. 원본 문서의 컴포넌트 영문 이름은 검색과 코드 대조를 위해 유지한다. `documented`는 문서·공개 소스, `observed`는 브라우저 측정, `approximation`은 로컬 유사 구현을 뜻한다. 수집되지 않은 자료를 완전한 원본으로 표현하지 않는다.

## Implementation constraints

정적 HTML·CSS·JavaScript, Node/Python 표준 라이브러리 빌더를 유지한다. 앱 의존성 추가 없이 구현한다. 공식 React 코드는 원본이며 해당 프로젝트의 의존성이 필요하다. 프리뷰는 로컬 HTTP 서버로 열고, 테스트는 설치된 Playwright를 사용한다. 생성 과정에서 원본 소스를 실행하지 않는다.

## Open questions

- [ ] 비공개 Figma 편집 레이어와 내부 프로덕션 구현은 확인되지 않았다. 담당: 출처 제공자. 영향: 공개 렌더링/코드 근거가 없는 부분은 유사 구현으로 한정한다.
- [ ] 폰트 CSS는 공식 CDN을 사용한다. 오프라인 첫 방문에서는 시스템 폰트로 표시될 수 있다. 담당: 재사용 프로젝트.

## Studio shell

카탈로그 뷰어의 셸(뼈대)은 Apple 스튜디오 셸 규격(`../All/shell/SPEC.md`)을 따른다. 좌측 고정 사이드바 232px(브랜드 마크 + WORKSPACE 01~13 내비 + 수집 상태·출처), 65px sticky 상단바(브레드크럼 + 검색·테마 토글·Export tokens), `.as-workspace` 본문, `.as-studio-footer` 순서다.

뼈대는 `viewer/studio-shell.css`와 `viewer/studio-shell.js`가 담당하며 `../All/shell/shell.css`·`shell.js`의 사본이다. 치수·간격·타입 크기는 수정하지 않는다. CSS는 `@layer studio-shell`로 로드해 Montage 브랜드 규칙이 항상 우선하고, 브랜드 색·서체는 `scripts/build-viewer.mjs`의 `:root { --as-* }` 블록에서 기존 `--semantic-*` 토큰과 Pretendard JP / Wanted Sans에 매핑한다. 다크 모드는 시멘틱 토큰을 통해 그대로 따라간다.

셸 마크업은 `scripts/build-viewer.mjs`가 생성한다. 생성 HTML(`viewer/index.html`)은 직접 수정하지 않는다. 640px 이하에서는 사이드바가 오프캔버스 드로어가 되고 상단바의 `☰`로 연다.
