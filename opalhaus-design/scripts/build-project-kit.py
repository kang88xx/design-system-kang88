"""Build the standalone package and a folder-copy ZIP without original assets."""
from pathlib import Path
import subprocess
import zipfile
import json
import tempfile
import shutil
root = Path(__file__).resolve().parents[1]
kit = root / 'design-system'
subprocess.run(['python3', str(kit / 'tools/build-tokens.py')], check=True)
with tempfile.TemporaryDirectory(prefix='opalhaus-pack-') as temp:
    output = subprocess.check_output(['npm', 'pack', '--json', '--pack-destination', temp], cwd=kit, text=True)
    filename = json.loads(output)[0]['filename']
    archive = root / 'opalhaus-design-system-1.0.0.tgz'
    shutil.copy2(Path(temp) / filename, archive)
with zipfile.ZipFile(root / 'opalhaus-project-kit.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for file in sorted(kit.rglob('*')):
        if file.is_file() and '__pycache__' not in file.parts and not any(part.startswith('.') for part in file.relative_to(kit).parts):
            z.write(file, file.relative_to(root))
print('Built opalhaus-project-kit.zip and opalhaus-design-system-1.0.0.tgz')
