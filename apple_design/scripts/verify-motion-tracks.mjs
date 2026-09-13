import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {launchBrowser} from './browser-runtime.mjs';
import {hash} from './source-analysis.mjs';
import {normalizeTrack,hasChangingPreviewKeyframes} from '../app/src/motion/motionData.mjs';

const replay=JSON.parse(await fs.readFile('app/public/research/motion-replay.json','utf8'));
const unique=new Map();let retained=0,supported=0;
for(const record of replay.records)for(const raw of record.tracks){
 retained++;const track=normalizeTrack(raw);
 if(!hasChangingPreviewKeyframes(track))continue;
 supported++;
 const payload={keyframes:track.keyframes,timing:{...track.timing,duration:Math.max(1,track.timing.duration)}};
 const signature=hash(JSON.stringify(payload));
 if(!unique.has(signature))unique.set(signature,{id:record.id,target:track.target,...payload});
}
const browser=await launchBrowser();const errors=[];
try{
 const page=await browser.newPage();
 const tracks=[...unique.values()];
 for(let index=0;index<tracks.length;index+=200){
  errors.push(...await page.evaluate(batch=>{
   const target=document.createElement('div');document.body.append(target);
   const errors=[];
   for(const track of batch){
    let animation;
    try{
     animation=target.animate(track.keyframes,track.timing);animation.pause();
     for(const progress of [0,0.5,1]){animation.currentTime=progress*track.timing.duration;getComputedStyle(target).transform;}
     if(animation.effect.getKeyframes().length<2)throw new Error('No retained keyframe interval');
    }catch(error){errors.push({id:track.id,target:track.target,error:String(error)});}
    finally{animation?.cancel();}
   }
   target.remove();return errors;
  },tracks.slice(index,index+200)));
 }
}finally{await browser.close();}
const result={passed:errors.length===0,retainedTracks:retained,supportedTracks:supported,uniquePreviewTracks:unique.size,errors};
await fs.writeFile('evidence/motion-track-verification.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));assert.ok(result.passed,'Every supported collected track must be accepted by the browser');
