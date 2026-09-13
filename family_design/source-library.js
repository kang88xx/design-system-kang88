(function () {
  "use strict";

  const PAGE_SIZE = 24;
  const IMAGE = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"]);
  const VIDEO = new Set([".mp4", ".webm", ".mov"]);
  const FONT = new Set([".woff", ".woff2", ".ttf", ".otf"]);
  const TEXT = new Set([".css", ".js", ".json", ".html", ".md", ".txt", ".svg", ".py", ".cjs"]);
  const labels = {
    "original-public": "공개 원본",
    "existing-extracted": "추출 보존",
    "existing-derived": "파생 자료",
    reconstructed: "대체 구현",
    "local-tool": "로컬 도구",
    downloaded: "다운로드됨",
    included: "포함됨",
    "missing-public": "공개 참조 누락",
    "http-400": "HTTP 400",
    "private-or-forbidden": "비공개/차단"
  };
  const categoryLabels = {
    asset: "일반 자산",
    data: "데이터",
    documentation: "문서",
    font: "폰트",
    html: "HTML",
    image: "이미지",
    script: "스크립트",
    "script-bundle": "스크립트 번들",
    stylesheet: "스타일시트",
    svg: "SVG",
    video: "영상"
  };
  const state = { data: null, items: [], q: "", category: "all", provenance: "all", status: "all", kind: "all", page: 1, text: "" };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const setText = (node, value) => { node.textContent = value == null ? "" : String(value); };

  function extension(path) {
    const match = String(path || "").split(/[?#]/)[0].match(/(\.[a-z0-9]+)$/i);
    return match ? match[1].toLowerCase() : "";
  }

  function kind(item) {
    if (!item.path) return "unavailable";
    const value = `${item.status || ""} ${item.provenance || ""}`.toLowerCase();
    if (value.includes("private") || value.includes("forbidden") || value.includes("missing") || value.includes("http-400")) return "unavailable";
    if (value.includes("reconstructed") || value.includes("reconstruction") || value.includes("substitute") || value.includes("local-tool")) return "reconstruction";
    if (value.includes("derived")) return "derived";
    return "original";
  }

  function bytes(value) {
    const size = Number(value);
    if (!Number.isFinite(size) || size <= 0) return "0 B";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  function cleanItem(item, index) {
    const path = item.path || "";
    return {
      id: item.id || `source-${index + 1}`,
      name: item.name || path.split("/").pop() || `Source ${index + 1}`,
      category: item.category || "uncategorized",
      provenance: item.provenance || "unknown",
      status: item.status || "unknown",
      path,
      sourceUrl: item.sourceUrl || "",
      bytes: item.bytes || 0,
      sha256: item.sha256 || "",
      description: item.description || ""
    };
  }

  async function loadData() {
    if (window.FamilySourceLibrary && Array.isArray(window.FamilySourceLibrary.items)) return window.FamilySourceLibrary;
    if (location.protocol !== "file:") {
      try {
        const response = await fetch("source-library.json", { cache: "no-store" });
        if (response.ok) return response.json();
      } catch {
        return null;
      }
    }
    return null;
  }

  function values(key) {
    return Array.from(new Set(state.items.map((item) => item[key]).filter(Boolean))).sort();
  }

  function filtered() {
    const terms = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return state.items.filter((item) => {
      if (state.category !== "all" && item.category !== state.category) return false;
      if (state.provenance !== "all" && item.provenance !== state.provenance) return false;
      if (state.status !== "all" && item.status !== state.status) return false;
      if (state.kind !== "all" && kind(item) !== state.kind) return false;
      if (!terms.length) return true;
      const haystack = [item.id, item.name, item.category, item.provenance, item.status, item.path, item.sourceUrl, item.sha256, item.description].join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }

  function renderRoot(root) {
    root.innerHTML = [
      '<div class="source-library">',
      '<div class="source-hero"><div class="source-summary" data-summary></div><aside class="source-status-board" data-status-board></aside></div>',
      '<div class="source-controls"><div class="source-control-row">',
      '<label class="source-search"><span>검색</span><input data-source-search type="search" placeholder="이름, 경로, 해시, 카테고리"></label>',
      '<select class="source-select" data-source-category aria-label="소스 카테고리 필터"></select>',
      '<select class="source-select" data-source-provenance aria-label="소스 출처 필터"></select>',
      '<select class="source-select" data-source-status aria-label="소스 수집 상태 필터"></select>',
      '<button class="source-reset" data-reset type="button">초기화</button>',
      '</div><div class="source-control-row" data-kind-row></div><div class="source-count" data-count></div></div>',
      '<div class="source-grid" data-grid></div>',
      '<div class="source-empty" data-empty hidden>검색 결과가 없습니다.<button type="button" data-reset>전체 소스 보기</button></div>',
      '<div class="source-pagination" data-pagination></div>',
      '</div>'
    ].join("");
    wire(root);
    renderAll(root);
  }

  function renderSummary(root) {
    const summary = $("[data-summary]", root);
    const gapCount = Array.isArray(state.data.gaps) ? state.data.gaps.length : 0;
    const cards = [
      ["전체 소스", state.items.length],
      ["원본/추출", state.items.filter((item) => kind(item) === "original").length],
      ["파생/대체", state.items.filter((item) => kind(item) === "derived" || kind(item) === "reconstruction").length],
      ["누락/미확인", state.items.filter((item) => kind(item) === "unavailable").length + gapCount]
    ];
    summary.innerHTML = "";
    for (const [label, value] of cards) {
      const card = document.createElement("div");
      card.className = "source-stat";
      const number = document.createElement("strong");
      setText(number, value);
      const caption = document.createElement("span");
      setText(caption, label);
      card.append(number, caption);
      summary.append(card);
    }
  }

  function renderStatus(root) {
    const board = $("[data-status-board]", root);
    board.innerHTML = "";
    const title = document.createElement("h3");
    setText(title, "수집 범위와 미확인 구조");
    const copy = document.createElement("p");
    const unavailable = state.items.filter((item) => kind(item) === "unavailable").length;
    const gaps = Array.isArray(state.data.gaps) ? state.data.gaps : [];
    setText(copy, `공개 HTML/CSS/JS, 연결 리소스, 기존 추출 영상·SVG·프레임·토큰을 포함했습니다. 직접 내려받지 못한 리소스는 ${unavailable}개, 내부 구조가 비공개라 대체 설명이 필요한 항목은 ${gaps.length}개입니다.`);
    const details = document.createElement("details");
    details.className = "source-gap-details";
    const summary = document.createElement("summary");
    setText(summary, `미확인 구조 전체 보기 ${gaps.length}`);
    const list = document.createElement("ul");
    list.className = "source-gap-list";
    const visibleGaps = gaps.length ? gaps : [{ name: "No recorded gaps", fallback: "수집기가 별도 미해결 항목을 보고하지 않았습니다." }];
    for (const gap of visibleGaps) {
      const li = document.createElement("li");
      const main = document.createElement("span");
      setText(main, [gap.name || gap.title || gap.id || "gap", gap.status || "", gap.fallback || gap.description || gap.reason || ""].filter(Boolean).join(": "));
      li.append(main);
      const alternatives = Array.isArray(gap.alternativePaths) ? gap.alternativePaths : [];
      if (alternatives.length) {
        const links = document.createElement("span");
        links.className = "source-gap-links";
        alternatives.forEach((path) => links.append(actionLink(path, path.split("/").pop() || path, false)));
        li.append(links);
      }
      list.append(li);
    }
    details.append(summary, list);
    const recon = document.createElement("a");
    recon.className = "source-reconstruction-link";
    recon.href = "app-reconstructions.html";
    const strong = document.createElement("strong");
    setText(strong, "9 private app flow substitutes");
    const span = document.createElement("span");
    setText(span, "open lab");
    recon.append(strong, span);
    board.append(title, copy, recon, details);
  }

  function option(select, value, label) {
    const node = document.createElement("option");
    node.value = value;
    setText(node, label);
    select.append(node);
  }

  function renderControls(root) {
    const category = $("[data-source-category]", root);
    const provenance = $("[data-source-provenance]", root);
    const status = $("[data-source-status]", root);
    category.innerHTML = "";
    provenance.innerHTML = "";
    status.innerHTML = "";
    option(category, "all", "모든 카테고리");
    option(provenance, "all", "모든 출처");
    option(status, "all", "모든 수집 상태");
    values("category").forEach((value) => option(category, value, categoryLabels[value] || value));
    values("provenance").forEach((value) => option(provenance, value, labels[value] || value));
    values("status").forEach((value) => option(status, value, labels[value] || value));
    category.value = state.category;
    provenance.value = state.provenance;
    status.value = state.status;

    const row = $("[data-kind-row]", root);
    row.innerHTML = "";
    for (const [filter, label] of [["all", "전체"], ["original", "원본"], ["derived", "파생"], ["reconstruction", "대체"], ["unavailable", "누락/비공개"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "source-chip";
      button.setAttribute("aria-pressed", String(state.kind === filter));
      setText(button, `${label} ${filter === "all" ? state.items.length : state.items.filter((item) => kind(item) === filter).length}`);
      button.addEventListener("click", () => {
        state.kind = filter;
        state.page = 1;
        renderAll(root);
      });
      row.append(button);
    }
  }

  function renderGrid(root) {
    const items = filtered();
    const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    state.page = Math.min(Math.max(1, state.page), pages);
    const pageItems = items.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    const grid = $("[data-grid]", root);
    grid.innerHTML = "";
    $("[data-empty]", root).hidden = pageItems.length > 0;
    setText($("[data-count]", root), `${items.length} / ${state.items.length} sources · page ${state.page} of ${pages}`);
    pageItems.forEach((item) => grid.append(card(item)));
    renderPagination(root, pages);
  }

  function preview(item, large) {
    const path = item.path || "";
    const type = extension(path);
    const wrap = document.createElement("div");
    wrap.className = large ? "source-dialog-preview" : "source-preview";
    if (path && IMAGE.has(type)) {
      const image = document.createElement("img");
      image.loading = large ? "eager" : "lazy";
      image.decoding = "async";
      image.src = path;
      image.alt = item.name;
      wrap.append(image);
    } else if (path && VIDEO.has(type)) {
      const video = document.createElement("video");
      video.src = path;
      video.muted = true;
      video.playsInline = true;
      video.preload = large ? "metadata" : "none";
      video.controls = Boolean(large);
      wrap.append(video);
    } else if (path && FONT.has(type)) {
      const family = `FamilySourceFont${Math.abs(hash(path))}`;
      if (!document.getElementById(family)) {
        const style = document.createElement("style");
        style.id = family;
        style.textContent = `@font-face{font-family:${family};src:url("${String(path).replace(/["\\\n\r\f]/g, "\\$&")}")}`;
        document.head.append(style);
      }
      const sample = document.createElement("div");
      sample.className = "source-font-preview";
      sample.style.fontFamily = `${family}, Family, Arial, sans-serif`;
      setText(sample, "Family Aa");
      wrap.append(sample);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "source-file-preview";
      const mark = document.createElement("strong");
      setText(mark, type ? type.slice(1).toUpperCase() : "SRC");
      const name = document.createElement("span");
      setText(name, path || item.sourceUrl || item.status);
      fallback.append(mark, name);
      wrap.append(fallback);
    }
    return wrap;
  }

  function hash(value) {
    let out = 0;
    for (let index = 0; index < value.length; index += 1) out = ((out << 5) - out + value.charCodeAt(index)) | 0;
    return out;
  }

  function pill(value, itemKind) {
    const span = document.createElement("span");
    span.className = `source-pill is-${itemKind}`;
    setText(span, labels[value] || value);
    return span;
  }

  function card(item) {
    const node = document.createElement("article");
    node.className = "source-card";
    node.tabIndex = 0;
    node.dataset.sourceId = item.id;
    node.append(preview(item, false));
    const body = document.createElement("div");
    body.className = "source-card-body";
    const title = document.createElement("h3");
    setText(title, item.name);
    const desc = document.createElement("p");
    setText(desc, item.description || item.path || item.sourceUrl);
    const meta = document.createElement("div");
    meta.className = "source-meta";
    const itemKind = kind(item);
    [item.category, item.provenance, item.status, bytes(item.bytes)].forEach((value) => meta.append(pill(value, itemKind)));
    body.append(title, desc, meta);
    const actions = document.createElement("div");
    actions.className = "source-card-actions";
    const inspect = document.createElement("button");
    inspect.type = "button";
    setText(inspect, "상세 보기");
    inspect.addEventListener("click", () => inspectItem(item));
    actions.append(inspect);
    if (item.path) {
      const download = document.createElement("a");
      download.href = item.path;
      download.download = "";
      setText(download, "다운로드");
      actions.append(download);
    }
    node.append(body, actions);
    node.addEventListener("keydown", (event) => {
      if (event.target !== node) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inspectItem(item);
      }
    });
    return node;
  }

  function renderPagination(root, pages) {
    const nav = $("[data-pagination]", root);
    nav.innerHTML = "";
    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "source-page";
    prev.disabled = state.page <= 1;
    setText(prev, "이전");
    prev.addEventListener("click", () => { state.page -= 1; renderGrid(root); });
    const label = document.createElement("span");
    setText(label, `${state.page} / ${pages}`);
    const next = document.createElement("button");
    next.type = "button";
    next.className = "source-page";
    next.disabled = state.page >= pages;
    setText(next, "다음");
    next.addEventListener("click", () => { state.page += 1; renderGrid(root); });
    nav.append(prev, label, next);
  }

  function renderAll(root) {
    renderSummary(root);
    renderStatus(root);
    renderControls(root);
    const input = $("[data-source-search]", root);
    if (input) input.value = state.q;
    renderGrid(root);
  }

  function wire(root) {
    root.addEventListener("input", (event) => {
      if (event.target.matches("[data-source-search]")) {
        state.q = event.target.value;
        state.page = 1;
        renderGrid(root);
      }
    });
    root.addEventListener("change", (event) => {
      if (event.target.matches("[data-source-category], [data-source-provenance], [data-source-status]")) {
        const key = event.target.dataset.sourceCategory !== undefined ? "category" : event.target.dataset.sourceProvenance !== undefined ? "provenance" : "status";
        state[key] = event.target.value;
        state.page = 1;
        renderGrid(root);
      }
    });
    root.addEventListener("click", (event) => {
      if (event.target.matches("[data-reset]")) {
        state.q = "";
        state.category = "all";
        state.provenance = "all";
        state.status = "all";
        state.kind = "all";
        state.page = 1;
        renderAll(root);
      }
    });
  }

  function line(label, value) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    const strong = document.createElement("b");
    setText(span, label);
    setText(strong, value || "-");
    li.append(span, strong);
    return li;
  }

  async function inspectItem(item) {
    const dialog = $("#source-inspector");
    if (!dialog) return;
    let fullText = "";
    const token = `${item.id}:${Date.now()}`;
    dialog.dataset.loadToken = token;
    dialog.innerHTML = "";
    const shell = document.createElement("div");
    shell.className = "source-dialog-shell";
    const main = document.createElement("div");
    main.className = "source-dialog-main";
    const side = document.createElement("aside");
    side.className = "source-dialog-side";
    const top = document.createElement("div");
    top.className = "source-dialog-top";
    const titleBox = document.createElement("div");
    const kicker = document.createElement("div");
    kicker.className = "section-label";
    setText(kicker, `${labels[item.provenance] || item.provenance} / ${labels[item.status] || item.status}`);
    const title = document.createElement("h3");
    setText(title, item.name);
    titleBox.append(kicker, title);
    const close = document.createElement("button");
    close.className = "source-dialog-close";
    close.type = "button";
    close.setAttribute("aria-label", "닫기");
    setText(close, "×");
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", pauseDialogMedia, { once: true });
    top.append(titleBox, close);
    main.append(top, preview(item, true));
    const isTextSource = item.path && TEXT.has(extension(item.path));
    let copyBody = null;
    if (isTextSource) {
      const code = document.createElement("pre");
      code.className = "source-code";
      setText(code, "파일 내용을 불러오는 중입니다. 큰 파일은 미리보기만 줄여서 표시합니다.");
      main.append(code);
      loadText(item.path).then((body) => {
        if (dialog.dataset.loadToken !== token) return;
        fullText = body;
        if (copyBody) copyBody.disabled = !body;
        const preview = body.length > 30000 ? `${body.slice(0, 30000)}\n\n/* 미리보기는 30KB에서 잘렸습니다. 본문 복사는 전체 로드된 텍스트를 복사합니다. */` : body;
        setText(code, preview || "file:// 또는 브라우저 정책 때문에 본문 미리보기를 읽지 못했습니다. 새 탭/다운로드 링크로 확인하세요.");
      });
    }
    const desc = document.createElement("p");
    setText(desc, item.description || "설명 없음");
    const detail = document.createElement("ul");
    detail.className = "source-detail-list";
    [
      ["id", item.id],
      ["category", item.category],
      ["provenance", item.provenance],
      ["status", item.status],
      ["path", item.path || ""],
      ["source", item.sourceUrl || ""],
      ["bytes", bytes(item.bytes)],
      ["sha256", item.sha256 || ""]
    ].forEach(([key, value]) => detail.append(line(key, value)));
    const actions = document.createElement("div");
    actions.className = "source-dialog-actions";
    const copyMeta = document.createElement("button");
    copyMeta.type = "button";
    setText(copyMeta, "메타 복사");
    copyMeta.addEventListener("click", () => copy(JSON.stringify(item, null, 2)));
    actions.append(copyMeta);
    if (isTextSource) {
      copyBody = document.createElement("button");
      copyBody.type = "button";
      copyBody.disabled = true;
      setText(copyBody, "본문 복사");
      copyBody.addEventListener("click", () => copy(fullText));
      actions.append(copyBody);
    }
    if (item.path) actions.append(actionLink(item.path, "새 탭", false), actionLink(item.path, "다운로드", true));
    if (item.sourceUrl) actions.append(actionLink(item.sourceUrl, "원본 주소", false));
    side.append(desc, detail, actions);
    shell.append(main, side);
    dialog.append(shell);
    dialog.showModal();
    close.focus();
  }

  function actionLink(href, label, download) {
    const link = document.createElement("a");
    link.href = href;
    link.target = download ? "" : "_blank";
    link.rel = "noreferrer";
    if (download) link.download = "";
    setText(link, label);
    return link;
  }

  async function loadText(path) {
    if (location.protocol === "file:") return "";
    try {
      const response = await fetch(path);
      if (!response.ok) return "";
      return response.text();
    } catch {
      return "";
    }
  }

  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      toast("복사했습니다.");
    } catch {
      toast("복사를 지원하지 않는 환경입니다.");
    }
  }

  function toast(message) {
    if (typeof window.notify === "function") {
      window.notify(message);
      return;
    }
    const node = $("#toast");
    if (!node) return;
    setText(node, message);
    node.classList.add("visible");
    window.setTimeout(() => node.classList.remove("visible"), 1600);
  }

  function pauseDialogMedia() {
    $$("#source-inspector video").forEach((video) => video.pause());
  }

  async function init() {
    const root = $("#source-library-root");
    if (!root) return;
    const data = await loadData();
    if (!data) {
      root.innerHTML = '<div class="source-load-state">source-library-data.js 또는 source-library.json을 찾지 못했습니다. 수집 결과가 생성되면 file://에서도 전체 브라우저가 표시됩니다.</div>';
      return;
    }
    state.data = data;
    state.items = (data.items || []).map(cleanItem);
    renderRoot(root);
  }

  window.FamilySourceBrowser = { init, filtered, inspectItem };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
