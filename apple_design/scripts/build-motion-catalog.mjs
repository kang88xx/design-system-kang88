import fs from 'node:fs/promises';
import path from 'node:path';
import {launchBrowser} from './browser-runtime.mjs';
import {hash,analyzeCss} from './source-analysis.mjs';
import {extractJsMotionSites} from './motion-source-analysis.mjs';
const pub=path.resolve('app/public');
const read=async file=>JSON.parse(await fs.readFile(path.join(pub,file),'utf8'));
const manifest=await read('research/manifest.json');
const extraction=await read('extraction.json');
const runtime=await read('research/runtime-motion.json').catch(()=>({pages:[],resources:[]}));
const pages=new Map();
for(const page of [{id:'homepage',title:'Apple homepage',url:'https://www.apple.com/',rawDom:'/research/pages/homepage/raw.html'},...manifest.pages,...runtime.pages]){
 const prior=pages.get(page.id);pages.set(page.id,{...prior,...page,resources:[...prior?.resources||[],...page.resources||[]]});
}
const aliases=new Map();
for(const live of runtime.pages){
 const existing=[...pages.values()].find(page=>page.id!==live.id&&page.url.replace(/\/$/,'')===live.url.replace(/\/$/,''));
 if(existing){aliases.set(existing.id,live.id);pages.set(live.id,{...existing,...pages.get(live.id),rawDom:existing.rawDom||live.rawDom,renderedDom:existing.renderedDom||live.renderedDom,resources:[...existing.resources||[],...pages.get(live.id)?.resources||[]]});pages.delete(existing.id);}
}
const records=[],errors=[],resources=new Map();
function addResource(r,pageId){if(!r.file||!r.url)return;const prior=resources.get(r.file)||{...r,pageIds:[]};prior.pageIds=[...new Set([...prior.pageIds,...r.pageIds||[],...pageId?[pageId]:[]].map(id=>aliases.get(id)||id))];resources.set(r.file,prior);}
extraction.resources.forEach(r=>addResource(r,'homepage'));
manifest.resources.forEach(r=>addResource(r));
for(const p of pages.values())for(const r of p.resources||[])addResource(r,p.id);
for(const r of runtime.resources||[])addResource(r);
function decorate(record,pageIds){pageIds=[...new Set(pageIds.map(id=>aliases.get(id)||id))];return {...record,pageIds,pageTitles:pageIds.map(id=>pages.get(id)?.title||id)};}
for(const r of resources.values()){
 try{
  if(/\.css$/i.test(r.file)){
   const parsed=analyzeCss(await fs.readFile(path.join(pub,r.file),'utf8'),r.url,r.file);
   for(const item of parsed.motions)records.push(decorate({...item,label:item.name,kind:'css-'+item.kind,status:'source-only',trigger:/:hover|:focus/.test(item.selector||'')?'hover':'unspecified',code:item.css},r.pageIds));
  }else if(/\.[cm]?js$/i.test(r.file)){
   const sites=extractJsMotionSites(await fs.readFile(path.join(pub,r.file),'utf8'),r.file,r.url);
   records.push(...sites.map(site=>decorate(site,r.pageIds)));
  }
 }catch(error){errors.push({file:r.file,error:String(error)});}
}
for(const item of manifest.motions||[]){
 const refs=resources.get(item.file)?.pageIds||[...pages.values()].filter(p=>p.url===item.sourceUrl).map(p=>p.id);
 records.push(decorate({...item,label:item.name,kind:'css-'+item.kind,status:'source-only',trigger:/:hover|:focus/.test(item.selector||'')?'hover':'unspecified',code:item.css},refs));
}
const browser=await launchBrowser();
try{
 const page=await browser.newPage();
 for(const p of pages.values()){
  const seen=new Map();
  const variants=[['raw',p.rawDom],['rendered',p.renderedDom],...(p.coverage||[]).flatMap(item=>Object.entries(item.domRefs||{}).map(([kind,file])=>['runtime-'+item.viewport+'-'+kind,file]))];
  for(const [variant,file] of variants){
   if(!file)continue;
   let html;try{html=await fs.readFile(path.join(pub,file),'utf8');}catch(error){errors.push({file,error:String(error)});continue;}
   const entries=await page.evaluate(html=>{
    const doc=new DOMParser().parseFromString(html,'text/html');
    function selector(el){if(el.id)return '#'+CSS.escape(el.id);const bits=[];while(el&&el!==doc.documentElement){const tag=el.tagName.toLowerCase();const siblings=[...el.parentElement?.children||[]].filter(x=>x.tagName===el.tagName);bits.unshift(tag+(siblings.length>1?`:nth-of-type(${siblings.indexOf(el)+1})`:''));if(el.parentElement?.id){bits.unshift('#'+CSS.escape(el.parentElement.id));break;}el=el.parentElement;}return bits.join(' > ');}
    return [...doc.querySelectorAll('*')].flatMap(el=>{
     const intrinsic=/^(video|canvas|animate|animatetransform|animatemotion|set)$/i.test(el.tagName);
     const attrs=Object.fromEntries([...el.attributes].filter(a=>intrinsic||/^data-(anim(?:-|$)|inline-media|video|gallery)/.test(a.name)||(a.name==='data-component-list'&&/Anim|Gallery|Carousel|Modal|Accordion|Parallax|Scroll|Media|Hero|Nav/i.test(a.value))).map(a=>[a.name,a.value]));
     if(!intrinsic&&!Object.keys(attrs).length)return [];
     return [{selector:selector(el),attributes:attrs,tag:el.tagName.toLowerCase(),media:intrinsic?{kind:el.tagName.toLowerCase(),sources:[el.getAttribute('src'),...[...el.querySelectorAll('source[src]')].map(source=>source.getAttribute('src'))].filter(Boolean),poster:el.getAttribute('poster')}:undefined,label:el.getAttribute('aria-label')||el.querySelector('h1,h2,h3')?.textContent.trim()||Object.values(attrs)[0],section:el.closest('section')?.getAttribute('class')||'',code:intrinsic?(/^(video|canvas)$/i.test(el.tagName)?el.outerHTML:el.parentElement.outerHTML):'<'+el.tagName.toLowerCase()+' '+[...el.attributes].filter(a=>a.name==='id'||a.name==='class'||a.name in attrs).map(a=>a.name+'="'+a.value.replaceAll('&','&amp;').replaceAll('"','&quot;')+'"').join(' ')+'>'}];
    });
   },html);
   for(const entry of entries){
    if(entry.media)entry.media.sources=entry.media.sources.map(source=>{try{return new URL(source,p.url).href;}catch{return source;}});
    const key=entry.selector+JSON.stringify(entry.attributes);const existing=seen.get(key);if(existing){existing.variants.push({variant,file});continue;}
    const record=decorate({id:'declaration-'+hash(p.id+key).slice(0,16),kind:['animate','animatetransform','animatemotion','set'].includes(entry.tag)?'svg-animation':['video','canvas'].includes(entry.tag)?'media-source':'declarative',status:'source-only',trigger:/scroll|keyframe|parallax/i.test(JSON.stringify(entry.attributes))?'scroll':'unspecified',sourceUrl:p.url,file,...entry,label:String(entry.label).trim(),variants:[{variant,file}]},[p.id]);seen.set(key,record);records.push(record);
   }
  }
 }
}finally{await browser.close();}
const unique=[...new Map(records.map(r=>[r.id,r])).values()];
const summary={cssRules:unique.filter(r=>r.kind.startsWith('css-')).length,declarations:unique.filter(r=>r.kind==='declarative').length,javascriptCalls:unique.filter(r=>r.kind==='js-animation').length,svgAnimations:unique.filter(r=>r.kind==='svg-animation').length,mediaSources:unique.filter(r=>r.kind==='media-source').length,sourceFiles:resources.size,total:unique.length};
await fs.writeFile(path.join(pub,'research/motion-catalog.json'),JSON.stringify({generatedAt:new Date().toISOString(),provenance:'Public source declarations and API call sites, not verified runtime effects. Raw/rendered copies are merged only when selector and attributes match.',pages:[...pages.values()].map(({id,title,url})=>({id,title,url})),summary,records:unique,errors},null,2));
console.log(JSON.stringify({summary,errors},null,2));
