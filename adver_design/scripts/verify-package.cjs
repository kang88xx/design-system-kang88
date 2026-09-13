/* Verify the extracted consumer archive in a foreign host, not the repository preview. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert/strict');const fs=require('fs');const os=require('os');const path=require('path');const crypto=require('crypto');const {spawnSync}=require('child_process');const {pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..');const out=path.join(root,'references/verification/release');fs.mkdirSync(out,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'adver-runtime-'));let browser;
(async()=>{
  const sourceManifest=JSON.parse(fs.readFileSync(path.join(root,'releases/runtime-manifest.json')));
  const archive=path.join(root,`releases/adver-system-${sourceManifest.version}.zip`);
  const extraction=spawnSync('python3',['-c',`import sys,zipfile,pathlib\nwith zipfile.ZipFile(sys.argv[1]) as z:\n for name in z.namelist():\n  assert not pathlib.PurePosixPath(name).is_absolute() and '..' not in pathlib.PurePosixPath(name).parts\n z.extractall(sys.argv[2])\n print(len(z.namelist()))`,archive,temp],{encoding:'utf8'});
  assert.equal(extraction.status,0,extraction.stderr);
  const manifest=JSON.parse(fs.readFileSync(path.join(temp,'releases/runtime-manifest.json')));
  assert.deepEqual(manifest,sourceManifest);
  assert.equal(Number(extraction.stdout.trim()),manifest.files.length+1);
  assert.equal(manifest.components,13);
  for(const item of manifest.files){
    assert(/^(design-system\/(tokens\.(scoped\.css|json)|(?:motion|interaction)-kit\.(?:css|js)|components\.(?:js|json))|components\/[a-z-]+\.html|starter\/(?:index\.html|app\.(?:css|js))|USAGE\.md)$/.test(item.path),`allowlisted ${item.path}`);
    const bytes=fs.readFileSync(path.join(temp,item.path));assert.equal(bytes.length,item.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256);assert.deepEqual(bytes,fs.readFileSync(path.join(root,item.path)));
  }
  const checks=['extracted versioned archive has only allowlisted authored files and exact hashes'];
  const registry=JSON.parse(fs.readFileSync(path.join(temp,'design-system/components.json')));
  for(const item of registry.components){assert.equal(fs.readFileSync(path.join(temp,`components/${item.id}.html`),'utf8').trim(),item.html);if(['form','buttons'].includes(item.id))assert(item.html.includes('data-ri-mode="production"'));if(item.id==='form')assert(!item.html.includes('data-ri-form-mode'));}
  checks.push('all 13 consumer fragments match the registry; production form has no demo selector');
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  await page.goto(pathToFileURL(path.join(temp,'starter/index.html')).href,{waitUntil:'load'});
  assert.equal(await page.locator('.starter-component').count(),3);
  for(const item of registry.components){await page.locator('#component-choice').selectOption(item.id);await page.locator('#add-component').click();}
  assert.equal(await page.locator('.starter-component').count(),16);
  const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
  const tabSamples=page.locator('[data-ri=tabs]');await tabSamples.nth(1).locator('[role=tab]').nth(2).click();assert.equal(await tabSamples.nth(1).locator('[role=tab]').nth(2).getAttribute('aria-selected'),'true');assert.equal(await tabSamples.first().locator('[role=tab]').first().getAttribute('aria-selected'),'true');
  await page.locator('.starter-component').first().locator('.starter-remove').click();await page.locator('[data-ri=tabs]').first().locator('[role=tab]').last().click();assert.equal(await page.locator('[data-ri=tabs]').first().locator('[role=tab]').last().getAttribute('aria-selected'),'true');
  checks.push('extracted starter works over file:// with 16 instances, unique IDs and independent removal');
  const form=page.locator('[data-ri=form]').first();await form.locator('[name=name]').fill('프로젝트 사용자');await form.locator('[name=company]').fill('Example');await form.locator('[name=email]').fill('user@example.test');await form.locator('[type=submit]').click();await page.waitForFunction(()=>document.querySelector('[data-ri=form] [data-ri-form-status]').dataset.state==='success');assert((await form.locator('[data-ri-form-status]').innerText()).includes('콜백 연결'));
  const buttons=page.locator('[data-ri=buttons]').first();await buttons.locator('[data-ri-button-action]').click();await page.waitForFunction(()=>document.querySelector('[data-ri=buttons] [data-ri-button-status]').dataset.state==='success');checks.push('production form and button use supplied callbacks in the extracted consumer');
  for(const width of [1440,768,375]){await page.setViewportSize({width,height:950});for(const theme of ['light','dark']){await page.locator('#theme-choice').selectOption(theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${theme} overflow`);assert.equal(await page.locator('#components').evaluate(n=>getComputedStyle(n).getPropertyValue('--color-bg').trim()),theme==='dark'?'#000000':'#ffffff');}}
  await page.locator('#theme-choice').selectOption('system');await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});assert.equal(await page.locator('#components').evaluate(n=>getComputedStyle(n).getPropertyValue('--color-bg').trim()),'#000000');
  await page.locator('#brand-choice').selectOption('blue');assert.equal(await page.locator('#components').evaluate(n=>getComputedStyle(n).getPropertyValue('--color-action').trim()),'#93c5fd');checks.push('all components fit 1440/768/375 light/dark, system theme and brand overrides');
  await page.goto(pathToFileURL(path.join(temp,'starter/index.html')).href,{waitUntil:'load'});await page.emulateMedia({colorScheme:'light',reducedMotion:'reduce'});await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(out,'starter-desktop.png')});await page.setViewportSize({width:375,height:950});await page.screenshot({path:path.join(out,'starter-mobile.png')});
  await page.goto('about:blank');await page.setContent('<style>:root{--color-bg:gold;--font-body:serif}body{margin:0}button{color:rgb(90,0,90);padding:7px;border:3px solid red;font:17px Georgia;box-sizing:content-box}</style><button id="sentinel">Existing host control</button><div class="adver-system" id="island"><div data-theme="dark"><section data-theme="light" id="nested-light"></section></div></div>');
  const snapshot=()=>page.locator('#sentinel').evaluate(n=>{const c=getComputedStyle(n);return {font:c.font,color:c.color,padding:c.padding,border:c.border,width:n.getBoundingClientRect().width,boxSizing:c.boxSizing,root:getComputedStyle(document.documentElement).getPropertyValue('--color-bg')}});const before=await snapshot();
  for(const name of ['tokens.scoped.css','motion-kit.css','interaction-kit.css'])await page.addStyleTag({path:path.join(temp,'design-system',name)});
  for(const name of ['motion-kit.js','interaction-kit.js'])await page.addScriptTag({path:path.join(temp,'design-system',name)});
  assert.deepEqual(await snapshot(),before);assert.equal(await page.locator('#island').evaluate(n=>getComputedStyle(n).getPropertyValue('--color-bg').trim()),'#ffffff');assert.equal(await page.locator('#nested-light').evaluate(n=>getComputedStyle(n).getPropertyValue('--color-bg').trim()),'#ffffff');
  const tokens=JSON.parse(fs.readFileSync(path.join(temp,'design-system/tokens.json')));for(const [name,token]of Object.entries(tokens.color))assert.equal(await page.locator('#island').evaluate((n,key)=>getComputedStyle(n).getPropertyValue('--color-'+key).trim(),name),token.value);
  await page.locator('#island').evaluate(n=>n.dataset.theme='dark');for(const [name,token]of Object.entries(tokens.dark))assert.equal(await page.locator('#island').evaluate((n,key)=>getComputedStyle(n).getPropertyValue('--color-'+key).trim(),name),token.value);
  assert.deepEqual(await snapshot(),before);checks.push('scoped tokens match canonical JSON and leave unrelated host styles/variables unchanged');
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#island').evaluate((n,items)=>{n.innerHTML=items.map(item=>item.html).join('');ReferenceMotion.mount(n);ReferenceInteractions.mount(n);},registry.components);
  for(const width of [720,480,360,320]){
    await page.locator('#island').evaluate((n,w)=>{n.style.width=w+'px';},width);
    await page.waitForTimeout(100);
    const geometry=await page.locator('#island').evaluate(n=>({client:n.clientWidth,scroll:n.scrollWidth}));
    assert(geometry.scroll<=geometry.client,`wide host with ${width}px island overflow: ${JSON.stringify(geometry)}`);
  }
  await page.evaluate(()=>{ReferenceMotion.setPaused(true);ReferenceInteractions.setPaused(true);});
  checks.push('all 13 components fit 320/360/480/720px containers within a 1440px host');

  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);checks.push('no uncaught errors or external network dependencies in extracted runtime');
  fs.writeFileSync(path.join(out,'package-result.json'),JSON.stringify({status:'pass',version:manifest.version,files:manifest.files.length,checks,limits:['Chromium verified; no full WCAG certification or Safari/Firefox run','Consumer must implement and verify its own backend/authentication']},null,2)+'\n');console.log(checks.map(c=>'PASS '+c).join('\n'));
  await browser.close();fs.rmSync(temp,{recursive:true,force:true});
})().catch(async error=>{console.error(error);fs.writeFileSync(path.join(out,'package-result.json'),JSON.stringify({status:'failed',error:error.message},null,2));if(browser)await browser.close();fs.rmSync(temp,{recursive:true,force:true});process.exitCode=1;});
