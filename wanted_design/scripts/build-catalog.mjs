import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const rawPath = path.join(root, "data/raw/montage.json");
const curatedDir = path.join(root, "data/curated");
const docsDir = path.join(root, "docs");

const raw = JSON.parse(await readFile(rawPath, "utf8"));
await Promise.all([mkdir(curatedDir, { recursive: true }), mkdir(docsDir, { recursive: true })]);
const collectedDate = new Date(raw.metadata.collectedAt).toISOString().slice(0, 10);

const writeJson = (name, value) =>
  writeFile(path.join(curatedDir, name), `${JSON.stringify(value, null, 2)}\n`);

const escapeTable = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
const titleCase = (value) =>
  value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const pageByPath = new Map(raw.pages.map((page) => [page.path, page]));
const descriptionOf = (page) =>
  page?.blocks.find(
    (block) => block.type === "p" && !block.text.startsWith("©") && block.text !== "On this page",
  )?.text || "";

const routes = raw.pages.map((page) => ({
  path: page.path,
  title: page.title,
  status: page.status,
  heading: page.headings[0]?.text || "",
  url: page.url,
}));

const themeNames = Object.keys(raw.themes.light).sort();
const pairedTokens = Object.fromEntries(
  themeNames.map((name) => [
    name,
    {
      light: raw.themes.light[name] ?? null,
      dark: raw.themes.dark[name] ?? null,
      changesWithTheme: raw.themes.light[name] !== raw.themes.dark[name],
    },
  ]),
);

