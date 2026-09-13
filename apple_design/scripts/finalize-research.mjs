import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=process.cwd();
const publicRoot=path.join(root,'app/public');
const manifestPath=path.join(publicRoot,'research/manifest.json');
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
manifest.shapes=manifest.shapes.filter(shape=>Object.keys(shape.styles||{}).length).map(shape=>({...shape,id:'shape-'+createHash('sha256').update(shape.sourceUrl+shape.selector+JSON.stringify(shape.styles)).digest('hex').slice(0,16)}));
for (const icon of manifest.icons) icon.svg=await fs.readFile(path.join(publicRoot,icon.file),'utf8');
const lab=JSON.parse(await fs.readFile(path.join(publicRoot,'interaction-lab/manifest.json'),'utf8'));
const labIds=new Set(lab.records.map(record=>record.id));
const compactRecord=record=>{
 const {before,after,frames,...summary}=record;
 return {...summary,frames:frames?.map(frame=>({elapsed:frame.elapsed,animatedCount:frame.animated?.length||0,targetStyles:frame.target?.styles,scrollY:frame.scrollY})),detailFile:record.file};
};
for(const page of manifest.pages){
  page.states=[...(page.states||[]).filter(state=>!labIds.has(state.id)),...lab.records.filter(record=>record.sourceUrl===page.url).map(compactRecord)];
  page.scrollStudies=lab.scrollStudies.filter(study=>study.url===page.url);
}
manifest.scope={
  access:'Browser-delivered public resources in a separate Chrome for Testing session. No authenticated personal tabs or internal repositories were accessed.',
  sourceMaps:'Only maps explicitly referenced by captured response headers or source comments were considered.',
  reconstruction:'Reusable components are local implementations. Captured minified bundles are evidence, not recovered original authoring files.',
  interactions:'Bounded sampled actions, not exhaustive testing of every control or private/account/checkout state.',
  evidence:'Raster screenshots are verification evidence only and excluded from the code-only archive.'
};
manifest.interactionSummary={total:manifest.pages.reduce((sum,p)=>sum+(p.states?.length||0),0),captured:manifest.pages.flatMap(p=>p.states||[]).filter(s=>s.status==='captured'||s.status==='ok').length,targeted:lab.records.length,targetedCaptured:lab.records.filter(r=>r.status==='captured').length};
const values=new Map();
for(const page of manifest.pages){
  for(const sample of [...(page.computed||[]),...(page.headings||[])]){
    for(const [property,value] of Object.entries(sample.styles||{})){
      if(!/^(color|background-color|font-size|font-weight|line-height|border-radius|gap|padding|transition-duration|transition-timing-function)$/.test(property))continue;
      if(!value||['normal','none','0px','rgba(0, 0, 0, 0)'].includes(value))continue;
      const key=property+'\0'+value;
      if(!values.has(key))values.set(key,{property,value,observations:[]});
      const observation={url:page.url,selector:sample.selector};
      values.get(key).observations.push(observation);
    }
  }
}
const counters={};
const tokens=[...values.values()].map(value=>({...value,name:`--observed-${value.property}-${counters[value.property]=(counters[value.property]||0)+1}`}));
await fs.writeFile(path.join(publicRoot,'research/observed-tokens.json'),JSON.stringify({note:'Measured computed values, not Apple internal semantic token names.',tokens},null,2));
await fs.writeFile(path.join(publicRoot,'research/observed-tokens.css'),'/* Measured values; names are local, not Apple internal semantic tokens. */\n:root {\n'+tokens.map(t=>`  ${t.name}: ${t.value};`).join('\n')+'\n}\n');
manifest.resources=manifest.resources.filter(r=>!r.file?.includes('/observed-tokens.'));
for(const ext of ['css','json'])manifest.resources.push({url:'',file:`/research/observed-tokens.${ext}`,kind:ext,provenance:'Computed values captured from pages; local token names.'});
manifest.observedTokens=tokens.length;
await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));

// Explicit code allowlist keeps image evidence and dependency/build output out of the archive.
const files=[];
async function collect(relative){
  for(const entry of await fs.readdir(path.join(root,relative),{withFileTypes:true})){
    const name=path.posix.join(relative,entry.name);
    if(entry.isDirectory())await collect(name);
    else if(entry.isFile()&&/\.(?:css|js|jsx|mjs|ts|tsx|json|html|svg|map|md)$/.test(entry.name))files.push(name);
  }
}
for(const directory of ['app/src','app/scripts','app/worker','app/public/research','app/public/interaction-lab','docs'])await collect(directory);
files.push('app/package.json','app/package-lock.json','app/vite.config.mjs','app/index.html','app/public/extraction.json');
files.push('README.md','DESIGN.md','design-qa.md','scripts/expand-capture.mjs','scripts/capture-interactions.mjs','scripts/finalize-research.mjs','scripts/recover-research-resources.mjs','scripts/verify-research.mjs','scripts/verify-svg-assets.mjs','scripts/verify-research-visual.mjs');
const archive=path.join(publicRoot,'research-source-kit.tar.gz');
const result=spawnSync('tar',['-czf',archive,'--null','-T','-'],{cwd:root,input:files.join('\0')+'\0',maxBuffer:2*1024*1024});
if(result.status!==0)throw new Error(result.stderr.toString());
console.log(JSON.stringify({pages:manifest.pages.length,icons:manifest.icons.length,motions:manifest.motions.length,shapes:manifest.shapes.length,resources:manifest.resources.length,observedTokens:tokens.length,interactions:manifest.interactionSummary,archiveFiles:files.length,archiveBytes:(await fs.stat(archive)).size},null,2));
