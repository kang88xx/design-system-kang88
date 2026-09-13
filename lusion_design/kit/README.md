# Project Design System 1.1.0

프로젝트에 복사해서 사용하는 CSS 토큰·컴포넌트와 작은 ES module입니다. 외부 패키지, 웹폰트, 아카이브 미디어가 필요하지 않습니다. [모션 메인 화면](examples/home.html), [워크스페이스 예제](examples/index.html), [18개 레시피](snippets.js)를 시작점으로 사용하세요.

## 시작하기

ZIP을 풀고 `kit/` 폴더를 프로젝트에 복사합니다. ES module은 `file://` 대신 개발 서버 또는 HTTP로 실행합니다. 압축 해제 폴더에서 `python3 -m http.server 4187`을 실행하면 `/kit/examples/index.html`을 열 수 있습니다.

```html
<link rel="stylesheet" href="./kit/tokens.css">
<link rel="stylesheet" href="./kit/components.css">
<section class="ds-root" id="project-system" data-ds-theme="light">
  <button type="button" class="ds-button ds-button--primary"
    data-ds-toast="미리보기입니다.">알림 보기</button>
</section>
<script type="module">
  import { mount } from './kit/system.js';
  const system = mount(document.querySelector('#project-system'));
  // 해당 화면을 제거할 때 system.destroy()를 호출합니다.
</script>
```

로컬 npm 패키지가 필요한 프로젝트는 함께 제공한 `.tgz`를 `npm install /경로/local-project-design-system-1.1.0.tgz`로 설치합니다. 배포 레지스트리에 공개하지 않는 로컬 패키지입니다.

```js
import '@local/project-design-system/tokens.css';
import '@local/project-design-system/components.css';
import { mount } from '@local/project-design-system';
```

CSS import는 CSS를 처리하는 프로젝트 빌드 도구가 필요합니다. 순수 브라우저에서는 위 HTML의 `link` 방식을 사용하세요. TypeScript 선언은 패키지에 포함되어 있습니다.

## 테마와 스타일 범위

스타일은 `.ds-root` 내부에 적용됩니다. `data-ds-theme`은 `light`, `dark`, `system`을 지원합니다. 다른 UI 프레임워크와 함께 사용할 때 호스트 스타일의 선택자가 내부에 영향을 줄 수 있으므로 프로젝트 화면에서도 확인하세요. Shadow DOM 격리는 아닙니다.

CSS를 로드한 다음 해당 루트의 토큰을 덮어씁니다. 명시적 테마 선택자보다 우선하도록 프로젝트 클래스와 테마 속성을 함께 지정하세요.

```css
.ds-root.project-theme[data-ds-theme] {
  --ds-color-primary: #1733d2;
  --ds-color-on-primary: #ffffff;
  --ds-radius-2: 10px;
  --ds-font-sans: system-ui, sans-serif;
}
```

색상을 변경하면 버튼 글자·포커스·본문 대비도 확인하세요. 전체 값과 다크 테마 매핑은 [tokens.json](tokens.json), 실제 스타일은 [tokens.css](tokens.css)에 있습니다. 기본 버튼과 입력의 최소 높이는 44px입니다. 기본 모션은 운영체제의 동작 줄이기를 따릅니다.

## 컴포넌트 계약

| 구성 | 적용 및 동작 |
| --- | --- |
| 버튼 | `.ds-button`, `--primary`, `--secondary`, `--ghost`, `--danger`, `--sm`. 로딩은 `aria-busy="true"`, 중복 실행 방지는 `disabled`도 함께 지정 |
| 필드 | `.ds-field`, `.ds-input`, `.ds-help`, `.ds-error`; `label`, 고유 ID, `aria-describedby`, `aria-invalid`를 연결 |
| 카드·배지 | `.ds-card`, `.ds-badge`; 카드 안에 제목과 실제 링크 또는 버튼을 배치 |
| 탭 | `[data-ds-tabs]`, `role="tablist"`, `role="tab"`, 연결된 `tabpanel`; 런타임이 선택·화살표·Home/End를 처리 |
| 아코디언 | `details.ds-accordion`와 `summary`; JavaScript 없이 동작 |
| 다이얼로그 | `dialog.ds-dialog`, `data-ds-dialog-open="고유ID"`, `data-ds-dialog-close`; 제목을 `aria-labelledby`로 연결 |
| 알림 | `system.notify(text)` 또는 `data-ds-toast="내용"`; 문자열을 일반 텍스트로 표시 |
| 진행률 | `progress.ds-progress`에 `value`, `max`, 접근 가능한 이름 지정 |
| 레이아웃 | `.ds-stack`, `.ds-cluster`, `.ds-grid`(기본 12열·좁은 화면 6열), `.ds-grid--auto`(자동 열) |
| 등장 | `data-ds-reveal`(`rise`·`fade`·`scale`·`mask`·`line`), `data-ds-split`(`words`·`chars`), `data-ds-stagger`; `data-ds-reveal-manual`은 `replay()`로 직접 실행 |
| 패널 | `[data-ds-panel]` + `data-ds-panel-toggle/open/close`; 닫힘 상태는 `inert`, Escape와 배경 클릭으로 닫고 포커스 복귀 |
| CTA·링크 | `.ds-cta`(점 확산), `.ds-talk`, `.ds-menu-link`, `.ds-swap`(`data-swap` 필요), `.ds-link`, `.ds-icon-swap`, `.ds-dots`; CSS만으로 동작 |
| 포인터 | `data-ds-magnetic`, `data-ds-tilt`(+`data-ds-tilt-layer`, `--ds-depth`), `data-ds-cursor`(대상은 `data-ds-cursor-label`); 터치·모션 감소에서 비활성 |
| 진행·힌트 | `.ds-bar`(`--ds-progress`), `data-ds-scroll-progress`, `.ds-loop`, `.ds-cross`, `.ds-flip`, `.ds-zoom` |

