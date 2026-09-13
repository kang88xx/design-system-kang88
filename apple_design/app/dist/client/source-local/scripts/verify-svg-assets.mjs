import {launchBrowser} from './browser-runtime.mjs';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifestPath='app/public/research/manifest.json';
const manifest=JSON.parse(await fs.readFile(manifestPath,'utf8'));
const browser=await launchBrowser({headless:true});
try{
 const page=await browser.newPage();
 const sources=[];
 for(const icon of [...manifest.icons,...(manifest.svgDefinitions||[])])sources.push({id:icon.id,sourceUrl:icon.sourceUrl,svg:await fs.readFile('app/public'+icon.file,'utf8')});
 const fixed=await page.evaluate(async sources=>{
  const results=[];
  const documents=sources.map(source=>({...source,document:new DOMParser().parseFromString(source.svg,'text/html')}));
  for(const source of sources){
   const document=new DOMParser().parseFromString(source.svg,'text/html');
   const svg=document.querySelector('svg');
   if(!svg)throw new Error('Missing SVG: '+source.id);
   svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
   const definitionsOnly=[...svg.children].every(child=>['defs','title','desc'].includes(child.localName));
   for(const use of svg.querySelectorAll('use')){
    const reference=use.getAttribute('href')||use.getAttributeNS('http://www.w3.org/1999/xlink','href');
    if(!reference?.startsWith('#')||svg.querySelector(reference))continue;
    const definition=documents.filter(item=>item.sourceUrl===source.sourceUrl).map(item=>item.document.getElementById(reference.slice(1))).find(Boolean);
    if(!definition)throw new Error('Missing symbol '+reference+' for '+source.id);
    const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.append(definition.cloneNode(true));svg.prepend(defs);
   }
   const serialized=new XMLSerializer().serializeToString(svg);
   const xml=new DOMParser().parseFromString(serialized,'image/svg+xml');
   if(xml.querySelector('parsererror'))throw new Error('Invalid XML: '+source.id);
   if(definitionsOnly){results.push({id:source.id,svg:serialized,definitionsOnly:true});continue;}
   const image=new Image();
   image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(serialized);
   await image.decode();
   const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;
   const context=canvas.getContext('2d');context.drawImage(image,0,0,96,96);
   const visible=[...context.getImageData(0,0,96,96).data].some((value,index)=>index%4===3&&value>0);
   results.push({id:source.id,svg:serialized,width:image.naturalWidth,height:image.naturalHeight,visible});
  }
  return results;
 },sources);
 for(const item of fixed){
  const icon=[...manifest.icons,...(manifest.svgDefinitions||[])].find(icon=>icon.id===item.id);
  await fs.writeFile('app/public'+icon.file,item.svg);
  icon.svg=item.svg;icon.sha256=createHash('sha256').update(item.svg).digest('hex');
 }
 const definitionIds=new Set(fixed.filter(item=>item.definitionsOnly).map(item=>item.id));
 manifest.svgDefinitions=[...manifest.icons,...(manifest.svgDefinitions||[])].filter(icon=>definitionIds.has(icon.id));
 manifest.icons=manifest.icons.filter(icon=>!definitionIds.has(icon.id));
 for(const page of manifest.pages)page.svgIds=page.svgIds.filter(id=>!definitionIds.has(id));
 await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2));
 const result={decoded:fixed.filter(icon=>!icon.definitionsOnly).length,total:manifest.icons.length,definitionLibraries:manifest.svgDefinitions.length,blank:fixed.filter(icon=>!icon.definitionsOnly&&!icon.visible).map(icon=>icon.id)};
 await fs.writeFile('evidence/svg-verification.json',JSON.stringify(result,null,2));
 console.log(result);
 if(result.blank.length)process.exitCode=1;
}finally{await browser.close();}
