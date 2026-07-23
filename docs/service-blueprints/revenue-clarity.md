# Revenue Clarity (Revenue Attribution and Growth Reporting)

- Pillar: Grow
- Status: planned
- Priority: 12
- Last reviewed: 2026-07-23

Revenue Clarity connects lead sources, calls, appointments, quotes, completed work, and collected payments so owners can understand which activities are producing real business.

## 1. Customer problem

- Marketing reports stop at clicks or leads. The owner sees ad spend and form fills but not revenue.
- Phone calls are disconnected from revenue. A booked job that started with a call cannot be traced back to the campaign that caused the call.
- Businesses cannot identify which sources are profitable, so they keep paying for channels that do not produce collected revenue.
- Performance fees and marketing partnerships become disputed because there are no reliable records tying spend to outcomes.

## 2. Ideal customer profile

- Owner-operated trades and local service businesses in the Edmonton area (plumbing, HVAC, electrical, roofing, landscaping, auto repair, and similar).
- 2 to 25 staff, with the owner or an office manager making marketing decisions.
- Spends money on at least two lead sources (for example Google Ads, Google Business Profile, referrals, a website form) and cannot say which one pays.
- Already uses, or is willing to use, the Nevamis AI receptionist or lead tracking, so call and booking data exists to attribute from.
- Uses a job-management or invoicing system (Jobber, Housecall Pro, ServiceTitan, QuickBooks, or similar) where completed work and payments are recorded.

## 3. Jobs to be done

- When I review my marketing spend, help me see which sources produced collected revenue, so I can cut waste and spend with confidence.
- When a call or form comes in, capture where it came from without my staff having to ask or remember.
- When a job is completed and paid, connect that payment back to the original inquiry, so my ROI numbers are real money and not quoted estimates.
- When I discuss fees with a marketing partner, give me records both sides can trust, so disputes are settled from data instead of memory.

## 4. User roles

- Business owner: reviews reports, makes spend decisions, approves attribution rules and any disputes.
- Office manager or bookkeeper: confirms job status and payment data, flags mismatches.
- Nevamis founder (operator): configures tracking, defines attribution rules with the client, reviews reports before delivery during the pilot, handles disputes.
- The system: records sources, links journey steps, reconciles collected revenue, and drafts reports. It does not make spend decisions.

## 5. Trigger

- Journey capture triggers: a call arrives on a tracked number, a form or chat lead is created, an appointment is booked, a quote is issued, a job status changes, or a payment is recorded in the connected system.
- Reporting triggers: a monthly reporting date, plus an optional weekly summary. Reports are produced on schedule, not on ad-hoc automated sends.

## 6. Inputs

