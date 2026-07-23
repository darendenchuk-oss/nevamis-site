# Service Blueprint: Your Daily Business Brief (Daily Owner Brief)

- Title: Your Daily Business Brief (internal name: Daily Owner Brief)
- Pillar: Operate
- Status: planned
- Priority: 5
- Last reviewed: 2026-07-23

One-line description: Nevamis turns calls, messages, bookings, open leads, follow-ups, and urgent issues into one concise daily summary for the business owner.

## 1. Customer problem

- Owners have information scattered across platforms. Calls live in one system, bookings in another, leads and quotes in a third.
- Important follow-ups are easy to miss because no single view shows what is due today.
- Reporting takes time. Owners assemble their own picture of the business by logging into several tools or asking staff.
- Staff activity is difficult to understand at a glance, so accountability suffers.

The result is time lost reviewing systems, decisions made late, and revenue lost to forgotten follow-ups.

## 2. Ideal customer profile

- Owner-operated service business in Edmonton and surrounding areas, with trades as the primary segment (plumbing, HVAC, electrical, roofing, landscaping, cleaning, and similar).
- Already using the Nevamis AI Front Desk, or at minimum has call, form, and booking activity flowing through systems Nevamis can read.
- 1 to 20 staff. The owner is the main decision maker and personally reviews leads, quotes, and schedules.
- Uses one CRM or a simple lead database and one calendar (Cal.com or a calendar Nevamis already connects to).
- Feels the pain daily: checks multiple apps each morning or evening and still misses things.

Not a fit: businesses with no digital lead or booking records, businesses that want a full analytics platform, or businesses that expect the brief to take actions on its own.

## 3. Jobs to be done

- When I start my day, tell me what happened yesterday and what needs my attention today, so I do not have to log into five systems.
- When a lead or quote is going stale, surface it before it dies, so I can rescue the revenue.
- When a customer issue is urgent, make sure I see it first thing, so it does not become a public complaint.
- When I want to know how the business is doing, give me a simple factual summary, so I can make decisions quickly.
- When something in my Nevamis setup breaks or behaves oddly, tell me in the same brief, so I am never surprised.

## 4. User roles

- Owner (primary reader): receives the daily brief, acts on recommended items, can adjust delivery time and content preferences.
- Office manager or dispatcher (optional secondary reader): receives the same brief or an operational subset when the owner approves it.
- Nevamis founder (operator): configures the brief, monitors delivery, reviews quality during the pilot, handles support.
- The system (assist level only): compiles, classifies, and recommends. It approves nothing and sends nothing to customers. Under the Nevamis AI action levels this service operates at Level 1 (assist): summarize, draft, recommend, human acts.

## 5. Trigger

- Primary: a scheduled daily job at an owner-chosen local time (default 7:00 a.m. Mountain Time), compiling activity from the previous business day and items due today.
- Secondary (optional, off by default): a same-day urgent flag when a message or call is classified as an urgent customer issue. This is a pointer to the item, not a new communication channel, and is only enabled with the owner's explicit approval.
- No customer-facing trigger exists. The brief is internal to the business.

## 6. Inputs

- Call summaries and outcomes from the AI Front Desk (Twilio call events, ElevenLabs conversation summaries).
- Booking, cancellation, and no-show records from the connected calendar (Cal.com in the standard stack).
- Lead records and statuses from the connected CRM or simple lead database (one CRM per client in the MVP).
- Open quote records where the client tracks quotes in the connected CRM.
- Follow-up tasks and due dates recorded by Nevamis systems.
- Nevamis system health signals: usage levels, failed integrations, delivery errors.
- Owner preferences: delivery time, delivery channel (email or SMS), included sections, secondary recipients.

Inputs the service does not use: email inbox contents, accounting records, payroll, staff personal data beyond names attached to activity records.

## 7. Decision rules

- Separate every item into one of three labelled categories, per the brief's core guardrail: measured facts (counts and records read directly from systems), system classifications (labels the AI applied, such as "qualified" or "urgent"), and recommendations (suggested human actions). The three categories are never blended in a single sentence.
- An item is "urgent" only when it matches defined patterns (explicit complaint, safety concern, cancellation of high-value work, repeated failed contact). Uncertain items are listed as "needs review", never silently dropped and never inflated to urgent.
- A lead is "missed or unresolved" when it has no recorded response or booking within the client's agreed response window.
- A quote is "open" based only on CRM status, not inference.
- Recommendations must reference a specific record ("Call back the Tuesday furnace quote") and never invent facts, amounts, or customer sentiment.
- If a data source is unavailable at compile time, the brief says so plainly in that section rather than showing a zero.
- No medical, legal, employment, credit, or pricing advice appears in recommendations.

## 8. Actions

The system performs only these actions:

1. Reads records from connected sources within its integration window.
2. Compiles the brief in a fixed template: new leads, qualified leads, booked appointments, missed or unresolved opportunities, open quotes, urgent customer issues, follow-ups due, cancellations and no-shows, usage and system issues, recommended human actions.
3. Labels every line as fact, classification, or recommendation.
4. Delivers the brief to the approved recipients on the approved channel at the approved time.
5. Logs delivery, content summary, and any compile errors for support review.

