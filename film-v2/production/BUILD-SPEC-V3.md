# NEVAMIS PILOT V3 — BUILD SPECIFICATION

**Status:** buildable. This supersedes every prior V2 direction.
**Deliverable:** `C:/Users/daren/nevamis-site/film-v2/production/NEVAMIS-V3-13s.mp4`
**Format:** 1920x1080, 30fps, 396 frames, 13.200s, H.264 CRF 14.
**Concept:** APERTURE (threshold), with grafts from SELVEDGE, ARRIVALS and HALL of LINES.
**Zero paid generation.** Everything renders locally: three.js + headless Chromium
(WebGL2 / ANGLE / SwiftShader) + ffmpeg. Confirmed present on this machine:
ffmpeg 8.1.2, node v24.18.0, python 3.12.10, `@playwright/test` in `nevamis-site`.
three.js is **not** installed and must be vendored (see §Technical build plan, Step 0).

---

## The film in one sentence

A two-bladed slot opens in a blank, near-white, lightless void until it goes utterly
still — and then in **one frame** we are on the far side of it, in a black chamber
where the darkness that lived inside the slot has become a ring of emerald light,
and the door we came through hangs cropped in the corner still catching the last of
the outside.

Three things happen in that chamber, and they are the only three things NEVAMIS does:
it answers the call, it asks the owner's questions, it texts the owner. Nothing is
booked, nothing is scheduled, and nobody appears.

---

## Why the V2 failed (the measured reasons)

Every line below is a measurement, not an opinion. Reference =
`Sentient-Desk-reference-clean.mp4` (37.700s, 1280x720, 30fps).

| Axis | Reference | V2 proof | Verdict |
|---|---|---|---|
| Luminance range used | 2.5 → 220.0 whole-film; **248.2 of 255 inside a single bright frame** | 9.0 → 65.4 (a quarter of the range) | V2 lives in one murky mid band |
| Largest structural event | **−218.1** in one 33ms frame boundary (f456→f457) | −21.1 | ten times too weak |
| Opening chroma | luminance-weighted absolute chroma **5.3–6.0 / 255**; HSV S 4.2% | 31.7% saturation; lum-weighted chroma flat 14–15 | navy **is** colour, so nothing was withheld |
| Anchor value | one flat colour covering **76.0–79.8%** (bright) / 72.1–84.7% (dark) of every frame | modal colour covers **1.7–18.6%** | V2 is gradient everywhere and has no ground |
| Corner agreement | four 96×96 corner patches within **0.2 / 255**, std 0.0000, median \|dL/dx\| = 0.00 | corner patches span **134 units** (TL 17.4, TR 145.0, BL 17.4, BR 11.3) | V2 has a fullscreen gradient the reference does not have |
| Burstiness (peak MAD / median MAD) | **171.3×** | 20.1× | V2 is 8.5× flatter |
| Still fraction (MAD < 2.0) | **68.6%** | 49.5% | V2 never rests |
| Burst cadence | 7 bursts in 37.6s, median onset gap **3.4s** | 5 bursts in 9.9s, median gap 0.4s | V2 fires 7.6× too often, so nothing reads as an event |
| Approach to the cut | **decelerates**: 2.15 → 1.31 → 0.63 → 0.37 → 0.30 MAD over the last 5s | accelerates into its biggest event | V2 destroyed its own contrast ratio |
| Biggest event's tone change | level 224.2 → 4.4 (**Δ −219.8**) | level 65.5 → 40.4 (Δ −25.1) with 93.8% of pixels moving | V2's event is texture churn, not a change of exposure |

**Two corrections to the original diagnosis, both measured, both load-bearing:**

1. **"Colour arrives with the darkness" is false as stated.** The cut frame is
   *achromatic* (max absolute chroma 4/255). Chroma ignites over the following
   **1.2 seconds** and peaks at only 88/255 inside a blob covering **1.28%** of frame.
   Colour arrives as a *delayed second beat*, not with the darkness.
2. **The "76–86% saturation" figure is an HSV artifact at near-zero value.** Measured
   as absolute chroma the dark half is near-achromatic; the reference's final 7 seconds
   are *less* chromatic (lum-weighted 3.4) than its bright opening (5.5). Targeting
   76–86% would build a neon film. **All chroma gates in this spec are
   `(max−min)/255` weighted by luminance, and HSV S is never reported on a frame whose
   mean L is below 20.**

**One correction to the original forensics too.** "The frozen passage is frozen" is
also false: the reference's stillest half-second measures MAD 0.18–0.47 with
0.8–1.6% of pixels changing per frame. **Nothing in the reference is ever
bit-identical to the frame before it.** Bit-identical frames encode as H.264 skip
frames and read as the video pausing. See §Tonal targets, anti-freeze gate.

---

## The world (geometry, scale, materials)

Two places, one object that exists in both. Total scene geometry **under 7,000
triangles**. **Zero `THREE.Light` objects in the entire film.** No shadow maps, no AO,
no fog, no environment map, no ground plane, no props, no figures, no faces.

### World scale

`1 world unit` is arbitrary and deliberately unresolvable — the aperture could be a
200mm slot in card or a 40m door in a wall, and never settling that is the point.
Camera at z = 7.2, vertical fov 34° ⇒ the z=0 plane is **4.401 units tall × 7.824
units wide**, i.e. **245.4 px per world unit** at 1080p. Every screen-space target
below converts through that constant.

### ACT 1 — OUTSIDE (frames 0–179, t 0.000–5.967)

**The field.** `scene.background = Color(0xE7E6E9)` = rgb(231,230,233), HSL 240°,
S 6.5%, L 90.8%. Nothing else. No backdrop plane, no gradient quad, no vignette, no
`THREE.Fog`, no grain texture, no floor. The reference measures median \|dL/dx\|
= exactly 0.00 over >99% of pixels and four corner patches inside 0.2/255; we match
that and the QC gate enforces it.

**THE APERTURE.** Two curved crescent blades sharing **one** `BufferGeometry`:

```
base:      PlaneGeometry(1.9, 2.6, 24, 32)        // 1,536 tris
displace once at build time, per vertex:
  const h = (uv.y);                                // 0 at tip, 1 at head
  pos.z += 0.42 * sin(PI * uv.x) * (0.35 + 0.65*h);   // compound bow
  pos.x *= (0.35 + 0.65*h);                           // taper to a point
geometry.computeVertexNormals();
```

`leafL` uses it directly; `leafR` is the same geometry instance with `scale.x = -1`.
They meet along a vertical seam. Between them: **the slot**.

Per frame, driven by one scalar `open ∈ [0,1]`:

```
leafL.position.x = -(0.06 + 0.52*open);   leafL.rotation.y = -(0.10 + 1.28*open);
leafR.position.x = +(0.06 + 0.34*open);   leafR.rotation.y = +(0.10 + 0.86*open);
```

**The asymmetry is deliberate and load-bearing.** The right blade rotates further
toward edge-on, so it occupies less width. That (a) keeps the object's projected
centroid at the measured (0.435W, 0.555H) while (b) holding the object bbox's right
edge at **x₁ ≤ 0.53W**, which is what structurally reserves the right 47% of frame for
one line of type. `scale` and `position.z` are **never** written — no scale keyframe
exists anywhere in this film. Projected height is therefore invariant (±5%) while
projected width sweeps >2×, which is the measured signature of in-plane-axis rotation
at fixed camera distance and is asserted in QC.

**THE WELL** — visible only through the slot, and the entire black point of Act 1:

| mesh | geometry | z | material | rgb |
|---|---|---|---|---|
| `wellMid` | blade geom, scale 1.06 | −0.55 | `MeshBasicMaterial`, DoubleSide | `#0E241C` (14,36,28) |
| `wellCore` | blade geom, scale 0.92 | −0.95 | `MeshBasicMaterial`, DoubleSide | `#02070A` (2,7,10) |

`#0E241C` is brand emerald `#2FBF8F` darkened to L 10% at S 44%. On a 231-luma field
at ~1.4% coverage it reads as plain black ink. **The emerald is on screen from frame
one and nobody sees it.**

**Depth cue.** One only: the blades' lobes cross in front of each other with a
razor-hard occlusion boundary, straight out of the depth buffer. `side = DoubleSide`,
`renderer.shadowMap.enabled = false`, no AO, no fog, no ground. That deletes the three
most expensive things in a SwiftShader budget while measurably matching the reference
(corner std 0.0000 proves no contact shadow, no cast shadow, no AO touching the field).

### ACT 2 — INSIDE (frames 180–395, t 6.000–13.167)

