import React, { useEffect, useMemo, useState } from "react";
import "./research.css";

const MANIFEST_URL = "/research/manifest.json";
const VIEWS = {
  pages: "페이지",
  icons: "아이콘",
  shapes: "도형",
  "observed-motion": "모션",
  "interaction-states": "상태",
  "research-sources": "소스",
};
const SOURCE_TYPES = ["all", "css", "js", "jsx", "ts", "html", "json", "map", "svg", "md", "txt", "xml", "asset"];
const SOURCE_PROVENANCE = ["all", "captured", "local", "reconstructed", "unavailable"];
const SOURCE_PAGE_SIZES = [25, 50, 100];
const TEXT_SOURCE_TYPES = new Set(["css", "js", "jsx", "html", "json", "map", "svg", "md", "txt", "xml", "ts"]);
const ALLOWED_STYLE_KEYS = new Set([
  "align-items",
  "background",
  "background-color",
  "background-image",
  "border",
  "border-color",
  "border-radius",
  "border-style",
  "border-width",
  "box-shadow",
  "clip-path",
  "color",
  "display",
  "font-size",
  "font-weight",
  "gap",
  "height",
  "justify-content",
  "line-height",
  "margin",
  "mask-image",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "opacity",
  "outline",
  "padding",
  "transform",
  "transition",
  "width",
]);

const isObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const controlsFrom = (value) => {
  if (Array.isArray(value)) {
    return { total: value.length, candidates: value.length, sampled: value.length, items: value.filter(Boolean) };
  }
  if (isObject(value)) {
    const items = asArray(value.items);
    return {
      ...value,
      total: Number.isFinite(Number(value.total)) ? Number(value.total) : items.length,
      candidates: Number.isFinite(Number(value.candidates)) ? Number(value.candidates) : items.length,
      sampled: Number.isFinite(Number(value.sampled)) ? Number(value.sampled) : items.length,
      items,
    };
  }
  return { total: 0, candidates: 0, sampled: 0, items: [] };
};
const text = (value, fallback = "") =>
  value === null || value === undefined ? fallback : String(value);
const compact = (items) => items.filter((item) => text(item).trim());
const titleCase = (value) =>
  text(value || "unknown")
    .replace(/[-_./]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const extOf = (value) => {
  const clean = text(value).split("?")[0].split("#")[0].toLowerCase();
  const match = clean.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
};
const sourceType = (item) => {
  const kind = text(item?.kind).toLowerCase();
  const ext = extOf(item?.file || item?.url);
  if (kind.includes("svg") || ext === "svg") return "svg";
  if (kind.includes("css") || ext === "css") return "css";
  if (kind.includes("javascript") || kind === "script" || ["js", "mjs", "cjs"].includes(ext))
    return "js";
  if (kind.includes("jsx") || ext === "jsx") return "jsx";
  if (["ts", "tsx"].includes(ext)) return "ts";
  if (["txt", "xml"].includes(ext)) return ext;
  if (kind.includes("html") || ["html", "htm"].includes(ext)) return "html";
  if (kind.includes("json") || ext === "json") return "json";
  if (kind.includes("map") || ext === "map") return "map";
  if (kind.includes("markdown") || ext === "md") return "md";
  return "asset";
};
const sourceKey = (resource) =>
  text(resource?.id || compact([resource?.file, resource?.url]).join("|"));
const sourcePageIds = (resource) => {
  const ids = asArray(resource?.pageIds).map((id) => text(id)).filter(Boolean);
  if (resource?.pageId) ids.push(text(resource.pageId));
  return [...new Set(ids)];
};
const sourcePageTitle = (resource, pagesById) => {
  const titles = asArray(resource?.pageTitles).map((item) => text(item)).filter(Boolean);
  const explicit = text(resource?.pageTitle);
  if (explicit) titles.push(explicit);
  sourcePageIds(resource).forEach((id) => {
    const page = pagesById.get(id);
    if (page?.title) titles.push(page.title);
  });
  return [...new Set(titles)].join(" · ");
};
const filenameOf = (value) => {
  const clean = text(value).split("?")[0].split("#")[0];
  const name = clean.split("/").filter(Boolean).pop() || clean || "Untitled source";
  try { return decodeURIComponent(name); } catch { return name; }
};
const formatBytes = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const sourceProvenance = (resource) => {
  const value = text(resource?.provenance || resource?.status).toLowerCase();
  return SOURCE_PROVENANCE.includes(value) && value !== "all" ? value : "captured";
};
const isTextSource = (resource) => TEXT_SOURCE_TYPES.has(sourceType(resource));
const readableJson = (value) => {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return text(value);
  }
};
const safeCssValue = (value) =>
  text(value)
    .replace(/[<>]/g, "")
    .replace(/url\s*\([^)]*\)/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/@import[^;]+;/gi, "");
const safeSandboxCss = (value) =>
  text(value)
    .replace(/<\/style/gi, "<\\/style")
    .replace(/@import[^;]+;/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/javascript:/gi, "");
const copyValue = async (value, onCopy) => {
  const payload = text(value);
  if (onCopy) {
    onCopy(payload);
    return;
  }
  if (navigator.clipboard) await navigator.clipboard.writeText(payload);
};
const downloadUrl = (url, name) => {
  if (!url) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name || url.split("/").pop() || "research-asset";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};
const downloadText = (content, name) => {
  const blob = new Blob([text(content)], { type: "text/plain;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  downloadUrl(href, name);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

function SectionHeading({ eyebrow, title, children, action }) {
  return (
    <div className="section-heading research-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}

function TextButton({ children, onClick, disabled, as = "button", href }) {
  if (as === "a") {
    return (
      <a className="text-command research-command" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <button className="text-command research-command" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function CodePanel({ label, textValue, onCopy, filename, wrap = false }) {
  return (
    <div className={`code-block research-code ${wrap ? "is-wrapped" : ""}`}>
      <div className="code-heading">
        <span>{label}</span>
        <div className="research-code-actions">
          <button onClick={() => copyValue(textValue, onCopy)}>Copy</button>
          {filename && <button onClick={() => downloadText(textValue, filename)}>Download</button>}
        </div>
      </div>
      <pre>
        <code>{textValue || "No captured text."}</code>
      </pre>
    </div>
  );
}

function EmptyState({ title, children }) {
  return (
    <div className="research-empty">
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}

function useManifest() {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: "",
    retryKey: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, status: "loading", error: "" }));
    fetch(MANIFEST_URL, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, status: "ready", data }));
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState((current) => ({
            ...current,
            status: "error",
            error: error.message || "Unable to load manifest",
          }));
        }
      });
    return () => controller.abort();
  }, [state.retryKey]);

  const retry = () =>
    setState((current) => ({ ...current, retryKey: current.retryKey + 1 }));
  return { ...state, retry };
}

