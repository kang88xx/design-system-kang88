#!/usr/bin/env python3
"""Repeatable, dependency-free extraction of every inline SVG in sources/pages.
Raw bytes remain in raw/; standalone copies strip executable elements/attributes.
Dedup uses normalized SVG geometry + inline presentation, never source IDs.
"""
from pathlib import Path
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
import hashlib, json, re
ROOT = Path(__file__).resolve().parents[1]
SVG_NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG_NS)
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

def digest(value): return hashlib.sha256(value.encode()).hexdigest()
def local(tag): return tag.rsplit('}',1)[-1]

class SVGParser(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source=source; self.stack=[]; self.results=[]; self.active=[]; self.external=[]
        self.lines=[0]+[m.end() for m in re.finditer('\n', source)]
    def source_offset(self):
        line,col=self.getpos(); return self.lines[line-1]+col
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if self.stack:
            self.stack[-1]['children']+=1; index=self.stack[-1]['children']
        else:index=1
        token=tag+('#'+attrs['id'] if attrs.get('id') else ':nth-child('+str(index)+')')
        selector=' > '.join([n['token'] for n in self.stack]+[token])
        if tag in {'img','link'} and any('.svg' in (attrs.get(a) or '') for a in ['src','href']): self.external.append({'selector':selector,'start':self.source_offset(),'line':self.getpos()[0],'source_url':attrs.get('src') or attrs.get('href')})
        if tag=='svg': self.active.append({'start':self.source_offset(),'selector':selector,'ancestor_ids':[n['id'] for n in self.stack if n['id']],'ancestor_classes':[n['class'] for n in self.stack if n['class']],'line':self.getpos()[0]})
        if tag not in VOID:self.stack.append({'tag':tag,'id':attrs.get('id'),'class':attrs.get('class'),'token':token,'children':0})
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID:self.handle_endtag(tag)
    def handle_endtag(self,tag):
        if tag=='svg' and self.active:
            record=self.active.pop(); end=self.source.find('>',self.source_offset())+1
            record['end']=end;record['raw']=self.source[record['start']:end];self.results.append(record)
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i]['tag']==tag:self.stack=self.stack[:i];break

def sanitize(raw):
    tree=ET.fromstring(raw)
    for parent in tree.iter():
        for child in list(parent):
            if local(child.tag).lower() in {'script','foreignobject','iframe','object','embed','animate','animatetransform','set'}:parent.remove(child)
        for key,value in list(parent.attrib.items()):
            name=local(key).lower()
            if name.startswith('on') or (name in {'href','src'} and not value.startswith('#')) or (name=='style' and re.search(r'url\s*\(|expression|@import',value,re.I)):
                del parent.attrib[key]
    return tree

def canonical(tree):
    ids={node.attrib['id']:'ref'+str(i) for i,node in enumerate(tree.iter()) if 'id' in node.attrib}
    def visit(node,root=False):
        attrs=[]
        for key,value in node.attrib.items():
            name=local(key)
            if name in {'id','class','role','tabindex'} or name.startswith(('aria-','data-')) or (root and name in {'width','height'}):continue
            for old,new in ids.items():value=value.replace('url(#'+old+')','url(#'+new+')')
            if name=='href' and value.startswith('#'):value='#'+ids.get(value[1:],value[1:])
            if name in {'d','points','viewBox','transform'}:
                value=' '.join(re.findall(r'[a-zA-Z]+|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',value))
            elif name=='style':value=';'.join(sorted(x.strip() for x in value.split(';') if x.strip()))
            attrs.append((name,value.strip()))
        return [local(node.tag),sorted(attrs),(node.text or '').strip(),[visit(c) for c in node]]
    return json.dumps(visit(tree,True),separators=(',',':'),ensure_ascii=False)

