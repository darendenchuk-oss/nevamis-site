# NEVAMIS — storyboard

Ten beats from `film-treatment.md`. Every shot carries what a generation needs
and what post needs. Shots marked **P1** are produced in Phase 1 because the
website needs them; the rest are produced in Phase 3 against the rebuilt site.

Grade, palette and banned imagery: `visual-bible.md`. Claim ceiling:
`truth-basis.md`.

**Global:** 16:9 master, 24fps feel, 35mm unless stated, one camera move per
shot, warm practicals on people / cool light on system, film grain, real black
point `#02080D`.

---

## Shot table

| ID | Beat | Sec | Environment | Subject / action | Lens · move | Light | Audio | On-screen (mono, composited in post) |
|---|---|---|---|---|---|---|---|---|
| **S01** `P1` | 1 | 0–6 | Unfinished basement, open breaker panel | Macro: torque screwdriver seating a breaker; Ray's hands only | 100mm macro · slow push 6% | Warm worklamp `#F0B462` from frame left, deep falloff | Panel hum, ladder settle, no music | — |
| **S02** | 1 | 3–6 | Same | Ray's face lit from below by the lamp, eyes on the work | 50mm · locked | Same source, underlit | Room tone | — |
| **S03** `P1` | 2 | 6–11 | Same | Phone in chest pocket, screen-up, buzzing against fabric. He does not look | 85mm · locked, shallow | Warm, screen glow just visible | Buzz is loudest element | — |
| **S04** `P1` | 3 | 11–17 | Driveway, dusk | Work van, interior light rising as the call connects | 35mm · slow lateral track L→R | Cool ambient dusk, one warm interior | Motif cue #1 | `CALL ANSWERED` lower-left |
| **S05** | 4 | 17–24 | Black field | Caller fragments resolving into structured fields | — · type only | — | Low pulse enters | `panel humming · no power to kitchen · tonight · Millwoods` |
| **S06** | 5 | 24–31 | Shop wall → black | Ray's handwriting on a whiteboard dissolving into the mono rule list | 50mm · slow push | Practical shop light → cool | Pulse continues | `after 6pm → urgent only` · `no panel work quoted by phone` |
| **S07** | 6 | 31–37 | Black field | Job / address / **time window** captured. A quote request visibly held back by a rule | — · type only | — | Motif cue #2 | `JOB CAPTURED` · `QUOTE → HELD BY RULE` |
| **S08** | 7 | 37–43 | Suburban kitchen, evening | Caller, phone to ear, shoulders dropping; returns to her evening | 50mm · locked | Warm kitchen practical | Room, kettle | — |
| **S09** `P1` | 8 | 43–48 | Driveway, night | Ray closing van rear doors; phone lights his face — **warm + cool in one frame** | 35mm · slow push | Warm sodium + cool screen | Doors, motif tail | Summary glimpsed, unreadable by design |
| **S10** | 9 | 48–53 | Abstract field | The one flow repeats and widens; live solid, future outlined | — · slow pull back | Cool | Pulse opens out | `leads · scheduling · follow-up · quotes · records · reporting` |
| **S11** `P1` | 10 | 53–56 | Ray's kitchen, night | Dinner, other people. Phone face-up shows one line. **One tap.** Face-down | 50mm · locked | Warm domestic | Room noise only — music **out** | one line, then nothing |
| **S12** | 10 | 56–58 | Black | Wordmark, then line | — | — | Motif cue #3, then silence | `NEVAMIS` / *The work moves. You still decide.* |

---

## Phase 1 production subset

The website needs five things. Nothing else is generated yet.

| Asset | Built from | Why the site needs it |
|---|---|---|
| **REF-RAY** | Soul 2.0 character reference | Identity lock so every later shot is the same man. Generated once, reused as reference for all Ray shots. |
| **REF-ENV** | Nano Banana Pro still | Basement/panel environment lock — lighting and palette reference for continuity. |
| **HERO-LOOP** | S01 → S03 → S04 as a seamless 6–10s loop | The homepage hero. Must loop invisibly and read at 390px wide. |
| **PROOF-01/02/03** | S04, S09, S11 as stills | Section imagery for the rebuilt homepage; S09 and S11 are the two emotionally load-bearing frames. |
| **POSTER** | Frame pulled from HERO-LOOP | Poster-first rendering so the hero paints before any video byte arrives. |

**S09 and S11 are the two that matter most.** S09 is the visual bible's reserved
warm-plus-cool frame; S11 is the campaign line made literal. If credits get
tight, they are the last two to be cut.

---

## Generation strategy

1. **Still first, always.** Generate and select a still, then use it as the
   `start_image` for video. A rejected still costs a fraction of a rejected clip.
2. **Identity before variety.** REF-RAY is locked before any shot containing him
   is attempted. Wardrobe, age, build and hands stay fixed by reference.
3. **Seedance 2.0 for motion** — it takes `start_image` + `end_image` and image
   references, which is exactly the control this storyboard is written for.
   Cinema Studio Video for shots where camera character matters more than
   identity.
4. **No UI is ever generated.** S05, S06, S07, S10 and S12 are type on black,
   composited in ffmpeg from the real product's typography. This is why they cost
   almost nothing and why they will be the most credible seconds in the film.
5. **Loop discipline.** HERO-LOOP is generated with matched first and last
   frames so it cycles without a cut. A loop that visibly restarts is rejected.

---

## Rejection criteria

Reject and record the reason: malformed hands · wrong or impossible tools ·
a breaker panel that is not wirable · gibberish text anywhere in frame · a face
that is not REF-RAY · wardrobe drift · a calendar or booking UI · mint used
anywhere but confirmation · a robot, orb, HUD or particle field · a shot that
fails the one-frame test in `visual-bible.md`.