function normalizeManifest(raw) {
  const pages = asArray(raw?.pages).map((page, index) => ({
    ...page,
    id: text(page?.id, `page-${index + 1}`),
    title: text(page?.title || page?.url, `Page ${index + 1}`),
    url: text(page?.url),
    status: text(page?.status, "unknown"),
    headings: asArray(page?.headings),
    controls: controlsFrom(page?.controls),
    states: asArray(page?.states),
    resources: asArray(page?.resources),
    svgIds: asArray(page?.svgIds),
    computed: Array.isArray(page?.computed)
      ? page.computed
      : isObject(page?.computed)
        ? Object.entries(page.computed).map(([selector, styles]) => ({ selector, styles }))
        : [],
  }));
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const hasSourceInventory = asArray(raw?.sourceInventory).length > 0;
  const resourceEntries = (
    hasSourceInventory
      ? asArray(raw?.sourceInventory)
      : [
          ...asArray(raw?.resources),
          ...pages.flatMap((page) =>
            page.resources.map((resource) => ({
              ...resource,
              pageIds: [...sourcePageIds(resource), page.id],
              pageTitle: page.title,
              pageUrl: page.url,
            })),
          ),
          ...asArray(raw?.sourceMaps).map((source) => ({
            ...source,
            kind: source?.kind || "map",
            pageIds: sourcePageIds(source),
          })),
        ]
  ).map((resource, index) => {
    const pageIds = sourcePageIds(resource);
    return {
      ...resource,
      id: text(resource?.id, `source-${index + 1}`),
      url: text(resource?.url),
      file: text(resource?.file || ""),
      kind: text(resource?.kind || sourceType(resource)),
      bytes: Number.isFinite(Number(resource?.bytes)) ? Number(resource.bytes) : undefined,
      sha256: text(resource?.sha256),
      provenance: sourceProvenance(resource),
      status: text(resource?.status, ""),
      pageIds,
      pageId: text(resource?.pageId || pageIds[0] || ""),
      pageTitle: sourcePageTitle(resource, pagesById),
      pageUrl: text(resource?.pageUrl),
      reason: text(resource?.reason),
      replacementFile: text(resource?.replacementFile),
      replacementReason: text(resource?.replacementReason),
    };
  });
  const uniqueResources = new Map();
  for (const resource of resourceEntries) {
    const key = hasSourceInventory
      ? resource.id || resource.file || resource.url
      : resource.file || resource.url || resource.id;
    const existing = uniqueResources.get(key);
    if (existing) {
      existing.pageIds = [...new Set([...existing.pageIds, ...resource.pageIds])];
      existing.pageTitle = [...new Set([existing.pageTitle, resource.pageTitle].filter(Boolean))].join(" · ");
      existing.bytes = existing.bytes ?? resource.bytes;
      existing.sha256 = existing.sha256 || resource.sha256;
    } else uniqueResources.set(key, resource);
  }
  const resources = [...uniqueResources.values()];
  const coverage = isObject(raw?.coverage)
    ? raw.coverage
    : {
        indexedFiles: resources.length,
        missingFiles: resources.filter((item) => sourceProvenance(item) === "unavailable").length,
        unresolvedResources: resources.filter((item) => sourceProvenance(item) === "unavailable").length,
        substitutions: resources.filter((item) => sourceProvenance(item) === "reconstructed").length,
        scope: raw?.scope,
      };
  return {
    capturedAt: text(raw?.capturedAt, "unknown"),
    browser: text(raw?.browser, "unknown"),
    pages,
    motionPages: asArray(raw?.motionPages),
    icons: asArray(raw?.icons).map((icon, index) => ({
      ...icon,
      id: text(icon?.id, `icon-${index + 1}`),
      label: text(icon?.label || icon?.id, `Icon ${index + 1}`),
      file: text(icon?.file),
      sourceUrl: text(icon?.sourceUrl),
    })),
    motions: asArray(raw?.motions).map((motion, index) => ({
      ...motion,
      id: text(motion?.id, `motion-${index + 1}`),
      name: text(motion?.name || motion?.id, `Motion ${index + 1}`),
      sourceUrl: text(motion?.sourceUrl),
      kind: text(motion?.kind, "css"),
      css: text(motion?.css),
      duration: text(motion?.duration),
      easing: text(motion?.easing),
      frames: asArray(motion?.frames),
      samples: asArray(motion?.samples),
    })),
    shapes: asArray(raw?.shapes).map((shape, index) => ({
      ...shape,
      id: text(shape?.id, `shape-${index + 1}`),
      selector: text(shape?.selector || shape?.id, `shape-${index + 1}`),
      sourceUrl: text(shape?.sourceUrl),
      styles: isObject(shape?.styles) ? shape.styles : {},
    })),
    resources,
    sourceMaps: asArray(raw?.sourceMaps),
    coverage,
    records: asArray(raw?.records),
    scrollStudies: asArray(raw?.scrollStudies),
    failures: asArray(raw?.failures),
    recoveredFailures: asArray(raw?.recoveredFailures),
  };
}

function buildLookups(data) {
  const pageByUrl = new Map();
  const pageById = new Map();
  const allSourcePages = [...new Map([...data.pages, ...asArray(data.motionPages)].map((page) => [page.id, page])).values()];
  allSourcePages.forEach((page) => {
    if (page.url) pageByUrl.set(page.url, page);
    if (page.id) pageById.set(page.id, page);
  });
  const sourcePages = [
    ["all", "All source pages"],
    ...allSourcePages.map((page) => [page.url || page.id, page.title]),
  ];
  const sourcePageFilters = [
    ["all", "All pages"],
    ...allSourcePages.map((page) => [page.id, page.title]),
  ];
  return { pageByUrl, pageById, sourcePages, sourcePageFilters };
}

