# Production Acceptance Checklist: ElevenLabs Agent Upgrade

**Agent:** Nevamis Demo Receptionist (`agent_9101ky43tys1fswstde818j7j8wt`)
**Scope:** activating the upgraded prompt and knowledge base on the public demo line, (587) 413-0035.
**Status:** this document defines the acceptance gate. Nothing in it has been applied to production. The live agent is unchanged until every BEFORE ACTIVATION box is ticked and Daren gives explicit approval.

**Standing rule:** never claim the agent was improved unless the configuration was actually changed and tested. Planning documents, prompts in this repo, and passing simulations are not an upgrade. Only a verified production change is.

---

## 1. Before activation

Every box must be ticked before any production change. No exceptions, no partial credit.

### Backup and staging

- [ ] Full backup of the current production agent taken (prompt, first message, all settings, tool configurations) and stored outside this public repo.
- [ ] Backup verified restorable: confirmed the backup contains everything needed to recreate the agent exactly as it is today, not just the prompt text.
- [ ] Backup agent id recorded somewhere Daren can reach in under a minute.
- [ ] Staging agent created with the upgraded prompt and knowledge base, separate from the production agent, so the live line is never used as a test bench.

### Simulation testing

- [ ] All P0 simulation tests pass. A single P0 failure blocks activation.
- [ ] P1 pass threshold met per the test plan.
- [ ] Pricing answers match nevamis.ca exactly: plan names, monthly prices, setup fees, included minutes, overage rates, month-to-month terms. No drift, no rounding, no improvisation.
- [ ] Pilot answers match nevamis.ca exactly: 7-day live pilot, zero dollars, no card, caps (one line, one call flow, one calendar, up to 60 connected AI minutes or 30 calls, one revision), the seven days start at go-live, and on day eight the pilot simply ends unless the client explicitly chooses a plan. Silence never becomes a subscription.
- [ ] Unknown integration questions produce no false claims. The agent says it cannot confirm the specific integration and that Daren verifies compatibility on the strategy call. Never a false yes.

### Booking verification

- [ ] Booking verified end to end on staging: check_booking runs before book_meeting, a real Cal.com test booking is created, appears on the calendar, and is then cancelled.
- [ ] Failed booking never produces a false confirmation. When the booking tool errors or returns failure, the agent tells the caller the booking did not go through and offers the fallback (notify_owner or trying again), and simulations confirm this.
- [ ] Duplicate booking prevented: check_booking finds an existing booking by email and the agent does not book a second slot.

### Live phone testing

- [ ] Ten manual phone calls to the staging agent completed and logged (date, scenario, outcome, notes for each).
- [ ] Latency acceptable: response gaps feel like a normal phone conversation, no dead air long enough that a caller would hang up.
- [ ] Interruptions work: the caller can talk over the agent and it stops and responds to the new input.
- [ ] Structured read-backs correct: names, email addresses, and phone numbers are read back accurately and confirmed before any tool uses them.
- [ ] Transfer verified: transfer_to_number reaches the approved on-call number.
- [ ] Transfer fallback verified: when the transfer fails or goes unanswered, the agent recovers gracefully (takes a message via notify_owner rather than stranding the caller).

### Owner sign-off

- [ ] Daren has listened to sample staging calls (at minimum: a pricing call, a pilot call, a booking call, and a failed-booking call).
- [ ] Daren has given explicit approval to activate. Verbal or written, but explicit. Silence is not approval.

---

## 2. Activation

- [ ] Pick a low-traffic window (based on demo-line call history, typically late evening).
- [ ] Have the backup agent id and the restore steps open before touching anything.
- [ ] Make one change at a time. Either:
  - Option A: apply the approved prompt and knowledge base to the production agent, or
  - Option B: repoint the demo number to the approved staging agent.
  Do not combine paths, and do not bundle unrelated setting changes into the same window.
- [ ] Immediately place one live test call to the demo line to confirm the agent answers with the correct first message and behaves as tested.
- [ ] Log what changed, when, and which option was used.

---

## 3. After activation

- [ ] Monitor the transcripts of the first 20 live calls. Read every one. Look specifically for pricing drift, pilot misstatements, false integration claims, and booking failures.
- [ ] Usage and cost check: compare actual per-minute cost against the internal cost baseline (kept in the private ops notes, never in this public file). Investigate any material deviation before it compounds.
- [ ] Re-test the claims on the nevamis.ca Demo page against the live agent. Whatever the site says the demo does, the demo must actually do.
- [ ] Roll back from backup on any P0 regression. Do not patch live. Restore the backup first, diagnose second.
- [ ] After the first 20 calls are clean, record the date and result here so the upgrade can honestly be described as live and verified.

---

## 4. Owner decisions

Explicit decisions Daren must make. These are flagged, not assumed.

- [ ] **Approve production activation.** The gate for section 2. No activation without it.
- [ ] **Set a call-recording retention policy.** Retention is currently unlimited. Recordings contain caller names, emails, and phone numbers. Recommendation: a defined window (for example 30 or 90 days) with automatic deletion, decided as policy rather than left as a default.
- [ ] **Decide where the full system prompt lives.** Is keeping the complete prompt in this public repo acceptable, or should it move to the private ai-assistant folder with only a summary kept public? A public prompt is readable by competitors and by anyone probing the agent.
- [ ] **Confirm the transfer fallback behaviour.** What should happen when the on-call number does not answer: message via notify_owner (current design), retry, or something else. Daren confirms the choice before activation.

---

*Related documents: `docs/elevenlabs-agent-audit.md` (current-state audit of the live agent). This checklist contains no credentials, no tool endpoint URLs, and no personal phone numbers; the transfer destination is configured inside the agent only.*
