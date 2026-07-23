# Service Blueprint: Schedule Protection (Appointment Reminders and Schedule Recovery)

- Title: Schedule Protection
- Pillar: Nevamis Convert (add-on to the Nevamis Front Desk AI receptionist)
- Status: planned
- Priority: 4
- Last reviewed: 2026-07-23

Internal planning document. Not public. Nothing here is an approved price, an approved feature commitment, or a compliance claim. This service is not built and must not be displayed as available.

## 1. Customer problem

- No-shows waste time. A tradesperson drives to a job or holds a slot open and the customer never appears.
- Late cancellations leave empty capacity that cannot be refilled on short notice.
- Staff spend time sending reminders manually, one customer at a time.
- Rescheduling creates phone tag: the customer calls, staff are on a job, voicemail goes unanswered, the slot stays uncertain.

The cost is real for appointment-driven service businesses: an empty slot is unrecoverable revenue, and the administrative time spent confirming and chasing appointments is time not spent on billable work.

## 2. Ideal customer profile

- Small appointment-driven service business in the Edmonton area, expanding to other Canadian markets later.
- Trades first (HVAC, plumbing, electrical, appliance repair), plus clinics, salons, detailers, and similar businesses that run on a bookable calendar.
- 1 to 15 staff, owner-led, no dedicated office manager or a single overloaded one.
- Already uses, or is willing to use, an online calendar (the current Nevamis stack books through Cal.com).
- Best fit: an existing Nevamis Front Desk client whose AI receptionist already creates the appointments this service would protect.
- Poor fit: businesses with no consistent calendar of record, or businesses whose appointments carry medical or safety-critical consequences where a missed reminder could cause harm.

## 3. Jobs to be done

- When an appointment is created, confirm it with the customer so both sides trust the booking.
- When an appointment is approaching, remind the customer at sensible times so they show up or tell us early that they cannot.
- When a customer needs to move an appointment, let them do it without phone tag.
- When a customer cancels, try to recover the value: rebook the customer and refill the empty slot.
- When a slot opens up, tell waitlisted customers or staff so capacity is not wasted.
- When a customer no-shows, follow up politely and offer a rebooking.
- Keep the calendar, the customer, and the staff all seeing the same truth.

## 4. User roles

- Business owner: approves message templates, reminder timing, and rules; receives utilization reporting; can pause the service at any time.
- Office staff or dispatcher: sees confirmations, cancellations, and recovery actions; handles escalations; can override any automated action.
- Field staff or service provider: receives schedule-change notifications; does not configure the system.
- Customer (end recipient): receives confirmations and reminders, replies to confirm, reschedule, or cancel, and can opt out at any time.
- Nevamis (founder-operated at pilot stage): sets up the service, monitors logs, handles failures, and reviews performance with the owner.

## 5. Trigger

- Primary trigger: an appointment is created in the connected calendar (Cal.com in the current stack), whether booked by the AI receptionist, by staff, or by the customer online.
- Time triggers: scheduled reminder points before the appointment (for example 24 hours and 2 hours ahead; exact timing approved per client).
- Event triggers: customer reply (confirm, reschedule, cancel), a cancellation or reschedule in the calendar, an appointment marked as no-show, and a slot opening that matches a waitlist entry.

## 6. Inputs

- Appointment record: date, time, duration, service type, location, assigned staff member.
- Customer contact details: name, phone number, and email where provided.
- Consent and opt-out state for SMS and email contact.
- Owner-approved message templates and reminder schedule.
- Business rules: business hours, quiet hours for sending, minimum notice for rescheduling, cancellation policy wording as approved by the owner.
- Waitlist entries, where the client chooses to use a waitlist.
- Calendar availability for offering reschedule options.

## 7. Decision rules

