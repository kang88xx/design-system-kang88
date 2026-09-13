import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const readJson = async (file, fallback = null) => {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (fallback !== null && error.code === "ENOENT") return fallback;
    throw error;
  }
};

const components = await readJson("data/curated/components.json", []);
const utilities = await readJson("data/curated/utilities.json", []);
const gradients = await readJson("data/curated/gradients.json", {});
const shapes = await readJson("data/curated/shapes.json", {});
const foundations = await readJson("data/curated/foundations.json", []);
const semanticTokens = await readJson("data/curated/tokens.semantic.json", {});
const liveHomeEvidence = await readJson("data/raw/live-home-evidence.json", {});
const siteObservations = await readJson("data/raw/site-observations.json", {});

const generatedAt = new Date().toISOString();
const officialHomeUrl = liveHomeEvidence.url || shapes.source || "https://montage.wanted.co.kr/";
const upstreamCommit = "bfced87f96dfb21c8ea80074c551b64b9ed1530b";
const upstreamBase = `https://github.com/wanteddev/montage-web/blob/${upstreamCommit}`;
const hash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);
const slug = (value) =>
  String(value || "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const isUsableSnippet = (code) => {
  if (typeof code !== "string") return false;
  const trimmed = code.trim();
  if (trimmed.length < 80) return false;
  if (!trimmed.includes("\n")) return false;
  if (/^[A-Za-z_$][\w$]*(?:<.*>)?$/.test(trimmed)) return false;
  if (/^[-\w.]+$/.test(trimmed)) return false;
  return /(?:import\s|<[A-Z][\w.]*|fun\s|val\s|var\s|const\s|return\s|@State|struct\s|class\s|css`|keyframes`|\{|\(|=>)/.test(
    trimmed,
  );
};

const normalizeSnippet = (code) =>
  code
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n");

const examples = [];
const seenExamples = new Set();
const pushExample = ({ idSeed, name, category, surface, sourceUrl, code, evidence = "documented" }) => {
  if (!isUsableSnippet(code)) return;
  const normalized = normalizeSnippet(code);
  const fingerprint = hash(`${surface}\n${normalized}`);
  if (seenExamples.has(fingerprint)) return;
  seenExamples.add(fingerprint);
  examples.push({
    id: `${slug(idSeed)}-${examples.length + 1}`,
    name,
    category,
    surface,
    sourceUrl,
    code: normalized,
    evidence,
  });
};

for (const component of components) {
  for (const [surface, details] of Object.entries(component.surfaces || {})) {
    for (const [index, code] of (details.code || []).entries()) {
      pushExample({
        idSeed: `component-${component.category}-${component.slug}-${surface}-${index + 1}`,
        name: `${component.name} ${surface} example ${index + 1}`,
        category: `component/${component.category}`,
        surface,
        sourceUrl: details.url,
        code,
      });
    }
  }
}

for (const utility of utilities) {
  for (const [index, code] of (utility.code || []).entries()) {
    pushExample({
      idSeed: `utility-${utility.category}-${utility.slug}-${index + 1}`,
      name: `${utility.name} example ${index + 1}`,
      category: `utility/${utility.category}`,
      surface: utility.category.includes("web") ? "web" : utility.category.replace("-utilities", ""),
      sourceUrl: utility.url,
      code,
    });
  }
}

for (const mode of gradients.modes || []) {
  pushExample({
    idSeed: `gradient-${mode.id}`,
    name: `Gradient ${mode.name}`,
    category: "utility/web-gradient",
    surface: "web",
    sourceUrl: gradients.source,
    code: mode.code,
  });
}

const tokenExists = (name) => Object.prototype.hasOwnProperty.call(semanticTokens, name);
const shadowTokenNames = Object.keys(semanticTokens)
  .filter((name) => name.startsWith("--semantic-elevation-shadow-"))
  .sort();

const gradientOffset = [
  1, 0.859704, 0.73763, 0.632, 0.541037, 0.462963, 0.396, 0.33837, 0.288296, 0.244, 0.203704,
  0.16563, 0.128, 0.089037, 0.046963,
];
const gradientOpacity = [
  0, 0.142163, 0.269304, 0.3824, 0.48243, 0.57037, 0.6472, 0.713896, 0.771437, 0.8208,
  0.862963, 0.898904, 0.9296, 0.95603, 0.97917,
];
const maskGradientOffset = [...gradientOffset, 0];
const maskGradientOpacity = [
  1, 0.857837, 0.730696, 0.6176, 0.51757, 0.42963, 0.3528, 0.286104, 0.228563, 0.1792,
  0.137037, 0.101096, 0.0704, 0.0439704, 0.0208296, 0,
];
const gradientDirection = {
  top: "bottom",
  right: "left",
  bottom: "top",
  left: "right",
};
const roundedHundred = (value) => Math.round(value * 100) / 100;
const faithfulGradientMask = (variant, size, type) => {
  const isMask = type === "mask";
  const offsets = isMask ? maskGradientOffset : gradientOffset;
  const opacities = isMask ? maskGradientOpacity : gradientOpacity;
  const direction = isMask ? variant : gradientDirection[variant];
  return `linear-gradient(to ${direction}, ${offsets
    .map(
      (offset, index) =>
        `rgba(0, 0, 0, ${roundedHundred(opacities[index])}) calc(100% - calc(${size} * ${roundedHundred(offset)}))`,
    )
    .join(", ")})`;
};
const faithfulGradientCss = (variant, size, type, colorToken = "--semantic-inverse-background") => {
  const maskImage = faithfulGradientMask(variant, size, type);
  return `mask-image: ${maskImage};
  -webkit-mask-image: ${maskImage};
  background-color: var(${colorToken});`;
};

const surfaces = [
  {
    id: "surface-card-elevated",
    name: "Elevated card surface",
    sourceUrl: "https://montage.wanted.co.kr/docs/foundations/base-material/elevation",
    evidence: tokenExists("--semantic-elevation-shadow-normal-small") ? "documented" : "approximation",
    description: "Reusable box recipe for elevated content with semantic background, border, radius, and a documented shadow token.",
    css: `.wds-surface-card {
  background: var(--semantic-background-elevated-normal);
  border: 1px solid var(--semantic-line-normal-alternative);
  border-radius: var(--wds-radius-card, 8px);
  box-shadow: var(--semantic-elevation-shadow-normal-small);
  color: var(--semantic-label-normal);
}`,
  },
  {
    id: "surface-panel-quiet",
    name: "Quiet panel surface",
    sourceUrl: "https://montage.wanted.co.kr/docs/foundations/base-material/colors/semantic",
    evidence: "documented",
    description: "Low-emphasis panel for grouped controls and repeated list containers.",
    css: `.wds-surface-panel {
  background: var(--semantic-background-normal-alternative);
  border: 1px solid var(--semantic-line-normal-normal);
  border-radius: var(--wds-radius-panel, 8px);
  color: var(--semantic-label-normal);
}`,
  },
  {
    id: "surface-framed-selected",
    name: "Selected framed surface",
    sourceUrl: "https://montage.wanted.co.kr/docs/components/utils/framed-style/web",
    evidence: "documented",
    description: "Framed style equivalent for selected or keyboard-focusable blocks.",
    css: `.wds-surface-framed-selected {
  background: var(--semantic-background-elevated-normal);
  border: 1px solid var(--semantic-primary-normal);
  border-radius: var(--wds-radius-framed, 8px);
  box-shadow: 0 0 0 3px rgba(var(--semantic-primary-normal-rgb), 0.12);
}`,
  },
  {
    id: "surface-inset-box",
    name: "Inset utility box",
    sourceUrl: "https://montage.wanted.co.kr/docs/utilities/web-utility-components/box",
    evidence: "documented",
    description: "Neutral Box utility style for placeholders, examples, and object previews.",
    css: `.wds-surface-inset {
  background: var(--semantic-fill-alternative);
  border: 1px solid var(--semantic-line-normal-normal);
  border-radius: var(--wds-radius-box, 8px);
  box-shadow: inset 0 0 0 1px var(--semantic-line-solid-normal);
}`,
  },
  {
    id: "surface-gradient-fade-right",
    name: "Gradient fade right",
    sourceUrl: `${upstreamBase}/packages/wds/src/utils/color.ts#L1-L42`,
    evidence: "documented",
    description: "Faithful portable output for WDS gradient(color, 'right', '100%', 'solid').",
    css: `.wds-gradient-fade-right {
  ${faithfulGradientCss("right", "100%", "solid")}
}`,
  },
  {
    id: "surface-gradient-mask-right",
    name: "Gradient mask right",
    sourceUrl: `${upstreamBase}/packages/wds/src/utils/color.ts#L1-L42`,
    evidence: "documented",
    description: "Faithful portable output for WDS gradient(color, 'right', '80px', 'mask').",
    css: `.wds-gradient-mask-right {
  ${faithfulGradientCss("right", "80px", "mask")}
}`,
  },
  ...shadowTokenNames.map((tokenName) => ({
    id: `shadow-${slug(tokenName.replace("--semantic-elevation-shadow-", ""))}`,
    name: tokenName.replace("--semantic-elevation-shadow-", "Shadow "),
    sourceUrl: "https://montage.wanted.co.kr/docs/foundations/base-material/elevation",
    evidence: "documented",
    description: `Direct semantic elevation recipe for ${tokenName}.`,
    css: tokenName.includes("-drop-")
      ? `.wds-${slug(tokenName.replace("--semantic-elevation-", ""))} {
  filter: var(${tokenName});
}`
      : `.wds-${slug(tokenName.replace("--semantic-elevation-", ""))} {
  box-shadow: var(${tokenName});
}`,
  })),
];

const observedHomeEnter = (liveHomeEvidence.animations || []).find(
  (animation) =>
    animation.timing?.duration === 600 &&
    animation.keyframes?.[0]?.opacity === "0" &&
    animation.keyframes?.[0]?.transform?.includes("20px"),
);
const observedShapeEnter = (liveHomeEvidence.animations || []).find(
  (animation) => animation.timing?.duration === 1000 && animation.timing?.delay === 400,
);

const motion = [
  {
    id: "home-hero-enter",
    name: "Home hero enter",
    description: "Observed Montage home hero text/link enter: opacity 0 to 1 with 20px upward settle.",
    duration: observedHomeEnter?.timing?.duration ?? 600,
    easing: observedHomeEnter?.timing?.easing ?? "cubic-bezier(0.4, 0.14, 0.3, 1)",
    css: `.wds-motion-home-hero-enter {
  animation: wds-enter-y-20 600ms cubic-bezier(0.4, 0.14, 0.3, 1) both;
}`,
    sourceUrl: officialHomeUrl,
    evidence: observedHomeEnter ? "observed" : "approximation",
  },
  {
    id: "home-shapes-enter",
    name: "Home shapes enter",
    description: "Observed Montage home marquee/shapes region enter with delayed opacity and translateY reveal.",
    duration: observedShapeEnter?.timing?.duration ?? 1000,
    easing: observedShapeEnter?.timing?.easing ?? "cubic-bezier(0.4, 0.14, 0.3, 1)",
    css: `.wds-motion-home-shapes-enter {
  animation: wds-enter-y-20 1000ms cubic-bezier(0.4, 0.14, 0.3, 1) 400ms both;
}`,
    sourceUrl: officialHomeUrl,
    evidence: observedShapeEnter ? "observed" : "approximation",
  },
  {
    id: "presence-fade",
    name: "AnimationPresence fade",
    description: "Documented AnimationPresence fade mount/unmount pattern.",
    duration: 400,
    easing: "ease",
    css: `.wds-motion-presence-fade[data-status="open"] {
  animation: wds-fade-in 400ms ease both;
}
.wds-motion-presence-fade[data-status="close"] {
  animation: wds-fade-out 400ms ease both;
}`,
    sourceUrl: "https://montage.wanted.co.kr/docs/utilities/web-utility-components/animation-presence",
    evidence: "documented",
  },
  {
    id: "tooltip-slide",
    name: "Tooltip slide",
    description: "Documented tooltip example: fade with vertical 10px slide in and out.",
    duration: 400,
    easing: "ease",
    css: `.wds-motion-tooltip-slide[data-status="open"] {
  animation: wds-tooltip-in 400ms ease both;
}
.wds-motion-tooltip-slide[data-status="close"] {
  animation: wds-tooltip-out 400ms ease both;
}`,
    sourceUrl: "https://montage.wanted.co.kr/docs/utilities/web-utility-components/animation-presence",
    evidence: "documented",
  },
  {
    id: "press-feedback",
    name: "Press feedback",
    description: "Documented WithInteraction overlay feedback: opacity and transform transition over 0.15s ease with stronger active opacity.",
    duration: 150,
    easing: "ease",
    css: `.wds-motion-press {
  position: relative;
  overflow: hidden;
}
.wds-motion-press > .wds-motion-interaction-overlay {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease, transform 150ms ease;
  transform-origin: center;
}
.wds-motion-press:hover > .wds-motion-interaction-overlay {
  opacity: 0.05;
}
.wds-motion-press:active > .wds-motion-interaction-overlay {
  opacity: 0.12;
}`,
    sourceUrl: `${upstreamBase}/packages/wds/src/components/with-interaction/style.ts#L13-L96`,
    evidence: "documented",
  },
  {
    id: "skeleton-shimmer",
    name: "Skeleton pulse",
    description: "Exact WDS Skeleton animation: pulse opacity 0.5 -> 1 -> 0.5 over 2s ease-in-out.",
    duration: 2000,
    easing: "ease-in-out",
    css: `.wds-motion-skeleton {
  animation: wds-skeleton-pulse 2000ms ease-in-out infinite;
}`,
    sourceUrl: `${upstreamBase}/packages/wds/src/components/skeleton/style.ts#L8-L16`,
    evidence: "documented",
  },
  {
    id: "toast-rise",
    name: "Toast stack mount",
    description: "Documented Toast/Snackbar mount/unmount pattern: opacity, height, and margin-top animate over 0.2s ease.",
    duration: 200,
    easing: "ease",
    css: `.wds-motion-toast[data-status="open"] {
  animation: wds-toast-in 200ms ease both;
}
.wds-motion-toast[data-status="close"] {
  animation: wds-toast-out 200ms ease both;
}`,
    sourceUrl: `${upstreamBase}/packages/wds/src/components/toast/style.ts#L8-L58`,
    evidence: "documented",
  },
  {
    id: "circular-loading",
    name: "Circular loading",
    description: "Exact WDS circular loader motion: dash-array and dash-offset loop at 5.3333s ease, rotation at 2.2s linear.",
    duration: 5333,
    easing: "ease + linear",
    css: `.wds-motion-circular-loading circle {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  transform-origin: center center;
  animation:
    wds-loading-array 5333.3ms ease infinite,
    wds-loading-offset 5333.3ms ease infinite,
    wds-loading-rotate 2200ms linear infinite;
}`,
    sourceUrl: `${upstreamBase}/packages/wds/src/components/loading/style.ts#L30-L94`,
    evidence: "documented",
  },
  {
    id: "wanted-loading",
    name: "Wanted loading",
    description: "Exact WDS branded loader timing expressed as public source recipe variables; keep brand usage behind product/brand approval.",
    duration: 3600,
    easing: "linear + cubic-bezier",
    css: `.wds-motion-wanted-loading {
  --time: 0.9;
  --wds-loader-accent-pink: var(--atomic-pink-60);
  --wds-loader-accent-red-orange: var(--atomic-redOrange-50);
  fill: var(--semantic-primary-normal);
  animation: wds-wanted-loading-color calc(var(--time) * 4s) calc(var(--time) * 0.5s) linear infinite;
}
[data-theme="dark"] .wds-motion-wanted-loading,
.wds-motion-wanted-loading[data-theme="dark"] {
  --wds-loader-accent-pink: var(--atomic-pink-70);
  --wds-loader-accent-red-orange: var(--atomic-redOrange-60);
}
.wds-motion-wanted-loading,
.wds-motion-wanted-loading * {
  transform-origin: center;
}
.wds-motion-wanted-loading g {
  animation:
    wds-wanted-loading-start calc(var(--time) * 0.5s) cubic-bezier(0.5, 0, 0.5, 1),
    wds-loading-rotate calc(var(--time) * 2s) linear infinite;
}
.wds-motion-wanted-loading g path {
  animation: wds-wanted-loading-bounce calc(var(--time) * 3s) cubic-bezier(0.8, 0, 0.2, 1) infinite;
  transform: scale(0);
}
.wds-motion-wanted-loading g path.circle {
  animation:
    wds-wanted-loading-bounce calc(var(--time) * 3s) cubic-bezier(0.5, 0, 0.5, 1),
    wds-wanted-loading-bounce calc(var(--time) * 3s) calc(var(--time) * 3s) cubic-bezier(0.8, 0, 0.2, 1) infinite;
}
.wds-motion-wanted-loading g path.triangle {
  animation-delay: calc(var(--time) * 1s);
}
.wds-motion-wanted-loading g path.square {
  animation-delay: calc(var(--time) * 2s);
}`,
    sourceUrl: `${upstreamBase}/packages/wds/src/components/loading/style.ts#L96-L188`,
    evidence: "documented",
  },
  {
    id: "shape-marquee",
    name: "Shape marquee",
    description: "Continuous marquee for the collected Montage home shape tiles. Source assets are documented; loop timing is an implementation approximation.",
    duration: 30000,
    easing: "linear",
    css: `.wds-motion-shape-marquee {
  display: flex;
  gap: 20px;
  width: max-content;
  animation: wds-shape-marquee 30000ms linear infinite;
}`,
    sourceUrl: officialHomeUrl,
    evidence: "approximation",
  },
];

const recipesCss = `/* Generated by scripts/build-reuse-library.mjs. Import data/curated/tokens.css before this file. */
:where(.wds-reuse) {
  --wds-radius-box: 8px;
  --wds-radius-card: 8px;
  --wds-radius-panel: 8px;
  --wds-radius-framed: 8px;
  --wds-motion-ease-emphasized: cubic-bezier(0.4, 0.14, 0.3, 1);
  --wds-motion-duration-fast: 140ms;
  --wds-motion-duration-medium: 240ms;
  --wds-motion-duration-enter: 600ms;
  --wds-toast-animation-height: 48px;
  --wds-toast-animation-margin-top: 8px;
}

${surfaces.map((surface) => surface.css).join("\n\n")}

@keyframes wds-enter-y-20 {
  from { opacity: 0; transform: translate3d(0, 20px, 0); }
  to { opacity: 1; transform: none; }
}

@keyframes wds-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes wds-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes wds-tooltip-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes wds-tooltip-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
}

@keyframes wds-toast-in {
  from { opacity: 0; height: 0; margin-top: 0; }
  to { opacity: 1; height: var(--wds-toast-animation-height, 48px); margin-top: var(--wds-toast-animation-margin-top, 8px); }
}

@keyframes wds-toast-out {
  from { opacity: 1; height: var(--wds-toast-animation-height, 48px); margin-top: var(--wds-toast-animation-margin-top, 8px); }
  to { opacity: 0; height: 0; margin-top: 0; }
}

@keyframes wds-skeleton-pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

@keyframes wds-shape-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes wds-loading-array {
  0%, 25%, 50%, 75%, 100% { stroke-dasharray: 0 78.5398163397; }
  12.5%, 37.5%, 62.5%, 87.5% { stroke-dasharray: 58.9048622548 19.6349540849; }
}

@keyframes wds-loading-offset {
  0%, 12.5% { stroke-dashoffset: 0; }
  25%, 37.5% { stroke-dashoffset: -58.9048622548; }
  50%, 62.5% { stroke-dashoffset: -117.8097245096; }
  75%, 87.5% { stroke-dashoffset: -176.7145867644; }
  100% { stroke-dashoffset: -235.6195; }
}

@keyframes wds-loading-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes wds-wanted-loading-start {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes wds-wanted-loading-color {
  0%, 100% { fill: var(--semantic-primary-normal); }
  25%, 75% { fill: var(--semantic-accent-foreground-pink); }
  50% { fill: var(--semantic-accent-background-redOrange); }
}

@keyframes wds-wanted-loading-bounce {
  0%, 66.6666666667%, 100% { transform: scale(0); }
  33.3333333333% { transform: scale(1); }
}

${motion.map((item) => item.css).join("\n\n")}

@media (prefers-reduced-motion: reduce) {
  .wds-motion-home-hero-enter,
  .wds-motion-home-shapes-enter,
  .wds-motion-presence-fade,
  .wds-motion-tooltip-slide,
  .wds-motion-press,
  .wds-motion-press > .wds-motion-interaction-overlay,
  .wds-motion-skeleton,
  .wds-motion-toast,
  .wds-motion-circular-loading circle,
  .wds-motion-wanted-loading,
  .wds-motion-wanted-loading g,
  .wds-motion-wanted-loading g path,
  .wds-motion-shape-marquee {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

const reuseLibrary = {
  generatedAt,
  source: {
    primary: "https://montage.wanted.co.kr/",
    docs: "https://montage.wanted.co.kr/docs",
    localEvidence: [
      "data/curated/components.json",
      "data/curated/utilities.json",
      "data/curated/gradients.json",
      "data/curated/shapes.json",
      "data/curated/tokens.css",
      "data/raw/live-home-evidence.json",
      ...(Object.keys(siteObservations).length ? ["data/raw/site-observations.json"] : []),
      "docs/SOURCE_RESEARCH.md",
      "assets/montage/source/montage-web-bfced87.tar.gz",
    ],
    upstream: {
      repository: "https://github.com/wanteddev/montage-web",
      commit: upstreamCommit,
      release: "v3.12.0",
    },
    generatedBy: "scripts/build-reuse-library.mjs",
  },
  counts: {
    examples: examples.length,
    surfaces: surfaces.length,
    motion: motion.length,
    components: components.length,
    utilities: utilities.length,
    gradients: (gradients.modes || []).length,
    shapeAssets: (shapes.marquee || []).length + (shapes.behind || []).length + (shapes.resources || []).length,
    foundations: foundations.length,
  },
  examples,
  surfaces,
  motion,
};

const motionJson = {
  generatedAt,
  source: reuseLibrary.source,
  counts: {
    motion: motion.length,
    observed: motion.filter((item) => item.evidence === "observed").length,
    documented: motion.filter((item) => item.evidence === "documented").length,
    approximation: motion.filter((item) => item.evidence === "approximation").length,
  },
  motion,
};

const docs = `# Reuse Library

This package is generated from the local Montage capture so application work can reuse documented source examples, portable surface CSS, and motion recipes without searching the raw crawl by hand.

## JSON contract

\`data/curated/reuse-library.json\` has this stable top-level shape:

\`\`\`ts
type ReuseLibrary = {
  generatedAt: string;
  source: {
    primary: string;
    docs: string;
    localEvidence: string[];
    upstream?: {
      repository: string;
      commit: string;
      release: string;
    };
    generatedBy: string;
  };
  counts: Record<string, number>;
  examples: Array<{
    id: string;
    name: string;
    category: string;
    surface: string;
    sourceUrl: string;
    code: string;
    evidence: "documented";
  }>;
  surfaces: Array<{
    id: string;
    name: string;
    css: string;
    sourceUrl: string;
    evidence: "documented" | "observed" | "approximation";
    description: string;
  }>;
  motion: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    easing: string;
    css: string;
    sourceUrl: string;
    evidence: "observed" | "documented" | "approximation";
  }>;
};
\`\`\`

## Provenance

- Component and utility examples come from \`data/curated/components.json\` and \`data/curated/utilities.json\`. The builder keeps only substantial multi-line snippets and removes individual prop-name fragments.
- Gradient recipes mirror the pinned \`packages/wds/src/utils/color.ts\` output: \`mask-image\`, \`-webkit-mask-image\`, and \`background-color\` with documented size offsets.
- Box, frame, radius, and elevation recipes use semantic tokens from \`data/curated/tokens.css\` and documented component or foundation URLs.
- Home hero and shape enter timing comes from \`data/raw/live-home-evidence.json\`: opacity \`0 -> 1\`, \`translate3d(0, 20px, 0) -> none\`, \`600ms\` or \`1000ms\`, and \`cubic-bezier(0.4, 0.14, 0.3, 1)\`.
- WithInteraction press/overlay feedback, Skeleton pulse, Toast/Snackbar stack animation, and both Loading recipes are backed by the pinned public source research in \`docs/SOURCE_RESEARCH.md\`.
- Continuous marquee is marked as \`approximation\` because public captured source did not expose exact official loop timing for the reusable generic CSS version.
- Toast/Snackbar recipes expose \`--wds-toast-animation-height\` and \`--wds-toast-animation-margin-top\` defaults; override them with measured runtime values when animating dynamic content height.

## CSS usage

Load \`data/curated/tokens.css\` first, then \`data/curated/recipes.css\`.

\`\`\`html
<link rel="stylesheet" href="data/curated/tokens.css">
<link rel="stylesheet" href="data/curated/recipes.css">
\`\`\`

Use \`.wds-reuse\` on a wrapping element when you want the default recipe variables. The recipe classes are portable CSS and import nothing by themselves.

\`\`\`html
<section class="wds-reuse wds-surface-card wds-motion-home-hero-enter">
  Reused Montage-style surface
</section>
\`\`\`

## Regeneration

\`\`\`bash
node scripts/build-reuse-library.mjs
\`\`\`

The command writes:

- \`data/curated/reuse-library.json\`
- \`data/curated/motion.json\`
- \`data/curated/recipes.css\`
- \`docs/REUSE_LIBRARY.md\`
`;

await Promise.all([
  writeFile("data/curated/reuse-library.json", `${JSON.stringify(reuseLibrary, null, 2)}\n`),
  writeFile("data/curated/motion.json", `${JSON.stringify(motionJson, null, 2)}\n`),
  writeFile("data/curated/recipes.css", recipesCss),
  writeFile("docs/REUSE_LIBRARY.md", docs),
]);

console.log(
  JSON.stringify(
    {
      status: "ok",
      counts: reuseLibrary.counts,
      observedMotion: motionJson.counts.observed,
      documentedMotion: motionJson.counts.documented,
      approximatedMotion: motionJson.counts.approximation,
    },
    null,
    2,
  ),
);
