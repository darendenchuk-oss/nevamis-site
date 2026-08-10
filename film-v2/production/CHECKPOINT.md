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

## Next action
Build depth rig + layers, keyframe, render, inspect.
