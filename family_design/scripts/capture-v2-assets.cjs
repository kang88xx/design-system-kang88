const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/kang/.claude/skills/gstack/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'references/v2-source/assets');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto('https://family.co', { waitUntil: 'networkidle', timeout: 90000 });
  const data = await page.evaluate(() => ({
    images: [...document.images].map(x => ({ src: x.currentSrc || x.src, alt: x.alt, cls: x.className })),
    videos: [...document.querySelectorAll('video,source')].map(x => x.currentSrc || x.src),
    svgCount: document.querySelectorAll('svg').length,
    svg: [...document.querySelectorAll('svg')].map((x, i) => ({ i, outer: new XMLSerializer().serializeToString(x), cls: x.getAttribute('class'), viewBox: x.getAttribute('viewBox') })),
    links: [...document.querySelectorAll('link[rel="stylesheet"]')].map(x => x.href),
    scripts: [...document.scripts].map(x => x.src).filter(Boolean),
    text: document.body.innerText.slice(0, 20000)
  }));
  fs.writeFileSync(path.join(out, 'dom-inventory.json'), JSON.stringify(data, null, 2));
  for (const item of data.svg) {
    if (item.outer.length > 180) fs.writeFileSync(path.join(out, `inline-svg-${String(item.i).padStart(3, '0')}.svg`), item.outer);
  }
  const wanted = data.images.filter(x => /hero|footer|security|backup|urgent|progress|bento|mission|drag|wallet|phone|preview/i.test(`${x.src} ${x.alt} ${x.cls}`));
  fs.writeFileSync(path.join(out, 'asset-candidates.json'), JSON.stringify(wanted, null, 2));
  await browser.close();
  console.log(JSON.stringify({ imageCount: data.images.length, videoCount: data.videos.length, svgCount: data.svgCount, stylesheets: data.links.length, scripts: data.scripts.length, wanted: wanted.length }, null, 2));
})().catch(e => { console.error(e); process.exit(1); });
