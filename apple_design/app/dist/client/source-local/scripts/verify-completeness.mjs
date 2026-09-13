import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {launchBrowser} from './browser-runtime.mjs';
import {hash} from './source-analysis.mjs';
const manifest=JSON.parse(await fs.readFile('app/public/research/manifest.json','utf8'));
const report=JSON.parse(await fs.readFile('app/public/research/completeness.json','utf8'));
const checks=[],errors=[],missing=[];
function check(name,result){assert.ok(result,name);checks.push(name);}
check('No missing indexed local files',report.missingFiles===0);
check('Every failed interaction has an explicit substitute',report.failedInteractions===14&&report.substitutedInteractions===14);
check('Every unavailable dependency has an explicit alternative',report.unresolvedResources===report.substitutedResources);
check('Unavailable originals retain unavailable provenance',manifest.sourceInventory.filter(r=>r.provenance==='unavailable').length===report.unresolvedResources);
check('CSS source parsing succeeded',report.parseErrors.length===0);
check('Motion collection exceeds previous sampling limit',manifest.motions.length>800);
const allLocal=manifest.sourceInventory.filter(r=>r.file);
for(const source of allLocal){
 const body=await fs.readFile('app/public'+source.file);
 assert.equal(body.length,source.bytes,source.file+' byte count');
 assert.equal(hash(body),source.sha256,source.file+' content hash');
}
checks.push(`All ${allLocal.length} indexed file sizes and SHA-256 hashes verified`);
for(const replacement of report.resourceSubstitutions)await fs.access('app/public'+replacement.replacementFile);
checks.push('Every resource replacement exists');
const archive=spawnSync('tar',['-tzf','app/public/research-source-kit.tar.gz'],{encoding:'utf8',maxBuffer:16*1024*1024});
check('Complete archive readable and raster/video-free',archive.status===0&&!/\.(png|jpe?g|webp|gif|avif|mp4|mov)$/im.test(archive.stdout));
for(const source of allLocal.filter(s=>!/^\/(source-local|source-evidence)\//.test(s.file)))check('Archive includes '+source.file,archive.stdout.split('\n').includes('app/public'+source.file));
check('Archive includes reusable package sources and build metadata',archive.stdout.includes('app/library/package.json')&&archive.stdout.includes('app/src/system/index.d.ts')&&archive.stdout.includes('docs/project-integration.md'));
check('Archive includes authoring and capture pipeline',archive.stdout.includes('app/src/reconstruction/Reconstruction.jsx')&&archive.stdout.includes('scripts/complete-sources.mjs')&&archive.stdout.includes('app/public/homepage.html'));
const browser=await launchBrowser({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 page.setDefaultTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().startsWith('http://localhost:4173')&&r.status()>=400)missing.push({url:r.url(),status:r.status()});});
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:width>800?1000:844});
  for(const route of ['pages','research-sources','observed-motion','reconstructions']){
   await page.goto('http://localhost:4173/#'+route);
   await page.locator(route==='reconstructions'?'.recon-hero h1':'.research-heading h2').waitFor();
   if(route==='research-sources')await page.locator('.research-source-reader .research-code').first().waitFor();
   check(`${route} fits viewport ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(width===1440||width===390)await page.screenshot({path:`evidence/local/complete-${route}-${width}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://localhost:4173/#research-sources');
 await page.getByPlaceholder('file, url, page').fill('globalheader.css');
 await page.locator('.research-source-list button').first().click();
 await page.waitForFunction(()=>document.querySelector('.research-source-reader .research-code pre')?.textContent.includes('globalnav'));
 const text=await page.locator('.research-source-reader .research-code pre').first().textContent();
 await page.locator('.research-source-reader .research-code').first().getByRole('button',{name:'Copy',exact:true}).click();
 check('Source copy preserves complete content',await page.evaluate(()=>navigator.clipboard.readText())===text&&text.length>40000);
 const downloadPromise=page.waitForEvent('download');
 await page.locator('.research-source-reader .research-code').first().getByRole('button',{name:'Download',exact:true}).click();
 const download=await downloadPromise;check('Source download preserves full content',(await fs.readFile(await download.path(),'utf8'))===text);
 await page.getByPlaceholder('file, url, page').fill('no-such-source-893782');
 check('No-results state visible',await page.getByText('No matching source',{exact:true}).first().isVisible());
 await page.getByPlaceholder('file, url, page').fill('Reconstruction.jsx');
 check('Local replacement authoring source is discoverable',await page.locator('.research-source-list button').count()>0);
 check('No browser runtime errors',errors.length===0);check('No missing local browser resources',missing.length===0);
 const summary={passed:true,checks:checks.length,coverage:report,errors,missing,screenshots:['evidence/local/complete-pages-1440.png','evidence/local/complete-research-sources-1440.png','evidence/local/complete-research-sources-390.png','evidence/local/complete-reconstructions-1440.png','evidence/local/complete-reconstructions-390.png']};
 await fs.writeFile('evidence/completeness-verification.json',JSON.stringify(summary,null,2));console.log(JSON.stringify({passed:true,checks:checks.length,errors,missing},null,2));
}finally{await browser.close();}
