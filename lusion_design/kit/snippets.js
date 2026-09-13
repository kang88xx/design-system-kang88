/** Authored component recipes. Class names and native semantics are the public contract. */
export const snippets = [
  {
    id: 'button', label: '버튼', category: '액션', runtime: false,
    description: '주요 액션은 화면당 하나를 중심으로 배치합니다. 진행 중에는 클릭을 막고 상태를 함께 전달하세요.',
    guidance: '링크 이동은 a, 동작 실행은 button을 사용하세요. 아이콘만 있는 버튼에는 aria-label이 필요합니다.',
    html: `<div class="ds-stack">
  <div class="ds-grid ds-grid--auto">
    <button class="ds-button ds-button--primary" type="button">프로젝트 만들기</button>
    <button class="ds-button ds-button--secondary" type="button">초안 저장</button>
    <button class="ds-button ds-button--ghost" type="button">나중에</button>
  </div>
  <div class="ds-grid ds-grid--auto">
    <button class="ds-button ds-button--primary" type="button" aria-busy="true" disabled>저장하는 중…</button>
    <button class="ds-button" type="button" disabled>권한 필요</button>
  </div>
</div>`
  },
  {
    id: 'field', label: '입력과 오류', category: '폼', runtime: false,
    description: '레이블, 보조 설명, 오류를 하나의 필드로 연결합니다. 값은 적용하는 프로젝트가 관리합니다.',
    guidance: '오류는 색상과 문구로 함께 전달하고 aria-invalid와 aria-describedby를 연결하세요.',
    html: `<div class="ds-stack">
  <div class="ds-field">
    <label for="recipe-name">프로젝트 이름</label>
    <input class="ds-input" id="recipe-name" name="name" placeholder="예: 브랜드 리뉴얼" autocomplete="off" aria-describedby="recipe-name-hint">
    <small id="recipe-name-hint">팀에서 구분하기 쉬운 이름을 입력하세요.</small>
  </div>
  <div class="ds-field">
    <label for="recipe-email">초대할 이메일</label>
    <input class="ds-input" id="recipe-email" name="email" type="email" value="team@" aria-invalid="true" aria-describedby="recipe-email-error">
    <small class="ds-error" id="recipe-email-error">이메일 주소를 확인해 주세요.</small>
  </div>
</div>`
  },
  {
    id: 'card', label: '프로젝트 카드', category: '콘텐츠', runtime: false,
    description: '프로젝트의 제목·상태·설명을 요약합니다. 사진 없이도 정보 구조가 유지됩니다.',
    guidance: '카드 전체에 클릭 이벤트를 붙이지 말고 제목 링크 또는 명확한 버튼을 제공하세요.',
    html: `<article class="ds-card ds-stack">
  <span class="ds-badge">진행 중</span>
  <h3>브랜드 경험 리뉴얼</h3>
  <p>웹사이트와 제품 화면에서 사용할 시각 언어를 정리하고 있습니다.</p>
  <div class="ds-stack"><label for="recipe-card-progress">컴포넌트 정리 · 68%</label><progress class="ds-progress" id="recipe-card-progress" max="100" value="68">68%</progress></div>
  <button class="ds-button ds-button--secondary" type="button">프로젝트 보기</button>
</article>`
  },
  {
    id: 'tabs', label: '탭', category: '탐색', runtime: true,
    description: '관련된 내용을 같은 자리에서 전환합니다. 방향키와 Home·End로 이동할 수 있습니다.',
    guidance: 'aria-controls와 패널 ID는 같은 루트 안에서 고유해야 합니다. 중요한 페이지 이동은 링크로 제공하세요.',
    html: `<div class="ds-tabs" data-ds-tabs>
  <div role="tablist" aria-label="프로젝트 정보">
    <button class="ds-button" type="button" role="tab" id="recipe-tab-overview" aria-controls="recipe-panel-overview" aria-selected="true">개요</button>
    <button class="ds-button" type="button" role="tab" id="recipe-tab-files" aria-controls="recipe-panel-files" aria-selected="false" tabindex="-1">파일</button>
    <button class="ds-button" type="button" role="tab" id="recipe-tab-history" aria-controls="recipe-panel-history" aria-selected="false" tabindex="-1">변경 기록</button>
  </div>
  <section role="tabpanel" id="recipe-panel-overview" aria-labelledby="recipe-tab-overview" tabindex="0"><h3>함께 만드는 기준</h3><p>토큰과 컴포넌트를 정리하고 팀이 같은 기준으로 작업합니다.</p></section>
  <section role="tabpanel" id="recipe-panel-files" aria-labelledby="recipe-tab-files" tabindex="0" hidden><h3>프로젝트 파일</h3><p>CSS 토큰 · 컴포넌트 스타일 · 상호작용 모듈</p></section>
  <section role="tabpanel" id="recipe-panel-history" aria-labelledby="recipe-tab-history" tabindex="0" hidden><h3>버전 1.0.0</h3><p>첫 공통 컴포넌트와 테마 설정을 추가했습니다.</p></section>
</div>`
  },
  {
    id: 'accordion', label: '아코디언', category: '탐색', runtime: false,
    description: '짧은 질문이나 부가 정보를 단계적으로 펼칩니다. JavaScript 없이도 작동합니다.',
    guidance: '핵심 액션이나 필수 오류 메시지를 접힌 영역에 숨기지 마세요.',
    html: `<div class="ds-stack">
  <details class="ds-accordion" open><summary>어떤 파일부터 가져오나요?</summary><div><p>tokens.css와 components.css를 연결하고 상호작용이 필요할 때 system.js를 가져옵니다.</p></div></details>
  <details class="ds-accordion"><summary>다른 브랜드에도 적용할 수 있나요?</summary><div><p>.ds-root에서 색상·폰트·모서리 토큰을 덮어쓰면 됩니다.</p></div></details>
</div>`
  },
  {
    id: 'dialog', label: '다이얼로그', category: '피드백', runtime: true,
    description: '집중이 필요한 짧은 작업에 사용합니다. 열기·닫기·Escape·포커스 복귀를 처리합니다.',
    guidance: '제목과 닫기 버튼을 항상 제공하세요. 데이터를 실제 저장하는 동작은 프로젝트 코드에 연결합니다.',
    html: `<button class="ds-button ds-button--primary" type="button" data-ds-dialog-open="recipe-dialog">팀원 초대</button>
<dialog class="ds-dialog" id="recipe-dialog" aria-labelledby="recipe-dialog-title">
  <div class="ds-stack"><h3 id="recipe-dialog-title">팀원 초대</h3><p>프로젝트를 함께 볼 팀원을 초대하세요.</p>
    <div class="ds-field"><label for="recipe-invite">이메일</label><input class="ds-input" id="recipe-invite" type="email" placeholder="team@example.com"></div>
    <button class="ds-button ds-button--secondary" type="button" data-ds-dialog-close>닫기</button>
  </div>
</dialog>`
  },
  {
    id: 'toast', label: '알림', category: '피드백', runtime: true,
    description: '완료나 간단한 상태 변화를 알려줍니다. 긴급한 오류는 해당 필드 가까이에 표시하세요.',
    guidance: '알림만으로 중요한 상태를 전달하지 마세요. 서버 요청 성공 후 notify를 호출합니다.',
    html: `<button class="ds-button ds-button--primary" type="button" data-ds-toast="알림 예제입니다. 실제 저장 요청은 보내지 않았습니다.">알림 확인</button>
<div class="ds-toast" data-ds-toast-region role="status" aria-live="polite" aria-atomic="true"></div>`
  },
  {
    id: 'progress', label: '상태와 진행률', category: '피드백', runtime: false,
    description: '배지와 네이티브 진행률을 사용해 현재 작업 상태를 전달합니다.',
    guidance: '진행률이 실제로 계산되지 않으면 퍼센트를 임의로 표시하지 말고 value 없는 progress를 사용하세요.',
    html: `<div class="ds-card ds-stack">
  <div><span class="ds-badge">검토 중</span> <span class="ds-badge ds-badge--success">준비 완료</span></div>
  <label for="recipe-progress">파일 준비 · 예제 72%</label>
  <progress class="ds-progress" id="recipe-progress" value="72" max="100">72%</progress>
  <label for="recipe-indeterminate">처리 중</label>
  <progress class="ds-progress" id="recipe-indeterminate" aria-label="처리 중"></progress>
</div>`
  },
  {
    id: 'layout', label: '그리드와 간격', category: '레이아웃', runtime: false,
    description: '그리드는 좁은 화면에서 자동으로 줄을 바꾸고, 스택은 일관된 세로 간격을 만듭니다.',
    guidance: '고정 너비 대신 유연한 트랙을 사용하세요. 긴 프로젝트 이름과 번역 문구도 확인합니다.',
    html: `<div class="ds-grid ds-grid--auto">
  <article class="ds-card ds-stack"><span class="ds-badge">01 / 방향</span><h3>발견하기</h3><p>사용자가 해결하려는 일을 정리합니다.</p></article>
  <article class="ds-card ds-stack"><span class="ds-badge">02 / 구현</span><h3>만들기</h3><p>상태와 접근성을 함께 구현합니다.</p></article>
  <article class="ds-card ds-stack"><span class="ds-badge">03 / 검수</span><h3>확인하기</h3><p>실제 사용 흐름에서 결과를 확인합니다.</p></article>
</div>`
  },
  {
    id: 'motion', label: '등장과 마그네틱', category: '모션', runtime: true,
    description: '스크롤 진입 시 등장하고, 포인터에 부드럽게 끌립니다. 마그네틱은 2차 동역학(snap 프리셋)으로 감쇠합니다.',
    guidance: 'data-ds-reveal 값으로 rise·fade·scale·mask·line을 고릅니다. 모션 감소 환경에서는 즉시 표시되고 마그네틱은 꺼집니다.',
    html: `<div class="ds-stack" data-ds-stagger>
  <article class="ds-card ds-stack" data-ds-reveal>
    <span class="ds-badge">REVEAL · RISE</span><h3>작은 반응, 명확한 행동</h3><p>등장 모션은 정보를 가리지 않는 범위로 제한합니다.</p>
    <button class="ds-button ds-button--primary" type="button" data-ds-magnetic="0.2">다음 단계로</button>
  </article>
  <article class="ds-card ds-stack" data-ds-reveal="scale"><span class="ds-badge">REVEAL · SCALE</span><p>헤더 버튼처럼 scale(0)에서 나타납니다.</p></article>
  <span class="ds-mask"><span class="ds-badge" data-ds-reveal="mask">REVEAL · MASK</span></span>
</div>`
  },
  {
    id: 'cta', label: 'CTA 점 확산 버튼', category: '액션', runtime: false,
    description: '점이 커지며 배경을 채우고 라벨이 왼쪽으로 밀리며 화살표가 들어옵니다. CSS만으로 동작합니다.',
    guidance: '주요 CTA 한 개에만 사용하세요. 배경 전환은 .3s 지연 후 .5s smooth, 점·라벨은 .4s smooth입니다.',
    html: `<div class="ds-cluster">
  <a class="ds-cta" href="#reel"><span class="ds-cta__dot" aria-hidden="true"></span><span class="ds-cta__label">Watch the reel</span><span class="ds-cta__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>
  <a class="ds-cta ds-cta--dark" href="#work"><span class="ds-cta__dot" aria-hidden="true"></span><span class="ds-cta__label">See all work</span><span class="ds-cta__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span></a>
  <button class="ds-talk" type="button"><span class="ds-talk__arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg></span><span class="ds-talk__label">Let's talk</span><span class="ds-talk__dot" aria-hidden="true"></span></button>
  <button class="ds-button" type="button" aria-label="메뉴 열기"><span class="ds-dots" aria-hidden="true"></span></button>
</div>`
  },
  {
    id: 'links', label: '링크 반응', category: '탐색', runtime: false,
    description: '텍스트 스왑, 왼쪽에서 자라는 밑줄, 위아래로 교체되는 아이콘. 세 가지 hover/focus 반응입니다.',
    guidance: '.ds-swap은 data-swap 텍스트가 필요합니다. 밑줄은 .3s expo, --slow는 .6s smooth입니다. 포커스에서도 같은 반응을 보장하세요.',
    html: `<div class="ds-cluster" style="gap: var(--ds-space-6);">
  <a class="ds-swap" href="#about" data-swap="About us"><span class="ds-swap__text">About us</span></a>
  <a class="ds-link" href="#projects">Projects</a>
  <a class="ds-link ds-link--slow" href="#labs">Labs ↗</a>
  <a class="ds-link ds-link--static" href="#mail">hello@example.com</a>
  <button class="ds-button ds-button--secondary" type="button" aria-label="맨 위로"><span class="ds-icon-swap" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7"/></svg><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-7 7 7-7 7 7"/></svg></span></button>
</div>`
  },
  {
    id: 'menu-panel', label: '메뉴 패널', category: '탐색', runtime: true,
    description: '항목이 5.5em 아래에서 3.5deg 기울어진 채 올라옵니다. 열 때 20ms씩 순서대로, 닫을 때는 역순입니다.',
    guidance: '패널 id와 data-ds-panel-toggle을 연결합니다. 닫힌 패널은 inert이며 Escape로 닫히고 포커스가 트리거로 돌아갑니다.',
    html: `<button class="ds-button" type="button" data-ds-panel-toggle="recipe-menu" aria-label="메뉴"><span>Menu</span><span class="ds-dots" aria-hidden="true"></span></button>
<nav class="ds-panel" id="recipe-menu" data-ds-panel aria-label="사이트 메뉴">
  <div class="ds-panel__box ds-stack" data-ds-stagger style="--ds-stack-gap: 2px; padding: var(--ds-space-3) var(--ds-space-2);">
    <a class="ds-menu-link" href="#home" aria-current="page"><span class="ds-swap" data-swap="Home"><span class="ds-swap__text">Home</span></span></a>
    <a class="ds-menu-link" href="#about"><span class="ds-swap" data-swap="About us"><span class="ds-swap__text">About us</span></span></a>
    <a class="ds-menu-link" href="#projects"><span class="ds-swap" data-swap="Projects"><span class="ds-swap__text">Projects</span></span></a>
    <a class="ds-menu-link" href="#contact"><span class="ds-swap" data-swap="Contact"><span class="ds-swap__text">Contact</span></span></a>
  </div>
</nav>`
  },
  {
    id: 'split', label: '단어 등장 타이틀', category: '모션', runtime: true,
    description: '제목을 단어 단위로 마스킹하고 1.5em 아래 15deg 기울기에서 순서대로 올립니다. 원문은 aria-label로 유지됩니다.',
    guidance: 'data-ds-split="words" 또는 "chars". 긴 제목은 40ms 간격이 길어지므로 단어 수를 확인하세요. destroy()가 원문을 복원합니다.',
    html: `<div class="ds-stack">
  <h2 class="ds-heading" data-ds-split="words">We build immersive digital experiences.</h2>
  <p class="ds-eyebrow" data-ds-split="chars">Featured work</p>
</div>`
  },
  {
    id: 'cursor', label: '커서 라벨', category: '모션', runtime: true,
    description: '포인터를 따라오는 원형 라벨입니다. 대상에 올리면 커지고, 속도에 따라 늘어납니다. 터치와 모션 감소에서는 숨깁니다.',
    guidance: '루트당 커서 하나. 대상 요소에 data-ds-cursor-label 텍스트를 지정하세요. 커서는 보조 표시일 뿐 실제 링크·버튼이 접근성을 담당합니다.',
    html: `<div class="ds-grid ds-grid--auto">
  <a class="ds-card ds-zoom" href="#work-1" data-ds-cursor-label="View" style="display:block;min-height:180px;"><div class="ds-card__media" style="min-height:180px;border:0;"></div></a>
  <a class="ds-card ds-zoom" href="#work-2" data-ds-cursor-label="Play" data-ds-cursor-scale="1.3" style="display:block;min-height:180px;"><div class="ds-card__media" style="min-height:180px;border:0;"></div></a>
</div>
<div class="ds-cursor ds-cursor--accent" data-ds-cursor><span data-ds-cursor-text>View</span></div>`
  },
  {
    id: 'tilt', label: '포인터 틸트·시차', category: '모션', runtime: true,
    description: '카드가 포인터 위치로 기울고, 레이어가 깊이 값만큼 어긋납니다. drift 프리셋 동역학이 감쇠를 담당합니다.',
    guidance: 'data-ds-tilt는 최대 각도(deg)입니다. 레이어에는 data-ds-tilt-layer와 --ds-depth를 지정합니다. 이미지 없이도 도형으로 깊이를 표현하세요.',
    html: `<article class="ds-card ds-card__body" data-ds-tilt="8" style="min-height:220px;display:grid;place-items:center;">
  <div data-ds-tilt-layer style="--ds-depth: -1; position:absolute; inset:0; background: radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--ds-color-primary) 30%, transparent), transparent 55%);"></div>
  <div data-ds-tilt-layer style="--ds-depth: 2; width:96px; height:96px; border-radius:50%; background: var(--ds-color-primary);"></div>
</article>`
  },
  {
    id: 'hints', label: '스크롤 힌트·진행', category: '피드백', runtime: true,
    description: '3초 루프 힌트, 그리드 십자, 스크롤 진행 바입니다. 진행 바는 damp(λ=10)로 부드럽게 따라가고 0.5초 후 idle 상태가 됩니다.',
    guidance: '루프 힌트는 방향을 알리는 보조 요소로만 사용하세요. 진행 바 컨테이너에 data-ds-scroll-progress를 지정하면 --ds-progress를 받습니다.',
    html: `<div class="ds-stack">
  <div class="ds-cluster" style="justify-content:space-between;"><span class="ds-cross" aria-hidden="true"></span><span class="ds-loop"><span>Scroll to explore</span></span><span class="ds-loop ds-loop--arrow" aria-hidden="true"><span>↓</span></span><span class="ds-cross" aria-hidden="true"></span></div>
  <div class="ds-bar ds-bar--auto-hide" data-ds-scroll-progress role="progressbar" aria-label="페이지 진행" aria-valuemin="0" aria-valuemax="100"><span class="ds-bar__fill"></span></div>
  <div class="ds-bar" style="--ds-progress: .4; color: var(--ds-color-primary);"><span class="ds-bar__fill"></span></div>
</div>`
  },
  {
    id: 'flip', label: '카드 뒤집기', category: '콘텐츠', runtime: false,
    description: '314:438 비율 카드가 rotateY(180deg)로 뒤집힙니다. aria-pressed 토글 버튼으로 앞뒤를 전환합니다.',
    guidance: '뒷면에 필수 정보를 숨기지 마세요. 상태 전환은 프로젝트 코드에서 aria-pressed를 바꾸면 됩니다.',
    html: `<button class="ds-flip" type="button" aria-pressed="false" style="width:min(100%,220px);border:0;background:none;padding:0;text-align:left;color:inherit;font:inherit;cursor:pointer;" onclick="this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') !== 'true')">
  <span class="ds-flip__face"><span class="ds-eyebrow">A</span><span class="ds-title">3D &amp; WebGL</span></span>
  <span class="ds-flip__face ds-flip__face--back"><span class="ds-eyebrow">A / BACK</span><span>실시간 장면, 깊이 맵, 프리렌더 영상을 목적에 맞게 나눕니다.</span></span>
</button>`
  }
];
