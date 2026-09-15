/* Effects audit: timed nav-card hover, ticker speed, broad hover sweep, scroll-linked transforms, mobile menu, inline SVG, custom cursor, all animations. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || require('os').homedir() + '/.claude/skills/gstack/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, '..', 'references'); const URL = 'https://three-circles-wbs.framer.website/';
const SNAP = `(el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, opacity: cs.opacity, filter: cs.filter, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), radius: cs.borderRadius, border: cs.borderTop, shadow: cs.boxShadow, scale: cs.scale, rotate: cs.rotate, translate: cs.translate, textDecoration: cs.textDecorationLine, transition: cs.transition } }`;
function treeSnap(loc, limit = 40) { return loc.evaluate((el, limit) => { const snap = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, opacity: cs.opacity, filter: cs.filter, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), radius: cs.borderRadius, shadow: cs.boxShadow, textDecoration: cs.textDecorationLine } }; return [el, ...el.querySelectorAll('*')].slice(0, limit).map(e => ({ name: e.getAttribute('data-framer-name') || e.tagName.toLowerCase(), cls: (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className || '').toString().slice(0, 30), cs: snap(e) })); }, limit); }
function diff(a, b) { const out = []; a.forEach((x, i) => { const y = b[i]; if (!y) return; const d = {}; for (const k of Object.keys(x.cs)) if (String(x.cs[k]) !== String(y.cs[k])) d[k] = [x.cs[k], y.cs[k]]; if (Object.keys(d).length) out.push({ node: x.name, changes: d }); }); return out; }
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  const report = { captured: new Date().toISOString() };
  // 1. nav card hover, real pointer movement, sampled
  report.navCard = [];
  for (const label of ['Projects', 'About', 'Services', 'Contact']) {
    const loc = page.locator(`nav a:has-text("${label}")`).first(); const box = await loc.boundingBox();
    await page.mouse.move(box.x - 60, box.y + box.height / 2); await page.waitForTimeout(200);
    const samples = []; const t0 = Date.now();
    await page.mouse.move(box.x + 40, box.y + box.height / 2, { steps: 8 });
    for (let i = 0; i < 26; i++) { const s = await loc.evaluate(el => { const r = el.getBoundingClientRect(); const bottom = el.querySelector('[data-framer-name="Bottom"]'); return { h: Math.round(r.height), bottomOpacity: bottom ? getComputedStyle(bottom).opacity : null, bottomH: bottom ? Math.round(bottom.getBoundingClientRect().height) : null, bg: getComputedStyle(el).backgroundColor }; }); samples.push({ t: Date.now() - t0, ...s }); await page.waitForTimeout(50); }
    await page.screenshot({ path: path.join(OUT, `hover-nav-${label.toLowerCase()}.png`), clip: { x: 0, y: 0, width: 400, height: 640 } });
    const inner = await treeSnap(loc, 60);
    await page.mouse.move(800, 500); await page.waitForTimeout(900);
    const rest = await treeSnap(loc, 60);
    report.navCard.push({ label, samples, hoverDiff: diff(rest, inner) });
  }
  // 2. ticker speed
  await page.locator('[data-framer-name="Client Ticker"]').first().scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  const tick = []; for (let i = 0; i < 12; i++) { tick.push(await page.evaluate(() => { const t = document.querySelector('[data-framer-name="Client Ticker"]'); const img = t.querySelector('img'); const r = img.getBoundingClientRect(); const mover = img.closest('[style*="transform"]') || img.parentElement; return { t: performance.now(), x: r.x, transform: getComputedStyle(mover).transform, count: t.querySelectorAll('img').length, w: t.getBoundingClientRect().width, mask: getComputedStyle(t).maskImage, childStyle: (t.firstElementChild.getAttribute('style') || '').slice(0, 200) }; })); await page.waitForTimeout(200); }
  report.ticker = { samples: tick, pxPerSec: (tick[0].x - tick[tick.length - 1].x) / ((tick[tick.length - 1].t - tick[0].t) / 1000) };
  // 3. broad hover sweep
  const targets = [
    ['featured-project', 'a[href*="the-bold-coach"]'], ['project-row', 'a[href*="art-by-liora"]'], ['view-all-projects', 'a:has-text("View all projects")'],
    ['about-card', '#about-section [data-framer-name="Wrap"]'], ['founder-image', '#about-section img[alt="Founder Image"]'],
    ['service-card', '#service-section a:has-text("Brand strategy")'], ['service-card-2', '#service-section :text("Brand guidelines")'], ['service-cta', '#service-section a:has-text("Let’s talk")'],
    ['award-row', '#award-section :text("Brand impact awards")'], ['client-ticker', '[data-framer-name="Client Ticker"]'],
    ['stat-card', ':text("Industries served worldwide")'], ['testimonial-card', '#testimonial-section :text("Maya lin")'], ['rating-card', ':text("Trusted by clients")'],
    ['blog-card', 'a[href*="brand-needs-a-story"], #blog-section a'], ['view-all-blogs', 'a:has-text("View all blogs")'],
    ['contact-submit', 'button:has-text("Send a message")'], ['footer-cta', 'footer a:has-text("Book a call")'], ['footer-email', 'footer a:has-text("hello@")'], ['footer-social', 'footer a[href*="instagram"]'], ['footer-input-arrow', 'footer input'],
    ['sidebar-social', 'nav a[href*="instagram"]'], ['sidebar-cta', 'nav a:has-text("Book a 30-Min Call")'], ['sidebar-logo', 'nav a[href="./"]'],
    ['hero-status', '#hero :text("Available for the project")'], ['hero-est', '#hero :text("Est.2015")'], ['hero-cta', '#hero a:has-text("get started now")'], ['hero-circle-image', '#hero img'], ['hero-since', '#hero :text("Since")'],
    ['webestica-link', 'a:has-text("Webestica")'],
  ];
  report.hover = [];
  for (const [label, sel] of targets) {
    try {
      const loc = page.locator(sel).first(); await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
      const box = await loc.boundingBox(); await page.mouse.move(Math.max(0, box.x - 80), box.y + box.height / 2); await page.waitForTimeout(400);
      const rest = await treeSnap(loc, 50);
      await page.mouse.move(box.x + Math.min(40, box.width / 2), box.y + Math.min(30, box.height / 2), { steps: 6 }); await page.waitForTimeout(900);
      const hov = await treeSnap(loc, 50); const d = diff(rest, hov);
      const cursor = await loc.evaluate(el => getComputedStyle(el).cursor);
      if (d.length) await page.screenshot({ path: path.join(OUT, `hover-${label}.png`), clip: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10), width: Math.min(1400, box.width + 20), height: Math.min(700, box.height + 20) } });
      report.hover.push({ label, sel, cursor, box: { w: Math.round(box.width), h: Math.round(box.height) }, diffs: d });
    } catch (e) { report.hover.push({ label, sel, error: e.message.slice(0, 120) }); }
  }
  await page.mouse.move(5, 5);
  // 4. scroll-linked transforms: named elements sampled at several scroll positions
  const names = ['BG Decoration', 'Founder Image', 'Vector', 'BG Image', 'Project Image', 'Project CTA Image', 'Title', 'Two', 'Info', 'BG', 'Client Ticker', 'Content Left', 'Content Right', 'Envelope', 'Shape'];
  report.scroll = [];
  for (const y of [0, 400, 900, 1800, 2400, 3000, 4900, 5800, 6400, 7500]) {
    await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(350);
    report.scroll.push({ y, items: await page.evaluate((names) => Array.from(document.querySelectorAll('[data-framer-name]')).filter(el => names.includes(el.getAttribute('data-framer-name'))).slice(0, 40).map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { name: el.getAttribute('data-framer-name'), top: Math.round(r.top), transform: cs.transform, opacity: cs.opacity, filter: cs.filter }; }), names) });
  }
  // 5. running animations with targets
  report.animations = await page.evaluate(() => document.getAnimations().slice(0, 30).map(a => { const t = a.effect && a.effect.target; const tm = a.effect.getTiming(); let kf = []; try { kf = a.effect.getKeyframes().map(k => Object.keys(k).filter(x => !['offset', 'computedOffset', 'easing', 'composite'].includes(x)).map(x => x + ':' + String(k[x]).slice(0, 40)).join(' ')); } catch (e) {} return { target: t && (t.getAttribute('data-framer-name') || t.tagName + '.' + (t.className || '').toString().slice(0, 20)), duration: tm.duration, iterations: tm.iterations, delay: tm.delay, easing: tm.easing.slice(0, 30), playState: a.playState, keyframes: kf.slice(0, 4) }; }));
  // 6. inline SVGs + custom cursor + all image urls
  report.inlineSvg = await page.evaluate(() => Array.from(document.querySelectorAll('svg')).slice(0, 60).map(s => { const r = s.getBoundingClientRect(); const p = s.closest('[data-framer-name]'); return { name: p && p.getAttribute('data-framer-name'), w: Math.round(r.width), h: Math.round(r.height), viewBox: s.getAttribute('viewBox'), html: s.outerHTML.slice(0, 1200) }; }));
  report.cursorElements = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => { const cs = getComputedStyle(el); return cs.position === 'fixed' && cs.pointerEvents === 'none'; }).slice(0, 10).map(el => ({ name: el.getAttribute('data-framer-name'), cls: (el.className || '').toString().slice(0, 40), w: el.getBoundingClientRect().width })));
  report.cursorStyles = await page.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('body *')).map(el => getComputedStyle(el).cursor))));
  report.allImages = await page.evaluate(() => Array.from(document.querySelectorAll('img')).map(i => ({ src: (i.currentSrc || i.src).split('?')[0], alt: i.alt, w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height), section: (i.closest('section, nav, footer') || {}).id || (i.closest('nav') ? 'nav' : i.closest('footer') ? 'footer' : ''), framerName: (i.closest('[data-framer-name]') || {}).getAttribute ? i.closest('[data-framer-name]').getAttribute('data-framer-name') : '', srcset: (i.srcset || '').split(',').map(s => s.trim().split(' ')[0].split('?')[0]).filter(Boolean) })));
  report.bgImages = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).map(el => getComputedStyle(el).backgroundImage).filter(b => b && b !== 'none' && !b.startsWith('linear') ).slice(0, 20));
  report.gradients = await page.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('body *')).map(el => getComputedStyle(el).backgroundImage).filter(b => b && b.includes('gradient')))).slice(0, 20));
  report.masks = await page.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('body *')).map(el => getComputedStyle(el).maskImage || getComputedStyle(el).webkitMaskImage).filter(b => b && b !== 'none'))).slice(0, 10));
  report.filters = await page.evaluate(() => Array.from(new Set(Array.from(document.querySelectorAll('body *')).map(el => getComputedStyle(el).filter + ' | ' + getComputedStyle(el).backdropFilter).filter(b => b !== 'none | none'))).slice(0, 10));
  await page.close();
  // 7. mobile menu
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } }); await m.goto(URL, { waitUntil: 'load' }); await m.waitForTimeout(2000);
  const btn = m.locator('[data-framer-name*="Menu" i], [aria-label*="menu" i], nav button, nav [role="button"]').first();
  report.mobile = { buttonName: await btn.evaluate(el => el.getAttribute('data-framer-name') || el.tagName + ':' + el.getAttribute('aria-label')).catch(e => 'not found') };
  try { const before = await m.screenshot({ path: path.join(OUT, 'mobile-menu-closed.png') }); await btn.click(); const samples = []; const t0 = Date.now(); for (let i = 0; i < 16; i++) { samples.push(await m.evaluate(() => { const ov = document.querySelector('[data-framer-name="BG Overlay"]'); const panel = ov && (ov.nextElementSibling || ov.parentElement); const cards = document.querySelectorAll('nav a[href*="#"]'); const first = cards[0]; return { overlayOpacity: ov ? getComputedStyle(ov).opacity : null, overlayDisplay: ov ? getComputedStyle(ov).display : null, firstCardOpacity: first ? getComputedStyle(first).opacity : null, firstCardTransform: first ? getComputedStyle(first).transform : null, firstCardTop: first ? Math.round(first.getBoundingClientRect().top) : null }; })); samples[samples.length - 1].t = Date.now() - t0; await m.waitForTimeout(60); } report.mobile.openSamples = samples; await m.screenshot({ path: path.join(OUT, 'mobile-menu-open.png') }); report.mobile.openDom = await m.evaluate(() => Array.from(document.querySelectorAll('nav [data-framer-name]')).slice(0, 30).map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { name: el.getAttribute('data-framer-name'), w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), bg: cs.backgroundColor, position: cs.position, opacity: cs.opacity }; })); } catch (e) { report.mobile.error = e.message.slice(0, 160); }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'live-effects.json'), JSON.stringify(report, null, 2));
  console.log('navCard', report.navCard.map(n => [n.label, n.samples[0].h, n.samples[n.samples.length - 1].h, n.hoverDiff.length]));
  console.log('ticker px/s', report.ticker.pxPerSec.toFixed(1), 'count', report.ticker.samples[0].count, 'w', report.ticker.samples[0].w);
  console.log('hover', report.hover.map(x => x.label + ':' + (x.error ? 'ERR' : x.diffs.length)).join(' '));
  console.log('animations', report.animations.length, 'inlineSvg', report.inlineSvg.length, 'cursors', report.cursorStyles, 'cursorEls', report.cursorElements.length, 'images', report.allImages.length, 'bg', report.bgImages.length, 'grad', report.gradients.length, 'masks', report.masks.length, 'filters', report.filters.length);
  console.log('mobile', report.mobile.buttonName, report.mobile.error || (report.mobile.openSamples || []).map(s => s.overlayOpacity).join(','));
})().catch(e => { console.error(e); process.exit(1); });
