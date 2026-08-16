"""
motion.py -- quantitative MOTION AND RHYTHM measurement for the NEVAMIS film work.

Measures, per sampled frame, the mean absolute pixel difference from the
previous frame (MAD) as a motion-magnitude proxy, then reports the rhythm:
still moments, bursts, still-fraction, and whether the big structural event
is a ramp or a hard cut.

Two videos are compared on an IDENTICAL pixel grid (320x180 luma) so that the
1280x720 reference and the 1920x1080 proof are directly comparable.

Outputs (all under this qc/ directory):
    motion-report.txt   human-readable numeric report
    motion-ref.csv      per-frame curve, reference, 10fps
    motion-ours.csv     per-frame curve, our proof, 10fps
    motion-ref-30.csv   per-frame curve, reference, native 30fps

Run:  python "C:/Users/daren/nevamis-site/film-v2/production/qc/motion.py"
"""

import os
import subprocess
import sys

import numpy as np
from PIL import Image

QC = r"C:/Users/daren/nevamis-site/film-v2/production/qc"
REF = r"C:/Users/daren/Downloads/Sentient-Desk-reference-clean.mp4"
OURS = r"C:/Users/daren/nevamis-site/film-v2/production/NEVAMIS-V2-PROOF-10s.mp4"

# Common analysis grid. Both sources are 16:9, so 320x180 preserves aspect and
# removes resolution as a confound between the two films.
GRID_W, GRID_H = 320, 180

# ---------------------------------------------------------------------------
# STILL THRESHOLD JUSTIFICATION
# ---------------------------------------------------------------------------
# MAD is in 8-bit luma levels (0..255). We call a frame STILL when MAD < 2.0.
# Rationale, in order of strength:
#   1. Perceptual: we measure gamma-encoded 8-bit luma code values, which are
#      already approximately perceptually uniform by construction (that is what
#      the sRGB/BT.709 transfer function is for). So one threshold is valid in
#      both the luminance-224 white half and the luminance-4 dark half -- a
#      2-code-value change is about equally (in)visible in each. A uniform
#      2/255 shift is ~0.8% of range, at or below the Weber limit for a smooth
#      gradient field on an SDR display.
#   2. Codec floor: h264 at these bitrates dithers flat areas by +/-1 level,
#      so MAD in a genuinely frozen shot never reads exactly 0. The measured
#      per-file noise floor (p01 of MAD) is printed in the report; the 2.0
#      threshold sits above both files' floors, so it does not mistake
#      compression noise for motion.
#   3. Robustness: the report also prints still-fraction at 1.0 / 2.0 / 3.0 /
#      5.0 so no conclusion depends on one arbitrary cut point.
STILL = 2.0
STILL_LADDER = (1.0, 2.0, 3.0, 5.0)


def extract(path, tag, fps):
    """Decode to greyscale frames on the common grid; return float32 array."""
    out = os.path.join(QC, f"_mo_{tag}")
    os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        os.remove(os.path.join(out, f))
    subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path,
         "-vf", f"fps={fps},scale={GRID_W}:{GRID_H}:flags=area,format=gray",
         "-y", os.path.join(out, "%05d.png")],
        check=True,
    )
    files = sorted(os.listdir(out))
    frames = np.empty((len(files), GRID_H, GRID_W), dtype=np.float32)
    for i, fn in enumerate(files):
        frames[i] = np.asarray(Image.open(os.path.join(out, fn)).convert("L"),
                               dtype=np.float32)
    return frames


