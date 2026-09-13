import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CATALOG_URL,
  KIND_VALUES,
  PAGE_SIZE_OPTIONS,
  RUNTIME_URL,
  STATUS_VALUES,
  TRIGGER_VALUES,
  VIEWPORT_VALUES,
  asArray,
  compact,
  countRuntime,
  filterRecords,
  hasChangingPreviewKeyframes,
  isObject,
  normalizeCatalog,
  normalizeRuntime,
  rejectHtmlFallback,
  text,
  titleCase,
} from "./motionData.mjs";
import "./motion-library.css";

function useJsonResource(url, normalize) {
  const [state, setState] = useState({
    status: "loading",
    data: normalize({}),
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, status: "loading", error: "" }));
    fetch(url, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        rejectHtmlFallback(response, url);
        return response.json();
      })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({ status: "ready", data: normalize(payload), error: "" });
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({
            status: "error",
            data: normalize({}),
            error: error.message || `Unable to load ${url}`,
          });
        }
      });

    return () => controller.abort();
  }, [url, normalize]);

  return state;
}

function useRuntimeDetail(record) {
  const [state, setState] = useState({
    status: "idle",
    key: "",
    data: null,
    error: "",
  });

  useEffect(() => {
    const key = record?.id || "";
    if (!record?.file) {
      setState({ status: "idle", key, data: null, error: "" });
      return undefined;
    }

    const controller = new AbortController();
    setState({ status: "loading", key, data: null, error: "" });
    fetch(record.file, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        rejectHtmlFallback(response, record.file);
        return response.json();
      })
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({ status: "ready", key, data: payload, error: "" });
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({
            status: "error",
            key,
            data: null,
            error: error.message || "Unable to load runtime detail JSON",
          });
        }
      });

    return () => controller.abort();
  }, [record?.file, record?.id]);

  return state;
}

function copyValue(value, onCopy) {
  const payload = text(value);
  if (onCopy) {
    onCopy(payload);
    return;
  }

  navigator.clipboard?.writeText(payload);
}

