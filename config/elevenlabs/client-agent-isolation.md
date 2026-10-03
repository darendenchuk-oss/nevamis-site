# Client Agent Isolation, Versioning, and Rollback (DRAFT)

- Version: v2 DRAFT, 2026-10-03 (v1 was 2026-07-25)
- Purpose: Define how each Nevamis client gets an ISOLATED cloned agent plus its own knowledge, so no single mutable prompt ever holds more than one client's data. Covers cloning, isolation guarantees, versioning, and rollback for the first five founding clients and everyone after.
- Status: DRAFT process doc for Daren to approve and follow. No client secrets, phone numbers, keys, or account identifiers belong in this file or in the repo. Concrete client data lives only inside each client's own agent configuration.
- v2 (2026-10-03, whole-site audit MACHINE-15): v1 told the operator to wire a calendar and a transfer destination for each client, and a client agent has neither: it takes the job and the time the caller wants for the owner to confirm, and its one call control is end_call. Those steps are gone, and `scripts/check-consistency.js` guard 7q fails this file if they come back.

## The core rule: one client, one agent, one knowledge base

There is never a single shared receptionist prompt that contains multiple clients' businesses, hours, prices, or routing. Each client gets:

- Their OWN cloned ElevenLabs agent (a distinct agent id), filled from the plumbing template (vertical-plumbing-agent-template.md) with THEIR approved placeholders.
- Their OWN knowledge base file, containing only their approved business facts.
- Their OWN configuration (recording setting, and the contacts their summaries and urgent alerts go to), scoped to their account and stored in the agent and the engine, not in this repo. A client agent has no calendar and no transfer: its one call control is end_call.

A bug, edit, or rollback on one client's agent must be incapable of touching another client's data or behaviour. Isolation is the whole safety model: it is why a plumbing client's prices can never leak into another client's answers, and why Job B's "never disclose one client to another" rule can actually hold.

## Why NOT one mutable prompt with everyone's data

A single agent holding all clients (switching on caller-ID or business) is rejected because:
- Caller-ID is spoofable, so a "which client is this" switch is a data-leak waiting to happen.
- One bad edit would break or expose every client at once.
- There is no clean per-client rollback; you cannot revert one client without reverting all.
- It makes the isolation promise in the support agent (Job B) impossible to keep.

Isolation by separate agents is the only approach that satisfies the canonical safety rules.

## Provisioning a new client (repeatable steps)

1. Intake: collect the client's approved facts (business name, hours, service area, services, exclusions, emergency definition and fallback, what to take down for a job, approved prices, no-go topics, greeting and recording notice choice, decline-recording path). Client and Daren sign off. Nothing proceeds on guessed data.
2. Clone: create a NEW agent from the current approved template version. Record which template version it was cloned from (see versioning).
3. Fill: populate every {{placeholder}} from the approved intake. An unfilled placeholder blocks go-live.
4. Knowledge: create the client's own knowledge base file from approved facts only.
5. Configure: set that client's recording setting and end_call, the agent's one call control, inside the agent, and the contacts their summaries and urgent alerts go to in the engine (never in the repo). There is no calendar to connect and no transfer destination to set.
6. Test: run the plumbing regression scenarios (plumbing-agent-test-scenarios.md) against this specific agent. P0s must pass. Emergency, price-refusal, isolation, and job-taking truthfulness (never claiming a booking) scenarios are gating.
7. Client approval: the client hears it and approves before go-live (matches the Nevamis onboarding step).
8. Go-live: forwarding on, first version tagged (see below).

## Isolation guarantees (must all hold)

- Separate agent id per client; no cross-client tool access.
- Each agent's knowledge base contains only that client's approved data.
- No client's file references, compares to, or names any other client.
- Per-client recording settings and notification contacts live in that client's own configuration only.
- Access to a client's config and recordings is limited to authorized Nevamis operators; changes are logged (see audit).

## Versioning

Every client agent carries a version tag so any answer can be traced to an exact configuration.

- Template version: the plumbing template has its own version (currently v1 DRAFT, 2026-07-25). When the template changes, its version increments, and the changelog notes what changed and why.
- Client agent version: each client's agent is versioned independently, e.g. `{{business_name}}-v1`, `-v2`, on every approved change to that client's prompt, placeholders, knowledge, or tools.
- Each client version records: date, what changed, who approved it, and which template version it was based on.
- Recommended: keep each client's filled prompt + knowledge as a saved, dated snapshot (in a private, access-controlled store, not this public-ish repo if it contains client specifics) so any prior version can be restored exactly.
- A template change does NOT auto-propagate to live client agents. Improvements are rolled out per client, deliberately, re-tested, and re-approved. (This mirrors the memory rule that manual copies never auto-update: treat every client agent as a manual, reviewed copy.)

## Rollback

- Every approved change produces a new client version; the previous version is retained, not overwritten.
- If a change misbehaves in production, roll that ONE client back to its last known-good version. No other client is affected.
- Rollback steps: identify the last-good version tag, restore that snapshot's prompt/knowledge/tool settings to the client's agent, re-run the P0 scenarios, confirm, and log the rollback (who, when, from/to versions, why).
- Never hot-edit a live client prompt in place without a snapshot; if it must be urgent, snapshot first so rollback is possible.
- A rollback that touches routing, billing behaviour, or recording is a change that must be logged and, where the client is affected, communicated.

## Audit and change control

- Every create, change, and rollback of a client agent is logged with: timestamp, actor, client, version from/to, and reason.
- Changes to forwarding, notification contacts, recording settings, or billing-adjacent behaviour are high-sensitivity and require explicit authorization before they are applied, consistent with the Job B support rules (the support AI can request these but only a human applies them).
- Access to client recordings and configs is restricted and logged.

## Open items for Daren

- Choose where dated per-client snapshots live (private, access-controlled; not a public repo if they contain client specifics).
- Decide the naming/versioning convention and stick to it (suggested `{{client-slug}}-vN` + template-vN reference).
- Confirm who is authorized to approve and to roll back client agents, and where the audit log lives.
- Decide the rollout policy for template improvements to existing clients (per-client, re-tested, re-approved; never silent auto-update).
