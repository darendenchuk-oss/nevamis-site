# NEVAMIS — what may be said, and what may not

The factual floor under the cinematic system, the website and the film. Every
line of new copy and every frame of the film is checked against this file.

Established by a four-probe audit with adversarial verification, 2026-08-10.
Where the auditors disagreed, the disagreement was resolved by reading current
`origin/master` directly, not by preferring one agent.

---

## The capability, stated exactly

**NEVAMIS answers the line, qualifies the caller against rules the owner
approves, captures the job, the address and the time window they want, escalates
or transfers by those rules, and texts and emails the owner a summary within
seconds. A person on the business's side confirms the slot.**

That sentence is the ceiling. Nothing may claim more.

### It does not book

Verified on current `origin/master`, not inferred:

- `src/domain/agent-draft.ts:235` — every tenant agent is provisioned
  `builtInToolsJson: JSON.stringify(["end_call"])`. No booking tool. No tenant
  calendar credential.
- `src/domain/entitlement-claims.ts:18-22` — "Books the job into your calendar
  while they are still on the line" is a **refused** claim, and the registry
  cites that same provisioning line as the proof.
- `src/domain/entitlement-claims.ts:132` — "It does not connect to QuickBooks, a
  dispatch tool, a CRM, or a calendar, and it does not text the crew or the
  caller."

One audit pass reported that `canonical.ts` still claims the agent "books the
job into your calendar". **It does not, on master.** That text survives only on
`lane-f-oss-review`, a branch two commits behind, which is what that pass had
open. The engine's source of truth is already honest. The website is what is out
of date.

### The other refusals

No trial or pilot. No external integrations. No multi-line, multi-location or
department routing. No transcripts in the portal. No outbound to callers.
Each is refused with the provisioning path that makes it impossible.

---

## Where the site currently overstates

Found by audit, to be fixed as part of the overhaul — the reposition cannot ship
on top of these.

| Defect | Detail |
|---|---|
| Homepage asserts booking | in up to **ten** places, while a fifth-place line on the same page says booking is "Not built" |
| `hvac.html` meta description | promises "triages the call, **books the visit**" — on the surface search engines quote |
| ROI calculator | prefills a retired **$449** plan price on the homepage |
| Meta descriptions | 3 of 9 generated pages truncate mid-word from a blind `.slice(0,155)` |
| JSON-LD | **zero** on 9 of 19 indexed pages, and the test that claims to check "every public page" iterates its own hardcoded list that omits exactly those 9 |
| `demo_phone_click` | fires on an internal anchor on `revenue-engine.html`, not a phone link |
| Stripe live catalog | last synced 2026-08-06 against a model retired 2026-08-09: still holds Pro at the retired $850 and per-plan setup fees |
| Live phone agent | not updated to the single-price model; no commit can change what it says |

---

## The reposition, made true

The directive asks NEVAMIS to be presented as an AI automation and integration
platform whose first application is customer communication. As worded that is
not true **today** — production has zero client workspaces, zero active
subscriptions and $0 collected.

It becomes true when the three tiers stay visibly separate, which the directive
itself requires:

- **LIVE NOW** — the capability sentence above. One line, one number, one flow.
- **BEING BUILT** — what `CANONICAL.capabilities` marks `private_pilot` or
  `coming_soon`, described as such.
- **PLATFORM DIRECTION** — the architecture the operating layer implies. Sold as
  direction, never as inventory.

The engine already enforces this: content cannot reach `approved` unless every
declared claim slug exists in `mkt_claims` with status approved, `lintCopy`
finds no blocked phrase, and the entitlement sweep passes. Blocked outright:
*never miss a call*, *guaranteed revenue*, *replaces your receptionist*.

**"Never miss a call" is a blocked phrase and the homepage headline is "Never
miss the time that matters."** That is not the blocked string, and it survives
the sweep today — but it sits one word away from a claim the business has
decided it cannot make. The campaign line chosen in Phase 1 must clear the
sweep on its own merit, not by a near miss.

---

## Baseline, for distinguishing later breakage

Site: 191 Playwright tests passing, consistency green (exit 2 = one live-agent
prompt item only the owner can apply), suite-collection guard green. Production
LCP 152–368 ms, CLS ≤ 0.0001.

Note on a disputed number: one pass reported "157 test declarations, so 191 is
unverified". Both are right about different things — several specs generate
tests from arrays in a loop, so declarations undercount collected tests. 191 is
the collected count, taken by running the suite.
