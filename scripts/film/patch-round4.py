# Round 4: the artifacts the broad hunt measured. Apply AFTER patch-round3.py
# (two governor edits anchor on round 3's rewritten block).
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

# ============================================================ THE ARTIFACTING
# 1. The scene was rendering with NO ANTIALIASING AT ALL. EffectComposer builds
# its own render targets and only passes `type`, so both ping-pong buffers were
# samples:0; the renderer's own antialias:true bought a multisampled default
# framebuffer that only ever receives the OutputPass fullscreen quad, which has
# no interior edges to antialias. Every thin line in the film - the constellation
# edges, the pane silhouettes, the spine - was a hard one-pixel staircase that
# snapped a whole pixel at a time as the camera moved. That is the crawl.
# Measured on the Arc 140V: thin-line neighbour/peak coverage 0.114 (i.e. none);
# with samples:4, 0.679, and the worst per-pixel jump for one camera step fell
# from 121 levels to 70, while overall image sharpness changed by -2.6%.
rep("""var composer = new NV3.EffectComposer(renderer);""",
"""/* An explicit multisampled target: EffectComposer otherwise builds samples:0
   buffers and the whole film renders with no antialiasing (the renderer's own
   antialias flag only covers the final fullscreen quad, which has no edges).
   HalfFloatType is EffectComposer's own default and must stay - the bloom's
   threshold-zero trick depends on the HDR buffer. EffectComposer clones this for
   its second buffer, and setSize/setPixelRatio preserve `samples`. */
var composer = new NV3.EffectComposer(renderer,
  new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 }));""",
    "composer: 4x MSAA")

rep("""new T.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });""",
"""new T.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: 'high-performance' });""",
    "renderer: drop the inert antialias flag")

# 2. The film grain re-randomises every pixel every frame and is ~10x oversized
# for a dither, so on an otherwise still scene it is the entire frame-to-frame
# pixel churn - constant fizz that reads as "artifacting". Overlay blending in
# linear HDR also makes it scale with luminance, so it is loudest in the mint
# highlights and quietest in the near-blacks where banding actually lives.
rep("""      ' vec3 col = mix(c.rgb, o, 0.15);',""",
"""      ' vec3 col = mix(c.rgb, o, 0.03);', /* was 0.15: a ~10x oversized dither that
        re-randomised every pixel every frame, which on a still scene is 100% of
        the visible churn. 0.03 still breaks up banding without the fizz. */""",
    "grain: dither, not fizz")

# ================================================================ THE GLITCHING
# 3. The governor could only ever go DOWN. Its recovery thresholds are absolute
# milliseconds BELOW the 60Hz vsync interval: `dtMs <= 15` and `p90 < 13` against
# a healthy frame of ~16.7ms. Measured: 0.0% of rAF intervals on a blank page in
# this browser are <= 15ms. So calmMs reset every frame and never reached 4000,
# the film degraded on the first hiccup and stayed degraded for the whole visit.
# Thresholds are now relative to the fastest frame the display has produced,
# which is its refresh interval - correct on 60, 90 and 120Hz alike.
rep("""  win: [], calmMs: 0, canUp: false, chain: false, hist: []
};""",
"""  win: [], calmMs: 0, canUp: false, chain: false, hist: [],
  base: 17.5 /* the display's refresh interval, learned from the fastest frame seen */
};""", "governor: baseline field")

rep("""GOV.calmMs = dtMs <= 15 ? GOV.calmMs + dtMs : 0;""",
"""/* rAF is quantised to the display's refresh interval, so absolute millisecond
   thresholds below it can never be met: on a 60Hz panel every healthy frame is
   ~16.7ms and `dtMs <= 15` was never true. Learn the interval instead. */
    if (dtMs > 6 && dtMs < GOV.base) GOV.base = dtMs;
    var govUp = GOV.base * 1.12, govDown = GOV.base * 1.45;
    GOV.calmMs = dtMs <= govUp ? GOV.calmMs + dtMs : 0;""",
    "governor: learn the refresh interval")

rep("""        if (p90 > 19 && curT < 4) {""",
"""        if (p90 > govDown && curT < 4) {""", "governor: relative down edge")

