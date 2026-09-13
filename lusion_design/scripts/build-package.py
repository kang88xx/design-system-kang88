"""Package the local viewer, archived sources and reconstructions for offline use."""
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'downloads/lusion-source-system-v4.zip'
DIRECTORIES = ('assets', 'media', 'research', 'scripts', 'screenshots', 'sources', 'tokens', 'kit')


def build():
    files = [p for p in ROOT.iterdir() if p.is_file() and p.suffix in ('.html', '.css', '.js', '.md')]
    for directory in DIRECTORIES:
        files.extend(p for p in (ROOT / directory).rglob('*') if p.is_file()
                     and '__pycache__' not in p.parts and p.suffix != '.pyc')
    files.extend(p for p in (ROOT / 'downloads').glob('*') if p.name.startswith(('project-design-system-', 'local-project-design-system-', 'project-kit-info')))
    files = sorted(set(files))
    OUTPUT.parent.mkdir(exist_ok=True)
    temporary = OUTPUT.with_suffix('.tmp')
    with ZipFile(temporary, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
        for source in files:
            archive.write(source, 'lusion-source-system/' + source.relative_to(ROOT).as_posix())
        archive.writestr('lusion-source-system/downloads/package-info.json', json.dumps({
            'scope': 'unpacked contents', 'files': len(files) + 1,
            'note': 'This file describes the extracted package. The outer ZIP checksum is recorded beside the original download.',
            'excluded': ['outer ZIP itself', '.omx runtime state', '__pycache__']
        }, ensure_ascii=False, indent=2) + '\n')
    with ZipFile(temporary) as archive:
        bad = archive.testzip()
        if bad:
            raise RuntimeError('Archive integrity failure: ' + bad)
        assert len(archive.namelist()) == len(files) + 1
        assert 'lusion-source-system/index.html' in archive.namelist()
        assert 'lusion-source-system/source-explorer.html' in archive.namelist()
        assert 'lusion-source-system/reconstruction.html' in archive.namelist()
    temporary.replace(OUTPUT)
    with OUTPUT.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    report = {'path': OUTPUT.relative_to(ROOT).as_posix(), 'files': len(files) + 1,
              'bytes': OUTPUT.stat().st_size, 'sha256': digest, 'zip_crc_verified': True,
              'excludes': ['.omx runtime state', 'downloads (archive itself)', '__pycache__']}
    (OUTPUT.parent / 'package-info.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    build()
