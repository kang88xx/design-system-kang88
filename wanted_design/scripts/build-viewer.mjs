import { mkdir, readFile, writeFile } from "node:fs/promises";

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const readOptionalJson = async (file, fallback) => {
  try {
    return await readJson(file);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
};
const readOptionalText = async (file, fallback = "") => {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
};
const safeJson = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

const [
  metadata,
  components,
  utilities,
  semanticTokens,
  atomicTokens,
  systemTokens,
  gradients,
  shapes,
  assetManifest,
  icons,
  iconVectors,
  typography,
  grid,
  tokenCss,
  reuseLibrary,
  recipeCss,
  sourceManifest,
  supplementalIcons,
] = await Promise.all([
  readJson("data/curated/metadata.json"),
  readJson("data/curated/components.json"),
  readJson("data/curated/utilities.json"),
  readJson("data/curated/tokens.semantic.json"),
  readJson("data/curated/tokens.atomic.json"),
  readJson("data/curated/tokens.system.json"),
  readJson("data/curated/gradients.json"),
  readJson("data/curated/shapes.json"),
  readJson("data/curated/asset-manifest.json"),
  readJson("data/curated/icons.json"),
  readJson("data/curated/icon-vectors.json"),
  readJson("data/curated/typography.json"),
  readJson("data/curated/grid.json"),
  readFile("data/curated/tokens.css", "utf8"),
  readOptionalJson("data/curated/reuse-library.json", {
    generatedAt: null,
    source: "pending",
    counts: {},
    examples: [],
    surfaces: [],
    motion: [],
  }),
  readOptionalText("data/curated/recipes.css"),
  readOptionalJson("data/curated/source-manifest.json", {
    sourceArchive: "assets/montage/source/montage-web-bfced87.tar.gz",
    license: "assets/montage/source/LICENSE-Montage.md",
    exportZip: "exports/montage-reuse.zip",
    version: "v3.12.0",
    commit: "bfced87f96dfb21c8ea80074c551b64b9ed1530b",
  }),
  readOptionalJson("data/curated/upstream-icons.json", []),
]);

const assetBySource = new Map(assetManifest.assets.map((asset) => [asset.sourceUrl, asset.localPath]));
const localPreviews = Object.fromEntries(
  components
    .map((component) => component.surfaces.design?.images?.[0]?.src || component.assets[0])
    .filter(Boolean)
    .map((source) => [source, assetBySource.get(source)])
    .filter(([, localPath]) => localPath),
);
const sourceSummary = {
  source: sourceManifest.source || "https://montage.wanted.co.kr",
  generatedAt: sourceManifest.generatedAt || null,
  sourceArchive: sourceManifest.sourceArchive || sourceManifest.upstream?.localPath || "assets/montage/source/montage-web-bfced87.tar.gz",
  license: sourceManifest.license || sourceManifest.upstream?.licensePath || "assets/montage/source/LICENSE-Montage.md",
  exportZip: sourceManifest.exportZip || "exports/montage-reuse.zip",
  version: sourceManifest.version || sourceManifest.upstream?.release || "v3.12.0",
  commit: sourceManifest.commit || sourceManifest.upstream?.commit || "bfced87f96dfb21c8ea80074c551b64b9ed1530b",
  counts: sourceManifest.counts || {},
  scope: sourceManifest.scope || "",
};

const data = {
  metadata,
  components,
  utilities,
  tokens: { semantic: semanticTokens, atomic: atomicTokens, system: systemTokens },
  gradients,
  shapes,
  localPreviews,
  icons,
  iconVectors,
  supplementalIcons,
  typography,
  grid,
  assets: assetManifest.assets,
  assetCounts: assetManifest.counts,
  reuseLibrary,
  sourceManifest: sourceSummary,
};
const collectedDateParts = Object.fromEntries(
  new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date(metadata.collectedAt))
    .map(({ type, value }) => [type, value]),
);
const collectedDate = `${collectedDateParts.year}-${collectedDateParts.month}-${collectedDateParts.day}`;
const collectedMonth = `${collectedDateParts.year}.${collectedDateParts.month}`;

