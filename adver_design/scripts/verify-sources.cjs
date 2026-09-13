/* Requires an existing Playwright installation, not a project dependency. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8766';
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'references/verification/source-refresh');
fs.mkdirSync(out, { recursive: true });

const checks = [];
let browser;

const check = name => {
  checks.push(name);
  console.log('PASS', name);
};
const read = rel => fs.readFileSync(path.join(root, rel));
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const decodeCatalog = () => {
  const source = fs.readFileSync(path.join(root, 'design-system/source-catalog.js'), 'utf8');
  const window = {};
  Function('window', source)(window);
  Function('window', fs.readFileSync(path.join(root, 'design-system/source-originals.js'), 'utf8'))(window);
  for (const file of Object.values(window.SourceCatalog.files)) {
    if (file.deferred) {
      assert.equal(typeof window.SourceOriginals[file.path], 'string', `${file.path} deferred text exists`);
      file.content = window.SourceOriginals[file.path];
    }
  }
  return window.SourceCatalog;
};
const isText = file => file.content != null;

(async () => {
  const catalog = decodeCatalog();
  assert(catalog.entries.length > 0, 'source catalog has entries');
  assert.equal(new Set(catalog.entries.map(entry => entry.id)).size, catalog.entries.length, 'entry IDs are unique');
  for (const entry of catalog.entries) {
    assert(entry.title && entry.summary && entry.category && entry.status, `${entry.id} has searchable metadata`);
    assert(Array.isArray(entry.files) && entry.files.length > 0, `${entry.id} has files`);
    for (const rel of entry.files) {
      const file = catalog.files[rel];
      assert(file, `${entry.id} references catalog file ${rel}`);
      const disk = read(rel);
      assert.equal(file.bytes, disk.length, `${rel} byte length matches disk`);
      assert.equal(file.sha256, sha(disk), `${rel} hash matches disk`);
      if (isText(file)) assert.equal(file.content, disk.toString('utf8'), `${rel} embedded source exactly matches disk`);
    }
  }
  check('catalog metadata and embedded text exactly match disk files');

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`${base}/sources.html`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });

  const uiState = async () => page.evaluate(() => ({
    entryCount: window.SourceCatalog.entries.length,
    listCount: document.querySelectorAll('#source-list button').length,
    title: document.querySelector('#source-title').textContent,
    view: document.querySelector('.source-tabs [aria-selected="true"]').dataset.view,
    panelLabel: document.querySelector('#source-panel').getAttribute('aria-labelledby')
  }));
  assert.equal(await page.evaluate(() => typeof window.SourceOriginals), 'undefined', 'large original archive is deferred until requested');
  const state = await uiState();
  assert.equal(state.entryCount, catalog.entries.length);
  assert.equal(state.listCount, catalog.entries.length);
  assert(state.title.length > 0);
  check('initial source explorer renders complete entry list and default detail');

  await page.screenshot({ path: path.join(out, 'after-source-explorer-desktop.png'), fullPage: true });
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate(themeName => {
        document.body.dataset.theme = themeName;
        localStorage.setItem('reference-lab-theme', themeName);
      }, theme);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `no document overflow at ${width} ${theme}`);
    }
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ path: path.join(out, 'after-source-explorer-mobile.png'), fullPage: true });
  check('1440/768/375 light and dark layouts avoid document overflow');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#source-search').fill('motion-kit');
  assert(await page.locator('#source-list button').count() > 0, 'search returns matches');
  await page.locator('#source-category').selectOption('token');
  assert.equal(await page.locator('#source-empty').isVisible(), true);
  await page.locator('#source-reset').click();
  assert.equal(await page.locator('#source-search').inputValue(), '');
  assert.equal(await page.locator('#source-category').inputValue(), 'all');
  assert.equal(await page.locator('#source-list button').count(), catalog.entries.length);
  await page.locator('#source-search').fill('hero');
  assert.equal(await page.locator('#clear-source-search').isVisible(), true);
  await page.locator('#clear-source-search').click();
  assert.equal(await page.locator('#source-search').inputValue(), '');
  check('search, category filtering, empty state, reset and clear controls');

  await page.locator('#source-list button[data-entry="motion"]').click();
  assert.equal(await page.locator('#source-title').innerText(), '모션·인터랙션 실험실');
  assert.equal(await page.locator('.preview-shell iframe').getAttribute('src'), 'motion.html');
  await page.locator('#source-tab-preview').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#source-tab-code').getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('#source-panel').getAttribute('aria-labelledby'), 'source-tab-code');
  await page.keyboard.press('End');
  assert.equal(await page.locator('#source-tab-evidence').getAttribute('aria-selected'), 'true');
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#source-tab-preview').getAttribute('aria-selected'), 'true');
  check('entry changes update preview and detail tabs support keyboard navigation');

  await page.locator('#source-tab-code').click();
  const motionEntry = catalog.entries.find(entry => entry.id === 'motion');
  for (const rel of motionEntry.files.filter(rel => isText(catalog.files[rel]))) {
    await page.locator('#source-file').selectOption(rel);
    assert.equal(await page.locator('#source-code-text').innerText(), catalog.files[rel].content, `${rel} code text equals disk`);
  }
  await page.locator('#source-file').selectOption('motion.html');
  await page.locator('#source-copy').click();
  await page.waitForFunction(() => document.querySelector('#source-feedback').textContent.length > 0);
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), catalog.files['motion.html'].content);
  const fileDownload = page.waitForEvent('download');
  await page.locator('#source-download').click();
  assert.equal((await fileDownload).suggestedFilename(), 'motion.html');
  await page.locator('#source-wrap').click();
  assert.equal(await page.locator('#source-wrap').getAttribute('aria-pressed'), 'false');
  assert.equal(await page.locator('.source-code').evaluate(node => node.classList.contains('wrapped')), false);
  check('file source text matches disk, clipboard copy works, download works, wrapping toggles');

  const binaryEntry = catalog.entries.find(entry => entry.files.some(rel => !isText(catalog.files[rel])));
  await page.goto(`${base}/sources.html#${new URLSearchParams({ item: binaryEntry.id, view: 'code' })}`, { waitUntil: 'networkidle' });
  const binaryRel = binaryEntry.files.find(rel => !isText(catalog.files[rel]));
  await page.locator('#source-file').selectOption(binaryRel);
  assert((await page.locator('#source-code-text').innerText()).includes('바이너리 자료입니다'), 'binary source shows safe message');
  assert.equal(await page.locator('#source-copy').isDisabled(), true);
  assert(await page.locator('#source-download').isVisible());
  check('binary files use safe preview and keep download available');

  const originalHtmlEntry = catalog.entries.find(entry => entry.status === 'collected' && entry.files.some(rel => /\.html$/i.test(rel)));
  await page.goto(`${base}/sources.html#${new URLSearchParams({ item: originalHtmlEntry.id, view: 'preview' })}`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.preview-shell iframe').count(), 0, 'collected HTML is not previewed in an iframe');
  assert((await page.locator('#source-panel').innerText()).includes('실행하지 않고 소스 코드로 표시합니다'));
  await page.locator('#view-file-code').click();
  assert.equal(await page.locator('#source-tab-code').getAttribute('aria-selected'), 'true');
  await page.waitForFunction(() => !document.querySelector('#source-copy').disabled);
  assert.equal(await page.locator('#source-code-text').textContent(), catalog.files[originalHtmlEntry.files[0]].content, 'deferred original HTML is complete');
  check('collected HTML loads on demand as exact text and never iframe-executes');

  await page.goto(`${base}/sources.html#${new URLSearchParams({ item: 'hero', view: 'code' })}`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#source-title').innerText(), catalog.entries.find(entry => entry.id === 'hero').title);
  assert.equal(await page.locator('#source-tab-code').getAttribute('aria-selected'), 'true');
  await page.goto(pathToFileURL(path.join(root, 'sources.html')).href + '#item=hero&view=code', { waitUntil: 'load' });
  assert.equal(await page.locator('#source-title').innerText(), catalog.entries.find(entry => entry.id === 'hero').title);
  assert.equal(await page.locator('#source-tab-code').getAttribute('aria-selected'), 'true');
  check('deep links and file:// loading restore selected entry and view');

  await page.goto(`${base}/sources.html#${new URLSearchParams({ item: 'hero', view: 'code' })}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(out, 'after-source-explorer-code.png'), fullPage: true });

  const archiveManifest = JSON.parse(fs.readFileSync(path.join(root, 'samples/complete-source-manifest.json'), 'utf8'));
  assert(archiveManifest.count > 0);
  for (const rel of ['sources.html', 'design-system/source-catalog.js', 'design-system/sources.js', 'design-system/sources.css', 'samples/hero.html']) {
    const item = archiveManifest.files.find(file => file.path === rel);
    assert(item, `archive manifest contains ${rel}`);
    const disk = read(rel);
    assert.equal(item.bytes, disk.length, `${rel} archive manifest byte length`);
    assert.equal(item.sha256, sha(disk), `${rel} archive manifest hash`);
  }
  assert(fs.statSync(path.join(root, 'samples/complete-source.zip')).size > 1000, 'archive zip exists and is non-empty');
  check('complete source archive manifest covers source explorer and local relative assets smoke set');

  await page.goto(`${base}/use.html`, {waitUntil:'networkidle'});
  for(const width of [1440,768,375]) {
    await page.setViewportSize({width,height:950});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), `usage guide ${width}px overflow`);
  }
  const runtimeDownload=page.waitForEvent('download');
  await page.locator('.source-start a[download]').click();
  const downloaded=await runtimeDownload;
  assert.equal(downloaded.suggestedFilename(),'adver-system-1.0.0.zip');
  assert.equal(sha(fs.readFileSync(await downloaded.path())),sha(read('releases/adver-system-1.0.0.zip')));
  await page.screenshot({path:path.join(out,'usage-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:path.join(out,'usage-desktop.png'),fullPage:true});
  await page.locator('.source-evidence-links a[href^="sources.html"]').click();
  assert.equal(await page.locator('#source-title').innerText(),'tokens.scoped.css');
  assert.equal(await page.locator('#source-tab-code').getAttribute('aria-selected'),'true');
  check('project guide fits desktop/tablet/mobile, downloads exact runtime ZIP and links scoped token source');

  assert.deepEqual(errors, []);
  check('no uncaught page errors or failed HTTP resources');
  const result = {
    date: new Date().toISOString(),
    status: 'pass',
    entries: catalog.entries.length,
    files: Object.keys(catalog.files).length,
    checks,
    limits: [
      'ZIP content hashes were checked against manifest smoke entries; full archive extraction was not performed in this script.',
      'Clipboard check requires a browser context that grants clipboard-read and clipboard-write.',
      'Source fidelity is exact for local embedded text files; binary source previews are intentionally download-only.'
    ]
  };
  fs.writeFileSync(path.join(out, 'source-result.json'), JSON.stringify(result, null, 2) + '\n');
  await browser.close();
})().catch(async error => {
  console.error(error);
  fs.writeFileSync(path.join(out, 'source-result.json'), JSON.stringify({
    date: new Date().toISOString(),
    status: 'failed',
    checks,
    error: error.message
  }, null, 2) + '\n');
  if (browser) await browser.close();
  process.exit(1);
});
