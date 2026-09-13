# Design

## Source of truth

- **Status:** Active · 2026-09-07
- **Surfaces:** 기존 여섯 catalog section과 생성 JSON/CSS, 로컬 source workbench
- **Evidence reviewed:** 2026-09-01 제품 캡처 6개, 현행 viewer screenshot, 공식 Material Web token source, Material Symbols guide 및 commit-pinned upstream SVG
- **Evidence contract:** `observed`는 날짜가 있는 제품 측정값, `documented`는 공식 upstream token, `reconstructed`는 이 프로젝트의 유사 구현입니다. 신규 인증 제품 캡처는 수행하지 않았습니다.

## Brand

차분하고 정확한 작업 도구. 출처와 실행 가능한 예제로 신뢰를 만듭니다. 제품 마크 재구성, 브랜드 gradient의 독립 자산 위장, 장식성 무한 모션을 피합니다.

## Product goals

- 기존 raw에 포함된 시각 값과 상태를 출처별로 찾고 재사용할 수 있게 합니다.
- 공식 오픈 SVG·CSS token·독립 recipe를 복사하거나 내려받을 수 있게 합니다.
- 성공 기준: 근거 분류, 검색·다운로드·상태 샘플 동작, 1440/390px 검증과 생성 hash 일치.

## Personas and jobs

디자이너는 제품별 시각 차이와 상태를 비교합니다. 프론트엔드 개발자는 SVG·CSS·JSON을 재사용하고 키보드 및 reduced-motion 상태를 확인합니다.

## Information architecture

기존 개요 / 파운데이션 / 컴포넌트 / 인터랙션 / 아이콘·일러스트 / 출처·라이선스의 여섯 경로를 유지합니다. 파운데이션에는 관찰값·도형·표면을, 인터랙션에는 모션 실험을, 아이콘에는 로컬 SVG와 gradient recipe를 통합합니다.

## Design principles

실측·공식 문서·유사 구현을 구분하고, 원본 캡처의 범위를 전체 제품의 완전한 수집으로 과장하지 않습니다. 동일한 토큰을 미리보기와 복사 코드에 사용합니다.

## Visual language

아래 Typography / Color / Spacing / Layout / Motion 기준을 따릅니다. 기존 palette와 density를 유지하며 도형·표면·gradient 표본에서만 시각 실험을 제공합니다.

## Product Context

- **What this is:** Gmail, Calendar, Drive, Meet, Finance에서 반복되는 Google 제품 UI 문법을 개인 데이터 없이 추출한 구현·참조 카탈로그
- **Who it's for:** 제품 디자이너와 프론트엔드 개발자
- **Space/industry:** 생산성, 커뮤니케이션, 파일 관리, 일정, 데이터 대시보드
- **Project type:** 디자인 시스템 문서 + 정적 인터랙티브 카탈로그
- **Memorable thing:** 서로 다른 제품이지만 한 번 보면 같은 Google 제품군으로 느껴지는 일관성

## Aesthetic Direction

- **Direction:** Calm utilitarian Material
- **Decoration level:** intentional
- **Mood:** 밝고 읽기 쉬운 표면, 낮은 그림자, 명확한 tonal selection, 작은 상태 변화. 장식보다 작업 속도와 정보 계층을 우선한다.
- **Reference products:** Gmail, Google Calendar, Drive, Meet, Google Finance
- **Boundary:** Google 브랜드 정체성을 모방하거나 제품 로고를 재사용하지 않는다. 관찰한 UI grammar를 독립 토큰과 컴포넌트 계약으로 재구현한다.

## Typography

- **Display/Hero:** Google Sans, 32–36px, 400–500. 공식 Google Fonts bundle을 사용할 때만 해당 라이선스를 보관한다.
- **Body:** Google Sans Text → Roboto → Arial, 14–16px, 400
- **UI/Labels:** Google Sans Text, 11–14px, 500
- **Data/Tables:** Google Sans Text 또는 Roboto, tabular figures 사용
- **Icons:** Material Symbols Rounded, 기본 24px
- **Scale:** 11, 12, 14, 16, 18, 20, 22, 24, 32, 36px
- **Observed:** 다섯 제품에서 14px가 가장 많이 반복되고, Google Sans/Google Sans Text 계열이 UI 위계를 만든다.

