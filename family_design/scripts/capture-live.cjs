const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/home/kang/.claude/skills/gstack/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const out = path.resolve('/mnt/c/Users/kslee/Desktop/family-design/references');
fs.mkdirSync(out, { recursive: true });

async function capture(name, viewport) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const events = [];
  page.on('console', m => events.push({ type: 'console', text: m.text() }));
  page.on('pageerror', e => events.push({ type: 'pageerror', text: String(e) }));
  const started = Date.now();
  let response;
  try { response = await page.goto('https://family.co', { waitUntil: 'domcontentloaded', timeout: 30000 }); }
  catch (e) { events.push({ type: 'goto-error', text: String(e) }); }
  await page.waitForTimeout(2500);
  const meta = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const visible = all.filter(e => { const r=e.getBoundingClientRect(), s=getComputedStyle(e); return r.width>0 && r.height>0 && s.visibility!=='hidden' && s.display!=='none'; });
    const pick = (e) => { const s=getComputedStyle(e), r=e.getBoundingClientRect(); return {tag:e.tagName, cls: String(e.className||'').slice(0,160), text:(e.innerText||'').trim().slice(0,120), rect:{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}, color:s.color, background:s.backgroundColor, font:s.fontFamily, fontSize:s.fontSize, fontWeight:s.fontWeight, lineHeight:s.lineHeight, letterSpacing:s.letterSpacing, radius:s.borderRadius, shadow:s.boxShadow, opacity:s.opacity, transform:s.transform, transition:s.transition, animation:s.animation, position:s.position}; };
    const counts={}; visible.forEach(e=>{const s=getComputedStyle(e); for(const k of ['color','backgroundColor','fontFamily','fontSize','borderRadius','boxShadow','transition','animation']) counts[k]=(counts[k]||{}),counts[k][s[k]]=(counts[k][s[k]]||0)+1;});
    return {url:location.href,title:document.title,viewport:{w:innerWidth,h:innerHeight},body:{color:getComputedStyle(document.body).color,background:getComputedStyle(document.body).backgroundColor,font:getComputedStyle(document.body).fontFamily},elements:visible.slice(0,100).map(pick),counts,links:[...document.querySelectorAll('a')].slice(0,50).map(a=>({text:(a.innerText||'').trim(),href:a.href})),videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc||v.src,autoplay:v.autoplay,loop:v.loop,muted:v.muted,controls:v.controls})),images:[...document.images].slice(0,50).map(i=>({src:i.currentSrc||i.src,alt:i.alt,w:i.naturalWidth,h:i.naturalHeight}))};
  });
  await page.screenshot({ path: path.join(out, `live-${name}.png`), fullPage: true });
  await fs.promises.writeFile(path.join(out, `live-${name}.json`), JSON.stringify({meta, response: response && {status:response.status(),url:response.url()},elapsed:Date.now()-started,events}, null, 2));
  await browser.close();
}
(async()=>{ await capture('desktop',{width:1440,height:1000}); await capture('mobile',{width:390,height:844}); })().catch(e=>{console.error(e);process.exitCode=1});
