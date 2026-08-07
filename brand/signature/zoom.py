"""Zoom into one region of one moment across several GIFs, side by side.

    python brand/signature/zoom.py <out.png> <x> <y> <w> <h> <at-seconds> <gif>...

Palette size is a judgement about banding in the glows, and banding is not
visible at 100% on a 480px card. This pulls the same region out of each
candidate at the same instant and blows it up so the decision is made by
looking rather than by preferring the bigger number.
"""
import sys
from PIL import Image, ImageDraw, ImageSequence

def frame_at(path, seconds):
    """GIF delays vary per frame here, so walk the timeline rather than
    indexing — frame N is not at N/fps once still runs are collapsed."""
    acc = 0.0
    last = None
    for fr in ImageSequence.Iterator(Image.open(path)):
        last = fr.convert("RGB")
        acc += fr.info.get("duration", 50) / 1000.0
        if acc > seconds:
            return last
    return last

def main():
    out = sys.argv[1]
    x, y, w, h = (int(v) for v in sys.argv[2:6])
    at = float(sys.argv[6])
    gifs = sys.argv[7:]

    Z = 3
    tiles = []
    for g in gifs:
        im = frame_at(g, at).crop((x, y, x + w, y + h))
        tiles.append((im.resize((w * Z, h * Z), Image.NEAREST), g.split("/")[-1]))

    tw, th = tiles[0][0].size
    pad, lab = 12, 18
    sheet = Image.new("RGB", (tw + pad * 2, (th + lab + pad) * len(tiles) + pad), (18, 18, 20))
    d = ImageDraw.Draw(sheet)
    yy = pad
    for im, name in tiles:
        d.text((pad, yy), name, fill=(150, 160, 158))
        sheet.paste(im, (pad, yy + lab))
        yy += th + lab + pad
    sheet.save(out)
    print(f"{out} {sheet.size}")

main()