rep("""        } else if (p90 < 13 && GOV.calmMs > 4000 && GOV.canUp && curT > 0) {""",
"""        } else if (p90 < govUp && GOV.calmMs > 4000 && GOV.canUp && curT > 0) {""",
    "governor: relative up edge")

# ===================================================== COST: never need to step
# 4. The spine tube was 245,760 triangles - 58-64% of every frame - for a tube
# whose world radius is 0.55 units, a few pixels on screen. 96 radial segments on
# a thread, and the stroke-draw reveal happens in the fragment shader so the
# whole mesh is vertex-shaded and rasterized every frame regardless of how little
# of it is drawn.
rep("""new T.TubeGeometry(spineCurve, 1280, 0.55, 96, false)""",
"""new T.TubeGeometry(spineCurve, 640, 0.55, 24, false) /* was 1280x96 = 245,760
  triangles, 58-64% of every frame, for a 0.55-unit-radius thread. 640 rings over
  ~335 units is one every half unit, which the neck swell still resolves. */""",
    "spine tube: 8x fewer triangles")

rep("""  var tg = new T.TubeGeometry(tailCurve, 64, 0.55, 96, false);""",
"""  /* same radial count as the spine or the silhouette steps at the junction */
  var tg = new T.TubeGeometry(tailCurve, 24, 0.55, 24, false);""",
    "tail tube: match the spine")

# 5. The orb was two separate 12,096-triangle spheres (mesh + rim shell), and the
# opaque one is re-drawn by the transmission pass, so three submissions a frame.
rep("""var orb = new T.Mesh(new T.SphereGeometry(2.3, 96, 64), markMat);""",
"""/* one geometry, shared with the rim shell below: same sphere, half the memory,
   and the driver reuses the binding across the draws */
var ORB_GEO = new T.SphereGeometry(2.3, 64, 48);
var orb = new T.Mesh(ORB_GEO, markMat);""", "orb: shared, lighter geometry")

rep("""var orbRim = new T.Mesh(new T.SphereGeometry(2.3, 96, 64), makeRimMat());""",
"""var orbRim = new T.Mesh(ORB_GEO, makeRimMat());""", "orb rim: share the geometry")

# 6. 117 node dots at 352 triangles each, drawn twice per frame (they are opaque,
# so the transmission pass redraws them): 82,368 triangles for dots a few pixels
# across.
rep("""var nodeGeo = new T.SphereGeometry(0.62, 16, 12);""",
"""var nodeGeo = new T.SphereGeometry(0.62, 10, 8); /* 352 -> 176 tris each, and
  these are opaque so the transmission pass draws all 117 a second time */""",
    "node dots: lighter spheres")

# ============================================================== THE LABEL SNAP
# 7. Pane labels were suppressed by a hard multiply gated on whether a story
# sentence had the 'on' CLASS, but the sentence itself fades over 600ms. So the
# suppression appeared and vanished in ONE frame while the sentence was still
# half-faded: a ~16x brightness snap on every label at every beat boundary.
rep("""var copyRect = null;
  for (var i = 0; i < copyNodes.length; i++) {
    if (copyNodes[i].classList.contains('on')) { copyRect = copyNodes[i].getBoundingClientRect(); break; }
  }""",
"""/* Gate on the sentence's PAINTED opacity, not its class. The class flips in one
   frame but the sentence cross-fades over 600ms, so a class-gated suppression
   snapped every label ~16x in brightness at each beat boundary. */
  var copyRect = null, copyA = 0;
  for (var i = 0; i < copyNodes.length; i++) {
    var ca = parseFloat(getComputedStyle(copyNodes[i]).opacity) || 0;
    if (ca > 0.01) { copyA = ca; copyRect = copyNodes[i].getBoundingClientRect(); break; }
  }""", "labels: continuous copy gate")

rep("""          y0 < copyRect.bottom + 12 && y1 > copyRect.top - 12) L.o *= 0.06;""",
"""          y0 < copyRect.bottom + 12 && y1 > copyRect.top - 12) L.o *= (1 - 0.94 * copyA);""",
    "labels: suppression follows the fade")

open('scripts/film/source.html', 'w', encoding='utf-8', newline='').write(s)
print(f"\nsource.html: {n0} -> {len(s)}")
