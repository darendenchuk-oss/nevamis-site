---
title: Automatic Lead Tracking (CRM and Lead Pipeline Automation)
pillar: Operate
status: planned
priority: 2
last-reviewed: 2026-07-23
---

# Automatic Lead Tracking (CRM and Lead Pipeline Automation)

Internal service blueprint. This service is planned and not built. Do not describe it publicly as available. All commercial figures in this document are internal hypotheses and are not approved.

Simple explanation used in the brief: Nevamis can turn calls, messages, forms, appointments, and follow-ups into organized customer records so owners can see which opportunities need attention.

## 1. Customer problem

- Leads remain in texts, emails, notebooks, or employees' memories.
- Staff forget to update the CRM, so records are incomplete or missing.
- Owners cannot see what is pending or which opportunities need attention.
- Nobody knows why an opportunity was lost, so nothing improves.
- Because records are incomplete, the owner cannot tell which lead sources actually produce revenue.

## 2. Ideal customer profile

- Owner-operated service business, with trades as the first focus (plumbing, HVAC, electrical, roofing, landscaping, cleaning, and similar).
- Located in Edmonton and surrounding area first, consistent with founder-led onboarding and support.
- Already receives inquiries by phone, text, email, and website form.
- Strong fit: businesses already using the Nevamis AI Front Desk, because the receptionist already captures calls, qualification answers, and bookings that this service organizes.
- Uses one CRM or job-management system (for example HubSpot, Jobber, Housecall Pro, GoHighLevel, Pipedrive, or Zoho), or has no CRM and accepts a simple structured database provided during the pilot.
- Has an owner or office manager willing to review a pipeline summary and act on alerts.

## 3. Jobs to be done

- When a new inquiry arrives, create or update the customer record without anyone typing it in.
- When a call ends, attach a summary to the right contact so the context is not lost.
- When an appointment is booked, log it against the contact and the opportunity.
- When a lead goes quiet, alert a human before the opportunity is forgotten.
- When the owner asks what is pending, show a current pipeline summary instead of a guess.
- When an opportunity closes, record the outcome and the reason so attribution and learning are possible.

## 4. User roles

- Business owner: receives pipeline summaries, stale-lead alerts, and data-quality alerts; approves configuration and stage definitions.
- Office manager or staff: reviews created records, corrects details, completes follow-up tasks, marks outcomes.
- Nevamis founder (operator): configures the integration, maps stages, monitors write failures, reviews logs, handles support.
- Nevamis system (automation): matches or creates contacts, records sources, attaches summaries, assigns stages, creates tasks, sends alerts. Operates at action Level 2 (act within rules): fixed rules, explicit limits, escalate uncertainty. It does not message the client's customers.

## 5. Trigger

- A call handled by the AI Front Desk ends (Twilio call event plus ElevenLabs call summary).
- A website form submission arrives.
- An inbound text or email inquiry is received on a connected channel.
- An appointment is created, changed, or cancelled in the connected calendar (Cal.com in the current stack).
- A scheduled timer fires for stale-lead checks and the owner pipeline summary refresh.

## 6. Inputs

- Caller or sender name, phone number, and email where provided.
- Call summary and qualification answers already produced by the AI Front Desk.
- Form fields from the website form.
- Lead source (which phone line, form, or channel the inquiry arrived on).
- Appointment details: service requested, date, time, status.
- Existing CRM records, used only for matching and updating.
- Client-approved configuration: pipeline stages, task rules, alert thresholds, staff assignments.

## 7. Decision rules

Planned workflow from the brief: call or inquiry, contact matched or created, source recorded, summary attached, stage assigned, task created, outcome updated, owner report refreshed.

- Match before create: search the CRM by phone number first, then email. If exactly one match is found, update that record.
- Duplicate detection: if multiple possible matches exist, do not merge automatically. Flag for human review and attach the new activity to a review queue.
- If no match exists, create a new contact with the captured details and the recorded lead source.
- Stage assignment follows the client-approved stage map only. The system never invents a stage.
- A follow-up task is created whenever an inquiry ends without a booked appointment.
- A lead is marked stale when it has no activity for a client-configured number of days (default 3 business days), which raises an alert.
- Uncertainty rule: if required data is missing or ambiguous, the system writes what it has, marks the record incomplete, and raises a data-quality alert instead of guessing.
- The system never invents prices, discounts, terms, or technical promises, and it never writes fabricated information into a record.

## 8. Actions

- Create a contact.
- Update an existing matched contact.
- Record the lead source on the record.
- Attach the call or inquiry summary to the record.
- Log appointments against the record.
- Set or update the deal stage within the approved stage map.
- Create follow-up tasks assigned to the configured staff member.
- Send stale-lead alerts to the owner or office manager.
- Send owner notifications for new opportunities as configured.
- Refresh and deliver the pipeline summary on the agreed schedule.
- Raise data-quality alerts for incomplete or conflicting records.

