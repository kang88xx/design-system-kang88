export const RUNTIME_URL = "/research/runtime-motion.json";
export const CATALOG_URL = "/research/motion-catalog.json";

export const PAGE_SIZE_OPTIONS = [25, 50, 100];
export const STATUS_VALUES = ["playable", "all", "observed", "no-change", "blocked", "skipped", "source-only"];
export const VIEWPORT_VALUES = ["all", "desktop", "mobile"];
export const TRIGGER_VALUES = ["all", "scroll", "hover", "click", "load", "focus", "autoplay", "unspecified"];
export const KIND_VALUES = [
  "all",
  "css-keyframes",
  "css-animation",
  "css-transition",
  "declarative",
  "js-animation",
  "svg-animation",
  "media-source",
  "animation",
  "transition",
  "state",
  "media",
  "scroll",
  "hover",
  "click",
  "unspecified",
];

const STYLE_ALLOWLIST = new Set([
  "opacity",
  "transform",
  "clipPath",
  "clip-path",
  "filter",
  "backgroundColor",
  "background-color",
  "height",
  "maxHeight",
  "max-height",
  "visibility",
  "scale",
  "translate",
  "rotate",
]);
const STYLE_KEYS = [...STYLE_ALLOWLIST].filter((key) => !key.includes("-"));

export const isObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);

export const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const text = (value, fallback = "") =>
  value === null || value === undefined ? fallback : String(value);

export const titleCase = (value) =>
  text(value || "unknown")
    .replace(/[-_./]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const compact = (items) => items.map((item) => text(item).trim()).filter(Boolean);

export function rejectHtmlFallback(response, url) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error(`${url} returned HTML instead of JSON data.`);
  }
}

export function sanitizeStyleValue(value) {
  return text(value)
    .replace(/[<>]/g, "")
    .replace(/url\s*\([^)]*\)/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/@import[^;]+;/gi, "")
    .slice(0, 220);
}

export function sanitizeKeyframe(frame = {}) {
  const safe = {};
  const rawOffset = frame.offset ?? frame.computedOffset;
  if (rawOffset !== null && rawOffset !== undefined) {
    const offset = Number(rawOffset);
    if (Number.isFinite(offset)) {
      safe.offset = Math.max(0, Math.min(1, offset));
    }
  }

  for (const [key, value] of Object.entries(frame)) {
    if (key === "offset" || !STYLE_ALLOWLIST.has(key)) {
      continue;
    }

    const normalizedKey = key === "clip-path" ? "clipPath" : key;
    const sanitized = sanitizeStyleValue(value);
    if (sanitized) {
      safe[normalizedKey] = sanitized;
    }
  }

  return safe;
}

export function normalizeTrack(track = {}, index = 0) {
  const keyframes = asArray(track.keyframes).map(sanitizeKeyframe).filter((frame) => {
    const keys = Object.keys(frame).filter((key) => key !== "offset");
    return keys.length > 0;
  });
  const timing = isObject(track.timing) ? track.timing : {};
  const duration = Number(timing.duration ?? track.duration);
  const iterations = Number(timing.iterations ?? track.iterations ?? 1);

  return {
    rawTrack: track,
    source: text(track.source),
    timingProvenance: text(track.timingProvenance),
    scrollRange: isObject(track.scrollRange) ? track.scrollRange : null,
    id: text(track.id || track.target || `track-${index + 1}`),
    target: text(track.target || `Element ${index + 1}`),
    keyframes,
    timing: {
      duration: Number.isFinite(duration) && duration >= 0 ? duration : 600,
      delay: Number.isFinite(Number(timing.delay ?? track.delay)) ? Number(timing.delay ?? track.delay) : 0,
      easing: sanitizeStyleValue(timing.easing || track.easing || "ease"),
      fill: sanitizeStyleValue(timing.fill || track.fill || "both") || "both",
      direction: sanitizeStyleValue(timing.direction || track.direction || "normal") || "normal",
      iterations: Number.isFinite(iterations) && iterations > 0 ? iterations : 1,
    },
  };
}

