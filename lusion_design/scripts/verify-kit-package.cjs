const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const http=require('node:http');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium,executablePath}=require('./browser-runtime.cjs');
const root=path.resolve('.'),checks=[];
function check(name,passed,detail){checks.push({name,passed:!!passed,...(detail?{detail}:{})});if(!passed)throw new Error(name);}
(async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'project-kit-verify-'));
 let browser,server;
 try{
  execFileSync('python3',['-c','import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; z.extractall(sys.argv[2])',path.join(root,'downloads/project-design-system-1.1.0.zip'),temp]);
  const contents=JSON.parse(fs.readFileSync('downloads/project-kit-info.json')).contents;
  check('ZIP contains byte-identical current sources',contents.every(file=>fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(temp,file)))));
  check('Standalone ZIP has no archived assets or dependencies',fs.readdirSync(temp).join()==='kit'&&!fs.existsSync(path.join(temp,'kit/node_modules')));
  const imported=await import(pathToFileURL(path.join(temp,'kit/system.js')));
  check('ES module imports in Node without DOM globals',typeof imported.mount==='function'&&typeof imported.createSpring==='function');
  const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.md':'text/plain'};
  server=http.createServer((req,res)=>{
   const file=path.resolve(temp,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(!file.startsWith(temp+path.sep)){res.writeHead(403).end();return;}
   fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'Missing':data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(response.status()+' '+response.url());});
  page.on('request',request=>requests.push(request.url()));
  await page.goto(base+'/kit/examples/index.html',{waitUntil:'networkidle'});
  check('ZIP-only example initializes',await page.locator('[data-ds-runtime="ready"]').count()===1);
  await page.locator('[data-ds-dialog-open]').click();
  check('ZIP-only dialog runs',await page.locator('dialog').evaluate(node=>node.open));
  await page.keyboard.press('Escape');
  await page.locator('#tab-tokens').click();
  check('ZIP-only tabs run',await page.locator('#panel-tokens').isVisible());
  check('ZIP-only example makes no external requests',requests.every(url=>url.startsWith(base+'/kit/')||url.startsWith('data:')),requests);
  check('ZIP-only example has no errors',errors.length===0,errors);
  check('ZIP-only README link resolves',await page.locator('footer a').evaluate(async link=>(await fetch(link.href)).ok));
  await browser.close();browser=null;
  const consumer=path.join(temp,'consumer');fs.mkdirSync(consumer);
  fs.writeFileSync(path.join(consumer,'package.json'),JSON.stringify({private:true,type:'module'}));
  execFileSync('npm',['install','--prefix',consumer,'--ignore-scripts','--offline','--no-audit','--no-fund',path.join(root,'downloads/local-project-design-system-1.1.0.tgz')],{stdio:'pipe'});
  fs.writeFileSync(path.join(consumer,'import.mjs'),"import {mount,createSpring,createDynamics,ease,damp,dynamicsPresets} from '@local/project-design-system'; import {snippets} from '@local/project-design-system/snippets.js'; if(typeof mount!=='function'||snippets.length!==18||!Number.isFinite(createSpring().update(1/60,1))||!Number.isFinite(createDynamics(dynamicsPresets.snap).update(1/60,1))||Math.abs(ease.smooth(1)-1)>1e-9||typeof damp(0,1,10,.016)!=='number')throw Error('Exports failed');");
  execFileSync(process.execPath,[path.join(consumer,'import.mjs')]);
  check('Local npm archive installs offline and exports work',true);
  fs.writeFileSync(path.join(consumer,'consumer.mts'),`import {mount,createSpring,createDynamics,dynamicsPresets,ease,damp,type DesignSystemRuntime} from '@local/project-design-system';
const root = document.createElement('section');
const runtime: DesignSystemRuntime = mount(root, {motion:false});
runtime.setTheme('dark'); runtime.notify('OK',{duration:500}); runtime.openDialog('a'); runtime.closeDialog('a'); runtime.destroy();
const spring=createSpring({frequency:2.8,damping:.82,response:1}); const value:number=spring.update(1/60,12); spring.reset(value);
const follow=createDynamics(dynamicsPresets.pointer); const y:number=follow.update(1/60,4); follow.settled(y);
const eased:number=ease.smooth(.4)+ease.expoOut(.2)+damp(0,1,10,1/60);
runtime.openPanel('menu'); runtime.togglePanel('menu'); runtime.closePanel('menu'); runtime.replay(root); const stop=runtime.addTask(dt=>dt>0); stop(); const on:boolean=runtime.motion;
// @ts-expect-error Invalid theme
runtime.setTheme('purple');
// @ts-expect-error Delta is in numeric seconds
spring.update('16ms',1);
// @ts-expect-error Output is read-only
spring.value=2;
`);
  const cache=path.join(os.homedir(),'.npm/_npx');
  const tsc=fs.readdirSync(cache).map(dir=>path.join(cache,dir,'node_modules/typescript/bin/tsc')).find(file=>fs.existsSync(file));
  check('TypeScript compiler available for consumer verification',!!tsc);
  execFileSync(process.execPath,[tsc,'--noEmit','--strict','--target','ES2022','--module','NodeNext','--moduleResolution','NodeNext','--lib','ES2022,DOM',path.join(consumer,'consumer.mts')],{stdio:'pipe'});
  check('Installed package consumer typechecks incl. invalid API assertions',true);
 }catch(error){checkFailure(error);}finally{
  if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
  fs.rmSync(temp,{recursive:true,force:true});
  const report={checked_at:new Date().toISOString(),checks,passed:checks.every(c=>c.passed)};
  fs.writeFileSync('research/kit-package-v4.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
 }
 function checkFailure(error){checks.push({name:'Package verification completed',passed:false,detail:error.message+(error.stdout?' '+error.stdout.toString():'')});}
})().catch(error=>{console.error(error);process.exitCode=1;});
