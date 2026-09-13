"""Check delivered UI links and local CSS resources, excluding untouched upstream HTML."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links, self.ids, self.duplicates = [], set(), []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                self.duplicates.append(attrs['id'])
            self.ids.add(attrs['id'])
        for key in ('href', 'src', 'poster'):
            if attrs.get(key):
                self.links.append(attrs[key])


def verify():
    errors = []
    documents = {p.resolve(): Document(p.read_text()) for p in [*ROOT.glob('*.html'), *ROOT.glob('kit/**/*.html')] if not p.name.startswith('._')}
    references = 0

    def check(source, value):
        nonlocal references
        url = urlsplit(value)
        if url.scheme or url.netloc:
            return
        references += 1
        target = (source.parent / unquote(url.path)).resolve() if url.path else source.resolve()
        if not target.exists():
            errors.append(f'{source.name}: missing {value}')
        elif target in documents and url.fragment and unquote(url.fragment) not in documents[target].ids:
            errors.append(f'{source.name}: missing anchor {value}')

    for source, document in documents.items():
        errors.extend(f'{source.name}: duplicate id {value}' for value in document.duplicates)
        for value in document.links:
            check(source, value)
    styles = [*ROOT.glob('*.css'), *ROOT.glob('tokens/*.css'), *ROOT.glob('kit/**/*.css')]
    for source in styles:
        for match in re.finditer(r'url\(\s*[\'\"]?([^\)\'\"]+)[\'\"]?\s*\)', source.read_text()):
            check(source, match.group(1).strip())
    for source in [ROOT / 'README.md', ROOT / 'DESIGN.md', *ROOT.glob('media/*.md'), *ROOT.glob('research/*.md'), *ROOT.glob('kit/*.md')]:
        for value in re.findall(r'\]\(([^)]+)\)', source.read_text()):
            check(source, value)
    report = {'html_pages': len(documents), 'css_files': len(styles),
              'local_references_checked': references, 'errors': errors, 'passed': not errors}
    (ROOT / 'research/workspace-checks-v4.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return bool(errors)


if __name__ == '__main__':
    raise SystemExit(verify())
