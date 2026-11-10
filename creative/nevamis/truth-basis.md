# NEVAMIS — what may be said, and what may not

> **PRICING, STATED FIRST, because this is the file every line of copy is
> checked against.** Commercial model v7 (owner decision 2026-10-02, with the
> owner's amendments of 2026-10-03), held for counsel until it is published.
> Each plan is a monthly price, month to month from the first month: Front Desk
> Starter C$250/month (200 included minutes, C$1.10 overage), Front Desk Plus
> C$500/month (550 minutes, C$0.95 overage), the AI Front Desk C$1,000/month
> (1,400 minutes, C$0.75 overage) and The Works C$2,100/month (1,400 minutes,
> C$0.75 overage), with no Launch & Implementation fee on any of them. The Performance
> Partnership, by invitation: C$5,000 Launch & Implementation, then C$350/month
> from the first month (250 minutes, C$1.10 overage), plus an agreed share of
> collected revenue directly attributable to a business Nevamis found or a quote
> Nevamis recovered, set in the agreement before anything is charged; the rate
> of that share is never published or spoken. Each module is its monthly alone:
> Missed-Call Recovery C$350, the Quote-Chase Engine C$500, Get-Paid Autopilot
> C$500, the Review Engine C$300. Buy now starts a plan and charges its first
> month. The first month free is for our first 10 businesses, given on a booked
> call: one calendar month, the card taken at sign-up and nothing charged until
> the second month begins, a reminder a week and a day before the first charge,
> minutes past the allowance not billed during it, once per business, and never
> on the Partnership or on a module added to an account that already pays. Its
> name is "first month free"; it is never called a trial. There is no pilot.
> Any other figure that appears below - C$850, C$150, C$249, C$449, C$849, C$49 -
> is RETIRED and appears only as the subject of a defect or a correction, never
> as something quotable. `pricing-config.js` is the source of truth. Banner
> added 2026-08-10, restated for v7 on 2026-10-03.

The factual floor under the cinematic system, the website and the film. Every
line of new copy and every frame of the film is checked against this file.

Established by a four-probe audit with adversarial verification, 2026-08-10.
Where the auditors disagreed, the disagreement was resolved by reading current
`origin/master` directly, not by preferring one agent.

---

## The capability, stated exactly

**NEVAMIS answers the line on the business's existing number, qualifies the
caller against rules the owner approves, captures who they are, a callback
number, what they need, whether they are in the service area, how urgent it is
and the next step promised, refuses what the rules forbid, escalates or
transfers by those rules, and texts and emails the owner a summary within
seconds. Everything after that is done by a person.**

That sentence is the ceiling. Nothing may claim more.

### CORRECTED 2026-08-10 — this file previously overclaimed

Until today this section read *"captures the job, **the address and the time
window they want**"*. **Both were false**, and because this file is the ceiling
every downstream document inherited the error — including two committed
production boards and a narration line that was described as verified.

Verified on `origin/master`:

- `src/domain/agent-draft.ts:52-69` — `DRAFT_DATA_COLLECTION` provisions exactly
  eleven fields: `contact_name`, `callback_number`, `intent`, `service`,
  `service_area_result`, `urgency`, `appointment_outcome`, `booking_confirmed`,
  `human_follow_up_required`, `next_step`, `sms_confirmation_requested`.
  **No address field. No time-window field.**
- `src/db/schema.ts` (`call_summaries`) — no address column and no requested-time
  column. `locationResult` is commented `// in/out of service area` and holds
  only `in_area | out_of_area | unknown`. A three-state area verdict is not an
  address.
- Schema-wide, the only address columns are the tenant's own `mailing_address`
  and email addresses.
- `src/domain/product-contracts/booking-identity-job-details.ts` states it
  outright: **"There is no job-site address field."** The same record carries
  `job-site-address` with `storedAt: null, present: false`.

**And the address is actively discarded.** The same contract notes the agent *is
instructed* to collect "address when a site visit is needed" — so the caller
says it out loud and it lands nowhere. This is the `callback_number` defect
repeating: a prompt asking for a value with no column to hold it. That one was
fixed by adding a field; this one is still open.

**Nothing may claim an address or a requested time window until a column exists
to hold it.**

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

No free period but the first month free stated above, and no pilot. No external integrations. No multi-line, multi-location or
department routing. No transcripts in the portal. No outbound to callers.
Each is refused with the provisioning path that makes it impossible.

**Since 2026-08-10, read with the modules.** The capability sentence and these
refusals were verified for the front desk on 2026-08-10, before the modules
shipped. Missed-Call Recovery, the Quote-Chase Engine, Get-Paid Autopilot and
the Review Engine each do one bounded thing past the call (a text to a caller
you missed, a quote followed up, an invoice nudged, a review asked for), and
each claim about them is bounded by its own capability record in the engine's
`src/domain/canonical.ts`, never by this section. "No outbound to callers"
is true of the front desk itself, not of those modules.

---

## Where the site overstated on 2026-08-10

A record of that audit, not a description of today's site. Found by audit, to be fixed as part of the overhaul — the reposition cannot ship
on top of these.

| Defect | Detail |
|---|---|
| Homepage asserts booking | in up to **ten** places, while a fifth-place line on the same page says booking is "Not built" |
| `hvac.html` meta description | promises "triages the call, **books the visit**" — on the surface search engines quote |
| ROI calculator | **RESOLVED 2026-08-10.** It prefilled a retired **$449** plan price on the homepage, labelled "the Growth plan", and shipped that way to nevamis.ca. `#roiQuote` is now prefilled from `pricing-config.js` by `site.js`, the markup fallback reads 500, and `check-consistency.js` guard 7f fails the build if either drifts from the recommended plan. This row survived a full pricing sweep after it was written here, which is why the fix is a guard and not an edit |
| Meta descriptions | 3 of 9 generated pages truncate mid-word from a blind `.slice(0,155)` |
| JSON-LD | **zero** on 9 of 19 indexed pages, and the test that claims to check "every public page" iterates its own hardcoded list that omits exactly those 9 |
| `demo_phone_click` | fires on an internal anchor on `revenue-engine.html`, not a phone link |
| Stripe live catalog | last synced 2026-08-06 against a model retired 2026-08-09: still holds Pro at the retired $850 and per-plan setup fees |
| Live phone agent | **STALE AS WRITTEN, corrected 2026-08-10.** The claim that it is "not updated to the single-price model" was checked against the ElevenLabs API rather than against this file: the live prompt for `agent_9101ky43tys1fswstde818j7j8wt` (26,309 chars, sha `821e70b6af74`) quotes Core/Growth/Pro at C$250/C$500/C$1,000 with 1,400 minutes and 470-700 calls on Pro, and names C$850, C$150, C$249, C$449 and C$849 only in its never-quote list. The second half of the row stands and is the reason this needed checking at all: no commit can change what it says, so its state is only ever known by asking it |

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

As measured on 2026-08-10.

Site: 191 Playwright tests passing, consistency green (exit 2 = one live-agent
prompt item only the owner can apply), suite-collection guard green. Production
LCP 152–368 ms, CLS ≤ 0.0001.

Note on a disputed number: one pass reported "157 test declarations, so 191 is
unverified". Both are right about different things — several specs generate
tests from arrays in a loop, so declarations undercount collected tests. 191 is
the collected count, taken by running the suite.
