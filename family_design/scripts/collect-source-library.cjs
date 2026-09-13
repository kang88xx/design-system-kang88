const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const outRoot = path.join(root, 'references', 'v3-source');
const publicRoot = path.join(outRoot, 'public');
const landingUrl = 'https://family.co/';
const generatedAt = new Date().toISOString();
const reindexOnly = process.argv.includes('--reindex-only');

const FIRST_PARTY_HOSTS = new Set(['family.co', 'www.family.co']);
const DESIGN_HOSTS = new Set(['family.co', 'www.family.co', 'fonts.gstatic.com', 'fonts.googleapis.com']);
const urlToLocal = new Map();
const discovered = new Set();
const downloaded = new Set();
const failed = [];
const gaps = [];
const items = [];
const RESOURCE_EXTENSIONS = new Set([
  '.css', '.js', '.mjs', '.json',
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg', '.ico',
  '.mp4', '.webm', '.mov',
  '.woff', '.woff2', '.ttf', '.otf',
  '.pdf', '.zip',
]);
const FIRST_PARTY_ASSET_PREFIX = /\/(?:_next\/static|assets|avatars|docs\/avatars|docs\/fonts|docs\/hero|fonts|media|videos)\//;

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function localPathFor(urlString) {
  const url = new URL(urlString);
  const host = url.hostname.replace(/^www\./, '');
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  if (!path.extname(pathname)) pathname += '.html';
  const safePath = pathname
    .replace(/^\/+/, '')
    .replace(/[<>:"|?*\x00-\x1F]/g, '_')
    .replace(/\.\./g, '_');
  const queryHash = url.search ? '-' + sha256(Buffer.from(url.search)).slice(0, 8) : '';
  const parsed = path.parse(safePath);
  return path.join(publicRoot, host, parsed.dir, `${parsed.name}${queryHash}${parsed.ext}`);
}

function toRel(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function categoryFor(urlString, localPath = '') {
  const lower = `${new URL(urlString, landingUrl).pathname} ${localPath}`.toLowerCase();
  if (/\.(woff2?|ttf|otf|eot)$/.test(lower) || lower.includes('/fonts/')) return 'font';
  if (/\.(mp4|webm|mov)$/.test(lower) || lower.includes('/videos/')) return 'video';
  if (/\.(png|jpe?g|webp|gif|avif|ico)$/.test(lower)) return 'image';
  if (/\.svg$/.test(lower)) return 'svg';
  if (/\.css$/.test(lower)) return 'stylesheet';
  if (/\.(m?js|jsx|ts|tsx)$/.test(lower) || lower.includes('/_next/static/chunks/')) return 'script-bundle';
  if (/\.json$/.test(lower)) return 'data';
  if (/\.html?$/.test(lower)) return 'html';
  return 'asset';
}

function hasResourceExtension(urlString) {
  const ext = path.extname(new URL(urlString, landingUrl).pathname).toLowerCase();
  return RESOURCE_EXTENSIONS.has(ext);
}

function isHtmlLike(buffer, contentType) {
  const head = buffer.subarray(0, 160).toString('utf8').trim().toLowerCase();
  return /text\/html|application\/xhtml/.test(contentType) || head.startsWith('<!doctype html') || head.startsWith('<html');
}

function existingCategory(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'video';
  if (/\.(png|jpe?g|webp)$/.test(lower)) return 'image';
  if (lower.endsWith('.svg')) return 'svg';
  if (/\.(woff2?|ttf|otf|eot)$/.test(lower)) return 'font';
  if (lower.endsWith('.css')) return 'stylesheet';
  if (lower.includes('/_next/static/') || lower.includes('\\_next\\static\\')) return 'script-bundle';
  if (lower.endsWith('.js') || lower.endsWith('.cjs') || lower.endsWith('.py')) return 'script';
  if (lower.endsWith('.json') || lower.endsWith('.jsonl')) return 'data';
  if (lower.endsWith('.md')) return 'documentation';
  if (lower.endsWith('.html')) return 'html';
  return 'asset';
}

function statusForResponse(response) {
  if (response.ok) return 'downloaded';
  if (response.status === 401 || response.status === 403) return 'private-or-forbidden';
  if (response.status === 404) return 'missing-public';
  return `http-${response.status}`;
}

function cachedFileDetails(filePath) {
  if (!fs.existsSync(filePath)) return { path: null, bytes: 0, sha256: null };
  const buffer = fs.readFileSync(filePath);
  return { path: toRel(filePath), bytes: buffer.length, sha256: sha256(buffer) };
}

function addDiscovered(urlString, origin, reason) {
  let normalized;
  try {
    normalized = new URL(urlString, landingUrl);
  } catch {
    return;
  }
  if (!['http:', 'https:'].includes(normalized.protocol)) return;
  normalized.hash = '';
  if (!DESIGN_HOSTS.has(normalized.hostname)) return;
  if (normalized.pathname.includes('/cdn-cgi/')) return;
  const isRootHtml = normalized.toString() === landingUrl;
  const isCssJsFollow = origin === 'landing-html' && /\.(css|js|mjs)$/i.test(normalized.pathname);
  const isHtmlResource = origin === 'landing-html' && hasResourceExtension(normalized.toString());
  const isCssResource = origin === 'stylesheet' && hasResourceExtension(normalized.toString());
  const isAsset = hasResourceExtension(normalized.toString()) && (FIRST_PARTY_ASSET_PREFIX.test(normalized.pathname) || normalized.hostname.includes('fonts.g'));
  if (!isRootHtml && !isCssJsFollow && !isHtmlResource && !isCssResource && !isAsset) return;
  const key = normalized.toString();
  if (!discovered.has(key)) {
    discovered.add(key);
    urlToLocal.set(key, localPathFor(key));
  }
  return { url: key, origin, reason };
}

function extractUrls(text, baseUrl, origin) {
  const found = [];
  const htmlDecode = value => value.replace(/&amp;/g, '&');
  const patterns = [
    /\b(?:src|href|poster|content)=["']([^"']+)["']/gi,
    /\bsrcset=["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
    /["'`]((?:https?:\/\/[^"'`\s)]+|\/(?:_next\/static|assets|avatars|docs\/avatars|docs\/fonts|docs\/hero|fonts|media|videos)\/[^"'`\s)]+?\.(?:css|js|mjs|json|png|jpe?g|webp|gif|avif|svg|ico|mp4|webm|mov|woff2?|ttf|otf|pdf|zip)(?:\?[^"'`\s)]*)?))["'`]/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const rawValue = htmlDecode(match[1]);
      const candidates = pattern.source.includes('srcset')
        ? rawValue.split(',').map(part => part.trim().split(/\s+/)[0]).filter(Boolean)
        : [rawValue];
      for (const raw of candidates) {
      if (!raw || raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('#')) continue;
      const added = addDiscovered(new URL(raw, baseUrl).toString(), origin, 'literal-reference');
      if (added) found.push(added.url);
      }
    }
  }
  return found;
}

