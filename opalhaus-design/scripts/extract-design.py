import json,re,collections
from pathlib import Path
from html.parser import HTMLParser
D=Path('design');D.mkdir(exist_ok=True)
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.id=None;self.data={}
 def handle_starttag(self,t,a):
  a=dict(a)
  if t=='script':self.id=a.get('id')
 def handle_data(self,s):
  if self.id and self.id.startswith('__framer__'):self.data[self.id]=self.data.get(self.id,'')+s
 def handle_endtag(self,t):
  if t=='script':self.id=None
pages={};fonts=set();tokens={};motion=[]
for p in [Path('source/index.html'),*Path('pages').rglob('*.html')]:
 if p.name.startswith('._'):continue
 s=p.read_text();h=Parser();h.feed(s);data={}
 for k,v in h.data.items():
  if k not in ['__framer__appearAnimationsContent','__framer__breakpoints']:continue
  try:data[k]=json.loads(v)
  except ValueError:pass
 pages[str(p)]=data
 fonts.update(re.findall(r'@font-face\s*\{[^}]+\}',s))
 tokens.update(dict(re.findall(r'(--token-[\w-]+):([^;}]+)',s)))
for p in Path('source/js').glob('*.mjs'):
 if p.name.startswith('._') or any(x in p.name for x in ['-framer.','-motion.','-react.','-shared-lib.']):continue
 s=p.read_text()
 for m in re.finditer(r'(?:damping:|stiffness:|speed:|hoverFactor:|whileHover:|scrollTransform|loop:|autoPlay:)',s):
  motion.append({'file':str(p),'offset':m.start(),'excerpt':s[max(0,m.start()-150):m.start()+400]})
(D/'motion-source-index.json').write_text(json.dumps(motion,indent=2))
(D/'page-animations.json').write_text(json.dumps(pages,indent=2))
(D/'original-tokens.json').write_text(json.dumps(tokens,indent=2))
(D/'fonts.remote.css').write_text('\n\n'.join(sorted(fonts)))
report={}
for p in Path('evidence').glob('*.json'):
 if p.name.startswith('._'):continue
 j=json.loads(p.read_text())
 if 'elements' not in j:continue
 report[p.stem]={'viewport':j['viewport'],'typography':list({json.dumps({k:e['css'][k] for k in ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing']},sort_keys=True) for e in j['elements'] if e['tag'] in ['H1','H2','H3','H4','P'] and 'Inter' in e['css']['fontFamily']}),'surfaces':collections.Counter(e['css']['backgroundColor'] for e in j['elements']).most_common(15)}
 report[p.stem]['typography']=[json.loads(x) for x in sorted(report[p.stem]['typography'])]
(D/'computed-design.json').write_text(json.dumps(report,indent=2))
print('Pages:',len(pages),'font declarations:',len(fonts),'tokens:',len(tokens),'motion excerpts:',len(motion))
