const elements = [...document.querySelectorAll("body *")];

function increment(map, key, sample) {
  if (!key) return;
  const current = map.get(key) ?? { value: key, uses: 0, samples: [] };
  current.uses += 1;
  if (sample && current.samples.length < 6 && !current.samples.includes(sample)) current.samples.push(sample);
  map.set(key, current);
}

function ranked(map, limit = 160) {
  return [...map.values()].sort((a, b) => b.uses - a.uses || a.value.localeCompare(b.value)).slice(0, limit);
}

function visibleRect(element) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
    ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
    : null;
}

function shortLabel(element) {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("alt") ||
    element.textContent ||
    element.tagName
  ).trim().replace(/\s+/g, " ").slice(0, 80);
}

const backgroundColors = new Map();
const foregroundColors = new Map();
const backgroundImages = new Map();
const radii = new Map();
const borders = new Map();
const shadows = new Map();
const shapes = [];

for (const element of elements) {
  const rect = visibleRect(element);
  if (!rect) continue;
  const style = getComputedStyle(element);
  const label = shortLabel(element);
  if (style.backgroundColor !== "rgba(0, 0, 0, 0)") increment(backgroundColors, style.backgroundColor, label);
  if (style.color !== "rgba(0, 0, 0, 0)") increment(foregroundColors, style.color, label);
  if (style.backgroundImage !== "none") increment(backgroundImages, style.backgroundImage, label);
  increment(radii, style.borderRadius, label);
  increment(borders, `${style.borderWidth} ${style.borderStyle} ${style.borderColor}`, label);
  if (style.boxShadow !== "none") increment(shadows, style.boxShadow, label);

  const radius = parseFloat(style.borderTopLeftRadius);
  if (radius > 0 && shapes.length < 500) {
    const minDimension = Math.min(rect.width, rect.height);
    const maxDimension = Math.max(rect.width, rect.height);
    const aspect = minDimension > 0 ? maxDimension / minDimension : Number.POSITIVE_INFINITY;
    const radiusRatio = minDimension > 0 ? radius / minDimension : 0;
    const kind = minDimension < 4
      ? maxDimension >= 8 ? "line" : "micro"
      : aspect <= 1.08 && radiusRatio >= 0.45
        ? "circle"
        : aspect >= 1.5 && radiusRatio >= 0.45
          ? "pill"
          : radius >= 32
            ? "media"
            : radius >= 20
              ? "panel"
              : "control";
    shapes.push({
      kind,
      radius,
      thickness: kind === "line" ? minDimension : null,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
      tag: element.tagName.toLowerCase(),
      label,
    });
  }
}

function serializeSvg(svg, index) {
  const clone = svg.cloneNode(true);
  clone.querySelectorAll("script,foreignObject").forEach((node) => node.remove());
  const originals = [svg, ...svg.querySelectorAll("*")];
  const clones = [clone, ...clone.querySelectorAll("*")];
  const idMap = new Map();

  clones.forEach((node) => {
    if (!node.id) return;
    const nextId = `live-svg-${index}-${node.id}`;
    idMap.set(node.id, nextId);
    node.id = nextId;
  });

  const presentationProperties = [
    ["fill", "fill"],
    ["stroke", "stroke"],
    ["stroke-width", "strokeWidth"],
    ["stroke-linecap", "strokeLinecap"],
    ["stroke-linejoin", "strokeLinejoin"],
    ["fill-rule", "fillRule"],
    ["clip-rule", "clipRule"],
    ["opacity", "opacity"],
    ["fill-opacity", "fillOpacity"],
    ["stroke-opacity", "strokeOpacity"],
  ];

  originals.forEach((original, nodeIndex) => {
    const cloned = clones[nodeIndex];
    if (!cloned) return;
    const style = getComputedStyle(original);
    presentationProperties.forEach(([attribute, property]) => {
      const value = style[property];
      if (value && value !== "normal") cloned.setAttribute(attribute, value);
    });
    cloned.removeAttribute("class");
    [...cloned.attributes].forEach((attribute) => {
      let value = attribute.value;
      idMap.forEach((nextId, oldId) => {
        value = value
          .replaceAll(`url(#${oldId})`, `url(#${nextId})`)
          .replaceAll(`#${oldId}`, `#${nextId}`);
      });
      if (value !== attribute.value) cloned.setAttribute(attribute.name, value);
      if (/^on/i.test(attribute.name)) cloned.removeAttribute(attribute.name);
    });
  });

  return {
    innerMarkup: clone.innerHTML,
    rootStyle: {
      color: getComputedStyle(svg).color,
      fill: getComputedStyle(svg).fill,
      stroke: getComputedStyle(svg).stroke,
      strokeWidth: getComputedStyle(svg).strokeWidth,
    },
    nodeCount: clone.querySelectorAll("*").length,
    shapeCount: clone.querySelectorAll("path,circle,rect,line,polyline,polygon,ellipse").length,
    hasDefs: Boolean(clone.querySelector("defs")),
  };
}

