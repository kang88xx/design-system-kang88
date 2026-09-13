import test from 'node:test';import assert from 'node:assert/strict';
import {deriveMotionTracks} from '../../scripts/runtime-tracks.mjs';
const snapshot=(opacity,elapsed=0,scrollY=0)=>({elapsed,scrollY,elements:[{selector:'#hero',styles:{opacity,transform:'none'}}],animations:[]});
test('Intermediate fade is retained even when start and end match',()=>{
 const first=snapshot('1'),mid=snapshot('0',80),last=snapshot('1',600);const tracks=deriveMotionTracks(first,[mid,last],last);
 assert.equal(tracks.length,1);assert.deepEqual(tracks[0].keyframes.map(frame=>frame.opacity),['1','0','1']);assert.equal(tracks[0].source,'computed-samples');
});
test('Short transition captured mid-frame survives after animation has ended',()=>{
 const before=snapshot('1'),mid={...snapshot('1',80),animations:[{target:'#panel',keyframes:[{offset:0,transform:'translateX(30px)'},{offset:1,transform:'none'}],timing:{duration:240,easing:'ease'}}]},after=snapshot('1',600);
 const tracks=deriveMotionTracks(before,[mid,after],after);assert.equal(tracks.length,1);assert.equal(tracks[0].timing.duration,240);assert.equal(tracks[0].source,'web-animations');
});
test('An existing unchanged background loop does not become a click effect',()=>{
 const before={...snapshot('1'),animations:[{target:'#ambient',keyframes:[{opacity:0},{opacity:1}],timing:{duration:1000}}]};
 assert.equal(deriveMotionTracks(before,[before],before).length,0);assert.equal(deriveMotionTracks(before,[before],before,{trigger:'autoplay'}).length,1);
});
test('Scroll replay marks normalized duration as a preview and retains pixel range',()=>{
 const before=snapshot('0',0,0),middle=snapshot('.5',0,600),after=snapshot('1',0,1200);
 const [track]=deriveMotionTracks(before,[middle,after],after,{trigger:'scroll'});assert.deepEqual(track.scrollRange,{start:0,end:1200,unit:'px'});assert.match(track.timingProvenance,/not original duration/);assert.equal(track.keyframes[1].offset,.5);
});
test('Missing target snapshots never borrow unrelated target styles',()=>{
 const before={elements:[{selector:'#other',styles:{opacity:'0'}}]},after=snapshot('1',600);
 assert.equal(deriveMotionTracks(before,[after],after).length,0);
});