async function fetchBuffer(urlString) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(urlString, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 family-design-source-audit/3.0',
        accept: '*/*',
      },
    });
    const arrayBuffer = await response.arrayBuffer();
    return { response, buffer: Buffer.from(arrayBuffer) };
  } finally {
    clearTimeout(timeout);
  }
}

async function download(urlString, provenance = 'original-public') {
  if (downloaded.has(urlString)) return;
  downloaded.add(urlString);
  const localPath = urlToLocal.get(urlString) || localPathFor(urlString);
  if (reindexOnly && fs.existsSync(localPath)) {
    const buffer = fs.readFileSync(localPath);
    items.push({
      id: `public-${sha256(Buffer.from(urlString)).slice(0, 12)}`,
      name: path.basename(new URL(urlString).pathname) || new URL(urlString).hostname,
      category: categoryFor(urlString, localPath),
      provenance,
      status: 'downloaded',
      path: toRel(localPath),
      sourceUrl: urlString,
      bytes: buffer.length,
      sha256: sha256(buffer),
      description: 'Publicly referenced landing-page resource, reused from local cache.',
    });
    return { localPath, buffer, contentType: '' };
  }
  try {
    const { response, buffer } = await fetchBuffer(urlString);
    const status = statusForResponse(response);
    const contentType = response.headers.get('content-type') || '';
    const unexpectedHtml = response.ok && categoryFor(urlString, localPath) !== 'html' && isHtmlLike(buffer, contentType);
    if (response.ok && !unexpectedHtml) {
      ensureDir(localPath);
      fs.writeFileSync(localPath, buffer);
    } else {
      failed.push({ url: urlString, status: unexpectedHtml ? 'unexpected-html' : status, bytes: buffer.length });
    }
    items.push({
      id: `public-${sha256(Buffer.from(urlString)).slice(0, 12)}`,
      name: path.basename(new URL(urlString).pathname) || new URL(urlString).hostname,
      category: categoryFor(urlString, localPath),
      provenance,
      status: unexpectedHtml ? 'unexpected-html' : status,
      path: response.ok && !unexpectedHtml ? toRel(localPath) : cachedFileDetails(localPath).path,
      sourceUrl: urlString,
      bytes: response.ok && !unexpectedHtml ? buffer.length : cachedFileDetails(localPath).bytes,
      sha256: response.ok && !unexpectedHtml ? sha256(buffer) : cachedFileDetails(localPath).sha256,
      description: response.ok && !unexpectedHtml ? 'Publicly referenced landing-page resource, freshly verified.' : 'Current public request failed; cached file is linked only as fallback when present.',
    });
    if (!response.ok || unexpectedHtml) return null;
    return { localPath, buffer, contentType: response.headers.get('content-type') || '' };
  } catch (error) {
    const status = error.name === 'AbortError' ? 'timeout' : 'fetch-error';
    const cached = cachedFileDetails(localPath);
    failed.push({ url: urlString, status, message: error.message });
    items.push({
      id: `public-${sha256(Buffer.from(urlString)).slice(0, 12)}`,
      name: path.basename(new URL(urlString).pathname) || new URL(urlString).hostname,
      category: categoryFor(urlString, localPath),
      provenance,
      status,
      path: cached.path,
      sourceUrl: urlString,
      bytes: cached.bytes,
      sha256: cached.sha256,
      description: cached.path ? `${error.message}; cached file linked as fallback.` : error.message,
    });
    return null;
  }
}

