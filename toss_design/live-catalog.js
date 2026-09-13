const liveCatalog = document.querySelector("[data-live-catalog]");

if (liveCatalog) {
  const CATEGORY_ORDER = ["icons", "buttons", "shapes", "gradients", "colors", "images", "motion", "typography", "effects"];
  const CATEGORY_META = {
    icons: { label: "아이콘", glyph: "I", description: "inline SVG, image, mask" },
    buttons: { label: "버튼", glyph: "B", description: "CTA, link, control states" },
    shapes: { label: "도형", glyph: "S", description: "radius, lines, panels" },
    gradients: { label: "그라데이션", glyph: "G", description: "CSS gradient layers" },
    colors: { label: "색상", glyph: "C", description: "background and surface values" },
    images: { label: "이미지", glyph: "M", description: "source image assets" },
    motion: { label: "모션", glyph: "A", description: "timing and easing" },
    typography: { label: "타이포", glyph: "T", description: "font and text styles" },
    effects: { label: "효과", glyph: "E", description: "shadow, blur, masks" },
  };
  const EVIDENCE_META = {
    all: "전체",
    observed: "원본 관찰",
    inferred: "추정",
    recreated: "유사 재현",
  };
  const PAGE_SIZE_OPTIONS = [24, 48];
  const CATEGORY_ALIASES = {
    background: "colors",
    backgrounds: "colors",
    color: "colors",
    type: "typography",
    fonts: "typography",
    font: "typography",
    shadow: "effects",
    shadows: "effects",
  };
  const EXECUTABLE_LINK_PATTERN = /^\s*(?:javascript|vbscript|data):/i;
  const STYLE_URL_PATTERN = /url\(\s*(['"]?)\s*(?:javascript|vbscript):/i;
  const FALLBACK_SOURCE_URL = "https://toss.im";

  let sourceData = null;
  let allEntries = [];
  let activeCategory = "icons";
  let query = "";
  let evidence = "all";
  let pageSize = 24;
  let visibleLimit = 24;
  let lastFocusedElement = null;
  let liveRegion = null;
  let dialog = null;

  function compactText(value, fallback = "") {
    const compact = String(value || "").replace(/\s+/g, " ").trim();
    if (!compact) return fallback;
    if (compact.length % 2 === 0 && compact.slice(0, compact.length / 2) === compact.slice(compact.length / 2)) {
      return compact.slice(0, compact.length / 2);
    }
    return compact;
  }

  function shortText(value, fallback, length = 64) {
    const text = compactText(value, fallback);
    return text.length > length ? `${text.slice(0, length - 1)}…` : text;
  }

  function h(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(options).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "value") node.value = String(value);
      else if (key === "dataset") Object.entries(value).forEach(([dataKey, dataValue]) => { node.dataset[dataKey] = String(dataValue); });
      else if (key === "style") applySafeStyle(node, value);
      else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, String(value));
    });
    const list = Array.isArray(children) ? children : [children];
    list.filter(Boolean).forEach((child) => node.append(child));
    return node;
  }

  function applySafeStyle(node, style = {}) {
    Object.entries(style || {}).forEach(([property, rawValue]) => {
      const sizeProperty = /^(?:width|height|minWidth|minHeight|maxWidth|maxHeight|inlineSize|blockSize)$/;
      let value = typeof rawValue === "number" && sizeProperty.test(property) ? `${rawValue}px` : String(rawValue ?? "");
      if (/data:/i.test(value)) {
        const embedded = value.match(/^url\(["']?(data:image\/svg\+xml(?:;charset=[^,;]+)?,[^"')]+)["']?\)$/i);
        if (!embedded) return;
        try {
          const svg = sanitizeSvgMarkup(decodeURIComponent(embedded[1].slice(embedded[1].indexOf(',') + 1)));
          if (!svg) return;
          value = `url("data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}")`;
        } catch { return; }
      }
      if (!property || property.startsWith("--") || /[;{}<>]/.test(property) || STYLE_URL_PATTERN.test(value)) return;
      if (property.includes("-")) node.style.setProperty(property, value);
      else node.style[property] = value;
    });
  }

  function normalizeEvidence(value) {
    return ["observed", "inferred", "recreated"].includes(value) ? value : "recreated";
  }

  function normalizeLanguage(value) {
    return ["css", "html", "json", "javascript", "svg"].includes(value) ? value : "css";
  }

  function evidenceLabel(value) {
    return EVIDENCE_META[value] || EVIDENCE_META.recreated;
  }

  function normalizeEntry(entry, index) {
    const category = CATEGORY_META[entry.category] ? entry.category : "effects";
    const label = shortText(entry.label, `${CATEGORY_META[category].label} ${index + 1}`);
    const tags = Array.isArray(entry.tags) ? entry.tags.map((tag) => compactText(tag)).filter(Boolean) : [];
    const code = entry.code || {};
    const preview = entry.preview || {};
    const source = entry.source || {};
    const uses = Number.isFinite(Number(entry.uses)) ? Number(entry.uses) : undefined;
    return {
      id: compactText(entry.id, `${category}-${index + 1}`),
      category,
      label,
      evidence: normalizeEvidence(entry.evidence),
      description: compactText(entry.description),
      uses,
      tags,
      source: {
        url: compactText(source.url, sourceData?.sourceUrl || FALLBACK_SOURCE_URL),
        section: compactText(source.section),
        viewport: compactText(source.viewport),
        selector: compactText(source.selector),
      },
      code: {
        language: normalizeLanguage(code.language || preview.kind),
        value: String(code.value || preview.value || ""),
      },
      preview: {
        kind: preview.kind || inferPreviewKind(category, code.value),
        value: preview.value,
        url: preview.url,
        poster: preview.poster,
        style: preview.style,
      },
    };
  }

  function inferPreviewKind(category, value) {
    const text = String(value || "").trim();
    if (category === "icons" || /^<svg[\s>]/i.test(text)) return "svg";
    if (category === "buttons") return "button";
    if (category === "shapes") return "shape";
    if (category === "gradients") return "gradient";
    if (category === "colors") return "color";
    if (category === "images") return "image";
    if (category === "motion") return "motion";
    if (category === "typography") return "type";
    return text ? "code" : "shadow";
  }

  function legacyToEntries(data) {
    const entries = [];
    const sourceUrl = data.source?.url || FALLBACK_SOURCE_URL;
    const push = (entry) => entries.push(entry);

    (data.icons?.inline || []).forEach((icon, index) => {
      const svg = `<svg viewBox="${escapeAttribute(icon.viewBox || "0 0 24 24")}" xmlns="http://www.w3.org/2000/svg">${icon.innerMarkup || ""}</svg>`;
      push({
        id: icon.id || `inline-icon-${index + 1}`,
        category: "icons",
        label: compactText(icon.labels?.[0], icon.kind === "functional" ? "Inline icon" : "Graphic SVG"),
        evidence: "observed",
        description: `${icon.kind || "inline"} SVG · ${icon.nodeCount || 0} nodes · ${icon.renderedSizes?.join(", ") || "observed size"}`,
        uses: icon.uses,
        tags: [icon.kind, icon.viewBox, ...(icon.labels || [])].filter(Boolean),
        source: { url: sourceUrl, section: "inline svg", viewport: icon.renderedSizes?.[0] },
        code: { language: "svg", value: svg },
        preview: { kind: "svg", value: svg, style: icon.rootStyle },
      });
    });

    (data.icons?.images || []).forEach((icon, index) => {
      push({
        id: `image-icon-${index + 1}`,
        category: "icons",
        label: compactText(icon.alt, `Image icon ${index + 1}`),
        evidence: "observed",
        description: `${icon.width || "?"}x${icon.height || "?"} source image`,
        uses: 1,
        tags: [icon.src, icon.alt].filter(Boolean),
        source: { url: sourceUrl, section: "image icon" },
        code: { language: "html", value: `<img src="${escapeAttribute(icon.src || "")}" alt="${escapeAttribute(icon.alt || "")}" />` },
        preview: { kind: "image", url: icon.src },
      });
    });

    (data.icons?.masks || []).forEach((icon, index) => {
      push({
        id: `mask-icon-${index + 1}`,
        category: "icons",
        label: compactText(icon.label, `Mask icon ${index + 1}`),
        evidence: "observed",
        description: "CSS mask icon",
        uses: 1,
        tags: [icon.value, icon.label].filter(Boolean),
        source: { url: sourceUrl, section: "css mask" },
        code: { language: "css", value: `mask-image: ${icon.value};\n-webkit-mask-image: ${icon.value};` },
        preview: { kind: "shape", style: { maskImage: icon.value, WebkitMaskImage: icon.value } },
      });
    });

    (data.buttons || []).forEach((button, index) => {
      const label = compactText(button.labels?.[0], `Button ${index + 1}`);
      const signature = button.signature || {};
      const css = Object.entries(signature).map(([key, value]) => `${toKebab(key)}: ${value};`).join("\n");
      push({
        id: button.id || `button-${index + 1}`,
        category: "buttons",
        label,
        evidence: "observed",
        description: `${signature.height || "auto"}px · radius ${signature.borderRadius || "0"}`,
        uses: button.uses,
        tags: [...(button.labels || []), ...(button.tags || [])],
        source: { url: sourceUrl, section: "button/link" },
        code: { language: "css", value: css },
        preview: { kind: "button", value: label, style: signature },
      });
    });

    (data.shapes || []).forEach((shape, index) => {
      const sample = shape.samples?.[0] || {};
      const label = shape.kind === "line" ? `${shape.orientation || ""} line · ${shape.thickness || 1}px` : `${shape.kind || "shape"} · ${shape.radius || 0}px`;
      push({
        id: shape.id || `shape-${index + 1}`,
        category: "shapes",
        label,
        evidence: "observed",
        description: `${shape.uses || 0} instances · sample ${sample.width || 0}x${sample.height || 0}`,
        uses: shape.uses,
        tags: [shape.kind, shape.orientation, ...(shape.samples || []).map((item) => item.label)].filter(Boolean),
        source: { url: sourceUrl, section: "computed radius" },
        code: { language: "css", value: `width: ${sample.width || 72}px;\nheight: ${sample.height || 48}px;\nborder-radius: ${shape.radius || 0}px;` },
        preview: { kind: "shape", style: shapePreviewStyle(shape, sample) },
      });
    });

    (data.color?.gradients || []).forEach((gradient, index) => {
      push({
        id: `gradient-${String(index + 1).padStart(2, "0")}`,
        category: "gradients",
        label: `Gradient ${String(index + 1).padStart(2, "0")}`,
        evidence: "observed",
        description: "Declared/computed CSS gradient",
        uses: gradient.uses,
        tags: gradient.samples || [],
        source: { url: sourceUrl, section: "css gradient" },
        code: { language: "css", value: `background-image: ${gradient.value};` },
        preview: { kind: "gradient", value: gradient.value },
      });
    });

    (data.color?.backgroundColors || []).forEach((color, index) => {
      push({
        id: `color-${String(index + 1).padStart(3, "0")}`,
        category: "colors",
        label: color.value,
        evidence: "observed",
        description: "Computed background color",
        uses: color.uses,
        tags: color.samples || [],
        source: { url: sourceUrl, section: "computed background" },
        code: { language: "css", value: `background-color: ${color.value};` },
        preview: { kind: "color", value: color.value },
      });
    });

    (data.color?.computedBackgroundImages || []).forEach((background, index) => {
      push({
        id: `effect-background-${String(index + 1).padStart(2, "0")}`,
        category: "effects",
        label: `Background layer ${index + 1}`,
        evidence: "observed",
        description: "Computed background image layer",
        uses: background.uses,
        tags: background.samples || [],
        source: { url: sourceUrl, section: "computed background image" },
        code: { language: "css", value: `background-image: ${background.value};` },
        preview: { kind: background.value?.includes("gradient") ? "gradient" : "code", value: background.value },
      });
    });

    return {
      schemaVersion: 2,
      collectedAt: data.generatedAt,
      sourceUrl,
      coverage: {
        viewports: ["desktop", "mobile"],
        sections: ["icons", "buttons", "shapes", "colors", "gradients", "effects"],
        notes: ["Legacy catalog normalized in browser."],
      },
      assets: [],
      entries,
    };
  }

  function toKebab(value) {
    return String(value).replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
  }

  function shapePreviewStyle(shape, sample) {
    const kind = shape.kind || "panel";
    const width = Number(sample.width) || 72;
    const height = Number(sample.height) || 48;
    const scale = Math.min(1, 124 / Math.max(width, height, 1));
    const style = {
      width: `${Math.max(kind === "line" ? 2 : 18, Math.min(124, width * scale))}px`,
      height: `${Math.max(kind === "line" ? 2 : 18, Math.min(92, height * scale))}px`,
      borderRadius: `${shape.radius || 0}px`,
    };
    if (kind === "line" && shape.orientation === "vertical") {
      style.width = `${Math.max(1, Math.min(4, shape.thickness || width))}px`;
      style.height = `${Math.max(54, Math.min(94, height))}px`;
    }
    if (kind === "line" && shape.orientation !== "vertical") {
      style.width = `${Math.max(54, Math.min(124, width))}px`;
      style.height = `${Math.max(1, Math.min(4, shape.thickness || height))}px`;
    }
    return style;
  }

  function escapeAttribute(value) {
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function safeHref(value) {
    const href = compactText(value);
    return href && !EXECUTABLE_LINK_PATTERN.test(href) ? href : "";
  }

  function sanitizeSvgMarkup(markup) {
    const source = String(markup || "").trim();
    if (!source) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "image/svg+xml");
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() === "parsererror") return null;
    const allowed = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "defs", "lineargradient", "radialgradient", "stop", "clippath", "mask", "use", "title", "desc", "pattern", "image", "filter", "feflood", "feblend", "fegaussianblur", "fecomposite", "fecolormatrix", "feoffset", "femerge", "femergenode"]);
    [...svg.querySelectorAll("*")].forEach((node) => {
      if (!allowed.has(node.nodeName.toLowerCase())) {
        node.remove();
        return;
      }
      [...node.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value || "";
        if (node.nodeName.toLowerCase() === "image" && (name === "href" || name === "xlink:href") && /^data:image\/(?:png|webp|jpeg|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(value)) return;
        if (name.startsWith("on") || name === "script" || EXECUTABLE_LINK_PATTERN.test(value)) {
          node.removeAttribute(attribute.name);
          return;
        }
        if ((name === "href" || name === "xlink:href") && !value.startsWith("#")) node.removeAttribute(attribute.name);
      });
    });
    [...svg.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || EXECUTABLE_LINK_PATTERN.test(attribute.value)) svg.removeAttribute(attribute.name);
    });
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    return document.importNode(svg, true);
  }

  function svgNeedsDarkStage(markup) {
    const source = String(markup || "");
    if (/#(?:fff|f8f9fa|f9fafb|f2f4f6|e5e8eb)\b/i.test(source) || /\bwhite\b/i.test(source)) return true;
    const colorMatches = source.matchAll(/rgba?\(\s*(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})(?:[,\s/]+([\d.]+))?\s*\)/gi);
    for (const match of colorMatches) {
      const red = Number(match[1]);
      const green = Number(match[2]);
      const blue = Number(match[3]);
      const alpha = match[4] === undefined ? 1 : Number(match[4]);
      if (red >= 210 && green >= 210 && blue >= 210 && alpha >= 0.35) return true;
    }
    return false;
  }

  function applyConstrainedShapeStyle(node, style, large) {
    const safeStyle = { ...(style || {}) };
    const originalWidth = parseCssSize(safeStyle.width) || parseCssSize(safeStyle.inlineSize) || (large ? 180 : 88);
    const originalHeight = parseCssSize(safeStyle.height) || parseCssSize(safeStyle.blockSize) || (large ? 120 : 64);
    const maxWidth = large ? 360 : 124;
    const maxHeight = large ? 260 : 92;
    const scale = Math.min(1, maxWidth / Math.max(originalWidth, 1), maxHeight / Math.max(originalHeight, 1));
    const width = Math.max(large ? 18 : 12, originalWidth * scale);
    const height = Math.max(large ? 18 : 12, originalHeight * scale);

    delete safeStyle.width;
    delete safeStyle.height;
    delete safeStyle.inlineSize;
    delete safeStyle.blockSize;
    applySafeStyle(node, safeStyle);
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
  }

  function parseCssSize(value) {
    const match = String(value || "").match(/(-?\d+(?:\.\d+)?)px/);
    return match ? Math.abs(Number(match[1])) : 0;
  }

  function buildSearchText(entry) {
    return [
      entry.id,
      entry.category,
      CATEGORY_META[entry.category]?.label,
      CATEGORY_META[entry.category]?.description,
      entry.label,
      entry.evidence,
      entry.description,
      entry.uses,
      ...(entry.tags || []),
      entry.source?.section,
      entry.source?.viewport,
      entry.source?.selector,
      entry.source?.url,
      entry.code?.language,
      entry.code?.value,
      entry.preview?.kind,
      entry.preview?.value,
      entry.preview?.url,
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function getCounts(entries = allEntries) {
    return CATEGORY_ORDER.reduce((counts, category) => {
      counts[category] = entries.filter((entry) => entry.category === category).length;
      return counts;
    }, {});
  }

  function matchesEntry(entry) {
    if (activeCategory !== "all" && entry.category !== activeCategory) return false;
    if (evidence !== "all" && entry.evidence !== evidence) return false;
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    const haystack = entry.searchText || buildSearchText(entry);
    return tokens.every((token) => haystack.includes(token));
  }

  function filteredEntries() {
    return allEntries.filter(matchesEntry);
  }

  function renderShell() {
    liveCatalog.setAttribute("aria-busy", "true");
    liveCatalog.replaceChildren(
      h("div", { class: "live-catalog__top as-section-heading" }, [
        h("div", { class: "live-catalog__intro" }, [
          h("span", { class: "spec-label", text: "Source library" }),
          h("h3", { id: "live-catalog-title", text: "수집 소스 라이브러리" }),
          h("p", { text: "출처 사이트에서 관찰·재구성한 아이콘, 버튼, 도형, 색상, 모션, 타이포그래피를 검색 가능한 재사용 소스로 정리했다." }),
        ]),
        h("div", { class: "live-catalog__actions" }, [
          h("label", { class: "catalog-search" }, [
            h("span", { class: "visually-hidden", text: "소스 검색" }),
            h("input", { type: "search", placeholder: "색상 버튼 svg 모션 검색", autocomplete: "off", dataset: { catalogSearch: "" } }),
          ]),
          h("a", { class: "catalog-action catalog-action--ghost", href: "./dist/toss-source-kit.zip", download: "", text: "키트 다운로드" }),
          h("button", { class: "catalog-action", type: "button", dataset: { catalogExport: "" }, text: "JSON 내보내기" }),
        ]),
      ]),
      h("div", { class: "catalog-controls" }, [
        h("div", { class: "catalog-tabs", role: "tablist", "aria-label": "소스 카테고리", dataset: { categoryTabs: "" } }),
        h("div", { class: "catalog-filters", "aria-label": "카탈로그 필터" }, [
          h("select", { dataset: { evidenceFilter: "" }, "aria-label": "근거 필터" }, Object.entries(EVIDENCE_META).map(([value, label]) => h("option", { value, text: label }))),
          h("select", { dataset: { pageSize: "" }, "aria-label": "페이지 크기" }, PAGE_SIZE_OPTIONS.map((size) => h("option", { value: size, text: `${size}개씩` }))),
          h("button", { class: "catalog-reset", type: "button", dataset: { catalogReset: "" }, text: "초기화" }),
        ]),
      ]),
      h("div", { class: "catalog-status", role: "status", dataset: { catalogStatus: "" }, text: "소스 데이터를 불러오는 중…" }),
      h("div", { id: "catalog-results", role: "tabpanel", class: "catalog-grid", dataset: { catalogGrid: "" } }),
      h("div", { class: "catalog-load" }, [
        h("button", { class: "catalog-load__button", type: "button", dataset: { catalogLoadMore: "" }, text: "더 보기" }),
      ]),
      h("div", { class: "catalog-empty", hidden: "", dataset: { catalogEmpty: "" } }, [
        h("strong", { text: "일치하는 소스가 없습니다" }),
        h("p", { text: "검색어와 필터를 지우면 전체 수집 항목을 다시 볼 수 있습니다." }),
        h("button", { type: "button", dataset: { catalogReset: "" }, text: "필터 초기화" }),
      ]),
      h("div", { class: "catalog-live-region visually-hidden", "aria-live": "polite", dataset: { catalogLive: "" } })
    );
    dialog = createDialog();
    liveCatalog.append(dialog);
    liveRegion = liveCatalog.querySelector("[data-catalog-live]");
    bindShellEvents();
  }

  function bindShellEvents() {
    liveCatalog.querySelector("[data-catalog-search]")?.addEventListener("input", (event) => {
      query = event.target.value;
      if (query.trim()) activeCategory = "all";
      visibleLimit = pageSize;
      renderCatalog();
    });
    liveCatalog.querySelector("[data-evidence-filter]")?.addEventListener("change", (event) => {
      evidence = event.target.value;
      visibleLimit = pageSize;
      renderCatalog();
    });
    liveCatalog.querySelector("[data-page-size]")?.addEventListener("change", (event) => {
      pageSize = Number(event.target.value) || 24;
      visibleLimit = pageSize;
      renderCatalog();
    });
    liveCatalog.querySelectorAll("[data-catalog-reset]").forEach((button) => button.addEventListener("click", resetFilters));
    liveCatalog.querySelector("[data-catalog-load-more]")?.addEventListener("click", () => {
      visibleLimit += pageSize;
      renderCatalog();
    });
    liveCatalog.querySelector("[data-catalog-export]")?.addEventListener("click", exportFilteredJson);
    liveCatalog.querySelector("[data-category-tabs]")?.addEventListener("keydown", handleCategoryKeydown);
    document.addEventListener("catalog:search", (event) => {
      query = compactText(event.detail?.query);
      if (query) activeCategory = "all";
      const search = liveCatalog.querySelector("[data-catalog-search]");
      if (search) search.value = query;
      visibleLimit = pageSize;
      renderCatalog();
    });
    document.addEventListener("catalog:category", (event) => {
      selectCategory(event.detail?.category || "icons");
    });
  }

  function createDialog() {
    const closeButton = h("button", { class: "catalog-dialog__close", type: "button", value: "cancel", "aria-label": "닫기", text: "×" });
    const form = h("form", { method: "dialog", class: "catalog-dialog__frame" }, [
      closeButton,
      h("div", { class: "catalog-dialog__preview", dataset: { dialogPreview: "" } }),
      h("div", { class: "catalog-dialog__body" }, [
        h("div", { class: "catalog-dialog__eyebrow", dataset: { dialogEvidence: "" } }),
        h("h4", { dataset: { dialogTitle: "" } }),
        h("p", { dataset: { dialogDescription: "" } }),
        h("dl", { class: "catalog-detail-list", dataset: { dialogMeta: "" } }),
        h("div", { class: "catalog-code-actions" }, [
          h("button", { type: "button", dataset: { copyCode: "" }, text: "코드 복사" }),
          h("button", { type: "button", dataset: { downloadCode: "" }, text: "파일 다운로드" }),
        ]),
        h("pre", { class: "catalog-code" }, [h("code", { dataset: { dialogCode: "" } })]),
      ]),
    ]);
    const modal = h("dialog", { class: "catalog-dialog", "aria-labelledby": "catalog-dialog-title" }, form);
    closeButton.addEventListener("click", () => modal.close());
    form.querySelector("[data-copy-code]").addEventListener("click", copyDialogCode);
    form.querySelector("[data-download-code]").addEventListener("click", downloadDialogCode);
    form.append(h("p", { class: "catalog-copy-status", role: "status", dataset: { dialogStatus: "" } }));
    modal.addEventListener("close", () => {
      modal.querySelectorAll("video").forEach(video => video.pause());
      lastFocusedElement?.focus?.();
      lastFocusedElement = null;
    });
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.close();
    });
    return modal;
  }

  function renderCategoryTabs(counts) {
    const tablist = liveCatalog.querySelector("[data-category-tabs]");
    if (!tablist) return;
    const categories = ["all", ...CATEGORY_ORDER];
    tablist.replaceChildren(...categories.map((category) => {
      const selected = activeCategory === category;
      const meta = category === "all" ? { label: "전체", glyph: "*", description: "전체" } : CATEGORY_META[category];
      const count = category === "all" ? allEntries.length : counts[category] || 0;
      return h("button", {
        type: "button",
        role: "tab",
        class: "catalog-tab",
        "aria-selected": selected,
        id: `source-tab-${category}`,
        "aria-controls": "catalog-results",
        tabindex: selected ? 0 : -1,
        dataset: { catalogTab: category },
        onclick: () => selectCategory(category),
      }, [
        h("span", { class: "catalog-tab__glyph", "aria-hidden": "true", text: meta.glyph }),
        h("span", { class: "catalog-tab__label", text: meta.label }),
        h("span", { class: "catalog-tab__count", text: count }),
      ]);
    }));
  }

  function handleCategoryKeydown(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...liveCatalog.querySelectorAll("[data-catalog-tab]")];
    const current = Math.max(0, tabs.indexOf(document.activeElement));
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    event.preventDefault();
    const category = tabs[next]?.dataset.catalogTab;
    if (category) {
      selectCategory(category);
      liveCatalog.querySelector(`[data-catalog-tab="${category}"]`)?.focus();
    }
  }

  function selectCategory(category) {
    const hadTabFocus = Boolean(document.activeElement?.dataset.catalogTab);
    const normalized = normalizeCategory(category);
    activeCategory = normalized === "all" || CATEGORY_META[normalized] ? normalized : "icons";
    visibleLimit = pageSize;
    renderCatalog();
    if (hadTabFocus) liveCatalog.querySelector(`[data-catalog-tab="${activeCategory}"]`)?.focus({ preventScroll: true });
  }

  function normalizeCategory(category) {
    const value = compactText(category).toLowerCase();
    return CATEGORY_ALIASES[value] || value;
  }

  function renderCatalog() {
    liveCatalog.querySelector("[data-catalog-grid]")?.setAttribute("aria-labelledby", `source-tab-${activeCategory}`);
    const counts = getCounts();
    renderCategoryTabs(counts);
    const matches = filteredEntries();
    const shown = matches.slice(0, visibleLimit);
    const grid = liveCatalog.querySelector("[data-catalog-grid]");
    const status = liveCatalog.querySelector("[data-catalog-status]");
    const empty = liveCatalog.querySelector("[data-catalog-empty]");
    const loadMore = liveCatalog.querySelector("[data-catalog-load-more]");

    grid?.replaceChildren(...shown.map(renderCard));
    if (status) {
      const observed = allEntries.filter((entry) => entry.evidence === "observed").length;
      const recreated = allEntries.filter((entry) => entry.evidence === "recreated").length;
      const label = activeCategory === "all" ? "전체" : CATEGORY_META[activeCategory]?.label;
      status.textContent = `${label} ${matches.length}개 표시 · 총 ${allEntries.length}개 소스 · 원본 관찰 ${observed} · 유사 재현 ${recreated}`;
      status.classList.add("is-ready");
    }
    if (empty) empty.hidden = matches.length > 0;
    if (loadMore) {
      loadMore.hidden = matches.length <= visibleLimit;
      loadMore.textContent = `더 보기 (${Math.min(pageSize, Math.max(0, matches.length - visibleLimit))})`;
    }
  }

  function renderCard(entry) {
    const card = h("article", {
      class: `catalog-card catalog-card--${entry.category}`,
      tabindex: 0,
      role: "button",
      "aria-label": `${entry.label} 상세 보기`,
      dataset: { entryId: entry.id },
      onclick: () => openDetail(entry),
      onkeydown: (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openDetail(entry);
      },
    }, [
      renderPreview(entry, false),
      h("div", { class: "catalog-card__body" }, [
        h("div", { class: "catalog-card__meta" }, [
          h("strong", { text: entry.label }),
          h("span", { text: entry.uses ? `${entry.uses}회` : entry.id }),
        ]),
        h("div", { class: "catalog-card__footer" }, [
          h("span", { class: `catalog-evidence catalog-evidence--${entry.evidence}`, text: evidenceLabel(entry.evidence) }),
          h("span", { text: shortText(`${entry.preview.kind || entry.code.language} · ${entry.source.section || entry.source.viewport || "source"}`, "source", 42) }),
        ]),
      ]),
    ]);
    return card;
  }

  function renderPreview(entry, large) {
    const preview = h("div", { class: `catalog-preview${large ? " catalog-preview--large" : ""}` });
    const kind = entry.preview.kind;
    if (kind === "svg") {
      const svg = sanitizeSvgMarkup(entry.preview.value || entry.code.value);
      if (svgNeedsDarkStage(entry.preview.value || entry.code.value)) preview.classList.add("catalog-preview--dark");
      if (svg) preview.append(svg);
      else preview.append(h("span", { text: "SVG" }));
      return preview;
    }
    if (kind === "image") {
      const image = h("img", { src: entry.preview.url || entry.preview.value || "", alt: "", loading: "lazy" });
      image.addEventListener("error", () => preview.classList.add("is-broken"), { once: true });
      preview.append(image, h("span", { class: "catalog-preview__fallback", text: "이미지를 불러올 수 없어요" }));
      return preview;
    }
    if (kind === "video") {
      const video = h("video", { controls: large ? "" : undefined, preload: "none", playsinline: "", poster: entry.preview.poster || "", src: entry.preview.url || "" });
      video.addEventListener("error", () => preview.classList.add("is-broken"), { once: true });
      preview.append(video, h("span", { class: "catalog-preview__fallback", text: "원본 영상 연결을 확인해주세요" }));
      return preview;
    }
    if (kind === "color" || kind === "gradient") {
      const swatch = h("div", { class: "catalog-swatch" });
      if (kind === "color") swatch.style.backgroundColor = String(entry.preview.value || entry.label);
      else swatch.style.backgroundImage = String(entry.preview.value || entry.code.value).replace(/^background-image:\s*/i, "").replace(/;\s*$/, "");
      preview.append(swatch);
      return preview;
    }
    if (kind === "button") {
      if (svgNeedsDarkStage(entry.preview.style?.color)) preview.classList.add("catalog-preview--dark");
      const sample = h("span", { class: "catalog-button-sample", text: shortText(entry.preview.value || entry.label, "Button", 28) });
      applySafeStyle(sample, entry.preview.style || cssTextToStyle(entry.code.value));
      preview.append(sample);
      return preview;
    }
    if (kind === "shape") {
      const shape = h("span", { class: "catalog-shape" });
      applyConstrainedShapeStyle(shape, entry.preview.style || cssTextToStyle(entry.code.value), large);
      preview.append(shape);
      return preview;
    }
    if (kind === "motion") {
      preview.append(h("span", { class: "catalog-motion-dot" }), h("span", { class: "catalog-motion-track" }));
      return preview;
    }
    if (kind === "type" || kind === "font") {
      if (svgNeedsDarkStage(entry.preview.style?.color)) preview.classList.add("catalog-preview--dark");
      preview.append(h("span", { class: "catalog-type-sample", text: entry.preview.value || "Aa 가나다" }));
      applySafeStyle(preview.firstElementChild, entry.preview.style || cssTextToStyle(entry.code.value));
      return preview;
    }
    if (kind === "shadow") {
      const effect = h("span", { class: "catalog-effect-sample" });
      applySafeStyle(effect, entry.preview.style || cssTextToStyle(entry.code.value));
      preview.append(effect);
      return preview;
    }
    preview.append(h("code", { text: shortText(entry.code.value || entry.preview.value, "code", large ? 220 : 76) }));
    return preview;
  }

  function cssTextToStyle(cssText) {
    return String(cssText || "").split(";").reduce((style, declaration) => {
      const [property, ...valueParts] = declaration.split(":");
      const value = valueParts.join(":").trim();
      if (!property || !value) return style;
      style[property.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
      return style;
    }, {});
  }

  function openDetail(entry) {
    dialog.querySelector("[data-dialog-status]").textContent = "";
    lastFocusedElement = document.activeElement;
    dialog.dataset.entryId = entry.id;
    dialog.querySelector("[data-dialog-preview]").replaceChildren(renderPreview(entry, true));
    dialog.querySelector("[data-dialog-evidence]").textContent = `${CATEGORY_META[entry.category]?.label || entry.category} · ${evidenceLabel(entry.evidence)}`;
    const title = dialog.querySelector("[data-dialog-title]");
    title.id = "catalog-dialog-title";
    title.textContent = entry.label;
    dialog.querySelector("[data-dialog-description]").textContent = entry.description || "수집된 소스 값을 재사용할 수 있도록 정리한 항목입니다.";
    const meta = dialog.querySelector("[data-dialog-meta]");
    meta.replaceChildren(
      detailPair("출처", entry.source.url, entry.source.url),
      detailPair("사용 위치", entry.source.section || "-"),
      detailPair("화면 크기", entry.source.viewport || "-"),
      detailPair("선택자", entry.source.selector || "-"),
      detailPair("사용 횟수", entry.uses ? `${entry.uses}` : "-")
    );
    dialog.querySelector("[data-dialog-code]").textContent = entry.code.value || "/* No reusable code value provided. */";
    dialog.showModal();
  }

  function detailPair(label, value, href) {
    const fragment = document.createDocumentFragment();
    fragment.append(h("dt", { text: label }));
    const dd = h("dd");
    const safe = safeHref(href);
    if (safe) dd.append(h("a", { href: safe, target: "_blank", rel: "noreferrer", text: shortText(value, safe, 80) }));
    else dd.textContent = value;
    fragment.append(dd);
    return fragment;
  }

  async function copyDialogCode() {
    const entry = allEntries.find((item) => item.id === dialog.dataset.entryId);
    const value = entry?.code?.value || "";
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else fallbackCopy(value);
      announce("코드를 복사했습니다.");
    } catch (error) {
      announce("복사에 실패했습니다. 코드를 직접 선택해 주세요.");
    }
  }

  function fallbackCopy(value) {
    const area = h("textarea", { value });
    area.value = value;
    area.style.position = "fixed";
    area.style.inset = "0 auto auto 0";
    area.style.opacity = "0";
    (dialog?.open ? dialog : document.body).append(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    if (!copied) throw new Error("Clipboard unavailable");
  }

  function downloadDialogCode() {
    const entry = allEntries.find((item) => item.id === dialog.dataset.entryId);
    if (!entry) return;
    const extension = entry.code.language === "javascript" ? "js" : entry.code.language;
    downloadBlob(entry.code.value || "", `${entry.id}.${extension}`, mimeFor(entry.code.language));
  }

  function exportFilteredJson() {
    const payload = {
      schemaVersion: sourceData?.schemaVersion || 2,
      exportedAt: new Date().toISOString(),
      sourceUrl: sourceData?.sourceUrl,
      filter: { category: activeCategory, query, evidence },
      entries: filteredEntries().map(({ searchText, ...entry }) => entry),
    };
    downloadBlob(JSON.stringify(payload, null, 2), "toss-source-library-filtered.json", "application/json");
    announce("필터된 JSON을 내보냈습니다.");
  }

  function downloadBlob(value, filename, type) {
    const blob = new Blob([value], { type });
    const url = URL.createObjectURL(blob);
    const anchor = h("a", { href: url, download: filename });
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function mimeFor(language) {
    if (language === "json") return "application/json";
    if (language === "svg") return "image/svg+xml";
    if (language === "html") return "text/html";
    if (language === "javascript") return "text/javascript";
    return "text/css";
  }

  function announce(message) {
    if (liveRegion) liveRegion.textContent = message;
    if (dialog?.open) dialog.querySelector("[data-dialog-status]").textContent = message;
  }

  function resetFilters() {
    query = "";
    evidence = "all";
    visibleLimit = pageSize;
    const search = liveCatalog.querySelector("[data-catalog-search]");
    const filter = liveCatalog.querySelector("[data-evidence-filter]");
    if (search) search.value = "";
    if (filter) filter.value = "all";
    renderCatalog();
  }

  async function loadCatalog() {
    const response = await fetch("./data/toss-source-library.json?v=20260907-1");
    if (response.ok) return response.json();
    const legacyResponse = await fetch("./data/toss-live-design-catalog.json?v=20260901-2");
    if (!legacyResponse.ok) throw new Error("카탈로그 데이터를 불러오지 못했습니다.");
    return legacyToEntries(await legacyResponse.json());
  }

  renderShell();
  loadCatalog()
    .then((data) => {
      sourceData = Array.isArray(data.entries) ? data : legacyToEntries(data);
      allEntries = sourceData.entries.map(normalizeEntry).map((entry) => ({ ...entry, searchText: buildSearchText(entry) }));
      const firstPopulated = CATEGORY_ORDER.find((category) => allEntries.some((entry) => entry.category === category));
      activeCategory = firstPopulated || "all";
      liveCatalog.dataset.ready = "true";
      liveCatalog.setAttribute("aria-busy", "false");
      renderCatalog();
      document.dispatchEvent(new CustomEvent("catalog:ready", { detail: { entries: allEntries.length, sourceUrl: sourceData.sourceUrl } }));
      if (window.location.hash === "#live-catalog") window.requestAnimationFrame(() => liveCatalog.scrollIntoView({ block: "start" }));
    })
    .catch((error) => {
      liveCatalog.setAttribute("aria-busy", "false");
      const status = liveCatalog.querySelector("[data-catalog-status]");
      if (status) status.textContent = error.message;
    });
}
