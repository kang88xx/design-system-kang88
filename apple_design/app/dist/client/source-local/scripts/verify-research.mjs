import {launchBrowser} from './browser-runtime.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const require=createRequire(new URL('../app/package.json',import.meta.url));
const postcss=require('postcss');
const manifest=JSON.parse(await fs.readFile('app/public/research/manifest.json','utf8'));
const checks=[],errors=[],missing=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
check('Thirteen captured page entries',manifest.pages.length===13);
check('Public access provenance explicit',manifest.scope?.access.includes('No authenticated'));
check('Meaningful geometry captured',manifest.shapes.length>20&&manifest.shapes.every(s=>Object.values(s.styles).some(v=>v!=='0px'&&v!=='0px none rgb(0, 0, 0)')));
const keyframes=manifest.motions.filter(m=>m.kind==='keyframes');
check('Complete keyframe rules parse',keyframes.length>0&&keyframes.every(m=>{const root=postcss.parse(m.css);return root.nodes.some(n=>n.type==='atrule'&&n.nodes?.length>0);}));
for(const entry of [...manifest.icons,...manifest.resources,...manifest.pages.flatMap(p=>p.resources||[])]){
 if(entry.file)await fs.access('app/public'+entry.file);
}
checks.push('All indexed local source paths exist');
for(const icon of manifest.icons){
 const svg=await fs.readFile('app/public'+icon.file,'utf8');
 check(`SVG inert ${icon.id}`,!/<script\b|<foreignObject\b|\son[a-z]+\s*=|javascript:/i.test(svg));
}
const archive=spawnSync('tar',['-tzf','app/public/research-source-kit.tar.gz'],{encoding:'utf8',maxBuffer:8*1024*1024});
check('Code archive valid and raster-free',archive.status===0&&!/\.(png|jpe?g|webp|gif|avif)$/im.test(archive.stdout));
const browser=await launchBrowser({headless:true});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith('http://localhost:4173')&&r.status()>=400)missing.push({url:r.url(),status:r.status()});});
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:width>800?1000:844});
  for(const route of ['pages','icons','shapes','observed-motion','interaction-states','research-sources']){
   await page.goto('http://localhost:4173/#'+route);await page.locator('.research-heading h2').waitFor();await page.waitForTimeout(250);
   console.log(route,width);
   if(route==='icons')await page.waitForFunction(()=>{const img=document.querySelector('.research-selected-icon img');return img?.complete&&img.naturalWidth>0;});
   check(`${route} no overflow at ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(width===1440||width===390)await page.screenshot({path:`evidence/local/research-${route}-${width}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:4173/#icons');
 await page.locator('.research-icon-grid button').first().waitFor();
 const query=page.getByPlaceholder('label, id, file');
 await query.fill(manifest.icons[0].id);check('Icon search filters results',await page.locator('.research-icon-grid button').count()===1);
 await query.fill('');await page.getByRole('button',{name:'Dark',exact:true}).click();
 check('Icon theme switches',await page.locator('.research-selected-icon').evaluate(e=>e.classList.contains('dark')));
 await page.getByRole('slider').fill('120');check('Icon size control',await page.locator('output').textContent()==='120px');
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Download',exact:true}).first().click();
 check('Actual SVG download',(await downloadPromise).suggestedFilename().endsWith('.svg'));
 await page.goto('http://localhost:4173/#shapes');await page.locator('.research-shape-grid iframe').first().waitFor();
 const shapeFrame=await page.locator('.research-shape-grid iframe').first().contentFrame();
 check('Shape declarations reach sandbox',await shapeFrame.locator('style').textContent().then(css=>css.includes('border-radius:')||css.includes('clip-path:')||css.includes('box-shadow:')||css.includes('background-image:')));
 await page.goto('http://localhost:4173/#observed-motion');await page.getByRole('button',{name:'Replay keyframes'}).waitFor();
 const motionFrame=page.frameLocator('iframe[title^="Motion replay"]');
 check('Keyframe preview has a bound animation',await motionFrame.locator('.target').evaluate(el=>getComputedStyle(el).animationName!=='none'));
 await page.getByRole('button',{name:'Replay keyframes'}).click();
 const before=await motionFrame.locator('.target').evaluate(el=>getComputedStyle(el).opacity+' '+getComputedStyle(el).transform);
 await page.waitForTimeout(140);
 const after=await motionFrame.locator('.target').evaluate(el=>getComputedStyle(el).opacity+' '+getComputedStyle(el).transform);
 check('Keyframe preview changes pixels over time',before!==after);
 await page.getByRole('button',{name:'Replay keyframes'}).click();
 await page.emulateMedia({reducedMotion:'reduce'});
 check('Reduced motion disables preview',await page.frameLocator('iframe[title^="Motion replay"]').locator('.target').evaluate(el=>getComputedStyle(el).animationName==='none'||el.getAnimations().length===0));
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.goto('http://localhost:4173/#research-sources');await page.getByPlaceholder('file, url, page').fill('observed-tokens.css');
 await page.locator('.research-source-list button').first().click();
 await page.waitForFunction(()=>document.querySelector('.research-source-reader')?.textContent.includes('--observed-'));
 checks.push('Observed token source opens');
 check('No runtime errors',errors.length===0);check('No missing local resources',missing.length===0);
 await fs.writeFile('evidence/research-verification.json',JSON.stringify({passed:true,checks,errors,missing,counts:{pages:manifest.pages.length,icons:manifest.icons.length,keyframes:keyframes.length,motions:manifest.motions.length,shapes:manifest.shapes.length,resources:manifest.resources.length},interactions:manifest.interactionSummary},null,2));
 console.log(JSON.stringify({passed:checks.length,errors,missing},null,2));
}finally{await browser.close();}