function addExistingFile(filePath, provenance, status, description, sourceUrl = null) {
  if (!fs.existsSync(filePath)) return;
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) return;
  const buffer = fs.readFileSync(filePath);
  const rel = toRel(filePath);
  items.push({
    id: `local-${sha256(Buffer.from(rel)).slice(0, 12)}`,
    name: path.basename(filePath),
    category: existingCategory(filePath),
    provenance,
    status,
    path: rel,
    sourceUrl,
    bytes: stat.size,
    sha256: sha256(buffer),
    description,
  });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function sourceMaps() {
  const assetManifest = readJson(path.join(root, 'references/assets-manifest.json'), []);
  const mediaManifest = readJson(path.join(root, 'references/v2-source/media-library.json'), { videos: [] });
  const assetByPath = new Map(assetManifest.map(item => [item.path, item.url]));
  const videoByPath = new Map();
  for (const item of mediaManifest.videos || []) {
    if (item.local) videoByPath.set(item.local, item.source);
  }
  return { assetByPath, videoByPath };
}

function bundleSourceUrl(filePath) {
  const name = path.basename(filePath);
  if (name.startsWith('_app-')) return `https://family.co/_next/static/chunks/pages/${name}`;
  if (name.startsWith('index-')) return `https://family.co/_next/static/chunks/pages/${name}`;
  return `https://family.co/_next/static/chunks/${name}`;
}

function addCachedPublicFile(filePath) {
  const rel = toRel(filePath);
  const suffix = rel.split('references/v3-source/public/')[1];
  if (!suffix) return addExistingFile(filePath, 'original-public', 'included', 'Current public crawl cache from family.co and linked design resources.');
  const [host, ...parts] = suffix.split('/');
  const sourceUrl = `https://${host}/${parts.join('/')}`;
  const stat = fs.statSync(filePath);
  const buffer = fs.readFileSync(filePath);
  items.push({
    id: `public-${sha256(Buffer.from(sourceUrl)).slice(0, 12)}`,
    name: path.basename(filePath),
    category: existingCategory(filePath),
    provenance: 'original-public',
    status: 'downloaded',
    path: rel,
    sourceUrl,
    bytes: stat.size,
    sha256: sha256(buffer),
    description: 'Current public crawl cache from family.co and linked design resources.',
  });
}

