import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeCss,javascriptReferences,resolveReference} from '../../scripts/source-analysis.mjs';
test('CSS retains selector and media context beyond the old 800 rule cap',()=>{
 const input='@media (min-width: 734px){'+Array.from({length:805},(_,i)=>`.a${i}{--size:${i}px;transition:opacity 240ms ease}`).join('')+'}@keyframes show{from{opacity:0}to{opacity:1}}';
 const result=analyzeCss(input,'https://www.apple.com/styles.css','/styles.css');
 assert.equal(result.motions.length,806);assert.equal(result.variables.length,805);
 assert.deepEqual(result.motions[1].context,['@media (min-width: 734px)']);
 assert.match(result.motions[1].css,/\.a0\{/);
});
test('dependency references include static and literal dynamic modules, with unresolved expressions counted',()=>{
 const r=javascriptReferences('import x from "./x.js"; export * from "./y.js"; import("./lazy.js"); import(name); new URL("./icon.svg",import.meta.url);');
 assert.deepEqual(new Set(r.references),new Set(['./x.js','./y.js','./lazy.js','./icon.svg']));assert.equal(r.unresolvedDynamicImports,1);
 assert.equal(resolveReference('../x.js#h','https://www.apple.com/v/a.js'),'https://www.apple.com/x.js');assert.equal(resolveReference('data:text/plain,x','https://www.apple.com'),null);
});