def classify(occ):
    context=' '.join(occ['ancestor_ids']+occ['ancestor_classes'])+' '+occ['selector']
    rules=[('about-who-title','brand','Lusion About 워드마크','wordmark'),('about-who-team-name','ui','팀 멤버 표시','asterisk'),('about-who-team-title','decorative','팀 구역 타이포','lettering'),('about-award-title','decorative','어워드 대형 장식 타이포','lettering'),('header-logo','brand','Lusion 워드마크','wordmark'),('labs-lucy','brand','Lusion Labs Lucy 심벌','mascot'),('client','brand','클라이언트 로고','logo'),('partners','brand','파트너 로고','logo'),('video-container-svg','decorative','릴 프레임 반복 타이포','lettering'),('video-watch','ui','릴 재생','play'),('video-overlay','ui','플레이어 닫기','close'),('back-btn','ui','이전 프로젝트','arrow-left'),('menu-labs-arrow','ui','Labs 대각 화살표','arrow-diagonal'),('menu-talk','ui','문의 화살표','arrow-diagonal'),('newsletter','ui','뉴스레터 제출','arrow-right'),('footer-bottom-up','ui','맨 위로','arrow-up'),('scroll-nav-next','ui','다음 페이지','arrow-down'),('project-details-header-info','ui','프로젝트 정보','info'),('project-details-preview-footer','ui','상세 탐색','arrow-right'),('about-award-header','decorative','어워드 구역 심벌','award'),('about-award','ui','어워드 외부 링크','arrow-diagonal'),('projects-main-title','decorative','프로젝트 제목 화살표','arrow-diagonal'),('menu-link','ui','메뉴 링크 화살표','arrow-right'),('footer-social','ui','소셜 외부 링크','arrow-diagonal'),('arrow','ui','CTA 화살표','arrow-diagonal')]
    for needle,category,name,shape in rules:
        if needle in context:return category,name,shape
    return 'decorative','원본 그래픽','illustration'