**The void.** `scene.background = Color(0x010002)` = rgb(1,0,2). Not pure black. The
deliberate +1/+2 blue lift is measured in the reference and it is the same 285°/240°
hue family as the paper. It must cover **≥70%** of every dark frame, and the right
sixth and top sixth of frame must sit at rgb(1,0,2) untouched.

Three things occupy it, and nothing else:

1. **THE DOOR WE CAME THROUGH.** The identical blade `BufferGeometry`, one instance,
   at position `(-3.45, -2.30, 1.35)`, `rotation.y = 0.95` — the exact place a thing
   you had just walked past would be. Cropped by **both** the left and the bottom
   frame edges; projected centroid ≈ (0.17W, 0.78H). It is the only element carrying
   continuity across the cut and it is the entire proof of traversal. Its back face is
   flat-lit to a ceiling of **L=106** at the throat-facing end, **falling to L≈20** at
   the frame edges (see §Light plan — this distance falloff is a required fix; a flat
   L106 slab reads as a poster shape).
2. **THE THROAT.** `TorusGeometry(1.02, 0.016, 6, 220)` = 2,640 tris.
   `rotation.set(-0.34, 0.26, 0.08)` at construction, **frozen**. Radial segments 6 is
   invisible on a tube this thin at this radius. It sits at the screen position where
   the slot's darkest point was one frame earlier.
3. **THE KEY.** One bounded off-frame light lobe at the lower left — the outside,
   still leaking in past the door. It is not a light object; it is analytic, in the
   composite shader (§Light plan).

**Beat geometry** (Act 2 only, added to the same scene, invisible until their beat):

| mesh | geometry | tris | role |
|---|---|---|---|
| `filament` | `PlaneGeometry(0.022, 1.86)`, billboarded | 2 | the circuit closing — the call answered |
| `innerArc` | `TorusGeometry(0.63, 0.011, 6, 160, θ)` same tilt | 1,920 | the qualifying gate |
| `departing` | `PlaneGeometry(0.30, 0.014)` | 2 | the message leaving |
| `typeQuad` | `PlaneGeometry` + CanvasTexture, ortho-placed, depthTest false | 2 | all type, both acts |

**Off-frame crop rule.** In Act 1 everything is fully inside the frame. In Act 2
something is **always** bleeding off an edge (the door). That permanent crop is what
makes the dark half read as a space we are inside rather than a picture we are looking
at, and it is the only place in the film where anything is allowed to leave frame.

---

## The camera journey (time, position, target, focal length, focus distance)

**There is no camera move.** Not a dolly, not an orbit, not a push, not a drift, not a
roll, not an fov animation, not a shake. This is the single largest measurable and
performance decision in the film, and it is not a retreat.

Why, measured: phase correlation of the reference gives its **highest** whole-frame
correlation peaks (0.81–0.89) at shift **exactly (0,0)**; its two dark-half objects'
centroids correlate **negatively** (−0.41 in x, −0.51 in y), which no camera
translation can produce; and at 0.5s lag the correlation peak collapses to 0.06–0.45
with incoherent shifts, which a constant-rate move cannot produce. 100% of the
reference's motion is object motion. Separately, a continuous traversal spreads the
structural event across 10–20 frames and drops its magnitude by an order of magnitude
— which is exactly how V2 got −21 instead of −218.

**The traversal is delivered by the EDIT and registered geometrically, so the eye
completes the move at zero frame cost.**

| t (s) | frames | position | lookAt | fov (v) | 35mm-equiv | focus distance |
|---|---|---|---|---|---|---|
| 0.000–5.967 | 0–179 | (0, 0, 7.200) | (0, 0, 0) | 34.0° | ≈39mm (57.5° horiz) | ∞ — hyperfocal, no CoC term exists |
| 6.000 | 180 | (0, 0, 7.200) | (0, 0, 0) | 34.0° | ≈39mm | ∞ |
| 6.000–13.167 | 180–395 | (0, 0, 7.200) | (0, 0, 0) | 34.0° | ≈39mm | ∞ |

`new THREE.PerspectiveCamera(34, 16/9, 0.1, 100)`, `position.set(0,0,7.2)`,
`lookAt(0,0,0)`, `up = (0,1,0)`, `updateProjectionMatrix()` **once**. One camera
object, shared by both scenes, never written to again.

**No depth of field, no focus rack, anywhere.** Measured: the sharpest 10–90 luminance
transition in the reference is 4px at t=3.6s and **still 4px at t=34.0s** — identical
at both ends of 37.7 seconds, so nothing ever comes into or out of focus. Every DOF /
CoC / bokeh pass is deleted: pure SwiftShader waste for zero measured benefit. All
softness is authored into the material and the bleed chain.

**The geometric registration of the traversal** (this is what makes the cut a journey):

| | last bright frame (f179) | first dark frame (f180) |
|---|---|---|
| the darkness | slot's black core at (0.435W, 0.545H) | throat ring at (0.435W, 0.520H) — a rhyme, 25px higher, not a match |
| the blade | facing us, fully in frame, silhouette framing the slot | same curve, rotated 0.95 rad about Y, at (−3.45,−2.30,1.35), cropped by two edges |
| the ceiling | specular kick, maxL ≈ 252 | type + throat top, maxL ≈ 250 |

The place the darkness was is the place the light now is. The thing that was in front
of us is now beside and behind us. **The audience supplies the move; we spend zero
frames on it.**

**Asserted in QC:** `camera.position` and `camera.quaternion` are bit-identical on all
396 frames. A camera tween that sneaks in is the failure mode this design is least
able to absorb.

---

## The light plan (bright achromatic half, then dark saturated half)

**Zero `THREE.Light` objects exist in this film.** All shading is two hand-written
shaders plus one analytic term in the composite. That is both measurably correct and
the cheapest thing SwiftShader can be asked to do.

### The one mechanism that carries the whole film: polarity

There is **one** optical system, used in both halves, with its sign flipped:

* every mesh writes **rgb = its shaded colour** and **alpha = its density**;
* the alpha channel is blurred into two lobes (tight, σ≈16px; wide, σ≈96px ≈ 5% of
  frame width);
* the composite does `out = sceneRGB + uPolarity * (tint_T·w_T·blurT + tint_W·w_W·blurW)`
  with `uPolarity = −1` in Act 1 and `+1` in Act 2.

**Act 1 the object SUBTRACTS light from the paper. Act 2 the same mechanism ADDS it.**
That is literally the reference's measured mechanism — the accent hue present before
the cut as subtractive ink and re-issued after it as additive emission — and it is why
the transformation is a change of *substance*, not a change of palette.

It also fixes the single most serious criticism levelled at the winning concept: it
supplies the **optical layer**. Report 2 measured every form in the reference as "a
hard silhouette edge (7px, −7 L/px) welded to a large Gaussian bleed (σ ≈ 5% of frame
width)". A hard vector edge with nothing around it is the most reliable motion-graphics
tell in existence. The bleed is that missing layer, and inspection of
`qc/ref-sheet-0.png` confirms it: the reference's bright half is a flat field with a
**large soft-gradient stain** sitting on it, not a flat field alone.

### BRIGHT HALF — no light source at all

The field is unlit paint. The blades carry a fake single-direction term baked into a
`ShaderMaterial`, with the **field colour as the base albedo**, so the blade can only
ever be a small modulation of the ground it sits on:

```glsl
const vec3 L = normalize(vec3(-0.32, 0.58, 0.75));   // constant, never animated
vec3  N    = normalize(vNormal);
float ndl  = abs(dot(N, L));
float body = mix(0.86, 1.02, pow(ndl, 1.6));         // 199 .. 236 against a 231 field
float spec = pow(max(dot(reflect(-L, N), normalize(vView)), 0.0), 42.0) * 0.10;
float dens = 0.10 + 0.18 * pow(1.0 - ndl, 2.2);      // ALPHA: fold-driven ink density
gl_FragColor = vec4(vec3(0.9059, 0.9020, 0.9137) * body + spec, dens);
```

* Median lit face **L 224** against a **231** field — a 3% contrast. p95 reaches 233,
  i.e. parts of the blade sit *above* the field. Separation from the field comes only
  from (a) the antialiased silhouette edge, 4–7px, and (b) the crescent's curvature
  turning the normal away fast near the fold.
* The exponent-42 specular puts a kick over 240 on ~0.5% of pixels.
* `wellMid` / `wellCore` write **alpha = 1.0**. Their bleed is the reference's measured
  229 → 129 falloff over ~140px and 229 → 182 over ~300px. **This large soft stain is
  the only thing in Act 1 that the audience can actually see**, and it is why V2's
  "2% contrast subject on white" instinct would have delivered a blank screen on a
  phone or a laptop at 40% brightness.

