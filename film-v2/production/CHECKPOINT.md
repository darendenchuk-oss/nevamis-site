# NEVAMIS AE pilot — production checkpoint

## Current composition
`NEVAMIS_PROOF` 1920x1080 @30fps, 9s. (`NEVAMIS_FONT_PROBE` is scratch, ignore.)

## AE bridge constraints (VERIFIED — do not re-derive)
- `ae_import_image` needs **Windows backslash** paths. Forward slashes fail silently
  and kill an entire `ae_batch`.
- `backgroundColor` on `ae_create_composition` is unreliable -> use `ae_add_solid_layer`.
- **No camera layer.** Emulate with per-depth keyframed Position/Scale using shared
  parallax ratios (parenting gives uniform motion, which is not parallax).
- Colours are `{r,g,b}` 0-1 objects. `position`/`size`/`scale` are `[x,y]` tuples.
  `position` = CENTRE of the layer.
- `propertyName` is the Capitalised enum: Position | Scale | Rotation | Opacity | Anchor Point.
- Ease = `influence` (0-100) on each key in `ae_set_keyframes`. No easeType param.
- AE cannot see fonts installed after it launched -> **all type is imported as
  Chromium-rendered PNG plates** (better anyway: real variable weights + exact tracking).
- Visual inspection OVERRIDES numeric checks. A serif substitution once passed an
  ink-percentage test. Always `ae_export_frame` and LOOK.

## Assets on disk
- Plates: `C:\Users\daren\nevamis-site\film-v2\production\plates\*.png` (15)
- Plate generator: `film-v2/production/plates.mjs` (Chromium + real woff2)
- Fonts (installed+registered, need AE restart to be native): `film-v2/production/fonts/`
- Reference: `C:\Users\daren\Downloads\Sentient-Desk-reference-clean.mp4` (37.700s)

## Reference grammar (measured)
One inversion at 15.25s, magnitude -218/255. Light half 4.2% saturation,
dark half 78.1%. Colour arrives WITH the darkness.

## Creative decision (locked)
Emerald is WITHHELD until the NEVAMIS arrival, then lands as an event.

## Timing map — proof scene
0.0-2.2  signal enters, near-monochrome, camera dollies right
2.2-3.4  signal stalls at the node — the missed moment
3.4-4.6  NEVAMIS TAKES OVER: emerald ignition + mark forms
4.6-7.0  structure assembles: lead card + plates resolve from the light
7.0-9.0  push in, TEXTED TO YOU confirms, brand lands

## STATE: proof scene BUILT and rendered (v1 presentable)
`NEVAMIS_PROOF` has 18 layers, 145 keyframes, renders clean.
Contact sheet: `film-v2/production/PROOF-v1-contact-sheet.png`

### Layers (bottom->top)
bg-solid, bg-field(ellipse, Scale 230->244 covers frame), sig-trail, sig-head,
node-ring(emerald), node-core, card-edge(emerald 968x628), card-lead(960x620),
p-urgent, p-shopowner, p-outage, p-immediate, p-nextstep, p-callback,
p-texted, p-nevamis, p-tag, plate-mark

### TWO MORE HARD-WON GOTCHAS (verified)
- `ae_batch` ops must use **UNPREFIXED** tool names (`add_shape_layer`,
  `import_image`, `delete_layer`, `modify_layer`) — the `ae_` prefix fails the
  whole batch with a bare "After Effects reported an error".
- **AE caches imported footage by path.** Overwriting a PNG in place does NOT
  refresh it in the comp. To update a plate: write it to a NEW filename
  (`v2-*.png`), delete the old layer, re-import, re-apply its keyframes.
- `modify_layer {size}` on a shape layer silently does nothing. Resize via the
  **Scale** transform instead (that is how the bg corner-wedge bug was fixed).

### PLATE FONT BUG — root cause found and fixed
Chromium `setContent()` runs on an `about:blank` origin, which BLOCKS `file://`
font subresources -> silent serif substitution. FIX: fonts are embedded as
**base64 data: URIs** from `film-v2/production/fonts-b64.json`. `plates.mjs` now
also width-tests each plate against a forced-serif control. (That guard produced
one FALSE POSITIVE on `t-texted` — visual check confirmed correct mono. Trust eyes.)

## Remaining weaknesses in proof v1 (ranked)
1. 0.0-3.0s is too sparse — a thin line in a dark field for 3s. Needs a
   second element or a faster entry.
2. Parallax/depth is present numerically but not perceptible. bg-field moves
   only ~25px. Needs a real foreground occluder crossing frame.
