import {chromium} from '/apple_design/app/dist/client/home/kang/.claude/skills/gstack/node_modules/playwright/index.mjs';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

const require = createRequire(new URL('../app/package.json', import.meta.url));
const postcss = require('postcss');
const chromePath = '/apple_design/app/dist/client/home/kang/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome';
const publicRoot = path.resolve('app/public/research');
const evidenceRoot = path.resolve('evidence/expanded');
const filesRoot = path.join(publicRoot, 'files');
const pageRoot = path.join(publicRoot, 'pages');
const iconRoot = path.join(publicRoot, 'icons');
const urls = [
  'https://www.apple.com/mac/',
  'https://www.apple.com/iphone/',
  'https://www.apple.com/ipad/',
  'https://www.apple.com/watch/',
  'https://www.apple.com/airpods/',
  'https://www.apple.com/apple-vision-pro/',
  'https://www.apple.com/tv-home/',
  'https://www.apple.com/services/',
  'https://www.apple.com/us/shop/goto/store',
  'https://www.apple.com/us/shop/goto/buy_accessories',
  'https://www.apple.com/macbook-air/',
  'https://www.apple.com/iphone-17-pro/',
  'https://support.apple.com/'
];

const cssProps = [
  'display', 'position', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'color', 'background-color', 'background-image', 'border', 'border-radius', 'box-shadow',
  'clip-path', 'mask-image', '-webkit-mask-image', 'transform', 'transition-property',
  'transition-duration', 'transition-timing-function', 'animation-name', 'animation-duration',
  'animation-timing-function', 'opacity', 'height', 'min-height', 'width', 'max-width', 'padding',
  'margin', 'gap'
];
const shapeProps = ['border-radius', 'clip-path', 'mask-image', '-webkit-mask-image', 'border', 'box-shadow'];
const forbiddenControlText = /buy|add to bag|bag|cart|checkout|finance|trade in|carrier|select|choose|sign in|account|order|shipping/i;
const resourceKinds = new Map([
  ['text/css', 'css'],
  ['application/javascript', 'js'],
  ['text/javascript', 'js'],
  ['application/x-javascript', 'js'],
  ['image/svg+xml', 'svg']
]);

await fs.mkdir(filesRoot, {recursive: true});
await fs.mkdir(pageRoot, {recursive: true});
await fs.mkdir(iconRoot, {recursive: true});
await fs.mkdir(evidenceRoot, {recursive: true});
await fs.access(chromePath);

const capturedAt = new Date().toISOString();
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});
const version = await browser.version();
const globalResources = new Map();
const globalSourceMaps = new Map();
const iconByHash = new Map();
const motionsByKey = new Map();
const shapesByKey = new Map();
const failures = [];

function slug(input) {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'page';
}

function shortHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function webPath(absPath) {
  return '/apple_design/app/dist/client/research/' + path.relative(publicRoot, absPath).replaceAll(path.sep, '/');
}

function localResourcePath(url, body, kind) {
  const u = new URL(url);
  const ext = kind === 'css' ? '.css' : kind === 'js' ? '.js' : kind === 'svg' ? '.svg' : '';
  const base = `${slug(u.hostname + u.pathname)}-${shortHash(body)}${ext}`;
  return path.join(filesRoot, base);
}

