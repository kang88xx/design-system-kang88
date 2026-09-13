import fs from 'node:fs/promises';
import {hash} from './source-analysis.mjs';
import {normalizeTrack,hasChangingPreviewKeyframes} from '../app/src/motion/motionData.mjs';
import {updateTotals,signatureForRecord} from './runtime-motion-schema.mjs';
const pub='app/public';
const runtime=JSON.parse(await fs.readFile(pub+'/apple_design/app/dist/client/research/runtime-motion.json','utf8'));
const supplement=JSON.parse(await fs.readFile(pub+'/apple_design/app/dist/client/research/runtime-radio-motion.json','utf8'));
const records=new Map([...runtime.records,...supplement.records].map(record=>[record.id,record]));
let skipped=0;
for(const record of records.values()){
 if(record.status==='blocked'&&record.summary?.startsWith('Skipped:')){
  record.status='skipped';record.skipReason=record.error||record.summary.slice(9);skipped++;
  const detail=JSON.parse(await fs.readFile(pub+record.file,'utf8'));detail.status='skipped';detail.skipReason=record.skipReason;await fs.writeFile(pub+record.file,JSON.stringify(detail,null,2));
 }
 let timingUpdated=false;
 for(const track of record.tracks||[]){if(track.source==='computed-samples'&&!track.scrollRange){track.timingProvenance='Linear interpolation of recorded sample offsets; original duration and easing are not recovered.';timingUpdated=true;}}
 if(timingUpdated){const detail=JSON.parse(await fs.readFile(pub+record.file,'utf8'));for(const track of detail.tracks||[])if(track.source==='computed-samples'&&!track.scrollRange)track.timingProvenance='Linear interpolation of recorded sample offsets; original duration and easing are not recovered.';await fs.writeFile(pub+record.file,JSON.stringify(detail,null,2));}
 if(record.tracks?.length)record.dedupeSignature=hash(signatureForRecord(record)).slice(0,24);
}
runtime.records=[...records.values()];
const resources=new Map();
const pagesByUrl=new Map();
for(const resource of [...runtime.resources,...supplement.resources]){
 if(!resource.file)continue;
 pagesByUrl.set(resource.url,[...new Set([...pagesByUrl.get(resource.url)||[],...resource.pageIds||[]])]);
 const previous=resources.get(resource.file);resources.set(resource.file,{...resource,pageIds:[...new Set([...previous?.pageIds||[],...resource.pageIds||[]])]});
}
runtime.resources=[...resources.values()].map(resource=>({...resource,pageIds:pagesByUrl.get(resource.url)}));
// Supplemental detail files receive the completed page source index after every response settles.
for(const record of runtime.records.filter(record=>record.file.startsWith('/apple_design/app/dist/client/research/runtime-radio/')||(record.status==='observed'&&record.tracks?.length&&!record.sourceRefs?.length))){
 const detail=JSON.parse(await fs.readFile(pub+record.file,'utf8'));
 detail.sourceRefs=runtime.resources.filter(resource=>resource.pageIds.includes(record.pageId)).map(resource=>resource.file);
 record.sourceRefs=detail.sourceRefs;
 await fs.writeFile(pub+record.file,JSON.stringify(detail,null,2));
}
for(const page of runtime.pages){
 page.supplementalCoverage=supplement.coverage.filter(item=>item.pageId===page.id);
 page.status=page.coverage.every(item=>item.status==='ok')?'ok':page.coverage.some(item=>item.status==='ok')?'partial':'blocked';
}
runtime.scope.supplement='Associated-label native radio/checkbox sweep; see page.supplementalCoverage.';
runtime.completedAt=new Date().toISOString();updateTotals(runtime);
runtime.totals.skipped=runtime.records.filter(record=>record.status==='skipped').length;
runtime.totals.attempts=runtime.records.filter(record=>!['source-only','skipped'].includes(record.status)).length;
runtime.records=runtime.records.map(record=>({
 id:record.id,pageId:record.pageId,pageTitle:record.pageTitle,sourceUrl:record.sourceUrl,label:record.label,selector:record.selector,trigger:record.trigger,kind:record.kind,status:record.status,summary:record.summary,viewport:record.viewport,properties:record.properties,duration:record.duration,easing:record.easing,file:record.file,error:record.error,skipReason:record.skipReason,dedupeSignature:record.dedupeSignature,
 trackCount:record.tracks?.length||record.trackCount||0,
 playableTrackCount:record.tracks?record.tracks.map(normalizeTrack).filter(hasChangingPreviewKeyframes).length:record.playableTrackCount||0,
 detailStorage:'Full original frames, keyframes, timings and source references are in file.'
}));
runtime.totals.trackedRecords=runtime.records.filter(record=>record.trackCount>0).length;
runtime.totals.playableRecords=runtime.records.filter(record=>record.playableTrackCount>0).length;
runtime.indexFormat='descriptor-only; load records[].file for full original evidence';
await fs.writeFile(pub+'/apple_design/app/dist/client/research/runtime-motion.json',JSON.stringify(runtime,null,2));
console.log(JSON.stringify({normalizedSkipped:skipped,totals:runtime.totals,supplement:supplement.coverage},null,2));
