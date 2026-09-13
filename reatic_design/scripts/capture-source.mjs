// Captures the public site: raw HTML per page, full/fold screenshots at 1440 and 390, computed styles,
// per-section clips and hover states. Output: evidence/source/. Run from the repository root.
import fs from 'node:fs/promises';
import path from 'node:path';
import { launchBrowser, UA_DESKTOP, UA_MOBILE, SOURCE, PAGES } from './browser-runtime.mjs';

const out = path.resolve('evidence/source');
await fs.mkdir(path.join(out, 'screenshots'), { recursive: true });
const browser = await launchBrowser();
const computed = {};

// 1. raw HTML (desktop + mobile UA)
for (const p of PAGES) {
  const name = p || 'home';
  const res = await fetch(`${SOURCE}/${p}`, { headers: { 'user-agent': UA_DESKTOP } });
  await fs.writeFile(path.join(out, `${name}.html`), await res.text());
}
const mobileRes = await fetch(SOURCE, { headers: { 'user-agent': UA_MOBILE } });
await fs.writeFile(path.join(out, 'mobile.html'), await mobileRes.text());

// 2. rendered captures
for (const vp of [{ name: 'desktop', w: 1440, h: 900 }, { name: 'mobile', w: 390, h: 844, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.mobile, deviceScaleFactor: 1, userAgent: vp.mobile ? UA_MOBILE : UA_DESKTOP });
  for (const p of PAGES) {
    const name = p || 'home';
    const page = await ctx.newPage();
    try { await page.goto(`${SOURCE}/${p}`, { waitUntil: 'networkidle', timeout: 60000 }); } catch (e) { console.log('goto', name, e.message); }
    await page.waitForTimeout(2500);
    const total = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < total; y += vp.h * 0.7) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(250); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(out, 'screenshots', `${name}-${vp.name}-fold.png`) });
    await page.screenshot({ path: path.join(out, 'screenshots', `${name}-${vp.name}-full.png`), fullPage: true });

    if (vp.name === 'desktop') {
      computed[name] = await page.evaluate(() => {
        const cs = el => getComputedStyle(el);
        const rect = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
        const texts = [];
        document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,button,label,input,textarea,li').forEach(el => {
          const t = (el.innerText || el.value || el.placeholder || '').trim().replace(/\s+/g, ' ');
          if (!t || t.length > 200) return;
          const target = el.querySelector('span[style], span[class*="color"], span') || el;
          const s = cs(target);
          texts.push({ tag: el.tagName.toLowerCase(), text: t.slice(0, 80), font: s.fontFamily.split(',')[0].replace(/"/g, ''), size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, color: s.color, align: cs(el).textAlign, rect: rect(el), id: (el.closest('[id^="comp-"]') || {}).id });
        });
        const sections = [...document.querySelectorAll('section, header, footer')].map(el => {
          const bgEl = el.querySelector('[data-testid="colorUnderlay"]');
          const img = el.querySelector('img'); const vid = el.querySelector('video');
          return { tag: el.tagName.toLowerCase(), id: el.id, rect: rect(el), bg: bgEl ? cs(bgEl).backgroundColor : cs(el).backgroundColor, bgImg: img ? img.src.slice(0, 140) : null, video: vid ? (vid.currentSrc || vid.src || '').slice(0, 160) : null };
        });
        const buttons = [...document.querySelectorAll('a[class*="button"], button, [class*="wixui-button"]')].map(el => { const s = cs(el); return { text: (el.innerText || '').trim().slice(0, 40), bg: s.backgroundColor, color: s.color, border: s.border, radius: s.borderRadius, padding: s.padding, font: s.fontFamily.split(',')[0], size: s.fontSize, rect: rect(el), href: el.href || null }; });
        const nav = [...document.querySelectorAll('header a')].map(a => ({ text: a.innerText.trim(), href: a.href, rect: rect(a) }));
        const videos = [...document.querySelectorAll('video')].map(v => ({ src: (v.currentSrc || v.src || '').slice(0, 160), rect: rect(v), autoplay: v.autoplay, loop: v.loop, muted: v.muted }));
        const inputs = [...document.querySelectorAll('input, textarea, select')].map(el => { const s = cs(el); return { type: el.type, ph: el.placeholder, bg: s.backgroundColor, color: s.color, border: s.border, borderBottom: s.borderBottom, radius: s.borderRadius, font: s.fontFamily.split(',')[0], size: s.fontSize, padding: s.padding, rect: rect(el) }; });
        const anim = [...document.querySelectorAll('[data-motion-enter]')].map(el => { const s = cs(el); return { id: el.id, anim: s.animationName, dur: s.animationDuration, delay: s.animationDelay, ease: s.animationTimingFunction, vars: el.getAttribute('style') }; }).filter(a => a.anim && a.anim !== 'none');
        return { title: document.title, height: document.body.scrollHeight, nav, texts, sections, buttons, videos, inputs, anim };
      });

      // per-section clips
      const secs = await page.evaluate(() => [...document.querySelectorAll('header, section, footer')].map(el => { const r = el.getBoundingClientRect(); return { id: el.id, y: Math.round(r.y + scrollY), h: Math.round(r.height) }; }).filter(s => s.h > 40));
      let i = 0;
      for (const s of secs) {
        i++;
        try { await page.screenshot({ path: path.join(out, 'screenshots', `sec-${name}-${String(i).padStart(2, '0')}-${s.id}.png`), fullPage: true, clip: { x: 0, y: s.y, width: 1440, height: Math.min(s.h, 4000) } }); } catch (e) { console.log('clip', name, s.id, e.message); }
      }
      // hover states
      const navLink = (await page.$$('header a'))[1];
      if (navLink) { await page.evaluate(() => scrollTo(0, 0)); await navLink.hover(); await page.waitForTimeout(600); await page.screenshot({ path: path.join(out, 'screenshots', `hover-${name}-nav.png`), clip: { x: 0, y: 0, width: 1440, height: 80 } }); }
      const btn = await page.$('[class*="wixui-button"], a[class*="button"]');
      if (btn) { const box = await btn.boundingBox(); if (box) { await page.evaluate(y => scrollTo(0, y - 300), box.y); await page.waitForTimeout(400); await btn.hover(); await page.waitForTimeout(600); const hb = await btn.boundingBox(); await page.screenshot({ path: path.join(out, 'screenshots', `hover-${name}-button.png`), clip: { x: Math.max(0, hb.x - 40), y: hb.y - 40, width: hb.width + 80, height: hb.height + 80 } }); } }
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
await fs.writeFile(path.join(out, 'computed-styles.json'), JSON.stringify(computed, null, 1));
console.log('capture-source done', Object.keys(computed));
