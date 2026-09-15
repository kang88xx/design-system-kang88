#!/usr/bin/env python3
"""Archive referenced public Opalhaus HTML, CSS, modules and media (stdlib only).
Run from any directory: python3 scripts/collect.py [--max-pages 60] [--workers 12].
Published originals are preserved; this is not a reconstructed Framer project.
"""
import argparse
import concurrent.futures
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://opalhaus.framer.website/'
HOST = urlsplit(BASE).netloc
ALLOWED = {HOST, 'framerusercontent.com', 'fonts.gstatic.com', 'videos.pexels.com'}
EXTENSIONS = {'.mjs', '.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp4', '.webm', '.mov', '.mp3'}
URLS = re.compile(r'https?://[^\s<>"\'`\\)\]}]+')
IMPORTS = re.compile(r'(?:\bfrom\s*|\bimport\s*\(?\s*)["\']([^"\']+)["\']')
CSS_URLS = re.compile(r'url\(\s*["\']?([^\s)"\']+)')

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.resources, self.styles = [], [], []
        self.in_style = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'style':
            self.in_style = True
            self.styles.append('')
        for key in ('src', 'poster'):
            if attrs.get(key):
                self.resources.append(attrs[key])
        if attrs.get('srcset'):
            self.resources.extend(part.strip().split()[0] for part in attrs['srcset'].split(',') if part.strip())
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'preload', 'modulepreload', 'icon', 'apple-touch-icon'):
            if attrs.get('href'):
                self.resources.append(attrs['href'])
    def handle_endtag(self, tag):
        if tag == 'style':
            self.in_style = False
    def handle_data(self, data):
        if self.in_style:
            self.styles[-1] += data

def canonical(url, base):
    p = urlsplit(urljoin(base, html.unescape(url).rstrip(',;')))
    return urlunsplit((p.scheme, p.netloc, p.path, p.query, ''))

def resource(url):
    p = urlsplit(url)
    return p.scheme == 'https' and p.netloc in ALLOWED and Path(p.path).suffix.lower() in EXTENSIONS

def destination(url, kind):
    p = urlsplit(url)
    name = Path(p.path).name or 'index.html'
    digest = hashlib.sha256(url.encode()).hexdigest()[:12]
    if kind == 'page':
        slug = re.sub(r'[^a-zA-Z0-9_-]+', '-', p.path.strip('/')) or 'home'
        return ROOT / 'pages' / (slug + '.html')
    ext = Path(p.path).suffix.lower()
    folder = 'source/js' if ext in ('.mjs', '.js') else 'source/css' if ext == '.css' else 'source/data' if ext == '.json' else 'assets/fonts' if ext in ('.woff', '.woff2', '.ttf', '.otf') else 'assets/videos' if ext in ('.mp4', '.webm', '.mov') else 'assets/images'
    return ROOT / folder / (digest + '-' + name)

def fetch(url, kind):
    try:
        with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0 (Public design archive)', 'Accept-Encoding': 'identity'}), timeout=35) as response:
            data = response.read()
            content_type = response.headers.get('Content-Type', '')
            final_url = response.url
        if kind == 'page' and 'text/html' not in content_type:
            raise ValueError('Expected HTML, received ' + content_type)
        path = destination(url, kind)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        record = dict(url=url, path=str(path.relative_to(ROOT)), kind=kind, bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), content_type=content_type, final_url=final_url)
        return record, data
    except Exception as exc:
        return dict(url=url, kind=kind, error=str(exc)), b''

def discover(data, url, kind):
    text = data.decode('utf-8', errors='replace')
    links, inline, refs = [], [], []
    if kind == 'page':
        parser = Page()
        parser.feed(text)
        links, inline, refs = parser.links, parser.styles, parser.resources
    refs += URLS.findall(text)
    refs += CSS_URLS.findall(text)
    if Path(urlsplit(url).path).suffix in ('.js', '.mjs'):
        refs += [v for v in IMPORTS.findall(text) if v.startswith(('.', '/', 'https://'))]
    return links, inline, {canonical(ref, url) for ref in refs if resource(canonical(ref, url))}

def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--max-pages', type=int, default=60)
    ap.add_argument('--workers', type=int, default=12)
    args = ap.parse_args()
    started = time.time()
    records, seen_pages, seen_assets = [], {BASE}, set()
    pending_pages, pending_assets = {BASE}, set()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        while pending_pages or pending_assets:
            jobs = [(u, 'page') for u in sorted(pending_pages)] + [(u, 'asset') for u in sorted(pending_assets)]
            pending_pages, pending_assets = set(), set()
            for record, data in pool.map(lambda job: fetch(*job), jobs):
                records.append(record)
                if 'error' in record:
                    print('ERROR', record['url'], record['error'], flush=True)
                    continue
                if record['kind'] != 'page' and Path(urlsplit(record['url']).path).suffix not in ('.js', '.mjs', '.css', '.json'):
                    continue
                links, inline, refs = discover(data, record['url'], record['kind'])
                if inline:
                    css_path = ROOT / 'source/css' / (Path(record['path']).stem + '-inline.css')
                    css_path.parent.mkdir(parents=True, exist_ok=True)
                    css_path.write_text('\n\n'.join(inline))
                    record['inline_css'] = str(css_path.relative_to(ROOT))
                    record['inline_style_blocks'] = len(inline)
                for link in links:
                    target = canonical(link, record['url'])
                    p = urlsplit(target)
                    target = urlunsplit((p.scheme, p.netloc, p.path, '', ''))
                    if p.scheme == 'https' and p.netloc == HOST and not Path(p.path).suffix and target not in seen_pages and len(seen_pages) < args.max_pages:
                        seen_pages.add(target)
                        pending_pages.add(target)
                for ref in refs - seen_assets:
                    seen_assets.add(ref)
                    pending_assets.add(ref)
            print(f'Archived {len(records)} URLs; queued {len(pending_pages)} pages / {len(pending_assets)} resources', flush=True)
    successful = [r for r in records if 'error' not in r]
    manifest = {'site': BASE, 'collected_at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'scope': 'Same-origin linked HTML; referenced CDN and Pexels media/fonts/CSS/data/modules and recursive module imports. Excludes analytics, editor tooling, source-map guesses and external purchase/social links.', 'summary': {'pages': sum(r['kind'] == 'page' for r in successful), 'resources': sum(r['kind'] == 'asset' for r in successful), 'bytes': sum(r['bytes'] for r in successful), 'errors': len(records)-len(successful), 'duration_seconds': round(time.time()-started, 2)}, 'files': sorted(records, key=lambda r: r['url'])}
    (ROOT / 'assets/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(manifest['summary']), flush=True)

if __name__ == '__main__':
    main()
