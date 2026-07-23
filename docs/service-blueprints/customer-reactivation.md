# Service Blueprint: Customer Reactivation (Past-Customer Reactivation)

| Field | Value |
| --- | --- |
| Title | Customer Reactivation (Past-Customer Reactivation) |
| Pillar | Convert |
| Status | Planned |
| Priority | 7 |
| Last reviewed | 2026-07-23 |

Customer-facing summary: Nevamis can help approved businesses reconnect with eligible past customers when maintenance, seasonal work, renewals, or related services may be useful.

This document is an internal planning blueprint. Nothing here is a commitment to build, a public feature list, or approved pricing. Do not implement in production from this document alone.

## 1. Customer problem

- Valuable customer lists sit unused.
- Maintenance opportunities are forgotten.
- Seasonal demand is not activated.
- Businesses continually pay for new leads instead of returning to existing relationships.
- Nobody owns the job of contacting past customers, so it never happens consistently.

## 2. Ideal customer profile

- Local service business or trades company (plumbing, HVAC, electrical, furnace and duct cleaning, landscaping, automotive, and similar) in the Edmonton area first, then wider.
- Has an existing customer list of past jobs with contact details, ideally in a CRM or job-management system.
- Sells work that naturally repeats: maintenance, seasonal service, inspections, renewals, or follow-on projects.
- Can identify, or is willing to help identify, which past customers are eligible to contact and on what legal basis.
- Owner or office manager admits that past customers are not being contacted today.
- Ideally already a Nevamis AI Front Desk or follow-up client, so contact records, booking flow, and consent history already exist.

Not a fit: businesses with no recorded customer history, businesses that want to message purchased or scraped lists, or businesses unwilling to approve message templates and segments before sending.

## 3. Jobs to be done

- When a customer's maintenance or seasonal service comes due, I want them contacted with an approved message, so repeat work books itself instead of being forgotten.
- When a past customer has gone quiet for a long time, I want a respectful check-in sent, so I win back relationships without paying for a new lead.
- When a customer replies, I want the response understood and an appointment offered, so interest turns into a booked job.
- When a customer says stop, I want that respected everywhere and permanently, so I never damage a relationship or break the rules.
- As an owner, I want to see what reactivation outreach actually produced, so I know the service pays for itself.

## 4. User roles

- Business owner: approves customer segments, message templates, timing, and offers; confirms the source and legal basis for each segment; final say on anything commercial.
- Office staff: reviews escalations, handles pricing questions and complaints, confirms bookings when needed, marks records that should never be contacted.
- Past customer: receives an approved message, replies with interest, questions, a booking, or a request to stop.
- Nevamis (founder-led at pilot stage): configures segments and templates, monitors sends and logs, handles incidents, produces reporting.
- The system itself operates at Action Level 2 (act within rules): approved segments only, fixed approved templates, explicit send limits, escalate anything uncertain. Campaign launch always requires human approval.

## 5. Trigger

- Primary trigger: the owner approves a campaign for a specific eligible segment (for example, furnace customers last serviced 10 to 14 months ago) with a specific approved template and send window.
- Time-based triggers within an approved campaign: service-due date reached, season start, warranty or renewal date approaching, or a lapsed threshold passed (for example, no job in 18 months).
- Secondary triggers: an inbound reply to a reactivation message, a booking made through the booking link, or an unsubscribe request on any channel.
- No message is ever sent from a raw list upload alone. Segment approval and template approval must both exist first.

## 6. Inputs

- Customer records from the connected CRM or job-management system: name, contact details, last service date, service type, and location.
- Consent and eligibility data per contact: source of the contact, legal basis for contacting them (for example, existing business relationship), channel consent, and unsubscribe state.
- The suppression list: every contact who has opted out, complained, or been manually excluded, across all campaigns and services.
- Owner-approved segment definitions, message templates (SMS and email), offer wording if any, and send windows.
- Calendar availability from Cal.com or the connected booking system for appointment offers.
- Business profile: services offered, service area, hours, and booking rules already maintained for the AI Front Desk.

## 7. Decision rules

- Contact only customers in an owner-approved segment with a recorded source and legal basis. If either is missing, the contact is skipped and logged.
- Check the suppression list before every individual send, not just at campaign build time. A suppressed contact is never messaged by any campaign, including new ones.
- Send only approved templates. The system never composes free-form outbound marketing copy.
- Send only within approved windows (default: business hours, local time, no statutory holidays).
- Classify each reply as interested, question, booking request, not now, wrong person, complaint, or stop.
- Interested and booking-request replies get an appointment offer from real calendar availability.
- Questions are answered only from approved business information. Pricing beyond approved list prices, complaints, and anything ambiguous escalate to a human.
- Stop, complaint, and wrong-person replies immediately update the suppression list and end all outreach to that contact.
- Frequency cap: a contact receives at most one reactivation message plus a maximum of one approved follow-up per campaign, and is not enrolled in overlapping campaigns.
- If CRM data looks stale or inconsistent (for example, duplicate contacts or missing dates), the affected records are held for human review instead of being messaged.

