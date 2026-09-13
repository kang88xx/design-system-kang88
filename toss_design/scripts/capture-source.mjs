import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { browserRuntime } from './browser-runtime.mjs';

const sourceUrl = 'https://toss.im/';
await mkdir('data/source', { recursive: true });
await mkdir('evidence/source', { recursive: true });
const browser = await browserRuntime();
const captures = [];
const resources = new Map();
const publicFiles = new Map();
const tasks = [];
const legacyCollector = await readFile('scripts/collect-live-design.js', 'utf8');

function extractDesign() {
  const groups = new Map();
  const media = [];
  const elements = [...document.querySelectorAll('body *')];
  const anchors = [...document.querySelectorAll('[id]')].filter(e => e.tagName !== 'SCRIPT' && e.getBoundingClientRect().height > 0);
  const label = el => (el.getAttribute('aria-label') || el.getAttribute('alt') || el.textContent || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 90);
  const sectionFor = el => {
    if (el.closest('nav, header')) return 'navigation';
    const owner = el.closest('[id]');
    if (owner && owner.tagName !== 'SCRIPT') return owner.id;
    const section = el.closest('section');
    return section?.querySelector('h1,h2,h3')?.textContent.trim().slice(0, 60) || 'page';
  };
  const selector = el => el.id ? `#${CSS.escape(el.id)}` : `${el.tagName.toLowerCase()}${[...el.classList].slice(0, 2).map(c => `.${CSS.escape(c)}`).join('')}`;
  const add = (category, values, el, pseudo = '') => {
    const key = `${category}:${JSON.stringify(values)}`;
    const item = groups.get(key) || { category, values, uses: 0, samples: [] };
    item.uses++;
    if (item.samples.length < 5) item.samples.push({ label: label(el), section: sectionFor(el), selector: selector(el) + pseudo });
    groups.set(key, item);
  };
  for (const el of elements) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK'].includes(el.tagName)) continue;
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (s.display === 'none' || !rect.width || !rect.height) continue;
    if ([...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())) {
      add('typography', { fontFamily: s.fontFamily, fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, color: s.color }, el);
    }
    if (s.transitionDuration.split(',').some(v => parseFloat(v) > 0)) add('transition', { transition: s.transition, transitionProperty: s.transitionProperty, transitionDuration: s.transitionDuration, transitionTimingFunction: s.transitionTimingFunction }, el);
    if (s.animationName !== 'none') add('animation', { animation: s.animation, animationName: s.animationName }, el);
    if (s.boxShadow !== 'none') add('shadow', { boxShadow: s.boxShadow, background: s.backgroundColor, borderRadius: s.borderRadius }, el);
    if (s.filter !== 'none' || s.backdropFilter !== 'none') add('filter', { filter: s.filter, backdropFilter: s.backdropFilter }, el);
    if (s.clipPath !== 'none' || (s.maskImage && s.maskImage !== 'none')) add('mask', { clipPath: s.clipPath, maskImage: s.maskImage }, el);
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') add('border', { border: s.border, borderRadius: s.borderRadius }, el);
    if (s.gap !== 'normal' || parseFloat(s.padding) > 0) add('spacing', { gap: s.gap, padding: s.padding }, el);
    for (const pseudo of ['::before', '::after']) {
      const p = getComputedStyle(el, pseudo);
      if (p.content !== 'none' && p.content !== 'normal') add('pseudo', { content: p.content, background: p.background, borderRadius: p.borderRadius, width: p.width, height: p.height, transform: p.transform }, el, pseudo);
    }
    if (el instanceof HTMLImageElement) media.push({ kind: 'image', url: el.currentSrc || el.src, srcset: el.srcset, label: el.alt || label(el), width: el.naturalWidth, height: el.naturalHeight, section: sectionFor(el), selector: selector(el) });
    if (el instanceof HTMLVideoElement) media.push({ kind: 'video', url: el.currentSrc || el.src || el.querySelector('source')?.src, poster: el.poster, label: label(el), section: sectionFor(el), selector: selector(el) });
    if (s.backgroundImage.includes('url(')) for (const match of s.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) media.push({ kind: 'image', url: new URL(match[1], location.href).href, label: label(el), section: sectionFor(el), selector: selector(el) });
  }
  const rules = [];
  const unavailableStylesheets = [];
  const walk = (list, url, context = '') => {
    for (const rule of list) {
      if (rule.type === CSSRule.KEYFRAMES_RULE || rule.type === CSSRule.FONT_FACE_RULE) rules.push({ kind: rule.type === CSSRule.KEYFRAMES_RULE ? 'keyframes' : 'font', css: rule.cssText, url, context });
      else if (rule.style) {
        const tokens = [...rule.style].filter(p => p.startsWith('--'));
        if (tokens.length) rules.push({ kind: 'tokens', selector: rule.selectorText, values: Object.fromEntries(tokens.map(p => [p, rule.style.getPropertyValue(p)])), url, context });
        if (/:hover|:focus|:active/.test(rule.selectorText || '')) rules.push({ kind: 'state', css: rule.cssText, selector: rule.selectorText, url, context });
      }
      if (rule.cssRules && rule.type !== CSSRule.KEYFRAMES_RULE) walk(rule.cssRules, url, rule.conditionText || context);
    }
  };
  for (const sheet of document.styleSheets) {
    try { walk(sheet.cssRules, sheet.href || location.href); } catch { unavailableStylesheets.push(sheet.href); }
  }
  return { url: location.href, title: document.title, viewport: { width: innerWidth, height: innerHeight }, sections: anchors.map(el => ({ id: el.id, label: label(el), height: Math.round(el.getBoundingClientRect().height) })), elements: elements.length, groups: [...groups.values()], media, rules, unavailableStylesheets };
}