Composite tints, Act 1 (starting values; tune against the tonal targets):

| lobe | tint (removed vector) | weight | max removal | effect |
|---|---|---|---|---|
| tight (σ 16px) | (0.86, 0.80, 0.83) | 0.94 | (219,204,212) | fold core clamps to near-black |
| wide (σ 96px) | (0.72, 0.66, 0.70) | 0.26 | (47,44,46) | the 300px skirt |

The removed vector takes **more R and B than G**, so the residual leans emerald. At
50% density the residual is ≈ (121,128,127) — absolute chroma **7**. The stain's
chroma never exceeds 14 anywhere; whole-frame luminance-weighted chroma stays
**≤ 6.0**. The emerald is physically present as value and genuinely withheld as colour.

### DARK HALF — exactly two emitters and nothing else

**(1) The off-frame key.** Analytic, in the composite shader — not a quad, not a light
— which saves a full blended fullscreen pass and lets us reproduce the measured
clamped profile exactly.

```
centre  (0.11W, 0.86H)      sigma  0.055 of frame width  (105.6px at 1920)
colour  rgb(76,73,77)       deliberately NEUTRAL, never emerald
amplitude clamped so peak output is exactly 107/255
hard taper to zero across r = 440px → 480px  (= 25% of frame width)
```

Verified against the reference's measured 45° ray: the frame corner itself sits at
L≈2, the lobe peaks at ~140px in, and it is dead by 320px on a 1280 frame (480px at
1920). It never blows out and no ambient bleeds past that radius. It is motivated: it
is the bright world we just left, leaking past the door.

**(2) The throat's own emission.** `MeshBasicMaterial` core plus the additive bleed
(alpha = emission). The core is written as **near-white `#D8DCE8`** (216,220,232,
chroma 16). **The chroma lives in the halo, never in the core.** That is how a coloured
emitter actually reads — the source clips toward white and the atmosphere around it
carries the hue — and it means the brightest pixel in the film is neutral.

**The door's shader** (this is a required correction to the winning concept):

```glsl
float d    = clamp((uThroatDist - vDist) / uThroatDist, 0.0, 1.0);  // 1 near throat, 0 at frame edge
float fall = pow(d, 1.6);                                            // L106 → L20 across its length
float body = 0.416 * pow(abs(dot(N,L)), 1.25) * fall;                // no specular
vec3  col  = mix(vec3(0.408,0.408,0.416), vec3(0.384,0.431,0.412), uChroma) * body;
gl_FragColor = vec4(col, 0.0);                                       // door contributes NO bleed
```

A hard L106 ceiling with no falloff reads as a poster shape; the reference's own
lower-left wedge gradients ~110 → ~5 across its length (visible in `ref-sheet-2.png`).
`uChroma` ramps 0 → 0.22 during the chroma ramp, shifting the face from rgb(104,104,106)
to rgb(98,110,105) **at unchanged luminance** — a 10-unit chroma shift on a
12%-of-frame element. That near-subliminal spill is the entire proof that the emerald
is light in the world rather than a colour on a shape.

**Nothing else emits.** No fill, no rim, no second key, no environment map, no bounce.

### Tone mapping — one state for the whole film

```
renderer.toneMapping      = THREE.NoToneMapping
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
THREE.ColorManagement.enabled = false
```

**Decision and reasoning.** We author literal sRGB code values and we want them written
verbatim. With ColorManagement on, `Color.setHex` sRGB-decodes but a hand-written
geometry `color` attribute does **not** — the two paths land in different spaces and
multiply, which silently compresses exactly the 3% field-vs-blade contrast the whole
of Act 1 rests on. Turning it off makes one rule true everywhere: **every colour in
this film is `hex/255`, and it survives untouched to the PNG.** The bleed then averages
in sRGB-encoded space rather than linear light — which is what a compositing
application does, and the reference *is* a compositing-application film, so it is the
correct match rather than a compromise. **This global is pinned by the calibration
probe (Step 1); if a future edit flips it, the build fails before frame 0.**

---

## The structural event (what happens, physically, and over how many frames)

**One frame. Between frame 179 (t = 5.967) and frame 180 (t = 6.000). Zero transition
frames.** No dissolve, no wipe, no eased opacity, no property animated across the
boundary. Act 1 and Act 2 are two independently constructed scene graphs, both fully
built and both warmed with a 1×1 scissor render before frame 0, rendered by the same
camera object, and butt-joined:

```js
renderer.render(i < 180 ? sceneA : sceneB, camera);   // the film's only branch
```

No material is swapped at runtime, so there is no shader-recompile stall at the
boundary and nothing can smear the delta across frames.

**Magnitude.** Frame 179 mean luminance ≈ 223.5 (field 231 over ~76% of frame, blade
faces at 224 over ~12%, stain and well below that over ~12%). Frame 180 mean luminance
≈ 4.4. **Δ ≈ −219.** The gate is ≥200; the reference measured −218.1.

**Neighbouring frame pairs must measure under 3.0 mean |Δ|** so the peak is a spike and
not a shoulder. Measured reference behaviour it must match: 15.20s → 0.70, cut → 221.18,
15.27s → 0.26.

### Why it is physically motivated, not a graphic trick

The aperture spends the whole bright half opening. Everything the film has been doing
is widening a gap. At 5.20s the blades reach full open and the film **stops dead** for
24 frames. The gap is at maximum. Then we are through it. The audience has watched a
hole get big enough to pass, watched the film freeze at the moment it is big enough,
and then finds itself on the other side. That is not a colour change; it is a change of
which side of a boundary the frame is standing on.

### The deceleration is the mechanism

Measured on the reference: mean MAD falls **monotonically** over the final five seconds
— 2.15 → 1.31 → 0.63 → 0.37 → 0.30 — making the half-second before the cut the stillest
moment of the entire bright half, quieter than the film's own median (1.29). Peak over
preceding mean = **464.9×**.

Ours, as a literal envelope rather than a feel:

| window | target mean MAD |
|---|---|
| 3.55–4.40 (burst 3) | 12.0 peak, already decaying |
| 4.40–4.90 | 2.1 |
| 4.90–5.20 | 1.3 → 0.62 |
| 5.20–5.967 (the hold, 24 frames) | **0.06–0.45**, monotonic, never 0.00 |
| the cut | **≈219** |
| 6.000–6.500 (beat of nothing, 15 frames) | 0.20–0.90 |
| 6.700 (peak of the answer) | **5.2**, i.e. +0.700s after the cut |
| 6.90–7.60 | decaying to 0.35 |

Peak-over-preceding-mean ≈ 219 / 0.30 ≈ **730×**. Burstiness (peak/median) ≈ **600×**
against a ≥100× gate and V2's 20×. **Every instinct to accelerate into the reveal —
rising particles, a speed-up, a build — must be refused; it is the only thing that can
destroy this ratio.**

### What survives the cut, and what changes

| survives | changes |
|---|---|
| the blade `BufferGeometry`, at the same scale (no scale keyframe exists in this film) | the lighting model: unlit paint → two bounded emitters |
| the screen position of the void: (0.435W, 0.545H) → (0.435W, 0.520H) | the polarity: subtraction → emission (one uniform) |
| the ceiling: maxL ≈ 252 → ≈ 250. **The cut drops the FLOOR, never the ceiling.** Darkness is achieved by removing the ground, not by dimming the subject. | the edge grammar: hard 4–7px silhouette everywhere → a soft emissive rim with **no** hard silhouette, min in-frame edge width jumping to ~17px |
| one continuity pixel (below) | the frame's relationship to its contents: everything inside frame → something always cropped |

**The continuity pixel** (grafted from SELVEDGE, and it is the best small idea in the
whole set): from t = 5.867 a 3px specular glint appears on the right blade's inner lip
at screen (0.452W, 0.508H), reaching L = 252 by frame 179. On frame 180 that same screen
position is the throat ring's topmost point, present at L = 34 and rising to 250 by
6.90s. **The one point of light is the only thing that survives the cut.** It changes
about a dozen pixels — MAD contribution < 0.02, measurably silent — while being, to the
eye, the only thing in the frame during the hold. It gives the pre-cut freeze something
to be *about*, and it lets the cut land on an anticipation rather than a void.

---

## The emerald arrival

**The emerald is on screen from frame one — as absorption. It arrives at 6.70s — as
emission. That switch, not the introduction of a new hue, is the transformation.**

### Before the cut

