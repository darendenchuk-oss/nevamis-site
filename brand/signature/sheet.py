"""Contact sheet of the key beats, for looking at rather than guessing at.

    python brand/signature/sheet.py <frames-dir> <out.png> [--fps 18]

Each tile is labelled with its time and what that beat is supposed to be
doing, so a review pass can say "the converge beat is weak" instead of
"frame 40 looks off".
"""
import sys, os, json
from PIL import Image, ImageDraw

BEATS = [
    (0.00, "REST / frame 0"),
    (1.20, "INGEST  async"),
    (2.05, "IN FLIGHT"),
    (2.45, "CONVERGE  sync"),
    (2.70, "ARRIVE + pulse"),
    (2.95, "ANSWER  arc sweep"),
    (3.45, "ACT  outbound"),
    (3.90, "LAND  surge"),
    (4.35, "SETTLE"),
]

def main():
    src, out = sys.argv[1], sys.argv[2]
    fps = float(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else 18.0
    man = json.load(open(os.path.join(src, "manifest.json")))
    n = man["frames"]

    beats = BEATS
    if "--times" in sys.argv:
        # A dense strip through one phase, for judging motion rather than pose.
        beats = [(float(x), "") for x in sys.argv[sys.argv.index("--times") + 1].split(",")]

    tiles = []
    for t, label in beats:
        i = min(n - 1, round(t * fps))
        im = Image.open(os.path.join(src, f"f{i:04d}.png")).convert("RGB")
        tiles.append((im, f"{t:.2f}s  {label}"))

    w, h = tiles[0][0].size
    pad, lab = 14, 20
    sheet = Image.new("RGB", (w + pad * 2, (h + lab + pad) * len(tiles) + pad), (18, 18, 20))
    d = ImageDraw.Draw(sheet)
    y = pad
    for im, label in tiles:
        d.text((pad, y), label, fill=(150, 160, 158))
        sheet.paste(im, (pad, y + lab))
        y += h + lab + pad
    sheet.save(out)
    print(f"{out}  {sheet.size[0]}x{sheet.size[1]}")

main()
