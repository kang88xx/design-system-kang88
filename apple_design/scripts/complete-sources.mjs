// Complete the saved public-source scope without overwriting original capture evidence.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {launchBrowser} from './browser-runtime.mjs';
import {hash,codePattern,analyzeCss,javascriptReferences,resolveReference} from './source-analysis.mjs';
const root=process.cwd(), pub=path.join(root,'app/public');
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const write=async (file,body)=>{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,typeof body==='string'||Buffer.isBuffer(body)?body:JSON.stringify(body,null,2));};
const manifest=await read(path.join(pub,'research/manifest.json'));
const extraction=await read(path.join(pub,'extraction.json'));
const runtime=await read(path.join(pub,'research/runtime-motion.json')).catch(()=>({pages:[],records:[],resources:[]}));
await write(path.join(pub,'research/pages/homepage/raw.html'),await fs.readFile(path.join(root,'evidence/source/original.html')));
await fs.rm(path.join(pub,'research/inline'),{recursive:true,force:true});
const generatedAt=new Date().toISOString();
const resources=new Map(), pending=new Map(), unresolved=[], parseErrors=[], inline=[], dom=[];
const capturedResources=[...extraction.resources,...manifest.resources,...manifest.pages.flatMap(p=>p.resources||[]),...runtime.resources||[]];
for(const r of capturedResources) if(r.url&&r.file) resources.set(r.url,{...r,kind:r.kind||path.extname(r.file).slice(1),provenance:'captured'});
const retainedResources=()=>[...new Map([...capturedResources,...resources.values()].filter(r=>r.file).map(r=>[r.file,r])).values()];
const pageIdsFor=url=>[...manifest.pages,...runtime.pages||[]].filter(p=>p.url===url||p.resources?.some(r=>r.url===url)).map(p=>p.id);
function queue(ref,base,via){
 const url=resolveReference(ref,base);if(!url)return;
 const extension=path.extname(new URL(url).pathname);
 if(!/\.(css|[cm]?js|svg|json|map|woff2?|ttf|otf)$/i.test(extension))return;
 if(resources.has(url)||pending.has(url))return;
 pending.set(url,{url,via,status:'pending'});
}
const capturePages=new Map([{id:'homepage',url:extraction.source||'https://www.apple.com/',rawDom:'/research/pages/homepage/raw.html'},...manifest.pages].map(page=>[page.id,page]));
for(const live of runtime.pages||[])capturePages.set(live.id,{...capturePages.get(live.id),...live});
const browser=await launchBrowser({headless:true});
const page=await browser.newPage();
try{
 for(const p of capturePages.values()){
  const variants=[['raw',p.rawDom],['rendered',p.renderedDom],...(p.coverage||[]).flatMap(item=>Object.entries(item.domRefs||{}).map(([kind,file])=>['runtime-'+item.viewport+'-'+kind,file]))];
  for(const [variant,file] of variants){
   if(!file)continue;
   const html=await fs.readFile(path.join(pub,file),'utf8');
   const result=await page.evaluate(({html})=>{
    const doc=new DOMParser().parseFromString(html,'text/html');
    return {
     base:doc.querySelector('base[href]')?.getAttribute('href'),
     headings:[...doc.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(e=>({level:e.tagName.toLowerCase(),text:e.textContent.trim(),id:e.id})),
     controls:[...doc.querySelectorAll('button,a,[role="button"],[role="tab"],input,select,textarea,summary')].map(e=>({tag:e.tagName.toLowerCase(),id:e.id,role:e.getAttribute('role'),label:e.getAttribute('aria-label')||e.textContent.trim(),href:e.getAttribute('href'),controls:e.getAttribute('aria-controls')})),
     refs:[...doc.querySelectorAll('script[src],link[href],img[src],use[href],use[xlink\\:href]')].map(e=>e.getAttribute('src')||e.getAttribute('href')||e.getAttribute('xlink:href')),
     blocks:[...doc.querySelectorAll('style,script:not([src])')].map(e=>({kind:e.tagName==='STYLE'?'css':/json/.test(e.type)?'json':e.type&&e.type!=='module'&&!/javascript/.test(e.type)?'txt':'js',body:e.textContent})).filter(e=>e.body.trim()),
     svgs:[...doc.querySelectorAll('svg')].map(e=>e.outerHTML)
    };
   },{html});
   const base=resolveReference(result.base,p.url)||p.url;
   for(const ref of result.refs)queue(ref,base,file);
   for(const [index,block] of result.blocks.entries()){
    const local=`/research/inline/${p.id}-${variant}-${index}-${hash(block.body).slice(0,12)}.${block.kind}`;
    await write(path.join(pub,local),block.body);inline.push({file:local,url:p.url,kind:block.kind,provenance:'captured',pageIds:[p.id],originFile:file});
   }
   // SVG text remains inert source evidence; the existing sanitized icon gallery stays separate.
   for(const [index,svg] of result.svgs.entries()){
    const local=`/research/inline/${p.id}-${variant}-svg-${index}-${hash(svg).slice(0,12)}.svg`;
    await write(path.join(pub,local),svg);inline.push({file:local,url:p.url,kind:'svg',provenance:'captured',pageIds:[p.id],originFile:file});
   }
   dom.push({pageId:p.id,url:p.url,file,variant,headings:result.headings,controls:result.controls,inlineBlocks:result.blocks.length,inlineSvgs:result.svgs.length,provenance:'Saved DOM inventory; no visibility or successful interaction inferred.'});
  }
 }
}finally{await browser.close();}
const previousAudit=await read(path.join(pub,'research/dependency-audit.json')).catch(()=>({resources:[]}));
const previousUnavailable=new Map(previousAudit.resources.filter(r=>r.status==='unavailable').map(r=>[r.url,r]));
const scanned=new Set();let unresolvedDynamicImports=0;
async function scan(resource){
 if(scanned.has(resource.file))return;scanned.add(resource.file);
 if(!/\.(?:css|[cm]?js)$/.test(resource.file))return;
 try{
  const body=await fs.readFile(path.join(pub,resource.file),'utf8');
  const result=resource.file.endsWith('.css')?analyzeCss(body,resource.url,resource.file):javascriptReferences(body);
  unresolvedDynamicImports+=result.unresolvedDynamicImports||0;
  for(const ref of result.references)queue(ref,resource.url,resource.file);
  for(const match of body.matchAll(/[#@]\s*sourceMappingURL=([^\s*]+)/g))queue(match[1],resource.url,resource.file);
 }catch(error){parseErrors.push({file:resource.file,stage:'dependencies',error:String(error).slice(0,240)});}
}
for(const resource of [...retainedResources(),...inline])await scan(resource);
if(!process.argv.includes('--offline')){
 while([...pending.values()].some(r=>r.status==='pending')){
  const batch=[...pending.values()].filter(r=>r.status==='pending').slice(0,8);
  await Promise.all(batch.map(async entry=>{
   entry.status='fetching';
   if(process.argv.includes('--reuse-unavailable-cache') && previousUnavailable.has(entry.url)){Object.assign(entry,previousUnavailable.get(entry.url),{retried:false,cachedFrom:previousAudit.generatedAt});unresolved.push(entry);return;}
   try{
    entry.checkedAt=new Date().toISOString();entry.retried=true;
    const response=await fetch(entry.url,{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const body=Buffer.from(await response.arrayBuffer());
    if(!body.length||/text\/html/i.test(response.headers.get('content-type')||'')||/^\s*<!doctype html/i.test(body.toString('utf8',0,100)))throw new Error('Expected source, received empty body or HTML');
    const ext=path.extname(new URL(entry.url).pathname),local=`/research/recovered/${hash(entry.url).slice(0,12)}-${hash(body).slice(0,12)}${ext}`;
    await write(path.join(pub,local),body);
    const r={url:entry.url,resolvedUrl:response.url,file:local,kind:ext.slice(1),sha256:hash(body),provenance:'captured',via:entry.via};resources.set(entry.url,r);entry.status='captured';await scan(r);
   }catch(error){entry.status='unavailable';entry.reason=String(error).slice(0,240);unresolved.push(entry);}
  }));
  console.log(JSON.stringify({dependencies:pending.size,recovered:[...pending.values()].filter(r=>r.status==='captured').length,unavailable:unresolved.length,pending:[...pending.values()].filter(r=>r.status==='pending').length}));
 }
}else{
 for(const entry of pending.values())unresolved.push({...entry,status:'unavailable',reason:'Not fetched in offline verification pass'});
}
const motions=[],variables=[],shapes=[];
const cssFiles=new Set();
for(const r of [...retainedResources(),...inline]){
 if(r.kind!=='css'||cssFiles.has(r.file))continue;cssFiles.add(r.file);
 try{const parsed=analyzeCss(await fs.readFile(path.join(pub,r.file),'utf8'),r.url,r.file);motions.push(...parsed.motions);variables.push(...parsed.variables);shapes.push(...parsed.shapes);}
 catch(error){parseErrors.push({file:r.file,stage:'css',error:String(error).slice(0,240)});}
}
motions.sort((a,b)=>Number(b.kind==='keyframes')-Number(a.kind==='keyframes'));
manifest.motions=motions;
manifest.motionPages=(runtime.pages||[]).map(({id,title,url})=>({id,title,url}));
manifest.runtimeMotion={file:'/research/runtime-motion.json',catalogFile:'/research/motion-catalog.json',pages:runtime.pages?.length||0,records:runtime.records?.length||0};
manifest.resources=retainedResources().filter(r=>!extraction.resources.some(e=>e.file===r.file));
await write(path.join(pub,'research/css-variables.json'),{generatedAt,note:'All declarations in captured CSS, retaining selectors and conditional context; not inferred semantic tokens.',declarations:variables});
await write(path.join(pub,'research/css-shapes.json'),{generatedAt,note:'All geometry rules in captured CSS. Rules may require their original DOM and assets.',rules:shapes});
await write(path.join(pub,'research/dom-inventory.json'),{generatedAt,note:'Uncapped static inventory of every saved raw and rendered HTML document.',pages:dom});
await write(path.join(pub,'research/dependency-audit.json'),{generatedAt,resources:[...pending.values()],unresolvedDynamicImports,parseErrors});
async function filesIn(directory){
 const list=[];
 for(const e of await fs.readdir(directory,{withFileTypes:true})){const file=path.join(directory,e.name);if(e.isDirectory())list.push(...await filesIn(file));else if(e.isFile())list.push(file);}
 return list;
}
// Mirror authoring files so the deployed reader can inspect real, current source.
for(const directory of ['app/src','app/library','app/scripts','app/tests','app/worker','scripts','docs']){
 for(const file of await filesIn(path.join(root,directory))){if(!codePattern.test(file))continue;const relative=path.relative(root,file);await write(path.join(pub,'source-local',relative.replace(/^app\//,'')),await fs.readFile(file));}
}
for(const relative of ['README.md','DESIGN.md','app/package.json','app/vite.config.mjs','app/index.html'])await write(path.join(pub,'source-local',relative.replace(/^app\//,'')),await fs.readFile(path.join(root,relative)));
for(const file of await filesIn(path.join(root,'evidence/source')))if(codePattern.test(file))await write(path.join(pub,'source-evidence',path.basename(file)),await fs.readFile(file));
const metadata=new Map([...retainedResources(),...inline,...manifest.icons].map(r=>[r.file,r]));
const inventory=[];const missingFiles=[];
const derived=new Set(['/research/manifest.json','/research/completeness.json','/research/source-index.json']);
for(const file of await filesIn(pub)){
 const local='/'+path.relative(pub,file).replaceAll(path.sep,'/');
 if(derived.has(local)||!(codePattern.test(file)||/\.(woff2?|ttf|otf)$/.test(file)))continue;
 const body=await fs.readFile(file),r=metadata.get(local)||{};
 const pageIds=r.pageIds||pageIdsFor(r.url);
 for(const p of manifest.pages)if(local.startsWith(`/research/pages/${p.id}/`)&&!pageIds.includes(p.id))pageIds.push(p.id);
 let provenance=r.provenance||'captured';
 if(local.startsWith('/source-local/')||['/reference-adapter.js','/local-api.js','/homepage.html'].includes(local)||local.startsWith('/research/observed-')||local.startsWith('/interaction-lab/')||/\/research\/(?:css-|dom-|dependency-|substitutions|runtime-motion|runtime-radio|runtime-dom|motion-catalog|motion-replay)/.test(local))provenance='local';
 if(local.includes('/reconstruction/'))provenance='reconstructed';
 inventory.push({id:'source-'+hash(local).slice(0,16),file:local,url:r.url||'',kind:r.kind||path.extname(file).slice(1),bytes:body.length,sha256:hash(body),provenance,pageIds,pageTitle:[...new Map([...manifest.pages,...runtime.pages||[]].map(p=>[p.id,p])).values()].filter(p=>pageIds.includes(p.id)).map(p=>p.title).join(' · '),originFile:r.originFile});
}
for(const r of [...resources.values(),...manifest.icons,...manifest.pages.flatMap(p=>p.resources||[])])if(r.file){try{await fs.access(path.join(pub,r.file));}catch{missingFiles.push(r.file);}}
for(const entry of unresolved)inventory.push({id:'unavailable-'+hash(entry.url).slice(0,16),url:entry.url,file:'',kind:path.extname(new URL(entry.url).pathname).slice(1),provenance:'unavailable',reason:entry.reason,pageIds:pageIdsFor(entry.url)});
const substitutions=await read(path.join(pub,'research/substitutions.json')).catch(()=>({entries:[]}));
const resourceSubstitutions=[];
for(const item of unresolved){
 const pathname=new URL(item.url).pathname;
 let replacementFile='',replacementReason='';
 if(/\.(woff2?|ttf|otf)$/.test(pathname)){
  replacementFile='/fonts/source-fonts.css';
  replacementReason='Unavailable legacy font format or weight; use the captured font-face stylesheet and its system-font fallback. Metrics and weight may differ.';
 }else if(pathname.includes('/assets/ac-buystrip/')){
  const candidate='/ac/globalfooter/8/en_US/assets/ac-buystrip/'+pathname.split('/assets/ac-buystrip/')[1];
  try{await fs.access(path.join(pub,candidate));replacementFile=candidate;replacementReason='Equivalent captured footer icon from public globalfooter v8; original v1 reference returned HTTP 404.';}catch{}
 }else if(pathname.endsWith('/productred.svg')){
  replacementFile='/research/replacements/productred.svg';replacementReason='Local red color-swatch substitute; original SVG unavailable.';
  await write(path.join(pub,replacementFile),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Red color swatch — local substitute"><circle cx="16" cy="16" r="14" fill="#bf2033"/></svg>');
 }
 if(replacementFile){
  const entry={id:'replacement-'+hash(item.url).slice(0,16),url:item.url,replacementFile,replacementReason,provenance:'reconstructed'};
  resourceSubstitutions.push(entry);
  Object.assign(inventory.find(r=>r.url===item.url&&r.provenance==='unavailable')||{},{replacementFile,replacementReason});
 }
}
await write(path.join(pub,'research/resource-substitutions.json'),{generatedAt,note:'Mappings preserve the unavailable original URL; replacements are explicit alternatives, not recovered original bytes.',entries:resourceSubstitutions});
for(const local of ['/research/resource-substitutions.json',...new Set(resourceSubstitutions.map(r=>r.replacementFile))]){
 const existingIndex=inventory.findIndex(r=>r.file===local);if(existingIndex>=0)inventory.splice(existingIndex,1);
 const body=await fs.readFile(path.join(pub,local));inventory.push({id:'source-'+hash(local).slice(0,16),file:local,url:'',kind:path.extname(local).slice(1),bytes:body.length,sha256:hash(body),provenance:local.includes('/replacements/')?'reconstructed':'local',pageIds:[]});
}

const failedStates=manifest.pages.flatMap(p=>(p.states||[]).filter(s=>!['ok','captured'].includes(s.status)).map(s=>({id:s.id,pageId:p.id,status:s.status,substitution:substitutions.entries.find(e=>e.sourceStateId===s.id)?.id||null})));
const scope='Homepage and 13 original saved public Apple pages, extended to 17 live motion pages in desktop and mobile viewports; every local code file, saved HTML inline block, and resolvable referenced code dependency. Private authoring/server code and unobserved runtime states are not original source.';
const coverage={generatedAt,scope,indexedFiles:inventory.filter(r=>r.file).length,missingFiles:[...new Set(missingFiles)].length,unresolvedResources:unresolved.length,motionRules:motions.length,cssVariables:variables.length,substitutions:substitutions.entries.length,substitutedResources:resourceSubstitutions.length,capturedFiles:inventory.filter(r=>r.provenance==='captured').length,localFiles:inventory.filter(r=>r.provenance==='local').length,reconstructedFiles:inventory.filter(r=>r.provenance==='reconstructed').length,cssFiles:cssFiles.size,cssShapeRules:shapes.length,inlineFiles:inline.length,domDocuments:dom.length,unresolvedDynamicImports,parseErrors:parseErrors.length,failedInteractions:failedStates.length,substitutedInteractions:failedStates.filter(s=>s.substitution).length};
inventory.sort((a,b)=>{const order=['css','js','mjs','jsx','html','json','svg'];const rank=r=>order.includes(r.kind)?order.indexOf(r.kind):99;return rank(a)-rank(b)||a.file.localeCompare(b.file);});
manifest.sourceInventory=inventory;manifest.coverage=coverage;
manifest.scope={...manifest.scope,completeness:scope,interactions:'Recorded interaction attempts remain evidence; blocked attempts link to explicit local substitutes. Static DOM inventory does not imply every control was tested.'};
await write(path.join(pub,'research/source-index.json'),{generatedAt,scope,files:inventory});
await write(path.join(pub,'research/completeness.json'),{...coverage,missingPaths:[...new Set(missingFiles)],unresolved,resourceSubstitutions,parseErrors,failedStates,limits:['No source maps found unless explicitly referenced by saved files.','Computed styles and live interactions remain observations sampled at capture time.','Variable-computed imports cannot be statically resolved; counts are recorded.','Images, videos and font binaries are retained locally where captured; code archive excludes raster/video evidence.','Self-referential manifest, completeness and source-index files are accessible separately and excluded from their own hash inventory.']});
await write(path.join(pub,'research/manifest.json'),manifest);
if(!process.argv.includes('--no-archive')){
 const archiveFiles=[];
 for(const directory of ['app/src','app/library','app/scripts','app/tests','app/worker','app/public','scripts','docs','evidence/source']){
  for(const file of await filesIn(path.join(root,directory)))if((codePattern.test(file)||/\.(woff2?|ttf|otf)$/.test(file))&&!file.includes('/public/source-local/')&&!file.includes('/public/source-evidence/'))archiveFiles.push(path.relative(root,file));
 }
 archiveFiles.push('README.md','DESIGN.md','app/package.json','app/package-lock.json','app/vite.config.mjs','app/index.html','app/.openai/hosting.json');
 const packed=spawnSync('tar',['-czf',path.join(pub,'research-source-kit.tar.gz'),'--null','-T','-'],{cwd:root,input:[...new Set(archiveFiles)].join('\0')+'\0',maxBuffer:2*1024*1024});
 if(packed.status!==0)throw new Error(packed.stderr.toString());
 console.log('Archive files:',new Set(archiveFiles).size);
}
console.log(JSON.stringify(coverage,null,2));
