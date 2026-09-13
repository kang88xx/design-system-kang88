// Copies the system sources into app/library, concatenates styles.css, syntax-checks the JSX with esbuild
// when available, and packs the tarball into app/public/reatic-design-system-0.1.0.tgz.
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const app = path.resolve(new URL('..', import.meta.url).pathname);
const system = path.join(app, 'src/system');
const lib = path.join(app, 'library');
const pkg = JSON.parse(await fs.readFile(path.join(lib, 'package.json'), 'utf8'));
for (const f of ['index.js', 'index.d.ts', 'components.jsx', 'tokens.css', 'motion.css', 'components.css', 'tokens.json']) {
  await fs.copyFile(path.join(system, f), path.join(lib, f));
}
const styles = ['tokens.css', 'motion.css', 'components.css'].map(f => `/* ---- ${f} ---- */`).join('\n');
const css = (await Promise.all(['tokens.css', 'motion.css', 'components.css'].map(f => fs.readFile(path.join(system, f), 'utf8')))).join('\n\n');
await fs.writeFile(path.join(lib, 'styles.css'), `/* @local/reatic-design-system ${pkg.version} — ${styles.replace(/\n/g, ' ')} */\n\n${css}`);
const esbuild = ['/mnt/j/02_Source/apple_design/app/node_modules/esbuild/bin/esbuild', process.env.ESBUILD].filter(Boolean);
for (const bin of esbuild) {
  try { await fs.access(bin); execFileSync('node', [bin, path.join(lib, 'components.jsx'), '--loader:.jsx=jsx', '--jsx=automatic', '--format=esm', '--log-level=warning', '--outfile=/dev/null']); console.log('JSX syntax check passed'); break; } catch (e) { if (e.code !== 'ENOENT') throw e; }
}
await fs.mkdir(path.join(app, 'public'), { recursive: true });
try {
  const out = execFileSync('npm', ['pack', '--pack-destination', path.join(app, 'public'), '--silent'], { cwd: lib, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
  const packed = path.join(app, 'public', out);
  const target = path.join(app, 'public', `reatic-design-system-${pkg.version}.tgz`);
  if (packed !== target) { await fs.copyFile(packed, target); await fs.rm(packed); }
  console.log('packed', path.relative(app, target));
} catch (e) {
  console.log('npm pack unavailable, library folder is still usable directly:', e.message);
}
