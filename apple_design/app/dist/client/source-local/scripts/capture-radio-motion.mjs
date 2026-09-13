import fs from 'node:fs/promises';
import path from 'node:path';
import {launchBrowser} from './browser-runtime.mjs';
import {deriveMotionTracks} from './runtime-tracks.mjs';
import {hash} from './source-analysis.mjs';
const pub=path.resolve('app/public');
const saved=JSON.parse(await fs.readFile(path.join(pub,'research/manifest.json')));
const extras=[['00-www-apple-com-home','Apple','/'],['14-www-apple-com-mac-mini','Mac mini','/mac-mini/'],['15-www-apple-com-ipad-air','iPad Air','/ipad-air/'],['16-www-apple-com-ipad-pro','iPad Pro','/ipad-pro/']];
const pages=[...saved.pages,...extras.map(([id,title,url])=>({id,title,url:'https://www.apple.com'+url}))];
const output={generatedAt:new Date().toISOString(),scope:'Supplemental native radio/checkbox state and associated visible label interactions',coverage:[],records:[],resources:[]};
await fs.mkdir(path.join(pub,'research/runtime-radio/records'),{recursive:true});await fs.mkdir(path.join(pub,'research/runtime-sources'),{recursive:true});
const browser=await launchBrowser();
const sourcePromises=[];
const observed=new Map();
async function snapshot(page,inputId){return page.evaluate(inputId=>{
 const input=document.querySelector(`[data-motion-input="${inputId}"]`);
 const scope=input?.closest('section,article,[role="dialog"],main')||document;
 const properties=['transform','opacity','clip-path','filter','height','max-height','background-color','visibility'];
 function selector(element){if(element.id&&document.querySelectorAll('#'+CSS.escape(element.id)).length===1)return '#'+CSS.escape(element.id);const parts=[];while(element&&element!==document.documentElement){const siblings=[...element.parentElement?.children||[]].filter(s=>s.tagName===element.tagName);parts.unshift(element.tagName.toLowerCase()+`:nth-of-type(${siblings.indexOf(element)+1})`);if(element.parentElement?.id){parts.unshift('#'+CSS.escape(element.parentElement.id));break;}element=element.parentElement;}return parts.join(' > ');}
 const elements=[...scope.querySelectorAll('*')].map(element=>{const style=getComputedStyle(element);return {selector:selector(element),styles:Object.fromEntries(properties.map(property=>[property,style.getPropertyValue(property)]))};});
 const animations=document.getAnimations().filter(animation=>animation.effect?.target&&scope.contains(animation.effect.target)).map(animation=>({target:selector(animation.effect.target),keyframes:animation.effect.getKeyframes(),timing:animation.effect.getTiming()}));
 return {scrollY,viewport:{width:innerWidth,height:innerHeight},target:{selector:input?.id?'#'+CSS.escape(input.id):`[data-motion-input="${inputId}"]`,state:{checked:input?.checked,value:input?.value}},elements,animations};
},inputId);}
try{
 for(const info of pages){
  for(const [viewport,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
   const page=await browser.newPage({viewport:{width,height},isMobile:viewport==='mobile',hasTouch:viewport==='mobile'});page.setDefaultTimeout(3000);
   const coverage={pageId:info.id,viewport,discovered:0,tested:0,skipped:0,status:'pending',errors:[]};output.coverage.push(coverage);
   page.on('response',response=>{
    const url=response.url();if(response.status()!==200||!/(?:\.css|\.[cm]?js)(?:\?|$)/.test(url))return;
    const previous=observed.get(url);if(previous){if(!previous.pageIds.includes(info.id))previous.pageIds.push(info.id);return;}
    const entry={url,pageIds:[info.id]};observed.set(url,entry);
    sourcePromises.push((async()=>{const body=await response.body();const kind=new URL(url).pathname.endsWith('.css')?'css':'js';const file='/apple_design/app/dist/client/research/runtime-sources/radio-'+hash(url).slice(0,12)+'-'+hash(body).slice(0,12)+'.'+kind;await fs.writeFile(path.join(pub,file),body);Object.assign(entry,{file,kind,bytes:body.length,sha256:hash(body),provenance:'captured'});output.resources.push(entry);})().catch(error=>coverage.errors.push(String(error))));
   });
   try{
    await page.goto(info.url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(750);
    const close=page.locator('#ac-ls-close');if(await close.isVisible())await close.click();
    // Pure presentation openers can reveal color radios in a tour panel.
    for(const opener of await page.locator('main button').all()){
     const label=(await opener.getAttribute('aria-label')||await opener.textContent()||'').trim();
     if(!/\b(colors|colours|finishes)\b/i.test(label)||!/tour|view|color|colour|finish/i.test(label))continue;
     if(await opener.isVisible())await opener.click().catch(()=>{});
    }
    const inputs=await page.evaluate(()=>[...document.querySelectorAll('main input[type="radio"], main input[type="checkbox"]')].map((input,index)=>{
     const key=String(index);input.setAttribute('data-motion-input',key);const labels=[...input.labels||[]];let proxy=labels.find(label=>{const r=label.getBoundingClientRect();const s=getComputedStyle(label);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';});
     if(proxy)proxy.setAttribute('data-motion-label',key);const rect=input.getBoundingClientRect();
     return {key,id:input.id,label:input.getAttribute('aria-label')||proxy?.textContent?.trim()||input.value||input.name,selector:input.id?'#'+CSS.escape(input.id):`[data-motion-input="${key}"]`,proxy:!!proxy,visible:!!proxy||rect.width>0&&rect.height>0,disabled:input.disabled,checked:input.checked};
    }));coverage.discovered=inputs.length;
    for(const input of inputs){
     if(!input.visible||input.disabled){coverage.skipped++;continue;}
     coverage.tested++;const id='radio-'+hash(info.id+viewport+input.selector).slice(0,16);
     const record={id,pageId:info.id,pageTitle:info.title,sourceUrl:info.url,label:input.label,selector:input.selector,trigger:'click',kind:'state',viewport,status:'no-change',properties:[],tracks:[],summary:'Native input / associated label follow-up',sourceRefs:[]};
     try{
      const target=page.locator(input.proxy?`[data-motion-label="${input.key}"]`:`[data-motion-input="${input.key}"]`);await target.scrollIntoViewIfNeeded();await page.waitForTimeout(150);
      const before=await snapshot(page,input.key);const started=Date.now();await target.click();const frames=[];
      for(const delay of [60,140,320]){await page.waitForTimeout(delay);frames.push({...await snapshot(page,input.key),elapsed:Date.now()-started});}
      const after=frames.at(-1);record.tracks=deriveMotionTracks(before,frames,after,{trigger:'click'});record.properties=[...new Set(record.tracks.flatMap(track=>track.keyframes.flatMap(frame=>Object.keys(frame).filter(key=>!['offset','easing','composite','computedOffset'].includes(key)))))];
      record.status=record.tracks.length||before.target.state.checked!==after.target.state.checked?'observed':'no-change';record.kind=record.tracks.length?'animation':'state';
      const targets=new Set(record.tracks.map(track=>track.target));const compact=sample=>({...sample,elements:sample.elements.filter(element=>targets.has(element.selector)),animations:sample.animations.filter(animation=>targets.has(animation.target))});
      record.before=compact(before);record.frames=frames.map(compact);record.after=compact(after);
     }catch(error){record.status='blocked';record.error=String(error);}
     record.sourceRefs=output.resources.filter(resource=>resource.pageIds.includes(info.id)).map(resource=>resource.file);
     const file='/apple_design/app/dist/client/research/runtime-radio/records/'+id+'.json';await fs.writeFile(path.join(pub,file),JSON.stringify(record,null,2));output.records.push({...record,file,before:record.before?{target:record.before.target,scrollY:record.before.scrollY}:undefined,after:record.after?{target:record.after.target,scrollY:record.after.scrollY}:undefined,frames:undefined});
    }
    coverage.status='ok';console.log(`${info.id} ${viewport} radios=${coverage.discovered} tested=${coverage.tested} skipped=${coverage.skipped}`);
   }catch(error){coverage.status='blocked';coverage.errors.push(String(error));console.log(`${info.id} ${viewport} blocked`);}
   finally{await page.close();await fs.writeFile(path.join(pub,'research/runtime-radio-motion.json'),JSON.stringify(output,null,2));}
  }
 }
 await Promise.allSettled(sourcePromises);await fs.writeFile(path.join(pub,'research/runtime-radio-motion.json'),JSON.stringify(output,null,2));console.log(JSON.stringify({records:output.records.length,playable:output.records.filter(record=>record.tracks.length).length,coverage:output.coverage.length}));
}finally{await browser.close();}
