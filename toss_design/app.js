const menuButton = document.querySelector(".mobile-menu-button");
const mobileMenu = document.querySelector("#mobile-menu");

function closeMenu() {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.textContent = "메뉴";
  mobileMenu.hidden = true;
}

menuButton?.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
  menuButton.setAttribute("aria-expanded", String(willOpen));
  menuButton.textContent = willOpen ? "닫기" : "메뉴";
  mobileMenu.hidden = !willOpen;
});

mobileMenu?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const wasOpen = menuButton?.getAttribute("aria-expanded") === "true";
    closeMenu();
    if (wasOpen) menuButton?.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 1023) closeMenu();
});

document.querySelectorAll("[role='group'] .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const group = chip.closest("[role='group']");
    group?.querySelectorAll(".chip").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === chip));
    });
  });
});

document.querySelectorAll("[data-tabs]").forEach((tabs) => {
  const tabList = tabs.querySelector("[role='tablist']");
  const tabButtons = [...tabs.querySelectorAll("[role='tab']")];
  const tabPanels = [...tabs.querySelectorAll("[role='tabpanel']")];

  function selectTab(nextTab) {
    tabButtons.forEach((tab) => {
      const isSelected = tab === nextTab;
      tab.setAttribute("aria-selected", String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
    });

    tabPanels.forEach((panel) => {
      panel.hidden = panel.id !== nextTab.getAttribute("aria-controls");
    });
  }

  tabButtons.forEach((tab) => tab.addEventListener("click", () => selectTab(tab)));
  tabList?.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabButtons.indexOf(document.activeElement);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabButtons.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabButtons.length - 1;
    selectTab(tabButtons[nextIndex]);
    tabButtons[nextIndex].focus();
  });
});

document.querySelectorAll("[role='switch']").forEach((switchControl) => {
  switchControl.addEventListener("click", () => {
    const isChecked = switchControl.getAttribute("aria-checked") === "true";
    switchControl.setAttribute("aria-checked", String(!isChecked));
    switchControl.setAttribute("aria-label", `중요 알림 ${isChecked ? "꺼짐" : "켜짐"}`);
  });
});

const progressButton = document.querySelector("[data-progress-button]");
const progressLabel = document.querySelector("[data-transfer-progress-label]");
const statusMessage = document.querySelector("[data-status-message]");
const transferCard = document.querySelector("[data-transfer-card]");

progressButton?.addEventListener("click", () => {
  if (progressButton.disabled) return;
  const iconUse = progressButton.querySelector("use");
  progressButton.disabled = true;
  progressButton.classList.add("is-loading");
  progressButton.setAttribute("aria-busy", "true");
  if (progressLabel) progressLabel.textContent = "보내는 중…";
  iconUse?.setAttribute("href", "./icons.svg?v=20260901-1#icon-loader");
  if (statusMessage) statusMessage.textContent = "안전하게 송금을 처리하고 있다.";

  window.setTimeout(() => {
    progressButton.classList.remove("is-loading");
    progressButton.classList.add("is-success");
    progressButton.removeAttribute("aria-busy");
    transferCard?.classList.add("is-success");
    if (progressLabel) progressLabel.textContent = "송금 완료";
    iconUse?.setAttribute("href", "./icons.svg?v=20260901-1#icon-check");
    if (statusMessage) statusMessage.textContent = "김토스님에게 52,000원을 보냈다.";
  }, 900);

  window.setTimeout(() => {
    progressButton.classList.remove("is-success");
    transferCard?.classList.remove("is-success");
    progressButton.disabled = false;
    if (progressLabel) progressLabel.textContent = "다시 보내기";
    iconUse?.setAttribute("href", "./icons.svg?v=20260901-1#icon-arrow-right");
  }, 3000);
});

const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
const shellLinks = [...document.querySelectorAll("[data-shell-link]")];
const observedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter((section, index, sections) => section && sections.indexOf(section) === index);

