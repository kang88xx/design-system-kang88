import pathlib,re,json,html,collections
from html.parser import HTMLParser
R=pathlib.Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.tags=[]
 def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
projects=[];pages=[]
for f in sorted((R/'sources/pages').glob('*.html')):
 s=f.read_text();title=html.unescape(re.search(r'<title>(.*?)</title>',s).group(1));route='/' if f.stem=='home' else '/'+f.stem.replace('__','/')
 pages.append({'url':'https://lusion.co'+route,'title':title,'local':str(f.relative_to(R))})
 if not route.startswith('/projects/'):continue
 p=Parser();p.feed(s);media=[];theme={};links=[]
 for tag,a in p.tags:
  if 'data-color-bg' in a and not theme:theme={k:v for k,v in a.items() if k.startswith('data-color')}
  if 'data-filename' in a:
   typ=a.get('data-type');media.append({'type':typ,'url':'https://lusion.dev'+a['data-filename']+('.webp' if typ=='image' else '.mp4'),'width':a.get('data-width'),'height':a.get('data-height'),'fullscreen':'data-fullscreen' in a})
  if tag=='a' and a.get('href','').startswith('http'):links.append(a['href'])
 text_panels=[html.unescape(re.sub(r'<[^>]+>','',x)).strip() for x in re.findall(r'<div class="project-details-item-text">(.*?)</div>',s,re.S)]
 projects.append({'text_panels':text_panels,'slug':route.split('/')[-1],'title':title.removeprefix('Lusion - '),'url':'https://lusion.co'+route,'theme':theme,'media':media,'external_links':sorted(set(links))})
(R/'research/projects.json').write_text(json.dumps(projects,ensure_ascii=False,indent=2))
(R/'research/pages.md').write_text('# 수집 페이지\n\nHTML을 확보한 연결 경로다. 전체 상호작용 검증을 뜻하지 않는다.\n\n| 페이지 | 원본 | 로컬 |\n| --- | --- | --- |\n'+''.join(f"| {p['title']} | [원본]({p['url']}) | [HTML](../{p['local']}) |\n" for p in pages))
m=json.loads((R/'research/asset-manifest.json').read_text());entries=m['entries'];assets=[x for x in entries if x['kind']=='asset'];ok=[x for x in assets if 'local' in x];stats={'pages':len(pages),'projects':len(projects),'assets':len(ok),'bytes':sum(x['bytes'] for x in ok),'errors':len(assets)-len(ok),'types':dict(collections.Counter(x.get('content_type','').split(';')[0] for x in ok))}
(R/'research/collection-summary.json').write_text(json.dumps(stats,indent=2))
(R/'research/assets.md').write_text('# 공개 에셋 인벤토리\n\n정적 HTML/CSS/JS와 샘플 네트워크에서 발견한 자산. 사용 허가는 확인되지 않았다. 큰 영상의 브라우저 표시 시간과 수집 시간은 다를 수 있다.\n\n| 경로 / URL | 형식 | 크기 | 상태 |\n| --- | --- | ---: | --- |\n'+''.join(f"| [{x['url'].split('/assets/')[-1]}]({x['url']}) | {x.get('content_type','—')} | {x.get('bytes',0):,} | "+(f"[로컬](../{x['local']})" if 'local' in x else x.get('error',x.get('skipped','unknown')))+' |\n' for x in assets))
# JS payload makes the reference catalog usable via file:// as well as local HTTP.
(R/'catalog-data.js').write_text('window.LUSION_CATALOG='+json.dumps({'stats':stats,'projects':projects,'assets':assets},ensure_ascii=False)+';\n')
print(json.dumps(stats,indent=2))