function collectExisting() {
  const { assetByPath, videoByPath } = sourceMaps();
  const includeRoots = [
    'tokens.json',
    'tokens.css',
    'motion-source-tokens.json',
    'motion-data.json',
    'source-coverage.json',
    'DESIGN.md',
    'README.md',
    'references/assets-manifest.json',
    'references/live-source.html',
    'references/live-styles.css',
    'references/live-report.md',
    'references/live-desktop.json',
    'references/live-mobile.json',
    'references/live-interactions.json',
    'references/validation.json',
    'references/video-metadata.json',
    'references/motion-report.md',
    'references/v2-source/media-library.json',
    'references/v2-source/coverage-source.md',
    'references/v2-research/motion-source-report.md',
  ];
  for (const rel of includeRoots) addExistingFile(path.join(root, rel), 'existing-derived', 'included', 'Existing extraction, analysis, token, or implementation source.');
  for (const rel of [
    'index.html',
    'catalog.js',
    'catalog.css',
    'catalog-v2.js',
    'catalog-v2.css',
    'motion-library.js',
    'motion-library.css',
    'layout-recipes.html',
    'source-library.css',
    'source-library.js',
  ]) {
    addExistingFile(path.join(root, rel), 'reconstructed', 'included', 'Local UI/source viewer implementation.');
  }
  for (const rel of [
    'app-reconstructions.html',
    'app-reconstructions.css',
    'app-reconstructions.js',
    'reconstruction-map.json',
    'scripts/build-reconstruction-map.py',
  ]) {
    addExistingFile(path.join(root, rel), 'reconstructed', 'included', 'Local substitute for private or unverifiable Family app/source structure.');
  }
  const kitDirectory = path.join(root, 'design-system');
  if (fs.existsSync(kitDirectory)) {
    const stack = [kitDirectory];
    while (stack.length) {
      const directory = stack.pop();
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const target = path.join(directory, entry.name);
        if (entry.isDirectory()) stack.push(target);
        else if (/\.(?:js|css|json|md|html|ts|py)$/.test(entry.name)) addExistingFile(target, 'reconstructed', 'included', 'Portable project design-system package: scoped tokens, components, typed API and usage example.');
      }
    }
  }
  for (const name of ['system.html', 'family-project-kit.zip', 'family-design-system-1.0.0.tgz']) {
    addExistingFile(path.join(root, name), 'reconstructed', 'included', 'Reusable project kit, installable package or integration guide.');
  }
  const scriptDir = path.join(root, 'scripts');
  if (fs.existsSync(scriptDir)) {
    for (const entry of fs.readdirSync(scriptDir, { withFileTypes: true })) {
      if (!entry.isFile() || !/\.(cjs|py)$/i.test(entry.name)) continue;
      addExistingFile(path.join(scriptDir, entry.name), 'local-tool', 'included', 'Local extraction, build, or verification tool source.');
    }
  }

  const dirs = [
    ['references/v2-source/assets', 'existing-extracted', 'included', 'Earlier DOM/media extraction from the public page.'],
    ['references/v2-source/previews', 'existing-extracted', 'included', 'Extracted or normalized SVG/preview assets used by the local viewer.'],
    ['references/frames', 'existing-derived', 'included', 'Frame captures from supplied recording used for scene coverage.'],
  ];
  for (const [relDir, provenance, status, description] of dirs) {
    const absDir = path.join(root, relDir);
    if (!fs.existsSync(absDir)) continue;
    const stack = [absDir];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const next = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(next);
        else addExistingFile(next, provenance, status, description);
      }
    }
  }
  for (const relDir of ['references/assets']) {
    const absDir = path.join(root, relDir);
    if (!fs.existsSync(absDir)) continue;
    for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const rel = `${relDir}/${entry.name}`;
      addExistingFile(path.join(root, rel), 'original-public', 'included', 'Earlier downloaded public font/image asset.', assetByPath.get(rel) || null);
    }
  }
  const videoDir = path.join(root, 'references/v2-source/videos');
  if (fs.existsSync(videoDir)) {
    for (const entry of fs.readdirSync(videoDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const rel = `references/v2-source/videos/${entry.name}`;
      const isOriginalVideo = entry.name.endsWith('.mp4');
      addExistingFile(
        path.join(root, rel),
        isOriginalVideo ? 'original-public' : 'existing-derived',
        'included',
        isOriginalVideo ? 'Earlier downloaded public product film.' : 'Generated poster frame from a public product film.',
        videoByPath.get(rel) || null
      );
    }
  }
  const previewDir = path.join(root, 'references/v2-source/previews');
  if (fs.existsSync(previewDir)) {
    for (const entry of fs.readdirSync(previewDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const rel = `references/v2-source/previews/${entry.name}`;
      const provenance = entry.name.endsWith('-storyboard.jpg') ? 'existing-derived' : 'existing-extracted';
      addExistingFile(path.join(root, rel), provenance, 'included', provenance === 'existing-derived' ? 'Generated storyboard from a public product film.' : 'Extracted or normalized SVG/preview asset used by the local viewer.');
    }
  }
  const bundleDir = path.join(root, 'references/v2-research/bundles');
  if (fs.existsSync(bundleDir)) {
    for (const entry of fs.readdirSync(bundleDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      addExistingFile(path.join(bundleDir, entry.name), 'original-public', 'included', 'Earlier downloaded public JavaScript bundle used for motion recovery.', bundleSourceUrl(path.join(bundleDir, entry.name)));
    }
  }
  const currentPublic = path.join(root, 'references/v3-source/public');
  if (fs.existsSync(currentPublic)) {
    const stack = [currentPublic];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const next = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(next);
        else addCachedPublicFile(next);
      }
    }
  }
}

