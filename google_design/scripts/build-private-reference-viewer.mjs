import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(ROOT, "references-private", "manifest.json");

try {
  await access(manifestPath);
} catch {
  console.log("Skipped private reference viewer: references-private/manifest.json is unavailable.");
  process.exit(0);
}

const catalog = JSON.parse(await readFile(path.join(ROOT, "data", "curated", "catalog.json"), "utf8"));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const references = catalog.assets.productReferenceAssets;
let platformManifest = { assets: [], summary: { downloaded: 0, byCategory: {}, byService: {}, formats: {} } };
try {
  platformManifest = JSON.parse(await readFile(path.join(ROOT, "references-private", "platform-assets", "manifest.json"), "utf8"));
} catch {
  platformManifest = { assets: [], summary: { downloaded: 0, byCategory: {}, byService: {}, formats: {} } };
}

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);

const sourcePath = (id) => `../references-private/${manifest.sourceImages[id].file}`;
const crop = (item) => {
  const target = item.category === "EmptyStateIllustrations" ? 560 : Math.min(340, Math.max(170, item.bbox.width * 2.2));
  const scale = target / item.bbox.width;
  const height = Math.round(item.bbox.height * scale);
  const imageWidth = Math.round(item.sourceSize.width * scale);
  const imageHeight = Math.round(item.sourceSize.height * scale);
  const left = Math.round(-item.bbox.x * scale);
  const top = Math.round(-item.bbox.y * scale);
  return `<div class="crop" style="width:${Math.round(target)}px;height:${height}px"><img src="${escapeHtml(sourcePath(item.evidenceId))}" alt="${escapeHtml(item.name)} source crop" style="width:${imageWidth}px;height:${imageHeight}px;left:${left}px;top:${top}px"></div>`;
};

const assetCards = references
  .map(
    (item) => `<article class="asset-card">
      <div class="asset-crop">${crop(item)}</div>
      <div class="asset-copy">
        <span class="eyebrow">${escapeHtml(item.category)}</span>
        <h2>${escapeHtml(item.name)}</h2>
        <p class="meta">bbox ${item.bbox.x}, ${item.bbox.y}, ${item.bbox.width} × ${item.bbox.height}px · source ${item.sourceSize.width} × ${item.sourceSize.height}px</p>
        <div class="swatches">${item.colors.map((color) => `<span title="${color}" style="background:${color}"></span>`).join("")}</div>
        <p><b>Local reference only.</b> Public implementation substitute: ${escapeHtml(item.distributableSubstitute.name)}.</p>
      </div>
    </article>`,
  )
  .join("");

const sourceCards = Object.entries(manifest.sourceImages)
  .map(
    ([id, source]) => `<article class="source-card"><img src="../references-private/${escapeHtml(source.file)}" alt="${escapeHtml(id)} full source"><div><h3>${escapeHtml(id)}</h3><p>${source.width} × ${source.height}px · SHA-256 ${escapeHtml(source.sha256.slice(0, 16))}…</p></div></article>`,
  )
  .join("");

const registryCards = catalog.assets.productSourceRegistry
  .map((item) => {
    const representative = item.representative;
    const image = representative?.privateLocalFile
      ? `<img loading="lazy" src="../references-private/platform-assets/${escapeHtml(representative.privateLocalFile)}" alt="${escapeHtml(item.name)} official observed representative">`
      : representative?.sourceUrl && representative?.category === "official-app-icon"
        ? `<img loading="lazy" src="${escapeHtml(representative.sourceUrl)}" alt="${escapeHtml(item.name)} official hosted representative" referrerpolicy="no-referrer">`
        : `<div class="fallback-symbol">monitoring</div>`;
    const palette = representative?.palette?.length ? representative.palette : ["#0B57D0", "#0B8043", "#C0151D"];
    return `<article class="registry-card"><a class="registry-image" href="${escapeHtml(representative?.sourceUrl || item.productUrl)}" target="_blank" rel="noreferrer">${image}</a><div class="registry-copy"><span class="eyebrow">${escapeHtml(item.status)}</span><h3>${escapeHtml(item.name)}</h3><p>${item.observedImageCount} observed exact images · ${escapeHtml(item.redistribution)} · ${escapeHtml(representative?.category || "reference")}</p><div class="swatches">${palette.map((color) => `<span title="${color}" style="background:${color}"></span>`).join("")}</div><a class="source-url" href="${escapeHtml(item.productUrl)}" target="_blank" rel="noreferrer">official product source</a><a class="source-url" href="${escapeHtml(item.policyUrl)}" target="_blank" rel="noreferrer">brand / policy</a></div></article>`;
  })
  .join("");

