import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "data", "toss-live-design-catalog.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(catalog.icons.inline.length === catalog.totals.uniqueInlineSvgs, "Inline SVG total mismatch");
assert(catalog.totals.functionalInlineIcons > 12, "Functional live icons must exceed the 12 normalized examples");
assert(catalog.icons.inline.every((icon) => icon.innerMarkup && !Object.hasOwn(icon, "shapeMarkup")), "SVG must use self-contained inner markup");

for (const icon of catalog.icons.inline) {
  const ids = new Set([...icon.innerMarkup.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  const references = [...icon.innerMarkup.matchAll(/url\(#([^\)]+)\)/g)].map((match) => match[1]);
  references.forEach((reference) => assert(ids.has(reference), `${icon.id} has unresolved SVG reference: ${reference}`));
  if (icon.kind === "functional") {
    const viewBox = icon.viewBox.split(/\s+/).map(Number);
    assert(Math.max(viewBox[2] || 24, viewBox[3] || 24) <= 96, `${icon.id} oversized SVG classified as functional`);
  }
}

const lines = catalog.shapes.filter((shape) => shape.kind === "line");
assert(lines.length > 0, "Hairlines must be classified as line shapes");
assert(lines.every((shape) => ["horizontal", "vertical"].includes(shape.orientation)), "Line orientation must be preserved");
for (const shape of catalog.shapes.filter((item) => !["line", "micro"].includes(item.kind))) {
  const invalidSample = shape.samples.find((sample) => Math.min(sample.width, sample.height) < 4);
  assert(!invalidSample, `${shape.id} contains a sub-4px sample but is classified as ${shape.kind}`);
}

console.log(JSON.stringify({
  inlineIcons: catalog.icons.inline.length,
  functionalIcons: catalog.totals.functionalInlineIcons,
  graphicSvgs: catalog.totals.graphicInlineSvgs,
  lineGroups: lines.length,
  shapeGroups: catalog.shapes.length,
}, null, 2));
console.log("Live catalog regression tests pass");