## 8. Actions

- Build the eligible send list for an approved campaign, applying eligibility, suppression, and frequency rules.
- Send approved SMS or email messages through Twilio (SMS) or the connected email provider, with correct sender identification and a working unsubscribe mechanism.
- Classify inbound replies and respond with the approved next step.
- Offer and book appointments using real availability, then send booking confirmation.
- Update the CRM: outreach sent, reply received, classification, booking created, opt-out recorded.
- Add opt-outs, complaints, and wrong-person records to the suppression list immediately.
- Escalate complaints, pricing questions, and unclear replies to staff with full context.
- Produce a per-campaign summary: sent, delivered, replies by type, bookings, opt-outs, and escalations.

## 9. Outputs

- Booked appointments on the business calendar with confirmations to the customer.
- Updated CRM records showing outreach history, reply classification, and outcome per contact.
- An always-current suppression list shared across all Nevamis services for that client.
- Escalation alerts to staff for anything requiring human judgment.
- Campaign summary report for the owner, including collected reactivation revenue where the business records it.
- Response summaries so staff can read what a customer said without digging through threads.

## 10. Human approval points

- Segment approval: the owner confirms each segment, its source, and its legal basis before any campaign is built.
- Template approval: every message template and any offer wording is approved in writing before first use.
- Campaign launch: a human explicitly starts each campaign. There is no fully automatic recurring send in the pilot.
- Pricing: any price discussion beyond approved listed prices goes to a human. The system never negotiates.
- Complaints: every complaint goes to a human. The system sends no complaint responses on its own.
- Changes to send windows, frequency caps, or follow-up counts require owner approval.

## 11. Failure states

- Messaging provider outage or carrier filtering: messages fail or are delayed.
- CRM read or write failure: eligible list cannot be built, or outcomes are not recorded.
- Stale or wrong customer data: message reaches a wrong number or a person who never was a customer.
- Misclassified reply: an interested customer is treated as not interested, or a stop request is missed by classification.
- Duplicate sends caused by duplicate CRM records.
- Calendar integration failure: an appointment is offered but cannot be booked.
- A suppressed contact is nearly messaged because a new list bypassed checks.

## 12. Fallback

- Any send failure is retried within limits, then logged and surfaced. Failed sends are never silently dropped or endlessly retried.
- If the suppression list cannot be verified for any reason, sending stops entirely for that client until it can. No suppression check means no send.
- If CRM writes fail, outreach pauses and Nevamis is alerted. The system does not keep messaging while unable to record outcomes.
- Any reply that classification is unsure about, including anything that might be a stop request, is treated conservatively: outreach to that contact pauses and a human reviews it.
- If booking fails, the customer receives an approved message with a direct way to reach the business, and staff are alerted.
- Kill switch: the owner or Nevamis can stop any campaign immediately, mid-send.

## 13. Data stored

- Contact identity and channel details needed to send and record outreach.
- Consent record per contact: source, legal basis, purpose, channel, and unsubscribe state.
- Suppression list entries with date and reason.
- Message log: template used, timestamp, delivery status, and reply classification.
- Booking records and CRM update history.
- Campaign definitions, approvals (who approved what and when), and audit logs for material actions.

## 14. Data not stored

- No scraped or purchased contact data, ever.
- No payment card numbers or banking details.
- No government identification numbers.
- No health information or other sensitive personal details a customer may mention; if a reply contains such content it is escalated, not mined or reused.
- No message content copied into analytics tools. Analytics use counts and classifications only.
- No data from one client is used for any other client.

## 15. Retention

- Consent, unsubscribe, and suppression records are retained as long as needed to honour them, including after a campaign or the service ends.
- Message logs and campaign records are retained for the service relationship plus a defined wind-down period (working default: 24 months, to be confirmed with professional advice), then deleted.
- On client offboarding, customer data is exported to the client and deleted from Nevamis systems on a documented schedule, except suppression records needed to honour opt-outs.
- Retention periods are documented per client and reviewed before general launch. This blueprint does not claim legal compliance; it defines the design intent.

## 16. Integration requirements

- One CRM or job-management system per client at pilot stage, with read access to customer and job history and write access for outcomes.
- Twilio for SMS sending and inbound reply handling, reusing the existing Nevamis messaging stack.
- An email sending provider with sender identification and one-click unsubscribe support.
- Cal.com or the client's existing booking system for appointment offers, reusing the AI Front Desk booking flow.
- Shared suppression list infrastructure used by all Nevamis outreach services for that client.
- Depends on Priority 2 (CRM and Lead Pipeline Automation) foundations: clean contact records and reliable CRM read and write.

## 17. Test cases

At least the following must pass before any real customer is messaged, using test numbers and a sandbox segment:

