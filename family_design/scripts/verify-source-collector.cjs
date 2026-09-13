const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'family-source-collector-'));
const fixtureRoot = path.join(tempRoot, 'fixture');
const fixtureScripts = path.join(fixtureRoot, 'scripts');
const reviewDir = path.join(root, 'references', 'v4-review');
const cachedPng = Buffer.from('cached-png-fixture');
const freshPng = Buffer.from('fresh-png-fixture');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function write(filePath, body) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body);
}

function runCollector(args = []) {
  const runner = path.join(fixtureRoot, 'run-collector.cjs');
  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd: fixtureRoot,
    text: true,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`collector failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
  return result.stdout;
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'source-library.json'), 'utf8'));
}

function bySource(manifest, url) {
  return manifest.items.filter(item => item.sourceUrl === url);
}

fs.mkdirSync(fixtureScripts, { recursive: true });
fs.copyFileSync(path.join(root, 'scripts', 'collect-source-library.cjs'), path.join(fixtureScripts, 'collect-source-library.cjs'));
write(path.join(fixtureRoot, 'references/v3-source/public/family.co/assets/example.png'), cachedPng);

write(path.join(fixtureRoot, 'run-collector.cjs'), `
const path = require('path');
const { Response } = globalThis;
const freshPng = Buffer.from(${JSON.stringify(freshPng.toString('base64'))}, 'base64');
global.fetch = async url => {
  const value = String(url);
  if (process.argv.includes('--reindex-only')) throw new Error('fetch must not run during reindex-only');
  if (value === 'https://family.co/') {
    return new Response('<!doctype html><img src="/assets/example.png"><img src="/assets/ok.png">', {
      status: 200,
      headers: { 'content-type': 'text/html' }
    });
  }
  if (value === 'https://family.co/assets/example.png') {
    return new Response('missing', { status: 404, headers: { 'content-type': 'text/plain' } });
  }
  if (value === 'https://family.co/assets/ok.png') {
    return new Response(freshPng, { status: 200, headers: { 'content-type': 'image/png' } });
  }
  throw new Error('unexpected fetch ' + value);
};
process.argv = [process.argv[0], path.join(__dirname, 'scripts/collect-source-library.cjs'), ...process.argv.slice(2)];
require('./scripts/collect-source-library.cjs');
`);

runCollector();
const normal = loadManifest();
const failedNormal = bySource(normal, 'https://family.co/assets/example.png');
const okNormal = bySource(normal, 'https://family.co/assets/ok.png');
if (failedNormal.length !== 1) throw new Error(`expected one failed cached item, got ${failedNormal.length}`);
if (failedNormal[0].status !== 'missing-public') throw new Error(`expected missing-public, got ${failedNormal[0].status}`);
if (failedNormal[0].path !== 'references/v3-source/public/family.co/assets/example.png') throw new Error(`failed item lost cached path: ${failedNormal[0].path}`);
if (failedNormal[0].sha256 !== sha256(cachedPng)) throw new Error('failed item lost cached sha256');
if (normal.summary.failedPublic < 1) throw new Error('summary failedPublic did not count current failed fetch');
if (okNormal.length !== 1 || okNormal[0].status !== 'downloaded' || okNormal[0].sha256 !== sha256(freshPng)) {
  throw new Error('successful public reference was not recorded as downloaded');
}

runCollector(['--reindex-only']);
const reindexed = loadManifest();
const failedReindexed = bySource(reindexed, 'https://family.co/assets/example.png');
const okReindexed = bySource(reindexed, 'https://family.co/assets/ok.png');
if (failedReindexed.length !== 1) throw new Error(`expected one reindexed failed cached item, got ${failedReindexed.length}`);
if (failedReindexed[0].status !== 'missing-public') throw new Error(`reindex changed failed status to ${failedReindexed[0].status}`);
if (failedReindexed[0].path !== 'references/v3-source/public/family.co/assets/example.png') throw new Error(`reindex failed item lost cached path: ${failedReindexed[0].path}`);
if (failedReindexed[0].sha256 !== sha256(cachedPng)) throw new Error('reindex failed item lost cached sha256');
if (reindexed.summary.failedPublic < 1) throw new Error('reindex summary failedPublic did not retain failure');
if (okReindexed.length !== 1 || okReindexed[0].status !== 'downloaded' || okReindexed[0].sha256 !== sha256(freshPng)) {
  throw new Error('reindex changed successful cached reference');
}

fs.mkdirSync(reviewDir, { recursive: true });
const result = {
  date: new Date().toISOString(),
  status: 'passed',
  fixture: tempRoot,
  checks: [
    'normal collection preserves current 404 status while linking cached path and sha256',
    'dedupe does not replace current failure with cached downloaded item',
    'successful public resource remains downloaded with fresh hash',
    '--reindex-only retains failure record and cached fallback without calling fetch',
  ],
  normal: {
    summary: normal.summary,
    failed: failedNormal[0],
    success: okNormal[0],
  },
  reindexed: {
    summary: reindexed.summary,
    failed: failedReindexed[0],
    success: okReindexed[0],
  },
};
write(path.join(reviewDir, 'collector-validation.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
