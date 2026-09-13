import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "data", "raw");
const OUTPUT_DIR = path.join(ROOT, "references-private", "platform-assets");
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_HOSTS = new Set(["calendar.google.com"]);
const rawFiles = (await readdir(RAW_DIR)).filter((name) => name.endsWith(".json")).sort();

const isAllowedHost = (hostname) => ALLOWED_HOSTS.has(hostname) || hostname.endsWith(".gstatic.com");
const extensionPattern = /\.(png|jpe?g|gif|webp|svg)$/i;
const excludedSpacerPattern = /(?:cleardot|blank_1x)\.(?:gif|png)$/i;

const classify = (url) => {
  const value = url.pathname.toLowerCase();
  if (/agenda_empty_state|smartmail/.test(value)) return "illustration";
  if (/security_shield/.test(value)) return "status-icon";
  if (/productlogos|logo_meet|logo_gmail/.test(value)) return "product-logo";
  if (/companion\/icon_assets/.test(value)) return "companion-app-icon";
  if (/ui\/v1\/icons\/mail\/gm3/.test(value)) return "gmail-ui-icon";
  if (/googlematerialicons|images\/icons\/material\/system_gm/.test(value)) return "material-icon";
  if (/app_store_badge/.test(value)) return "store-badge";
  if (/inputtools\/images/.test(value)) return "sprite";
  if (/bar\/al-icon/.test(value)) return "launcher-icon";
  return "product-ui-image";
};

const extensionFor = (mime, pathname) => {
  const match = pathname.match(extensionPattern);
  if (match) return match[1].toLowerCase().replace("jpeg", "jpg");
  return ({ "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg" })[mime] || "bin";
};

const safeBase = (pathname) => {
  const base = decodeURIComponent(path.basename(pathname)).replace(/\.[^.]+$/, "");
  return base.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "asset";
};