[snippets.js](snippets.js)의 마크업을 그대로 시작점으로 삼으세요. 같은 페이지에 여러 레시피를 복사하면 `id`, `aria-controls`, `aria-labelledby`, `for`, 다이얼로그 대상 ID를 함께 바꿉니다. 키보드 접근 가능한 기본 HTML 의미를 유지하세요.

## JavaScript API와 화면 수명

```js
const system = mount(root, { motion: true });
system.setTheme('system');
system.notify('요청이 완료되었습니다.', { duration: 2600 });
system.openDialog('settings-dialog');
system.closeDialog('settings-dialog');
system.togglePanel('site-menu');            // openPanel / closePanel도 제공
system.replay(document.querySelector('#hero-title')); // 등장 모션 다시 실행
const stop = system.addTask(dt => { /* 프레임마다 실행, false를 반환하면 종료 */ });
console.log(system.motion);                  // 현재 장식 모션 활성 여부
system.destroy();
```

- `root`는 실제 `.ds-root` HTMLElement입니다. import만으로 DOM에 접근하지 않습니다.
- 같은 루트를 중복 mount하면 기존 인스턴스를 반환합니다. 옵션을 바꾸거나 내부 마크업을 교체할 때 기존 인스턴스를 destroy한 뒤 다시 mount합니다.
- 화면 제거 시 destroy하여 이벤트, 관찰자, 타이머, 생성된 알림을 정리합니다. 라우터 또는 프레임워크의 mount/unmount 수명에 연결하세요.
- 폼 저장, 데이터 조회, 오류 상태 해제, 권한 확인은 프로젝트 코드의 책임입니다. 예제는 서버에 저장하지 않는 로컬 데모입니다.
- 알림 duration은 0~60000ms이며 0은 자동 제거하지 않습니다. 중요한 오류는 필드 또는 화면에도 남겨두세요.
- 지원 대상은 ES modules, CSS custom properties, native dialog를 지원하는 최신 브라우저입니다. 이번 검증 환경은 Chromium이며 Safari/Firefox 실기기 검증은 별도입니다.

```js
import { createDynamics, dynamicsPresets, ease, damp, createSpring } from './kit/system.js';
const follow = createDynamics(dynamicsPresets.pointer); // f 1.5 · z .8 · r 2
follow.reset(0);
const x = follow.update(1 / 60, 240);      // dt 단위: 초. settled(target)로 종료 판단
const eased = ease.smooth(0.5);            // cubic-bezier(.35,0,0,1)
const smoothed = damp(current, target, 10, 1 / 60);
const spring = createSpring({ frequency: 2.8, damping: 0.82, response: 1 });
```

`createDynamics`는 공개 사이트가 포인터·깊이 카드·커서에 쓰는 2차 동역학(주파수·감쇠비·응답)을 숫자 하나에 적용합니다. 프리셋 값과 근거는 [tokens.json](tokens.json)의 `motion.dynamics`에 있습니다. 모두 DOM과 무관한 도구이며 requestAnimationFrame 관리와 모션 감소 대응은 호출자가 맡습니다. 런타임의 `addTask`를 쓰면 루트 단위 공용 루프에 올릴 수 있습니다. API 세부 타입은 [system.d.ts](system.d.ts)에 있습니다.

## 모션 규칙

- 지속 시간은 `--ds-motion-instant`(100ms)부터 `--ds-motion-line`(600ms), 루프 3s까지 7단계입니다. 이징은 UI 전환에 `--ds-ease`(standard), 확산·밑줄·스왑에 `--ds-ease-smooth`, 진입에 `--ds-ease-enter`, 감속에 `--ds-ease-out`을 씁니다.
- 순차 등장은 `--ds-stagger`(20ms, 패널)와 `--ds-stagger-word`(40ms, 단어·그룹)를 곱합니다. 패널은 열 때 순서대로, 닫을 때 역순입니다.
- `data-ds-reveal="mask"`와 `data-ds-split`은 큰 변위를 쓰므로 `.ds-mask` 같은 `overflow: hidden` 래퍼 안에 두어 레이아웃 박스를 유지하세요.
- 커서·틸트·마그네틱은 장식입니다. 실제 링크·버튼이 접근성을 담당하고, 터치와 `prefers-reduced-motion`에서는 자동으로 꺼집니다.

## 파일과 출처

`tokens.css`, `components.css`, `system.js`가 핵심입니다. `system.d.ts`, `tokens.json`, `snippets.js`, `examples/`는 적용·타입·예제를 제공합니다. 이 키트는 작업 중 새로 작성한 구현이며, 공개 원본 사이트의 비공개 소스 또는 내부 디자인 시스템을 복구한 결과가 아닙니다. 수집한 원본 폰트·이미지·영상은 이 패키지에 포함하지 않았습니다.

변경 이력: [CHANGELOG.md](CHANGELOG.md).
