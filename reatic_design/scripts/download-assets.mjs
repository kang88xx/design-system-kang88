// Downloads original images, background videos (720p) and web fonts referenced by the saved HTML.
// Reads evidence/source/static-extraction.json (run extract-static.mjs first). Run from the repository root.
import fs from 'node:fs/promises';
import path from 'node:path';
import { UA_DESKTOP } from './browser-runtime.mjs';

const ex = JSON.parse(await fs.readFile('evidence/source/static-extraction.json', 'utf8'));
const dirs = { images: 'app/public/source/images', videos: 'app/public/media', fonts: 'app/public/source/fonts' };
for (const d of Object.values(dirs)) await fs.mkdir(d, { recursive: true });
const failures = [];
async function save(url, file) {
  try { await fs.access(file); return 'exists'; } catch {}
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA_DESKTOP } });
    if (!res.ok) { failures.push({ url, status: res.status }); return 'fail'; }
    await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
    return 'ok';
  } catch (e) { failures.push({ url, error: e.message }); return 'fail'; }
}
let n = 0;
for (const u of ex.media.images) { await save(u, path.join(dirs.images, path.basename(u))); n++; }
for (const id of ex.media.videos) { await save(`https://video.wixstatic.com/video/${id}/720p/mp4/file.mp4`, path.join(dirs.videos, `${id}.mp4`)); n++; }
for (const f of ex.fontFaces) { await save(f.url, path.join(dirs.fonts, `${f.family.replace(/\s+/g, '_')}-${f.weight}-${f.style}-${path.basename(f.url)}`)); n++; }
await fs.writeFile('evidence/source/download-report.json', JSON.stringify({ attempted: n, failures, at: new Date().toISOString() }, null, 2));
console.log('download-assets: attempted', n, 'failures', failures.length);