## Color

- **Approach:** restrained semantic color
- **Primary:** `#0b57d0`, 주요 행동·선택·focus
- **Primary container:** `#d3e3fd`, selected navigation·tonal action
- **Secondary container:** `#c2e7ff`, 정보성 표면·보조 선택
- **Tertiary:** `#0b8043`, 성공·안전·positive 상태
- **Surface:** `#ffffff`
- **Surface dim:** `#f8fafd`
- **Surface container low:** `#f2f6fc`
- **On surface:** `#1f1f1f`
- **On surface variant:** `#444746`
- **Outline variant:** `#c4c7c5`
- **Error:** `#b3261e`
- **Finance positive/negative:** `#0b8043` / `#c0151d`
- **Dark mode:** 단순 반전이 아니라 `#131314`–`#303134` 표면과 저채도 semantic colors로 역할을 다시 배치한다.

정확한 light/dark 값은 `data/curated/tokens.json`과 `tokens.css`를 사용합니다.

## Spacing

- **Base unit:** 4px
- **Density:** compact-to-comfortable
- **Scale:** 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- **Rule:** 목록과 데이터 화면은 4–12px, card와 page inset은 16–32px를 우선한다.

## Layout

- **Approach:** grid-disciplined application shell
- **Top app bar:** 64px
- **Navigation rail:** 80px
- **Navigation drawer:** 256px
- **Touch target:** 최소 48px
- **Max content width:** 1440px
- **Breakpoints:** 600, 840, 1200, 1440px
- **Border radius:** 4, 8, 12, 16, 20, 28, full
- **Product pattern:** top search + utility actions, left task navigation, optional right utility rail, rounded main surface

## Components

공통 컴포넌트는 시각 복제보다 anatomy와 state 계약을 우선합니다.

- Navigation: top app bar, drawer, rail, tabs, side panel
- Input: search bar, filter chip
- Actions: filled, tonal, outlined, icon button, FAB
- Content: dense list row, data card, calendar grid
- Feedback: banner, snackbar, dialog, empty state

동일한 anatomy를 공유하는 항목은 중복 컴포넌트로 복제하지 않고 `family`와 `variant`로 관계를 표시합니다. 현재 button family는 filled, tonal, outlined, icon, floating-action variant로 구분하며, navigation drawer·rail·tabs·top app bar는 각각 고유한 구조 demo를 갖습니다.

세부 anatomy와 서비스 사용처는 `data/curated/components.json`과 `docs/COMPONENTS.md`를 따릅니다.

## Motion

- **Approach:** minimal-functional
- **State layer:** 50–100ms
- **Standard transition:** 200ms
- **Dialog/expand:** 200–300ms
- **Long transition:** 최대 500ms
- **Easing:** `cubic-bezier(.2,0,0,1)`
- **Rule:** hover·focus·press·selection의 원인을 보여줄 때만 움직인다. scroll decoration과 과도한 choreography는 사용하지 않는다.

## Asset Policy

- Material Symbols: Apache-2.0 공식 소스
- Roboto: OFL-1.1
- Google Sans: 공식 Google Fonts bundle과 그 license가 함께 있을 때만 사용
- Google 제품 로고·아이콘·스크린샷·일러스트: 참고 전용, 배포 자산에서 제외
- 제품 source registry와 서비스 맵의 대표 심볼: 사용자가 요청한 로컬 관찰용 reference-only preview로만 표시합니다. 이미지는 Google이 호스팅하는 원본 HTTPS URL에서 직접 불러오며 `assets/` 또는 생성 HTML에 image bytes를 복사·embed하지 않습니다. 제품 UI 구현 아이콘으로 재사용하지 않습니다.
- 대표 심볼 표시 규격: square icon은 natural size를 넘겨 확대하지 않고 최대 52×52px optical box에 맞춥니다. Gmail·Meet lockup은 변경하지 않은 원본에서 leading symbol 40×40px만 clip하며, 카드에는 원본 크기와 표시 크기를 별도로 노출합니다. Finance의 흰 배경 앱 아이콘은 흰 optical canvas에서 표시해 중첩된 사각형처럼 보이지 않게 합니다.

