#!/usr/bin/env python3
"""Bundle local browser data and reproducible downloadable kits. No dependencies."""
import argparse,hashlib,json,re,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent

def write_zip(target, paths):
    target.parent.mkdir(parents=True,exist_ok=True)
    files=[]
    for p in paths:
        if p.is_dir():files.extend(x for x in p.rglob('*') if x.is_file() and '__pycache__' not in x.parts)
        elif p.is_file():files.append(p)
    unique=sorted(set(files))
    temporary=target.with_suffix(target.suffix+'.tmp')
    with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in unique:
            info=zipfile.ZipInfo(p.relative_to(ROOT).as_posix(),date_time=(2026,9,7,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o100644<<16
            z.writestr(info,p.read_bytes())
    temporary.replace(target)
    return {'path':target.relative_to(ROOT).as_posix(),'bytes':target.stat().st_size,'files':len(unique),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data-only',action='store_true',help='Refresh browser data and component sheet without rebuilding ZIP files')
    args=parser.parse_args()
    data=ROOT/'data'; data.mkdir(exist_ok=True)
    source=json.loads((data/'source-manifest.json').read_text())
    (data/'source-data.js').write_text('window.ARK_SOURCE = '+json.dumps(source,ensure_ascii=False)+';\n')
    recipes=json.loads((ROOT/'prompts/recipes.json').read_text())
    payload={'templates':json.loads((data/'templates.json').read_text()),'recipes':recipes,'version':'3.0.0'}
    if (ROOT/'prompts/gradient.json').exists():payload['gradient']=json.loads((ROOT/'prompts/gradient.json').read_text())
    (data/'system-data.js').write_text('window.ARK_SYSTEM = '+json.dumps(payload,ensure_ascii=False)+';\n')
    html=(ROOT/'index.html').read_text()
    component=re.search(r'<section class="panel" id="panel-components".*?</section>',html,re.S).group(0).replace(' hidden','').replace('<a href="templates/components.html" target="_blank" rel="noopener" class="button secondary">컴포넌트 시트 ↗</a>','')
    sheet='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ARK 컴포넌트 시트</title><link rel="stylesheet" href="../tokens.css"><link rel="stylesheet" href="../ark-system.css"></head><body><main style="max-width:1200px"><a class="button secondary" href="../index.html#components">← 디자인 시스템</a>'+component+'<p class="note-box">이 HTML 파일과 ark-system.css의 component 관련 규칙을 함께 재사용합니다. 예시 문구와 수치는 프로젝트에 맞게 수정하세요.</p></main></body></html>'
    (ROOT/'templates/components.html').write_text(sheet)
    if args.data_only:
        print('Browser data and component sheet refreshed.')
        return
    out=ROOT/'downloads';out.mkdir(exist_ok=True)
    reports=[]
    reports.append(write_zip(out/'ark-source-archive.zip',[ROOT/'source',data/'source-manifest.json',ROOT/'scripts/extract_pdf.py']))
    reports.append(write_zip(out/'ark-templates.zip',[ROOT/'templates',ROOT/'tokens.css',ROOT/'tokens.json',ROOT/'ark-system.css',ROOT/'scripts/build_templates.py',ROOT/'prompts/guide.md']))
    reports.append(write_zip(out/'ark-icon-kit.zip',[ROOT/'assets/icons',ROOT/'prompts',ROOT/'docs/visual-analysis.md']))
    # The packaged manifest describes the included sub-archives; a ZIP cannot embed its own final hash.
    (data/'downloads.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n')
    parts=['start.py','index.html','ark-system.css','app.js','tokens.css','tokens.json','DESIGN.md','README.md','data','assets','source','templates','prompts','docs','scripts','tests',source['document']['filename']]
    reports.append(write_zip(out/'ark-design-system.zip',[ROOT/p for p in parts]+[out/r['path'].split('/')[-1] for r in reports]))
    (data/'downloads.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(reports,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
