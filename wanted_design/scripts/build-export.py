"""Build a portable reuse bundle; reference media remains a separate opt-in bundle."""
import argparse, hashlib, json, pathlib, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--include-reference-assets', action='store_true')
args = parser.parse_args()
output = ROOT / 'exports'
output.mkdir(exist_ok=True)
name = 'montage-reference-assets.zip' if args.include_reference_assets else 'montage-reuse.zip'
paths = []
if args.include_reference_assets:
    paths.extend(p for p in (ROOT / 'assets/montage/images').rglob('*') if p.is_file())
    paths.extend(p for p in (ROOT / 'assets/montage/shapes').rglob('*') if p.is_file())
    paths.extend([ROOT / 'data/curated/asset-manifest.json', ROOT / 'data/curated/shapes.json', ROOT / 'docs/LICENSE_AND_ATTRIBUTION.md'])
else:
    paths.extend(p for p in (ROOT / 'data/curated').glob('*') if p.is_file())
    paths.extend(p for p in (ROOT / 'assets/montage/icons').glob('*.svg'))
    paths.extend(p for p in (ROOT / 'assets/montage/icons-upstream').glob('*.svg'))
    paths.extend(p for p in (ROOT / 'assets/montage/shapes/resources').glob('*') if p.is_file())
    paths.extend(p for p in (ROOT / 'docs').glob('*.md'))
    paths.extend([ROOT / 'DESIGN.md', ROOT / 'assets/montage/source/LICENSE-Montage.md'])
paths = sorted({p for p in paths if not p.name.startswith('._')})
missing = [str(p) for p in paths if not p.is_file()]
if missing:
    raise SystemExit(f'Missing package inputs: {missing}')
archive = output / name
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in paths:
        z.write(p, p.relative_to(ROOT))
    z.writestr('START-HERE.md', '''# Montage reusable source collection

1. Copy data/curated/tokens.css and recipes.css into your project and load tokens before recipes.
2. Use data/curated/reuse-library.json for original platform examples and portable surface/motion recipes.
3. Use SVG files in assets/montage/icons/ and icons-upstream/ individually; preserve currentColor and original multicolor variants.
4. Lottie source JSON requires a compatible player. Static SVG previews do not reproduce Lottie playback.
5. Keep assets/montage/source/LICENSE-Montage.md with reused upstream code. Review docs/LICENSE_AND_ATTRIBUTION.md for brand references.
6. React, iOS and Android examples require their original platform libraries; they are not standalone vanilla JavaScript.

The bundle contains metadata links to separately stored reference media and upstream source files. Those links are inventory references, not bundled copies. The full pinned source archive and local viewer are available in the original collection.
''')
with zipfile.ZipFile(archive) as z:
    damaged = z.testzip()
    if damaged:
        raise SystemExit(f'Corrupt zip member: {damaged}')
manifest = {'file': 'exports/' + name, 'fileCount': len(paths) + 1, 'byteSize': archive.stat().st_size,
            'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'referenceAssets': args.include_reference_assets}
(output / (name + '.json')).write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest, indent=2))
