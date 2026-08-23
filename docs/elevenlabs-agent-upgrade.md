# ElevenLabs Agent Upgrade: Published Pricing, Live Pilot, Response Quality

> **SUPERSEDED 2026-08-09 — do not brief the live agent from this document.**
> It was written against the C$249 / C$449 / C$849 ladder and the free 7-day
> live pilot, then patched on 2026-08-07 with a paragraph instructing the agent
> to speak TWO figures per plan ("Pro C$1,000 then C$850/month") and to offer
> the C$150 pilot credit. Every one of those is retired, as is the 2026-08-09
> one-figure model. The current model (v4, owner directive 2026-08-22) is a
> one-time Launch & Implementation fee to start, then a monthly price:
> The Works C$2,500 to start, then C$1,800/month;
> AI Front Desk C$1,500 to start, then C$1,000/month;
> Performance Partnership (invite-only) C$2,000 to start, then C$250/month
> with no pilot or trial at any
> price. The individual sections below have been corrected in place rather than
> left as a trap, but the source of truth is pricing-config.js and the live
> prompt snapshot in nevamis-engine/docs/agent-prompts/demo.md, never this file.

Date: 2026-07-23
Status: Proposed. Nothing in this document is live yet. The production agent runs its current prompt until the rollout plan below completes and the owner signs off.
Agent affected: Nevamis Demo Receptionist (id `agent_9101ky43tys1fswstde818j7j8wt`), the sales and product demonstration agent on the public demo line, (587) 413-0035.
Owner: Daren (Nevamis AI Inc., Edmonton, Alberta).

## 1. Goal

The live agent should match the clarity the website already promises. Concretely, every answer should be:

- Complete: the caller gets the actual answer, not a deflection to a sales call.
- Useful: a plain-language explanation when the question deserves one.
- Naturally paced: one thought per turn, spoken like a person, never a monologue.
- Tool-accurate: the agent only claims an action happened after the tool confirms it.
- Safe under uncertainty: unknowns produce an honest "I can't confirm that" plus a path forward, never a guess.
- Directional: each answer ends with a clear next step or one focused question.

The goal is not longer answers everywhere. Most turns should stay short. The standard is that when a caller asks something the website answers publicly (pricing, how a business starts, how the product works), the agent answers it just as directly, then layers detail only if the caller wants it.

## 2. Why now

nevamis.ca publishes exact plans (`pricing-config.js`). The agent prompt as of 2026-07-23 did the opposite: its PRICING section deflected every price question to Daren and contained no dollar figures. A caller who read the site before dialing gets contradicted by the product that is supposed to be the demo. That is the single worst impression an AI receptionist company can make. (The original sentence here also said the site publishes a free 7-day live pilot and that the prompt should describe it. It did, then; the pilot is retired and the agent must not describe it now.)

## 3. What changes and why

### 3.1 PRICING section replaced with the published plans

The deflection-only PRICING section is replaced with the approved published pricing. The agent states the real shape on request:

- The Works: C$2,500 Launch & Implementation to start, then C$1,800/month, 1,400 minutes (typically 470 to 700 calls), overage C$0.75/min. The whole engine: the AI Front Desk plus every sellable automation add-on, priced under the sum of its parts.
- AI Front Desk (recommended): C$1,500 Launch & Implementation to start, then C$1,000/month, 1,400 minutes (typically 470 to 700 calls), overage C$0.75/min. The start most businesses make; automation add-ons join one at a time, each its own sale.
- Performance Partnership (by invitation and approval only): C$2,000 Launch & Implementation to start, then C$250/month plus 15% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities, 250 minutes (typically 80 to 125 calls), overage C$1.10/min.

(The plans listed here until 2026-08-09 were After Hours C$249, Growth C$449 and Scale from C$849 with 1,200 minutes and a 400-to-600-call range. Those names, prices, minute counts and call ranges are all retired.)

All prices are CAD plus applicable tax, on a three-month minimum (six with any add-on or The Works), then month to month on thirty days notice, with the price locked for twelve months. The agent may also explain, on request, what a connected AI minute is (starts when the AI answers a connected call, ends when the AI portion ends; calls that never connect are not counted; spam that reaches the AI is counted) and the usage-alert behaviour (alerts at 75%, 90%, and 100%; near the limit the client chooses automatic overage, fallback answering, or a hard cap).

Each plan has two published figures and one stated rule (owner directive 2026-08-22, v4): a one-time Launch & Implementation fee charged once at the start beside the first month, then the monthly price charged on the day the client subscribes and on that day every month after, joined as "to start, then", never with "plus" and never totalled. There is no setup fee, no activation fee and no onboarding fee by those names — the one-time charge has one name, Launch & Implementation, and the agent never denies it exists. There is no pilot and no trial, no founding-client offer, no waiver, and no scarcity of any kind to imply.

