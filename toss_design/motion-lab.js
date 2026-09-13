const motionLabRoot = document.querySelector("[data-motion-lab]");

const motionReduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const motionTimers = new Set();
let motionLabVisible = true;
let motionLabSpeed = 1;

function scheduleMotion(callback, delay) {
  const scaledDelay = delay / Math.max(0.1, motionLabSpeed);
  const timer = window.setTimeout(() => {
    motionTimers.delete(timer);
    callback();
  }, motionReduceQuery.matches ? 0 : scaledDelay);
  motionTimers.add(timer);
  return timer;
}

function clearMotionTimer(timer) {
  window.clearTimeout(timer);
  motionTimers.delete(timer);
}

function svgCheck(className = "icon") {
  return `
    <svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
  `;
}

function svgWallet(className = "motion-symbol") {
  return `
    <svg class="${className}" viewBox="0 0 64 64" aria-hidden="true" fill="none">
      <rect x="10" y="18" width="44" height="32" rx="10" fill="currentColor" opacity=".14"></rect>
      <path d="M14 24h36a6 6 0 0 1 6 6v14a8 8 0 0 1-8 8H16A8 8 0 0 1 8 44V22a8 8 0 0 1 8-8h28" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
      <path d="M46 34h10v10H46a5 5 0 0 1 0-10Z" stroke="currentColor" stroke-width="3"></path>
      <circle cx="47" cy="39" r="1.8" fill="currentColor"></circle>
    </svg>
  `;
}

function setLabSpeed(value) {
  if (!motionLabRoot) return;
  motionLabSpeed = Number(value) || 1;
  motionLabRoot.style.setProperty("--motion-lab-speed", value);
}