## Meet Reference Asset Tokens

- **Selected navigation capsule:** 112×64px, radius 32px, background `#C9E6FD`, icon `#061C33`, label `#1967D2`
- **Security banner:** height 128px, radius 64px, computed background `#D3E3FD`, official shield fills `#4285F4`, `#185ABC`, white
- **New meeting CTA:** 214×111px, radius 56px, computed background `#C4EED0`, icon/text `#072711`
- **Product mark source:** official observed PNG 124×40 plus user-provided full lockup crop 568×162. Exact pixel accent palette includes `#FBB100`, `#FECC05`, `#FECA03`, `#FFD00A`; neutral wordmark pixels center on `#212226`–`#202028`.
- **Product mark gradient:** raster-sampled visualization only, `linear-gradient(135deg, #FFD00A 0%, #FECC05 48%, #FBB100 100%)`; do not recreate the product mark publicly
- **Illustration cup gradient:** official SVG gradient `id=a`, `x1=257.5`, `y1=104.033`, `x2=10.96`, `y2=157.859`, stops `45% #FFC6EF` → `61% #FFDB0F`
- **Illustration solid fills:** pink `#FFC6EF`, sun/yellow `#FFDB0F`, pencil `#FDFD6D`
- **Illustration stroke:** native SVG default 1px, colors `#1F1F1F` and black, round caps/joins. The screenshot renders near 1.95px because the 315px SVG is scaled to about 615px.
- **Implementation icon axes:** Material Symbols `FILL 0`, `wght 500`, `GRAD 0`, `opsz 24`; render 36px for rail icons, 40px for shield substitute, 32px for video-plus
- **Private evidence:** 원본 제품 마크, 아이콘, banner, empty-state illustration은 `viewer-private/`에서만 표시한다.
- **Exact-source library:** 관찰된 공식 platform images 37개를 원본 bytes, SHA-256, natural dimensions, palette, SVG paths/fills/strokes/gradients와 함께 private viewer에 표시한다.

## Interaction Samples

- 기존 8개 contract와 switch, checkbox, keyboard-tabs, menu, text-field, progress의 6개 유사 구현 contract를 설명 카드와 작동 sample로 통합합니다.
- 각 contract는 하나의 sample과 일대일로 연결하며, 별도의 반복 playground 영역을 만들지 않습니다.
- drag-drop은 pointer drag를 지원하고 keyboard·touch 접근을 위한 click fallback을 함께 제공합니다.

## Privacy Contract

- 사용자 텍스트는 raw JSON에 수집하지 않는다.
- 캡처 전에 계정, 메일, 일정, 파일, 관심 목록 텍스트를 일반 placeholder로 치환한다.
- 캡처는 `references-private/`에만 저장하고 gitignore한다.
- 공개 viewer는 원본 캡처를 embed하지 않는다.

## Decisions Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-09-01 | Gmail을 기준 서비스로 사용 | 가장 많은 navigation, search, row, tab, hover, banner, snackbar 상태를 한 화면에서 제공 |
| 2026-09-01 | 서비스 공통 raw schema 사용 | Calendar, Drive, Meet, Finance를 동일한 builder와 viewer로 확장 가능 |
| 2026-09-01 | 화면 증거와 배포 자산 분리 | 개인정보와 Google 브랜드 사용 제한을 동시에 지킴 |
| 2026-09-01 | 오픈 자산은 공식 upstream만 사용 | 브라우저 캐시나 제품 bundle에서 font/icon을 추출하지 않음 |
| 2026-09-01 | 제품 대표 심볼은 official-hosted reference-only preview로 표시 | 사용자가 요구한 실제 색감과 심볼을 보여주되 로컬 배포 자산에 제품 이미지 bytes를 복사하지 않음 |
| 2026-09-01 | 인터랙션 설명과 sample을 contract 카드에 통합 | 별도 playground와 contract 목록이 같은 내용을 반복하던 구조를 제거하고 8개 계약을 모두 직접 실행 가능하게 함 |
| 2026-09-01 | 제품 레지스트리의 내부 코드를 사용자용 정보로 번역 | status·category·redistribution 원문 코드는 데이터에 유지하되 화면에는 한국어 의미, 원본/표시 크기, 분리된 제품/정책 action을 노출 |