const sectionObserver = new IntersectionObserver((entries) => {
  const visibleSections = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
  if (!visibleSections.length) return;
  const activeId = `#${visibleSections[0].target.id}`;
  sectionLinks.forEach((link) => {
    if (link.getAttribute("href") === activeId) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}, { rootMargin: "-18% 0px -62%", threshold: [0, 0.15, 0.4] });

observedSections.forEach((section) => sectionObserver.observe(section));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll("[data-reveal]");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  document.documentElement.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
}

const pageRail = document.querySelector("[data-page-rail]");
const pageRailLabel = document.querySelector("[data-page-rail-label]");
const pageRailLinks = [...document.querySelectorAll("[data-rail-link]")];
const pageRailSections = pageRailLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const shellSections = shellLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function showPageRailLabel(link) {
  if (!pageRailLabel) return;
  pageRailLabel.textContent = link.getAttribute("aria-label") || "";
  pageRailLabel.style.setProperty("--rail-label-top", `${link.offsetTop + (link.offsetHeight / 2)}px`);
  pageRailLabel.classList.add("is-visible");
}

function hidePageRailLabel() {
  pageRailLabel?.classList.remove("is-visible");
}

pageRailLinks.forEach((link) => {
  link.addEventListener("mouseenter", () => showPageRailLabel(link));
  link.addEventListener("focus", () => showPageRailLabel(link));
  link.addEventListener("blur", hidePageRailLabel);
  link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    window.history.pushState(window.history.state, "", link.getAttribute("href"));
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  });
});

pageRail?.addEventListener("mouseleave", hidePageRailLabel);

function updatePageRail() {
  if (!pageRailSections.length && !shellSections.length) return;
  const probeY = window.scrollY + (window.innerHeight * 0.5);
  let activeSection = pageRailSections[0];
  pageRailSections.forEach((section) => {
    if (section.offsetTop <= probeY) activeSection = section;
  });
  const activeHash = `#${activeSection.id}`;
  pageRailLinks.forEach((link) => {
    if (link.getAttribute("href") === activeHash) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  pageRail?.classList.toggle(
    "page-rail--light",
    activeSection.id === "global-motion" || activeSection.classList.contains("section--dark")
  );

  if (shellSections.length) {
    let activeShellSection = shellSections[0];
    [...shellSections].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top).forEach((section) => {
      const absoluteTop = section.getBoundingClientRect().top + window.scrollY;
      if (absoluteTop <= probeY) activeShellSection = section;
    });
    const activeShellHash = `#${activeShellSection.id}`;
    shellLinks.forEach((link) => {
      if (link.getAttribute("href") === activeShellHash) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }
}

const globalSearchForm = document.querySelector("[data-global-search-form]");
const globalSearch = document.querySelector("[data-global-search]");

globalSearchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = globalSearch?.value.trim() || "";
  document.dispatchEvent(new CustomEvent("catalog:search", { detail: { query } }));
  window.history.pushState(window.history.state, "", "#live-catalog");
  document.querySelector("#live-catalog")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
  if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) return;
  event.preventDefault();
  globalSearch?.focus();
});

let pageUpdateFrame = null;
function schedulePageUpdate() {
  if (pageUpdateFrame !== null) return;
  pageUpdateFrame = window.requestAnimationFrame(() => {
    pageUpdateFrame = null;
    updatePageRail();
  });
}

window.addEventListener("scroll", schedulePageUpdate, { passive: true });
window.addEventListener("resize", () => {
  schedulePageUpdate();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") schedulePageUpdate();
});

schedulePageUpdate();

// Counts are derived from the same artifact as the source explorer, never hand-maintained.
fetch("./data/toss-source-library.json")
  .then(response => { if (!response.ok) throw new Error("source data unavailable"); return response.json(); })
  .then(library => {
    document.querySelectorAll("[data-library-count]").forEach(node => {
      const category = node.dataset.libraryCount;
      node.textContent = (category === "all" ? library.entries.length : library.entries.filter(entry => entry.category === category).length).toLocaleString("ko-KR");
    });
    document.querySelectorAll("[data-asset-count]").forEach(node => { node.textContent = library.assets.length.toLocaleString("ko-KR"); });
  }).catch(() => {
    document.querySelectorAll("[data-library-count], [data-asset-count]").forEach(node => { node.textContent = "—"; });
  });
