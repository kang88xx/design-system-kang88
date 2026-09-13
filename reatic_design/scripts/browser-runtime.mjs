// Resolves the locally installed Playwright. Set PLAYWRIGHT_MODULE to a different install if needed.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const candidates = [
  process.env.PLAYWRIGHT_MODULE,
  '/home/kang/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs',
  '/home/kang/.claude/skills/gstack/node_modules/playwright/index.mjs',
].filter(Boolean);
let playwright = null;
for (const c of candidates) {
  if (fs.existsSync(c)) { playwright = await import(c); break; }
}
if (!playwright) {
  try { playwright = await import(createRequire(import.meta.url).resolve('playwright')); }
  catch { throw new Error('Playwright not found. Set PLAYWRIGHT_MODULE to a playwright/index.mjs path.'); }
}
export const { chromium } = playwright;
export async function launchBrowser(options = {}) {
  return chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, ...options });
}
export const UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';
export const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
export const SOURCE = 'https://www.reaticindustry.com';
export const PAGES = ['', 'about', 'contact', 'portfolio'];
