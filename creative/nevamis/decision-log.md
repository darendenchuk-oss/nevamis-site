# NEVAMIS — decision log

The durable record for the cinematic brand system, website overhaul and flagship
film. One agent, three phases, one continuous project. **This file is the
source of truth for decisions.** If a session is compacted or resumed, read this
first, then `visual-bible.md`, then `generation-manifest.json`.

Rule: when new evidence changes a decision, EDIT the decision and note what
changed it. Do not leave two versions standing.

---

## Established state at project start — 2026-08-10

Verified, not assumed:

| Thing | State |
|---|---|
| site | `nevamis-site` @ `1b79483`, clean, 0 behind `origin/main` |
| engine | `nevamis-engine` @ `858f31e` (moves constantly; Revenue OS is active) |
| registry | `nevamis-halo` @ `921eba3`, Frontier gate PASS |
| site tests | 191 passing, consistency green, suite-collection guard green |
| Main Apex | `apex/e2e-onboarding-rehearsal` unmerged, untouched — do not touch |
| production perf | LCP 152–368 ms, CLS ≤ 0.0001 — this is the budget the film must not spend |

### External production tooling — checked, not assumed

| Tool | Status |
|---|---|
| **Higgsfield** | MCP authenticated. **1,210 credits, Plus plan.** `unlim.available: false`, so every generation is paid. |
| Higgsfield models | Seedance 2.0 (start+end frame, image/video/audio refs, identity consistency, 4K), Kling v3.0 (multi-shot, motion transfer), Cinema Studio Video v2 (camera/colour/genre), FLUX 3 Video (multi-frame i2v, 20s), Marketing Studio |
| **ElevenLabs** | API keys present in `ai-assistant/.env` and `nevamis-engine/.env.local`. Never printed. |
| **ffmpeg** | 8.1.2-full — post-production, compositing, captions, encoding all executable locally |

1,210 credits is the hard constraint that shapes the whole production plan.
Three exceptional assets beat thirty mediocre ones because thirty is not
affordable. Every generation gets a purpose, a prompt and a manifest row
BEFORE it is spent.

---

## D1 — The brand name, and the one place it cannot change

**Decision:** the wordmark and all marketing prose become **NEVAMIS**. The legal
entity name **"Nevamis AI Inc."** stays exactly as it is wherever it appears as
a legal identifier.

**Why:** the directive forbids attaching "AI" to the company name and forbids
"Nevamis". It also states it does not supersede compliance requirements, and
changing company legal identity is an explicit escalation item. "Nevamis AI
Inc." is the filed entity; CASL requires accurate sender identification, and the
terms and privacy pages identify the contracting party. Renaming those is a
legal act, not a copy edit.

**So the split is:** brand voice → NEVAMIS. Legal identifier → Nevamis AI Inc.,
untouched, in terms, privacy, CASL footers and any contract surface.

**Scale, measured:** 284 brand-word instances of "Nevamis" across the HTML, 28
of "Nevamis AI Inc.", 5 already "NEVAMIS".

**Open risk:** the ElevenLabs phone agent speaks the company name, and the live
agent prompt is edited by hand in their dashboard — no commit changes what the
phone says. A brand-name change has a spoken component that this repository
cannot ship. Tracked, not solved here.

---

## D2 — Positioning

NEVAMIS is an **AI automation and integration platform for business**. The
customer-communication capability that exists today is the **entry point**, not
the identity.

Three claim tiers, kept separate everywhere, in copy and on film:

- **LIVE NOW** — what a customer gets today
- **BEING BUILT** — committed, dated where possible
- **PLATFORM DIRECTION** — where the architecture goes

The existing repo already has machinery for this discipline: `docs/CLAIMS-LEDGER.md`
and a consistency guard that fails the build on unsupported claims. The new
positioning is written INTO that machinery rather than around it.

---

## D3 — Phase order is a dependency, not a preference

Phase 1 identity → Phase 2 website → Phase 3 film. The film shows real product
UI; shooting it before the site is rebuilt would film an interface about to be
replaced. This is the directive's own reasoning and it is correct.

Consequence: Phase 1 produces only what the website needs to be built — proof
shots, environment and subject references, one hero loop, poster frames. The
flagship film is assembled last.

---

## Log

- **2026-08-10** — Project opened. Tooling verified, credits counted, durable
  state created. `creative/` added to `_config.yml` exclude so working material
  is not published; finished media goes to `assets/` and is.

---

## D4 — The capability ceiling, and who was lying

**Decision:** `creative/nevamis/truth-basis.md` is the factual floor. Every line
of copy and every frame of film is checked against it.

