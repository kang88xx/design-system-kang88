import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.resolve(root, process.argv[2] || "data/toss-live-design-inventory.json");
const outputPath = path.resolve(root, process.argv[3] || "data/toss-live-design-catalog.json");
const source = JSON.parse(await readFile(inputPath, "utf8"));

function uniqueBy(items, keyOf) {
  const map = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

const inlineIconMap = new Map();
for (const icon of source.icons.inline) {
  const key = `${icon.viewBox}|${icon.innerMarkup}|${JSON.stringify(icon.rootStyle)}`;
  const current = inlineIconMap.get(key) ?? {
    id: `inline-${String(inlineIconMap.size + 1).padStart(2, "0")}`,
    viewBox: icon.viewBox || "0 0 24 24",
    innerMarkup: icon.innerMarkup,
    rootStyle: icon.rootStyle,
    nodeCount: icon.nodeCount,
    shapeCount: icon.shapeCount,
    hasDefs: icon.hasDefs,
    uses: 0,
    visibleUses: 0,
    labels: [],
    renderedSizes: [],
  };
  current.uses += 1;
  if (icon.width > 0 && icon.height > 0) current.visibleUses += 1;
  if (icon.label && !current.labels.includes(icon.label)) current.labels.push(icon.label);
  const renderedSize = `${icon.width}×${icon.height}`;
  if (!current.renderedSizes.includes(renderedSize)) current.renderedSizes.push(renderedSize);
  inlineIconMap.set(key, current);
}

const inlineIcons = [...inlineIconMap.values()].map((icon) => {
  const numbers = icon.viewBox.split(/\s+/).map(Number);
  const width = numbers[2] || 24;
  const height = numbers[3] || 24;
  const maxDimension = Math.max(width, height);
  const aspect = width / height;
  const labelsAreGeneric = icon.labels.every((label) => !label || label.toLowerCase() === "svg");
  const functional = maxDimension <= 96 &&
    aspect >= 0.35 &&
    aspect <= 2.8 &&
    icon.shapeCount <= 16 &&
    (icon.visibleUses > 0 || !labelsAreGeneric) &&
    !(labelsAreGeneric && icon.nodeCount > 24);
  return {
    ...icon,
    kind: functional ? "functional" : "graphic",
    labels: icon.labels.slice(0, 12),
  };
});

const shapeMap = new Map();
for (const shape of source.shapes) {
  const minDimension = Math.min(shape.width, shape.height);
  const maxDimension = Math.max(shape.width, shape.height);
  const aspect = minDimension > 0 ? maxDimension / minDimension : Number.POSITIVE_INFINITY;
  const radiusRatio = minDimension > 0 ? shape.radius / minDimension : 0;
  const kind = minDimension < 4
    ? maxDimension >= 8 ? "line" : "micro"
    : aspect <= 1.08 && radiusRatio >= 0.45
      ? "circle"
      : aspect >= 1.5 && radiusRatio >= 0.45
        ? "pill"
        : shape.radius >= 32
          ? "media"
          : shape.radius >= 20
            ? "panel"
            : "control";
  const radius = shape.radius < 20 ? Math.round(shape.radius * 2) / 2 : Math.round(shape.radius);
  const thickness = kind === "line" ? Math.round(minDimension * 4) / 4 : null;
  const orientation = kind === "line" ? shape.width >= shape.height ? "horizontal" : "vertical" : null;
  const key = kind === "line" ? `${kind}|${orientation}|${thickness}` : `${kind}|${radius}`;
  const current = shapeMap.get(key) ?? {
    id: `shape-${String(shapeMap.size + 1).padStart(2, "0")}`,
    kind,
    radius,
    thickness,
    orientation,
    uses: 0,
    samples: [],
  };
  current.uses += 1;
  if (current.samples.length < 8) current.samples.push({
    width: shape.width,
    height: shape.height,
    tag: shape.tag,
    label: shape.label,
  });
  shapeMap.set(key, current);
}

const catalog = {
  schemaVersion: 1,
  generatedAt: source.collectedAt,
  source: {
    url: source.url,
    collectedAt: source.collectedAt,
    stylesheetUrls: source.stylesheetUrls,
    stylesheetBytes: source.totals.stylesheetBytes,
  },
  totals: {
    inlineSvgInstances: source.totals.inlineSvgs,
    uniqueInlineSvgs: inlineIcons.length,
    functionalInlineIcons: inlineIcons.filter((icon) => icon.kind === "functional").length,
    graphicInlineSvgs: inlineIcons.filter((icon) => icon.kind === "graphic").length,
    imageIcons: uniqueBy(source.icons.images, (icon) => icon.src).length,
    maskIcons: uniqueBy(source.icons.masks, (icon) => icon.value).length,
    buttonStyleGroups: source.buttons.length,
    shapeSamples: source.shapes.length,
    shapeGroups: shapeMap.size,
    computedBackgroundColors: source.computed.backgroundColors.length,
    computedBackgroundImages: source.computed.backgroundImages.length,
    declaredGradients: source.declared.gradients.length,
    shadows: source.computed.shadows.length,
  },
  icons: {
    inline: inlineIcons.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "functional" ? -1 : 1;
      return b.uses - a.uses || a.id.localeCompare(b.id);
    }),
    images: uniqueBy(source.icons.images, (icon) => icon.src),
    masks: uniqueBy(source.icons.masks, (icon) => icon.value),
  },
  buttons: source.buttons.map((button, index) => ({
    id: `button-${String(index + 1).padStart(2, "0")}`,
    ...button,
  })),
  shapes: [...shapeMap.values()].sort((a, b) => b.uses - a.uses || a.radius - b.radius),
  color: {
    backgroundColors: source.computed.backgroundColors,
    foregroundColors: source.computed.foregroundColors,
    computedBackgroundImages: source.computed.backgroundImages,
    gradients: source.declared.gradients,
    shadows: source.computed.shadows,
  },
};

await writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${path.relative(root, outputPath)}`);
console.log(JSON.stringify(catalog.totals, null, 2));
