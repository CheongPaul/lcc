"""Package the existing LCC logo as opaque, mask-safe install icons (Pillow)."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
logo = Image.open(root / '6acda41a7ec5a.png').convert('RGBA')
out = root / 'docs/images/app'
out.mkdir(parents=True, exist_ok=True)
for name, size in [('icon-192.png', 192), ('icon-512.png', 512),
                   ('icon-maskable-512.png', 512), ('apple-touch-icon.png', 180)]:
    canvas = Image.new('RGB', (size, size), '#0c1014')
    mark = logo.copy()
    mark.thumbnail((round(size * .68), round(size * .40)), Image.Resampling.LANCZOS)
    canvas.paste(mark, ((size - mark.width) // 2, (size - mark.height) // 2), mark)
    canvas.save(out / name, optimize=True)