function addSourceMapGapsFromCache() {
  const cacheRoot = path.join(publicRoot, 'family.co');
  if (!fs.existsSync(cacheRoot)) return;
  const stack = [cacheRoot];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(next);
        continue;
      }
      if (!/\.m?js$/i.test(entry.name)) continue;
      const rel = toRel(next);
      const sourceUrl = `https://family.co/${rel.split('references/v3-source/public/family.co/')[1]}`;
      const text = fs.readFileSync(next, 'utf8');
      if (text.match(/\/\/# sourceMappingURL=(.+)$/m)) continue;
      gaps.push({
        id: `gap-map-${sha256(Buffer.from(sourceUrl)).slice(0, 8)}`,
        name: `Source map not advertised for ${entry.name}`,
        status: 'not-advertised',
        sourceUrl: `${sourceUrl}.map`,
        alternativePaths: ['references/v2-research/motion-source-report.md', 'motion-source-tokens.json'].filter(item => fs.existsSync(path.join(root, item))),
        fallback: 'Use minified public bundle plus recovered motion token report; do not claim private component source.',
      });
    }
  }
}

function restoreFailures() {
  const failurePath = path.join(outRoot, 'failures.json');
  if (!fs.existsSync(failurePath)) return;
  const records = JSON.parse(fs.readFileSync(failurePath, 'utf8'));
  for (const record of records) {
    if (!record.url) continue;
    const cached = cachedFileDetails(localPathFor(record.url));
    items.push({
      id: `public-${sha256(Buffer.from(record.url)).slice(0, 12)}`,
      name: path.basename(new URL(record.url).pathname) || new URL(record.url).hostname,
      category: cached.path ? existingCategory(localPathFor(record.url)) : categoryFor(record.url),
      provenance: record.provenance || 'original-public',
      status: record.status || 'fetch-error',
      path: cached.path,
      sourceUrl: record.url,
      bytes: cached.bytes,
      sha256: cached.sha256,
      description: cached.path
        ? `${record.message || 'Previously referenced public resource could not be downloaded.'}; cached file linked as fallback.`
        : record.message || 'Previously referenced public resource could not be downloaded.',
    });
  }
}

