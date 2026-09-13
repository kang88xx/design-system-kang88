import {chromium} from '/home/kang/.claude/skills/gstack/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('app/public/interaction-lab');await fs.mkdir(root,{recursive:true});
const browser=await chromium.launch({executablePath:'/home/kang/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',headless:true});
const retryOnly=process.argv.includes('--retry');
const previous=retryOnly?JSON.parse(await fs.readFile(root+'/manifest.json','utf8')):null;
const records=previous?.records.filter(r=>r.status==='captured')||[];const scrollStudies=previous?.scrollStudies||[];
const groups=[
 {id:'mac',url:'https://www.apple.com/mac/',steps:[
  ['laptops','#product-tile-section-3-tab-1'],['desktops','#product-tile-section-3-tab-2'],['displays','#product-tile-section-3-tab-3'],['all-products','#product-tile-section-3-tab-0'],
  ['ecosystem-ipad','button:has-text("Mac and iPad")'],['ecosystem-watch','button:has-text("Mac and Apple")'],
  ['personal-setup-modal','main button:has-text("Learn more about your new Mac")']
 ]},
 {id:'iphone-pro',url:'https://www.apple.com/iphone-17-pro/',steps:[
  ['highlight-chip','#media-card-gallery-item-2-trigger'],['highlight-camera','#media-card-gallery-item-3-trigger'],
  ['open-colors','#control-tour-colors--button'],['blue','#colornav-value-Blue','label[for="colornav-value-Blue"]'],['silver','#colornav-value-Silver','label[for="colornav-value-Silver"]'],
  ['dual-capture','#new-camera-features-tab-1'],['stabilized-video','#new-camera-features-tab-2'],['center-stage','#new-camera-features-tab-3']
 ]},
 {id:'macbook-air',url:'https://www.apple.com/macbook-air/',steps:[
  ['silver','#finishes-gallery-item-2-trigger','label[for="finishes-gallery-item-2-trigger"]'],['starlight','#finishes-gallery-item-3-trigger','label[for="finishes-gallery-item-3-trigger"]'],['midnight','#finishes-gallery-item-4-trigger','label[for="finishes-gallery-item-4-trigger"]'],
  ['clipboard','#continuity-gallery-item-2-trigger'],['mirroring','#continuity-gallery-item-3-trigger'],['live-activities','#continuity-gallery-item-4-trigger'],['desk-view','#camera-audio-gallery-item-2-trigger'],['chip-modal','button:has-text("Go inside M5")']
 ]}
];
async function sample(page,selector){return page.evaluate(selector=>{
 const el=document.querySelector(selector);const properties=['transform','opacity','transition','animation','clip-path','border-radius','background-color'];
 const style=e=>Object.fromEntries(properties.map(p=>[p,getComputedStyle(e).getPropertyValue(p)]));
 const scope=el?.closest('section')||document.querySelector('main');
 return {scrollY,viewport:{width:innerWidth,height:innerHeight},target:el?{html:el.outerHTML,styles:style(el),checked:el.checked,selected:el.getAttribute('aria-selected'),expanded:el.getAttribute('aria-expanded')}:null,
 selected:[...document.querySelectorAll('main [aria-selected="true"],main input:checked,main [aria-expanded="true"]')].map(e=>({id:e.id,label:e.getAttribute('aria-label'),text:e.textContent?.trim().slice(0,80)})),
 dialogs:[...document.querySelectorAll('[role="dialog"],dialog,.modal')].filter(e=>getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().height>0).map(e=>({id:e.id,role:e.getAttribute('role'),label:e.getAttribute('aria-label'),text:e.textContent?.trim().slice(0,250)})),
 animated:[...document.getAnimations()].slice(0,60).map(a=>({type:a.constructor.name,name:a.animationName||a.transitionProperty,playState:a.playState,target:a.effect?.target?.className,timing:a.effect?.getComputedTiming(),keyframes:a.effect?.getKeyframes()})),
 transformed:[...scope?.querySelectorAll('*')||[]].filter(e=>getComputedStyle(e).transform!=='none').slice(0,35).map(e=>({tag:e.tagName,class:e.className,styles:style(e)}))};
 },selector.includes(':has-text')?'main':selector);}
for(const group of groups){
 const steps=retryOnly?group.steps.filter(([name])=>previous.records.some(r=>r.id===group.id+'-'+name&&r.status!=='captured')):group.steps;
 if(!steps.length)continue;
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});page.setDefaultTimeout(4500);
 try{await page.goto(group.url,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(1100);const close=page.locator('#ac-ls-close');if(await close.isVisible())await close.click();
 for(const [name,selector,clickSelector] of steps){
  const id=group.id+'-'+name;const entry={id,name,sourceUrl:group.url,selector,status:'pending'};
  try{
   if(group.id==='iphone-pro'&&['blue','silver'].includes(name)){
    const opener=page.locator('#control-tour-colors--button');
    if(!await page.locator(clickSelector).isVisible()){await opener.scrollIntoViewIfNeeded();await opener.click();await page.waitForTimeout(600);}
   }
   const target=page.locator(selector).first();const control=page.locator(clickSelector||selector).first();await control.scrollIntoViewIfNeeded();await page.waitForTimeout(900);
   const before=await sample(page,selector);await page.screenshot({path:root+'/'+id+'-before.png'});
   await control.click();const frames=[];
   for(const ms of [80,240,600]){await page.waitForTimeout(ms);frames.push({elapsed:frames.reduce((s,f)=>s+f.delay,0)+ms,delay:ms,...await sample(page,selector)});}
   await page.screenshot({path:root+'/'+id+'-after.png'});
   entry.status='captured';entry.label=await target.getAttribute('aria-label')||await target.textContent();entry.before=before;entry.frames=frames;entry.after=frames.at(-1);
   entry.beforeScreenshot='/interaction-lab/'+id+'-before.png';entry.afterScreenshot='/interaction-lab/'+id+'-after.png';
   await fs.writeFile(root+'/'+id+'.json',JSON.stringify(entry,null,2));entry.file='/interaction-lab/'+id+'.json';
   await page.keyboard.press('Escape');await page.waitForTimeout(150);
  }catch(error){entry.status='blocked';entry.error=String(error).slice(0,500);}
  records.push(entry);console.log(id,entry.status);
 }
 if(group.id!=='mac'&&!retryOnly){
  await page.evaluate(()=>scrollTo(0,0));const height=await page.evaluate(()=>document.body.scrollHeight-innerHeight);const samples=[];
  for(const progress of [0,.1,.25,.5,.75,1]){await page.evaluate(y=>scrollTo(0,y),height*progress);await page.waitForTimeout(450);samples.push({progress,...await sample(page,'main')});}
  const file='/interaction-lab/'+group.id+'-scroll.json';await fs.writeFile('app/public'+file,JSON.stringify(samples,null,2));scrollStudies.push({id:group.id,url:group.url,file,samples:samples.length});
 }
 }catch(error){records.push({id:group.id,status:'blocked',sourceUrl:group.url,error:String(error).slice(0,500)});}finally{await page.close();}
}
await fs.writeFile(root+'/manifest.json',JSON.stringify({capturedAt:new Date().toISOString(),browser:await browser.version(),records,scrollStudies},null,2));await browser.close();console.log('Captured',records.filter(r=>r.status==='captured').length,'of',records.length);