3. No motion blur enabled anywhere (`ae_set_motion_blur` not yet applied).
4. No glow on the emerald ignition — the node arrival could hit harder.

## Next action
Add FG occluder + motion blur + glow on node ignition; densify 0-3s.

---

# CREATIVE DIRECTION V2 (V1 ARCHIVED — do not revive)
V1 (`NEVAMIS_PROOF`) rejected at concept level: too literal, SaaS-explainer.
Comp left in project for reference only. All V1 TECHNICAL knowledge above stands.

## V2 principle
Build the WORLD first; UI enters that world as raw material. Typography is an
environmental object, not a caption. Depth is real (macro plates + blur falloff +
oblique planes + occlusion), not a background moving 25px.

## Approved styleframes (rendered + visually passed)
- `V2_A` opening macro — env/macro-b.png glass blade, cropped INCOMING type at
  26% behind it, blurred pale waveform crossing FG, tiny mono metadata.
- `V2_B` emerald transformation — env/panels-a.png corridor blurred, emerald
  waveform crossing sharp w/ glow, real UI rows at -8deg on two depth planes,
  cropped ANSWERED type at 17%.
- `V2_C` payoff — near-black, mark [960,236] scale 13, wordmark [960,530]
  scale 37, tagline [960,712]. Collision-free.
Files: `V2-STYLEFRAME-A/B/C.png`, sheet `V2-STYLEFRAMES-ABC.png`

## Higgsfield environment plates (in `film-v2/production/env/`)
macro-a, macro-b, macro-d, panels-a  = USABLE
panels-c = **REJECTED, contains a human silhouette** (banned). Do not use.
Spend so far this direction: 4 credits (2 still sets). Balance ~955.

## V2 plates (`film-v2/production/plates-v2/`, generator `plates-v2.mjs`)
huge-nevamis/captured/answered/incoming (environmental type, meant to be cropped),
meta-stack, meta-outcome, ui-who/what/next (real fields, oblique raw material),
wave-pale, wave-emerald, mark, lockup-tag

## TRUTH CORRECTION applied to the V2 brief
The brief's "TUESDAY / 2:30 PM / CONFIRMED" booking payoff is NOT shippable —
agent-draft.ts:235 provisions builtInToolsJson ["end_call"] and calendar booking
is a registered refused entitlement. The fragments-resolve-into-legibility
metaphor is KEPT but resolves onto the real outcome (CAPTURED / CALL BACK NOW /
TEXTED TO YOU).

## Known defect pattern (hit twice — check every payoff frame)
The mark collides with the wordmark's "A" and reads as an accent. Keep >=70px
clear between mark bottom and wordmark cap-height.

## Next action
Animate A->B->C as ONE camera move in `NEVAMIS_PROOF_V2`: shared virtual-camera
transform, depth factors FG 1.8 / primary 1.0 / mid 0.55 / bg 0.2, push-through
at the B->C transition. Render, inspect, ruthless second pass.

---

# NEVAMIS_PROOF_V2 — ANIMATED (10s @30fps, 15 layers, 109 keys)
One continuous camera move. Shared virtual-camera path baked per layer at depth
factors FG 1.8 / primary 1.0 / mid 0.55 / bg 0.2.
camX keys t=[0,3,5,7.5,8.6,10] -> [0,-120,-320,-560,-900,-930]

Beat map: 0-3.5 macro blade + cropped INCOMING + FG wave | 3.5-4.5 world change
| 4.0-5.1 EMERALD wave enters from frame right and settles (the arrival) |
5.0-8.0 UI rows fly in on two depth planes, cropped ANSWERED behind glass |
8.0-8.9 collapse | 8.4-10 brand lockup resolves.

## Grade fix (important)
`env-panels` came in grey-green and broke brand identity. Fixed with
hueSaturation (Sat -46, Light -34) + tint (black->#02080D, white->#548087,
Amount 68). Verified visually. Frame: `V2-PROOF-graded-6s2.png`

## Another batch gotcha
`apply_effect` inside `ae_batch` FAILS when the properties object contains a
nested colour object (Map Black To / Map White To). Apply those effects as
individual `ae_apply_effect` calls instead.

# SOUND DESIGN — requested, NOT yet built
AE MCP has NO audio tools and NO render queue. Plan (same method as the V1 film,
which worked): synthesise stems with ffmpeg `aevalsrc`, mix with adelay+amix,
then mux onto the rendered picture.
Cues locked to the picture:
  0.0   room tone bed (pink noise, lowpass 320Hz, -30dB) for full 10s
  0.4   low sub arrival swell (chirp 70->40Hz, exp decay) - the incoming
  2.6   thin high metallic shimmer under the meta text
  4.0   RISE into the transformation (chirp 55->180Hz over 1.0s)
  4.7   THE HIT - emerald arrival: 41Hz sub impact + 2-note motif 147->196Hz
  5.8/6.3 two soft confirm ticks as the UI rows land (294Hz + 441Hz, short)
  8.0   everything ducks; 0.6s of near-silence (the collapse)
  9.3   final resolved note on the wordmark, low, no trailer boom
