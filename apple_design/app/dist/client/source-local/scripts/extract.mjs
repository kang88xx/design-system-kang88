import {chromium} from '/apple_design/app/dist/client/home/kang/.claude/skills/gstack/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('app/public');
const base='https://www.apple.com';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const captured=new Map();
const pending=[];
page.on('response',r=>{if(/wss\/fonts/.test(r.url()))pending.push(r.body().then(b=>captured.set(r.url(),b)).catch(()=>{}));});
await page.goto(base,{waitUntil:'domcontentloaded'});
await page.waitForTimeout(1000);
const raw=await (await page.request.get(base)).text();
const result=await page.evaluate(raw=>{
 const doc=new DOMParser().parseFromString(raw,'text/html');
 const urls=new Set();
 const abs=x=>new URL(x,'https://www.apple.com').href;
 const resources='img[src],source[src],video[src],script[src],link[rel="stylesheet"]';
 doc.querySelectorAll(resources).forEach(x=>{const v=x.getAttribute('src')||x.getAttribute('href');if(v&&!v.startsWith('data:'))urls.add(abs(v));});
 doc.querySelectorAll('[srcset],[data-srcset]').forEach(x=>{for(const value of [x.getAttribute('srcset'),x.getAttribute('data-srcset')])if(value&&!value.startsWith('data:'))value.split(',').forEach(v=>urls.add(abs(v.trim().split(/\s+/)[0])));});
 document.querySelectorAll('video').forEach(v=>{if(v.currentSrc)urls.add(v.currentSrc)});
 doc.querySelectorAll('a[href$=".ics"]').forEach(x=>urls.add(abs(x.getAttribute('href'))));
 const nav=[...document.querySelectorAll('.globalnav-item')].map(el=>({name:el.querySelector('.globalnav-link-text')?.textContent,groups:[...el.querySelectorAll('.globalnav-submenu-group')].map(g=>({title:g.querySelector('h2')?.textContent,links:[...g.querySelectorAll('a')].map(a=>({label:a.textContent,url:a.href}))}))})).filter(x=>x.groups.length);
 const tiles=[...doc.querySelectorAll('[data-tile-id]')].map(el=>({id:el.dataset.tileId,title:el.querySelector('h2,h3')?.textContent.trim()||el.querySelector('picture img')?.alt||el.dataset.tileId,html:el.outerHTML}));
 const properties=['font-family','font-size','font-weight','line-height','letter-spacing','color','background-color','border-radius','padding','gap','transition','animation','height','max-width'];
 const selectors=['.tile-headline','.tile-subhead','.button','.button-secondary','#globalnav','.globalnav-flyout','.globalnav-submenu-link','.globalnav-flyout-content','.section-hero .tile-wrapper','.section-promo .tile-wrapper','.media-gallery-item','.media-gallery-item-container','.dotnav-item'];
 const computed=selectors.map(selector=>{const el=document.querySelector(selector);if(!el)return {selector};const style=getComputedStyle(el);return {selector,values:Object.fromEntries(properties.map(p=>[p,style.getPropertyValue(p)]))};});
 doc.querySelectorAll('script').forEach(s=>{if((!s.src&&s.id!=='__ACGH_DATA__')||/metrics|analytics|pricing|localeswitcher|\/scripts\/home\.built\.js/.test(s.src))s.remove();});
 const icons=Object.fromEntries(['apple','search','bag'].map(name=>[name,document.querySelector('.globalnav-link-'+name+' svg')?.outerHTML]));
 icons.chevron=document.querySelector('.globalnav-link-chevron svg')?.outerHTML;
 doc.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(h.startsWith('/')&&!h.endsWith('.ics'))a.setAttribute('href',abs(h));});
 doc.querySelectorAll('link[rel="canonical"],meta[property="og:image"]').forEach(x=>x.remove());
 doc.title='Apple Homepage | Local Reference';
 const apiScript=doc.createElement('script');apiScript.src='/apple_design/app/dist/client/local-api.js';doc.head.prepend(apiScript);
 doc.querySelectorAll('link[rel="stylesheet"]').forEach(el=>{if(el.getAttribute('href').includes('/apple_design/app/dist/client/wss/fonts?'))el.setAttribute('href','/apple_design/app/dist/client/fonts/source-fonts.css');});
 const script=doc.createElement('script');script.src='/apple_design/app/dist/client/reference-adapter.js';script.defer=true;doc.body.append(script);
 return {html:'<!doctype html>\n'+doc.documentElement.outerHTML,urls:[...urls],nav,tiles,computed,icons};
},raw);
await fs.mkdir(root,{recursive:true});
await fs.mkdir('evidence/source',{recursive:true});
await fs.writeFile('evidence/source/original.html',raw);
const map=new Map(); const failures=[];
await Promise.all(pending);
const local=url=>{const u=new URL(url);return u.hostname==='www.apple.com'?(u.pathname==='/apple_design/app/dist/client/wss/fonts'?'/apple_design/app/dist/client/fonts/source-fonts.css':u.pathname):'/apple_design/app/dist/client/external/'+u.hostname+u.pathname;};
async function download(url){
 if(map.has(url)||/metrics|analytics|pricing|localeswitcher/.test(url))return;
 const file=local(url);map.set(url,file);
 try{
  const response=captured.has(url)?null:await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(response&&!response.ok)throw new Error(String(response.status));
  let data=captured.get(url)||Buffer.from(await response.arrayBuffer());
  const type=response?.headers.get('content-type')||(url.includes('/apple_design/app/dist/client/wss/fonts?')?'text/css':'');
  if(type.includes('text/css')||file.endsWith('.css')){
   let css=data.toString();const refs=[...css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)].map(m=>m[1]).filter(s=>!s.startsWith('data:')&&!s.startsWith('#'));
   for(const ref of new Set(refs)){const target=new URL(ref,url).href;await download(target);css=css.replaceAll(ref,local(target));}
   data=Buffer.from(css);
  }
  await fs.mkdir(path.dirname(root+file),{recursive:true});await fs.writeFile(root+file,data);
 }catch(e){failures.push({url,error:String(e)});map.delete(url);}
}
const urls=result.urls;
for(let i=0;i<urls.length;i+=12){await Promise.all(urls.slice(i,i+12).map(download));if(i%60===0)console.log('Resources',i,'/',urls.length);}
let html=result.html;
for(const [url,file] of map)html=html.replaceAll(url.replaceAll('&','&amp;'),file).replaceAll(url,file);
await fs.writeFile(root+'/apple_design/app/dist/client/homepage.html',html);
await fs.writeFile(root+'/apple_design/app/dist/client/extraction.json',JSON.stringify({source:base,capturedAt:new Date().toISOString(),...Object.fromEntries(['nav','tiles','computed','icons'].map(k=>[k,result[k]])),resources:[...map].map(([url,file])=>({url,file})),failures},null,2));
await fs.writeFile('evidence/source/computed.json',JSON.stringify(result.computed,null,2));
await browser.close();
console.log(JSON.stringify({downloaded:map.size,failures},null,2));
