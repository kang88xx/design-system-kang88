import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { launchBrowser } from './browser-runtime.mjs';

const origin = process.env.CATALOG_ORIGIN || 'http://127.0.0.1:8093';
const output = 'captures/refresh';
await mkdir(output, { recursive: true });
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 1080 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const errors = [], failedRequests = [], checks = [], screenshots = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) failedRequests.push({ url: response.url(), status: response.status() }); });
const check = (name, details = true) => checks.push({ name, pass: true, details });
const view = async id => {
  // Studio shell: below 640px the sidebar is an off-canvas drawer, so open it first.
  const menu = page.locator('.as-mobile-nav-button');
  if (await menu.isVisible()) await menu.click();
  await page.locator('[data-view="' + id + '"]').click();
  await page.waitForFunction(id => location.hash === '#' + id, id);
};
const screenshot = async (id, theme, width) => {
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(120);
  const file = `${output}/catalog-${id}-${theme}-${width}.png`;
  await page.screenshot({ path: file, fullPage: false });
  screenshots.push(file);
};
const noOverflow = async label => {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert.ok(dimensions.scrollWidth <= dimensions.width + 1, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
};
try {
  await page.goto(origin + '/viewer/', { waitUntil: 'networkidle' });
  const nav = await page.locator('[data-view]').evaluateAll(elements => elements.map(x => x.dataset.view));
  assert.equal(nav.length, 13);
  for (const id of nav) {
    await view(id);
    assert.equal(await page.locator('main h1').count(), 1, `${id} heading`);
    await noOverflow(`${id} desktop`);
  }
  check('13 desktop views render without overflow');

  await view('icons');
  assert.equal(await page.locator('.icon-name').count(), 359);
  await page.locator('#catalog-search').fill('IconHashTag');
  assert.equal(await page.locator('.icon-name').count(), 1);
  await page.locator('[data-copy-svg]').click();
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('복사') || document.querySelector('#catalog-status')?.textContent.includes('복사'));
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(clipboard, /^<svg[\s>]/);
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.icon-name a[download]').click()]);
  const downloadedSvg = await readFile(await download.path(), 'utf8');
  assert.equal(downloadedSvg, clipboard);
  const size = page.locator('[data-icon-size]');
  await size.focus();
  await size.press('ArrowRight');
  assert.equal(await page.evaluate(() => document.activeElement.matches('[data-icon-size]')), true, 'slider retains keyboard focus');
  check('359 icons, supplemental search, SVG clipboard/download, preview size keyboard focus');
  await page.locator('#catalog-search').fill('no-such-montage-item-92751');
  assert.equal(await page.locator('.icon-name').count(), 0);
  assert.match(await page.locator('main').innerText(), /검색 결과가 없습니다/);
  await page.locator('#catalog-search').fill('IconLogoGoogleColor');
  assert.equal(await page.locator('.icon-name img').evaluate(el => getComputedStyle(el).filter), 'none', 'multicolor icons retain original colors');
  check('Search empty state and original multicolor icon colors');

  await view('tokens');
  const tokenValueBefore = await page.locator('.token-value').first().innerText();
  await page.locator('.copy-token').first().click();
  assert.match(await page.evaluate(() => navigator.clipboard.readText()), /^--/);
  const themeToggle = page.locator('#theme-toggle');
  await themeToggle.click();
  const theme = await page.locator('html').getAttribute('data-theme');
  assert.ok(['light', 'dark'].includes(theme));
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
  assert.ok(tokenValueBefore.length > 0);
  check('Token copy and persisted theme');

  await view('components');
  await page.locator('#catalog-search').fill('Button');
  await page.locator('.catalog-item summary').first().click();
  assert.ok(await page.locator('.code-panel pre:visible').count() > 0);
  check('Component source code exposed');

  await view('assets');
  assert.match(await page.locator('main .result-count').innerText(), /697 assets/);
  assert.equal(await page.locator('.asset-card').count(), 48);
  const firstAsset = await page.locator('.asset-card img').first().getAttribute('src');
  await page.locator('[data-asset-page="next"]').click();
  assert.notEqual(await page.locator('.asset-card img').first().getAttribute('src'), firstAsset);
  await page.locator('[data-asset-category="button"]').click();
  assert.match(await page.locator('main .result-count').innerText(), /77 assets/);
  check('All697 assets available,48/page pagination and77 button references');

  await view('sources');
  assert.match(await page.locator('main').innerText(), /580 examples/);
  const seenCode = new Set();
  const pageCount = Math.ceil(580 / 48);
  for (let n = 0; n < pageCount; n++) {
    for (const code of await page.locator('.source-card [data-copy]').evaluateAll(elements => elements.filter(el => el.textContent === 'Copy code').map(el => el.dataset.copy))) seenCode.add(code);
    if (n < pageCount - 1) await page.locator('[data-source-page="next"]').click();
  }
  assert.ok(seenCode.size > 400, 'source pagination exposes substantial complete code inventory');
  for (const path of ['/exports/montage-reuse.zip', '/assets/montage/source/LICENSE-Montage.md', '/data/curated/recipes.css']) {
    const response = await context.request.get(origin + path);
    assert.equal(response.status(), 200, path);
    assert.ok((await response.body()).length > 100);
  }
  check('580 source examples paginate and export/license/CSS resolve', { uniqueCodeSnippets: seenCode.size });

  await view('interactions');
  const switchButton = page.getByRole('switch');
  await switchButton.click();
  assert.equal(await switchButton.getAttribute('aria-checked'), 'true');
  await page.getByRole('checkbox').uncheck();
  assert.equal(await page.getByRole('checkbox').isChecked(), false);
  await page.getByRole('radio', { name: 'Radio B' }).check();
  assert.equal(await page.getByRole('radio', { name: 'Radio A' }).isChecked(), false);
  await page.locator('.ds-accordion summary').click();
  assert.equal(await page.locator('.ds-accordion').getAttribute('open'), '');
  const tab = page.getByRole('tab', { name: 'Overview', exact: true });
  await tab.focus(); await tab.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'Code', exact: true }).getAttribute('aria-selected'), 'true');
  const range = page.locator('[data-range]');
  await range.fill('72');
  assert.equal(await page.locator('[data-range-value]').innerText(), '72');
  const dialogButton = page.locator('[data-open-dialog]');
  await dialogButton.click();
  assert.equal(await page.locator('dialog').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.matches('[data-open-dialog]')), true);
  const submit = page.locator('[data-demo-loading]');
  await submit.click();
  assert.equal(await submit.isDisabled(), true);
  await page.waitForFunction(() => !document.querySelector('[data-demo-loading]').disabled);
  await page.locator('[data-demo-toast]').click();
  assert.ok(await page.locator('.toast').count() > 0);
  const toastColor = await page.locator('.toast').last().evaluate(el => getComputedStyle(el).color);
  assert.equal(toastColor, await page.locator('html').getAttribute('data-theme') === 'dark' ? 'rgb(23, 23, 25)' : 'rgb(247, 247, 248)', 'toast uses readable inverse label');
  check('Native selection, accordion, keyboard tabs, slider, modal Escape/focus, loading and toast');

  await view('surfaces');
  const surfaces = await page.locator('.surface-sample').evaluateAll(elements => elements.map(el => ({ radius: getComputedStyle(el).borderRadius, shadow: getComputedStyle(el).boxShadow, filter: getComputedStyle(el).filter, mask: getComputedStyle(el).maskImage })));
  assert.equal(surfaces.length, 18);
  assert.ok(surfaces.some(x => x.radius !== '0px'), 'recipe radius applied');
  assert.ok(surfaces.some(x => x.shadow !== 'none'), 'actual shadow recipe applied');
  assert.ok(surfaces.some(x => x.mask !== 'none'), 'actual mask gradient applied');
  check('18 surface previews apply real radius/elevation/gradient');

  await view('motion');
  assert.equal(await page.locator('.motion-card').count(), 10);
  await page.locator('[data-replay-motion]').first().click();
  const animationNames = await page.locator('.motion-sample').first().evaluate(el => el.getAnimations({ subtree: true }).map(x => x.animationName));
  assert.ok(animationNames.some(x => x?.includes('enter')), 'Replay runs actual entrance recipe');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('[data-replay-motion]').first().click();
  const duration = await page.locator('.motion-sample').first().evaluate(el => getComputedStyle(el).animationDuration);
  assert.ok(duration.split(',').every(x => parseFloat(x) < 0.01), `reduced motion duration ${duration}`);
  check('10 motion recipes, actual replay and reduced-motion override');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  for (const targetTheme of ['light', 'dark']) {
    if (await page.locator('html').getAttribute('data-theme') !== targetTheme) await themeToggle.click();
    for (const id of ['overview', 'motion', 'interactions', 'surfaces', 'icons', 'assets', 'sources']) {
      await view(id); await screenshot(id, targetTheme, 1440);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of nav) {
    await view(id); await noOverflow(`${id} mobile`);
    if (['overview', 'interactions', 'icons', 'sources'].includes(id)) await screenshot(id, 'dark', 390);
  }
  check('13 mobile views without overflow and18 visual captures');
  await page.evaluate(() => { location.hash = '#gradients'; });
  await page.waitForFunction(() => document.querySelector('[data-view="gradients"]')?.getAttribute('aria-current') === 'page');
  check('Hash navigation updates rendered view');
  assert.deepEqual(errors, [], 'browser runtime errors');
  assert.deepEqual(failedRequests, [], 'local resource HTTP errors');
  check('No browser runtime errors or local404s');
  await writeFile(`${output}/browser-report.json`, JSON.stringify({ status: 'ok', checks, screenshots, errors, failedRequests }, null, 2));
  console.log(JSON.stringify({ status: 'ok', checks: checks.length, screenshots: screenshots.length }, null, 2));
} catch (error) {
  await page.screenshot({ path: `${output}/catalog-test-failure.png` }).catch(() => {});
  await writeFile(`${output}/browser-report.json`, JSON.stringify({ status: 'failed', failure: error.message, checks, errors, failedRequests }, null, 2));
  throw error;
} finally { await browser.close(); }
