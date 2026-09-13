import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {hash} from './source-analysis.mjs';
const read=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const runtime=await read('app/public/research/runtime-motion.json');
const catalog=await read('app/public/research/motion-catalog.json');
const baseline=await read('app/public/research/manifest.json');
const checks=[];const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
const normalize=url=>String(url).replace(/\/$/,'');
const urls=new Set(runtime.pages.map(page=>normalize(page.url)));
for(const url of ['https://www.apple.com/',...baseline.pages.map(page=>page.url),'https://www.apple.com/mac-mini/','https://www.apple.com/ipad-air/','https://www.apple.com/ipad-pro/'])check('Runtime coverage includes '+url,urls.has(normalize(url)));
const pending=[];
for(const page of runtime.pages){
 for(const viewport of ['desktop','mobile']){
  const coverage=page.coverage.find(item=>item.viewport===viewport);check(`${page.id} ${viewport} has terminal coverage`,coverage&&['ok','blocked'].includes(coverage.status));
  if(coverage.status==='blocked'){check(`${page.id} ${viewport} failure has reason`,coverage.errors.length>0);pending.push({pageId:page.id,viewport,errors:coverage.errors});continue;}
  check(`${page.id} ${viewport} accounts for every discovered control`,coverage.controlsDiscovered===coverage.controlsTested+coverage.controlsSkipped);
  check(`${page.id} ${viewport} accounts for all hover targets`,coverage.hoverTargetsDiscovered===coverage.hoverTargetsTested);
  check(`${page.id} ${viewport} has scroll study`,coverage.scrollSamples>0);
 }
}
check('Unique runtime record IDs',new Set(runtime.records.map(record=>record.id)).size===runtime.records.length);
const resourceFiles=new Set(runtime.resources.filter(resource=>resource.file).map(resource=>resource.file));
let checkedRefs=0;const checkedRefFiles=new Set();
let playable=0,trackCount=0;const motionPages=new Set();
for(const record of runtime.records){
 check(`Record page exists ${record.id}`,runtime.pages.some(page=>page.id===record.pageId));
 if(record.status==='blocked')check(`Blocked record explains failure ${record.id}`,Boolean(record.error||record.summary));
 if(record.playableTrackCount>0||record.tracks?.length){playable++;motionPages.add(record.pageId);}
 const body=await read('app/public'+record.file);
 assert.equal(body.id,record.id,record.file);
 if(record.status==='observed'&&(record.trackCount||record.tracks?.length))assert.ok(body.sourceRefs?.length,record.id+' source references');
 for(const ref of body.sourceRefs||[]){assert.ok(resourceFiles.has(ref),ref+' registered original source');if(!checkedRefFiles.has(ref)){await fs.access('app/public'+ref);checkedRefFiles.add(ref);}checkedRefs++;}
 assert.equal(body.tracks?.length||0,record.trackCount??record.tracks?.length??0,record.id+' full track retention');
 if(record.tracks)assert.deepEqual(body.tracks||[],record.tracks,record.id+' full track retention');
 for(const track of body.tracks||[]){
  trackCount++;assert.ok(track.keyframes.length>=2,record.id+' track has frames');
  if(track.source==='computed-samples')assert.ok(track.timingProvenance,record.id+' interpolated timing labeled');
 }
}
check('More than preset examples are actually replayable',playable>20);
check('Observed motion spans multiple page tabs',motionPages.size>=10);
check('CSS, DOM declarations and JS sites are all inventoried',['css-keyframes','css-transition','declarative','js-animation'].every(kind=>catalog.records.some(record=>record.kind===kind)));
check('Source declarations retain source-only status',catalog.records.every(record=>record.status==='source-only'&&record.code&&record.file&&record.sourceUrl));
check('Catalog extraction has no parse failures',catalog.errors.length===0);
for(const resource of runtime.resources.filter(resource=>resource.file)){
 const body=await fs.readFile('app/public'+resource.file);assert.ok(body.length>0,resource.file);if(resource.bytes)assert.equal(body.length,resource.bytes);if(resource.sha256)assert.equal(hash(body),resource.sha256);
}
check('Motion detail references resolve to registered original sources',checkedRefs>0);
const result={passed:true,checks:checks.length,pages:runtime.pages.length,playableRecords:playable,tracks:trackCount,motionPages:motionPages.size,pending,catalog:catalog.summary};
await fs.writeFile('evidence/runtime-motion-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
