import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const raw = JSON.parse(await readFile("data/raw/home-shapes.json", "utf8"));
const manifest = JSON.parse(await readFile("data/curated/asset-manifest.json", "utf8"));
const download = process.argv.includes("--download");
const outputDir = path.join(root, "assets/montage/shapes/resources");
await mkdir(outputDir, { recursive: true });

const assetBySource = new Map(manifest.assets.map((asset) => [asset.sourceUrl, asset]));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const relative = (absolutePath) => path.relative(root, absolutePath).split(path.sep).join("/");

const attachAsset = (item) => {
  const asset = assetBySource.get(item.sourceUrl);
  if (!asset) throw new Error(`Missing asset manifest entry: ${item.sourceUrl}`);
  return {
    ...item,
    localPath: asset.localPath,
    sha256: asset.sha256,
    byteSize: asset.byteSize,
    dimensions: asset.dimensions || item.dimensions,
    status: asset.status,
  };
};

const marquee = raw.marquee.map(attachAsset);
const behind = raw.behind.map(attachAsset);
const failures = [];
const resources = [];

for (const item of raw.resources) {
  const previewPath = path.join(outputDir, `${item.id}.svg`);
  if (!existsSync(previewPath)) {
    if (!item.svg) throw new Error(`Missing resource SVG: ${item.id}`);
    await writeFile(previewPath, `${item.svg.trim()}\n`, { flag: "wx" });
  }
  const previewBytes = await readFile(previewPath);
  const jsonPath = path.join(outputDir, `${item.id}.json`);
  let status = "metadata-only";
  let error = null;

  if (download && !existsSync(jsonPath)) {
    try {
      const response = await fetch(item.jsonUrl, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 1_000_000) throw new Error("Resource JSON exceeds 1 MB");
      await writeFile(jsonPath, bytes, { flag: "wx" });
    } catch (caught) {
      status = "failed";
      error = String(caught?.message || caught);
      failures.push({ id: item.id, jsonUrl: item.jsonUrl, error });
    }
  }

  let jsonMetadata = null;
  let jsonSha256 = null;
  let jsonByteSize = null;
  if (existsSync(jsonPath)) {
    const jsonBytes = await readFile(jsonPath);
    const animation = JSON.parse(jsonBytes.toString("utf8"));
    jsonMetadata = {
      width: animation.w,
      height: animation.h,
      frameRate: animation.fr,
      frames: animation.op,
      layers: Array.isArray(animation.layers) ? animation.layers.length : 0,
    };
    jsonSha256 = sha256(jsonBytes);
    jsonByteSize = jsonBytes.length;
    status = "ok";
  }

  resources.push({
    id: item.id,
    name: item.name,
    order: item.order,
    title: item.title,
    lastUpdated: item.lastUpdated,
    href: item.href,
    jsonUrl: item.jsonUrl,
    jsonLocalPath: relative(jsonPath),
    previewLocalPath: relative(previewPath),
    jsonSha256,
    jsonByteSize,
    previewSha256: sha256(previewBytes),
    previewByteSize: previewBytes.length,
    ...jsonMetadata,
    status,
    error,
  });
}

const output = {
  source: raw.source,
  collectedAt: raw.collectedAt,
  counts: {
    marquee: marquee.length,
    behind: behind.length,
    resources: resources.length,
  },
  marquee,
  behind,
  resources,
  failures,
};

await writeFile("data/curated/shapes.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ status: failures.length ? "failed" : "ok", ...output.counts, failures: failures.length }, null, 2));
if (download && failures.length) process.exitCode = 1;
