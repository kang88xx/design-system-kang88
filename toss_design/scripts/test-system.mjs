import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { browserRuntime } from './browser-runtime.mjs';

const url = process.env.TEST_URL || 'http://127.0.0.1:8120/';
const browser = await browserRuntime();
const results = [];
await mkdir('evidence/qa', { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.waitForSelector('[data-live-catalog][data-ready="true"]');
    await page.waitForFunction(() => document.querySelector('[data-library-count="all"]').textContent !== '—');
    assert.equal(await page.locator('[data-motion-demo]').count(), 6);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${viewport.width}: horizontal page overflow`);
    await page.screenshot({ path: `evidence/qa/overview-${viewport.width}.png` });

    // Every category renders a bounded page of source cards.
    for (const category of ['icons', 'buttons', 'shapes', 'gradients', 'colors', 'images', 'motion', 'typography', 'effects']) {
      await page.locator(`[data-catalog-tab="${category}"]`).click();
      const count = await page.locator('[data-entry-id]').count();
      assert.ok(count > 0 && count <= 24, `${category}: invalid pagination ${count}`);
    }
    await page.locator('[data-catalog-tab="icons"]').click();
    await page.locator('[data-catalog-tab="icons"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogTab), 'buttons', 'Arrow navigation must retain focus after rendering');
    await page.keyboard.press('Home');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.catalogTab), 'all');

    // Searching covers categories; no-match and reset are actionable.
    await page.locator('[data-catalog-search]').fill('zzzz-no-source-98173');
    assert.ok(await page.locator('[data-catalog-empty]').isVisible());
    await page.locator('[data-catalog-empty] [data-catalog-reset]').click();
    await page.locator('[data-catalog-search]').fill('gradient');
    assert.ok(await page.locator('[data-entry-id]').count() > 0);
    await page.locator('[data-catalog-search]').fill('');
    await page.locator('[data-evidence-filter]').selectOption('recreated');
    assert.equal(await page.locator('[data-entry-id]').count(), 6);
    await page.locator('[data-evidence-filter]').selectOption('all');
    await page.locator('[data-catalog-tab="icons"]').click();
    await page.locator('[data-catalog-load-more]').click();
    assert.equal(await page.locator('[data-entry-id]').count(), 48);

    // Dialog supports copy/download/Escape and restores the actual invoking card.
    const card = page.locator('[data-entry-id]').first();
    const id = await card.getAttribute('data-entry-id');
    await card.focus();
    await page.keyboard.press('Enter');
    const modal = page.locator('.catalog-dialog');
    assert.ok(await modal.isVisible());
    const code = await page.locator('[data-dialog-code]').textContent();
    await page.locator('[data-copy-code]').click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), code);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('[data-download-code]').click();
    const download = await downloadEvent;
    const downloadPath = await download.path();
    assert.equal(await readFile(downloadPath, 'utf8'), code);
    await page.screenshot({ path: `evidence/qa/detail-${viewport.width}.png` });
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.entryId), id);
    await card.click();
    await page.locator('.catalog-dialog__close').click();
    assert.equal(await modal.isVisible(), false, 'Visible close control must close the dialog');

    await page.locator('[data-catalog-tab="gradients"]').click();
    const exportEvent = page.waitForEvent('download');
    await page.locator('[data-catalog-export]').click();
    const exported = JSON.parse(await readFile(await (await exportEvent).path(), 'utf8'));
    assert.ok(exported.entries.length > 0 && exported.entries.every(e => e.category === 'gradients'));
    await page.evaluate(() => document.querySelector('#live-catalog').scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `evidence/qa/library-${viewport.width}.png` });

    // Built-in tabs, mobile menu and workbench interaction state transitions.
    if (viewport.width < 1024) {
      await page.locator('.mobile-menu-button').click();
      assert.ok(await page.locator('#mobile-menu').isVisible());
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.mobile-menu-button').getAttribute('aria-expanded'), 'false');
    }
    await page.locator('[data-scrub-range]').fill('100');
    assert.equal(await page.locator('[data-scrub-value]').textContent(), '100%');
    await page.locator('[data-sheet-open]').click();
    assert.ok(await page.locator('[data-motion-dialog]').isVisible());
    await page.locator('[data-motion-dialog] button[value="confirm"]').click();
    assert.match(await page.locator('[data-sheet-result]').textContent(), /확인했어요/);
    await page.locator('[data-motion-accordion] button').nth(1).click();
    assert.equal(await page.locator('[data-motion-accordion] button').nth(1).getAttribute('aria-expanded'), 'true');
    await page.locator('[data-progress-start]').click();
    await page.waitForFunction(() => document.querySelector('[data-progress-title]').textContent === '완료');
    assert.equal(await page.locator('[data-progress-start]').isDisabled(), false);
    await page.evaluate(() => document.querySelector('#motion-lab').scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `evidence/qa/motion-${viewport.width}.png` });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${viewport.width}: interaction overflow`);
    assert.deepEqual(errors, [], `${viewport.width}: browser errors`);
    await page.locator('[data-frame-group] option').first().waitFor({ state: 'attached' });
    assert.equal(await page.locator('[data-frame-group] option').count(), 3);
    assert.equal(await page.locator('[data-video-select] option').count(), 15);
    await page.locator('[data-frame-range]').fill('12');
    await page.waitForFunction(() => document.querySelector('[data-frame-image]').dataset.loadedFrame === '12');
    await page.evaluate(() => document.querySelector('#source-motion').scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: `evidence/qa/source-motion-${viewport.width}.png` });
    results.push({ viewport, categories: 9, clipboard: 'pass', downloads: 'pass', keyboard: 'pass', reducedMotion: 'pass', errors });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(url);
  await page.waitForSelector('[data-live-catalog][data-ready="true"]');
  await page.locator('[data-progress-start]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('[data-progress-title]').textContent === '완료');
  assert.equal(await page.locator('[data-progress-start]').isDisabled(), false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('[data-progress-start]').click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => !document.querySelector('[data-progress-start]').disabled);
  await context.close();

  const offline = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await offline.route('https://**/*', route => route.abort());
  const fallback = await offline.newPage();
  await fallback.goto(url);
  await fallback.waitForSelector('[data-live-catalog][data-ready="true"]');
  await fallback.locator('[data-catalog-tab="images"]').click();
  await fallback.waitForTimeout(300);
  const loadedImages = await fallback.locator('[data-catalog-grid] img').evaluateAll(images => images.filter(image => image.complete && image.naturalWidth > 0).length);
  assert.ok(loadedImages > 0, 'Local archived media must remain available without the source network');
  await offline.close();
  await writeFile('evidence/qa/results.json', JSON.stringify({ result: 'pass', results, runtimeReducedMotion: 'pass', pausedControlsRecover: 'pass', sourceOffline: 'pass' }, null, 2));
  console.log(JSON.stringify({ result: 'pass', viewports: results.length, tests: 'categories, search, filters, pagination, keyboard, dialogs, clipboard, exports, workbench, reduced motion, interrupted progress, offline assets' }, null, 2));
} finally { await browser.close(); }
