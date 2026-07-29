# Risk, legal & continuity — 50 improvements

Nevamis answers the phone for other people's businesses. That is a higher-trust position than
most software occupies: a failure is not a bad user experience, it is a missed emergency call, a
wrong price quoted to a customer, or a recording made without proper notice. The claims ledger
already treats CLM-16 (privacy and terms) as BLOCKED pending qualified review, and terms v2.0
has a liability cap and Alberta governing law. What is missing is the operational side of risk:
what happens when a provider fails, when a caller says something that creates a duty, when the
founder is unavailable, and when a client asks for their data back.

Nothing in this file is legal advice, and several items exist specifically to get a qualified
person to look at something rather than to resolve it in a repo.

---

1. `RISK-LEGAL-AND-CONTINUITY-001` **Get terms and privacy reviewed by an Alberta lawyer before client one.**
   CLM-16 is BLOCKED for this reason and `docs/LEGAL-REVIEW-PACKAGE.md` is already prepared. The
   cost of the review is small next to one dispute over a recorded call.
   impact 5/5 · effort 2/5 · touches: CLAIMS-LEDGER.md, LEGAL-REVIEW-PACKAGE.md

2. `RISK-LEGAL-AND-CONTINUITY-002` **Get the client service agreement reviewed at the same time.**
   The terms govern the website. The agreement governs the money, the phone line and the data,
   and it is the document that matters in an argument.
   impact 5/5 · effort 2/5 · touches: docs/agreements

3. `RISK-LEGAL-AND-CONTINUITY-003` **Decide the two-party consent position on call recording, explicitly.**
   Canada is single-party for the participant, but a business recording its customers has notice
   obligations. The demo line announces recording; a client's line must too, and the wording
   should be reviewed rather than improvised per client.
   impact 5/5 · effort 2/5 · touches: agent prompt templates, privacy.html

4. `RISK-LEGAL-AND-CONTINUITY-004` **Make recording disclosure impossible to switch off by accident.**
   It should be part of the agent's first message template, not a configurable field an operator
   can clear during a rushed build.
   impact 5/5 · effort 2/5 · touches: domain/agent-draft.ts, manifest

5. `RISK-LEGAL-AND-CONTINUITY-005` **Write the emergency-call policy and put it in every prompt.**
   Fire, gas, flood, medical. The agent must never triage; it must redirect to 911 and escalate.
   This is the single highest-liability path in the product.
   impact 5/5 · effort 2/5 · touches: agent prompt templates

6. `RISK-LEGAL-AND-CONTINUITY-006` **Test the emergency path in the agent regression suite.**
   `scripts/agent-regression.mts` already tests disclosure and pricing. A scripted "there is gas
   in the house" case belongs beside them.
   impact 5/5 · effort 2/5 · touches: scripts/agent-regression.mts

7. `RISK-LEGAL-AND-CONTINUITY-007` **Never let the agent give regulated advice.**
   Electrical safety, medical, legal, insurance. The prompt says it; the regression suite should
   prove it against adversarial phrasing.
   impact 5/5 · effort 2/5 · touches: agent prompts, regression

8. `RISK-LEGAL-AND-CONTINUITY-008` **Write the incident response plan before an incident.**
   Who is told, in what order, how the client is informed, and what gets recorded. Improvising
   this during an outage is how a technical problem becomes a lost client.
   impact 5/5 · effort 2/5 · touches: new docs/INCIDENT-RESPONSE.md

9. `RISK-LEGAL-AND-CONTINUITY-009` **Define what a provider outage means for a client's line.**
   If ElevenLabs is down, does the call fall back to voicemail, to a forwarding number, or ring
   out? The answer must be configured per client and stated in the agreement.
   impact 5/5 · effort 3/5 · touches: ring.xml, Twilio config, agreements

10. `RISK-LEGAL-AND-CONTINUITY-010` **Test the fallback path deliberately, on purpose, before go-live.**
    A fallback nobody has exercised is a hypothesis.
    impact 5/5 · effort 2/5 · touches: onboarding SOPs

