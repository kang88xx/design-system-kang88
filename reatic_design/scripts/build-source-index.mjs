// Indexes every collected and authored file with size and SHA-256; reports missing expected assets.
// Output: evidence/source-index.json and evidence/completeness.json. Run from the repository root.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const groups = {
  'source-html': ['evidence/source/home.html', 'evidence/source/about.html', 'evidence/source/contact.html', 'evidence/source/portfolio.html', 'evidence/source/mobile.html'],
  'source-data': ['evidence/source/computed-styles.json', 'evidence/source/component-measurements.json', 'evidence/source/static-extraction.json'],
  'source-screenshots': 'evidence/source/screenshots',
  'source-images': 'app/public/source/images',
  'source-fonts': 'app/public/source/fonts',
  'media-videos': 'app/public/media',
  'assets': 'app/public/assets',
  'system': 'app/src/system',
  'studio': ['app/index.html', 'app/studio.css', 'app/studio.js'],
  'reconstruction': 'app/public/reconstruction',
  'templates': 'templates',
  'docs': 'docs',
  'scripts': 'scripts',
};
async function walk(dir) {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const index = []; const missing = [];
for (const [group, spec] of Object.entries(groups)) {
  const files = [];
  if (Array.isArray(spec)) { for (const f of spec) { try { await fs.access(f); files.push(f); } catch { missing.push({ group, file: f }); } } }
  else { try { files.push(...await walk(spec)); } catch { missing.push({ group, file: spec }); } }
  for (const f of files) {
    const buf = await fs.readFile(f);
    index.push({ group, file: f.replace(/\\/g, '/'), bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
  }
}
const ex = JSON.parse(await fs.readFile('evidence/source/static-extraction.json', 'utf8'));
const expectedImages = ex.media.images.map(u => path.basename(u));
const haveImages = new Set(index.filter(i => i.group === 'source-images').map(i => path.basename(i.file)));
const missingImages = expectedImages.filter(n => !haveImages.has(n));
const expectedVideos = ex.media.videos; const haveVideos = new Set(index.filter(i => i.group === 'media-videos').map(i => path.basename(i.file, '.mp4')));
const missingVideos = expectedVideos.filter(v => !haveVideos.has(v));
const summary = {
  generated: new Date().toISOString(),
  files: index.length,
  bytes: index.reduce((a, b) => a + b.bytes, 0),
  byGroup: Object.fromEntries(Object.keys(groups).map(g => [g, index.filter(i => i.group === g).length])),
  referenced: { images: expectedImages.length, videos: expectedVideos.length, fontFaces: ex.fontFaces.length, youtube: ex.media.youtube.length },
  missing: { paths: missing, images: missingImages, videos: missingVideos },
  notes: [
    'Videos are stored at 720p; 1080p/480p/360p renditions exist on the origin but were not copied.',
    'YouTube portfolio links are external references, not archived media.',
    'Wix runtime bundles (parastorage) are not archived; the saved HTML contains inline theme CSS and the component markup.',
  ],
};
await fs.writeFile('evidence/source-index.json', JSON.stringify(index, null, 1));
await fs.writeFile('evidence/completeness.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary.byGroup), 'missing images', missingImages.length, 'missing videos', missingVideos.length);
