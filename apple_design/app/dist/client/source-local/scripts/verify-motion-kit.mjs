import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const publicRoot = path.resolve("app/public");
const researchRoot = path.join(publicRoot, "research");
const evidenceFile = path.resolve("evidence/motion-kit-verification.json");
const runtimeFile = path.join(researchRoot, "runtime-motion.json");
const catalogFile = path.join(researchRoot, "motion-catalog.json");
const replayFile = path.join(researchRoot, "motion-replay.json");
const kitFile = path.join(publicRoot, "motion-code-kit.tar.gz");

const errors = [];
const checks = [];

const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const check = (name, condition, detail = "") => {
  checks.push(name);
  if (!condition) errors.push({ check: name, detail });
};

const exists = async (file) =>
  fs
    .access(file)
    .then(() => true)
    .catch(() => false);

const [runtime, catalog, replay, tarEntries] = await loadArtifacts();

if (runtime && catalog && replay && tarEntries) {
  await verifyRuntimeReplay(runtime, replay);
  await verifyFullEvidence(runtime, replay);
  verifyCatalog(catalog, tarEntries);
  verifyRuntimeSources(runtime, tarEntries);
  verifyReplayGuide(tarEntries);
}

const result = {
  passed: errors.length === 0,
  checks: checks.length,
  errors,
  counts: {
    runtimeRecords: runtime?.records?.length || 0,
    runtimeTrackedRecords:
      runtime?.records?.filter((record) => (record.trackCount || record.tracks?.length || 0) > 0)
        .length || 0,
    replayRecords: replay?.records?.length || replay?.items?.length || 0,
    catalogRecords: catalog?.records?.length || 0,
    runtimeResources: runtime?.resources?.length || 0,
    tarEntries: tarEntries?.size || 0,
  },
};

await fs.mkdir(path.dirname(evidenceFile), { recursive: true });
await fs.writeFile(evidenceFile, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
assert.equal(result.passed, true, "motion kit verification failed");

async function loadArtifacts() {
  const missing = [];
  for (const file of [runtimeFile, catalogFile, replayFile, kitFile]) {
    if (!(await exists(file))) missing.push(relative(file));
  }
  if (missing.length) {
    errors.push({ check: "required artifacts exist", detail: missing.join(", ") });
    return [null, null, null, null];
  }

  return [
    await readJson(runtimeFile),
    await readJson(catalogFile),
    await readJson(replayFile),
    await listTarEntries(kitFile),
  ];
}

async function verifyRuntimeReplay(runtime, replay) {
  const replayRecords = replay.records || replay.items || [];
  const replayById = new Map(replayRecords.map((record) => [record.id || record.recordId, record]));
  const tracked = runtime.records.filter(
    (record) => (record.trackCount || record.tracks?.length || 0) > 0,
  );

  check("runtime tracked records exist", tracked.length > 0, "no runtime records with tracks");
  for (const record of tracked) {
    const replayRecord = replayById.get(record.id);
    check(`replay has runtime record ${record.id}`, Boolean(replayRecord), record.file);
    if (!replayRecord) continue;
    check(
      `replay keeps record file ${record.id}`,
      replayRecord.evidenceFile === record.file,
      `runtime=${record.file} replay=${replayRecord.evidenceFile}`,
    );
    check(
      `replay keeps track count ${record.id}`,
      Number(replayRecord.tracks?.length ?? 0) ===
        Number(record.trackCount ?? record.tracks?.length ?? 0),
      `runtime=${record.trackCount} replay=${replayRecord.tracks?.length}`,
    );
  }
}

async function verifyFullEvidence(runtime, replay) {
  const replayById = new Map((replay.records || replay.items || []).map((record) => [record.id || record.recordId, record]));
  for (const record of runtime.records.filter(
    (item) => (item.trackCount || item.tracks?.length || 0) > 0,
  )) {
    const replayRecord = replayById.get(record.id);
    check(`tracked record has detail file ${record.id}`, Boolean(record.file), record.id);
    check(`tracked record has replay payload ${record.id}`, Boolean(replayRecord), record.id);
    if (!record.file) continue;
    const detailPath = path.join(publicRoot, record.file);
    check(`detail file exists ${record.id}`, await exists(detailPath), record.file);
    if (!(await exists(detailPath))) continue;
    const detail = await readJson(detailPath);
    check(`detail id matches ${record.id}`, detail.id === record.id, record.file);
    check(
      `replay tracks match full evidence ${record.id}`,
      JSON.stringify(detail.tracks || []) === JSON.stringify(replayRecord?.tracks || []),
      record.file,
    );
    check(
      `replay sourceRefs match full evidence ${record.id}`,
      JSON.stringify(detail.sourceRefs || []) === JSON.stringify(replayRecord?.sourceRefs || []),
      record.file,
    );
  }
}

function verifyCatalog(catalog, tarEntries) {
  check(
    "catalog declarations remain source-only",
    catalog.records.every((record) => record.status === "source-only"),
    "one or more catalog records is not source-only",
  );
  check(
    "catalog records keep source URLs",
    catalog.records.every((record) => record.sourceUrl),
    "one or more catalog records has no sourceUrl",
  );

  for (const record of catalog.records) {
    assertTarHas(tarEntries, record.file, `catalog file present ${record.id || record.file}`);
    for (const variant of record.variants || []) {
      assertTarHas(tarEntries, variant.file, `catalog variant present ${record.id || variant.file}`);
    }
  }
}

function verifyRuntimeSources(runtime, tarEntries) {
  for (const resource of runtime.resources.filter((item) => item.file)) {
    assertTarHas(tarEntries, resource.file, `runtime source present ${resource.file}`);
  }
}

function verifyReplayGuide(tarEntries) {
  check("motion kit usage guide present", tarEntries.has("docs/motion-usage.md"), "docs/motion-usage.md not found in archive");
}

function assertTarHas(tarEntries, file, name) {
  if (!file) {
    check(name, false, "missing file field");
    return;
  }
  const normalized = normalizeArchivePath(file);
  check(
    name,
    tarEntries.has(normalized) ||
      tarEntries.has(`.${normalized}`) ||
      tarEntries.has(path.posix.join("app/public", normalized)) ||
      tarEntries.has(normalized.replace(/^research\//, "")),
    file,
  );
}

async function listTarEntries(file) {
  const output = await execFile("tar", ["-tzf", file]);
  return new Set(
    output
      .split("\n")
      .map((entry) => entry.trim().replace(/^\.\//, ""))
      .filter(Boolean),
  );
}

function execFile(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} exited ${code}: ${stderr}`));
    });
  });
}

function normalizeArchivePath(file) {
  return String(file).replace(/^\/+/, "");
}

function relative(file) {
  return path.relative(process.cwd(), file);
}