const platformCategories = Object.keys(platformManifest.summary.byCategory || {}).sort();
const platformCards = platformManifest.assets
  .map((asset) => {
    const vectorDetails = asset.vector
      ? `<div class="vector-meta"><span>${asset.vector.paths} paths</span>${asset.vector.defaultStrokeWidth ? `<span>default stroke ${asset.vector.defaultStrokeWidth}px</span>` : ""}${asset.vector.strokeColors?.length ? `<span>stroke ${asset.vector.strokeColors.join(", ")}</span>` : ""}${asset.vector.gradients?.length ? `<span>${asset.vector.gradients.length} exact gradient</span>` : ""}</div>`
      : "";
    const gradients = asset.vector?.gradients?.length
      ? `<div class="gradient-details">${asset.vector.gradients.map((gradient) => `<code>${escapeHtml(gradient.id || "gradient")}: ${gradient.stops.map((stop) => `${stop.offset} ${stop.color}`).join(" → ")}</code>`).join("")}</div>`
      : "";
    return `<article class="platform-card" data-category="${escapeHtml(asset.category)}" data-service="${escapeHtml(asset.services.join(" "))}" data-search="${escapeHtml(`${asset.category} ${asset.services.join(" ")} ${asset.sourceUrl}`.toLowerCase())}">
      <a class="platform-image" href="${escapeHtml(asset.sourceUrl)}" target="_blank" rel="noreferrer"><img loading="lazy" src="../references-private/platform-assets/${escapeHtml(asset.localFile)}" alt="${escapeHtml(asset.category)} reference image"></a>
      <div class="platform-copy"><span class="eyebrow">${escapeHtml(asset.category)}</span><h3>${escapeHtml(path.basename(asset.localFile))}</h3><p>${escapeHtml(asset.services.join(", "))} · ${asset.width || "?"} × ${asset.height || "?"} · ${escapeHtml(asset.mime)} · ${Math.round(asset.bytes / 1024)} KiB</p><a class="source-url" href="${escapeHtml(asset.sourceUrl)}" target="_blank" rel="noreferrer">official observed source URL</a><div class="swatches">${asset.dominantColors.map((color) => `<span title="${color}" style="background:${color}"></span>`).join("")}</div><p class="palette-method">palette: ${escapeHtml(asset.paletteMethod || "exact source declarations")}${asset.sampledOpaquePixels ? ` · ${asset.sampledOpaquePixels} opaque pixels` : ""}</p>${vectorDetails}${gradients}<code class="hash">SHA-256 ${escapeHtml(asset.sha256)}</code></div>
    </article>`;
  })
  .join("");

const boxes = catalog.assets.containerReferences
  .map(
    (item) => `<article class="token-card"><h3>${escapeHtml(item.name)}</h3><div class="box-preview"><span style="width:${typeof item.dimensions.width === "number" ? Math.min(item.dimensions.width, 260) : 260}px;height:${Math.min(item.dimensions.height, 128)}px;border-radius:${item.radius};background:${item.background};border:${item.border}"></span></div><code>${escapeHtml(item.background)} · radius ${escapeHtml(item.radius)} · ${escapeHtml(String(item.dimensions.width))} × ${escapeHtml(item.dimensions.height)}</code><p>${escapeHtml(item.usage)}</p></article>`,
  )
  .join("");

const comparisonItems = Object.entries(manifest.sourceComparisons || {})
  .map(([sourceId, fragment]) => {
    const userSource = manifest.sourceImages[sourceId];
    const official = platformManifest.assets.find((asset) => asset.sourceUrl.includes(fragment));
    if (!userSource || !official) return "";
    const comparisonNote = manifest.sourceComparisonNotes?.[sourceId];
    return { officialId: official.id, official, html: `<article class="comparison-card"><h3>${escapeHtml(sourceId)}</h3><div class="comparison-images"><figure><img src="../references-private/${escapeHtml(userSource.file)}" alt="${escapeHtml(sourceId)} user-provided crop"><figcaption>User-provided crop · ${userSource.width}×${userSource.height}</figcaption></figure><figure><img src="../references-private/platform-assets/${escapeHtml(official.localFile)}" alt="${escapeHtml(official.category)} official exact source"><figcaption>Official exact source · ${official.width}×${official.height}</figcaption></figure></div><div class="swatches">${official.dominantColors.map((color) => `<span title="${color}" style="background:${color}"></span>`).join("")}</div>${comparisonNote ? `<p><b>Rendering note:</b> ${escapeHtml(comparisonNote)}</p>` : ""}<p>${escapeHtml(official.sourceUrl)}</p><code class="hash">SHA-256 ${escapeHtml(official.sha256)}</code></article>` };
  })
  .filter(Boolean);
