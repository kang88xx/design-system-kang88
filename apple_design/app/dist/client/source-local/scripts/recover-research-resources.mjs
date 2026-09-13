import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const file='app/public/research/manifest.json';
const manifest=JSON.parse(await fs.readFile(file,'utf8'));
const remaining=[];
for(const failure of manifest.failures){
 try{
  const response=await fetch(failure.url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const body=Buffer.from(await response.arrayBuffer());
  const kind=failure.url.endsWith('.svg')?'svg':failure.url.endsWith('.css')?'css':'js';
  if(/text\/html/i.test(response.headers.get('content-type')||''))throw new Error('Unexpected HTML response');
  const hash=createHash('sha256').update(body).digest('hex');
  const local='/apple_design/app/dist/client/research/files/recovered-'+hash.slice(0,16)+'.'+kind;
  await fs.writeFile('app/public'+local,body);
  const resource={url:failure.url,resolvedUrl:response.url,file:local,kind,sha256:hash,recovered:true};
  if(!manifest.resources.some(r=>r.url===resource.url))manifest.resources.push(resource);
  for(const page of manifest.pages){
   if((page.rawResources||[]).some(r=>r.url===resource.url)||resource.url.includes('/'+new URL(page.url).pathname.split('/').filter(Boolean)[0]+'/')){
    if(!page.resources.some(r=>r.url===resource.url))page.resources.push(resource);
   }
  }
  (manifest.recoveredFailures||=[]).push({...failure,recoveredFile:local});
  console.log('Recovered',failure.url);
 }catch(error){remaining.push({...failure,retryError:String(error)});console.log('Unavailable',failure.url,String(error));}
}
manifest.failures=remaining;
await fs.writeFile(file,JSON.stringify(manifest,null,2));
