const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const archive = path.join(root, 'family-project-kit.zip');
const reviewDir = path.join(root, 'references', 'v4-review');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'family-isolated-kit-'));
const extractRoot = path.join(tempRoot, 'extracted');
let browser;
let server;

function mime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  }[ext] || 'application/octet-stream';
}

function serve(directory) {
  return new Promise((resolve, reject) => {
    const rootReal = fs.realpathSync(directory);
    server = http.createServer((request, response) => {
      try {
        const url = new URL(request.url, 'http://127.0.0.1');
        const decoded = decodeURIComponent(url.pathname);
        const target = path.join(rootReal, decoded === '/' ? '/design-system/examples/starter.html' : decoded);
        const real = fs.realpathSync(target);
        if (!real.startsWith(rootReal + path.sep) && real !== rootReal) {
          response.writeHead(403);
          response.end('Forbidden');
          return;
        }
        const stat = fs.statSync(real);
        if (!stat.isFile()) {
          response.writeHead(404);
          response.end('Not found');
          return;
        }
        response.writeHead(200, {
          'content-type': mime(real),
          'content-length': stat.size,
          'cache-control': 'no-store',
        });
        fs.createReadStream(real).pipe(response);
      } catch {
        response.writeHead(404);
        response.end('Not found');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

function extractArchive() {
  fs.mkdirSync(extractRoot, { recursive: true });
  const code = `
import pathlib, zipfile
archive = pathlib.Path(${JSON.stringify(archive)})
target = pathlib.Path(${JSON.stringify(extractRoot)})
with zipfile.ZipFile(archive) as bundle:
    assert bundle.testzip() is None
    for item in bundle.infolist():
        target_path = target / item.filename
        if not str(target_path.resolve()).startswith(str(target.resolve())):
            raise RuntimeError(item.filename)
    bundle.extractall(target)
`;
  const result = spawnSync('python3', ['-c', code], { text: true, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`extract failed\n${result.stdout}\n${result.stderr}`);
}

function getPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    '/home/kang/.claude/skills/gstack/node_modules/playwright',
    'playwright',
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error('Playwright module not found');
}

async function closeAll() {
  if (browser) await browser.close().catch(() => {});
  if (server) await new Promise(resolve => server.close(resolve));
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

(async () => {
  extractArchive();
  const base = await serve(extractRoot);
  const { chromium } = getPlaywright();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) failed.push({ url: response.url(), status: response.status() }); });

  await page.goto(`${base}/design-system/examples/starter.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const title = await page.locator('h1').innerText();
  if (!title.includes('Made to build')) throw new Error('starter page did not render');

  await page.locator('#theme-toggle').click();
  if (await page.locator('body').getAttribute('data-fds-theme') !== 'dark') throw new Error('theme toggle failed');

  await page.locator('#tab-settings').click();
  if (await page.locator('#panel-settings').isHidden()) throw new Error('settings tab did not open');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.locator('#tab-components').click();

  await page.locator('[data-fds-dialog-open="example-dialog"]').click();
  if (!await page.locator('#example-dialog').evaluate(dialog => dialog.open)) throw new Error('dialog did not open');
  await page.keyboard.press('Escape');
  if (await page.locator('#example-dialog').evaluate(dialog => dialog.open)) throw new Error('dialog did not close with Escape');

  await page.locator('#tab-components').click();
  await page.locator('[data-fds-dropdown-trigger]').click();
  await page.waitForFunction(() => {
    const trigger = document.querySelector('[data-fds-dropdown-trigger]');
    const panel = document.querySelector('#example-dropdown');
    return trigger?.getAttribute('aria-expanded') === 'true' && panel && !panel.hidden;
  });
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => {
    const trigger = document.querySelector('[data-fds-dropdown-trigger]');
    const panel = document.querySelector('#example-dropdown');
    return trigger?.getAttribute('aria-expanded') === 'false' && panel?.hidden;
  });

  await page.locator('#tab-settings').click();
  await page.locator('#project-email').fill('invalid');
  await page.locator('#settings-form button[type="submit"]').click();
  if (await page.locator('#project-email').getAttribute('aria-invalid') !== 'true') throw new Error('form validation did not mark invalid email');

  const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
  if (dims.scroll > dims.inner) throw new Error(`horizontal overflow ${JSON.stringify(dims)}`);
  if (errors.length || failed.length) throw new Error(JSON.stringify({ errors, failed }));

  fs.mkdirSync(reviewDir, { recursive: true });
  const result = {
    date: new Date().toISOString(),
    status: 'passed',
    archive: path.basename(archive),
    checks: [
      'archive extracted with Python stdlib into temporary directory',
      'starter page served only from extracted kit on ephemeral localhost',
      'theme toggle, tabs, dialog, dropdown and form validation worked',
      'no page errors, console errors, failed HTTP requests or horizontal overflow',
      'temporary server, browser and extracted directory cleaned up',
    ],
    viewport: dims,
    errors,
    failed,
  };
  fs.writeFileSync(path.join(reviewDir, 'isolated-kit-validation.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
})()
  .then(closeAll, async error => {
    await closeAll();
    throw error;
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