function downloadText(content, filename) {
  const href = URL.createObjectURL(new Blob([text(content)], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function SectionHeading({ eyebrow, title, children, action }) {
  return (
    <div className="section-heading motion-library-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, children }) {
  return (
    <div className="motion-empty">
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </div>
  );
}

function Fact({ value, label }) {
  return (
    <span className="motion-fact">
      <b>{value}</b>
      <small>{label}</small>
    </span>
  );
}

function StatusPill({ value }) {
  const normalized = text(value).toLowerCase();
  const tone = normalized === "observed" || normalized === "source-only"
    ? "ok"
    : normalized === "blocked"
      ? "bad"
      : normalized === "skipped"
        ? "skip"
      : "";
  return <span className={`motion-pill ${tone}`}>{text(value, "unknown")}</span>;
}

function CodePanel({ label, value, filename, onCopy }) {
  return (
    <div className="motion-code">
      <div className="motion-code-heading">
        <span>{label}</span>
        <div>
          <button onClick={() => copyValue(value, onCopy)}>Copy</button>
          {filename && <button onClick={() => downloadText(value, filename)}>Download</button>}
        </div>
      </div>
      <pre>
        <code>{value || "No source text captured."}</code>
      </pre>
    </div>
  );
}

function isImageSource(value) {
  const src = text(value).trim();
  if (!src) return false;
  if (src.startsWith("data:image/")) return true;
  return /\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#].*)?$/i.test(src);
}

function screenshotSource(value) {
  if (!value) return "";
  if (typeof value === "string") return isImageSource(value) ? value : "";
  if (typeof value === "object") {
    const explicit = text(value.screenshot || value.image).trim();
    if (explicit) return explicit;
    const candidate = text(value.file || value.url || value.src).trim();
    return isImageSource(candidate) ? candidate : "";
  }
  return "";
}

function EvidenceThumbnails({ record }) {
  const before = screenshotSource(record?.before);
  const after = screenshotSource(record?.after);
  const items = [
    ["Before", before],
    ["After", after],
  ].filter(([, src]) => src);

  if (!items.length) return null;

  return (
    <div className="motion-evidence-thumbs" aria-label="Original captured state screenshots">
      <strong>Original captured states</strong>
      <div>
        {items.map(([label, src]) => (
          <a key={label} href={src} target="_blank" rel="noreferrer">
            <img src={src} alt={`${label} original captured state for ${text(record?.label, "motion")}`} loading="lazy" />
            <span>{label} original</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function SelectFilter({ label, value, values, onChange }) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {values.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function MotionFilters({
  pages,
  filters,
  onFilters,
  mode,
  resultCount,
  totalCount,
  page,
  pageCount,
  pageSize,
  onPage,
  onPageSize,
}) {
  const pageOptions = [
    ["all", "All pages"],
    ...pages.map((item) => [item.id, item.title]),
  ];
  return (
    <>
      <div className="motion-filter-grid">
        <label className="motion-search">
          Search
          <input
            value={filters.query}
            onChange={(event) => onFilters({ query: event.target.value })}
            placeholder="page, trigger, selector, source"
          />
        </label>
        <SelectFilter label="Page" value={filters.page} values={pageOptions} onChange={(value) => onFilters({ page: value })} />
        <SelectFilter label="Device" value={filters.viewport} values={VIEWPORT_VALUES.map((value) => [value, titleCase(value)])} onChange={(value) => onFilters({ viewport: value })} />
        <SelectFilter label="Trigger" value={filters.trigger} values={TRIGGER_VALUES.map((value) => [value, titleCase(value)])} onChange={(value) => onFilters({ trigger: value })} />
        <SelectFilter label="Type" value={filters.kind} values={KIND_VALUES.map((value) => [value, titleCase(value)])} onChange={(value) => onFilters({ kind: value })} />
        {mode === "runtime" && (
          <SelectFilter label="Status" value={filters.status} values={STATUS_VALUES.map((value) => [value, value === "playable" ? "Playable motions" : titleCase(value)])} onChange={(value) => onFilters({ status: value })} />
        )}
      </div>
      <div className="motion-result-row">
        <span>
          Showing {resultCount ? page * pageSize + 1 : 0}-{Math.min(resultCount, (page + 1) * pageSize)} of {resultCount} matched / {totalCount} total
        </span>
        <div className="motion-pager">
          <select aria-label="Motions per page" value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))}>
            {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <button onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0}>Prev</button>
          <span>{page + 1} / {pageCount}</span>
          <button onClick={() => onPage(Math.min(pageCount - 1, page + 1))} disabled={page >= pageCount - 1}>Next</button>
        </div>
      </div>
    </>
  );
}

function RuntimeList({ records, selectedId, onSelect }) {
  if (!records.length) {
    return <EmptyState title="No matching runtime records">Adjust filters to inspect captured attempts.</EmptyState>;
  }

  return (
    <div className="motion-record-list">
      {records.map((record) => (
        <button
          key={record.id}
          className={selectedId === record.id ? "is-selected" : ""}
          onClick={() => onSelect(record.id)}
        >
          <span>
            <strong>{record.label}</strong>
            <small>{compact([record.pageTitle, record.viewport, record.selector]).join(" / ")}</small>
          </span>
          <span>
            <StatusPill value={record.status} />
            <small>{compact([record.trigger, record.kind, `${record.trackCount ?? record.tracks.length} tracks`, record.playableTrackCount !== undefined ? `${record.playableTrackCount} playable` : ""]).join(" / ")}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function CatalogList({ records, selectedId, onSelect }) {
  if (!records.length) {
    return <EmptyState title="No matching declarations">Adjust filters to inspect source declarations.</EmptyState>;
  }

  return (
    <div className="motion-record-list">
      {records.map((record) => (
        <button
          key={record.id}
          className={selectedId === record.id ? "is-selected" : ""}
          onClick={() => onSelect(record.id)}
        >
          <span>
            <strong>{record.label}</strong>
            <small>{compact([record.pageTitles.join(" · "), record.selector, record.file]).join(" / ")}</small>
          </span>
          <span>
            <StatusPill value={record.status} />
            <small>{compact([record.trigger, record.kind]).join(" / ")}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function MotionReplay({ record }) {
  const prefersReduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [iteration, setIteration] = useState(0);
  const [trackPage, setTrackPage] = useState(0);
  const animationRefs = useRef([]);
  const targetRefs = useRef([]);
  const playableTracks = useMemo(
    () => record?.tracks?.filter((track) => track.keyframes.length > 1 && hasChangingPreviewKeyframes(track)) || [],
    [record?.id, record?.tracks],
  );
  const isScroll = record?.trigger === "scroll" || record?.kind === "scroll";
  const tracksPerPage = 8;
  const trackPageCount = Math.max(1, Math.ceil(playableTracks.length / tracksPerPage));
  const currentTrackPage = Math.min(trackPage, trackPageCount - 1);
  const visibleTracks = useMemo(
    () => playableTracks.slice(currentTrackPage * tracksPerPage, currentTrackPage * tracksPerPage + tracksPerPage),
    [currentTrackPage, playableTracks],
  );
  const provenance = playableTracks
    .map((track) => track.timingProvenance || track.source)
    .filter(Boolean)[0];
  const seekAnimations = (nextProgress) => {
    animationRefs.current.forEach((animation, index) => {
      if (!animation) return;
      const track = visibleTracks[index];
      if (!track) return;
      animation.pause();
      animation.currentTime = Math.max(0, Math.min(1, nextProgress)) * Math.max(1, track.timing.duration);
    });
  };
  const freezeAtCurrentTime = () => {
    const first = animationRefs.current.find(Boolean);
    if (first) {
      const duration = Number(first.effect?.getTiming?.().duration) || visibleTracks[0]?.timing.duration || 1;
      const nextProgress = Math.max(0, Math.min(1, Number(first.currentTime || 0) / duration));
      setProgress(nextProgress);
    }
    animationRefs.current.forEach((animation) => animation?.pause());
  };

  useEffect(() => {
    setTrackPage(0);
    setProgress(0);
    setPlaying(false);
  }, [record?.id]);

  useEffect(() => {
    if (trackPage > trackPageCount - 1) setTrackPage(trackPageCount - 1);
  }, [trackPage, trackPageCount]);

  useEffect(() => {
    animationRefs.current.forEach((animation) => animation?.cancel());
    animationRefs.current = [];
    if (!visibleTracks.length) {
      return undefined;
    }

    animationRefs.current = visibleTracks.map((track, index) => {
      const node = targetRefs.current[index];
      if (!node) return null;
      const animation = node.animate(track.keyframes, {
        ...track.timing,
        duration: Math.max(1, track.timing.duration),
        fill: track.timing.fill || "both",
      });
      animation.pause();
      animation.currentTime = Math.max(0, Math.min(1, progress)) * Math.max(1, track.timing.duration);
      animation.playbackRate = speed;
      return animation;
    });

    return () => {
      animationRefs.current.forEach((animation) => animation?.cancel());
      animationRefs.current = [];
    };
  }, [currentTrackPage, iteration, visibleTracks]);

  useEffect(() => {
    animationRefs.current.forEach((animation) => {
      if (animation) animation.playbackRate = speed;
    });
  }, [speed]);

  useEffect(() => {
    if (playing && !prefersReduced && !isScroll) {
      animationRefs.current.forEach((animation) => animation?.play());
      return;
    }
    seekAnimations(progress);
  }, [isScroll, iteration, playing, prefersReduced, progress, visibleTracks]);

  if (!record) return null;
  if (!playableTracks.length) {
    return (
      <div className="motion-preview-shell">
        <span className="eyebrow">STATUS PROVENANCE</span>
        <EmptyState title="No runtime track">This record preserves the attempted state, source refs, and failure/no-change evidence without inventing motion.</EmptyState>
      </div>
    );
  }

  return (
    <div className="motion-preview-shell">
      <div className="motion-preview-header">
        <span className="eyebrow">관찰값 기반 도식 재생</span>
        <span>{isScroll ? "Scroll progress scrub" : "Abstract local replay"}</span>
      </div>
      {provenance && <span className="motion-reduced-note">{provenance}</span>}
      <div className="motion-track-window">
        <span>
          Tracks {currentTrackPage * tracksPerPage + 1}-{Math.min(playableTracks.length, (currentTrackPage + 1) * tracksPerPage)} of {playableTracks.length}
        </span>
        {trackPageCount > 1 && (
          <div className="motion-pager">
            <button onClick={() => setTrackPage((value) => Math.max(0, value - 1))} disabled={currentTrackPage === 0}>Prev tracks</button>
            <span>{currentTrackPage + 1} / {trackPageCount}</span>
            <button onClick={() => setTrackPage((value) => Math.min(trackPageCount - 1, value + 1))} disabled={currentTrackPage >= trackPageCount - 1}>Next tracks</button>
          </div>
        )}
      </div>
      <div className="motion-preview-stage" aria-label="Observed motion abstract replay">
        {visibleTracks.map((track, index) => (
          <span
            key={`${track.id}-${index}`}
            ref={(node) => {
              targetRefs.current[index] = node;
            }}
            className={`motion-preview-item ${["circle", "bar", "tile", "line"][index % 4]}`}
            style={{
              "--motion-index": index,
            }}
            title={track.target}
          >
            <i />
            <small>{currentTrackPage * tracksPerPage + index + 1}</small>
          </span>
        ))}
      </div>
      <details className="motion-target-list">
        <summary>Visible track target selectors</summary>
        <ol start={currentTrackPage * tracksPerPage + 1}>
          {visibleTracks.map((track, index) => (
            <li key={`${track.id}-selector-${index}`}>{track.target}</li>
          ))}
        </ol>
      </details>
      <div className="motion-playback">
        <button onClick={() => { setProgress(0); setIteration((value) => value + 1); setPlaying(true); }} disabled={prefersReduced || isScroll}>Replay</button>
        <button onClick={() => {
          if (playing) {
            freezeAtCurrentTime();
            setPlaying(false);
          } else {
            setPlaying(true);
          }
        }} disabled={prefersReduced || isScroll}>{playing ? "Pause" : "Play"}</button>
        <label>
          Speed
          <input type="range" min="0.25" max="2" step="0.25" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} />
          <output>{speed.toFixed(2)}x</output>
        </label>
        <label>
          {isScroll ? "Scroll progress" : "Scrub"}
          <input type="range" min="0" max="1" step="0.01" value={progress} onChange={(event) => { setProgress(Number(event.target.value)); setPlaying(false); }} />
          <output>{Math.round(progress * 100)}%</output>
        </label>
      </div>
      {prefersReduced && <span className="motion-reduced-note">Reduced motion is active; replay remains available as a scrubbed static diagram.</span>}
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}

function RuntimeDetail({ record, catalogRecords, onCopy }) {
  const detail = useRuntimeDetail(record);
  if (!record) {
    return <EmptyState title="No runtime selection">Select a runtime motion record.</EmptyState>;
  }

  const detailMatches = detail.key === record.id;
  const detailRecord = detailMatches && detail.data
    ? normalizeRuntime({ records: [detail.data] }).records[0]
    : null;
  const replayRecord = detailRecord || record;
  const originalRecord = detailMatches && detail.data ? detail.data : record.rawRecord || record;
  const relatedDeclarations = catalogRecords
    .filter((source) =>
      compact([record.selector, record.sourceUrl, record.file]).some((needle) =>
        compact([source.selector, source.sourceUrl, source.file]).some((value) =>
          value.includes(needle) || needle.includes(value),
        ),
      ),
    )
    .slice(0, 8);
  const payload = JSON.stringify(originalRecord, null, 2);
  const sourceRefValues = asArray(replayRecord.sourceRefs).length
    ? asArray(replayRecord.sourceRefs).map((item) => text(item)).filter(Boolean)
    : asArray(originalRecord.sourceRefs).map((item) => text(item)).filter(Boolean);
  const replayTracksPayload = JSON.stringify(replayRecord.tracks.map((track) => ({
    target: track.target,
    keyframes: track.keyframes,
    timing: track.timing,
  })), null, 2);
  const cssPayload = replayRecord.tracks.map((track, index) => {
    const name = `observed-motion-${index + 1}`;
    const frames = track.keyframes.map((frame, frameIndex) => {
      const fallbackOffset = track.keyframes.length > 1
        ? frameIndex / (track.keyframes.length - 1)
        : 1;
      const percent = Math.round(Number(frame.offset ?? fallbackOffset) * 100);
      const body = Object.entries(frame)
        .filter(([key]) => key !== "offset")
        .map(([key, value]) => `    ${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value};`)
        .join("\n");
      return `  ${percent}% {\n${body}\n  }`;
    }).join("\n");
    const provenance = compact([
      track.source ? `source: ${track.source}` : "",
      track.timingProvenance,
      track.scrollRange ? `scrollRange: ${track.scrollRange.start}-${track.scrollRange.end}${track.scrollRange.unit || ""}` : "",
    ]).join("; ");
    return `/* Reconstructed schematic replay${provenance ? `; ${provenance}` : ""}. */\n@keyframes ${name} {\n${frames}\n}\n.motion-target-${index + 1} {\n  animation: ${name} ${track.timing.duration}ms ${track.timing.easing} ${track.timing.delay}ms ${track.timing.iterations} ${track.timing.direction} ${track.timing.fill};\n}`;
  }).join("\n\n");
  const jsPayload = `// Sanitized local replay helper. The original runtime record JSON above preserves raw timing and frames.\nconst tracks = ${replayTracksPayload};\n\nfor (const track of tracks) {\n  const target = document.querySelector(track.target);\n  if (!target || !Array.isArray(track.keyframes)) continue;\n  const timing = { ...(track.timing || {}) };\n  const iterations = Number(timing.iterations);\n  timing.iterations = Number.isFinite(iterations) && iterations > 0 ? iterations : 1;\n  timing.duration = Math.max(1, Number(timing.duration) || 600);\n  target.animate(track.keyframes, timing);\n}`;

  return (
    <aside className="motion-detail">
      <span className="eyebrow">RUNTIME RECORD</span>
      <h3>{record.label}</h3>
      <p>{record.summary || record.selector || "Captured runtime attempt."}</p>
      <div className="motion-meta-grid">
        <Fact label="Status" value={record.status} />
        <Fact label="Trigger" value={record.trigger} />
        <Fact label="Device" value={record.viewport} />
        <Fact label="Tracks" value={record.trackCount ?? replayRecord.tracks.length} />
      </div>
      <div className="motion-source-links">
        {record.sourceUrl && <a href={record.sourceUrl} target="_blank" rel="noreferrer">Source URL</a>}
        {record.file && <a href={record.file} target="_blank" rel="noreferrer">Record JSON</a>}
        {(record.status === "blocked" || record.status === "no-change") && <a href="#reconstructions">Local alternatives</a>}
        <a href="#observed-motion">Source extraction drilldown</a>
      </div>
      {record.file && detailMatches && detail.status === "loading" && (
        <EmptyState title="Loading original detail">Preview remains available while the full runtime record is fetched.</EmptyState>
      )}
      {record.file && detailMatches && detail.status === "error" && (
        <EmptyState title="Original detail unavailable">{detail.error}</EmptyState>
      )}
      <MotionReplay record={replayRecord} />
      <details className="motion-runtime-metadata">
        <summary>Runtime metadata and source refs</summary>
        <dl className="motion-definition-list">
          <div><dt>Selector</dt><dd>{record.selector || "Not captured"}</dd></div>
          <div><dt>Properties</dt><dd>{record.properties.join(", ") || "Not captured"}</dd></div>
          <div><dt>Timing</dt><dd>{compact([record.duration, record.easing]).join(" / ") || record.tracks.map((track) => `${track.timing.duration}ms ${track.timing.easing}`).join(" · ") || "Not captured"}</dd></div>
          <div><dt>Playable tracks</dt><dd>{record.playableTrackCount ?? replayRecord.tracks.filter((track) => hasChangingPreviewKeyframes(track)).length}</dd></div>
          <div><dt>Track provenance</dt><dd>{replayRecord.tracks.map((track) => compact([track.source, track.timingProvenance]).join(" / ")).filter(Boolean).join(" · ") || (record.file ? "Load detail JSON for track provenance" : "Not captured")}</dd></div>
          <div><dt>Scroll range</dt><dd>{replayRecord.tracks.map((track) => track.scrollRange ? `${track.scrollRange.start}-${track.scrollRange.end}${track.scrollRange.unit || ""}` : "").filter(Boolean).join(" · ") || "Not a scroll track"}</dd></div>
          <div>
            <dt>Source refs</dt>
            <dd>
              {sourceRefValues.length ? sourceRefValues.map((ref, index) => (
                <React.Fragment key={`${ref}-${index}`}>
                  {index > 0 ? " · " : ""}
                  {/^(https?:|\/)/.test(ref) ? <a href={ref} target="_blank" rel="noreferrer">{ref}</a> : ref}
                </React.Fragment>
              )) : "None"}
            </dd>
          </div>
          {record.error && <div><dt>Error</dt><dd>{record.error}</dd></div>}
        </dl>
      </details>
      <EvidenceThumbnails record={originalRecord} />
      {!replayRecord.tracks.length && record.file && detail.status !== "ready" && (
        <EmptyState title="Replay detail pending">The index lists {record.playableTrackCount ?? 0} playable tracks. Open detail loading keeps filters responsive and avoids pulling the full runtime archive into the list.</EmptyState>
      )}
      {!replayRecord.tracks.length && relatedDeclarations.length > 0 && (
        <div className="motion-related-source">
          <strong>Declared-source track inventory</strong>
          <span>Runtime did not capture playable keyframes for this attempt. Showing related examples here; use the Source declarations tab for the full source-only catalog.</span>
          <ul>
            {relatedDeclarations.map((source) => (
              <li key={source.id}>
                <button onClick={() => copyValue(source.code, onCopy)}>
                  <b>{source.label}</b>
                  <small>{compact([source.kind, source.trigger, source.file]).join(" / ")}</small>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <CodePanel label={detailMatches && detail.data ? "JSON / fetched original runtime record" : "JSON / runtime index record"} value={payload} filename={`${record.id}.json`} onCopy={onCopy} />
      {replayRecord.tracks.some((track) => !hasChangingPreviewKeyframes(track)) && (
        <EmptyState title="Preview limitation">Some captured properties are preserved in JSON but are not rendered because they do not include supported changing visual values.</EmptyState>
      )}
      <CodePanel label="CSS / runnable abstract replay" value={cssPayload} filename={`${record.id}.css`} onCopy={onCopy} />
      <CodePanel label="JS / local replay helper" value={jsPayload} filename={`${record.id}.js`} onCopy={onCopy} />
    </aside>
  );
}

function CatalogDetail({ record, onCopy }) {
  if (!record) {
    return <EmptyState title="No source declaration selected">Select a CSS, SVG, media, or JS source declaration.</EmptyState>;
  }

  const media = isObject(record.media) ? record.media : null;
  const mediaSources = asArray(media?.sources).map((item) => text(item)).filter(Boolean);
  const poster = text(media?.poster);

  return (
    <aside className="motion-detail">
      <span className="eyebrow">SOURCE DECLARATION</span>
      <h3>{record.label}</h3>
      <p>{record.context || "Static source declaration. This is not proof of runtime visual change."}</p>
      <div className="motion-meta-grid">
        <Fact label="Status" value={record.status} />
        <Fact label="Trigger" value={record.trigger} />
        <Fact label="Type" value={record.kind} />
        <Fact label="Pages" value={record.pageTitles.length || record.pageIds.length} />
      </div>
      <div className="motion-source-links">
        {record.sourceUrl && <a href={record.sourceUrl} target="_blank" rel="noreferrer">Source URL</a>}
        {record.file && <a href={record.file} target="_blank" rel="noreferrer">Captured file</a>}
        <a href="#observed-motion">Source extraction drilldown</a>
      </div>
      <dl className="motion-definition-list">
        <div><dt>Selector</dt><dd>{record.selector || "Not captured"}</dd></div>
        <div><dt>Pages</dt><dd>{record.pageTitles.join(" · ") || record.pageIds.join(" · ") || "Not mapped"}</dd></div>
        {media?.kind && <div><dt>Media kind</dt><dd>{media.kind}</dd></div>}
      </dl>
      {(mediaSources.length > 0 || poster) && (
        <div className="motion-media-source">
          <strong>Exact media source URLs</strong>
          <span>Source-only links are preserved as captured references. The viewer does not autoplay or fetch media previews.</span>
          <ul>
            {poster && (
              <li><a href={poster} target="_blank" rel="noreferrer">Poster: {poster}</a></li>
            )}
            {mediaSources.map((source) => (
              <li key={source}><a href={source} target="_blank" rel="noreferrer">{source}</a></li>
            ))}
          </ul>
        </div>
      )}
      <CodePanel label="SOURCE / exact declaration" value={record.code} filename={`${record.id}.txt`} onCopy={onCopy} />
      {record.attributes && (
        <CodePanel label="JSON / attributes" value={JSON.stringify(record.attributes, null, 2)} filename={`${record.id}-attributes.json`} onCopy={onCopy} />
      )}
    </aside>
  );
}

function coverageValue(coverage, primary, fallback, defaultValue = 0) {
  return coverage?.[primary] ?? coverage?.[fallback] ?? defaultValue;
}

function PageCoveragePanel({ pages }) {
  const rows = pages.flatMap((page) => {
    const primary = Array.isArray(page.coverage)
      ? page.coverage.map((coverage, index) => ({ page, coverage, type: "runtime", primary: true, id: `${page.id}-runtime-${coverage.viewport || index}` }))
      : page.coverage
        ? [{ page, coverage: page.coverage, type: "runtime", primary: true, id: `${page.id}-runtime` }]
        : [];
    const supplemental = asArray(page.supplementalCoverage).map((coverage, index) => ({
      page,
      coverage,
      type: "native input",
      primary: false,
      id: `${page.id}-supplemental-${coverage.viewport || index}`,
    }));
    return [...primary, ...supplemental];
  });
  if (!rows.length) return null;

  const primaryRows = rows.filter((row) => row.primary);
  const summary = compact([
    `${pages.length} ${pages.length === 1 ? "page" : "pages"}`,
    `${primaryRows.length} ${primaryRows.length === 1 ? "viewport" : "viewports"}`,
    "Coverage details",
  ]).join(" · ");

  return (
    <details className="motion-page-coverage">
      <summary>
        <span className="eyebrow">PAGE COVERAGE</span>
        <strong>{summary}</strong>
      </summary>
      <div className="motion-page-coverage-list">
        {rows.map(({ page, coverage, type, id }) => {
          const reasons = [
            ...asArray(coverage.reasons || coverage.reason).map((item) => text(item)),
            ...asArray(coverage.errors).map((item) => text(item)),
          ].filter(Boolean);
          return (
            <span key={id}>
              <b>{compact([page.title, coverage.viewport, type]).join(" / ")}</b>
              <small>
                {compact([
                  `discovered ${text(coverageValue(coverage, "controlsDiscovered", "discovered"))}`,
                  `tested ${text(coverageValue(coverage, "controlsTested", "tested"))}`,
                  coverage.hoverTargetsDiscovered !== undefined ? `hover targets ${text(coverage.hoverTargetsTested, 0)}/${text(coverage.hoverTargetsDiscovered, 0)}` : "",
                  coverage.scrollSamples !== undefined ? `scroll samples ${text(coverage.scrollSamples, 0)}` : "",
                  coverage.blocked !== undefined ? `blocked ${text(coverage.blocked)}` : "",
                  `skipped ${text(coverageValue(coverage, "controlsSkipped", "skipped"))}`,
                ]).join(" / ")}
              </small>
              {reasons.length > 0 && <em>{reasons.slice(0, 2).join(" · ")}</em>}
            </span>
          );
        })}
      </div>
    </details>
  );
}

export function MotionLibrary({ onCopy }) {
  const runtime = useJsonResource(RUNTIME_URL, normalizeRuntime);
  const catalog = useJsonResource(CATALOG_URL, normalizeCatalog);
  const [mode, setMode] = useState("runtime");
  const [filters, setFilters] = useState({
    query: "",
    page: "all",
    viewport: "all",
    trigger: "all",
    kind: "all",
    status: "playable",
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [selectedRuntimeId, setSelectedRuntimeId] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const runtimeCounts = useMemo(() => countRuntime(runtime.data.records), [runtime.data.records]);
  const catalogCounts = catalog.data.summary || {};
  const activeRecords = mode === "runtime" ? runtime.data.records : catalog.data.records;
  const activePages = mode === "runtime" ? runtime.data.pages : catalog.data.pages;
  const activeFilters = mode === "runtime" ? filters : { ...filters, status: "source-only", viewport: "all" };
  const filtered = useMemo(
    () => filterRecords(activeRecords, activeFilters),
    [activeFilters, activeRecords],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRecords = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);
  const selectedRuntime = mode === "runtime"
    ? filtered.find((record) => record.id === selectedRuntimeId) || filtered[0]
    : undefined;
  const selectedCatalog = mode === "catalog"
    ? filtered.find((record) => record.id === selectedCatalogId) || filtered[0]
    : undefined;

  useEffect(() => setPage(0), [filters, mode, pageSize]);
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);
  useEffect(() => {
    if (mode === "runtime") setSelectedRuntimeId(selectedRuntime?.id || "");
  }, [mode, selectedRuntime?.id]);
  useEffect(() => {
    if (mode === "catalog") setSelectedCatalogId(selectedCatalog?.id || "");
  }, [mode, selectedCatalog?.id]);

  const updateFilters = (next) => setFilters((current) => ({ ...current, ...next }));
  const loading = runtime.status === "loading" || catalog.status === "loading";
  const errors = [runtime, catalog].filter((item) => item.status === "error");

  return (
    <div className="motion-library">
      <SectionHeading
        eyebrow="MOTION / RUNTIME LIBRARY"
        title="Motion library"
        action={(
          <div className="motion-actions">
            <a className="motion-link-button primary" href="/motion-code-kit.tar.gz" download>전체 모션 코드 다운로드</a>
            <a className="motion-link-button" href="/research-source-kit.tar.gz" download>원본·검증자료 전체</a>
            <a className="motion-link-button" href="#observed-motion">Source extraction drilldown</a>
          </div>
        )}
      >
        Runtime attempts, observed tracks, blocked states, and source declarations are separated so source evidence is not mistaken for executed motion.
      </SectionHeading>

      <div className="motion-summary-grid">
        <Fact label="Replayable records" value={runtimeCounts.playable} />
        <Fact label="Static CSS rules" value={Number(catalogCounts.cssRules ?? catalog.data.records.filter((record) => record.kind.startsWith("css")).length)} />
        <Fact label="JS API calls" value={Number(catalogCounts.javascriptCalls ?? catalog.data.records.filter((record) => record.kind === "js-animation").length)} />
        <Fact label="Attempts / no change / blocked" value={`${runtimeCounts.attempts} / ${runtimeCounts.noChange} / ${runtimeCounts.blocked}`} />
      </div>

      <PageCoveragePanel pages={runtime.data.pages} />

      {loading && <EmptyState title="Loading motion evidence">Reading runtime and source declaration manifests.</EmptyState>}
      {errors.map((item) => (
        <EmptyState key={item.error} title="Motion manifest unavailable">{item.error}</EmptyState>
      ))}

      <div className="motion-tabbar" role="tablist" aria-label="Motion evidence">
        <button role="tab" aria-selected={mode === "runtime"} onClick={() => setMode("runtime")}>Observed runtime</button>
        <button role="tab" aria-selected={mode === "catalog"} onClick={() => setMode("catalog")}>Source declarations</button>
      </div>

      <MotionFilters
        pages={activePages}
        filters={filters}
        onFilters={updateFilters}
        mode={mode}
        resultCount={filtered.length}
        totalCount={activeRecords.length}
        page={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={setPageSize}
      />

      <div className="motion-library-layout">
        {mode === "runtime" ? (
          <>
            <RuntimeList records={visibleRecords} selectedId={selectedRuntime?.id} onSelect={setSelectedRuntimeId} />
            <RuntimeDetail record={selectedRuntime} catalogRecords={catalog.data.records} onCopy={onCopy} />
          </>
        ) : (
          <>
            <CatalogList records={visibleRecords} selectedId={selectedCatalog?.id} onSelect={setSelectedCatalogId} />
            <CatalogDetail record={selectedCatalog} onCopy={onCopy} />
          </>
        )}
      </div>
    </div>
  );
}

export default MotionLibrary;