## 9. Outputs

- Complete CRM records: contact, source, summary, appointments, stage, tasks, outcome.
- A visible pipeline with next actions, replacing scattered notes and memory.
- Stale-lead and data-quality alerts delivered by email or text to the client's own staff.
- A recurring owner pipeline summary (counts by stage, new leads, stale leads, outcomes recorded).
- An activity log of every write the system made, kept for audit and support.

## 10. Human approval points

- Initial setup: the client approves the stage map, task rules, alert thresholds, and which staff receive alerts before anything goes live.
- Duplicate merges: always human-approved. The system flags, a person merges.
- Record deletions: never automated. Humans delete records.
- Outcome corrections: staff can override any stage or outcome, and the override wins.
- Any change to configuration after go-live requires client confirmation.
- Anything involving pricing, complaints, refunds, legal matters, or employment matters is out of scope for automation and is escalated to a human, consistent with the roadmap-wide rule.

## 11. Failure states

- CRM write fails (API outage, expired credentials, rate limits).
- Wrong-contact match risk when two customers share a number or a household.
- Duplicate contact created because matching data was missing.
- Call summary missing or low quality, leaving a record without context.
- Stage assigned incorrectly because the inquiry was ambiguous.
- Alert flood if thresholds are set too aggressively.
- Vendor outage at Twilio, ElevenLabs, Cal.com, the CRM, or the automation layer.
- Integration drift after the client changes CRM fields or pipeline settings without telling Nevamis.

## 12. Fallback

- Failed writes are queued and retried. If retries fail, the founder is alerted and the pending records are held in a recovery queue so no inquiry is silently lost.
- If the CRM is unreachable for an extended period, inquiries are logged to a holding store and written back once the CRM recovers, then reconciled.
- If matching confidence is low, the system creates nothing destructive: it attaches the activity to a review queue for a human decision.
- If summaries are unavailable, the record is still created with the raw facts (time, channel, contact details) and marked incomplete.
- If the automation is paused, the AI Front Desk keeps working normally; the client only loses automatic record-keeping, and Nevamis can backfill from call logs afterward.

## 13. Data stored

- Contact details the customer provided: name, phone, email.
- Lead source, inquiry channel, and timestamps.
- Call and inquiry summaries and qualification answers.
- Appointment records and outcomes.
- Deal stage history, tasks, and recorded outcomes with reasons.
- Consent and unsubscribe state where the client's follow-up services require it.
- System activity logs: what was written, when, and why (kept for audit and support).

## 14. Data not stored

- Payment card numbers, banking details, or government identification.
- Passwords or credentials belonging to the client's customers.
- Call recordings, unless the client has a lawful, disclosed recording practice and explicitly requests storage; summaries are the default.
- Health, legal, or other sensitive personal details beyond what the customer volunteered as job-relevant.
- Any customer personal information inside analytics events. Analytics may carry service slug, stage, and interaction type only, never names, emails, phone numbers, or free-text descriptions.
- Data from one client is never visible to another client. Each client's records live in their own CRM or their own isolated database.

## 15. Retention

- CRM records belong to the client and live in the client's CRM under the client's own retention policy.
- Nevamis-held working data (queues, logs, holding store) is kept only as long as operationally required: default 90 days for activity logs, 30 days for retry queues, then deleted.
- On cancellation, Nevamis exports the client's pipeline data to the client, then deletes Nevamis-held copies within 30 days.
- Retention and deletion terms are written into the service agreement before launch, consistent with Canadian and Alberta privacy requirements. Personal information is minimized throughout.

## 16. Integration requirements

