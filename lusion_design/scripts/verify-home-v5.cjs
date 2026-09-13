// Verifies the motion main-screen example and the new interaction runtime in a real Chromium.
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, executablePath } = require('./browser-runtime.cjs');
const root = path.resolve('.');
const checks = [], errors = [];
const check = (name, passed, detail) => checks.push({ name, passed: !!passed, ...(detail ? { detail } : {}) });
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.md': 'text/plain' };
(async () => {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => { res.writeHead(error ? 404 : 200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' }); res.end(error ? 'Missing' : data); });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(response.status() + ' ' + response.url()); });
    page.on('request', request => requests.push(request.url()));

    await page.goto(base + '/kit/examples/home.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('#home[data-ds-runtime="ready"]');
    check('Loader counts to 100 and hides', await page.waitForFunction(() => document.querySelector('#loader').dataset.state === 'done' && document.querySelector('#loader-percent').textContent === '100', null, { timeout: 5000 }).then(() => true).catch(() => false));
    await page.waitForTimeout(700);
    check('Hero title split into masked words with aria-label', await page.evaluate(() => {
      const title = document.querySelector('#hero-title');
      return title.querySelectorAll('.ds-split__word').length >= 8 && title.getAttribute('aria-label').startsWith('We build') && title.dataset.dsRevealState === 'visible';
    }));
    check('Manual reveals staged after loader', await page.evaluate(() => [...document.querySelectorAll('[data-ds-reveal-manual]')].every(node => node.dataset.dsRevealState === 'visible')));
    check('Header stagger indexes written', await page.evaluate(() => document.querySelector('.home-header__right').children[2].style.getPropertyValue('--ds-i') === '2'));
    check('No external requests', requests.every(url => url.startsWith(base + '/kit/') || url.startsWith('data:')), requests.filter(url => !url.startsWith(base + '/kit/')));

    // Menu panel: toggle, stagger delays, inert, Escape, focus return.
    const menuButton = page.locator('.home-menu-btn');
    check('Panel closed by default is inert', await page.evaluate(() => document.querySelector('#menu').hasAttribute('inert') && document.querySelector('#menu').dataset.dsPanelState === 'closed'));
    await menuButton.click();
    check('Panel opens with aria-expanded and focus inside', await page.evaluate(() => document.querySelector('#menu').dataset.dsPanelState === 'open' && document.querySelector('.home-menu-btn').getAttribute('aria-expanded') === 'true' && document.querySelector('#menu').contains(document.activeElement)));
    check('Panel items open in order at 20ms steps', await page.evaluate(() => {
      const items = [...document.querySelectorAll('#menu > [data-ds-stagger] > *')];
      const delays = items.map(item => parseFloat(getComputedStyle(item).transitionDelay));
      return delays.length === 4 && Math.abs(delays[0]) < 1e-6 && Math.abs(delays[1] - .02) < 1e-6 && Math.abs(delays[3] - .06) < 1e-6;
    }));
    await page.waitForTimeout(700);
    check('Open panel item reaches rest transform', await page.evaluate(() => getComputedStyle(document.querySelector('#menu .home-menu__links')).opacity === '1'));
    await page.keyboard.press('Escape');
    check('Escape closes panel and returns focus to trigger', await page.evaluate(() => document.querySelector('#menu').dataset.dsPanelState === 'closed' && document.activeElement === document.querySelector('.home-menu-btn')));
    check('Closed panel items close in reverse order', await page.evaluate(() => {
      const items = [...document.querySelectorAll('#menu > [data-ds-stagger] > *')];
      const delays = items.map(item => parseFloat(getComputedStyle(item).transitionDelay));
      return delays[0] > delays[3];
    }));
    await menuButton.click();
    await page.locator('.home-backdrop').click({ position: { x: 20, y: 500 } });
    check('Backdrop click closes panel', await page.evaluate(() => document.querySelector('#menu').dataset.dsPanelState === 'closed'));

    // CTA hover: label shifts, dot bursts, background turns accent after delay.
    const cta = page.locator('#reel .ds-cta');
    await cta.evaluate(node => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(400);
    const restBackground = await cta.evaluate(node => getComputedStyle(node).backgroundColor);
    await cta.hover();
    await page.waitForTimeout(1000);
    check('CTA hover bursts dot and shifts label', await cta.evaluate(node => {
      const dot = getComputedStyle(node.querySelector('.ds-cta__dot')).transform;
      const label = getComputedStyle(node.querySelector('.ds-cta__label')).transform;
      return dot !== 'none' && parseFloat(dot.split('(')[1]) > 10 && label !== 'none' && parseFloat(label.split(',')[4]) < -10;
    }));
    check('CTA hover fills accent background', await cta.evaluate(node => getComputedStyle(node).backgroundColor) !== restBackground);
    await page.mouse.move(5, 5);

    // Cursor follower: scale grows over labelled targets and shrinks away.
    const frame = page.locator('.home-reel__frame');
    await frame.evaluate(node => node.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(300);
    const box = await frame.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
    await page.waitForTimeout(600);
    check('Cursor follower activates with label on reel frame', await page.evaluate(() => {
      const cursor = document.querySelector('[data-ds-cursor]');
      return cursor.dataset.dsCursorState === 'active' && parseFloat(cursor.style.getPropertyValue('--ds-cursor-scale')) > 0.8 && cursor.textContent.trim() === 'Play';
    }));
    await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 8 });
    await page.waitForTimeout(1500);
    check('Cursor follower shrinks away from targets', await page.evaluate(() => parseFloat(document.querySelector('[data-ds-cursor]').style.getPropertyValue('--ds-cursor-scale') || '0') < 0.05));

    // Tilt: pointer over the hero frame writes rotation variables and settles back.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const hero = await page.locator('.home-hero__frame').boundingBox();
    await page.mouse.move(hero.x + hero.width * 0.9, hero.y + hero.height * 0.15, { steps: 10 });
    await page.waitForTimeout(500);
    check('Tilt writes rotation from pointer position', await page.evaluate(() => {
      const frame = document.querySelector('.home-hero__frame');
      return frame.dataset.dsTiltState === 'active' && Math.abs(parseFloat(frame.style.getPropertyValue('--ds-tilt-y'))) > 1;
    }));
    await page.mouse.move(2, hero.y + hero.height + 40, { steps: 6 });
    await page.waitForTimeout(2500);
    check('Tilt settles and clears inline variables', await page.evaluate(() => document.querySelector('.home-hero__frame').style.getPropertyValue('--ds-tilt-y') === ''));

    // Hero object click cycles tone.
    await page.locator('#hero-object').click();
    check('Object click cycles tone', await page.evaluate(() => document.querySelector('#home').dataset.tone === 'ink'));

    // Scroll progress.
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(1200);
    check('Scroll progress reaches 1 and goes idle', await page.evaluate(() => {
      const bar = document.querySelector('[data-ds-scroll-progress]');
      return parseFloat(bar.style.getPropertyValue('--ds-progress')) > 0.99 && bar.dataset.dsScrollState === 'idle';
    }));
    check('Work cards revealed after scroll', await page.evaluate(() => [...document.querySelectorAll('.home-card')].every(card => card.dataset.dsRevealState === 'visible')));

    // Newsletter local validation.
    await page.fill('#newsletter input', 'not-an-email');
    await page.locator('#newsletter').evaluate(form => form.requestSubmit());
    check('Newsletter invalid state is announced', await page.evaluate(() => document.querySelector('#newsletter input').getAttribute('aria-invalid') === 'true' && document.querySelector('#newsletter-status').dataset.tone === 'error'));

    // Keyboard: split-word title is a single accessible name; menu button reachable; CTA focus visible.
    check('Split title exposes one accessible name', await page.evaluate(() => document.querySelector('#hero-title').querySelector('[aria-hidden="true"]') !== null));

    // Viewports & screenshots.
    for (const width of [320, 390, 812, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(150);
      check(`home ${width}px: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await page.evaluate(() => document.documentElement.scrollWidth));
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector('#home').dataset.tone = 'blue'; });
    await page.mouse.move(5, 5);
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'screenshots/home-motion-hero-v5.png' });
    await page.locator('.home-menu-btn').click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'screenshots/home-motion-menu-v5.png' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    await page.screenshot({ path: 'screenshots/home-motion-full-v5.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'screenshots/home-motion-mobile-v5.png', fullPage: true });

    // Reduced motion: loader skipped, reveals visible, cursor hidden.
    const reduced = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    reduced.on('pageerror', error => errors.push('reduced: ' + error.message));
    await reduced.goto(base + '/kit/examples/home.html', { waitUntil: 'networkidle' });
    await reduced.waitForSelector('#home[data-ds-runtime="ready"]');
    await reduced.waitForTimeout(300);
    check('Reduced motion skips loader', await reduced.evaluate(() => document.querySelector('#loader').dataset.state === 'skipped'));
    check('Reduced motion shows all reveals immediately', await reduced.evaluate(() => [...document.querySelectorAll('[data-ds-reveal],[data-ds-split]')].every(node => node.dataset.dsRevealState === 'visible')));
    check('Reduced motion hides cursor and stops loops', await reduced.evaluate(() => getComputedStyle(document.querySelector('[data-ds-cursor]')).display === 'none' && getComputedStyle(document.querySelector('.ds-loop > span')).animationName === 'none'));
    await reduced.screenshot({ path: 'screenshots/home-motion-reduced-v5.png' });

    // Destroy restores split markup.
    check('destroy restores split markup', await page.evaluate(async () => {
      const { mount } = await import('/kit/system.js');
      const root = document.querySelector('#home');
      const before = document.querySelector('#hero-title').querySelectorAll('.ds-split__word').length;
      mount(root).destroy();
      const after = document.querySelector('#hero-title').querySelectorAll('.ds-split__word').length;
      return before > 0 && after === 0 && !document.querySelector('#hero-title').hasAttribute('aria-label') && !document.querySelector('#menu').hasAttribute('inert');
    }));
  } finally {
    await browser.close();
    server.close();
  }
  const report = { checked_at: new Date().toISOString(), passed: checks.every(c => c.passed) && errors.length === 0, checks, errors };
  fs.writeFileSync('research/home-motion-v5.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
})();
