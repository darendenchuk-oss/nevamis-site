# NEVAMIS PILOT FILM — *The Work Moves*

**48 seconds · premium cinematic CGI and architectural motion design · founder-approved 2026-08-10**

This document supersedes `production-board.md` for the pilot. That file remains
the record of how the direction was arrived at; this is what gets made.

Public brand: **NEVAMIS** only. The letters "AI" appear nowhere in this film.

---

## Voice cast and pattern

Four recurring voices, cycling **A → B → C → D → A → B → C → D**, changing only
at scene transitions.

| | Voice | ID | Clones | Register |
|---|---|---|---|---|
| **A** | James — Husky, Engaging | `EkK5I93UQWFDigLMpZcX` | 1,768,970 | deep, grounded male |
| **B** | Cassidy — Crisp, Direct | `56AoDkrOh6qfVPDXZ7Pt` | 1,174,508 | confident female |
| **C** | Michael C. Vincent | `uju3wxzG5OhpWcoi3SMy` | 1,510,259 | mature male |
| **D** | Jessica Anne Bogart | `lxYfHSkYm1EzQzGhdbfc` | 901,336 | calm female |

**Pattern realised:** A B C D A B C D across C02–C10, then C12 to D.
**Note:** the eight-beat cycle completes at C10. C12 is a ninth narrated shot,
also assigned to D, so **D speaks C10 and C12 back to back** with only C11's
0.6s silence between. Flagged as a possible unintended repeat — see *Open
decisions*.

### One system, not four narrators — how that was achieved

All four are generated identically: `eleven_multilingual_v2`, seed `20260810`,
stability 0.55, similarity 0.80, style 0.10, speaker boost on, speed 0.95.

Then every line passes through **one shared chain, applied identically**:

```
highpass 85 Hz                  clear the sub so the 62 bpm pulse has room
-1.6 dB @ 250 Hz (Q 1.1)        take the box out of the room
+1.2 dB @ 6.5 kHz (Q 1.6)       a little air, matched across all four
aecho 0.92:0.55:38|72:.085|.045 one small hard room, short tail
loudnorm I=-23 TP=-1.5 LRA=7    level match AFTER the room, not before
alimiter 0.92
```

Normalising **after** the room chain is the part that matters — doing it first
lets the EQ and reverb pull the four voices apart again.

**Measured result: 0.80 dB spread** across all four voices (−23.5 to −22.7
LUFS integrated), measured on the finished files. *Caveat recorded honestly:*
the two-pass loudnorm measurement did not parse and it fell back to single
pass; the 0.80 dB figure is an independent measurement of the actual output,
so the requirement is met either way.

---

## The board — as specified, and as measured

Every line was generated and its real spoken duration measured against its
shot. **Four lines do not fit the specified boundaries.**

| Shot | In–Out | Dur | Voice | Narration | Spoken | Fit |
|---|---|---|---|---|---|---|
| **C01** | 0:00–0:02.6 | 2.6 | — | *(silent)* | — | — |
| **C02** | 0:02.6–0:08.3 | 5.7 | **A** James | "You built the business for freedom. Then running it started taking all of yours." | 4.86 | ok, 0.84 spare |
| **C03** | 0:08.3–0:14.0 | 5.7 | **B** Cassidy | "Calls arrive while your hands are full. Miss one, and the job can be gone." | 4.25 | ok, 1.45 spare |
| **C04** | 0:14.0–0:15.5 | 1.5 | — | *(silent — the turn)* | — | — |
| **C05** | 0:15.5–0:20.2 | 4.7 | **C** Vincent | "NEVAMIS starts there. Calls answered. Opportunities captured, day or night." | 5.13 | **over 0.43** |
| **C06** | 0:20.2–0:24.7 | 4.5 | **D** Jessica | "Who they are. What they need. Where, when, and how urgent." | 4.34 | ok, 0.16 spare |
| **C07** | 0:24.7–0:29.6 | 4.9 | **A** James | "It follows your rules. It never guesses. Important decisions come back to you." | 6.81 | **over 1.91** |
| **C08** | 0:29.6–0:33.5 | 3.9 | **B** Cassidy | "The job is captured. The next move is clear." | 2.44 | ok, 1.46 spare |
| **C09** | 0:33.5–0:40.0 | 6.5 | **C** Vincent | "Next, NEVAMIS will connect your company, automate repetitive work, and uncover value between systems." | 7.27 | **over 0.77** |
| **C10** | 0:40.0–0:44.4 | 4.4 | **D** Jessica | "So growth takes less of your life, not more." | 2.86 | ok, 1.54 spare |
| **C11** | 0:44.4–0:45.0 | 0.6 | — | *(silent)* | — | — |
| **C12** | 0:45.0–0:48.0 | 3.0 | **D** Jessica | "NEVAMIS. The work moves. You still decide." | 3.60 | **over 0.60** |

**The copy is not too long for the film — it is mis-distributed across the
shots.** Total speech is 41.56s; the three intentional silences are 4.7s;
that is 46.26s inside a 48.0s film. There is 1.74s of genuine slack. The
problem is that C07 and C09 are underweighted while C02, C03, C08 and C10 have
seconds to spare.

### The retimed board — every word kept, no overlap, 48.0s exact

Computed from the measured durations. All three silences preserved at their
specified lengths (2.6s head, 1.5s at the turn, 0.6s before the wordmark).

