import {createRequire} from 'node:module';
import {hash} from './source-analysis.mjs';
const require=createRequire(new URL('../app/package.json',import.meta.url));
const {parse}=require('@babel/parser');
const methods=new Set(['animate','addKeyframe','addKeyframes','createKeyframe','addScrollGroup','addAnimation','requestAnimationFrame','cancelAnimationFrame']);
const constructors=new Set(['Animation','KeyframeEffect','ScrollTimeline','ViewTimeline']);
// These are source call sites, never counted as verified distinct runtime effects.
export function extractJsMotionSites(code,file,sourceUrl){
 const ast=parse(code,{sourceType:'unambiguous',errorRecovery:true});
 const output=[],stack=[ast];
 while(stack.length){
  const node=stack.pop();if(!node||typeof node!=='object')continue;
  if(node.type==='CallExpression'||node.type==='NewExpression'){
   const callee=node.callee;
   const name=callee?.type==='Identifier'?callee.name:callee?.property?.name||callee?.property?.value;
   if((node.type==='CallExpression'&&methods.has(name))||(node.type==='NewExpression'&&constructors.has(name))){
    output.push({id:'js-motion-'+hash(file+':'+node.start).slice(0,16),kind:'js-animation',label:`${name} · line ${node.loc.start.line}`,status:'source-only',trigger:/Scroll|ViewTimeline|addKeyframe/i.test(name)?'scroll':'unspecified',file,sourceUrl,code:code.slice(node.start,node.end),line:node.loc.start.line,start:node.start,end:node.end,api:name});
   }
  }
  for(const [key,value] of Object.entries(node)){
   if(['loc','start','end','comments','tokens','errors'].includes(key))continue;
   if(Array.isArray(value))stack.push(...value);else if(value&&typeof value==='object')stack.push(value);
  }
 }
 return output.sort((a,b)=>a.start-b.start);
}