The well is `#0E241C` and `#02070A`; the Act 1 subtraction vector leans emerald. On a
231-luma field at ~1.4% core coverage this reads as near-black ink. Nobody watching says
"green". Whole-frame luminance-weighted absolute chroma across the entire bright half:
**≤ 6.0 / 255**. The emerald is genuinely withheld as colour while being physically
present as value — which is the honest reading of "withheld", and it means the cut does
not have to smuggle in a foreign palette. **Brand navy `#0B1620` (L 8%, S 48%) appears
nowhere before the cut. Emerald `#2FBF8F` appears nowhere before the cut.**

### The cut itself is achromatic

Frame 180 has max absolute chroma **≤ 6/255**. For 0.50s (frames 180–194) the film is
visually monochrome — the cropped door lit neutral, the key lobe fading up, the throat
present but dim (emissive 0.06, peak L 34) — with max chroma **≤ 11/255**. We are inside
and our eyes have not adjusted. **This is the phone ringing in the dark, which is
exactly what "Nobody picks up." set up 2.3 seconds earlier.**

### Ignition = the answer. One event, not two.

This is the correction the brand-truth lens demanded and it is right: as originally
written, ignition and "It answers." were two separate events 1.4s apart, which splits
one meaning across two moments and weakens both. Collapsed:

| t | what | measured target |
|---|---|---|
| 6.500–6.740 | **THE ANSWER, compound.** The throat core ramps `#0A0C10 → #D8DCE8` (it ignites **white**) while a vertical filament strikes across its interior, top to bottom, in 0.22s, then holds. The circuit closes. | MAD peaks **5.2 at 6.700s** = **+0.700s after the cut**, matching the reference's measured +0.7s post-cut peak exactly |
| 6.650–7.600 | **CHROMA RAMP, lagging by 0.15s.** The additive wide lobe ramps weight 0 → 0.62 with tint emerald `#2FBF8F`, and the tight lobe ramps to 0.55 with tint mint `#9FF0CE` at the inner edge. | max absolute chroma 8 → 24 → 52 → **88/255 peak at 7.350s** (= +1.35s), confined to a blob covering **≤ 2.0%** of frame |
| 6.650–7.600 | **It must touch something.** `uChroma` on the door ramps 0 → 0.22: face goes rgb(104,104,106) → rgb(98,110,105), luminance ceiling unchanged. | chroma 2 → 12 on a 12%-of-frame element |
| 6.850–7.900 | type: **"It answers the call."** | — |

Structurally this reproduces the reference's own two-clock behaviour: a **luminance**
event at +0.7s and a **chroma** completion at +1.2–1.4s. Semantically the emerald now
means *the moment of pickup* rather than the vaguer "the system is on", and it is
attached to the single most important thing the product does.

### Colour budget for the rest of the film

Luminance-weighted absolute chroma: **11–15/255** through the body of Act 2, **one**
spike to ~41 during the departing filament (9.70–10.70s, ~1s), decaying to **3.4** for
the final 1.1s — *below* the bright half's own value. The close of this film is less
chromatic than its opening, exactly as the reference measures.

**Never target the 76–86% HSV figure.** The QC harness measures `(max−min)/255`
weighted by luminance and refuses to report HSV S on any frame whose mean L is below 20.

---

## Product evidence inside the space

**No cards. No panels. No rounded rectangles. No chat bubbles. No cursor. No phone. No
dashboard. No calendar, no date, no time, no grid, no slot — nothing that could be
misread as booking, which is a refused entitlement. No people, no faces, no silhouettes.**

The capability is told as three things the light does inside the passage, each followed
by three or four words of type in the frame's reserved right zone. **The throat ring is
not decoration — its state is the product.**

**BEAT A — 6.50s — IT ANSWERS THE CALL.**
The core ignites white and a single vertical filament strikes across the ring's interior
in 0.22s, then holds. The circuit closes; the passage now has something running through
it. Type at (0.750W, 0.500H): **"It answers the call."**
*Why "the call" and not "It answers.":* the film's telephony anchor is set once at 1.15s
and then survives the largest structural discontinuity in the piece. Without the noun,
"It answers." followed by "your questions" reads as *an AI that answers your questions*
— the chatbot category, not the phone-agent category. Three extra characters kill that
outright.

**BEAT B — 8.40s — IT QUALIFIES.**
A second, smaller arc ignites concentrically inside the throat at 0.62 of its radius —
240° of arc with a deliberate gap — rotating into register over 0.30s. Then **the gate
narrows**: its gap closes from 120° to 46° over 0.28s and freezes. It is an aperture
inside an aperture, and it is incomplete, because a qualifier is a thing that lets some
through and not others. Type: **"It asks your questions."** The owner's rules, applied
by the agent, rendered by the threshold motif itself.

**BEAT C — 9.70s — IT TELLS YOU.**
A short filament detaches from the right side of the throat, **passes through the
narrowed gate's gap**, and travels outward across 0.34 of frame width over 0.40s,
dimming, and exits the right edge of frame. Type: **"It texts you."**

It leaves and it does not arrive anywhere on screen. There is deliberately **no rendered
destination**, because a destination would be a UI card, because the message goes to a
person we will never show, and because a receiving surface is the one place a booking
could re-enter by implication. **There is no surface anywhere in this film for a booking
to occur on.** This is also the film's one chroma spike (~41 luminance-weighted, ~1s).

Beat C passing *through* Beat B's gate is the only structural change from the winning
concept's evidence design, and it is what makes qualification causal rather than
decorative: one call in, one path, one narrowing, one message out. It matches the copy
exactly and it removes the fan-out read that no copy gate could ever police.

### Honest statement of a known weakness

The claim "you could mute the type entirely and the film still reads" is **false**, and
the build must not be written as though it were true. Muted, what survives is *structure*
— something opens, you cross it, a system comes alive, something departs — which fits
any B2B product on earth. **Twelve words carry the product-specific meaning.** The
mitigations, all of which are in this spec, are: (a) the type gets its own hard QC gates
(font identity, bitmap hash, measured width, edge sharpness) because it is load-bearing;
(b) it is lit by the same bleed chain as everything else, so it belongs to the space
rather than being laid over it; (c) each line is redundant to something the light already
did, so the film is never *contradicted* by its own images.

### Type discipline (measured)

* One centred line at a time. Never two.
* Cap height **4.8–5.8%** of frame height (52–63px at 1080). The reference measures
  5.3–6.7%; 4.8% is a declared deviation for the one long line.
* Horizontal midline, y = 0.500. Confined to **x ∈ [0.545, 0.955]**, centre 0.750W.
  The aperture never enters it (bbox x₁ ≤ 0.53W, asserted).
* Crisp at 4–6px 10-90 transition, identical at both ends of the film.
* Reveal is a per-glyph alpha wipe left-to-right over 0.40–0.45s. Type is 0.4% of frame,
  so this costs almost no MAD and no type beat ever crosses the 5.0 burst threshold.
* **Build-time gate:** every rendered line's `measureText` width ≤ 0.42W, or the build
  fails.

**Copy, verbatim and complete:**

| t | line | colour |
|---|---|---|
| 1.15s | A call arrives. | `#0E241C` ink on paper |
| 3.70s | Nobody picks up. | `#0E241C` ink on paper |
| 6.85s | It answers the call. | rgb(201,200,204) |
| 8.55s | It asks your questions. | rgb(201,200,204) |
| 9.85s | It texts you. | rgb(201,200,204) |
| 11.45s | **NEVAMIS** — letter-spaced 0.16em, cap 5.4%, rgb(96,96,98), at (0.750W, 0.500H) | dim |

Both Act 1 lines dissolve by 5.20s so the frozen pre-cut passage is nothing but paper,
silhouette and slot. The close is **NEVAMIS** alone — never "NEVAMIS AI", no tagline, no
URL, no second line. A second line would put pixels above L32 and break the close's own
light budget. The wordmark stays inside the reserved type zone, so the film's type law
holds from the first glyph to the last.

**Build-time copy assertion** over the Canvas2D source strings (not the pixels):
reject on `book|booking|books|schedule|scheduled|scheduling|calendar|appointment|
timeslot|reschedule|meeting` and on the literal `NEVAMIS AI`.

---

## Beat sheet (time | picture | sound)

