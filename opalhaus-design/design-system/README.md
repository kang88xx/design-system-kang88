# Opalhaus System 1.0.0

`family_design/design-system`과 같은 설치형 구조로 정리한 Opalhaus 프로젝트 키트입니다. Inter Tight 중심의 큰 타이포그래피, `#ff5d17` 오렌지, 미색 배경, pill CTA, 프로젝트 카드와 편집형 섹션 레이아웃을 기존 사이트에 적용할 수 있습니다. 외부 런타임 의존성은 0개입니다.

## 빠른 시작

### 폴더 복사

`design-system/` 폴더를 정적 파일 경로로 복사합니다.

```html
<link rel="stylesheet" href="./design-system/styles.css">
<main class="ods" id="studio">
  <section class="ods-container ods-section ods-stack">
    <span class="ods-eyebrow">Independent studio</span>
    <h1 class="ods-display" data-ods-reveal>Ideas into impact.</h1>
    <a class="ods-button" href="/contact">Let's talk ↗</a>
  </section>
</main>
<script type="module">
  import { initOpalhaus } from './design-system/index.js';
  const ui = initOpalhaus(document.querySelector('#studio'));
  // 동적으로 컴포넌트를 추가한 뒤: ui.refresh();
  // 화면을 제거하기 직전: ui.destroy();
</script>
```

```sh
cd design-system
python3 -m http.server 8000
# http://localhost:8000/examples/starter.html
```

### 로컬 npm 설치

```sh
npm install ./opalhaus-design-system-1.0.0.tgz
```

```js
import '@opalhaus-design/system/styles.css';
import { initOpalhaus } from '@opalhaus-design/system';
const ui = initOpalhaus(document.querySelector('.ods'));
```

npm 레지스트리에 게시하지 않았습니다. `private: true`이며 폴더에서 `npm pack`으로 다시 묶을 수 있습니다. React/Vue는 키트 의존성이 아닙니다. 예제는 해당 프레임워크가 이미 있는 프로젝트에 복사합니다.

## 원본 근거와 재구현 범위

| 분류 | 포함 내용 | 근거 |
| --- | --- | --- |
| extracted | 오렌지·잉크·화이트·미색·투명 색상 8개 | 추출 저장소 `design/original-tokens.json` |
| measured | Inter Tight, desktop display 150/165px, heading 62px, body 16px | `design/computed-design.json`, `design/tokens.css` |
| extracted | desktop ≥1200, tablet 810–1199, mobile ≤809 | `design/__framer__breakpoints.json` |
| reconstructed | semantic aliases, 간격 스케일, 접근성 상태, 이식용 컴포넌트와 CSS duration | 이 키트의 구현 결정 |

`tokens.json`은 모든 토큰에 `status`와 `evidence`를 기록합니다. 근거 경로는 원본 자료 저장소 기준이며 실행 시 필요하지 않습니다. fallback 폰트는 휴대성을 위한 추가입니다. 토큰 이름이 같아도 원본에 정의되지 않은 semantic 이름은 재구현으로 표시했습니다.

이 키트는 원본 Framer 편집 파일이나 원본 런타임 번들이 아닙니다. 원본의 spring damping/stiffness/mass/delay는 저장소 `design/motion-presets.js`에 있습니다. CSS의 350ms/650ms는 spring 값을 ms로 변환한 값이 아니라 시각적 의도를 이식한 근사치입니다. 스크롤 등장, label roll, 카드 확대, ticker를 제공하며 모든 원본 경로·상태·커서·페이지 전환을 재현한다고 주장하지 않습니다.

## 토큰 수정

```css
/* 기본 CSS 뒤에 로드. 다른 사이트 스타일에 전역 reset을 적용하지 않습니다. */
.my-brand.ods {
  --ods-accent: #ff5d17;
  --ods-background: #f8f7f5;
  --ods-font: 'Inter Tight', Arial, sans-serif;
  --ods-container: 1440px;
  --ods-page-gutter: 32px;
  --ods-section-space: 100px;
}
```

`styles.css`가 `tokens.css`를 가져옵니다. 별도 토큰 소비는 `@opalhaus-design/system/tokens.json`을 사용합니다. JSON 수정 후 `python3 tools/build-tokens.py`로 CSS를 재생성합니다. 반응형 display는 150/106/70px, heading은 62/50/40px입니다. 한글 중심 페이지에는 읽기 쉬운 별도 본문 폰트를 `--ods-font`로 지정할 수 있습니다.

## 컴포넌트 API

