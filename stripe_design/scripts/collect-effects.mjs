// Deep pass: boxes (cards/surfaces) with matched CSS source, illustrations (downloaded), interactions, motion, effects.
// Usage: node scripts/collect-effects.mjs [--only=/,/payments] [--limit=N]
import { launchBrowser } from './browser-runtime.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const RAW = path.join(ROOT, 'data/raw/effects'); const CAP = path.join(ROOT, 'captures'); const ILLO = path.join(ROOT, 'assets/stripe/illustrations');
for (const d of [RAW, path.join(CAP, 'boxes'), path.join(CAP, 'effects'), path.join(CAP, 'motion'), path.join(CAP, 'interactions'), path.join(CAP, 'illustrations'), ILLO]) await mkdir(d, { recursive: true });
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const DEFAULT = ['/', '/payments', '/billing', '/connect', '/radar', '/checkout', '/pricing', '/terminal', '/issuing', '/treasury', '/capital', '/atlas', '/climate', '/customers', '/enterprise', '/startups', '/use-cases/saas', '/use-cases/marketplaces', '/sessions', '/about', '/jobs', '/payments/elements', '/payments/payment-links', '/tax', '/identity', '/financial-connections', '/sigma', '/revenue-recognition', '/agentic-commerce', '/managed-payments'];
const PAGESLIST = (args.only ? args.only.split(',') : DEFAULT).slice(0, Number(args.limit || 100));
const slug = (p) => (p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase());
const sha = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10);

