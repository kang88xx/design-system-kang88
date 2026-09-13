import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../app/package.json',import.meta.url));
const postcss=require('postcss');
const file='app/public/extraction.json';
const manifest=JSON.parse(await fs.readFile(file,'utf8'));
manifest.nav=manifest.nav.filter(n=>n.groups.length<=3);
const cssFile='app/public/fonts/source-fonts.css';
const original=await fs.readFile(cssFile,'utf8');
await fs.writeFile('evidence/source/fonts-full.css',original);
const css=postcss.parse(original);
const available=new Set(manifest.resources.map(r=>r.file));
css.walkAtRules('font-face',rule=>{
 let retained=false;
 rule.walkDecls('src',decl=>{
  const urls=[...decl.value.matchAll(/url\(["']?([^"')]+)["']?\)\s*format\(["']?([^"')]+)["']?\)/g)];
  const valid=urls.filter(m=>available.has(m[1]));
  if(valid.length){decl.value=valid.map(m=>m[0]).join(', ');retained=true;}else decl.remove();
 });
 if(!retained)rule.remove();
});
await fs.writeFile(cssFile,css.toString());
manifest.omittedFontVariants=manifest.failures.filter(f=>/\/wss\/fonts\//.test(f.url));
manifest.failures=manifest.failures.filter(f=>!/\/wss\/fonts\//.test(f.url));
manifest.notes=['Unused unavailable font variants omitted from runtime stylesheet; full upstream font stylesheet preserved in evidence/source/fonts-full.css.','Product media supports the runnable homepage; code library excludes standalone raster files.'];
await fs.writeFile(file,JSON.stringify(manifest,null,2));
console.log('Normalized',manifest.nav.length,'menus;',manifest.failures.length,'runtime resource failures');
