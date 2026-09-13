const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium, executablePath } = require('./browser-runtime.cjs');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const checks = [];
  const check = (name, condition) => { checks.push({ name, passed: !!condition }); assert.ok(condition, name); };
  try {
    await page.goto('http://127.0.0.1:4187/source-explorer.html', { waitUntil: 'networkidle' });
    await page.locator('.source-row').first().focus();
    await page.keyboard.press('ArrowDown');
    check('Arrow selection preserves keyboard focus', await page.locator('.source-row[aria-selected=true]').evaluate(node => node === document.activeElement));
    check('One tab stop in the source list', await page.locator('.source-row[tabindex="0"]').count() === 1);
    await page.keyboard.press('ArrowDown');
    check('Repeated arrow navigation works', await page.locator('.source-row').nth(2).getAttribute('aria-selected') === 'true');
    await page.locator('#preview-tab').focus();
    await page.keyboard.press('ArrowRight');
    check('Code tab is keyboard selectable', await page.locator('#code-tab').getAttribute('aria-selected') === 'true');
    check('Code tab receives focus', await page.locator('#code-tab').evaluate(node => node === document.activeElement));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.source-row').first().click();
    check('Mobile selection focuses detail heading', await page.locator('#detail-title').evaluate(node => node === document.activeElement));
    await page.locator('#back-to-list').click();
    check('Back to list restores selected source focus', await page.locator('.source-row[aria-selected=true]').evaluate(node => node === document.activeElement));
  } finally {
    await browser.close();
    fs.writeFileSync('research/source-keyboard-v4.json', JSON.stringify({ checks, passed: checks.every(x => x.passed) }, null, 2));
    console.log(JSON.stringify(checks));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
