import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = await readFile(path.join(ROOT, "viewer", "template.html"), "utf8");
const catalogText = await readFile(path.join(ROOT, "data", "curated", "catalog.json"), "utf8");
const catalog = JSON.parse(catalogText);
const inputs = {"data/curated/catalog.json":catalogText,"viewer/template.html":template};
const markers = {__TOKENS_CSS__: 'data/curated/tokens.css', __WORKBENCH_CSS__: 'viewer/workbench.css', __WORKBENCH_JS__: 'viewer/workbench.js', __INTERACTION_WORKBENCH_CSS__: 'viewer/interaction-workbench.css', __INTERACTION_WORKBENCH_JS__: 'viewer/interaction-workbench.js'};
let html = template;
for (const [marker, relative] of Object.entries(markers)) {
  const source = await readFile(path.join(ROOT,relative),'utf8');
  inputs[relative] = source;
  html = html.replace(marker,()=>source);
}
html = html.replace("__CATALOG_JSON__", () => JSON.stringify(catalog).replaceAll("<", "\\u003c"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

await mkdir(path.join(ROOT, "viewer"), { recursive: true });
await writeFile(path.join(ROOT, "viewer", "index.html"), html);
await writeFile(
  path.join(ROOT, "viewer", "finalized.json"),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    schemaVersion: catalog.schemaVersion,
    services: catalog.services.map(({ id }) => id),
    counts: { services: catalog.services.length, components: catalog.components.length, interactions: catalog.interactions.length, interactionSamples: catalog.interactionSamples.length },
    source: "data/curated/catalog.json",
    catalogSha256: sha256(catalogText),
    templateSha256: sha256(template),
    viewerSha256: sha256(html),
    viewerBytes: Buffer.byteLength(html),
    inputsSha256: Object.fromEntries(Object.entries(inputs).map(([file,source])=>[file,sha256(source)])),
  }, null, 2)}\n`,
);

console.log(`Built viewer/index.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB).`);
