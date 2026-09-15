/* Open index.html, system.html, layout-recipes.html and the kit starter over HTTP at 3 viewports; record console errors, screenshots, tab/dialog/theme behaviour. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || require('os').homedir() + '/.claude/skills/gstack/node_modules/playwright');
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path');
const ROOT = path.resolve(__dirname, '..'); const OUT = path.join(ROOT, 'references', 'review'); fs.mkdirSync(OUT, { recursive: true });
const PORT = 40577;
(async () => {
  const server = spawn('python3', [path.join(ROOT, 'scripts/serve.py'), '--port', String(PORT)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 900));
  const browser = await chromium.launch(); const report = { pages: [], captured: new Date().toISOString() }; let failures = 0;
  const pages = ['index.html', 'system.html', 'layout-recipes.html', 'design-system/examples/starter.html'];
  const viewports = [[1440, 1000], [768, 1000], [390, 844]];
  for (const file of pages) for (const [w, h] of viewports) {
    const page = await browser.newPage({ viewport: { width: w, height: h } }); const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); }); page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 160)));
    page.on('requestfailed', r => { if (!/fonts\.g|gstatic/.test(r.url())) errors.push('requestfailed: ' + r.url().slice(0, 120)); });
    await page.goto(`http://127.0.0.1:${PORT}/${file}`, { waitUntil: 'load' }); await page.waitForTimeout(700);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const name = file.replace(/[\/.]/g, '-') + `-${w}`;
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: w === 1440 });
    const entry = { file, viewport: w, errors, horizontalOverflow: overflow, checks: {} };
    if (/system|starter/.test(file) && w === 1440) {
      try {
        await page.click('#tab-settings'); entry.checks.tabSettingsVisible = await page.isVisible('#panel-settings');
        await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter'); entry.checks.tabKeyboardToCode = await page.isVisible('#panel-code');
        await page.click('#tab-components'); await page.click('[data-tcs-dialog-open="example-dialog"]'); await page.waitForTimeout(200); entry.checks.dialogOpen = await page.evaluate(() => document.querySelector('#example-dialog').open);
        await page.keyboard.press('Escape'); await page.waitForTimeout(200); entry.checks.dialogEscapeCloses = await page.evaluate(() => !document.querySelector('#example-dialog').open);
        await page.click('#theme-toggle'); entry.checks.darkTheme = await page.evaluate(() => document.body.dataset.tcsTheme === 'dark');
        await page.screenshot({ path: path.join(OUT, name + '-dark.png'), fullPage: false }); await page.click('#theme-toggle');
        await page.click('#tab-settings'); await page.click('#settings-form button[type="submit"]'); await page.waitForTimeout(100); entry.checks.formValidationShown = await page.evaluate(() => !document.querySelector('#project-name-error').hidden);
        await page.fill('#project-name', 'the bold coach'); await page.fill('#project-email', 'hello@example.com'); await page.click('#settings-form button[type="submit"]'); await page.waitForTimeout(100); entry.checks.formSuccessShown = await page.evaluate(() => !document.querySelector('#settings-result').hidden);
      } catch (e) { entry.checks.error = e.message.slice(0, 160); }
    }
    if (file === 'index.html' && w === 1440) {
      try {
        entry.checks.motionCards = await page.locator('.motion-card').count();
        entry.checks.colorSwatches = await page.locator('.swatch').count();
        await page.click('#motion-toggle'); entry.checks.reducedMotionClass = await page.evaluate(() => document.documentElement.classList.contains('reduce-motion'));
        await page.click('.swatch'); await page.waitForTimeout(200); entry.checks.swatchCopyToast = await page.evaluate(() => (document.querySelector('.as-toast') || {}).textContent || '');
      } catch (e) { entry.checks.error = e.message.slice(0, 160); }
    }
    if (w === 390) {
      try { await page.click('.as-mobile-nav-button'); await page.waitForTimeout(300); entry.checks.mobileNavOpens = await page.evaluate(() => document.querySelector('.as-sidebar').classList.contains('is-open')); await page.screenshot({ path: path.join(OUT, name + '-nav.png') }); } catch (e) { entry.checks.mobileNav = 'n/a'; }
    }
    if (errors.length || overflow > 0 || Object.values(entry.checks).some(v => v === false)) failures += 1;
    report.pages.push(entry); await page.close();
  }
  await browser.close(); server.kill();
  fs.writeFileSync(path.join(OUT, 'verify-catalog.json'), JSON.stringify(report, null, 2));
  for (const p of report.pages) console.log(p.file, p.viewport, 'errors', p.errors.length, 'overflow', p.horizontalOverflow, JSON.stringify(p.checks));
  console.log(failures ? `FAILURES: ${failures}` : 'ALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
