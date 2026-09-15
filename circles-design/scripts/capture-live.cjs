/* Capture live evidence from the three circles Framer site: screenshots, computed styles, fonts, colors, media, motion. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || require('os').homedir() + '/.claude/skills/gstack/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'references');
const URL = process.env.SITE_URL || 'https://three-circles-wbs.framer.website/';

const PROBE = `(() => {
  const out = { url: location.href, title: document.title, page: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: innerWidth, vh: innerHeight } };
  const count = (map, k) => map.set(k, (map.get(k) || 0) + 1);
  const fonts = new Map(), sizes = new Map(), colors = new Map(), bgs = new Map(), radii = new Map(), shadows = new Map(), transitions = new Map(), weights = new Map(), lh = new Map(), ls = new Map(), families = new Map();
  const nodes = Array.from(document.querySelectorAll('body *'));
  const samples = [];
  for (const el of nodes) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const txt = (el.childNodes.length && Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) ? el.textContent.trim().slice(0, 80) : '';
    if (txt) {
      count(fonts, cs.fontFamily.split(',')[0].replace(/"/g, '').trim());
      count(families, cs.fontFamily);
      count(sizes, cs.fontSize); count(weights, cs.fontWeight); count(lh, cs.lineHeight); count(ls, cs.letterSpacing); count(colors, cs.color);
      if (samples.length < 400) samples.push({ tag: el.tagName.toLowerCase(), text: txt, font: cs.fontFamily.split(',')[0].replace(/"/g, ''), size: cs.fontSize, weight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, color: cs.color, transform: cs.textTransform, x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) });
    }
    if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') count(bgs, cs.backgroundColor);
    if (cs.borderRadius && cs.borderRadius !== '0px') count(radii, cs.borderRadius);
    if (cs.boxShadow && cs.boxShadow !== 'none') count(shadows, cs.boxShadow);
    if (cs.transition && cs.transition !== 'all 0s ease 0s' && cs.transition !== 'all' ) count(transitions, cs.transition);
  }
  const top = (m, n = 40) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
  out.fonts = top(fonts); out.families = top(families, 12); out.sizes = top(sizes); out.weights = top(weights); out.lineHeights = top(lh); out.letterSpacings = top(ls); out.textColors = top(colors); out.backgrounds = top(bgs); out.radii = top(radii); out.shadows = top(shadows, 20); out.transitions = top(transitions, 30);
  out.samples = samples;
  out.sections = Array.from(document.querySelectorAll('section, [id$="-section"], #hero, header, footer, nav')).map(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { tag: el.tagName.toLowerCase(), id: el.id, cls: (el.className || '').toString().slice(0, 60), y: Math.round(r.y + scrollY), h: Math.round(r.height), w: Math.round(r.width), x: Math.round(r.x), bg: cs.backgroundColor, pad: cs.padding, gap: cs.gap, position: cs.position }; });
  out.links = Array.from(document.querySelectorAll('a[href]')).map(a => ({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 60) })).filter((v, i, arr) => arr.findIndex(o => o.href === v.href && o.text === v.text) === i);
  out.images = Array.from(document.querySelectorAll('img')).map(i => { const r = i.getBoundingClientRect(); return { src: i.currentSrc || i.src, srcset: (i.srcset || '').slice(0, 300), alt: i.alt, w: Math.round(r.width), h: Math.round(r.height), nw: i.naturalWidth, nh: i.naturalHeight, y: Math.round(r.y + scrollY) }; });
  out.videos = Array.from(document.querySelectorAll('video')).map(v => ({ src: v.currentSrc || v.src, poster: v.poster, loop: v.loop, muted: v.muted, autoplay: v.autoplay, controls: v.controls }));
  out.buttons = Array.from(document.querySelectorAll('a, button')).filter(el => { const cs = getComputedStyle(el); return cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.borderRadius !== '0px'; }).slice(0, 60).map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { text: el.textContent.trim().slice(0, 40), bg: cs.backgroundColor, color: cs.color, radius: cs.borderRadius, padding: cs.padding, h: Math.round(r.height), w: Math.round(r.width), font: cs.fontFamily.split(',')[0], size: cs.fontSize, weight: cs.fontWeight, border: cs.border, shadow: cs.boxShadow, transition: cs.transition }; });
  out.fontFaces = Array.from(document.fonts).map(f => ({ family: f.family, weight: f.weight, style: f.style, status: f.status })).filter((v, i, arr) => arr.findIndex(o => o.family === v.family && o.weight === v.weight && o.style === v.style) === i);
  const anim = new Set(); document.getAnimations().forEach(a => { try { anim.add(JSON.stringify({ type: a.constructor.name, name: a.animationName || (a.effect && a.effect.getKeyframes && a.effect.getKeyframes().length) || '', duration: a.effect && a.effect.getTiming().duration, iterations: a.effect && a.effect.getTiming().iterations, easing: a.effect && a.effect.getTiming().easing })); } catch (e) {} });
  out.animations = Array.from(anim).slice(0, 40).map(s => JSON.parse(s));
  out.cssVars = (() => { const vars = {}; for (const sheet of document.styleSheets) { let rules; try { rules = sheet.cssRules; } catch (e) { continue; } for (const rule of rules) { if (rule.style) { for (const p of rule.style) { if (p.startsWith('--token') || p.startsWith('--framer-')) vars[p] = rule.style.getPropertyValue(p).trim(); } } } } return vars; })();
  return out;
})()`;

async function capture(browser, name, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' });
  const errors = []; const requests = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 200)));
  page.on('response', r => { const u = r.url(); if (/framerusercontent\.com\/(images|assets)|fonts\.gstatic|\.mp4|\.webm|\.svg|\.png|\.jpg|\.woff2/.test(u)) requests.push({ url: u, status: r.status(), type: r.headers()['content-type'] || '' }); });
  const resp = await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(2500);
  // scroll through to trigger lazy load and appear animations
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += Math.round(viewport.height * 0.8)) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(220); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1500);
  const data = await page.evaluate(PROBE);
  data.http = { status: resp && resp.status(), finalUrl: page.url() };
  data.consoleErrors = errors; data.mediaRequests = requests.filter((v, i, a) => a.findIndex(o => o.url === v.url) === i);
  data.viewport = viewport; data.captured = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, `live-${name}.json`), JSON.stringify(data, null, 2));
  await page.screenshot({ path: path.join(OUT, `live-${name}.png`), fullPage: true });
  await page.screenshot({ path: path.join(OUT, `live-${name}-first-view.png`), fullPage: false });
  if (name === 'desktop') {
    // hover probe on primary CTA and nav links
    const hover = [];
    for (const sel of ['a:has-text("Book a 30-Min Call")', 'a:has-text("get started now")', 'a:has-text("Projects")', 'a:has-text("View all projects")', 'button:has-text("Send a message")']) {
      try { const loc = page.locator(sel).first(); await loc.scrollIntoViewIfNeeded(); const before = await loc.evaluate(el => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, transition: cs.transition, shadow: cs.boxShadow }; }); await loc.hover(); await page.waitForTimeout(500); const after = await loc.evaluate(el => { const cs = getComputedStyle(el); const inner = el.querySelector('div,span,p'); const ics = inner ? getComputedStyle(inner) : null; return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, transition: cs.transition, shadow: cs.boxShadow, innerBg: ics && ics.backgroundColor, innerTransform: ics && ics.transform }; }); hover.push({ sel, before, after }); } catch (e) { hover.push({ sel, error: e.message.slice(0, 120) }); }
    }
    // sticky header test
    await page.evaluate(() => window.scrollTo(0, 1600)); await page.waitForTimeout(600);
    const headerAfterScroll = await page.evaluate(() => Array.from(document.querySelectorAll('nav, header, [data-framer-name*="nav" i], [data-framer-name*="header" i]')).slice(0, 6).map(el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { name: el.getAttribute('data-framer-name'), tag: el.tagName, position: cs.position, top: Math.round(r.top), h: Math.round(r.height), bg: cs.backgroundColor, backdrop: cs.backdropFilter, z: cs.zIndex }; }));
    // per-section screenshots by id
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
    const ids = ['hero', 'project-section', 'about-section', 'service-section', 'award-section', 'testimonial-section', 'blog-section', 'contact-section'];
    const sections = [];
    for (const id of ids) { try { const el = page.locator('#' + id).first(); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(900); await el.screenshot({ path: path.join(OUT, `section-${id}.png`) }); const box = await el.boundingBox(); sections.push({ id, box }); } catch (e) { sections.push({ id, error: e.message.slice(0, 100) }); } }
    fs.writeFileSync(path.join(OUT, 'live-interactions.json'), JSON.stringify({ hover, headerAfterScroll, sections, captured: new Date().toISOString() }, null, 2));
  }
  await page.close();
  return data;
}

(async () => {
  const browser = await chromium.launch();
  const d = await capture(browser, 'desktop', { width: 1440, height: 1000 });
  const m = await capture(browser, 'mobile', { width: 390, height: 844 });
  const t = await capture(browser, 'tablet', { width: 900, height: 1000 });
  await browser.close();
  console.log('desktop', d.page, 'errors', d.consoleErrors.length, 'fonts', d.fonts.slice(0, 6), 'media', d.mediaRequests.length);
  console.log('mobile', m.page, 'tablet', t.page);
})().catch(e => { console.error(e); process.exit(1); });
