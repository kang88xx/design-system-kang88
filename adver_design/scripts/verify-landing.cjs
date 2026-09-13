/* Requires an existing Playwright installation, not a project dependency. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

const base = process.env.PREVIEW_URL || 'http://127.0.0.1:8766';
const out = path.resolve(__dirname, '../references/verification/landing');

async function assertTheme(page, theme) {
  assert.equal(await page.locator('body').getAttribute('data-theme'), theme);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(background, theme === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)', `${theme} background`);
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  const checks = [];

  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(`${base}/landing.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.removeItem('adver-landing-theme');
      document.querySelector('[data-theme-choice="light"]').click();
    });
    await assertTheme(page, 'light');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow ${width}`);
    await page.screenshot({ path: path.join(out, `landing-light-${width}.png`), fullPage: true });

    await page.locator('[data-theme-choice=dark]').click();
    await assertTheme(page, 'dark');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `dark overflow ${width}`);
    await page.screenshot({ path: path.join(out, `landing-dark-${width}.png`), fullPage: true });
    checks.push(`layout ${width} light/dark`);
  }

  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto(`${base}/landing.html`, { waitUntil: 'networkidle' });
  const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
  assert.equal(new Set(ids).size, ids.length, 'unique ids');
  assert.equal(await page.locator('[data-section-id]').count(), 9, 'section markers');
  assert.equal(await page.locator('.metric-card strong').nth(0).innerText(), '18%');
  assert.equal(await page.locator('.source-trigger').getAttribute('href'), 'sources.html#item=landing');
  assert.equal(await page.locator('.metric-card').count(), 4, 'all four observed metric cards');
  assert.equal(await page.locator('.faq-list details').count(), 7, 'all seven observed FAQ rows');
  for (const name of ['handle','phone','payment','country']) assert.equal(await page.locator(`[name="${name}"]`).count(), 1, `observed form field ${name}`);
  await page.locator('#results').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('[data-count-to="4.74"]').innerText(), '4.74x', 'decimal metric precision');
  checks.push('unique ids, nine sections, four metrics, seven FAQ rows and observed form fields');

  await page.locator('#campaign-tab-1').click();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#campaign-tab-2').getAttribute('aria-selected'), 'true');
  await page.keyboard.press('End');
  assert.equal(await page.locator('#campaign-tab-4').getAttribute('aria-selected'), 'true');
  assert.match(await page.locator('[data-campaign-title]').innerText(), /Launch/);
  checks.push('campaign tabs click and keyboard');

  await page.locator('[name=firstName]').fill('Jane');
  await page.locator('[name=email]').fill('bad-email');
  await page.locator('[data-contact-form] [type=submit]').click();
  assert.equal(await page.locator('[name=lastName]').getAttribute('aria-invalid'), 'true');
  assert.equal(await page.locator('[name=email]').getAttribute('aria-invalid'), 'true');
  await page.locator('[name=lastName]').fill('Doe');
  await page.locator('[name=email]').fill('jane@example.com');
  await page.locator('[name=company]').fill('Example');
  await page.locator('[data-contact-form] [type=submit]').click();
  await page.waitForFunction(() => document.querySelector('.form-status').textContent.includes('확인되었습니다'));
  checks.push('contact invalid and success states');

  await page.locator('.faq-list details').nth(1).locator('summary').click();
  assert.equal(await page.locator('.faq-list details').nth(1).getAttribute('open') !== null, true);
  checks.push('FAQ toggle');

  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`${base}/landing.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.removeItem('adver-landing-theme');
    document.querySelector('[data-theme-choice="light"]').click();
    document.querySelector('[data-nav-panel]').dataset.open = 'false';
    document.querySelector('[data-menu-toggle]').setAttribute('aria-expanded', 'false');
  });
  await assertTheme(page, 'light');
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => scrollY === 0);
  await page.screenshot({ path: path.join(out, 'landing-mobile-top-light.png'), fullPage: false });
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(out, 'landing-mobile-contact-light.png'), fullPage: false });
  await page.locator('[data-menu-toggle]').click();
  assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('[data-menu-toggle]').getAttribute('aria-expanded'), 'false');
  checks.push('mobile nav Escape');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
  assert.equal(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running' && animation.effect?.getTiming().iterations === Infinity).length), 0);
  checks.push('reduced motion stops loops');

  const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../design-system/page-sections.json'), 'utf8'));
  assert.equal(data.sections.length, 9);
  for (const section of data.sections) {
    assert.equal(typeof section.title, 'string', `${section.id} title`);
    assert.equal(typeof section.evidence, 'string', `${section.id} evidence`);
    assert(section.html.includes('data-section-id') || section.id === 'footer', `${section.id} outerHTML`);
    assert(Array.isArray(section.cssFiles), `${section.id} css files`);
    assert(Array.isArray(section.jsFiles), `${section.id} js files`);
  }
  checks.push('page-sections JSON includes 9 copyable landing section HTML entries');

  const blockedStorage = await browser.newPage();
  blockedStorage.on('pageerror', error => errors.push(error.message));
  await blockedStorage.addInitScript(() => {
    for (const name of ['getItem', 'setItem']) Storage.prototype[name] = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  await blockedStorage.goto(`${base}/landing.html`, {waitUntil:'networkidle'});
  await blockedStorage.locator('#campaign-tab-2').click();
  assert.equal(await blockedStorage.locator('#campaign-tab-2').getAttribute('aria-selected'), 'true');
  await blockedStorage.close();
  checks.push('blocked localStorage does not prevent page initialization');
  assert.deepEqual(errors, []);
  const result = {
    date: new Date().toISOString(),
    status: 'pass',
    checks,
    limits: [
      '관찰 기반 재구성입니다. 독점 원본 코드/비공개 구조 추출이라고 주장하지 않습니다.',
      '전체 WCAG 인증, Safari/Firefox 검증은 수행하지 않았습니다.'
    ]
  };
  fs.writeFileSync(path.join(out, 'landing-result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(result);
  await browser.close();
})().catch(error => {
  console.error(error);
  fs.writeFileSync(path.join(out, 'landing-result.json'), JSON.stringify({
    date: new Date().toISOString(),
    status: 'failed',
    error: error.message
  }, null, 2) + '\n');
  process.exit(1);
});