const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US', deviceScaleFactor: 1, extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } });
// Asset capture via network
const assets = new Map();
context.on('response', async (res) => {
  try {
    const u = res.url(); const ct = (res.headers()['content-type'] || '').toLowerCase(); const rt = res.request().resourceType();
    if (!/stripe|stripecdn|stripeassets/.test(u)) return;
    const isImg = rt === 'image' || /image\//.test(ct) || /\.(svg|png|webp|jpe?g|gif|avif)(\?|$)/i.test(u);
    const isMedia = rt === 'media' || /video\//.test(ct) || /\.(mp4|webm|mov)(\?|$)/i.test(u);
    const isLottie = /json/.test(ct) && /lottie|animation|\.json/i.test(u);
    if (!isImg && !isMedia && !isLottie) return;
    if (assets.has(u)) return; assets.set(u, { url: u, ct, kind: isMedia ? 'video' : isLottie ? 'lottie' : 'image', pages: new Set() });
    const body = await res.body().catch(() => null); if (!body) { assets.delete(u); return; }
    if (isLottie && !/"layers"/.test(body.toString('utf8', 0, 4000))) { assets.delete(u); return; }
    if (body.length > 25e6) { assets.get(u).skipped = 'too large'; return; }
    const ext = isLottie ? 'json' : (u.match(/\.(svg|png|webp|jpe?g|gif|avif|mp4|webm|mov)(\?|$)/i)?.[1] || ct.split('/')[1]?.split(';')[0] || 'bin');
    const base = u.replace(/^https?:\/\//, '').replace(/\?.*$/, '').split('/').pop().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9._-]+/gi, '-').slice(0, 80);
    const file = `${base}-${sha(u)}.${ext}`;
    await writeFile(path.join(ILLO, file), body);
    Object.assign(assets.get(u), { file, bytes: body.length });
  } catch {}
});

const PAGE_SCRIPT = () => {
  const cs = (el, p) => getComputedStyle(el, p);
  const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };
  const cls = (el) => (typeof el.className === 'string' ? el.className : el.className?.baseVal || '').trim();
  const pathOf = (el) => { const parts = []; let n = el, i = 0; while (n && n.nodeType === 1 && i++ < 4) { const c = cls(n).split(/\s+/).filter(Boolean).slice(0, 3).join('.'); parts.unshift(n.tagName.toLowerCase() + (c ? '.' + c : '')); n = n.parentElement; } return parts.join(' > '); };
  const BOXPROPS = ['background-color','background-image','background-size','background-position','border','border-color','border-radius','box-shadow','padding','backdrop-filter','filter','mask-image','clip-path','transform','transition','overflow','outline','color','mix-blend-mode','isolation','opacity','min-height','width','max-width','display','gap','grid-template-columns','flex-direction','align-items','justify-content','position'];
  const style = (el, keys, pseudo) => { const c = cs(el, pseudo); return Object.fromEntries(keys.map(k => [k, c.getPropertyValue(k)]).filter(([, v]) => v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)' && v !== 'static' && v !== 'visible')); };
  const pseudoInfo = (el, p) => { const c = cs(el, p); if (c.content === 'none' || c.content === 'normal') return null; const o = style(el, ['content','background-image','background-color','border-radius','box-shadow','filter','backdrop-filter','opacity','mask-image','transform','inset','width','height','mix-blend-mode','border','animation'], p); return Object.keys(o).length > 1 ? o : null; };
  const all = [...document.querySelectorAll('body *')].filter(vis).slice(0, 14000);
  const bodyBg = cs(document.body).backgroundColor;
  const boxes = [], effects = [], animated = [], illos = []; let idc = 0;
  const seenBox = new Set();
  for (const el of all) {
    const c = cs(el); const r = el.getBoundingClientRect(); const tag = el.tagName.toLowerCase();
    const radius = parseFloat(c.borderRadius) || 0; const hasShadow = c.boxShadow !== 'none'; const hasBorder = c.borderTopStyle !== 'none' && parseFloat(c.borderTopWidth) > 0; const bg = c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== bodyBg; const bgi = c.backgroundImage !== 'none'; const blur = c.backdropFilter !== 'none';
    const inChrome = el.closest('header, nav, footer, [class*="SiteHeader"], [class*="SiteFooter"], [class*="navigation"]');
    // BOX candidates
    if (!inChrome && r.width >= 140 && r.height >= 64 && r.width <= 1320 && r.height <= 1000 && el.children.length > 0 && !['img','svg','video','canvas','input','select','textarea','picture','ul','ol','table'].includes(tag) && !(['a','button'].includes(tag) && (r.width < 200 || r.height < 100)) && (radius >= 3 || hasShadow || blur) && (hasShadow || bg || hasBorder || bgi || blur)) {
      const sig = cls(el).split(/\s+/).filter(x => !/^(is-|has-|js-|_|css-)/.test(x)).slice(0, 4).join(' ') || tag;
      const key = sig + '|' + Math.round(r.width / 50) + '|' + c.backgroundColor + '|' + c.borderRadius + '|' + c.boxShadow.slice(0, 40);
      if (!seenBox.has(key) && boxes.length < 45) {
        seenBox.add(key); const id = 'b' + (idc++); el.setAttribute('data-ds-id', id);
        const html = el.outerHTML.replace(/<svg[\s\S]*?<\/svg>/g, (m) => m.length > 600 ? '<svg><!-- svg omitted --></svg>' : m).replace(/<(script|style)[\s\S]*?<\/\1>/g, '');
        boxes.push({ id, sig, path: pathOf(el), rect: rect(el), text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 120), style: style(el, BOXPROPS), before: pseudoInfo(el, '::before'), after: pseudoInfo(el, '::after'), childCount: el.children.length, html: html.length > 12000 ? html.slice(0, 12000) + '<!-- truncated -->' : html, hasImg: !!el.querySelector('img,svg,video,canvas'), interactive: !!(el.closest('a,button') || el.querySelector(':scope > a, :scope > button') || c.cursor === 'pointer'), dark: (() => { const m = c.color.match(/\d+/g); return m && (Number(m[0]) + Number(m[1]) + Number(m[2])) / 3 > 180; })() });
      }
    }
    // EFFECTS
    const eff = [];
    if (blur) eff.push('backdrop-filter'); if (c.filter !== 'none') eff.push('filter');
    if ((c.maskImage && c.maskImage !== 'none') || (c.webkitMaskImage && c.webkitMaskImage !== 'none')) eff.push('mask');
    if (c.clipPath !== 'none') eff.push('clip-path'); if (c.mixBlendMode !== 'normal') eff.push('blend-mode');
    if (c.transform !== 'none' && !/^matrix\(1, 0, 0, 1, /.test(c.transform) && !/^matrix\(1, 0, 0, 1\)/.test(c.transform)) eff.push('transform');
    if (c.webkitBackgroundClip === 'text' || c.backgroundClip === 'text') eff.push('gradient-text');
    if (bgi && /gradient/.test(c.backgroundImage) && !(c.webkitBackgroundClip === 'text')) eff.push(/conic/.test(c.backgroundImage) ? 'conic-gradient' : /radial/.test(c.backgroundImage) ? 'radial-gradient' : 'linear-gradient');
    if (c.borderImageSource && c.borderImageSource !== 'none') eff.push('border-image');
    if (c.textShadow && c.textShadow !== 'none') eff.push('text-shadow');
    const pb = pseudoInfo(el, '::before'), pa = pseudoInfo(el, '::after');
    if ((pb && /gradient|blur|shadow/.test(JSON.stringify(pb))) || (pa && /gradient|blur|shadow/.test(JSON.stringify(pa)))) eff.push('pseudo-layer');
    if (eff.length && r.width >= 24 && r.height >= 24 && effects.length < 70) { const id = el.getAttribute('data-ds-id') || 'e' + (idc++); el.setAttribute('data-ds-id', id); effects.push({ id, kinds: eff, path: pathOf(el), tag, rect: rect(el), style: style(el, ['background-image','background-color','background-clip','-webkit-background-clip','color','backdrop-filter','filter','mask-image','-webkit-mask-image','clip-path','transform','mix-blend-mode','border-image-source','text-shadow','opacity','border-radius','box-shadow','transition','animation']), before: pb, after: pa, text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60) }); }
    // ANIMATED (CSS animations)
    if (c.animationName !== 'none' && animated.length < 60) { const id = el.getAttribute('data-ds-id') || 'a' + (idc++); el.setAttribute('data-ds-id', id); animated.push({ id, path: pathOf(el), rect: rect(el), animation: { name: c.animationName, duration: c.animationDuration, timing: c.animationTimingFunction, delay: c.animationDelay, iteration: c.animationIterationCount, direction: c.animationDirection, fill: c.animationFillMode, playState: c.animationPlayState } }); }
    // ILLUSTRATIONS
    const isMedia = (['img','video','canvas'].includes(tag)) || (tag === 'picture' && !el.querySelector('img')) || (tag === 'svg' && r.width >= 72 && r.height >= 72 && !el.closest('button'));
    const isGraphicWrapper = /graphic|illustration|visual|animation|lottie|hero-wave|scene|diagram|dom-graphic|Graphic|Animation/.test(cls(el)) && el.querySelector('img,svg,video,canvas,[class*=layer],[class*=card]') && r.width >= 160 && r.height >= 120 && !el.closest('[data-ds-illo]');
    if ((isMedia && r.width >= 72 && r.height >= 40) || isGraphicWrapper) {
      if (illos.length < 45 && !inChrome) { const id = el.getAttribute('data-ds-id') || 'i' + (idc++); el.setAttribute('data-ds-id', id); if (isGraphicWrapper) el.setAttribute('data-ds-illo', '1'); illos.push({ id, kind: isGraphicWrapper ? 'dom-graphic' : tag, path: pathOf(el), rect: rect(el), src: (el.currentSrc || el.src || el.getAttribute('src') || el.querySelector('source')?.src || '').slice(0, 500), alt: el.getAttribute('alt') || el.getAttribute('aria-label') || '', poster: el.getAttribute('poster') || '', autoplay: el.autoplay || false, loop: el.loop || false, svgBytes: tag === 'svg' ? el.outerHTML.length : undefined, svg: tag === 'svg' && el.outerHTML.length < 60000 ? el.outerHTML : undefined, style: style(el, ['object-fit','border-radius','box-shadow','mask-image','filter','mix-blend-mode','aspect-ratio','transform']) }); }
    }
  }
  // Web Animations API snapshot
  const waapi = document.getAnimations().slice(0, 250).map(a => { const t = a.effect?.target; return { type: a.constructor.name, name: a.animationName || a.transitionProperty || a.id || '', target: t ? pathOf(t) : null, playState: a.playState, timing: a.effect?.getTiming?.(), keyframes: (a.effect?.getKeyframes?.() || []).slice(0, 10).map(k => Object.fromEntries(Object.entries(k).filter(([kk]) => kk !== 'composite' && kk !== 'computedOffset'))) }; });
  // Interaction affordances
  const hoverables = all.filter(el => { const c = cs(el); return c.cursor === 'pointer' && el.getBoundingClientRect().width > 40; }).length;
  const tabs = document.querySelectorAll('[role=tablist]').length, details = document.querySelectorAll('details, .hds-accordion, [class*=Accordion]').length, carousels = document.querySelectorAll('[class*=arousel], [aria-roledescription=carousel]').length, dialogs = document.querySelectorAll('dialog, [role=dialog]').length, segmented = document.querySelectorAll('[class*=SegmentedControl], [role=radiogroup]').length;
  return { boxes, effects, animated, illos, waapi, affordances: { hoverables, tabs, details, carousels, dialogs, segmented }, elements: all.length };
};

const HOVERPROPS = ['background-color','color','border-color','box-shadow','transform','opacity','filter','background-image','outline','text-decoration-color','translate','scale'];
const results = [];
for (const p of PAGESLIST) {
  const s = slug(p); const page = await context.newPage(); const t0 = Date.now();
  const entry = { path: p, slug: s, url: 'https://stripe.com' + p, startedAt: new Date().toISOString() };
  try {
    await page.goto(entry.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    for (const t of ['Accept all', 'Accept', 'Agree']) { const b = page.getByRole('button', { name: t, exact: false }).first(); try { if (await b.isVisible({ timeout: 250 })) { await b.click({ timeout: 800 }); break; } } catch {} }
    // Scroll to trigger lazy loading & scroll-linked animations; collect WAAPI union while scrolling
    const scrollAnims = new Map();
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 600) {
      await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(140);
      const list = await page.evaluate(() => document.getAnimations().slice(0, 80).map(a => { const t = a.effect?.target; const cls = t ? (typeof t.className === 'string' ? t.className : t.className?.baseVal || '') : ''; return { type: a.constructor.name, name: a.animationName || a.transitionProperty || a.id || '', target: t ? t.tagName.toLowerCase() + (cls ? '.' + cls.trim().split(/\s+/).slice(0, 3).join('.') : '') : null, timing: a.effect?.getTiming?.() }; })).catch(() => []);
      for (const a of list) { const k = a.type + '|' + a.name + '|' + a.target; if (!scrollAnims.has(k)) scrollAnims.set(k, { ...a, firstSeenScrollY: y }); }
    }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
    const data = await page.evaluate(PAGE_SCRIPT);
    Object.assign(entry, data, { scrollAnimations: [...scrollAnims.values()] });
    // CDP matched styles for boxes
    const cdp = await context.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const matched = async (selector) => { try { const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector }); if (!nodeId) return null; const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId }); const rules = (m.matchedCSSRules || []).filter(r => r.rule.origin === 'regular').map(r => ({ selector: r.rule.selectorList.text, css: r.rule.style.cssText.replace(/\s+/g, ' ').trim(), media: (r.rule.media || []).map(x => x.text).filter(Boolean).concat((r.rule.ruleTypes || []).length ? [] : []) })); const pseudo = (m.pseudoElements || []).map(pe => ({ pseudo: pe.pseudoType, rules: pe.matches.filter(r => r.rule.origin === 'regular').map(r => ({ selector: r.rule.selectorList.text, css: r.rule.style.cssText.replace(/\s+/g, ' ').trim() })) })); const inline = m.inlineStyle?.cssText?.trim() || ''; const vars = (m.cssKeyframesRules || []).map(k => ({ name: k.animationName.text, keyframes: k.keyframes.map(f => ({ key: f.keyText.text, css: f.style.cssText.replace(/\s+/g, ' ').trim() })) })); return { rules, pseudo, inline, keyframes: vars }; } catch (e) { return { error: String(e).slice(0, 120) }; } };
    for (const b of entry.boxes) {
      b.matchedCss = await matched(`[data-ds-id="${b.id}"]`);
      // direct children (up to 5) for the box's inner layout source
      b.children = await page.evaluate((id) => { const el = document.querySelector(`[data-ds-id="${id}"]`); return [...el.children].slice(0, 5).map((ch, i) => { ch.setAttribute('data-ds-child', id + '-' + i); const c = getComputedStyle(ch); return { key: id + '-' + i, tag: ch.tagName.toLowerCase(), cls: (typeof ch.className === 'string' ? ch.className : '').slice(0, 120), display: c.display, padding: c.padding, margin: c.margin, gap: c.gap, fontSize: c.fontSize, fontWeight: c.fontWeight, color: c.color }; }); }, b.id);
      for (const ch of b.children) ch.matchedCss = await matched(`[data-ds-child="${ch.key}"]`);
    }
    for (const a of entry.animated) a.matchedCss = await matched(`[data-ds-id="${a.id}"]`);
    for (const e of entry.effects.slice(0, 40)) e.matchedCss = await matched(`[data-ds-id="${e.id}"]`);
    // Screenshots: boxes (rest + hover), effects, illustrations
    const shot = async (id, file, pad = 6, hover = false) => { const loc = page.locator(`[data-ds-id="${id}"]`).first(); try { await loc.scrollIntoViewIfNeeded({ timeout: 4000 }); await page.waitForTimeout(hover ? 450 : 250); const b = await loc.boundingBox(); if (!b || b.width < 8 || b.height < 8) return null; const vp = page.viewportSize(); const clip = { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: Math.min(b.width + pad * 2, vp.width), height: Math.min(b.height + pad * 2, 1600) }; if (clip.height > vp.height) await page.setViewportSize({ width: vp.width, height: Math.ceil(clip.height) + 40 }).catch(() => {}); await page.screenshot({ path: file, clip }); if (clip.height > vp.height) await page.setViewportSize(vp); return path.relative(ROOT, file); } catch { return null; } };
    for (const b of entry.boxes) {
      await page.mouse.move(0, 0);
      b.shot = await shot(b.id, path.join(CAP, 'boxes', `${s}-${b.id}.png`));
      if (b.interactive || b.style.transition) {
        const loc = page.locator(`[data-ds-id="${b.id}"]`).first();
        const rest = await loc.evaluate((el, P) => { const c = getComputedStyle(el); return Object.fromEntries(P.map(k => [k, c.getPropertyValue(k)])); }, HOVERPROPS).catch(() => null);
        const preAnims = await page.evaluate(() => document.getAnimations().map(a => a.animationName || a.id || a.constructor.name)).catch(() => []);
        try { await loc.hover({ timeout: 3000 }); await page.waitForTimeout(500); } catch {}
        const hov = await loc.evaluate((el, P) => { const c = getComputedStyle(el); return Object.fromEntries(P.map(k => [k, c.getPropertyValue(k)])); }, HOVERPROPS).catch(() => null);
        if (rest && hov) { const delta = Object.fromEntries(Object.keys(rest).filter(k => rest[k] !== hov[k]).map(k => [k, { rest: rest[k], hover: hov[k] }])); if (Object.keys(delta).length) { b.hoverDelta = delta; b.hoverShot = await shot(b.id, path.join(CAP, 'boxes', `${s}-${b.id}-hover.png`), 6, true); } }
        // hover-triggered animations (e.g., arrow-in)
        const postAnims = await page.evaluate(() => document.getAnimations().filter(a => a.constructor.name !== 'CSSTransition').map(a => a.animationName || a.id || a.constructor.name)).catch(() => []);
        const pool = [...preAnims]; const hovAnims = postAnims.filter(n => { const i = pool.indexOf(n); if (i >= 0) { pool.splice(i, 1); return false; } return n !== 'Animation' && n !== 'detect-scroll'; });
        if (hovAnims.length) b.hoverAnimations = [...new Set(hovAnims)];
        await page.mouse.move(0, 0);
      }
    }
    for (const e of entry.effects.slice(0, 40)) e.shot = await shot(e.id, path.join(CAP, 'effects', `${s}-${e.id}.png`), 10);
    for (const i of entry.illos) i.shot = await shot(i.id, path.join(CAP, 'illustrations', `${s}-${i.id}.png`), 4);
    // Motion frame sequences for animated elements, canvases and videos (up to 6 targets/page)
    const motionTargets = [...entry.animated.filter(a => a.rect.w >= 60 && a.rect.h >= 40).slice(0, 4), ...entry.illos.filter(i => ['canvas', 'video', 'dom-graphic'].includes(i.kind)).slice(0, 3)];
    for (const t of motionTargets) { const frames = []; const loc = page.locator(`[data-ds-id="${t.id}"]`).first(); try { await loc.scrollIntoViewIfNeeded({ timeout: 3000 }); await page.waitForTimeout(300); const b = await loc.boundingBox(); if (!b || b.width < 40) continue; const clip = { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.min(b.width, 1440), height: Math.min(b.height, 900) }; for (let f = 0; f < 6; f++) { const file = path.join(CAP, 'motion', `${s}-${t.id}-f${f}.png`); await page.screenshot({ path: file, clip }); frames.push(path.relative(ROOT, file)); await page.waitForTimeout(160); } t.frames = frames; } catch {} }
    // Generic interactions: tabs, accordion, carousel next, segmented control
    entry.interactions = [];
    const tryInteract = async (label, locator, action, shotName) => { try { const loc = locator.first(); if (!(await loc.count()) || !(await loc.isVisible())) return; await loc.scrollIntoViewIfNeeded({ timeout: 3000 }); const container = loc.locator('xpath=ancestor-or-self::*[self::section or self::div][1]'); await page.waitForTimeout(200); const before = path.join(CAP, 'interactions', `${s}-${shotName}-before.png`); const bb = await container.boundingBox().catch(() => null) || await loc.boundingBox(); const clip = bb ? { x: Math.max(0, bb.x), y: Math.max(0, bb.y), width: Math.min(bb.width, 1440), height: Math.min(bb.height, 900) } : undefined; await page.screenshot({ path: before, clip }); const t0 = Date.now(); await action(loc); const anims = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').slice(0, 12).map(a => ({ type: a.constructor.name, name: a.animationName || a.transitionProperty || a.id || '', timing: a.effect?.getTiming?.() }))).catch(() => []); await page.waitForTimeout(700); const after = path.join(CAP, 'interactions', `${s}-${shotName}-after.png`); await page.screenshot({ path: after, clip }); entry.interactions.push({ label, before: path.relative(ROOT, before), after: path.relative(ROOT, after), animations: anims, ms: Date.now() - t0 }); } catch (e) { entry.interactions.push({ label, error: String(e).slice(0, 100) }); } };
    await tryInteract('tabs: click 2nd tab', page.locator('[role=tablist] [role=tab]:visible').nth(1), (l) => l.click({ timeout: 3000 }), 'tabs');
    await tryInteract('accordion: open item', page.locator('details:visible summary, .hds-accordion:visible summary, [class*=Accordion]:visible button').first(), (l) => l.click({ timeout: 3000 }), 'accordion');
    await tryInteract('carousel: next', page.locator('button[aria-label*="next" i]:visible, button[aria-label*="Next" i]:visible, [class*=arousel] button[class*=next]:visible').first(), (l) => l.click({ timeout: 3000 }), 'carousel-next');
    await tryInteract('segmented control: 2nd option', page.locator('[class*=SegmentedControl] button:visible, [role=radiogroup] [role=radio]:visible').nth(1), (l) => l.click({ timeout: 3000 }), 'segmented');
    await tryInteract('nav: open Products', page.locator('header button:has-text("Products"):visible, nav button:has-text("Products"):visible').first(), (l) => l.hover({ timeout: 3000 }), 'nav-products');
    await tryInteract('link hover arrow', page.locator('main a.hds-link, main a.CtaButton--arrow, main a[class*=Link]:has(svg)').filter({ visible: true }).nth(1), (l) => l.hover({ timeout: 3000 }), 'link-hover');
    entry.ok = true;
  } catch (e) { entry.ok = false; entry.error = String(e).slice(0, 400); }
  entry.ms = Date.now() - t0;
  await writeFile(path.join(RAW, `${s}.json`), JSON.stringify(entry, null, 1));
  results.push({ slug: s, ok: entry.ok, boxes: entry.boxes?.length, effects: entry.effects?.length, animated: entry.animated?.length, illos: entry.illos?.length, waapi: entry.waapi?.length, scrollAnims: entry.scrollAnimations?.length, interactions: entry.interactions?.filter(i => !i.error).length, ms: entry.ms, error: entry.error });
  console.log(JSON.stringify(results[results.length - 1]));
  await page.close();
}
for (const a of assets.values()) a.pages = [...a.pages];
await writeFile(path.join(RAW, '_assets-manifest.json'), JSON.stringify({ collectedAt: new Date().toISOString(), assets: [...assets.values()] }, null, 1));
await writeFile(path.join(RAW, '_index.json'), JSON.stringify({ collectedAt: new Date().toISOString(), results }, null, 1));
await browser.close();
console.log('done', results.length, 'pages;', assets.size, 'assets');
