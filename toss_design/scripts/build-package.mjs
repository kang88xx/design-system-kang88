import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => readFile(path.join(root, name), 'utf8');
const library = JSON.parse(await read('data/toss-source-library.json'));
const manifest = JSON.parse(await read('data/toss-asset-manifest.json'));
await mkdir(path.join(root, 'dist/snippets'), { recursive: true });
const mime = filename => ({ png: 'image/png', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', json: 'application/json', bin: 'application/octet-stream' })[filename.split('.').at(-1)] || 'application/octet-stream';
const embeddedAssets = new Map();
for (const asset of manifest.assets.filter(a => a.status === 'archived')) {
  const bytes = await readFile(path.join(root, asset.localPath));
  embeddedAssets.set(asset.localPath, `data:${asset.contentType || mime(asset.localPath)};base64,${bytes.toString('base64')}`);
}
let html = await read('index.html');
for (const match of html.matchAll(/(?:src|srcset)="(\.\/evidence\/[^"?]+)"/g)) {
  if (!embeddedAssets.has(match[1])) embeddedAssets.set(match[1], `data:${mime(match[1])};base64,${(await readFile(path.join(root, match[1]))).toString('base64')}`);
}
function embedAssets(text) {
  return text.replace(/\.\/icons\.svg(?:\?[^"'#\s]+)?#/g, '#');
}
const dataFiles = ['data/toss-source-library.json', 'data/toss-asset-manifest.json', 'data/toss-source-capture.json', 'data/toss-live-design-catalog.json'];
const dataMap = {};
for (const file of dataFiles) dataMap[file] = JSON.parse(await read(file));
const documents = {};
for (const file of ['README.md', 'DESIGN.md', 'source-coverage.md', 'tokens.css', 'dist/toss-observed-tokens.css']) documents[file] = await read(file);
// Local file:// fetch is unavailable; serve embedded JSON responses from this artifact only.
const boot = `(() => {
  const raw = ${JSON.stringify(dataMap).replaceAll('<', '\\u003c')};
  const documents = ${JSON.stringify(documents).replaceAll('<', '\\u003c')};
  const media = ${JSON.stringify(Object.fromEntries(embeddedAssets)).replaceAll('<', '\\u003c')};
  const urls = {};
  for (const [name, encoded] of Object.entries(media)) {
    const split = encoded.indexOf(',');
    const bytes = Uint8Array.from(atob(encoded.slice(split + 1)), c => c.charCodeAt(0));
    urls[name] = URL.createObjectURL(new Blob([bytes], {type: encoded.slice(5, split).split(';')[0]}));
    delete media[name];
  }
  const replace = value => {
    if (typeof value === 'string') return value.replace(/\\.\\/(?:assets\\/source|evidence)\\/[^\\s"')<>]+/g, name => urls[name] || name);
    if (Array.isArray(value)) return value.map(replace);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === 'code' ? item : replace(item)]));
    return value;
  };
  const data = replace(raw);
  const original = window.fetch.bind(window);
  window.fetch = (input, options) => {
    const text = String(input), key = text.replace(/^\\.\\//, '').split('?')[0];
    if (Object.hasOwn(data, key)) return Promise.resolve(new Response(JSON.stringify(data[key]), {headers:{'Content-Type':'application/json'}}));
    return original(urls[text] || input, options);
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-embedded-src]').forEach(node => {node.src = urls[node.dataset.embeddedSrc] || node.dataset.embeddedSrc;});
    document.querySelectorAll('a[href]').forEach(node => {
      const key = node.getAttribute('href').replace(/^\\.\\//, '').split('?')[0];
      if (Object.hasOwn(raw,key)) node.href = URL.createObjectURL(new Blob([JSON.stringify(raw[key],null,2)], {type:'application/json'}));
      if (Object.hasOwn(documents,key)) node.href = URL.createObjectURL(new Blob([documents[key]], {type:'text/plain;charset=utf-8'}));
    });
  });
})();`;
html = html.replace(/<link rel="stylesheet" href="([^"?]+)(?:\?[^"]*)?"\s*\/>/g, (_, file) => `<style data-file="${file}"></style>`);
for (const match of [...html.matchAll(/<style data-file="([^"]+)"><\/style>/g)]) {
  let style = await read(match[1]);
  style = style.replace(/@import\s+"\.\/tokens\.css[^";]*";/, await read('tokens.css'));
  html = html.replace(match[0], `<style>\n${embedAssets(style)}\n</style>`);
}
const sprite = (await read('icons.svg')).replace('<svg ', '<svg style="display:none" aria-hidden="true" ');
html = html.replace('<body>', `<body>\n${sprite}\n<script>${boot}</script>`);
for (const match of [...html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"><\/script>/g)]) {
  const script = embedAssets(await read(match[1])).replace(/<\/script/gi, '<\\/script');
  html = html.replace(match[0], `<script>\n${script}\n</script>`);
}
html = embedAssets(html);
html = html.replace(/src="(\.\/(?:evidence|assets\/source)\/[^"?]+)"/g, (_, file) => `data-embedded-src="${file}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"`);
html = html.replace(/<source[^>]*srcset="\.\/evidence\/[^>]+>/g, '');
// Downloads from the standalone artifact are code/source entries; full archive link is a sibling.
html = html.replaceAll('./dist/toss-source-kit.zip', './toss-source-kit.zip');
await writeFile(path.join(root, 'dist/toss-design-system.html'), html);

for (const entry of library.entries) {
  const extension = entry.code.language === 'javascript' ? 'js' : entry.code.language;
  await writeFile(path.join(root, 'dist/snippets', `${entry.id}.${extension}`), entry.code.value.replaceAll('./assets/source/', '../../assets/source/'));
}
const packageScript = `
from pathlib import Path
import zipfile, json
root = Path(${JSON.stringify(root)})
files = [p for p in root.iterdir() if p.is_file() and p.suffix in {'.html','.css','.js','.svg','.md'} and not p.name.startswith('._')]
for folder in ('scripts', 'data', 'assets', 'figma', 'evidence'):
    files += [p for p in (root/folder).rglob('*') if p.is_file() and not p.name.startswith('._')]
files += [p for p in (root/'dist/snippets').glob('*') if p.is_file()]
files += [root/'dist/toss-observed-tokens.css']
with zipfile.ZipFile(root/'dist/toss-source-kit.zip','w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in sorted(set(files)):
        relative = str(p.relative_to(root))
        if relative in ('index.html','live-catalog.js'):
            text = p.read_text().replace('./dist/toss-source-kit.zip','./README.md').replace('소스 키트 다운로드','키트 사용 방법').replace('키트 다운로드','키트 사용 방법')
            archive.writestr(relative, text)
        else:
            archive.write(p, relative)
print(json.dumps({'packageFiles':len(set(files)), 'zipBytes':(root/'dist/toss-source-kit.zip').stat().st_size}))
`;
const result = execFileSync('python3', ['-c', packageScript], { encoding: 'utf8' });
console.log(result.trim());
console.log(`Standalone HTML: ${Buffer.byteLength(html)} bytes; snippets: ${library.entries.length}`);
