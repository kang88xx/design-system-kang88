#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const clientDist = path.join(dist, "client");
const publicDir = path.join(root, "public");
const protectedPrepareScript = path.join(root, "scripts", "prepare-sites-build.mjs");

await build({
  build: {
    copyPublicDir: false,
  },
});

await copyDirectory(publicDir, clientDist);
await prepareSitesBuild();

async function copyDirectory(source, target) {
  if (!existsSync(source)) return;

  await mkdir(target, { recursive: true });

  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await copyFileByReadWrite(sourcePath, targetPath);
    }
  }
}

async function copyFileByReadWrite(source, target) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, await readFile(source));
}

async function prepareSitesBuild() {
  const result = spawnSync(process.execPath, [protectedPrepareScript], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.status === 0) {
    writeIfPresent(result.stdout, "stdout");
    return;
  }

  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (!output.includes("EPERM")) {
    writeIfPresent(result.stdout, "stdout");
    writeIfPresent(result.stderr, "stderr");
    process.exit(result.status ?? 1);
  }

  console.warn("Protected Sites prepare hit EPERM; using read/write fallback.");
  await prepareSitesBuildByReadWrite();
}

async function prepareSitesBuildByReadWrite() {
  const requiredFiles = [
    path.join(clientDist, "index.html"),
    path.join(root, "worker", "index.js"),
    path.join(root, ".openai", "hosting.json"),
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) throw new Error("Missing Sites build input: " + file);
  }

  await copyFileByReadWrite(path.join(root, "worker", "index.js"), path.join(dist, "server", "index.js"));
  await copyFileByReadWrite(path.join(root, ".openai", "hosting.json"), path.join(dist, ".openai", "hosting.json"));

  console.log("Prepared Sites build with read/write fallback: dist/server/index.js and dist/.openai/hosting.json");
}

function writeIfPresent(value, stream) {
  if (!value) return;
  process[stream].write(value);
}