def main():
    groups={};page_counts=[]; external_occ=[]
    for folder in ['raw','extracted','replicas']:(ROOT/'assets/icons'/folder).mkdir(parents=True,exist_ok=True)
    for path in sorted((ROOT/'sources/pages').glob('*.html')):
        source=path.read_text(); parser=SVGParser(source);parser.feed(source)
        external_occ.extend([{**o,'page':str(path.relative_to(ROOT))} for o in parser.external])
        page_counts.append({'path':str(path.relative_to(ROOT)),'inline_svg_count':len(parser.results),'sha256':digest(source)})
        for record in sorted(parser.results,key=lambda r:r['start']):
            raw=record.pop('raw');tree=sanitize(raw);key=digest(canonical(tree))
            raw_path='assets/icons/raw/'+digest(raw)[:16]+'.svg';(ROOT/raw_path).write_text(raw)
            url='https://lusion.co/'+('' if path.stem=='home' else path.stem.replace('__','/'))
            occ={**record,'page':str(path.relative_to(ROOT)),'url':url,'raw_path':raw_path,'raw_sha256':digest(raw)}
            if key not in groups:
                category,name,shape=classify(occ)
                # Strip placement IDs/classes from reusable root; preserve child IDs/references.
                tree.attrib.pop('id',None);tree.attrib.pop('class',None)
                if not tree.tag.startswith('{'):tree.set('xmlns',SVG_NS)
                svg=ET.tostring(tree,encoding='unicode')
                out='assets/icons/extracted/'+key[:16]+'.svg';(ROOT/out).write_text(svg+'\n')
                groups[key]={'id':key[:16],'name':name,'category':category,'shape':shape,'evidence':'extracted','viewBox':tree.attrib.get('viewBox'),'width':tree.attrib.get('width'),'height':tree.attrib.get('height'),'path':out,'svg':svg,'raw_svg':raw,'raw_path':raw_path,'canonical_sha256':key,'occurrences':[]}
            groups[key]['occurrences'].append(occ)
    icons=list(groups.values())
    name_counts={}
    for icon in icons:
        name_counts[icon['name']]=name_counts.get(icon['name'],0)+1
        if name_counts[icon['name']]>1:icon['name']+=' · '+str(name_counts[icon['name']])
    result={'schema_version':1,'source_scope':'All inline <svg> elements in sources/pages/*.html; external SVGs and CSS/canvas marks inventoried separately.','deduplication':'Normalized XML geometry + inline presentation + viewBox. Ignores placement IDs/classes and root width/height; normalizes internal ID references. Does not claim visual-equivalence across different path commands or external CSS contexts.','safety':'Original raw files are evidence only. Standalone extracted files remove script/foreignObject/animation, event attributes, external href/src, unsafe style URLs. Source bundles are never executed.','page_count':len(page_counts),'inline_svg_occurrences':sum(p['inline_svg_count'] for p in page_counts),'unique_inline_svg_count':len(icons),'raw_variant_count':len({o['raw_path'] for i in icons for o in i['occurrences']}),'pages':page_counts,'icons':icons}
    external_icons=[]
    css=(ROOT/'sources/site.css').read_text()
    for path in sorted((ROOT/'sources/assets').rglob('*.svg')):
        raw=path.read_text(); tree=sanitize(raw); svg=ET.tostring(tree,encoding='unicode')
        if not tree.tag.startswith('{'): tree.set('xmlns',SVG_NS); svg=ET.tostring(tree,encoding='unicode')
        key='external-'+digest(raw)[:16]; out='assets/icons/extracted/'+key+'.svg';(ROOT/out).write_text(svg+'\n')
        name=path.stem.replace('@logo--','').replace('-',' ').title()
        occurrences=[o for o in external_occ if path.name in o['source_url']]
        for match in re.finditer(re.escape(path.name),css):
            left=css.rfind('}',0,match.start())+1; right=css.find('}',match.end())+1
            rule=css[left:right]
            occurrences.append({'page':'sources/site.css','selector':rule.split('{')[0], 'start':match.start(),'line':css.count('\n',0,match.start())+1,'rule':rule})
        external_icons.append({'id':key,'name':name,'category':'ui' if '/icons/' in str(path) else 'brand','shape':'arrow' if '/icons/' in str(path) else 'logo','evidence':'external-extracted','viewBox':tree.attrib.get('viewBox'),'width':tree.attrib.get('width'),'height':tree.attrib.get('height'),'path':out,'raw_path':str(path.relative_to(ROOT)),'svg':svg,'raw_svg':raw,'raw_sha256':digest(raw),'occurrences':occurrences})
    result['external_icons']=external_icons
    result['external_svg_count']=len(external_icons)
    # Add curated evidence-backed CSS/canvas replicas without counting them as extracted SVGs.
    replica_config=ROOT/'assets/icons/replicas/catalog.json'
    if replica_config.exists():
        result['replicas']=json.loads(replica_config.read_text())
        for r in result['replicas']:r['svg']=(ROOT/r['path']).read_text().strip()
    result['team']=json.loads((ROOT/'sources/assets/lusion.dev/assets/team/team.json').read_text())
    result['project_themes']=[{'slug':p['slug'],'title':p['title'],'theme':p['theme'],'source':'sources/pages/projects__'+p['slug']+'.html'} for p in json.loads((ROOT/'research/projects.json').read_text())]
    (ROOT/'research/icon-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    (ROOT/'research/icon-data.js').write_text('/* Generated by scripts/extract-symbols.py; supports file://. */\nwindow.LUSION_ICONS = '+json.dumps(result,ensure_ascii=False).replace('</','<\\/')+';\n')
    print(json.dumps({k:result[k] for k in ['page_count','inline_svg_occurrences','unique_inline_svg_count','raw_variant_count']}))
    for i in icons:print(i['id'],i['category'],i['name'],i['viewBox'],len(i['occurrences']),i['occurrences'][0]['selector'])
if __name__=='__main__':main()