| 구성 | 클래스·속성 | 규약 |
| --- | --- | --- |
| 적용 범위 | `.ods` | 배경·본문·토큰을 적용할 최상위 컨테이너 |
| 배치 | `.ods-container`, `.ods-section`, `.ods-stack`, `.ods-cluster`, `.ods-grid` | gap은 `--ods-gap`, 열 수는 `--ods-columns`; 모바일 grid 1열 |
| 타입 | `.ods-display`, `.ods-heading`, `.ods-body-lg`, `.ods-muted` | 의미에 맞는 h1–h6/p 태그 사용 |
| 섹션 | `.ods-section-header`, `.ods-eyebrow` | desktop 1:2, mobile 세로; 주황 dot |
| CTA | `.ods-button`, `data-variant="dark\|outline"` | 기본 orange, 최소 높이 48px, disabled/busy/focus |
| rolling label | `.ods-button__window` > `.ods-button__label[data-label]` | CSS hover/focus roll; 중복 텍스트는 같은 값 |
| 태그 | `.ods-tag` | 텍스트 분류; 선택 동작은 별도 버튼으로 |
| 미디어 카드 | `.ods-media-card`, `__media`, `__meta`, `__title` | 4:3, img/video cover, hover scale 1.04 |
| 서비스 행 | `.ods-service-row`, `__title`, `__arrow` | 3열, 상단 rule, 화살표 회전 |
| FAQ | `details.ods-faq`, `summary`, `.ods-faq__answer` | 네이티브 Enter/Space; 여러 항목 열기 허용 |
| 내비게이션 | `.ods-nav`, `[data-ods-nav-toggle]`, `[data-ods-nav-panel]` | disclosure; Escape/외부 클릭/포커스 이탈 닫기 |
| 폼 | `.ods-field`, `.ods-input`, `.ods-textarea`, `.ods-select` | required, disabled, aria-invalid, focus |
| 피드백 | `.ods-help`, `.ods-error`, `.ods-status[data-tone]` | tone success/error; 상태 텍스트도 함께 제공 |
| 등장 | `[data-ods-reveal]` | viewport 8%, translateY 32px→0; 1회 |
| 흐르는 문구 | `.ods-ticker`, `__track`, `__group`, `[data-ods-ticker-toggle]` | 반복 그룹 2개, pause toggle, hover/focus pause |

### Rolling CTA

```html
<a class="ods-button" href="/contact" aria-label="Let's talk">
  <span class="ods-button__window" aria-hidden="true">
    <span class="ods-button__label" data-label="Let's talk">Let's talk</span>
  </span>
  <span aria-hidden="true">↗</span>
</a>
```

중복된 generated content가 접근성 이름에 포함되지 않도록 window에는 `aria-hidden`, 컨트롤에는 `aria-label`을 지정합니다. `button`에는 `type="button"` 또는 `submit`을 명시합니다. `aria-busy`는 진행 상태 표현이며 중복 제출 방지는 소비자가 `disabled`로 처리합니다. 비활성 버튼은 네이티브 disabled를 우선 사용합니다. `a[aria-disabled=true]` 클릭 방지는 초기화된 링크에만 제공됩니다.

### 카드와 서비스

```html
<a class="ods-media-card" href="/work/aurora">
  <div class="ods-media-card__media"><img src="/images/aurora.webp" alt="Aurora 패키지 디자인" width="1200" height="900" loading="lazy"></div>
  <div class="ods-media-card__meta"><h3 class="ods-media-card__title">Aurora Home</h3><span class="ods-tag">Branding</span></div>
</a>
<a class="ods-service-row" href="/services/brand">
  <span>01</span><h3 class="ods-service-row__title">Brand strategy</h3><span class="ods-service-row__arrow" aria-hidden="true">→</span>
</a>
```

### FAQ

```html
<details class="ods-faq">
  <summary>어떤 프로젝트를 함께 하나요?</summary>
  <div class="ods-faq__answer">브랜드 전략부터 웹사이트 디자인까지 함께합니다.</div>
</details>
```

FAQ는 JS 없이 동작합니다. 답변 열림 높이 애니메이션을 억지로 적용하지 않아 콘텐츠 높이가 변해도 잘리지 않습니다.

### 모바일 내비게이션

```html
<nav class="ods-nav" aria-label="주 메뉴">
  <a href="/">Studio®</a>
  <button class="ods-button" type="button" data-ods-nav-toggle
    aria-controls="main-links" aria-expanded="false">메뉴</button>
  <div id="main-links" data-ods-nav-panel>
    <a href="/work">Work</a><a href="/contact">Contact</a>
  </div>
</nav>
```

panel id와 aria-controls가 일치해야 초기화됩니다. ID는 문서 내 유일해야 합니다. JS 전에는 모든 링크가 보입니다. JS 후 모바일에서 닫힘 상태로 시작합니다. desktop으로 바뀌면 링크는 항상 보입니다. 일반 navigation disclosure이므로 modal이나 menu 역할, focus trap을 부여하지 않습니다.