- Classified as AI Action Level 2 (act within rules): the system performs low-risk approved actions using fixed templates with explicit limits, and escalates uncertainty to a human.
- Send confirmations and reminders only from owner-approved templates. The system never composes free-form promises.
- Send only within approved hours. No reminders during quiet hours; anything due overnight waits for the morning window.
- Respect consent: no SMS or email without a recorded lawful basis under CASL, and an opt-out stops all further messages immediately.
- A clear customer reply ("yes", "confirm", "cancel") is acted on by rule. An ambiguous reply is routed to a human, not guessed at.
- Rescheduling is offered only from real calendar availability. The system never invents a slot and never double-books.
- The system never invents prices, discounts, terms, or technical promises. Questions about cost, scope, complaints, or anything unusual are escalated to staff.
- Cancellation-fee or policy enforcement is stated only in the owner's approved wording; the system never negotiates it.
- A maximum message count per appointment is enforced (planning default: confirmation plus two reminders plus at most one follow-up) to prevent excessive contact.
- Duplicate-send protection: each message type is sent at most once per appointment per trigger.

## 8. Actions

Planned workflow: appointment created, confirmation sent, reminder sent, customer confirms or reschedules, cancellation creates a recovery action, calendar updated, staff notified.

- Send an appointment confirmation shortly after booking.
- Send reminders at the approved times before the appointment.
- Process a confirmation reply and mark the appointment confirmed.
- Process a reschedule request: offer available slots, book the chosen one, update the calendar, confirm the change to the customer, and notify staff.
- Process a cancellation: update the calendar, send the owner-approved acknowledgment, and open a recovery action (offer to rebook the customer; flag the empty slot).
- Notify waitlisted customers when a matching slot opens, where the client uses a waitlist.
- Alert staff to empty slots that automation could not refill.
- Send a polite no-show follow-up with a rebooking offer after staff mark a no-show.
- Keep the calendar synchronized so staff, customer, and system agree on the schedule.
- Log every message and calendar change for audit.

## 9. Outputs

- Confirmed, rescheduled, or cancelled appointment states in the calendar of record.
- Customer-facing messages: confirmation, reminders, reschedule options, cancellation acknowledgment, waitlist offer, no-show follow-up.
- Staff notifications for schedule changes, escalations, and unfilled slots.
- A simple activity log per appointment: what was sent, when, and what the customer replied.
- Reporting for the owner: no-show rate, cancellation rate, recovered slots, and reminder delivery rate over the period.

## 10. Human approval points

- Owner approves all message templates and wording before launch, including cancellation-policy language.
- Owner approves reminder timing, quiet hours, and the maximum message count.
- Any reply the system cannot classify with confidence goes to a human before any action is taken.
- Complaints, fee disputes, refund requests, and anything resembling a legal or medical matter are always escalated; the system sends no substantive reply.
- Rescheduling beyond simple slot swaps (for example multi-visit jobs or jobs requiring specific staff) is proposed to staff, not auto-booked, until the client asks otherwise.
- No-show follow-up is sent only after a human marks the appointment as a no-show; the system does not infer no-shows on its own during pilot.
- Template or rule changes after launch require owner sign-off before going live.

## 11. Failure states

- SMS or email delivery failure (bad number, carrier filtering, bounced email).
- Calendar API unavailable or slow, so availability cannot be read or a change cannot be written.
- Double-booking caused by a race between the customer, staff, and the system.
- Reminder sent for an appointment that staff already cancelled outside the system.
- Duplicate messages from a retried webhook or a repeated trigger.
- Misclassified customer reply (a cancellation read as a confirmation, or the reverse).
- Message sent outside quiet hours due to a timezone or configuration error.
- Contact sent to someone who opted out or was never eligible.
- Vendor outage (messaging provider, calendar provider, or AI provider).
- Excessive follow-up caused by a rule bug.

Each of these appears in the internal risk register with detection, mitigation, and an owner.

## 12. Fallback

- If a message cannot be delivered, retry within safe limits, then flag the appointment to staff so a human can call the customer.
- If the calendar cannot be read or written, stop offering reschedules, queue the change, and notify staff immediately; never guess at availability.
- If reply classification is uncertain, take no automated action and route the conversation to staff.
- If the messaging or AI vendor is down, the service degrades to a staff notification list: staff see which reminders were due and can send them manually.
- If any rule bug causes wrong or excessive sends, the client-level kill switch pauses all outbound messages for that client while the calendar sync continues read-only.
- The business can always operate without the service: the calendar remains the source of truth and staff can revert to manual reminders at any time.

## 13. Data stored

