const fs = require('fs');
const { chromium, executablePath } = require('./browser-runtime.cjs');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  const checks = [], errors = [], badResponses = [];
  const check = (name, passed, details) => checks.push({ name, passed: !!passed, ...(details ? { details } : {}) });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) badResponses.push({ url: response.url(), status: response.status() }); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const files = ['index.html', 'components.html', 'motion-lab.html', 'video-analysis.html', 'source-explorer.html', 'reconstruction.html', 'project-kit.html'];
  try {
    for (const file of files) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto('http://127.0.0.1:4187/' + file, { waitUntil: 'networkidle' });
      check(file + ': source explorer reachable', await page.locator('a[href="source-explorer.html"]').count() > 0);
      check(file + ': no broken initial images', await page.locator('img').evaluateAll(images => images.every(image => !image.complete || image.naturalWidth > 0)));
      for (const width of [320, 390, 812, 1000, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const overflow = await page.evaluate(() => {
          if (document.documentElement.scrollWidth <= innerWidth + 1) return [];
          return [...document.querySelectorAll('body *')].filter(node => {
            const box = node.getBoundingClientRect();
            return box.width && box.right > innerWidth + 1 && getComputedStyle(node).position !== 'fixed';
          }).slice(0, 12).map(node => node.tagName + (node.id ? '#' + node.id : '') + '.' + String(node.className).slice(0, 100));
        });
        check(file + ': no horizontal overflow at ' + width, overflow.length === 0, overflow.length ? overflow : undefined);
        if ([390, 1440].includes(width)) await page.screenshot({ path: 'screenshots/workspace-' + file.replace('.html', '') + '-' + width + '-v4.png' });
      }
    }
    check('No JavaScript exceptions across all seven screens', errors.length === 0);
    check('No failed HTTP responses across all seven screens', badResponses.length === 0);
  } finally {
    await browser.close();
    const report = { checked_at: new Date().toISOString(), checks, errors, badResponses, passed: checks.every(check => check.passed) && !errors.length && !badResponses.length };
    fs.writeFileSync('research/workspace-browser-v4.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
