import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const readText = (file) => readFile(file, "utf8");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const absolute = (file) => path.join(root, file);

const [
  raw,
  metadata,
  routes,
  colors,
  gradients,
  shapes,
  components,
  utilities,
  typography,
  grid,
  tokenCss,
  collectorSource,
  viewerHtml,
  viewerMetadata,
  iconVectors,
  assetManifest,
  buttons,
  infographics,
] = await Promise.all([
  readJson("data/raw/montage.json"),
  readJson("data/curated/metadata.json"),
  readJson("data/curated/routes.json"),
  readJson("data/curated/colors.json"),
  readJson("data/curated/gradients.json"),
  readJson("data/curated/shapes.json"),
  readJson("data/curated/components.json"),
  readJson("data/curated/utilities.json"),
  readJson("data/curated/typography.json"),
  readJson("data/curated/grid.json"),
  readText("data/curated/tokens.css"),
  readText("scripts/collect-montage-browser.js"),
  readText("viewer/index.html"),
  readJson("viewer/finalized.json"),
  readJson("data/curated/icon-vectors.json"),
  readJson("data/curated/asset-manifest.json"),
  readJson("data/curated/buttons.json"),
  readJson("data/curated/infographics.json"),
]);

assert.equal(raw.metadata.source, "https://montage.wanted.co.kr");
assert.equal(raw.metadata.pageCount, 264, "raw page count changed");
assert.equal(raw.metadata.assetCount, 697, "raw asset count changed");
assert.equal(raw.metadata.iconCount, 339, "raw icon name count changed");
assert.equal(raw.metadata.iconVectorCount, 339, "raw icon vector count changed");
assert.equal(raw.metadata.sitemapUrlCount, 262, "sitemap URL count changed");
assert.equal(raw.metadata.maxPagesReached, false, "crawl should not hit MAX_PAGES");
assert.equal(raw.pages.length, raw.metadata.pageCount, "metadata page count must match pages");
assert.equal(raw.assets.length, raw.metadata.assetCount, "metadata asset count must match assets");
assert.equal(raw.icons.length, raw.metadata.iconCount, "metadata icon count must match icons");
assert.equal(raw.iconVectors.length, raw.metadata.iconVectorCount, "metadata icon vector count must match vectors");
assert.deepEqual(raw.failures, [], "crawl must have no failures");
assert.ok(raw.pages.every((page) => page.status === 200), "every collected page must return 200");
assert.ok(raw.pages.some((page) => page.path === "/docs/release-note"), "release-note route must be collected");
assert.equal(new Set(raw.pages.map((page) => page.path)).size, raw.pages.length, "routes must be unique");
assert.deepEqual(metadata, raw.metadata, "curated metadata must match raw metadata");
assert.equal(routes.length, raw.pages.length, "routes catalog must include every page");
assert.ok(routes.some((route) => route.path === "/docs/release-note" && route.status === 200));

const lightKeys = Object.keys(raw.themes.light).sort();
const darkKeys = Object.keys(raw.themes.dark).sort();
assert.deepEqual(lightKeys, darkKeys, "light and dark themes must expose the same token names");
assert.equal(lightKeys.length, 472, "theme token count changed");
assert.equal(raw.themes.light["--semantic-primary-normal"], "#06f");
assert.equal(raw.themes.dark["--semantic-primary-normal"], "#3385ff");
assert.match(tokenCss, /:root, \[data-theme="light"\]/);
assert.match(tokenCss, /\[data-theme="dark"\]/);

assert.equal(colors.counts.total, 468, "color token total changed");
assert.equal(colors.counts.atomic, 332, "atomic color count changed");
assert.equal(colors.counts.semantic, 136, "semantic color count changed");
assert.equal(colors.tokens.length, colors.counts.total, "color token count mismatch");
assert.equal(colors.tokens.filter((token) => token.kind === "atomic").length, colors.counts.atomic);
assert.equal(colors.tokens.filter((token) => token.kind === "semantic").length, colors.counts.semantic);
assert.ok(colors.tokens.every((token) => token.name && token.light && token.dark), "every color needs light/dark values");

