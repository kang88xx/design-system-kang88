(() => {
  "use strict";

  const MAX_TEXT_PREVIEW_BYTES = 220000;
  const TEXT_KINDS = new Set(["text", "document"]);
  const BINARY_KINDS = new Set(["data", "other"]);
  const KIND_LABELS = {
    image: "이미지",
    video: "영상",
    audio: "오디오",
    font: "폰트",
    text: "텍스트",
    data: "데이터",
    document: "문서",
    other: "기타"
  };
  const STATUS_LABELS = {
    extracted: "추출",
    derived: "추출·분리",
    reconstructed: "재구성",
    analysis: "분석 문서",
    substitute: "대체",
    private: "비공개",
    unknown: "미확인",
    error: "오류"
  };

  const $ = selector => document.querySelector(selector);
  const sourceList = $("#source-list");
  const emptyList = $("#empty-list");
  const dataState = $("#data-state");
  const searchInput = $("#source-search");
  const kindFilter = $("#kind-filter");
  const statusFilter = $("#status-filter");
  const resultCount = $("#result-count");
  const detailTitle = $("#detail-title");
  const detailKicker = $("#detail-kicker");
  const detailActions = $("#detail-actions");
  const metaGrid = $("#meta-grid");
  const previewStage = $("#preview-stage");
  const previewNote = $("#preview-note");
  const codeView = $("#code-view code");
  const codeStatus = $("#code-status");
  const copyCode = $("#copy-code");
  const reloadCode = $("#reload-code");
  const detailPanel = $(".detail-panel");
  const toastNode = $("#toast");

  let items = [];
  let filteredItems = [];
  let selectedId = "";
  let selectedItem = null;
  let activeCodeText = "";
  let toastTimer = 0;
  let readRequest = 0;
  let readController = null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function toast(message) {
    window.clearTimeout(toastTimer);
    toastNode.textContent = message;
    toastNode.classList.add("visible");
    toastTimer = window.setTimeout(() => toastNode.classList.remove("visible"), 2400);
  }

  function normalizeStatus(status) {
    const value = String(status || "unknown").toLowerCase();
    if (["extracted", "derived", "reconstructed", "analysis", "substitute", "private", "unknown", "error"].includes(value)) return value;
    if (["captured-derived", "captured_derived", "derived-captured"].includes(value)) return "derived";
    if (["captured", "collected", "public", "200", "ok"].includes(value)) return "extracted";
    if (["html_fallback", "failed", "missing", "invalid"].includes(value)) return "error";
    if (["inferred", "replica", "replacement"].includes(value)) return "substitute";
    return "unknown";
  }

  function normalizeKind(kind, path) {
    const value = String(kind || "").toLowerCase();
    if (Object.hasOwn(KIND_LABELS, value)) return value;
    if (["page", "html", "css", "js", "javascript", "script", "python", "shader", "glsl", "obj"].includes(value)) return "text";
    if (["json", "xml", "analysis", "markdown", "md", "doc", "research"].includes(value)) return value === "markdown" || value === "md" || value === "analysis" || value === "doc" || value === "research" ? "document" : "text";
    if (["binary", "model", "buf", "bin"].includes(value)) return "data";
    const cleanPath = String(path || "").toLowerCase();
    if (/\.exr$/i.test(cleanPath)) return "data";
    if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(cleanPath)) return "image";
    if (/\.(mp4|webm|mov)$/i.test(cleanPath)) return "video";
    if (/\.(ogg|mp3|wav|m4a)$/i.test(cleanPath)) return "audio";
    if (/\.(woff2?|ttf|otf)$/i.test(cleanPath)) return "font";
    if (/\.(html?|css|js|json|map|md|txt|xml|csv|py|cjs|mjs|glsl|frag|vert|obj)$/i.test(cleanPath)) return cleanPath.endsWith(".md") ? "document" : "text";
    if (/\.(buf|bin|wasm)$/i.test(cleanPath)) return "data";
    return "other";
  }

  function safePath(path) {
    const value = String(path || "").replace(/\\/g, "/").trim();
    if (!value || value.startsWith("/") || /^[a-z]+:/i.test(value)) return "";
    const parts = value.split("/");
    if (parts.some(part => part === ".." || part === "")) return "";
    return parts.map(segment => encodeURIComponent(segment).replace(/%2F/gi, "/")).join("/");
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value >= 1048576) return `${(value / 1048576).toFixed(1)} MiB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)} KiB`;
    return `${value} B`;
  }

  function normalizeItem(raw, index) {
    const path = String(raw.path || "");
    const kind = normalizeKind(raw.kind, path);
    const status = normalizeStatus(raw.status);
    const sourceType = String(raw.sourceType || raw.source_type || raw.evidence || "").toLowerCase();
    return {
      id: String(raw.id || path || `source-${index}`),
      title: String(raw.title || path.split("/").pop() || `Source ${index + 1}`),
      path,
      safePath: safePath(path),
      url: String(raw.url || ""),
      kind,
      status,
      bytes: Number(raw.bytes) || 0,
      description: String(raw.description || ""),
      sourceType,
      replacementFor: String(raw.replacementFor || raw.replacement_for || ""),
      source: String(raw.source || raw.provenance || "")
    };
  }

  function makeAction(href, text, options = {}) {
    const link = el("a", "", text);
    link.href = href;
    if (options.download) link.download = "";
    if (/^https?:\/\//i.test(href)) {
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    return link;
  }

  function setBadge(status) {
    previewNote.className = `badge ${status}`;
    previewNote.textContent = STATUS_LABELS[status] || "미확인";
  }

  function updateSummary(summary = {}) {
    const counts = {
      total: items.length,
      extracted: items.filter(item => item.status === "extracted").length,
      derived: items.filter(item => item.status === "derived").length,
      reconstructed: items.filter(item => item.status === "reconstructed").length,
      analysis: items.filter(item => item.status === "analysis").length,
      substitute: items.filter(item => item.status === "substitute").length,
      ...summary,
      total: Number(summary.total ?? summary.items ?? items.length),
      extracted: Number(summary.extracted ?? summary.official_public_items ?? summary.captured_items ?? items.filter(item => item.status === "extracted").length),
      derived: Number(summary.derived ?? summary.captured_derived_items ?? items.filter(item => item.status === "derived").length),
      reconstructed: Number(summary.reconstructed ?? summary.reconstructed_items ?? items.filter(item => item.status === "reconstructed").length),
      analysis: Number(summary.analysis ?? summary.analysis_items ?? summary.by_status?.analysis ?? items.filter(item => item.status === "analysis").length),
      substitute: Number(summary.substitute ?? items.filter(item => item.status === "substitute").length),
      fallback: Number(summary.html_fallbacks ?? items.filter(item => item.status === "error").length)
    };
    for (const key of ["total", "extracted", "derived", "reconstructed", "analysis", "substitute", "fallback"]) {
      const node = document.querySelector(`[data-summary="${key}"]`);
      if (node) node.textContent = String(counts[key] ?? 0);
    }
    const official = Number(summary.official_public_items ?? 0) || Number(summary.manifest_assets ?? 0) + Number(summary.manifest_pages ?? 0);
    const convenience = Number(summary.convenience_items ?? 0);
    const derived = Number(summary.captured_derived_items ?? counts.derived ?? 0);
    const failures = Number(summary.validation_failures ?? 0);
    const fallbacks = Number(summary.html_fallbacks ?? 0);
    $("#summary-note").textContent = official
      ? `공식 공개 원본 ${official}개${convenience ? `, 편의 사본 ${convenience}개` : ""}, 원본에서 분리한 읽기용 파생 ${derived}개, 전체 표시 ${counts.total}개. 재구성 ${counts.reconstructed}개, 분석 문서 ${counts.analysis}개, 서버 HTML 반환 ${fallbacks}개, 검증 실패 ${failures}개.`
      : `현재 인덱스 ${counts.total}개. source-index.js의 summary 필드가 확장되면 공식 수집 수와 파생 항목 수를 함께 표시합니다.`;
  }

  function renderList() {
    const focusedId = sourceList.contains(document.activeElement) ? document.activeElement.dataset.id : '';
    const query = searchInput.value.trim().toLowerCase();
    filteredItems = items.filter(item => {
      const kindMatches = kindFilter.value === "all" || item.kind === kindFilter.value;
      const statusMatches = statusFilter.value === "all" || item.status === statusFilter.value;
      const haystack = `${item.title} ${item.path} ${item.url} ${item.description} ${item.kind} ${item.status}`.toLowerCase();
      return kindMatches && statusMatches && (!query || haystack.includes(query));
    });

    sourceList.replaceChildren();
    const fragment = document.createDocumentFragment();
    const hasSelectedResult = filteredItems.some(item => item.id === selectedId);
    filteredItems.forEach(item => {
      const button = el("button", "source-row");
      button.type = "button";
      button.id = `row-${CSS.escape(item.id)}`;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(item.id === selectedId));
      button.tabIndex = item.id === selectedId || (!hasSelectedResult && item === filteredItems[0]) ? 0 : -1;
      button.dataset.id = item.id;

      const text = el("span");
      text.append(el("span", "source-row-title", item.title));
      text.append(el("span", "source-row-path", item.path || "경로 없음"));
      button.append(text, el("span", "source-row-meta", `${KIND_LABELS[item.kind]} / ${STATUS_LABELS[item.status]}`));
      button.addEventListener("click", () => selectItem(item.id, true));
      fragment.append(button);
    });
    sourceList.append(fragment);
    if (focusedId) sourceList.querySelector(`[data-id="${CSS.escape(focusedId)}"]`)?.focus({ preventScroll: true });
    emptyList.hidden = filteredItems.length > 0 || items.length === 0;
    resultCount.textContent = `${filteredItems.length} / ${items.length}개`;
  }

  function renderActions(item) {
    detailActions.replaceChildren();
    if (item.safePath) {
      detailActions.append(makeAction(item.safePath, "다운로드", { download: true }));
      if (!["text", "document"].includes(item.kind)) detailActions.append(makeAction(item.safePath, "파일 열기"));
    }
    if (/\.(buf|bin)$/i.test(item.path)) {
      detailActions.append(makeAction(`reconstruction.html?path=${encodeURIComponent(item.path)}#models`, "추출 모델 보기"));
    }
    if (item.url) detailActions.append(makeAction(item.url, "공식 원본 ↗"));
    if (item.source.startsWith('sources/') && safePath(item.source)) {
      detailActions.append(makeAction(`source-explorer.html?path=${encodeURIComponent(item.source)}`, "추출 근거 코드 ↗"));
    }
    const copyPath = el("button", "", "경로 복사");
    copyPath.type = "button";
    copyPath.addEventListener("click", () => copyText(item.path, "경로를 복사했습니다."));
    detailActions.append(copyPath);
  }

  function renderMeta(item) {
    const separation = item.status === "extracted"
      ? "원본 소스"
      : item.status === "derived"
        ? "원본 파생"
      : item.status === "reconstructed"
        ? "독립 재구성"
      : item.status === "analysis"
        ? "분석 문서"
        : item.status === "substitute"
          ? "대체 구현"
          : item.status === "private"
            ? "비공개 대체"
            : "확인 필요";
    const rows = [
      ["종류", KIND_LABELS[item.kind]],
      ["상태", STATUS_LABELS[item.status]],
      ["구분", separation],
      ["크기", formatBytes(item.bytes)],
      ["경로", item.path || "없음"],
      ["근거", item.source || item.replacementFor || item.url || "없음"],
      ["설명", item.description || "없음"]
    ];
    metaGrid.replaceChildren(...rows.map(([label, value]) => {
      const box = el("div");
      const term = el("dt", "", label);
      const desc = el("dd", "", value);
      desc.title = value;
      box.append(term, desc);
      return box;
    }));
  }

  function renderPreview(item) {
    previewStage.replaceChildren();
    setBadge(item.status);
    if (!item.safePath) {
      renderFallbackPreview("경로를 안전하게 열 수 없습니다.", "상대 경로가 없거나 상위 폴더 이동이 포함되어 미리보기를 차단했습니다.");
      return;
    }
    if (item.kind === "image") {
      const image = el("img");
      image.src = item.safePath;
      image.alt = `${item.title} 미리보기`;
      image.loading = "lazy";
      image.addEventListener("error", () => renderFallbackPreview("이미지 미리보기를 표시하지 못했습니다.", "파일이 있어도 브라우저가 이 형식을 지원하지 않거나 로컬 접근이 차단될 수 있습니다. 다운로드로 원본을 확인하세요."));
      previewStage.append(image);
      return;
    }
    if (item.kind === "video") {
      const video = el("video");
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = item.safePath;
      video.addEventListener("error", () => renderFallbackPreview("영상 미리보기를 표시하지 못했습니다.", "파일이 있어도 코덱 지원이나 로컬 접근 제한 때문에 재생되지 않을 수 있습니다. 다운로드로 원본을 확인하세요."));
      previewStage.append(video);
      return;
    }
    if (item.kind === "audio") {
      const audio = el("audio");
      audio.controls = true;
      audio.preload = "metadata";
      audio.src = item.safePath;
      audio.addEventListener("error", () => renderFallbackPreview("오디오 미리보기를 표시하지 못했습니다.", "파일이 있어도 코덱 지원이나 로컬 접근 제한 때문에 재생되지 않을 수 있습니다. 다운로드로 원본을 확인하세요."));
      previewStage.append(audio);
      return;
    }
    if (item.kind === "font") {
      renderFontPreview(item);
      return;
    }
    if (TEXT_KINDS.has(item.kind)) {
      const card = el("div", "document-preview");
      card.append(el("strong", "", item.kind === "document" ? "Readable document" : "Readable source"));
      card.append(el("p", "note", `${item.status === "extracted" ? "원본 소스" : "독립 재구성 또는 대체 항목"}입니다. 아래 코드 영역에서 안전하게 원문을 읽습니다.`));
      if (item.source || item.description) card.append(el("p", "note", `${item.source ? `근거: ${item.source}. ` : ""}${item.description}`));
      previewStage.append(card);
      return;
    }
    renderBinaryPreview(item);
  }

  function renderFallbackPreview(title, message) {
    previewStage.replaceChildren();
    const card = el("div", "document-preview");
    card.append(el("strong", "", title));
    card.append(el("p", "note", message));
    previewStage.append(card);
  }

  function renderFontPreview(item) {
    const family = `sourceFont_${item.id.replace(/[^a-z0-9_]/gi, "_")}`;
    const style = el("style");
    style.textContent = `@font-face{font-family:"${family}";src:url("${item.safePath}")}`;
    const card = el("div", "font-preview");
    const specimen = el("strong", "", "Lusion\nAa 123");
    specimen.style.fontFamily = `"${family}", var(--lusion-font-sans, sans-serif)`;
    card.append(style, specimen, el("p", "note", "폰트 파일 자체는 공개 전송된 자료입니다. 신규 사용 권한은 별도 확인 대상입니다."));
    previewStage.append(card);
  }

  function renderBinaryPreview(item) {
    const card = el("div", "binary-preview");
    const isPrivate = item.status === "private" || item.status === "substitute" || item.status === "unknown";
    card.append(el("strong", "", isPrivate ? "대체 미리보기" : "Binary source"));
    card.append(el("span", "", item.description || "구조를 직접 렌더링할 수 없는 바이너리입니다. 원본 파일 다운로드와 공식 URL을 통해 확인하세요."));
    card.append(el("span", "", ".buf/.bin 등은 배포 데이터로 표시하며, 편집 가능한 원본 3D 씬으로 주장하지 않습니다."));
    previewStage.append(card);
  }

  function canReadAsText(item) {
    if (!item.safePath) return false;
    if (TEXT_KINDS.has(item.kind)) return true;
    return /\.(svg|json|map|css|js|html?|md|txt|xml|csv|py|cjs|mjs|glsl|frag|vert|obj)$/i.test(item.path);
  }

  async function readCode(item) {
    const requestId = ++readRequest;
    if (readController) readController.abort();
    readController = new AbortController();
    activeCodeText = "";
    copyCode.disabled = true;
    reloadCode.disabled = !canReadAsText(item);
    if (!canReadAsText(item)) {
      codeView.textContent = "이 파일은 텍스트 미리보기 대상이 아닙니다. 다운로드 또는 미디어 미리보기를 사용하세요.";
      codeStatus.textContent = "큰 바이너리와 미디어는 원문을 코드 영역에 넣지 않습니다.";
      return;
    }
    codeView.textContent = "원문을 읽는 중...";
    codeStatus.textContent = "원문 일부를 먼저 읽고 있습니다. 파일 접근이 차단되면 로컬 서버 안내를 표시합니다.";
    try {
      const response = await fetch(item.safePath, { cache: "no-store", signal: readController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const { text, truncated } = await readPreviewText(response);
      if (requestId !== readRequest) return;
      activeCodeText = text;
      codeView.textContent = text || "(빈 파일)";
      copyCode.disabled = !text;
      codeStatus.textContent = truncated
        ? `${formatBytes(item.bytes)} 파일의 앞부분 ${formatBytes(new Blob([text]).size)}만 표시했습니다. 전체 원문은 다운로드로 확인하세요.${item.source ? ` 근거: ${item.source}.` : ""}`
        : `${formatBytes(new Blob([text]).size)} 원문을 안전한 읽기 화면에 표시했습니다.${item.source ? ` 근거: ${item.source}.` : ""}`;
    } catch (error) {
      if (error.name === "AbortError") return;
      if (requestId !== readRequest) return;
      const serverHint = location.protocol === "file:"
        ? "file:// 제한일 수 있습니다. http://127.0.0.1:4187/source-explorer.html 로 열면 텍스트 미리보기가 안정적입니다."
        : "경로 또는 수집 파일을 확인하세요.";
      codeView.textContent = "원문을 자동으로 읽지 못했습니다.";
      codeStatus.textContent = `${error.message}. ${serverHint} 다운로드 버튼은 계속 사용할 수 있습니다.`;
    }
  }

  async function readPreviewText(response) {
    const decoder = new TextDecoder("utf-8", { fatal: false });
    if (!response.body?.getReader) {
      const text = await response.text();
      return {
        text: text.slice(0, MAX_TEXT_PREVIEW_BYTES),
        truncated: text.length > MAX_TEXT_PREVIEW_BYTES
      };
    }
    const reader = response.body.getReader();
    let text = "";
    let bytes = 0;
    let truncated = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
      if (bytes >= MAX_TEXT_PREVIEW_BYTES) {
        truncated = true;
        await reader.cancel();
        break;
      }
    }
    text += decoder.decode();
    return { text, truncated };
  }

  function selectItem(id, userInitiated = false) {
    const item = items.find(candidate => candidate.id === id) || items[0];
    if (!item) return;
    selectedItem = item;
    selectedId = item.id;
    detailKicker.textContent = `02 / ${KIND_LABELS[item.kind]} / ${STATUS_LABELS[item.status]}`;
    detailTitle.textContent = item.title;
    renderActions(item);
    renderMeta(item);
    renderPreview(item);
    readCode(item);
    renderList();
    history.replaceState(null, "", `#${encodeURIComponent(item.id)}`);
    if (userInitiated && window.matchMedia("(max-width: 812px)").matches) {
      detailTitle.tabIndex = -1;
      detailTitle.focus({ preventScroll: true });
      detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function copyText(text, message) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      toast(copied ? message : "복사할 수 없습니다. 원문 영역에서 직접 선택하세요.");
    }
  }

  function load(data) {
    const rawItems = Array.isArray(data?.items) ? data.items : [];
    items = rawItems.map(normalizeItem).filter(item => item.title || item.path);
    updateSummary(data?.summary);
    dataState.hidden = items.length > 0;
    if (!items.length) {
      dataState.hidden = false;
      dataState.textContent = "source-index.js 데이터를 찾지 못했습니다. 수집 에이전트가 window.LUSION_SOURCE_INDEX = { items, summary } 형식으로 생성하면 목록이 표시됩니다.";
      resultCount.textContent = "0 / 0개";
      sourceList.replaceChildren();
      return;
    }
    const params = new URLSearchParams(location.search);
    const requestedPath = params.get("path");
    let hashId = "";
    try {
      hashId = decodeURIComponent(location.hash.slice(1));
    } catch {
      hashId = "";
    }
    const initial = items.find(item => requestedPath && item.path === requestedPath)
      || items.find(item => requestedPath && item.path.endsWith(requestedPath))
      || items.find(item => item.id === hashId)
      || items[0];
    selectedId = initial.id;
    renderList();
    selectItem(initial.id, false);
  }

  searchInput.addEventListener("input", renderList);
  kindFilter.addEventListener("change", renderList);
  statusFilter.addEventListener("change", renderList);
  reloadCode.addEventListener("click", () => selectedItem && readCode(selectedItem));
  copyCode.addEventListener("click", () => activeCodeText && copyText(activeCodeText, "원문을 복사했습니다."));
  $("#back-to-list").addEventListener("click", () => {
    sourceList.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true });
    $(".source-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelectorAll("[role='tab']").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[role='tab']").forEach(node => node.setAttribute("aria-selected", String(node === tab)));
      document.querySelectorAll("[role='tab']").forEach(node => { node.tabIndex = node === tab ? 0 : -1; });
      document.querySelectorAll(".viewer-pane").forEach(pane => {
        const active = pane.id === tab.getAttribute("aria-controls");
        pane.hidden = !active;
        pane.classList.toggle("active", active);
      });
    });
    tab.tabIndex = tab.getAttribute('aria-selected') === 'true' ? 0 : -1;
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...document.querySelectorAll('.viewer-tabs [role="tab"]')];
      const index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].click();
      tabs[next].focus();
    });
  });
  sourceList.addEventListener("keydown", event => {
    if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) return;
    if (!filteredItems.length) return;
    event.preventDefault();
    const currentIndex = Math.max(0, filteredItems.findIndex(item => item.id === selectedId));
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") nextIndex = Math.min(filteredItems.length - 1, currentIndex + 1);
    if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = filteredItems.length - 1;
    if (event.key === "Enter" || event.key === " ") selectItem(filteredItems[currentIndex].id, true);
    else selectItem(filteredItems[nextIndex].id, false);
    const selected = sourceList.querySelector(`[data-id="${CSS.escape(selectedId)}"]`);
    if (!['Enter', ' '].includes(event.key)) selected?.focus({ preventScroll: true });
    if (document.activeElement !== detailTitle) selected?.scrollIntoView({ block: "nearest" });
  });
  document.querySelector(".topbar a[aria-current='page']")?.scrollIntoView({ inline: "center", block: "nearest" });

  window.LUSION_SOURCE_EXPLORER = { load, selectItem };
  if (window.LUSION_SOURCE_INDEX) {
    load(window.LUSION_SOURCE_INDEX);
  } else {
    window.setTimeout(() => {
      if (!items.length) load(null);
    }, 0);
  }
})();
