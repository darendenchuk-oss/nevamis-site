# NEVAMIS PILOT — hybrid board (dark loss → light product)

**48.00s · direction set 2026-08-10 · supersedes the all-CGI plan**

Reference: [@yustudio.co's SENTIENT film](https://www.instagram.com/reel/DXYBsogCGKD/),
watched frame by frame in a logged-in browser. Light field, blue ribbon, real
product UI, kinetic type, deep-blue end card, 9:16.

**The decision: hybrid.** The first three shots stay in the dark cinematic
language, because you cannot dramatise *"the job you never heard about"* with a
screenshot — that loss is silent and invisible. The moment NEVAMIS appears the
film turns light and shows **real product pixels**, because abstraction there is
a liability: every abstract claim must be argued against the codebase, and two
of them lost that argument on 2026-08-10.

---

## The turn — 0:12.09, a hard cut on the first frame with no speech in it

Derived from `pilot/pilot-timing.json`, not asserted:

| | |
|---|---|
| C03 cues at | **7.834** |
| C03 spoken length | **4.250** |
| C03 clears at | **12.084** |
| C05 cues at | **13.584** |
| **C04 silence** | **1.500s — exactly the specified length, already in the built bed** |

The same arithmetic yields C11: C10 ends 43.426, C12 cues 44.026 → **0.600s**.
Both silences fall out of the audio that already exists. **Nothing needs
re-cutting.**

**Cut on frame 303 (0:12.12) or 0:12.09** — not 12.08. 12.08 lands 4ms inside
Cassidy's last word. (Earlier drafts proposed 11.96, which is **124ms** inside
"gone", and 12.20, which is 116ms of dead air on the film's most protected
frame.)

**Sound leads picture by ~120ms, and it is already built.** The 55 Hz / 62 bpm
pulse enters at 11.96 and the two-note motif inverts from falling to rising at
12.01 — both *underneath* the tail of the loss line. The ear turns on the same
breath as the loss; the eye turns a tenth of a second later on a clean frame.
That stagger is what stops a hard cut reading as a glitch, which is why **no
whoosh, riser or reverse cymbal may be added**. If it reads as a glitch on a
phone speaker (where 55 Hz is inaudible), the fix is +2–3 dB on the 12.01 motif
— never a new sound effect.

**What fills the 1.50s:** nothing, then one thing. Cream holds naked for 0.34s —
the first light frames must carry no panel and no type, or the cut reads as a UI
reveal rather than a change of world. The blue ribbon enters lower-left at 12.42
and settles by 13.30. No product until C05.

---

## The light world — a polarity inversion, not a palette swap

**The portal ships dark-only, and always will by accident.** Verified on
`origin/master`: `globals.css:10` `--nv-bg: #02080d`, `globals.css:33`
`html { color-scheme: dark }`, and **zero** light-theme branches anywhere in the
file. A naive "cut to light with real UI" would cut from a dark room to a dark
screenshot — near-zero contrast on the most important frame in the film.

So the turn inverts polarity instead:

- **Dark half (C01–C03):** objects of *light* falling through a room of *dark*.
- **Light half (C04–C11):** an object of *dark* — the product, photographed as
  it ships — resting still in a room of *light*.

Same materials, world flipped. The thing that was falling through the dark is
now the thing sitting still in the light. It reads with no narration, which
matters because C04 is silent. Measured contrast of a real portal card on the
cream field: **14.44:1**.

### Palette — every value measured, not chosen

| Role | Hex | Note |
|---|---|---|
| Field base | `#F4F0E7` | Warm off-white. Pure white goes clinical behind a dark panel |
| Field falloff | `#E8E1D3` | Under a 1.15× warm-side vignette |
| **Card top** | `#0e2130` | `--nv-panel-2`, globals.css:12 |
| **Card bottom** | `#0c1a25` | globals.css:96 |
| **Card hairline** | `rgba(159,240,206,.14)` | globals.css:97 |

The card is a **vertical gradient `#0e2130 → #0c1a25`** with a faint mint
hairline — measure it from a capture, never from a token. Nothing inside the
panel is graded, re-lit, recoloured or re-typeset. **It is a photograph.**

### Film colours on cream — all darkened to hold ≥4.5:1

This is where the old palette breaks, and it is measured, not asserted:

| Role | Old | On cream | New | On cream |
|---|---|---|---|---|
| Confirmation | mint `#9FF0CE` | **1.17:1 — invisible** | `#0B7A57` | **4.69:1** |
| Structure / rules | violet `#8B6BFF` | 3.27:1 (worse at 40%) | `#5B3FD1` | **6.00:1** |
| Mono / system state | — | — | `#4E555C` | **6.65:1**, at 100% opacity |
| Ink | — | — | `#12161A` | 15.98:1, never pure black |
| Ribbon (non-text) | `#3D7BFF` | 3.37:1 — passes for non-text | unchanged | |

`#0B7A57` is derived one step darker than the product's own `--nv-em-deep`
`#0e8f6a` (3.58:1, not enough). It exists **only outside the panel**. Inside,
`#38e6a2` is untouched — same meaning, two renderings, because one of them is a
photograph and cannot be recoloured.

