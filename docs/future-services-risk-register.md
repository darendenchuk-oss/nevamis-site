# Future Services Risk Register

Internal planning document for Nevamis future AI services. Covers the risks named in the roadmap brief under Security, Privacy, and Compliance, plus the Canadian planning requirements and the AI action level classification system.

Owner for every risk: Founder (Daren). Reviews run quarterly. Next review date for all rows: 2026-10-01. Update the review date each quarter after the review is completed.

Service name key used in the table:

- Front Desk: AI Front Desk (current live service)
- Follow-Up: Instant Lead Follow-Up
- Tracking: Automatic Lead Tracking (CRM and pipeline automation)
- Quotes: Quote Recovery
- Schedule: Schedule Protection (reminders and recovery)
- Brief: Daily Owner Brief
- Reviews: Review and Referral Engine
- Reactivation: Customer Reactivation
- Concierge: Web and Messaging Concierge
- Inbox: AI Inbox Assistant
- Intake: Smarter Job Intake and dispatch support
- Knowledge: Business Knowledge Assistant
- Revenue: Revenue Clarity (attribution and reporting)

## Risk register

| Risk | Services affected | Likelihood | Impact | Detection | Mitigation | Fallback | Owner | Review date |
|---|---|---|---|---|---|---|---|---|
| Unauthorized access to client systems or Nevamis infrastructure | All services | M | H | Login and API audit logs, failed-auth alerts, unusual-location alerts, periodic access reviews | Least-privilege access, unique credentials per client, MFA on all vendor dashboards, no shared secrets in code or knowledge bases, rotate keys on staff or vendor change | Revoke affected credentials immediately, isolate the affected client account, notify the client, restore from backup, document the incident | Founder | 2026-10-01 |
| Cross-client data exposure (one client sees or receives another client's data) | All multi-client services, highest for Knowledge, Inbox, Tracking, Brief | M | H | Per-client data audits, test queries against wrong-client data before go-live, client reports | Hard tenant separation per client (separate agents, knowledge bases, CRM connections, phone numbers), permission checks in every retrieval path, never mix client data in one prompt or index | Take the affected service offline for both clients, purge the leaked content, notify affected clients, re-verify isolation before restart | Founder | 2026-10-01 |
| Hallucinated business information given to a customer or employee | Front Desk, Follow-Up, Quotes, Concierge, Inbox, Knowledge | M | H | Transcript sampling, regression test suite, client complaints, source-citation checks | Answer only from approved knowledge, require source citations for important answers, "I do not know" plus safe fallback instead of guessing, regression tests for known failure cases | Route the question to a human, take a message, flag the summary for owner review, correct the knowledge base and rerun tests | Founder | 2026-10-01 |
| Incorrect pricing quoted to a customer | Front Desk, Follow-Up, Quotes, Concierge, Inbox | M | H | Test scenarios asking for unapproved prices and discounts, transcript sampling, client reports | Only owner-approved prices in the knowledge base, hard rule never to invent or negotiate prices, price changes follow the knowledge-change process with rerun tests | Agent declines to quote and offers human follow-up; if a wrong price was given, owner contacts the customer promptly and honors or corrects per policy | Founder | 2026-10-01 |
| Incorrect scheduling (wrong time, wrong service, unverified availability) | Front Desk, Schedule, Follow-Up, Concierge, Intake | M | M | Booking tool logs, calendar reconciliation, no-show and complaint reports, tool-call tests | Check real availability before offering times, read back date, time, service, and contact before booking, confirm success only after the tool returns success | Tool-failure path: tell the caller the appointment is not yet confirmed, capture preferred time and contact details, alert a human to book manually | Founder | 2026-10-01 |
| Failed CRM writes (records silently not created or updated) | Tracking, Follow-Up, Quotes, Reactivation, Intake, Revenue | M | M | Write-failure alerts, daily reconciliation counts (calls and inquiries versus CRM records), data-quality reports | Retry with backoff, idempotent webhook processing, queue failed writes for replay, alert on repeated failure | Human data-entry fallback from call summaries and logs, backfill from the event store once the integration recovers | Founder | 2026-10-01 |
| Duplicate messages sent to the same customer | Follow-Up, Quotes, Schedule, Reviews, Reactivation | M | M | Message logs per contact, duplicate-send alerts, customer replies complaining of repeats | Idempotency keys on every send, deduplicate contacts before sequences start, one active sequence per contact per purpose, duplicate detection in the CRM | Pause the affected sequence, apologize once by an approved template if warranted, fix the trigger before resuming | Founder | 2026-10-01 |
| Excessive follow-up (too many touches, harassment perception) | Follow-Up, Quotes, Schedule, Reviews, Reactivation | M | M | Per-contact touch counts, unsubscribe-rate and complaint-rate monitoring, sequence audits | Hard caps on messages per sequence, follow-up stopping rules (reply, booking, opt-out, cap reached), owner-approved cadence per campaign | Stop the sequence for the contact, suppress the contact from further automation, review cadence settings before restart | Founder | 2026-10-01 |
| Missing or broken unsubscribe handling | Follow-Up, Quotes, Schedule, Reviews, Reactivation, Concierge | L | H | Pre-launch unsubscribe tests on every channel, opt-out processing logs, complaint monitoring | Working unsubscribe in every commercial email and SMS, central suppression list enforced across all campaigns and channels, process opt-outs within the CASL timeline | Halt all outbound sending for the affected channel until unsubscribe works, manually process pending opt-outs | Founder | 2026-10-01 |
| Contacting ineligible recipients (no consent, expired implied consent, suppressed contacts) | Follow-Up, Reactivation, Reviews, Quotes | M | H | Consent-source audit before every campaign, suppression-list checks in send logs, complaint and regulator contact monitoring | Record consent type, source, date, and purpose per contact, only message eligible segments, never scrape lists, suppression list applies across every campaign, expire implied consent on schedule | Stop the campaign, remove ineligible contacts, document what happened, get professional advice before resuming if exposure is material | Founder | 2026-10-01 |
| Call-recording consent not obtained or not disclosed | Front Desk, Intake, Concierge (voice), Revenue (call tracking) | L | H | Call-flow audit of disclosure wording, transcript sampling of call openings, client onboarding checklist | Clear recording and AI disclosure at call start, configure disclosure per province and client policy, document each client's recording settings, professional review of disclosure wording | Disable recording for the affected line until disclosure is fixed, delete recordings made without proper disclosure per policy | Founder | 2026-10-01 |
| Sensitive information ending up in analytics or logs | All services, highest for Front Desk, Inbox, Intake | M | M | Periodic audits of analytics properties and event payloads, log sampling | No personal or sensitive fields in analytics events, mask contact details in logs and demo surfaces, allowlist of event properties, QA gate for new events | Purge the offending events and log entries, rotate anything secret that leaked, fix the event schema before re-enabling | Founder | 2026-10-01 |
| Long data retention beyond need or policy | All services | M | M | Retention audits per data store, storage growth review, client offboarding checks | Defined retention and deletion periods per data type (recordings, transcripts, messages, CRM data), automatic deletion where supported, retention terms stated in client agreements | Manual purge to policy, document the deletion, tighten the automation that missed it | Founder | 2026-10-01 |
| Vendor outage (ElevenLabs, Twilio, Cal.com, CRM, email or SMS provider) | All services | M | H | Vendor status pages, health checks, call and message failure alerts, client reports | Document each vendor dependency and its failure behavior, degrade gracefully (voicemail, direct line, manual booking), keep client contact data exportable, avoid single points of failure where practical | Switch the line to direct ring or voicemail, notify affected clients, queue outbound work for replay, restore when the vendor recovers | Founder | 2026-10-01 |
| Provider price increase compressing margin | All services | M | M | Vendor pricing announcements, monthly per-client cost tracking, margin review in the quarterly review | Track usage cost per client, price plans with margin headroom, usage caps and overage terms in client agreements, avoid deep lock-in where alternatives exist | Reprice at renewal per contract terms, migrate to an alternative provider, adjust plan limits with notice | Founder | 2026-10-01 |
| Prompt injection (caller, email, web visitor, or document tries to override agent rules) | Front Desk, Concierge, Inbox, Knowledge, Intake, Follow-Up | M | H | Prompt-injection scenarios in the regression suite, transcript sampling for rule violations, anomaly alerts on unusual tool calls | Treat all caller and message content as data, never as instructions, hard rules outside the model (approved prices, transfer conditions, send limits), tool allowlists, injection tests before every agent release | Agent falls back to safe refusal and human handoff, suspend the affected automation, add the attempt as a regression test | Founder | 2026-10-01 |
| Knowledge-base poisoning (wrong, malicious, or unapproved content entering approved knowledge) | Knowledge, Front Desk, Concierge, Inbox, Quotes | L | H | Knowledge-change log review, source verification, answer-quality sampling | Only owner-approved content enters any knowledge base, knowledge-change process records what changed, source, approver, date, and tests rerun, versioned knowledge with rollback | Roll back to the last approved knowledge version, rerun the regression suite, audit how the content got in | Founder | 2026-10-01 |
| Incorrect dispatch priority (emergency treated as routine or the reverse) | Intake, Front Desk, Schedule | L | H | Emergency-scenario tests, dispatch log review, client and technician feedback | Explicit owner-approved emergency criteria, no AI judgment on safety-critical dispatch (Level 3 prohibited), uncertain cases escalate to a human, log every priority decision | Route uncertain or failed classifications straight to the on-call human, mark the owner summary urgent, review and correct the rules | Founder | 2026-10-01 |
| Employee overreliance on AI answers | Knowledge, Inbox, Brief, Intake | M | M | Feedback collection on answers, spot checks of AI answers against source documents, incident review | Show sources and uncertainty on important answers, position the assistant as a lookup aid, not an authority, keep human approval on consequential actions, train clients on limits | Correct the record with the client, fix or flag the underlying knowledge, add the case to tests | Founder | 2026-10-01 |
| Revenue misattribution (activity credited to the wrong source) | Revenue, Tracking, Quotes | M | M | Reconciliation against collected payments, client challenges to reports, periodic attribution audits | Define and document the attribution method, label modeled numbers as modeled, reconcile reported revenue to actual collected payments, keep raw event records | Correct and reissue the report, disclose the error to the client, adjust any performance fee affected | Founder | 2026-10-01 |
| Payment disputes (performance fees, overages, or subscription charges challenged) | Revenue, all paid services | M | M | Stripe dispute notifications, client billing questions, dispute-rate tracking | Clear signed terms before charging, explicit usage and overage definitions, reliable attribution records for any performance fee, invoices that reference the agreed terms, no charges before agreed milestones | Respond to the dispute with records, refund per policy when warranted, tighten terms or measurement before the next billing cycle | Founder | 2026-10-01 |

## Canadian planning requirements checklist

Work through this checklist before launching any future service that sends messages, makes calls, or stores personal information. Do not claim legal compliance merely because this checklist exists. Obtain professional review before publishing legal claims or contracts.

- [ ] Design all commercial email and SMS around CASL: consent before sending, sender identification in every message, working unsubscribe in every message, opt-outs processed within the required timeline.
- [ ] Design any telemarketing or outbound calling around applicable CRTC rules, including do-not-call requirements where they apply.
- [ ] Design personal-information handling around applicable Canadian and provincial privacy requirements (PIPEDA and provincial equivalents where they apply).
- [ ] Record consent, source, purpose, and unsubscribe state for every contact where required.
- [ ] Provide sender identification and a working unsubscribe mechanism in every commercial electronic message.
- [ ] Minimize personal information collected, processed, and stored to what the service actually needs.
- [ ] Define retention and deletion periods per data type and enforce them.
- [ ] Use least-privilege access for staff, vendors, and integrations.
- [ ] Use appropriate processor and data-handling agreements with every vendor that touches client or customer data.
- [ ] Keep audit logs for material actions (sends, bookings, CRM writes, deletions, configuration changes).
- [ ] Obtain professional legal review for legal claims, client contracts, disclosure wording, and consent language before publication.

## AI action levels

Classify every future workflow at one of these levels before it is built. Record the level in the service's planning document.

### Level 1: Assist

- Summarize
- Draft
- Recommend
- A human approves every action before it happens

### Level 2: Act within rules

- Perform low-risk approved actions
- Use fixed templates
- Use explicit limits
- Escalate uncertainty to a human

### Level 3: Conditional autonomy

- Complete a defined workflow end to end
- Use verified data only
- Maintain logs of every material action
- Provide human override at all times
- Stop on exceptions instead of guessing

### Never use Level 3 for

- Medical decisions
- Legal advice
- Employment decisions
- Credit decisions
- Safety-critical dispatch
- Negotiating unapproved prices
- Issuing refunds outside policy
- Sending unusual complaint responses

These items stay at Level 1 or Level 2 with human approval, or are excluded from automation entirely.
