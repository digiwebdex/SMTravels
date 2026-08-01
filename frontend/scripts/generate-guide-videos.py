#!/usr/bin/env python3
"""Generate short on-site Hajj/Umrah guide videos (image slideshows + Bangla/EN titles)."""
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "videos"
OUT.mkdir(parents=True, exist_ok=True)

FONT_B = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSansBengali-Bold.ttf", 44)
FONT_R = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf", 26)
FONT_S = ImageFont.truetype("/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf", 18)

IMGS = [
    ROOT / "public/hero-journey.jpg",
]
W, H = 960, 540

VIDEOS = [
    dict(
        id="hajj-guide", file="hajj-complete-guide.mp4", poster="hajj-complete-guide.jpg",
        duration_label="0:15", titleBn="হজ্ব সম্পূর্ণ গাইড — এ থেকে জেড", titleEn="Complete Hajj Guide A to Z",
        category="Hajj",
        slides=[
            ("হজ্ব সম্পূর্ণ গাইড", "Complete Hajj Guide — A to Z"),
            ("নিয়ত ও ইহরাম", "Intention (Niyyah) and Ihram"),
            ("আরাফাত — হজ্বের মূল", "Arafat — the heart of Hajj"),
            ("তাওয়াফ ও সাঈ", "Tawaf and Sai"),
            ("SM Travels — বিশ্বস্ত সাথী", "Trusted Hajj partner since 2011"),
        ],
    ),
    dict(
        id="umrah-steps", file="umrah-steps.mp4", poster="umrah-steps.jpg",
        duration_label="0:15", titleBn="উমরাহ পদক্ষেপসমূহ", titleEn="Umrah Step by Step",
        category="Umrah",
        slides=[
            ("উমরাহ ধাপে ধাপে", "Umrah — Step by Step"),
            ("১. ইহরাম বাঁধুন", "1. Enter the state of Ihram"),
            ("২. তাওয়াফ করুন", "2. Perform Tawaf around Kaaba"),
            ("৩. সাঈ ও হালক/কসর", "3. Sai then Halq or Qasr"),
            ("SM Travels উমরাহ প্যাকেজ", "Book Umrah with SM Travels"),
        ],
    ),
    dict(
        id="saudi-visa", file="saudi-visa.mp4", poster="saudi-visa.jpg",
        duration_label="0:15", titleBn="সৌদি ভিসা প্রক্রিয়া", titleEn="Saudi Visa Process",
        category="Visa",
        slides=[
            ("সৌদি ভিসা গাইড", "Saudi Visa Guide"),
            ("পাসপোর্ট ও ছবি প্রস্তুত", "Prepare passport and photos"),
            ("অনলাইন আবেদন / এজেন্সি", "Apply online or via agency"),
            ("অনুমোদন ও ভ্রমণ", "Approval then travel ready"),
            ("SM Travels ভিসা সহায়তা", "Visa support by SM Travels"),
        ],
    ),
    dict(
        id="air-ticket-tips", file="air-ticket-tips.mp4", poster="air-ticket-tips.jpg",
        duration_label="0:15", titleBn="বিমান টিকিট কেনার টিপস", titleEn="Air Ticket Buying Tips",
        category="Air Ticket",
        slides=[
            ("বিমান টিকিট টিপস", "Smart Air Ticket Tips"),
            ("আগে বুক করুন", "Book early for better fares"),
            ("সরাসরি ফ্লাইট খুঁজুন", "Prefer direct or fewer stops"),
            ("নমনীয় তারিখ রাখুন", "Keep travel dates flexible"),
            ("SM Travels এয়ার টিকেট", "Book tickets with SM Travels"),
        ],
    ),
    dict(
        id="packing-checklist", file="packing-checklist.mp4", poster="packing-checklist.jpg",
        duration_label="0:15", titleBn="হজ্ব-উমরাহ প্যাকিং চেকলিস্ট", titleEn="Hajj-Umrah Packing Checklist",
        category="Travel Tips",
        slides=[
            ("প্যাকিং চেকলিস্ট", "Packing Checklist"),
            ("ইহরাম ও আরামদায়ক জুতা", "Ihram and comfortable sandals"),
            ("ওষুধ ও প্রসাধনী", "Medicines and toiletries"),
            ("ডকুমেন্ট ও কপি", "Passport, visa and copies"),
            ("SM Travels প্রস্তুতি গাইড", "Travel ready with SM Travels"),
        ],
    ),
    dict(
        id="ihram-how", file="ihram-how.mp4", poster="ihram-how.jpg",
        duration_label="0:15", titleBn="ইহরাম কিভাবে পরবেন", titleEn="How to Wear Ihram",
        category="Umrah",
        slides=[
            ("ইহরাম পরার নিয়ম", "How to Wear Ihram"),
            ("গুסל ও পরিচ্ছন্নতা", "Ghusl and cleanliness"),
            ("দুই কাপড় (পুরুষ)", "Two white sheets for men"),
            ("নিয়ত ও তালবিয়া", "Niyyah and Talbiyah"),
            ("SM Travels গাইডেন্স", "Guided by SM Travels"),
        ],
    ),
]


