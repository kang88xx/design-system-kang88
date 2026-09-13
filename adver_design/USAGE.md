# Adver Design System 1.0.0 — 프로젝트 적용 계약

프로젝트용 파일은 `releases/adver-system-1.0.0.zip`입니다. 압축을 풀고 `starter/index.html`을 열면 별도 서버·패키지 설치 없이 테마, 브랜드 변경, 여러 컴포넌트와 콜백 연결을 확인할 수 있습니다. 스타터의 콜백은 로컬 예제이며 실제 전송하지 않습니다.

## 가져갈 파일

| 사용 목적 | 필요한 파일 |
| --- | --- |
| 공통 토큰 | `design-system/tokens.scoped.css` |
| 6개 모션·시각 효과 | `motion-kit.css` + `motion-kit.js` |
| 7개 인터랙션 | `interaction-kit.css` + `interaction-kit.js` |
| 복사할 마크업 | `components/{id}.html` 또는 `components.json` |
| JavaScript에서 선택할 마크업 | 선택 사항: `design-system/components.js` |

모든 CSS·JS는 `design-system/` 안에 있습니다. 전체 13종이 필요하지 않으면 사용하지 않는 kit는 연결하지 않아도 됩니다. `components.js`는 마크업 데이터이고 자동으로 화면을 만들지 않습니다. `page-kit.*`, `showcase.*`, `lab.*`, `sources.*`는 프로젝트용 패키지에 포함되지 않습니다.

`landing.html`과 `page-kit.*`는 독립 페이지 템플릿입니다. 글로벌 body/heading/form 스타일과 페이지 전체 초기화를 포함하므로 기존 앱에 일부 섹션만 삽입하면서 함께 로드하지 마세요. 기존 앱에는 아래 scoped runtime과 components 마크업을 사용합니다.

## 가장 작은 통합

```html
<link rel="stylesheet" href="design-system/tokens.scoped.css">
<link rel="stylesheet" href="design-system/interaction-kit.css">
<div class="adver-system" data-theme="light" id="campaign"></div>
<script src="design-system/interaction-kit.js"></script>
<script src="design-system/components.js"></script>
<script>
  const root = document.getElementById('campaign');
  const component = AdverComponents.components.find(item => item.id === 'tabs');
  root.innerHTML = component.html; // 패키지에 포함된 신뢰할 수 있는 마크업
  const cleanup = ReferenceInteractions.mount(root);
  // 이 화면을 제거할 때 cleanup();
</script>
```

같은 페이지에 여러 개를 넣을 때는 컨테이너 ID를 서로 다르게 지정하거나 생성한 Element 참조를 직접 전달하세요. 인터랙션 내부의 ID와 ARIA/label/anchor 참조는 mount가 충돌하지 않게 바꿉니다. 외부 코드에서 컴포넌트 내부의 원래 ID에 의존하지 말고, 소유 컨테이너와 `data-ri-*` 속성으로 접근하세요.

## 테마와 브랜드 수정

`tokens.json`이 색상·서체·간격·시간의 기준값입니다. 저장소에서 수정한 경우 `python3 scripts/build-release.py`로 CSS와 패키지를 함께 재생성합니다. 프로젝트에서 일부만 바꿀 때는 토큰 CSS 뒤에 소유 영역의 값을 덮어쓰세요.

```css
.my-product.adver-system {
  --font-body: system-ui, sans-serif;
  --font-display: system-ui, sans-serif;
  --color-action: #1d4ed8;
  --color-action-hover: #1e40af;
  --color-on-action: #fff;
  --radius-pill: 12px;
}
.my-product.adver-system[data-theme="dark"] {
  --color-action: #93c5fd;
  --color-action-hover: #bfdbfe;
  --color-on-action: #101010;
}
```

소유 요소의 `data-theme` 값은 `light`, `dark`, `system`입니다. system은 OS 변경을 CSS로 따라갑니다. 중첩된 명시적 light/dark도 지원합니다. `tokens.scoped.css`는 `.adver-system` 밖의 호스트 토큰을 설정하지 않습니다. 기존 `tokens.css`는 데모/페이지 전체용이며 :root에 값을 설정합니다. 둘을 동시에 로드할 필요는 없습니다.

## 실제 폼·버튼 연결

프로젝트용 form/buttons 마크업은 `data-ri-mode="production"`입니다. form에 `onSubmit`이 없으면 구성 오류를 표시하며 성공을 가장하지 않습니다. button에 `onAction`이 없으면 작성된 버튼을 유지하고 구성 오류를 표시합니다. Lab의 원래 예제는 데모 모드입니다.

```js
const dispose = ReferenceInteractions.mount(root, {
  async onSubmit({ values, form, signal }) {
    // 이 경로·인증·서버 검증은 실제 프로젝트에서 구현합니다.
    const response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
      signal
    });
    if (!response.ok) throw new Error('Request failed');
    return { message: '요청을 접수했습니다.' };
  },
  async onAction({ button, signal }) {
    await saveProject({ signal }); // 프로젝트 함수
    return { message: '저장했습니다.' };
  }
});
```

