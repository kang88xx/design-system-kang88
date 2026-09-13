// Crawl stripe.com marketing pages and record design evidence.
// Usage: node scripts/collect-stripe.mjs [--pages=N] [--only=/path,/path]
import { launchBrowser } from './browser-runtime.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const RAW = path.join(ROOT, 'data/raw');
const CAP = path.join(ROOT, 'captures/pages');
const CSSDIR = path.join(ROOT, 'assets/stripe/css');
const LOGODIR = path.join(ROOT, 'assets/stripe/svg');
await Promise.all([RAW, CAP, CSSDIR, LOGODIR, path.join(RAW, 'pages')].map(d => mkdir(d, { recursive: true })));

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const SEED = [
  '/', '/payments', '/billing', '/connect', '/terminal', '/radar', '/issuing', '/checkout', '/pricing',
  '/customers', '/enterprise', '/startups', '/tax', '/atlas', '/treasury', '/capital', '/identity',
  '/financial-connections', '/sigma', '/data-pipeline', '/revenue-recognition', '/invoicing', '/climate',
  '/payments/elements', '/payments/payment-links', '/payments/link', '/partners', '/apps',
  '/use-cases/saas', '/use-cases/marketplaces', '/use-cases/ecommerce', '/use-cases/platforms',
  '/use-cases/creator-economy', '/use-cases/embedded-finance', '/use-cases/global-businesses',
  '/industries/retail', '/industries/healthcare', '/industries/nonprofits', '/industries/travel',
  '/about', '/jobs', '/newsroom', '/blog', '/sessions', '/resources', '/contact/sales', '/sitemap',
  '/payments/features', '/agentic-commerce', '/managed-payments', '/global', '/security', '/ai',
];
const only = args.only ? args.only.split(',') : null;
const limit = Number(args.pages || 200);

const browser = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 }, locale: 'en-US', deviceScaleFactor: 1,
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
});
const cssSeen = new Map();
context.on('response', async (res) => {
  try {
    const ct = res.headers()['content-type'] || '';
    const u = res.url();
    if (ct.includes('text/css') || /\.css(\?|$)/.test(u)) {
      if (!cssSeen.has(u)) { cssSeen.set(u, null); const body = await res.text(); cssSeen.set(u, body); }
    }
  } catch {}
});

