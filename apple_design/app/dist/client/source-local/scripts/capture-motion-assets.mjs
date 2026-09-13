import {chromium} from '/apple_design/app/dist/client/home/kang/.claude/skills/gstack/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();const pending=[];const manifest=JSON.parse(await fs.readFile('app/public/extraction.json','utf8'));
page.on('response',r=>{if(/\.webm/.test(r.url())&&r.status()===200){pending.push((async()=>{const file=new URL(r.url()).pathname;const b=await r.body();await fs.mkdir(path.dirname('app/public'+file),{recursive:true});await fs.writeFile('app/public'+file,b);if(!manifest.resources.some(a=>a.file===file))manifest.resources.push({url:r.url(),file});})().catch(e=>console.log(String(e))));}});
for(const viewport of [{width:1440,height:1000},{width:1440,height:700},{width:900,height:900},{width:900,height:700},{width:390,height:844}]){
 await page.setViewportSize(viewport);await page.goto('https://www.apple.com/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-tile-id="bts-2026"]').scrollIntoViewIfNeeded();await page.waitForTimeout(900);
}
await Promise.all(pending);
const bases=[...new Set(manifest.resources.filter(r=>r.file.endsWith('.webm')).map(r=>r.file.slice(0,r.file.lastIndexOf('/')+1)))];
for(const base of bases)for(const size of ['small','medium','mediumtall','large','largetall']){
 const file=base+size+'.webm';if(manifest.resources.some(r=>r.file===file))continue;
 const url='https://www.apple.com'+file;const response=await fetch(url);if(!response.ok)continue;
 await fs.writeFile('app/public'+file,Buffer.from(await response.arrayBuffer()));manifest.resources.push({url,file});
}
await fs.writeFile('app/public/extraction.json',JSON.stringify(manifest,null,2));console.log('Videos saved',manifest.resources.filter(r=>r.file.endsWith('.webm')).length);await browser.close();
