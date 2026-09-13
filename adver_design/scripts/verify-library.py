"""Check deliverable links, collected references, and complete ZIP bytes without a browser."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for name in ['href', 'src', 'poster']:
            if values.get(name):
                self.paths.append(values[name])

pages = list(ROOT.glob('*.html')) + list((ROOT / 'samples').glob('*.html')) + list((ROOT / 'starter').glob('*.html')) + list((ROOT / 'components').glob('*.html'))
for page in pages:
    parser = Links()
    parser.feed(page.read_text())
    for value in parser.paths:
        url = urlsplit(value)
        if url.scheme or url.netloc or not url.path:
            continue
        path = (page.parent / unquote(url.path)).resolve()
        assert path.is_relative_to(ROOT.resolve()), f'Out of project: {page.name}: {value}'
        assert path.is_file(), f'Missing local asset: {page.name}: {value}'
print(f'PASS local links and resources in {len(pages)} authored HTML files')

sections = json.loads((ROOT / 'design-system/page-sections.json').read_text())['sections']
landing = (ROOT / 'landing.html').read_text()
for section in sections:
    assert section['html'] in landing, f'Section markup differs from landing: {section["id"]}'
    assert f'id="{section["id"]}"' in section['html'], f'Missing section anchor: {section["id"]}'
print(f'PASS {len(sections)} copyable sections exactly match landing markup and anchors')

coverage = json.loads((ROOT / 'references/source-coverage.json').read_text())
for section in coverage['section_coverage']:
    assert section['project_surface'], f'Missing implementation: {section["section"]}'
    assert not section['status'].startswith('missing'), section['section']
    for surface in section['project_surface']:
        assert (ROOT / surface.split('#')[0]).is_file(), surface
print(f'PASS {len(coverage["section_coverage"])} known reference groups have implementation links')

manifest = json.loads((ROOT / 'samples/complete-source-manifest.json').read_text())
with zipfile.ZipFile(ROOT / 'samples/complete-source.zip') as archive:
    assert archive.testzip() is None
    expected = {item['path'] for item in manifest['files']} | {'samples/complete-source-manifest.json'}
    assert set(archive.namelist()) == expected, 'Archive file list differs from manifest'
    for item in manifest['files']:
        data = (ROOT / item['path']).read_bytes()
        assert len(data) == item['bytes'], item['path']
        assert hashlib.sha256(data).hexdigest() == item['sha256'], item['path']
        assert archive.read(item['path']) == data, item['path']
    assert json.loads(archive.read('samples/complete-source-manifest.json')) == manifest
print(f'PASS {manifest["count"]} complete ZIP files match disk and SHA-256')
