# NEVAMIS — *The Layer* · production board (corrected)

**Master 48.0s** · 16:9 · palette locked · **awaiting final approval**
**Line:** The work moves. You still decide.

Palette per approval: **electric blue** `#3D7BFF` information in motion ·
**violet** `#8B6BFF` structure, intelligence and rules · **white** `#EAF3EE`
typography · **mint** `#9FF0CE` successful confirmation only.

Corrections applied 2026-08-10, in response to the seven notes. What changed and
why is recorded at the foot of this file.

---

## Brand rule (correction 1)

The public brand in this film is **NEVAMIS**. Nothing else.

- Never "NEVAMIS AI". Never "NEVAMIS Automation", "Systems", "Technologies",
  "Solutions", or any suffix.
- **The letters "AI" do not appear anywhere in this film** — not in narration,
  not in on-screen type, not in the wordmark, not in a file name that could be
  shown, not in the end card.
- The closing card carries **NEVAMIS** and the campaign line. Nothing else.
- The legal entity "Nevamis AI Inc." is unchanged and stays off-screen. It is a
  registration, not the brand, and it never appears in the film.

The previous board described the product as an "AI receptionist" in its
narrator-selection rationale. That wording is removed.

---

## Pronunciation (correction 2) — INTERNAL PRODUCTION INSTRUCTION ONLY

> **This section must never be shown to the audience.** It is a direction to the
> voice engine and to whoever records or re-records narration. It never appears
> on screen, in a caption, in a subtitle track, in alt text, in the video
> description, or in any published asset.

