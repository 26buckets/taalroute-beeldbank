"""Maak compacte weergavebestanden; originele foto's horen niet in Git.

python3 scripts/optimize_images.py --source-dir /pad/naar/originals
Bronnen mogen 1.png ... 50.png heten of de geregistreerde Drive-bestandsnaam.
Vereist Pillow met AVIF- en WebP-ondersteuning.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps, features

ROOT = Path(__file__).resolve().parents[1]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--collection', choices=('badkamer', 'keuken'), default='badkamer')
    args = parser.parse_args()
    if not features.check('avif') or not features.check('webp'):
        parser.error('Pillow met AVIF en WebP is nodig.')
    content = json.loads((ROOT / f'content/{args.collection}.json').read_text())
    destination = ROOT / f'public/images/{args.collection}'
    destination.mkdir(parents=True, exist_ok=True)
    report = {'sourceBytes': 0, 'files': [], 'settings': {
        'thumb': {'edge': 256, 'avifQuality': 28, 'webpQuality': 45},
        'full': {'edge': 768, 'overviewEdge': 960, 'avifQuality': 38, 'webpQuality': 58},
        'avifSpeed': 4, 'webpMethod': 6,
        'metadata': 'EXIF en overige bronmetadata niet overgenomen',
    }}
    for asset in content['assets']:
        source = args.source_dir / asset['sourceName']
        if not source.exists():
            source = args.source_dir / f'{asset["n"]}.png'
        report['sourceBytes'] += source.stat().st_size
        with Image.open(source) as raw:
            original = ImageOps.exif_transpose(raw).convert('RGB')
        asset['renditions'] = {}
        for size in ('thumb', 'full'):
            edge = 256 if size == 'thumb' else 960 if asset['type'] == 'OVZ' else 768
            scaled = original.copy()
            scaled.thumbnail((edge, edge), Image.Resampling.LANCZOS)
            # Nieuwe pixelscontainer draagt geen metadata van het bronbestand over.
            im = Image.new('RGB', scaled.size)
            im.paste(scaled)
            rendition = {'width': im.width, 'height': im.height}
            for fmt in ('avif', 'webp'):
                quality = report['settings'][size][fmt + 'Quality']
                from io import BytesIO
                buffer = BytesIO()
                im.save(buffer, format=fmt.upper(), quality=quality,
                        **({'speed': 4} if fmt == 'avif' else {'method': 6}))
                payload = buffer.getvalue()
                digest = hashlib.sha256(payload).hexdigest()[:10]
                name = f'{asset["id"]}-{size}-{digest}.{fmt}'
                target = destination / name
                target.write_bytes(payload)
                path = f'images/{args.collection}/{name}'
                rendition[fmt] = path
                report['files'].append({'image': asset['id'], 'size': size,
                    'format': fmt, 'path': path, 'bytes': len(payload)})
            asset['renditions'][size] = rendition
    # In deze taakmap zijn alleen gegenereerde beeldvarianten toegestaan.
    expected = {Path(f['path']).name for f in report['files']}
    for old in destination.iterdir():
        if old.suffix in ('.avif', '.webp') and old.name not in expected:
            old.unlink()
    (ROOT / 'public/data').mkdir(parents=True, exist_ok=True)
    (ROOT / f'public/data/{args.collection}.json').write_text(json.dumps(content,
        ensure_ascii=False, separators=(',', ':')))
    report['totalBytes'] = sum(f['bytes'] for f in report['files'])
    for fmt in ('avif', 'webp'):
        report[fmt + 'Bytes'] = sum(f['bytes'] for f in report['files'] if f['format'] == fmt)
        report[fmt + 'FullBytes'] = sum(f['bytes'] for f in report['files']
            if f['format'] == fmt and f['size'] == 'full')
    (ROOT / 'docs').mkdir(exist_ok=True)
    (ROOT / ('docs/image-sizes.json' if args.collection == 'badkamer' else f'docs/image-sizes-{args.collection}.json')).write_text(json.dumps(report, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != 'files'}, indent=2))

if __name__ == '__main__':
    main()
