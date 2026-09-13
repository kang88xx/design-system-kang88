"""Archive and index a pinned public upstream without installing/executing it."""
import argparse, datetime, hashlib, json, pathlib, tarfile, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
SHA = 'bfced87f96dfb21c8ea80074c551b64b9ed1530b'
BASE = ROOT / 'assets/montage/source'
ARCHIVE = BASE / 'montage-web-bfced87.tar.gz'
URL = f'https://codeload.github.com/wanteddev/montage-web/tar.gz/{SHA}'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--download', action='store_true', help='Download the pinned archive if absent')
args = parser.parse_args()
BASE.mkdir(parents=True, exist_ok=True)
if not ARCHIVE.exists():
    if not args.download:
        raise SystemExit('Archive missing; run python3 scripts/collect-upstream.py --download')
    temporary = ARCHIVE.with_suffix('.download')
    try:
        with urllib.request.urlopen(URL, timeout=60) as response, temporary.open('wb') as out:
            total = 0
            while chunk := response.read(1024 * 1024):
                total += len(chunk)
                if total > 150 * 1024 * 1024:
                    raise ValueError('Upstream archive exceeds expected 150 MB limit')
                out.write(chunk)
        temporary.replace(ARCHIVE)
    finally:
        temporary.unlink(missing_ok=True)

def digest(data):
    return hashlib.sha256(data).hexdigest()

files = []
with tarfile.open(ARCHIVE) as archive:
    for member in archive.getmembers():
        name = '/'.join(member.name.split('/')[1:])
        rel = pathlib.PurePosixPath(name)
        if not member.isfile() or '..' in rel.parts or rel.is_absolute():
            continue
        if not (name.startswith('packages/') or name in ('LICENSE.md', 'README.md', 'package.json')):
            continue
        data = archive.extractfile(member).read()
        destination = BASE / 'upstream' / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        checksum = digest(data)
        if not destination.exists() or digest(destination.read_bytes()) != checksum:
            destination.write_bytes(data)
        files.append({'path': name, 'localPath': destination.relative_to(ROOT).as_posix(),
                      'sourceUrl': f'https://github.com/wanteddev/montage-web/blob/{SHA}/{name}',
                      'byteSize': len(data), 'sha256': checksum})
(BASE / 'LICENSE-Montage.md').write_bytes((BASE / 'upstream/LICENSE.md').read_bytes())
old = json.loads((ROOT / 'data/raw/montage.json').read_text())
live_path = ROOT / 'data/raw/montage-live.json'
live = json.loads(live_path.read_text()) if live_path.exists() else old
old_pages = {p['path']: p for p in old['pages']}
live_pages = {p['path']: p for p in live['pages']}
comparison = {
    'verifiedAt': live['metadata']['collectedAt'], 'baselineAt': old['metadata']['collectedAt'],
    'pageCount': len(live_pages), 'sitemapUrlCount': live['metadata']['sitemapUrlCount'],
    'assetCount': len(live['assets']), 'iconCount': len(live['iconVectors']),
    'failedPages': live['failures'],
    'addedPages': sorted(set(live_pages) - set(old_pages)),
    'removedPages': sorted(set(old_pages) - set(live_pages)),
    'addedAssets': sorted(set(live['assets']) - set(old['assets'])),
    'removedAssets': sorted(set(old['assets']) - set(live['assets'])),
    'themesUnchanged': old['themes'] == live['themes'],
    'documentCodeChanges': [p for p in live_pages if p in old_pages and old_pages[p]['code'] != live_pages[p]['code']],
}
manifest = {
    'source': 'https://montage.wanted.co.kr', 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'siteVerification': comparison,
    'upstream': {'repository': 'https://github.com/wanteddev/montage-web', 'release': 'v3.12.0', 'commit': SHA,
                 'archiveUrl': URL, 'localPath': ARCHIVE.relative_to(ROOT).as_posix(),
                 'sha256': digest(ARCHIVE.read_bytes()), 'byteSize': ARCHIVE.stat().st_size,
                 'licensePath': 'assets/montage/source/LICENSE-Montage.md'},
    'counts': {'sourceFiles': len(files), 'iconComponents': sum('/wds-icon/src/icon-' in f['path'] and f['path'].endswith('.tsx') for f in files)},
    'files': files,
    'scope': 'Public documentation snapshot and pinned public source are separate inventories. Archive also includes original documentation/media. No private source is claimed.'
}
(ROOT / 'data/curated/source-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'status': 'ok', 'upstream': manifest['counts'], 'siteVerification': comparison}, ensure_ascii=False, indent=2))