| t (s) | frames | picture | sound |
|---|---|---|---|
| 0.00–0.85 | 0–25 | Open on the white field, **already in motion** — the reference's own opening is *more* active than its middle, so we do not start frozen. The slot is a hairline (0.02W), a single dark stroke in a blank cold-white expanse. The blades swing about their vertical axis and the slot widens to 0.17W. Silhouette bbox height pinned at 0.44H; width sweeps 8×. Frame mean 226. **Second-largest event in the film, peak MAD ≈ 22 at 0.30s — about one tenth of the cut.** | Thin, very quiet room tone — the acoustic of a small bright empty space. One soft dry mechanical *shff* of a blade travelling, no reverb. |
| 0.85–1.90 | 26–56 | **REST.** MAD < 0.6. Slot holds at 0.17W. Type resolves at (0.750W, 0.500H): **"A call arrives."** — per-glyph wipe over 0.45s. Frame is 76% flat white, one crescent silhouette, one soft dark stain, one line of ink. | Room tone alone. A single soft tick under the first glyph, then nothing. |
| 1.90–2.60 | 57–77 | **BURST 2.** The blades counter-rotate and the slot **narrows** to 0.09W. The well deepens to its blackest, rgb(2,7,10). The door is closing. Type dissolves. MAD ≈ 9. | The *shff* reversed and shorter. Room tone drops a third in pitch. |
| 2.60–3.55 | 78–106 | **REST.** MAD < 0.5. Held on a nearly-shut slot. The stillness reads as a phone ringing into nothing. | Room tone, thinning. Silence has weight here. |
| 3.55–4.40 | 107–131 | **BURST 3 — the opening proper.** Slot sweeps 0.09W → 0.31W, the widest it will ever be. Height still pinned at 0.44H ±0.015. Second line: **"Nobody picks up."** MAD ≈ 12, already decaying. | A longer mechanical blade travel, unhurried. One dry tick on the line. |
| 4.40–5.20 | 132–155 | **DECELERATION.** Angular velocity eases to zero on a cubic. Type dissolves out. Measured envelope MAD 2.1 → 1.3 → 0.62, monotonic. Nothing else changes. | Room tone thins toward nothing. Anything that could be called music stops here. |
| 5.20–5.967 | 156–179 | **THE HOLD — 24 frames, MAD 0.06–0.45, the stillest passage in the film and quieter than its own median.** White field; two crescent silhouettes at 224 against 231; a 300px soft stain; one black slot 0.31W wide at (0.435W, 0.545H) reaching L < 5. Frame mean 223.5, in-frame range 3→252 — **the full 255-point range inside a frame that reads as near-white.** From 5.867s a 3px specular glint appears on the right blade's inner lip at (0.452W, 0.508H), reaching L 252. Twelve pixels change. It is the only thing in the frame. | Near-total silence. A trace of high room tone, barely present. |
| **6.000** | **180** | **THE CUT. One frame boundary.** Frame 179 mean 223.5 → frame 180 mean 4.4. **Δ ≈ −219.** Void rgb(1,0,2) at ~86% of frame. The blade is now cropped into the lower-left corner, touching both the left and bottom edges, flat-lit L106 at the throat end falling to L20 at the frame edges. The throat ring is present at (0.435W, 0.520H) — where the black slot was — but nearly invisible, emissive 0.06, peak L 34, with its topmost point at (0.452W, 0.505H) where the glint just was. **Max chroma ≤ 6/255. Achromatic.** | One low, short, dry transient — a door seating. Immediately the entire acoustic is **replaced**: small bright room becomes a large dark chamber with a long low tail. **The traversal is in the reverb.** |
| 6.00–6.50 | 180–194 | **THE BEAT OF NOTHING.** 15 frames, MAD 0.20–0.90. Almost black. Only the corner key lobe (peak L107, dead by 480px) and the cropped blade. Eyes have not adjusted. Still monochrome, chroma ≤ 11/255. **This is the phone ringing in the dark.** | The chamber tail decaying. Nothing added. |
| 6.50–6.90 | 195–206 | **THE ANSWER.** The throat core ramps to `#D8DCE8` — it ignites **white** — while a vertical filament strikes across its interior top-to-bottom in 0.22s and holds. The circuit closes. **MAD peaks 5.2 at 6.700s = +0.700s after the cut, 17× the pre-cut floor.** | A rising sine resolving onto one sustained low note. No swell, no crescendo — it arrives and then it is simply there. |
| 6.65–7.60 | 199–228 | **CHROMA, lagging 0.15s.** The wide additive lobe ramps to emerald `#2FBF8F` falling to mint `#9FF0CE` at the inner edge; **peak absolute chroma 88/255 at 7.350s inside ≤2.0% of frame.** The cropped blade's flat face picks up a 10-unit emerald tint at unchanged luminance — the proof the light is in the world. Type at 6.85s: **"It answers the call."** | The sustained note, unmodulated. |
| 7.60–8.40 | 229–251 | **REST.** MAD < 0.8. The ring holds, emerald, alone in a void. Nothing moves. | Sustained note only. |
| 8.40–9.10 | 252–272 | **BEAT B.** A 240° arc ignites concentrically inside the throat at 0.62 radius, rotates into register over 0.30s, then **the gate narrows** — its gap closing 120° → 46° over 0.28s — and freezes. A narrower opening inside the first one, deliberately incomplete. Type: **"It asks your questions."** MAD ≈ 3.0. | One dry tick, close and unreverbed — the only sound in the film with no tail. |
| 9.10–9.70 | 273–290 | **REST.** MAD < 0.7. | Sustained note only. |
| 9.70–10.50 | 291–314 | **BEAT C.** A short filament detaches from the ring's right side, **passes through the narrowed gate's gap**, travels 0.34 of frame width outward over 0.40s, dimming, and exits the right edge. Nothing receives it on screen. Type: **"It texts you."** The film's single chroma spike, ~41 luminance-weighted, lasting ~1s. MAD ≈ 2.8. | A dry tick and a short soft departure — a sound that leaves rather than lands. |
| 10.50–11.45 | 315–343 | **REST.** MAD < 0.6. The ring holds. Nothing happens for most of a second. | Sustained note, dropping in level. |
| 11.45–12.10 | 344–362 | **THE CLOSE BEGINS.** Ring emission decays 1.0 → 0.30 over 0.55s; halo chroma 88 → 12; the cropped blade decays L106 → L62. Type dissolves. **NEVAMIS** resolves at (0.750W, 0.500H), letter-spaced 0.16em, cap 5.4%, rgb(96,96,98). Nothing bright remains. | The note drops in level and loses its top. |
| 12.10–13.167 | 363–395 | **ONE HELD FRAME — 33 frames, MAD < 0.40, never 0.00.** Mean L 3.1, darker than the Act 2 body. Max L ≤ 130 — the in-frame range has closed from 249 to 218 to 127 across the film. Luminance-weighted chroma 3.4, below the bright half's own value. A dim wordmark, a dying rim, a corner lobe, and void. | The low tone fades to true digital silence 0.4s before the last frame. **The film ends on silence, not on a button.** |

**Six discrete motion events in 13.2s** (opening, burst 2, burst 3, the cut, the answer,
beat B/C) with 0.6–1.3s of quiet between onsets, and **one of them dominates the rest by
≈ 42×**. Reference cadence: 7 events in 37.6s, median onset gap 3.4s, largest 7.7× the
second-largest.

---

## Technical build plan (three.js, in build order)

**Working directory:** `C:/Users/daren/nevamis-site/film-v2/production/v3/`
Never build from a path containing `&` — on this machine the ampersand splits paths
inside `cmd.exe` and breaks npm. `nevamis-site` is clean.

```
v3/
  vendor/three.module.js      # vendored, not npm-installed into this tree
  serve.mjs                   # 15-line static http server on 127.0.0.1
  film.html                   # the page: builds both scenes, exposes window.renderFrame(i)
  probe.mjs                   # Step 1 — capability + calibration + font identity + timing
  render.mjs                  # Playwright driver: probe → 396 frames → ffmpeg
  frames/f00000.png …
  qc/qc.mjs  qc/tonal.py  qc/motion.py   # motion.py is reused from ../qc/motion.py
```

### Step 0 — vendor three.js and serve over http

Download `three.module.js` (r18x) into `v3/vendor/`. **Do not load the page over
`file://`** — subresources are blocked there, which is already documented in
`plates-v2.mjs` line 2. Run `serve.mjs` on `127.0.0.1:<port>` and have Playwright
`page.goto('http://127.0.0.1:<port>/film.html')`. ES-module imports and the font
`@font-face` then behave normally.

Chromium launch args (verified working on this machine by `_webgl-test.mjs`):
`--use-angle=swiftshader --enable-unsafe-swiftshader --use-gl=angle`.

### Step 1 — the probe (frame −1). **Nothing else runs until this passes.**

This is the single most important addition to the winning concept. The failure mode it
prevents is the one that dominates this codebase: *the build renders in thirty seconds,
passes all fifteen luminance gates green, and ships the wordmark in Arial.*