const PAGE_SCRIPT = () => {
  const out = {};
  const cs = (el) => getComputedStyle(el);
  const props = ['font-family','font-size','font-weight','line-height','letter-spacing','color','background-color','background-image','border-radius','box-shadow','padding','margin','gap','border','border-color','text-transform','transition','opacity','backdrop-filter','max-width','width','height','display','align-items','justify-content','text-decoration','min-height','outline'];
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const style = (el, keys = props) => Object.fromEntries(keys.map(k => [k, cs(el).getPropertyValue(k)]));
  const sig = (el) => ({ tag: el.tagName.toLowerCase(), cls: (el.className && typeof el.className === 'string') ? el.className.trim().slice(0, 200) : '', text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 160) });

  out.title = document.title; out.url = location.href; out.lang = document.documentElement.lang;
  out.themeColor = document.querySelector('meta[name=theme-color]')?.content || null;
  out.description = document.querySelector('meta[name=description]')?.content || null;
  out.stylesheets = [...document.styleSheets].map(s => s.href).filter(Boolean);
  out.docHeight = document.documentElement.scrollHeight;

  // Frequency tables
  const freq = {}; const bump = (k, v) => { if (!v || v === 'none' || v === 'normal' || v === 'auto') return; freq[k] ??= {}; freq[k][v] = (freq[k][v] || 0) + 1; };
  const all = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).slice(0, 8000);
  out.elementCount = all.length;
  const fontsUsed = {};
  for (const el of all) {
    const c = cs(el);
    if (c.visibility === 'hidden' || c.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (hasText) {
      bump('font-size', c.fontSize); bump('font-weight', c.fontWeight); bump('line-height', c.lineHeight); bump('letter-spacing', c.letterSpacing);
      bump('color', c.color); bump('font-family', c.fontFamily.split(',')[0].replace(/"/g, ''));
      const key = `${c.fontFamily.split(',')[0].replace(/"/g,'')}|${c.fontSize}|${c.fontWeight}|${c.lineHeight}|${c.letterSpacing}`;
      fontsUsed[key] = (fontsUsed[key] || 0) + 1;
    }
    if (c.backgroundColor && c.backgroundColor !== 'rgba(0, 0, 0, 0)') bump('background-color', c.backgroundColor);
    if (c.backgroundImage && c.backgroundImage !== 'none' && !c.backgroundImage.startsWith('url(')) bump('background-image', c.backgroundImage);
    if (c.borderRadius && c.borderRadius !== '0px') bump('border-radius', c.borderRadius);
    if (c.boxShadow && c.boxShadow !== 'none') bump('box-shadow', c.boxShadow);
    if (c.borderTopWidth !== '0px' && c.borderTopStyle !== 'none') bump('border-color', c.borderTopColor);
    for (const side of ['paddingTop','paddingBottom','paddingLeft','paddingRight']) if (c[side] !== '0px') bump('padding', c[side]);
    for (const side of ['marginTop','marginBottom']) if (c[side] !== '0px' && !c[side].startsWith('-')) bump('margin', c[side]);
    if (c.display.includes('flex') || c.display.includes('grid')) { if (c.gap !== 'normal' && c.gap !== '0px') bump('gap', c.gap); }
    if (c.transitionDuration && c.transitionDuration !== '0s') bump('transition', `${c.transitionProperty} ${c.transitionDuration} ${c.transitionTimingFunction}`);
    if (c.animationName && c.animationName !== 'none') bump('animation', `${c.animationName} ${c.animationDuration} ${c.animationTimingFunction}`);
    if (c.maxWidth && c.maxWidth !== 'none' && /px$/.test(c.maxWidth)) bump('max-width', c.maxWidth);
    if (c.backdropFilter && c.backdropFilter !== 'none') bump('backdrop-filter', c.backdropFilter);
    if (c.textTransform && c.textTransform !== 'none' && hasText) bump('text-transform', c.textTransform);
  }
  out.freq = freq; out.typeCombos = Object.entries(fontsUsed).sort((a,b)=>b[1]-a[1]).slice(0, 80);

  // Headings
  out.headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].slice(0, 60).map(el => ({ ...sig(el), rect: rect(el), style: style(el, ['font-family','font-size','font-weight','line-height','letter-spacing','color','text-transform','margin','max-width']) }));
  // Paragraphs / body text
  out.paragraphs = [...document.querySelectorAll('p, li')].filter(el => el.innerText.trim().length > 20).slice(0, 40).map(el => ({ ...sig(el), style: style(el, ['font-family','font-size','font-weight','line-height','letter-spacing','color','max-width']) }));
  // Buttons and CTAs
  const btnSel = 'button, a[class*="Button"], a[class*="button"], a[class*="Cta"], a[class*="cta"], [role=button], input[type=submit]';
  out.buttons = [...document.querySelectorAll(btnSel)].filter(el => el.getBoundingClientRect().width > 0).slice(0, 80).map(el => {
    const c = cs(el); const before = getComputedStyle(el, '::before'); const after = getComputedStyle(el, '::after');
    return { ...sig(el), href: el.getAttribute('href'), rect: rect(el), style: style(el), hasSvg: !!el.querySelector('svg'), before: { content: before.content, background: before.backgroundImage, bg: before.backgroundColor }, after: { content: after.content, background: after.backgroundImage, bg: after.backgroundColor }, html: el.outerHTML.slice(0, 1500) };
  });
  // Links
  out.links = [...document.querySelectorAll('main a, article a')].filter(el => el.innerText.trim() && !el.matches(btnSel)).slice(0, 40).map(el => ({ ...sig(el), href: el.getAttribute('href'), style: style(el, ['color','font-size','font-weight','text-decoration','text-decoration-color','text-underline-offset','transition']) }));
  // Inputs
  out.inputs = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].slice(0, 20).map(el => ({ ...sig(el), type: el.type, placeholder: el.placeholder, rect: rect(el), style: style(el, ['font-family','font-size','color','background-color','border','border-radius','box-shadow','padding','height','outline']) }));
  // Nav / header / footer
  const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; return { ...sig(el), rect: rect(el), style: style(el), html: el.outerHTML.slice(0, 20000) }; };
  out.header = pick('header'); out.nav = pick('nav'); out.footer = pick('footer');
  out.navLinks = [...document.querySelectorAll('header a, nav a')].map(a => ({ text: a.innerText.trim().replace(/\s+/g,' ').slice(0,60), href: a.getAttribute('href') })).filter(a => a.href && a.text).slice(0, 200);
  out.footerLinks = [...document.querySelectorAll('footer a')].map(a => ({ text: a.innerText.trim().replace(/\s+/g,' ').slice(0,60), href: a.getAttribute('href') })).filter(a => a.href).slice(0, 300);
  // Sections: direct children of main with background
  out.sections = [...document.querySelectorAll('main > *, main > * > section, section')].filter(el => el.getBoundingClientRect().height > 120).slice(0, 40).map(el => ({ ...sig(el), rect: rect(el), style: style(el, ['background-color','background-image','padding','max-width','color','clip-path','transform']) }));
  // Cards: elements with radius + (shadow or bg) and reasonable size
  out.cards = all.filter(el => { const c = cs(el); const r = el.getBoundingClientRect(); return r.width > 160 && r.width < 900 && r.height > 80 && r.height < 900 && parseFloat(c.borderRadius) >= 4 && (c.boxShadow !== 'none' || (c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== cs(document.body).backgroundColor) || c.borderTopStyle !== 'none'); }).slice(0, 40).map(el => ({ ...sig(el), rect: rect(el), style: style(el, ['background-color','background-image','border','border-radius','box-shadow','padding','backdrop-filter']) }));
  // SVG logos (not the duotone product icons): wordmarks, partner logos
  out.svgs = [...document.querySelectorAll('svg')].filter(s => s.getBoundingClientRect().width > 0).slice(0, 200).map(s => { const r = s.getBoundingClientRect(); const lbl = s.getAttribute('aria-label') || s.querySelector('title')?.textContent || s.closest('a,button')?.getAttribute('aria-label') || s.closest('[class]')?.className?.toString().slice(0,80) || ''; return { label: lbl.trim().slice(0,100), w: Math.round(r.width), h: Math.round(r.height), viewBox: s.getAttribute('viewBox'), html: s.outerHTML.length < 40000 ? s.outerHTML : null, fill: cs(s).fill, color: cs(s).color }; });
  // Images
  out.images = [...document.querySelectorAll('img, picture source, video')].slice(0, 120).map(el => ({ tag: el.tagName.toLowerCase(), src: (el.currentSrc || el.src || el.srcset || el.getAttribute('src') || '').slice(0, 400), alt: el.alt || '', w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
  // Body / root
  out.body = { style: style(document.body, ['font-family','font-size','line-height','color','background-color','-webkit-font-smoothing','letter-spacing']), htmlStyle: style(document.documentElement, ['font-size','background-color','color-scheme']) };
  // Layout containers: most common centered max-width
  out.containers = [...new Set(all.filter(el => { const c = cs(el); return c.marginLeft === c.marginRight && c.marginLeft !== '0px' && /px$/.test(c.maxWidth); }).map(el => `${cs(el).maxWidth} | pad ${cs(el).paddingLeft}`))].slice(0, 20);
  return out;
};

async function dismissCookies(page) {
  for (const t of ['Accept all', 'Accept', 'Agree', 'Got it', 'OK']) {
    const b = page.getByRole('button', { name: t, exact: false }).first();
    try { if (await b.isVisible({ timeout: 300 })) { await b.click({ timeout: 1000 }); return t; } } catch {}
  }
  return null;
}

const results = [];
const queue = [...(only || SEED)];
const visited = new Set();
const slug = (p) => (p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase());
const t0 = Date.now();
while (queue.length && results.length < limit) {
  const p = queue.shift(); if (visited.has(p)) continue; visited.add(p);
  const page = await context.newPage();
  const url = 'https://stripe.com' + p;
  const entry = { path: p, url, slug: slug(p), startedAt: new Date().toISOString() };
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    entry.status = res?.status(); entry.finalUrl = page.url();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    entry.cookieDismissed = await dismissCookies(page);
    // trigger lazy content
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); });
    await page.waitForTimeout(800);
    const data = await page.evaluate(PAGE_SCRIPT);
    Object.assign(entry, data);
    // Screenshots: desktop full page (capped) + header + mobile fold
    await page.screenshot({ path: path.join(CAP, `${entry.slug}-1440-full.png`), fullPage: true }).catch(async () => page.screenshot({ path: path.join(CAP, `${entry.slug}-1440-fold.png`) }));
    await page.screenshot({ path: path.join(CAP, `${entry.slug}-1440-fold.png`) });
    if (p === '/' || p === '/payments' || p === '/pricing') {
      await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(600);
      entry.mobile = await page.evaluate(() => ({ headings: [...document.querySelectorAll('h1,h2,h3')].slice(0,12).map(h => ({ t: h.tagName, s: getComputedStyle(h).fontSize, lh: getComputedStyle(h).lineHeight, text: h.innerText.trim().slice(0,60) })), bodyPad: [...document.querySelectorAll('main section')].slice(0,6).map(s => getComputedStyle(s).padding), nav: document.querySelector('header')?.getBoundingClientRect().height }));
      await page.screenshot({ path: path.join(CAP, `${entry.slug}-390-full.png`), fullPage: true }).catch(() => {});
      await page.screenshot({ path: path.join(CAP, `${entry.slug}-390-fold.png`) });
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    // Discover additional first-party pages (marketing only)
    if (!only) for (const l of [...(data.navLinks || []), ...(data.footerLinks || [])]) {
      const h = l.href; if (!h) continue;
      let pth = null; if (h.startsWith('/')) pth = h; else if (h.startsWith('https://stripe.com/')) pth = h.replace('https://stripe.com', '');
      if (!pth) continue; pth = pth.split('#')[0].split('?')[0]; if (!pth || pth === '/') continue;
      if (/^\/(docs|login|support|legal|privacy|cookies|newsroom\/|blog\/|jobs\/|sitemap|[a-z]{2}(-[a-z]{2})?\/)/.test(pth)) continue;
      if (!visited.has(pth) && !queue.includes(pth) && queue.length + results.length < limit) queue.push(pth);
    }
    entry.ok = true;
  } catch (e) { entry.ok = false; entry.error = String(e).slice(0, 300); }
  entry.ms = Date.now() - t0;
  await writeFile(path.join(RAW, 'pages', `${entry.slug}.json`), JSON.stringify(entry, null, 1));
  results.push({ path: p, slug: entry.slug, ok: entry.ok, status: entry.status, title: entry.title, finalUrl: entry.finalUrl, error: entry.error, elementCount: entry.elementCount });
  console.log(`${results.length}. ${entry.ok ? 'ok ' : 'ERR'} ${p} ${entry.status || ''} ${entry.title || entry.error || ''}`);
  await page.close();
}
// Save CSS files
const cssIndex = [];
for (const [u, body] of cssSeen) {
  if (!body) continue;
  const name = u.replace(/^https?:\/\//, '').replace(/[^a-z0-9.]+/gi, '_').slice(0, 160) + (u.endsWith('.css') ? '' : '.css');
  await writeFile(path.join(CSSDIR, name), body);
  cssIndex.push({ url: u, file: name, bytes: body.length });
}
await writeFile(path.join(RAW, 'crawl-index.json'), JSON.stringify({ collectedAt: new Date().toISOString(), pages: results, css: cssIndex }, null, 2));
await browser.close();
console.log(`done: ${results.length} pages, ${cssIndex.length} css files, ${Math.round((Date.now()-t0)/1000)}s`);
