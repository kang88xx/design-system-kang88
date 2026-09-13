// Serve the repo statically, open the viewer, click every tab, screenshot, and report console errors.
import { launchBrowser } from './browser-runtime.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'captures/viewer'); await mkdir(OUT, { recursive: true });
const MIME = { html: 'text/html', js: 'text/javascript', css: 'text/css', png: 'image/png', svg: 'image/svg+xml', json: 'application/json', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4' };
const server = createServer(async (req, res) => { try { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); const body = await readFile(p); res.writeHead(200, { 'content-type': MIME[p.split('.').pop()] || 'application/octet-stream' }); res.end(body); } catch { res.writeHead(404); res.end(); } });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const port = server.address().port;
const browser = await launchBrowser(); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message)); page.on('requestfailed', r => errors.push('reqfail: ' + r.url().slice(-120)));
page.on('response', r => { if (r.status() === 404) errors.push('404: ' + r.url().slice(-160)); });
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
await page.goto(`http://127.0.0.1:${port}/viewer/index.html`, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1500);
const tabs = await page.$$eval('#tabs button', bs => bs.map(b => b.dataset.k));
if (!tabs.length) { console.log(JSON.stringify({ fatal: 'no tabs rendered', errors })); await browser.close(); server.close(); process.exit(1); }
const report = [];
for (const k of tabs) {
  await page.click(`#tabs button[data-k="${k}"]`); await page.waitForTimeout(900);
  const info = await page.evaluate((k) => { const s = document.querySelector('#v-' + k); return { chars: s.innerHTML.length, videos: s.querySelectorAll('video').length, playing: [...s.querySelectorAll('video')].filter(v => v.readyState >= 2 && !v.paused).length, imgs: s.querySelectorAll('img').length, cards: s.querySelectorAll('.card').length, h3: s.querySelectorAll('h3').length, text: s.innerText.slice(0, 120).replace(/\s+/g, ' ') }; }, k);
  await page.screenshot({ path: path.join(OUT, `tab-${k}.png`), fullPage: false });
  report.push({ tab: k, ...info });
}
// font check
const font = await page.evaluate(async () => { await document.fonts.ready; return { sohne: document.fonts.check('16px sohne-var'), loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).slice(0, 6) }; });
// interaction: search boxes
await page.click('#tabs button[data-k="boxes"]'); await page.fill('#boxq', 'card'); await page.waitForTimeout(300);
const boxCount = await page.textContent('#boxcount');
await browser.close(); server.close();
console.log(JSON.stringify({ tabs: report, font, boxSearch: boxCount, errors: errors.slice(0, 10) }, null, 1));