const semanticTokens = Object.fromEntries(
  Object.entries(pairedTokens).filter(([name]) => name.startsWith("--semantic-")),
);
const atomicTokens = Object.fromEntries(
  Object.entries(pairedTokens).filter(([name]) => name.startsWith("--atomic-")),
);
const systemTokens = Object.fromEntries(
  Object.entries(pairedTokens).filter(
    ([name]) => !name.startsWith("--semantic-") && !name.startsWith("--atomic-"),
  ),
);
const colorTokens = [...Object.entries(atomicTokens), ...Object.entries(semanticTokens)]
  .map(([name, values]) => {
    const segments = name.replace(/^--/, "").split("-");
    return {
      name,
      kind: segments[0],
      group: segments[1] || "other",
      isRgbCompanion: name.endsWith("-rgb"),
      ...values,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const componentGroups = new Map();
for (const page of raw.pages) {
  const match = page.path.match(/^\/docs\/components\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!match) continue;
  const [, category, slug, surface] = match;
  const key = `${category}/${slug}`;
  if (!componentGroups.has(key)) {
    componentGroups.set(key, {
      category,
      slug,
      name: page.headings[0]?.text || titleCase(slug),
      description: "",
      sections: [],
      surfaces: {},
      assets: [],
    });
  }
  const component = componentGroups.get(key);
  const summary = {
    url: page.url,
    title: page.title,
    sections: page.headings.filter((heading) => heading.level >= 2).map((heading) => heading.text),
    code: page.code,
    images: page.images,
  };
  component.surfaces[surface] = summary;
  component.assets.push(...page.images.map((image) => image.src));
  if (surface === "design") {
    component.description = descriptionOf(page);
    component.sections = summary.sections;
  }
}

const components = [...componentGroups.values()]
  .map((component) => ({
    ...component,
    assets: [...new Set(component.assets)].sort(),
    availableSurfaces: Object.keys(component.surfaces).sort(),
  }))
  .sort((a, b) => `${a.category}/${a.slug}`.localeCompare(`${b.category}/${b.slug}`));

const utilities = raw.pages
  .filter((page) => /^\/docs\/utilities\/[^/]+\/[^/]+$/.test(page.path))
  .map((page) => {
    const [, , , category, slug] = page.path.split("/");
    return {
      category,
      slug,
      name: page.headings[0]?.text || titleCase(slug),
      description: descriptionOf(page),
      sections: page.headings.filter((heading) => heading.level >= 2).map((heading) => heading.text),
      code: page.code,
      url: page.url,
    };
  })
  .sort((a, b) => `${a.category}/${a.slug}`.localeCompare(`${b.category}/${b.slug}`));

const foundations = raw.pages
  .filter((page) => page.path.startsWith("/docs/foundations/") && page.path !== "/docs/foundations")
  .map((page) => ({
    path: page.path,
    name: page.headings[0]?.text || page.title.replace(/ - Montage$/, ""),
    description: descriptionOf(page),
    sections: page.headings.filter((heading) => heading.level >= 2).map((heading) => heading.text),
    tables: page.tables,
    images: page.images,
    url: page.url,
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

const typographyPage = pageByPath.get("/docs/foundations/base-material/typography");
const typographyRows = typographyPage?.tables[0]?.rows || [];
const typography = typographyRows.slice(1).map(([name, fontSize, lineHeightRaw, letterSpacing]) => {
  const match = lineHeightRaw?.match(/^([^ ]+)(?: \(([^)]+)\))?/);
  return {
    name,
    fontSize,
    lineHeight: match?.[1] || lineHeightRaw,
    lineHeightRatio: match?.[2] ? Number(match[2]) : null,
    letterSpacing,
  };
});

const gridPage = pageByPath.get("/docs/foundations/base-material/grid");
const grid = {
  base: "8px",
  recommendedSpacingIncrement: "4px",
  visualCorrectionIncrement: "2px",
  artboards: gridPage?.tables[0]?.rows || [],
  breakpoints: gridPage?.tables[1]?.rows || [],
  layout: {
    gutter: "20px",
    mobileColumns: 2,
    tabletColumns: 3,
    desktopColumns: 12,
  },
  source: gridPage?.url,
};

const gradientPage = pageByPath.get("/docs/utilities/web-utilities/gradient");
const gradientDescription = (heading) => {
  const index = gradientPage?.blocks.findIndex(
    (block) => block.type === "h2" && block.text.toLocaleLowerCase() === heading,
  );
  return index >= 0
    ? gradientPage.blocks.slice(index + 1).find((block) => block.type === "p")?.text || ""
    : "";
};
const gradientCode = (mode) =>
  gradientPage?.code.find((snippet) => snippet.includes(`'${mode}')`)) || "";
const gradients = {
  source: gradientPage?.url,
  collectedAt: raw.metadata.collectedAt,
  easingStops: [
    { position: 0, alpha: 0 },
    { position: 14, alpha: 0.14 },
    { position: 26, alpha: 0.27 },
    { position: 37, alpha: 0.38 },
    { position: 46, alpha: 0.48 },
    { position: 54, alpha: 0.57 },
    { position: 60, alpha: 0.65 },
    { position: 66, alpha: 0.71 },
    { position: 71, alpha: 0.77 },
    { position: 76, alpha: 0.82 },
    { position: 80, alpha: 0.86 },
    { position: 83, alpha: 0.9 },
    { position: 87, alpha: 0.93 },
    { position: 91, alpha: 0.96 },
    { position: 95, alpha: 0.98 },
    { position: 100, alpha: 1 },
  ],
  modes: [
    {
      id: "solid",
      name: "Solid",
      description: gradientDescription("solid"),
      direction: "right",
      size: "100%",
      colorToken: "--semantic-inverse-background",
      baseToken: "--semantic-background-normal-normal",
      code: gradientCode("solid"),
    },
    {
      id: "multiple",
      name: "Multiple",
      description: gradientDescription("multiple"),
      direction: "right",
      size: "100%",
      colorToken: "--semantic-inverse-background",
      baseToken: "--semantic-primary-normal",
      code: gradientCode("multiple"),
    },
    {
      id: "mask",
      name: "Mask",
      description: gradientDescription("mask"),
      direction: "right",
      size: "80px",
      colorToken: "--semantic-inverse-background",
      baseToken: "--semantic-background-normal-normal",
      code: gradientCode("mask"),
    },
  ],
};

const tokenCssBlock = (selector, tokens) => {
  const declarations = Object.entries(tokens)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  return `${selector} {\n${declarations}\n}`;
};
const tokensCss = [
  `/* Generated from https://montage.wanted.co.kr on ${collectedDate}. */`,
  tokenCssBlock(':root, [data-theme="light"]', raw.themes.light),
  tokenCssBlock('[data-theme="dark"]', raw.themes.dark),
  "",
].join("\n\n");

await Promise.all([
  writeJson("metadata.json", raw.metadata),
  writeJson("routes.json", routes),
  writeJson("tokens.light.json", raw.themes.light),
  writeJson("tokens.dark.json", raw.themes.dark),
  writeJson("tokens.semantic.json", semanticTokens),
  writeJson("tokens.atomic.json", atomicTokens),
  writeJson("tokens.system.json", systemTokens),
  writeJson("colors.json", {
    source: "https://montage.wanted.co.kr/docs/foundations/base-material/colors/semantic",
    collectedAt: raw.metadata.collectedAt,
    counts: {
      total: colorTokens.length,
      atomic: Object.keys(atomicTokens).length,
      semantic: Object.keys(semanticTokens).length,
      themeAware: colorTokens.filter((token) => token.changesWithTheme).length,
    },
    tokens: colorTokens,
  }),
  writeJson("components.json", components),
  writeJson("utilities.json", utilities),
  writeJson("foundations.json", foundations),
  writeJson("typography.json", typography),
  writeJson("grid.json", grid),
  writeJson("gradients.json", gradients),
  writeJson("icons.json", raw.icons),
  writeJson("assets.json", raw.assets),
  writeFile(path.join(curatedDir, "tokens.css"), tokensCss),
]);

const componentRows = components
  .map(
    (component) =>
      `| ${escapeTable(titleCase(component.category))} | ${escapeTable(component.name)} | ${escapeTable(component.availableSurfaces.join(", "))} | [Design](${component.surfaces.design?.url || component.surfaces.web?.url}) |`,
  )
  .join("\n");

const componentDoc = `# Montage components\n\n${components.length}개 컴포넌트를 카테고리와 플랫폼별로 정규화했습니다. 세부 설명, 섹션, 코드 조각, 이미지 URL은 \`data/curated/components.json\`에 있습니다.\n\n| Category | Component | Available surfaces | Source |\n| --- | --- | --- | --- |\n${componentRows}\n`;

const semanticRows = Object.entries(semanticTokens)
  .map(
    ([name, values]) =>
      `| \`${name}\` | \`${escapeTable(values.light)}\` | \`${escapeTable(values.dark)}\` | ${values.changesWithTheme ? "Yes" : "No"} |`,
  )
  .join("\n");
const semanticDoc = `# Montage semantic tokens\n\n라이트/다크 테마에서 브라우저가 계산한 시멘틱 토큰입니다. CSS에서 바로 쓰려면 \`data/curated/tokens.css\`를 사용하세요.\n\n| Token | Light | Dark | Theme-aware |\n| --- | --- | --- | --- |\n${semanticRows}\n`;

const typographyRowsMd = typography
  .map(
    (item) =>
      `| ${escapeTable(item.name)} | ${item.fontSize} | ${item.lineHeight} | ${item.lineHeightRatio ?? "-"} | ${item.letterSpacing} |`,
  )
  .join("\n");
const foundationsDoc = `# Montage foundations\n\n## Principles\n\n- Extensibility: 컴포넌트의 확장성을 유지하는 구조\n- Consistency: 일관된 사용자 경험\n- Efficiency: 일관된 품질로 제품 개발 효율 향상\n\n## Typography\n\n기본 글꼴은 한국어, 영어, 일본어를 지원하는 Pretendard JP입니다. 사이트 전역에는 Wanted Sans 변수도 정의되어 있습니다.\n\n| Style | Size | Line height | Ratio | Letter spacing |\n| --- | --- | --- | --- | --- |\n${typographyRowsMd}\n\n## Grid\n\n- 8px 기반 체계, 권장 간격은 4px 배수\n- 시각 보정은 기본 2px, 불가피할 때 1px\n- Gutter 20px\n- Mobile 2 columns, Tablet 3 columns, Desktop 12 columns\n\n정확한 아트보드와 브레이크포인트 표는 \`data/curated/grid.json\`에 있습니다.\n\n## Color and elevation\n\n- ${Object.keys(semanticTokens).length} semantic tokens\n- ${Object.keys(atomicTokens).length} atomic tokens\n- elevation/shadow tokens 포함\n- 전체 라이트/다크 값은 \`data/curated/colors.json\`과 \`tokens.css\`에 있습니다.\n\n## Icons\n\n- ${raw.iconVectors?.length || raw.icons.length} reusable 24×24 SVG vectors\n- 전체 메타데이터: \`data/curated/icon-vectors.json\`\n- 개별 SVG 파일: \`assets/montage/icons/\`\n- 아이콘은 문서 UI의 공개 이름과 inline SVG에서 추출했으며 \`currentColor\`를 유지합니다.\n`;

const externalLinks = [...new Map(
  raw.pages
    .flatMap((page) => page.links)
    .filter((link) => !link.href.startsWith("https://montage.wanted.co.kr"))
    .map((link) => [link.href, link]),
).values()].sort((a, b) => a.href.localeCompare(b.href));
const sourcesDoc = `# Sources\n\n## Primary\n\n- [Montage documentation](https://montage.wanted.co.kr/)\n- [Terms of use](https://montage.wanted.co.kr/docs/getting-started/terms-of-use)\n\n## Linked resources\n\n${externalLinks.map((link) => `- [${link.text || link.href}](${link.href})`).join("\n")}\n`;

const readme = `# Wanted Montage design-system capture\n\n원티드의 공개 디자인 시스템 [Montage](https://montage.wanted.co.kr/)를 ${collectedDate} 기준으로 수집한 로컬 카탈로그입니다.\n\n## What is included\n\n- ${raw.metadata.pageCount} public pages, including every official sitemap route\n- ${components.length} normalized components across design, web, iOS, and Android surfaces\n- ${utilities.length} utilities\n- ${Object.keys(semanticTokens).length} semantic tokens and ${Object.keys(atomicTokens).length} atomic tokens\n- ${raw.iconVectors?.length || raw.icons.length} reusable SVG icon vectors\n- ${raw.assets.length} public image assets with local download manifests\n- light/dark CSS variables ready for reuse\n\n## Start here\n\n- [Interactive HTML catalog](viewer/index.html)\n- [Downloaded asset collection](docs/ASSET_COLLECTION.md)\n- [Foundations](docs/FOUNDATIONS.md)\n- [Components](docs/COMPONENTS.md)\n- [Semantic tokens](docs/SEMANTIC_TOKENS.md)\n- [Sources](docs/SOURCES.md)\n- [License and attribution notes](docs/LICENSE_AND_ATTRIBUTION.md)\n\n## Data layout\n\n- \`data/raw/montage.json\`: complete normalized crawl output\n- \`data/raw/home-shapes.json\`: live home marquee, Behind, and Resources capture\n- \`data/curated/colors.json\`: atomic and semantic light/dark color tokens\n- \`data/curated/shapes.json\`: 21 slide shapes, 3 Behind placements, and 3 Lottie resources\n- \`data/curated/icon-vectors.json\`: reusable icon metadata\n- \`data/curated/buttons.json\`: button-family visual references\n- \`data/curated/infographics.json\`: remaining documentation visuals\n- \`data/curated/asset-manifest.json\`: source URL, local path, dimensions, hashes, and download status\n- \`assets/montage/icons/\`: individual SVG icon files\n- \`assets/montage/images/\`: downloaded PNG references\n- \`assets/montage/shapes/\`: resource animation JSON and static SVG previews\n- \`viewer/index.html\`: searchable light/dark HTML catalog\n\n## Refresh\n\n1. Open \`https://montage.wanted.co.kr\` with the local browser runner.\n2. Run the documentation collector into \`data/raw/montage.json\`.\n3. Run the home-shape collector into \`data/raw/home-shapes.json\`.\n4. Run \`node scripts/build-catalog.mjs\`.\n5. Run \`node scripts/export-montage-assets.mjs --download\`.\n6. Run \`node scripts/build-home-shapes.mjs --download\`.\n7. Run \`node scripts/build-viewer.mjs\`.\n8. Run \`node scripts/validate-capture.mjs\`.\n\n## Preview\n\nRun \`python3 -m http.server 8093 --bind 127.0.0.1\`, then open \`http://localhost:8093/viewer/\`.\n\nThe docs state that Montage is MIT-licensed, including commercial use and modification, with copyright and license notice requirements. Wanted logos and other brand assets follow separate guidelines and must not be used to impersonate Wanted.\n`;

const licenseDoc = `# License and attribution notes\n\nSource: [Montage Terms of use](https://montage.wanted.co.kr/docs/getting-started/terms-of-use)\n\nThe published terms describe Montage as an MIT-licensed open-source project. They allow commercial use, modification, distribution, private use, and derivative works. Copies or substantial portions must retain the copyright notice, original-author attribution, and the full license text.\n\nWanted logos, wordmarks, and other brand assets are governed by separate brand guidelines. The component system may be reused, but it must not be presented in a way that impersonates or is likely to be confused with Wanted. The terms also prohibit illegal or public-harm uses such as phishing, fraud, and personal-data theft.\n\nThis file is a practical collection note, not the complete MIT license text or legal advice. Before distributing copied source code, retrieve the authoritative license file from the specific Montage repository being used.\n`;

await Promise.all([
  writeFile(path.join(root, "README.md"), readme),
  writeFile(path.join(docsDir, "COMPONENTS.md"), componentDoc),
  writeFile(path.join(docsDir, "SEMANTIC_TOKENS.md"), semanticDoc),
  writeFile(path.join(docsDir, "FOUNDATIONS.md"), foundationsDoc),
  writeFile(path.join(docsDir, "SOURCES.md"), sourcesDoc),
  writeFile(path.join(docsDir, "LICENSE_AND_ATTRIBUTION.md"), licenseDoc),
]);

console.log(
  JSON.stringify(
    {
      pages: raw.metadata.pageCount,
      components: components.length,
      utilities: utilities.length,
      semanticTokens: Object.keys(semanticTokens).length,
      atomicTokens: Object.keys(atomicTokens).length,
      icons: raw.icons.length,
      assets: raw.assets.length,
    },
    null,
    2,
  ),
);
