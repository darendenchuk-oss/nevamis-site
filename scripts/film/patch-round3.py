# Round 3: the interaction-path artifacts, all measured by the artifact hunt.
# Applies to the canonical film source only; run scripts/film/compose.py after.
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

# ---------------------------------------------------------------- 1. THE BIG ONE
# Measured: hovering a pane holds the render loop chaining (S.hold) while leaving
# the apply gate SHUT (scroll still, no ground ripple, no card). Every 30-frame
# window then bumped GOV.pending AGAIN because it read pending as the current
# tier, so debt stacked 0->1->2->3->4 invisibly. The next gate opening - a click,
# or merely sliding off the pane - applied all of it in ONE frame with the camera
# stationary: DPR 1.5->1.0, all six panes swapping to a flat matcap, geometry and
# sprites cut. That single frame IS the "glitch when you hover or click a pane".
rep("""      var curT = GOV.pending >= 0 ? GOV.pending : GOV.applied;
      if (p90 > 19 && curT < 4) {
        GOV.pending = curT + 1; GOV.win.length = 0; GOV.calmMs = 0; GOV.canUp = true;
      } else if (p90 < 13 && GOV.calmMs > 4000 && GOV.canUp && curT > 0) {
        GOV.pending = curT - 1; GOV.canUp = false; GOV.win.length = 0; GOV.calmMs = 0;
      }""",
"""      /* A queued step must LAND before another is measured. This block used to
         read GOV.pending as "the current tier", so while the apply gate was shut
         it stacked: hovering a pane keeps the loop chaining (S.hold) but leaves
         the gate closed (scroll still, ground ripple ended by the pane hover,
         no card open), and each fresh window bumped pending again, 0->1->2->3->4
         with GOV.applied still 0. The next gate opening then applied FOUR tiers
         in a single frame against a stationary camera. Measured on an Arc 140V:
         160 pointer moves inside one pane, then one click -> hist [{from:0,to:4}].
         One step may be in flight at a time; the ladder still reaches T4, but
         only ever one visible increment at a time. */
      if (GOV.pending >= 0) { GOV.win.length = 0; GOV.calmMs = 0; }
      else {
        var curT = GOV.applied;
        if (p90 > 19 && curT < 4) {
          GOV.pending = curT + 1; GOV.win.length = 0; GOV.calmMs = 0; GOV.canUp = true;
        } else if (p90 < 13 && GOV.calmMs > 4000 && GOV.canUp && curT > 0) {
          GOV.pending = curT - 1; GOV.canUp = false; GOV.win.length = 0; GOV.calmMs = 0;
        }
      }""", "governor: no stacked tier debt")

# The apply itself costs a double-render frame (the deliberate anti-black-flicker
# re-render). Measuring it would immediately queue the next step and cascade.
rep("""    applyTier(GOV.pending); GOV.pending = -1;""",
"""    applyTier(GOV.pending); GOV.pending = -1;
    GOV.win.length = 0; GOV.calmMs = 0; /* the swap frame is not evidence about the next tier */""",
    "governor: swap frame not measured")

# ------------------------------------------------------- 2. STUCK HOVER (2 lenses)
# pointerleave cleared hoverBrain but never hoverPane, so moving the cursor off the
# canvas (onto the header, the open card, or out of the window) left one slab
# boosted, swollen and re-aiming at the camera for the rest of the session - and
# re-aiming every frame means the loop never fully rests.
rep("""canvas.addEventListener('pointerleave', function(){
  if (hoverBrain) { hoverBrain = null; ensureAnim(); }
  if (S.groundRippleEnd) S.groundRippleEnd();
});""",
"""canvas.addEventListener('pointerleave', function(){
  /* hoverPane was missing here: the pointer leaving the canvas (onto the site
     header, an open card, or out of the window) left the slab pinned at full
     boost and tilt, re-slerping toward the camera every frame, forever. The
     touch path already cleared both via touchRest(); this mirrors it. */
  if (hoverPane) { hoverPane = null; ensureAnim(); }
  if (hoverBrain) { hoverBrain = null; ensureAnim(); }
  if (S.groundRippleEnd) S.groundRippleEnd();
});""", "pointerleave clears hoverPane")

