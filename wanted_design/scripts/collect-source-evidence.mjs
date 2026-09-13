import { launchBrowser } from './browser-runtime.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('captures/refresh', { recursive: true });
const browser=await launchBrowser();
const page=await browser.newPage({viewport:{width:1440,height:1080},deviceScaleFactor:1});
const observations=[];
for(const [name,path] of [['home','/'],['button','/docs/components/actions/button/web'],['animation','/docs/utilities/web-utility-components/animation-presence'],['interaction','/docs/utilities/web-utility-components/with-interaction'],['gradient','/docs/utilities/web-utilities/gradient']]){
 const response=await page.goto('https://montage.wanted.co.kr'+path,{waitUntil:'networkidle'});
 if(name==='home') {
  const live = await page.evaluate(() => ({url:location.href,at:new Date().toISOString(),animations:document.getAnimations().map(a=>({target:a.effect.target?.outerHTML.slice(0,300),timing:a.effect.getTiming(),keyframes:a.effect.getKeyframes()})),scripts:[...document.scripts].map(s=>s.src).filter(Boolean),styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(s=>s.href)}));
  await writeFile('data/raw/live-home-evidence.json', JSON.stringify(live, null, 2));
 }
 for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=750){await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(170);}
 await page.waitForTimeout(900);await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(800);
 await page.screenshot({path:`captures/refresh/source-${name}.png`,fullPage:name==='home'});
 const result=await page.evaluate(()=>{
 const rules=[];for(const sheet of document.styleSheets){try{for(const r of sheet.cssRules)rules.push(r.cssText)}catch{}}
 const picked=[...document.querySelectorAll('button,a,[data-role],input,[role="switch"]')].filter(el=>el.getBoundingClientRect().width>0).slice(0,150).map(el=>{const s=getComputedStyle(el);return {tag:el.tagName,role:el.getAttribute('data-role')||el.getAttribute('role'),text:el.textContent.trim().slice(0,100),class:el.className,styles:Object.fromEntries(['backgroundColor','color','borderRadius','boxShadow','transition','animation','transform','padding','height'].map(k=>[k,s[k]]))}});
 return {url:location.href,title:document.title,at:new Date().toISOString(),rules,picked,code:[...document.querySelectorAll('pre')].map(el=>el.innerText),assets:[...document.querySelectorAll('img,video,source')].map(el=>({tag:el.tagName,url:el.currentSrc||el.src,srcset:el.srcset,alt:el.alt})),animations:document.getAnimations().map(a=>({target:a.effect.target?.outerHTML.slice(0,180),timing:a.effect.getTiming(),keyframes:a.effect.getKeyframes()}))};});
 result.status=response.status();observations.push(result);console.log(name,result.status,result.rules.length);
 if(name==='home'){
  const faq=page.getByText('몽타주는 상업적 사용이 가능한가요?',{exact:true});if(await faq.count()){await faq.click();await page.waitForTimeout(400);await page.screenshot({path:'captures/refresh/source-faq-open.png'});}
 }
}
await writeFile('data/raw/site-observations.json',JSON.stringify({collectedAt:new Date().toISOString(),source:'https://montage.wanted.co.kr',pages:observations},null,2));
await page.goto('https://montage.wanted.co.kr/',{waitUntil:'networkidle'});
if (process.argv.includes('--crawl')) {
console.log('collecting complete public documentation');
const source=await readFile('scripts/collect-montage-browser.js','utf8');
const raw=await page.evaluate(async source=>{const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;return await new AsyncFunction(source)();},source);
await writeFile('data/raw/montage-live.json',typeof raw==='string'?raw:JSON.stringify(raw,null,2));
console.log('live crawl saved');
}
await browser.close();
