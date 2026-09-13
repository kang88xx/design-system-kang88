import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../app/package.json',import.meta.url));
const {parse}=require('@babel/parser');
const manifest=JSON.parse(await fs.readFile('app/public/extraction.json','utf8'));
const visited=new Set();
const failed=[];
async function visit(file){
 if(visited.has(file))return;visited.add(file);
 let code;
 try{code=await fs.readFile('app/public'+file,'utf8');}catch{
  const url='https://www.apple.com'+file;const response=await fetch(url);
  if(!response.ok){failed.push({url,status:response.status});return;}
  code=await response.text();await fs.mkdir(path.dirname('app/public'+file),{recursive:true});await fs.writeFile('app/public'+file,code);
  manifest.resources.push({url,file});console.log('Module',file);
 }
 let ast;try{ast=parse(code,{sourceType:'unambiguous',errorRecovery:true});}catch{return;}
 const imports=new Set();
 function walk(node){if(!node||typeof node!=='object')return;
  if(['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration','ImportExpression'].includes(node.type)&&node.source?.value)imports.add(node.source.value);
  if(node.type==='CallExpression'&&node.callee.type==='Import'&&node.arguments[0]?.type==='StringLiteral')imports.add(node.arguments[0].value);
  for(const [key,value] of Object.entries(node)){if(['loc','start','end','errors','comments','tokens'].includes(key))continue;if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value);}
 }walk(ast);
 for(const target of imports){const url=new URL(target,'https://www.apple.com'+file);if(url.hostname==='www.apple.com'&&url.pathname.endsWith('.js'))await visit(url.pathname);}
}
for(const r of [...manifest.resources])if(r.file.endsWith('.js'))await visit(r.file);
await fs.writeFile('app/public/extraction.json',JSON.stringify(manifest,null,2));console.log(JSON.stringify({scanned:visited.size,failed}));
