"""ENCODE THE FRAME SEQUENCE TO A GIF, AND MEASURE IT.

    python brand/signature/encode.py <frames-dir> <out.gif> [options]
      --colors N     palette size            (default 128)
      --dither none|fs                       (default none)
      --scale N      downscale factor on the way out (default 1)

WHY THIS AND NOT JUST FFMPEG. Two reasons, both worth real bytes.

1. VARIABLE FRAME DELAYS. The animation is deliberately still for about
   1.9s of its 4.8s cycle. ffmpeg emits one frame per tick regardless, so
   that stillness costs ~38 identical frames. GIF stores a delay per frame,
   so a run of identical frames can collapse into ONE frame held for the
   length of the run. That is lossless — the frames are byte-identical, it
   is verified below, not assumed — and it is where most of the saving
   comes from.

2. ONE PALETTE, CHOSEN OVER THE WHOLE CLIP. A per-frame palette makes the
   flat near-black background shift colour slightly between frames, which
   reads as a faint shimmer across the entire card.

ON DITHERING. Default is none. With a global palette the background maps
exactly and needs no dithering at all; error diffusion would only be doing
work in the small glows, and there it crawls between frames — the noise
pattern changes even where the pixels did not, which both looks like
static and defeats the frame-differencing that keeps the file small.

ON CENTISECONDS. GIF stores delays in hundredths of a second. A frame rate
whose period is not a whole number of centiseconds cannot be represented,
so it gets rounded and the loop quietly runs at a different speed than
intended — 18fps is 5.55cs and becomes 6cs, i.e. 16.7fps and a 4.8s loop
that actually takes 5.2s. This refuses to guess and fails instead.
"""
import sys, os, json, subprocess
from PIL import Image, ImageSequence

def arg(name, default=None):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def load(src):
    man = json.load(open(os.path.join(src, "manifest.json")))
    names = sorted(f for f in os.listdir(src) if f.startswith("f") and f.endswith(".png"))
    return man, [Image.open(os.path.join(src, n)).convert("RGB") for n in names]

def collapse(frames, ms_per_frame):
    """Runs of identical frames become one frame with a longer delay.

    Delays are MILLISECONDS, because that is the unit Pillow's `duration`
    takes even though GIF itself stores centiseconds. Passing centiseconds
    here silently produced a file whose frames all carried a 0 delay —
    every viewer then falls back to its own minimum and the animation runs
    at several times its intended speed. verify() below now reads the
    written file back and refuses to let that pass again."""
    out, delays = [], []
    for im in frames:
        if out and im.tobytes() == out[-1].tobytes():
            delays[-1] += ms_per_frame
        else:
            out.append(im); delays.append(ms_per_frame)
    return out, delays


def verify(path, want_ms, want_frames):
    """Read the written GIF back and check it says what we meant.

    Checks the timing survived the round trip, that it loops forever, and
    that no frame carries a 0 delay."""
    im = Image.open(path)
    delays = [fr.info.get("duration", 0) for fr in ImageSequence.Iterator(im)]
    got = sum(delays)
    if len(delays) != want_frames:
        sys.exit(f"VERIFY FAILED: wrote {want_frames} frames, file has {len(delays)}")
    if min(delays) <= 0:
        sys.exit(f"VERIFY FAILED: {sum(1 for d in delays if d <= 0)} frames have a 0 delay "
                 f"— the GIF will play at the viewer's minimum, not at the authored rate")
    if abs(got - want_ms) > 5:
        sys.exit(f"VERIFY FAILED: loop is {got}ms, intended {want_ms}ms")
    if im.info.get("loop", None) != 0:
        sys.exit(f"VERIFY FAILED: loop count is {im.info.get('loop')!r}, must be 0 (forever)")
    return got, delays

METHODS = {
    "median":   Image.Quantize.MEDIANCUT,
    "coverage": Image.Quantize.MAXCOVERAGE,
    "octree":   Image.Quantize.FASTOCTREE,
}

BG = (2, 8, 13)                                     # --black, the card ground

