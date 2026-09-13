import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = path.join(appRoot, "src", "system");
const libraryRoot = path.join(appRoot, "library");
const distRoot = path.join(libraryRoot, "dist");
const publicRoot = path.join(appRoot, "public");
const packageName = "source-design-system-0.1.0.tgz";

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readIfPresent(filePath) {
  return (await exists(filePath)) ? fs.readFile(filePath, "utf8") : "";
}

async function copyIfPresent(source, target) {
  if (!(await exists(source))) {
    return false;
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, await fs.readFile(source));
  return true;
}

async function requireFile(filePath, label) {
  if (!(await exists(filePath))) {
    throw new Error(`${label} is required: ${path.relative(appRoot, filePath)}`);
  }
}

const entry = path.join(srcRoot, "index.js");
const types = path.join(srcRoot, "index.d.ts");

await requireFile(path.join(libraryRoot, "package.json"), "Library package manifest");
await requireFile(path.join(libraryRoot, "README.md"), "Library README");
await requireFile(entry, "System ESM entry");
await requireFile(types, "System type declarations");

await fs.rm(distRoot, { recursive: true, force: true });
await fs.mkdir(path.join(distRoot, "system"), { recursive: true });

await build({
  configFile: false,
  root: appRoot,
  publicDir: false,
  esbuild: { jsx: "automatic" },
  build: {
    outDir: distRoot,
    emptyOutDir: false,
    copyPublicDir: false,
    minify: false,
    lib: {
      entry,
      formats: ["es"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        banner: "\"use client\";",
      },
    },
  },
});

const copiedComponents = await copyIfPresent(
  path.join(srcRoot, "components.css"),
  path.join(distRoot, "components.css"),
);
const copiedForms = await copyIfPresent(
  path.join(srcRoot, "forms.css"),
  path.join(distRoot, "forms.css"),
);

await fs.writeFile(
  path.join(distRoot, "tokens.css"),
  await fs.readFile(path.join(srcRoot, "tokens.css")),
);
await fs.writeFile(
  path.join(distRoot, "tokens.json"),
  await fs.readFile(path.join(srcRoot, "tokens.json")),
);
await fs.writeFile(
  path.join(distRoot, "system", "index.d.ts"),
  await fs.readFile(types),
);

const styles = [
  await readIfPresent(path.join(srcRoot, "tokens.css")),
  copiedComponents ? await readIfPresent(path.join(srcRoot, "components.css")) : "",
  copiedForms ? await readIfPresent(path.join(srcRoot, "forms.css")) : "",
]
  .filter((content) => content.trim())
  .join("\n\n");
await fs.writeFile(path.join(distRoot, "styles.css"), `${styles}\n`);

await fs.mkdir(publicRoot, { recursive: true });
const packed = spawnSync(
  "npm",
  ["pack", "--ignore-scripts", "--pack-destination", publicRoot],
  { cwd: libraryRoot, encoding: "utf8" },
);

if (packed.status !== 0) {
  throw new Error(packed.stderr || packed.stdout || "npm pack failed");
}

const generatedName = packed.stdout.trim().split(/\r?\n/).filter(Boolean).pop();
if (!generatedName) {
  throw new Error("npm pack did not report an archive name");
}

const generatedPath = path.join(publicRoot, generatedName);
const targetPath = path.join(publicRoot, packageName);
if (generatedPath !== targetPath) {
  await fs.rm(targetPath, { force: true });
  await fs.rename(generatedPath, targetPath);
}

console.log(`Built ${path.relative(appRoot, targetPath)}`);
