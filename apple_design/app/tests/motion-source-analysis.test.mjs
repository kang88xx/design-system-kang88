import test from 'node:test';
import assert from 'node:assert/strict';
import {extractJsMotionSites} from '../../scripts/motion-source-analysis.mjs';
test('Motion call inventory retains original call source and avoids strings/comments',()=>{
 const code='// element.animate(fake)\nconst label="requestAnimationFrame(fake)";\nel.animate([{opacity:0},{opacity:1}], {duration:420});\nnew ScrollTimeline({source: scroller});';
 const records=extractJsMotionSites(code,'/source.js','https://example.test/source.js');
 assert.equal(records.length,2);assert.equal(records[0].api,'animate');assert.equal(records[0].code,'el.animate([{opacity:0},{opacity:1}], {duration:420})');assert.equal(records[1].api,'ScrollTimeline');assert.ok(records.every(r=>r.status==='source-only'));
});
test('Nested motion calls and computed API names remain distinct source sites',()=>{
 const records=extractJsMotionSites('requestAnimationFrame(()=>el["animate"]([{opacity:0},{opacity:1}], 200));','/source.js','https://example.test/source.js');
 assert.equal(records.length,2);assert.notEqual(records[0].id,records[1].id);assert.equal(records[1].api,'animate');
});
