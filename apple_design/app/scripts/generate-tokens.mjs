import fs from 'node:fs/promises';
const root=new URL('../src/system/',import.meta.url);
const data=JSON.parse(await fs.readFile(new URL('tokens.json',root),'utf8'));
const kebab=value=>value.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase());
function declarations(apple){
 const values={};
 for(const [name,value] of Object.entries(apple.color||{}))values[`--apple-${kebab(name)}`]=value;
 for(const [name,value] of Object.entries(apple.font||{}))values[`--apple-font-${kebab(name)}`]=value;
 for(const group of ['radius','breakpoint','space'])for(const [name,value] of Object.entries(apple[group]||{}))values[`--apple-${group}-${kebab(name)}`]=typeof value==='number'?value+'px':value;
 for(const [name,spec] of Object.entries(apple.text||{}))for(const [prop,value] of Object.entries(spec))values[`--apple-text-${kebab(name)}-${prop==='fontSize'?'size':'line'}`]=value+'px';
 for(const [name,value] of Object.entries(apple.button||{}))values[`--apple-button-${kebab(name)}`]=value+'px';
 for(const group of ['motion','shadow'])for(const [name,value] of Object.entries(apple[group]||{}))values[`--apple-${group}-${kebab(name)}`]=value;
 return Object.entries(values).map(([name,value])=>`  ${name}: ${value};`).join('\n');
}
const css='/* Generated from tokens.json. Run npm run tokens:build after editing tokens. */\n:root {\n'+declarations(data.apple)+'\n}\n'+Object.entries(data.themes||{}).map(([name,theme])=>`\n[data-ds-theme="${name}"] {\n${declarations(theme)}\n}\n`).join('');
if(process.argv.includes('--check')){
 if(await fs.readFile(new URL('tokens.css',root),'utf8')!==css)throw new Error('tokens.css is stale; run npm run tokens:build');
 console.log('Token JSON and CSS match.');
}else{await fs.writeFile(new URL('tokens.css',root),css);console.log('Generated tokens.css');}