## Accessibility

WCAG 2.2 AA를 목표로 키보드 조작·가시적인 focus·명시적인 label·상태 알림을 구현합니다. 색만으로 선택과 오류를 구별하지 않습니다. `prefers-reduced-motion`에서는 위치 이동·회전을 생략하고 상태는 즉시 갱신합니다. 이 목표는 전체 준수 인증을 의미하지 않습니다.

## Responsive behavior

기존 desktop drawer/mobile bottom navigation을 유지하며 모든 신규 grid는 600px 이하에서 한 열로 전환합니다. 긴 CSS/URL은 카드 안에서 줄바꿈하거나 독립 스크롤합니다. 주요 조작 타깃은 48px 이상입니다.

## Interaction states

기존 8개와 신규 6개 계약은 카드 안에서 실행합니다. menu는 Escape·바깥 클릭·focus 복원, tab은 방향키·Home·End, field는 helper/error/success, progress는 진행·완료를 표시합니다. 모션 lab은 사용자 재생에만 반응하며 navigation 시 진행 중 작업을 정리합니다. 다운로드는 로컬 자료만 사용하고 복사 실패 시 수동 선택 가능한 코드로 대체합니다.

## Content voice

한국어 작업 용어를 우선하고 CSS token과 API 이름은 원문을 사용합니다. 실측 여부와 출처는 짧은 badge와 상세 link로 표시합니다. 구현 설명을 실제 제품 콘텐츠처럼 표현하지 않습니다.

## Implementation constraints

Node.js 표준 라이브러리 기반 정적 빌드, 추가 dependency 없음. source 변경 후 `npm run check`. upstream SVG는 수정 없는 bytes·SHA-256·고정 commit·Apache-2.0 license를 함께 보관합니다. CSS spacing token은 실제 길이 단위(px)를 포함합니다. 생성 HTML과 source 모듈을 hash 검증합니다.

## Open questions

- [ ] 신규 인증 제품 화면의 모션 실측 — 소유자: 향후 인증 브라우저 세션. 현재는 기존 캡처와 공식 token을 활용하며 제품별 정확한 duration은 미확인입니다.
- [ ] 기존 raw에 없는 반응형·오류·loading 화면 — 소유자: 후속 수집. 현재 샘플은 명시적인 유사 구현입니다.

## Source workbench recipes

`data/curated/design-library.json`은 공식 모션 16단계, easing, state opacity, 도형 12개, 표면 8개, 독립 gradient 6개, 출처별 관찰값을 보관합니다. 500ms 초과 duration은 upstream scale 문서용이며 실제 lab은 최대 500ms입니다. 유사 gradient는 브랜드 원본이 아니며 기존 두 개 Meet 참고 gradient와 구분합니다.

## Studio shell

뷰어 셸(사이드바·상단바·워크스페이스·푸터)은 공통 규격 `../All/shell/SPEC.md`의 Apple 스튜디오 포맷을 따릅니다. 뼈대는 `viewer/studio-shell.css`와 `viewer/studio-shell.js`(공통 `All/shell/shell.css`·`shell.js` 사본)가 담당하며, 모든 셸 클래스는 `as-` 접두어를 씁니다.

브랜드 색·서체는 셸을 고치지 않고 `viewer/template.html`의 `<style id="gds-studio-brand">` 블록에서 `--gds-*`/Material 시맨틱 토큰을 `--as-*`로 매핑합니다. `--gds-*`가 `[data-theme="dark"]`에서 다시 정의되므로 다크 모드는 같은 매핑을 그대로 따라갑니다.

콘텐츠는 위치만 옮기고 삭제하지 않습니다. 검색(`#search`), 테마 전환(`#theme`), Export tokens(`data/curated/tokens.css`)는 `.as-topbar-tools`로, 개요 CTA는 `.as-title-actions`(전체 소스 ZIP · 토큰 CSS)로, 나머지 다운로드 3종은 workbench `관찰에서 바로 구현으로` 섹션에 남습니다. `viewer/index.html`은 생성물이므로 항상 `viewer/template.html`을 고치고 `npm run check`로 재생성합니다.