export function hasChangingPreviewKeyframes(track) {
  const frames = asArray(track?.keyframes);
  return STYLE_KEYS.some((key) => {
    const values = frames
      .map((frame) => frame?.[key])
      .filter((value) => value !== undefined && value !== "");
    return new Set(values.map((value) => text(value))).size > 1;
  });
}

function interpolateNumber(a, b, progress) {
  return a + (b - a) * progress;
}

export function previewStyleAtProgress(track, progress) {
  const frames = asArray(track?.keyframes);
  if (!frames.length) return {};
  const sorted = [...frames].sort((a, b) => Number(a.offset ?? 0) - Number(b.offset ?? 0));
  const first = sorted[0] || {};
  const last = sorted[sorted.length - 1] || first;
  const nextIndex = sorted.findIndex((frame) => Number(frame.offset ?? 1) >= progress);
  const end = sorted[nextIndex >= 0 ? nextIndex : sorted.length - 1] || last;
  const start = sorted[Math.max(0, nextIndex - 1)] || first;
  const startOffset = Number(start.offset ?? 0);
  const endOffset = Number(end.offset ?? 1);
  const localProgress = endOffset > startOffset
    ? Math.max(0, Math.min(1, (progress - startOffset) / (endOffset - startOffset)))
    : 1;
  const style = {};

  for (const key of STYLE_KEYS) {
    if (start[key] === undefined && end[key] === undefined) continue;
    if (key === "opacity") {
      const startOpacity = Number(start.opacity ?? end.opacity);
      const endOpacity = Number(end.opacity ?? start.opacity);
      style.opacity = Number.isFinite(startOpacity) && Number.isFinite(endOpacity)
        ? interpolateNumber(startOpacity, endOpacity, localProgress)
        : end.opacity;
      continue;
    }
    style[key] = localProgress < 0.5 ? start[key] || end[key] : end[key] || start[key];
  }

  return style;
}

export function normalizeRuntime(raw = {}) {
  const pages = asArray(raw.pages).map((page, index) => ({
    ...page,
    id: text(page.id, `page-${index + 1}`),
    title: text(page.title || page.url, `Page ${index + 1}`),
    url: text(page.url),
    status: text(page.status, "unknown"),
    viewports: asArray(page.viewports),
  }));
  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const records = asArray(raw.records).map((record, index) => {
    const pageId = text(record.pageId);
    const page = pageMap.get(pageId);
    const tracks = asArray(record.tracks).map(normalizeTrack);
    return {
      ...record,
      rawRecord: record,
      id: text(record.id, `runtime-${index + 1}`),
      pageId,
      pageTitle: text(record.pageTitle || page?.title, pageId || "Unknown page"),
      sourceUrl: text(record.sourceUrl || page?.url),
      label: text(record.label || record.summary || record.selector, `Motion ${index + 1}`),
      trigger: text(record.trigger, "unspecified"),
      kind: text(record.kind, "unspecified"),
      status: text(record.status, "blocked"),
      viewport: text(record.viewport, "desktop"),
      selector: text(record.selector),
      summary: text(record.summary),
      properties: asArray(record.properties).map((item) => text(item)),
      duration: text(record.duration),
      easing: text(record.easing),
      tracks,
      trackCount: Number.isFinite(Number(record.trackCount)) ? Number(record.trackCount) : tracks.length,
      playableTrackCount: Number.isFinite(Number(record.playableTrackCount))
        ? Number(record.playableTrackCount)
        : tracks.filter((track) => track.keyframes.length > 1 && hasChangingPreviewKeyframes(track)).length,
      dedupeSignature: text(record.dedupeSignature),
      sourceRefs: asArray(record.sourceRefs),
      file: text(record.file),
      error: text(record.error),
    };
  });

  return {
    generatedAt: text(raw.generatedAt, ""),
    scope: raw.scope || {},
    pages,
    records,
    resources: asArray(raw.resources),
    totals: isObject(raw.totals) ? raw.totals : {},
  };
}

