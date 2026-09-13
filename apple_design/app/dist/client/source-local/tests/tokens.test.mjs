import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const tokens=JSON.parse(await fs.readFile(new URL('src/system/tokens.json',root),'utf8'));
function luminance(hex){const rgb=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('Generated CSS matches canonical JSON',()=>{const r=spawnSync(process.execPath,['scripts/generate-tokens.mjs','--check'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);});
test('Default theme text and action pairs meet 4.5:1 contrast',()=>{
 for(const theme of [{},tokens.themes.dark]){
  const c={...tokens.apple.color,...theme.color};
  for(const [text,background] of [['black','surface'],['muted','surface'],['danger','surface'],['link','surface'],['white','blue'],['white','blueHover'],['white','blueActive']])assert.ok(ratio(c[text],c[background])>=4.5,`${text}/${background}: ${ratio(c[text],c[background])}`);
 }
});