# ------------------------------------------------------------ 3. GLASS COST/FRAME
# DoubleSide on a transmissive material makes three.js draw the slab a second time
# into the transmission target, with a second MSAA resolve and a second mipmap
# chain rebuild, every frame. The slabs are closed boxes seen from outside, so the
# back faces were never visible.
rep("""    attenuationDistance: 30,
    side: T.DoubleSide
  });
}""",
"""    attenuationDistance: 30,
    /* FrontSide, not DoubleSide: these are closed boxes seen from outside, and a
       double-sided TRANSMISSIVE material costs a second draw, a second MSAA
       resolve and a second mipmap-chain rebuild of the refraction target on
       every frame the slab is in frustum. */
    side: T.FrontSide
  });
}""", "glass: FrontSide")

# The refraction buffer holds a near-empty background (three.js renders only the
# OPAQUE list into it, and this scene is almost entirely additive/transparent), so
# full resolution buys nothing behind roughness 0.06 / thickness 2.6.
rep("""renderer.outputColorSpace = T.SRGBColorSpace;""",
"""renderer.outputColorSpace = T.SRGBColorSpace;
/* The transmission pass renders only the OPAQUE list into its target, and this
   scene is almost entirely additive: the buffer the glass refracts holds the
   background and a couple of meshes. Full resolution costs two MSAA resolves and
   two mipmap chains per frame to blur something nearly empty. */
renderer.transmissionResolutionScale = 0.5;""", "glass: half-res refraction")

# ----------------------------------------------------------- 4. LOOP TAIL ON HOVER
# The cursor wake decayed to a 0.002 cutoff at rate 2.4 - 2.6s of chained
# full-rate frames after every twitch across a slab. At the cutoff the wake
# uniform is 0.002*0.11 = 0.00022, i.e. visually zero long before it stops
# costing frames.
rep("""        e.wAmp *= Math.exp(-dt * 2.4);
        if (e.wAmp < 0.002) {""",
"""        e.wAmp *= Math.exp(-dt * 3.6);
        if (e.wAmp < 0.02) { /* 0.02*0.11 = 0.0022 of wake: visually zero, and it
                                stops holding the render loop ~1.5s sooner */""",
    "wake: shorter tail")

# ------------------------------------------------------- 5. PARALLAX PINS THE LOOP
# smx/smy chase mx/my exponentially and never arrive, and needMore() keeps the
# WHOLE film rendering until they do - so any mouse movement anywhere (including
# over an open card) cost ~1.8s of full-rate rendering afterwards.
rep("""  smx += (mx - smx) * Math.min(1, dt * 4);
  smy += (my - smy) * Math.min(1, dt * 4);""",
"""  smx += (mx - smx) * Math.min(1, dt * 4);
  smy += (my - smy) * Math.min(1, dt * 4);
  /* an exponential never arrives, and needMore() keeps the entire film rendering
     until it does. Snap at the threshold needMore() tests so the chase ends in a
     frame instead of trailing the cursor for a second and a half. */
  if (Math.abs(mx - smx) < 0.004) smx = mx;
  if (Math.abs(my - smy) < 0.004) smy = my;""", "parallax: terminate the easer")

rep("""         Math.abs(mx - smx) > 0.0015 || Math.abs(my - smy) > 0.0015;""",
"""         Math.abs(mx - smx) > 0.004 || Math.abs(my - smy) > 0.004;""",
    "parallax: matching threshold")

rep("""  window.addEventListener('mousemove', function(e){
    mx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    my = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    requestRender();
  }, { passive: true });""",
"""  window.addEventListener('mousemove', function(e){
    /* with a card open the camera is already under the look override and the
       pointer is on the card, not the world: parallax there is invisible motion
       that re-chains the render loop on every mouse event. */
    if (document.body.classList.contains('card-open')) return;
    mx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    my = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    requestRender();
  }, { passive: true });""", "parallax: idle while a card is open")