def cover(img_path: Path) -> Image.Image:
    im = Image.open(img_path).convert("RGB")
    r = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * r), int(im.height * r)), Image.Resampling.LANCZOS)
    left = (im.width - W) // 2
    top = (im.height - H) // 2
    return im.crop((left, top, left + W, top + H))


def slide_frame(bg_path: Path, bn: str, en: str) -> Image.Image:
    base = cover(bg_path).convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    d.rectangle((0, 0, W, H), fill=(4, 30, 66, 110))
    d.rectangle((0, H // 2 - 90, W, H // 2 + 90), fill=(4, 30, 66, 150))
    bb = d.textbbox((0, 0), bn, font=FONT_B)
    d.text(((W - (bb[2] - bb[0])) // 2, H // 2 - 70), bn, font=FONT_B, fill=(255, 255, 255, 255))
    eb = d.textbbox((0, 0), en, font=FONT_R)
    d.text(((W - (eb[2] - eb[0])) // 2, H // 2 + 10), en, font=FONT_R, fill=(241, 90, 36, 255))
    d.text((28, H - 40), "SM Travels International", font=FONT_S, fill=(255, 255, 255, 220))
    return Image.alpha_composite(base, overlay).convert("RGB")


def make_video(v: dict) -> None:
    tmp = Path(tempfile.mkdtemp(prefix="smv2_"))
    frames: list[Path] = []
    for i, (bn, en) in enumerate(v["slides"]):
        frame = slide_frame(IMGS[i % len(IMGS)], bn, en)
        fp = tmp / f"f{i:02d}.jpg"
        frame.save(fp, quality=85, optimize=True)
        frames.append(fp)

    Image.open(frames[0]).save(OUT / v["poster"], quality=85)

    listfile = tmp / "list.txt"
    lines: list[str] = []
    for fp in frames:
        lines.append(f"file '{fp}'")
        lines.append("duration 3")
    lines.append(f"file '{frames[-1]}'")
    listfile.write_text("\n".join(lines), encoding="utf-8")

    out = OUT / v["file"]
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listfile),
        "-vf", "fps=24,format=yuv420p",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "30",
        "-movflags", "+faststart", str(out),
    ]
    print("gen", out.name, flush=True)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:])
        raise SystemExit(f"ffmpeg failed for {out.name}")
    print(f"  ok {out.stat().st_size // 1024} KB", flush=True)


def main() -> None:
    for img in IMGS:
        if not img.exists():
            raise SystemExit(f"missing image: {img}")
    for v in VIDEOS:
        make_video(v)
    catalog = [
        {k: v[k] for k in ("id", "file", "poster", "duration_label", "titleBn", "titleEn", "category")}
        for v in VIDEOS
    ]
    (OUT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print("DONE", [p.name for p in sorted(OUT.glob("*.mp4"))], flush=True)


if __name__ == "__main__":
    main()