assert.equal(gradients.source, "https://montage.wanted.co.kr/docs/utilities/web-utilities/gradient");
assert.deepEqual(
  gradients.modes.map((mode) => mode.id),
  ["solid", "multiple", "mask"],
  "gradient catalog must include the three documented modes",
);
assert.ok(gradients.modes.every((mode) => mode.description && mode.code), "gradient modes need descriptions and code");

assert.equal(shapes.source, "https://montage.wanted.co.kr");
assert.deepEqual(shapes.counts, { marquee: 21, behind: 3, resources: 3 });
assert.deepEqual(shapes.failures, [], "shape collection failures must be empty");
assert.deepEqual(
  shapes.marquee.map((item) => item.id),
  Array.from({ length: 21 }, (_, index) => `shape-${String(index + 1).padStart(2, "0")}`),
  "marquee shapes must preserve the live DOM order",
);
assert.equal(new Set(shapes.marquee.map((item) => item.sourceUrl)).size, 21);
for (const item of [...shapes.marquee, ...shapes.behind]) {
  const bytes = await readFile(absolute(item.localPath));
  assert.equal(bytes.length, item.byteSize, `shape byteSize mismatch: ${item.localPath}`);
  assert.equal(sha256(bytes), item.sha256, `shape sha mismatch: ${item.localPath}`);
  assert.ok(item.dimensions.width > 0 && item.dimensions.height > 0, `shape dimensions missing: ${item.id}`);
}
for (const resource of shapes.resources) {
  assert.equal(resource.status, "ok", `shape resource must be downloaded: ${resource.id}`);
  const previewBytes = await readFile(absolute(resource.previewLocalPath));
  const jsonBytes = await readFile(absolute(resource.jsonLocalPath));
  assert.equal(sha256(previewBytes), resource.previewSha256, `resource preview sha mismatch: ${resource.id}`);
  assert.equal(sha256(jsonBytes), resource.jsonSha256, `resource json sha mismatch: ${resource.id}`);
  assert.match(previewBytes.toString("utf8"), /^<svg[\s>]/i, `resource preview must be SVG: ${resource.id}`);
  const animation = JSON.parse(jsonBytes.toString("utf8"));
  assert.equal(animation.w, resource.width);
  assert.equal(animation.h, resource.height);
  assert.equal(animation.fr, resource.frameRate);
  assert.equal(animation.op, resource.frames);
}

assert.equal(components.length, 53, "component catalog count changed");
assert.ok(components.every((component) => component.availableSurfaces.includes("design")));
assert.equal(utilities.length, 52, "utility catalog count changed");
assert.equal(typography.length, 19, "typography scale should contain 19 styles");
assert.equal(grid.layout.mobileColumns, 2);
assert.equal(grid.layout.tabletColumns, 3);
assert.equal(grid.layout.desktopColumns, 12);

// The browser runner evaluates this file as an async function body, where top-level return is valid.
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
new AsyncFunction(collectorSource);