No music bed with melody - restrained electronic, negative space dominant.

# REAL VIDEO OUTPUT — the actual blocker
`aerender.exe` EXISTS: "C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/aerender.exe"
BUT it needs a SAVED .aep and the MCP exposes no save tool (confirmed in
ae-mcp-realities: "no project-info or save/render tool at all").
=> To get a real MP4: save the project once in the AE UI (Ctrl+S) to a known
path, then aerender can be driven from Bash and ffmpeg can mux the sound.
This is the ONE human-only step.

## Next action
1. (human) Save the AE project. 2. aerender NEVAMIS_PROOF_V2 -> PNG seq or MOV.
3. ffmpeg: build sound stems per the cue map, mux, inspect, iterate.

---

# V2 PROOF DELIVERED — `NEVAMIS-V2-PROOF-10s.mp4` (1920x1080, 10.00s, with sound)

## aerender IS usable (the "human-only blocker" is now just the one-time save)
`aerender.exe` at "C:/Program Files/Adobe/Adobe After Effects 2026/Support Files/"
Working invocation (project copied OFF the "&" desktop path first — cmd.exe splits on &):
  aerender -project <safe.aep> -comp "NEVAMIS_PROOF_V2" -RStemplate "Best Settings"
           -output "<dir>\f[####].png"