# ------------------------------------------------------------- 6. HOVER RIM FLASH
# uBoost * 1.4 on an already near-white additive shell clipped through the bloom,
# so hover read as a hard white bar rather than a rim brightening.
# Anchored on the LIQUID rim (the pane shells). The plain makeRimMat() shares the
# same line but belongs to the orb, whose uBoost is never driven by hover.
rep("""      ' vec3 n = lqBend(normalize(vN), vLqT, vLqB, vLqQ, vLqW, uLqN); vec3 v = normalize(vV);',
      ' float f = getFresnel(n, v, 1.2);',
      ' vec3 rim = mintRamp(f * 3.0 + uCameraY * 0.02);',
      ' float b = pow(f, 2.2) * (1.0 + uBoost * 1.4);',""",
"""      ' vec3 n = lqBend(normalize(vN), vLqT, vLqB, vLqQ, vLqW, uLqN); vec3 v = normalize(vV);',
      ' float f = getFresnel(n, v, 1.2);',
      ' vec3 rim = mintRamp(f * 3.0 + uCameraY * 0.02);',
      ' float b = pow(f, 2.2) * (1.0 + uBoost * 0.7);',""",
    "rim: hover brightens instead of clipping")

# --------------------------------------------------------- 7. RAYCAST ON EVERY MOVE
# Every pointer move walked the display geometry: 2,432 triangles per slab. The hit
# test already accepts the undisplaced slab, and geoLo is the same box with the
# same per-face UVs (BoxGeometry UVs are 0..1 per face at any segment count), so
# hits[0].uv - which drives the ripple - is unchanged.
rep("""  pn.geoLo = new T.BoxGeometry(gd.w, gd.h, 0.9, 14, 10, 1); /* T4: tessellation halved */
});""",
"""  pn.geoLo = new T.BoxGeometry(gd.w, gd.h, 0.9, 14, 10, 1); /* T4: tessellation halved */
  /* raycast the low-poly twin, not the display slab: every pointer move walked
     2,432 triangles per pane on the main thread. Same box, same per-face UVs, so
     hits[0].uv (which places the ripple) is identical. */
  pn.mesh.raycast = (function(proxy){
    return function(raycaster, intersects){
      var shown = this.geometry;
      this.geometry = proxy;
      T.Mesh.prototype.raycast.call(this, raycaster, intersects);
      this.geometry = shown;
    };
  })(pn.geoLo);
});""", "raycast: low-poly proxy")

# ------------------------------------------------- 8. FORCED LAYOUT WHILE CARD OPEN
# card.offsetWidth was read inside the per-frame hook for as long as a card was
# open - a forced synchronous layout every frame, for a value that changes only
# on resize.
rep("""                  (card.offsetWidth / Math.max(1, window.innerWidth)) * 0.5;""",
"""                  (cardW / Math.max(1, window.innerWidth)) * 0.5;""",
    "card width: use the cache")

rep("""var prevFocus = null, scrollYAtOpen = 0, progScroll = false;""",
"""var prevFocus = null, scrollYAtOpen = 0, progScroll = false;
/* card.offsetWidth was read inside the per-frame hook, forcing a synchronous
   layout on every frame a card was open. It changes only on resize. */
var cardW = 0;""", "card width: declare cache")

rep("""  card.classList.add('on');
  document.body.classList.add('card-open');""",
"""  card.classList.add('on');
  document.body.classList.add('card-open');
  cardW = card.offsetWidth || 0;""", "card width: fill on open")

rep("""cardClose.addEventListener('click', closeCard);""",
"""cardClose.addEventListener('click', closeCard);
/* the cached card width is layout, so it is only ever stale after a resize */
window.addEventListener('resize', function(){ if (openPane) cardW = card.offsetWidth || 0; });""",
    "card width: refresh on resize")

open('scripts/film/source.html', 'w', encoding='utf-8', newline='').write(s)
print(f"\nsource.html: {n0} -> {len(s)}")