try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, locale: 'ko-KR', extraHTTPHeaders: { 'Accept-Language': 'ko-KR,ko;q=0.9' }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('response', response => {
      const url = response.url();
      if (!/^https:\/\/(?:static\.toss\.im|toss\.im|[^/]+\.toss\.im)\//.test(url)) return;
      const type = response.request().resourceType();
      resources.set(url, { url, status: response.status(), type, contentType: response.headers()['content-type'] || '' });
      if (['stylesheet', 'script', 'document'].includes(type) && response.ok()) tasks.push((async () => {
        try { const body = await response.text(); publicFiles.set(url, { url, type, body }); } catch { /* Response may be evicted by navigation. */ }
      })());
    });
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `evidence/source/home-${viewport.width}.png` });
    const motionSamples = new Map();
    // Traverse the complete public page so lazy mounts and frame sequences are requested.
    for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 750) {
      if (y > 150000) throw new Error('Unexpected page length; refusing an unbounded capture.');
      await page.evaluate(y => scrollTo(0, y), y);
      await page.waitForTimeout(130);
      for (const animation of await page.evaluate(() => document.getAnimations().map(a => ({ name: a.animationName || a.constructor.name, timing: a.effect?.getTiming(), keyframes: a.effect?.getKeyframes(), target: a.effect?.target?.tagName, section: a.effect?.target?.closest('[id]')?.id })))) {
        const key = JSON.stringify(animation);
        motionSamples.set(key, animation);
      }
    }
    await page.waitForTimeout(1800);
    const capture = await page.evaluate(extractDesign);
    capture.motionSamples = [...motionSamples.values()];
    capture.interactionStates = [];
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    const controls = page.locator('button,a');
    for (let i = 0; i < Math.min(await controls.count(), 10); i++) {
      const control = controls.nth(i);
      if (!await control.isVisible()) continue;
      const read = el => { const s = getComputedStyle(el); return { color: s.color, background: s.background, transform: s.transform, opacity: s.opacity, transition: s.transition }; };
      try {
        await page.mouse.move(viewport.width - 2, viewport.height - 2);
        const normal = await control.evaluate(read);
        await control.hover({ timeout: 2000 });
        await page.waitForTimeout(350);
        const hover = await control.evaluate(read);
        await control.focus();
        const focus = await control.evaluate(read);
        capture.interactionStates.push({ label: await control.innerText(), normal, hover, focus, evidence: 'observed' });
      } catch { /* Hidden, fixed or scroll-displaced controls are reported by absence. */ }
    }
    const legacy = await page.evaluate(new Function(`return (async () => {${legacyCollector}\n})()`));
    await writeFile(`data/source/legacy-${viewport.width}.json`, legacy);
    for (const id of ['transfer', 'assets', 'finance', 'invest', 'global']) {
      const section = page.locator(`#${id}`).first();
      if (await section.count()) {
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await page.screenshot({ path: `evidence/source/${id}-${viewport.width}.png` });
      }
    }
    captures.push(capture);
    console.log(`Captured ${viewport.width}: ${capture.elements} elements, ${capture.sections.length} anchors, ${capture.media.length} media, ${capture.groups.length} style groups`);
    await context.close();
  }
  await Promise.allSettled(tasks);
  const documents = [];
  for (const file of publicFiles.values()) {
    const hash = createHash('sha256').update(file.url).digest('hex').slice(0, 12);
    const extension = file.type === 'stylesheet' ? 'css' : file.type === 'script' ? 'js' : 'html';
    const localPath = `data/source/${hash}.${extension}`;
    await writeFile(localPath, file.body);
    documents.push({ url: file.url, localPath, type: file.type, bytes: Buffer.byteLength(file.body) });
  }
  const result = { schemaVersion: 2, collectedAt: new Date().toISOString(), sourceUrl, captures, resources: [...resources.values()], documents };
  await writeFile('data/toss-source-capture.json', JSON.stringify(result, null, 2) + '\n');
  console.log(`Saved ${resources.size} resource URLs and ${documents.length} public documents`);
} finally { await browser.close(); }