- AI Front Desk stack (already live): Twilio for telephony events, ElevenLabs agent for call handling and summaries, Cal.com for bookings.
- One CRM or job-management integration per client at a time, per the Wave 1 MVP limit. Initial candidates from the integration roadmap: HubSpot, Jobber, Housecall Pro, GoHighLevel, Pipedrive, Zoho.
- For clients with no CRM: a simple structured database provided by Nevamis as the system of record.
- Automation layer: n8n, Make, Zapier, or direct APIs, chosen per client for reliability and cost.
- Website form connection for form-sourced leads.
- Email or SMS delivery for alerts and owner summaries (to the client's own staff only).
- Least-privilege API credentials, stored securely, never exposed in code or logs. No integration is claimed publicly until implemented and tested.

## 17. Test cases

At least the following must pass before any client go-live:

1. New caller, no CRM match: a call ends, a new contact is created with correct name, phone, source, and attached summary, and a follow-up task is created because no appointment was booked.
2. Returning caller, exact match: a caller whose number already exists in the CRM calls again; the existing record is updated, no duplicate is created, and the new summary is appended.
3. Ambiguous match: two records share matching data; the system creates no merge, flags the conflict for human review, and the activity appears in the review queue.
4. Form lead: a website form submission creates a contact with the form's source recorded, and the owner notification fires once, not repeatedly.
5. Booked appointment: a Cal.com booking is logged against the correct contact, the stage advances per the approved stage map, and no follow-up task is created.
6. Stale lead: a lead with no activity past the configured threshold triggers exactly one stale-lead alert to the configured recipient.
7. CRM outage: with CRM credentials disabled, inquiries queue, the founder is alerted, and after credentials are restored the queue drains with no lost or duplicated records.
8. Data-quality alert: an inquiry with no name and no callback number creates an incomplete record flagged for review, and nothing fabricated appears in any field.
9. Owner summary: the scheduled pipeline summary matches a manual count of records by stage in the CRM.

## 18. Pilot limits

- Small number of pilot clients, onboarded one at a time, founder-led.
- One CRM (or the simple database) and one calendar per client. No multi-location setups, no custom migrations, no unsupported systems during pilot.
- Defined start event (configuration approved and first live inquiry processed) and end event (agreed pilot period complete).
- Usage cap and founder-time cap agreed before start.
- Client responsibilities: provide CRM access, approve the stage map, review flagged records weekly.
- Excluded from pilot: historical data cleanup beyond a basic import, custom reporting, automated customer messaging (that belongs to Instant Lead Follow-Up), and any autonomous merging or deletion.
- Pilot ends with a written summary against the success metrics and a clear paid-conversion offer, or the service is switched off and data is exported and deleted per the retention terms.

## 19. Success metrics

- Primary metric (from the brief): percentage of qualified inquiries represented by a complete CRM record. Target: measure the client's baseline first, then demonstrate a clear, sustained improvement toward near-complete coverage.
- Secondary metrics:
  - Reduction in manual data-entry time reported by staff.
  - Number of stale leads surfaced and actioned before being lost.
  - Share of closed opportunities with an outcome and reason recorded.
  - Write failure rate and time to recovery.
  - Duplicate rate (lower is better) and time to resolve flagged conflicts.
- Stop criteria: persistent write failures, duplicate creation the client must clean up, or support burden that exceeds the founder-time cap.

## 20. Commercial assumptions

All figures are internal hypothesis, not approved. Do not publish. Canadian dollars, from the brief's internal ranges for this service:

- Setup fee: $750 to $2,500 (internal hypothesis, not approved).
- Monthly fee: $299 to $999 (internal hypothesis, not approved).
- Position in packaging: sold as an add-on to the AI Front Desk (Nevamis Convert package in the brief's packaging roadmap), never as a forced bundle.
- Pricing must account for software cost, AI usage, integration effort, founder onboarding time, ongoing support, failure recovery, reporting time, refund risk, payment-processing fees, target gross margin, and client value. Do not price by marking up software; price the implemented outcome and ongoing management.
- No performance-based component for this service. Performance pricing is reserved for later services and only when attribution is reliable.
- Custom integrations, complex migrations, or multiple locations are quoted separately or declined during the early phase.

## 21. Support requirements

- Founder-led onboarding: CRM connection, stage mapping, alert configuration, and a supervised first week of live records.
- Monitoring of write failures and retry queues with alerts to the founder.
- A weekly review-queue habit with the client during pilot (duplicates, incomplete records).
- Monthly report to the client covering the primary metric and alert activity.
- Incident process: known failure states above have documented recovery steps; the client is told promptly when records were delayed or reconciled.
- Documentation: client-facing one-page guide (what gets written, when, and who to contact) and internal runbook (credentials handling, queue recovery, reconciliation steps).
- Support burden is measured during pilot and feeds the go or no-go decision on wider rollout.

## 22. Launch checklist

- [ ] Problem confirmed through discovery conversations with real service businesses (per the client research plan), not verbal enthusiasm alone.
- [ ] One narrow workflow defined and a manual or assisted version tested first.
- [ ] Client baseline measured: current percentage of inquiries with a complete record.
- [ ] Target CRM integration implemented and tested end to end in a test environment.
- [ ] All test cases in section 17 passing, including outage and recovery.
- [ ] Stage map, task rules, and alert thresholds approved by the client in writing.
- [ ] Least-privilege credentials issued, stored securely, and verified as absent from code, logs, and analytics.
- [ ] Privacy items complete: data minimization checked, retention and deletion terms in the agreement, audit logging on, processor agreements in place where required.
- [ ] Risk register entries reviewed for this service: failed CRM writes, duplicates, cross-client exposure, long retention, vendor outage.
- [ ] Pilot terms signed: scope, caps, start and end events, reporting, conversion offer, data export and deletion.
- [ ] Support runbook and client guide written.
- [ ] Owner approval recorded for pricing before any price is shown to a client.
- [ ] Public status remains "planned" until the owner approves status, copy, pricing, verified integration claims, working purchase path, complete policies, and an existing support process.