11. `RISK-LEGAL-AND-CONTINUITY-011` **Monitor the demo line and alert on silence.**
    The public phone number is the product demonstration. If it stops answering and nobody knows
    for a day, every prospect who called that day is gone permanently.
    impact 5/5 · effort 3/5 · touches: monitoring

12. `RISK-LEGAL-AND-CONTINUITY-012` **Add a synthetic call check on a schedule.**
    Place a test call, assert the agent answered and disclosed. It is the only way to know the
    whole chain works without waiting for a human to complain.
    impact 4/5 · effort 4/5 · touches: monitoring

13. `RISK-LEGAL-AND-CONTINUITY-013` **Keep a documented rollback for the agent prompt.**
    `check-agent-sync.mjs --write` snapshots it. The reverse — restoring a known-good prompt
    quickly — should be equally one command.
    impact 4/5 · effort 2/5 · touches: scripts/check-agent-sync.mjs

14. `RISK-LEGAL-AND-CONTINUITY-014` **Never edit a live agent without snapshotting first.**
    Already the intent of the change-control loop. Make it a written rule with the command beside
    it so a rushed fix cannot skip it.
    impact 4/5 · effort 1/5 · touches: docs

15. `RISK-LEGAL-AND-CONTINUITY-015` **Write the data-deletion procedure and time it.**
    PIPEDA gives a right; privacy.html already promises deletion on request. Knowing it takes
    twenty minutes rather than a day is the difference between a policy and a promise.
    impact 5/5 · effort 3/5 · touches: privacy.html, domain, ops tooling

16. `RISK-LEGAL-AND-CONTINUITY-016` **Build the client data export before a client asks.**
    Calls, summaries, bookings, in a readable format. It is a portability promise, a trust asset
    and an offboarding kindness at once.
    impact 4/5 · effort 3/5 · touches: api/export, portal

17. `RISK-LEGAL-AND-CONTINUITY-017` **Reduce voice-provider retention to a fixed maximum.**
    privacy.html already says this is in progress. Finishing it closes the gap between the stated
    policy and the actual configuration.
    impact 5/5 · effort 2/5 · touches: ElevenLabs config, privacy.html

18. `RISK-LEGAL-AND-CONTINUITY-018` **Keep the subprocessor list current and dated.**
    Twilio, ElevenLabs, Cal.com, Stripe, Vercel, Turso, Resend. A stale list is a compliance
    problem the day a client's own auditor reads it.
    impact 4/5 · effort 1/5 · touches: privacy.html

19. `RISK-LEGAL-AND-CONTINUITY-019` **Notify clients when a subprocessor changes.**
    A small commitment that costs nothing now and prevents a trust problem later.
    impact 3/5 · effort 2/5 · touches: agreements, lifecycle email

20. `RISK-LEGAL-AND-CONTINUITY-020` **Do not store more caller PII than the service needs.**
    `src/lib/pii.ts` already masks in the ops console. The stronger move is not capturing what is
    not needed in the first place.
    impact 4/5 · effort 3/5 · touches: domain/call-intake.ts

21. `RISK-LEGAL-AND-CONTINUITY-021` **Keep the marketing attribution caller-anonymous, permanently.**
    It already is, deliberately. Write down why, so a future growth idea does not quietly reverse
    it for the sake of better reporting.
    impact 4/5 · effort 1/5 · touches: domain/marketing-attribution.ts

22. `RISK-LEGAL-AND-CONTINUITY-022` **Audit CASL compliance across every outbound surface.**
    Cold email, SMS, the lead acknowledgement, lifecycle mail. Identification, unsubscribe, and a
    lawful basis for each. The consent columns idea in sales-outbound is the record-keeping half
    of this.
    impact 5/5 · effort 3/5 · touches: outreach, mailer templates

