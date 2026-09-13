const fs = require('fs');
const { chromium, executablePath } = require('./browser-runtime.cjs');

(async () => {
  const index = JSON.parse(fs.readFileSync('research/source-index.json', 'utf8'));
  const models = JSON.parse(fs.readFileSync('sources/decoded/manifest.json', 'utf8')).models;
  const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const checks = [], errors = [], badResponses = [], expectedFailures = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && !expectedFailures.has(response.url())) badResponses.push(response.url());
  });
  const base = 'http://127.0.0.1:4187/';
  const check = (name, passed) => { checks.push({ name, passed: !!passed }); if (!passed) throw Error(name); };
  const source = async item => {
    await page.goto(base + 'source-explorer.html?path=' + encodeURIComponent(item.path), { waitUntil: 'networkidle' });
    check('Deep link selects ' + item.path, await page.locator('#detail-title').textContent() === item.title);
  };
  try {
    await page.goto(base + 'source-explorer.html', { waitUntil: 'networkidle' });
    check('All real index entries render', await page.locator('.source-row').count() === index.items.length);
    check('Official count excludes derived files and fallback', await page.locator('[data-summary="extracted"]').textContent() === String(index.summary.official_public_items));
    await page.locator('#source-search').fill('ScreenPaint');
    check('Class names searchable', await page.locator('.source-row').count() > 0);
    const namedClass = index.items.find(item => /classes\/ScreenPaint-\d/.test(item.path));
    await source(namedClass);
    await page.locator('#code-tab').click();
    check('Readable class code', (await page.locator('#code-view code').textContent()).includes('class ScreenPaint'));
    for (const [suffix, content] of [['.glsl', 'void main'], ['.obj', '\nv ']]) {
      await source(index.items.find(item => item.path.endsWith(suffix)));
      await page.locator('#code-tab').click();
      check('Actual source text ' + suffix, (await page.locator('#code-view code').textContent()).includes(content));
    }
    await source(index.items.find(item => item.path.endsWith('.exr')));
    check('EXR uses unsupported-format fallback', await page.locator('#preview-stage img').count() === 0 && await page.locator('.binary-preview').count() === 1);
    const raw = index.items.find(item => item.path.endsWith('/about/person.buf'));
    await source(raw);
    const modelLink = page.locator('#detail-actions a', { hasText: '추출 모델 보기' });
    const target = new URL(await modelLink.getAttribute('href'), base);
    check('Model link retains actual source and valid anchor', target.hash === '#models' && target.searchParams.get('path') === raw.path);
    await modelLink.click();
    await page.waitForFunction(() => document.querySelector('#model-readout').textContent.includes('vertices'));
    check('Requested original model is selected', (await page.locator('#model-name').textContent()).includes('person.buf'));

    const delayed = base + models[0].points;
    await page.route(delayed, async route => { await new Promise(resolve => setTimeout(resolve, 300)); await route.continue().catch(() => {}); });
    await page.locator('#model-select').selectOption('0');
    await page.locator('#model-select').selectOption('1');
    await page.waitForFunction(label => document.querySelector('#model-name').textContent.includes(label), models[1].label);
    await page.waitForTimeout(400);
    check('Rapid model selection keeps latest result', (await page.locator('#model-name').textContent()).includes(models[1].label));
    await page.unroute(delayed);
    const failed = base + models[2].points;
    expectedFailures.add(failed);
    await page.route(failed, route => route.fulfill({ status: 503, body: 'Test unavailable model' }));
    await page.locator('#model-select').selectOption('2');
    await page.waitForFunction(() => document.querySelector('#model-readout').textContent.includes('읽지 못했습니다'));
    check('Failed model read displays recoverable status', true);
    await page.unroute(failed);
    await page.locator('#model-select').selectOption('3');
    await page.waitForFunction(label => document.querySelector('#model-name').textContent.includes(label), models[3].label);
    check('Model selection recovers after read failure', true);
    await page.goto(base + 'source-explorer.html#%ZZ', { waitUntil: 'networkidle' });
    check('Malformed hash does not break index', await page.locator('.source-row').count() === index.items.length);
    check('No unexpected JavaScript exceptions', errors.length === 0);
    check('No unexpected failed HTTP resources', badResponses.length === 0);
  } finally {
    await browser.close();
    const report = { checked_at: new Date().toISOString(), indexed_items: index.items.length, checks, errors, badResponses, passed: checks.every(check => check.passed) && !errors.length && !badResponses.length };
    fs.writeFileSync('research/source-live-checks-v3.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
