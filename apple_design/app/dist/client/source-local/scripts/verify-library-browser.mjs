import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {launchBrowser} from '../../scripts/browser-runtime.mjs';
const appRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'source-ds-browser-'));
let server,browser;const checks=[],errors=[],requests=[];
const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
try{
 const packageRoot=path.join(temp,'node_modules/@local/source-design-system');await fs.mkdir(packageRoot,{recursive:true});
 const unpack=spawnSync('tar',['-xzf',path.join(appRoot,'public/source-design-system-0.1.0.tgz'),'--strip-components=1','-C',packageRoot]);assert.equal(unpack.status,0);
 for(const pkg of ['react','react-dom','scheduler'])await fs.symlink(path.join(appRoot,'node_modules',pkg),path.join(temp,'node_modules',pkg),'dir');
 await fs.writeFile(path.join(temp,'package.json'),JSON.stringify({type:'module',dependencies:{react:'19.2.0','react-dom':'19.2.0','@local/source-design-system':'0.1.0'}}));
 await fs.writeFile(path.join(temp,'index.html'),'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Independent consumer</title><div id="root"></div><script type="module" src="/consumer.jsx"></script></html>');
 await fs.writeFile(path.join(temp,'consumer.jsx'),await fs.readFile(path.join(appRoot,'tests/fixtures/consumer.jsx')));
 server=await createServer({root:temp,configFile:false,logLevel:'error',server:{host:'127.0.0.1',port:0,strictPort:false,fs:{allow:[temp,appRoot]}},optimizeDeps:{include:['react','react-dom/client']}});await server.listen();const base=server.resolvedUrls.local[0];
 browser=await launchBrowser();const page=await browser.newPage({viewport:{width:1100,height:900}});page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('data:'))requests.push(r.url());});
 await page.goto(base);await page.getByRole('heading',{name:'Host application'}).waitFor();
 check('Styles do not reset host margin/list',await page.evaluate(()=>getComputedStyle(document.body).margin==='8px'&&getComputedStyle(document.querySelector('#host-list')).listStyleType==='disc'));
 check('Components include scoped box sizing',await page.getByRole('button',{name:'Submit form'}).evaluate(e=>getComputedStyle(e).boxSizing==='border-box'));
 await page.getByRole('button',{name:'Submit form'}).click();check('Native form names and values submit',await page.locator('#form-result').textContent().then(t=>t.includes('user@example.test')&&t.includes('"notify":"yes"')&&!t.includes('ignored')));
 check('Loading button is disabled',await page.getByRole('button',{name:'Loading action'}).isDisabled());check('Disabled anchor has no href',await page.getByText('Disabled link',{exact:true}).getAttribute('href')===null);
 await page.getByRole('button',{name:'Focus field'}).click();check('Input ref focuses real input',await page.getByRole('textbox',{name:'Email',exact:true}).evaluate(e=>e===document.activeElement));
 const group=page.getByRole('radiogroup',{name:'Density'});await group.getByRole('radio',{name:'First',exact:true}).focus();await page.keyboard.press('ArrowRight');check('Keyboard skips disabled option',await page.locator('#choice').textContent()==='last');await page.keyboard.press('Home');check('Home selects first enabled',await page.locator('#choice').textContent()==='first');await page.getByRole('button',{name:'Invalidate choice'}).click();check('Stale value retains one reachable option',await group.locator('[tabindex="0"]').count()===1);
 await page.getByText('Delivery',{exact:true}).click();check('Accordion defaultOpen can close',await page.locator('#delivery').getAttribute('open')===null);
 await page.getByRole('button',{name:'Show slide 3: Third slide'}).click();await page.getByRole('button',{name:'Keep first slide'}).click();check('Shrinking items keeps a visible slide',await page.locator('.ds-carousel-slide[data-active="true"]').count()===1&&await page.locator('.ds-carousel-slide[data-active="true"]').textContent().then(t=>t.includes('First slide')));
 await page.getByRole('button',{name:'Open dialog'}).click();await page.getByRole('dialog',{name:'Edit project'}).waitFor();check('Initial focus targets field',await page.getByRole('textbox',{name:'Dialog name'}).evaluate(e=>e===document.activeElement));await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});check('Escape returns focus to opener',await page.getByRole('button',{name:'Open dialog'}).evaluate(e=>e===document.activeElement));
 await page.getByRole('button',{name:'Open dialog'}).click();const box=await page.getByRole('dialog').boundingBox();await page.mouse.click(box.x+5,box.y+5);check('Inside dialog padding stays open',await page.getByRole('dialog').isVisible());await page.mouse.click(1,1);await page.getByRole('dialog').waitFor({state:'hidden'});checks.push('Backdrop closes modal');
 await page.getByRole('button',{name:'Switch theme'}).click();check('Scoped dark theme applies',await page.locator('main').evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(29, 29, 31)'));
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)){console.log(await page.evaluate(()=>[...document.querySelectorAll('main,main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,id:e.id,width:e.getBoundingClientRect().width}))));await page.screenshot({path:path.join(appRoot,'../evidence/local/library-consumer-overflow.png'),animations:'disabled'});}
 check(`Standalone layout fits ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(appRoot,`../evidence/local/library-consumer-${width}.png`),animations:'disabled'});}
 check('No runtime errors',errors.length===0);check('No external asset/API requests',requests.length===0);
 await fs.writeFile(path.join(appRoot,'../evidence/library-consumer-verification.json'),JSON.stringify({passed:true,checks,errors,requests},null,2));console.log(JSON.stringify({passed:checks.length,errors,requests}));
}finally{await browser?.close();await server?.close();await fs.rm(temp,{recursive:true,force:true});}