def curve(frames, fps):
    """Per-frame motion metrics. Returns list of dicts, one per frame pair."""
    rows = []
    for i in range(1, len(frames)):
        a, b = frames[i - 1], frames[i]
        d = np.abs(b - a)
        mad = float(d.mean())
        # Field brightness matters: the same relative motion in a luminance-220
        # white field produces a far larger absolute MAD than in a luminance-9
        # dark field. Normalising by the local mean level gives a contrast-fair
        # motion figure so the bright half is not credited with fake energy.
        level = float((a.mean() + b.mean()) / 2.0)
        rel = mad / max(level, 1.0) * 100.0          # % of local level
        rows.append({
            "t": i / fps,
            "mad": mad,
            "rel": rel,
            "level": level,
            "p99": float(np.percentile(d, 99)),      # localised motion peak
            "frac_moved": float((d > 4).mean()) * 100.0,  # % of pixels changed
        })
    return rows


def runs_below(rows, thr):
    """Longest contiguous run of frames with mad < thr. Returns (len_s, t0,t1)."""
    best = (0.0, 0.0, 0.0)
    i = 0
    while i < len(rows):
        if rows[i]["mad"] < thr:
            j = i
            while j + 1 < len(rows) and rows[j + 1]["mad"] < thr:
                j += 1
            dur = rows[j]["t"] - rows[i]["t"]
            if dur > best[0]:
                best = (dur, rows[i]["t"], rows[j]["t"])
            i = j + 1
        else:
            i += 1
    return best


def write_csv(rows, path):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("t_s,mad,rel_pct_of_level,mean_level,p99_abs_diff,pct_pixels_changed\n")
        for r in rows:
            fh.write(f"{r['t']:.4f},{r['mad']:.4f},{r['rel']:.4f},"
                     f"{r['level']:.2f},{r['p99']:.2f},{r['frac_moved']:.2f}\n")


OUT = []


def say(s=""):
    print(s)
    OUT.append(s)


def sparkline(rows, key="mad", log=False):
    """ASCII motion curve, one column per sample."""
    blocks = " .:-=+*#%@"
    vals = [r[key] for r in rows]
    if log:
        # log scale so a single 221-MAD cut does not flatten the whole curve
        v = [np.log10(1.0 + x) for x in vals]
        hi = max(v) or 1.0
        return "".join(blocks[min(9, int(x / hi * 9.999))] for x in v)
    hi = max(vals) or 1.0
    return "".join(blocks[min(9, int(x / hi * 9.999))] for x in vals)


def passages(rows, thr, above, min_dur=0.3):
    """Contiguous runs where mad is above/below thr, lasting >= min_dur."""
    out = []
    i = 0
    test = (lambda v: v >= thr) if above else (lambda v: v < thr)
    while i < len(rows):
        if test(rows[i]["mad"]):
            j = i
            while j + 1 < len(rows) and test(rows[j + 1]["mad"]):
                j += 1
            dur = rows[j]["t"] - rows[i]["t"]
            if dur >= min_dur:
                out.append({
                    "t0": rows[i]["t"], "t1": rows[j]["t"], "dur": dur,
                    "peak": max(r["mad"] for r in rows[i:j + 1]),
                })
            i = j + 1
        else:
            i += 1
    return out


def rhythm(name, rows, burst_thr=5.0):
    """How the film alternates between rest and motion -- its pulse."""
    stills = passages(rows, STILL, above=False, min_dur=0.4)
    bursts = passages(rows, burst_thr, above=True, min_dur=0.0)
    total = rows[-1]["t"]
    say()
    say(f"  RHYTHM STRUCTURE  (rest passages >=0.4s, bursts MAD>={burst_thr})")
    say(f"    {len(stills)} distinct rest passages "
        f"({len(stills)/total*10:.1f} per 10s of runtime), "
        f"{len(bursts)} distinct bursts ({len(bursts)/total*10:.1f} per 10s)")
    if stills:
        d = [s["dur"] for s in stills]
        say(f"    rest passage durations: "
            f"{', '.join(f'{x:.1f}s' for x in d)}  "
            f"(median {np.median(d):.1f}s, total {sum(d):.1f}s)")
    if bursts:
        say(f"    {'burst':>5} | {'window':>16} | {'dur':>6} | {'peak MAD':>9}")
        for k, b in enumerate(bursts, 1):
            say(f"    {k:>5} | {b['t0']:6.2f}s -> {b['t1']:5.2f}s | "
                f"{b['dur']:5.2f}s | {b['peak']:9.2f}")
        onsets = [b["t0"] for b in bursts]
        if len(onsets) > 1:
            gaps = np.diff(onsets)
            say(f"    gaps between burst onsets: "
                f"{', '.join(f'{g:.1f}s' for g in gaps)}  "
                f"(median {np.median(gaps):.1f}s)")
    return stills, bursts


