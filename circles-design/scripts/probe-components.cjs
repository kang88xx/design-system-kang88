/* Second probe: styled boxes (buttons, cards, chips), hover variants, sidebar nav, footer, form fields. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || require('os').homedir() + '/.claude/skills/gstack/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const OUT = path.join(__dirname, '..', 'references');
const URL = 'https://three-circles-wbs.framer.website/';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(URL, { waitUntil: 'load' }); await page.waitForTimeout(2000);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 800) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(150); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  const boxes = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8 || r.width > 1200) continue;
      const bg = cs.backgroundColor; const hasBg = bg && bg !== 'rgba(0, 0, 0, 0)';
      const hasBorder = cs.borderTopWidth !== '0px' && cs.borderTopStyle !== 'none';
      if (!hasBg && !hasBorder && cs.boxShadow === 'none') continue;
      const text = el.textContent.trim().replace(/\s+/g, ' ').slice(0, 50);
      out.push({ name: el.getAttribute('data-framer-name') || '', tag: el.tagName.toLowerCase(), text, bg, border: hasBorder ? cs.borderTop : '', radius: cs.borderRadius, padding: cs.padding, gap: cs.gap, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y + scrollY), shadow: cs.boxShadow, opacity: cs.opacity, display: cs.display, flexDir: cs.flexDirection, overflow: cs.overflow });
    }
    return out;
  });
  fs.writeFileSync(path.join(OUT, 'live-boxes.json'), JSON.stringify(boxes, null, 2));
  // hover probes on framer named elements
  const targets = await page.evaluate(() => Array.from(document.querySelectorAll('[data-framer-name]')).map(el => el.getAttribute('data-framer-name')).filter((v, i, a) => a.indexOf(v) === i));
  fs.writeFileSync(path.join(OUT, 'live-framer-names.json'), JSON.stringify(targets, null, 2));
  const hoverResults = [];
  const snap = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, shadow: cs.boxShadow, opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, border: cs.borderTop }; };
  const hoverSpecs = [
    { label: 'primary-cta', sel: 'a:has-text("Book a 30-Min Call")' },
    { label: 'hero-cta', sel: 'a:has-text("get started now")' },
    { label: 'nav-card-projects', sel: 'nav a:has-text("Projects")' },
    { label: 'nav-card-about', sel: 'nav a:has-text("About")' },
    { label: 'view-all', sel: 'a:has-text("View all projects")' },
    { label: 'project-row', sel: 'a:has-text("Art By Liora")' },
    { label: 'service-row', sel: 'text=Brand guidelines' },
    { label: 'blog-card', sel: 'a:has-text("Why your brand needs a story")' },
    { label: 'submit', sel: 'button:has-text("Send a message")' },
    { label: 'footer-cta', sel: 'a:has-text("Book a call")' },
    { label: 'lets-talk', sel: 'a:has-text("Let’s talk")' },
  ];
  for (const spec of hoverSpecs) {
    try {
      const loc = page.locator(spec.sel).first(); await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
      const before = await loc.evaluate(el => { const all = [el, ...el.querySelectorAll('*')].slice(0, 12); return all.map(e => ({ name: e.getAttribute('data-framer-name') || e.tagName.toLowerCase(), cs: (function (el) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, shadow: cs.boxShadow, opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, border: cs.borderTop, transition: cs.transition, font: cs.fontFamily.split(',')[0], size: cs.fontSize, weight: cs.fontWeight, padding: cs.padding, textTransform: cs.textTransform } })(e) })); });
      await loc.hover(); await page.waitForTimeout(700);
      const after = await loc.evaluate(el => { const all = [el, ...el.querySelectorAll('*')].slice(0, 12); return all.map(e => ({ name: e.getAttribute('data-framer-name') || e.tagName.toLowerCase(), cs: (function (el) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { bg: cs.backgroundColor, color: cs.color, transform: cs.transform, shadow: cs.boxShadow, opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), radius: cs.borderRadius, border: cs.borderTop, transition: cs.transition, font: cs.fontFamily.split(',')[0], size: cs.fontSize, weight: cs.fontWeight, padding: cs.padding, textTransform: cs.textTransform } })(e) })); });
      const diffs = [];
      before.forEach((b, i) => { const a = after[i]; if (!a) return; const d = {}; for (const k of Object.keys(b.cs)) if (b.cs[k] !== a.cs[k]) d[k] = [b.cs[k], a.cs[k]]; if (Object.keys(d).length) diffs.push({ node: b.name, changes: d }); });
      hoverResults.push({ label: spec.label, sel: spec.sel, rest: before[0], hover: after[0], diffs, transitions: before.map(b => b.cs.transition).filter((v, i, a) => v && v !== 'all' && a.indexOf(v) === i) });
      await page.screenshot({ path: path.join(OUT, `hover-${spec.label}.png`), clip: await (async () => { const b = await loc.boundingBox(); return { x: Math.max(0, b.x - 20), y: Math.max(0, b.y - 20), width: Math.min(1400, b.width + 40), height: Math.min(900, b.height + 40) }; })() });
      await page.mouse.move(5, 5); await page.waitForTimeout(300);
    } catch (e) { hoverResults.push({ label: spec.label, error: e.message.slice(0, 160) }); }
  }
  // form fields
  const fields = await page.evaluate(() => Array.from(document.querySelectorAll('input, textarea, select')).map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), type: el.type, placeholder: el.placeholder, name: el.name, bg: cs.backgroundColor, color: cs.color, border: cs.borderBottom, borderTop: cs.borderTop, radius: cs.borderRadius, padding: cs.padding, font: cs.fontFamily.split(',')[0], size: cs.fontSize, w: Math.round(r.width), h: Math.round(r.height), required: el.required }; }));
  // sidebar nav geometry and footer
  const nav = await page.evaluate(() => { const nav = document.querySelector('nav'); const cs = getComputedStyle(nav); const r = nav.getBoundingClientRect(); const parent = nav.parentElement; const pcs = getComputedStyle(parent); return { w: r.width, h: r.height, position: cs.position, parentPosition: pcs.position, parentTop: getComputedStyle(parent).top, pad: cs.padding, bg: cs.backgroundColor, cards: Array.from(nav.querySelectorAll('a')).map(a => { const acs = getComputedStyle(a); const ar = a.getBoundingClientRect(); const inner = a.firstElementChild; const ics = inner ? getComputedStyle(inner) : null; return { text: a.textContent.trim().slice(0, 20), href: a.getAttribute('href'), w: Math.round(ar.width), h: Math.round(ar.height), bg: acs.backgroundColor, innerBg: ics && ics.backgroundColor, radius: acs.borderRadius, innerRadius: ics && ics.borderRadius, padding: acs.padding, innerPadding: ics && ics.padding }; }) }; });
  // scroll: check what stays fixed
  await page.evaluate(() => window.scrollTo(0, 2500)); await page.waitForTimeout(500);
  const fixedAfterScroll = await page.evaluate(() => Array.from(document.querySelectorAll('body *')).filter(el => { const cs = getComputedStyle(el); return cs.position === 'fixed' || cs.position === 'sticky'; }).slice(0, 20).map(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { name: el.getAttribute('data-framer-name'), tag: el.tagName, position: cs.position, top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), text: el.textContent.trim().slice(0, 30) }; }));
  await page.screenshot({ path: path.join(OUT, 'live-desktop-scrolled.png') });
  fs.writeFileSync(path.join(OUT, 'live-components.json'), JSON.stringify({ hoverResults, fields, nav, fixedAfterScroll, captured: new Date().toISOString() }, null, 2));
  await browser.close();
  console.log('boxes', boxes.length, 'hover', hoverResults.map(h => h.label + ':' + (h.error ? 'ERR' : h.diffs.length)).join(' '), 'fields', fields.length, 'fixed', fixedAfterScroll.length);
})().catch(e => { console.error(e); process.exit(1); });
