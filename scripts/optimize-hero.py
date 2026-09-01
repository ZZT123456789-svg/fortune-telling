from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "daowen-hero-bg.png"
TARGET = ROOT / "assets" / "daowen-hero-bg.webp"
MAX_WIDTH = 1920


with Image.open(SOURCE) as image:
    image = image.convert("RGB")
    if image.width > MAX_WIDTH:
        height = round(image.height * MAX_WIDTH / image.width)
        image = image.resize((MAX_WIDTH, height), Image.Resampling.LANCZOS)
    image.save(TARGET, "WEBP", quality=78, method=6)

print(f"{SOURCE.name}: {SOURCE.stat().st_size:,} bytes")
print(f"{TARGET.name}: {TARGET.stat().st_size:,} bytes")
