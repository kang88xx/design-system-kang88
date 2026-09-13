import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const rawPath = path.join(root, "data/raw/montage.json");
const curatedDir = path.join(root, "data/curated");
const assetRoot = path.join(root, "assets/montage");
const iconDir = path.join(assetRoot, "icons");
const imageDir = path.join(assetRoot, "images");

const args = new Set(process.argv.slice(2));
const download = args.has("--download");
const metadataOnly = args.has("--metadata-only") || !download;
const concurrency = numberArg("--concurrency", 8);
const retries = numberArg("--retries", 2);
const timeoutMs = numberArg("--timeout-ms", 15000);

if (args.has("--help")) {
  console.log(`Usage: node scripts/export-montage-assets.mjs [--metadata-only|--download]

Options:
  --metadata-only       Generate curated JSON without network downloads (default).
  --download            Download raw.assets into assets/montage/images.
  --concurrency <n>     Concurrent downloads. Default: 8.
  --retries <n>         Retry count after the first failed attempt. Default: 2.
  --timeout-ms <n>      Per-request timeout in milliseconds. Default: 15000.
`);
  process.exit(0);
}

const raw = JSON.parse(await readFile(rawPath, "utf8"));
await Promise.all([
  mkdir(curatedDir, { recursive: true }),
  mkdir(iconDir, { recursive: true }),
  mkdir(imageDir, { recursive: true }),
]);

const pageImageIndex = indexPageImages(raw.pages || []);
const assets = [...new Set(raw.assets || [])].sort();
const iconVectors = normalizeIconVectors(raw.iconVectors || []);

const iconVectorItems = await exportIconVectors(iconVectors);
const manifestItems = assets.map((sourceUrl) => buildAssetManifestItem(sourceUrl, pageImageIndex));

if (download) {
  await downloadManifestItems(manifestItems);
} else {
  await attachExistingFileMetadata(manifestItems);
}

const failures = manifestItems.filter((item) => item.status !== "ok" && item.status !== "metadata-only");
const buttons = manifestItems
  .filter((item) => item.category === "button")
  .map(toCatalogItem);
const infographics = manifestItems
  .filter((item) => item.category !== "button")
  .map(toCatalogItem);

await Promise.all([
  writeJson("icon-vectors.json", iconVectorItems),
  writeJson("buttons.json", buttons),
  writeJson("infographics.json", infographics),
  writeJson("asset-manifest.json", {
    generatedAt: new Date().toISOString(),
    mode: download ? "download" : "metadata-only",
    source: raw.metadata?.source || "https://montage.wanted.co.kr/",
    counts: {
      rawAssets: assets.length,
      buttonAssets: buttons.length,
      infographicAssets: infographics.length,
      iconVectors: iconVectorItems.length,
      downloaded: manifestItems.filter((item) => item.status === "ok").length,
      failures: failures.length,
    },
    assets: manifestItems,
    failures,
  }),
]);

console.log(
  JSON.stringify(
    {
      status: failures.length ? "failed" : "ok",
      mode: download ? "download" : "metadata-only",
      rawAssets: assets.length,
      buttonAssets: buttons.length,
      infographicAssets: infographics.length,
      iconVectors: iconVectorItems.length,
      failures: failures.length,
    },
    null,
    2,
  ),
);

if (download && failures.length) {
  process.exitCode = 1;
}

function numberArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = Number(process.argv[index + 1]);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return value;
}