function renderMotionLab() {
  if (!motionLabRoot) return;
  motionLabRoot.classList.add("motion-lab");
  motionLabRoot.setAttribute("aria-labelledby", "motion-lab-title");
  motionLabRoot.innerHTML = `
    <div class="motion-lab__head as-section-heading">
      <div>
        <p class="eyebrow eyebrow--dark">Motion and interaction lab</p>
        <h2 class="section-heading" id="motion-lab-title">작은 움직임을 직접 조절해보세요</h2>
        <p class="section-lede">
          버튼을 누르고, 진행률을 옮기고, 속도를 바꿔보세요. 아래 6개 예제는 공개 화면의 움직임을 참고해 독립적으로 재현했습니다.
        </p>
      </div>
      <div class="motion-lab__actions">
        <label>
          전체 속도
          <select data-motion-speed aria-label="전체 모션 속도">
            <option value="0.5">0.5배</option>
            <option value="1" selected>1배</option>
            <option value="1.5">1.5배</option>
          </select>
        </label>
        <button class="button button--soft" type="button" data-motion-replay-all>전체 다시보기</button>
      </div>
    </div>

    <div class="motion-lab__evidence" aria-label="모션 근거">
      <div class="motion-evidence"><strong>150ms</strong><span>공개 홈의 짧은 피드백</span></div>
      <div class="motion-evidence"><strong>200ms</strong><span>작은 이동과 상태 전환</span></div>
      <div class="motion-evidence"><strong>300-400ms</strong><span>내비게이션 전환</span></div>
      <div class="motion-evidence"><strong>유사 재현</strong><span>예제마다 독립 실행 코드 제공</span></div>
    </div>

    <div class="motion-lab__grid">
      <article class="motion-card" data-motion-demo="scrub">
        <div class="motion-card__head">
          <span class="spec-label">Scroll scrub</span>
          <h3>수동 스크롤 서사</h3>
          <p>진행률을 옮기면 카드가 움직이며 선명해져요.</p>
        </div>
        <div class="motion-stage">
          <div class="motion-preview-phone" data-scrub-card>
            <span class="motion-preview-phone__bar"></span>
            <div class="motion-preview-phone__amount"><span>이번 달 자산</span><strong>49,348,000원</strong></div>
            <div class="motion-preview-phone__progress"><span data-scrub-fill></span></div>
            <span class="button button--primary">내역 보기</span>
          </div>
          <span class="motion-story-value" data-scrub-value>40%</span>
        </div>
        <div class="motion-controls">
          <label class="motion-controls__range">진행률 <input type="range" min="0" max="100" value="40" data-scrub-range /></label>
          <button class="button button--soft" type="button" data-demo-replay>다시보기</button>
        </div>
        <div class="motion-card__meta"><span>300-400ms nav inspiration</span><span>유사 재현</span></div>
      </article>

      <article class="motion-card" data-motion-demo="stagger">
        <div class="motion-card__head">
          <span class="spec-label">Stagger reveal</span>
          <h3>카드 순차 등장</h3>
          <p>리스트가 같은 방향과 간격으로 드러나 사용자가 읽을 순서를 만든다.</p>
        </div>
        <div class="motion-stage">
          <div class="stagger-list" data-stagger-list>
            <div class="stagger-item" style="--delay-index:0"><i></i><strong>계좌 연결</strong><span>완료</span></div>
            <div class="stagger-item" style="--delay-index:1"><i></i><strong>지출 분석</strong><span>3초 전</span></div>
            <div class="stagger-item" style="--delay-index:2"><i></i><strong>혜택 추천</strong><span>새로움</span></div>
            <div class="stagger-item" style="--delay-index:3"><i></i><strong>송금 준비</strong><span>확인됨</span></div>
          </div>
        </div>
        <div class="motion-controls">
          <button class="button button--soft" type="button" data-demo-replay>다시보기</button>
        </div>
        <div class="motion-card__meta"><span>600ms reveal</span><span>보일 때만 재생</span></div>
      </article>

      <article class="motion-card" data-motion-demo="sheet">
        <div class="motion-card__head">
          <span class="spec-label">Bottom sheet</span>
          <h3>스프링형 확인 패널</h3>
          <p>확인 패널을 열고, 내용을 확인한 뒤 닫아보세요.</p>
        </div>
        <div class="motion-stage motion-stage--sheet">
          <div class="sheet-launcher">
            <strong>김토스님에게 52,000원</strong>
            <p data-sheet-result role="status">예시 금액과 받는 사람을 확인해보세요.</p>
            <button class="button button--primary" type="button" data-sheet-open>확인 패널 열기</button>
          </div>
        </div>
        <div class="motion-controls">
          <button class="button button--soft" type="button" data-demo-replay>열기 재생</button>
        </div>
        <div class="motion-card__meta"><span>300-400ms panel</span><span>키보드 조작 지원</span></div>
      </article>

      <article class="motion-card" data-motion-demo="segment">
        <div class="motion-card__head">
          <span class="spec-label">Active selection</span>
          <h3>아이콘과 필 선택</h3>
          <p>선택한 항목으로 배경이 이동하고 아이콘 색이 바뀌어요.</p>
        </div>
        <div class="motion-stage">
          <div class="motion-segment">
            <div class="motion-pill-switch" role="group" aria-label="알림 범위" data-segment-switch>
              <button type="button" aria-pressed="true" data-segment-index="0">전체</button>
              <button type="button" aria-pressed="false" data-segment-index="1">중요</button>
              <button type="button" aria-pressed="false" data-segment-index="2">보안</button>
            </div>
            <div class="motion-segment__symbol">${svgWallet()}</div>
          </div>
        </div>
        <div class="motion-controls">
          <button class="button button--soft" type="button" data-demo-replay>다시보기</button>
        </div>
        <div class="motion-card__meta"><span>150ms color</span><span>200ms transform</span></div>
      </article>

      <article class="motion-card" data-motion-demo="accordion">
        <div class="motion-card__head">
          <span class="spec-label">Height reveal</span>
          <h3>아코디언 정보 전개</h3>
          <p>항목을 누르면 내용의 길이에 맞춰 부드럽게 펼쳐져요.</p>
        </div>
        <div class="motion-stage">
          <div class="motion-accordion" data-motion-accordion>
            <div class="motion-accordion__item is-open">
              <button type="button" aria-expanded="true">송금 전 확인</button>
              <div class="motion-accordion__panel"><p>받는 사람, 금액, 출금 계좌를 한 번에 보여주고 다음 행동은 하나만 남긴다.</p></div>
            </div>
            <div class="motion-accordion__item">
              <button type="button" aria-expanded="false">실패했을 때</button>
              <div class="motion-accordion__panel"><p>입력값을 보존하고 복구 행동을 먼저 보여준다.</p></div>
            </div>
            <div class="motion-accordion__item">
              <button type="button" aria-expanded="false">완료 후</button>
              <div class="motion-accordion__panel"><p>결과 금액과 대상자를 즉시 고정하고 다음 행동을 짧게 제공한다.</p></div>
            </div>
          </div>
        </div>
        <div class="motion-controls">
          <button class="button button--soft" type="button" data-demo-replay>다시보기</button>
        </div>
        <div class="motion-card__meta"><span>300-400ms height</span><span>열림 상태 표시</span></div>
      </article>

      <article class="motion-card" data-motion-demo="progress">
        <div class="motion-card__head">
          <span class="spec-label">Loading to success</span>
          <h3>진행에서 완료로</h3>
          <p>진행 중 취소하거나, 완료한 뒤 다시 재생해보세요.</p>
        </div>
        <div class="motion-stage motion-stage--progress">
          <div class="progress-demo">
            <div class="progress-meter" aria-hidden="true"><span data-progress-fill></span></div>
            <div class="progress-result" data-progress-result role="status">
              <div class="progress-result__icon">${svgCheck()}</div>
              <span><strong data-progress-title>대기 중</strong><span data-progress-copy>재생을 누르면 처리 상태를 확인할 수 있다.</span></span>
            </div>
          </div>
        </div>
        <div class="motion-controls">
          <button class="button button--primary" type="button" data-progress-start>재생</button>
          <button class="button button--soft" type="button" data-progress-cancel>취소</button>
        </div>
        <div class="motion-card__meta"><span>150ms feedback</span><span>재생·취소 지원</span></div>
      </article>
    </div>

    <dialog class="motion-dialog" data-motion-dialog aria-labelledby="motion-dialog-title">
      <form method="dialog" class="motion-dialog__panel">
        <span class="motion-dialog__handle" aria-hidden="true"></span>
        <h4 id="motion-dialog-title">이 내용으로 확인할까요?</h4>
        <p>김토스님 · 52,000원<br />인터랙션 예시로 실제 송금은 하지 않아요.</p>
        <button class="button button--primary" value="confirm" type="submit">확인 완료</button>
        <button class="button button--soft" value="cancel" type="submit">닫기</button>
      </form>
    </dialog>
  `;
}