**A disclosure set at 55% opacity is not a disclosure.** Mono state type is 100%.

**No glowing ring.** The reference's pulsing white mark is exactly what our own
rejection criteria ban — *"a glowing box standing in for NEVAMIS itself"*,
*"NEVAMIS is never an object"*. The ribbon carries that role: a movement across
the field, not an entity in it. Adopting the ring would be a deliberate
amendment to `visual-bible.md` §1.

**End card:** radial `#1A1FC9` → `#0B0C86`. Matches the reference's measured
construction — hue 238–240°, saturation 87–92%, zero true black, 1.25× vignette.

---

## Shot sources — three generated, six photographed

| Shot | World | Source |
|---|---|---|
| C01 | DARK | CGI `DARK-01` + ffmpeg type |
| C02 | DARK | CGI `DARK-02` — the crane-out scale reveal, hardest of the three |
| C03 | DARK | CGI `DARK-03` |
| C04 | LIGHT | ffmpeg + CGI `RIBBON` |
| C05 | LIGHT | **screen capture** — `/portal/forwarding`, the number card |
| C06 | LIGHT | **screen capture** — `/portal/calls`, one call card |
| C07 | LIGHT | **screen capture** — `/portal/business`, the rule boxes |
| C08 | LIGHT | **screen capture** — `/portal/leads` + the real SMS summary |
| C09 | LIGHT | **screen capture** — `/portal/upcoming` |
| C10 | LIGHT | **screen capture** — `/portal/performance`, "Leads per week" |
| C11 | LIGHT | ffmpeg |
| C12 | LIGHT | **ffmpeg entirely — zero generation** |

---

## Credits

| Asset | Serves | Credits |
|---|---|---|
| `DARK-01` | C01 | 54 |
| `DARK-02` + one retry | C02 | 108 |
| `DARK-03` | C03 | 54 |
| `RIBBON` — one pass, keyed to alpha, **reused 5×** | C04, C05, C07, C09, C11 | 108 |
| Start frames + selection stills | all | 2.4 |
| **Total** | | **≈ 326 of 1,209** |

**Against the old plan's ~550: a 41% reduction, and generated shots drop from
twelve to three.** Every row preflighted with `get_cost:true` before it runs.

---

## The capture rules that keep it honest

**A screenshot of a fake field is worse than an abstract overclaim, because it
looks like evidence.** Therefore:

1. **The fixture rule — one rule, five holes closed.** Every seeded call row
   must have `bookingConfirmed = false` **and** `appointmentOutcome = NULL`.
   The product can neither book nor confirm (`agent-draft.ts:235` provisions
   `builtInToolsJson: ["end_call"]`), so a fixture showing otherwise would put
   the refuted claim back on screen as a photograph.
2. **Only fields that exist.** C06 carries `WHO`, `WHAT`, `HOW URGENT` — the
   2026-08-10 correction made visible. No `WHERE`, no `WHEN`.
3. **Capture from a purpose-built film seed on a local dev server, never
   production.** Prod has one real tenant; every lead card would render a real
   business name and a real caller's number.
4. **Two passes:** 1280×900 @2× for the 16:9 master, and a separate 430×930 @3×
   for 9:16 — so the vertical cut is re-laid out, never centre-cropped.

**Blocker:** Playwright is **not installed in `nevamis-engine`** — verified, the
package has vitest only and no `playwright.config`. It lives in `nevamis-site`.
It must be added to the engine before any capture pass can run.

**Found and reserved:** `/portal/business` carries a **refusal fieldset** that
renders unconditionally — the strongest truth artefact in the product. Not in
the 48s master, but it is the obvious spine for a follow-up cut.

---

## What is cut, and what survives

**Cut:** `KEY-01` the violet lattice · `KEY-02` the glass panes (replaced by the
real `/portal/business` form) · `KEY-03`'s C10 use · the dark `HERO-LOOP` for
nevamis.ca · **the dark world for C05–C11 entirely — 30 of the 48 seconds** ·
mint as the on-field confirmation colour · the all-16:9 pipeline · the stale
`TIME WINDOW HELD` example at `visual-bible.md:93`, which is the exact claim the
2026-08-10 correction struck · C12 ending on black · human silhouettes in the
light half (the light world is a seamless studio sweep with no floor to walk on).

**Survives:** the **entire 48.00s audio bed, untouched** — four voices
A→B→C→D at 0.80 dB spread · C01–C03 exactly as designed · all three silences at
their exact durations, now *derived* from the bed rather than asserted · the
sound design cue for cue · the locked closing line · every visual-bible rule
including "NEVAMIS is never an object" · the shared grain plate and optics as
the unifier across both halves · all type from the repo's own variable fonts.

---

## Open decisions

1. **C12's voice.** The A→B→C→D cycle completes at C10, so C12 is a ninth line
   outside the pattern — Jessica speaks C10 *and* C12, separated only by C11's
   0.60s. Deliberate, or should C12 return to James and close the loop?
2. **The glowing ring** from the reference — adopt as a bible amendment, or hold
   the line that NEVAMIS is never an object?
3. **Playwright in the engine** — add it, or capture another way?
