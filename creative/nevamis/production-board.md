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
| **C02** | 0:03.0–0:08.0 | 5.0 | Crane out: dozens more on unrelated paths, several already falling. Scale reveal | **in at 0:04.0** · *Cassidy* — "It's 4:40. Your hands are full. The phone rings. Again." | Calls arrive when the line is unattended |
| **C03** | 0:08.0–0:11.5 | 3.5 | One passes camera close enough to read as a call, and dims | *Cassidy* — "No message. You never find out who called." | The loss is silent — that is the point |
| **C04** | 0:11.5–0:16.5 | 5.0 | A violet **lattice resolves out of the dark beneath the fall**. Falling objects land and stop | **SWITCH 1** · *M. C. Vincent* — "NEVAMIS is the layer under your number. It answers at 4:40." | Answers 24/7 on the **existing number** |
| **C05** | 0:16.5–0:19.5 | 3.0 | Lattice extends across the volume in one move; drift becomes ordered traffic | *(silence)* | One line, always on |
| **C06** | 0:19.5–0:23.5 | 4.0 | One blue object arrives fast, is caught, comes to rest | *M. C. Vincent* — "Nine at night. On a Sunday. It picks up." | 24/7 answering |
| **C07** | 0:23.5–0:28.5 | 5.0 | It opens into layered **glass panes**; structured fields resolve | *M. C. Vincent* — "Who called. What broke. The address. The time they want you." | Qualifies caller; captures job, address, **requested time window** |
| **C08** | 0:28.5–0:33.0 | 4.5 | Violet **rule-planes** sweep the panes. Compliant fields **pass straight through and lock**. One field **dims and is held** | *M. C. Vincent* — "Your rules run it. It won't make up a price." | Owner-approved rules; **routine passes automatically**; quote refused by rule |
| **C09** | 0:33.0–0:37.5 | 4.5 | The captured record **locks itself — mint**, no external input. The held quote **branches away on a violet path to a human review plane** | **SWITCH 2** · *Cassidy* — "Texted to you before you're off the ladder. Judgment stays yours." | Summary texted + emailed in seconds; exceptions route to a person |
| **C10** | 0:37.5–0:42.0 | 4.5 | Pull back: one strand among six. Two lit, two half-lit, two drawn dark | **SWITCH 3** · *M. C. Vincent* — "Two are live. The rest are half-built or on paper." | Live / partial / planned, stated out loud |
| **C11** | 0:42.0–0:44.5 | 2.5 | One building of light. Two tiny silhouettes cross a floor far below | *(silence)* | — |
| **C12** | 0:44.5–0:48.0 | 3.5 | Black. **NEVAMIS** resolves. Then the line | **SWITCH 4, in-line** · *M. C. Vincent* — "NEVAMIS. The work moves." → *Cassidy* — "You still decide." | — |

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

## Narration script v2 — two voices, 87 words

Rewritten 2026-08-10 for impact. The v1 script explained a system; this one
names a loss the owner has already lived. Every line is timed and fits its shot.

| Shot | Voice | Line | Spoken |
|---|---|---|---|
| C02 | **Cassidy** | "It's 4:40. Your hands are full. The phone rings. Again." | 2.88s / 4.00s |
| C03 | **Cassidy** | "No message. You never find out who called." | 1.86s / 3.50s |
| C04 | **M. C. Vincent** | "NEVAMIS is the layer under your number. It answers at 4:40." | 4.04s / 5.00s |
| C06 | **M. C. Vincent** | "Nine at night. On a Sunday. It picks up." | 2.60s / 4.00s |
| C07 | **M. C. Vincent** | "Who called. What broke. The address. The time they want you." | 4.13s / 5.00s |
| C08 | **M. C. Vincent** | "Your rules run it. It won't make up a price." | 2.69s / 4.50s |
| C09 | **Cassidy** | "Texted to you before you're off the ladder. Judgment stays yours." | 3.07s / 4.50s |
| C10 | **M. C. Vincent** | "Two are live. The rest are half-built or on paper." | 3.20s / 4.50s |
| C12 | **M. C. Vincent** | "NEVAMIS. The work moves." | 2.04s / 2.10s |
| C12 | **Cassidy** | "You still decide." | 1.07s / 1.40s |

Contains no instance of "AI". Two brand mentions, both bare. Every line fits —
verified by generating each and measuring against its shot, not by estimating.

**Why this beats the v1 script.** v1 opened on "Every day, work arrives while
you're busy earning the last of it" — a sentence about a category. v2 opens on
"It's 4:40. Your hands are full. The phone rings. Again." — a sentence about a
Tuesday. The whole film now runs on physical detail the owner recognises:
*4:40*, *nine at night on a Sunday*, *before you're off the ladder*. C03 lands
the cruelty of the actual problem — "You never find out who called" — which is
the fact that makes a missed call worse than a lost one.

C10 stopped being a promise and became an admission: **"Two are live. The rest
are half-built or on paper."** Saying that out loud is the most persuasive
sentence in the film, because no one selling vapour would say it.

### C12 is split across both voices — this needs explicit sign-off

