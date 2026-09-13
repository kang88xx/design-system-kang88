import { chromium } from '/home/kang/.claude/skills/gstack/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const out = new URL('../evidence/source/', import.meta.url);
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({headless:true});
const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await page.goto('https://www.apple.com/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(3500);
await fs.writeFile(new URL('page.html',out),await page.content());
await page.screenshot({path:new URL('desktop.png',out).pathname});
for(let y=700;y<await page.evaluate(()=>document.body.scrollHeight);y+=800){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(180);}
await page.screenshot({path:new URL('desktop-full.png',out).pathname,fullPage:true});
const data=await page.evaluate(()=>({
 title:document.title,url:location.href,
 stylesheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>x.href),
 scripts:[...document.scripts].map(x=>x.src).filter(Boolean),
 media:[...document.querySelectorAll('img,video,source')].map(x=>({tag:x.tagName,src:x.currentSrc||x.src,srcset:x.srcset,alt:x.alt})),
 controls:[...document.querySelectorAll('button,input')].map(x=>({tag:x.tagName,label:x.getAttribute('aria-label'),text:x.textContent.trim().slice(0,100),id:x.id,class:x.className})),
 headings:[...document.querySelectorAll('h1,h2,h3')].map(x=>{const s=getComputedStyle(x);return {text:x.textContent.trim(),class:x.className,size:s.fontSize,line:s.lineHeight,weight:s.fontWeight,font:s.fontFamily,color:s.color,rect:x.getBoundingClientRect().toJSON()}}),
 backgrounds:[...document.querySelectorAll('*')].filter(x=>getComputedStyle(x).backgroundImage!=='none').map(x=>({class:x.className,image:getComputedStyle(x).backgroundImage})),
 navigation:[...document.querySelectorAll('#globalnav a')].map(x=>({text:x.textContent.trim(),label:x.getAttribute('aria-label'),href:x.href})),
 footer:document.querySelector('footer')?.innerText
}));
await fs.writeFile(new URL('desktop.json',out),JSON.stringify(data,null,2));
await page.evaluate(()=>scrollTo(0,0));
const mac=page.locator('.globalnav-link-mac').first();
if(await mac.count()){await mac.hover();await page.waitForTimeout(700);await page.screenshot({path:new URL('desktop-menu.png',out).pathname});}
await page.keyboard.press('Escape');
const search=page.locator('#globalnav-menubutton-link-search').first();
if(await search.count()){await search.click();await page.waitForTimeout(500);await page.screenshot({path:new URL('desktop-search.png',out).pathname});await fs.writeFile(new URL('search.html',out),await page.content());}
await page.setViewportSize({width:390,height:844});
await page.goto('https://www.apple.com/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(2200);
await page.screenshot({path:new URL('mobile.png',out).pathname});
for(let y=600;y<await page.evaluate(()=>document.body.scrollHeight);y+=750){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(120);}
await page.screenshot({path:new URL('mobile-full.png',out).pathname,fullPage:true});
await fs.writeFile(new URL('mobile.html',out),await page.content());
await page.evaluate(()=>scrollTo(0,0));
const menu=page.locator('#globalnav-menutrigger');
if(await menu.count()){await menu.click();await page.waitForTimeout(500);await page.screenshot({path:new URL('mobile-menu.png',out).pathname});}
console.log(JSON.stringify({title:data.title,headings:data.headings,stylesheets:data.stylesheets,controls:data.controls},null,2));
await browser.close();