async function writeJson(name, value) {
  await writeFile(path.join(curatedDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function indexPageImages(pages) {
  const index = new Map();
  for (const page of pages) {
    for (const image of page.images || []) {
      const src = image.src;
      if (!src) continue;
      if (!index.has(src)) {
        index.set(src, {
          pagePaths: new Set(),
          altValues: new Set(),
          dimensions: new Map(),
        });
      }
      const entry = index.get(src);
      entry.pagePaths.add(page.path);
      if (image.alt) entry.altValues.add(image.alt);
      if (image.width || image.height) {
        entry.dimensions.set(`${image.width || ""}x${image.height || ""}`, {
          width: image.width ?? null,
          height: image.height ?? null,
        });
      }
    }
  }

  return new Map(
    [...index.entries()].map(([src, entry]) => [
      src,
      {
        pagePaths: [...entry.pagePaths].sort(),
        alt: [...entry.altValues].filter(Boolean).sort(),
        declaredDimensions: [...entry.dimensions.values()],
      },
    ]),
  );
}

function normalizeIconVectors(vectors) {
  return vectors
    .filter((item) => item && typeof item.svg === "string" && item.svg.trim())
    .map((item) => ({
      name: sanitizeFileBase(item.name || "icon"),
      svg: item.svg.trim(),
      viewBox: item.viewBox ?? null,
      width: item.width ?? null,
      height: item.height ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function exportIconVectors(vectors) {
  const usedNames = new Map();
  const items = [];
  for (const vector of vectors) {
    const baseName = uniqueName(vector.name, usedNames);
    const localPath = path.join(iconDir, `${baseName}.svg`);
    await writeFile(localPath, ensureSvgRoot(vector));
    const bytes = await readFile(localPath);
    items.push({
      name: vector.name,
      source: "data/raw/montage.json#iconVectors",
      localPath: relativePath(localPath),
      viewBox: vector.viewBox,
      width: vector.width,
      height: vector.height,
      sha256: sha256(bytes),
      byteSize: bytes.length,
    });
  }
  return items;
}

function ensureSvgRoot(vector) {
  if (/^<svg[\s>]/i.test(vector.svg)) return `${vector.svg}\n`;
  const attrs = [
    vector.viewBox ? `viewBox="${escapeAttr(vector.viewBox)}"` : "",
    vector.width ? `width="${escapeAttr(vector.width)}"` : "",
    vector.height ? `height="${escapeAttr(vector.height)}"` : "",
    'xmlns="http://www.w3.org/2000/svg"',
  ]
    .filter(Boolean)
    .join(" ");
  return `<svg ${attrs}>${vector.svg}</svg>\n`;
}

function buildAssetManifestItem(sourceUrl, pageImageIndex) {
  const localPath = localImagePathFor(sourceUrl);
  const pageMeta = pageImageIndex.get(sourceUrl) || {
    pagePaths: [],
    alt: [],
    declaredDimensions: [],
  };
  return {
    sourceUrl,
    pagePaths: pageMeta.pagePaths,
    alt: pageMeta.alt,
    category: classifyAsset(sourceUrl, pageMeta.pagePaths),
    localPath: relativePath(localPath),
    sha256: null,
    byteSize: null,
    mediaType: mediaTypeFromUrl(sourceUrl),
    dimensions: pageMeta.declaredDimensions[0] || null,
    status: metadataOnly ? "metadata-only" : "pending",
    error: null,
  };
}

function localImagePathFor(sourceUrl) {
  let url;
  try {
    url = new URL(sourceUrl);
  } catch {
    const digest = createHash("sha256").update(sourceUrl).digest("hex").slice(0, 16);
    return path.join(imageDir, "_invalid-url", `${digest}.bin`);
  }

  const host = sanitizePathSegment(url.hostname);
  const segments = url.pathname
    .split("/")
    .filter(Boolean)
    .map(sanitizePathSegment)
    .filter(Boolean);
  if (!segments.length || sourceUrl.endsWith("/")) segments.push("index");

  if (url.search) {
    const last = segments.pop() || "index";
    const parsed = path.parse(last);
    const digest = createHash("sha256").update(url.search).digest("hex").slice(0, 12);
    segments.push(`${parsed.name || "index"}.${digest}${parsed.ext || extensionFromUrl(url) || ".bin"}`);
  }

  const fullPath = path.join(imageDir, host, ...segments);
  const normalized = path.normalize(fullPath);
  if (!normalized.startsWith(`${imageDir}${path.sep}`)) {
    throw new Error(`Unsafe asset path for ${sourceUrl}`);
  }
  return normalized;
}

function sanitizePathSegment(segment) {
  const decoded = safeDecode(segment);
  return decoded
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean)
    .join("_")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^\.+$/, "_")
    .slice(0, 140);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeFileBase(value) {
  return sanitizePathSegment(String(value)) || "icon";
}

function uniqueName(name, used) {
  const count = used.get(name) || 0;
  used.set(name, count + 1);
  return count ? `${name}-${count + 1}` : name;
}

function classifyAsset(sourceUrl, pagePaths) {
  const haystack = `${sourceUrl} ${pagePaths.join(" ")}`.toLowerCase();
  if (
    /\/components\/actions\/(action-area|button|chip|icon-button|text-button)\//.test(haystack) ||
    /\/components\/selection-and-input\/filter-button\//.test(haystack)
  ) {
    return "button";
  }
  return "infographic";
}

function mediaTypeFromUrl(sourceUrl) {
  try {
    const ext = path.extname(new URL(sourceUrl).pathname).toLowerCase();
    return mediaTypeFromExtension(ext);
  } catch {
    return "application/octet-stream";
  }
}

function mediaTypeFromExtension(ext) {
  return (
    {
      ".apng": "image/apng",
      ".avif": "image/avif",
      ".gif": "image/gif",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".webp": "image/webp",
    }[ext] || "application/octet-stream"
  );
}

function extensionFromUrl(url) {
  const ext = path.extname(url.pathname).toLowerCase();
  return ext || "";
}

async function attachExistingFileMetadata(items) {
  await Promise.all(
    items.map(async (item) => {
      const absolutePath = path.join(root, item.localPath);
      if (!existsSync(absolutePath)) return;
      const bytes = await readFile(absolutePath);
      item.sha256 = sha256(bytes);
      item.byteSize = bytes.length;
      item.dimensions = dimensionsFromBytes(bytes, item.mediaType) || item.dimensions;
      item.status = "ok";
    }),
  );
}

async function downloadManifestItems(items) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await downloadOne(item);
    }
  });
  await Promise.all(workers);
}

async function downloadOne(item) {
  const absolutePath = path.join(root, item.localPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });

  if (existsSync(absolutePath)) {
    const bytes = await readFile(absolutePath);
    item.sha256 = sha256(bytes);
    item.byteSize = bytes.length;
    item.dimensions = dimensionsFromBytes(bytes, item.mediaType) || item.dimensions;
    item.status = "ok";
    item.error = null;
    return;
  }

  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { bytes, mediaType } = await fetchBytes(item.sourceUrl);
      await writeFile(absolutePath, bytes, { flag: "wx" });
      item.sha256 = sha256(bytes);
      item.byteSize = bytes.length;
      item.mediaType = mediaType || item.mediaType;
      item.dimensions = dimensionsFromBytes(bytes, item.mediaType) || item.dimensions;
      item.status = "ok";
      item.error = null;
      return;
    } catch (error) {
      lastError = error;
    }
  }

  item.status = "failed";
  item.error = lastError?.message || "Unknown download failure";
}

async function fetchBytes(sourceUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "wanted-design-asset-exporter/1.0" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return {
      bytes: Buffer.from(arrayBuffer),
      mediaType: response.headers.get("content-type")?.split(";")[0]?.trim() || null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

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
  while (offset < bytes.length) {
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

function toCatalogItem(item) {
  return {
    sourceUrl: item.sourceUrl,
    pagePaths: item.pagePaths,
    alt: item.alt,
    category: item.category,
    localPath: item.localPath,
    sha256: item.sha256,
    byteSize: item.byteSize,
    mediaType: item.mediaType,
    dimensions: item.dimensions,
    status: item.status,
    error: item.error,
  };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function relativePath(absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join("/");
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