1. **Capability.** WebGL2 present; `MAX_TEXTURE_SIZE ≥ 4096`; `EXT_color_buffer_float`
   presence recorded (used only for the two tiny bleed buffers — the film does **not**
   depend on it, see §Render budget R1).
2. **Font identity.** Embed the brand faces as base64 from the existing
   `../fonts-b64.json`; `await document.fonts.ready`; then assert
   `ctx.measureText(S)` under the brand family **differs** from the same measurement
   under a deliberately bogus family name. Measured fact: with the face missing, "Bric",
   generic `sans-serif` and `TotallyNotInstalled` all return **1193.90625px** for the
   same string — byte-identical, with zero runtime signal. That one comparison is a
   complete and free detector. Then **hash the rasterised NEVAMIS wordmark bitmap and
   pin it**; no luminance gate will ever catch a wrong typeface.
3. **Copy width.** `measureText` every one of the six lines at its authored cap height;
   fail if any exceeds 0.42W.
4. **Colour calibration.** Render one probe frame containing flat patches of every
   authored value — `#E7E6E9`, `#0E241C`, `#02070A`, `#010002`, `#D8DCE8`, the L106 door
   pre- and post-chroma pair, the rgb(76,73,77) key — and assert **exact** equality in
   PNG space. This pins `ColorManagement.enabled = false` and
   `outputColorSpace = LinearSRGBColorSpace`; a future edit that flips either is caught
   here rather than in the grade.
5. **Timing.** Render 20 representative frames (10 Act 1, 10 Act 2) and time
   render / resolve / composite / capture separately. Compare `canvas.toDataURL('image/png')`
   against `page.screenshot({clip})` and **pick the faster one, log the choice**. The
   three prior probes on this machine disagree wildly about which wins (10ms vs 139ms;
   77ms vs 95.8ms), so this is decided empirically at build time and never asserted.
6. **Copy assertion.** The regex over the six source strings (§Product evidence).

### Step 2 — geometry (once, at init)

One `blade` BufferGeometry, displaced and normal-computed at build time, reused by
`leafL`, `leafR`, `wellMid`, `wellCore` and `door` — five meshes, one geometry.
`throat`, `innerArc`, `filament`, `departing`, `typeQuad` as specified in §The world.
**Total < 7,000 triangles across both acts.** No geometry is rebuilt at any point.

### Step 3 — shaders (three, all trivial)

* `paperShader` — Act 1 blades. ~18 ALU. Writes rgb = paper-modulated shading, alpha = fold density.
* `doorShader` — Act 2 blade. ~14 ALU including the distance falloff. Writes alpha = 0.
* `compositeShader` — one fullscreen pass. Reads resolved scene + 2 blur textures; adds
  the analytic key lobe; applies polarity, tints, clamp and dither. ~26 ALU + 4 fetches.

Everything else is `MeshBasicMaterial` with `toneMapped:false`. Use `mix()` on uniforms,
never `if` in a hot path.

### Step 4 — both scenes, built and warmed before frame 0

`sceneA` and `sceneB` are constructed in full at init, share the one camera, and are
each warmed with a 1×1 scissor render so the Subzero JIT link cannot stall the cut
frame. `renderer.render(i < 180 ? sceneA : sceneB, camera)` is the film's **only**
branch. No material swap, no property tween across the boundary.

### Step 5 — the render targets and the resolve

```
RT_HI    3840x2160  RGBA8   antialias:false   ← the scene renders here
                                                clearColor = act anchor, clearAlpha = 0
resolve  →  1920x1080 canvas, ONE fullscreen pass, exact 2x2 BOX average (4 taps)
```

**This replaces MSAA and it replaces ffmpeg downscaling, and both replacements are
deliberate.** MSAA forces a full-target multisample resolve every frame, which is the
single most expensive operation available in SwiftShader. Downscaling 2560→1920 in
ffmpeg is a **1.333× non-integer** lanczos, which rings — directly onto the 6/255 edges
this film depends on. An exact 2× box average has no ringing by construction, costs 4
texture fetches per output pixel, and keeps the capture at 1080p rather than 4K.

### Step 6 — the bleed chain (this is the optical layer; it is not optional)

Chain, all **box** filters on the way down — never a single bilinear tap, which
under-samples 4 of every 16 source texels and makes thin forms scintillate frame to
frame, putting a floor under MAD that no amount of slowing the film can remove:

```
1920x1080 (alpha)  --4x4 box, 16 taps-->  480x270   -> blurT: 2x separable 9-tap, σ=4 texels  (=16px at 1920)
480x270            --2x2 box,  4 taps-->  120x68    -> blurW: 2x separable 9-tap, σ=6 texels  (=96px at 1920 ≈ 5.0% of width)
```

Total ≈ 130k + 32k + 4×(130k or 16k) fragments ≈ **0.6 MPix/frame**. Negligible.
Buffers are `RGBA16F` if `EXT_color_buffer_float` is present (it is, on this machine),
else `RGBA8` + the composite dither. **The film does not depend on FP16.**

### Step 7 — the composite (the only "post" pass in the film)

```glsl
vec4  s  = texture(uScene, uv);
float dT = texture(uBlurT, uv).a;
float dW = texture(uBlurW, uv).a;
float soft = uWT*dT + uWW*dW;
vec3  col  = s.rgb + uPolarity * (uTintT*uWT*dT + uTintW*uWW*dW);

float key = uKeyAmp * exp(-r2/(2.0*uKeySig*uKeySig)) * (1.0 - smoothstep(0.229, 0.250, rW));
col += uKeyCol * key;                       // uKeyAmp = 0.0 in Act 1

col = clamp(col, 0.0, 1.0);
// ±0.5 LSB ordered dither, ONLY where our own soft terms contribute:
float g = step(0.0005, soft + key);
col += (bayer4(gl_FragCoord.xy, uParity) - 0.5) * (g / 255.0);
```

The dither gate is exact: on the flat field `soft == 0.0 && key == 0.0`, so the anchor
quantises exactly and corner std stays inside its gate — while every gradient in the
film gets temporal dithering, which is what stops the 0–40 luminance band of Act 2 from
posterising after H.264.

**Post FX that are NOT present, all deleted on measured grounds rather than budget
grounds:** `EffectComposer`, `UnrealBloomPass`, DOF/CoC/bokeh, FXAA, SSAO/AO, vignette,
fullscreen film grain, chromatic aberration, colour LUT, fog. Each is a full-frame
SwiftShader pass for a result the measurement proves should be a constant.

### Step 8 — type

`typeQuad` is placed in the **main** scene (ortho-positioned, `depthTest:false`,
rendered last) rather than in a separate overlay pass, so it is written into RT_HI and
therefore **gets the bleed for free** — a faint subtractive halo on paper in Act 1, a
faint emissive halo in Act 2. That is why the type belongs to the space instead of
sitting on it.

Canvas is **1728×192**, which is the quad's exact pixel footprint inside RT_HI, so the
type is genuinely 2× supersampled by the box resolve and lands at the measured 4–6px
edge at 1920. `generateMipmaps:false`, `minFilter:LinearFilter`, quad aligned to exact
texel boundaries. **Do NOT use `TextGeometry`** (font parse, extrusion, triangles) and
**do NOT use a fullscreen canvas** — a 1920×1080 RGBA canvas re-uploaded every frame is
8MB × 30/s = 240MB/s through SwiftShader and would dominate the entire render.
`texture.needsUpdate = true` **only** on frames where glyph state actually changed
(~170 of 396 frames ⇒ ~1.9MB/frame amortised).

### Step 9 — capture and encode

Frame-index driven, never `rAF` and never `performance.now()`: `scene(i/30)`, render,
capture, advance. Fully deterministic. Capture path is whichever the Step-1 probe
measured faster.

```
ffmpeg -y -framerate 30 -start_number 0 -i frames/f%05d.png \
  -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p \
  -x264-params aq-mode=3:aq-strength=1.1 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -movflags +faststart NEVAMIS-V3-13s.mp4
```

CRF 14, not 18: the flat 231 field and the flat rgb(1,0,2) void are precisely where
H.264 introduces banding, and QC measures corner std. `aq-mode=3` protects the 0–30
band of Act 2. `yuv420p` chroma subsampling is safe here because all chroma lives in
large soft halos and never in 1px detail. Limited (`tv`) range is standard and its
round trip was measured at **0–3 units** on the nine critical values, which is why the
MP4 QC tier carries a ±3 tolerance and the PNG tier is the authority.

### Step 10 — QC

`qc/qc.mjs` runs `qc/tonal.py` (per-frame luminance / chroma / coverage / corner /
occupancy / centroid) and `qc/motion.py` (reused unchanged from `../qc/motion.py`, which
already produces the reference baselines). **Two tiers:**

