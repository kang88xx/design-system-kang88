#!/usr/bin/env python3
"""Integrity checks for provenance, portable assets, templates, bundles and local links."""
import hashlib,json,re,sys,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote,urlsplit
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parent.parent
checks=[]
def check(value,label):
    if not value:raise AssertionError(label)
    checks.append(label)
def load(path):return json.loads((ROOT/path).read_text())
source=load('data/source-manifest.json');recipes=load('prompts/recipes.json');templates=load('data/templates.json')
check(len(source['pages'])==52,'All 52 source pages indexed')
check([p['number'] for p in source['pages']]==list(range(1,53)),'Page sequence complete')
check(hashlib.sha256((ROOT/source['document']['filename']).read_bytes()).hexdigest()==source['document']['sha256'],'Original PDF SHA-256 matches provenance')
for key in ['pages','images','fonts','graphics']:
    records=source[key]
    check(len(records)==source['stats'][key],f'{key} inventory count matches')
    for r in records:
        for field in ['path','preview','svg','text','geometry','isolatedPreview','thumbnail']:
            if r.get(field):check((ROOT/r[field]).is_file() and (ROOT/r[field]).stat().st_size>0,f'Existing asset {r[field]}')
for page in source['pages']:
    check(bool(page.get('searchText')),f'Page {page["number"]} searchable full text')
    root=ET.parse(ROOT/page['svg']).getroot()
    check(root.tag.endswith('svg'),f'Page {page["number"]} valid vector document')
    check('1920' in str(root.attrib),f'Page {page["number"]} preserves canvas')
    text=load(page['text']);check(bool(text),f'Page {page["number"]} text metadata readable')
check(source['pages'][1]['category']=='photo','Facility photo not mislabeled contents')
check(source['pages'][2]['category']=='contents','Contents page classified correctly')
check(len(recipes)==16 and len({r['id'] for r in recipes})==16,'16 unique extension recipes')
for recipe in recipes:
    check(recipe['origin']=='extension','New icons explicitly marked extension')
    for path in [recipe['path'],recipe.get('gradientPath')]:
        check(path and (ROOT/path).is_file(),f'Icon variant exists {path}')
        svg=ET.parse(ROOT/path).getroot();check(svg.attrib.get('viewBox')=='0 0 48 48',f'Normalized icon canvas {path}')
        raw=(ROOT/path).read_text();check('<script' not in raw and '<image' not in raw and 'http' not in re.sub(r'xmlns="[^"]+"','',raw),f'Self-contained script-free vector {path}')
for t in templates:
    for field in ['svg','html']:
        if t.get(field):check((ROOT/t[field]).exists(),f'Template path {t[field]}')
    check(all(1<=n<=52 for n in t['sourcePages']),f'Template references valid {t["id"]}')
expected={'contents':[3],'divider':[4,10,17,27],'metrics':[11,13,14,50],'comparison':[19,22,24],'process':[25,46]}
for name,pages in expected.items():check(next(t for t in templates if t['id']==name)['sourcePages']==pages,f'Grounded source mapping {name}')
with zipfile.ZipFile(ROOT/'templates/ark-proposal.pptx') as z:
    check(z.testzip() is None,'PPTX ZIP integrity')
    slides=[n for n in z.namelist() if re.fullmatch(r'ppt/slides/slide\d+\.xml',n)]
    check(len(slides)==10,'10 PowerPoint slides')
    texts=0
    for name in z.namelist():
        if name.endswith(('.xml','.rels')):ET.fromstring(z.read(name))
    for name in slides:
        root=ET.fromstring(z.read(name));texts+=len(root.findall('.//{http://schemas.openxmlformats.org/drawingml/2006/main}t'))
    check(texts>=90,'PowerPoint contains native editable text shapes')
class Links(HTMLParser):
    def __init__(self):super().__init__();self.paths=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        for a in ['src','href']:
            if a in attrs:self.paths.append(attrs[a])
for path in [ROOT/'index.html',ROOT/'templates/proposal-a4.html',ROOT/'templates/components.html']:
    parser=Links();parser.feed(path.read_text())
    for link in parser.paths:
        if link.startswith(('#','http','mailto:','data:','blob:')):continue
        target=(path.parent/unquote(urlsplit(link).path)).resolve()
        check(target.exists(),f'Local HTML reference {link}')
for name,global_name in [('source-data.js','ARK_SOURCE'),('system-data.js','ARK_SYSTEM'),('foundation.js','ARK_FOUNDATION')]:
    raw=(ROOT/'data'/name).read_text();m=re.fullmatch(r'window\.'+global_name+r' = (.*);\s*',raw,re.S)
    check(bool(m),f'Browser bundle {name} valid assignment');payload=json.loads(m.group(1))
    if global_name=='ARK_SOURCE':check(payload==source,'Browser source bundle matches inventory')
    if global_name=='ARK_SYSTEM':check(payload['recipes']==recipes and payload['templates']==templates,'Browser system bundle matches templates and recipes')
if '--archives' in sys.argv:
    for archive in load('data/downloads.json'):
        file=ROOT/archive['path'];check(file.stat().st_size==archive['bytes'],f'Archive size {file.name}')
        check(hashlib.sha256(file.read_bytes()).hexdigest()==archive['sha256'],f'Archive SHA-256 {file.name}')
        with zipfile.ZipFile(file) as z:
            check(z.testzip() is None,f'Archive CRC {file.name}')
            check(len(z.namelist())==archive['files'],f'Archive count {file.name}')
            for member in z.namelist():
                if member=='data/downloads.json':
                    check(json.loads(z.read(member))==load('data/downloads.json')[:3], 'Packaged manifest accurately describes included sub-archives')
                    continue
                current=ROOT/member
                check(current.is_file(),f'Archive member exists in workspace {member}')
                check(hashlib.sha256(z.read(member)).digest()==hashlib.sha256(current.read_bytes()).digest(),f'Archive member is current {file.name}:{member}')
print(f'PASS: {len(checks)} integrity assertions; 52 pages, {len(source["images"])} images, {len(recipes)} icon subjects, 10 editable slides.')
