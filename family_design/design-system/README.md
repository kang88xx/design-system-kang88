# Family System 1.0.0

프로젝트에 가져다 쓰는 CSS 토큰, 컴포넌트 스타일, 네이티브 JavaScript 인터랙션입니다. 외부 런타임 패키지, 원본 Family 폰트, 이미지·MP4, 원본 사이트 번들 없이 동작합니다.

## 빠른 시작

### 폴더 복사

`design-system/` 폴더를 프로젝트의 정적 파일 위치로 복사합니다.

```html
<link rel="stylesheet" href="./design-system/styles.css">
<div class="fds" id="project-ui" data-fds-theme="light">
  <button class="fds-button" type="button">계속하기</button>
</div>
<script type="module">
  import { initFamilySystem } from './design-system/index.js';
  const ui = initFamilySystem(document.querySelector('#project-ui'));
  // 이 화면을 제거하기 직전에 호출합니다.
  // ui.destroy();
</script>
```

CSS만 사용하는 버튼·폼·카드에는 JavaScript 초기화가 필요하지 않습니다. `examples/starter.html`은 실제 컴포넌트를 조합한 설정 화면과 코드 예제를 제공합니다. ES 모듈 예제는 HTTP 서버에서 엽니다.

```sh
cd design-system
python3 -m http.server 8000
# http://127.0.0.1:8000/examples/starter.html
```

### 로컬 패키지 설치

제공된 `family-design-system-1.0.0.tgz`를 프로젝트로 복사합니다. npm 레지스트리에 게시된 패키지를 전제로 하지 않습니다.

```sh
npm install ./family-design-system-1.0.0.tgz
```

```js
import '@family-design/system/styles.css';
import { initFamilySystem } from '@family-design/system';
const ui = initFamilySystem(document.querySelector('#project-ui'));
```

패키지 폴더에서 `npm pack`으로 같은 형식의 아카이브를 다시 만들 수 있습니다. 공개 배포는 이 프로젝트의 작업 범위에 포함되지 않아 `private: true`로 설정되어 있습니다.

## 컴포넌트 규약

| 구성 | 클래스 / 속성 | 동작·상태 |
| --- | --- | --- |
| 범위·테마 | `.fds`, `data-fds-theme="light\|dark"` | 스타일 적용 범위, 기본 라이트 |
| 버튼 | `.fds-button`, `data-variant`, `data-size` | primary(기본), secondary, ghost, danger; sm/md/lg |
| 버튼 상태 | `disabled`, `aria-busy="true"` | 로딩 중 행동 방지는 소비자가 disabled도 설정 |
| 입력 | `.fds-field`, `.fds-input`, `.fds-select`, `.fds-textarea` | 레이블 연결, `aria-invalid`, 도움말·오류 연결 |
| 선택 | `.fds-checkbox`, `.fds-radio` | 실제 네이티브 input에 적용 |
| 안내 | `.fds-help`, `.fds-error` | `aria-describedby`로 입력과 연결 |
| 카드·배치 | `.fds-card`, `.fds-stack`, `.fds-cluster`, `.fds-grid` | 내용·간격·반응형 배치 |
| 상태 | `.fds-badge`, `.fds-alert`, `data-tone` | neutral/success/warning/danger, 텍스트와 함께 표현 |
| 로딩 | `.fds-skeleton`, `.fds-spinner` | 모션 감소 설정 반영; 장식은 aria-hidden |
| 탭 | `[data-fds-tabs]`, tablist/tab/tabpanel | 화살표·Home/End 이동, Enter/Space 활성화 |
| 아코디언 | `[data-fds-accordion]`, 네이티브 details/summary | `data-exclusive="true"`일 때 한 항목만 열기 |
| 대화상자 | `.fds-dialog`, 네이티브 dialog | 열기·닫기·Escape·포커스 복귀 |
| 드롭다운 | `[data-fds-dropdown]` | 클릭·Escape·영역 밖 클릭·포커스 이탈 닫기 |

`.fds-tabs`는 tablist의 스타일 컨테이너입니다. 내부 버튼에 `.fds-tab`과 `role="tab"`을 함께 사용합니다. 드롭다운은 일반 링크를 담는 disclosure이며 메뉴 역할·특수 메뉴 키보드 규약을 부여하지 않습니다.

### 입력 검증

```html
<label class="fds-field" for="email">
  <span>이메일</span>
  <input class="fds-input" id="email" type="email"
    required aria-invalid="true" aria-describedby="email-error">
  <span class="fds-error" id="email-error">이메일을 확인해 주세요.</span>
</label>
```

실제 폼 제출·비즈니스 검증·로딩·저장은 소비 프로젝트가 담당합니다. 오류를 해소하면 `aria-invalid`와 오류 메시지를 함께 갱신합니다. `examples/starter.js`에 네이티브 validity를 이용한 실행 예제가 있습니다.

### 탭

```html
<div data-fds-tabs>
  <div class="fds-tabs" role="tablist" aria-label="설정 구분">
    <button class="fds-tab" type="button" role="tab" id="general-tab"
      aria-selected="true" aria-controls="general-panel">일반</button>
    <button class="fds-tab" type="button" role="tab" id="team-tab"
      aria-selected="false" aria-controls="team-panel" tabindex="-1">팀</button>
  </div>
  <div role="tabpanel" id="general-panel" aria-labelledby="general-tab">일반 설정</div>
  <div role="tabpanel" id="team-panel" aria-labelledby="team-tab" hidden>팀 설정</div>
</div>
```

ID는 문서에서 고유해야 합니다. 화살표는 포커스만 이동하고 Enter/Space 또는 클릭이 선택을 바꿉니다. 세로 탭은 tablist에 `aria-orientation="vertical"`을 지정합니다. 사용 불가 탭은 실제 `disabled` 버튼으로 표현합니다.

