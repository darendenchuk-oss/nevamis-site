# NEVAMIS — storyboard (CGI direction)

**Working title:** *The Layer*
**Length:** 62 seconds · 16:9 master · 9:16 and 1:1 reframed, never cropped
**Line:** The work moves. You still decide.

No humans, no faces, no character. The protagonist is the system; the drama is
information finding its place. Palette, materials and bans: `visual-bible.md`.
Claim ceiling: `truth-basis.md`.

---

## Structure

| | Movement | Beats |
|---|---|---|
| I | **Disconnection** — activity in darkness, opportunities falling away | 1–3 |
| II | **The layer** — NEVAMIS forms and catches | 4–5 |
| III | **One call, all the way through** | 6–9 |
| IV | **Scale** — the same logic under a whole company | 10–11 |
| V | **Wordmark** | 12 |

---

## Shot list

| ID | Sec | What is on screen | Camera | Colour | Audio | Composited type |
|---|---|---|---|---|---|---|
| **C01** | 0–5 | Black. Single blue data-object drifts in from frame right, alone, tumbling slightly. Enormous dark architecture barely readable behind it. | slow push, 35mm equiv | blue on black | low room tone, one soft impact | — |
| **C02** | 5–11 | Wide: dozens of these objects moving through the volume on unrelated paths. None touch. Scale reveal — the space is vast. | slow crane up | blue | pulse enters, sparse | — |
| **C03** | 11–17 | Several objects reach the edge of a lightless drop and **fall**, dimming as they go. One passes camera close enough to see it is a call. | locked, objects move | blue dimming to nothing | pulse thins, a low absence | `MISSED` once, small, low-left |
| **C04** | 17–23 | Beneath the fall, a **lattice resolves out of the dark** — violet, precise, architectural. It was always there; the light simply reaches it. Falling objects land on it and stop. | slow reveal, tilt down | violet emerges | first confirmation cue | — |
| **C05** | 23–28 | The lattice extends across the whole volume in one continuous move. Objects that were drifting now travel along it, ordered. | slow lateral track | violet + blue | pulse gains a floor | `NEVAMIS` mono, once, small |
| **C06** | 28–34 | **One call arrives.** A single blue object enters fast, is caught, and comes to rest on the lattice. Camera settles with it. | push in to rest | blue | impact, then quiet | `CALL CAPTURED` |
| **C07** | 34–40 | The object **opens** into layered glass panels — the caller's need, resolving into structured fields. Real product typography, composited. | slow orbit 20° | blue → white | pulse detail | `WHO · WHAT · WHERE · WHEN` |
| **C08** | 40–46 | Violet **rule-planes** slide across the panels and check them. One field is held back by a rule and dims — visibly refused, not ignored. | locked, motion inside | violet over blue | two-note motif | `RULES CHECKED` · `QUOTE HELD` |
| **C09** | 46–51 | What survives resolves into a **held time window** and a summary object that leaves along a light trail. **Mint, first real use.** A second trail returns and the window locks — the human confirmation, shown as a returning signal, not a person. | slow push | **mint** | confirmation cue | `TIME WINDOW HELD` → `CONFIRMED` |
| **C10** | 51–56 | Pull back hard: the single flow we followed is **one strand among many** across a whole architecture — leads, scheduling, follow-up, quotes, records, reporting as parallel structures. Live strand solid; the others drawn but unlit. | fast-but-smooth crane out | violet field, one mint strand | pulse opens out | six labels, the unlit ones dimmed |
| **C11** | 56–59 | The architecture reads as a single building of light. At the very bottom of frame, **two tiny silhouettes** cross a floor — scale only, no features. | locked wide | deep blue-black | pulse resolves | — |
| **C12** | 59–62 | Black. **NEVAMIS** resolves in white, letter-spaced. Then the line. | locked | white on black | motif, then silence | `NEVAMIS` / *The work moves. You still decide.* |

---

## What the film refuses

- **No face, no character, no actor.** Silhouettes appear once, at C11, at
  architectural scale, and are unidentifiable by design.
- **No generated type.** Every word on screen is composited in ffmpeg from the
  real product's typefaces.
- **No calendar filling itself in.** C09 shows a *held time window* and a
  returning confirmation, because that is what the product does.
- **Mint appears three times only** — C04, C09, C10. It means *done*.
- **No music swell into the wordmark.** The pulse resolves and stops.

---

## Production order and cost

Still-first, always: generate a still, select, then use it as `start_image`.
A rejected still costs 0.12; a rejected clip costs 54.

**Phase 1 (website needs these five):**

| Asset | From | Purpose |
|---|---|---|
| `KEY-01` | C04 still | The lattice forming — the single most important image in the system |
| `KEY-02` | C07 still | Glass panels opening — proof the product is a product |
| `KEY-03` | C10 still | The whole architecture — the platform image |
| `HERO-LOOP` | C05 → C06, 8s seamless | Homepage hero |
| `POSTER` | frame from HERO-LOOP | Poster-first paint, before any video byte |

**Estimated spend for Phase 1:** ~12 stills (1.4 credits) + 2 video shots with
one retry each (216 credits) ≈ **218 of 1,209**.

**Phase 3 (remaining):** C01, C02, C03, C08, C09, C11 ≈ 6 shots, ~324 with
retries. C12 is composited, free.

**Total projected ≈ 550 of 1,209**, leaving ~650 for selection and failures.

---

## Rejection criteria

Reject and record: any human face · a recognisable recurring figure · gibberish
text · a logo that is not NEVAMIS · circuit-board or wireframe cliché · neon
signage · a glowing box standing in for NEVAMIS itself · mint used anywhere but
confirmation · particles with no destination · a frame that fails the one-frame
test.
