import { readFile, writeFile } from 'node:fs/promises';
import { browserRuntime } from './browser-runtime.mjs';

const capture = JSON.parse(await readFile('data/toss-source-capture.json', 'utf8'));
const browser = await browserRuntime();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'ko-KR' });
  const stylesheets = await Promise.all(capture.documents.filter(d => d.type === 'stylesheet').map(async d => ({ ...d, css: await readFile(d.localPath, 'utf8') })));
  capture.stylesheetRules = await page.evaluate(files => {
    const result = [];
    for (const file of files) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(file.css);
      const walk = (rules, context = '') => {
        for (const rule of rules) {
          if (rule.type === CSSRule.KEYFRAMES_RULE || rule.type === CSSRule.FONT_FACE_RULE) result.push({ kind: rule.type === CSSRule.KEYFRAMES_RULE ? 'keyframes' : 'font', css: rule.cssText, url: file.url, context });
          else if (rule.style) {
            const values = Object.fromEntries([...rule.style].map(p => [p, rule.style.getPropertyValue(p)]));
            if (Object.keys(values).some(p => p.startsWith('--'))) result.push({ kind: 'tokens', selector: rule.selectorText, values: Object.fromEntries(Object.entries(values).filter(([p]) => p.startsWith('--'))), url: file.url, context });
            if (/:hover|:focus|:active|:disabled/.test(rule.selectorText || '')) result.push({ kind: 'state', css: rule.cssText, selector: rule.selectorText, values, url: file.url, context });
            for (const [property, value] of Object.entries(values)) {
              if (/gradient\(/.test(value)) result.push({ kind: 'gradient', property, value, selector: rule.selectorText, url: file.url, context });
            }
          }
          if (rule.cssRules && rule.type !== CSSRule.KEYFRAMES_RULE) walk(rule.cssRules, rule.conditionText || context);
        }
      };
      walk(sheet.cssRules);
    }
    return result;
  }, stylesheets);
  await page.goto(capture.sourceUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const states = [];
  const controls = page.locator('a,button');
  for (let i = 0; i < Math.min(18, await controls.count()); i++) {
    const control = controls.nth(i);
    if (!await control.isVisible()) continue;
    const read = el => { const s = getComputedStyle(el); return { color: s.color, background: s.background, transform: s.transform, opacity: s.opacity, transition: s.transition, outline: s.outline }; };
    try {
      await page.mouse.move(1400, 600);
      const normal = await control.evaluate(read);
      await control.hover({ timeout: 2000 });
      await page.waitForTimeout(450);
      const hover = await control.evaluate(read);
      await control.focus();
      const focus = await control.evaluate(read);
      states.push({ label: (await control.innerText()).slice(0, 80) || await control.getAttribute('aria-label') || 'Icon control', normal, hover, focus, evidence: 'observed' });
    } catch { /* Skip controls not reachable in this viewport. */ }
  }
  capture.captures[0].interactionStates = states;
  // Older snapshots used scroll position for unanchored nodes: preserve it as inferred, never as an observed DOM ancestor.
  for (const c of capture.captures) {
    for (const g of c.groups) for (const s of g.samples) s.sectionAttribution = 'inferred from snapshot layout';
    for (const m of c.media) m.sectionAttribution = 'inferred from snapshot layout';
  }
  capture.enrichedAt = new Date().toISOString();
  await writeFile('data/toss-source-capture.json', JSON.stringify(capture, null, 2) + '\n');
  console.log(JSON.stringify({ stylesheets: stylesheets.length, rules: capture.stylesheetRules.length, desktopStates: states.length }));
} finally { await browser.close(); }
