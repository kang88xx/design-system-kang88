import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = new URL('..', import.meta.url);
const catalogPath = new URL('../data/curated/catalog.json', import.meta.url);
const manifestPath = new URL('../data/sources/open-source-manifest.json', import.meta.url);

const githubApiHost = 'api.github.com';
const rawGithubHost = 'raw.githubusercontent.com';
const materialIconsRepo = {
  owner: 'google',
  repo: 'material-design-icons',
  branch: 'master',
  license: 'Apache-2.0',
  assetRoot: 'assets/material-symbols/rounded',
};
const materialWebRepo = {
  owner: 'material-components',
  repo: 'material-web',
  branch: 'main',
  license: 'Apache-2.0',
  assetRoot: 'assets/upstream/material-web',
};

const requestedInterfaceIcons = [
  'check_box',
  'radio_button_checked',
  'toggle_on',
  'progress_activity',
  'notifications',
  'tune',
  'contrast',
  'shapes',
  'download',
  'content_copy',
  'code',
  'animation',
  'info',
  'keyboard',
  'arrow_forward',
  'hourglass_empty',
  'refresh',
  'search',
];

const officialMaterialSymbolAliases = {
  people: 'groups',
};

const selectedMaterialWebTokenFiles = [
  'tokens/_md-sys-motion.scss',
  'tokens/_md-sys-shape.scss',
  'tokens/_md-sys-state.scss',
  'tokens/_md-sys-elevation.scss',
  'tokens/versions/v0_192/_md-sys-motion.scss',
  'tokens/versions/v0_192/_md-sys-shape.scss',
  'tokens/versions/v0_192/_md-sys-state.scss',
  'tokens/versions/v0_192/_md-sys-elevation.scss',
  'tokens/versions/v0_192/_md-sys-color.scss',
];

const upstreamFiles = [
  {
    repo: materialIconsRepo,
    upstreamPath: 'LICENSE',
    localPath: 'assets/upstream/material-design-icons/LICENSE',
    id: 'material-design-icons-license',
  },
  {
    repo: materialWebRepo,
    upstreamPath: 'LICENSE',
    localPath: 'assets/upstream/material-web/LICENSE',
    id: 'material-web-license',
  },
  ...selectedMaterialWebTokenFiles.map((upstreamPath) => ({
    repo: materialWebRepo,
    upstreamPath,
    localPath: `${materialWebRepo.assetRoot}/${upstreamPath}`,
    id: `material-web-${path.basename(upstreamPath, '.scss').replace(/^_/, '')}`,
  })),
];

function assertAllowedUrl(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Only HTTPS URLs are allowed: ${url}`);
  }

  if (![githubApiHost, rawGithubHost].includes(parsed.hostname)) {
    throw new Error(`Unexpected upstream host: ${parsed.hostname}`);
  }

  if (parsed.hostname === rawGithubHost) {
    const allowedRawPrefixes = [
      `/${materialIconsRepo.owner}/${materialIconsRepo.repo}/`,
      `/${materialWebRepo.owner}/${materialWebRepo.repo}/`,
    ];
    if (!allowedRawPrefixes.some((prefix) => parsed.pathname.startsWith(prefix))) {
      throw new Error(`Unexpected raw GitHub path: ${parsed.pathname}`);
    }
  }
}

async function getBytes(url) {
  assertAllowedUrl(url);
  const response = await fetch(url, {
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
    headers: {
      Accept: 'application/vnd.github+json, text/plain;q=0.9, */*;q=0.8',
      'User-Agent': 'google-product-design-catalog-open-assets-collector',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function getText(url) {
  return (await getBytes(url)).toString('utf8');
}

async function getBranchCommit(repo) {
  const url = `https://${githubApiHost}/repos/${repo.owner}/${repo.repo}/commits/${repo.branch}`;
  const commit = JSON.parse(await getText(url));
  if (!/^[a-f0-9]{40}$/.test(commit.sha)) {
    throw new Error(`Unexpected commit sha for ${repo.owner}/${repo.repo}: ${commit.sha}`);
  }
  return commit.sha;
}

function rawUrl(repo, commit, upstreamPath) {
  return `https://${rawGithubHost}/${repo.owner}/${repo.repo}/${commit}/${upstreamPath}`;
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function inspectSvg(svgBytes, iconName) {
  const svg = svgBytes.toString('utf8');
  if (!svg.startsWith('<svg')) {
    throw new Error(`Material Symbol is not an SVG: ${iconName}`);
  }
  const viewBox = svg.match(/\bviewBox="([^"]+)"/)?.[1];
  if (!viewBox) {
    throw new Error(`Missing viewBox in Material Symbol: ${iconName}`);
  }
  return { viewBox };
}

function iconCategories(iconName, iconSource) {
  const categories = new Set(['material-symbols-rounded', ...iconSource]);

  if (/^(menu|chevron_|expand_|arrow_|open_in_new|home|apps|grid_view|view_list)$/.test(iconName)) {
    categories.add('navigation');
  }
  if (/^(add|edit|delete|archive|download|upload|content_copy|refresh|search|tune|filter_list|settings|more_vert)$/.test(iconName)) {
    categories.add('action');
  }
  if (/^(mail|inbox|send|draft|mark_email_read|chat|notifications|people|group|person_add|call)$/.test(iconName)) {
    categories.add('communication');
  }
  if (/^(calendar_today|event|today|schedule|task_alt|folder|description|computer|attach_file|label|link|keyboard)$/.test(iconName)) {
    categories.add('productivity');
  }
  if (/^(videocam|video_call|present_to_all|mic)$/.test(iconName)) {
    categories.add('meeting');
  }
  if (/^(finance|monitoring|trending_up|trending_down|show_chart|candlestick_chart|currency_exchange|add_chart)$/.test(iconName)) {
    categories.add('finance');
  }
  if (/^(warning|info|help|lock|shield_lock|policy|cloud|progress_activity|hourglass_empty)$/.test(iconName)) {
    categories.add('status');
  }
  if (/^(check_box|radio_button_checked|toggle_on|contrast|shapes|code|animation)$/.test(iconName)) {
    categories.add('interface-control');
  }

  return [...categories].sort();
}

