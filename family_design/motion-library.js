(function () {
  "use strict";

  const DATA = [
    { id: "hero-entry-shapes", category: "intro", title: "Hero Entry Shapes", source: "원본 수치·네이티브 재구성", trigger: "initial load / replay / drag", duration: "heading .937s, ornament stagger .05s, ambient 2-3s", easing: "cubic-bezier(.19,1,.22,1) + spring approximation", descriptionKo: "히어로 제목은 rotateX -45deg/y 100%에서 올라오고, 69개 원본 shape SVG가 y40/scale0에서 spring처럼 정착합니다. dragSnapToOrigin, dragElastic .1, bounceStiffness 600, bounceDamping 20을 네이티브 pointer drag/spring으로 근사했습니다.", code: "Source: delayChildren .2, staggerChildren .05 reverse, word transition .937 [.19,1,.22,1], ornament spring mass4/stiffness800/damping80, dragElastic .1, snap spring 600/20. Renderer: individual shape-00..68.svg positioned as draggable HTML wrappers." },
    { id: "nav-dropdown", category: "intro", title: "Nav Dropdown", source: "CSS·영상 관찰", trigger: "hover / focus / action", duration: "100ms panel, 200ms row hover", easing: "ease-out", descriptionKo: "Developers 드롭다운은 scale .96에서 1로 커지고 opacity가 빠르게 올라옵니다. 패널 shadow/radius는 현재 사이트 CSS 관찰값을 반영했습니다.", code: "Evidence: nav row background/color 200ms; dropdown opacity/transform 100ms; scale .96→1; panel radius 8px, shadow 0 3px 16px rgba(0,0,0,.1)." },
    { id: "pill-cta", category: "status", title: "Pill CTA Press Loading Success", source: "CSS 수치·재구성", trigger: "press", duration: "100ms feedback, 1200ms skeleton", easing: "ease-in-out / linear", descriptionKo: "원형 CTA는 100ms 배경 피드백을 기본으로 하고, 가입/제출 상황에 필요한 loading 및 success 상태를 Family 스타일로 보완했습니다.", code: "Evidence: button background-color 100ms, skeleton 1200ms linear in CSS. Reconstruction: loading/success state flow for waitlist submission; no network request." },
    { id: "waitlist-validation", category: "status", title: "Waitlist Validation", source: "토큰 기반·재구성", trigger: "input / submit", duration: "180-240ms", easing: "ease-out", descriptionKo: "과거 영상의 waitlist CTA를 기준으로 valid/invalid 토큰을 적용한 이메일 검증 상태입니다. 실제 서버 제출은 하지 않습니다.", code: "Evidence: --color-valid #00C454, --color-invalid #FF4E4E. Reconstruction: local email validation only; no submit/fetch/XHR." },
    { id: "backup-success", category: "status", title: "Secure Backing-Up Badge", source: "원본 수치·재구성", trigger: "visible autoplay / action", duration: "2s state loop, 1s ring pulse", easing: "spring mass4 stiffness800 damping80 approximation", descriptionKo: "Secure Bento의 3상태 루프와 ring/shield pulse를 백업 성공 배지 썸네일로 재구성했습니다. 2초마다 상태가 바뀌고 ring은 1초 easeInOut로 낮게 맥박칩니다.", code: "Source: Secure bento 3 states / 2s interval; active rings opacity .1→.5→.1 and .25→1→.25 over 1s; spring 4/800/80." },
    { id: "timeline-status", category: "status", title: "Fast Status Timeline", source: "원본 수치·재구성", trigger: "visible autoplay / action", duration: "2s state loop", easing: "spring mass4 stiffness800 damping80 approximation", descriptionKo: "Fast Bento의 날짜/상태 패널 reshuffle을 submitted, pending, completed 타임라인으로 번역했습니다. 원본처럼 hover가 아니라 보이는 동안 2초 cadence로 순환합니다.", code: "Source: Fast bento 3-state date/status panel, 2s interval, spring 4/800/80 reshuffle." },
    { id: "urgency-selector", category: "status", title: "Powerful Urgency Selector", source: "원본 수치", trigger: "visible autoplay / select", duration: "2s loop, numeric tween .8s", easing: "easeOut + spring mass4 stiffness2000 damping80", descriptionKo: "Powerful Bento의 실제 15 → 60 → 30 → 15 숫자 tween을 반영했습니다. 선택 pill은 직접 누를 수 있고, 자동 루프는 보이는 동안만 돕니다.", code: "Source: Powerful counter values 15→60→30→15; animate duration .8 easeOut; panel spring 4/2000/80 with .1s incoming delay." },
    { id: "fun-carousel", category: "status", title: "Fun Emoji Asset Carousel", source: "원본 수치·원본 에셋·재구성", trigger: "visible autoplay / next", duration: "2s loop, 1000ms rail", easing: "cubic-bezier(.19,1,.22,1), emoji .75s custom", descriptionKo: "Fun Bento는 9개 상태가 2초마다 이동하고 active bubble이 1.25배가 됩니다. 추출된 원본 emoji PNG 10개를 rail에 넣고 원본 cadence로 재구성했습니다.", code: "Source: Fun bento 9 states / 2s; extracted /assets/home/emoji-1.png through emoji-10.png; rail 1000ms expo; active bubble scale 1.25; inactive emoji scale .8; emoji duration .75 repeat 10 repeatDelay .25." },
    { id: "send-receive-swap", category: "status", title: "Easy Send Receive Swap Purchase", source: "원본 수치·CSS", trigger: "visible autoplay / button", duration: "2s row loop, send/swap 1s, receive .5s", easing: "spring 4/800/80 + ease-in-out", descriptionKo: "Easy Bento의 Send → Swap → Receive → Purchase 4개 row 루프와 원본 CSS 아이콘 keyframe을 합쳤습니다. 각 버튼으로도 같은 모션을 재생할 수 있습니다.", code: "Source: Easy bento rows Send → Swap → Receive → Purchase, 2s per state, active scale [1,.99,1]; swap rotates 360; receive arrow y:-100 enter." },
    { id: "padlock-security", category: "status", title: "Security Padlock Illustration", source: "영상 관찰·재구성", trigger: "lock / unlock", duration: "420ms", easing: "cubic-bezier(.19,1,.22,1)", descriptionKo: "Security 섹션의 큰 자물쇠 계열 이미지를 단순 SVG로 재구성하고 잠금/해제 상태를 확인할 수 있게 했습니다.", code: "Evidence: security section shows large lock/cloud illustration; exact lock transition not exposed. Reconstruction uses --fm-ease 420ms shackle transform." },
    { id: "activity-addition", category: "status", title: "Activity Transaction Addition", source: "영상 관찰·재구성", trigger: "add transaction", duration: "300ms insert", easing: "ease-out", descriptionKo: "Activity 데모에서 보이는 리스트 갱신을 거래 row 추가 애니메이션으로 재현합니다. 실제 거래 전송은 없습니다.", code: "Evidence: activity.mp4/list state change observed. Reconstruction: local row prepend with opacity/y insertion; list capped at four rows." },
    { id: "nft-progress-star", category: "status", title: "NFT Media Progress Star", source: "영상 관찰", trigger: "play / star", duration: "300-500ms control enter", easing: "ease-out", descriptionKo: "NFT 미디어 진행바와 원형 favorite 컨트롤 등장을 thumbnail stage로 재현합니다. star 상태는 클릭으로 토글됩니다.", code: "Evidence: NFT video shows media progress and circular favorite affordance entering around 300-500ms. Renderer recreates the visible state only." },
    { id: "transaction-toast", category: "status", title: "Monitor In Real-Time Toast Deck", source: "원본 수치·재구성", trigger: "visible autoplay / submit", duration: "2s deck loop, 250-900ms toast", easing: "spring mass4 stiffness800 damping80 approximation", descriptionKo: "Details의 Monitor In Real-Time 3상태 카드 deck cadence를 토스트 제출/완료 preview로 재구성했습니다. 보이는 동안 2초마다 상태가 바뀝니다.", code: "Source: Monitor In Real-Time three-state deck every 2s; layer y=0/10 and bottom transition [1,-80,20]; zIndex switches after .5s." },
    { id: "protection-badges", category: "status", title: "Protect Your Assets Badges", source: "원본 수치·재구성", trigger: "visible autoplay / toggle", duration: "1.75s loop, fill .4s", easing: "spring mass4 stiffness800 damping80 approximation", descriptionKo: "Protect Your Assets의 두 상태 warning/protection pill을 shield/check/cross badge로 풀었습니다. 원본 cadence인 1.75초 자동 전환을 반영합니다.", code: "Source: Protect Your Assets two-state pill every 1.75s; width 286.25→234.25, x 0→26; fill .4s ease." },
    { id: "wallet-assets", category: "status", title: "Organise Your Wallet Asset Reveal", source: "원본 수치·재구성", trigger: "visible autoplay / reorder", duration: "1.5s rows + 3s repeatDelay, number .8s", easing: "easeOut + keyframes", descriptionKo: "Organise Your Wallet의 ETH/USDC row phase와 숫자 tween을 자산 리스트로 재구성했습니다. row reorder와 잔액 변경이 자동/수동으로 동작합니다.", code: "Source: two asset rows, 1.5s keyframes, 3s repeatDelay; USDC phaseDelay 2s; X 0→64→0; number tween .8 easeOut. Renderer uses WAAPI number tween and row phase class." },
    { id: "wallet-grouping", category: "status", title: "See Everything Clearly Grouping", source: "원본 수치·재구성", trigger: "visible autoplay / select group", duration: "2s grouping loop", easing: "spring mass4 stiffness800 damping80 approximation", descriptionKo: "See Everything Clearly의 start/end grouping sequence를 selectable wallet group으로 구현했습니다. 2초마다 관계 표시가 전환됩니다.", code: "Source: See Everything Clearly start/end grouping toggles every 2s; scale settle [1,.98,1]; relationship marks spring in/out." },
    { id: "testimonial-rail", category: "content", title: "Testimonial Rail 120s Pause", source: "CSS 수치", trigger: "ambient / pause", duration: "120s loop", easing: "linear infinite", descriptionKo: "원본 CSS에서 확인된 testimonial row translateX 120초 루프입니다. 화면 밖에서는 pause하고, 사용자가 정지할 수 있습니다.", code: "Evidence: Testimonials__RowContainer translateX(0%)→translateX(-50%), 120s linear infinite, duplicated cards, hidden below 768px." },
    { id: "faq-accordion", category: "content", title: "FAQ Expansion Plus Minus", source: "원본 수치·네이티브 spring", trigger: "click", duration: "height spring, opacity delayed .1s", easing: "spring mass .2/.5 damping 18-20 stiffness 200-280", descriptionKo: "실제 FAQ는 한 항목만 열리고, answer height와 opacity, plus/minus bar가 서로 다른 spring 수치로 움직입니다. 이 카드에서는 JS spring keyframe을 생성해 네이티브 WAAPI로 실행합니다.", code: "Source: whileTap opacity .5/.1s; plus spring .5/220/20; height spring .2/280/18; answer opacity delay .1 then spring .5/200/18. Renderer generates physics keyframes." },
    { id: "article-hover", category: "content", title: "Article Image Hover 1.02", source: "CSS 수치", trigger: "hover / focus", duration: "180ms", easing: "ease", descriptionKo: "article 이미지 hover scale 1.02 패턴을 카드 썸네일로 보여줍니다. 터치 환경에서는 액션 버튼으로 같은 상태를 토글합니다.", code: "Evidence: article image thumbnail hover scale 1.02 with 180ms ease." },
    { id: "mobile-menu", category: "intro", title: "Mobile Menu Opening", source: "모바일 관찰·재구성", trigger: "menu button", duration: "200ms", easing: "ease-out", descriptionKo: "모바일 햄버거의 200ms transform 관찰값을 기준으로 sheet opening을 재구성했습니다. 실제 모바일 메뉴 녹화는 없어서 재구성 라벨을 붙였습니다.", code: "Evidence: live mobile hamburger transform 200ms. Reconstruction: line rotation and sheet opacity/y/scale over 200ms." },
    { id: "wallet-drag-reorder", category: "content", title: "Wallet Card Drag And Accessible Reorder", source: "영상 관찰·재구성", trigger: "drag / keyboard buttons", duration: "220ms", easing: "cubic-bezier(.19,1,.22,1)", descriptionKo: "Drag and Drop 데모를 실제 drag/drop 가능한 카드와 위/아래 버튼으로 구현했습니다. 키보드와 터치 대체 조작을 함께 제공합니다.", code: "Evidence: dragdropdone.mp4 demonstrates completed wallet drag/drop. Renderer: native draggable cards plus up/down buttons for keyboard/touch fallback." },
    { id: "footer-reveal", category: "intro", title: "Footer CTA Reveal", source: "원본 수치", trigger: "viewport once amount .25 / replay", duration: "stagger .025, spring settle", easing: "spring mass4 stiffness800 damping80", descriptionKo: "Footer CTA는 로드가 아니라 viewport 진입 amount .25에서 한 번 실행됩니다. 개별 path가 .025초 간격으로 등장하는 원본 spring 수치를 썸네일로 재현했습니다.", code: "Source: CallToAction useInView(ref,{once:true,amount:.25}); parent opacity reveal; staggerChildren .025; path spring mass4/stiffness800/damping80/restDelta .0001." }
  ];

  const FILTERS = [
    ["all", "전체"],
    ["intro", "인트로·내비"],
    ["status", "기능·상태"],
    ["content", "콘텐츠·제스처"]
  ];

  const roots = new Set();
  let reduced = false;

  const HERO_PRIORITY_SHAPES = [19, 20, 25, 26, 27, 29, 30, 50, 54, 55, 58, 62];

  function html(strings, ...values) {
    return strings.reduce((acc, part, index) => acc + part + (values[index] == null ? "" : values[index]), "");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
  }

  function mount(container) {
    const target = typeof container === "string" ? document.querySelector(container) : container;
    if (!target) throw new Error("FamilyMotionLibrary.mount(container) needs a valid container.");
    target.innerHTML = renderShell();
    const root = target.querySelector(".fm-library");
    roots.add(root);
    wireRoot(root);
    if (reduced) root.classList.add("fm-reduced");
    return root;
  }

  function renderShell() {
    return html`
      <section class="fm-library" aria-label="Family motion interaction library">
        <div class="fm-shell">
          <div class="fm-top">
            <div>
              <div class="fm-kicker">Motion system reconstruction</div>
              <h2 class="fm-title">인터랙션 썸네일 라이브러리</h2>
              <p class="fm-intro">Recent 영상, 현재 family.co CSS, 추가 소스 조사에서 확인된 모션을 시각 카드로 재구성했습니다. 각 카드는 근거 라벨, 트리거, 시간, easing, 직접 조작 가능한 preview, 접을 수 있는 코드 메모를 포함합니다.</p>
            </div>
            <div class="fm-toolbar" aria-label="Motion library controls">
              <label class="fm-search"><span>검색</span><input type="search" data-search placeholder="모션, 컴포넌트, 근거 검색"></label>
              ${FILTERS.map(([id, label]) => `<button class="fm-filter" type="button" data-filter="${id}" aria-pressed="${id === "all"}">${label}</button>`).join("")}
              <button class="fm-tool" type="button" data-tool="pause">전체 정지</button>
              <button class="fm-tool" type="button" data-tool="reduced" aria-pressed="false">모션 줄이기</button>
            </div>
          </div>
          <div class="fm-grid">
            ${DATA.map(renderCard).join("")}
          </div>
        </div>
        <dialog class="fm-dialog" aria-label="Motion preview 확대 보기"></dialog>
      </section>`;
  }

  const DISPLAY_TITLES = {"hero-entry-shapes":"Hero · drag & drift","nav-dropdown":"Dropdown","pill-cta":"CTA states","waitlist-validation":"Waitlist","backup-success":"Backing up","timeline-status":"Status timeline","urgency-selector":"Transaction speed","fun-carousel":"Fun carousel","send-receive-swap":"Quick actions","padlock-security":"Restful security","activity-addition":"Activity","nft-progress-star":"NFT controls","transaction-toast":"Monitor in real-time","protection-badges":"Protect your assets","wallet-assets":"Organise your wallet","wallet-grouping":"Wallet groups","testimonial-rail":"Friends of Family","faq-accordion":"FAQ","article-hover":"Article card","mobile-menu":"Mobile menu","wallet-drag-reorder":"Drag & drop","footer-reveal":"Explore Family"};
  function sourceLabel(item) {
    if (item.source.includes("원본 에셋")) return "원본 에셋 · 재구성";
    if (item.source.includes("원본")) return "원본 수치 · 재구성";
    if (item.source.includes("CSS")) return "CSS 근거 · 재구성";
    if (item.source.includes("토큰")) return "토큰 근거 · 추론 대체";
    return "영상 근거 · 추론 대체";
  }

  function sourceNote(item) {
    if (item.source.includes("원본 에셋")) return "공개 페이지에서 추출한 에셋을 사용합니다. 정적 HTML/JS 재구성이므로 원본 React/Framer 코드와 동일하다는 뜻은 아닙니다.";
    if (item.source.includes("원본")) return "공개 번들에서 확인한 수치를 네이티브 HTML/CSS/JS로 재구성했습니다.";
    if (item.source.includes("CSS")) return "공개 CSS에서 확인한 값입니다. 컴포넌트 구조는 로컬 preview에 맞게 재구성했습니다.";
    if (item.source.includes("토큰")) return "공개 토큰은 확인됐지만 서버/앱 내부 흐름은 비공개라 로컬 검증 상태로 대체했습니다.";
    if (item.source.includes("재구성")) return "영상에서 보이는 상태를 기반으로 만든 추론 대체입니다. 비공개 앱 구조를 원본 코드처럼 단정하지 않습니다.";
    return "영상 관찰 근거입니다. 내부 앱 구현 코드는 비공개라 로컬 preview로 재구성했습니다.";
  }
  function renderCard(item) {
    return html`
      <article class="fm-card" data-id="${item.id}" data-category="${item.category}">
        <div class="fm-stage" tabindex="-1">${renderStage(item.id)}</div>
        <div class="fm-card-head">
          <div class="fm-card-title-row">
            <h3>${escapeHtml(DISPLAY_TITLES[item.id] || item.title)}</h3>
            <span class="fm-label" data-source="${escapeHtml(item.source)}">${escapeHtml(sourceLabel(item))}</span>
          </div>
          <ul class="fm-meta">
            <li>Trigger: ${escapeHtml(item.trigger)}</li>
            <li>Duration: ${escapeHtml(item.duration)}</li>
            <li>Easing: ${escapeHtml(item.easing)}</li>
          </ul>
          <p class="fm-desc">${escapeHtml(item.descriptionKo)}</p>
          <p class="fm-source-note">${escapeHtml(sourceNote(item))}</p>
          <p class="fm-how">${escapeHtml(howTo(item))}</p>
        </div>
        <div class="fm-controls">
          <button class="fm-action" type="button" data-action="primary">다음 상태</button>
          <button type="button" data-action="replay">재생</button>
          <button type="button" data-action="reset">초기화</button>
          <button type="button" data-action="expand">확대</button>
        </div>
        <details class="fm-code">
          <summary>구현 노트</summary>
          <p class="fm-code-source">${escapeHtml(item.source)}</p><pre>${escapeHtml(item.code)}</pre><a href="motion-library.js" download>motion-library.js 다운로드 ↓</a> · <a href="motion-library.css" download>motion-library.css 다운로드 ↓</a>
        </details>
      </article>`;
  }

  function howTo(item) {
    if (item.trigger.includes("drag")) return "사용법: 장식이나 카드 끌기, 다음 상태로 다음 상태, 재생으로 모션 재생, 초기화로 초기화.";
    if (item.trigger.includes("input")) return "사용법: 입력값을 바꾼 뒤 Action을 누르면 valid/invalid 상태가 즉시 표시됩니다.";
    if (item.trigger.includes("hover")) return "사용법: 썸네일에 hover/focus하거나 다음 상태로 같은 상태를 토글합니다.";
    if (item.trigger.includes("visible autoplay")) return "사용법: 보이는 동안 자동 순환합니다. Action은 다음 상태, 전체 정지는 전체 정지입니다.";
    return "사용법: 다음 상태로 핵심 상태를 바꾸고, 재생·초기화·확대로 모션을 다시 확인합니다.";
  }

  function renderStage(id) {
    const stages = {
      "hero-entry-shapes": heroStage,
      "nav-dropdown": navStage,
      "pill-cta": ctaStage,
      "waitlist-validation": waitlistStage,
      "backup-success": backupStage,
      "timeline-status": timelineStage,
      "urgency-selector": urgencyStage,
      "fun-carousel": carouselStage,
      "send-receive-swap": iconsStage,
      "padlock-security": lockStage,
      "activity-addition": activityStage,
      "nft-progress-star": nftStage,
      "transaction-toast": toastStage,
      "protection-badges": badgesStage,
      "wallet-assets": walletAssetsStage,
      "wallet-grouping": groupingStage,
      "testimonial-rail": railStage,
      "faq-accordion": faqStage,
      "article-hover": articleStage,
      "mobile-menu": mobileStage,
      "wallet-drag-reorder": dragStage,
      "footer-reveal": footerStage
    };
    return stages[id]();
  }

  function heroStage() {
    const shapes = Array.from({ length: 69 }, (_, index) => heroShape(index)).join("");
    return html`<div class="fm-hero-stage">
      <div class="fm-hero-copy"><span class="fm-hero-word">Your crypto.</span><span class="fm-hero-word">Family style.</span><small>도형을 끌어보세요.</small></div>
      <div class="fm-hero-shapes" aria-hidden="true">${shapes}</div>
    </div>`;
  }

  function footerStage() {
    const shapes = [19, 25, 27, 30, 50, 54, 58, 62, 20, 26, 55, 29].map((index, order) => heroShape(index, order)).join("");
    return html`<div class="fm-footer-stage">
      <div class="fm-footer-copy"><strong>Explore Family</strong><span>Your crypto. Family style.</span><button type="button" tabindex="-1">Get Started</button></div>
      <div class="fm-footer-shapes" aria-hidden="true">${shapes}</div>
    </div>`;
  }

  function heroShape(index, forcedOrder) {
    const priority = HERO_PRIORITY_SHAPES.indexOf(index);
    const order = forcedOrder != null ? forcedOrder : priority >= 0 ? priority : HERO_PRIORITY_SHAPES.length + index;
    const angle = (index * 137.5) % 360;
    const radius = priority >= 0 ? 40 + priority * 3 : 88 + (index % 7) * 8;
    const positions = [[10,18],[89,19],[9,49],[90,48],[12,83],[90,82],[32,6],[66,7],[34,94],[64,94],[3,66],[97,65]];
    const point = priority >= 0 ? positions[priority % positions.length] : [(index % 4 < 2) ? (index % 2 ? 98 : 2) : 10 + (index % 10) * 9, (index % 4 < 2) ? 10 + (index % 8) * 11 : (index % 2 ? 98 : 2)];
    const x = point[0], y = point[1];
    const size = priority >= 0 ? [44,42,40,40,36,38,26,28,28,28,22,22][priority % 12] : 8 + (index % 4) * 3;
    const delay = forcedOrder != null ? order * 25 : (68 - order) * 50;
    return `<span class="fm-hero-shape fm-draggable" data-drag="shape" data-home-x="0" data-home-y="0" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;--s:${size}px;--d:${delay}ms;--dur:${2 + (index % 7) / 6}s;--rot:${((index % 5) - 2) * 1.3}deg;--z:${priority >= 0 ? 3 : 1};"><img alt="" src="references/v2-source/previews/shape-${String(index).padStart(2, "0")}.svg"></span>`;
  }

  function navStage() {
    return html`<div class="fm-nav-demo">
      <div class="fm-nav-bar"><span class="fm-nav-item">Family</span><span class="fm-nav-item">Developers ↑</span><span class="fm-nav-item">Resources</span></div>
      <div class="fm-dropdown"><div class="fm-menu-row">ConnectKit<small>Wallet UX library</small></div><div class="fm-menu-row">Family account<small>Embedded account</small></div></div>
    </div>`;
  }

  function ctaStage() {
    return html`<div class="fm-cta-demo"><button class="fm-pill-cta" type="button" data-cta-direct><span data-cta-text>Join Waitlist</span><span class="fm-cta-circle">→</span></button><div class="fm-state-note" data-note>버튼을 눌러 상태를 확인하세요.</div></div>`;
  }

  function waitlistStage() {
    return html`<form class="fm-waitlist" data-local-form><label class="fm-email-pill" data-email-pill><input value="hello@family.co" aria-label="Email demo" autocomplete="off"><span class="fm-cta-circle">→</span></label><div class="fm-state-note" data-note>이메일을 바꾸거나 Action을 누르세요.</div></form>`;
  }

  function backupStage() {
    return html`<div class="fm-badge-scene"><div class="fm-secure-rings"></div><div class="fm-cloud"></div><div class="fm-success-badge">✓</div><div class="fm-backup-label" data-backup-label>Back Up Now</div></div>`;
  }

  function timelineStage() {
    return html`<div class="fm-timeline" data-step="0"><div class="fm-date-card"><small>Fast bento status</small><strong data-fast-label>Submitted today</strong></div>${["Submitted", "Pending", "Completed"].map((label, index) => `<div class="fm-step ${index === 0 ? "is-current" : ""}" data-step-index="${index}"><span class="fm-step-dot">${index + 1}</span><span>${label}</span><small>${index === 0 ? "now" : ""}</small></div>`).join("")}</div>`;
  }

  function urgencyStage() {
    return html`<div class="fm-urgency"><div class="fm-urgency-row">${["Normal", "Fast", "Urgent"].map((label, i) => `<button type="button" class="fm-choice ${i === 2 ? "is-selected" : ""}" data-choice="${label}">${label}</button>`).join("")}</div><div class="fm-price-card"><small>Estimated confirmation</small><strong data-urgency-time>~15 Secs</strong><span data-urgency-copy>Urgent fee selected</span></div></div>`;
  }

  function carouselStage() {
    const emojis = Array.from({ length: 10 }, (_, index) => `<img class="${index === 0 ? "is-active" : ""}" src="references/assets/emoji-${index + 1}.png" alt="" loading="lazy">`).join("");
    return html`<div class="fm-carousel" data-slide="0"><div class="fm-emoji-window"><div class="fm-emoji-rail">${emojis}</div></div><div class="fm-state-note" data-note>original emoji asset 1 / 10</div></div>`;
  }

  function iconsStage() {
    return html`<div class="fm-icon-controls"><div class="fm-icon-orb is-send" data-icon="send">${sendIcon()}</div><div class="fm-icon-row"><button type="button" data-icon-action="send">Send</button><button type="button" data-icon-action="swap">Swap</button><button type="button" data-icon-action="receive">Receive</button><button type="button" data-icon-action="purchase">Purchase</button></div></div>`;
  }

  function lockStage() {
    return html`<div class="fm-lock-scene"><svg class="fm-lock" viewBox="0 0 128 128" aria-hidden="true"><path class="fm-lock-shackle" d="M39 58V43C39 29 50 18 64 18s25 11 25 25v15" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round"/><rect class="fm-lock-body" x="28" y="53" width="72" height="58" rx="18" fill="var(--fm-orange)"/><circle cx="64" cy="79" r="7" fill="#171717"/><path d="M64 84v13" stroke="#171717" stroke-width="8" stroke-linecap="round"/></svg><div class="fm-state-note" data-note>locked</div></div>`;
  }

  function activityStage() {
    return html`<div class="fm-activity-list" data-activity-list>${activityRow("Receive", "+0.24 ETH", "var(--fm-green)")}${activityRow("Swap", "USDC → ETH", "var(--fm-purple)")}${activityRow("Send", "-32 USDC", "var(--fm-blue)")}</div>`;
  }

  function nftStage() {
    return html`<div class="fm-media"><div class="fm-media-art"><button type="button" class="fm-star" data-star aria-pressed="false">★</button></div><div class="fm-progress"><span></span></div><div class="fm-state-note">media progress + favorite control</div></div>`;
  }

  function toastStage() {
    return html`<div class="fm-toast-stage"><div class="fm-phone"><div class="fm-mini-app"><div class="fm-app-row"><span>Balance</span><strong>$4,280</strong></div><div class="fm-app-row"><span>Network</span><span>Base</span></div></div></div><div class="fm-toast"><span class="fm-avatar">↗</span><span data-toast-copy>Transaction submitted</span></div></div>`;
  }

  function badgesStage() {
    return html`<div class="fm-badges"><button type="button" class="fm-protect is-watch is-active" data-badge="watch">${shieldIcon("?")}</button><button type="button" class="fm-protect is-good" data-badge="good">${shieldIcon("✓")}</button><button type="button" class="fm-protect is-bad" data-badge="bad">${shieldIcon("×")}</button></div>`;
  }

  function walletAssetsStage() {
    return html`<div class="fm-wallet-assets"><div class="fm-balance-card"><small>Total balance</small><strong data-balance data-value="12804">$12,804</strong></div>${walletRow("ETH", "$8,210", "var(--fm-blue)")}${walletRow("USDC", "$2,180", "var(--fm-green)")}${walletRow("NFTs", "12 items", "var(--fm-purple)")}</div>`;
  }

  function groupingStage() {
    return html`<div class="fm-grouping"><div class="fm-group-pills"><button type="button" class="fm-choice is-selected" data-group="Family">Family</button><button type="button" class="fm-choice" data-group="Work">Work</button><button type="button" class="fm-choice" data-group="Vault">Vault</button></div><div class="fm-group-card"><div class="fm-group-title"><small data-group-label>Family wallets</small><strong data-group-count>3 wallets</strong></div><div class="fm-wallet-row"><span>Main</span><strong>Active</strong></div><div class="fm-wallet-row"><span>Shared</span><strong>Watch</strong></div></div></div>`;
  }

  function railStage() {
    const quotes = ["Feels friendly without hiding power.", "The wallet details are finally readable.", "Small motions make the scary parts clear.", "Family keeps the product demo honest."];
    return html`<div class="fm-rail-wrap"><div class="fm-rail">${quotes.concat(quotes).map((q, i) => `<div class="fm-quote"><strong>${["Alex", "Min", "Jules", "Rae"][i % 4]}</strong>${q}</div>`).join("")}</div></div>`;
  }

  function faqStage() {
    return html`<div class="fm-faq">${["How does Family keep assets safe?", "Can I organize wallets?", "Does it support NFTs?"].map((q, i) => `<div class="fm-faq-row ${i === 0 ? "is-open" : ""}"><button type="button" class="fm-faq-btn" aria-expanded="${i === 0}"><span>${q}</span><span class="fm-plus" aria-hidden="true"><i></i><b></b></span></button><div class="fm-faq-answer" style="height:${i === 0 ? "auto" : "0px"}"><div style="opacity:${i === 0 ? "1" : "0"}">답변은 원본 spring 수치에서 생성한 keyframe으로 높이와 opacity가 따로 움직입니다. open=<span data-faq-state>${i === 0 ? "true" : "false"}</span></div></div></div>`).join("")}</div>`;
  }

  function articleStage() {
    return html`<article class="fm-article" tabindex="0"><div class="fm-article-art"></div><div class="fm-article-body"><small>Latest from Family</small><strong>ConnectKit update with warmer details</strong></div></article>`;
  }

  function mobileStage() {
    return html`<div class="fm-mobile"><div class="fm-mobile-frame"><button type="button" class="fm-hamburger" data-menu aria-label="menu"><span></span><span></span><span></span></button><div class="fm-mobile-sheet"><div class="fm-menu-row">Download</div><div class="fm-menu-row">Developers</div><div class="fm-menu-row">Resources</div></div></div></div>`;
  }

  function dragStage() {
    return html`<div class="fm-reorder" data-reorder>${["Main wallet", "NFT vault", "Travel wallet"].map((name, i) => dragCard(name, i)).join("")}</div>`;
  }

  function activityRow(kind, value, color) {
    return `<div class="fm-activity-row"><span class="fm-dot" style="background:${color}"></span><strong>${kind}</strong><span>${value}</span></div>`;
  }

  function walletRow(name, value, color) {
    return `<div class="fm-wallet-row"><span class="fm-dot" style="background:${color}"></span><strong>${name}</strong><span>${value}</span></div>`;
  }

  function dragCard(name, index) {
    return `<div class="fm-drag-card" draggable="true" tabindex="0" data-drag-card aria-grabbed="false"><strong>${name}</strong><div class="fm-drag-actions"><button type="button" aria-label="Move up" data-move="up">↑</button><button type="button" aria-label="Move down" data-move="down">↓</button></div></div>`;
  }

  function shapeSvg(index) {
    const shapes = [
      '<path d="M39 8l8 20 21 1-16 13 5 21-18-11-18 11 5-21L10 29l21-1z" fill="currentColor"/>',
      '<path d="M40 64C15 49 9 29 20 18c8-8 17-4 20 4 3-8 13-12 21-4 11 11 5 31-21 46z" fill="currentColor"/>',
      '<path d="M16 46c9-21 27-31 48-22-6 24-20 39-48 22z" fill="currentColor"/>',
      '<path d="M20 18h40v40H20z" rx="16" fill="currentColor" transform="rotate(12 40 40)"/>',
      '<circle cx="40" cy="40" r="24" fill="currentColor"/><path d="M29 39h22M40 28v22" stroke="#fff" stroke-width="7" stroke-linecap="round"/>',
      '<path d="M13 31c17-23 43-23 54 0-10 25-38 34-54 0z" fill="currentColor"/><circle cx="41" cy="34" r="7" fill="#fff"/>',
      '<path d="M18 21l44 18-44 20 10-20z" fill="currentColor"/>',
      '<path d="M40 10l25 15v30L40 70 15 55V25z" fill="currentColor"/>',
      '<path d="M21 16h38v49H21z" rx="8" fill="currentColor"/><path d="M30 29h20M30 41h20M30 53h12" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
    ];
    return shapes[index % shapes.length];
  }

  function sendIcon() {
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M9 32l44-20-11 42-10-17-16 10 10-16z" fill="currentColor"/></svg>';
  }

  function receiveIcon() {
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 8v38M17 31l15 15 15-15" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 54h36" stroke="currentColor" stroke-width="8" stroke-linecap="round"/></svg>';
  }

  function swapIcon() {
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 22h28l-8-8M46 42H18l8 8" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function purchaseIcon() {
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 20h8l5 25h22l5-17H26" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="31" cy="53" r="4" fill="currentColor"/><circle cx="48" cy="53" r="4" fill="currentColor"/></svg>';
  }

  function shieldIcon(mark) {
    return `<svg viewBox="0 0 64 70" aria-hidden="true"><path d="M32 4l24 9v18c0 16-10 28-24 35C18 59 8 47 8 31V13z" fill="currentColor" opacity=".18"/><path d="M32 4l24 9v18c0 16-10 28-24 35C18 59 8 47 8 31V13z" fill="none" stroke="currentColor" stroke-width="5"/><text x="32" y="40" text-anchor="middle" font-size="24" font-weight="900" fill="currentColor">${mark}</text></svg>`;
  }

  function wireRoot(root) {
    root.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || !root.contains(button)) return;
      const card = button.closest(".fm-card") || button.closest("[data-dialog-card]");
      if (button.hasAttribute("data-cta-direct") && card) return cycleCta(card);
      if (button.matches(".fm-filter")) return filter(root, button.dataset.filter);
      if (button.dataset.tool) return runTool(root, button);
      if (button.dataset.action && card) return runCardAction(root, card, button.dataset.action);
      if (button.dataset.choice) return selectUrgency(button);
      if (button.dataset.iconAction && card) return playIcon(card, button.dataset.iconAction);
      if (button.dataset.star != null && card) return toggleStar(button, card);
      if (button.dataset.badge && card) return selectBadge(card, button);
      if (button.matches(".fm-faq-btn")) return toggleFaq(button);
      if (button.dataset.group) return selectGroup(card, button);
      if (button.dataset.move) return moveDragCard(button.closest("[data-drag-card]"), button.dataset.move);
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("[data-local-form] input")) validateEmail(event.target);
      if (event.target.matches("[data-search]")) applyVisibility(root);
    });
    root.addEventListener("submit", (event) => event.preventDefault());
    wireDrag(root);
    wireHeroDrag(root);
    observeVisibility(root);
    startLoops(root);
    root.querySelectorAll(".fm-card").forEach((card) => replay(card));
  }

  function filter(root, filterId) {
    root.querySelectorAll(".fm-filter").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.filter === filterId)));
    root.dataset.filter = filterId;
    applyVisibility(root);
  }

  function applyVisibility(root) {
    const filterId = root.dataset.filter || "all";
    const query = (root.querySelector("[data-search]")?.value || "").trim().toLowerCase();
    root.querySelectorAll(".fm-card").forEach((card) => {
      const item = DATA.find((entry) => entry.id === card.dataset.id);
      const categoryMatch = filterId === "all" || card.dataset.category === filterId;
      const searchText = item ? `${item.id} ${item.title} ${item.source} ${item.trigger} ${item.descriptionKo} ${item.code}`.toLowerCase() : "";
      card.hidden = !categoryMatch || (query && !searchText.includes(query));
    });
  }

  function runTool(root, button) {
    if (button.dataset.tool === "pause") {
      root.classList.toggle("fm-paused");
      button.textContent = root.classList.contains("fm-paused") ? "전체 재개" : "전체 정지";
    }
    if (button.dataset.tool === "reduced") {
      const next = !root.classList.contains("fm-reduced");
      setReduced(next);
    }
  }

  function runCardAction(root, card, action) {
    if (action === "replay") return replay(card);
    if (action === "reset") return reset(card);
    if (action === "expand") return expand(root, card);
    const handlers = {
      "nav-dropdown": () => card.classList.toggle("is-active"),
      "pill-cta": () => cycleCta(card),
      "waitlist-validation": () => validateEmail(card.querySelector("input")),
      "backup-success": () => cycleBackup(card),
      "timeline-status": () => advanceTimeline(card),
      "urgency-selector": () => selectUrgency(nextChoice(card)),
      "fun-carousel": () => nextSlide(card),
      "send-receive-swap": () => cycleEasyIcon(card),
      "padlock-security": () => toggleLock(card),
      "activity-addition": () => addActivity(card),
      "nft-progress-star": () => { card.classList.toggle("is-active"); replay(card); },
      "transaction-toast": () => cycleToast(card),
      "protection-badges": () => selectBadge(card, nextBadge(card)),
      "wallet-assets": () => toggleWalletAssets(card),
      "wallet-grouping": () => selectGroup(card, nextGroup(card)),
      "testimonial-rail": () => card.classList.toggle("is-paused"),
      "faq-accordion": () => toggleFaq(card.querySelector(".fm-faq-btn")),
      "article-hover": () => card.classList.toggle("is-active"),
      "mobile-menu": () => card.classList.toggle("is-active"),
      "wallet-drag-reorder": () => moveDragCard(card.querySelector("[data-drag-card]"), "down"),
      "footer-reveal": () => replay(card),
      "hero-entry-shapes": () => replay(card)
    };
    const handler = handlers[card.dataset.id];
    if (handler) handler();
  }

  function replay(card) {
    if (!card) return;
    card.classList.remove("is-replaying");
    card.getBoundingClientRect();
    card.classList.add("is-replaying", "is-active");
    window.setTimeout(() => card.classList.remove("is-replaying"), reduced ? 30 : 2200);
  }

  function reset(card) {
    card.className = "fm-card";
    const item = DATA.find((entry) => entry.id === card.dataset.id);
    if (item) card.dataset.category = item.category;
    const stage = card.querySelector(".fm-stage");
    if (stage && item) stage.innerHTML = renderStage(item.id);
    wireHeroDrag(card);
    wireDrag(card);
  }

  function expand(root, card) {
    const dialog = root.querySelector(".fm-dialog");
    const item = DATA.find((entry) => entry.id === card.dataset.id);
    dialog.innerHTML = `<div class="fm-dialog-head"><h3 class="fm-title">${escapeHtml(DISPLAY_TITLES[item.id] || item.title)}</h3><button type="button" data-dialog-close>닫기</button></div>${renderCard(item)}`;
    const expandedCard = dialog.querySelector(".fm-card");
    expandedCard.classList.add("fm-dialog-inner");
    expandedCard.setAttribute("data-dialog-card", "");
    dialog.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => { dialog.innerHTML = ""; }, { once: true });
    dialog.showModal();
    wireHeroDrag(dialog);
    wireDrag(dialog);
    replay(expandedCard);
  }

  function cycleBackup(card) {
    const step=(Number(card.dataset.backupStep||0)+1)%3;
    card.dataset.backupStep=String(step);
    card.querySelector('[data-backup-label]').textContent=['Back Up Now','Backing Up','Backed Up'][step];
    card.querySelector('.fm-success-badge').textContent=['↑','↻','✓'][step];
    replay(card);
  }

  function cycleCta(card) {
    const pill = card.querySelector(".fm-pill-cta");
    const text = card.querySelector("[data-cta-text]");
    const note = card.querySelector("[data-note]");
    pill.classList.add("is-loading");
    pill.classList.remove("is-success");
    text.textContent = "Joining...";
    note.textContent = "loading skeleton 1200ms";
    window.setTimeout(() => {
      pill.classList.remove("is-loading");
      pill.classList.add("is-success");
      text.textContent = "You're in";
      note.textContent = "success state";
    }, reduced ? 50 : 900);
  }

  function validateEmail(input) {
    const pill = input.closest("[data-email-pill]");
    const note = input.closest(".fm-waitlist").querySelector("[data-note]");
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    pill.dataset.valid = String(valid);
    note.textContent = valid ? "valid 토큰: --color-valid" : "invalid 토큰: --color-invalid";
  }

  function advanceTimeline(card) {
    const timeline = card.querySelector(".fm-timeline");
    const next = (Number(timeline.dataset.step || 0) + 1) % 3;
    timeline.dataset.step = String(next);
    timeline.querySelectorAll(".fm-step").forEach((step, index) => {
      step.classList.toggle("is-done", index < next);
      step.classList.toggle("is-current", index === next);
      step.querySelector("small").textContent = index < next ? "done" : index === next ? "now" : "";
    });
    const labels = ["Submitted today", "Pending onchain", "Completed"];
    const fastLabel = timeline.querySelector("[data-fast-label]");
    if (fastLabel) fastLabel.textContent = labels[next];
  }

  function selectUrgency(button) {
    if (!button) return;
    const card = button.closest(".fm-card") || button.closest(".fm-dialog");
    const values = {
      Normal: ["~60 Secs", "Normal fee selected"],
      Fast: ["~30 Secs", "Fast fee selected"],
      Urgent: ["~15 Secs", "Urgent fee selected"]
    };
    button.parentElement.querySelectorAll(".fm-choice").forEach((choice) => choice.classList.toggle("is-selected", choice === button));
    const [time, copy] = values[button.dataset.choice] || values.Normal;
    const number=card.querySelector("[data-urgency-time]");
    const from=Number(number.textContent.replace(/[^0-9]/g,"")) || 15;
    const to=Number(time.replace(/[^0-9]/g,""));
    animateNumber(number,from,to,800,"~"," Secs");
    card.querySelector("[data-urgency-copy]").textContent = copy;
  }

  function nextChoice(card) {
    const choices = Array.from(card.querySelectorAll("[data-choice]"));
    return choices[(choices.findIndex((choice) => choice.classList.contains("is-selected")) + 1) % choices.length];
  }

  function nextSlide(card) {
    const carousel = card.querySelector(".fm-carousel");
    const next = (Number(carousel.dataset.slide || 0) + 1) % 10;
    carousel.dataset.slide = String(next);
    const rail = carousel.querySelector(".fm-emoji-rail");
    rail.style.transform = `translateX(calc(${next} * -74px))`;
    rail.querySelectorAll("img").forEach((img, index) => img.classList.toggle("is-active", index === next));
    carousel.querySelector("[data-note]").textContent = `original emoji asset ${next + 1} / 10`;
    card.classList.toggle("is-active");
  }

  function playIcon(card, type) {
    const orb = card.querySelector(".fm-icon-orb");
    orb.className = `fm-icon-orb is-${type}`;
    orb.innerHTML = type === "send" ? sendIcon() : type === "receive" ? receiveIcon() : type === "purchase" ? purchaseIcon() : swapIcon();
    orb.classList.remove("is-playing");
    orb.getBoundingClientRect();
    orb.classList.add("is-playing");
  }

  function toggleLock(card) {
    card.classList.toggle("is-unlocked");
    card.querySelector("[data-note]").textContent = card.classList.contains("is-unlocked") ? "unlocked" : "locked";
  }

  function addActivity(card) {
    const list = card.querySelector("[data-activity-list]");
    const rows = [
      ["Receive", "+0.08 ETH", "var(--fm-green)"],
      ["Protected", "Shield passed", "var(--fm-blue)"],
      ["Swap", "ETH → USDC", "var(--fm-purple)"],
      ["Send", "-12 USDC", "var(--fm-orange)"]
    ];
    const row = rows[Math.floor(Math.random() * rows.length)];
    list.insertAdjacentHTML("afterbegin", activityRow(row[0], row[1], row[2]));
    while (list.children.length > 4) list.lastElementChild.remove();
  }

  function toggleStar(button, card) {
    const on = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(on));
    button.classList.toggle("is-on", on);
    card.classList.add("is-active");
  }

  function cycleToast(card) {
    const toast = card.querySelector(".fm-toast");
    const copy = card.querySelector("[data-toast-copy]");
    card.classList.add("is-active");
    toast.classList.remove("is-complete");
    copy.textContent = "Transaction submitted";
    window.setTimeout(() => {
      toast.classList.add("is-complete");
      copy.textContent = "Transaction completed";
    }, reduced ? 50 : 850);
  }

  function selectBadge(card, button) {
    card.querySelectorAll("[data-badge]").forEach((badge) => badge.classList.toggle("is-active", badge === button));
  }

  function nextBadge(card) {
    const badges = Array.from(card.querySelectorAll("[data-badge]"));
    return badges[(badges.findIndex((badge) => badge.classList.contains("is-active")) + 1) % badges.length];
  }

  function toggleWalletAssets(card) {
    const balance = card.querySelector("[data-balance]");
    const from = Number(balance.dataset.value || 12804);
    const to = from === 12804 ? 13118 : 12804;
    animateNumber(balance, from, to, 800, "$");
    const rows = Array.from(card.querySelectorAll(".fm-wallet-row"));
    rows.forEach((row, index) => {
      row.classList.remove("is-phasing");
      row.getBoundingClientRect();
      row.style.animationDelay = `${index === 1 ? 2000 : 0}ms`;
      row.classList.add("is-phasing");
    });
    rows[0].parentElement.appendChild(rows[0]);
    replay(card);
  }

  function selectGroup(card, button) {
    const values = {
      Family: ["Family wallets", "3 wallets"],
      Work: ["Work wallets", "2 wallets"],
      Vault: ["Vault wallets", "5 wallets"]
    };
    button.parentElement.querySelectorAll("[data-group]").forEach((group) => group.classList.toggle("is-selected", group === button));
    const [label, count] = values[button.dataset.group] || values.Family;
    card.querySelector("[data-group-label]").textContent = label;
    card.querySelector("[data-group-count]").textContent = count;
  }

  function nextGroup(card) {
    const groups = Array.from(card.querySelectorAll("[data-group]"));
    return groups[(groups.findIndex((group) => group.classList.contains("is-selected")) + 1) % groups.length];
  }

  function toggleFaq(button) {
    const row = button.closest(".fm-faq-row");
    const faq = row.parentElement;
    faq.querySelectorAll(".fm-faq-row").forEach((item) => {
      const open = item === row && !item.classList.contains("is-open");
      setFaqOpen(item, open);
    });
  }

  function setFaqOpen(row, open) {
    const button = row.querySelector(".fm-faq-btn");
    const answer = row.querySelector(".fm-faq-answer");
    const content = answer.firstElementChild;
    const icon = row.querySelector(".fm-plus");
    const state = row.querySelector("[data-faq-state]");
    const startHeight = row.classList.contains("is-open") ? content.scrollHeight : 0;
    row.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    if (state) state.textContent = String(open);
    const endHeight = open ? content.scrollHeight : 0;
    animateSpring(answer, "height", startHeight, endHeight, { mass: .2, stiffness: 280, damping: 18, duration: 620 });
    animateSpring(content, "opacity", open ? 0 : 1, open ? 1 : 0, { mass: .5, stiffness: 200, damping: 18, delay: open ? 100 : 0, duration: 520 });
    animateFaqIcon(icon, open);
  }

  function springFrames(from, to, options) {
    const duration = options.duration || 600;
    const frames = [];
    let x = from;
    let v = 0;
    const dt = 1 / 60;
    const steps = Math.max(2, Math.round(duration / 1000 / dt));
    for (let i = 0; i <= steps; i += 1) {
      const progress = i / steps;
      frames.push({ offset: progress, value: x });
      const force = -options.stiffness * (x - to);
      const damping = -options.damping * v;
      const a = (force + damping) / options.mass;
      v += a * dt;
      x += v * dt;
    }
    frames[frames.length - 1].value = to;
    return frames;
  }

  function animateSpring(node, property, from, to, options) {
    if (reduced || !node.animate) {
      node.style[property] = property === "opacity" ? String(to) : `${to}px`;
      return;
    }
    const frames = springFrames(from, to, options).map((frame) => ({
      offset: frame.offset,
      [property]: property === "opacity" ? String(Math.max(0, Math.min(1, frame.value))) : `${Math.max(0, frame.value)}px`
    }));
    const animation = node.animate(frames, { duration: options.duration || 600, delay: options.delay || 0, fill: "both" });
    animation.onfinish = () => {
      node.style[property] = property === "opacity" ? String(to) : openHeightValue(property, to);
    };
  }

  function openHeightValue(property, value) {
    return property === "height" && value > 0 ? "auto" : `${value}px`;
  }

  function animateFaqIcon(icon, open) {
    const vertical = icon.querySelector("b");
    const horizontal = icon.querySelector("i");
    const options = { mass: .5, stiffness: 220, damping: 20, duration: 520 };
    animateSpringTransform(vertical, open ? 1 : 0, open ? 0 : 1, options, (value) => `translate(-50%, -50%) rotate(${80 * (1 - value)}deg) scaleY(${value})`);
    animateSpringTransform(horizontal, 1, 1, options, () => "translate(-50%, -50%)");
  }

  function animateSpringTransform(node, from, to, options, mapper) {
    if (!node) return;
    if (reduced || !node.animate) {
      node.style.transform = mapper(to);
      return;
    }
    const frames = springFrames(from, to, options).map((frame) => ({ offset: frame.offset, transform: mapper(frame.value) }));
    const animation = node.animate(frames, { duration: options.duration || 600, delay: options.delay || 0, fill: "both" });
    animation.onfinish = () => { node.style.transform = mapper(to); };
  }

  function wireDrag(scope) {
    let dragged = null;
    scope.querySelectorAll("[data-drag-card]").forEach((card) => {
      card.addEventListener("dragstart", () => {
        dragged = card;
        card.setAttribute("aria-grabbed", "true");
      });
      card.addEventListener("dragend", () => {
        if (dragged) dragged.setAttribute("aria-grabbed", "false");
        dragged = null;
      });
      card.addEventListener("dragover", (event) => event.preventDefault());
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        if (!dragged || dragged === card) return;
        const list = card.parentElement;
        const cards = Array.from(list.children);
        list.insertBefore(dragged, cards.indexOf(dragged) < cards.indexOf(card) ? card.nextSibling : card);
      });
    });
  }

  function moveDragCard(card, direction) {
    if (!card) return;
    const sibling = direction === "up" ? card.previousElementSibling : card.nextElementSibling;
    if (!sibling) return;
    if (direction === "up") card.parentElement.insertBefore(card, sibling);
    else card.parentElement.insertBefore(sibling, card);
    card.focus();
  }

  function wireHeroDrag(scope) {
    scope.querySelectorAll(".fm-draggable").forEach((node) => {
      let start = null;
      node.style.cursor = "grab";
      node.addEventListener("pointerdown", (event) => {
        start = { x: event.clientX, y: event.clientY, tx: 0, ty: 0 };
        node.setPointerCapture(event.pointerId);
        node.classList.add("is-dragging");
        node.style.cursor = "grabbing";
      });
      node.addEventListener("pointermove", (event) => {
        if (!start || reduced) return;
        const dx = (event.clientX - start.x) * .1;
        const dy = (event.clientY - start.y) * .1;
        start.tx = dx;
        start.ty = dy;
        node.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      node.addEventListener("pointerup", () => {
        if (!start) return;
        const release = start;
        animateSpringTransform(node, 1, 0, { mass: 1, stiffness: 600, damping: 20, duration: 620 }, (value) => `translate(${release.tx * value}px, ${release.ty * value}px)`);
        node.style.cursor = "grab";
        window.setTimeout(() => node.classList.remove("is-dragging"), reduced ? 30 : 620);
        start = null;
      });
    });
  }

  function observeVisibility(root) {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("is-paused", !entry.isIntersecting));
    }, { threshold: .08 });
    root.querySelectorAll(".fm-card").forEach((card) => observer.observe(card));
    const footer = root.querySelector('.fm-card[data-id="footer-reveal"]');
    if (footer) {
      const once = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            replay(footer);
            once.unobserve(footer);
          }
        });
      }, { threshold: .25 });
      once.observe(footer);
    }
  }

  function startLoops(root) {
    const loops = [
      ["backup-success", 2000, cycleBackup],
      ["timeline-status", 2000, advanceTimeline],
      ["urgency-selector", 2000, (card) => selectUrgency(nextChoice(card))],
      ["fun-carousel", 2000, nextSlide],
      ["send-receive-swap", 2000, cycleEasyIcon],
      ["transaction-toast", 2000, cycleToast],
      ["protection-badges", 1750, (card) => selectBadge(card, nextBadge(card))],
      ["wallet-assets", 4500, toggleWalletAssets],
      ["wallet-grouping", 2000, (card) => selectGroup(card, nextGroup(card))]
    ];
    loops.forEach(([id, delay, fn]) => {
      const card = root.querySelector(`.fm-card[data-id="${id}"]`);
      if (!card) return;
      window.setInterval(() => {
        if (reduced || document.hidden || root.classList.contains("fm-paused") || card.classList.contains("is-paused") || card.hidden) return;
        fn(card);
      }, delay);
    });
  }

  function cycleEasyIcon(card) {
    const order = ["send", "swap", "receive", "purchase"];
    const current = Number(card.dataset.easyIndex || 0);
    playIcon(card, order[current % order.length]);
    card.dataset.easyIndex = String(current + 1);
  }

  function pauseAll() {
    roots.forEach((root) => { root.classList.add("fm-paused"); const button=root.querySelector('[data-tool="pause"]'); if(button)button.textContent="전체 재개"; });
  }

  function setReduced(value) {
    reduced = Boolean(value);
    roots.forEach((root) => {
      root.classList.toggle("fm-reduced", reduced);
      root.querySelectorAll('[data-tool="reduced"]').forEach((button) => button.setAttribute("aria-pressed", String(reduced)));
    });
  }

  function reveal(id) {
    let found = null;
    const aliases = {
      footer: "footer-reveal",
      cta: "footer-reveal",
      nft: "nft-progress-star",
      "nft-media": "nft-progress-star",
      dragdrop: "wallet-drag-reorder",
      "drag-drop": "wallet-drag-reorder"
    };
    const targetId = aliases[String(id)] || id;
    roots.forEach((root) => {
      root.dataset.filter = "all";
      root.querySelectorAll(".fm-filter").forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.filter === "all")));
      const search = root.querySelector("[data-search]");
      if (search) search.value = "";
      applyVisibility(root);
      const card = root.querySelector(`.fm-card[data-id="${selectorEscape(targetId)}"]`);
      if (!card) return;
      found = card;
      card.classList.add("is-highlighted");
      card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      replay(card);
      window.setTimeout(() => card.classList.remove("is-highlighted"), 1800);
    });
    return found;
  }

  function animateNumber(node, from, to, duration, prefix, suffix) {
    const generation=(node._familyTween||0)+1;
    node._familyTween=generation;
    const start = performance.now();
    node.dataset.value = String(to);
    const tick = (now) => {
      if(node._familyTween!==generation)return;
      const progress = Math.min(1, (now - start) / (reduced ? 1 : duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (to - from) * eased);
      node.textContent = `${prefix || ""}${value.toLocaleString("en-US")}${suffix || ""}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function selectorEscape(value) {
    return String(value).replace(/["\\]/g, "\\$&");
  }

  window.FamilyMotionLibrary = {
    mount,
    pauseAll,
    setReduced,
    reveal,
    data: DATA.slice(),
    count: DATA.length
  };
})();
