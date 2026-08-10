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