async function main() {
  fs.mkdirSync(publicRoot, { recursive: true });
  if (!reindexOnly) {
    const landing = addDiscovered(landingUrl, 'landing-html', 'root');
    if (!landing) throw new Error('Could not seed landing URL');

    const queue = [landing.url];
    while (queue.length) {
      const current = queue.shift();
      const result = await download(current);
      if (!result) continue;
      const category = categoryFor(current, result.localPath);
      if (!['html', 'stylesheet', 'script-bundle', 'script'].includes(category)) continue;
      if (category === 'html' && current !== landingUrl) continue;
      const text = result.buffer.toString('utf8');
      const before = discovered.size;
      const nested = extractUrls(text, current, category);
      for (const url of nested) {
        const nestedCategory = categoryFor(url);
        if (nestedCategory === 'html') continue;
        if (!downloaded.has(url) && !queue.includes(url)) queue.push(url);
      }
      if (category === 'script-bundle') {
        const mapMatch = text.match(/\/\/# sourceMappingURL=(.+)$/m);
        if (!mapMatch) {
          gaps.push({
            id: `gap-map-${sha256(Buffer.from(current)).slice(0, 8)}`,
            name: `Source map not advertised for ${path.basename(new URL(current).pathname)}`,
            status: 'not-advertised',
            sourceUrl: `${current}.map`,
            alternativePaths: ['references/v2-research/motion-source-report.md', 'motion-source-tokens.json'].filter(rel => fs.existsSync(path.join(root, rel))),
            fallback: 'Use minified public bundle plus recovered motion token report; do not claim private component source.',
          });
        }
        const mapUrl = mapMatch ? new URL(mapMatch[1], current).toString() : null;
        if (mapUrl && !downloaded.has(mapUrl) && DESIGN_HOSTS.has(new URL(mapUrl).hostname)) {
          addDiscovered(mapUrl, 'source-map-probe', 'debug-source-map');
          const mapResult = await download(mapUrl, 'source-map-probe');
          if (!mapResult) {
            gaps.push({
              id: `gap-map-${sha256(Buffer.from(current)).slice(0, 8)}`,
              name: `Source map unavailable for ${path.basename(new URL(current).pathname)}`,
              status: failed.find(item => item.url === mapUrl)?.status || 'unavailable',
              sourceUrl: mapUrl,
              fallback: 'Use minified public bundle plus recovered motion token report; do not claim private component source.',
            });
          }
        }
      }
      if (discovered.size === before && category === 'html') {
        gaps.push({
          id: 'gap-dom-runtime',
          name: 'Runtime-rendered DOM may reference late-loaded resources',
          status: 'bounded-not-browser-crawled',
          sourceUrl: current,
          fallback: 'Earlier Playwright DOM inventory is included as existing-extracted coverage.',
        });
      }
    }
  }

  collectExisting();
  if (reindexOnly) addSourceMapGapsFromCache();
  if (reindexOnly) restoreFailures();
  if (!reindexOnly) {
    fs.mkdirSync(outRoot, { recursive: true });
    fs.writeFileSync(path.join(outRoot, 'failures.json'), JSON.stringify(failed, null, 2) + '\n');
  }

  gaps.push({
    id: 'gap-private-app-source',
    name: 'Private application/component source',
    status: 'not-public',
    sourceUrl: 'https://family.co/',
    alternativePaths: [
      'app-reconstructions.html',
      'app-reconstructions.css',
      'app-reconstructions.js',
      'reconstruction-map.json',
      'motion-library.js',
      'layout-recipes.html',
    ].filter(rel => fs.existsSync(path.join(root, rel))),
    fallback: 'Local HTML/CSS/JS reconstructions and token files approximate observed behavior; provenance marks them as existing-derived or reconstructed.',
  });
  gaps.push({
    id: 'gap-historical-build',
    name: 'Historical Recent recording build source',
    status: 'not-verifiable-from-current-public-site',
    sourceUrl: 'https://recent.design/i/p1lu7hn-family',
    alternativePaths: [
      'references/family-recording.mp4',
      'references/frames',
      'source-coverage.json',
      'motion-library.js',
      'app-reconstructions.html',
      'reconstruction-map.json',
    ].filter(rel => fs.existsSync(path.join(root, rel))),
    fallback: 'Use frame captures, public current site resources, and reconstructed motion/library demos with explicit labels.',
  });

  const deduped = [];
  const seen = new Set();
  const statusRank = status => status !== 'downloaded' && status !== 'included' ? 0 : status === 'downloaded' ? 1 : 2;
  for (const item of items.sort((a, b) => {
    const pathOrder = `${a.category}/${a.path || a.sourceUrl || a.id}`.localeCompare(`${b.category}/${b.path || b.sourceUrl || b.id}`);
    return pathOrder || statusRank(a.status) - statusRank(b.status);
  })) {
    const key = item.path ? `path:${item.path}` : `url:${item.sourceUrl || item.id}|${item.status}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  const byStatus = {};
  const byCategory = {};
  const byProvenance = {};
  for (const item of deduped) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    byCategory[item.category] = (byCategory[item.category] || 0) + 1;
    byProvenance[item.provenance] = (byProvenance[item.provenance] || 0) + 1;
  }

  const manifest = {
    generatedAt,
    scope: 'Family landing-page public source audit: root HTML, linked CSS/JS, CSS url() resources, first-party JS literal asset references, earlier extracted media/SVG/frame/token sources, and explicit unavailable/private-source gaps.',
    summary: {
      totalItems: deduped.length,
      downloadedPublic: deduped.filter(item => item.provenance === 'original-public' && item.status === 'downloaded').length,
      includedExisting: deduped.filter(item => item.status === 'included').length,
      failedPublic: deduped.filter(item => item.status !== 'downloaded' && item.status !== 'included').length,
      gaps: gaps.length,
      byStatus,
      byCategory,
      byProvenance,
    },
    items: deduped,
    gaps: gaps.sort((a, b) => a.id.localeCompare(b.id)),
  };

  fs.writeFileSync(path.join(root, 'source-library.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'source-library-data.js'), `window.FamilySourceLibrary = ${JSON.stringify(manifest, null, 2)};\n`);
  console.log(JSON.stringify(manifest.summary, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
