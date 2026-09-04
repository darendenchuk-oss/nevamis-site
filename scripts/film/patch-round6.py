# Round 6: the nav rail's destinations. Two dead buttons on desktop, and an
# out-of-order rail on narrow frames. Both measured, both unambiguous defects.
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
s = open('scripts/film/source.html', encoding='utf-8').read()
n0 = len(s)

def rep(old, new, what):
    global s
    c = s.count(old)
    assert c == 1, f"{what}: {c} occurrences"
    s = s.replace(old, new)
    print("ok:", what)

# 1. A station that never enters a portrait frustum scored nothing at all and fell
#    back to "0.05 past whatever the previous station got" - which is why on a
#    phone the GROW and PLANS buttons landed at p 0.49 and 0.52, mid-film, nowhere
#    near either pane. Keep the narrow gate as the preference, but remember the
#    ungated best as a real fallback.
rep("""    var best = -1, bs = 1e9;
    for (var i = 8; i <= 232; i++) {""",
"""    var best = -1, bs = 1e9, rBest = -1, rBs = 1e9;
    for (var i = 8; i <= 232; i++) {""", "viewP: relaxed fallback state")

rep("""      if (narrow) {
        /* test against the REAL gaze base (apply() looks 0.11 ahead), horizontally */
        var lp2 = S.camCurve.getPoint(Math.min(1, p + 0.11));
        var fx = lp2.x - cp.x, fz = lp2.z - cp.z;
        var fl = Math.hypot(fx, fz), al = Math.hypot(vA.x, vA.z);
        if (fl > 1e-4 && al > 1e-4 && (fx * vA.x + fz * vA.z) / (fl * al) < cosH) continue;
      }
      var score = d * (2 - dot);
      if (score < bs) { bs = score; best = p; }""",
"""      var score = d * (2 - dot);
      /* the ungated best: same distance and facing tests, without the narrow
         horizontal gate. A station that never enters a portrait frustum should
         still get a REAL position rather than an arbitrary offset from its
         neighbour, which is what stranded GROW and PLANS mid-film on a phone. */
      if (score < rBs) { rBs = score; rBest = p; }
      if (narrow) {
        /* test against the REAL gaze base (apply() looks 0.11 ahead), horizontally */
        var lp2 = S.camCurve.getPoint(Math.min(1, p + 0.11));
        var fx = lp2.x - cp.x, fz = lp2.z - cp.z;
        var fl = Math.hypot(fx, fz), al = Math.hypot(vA.x, vA.z);
        if (fl > 1e-4 && al > 1e-4 && (fx * vA.x + fz * vA.z) / (fl * al) < cosH) continue;
      }
      if (score < bs) { bs = score; best = p; }""", "viewP: track the ungated best")

rep("""    if (best >= 0) pn.viewP = Math.min(0.94, Math.max(0.02, best - 0.02));""",
"""    if (best < 0) best = rBest; /* never in a narrow frustum: use the ungated pick */
    if (best >= 0) pn.viewP = Math.min(0.94, Math.max(0.02, best - 0.02));""",
    "viewP: use the fallback")

# 2. Normalise the finished set. Two independent ways it came out broken:
#    - the 0.02 lead-in is subtracted AFTER the forward-only search, so a station
#      could land BEHIND its predecessor (measured on a phone: 0.4633 then 0.4592,
#      i.e. tapping a later station travelled backwards);
#    - both endgame gateposts score best at the last sampled point and the 0.94
#      ceiling then collapsed them onto the SAME p, so two of the six rail
#      buttons were dead (measured on desktop: grow 0.94, plans 0.94).
rep("""    else pn.viewP = Math.min(0.94, lastP + 0.05);
    lastP = pn.viewP;
  });
}
}
computeViewPs();""",
"""    else pn.viewP = Math.min(0.94, lastP + 0.05);
    lastP = pn.viewP;
  });
  /* The rail promises six distinct stations in travel order. Guarantee it:
     forward pass opens a minimum gap, and if that runs the last station past the
     ceiling, a backward pass pushes the whole run down off it. Both passes
     together give strictly increasing, at least VP_GAP apart, none above VP_CAP. */
  var VP_GAP = 0.03, VP_CAP = 0.94, k;
  for (k = 1; k < panes.length; k++) {
    if (panes[k].viewP < panes[k - 1].viewP + VP_GAP) panes[k].viewP = panes[k - 1].viewP + VP_GAP;
  }
  if (panes[panes.length - 1].viewP > VP_CAP) {
    panes[panes.length - 1].viewP = VP_CAP;
    for (k = panes.length - 2; k >= 0; k--) {
      if (panes[k].viewP > panes[k + 1].viewP - VP_GAP) panes[k].viewP = panes[k + 1].viewP - VP_GAP;
    }
  }
  for (k = 0; k < panes.length; k++) panes[k].viewP = Math.max(0.02, Math.min(VP_CAP, panes[k].viewP));
}
}
computeViewPs();""", "viewP: distinct and in order")

# 3. Owner decision: tighten the scroll response. The two constants on these lines
#    have different provenance. The lerp is authored feel - the comment names the
#    reference implementation it was copied from - and is KEPT exactly. The
#    ceiling is an undocumented magic number whose real effect was that any
#    gesture past ~436px stopped being proportional to the hand at all and became
#    constant-rate travel: a flick measured as a dead-straight 2.71s ramp. At 0.9
#    a flick crosses in ~1.1s and still cannot teleport.
rep("""  var cap = dt * 0.34;""",
"""  var cap = dt * 0.9; /* owner call 2026-09-04: track the hand. The lerp above is
                         the authored feel and is untouched; this ceiling only
                         stops a violent flick teleporting, and at 0.34 it also
                         flattened every ordinary scroll into constant-rate
                         travel that ran on for seconds after the fingers stopped. */""",
    "scroll: raise the rate ceiling")

open('scripts/film/source.html', 'w', encoding='utf-8', newline='').write(s)
print(f"\nsource.html: {n0} -> {len(s)}")