The system never contacts customers, changes CRM records, books or cancels appointments, or sends anything to anyone the owner has not approved.

## 9. Outputs

- One daily brief per client, delivered by email (default) or SMS summary with an email link, in plain language a busy owner can read in under two minutes.
- A short "recommended human actions" list, capped at a small number of items (default five) so it stays actionable.
- A monthly roll-up during the pilot: items surfaced, items the owner marked resolved, delivery reliability, and any data gaps.
- An internal delivery log for Nevamis support.

## 10. Human approval points

- Owner approves initial setup: connected sources, recipients, delivery time, channel, and included sections.
- Owner approves any secondary recipient before they receive anything.
- Owner approves enabling the optional same-day urgent flag.
- Owner approves any change to the brief template or classification rules.
- Every recommended action requires a human to act. The brief itself never executes follow-ups, replies, or bookings.
- Nevamis founder reviews the first week of briefs with the client before the brief runs unattended.

## 11. Failure states

- A data source (CRM, calendar, or call platform) is unreachable at compile time.
- The compile job fails entirely and no brief is generated.
- The brief is generated but delivery fails (email bounce, SMS failure).
- A classification is wrong: a genuine urgent issue is labelled routine, or a routine item is labelled urgent.
- Stale credentials cause partial data (for example, calendar connected but CRM token expired).
- Duplicate delivery caused by a retry defect.
- The brief includes a record that belongs to the wrong client (cross-client exposure). This is a critical incident, not a routine failure.

## 12. Fallback

- If one source is unavailable: the brief ships on time with that section marked "data unavailable today" and the reason in plain words. Never show zeros for missing data.
- If the compile job fails: the system retries once, then alerts the Nevamis founder. If no brief can be produced by mid-morning, the founder notifies the client directly and sends a manual summary if the pilot promises one.
- If delivery fails: retry on the same channel, then fall back to the alternate approved channel, then founder follow-up.
- If misclassification is reported: the founder corrects the rule, documents the case, and reviews the next three briefs manually.
- If cross-client exposure is suspected: pause the affected clients' briefs immediately, investigate, notify the affected client honestly, and document per the incident process.

## 13. Data stored

- Compiled daily briefs and their delivery status.
- Item-level references (record IDs, timestamps, statuses) needed to build and audit each brief.
- Classification labels and which rule produced them.
- Owner preferences and approval records (who approved what, when).
- Delivery logs and error logs.
- Pilot metrics: items surfaced, items marked resolved.

All stored data is scoped to a single client. No client's data is ever used to build another client's brief, and client data is not used for model training without a signed agreement.

## 14. Data not stored

- Full call recordings (the brief reads summaries; recordings stay in their source system under its own policy).
- Payment card data, banking details, or any financial credentials.
- Customer personal information beyond what already exists in the client's connected systems and is needed for the referenced records.
- Email inbox contents (out of scope for this service).
- Free-text sensitive information in analytics events. Analytics track only service slug, stage, and interaction type per the site analytics rules.
- Passwords or API keys in logs or briefs.

## 15. Retention

- Daily briefs and delivery logs: retained for 12 months, then deleted, unless the client requests earlier deletion.
- Item-level compile references: 90 days, enough to investigate disputes and quality issues.
- Error and incident logs: 12 months.
- On contract end: client-scoped brief data deleted within 30 days of the end date, with written confirmation. Records legally required to be kept (billing, consent, approvals) follow the approved company retention policy instead.
- Retention terms are stated in the service agreement before the pilot starts, not after.

## 16. Integration requirements

- AI Front Desk data: Twilio call events and ElevenLabs conversation summaries (already produced for existing receptionist clients).
- Calendar: Cal.com API read access (bookings, cancellations, no-shows). One calendar per client in the MVP.
- CRM: read access to one CRM or a simple lead database per client. Start with whichever system the pilot client already uses; do not claim support for a CRM until it is implemented and tested.
- Delivery: transactional email provider for the brief; Twilio SMS for the optional short-form summary.
- Orchestration: existing Nevamis automation stack (direct APIs preferred; n8n or similar where appropriate).
- For each integration, document authentication model, permissions, rate limits, data read, failure behavior, and vendor cost before onboarding a client that depends on it.

## 17. Test cases

