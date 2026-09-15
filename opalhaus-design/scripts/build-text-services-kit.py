from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
R=Path(__file__).resolve().parent.parent
files=list((R/'design-system').rglob('*'))+list((R/'evidence/text-services').rglob('*'))
for name in ['text-services.md','reveal-data.json','services-data.json']:
 p=R/name;files.append(p)
 if name.endswith('.json'):
  def visit(x):
   if isinstance(x,dict):
    for v in x.values():visit(v)
   elif isinstance(x,list):
    for v in x:visit(v)
   elif isinstance(x,str) and x.startswith(('assets/','source/js/')) and (R/x).is_file():files.append(R/x)
  visit(json.loads(p.read_text()))
index='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Text reveals & service lists</title><style>body{margin:24px;font-family:Arial,sans-serif;color:#0a0a0a}iframe{width:100%;height:950px;border:1px solid #ddd;border-radius:12px;margin:24px 0}a{color:inherit}</style><h1>Text reveals & service lists</h1><p>글자 단위 등장, 그룹 등장, 이미지 hover, 이름·번호 롤링의 독립 소스입니다.</p><a href="text-services.md">원본 수치·인터랙션 명세</a><iframe src="design-system/components/text-reveal.html" title="Text reveal"></iframe><iframe src="design-system/components/service-list.html" title="Service lists"></iframe></html>'''
with ZipFile(R/'text-services-kit.zip','w',ZIP_DEFLATED) as z:
 z.writestr('index.html',index)
 for p in sorted(set(files)):
  rel=p.relative_to(R)
  if p.is_file() and not any(x.startswith('.') or x=='__pycache__' for x in rel.parts):z.write(p,rel)
print('text-services-kit.zip',(R/'text-services-kit.zip').stat().st_size,'bytes')
