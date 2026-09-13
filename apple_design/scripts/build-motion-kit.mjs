import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const pub='app/public';
const runtime=JSON.parse(await fs.readFile(pub+'/research/runtime-motion.json','utf8'));
const catalog=JSON.parse(await fs.readFile(pub+'/research/motion-catalog.json','utf8'));
const records=[];
for(const entry of runtime.records){
 if(!entry.trackCount&&!entry.tracks?.length)continue;
 const original=JSON.parse(await fs.readFile(pub+entry.file,'utf8'));
 records.push({id:entry.id,pageId:entry.pageId,pageTitle:entry.pageTitle,sourceUrl:entry.sourceUrl,label:entry.label,selector:entry.selector,trigger:entry.trigger,viewport:entry.viewport,sourceRefs:original.sourceRefs,tracks:original.tracks,evidenceFile:entry.file});
}
const file='/research/motion-replay.json';
await fs.writeFile(pub+file,JSON.stringify({generatedAt:new Date().toISOString(),provenance:'Exact retained motion tracks. Computed/scroll interpolation is identified by each track timingProvenance. Original observed snapshots remain in evidenceFile.',pages:runtime.pages.map(({id,title,url})=>({id,title,url})),records},null,2));
const catalogFiles=catalog.records.flatMap(record=>[record.file,...(record.variants||[]).map(variant=>variant.file)]).filter(Boolean);
const files=['docs/motion-research.md','docs/motion-usage.md','scripts/runtime-tracks.mjs','scripts/motion-source-analysis.mjs','scripts/build-motion-kit.mjs',pub+file,pub+'/research/motion-catalog.json',...runtime.resources.filter(resource=>resource.file).map(resource=>pub+resource.file),...catalogFiles.map(file=>pub+file)];
const result=spawnSync('tar',['-czf',pub+'/motion-code-kit.tar.gz','--null','-T','-'],{input:[...new Set(files)].join('\0')+'\0',encoding:'utf8'});
if(result.status!==0)throw new Error(result.stderr||'Motion kit archive failed');
console.log(JSON.stringify({records:records.length,tracks:records.reduce((sum,record)=>sum+record.tracks.length,0),files:new Set(files).size,bytes:(await fs.stat(pub+'/motion-code-kit.tar.gz')).size}));