def profile(name, rows, fps, segments):
    mads = np.array([r["mad"] for r in rows])
    say()
    say("=" * 78)
    say(f"{name}   |  {len(rows)+1} samples @ {fps}fps  |  "
        f"{rows[-1]['t']:.1f}s of runtime")
    say("=" * 78)
    say(f"  MAD  mean {mads.mean():6.2f}   median {np.median(mads):6.2f}   "
        f"p01(noise floor) {np.percentile(mads,1):5.2f}   "
        f"p95 {np.percentile(mads,95):6.2f}   max {mads.max():7.2f}")
    say(f"  peak-to-median ratio (burstiness): "
        f"{mads.max()/max(np.median(mads),1e-6):.1f}x")
    say()
    say("  STILL FRACTION (share of sampled frame-pairs below threshold)")
    for thr in STILL_LADDER:
        frac = float((mads < thr).mean()) * 100.0
        secs = float((mads < thr).sum()) / fps
        mark = "  <-- headline threshold" if thr == STILL else ""
        say(f"    MAD < {thr:4.1f} : {frac:5.1f}%  ({secs:5.2f}s of "
            f"{len(mads)/fps:.2f}s){mark}")
    dur, t0, t1 = runs_below(rows, STILL)
    say(f"    longest unbroken still passage: {dur:.2f}s  ({t0:.2f}s -> {t1:.2f}s)")
    say()
    say("  MOTION CURVE, LOG SCALE (one column per sample; log so one huge cut")
    say("  does not flatten everything else)")
    say(f"    {sparkline(rows, log=True)}")
    say(f"    ^0s{' ' * max(0, len(rows) - 10)}{rows[-1]['t']:.0f}s")
    say()
    say("  MOTION CURVE, LINEAR (shows how totally one event dominates)")
    say(f"    {sparkline(rows)}")
    say()
    say("  PER-SEGMENT")
    say(f"    {'segment':>14} | {'mean MAD':>8} | {'max MAD':>8} | "
        f"{'mean rel%':>9} | {'still%':>6} | {'mean level':>10}")
    for a, b, label in segments:
        sel = [r for r in rows if a <= r["t"] < b]
        if not sel:
            continue
        m = np.array([r["mad"] for r in sel])
        say(f"    {label:>14} | {m.mean():8.2f} | {m.max():8.2f} | "
            f"{np.mean([r['rel'] for r in sel]):9.2f} | "
            f"{float((m < STILL).mean())*100:5.1f}% | "
            f"{np.mean([r['level'] for r in sel]):10.1f}")
    say()
    say("  TOP 8 MOTION EVENTS")
    say(f"    {'t':>7} | {'MAD':>8} | {'x median':>8} | {'%px moved':>9} | {'level':>7}")
    for r in sorted(rows, key=lambda r: -r["mad"])[:8]:
        say(f"    {r['t']:6.2f}s | {r['mad']:8.2f} | "
            f"{r['mad']/max(np.median(mads),1e-6):7.1f}x | "
            f"{r['frac_moved']:8.1f}% | {r['level']:7.1f}")
    rhythm(name, rows)
    return mads


