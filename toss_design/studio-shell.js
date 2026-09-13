/* Studio Shell — 셸 전용 최소 스크립트 (모바일 내비 토글, 브레드크럼 동기화, 토스트).
   각 뷰어의 기존 스크립트를 대체하지 않으며, DOM 구조만 전제로 동작합니다.
   전제 DOM: .as-studio > .as-sidebar#as-nav + .as-main-shell > .as-topbar > .as-mobile-nav-button[aria-controls="as-nav"] */
(function () {
  "use strict";
  var studio = document.querySelector(".as-studio");
  if (!studio) return;
  var sidebar = studio.querySelector(".as-sidebar");
  var navButton = studio.querySelector(".as-mobile-nav-button");
  var scrim = studio.querySelector(".as-sidebar-scrim");
  var crumb = studio.querySelector(".as-breadcrumb strong");
  var mq = window.matchMedia("(max-width: 640px)");

  var mainShell = studio.querySelector(".as-main-shell");
  var wasOpen = false;
  function setMenu(open) {
    if (!sidebar) return;
    sidebar.classList.toggle("is-open", open);
    if (navButton) navButton.setAttribute("aria-expanded", String(open));
    if (scrim) scrim.hidden = !open;
    if (mq.matches) {
      sidebar.removeAttribute("inert"); sidebar.setAttribute("aria-hidden", String(!open)); if (!open) sidebar.setAttribute("inert", "");
      // 드로어가 열린 동안 배경은 키보드·보조기기에서 제외하고, 포커스는 드로어 안으로 옮긴다. 닫히면 메뉴 버튼으로 복원.
      if (mainShell) { if (open) mainShell.setAttribute("inert", ""); else mainShell.removeAttribute("inert"); }
      if (open && !wasOpen) { var first = sidebar.querySelector('nav [aria-current], nav a, nav button, a, button'); if (first && first.focus) first.focus(); }
      else if (!open && wasOpen && navButton && navButton.focus) navButton.focus();
    } else if (mainShell) { mainShell.removeAttribute("inert"); }
    wasOpen = open;
  }
  function applyViewport() {
    if (!sidebar) return;
    if (mq.matches) { setMenu(false); }
    else { sidebar.classList.remove("is-open"); sidebar.removeAttribute("inert"); sidebar.removeAttribute("aria-hidden"); if (mainShell) mainShell.removeAttribute("inert"); if (scrim) scrim.hidden = true; if (navButton) navButton.setAttribute("aria-expanded", "false"); wasOpen = false; }
  }
  if (navButton) navButton.addEventListener("click", function () { setMenu(!sidebar.classList.contains("is-open")); });
  if (scrim) scrim.addEventListener("click", function () { setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && sidebar && sidebar.classList.contains("is-open")) setMenu(false); });
  // 캡처 단계: 뷰어가 클릭 핸들러에서 nav.innerHTML을 교체해도 타깃이 분리되기 전에 잡는다.
  if (sidebar) sidebar.addEventListener("click", function (e) { var t = e.target && e.target.closest && e.target.closest("nav a, nav button"); if (t && mq.matches) setMenu(false); }, true);
  (mq.addEventListener ? mq.addEventListener("change", applyViewport) : mq.addListener(applyViewport));
  applyViewport();

  // 브레드크럼: 사이드바 nav의 현재 항목 라벨을 따라간다 (aria-current 또는 .is-active).
  function syncCrumb() {
    if (!crumb || !sidebar) return;
    var cur = sidebar.querySelector('nav [aria-current], nav .is-active');
    if (!cur) return;
    var label = cur.cloneNode(true);
    label.querySelectorAll(".as-nav-index, .as-nav-count, .as-live-dot, [aria-hidden='true'], svg").forEach(function (n) { n.remove(); });
    var text = label.textContent.replace(/\s+/g, " ").trim();
    if (text) crumb.textContent = text;
  }
  syncCrumb();
  if (sidebar && window.MutationObserver) {
    new MutationObserver(syncCrumb).observe(sidebar, { subtree: true, attributes: true, attributeFilter: ["aria-current", "class"], childList: true });
  }
  window.addEventListener("hashchange", function () { setTimeout(syncCrumb, 0); });

  // 토스트: window.asToast("메시지")
  var toast = studio.querySelector(".as-toast"), timer;
  window.asToast = function (msg) {
    if (!toast) return;
    toast.textContent = msg; toast.classList.add("visible");
    clearTimeout(timer); timer = setTimeout(function () { toast.classList.remove("visible"); }, 1800);
  };
})();
