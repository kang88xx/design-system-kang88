#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const required = [
  'reconstruction.html',
  'reconstruction.css',
  'reconstruction.js',
  'media/reconstruction-v3.md',
  'scripts/decode-buf.cjs',
  'sources/decoded/manifest.json',
  'research/buf-analysis-v3.json',
  'source-explorer.html',
];

function parseBuf(file) {
  const buf = fs.readFileSync(path.join(root, file));
  const headerBytes = buf.readUInt32LE(0);
  const header = JSON.parse(buf.subarray(4, 4 + headerBytes).toString('utf8'));
  return {
    file,
    bytes: buf.length,
    headerBytes,
    vertexCount: header.vertexCount,
    indexCount: header.indexCount,
    attributes: header.attributes.map((attr) => attr.id),
  };
}

function waitFor(url, timeout = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function attempt() {
      http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      }).on('error', retry);
    }
    function retry() {
      if (Date.now() - start > timeout) reject(new Error(`server did not answer ${url}`));
      else setTimeout(attempt, 150);
    }
    attempt();
  });
}

async function main() {
  for (const file of required) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`missing ${file}`);
  }

  const bufRows = [
    'sources/assets/lusion.dev/assets/models/about/person.buf',
    'sources/assets/lusion.dev/assets/models/about/person_idle.buf',
    'sources/assets/lusion.dev/assets/models/playground/tunnel.buf',
    'sources/assets/lusion.dev/assets/models/home/cross.buf',
  ].map(parseBuf);
  const bufAnalysis = JSON.parse(fs.readFileSync(path.join(root, 'research/buf-analysis-v3.json'), 'utf8'));
  const decodedManifest = JSON.parse(fs.readFileSync(path.join(root, 'sources/decoded/manifest.json'), 'utf8'));
  if (bufAnalysis.total !== 55) throw new Error(`expected 55 buf files, got ${bufAnalysis.total}`);
  if (bufAnalysis.statuses['mesh-decoded'] !== 34) throw new Error('expected 34 decoded meshes');
  if (bufAnalysis.statuses['points-animation-decoded'] !== 10) throw new Error('expected 10 animation point files');
  if (bufAnalysis.statuses['points-decoded'] !== 11) throw new Error('expected 11 point files');
  for (const row of bufAnalysis.rows) {
    if (row.status === 'failed') throw new Error(`buf decode failed: ${row.file}`);
    if (!row.sha256 || row.sha256.length !== 64) throw new Error(`missing sha256: ${row.file}`);
    if (!row.consumedAllBytes) throw new Error(`payload bytes not fully consumed: ${row.file}`);
    if (row.finitePosition && !row.finitePosition.ok) throw new Error(`non-finite position: ${row.file}`);
    if (row.indexStats && !row.indexStats.inRange) throw new Error(`index out of range: ${row.file}`);
    if (row.output?.points && !fs.existsSync(path.join(root, row.output.points))) throw new Error(`missing points output: ${row.output.points}`);
    if (row.output?.obj && !fs.existsSync(path.join(root, row.output.obj))) throw new Error(`missing obj output: ${row.output.obj}`);
  }
  if (decodedManifest.total !== 55 || decodedManifest.models.length !== 55) throw new Error('decoded manifest does not include all buf files');

  const { chromium, executablePath } = require('./browser-runtime.cjs');
  let server;
  const port = process.env.RECONSTRUCTION_PORT || '4187';
  const url = `http://127.0.0.1:${port}/reconstruction.html`;
  try {
    await waitFor(url, 1200);
  } catch {
    server = spawn(process.execPath, ['-e', `
      const http=require('http'),fs=require('fs'),path=require('path');
      const root=${JSON.stringify(root)};
      const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.obj':'text/plain','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.md':'text/markdown'};
      http.createServer((req,res)=>{
        const clean=decodeURIComponent(req.url.split('?')[0]).replace(/^\\/+/, '') || 'index.html';
        const file=path.join(root, clean);
        if(!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){res.writeHead(404);res.end('not found');return;}
        res.writeHead(200, {'content-type': types[path.extname(file)] || 'application/octet-stream'});
        fs.createReadStream(file).pipe(res);
      }).listen(${JSON.stringify(port)}, '127.0.0.1');
    `], { stdio: 'ignore' });
    await waitFor(url);
  }

  const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const errors = [];
  const badResponses = [];
  const checks = [];
  function check(name, value) {
    checks.push({ name, passed: Boolean(value) });
    if (!value) throw new Error(name);
  }
  try {
    for (const viewport of [{ name: 'desktop', width: 1440, height: 1000 }, { name: 'mobile', width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`${viewport.name}: ${msg.text()}`);
      });
      page.on('pageerror', (error) => errors.push(`${viewport.name}: ${error.message}`));
      page.on('response', (response) => {
        if (response.status() >= 400) badResponses.push(`${viewport.name}: ${response.status()} ${response.url()}`);
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(root, 'screenshots', `reconstruction-${viewport.name}.png`), fullPage: true });
      const metrics = await page.evaluate(() => ({
        title: document.title,
        demos: document.querySelectorAll('.studio[data-demo]').length,
        tableRows: document.querySelectorAll('#buf-table tr').length,
        modelOptions: document.querySelectorAll('#model-select option').length,
        overflow: document.documentElement.scrollWidth - innerWidth,
        hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((href) => href && !href.startsWith('#') && !href.startsWith('http')),
      }));
      check(`${viewport.name}: title`, metrics.title.includes('Reconstruction Studio'));
      check(`${viewport.name}: 6 demos`, metrics.demos === 6);
      check(`${viewport.name}: buf table`, metrics.tableRows >= 4);
      check(`${viewport.name}: decoded model options`, metrics.modelOptions === 55);
      check(`${viewport.name}: no horizontal overflow`, metrics.overflow <= 2);
      for (const href of metrics.hrefs) {
        const local = href.split('#')[0];
        check(`${viewport.name}: local href ${href}`, !local || fs.existsSync(path.join(root, local)));
      }
      await page.click('[data-action="fluid-burst"]');
      await page.waitForFunction(() => !document.querySelector('#fluid-count').textContent.startsWith('0 '));
      check(`${viewport.name}: fluid burst creates strokes`, true);
      await page.click('[data-action="fluid-clear"]');
      await page.waitForFunction(() => document.querySelector('#fluid-count').textContent.startsWith('0 '));
      check(`${viewport.name}: fluid clear result`, true);
      await page.click('[data-action="morph-toggle"]');
      check(`${viewport.name}: morph toggle target`, await page.locator('#morph-range').inputValue() === '100');
      await page.click('[data-action="shatter-hit"]');
      await page.waitForFunction(() => document.querySelector('#shatter-count').textContent.includes('fragments'));
      check(`${viewport.name}: shatter fragments`, true);
      await page.selectOption('#spring-preset', 'zoom');
      check(`${viewport.name}: spring preset`, (await page.locator('#spring-preset-name').textContent()).includes('zoom'));
      await page.selectOption('#model-select', { index: Math.min(4, metrics.modelOptions - 1) });
      await page.waitForFunction(() => document.querySelector('#model-readout').textContent.includes('vertices'));
      check(`${viewport.name}: decoded model fetch`, true);
      await page.click('[data-action="loader-play"]');
      await page.waitForFunction(() => document.querySelector('#loader-status').textContent.includes('complete'), null, { timeout: 5000 });
      check(`${viewport.name}: loader completes`, true);
      await page.click('#toggle-motion');
      const frozenA = await page.locator('#model-canvas').screenshot();
      await page.waitForTimeout(300);
      const frozenB = await page.locator('#model-canvas').screenshot();
      check(`${viewport.name}: pause stability`, frozenA.equals(frozenB));
      await page.click('#toggle-motion');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(100);
      check(`${viewport.name}: media reduced-motion reflected`, await page.locator('#reduce-motion').isChecked());
      await page.check('#reduce-motion');
      await page.waitForTimeout(250);
      const status = await page.locator('#runtime-status').textContent();
      check(`${viewport.name}: reduced motion status`, status && status.includes('동작 감소'));
      await page.close();
    }
  } finally {
    await browser.close();
    if (server) server.kill();
  }

  if (errors.length || badResponses.length) throw new Error(`browser errors:\n${errors.join('\n')}\nfailed responses:\n${badResponses.join('\n')}`);
  const result = {
    ok: true,
    url,
    files: required,
    bufRows,
    bufSummary: { total: bufAnalysis.total, statuses: bufAnalysis.statuses },
    checks,
    screenshots: ['screenshots/reconstruction-desktop.png', 'screenshots/reconstruction-mobile.png'],
  };
  fs.writeFileSync(path.join(root, 'research/reconstruction-checks-v3.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