23. `RISK-LEGAL-AND-CONTINUITY-023` **Never send SMS first.**
    Already a rule in the outbound plan. Enforce it in code the moment SMS sending exists, not
    only in the playbook.
    impact 5/5 · effort 2/5 · touches: domain, PLAYBOOK.md

24. `RISK-LEGAL-AND-CONTINUITY-024` **Add unsubscribe handling before the first marketing email.**
    Retrofitting it after a complaint is the expensive order of operations.
    impact 5/5 · effort 3/5 · touches: domain/email.ts

25. `RISK-LEGAL-AND-CONTINUITY-025` **Keep proof of consent for every contact emailed.**
    Where it came from and when. CASL puts the burden of proof on the sender.
    impact 5/5 · effort 2/5 · touches: schema, outreach tracker

26. `RISK-LEGAL-AND-CONTINUITY-026` **Get business insurance before the first client goes live.**
    General liability and errors and omissions. An AI that mishandles a booking for a restoration
    company after a flood is a real claim, not a hypothetical.
    impact 5/5 · effort 2/5 · touches: PLAYBOOK.md

27. `RISK-LEGAL-AND-CONTINUITY-027` **Confirm the liability cap survives review.**
    Terms v2.0 has one. A cap that is unenforceable in Alberta is worse than none, because it is
    relied upon.
    impact 4/5 · effort 1/5 · touches: terms.html, legal review

28. `RISK-LEGAL-AND-CONTINUITY-028` **Complete incorporation and keep the corporate records.**
    NUANS is done per the playbook. The veil only protects a company that behaves like one.
    impact 5/5 · effort 3/5 · touches: PLAYBOOK.md

29. `RISK-LEGAL-AND-CONTINUITY-029` **Register the trademark, or decide deliberately not to.**
    "Nevamis" is the asset the whole thing is built on and the domain is already live.
    impact 3/5 · effort 2/5 · touches: PLAYBOOK.md

30. `RISK-LEGAL-AND-CONTINUITY-030` **Write the bus-factor document.**
    Every credential, provider, domain and DNS record, and how to reach them. A solo founder's
    business is one lost laptop from unrecoverable.
    impact 5/5 · effort 2/5 · touches: docs, password manager

31. `RISK-LEGAL-AND-CONTINUITY-031` **Get every secret into a password manager, not .env files alone.**
    The working ElevenLabs key currently lives in one repo's .env.local and a stale copy exists
    elsewhere. That is a recovery risk as much as a security one.
    impact 5/5 · effort 2/5 · touches: secrets handling

32. `RISK-LEGAL-AND-CONTINUITY-032` **Rotate the stale key that returns 401.**
    A dead credential in a file is a trap for a future session that will assume it works.
    impact 3/5 · effort 1/5 · touches: ai-assistant/.env

33. `RISK-LEGAL-AND-CONTINUITY-033` **Confirm no secret has ever been committed.**
    Scan the history of both repos. Finding one later means rotating everything under pressure.
    impact 5/5 · effort 2/5 · touches: both repos

34. `RISK-LEGAL-AND-CONTINUITY-034` **Push every repo to a remote.**
    A repo on one disk is not backed up. The site and engine are remote; anything else is not.
    impact 5/5 · effort 1/5 · touches: all repos

35. `RISK-LEGAL-AND-CONTINUITY-035` **Back up the production database on a schedule and test a restore.**
    `db-backup.mts` exists. A backup nobody has restored from is a belief.
    impact 5/5 · effort 2/5 · touches: scripts/db-backup.mts

36. `RISK-LEGAL-AND-CONTINUITY-036` **Document what happens to client phone numbers if Nevamis stops.**
    The most frightening question a buyer can ask, and the one with the best available answer:
    the number is portable and theirs.
    impact 5/5 · effort 2/5 · touches: terms.html, agreements

37. `RISK-LEGAL-AND-CONTINUITY-037` **Write the offboarding checklist.**
    Forwarding removed, number returned or ported, data exported, subscription ended, access
    revoked. A clean exit is a referral source; a messy one is a review.
    impact 4/5 · effort 2/5 · touches: docs

