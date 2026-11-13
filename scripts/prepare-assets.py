"""Encode local image masters for the static site; all exports omit metadata."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import json
import sys
from datetime import date

root = Path(__file__).resolve().parents[1]
content = json.load(sys.stdin)
before = after = 0
for source in sorted((root / "assets").rglob("*.png")):
    if "originals" in source.parts:
        continue
    image = ImageOps.exif_transpose(Image.open(source))
    alpha = source.name == "heart-bear.png"
    image = image.convert("RGBA" if alpha else "RGB")
    if alpha:
        image.thumbnail((256, 256), Image.Resampling.LANCZOS)
    elif "collage-baby" not in source.name:
        image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    clean = Image.new(image.mode, image.size)
    clean.paste(image)
    destination = source.with_suffix(".webp" if source.parent.name == "art" else ".jpg")
    if source.parent.name == "art":
        clean.save(destination, "WEBP", quality=82, method=6)
    else:
        clean.save(destination, "JPEG", quality=88 if "collage-baby" in source.name else 84, optimize=True, progressive=True)
    before += source.stat().st_size
    after += destination.stat().st_size

# A graphic preview card, using the existing stationery artwork and content file.
background = Image.open(root / "assets/art/linen-letter-background.webp").convert("RGB")
card = ImageOps.fit(background, (1200, 630), Image.Resampling.LANCZOS)
wash = Image.new("RGBA", card.size, (243, 239, 242, 120))
card = Image.alpha_composite(card.convert("RGBA"), wash).convert("RGB")
draw = ImageDraw.Draw(card)
ink = "#392532"
fonts = Path("C:/Windows/Fonts")
def font(name, size):
    return ImageFont.truetype(str(fonts / name), size)
draw.rectangle((58, 48, 1142, 582), outline="#A79B96", width=2)
draw.text((600, 175), "Happy anniversary,", font=font("georgia.ttf", 70), fill=ink, anchor="mm")
draw.text((600, 285), content["meta"]["partnerName"], font=font("georgiai.ttf", 112), fill=ink, anchor="mm")
anniversary = date.fromisoformat(content["meta"]["anniversaryDate"])
date_label = f"{anniversary.day} {anniversary.strftime('%B %Y')}"
draw.text((600, 410), date_label, font=font("georgia.ttf", 30), fill=ink, anchor="mm")
draw.text((600, 485), content["meta"]["shareTagline"], font=font("georgia.ttf", 26), fill=ink, anchor="mm")
card.save(root / "assets/og-image.jpg", "JPEG", quality=88, optimize=True)
print(json.dumps({"original_bytes": before, "optimized_bytes": after, "reduction_percent": round((1-after/before)*100, 1) if before else 0}))