function syncScrub(card) {
  if (!card) return;
  const range = card.querySelector("[data-scrub-range]");
  const preview = card.querySelector("[data-scrub-card]");
  const valueLabel = card.querySelector("[data-scrub-value]");
  const fill = card.querySelector("[data-scrub-fill]");
  if (!range || !preview || !valueLabel || !fill) return;

  const apply = () => {
    const progress = Number(range.value) / 100;
    const y = Math.round((1 - progress) * 26);
    const blur = ((1 - progress) * 2.2).toFixed(2);
    preview.style.setProperty("--scrub-y", `${y}px`);
    preview.style.setProperty("--scrub-opacity", String(0.58 + (progress * 0.42)));
    preview.style.setProperty("--scrub-scale", String(0.96 + (progress * 0.04)));
    preview.style.setProperty("--scrub-blur", `${blur}px`);
    preview.style.setProperty("--scrub-progress", `${Math.max(8, Number(range.value))}%`);
    valueLabel.textContent = `${range.value}%`;
  };
  range.addEventListener("input", apply);
  card.querySelector("[data-demo-replay]")?.addEventListener("click", () => {
    range.value = "0";
    apply();
    if (motionReduceQuery.matches) {
      range.value = "100";
      apply();
      return;
    }
    let step = 0;
    const tick = () => {
      if (!motionLabVisible) return;
      step += 10;
      range.value = String(Math.min(100, step));
      apply();
      if (step < 100) scheduleMotion(tick, 38);
    };
    scheduleMotion(tick, 38);
  });
  apply();
}

function replayStagger(card) {
  if (!card) return;
  const items = [...card.querySelectorAll(".stagger-item")];
  items.forEach((item) => item.classList.remove("is-visible"));
  scheduleMotion(() => items.forEach((item) => item.classList.add("is-visible")), 30);
}