const svgMetadata = (buffer) => {
  const text = buffer.toString("utf8");
  const svgTag = text.match(/<svg\b[^>]*>/i)?.[0] || "";
  const width = Number.parseFloat(svgTag.match(/\bwidth=["']([\d.]+)/i)?.[1] || "");
  const height = Number.parseFloat(svgTag.match(/\bheight=["']([\d.]+)/i)?.[1] || "");
  const viewBox = svgTag.match(/\bviewBox=["']([^"']+)/i)?.[1]?.trim().split(/[ ,]+/).map(Number);
  const hexes = Array.from(new Set((text.match(/#[0-9a-f]{6}\b/gi) || []).map((value) => value.toUpperCase())));
  const strokeWidths = Array.from(new Set((text.match(/stroke-width\s*[:=]\s*["']?([\d.]+)/gi) || []).map((value) => Number.parseFloat(value.match(/[\d.]+/)?.[0] || "0")).filter(Boolean)));
  const gradients = Array.from(text.matchAll(/<linearGradient\b([^>]*)>([\s\S]*?)<\/linearGradient>/gi)).map((match) => {
    const id = match[1].match(/\bid=["']([^"']+)/i)?.[1] || null;
    const coordinate = (name) => match[1].match(new RegExp(`\\b${name}=["']([^"']+)`, "i"))?.[1] || null;
    const stops = Array.from(match[2].matchAll(/<stop\b([^>]*)\/?\s*>/gi)).map((stop) => ({
      offset: stop[1].match(/\boffset=["']([^"']+)/i)?.[1] || null,
      color: (stop[1].match(/\bstop-color=["']([^"']+)/i)?.[1] || stop[1].match(/stop-color\s*:\s*([^;"']+)/i)?.[1] || null)?.toUpperCase() || null,
      opacity: stop[1].match(/\bstop-opacity=["']([^"']+)/i)?.[1] || null,
    }));
    return {
      id,
      gradientUnits: coordinate("gradientUnits"),
      vector: { x1: coordinate("x1"), y1: coordinate("y1"), x2: coordinate("x2"), y2: coordinate("y2") },
      stops,
    };
  });
  const strokeColors = Array.from(new Set(Array.from(text.matchAll(/\bstroke=["']([^"']+)/gi)).map((match) => match[1].toUpperCase()).filter((value) => value !== "NONE")));
  const fillColors = Array.from(new Set(Array.from(text.matchAll(/\bfill=["']([^"']+)/gi)).map((match) => match[1].toUpperCase()).filter((value) => value !== "NONE" && !value.startsWith("URL("))));
  const strokedElements = (text.match(/<(?:path|circle|rect|line|polyline|polygon)\b[^>]*\bstroke=["'][^"']+/gi) || []).length;
  return {
    width: Number.isFinite(width) ? width : viewBox?.[2] || null,
    height: Number.isFinite(height) ? height : viewBox?.[3] || null,
    viewBox: viewBox?.length === 4 ? viewBox : null,
    dominantColors: hexes.slice(0, 12),
    vector: {
      paths: (text.match(/<path\b/gi) || []).length,
      circles: (text.match(/<circle\b/gi) || []).length,
      rects: (text.match(/<rect\b/gi) || []).length,
      strokeWidths,
      defaultStrokeWidth: strokedElements > 0 && strokeWidths.length === 0 ? 1 : null,
      strokeColors,
      fillColors,
      gradients,
    },
  };
};

const rasterMetadata = (file) => {
  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", file], { encoding: "utf8" });
  let dimensions = {};
  try {
    const stream = JSON.parse(probe.stdout || "{}").streams?.[0] || {};
    dimensions = { width: stream.width || null, height: stream.height || null };
  } catch {
    dimensions = { width: null, height: null };
  }

  const render = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-vf", "format=rgba", "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { encoding: null, maxBuffer: 64 * 1024 * 1024 });
  const counts = new Map();
  const bytes = render.stdout || Buffer.alloc(0);
  let opaquePixels = 0;
  for (let index = 0; index + 3 < bytes.length; index += 4) {
    if (bytes[index + 3] < 16) continue;
    opaquePixels += 1;
    const channels = [bytes[index], bytes[index + 1], bytes[index + 2]];
    const key = `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const ranked = Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
  const accents = ranked.filter(([color]) => {
    const [r, g, b] = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
    return Math.max(r, g, b) - Math.min(r, g, b) > 24 && Math.max(r, g, b) > 80;
  });
  const neutrals = ranked.filter(([color]) => {
    const [r, g, b] = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
    return Math.max(r, g, b) - Math.min(r, g, b) <= 24;
  });
  return {
    ...dimensions,
    dominantColors: [...accents, ...ranked].map(([color]) => color).filter((color, index, list) => list.indexOf(color) === index).slice(0, 10),
    accentColors: accents.map(([color]) => color).slice(0, 10),
    neutralColors: neutrals.map(([color]) => color).slice(0, 6),
    paletteMethod: "exact-source-pixels",
    sampledOpaquePixels: opaquePixels,
    vector: null,
  };
};

const observedMap = new Map();
const sourceMap = new Map();
for (const rawName of rawFiles) {
  const raw = JSON.parse(await readFile(path.join(RAW_DIR, rawName), "utf8"));
  for (const value of raw.observedReferenceAssets || []) {
    const observed = observedMap.get(value) || { url: value, services: new Set(), captures: new Set(), occurrences: 0, reason: null };
    observed.services.add(raw.service);
    observed.captures.add(rawName.replace(/\.json$/, ""));
    observed.occurrences += 1;
    observedMap.set(value, observed);
    let url;
    try {
      url = new URL(value);
    } catch {
      observed.reason = "invalid-url";
      continue;
    }
    if (url.protocol !== "https:") observed.reason = "non-https";
    else if (excludedSpacerPattern.test(url.pathname)) observed.reason = "spacer-image";
    else if (!isAllowedHost(url.hostname)) observed.reason = "disallowed-host";
    else if (!extensionPattern.test(url.pathname)) observed.reason = "not-a-file-image-url";
    if (observed.reason) continue;
    const key = url.toString();
    const existing = sourceMap.get(key) || { url: key, services: new Set(), captures: new Set(), occurrences: 0 };
    existing.services.add(raw.service);
    existing.captures.add(rawName.replace(/\.json$/, ""));
    existing.occurrences += 1;
    sourceMap.set(key, existing);
  }
}

await mkdir(OUTPUT_DIR, { recursive: true });
const candidates = Array.from(sourceMap.values());
const assets = [];
const failures = [];
let cursor = 0;

const downloadOne = async (candidate) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(candidate.url, { redirect: "follow", signal: controller.signal, headers: { "user-agent": "google-design-reference-collector/1.0" } });
    const finalUrl = new URL(response.url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!isAllowedHost(finalUrl.hostname)) throw new Error(`redirected to disallowed host ${finalUrl.hostname}`);
    const mime = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!mime.startsWith("image/")) throw new Error(`unexpected content type ${mime || "unknown"}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_BYTES) throw new Error(`invalid size ${buffer.length}`);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const sourceUrl = new URL(candidate.url);
    const extension = extensionFor(mime, sourceUrl.pathname);
    const category = classify(sourceUrl);
    const outputName = `${safeBase(sourceUrl.pathname)}-${sha256.slice(0, 10)}.${extension}`;
    const relativeFile = path.posix.join(category, outputName);
    const outputFile = path.join(OUTPUT_DIR, relativeFile);
    await mkdir(path.dirname(outputFile), { recursive: true });
    await writeFile(outputFile, buffer);
    const metadata = mime === "image/svg+xml" || extension === "svg" ? svgMetadata(buffer) : rasterMetadata(outputFile);
    assets.push({
      id: `observed-${sha256.slice(0, 12)}`,
      category,
      services: Array.from(candidate.services).sort(),
      captures: Array.from(candidate.captures).sort(),
      observedOccurrences: candidate.occurrences,
      sourceUrl: candidate.url,
      resolvedUrl: response.url,
      localFile: relativeFile,
      mime,
      extension,
      bytes: buffer.length,
      sha256,
      width: metadata.width,
      height: metadata.height,
      dominantColors: metadata.dominantColors,
      accentColors: metadata.accentColors || metadata.dominantColors,
      neutralColors: metadata.neutralColors || [],
      paletteMethod: metadata.paletteMethod || "exact-svg-declarations",
      sampledOpaquePixels: metadata.sampledOpaquePixels || null,
      vector: metadata.vector,
      gradientCandidate: Boolean(metadata.vector?.gradients?.length) || metadata.dominantColors.length >= 5,
      fidelity: "exact-observed-source",
      referenceOnly: true,
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    failures.push({ url: candidate.url, services: Array.from(candidate.services).sort(), reason: error.name === "AbortError" ? "timeout" : error.message });
  } finally {
    clearTimeout(timeout);
  }
};

const worker = async () => {
  while (cursor < candidates.length) {
    const index = cursor++;
    await downloadOne(candidates[index]);
  }
};
await Promise.all(Array.from({ length: Math.min(6, candidates.length) }, worker));

assets.sort((left, right) => left.category.localeCompare(right.category) || left.localFile.localeCompare(right.localFile));
const countBy = (key) => Object.fromEntries(Array.from(new Set(assets.flatMap((asset) => Array.isArray(asset[key]) ? asset[key] : [asset[key]]))).sort().map((value) => [value, assets.filter((asset) => Array.isArray(asset[key]) ? asset[key].includes(value) : asset[key] === value).length]));
const skipped = Array.from(observedMap.values())
  .filter((item) => !sourceMap.has(item.url))
  .map((item) => ({ url: item.url, services: Array.from(item.services).sort(), captures: Array.from(item.captures).sort(), occurrences: item.occurrences, reason: item.reason || "not-selected" }))
  .sort((left, right) => left.reason.localeCompare(right.reason) || left.url.localeCompare(right.url));
const rawOccurrences = Array.from(observedMap.values()).reduce((sum, item) => sum + item.occurrences, 0);
const skippedByReason = Object.fromEntries(Array.from(new Set(skipped.map((item) => item.reason))).sort().map((reason) => [reason, skipped.filter((item) => item.reason === reason).length]));
const manifest = {
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  classification: "private-local-reference-only",
  source: "data/raw/*.json observedReferenceAssets",
  policy: {
    authenticatedContentIncluded: false,
    userContentHostsAllowed: false,
    publicDistribution: false,
    exactSourceBytes: true,
  },
  summary: {
    rawOccurrences,
    uniqueObservedUrls: observedMap.size,
    deduplicatedOccurrences: rawOccurrences - observedMap.size,
    candidates: candidates.length,
    skipped: skipped.length,
    downloaded: assets.length,
    failed: failures.length,
    byCategory: countBy("category"),
    byService: countBy("services"),
    formats: countBy("extension"),
    skippedByReason,
  },
  assets,
  skipped,
  failures,
};

await writeFile(path.join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Collected ${assets.length}/${candidates.length} observed platform images; ${failures.length} failed.`);
console.log(JSON.stringify(manifest.summary, null, 2));
