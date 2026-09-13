import { launchBrowser } from './browser-runtime.mjs';
const b = await launchBrowser();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('https://stripe.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log(await p.title());
await b.close();