function kindFromResponse(response) {
  const type = (response.headers()['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (resourceKinds.has(type)) return resourceKinds.get(type);
  const pathname = new URL(response.url()).pathname.toLowerCase();
  if (pathname.endsWith('.css')) return 'css';
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) return 'js';
  if (pathname.endsWith('.svg')) return 'svg';
  return null;
}

function uniqueByUrl(items) {
  const seen = new Set();
  return items.filter(item => {
    if (!item?.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function sanitizeSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/@import\s+[^;]+;/gi, '')
    .replace(/url\(\s*(['"]?)(?!#|data:)[^)]+\1\s*\)/gi, 'none')
    .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\s(?:href|xlink:href|src)\s*=\s*(['"])(?!#|data:)[\s\S]*?\1/gi, '');
}

function compactLabel(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function extractMotionsFromCss(css, sourceUrl) {
  const motions = [];
  let root;
  try {
    root = postcss.parse(css, {from: sourceUrl});
  } catch (error) {
    return motions;
  }
  root.walkAtRules(rule => {
    if (rule.name.endsWith('keyframes')) {
      const block = rule.toString();
      const id = `motion-${shortHash(sourceUrl + block)}`;
      motions.push({id, name: rule.params, sourceUrl, kind: 'keyframes', css: block, duration: null, easing: null});
    }
  });
  root.walkDecls(decl => {
    if (!/^transition($|-)|^animation($|-)/.test(decl.prop)) return;
    const cssText = decl.toString();
    const id = `motion-${shortHash(sourceUrl + decl.prop + decl.value)}`;
    const duration = decl.value.match(/(?:^|\s|,)(\d*\.?\d+m?s)\b/)?.[1] || null;
    const easing = decl.value.match(/\b(cubic-bezier\([^)]+\)|ease(?:-in-out|-in|-out)?|linear|steps\([^)]+\))\b/)?.[1] || null;
    motions.push({id, name: decl.prop, sourceUrl, kind: decl.prop.startsWith('animation') ? 'animation' : 'transition', css: cssText, duration, easing});
  });
  return motions;
}

function sourceMapRefs(text, headers, sourceUrl) {
  const refs = [];
  const header = headers['sourcemap'] || headers['x-sourcemap'] || headers['source-map'];
  if (header && !/^data:/i.test(header)) refs.push({url: new URL(header, sourceUrl).href, via: 'header'});
  for (const match of text.matchAll(/[#@]\s*sourceMappingURL=([^\s*]+)/g)) {
    const ref = match[1].trim();
    if (!/^data:/i.test(ref)) refs.push({url: new URL(ref, sourceUrl).href, via: 'comment'});
  }
  return refs;
}

async function writeResource(url, body, kind, headers) {
  const hash = sha256(body);
  if (globalResources.has(url)) return globalResources.get(url);
  const filePath = localResourcePath(url, body, kind);
  await fs.mkdir(path.dirname(filePath), {recursive: true});
  await fs.writeFile(filePath, body);
  const entry = {url, file: webPath(filePath), kind, sha256: hash};
  globalResources.set(url, entry);
  if (kind === 'css') {
    const css = body.toString('utf8');
    for (const motion of extractMotionsFromCss(css, url)) motionsByKey.set(motion.id, motion);
  }
  if (kind === 'css' || kind === 'js') {
    const text = body.toString('utf8');
    for (const ref of sourceMapRefs(text, headers, url)) {
      if (!globalSourceMaps.has(ref.url)) globalSourceMaps.set(ref.url, {url: ref.url, status: 'pending', via: ref.via});
    }
  }
  return entry;
}

async function resolveSourceMaps(page) {
  for (const entry of globalSourceMaps.values()) {
    if (entry.status !== 'pending') continue;
    try {
      const response = await page.request.get(entry.url, {timeout: 15000});
      entry.status = response.ok() ? 'available' : `blocked:${response.status()}`;
      if (response.ok()) {
        const body = Buffer.from(await response.body());
        const filePath = path.join(filesRoot, `${slug(new URL(entry.url).hostname + new URL(entry.url).pathname)}-${shortHash(body)}.map`);
        await fs.writeFile(filePath, body);
        entry.file = webPath(filePath);
        entry.sha256 = sha256(body);
      }
    } catch (error) {
      entry.status = 'blocked';
      entry.error = String(error).slice(0, 180);
    }
  }
}

async function scrollIncremental(page, dir, prefix) {
  const shots = [];
  const height = await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));
  const step = 820;
  let index = 0;
  for (let y = 0; y < height; y += step) {
    await page.evaluate(value => scrollTo(0, value), y);
    await page.waitForTimeout(120);
    const shot = path.join(dir, `${prefix}-scroll-${String(index).padStart(2, '0')}.png`);
    await page.screenshot({path: shot});
    shots.push(webPath(shot));
    index += 1;
  }
  await page.evaluate(() => scrollTo(0, 0));
  return shots;
}

async function extractPageData(page, rawHtml) {
  return page.evaluate(({rawHtml, cssProps, shapeProps}) => {
    const rawDoc = new DOMParser().parseFromString(rawHtml, 'text/html');
    const textOf = el => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const styleValues = el => {
      const style = getComputedStyle(el);
      return Object.fromEntries(cssProps.map(prop => [prop, style.getPropertyValue(prop)]));
    };
    const isVisible = el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0 && rect.width > 2 && rect.height > 2;
    };
    const briefSelector = el => {
      if (!el) return '';
      if (el.id) return `#${CSS.escape(el.id)}`;
      const cls = [...el.classList].slice(0, 3).map(c => `.${CSS.escape(c)}`).join('');
      return `${el.tagName.toLowerCase()}${cls}`;
    };
    const headings = [...document.querySelectorAll('h1,h2,h3')].slice(0, 40).map(el => ({
      level: el.tagName.toLowerCase(),
      text: textOf(el).slice(0, 120),
      selector: briefSelector(el),
      styles: styleValues(el)
    })).filter(h => h.text);
    const controls = [...document.querySelectorAll('button,[role="button"],input,select,summary,a[aria-expanded],a[href^="#"]')]
      .slice(0, 220)
      .map((el, index) => {
        el.setAttribute('data-expand-control', String(index));
        const label = (el.getAttribute('aria-label') || el.getAttribute('title') || textOf(el)).slice(0, 100);
        const visible = isVisible(el);
        const inMain = Boolean(el.closest('main'));
        let priority = 0;
        if (visible) priority += 20;
        if (inMain) priority += 12;
        if (/localnav|chapternav|tab|gallery|accordion|toggle|filter|paddlenav|color|swatch/i.test(`${el.className || ''} ${label} ${el.getAttribute('aria-controls') || ''}`)) priority += 8;
        if (el.closest('#globalnav')) priority -= 4;
        if (/menuback|hidden|visuallyhidden/i.test(`${el.className || ''} ${label}`)) priority -= 20;
        return {
          index,
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || '',
          type: el.getAttribute('type') || '',
          label,
          selector: `[data-expand-control="${index}"]`,
          displaySelector: briefSelector(el),
          expanded: el.getAttribute('aria-expanded'),
          controls: el.getAttribute('aria-controls'),
          href: el.getAttribute('href') || '',
          disabled: el.matches(':disabled,[aria-disabled="true"]'),
          visible,
          inMain,
          priority
        };
      })
      .filter(control => control.label || control.expanded !== null || control.controls);
    const localControls = controls
      .filter(c => c.visible)
      .filter(c => !/menuback|hidden|visuallyhidden/i.test(`${c.displaySelector} ${c.label}`))
      .filter(c => /localnav|chapternav|tab|gallery|accordion|toggle|filter|globalnav|menutrigger|search|paddlenav|color|swatch/i.test(`${c.displaySelector} ${c.label} ${c.controls}`))
      .sort((a, b) => b.priority - a.priority);
    const computedSelectors = [
      '#globalnav', '.globalnav-content', '.globalnav-flyout', '.globalnav-link', '.globalnav-submenu-link',
      '.localnav', '.ac-ln-wrapper', '.chapternav', '.tabnav', '.button', '.button-neutral',
      '.section-hero', '.hero', '.tile', '.card', '[class*="gallery"]', '[class*="paddlenav"]'
    ];
    const computed = computedSelectors.map(selector => {
      const el = document.querySelector(selector);
      return el ? {selector, styles: styleValues(el)} : null;
    }).filter(Boolean);
    const isMeaningfulBorder = style => {
      const widths = ['Top', 'Right', 'Bottom', 'Left'].map(side => parseFloat(style.getPropertyValue(`border-${side.toLowerCase()}-width`)) || 0);
      const styles = ['Top', 'Right', 'Bottom', 'Left'].map(side => style.getPropertyValue(`border-${side.toLowerCase()}-style`));
      return widths.some(width => width > 0) && styles.some(value => value && value !== 'none' && value !== 'hidden');
    };
    const shapeScore = el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const bg = style.getPropertyValue('background-image');
      let score = 0;
      if (document.querySelector('main')?.contains(el)) score += 8;
      if (/button|card|tile|gallery|paddle|tab|chapternav|localnav|modal|router|color|swatch/i.test(el.className || '')) score += 7;
      if (parseFloat(style.getPropertyValue('border-radius')) > 0) score += 6;
      if (style.getPropertyValue('clip-path') !== 'none') score += 8;
      if (style.getPropertyValue('mask-image') !== 'none' || style.getPropertyValue('-webkit-mask-image') !== 'none') score += 8;
      if (style.getPropertyValue('box-shadow') !== 'none') score += 5;
      if (isMeaningfulBorder(style)) score += 3;
      if (/linear-gradient|radial-gradient|conic-gradient/.test(bg) && !/IMG|VIDEO|SOURCE|PICTURE|SVG/.test(el.tagName)) score += 7;
      if (rect.width > 20 && rect.height > 20) score += 2;
      if (el.closest('#globalnav') && !/button|link|search|bag|apple/i.test(el.className || '')) score -= 6;
      return score;
    };
    const shapeNodes = [...document.querySelectorAll('*')].filter(el => !['HTML', 'BODY'].includes(el.tagName)).map(el => ({el, score: shapeScore(el)})).filter(({el, score}) => {
      if (score <= 0) return false;
      const style = getComputedStyle(el);
      const bg = style.getPropertyValue('background-image');
      return parseFloat(style.getPropertyValue('border-radius')) > 0 ||
        style.getPropertyValue('clip-path') !== 'none' ||
        style.getPropertyValue('mask-image') !== 'none' ||
        style.getPropertyValue('-webkit-mask-image') !== 'none' ||
        style.getPropertyValue('box-shadow') !== 'none' ||
        isMeaningfulBorder(style) ||
        (/linear-gradient|radial-gradient|conic-gradient/.test(bg) && !/IMG|VIDEO|SOURCE|PICTURE|SVG/.test(el.tagName));
    }).sort((a, b) => b.score - a.score).slice(0, 180).map(({el}, index) => ({
      id: `shape-dom-${index}`,
      selector: briefSelector(el),
      sourceUrl: location.href,
      styles: Object.fromEntries([...shapeProps, 'background-image'].map(prop => [prop, getComputedStyle(el).getPropertyValue(prop)]).filter(([prop, value]) => {
        if (!value || value === 'none') return false;
        if (prop === 'border' && !isMeaningfulBorder(getComputedStyle(el))) return false;
        return value !== '0px' && value !== '0px 0px 0px 0px' && value !== 'rgba(0, 0, 0, 0)';
      }))
    }));
    const inlineSvgs = [...document.querySelectorAll('svg')].map((svg, index) => {
      const label = svg.getAttribute('aria-label') || svg.closest('a,button,[aria-label]')?.getAttribute('aria-label') || textOf(svg.closest('a,button')) || svg.getAttribute('class') || 'inline svg';
      const html = new XMLSerializer().serializeToString(svg);
      const hasGeometry = /<(path|circle|rect|polygon|polyline|line|use|symbol|g)\b/i.test(html);
      let priority = 0;
      if (svg.closest('main')) priority += 10;
      if (svg.closest('#globalnav')) priority += 4;
      if (/icon|glyph|symbol|pictogram|badge|control|search|bag|apple|chevron|play|pause|plus|minus/i.test(`${label} ${svg.getAttribute('class') || ''}`)) priority += 5;
      if (!hasGeometry) priority -= 10;
      if (/<text\b/i.test(html)) priority -= 8;
      if (/^(Mac|iPad|iPhone|Watch|AirPods|TV & Home|Entertainment|Accessories|Support)$/i.test(label)) priority -= 8;
      return {index, label, html, priority};
    }).filter(svg => svg.priority > -4).sort((a, b) => b.priority - a.priority).slice(0, 220);
    const svgResources = [...rawDoc.querySelectorAll('img[src$=".svg"],source[src$=".svg"],link[href$=".svg"],object[data$=".svg"],use[href],use[xlink\\:href]')]
      .map(el => el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttribute('data'))
      .filter(Boolean)
      .filter(value => !value.startsWith('#'))
      .map(value => new URL(value, location.href).href);
    const rawResources = [...rawDoc.querySelectorAll('script[src],link[rel="stylesheet"][href]')]
      .map(el => ({url: new URL(el.getAttribute('src') || el.getAttribute('href'), location.href).href, kind: el.tagName.toLowerCase() === 'script' ? 'js' : 'css'}));
    return {
      title: document.title,
      url: location.href,
      rawTitle: rawDoc.title,
      headings,
      controls,
      localControls,
      computed,
      shapes: shapeNodes,
      inlineSvgs,
      svgResources: [...new Set(svgResources)],
      rawResources: unique(rawResources)
    };
    function unique(items) {
      const seen = new Set();
      return items.filter(item => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
    }
  }, {rawHtml, cssProps, shapeProps});
}

async function captureState(page, dir, pageId, candidate, index) {
  const before = await page.evaluate(selector => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      label: el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80),
      expanded: el.getAttribute('aria-expanded'),
      selected: el.getAttribute('aria-selected'),
      pressed: el.getAttribute('aria-pressed'),
      className: el.className,
      styles: {
        transform: style.transform,
        opacity: style.opacity,
        transitionDuration: style.transitionDuration,
        transitionTimingFunction: style.transitionTimingFunction,
        animationName: style.animationName,
        animationDuration: style.animationDuration
      }
    };
  }, candidate.selector);
  if (!before) return null;
  const beforeShot = path.join(dir, `state-${index}-before.png`);
  const afterShot = path.join(dir, `state-${index}-after.png`);
  await page.screenshot({path: beforeShot});
  const oldUrl = page.url();
  try {
    await page.locator(candidate.selector).first().click({timeout: 2500, trial: false});
    await page.waitForTimeout(650);
  } catch (error) {
    return {
      id: `${pageId}-state-${index}`,
      control: candidate,
      status: 'blocked',
      error: String(error).slice(0, 160),
      beforeScreenshot: webPath(beforeShot)
    };
  }
  if (page.url() !== oldUrl) {
    await page.goto(oldUrl, {waitUntil: 'domcontentloaded', timeout: 20000}).catch(() => {});
    return {
      id: `${pageId}-state-${index}`,
      control: candidate,
      status: 'blocked:navigation',
      beforeScreenshot: webPath(beforeShot)
    };
  }
  await page.screenshot({path: afterShot});
  const after = await page.evaluate(selector => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const style = getComputedStyle(el);
    return {
      expanded: el.getAttribute('aria-expanded'),
      selected: el.getAttribute('aria-selected'),
      pressed: el.getAttribute('aria-pressed'),
      className: el.className,
      styles: {
        transform: style.transform,
        opacity: style.opacity,
        transitionDuration: style.transitionDuration,
        transitionTimingFunction: style.transitionTimingFunction,
        animationName: style.animationName,
        animationDuration: style.animationDuration
      },
      dom: document.body.innerHTML.slice(0, 12000)
    };
  }, candidate.selector);
  await page.keyboard.press('Escape').catch(() => {});
  return {
    id: `${pageId}-state-${index}`,
    control: candidate,
    status: 'captured',
    before,
    after,
    beforeScreenshot: webPath(beforeShot),
    afterScreenshot: webPath(afterShot)
  };
}

function safeControlCandidates(data) {
  const seen = new Set();
  return data.localControls
    .filter(control => control.selector && !control.disabled)
    .filter(control => control.visible)
    .filter(control => !forbiddenControlText.test(`${control.label} ${control.href}`))
    .filter(control => control.tag !== 'a' || control.href.startsWith('#') || control.expanded !== null)
    .filter(control => {
      const key = `${control.selector}-${control.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
}

async function captureOne(browser, sourceUrl, index) {
  const pageId = `${String(index + 1).padStart(2, '0')}-${slug(sourceUrl)}`;
  const dir = path.join(pageRoot, pageId);
  await fs.mkdir(dir, {recursive: true});
  const context = await browser.newContext({viewport: {width: 1440, height: 1000}, deviceScaleFactor: 1});
  const page = await context.newPage();
  const pageResources = new Map();
  page.on('response', response => {
    const kind = kindFromResponse(response);
    if (!kind) return;
    const url = response.url();
    if (!/^https?:/.test(url)) return;
    pageResources.set(url, {response, kind});
  });
  try {
    const rawResponse = await page.request.get(sourceUrl, {timeout: 25000, maxRedirects: 4});
    const status = rawResponse.status();
    if (!rawResponse.ok()) {
      const failure = {url: sourceUrl, status: `blocked:${status}`, reason: rawResponse.statusText()};
      failures.push(failure);
      await context.close();
      return {id: pageId, title: '', url: sourceUrl, status: failure.status, desktopScreenshot: null, mobileScreenshot: null, headings: [], controls: [], states: [], computed: [], resources: [], svgIds: []};
    }
    const rawHtml = await rawResponse.text();
    await fs.writeFile(path.join(dir, 'raw.html'), rawHtml);
    await page.goto(sourceUrl, {waitUntil: 'domcontentloaded', timeout: 35000});
    await page.waitForTimeout(1700);
    const desktopScreenshot = path.join(dir, 'desktop.png');
    await page.screenshot({path: desktopScreenshot, fullPage: true});
    const desktopScroll = await scrollIncremental(page, dir, 'desktop');
    const data = await extractPageData(page, rawHtml);
    await fs.writeFile(path.join(dir, 'rendered.html'), await page.content());
    await fs.writeFile(path.join(dir, 'computed.json'), JSON.stringify(data.computed, null, 2));
    const candidates = safeControlCandidates(data);
    const states = [];
    for (let i = 0; i < candidates.length; i += 1) {
      const state = await captureState(page, dir, pageId, candidates[i], i);
      if (state) states.push(state);
    }

    await page.setViewportSize({width: 390, height: 844});
    await page.goto(sourceUrl, {waitUntil: 'domcontentloaded', timeout: 35000});
    await page.waitForTimeout(1300);
    const mobileScreenshot = path.join(dir, 'mobile.png');
    await page.screenshot({path: mobileScreenshot, fullPage: true});
    const mobileScroll = await scrollIncremental(page, dir, 'mobile');

    for (const {response, kind} of pageResources.values()) {
      try {
        const body = Buffer.from(await response.body());
        const entry = await writeResource(response.url(), body, kind, response.headers());
        pageResources.set(response.url(), {...entry, kind});
      } catch (error) {
        failures.push({url: response.url(), status: 'blocked', reason: String(error).slice(0, 180)});
      }
    }

    for (const url of data.svgResources) {
      if (globalResources.has(url)) continue;
      try {
        const response = await page.request.get(url, {timeout: 15000});
        if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
        await writeResource(url, Buffer.from(await response.body()), 'svg', response.headers());
      } catch (error) {
        failures.push({url, status: 'blocked', reason: String(error).slice(0, 180)});
      }
    }

    const svgIds = [];
    for (const svg of data.inlineSvgs) {
      const sanitized = sanitizeSvg(svg.html);
      if (!sanitized.trim() || /globalnav-link-text|visuallyhidden/i.test(sanitized)) continue;
      const hash = sha256(sanitized);
      if (!iconByHash.has(hash)) {
        const id = `icon-${shortHash(sanitized)}`;
        const filePath = path.join(iconRoot, `${id}.svg`);
        await fs.writeFile(filePath, sanitized);
        iconByHash.set(hash, {id, label: compactLabel(svg.label), file: webPath(filePath), sourceUrl: data.url});
      }
      svgIds.push(iconByHash.get(hash).id);
    }
    for (const shape of data.shapes) {
      if (!Object.keys(shape.styles).length) continue;
      const key = `${shape.sourceUrl}-${shape.selector}-${JSON.stringify(shape.styles)}`;
      shapesByKey.set(key, {...shape, id: `shape-${shortHash(key)}`});
    }
    await resolveSourceMaps(page);
    await context.close();
    const resources = uniqueByUrl([...pageResources.values()].filter(item => item.file).map(({url, file, kind}) => ({url, file, kind})));
    return {
      id: pageId,
      title: compactLabel(data.title || data.rawTitle),
      url: data.url,
      status: 'ok',
      desktopScreenshot: webPath(desktopScreenshot),
      mobileScreenshot: webPath(mobileScreenshot),
      headings: data.headings.map(h => ({level: h.level, text: compactLabel(h.text), selector: h.selector})),
      controls: {
        total: data.controls.length,
        localInventory: data.localControls.length,
        tested: states.length,
        untested: Math.max(0, data.localControls.length - states.length),
        items: data.localControls.slice(0, 80).map(c => ({label: compactLabel(c.label), selector: c.displaySelector || c.selector, tag: c.tag, expanded: c.expanded, controls: c.controls, visible: c.visible, inMain: c.inMain}))
      },
      states,
      computed: data.computed,
      resources,
      svgIds: [...new Set(svgIds)],
      rawDom: webPath(path.join(dir, 'raw.html')),
      renderedDom: webPath(path.join(dir, 'rendered.html')),
      scrollScreenshots: {desktop: desktopScroll, mobile: mobileScroll}
    };
  } catch (error) {
    failures.push({url: sourceUrl, status: 'blocked', reason: String(error).slice(0, 220)});
    await context.close().catch(() => {});
    return {id: pageId, title: '', url: sourceUrl, status: 'blocked', desktopScreenshot: null, mobileScreenshot: null, headings: [], controls: [], states: [], computed: [], resources: [], svgIds: []};
  }
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const lanes = Array.from({length: concurrency}, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      console.log(`Capture ${index + 1}/${items.length}: ${items[index]}`);
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(lanes);
  return results;
}

const pages = await runPool(urls, 2, (url, index) => captureOne(browser, url, index));
await browser.close();

const manifest = {
  capturedAt,
  browser: {name: 'Chrome for Testing', version, executablePath: chromePath},
  pages,
  icons: [...iconByHash.values()],
  motions: [...motionsByKey.values()].slice(0, 800),
  shapes: [...shapesByKey.values()].slice(0, 1000),
  resources: [...globalResources.values()].map(({url, file, kind, sha256}) => ({url, file, kind, sha256})),
  sourceMaps: [...globalSourceMaps.values()].map(entry => {
    const out = {url: entry.url, status: entry.status};
    if (entry.file) out.file = entry.file;
    return out;
  }),
  failures
};

await fs.writeFile(path.join(publicRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
await fs.writeFile(path.join(evidenceRoot, 'summary.json'), JSON.stringify({
  capturedAt,
  requestedUrls: urls,
  pages: pages.map(page => ({
    id: page.id,
    url: page.url,
    status: page.status,
    headings: page.headings?.length || 0,
    controls: page.controls?.total || 0,
    testedControls: page.states?.length || 0,
    resources: page.resources?.length || 0,
    svgIds: page.svgIds?.length || 0
  })),
  counts: {
    pages: pages.length,
    okPages: pages.filter(page => page.status === 'ok').length,
    icons: manifest.icons.length,
    motions: manifest.motions.length,
    shapes: manifest.shapes.length,
    resources: manifest.resources.length,
    sourceMaps: manifest.sourceMaps.length,
    failures: manifest.failures.length
  }
}, null, 2));
console.log(JSON.stringify({
  pages: manifest.pages.length,
  okPages: manifest.pages.filter(page => page.status === 'ok').length,
  icons: manifest.icons.length,
  motions: manifest.motions.length,
  shapes: manifest.shapes.length,
  resources: manifest.resources.length,
  sourceMaps: manifest.sourceMaps.length,
  failures: manifest.failures.length
}, null, 2));