GOTCHAS:
- `-OMtemplate "PNG Sequence"` -> "No output module template was found". Omit it.
- With -OMtemplate omitted, aerender IGNORES the [####] pattern and the default
  output module writes a single **H.264 f.mp4** regardless of the .png extension.
  That is fine/better — mux audio straight onto it.
- 301 frames rendered in 11 seconds.
- Warning "Project has missing fonts" is harmless: all film type is PNG plates.
  It refers to the leftover NEVAMIS_FONT_PROBE comp.
- Re-render after ANY comp edit: the .aep must be re-saved in the UI first,
  because the MCP mutates the live project and cannot save.

## Sound design (built, `sound.mjs`, synthesised — no library, no licence)
0.0 room tone bed (pink, LP300, -31dB) | 0.4 sub arrival swell 70->40Hz |
1.1 glass edge shimmer | 2.62 metadata tick | 3.95 rise 55->180Hz |
4.2 air layer (transformation half only) | 4.68 THE HIT 41Hz sub |
4.70 two-note motif 147->196Hz (the NEVAMIS signature) | 5.82 + 6.34 row confirms |
7.88 collapse breath then SILENCE 8.2-8.9 | 9.25 resolved 98/196Hz, no boom.
Master: limiter 0.92 + loudnorm I=-18 TP=-1.5 LRA=11.

## Next action
Watch with sound. Likely refinements: the 3.5-4.5 world change may need a
harder cut or a whip; check the emerald hit lands ON the wave settle (4.7 vs
picture 5.1 — may need the hit moved +0.2s); consider a 9:16 reframe.

---

# MIX v2 — rebalanced after MEASURING it (could not hear it; measured instead)
Analysed `_snd/mix.wav` by decoding the waveform and building a 100ms RMS envelope.
Three real defects found that listening-by-assumption would have shipped:

| defect | before | after |
|---|---|---|
| loudest moment was the OPENING, not the hit | peak t=0.40s -5.1dB | peak t=4.90s -7.1dB PASS |
| "silence" at 8.45 was not silent | -22.9 dB | -75.0 dB (window max -38.0) PASS |
| rise was inaudible | -46.2 dB | -27.1 dB |

Changes: sub-arrival gain 0.42->0.20; hit sub 0.50->0.86 + added 82Hz octave;
motif 0.20->0.34; hit moved 4.68->4.85 (0.25s lead on the 5.1 picture settle);
rise rebuilt as pow(t/0.9,1.6) crescendo, 0.92s; collapse breath 1.0s->0.5s so
real silence opens; mix resampled to 48kHz (amix had produced 192kHz).

**Method note: always decode the wav and measure the envelope. `volumedetect`
piped through grep in bash returned empty strings and silently produced no data.**

# PICTURE v2 — world inversion moved ONTO the hit (COMP EDITED, NEEDS RE-SAVE)
Was a 1.0s cross-dissolve at 3.6-4.6 that happened BEFORE the audio hit.
Now: env-blade 100@4.60 -> 0@4.88 (influence 88); env-panels 0@4.66 -> 78@4.92;
type-incoming out by 4.86; type-answered in 4.9-5.5; wave-em 62->100 at 4.9.
=> a ~0.28s decisive inversion landing on the 4.85 audio hit, with the emerald
wave carrying through unbroken as the agent of change. Verified visually.

## STATE OF THE DELIVERABLE
`NEVAMIS-V2-PROOF-10s.mp4` currently = OLD picture + NEW verified audio.
To get the new picture: re-save NEVAMIS1.aep in the AE UI, then:
  cp "<desktop>/NEVAMIS1.aep" film-v2/production/NEVAMIS1.aep
  aerender -project ...\NEVAMIS1.aep -comp "NEVAMIS_PROOF_V2" -RStemplate "Best Settings" -output ...\render\f[####].png
  node film-v2/production/sound.mjs

# PASS 3 — FUSION + DEPTH (COMP EDITED, NEEDS RE-SAVE)
The brief warned: "Do not simply cut from 'AI-generated video clip' to 'motion
graphics'." Generated plates, vector UI and type plates were still reading as
three separate media, and there was no motion blur anywhere — the single
strongest "cheap" tell in motion design.

**GRADE** (adjustment layer, index 1, top of stack). One shared photographic
treatment over everything so the three media read as one film:
  - CC Vignette          Amount -34, Angle of View 42
  - Noise (ADBE Noise)   Amount of Noise 2.4
  - Brightness&Contrast  Brightness -4, Contrast 9

**Motion blur** comp-level ON, shutterAngle 200, plus per-layer on wave-em,
wave-fg, ui-what, ui-next, type-incoming, type-answered, meta, wordmark, mark, OCC.

**OCC** — foreground occluder, index 2 (below GRADE so it receives the grade).
`env/macro-d.png`, Scale [78, 200] (narrow + full-height = a pillar, never a
full-frame wipe), Rotation -3, Brightness -70 / Contrast -10, Gaussian Blur 52,
motion blur on. Position -1000 -> 2950 over 4.70-5.08; Opacity 0/90/90/0 at
4.66/4.70/5.06/5.10. It whips past camera THROUGH the world inversion, so a
physical foreground object motivates the change instead of it just happening.

## Two rejected attempts, recorded so they are not retried
1. **Flat black shape-layer occluder** (980x2400, #02080D, blur 48). Rejected on
   sight: a solid fill stays pure black in its interior and keeps a hard edge no
   matter the blur — it read as a rendering bug, and it sat on top of the emerald
   arrival, the one moment the film exists for. A foreground occluder MUST have
   photographic luminance variation.
2. **Same plate at Scale 170% uniform.** Wider than frame => total coverage for
   ~0.5s, which swallowed the emerald hit entirely, and Contrast +24 blew its
   highlight to pure white. Fix was non-uniform scale (narrow X, tall Y) and
   NEGATIVE contrast.

## NEW BRIDGE GOTCHAS (pass 3)
- `ae_reorder_layers` returns `{"failed":[{"error":"layer not found"}]}` for a
  layer that ae_list_layers plainly shows. Treat it as non-functional. To put a
  layer on top, DELETE and re-add it (add_adjustment_layer lands at index 1).
- `ae_apply_effect` "levels" maps to `ADBE Levels2`, which does not exist in
  AE 2026 (real match name is `ADBE Easy Levels2`). Use `brightnessContrast`.
- `addGrain` / `ADBE Add Grain` is NOT available in this install. Use `noise`.
- **A failed `ae_batch` still applies its earlier ops.** Two batches errored here
  and left a duplicate `fg-occluder` layer, a duplicate `Noise`, and a duplicate
  `Gaussian Blur`. ALWAYS `ae_list_layers` + `ae_list_effects` after a batch
  error and clean up before retrying — never just re-run.
- Duplicate layer names cannot be disambiguated: `ae_get_layer_info` /
  `ae_apply_effect` / `ae_set_keyframes` all take layerName only and hit the
  FIRST (lowest-index) match. Rename the first match to separate them.
- `ae_export_contact_sheet` with 9 cells timed out the bridge once grain + blur
  were in the stack. 4 cells is safe.
- `ae_finalize_build` does NOT save the project, and it would overwrite the
  hand-set ease influences (88/30/22) with its own in22/out75 profile. Do not run it.
- Saving via computer-use was attempted and the access request was DENIED, so
  the .aep save genuinely requires the owner. This is the one human-only step.
