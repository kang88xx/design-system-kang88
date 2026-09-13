// Static extraction from the saved HTML in evidence/source: Wix theme variables, font-face declarations,
// colors, media URLs, motion keyframes/animation declarations, component classes and text content.
// Output: evidence/source/static-extraction.json. Run from the repository root.
import fs from 'node:fs/promises';
import path from 'node:path';

const src = path.resolve('evidence/source');
const pages = ['home', 'about', 'contact', 'portfolio'];
const count = (arr) => { const m = new Map(); for (const a of arr) m.set(a, (m.get(a) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => ({ value, n })); };
const result = { pages: {}, theme: {}, fontFaces: [], media: { images: [], videos: [], youtube: [] } };
const images = new Set(); const videos = new Set(); const yt = new Set(); const faces = new Map();

for (const p of pages) {
  const h = await fs.readFile(path.join(src, `${p}.html`), 'utf8');
  const page = {};
  page.title = (h.match(/<title>([^<]*)<\/title>/) || [])[1];
  page.description = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  page.colors = count([...h.matchAll(/#[0-9a-fA-F]{6}\b|rgba?\([^)]*\)/g)].map(m => m[0].toLowerCase())).slice(0, 40);
  page.fontFamilies = count([...h.matchAll(/font-family:\s*([^;"}]+)/g)].map(m => m[1].trim())).slice(0, 30);
  page.fontSizes = count([...h.matchAll(/font-size:\s*([\d.]+px)/g)].map(m => m[1]));
  page.letterSpacing = count([...h.matchAll(/letter-spacing:\s*([-\d.]+(?:em|px))/g)].map(m => m[1]));
  page.lineHeight = count([...h.matchAll(/line-height:\s*([\d.]+(?:em|px)?)/g)].map(m => m[1])).slice(0, 12);
  page.keyframes = count([...h.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]));
  page.animations = count([...h.matchAll(/animation(?:-name)?:\s*([^;"}]+)/g)].map(m => m[1].trim()));
  page.transitions = count([...h.matchAll(/transition:\s*([^;"}]+)/g)].map(m => m[1].trim())).slice(0, 20);
  page.motionVars = count([...h.matchAll(/(--motion-[\w-]+):\s*([^;]+)/g)].map(m => `${m[1]}: ${m[2].trim()}`));
  page.motionEnter = count([...h.matchAll(/data-motion-enter="([^"]*)"/g)].map(m => m[1]));
  page.wixComponents = count([...h.matchAll(/\b(wixui-[\w-]+)/g)].map(m => m[1])).slice(0, 40);
  page.sections = [...h.matchAll(/<(section|header|footer)[^>]*id="([^"]+)"/g)].map(m => ({ tag: m[1], id: m[2] }));
  page.texts = [];
  const seen = new Set();
  for (const m of h.matchAll(/<(h[1-6]|p|span)[^>]*class="[^"]*font_\d[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)) {
    const t = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (t && !seen.has(t) && t.length < 300) { seen.add(t); page.texts.push({ tag: m[1], text: t }); }
  }
  for (const m of h.matchAll(/https:\/\/static\.wixstatic\.com\/media\/[^"'\s,)]+/g)) images.add(m[0].split('/v1/')[0].replace('%7E', '~'));
  for (const m of h.matchAll(/(3ae519_[0-9a-f]{32})\/(?:1080p|720p|480p|360p)\/mp4/g)) videos.add(m[1]);
  for (const m of h.matchAll(/(?:youtu\.be\\?\/|youtube\.com\\?\/watch\?v=)([\w-]+)/g)) yt.add(m[1]);
  for (const m of h.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const b = m[1];
    const fam = (b.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1]; const w = (b.match(/font-weight:\s*(\d+)/) || [])[1] || '400'; const st = (b.match(/font-style:\s*(\w+)/) || [])[1] || 'normal'; const url = (b.match(/url\(['"]?((?:\/\/|https?:\/\/)[^'")]+\.woff2)/) || [])[1];
    if (fam && url) faces.set(`${fam}|${w}|${st}|${url}`, { family: fam.trim(), weight: w, style: st, url: url.startsWith('//') ? 'https:' + url : url });
  }
  if (p === 'home') {
    const block = (h.match(/--color_0:[^}]*/) || [''])[0];
    result.theme.colors = Object.fromEntries([...block.matchAll(/--(color_\d+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
    result.theme.fonts = Object.fromEntries([...h.matchAll(/--(font_\d+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
    result.theme.menu = (h.match(/#comp-[\w]+\{[^}]*--txth[^}]*\}/) || [''])[0];
    result.theme.header = [...h.matchAll(/#SITE_HEADER\{[^}]*(?:--shd|--bg)[^}]*\}/g)].map(m => m[0]);
  }
  result.pages[p] = page;
}
result.media.images = [...images].sort();
result.media.videos = [...videos].sort();
result.media.youtube = [...yt].sort();
result.fontFaces = [...faces.values()];
await fs.writeFile(path.join(src, 'static-extraction.json'), JSON.stringify(result, null, 1));
console.log('extract-static done:', Object.keys(result.pages), 'images', images.size, 'videos', videos.size, 'youtube', yt.size, 'font faces', faces.size);