const html = `<!doctype html>
<html lang="ko" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Wanted Montage 디자인 시스템 로컬 카탈로그">
  <title>Montage Catalog</title>
  <link rel="preconnect" href="https://static.wanted.co.kr" crossorigin>
  <link rel="stylesheet" href="https://static.wanted.co.kr/fonts/pretendard/pretendard-jp/pretendardvariable-jp-dynamic-subset.min.css">
  <link rel="stylesheet" href="https://static.wanted.co.kr/fonts/wantedsans/WantedSansVariable.min.css">
  <script src="studio-shell.js" defer></script>
  <script>
    try {
      const saved = localStorage.getItem('montage-catalog-theme');
      const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = saved || preferred;
    } catch {}
  </script>
  <style>
@import url("studio-shell.css") layer(studio-shell);
${tokenCss}
${recipeCss}

    /* Studio shell (../All/shell/SPEC.md) 브랜드 매핑: 셸 뼈대는 --as-* 로만 스킨을 받는다. */
    :root {
      --as-font-display: var(--font-family-wanted-sans), "Pretendard JP Variable", Pretendard, sans-serif;
      --as-font-text: "Pretendard JP Variable", Pretendard, var(--font-family-wanted-sans), sans-serif;
      --as-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      --as-ink: var(--semantic-label-normal);
      --as-ink-2: var(--semantic-label-neutral);
      --as-ink-3: var(--semantic-label-neutral);
      --as-muted: var(--semantic-label-alternative);
      --as-faint: var(--semantic-label-alternative);
      --as-faint-2: var(--semantic-label-alternative);
      --as-line: var(--semantic-line-normal-alternative);
      --as-line-strong: var(--semantic-line-normal-normal);
      --as-accent: var(--semantic-primary-normal);
      --as-accent-hover: var(--semantic-primary-strong);
      --as-accent-active: var(--semantic-primary-heavy);
      --as-link: var(--semantic-primary-normal);
      --as-on-accent: var(--semantic-static-white);
      --as-bg: var(--semantic-background-normal-normal);
      --as-surface: var(--semantic-fill-alternative);
      --as-sidebar-bg: var(--semantic-background-normal-alternative);
      --as-nav-hover: var(--semantic-fill-alternative);
      --as-nav-active-bg: var(--semantic-fill-normal);
      --as-nav-active-ink: var(--semantic-label-strong);
      --as-status: var(--semantic-status-positive);
      --as-selection: rgba(var(--semantic-primary-normal-rgb), 0.24);
      --as-toast-bg: var(--semantic-inverse-background);
      --as-toast-ink: var(--semantic-inverse-label);
    }

    :root {
      --catalog-sidebar: 260px;
      --catalog-header: 64px;
      --catalog-max: 1360px;
      --catalog-focus: 0 0 0 3px color-mix(in srgb, var(--semantic-primary-normal) 32%, transparent);
      --catalog-icon-filter: none;
      color-scheme: light;
    }

    [data-theme="dark"] { --catalog-icon-filter: invert(1); color-scheme: dark; }

    * { box-sizing: border-box; }

    html { scroll-behavior: smooth; }

    body {
      margin: 0;
      min-width: 320px;
      background: var(--semantic-background-normal-normal);
      color: var(--semantic-label-normal);
      font-family: "Pretendard JP Variable", Pretendard, var(--font-family-wanted-sans);
      font-size: 15px;
      line-height: 1.6;
      word-break: keep-all;
      transition: background-color 160ms ease, color 160ms ease;
    }

    button, input, select { font: inherit; }
    button, a { -webkit-tap-highlight-color: transparent; }
    a { color: inherit; }
    code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }

    :focus-visible {
      outline: none;
      box-shadow: var(--catalog-focus);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }

    .app-header {
      position: sticky;
      inset-block-start: 0;
      z-index: 30;
      display: grid;
      grid-template-columns: var(--catalog-sidebar) minmax(0, 1fr) auto;
      align-items: center;
      min-height: var(--catalog-header);
      padding-inline: max(24px, calc((100vw - var(--catalog-max)) / 2));
      border-bottom: 1px solid var(--semantic-line-normal-alternative);
      background: color-mix(in srgb, var(--semantic-background-normal-normal) 88%, transparent);
      backdrop-filter: blur(18px);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: 11px;
      font-family: var(--font-family-wanted-sans);
      font-size: 18px;
      font-weight: 700;
      text-decoration: none;
      letter-spacing: -0.02em;
    }

    .brand-mark {
      position: relative;
      width: 22px;
      height: 22px;
      border: 2px solid var(--semantic-primary-normal);
      border-radius: 3px;
      transform: rotate(45deg);
    }

    .brand-mark::after {
      content: "";
      position: absolute;
      inset: 5px -7px -7px 5px;
      border: 2px solid #ff5e00;
      border-radius: 50%;
    }

    .search-shell {
      position: relative;
      width: min(560px, 100%);
    }

    .search-shell::before {
      content: "";
      position: absolute;
      inset: 50% auto auto 17px;
      width: 12px;
      height: 12px;
      border: 1.7px solid var(--semantic-label-alternative);
      border-radius: 50%;
      transform: translateY(-60%);
      pointer-events: none;
    }

    .search-shell::after {
      content: "";
      position: absolute;
      inset: calc(50% + 4px) auto auto 28px;
      width: 6px;
      height: 1.7px;
      background: var(--semantic-label-alternative);
      transform: rotate(45deg);
      transform-origin: left center;
      pointer-events: none;
    }

    #catalog-search {
      width: 100%;
      height: 40px;
      padding: 0 46px 0 44px;
      border: 1px solid var(--semantic-line-normal-normal);
      border-radius: 10px;
      background: var(--semantic-fill-alternative);
      color: var(--semantic-label-normal);
    }

    #catalog-search::placeholder { color: var(--semantic-label-alternative); }

    .clear-search {
      position: absolute;
      inset: 7px 8px auto auto;
      width: 26px;
      height: 26px;
      border: 0;
      border-radius: 7px;
      background: transparent;
      color: var(--semantic-label-alternative);
      cursor: pointer;
    }

    .clear-search:hover { background: var(--semantic-fill-normal); }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-left: 20px;
    }

    .icon-action {
      display: inline-grid;
      place-items: center;
      min-width: 40px;
      height: 40px;
      padding: 0 12px;
      border: 1px solid var(--semantic-line-normal-normal);
      border-radius: 10px;
      background: transparent;
      color: var(--semantic-label-normal);
      text-decoration: none;
      cursor: pointer;
    }

    .icon-action:hover { background: var(--semantic-fill-normal); }

    .layout {
      display: grid;
      grid-template-columns: var(--catalog-sidebar) minmax(0, 1fr);
      width: min(100%, var(--catalog-max));
      margin-inline: auto;
      padding-inline: 24px;
    }

    .sidebar {
      position: sticky;
      top: var(--catalog-header);
      height: calc(100vh - var(--catalog-header));
      padding: 40px 28px 32px 0;
      border-right: 1px solid var(--semantic-line-normal-alternative);
      overflow-y: auto;
    }

    .sidebar-label {
      margin: 0 0 10px 12px;
      color: var(--semantic-label-alternative);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .nav-list { display: grid; gap: 4px; }

    .nav-button {
      background: transparent;
      color: var(--semantic-label-alternative);
      text-align: left;
      cursor: pointer;
    }

    .nav-button:hover { background: var(--semantic-fill-alternative); color: var(--semantic-label-normal); }
    .nav-button[aria-current="page"] { background: var(--semantic-fill-normal); color: var(--semantic-label-strong); font-weight: 650; }

    .nav-count {
      min-width: 28px;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--semantic-fill-alternative);
      color: var(--semantic-label-alternative);
      font-size: 11px;
      text-align: center;
    }

    .sidebar-note {
      margin: 10px 12px 0;
      color: var(--semantic-label-alternative);
      font-size: 12px;
    }

    .sidebar-source { margin: 32px 12px 0; padding-top: 20px; border-top: 1px solid var(--semantic-line-normal-alternative); }
    .sidebar-source a { display: inline-flex; align-items: center; min-height: 34px; padding: 0 10px; border-radius: 8px; background: var(--semantic-fill-alternative); color: var(--semantic-label-normal); font-size: 12px; font-weight: 650; text-decoration: none; }
    .sidebar-source a:hover { background: var(--semantic-fill-normal); color: var(--semantic-primary-normal); }

    /* 여백은 studio-shell 의 .as-workspace 가 담당한다(옛 셸 규칙 제거). */
    main { min-width: 0; }

    .page-heading {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 34px;
    }

    .eyebrow {
      display: block;
      margin-bottom: 8px;
      color: var(--semantic-primary-normal);
      font-size: 12px;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1, h2, h3 { font-family: var(--font-family-wanted-sans); letter-spacing: -0.028em; }
    h1 { margin: 0; font-size: clamp(36px, 5vw, 64px); line-height: 1.05; }
    h2 { margin: 0; font-size: clamp(25px, 3vw, 36px); line-height: 1.2; }
    h3 { margin: 0; font-size: 18px; line-height: 1.35; }

    .lede {
      max-width: 720px;
      margin: 16px 0 0;
      color: var(--semantic-label-neutral);
      font-size: 16px;
      line-height: 1.65;
    }

    .section-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      border-top: 1px solid var(--semantic-line-normal-normal);
      border-bottom: 1px solid var(--semantic-line-normal-normal);
    }

    .metric {
      min-width: 0;
      padding: 24px;
      border-right: 1px solid var(--semantic-line-normal-normal);
    }

    .metric:first-child { padding-left: 0; }
    .metric:last-child { border-right: 0; }
    .metric strong { display: block; font: 700 32px/1 var(--font-family-wanted-sans); letter-spacing: -0.03em; }
    .metric span { display: block; margin-top: 8px; color: var(--semantic-label-alternative); font-size: 12px; }

    .feature-shot {
      margin: 42px 0 0;
      overflow: hidden;
      border: 1px solid var(--semantic-line-normal-normal);
      border-radius: 18px;
      background: var(--semantic-background-normal-alternative);
    }

    .feature-shot img { display: block; width: 100%; height: auto; }

    .source-hero {
      margin-top: 40px;
      padding: 34px;
      overflow: hidden;
      border: 1px solid var(--semantic-line-normal-normal);
      border-radius: 18px;
      background:
        radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--semantic-primary-normal) 22%, transparent), transparent 30%),
        linear-gradient(135deg, var(--semantic-background-normal-alternative), var(--semantic-background-normal-normal));
    }

    .shape-ribbon {
      display: grid;
      grid-template-columns: repeat(7, minmax(72px, 1fr));
      gap: 16px;
      align-items: center;
    }

    .shape-ribbon img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: contain;
      filter: saturate(1.1);
    }

    .overview-links {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }

    .overview-card {
      min-height: 132px;
      padding: 18px;
      border: 1px solid var(--semantic-line-normal-alternative);
      border-radius: 14px;
      background: var(--semantic-background-elevated-normal);
      text-decoration: none;
      transition: border-color 140ms ease, transform 140ms ease, background-color 140ms ease;
    }

    .overview-card:hover {
      border-color: var(--semantic-primary-normal);
      background: var(--semantic-background-normal-alternative);
      transform: translateY(-2px);
    }

    .overview-card strong { display: block; margin-top: 12px; font-size: 18px; }
    .overview-card span { display: block; margin-top: 7px; color: var(--semantic-label-alternative); font-size: 12px; line-height: 1.45; }

    .principles {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 42px;
      border-top: 1px solid var(--semantic-line-normal-normal);
    }

    .principle { padding: 28px 28px 0 0; }
    .principle-index { color: var(--semantic-primary-normal); font: 650 12px/1 var(--font-family-wanted-sans); }
    .principle p { margin: 10px 0 0; color: var(--semantic-label-alternative); }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .segmented { display: inline-flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--semantic-fill-alternative); }
    .segment { min-height: 34px; padding: 0 13px; border: 0; border-radius: 7px; background: transparent; color: var(--semantic-label-alternative); cursor: pointer; }
    .segment[aria-pressed="true"] { background: var(--semantic-background-elevated-normal); color: var(--semantic-label-strong); }

    .result-count { color: var(--semantic-label-alternative); font-size: 12px; }

    .catalog-list { display: grid; border-top: 1px solid var(--semantic-line-normal-normal); }

    .catalog-item { border-bottom: 1px solid var(--semantic-line-normal-normal); }
    .catalog-item summary { display: grid; grid-template-columns: minmax(150px, 0.8fr) minmax(0, 1.7fr) auto; gap: 24px; align-items: center; min-height: 76px; padding: 14px 4px; list-style: none; cursor: pointer; }
    .catalog-item summary::-webkit-details-marker { display: none; }
    .catalog-item summary::after { content: "+"; color: var(--semantic-label-alternative); font-size: 22px; }
    .catalog-item[open] summary::after { content: "−"; }
    .catalog-item summary:hover h3 { color: var(--semantic-primary-normal); }
    .catalog-meta { color: var(--semantic-label-neutral); font-size: 12px; text-transform: capitalize; }
    .catalog-description { margin: 0; color: var(--semantic-label-neutral); line-height: 1.55; }

    .detail-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(260px, 42%);
      gap: 32px;
      padding: 4px 4px 34px;
    }

    .detail-section-list { display: flex; flex-wrap: wrap; gap: 7px; margin: 16px 0 0; padding: 0; list-style: none; }
    .detail-section-list li { padding: 5px 9px; border: 1px solid var(--semantic-line-normal-normal); border-radius: 7px; color: var(--semantic-label-alternative); font-size: 12px; }
    .surface-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
    .surface-link { padding: 7px 10px; border-radius: 8px; background: var(--semantic-fill-alternative); color: var(--semantic-label-normal); font-size: 12px; text-decoration: none; text-transform: none; }
    .surface-link:hover { background: var(--semantic-fill-normal); }
    button.surface-link { border: 0; cursor: pointer; }
    .detail-preview { overflow: hidden; align-self: start; border: 1px solid var(--semantic-line-normal-normal); border-radius: 14px; background: #fff; }
    .detail-preview img { display: block; width: 100%; height: auto; min-height: 140px; object-fit: cover; }

    .code-panel {
      margin-top: 18px;
      overflow: hidden;
      border: 1px solid var(--semantic-line-normal-alternative);
      border-radius: 12px;
      background: var(--semantic-background-elevated-normal);
    }

    .code-panel header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 11px 12px;
      border-bottom: 1px solid var(--semantic-line-normal-alternative);
    }

    .code-panel pre {
      max-height: 230px;
      margin: 0;
      padding: 14px;
      overflow: auto;
      color: var(--semantic-label-neutral);
      font-size: 11px;
      line-height: 1.55;
      white-space: pre-wrap;
    }

    .token-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 24px; border-top: 1px solid var(--semantic-line-normal-normal); }
    .token-item { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 12px; align-items: center; min-height: 68px; border-bottom: 1px solid var(--semantic-line-normal-alternative); }
    .swatch { width: 36px; height: 36px; border: 1px solid var(--semantic-line-normal-normal); border-radius: 9px; background: var(--semantic-fill-alternative); }
    .token-name { min-width: 0; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
    .token-value { color: var(--semantic-label-alternative); font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .copy-token { justify-self: end; min-height: 30px; padding: 0 9px; border: 1px solid var(--semantic-line-normal-normal); border-radius: 8px; background: transparent; color: var(--semantic-label-alternative); cursor: pointer; font-size: 11px; }
    .copy-token:hover { background: var(--semantic-fill-normal); color: var(--semantic-primary-normal); }

    .icon-controls, .asset-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .field-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 34px; padding: 0 10px; border: 1px solid var(--semantic-line-normal-normal); border-radius: 9px; background: var(--semantic-fill-alternative); color: var(--semantic-label-alternative); font-size: 12px; }
    .field-chip input, .field-chip select { accent-color: var(--semantic-primary-normal); border: 0; background: transparent; color: inherit; }
    .field-chip input[type="color"] { width: 28px; height: 24px; padding: 0; border-radius: 6px; }
    .icon-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); border-top: 1px solid var(--semantic-line-normal-normal); border-left: 1px solid var(--semantic-line-normal-normal); }
    .icon-name { display: grid; grid-template-rows: 54px auto auto; place-items: center; gap: 10px; min-height: 154px; padding: 16px 10px; border-right: 1px solid var(--semantic-line-normal-normal); border-bottom: 1px solid var(--semantic-line-normal-normal); color: var(--semantic-label-alternative); font: 11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; text-align: center; overflow-wrap: anywhere; }
    .icon-preview, .utility-preview { display: grid; flex: 0 0 auto; place-items: center; width: 48px; height: 48px; border: 1px solid var(--semantic-line-normal-alternative); border-radius: 14px; background: var(--semantic-fill-alternative); }
    .icon-preview img { width: var(--icon-size, 28px); height: var(--icon-size, 28px); filter: var(--catalog-icon-filter); }
    .icon-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }

    .utility-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .utility-card { display: flex; min-width: 0; }
    .utility-card a { display: grid; grid-template-rows: auto auto auto 1fr auto; gap: 14px; width: 100%; height: 100%; min-height: 232px; padding: 22px; border: 1px solid var(--semantic-line-normal-alternative); border-radius: 16px; background: var(--semantic-background-elevated-normal); text-decoration: none; transition: border-color 140ms ease, transform 140ms ease, background-color 140ms ease; }
    .utility-card a:hover { border-color: var(--semantic-primary-normal); background: var(--semantic-background-normal-alternative); transform: translateY(-2px); }
    .utility-preview { width: 52px; height: 52px; color: var(--semantic-label-normal); }
    .utility-preview img { width: 26px; height: 26px; filter: var(--catalog-icon-filter); }
    .utility-card h3 { margin: 0; font-size: 17px; line-height: 1.35; overflow-wrap: anywhere; }
    .utility-card .catalog-description { color: var(--semantic-label-neutral); display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
    .utility-open { align-self: end; color: var(--semantic-primary-normal); font-size: 12px; font-weight: 600; }

    .gradient-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .gradient-card { overflow: hidden; border: 1px solid var(--semantic-line-normal-alternative); border-radius: 18px; background: var(--semantic-background-elevated-normal); }
    .gradient-sample { position: relative; height: 220px; overflow: hidden; border-bottom: 1px solid var(--semantic-line-normal-alternative); background: var(--gradient-base); isolation: isolate; }
    .gradient-sample::before { content: ""; position: absolute; inset: 0; z-index: 0; background-image: linear-gradient(color-mix(in srgb, var(--semantic-static-white) 12%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--semantic-static-white) 12%, transparent) 1px, transparent 1px); background-size: 22px 22px; }
    .gradient-sample--solid::after, .gradient-sample--multiple::after { content: ""; position: absolute; inset: 0; z-index: 1; background: var(--gradient-paint); }
    .gradient-sample--mask::after { content: "MONTAGE"; position: absolute; inset: 34px 26px; z-index: 1; display: grid; place-items: center; border-radius: 12px; background: var(--gradient-color); color: var(--gradient-base); font: 750 28px/1 var(--font-family-wanted-sans); letter-spacing: .08em; -webkit-mask-image: var(--gradient-mask); mask-image: var(--gradient-mask); }
    .gradient-sample-label { position: absolute; right: 16px; bottom: 14px; z-index: 2; padding: 6px 9px; border: 1px solid color-mix(in srgb, var(--semantic-static-white) 24%, transparent); border-radius: 999px; background: color-mix(in srgb, var(--semantic-static-black) 48%, transparent); color: var(--semantic-static-white); font: 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace; backdrop-filter: blur(8px); }
    .gradient-body { display: grid; gap: 14px; padding: 22px; }
    .gradient-body h3 { margin: 0; font-size: 20px; }
    .gradient-body p { min-height: 44px; margin: 0; color: var(--semantic-label-alternative); line-height: 1.55; }
    .gradient-signature { overflow: hidden; padding: 10px 12px; border-radius: 10px; background: var(--semantic-fill-alternative); color: var(--semantic-label-neutral); font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
    .gradient-token-list { display: grid; gap: 8px; }
    .gradient-token { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 10px; align-items: center; }
    .gradient-chip { width: 28px; height: 28px; border: 1px solid var(--semantic-line-normal-normal); border-radius: 8px; background: var(--gradient-color); }
    .gradient-token code { min-width: 0; overflow: hidden; color: var(--semantic-label-alternative); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .gradient-token small { display: block; color: var(--semantic-label-alternative); font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }

    .shape-section { margin-top: 52px; }
    .shape-section:first-of-type { margin-top: 0; }
    .shape-grid { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: 8px; }
    .shape-tile { min-width: 0; overflow: hidden; border: 1px solid var(--semantic-line-normal-alternative); border-radius: 12px; background: var(--semantic-background-elevated-normal); }
    .shape-tile:hover .shape-media img, .shape-feature:hover .shape-media img { animation: shape-breathe 900ms ease-in-out both; }
    .shape-media { display: grid; place-items: center; min-height: 72px; padding: 8px; background: #1b1c1e; }
    .shape-media img { display: block; width: 100%; height: 100%; max-height: 64px; object-fit: contain; }
    .shape-caption { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; }
    .shape-tile .shape-caption { justify-content: center; min-height: 34px; padding: 7px 6px; }
    .shape-caption strong { font-size: 10px; white-space: nowrap; }
    .shape-caption span { color: var(--semantic-label-alternative); font: 10px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .shape-feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .shape-feature { display: grid; overflow: hidden; border: 1px solid var(--semantic-line-normal-alternative); border-radius: 16px; background: var(--semantic-background-elevated-normal); text-decoration: none; }
    .shape-feature .shape-media { min-height: 210px; }
    .shape-feature .shape-media img { max-height: 190px; }
    .shape-feature h3 { margin: 0; padding: 16px 18px 4px; font-size: 16px; }
    .shape-feature p { margin: 0; padding: 0 18px 18px; color: var(--semantic-label-alternative); font-size: 12px; }
    .shape-feature:hover { border-color: var(--semantic-primary-normal); }

    @keyframes shape-breathe {
      0% { transform: scale(1) rotate(0deg); }
      50% { transform: scale(1.08) rotate(2deg); }
      100% { transform: scale(1) rotate(0deg); }
    }

    .playground-grid, .surface-grid, .motion-grid, .source-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .demo-card, .surface-card, .motion-card, .source-card {
      min-width: 0;
      padding: 22px;
      border: 1px solid var(--semantic-line-normal-alternative);
      border-radius: 14px;
      background: var(--semantic-background-elevated-normal);
    }

    .demo-stage {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      min-height: 112px;
      margin-top: 16px;
      padding: 20px;
      border-radius: 12px;
      background: var(--semantic-background-normal-alternative);
    }

    .ds-button { min-height: 44px; padding: 0 18px; border: 1px solid transparent; border-radius: 8px; background: var(--semantic-primary-normal); color: var(--semantic-static-white); font-weight: 650; cursor: pointer; }
    .ds-button:hover { background: var(--semantic-primary-strong); }
    .ds-button.secondary { border-color: var(--semantic-line-normal-normal); background: var(--semantic-fill-alternative); color: var(--semantic-label-normal); }
    .ds-button[aria-pressed="true"], .ds-button.loading { background: var(--semantic-primary-strong); }
    .ds-button.loading::before { content: ""; display: inline-block; width: 13px; height: 13px; margin-right: 8px; border: 2px solid color-mix(in srgb, currentColor 45%, transparent); border-top-color: currentColor; border-radius: 50%; vertical-align: -2px; animation: spin 850ms linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .ds-switch { position: relative; width: 48px; height: 28px; border: 0; border-radius: 999px; background: var(--semantic-fill-strong); cursor: pointer; }
    .ds-switch::after { content: ""; position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: var(--semantic-static-white); transition: transform 160ms ease; }
    .ds-switch[aria-checked="true"] { background: var(--semantic-primary-normal); }
    .ds-switch[aria-checked="true"]::after { transform: translateX(20px); }
    .ds-check, .ds-radio { display: inline-flex; align-items: center; gap: 8px; color: var(--semantic-label-neutral); cursor: pointer; }
    .ds-check input, .ds-radio input { width: 18px; height: 18px; accent-color: var(--semantic-primary-normal); }
    .ds-tabs { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--semantic-fill-alternative); }
    .ds-tab { min-height: 34px; padding: 0 13px; border: 0; border-radius: 7px; background: transparent; color: var(--semantic-label-alternative); cursor: pointer; }
    .ds-tab[aria-selected="true"] { background: var(--semantic-background-elevated-normal); color: var(--semantic-primary-normal); font-weight: 650; }
    .ds-accordion { width: 100%; border: 1px solid var(--semantic-line-normal-normal); border-radius: 10px; background: var(--semantic-background-elevated-normal); }
    .ds-accordion summary { min-height: 44px; padding: 10px 14px; cursor: pointer; font-weight: 650; }
    .ds-accordion p { margin: 0; padding: 0 14px 14px; color: var(--semantic-label-alternative); }
    .ds-range { width: min(260px, 100%); accent-color: var(--semantic-primary-normal); }
    .toast-stack { position: fixed; right: 20px; bottom: 20px; z-index: 50; display: grid; gap: 8px; }
    .toast { padding: 12px 14px; border: 1px solid var(--semantic-line-normal-normal); border-radius: 10px; background: var(--semantic-inverse-background); color: var(--semantic-inverse-label); box-shadow: var(--semantic-elevation-shadow-normal-large); }
    dialog.demo-dialog { width: min(420px, calc(100vw - 32px)); border: 1px solid var(--semantic-line-normal-normal); border-radius: 14px; background: var(--semantic-background-elevated-normal); color: var(--semantic-label-normal); }
    dialog.demo-dialog::backdrop { background: rgba(0, 0, 0, .38); }

    .surface-sample { min-height: 126px; margin-top: 16px; padding: 18px; }
    .motion-sample { position: relative; display: grid; place-items: center; width: 96px; height: 96px; margin-top: 18px; border-radius: 12px; color: var(--semantic-label-normal); fill: var(--semantic-primary-normal); }
    .motion-sample > img { display: block; width: 100%; height: 100%; object-fit: contain; }
    .motion-sample--feedback { width: 160px; height: 44px; font-size: 14px; background: var(--semantic-inverse-background); color: var(--semantic-inverse-label); }
    .motion-sample--skeleton { width: 180px; height: 44px; background: var(--semantic-fill-normal); }
    .motion-sample--marquee { display: flex; width: 220px; gap: 12px; overflow: hidden; }
    .motion-sample--marquee > img { flex: 0 0 60px; width: 60px; height: 60px; }
    .motion-sample--press { width: 160px; height: 44px; background: var(--semantic-fill-normal); }
    .source-card { overflow-wrap: anywhere; }
    .source-code { margin-top: 14px; }
    .source-code summary { cursor: pointer; color: var(--semantic-primary-normal); font-size: 13px; }
    .source-code pre { max-height: 280px; overflow: auto; font-size: 11px; white-space: pre-wrap; color: var(--semantic-label-neutral); }
    button:disabled { cursor: not-allowed; }
    .pager button:disabled { opacity: .45; }
    .motion-card:hover .motion-sample:not([data-motion-class]) { animation: motion-rise var(--motion-duration, 220ms) var(--motion-easing, cubic-bezier(.2, 0, 0, 1)) both; }
    .motion-sample svg { width: 100%; height: 100%; }
    .motion-sample circle { stroke: var(--semantic-primary-normal); }
    .motion-sample path { fill: inherit; }
    @keyframes motion-rise { from { transform: translateY(0) scale(1); opacity: .72; } to { transform: translateY(-8px) scale(1.04); opacity: 1; } }

    .asset-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .asset-card { min-width: 0; overflow: hidden; border: 1px solid var(--semantic-line-normal-alternative); border-radius: 12px; background: var(--semantic-background-elevated-normal); }
    .asset-card img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: #fff; }
    .asset-body { display: grid; gap: 8px; padding: 12px; }
    .asset-body code { overflow: hidden; color: var(--semantic-label-alternative); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
    .pager { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }

    .table-wrap { overflow-x: auto; border-top: 1px solid var(--semantic-line-normal-normal); }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th, td { padding: 14px 16px; border-bottom: 1px solid var(--semantic-line-normal-alternative); white-space: nowrap; }
    th { color: var(--semantic-label-alternative); font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase; }

    .empty { padding: 72px 0; border-top: 1px solid var(--semantic-line-normal-normal); color: var(--semantic-label-alternative); text-align: center; }

    .footer {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-top: 72px;
      padding-top: 24px;
      border-top: 1px solid var(--semantic-line-normal-alternative);
      color: var(--semantic-label-alternative);
      font-size: 12px;
    }

    @media (max-width: 1440px) {
      .app-header { padding-inline: 24px; }
    }

    @media (max-width: 1024px) {
      :root { --catalog-sidebar: 210px; }
      .section-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .metric:nth-child(2) { border-right: 0; }
      .metric:nth-child(-n+2) { border-bottom: 1px solid var(--semantic-line-normal-normal); }
      .token-grid { grid-template-columns: 1fr; }
      .icon-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .utility-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gradient-grid { grid-template-columns: 1fr; }
      .overview-links, .playground-grid, .surface-grid, .motion-grid, .source-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .asset-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .gradient-sample { height: 190px; }
      .shape-grid { grid-template-columns: repeat(8, minmax(0, 1fr)); }
    }

    @media (max-width: 768px) {
      .app-header { grid-template-columns: 1fr auto; gap: 10px; padding: 10px 16px; }
      .brand { min-height: 40px; }
      .search-shell { grid-column: 1 / -1; grid-row: 2; width: 100%; }
      .source-action { display: none; }
      .layout { display: block; padding-inline: 0; }
      .sidebar { position: sticky; top: 118px; z-index: 20; height: auto; padding: 8px 16px; border-right: 0; border-bottom: 1px solid var(--semantic-line-normal-alternative); background: var(--semantic-background-normal-normal); overflow-x: auto; }
      .sidebar-label, .sidebar-note, .sidebar-source { display: none; }
      .page-heading { display: block; }
      .catalog-item summary { grid-template-columns: minmax(120px, 0.7fr) minmax(0, 1.3fr) auto; gap: 16px; }
      .detail-body { grid-template-columns: 1fr; }
      .detail-preview { max-width: 560px; }
      .icon-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .utility-grid { grid-template-columns: 1fr; }
      .overview-links, .playground-grid, .surface-grid, .motion-grid, .source-grid { grid-template-columns: 1fr; }
      .asset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .utility-card a { min-height: 0; }
      .shape-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
      .shape-feature-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 375px) {
      .app-header { padding-inline: 12px; }
      .header-actions { padding-left: 0; }
      .page-heading { margin-bottom: 26px; }
      h1 { font-size: 36px; }
      .section-grid { grid-template-columns: 1fr 1fr; }
      .metric { padding: 18px 12px; }
      .metric strong { font-size: 25px; }
      .principles { grid-template-columns: 1fr; }
      .catalog-item summary { grid-template-columns: 1fr auto; gap: 8px; }
      .catalog-description { color: var(--semantic-label-neutral); grid-column: 1 / -1; }
      .token-item { grid-template-columns: 38px minmax(0, 1fr); }
      .token-value { grid-column: 2; padding-bottom: 10px; }
      .copy-token { grid-column: 2; justify-self: start; margin-bottom: 10px; }
      .icon-grid { grid-template-columns: 1fr 1fr; }
      .shape-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .footer { flex-direction: column; align-items: flex-start; gap: 8px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
    }

    /* ==========================================================================
       Studio shell 연결 레이어 (../All/shell/SPEC.md)
       studio-shell.css 는 @layer studio-shell 로 로드돼 이 파일의 브랜드 규칙이 항상 우선한다.
       아래는 셸 뼈대와 Montage 브랜드 스킨을 맞추는 최소 보정만 담는다.
       ========================================================================== */
    .as-studio { font-size: 15px; line-height: 1.6; }
    .as-brand-mark { width: 22px; height: 30px; }
    .as-brand-mark .brand-mark { width: 18px; height: 18px; }
    .as-brand.brand { gap: 12px; font-size: 15px; }
    .as-brand strong { font-size: 17px; line-height: 1.2; letter-spacing: -0.02em; }
    .as-brand div > span { margin-top: 3px; }
    .as-brand-badge { border-color: var(--semantic-line-normal-normal); }

    .as-sidebar-bottom { flex-wrap: wrap; }
    .as-sidebar-bottom > a {
      display: inline-flex;
      flex: 1 0 100%;
      align-items: center;
      justify-content: center;
      min-height: 32px;
      margin: 12px 0 0;
      border-radius: 8px;
      background: var(--semantic-fill-alternative);
      color: var(--semantic-label-normal);
      font-size: 11px;
      font-weight: 650;
    }
    .as-sidebar-bottom > a:hover { background: var(--semantic-fill-normal); color: var(--semantic-primary-normal); }
    .as-sidebar .as-nav-count { margin-left: auto; min-width: 0; padding: 2px 7px; font-size: 10px; }
    .as-sidebar-scrim[hidden] { display: none; }

    .as-topbar { padding-inline: 28px; }
    .as-mobile-nav-button { color: var(--semantic-label-normal); }
    .as-topbar-tools .icon-action { min-width: 40px; height: 40px; }
    .as-topbar-tools .as-export-button {
      min-height: 40px;
      padding: 0 12px;
      gap: 8px;
      border-color: var(--semantic-line-normal-normal);
      border-radius: 10px;
      font-size: 12px;
    }
    .as-topbar-tools .as-export-button:hover { background: var(--semantic-fill-normal); }
    .as-topbar-search.search-shell {
      width: min(320px, 26vw);
      min-width: 0;
      height: 40px;
      border-color: var(--semantic-line-normal-normal);
      border-radius: 10px;
      background: var(--semantic-fill-alternative);
      font-size: 13px;
    }
    .as-topbar-search.search-shell::before, .as-topbar-search.search-shell::after { content: none; }
    .as-topbar-search svg { color: var(--semantic-label-alternative); }
    .as-topbar-search #catalog-search { height: 38px; padding: 0; border: 0; border-radius: 0; background: transparent; font-size: 13px; }
    .as-topbar-search .clear-search { position: static; inset: auto; flex: none; width: 22px; height: 22px; }

    .as-eyebrow { display: flex; align-items: center; gap: 8px; margin-bottom: 0; font-size: 11px; }
    .as-section-heading .as-eyebrow { margin-bottom: 13px; }
    .as-overview-title h1 { font-size: 56px; line-height: 1.1; }
    .as-overview-title .as-intro { max-width: 720px; margin: 12px 0 0; font-size: 19px; }
    .as-workspace:not(.as-page-overview) > .as-section-heading h1 { font-size: 36px; line-height: 1.2; }
    .as-title-actions .as-button { color: var(--semantic-static-white); }
    .as-title-actions .as-text-command { color: var(--semantic-label-neutral); }
    .as-title-actions .as-text-command:hover { color: var(--semantic-primary-normal); }
    .as-stats-strip > .metric { padding: 0 0 0 26px; }
    .as-stats-strip > .metric:first-child { padding-left: 0; }
    #catalog-main.as-workspace { padding-bottom: 48px; }

    @media (max-width: 1200px) { .as-topbar { padding-inline: 22px; } }

    @media (max-width: 900px) {
      .as-overview-title h1 { font-size: 48px; }
      .as-topbar-search.search-shell { width: min(240px, 30vw); }
    }

    @media (max-width: 640px) {
      .as-topbar { padding-inline: 16px; }
      .as-topbar-tools { gap: 6px; }
      .as-topbar-search.search-shell { display: flex; flex: 1 1 auto; width: auto; min-width: 0; height: 34px; }
      .as-topbar-search #catalog-search { height: 32px; }
      .as-topbar-tools .icon-action { min-width: 34px; width: 34px; height: 34px; padding: 0; }
      .as-topbar-tools .as-export-button { min-height: 34px; padding: 0 8px; gap: 6px; font-size: 10px; }
      .as-overview-title h1 { font-size: 40px; }
      .as-overview-title .as-intro { font-size: 17px; }
      .as-workspace:not(.as-page-overview) > .as-section-heading h1 { font-size: 30px; }
      .as-stats-strip > .metric { padding-left: 0; }
      .as-stats-strip > .metric:nth-child(2n) { padding-left: 20px; }
    }
  </style>
</head>
<body>
<div class="as-studio">
  <a class="as-skip-link" href="#catalog-main">Skip to content</a>

  <aside id="as-nav" class="as-sidebar" aria-label="카탈로그 탐색">
    <a class="as-brand brand" href="#overview" aria-label="Montage Catalog 홈">
      <span class="as-brand-mark"><span class="brand-mark" aria-hidden="true"></span></span>
      <div>
        <strong>Montage Catalog</strong>
        <span>Design system</span>
      </div>
      <span class="as-brand-badge">DOCS</span>
    </a>
    <div class="as-sidebar-group">
      <span class="as-sidebar-label">WORKSPACE</span>
      <nav class="nav-list" id="catalog-nav" aria-label="Design system"></nav>
    </div>
    <div class="as-sidebar-bottom">
      <span class="as-status-dot"></span>
      <span>${collectedDate} 공개 문서 기준<small>MIT 조건, 브랜드 자산 별도</small></span>
      <a href="https://montage.wanted.co.kr/" target="_blank" rel="noreferrer">출처: Wanted Montage ↗</a>
    </div>
  </aside>
  <button class="as-sidebar-scrim" aria-label="Close navigation" hidden></button>

  <div class="as-main-shell">
    <header class="as-topbar">
      <button class="as-mobile-nav-button" aria-controls="as-nav" aria-expanded="false" aria-label="Open navigation">☰</button>
      <div class="as-breadcrumb">
        <span>Design system</span>
        <span>/</span>
        <strong>Overview</strong>
      </div>
      <div class="as-topbar-tools">
        <div class="as-topbar-search search-shell">
          <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="6.9" cy="6.9" r="4.4"></circle><path d="M10.2 10.2 14 14"></path></svg>
          <label class="sr-only" for="catalog-search" hidden>현재 섹션 검색</label>
          <input id="catalog-search" type="search" autocomplete="off" placeholder="컴포넌트 검색">
          <button class="clear-search" type="button" aria-label="검색어 지우기" hidden>×</button>
        </div>
        <a class="icon-action source-action" href="https://montage.wanted.co.kr/" target="_blank" rel="noreferrer">원본 ↗</a>
        <button id="theme-toggle" class="icon-action" type="button" aria-label="테마 전환">◐</button>
        <a class="as-export-button" href="../data/curated/tokens.css" download>Export tokens <span aria-hidden="true">↧</span></a>
      </div>
    </header>

    <main id="catalog-main" class="wds-reuse as-workspace as-page-overview" tabindex="-1"></main>
  </div>
  <div id="catalog-status" class="sr-only" aria-live="polite"></div>
  <div id="toast-stack" class="toast-stack" aria-live="polite" aria-label="알림"></div>
  <div class="as-toast" role="status"></div>
</div>

  <script>window.__MONTAGE_DATA__ = ${safeJson(data)};</script>
  <script type="module">
    const DATA = window.__MONTAGE_DATA__;
    const main = document.querySelector('#catalog-main');
    const nav = document.querySelector('#catalog-nav');
    const brand = document.querySelector('.brand');
    const search = document.querySelector('#catalog-search');
    const clearSearch = document.querySelector('.clear-search');
    const themeToggle = document.querySelector('#theme-toggle');
    const status = document.querySelector('#catalog-status');
    const toastStack = document.querySelector('#toast-stack');
    const mobileNavButton = document.querySelector('.as-mobile-nav-button');

    // 셸의 모바일 드로어 닫기: renderNav() 가 nav 내용을 교체하면 studio-shell.js 의
    // 버블링 핸들러가 분리된 노드를 만나 자동 닫기를 놓치므로 여기서 토글을 되돌린다.
    const closeMobileNav = () => {
      if (mobileNavButton && mobileNavButton.getAttribute('aria-expanded') === 'true') mobileNavButton.click();
    };

    const state = { view: 'overview', query: '', tokenKind: 'semantic', assetPage: 1, assetCategory: 'all', sourcePage: 1, iconSize: 28, iconColor: 'auto' };
    const supplementalIcons = (DATA.supplementalIcons || []).filter((icon) => icon.name && icon.localPath);
    const displayIconVectors = [...DATA.iconVectors, ...supplementalIcons.filter((icon) => !DATA.iconVectors.some((base) => base.name === icon.name))];
    const iconByName = new Map(displayIconVectors.map((icon) => [icon.name, icon]));
    const componentByName = new Map(DATA.components.map((component) => [component.name.toLocaleLowerCase(), component]));
    const assetPageSize = 48;
    const sourcePageSize = 48;
    const motionCount = DATA.reuseLibrary.motion.length || DATA.gradients.easingStops.length;
    const sourceExampleCount = DATA.reuseLibrary.examples.length || DATA.metadata.pageCount;
    const views = [
      { id: 'overview', label: 'Overview', count: null },
      { id: 'foundations', label: 'Foundations', count: DATA.typography.length },
      { id: 'components', label: 'Components', count: DATA.components.length },
      { id: 'motion', label: 'Motion', count: motionCount },
      { id: 'interactions', label: 'Interactions', count: 7 },
      { id: 'surfaces', label: 'Surfaces', count: Math.max(DATA.reuseLibrary.surfaces.length, 6) },
      { id: 'tokens', label: 'Tokens', count: Object.keys(DATA.tokens.semantic).length },
      { id: 'gradients', label: 'Gradients', count: DATA.gradients.modes.length },
      { id: 'shapes', label: 'Shapes', count: DATA.shapes.marquee.length },
      { id: 'icons', label: 'Icons', count: displayIconVectors.length },
      { id: 'assets', label: 'Assets', count: DATA.assets.length },
      { id: 'utilities', label: 'Utilities', count: DATA.utilities.length },
      { id: 'sources', label: 'Sources', count: sourceExampleCount },
    ];

    const viewIndex = new Map(views.map((view, index) => [view.id, String(index + 1).padStart(2, '0')]));

    const escapeHtml = (value = '') => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

    const includesQuery = (...parts) => {
      if (!state.query) return true;
      const haystack = parts.flat().filter(Boolean).join(' ').toLocaleLowerCase();
      return haystack.includes(state.query.toLocaleLowerCase());
    };

    const looksLikeCode = (value) => typeof value === 'string' && /\\b(import|const|return|function|class|<\\w|Wanted|@MainActor|struct|val|var)\\b/.test(value) && value.length > 24;
    const codeSamples = (surface, limit = 2) => (surface?.code || []).filter(looksLikeCode).slice(0, limit);
    const componentCode = (component, limit = 3) => {
      const samples = [];
      for (const surface of ['web', 'ios', 'android', 'design']) {
        for (const code of codeSamples(component.surfaces[surface], limit)) {
          samples.push({ surface, code });
          if (samples.length >= limit) return samples;
        }
      }
      return samples;
    };
    const firstCssClass = (css = '') => css.match(/\\.([A-Za-z0-9_-]+)(?:[\\s,[{:.#]|$)/)?.[1] || '';
    const cssDuration = (value) => typeof value === 'number' ? value + 'ms' : (value || '220ms');
    const motionPlayMs = (value) => Math.min(Math.max(Number.parseFloat(cssDuration(value)) || 800, 500), 6000) + 500;
    const motionPreview = (item, className) => {
      const kind = item.id === 'skeleton-shimmer' ? 'skeleton' : ['tooltip-slide','toast-rise'].includes(item.id) ? 'feedback' : item.id === 'press-feedback' ? 'press' : item.id === 'shape-marquee' ? 'marquee' : 'shape';
      const attrs = 'class="motion-sample motion-sample--' + kind + '" data-motion-class="' + escapeHtml(className) + '" data-play-ms="' + motionPlayMs(item.duration) + '" data-status="open" aria-hidden="true"';
      if (item.id === 'circular-loading') return '<div ' + attrs + '><svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="12.5"></circle></svg></div>';
      if (item.id === 'wanted-loading') return '<div ' + attrs + '><svg viewBox="0 0 24 24"><g><path class="circle" d="M2.09998 12.0001C2.09998 6.53248 6.53236 2.1001 12 2.1001C17.4676 2.1001 21.9 6.53248 21.9 12.0001C21.9 17.4677 17.4676 21.9001 12 21.9001C6.53236 21.9001 2.09998 17.4677 2.09998 12.0001Z"></path><path class="triangle" d="M8.53604 5C9.67283 3.03102 10.2412 2.04653 10.9833 1.71614C11.6306 1.42795 12.3697 1.42795 13.017 1.71614C13.7591 2.04653 14.3274 3.03102 15.4642 5L19.7944 12.5C20.9312 14.469 21.4996 15.4535 21.4146 16.2613C21.3406 16.966 20.971 17.6061 20.3978 18.0225C19.7406 18.5 18.6039 18.5 16.3303 18.5H7.67001C5.39643 18.5 4.25964 18.5 3.60247 18.0225C3.02927 17.6061 2.65969 16.966 2.58563 16.2613C2.50072 15.4535 3.06912 14.469 4.20591 12.5L8.53604 5Z"></path><path class="square" d="M8.55001 2.85001H8.51231C7.70426 2.85 7.0434 2.84999 6.50633 2.89387C5.95041 2.93929 5.44833 3.03617 4.97944 3.27508C4.24561 3.64899 3.64899 4.24561 3.27508 4.97944C3.03617 5.44833 2.93929 5.95041 2.89387 6.50632C2.84999 7.04339 2.85 7.70422 2.85001 8.51224V8.55001V15.45V15.4877C2.85 16.2957 2.84999 16.9566 2.89387 17.4937C2.93929 18.0496 3.03617 18.5517 3.27508 19.0206C3.64899 19.7544 4.24561 20.351 4.97944 20.7249C5.44833 20.9638 5.95041 21.0607 6.50633 21.1061C7.0434 21.15 7.70425 21.15 8.5123 21.15H8.55001H15.45H15.4877C16.2958 21.15 16.9566 21.15 17.4937 21.1061C18.0496 21.0607 18.5517 20.9638 19.0206 20.7249C19.7544 20.351 20.351 19.7544 20.7249 19.0206C20.9638 18.5517 21.0607 18.0496 21.1061 17.4937C21.15 16.9566 21.15 16.2958 21.15 15.4877V15.45V8.55001V8.5123C21.15 7.70425 21.15 7.0434 21.1061 6.50632C21.0607 5.95041 20.9638 5.44833 20.7249 4.97944C20.351 4.24561 19.7544 3.64899 19.0206 3.27508C18.5517 3.03617 18.0496 2.93929 17.4937 2.89387C16.9566 2.84999 16.2958 2.85 15.4877 2.85001H15.45H8.55001Z"></path></g></svg></div>';
      if (kind === 'marquee') return '<div ' + attrs + '>' + DATA.shapes.marquee.slice(0, 3).map((shape) => '<img src="' + escapeHtml(shapeImage(shape)) + '" alt="">').join('') + '</div>';
      if (kind === 'skeleton') return '<div ' + attrs + '></div>';
      if (kind === 'feedback') return '<div ' + attrs + '>Montage preview</div>';
      if (kind === 'press') return '<div ' + attrs + '>Press feedback<span class="wds-motion-interaction-overlay"></span></div>';
      const shape = DATA.shapes.marquee[item.id === 'home-shapes-enter' ? 2 : 0];
      return '<div ' + attrs + '><img src="' + escapeHtml(shapeImage(shape)) + '" alt=""></div>';
    };

    const copyButton = (value, label = 'Copy') => '<button class="surface-link" type="button" data-copy="' + escapeHtml(value) + '">' + escapeHtml(label) + '</button>';
    const downloadButton = (href, filename, label = 'Download') => '<a class="surface-link" href="' + escapeHtml(href) + '" download="' + escapeHtml(filename) + '">' + escapeHtml(label) + '</a>';
    const codePanel = (title, code) => '<section class="code-panel"><header><strong>' + escapeHtml(title) + '</strong>' + copyButton(code, 'Copy code') + '</header><pre><code>' + escapeHtml(code) + '</code></pre></section>';

    const notify = (message) => {
      status.textContent = message;
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      toastStack.append(toast);
      setTimeout(() => toast.remove(), 2200);
    };

    async function copyText(value) {
      const active = document.activeElement;
      try {
        await navigator.clipboard.writeText(value);
        notify('복사했습니다.');
      } catch {
        try {
          const area = document.createElement('textarea');
          area.value = value;
          area.className = 'sr-only';
          document.body.append(area);
          area.focus();
          area.select();
          const ok = document.execCommand('copy');
          area.remove();
          if (active?.focus) active.focus({ preventScroll: true });
          if (!ok) throw new Error('copy command rejected');
          notify('복사했습니다.');
        } catch {
          if (active?.focus) active.focus({ preventScroll: true });
          notify('복사할 수 없습니다. 텍스트를 직접 선택해 주세요.');
        }
      }
    }

    const iconPreview = (name, className, label) => {
      const icon = iconByName.get(name) || iconByName.get('IconUtility');
      if (!icon) return '';
      const src = '../' + icon.localPath;
      return '<span class="' + className + '"><img src="' + escapeHtml(src) + '"' + (/Color$/.test(name) || name === 'IconSymbol' ? ' style="filter:none"' : '') + ' alt="' + escapeHtml(label || name) + '"></span>';
    };

    const utilityIconName = (item) => {
      const direct = 'Icon' + item.name.replace(/[^A-Za-z0-9]/g, '');
      if (iconByName.has(direct)) return direct;
      const value = (item.name + ' ' + item.slug).toLocaleLowerCase();
      const rules = [
        [/color|theme|opacity/, 'IconPalette'],
        [/icon/, 'IconComponent'],
        [/animation|presence/, 'IconPlay'],
        [/divider|line/, 'IconLineHorizontal'],
        [/grid|layout|flex|box|spacing|size/, 'IconColumn'],
        [/typography|label|text/, 'IconTextFormat'],
        [/form|foundation|document/, 'IconDocumentText'],
        [/alert|toast|snackbar|message/, 'IconMessage'],
        [/navigation|popper|portal/, 'IconCompass'],
        [/refresh/, 'IconRefresh'],
        [/shadow/, 'IconSquare'],
        [/focus|interaction|touch/, 'IconCirclePoint'],
        [/hidden|dismiss/, 'IconEyeSlash'],
      ];
      const match = rules.find(([pattern]) => pattern.test(value));
      if (match && iconByName.has(match[1])) return match[1];
      if (item.category.startsWith('android')) return 'IconAndroid';
      if (item.category.startsWith('ios')) return 'IconLogoApple';
      return 'IconUtility';
    };

    const titleBlock = (eyebrow, title, description) => \
      '<header class="page-heading as-section-heading"><div>' +
      '<span class="eyebrow as-eyebrow">LIBRARY / ' + (viewIndex.get(state.view) || '01') + ' · <span>' + escapeHtml(eyebrow) + '</span></span>' +
      '<h1>' + escapeHtml(title) + '</h1>' +
      '<p class="lede">' + escapeHtml(description) + '</p></div></header>';

    const overviewTitleBlock = (eyebrow, title, description) => \
      '<div class="as-overview-title"><div class="as-eyebrow eyebrow"><span class="as-status-dot"></span><span>' + escapeHtml(eyebrow) + '</span><span class="as-version">${collectedMonth}</span></div>' +
      '<h1>' + escapeHtml(title) + '</h1>' +
      '<p class="lede as-intro">' + escapeHtml(description) + '</p>' +
      '<div class="as-title-actions">' +
      '<a class="as-button" href="#components" data-view-link="components">Browse components</a>' +
      '<a class="as-text-command" href="https://montage.wanted.co.kr/" target="_blank" rel="noreferrer">원본 사이트 <span aria-hidden="true">↗</span></a>' +
      '</div></div>';

    const footer = () => '<footer class="footer as-studio-footer"><span>Collected from Wanted Montage</span><a href="https://montage.wanted.co.kr/docs/getting-started/terms-of-use" target="_blank" rel="noreferrer">License notes ↗</a></footer>';

    function renderNav() {
      nav.innerHTML = views.map((view, index) => \
        '<button class="nav-button" type="button" data-view="' + view.id + '"' +
        (state.view === view.id ? ' aria-current="page"' : '') +
        '><span class="as-nav-index">' + String(index + 1).padStart(2, '0') + '</span><span>' + view.label + '</span>' +
        (view.count == null ? '' : '<span class="nav-count as-nav-count">' + view.count + '</span>') + '</button>'
      ).join('');
    }

    function renderOverview() {
      const featuredShapes = DATA.shapes.marquee.slice(1, 8).map((item) => '<img src="' + escapeHtml(shapeImage(item)) + '" alt="' + escapeHtml(item.alt || item.name) + '">').join('');
      const cards = [
        ['components', 'Components', DATA.components.length + '개 컴포넌트와 surface별 원본 코드'],
        ['interactions', 'Interactions', '버튼, 폼, 탭, 다이얼로그 네이티브 플레이그라운드'],
        ['assets', 'Assets', DATA.assets.length + '개 이미지 asset 검색과 페이지 탐색'],
        ['sources', 'Sources', '원본 문서, 코드, export 재사용 패키지'],
      ].map(([id, title, copy]) => '<a class="overview-card" href="#' + id + '" data-view-link="' + id + '">' + iconPreview(id === 'assets' ? 'IconImage' : id === 'interactions' ? 'IconCirclePoint' : id === 'sources' ? 'IconDocumentText' : 'IconComponent', 'utility-preview', title) + '<strong>' + title + '</strong><span>' + escapeHtml(copy) + '</span></a>').join('');
      return overviewTitleBlock('Wanted Design System', 'Montage Catalog', '공개 Montage 문서와 다운로드한 자산을 재사용 가능한 토큰, 코드, 상호작용, 소스 링크로 다시 묶은 로컬 디자인 시스템입니다.') +
        '<section class="section-grid as-stats-strip" aria-label="수집 현황">' +
          '<div class="metric"><strong>' + DATA.metadata.pageCount + '</strong><span>Documentation pages</span></div>' +
          '<div class="metric"><strong>' + DATA.components.length + '</strong><span>Components</span></div>' +
          '<div class="metric"><strong>' + DATA.assets.length + '</strong><span>Downloaded images</span></div>' +
          '<div class="metric"><strong>' + displayIconVectors.length + '</strong><span>SVG icons</span></div>' +
        '</section>' +
        '<section class="source-hero" aria-label="Montage source shape inventory"><div class="shape-ribbon">' + featuredShapes + '</div></section>' +
        '<section class="overview-links" aria-label="바로가기">' + cards + '</section>' +
        '<section class="principles" aria-label="Montage 디자인 원칙">' +
          '<article class="principle"><span class="principle-index">01</span><h3>Extensibility</h3><p>컴포넌트의 확장성을 유지하며 구조를 설계합니다.</p></article>' +
          '<article class="principle"><span class="principle-index">02</span><h3>Consistency</h3><p>플랫폼 전반에서 일관된 사용자 경험을 제공합니다.</p></article>' +
          '<article class="principle"><span class="principle-index">03</span><h3>Efficiency</h3><p>일관된 품질을 유지하며 제품 개발 효율을 높입니다.</p></article>' +
        '</section>' + footer();
    }

    function renderFoundations() {
      const rows = DATA.typography.filter((item) => includesQuery(item.name, item.fontSize, item.lineHeight)).map((item) => \
        '<tr><td>' + escapeHtml(item.name) + '</td><td>' + escapeHtml(item.fontSize) + '</td><td>' + escapeHtml(item.lineHeight) + '</td><td>' + escapeHtml(item.letterSpacing) + '</td></tr>'
      ).join('');
      const artboards = DATA.grid.artboards.slice(1).map((row) => '<tr>' + row.map((cell) => '<td>' + escapeHtml(cell) + '</td>').join('') + '</tr>').join('');
      return titleBlock('Foundations', 'Type & Grid', 'Pretendard JP 기반 타이포그래피와 8px 그리드 체계를 정리했습니다.') +
        '<div class="toolbar"><h2>Typography</h2><span class="result-count">' + DATA.typography.length + ' styles</span></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Style</th><th>Size</th><th>Line height</th><th>Letter spacing</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="toolbar" style="margin-top:48px"><h2>Artboards</h2><span class="result-count">8px base · 20px gutter</span></div>' +
        '<div class="table-wrap"><table><thead><tr><th>Environment</th><th>Width</th><th>Height</th><th>Max width</th></tr></thead><tbody>' + artboards + '</tbody></table></div>' + footer();
    }

    function componentItem(component) {
      const design = component.surfaces.design;
      const sections = component.sections.slice(0, 12).map((item) => '<li>' + escapeHtml(item) + '</li>').join('');
      const links = component.availableSurfaces.map((surface) => {
        const href = component.surfaces[surface]?.url;
        return href ? '<a class="surface-link" href="' + escapeHtml(href) + '" target="_blank" rel="noreferrer">' + escapeHtml(surface) + ' ↗</a>' : '';
      }).join('');
      const image = design?.images?.[0]?.src || component.assets[0];
      const previewSrc = DATA.localPreviews[image] ? '../' + DATA.localPreviews[image] : image;
      const snippets = componentCode(component, 2).map((sample) => codePanel(sample.surface + ' source sample', sample.code)).join('');
      return '<details class="catalog-item"><summary><div><span class="catalog-meta">' + escapeHtml(component.category) + '</span><h3>' + escapeHtml(component.name) + '</h3></div><p class="catalog-description">' + escapeHtml(component.description || '플랫폼별 컴포넌트 명세') + '</p></summary>' +
        '<div class="detail-body"><div><h3>Documentation</h3><ul class="detail-section-list">' + sections + '</ul><div class="surface-links">' + links + '</div>' + snippets + '</div>' +
        (image ? '<a class="detail-preview" href="' + escapeHtml(design?.url || image) + '" target="_blank" rel="noreferrer"><img loading="lazy" src="' + escapeHtml(previewSrc) + '" alt="' + escapeHtml(component.name) + ' preview"></a>' : '') + '</div></details>';
    }

    function renderComponents() {
      const items = DATA.components.filter((item) => includesQuery(item.name, item.category, item.description, item.sections)).map(componentItem).join('');
      const count = DATA.components.filter((item) => includesQuery(item.name, item.category, item.description, item.sections)).length;
      return titleBlock('Components', 'Design to code', '디자인 가이드와 Web, iOS, Android 구현 문서를 컴포넌트 단위로 연결했습니다.') +
        '<div class="toolbar"><span class="result-count">' + count + ' results</span></div>' +
        (items ? '<section class="catalog-list">' + items + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    function isColor(value) { return /^(#|rgb|hsl|oklch|transparent$|white$|black$|snow$)/i.test(value); }

    function renderTokens() {
      const tokenSet = DATA.tokens[state.tokenKind];
      const entries = Object.entries(tokenSet).filter(([name, values]) => includesQuery(name, values.light, values.dark));
      const theme = document.documentElement.dataset.theme || 'dark';
      const items = entries.map(([name, values]) => {
        const value = values[theme] || values.light;
        const swatchStyle = isColor(value) ? ' style="background:' + escapeHtml(value) + '"' : '';
        return '<div class="token-item"><span class="swatch"' + swatchStyle + '></span><code class="token-name">' + escapeHtml(name) + '</code><span class="token-value">' + escapeHtml(value) + '</span><button class="copy-token" type="button" data-copy="' + escapeHtml(name + ': ' + value + ';') + '">Copy</button></div>';
      }).join('');
      return titleBlock('Tokens', 'Light & dark', '브라우저가 계산한 실제 Montage CSS 변수입니다. 현재 테마 값이 스와치와 함께 표시됩니다.') +
        '<div class="toolbar"><div class="segmented" aria-label="토큰 종류">' + ['semantic','atomic','system'].map((kind) => '<button class="segment" type="button" data-token-kind="' + kind + '" aria-pressed="' + (state.tokenKind === kind) + '">' + kind + '</button>').join('') + '</div><span class="result-count">' + entries.length + ' tokens</span></div>' +
        (items ? '<section class="token-grid">' + items + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    const gradientPaint = (rgb) => 'linear-gradient(to right, ' + DATA.gradients.easingStops.map((stop) => 'rgba(' + rgb + ', ' + (1 - stop.alpha).toFixed(2) + ') ' + stop.position + '%').join(', ') + ')';

    const gradientMask = (size) => {
      const pixels = Number.parseFloat(size) || 80;
      return 'linear-gradient(to right, ' + DATA.gradients.easingStops.map((stop) => {
        const remaining = (pixels * (1 - stop.position / 100)).toFixed(1).replace(/\.0$/, '');
        return 'rgba(0, 0, 0, ' + (1 - stop.alpha).toFixed(2) + ') calc(100% - ' + remaining + 'px)';
      }).join(', ') + ')';
    };

    function renderGradients() {
      const theme = document.documentElement.dataset.theme || 'dark';
      const entries = DATA.gradients.modes.filter((mode) => includesQuery(mode.name, mode.description, mode.colorToken, mode.baseToken, mode.direction, mode.size));
      const items = entries.map((mode) => {
        const color = DATA.tokens.semantic[mode.colorToken]?.[theme] || 'transparent';
        const colorRgb = DATA.tokens.semantic[mode.colorToken + '-rgb']?.[theme] || '0, 0, 0';
        const base = DATA.tokens.semantic[mode.baseToken]?.[theme] || 'transparent';
        const signature = "gradient(color, '" + mode.direction + "', '" + mode.size + "', '" + mode.id + "')";
        const cssCode = 'background: ' + (mode.id === 'mask' ? gradientMask(mode.size) : gradientPaint(colorRgb)) + ';';
        const style = '--gradient-color:' + color + ';--gradient-base:' + base + ';--gradient-paint:' + gradientPaint(colorRgb) + ';--gradient-mask:' + gradientMask(mode.size);
        const tokenRows = [mode.colorToken, mode.baseToken].filter((token, index, tokens) => token && tokens.indexOf(token) === index).map((token) => {
          const value = DATA.tokens.semantic[token]?.[theme] || 'transparent';
          return '<div class="gradient-token"><span class="gradient-chip" style="--gradient-color:' + escapeHtml(value) + '"></span><div><code>' + escapeHtml(token) + '</code><small>' + escapeHtml(value) + '</small></div></div>';
        }).join('');
        return '<article class="gradient-card"><div class="gradient-sample gradient-sample--' + mode.id + '" style="' + escapeHtml(style) + '"><span class="gradient-sample-label">' + escapeHtml(mode.direction + ' · ' + mode.size) + '</span></div><div class="gradient-body"><span class="catalog-meta">Gradient utility</span><h3>' + escapeHtml(mode.name) + '</h3><p>' + escapeHtml(mode.description) + '</p><div class="gradient-token-list">' + tokenRows + '</div><code class="gradient-signature">' + escapeHtml(signature) + '</code><div class="surface-links">' + copyButton(mode.code || signature, 'Copy source') + copyButton(cssCode, 'Copy CSS') + '<a class="surface-link" href="' + escapeHtml(DATA.gradients.source) + '#'+ escapeHtml(mode.id) + '" target="_blank" rel="noreferrer">원본 예제 ↗</a></div></div></article>';
      }).join('');
      return titleBlock('Gradients', 'Directional fades', 'Montage gradient 유틸리티의 Solid, Multiple, Mask 모드를 현재 테마 컬러로 미리 봅니다.') +
        '<div class="toolbar"><span class="result-count">' + entries.length + ' modes · ' + DATA.gradients.easingStops.length + ' easing stops</span></div>' +
        (items ? '<section class="gradient-grid">' + items + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    const shapeImage = (item) => '../' + item.localPath;

    function renderShapes() {
      const marquee = DATA.shapes.marquee.filter((item) => includesQuery(item.name, item.alt, item.sourceUrl));
      const behind = DATA.shapes.behind.filter((item) => includesQuery(item.name, item.alt, item.sourceUrl));
      const resources = DATA.shapes.resources.filter((item) => includesQuery(item.name, item.title, item.lastUpdated, item.href));
      const tiles = marquee.map((item) => '<article class="shape-tile" title="' + escapeHtml(item.name + ' · ' + item.dimensions.width + '×' + item.dimensions.height) + '"><div class="shape-media"><img src="' + escapeHtml(shapeImage(item)) + '" alt="' + escapeHtml(item.alt || item.name) + '"></div><div class="shape-caption"><strong>' + escapeHtml(item.name) + '</strong></div><div class="surface-links" style="justify-content:center;margin:0 0 10px">' + downloadButton(shapeImage(item), item.id + '.png', 'PNG') + '</div></article>').join('');
      const behindCards = behind.map((item) => '<article class="shape-feature"><div class="shape-media"><img src="' + escapeHtml(shapeImage(item)) + '" alt="' + escapeHtml(item.alt || item.name) + '"></div><h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.alt) + '</p></article>').join('');
      const resourceCards = resources.map((item) => '<article class="shape-feature"><a href="' + escapeHtml(item.href) + '" target="_blank" rel="noreferrer"><div class="shape-media"><img src="../' + escapeHtml(item.previewLocalPath) + '" alt="' + escapeHtml(item.title + ' 도형 미리보기') + '"></div></a><h3>' + escapeHtml(item.title) + '</h3><p>Approx hover playback · ' + escapeHtml(item.frames + ' frames') + '</p><div class="surface-links" style="padding:0 18px 18px;margin-top:0">' + downloadButton('../' + item.previewLocalPath, item.id + '.svg', 'SVG') + downloadButton('../' + item.jsonLocalPath, item.id + '.json', 'Lottie JSON') + '</div></article>').join('');
      return titleBlock('Shapes', 'Gradient shape library', 'Montage 홈 슬라이드의 도형 21종과 Lottie 리소스를 원본 순서로 모았습니다. Hover animation은 의존성 없이 만든 근사 미리보기입니다.') +
        (tiles ? '<section class="shape-section"><div class="toolbar"><div><h2>All 21 shape types</h2><span class="result-count">' + marquee.length + ' of ' + DATA.shapes.marquee.length + ' shapes</span></div></div><div class="shape-grid">' + tiles + '</div></section>' : '') +
        (behindCards ? '<section class="shape-section"><div class="toolbar"><h2>Behind the System</h2><span class="result-count">' + behind.length + ' placements</span></div><div class="shape-feature-grid">' + behindCards + '</div></section>' : '') +
        (resourceCards ? '<section class="shape-section"><div class="toolbar"><h2>Start Your Montage</h2><span class="result-count">' + resources.length + ' Lottie sources</span></div><div class="shape-feature-grid">' + resourceCards + '</div></section>' : '') + footer();
    }

    function renderIcons() {
      const entries = displayIconVectors.filter((icon) => includesQuery(icon.name));
      const controls = '<div class="icon-controls"><label class="field-chip">Size <input data-icon-size type="range" min="16" max="48" value="' + state.iconSize + '"></label><label class="field-chip">Color <select data-icon-color><option value="auto"' + (state.iconColor === 'auto' ? ' selected' : '') + '>theme</option><option value="black"' + (state.iconColor === 'black' ? ' selected' : '') + '>black</option><option value="white"' + (state.iconColor === 'white' ? ' selected' : '') + '>white</option></select></label></div>';
      const style = '--icon-size:' + state.iconSize + 'px;' + (state.iconColor === 'black' ? '--catalog-icon-filter:brightness(0);' : state.iconColor === 'white' ? '--catalog-icon-filter:brightness(0) invert(1);' : '');
      return titleBlock('Icons', 'Icon registry', 'Montage 공개 문서에서 수집한 실제 SVG 아이콘입니다. 이름과 도형을 함께 확인할 수 있습니다.') +
        '<div class="toolbar"><a class="surface-link" href="https://montage.wanted.co.kr/docs/foundations/base-material/icons" target="_blank" rel="noreferrer">원본 아이콘 탐색기 ↗</a>' + controls + '<span class="result-count">' + entries.length + ' names</span></div>' +
        (entries.length ? '<section class="icon-grid" style="' + escapeHtml(style) + '">' + entries.map((icon) => '<div class="icon-name">' + iconPreview(icon.name, 'icon-preview', icon.name + ' 미리보기') + '<span>' + escapeHtml(icon.name) + '</span><div class="icon-actions"><button class="surface-link" type="button" data-copy-svg="../' + escapeHtml(icon.localPath) + '">SVG</button>' + downloadButton('../' + icon.localPath, icon.name + '.svg', 'Download') + '</div></div>').join('') + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    function renderUtilities() {
      const entries = DATA.utilities.filter((item) => includesQuery(item.name, item.category, item.description, item.sections));
      const items = entries.map((item) => '<article class="utility-card"><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noreferrer">' + iconPreview(utilityIconName(item), 'utility-preview', item.name + ' 분류 아이콘') + '<span class="catalog-meta">' + escapeHtml(item.category.replaceAll('-', ' ')) + '</span><h3>' + escapeHtml(item.name) + '</h3><p class="catalog-description">' + escapeHtml(item.description || 'Utility documentation') + '</p><span class="utility-open">문서 열기 ↗</span></a></article>').join('');
      return titleBlock('Utilities', 'Platform helpers', 'Web, iOS, Android에서 디자인 시스템을 구성하는 유틸리티와 기반 컴포넌트입니다.') +
        '<div class="toolbar"><span class="result-count">' + entries.length + ' results</span></div>' +
        (items ? '<section class="utility-grid">' + items + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    function renderMotion() {
      const fallback = [
        { id: 'hover-rise', name: 'Hover rise', description: '카드와 버튼 hover에서 쓰는 짧은 상승감입니다.', duration: '140ms', easing: 'ease' },
        { id: 'press-scale', name: 'Press scale', description: '터치/클릭 피드백을 1프레임 늦지 않게 보여줍니다.', duration: '90ms', easing: 'ease-out' },
        { id: 'toast-in', name: 'Toast entrance', description: '피드백 컴포넌트는 아래에서 들어오고 빠르게 안정됩니다.', duration: '220ms', easing: 'cubic-bezier(.2, 0, 0, 1)' },
        { id: 'shape-hover', name: 'Shape hover', description: 'Lottie 의존성 없이 만든 도형 hover 근사 재생입니다.', duration: '900ms', easing: 'ease-in-out' },
      ];
      const entries = (DATA.reuseLibrary.motion.length ? DATA.reuseLibrary.motion : fallback).filter((item) => includesQuery(item.name, item.description, item.easing, item.duration));
      const cards = entries.map((item) => {
        const css = item.css || '.example { transition: transform ' + (item.duration || '160ms') + ' ' + (item.easing || 'ease') + '; }';
        const className = firstCssClass(css);
        return '<article class="motion-card" style="--motion-duration:' + escapeHtml(cssDuration(item.duration)) + ';--motion-easing:' + escapeHtml(item.easing || 'ease') + '"><span class="catalog-meta">' + escapeHtml(cssDuration(item.duration)) + ' · ' + escapeHtml(item.easing || 'ease') + ' · ' + escapeHtml(item.evidence || 'reconstructed') + '</span><h3>' + escapeHtml(item.name) + '</h3><p class="catalog-description">' + escapeHtml(item.description || 'Reconstructed from source interaction timing.') + '</p>' + motionPreview(item, className) + '<div class="surface-links"><button class="surface-link" type="button" data-replay-motion="' + escapeHtml(className) + '">Replay</button>' + copyButton(css, 'Copy CSS') + '<a class="surface-link" href="../data/curated/recipes.css" target="_blank" rel="noreferrer">recipes.css ↗</a>' + (item.sourceUrl ? '<a class="surface-link" href="' + escapeHtml(item.sourceUrl) + '" target="_blank" rel="noreferrer">Source ↗</a>' : '') + '</div></article>';
      }).join('');
      return titleBlock('Motion', 'Timing & movement', '공개 소스에서 확인되는 짧은 전환과 홈 도형 움직임을 재사용 가능한 CSS 단위로 정리했습니다.') +
        '<div class="toolbar"><span class="result-count">' + entries.length + ' motion recipes</span></div>' +
        (cards ? '<section class="motion-grid">' + cards + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    function renderInteractions() {
      const button = componentByName.get('button');
      const switchComponent = componentByName.get('switch');
      const checkbox = componentByName.get('checkbox');
      const radio = componentByName.get('radio');
      const accordion = componentByName.get('accordion');
      const tab = componentByName.get('tab');
      const slider = componentByName.get('slider');
      const demos = [
        ['buttons', 'Buttons & loading', '<button class="ds-button" type="button" data-demo-loading>Submit</button><button class="ds-button secondary" type="button" aria-pressed="false" data-toggle-pressed>Toggle</button>', button],
        ['selection', 'Switch, checkbox, radio', '<button class="ds-switch" type="button" role="switch" aria-label="알림 받기" aria-checked="false" data-switch></button><label class="ds-check"><input type="checkbox" checked> Checkbox</label><label class="ds-radio"><input type="radio" name="demo-radio" checked> Radio A</label><label class="ds-radio"><input type="radio" name="demo-radio"> Radio B</label>', switchComponent || checkbox || radio],
        ['accordion', 'Accordion', '<details class="ds-accordion"><summary>Accordion summary</summary><p>접힘/펼침, 키보드 focus, native semantics를 유지합니다.</p></details>', accordion],
        ['tabs', 'Tabs', '<div><div class="ds-tabs" role="tablist" aria-label="Demo tabs"><button id="demo-tab-overview" class="ds-tab" type="button" role="tab" aria-selected="true" aria-controls="demo-panel-tabs" data-tab>Overview</button><button id="demo-tab-code" class="ds-tab" type="button" role="tab" tabindex="-1" aria-selected="false" aria-controls="demo-panel-tabs" data-tab>Code</button><button id="demo-tab-source" class="ds-tab" type="button" role="tab" tabindex="-1" aria-selected="false" aria-controls="demo-panel-tabs" data-tab>Source</button></div><p id="demo-panel-tabs" role="tabpanel" aria-labelledby="demo-tab-overview" class="catalog-description" data-tab-panel style="margin-top:12px">Overview panel</p></div>', tab],
        ['range', 'Range', '<label class="sr-only" for="demo-range">Range value</label><input id="demo-range" class="ds-range" type="range" min="0" max="100" value="64" data-range><span class="catalog-meta" data-range-value>64</span>', slider],
        ['dialog', 'Dialog & Escape', '<button class="ds-button" type="button" data-open-dialog>Open dialog</button><dialog class="demo-dialog" aria-labelledby="demo-dialog-title"><h3 id="demo-dialog-title">Dialog</h3><p class="catalog-description">Escape와 close 버튼을 지원합니다.</p><button class="ds-button secondary" type="button" data-close-dialog>Close</button></dialog>', componentByName.get('popup')],
        ['toast', 'Toast', '<button class="ds-button" type="button" data-demo-toast>Show toast</button>', componentByName.get('toast')],
      ];
      const cards = demos.filter(([id, title]) => includesQuery(id, title)).map(([id, title, demo, component]) => {
        const sample = component ? componentCode(component, 1)[0]?.code : '';
        const source = component?.surfaces.web?.url || component?.surfaces.design?.url || '';
        return '<article class="demo-card"><span class="catalog-meta">Native playground · reconstructed demo</span><h3>' + escapeHtml(title) + '</h3><div class="demo-stage">' + demo + '</div><div class="surface-links">' + (sample ? copyButton(sample, 'Copy WDS code') : '') + (source ? '<a class="surface-link" href="' + escapeHtml(source) + '" target="_blank" rel="noreferrer">Source ↗</a>' : '') + '</div></article>';
      }).join('');
      return titleBlock('Interactions', 'Working component playground', 'WDS 컴포넌트 코드는 복사하고, 이 페이지 안에서는 의존성 없는 네이티브 컨트롤로 상태와 키보드 동작을 확인합니다.') +
        (cards ? '<section class="playground-grid">' + cards + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    function renderSurfaces() {
      const fallback = [
        { id: 'elevated', name: 'Elevated', css: 'background: var(--semantic-background-elevated-normal); border: 1px solid var(--semantic-line-normal-alternative); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,.10);', description: '카드와 팝오버에 쓰기 좋은 기본 elevated surface입니다.' },
        { id: 'filled', name: 'Filled', css: 'background: var(--semantic-fill-alternative); border-radius: 10px;', description: '검색, segmented control, muted container에 쓰는 조용한 fill입니다.' },
        { id: 'outline', name: 'Outline', css: 'border: 1px solid var(--semantic-line-normal-normal); border-radius: 8px; background: transparent;', description: '버튼과 입력 컨테이너 경계를 위한 선형 surface입니다.' },
        { id: 'inverse', name: 'Inverse', css: 'background: var(--semantic-inverse-background); color: var(--semantic-inverse-label); border-radius: 10px;', description: 'Toast, tooltip, dark overlay 계열의 inverse surface입니다.' },
      ];
      const entries = (DATA.reuseLibrary.surfaces.length ? DATA.reuseLibrary.surfaces : fallback).filter((item) => includesQuery(item.name, item.description, item.css));
      const cards = entries.map((item) => {
        const className = firstCssClass(item.css || '');
        return '<article class="surface-card"><span class="catalog-meta">Surface recipe · ' + escapeHtml(item.evidence || 'reconstructed') + '</span><h3>' + escapeHtml(item.name) + '</h3><p class="catalog-description">' + escapeHtml(item.description || 'Reusable surface recipe.') + '</p><div class="surface-sample ' + escapeHtml(className) + '"></div><div class="surface-links">' + copyButton(item.css || '', 'Copy CSS') + '<a class="surface-link" href="../data/curated/tokens.css" target="_blank" rel="noreferrer">tokens.css ↗</a><a class="surface-link" href="../data/curated/recipes.css" target="_blank" rel="noreferrer">recipes.css ↗</a>' + (item.sourceUrl ? '<a class="surface-link" href="' + escapeHtml(item.sourceUrl) + '" target="_blank" rel="noreferrer">Source ↗</a>' : '') + '</div></article>';
      }).join('');
      return titleBlock('Surfaces', 'Boxes, shadows, radii', 'Montage 토큰으로 만든 박스, stroke, elevation, radius 레시피입니다. 비공개 구현은 공개 토큰 기반으로 근사했습니다.') +
        '<div class="toolbar"><span class="result-count">' + entries.length + ' recipes</span></div>' +
        (cards ? '<section class="surface-grid">' + cards + '</section>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    function renderAssets() {
      const categories = ['all', ...new Set(DATA.assets.map((asset) => asset.category).filter(Boolean))];
      const filtered = DATA.assets.filter((asset) => (state.assetCategory === 'all' || asset.category === state.assetCategory) && includesQuery(asset.sourceUrl, asset.pagePaths, asset.alt, asset.category));
      const pages = Math.max(1, Math.ceil(filtered.length / assetPageSize));
      state.assetPage = Math.min(state.assetPage, pages);
      const pageItems = filtered.slice((state.assetPage - 1) * assetPageSize, state.assetPage * assetPageSize);
      const controls = '<div class="asset-controls">' + categories.map((category) => '<button class="segment" type="button" data-asset-category="' + escapeHtml(category) + '" aria-pressed="' + (state.assetCategory === category) + '">' + escapeHtml(category) + '</button>').join('') + '</div>';
      const cards = pageItems.map((asset) => '<article class="asset-card"><a href="../' + escapeHtml(asset.localPath) + '" target="_blank" rel="noreferrer"><img loading="lazy" src="../' + escapeHtml(asset.localPath) + '" alt="' + escapeHtml(asset.alt?.[0] || asset.sourceUrl) + '"></a><div class="asset-body"><span class="catalog-meta">' + escapeHtml(asset.category || 'asset') + ' · ' + escapeHtml((asset.dimensions?.width || '-') + '×' + (asset.dimensions?.height || '-')) + '</span><code title="' + escapeHtml(asset.sourceUrl) + '">' + escapeHtml(asset.sourceUrl) + '</code><div class="surface-links">' + copyButton(asset.sourceUrl, 'Copy URL') + downloadButton('../' + asset.localPath, asset.localPath.split('/').pop(), 'Download') + '</div></div></article>').join('');
      return titleBlock('Assets', '697 source images', 'manifest의 모든 공개 이미지 자산을 48개씩 탐색합니다. 검색은 URL, alt, 문서 경로, category에 적용됩니다.') +
        '<div class="toolbar">' + controls + '<span class="result-count">' + filtered.length + ' assets · page ' + state.assetPage + ' / ' + pages + '</span></div>' +
        (cards ? '<section class="asset-grid">' + cards + '</section><div class="pager"><button class="surface-link" type="button" data-asset-page="prev">Prev</button><button class="surface-link" type="button" data-asset-page="next">Next</button></div>' : '<p class="empty">검색 결과가 없습니다.</p>') + footer();
    }

    function renderSources() {
      const filteredExamples = DATA.reuseLibrary.examples.filter((item) => includesQuery(item.name, item.category, item.surface, item.code, item.evidence));
      const pages = Math.max(1, Math.ceil(filteredExamples.length / sourcePageSize));
      state.sourcePage = Math.min(state.sourcePage, pages);
      const examples = filteredExamples.slice((state.sourcePage - 1) * sourcePageSize, state.sourcePage * sourcePageSize);
      const sourceCards = [
        ['Montage site', 'https://montage.wanted.co.kr/', '공개 문서와 홈 자산 원본'],
        ['Source archive', '../' + DATA.sourceManifest.sourceArchive, DATA.sourceManifest.version + ' · ' + DATA.sourceManifest.commit],
        ['License', '../' + DATA.sourceManifest.license, 'MIT notice and attribution'],
        ['Reuse export', '../' + DATA.sourceManifest.exportZip, 'CSS · SVG · 데이터 · 코드 예제'],
        ['Reference assets', '../exports/montage-reference-assets.zip', '697개 원본 이미지 · 도형 · Lottie 자료'],
      ].map(([name, href, desc]) => '<article class="source-card"><span class="catalog-meta">Source</span><h3>' + escapeHtml(name) + '</h3><p class="catalog-description">' + escapeHtml(desc || '') + '</p><div class="surface-links"><a class="surface-link" href="' + escapeHtml(href) + '" target="_blank" rel="noreferrer">Open ↗</a>' + copyButton(href, 'Copy link') + '</div></article>').join('');
      const exampleCards = examples.map((item) => '<article class="source-card"><span class="catalog-meta">' + escapeHtml(item.category || 'example') + ' · ' + escapeHtml(item.surface || 'surface') + '</span><h3>' + escapeHtml(item.name || item.id) + '</h3><p class="catalog-description">' + escapeHtml(item.evidence || 'Curated reusable example.') + '</p><details class="source-code"><summary>코드 보기</summary><pre><code>' + escapeHtml(item.code || '') + '</code></pre></details><div class="surface-links">' + (item.code ? copyButton(item.code, 'Copy code') : '') + (item.sourceUrl ? '<a class="surface-link" href="' + escapeHtml(item.sourceUrl) + '" target="_blank" rel="noreferrer">Source ↗</a>' : '') + '</div></article>').join('');
      return titleBlock('Sources', 'Reuse and export', '버전이 고정된 공개 소스와 재사용 패키지를 내려받습니다. 코드 예제는 검색하거나 펼쳐서 확인할 수 있습니다.') +
        '<section class="source-grid">' + sourceCards + '</section>' +
        (exampleCards ? '<div class="toolbar" style="margin-top:40px"><h2>Reusable examples</h2><span class="result-count">' + filteredExamples.length + ' examples · page ' + state.sourcePage + ' / ' + pages + '</span></div><section class="source-grid">' + exampleCards + '</section><div class="pager"><button class="surface-link" type="button" data-source-page="prev">Prev</button><button class="surface-link" type="button" data-source-page="next">Next</button></div>' : '') + footer();
    }

    const renderers = { overview: renderOverview, foundations: renderFoundations, components: renderComponents, motion: renderMotion, interactions: renderInteractions, surfaces: renderSurfaces, tokens: renderTokens, gradients: renderGradients, shapes: renderShapes, icons: renderIcons, assets: renderAssets, utilities: renderUtilities, sources: renderSources };

    function render({ focus = false } = {}) {
      renderNav();
      search.placeholder = ({ overview: '컴포넌트 검색', foundations: '타이포그래피 검색', components: '컴포넌트 검색', motion: '모션 검색', interactions: '인터랙션 검색', surfaces: 'surface 검색', tokens: '토큰 검색', gradients: '그라데이션 검색', shapes: '도형 검색', icons: '아이콘 이름 검색', assets: 'asset 검색', utilities: '유틸리티 검색', sources: '출처 검색' })[state.view];
      main.classList.toggle('as-page-overview', state.view === 'overview');
      main.innerHTML = renderers[state.view]();
      toastStack.replaceChildren();
      clearSearch.hidden = !state.query;
      if (focus) main.focus({ preventScroll: true });
    }

    function activateView(view, { clearQuery = true, focus = true } = {}) {
      state.view = view;
      if (clearQuery) {
        state.query = '';
        search.value = '';
        if (view === 'assets') state.assetPage = 1;
        if (view === 'sources') state.sourcePage = 1;
      }
      if (location.hash.slice(1) !== view) history.pushState(null, '', '#' + view);
      render({ focus });
      scrollTo({ top: 0, behavior: 'smooth' });
    }

    nav.addEventListener('click', (event) => {
      const button = event.target.closest('[data-view]');
      if (!button) return;
      activateView(button.dataset.view);
      closeMobileNav();
    });

    brand.addEventListener('click', (event) => { event.preventDefault(); activateView('overview'); closeMobileNav(); });

    main.addEventListener('click', async (event) => {
      const viewLink = event.target.closest('[data-view-link]');
      if (viewLink) {
        event.preventDefault();
        activateView(viewLink.dataset.viewLink);
        return;
      }

      const copy = event.target.closest('[data-copy]');
      if (copy) {
        await copyText(copy.dataset.copy);
        return;
      }

      const copySvg = event.target.closest('[data-copy-svg]');
      if (copySvg) {
        try {
          const response = await fetch(copySvg.dataset.copySvg);
          if (!response.ok) throw new Error('HTTP ' + response.status);
          await copyText(await response.text());
        } catch {
          notify('SVG를 읽을 수 없습니다.');
        }
        return;
      }

      const replayMotion = event.target.closest('[data-replay-motion]');
      if (replayMotion) {
        const sample = replayMotion.closest('.motion-card').querySelector('.motion-sample');
        const className = replayMotion.dataset.replayMotion;
        sample.classList.remove(className);
        void sample.offsetWidth;
        sample.classList.add(className);
        if (className === 'wds-motion-press' && !matchMedia('(prefers-reduced-motion: reduce)').matches) sample.firstElementChild.animate([{ opacity: 0 }, { opacity: .12 }, { opacity: 0 }], { duration: 450 });
        clearTimeout(sample._motionTimer);
        sample._motionTimer = setTimeout(() => sample.classList.remove(className), Number(sample.dataset.playMs) || 900);
        return;
      }

      const pressed = event.target.closest('[data-toggle-pressed]');
      if (pressed) {
        pressed.setAttribute('aria-pressed', pressed.getAttribute('aria-pressed') !== 'true');
        return;
      }

      const loading = event.target.closest('[data-demo-loading]');
      if (loading) {
        if (loading.disabled) return;
        loading.disabled = true;
        loading.setAttribute('aria-busy', 'true');
        loading.classList.add('loading');
        loading.textContent = 'Loading';
        setTimeout(() => {
          loading.disabled = false;
          loading.setAttribute('aria-busy', 'false');
          loading.classList.remove('loading');
          loading.textContent = 'Submit';
        }, 1200);
        return;
      }

      const switchButton = event.target.closest('[data-switch]');
      if (switchButton) {
        switchButton.setAttribute('aria-checked', switchButton.getAttribute('aria-checked') !== 'true');
        return;
      }

      const tab = event.target.closest('[data-tab]');
      if (tab) {
        const tabs = [...tab.parentElement.querySelectorAll('[data-tab]')];
        tabs.forEach((item) => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
        const panel = tab.closest('.demo-stage').querySelector('[data-tab-panel]');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.textContent = tab.textContent + ' panel';
        return;
      }

      const toastButton = event.target.closest('[data-demo-toast]');
      if (toastButton) {
        notify('Toast preview');
        return;
      }

      const dialogButton = event.target.closest('[data-open-dialog]');
      if (dialogButton) {
        dialogButton.closest('.demo-stage').querySelector('dialog').showModal();
        return;
      }

      const closeDialog = event.target.closest('[data-close-dialog]');
      if (closeDialog) {
        closeDialog.closest('dialog').close();
        return;
      }

      const assetCategory = event.target.closest('[data-asset-category]');
      if (assetCategory) {
        state.assetCategory = assetCategory.dataset.assetCategory;
        state.assetPage = 1;
        render();
        return;
      }

      const assetPage = event.target.closest('[data-asset-page]');
      if (assetPage) {
        state.assetPage += assetPage.dataset.assetPage === 'next' ? 1 : -1;
        state.assetPage = Math.max(1, state.assetPage);
        render();
        return;
      }

      const sourcePage = event.target.closest('[data-source-page]');
      if (sourcePage) {
        state.sourcePage += sourcePage.dataset.sourcePage === 'next' ? 1 : -1;
        state.sourcePage = Math.max(1, state.sourcePage);
        render();
      }
    });

    main.addEventListener('input', (event) => {
      if (event.target.matches('[data-range]')) {
        event.target.closest('.demo-stage').querySelector('[data-range-value]').textContent = event.target.value;
      }
      if (event.target.matches('[data-icon-size]')) {
        state.iconSize = event.target.value;
        main.querySelector('.icon-grid')?.style.setProperty('--icon-size', state.iconSize + 'px');
      }
      if (event.target.matches('[data-icon-color]')) {
        state.iconColor = event.target.value;
        render();
      }
    });

    main.addEventListener('change', (event) => {
      if (event.target.matches('[data-icon-color]')) {
        state.iconColor = event.target.value;
        render();
      }
    });

    main.addEventListener('keydown', (event) => {
      const tab = event.target.closest('[data-tab]');
      if (!tab || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const tabs = [...tab.parentElement.querySelectorAll('[data-tab]')];
      const current = tabs.indexOf(tab);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });

    search.addEventListener('input', () => {
      state.query = search.value.trim();
      if (state.view === 'overview' && state.query) activateView('components', { clearQuery: false, focus: false });
      else {
        if (state.view === 'assets') state.assetPage = 1;
        if (state.view === 'sources') state.sourcePage = 1;
        render();
      }
    });
    clearSearch.addEventListener('click', () => { state.query = ''; search.value = ''; search.focus(); render(); });

    main.addEventListener('click', (event) => {
      const button = event.target.closest('[data-token-kind]');
      if (!button) return;
      state.tokenKind = button.dataset.tokenKind;
      render();
    });

    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('montage-catalog-theme', next); } catch {}
      themeToggle.setAttribute('aria-label', next === 'dark' ? '라이트 테마로 전환' : '다크 테마로 전환');
      if (state.view === 'tokens' || state.view === 'gradients' || state.view === 'icons') render();
    });

    const initial = location.hash.slice(1);
    if (views.some((view) => view.id === initial)) state.view = initial;
    addEventListener('popstate', () => {
      const next = location.hash.slice(1) || 'overview';
      if (views.some((view) => view.id === next)) {
        state.view = next;
        render();
      }
    });
    addEventListener('hashchange', () => {
      const next = location.hash.slice(1) || 'overview';
      if (views.some((view) => view.id === next) && state.view !== next) {
        state.view = next;
        render();
      }
    });
    render();
  </script>
</body>
</html>
`;

await mkdir("viewer", { recursive: true });
await writeFile("viewer/index.html", html);
await writeFile(
  "viewer/finalized.json",
  `${JSON.stringify(
    {
      source_mockup: null,
      source_plan: "DESIGN.md",
      mode: "freeform",
      html_file: "viewer/index.html",
      pretext_tier: "native-text",
      framework: "vanilla",
      iterations: 3,
      date: new Date().toISOString(),
      screen: "montage-catalog",
      branch: "unknown",
    },
    null,
    2,
  )}\n`,
);

console.log(`viewer/index.html (${Buffer.byteLength(html)} bytes)`);
