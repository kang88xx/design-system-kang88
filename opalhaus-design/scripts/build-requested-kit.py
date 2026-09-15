"""Self-contained requested component examples, reference media, source evidence."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json
R=Path(__file__).resolve().parent.parent
index='''<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opalhaus requested components</title><style>body{margin:32px;font-family:Arial,sans-serif;color:#0a0a0a}h1{font-size:38px}iframe{border:1px solid #ddd;border-radius:12px;width:100%;height:560px;margin:20px 0}a{color:inherit;margin-right:16px}</style><h1>Buttons & promotion widget</h1><p>각 예제는 독립 HTML/CSS/JS와 필요한 원본 이미지·폰트를 포함합니다.</p><a href="requested-components.md">원본 규칙·클릭 명세</a><a href="design-system/components/README.md">CTA 사용법</a><a href="design-system/components/promo-widget.md">프로모션 사용법</a><iframe src="design-system/components/blog-cta.html" title="View All Blogs"></iframe><iframe src="design-system/components/promo-widget.html" title="Promotion widget"></iframe></html>'''
with ZipFile(R/'requested-components-kit.zip','w',ZIP_DEFLATED) as z:
 z.writestr('index.html',index)
 files=list((R/'design-system').rglob('*'))+list((R/'evidence/requested-components').rglob('*'))
 files += [R/'requested-components.md',R/'promo-data.json',R/'motion-data.json',R/'source/js/d46c92adb536-script_main.BwHbeoB9.mjs',R/'source/js/1b74ddc35131-HE93u556K.BmCsTx7i.mjs']
 for p in files:
  rel=p.relative_to(R)
  if p.is_file() and not any(x.startswith('.') or x=='__pycache__' for x in rel.parts):z.write(p,rel)
print('requested-components-kit.zip', (R/'requested-components-kit.zip').stat().st_size,'bytes')
