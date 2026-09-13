import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const [library, motion, css, tokens, source, extra] = await Promise.all([
  readJson('data/curated/reuse-library.json'), readJson('data/curated/motion.json'),
  readFile('data/curated/recipes.css', 'utf8'), readFile('data/curated/tokens.css', 'utf8'),
  readJson('data/curated/source-manifest.json'), readJson('data/curated/upstream-icons.json'),
]);
for (const type of ['examples', 'surfaces', 'motion']) {
  assert.equal(library[type].length, library.counts[type], `${type} count`);
  assert.equal(new Set(library[type].map(x => x.id)).size, library[type].length, `${type} unique IDs`);
  for (const item of library[type]) {
    assert.ok(['observed', 'documented', 'approximation'].includes(item.evidence), `${item.id} evidence`);
    assert.match(item.sourceUrl, /^https:\/\/(montage\.wanted\.co\.kr|github\.com)\//, `${item.id} source`);
    assert.ok((item.code || item.css)?.trim().length > 20, `${item.id} nonempty code`);
  }
}
assert.ok(library.examples.length >= 500, 'preserve substantial platform examples');
assert.ok(library.motion.some(x => x.evidence === 'observed'));
assert.ok(library.motion.some(x => x.evidence === 'approximation'));
assert.match(css, /prefers-reduced-motion:\s*reduce/);
const definitions = new Set([...`${tokens}\n${css}`.matchAll(/(--[\w-]+)\s*:/g)].map(x => x[1]));
for (const [, variable] of css.matchAll(/var\((--[\w-]+)/g)) assert.ok(definitions.has(variable), `undefined token ${variable}`);
const viewerHtml = await readFile('viewer/index.html', 'utf8');
for (const [, variable] of viewerHtml.matchAll(/var\((--semantic-[\w-]+)/g)) assert.ok(definitions.has(variable), `viewer undefined semantic token ${variable}`);
assert.deepEqual(motion.motion, library.motion, 'motion mirror stays synchronized');
assert.deepEqual(source.siteVerification.failedPages, []);
assert.deepEqual(source.siteVerification.addedPages, []);
assert.ok(source.counts.sourceFiles > 900);
assert.equal(source.counts.iconComponents, 359);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
for (const file of [source.upstream, ...source.files, ...extra]) {
  const bytes = await readFile(file.localPath);
  assert.equal(bytes.byteLength, file.byteSize, `${file.localPath} size`);
  assert.equal(sha256(bytes), file.sha256, `${file.localPath} hash`);
}
assert.equal(extra.length, 20);
const original = await readJson('data/curated/icon-vectors.json');
assert.equal(new Set([...original, ...extra].map(x => x.name)).size, 359);
for (const icon of extra) {
  const svg = await readFile(icon.localPath, 'utf8');
  assert.match(svg, /^<svg[\s>]/);
  assert.doesNotMatch(svg, /\{(?:\.\.\.|`)|<script\b|\son\w+=|\buseId\(/);
}
assert.match(await readFile(source.upstream.licensePath, 'utf8'), /MIT License/);
console.log(JSON.stringify({ status: 'ok', ...library.counts, upstreamSourceFiles: source.files.length, icons: 359, archiveSha256: source.upstream.sha256 }, null, 2));