### 대화상자

```html
<button class="fds-button" type="button" data-fds-dialog-open="settings-dialog">설정</button>
<dialog class="fds-dialog" id="settings-dialog" aria-labelledby="settings-title">
  <div class="fds-dialog-header"><h2 id="settings-title">설정</h2></div>
  <div class="fds-dialog-body">대화상자의 내용을 넣습니다.</div>
  <div class="fds-dialog-actions">
    <button class="fds-button" type="button" data-fds-dialog-close>닫기</button>
  </div>
</dialog>
```

열기 버튼과 dialog를 같은 초기화 root 안에 둡니다. 라이브러리는 자신이 연 dialog의 정리만 담당합니다. 이 root 밖에 있는 portal의 dialog는 해당 버튼으로 제어하지 않습니다. portal이 필요한 경우 소비 프로젝트의 dialog 상태 관리와 CSS를 함께 사용하거나, 열기 버튼과 dialog를 모두 포함하는 하나의 root를 초기화합니다.

## 테마와 토큰

`tokens.json`이 프로젝트용 토큰의 기준이며 `tokens.css`는 생성 결과입니다. 원본 추출값은 참고 근거로 연결하고, 텍스트·상태·포커스 대비를 위해 조정한 시맨틱 색상은 이 패키지의 적용 값으로 구분합니다. 원본 루트 `tokens.json`과 이름·역할이 다릅니다.

```css
/* styles.css를 가져온 뒤 프로젝트 테마를 덮어씁니다. */
.my-project.fds {
  --fds-primary: #243a73;
  --fds-on-primary: #ffffff;
  --fds-font-body: system-ui, -apple-system, "Segoe UI", sans-serif;
  --fds-font-display: var(--fds-font-body);
}
```

```html
<div class="fds my-project" data-fds-theme="dark">...</div>
```

컴포넌트 내부의 `--fds-*` 역할을 프로젝트에서 재정의할 수 있습니다. 전경/배경을 한 쌍으로 설정하고 라이트·다크의 실제 대비를 다시 확인합니다. 토큰의 정확한 이름·출처는 `tokens.json`, 적용 CSS는 `tokens.css`에서 확인합니다.

### 토큰 수정·재생성

Python 3.10 이상이 있는 환경에서 키트 폴더 안에서 실행합니다. 추가 Python 패키지는 필요하지 않습니다.

```sh
cd design-system
# tokens.json 수정 후 CSS 갱신
python3 tools/build-tokens.py
# CI에서 생성 파일·별칭·기본 테마 대비 확인
python3 tools/build-tokens.py --check
```

검증이 실패하면 누락·순환 별칭 또는 대비 기준을 먼저 수정합니다. `tokens.css`를 직접 수정하면 다음 생성 때 덮어써지므로 프로젝트별 조정은 별도 CSS에서 덮어쓰세요.

## React에서 연결

아래 패턴은 DOM을 라이브러리가 관리하는 비제어형 영역입니다. 서버 렌더링 중 초기화하지 않습니다.

```tsx
'use client';
import { useEffect, useRef } from 'react';
import '@family-design/system/styles.css';
import { initFamilySystem } from '@family-design/system';

export function Settings() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!root.current) return;
    const ui = initFamilySystem(root.current);
    return () => ui.destroy();
  }, []);
  return <div className="fds" ref={root}>
    <button className="fds-button" type="button">계속하기</button>
  </div>;
}
```

탭·패널의 선택 상태를 React state로 직접 제어한다면 CSS만 사용하고 ARIA/키보드 동작을 해당 컴포넌트에서 구현합니다. 새 인터랙션 마크업을 추가한 경우 기존 인스턴스를 정리하고 갱신된 root에서 재초기화합니다. 초기화 후 콘텐츠를 제거할 때도 `destroy()`를 먼저 호출합니다.

## Vue에서 연결

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import '@family-design/system/styles.css';
import { initFamilySystem, type FamilySystemController } from '@family-design/system';
const root = ref<HTMLElement | null>(null);
let ui: FamilySystemController | undefined;
onMounted(() => { if (root.value) ui = initFamilySystem(root.value); });
onBeforeUnmount(() => ui?.destroy());
</script>
<template>
  <div class="fds" ref="root">
    <button class="fds-button" type="button">계속하기</button>
  </div>
</template>
```

React/Vue용 별도 의존 패키지를 제공하는 방식이 아닙니다. CSS와 DOM 수명 주기를 연결하는 패턴입니다.

## 수명 주기·이벤트

- `initFamilySystem(root)`는 전달한 영역에서 컴포넌트를 초기화합니다. 같은 root를 중복 초기화할 때 이벤트가 중복 등록되지 않게 처리합니다.
- 반환 객체의 `destroy()`는 이벤트와 라이브러리가 관리한 상태를 정리합니다. 여러 번 호출해도 안전합니다.
- `fds:tabchange`: 선택한 탭과 패널의 `{ tabId, panelId }`.
- `fds:dialogchange`: dialog의 `{ id, open }`.
- 모듈 import 자체는 DOM에 접근하지 않으므로 서버 환경에서도 가져올 수 있습니다. 초기화는 DOM이 존재할 때 수행합니다.

## 검증 범위

원본 사이트·미디어를 제외한 독립 소비 프로젝트에서 패키지 설치·import, 라이트/다크, 키보드, 상태·포커스, 다중 인스턴스·정리, CSS 범위, 반응형·대비를 검사합니다. 정확한 실행 결과와 사용 브라우저는 전체 작업물의 `references/v4-review/`에 기록합니다. 접근성 검사는 점검한 항목의 증거이며 모든 제품 흐름의 자동 인증을 의미하지 않습니다.
