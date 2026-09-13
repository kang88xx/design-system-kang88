import { access, readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Script } from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rawCaptureFiles = ["gmail", "calendar", "calendar-onboarding", "drive", "meet", "finance"];
const failures = [];
const checks = [];
const isAppleDoubleMetadata = (name) => path.basename(name).startsWith("._");
const isPrivatePng = (name) => name.endsWith(".png") && !isAppleDoubleMetadata(name);
const isPrivateImage = (name) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name) && !isAppleDoubleMetadata(name);

const check = (condition, message) => {
  checks.push(message);
  if (!condition) failures.push(message);
};

const exists = async (relative) => {
  try {
    await access(path.join(ROOT, relative));
    return true;
  } catch {
    return false;
  }
};

const readJson = async (relative) => JSON.parse(await readFile(path.join(ROOT, relative), "utf8"));
const readText = async (relative) => readFile(path.join(ROOT, relative), "utf8");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const hashFile = async (relative) => hash(await readFile(path.join(ROOT, relative)));
const collectFiles = async (relative, predicate = () => true) => {
  const files = [];
  const scan = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (isAppleDoubleMetadata(entry.name)) continue;
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await scan(target);
      else if (predicate(entry.name, target)) files.push(path.relative(ROOT, target).replace(/\\/g, "/"));
    }
  };
  if (await exists(relative)) await scan(path.join(ROOT, relative));
  return files.sort();
};
const hexToRgb = (hex) => {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
};
const luminance = (hex) => {
  const channels = hexToRgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrast = (left, right) => {
  const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
};

for (const captureName of rawCaptureFiles) {
  const relative = `data/raw/${captureName}.json`;
  check(await exists(relative), `${relative} exists`);
  if (!(await exists(relative))) continue;
  const rawText = await readFile(path.join(ROOT, relative), "utf8");
  const raw = JSON.parse(rawText);
  check(raw.schemaVersion === "1.0.0", `${captureName} raw schema is 1.0.0`);
  check(["gmail", "calendar", "drive", "meet", "finance"].includes(raw.service), `${captureName} has a supported service id`);
  check(raw.privacy?.textContentCollected === false, `${captureName} excludes DOM text content`);
  check(raw.privacy?.personalContentExcluded === true, `${captureName} marks personal content excluded`);
  check(raw.source?.authenticated === true, `${captureName} capture is authenticated`);
  check(raw.viewport?.width === 1440 && raw.viewport?.height === 1000, `${captureName} uses reference viewport 1440x1000`);
  check(raw.metrics?.visibleElementCount > 100, `${captureName} has meaningful visible element evidence`);
  check(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(rawText), `${captureName} raw data has no email address`);
  check(!/googleusercontent\.com/i.test(rawText), `${captureName} raw data has no user-content asset host`);
  check(raw.assetPolicy?.observedReferencesOnly === true, `${captureName} classifies collected URLs as observed references`);
  check(Array.isArray(raw.redistributableAssets) && raw.redistributableAssets.length === 0, `${captureName} does not auto-promote product assets for redistribution`);
}

const requiredCurated = [
  "catalog.json",
  "tokens.json",
  "services.json",
  "components.json",
  "interactions.json",
  "interaction-samples.json",
  "asset-manifest.json",
  "product-reference-assets.json",
  "container-references.json",
  "gradient-references.json",
  "product-source-registry.json",
  "design-library.json",
  "tokens.css",
];
for (const file of requiredCurated) check(await exists(`data/curated/${file}`), `data/curated/${file} exists`);

const catalog = await readJson("data/curated/catalog.json");
const tokens = await readJson("data/curated/tokens.json");
const designLibraryFile = (await exists("data/curated/design-library.json")) ? await readJson("data/curated/design-library.json") : null;
const productSourceRegistryFile = await readJson("data/curated/product-source-registry.json");
const interactionSamplesFile = await readJson("data/curated/interaction-samples.json");
const componentsFile = await readJson("data/curated/components.json");
const interactionsFile = await readJson("data/curated/interactions.json");
const designLibrary = catalog.designLibrary || {};
const designLibrarySources = Array.isArray(designLibrary.sources) ? designLibrary.sources : [];
const designLibraryMotion = designLibrary.motion || {};
const designLibraryMotionRecipes = Array.isArray(designLibraryMotion.recipes) ? designLibraryMotion.recipes : [];
const designLibraryShapes = Array.isArray(designLibrary.shapes) ? designLibrary.shapes : [];
const designLibraryContainers = Array.isArray(designLibrary.containers) ? designLibrary.containers : [];
const designLibraryGradients = Array.isArray(designLibrary.gradients) ? designLibrary.gradients : [];
const designLibraryObservations = Array.isArray(designLibrary.observations) ? designLibrary.observations : [];
const designLibraryObservedComponents = Array.isArray(designLibrary.observedComponents) ? designLibrary.observedComponents : [];
const designLibrarySourceCoverage = Array.isArray(designLibrary.sourceCoverage) ? designLibrary.sourceCoverage : [];
check(catalog.services.every(service=>service.captures.length===service.captureCount && service.captures.some(c=>c.id===service.primaryCaptureId)), "service summaries explicitly distinguish primary capture and all evidence");
check(catalog.services.find(service=>service.id==='calendar').captures.some(c=>c.id==='calendar-onboarding'), "Calendar summary preserves onboarding measurements");
check(catalog.services.length === 5, "catalog contains five services");
check(catalog.components.length >= 18, "catalog contains at least 18 component patterns");
check(catalog.interactions.length === 14, "catalog contains fourteen interaction contracts");
check(catalog.interactionSamples.length === 14, "catalog contains one interactive sample for each of fourteen interaction contracts");
check(catalog.assets.iconNames.length >= 70, "catalog contains a broad Material Symbols usage set");
check(catalog.assets.illustrations.length >= 4, "catalog classifies illustration sources and distributable substitutes");
check(catalog.assets.infographics.length >= 4, "catalog classifies infographic and data patterns");
check(catalog.assets.productReferenceAssets.length === 8, "catalog contains eight Meet product reference asset types");
check(catalog.assets.containerReferences.length === 3, "catalog contains three Meet box and surface references");
check(catalog.assets.gradientReferences.length === 2, "catalog contains only the two verified Meet gradient references");
check(catalog.assets.productReferenceAssets.every((asset) => asset.referenceOnly === true), "every Google product reference asset is reference-only");
check(catalog.assets.productSourceRegistry.length === 9, "catalog contains nine official Google product source registry entries");
check(catalog.assets.productSourceRegistry.every((item) => item.status.includes("reference") || item.status.includes("attribution")), "every product source registry entry exposes a restricted reference status");
check(catalog.assets.productSourceRegistry.every((item) => item.representative?.observedAssetId && item.representative?.palette?.length >= 3), "every product source registry entry exposes a representative symbol source and palette");
check(catalog.assets.productSourceRegistry.every((item) => item.representative?.referenceOnly === true), "every product representative symbol is explicitly reference-only");
check(catalog.assets.productSourceRegistry.every((item) => /^https:\/\//.test(item.representative?.sourceUrl || "")), "every product representative symbol uses an official-hosted HTTPS source");
check(catalog.assets.productSourceRegistry.every((item) => item.representative?.displaySize?.width > 0 && item.representative?.displaySize?.height > 0), "every product representative records an explicit display size");
check(catalog.assets.productSourceRegistry.every((item) => item.representative.displaySize.width <= 52 && item.representative.displaySize.height <= 52), "product representative display sizes stay within the normalized 52px optical box");
check(catalog.assets.productSourceRegistry.filter((item) => item.representative.displayMode === "leading-symbol-crop").every((item) => item.representative.displaySize.width === 40 && item.representative.displaySize.height === 40), "lockup crops expose an explicit 40px representative symbol size");
check(catalog.assets.productSourceRegistry.filter((item) => item.representative?.privateLocalFile).length >= 8, "source registry links at least eight products to exact private representative files");
check(new Set(catalog.assets.productSourceRegistry.map((item) => item.productUrl)).size === catalog.assets.productSourceRegistry.length, "every product source registry entry has a unique official product URL");
check(catalog.assets.productSourceRegistry.find((item) => item.id === "keep")?.productUrl === "https://workspace.google.com/products/keep/", "Google Keep source registry URL points to the official Keep product page");
check(catalog.assets.productSourceRegistry.find((item) => item.id === "tasks")?.productUrl === "https://workspace.google.com/products/tasks/", "Google Tasks source registry URL points to the official Tasks product page");
check(catalog.assets.observedPlatformAssetSummary.total >= 37, "catalog summarizes at least 37 exact observed platform images");
check(catalog.assets.observedPlatformAssetSummary.failed === 0, "platform image collection has no failed downloads");
check(new Set(catalog.components.flatMap((component) => component.services)).size === 5, "components cover every service");
check(new Set(catalog.components.map((component) => component.id)).size === catalog.components.length, "component IDs are unique");
check(new Set(catalog.interactions.map((interaction) => interaction.id)).size === catalog.interactions.length, "interaction contract IDs are unique");
check(new Set(catalog.interactionSamples.map((sample) => sample.id)).size === catalog.interactionSamples.length, "interaction sample IDs are unique");
check(new Set(catalog.interactionSamples.map((sample) => sample.contractId)).size === catalog.interactions.length, "interaction samples map one-to-one to contracts");
check(catalog.interactions.every((interaction) => catalog.interactionSamples.some((sample) => sample.contractId === interaction.id)), "every interaction contract has an executable sample");
check(catalog.components.filter((component) => component.family === "button").every((component) => component.variant), "button family variants are explicitly labeled instead of presented as duplicates");
check(JSON.stringify(catalog.designLibrary) === JSON.stringify(designLibraryFile), "design-library generated file matches catalog payload");
check(["sources", "motion", "shapes", "containers", "gradients", "observations", "observedComponents", "sourceCoverage"].every((key) => Array.isArray(designLibrary[key]) || (key === "motion" && designLibrary[key])), "design library exposes the required source, recipe, and observation groups");
check(designLibrarySources.length >= 6, "design library records official and reference source entries");
check(designLibrarySources.every((source) => source.id && source.name && /^https:\/\//.test(source.url || "") && source.license && (source.revision || source.checkedAt)), "every design library source has HTTPS provenance, license, and revision/check metadata");
check(designLibraryMotion.evidence === "documented" && designLibraryMotion.sourceId, "design library motion scale is documented with a source");
check(designLibraryMotionRecipes.length > 0 && designLibraryMotionRecipes.every((recipe) => recipe.evidence === "reconstructed" && recipe.sourceId && recipe.reducedMotion), "design library motion recipes are labeled reconstructed and document reduced motion behavior");
check(designLibraryShapes.length > 0 && designLibraryShapes.every((shape) => shape.evidence && shape.sourceId && shape.css), "design library shapes document evidence and CSS recipe");
check(designLibraryContainers.length > 0 && designLibraryContainers.every((container) => container.evidence === "reconstructed" && container.sourceId && container.css), "design library containers are reconstructed recipes with source context");
check(designLibraryGradients.length > 0 && designLibraryGradients.every((gradient) => gradient.evidence === "reconstructed" && gradient.css && gradient.note), "design library gradients are labeled reconstructed recipes");
check(designLibraryObservations.length > 0 && designLibraryObservations.every((observation) => observation.evidence === "observed" && observation.count > 0 && observation.captures?.length > 0 && observation.services?.length > 0), "design library observations carry observed evidence, captures, services, and counts");
check(designLibraryObservations.length > 0 && designLibraryObservations.every((observation) => observation.captures.every((capture) => capture.id && capture.service && capture.count > 0)), "design library observation captures include capture id, service, and count");
check(designLibraryObservedComponents.length > 0 && designLibraryObservedComponents.every((component) => component.evidence === "observed" && component.captureId && component.service && component.family), "design library observed components carry observed capture provenance");
check(designLibrarySourceCoverage.length === rawCaptureFiles.length, "design library source coverage accounts for every raw capture");
check(designLibrarySourceCoverage.every((coverage) => rawCaptureFiles.includes(coverage.id) && coverage.visibleElements > 100 && coverage.foundationOccurrences > 0 && coverage.componentGroups > 0), "design library source coverage summarizes capture evidence");
check(JSON.stringify(catalog.assets.productSourceRegistry) === JSON.stringify(productSourceRegistryFile), "product source registry generated file matches catalog payload");
check(JSON.stringify(catalog.interactionSamples) === JSON.stringify(interactionSamplesFile), "interaction samples generated file matches catalog payload");
check(JSON.stringify(catalog.components) === JSON.stringify(componentsFile), "components generated file matches catalog payload");
check(JSON.stringify(catalog.interactions) === JSON.stringify(interactionsFile), "interactions generated file matches catalog payload");

const light = tokens.color.light;
const dark = tokens.color.dark;
check(contrast(light.onSurface, light.surface) >= 7, "light on-surface contrast is at least 7:1");
check(contrast(light.onPrimary, light.primary) >= 4.5, "light on-primary contrast is at least 4.5:1");
check(contrast(dark.onSurface, dark.surface) >= 7, "dark on-surface contrast is at least 7:1");
check(contrast(dark.onPrimary, dark.primary) >= 4.5, "dark on-primary contrast is at least 4.5:1");

const tokensCss = await readFile(path.join(ROOT, "data/curated/tokens.css"), "utf8");
check(tokensCss.includes('[data-theme="dark"]'), "tokens.css includes dark theme");
check(tokensCss.includes("--gds-color-primary"), "tokens.css includes semantic primary token");
check(tokensCss.includes("--gds-space-md"), "tokens.css includes spacing tokens");
check(tokensCss.includes("--gds-space-md: 12px;"), "tokens.css writes medium spacing as 12px");

const viewer = await readFile(path.join(ROOT, "viewer/index.html"), "utf8");
check(viewer.includes('return true;') && viewer.includes('return false;') && viewer.includes('done(copied ? "CSS copied"'), "clipboard failure keeps manual-copy status distinct from success");
check(viewer.includes('dot.style.transform = "none";') && viewer.includes('currentAnimation.cancel()'), "motion sample cancels transforms for reduced-motion preferences");
const inlineScripts = [...viewer.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
check(inlineScripts.length >= 4, "viewer contains its data and workbench scripts");
inlineScripts.forEach((match,index) => {
  try { new Script(match[1]); check(true, `viewer inline script ${index+1} parses`); }
  catch (error) { check(false, `viewer inline script ${index+1} parses: ${error.message}`); }
});
check(viewer.includes("window.__GOOGLE_DESIGN_DATA__"), "viewer embeds curated catalog data");
check(viewer.includes("Material+Symbols+Rounded"), "viewer loads Material Symbols from official font delivery");
check(!viewer.includes("<h3>Noto Color Emoji</h3>"), "viewer removes the Noto Color Emoji display section");
check(!viewer.includes("references-private/"), "viewer contains no private capture path string");
check(!viewer.includes("viewer-private/"), "public viewer contains no private viewer route");
check(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(viewer), "viewer has no email address");
for (const id of ["contract-hover-row", "contract-focus-button", "contract-press-button", "contract-expand-button", "contract-snackbar-trigger", "contract-dialog-open", "contract-drag-item", "contract-drop-zone", "interaction-dialog"]) {
  check(viewer.includes(`id=\"${id}\"`), `viewer includes working interaction control ${id}`);
}
for (const id of ["mini-hover-row", "mini-focus-button", "mini-press-button", "mini-snackbar", "mini-drag"]) {
  check(viewer.includes(id), `viewer includes inline interaction contract sample ${id}`);
}
check(viewer.includes("registrySymbol(item)") && viewer.includes("공식 호스팅 이미지 · 참고 전용"), "viewer renders official-hosted representative product symbols in registry and service map");
check(!viewer.includes("palette-mark"), "viewer does not approximate product marks with CSS palette art");
check(viewer.includes("공식 제품 소스 레지스트리") && viewer.includes("제품 페이지") && viewer.includes("사용 정책"), "viewer presents localized registry headings and separated source actions");
check(viewer.includes("registryStatusLabel(item.status)") && viewer.includes("registryPolicyLabel(item.redistribution)"), "viewer maps internal registry codes to user-facing labels");
check(viewer.includes("source-action secondary") && viewer.includes("registry-symbol product-"), "viewer styles source and policy links separately and scopes symbols by product");
check(!viewer.includes('<a class="registry-symbol'), "representative images do not create a redundant third focus target per registry card");
check(viewer.includes(".registry-symbol.product-finance { background:#fff; }"), "Finance source image uses a white optical canvas without a nested tinted box");
check(catalog.assets.iconNames.includes("open_in_new") && catalog.assets.iconNames.includes("policy"), "registry action icons are included in the public Material Symbols set");
check(viewer.includes("중복 점검 완료"), "viewer documents component duplicate audit and family/variant separation");
check(!viewer.includes("Interaction playground") && !viewer.includes("playground-card"), "viewer removes the duplicated standalone interaction playground");
for (const id of ["top-app-bar", "navigation-drawer", "navigation-rail", "tabs", "filled-button", "tonal-button", "outlined-button", "icon-button", "calendar-grid"]) {
  check(viewer.includes(`'${id}':`), `viewer contains a component-specific demo for ${id}`);
}
check(viewer.includes("window.addEventListener('hashchange'"), "viewer listens for hash navigation and browser history changes");
check(viewer.includes("const applyTheme="), "viewer centralizes theme state and icon synchronization");

const redactionScript = await readFile(path.join(ROOT, "scripts/redact-google-ui.js"), "utf8");
const collectorScript = await readFile(path.join(ROOT, "scripts/collect-google-ui.js"), "utf8");
check(redactionScript.includes("meetTextRedacted") && redactionScript.includes('"meet.google.com": report.meetTextRedacted > 0'), "Meet capture fails closed unless main text is redacted");
check(redactionScript.includes("captureAuthenticated"), "redaction script writes an explicit authenticated capture marker");
check(collectorScript.includes('root.dataset.captureAuthenticated === "true"'), "collector derives authenticated state from explicit capture evidence");

const viewerTemplate = await readFile(path.join(ROOT, "viewer/template.html"), "utf8");
const viewerFinalized = await readJson("viewer/finalized.json");
const catalogText = await readFile(path.join(ROOT, "data/curated/catalog.json"), "utf8");
check(viewerFinalized.catalogSha256 === hash(catalogText), "viewer finalized metadata matches catalog hash");
check(viewerFinalized.templateSha256 === hash(viewerTemplate), "viewer finalized metadata matches template hash");
check(viewerFinalized.viewerSha256 === hash(viewer), "viewer finalized metadata matches generated HTML hash");
check(viewerFinalized.viewerBytes === Buffer.byteLength(viewer), "viewer finalized metadata matches generated HTML byte size");
const viewerInputFiles = {
  "data/curated/catalog.json": "catalogSha256",
  "viewer/template.html": "templateSha256",
  "data/curated/tokens.css": null,
  "viewer/workbench.css": null,
  "viewer/workbench.js": null,
  "viewer/interaction-workbench.css": null,
  "viewer/interaction-workbench.js": null,
};
check(viewerFinalized.inputsSha256 && typeof viewerFinalized.inputsSha256 === "object", "viewer finalized metadata records input hashes");
for (const [relative, legacyKey] of Object.entries(viewerInputFiles)) {
  check(await exists(relative), `${relative} exists as a finalized viewer input`);
  if (!(await exists(relative))) continue;
  const digest = await hashFile(relative);
  check(viewerFinalized.inputsSha256?.[relative] === digest, `viewer finalized metadata matches input hash for ${relative}`);
  if (legacyKey) check(viewerFinalized[legacyKey] === digest, `viewer finalized legacy ${legacyKey} matches input hash for ${relative}`);
}
const reconstructedViewer = viewerTemplate
  .replace("__TOKENS_CSS__", await readText("data/curated/tokens.css"))
  .replace("__WORKBENCH_CSS__", (await exists("viewer/workbench.css")) ? await readText("viewer/workbench.css") : "")
  .replace("__WORKBENCH_JS__", (await exists("viewer/workbench.js")) ? await readText("viewer/workbench.js") : "")
  .replace("__INTERACTION_WORKBENCH_CSS__", (await exists("viewer/interaction-workbench.css")) ? await readText("viewer/interaction-workbench.css") : "")
  .replace("__INTERACTION_WORKBENCH_JS__", (await exists("viewer/interaction-workbench.js")) ? await readText("viewer/interaction-workbench.js") : "")
  .replace("__CATALOG_JSON__", JSON.stringify(catalog).replaceAll("<", "\\u003c"));
check(reconstructedViewer === viewer, "viewer is reproducible from template, catalog data, tokens CSS, workbench CSS/JS, and interaction workbench CSS/JS");

const markdownFiles = ["README.md", "DESIGN.md", "AGENTS.md", "TESTING.md", ...(await readdir(path.join(ROOT, "docs"))).filter((name) => name.endsWith(".md")).map((name) => `docs/${name}`)];
for (const markdownFile of markdownFiles) {
  const markdown = await readFile(path.join(ROOT, markdownFile), "utf8");
  for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (!rawTarget || /^(?:https?:|mailto:|#)/i.test(rawTarget)) continue;
    const targetWithoutFragment = rawTarget.split("#")[0];
    const resolved = path.isAbsolute(targetWithoutFragment) ? targetWithoutFragment : path.resolve(ROOT, path.dirname(markdownFile), targetWithoutFragment);
    check(await exists(path.relative(ROOT, resolved)), `${markdownFile} local link exists: ${rawTarget}`);
  }
}

const gitignore = await readFile(path.join(ROOT, ".gitignore"), "utf8");
check(gitignore.split(/\r?\n/).includes("references-private/"), "private references are gitignored");
check(gitignore.split(/\r?\n/).includes("viewer-private/"), "private reference viewer is gitignored");
check(gitignore.split(/\r?\n/).includes(".gstack/"), "browser state is gitignored");

if (await exists(".gstack/browse-network.log")) {
  const networkLog = await readFile(path.join(ROOT, ".gstack/browse-network.log"), "utf8");
  check(!/(?:SIDCC|SetSID|ServiceLogin|accounts\.google\.com)/i.test(networkLog), "runtime browser log contains no Google auth trace");
}

const privateFiles = [];
const walk = async (dir) => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (!isAppleDoubleMetadata(entry.name)) privateFiles.push(target);
  }
};
await walk(path.join(ROOT, "references-private"));
const privateManifest = await readJson("references-private/manifest.json");
check(privateManifest.classification === "private-local-reference-only", "private manifest is classified reference-only");
check(Object.values(privateManifest.captures).every((capture) => capture.visualReview === true && capture.redactionStatus === "pass"), "every retained capture has visual and redaction review metadata");
check(Object.keys(privateManifest.sourceImages).length === 9, "private manifest contains nine unchanged user-supplied Google product sources");
check(Object.keys(privateManifest.sourceComparisons).length === 8, "private manifest contains eight user-to-official comparison mappings");
for (const source of Object.values(privateManifest.sourceImages)) {
  const sourceFile = path.join(ROOT, "references-private", source.file);
  check(await exists(path.relative(ROOT, sourceFile)), `${source.file} exists`);
  if (!(await exists(path.relative(ROOT, sourceFile)))) continue;
  const digest = createHash("sha256").update(await readFile(sourceFile)).digest("hex");
  check(digest === source.sha256, `${source.file} matches its original SHA-256`);
}

const platformManifest = await readJson("references-private/platform-assets/manifest.json");
check(platformManifest.classification === "private-local-reference-only", "platform image manifest is classified reference-only");
check(platformManifest.summary.downloaded >= 37, "platform image manifest contains at least 37 exact downloads");
check(platformManifest.summary.failed === 0, "platform image manifest reports zero failures");
const rawObservedLists = await Promise.all(rawCaptureFiles.map(async (captureName) => JSON.parse(await readFile(path.join(ROOT, "data", "raw", `${captureName}.json`), "utf8")).observedReferenceAssets || []));
const rawObservedUrls = rawObservedLists.flat();
check(platformManifest.summary.rawOccurrences === rawObservedUrls.length, "platform manifest accounts for every raw observed asset occurrence");
check(platformManifest.summary.uniqueObservedUrls === new Set(rawObservedUrls).size, "platform manifest unique URL count matches raw data");
check(platformManifest.summary.candidates + platformManifest.summary.skipped === platformManifest.summary.uniqueObservedUrls, "candidate and skipped URL counts reconcile to unique observations");
check(platformManifest.summary.deduplicatedOccurrences === platformManifest.summary.rawOccurrences - platformManifest.summary.uniqueObservedUrls, "platform manifest reports deduplicated provenance occurrences");
check(platformManifest.skipped.every((item) => item.reason && item.occurrences >= 1), "every skipped raw URL has a reason and provenance count");
check(platformManifest.assets.every((asset) => asset.referenceOnly === true && asset.fidelity === "exact-observed-source"), "every platform image is exact-source and reference-only");
check(platformManifest.assets.every((asset) => !/googleusercontent\.com/i.test(asset.sourceUrl)), "platform image manifest excludes user-content hosts");
for (const asset of platformManifest.assets) {
  const assetFile = path.join(ROOT, "references-private", "platform-assets", asset.localFile);
  check(await exists(path.relative(ROOT, assetFile)), `${asset.localFile} exists`);
  if (!(await exists(path.relative(ROOT, assetFile)))) continue;
  const digest = createHash("sha256").update(await readFile(assetFile)).digest("hex");
  check(digest === asset.sha256, `${asset.localFile} matches its SHA-256`);
}
const officialMeetIllustration = platformManifest.assets.find((asset) => asset.sourceUrl.includes("agenda_empty_state"));
const officialMeetLogo = platformManifest.assets.find((asset) => asset.sourceUrl.includes("logo_meet_2026"));
const meetProductMarkReference = catalog.assets.productReferenceAssets.find((asset) => asset.id === "meet-product-mark");
const meetEmptyIllustrationReference = catalog.assets.productReferenceAssets.find((asset) => asset.id === "meet-empty-state-illustration");
const meetNavReference = catalog.assets.productReferenceAssets.find((asset) => asset.id === "meet-nav-meeting-selected");
const materialSymbolSubstitutes = catalog.assets.productReferenceAssets
  .filter((asset) => asset.distributableSubstitute?.type === "material-symbol")
  .map((asset) => asset.distributableSubstitute.name);
check(materialSymbolSubstitutes.every((name) => catalog.assets.iconNames.includes(name)), "every Material Symbol substitute appears in the public icon implementation set");
check(officialMeetLogo?.paletteMethod === "exact-source-pixels", "official Meet logo palette uses exact source pixels");
check(officialMeetLogo?.accentColors?.includes("#FBB100") && officialMeetLogo?.accentColors?.includes("#FECC05"), "official Meet logo exact yellow-orange accents are recorded");
check(meetProductMarkReference?.distributableSubstitute?.type === "none", "public catalog does not approximate the Google Meet product mark");
check(meetEmptyIllustrationReference?.distributableSubstitute?.type === "none", "public catalog does not collapse the Meet illustration into a generic icon");
check(meetNavReference?.distributableSubstitute?.axes?.weight === 500 && meetNavReference?.distributableSubstitute?.axes?.opticalSize === 24, "Meet navigation substitute records exact Material Symbol axes");
check(officialMeetIllustration?.vector?.defaultStrokeWidth === 1, "official Meet illustration records the native 1px default SVG stroke");
check(officialMeetIllustration?.vector?.gradients?.[0]?.stops?.length === 2, "official Meet illustration records the exact two-stop SVG gradient");
check(officialMeetIllustration?.vector?.gradients?.[0]?.stops?.[0]?.color === "#FFC6EF", "official Meet illustration exact first gradient color is #FFC6EF");
check(officialMeetIllustration?.vector?.gradients?.[0]?.stops?.[1]?.color === "#FFDB0F", "official Meet illustration exact second gradient color is #FFDB0F");

const openSourceManifest = await readJson("data/sources/open-source-manifest.json");
const immutableRawUrl = (url) => {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const allowedRepos = new Set(["google/material-design-icons", "material-components/material-web"]);
    return parsed.protocol === "https:" && parsed.hostname === "raw.githubusercontent.com" && parts.length >= 4 && allowedRepos.has(`${parts[0]}/${parts[1]}`) && /^[a-f0-9]{40}$/.test(parts[2]);
  } catch {
    return false;
  }
};
check(openSourceManifest.schemaVersion === 1, "open source manifest schema is version 1");
check(openSourceManifest.sourcePolicy?.includes("official Apache-2.0 upstream assets"), "open source manifest states official Apache-2.0 source policy");
check(openSourceManifest.counts?.icons === 81 && openSourceManifest.icons?.length === 81, "open source manifest accounts for all 81 Material Symbols icons");
check(openSourceManifest.counts?.upstreamFiles === openSourceManifest.upstreamFiles?.length && openSourceManifest.upstreamFiles?.length >= 11, "open source manifest accounts for token wrappers, value files, and licenses");
check(openSourceManifest.upstreamRepositories?.every((repo) => repo.license === "Apache-2.0" && /^[a-f0-9]{40}$/.test(repo.commit || "") && /^https:\/\/github\.com\//.test(repo.sourceUrl || "")), "open source manifest repositories use Apache-2.0 immutable commit provenance");
check(openSourceManifest.icons.every((icon) => icon.id === `material-symbols-rounded-${icon.name}` && icon.path === `assets/material-symbols/rounded/${icon.name}.svg`), "every Material Symbol manifest record uses the expected local path");
check(openSourceManifest.icons.every((icon) => icon.license === "Apache-2.0" && immutableRawUrl(icon.sourceUrl) && icon.sha256 && icon.bytes > 0 && icon.viewBox), "every Material Symbol record has Apache-2.0 license, immutable official URL, hash, bytes, and viewBox");
check(openSourceManifest.upstreamFiles.every((file) => file.license === "Apache-2.0" && immutableRawUrl(file.sourceUrl) && file.sha256 && file.bytes > 0 && file.path.startsWith("assets/upstream/")), "every upstream file record has Apache-2.0 license, immutable official URL, hash, bytes, and upstream path");
check(new Set(openSourceManifest.icons.map((icon) => icon.name)).size === 81, "Material Symbol icon names are unique");
check(new Set(openSourceManifest.icons.map((icon) => icon.path)).size === 81, "Material Symbol local paths are unique");
const materialIconFiles = await collectFiles("assets/material-symbols/rounded", (name) => name.endsWith(".svg"));
const upstreamFiles = await collectFiles("assets/upstream");
const manifestIconFiles = openSourceManifest.icons.map((icon) => icon.path).sort();
const manifestUpstreamFiles = openSourceManifest.upstreamFiles.map((file) => file.path).sort();
check(JSON.stringify(materialIconFiles) === JSON.stringify(manifestIconFiles), "assets/material-symbols/rounded contains only manifest-listed icons");
check(JSON.stringify(upstreamFiles) === JSON.stringify(manifestUpstreamFiles), "assets/upstream contains only manifest-listed upstream files");
for (const icon of openSourceManifest.icons) {
  check(await exists(icon.path), `${icon.path} exists`);
  if (!(await exists(icon.path))) continue;
  check((await hashFile(icon.path)) === icon.sha256, `${icon.path} matches manifest SHA-256`);
  check((await stat(path.join(ROOT, icon.path))).size === icon.bytes, `${icon.path} matches manifest byte size`);
}
for (const file of openSourceManifest.upstreamFiles) {
  check(await exists(file.path), `${file.path} exists`);
  if (!(await exists(file.path))) continue;
  check((await hashFile(file.path)) === file.sha256, `${file.path} matches manifest SHA-256`);
  check((await stat(path.join(ROOT, file.path))).size === file.bytes, `${file.path} matches manifest byte size`);
}

if (await exists("viewer-private/index.html")) {
  const privateViewer = await readFile(path.join(ROOT, "viewer-private/index.html"), "utf8");
  check(privateViewer.includes("references-private/user-supplied/meet-empty-state.png"), "private viewer embeds the unchanged Meet empty-state source");
  check(privateViewer.includes("references-private/platform-assets/illustration/agenda_empty_state"), "private viewer embeds the exact official Meet illustration SVG");
  check(privateViewer.includes("Official product source registry"), "private viewer exposes official product source registry thumbnails");
  check(privateViewer.includes("references-private/platform-assets/product-logo/logo_meet_2026"), "private viewer embeds the exact Meet product representative source");
  check(privateViewer.includes("references-private/platform-assets/product-logo/logo_drive_2026"), "private viewer embeds the exact Drive product representative source");
  check(privateViewer.includes("references-private/platform-assets/product-logo/calendar_2026_01"), "private viewer embeds the exact Calendar product representative source");
  check((privateViewer.match(/class="platform-card"/g) || []).length >= 37, "private viewer exposes every collected platform image card");
  check((privateViewer.match(/class="comparison-card"/g) || []).length === 8, "private viewer exposes eight user crop to official source comparisons");
  check((privateViewer.match(/class="comparison-group"/g) || []).length === 6, "private viewer groups repeated crops under six canonical official sources");
  check(privateViewer.includes("REFERENCE-ONLY"), "private viewer displays the reference-only warning");
  check(!privateViewer.includes("Noto Color Emoji"), "private viewer omits the removed Noto Emoji section");
}
const privatePngFiles = privateFiles.filter((file) => isPrivatePng(file));
check(privatePngFiles.length >= 7, "private reference set contains seven redacted captures");
for (const file of privatePngFiles) {
  const relative = path.relative(ROOT, file);
  const minimumBytes = relative.startsWith("references-private/platform-assets/") || relative.startsWith("references-private/user-supplied/") ? 1 : 10_000;
  check((await stat(file)).size >= minimumBytes, `${relative} is a non-empty PNG`);
}

const qaArtifactManifest = await readJson("references-private/catalog/manifest.json");
const qaCatalogNames = await readdir(path.join(ROOT, "references-private", "catalog"));
const qaPngNames = qaCatalogNames.filter(isPrivatePng).sort();
const qaSidecarPngNames = qaCatalogNames.filter((name) => name.endsWith(".png") && isAppleDoubleMetadata(name));
check(qaArtifactManifest.summary.files === qaPngNames.length, "QA artifact index accounts for every catalog screenshot");
check(qaArtifactManifest.files.every((file) => qaPngNames.includes(file.file)), "QA artifact index contains no orphan screenshot records");
check(qaArtifactManifest.files.every((file) => !isAppleDoubleMetadata(file.file)), "QA artifact index ignores AppleDouble PNG sidecars");
check(qaSidecarPngNames.length === 0 || qaArtifactManifest.summary.files < qaPngNames.length + qaSidecarPngNames.length, "QA artifact screenshot count excludes AppleDouble PNG sidecars");
check(qaPngNames.length > 0 && qaArtifactManifest.files.some((file) => file.file === qaPngNames[0]), "QA artifact index still validates real PNG screenshots");
check(qaArtifactManifest.groups.every((group) => !group.aliases.includes(group.canonical)), "QA artifact canonical names are not repeated as aliases");
check(qaArtifactManifest.summary.duplicateFiles === qaArtifactManifest.groups.reduce((sum, group) => sum + group.aliases.length, 0), "QA artifact duplicate counts match canonical alias groups");

const allowedDistributableImages = new Set(manifestIconFiles);
const distributableImageRoots = ["assets", "viewer"];
for (const relative of distributableImageRoots) {
  if (!(await exists(relative))) continue;
  const candidates = [];
  const scan = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await scan(target);
      else if (isPrivateImage(entry.name)) candidates.push(target);
    }
  };
  await scan(path.join(ROOT, relative));
  check(candidates.every((candidate) => allowedDistributableImages.has(path.relative(ROOT, candidate).replace(/\\/g, "/"))), `${relative}/ contains no unmanifested distributable images`);
}

if (failures.length) {
  console.error(`Validation failed: ${failures.length}/${checks.length} checks`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Validation passed: ${checks.length} checks`);
console.log(`Services: ${catalog.services.map(({ id }) => id).join(", ")}`);
console.log(`Components: ${catalog.components.length}; interactions: ${catalog.interactions.length}; private captures: ${privateFiles.length}`);