function MetadataInspector({ item, label, onCopy }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="research-inspector" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{label || "Raw observed metadata"}</summary>
      <CodePanel
        label="JSON / captured metadata"
        textValue={readableJson(item)}
        onCopy={onCopy}
        filename="observed-metadata.json"
      />
    </details>
  );
}

function EvidenceLinks({ page }) {
  const links = [
    ["Desktop", page.desktopScreenshot],
    ["Mobile", page.mobileScreenshot],
  ].filter(([, href]) => href);
  if (!links.length) return <span className="research-muted">No screenshot links</span>;
  return (
    <div className="research-evidence-links">
      {links.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer">
          {label} evidence
        </a>
      ))}
    </div>
  );
}

function CoveragePanel({ data }) {
  const coverage = isObject(data.coverage) ? data.coverage : {};
  const captured = data.resources.filter((item) => sourceProvenance(item) === "captured").length;
  const local = data.resources.filter((item) => sourceProvenance(item) === "local").length;
  const reconstructed = data.resources.filter((item) => sourceProvenance(item) === "reconstructed").length;
  const unavailable = data.resources.filter((item) => sourceProvenance(item) === "unavailable").length;
  const indexed = Number.isFinite(Number(coverage.indexedFiles))
    ? Number(coverage.indexedFiles)
    : data.resources.length;
  const missing = Number.isFinite(Number(coverage.missingFiles))
    ? Number(coverage.missingFiles)
    : unavailable;
  const unresolved = Number.isFinite(Number(coverage.unresolvedResources))
    ? Number(coverage.unresolvedResources)
    : unavailable;
  const substitutions = Number.isFinite(Number(coverage.substitutions))
    ? Number(coverage.substitutions)
    : reconstructed;
  const substitutedResources = Number.isFinite(Number(coverage.substitutedResources))
    ? Number(coverage.substitutedResources)
    : substitutions;
  const substitutedInteractions = Number.isFinite(Number(coverage.substitutedInteractions))
    ? Number(coverage.substitutedInteractions)
    : 0;
  return (
    <div className="research-coverage-panel" aria-label="Source completeness summary">
      <div>
        <span className="eyebrow">SOURCE COMPLETENESS</span>
        <strong>{indexed} local files · {unavailable} unavailable original references</strong>
      </div>
      <div className="research-coverage-facts">
        <Fact label="Indexed files" value={indexed} />
        <Fact label="Captured/local" value={captured + local} />
        <Fact label="Source substitutes" value={substitutedResources} />
        <Fact label="Missing local files" value={missing} />
        <Fact label="Unavailable originals" value={unresolved} />
        {substitutedInteractions > 0 && <Fact label="Interaction substitutes" value={substitutedInteractions} />}
      </div>
      <div className="research-evidence-links">
        <a href="/research/completeness.json" target="_blank" rel="noreferrer">Completeness JSON</a>
        <a href="/research/substitutions.json" target="_blank" rel="noreferrer">Interaction substitutes</a>
        <a href="/research/resource-substitutions.json" target="_blank" rel="noreferrer">Resource substitutes</a>
        <a href="#reconstructions">Reconstructions</a>
      </div>
    </div>
  );
}