# The scene's whole colour vocabulary: brand colours composited over the
# card at the alphas the renderer actually uses. Reserving entries for
# these is the difference between the brand's orange and something near it.
#
# The frost and muted ramps are dense not because the design uses that many
# tints but because ANTIALIASING walks every value between a glyph and the
# card. A sparse frost ramp left a hole around 0.68, and the nearest entry
# median-cut had left over was a green: the wordmark's grey edge pixels
# decoded green. Edges are most of the visible surface of small type.
VOCAB = [
    ("#F1F5F2", [1, .92, .84, .75, .66, .55, .45, .35,
                 .26, .18, .13, .10, .07, .035]),       # --frost: type, rules, grid
    ("#38E6A2", [1, .85, .7, .55, .4, .28, .18, .1]),   # --signal
    ("#9FF0CE", [1, .85, .7, .55, .4, .25, .12]),       # the mark's node
    ("#2FBF8F", [1, .88, .74, .6, .45, .3, .16]),       # the mark's arc
    ("#FF7A3D", [1, .85, .7, .55, .4, .28, .18, .1]),   # --action
    ("#8FA6A0", [.6, .52, .45, .38, .3, .24, .2, .16, .13, .08]),   # --muted-dark
]

def encode_error(frames, gif_path):
    """How far the DECODED GIF is from the frames that went in.

    Two earlier versions of this check were wrong in instructive ways, and
    both would have passed a bad file or failed a good one.

    Asserting an exact brand colour is PRESENT in the palette fails on a
    correct file: the renderer never draws the action packet at alpha 1.0,
    so pure #FF7A3D never occurs and the unused entry is rightly dropped.

    Comparing every frame's colours against `Image.open(gif).getpalette()`
    is worse, because that returns only the GLOBAL palette — which comes
    from frame 0, the resting frame, which contains no orange at all.
    Pillow gives the moving frames their own local palettes, so the orange
    was fine and the check was reading the wrong table.

    Decoding the file and diffing it against the source sidesteps every
    assumption about how the palette is stored. It measures the artifact
    itself: what a viewer will see versus what was drawn."""
    import numpy as np
    # float32: a squared channel difference reaches 65025 and silently
    # wraps negative in int16, turning the distance into NaN rather than
    # into a wrong number you might notice.
    worst, worst_at, all_d = 0.0, None, []
    for i, fr in enumerate(ImageSequence.Iterator(Image.open(gif_path))):
        if i >= len(frames):
            break
        got = np.asarray(fr.convert("RGB"), dtype=np.float32)
        src = np.asarray(frames[i].convert("RGB"), dtype=np.float32)
        d = np.sqrt(((got - src) ** 2).sum(2))
        all_d.append(d.ravel())
        m = float(d.max())
        if m > worst:
            y, x = np.unravel_index(int(d.argmax()), d.shape)
            worst, worst_at = m, (i, int(x), int(y),
                                  tuple(int(v) for v in src[y, x]),
                                  tuple(int(v) for v in got[y, x]))
    d = np.concatenate(all_d)
    return {"mean": float(d.mean()), "p999": float(np.percentile(d, 99.9)),
            "max": worst, "over20": int((d > 20).sum()), "n": int(d.size),
            "worst_at": worst_at}

def _mix(hexc, a):
    n = int(hexc[1:], 16)
    c = ((n >> 16) & 255, (n >> 8) & 255, n & 255)
    return tuple(round(BG[i] + (c[i] - BG[i]) * a) for i in range(3))

def reserved_entries():
    """Exact palette entries for the brand vocabulary, deduplicated."""
    seen, out = set(), []
    for col in [BG] + [_mix(h, a) for h, alphas in VOCAB for a in alphas]:
        if col not in seen:
            seen.add(col); out.append(col)
    return out