- Lead source data: unique tracked phone numbers per campaign, UTM or form source fields, and a manual source field for walk-ins and referrals.
- Call and message records from the Nevamis receptionist stack (Twilio call logs, transcripts where consent exists).
- Appointment records (Cal.com or the client's scheduling system).
- Quote records from the client's CRM or job-management system.
- Job status and completion records.
- Collected payment records from the invoicing, payments, or accounting system (Stripe, QuickBooks, or the job-management system's payments).
- Marketing cost inputs per source (ad spend, directory fees), entered or imported monthly.
- Written attribution rules agreed with the client (see section 7).

## 7. Decision rules

- Count collected revenue only. Quoted or invoiced-but-unpaid amounts are tracked separately and never reported as revenue.
- Exclude taxes, refunds, chargebacks, and revenue from unrelated business lines.
- Apply a written attribution window agreed with the client before launch (default: 90 days from first tracked contact to job completion; conservative and adjustable per trade).
- Define and apply written rules for repeat customers, existing leads, referrals, and upsells. Default: existing customers and pipeline that predate tracking are excluded from new-revenue attribution.
- First tracked touch is the default source of record; if multiple sources touch a lead, the report shows the journey rather than silently picking a winner.
- Never claim causation from correlation. Reports say "attributed to" with the method stated, not "caused by."
- If a journey step cannot be linked with a supporting record, the revenue is classified as "unattributed," never guessed.
- Any figure used to support a performance fee must be reproducible from stored records.

## 8. Actions

- Assign and maintain unique tracking numbers or campaign identifiers per source.
- Create a lead record with source when a call, form, or chat arrives.
- Link the conversation, the appointment, the quote, and the job outcome to that lead record as each occurs.
- Reconcile collected payments against linked jobs on a regular cycle.
- Compute cost per qualified lead, source-level conversion rates, and collected revenue per source.
- Draft the monthly report and dashboard update.
- Flag anomalies (unlinked payments, duplicate leads, refunds against attributed jobs) for human review instead of auto-correcting.
- Where a performance-fee agreement exists, produce the supporting attribution statement for human review.

This service operates at AI action Level 1 to 2: it records, links, reconciles, and drafts. It does not send client-facing communications and it does not change spend.

## 9. Outputs

- Monthly revenue attribution report per source: leads, qualified leads, appointments, quotes, jobs completed, collected revenue, cost, cost per qualified lead, and conversion rates.
- A revenue dashboard the owner can view between reports.
- An unattributed-revenue list with reasons, so gaps are visible instead of hidden.
- Exception list: refunds, chargebacks, disputes, and data mismatches.
- Where applicable, a performance-fee support statement showing the records behind each attributed dollar.
- Primary headline metric on every report: percentage of collected new revenue with a supported source and customer journey.

## 10. Human approval points

- Attribution rules, windows, and exclusions are written and signed off by the owner before the first report.
- The founder reviews every report before delivery during the pilot phase.
- Any performance-fee statement requires founder review and owner acknowledgment before it is used in billing.
- Any change to attribution rules after launch requires owner approval and is dated in the report.
- Dispute resolutions are decided by humans using the stored records; the system only assembles the evidence.

## 11. Failure states

- Tracking number misconfigured or ported incorrectly, so calls arrive untracked.
- CRM, scheduling, or payments integration fails or changes its API, breaking journey links.
- Payments recorded outside the connected system (cash, e-transfer entered late) leave revenue unlinked.
- Duplicate leads or merged customers cause double counting.
- Refunds or chargebacks arrive after a report was issued, overstating attributed revenue.
- Staff bypass the intake process, so source is never captured.
- Misattribution risk: a report credits the wrong source, damaging trust or corrupting a performance fee.
- Sensitive personal information leaks into analytics records.

## 12. Fallback

- If a data feed breaks, the affected metrics are marked "data incomplete since [date]" in the report; nothing is estimated to fill the gap.
- If attribution confidence is low for a period, the report ships with the unattributed share stated plainly and a corrective plan.
- If a report was issued and later data (refunds, chargebacks) changes the numbers, a dated correction is issued and any performance fee is adjusted in the next cycle.
- If integrations cannot be restored, the service falls back to a manually reconciled monthly report assembled by the founder from exports, at reduced scope, until tracking is repaired.
- The client can pause the service without losing their historical reports.

## 13. Data stored

- Lead records: source, timestamps, contact identifiers needed for linking (name, phone, email).
- Journey link records: call metadata, appointment references, quote references, job identifiers, payment identifiers and amounts.
- Marketing cost entries per source.
- Written attribution rules, rule changes with dates, and dispute records.
- Issued reports and the record set supporting each figure.
- Audit log of material actions (links created, reconciliations, corrections).

## 14. Data not stored

- Full payment card numbers, banking credentials, or any payment credentials (only payment references and amounts from the connected system).
- Call recordings or transcripts beyond what the receptionist service already retains under its own consent and retention rules; Revenue Clarity stores links and metadata, not duplicate media.
- Sensitive personal information not needed for attribution (health details, government IDs, personal financial details of end customers).
- Data from business lines or accounts outside the agreed scope.
- Marketing platform logins; access is via least-privilege API connections, not stored client passwords.

## 15. Retention

- Journey and reconciliation records: retained for the length of the engagement plus 24 months, because they support issued reports and any performance-fee billing, then deleted.
- Issued reports: retained for the same period as business records.
- Leads that never become customers: personal identifiers minimized after 12 months (kept only in aggregate counts).
- On termination: client receives an export of their reports and attribution data; identifiable records are deleted on the agreed schedule, subject to legal and accounting retention obligations.
- Retention terms are written into the service agreement, consistent with Canadian and Alberta privacy requirements (PIPEDA and PIPA).

## 16. Integration requirements

- Telephony: Twilio tracked numbers and call event data (already core to the Nevamis receptionist stack).
- Scheduling: Cal.com (Nevamis default) or the client's calendar system, for appointment linkage.
- CRM or job management: one system per client at a time during the pilot (Jobber, Housecall Pro, ServiceTitan, HubSpot, GoHighLevel, or similar), for lead, quote, and job status data.
- Payments and accounting: Stripe or the client's invoicing or accounting system, for collected-revenue reconciliation.
- Automation layer: n8n, Make, Zapier, or direct APIs for event movement.
- Data and reporting: a secure database, a call and message event store, and a dashboard system.
- For each integration, document API availability, authentication, permissions, webhooks, rate limits, failure behavior, and data accessed, per the integration roadmap. Do not state publicly that an integration exists until it is implemented and tested.

## 17. Test cases

1. Tracked call to booked, paid job: a call arrives on the Google Ads tracking number, is booked, quoted, completed, and paid in the job system. The report shows one lead, one job, and the collected amount (excluding GST) attributed to Google Ads.
2. Quoted but unpaid: a quote is accepted but no payment is collected in the period. The report shows the quote in pipeline and zero attributed revenue for it.
3. Refund after reporting: a job attributed last month is refunded this month. The system flags it, the next report shows a dated correction, and any performance-fee base is reduced accordingly.
4. Repeat customer exclusion: an existing customer from before tracking began books new work through a tracked number. Under the default rules the revenue is classified as existing-customer, not net-new, and the report says so.
5. Unlinkable payment: a cash payment is entered in the job system with no linked lead. It appears on the unattributed list with a reason, and the headline "supported journey" percentage reflects it.
6. Attribution window boundary: a lead first tracked 100 days before job completion, with a 90-day window, is reported as outside-window and excluded from attributed new revenue.
7. Broken integration: the CRM connection fails for five days. The report marks affected metrics as incomplete for those dates, and no numbers are estimated.
8. Duplicate lead merge: the same customer calls from two tracked numbers. The system flags the duplicate for human review and the journey is merged without double counting.

## 18. Pilot limits

- 1 to 3 pilot clients, all existing Nevamis receptionist or lead-tracking clients, so source data already exists.
- One CRM or job-management integration per client.
- One business location and one business line per client.
- Monthly reporting cadence only; founder reviews every report before delivery.
- No performance-based pricing during the pilot. Performance pricing is not sold until lead sources can be identified, appointments linked, completed work reconciled, collected revenue verified, refunds accounted for, attribution rules written, and disputes resolvable from records.
- Minimum two full months of tracked data before the first ROI-style report is delivered.
- No public claims about client results from pilot data.

## 19. Success metrics

- Primary: percentage of collected new revenue with a supported source and customer journey (target: above 80 percent by month three of a pilot, measured honestly with the unattributed share shown).
- Report delivered on schedule each month with zero corrected headline figures caused by system error.
- Reconciliation gap between reported collected revenue and the client's accounting records within an agreed tolerance.
- Owner can name their most and least profitable source after month two, and reports at least one spend decision made using the data.
- Zero attribution disputes that could not be resolved from stored records.
- Pilot clients continue the service after the pilot period.

## 20. Commercial assumptions

All figures are internal hypothesis, not approved, in Canadian dollars, taken from the brief's illustrative internal ranges. They are not public prices.

- Setup: $1,500 to $5,000 (tracking numbers, integrations, attribution rules workshop, baseline data load).
- Monthly: $500 to $2,000 (data pipeline upkeep, reconciliation, report production, review time).
- Optional performance component: only when attribution is reliable, per the brief's rules. The brief's starting hypothesis for performance models is a base retainer plus approximately 5 to 10 percent (preferred 7.5 percent) of collected, attributable net-new revenue, with a limited attribution window and an optional monthly cap during the first test. Not offered during the pilot.
- Pricing must model software cost, AI usage, telephony usage, founder onboarding time, ongoing support, failure recovery, reporting time, refund risk, payment-processing fees, gross margin, and client value; do not price by marking up software.
- Positioned as an add-on in the Nevamis Grow package alongside the Review and Referral Engine and website conversion work; modular adoption, no forced bundling.

## 21. Support requirements

- Founder-led onboarding: attribution rules workshop, tracking setup, and integration configuration (estimate 4 to 8 hours per client at pilot stage).
- Monthly: reconciliation review and report QA before delivery (estimate 1 to 3 hours per client).
- A written dispute process: the client can challenge any attributed figure, the founder re-checks it against stored records, and the outcome is documented in the next report.
- Integration monitoring with alerts on failed syncs, and a target of acknowledging data-feed failures within one business day.
- Client-facing documentation: how sources are tracked, what the attribution rules mean, and what "unattributed" means.
- Support channel: email and phone to the founder during the pilot; no self-serve support tier yet.

## 22. Launch checklist

- [ ] Attribution rules template written, including windows, exclusions (taxes, refunds, chargebacks, unrelated business), and definitions for repeat customers, existing leads, referrals, and upsells.
- [ ] Dispute process written and included in the service agreement.
- [ ] Tracked-number provisioning and source capture tested end to end on the Nevamis stack.
- [ ] One CRM or job-management integration implemented and tested with sandbox data.
- [ ] Payments reconciliation tested against a real export, including a refund case.
- [ ] Report template approved: collected revenue only, method stated, unattributed share always shown, no causation language.
- [ ] All eight test cases in section 17 passing on pilot data.
- [ ] Privacy review done: data minimized, retention and deletion defined, least-privilege access, processor agreements in place, audit logs on.
- [ ] Risk register entries added for revenue misattribution, payment disputes, and sensitive information in analytics.
- [ ] Service agreement and pricing reviewed by the owner; performance-fee language withheld until the reliability conditions are met and the agreement has professional legal and accounting review.
- [ ] Coming Soon page copy uses planned-status language only; no availability, guarantee, or results claims.
- [ ] Pilot clients selected from existing receptionist clients and onboarding scheduled.