The locked line is **verbatim and unaltered**: same words, same order, same
punctuation. But it is *read* by two people — he says "NEVAMIS. The work
moves.", she says "You still decide." Splitting a line marked "locked" is a
reading decision, not a copy change, and should be approved on purpose rather
than assumed.

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

## The voice scheme — two voices, one rule

**The rule: the woman speaks about *you*. The man speaks about *the layer*.**
Neither ever crosses, and only the man ever says the brand name.

A viewer cannot state that rule, but they already understand the thing it
tracks — the person losing the work and the thing that catches it are not the
same party. So when the film changes hands, it reads as a fact, not a
production flourish.

| Voice | Clones | Shots | What it represents |
|---|---|---|---|
| **Cassidy** — crisp, direct, middle-aged American | 1,174,508 · **rank 2 of 881 women** | C02, C03 · C09 · the last four words of C12 | **The owner's side.** What he loses, what reaches his hand, what he still decides. Never says the brand, never describes a capability |
| **Michael C. Vincent** — confident, middle-aged American | 1,510,259 · **rank 5 of men** | C04 · C06–C08 · C10 · the first four words of C12 | **The layer's witness.** What it is, what it does, what it refuses, what isn't built. Never says "I" or "we" |

**The four switches.** C04 on the turn — he arrives at the exact frame the
lattice resolves, and his first act is to repeat her timestamp: she says "It's
4:40", he says "It answers at 4:40". Two witnesses, one minute. C09 on the mint
lock — the instant the work reaches the owner, her voice returns. C10 on the
pull-back — what is and isn't built is a fact about the layer, so he states it.
C12 in-line, the only mid-line switch in the film: forty-four seconds of an
absorbed rule now hands the last four words to the only voice that has ever
spoken for the owner. The campaign line stops being a claim and becomes a
handover.

**Three guards that keep it legible rather than decorative:**
1. The man never says "I" or "we", so he cannot harden into a character or be
   heard as the product describing itself.
2. The woman never describes a capability, so she can never be heard as a
   receptionist answering a phone — the one register this film cannot afford.
3. Pronoun discipline: in her lines the ringing thing is "the phone", never
   "it". "It" belongs to him and always means the layer. One pronoun, one
   referent, all 48 seconds.

**Why these two and not the top of the clone list.** The most-cloned voices
skew young, casual and upbeat, because that is what social-media content
demands — Mark (3.75M), Hope (1.23M), Brittney (979k) would each destroy a dark
architectural film inside the first four seconds, over a fall. Cassidy is the
highest-cloned woman whose register survives; Hope outranks her by 4.5%, inside
the noise, and is disqualified on read. Michael C. Vincent was chosen on
**measured** evidence — see below.

Emma (Australian, female) is the live receptionist. Both film voices are
American, and guard (2) means no line in the film could be mistaken for the
product speaking about itself.

---

## Narrator selection — measured, and one earlier note corrected

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

### The wordmark shootout — and a note of mine that was wrong

The brand name lands once at the wordmark reveal, and that is the most
important two seconds of audio in the film. All nine most-cloned men were
measured saying "NEVAMIS. The work moves." across seven fixed seeds, scored on
whether the name was transcribable at all and whether it drifted to "never".

| Voice | Clones | name missing | heard as "never" | wrong stress |
|---|---|---|---|---|
| **Michael C. Vincent** | 1,510,259 | **1/7** | **2/7** | 0/7 |
| Mark | 3,751,295 | 0/7 | 4/7 | 0/7 |
| James | 1,768,970 | 0/7 | 4/7 | 0/7 |
| Adam Stone | 1,503,501 | 0/7 | 4/7 | 0/7 |
| Peter | 1,348,375 | 0/7 | 5/7 | 0/7 |
| Spuds Oxley | 2,509,390 | **3/7** | 3/7 | 0/7 |
| Christopher | 1,308,779 | 3/7 | 3/7 | 0/7 |
| Adam (dark) | 1,915,918 | 1/7 | 5/7 | 0/7 |
| Adam | 1,255,390 | 0/7 | 6/7 | 0/7 |

**Stress is correct on every voice (0/7 wrong across all nine)** — the alias
dictionary works universally, which is the thing that actually had to be true.

**An earlier note in this file was wrong and misled the selection.** The v1
board recorded that Michael C. Vincent "renders closer to *Nevermiss*". That
came from a *single take of a different passage*. Measured properly — seven
seeds, in the exact wordmark position — he is the **least** "never"-prone of the
nine. The note is withdrawn.

### The "never miss" adjacency — a real constraint, verified

`nevamis-engine/src/domain/marketing.ts:84` lists **"never miss a call"** as
`PROHIBITED_PHRASES[0]`: *"absolute claim; the agent answers eligible forwarded
calls, not all calls."* ("Never Miss" was also a retired plan name.)

The approved pronunciation /ˈnɛvəmɪs/ is phonetically adjacent to a non-rhotic
"never miss" — every one of the nine voices drifted there at least twice. This
is a property of the pronunciation itself, not of any voice, so it cannot be
engineered away without abandoning the approved reading.

**Mitigation, adopted:** the brand name is never immediately followed by
"call", "calls" or "a call", so the blocked phrase can never assemble in the
ear. The current script satisfies this — C04's next word is "is", C12's is
"The". **This is now a standing rule for all NEVAMIS voice work.**

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