* **PNG tier — exact.** Authored code values must round-trip byte-exactly. Equality-form
  gates live here and only here.
* **MP4 tier — ±3.** Every target restated with tolerance. `lmax ≥ 248` here, not 250,
  so a 1-unit encode loss on the specular kick does not fail the film.

The build fails on any missed gate. No frame ships that has not passed both tiers.

---

## Render budget and mitigations (software WebGL constraints)

Estimates below are extrapolated from probes actually run on this machine
(8-core, ANGLE/Vulkan/SwiftShader Subzero, WebGL 2.0, `EXT_color_buffer_float` TRUE,
`MAX_TEXTURE_SIZE` 8192).

| stage | work | estimate |
|---|---|---|
| scene → RT_HI 3840×2160 | 8.3 MPix, ~18 ALU shader, ~7k tris, ~1.6× overdraw on 12% of frame | 12–30 ms |
| 2×2 box resolve → 1920×1080 | 2.07 MPix × 4 taps | 6–10 ms |
| bleed chain | 0.6 MPix total across 6 small passes | 2–4 ms |
| composite 1920×1080 | 2.07 MPix, 4 fetches + analytic key + dither | 7–15 ms |
| type upload | 1.33 MB on ~170 of 396 frames | ~2 ms amortised |
| **GPU subtotal** | | **≈ 30–60 ms/frame → 12–24 s for 396 frames** |
| capture | 1080p, path chosen by probe | 10–140 ms/frame → 4–55 s |
| ffmpeg CRF 14 preset slow, 396 × 1080p | | 30–60 s |
| **wall clock** | | **≈ 2–4 minutes per full iteration** |

Iteration is cheap enough that the QC gates can be tuned empirically rather than argued
about — which is the point of building it this way.

### Per-frame cost targets (asserted by the probe, logged every run)

* Act 1: ≤ 90 ms/frame end-to-end.
* Act 2: ≤ 120 ms/frame end-to-end.
* If either is exceeded, apply the mitigation ladder **in order** and re-probe:

| # | mitigation | cost recovered | what it costs us |
|---|---|---|---|
| M1 | fold the key lobe analytically into the composite (already specified) | one full blended fullscreen pass | nothing |
| M2 | drop the **tight** bleed lobe in Act 1 (the wide lobe carries the stain) | ~1 ms + 2 passes | slightly less bite at the fold |
| M3 | RT_HI 3840×2160 → 1920×1080 with `antialias:true` (MSAA) | ~20 ms | measurably worse edges; MSAA resolve is SwiftShader's slowest path, so measure before assuming this helps |
| M4 | batch capture 30 frames at a time into one CDP round trip | up to 40% of capture | memory pressure |
| M5 | drop output to 1600×900, RT_HI 3200×1800 (still exact 2×) | ~30% of everything | a deliverable regression; last resort only |

**Never** reach for `scale=…:flags=lanczos` at a non-integer ratio, and never reach for
JPEG capture: chroma subsampling on capture would corrupt exactly the 3%-contrast and
low-chroma relationships every gate in this film measures.

### Named risks and their concrete mitigations

**R1 — float render targets.** RT_HI and the resolve are **RGBA8**; only the two tiny
bleed buffers (480×270 and 120×68) want FP16, and they fall back to RGBA8 + the
composite dither. The film has **no** hard dependency on `EXT_color_buffer_float`.

**R2 — silent font fallback.** Solved by the Step-1 identity probe + pinned bitmap hash.
This is the only failure mode in the whole build that renders successfully, passes every
numeric gate, and ships wrong.

**R3 — colour management.** `ColorManagement.enabled = false`, one rule everywhere, pinned
by the Step-1 calibration frame asserting exact PNG equality on every authored value.

**R4 — undersampled downsamples.** All reductions are box filters with the full tap
count (16 taps at 4×, 4 taps at 2×). A single bilinear tap at 4× reads 4 of 16 texels
and makes thin forms scintillate, which puts an irreducible floor under MAD and would
silently break the deceleration and still-fraction gates while looking like a motion bug.

**R5 — H.264 skip frames.** No frame in the film may be bit-identical to its predecessor
(§Tonal targets, anti-freeze gate). The hold is delivered by residual sub-pixel drift
(0.004 rad/frame ⇒ ~1.0px of silhouette travel) plus the per-frame Bayer parity, not by
freezing the scene graph.

**R6 — strobing on the fastest move.** We ship **no motion blur** (see §Rejected ideas).
The substitute is a hard cap, asserted in QC: **no silhouette edge may travel more than
9px per frame at 1920** in any burst. The opening burst is the binding case (slot 38px →
326px over 25.5 frames ⇒ ~5.8px/frame mean, ~9px/frame at the eased peak). Cruise speed
of the `open` envelope is the single tuning knob if it exceeds the cap.

**R7 — geometry sampling.** The blade's bow is one half-period across 24 segments and
its taper is monotonic across 32 — comfortably above Nyquist. The torus tubes are
0.016 radius at 6 radial segments, which is sub-2px in screen space, so faceting is
invisible; if a QC edge check ever shows faceting, raise radial segments to 8 (cost:
880 tris) rather than touching anything else.

**R8 — additive draw order.** `filament` and `departing` are additive with
`depthWrite:false`, `depthTest:false`, `renderOrder` set explicitly, and they are the
last opaque-pass items. No sorting ambiguity exists because there are exactly two of them
and they never overlap.

**R9 — no per-frame allocation.** No `BufferAttribute`, `Material`, `Geometry`,
`RenderTarget` or `CanvasTexture` is constructed inside the render loop. `needsUpdate`
on a persistent object, always.

---

## Tonal targets

Every number below is a **gate**. The build fails on a miss. Chroma is always
`(max−min)/255` weighted by luminance; **HSV S is never reported on any frame whose
mean L is below 20.**

### Act 1 — frames 0–179 (bright, achromatic)

| metric | gate | target |
|---|---|---|
| frame mean L | ≥ 212 | 219–227 (223.5 at f179) |
| modal colour coverage | ≥ 70% | 74–80% |
| four 96×96 corner patches, spread | ≤ 1.0 | ≤ 0.4 |
| corner patch std | ≤ 0.6 | ≈ 0.0 (dither is gated off the flat field) |
| median \|dL/dx\| across frame | = 0.00 | 0.00 |
| HSV S over pixels with L > 128 | ≤ 8% | 5–7% |
| luminance-weighted absolute chroma | ≤ 6.0 | 4.5–6.0 |
| max absolute chroma anywhere in frame | ≤ 16 | ≤ 14 |
| per-frame lmin | ≤ 5 | 3–5 |
| per-frame lmax (PNG tier) | ≥ 250 | 252 |
| per-frame lmax (MP4 tier) | ≥ 248 | 249–252 |
| in-frame range | ≥ 240 | ≈ 248 |
| p1 | 95–130 | ≈ 114 |
| % of pixels below L 5 | ≥ 0.5% | 1.0–1.6% |
| object occupancy (≥3 L below field) | 8–16% | 10–14% |
| projected object centroid | cx ∈ [0.40, 0.47], cy ∈ [0.51, 0.60] | (0.435, 0.555) |
| object bbox right edge x₁ | **≤ 0.53W** | 0.49–0.52 |
| silhouette bbox height variance, any 3s window | < ±5% | ±3% |
| silhouette bbox width variance, any 3s window | **> 2×** | up to 8× |
| everything fully inside frame | required | — |

### The cut — frames 179 → 180

| metric | gate |
|---|---|
| \|Δ mean L\| | **≥ 200** (target ≈ 219) |
| intermediate frames | **exactly 0** |
| neighbour pairs 177–178, 178–179, 180–181, 181–182 | each \|Δ mean L\| ≤ 3.0 |
| f179 mean L | ≥ 215 |
| f180 mean L | ≤ 8 |
| maxL on **both** sides | ≥ 245 (PNG) / ≥ 243 (MP4) — the cut drops the floor, not the ceiling |
| f180 max absolute chroma | ≤ 6 |

### Act 2 — frames 180–395 (dark, and far less saturated than it looks)

| metric | gate |
|---|---|
| % of pixels below L 8 | **≥ 83%** |
| % above L 32 | ≤ 6.5% |
| % above L 64 | ≤ 3.0% |
| % above L 128 | ≤ 0.7% |
| % above L 224 | ≤ 0.2% |
| maxL (from f195 onward) | ≥ 144 |
| void modal coverage | ≥ 70% |
| right sixth and top sixth of frame | mean ≤ 2.5, std ≤ 0.6 |
| max absolute chroma, frames 180–194 | ≤ 11 |
| max absolute chroma, peak at f220 (7.35s) | 84–92, inside a blob ≤ 2.0% of frame |
| luminance-weighted chroma, body (t 7.8–11.4 outside the spike) | 11–15 |
| luminance-weighted chroma, spike window (t 9.7–10.7) | peak ≤ 44, duration ≈ 1.0s |
| brightest pixel is **neutral** | core chroma ≤ 20 while halo chroma ≥ 60 |