1. Eligible send: a contact in an approved segment with recorded source and legal basis receives exactly one approved template message inside the send window, and the send is logged in the CRM.
2. Suppression enforcement: a contact who opted out of a previous review-request campaign is included in a new reactivation list upload; the system must skip them, log the skip, and send nothing.
3. Stop request: a contact replies "STOP" (and separately, a natural-language variant such as "please don't text me again"); both must trigger immediate suppression, a single compliant confirmation where required, and no further messages of any kind.
4. Interested reply to booking: a contact replies "yes, the furnace is due"; the system classifies it as interested, offers real available times, books the appointment on the calendar, sends confirmation, and writes the outcome to the CRM.
5. Complaint escalation: a contact replies angrily about past work; the system sends no automated marketing response, suppresses further outreach, and escalates to staff with the full reply text.
6. Missing legal basis: a segment upload includes a contact with no recorded source or legal basis; the system holds that contact for review and does not send.
7. Duplicate protection: the same customer exists twice in the CRM with the same phone number; the system sends at most one message and flags the duplicate.
8. Kill switch: mid-campaign, the owner stops the campaign; all queued sends halt within one minute and the log shows exactly who was and was not messaged.

## 18. Pilot limits

- One client at a time for the first pilots, founder-operated.
- One CRM integration, one calendar, SMS plus email only. No voice outreach in the pilot.
- Maximum one active campaign per client and a hard cap on sends per day (working default: 50 per day) until deliverability and reply handling are proven.
- Approved segments and approved templates only. No dynamic or generated marketing copy.
- Human approval to launch every campaign. No standing automatic campaigns during the pilot.
- Pilot length: aligned with the standard Nevamis pilot structure, long enough to cover at least one full campaign and its replies.

## 19. Success metrics

- Primary metric (from the brief): collected reactivation revenue from eligible customers.
- Booked appointments from reactivation outreach.
- Reply rate and positive-reply rate per campaign.
- Opt-out rate and complaint rate (must stay low; a rising rate is a stop signal, not a tuning input).
- Repeat business and customer lifetime value trend for the client.
- Owner-visible outcome: the client can see which jobs came from reactivation without unsupported attribution claims. If revenue cannot be attributed reliably, report bookings and say so plainly.

Stop criteria: complaint or opt-out rates above the agreed threshold, any suppression failure, or any send to an ineligible contact triggers an immediate campaign stop and review.

## 20. Commercial assumptions

All figures are internal hypothesis, not approved. Canadian dollars. Do not publish, quote, or contract from these numbers.

- Setup: $750 to $2,500 (internal hypothesis, not approved).
- Monthly: $299 to $999 plus messaging usage (internal hypothesis, not approved).
- Structure follows the brief's add-on model: one-time setup fee, monthly management fee, included usage, transparent overage, and custom integration fee where needed.
- A performance component (approximately 5 to 10 percent of collected, attributable net-new revenue) is a possible future test only where attribution is reliable. It is not offered otherwise and is never advertised on the public site.
- Pricing must model software cost, AI usage, messaging usage, founder onboarding time, ongoing support, failure recovery, reporting time, refund risk, payment-processing fees, gross margin, and client value. Do not price by marking up software alone.

## 21. Support requirements

- Founder-led onboarding at pilot stage: segment review, legal-basis confirmation, template approval, suppression-list setup, and test sends before launch.
- Monitoring during every active campaign: delivery rates, replies, escalations, and opt-outs reviewed at least daily while a campaign runs.
- Escalation handling: complaints and pricing questions must reach the client's staff quickly, with a documented incident process for anything sent in error.
- Monthly reporting per client: campaigns run, outcomes, opt-outs, and revenue where recorded.
- Documentation per client: approved segments, approved templates, consent basis, send caps, and the kill-switch procedure.
- Support burden assumption: moderate. Reply classification and complaint handling create more human touchpoints than one-way reminder services.

## 22. Launch checklist

Before the first real campaign for any client:

- [ ] Client has an active, stable core service relationship (Wave 0 discipline: do not expand onto an unstable base).
- [ ] CRM integration tested for read and write, duplicates reviewed.
- [ ] Segment defined, source and legal basis recorded for every contact, owner approval captured in writing.
- [ ] Message templates approved in writing, with sender identification and working unsubscribe on every channel.
- [ ] Suppression list built, shared across all Nevamis services for this client, and verified in a test send.
- [ ] CASL and applicable CRTC and privacy design requirements reviewed for this client's outreach; professional review obtained for legal claims and contract language.
- [ ] All test cases in section 17 passed with test contacts.
- [ ] Send caps, send windows, and frequency caps configured.
- [ ] Escalation contacts confirmed and reachable during send windows.
- [ ] Kill switch tested.
- [ ] Reporting template ready and the primary metric (collected reactivation revenue) measurable or explicitly noted as bookings-only.
- [ ] Pilot terms, pricing, and any offer wording approved by the owner. No unapproved prices anywhere in messages.
