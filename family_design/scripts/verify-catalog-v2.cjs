const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/home/kang/.claude/skills/gstack/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const base = process.argv[2] || 'http://127.0.0.1:40565';

async function waitForVideoMetadata(locator) {
  await locator.evaluate((video) => {
    if (video.readyState >= 1) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Timed out waiting for video metadata')), 5000);
      video.addEventListener('loadedmetadata', () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      video.addEventListener('error', () => {
        clearTimeout(timeout);
        reject(Error(video.error?.message || 'Video metadata error'));
      }, { once: true });
    });
  });
}

async function assertVideoPlaying(page, itemName) {
  const locator = page.locator('#film-expanded');
  await locator.evaluate((video) => video.play());
  try {
    await page.waitForFunction(() => {
      const video = document.querySelector('#film-expanded');
      return Boolean(video && !video.paused && video.currentTime > 0);
    }, undefined, { timeout: 2500 });
  } catch (error) {
    const state = await locator.evaluate((video) => ({
      currentTime: video.currentTime,
      duration: video.duration,
      paused: video.paused,
      readyState: video.readyState,
      networkState: video.networkState,
      src: video.currentSrc,
      error: video.error?.message || null,
    }));
    throw new assert.AssertionError({
      message: `${itemName} video did not begin playback within readiness timeout: ${JSON.stringify(state)}`,
      actual: state,
      expected: { currentTime: '> 0', paused: false },
      operator: 'waitForFunction',
    });
  }
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const broken = [];
    const checks = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('response', (r) => {
      if (r.status() >= 400 && r.url().startsWith(base)) broken.push({ url: r.url(), status: r.status() });
    });
    const pass = (claim, data) => checks.push({ claim, ...(data ? { data } : {}) });

    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.film-card').count(), 9);
    assert.equal(await page.locator('.scene-card').count(), 14);
    assert.equal(await page.locator('.swatch').count(), 49);
    assert.equal(await page.locator('.asset-tile').count(), 12);
    pass('9 product film cards, 14 original scene groups, 49 colors and 12 curated source assets rendered');

    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'references/v2-source/media-library.json'))).videos;
    for (const item of manifest) {
      await page.evaluate((name) => window.FamilyCatalogV2.openFilm(name), item.name);
      await waitForVideoMetadata(page.locator('#film-expanded'));
      const duration = await page.locator('#film-expanded').evaluate((video) => video.duration);
      assert(Math.abs(duration - item.durationSeconds) < 0.08, `${item.name} duration mismatch`);
      await assertVideoPlaying(page, item.name);
      await page.locator('#film-speed').selectOption('.5'.replace(/^\./, '0.'));
      assert.equal(await page.locator('#film-expanded').evaluate((video) => video.playbackRate), 0.5);
      await page.locator('#film-expanded').evaluate((video) => {
        video.pause();
        video.currentTime = video.duration / 2;
      });
      await page.waitForTimeout(80);
      const before = await page.locator('#film-expanded').evaluate((video) => video.currentTime);
      await page.locator('#film-next-frame').click();
      const after = await page.locator('#film-expanded').evaluate((video) => video.currentTime);
      assert(Math.abs(after - before - 1 / 30) < 0.003);
      await page.locator('#film-prev-frame').click();
      assert(Math.abs(await page.locator('#film-expanded').evaluate((video) => video.currentTime) - before) < 0.003);
      await page.keyboard.press('Escape');
      assert(!(await page.locator('#film-dialog').evaluate((dialog) => dialog.open)));
      assert(await page.locator('#film-expanded').evaluate((video) => video.paused));
      pass(`Original ${item.name} video plays, seeks, steps, changes speed and pauses on dialog close`, { duration });
    }

    await page.locator('[data-film-filter="관리"]').click();
    assert.equal(await page.locator('.film-card:visible').count(), 3);
    await page.locator('[data-film-filter="all"]').click();
    assert.equal(await page.locator('.film-card:visible').count(), 9);
    pass('Film categories filter 3/9 correctly');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('[data-copy="#343433"]').first().click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '#343433');
    pass('Color clipboard still copies source token value');

    // Every scene must resolve to an actual implementation rather than a missing anchor.
    const coverage = JSON.parse(fs.readFileSync(path.join(root, 'source-coverage.json')));
    const ids = await page.evaluate(() => window.FamilyMotionLibrary.data.map((x) => x.id));
    for (const scene of coverage.sections) {
      assert(scene.previewId === 'layout-features' || ids.includes(scene.previewId), `Unmapped scene ${scene.id} -> ${scene.previewId}`);
    }
    pass('Every source scene resolves to an existing motion card or HTML layout recipe');

    await page.locator('#layout-features').scrollIntoViewIfNeeded();
    const frame = page.frameLocator('#layout-features iframe');
    await frame.locator('[data-mode="features"]').click();
    assert.equal(await frame.locator('#features article').count(), 6);
    await frame.locator('[data-mode="details"]').click();
    assert.equal(await frame.locator('#details .detail-item').count(), 4);
    await frame.locator('[data-mode="bento"]').click();
    assert.equal(await frame.locator('.bento>article').count(), 5);
    pass('Native layout recipes show feature6, stickyDetails4 and Bento5');

    const linkedFiles = await page.locator('a[href]').evaluateAll((anchors) => anchors
      .map((x) => x.getAttribute('href'))
      .filter((href) => href && !href.startsWith('#') && !/^(https?:|mailto:|javascript:)/.test(href)));
    for (const file of linkedFiles) {
      assert(fs.existsSync(path.resolve(root, decodeURIComponent(file.split('#')[0].split('?')[0]))), `Missing linked file ${file}`);
    }
    pass('All static source, asset and handoff links resolve to local files');

    const views = [];
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto(base, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.FamilyMotionLibrary.setReduced(true));
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }));
      assert(dimensions.scroll <= dimensions.inner, `Horizontal overflow ${JSON.stringify({ viewport, dimensions })}`);
      await page.screenshot({ path: path.join(root, `references/v2-review/overview-${viewport.width}.png`) });
      await page.locator('#motion').evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 25, behavior: 'instant' }));
      await page.screenshot({ path: path.join(root, `references/v2-review/motion-${viewport.width}.png`) });
      await page.locator('#app-demos').evaluate((element) => window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - 25, behavior: 'instant' }));
      await page.screenshot({ path: path.join(root, `references/v2-review/films-${viewport.width}.png`) });
      views.push({ ...viewport, ...dimensions });
    }
    pass('Desktop/tablet/mobile views have no page horizontal overflow and are screenshot-captured', views);

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(60);
    assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
    await page.locator('.film-stage').first().hover();
    await page.waitForTimeout(100);
    assert(await page.locator('.film-card video').first().evaluate((video) => video.paused));
    pass('Reduced-motion blocks hover autoplay and synchronizes global control');
    assert.equal(errors.length, 0, JSON.stringify(errors));
    assert.equal(broken.length, 0, JSON.stringify(broken));
    pass('No local page runtime errors or failed HTTP resources');

    const result = { date: new Date().toISOString(), status: 'passed', checks, viewports: views, errors, broken };
    fs.writeFileSync(path.join(root, 'references/v2-review/validation.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close().catch((error) => console.error('Failed to close Playwright browser:', error));
  }
})();
