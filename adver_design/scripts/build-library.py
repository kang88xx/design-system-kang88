"""Build offline source catalog and a reproducible, hash-checked complete source ZIP.
Run build-samples.py first after changing reusable kits.
"""
from pathlib import Path
import hashlib
import json
import zipfile
import mimetypes

ROOT = Path(__file__).resolve().parents[1]
DS = ROOT / 'design-system'
OUT = ROOT / 'samples'
OUT.mkdir(exist_ok=True)
def read(path):
    return (ROOT / path).read_text(encoding='utf-8')
def sha(data):
    return hashlib.sha256(data).hexdigest()
def load(path, fallback):
    return json.loads(read(path)) if (ROOT / path).exists() else fallback

files = {}
original_text = {}
def add_file(path):
    if path in files or not (ROOT / path).is_file():
        return
    data = (ROOT / path).read_bytes()
    try:
        content = data.decode('utf-8')
    except UnicodeDecodeError:
        content = None
    # Embed exact text for offline copy; binary files remain downloadable by their local path.
    deferred = path.startswith('references/source-audit/') and content is not None and (ROOT / path).parent.name in ['css', 'js', 'assets', 'fonts', 'official-page', 'graph']
    if deferred:
        original_text[path] = content
    files[path] = {'deferred': deferred, 'path': path, 'bytes': len(data), 'sha256': sha(data),
                   'content': None if deferred else content, 'truncated': False}

entries = []
for path in ['landing.html', 'index.html', 'motion.html']:
    if not (ROOT / path).exists():
        continue
    title = {'landing.html': '전체 광고 페이지', 'index.html': '디자인 규칙 카탈로그', 'motion.html': '모션·인터랙션 실험실'}[path]
    dependencies = {'landing.html': ['tokens.css','page-kit.css','page-kit.js'],
                    'index.html': ['tokens.css','showcase.css','showcase.js'],
                    'motion.html': ['tokens.css','motion-kit.css','interaction-kit.css','lab.css','motion-kit.js','interaction-kit.js','lab.js']}[path]
    entries.append({'id': path.removesuffix('.html'), 'title': title, 'category': 'page', 'status': 'reconstructed',
                    'summary': '페이지 전체를 실행하는 독립 템플릿입니다. 기존 앱에는 프로젝트용 런타임 패키지를 사용하세요.',
                    'preview': path, 'files': [path] + ['design-system/' + p for p in dependencies],
                    'evidence': '원본 영상의 레이아웃과 공개 스타일을 참고한 재구성입니다. 비공개 원본 코드와 동일하다고 보장하지 않습니다.'})

entries.append({'id':'use','title':'프로젝트 적용 가이드','category':'page','status':'local','summary':'필요한 파일, 테마, 콜백과 생명주기 계약을 확인하세요.','preview':'use.html','files':['use.html','USAGE.md'],'evidence':'프로젝트용 런타임 1.0.0의 사용 계약입니다.'})
entries.append({'id':'starter','title':'프로젝트 적용 스타터','category':'page','status':'local','summary':'테마·브랜드·다중 컴포넌트·콜백을 실행하는 독립 소비자 예제입니다.','preview':'starter/index.html','files':['starter/index.html','starter/app.css','starter/app.js','design-system/components.js','design-system/tokens.scoped.css','design-system/motion-kit.css','design-system/motion-kit.js','design-system/interaction-kit.css','design-system/interaction-kit.js'],'evidence':'외부 전송 없는 소비자 콜백 예제입니다. 실제 API는 프로젝트에서 연결합니다.'})

for kind in ['motion', 'interaction']:
    kit = kind + '-kit'
    for sample in load('design-system/' + kind + '-samples.json', []):
        entries.append({'id': sample['id'], 'title': sample['title'], 'category': 'sample',
                        'status': 'reconstructed' if sample['status'] == 'video-observed' else 'substitute',
                        'summary': sample['summary'], 'preview': f'samples/{sample["id"]}.html',
                        'files': [f'components/{sample["id"]}.html', f'samples/{sample["id"]}.html', 'design-system/tokens.scoped.css', f'design-system/{kit}.css', f'design-system/{kit}.js'],
                        'evidence': sample['evidence'], 'sourceTime': sample['sourceTime']})

sections = load('design-system/page-sections.json', [])
if isinstance(sections, dict):
    sections = sections.get('sections', [])
for section in sections:
    entries.append({'id': 'section-' + section['id'], 'title': section['title'], 'category': 'page',
                    'status': 'reconstructed', 'summary': section.get('summary', '전체 페이지에서 해당 구성을 확인하고 섹션 마크업을 가져가세요.'),
                    'template': True, 'preview': 'landing.html#' + section['id'], 'files': list(dict.fromkeys(['landing.html'] + section.get('cssFiles', []) + section.get('jsFiles', []))),
                    'html': section.get('html'), 'evidence': '독립 페이지 템플릿의 섹션입니다. page-kit CSS/JS는 페이지 전체를 소유하며 기존 앱에 부분 삽입용이 아닙니다. ' + section.get('evidence', ''), 'sourceTime': section.get('sourceTime', '')})

for path in sorted(DS.glob('*')):
    if path.suffix not in ['.css', '.js', '.json'] or path.name in ['source-catalog.js', 'source-originals.js', 'lab-sources.js', 'page-sections.json']:
        continue
    rel = path.relative_to(ROOT).as_posix()
    category = 'token' if path.name.startswith('tokens.') else 'file'
    entries.append({'id': 'file-' + path.name, 'title': path.name, 'category': category,
                    'status': 'reconstructed', 'summary': '디자인 시스템에서 실제 사용하는 소스 파일. 전체 내용을 복사하거나 원본 파일을 내려받으세요.',
                    'files': [rel], 'evidence': '로컬 구현 파일입니다. 원본 관찰값과 적용 제안은 각 파일과 DESIGN.md에 설명되어 있습니다.'})