**The finding that reframes the project:** the engine's source of truth is
already honest, and the WEBSITE is what overstates. `agent-draft.ts:235`
provisions every tenant agent with `["end_call"]` and no booking tool;
`entitlement-claims.ts:18-22` explicitly refuses "books the job into your
calendar" and cites that line as proof. Meanwhile the homepage asserts booking
in up to ten places, and `hvac.html`'s meta description promises "books the
visit" to search engines.

**Resolved by direct reading, not by preferring an agent.** One audit pass
reported `canonical.ts` still claiming the agent books; it does not, on master.
That text survives only on `lane-f-oss-review`, two commits behind, which is
what that pass had open. Verified myself on `origin/master`.

**Consequence:** the overhaul cannot ship on top of the site's current claims.
The truth debt in truth-basis.md is fixed as part of Phase 2, not filed after it.

---

## D5 — The reposition is achievable, and the repo will enforce it

Production has zero client workspaces, zero subscriptions, $0 collected. So "AI
automation and integration platform" is not true today as a description of
inventory. It IS true as a description of architecture, which is what the
directive actually asks for, and it survives only with the three tiers kept
visibly separate: LIVE NOW / BEING BUILT / PLATFORM DIRECTION.

This is enforced, not promised. Content cannot reach `approved` unless every
declared claim slug is approved in `mkt_claims`, `lintCopy` finds no blocked
phrase, and the entitlement sweep passes. That machinery is a gift: it makes the
honest version of this reposition the only one that can ship.

**Watch item for Phase 1:** *never miss a call* is a blocked phrase, and the
current headline is *"Never miss the time that matters."* Not the blocked
string, and it passes today — but the campaign line chosen in Phase 1 must clear
the sweep on its own merit rather than by a one-word margin.

---

## D6 — What the audit says about the ground we build on

- **Page set:** 22 pages, all declared in `content-map.json`; 19 indexable. A
  hand-authored core of 12 and a GENERATED layer of 9 written whole by
  `scripts/build-content.mjs` from `scripts/content/pages.mjs`. Editing those 9
  HTML files directly is wasted work — they are overwritten with no error.
- **The generated layer is the weakest surface:** 40-43% byte-identical
  boilerplate across the four trade pages (~300 unique words each), zero JSON-LD
  on all 9, and no inbound links from outside their own cluster.
- **The schema gap is invisible to CI** because the test that claims to check
  "every public page" iterates its own hardcoded list omitting exactly those 9.
  Same hand-maintained-list drift class as every other truth gap on this site.
- **Design system:** ONE stylesheet, 22 custom properties, three self-hosted
  families. No spacing, radius, shadow or type scale — every value is a literal
  chosen by measurement. A cinematic system needs a real token layer added
  underneath it, not a replacement of it.
- **No video pipeline exists yet.** The 152–368 ms LCP is achieved by inlined
  CSS and metric-matched font fallbacks. A full-bleed hero video is the single
  biggest threat to that budget and gets designed against it from the start.

---

## D7 — The campaign line

## **The work moves. You still decide.**

**Chosen unanimously.** 32 candidates from four angles (momentum, control,
freedom, platform), judged independently by three personas: a cynical
owner-operator, an investor testing whether the line caps the company at phone
answering, and a creative director judging craft alone. All three named this
line best; two wrote "and it is not close". All three named the same runner-up
as most overrated — *"Load-bearing."* — one calling it "the line that wins the
pitch and loses the market", which is the most useful sentence the panel
produced.

**Why it is right, in the order that matters:**

1. **It is true, and it is true about the hard part.** "You still decide" IS the
   product boundary — a person on the business's side confirms the slot. Every
   other candidate either ignored that constraint or apologised for it. This one
   states it as the virtue. A line that survives the truth basis without
   softening is worth more than a line that has to be defended.
2. **It scales past the phone.** "The work" names no channel. When NEVAMIS
   drafts a quote against the owner's price list, assembles a month into a
   report, or prepares a follow-up, the same six words still describe it. The
   investor judge tested exactly this and it was the only line that did not cap
   the company at answering.
3. **It carries both halves of the brand idea in one breath** — momentum in the
   first clause, control in the second — without an adjective anywhere.
4. **It clears the copy linter on merit**, not by a one-word margin. No blocked
   phrase, no guarantee, no outcome the company cannot control. This was the
   D5 watch item and it is now closed.

**The honest risk, recorded so the copy answers it:** "The work moves" can be
heard as *the job gets done* rather than *the job gets advanced to your
decision*. Supporting copy must name what moves — the call answered, the caller
qualified, the job and the time window captured, the summary sent. The line is
the promise; the section beneath it is the proof.

**Runners-up worth keeping** for section headers and film beats, not as the
campaign line: *"It does not improvise."* (scored 8 with two judges — the
strongest single expression of the rules boundary) and *"Keep both hands on the
work."* (15.4 aggregate — the most physical, best suited to the film's opening).

---

## D8 — Direction change: CGI, no humans. Supersedes D4's cast and the whole photoreal approach.