const inlineIcons = [...document.querySelectorAll("svg")].map((svg, index) => {
  const rect = svg.getBoundingClientRect();
  const interactive = svg.closest("button,a,[role='button']");
  const serialized = serializeSvg(svg, index);
  const pathData = [...svg.querySelectorAll("path")].map((path) => path.getAttribute("d")).filter(Boolean);
  return {
    index,
    label: shortLabel(interactive || svg),
    viewBox: svg.getAttribute("viewBox") || "",
    width: Math.round(rect.width * 100) / 100,
    height: Math.round(rect.height * 100) / 100,
    role: svg.getAttribute("role"),
    ariaHidden: svg.getAttribute("aria-hidden"),
    pathData,
    ...serialized,
  };
});

const imageIcons = [...document.querySelectorAll("img")]
  .map((image) => ({
    src: image.currentSrc || image.src,
    alt: image.alt,
    width: image.naturalWidth,
    height: image.naturalHeight,
    rendered: visibleRect(image),
  }))
  .filter((image) => /icon|logo|arrow|chevron|badge|mark|navigation/i.test(`${image.src} ${image.alt}`));

const maskImages = elements.flatMap((element) => {
  const style = getComputedStyle(element);
  const mask = style.maskImage !== "none" ? style.maskImage : style.webkitMaskImage;
  return mask && mask !== "none" ? [{ value: mask, label: shortLabel(element) }] : [];
});

const buttonGroups = new Map();
for (const element of document.querySelectorAll("button,a,[role='button']")) {
  const rect = visibleRect(element);
  if (!rect) continue;
  const style = getComputedStyle(element);
  const signature = JSON.stringify({
    backgroundColor: style.backgroundColor,
    backgroundImage: style.backgroundImage,
    color: style.color,
    border: `${style.borderWidth} ${style.borderStyle} ${style.borderColor}`,
    borderRadius: style.borderRadius,
    boxShadow: style.boxShadow,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    height: Math.round(rect.height),
    minHeight: style.minHeight,
    padding: style.padding,
  });
  const current = buttonGroups.get(signature) ?? {
    signature: JSON.parse(signature),
    uses: 0,
    labels: [],
    tags: [],
  };
  current.uses += 1;
  const label = shortLabel(element);
  if (label && current.labels.length < 12 && !current.labels.includes(label)) current.labels.push(label);
  if (!current.tags.includes(element.tagName.toLowerCase())) current.tags.push(element.tagName.toLowerCase());
  buttonGroups.set(signature, current);
}

const stylesheetUrls = [...document.styleSheets].map((sheet) => sheet.href).filter(Boolean);
const stylesheetTexts = await Promise.all(stylesheetUrls.map(async (url) => {
  try {
    const response = await fetch(url);
    return response.ok ? { url, css: await response.text() } : { url, css: "" };
  } catch {
    return { url, css: "" };
  }
}));

const gradientCounts = new Map();
const declaredBackgrounds = new Map();
const declaredRadii = new Map();
for (const { url, css } of stylesheetTexts) {
  const gradients = css.match(/(?:linear|radial|conic)-gradient\([^;{}]+\)/g) ?? [];
  gradients.forEach((value) => increment(gradientCounts, value.replace(/\s+/g, " ").trim(), url));
  const backgrounds = css.match(/(?:background|background-color):\s*[^;}]+/g) ?? [];
  backgrounds.forEach((value) => increment(declaredBackgrounds, value.replace(/\s+/g, " ").trim(), url));
  const radiusValues = css.match(/border-radius:\s*[^;}]+/g) ?? [];
  radiusValues.forEach((value) => increment(declaredRadii, value.replace(/\s+/g, " ").trim(), url));
}

const inventory = {
  schemaVersion: 1,
  collectedAt: new Date().toISOString(),
  url: location.href,
  viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
  totals: {
    elements: elements.length,
    stylesheets: stylesheetUrls.length,
    stylesheetBytes: stylesheetTexts.reduce((sum, item) => sum + item.css.length, 0),
    inlineSvgs: inlineIcons.length,
    imageIcons: imageIcons.length,
    maskImages: maskImages.length,
    buttonStyleGroups: buttonGroups.size,
    shapeSamples: shapes.length,
  },
  icons: { inline: inlineIcons, images: imageIcons, masks: maskImages },
  buttons: [...buttonGroups.values()].sort((a, b) => b.uses - a.uses),
  shapes,
  computed: {
    backgroundColors: ranked(backgroundColors),
    foregroundColors: ranked(foregroundColors),
    backgroundImages: ranked(backgroundImages),
    radii: ranked(radii),
    borders: ranked(borders),
    shadows: ranked(shadows),
  },
  declared: {
    gradients: ranked(gradientCounts),
    backgrounds: ranked(declaredBackgrounds),
    radii: ranked(declaredRadii),
  },
  stylesheetUrls,
};

return JSON.stringify(inventory, null, 2);