for path in sorted(ROOT.glob('*.md')) + sorted((ROOT / 'scripts').glob('*')):
    if not path.is_file() or path.suffix not in ['.md', '.py', '.cjs', '.sh']:
        continue
    rel = path.relative_to(ROOT).as_posix()
    entries.append({'id': 'guide-' + path.name, 'title': path.name, 'category': 'guide', 'status': 'local',
                    'summary': '실행·적용·검증에 사용하는 프로젝트 문서와 도구.', 'files': [rel], 'evidence': '프로젝트에서 작성한 적용 안내 또는 검증 도구입니다.'})

for path in sorted((ROOT / 'references').rglob('*')):
    if not path.is_file() or 'verification' in path.parts:
        continue
    rel = path.relative_to(ROOT).as_posix()
    # Keep frame browsing focused on the reference contact sheet instead of 60 near-duplicate rows.
    if path.parent.name in ['frames', 'motion-audit-frames']:
        continue
    original = ('source-audit' in path.parts and path.parent.name in ['css', 'js', 'assets', 'fonts', 'official-page', 'graph']) or path.name in ['recording.mp4', 'contact-sheet.jpg', 'recent-page.png']
    entries.append({'id': 'ref-' + rel.removeprefix('references/'), 'title': path.name,
                    'category': 'original' if original else 'guide', 'status': 'collected' if original else 'local',
                    'summary': '공개 응답으로 수집한 원본 자료. 실행 파일로 프로젝트에 연결하지 않습니다.' if original else '원본 수집 범위·관찰·검증 기록.',
                    'files': [rel], 'evidence': '수집 URL·시점·해시는 references/source-audit/manifest.json 및 references/manifest.json을 확인하세요.'})

collection = load('references/source-audit/manifest.json', {})
graph = load('references/source-audit/graph-manifest.json', {})
for entry in entries:
    entry['mime'] = next((record.get('mime', '') for record in graph.get('records', []) if 'references/source-audit/' + record.get('path', '') in entry['files']), mimetypes.guess_type(entry['files'][0])[0] or '')
    entry['origins'] = [record['url'] for record in graph.get('records', []) if record.get('status') == 'stored' and 'references/source-audit/' + record.get('path', '') in entry['files']]
    for resource in collection.get('resources', []):
        source_dir = 'references/source-audit/' + resource.get('path', '')
        for path in entry['files']:
            normalized = (ROOT / source_dir).resolve().relative_to(ROOT.resolve()).as_posix()
            if resource.get('url') and path == normalized:
                entry['origins'].append(resource['url'])
            elif resource.get('url_pattern') and path.startswith(source_dir):
                filename = Path(path).name
                entry['origins'].append(resource['url_pattern'].replace('{filename}', filename) + resource.get('query_variants', {}).get(filename, ''))
    for path in entry['files']:
        add_file(path)
    assert all(path in files for path in entry['files']), f'Missing source: {entry["id"]}'
assert len({e['id'] for e in entries}) == len(entries), 'Duplicate entry ID'
catalog = {'entries': entries, 'files': files, 'tokens': load('design-system/tokens.json', {}),
           'coverage': load('references/source-coverage.json', {}), 'collection': load('references/source-audit/manifest.json', {})}
(DS / 'source-originals.js').write_text('/* Generated text-only reference archive; never executes upstream code. */\nwindow.SourceOriginals = ' + json.dumps(original_text, ensure_ascii=False).replace('</script', '<\\/script') + ';\n', encoding='utf-8')
(DS / 'source-catalog.js').write_text('/* Generated by scripts/build-library.py */\nwindow.SourceCatalog = ' + json.dumps(catalog, ensure_ascii=False).replace('</script', '<\\/script') + ';\n', encoding='utf-8')

# All source files including original media. Exclude changing test outputs and recursive complete ZIP.
paths = [p for p in ROOT.rglob('*') if p.is_file() and not any(part in {'.omx', '.git', 'backups', '__pycache__', 'node_modules'} for part in p.relative_to(ROOT).parts)
         and 'verification' not in p.relative_to(ROOT).parts and p.suffix != '.pyc' and p.name not in {'complete-source.zip', 'complete-source-manifest.json'}]
manifest = {'scope': 'Project code, generated independent examples and motion kit ZIP, documentation, collected reference sources. Excludes runtime state, backups, caches, changing verification outputs and the complete ZIP itself.', 'files': []}
with zipfile.ZipFile(OUT / 'complete-source.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(paths):
        data = path.read_bytes()
        rel = path.relative_to(ROOT).as_posix()
        archive.writestr(rel, data)
        manifest['files'].append({'path': rel, 'bytes': len(data), 'sha256': sha(data)})
    manifest['count'] = len(manifest['files'])
    content = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    archive.writestr('samples/complete-source-manifest.json', content)
(OUT / 'complete-source-manifest.json').write_text(content, encoding='utf-8')
with zipfile.ZipFile(OUT / 'complete-source.zip') as archive:
    assert archive.testzip() is None
    for item in manifest['files']:
        assert sha(archive.read(item['path'])) == item['sha256'], item['path']
print(f'Built {len(entries)} source entries; {manifest["count"]} files bundled and hashes verified.')