### 폼 상태

```html
<div class="ods-field">
  <label for="project-email">이메일</label>
  <input class="ods-input" id="project-email" name="email" type="email"
    autocomplete="email" required aria-invalid="true" aria-describedby="email-error">
  <p class="ods-error" id="email-error">이메일 주소를 확인해 주세요.</p>
</div>
<p class="ods-status" data-tone="success" role="status">문의가 접수되었습니다.</p>
```

입력값 검증, 오류 속성 설정, 서버 전송과 결과 처리는 프로젝트에서 연결합니다. 제공 starter는 네이티브 validation 이후 로컬 성공 메시지만 표시합니다.

### Ticker와 등장 효과

```html
<div class="ods-ticker" aria-label="전문 영역">
  <button class="ods-button" type="button" data-ods-ticker-toggle aria-pressed="false">흐르는 문구 일시 정지</button>
  <div class="ods-ticker__track">
    <div class="ods-ticker__group"><span>Strategy · Identity · Digital ·</span></div>
    <div class="ods-ticker__group" aria-hidden="true"><span>Strategy · Identity · Digital ·</span></div>
  </div>
</div>
<h2 class="ods-heading" data-ods-reveal style="--ods-reveal-delay:120ms">Selected work.</h2>
```

ticker 두 그룹의 내용과 너비는 같아야 하며 각 그룹이 컨테이너 너비 이상을 채워야 빈 구간이 생기지 않습니다. 반복 그룹에는 링크·버튼 등 포커스 가능한 요소를 넣지 않습니다. 지속 모션에는 pause 버튼을 제공합니다. reduced-motion에서는 애니메이션이 중단되고 중복 그룹이 숨겨집니다. 등장 요소는 JS/IntersectionObserver가 없을 때 그대로 보입니다.

## JavaScript 수명 주기

```ts
function initOpalhaus(root?: Document | Element): {
  refresh(): void;
  destroy(): void;
}
```

마운트된 DOM에서 실행합니다. 같은 root로 재호출하면 활성 컨트롤러를 반환합니다. `refresh()`는 새로 추가된 요소를 초기화합니다. `destroy()`는 이벤트·observer를 정리하고 JS가 수정한 attributes를 초기 상태로 돌립니다. destroy 이후 재초기화할 수 있습니다. 한 DOM 하위 트리는 컨트롤러 한 개가 소유하도록 설정합니다. 중첩 root를 동시에 초기화하지 않습니다. 프레임워크가 소유하는 `hidden`, `aria-expanded` 상태와 직접 경쟁하지 않도록 내비게이션 속성은 키트에 맡깁니다.

React: `examples/react.jsx`의 useEffect cleanup 패턴을 사용합니다. Vue: `examples/vue.vue`의 onMounted/onBeforeUnmount 패턴을 사용합니다. SSR 렌더 중 init을 호출하지 않습니다. 목록 갱신 후 React effect 또는 Vue nextTick에서 `ui.refresh()`를 호출합니다.

## 폰트·자산

기본 키트는 시스템 fallback으로 독립 실행됩니다. 원본 폰트와 이미지를 포함하지 않습니다. 정확한 폰트 연결법과 자산 경계는 [ASSETS.md](./ASSETS.md)를 확인하세요. 예제의 두 프로젝트 썸네일은 로컬 CSS placeholder이며 원본 이미지가 아닙니다.

## 접근성과 적용 전 확인

- 오렌지 CTA에 어두운 글씨를 사용합니다. 주황색 위 흰색 소형 텍스트는 피하세요.
- 포커스 outline, 네이티브 FAQ, Escape, disabled, 오류 설명과 reduced-motion을 제공합니다.
- 섹션 제목 레벨·링크 이름·대체 텍스트·실제 validation은 소비 프로젝트의 콘텐츠에 맞춥니다.
- dark 버튼과 outline 버튼을 제공하며 완전한 dark theme는 별도 정의가 필요합니다.
- `.ods` 내부는 box-sizing을 통일합니다. 호스트의 높은 specificity 또는 전역 `!important` 규칙과 충돌하면 호스트 CSS를 조정하세요.

## 재생성·검증

추출 저장소 루트에서 `python3 scripts/build-project-kit.py`로 ZIP/tgz를 만듭니다. `python3 scripts/verify-project-kit.py`로 파일·토큰·패키지 독립성을 검사합니다. 브라우저 행동 검증은 저장소 `scripts/verify-project-kit-browser.cjs`에 있습니다. 외부 테스트 도구는 개발 검증용이며 배포 패키지 의존성이 아닙니다.