async function downloadFirst(urls) {
  const errors = [];
  for (const url of urls) {
    try {
      return { url, bytes: await getBytes(url) };
    } catch (error) {
      errors.push(error.message);
    }
  }
  throw new Error(errors.join('\n'));
}

async function writeAsset(relativePath, bytes) {
  const destination = new URL(`../${relativePath}`, import.meta.url);
  await mkdir(new URL('./', destination), { recursive: true });
  await writeFile(destination, bytes);
}

async function collectIcons(commit, catalogIconNames) {
  const iconSourceMap = new Map();
  for (const name of catalogIconNames) {
    iconSourceMap.set(name, new Set([...(iconSourceMap.get(name) ?? []), 'catalog']));
  }
  for (const name of requestedInterfaceIcons) {
    iconSourceMap.set(name, new Set([...(iconSourceMap.get(name) ?? []), 'common-interface']));
  }

  const icons = [];
  for (const name of [...iconSourceMap.keys()].sort()) {
    const upstreamName = officialMaterialSymbolAliases[name] ?? name;
    const upstreamBase = `symbols/web/${upstreamName}/materialsymbolsrounded`;
    const candidatePaths = [
      `${upstreamBase}/${upstreamName}_wght500_24px.svg`,
      `${upstreamBase}/${upstreamName}_24px.svg`,
    ];
    const { url, bytes } = await downloadFirst(
      candidatePaths.map((candidatePath) => rawUrl(materialIconsRepo, commit, candidatePath)),
    );
    const { viewBox } = inspectSvg(bytes, name);
    const localPath = `${materialIconsRepo.assetRoot}/${name}.svg`;
    await writeAsset(localPath, bytes);

    icons.push({
      id: `material-symbols-rounded-${name}`,
      name,
      upstreamName,
      path: localPath,
      sourceUrl: url,
      sha256: sha256(bytes),
      bytes: bytes.length,
      viewBox,
      categories: iconCategories(name, [...iconSourceMap.get(name)]),
      license: materialIconsRepo.license,
    });
  }
  return icons;
}

async function collectUpstreamFile(commits, file) {
  const commit = commits[`${file.repo.owner}/${file.repo.repo}`];
  const url = rawUrl(file.repo, commit, file.upstreamPath);
  const bytes = await getBytes(url);
  await writeAsset(file.localPath, bytes);
  return {
    id: file.id,
    path: file.localPath,
    upstreamPath: file.upstreamPath,
    sourceUrl: url,
    sha256: sha256(bytes),
    bytes: bytes.length,
    license: file.repo.license,
  };
}

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const catalogIconNames = catalog.assets?.iconNames;
  if (!Array.isArray(catalogIconNames) || catalogIconNames.length === 0) {
    throw new Error('data/curated/catalog.json is missing assets.iconNames');
  }

  const commits = {
    [`${materialIconsRepo.owner}/${materialIconsRepo.repo}`]: await getBranchCommit(materialIconsRepo),
    [`${materialWebRepo.owner}/${materialWebRepo.repo}`]: await getBranchCommit(materialWebRepo),
  };

  const icons = await collectIcons(commits['google/material-design-icons'], catalogIconNames);
  const upstreamFileRecords = [];
  for (const file of upstreamFiles) {
    upstreamFileRecords.push(await collectUpstreamFile(commits, file));
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourcePolicy: 'Only official Apache-2.0 upstream assets are stored. Google product marks, screenshots, hosted product UI art, and brand treatments remain reference-only.',
    upstreamRepositories: [
      {
        id: 'material-design-icons',
        owner: materialIconsRepo.owner,
        repo: materialIconsRepo.repo,
        branch: materialIconsRepo.branch,
        commit: commits['google/material-design-icons'],
        license: materialIconsRepo.license,
        sourceUrl: `https://github.com/${materialIconsRepo.owner}/${materialIconsRepo.repo}/tree/${commits['google/material-design-icons']}`,
      },
      {
        id: 'material-web',
        owner: materialWebRepo.owner,
        repo: materialWebRepo.repo,
        branch: materialWebRepo.branch,
        commit: commits['material-components/material-web'],
        license: materialWebRepo.license,
        sourceUrl: `https://github.com/${materialWebRepo.owner}/${materialWebRepo.repo}/tree/${commits['material-components/material-web']}`,
      },
    ],
    counts: {
      catalogIconNames: catalogIconNames.length,
      requestedInterfaceIcons: requestedInterfaceIcons.length,
      icons: icons.length,
      upstreamFiles: upstreamFileRecords.length,
    },
    icons,
    upstreamFiles: upstreamFileRecords,
    selectedMaterialWeb: {
      purpose: 'Official token SCSS references for motion, shape, state, and elevation decisions.',
      files: selectedMaterialWebTokenFiles,
    },
  };

  await mkdir(new URL('./', manifestPath), { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const relativeManifest = path.relative(repoRoot.pathname, manifestPath.pathname);
  console.log(`Collected ${icons.length} Material Symbols Rounded icons.`);
  console.log(`Collected ${upstreamFileRecords.length} upstream files.`);
  console.log(`Wrote ${relativeManifest}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
