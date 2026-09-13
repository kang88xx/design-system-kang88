import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const capturePath = join(rootDir, 'data/toss-source-capture.json');
const manifestPath = join(rootDir, 'data/toss-asset-manifest.json');
const archiveDir = join(rootDir, 'assets/source');

const sourceUrl = 'https://toss.im/';
const limits = {
  maxAssetBytes: 8 * 1024 * 1024,
  maxTotalBytes: 160 * 1024 * 1024,
  maxConcurrency: 8,
  timeoutMs: 20_000,
  allowlist: {
    host: 'static.toss.im',
    bundlePaths: ['/assets/toss-im/', '/lotties/', '/icons/'],
    observedMediaPaths: ['/assets/toss-im/', '/lotties/', '/icons/', '/ix/', '/sample/', '/assets/homepage/'],
  },
  notes: [
    'Archived files are public source references for private design-system study only; redistribution rights are not implied.',
    'Font files are recorded as remote references only.',
    'Video files are recorded as remote references to keep the archive bounded.',
  ],
};

const capture = JSON.parse(await readFile(capturePath, 'utf8'));
const previousManifest = await readJsonIfExists(manifestPath);
await mkdir(archiveDir, { recursive: true });

const candidates = new Map();
const mediaMeta = new Map();

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

async function readJsonIfExists(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeUrl(raw, base = sourceUrl) {
  if (!raw || typeof raw !== 'string') return null;
  let value = raw.trim();
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return null;
  value = value.replaceAll('\\/', '/').replaceAll('&amp;', '&');
  try {
    const parsed = new URL(value, base);
    if (/\.(?:avif|gif|ico|jpe?g|json|mp4|png|svg|webm|webp|woff2?|otf|ttf)\/$/i.test(parsed.pathname)) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function addCandidate(rawUrl, discovery, extras = {}) {
  const url = normalizeUrl(rawUrl, extras.baseUrl);
  if (!url) return;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== 'https:' || parsed.hostname !== limits.allowlist.host) return;
  if (isBlockedUrl(parsed)) return;

  const current = candidates.get(url) || { url, discovery, sources: new Set() };
  current.sources.add(discovery);
  current.discovery = preferredDiscovery(current.discovery, discovery);
  for (const key of ['type', 'contentType', 'status', 'label', 'section', 'width', 'height']) {
    if (extras[key] !== undefined && extras[key] !== null && extras[key] !== '') current[key] = extras[key];
  }
  if (extras.observedMedia) current.observedMedia = true;
  candidates.set(url, current);
}

function preferredDiscovery(a, b) {
  const rank = { dom: 3, network: 2, bundle: 1 };
  return rank[b] > rank[a] ? b : a;
}

function isBlockedUrl(parsed) {
  const text = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
  return /analytics|sentry|datadog|amplitude|segment|gtm|tracking|collect|api/.test(text);
}

function isAllowed(candidate) {
  const pathname = new URL(candidate.url).pathname;
  const paths = candidate.observedMedia ? limits.allowlist.observedMediaPaths : limits.allowlist.bundlePaths;
  if (candidate.discovery === 'bundle' && !hasAssetExtension(pathname)) return false;
  if (paths.some(prefix => pathname.startsWith(prefix))) return true;
  return candidate.type === 'font' && pathname.startsWith('/assets/toss-im/font/');
}

function hasAssetExtension(pathname) {
  return /\.(?:avif|bin|gif|ico|jpe?g|json|lottie|mp4|png|svg|webm|webp|woff2?|otf|ttf)$/i.test(pathname);
}

function splitSrcset(srcset) {
  return String(srcset || '')
    .split(',')
    .map(part => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function collectObserved() {
  for (const resource of capture.resources || []) {
    addCandidate(resource.url, 'network', {
      status: resource.status,
      type: resource.type,
      contentType: resource.contentType,
    });
  }

  for (const pageCapture of capture.captures || []) {
    for (const media of pageCapture.media || []) {
      for (const url of [media.url, ...splitSrcset(media.srcset)]) {
        addCandidate(url, 'dom', {
          type: media.kind,
          label: cleanLabel(media.label),
          section: media.section,
          width: media.width,
          height: media.height,
          observedMedia: true,
        });
        const normalized = normalizeUrl(url);
        if (normalized) mediaMeta.set(normalized, media);
      }
      if (media.poster) {
        addCandidate(media.poster, 'dom', {
          type: 'image',
          label: cleanLabel(media.label) || `${inferLabel(media.poster) || 'video poster'} poster`,
          section: media.section,
          observedMedia: true,
        });
      }
    }
  }
}

async function collectBundleUrls() {
  const docs = (capture.documents || []).filter(doc => ['script', 'stylesheet', 'document'].includes(doc.type));
  for (const doc of docs) {
    let text = '';
    try {
      text = await readFile(join(rootDir, doc.localPath), 'utf8');
    } catch {
      continue;
    }
    for (const url of extractLiteralUrls(text, doc.url)) addCandidate(url, 'bundle', { baseUrl: doc.url });
  }
}

function extractLiteralUrls(text, baseUrl) {
  const urls = new Set();
  const patterns = [
    /https?:\\?\/\\?\/static\.toss\.im[^"'`\s<>)\],;]+/g,
    /["'`](\/(?:assets\/toss-im|lotties|icons)\/[^"'`\s<>)\],;]+)["'`]/g,
    /url\((["']?)([^"')]+)\1\)/g,
  ];
  for (const match of text.matchAll(patterns[0])) urls.add(match[0]);
  for (const match of text.matchAll(patterns[1])) urls.add(new URL(match[1], baseUrl).href);
  for (const match of text.matchAll(patterns[2])) {
    const url = normalizeUrl(match[2], baseUrl);
    if (url) urls.add(url);
  }
  return urls;
}

function cleanLabel(label) {
  const value = String(label || '').replace(/\s+/g, ' ').trim();
  if (!value || value === 'IMG' || value === 'VIDEO' || value === 'DIV') return undefined;
  return value.slice(0, 90);
}

function inferLabel(url) {
  const name = decodeURIComponent(basename(new URL(url).pathname)).replace(/\.[a-z0-9]+$/i, '');
  return name.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || undefined;
}

function inferKind(candidate, headers = {}) {
  const pathname = new URL(candidate.url).pathname.toLowerCase();
  const contentType = (headers.get?.('content-type') || candidate.contentType || '').toLowerCase();
  if (candidate.type === 'font' || /\/font\//.test(pathname) || /\.(woff2?|otf|ttf|eot)$/.test(pathname)) return 'font';
  if (candidate.type === 'video' || contentType.startsWith('video/') || /\.(mp4|webm|mov)$/.test(pathname)) return 'video';
  if (contentType.includes('json') || pathname.endsWith('.json')) return 'animation';
  if (contentType.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif|ico)$/.test(pathname)) return 'image';
  return 'binary';
}

function archiveFilename(url, bytes) {
  const parsed = new URL(url);
  const hash = sha256(url).slice(0, 12);
  let name = decodeURIComponent(basename(parsed.pathname)) || 'asset';
  name = name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!extname(name) && bytes?.contentType?.includes('json')) name += '.json';
  return `${hash}-${name || 'asset'}`;
}

async function withTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), limits.timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHead(candidate) {
  try {
    const response = await withTimeout(candidate.url, { method: 'HEAD' });
    return { ok: response.ok, status: response.status, headers: response.headers };
  } catch {
    return { ok: false, status: candidate.status || 0, headers: new Headers() };
  }
}

async function processAsset(candidate, total) {
  const head = await fetchHead(candidate);
  const kind = inferKind(candidate, head.headers);
  const contentType = head.headers.get('content-type') || candidate.contentType || undefined;
  const length = Number(head.headers.get('content-length') || 0);
  const base = {
    id: sha256(candidate.url).slice(0, 16),
    url: candidate.url,
    localPath: null,
    kind,
    status: 'remote',
    bytes: length || 0,
    sha256: null,
    contentType,
    discovery: candidate.discovery,
    label: candidate.label || inferLabel(candidate.url),
    section: candidate.section,
    width: candidate.width,
    height: candidate.height,
  };

  if (candidate.status && candidate.status >= 400) return { ...base, status: 'failed', reason: `observed-http-${candidate.status}` };
  if (!head.ok && !candidate.status) return { ...base, status: 'failed', reason: `head-http-${head.status || 'failed'}` };
  if (kind === 'font') return { ...base, reason: 'font-reference-only' };
  if (kind === 'video') return { ...base, reason: 'video-remote-reference' };
  if (length > limits.maxAssetBytes) return { ...base, reason: 'asset-byte-limit' };
  if (length && total.bytes + length > limits.maxTotalBytes) return { ...base, reason: 'total-byte-limit' };

  const cached = await readValidCache(base, total);
  if (cached) return cached;

  let response;
  try {
    response = await withTimeout(candidate.url);
  } catch (error) {
    return { ...base, status: 'failed', reason: `fetch-${error.name || 'failed'}` };
  }
  if (!response.ok) return { ...base, status: 'failed', reason: `fetch-http-${response.status}` };

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > limits.maxAssetBytes) return { ...base, bytes: buffer.byteLength, reason: 'asset-byte-limit' };
  if (total.bytes + buffer.byteLength > limits.maxTotalBytes) return { ...base, bytes: buffer.byteLength, reason: 'total-byte-limit' };

  const filename = archiveFilename(candidate.url, { contentType: response.headers.get('content-type') || contentType });
  const localPath = join(archiveDir, filename);
  await writeFile(localPath, buffer);
  total.bytes += buffer.byteLength;

  return {
    ...base,
    localPath: `./${relative(rootDir, localPath).replaceAll('\\', '/')}`,
    status: 'archived',
    bytes: buffer.byteLength,
    sha256: sha256(buffer),
    contentType: response.headers.get('content-type') || contentType,
  };
}

async function readValidCache(base, total) {
  const cached = (previousManifest?.assets || []).find(asset => asset.url === base.url && asset.status === 'archived' && asset.localPath && asset.sha256);
  if (!cached) return null;
  try {
    const localPath = join(rootDir, cached.localPath.replace(/^\.\//, ''));
    const buffer = await readFile(localPath);
    if (buffer.byteLength > limits.maxAssetBytes) return null;
    if (total.bytes + buffer.byteLength > limits.maxTotalBytes) return null;
    if (sha256(buffer) !== cached.sha256) return null;
    total.bytes += buffer.byteLength;
    return {
      ...base,
      localPath: cached.localPath,
      status: 'archived',
      bytes: buffer.byteLength,
      sha256: cached.sha256,
      contentType: base.contentType || cached.contentType,
    };
  } catch {
    return null;
  }
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

collectObserved();
await collectBundleUrls();

const selected = [...candidates.values()]
  .filter(isAllowed)
  .sort((a, b) => a.url.localeCompare(b.url));

const total = { bytes: 0 };
const assets = await mapConcurrent(selected, limits.maxConcurrency, candidate => processAsset(candidate, total));

const totals = assets.reduce((acc, asset) => {
  acc.assets += 1;
  acc[asset.status] += 1;
  acc.bytes += asset.status === 'archived' ? asset.bytes : 0;
  acc.remoteBytes += asset.status === 'remote' ? asset.bytes : 0;
  return acc;
}, { assets: 0, archived: 0, remote: 0, failed: 0, bytes: 0, remoteBytes: 0 });

const manifest = {
  schemaVersion: 1,
  collectedAt: new Date().toISOString(),
  sourceUrl: capture.sourceUrl || sourceUrl,
  limits,
  totals,
  assets,
};

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({
  manifest: `./${relative(rootDir, manifestPath).replaceAll('\\', '/')}`,
  archiveDir: `./${relative(rootDir, archiveDir).replaceAll('\\', '/')}`,
  candidates: candidates.size,
  selected: selected.length,
  totals,
}, null, 2));
