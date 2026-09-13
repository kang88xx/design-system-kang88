import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { access, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "references-private", "catalog");
const isAppleDoubleMetadata = (name) => path.basename(name).startsWith("._");
const isQaScreenshot = (name) => name.endsWith(".png") && !isAppleDoubleMetadata(name);

try {
  await access(DIR);
} catch {
  console.log("Skipped private QA artifact index: references-private/catalog is unavailable.");
  process.exit(0);
}
const names = (await readdir(DIR)).filter(isQaScreenshot).sort();
const files = [];

for (const name of names) {
  const file = path.join(DIR, name);
  const buffer = await readFile(file);
  const fileStat = await stat(file);
  const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", file], { encoding: "utf8" });
  let dimensions = { width: null, height: null };
  try {
    const stream = JSON.parse(probe.stdout || "{}").streams?.[0] || {};
    dimensions = { width: stream.width || null, height: stream.height || null };
  } catch {
    dimensions = { width: null, height: null };
  }
  files.push({
    file: name,
    bytes: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    width: dimensions.width,
    height: dimensions.height,
    modifiedAt: fileStat.mtime.toISOString(),
  });
}

const canonicalScore = (name) => {
  let score = 0;
  if (!name.startsWith("verifier-")) score += 20;
  if (name.includes("final")) score += 10;
  if (name.includes("fidelity")) score += 5;
  score -= name.length / 1000;
  return score;
};

const byHash = new Map();
for (const file of files) {
  if (!byHash.has(file.sha256)) byHash.set(file.sha256, []);
  byHash.get(file.sha256).push(file.file);
}

const groups = Array.from(byHash.entries())
  .map(([sha256, groupFiles]) => {
    const ordered = [...groupFiles].sort((left, right) => canonicalScore(right) - canonicalScore(left) || left.localeCompare(right));
    return { sha256, canonical: ordered[0], aliases: ordered.slice(1), duplicate: ordered.length > 1 };
  })
  .sort((left, right) => left.canonical.localeCompare(right.canonical));

const manifest = {
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  classification: "qa-evidence-index",
  policy: "Files are never deleted automatically. Byte-identical screenshots are represented by one canonical name plus aliases.",
  summary: {
    files: files.length,
    uniqueImages: groups.length,
    duplicateFiles: files.length - groups.length,
    duplicateGroups: groups.filter((group) => group.duplicate).length,
  },
  files,
  groups,
};

await writeFile(path.join(DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Indexed ${files.length} QA screenshots: ${groups.length} unique, ${manifest.summary.duplicateFiles} byte-identical aliases.`);