38. `RISK-LEGAL-AND-CONTINUITY-038` **Decide the stance on client data used for improvement.**
    Whether one client's calls ever inform another's agent. The honest answer is almost certainly
    no, and saying so is a selling point.
    impact 4/5 · effort 1/5 · touches: privacy.html, agreements

39. `RISK-LEGAL-AND-CONTINUITY-039` **Keep tenant isolation provable, not assumed.**
    Every query scoped by tenant, with tests that prove a cross-tenant read fails. Multi-tenancy
    bugs are the category's worst possible incident.
    impact 5/5 · effort 3/5 · touches: domain, tests

40. `RISK-LEGAL-AND-CONTINUITY-040` **Rate-limit and monitor every public endpoint.**
    `/api/interest` has a limit. Webhooks are signature-verified. Audit the rest against the same
    bar rather than assuming.
    impact 4/5 · effort 2/5 · touches: api routes

41. `RISK-LEGAL-AND-CONTINUITY-041` **Treat the demo line as an abuse surface.**
    It is a public number connected to a paid AI. Cost caps, abuse detection and a block list are
    operational necessities, not paranoia.
    impact 4/5 · effort 3/5 · touches: ElevenLabs, Twilio, notify-budget

42. `RISK-LEGAL-AND-CONTINUITY-042` **Add prompt-injection defences to anything reading caller text.**
    `pilot-watch.ts` already frames call summaries as data between tags. Apply the same discipline
    anywhere caller-supplied text reaches a model.
    impact 4/5 · effort 2/5 · touches: domain/*

43. `RISK-LEGAL-AND-CONTINUITY-043` **Never let a caller change the agent's rules mid-call.**
    Worth an explicit regression test: a caller claiming to be the owner must not unlock anything.
    impact 5/5 · effort 2/5 · touches: agent prompts, regression

44. `RISK-LEGAL-AND-CONTINUITY-044` **Keep an audit trail on every state change that touches money or a client.**
    Largely present. The value is in it being complete enough to answer "who changed this and
    when" without archaeology.
    impact 4/5 · effort 2/5 · touches: ops/audit

45. `RISK-LEGAL-AND-CONTINUITY-045` **Decide the retention period for call recordings and enforce it.**
    An indefinite recording archive is a growing liability with no upside.
    impact 4/5 · effort 3/5 · touches: privacy.html, retention job

46. `RISK-LEGAL-AND-CONTINUITY-046` **Write what to do if a caller discloses something distressing.**
    A person in crisis will eventually reach an AI receptionist. The agent needs a humane,
    pre-decided response and a fast route to a human.
    impact 5/5 · effort 2/5 · touches: agent prompt templates

47. `RISK-LEGAL-AND-CONTINUITY-047` **Keep a register of every promise made on the public site.**
    The claims ledger does this for factual claims. Extend it to service promises like "we tell
    you promptly when something is wrong", which is a commitment with an operational cost.
    impact 4/5 · effort 2/5 · touches: CLAIMS-LEDGER.md

48. `RISK-LEGAL-AND-CONTINUITY-048` **Review the accessibility position as a legal one, not only ethical.**
    Public-facing services face increasing accessibility expectations. The site already clears a
    measured floor; keeping that evidence is worth something.
    impact 3/5 · effort 1/5 · touches: quality.spec.js, docs

49. `RISK-LEGAL-AND-CONTINUITY-049` **Keep the guard scripts in CI, not only on the founder's machine.**
    A guard that depends on someone remembering to run it will eventually not be run on the day it
    mattered.
    impact 4/5 · effort 3/5 · touches: CI

50. `RISK-LEGAL-AND-CONTINUITY-050` **Schedule a quarterly risk review with this file as the agenda.**
    Risk work has no deadline pressure, which is precisely why it needs a date.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md
