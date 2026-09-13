import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const read = async name => JSON.parse(await readFile(name, 'utf8'));
const library = await read('data/toss-source-library.json');
const manifest = await read('data/toss-asset-manifest.json');
assert.equal(library.schemaVersion, 2);
assert.equal(new Set(library.entries.map(e => e.id)).size, library.entries.length, 'Stable IDs must be unique');
assert.deepEqual(library.coverage.viewports, [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]);
assert.equal(Object.keys(library.coverage.categories).length, 9);
for (const [category, count] of Object.entries(library.coverage.categories)) {
  assert.equal(library.entries.filter(e => e.category === category).length, count);
  assert.ok(count > 0, `Empty category: ${category}`);
}
for (const entry of library.entries) {
  assert.ok(entry.code.value.trim(), `${entry.id}: missing code`);
  assert.ok(entry.source.url.startsWith('https://'), `${entry.id}: missing original URL`);
  assert.ok(['observed', 'inferred', 'recreated'].includes(entry.evidence));
  if (entry.code.language === 'svg') {
    assert.ok(!/<(?:script|foreignObject|iframe)\b|\son\w+\s*=|javascript:/i.test(entry.code.value), `${entry.id}: executable SVG`);
    const ids = new Set([...entry.code.value.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
    for (const reference of entry.code.value.matchAll(/url\(#([^\)]+)\)/g)) assert.ok(ids.has(reference[1]), `${entry.id}: unresolved SVG reference ${reference[1]}`);
  }
  if (entry.preview.url?.startsWith('./')) await stat(entry.preview.url);
}
assert.equal(library.entries.filter(e => e.evidence === 'recreated').length, 6);
for (const asset of manifest.assets) {
  assert.equal(new URL(asset.url).hostname, 'static.toss.im');
  if (asset.status === 'archived') {
    assert.ok(asset.localPath.startsWith('./assets/source/'));
    const data = await readFile(asset.localPath);
    assert.equal(data.byteLength, asset.bytes);
    assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256, `Checksum mismatch: ${asset.url}`);
    assert.ok(!['font', 'video'].includes(asset.kind));
  } else assert.ok(asset.reason, `${asset.url}: missing remote/failure explanation`);
}
const css = await readFile('tokens.css', 'utf8');
const figma = await read('figma/figma-variables.json');
for (const [name, value] of [['fast', 150], ['medium', 200]]) {
  assert.ok(css.includes(`--duration-${name}: ${value}ms;`));
  assert.equal(figma.collections[0].variables.find(v => v.name === `motion/duration/${name}`).values.Base, value);
}
console.log(JSON.stringify({ result: 'pass', entries: library.entries.length, categories: library.coverage.categories, assetsChecked: manifest.assets.length, reconstructedRecipes: 6 }, null, 2));
