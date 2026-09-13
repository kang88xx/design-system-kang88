import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
const root=new URL('../',import.meta.url);
const read=file=>readFile(new URL(file,root));
const hash=x=>createHash('sha256').update(x).digest('hex');
const manifest=JSON.parse(await read('viewer/downloads/source-kit-manifest.json'));
const bytes=await read('viewer/downloads/'+manifest.file);
assert.equal(hash(bytes),manifest.sha256);assert.equal(bytes.length,manifest.bytes);
const entries=new Map();let offset=0;
while(bytes.readUInt32LE(offset)===0x04034b50){
  assert.equal(bytes.readUInt16LE(offset+8),8,'ZIP entries use standard DEFLATE');
  const compressedSize=bytes.readUInt32LE(offset+18),size=bytes.readUInt32LE(offset+22),nameLength=bytes.readUInt16LE(offset+26),extraLength=bytes.readUInt16LE(offset+28);
  const name=bytes.subarray(offset+30,offset+30+nameLength).toString();
  assert(!name.startsWith('/')&&!name.includes('..')&&!name.includes('references-private')&&!name.includes('viewer-private'));
  const start=offset+30+nameLength+extraLength;const content=inflateRawSync(bytes.subarray(start,start+compressedSize));assert.equal(content.length,size);assert(!entries.has(name));entries.set(name,content);offset=start+compressedSize;
}
assert.equal(bytes.readUInt32LE(offset),0x02014b50,'local entries end at ZIP central directory');
assert.equal(entries.size,manifest.entries.length);
for(const entry of manifest.entries){assert(entries.has(entry.path));assert.equal(hash(entries.get(entry.path)),entry.sha256);assert.equal(entries.get(entry.path).length,entry.bytes);if(!['README.txt','example.html'].includes(entry.path))assert.equal(hash(await read(entry.path)),entry.sha256,`${entry.path} matches source`);}
assert(entries.has('data/curated/recipes.css'));assert(entries.has('assets/upstream/material-design-icons/LICENSE'));
assert.equal([...entries.keys()].filter(x=>x.endsWith('.svg')).length,81);
assert(entries.get('example.html').toString().includes('data/curated/recipes.css'));
console.log(`Source kit passed: ${entries.size} intact ZIP entries`);
