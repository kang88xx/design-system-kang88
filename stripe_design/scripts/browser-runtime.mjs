import { readdir, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Reuse an existing Playwright install; never installs anything.
export async function launchBrowser(extra = {}) {
  const candidates = [process.env.PLAYWRIGHT_MODULE, '/Users/henry/office/node_modules/playwright/index.mjs'].filter(Boolean);
  const cache = path.join(homedir(), '.npm/_npx');
  for (const entry of await readdir(cache).catch(() => [])) candidates.push(path.join(cache, entry, 'node_modules/playwright/index.mjs'));
  let modulePath;
  for (const c of candidates) { try { await access(c); modulePath = c; break; } catch {} }
  if (!modulePath) throw new Error('Playwright not found. Set PLAYWRIGHT_MODULE.');
  const { chromium } = await import(pathToFileURL(modulePath).href);
  const options = { headless: true, args: ['--no-sandbox'], ...extra };
  if (process.env.CHROMIUM_EXECUTABLE) options.executablePath = process.env.CHROMIUM_EXECUTABLE;
  try { return await chromium.launch(options); } catch (e) {
    const mac = path.join(homedir(), 'Library/Caches/ms-playwright');
    for (const entry of (await readdir(mac).catch(() => [])).filter(x => /^chromium-\d+$/.test(x)).sort().reverse()) {
      const exe = path.join(mac, entry, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      try { await access(exe); return await chromium.launch({ ...options, executablePath: exe }); } catch {}
    }
    throw e;
  }
}