*(The history of this one paragraph is the argument for the rule. It read "No setup fee, on any plan, for anyone" from 2026-07-31; setup was reinstated 2026-08-06 and the paragraph did not follow, so it had the agent denying a charge the invoice made. On 2026-08-07 it was rewritten to demand BOTH figures — "Core C$250 then C$250/month ... Pro C$1,000 then C$850/month" — plus "the C$150 pilot fee comes off the first month". On 2026-08-09 the setup fee, the second figure and the pilot were all deleted, and this paragraph again did not follow, so for a day it instructed the live agent to quote C$850 and sell a retired pilot. Twice out of three changes, the instruction outlived the thing it described. That is why the figures live in pricing-config.js and this file points at it.)*

Why: the site publishes these numbers. An agent that hides them looks evasive and loses the caller who already knows them.

### 3.2 PILOT section — WITHDRAWN 2026-08-09, the prompt must have no such section

This section used to specify a PILOT block for the prompt: a 7-day live pilot on the client's real line, zero dollars, no card, capped at 60 connected AI minutes or 30 calls, ending on day eight unless the client chose a plan. That offer was later repriced to C$150 and then retired outright on 2026-08-09, at any price and on any terms. The prompt must not carry a pilot section, and the agent must not offer, price, schedule or half-promise a pilot, a trial, an evaluation period or a free first week.

What the agent says instead, when a caller asks for one: the pilot is retired, and the monthly price is already the low-commitment way in — one figure, cancel any time from the portal, service runs to the end of the month paid for. That is cheaper per day than the retired pilot was, lasts longer, and can be stopped; there is nothing to invent in its place.

Why the whole section is kept rather than deleted: the pilot was the site's primary call to action for weeks, and callers who saw it then still ask. An agent that has never been told the offer is gone will improvise one.

### 3.3 Response-quality standard

A new standard governs how answers are shaped: answer, then explanation, then next step, with detail layered in three levels.

- Level 1 (default): the direct answer in one or two short sentences.
- Level 2 (when the caller asks for more, or the question implies it): the plain-language explanation of how or why.
- Level 3 (on explicit request): full published detail, such as per-plan overage rates, the connected-minute definition, or the usage-alert thresholds.

Every substantive answer ends with either a clear next step (book the intro call, take a callback) or one focused question back to the caller. Never two questions. Voice pacing rules stay: one thought per turn, no spoken bullet lists.

Why: the failure mode to avoid is not short answers, it is incomplete ones. Layering keeps calls fast for callers who want a number and thorough for callers who want the mechanics.

### 3.4 Tool-discipline hardening

- The agent may only state that a booking, lookup, text, or transfer happened after the corresponding tool returns success. No pre-announcing outcomes.
- `check_booking` always runs before `book_meeting` (one caller, one booking). This existing rule is kept and stated as a hard sequence.
- Honest failure path: if `book_meeting` fails, the agent says the time was not available and offers another, and if booking keeps failing it falls back to capturing name, business, and number and calling `notify_owner`. If `notify_owner` itself fails, the agent gives the caller the public contact routes (Sales@nevamis.ca and the booking page at cal.com/daren-qvlah4/nevamis-intro) rather than claiming a text went out.
- Never invent a confirmation email, text, or transfer that a tool did not actually perform.

Why: a demo agent that fakes success destroys the exact trust it exists to build.

### 3.5 Unknown-integration honesty rule

Verified today: booking runs on Cal.com, telephony and SMS run on Twilio. No CRM or job-management integrations are verified yet. The only approved phrasing for the Growth plan's connection is "one standard CRM or automation connection when supported."

When a caller asks about a specific tool (any CRM, job-management, or field-service platform by name), the agent must answer in the shape of: "I can't confirm that specific integration; Daren verifies compatibility on the strategy call." Never a false yes.

Planned services (Instant Lead Follow-Up, Automatic Lead Tracking, Quote Recovery, and the other roadmap items) are planned, not purchasable. If they come up, the agent labels them as planned and steers back to the AI Front Desk, the only live product.

Why: one confident wrong yes about an integration costs more than a hundred honest "let me have Daren confirm" answers.

### 3.6 Knowledge base populated

The agent's knowledge base is currently empty (0 documents). This upgrade uploads `config/elevenlabs/nevamis-knowledge-base.md` as the single knowledge-base document. Division of labour: the prompt carries behaviour, tone, tool rules, and the shape of the one recurring price; the knowledge base carries the full published detail (per-plan figures, minute definition, alert thresholds, the retired-offers list, positioning, and the integration-honesty facts) so the agent retrieves exact numbers instead of paraphrasing them.

Why: exact figures belong in a retrievable document kept in lockstep with `pricing-config.js`, not scattered through prose the model might compress.

### 3.7 What does NOT change

