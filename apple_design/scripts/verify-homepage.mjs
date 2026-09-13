import {chromium} from '/home/kang/.claude/skills/gstack/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const results=[];
await page.setViewportSize({width:390,height:844});await page.goto('https://www.apple.com/');
const regionClose=page.locator('#ac-ls-close');if(await regionClose.isVisible())await regionClose.click();await page.waitForTimeout(1000);await page.screenshot({path:'evidence/source/mobile-clean.png'});
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
 await page.setViewportSize({width,height});await page.goto('http://localhost:4173/homepage.html');await page.waitForTimeout(600);
 await page.screenshot({path:`evidence/local/home-${name}.png`});
 for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=600){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(80);}
 await page.screenshot({path:`evidence/local/home-${name}-full.png`,fullPage:true});
 results.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(i=>i.currentSrc&&i.naturalWidth===0).map(i=>i.currentSrc),videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc,ready:v.readyState,error:v.error?.code})),gallery:document.querySelector('.media-gallery-dotnav-link[aria-selected="true"]')?.id})));
 const dot=page.locator('.media-gallery-dotnav-link').nth(1);await dot.scrollIntoViewIfNeeded();await dot.click();await page.waitForTimeout(700);results.at(-1).galleryChanged=await dot.getAttribute('aria-selected')==='true';
 if(width===390){const button=page.locator('.ac-gf-directory-column-section-title-button').first();await button.click();results.at(-1).footerExpanded=await button.getAttribute('aria-expanded')==='true';}
}
const compare=await browser.newPage({viewport:{width:1440,height:550},deviceScaleFactor:1});
for(const name of ['desktop','mobile']){
 const source=await fs.readFile(`evidence/source/${name}-clean.png`);const local=await fs.readFile(`evidence/local/home-${name}.png`);
 await compare.setContent(`<style>body{margin:0;font:14px Arial;display:flex;background:#eee}section{width:50%;text-align:center}img{width:auto;height:500px;max-width:100%;object-fit:contain}h3{margin:10px}</style><section><h3>Apple original</h3><img src="data:image/png;base64,${source.toString('base64')}"></section><section><h3>Local implementation</h3><img src="data:image/png;base64,${local.toString('base64')}"></section>`);await compare.screenshot({path:`evidence/local/comparison-${name}.png`});
}
await fs.writeFile('evidence/homepage-verification.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors},null,2));await browser.close();