assert.match(viewerHtml, /<title>Montage Catalog<\/title>/);
assert.match(viewerHtml, /window\.__MONTAGE_DATA__/);
assert.match(viewerHtml, /\{ id: 'components', label: 'Components'/);
assert.match(viewerHtml, /"iconVectors":\[/, "viewer data must include icon vector metadata");
assert.match(viewerHtml, /iconPreview\(icon\.name, 'icon-preview'/, "icon cards must render visual previews");
assert.match(
  viewerHtml,
  /iconPreview\(utilityIconName\(item\), 'utility-preview'/,
  "utility cards must render visual previews",
);
assert.match(viewerHtml, /\.utility-card a \{[^}]*height: 100%/, "utility card borders must fill their grid row");
assert.match(viewerHtml, /\{ id: 'gradients', label: 'Gradients'/, "viewer must expose a Gradients menu");
assert.match(viewerHtml, /class="gradient-sample gradient-sample--/, "gradient modes must render sample visuals");
assert.match(viewerHtml, /\{ id: 'shapes', label: 'Shapes'/, "viewer must expose a Shapes menu");
assert.match(viewerHtml, /class="shape-grid"/, "Shapes menu must render all source assets in a compact grid");
assert.doesNotMatch(viewerHtml, /Complete set/, "Shapes menu must not duplicate the same 21 assets in a second grid");
assert.doesNotMatch(viewerHtml, /data-shape-scroll=/, "Shapes menu must not require horizontal slide controls");
assert.match(viewerHtml, /\.shape-grid \{ display: grid; grid-template-columns: repeat\(11, minmax\(0, 1fr\)\);/, "desktop shape grid must stay compact");
assert.match(viewerHtml, /href="#overview" aria-label="Montage Catalog 홈"/, "brand must link to Overview");
assert.match(viewerHtml, /brand\.addEventListener\('click'/, "brand home link must update rendered state");
assert.match(
  viewerHtml,
  /state\.view === 'overview' && state\.query\) activateView\('components'/,
  "Overview search must route to searchable components",
);
assert.match(viewerHtml, /출처: Wanted Montage ↗/, "sidebar must include the requested source link");
assert.match(viewerHtml, /"localPreviews":\{/, "viewer data must include local component preview mappings");
assert.match(viewerHtml, /DATA\.localPreviews\[image\]/, "component previews must prefer local assets");
assert.match(
  viewerHtml,
  /\.footer \{ flex-direction: column; align-items: flex-start; gap: 8px; \}/,
  "mobile footer links must remain visually separated",
);
assert.doesNotMatch(
  viewerHtml,
  /<img loading="lazy" src="' \+ escapeHtml\(src\)/,
  "icon previews must load immediately when their view opens",
);
assert.doesNotMatch(viewerHtml, /Lorem ipsum/i);
assert.equal(viewerMetadata.framework, "vanilla");

assert.equal(iconVectors.length, 339, "curated icon vector count changed");
assert.equal(new Set(iconVectors.map((icon) => icon.name)).size, 339, "icon names must be unique");
for (const icon of iconVectors) {
  assert.equal(icon.source, "data/raw/montage.json#iconVectors");
  assert.ok(icon.localPath.startsWith("assets/montage/icons/"), `unexpected icon path: ${icon.localPath}`);
  assert.ok(icon.localPath.endsWith(".svg"), `icon is not svg: ${icon.localPath}`);
  assert.equal(typeof icon.sha256, "string", `missing icon sha: ${icon.localPath}`);
  assert.equal(icon.sha256.length, 64, `invalid icon sha: ${icon.localPath}`);
  assert.ok(icon.byteSize > 0, `empty icon: ${icon.localPath}`);

  const bytes = await readFile(absolute(icon.localPath));
  assert.equal(bytes.length, icon.byteSize, `icon byteSize mismatch: ${icon.localPath}`);
  assert.equal(sha256(bytes), icon.sha256, `icon sha mismatch: ${icon.localPath}`);
  const svg = bytes.toString("utf8").trim();
  assert.match(svg, /^<svg[\s>]/i, `icon must have svg root: ${icon.localPath}`);
  assert.match(svg, /\bviewBox="/, `icon must have viewBox: ${icon.localPath}`);
}

assert.equal(assetManifest.mode, "download", "asset manifest must be in download mode");
assert.equal(assetManifest.counts.rawAssets, 697, "manifest raw asset count changed");
assert.equal(assetManifest.counts.buttonAssets, 77, "manifest button count changed");
assert.equal(assetManifest.counts.infographicAssets, 620, "manifest infographic count changed");
assert.equal(assetManifest.counts.iconVectors, 339, "manifest icon vector count changed");
assert.equal(assetManifest.counts.downloaded, 697, "all assets must be downloaded");
assert.equal(assetManifest.counts.failures, 0, "asset downloads must have no failures");
assert.deepEqual(assetManifest.failures, [], "manifest failures must be empty");
assert.equal(assetManifest.assets.length, raw.assets.length, "manifest must include every raw asset");
assert.equal(new Set(assetManifest.assets.map((asset) => asset.sourceUrl)).size, raw.assets.length);

const itemKey = (item) => `${item.sourceUrl}\n${item.localPath}`;
const manifestButtons = assetManifest.assets.filter((asset) => asset.category === "button");
const manifestInfographics = assetManifest.assets.filter((asset) => asset.category === "infographic");
assert.equal(buttons.length, 77, "buttons catalog count changed");
assert.equal(infographics.length, 620, "infographics catalog count changed");
assert.equal(buttons.length + infographics.length, assetManifest.assets.length, "catalog split must match manifest");
assert.deepEqual(new Set(buttons.map(itemKey)), new Set(manifestButtons.map(itemKey)), "buttons catalog must match manifest");
assert.deepEqual(
  new Set(infographics.map(itemKey)),
  new Set(manifestInfographics.map(itemKey)),
  "infographics catalog must match manifest",
);

for (const asset of assetManifest.assets) {
  assert.equal(asset.status, "ok", `asset status must be ok: ${asset.sourceUrl}`);
  assert.equal(asset.error, null, `asset error must be null: ${asset.sourceUrl}`);
  assert.ok(asset.localPath.startsWith("assets/montage/images/"), `unexpected asset path: ${asset.localPath}`);
  assert.equal(typeof asset.sha256, "string", `missing asset sha: ${asset.localPath}`);
  assert.equal(asset.sha256.length, 64, `invalid asset sha: ${asset.localPath}`);
  assert.ok(asset.byteSize > 0, `empty asset: ${asset.localPath}`);

  const bytes = await readFile(absolute(asset.localPath));
  const fileStat = await stat(absolute(asset.localPath));
  assert.equal(fileStat.isFile(), true, `asset must be a file: ${asset.localPath}`);
  assert.equal(bytes.length, asset.byteSize, `asset byteSize mismatch: ${asset.localPath}`);
  assert.equal(sha256(bytes), asset.sha256, `asset sha mismatch: ${asset.localPath}`);
  const dimensions = dimensionsFromBytes(bytes, asset.mediaType);
  assert.ok(dimensions, `asset dimensions must be readable: ${asset.localPath}`);
  assert.ok(dimensions.width > 0 && dimensions.height > 0, `asset dimensions must be positive: ${asset.localPath}`);
  assert.deepEqual(asset.dimensions, dimensions, `asset dimensions mismatch: ${asset.localPath}`);
}

console.log(
  JSON.stringify(
    {
      status: "ok",
      pages: raw.pages.length,
      components: components.length,
      utilities: utilities.length,
      tokensPerTheme: lightKeys.length,
      colors: colors.counts,
      shapes: shapes.counts,
      icons: iconVectors.length,
      assets: assetManifest.assets.length,
      buttons: buttons.length,
      infographics: infographics.length,
      downloadedFiles: assetManifest.assets.length + iconVectors.length + shapes.resources.length * 2,
    },
    null,
    2,
  ),
);

function dimensionsFromBytes(bytes, mediaType) {
  if (bytes.length < 12) return null;
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpegDimensions(bytes);
  if (bytes.subarray(0, 3).toString("ascii") === "GIF") {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }
  if (mediaType === "image/webp" || bytes.subarray(0, 4).toString("ascii") === "RIFF") {
    return webpDimensions(bytes);
  }
  return null;
}

function jpegDimensions(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return null;
}

function webpDimensions(bytes) {
  if (bytes.length < 30 || bytes.subarray(0, 4).toString("ascii") !== "RIFF") return null;
  const type = bytes.subarray(12, 16).toString("ascii");
  if (type === "VP8 ") {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (type === "VP8L") {
    const b0 = bytes[21];
    const b1 = bytes[22];
    const b2 = bytes[23];
    const b3 = bytes[24];
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
    };
  }
  if (type === "VP8X") {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  }
  return null;
}
