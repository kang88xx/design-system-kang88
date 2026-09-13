import {hash} from './source-analysis.mjs';
const styleKeys=['transform','opacity','clip-path','filter','translate','scale','rotate','visibility','height','max-height','background-color'];
const camel=key=>key.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase());
const geometry=track=>JSON.stringify({target:track.target,keyframes:track.keyframes,timing:track.timing});
function animationTrack(animation){
 return {target:animation.target,keyframes:animation.keyframes,timing:animation.timing,source:'web-animations'};
}
function varies(frames){
 const keys=new Set(frames.flatMap(frame=>Object.keys(frame)).filter(key=>!['offset','computedOffset','easing','composite'].includes(key)));
 return [...keys].some(key=>new Set(frames.filter(frame=>frame[key]!==undefined).map(frame=>JSON.stringify(frame[key]))).size>1);
}
// Preserve all sampled intermediate states; the endpoint alone misses short transitions.
export function deriveMotionTracks(before,frames=[],after,{trigger='click'}={}){
 const sequence=[{...before,elapsed:0},...frames];
 if(after&&after!==frames.at(-1))sequence.push({...after,elapsed:frames.at(-1)?.elapsed??1});
 const tracks=[],seen=new Set();
 const baseline=new Set((before?.animations||[]).map(animation=>geometry(animationTrack(animation))));
 for(const sample of sequence)for(const animation of sample.animations||[]){
  const track=animationTrack(animation);
  if(!Array.isArray(track.keyframes)||track.keyframes.length<2||!varies(track.keyframes))continue;
  const signature=geometry(track);
  // An already-running unrelated loop is not proof the click triggered that effect.
  if(!['load','autoplay','scroll'].includes(trigger)&&baseline.has(signature))continue;
  if(seen.has(signature))continue;seen.add(signature);tracks.push(track);
 }
 const elementSamples=new Map();
 sequence.forEach((sample,index)=>{for(const element of sample.elements||[]){
  if(!element.selector||!element.styles)continue;
  const samples=elementSamples.get(element.selector)||[];samples.push({element,index,elapsed:sample.elapsed,scrollY:sample.scrollY});elementSamples.set(element.selector,samples);
 }});
 const waTargets=new Set(tracks.map(track=>track.target));
 for(const [target,samples] of elementSamples){
  if(samples.length<2||waTargets.has(target))continue;
  const properties=styleKeys.filter(key=>new Set(samples.filter(sample=>sample.element.styles[key]!==undefined).map(sample=>sample.element.styles[key])).size>1);
  if(!properties.length)continue;
  const first=samples[0],last=samples.at(-1);
  const coordinate=sample=>trigger==='scroll'?Number(sample.scrollY):Number(sample.elapsed);
  const start=coordinate(first),end=coordinate(last),span=end-start;
  const keyframes=samples.map((sample,index)=>({offset:span>0?Math.max(0,Math.min(1,(coordinate(sample)-start)/span)):index/(samples.length-1),...Object.fromEntries(properties.filter(key=>sample.element.styles[key]!==undefined).map(key=>[camel(key),sample.element.styles[key]]))}));
  if(!varies(keyframes))continue;
  tracks.push({target,keyframes,timing:{duration:trigger==='scroll'?1000:Math.max(1,span||1),easing:'linear',iterations:1,fill:'both'},source:'computed-samples',timingProvenance:trigger==='scroll'?'Preview maps recorded scroll distance to a 1000ms scrub timeline; not original duration.':'Linear interpolation of recorded sample offsets; original duration and easing are not recovered.',...(trigger==='scroll'?{scrollRange:{start,end,unit:'px'}}:{sampleWindowMs:span})});
 }
 return tracks.map(track=>({...track,id:'track-'+hash(geometry(track)).slice(0,16)}));
}
