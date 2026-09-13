// Minimal static server for the studio and reconstruction pages. `node scripts/serve.mjs [port] [root]`
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const port = Number(process.argv[2] || process.env.PORT || 4180);
const root = path.resolve(process.argv[3] || 'app');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.jsx': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff', '.md': 'text/markdown; charset=utf-8', '.tgz': 'application/gzip', '.txt': 'text/plain; charset=utf-8', '.ts': 'text/plain; charset=utf-8' };
export function createServer(rootDir = root) {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(rootDir, decodeURIComponent(url.pathname));
    if (!file.startsWith(rootDir)) { res.writeHead(403); return res.end(); }
    try { if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html'); } catch { res.writeHead(404); return res.end('not found'); }
    fs.stat(file, (err, stat) => {
      if (err) { res.writeHead(404); return res.end('not found'); }
      const ext = path.extname(file).toLowerCase();
      const type = types[ext] || 'application/octet-stream';
      const range = req.headers.range;
      if (range && ext === '.mp4') {
        const [s, e] = range.replace('bytes=', '').split('-'); const start = Number(s); const end = e ? Number(e) : stat.size - 1;
        res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
        return fs.createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
      fs.createReadStream(file).pipe(res);
    });
  });
}
if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}/`));
}
