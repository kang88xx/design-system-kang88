import crypto from "node:crypto";

export const viewportPresets = {
  desktop: { width: 1440, height: 1000, deviceScaleFactor: 1, isMobile: false },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
};

export const observedProperties = [
  "transform",
  "opacity",
  "clip-path",
  "filter",
  "translate",
  "scale",
  "rotate",
  "visibility",
  "height",
  "max-height",
  "background-color",
];

export function hashText(text, length = 12) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, length);
}

export function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

  return slug || fallback;
}

export function makeRecordId(parts) {
  const base = slugify(parts.filter(Boolean).join("-"), "record");
  return `${base}-${hashText(JSON.stringify(parts), 8)}`;
}

export function changedProperties(before = {}, after = {}) {
  return observedProperties.filter((property) => {
    const left = before[property] ?? "";
    const right = after[property] ?? "";
    return left !== right;
  });
}

export function signatureForRecord(record) {
  return [
    record.pageId,
    record.viewport,
    record.trigger,
    record.kind,
    record.selector,
    record.properties?.join(","),
    record.duration ?? "",
    record.easing ?? "",
    JSON.stringify(
      (record.tracks || []).map((track) => ({
        target: track.target,
        timing: track.timing,
        keyframes: track.keyframes,
      })),
    ),
    JSON.stringify({
      before: record.before?.target?.rect,
      after: record.after?.target?.rect,
    }),
  ].join("|");
}

export function createEmptyManifest({ generatedAt, scope, pages, resources }) {
  return {
    generatedAt,
    scope,
    pages,
    records: [],
    resources,
    totals: {
      pages: pages.length,
      viewports: 0,
      controlsDiscovered: 0,
      controlsTested: 0,
      records: 0,
      observed: 0,
      noChange: 0,
      blocked: 0,
      skipped: 0,
      sourceOnly: 0,
      dedupedObserved: 0,
      resources: resources.length,
    },
  };
}

export function updateTotals(manifest) {
  const records = manifest.records;
  manifest.totals.viewports = manifest.pages.reduce(
    (sum, page) => sum + (page.viewports?.length || 0),
    0,
  );
  manifest.totals.controlsDiscovered = manifest.pages.reduce(
    (sum, page) =>
      sum +
      (page.coverage || []).reduce(
        (viewportSum, item) => viewportSum + (item.controlsDiscovered || 0),
        0,
      ),
    0,
  );
  manifest.totals.controlsTested = manifest.pages.reduce(
    (sum, page) =>
      sum +
      (page.coverage || []).reduce(
        (viewportSum, item) => viewportSum + (item.controlsTested || 0),
        0,
      ),
    0,
  );
  manifest.totals.records = records.length;
  manifest.totals.observed = records.filter((record) => record.status === "observed").length;
  manifest.totals.noChange = records.filter((record) => record.status === "no-change").length;
  manifest.totals.blocked = records.filter((record) => record.status === "blocked").length;
  manifest.totals.skipped = records.filter((record) => record.status === "skipped").length;
  manifest.totals.sourceOnly = records.filter((record) => record.status === "source-only").length;
  manifest.totals.dedupedObserved = new Set(
    records
      .filter((record) => record.status === "observed")
      .map((record) => record.dedupeSignature || signatureForRecord(record)),
  ).size;
  manifest.totals.resources = manifest.resources.length;
  return manifest;
}
