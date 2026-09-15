/* Third probe: dashed borders/outlines, nav card hover expansion, ticker animation, hero letter art, appear animations. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || require('os').homedir() + '/.claude/skills/gstack/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, '..', 'references');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('https://three-circles-wbs.framer.website/', { waitUntil: 'load' }); await page.waitForTimeout(2000);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(150); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  const borders = await page.evaluate(() => { const out = new Map(); for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (r.width < 20) continue; const b = cs.borderTopStyle !== 'none' && cs.borderTopWidth !== '0px' ? `border ${cs.borderTop}` : (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px' ? `outline ${cs.outline}` : null); if (!b) continue; const k = b + '|' + cs.borderRadius; out.set(k, (out.get(k) || 0) + 1); } return Array.from(out.entries()); });
  const navHover = [];
  for (const label of ['Projects', 'About', 'Services', 'Contact']) {
    const loc = page.locator(`nav a:has-text("${label}")`).first();
    const before = await loc.evaluate(el => { const r = el.getBoundingClientRect(); return { h: Math.round(r.height), bg: getComputedStyle(el).backgroundColor, names: Array.from(el.querySelectorAll('[data-framer-name]')).map(e => e.getAttribute('data-framer-name') + ':' + Math.round(e.getBoundingClientRect().height) + ':' + getComputedStyle(e).opacity) }; });
    await loc.hover(); await page.waitForTimeout(900);
    const after = await loc.evaluate(el => { const r = el.getBoundingClientRect(); return { h: Math.round(r.height), bg: getComputedStyle(el).backgroundColor, names: Array.from(el.querySelectorAll('[data-framer-name]')).map(e => e.getAttribute('data-framer-name') + ':' + Math.round(e.getBoundingClientRect().height) + ':' + getComputedStyle(e).opacity) }; });
    await page.screenshot({ path: path.join(OUT, `hover-nav-${label.toLowerCase()}.png`), clip: { x: 0, y: 60, width: 400, height: 500 } });
    navHover.push({ label, before, after });
    await page.mouse.move(800, 500); await page.waitForTimeout(600);
  }
  const ticker = await page.evaluate(() => { const t = document.querySelector('[data-framer-name="Client Ticker"]'); if (!t) return null; const anims = t.getAnimations({ subtree: true }).map(a => { const tm = a.effect.getTiming(); return { duration: tm.duration, iterations: tm.iterations, easing: tm.easing.slice(0, 40), keyframes: (a.effect.getKeyframes ? a.effect.getKeyframes().map(k => k.transform || JSON.stringify(k).slice(0, 80)) : []) }; }); const r = t.getBoundingClientRect(); return { h: r.height, bg: getComputedStyle(t).backgroundColor, anims: anims.slice(0, 4), childCount: t.children.length, styleAttr: t.getAttribute('style'), mask: getComputedStyle(t).maskImage || getComputedStyle(t).webkitMaskImage }; });
  const hero = await page.evaluate(() => { const h1 = document.querySelector('#hero h1'); const sec = document.querySelector('#hero'); const words = Array.from(sec.querySelectorAll('h1, h2, h3, [data-framer-name*="Circle" i], [data-framer-name*="Letter" i], img')).slice(0, 30).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { tag: e.tagName, name: e.getAttribute('data-framer-name'), text: (e.textContent || '').trim().slice(0, 20), src: e.currentSrc ? e.currentSrc.slice(0, 90) : '', x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height), size: cs.fontSize, radius: cs.borderRadius, anims: e.getAnimations({ subtree: true }).length }; }); return { h1: h1 && { text: h1.textContent, size: getComputedStyle(h1).fontSize, lh: getComputedStyle(h1).lineHeight, weight: getComputedStyle(h1).fontWeight }, items: words }; });
  // Reload for appear animation capture
  const appearFrames = [];
  await page.goto('https://three-circles-wbs.framer.website/', { waitUntil: 'commit' });
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(i === 0 ? 50 : 150); appearFrames.push(await page.evaluate(() => { const el = document.querySelector('#hero'); if (!el) return null; const items = Array.from(el.querySelectorAll('[data-framer-appear-id]')).slice(0, 6).map(e => ({ id: e.getAttribute('data-framer-appear-id'), opacity: getComputedStyle(e).opacity, transform: getComputedStyle(e).transform })); return { t: performance.now(), items }; })); }
  const appearIds = await page.evaluate(() => Array.from(document.querySelectorAll('[data-framer-appear-id]')).map(e => ({ id: e.getAttribute('data-framer-appear-id'), name: e.getAttribute('data-framer-name'), text: e.textContent.trim().slice(0, 30) })).slice(0, 40));
  const appearData = await page.evaluate(() => { const s = document.getElementById('__framer__appearAnimationsContent'); return s ? JSON.parse(s.textContent) : null; });
  fs.writeFileSync(path.join(OUT, 'live-details.json'), JSON.stringify({ borders, navHover, ticker, hero, appearFrames, appearIds, appearData, captured: new Date().toISOString() }, null, 2));
  await browser.close();
  console.log(JSON.stringify({ borders, ticker: ticker && { h: ticker.h, anims: ticker.anims, childCount: ticker.childCount, mask: ticker.mask }, navHover: navHover.map(n => [n.label, n.before.h, n.after.h, n.after.names.slice(0, 6)]), hero: hero.h1, heroItems: hero.items.slice(0, 12), appearIds: appearIds.length, appearData }, null, 1).slice(0, 6000));
})().catch(e => { console.error(e); process.exit(1); });