- Appointment details needed to operate: date, time, service type, assigned staff, and status history.
- Customer name and the contact channel used (phone number or email).
- Consent basis, source, and opt-out state for each contact channel.
- Message log: template used, send time, delivery status, and the customer's replies to this service.
- Waitlist entries where used.
- Aggregate metrics: no-show rate, cancellation rate, recovered slots.
- Audit log of material automated actions.

## 14. Data not stored

- No payment card numbers, banking details, or government identifiers.
- No medical, health, or other sensitive personal details; if a customer volunteers such information in a reply, it is routed to staff and not retained in the automation's records beyond the escalation.
- No call recordings (this service is message-based; any voice interaction belongs to the receptionist service and follows its consent rules).
- No customer data from one Nevamis client is ever visible to another client.
- No personal information in analytics; reporting uses aggregates.
- No contact lists imported without a documented consent basis.

## 15. Retention

- Message logs and reply history: retained for 12 months for support and dispute resolution, then deleted (planning default; confirm per client agreement and legal review).
- Appointment records: remain in the client's own calendar and CRM; Nevamis keeps only the operational copy needed for logs.
- Opt-out records: retained as long as needed to keep honoring the opt-out.
- Aggregate metrics without personal information: may be retained longer for service reporting.
- On service termination: client data is exported to the client on request and deleted from Nevamis systems within 30 days, except records required to honor opt-outs or legal obligations.
- Retention and deletion terms receive professional legal review before public commitment; this section is a planning default, not a compliance claim.

## 16. Integration requirements

- Calendar: Cal.com (current Nevamis stack) with API access and webhooks for created, changed, and cancelled events. Other calendars considered later only with a real client need.
- SMS: Twilio, using the client's dedicated number where possible, with sender identification and STOP-style opt-out handling.
- Email: a transactional email provider with unsubscribe handling, for clients who prefer email reminders.
- AI receptionist: hand-off with the existing ElevenLabs and Twilio voice stack, so an appointment booked by the receptionist is automatically protected and a customer who calls to reschedule reaches consistent behavior.
- CRM or lead pipeline (Priority 2 service) where present: appointment outcomes written back to the customer record.
- Credentials for ElevenLabs, Twilio, Cal.com, CRM, and email are never exposed in code, logs, or documents.
- Least-privilege access per client; no shared credentials across clients.

## 17. Test cases

At minimum, before any pilot:

1. Appointment created in Cal.com: confirmation message is sent once, within the approved window, using the approved template, and logged.
2. Reminder timing: an appointment at 9:00 tomorrow produces the 24-hour and 2-hour reminders at the correct local times, and a reminder that would fall inside quiet hours is held until the approved window.
3. Customer replies "yes" to a reminder: appointment marked confirmed, no further reminders beyond the approved schedule, staff dashboard reflects the confirmation.
4. Customer replies asking to move the appointment: system offers only genuinely available slots, books the selected one, updates Cal.com, confirms to the customer, and notifies staff; the old slot is released.
5. Customer replies "STOP": all further messages to that contact cease immediately, the opt-out is recorded, and staff are notified to handle the appointment manually.
6. Cancellation received: calendar updated, approved acknowledgment sent, recovery action created, and a matching waitlist customer (where configured) is notified exactly once.
7. Ambiguous reply ("maybe, depends on my shift"): no automated action; conversation escalated to staff with full context.
8. Calendar API down during a reschedule request: no slot is offered, the customer receives the approved fallback message, and staff are alerted.
9. Duplicate webhook for the same appointment: no duplicate confirmation or reminder is sent.
10. Staff cancel an appointment directly in the calendar: pending reminders for it are cancelled and no stale reminder goes out.
11. Price or complaint question in a reply: the system sends no substantive answer and escalates to a human.
12. Kill switch: pausing the client stops all outbound messages within one minute while logging continues.

## 18. Pilot limits