function PagesView({ data, onCopy }) {
  const [selectedId, setSelectedId] = useState(data.pages[0]?.id || "");
  const selected = data.pages.find((page) => page.id === selectedId) || data.pages[0];
  useEffect(() => {
    if (!data.pages.some((page) => page.id === selectedId)) {
      setSelectedId(data.pages[0]?.id || "");
    }
  }, [data.pages, selectedId]);

  return (
    <>
      <SectionHeading eyebrow="RESEARCH / PAGES" title="Page coverage">
        Coverage, captured controls, metadata, and evidence links from the source manifest.
      </SectionHeading>
      <CoveragePanel data={data} />
      {!data.pages.length ? (
        <EmptyState title="No pages captured">The manifest loaded, but it contains no page records.</EmptyState>
      ) : (
        <div className="research-split">
          <div className="research-table-wrap">
            <table className="research-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Status</th>
                  <th>Headings</th>
                  <th>Controls</th>
                  <th>States</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {data.pages.map((page) => (
                  <tr key={page.id} className={selected?.id === page.id ? "is-selected" : ""}>
                    <td>
                      <button onClick={() => setSelectedId(page.id)}>
                        <strong>{page.title}</strong>
                        <span>{page.url || "No URL"}</span>
                      </button>
                    </td>
                    <td><StatusPill value={page.status} /></td>
                    <td>{page.headings.length}</td>
                  <td>{page.controls.total}</td>
                    <td>{page.states.length}</td>
                    <td><EvidenceLinks page={page} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selected && (
            <aside className="research-detail">
              <span className="eyebrow">DETAIL INSPECTOR</span>
              <h3>{selected.title}</h3>
              <a href={selected.url} target="_blank" rel="noreferrer">{selected.url || "No source URL"}</a>
              <div className="research-detail-grid">
                <Fact label="SVG ids" value={selected.svgIds.length} />
                <Fact label="Resources" value={selected.resources.length} />
                <Fact label="Computed selectors" value={selected.computed.length} />
                <Fact label="Status" value={selected.status} />
              </div>
              <EvidenceLinks page={selected} />
              <div className="research-list-block">
                <strong>Sampled controls</strong>
                <a href="/research/dom-inventory.json" target="_blank" rel="noreferrer">All saved DOM headings and controls ↗</a>
                {selected.controls.items.length ? (
                  <ul>{selected.controls.items.slice(0, 10).map((control, index) => <li key={index}>{text(control?.label || control?.selector || control?.tag || control)}</li>)}</ul>
                ) : (
                  <span>No controls captured.</span>
                )}
              </div>
              <div className="research-list-block">
                <strong>Observed headings</strong>
                {selected.headings.length ? (
                  <ul>{selected.headings.slice(0, 12).map((heading, index) => <li key={index}>{text(heading?.text || heading)}</li>)}</ul>
                ) : (
                  <span>No headings captured.</span>
                )}
              </div>
              <MetadataInspector item={selected} onCopy={onCopy} />
            </aside>
          )}
        </div>
      )}
    </>
  );
}

function StatusPill({ value }) {
  const normalized = text(value || "unknown").toLowerCase();
  const good = ["ok", "success", "200", "captured", "ready"].includes(normalized);
  const bad = ["blocked", "error", "failed", "404", "500"].some((part) => normalized.includes(part));
  return <span className={`research-pill ${good ? "ok" : bad ? "bad" : ""}`}>{text(value, "unknown")}</span>;
}

function Fact({ label, value }) {
  return (
    <span className="research-fact">
      <b>{value}</b>
      <small>{label}</small>
    </span>
  );
}

function IconsView({ data, onCopy, lookups }) {
  const [query, setQuery] = useState("");
  const [pageFilter, setPageFilter] = useState("all");
  const [size, setSize] = useState(48);
  const [theme, setTheme] = useState("light");
  const [selectedId, setSelectedId] = useState(data.icons[0]?.id || "");
  const filtered = useMemo(
    () =>
      data.icons.filter((icon) => {
        const haystack = `${icon.id} ${icon.label} ${icon.file} ${icon.sourceUrl}`.toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const matchesPage = pageFilter === "all" || icon.sourceUrl === pageFilter;
        return matchesQuery && matchesPage;
      }),
    [data.icons, pageFilter, query],
  );
  const selected = filtered.find((icon) => icon.id === selectedId) || filtered[0] || data.icons[0];
  const selectedSource = useSourceText(selected);
  const sourceOptions = lookups.sourcePages.filter(([url]) =>
    url === "all" || data.icons.some((icon) => icon.sourceUrl === url),
  );

  return (
    <>
      <SectionHeading eyebrow="RESEARCH / ICONS" title="Icon gallery">
        Sanitized SVG assets are displayed as image files only, with copyable usage and download actions.
      </SectionHeading>
      <div className="research-toolbar">
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="label, id, file" />
        </label>
        <label>
          Source page
          <select value={pageFilter} onChange={(event) => setPageFilter(event.target.value)}>
            {sourceOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Size <output>{size}px</output>
          <input type="range" min="20" max="160" value={size} onChange={(event) => setSize(Number(event.target.value))} />
        </label>
        <div className="research-segment" role="group" aria-label="Preview theme">
          {["light", "dark", "checker"].map((value) => (
            <button key={value} aria-pressed={theme === value} onClick={() => setTheme(value)}>
              {titleCase(value)}
            </button>
          ))}
        </div>
      </div>
      {!data.icons.length ? (
        <EmptyState title="No icons captured">The manifest loaded, but no icon records are available.</EmptyState>
      ) : (
        <div className="research-gallery-layout">
          <div className="research-icon-grid">
            {filtered.map((icon) => (
              <button
                key={icon.id}
                className={selected?.id === icon.id ? "is-selected" : ""}
                onClick={() => setSelectedId(icon.id)}
              >
                <span className={`research-icon-preview ${theme}`} style={{ "--icon-size": `${size}px` }}>
                  {icon.file ? <img src={icon.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon.svg)}` : icon.file} alt="" loading="lazy" /> : <span>No file</span>}
                </span>
                <strong>{icon.label}</strong>
                <small>{icon.id}</small>
              </button>
            ))}
          </div>
          <aside className="research-detail">
            {selected ? (
              <>
                <span className="eyebrow">SELECTED ICON</span>
                <h3>{selected.label}</h3>
                <p>{selected.file || "No file path captured."}</p>
                <div className={`research-selected-icon ${theme}`} style={{ "--icon-size": `${Math.max(size, 88)}px` }}>
                  {selected.file && <img src={selected.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(selected.svg)}` : selected.file} alt={selected.label} />}
                </div>
                <div className="research-action-row">
                  <TextButton onClick={() => copyValue(`<img src="${selected.file}" alt="${selected.label}" />`, onCopy)}>Copy usage</TextButton>
                  <TextButton onClick={() => downloadUrl(selected.file, `${selected.id}.svg`)} disabled={!selected.file}>Download</TextButton>
                  {selected.sourceUrl && <TextButton as="a" href={selected.sourceUrl}>Source page</TextButton>}
                </div>
                <CodePanel
                  label="HTML / safe usage"
                  textValue={`<img src="${selected.file}" alt="${selected.label}" />`}
                  onCopy={onCopy}
                  filename={`${selected.id}.html`}
                />
                {extOf(selected.file) === "svg" && selectedSource.status === "loading" && (
                  <EmptyState title="Loading SVG source">Fetching sanitized SVG text for inspection.</EmptyState>
                )}
                {extOf(selected.file) === "svg" && selectedSource.status === "error" && (
                  <EmptyState title="Unable to read SVG source">{selectedSource.error}</EmptyState>
                )}
                {extOf(selected.file) === "svg" && selectedSource.status === "ready" && (
                  <CodePanel
                    label="SVG / actual captured source"
                    textValue={selectedSource.text}
                    onCopy={onCopy}
                    filename={`${selected.id}.svg`}
                  />
                )}
                <MetadataInspector item={selected} onCopy={onCopy} />
              </>
            ) : (
              <EmptyState title="No matching icon">Adjust the filters to inspect a captured icon.</EmptyState>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function normalizeStyleKey(key) {
  return text(key)
    .trim()
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    .replace(/^--+/, "--")
    .toLowerCase();
}

function safeStyle(styles) {
  return Object.fromEntries(
    Object.entries(styles || {})
      .map(([key, value]) => [normalizeStyleKey(key), safeCssValue(value)])
      .filter(([key, value]) => ALLOWED_STYLE_KEYS.has(key) && value.trim()),
  );
}

function stylesToCss(styles) {
  return Object.entries(safeStyle(styles))
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
}

function ShapePreview({ shape }) {
  const css = stylesToCss(shape.styles);
  const srcDoc = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;min-height:170px;display:grid;place-items:center;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,sans-serif}
.shape{box-sizing:border-box;min-width:48px;min-height:48px;max-width:180px;max-height:130px;background:#fff;border:1px solid #d2d2d7;${css}}
</style><div class="shape" aria-label="captured shape preview"></div>`;
  return <iframe className="research-sandbox-frame" title={`Shape preview ${shape.id}`} sandbox="" srcDoc={srcDoc} />;
}

function ShapesView({ data, onCopy }) {
  const [selectedId, setSelectedId] = useState(data.shapes[0]?.id || "");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const selected = data.shapes.find((shape) => shape.id === selectedId) || data.shapes[0];
  const pageCount = Math.max(1, Math.ceil(data.shapes.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleShapes = data.shapes.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );

  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  return (
    <>
      <SectionHeading
        eyebrow="RESEARCH / SHAPES"
        title="Measured geometry"
        action={
          data.shapes.length > 12 && (
            <div className="research-pager">
              <select
                aria-label="Shapes per page"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(0);
                }}
              >
                <option value="12">12</option>
                <option value="24">24</option>
              </select>
              <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0}>
                Prev
              </button>
              <span>
                {currentPage + 1} / {pageCount}
              </span>
              <button onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1}>
                Next
              </button>
            </div>
          )
        }
      >
        Captured geometry is rendered from an allowlisted CSS subset inside inert sandbox frames.
      </SectionHeading>
      {!data.shapes.length ? (
        <EmptyState title="No shapes captured">The manifest loaded, but no shape records are available.</EmptyState>
      ) : (
        <div className="research-gallery-layout">
          <div className="research-shape-grid">
            {visibleShapes.map((shape) => (
              <button key={shape.id} className={selected?.id === shape.id ? "is-selected" : ""} onClick={() => setSelectedId(shape.id)}>
                <ShapePreview shape={shape} />
                <strong>{shape.selector}</strong>
                <small>{Object.keys(safeStyle(shape.styles)).length} styles</small>
              </button>
            ))}
          </div>
          <aside className="research-detail">
            {selected && (
              <>
                <span className="eyebrow">SHAPE CSS</span>
                <h3>{selected.selector}</h3>
                {selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceUrl}</a>}
                <ShapePreview shape={selected} />
                <CodePanel
                  label="CSS / measured style subset"
                  textValue={`.observed-shape {\n${stylesToCss(selected.styles) || "  /* No allowlisted style values captured. */"}\n}`}
                  onCopy={onCopy}
                  filename={`${selected.id}.css`}
                />
                <MetadataInspector item={selected} onCopy={onCopy} />
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function hasKeyframes(css) {
  return /@(-webkit-)?keyframes\s+[a-z0-9_-]+/i.test(text(css));
}

function keyframeName(css) {
  const match = text(css).match(/@(?:-webkit-)?keyframes\s+([a-zA-Z0-9_-]+)/);
  return match?.[1] || "";
}

function motionTiming(motion) {
  const rawDuration = text(motion.duration).trim();
  const durationMatch = rawDuration.match(/^(\d+(?:\.\d+)?)(ms|s)?$/i);
  const duration = durationMatch
    ? `${durationMatch[1]}${durationMatch[2] || "ms"}`
    : "900ms";
  const measured = Boolean(durationMatch);
  const easing = text(motion.easing, "ease").replace(/[;{}<>]/g, "") || "ease";
  return { duration, easing, measured };
}

function MotionPreview({ motion, nonce }) {
  if (!hasKeyframes(motion.css)) {
    return (
      <div className="research-static-preview">
        <span>No extracted keyframes</span>
      </div>
    );
  }
  const css = safeSandboxCss(motion.css);
  const name = keyframeName(css);
  const timing = motionTiming(motion);
  const srcDoc = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;min-height:180px;display:grid;place-items:center;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,sans-serif;overflow:hidden}
.stage{width:72%;height:88px;display:grid;place-items:center;color:#1d1d1f}
.target{width:78px;height:78px;border-radius:18px;background:#fff;border:1px solid #d2d2d7;box-shadow:0 12px 30px rgba(0,0,0,.08);display:grid;place-items:center;animation:${name} ${timing.duration} ${timing.easing} both}
@media (prefers-reduced-motion: reduce){.target{animation:none}}
${css}
</style><div class="stage"><div class="target">Replay ${nonce}</div></div>`;
  return (
    <>
      <iframe className="research-sandbox-frame" title={`Motion replay ${motion.id}`} sandbox="" srcDoc={srcDoc} />
      <span className="research-preview-note">
        {timing.measured ? `Measured timing: ${timing.duration}` : `Preview timing: ${timing.duration} fallback, not measured`}
      </span>
    </>
  );
}

function TimelineFrames({ frames, samples }) {
  const actualFrames = asArray(frames);
  const sampleFrames = asArray(samples);
  const elapsedLabel = (frame, index) => {
    const value = frame?.elapsedMs ?? frame?.elapsed ?? frame?.timeMs ?? frame?.time ?? frame?.t ?? frame?.progress ?? index;
    return Number.isFinite(Number(value)) ? `${value}ms` : text(value);
  };
  const frameSummary = (frame) => {
    if (!isObject(frame)) return text(frame);
    const animated =
      frame.animatedCount ?? (Array.isArray(frame.animated) ? frame.animated.length : asArray(frame.targets).length);
    const styles = frame.targetStyles || frame.target?.styles || frame.styles || frame.computed || {};
    const styleSummary = isObject(styles)
      ? Object.entries(styles)
          .slice(0, 4)
          .map(([key, value]) => `${normalizeStyleKey(key)}: ${text(value)}`)
          .join("; ")
      : text(styles);
    return compact([
      animated !== "" ? `${animated} animated` : "",
      text(frame.selector || frame.target || frame.label),
      styleSummary,
    ]).join(" / ");
  };
  const sampleSummary = (sample) => {
    if (!isObject(sample)) return text(sample);
    return compact([
      text(sample.selector || sample.target || sample.label),
      text(sample.value || sample.state),
      isObject(sample.styles)
        ? Object.entries(sample.styles)
            .slice(0, 3)
            .map(([key, value]) => `${normalizeStyleKey(key)}: ${text(value)}`)
            .join("; ")
        : "",
    ]).join(" / ");
  };
  if (!actualFrames.length && !sampleFrames.length) {
    return <EmptyState title="No timeline values">No captured frames or scroll samples were recorded.</EmptyState>;
  }
  return (
    <div className="research-timeline">
      {actualFrames.length > 0 && (
        <div>
          <strong>Actual captured frames</strong>
          <div className="research-frame-row">
            {actualFrames.slice(0, 24).map((frame, index) => (
              <span key={index}>
                <b>{elapsedLabel(frame, index)}</b>
                <small>{frameSummary(frame)}</small>
              </span>
            ))}
          </div>
        </div>
      )}
      {sampleFrames.length > 0 && (
        <div>
          <strong>Scroll study samples</strong>
          <div className="research-frame-row sample">
            {sampleFrames.slice(0, 24).map((sample, index) => (
              <span key={index}>
                <b>{text(sample?.scrollY ?? sample?.time ?? sample?.progress ?? index)}</b>
                <small>{sampleSummary(sample)}</small>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MotionsView({ data, onCopy }) {
  const firstPlayable = data.motions.find((motion) => hasKeyframes(motion.css));
  const [selectedId, setSelectedId] = useState(
    firstPlayable?.id || data.motions[0]?.id || "",
  );
  const [nonce, setNonce] = useState(1);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const filtered = useMemo(
    () =>
      data.motions.filter((motion) => {
        const haystack = `${motion.id} ${motion.name} ${motion.kind} ${motion.sourceUrl} ${motion.duration} ${motion.easing}`.toLowerCase();
        return haystack.includes(query.trim().toLowerCase());
      }),
    [data.motions, query],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleMotions = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );
  const selected =
    filtered.find((motion) => motion.id === selectedId) ||
    filtered[0];

  useEffect(() => {
    if (!data.motions.some((motion) => motion.id === selectedId)) {
      setSelectedId(firstPlayable?.id || data.motions[0]?.id || "");
    }
  }, [data.motions, firstPlayable?.id, selectedId]);
  useEffect(() => {
    setPage(0);
  }, [query, pageSize]);
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  return (
    <>
      <SectionHeading eyebrow="RESEARCH / MOTION" title="Observed motions">
        Real extracted CSS rules are listed as captured. Replay is available only when keyframes exist in the source CSS.
      </SectionHeading>
      <div className="research-toolbar research-motion-toolbar">
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="motion, selector, source" />
        </label>
        <label>
          Motions per page
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            {SOURCE_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </div>
      <div className="research-result-bar">
        <span>
          Showing {filtered.length ? currentPage * pageSize + 1 : 0}-{Math.min(filtered.length, (currentPage + 1) * pageSize)} of {filtered.length} matched motions / {data.motions.length} total
        </span>
        <div className="research-pager">
          <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0}>
            Prev
          </button>
          <span>{currentPage + 1} / {pageCount}</span>
          <button onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1}>
            Next
          </button>
        </div>
      </div>
      {!data.motions.length ? (
        <EmptyState title="No motions captured">The manifest loaded, but no motion records are available.</EmptyState>
      ) : (
        <div className="research-split">
          <div className="research-motion-list">
            {visibleMotions.map((motion) => (
              <button key={motion.id} className={selected?.id === motion.id ? "is-selected" : ""} onClick={() => setSelectedId(motion.id)}>
                <span>
                  <strong>{motion.name}</strong>
                  <small>{compact([motion.kind, motion.duration, motion.easing]).join(" / ") || "Captured CSS"}</small>
                </span>
                <StatusPill value={hasKeyframes(motion.css) ? "keyframes" : "rule only"} />
              </button>
            ))}
            {!visibleMotions.length && (
              <EmptyState title="No matching motions">Adjust the search to inspect captured motion rules.</EmptyState>
            )}
          </div>
          <aside className="research-detail">
            {selected && (
              <>
                <span className="eyebrow">MOTION REPLAY</span>
                <h3>{selected.name}</h3>
                {selected.sourceUrl && <a href={selected.sourceUrl} target="_blank" rel="noreferrer">{selected.sourceUrl}</a>}
                <MotionPreview motion={selected} nonce={nonce} />
                <TimelineFrames frames={selected.frames} samples={selected.samples} />
                <div className="research-action-row">
                  <TextButton onClick={() => setNonce((value) => value + 1)} disabled={!hasKeyframes(selected.css)}>Replay keyframes</TextButton>
                  <TextButton onClick={() => copyValue(selected.css, onCopy)}>Copy CSS</TextButton>
                </div>
                <CodePanel label="CSS / observed rule" textValue={selected.css} onCopy={onCopy} filename={`${selected.id}.css`} />
                <MetadataInspector item={selected} onCopy={onCopy} />
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function StatesView({ data, onCopy }) {
  const stateStatus = (state) => text(state?.status || state?.state || state?.name || state?.type || state, "unknown");
  const isCapturedState = (state) => {
    const status = text(state?.status).toLowerCase();
    return state?.captured === true || status === "captured" || status === "ok";
  };
  const pageRows = data.pages.flatMap((page) => {
    const states = page.states.length ? page.states : page.controls.items.map((control) => ({ control, state: "untested" }));
    return states.map((state, index) => ({
      id: `${page.id}-${index}`,
      page,
      state,
      captured: isCapturedState(state),
    }));
  });
  const recordRows = pageRows.length
    ? []
    : data.records.map((state, index) => ({
        id: `record-${text(state?.id, index)}`,
        page: { title: text(state?.name || state?.sourceUrl, "Interaction lab"), url: text(state?.sourceUrl) },
        state,
        captured: isCapturedState(state),
      }));
  const rows = [...pageRows, ...recordRows];
  const [selectedId, setSelectedId] = useState(rows[0]?.id || "");
  const selected = rows.find((row) => row.id === selectedId) || rows[0];
  useEffect(() => {
    if (!rows.some((row) => row.id === selectedId)) setSelectedId(rows[0]?.id || "");
  }, [rows, selectedId]);

  return (
    <>
      <SectionHeading eyebrow="RESEARCH / INTERACTIONS" title="Interaction states">
        Captured and untested states are separated so missing evidence stays visible.
      </SectionHeading>
      {!rows.length ? (
        <EmptyState title="No interaction states">No states or controls were recorded in the manifest.</EmptyState>
      ) : (
        <div className="research-split">
          <div className="research-table-wrap">
            <table className="research-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Control</th>
                  <th>State</th>
                  <th>Evidence</th>
                  <th>Captured</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ id, page, state, captured }) => (
                  <tr key={id} className={selected?.id === id ? "is-selected" : ""}>
                    <td>
                      <button onClick={() => setSelectedId(id)}>
                        <strong>{page.title}</strong>
                        <span>{page.url}</span>
                      </button>
                    </td>
                    <td>{text(state?.control?.label || state?.label || state?.control || state?.selector || state?.target, "unknown")}</td>
                    <td>{stateStatus(state)}</td>
                    <td>
                      <div className="research-evidence-links">
                        {state?.beforeScreenshot && <a href={state.beforeScreenshot} target="_blank" rel="noreferrer">Before</a>}
                        {state?.afterScreenshot && <a href={state.afterScreenshot} target="_blank" rel="noreferrer">After</a>}
                        {state?.file && <a href={state.file} target="_blank" rel="noreferrer">JSON</a>}
                        {!state?.beforeScreenshot && !state?.afterScreenshot && !state?.file && <EvidenceLinks page={page} />}
                      </div>
                    </td>
                    <td><StatusPill value={captured ? "captured" : stateStatus(state)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="research-detail">
            {selected && (
              <>
                <span className="eyebrow">STATE INSPECTOR</span>
                <h3>{text(selected.state?.name || selected.state?.label || selected.state?.selector || selected.page.title)}</h3>
                <p>{text(selected.state?.selector || selected.state?.sourceUrl || selected.page.url)}</p>
                <div className="research-detail-grid">
                  <Fact label="Status" value={selected.captured ? "captured" : stateStatus(selected.state)} />
                  <Fact label="Frames" value={asArray(selected.state?.frames).length} />
                  <Fact label="Before" value={selected.state?.beforeScreenshot ? "yes" : "no"} />
                  <Fact label="After" value={selected.state?.afterScreenshot ? "yes" : "no"} />
                </div>
                <div className="research-evidence-links">
                  {selected.state?.beforeScreenshot && <a href={selected.state.beforeScreenshot} target="_blank" rel="noreferrer">Open before screenshot</a>}
                  {selected.state?.afterScreenshot && <a href={selected.state.afterScreenshot} target="_blank" rel="noreferrer">Open after screenshot</a>}
                  {selected.state?.file && <a href={selected.state.file} target="_blank" rel="noreferrer">Open state JSON</a>}
                </div>
                <TimelineFrames frames={selected.state?.frames} />
                <MetadataInspector item={selected.state} onCopy={onCopy} />
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function useSourceText(selected) {
  const [state, setState] = useState({ status: "idle", key: "", text: "", error: "" });
  useEffect(() => {
    const key = sourceKey(selected);
    const type = sourceType(selected);
    if (!selected?.file || sourceProvenance(selected) === "unavailable") {
      setState({ status: "idle", key, text: "", error: "" });
      return undefined;
    }
    if (!isTextSource(selected)) {
      setState({
        status: "blocked",
        key,
        text: "",
        error: "Binary or media sources are listed only as files and are not fetched as text.",
      });
      return undefined;
    }
    const controller = new AbortController();
    setState({ status: "loading", key, text: "", error: "" });
    fetch(selected.file, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const contentType = response.headers.get("content-type") || "";
        if (type !== "html" && contentType.includes("text/html")) {
          throw new Error("Server returned HTML instead of the requested source file.");
        }
        return response.text();
      })
      .then((body) => {
        if (!controller.signal.aborted) setState({ status: "ready", key, text: body, error: "" });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ status: "error", key, text: "", error: error.message || "Unable to fetch source" });
        }
      });
    return () => controller.abort();
  }, [selected?.file]);
  return state;
}

function SourcesView({ data, onCopy, lookups }) {
  const [type, setType] = useState("all");
  const [pageFilter, setPageFilter] = useState("all");
  const [provenance, setProvenance] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [wrap, setWrap] = useState(false);
  const filtered = useMemo(
    () =>
      data.resources.filter((resource) => {
        const currentType = sourceType(resource);
        const matchesType = type === "all" || currentType === type;
        const matchesPage = pageFilter === "all" || sourcePageIds(resource).includes(pageFilter);
        const matchesProvenance = provenance === "all" || sourceProvenance(resource) === provenance;
        const haystack = `${resource.id} ${resource.url} ${resource.file} ${resource.kind} ${resource.pageTitle} ${resource.reason} ${resource.replacementFile} ${resource.replacementReason}`.toLowerCase();
        return matchesType && matchesPage && matchesProvenance && haystack.includes(query.trim().toLowerCase());
      }),
    [data.resources, pageFilter, provenance, query, type],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleResources = filtered.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize,
  );
  const [selectedKey, setSelectedKey] = useState("");
  const selected = filtered.find((resource) => sourceKey(resource) === selectedKey) || filtered[0];
  const sourceText = useSourceText(selected);
  const loadedSelectedText = sourceText.key === sourceKey(selected) ? sourceText : { status: "loading", text: "", error: "" };
  useEffect(() => {
    setPage(0);
  }, [pageFilter, provenance, query, type, pageSize]);
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
  useEffect(() => {
    if (selected) setSelectedKey(sourceKey(selected));
  }, [selected?.id, selected?.file, selected?.url]);

  return (
    <>
      <SectionHeading
        eyebrow="RESEARCH / SOURCES"
        title="Source explorer"
        action={<TextButton as="a" href="/research-source-kit.tar.gz">Download source kit</TextButton>}
      >
        CSS, JS, HTML, JSON, and map files are fetched as readable text for inspection only.
      </SectionHeading>
      <div className="research-toolbar">
        <label>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="file, url, page" />
        </label>
        <label>
          File type
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {SOURCE_TYPES.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </label>
        <label>
          Source page
          <select value={pageFilter} onChange={(event) => setPageFilter(event.target.value)}>
            {lookups.sourcePageFilters.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Provenance
          <select value={provenance} onChange={(event) => setProvenance(event.target.value)}>
            {SOURCE_PROVENANCE.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </label>
      </div>
      <div className="research-result-bar">
        <span>
          Showing {filtered.length ? currentPage * pageSize + 1 : 0}-{Math.min(filtered.length, (currentPage + 1) * pageSize)} of {filtered.length} matched sources / {data.resources.length} total
        </span>
        <label>
          <input type="checkbox" checked={wrap} onChange={(event) => setWrap(event.target.checked)} />
          Wrap lines
        </label>
        <div className="research-pager">
          <select
            aria-label="Sources per page"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {SOURCE_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0}>
            Prev
          </button>
          <span>{currentPage + 1} / {pageCount}</span>
          <button onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} disabled={currentPage >= pageCount - 1}>
            Next
          </button>
        </div>
      </div>
      {!data.resources.length ? (
        <EmptyState title="No source files">The manifest loaded, but no resources or source maps were listed.</EmptyState>
      ) : (
        <div className="research-source-layout">
          <div className="research-source-list">
            {visibleResources.map((resource) => {
              const key = sourceKey(resource);
              return (
                <button key={key} className={selectedKey === key ? "is-selected" : ""} onClick={() => setSelectedKey(key)}>
                  <span>
                    <strong>{filenameOf(resource.file || resource.url)}</strong>
                    <small>{resource.file || resource.url || "No path available"}</small>
                  </span>
                  <small>{compact([sourceType(resource).toUpperCase(), formatBytes(resource.bytes), sourceProvenance(resource), resource.replacementFile ? "replacement available" : "", resource.pageTitle]).join(" / ")}</small>
                </button>
              );
            })}
            {!visibleResources.length && (
              <EmptyState title="No matching source">Adjust the filters to inspect captured source files.</EmptyState>
            )}
          </div>
          <aside className="research-source-reader">
            {selected ? (
              <>
                <div className="research-source-meta">
                  <span className="eyebrow">{sourceType(selected).toUpperCase()} / {sourceProvenance(selected).toUpperCase()}</span>
                  <h3>{filenameOf(selected.file || selected.url)}</h3>
                  <p>{selected.file || "No local source path captured."}</p>
                  {selected.url && <a href={selected.url} target="_blank" rel="noreferrer">{selected.url}</a>}
                </div>
                <div className="research-source-stats">
                  <StatusPill value={sourceProvenance(selected)} />
                  {formatBytes(selected.bytes) && <span>{formatBytes(selected.bytes)}</span>}
                  {selected.sha256 && <span title={selected.sha256}>SHA-256 {selected.sha256.slice(0, 12)}</span>}
                  {selected.pageTitle && <span>{selected.pageTitle}</span>}
                </div>
                {selected.reason && <EmptyState title="Source note">{selected.reason}</EmptyState>}
                {selected.replacementFile && (
                  <div className="research-replacement">
                    <strong>Replacement source</strong>
                    <a href={selected.replacementFile} target="_blank" rel="noreferrer">{selected.replacementFile}</a>
                    {selected.replacementReason && <span>{selected.replacementReason}</span>}
                    <div className="research-action-row">
                      <TextButton as="a" href={selected.replacementFile}>Open replacement</TextButton>
                      <TextButton onClick={() => downloadUrl(selected.replacementFile, filenameOf(selected.replacementFile))}>Download replacement</TextButton>
                    </div>
                  </div>
                )}
                {loadedSelectedText.status === "loading" && <EmptyState title="Loading source">Fetching text without executing it.</EmptyState>}
                {loadedSelectedText.status === "blocked" && <EmptyState title="Text preview unavailable">{loadedSelectedText.error}</EmptyState>}
                {loadedSelectedText.status === "idle" && <EmptyState title="Source unavailable">No local text source is available for this inventory entry.</EmptyState>}
                {loadedSelectedText.status === "error" && <EmptyState title="Unable to read source">{loadedSelectedText.error}</EmptyState>}
                {loadedSelectedText.status === "ready" && (
                  <CodePanel
                    label={`SOURCE / ${sourceType(selected).toUpperCase()}`}
                    textValue={loadedSelectedText.text}
                    onCopy={onCopy}
                    filename={(selected.file || "source.txt").split("/").pop()}
                    wrap={wrap}
                  />
                )}
                <MetadataInspector item={selected} onCopy={onCopy} />
              </>
            ) : (
              <EmptyState title="No matching source">Adjust the filters to inspect captured source files.</EmptyState>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function ResearchBody({ view, data, onCopy }) {
  const lookups = useMemo(() => buildLookups(data), [data]);
  if (view === "icons") return <IconsView data={data} onCopy={onCopy} lookups={lookups} />;
  if (view === "shapes") return <ShapesView data={data} onCopy={onCopy} />;
  if (view === "observed-motion") return <MotionsView data={data} onCopy={onCopy} />;
  if (view === "interaction-states") return <StatesView data={data} onCopy={onCopy} />;
  if (view === "research-sources") return <SourcesView data={data} onCopy={onCopy} lookups={lookups} />;
  return <PagesView data={data} onCopy={onCopy} />;
}

export function Research({ view = "pages", onCopy }) {
  const manifest = useManifest();
  const selectedView = VIEWS[view] ? view : "pages";
  const data = useMemo(
    () => normalizeManifest(manifest.data || {}),
    [manifest.data],
  );

  return (
    <div className={`research-surface research-view-${selectedView}`}>
      <div className="research-summary">
        <div>
          <span className="eyebrow">
            SOURCE RESEARCH <span className="version">{data.capturedAt}</span>
          </span>
          <h1>Apple source library</h1>
        </div>
        <div className="research-kpis">
          <Fact label="Pages" value={data.pages.length} />
          <Fact label="Icons" value={data.icons.length} />
          <Fact label="Shapes" value={data.shapes.length} />
          <Fact label="Sources" value={data.resources.length} />
        </div>
      </div>

      {manifest.status === "loading" && (
        <EmptyState title="Loading source library" />
      )}
      {manifest.status === "error" && (
        <div className="research-error">
          <strong>Research manifest unavailable</strong>
          <span>{manifest.error}</span>
          <TextButton onClick={manifest.retry}>Retry</TextButton>
        </div>
      )}
      {manifest.status === "ready" && (
        <>
          {data.failures.length > 0 && (
            <details className="research-failures">
              <summary>{data.failures.length} capture failures recorded</summary>
              <CodePanel label="JSON / failures" textValue={readableJson(data.failures)} onCopy={onCopy} filename="research-failures.json" />
            </details>
          )}
          {data.recoveredFailures.length > 0 && (
            <details className="research-inspector">
              <summary>{data.recoveredFailures.length} original resources recovered after retry</summary>
              <CodePanel label="JSON / recovered public resources" textValue={readableJson(data.recoveredFailures)} onCopy={onCopy} filename="recovered-resources.json" />
            </details>
          )}
          <ResearchBody view={selectedView} data={data} onCopy={onCopy} />
        </>
      )}
    </div>
  );
}

export default Research;
