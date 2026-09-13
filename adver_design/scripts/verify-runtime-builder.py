"""Reject malformed release identifiers before writing generated files."""
from pathlib import Path
import json
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
for invalid in ['../outside', 'nested/path', 'tabs', '', 'UPPER']:
    with tempfile.TemporaryDirectory(prefix='adver-builder-') as directory:
        root = Path(directory)
        (root / 'scripts').mkdir()
        (root / 'design-system').mkdir()
        shutil.copyfile(ROOT / 'scripts/build-runtime.py', root / 'scripts/build-runtime.py')
        for name in ['tokens.json', 'motion-samples.json', 'interaction-samples.json']:
            shutil.copyfile(ROOT / 'design-system' / name, root / 'design-system' / name)
        source = root / 'design-system/motion-samples.json'
        items = json.loads(source.read_text())
        items[0]['id'] = invalid
        source.write_text(json.dumps(items))
        before = {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()}
        result = subprocess.run(['python3', str(root / 'scripts/build-runtime.py')], capture_output=True, text=True)
        assert result.returncode != 0 and ('Invalid component ID' in result.stderr or 'Duplicate component ID' in result.stderr), result.stderr
        after = {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()}
        assert before == after and not (root / 'components').exists() and not (root / 'releases').exists()
print('PASS invalid/traversal/duplicate component IDs fail before any generated output')