- `values`: `Object.fromEntries(new FormData(form))`. 값은 문자열 또는 File이며 같은 name이 반복되면 마지막 값입니다. 체크박스 여러 값·파일 전송에는 `form`에서 `new FormData(form)`을 만들고 `getAll` 또는 multipart 전송을 사용하세요.
- `onSubmit`/`onAction`: 동기 또는 비동기 함수. 성공 시 `{message}` 또는 아무 값도 반환하지 않아도 됩니다. 실패는 throw/reject로 알립니다. 내부 에러 내용은 UI에 그대로 노출하지 않습니다.
- 대기 중 중복 호출을 막습니다. reset/replay/최종 cleanup은 signal을 abort하고 이전 Promise 결과가 UI를 덮어쓰지 못하게 합니다. 네트워크 취소가 이미 처리된 서버 작업을 되돌리는 것은 아닙니다.
- 콜백은 샘플의 첫 mount에서 결정합니다. 중첩 root의 추가 mount가 기존 콜백을 교체하지 않습니다. 콜백을 교체할 때는 해당 샘플을 소유한 mount를 모두 해제한 뒤 다시 mount하세요.
- 입력 검증은 UI 편의를 위한 필수값·이메일 검사입니다. 실제 권한·보안·도메인 규칙은 서버에서도 검증하세요.

## 생명주기와 공통 API

| API | 계약 |
| --- | --- |
| `mount(root)` / `mount(root, options)` | Document 또는 Element의 `data-rm`/`data-ri` 요소를 초기화하고 cleanup 반환. root 자체도 검사합니다. |
| 같은 root에 다시 `mount` | 동일 cleanup을 반환하고 새로 삽입된 하위 요소를 찾습니다. options는 기존 샘플에 소급 적용되지 않습니다. |
| 중첩 root의 `mount` | 같은 샘플의 소유권을 공유합니다. 한 소유자의 cleanup은 다른 소유자의 동작을 제거하지 않습니다. |
| `cleanup()` | 해당 mount의 소유권을 해제합니다. 마지막 소유자가 해제될 때 이벤트·관찰자·타이머·진행 작업을 정리합니다. 여러 번 호출해도 안전합니다. |
| `replay(root)` | 해당 범위의 모션/상태를 초기화합니다. form/action의 진행 중 콜백은 취소합니다. |
| `setPaused(boolean)` | 해당 라이브러리의 문서 전체 모션/자동 반복에 적용합니다. 폼·탭 같은 조작은 유지합니다. |
| `setSpeed(number)` | 0.25–4 범위. WAAPI/CSS·모션 타이머 속도를 변경합니다. 라이브러리 전체에 적용합니다. |

DOM을 삭제하기 전에 cleanup하세요. 샘플만 제거하고 상위 root를 유지하는 앱에서는 각 컴포넌트 컨테이너를 따로 mount하는 것이 좋습니다. `mount`가 임의의 DOM 삭제를 감시해 자동 해제하지는 않습니다. React/Vue/Svelte에서도 DOM 생성 후 mount하고 컴포넌트 제거 시 cleanup을 호출하는 같은 계약을 사용합니다. SSR에서 브라우저 스크립트를 실행하지 마세요.

라이브러리당 같은 문서에서 한 번 로드합니다. 재생 컨트롤은 `documentElement`의 `rm-is-paused`, `rm-reduce-motion`, `data-ri-paused`, `--rm-speed-factor`, `--ri-speed-factor`를 사용합니다. 이 예약 이름을 앱에서 별도 의미로 사용하지 마세요. 인스턴스별로 서로 다른 속도/일시정지가 필요한 경우 iframe 또는 별도 문서가 필요합니다.

## 접근성·지원 범위

키보드 탭/방향키, 열린 패널의 ARIA 상태, 숨긴 슬라이드의 포커스 차단, 모션 감소, 44px 조작 영역을 검증합니다. 컴포넌트 내부는 container query로 좁은 열에도 대응하며 1440px 호스트 안의 320/360/480/720px 영역을 검사합니다. 호스트의 전역 `!important` 규칙은 컴포넌트 스타일을 덮어쓸 수 있으므로 소비 앱에서도 확인하세요. CSS 네임스페이스는 Shadow DOM 수준의 완전한 캡슐화가 아닙니다.

대상은 CSS custom properties, container queries, color-mix, matchMedia, AbortController, inert를 지원하는 현대 브라우저입니다. WAAPI/IntersectionObserver 미지원 시 일부 효과는 정적으로 동작합니다. 이번 검증은 설치된 Chromium 기준이며 Safari/Firefox 및 전체 WCAG 인증은 별도입니다.

## 릴리스와 변경

현재 API/토큰 버전은 **1.0.0**입니다. 패키지의 `releases/runtime-manifest.json`은 허용 파일, 크기, SHA-256을 기록합니다. 재배포 전 빌드는 `python3 scripts/build-release.py`, 검증은 README의 release 검사 명령을 사용합니다. 데이터·문구·성과값은 예시이므로 실제 프로젝트 내용으로 바꾸세요.

전체 수집 아카이브와 원본 폰트는 연구 자료입니다. 런타임 ZIP은 직접 작성한 코드·시스템 폰트만 포함하며, 원본 X/Recent 코드나 호스팅 자산을 제품에 자동 연결하지 않습니다.
