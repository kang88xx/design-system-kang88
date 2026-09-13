import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const UPSTREAM_ROOT = "assets/montage/source/upstream";
const ICON_SRC = `${UPSTREAM_ROOT}/packages/wds-icon/src`;
const OUT_DIR = "assets/montage/icons-upstream";
const OUT_JSON = "data/curated/upstream-icons.json";

const TARGET_SLUGS = [
  "agent-color",
  "blank-color",
  "corner-down-left",
  "hash-tag",
  "logo-apple-color",
  "logo-facebook-color",
  "logo-google-color",
  "logo-google-play-color",
  "logo-instagram-color",
  "logo-kakao-color",
  "logo-linked-in-color",
  "logo-microsoft-color",
  "logo-naver-blog-color",
  "logo-youtube-color",
  "navigation-career",
  "navigation-menu",
  "navigation-mypage",
  "navigation-recruit",
  "navigation-social",
  "symbol",
];

const BRAND_SLUGS = new Set([
  "logo-apple-color",
  "logo-facebook-color",
  "logo-google-color",
  "logo-google-play-color",
  "logo-instagram-color",
  "logo-kakao-color",
  "logo-linked-in-color",
  "logo-microsoft-color",
  "logo-naver-blog-color",
  "logo-youtube-color",
  "symbol",
]);

const JSX_ATTRIBUTE_RENAMES = new Map([
  ["clipRule", "clip-rule"],
  ["fillRule", "fill-rule"],
  ["stopColor", "stop-color"],
  ["stopOpacity", "stop-opacity"],
  ["strokeLinecap", "stroke-linecap"],
  ["strokeLinejoin", "stroke-linejoin"],
  ["strokeMiterlimit", "stroke-miterlimit"],
  ["strokeWidth", "stroke-width"],
  ["xlinkHref", "xlink:href"],
]);

const manifest = readJson("data/curated/source-manifest.json");
const upstream = manifest.upstream;
const packageJson = readJson(`${UPSTREAM_ROOT}/packages/wds-icon/package.json`);
const exportNames = readExportNames();

fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });

const records = TARGET_SLUGS.map(buildIcon);
writeJson(OUT_JSON, records);

console.log(`Wrote ${records.length} upstream icons`);
for (const record of records) {
  console.log(`${record.name} ${record.sha256} ${record.byteSize}`);
}

function buildIcon(slug) {
  const sourcePath = `${ICON_SRC}/icon-${slug}.tsx`;
  const localSourcePath = path.join(ROOT, sourcePath);
  if (!fs.existsSync(localSourcePath)) {
    throw new Error(`Missing upstream icon source: ${sourcePath}`);
  }

  const tsx = fs.readFileSync(localSourcePath, "utf8");
  const name = exportNames.get(slug) ?? readComponentName(tsx);
  if (!name) {
    throw new Error(`Missing IconPascal export for ${slug}`);
  }

  const svg = renderSvg(slug, tsx);
  const outPath = `${OUT_DIR}/${name}.svg`;
  fs.writeFileSync(path.join(ROOT, outPath), svg);

  const stat = fs.statSync(path.join(ROOT, outPath));
  const hash = crypto.createHash("sha256").update(svg).digest("hex");
  const viewBox = getAttribute(svg, "viewBox");
  const [, , width, height] = viewBox.split(/\s+/).map(Number);

  return {
    name,
    localPath: outPath,
    viewBox,
    width,
    height,
    sha256: hash,
    byteSize: stat.size,
    source: sourcePath,
    sourceUrl: `${upstream.repository}/blob/${upstream.commit}/packages/wds-icon/src/icon-${slug}.tsx`,
    evidence: "documented",
    brandAsset: BRAND_SLUGS.has(slug),
    origin: {
      repository: upstream.repository,
      release: upstream.release,
      commit: upstream.commit,
      package: packageJson.name,
      packageVersion: packageJson.version,
    },
  };
}