function setupStagger(card) {
  if (!card) return;
  card.querySelector("[data-demo-replay]")?.addEventListener("click", () => replayStagger(card));
  replayStagger(card);
}

function setupDialog(card) {
  if (!card) return;
  const dialog = motionLabRoot?.querySelector("[data-motion-dialog]");
  const openButtons = [card.querySelector("[data-sheet-open]"), card.querySelector("[data-demo-replay]")].filter(Boolean);
  let lastFocus = null;

  function focusableElements() {
    return [...dialog.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.disabled && element.offsetParent !== null);
  }

  function openDialog() {
    if (!dialog || dialog.open) return;
    lastFocus = document.activeElement;
    dialog.showModal();
    scheduleMotion(() => focusableElements()[0]?.focus(), 0);
  }

  openButtons.forEach((button) => button.addEventListener("click", openDialog));
  dialog?.addEventListener("close", () => {
    if (dialog.returnValue === "confirm") {
      const result = card.querySelector("[data-sheet-result]");
      if (result) result.textContent = "확인했어요. 김토스님 · 52,000원";
    }
    if (lastFocus instanceof HTMLElement) lastFocus.focus();
  });
  dialog?.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusables = focusableElements();
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function setupSegment(card) {
  if (!card) return;
  const switcher = card.querySelector("[data-segment-switch]");
  const buttons = [...card.querySelectorAll("[data-segment-index]")];
  const symbol = card.querySelector(".motion-symbol");
  function select(index) {
    switcher?.style.setProperty("--active-index", String(index));
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.segmentIndex) === index));
    });
    symbol?.classList.toggle("is-active", index > 0);
  }
  buttons.forEach((button) => {
    button.addEventListener("click", () => select(Number(button.dataset.segmentIndex)));
  });
  card.querySelector("[data-demo-replay]")?.addEventListener("click", () => {
    select(0);
    scheduleMotion(() => select(1), 220);
    scheduleMotion(() => select(2), 520);
  });
  select(0);
}

function setupAccordion(card) {
  if (!card) return;
  const items = [...card.querySelectorAll(".motion-accordion__item")];
  function setItem(item, isOpen) {
    const button = item.querySelector("button");
    const panel = item.querySelector(".motion-accordion__panel");
    if (!button || !panel) return;
    item.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
    panel.inert = !isOpen;
    if (motionReduceQuery.matches) {
      panel.style.height = isOpen ? "auto" : "0px";
      return;
    }
    if (isOpen) {
      panel.style.height = `${panel.scrollHeight}px`;
      scheduleMotion(() => {
        if (item.classList.contains("is-open")) panel.style.height = "auto";
      }, 380);
    } else {
      panel.style.height = `${panel.scrollHeight}px`;
      panel.offsetHeight;
      panel.style.height = "0px";
    }
  }
  items.forEach((item, index) => {
    const panel = item.querySelector(".motion-accordion__panel");
    panel.id = `motion-accordion-panel-${index}`;
    item.querySelector("button").setAttribute("aria-controls", panel.id);
    item.querySelector("button")?.addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      items.forEach((other) => setItem(other, other === item && willOpen));
    });
  });
  card.querySelector("[data-demo-replay]")?.addEventListener("click", () => {
    items.forEach((item, index) => setItem(item, index === 0));
    scheduleMotion(() => items[1] && items.forEach((item, index) => setItem(item, index === 1)), 520);
    scheduleMotion(() => items[2] && items.forEach((item, index) => setItem(item, index === 2)), 1040);
  });
  items.forEach((item) => setItem(item, item.classList.contains("is-open")));
}