def approach(rows, t_cut):
    """Does motion accelerate into the big event, or fall away before it?"""
    say()
    say("    APPROACH TO THE CUT (does motion accelerate into it?)")
    say(f"    {'window before cut':>20} | {'mean MAD':>8} | {'max MAD':>8}")
    for a, b, lab in [(8.0, 5.0, "-8.0s..-5.0s"), (5.0, 3.0, "-5.0s..-3.0s"),
                      (3.0, 2.0, "-3.0s..-2.0s"), (2.0, 1.0, "-2.0s..-1.0s"),
                      (1.0, 0.5, "-1.0s..-0.5s"), (0.5, 0.0, "-0.5s..cut")]:
        sel = [r for r in rows if t_cut - a <= r["t"] < t_cut - b]
        if not sel:
            continue
        m = np.array([r["mad"] for r in sel])
        say(f"    {lab:>20} | {m.mean():8.2f} | {m.max():8.2f}")
    say("    -> monotonically FALLING means the film goes QUIET before the cut;")
    say("       rising would mean an accelerating ramp.")
    say()


def event_anatomy(rows, fps, t_event, name, pre=2.0, post=1.5):
    """Is the big event a ramp or a hard cut? Print the frames around it."""
    say()
    say(f"  EVENT ANATOMY around {t_event:.2f}s  ({name}, {fps}fps sampling)")
    say(f"    {'t':>7} | {'MAD':>8} | {'level':>7} | {'%px moved':>9} | bar")
    sel = [r for r in rows if t_event - pre <= r["t"] <= t_event + post]
    if not sel:
        say("    (no samples in window)")
        return
    hi = max(r["mad"] for r in sel) or 1.0
    for r in sel:
        bar = "#" * int(r["mad"] / hi * 44)
        say(f"    {r['t']:6.2f}s | {r['mad']:8.2f} | {r['level']:7.1f} | "
            f"{r['frac_moved']:8.1f}% | {bar}")
    peak = max(sel, key=lambda r: r["mad"])
    before = [r for r in sel if r["t"] < peak["t"]]
    after = [r for r in sel if r["t"] > peak["t"]]
    say()
    if before:
        b = np.array([r["mad"] for r in before])
        say(f"    {pre:.1f}s BEFORE the peak: mean MAD {b.mean():.2f}, "
            f"max {b.max():.2f}, trend "
            f"{'rising' if len(b) > 2 and np.polyfit(range(len(b)), b, 1)[0] > 0.05 else 'flat'}"
            f" (slope {np.polyfit(range(len(b)),b,1)[0]:+.3f} MAD/sample)")
    say(f"    PEAK at {peak['t']:.2f}s: MAD {peak['mad']:.2f}, "
        f"{peak['frac_moved']:.1f}% of pixels changed")
    if before:
        say(f"    peak / mean-of-preceding ratio: {peak['mad']/max(b.mean(),1e-6):.1f}x"
            "   (>10x with a flat lead-in == HARD CUT, not an acceleration)")
    if after:
        a = np.array([r["mad"] for r in after])
        say(f"    {post:.1f}s AFTER the peak: mean MAD {a.mean():.2f} "
            f"(decay to {a[-1]:.2f} by {after[-1]['t']:.2f}s)")