export function normalizeCatalog(raw = {}) {
  const pages = asArray(raw.pages).map((page, index) => ({
    ...page,
    id: text(page.id, `catalog-page-${index + 1}`),
    title: text(page.title || page.url, `Page ${index + 1}`),
    url: text(page.url),
  }));
  const pageMap = new Map(pages.map((page) => [page.id, page]));
  const records = asArray(raw.records).map((record, index) => {
    const pageIds = asArray(record.pageIds).map((id) => text(id));
    const titles = asArray(record.pageTitles).map((title) => text(title));
    pageIds.forEach((id) => {
      const page = pageMap.get(id);
      if (page?.title) titles.push(page.title);
    });
    return {
      ...record,
      id: text(record.id, `catalog-${index + 1}`),
      pageIds,
      pageTitles: [...new Set(titles)],
      sourceUrl: text(record.sourceUrl),
      file: text(record.file),
      selector: text(record.selector),
      label: text(record.label || record.selector || record.sourceUrl, `Source rule ${index + 1}`),
      kind: text(record.kind, "declarative"),
      trigger: text(record.trigger, "unspecified"),
      status: text(record.status, "source-only"),
      code: text(record.code),
      attributes: record.attributes,
      context: text(record.context),
    };
  });

  return {
    generatedAt: text(raw.generatedAt, ""),
    pages,
    summary: isObject(raw.summary) ? raw.summary : {},
    records,
  };
}

export function motionSignature(record) {
  return JSON.stringify({
    trigger: record.trigger,
    kind: record.kind,
    selector: record.selector,
    properties: record.properties,
    tracks: record.tracks.map((track) => ({
      timing: track.timing,
      keyframes: track.keyframes,
    })),
  });
}

export function countRuntime(records = []) {
  let playable = 0;
  let attempts = 0;
  let noChange = 0;
  let blocked = 0;

  for (const record of records) {
    if (record.status !== "source-only" && record.status !== "skipped") attempts += 1;
    if (isPlayableRuntimeRecord(record)) playable += 1;
    if (record.status === "no-change") noChange += 1;
    if (record.status === "blocked") blocked += 1;
  }

  return {
    playable,
    attempts,
    noChange,
    blocked,
  };
}

export function isPlayableRuntimeRecord(record) {
  if (!record || record.status === "source-only" || record.status === "skipped") return false;
  if (Number(record.playableTrackCount) > 0) return true;
  return asArray(record.tracks).some((track) =>
    asArray(track.keyframes).length > 1 && hasChangingPreviewKeyframes(track),
  );
}

export function filterRecords(records, filters) {
  const query = text(filters.query).trim().toLowerCase();
  return records.filter((record) => {
    const matchesPage = filters.page === "all" || record.pageId === filters.page || asArray(record.pageIds).includes(filters.page);
    const matchesViewport = filters.viewport === "all" || record.viewport === filters.viewport;
    const matchesTrigger = filters.trigger === "all" || record.trigger === filters.trigger;
    const matchesKind = filters.kind === "all" || record.kind === filters.kind;
    const matchesStatus = !filters.status
      || filters.status === "all"
      || (filters.status === "playable" ? isPlayableRuntimeRecord(record) : record.status === filters.status);
    const haystack = [
      record.id,
      record.pageTitle,
      record.sourceUrl,
      record.file,
      record.label,
      record.selector,
      record.summary,
      record.kind,
      record.trigger,
      record.status,
      record.context,
      asArray(record.pageTitles).join(" "),
    ].join(" ").toLowerCase();

    return matchesPage && matchesViewport && matchesTrigger && matchesKind && matchesStatus && haystack.includes(query);
  });
}