**Target: NEV-uh-miss · /ˈnɛvəmɪs/**
Short "e" as in *never*. Emphasis on the first syllable. Spoken quickly as one
word, no pause, no hyphen, never spelled out.

**Wrong, and specifically rejected:** neh-VAH-miss · /nɛˈvɑːmɪs/ · "neevamis" ·
NEV-a-MISS · any reading that stresses the middle syllable.

*(The previous board stated the target as neh-VAH-miss. That was wrong and is
corrected here.)*

### The mechanism, and why it is not the obvious one

Tested before writing this down, because the obvious choice silently destroys
the brand name.

**Pronunciation dictionaries were built and measured, not assumed.** Method: for
each candidate, five takes at fixed seeds; measure the ratio of the middle-vowel
duration to the first-syllable vowel duration from the character-level timestamp
API (ratio ≥ 1.0 means the middle syllable is stressed — the rejected reading),
then transcribe each take back with `scribe_v1` to confirm the word was actually
spoken.

| Model | plain text | IPA **phoneme** rule | **alias** `Nevuhmiss` |
|---|---|---|---|
| `eleven_multilingual_v2` — **film master** | wrong stress **3/5** | **word missing 5/5** | wrong stress **0/5** ✅ |
| `eleven_flash_v2` — live phone agent | wrong stress **3/5** | spoken 5/5, correct ✅ | 1/5 dropped |

**The behaviour is model-dependent, and that is the whole finding.** On the film
master model an IPA `<phoneme>` rule does not adjust the pronunciation — it
removes the word. Five takes out of five rendered *"The company is called
Today."* Had this been applied to the final narration without testing, **the
brand name would have been absent from the film.**

**Film mechanism — locked:** alias dictionary `KOEuSZPGJDk3gmxvcDH5`
version `WIWATkk90AdVxkw4qUBH`, rule `NEVAMIS → Nevuhmiss` (plus `Nevamis`,
`nevamis`). Measured stress ratios 0.17–0.25 across five seeds, correct in 5/5,
brand present in 5/5.

**The alias must not contain hyphens.** `Nev-uh-miss` makes the engine speak the
hyphens as pauses, which is the defect that caused the 2026-07-23 rollback.
`Nevuhmiss`, unhyphenated, transcribes back as a single word.

Plain text is not viable on either model: **3 takes in 5 mis-stress the name.**
Leaving it to the engine is not neutral, it is a coin flip.

---

## The board

Revised C01–C03 (correction 5) and C08–C09 (correction 4). Timings recut to
hold 48.0s exactly.

| Shot | In–Out | Dur | On screen | Narration | Capability shown (real) |
|---|---|---|---|---|---|
| **C01** | 0:00–0:03.0 | 3.0 | One blue object drifts. At **0:02.6 it reaches an edge and falls**, dimming out. `MISSED` | *(silence)* | — |
| **C02** | 0:03.0–0:08.0 | 5.0 | Crane out: dozens more on unrelated paths, several already falling. Scale reveal | **in at 0:04.0** — "Every day, work arrives while you're busy earning the last of it." | Calls arrive when the line is unattended |
| **C03** | 0:08.0–0:11.5 | 3.5 | One passes camera close enough to read as a call, and dims | "Some of it never reaches you." | The loss is the missed call |
| **C04** | 0:11.5–0:16.5 | 5.0 | A violet **lattice resolves out of the dark beneath the fall**. Falling objects land and stop | "NEVAMIS is the layer underneath. It catches what would have fallen." | Answers 24/7 on the existing number |
| **C05** | 0:16.5–0:19.5 | 3.0 | Lattice extends across the volume in one move; drift becomes ordered traffic | *(silence)* | One line, always on |
| **C06** | 0:19.5–0:23.5 | 4.0 | One blue object arrives fast, is caught, comes to rest | "A call becomes information." | Call captured |
| **C07** | 0:23.5–0:28.5 | 5.0 | It opens into layered **glass panes**; structured fields resolve | "Who it is. What they need. Where. And when they want it." | Qualifies caller; captures job, address, **requested time window** |
| **C08** | 0:28.5–0:33.0 | 4.5 | Violet **rule-planes** sweep the panes. Compliant fields **pass straight through and lock**. One field **dims and is held** | "It follows the rules you set. What it isn't allowed to answer, it doesn't." | Owner-approved rules; **routine passes automatically**; quote refused by rule |
| **C09** | 0:33.0–0:37.5 | 4.5 | The captured record **locks itself — mint**, no external input. The held quote **branches away on a violet path to a human review plane** | "The job is captured. Anything needing judgment comes back to you." | Capture completes unattended; summary texted + emailed in seconds; exceptions route to a person |
| **C10** | 0:37.5–0:42.0 | 4.5 | Pull back: one strand among six. Two lit, two half-lit, two drawn dark | "This is one strand. The rest of the business is next." | Live / partial / planned, labelled honestly |
| **C11** | 0:42.0–0:44.5 | 2.5 | One building of light. Two tiny silhouettes cross a floor far below | *(silence)* | — |
| **C12** | 0:44.5–0:48.0 | 3.5 | Black. **NEVAMIS** resolves. Then the line | "NEVAMIS. The work moves. You still decide." | — |

Sum: 3.0 + 5.0 + 3.5 + 5.0 + 3.0 + 4.0 + 5.0 + 4.5 + 4.5 + 4.5 + 2.5 + 3.5 = **48.0s**

### What correction 5 bought

| | Old | New |
|---|---|---|
| First unmistakable loss | 0:08.0 | **0:02.6** |
| Narration begins | 0:08.0 | **0:04.0** |
| Silent open before anything happens | 8.0s | 2.6s |

Sound-off legibility: the first three seconds are a fall and the word `MISSED`.
No narration is required to understand the premise. The two protected silences
survive — C05, and **C11's 2.5s payoff, which stays entirely silent**.

---

## Narration script (corrected, 88 words)

> Every day, work arrives while you're busy earning the last of it.
> Some of it never reaches you.
> NEVAMIS is the layer underneath. It catches what would have fallen.
> A call becomes information.
> Who it is. What they need. Where. And when they want it.
> It follows the rules you set. What it isn't allowed to answer, it doesn't.
> The job is captured. Anything needing judgment comes back to you.
> This is one strand. The rest of the business is next.
> NEVAMIS. The work moves. You still decide.

Contains no instance of "AI". Two brand mentions, both bare.

---

## C10 — the six labels, verified (correction 6)

Verified against `origin/master` of `nevamis-engine`, not from memory:
`src/domain/canonical.ts` for availability, `src/app/portal/*` for shipped
surfaces, `src/domain/agent-draft.ts:235` for what a provisioned agent can do.

| # | Label | Status | Evidence | Lit? |
|---|---|---|---|---|
| 1 | `CALLS` | **LIVE** | `ai_front_desk` availability `"available"`; `/portal/calls` ships | full white |
| 2 | `LEADS` | **LIVE** | same capability; `/portal/leads` and `/portal/jobs` ship | full white |
| 3 | `SCHEDULING` | **PARTIALLY LIVE** | captures the caller's requested time window; **cannot book** — `agent-draft.ts:235` provisions `builtInToolsJson: ["end_call"]` and no calendar tool | 55% |
| 4 | `REPORTING` | **PARTIALLY LIVE** | `/portal/performance` ships; `automatic_lead_tracking` is `"coming_soon"` | 55% |
| 5 | `FOLLOW-UP` | **PLANNED** | `instant_lead_follow_up` availability `"coming_soon"` | 30% |
| 6 | `QUOTES` | **PLANNED** | `quote_recovery` availability `"coming_soon"`, and quoting is actively refused by rule — it is C08's held field | 30% |

Two live, two partial, two planned. **Three brightness tiers, not two** — the
previous board's binary lit/unlit could not express "partially live", which
would have forced either an overclaim or an underclaim on two of the six.

`REVENUE ENGINE` is deliberately **not** among the six: it is `private_pilot`,
and a strand on screen would read as a product on sale.

Nothing in C10 is lit that is not shipping. The narration line "the rest of the
business is next" is future tense on purpose.

---

## ⚠ C09 — an unresolved conflict, flagged rather than quietly resolved

**The requested line was:** *"The appointment is confirmed. Anything requiring
judgment comes back to you."*

**The first sentence is not true, and I did not write it in.** Evidence:

- `src/domain/agent-draft.ts:235` — every provisioned agent gets
  `builtInToolsJson: JSON.stringify(["end_call"])`. No booking tool, no calendar
  tool.
- `src/domain/entitlement-claims.ts:18-22` — the claim *"Books the job into your
  calendar while they are still on the line"* is **explicitly refused**, citing
  that same tool list and the absence of a tenant calendar credential.
- `entitlement-claims.ts:132` — "It does not connect to QuickBooks, a dispatch
  tool, a CRM, or a calendar."

NEVAMIS cannot create, confirm, or hold an appointment. A film that says
"the appointment is confirmed" would be claiming the one capability the codebase
refuses by name, and `npm run consistency` is built to catch exactly that.

**Your intent is fully achievable, and is what the board now does.** The intent
was: routine, rule-compliant work completes without the owner; only judgment
comes back. All of that is true of what actually ships:

| Completes with no owner input | Routes to a human |
|---|---|
| Answering, 24/7, on the existing number | Anything a rule forbids answering (quotes) |
| Qualifying the caller against owner-approved rules | Exceptions and edge cases |
| Capturing the job, address and requested time window | Consequential decisions |
| Refusing restricted topics | |
| Texting + emailing the owner a summary in seconds | |

So C09 keeps **your second sentence verbatim** and replaces only the untrue
clause:

> **"The job is captured. Anything needing judgment comes back to you."**

Same two-beat cadence, same meaning, and the owner is never shown approving an
ordinary booking. On screen the mint lock lands on `JOB CAPTURED` — the capture
completing by itself — rather than on a calendar slot that does not exist.

**This is the one item I need a decision on.** Options:

1. **Ship the truthful line above** (recommended, and what the board assumes).
2. Keep "appointment" and **build calendar booking first** — then it becomes
   true and the film can say it.
3. Overrule me and ship the original line, accepting that the film asserts a
   capability the product refuses.

Everything else on this board is ready to go.

---

## Every piece of on-screen text

All composited in ffmpeg from the real product typefaces. **Nothing generated.**
No instance of "AI" anywhere in this table.

| Shot | Text | Type | Placement |
|---|---|---|---|
| C01 | `MISSED` | Spline Sans Mono 300, white 60% | lower-left, fades with the falling object |
| C05 | `NEVAMIS` | Spline Sans Mono 400, white | lower-left, one beat only |
| C06 | `CALL CAPTURED` | Mono 400, blue | beside the resting object |
| C07 | `WHO` `WHAT` `WHERE` `WHEN` | Mono 300, white | one per glass pane, parallaxed in depth |
| C08 | `RULES CHECKED` · `QUOTE — HELD` | Mono 400, violet / dimmed | `QUOTE — HELD` dims as the rule-plane passes |
| C09 | `JOB CAPTURED` | Mono 400, white → **mint** | centre-right; the colour change *is* the completion |
| C09 | `NEEDS YOU` | Mono 300, violet | on the branch leaving toward the human review plane |
| C10 | `CALLS · LEADS · SCHEDULING · REPORTING · FOLLOW-UP · QUOTES` | Mono 300 | three brightness tiers per the table above |
| C12 | `NEVAMIS` | **Bricolage Grotesque 700**, white, +0.18em tracking | centre |
| C12 | `The work moves. You still decide.` | Bricolage 500, white 80% | below, after a 0.4s hold |

---

## Narrator (correction 3)

**Emma** (`56bWURjYFHyYyVf490Dp`, Australian, female) is the current NEVAMIS
receptionist voice, confirmed live on the agent. **Ava is retired** — the
previous board named Ava, and that is corrected.

The narrator must not be mistaken for the product speaking about itself, so all
three candidates are male and North American: unmistakably a different register
from an Australian female receptionist. No candidate is a female voice, and Emma
is excluded from consideration by definition.

| # | Voice | ID | Character |
|---|---|---|---|
| 1 | **Jon** | `MFZUKuGQUsGJPQjTS4wC` | Warm, grounded, mature. 6.85B chars/1y — the most-used candidate. Descriptor *calm* |
| 2 | **Peter** | `ZthjuvLPty3kTMaNKVKb` | Confident, resolute, credible. 6.35B chars, 1.35M clones |
| 3 | **Michael C. Vincent** | `uju3wxzG5OhpWcoi3SMy` | Warm bass, crisp highs, 1.51M clones |

Auditions are in `creative/nevamis/auditions/`. **Identical in every respect
except the voice** — same passage, same model, same settings, same fixed seed
`20260810`, same pronunciation dictionary. Any difference you hear is the voice.

Passage is real script, not a demo read:

> "Every day, work arrives while you're busy earning the last of it. Some of it
> never reaches you. NEVAMIS is the layer underneath. It catches what would have
> fallen. NEVAMIS. The work moves. You still decide."

Transcribed back, all three say the brand name in both positions. **One
difference worth your ear:** Jon and Peter render it *"Nevamiss"*; Michael C.
Vincent renders closer to *"Nevermiss"*, which drifts toward "never miss".

**No full narration has been recorded.** These are auditions only.

### Settings (identical across all three)

```
model_id            eleven_multilingual_v2   (film master; not turbo/flash)
stability           0.55
similarity_boost    0.80
style               0.10
use_speaker_boost   true
speed               0.95
seed                20260810
output_format       mp3_44100_192
pronunciation_dictionary_locators
                    KOEuSZPGJDk3gmxvcDH5 / WIWATkk90AdVxkw4qUBH   (alias)
```

---

## Music and sound design

| Section | Music | Sound design |
|---|---|---|
| C01 | **None.** Room tone only | The fall has a sound: a short descending absence at 0:02.6 |
| C02–C03 | A single low sub-drop as more fall | Sparse; the dimming is audible |
| C04 | **Pulse enters** — 62 bpm, one note, felt more than heard | **Motif cue #1** on the lattice resolving |
| C05–C06 | Pulse gains a floor; a second harmonic | Impact as the call lands, then quiet |
| C07 | Pulse detail — glass articulations on the beat | Each pane opening has its own soft transient |
| C08 | Held, no growth — tension through stillness | **Motif cue #2**, quieter, as the rule holds the quote |
| C09 | First warmth in the harmony | **Motif cue #3** on the mint lock — the only bright cue in the film |
| C10 | Opens out — the pulse becomes a field | Trails have doppler; scale is audible |
| C11 | **Music resolves and stops** | Room tone alone. The silence is the payoff |
| C12 | Silence | Wordmark lands on a single low tail, then nothing |

**The motif**: a two-note descending figure, ~180ms, low-mid. Three appearances,
never more. It becomes the website interaction cue and the ad ident.

**No** whoosh transitions, no riser into the logo, no corporate ukulele, no EDM
drop. Music licensed or original only.

---

## The cut family

All derived from **one master timeline**. Nothing is re-shot or re-generated.

| Version | Length | Built from | Purpose |
|---|---|---|---|
| **Master** | 48.0s | full board | Site film theatre, sales, presentations |
| **30s** | 30.0s | C01→C04→C06→C07→C08→C09→C12 | Paid social, pre-roll |
| **15s** | 15.0s | C01→C04→C09→C12 | Retargeting |
| **6s** | 6.0s | C09→C12 | Bumper. No narration |
| **Hero loop** | 8.0s | C05→C06 | Homepage. Silent, no text, seamless |
| **9:16 / 1:1** | 30s / 15s | reframed from master | Vertical social, re-laid out — never centre-cropped |

The 30s and 15s cuts now open on **C01**, which since correction 5 already
contains the fall at 0:02.6 — so the short cuts inherit the strong open instead
of needing a separate one.

---

## Wordmark animation — real typography

Built from the actual font file, rendered deterministically. **No generated
lettering anywhere.**

- **Face:** Bricolage Grotesque 700, self-hosted variable font already in the
  repo (`assets/fonts/`), tracking +0.18em.
- **Build:** letterforms → SVG paths via the real font → per-frame PNG sequence
  → ffmpeg. The type *is* the website's type.
- **Animation, 3.5s:**
  - `0.0–0.6s` black holds; a single mint point of light remains from C09
  - `0.6–1.4s` **N E V A M I S** resolve left to right, 90ms apart, each rising
    4px and settling on the website's own `--e-out` curve
  - `1.4–1.8s` tracking tightens from +0.24em to +0.18em as the mint point fades
  - `1.8–2.2s` hold
  - `2.2–2.8s` the line fades up beneath at 80% white
  - `2.8–3.5s` hold, then cut to black on the sound tail
- **Rule:** the wordmark never rotates, never carries a symbol, never gets a
  flare, and is **never followed by "AI"** or any other suffix.

---

## Truth check

Every capability entry sits inside `truth-basis.md`:

- **Answers on the existing number, 24/7** — live
- **Qualifies against owner-approved rules** — live
- **Captures job, address and requested time window** — live
- **Refuses what the rules forbid** (C08's held quote) — live, and provable
- **Texts and emails the owner a summary in seconds** — live
- **Routine capture completes with no owner input** (C09) — live
- **Exceptions route to a person** (C09's branch) — live
- **C10's two partial and two planned strands** — labelled, never claimed as shipping

**The film never shows a calendar filling itself in, and never says the word
"appointment".** It cannot, and it doesn't.

---

## Phase 1 spend on approval

**Zero Higgsfield credits have been spent.** Balance **1,209.04**, unchanged
since the direction pivot. No Phase 1 visual asset has been generated.

Ceiling **218 credits**. Five assets: `KEY-01` lattice, `KEY-02` glass panes,
`KEY-03` architecture, `HERO-LOOP` 8s seamless, `REF-MATERIAL` look plate.
Stills first at 0.12 each; video at 54. Then **stop and show results**.

---

## Correction log — 2026-08-10

| # | Note | What changed |
|---|---|---|
| 1 | Brand is NEVAMIS only; no "AI" in the film | Brand-rule section added; "AI receptionist" removed from narrator rationale; wordmark rule restated; script and text table verified free of "AI" |
| 2 | Pronunciation is NEV-uh-miss, internal only | Target corrected from the board's wrong neh-VAH-miss; marked never-show; dictionary built **and measured** — found IPA phoneme rules delete the word on the film model |
| 3 | Emma is the receptionist, not Ava; audition three | Ava reference corrected to Emma; three auditions generated at identical settings and fixed seed; no full narration recorded |
| 4 | Routine moves automatically; only judgment returns | C08 and C09 rewritten; C09's first sentence corrected for truth and **flagged for your decision**; `TIME WINDOW HELD → CONFIRMED` replaced with `JOB CAPTURED` + a `NEEDS YOU` branch; closing line preserved |
| 5 | Strengthen the opening | First fall moved 0:08.0 → **0:02.6**; narration 0:08.0 → **0:04.0**; C11's silent payoff preserved; all 12 shots recut to hold 48.0s |
| 6 | Complete C10 accurately | Six labels verified against `origin/master`; three brightness tiers introduced so "partially live" is expressible; `REVENUE ENGINE` excluded as `private_pilot` |
| 7 | Return for approval, spend nothing | This document. Zero credits spent; no Phase 1 asset generated |