function setupProgress(card) {
  if (!card) return;
  const fill = card.querySelector("[data-progress-fill]");
  const result = card.querySelector("[data-progress-result]");
  const title = card.querySelector("[data-progress-title]");
  const copy = card.querySelector("[data-progress-copy]");
  const start = card.querySelector("[data-progress-start]");
  const cancel = card.querySelector("[data-progress-cancel]");
  const state = { timer: null, value: 0, running: false };

  function render(status) {
    fill?.style.setProperty("--progress-value", `${state.value}%`);
    result?.classList.toggle("is-success", status === "success");
    result?.classList.toggle("is-cancelled", status === "cancelled");
    if (title && copy) {
      if (status === "running") {
        title.textContent = "처리 중";
        copy.textContent = "보안 확인과 송금 처리를 진행하고 있다.";
      } else if (status === "success") {
        title.textContent = "완료";
        copy.textContent = "김토스님에게 52,000원을 보냈다.";
      } else if (status === "paused") {
        title.textContent = "일시정지";
        copy.textContent = "재생을 누르면 처음부터 다시 확인할 수 있어요.";
      } else if (status === "cancelled") {
        title.textContent = "취소됨";
        copy.textContent = "진행 중인 타이머를 멈추고 대기 상태로 돌아간다.";
      } else {
        title.textContent = "대기 중";
        copy.textContent = "재생을 누르면 처리 상태를 확인할 수 있다.";
      }
    }
    if (start) start.disabled = state.running;
  }

  function stop(status = "idle") {
    if (state.timer) clearMotionTimer(state.timer);
    state.timer = null;
    state.running = false;
    if (status !== "success") state.value = status === "cancelled" ? state.value : 0;
    render(status);
  }

  function tick() {
    if (!state.running || !motionLabVisible || document.hidden) return;
    state.value = Math.min(100, state.value + (motionReduceQuery.matches ? 100 : 12));
    render("running");
    if (state.value >= 100) {
      state.running = false;
      render("success");
      return;
    }
    state.timer = scheduleMotion(tick, 190);
  }

  start?.addEventListener("click", () => {
    stop("idle");
    state.value = 0;
    state.running = true;
    render("running");
    tick();
  });
  cancel?.addEventListener("click", () => stop("cancelled"));
  motionLabRoot.addEventListener("motion:pause", () => { if (state.running) stop("paused"); });
  motionLabRoot.addEventListener("motion:reduce", () => { if (state.running && motionReduceQuery.matches) { state.value = 100; stop("success"); } });
  render("idle");
}

function replayAllMotion() {
  motionLabRoot?.querySelectorAll("[data-motion-demo]:not([data-motion-demo='sheet']) [data-demo-replay]").forEach((button) => button.click());
  motionLabRoot?.querySelector("[data-progress-start]")?.click();
}

function setupMotionLab() {
  if (!motionLabRoot) return;
  renderMotionLab();
  setLabSpeed("1");

  motionLabRoot.querySelector("[data-motion-speed]")?.addEventListener("change", (event) => {
    setLabSpeed(event.target.value);
  });
  motionLabRoot.querySelector("[data-motion-replay-all]")?.addEventListener("click", replayAllMotion);

  syncScrub(motionLabRoot.querySelector("[data-motion-demo='scrub']"));
  setupStagger(motionLabRoot.querySelector("[data-motion-demo='stagger']"));
  setupDialog(motionLabRoot.querySelector("[data-motion-demo='sheet']"));
  setupSegment(motionLabRoot.querySelector("[data-motion-demo='segment']"));
  setupAccordion(motionLabRoot.querySelector("[data-motion-demo='accordion']"));
  setupProgress(motionLabRoot.querySelector("[data-motion-demo='progress']"));

  const visibilityObserver = new IntersectionObserver((entries) => {
    motionLabVisible = entries.some((entry) => entry.isIntersecting);
    if (!motionLabVisible) motionLabRoot.dispatchEvent(new Event("motion:pause"));
  }, { threshold: 0.05 });
  visibilityObserver.observe(motionLabRoot);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      motionLabRoot.dispatchEvent(new Event("motion:pause"));
      motionTimers.forEach((timer) => window.clearTimeout(timer));
      motionTimers.clear();
    }
  });

  motionReduceQuery.addEventListener("change", () => {
    motionLabRoot.dispatchEvent(new Event("motion:reduce"));
    motionTimers.forEach((timer) => window.clearTimeout(timer));
    motionTimers.clear();
    motionLabRoot.querySelectorAll(".motion-accordion__item").forEach((item) => {
      const panel = item.querySelector(".motion-accordion__panel");
      if (panel) panel.style.height = item.classList.contains("is-open") ? "auto" : "0px";
    });
  });
}

setupMotionLab();
