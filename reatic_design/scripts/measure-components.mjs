// Second-pass measurement: header/nav geometry, section inner padding, buttons, inputs, checkboxes, slider,
// anchor dots, vertical lines, gallery item spacing, client logo cells, footer, mobile notice, SVG icons.
// Desktop 1440 and mobile 390. Output: evidence/source/component-measurements.json. Run from the repository root.
import fs from 'node:fs/promises';
import { launchBrowser, UA_DESKTOP, UA_MOBILE, SOURCE, PAGES } from './browser-runtime.mjs';

const browser = await launchBrowser();
const out = {};
for (const vp of [{ name: 'desktop', w: 1440, h: 900 }, { name: 'mobile', w: 390, h: 844, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.mobile, userAgent: vp.mobile ? UA_MOBILE : UA_DESKTOP });
  for (const p of PAGES) {
    const name = p || 'home';
    const page = await ctx.newPage();
    try { await page.goto(`${SOURCE}/${p}`, { waitUntil: 'networkidle', timeout: 60000 }); } catch {}
    await page.waitForTimeout(1500);
    const total = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < total; y += 600) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(120); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
    out[`${name}-${vp.name}`] = await page.evaluate(() => {
      const cs = el => getComputedStyle(el);
      const rect = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
      const pick = (el, props) => { const s = cs(el); return Object.fromEntries(props.map(p => [p, s.getPropertyValue(p)])); };
      const res = { canvas: { w: innerWidth, h: document.body.scrollHeight } };
      const header = document.querySelector('header');
      if (header) { res.header = { rect: rect(header), ...pick(header, ['background-color', 'box-shadow', 'position']) }; const u = header.querySelector('[data-testid="colorUnderlay"]'); if (u) res.headerUnderlay = pick(u, ['background-color', 'background-image', 'box-shadow']); }
      res.nav = [...document.querySelectorAll('header nav a')].slice(0, 6).map(a => { const label = a.querySelector('p, span, div') || a; return { text: a.innerText.trim(), rect: rect(a), ...pick(label, ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height']) }; });
      res.navSeparators = [...document.querySelectorAll('header li + li')].slice(0, 3).map(el => pick(el, ['border-left', 'width', 'height']));
      const ham = document.querySelector('[aria-label*="menu" i], [class*="hamburger" i]'); if (ham) res.hamburger = { rect: rect(ham), html: ham.outerHTML.slice(0, 200) };
      const sizes = {};
      document.querySelectorAll('h1,h2,h3,p,span,a,label').forEach(el => { const t = (el.innerText || '').trim(); if (!t || t.length > 120) return; const s = cs(el); const k = `${s.fontSize}|${s.fontFamily.split(',')[0].replace(/"/g, '')}|${s.fontWeight}|${s.lineHeight}|${s.color}`; (sizes[k] = sizes[k] || []).push(t.slice(0, 30)); });
      res.textStyles = Object.entries(sizes).map(([key, v]) => ({ key, n: v.length, samples: [...new Set(v)].slice(0, 3) })).sort((a, b) => parseFloat(b.key) - parseFloat(a.key));
      res.sections = [...document.querySelectorAll('section')].map(sec => { const r = rect(sec); const kids = [...sec.querySelectorAll('[data-testid="richTextElement"], img, video, button, a[class*="button"]')].map(rect).filter(k => k.w > 0 && k.h > 0); return { id: sec.id, rect: r, innerTop: kids.length ? Math.min(...kids.map(k => k.y)) - r.y : null, innerBottom: kids.length ? r.y + r.h - Math.max(...kids.map(k => k.y + k.h)) : null, innerLeft: kids.length ? Math.min(...kids.map(k => k.x)) : null }; });
      res.buttons = [...document.querySelectorAll('a[class*="wixui-button"], button[class*="wixui-button"], button')].map(b => { const lbl = b.querySelector('[class*="label"]') || b; return { text: b.innerText.trim().slice(0, 30), rect: rect(b), ...pick(b, ['background-color', 'border', 'border-radius', 'padding']), label: pick(lbl, ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color']) }; }).filter(b => b.rect.w > 0);
      res.inputs = [...document.querySelectorAll('input, textarea, select')].map(i => ({ type: i.type || i.tagName, ph: (i.placeholder || '').slice(0, 40), rect: rect(i), ...pick(i, ['background-color', 'border', 'border-bottom', 'border-radius', 'font-family', 'font-size', 'color', 'padding', 'height']), wrapper: i.parentElement ? pick(i.parentElement, ['border', 'border-bottom', 'background-color']) : null }));
      res.checkboxes = [...document.querySelectorAll('[class*="checkbox__icon"]')].slice(0, 3).map(el => ({ rect: rect(el), ...pick(el, ['background-color', 'border', 'border-radius', 'width', 'height']) }));
      res.slider = [...document.querySelectorAll('[data-testid="track"], [data-testid="thumb"], [data-testid="tooltip"]')].map(el => ({ id: el.getAttribute('data-testid'), rect: rect(el), ...pick(el, ['background-color', 'border', 'border-radius', 'width', 'height', 'color', 'font-size']) }));
      res.anchorDots = [...document.querySelectorAll('.wixui-anchor-menu__item')].slice(0, 8).map(el => { const dot = el.querySelector('span, div, a'); return { rect: rect(el), dot: dot ? { rect: rect(dot), ...pick(dot, ['background-color', 'border', 'border-radius', 'width', 'height']) } : null, state: el.getAttribute('data-state') }; });
      res.lines = [...document.querySelectorAll('.wixui-vertical-line, .wixui-horizontal-line')].map(el => ({ rect: rect(el), inner: el.firstElementChild ? pick(el.firstElementChild, ['border-left', 'border-top', 'background-color', 'width', 'height']) : null }));
      const items = [...document.querySelectorAll('[data-hook="item-container"], .gallery-item-container')].map(rect).filter(r => r.w > 50);
      if (items.length) res.gallery = { count: items.length, items: items.slice(0, 4), gapX: items[1] ? items[1].x - (items[0].x + items[0].w) : null, gapY: items[2] ? items[2].y - (items[0].y + items[0].h) : null };
      res.smallImages = [...document.querySelectorAll('img')].map(i => ({ rect: rect(i), src: i.src.slice(-40) })).filter(i => i.rect.w > 30 && i.rect.w < 400).slice(0, 40);
      const inp = document.querySelector('input'); if (inp) { inp.focus(); res.inputFocus = pick(inp, ['outline', 'box-shadow', 'border-bottom']); inp.blur(); }
      const f = document.querySelector('footer'); if (f) { const t = f.querySelector('h2, p, span'); res.footer = { rect: rect(f), bg: cs(f).backgroundColor, text: t ? pick(t, ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height']) : null }; }
      const notice = [...document.querySelectorAll('h1,h2,h3,p')].find(el => el.innerText.includes('모바일로 보고')); if (notice) res.mobileNotice = { rect: rect(notice.closest('section') || notice), text: notice.innerText.slice(0, 80), ...pick(notice, ['font-size', 'font-family', 'color']) };
      res.svgs = [...document.querySelectorAll('[class*="vector-image"] svg')].slice(0, 6).map(s => ({ rect: rect(s), fill: cs(s.querySelector('path') || s).fill, viewBox: s.getAttribute('viewBox') }));
      return res;
    });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await fs.writeFile('evidence/source/component-measurements.json', JSON.stringify(out, null, 1));
console.log('measure-components done', Object.keys(out));