1. Normal day: client has 3 new leads, 2 bookings, 1 cancellation, and 1 follow-up due. Verify the brief lists each item in the correct section, labels facts, classifications, and recommendations separately, and delivers at the scheduled time.
2. Quiet day: no activity in any category. Verify the brief still ships, says plainly that there was no new activity, and does not pad itself with filler or invented items.
3. Missing source: revoke the CRM token before compile. Verify the brief ships on time with the CRM sections marked "data unavailable today", no zeros shown for missing data, and the founder is alerted.
4. Urgent classification: inject a test call summary containing an explicit complaint about a missed appointment. Verify it appears under urgent customer issues, is labelled as a system classification, and the recommendation references the specific record.
5. Delivery failure: point delivery at a bouncing email address. Verify retry, fallback to the approved SMS channel, and a logged delivery error.
6. Missed-opportunity window: create a test lead with no response recorded inside the agreed response window. Verify it appears under missed or unresolved opportunities and disappears once a response is recorded.
7. Client isolation: run two test clients in parallel with overlapping data shapes. Verify no record from client A appears in client B's brief, and confirm this check is repeatable in staging before every release.
8. Timezone and schedule: set delivery to 7:00 a.m. Mountain Time and verify correct delivery across a daylight-saving boundary.

## 18. Pilot limits

- 2 to 3 pilot clients maximum, all existing AI Front Desk clients, so call and booking data already flows.
- One CRM or simple database and one calendar per client. No custom multi-system merges.
- Email delivery only for the first two weeks; SMS summary added after email is stable.
- Fixed brief template. Content preferences limited to including or excluding whole sections.
- Same-day urgent flag off by default during the pilot.
- Pilot length: 30 days with a defined start event (first delivered brief) and end event (pilot review meeting).
- Founder-time cap: setup within one working day per client; support within 30 minutes per client per week after week one. If support consistently exceeds the cap, pause expansion and fix the cause.
- Usage cap documented per client. Free or discounted pilot terms follow the company pilot rules: honest scope, no card required for a free pilot, paid conversion requires an accepted agreement.

## 19. Success metrics

- Primary (from the roadmap): number of important actions surfaced and resolved. Count items listed under urgent issues, missed opportunities, and follow-ups due that the owner confirms were acted on.
- Owner reads the brief: open or read confirmation on at least 4 of 5 business days.
- Owner-reported time saved reviewing systems, measured against the baseline captured during discovery.
- Delivery reliability: brief delivered on time on at least 95 percent of scheduled days.
- Classification quality: urgent items missed or falsely flagged, target near zero, every case reviewed.
- Commercial signal: at least 2 of 3 pilot clients willing to pay the proposed monthly fee at pilot end.

Stop criteria: owners stop reading the brief, classification errors persist after correction, or support time stays above the cap for two consecutive weeks.

## 20. Commercial assumptions

All figures are internal hypotheses, not approved, and are not public prices. Canadian dollars. Owner approval is required before any price is quoted or published.

- Setup fee: $500 to $1,500 (internal hypothesis, not approved). Covers source connections, template configuration, first-week supervised delivery, and owner training.
- Monthly fee: $149 to $499 (internal hypothesis, not approved). Position within the range by number of sources, number of recipients, and support expectations.
- Packaging: sold as an add-on within the Nevamis Operate package. Modular adoption; no client is forced to buy the full stack.
- MRR focus: recurring monthly revenue is the goal, consistent with the company playbook. No performance pricing for this service; it is a reporting product and attribution-based pricing does not apply.
- Cost model to validate during the pilot: AI usage per brief, email and SMS delivery costs, founder onboarding time, ongoing support time, and reporting time. Price the outcome and the service, not software cost plus markup.
- Margin check: confirm gross margin at the low end of the monthly range before onboarding beyond the pilot.

## 21. Support requirements

- Founder-led support during the pilot: the founder reviews every brief in week one and spot-checks weekly after that.
- A same-business-day response channel (email or text to the founder) for wrong, missing, or late briefs.
- Monitoring: automated alert to the founder when a compile or delivery fails, before the client notices.
- A written runbook covering: reconnecting expired credentials, re-running a failed compile, correcting a misclassification rule, and pausing a client's brief.
- Incident process for critical failures (cross-client exposure, repeated missed urgent items), including honest client notification.
- Support-time tracking per client, so the true cost of the service is known before wider rollout.
- Client-facing expectations document: what the brief includes, what it never does, and how to report a problem.

## 22. Launch checklist

- [ ] Discovery confirmed with at least several real client conversations that scattered information and missed follow-ups are a paying problem (per the client discovery plan).
- [ ] One narrow workflow defined and a manual or assisted version tested first with one client.
- [ ] Integrations for the pilot clients implemented and tested: call summaries, Cal.com, one CRM per client. No untested integration claimed.
- [ ] Fact, classification, and recommendation labelling verified in every template section.
- [ ] All test cases in section 17 passing in staging, including the client-isolation test.
- [ ] Failure and fallback behavior tested: missing source, failed compile, failed delivery.
- [ ] Retention and deletion terms written into the service agreement.
- [ ] Privacy review complete: personal information minimized, least-privilege access, client data never crosses clients, no sensitive data in analytics.
- [ ] Pilot terms approved by the owner: eligibility, scope, caps, fees, refund treatment, data handling.
- [ ] Pricing approved by the owner before any quote. Until then, all figures remain internal hypotheses.
- [ ] Support runbook, monitoring alerts, and incident process in place.
- [ ] Website status remains "planned" until the service is approved, tested, priced, documented, and supportable. No public claim of availability before that point.