- Voice: Will Shank, `eleven_flash_v2`, stability 0.4, similarity 0.8.
- LLM: `gemini-2.5-flash`, temperature 0.0.
- Turn settings: turn_timeout 7 s, eagerness normal, silence_end_call 20 s, max call duration 600 s, daily cap 300 calls.
- Tool set: `end_call`, `transfer_to_number` (to the approved on-call number, which is configured in the agent and is intentionally not written in this repository), `notify_owner`, `book_meeting`, `check_booking`. No new tools, no removed tools, no endpoint changes.
- Guardrails: never invent pricing beyond the published figures, never invent savings figures, client names, or capabilities; never guarantee results; never keep a caller who wants out.
- First message: "Thank you for calling, this is Nevamis AI. How can I help you?"
- AI disclosure: the agent identifies as an AI naturally and never claims to be human.

## 4. Weak vs target answers

### "How does Nevamis work?"

Weak: "We use advanced conversational AI to handle your calls. It's really sophisticated technology. Want me to book you a call with Daren so he can explain?"

Target: "It runs on your existing phone number through call forwarding, so your customers keep dialing the exact same number. When you can't pick up, the AI answers in a natural voice, handles the questions you get every day, and books the job straight into your calendar. We set it all up for you and tune it to your business. What kind of business do you run?"

The target leads with the mechanism in plain words, explains what the caller's customers actually experience, and ends with one focused question. No jargon, no premature pitch.

### "What happens if it does not know?"

Weak: "It's trained on your business, so it can handle pretty much anything your customers ask."

Target: "It won't guess. If a caller asks something we haven't trained it on, it says so plainly, takes their name and number, and texts you a summary right away so you can call back. You see exactly what was asked, and we add the answer so it knows next time. Is there a specific kind of question you're worried about?"

The weak version overclaims. The target makes uncertainty a feature: honest fallback, owner notified, system improves.

### "What does it cost?"

Weak: "Pricing depends on your call volume and what you need, so Daren scopes it on a short call. It's built to cost a fraction of a receptionist."

Target: "Plans run from C$250 to C$1,000 a month depending on coverage and call volume: Core at C$250, Growth at C$500, which is the one we recommend for most trades, and Pro at C$1,000 for high call volume. That's the whole price, charged the day you start and again a month later, with no setup fee and no activation fee, and you can cancel any time. Roughly how many calls a week do you get?"

The weak version is the current behaviour and it contradicts the website. The target states the real shape, one figure per plan, says plainly that nothing else is charged, then asks the one question that determines plan fit.

*(This target answer quoted the retired ladder, a one-time setup fee, the founding waiver and the free pilot until 2026-08-09 — and said Growth was "the one most people pick", which is a claim about a client base that does not exist. "The one we recommend" is an opinion, is true, and matches `recommended: true` in pricing-config.js.)*

## 5. Rollout plan

The public demo number stays pointed at the production agent with its approved configuration for the entire process. It is never reassigned to a staging agent, and the production agent is not modified before owner sign-off.

1. Backup confirmed. A full backup of the production agent configuration (prompt, settings, tool config) was taken 2026-07-23. It is stored privately, not in this repository, because the configuration contains the on-call transfer number.
2. Staging duplicate. Create a duplicate agent in ElevenLabs from the production configuration. Apply the new prompt and upload `config/elevenlabs/nevamis-knowledge-base.md` to the staging agent only.
3. Simulation suite. Run the full simulation suite against the staging agent. Scenarios must cover pricing accuracy (exact published figures, one per plan), refusal of retired offers (a caller asking for the pilot, a trial, or a setup-fee discount), unknown-integration questions, tool failure honesty (booking failure, notify failure), booking flow with `check_booking` first, and disclosure behaviour. All scenarios must pass before any human calls.
4. Manual phone testing. At least ten manual test calls to the staging agent over a real phone, covering the same scenarios plus free-form conversation, interruptions, and a hostile-caller case.
5. Owner review. Daren reviews sample transcripts and recordings from the simulation and manual calls, plus the prompt diff against the current production prompt.
6. Production update. Only after explicit owner sign-off is the new prompt applied to the production agent and the knowledge-base document attached to it. The phone number configuration is untouched throughout.
7. Post-deploy monitoring. Spot-check the first live calls after the change and compare against the simulation expectations. Any regression triggers the rollback below.

## 6. Rollback

Restore the production agent from the 2026-07-23 backup: reapply the backed-up prompt and settings and detach the knowledge-base document. This returns the agent to its exact pre-upgrade behaviour and takes minutes. The staging agent is kept until the upgrade has been stable in production, then removed.

## 7. References

- Published pricing source of truth: `pricing-config.js` (approved 2026-07-23).
- Knowledge-base document: `config/elevenlabs/nevamis-knowledge-base.md` (created as part of this upgrade).
- Website: https://nevamis.ca. Booking page: https://cal.com/daren-qvlah4/nevamis-intro. Email: Sales@nevamis.ca.