| Shot | Retimed in–out | Dur | Was | Δ |
|---|---|---|---|---|
| C01 | 0:00–0:02.60 | 2.60 | 0–2.6 | — |
| C02 | 0:02.60–0:07.71 | 5.11 | 2.6–8.3 | −0.59 |
| C03 | 0:07.71–0:13.46 | 5.75 | 8.3–14.0 | +0.05 |
| C04 | 0:11.96–0:13.46 | 1.50 | 14.0–15.5 | *(silence moves earlier)* |
| C05 | 0:13.46–0:18.84 | 5.38 | 15.5–20.2 | +0.68 |
| C06 | 0:18.84–0:23.43 | 4.59 | 20.2–24.7 | +0.09 |
| C07 | 0:23.43–0:30.48 | **7.05** | 24.7–29.6 | **+2.15** |
| C08 | 0:30.48–0:33.17 | 2.69 | 29.6–33.5 | −1.21 |
| C09 | 0:33.17–0:40.69 | **7.52** | 33.5–40.0 | **+1.02** |
| C10 | 0:40.69–0:43.55 | 2.86 | 40.0–44.4 | −1.54 |
| C11 | 0:43.55–0:44.15 | 0.60 | 44.4–45.0 | — |
| C12 | 0:44.15–0:48.00 | 3.85 | 45.0–48.0 | +0.85 |

This is the version to judge. **It does change the CGI shot plan** — C07 grows
to just over seven seconds, which is a long time for rule-planes to sweep.
The alternative is to shorten the C07 and C09 copy instead; see *Open
decisions*.

---

## Sound design

62 bpm. The two-note motif appears exactly three times and is the film's sonic
signature: **falling** at C01, **resolved** at C04, **resolved once more** at
C12.

| Cue | At (retimed) | What |
|---|---|---|
| Room tone | 0:00, throughout | Pink noise, lowpassed to 320 Hz, −30 dB. A vast cold space, felt not heard |
| Two-note signal, falling | 0:00.7 | 196 Hz → 147 Hz. The figure descends — unresolved |
| Sub-drop | 0:01.95 | Chirp 64 Hz sweeping down, exponential decay, as the signal falls into darkness |
| **Pulse in** | 0:11.96 | 55 Hz, 62 bpm, one note per beat, felt more than heard |
| **Motif resolves** | 0:12.01 | 147 Hz → 196 Hz — the same figure, now *rising*. This is the turn |
| Mint confirmation | 0:30.98 | 294 Hz + 441 Hz, short. The only bright cue in the film |
| **Pulse stops** | 0:43.55 | Silence at C11. Nothing under the silhouettes |
| Motif, final resolve | 0:45.50 | The figure a third and last time |
| Low impact | 0:45.50 | 41 Hz, restrained. **No trailer boom** |

Master bus: limiter at 0.95, then `loudnorm I=-16 TP=-1.0 LRA=9` — broadcast-
adjacent, leaving headroom for a real mix later.

---

## Deliverables

| File | What it is |
|---|---|
| `NEVAMIS-pilot-RETIMED-48s.mp3` | **The one to judge.** Every word, no overlaps, 48.00s |
| `NEVAMIS-pilot-AS-SPECIFIED-48s.mp3` | The exact specified boundaries, so the four overruns are audible |
| `NEVAMIS-pilot-VOICE-ONLY-48s.mp3` | Performance without sound design |
| `pilot-timing.json` | Machine-readable cue sheet and measured durations |

---

## On-screen text

All composited in post from the real product typefaces. **Nothing generated.**

| Shot | Text |
|---|---|
| C01 | `MISSED` |
| C03 | `CALL` → `LEAD` → `LOST` |
| C05 | `CALL ANSWERED` · `LEAD CAPTURED` · `DAY OR NIGHT` |
| C06 | `WHO` · `WHAT` · `WHERE` · `WHEN` · `URGENCY` |
| C07 | `RULES CHECKED` · `NEEDS YOU` |
| C08 | `JOB CAPTURED` |
| C09 | `CALLS · LIVE` `LEADS · LIVE` `SCHEDULING · EXPANDING` `REPORTING · EXPANDING` `FOLLOW-UP · NEXT` `QUOTES · NEXT` |
| C12 | `NEVAMIS` / `THE WORK MOVES. YOU STILL DECIDE.` |

Live glows fully · expanding pulses at medium · next remains outlined but
visibly connected.

---

## Pronunciation — INTERNAL ONLY, never shown to the audience

**NEV-uh-miss · /ˈnɛvəmɪs/.** Applied via alias dictionary
`KOEuSZPGJDk3gmxvcDH5` / `WIWATkk90AdVxkw4qUBH` (`NEVAMIS → Nevuhmiss`).

On `eleven_multilingual_v2` an IPA **phoneme** rule deletes the word entirely —
5 takes of 5. The alias is the only mechanism that works on the film model, and
it is validated across both genders and all four cast voices.

**Standing rule:** the brand name is never immediately followed by "call" or
"calls". `marketing.ts:84` blocks *"never miss a call"* as an absolute claim,
and /ˈnɛvəmɪs/ is phonetically adjacent to a non-rhotic "never miss" on every
voice tested. The current script satisfies this.

---

## Production rules (carried from the brief)

- No people, faces, contractors, talking heads or simulated live action.
- Exactly four recurring voices, changing only at scene transitions.
- Every performance controlled, natural and conversational.
- All legible typography added in post.
- Current and future capabilities must remain visually distinguishable.
- **The complete 48-second voice and sound-design preview exists before any
  credit is spent on CGI.** ✅ Done — see *Deliverables*.

**Higgsfield credits spent to date: zero. Balance 1,209.04.**
