"""Build a standalone kit ZIP and local npm tarball without network or dependencies."""
import hashlib
import json
from pathlib import Path
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]

def build():
    kit = ROOT / 'kit'
    output = ROOT / 'downloads'
    output.mkdir(exist_ok=True)
    files = sorted(p for p in kit.rglob('*') if p.is_file())
    archive_path = output / 'project-design-system-1.1.0.zip'
    with ZipFile(archive_path, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
        for file in files:
            archive.write(file, file.relative_to(ROOT).as_posix())
    with ZipFile(archive_path) as archive:
        assert archive.testzip() is None
        for required in ['kit/system.js', 'kit/system.d.ts', 'kit/examples/index.html', 'kit/README.md']:
            assert required in archive.namelist()
    packed = subprocess.run(['npm', 'pack', '--ignore-scripts', '--offline', '--json', '--pack-destination', str(output)],
                            cwd=kit, check=True, capture_output=True, text=True)
    tar = output / json.loads(packed.stdout)[0]['filename']
    report = {'version': '1.1.0', 'files': len(files), 'zip_crc_verified': True, 'artifacts': [],
              'contents': [p.relative_to(ROOT).as_posix() for p in files]}
    for file in [archive_path, tar]:
        report['artifacts'].append({'path': file.relative_to(ROOT).as_posix(), 'bytes': file.stat().st_size,
                                    'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    (output / 'project-kit-info.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    build()