- Pilot with a small number of qualified clients (planning target: 2 to 3), ideally existing Front Desk clients.
- One narrow workflow first: confirmation plus reminders plus manual-assisted rescheduling. Waitlist and no-show follow-up are added only after the core loop is stable.
- Eligibility: client must have a working Cal.com calendar of record and a documented consent basis for contacting their customers.
- Client responsibilities: keep the calendar accurate, mark no-shows, respond to escalations within an agreed time.
- Usage cap: a defined monthly message volume per client; overage requires discussion, not silent billing.
- Founder-time cap: a defined setup and support ceiling per pilot client so the pilot's true cost is known.
- Start event and end event defined in writing before the pilot begins; the pilot ends unless a paid agreement is accepted.
- If the pilot is free, it is treated as customer-acquisition cost with honest scope limits; no card is required for anything labeled free if automatic billing would occur.
- A manual or assisted version runs first; full automation is enabled only after the assisted version proves the workflow is repeatable.

## 19. Success metrics

- Primary metric: reduction in no-show and unfilled-cancellation rates against the client's measured baseline.
- Baseline: no-show rate and cancellation-refill rate measured for the client before launch, using a defined attribution method agreed with the owner.
- Secondary metrics:
  - Share of appointments confirmed before the day of service.
  - Share of cancellations where the slot was refilled or the customer rebooked.
  - Staff time saved on reminder and rescheduling administration (owner-estimated at pilot stage).
  - Reminder delivery rate and reply rate.
  - Escalation rate and misclassification rate (quality guard).
  - Support time and failure rate per client (viability guard).
- A pilot is successful only if the primary metric moves against baseline, support load is sustainable, and the client agrees the result justifies a monthly fee.

## 20. Commercial assumptions

All figures are internal hypotheses, not approved. They are not public prices and must not be published or quoted to customers.

- Brief's internal range for Schedule Protection (Canadian dollars, marked internal hypothesis, not approved):
  - Setup: $500 to $1,500
  - Monthly: $199 to $599 plus messaging usage
- Structure assumptions: one-time setup fee, monthly management fee, included message volume, transparent overage, optional custom integration fee, additional location fee where relevant.
- No performance-based component for this service at launch; attribution of "recovered" slots is not yet reliable enough.
- Cost model to maintain before any approval: software cost, AI usage, Twilio messaging usage, founder onboarding time, ongoing support, failure recovery, reporting time, refund risk, payment-processing fees, target gross margin, and estimated client value per recovered slot.
- Packaging: sold as a modular add-on within Nevamis Convert; a client can buy it alone and is never forced to buy the whole stack.
- Pricing goes public only after owner approval and after pilot data supports the value claim.

## 21. Support requirements

- Founder-led support at pilot stage: Nevamis monitors logs daily during each client's first two weeks, then at an agreed cadence.
- A named escalation path for the client: how staff report a wrong message, a missed reminder, or an upset customer, and the expected response time (planning default: same business day).
- Runbook covering the failure states in section 11, including how to trigger the kill switch, resend a failed message, and reconcile a calendar conflict.
- Weekly summary to the owner during pilot: messages sent, outcomes, escalations, and any incidents.
- Template-change process: owner requests wording changes, Nevamis applies and tests them in staging before live use.
- Incident practice: any wrongly sent message is acknowledged to the client honestly, corrected, and recorded in the risk register; no quiet fixes.
- Support time per client is tracked, because it is a direct input to whether the service is commercially viable.

## 22. Launch checklist

Before this service may be sold or displayed as available:

- [ ] Problem confirmed through discovery conversations with several relevant businesses (what causes their no-shows, current workaround, cost).
- [ ] One narrow workflow defined and a manual or assisted version tested first.
- [ ] Owner has approved all message templates, timing rules, quiet hours, and message caps.
- [ ] CASL-aligned consent, sender identification, and working opt-out verified end to end; legal review obtained for customer-facing terms.
- [ ] Cal.com, Twilio, and email integrations tested against the full test-case list in section 17, including failure and duplicate cases.
- [ ] Escalation paths, kill switch, and runbook in place and rehearsed.
- [ ] Data storage, retention, and deletion behavior implemented as documented in sections 13 to 15.
- [ ] Pilot completed with qualified clients; primary metric improved against baseline; support load measured and sustainable.
- [ ] Pricing approved by the owner; no unapproved figures anywhere on the public site.
- [ ] Public page copy approved; integration claims verified; purchase or interest path works; support process exists.
- [ ] Service status changed to approved in the content source of truth only after every item above is complete.
