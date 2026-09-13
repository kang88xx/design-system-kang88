"""Build provenance-aware tokens and dependency-free browser bundles."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
colors=[('cobalt','#011187','장 구분 · 주요 배경',[4,7,10],'observed'),('navy','#061A58','깊은 배경',[5],'observed'),('icon','#091955','아이콘 · 선',[5,15,26],'observed'),('paper','#F4F4F8','본문 배경',[15,26],'observed'),('ink','#1A2646','제목 · 본문',[1,3],'observed'),('steel','#516086','보조 제목',[6,50],'observed'),('white','#FFFFFF','반전 텍스트',[4,7],'observed'),('yellow','#EEC12B','캐릭터 보조색',[9],'observed'),('rule','#DADDE5','웹 구분선',[],'extension'),('muted','#687084','웹 보조 텍스트',[],'extension')]
tokens={'name':'ARK Document System','version':'3.0.0','color':{},'space':{},'type':{},'canvas':{'slide':{'width':1920,'height':1080,'unit':'PDF user units','sourcePages':[1,4]},'a4':{'width':210,'height':297,'unit':'mm','origin':'extension'}}}
for name,value,role,pages,origin in colors:
 tokens['color'][name]={'$type':'color','$value':{'colorSpace':'srgb','components':[round(int(value[i:i+2],16)/255,6) for i in (1,3,5)],'alpha':1,'hex':value},'$description':role,'$extensions':{'ark':{'origin':origin,'sourcePages':pages}}}
for n in [4,8,12,16,24,32,48,64,96]:tokens['space'][str(n)]={'$type':'dimension','$value':{'value':n,'unit':'px'},'$description':'새 템플릿을 위한 정규화 간격 / extension'}
for name,size in [('caption',16),('body',25),('subheading',49),('title',85),('display',130),('chapter',400)]:tokens['type'][name]={'$type':'dimension','$value':{'value':size,'unit':'px'},'$description':'PDF 좌표계 크기를 SVG/CSS 좌표계에 1:1 적용. PPT pt는 슬라이드 배율로 환산.'}
tokens['iconGradient']={'origin':'sampled-extension','sourcePages':[15,26,29],'angle':135,'stops':['#5C66D4','#2733A1','#051565'],'note':'Normalized approximation sampled from original crops; original PDF gradients are flattened.'}
(ROOT/'tokens.json').write_text(json.dumps(tokens,ensure_ascii=False,indent=2)+'\n')
css='/* Observed source colors; normalized spacing is an extension. See tokens.json. */\n:root {\n'+''.join(f'  --ark-{n}: {v};\n' for n,v,*_ in colors)+''.join(f'  --space-{n}: {n}px;\n' for n in [4,8,12,16,24,32,48,64,96])+'  --font-sans: Arial, "Noto Sans CJK KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;\n  --font-mono: "SFMono-Regular", Consolas, monospace;\n}\n'
(ROOT/'tokens.css').write_text(css)
(ROOT/'data/foundation.js').write_text('window.ARK_FOUNDATION = '+json.dumps({'colors':[{'id':n,'hex':v,'role':r,'sourcePages':p,'origin':o} for n,v,r,p,o in colors],'tokens':tokens},ensure_ascii=False)+';\n')