const comparisonGroupMap = new Map();
for (const item of comparisonItems) {
  if (!comparisonGroupMap.has(item.officialId)) comparisonGroupMap.set(item.officialId, { official: item.official, items: [] });
  comparisonGroupMap.get(item.officialId).items.push(item.html);
}
const comparisonCards = Array.from(comparisonGroupMap.values())
  .map((group) => `<section class="comparison-group"><div class="comparison-group-head"><div><span class="eyebrow">canonical official source</span><h3>${escapeHtml(path.basename(group.official.localFile))}</h3></div><span class="group-count">${group.items.length} user crop${group.items.length > 1 ? "s" : ""}</span></div><div class="comparison-grid">${group.items.join("")}</div></section>`)
  .join("");

const gradients = catalog.assets.gradientReferences
  .map(
    (item) => `<article class="token-card"><h3>${escapeHtml(item.name)}</h3><div class="gradient" style="background:${item.css}"></div><code>${escapeHtml(item.css)}</code><div class="tags">${item.stops.map((stop) => `<span>${stop.offset}% ${stop.color}</span>`).join("")}</div></article>`,
  )
  .join("");

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Google Platform Private Product References</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box}body{margin:0;background:#f8fafd;color:#1f1f1f;font-family:"Google Sans",Roboto,Arial,sans-serif}.wrap{max-width:1440px;margin:auto;padding:38px 28px 96px}.top{display:flex;justify-content:space-between;gap:24px;align-items:start;margin-bottom:30px}.top h1{font-size:42px;line-height:50px;margin:5px 0 12px}.top p{max-width:820px;color:#444746;line-height:24px;margin:0}.badge{padding:9px 14px;border-radius:999px;background:#f9dedc;color:#8c1d18;font:600 12px/16px Roboto}.section{margin-top:38px}.section-head{margin-bottom:16px}.section-head h2{font-size:28px;margin:0 0 6px}.section-head p{color:#444746;margin:0}.source-grid,.token-grid,.registry-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.source-card,.token-card,.asset-card,.platform-card,.comparison-card,.registry-card{background:white;border:1px solid #c4c7c5;border-radius:24px;overflow:hidden}.source-card img{display:block;width:100%;height:300px;object-fit:contain;background:white}.source-card div{padding:16px}.source-card h3{font-size:16px;margin:0 0 6px}.source-card p,.token-card p{font:400 12px/18px Roboto;color:#444746;margin:0}.registry-card{display:grid;grid-template-columns:160px 1fr}.registry-image{min-height:170px;display:grid;place-items:center;padding:18px;background:#f2f6fc}.registry-image img{display:block;max-width:128px;max-height:96px;object-fit:contain}.fallback-symbol{font-family:"Material Symbols Rounded";font-size:56px;color:#0b57d0}.registry-copy{padding:18px}.registry-copy h3{margin:4px 0 8px;font-size:20px}.registry-copy p{margin:0;color:#444746;font:400 12px/18px Roboto}.asset-list{display:grid;gap:18px}.asset-card{display:grid;grid-template-columns:minmax(360px,1fr) minmax(320px,1fr);min-height:250px}.asset-crop{min-height:250px;display:grid;place-items:center;padding:28px;background:#f2f6fc;overflow:hidden}.crop{position:relative;overflow:hidden;background:white;border-radius:16px;box-shadow:0 1px 3px rgba(60,64,67,.22)}.crop img{position:absolute;max-width:none}.asset-copy{padding:28px}.asset-copy h2{font-size:24px;margin:6px 0 8px}.eyebrow{color:#0b57d0;font:700 11px/16px Roboto;letter-spacing:.8px}.meta{color:#444746;font:400 12px/18px ui-monospace,SFMono-Regular,Menlo,monospace}.swatches{display:flex;gap:7px;margin:18px 0;flex-wrap:wrap}.swatches span{width:30px;height:30px;border-radius:50%;border:1px solid #c4c7c5}.token-card{padding:20px}.token-card h3{margin:0 0 14px;font-size:18px}.box-preview{height:150px;display:grid;place-items:center;background:#f2f6fc;border-radius:18px;margin-bottom:14px}.box-preview span{display:block}.gradient{height:130px;border-radius:18px;margin-bottom:14px}.token-card code{display:block;white-space:normal;color:#444746;font-size:11px;line-height:17px}.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}.tags span{padding:6px 9px;border-radius:999px;background:#e9eef6;font:500 11px/14px Roboto}.library-tools{position:sticky;top:0;z-index:10;display:flex;gap:10px;align-items:center;padding:12px;margin:0 -12px 16px;background:rgba(248,250,253,.94);backdrop-filter:blur(14px)}.library-tools input{min-width:260px;flex:1;height:46px;border:1px solid #c4c7c5;border-radius:23px;padding:0 18px;background:white;font:400 14px/20px Roboto}.filters{display:flex;gap:6px;overflow:auto}.filters button{flex:0 0 auto;border:0;border-radius:999px;padding:9px 12px;background:#e9eef6;color:#444746;font:600 11px/14px Roboto;cursor:pointer}.filters button.active{background:#d3e3fd;color:#041e49}.platform-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.platform-image{display:grid;place-items:center;height:190px;padding:18px;background:#f2f6fc}.platform-image img{display:block;max-width:100%;max-height:154px;object-fit:contain}.platform-card[data-category="gmail-ui-icon"] .platform-image img,.platform-card[data-category="material-icon"] .platform-image img{width:48px;height:48px}.platform-card[data-category="companion-app-icon"] .platform-image img,.platform-card[data-category="launcher-icon"] .platform-image img{width:72px;height:72px}.platform-card[data-category="product-logo"] .platform-image img{width:auto;min-width:124px;max-width:280px;max-height:112px}.platform-copy{padding:18px}.platform-copy h3{font-size:14px;line-height:20px;margin:4px 0 7px;overflow-wrap:anywhere}.platform-copy p{font:400 12px/18px Roboto;color:#444746}.source-url{display:inline-flex;margin-top:4px;margin-right:12px;color:#0b57d0;font:500 11px/16px Roboto;text-decoration:none}.palette-method{margin-top:-8px!important;font:500 10px/14px ui-monospace,SFMono-Regular,Menlo,monospace!important}.vector-meta,.gradient-details{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.vector-meta span,.gradient-details code{padding:5px 8px;border-radius:8px;background:#e9eef6;font:500 10px/14px ui-monospace,SFMono-Regular,Menlo,monospace}.hash{display:block;margin-top:12px;overflow-wrap:anywhere;color:#747775;font-size:9px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.summary div{padding:16px;border-radius:18px;background:white;border:1px solid #c4c7c5}.summary strong{display:block;font-size:28px}.summary span{font:500 11px/16px Roboto;color:#444746}.platform-card.hidden{display:none}.comparison-groups{display:grid;gap:20px}.comparison-group{padding:18px;border-radius:24px;background:#e9eef6}.comparison-group-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}.comparison-group-head h3{margin:2px 0 0;font-size:16px;overflow-wrap:anywhere}.group-count{padding:7px 10px;border-radius:999px;background:#d3e3fd;color:#041e49;font:600 11px/14px Roboto;white-space:nowrap}.comparison-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.comparison-card{padding:20px}.comparison-card h3{margin:0 0 14px;font-size:16px}.comparison-images{display:grid;grid-template-columns:1fr 1fr;gap:10px}.comparison-images figure{margin:0;border-radius:16px;overflow:hidden;background:#f2f6fc}.comparison-images img{display:block;width:100%;height:180px;object-fit:contain;background:white}.comparison-images figcaption{padding:8px 10px;font:500 10px/14px Roboto;color:#444746}.comparison-card p{overflow-wrap:anywhere;color:#444746;font:400 10px/15px Roboto}@media(max-width:980px){.platform-grid,.registry-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:820px){.wrap{padding:24px 14px 72px}.top{display:block}.badge{display:inline-flex;margin-top:18px}.source-grid,.token-grid,.platform-grid,.comparison-grid,.registry-grid{grid-template-columns:1fr}.registry-card{grid-template-columns:132px 1fr}.asset-card{grid-template-columns:1fr}.asset-crop{min-height:220px}.crop{max-width:100%}.top h1{font-size:32px;line-height:40px}.library-tools{display:grid}.library-tools input{min-width:0;width:100%}.summary{grid-template-columns:1fr 1fr}.comparison-images{grid-template-columns:1fr 1fr}.comparison-images img{height:140px}.comparison-group-head{align-items:flex-start;display:grid}}
  </style>
  <style>
    .filters button,.source-url{min-height:44px;display:inline-flex;align-items:center}.source-url{padding-right:8px}
  </style>
</head>
<body><main class="wrap">
  <header class="top"><div><span class="eyebrow">OBSERVED + USER-SUPPLIED · LOCAL ONLY</span><h1>Google platform icons, surfaces & illustration references</h1><p>Google product marks, UI icons, and illustrations are retained unchanged as local reference evidence. This page is gitignored and must not be deployed. Use the public catalog's Material Symbols and independent component patterns for implementation.</p></div><span class="badge">REFERENCE-ONLY</span></header>
  <section class="section"><div class="section-head"><h2>Official product source registry</h2><p>대표 제품 심볼을 실제 관찰 source로 연결합니다. 이 영역은 비공개 로컬 참조 전용입니다.</p></div><div class="registry-grid">${registryCards}</div></section>
  <section class="section"><div class="section-head"><h2>Collected Google platform image library</h2><p>인증 화면에서 관찰된 공식 image URL의 exact source입니다. 모든 파일은 reference-only이며 서비스·크기·MIME·SHA-256·팔레트·SVG vector 정보를 표시합니다.</p></div>
    <div class="summary"><div><strong>${platformManifest.summary.downloaded}</strong><span>exact images</span></div><div><strong>${Object.keys(platformManifest.summary.byCategory || {}).length}</strong><span>categories</span></div><div><strong>${platformManifest.assets.filter((asset) => asset.vector).length}</strong><span>SVG vectors</span></div><div><strong>${platformManifest.assets.filter((asset) => asset.vector?.gradients?.length).length}</strong><span>exact SVG gradients</span></div></div>
    <div class="library-tools"><input id="asset-search" placeholder="서비스, 카테고리, URL 검색"><div class="filters"><button class="active" data-filter="all">all</button>${platformCategories.map((category) => `<button data-filter="${escapeHtml(category)}">${escapeHtml(category)} ${platformManifest.summary.byCategory[category]}</button>`).join("")}</div></div>
    <div class="platform-grid" id="platform-grid">${platformCards}</div>
  </section>
  <section class="section"><div class="section-head"><h2>User-provided source images</h2><p>사용자가 제공한 원본 이미지는 변형하지 않았습니다.</p></div><div class="source-grid">${sourceCards}</div></section>
  <section class="section"><div class="section-head"><h2>User crop ↔ official exact source</h2><p>사용자가 지정한 Drive·Maps·Meet·Calendar source를 canonical official file별로 그룹화합니다. 같은 원본의 여러 crop은 한 그룹 안에 표시됩니다.</p></div><div class="comparison-groups">${comparisonCards}</div></section>
  <section class="section"><div class="section-head"><h2>Extracted asset types</h2><p>제품 마크, 내비게이션, 보안, empty-state, action asset을 실제 source bbox로 표시합니다.</p></div><div class="asset-list">${assetCards}</div></section>
  <section class="section"><div class="section-head"><h2>Box & surface types</h2><p>실제 관찰 치수, radius, fill, content color.</p></div><div class="token-grid">${boxes}</div></section>
  <section class="section"><div class="section-head"><h2>Gradient information</h2><p>원본 이미지의 관찰 pixel에서 정리한 gradient stop.</p></div><div class="token-grid">${gradients}</div></section>
</main><script>
  const cards=[...document.querySelectorAll('.platform-card')];
  const search=document.querySelector('#asset-search');
  let category='all';
  const apply=()=>{const query=(search?.value||'').trim().toLowerCase();cards.forEach(card=>{const matchesCategory=category==='all'||card.dataset.category===category;const matchesQuery=!query||card.dataset.search.includes(query);card.classList.toggle('hidden',!(matchesCategory&&matchesQuery));});};
  search?.addEventListener('input',apply);
  document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.classList.toggle('active',item===button));apply();}));
  const initialQuery=new URLSearchParams(location.search).get('q');if(search&&initialQuery){search.value=initialQuery;apply();}
</script></body></html>`;

const outputDir = path.join(ROOT, "viewer-private");
await mkdir(outputDir, { recursive: true });
await writeFile(path.join(outputDir, "index.html"), html);
console.log(`Built viewer-private/index.html with ${references.length} reference assets.`);