function renderSvg(slug, tsx) {
  const ids = Array.from(tsx.matchAll(/const\s+([A-Za-z]\w*)\s*=\s*useId\(\);/g)).map(
    ([, id]) => id,
  );
  const idMap = new Map(ids.map((id) => [id, `upstream-${slug}-${id}`]));
  const styleMap = readStyleConstants(tsx);

  const start = tsx.indexOf("<Box");
  const end = tsx.lastIndexOf("</Box>");
  if (start === -1 || end === -1) {
    throw new Error(`Could not find Box SVG wrapper for ${slug}`);
  }

  const sourceSvg = tsx.slice(start, end + "</Box>".length);
  const startTagEnd = sourceSvg.indexOf(">");
  const rawStartTag = sourceSvg.slice(0, startTagEnd + 1);
  let inner = sourceSvg.slice(startTagEnd + 1, -"</Box>".length);

  inner = inner
    .replace(/\s+ref=\{ref\}/g, "")
    .replace(/\s+\{\.\.\.props\}/g, "")
    .replace(/\s+as="svg"/g, "")
    .replace(/<foreignObject\b/g, "<foreignObject")
    .replace(/\s+style=\{\{\s*maskType:\s*['"]alpha['"],?\s*\}\}/g, ' style="mask-type:alpha"');

  for (const [styleName, styleValue] of styleMap) {
    inner = inner.replaceAll(`style={${styleName}}`, `style="${styleValue}"`);
  }

  for (const [reactName, svgName] of JSX_ATTRIBUTE_RENAMES) {
    inner = inner.replace(new RegExp(`\\b${reactName}=`, "g"), `${svgName}=`);
  }

  for (const [idName, idValue] of idMap) {
    inner = inner
      .replaceAll(`{\`url(#\${${idName}})\`}`, `"url(#${idValue})"`)
      .replaceAll(`{\`#\${${idName}}\`}`, `"#${idValue}"`)
      .replaceAll(`{${idName}}`, `"${idValue}"`);
  }

  const viewBox = getAttribute(rawStartTag, "viewBox");
  const fill = getOptionalAttribute(rawStartTag, "fill");
  const role = getOptionalAttribute(rawStartTag, "role");
  const ariaLabelledBy = getExpressionAttribute(rawStartTag, "aria-labelledby", idMap);
  const [, , width, height] = viewBox.split(/\s+/).map(Number);

  const attrs = [
    `viewBox="${viewBox}"`,
    fill ? `fill="${fill}"` : null,
    'xmlns="http://www.w3.org/2000/svg"',
    rawStartTag.includes("xmlnsXlink=") ? 'xmlns:xlink="http://www.w3.org/1999/xlink"' : null,
    `width="${width}"`,
    `height="${height}"`,
    role ? `role="${role}"` : null,
    ariaLabelledBy ? `aria-labelledby="${ariaLabelledBy}"` : null,
  ].filter(Boolean);

  const svg = `<svg ${attrs.join(" ")}>${compactSvg(inner)}</svg>\n`;
  validateNoJsx(svg, slug);
  return svg;
}

function compactSvg(inner) {
  return inner
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\/>/g, "/>")
    .trim();
}

function readStyleConstants(tsx) {
  const styles = new Map();
  for (const [, name, background] of tsx.matchAll(
    /const\s+([A-Za-z]\w*)\s*=\s*\{\s*background:\s*'([^']+)'\s*,?\s*\};/g,
  )) {
    styles.set(name, `background:${background}`);
  }
  return styles;
}

function readExportNames() {
  const index = fs.readFileSync(path.join(ROOT, ICON_SRC, "index.ts"), "utf8");
  const names = new Map();
  for (const [, name, slug] of index.matchAll(
    /export\s+\{\s+default\s+as\s+([A-Za-z]\w*)\s+\}\s+from\s+'\.\/icon-([^']+)';/g,
  )) {
    names.set(slug, name);
  }
  return names;
}

function readComponentName(tsx) {
  const match = tsx.match(/const\s+(Icon[A-Za-z0-9]+)\s*=\s*forwardRef/);
  if (!match) return null;
  return match[1];
}

function getAttribute(source, attribute) {
  const match = source.match(new RegExp(`${escapeRegExp(attribute)}="([^"]+)"`));
  if (!match) {
    throw new Error(`Missing ${attribute} attribute`);
  }
  return match[1];
}

function getOptionalAttribute(source, attribute) {
  const match = source.match(new RegExp(`${escapeRegExp(attribute)}="([^"]+)"`));
  return match?.[1] ?? null;
}

function getExpressionAttribute(source, attribute, idMap) {
  const match = source.match(new RegExp(`${escapeRegExp(attribute)}=\\{([A-Za-z]\\w*)\\}`));
  if (!match) return null;
  return idMap.get(match[1]) ?? null;
}

function validateNoJsx(svg, slug) {
  const leftovers = ["{", "}", "`", "fillRule", "clipRule", "stopColor", "style={{"];
  const leftover = leftovers.find((token) => svg.includes(token));
  if (leftover) {
    throw new Error(`Leftover JSX token "${leftover}" in ${slug}`);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(path.join(ROOT, filePath), `${JSON.stringify(data, null, 2)}\n`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
