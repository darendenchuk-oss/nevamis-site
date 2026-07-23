# ElevenLabs Agent Upgrade: Published Pricing, Live Pilot, Response Quality

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

The goal is not longer answers everywhere. Most turns should stay short. The standard is that when a caller asks something the website answers publicly (pricing, the pilot, how the product works), the agent answers it just as directly, then layers detail only if the caller wants it.

## 2. Why now

nevamis.ca publishes exact plans (`pricing-config.js`, approved 2026-07-23) and a free 7-day live pilot. The current agent prompt does the opposite: its PRICING section deflects every price question to Daren, contains no dollar figures, and never mentions the pilot. A caller who read the site before dialing gets contradicted by the product that is supposed to be the demo. That is the single worst impression an AI receptionist company can make.

## 3. What changes and why

### 3.1 PRICING section replaced with the published plans

The deflection-only PRICING section is replaced with the approved published pricing. The agent states the real shape on request:

- After Hours: C$249/month, C$500 one-time setup, 250 connected AI minutes included (typically 80 to 125 calls), overage C$1.10/min. For small businesses that need evenings, weekends, and overflow covered.
- Growth (recommended): C$449/month, C$750 setup, 600 minutes (typically 200 to 300 calls), overage C$0.90/min. Up to two lines, flows, or calendars, advanced qualification, transfer rules, and one standard CRM or automation connection when supported.
- Scale: from C$849/month, setup C$1,250 and up, 1,200 minutes (typically 400 to 600 calls), overage C$0.75/min. Multi-location and complex routing.

All prices are CAD plus applicable tax, month to month, cancel before the next renewal. The agent may also explain, on request, what a connected AI minute is (starts when the AI answers a connected call, ends when the AI portion ends; calls that never connect are not counted; spam that reaches the AI is counted) and the usage-alert behaviour (alerts at 75%, 90%, and 100%; near the limit the client chooses automatic overage, fallback answering, or a hard cap).

Founding waiver: setup fee waived for the first five founding clients, in exchange for structured feedback and permission to ask for an honest review. The real limit is founder-led onboarding capacity, and the agent must present it that way. No fake scarcity.

Why: the site publishes these numbers. An agent that hides them looks evasive and loses the caller who already knows them.

### 3.2 New PILOT section

The prompt gains a section describing the approved Model B free pilot, exactly as published:

- 7-day live pilot on the client's real phone line. Zero dollars, no card, no automatic billing.
- Caps: one line, one call flow, one calendar, up to 60 connected AI minutes or 30 calls, whichever comes first, and one revision.
- The seven days start when the pilot goes live, not at application.
- On day eight the pilot simply ends unless the client explicitly chooses a plan. Silence never becomes a subscription.
- Pilots are founder-led and accepted based on fit and onboarding capacity.

Why: the pilot is the site's primary call to action. An agent that cannot describe it cannot close the loop the website opens.

### 3.3 Response-quality standard

A new standard governs how answers are shaped: answer, then explanation, then next step, with detail layered in three levels.

- Level 1 (default): the direct answer in one or two short sentences.
- Level 2 (when the caller asks for more, or the question implies it): the plain-language explanation of how or why.
- Level 3 (on explicit request): full published detail, such as per-plan overage rates, the connected-minute definition, or pilot caps.

Every substantive answer ends with either a clear next step (book the intro call, start a pilot application, take a callback) or one focused question back to the caller. Never two questions. Voice pacing rules stay: one thought per turn, no spoken bullet lists.

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

The agent's knowledge base is currently empty (0 documents). This upgrade uploads `config/elevenlabs/nevamis-knowledge-base.md` as the single knowledge-base document. Division of labour: the prompt carries behaviour, tone, tool rules, and the pricing and pilot shape; the knowledge base carries the full published detail (per-plan figures, minute definition, alert thresholds, pilot caps, positioning, and the integration-honesty facts) so the agent retrieves exact numbers instead of paraphrasing them.

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

Target: "Plans run from C$249 to C$849 a month depending on coverage and call volume: After Hours at C$249, Growth at C$449, which is the one most people pick, and Scale from C$849 for multi-location. Each has a one-time setup fee, though we're waiving setup for our first five founding clients. And before any of that, there's a free 7-day live pilot on your real line, no card needed. Roughly how many calls a week do you get?"

The weak version is the current behaviour and it contradicts the website. The target states the real shape, the setup fees, the founding waiver, and the free pilot, then asks the one question that determines plan fit.

## 5. Rollout plan

The public demo number stays pointed at the production agent with its approved configuration for the entire process. It is never reassigned to a staging agent, and the production agent is not modified before owner sign-off.

1. Backup confirmed. A full backup of the production agent configuration (prompt, settings, tool config) was taken 2026-07-23. It is stored privately, not in this repository, because the configuration contains the on-call transfer number.
2. Staging duplicate. Create a duplicate agent in ElevenLabs from the production configuration. Apply the new prompt and upload `config/elevenlabs/nevamis-knowledge-base.md` to the staging agent only.
3. Simulation suite. Run the full simulation suite against the staging agent. Scenarios must cover pricing accuracy (exact published figures), pilot terms (caps, day-eight ending, no card), unknown-integration questions, tool failure honesty (booking failure, notify failure), booking flow with `check_booking` first, and disclosure behaviour. All scenarios must pass before any human calls.
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
