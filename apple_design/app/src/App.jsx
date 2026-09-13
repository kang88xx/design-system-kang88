import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  SegmentedControl,
  Toggle,
  Accordion,
  ProductTile,
  Carousel,
} from "./system/components.jsx";
import tokenSource from "./system/tokens.css?raw";
import componentSource from "./system/components.jsx?raw";
import componentStyles from "./system/components.css?raw";
import "./studio.css";
import { Research } from "./research/Research.jsx";
import { MotionLibrary } from "./motion/MotionLibrary.jsx";
import { ProjectReady } from "./project/ProjectReady.jsx";
import { Reconstruction } from "./reconstruction/Reconstruction.jsx";

const researchViews = ["pages", "icons", "shapes", "observed-motion", "interaction-states", "research-sources"];

const pages = [
  ["overview", "Overview", "01"],
  ["start", "Use in a project", "02"],
  ["pages", "Page coverage", "02"],
  ["icons", "SVG library", "03"],
  ["shapes", "CSS shapes", "04"],
  ["observed-motion", "Captured motion", "05"],
  ["interaction-states", "Interaction states", "06"],
  ["research-sources", "All source files", "07"],
  ["reconstructions", "Local substitutes", "08"],
  ["colors", "Colors", "02"],
  ["typography", "Typography", "03"],
  ["layout", "Layout & spacing", "04"],
  ["components", "Components", "05"],
  ["motion", "Motion library", "06"],
  ["motion-presets", "Timing playground", "07"],
  ["reference", "Homepage", "07"],
  ["sources", "Homepage sources", "08"],
];
const colors = [
  ["Ink", "#1d1d1f", "Text / primary"],
  ["Secondary", "#6e6e73", "Text / secondary"],
  ["Canvas", "#ffffff", "Background / base"],
  ["Surface", "#f5f5f7", "Background / secondary"],
  ["Action", "#0071e3", "Action / primary"],
  ["Link", "#0066cc", "Text / link"],
];
const types = [
  ["Display", "56 / 60", 56, 60, 600, "Surprise and shine."],
  ["Headline", "40 / 44", 40, 44, 600, "MacBook Air"],
  ["Title", "32 / 36", 32, 36, 600, "College, sorted."],
  ["Subhead", "28 / 32", 28, 32, 400, "Meet the latest iPhone lineup."],
  ["Body", "17 / 25", 17, 25, 400, "Designed to make a difference."],
  ["Caption", "12 / 16", 12, 16, 400, "Explore the details."],
];
const motionPresets = [
  {
    value: "flyout",
    label: "Flyout",
    duration: 240,
    delay: 80,
    easing: "cubic-bezier(.4,0,.6,1)",
  },
  {
    value: "stagger",
    label: "Menu items",
    duration: 320,
    delay: 80,
    easing: "cubic-bezier(.4,0,.6,1)",
  },
  {
    value: "mobile",
    label: "Mobile menu",
    duration: 300,
    delay: 0,
    easing: "cubic-bezier(.25,.1,.3,1)",
  },
];
const fileType = (file) =>
  file.endsWith(".css") ? "CSS" : file.endsWith(".js") ? "JavaScript" : "HTML";