def main():
    say("NEVAMIS film -- MOTION AND RHYTHM measurement")
    say(f"analysis grid {GRID_W}x{GRID_H} greyscale; MAD = mean |frame_n - frame_n-1| in 8-bit luma levels")
    say(f"STILL threshold = MAD < {STILL} (see justification in this script's header)")

    # ---- reference, 10 fps -------------------------------------------------
    ref = curve(extract(REF, "ref10", 10), 10)
    write_csv(ref, os.path.join(QC, "motion-ref.csv"))
    ref_mads = profile("REFERENCE  Sentient Desk (37.7s)", ref, 10, [
        (0.0, 3.0, "0-3s"),
        (3.0, 8.0, "3-8s"),
        (8.0, 14.0, "8-14s"),
        (14.0, 15.5, "14-15.5s"),
        (15.5, 20.0, "15.5-20s"),
        (20.0, 26.0, "20-26s"),
        (26.0, 33.0, "26-33s"),
        (33.0, 99.0, "33-end"),
    ])

    # ---- reference, native 30 fps, to resolve cut vs ramp -------------------
    ref30 = curve(extract(REF, "ref30", 30), 30)
    write_csv(ref30, os.path.join(QC, "motion-ref-30.csv"))
    peak30 = max(ref30, key=lambda r: r["mad"])
    say()
    say("-" * 78)
    say("NATIVE 30fps PASS ON THE REFERENCE (resolves cut-vs-ramp at frame level)")
    say("-" * 78)
    say(f"  global max MAD {peak30['mad']:.2f} at {peak30['t']:.3f}s "
        f"(frame {int(round(peak30['t']*30))})")
    event_anatomy(ref30, 30, peak30["t"], "reference", pre=1.5, post=0.7)

    # how many frames does the transition take?
    idx = ref30.index(peak30)
    win = ref30[max(0, idx - 6): idx + 7]
    over = [r for r in win if r["mad"] > peak30["mad"] * 0.25]
    say()
    say(f"    frames within 25% of peak magnitude: {len(over)} "
        f"({len(over)/30*1000:.0f} ms) -> "
        f"{'single-frame HARD CUT' if len(over) <= 2 else 'multi-frame transition'}")
    approach(ref30, peak30["t"])

    say(f"    mean level before peak: "
        f"{np.mean([r['level'] for r in ref30 if peak30['t']-1.0 <= r['t'] < peak30['t']]):.1f}"
        f"   -> after peak: "
        f"{np.mean([r['level'] for r in ref30 if peak30['t'] < r['t'] <= peak30['t']+1.0]):.1f}")

    # ---- ours, 10 fps ------------------------------------------------------
    ours = curve(extract(OURS, "ours10", 10), 10)
    write_csv(ours, os.path.join(QC, "motion-ours.csv"))
    our_mads = profile("OURS  NEVAMIS-V2-PROOF-10s (10.0s)", ours, 10, [
        (0.0, 2.0, "0-2s"),
        (2.0, 3.5, "2-3.5s"),
        (3.5, 5.0, "3.5-5s"),
        (5.0, 7.0, "5-7s"),
        (7.0, 8.5, "7-8.5s"),
        (8.5, 99.0, "8.5-end"),
    ])

    # ---- head-to-head ------------------------------------------------------
    ref_first10 = np.array([r["mad"] for r in ref if r["t"] <= 10.0])
    say()
    say("=" * 78)
    say("HEAD TO HEAD")
    say("=" * 78)
    say(f"  {'metric':<38} | {'REF (full)':>11} | {'REF 0-10s':>11} | {'OURS':>11}")

    def line(label, f):
        say(f"  {label:<38} | {f(ref_mads):>11} | {f(ref_first10):>11} | "
            f"{f(our_mads):>11}")

    line("mean MAD", lambda m: f"{m.mean():.2f}")
    line("median MAD", lambda m: f"{np.median(m):.2f}")
    line("max MAD", lambda m: f"{m.max():.2f}")
    line("p95 MAD", lambda m: f"{np.percentile(m,95):.2f}")
    line("burstiness (max / median)", lambda m: f"{m.max()/max(np.median(m),1e-6):.1f}x")
    line(f"still fraction (MAD<{STILL})",
         lambda m: f"{float((m<STILL).mean())*100:.1f}%")
    line("dynamic range of motion (max-min)",
         lambda m: f"{m.max()-m.min():.2f}")
    say()
    say(f"  our median MAD is "
        f"{np.median(our_mads)/max(np.median(ref_first10),1e-6):.1f}x the reference's "
        f"first-10s median -- we never stop moving")
    say(f"  our burstiness is "
        f"{(our_mads.max()/max(np.median(our_mads),1e-6)) / (ref_mads.max()/max(np.median(ref_mads),1e-6)):.2f}x "
        f"the reference's -- ratio <1 means our film has no punctuation")
    say(f"  our biggest event is {our_mads.max():.2f} MAD vs the reference's "
        f"{ref_mads.max():.2f} MAD ({ref_mads.max()/max(our_mads.max(),1e-6):.1f}x weaker)")

    # --- cadence -----------------------------------------------------------
    say()
    say("  CADENCE (how often something happens)")
    rb = passages(ref, 5.0, above=True, min_dur=0.0)
    ob = passages(ours, 5.0, above=True, min_dur=0.0)
    rgaps = np.diff([b["t0"] for b in rb])
    ogaps = np.diff([b["t0"] for b in ob])
    say(f"    reference: {len(rb)} bursts in {ref[-1]['t']:.1f}s "
        f"= 1 every {ref[-1]['t']/len(rb):.1f}s, median onset gap {np.median(rgaps):.1f}s")
    say(f"    ours     : {len(ob)} bursts in {ours[-1]['t']:.1f}s "
        f"= 1 every {ours[-1]['t']/len(ob):.1f}s, median onset gap {np.median(ogaps):.1f}s")
    say(f"    -> our events fire {np.median(rgaps)/max(np.median(ogaps),1e-6):.1f}x "
        f"more often than the reference's; each one therefore reads as noise, not as an event")

    # --- is the big event a TONAL transformation or just texture churn? -----
    say()
    say("  IS THE BIGGEST EVENT A TRANSFORMATION OR JUST CHURN?")
    say(f"    {'film':<12} | {'peak MAD':>8} | {'%px moved':>9} | "
        f"{'level before':>12} | {'level after':>11} | {'level delta':>11}")
    for label, rows_, fps_ in (("reference", ref, 10), ("ours", ours, 10)):
        pk = max(rows_, key=lambda r: r["mad"])
        before = [r["level"] for r in rows_ if pk["t"] - 0.6 <= r["t"] < pk["t"]]
        after = [r["level"] for r in rows_ if pk["t"] < r["t"] <= pk["t"] + 0.6]
        lb, la = np.mean(before), np.mean(after)
        say(f"    {label:<12} | {pk['mad']:8.2f} | {pk['frac_moved']:8.1f}% | "
            f"{lb:12.1f} | {la:11.1f} | {la-lb:+11.1f}")
    say("    -> a real structural event changes the EXPOSURE of the frame, not")
    say("       just which pixels are lit. Ours moves pixels without moving tone.")

    # --- reference: bright half vs dark half --------------------------------
    say()
    say("  REFERENCE: BRIGHT HALF vs DARK HALF (motion behaves differently in each)")
    say(f"    {'half':<22} | {'mean MAD':>8} | {'still%':>7} | "
        f"{'mean rel%':>9} | {'mean level':>10}")
    for a, b, lab in ((0.0, 15.2, "bright 0-15.2s"), (15.3, 99.0, "dark 15.3-37.6s")):
        sel = [r for r in ref if a <= r["t"] < b]
        m = np.array([r["mad"] for r in sel])
        say(f"    {lab:<22} | {m.mean():8.2f} | "
            f"{float((m<STILL).mean())*100:6.1f}% | "
            f"{np.mean([r['rel'] for r in sel]):9.2f} | "
            f"{np.mean([r['level'] for r in sel]):10.1f}")
    say("    -> the dark half moves LESS in absolute terms but far more relative")
    say("       to its own level: small bright forms on black, not a churning field.")

    with open(os.path.join(QC, "motion-report.txt"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(OUT) + "\n")

    # tidy up the decoded frame caches so qc/ does not accumulate thousands of pngs
    for tag in ("ref10", "ref30", "ours10"):
        d = os.path.join(QC, f"_mo_{tag}")
        if os.path.isdir(d):
            for f in os.listdir(d):
                os.remove(os.path.join(d, f))
            os.rmdir(d)

    print(f"\nwrote {QC}/motion-report.txt, motion-ref.csv, motion-ref-30.csv, motion-ours.csv")


if __name__ == "__main__":
    sys.exit(main())
