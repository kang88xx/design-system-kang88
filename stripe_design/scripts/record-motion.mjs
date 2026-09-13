// Record looping clips of interactions (hover, tabs, accordion, carousel, nav) and motion targets (CSS/WAAPI animations, canvas, video, DOM graphics).
// Uses Playwright video recording + ffmpeg (Homebrew) to cut/crop each clip. Usage: node scripts/record-motion.mjs [--only=/,/payments] [--limit=N]
import { launchBrowser } from './browser-runtime.mjs';
import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const exec = promisify(execFile);
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const EFF = path.join(ROOT, 'data/raw/effects'); const OUT = path.join(ROOT, 'captures/clips'); const RAW = path.join(ROOT, 'data/raw/clips'); const TMP = path.join(ROOT, 'data/raw/clips/_video');
for (const d of [OUT, RAW, TMP]) await mkdir(d, { recursive: true });
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
const slugs = (await readdir(EFF)).filter(f => f.endsWith('.json') && !f.startsWith('_')).map(f => f.replace('.json', ''));
const only = args.only ? args.only.split(',').map(p => p === '/' ? 'home' : p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()) : null;
const list = (only || slugs).slice(0, Number(args.limit || 100));
const W = 1440, H = 900;
const CURSOR = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="24" viewBox="0 0 18 24"><path d="M2 2l6 17 2.5-6.5L17 10z" fill="#fff" stroke="#0a2540" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const browser = await launchBrowser();
for (const slug of list) {
  const data = JSON.parse(await readFile(path.join(EFF, slug + '.json'), 'utf8'));
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: TMP, size: { width: W, height: H } }, locale: 'en-US', extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } });
  const page = await ctx.newPage(); const t0 = Date.now(); const now = () => Date.now() - t0;
  const clips = []; const entry = { slug, url: data.url, recordedAt: new Date().toISOString(), clips };
  try {
    await page.goto(data.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    for (const t of ['Accept all', 'Accept', 'Agree']) { const b = page.getByRole('button', { name: t, exact: false }).first(); try { if (await b.isVisible({ timeout: 250 })) { await b.click({ timeout: 800 }); break; } } catch {} }
    // fake cursor overlay
    await page.evaluate((svg) => { const c = document.createElement('div'); c.id = 'ds-cursor'; c.innerHTML = svg; Object.assign(c.style, { position: 'fixed', left: '-100px', top: '-100px', zIndex: 2147483647, pointerEvents: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))', transition: 'left .25s ease, top .25s ease' }); document.body.appendChild(c); }, CURSOR);
    const cursor = async (x, y) => { await page.evaluate(([x, y]) => { const c = document.getElementById('ds-cursor'); if (c) { c.style.left = x + 'px'; c.style.top = y + 'px'; } }, [x, y]); await page.mouse.move(x, y, { steps: 8 }); };
    const hideCursor = () => cursor(-100, -100);
    // Lazy-load everything once (also re-tags elements by data-ds-id? ids were set by the deep pass and are not persisted, so re-locate by path signature)
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(100); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(400);
    const locateByPath = (p) => { const last = p.split(' > ').pop(); const [tag, ...cls] = last.split('.'); const sel = tag + cls.map(c => '.' + CSS.escape(c)).join(''); return sel; };
    const findEl = async (item) => { const sel = await page.evaluate((p) => { const last = p.split(' > ').pop(); const [tag, ...cls] = last.split('.'); return tag + cls.map(c => '.' + CSS.escape(c)).join(''); }, item.path); const loc = page.locator(sel).filter({ visible: true }); const n = await loc.count(); if (!n) return null; // pick the one whose size matches best
      let best = null, bestD = 1e9; for (let i = 0; i < Math.min(n, 12); i++) { const bb = await loc.nth(i).boundingBox().catch(() => null); if (!bb) continue; const d = Math.abs(bb.width - item.rect.w) + Math.abs(bb.height - item.rect.h); if (d < bestD) { bestD = d; best = loc.nth(i); } } return best; };
    const viewportRect = async (loc, pad = 8) => { const bb = await loc.boundingBox(); if (!bb) return null; const x = Math.max(0, Math.floor(bb.x - pad)), y = Math.max(0, Math.floor(bb.y - pad)); const w = Math.min(W - x, Math.ceil(bb.width + pad * 2)), hh = Math.min(H - y, Math.ceil(bb.height + pad * 2)); return { x, y, w: w - (w % 2), h: hh - (hh % 2) }; };
    const settle = async (loc) => { await loc.scrollIntoViewIfNeeded({ timeout: 4000 }); await page.evaluate(() => { const y = scrollY; scrollTo(0, y); }); await page.waitForTimeout(500); };
    const record = async (id, kind, label, loc, action, dur) => { try { await settle(loc); const rect = await viewportRect(loc); if (!rect || rect.w < 40 || rect.h < 24) return; const start = now(); await action(loc, rect); const remain = dur - (now() - start); if (remain > 0) await page.waitForTimeout(remain); clips.push({ id, kind, label, start, end: now(), rect }); } catch (e) { clips.push({ id, kind, label, error: String(e).slice(0, 120) }); } };
    const hoverAction = async (loc, rect) => { const bb = await loc.boundingBox(); await cursor(bb.x + bb.width * 0.55, bb.y + bb.height * 0.55); await page.waitForTimeout(1100); await cursor(bb.x - 40, bb.y + bb.height + 40); await page.waitForTimeout(900); };
    // 1) hover boxes (those with hover delta first, then interactive)
    const boxes = [...(data.boxes || []).filter(b => b.hoverDelta), ...(data.boxes || []).filter(b => !b.hoverDelta && b.interactive && b.rect.w >= 200)].slice(0, 5);
    for (const b of boxes) { const loc = await findEl(b); if (loc) await record(b.id, 'box-hover', b.sig, loc, hoverAction, 2400); }
    // 2) generic interactions
    const gen = [
      ['tabs', 'tabs: click 2nd tab', page.locator('[role=tablist] [role=tab]').filter({ visible: true }).nth(1), async (l) => { const bb = await l.boundingBox(); await cursor(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(300); await l.click({ timeout: 3000 }); await page.waitForTimeout(1500); }],
      ['accordion', 'accordion: open item', page.locator('details summary, .hds-accordion summary, [class*=Accordion] button').filter({ visible: true }).first(), async (l) => { const bb = await l.boundingBox(); await cursor(bb.x + 30, bb.y + bb.height / 2); await page.waitForTimeout(300); await l.click({ timeout: 3000 }); await page.waitForTimeout(1400); await l.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(900); }],
      ['carousel', 'carousel: next', page.locator('button[aria-label*="next" i], [class*=arousel] button[class*=next]').filter({ visible: true }).first(), async (l) => { const bb = await l.boundingBox(); await cursor(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(300); await l.click({ timeout: 3000 }); await page.waitForTimeout(1600); }],
      ['segmented', 'segmented control: 2nd option', page.locator('[class*=SegmentedControl] button, [role=radiogroup] [role=radio]').filter({ visible: true }).nth(1), async (l) => { const bb = await l.boundingBox(); await cursor(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(300); await l.click({ timeout: 3000 }); await page.waitForTimeout(1500); }],
      ['nav', 'nav: open Products', page.locator('header button:has-text("Products"), nav button:has-text("Products"), header a:has-text("Products")').filter({ visible: true }).first(), async (l) => { const bb = await l.boundingBox(); await cursor(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(1800); await cursor(700, 860); await page.waitForTimeout(800); }],
      ['link', 'link hover arrow', page.locator('main a.hds-link, main a.CtaButton--arrow, main a[class*=Link]:has(svg)').filter({ visible: true }).nth(1), hoverAction],
      ['button', 'primary button hover', page.locator('main .hds-button--primary, main .CtaButton.variant--Button').filter({ visible: true }).first(), hoverAction],
    ];
    for (const [id, label, loc, action] of gen) { if (!(await loc.count().catch(() => 0))) continue; const container = id === 'nav' ? page.locator('body') : id === 'link' || id === 'button' ? loc : loc.locator('xpath=ancestor-or-self::*[self::section or self::div][1]'); await record('x-' + id, 'interaction', label, loc, async (l) => { await action(l); }, 2600).then(async () => { const c = clips[clips.length - 1]; if (c && !c.error) { const r = id === 'nav' ? { x: 0, y: 0, w: W, h: 760 } : await viewportRect(container).catch(() => null); if (r && r.w >= 40) c.rect = r; } }); await hideCursor(); }
    // 3) motion targets: CSS animations, canvas/video/dom-graphic illustrations
    const motion = [...(data.animated || []).filter(a => a.rect.w >= 80 && a.rect.h >= 40 && a.animation.name !== 'detect-scroll').slice(0, 3), ...(data.illos || []).filter(i => ['canvas', 'video', 'dom-graphic'].includes(i.kind) && i.rect.w >= 160).slice(0, 4)];
    for (const m of motion) { const loc = await findEl(m); if (loc) await record(m.id, 'motion', m.animation?.name || m.kind, loc, async () => { await page.waitForTimeout(100); }, 3200); }
    entry.ok = true;
  } catch (e) { entry.ok = false; entry.error = String(e).slice(0, 300); }
  const videoPath = await page.video()?.path();
  await ctx.close();
  // cut + crop with ffmpeg
  const lead = 0.15;
  for (const c of clips) {
    if (c.error || !videoPath) continue;
    const file = `${slug}-${c.id}.mp4`; const dur = Math.max(1.2, (c.end - c.start) / 1000 - lead);
    const scale = c.rect.w > 720 ? `,scale=720:-2` : '';
    try { await exec(FFMPEG, ['-y', '-loglevel', 'error', '-ss', ((c.start / 1000) + lead).toFixed(2), '-i', videoPath, '-t', dur.toFixed(2), '-vf', `crop=${c.rect.w}:${c.rect.h}:${c.rect.x}:${c.rect.y}${scale},fps=15`, '-c:v', 'libx264', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(OUT, file)]); c.file = `captures/clips/${file}`; c.seconds = +dur.toFixed(2); } catch (e) { c.error = 'ffmpeg: ' + String(e).slice(0, 120); }
  }
  if (videoPath) await rm(videoPath, { force: true });
  await writeFile(path.join(RAW, slug + '.json'), JSON.stringify(entry, null, 1));
  console.log(JSON.stringify({ slug, ok: entry.ok, clips: clips.filter(c => c.file).length, failed: clips.filter(c => c.error).length, kinds: clips.filter(c => c.file).map(c => c.kind + ':' + c.id).join(' ') }));
}
await browser.close();
console.log('done');
