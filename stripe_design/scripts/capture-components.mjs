// Focused component captures: nav menu, button states, hero background, footer, forms (contact/sales), dialog.
import { launchBrowser } from './browser-runtime.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const CAP = path.join(ROOT, 'captures/components'); await mkdir(CAP, { recursive: true });
const out = { capturedAt: new Date().toISOString(), items: [] };
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US', extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } });
const page = await ctx.newPage();
const styleOf = (loc, keys) => loc.evaluate((el, keys) => { const c = getComputedStyle(el); return Object.fromEntries(keys.map(k => [k, c.getPropertyValue(k)])); }, keys);
const BTN = ['background-color','color','border','border-radius','padding','font-size','font-weight','line-height','height','box-shadow','outline','transition','gap'];
async function shot(loc, name, pad = 8) { try { const b = await loc.boundingBox(); if (!b) return null; await page.screenshot({ path: path.join(CAP, name), clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 } }); return name; } catch (e) { return null; } }

await page.goto('https://stripe.com/', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(1000);
// hero background technique
out.items.push({ id: 'hero-background', ...(await page.evaluate(() => { const c = document.querySelector('canvas'); const r = c?.getBoundingClientRect(); const wrap = c?.parentElement; return { hasCanvas: !!c, canvasSize: c ? { w: r.width, h: r.height, cssW: c.style.width, transform: getComputedStyle(c).transform } : null, wrapperClass: wrap?.className?.toString().slice(0, 120), wrapperStyle: wrap ? { transform: getComputedStyle(wrap).transform, clipPath: getComputedStyle(wrap).clipPath, height: getComputedStyle(wrap).height } : null, webgl: !!(c && (c.getContext('webgl2') || c.getContext('webgl'))) }; })) });
// Buttons: primary/secondary + hover
const primary = page.locator('main .hds-button--primary:visible').first();
const secondary = page.locator('main .hds-button--secondary:visible, main .hds-button--secondary-on-quiet:visible').first();
for (const [name, loc] of [['button-primary', primary], ['button-secondary', secondary]]) {
  if (!(await loc.count())) continue;
  await loc.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0); await page.waitForTimeout(300);
  const rest = await styleOf(loc, BTN); const restShot = await shot(loc, `${name}-rest.png`);
  await loc.hover(); await page.waitForTimeout(450);
  const hover = await styleOf(loc, BTN); const hoverShot = await shot(loc, `${name}-hover.png`);
  await loc.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(350);
  const focus = await styleOf(loc, BTN); const focusShot = await shot(loc, `${name}-focus.png`, 12);
  out.items.push({ id: name, className: await loc.getAttribute('class'), text: (await loc.innerText()).trim(), html: (await loc.evaluate(e => e.outerHTML)).slice(0, 1200), rest, hover, focus, shots: [restShot, hoverShot, focusShot] });
  await page.mouse.move(0, 0);
}
// Nav: header + open Products menu
const header = page.locator('header').first();
out.items.push({ id: 'header', style: await styleOf(header, ['height','background-color','position','box-shadow','border-bottom','backdrop-filter','padding']), shot: await shot(header, 'header.png', 0) });
const products = page.getByRole('button', { name: /^Products/ }).first();
if (await products.count()) {
  await products.hover(); await page.waitForTimeout(900);
  const menu = page.locator('.hds-navigation-menu__viewport, [class*="navigation-menu__content"], .navigation__content').first();
  const menuStyle = (await menu.count()) ? await styleOf(menu, ['background-color','border-radius','box-shadow','padding','width','border','backdrop-filter']) : null;
  await page.screenshot({ path: path.join(CAP, 'nav-products-open.png'), clip: { x: 0, y: 0, width: 1440, height: 760 } });
  const menuHtml = (await menu.count()) ? (await menu.evaluate(e => e.outerHTML)).slice(0, 30000) : null;
  const menuLinks = await page.evaluate(() => [...document.querySelectorAll('.hds-navigation-menu__viewport a, .navigation__content a')].filter(a => a.getBoundingClientRect().height > 0).map(a => ({ text: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 80), href: a.getAttribute('href'), fs: getComputedStyle(a).fontSize, color: getComputedStyle(a).color })).slice(0, 80));
  out.items.push({ id: 'nav-products-menu', menuStyle, menuLinks, html: menuHtml, shot: 'nav-products-open.png' });
  await page.mouse.move(700, 850); await page.waitForTimeout(500);
}
// Nav link typography
const navBtn = page.locator('.hds-navigation-menu__trigger').first();
if (await navBtn.count()) out.items.push({ id: 'nav-trigger', style: await styleOf(navBtn, ['font-size','font-weight','color','padding','gap','letter-spacing','line-height']) });
// Footer
const footer = page.locator('footer').first();
if (await footer.count()) { await footer.scrollIntoViewIfNeeded(); await page.waitForTimeout(600); out.items.push({ id: 'footer', style: await styleOf(footer, ['background-color','color','padding','font-size','border-top']), headingStyle: await styleOf(footer.locator('h2,h3,h4,[class*="heading"]').first(), ['font-size','font-weight','color','letter-spacing','text-transform','margin']).catch(() => null), linkStyle: await styleOf(footer.locator('a').nth(3), ['font-size','font-weight','color','line-height','padding']).catch(() => null), shot: await shot(footer, 'footer.png', 0) }); }
// Sections: capture each main section fold as a labeled screenshot (first 8)
const sections = await page.evaluate(() => [...document.querySelectorAll('main > section, main > div > section, main section')].filter(s => s.getBoundingClientRect().height > 200).slice(0, 10).map((s, i) => ({ i, cls: s.className.toString().slice(0, 100), top: s.getBoundingClientRect().top + scrollY, h: s.getBoundingClientRect().height, bg: getComputedStyle(s).backgroundColor, bgi: getComputedStyle(s).backgroundImage.slice(0, 200), pad: getComputedStyle(s).padding, heading: s.querySelector('h1,h2,h3')?.innerText.trim().slice(0, 80) })));
for (const s of sections) { await page.evaluate((y) => scrollTo(0, y), s.top); await page.waitForTimeout(500); const name = `home-section-${String(s.i).padStart(2, '0')}.png`; await page.screenshot({ path: path.join(CAP, name), clip: { x: 0, y: 0, width: 1440, height: Math.min(900, Math.max(300, s.h)) } }); s.shot = name; }
out.items.push({ id: 'home-sections', sections });
// Stripe wordmark SVG
const logo = await page.evaluate(() => { const a = document.querySelector('header a[href="/"], header a[aria-label*="Stripe" i], a.Logo, [class*="logo"] svg'); const svg = a?.tagName === 'svg' ? a : a?.querySelector('svg'); return svg ? { html: svg.outerHTML, viewBox: svg.getAttribute('viewBox'), w: svg.getBoundingClientRect().width, h: svg.getBoundingClientRect().height, fill: getComputedStyle(svg).fill, color: getComputedStyle(svg).color } : null; });
out.items.push({ id: 'wordmark', ...logo });
// Pricing page: tabs / cards; Contact sales: form inputs
await page.goto('https://stripe.com/contact/sales', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(800);
const input = page.locator('input.hds-textinput:visible, .hds-textinput:visible').first();
if (await input.count()) {
  await input.scrollIntoViewIfNeeded();
  const rest = await styleOf(input, ['height','border','border-radius','padding','font-size','font-weight','color','background-color','box-shadow','outline']); const restShot = await shot(input.locator('xpath=..'), 'textinput-rest.png');
  await input.click(); await page.waitForTimeout(400);
  const focus = await styleOf(input, ['height','border','border-color','border-radius','box-shadow','outline','outline-offset']); const focusShot = await shot(input.locator('xpath=..'), 'textinput-focus.png', 12);
  const label = page.locator('.hds-label, label').first(); const labelStyle = (await label.count()) ? await styleOf(label, ['font-size','font-weight','color','line-height','margin']) : null;
  out.items.push({ id: 'textinput', rest, focus, labelStyle, shots: [restShot, focusShot], html: (await input.evaluate(e => e.closest('.hds-field')?.outerHTML || e.outerHTML)).slice(0, 3000) });
  const sel = page.locator('.hds-select, select').first(); if (await sel.count()) out.items.push({ id: 'select', style: await styleOf(sel, ['height','border','border-radius','padding','font-size','background-color','background-image']), shot: await shot(sel, 'select.png') });
  const chk = page.locator('.hds-checkbox').first(); if (await chk.count()) out.items.push({ id: 'checkbox', style: await styleOf(chk.locator('input'), ['width','height','border','border-radius','background-color']), shot: await shot(chk, 'checkbox.png') });
  await page.screenshot({ path: path.join(CAP, 'contact-sales-form.png'), fullPage: false });
}
// Pricing page components (tags / pricing cards / tabs)
await page.goto('https://stripe.com/pricing', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await page.waitForTimeout(800);
const tag = page.locator('.hds-tag:visible').first(); if (await tag.count()) out.items.push({ id: 'tag', style: await styleOf(tag, ['font-size','font-weight','color','background-color','border','border-radius','padding','gap','line-height']), text: await tag.innerText(), shot: await shot(tag, 'tag.png') });
const tabs = page.locator('[role=tablist]:visible').first(); if (await tabs.count()) { const t = tabs.locator('[role=tab]').first(); out.items.push({ id: 'tabs', tab: await styleOf(t, ['font-size','font-weight','color','padding','border-bottom','border-radius','background-color']), selected: await styleOf(tabs.locator('[aria-selected=true]').first(), ['color','border-bottom','background-color','font-weight']).catch(() => null), shot: await shot(tabs, 'tabs.png') }); }
const accordion = page.locator('.hds-details:visible, details:visible').first(); if (await accordion.count()) { await accordion.scrollIntoViewIfNeeded(); out.items.push({ id: 'accordion', summary: await styleOf(accordion.locator('summary').first(), ['font-size','font-weight','color','padding','border-bottom']).catch(() => null), shot: await shot(accordion, 'accordion-closed.png') }); await accordion.locator('summary').first().click().catch(() => {}); await page.waitForTimeout(500); await shot(accordion, 'accordion-open.png'); }
await page.screenshot({ path: path.join(CAP, 'pricing-fold.png') });
await writeFile(path.join(ROOT, 'data/raw/component-captures.json'), JSON.stringify(out, null, 1));
await browser.close();
console.log('captured', out.items.map(i => i.id).join(', '));