### The close — frames 363–395 (t ≥ 12.10)

| metric | gate |
|---|---|
| mean L | ≤ 3.5 |
| max L | ≤ 130 |
| p99 | ≤ 79 |
| luminance-weighted chroma | ≤ 4.0 |
| MAD | < 0.40 |

### Motion (`qc/motion.py`, 320×180 grey, MAD in 8-bit levels)

| metric | gate | reference |
|---|---|---|
| burstiness = peak MAD / median MAD | **≥ 100×** (target ≈ 600×) | 171.3× |
| still fraction, MAD < 2.0 | ≥ 62% | 68.6% |
| mean MAD over the 0.5s before the cut | ≤ 0.45 | 0.30 |
| deceleration 4.40 → 5.967 | monotonically falling | monotonic 7.2× |
| MAD peak after the cut | at **+0.63 to +0.77s**, value 4.0–6.5 | +0.7s, 4.56 |
| bursts at MAD ≥ 5.0 | ≤ 6 in 13.2s | 7 in 37.6s |
| largest event ÷ second-largest | ≥ 8× | 7.7× |
| mean MAD over the final 1.1s | ≤ 0.40 | 0.52 over final 6.3s |
| **anti-freeze:** any frame pair with MAD exactly 0.00 | **fail** | reference floor is 0.18–0.47 with 0.8–1.6% of pixels moving; nothing in it is ever bit-identical |
| max silhouette-edge displacement, any frame | ≤ 9px at 1920 | — |

### Build-time (non-image) gates

* `camera.position` and `camera.quaternion` bit-identical on all 396 frames.
* Font identity probe passes; wordmark bitmap hash matches the pin.
* Every rendered type line's `measureText` width ≤ 0.42W.
* Type 10-90 edge transition 4–6px at 1920, on **both** sides of the cut.
* Copy strings contain no `book|booking|books|schedule|scheduled|scheduling|calendar|
  appointment|timeslot|reschedule|meeting`, and no literal `NEVAMIS AI`.
* Zero `THREE.Light` instances in either scene. `renderer.shadowMap.enabled === false`.
* Calibration frame: every authored hex round-trips byte-exactly in PNG space.

---

## Rejected ideas and why

**Rejected — a full-screen vignette / cos⁴ falloff / natural corner falloff on the field**
(proposed by the cinematography lens against both APERTURE and SELVEDGE). The argument
— that a zero-variance field is a motion-graphics tell — is correct in general and wrong
here, because the reference measures four corner patches inside **0.2/255**, corner std
**0.0000**, and median |dL/dx| of **exactly 0.00** over >99% of pixels *in both halves*.
A 1.5–2 unit falloff is measurably wrong against the one thing we can verify. **The
underlying complaint is nonetheless accepted and answered**: the missing optical layer is
real, and it is delivered by the object's large-σ bleed (§Light plan, polarity), which is
what the reference actually does — inspection of `ref-sheet-0.png` shows a flat field
carrying a large soft-gradient stain, not a flat field alone.

**Rejected — DOF / CoC / bokeh / focus rack.** The sharpest 10-90 transition in the
reference is 4px at t=3.6s and 4px at t=34.0s. Nothing ever comes into or out of focus
across 37.7 seconds. Every DOF pass is SwiftShader spend for a measured non-effect.

**Rejected — motion blur / 180° shutter via sub-frame accumulation.** Costs 2–3× the
entire film's render for an effect the reference does not have (it is a compositing-app
piece whose fastest event is a one-frame cut). **Replaced by a measurable substitute:**
a hard 9px/frame cap on silhouette-edge displacement, asserted in QC, with the `open`
envelope's cruise speed as the tuning knob.

**Rejected — bit-identical held frames.** The winning concept called the 24-frame hold
"24 identical frames". H.264 encodes those as skip frames and the eye reads it as the
video pausing. The reference's own stillest passage measures MAD 0.18–0.47 with 0.8–1.6%
of pixels changing. Replaced by residual sub-pixel drift + per-frame dither parity, and
an explicit anti-freeze gate.

**Rejected — chasing the "76–86% saturation" figure.** An HSV artifact at near-zero
value. Measured as absolute chroma the reference's dark half is near-achromatic and its
last 7 seconds are *less* chromatic than its opening. Chasing 76–86% builds a neon film.

**Rejected — SSAA by ffmpeg downscale at 2560→1920 (1.333×, lanczos).** Measured slower
than the MSAA path it was meant to rescue (36.1 ms vs 32.6 ms), and it rings at a
non-integer ratio directly onto the 6/255 edges this film depends on. Replaced by an
in-engine **exact 2× box resolve** from 3840×2160, which has no ringing by construction
and keeps capture at 1080p.

**Rejected — `readPixels` + base64 + CDP as the mandated capture path** (prescribed by
ARRIVALS). Measured at 95.8 ms/frame against `page.screenshot`'s 77 ms on this machine —
the prescribed optimisation is 24% *slower* than the thing it rejects, and a different
probe on the same machine reversed the ranking again at a different resolution. Replaced
by a Step-1 timing probe that measures both and picks, and logs the choice.

**Rejected — `EffectComposer` / `UnrealBloomPass`.** Five mip gaussians at 2–8 MPix would
dominate the whole render under SwiftShader. Replaced by a hand-rolled two-lobe chain
totalling 0.6 MPix/frame.

**Rejected — in-scene point-sprite bloom** (HALL's substitute for a bloom pass). Point
sprites take the depth of their centre vertex for every fragment, so an additive sprite
behind an occluder gets clipped to the occluder's aperture; disable depth test and all
sprites draw over everything and the receding order collapses. Bloom is a post pass
precisely because it must bleed *over* occluders.

**Rejected — the reference's own interface-proof grammar** (email compose windows, CRM
lead cards, avatars, progress bars, and its 30s beat "Books Meetings after", all visible
in `ref-sheet-2.png`). We borrow the *structure* — short beats, one idea each, inside a
held dark setup — and refuse the semantics outright. **Booking is a refused entitlement
and there is no receiving surface anywhere in this film for one to occur on.**

**Rejected — SELVEDGE's speech-envelope waveform and three-bar summary stack.** An
amplitude curve traced in apertures is an audio visualiser; three stacked bars at a
sixth width is a message bubble with the radius removed. Both are interface primitives
drawn out of holes, and they land at the exact moment the film makes its product claim.

**Rejected — ARRIVALS' three parallel chains fanning out to three terminals.** Three
simultaneous destinations reads as integrations, which is where booking re-enters by
implication and which no string-level copy gate can ever catch. Replaced by **one** path
with **one** narrowing gate and **one** departure — which is also what the copy says.

**Rejected — HALL's colossal architecture.** Its own dark-half light budget
(≥83% of pixels below L8, ≤3% above L64) mathematically deletes the colonnade it spends
seven seconds building, leaving a gradient over a void — structurally identical to the
V2 failure. Its beam quad is additive with `depthWrite:false`, so it paints over the
pier bases rather than being occluded by them.

**Rejected — extending the post-cut black to 1.8 seconds** (proposed by the brand-truth
lens to let the emerald arrive as the answer). The *intent* is accepted and implemented
— ignition and "It answers the call." are now **one** compound event — but a 1.8s hold
would push the motion peak to +1.5s and destroy the reference's measured +0.7s post-cut
envelope. Resolved at **0.50s** of true nothing, with the luminance event at **+0.70s**
and the chroma completion at **+1.35s**, which reproduces the reference's two-clock
behaviour exactly.

**Rejected — the claim that "you could mute the type and the film still reads".** It is
false and the build must not assume it. Stated as a known weakness with three concrete
mitigations in §Product evidence.

**Rejected — any `THREE.Light`, shadow map, ambient occlusion, environment map, fog,
ground plane, or PBR material.** Zero of each in the entire film. Depth comes from one
cue only: the blades' lobes crossing in front of each other with a razor-hard occlusion
boundary out of the depth buffer.

**Rejected — people, faces, actors, human silhouettes, or any figure.** Non-negotiable
brief constraint, and structurally guaranteed: the scene graph contains five meshes made
from one blade geometry, one torus, one arc, two quads and a type plane. Nothing in it
can render a person.
