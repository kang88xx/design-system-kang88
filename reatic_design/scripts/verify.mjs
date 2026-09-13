// Browser verification of the studio, reconstruction pages and document template.
// Starts the static server itself. Writes evidence/verification.json and evidence/local/*.png.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { launchBrowser } from './browser-runtime.mjs';
import { createServer } from './serve.mjs';

const root = path.resolve('.');
const server = createServer(root).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const errors = []; const failures = []; const checks = []; const results = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) failures.push({ url: r.url().replace(base, ''), status: r.status() }); });
await fs.mkdir('evidence/local', { recursive: true });
const check = (name, value) => { results.push({ name, ok: !!value }); assert.ok(value, name); checks.push(name); };
const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

// ---- studio ----
await page.goto(`${base}/app/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: 'evidence/local/studio-desktop.png', fullPage: true });
check('Studio heading', await page.getByRole('heading', { name: /무에서 유를/ }).first().isVisible());
await page.getByRole('button', { name: 'Copy #eea302' }).click();
check('Token copy', (await page.evaluate(() => navigator.clipboard.readText())) === '#eea302');
const dl = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export tokens.css' }).click();
check('Token export', (await dl).suggestedFilename() === 'reatic-tokens.css');
await page.getByRole('button', { name: 'Dark theme' }).click();
check('Dark theme toggle', (await page.evaluate(() => document.documentElement.getAttribute('data-rt-theme'))) === 'dark');
await page.getByRole('button', { name: 'Light theme' }).click();
for (const width of [1440, 768, 390, 320]) {
  await page.setViewportSize({ width, height: width > 800 ? 1000 : 844 });
  for (const route of ['overview', 'identity', 'colors', 'typography', 'layout', 'components', 'motion', 'document', 'sources']) {
    await page.goto(`${base}/app/#${route}`); await page.waitForTimeout(150);
    check(`No overflow ${route} at ${width}`, !(await overflow()));
    if (width === 390 || width === 1440) await page.screenshot({ path: `evidence/local/${route}-${width}.png` });
  }
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto(`${base}/app/#motion`); await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Replay foldIn stagger' }).click();
check('Motion replay runs', await page.locator('[data-motion-demo="fold"] .box').first().evaluate(el => el.getAnimations().some(a => a.playState === 'running' || a.playState === 'finished')));
await page.getByRole('checkbox', { name: 'Reduce motion' }).check();
check('Reduced motion preview', await page.locator('[data-motion-demo="fold"] .box').first().evaluate(el => el.getAnimations().length === 0 || el.getAnimations().every(a => a.effect.getTiming().duration === 0)));
await page.getByRole('checkbox', { name: 'Reduce motion' }).uncheck();
await page.goto(`${base}/app/#components`); await page.waitForTimeout(200);
const cta = page.locator('.rt-button--cta').first();
await cta.hover(); await page.waitForTimeout(350);
check('CTA hover turns light', (await cta.evaluate(el => getComputedStyle(el).backgroundColor)) === 'rgb(243, 243, 243)');
const nav = page.locator('.rt-nav__link[aria-current="page"]').first();
check('Nav selected is #ff4040', (await nav.evaluate(el => getComputedStyle(el).color)) === 'rgb(255, 64, 64)');
await page.locator('.rt-field--underline .rt-field__input').first().focus();
check('Underline field focus line', (await page.locator('.rt-field--underline .rt-field__input').first().evaluate(el => getComputedStyle(el).boxShadow)).includes('rgb(243, 243, 243)'));
await page.getByRole('button', { name: 'Disabled', exact: true }).click();
check('Disabled button state', await page.locator('#demo-submit').isDisabled());
await page.getByRole('button', { name: 'Loading', exact: true }).click();
check('Loading button state', (await page.locator('#demo-submit').getAttribute('data-loading')) === 'true');
await page.getByRole('button', { name: 'Reset', exact: true }).click();

// ---- reconstruction pages ----
for (const p of ['home', 'about', 'portfolio', 'contact']) {
  await page.goto(`${base}/app/public/reconstruction/${p}.html`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 800) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(80); }
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); }); await page.waitForTimeout(400);
  check(`Reconstruction ${p} no overflow 1440`, !(await overflow()));
  const broken = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src).length);
  check(`Reconstruction ${p} no broken images`, broken === 0);
  const videos = await page.evaluate(() => [...document.querySelectorAll('video')].map(v => v.readyState));
  if (videos.length) check(`Reconstruction ${p} videos ready`, videos.every(r => r >= 2));
  check(`Reconstruction ${p} entrances ran`, await page.evaluate(() => [...document.querySelectorAll('[data-rt-enter]')].some(el => el.classList.contains('is-in'))));
  await page.screenshot({ path: `evidence/local/reconstruction-${p}-1440.png` });
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
  check(`Reconstruction ${p} no overflow 390`, !(await overflow()));
  await page.screenshot({ path: `evidence/local/reconstruction-${p}-390.png` });
  await page.setViewportSize({ width: 1440, height: 1000 });
}
await page.goto(`${base}/app/public/reconstruction/contact.html`, { waitUntil: 'load' }); await page.waitForTimeout(800);
await page.locator('#submit').scrollIntoViewIfNeeded(); await page.locator('#submit').click(); await page.waitForTimeout(200);
check('Contact validation blocks empty submit', (await page.locator('#status').textContent()).includes('누락'));
await page.fill('#company', '테스트'); await page.selectOption('#usage', '광고'); await page.fill('#email', 'a@b.co');
await page.locator('#submit').click(); await page.waitForTimeout(1300);
check('Contact submit success state', (await page.locator('#status').textContent()).includes('접수'));

// ---- document template ----
await page.goto(`${base}/templates/reatic-document.html`, { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
check('Document template renders', await page.getByRole('heading', { level: 1 }).first().isVisible());
check('Document template no overflow 1440', !(await overflow()));
await page.screenshot({ path: 'evidence/local/document-template-1440.png', fullPage: true });
await page.emulateMedia({ media: 'print' });
check('Document template print stylesheet hides chrome', await page.locator('.doc-toolbar').evaluate(el => getComputedStyle(el).display === 'none'));
await page.pdf({ path: 'evidence/local/document-template.pdf', format: 'A4', printBackground: true });
await page.emulateMedia({ media: 'screen' });
await page.setViewportSize({ width: 390, height: 844 });
check('Document template no overflow 390', !(await overflow()));
await page.screenshot({ path: 'evidence/local/document-template-390.png', fullPage: true });

check('No page errors', errors.length === 0);
check('No missing local resources', failures.length === 0);
await fs.writeFile('evidence/verification.json', JSON.stringify({ generated: new Date().toISOString(), checks, results, errors, failures, passed: true }, null, 2));
console.log(JSON.stringify({ passed: checks.length, errors, failures }, null, 2));
await browser.close(); server.close();
