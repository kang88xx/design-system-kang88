"""Index original and usable derived sources; run after all system builds."""
import json,hashlib,re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parent.parent
class Images(HTMLParser):
 def __init__(self):super().__init__();self.names={}
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='img' and a.get('src') and a.get('alt'):self.names[urlsplit(a['src']).path]=a['alt']
names={}
for p in (ROOT/'pages').rglob('*.html'):
 if p.name.startswith('._'):continue
 parser=Images();parser.feed(p.read_text());names.update(parser.names)
manifest=json.loads((ROOT/'assets/manifest.json').read_text());items=[];seen=set()
def category(p):
 ext=Path(p).suffix.lower()
 return {'.html':'html','.css':'stylesheet','.mjs':'script-bundle','.js':'script','.json':'data','.md':'documentation','.woff2':'font','.woff':'font','.svg':'svg','.mp4':'video','.png':'image','.jpg':'image','.jpeg':'image','.webp':'image','.py':'script','.cjs':'script','.ts':'script'}.get(ext,'asset')
for f in manifest['files']:
 p=f['path'];seen.add(p);c=category(p);name=Path(p).name;desc=''
 if c=='image':
  desc=names.get(urlsplit(f['url']).path,'공개 페이지에 사용된 이미지; URL 파라미터가 다른 반응형 크기 포함')
  if desc and not desc.startswith('공개'):name=desc[:80]
 elif c=='font':
  fontpath=urlsplit(f['url']).path.split('/')
  name=(' '.join(fontpath[1:3])+' · '+name) if '/s/' in f['url'] else name;desc='공개 font-face의 원본 바이너리. 서브셋·weight 별 파일이며 110개가 서로 다른 서체 110종을 뜻하지 않습니다.'
 elif c=='html':name=urlsplit(f['url']).path or '/';desc='공개 페이지 HTML · CSS 및 초기 모션 JSON 포함'
 elif c=='script-bundle':desc='공개 배포 모듈; 원래 편집용 컴포넌트 소스와 구분'
 items.append(dict(id='src-'+hashlib.sha256(p.encode()).hexdigest()[:12],name=name,category=c,provenance='original-public',status='downloaded',path=p,sourceUrl=f['url'],bytes=f['bytes'],sha256=f['sha256'],description=desc))
paths=[]
for d in ['design','source/css','evidence','design-system','scripts','assets/icons']:
 if (ROOT/d).exists():paths.extend((ROOT/d).rglob('*'))
paths.extend(ROOT.glob('*'))
for p in sorted(set(paths)):
 if not p.is_file() or p.name.startswith('.') or '__pycache__' in p.parts or p.suffix in ['.zip','.tgz','.pyc']:continue
 rel=str(p.relative_to(ROOT))
 if rel in seen or rel in ['source-library.json','source-library-data.js']:continue
 if p.suffix.lower() not in ['.css','.json','.js','.mjs','.html','.md','.py','.cjs','.ts','.png','.jpg','.svg']:continue
 seen.add(rel);raw=p.read_bytes();c=category(rel)
 provenance='existing-derived'
 if rel.startswith('scripts/'):provenance='local-tool'
 elif rel.startswith('design-system/') or rel in ['motion-library.js','motion-library.css','studio-shell.js','studio-shell.css','catalog.js','catalog.css','index.html','system.html','layout-recipes.html','source-library.js','source-library.css']:provenance='reconstructed'
 elif rel.startswith('source/css/'):provenance='existing-extracted'
 desc={'existing-derived':'원본에서 추출·정리한 데이터 또는 브라우저 증거','reconstructed':'원본 근거를 기반으로 만든 재사용 코드·로컬 예제','existing-extracted':'공개 HTML에서 분리한 style 원문','local-tool':'재수집·생성·검증 도구'}[provenance]
 items.append(dict(id='src-'+hashlib.sha256(rel.encode()).hexdigest()[:12],name=p.name,category=c,provenance=provenance,status='included',path=rel,sourceUrl='',bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),description=desc))
order={'image':0,'svg':1,'video':2,'font':3,'stylesheet':4,'data':5,'html':6,'script-bundle':7,'documentation':8,'script':9}
items.sort(key=lambda i:(order.get(i['category'],20),i['name']))
data={'title':'Opalhaus source library','version':2,'originalSummary':manifest['summary'],'scope':manifest['scope'],'items':items,'gaps':[{'name':'Framer 편집 원본','status':'not-public','fallback':'배포 HTML/JS를 보존했습니다. 편집 가능한 Framer 프로젝트는 원본 템플릿 제공 경로가 필요합니다.','alternativePaths':['design/page-animations.json','component-specs.json']},{'name':'상태별 모션','status':'bounded-verification','fallback':'주요 동작을 재구성하고 원본 파라미터를 연결했습니다. 모든 페이지의 모든 런타임 상태를 검증했다는 뜻은 아닙니다.','alternativePaths':['motion-data.json','source-coverage.json']}]}
data['componentSpecs']=json.loads((ROOT/'component-specs.json').read_text())['components'] if (ROOT/'component-specs.json').exists() else []
(ROOT/'source-library.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
(ROOT/'source-library-data.js').write_text('window.OpalSourceLibrary = '+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';\n')
print(f'Indexed {len(items)} originals + derived sources')