def build_palette(frames, colors, method):
    """One palette over the whole clip.

    Sampling every frame into a single tall strip and quantising that is
    slower than quantising one frame, and it is the only way the palette
    sees the colours that exist for two frames in the middle of the arc
    sweep. Those are exactly the colours whose loss shows.

    METHOD MATTERS MORE THAN SIZE HERE, and not in the obvious direction.
    The clip is 87% one near-black and 99.9% of its pixels fit in about
    1900 colours, so the population is a few very dense clusters rather
    than a spread. MAXCOVERAGE spends its entries covering the colour
    space evenly regardless of how many pixels are there, which starved
    the dense near-blacks: the background grid came back olive and, at 64
    entries, the muted-green outbound rail came back BLUE. MEDIANCUT
    splits by population, so the entries land where the pixels actually
    are.

    BUT POPULATION ALONE GETS THE BRAND WRONG. The action packet is the
    only orange in the piece: it exists for 17 of 120 frames, a few dozen
    pixels each. By population it rounds to nothing, and pure MEDIANCUT
    duly rendered the brand's #FF7A3D as a dull tan. Importance is not the
    same as area. So the vocabulary is reserved FIRST — exact entries for
    every brand colour at the alphas the renderer uses — and median-cut is
    only asked for the remainder, which is antialiasing intermediates and
    genuinely is a population question."""
    w, h = frames[0].size
    strip = Image.new("RGB", (w, h * len(frames)))
    for i, im in enumerate(frames):
        strip.paste(im, (0, i * h))

    fixed = reserved_entries()[:colors]
    auto = strip.quantize(colors=max(2, colors - len(fixed)), method=METHODS[method])
    flat = auto.getpalette() or []
    entries = fixed + [tuple(flat[i:i + 3]) for i in range(0, len(flat), 3)]
    entries = entries[:colors]
    while len(entries) < colors:
        entries.append(BG)                       # harmless duplicate padding

    pal = Image.new("P", (1, 1))
    pal.putpalette([v for c in entries for v in c])
    return pal, fixed

def main():
    src, out = sys.argv[1], sys.argv[2]
    colors = int(arg("--colors", 256))
    dither_name = arg("--dither", "none")
    down = float(arg("--scale", 1))
    method = arg("--method", "median")
    dither = Image.Dither.NONE if dither_name == "none" else Image.Dither.FLOYDSTEINBERG

    man, frames = load(src)
    fps = man["fps"]
    ms = 1000.0 / fps
    if abs(ms / 10 - round(ms / 10)) > 1e-6:
        sys.exit(f"REFUSING: {fps}fps is {ms:.3f}ms per frame, which is not a whole "
                 f"number of centiseconds and cannot be stored in a GIF. "
                 f"Use 20, 25, 12.5 or 10 fps.")
    ms = int(round(ms))

    if down != 1:
        w, h = frames[0].size
        size = (int(w / down), int(h / down))
        frames = [im.resize(size, Image.LANCZOS) for im in frames]

    kept, delays = collapse(frames, ms)
    pal, fixed = build_palette(kept, colors, method)
    quant = [im.quantize(palette=pal, dither=dither) for im in kept]

    quant[0].save(out, save_all=True, append_images=quant[1:],
                  duration=delays, loop=0, optimize=True, disposal=1)
    got_ms, _ = verify(out, sum(delays), len(kept))

    # Gate on the distribution, not on the single worst pixel. The worst
    # pixel is always some antialiased blend of two greens on one edge —
    # gating on it just makes the build fail on noise. Mean and p99.9 are
    # what a viewer actually perceives.
    st = encode_error(kept, out)
    if st["mean"] > 3.0 or st["p999"] > 16:
        f, x, y, src, got = st["worst_at"]
        sys.exit(f"VERIFY FAILED: quantisation error mean={st['mean']:.2f} "
                 f"p99.9={st['p999']:.1f} (limits 3.0 / 16). Worst: frame {f} "
                 f"pixel ({x},{y}) drawn {src}, decodes {got}")

    size_kb = os.path.getsize(out) / 1024
    print(f"{os.path.basename(out):34s} {size_kb:7.1f} KB  "
          f"{quant[0].size[0]}x{quant[0].size[1]}  "
          f"{len(kept):3d} frames (from {len(frames)})  "
          f"{got_ms/1000:.2f}s  {colors}c ({len(fixed)} reserved)  "
          f"err mean={st['mean']:.2f} p99.9={st['p999']:.1f} max={st['max']:.0f}")
    return size_kb

if __name__ == "__main__":
    main()
