import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {transformWithEsbuild} from 'vite';

async function withForms(run){
 const appRoot=path.resolve(new URL('..',import.meta.url).pathname);
 const tmp=await fs.mkdtemp(path.join(appRoot,'node_modules/.forms-test-'));
 try{
  const source=await fs.readFile(path.join(appRoot,'src/system/forms.jsx'),'utf8');
  const {code}=await transformWithEsbuild(source,'forms.jsx',{loader:'jsx',jsx:'automatic'});
  await fs.writeFile(path.join(tmp,'forms.mjs'),code);
  await run(await import(pathToFileURL(path.join(tmp,'forms.mjs'))));
 }finally{await fs.rm(tmp,{recursive:true,force:true});}
}
test('TextField associates label, hint, error and caller description; preserves native form attributes',()=>withForms(({TextField})=>{
 const html=renderToStaticMarkup(React.createElement(TextField,{id:'email',label:'Email',name:'email',type:'email',required:true,defaultValue:'x@y.com',hint:'Work address',error:'Try another address','aria-describedby':'policy',readOnly:true}));
 assert.match(html,/<label[^>]+for="email"/);
 assert.match(html,/aria-describedby="policy email-hint email-error"/);
 assert.match(html,/aria-invalid="true"/);assert.match(html,/name="email"/);assert.match(html,/required=""/);assert.match(html,/readOnly=""/);assert.match(html,/value="x@y.com"/);
}));
test('Multiple generated field ids are distinct and labels connect',()=>withForms(({TextField})=>{
 const html=renderToStaticMarkup(React.createElement('form',null,React.createElement(TextField,{label:'First'}),React.createElement(TextField,{label:'Second'})));
 const ids=[...html.matchAll(/<input[^>]*id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,2);assert.equal(new Set(ids).size,2);for(const id of ids)assert.ok(html.includes(`for="${id}"`));
}));
test('Dialog server-renders closed with title/description associations and no window access',()=>withForms(({Dialog})=>{
 const html=renderToStaticMarkup(React.createElement(Dialog,{open:true,onOpenChange:()=>{},title:'Confirm changes',description:'Review values'},'Content'));
 assert.match(html,/<dialog/);assert.doesNotMatch(html,/<dialog[^>]*\sopen[\s=>]/);assert.match(html,/aria-labelledby="[^"]+-title"/);assert.match(html,/aria-describedby="[^"]+-description"/);assert.match(html,/aria-label="Close dialog"/);
}));
