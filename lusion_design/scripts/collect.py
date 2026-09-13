"""Archive public same-site pages + statically discoverable assets; record bounded coverage."""
import urllib.request,urllib.parse,re,json,pathlib,hashlib,concurrent.futures,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
BASE='https://lusion.co/'
PAGES=ROOT/'sources/pages'; PAGES.mkdir(exist_ok=True)
manifest=[]; pending=[BASE]; seen=set(); asset_refs={}
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; DesignReferenceCapture/1.0)'})
 with urllib.request.urlopen(req,timeout=40) as r:
  return r.read(60*1024*1024+1),r.headers.get('Content-Type',''),r.status

def add(url,source):
 url=urllib.parse.urljoin(source,url.replace('&amp;','&'))
 p=urllib.parse.urlparse(url)
 if pathlib.PurePosixPath(p.path).suffix.lower() not in {'.html','.css','.js','.mjs','.map','.json','.xml','.webmanifest','.ico','.svg','.png','.jpg','.jpeg','.webp','.gif','.avif','.mp4','.webm','.ogg','.mp3','.wav','.woff','.woff2','.ttf','.otf','.buf','.bin','.glb','.gltf','.exr','.ktx','.ktx2'}:return
 if p.scheme in ('http','https') and (p.netloc in ('lusion.co','lusion.dev')):
  asset_refs.setdefault(url,set()).add(source)
def refs(s,url):
 if '<base href="/">' in s:s=s.replace('"./assets/','"/assets/')
 for tag in re.findall(r'<[^>]+data-filename=[^>]+>',s):
  a=dict(re.findall(r'([\w-]+)="([^"]*)"',tag));kind=a.get('data-type');name=a.get('data-filename','')
  if kind in ('image','video'):add('https://lusion.dev'+name+('.webp' if kind=='image' else '.mp4'),url)

 for x in re.findall(r'''(?:src|href)=["']([^"']+)["']''',s):
  u=urllib.parse.urljoin(url,x);p=urllib.parse.urlparse(u)
  if p.netloc=='lusion.co' and not pathlib.PurePosixPath(p.path).suffix and not p.query:
   if u not in seen and u not in pending:pending.append(u)
  elif pathlib.PurePosixPath(p.path).suffix:add(u,url)
 for x in re.findall(r'''["'(]((?:https?://|/assets/|\./assets/|/_astro/)[^\s"'<>)]*)''',s):
  if len(x)<500 and '.' in x.rsplit('/',1)[-1]:add(x,url)
 for x in re.findall(r'url\(["\']?([^\)"\']+)',s):add(x,url)
 for x in re.findall(r'[#@]\s*sourceMappingURL=([^\s*]+)',s):add(x,url)
while pending and len(seen)<100:
 url=pending.pop(0)
 if url in seen:continue
 seen.add(url)
 try:
  data,typ,status=get(url);s=data.decode('utf-8','replace');name=(urllib.parse.urlparse(url).path.strip('/').replace('/','__') or 'home')+'.html';path=PAGES/name;path.write_bytes(data)
  manifest.append({'url':url,'kind':'page','capture_status':'captured','status':status,'content_type':typ,'bytes':len(data),'local':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(data).hexdigest()});refs(s,url)
 except Exception as e:manifest.append({'url':url,'kind':'page','capture_status':'error','error':str(e)})
print('pages',len(seen),'asset refs',len(asset_refs),flush=True)
for path,url in [('sources/site.css',BASE+'_astro/about.CNa9RfUh.css'),('sources/site.js',BASE+'_astro/hoisted.CUO_IjfL.js')]:refs((ROOT/path).read_text(),url)
# Network captures cover runtime-composed URLs that static parsing cannot resolve.
for net in (ROOT/'research/network.json',ROOT/'research/network-interactions.json'):
 if net.exists():
  for r in json.loads(net.read_text()):
   if r.get('status',0)<400:add(r['url'],BASE)
# Resolve explicit settings path literals against the CDN proven by the deployed bundle.
js=(ROOT/'sources/site.js').read_text()
paths=dict(re.findall(r'(\w+_PATH)="(/assets/[^" ]+)"',js))
for key,tail in re.findall(r'settings\.(\w+_PATH)\+"([^"\n]+)"',js):
 if pathlib.PurePosixPath(tail).suffix and key in paths:add('https://lusion.dev'+paths[key]+tail,BASE+'_astro/hoisted.CUO_IjfL.js')
# Add per-project paths observed in the runtime constructor.
for route in seen:
 slug=urllib.parse.urlparse(route).path.strip('/').split('/')
 if len(slug)==2 and slug[0]=='projects':
  for tail in ('home.webp','home_depth.webp'):add('https://lusion.dev/assets/projects/'+slug[1]+'/'+tail,route)
done=set();total=0
for depth in range(3):
 batch=[u for u in asset_refs if u not in done];done.update(batch)
 def download(url):
  try:
   p=urllib.parse.urlparse(url);cached=ROOT/'sources/assets'/p.netloc/p.path.lstrip('/')
   if not p.query and cached.is_file():
    data=cached.read_bytes();typ=__import__('mimetypes').guess_type(str(cached))[0] or 'application/octet-stream';status=200
   else:data,typ,status=get(url)
   if data.lstrip().lower().startswith(b'<!doctype html') and not p.path.endswith('.html'):return {'url':url,'kind':'asset','capture_status':'html_fallback','error':'HTML fallback returned for resource URL','status':status,'content_type':'text/html'}
   if len(data)>60*1024*1024:return {'url':url,'kind':'asset','capture_status':'skipped','skipped':'exceeds 60 MiB per-resource limit'}
   p=urllib.parse.urlparse(url);local=ROOT/'sources/assets'/p.netloc/p.path.lstrip('/');
   if p.query:local=local.with_name(local.name+'.'+hashlib.sha256(p.query.encode()).hexdigest()[:8])
   if not local.suffix:local=local.with_name(local.name+'.bin')
   local.parent.mkdir(parents=True,exist_ok=True);local.write_bytes(data)
   return {'url':url,'kind':'asset','capture_status':'captured','status':status,'content_type':typ,'bytes':len(data),'local':str(local.relative_to(ROOT)),'sha256':hashlib.sha256(data).hexdigest()}
  except Exception as e:return {'url':url,'kind':'asset','capture_status':'error','error':str(e)}
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  for entry in pool.map(download,batch):
   entry['referenced_by']=sorted(asset_refs[entry['url']]);manifest.append(entry);total+=entry.get('bytes',0)
   if entry.get('local') and ('javascript' in entry.get('content_type','') or 'css' in entry.get('content_type','')):refs((ROOT/entry['local']).read_text(errors='replace'),entry['url'])
 print('asset pass',depth,'total',len(done),'bytes',total,flush=True)
 if total>1024**3:break
(ROOT/'research/asset-manifest.json').write_text(json.dumps({'captured_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'scope':'same-origin linked HTML routes; static references plus sampled runtime requests; 3 dependency passes, 60 MiB per asset, stop after pass exceeding 1 GiB','entries':manifest},ensure_ascii=False,indent=2))
print('complete',len(manifest),flush=True)