function Icon({ name, icons }) {
  return (
    <span
      className={"source-icon icon-" + name}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons?.[name] || "" }}
    />
  );
}
function Code({ text, onCopy, label = "CSS" }) {
  return (
    <div className="code-block">
      <div className="code-heading">
        <span>{label}</span>
        <button onClick={() => onCopy(text)}>Copy code</button>
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  );
}
function SectionHeading({ eyebrow, title, children, action }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
function MediaImage({ data, match, ...props }) {
  const resource = data.resources.find(
    (r) => r.file.includes(match) && r.file.endsWith("_large.jpg"),
  );
  return resource ? <img src={resource.file} {...props} /> : null;
}

function Overview({ data, navigate, onCopy }) {
  return (
    <>
      <div className="overview-title">
        <div className="eyebrow">
          <span className="status-dot" /> WEBSITE DESIGN SYSTEM{" "}
          <span className="version">2026.09</span>
        </div>
        <h1>Apple.com</h1>
        <p className="intro">Explore the source. Build with the system.</p>
        <div className="title-actions">
          <Button href="#start">
            Use in your project
          </Button>
          <button
            className="text-command"
            onClick={() => navigate("pages")}
          >
            Explore captured pages <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
      <div className="stats-strip">
        {[
          [String(data.tiles.length).padStart(2, "0"), "Product modules"],
          [String(data.nav.length).padStart(2, "0"), "Navigation menus"],
          ["03", "Responsive ranges"],
          [
            String(
              data.resources.filter((r) => /\.(css|js)$/.test(r.file)).length,
            ),
            "Homepage source files",
          ],
        ].map(([n, l]) => (
          <div key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <section>
        <SectionHeading
          title="The system, in context"
          action={
            <button
              className="text-command"
              onClick={() => navigate("reference")}
            >
              View homepage <span>↗</span>
            </button>
          }
        />
        <div className="context-grid">
          {[
            ["MacBook Air", "macbook-air-m5", "Product / light"],
            ["iPad Pro", "ipad-pro", "Product / dark"],
            ["iPhone", "iphone-family", "Hero / light"],
          ].map(([name, match, label]) => (
            <button
              className="context-item"
              key={name}
              onClick={() => navigate("components")}
            >
              <div
                className={
                  "context-image " + (match === "ipad-pro" ? "dark" : "")
                }
              >
                <MediaImage data={data} match={match} alt={name} />
              </div>
              <div className="context-meta">
                <div>
                  <strong>{name}</strong>
                  <span>{label}</span>
                </div>
                <span>↗</span>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section>
        <SectionHeading
          title="Foundations"
          action={
            <button className="text-command" onClick={() => navigate("colors")}>
              All tokens <span>↗</span>
            </button>
          }
        />
        <div className="palette-row">
          {colors.map(([name, hex]) => (
            <button
              key={hex}
              className="color-sample"
              onClick={() => onCopy(hex)}
              aria-label={"Copy " + name + " " + hex}
            >
              <span className="swatch" style={{ background: hex }} />
              <strong>{name}</strong>
              <code>{hex}</code>
            </button>
          ))}
        </div>
      </section>
      <section className="overview-bottom">
        <button
          className="foundation-link"
          onClick={() => navigate("typography")}
        >
          <span className="eyebrow">TYPOGRAPHY</span>
          <span className="type-monogram">Aa</span>
          <div>
            <strong>SF Pro</strong>
            <span>Display & Text</span>
          </div>
          <span className="corner-arrow">↗</span>
        </button>
        <button className="foundation-link" onClick={() => navigate("motion")}>
          <span className="eyebrow">MOTION</span>
          <div className="motion-bars">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div>
            <strong>Purposeful movement</strong>
            <span>240ms · 320ms · 300ms</span>
          </div>
          <span className="corner-arrow">↗</span>
        </button>
      </section>
    </>
  );
}
function Colors({ onCopy }) {
  return (
    <>
      <SectionHeading eyebrow="FOUNDATIONS / 01" title="Color">
        Semantic color, grounded in the captured homepage.
      </SectionHeading>
      <div className="color-grid">
        {colors.map(([name, hex, role]) => (
          <button
            className="color-detail"
            key={hex}
            onClick={() => onCopy(hex)}
          >
            <span className="big-swatch" style={{ background: hex }} />
            <div>
              <strong>{name}</strong>
              <code>{hex}</code>
              <small>{role}</small>
            </div>
          </button>
        ))}
      </div>
      <SectionHeading title="In use" />
      <div className="color-usage">
        <div>
          <span className="eyebrow">LIGHT</span>
          <h3>Clarity comes first.</h3>
          <p>Primary content. Secondary detail.</p>
          <Button>Learn more</Button>
        </div>
        <div className="theme-inverse">
          <span className="eyebrow">DARK</span>
          <h3>Focus on what matters.</h3>
          <p>A quiet canvas for every product.</p>
          <Button variant="neutral">Learn more</Button>
        </div>
      </div>
      <Code text={tokenSource} onCopy={onCopy} />
    </>
  );
}
function Typography({ onCopy }) {
  const [sample, setSample] = useState("");
  return (
    <>
      <SectionHeading eyebrow="FOUNDATIONS / 02" title="Typography">
        SF Pro Display for headlines. SF Pro Text for reading.
      </SectionHeading>
      <div className="specimen-input">
        <label htmlFor="specimen">Custom specimen</label>
        <input
          id="specimen"
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          placeholder="Type something…"
          maxLength={80}
        />
      </div>
      <div className="type-list">
        {types.map(([name, metric, size, line, weight, text]) => (
          <div className="type-row" key={name}>
            <div>
              <strong>{name}</strong>
              <code>
                {metric} · {weight}
              </code>
            </div>
            <p
              style={{
                fontSize: size,
                lineHeight: line + "px",
                fontWeight: weight,
                fontFamily:
                  size >= 28 ? "var(--font-display)" : "var(--font-text)",
              }}
            >
              {sample || text}
            </p>
          </div>
        ))}
      </div>
      <Code
        label="CSS / responsive headline"
        onCopy={onCopy}
        text={
          '.headline {\n  font-family: "SF Pro Display", sans-serif;\n  font-size: 56px;\n  line-height: 60px;\n  font-weight: 600;\n  letter-spacing: 0;\n}\n@media (max-width: 1068px) {\n  .headline { font-size: 48px; line-height: 52px; }\n}\n@media (max-width: 734px) {\n  .headline { font-size: 32px; line-height: 36px; }\n}'
        }
      />
    </>
  );
}
function Layout({ onCopy }) {
  const [width, setWidth] = useState("desktop");
  return (
    <>
      <SectionHeading eyebrow="FOUNDATIONS / 03" title="Layout & spacing">
        Full-width bands. A precise, responsive rhythm.
      </SectionHeading>
      <div className="breakpoint-list">
        {[
          ["Small", "≤ 734px", "48px navigation · 1 column"],
          ["Medium", "735–1068px", "Navigation changes at 834px · 2 columns"],
          ["Large", "≥ 1069px", "980px inner width · 2 columns"],
        ].map(([label, value, note]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="spacing-list">
        {[4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 88].map((n) => (
          <button onClick={() => onCopy(n + "px")} key={n}>
            <code>{n}</code>
            <span style={{ width: n * 3 }} />
            <small>{n}px</small>
          </button>
        ))}
      </div>
      <SectionHeading
        title="Grid"
        action={
          <SegmentedControl
            label="Grid viewport"
            options={[
              { value: "desktop", label: "Desktop" },
              { value: "mobile", label: "Mobile" },
            ]}
            value={width}
            onChange={setWidth}
          />
        }
      />
      <div className={"grid-spec " + width}>
        <div>
          Hero <code>100%</code>
        </div>
        <div>
          Product <code>{width === "mobile" ? "100%" : "50%"}</code>
        </div>
        <div>
          Product <code>{width === "mobile" ? "100%" : "50%"}</code>
        </div>
      </div>
      <Code
        onCopy={onCopy}
        text={
          ".product-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 12px;\n  padding: 0 12px;\n}\n@media (max-width: 734px) {\n  .product-grid { grid-template-columns: 1fr; padding: 0; }\n}"
        }
      />
    </>
  );
}
function Components({ data, onCopy }) {
  const [tab, setTab] = useState("buttons");
  const [size, setSize] = useState("default");
  const [disabled, setDisabled] = useState(false);
  const tabs = ["buttons", "navigation", "products", "carousel", "accordion"];
  const items = [
    ["MacBook Air", "macbook-air-m5"],
    ["iPad Air", "ipad-air"],
    ["iPad Pro", "ipad-pro"],
    ["iPhone", "iphone-family"],
  ].map(([title, match]) => ({
    title,
    image: data.resources.find(
      (r) => r.file.includes(match) && r.file.endsWith("_large.jpg"),
    )?.file,
    description: "Explore the latest lineup.",
    href: "https://www.apple.com/",
  }));
  return (
    <>
      <SectionHeading eyebrow="LIBRARY / 04" title="Components">
        Reusable React components with explicit states.
      </SectionHeading>
      <div className="view-tabs" role="tablist" aria-label="Component category">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="component-stage">
        {tab === "buttons" && (
          <>
            <div className="stage-controls">
              <SegmentedControl
                label="Button size"
                options={[
                  { value: "default", label: "Default" },
                  { value: "small", label: "Small" },
                ]}
                value={size}
                onChange={setSize}
              />
              <Toggle
                label="Disabled"
                checked={disabled}
                onChange={setDisabled}
              />
            </div>
            <div className="button-specimens">
              {["primary", "secondary", "neutral"].map((v) => (
                <div key={v}>
                  <Button
                    variant={v}
                    size={size}
                    disabled={disabled}
                    onClick={() =>
                      onCopy('<Button variant="' + v + '">Learn more</Button>')
                    }
                  >
                    Learn more
                  </Button>
                  <code>{v}</code>
                </div>
              ))}
            </div>
            <div className="spec-metrics">
              <span>
                Radius <b>980px</b>
              </span>
              <span>
                Text <b>{size === "small" ? "14" : "17"}px</b>
              </span>
              <span>
                Padding <b>{size === "small" ? "7px 15px" : "11px 21px"}</b>
              </span>
            </div>
          </>
        )}
        {tab === "navigation" && (
          <>
            <iframe
              className="nav-frame"
              title="Interactive original navigation"
              src="/homepage.html?module=navigation"
            />
            <div className="spec-metrics">
              <span>
                Desktop <b>44px</b>
              </span>
              <span>
                Mobile <b>48px</b>
              </span>
              <span>
                Flyout <b>240ms</b>
              </span>
            </div>
          </>
        )}
        {tab === "products" && (
          <div className="product-specimens">
            {items.slice(0, 2).map((p) => (
              <ProductTile
                key={p.title}
                title={p.title}
                subtitle={p.description}
                image={p.image}
                href={p.href}
                compact
              />
            ))}
          </div>
        )}
        {tab === "carousel" && <Carousel items={items} />}
        {tab === "accordion" && (
          <Accordion
            items={[
              {
                title: "Shop and Learn",
                content: (
                  <div className="accordion-links">
                    <a href="https://www.apple.com/mac/">Mac</a>
                    <a href="https://www.apple.com/ipad/">iPad</a>
                    <a href="https://www.apple.com/iphone/">iPhone</a>
                  </div>
                ),
              },
              {
                title: "Apple Wallet",
                content: (
                  <a href="https://www.apple.com/apple-card/">Apple Card</a>
                ),
              },
              {
                title: "Apple Values",
                content: (
                  <a href="https://www.apple.com/accessibility/">
                    Accessibility
                  </a>
                ),
              },
            ]}
          />
        )}
      </div>
      <Code
        label="React / usage"
        onCopy={onCopy}
        text={
          tab === "buttons"
            ? `import { Button } from './system/components';\n\n<Button variant="primary" size="${size}"${disabled ? " disabled" : ""}>\n  Learn more\n</Button>`
            : tab === "navigation"
              ? '<iframe\n  title="Apple global navigation"\n  src="/homepage.html?module=navigation"\n/>'
              : tab === "products"
                ? '<ProductTile\n  title="MacBook Air"\n  subtitle="Now supercharged by M5."\n  image="/path/to/product.jpg"\n  href="https://www.apple.com/macbook-air/"\n/>'
                : tab === "carousel"
                  ? "<Carousel items={products} interval={5000} />"
                  : '<Accordion items={[\n  { title: "Shop and Learn", content: <ProductLinks /> }\n]} />'
        }
      />
      <details className="implementation-source">
        <summary>Full component implementation</summary>
        <Code
          label="React / components.jsx"
          text={componentSource}
          onCopy={onCopy}
        />
        <Code
          label="CSS / components.css"
          text={componentStyles}
          onCopy={onCopy}
        />
      </details>
    </>
  );
}
function Motion({ onCopy }) {
  const [preset, setPreset] = useState("stagger");
  const [duration, setDuration] = useState(320);
  const [reduced, setReduced] = useState(false);
  const [iteration, setIteration] = useState(0);
  const stage = useRef(null);
  const curve = useRef(null);
  const config = motionPresets.find((p) => p.value === preset);
  useEffect(() => {
    const systemReduced = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const els = stage.current.querySelectorAll("[data-animate]");
    const animations = [...els].map((el, i) =>
      el.animate(
        [
          {
            opacity: 0,
            transform:
              config.value === "mobile"
                ? "translateX(32px)"
                : "translateY(-12px)",
          },
          { opacity: 1, transform: "translate(0,0)" },
        ],
        {
          duration: reduced || systemReduced ? 0 : duration,
          easing: config.easing,
          delay:
            reduced || systemReduced
              ? 0
              : config.delay + (preset === "stagger" ? i * 20 : 0),
          fill: "both",
        },
      ),
    );
    return () => animations.forEach((a) => a.cancel());
  }, [preset, duration, reduced, iteration]);
  useEffect(() => {
    const ctx = curve.current.getContext("2d");
    ctx.clearRect(0, 0, 300, 170);
    ctx.strokeStyle = "#e5e5e7";
    ctx.lineWidth = 1;
    for (let x = 20; x <= 280; x += 52) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, 150);
      ctx.stroke();
    }
    for (let y = 20; y <= 150; y += 26) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(280, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.strokeStyle = "#0071e3";
    ctx.lineWidth = 3;
    ctx.moveTo(20, 150);
    if (preset === "mobile") ctx.bezierCurveTo(85, 137, 98, 20, 280, 20);
    else ctx.bezierCurveTo(124, 150, 176, 20, 280, 20);
    ctx.stroke();
  }, [preset]);
  return (
    <>
      <SectionHeading eyebrow="BEHAVIOR / 05" title="Motion">
        Timing and easing from the public navigation stylesheet.
      </SectionHeading>
      <div className="motion-toolbar">
        <SegmentedControl
          label="Motion preset"
          options={motionPresets}
          value={preset}
          onChange={(v) => {
            setPreset(v);
            setDuration(motionPresets.find((p) => p.value === v).duration);
          }}
        />
        <button
          className="replay-command"
          onClick={() => setIteration((n) => n + 1)}
        >
          Replay ↻
        </button>
      </div>
      <div className="motion-lab">
        <div className="motion-stage" ref={stage}>
          <span className="eyebrow" data-animate>
            Explore Mac
          </span>
          {["Explore All Mac", "MacBook Air", "MacBook Pro", "iMac"].map(
            (t) => (
              <span data-animate key={t}>
                {t}
              </span>
            ),
          )}
        </div>
        <div className="motion-settings">
          <label htmlFor="duration">
            Duration <output>{duration}ms</output>
          </label>
          <input
            id="duration"
            type="range"
            min="80"
            max="1200"
            step="20"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <canvas
            ref={curve}
            width="300"
            height="170"
            aria-label={"Easing graph: " + config.easing}
          />
          <code>{config.easing}</code>
          <Toggle
            label="Reduce motion"
            checked={reduced}
            onChange={setReduced}
          />
        </div>
      </div>
      <div className="motion-facts">
        <span>
          <strong>20ms</strong>Item stagger
        </span>
        <span>
          <strong>80ms</strong>Group delay
        </span>
        <span>
          <strong>120ms</strong>Flyout close delay
        </span>
      </div>
      <Code
        label="CSS / reconstructed motion usage"
        text={`.menu-item {\n  transition:\n    opacity ${duration}ms ${config.easing},\n    transform ${duration}ms ${config.easing};\n  transition-delay: calc(var(--item-index) * 20ms + ${config.delay}ms);\n}\n@media (prefers-reduced-motion: reduce) {\n  .menu-item { transition: none; }\n}`}
        onCopy={onCopy}
      />
      <a
        className="source-citation"
        href="/api-www/global-elements/global-header/v1/assets/globalheader.css"
        target="_blank"
      >
        Source: globalheader.css ↗
      </a>
    </>
  );
}
function Reference() {
  const [viewport, setViewport] = useState("desktop");
  const [reload, setReload] = useState(0);
  return (
    <>
      <SectionHeading
        eyebrow="REFERENCE / 06"
        title="Homepage"
        action={
          <a
            className="text-command"
            href="/homepage.html"
            target="_blank"
            rel="noreferrer"
          >
            Open full page ↗
          </a>
        }
      />
      <div className="reference-toolbar">
        <SegmentedControl
          label="Preview viewport"
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "tablet", label: "Tablet" },
            { value: "mobile", label: "Mobile" },
          ]}
          value={viewport}
          onChange={setViewport}
        />
        <button
          className="text-command"
          onClick={() => setReload((n) => n + 1)}
        >
          Reload ↻
        </button>
      </div>
      <div className={"reference-canvas " + viewport}>
        <iframe
          key={reload}
          src="/homepage.html"
          title={"Apple homepage " + viewport + " preview"}
        />
      </div>
    </>
  );
}
function Sources({ data, onCopy }) {
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const files = [
    { file: "/homepage.html", url: "https://www.apple.com/" },
    ...data.resources.filter((r) => /\.(css|js)$/.test(r.file)),
  ];
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    setSource("");
    setError("");
    fetch(selected.file, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Source could not be loaded.");
        return r.text();
      })
      .then((body) => { if (!controller.signal.aborted) setSource(body); })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [selected]);
  return (
    <>
      <SectionHeading eyebrow="IMPLEMENTATION / 07" title="Source library">
        Homepage HTML, CSS and JavaScript. Open All source files for the complete cross-page collection.
      </SectionHeading>
      <div className="source-summary">
        <span>
          <i className="status-dot" />
          {files.length} code files
        </span>
        <a href="/extraction.json" download="apple-extraction.json">
          Download manifest ↧
        </a>
        <a href="#research-sources">Browse all source files ↗</a>
        <a href="#reconstructions">Local substitutes ↗</a>
      </div>
      <input
        className="file-search"
        aria-label="Filter source files"
        placeholder="Filter files…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="source-browser">
        <div className="file-list">
          {files
            .filter((r) => r.file.toLowerCase().includes(filter.toLowerCase()))
            .map((r) => (
              <button
                key={r.file}
                className={selected?.file === r.file ? "selected" : ""}
                onClick={() => setSelected(r)}
              >
                <span className={"file-type " + fileType(r.file)}>
                  {fileType(r.file) === "JavaScript" ? "JS" : fileType(r.file)}
                </span>
                <span>
                  <strong>{r.file.split("/").pop()}</strong>
                  <small>{r.file}</small>
                </span>
              </button>
            ))}
          {!files.some((r) =>
            r.file.toLowerCase().includes(filter.toLowerCase()),
          ) && <p className="empty-state">No matching files.</p>}
        </div>
        <div className="file-viewer">
          {selected ? (
            <>
              <div className="file-viewer-header">
                <strong>{selected.file.split("/").pop()}</strong>
                <a href={selected.file} download>
                  Download ↧
                </a>
              </div>
              <a
                className="original-source"
                href={selected.url}
                target="_blank"
                rel="noreferrer"
              >
                Original source ↗
              </a>
              {error ? (
                <p role="alert">{error}</p>
              ) : (
                <Code
                  label={
                    source
                      ? `${source.length.toLocaleString()} characters`
                      : "Loading…"
                  }
                  text={source}
                  onCopy={() => onCopy(source)}
                />
              )}
            </>
          ) : (
            <div className="source-empty">
              <span>{"{ }"}</span>
              <h3>Source, not screenshots.</h3>
              <p>Select a file to inspect the captured code.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
export function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(location.hash.slice(1) || "overview");
  const [menu, setMenu] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 640px)").matches);
  const sidebarRef = useRef(null);
  const navButtonRef = useRef(null);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => { setMobile(query.matches); setMenu(false); };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!mobile || !menu || !data) return;
    const sidebar = sidebarRef.current;
    const links = () => [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
    links()[0]?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); setMenu(false); }
      if (event.key !== "Tab") return;
      const items = links();
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); navButtonRef.current?.focus(); };
  }, [mobile, menu, data]);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/extraction.json", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Extraction manifest unavailable.");
        return r.json();
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    const change = () => {
      setPage(location.hash.slice(1) || "overview");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => {
      controller.abort();
      window.removeEventListener("hashchange", change);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    document.title =
      (pages.find((p) => p[0] === page)?.[1] || "Overview") +
      " | Apple Design System";
  }, [page]);
  const navigate = (p) => {
    location.hash = p;
    setMenu(false);
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied to clipboard");
    } catch {
      setToast("Clipboard unavailable. Select and copy the source text.");
    }
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  };
  const downloadTokens = () => {
    const blob = new Blob([tokenSource], { type: "text/css" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apple-tokens.css";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (error)
    return (
      <main className="boot-state">
        <h1>Source data unavailable</h1>
        <p>{error}</p>
        <button onClick={() => location.reload()}>Retry</button>
      </main>
    );
  if (!data)
    return (
      <main className="boot-state" aria-busy="true">
        Loading design system…
      </main>
    );
  const props = { data, navigate, onCopy: copy };
  return (
    <div className="studio">
      <a className="skip-link" href="#workspace" onClick={(event) => {
        event.preventDefault();
        document.getElementById("workspace")?.focus();
        document.getElementById("workspace")?.scrollIntoView();
      }}>
        Skip to content
      </a>
      <aside id="studio-nav" ref={sidebarRef}
        inert={mobile && !menu ? true : undefined}
        aria-hidden={mobile && !menu ? true : undefined}
        role={mobile && menu ? "dialog" : undefined}
        aria-modal={mobile && menu ? true : undefined}
        aria-label={mobile && menu ? "Navigation" : undefined}
        className={"sidebar " + (menu ? "is-open" : "")}>
        <a className="brand" href="#overview">
          <Icon name="apple" icons={data.icons} />
          <div>
            <strong>Apple</strong>
            <span>Design system</span>
          </div>
          <span className="brand-badge">WEB</span>
        </a>
        <div className="sidebar-group">
          <span className="sidebar-label">WORKSPACE</span>
          <nav aria-label="Design system">
            {pages.map(([id, label], index) => (
              <a
                key={id}
                href={"#" + id}
                aria-current={page === id ? "page" : undefined}
                onClick={() => setMenu(false)}
              >
                <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
                {label}
                {id === "motion" && <span className="live-dot" />}
              </a>
            ))}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          <span>
            Local source capture
            <small>
              {new Date(data.capturedAt).toLocaleDateString("en-CA", {
                timeZone: "Asia/Seoul",
              })}{" "}
              · Cross-page capture
            </small>
          </span>
          <a
            href="https://www.apple.com/"
            target="_blank"
            rel="noreferrer"
            aria-label="Open original Apple website"
          >
            ↗
          </a>
        </div>
      </aside>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-nav-button"
            ref={navButtonRef}
            aria-controls="studio-nav"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
          >
            ☰
          </button>
          <div className="breadcrumb">
            <span>Design system</span>
            <span>/</span>
            <strong>
              {pages.find((p) => p[0] === page)?.[1] || "Overview"}
            </strong>
          </div>
          <button className="export-button" onClick={downloadTokens}>
            Export tokens <span aria-hidden="true">↧</span>
          </button>
        </header>
        <main id="workspace" tabIndex={-1} className={"workspace page-" + page}>
          {researchViews.includes(page) ? (
            <Research key={page} view={page} onCopy={copy} />
          ) : page === "start" ? (
            <ProjectReady onCopy={copy} />
          ) : page === "reconstructions" ? (
            <Reconstruction onCopy={copy} />
          ) : page === "overview" ? (
            <Overview {...props} />
          ) : page === "colors" ? (
            <Colors {...props} />
          ) : page === "typography" ? (
            <Typography {...props} />
          ) : page === "layout" ? (
            <Layout {...props} />
          ) : page === "components" ? (
            <Components {...props} />
          ) : page === "motion" ? (
            <MotionLibrary onCopy={copy} />
          ) : page === "motion-presets" ? (
            <Motion {...props} />
          ) : page === "reference" ? (
            <Reference />
          ) : page === "sources" ? (
            <Sources {...props} />
          ) : (
            <Overview {...props} />
          )}
          <footer className="studio-footer">
            <span>Apple.com · Design system study</span>
            <span>Public source + reusable implementation</span>
          </footer>
        </main>
      </div>
      <div className={"toast " + (toast ? "visible" : "")} role="status">
        {toast}
      </div>
    </div>
  );
}