**2026-08-10.** The human-led photorealistic direction is **rejected** by the
owner. No contractor, no "Ray", no identity locks, no actors, no testimonials,
no simulated live-action. All nine generated contractor images are deleted from
the repository and must not be reused.

**The new direction:** premium cinematic 3D. Dark architectural environments,
luminous data objects, glass interfaces, light trails. Business activity —
calls, leads, schedules, estimates, workflows — represented as physical 3D
objects. NEVAMIS is the invisible operating layer that catches and connects.
Benchmark: a world-class technology launch film. Apple restraint, Unreal-grade
CGI, premium title design.

Humans absent, except tiny abstract silhouettes at architectural scale, once,
for scale only.

**Cost of the rejected direction: 0.96 credits.** Eight stills. Nothing else was
generated, because the still-first rule meant no video had been reached.

### D8a — The palette conflict, which needs a decision

The brief asks for **electric-blue, violet and white**. The live product and
site are **navy with mint/emerald**, and mint is what the real software already
uses to mean *done*. Filmed literally, the film and the website would not look
like the same company — which this directive elsewhere explicitly forbids.

**Recommended, and what the rewritten bible assumes:** blue for data in motion,
violet for structure and rules, white for type — and **mint kept for
confirmation only**, three appearances in the whole film. That gives the brief
its blue and violet, keeps the colour the product actually uses for success, and
lets the site adopt blue/violet as secondary accents without discarding its
identity.

**Alternative:** drop mint entirely, use white as confirmation. That is a full
brand-palette change requiring the site and product UI to be re-skinned.

Not decided unilaterally — it changes the product's UI, so it goes with the
approval.

### D8b — What survives the direction change

`truth-basis.md` is unaffected: the capability ceiling and the six refusals are
facts about the product, not about the treatment. The campaign line (D7) is
unaffected and arguably stronger here — "you still decide" is now expressed as a
returning confirmation signal rather than a man at a dinner table.

The still-first, manifest-before-spend and preflight-with-get_cost disciplines
carry over unchanged. They are why the rejected direction cost 96 hundredths of
a credit instead of several hundred.

---

## D9 — Pronunciation is a measured mechanism, not a spelling note (2026-08-10)

**Target: NEV-uh-miss /ˈnɛvəmɪs/.** The earlier board recorded neh-VAH-miss.
That was wrong and is corrected. **Internal production instruction only — never
shown to the audience** in any form, including captions, subtitles, alt text or
video descriptions.

**The mechanism is model-dependent, and the obvious choice is destructive.**
Measured over five fixed seeds per candidate, using character-level timestamps
for stress and `scribe_v1` transcription to confirm the word was spoken:

| Model | plain | IPA phoneme rule | alias `Nevuhmiss` |
|---|---|---|---|
| `eleven_multilingual_v2` (film) | wrong stress 3/5 | **word missing 5/5** | wrong stress 0/5 |
| `eleven_flash_v2` (live agent) | wrong stress 3/5 | spoken 5/5, correct | 1/5 dropped |

On the film master model an IPA `<phoneme>` rule does not adjust pronunciation —
it deletes the word. Unverified, the brand name would have been absent from the
finished film.

**Film locks the alias** `KOEuSZPGJDk3gmxvcDH5` / `WIWATkk90AdVxkw4qUBH`,
`NEVAMIS → Nevuhmiss`, ratios 0.17–0.25. **No hyphens in an alias** — hyphens
are spoken as pauses, which caused the 2026-07-23 rollback.

Plain text is not a neutral default: it mis-stresses in 3 takes out of 5 on both
models.

**Two records corrected while verifying this.** The live agent has **no**
pronunciation dictionary attached (`conversation_config.tts
.pronunciation_dictionary_locators` is `[]`), contradicting the memory note that
a live IPA rule was in place. And a first attempt at this measurement used a
dictionary whose IPA had been mojibaked to `'n?v?m?s` by the Windows shell —
non-ASCII in a `curl -d` payload does not survive. Build dictionaries through
Node `fetch`, then read the PLS file back and compare bytes before trusting any
result derived from it.

## D10 — C09 cannot say "the appointment is confirmed" (2026-08-10)

The requested C09 line asserts a booking. `agent-draft.ts:235` provisions every
agent with `builtInToolsJson: ["end_call"]`, and `entitlement-claims.ts:18-22`
explicitly refuses the claim "Books the job into your calendar while they are
still on the line". NEVAMIS cannot confirm an appointment.

The *intent* — routine work completes without the owner, only judgment returns —
is fully true of what ships. C09 therefore reads **"The job is captured.
Anything needing judgment comes back to you."**, keeping the requested second
sentence verbatim and moving the mint lock onto `JOB CAPTURED`.

**Flagged for the founder, not resolved unilaterally**, because it overrides a
directly requested line.
