# Service Blueprint: AI Inbox Assistant (Unified AI Inbox)

- Title: AI Inbox Assistant (Unified AI Inbox)
- Pillar: Operate
- Status: planned
- Priority: 9
- Last reviewed: 2026-07-23

Internal planning document. This service is not built and must not be described publicly as available. Nothing in this file is approved pricing or a public commitment.

## 1. Customer problem

- Important emails get buried under low-value mail.
- Shared inboxes have unclear ownership, so messages sit unanswered because everyone assumes someone else has them.
- Staff repeatedly write similar responses to the same kinds of requests.
- Attachments and customer requests require manual data entry into other systems.
- Owners feel forced to read every message themselves to make sure nothing urgent was missed.

## 2. Ideal customer profile

- Service business or trades company, typically in the Edmonton area or elsewhere in Canada, with 2 to 25 staff.
- Runs one or more shared inboxes such as info@, service@, or bookings@ that receive a meaningful daily volume of customer email.
- Already uses, or is a strong fit for, the Nevamis AI Front Desk, so calls and email can feed the same customer records.
- Owner or office manager currently spends an hour or more per day triaging email.
- Has an email platform Nevamis can integrate with (Google Workspace or Microsoft 365) and is willing to grant scoped access.
- Willing to keep a human approving replies. Not a fit for businesses that want fully autonomous email sending on day one.

## 3. Jobs to be done

- When email arrives in a shared inbox, sort and prioritize it so urgent customer messages surface immediately.
- When a message needs a response, prepare a draft reply so staff edit instead of writing from scratch.
- When a message contains a request, quote, or attachment, extract the useful information so nobody re-types it.
- When a message implies work to do, create a task and assign an owner so nothing is dropped.
- At the end of the day, summarize what arrived, what was handled, and what is still waiting, so the owner does not have to read everything.

## 4. User roles

- Business owner: receives the daily digest, sets rules and approval requirements, reviews escalations.
- Office manager or admin staff: works the triaged inbox, edits and sends drafted replies, owns assigned tasks.
- Technicians or field staff (optional, later): receive tasks extracted from email relevant to their jobs.
- Nevamis founder/operator: configures categories, templates, and rules; monitors accuracy; handles incidents; produces monthly reporting.
- The AI assistant: classifies, drafts, extracts, and summarizes. It does not send customer email on its own during the pilot.

## 5. Trigger

- Primary: a new email arrives in a connected inbox.
- Secondary: a scheduled daily digest run (typically end of business day).
- Secondary: an SLA timer expires because a supported-category message has waited past its response threshold, which raises an alert.

## 6. Inputs

- Inbound email: sender, recipients, subject, body, thread history, timestamps.
- Attachments in common formats (PDF, images, office documents) for extraction.
- Client-approved classification categories and priority definitions.
- Client-approved reply templates and tone guidance.
- Assignment rules (which category goes to which person).
- SLA thresholds per category.
- Existing CRM or job-management records, where an integration is in place, for matching senders to known customers.
- Approval rules: which topics always require human review.

## 7. Decision rules

The planned pipeline follows the brief: email arrives, sender and intent are classified, urgency is assessed, information is extracted, a reply is drafted or an approved automation is triggered, a task is assigned, and a summary is recorded.

- Classify sender: known customer, new prospect, vendor, spam or bulk, internal, unknown.
- Classify intent against a narrow approved category list (for example: booking request, quote request, job update, invoice question, complaint, general question).
- Assess urgency using explicit rules the client approved, not model judgment alone. Emergency keywords and known-customer status raise priority.
- Only categories on the approved list get drafted replies. Everything else is labeled and left for a human.
- Messages about pricing, complaints, refunds, legal matters, employment matters, or unusual requests are always routed to a human and never answered by automation, per the brief's guardrails.
- If classification confidence is low, the message is marked "needs human review" rather than guessed at.
- Assignment follows the client's written rules. If no rule matches, the message goes to a default owner.
- No reply is ever sent without a human pressing send during the pilot phase. Draft-only is the starting mode, per the brief.

## 8. Actions

- Apply labels or folders for category and priority inside the client's existing email system.
- Draft a suggested reply in the client's tone, saved as a draft, never sent automatically.
- Extract structured details (name, contact, address, requested service, dates, amounts) from message bodies and attachments.
- Create a task with an owner and due date in the agreed task system or a simple shared list.
- Update the CRM record for a matched customer, where an integration is approved and in place.
- Record a short per-message summary.
- Send an SLA alert to the assigned owner when a supported-category message has waited too long.
- Compile and deliver the daily inbox digest to the owner.

## 9. Outputs

- A triaged inbox: every message labeled with category, priority, and owner.
- Draft replies waiting in the drafts folder for human review.
- Extracted data records attached to the right customer or job.
- Tasks with owners and due dates.
- A daily digest: volume received, urgent items, items answered, items still open, tasks created, anything needing the owner's decision.
- SLA alerts for overdue messages.
- A monthly report covering response times, category volumes, and accuracy corrections.

## 10. Human approval points

- Every outbound reply: a person reviews and sends each draft. The assistant has no send permission during the pilot.
- Always-human topics: pricing, complaints, refunds, legal matters, employment matters, and unusual requests are flagged for a person and receive no automated draft, or receive a draft marked "requires owner review" depending on client preference set at onboarding.
- Rule changes: new categories, new templates, and changes to assignment or SLA rules require client sign-off before going live.
- CRM writes beyond simple contact matching require the client to approve the field mapping at setup.
- Any expansion from draft-only mode toward approved auto-send for a narrow category requires explicit written client approval and a review of at least one month of accuracy data.

## 11. Failure states

- Misclassification: an urgent message labeled low priority, or a complaint labeled a general question.
- Wrong-thread drafting: a draft that answers a different question than the one asked.
- Hallucinated business information in a draft: invented prices, availability, or policies.
- Extraction errors: wrong amounts, dates, or addresses pulled from attachments.
- Duplicate tasks or duplicate CRM records.
- Integration failure: email API token expiry, rate limits, or webhook loss so new mail is not processed.
- Prompt injection: a malicious email attempts to manipulate the assistant's instructions.
- Cross-client exposure: any leakage of one client's data into another client's context. This must be impossible by design, with per-client isolation.
- Silent backlog: the pipeline stops and nobody notices.

## 12. Fallback

- If the pipeline is down or confidence is low, the inbox simply behaves as a normal inbox. The client's existing manual process is the fallback and must never be blocked by the assistant.
- Unprocessed or uncertain messages are marked "needs human review" rather than mislabeled.
- If drafting fails, triage labels still apply; if triage fails, nothing is labeled and a monitoring alert notifies Nevamis.
- A processing outage longer than an agreed threshold triggers notification to the client with a plain statement that triage is paused and manual handling should resume.
- All assistant actions (labels, drafts, tasks) are reversible. Drafts can be deleted; labels can be removed; no customer-facing message goes out on its own.

## 13. Data stored

- Message metadata: sender, subject, timestamps, category, priority, assignment, and SLA status.
- Message summaries and extracted structured fields needed for tasks and CRM updates.
- Draft replies until sent or discarded.
- Task records and digest history.
- Audit log of material assistant actions (classification, draft created, task created, CRM write, alert sent), per the brief's requirement to keep audit logs for material actions.
- Client configuration: categories, rules, templates, SLA thresholds.

## 14. Data not stored

- Full mailbox archives. The assistant processes messages in place in the client's email system and does not copy the whole mailbox into Nevamis storage.
- Email account passwords. Access uses scoped OAuth only.
- Payment card numbers, banking details, government ID numbers, or health information found in messages. These are never extracted into Nevamis systems.
- Messages outside the connected shared inboxes (personal mailboxes are out of scope unless separately and explicitly agreed).
- No client data is used to train models without an approved agreement, per the brief.

## 15. Retention

- Message summaries, extracted fields, and audit logs: retained for the length of the engagement plus 90 days, then deleted, unless the client's own legal obligations require a different agreed schedule.
- Draft replies: deleted when sent or discarded; unclaimed drafts purged after 30 days.
- Daily digests and monthly reports: retained for 12 months for trend reporting, then deleted.
- On termination: client access revoked immediately, stored summaries and extractions deleted within 30 days, with written confirmation. Records required by the approved retention policy are preserved for the required period only.
- Retention and deletion terms are written into the service agreement before launch, consistent with Canadian privacy requirements and data minimization.

## 16. Integration requirements

- Email: Google Workspace (Gmail API) or Microsoft 365 (Graph API), one platform per client to start, with scoped OAuth, read plus draft-create plus label permissions, and no blanket send permission during the pilot.
- Automation layer: n8n, Make, or direct API calls, consistent with the existing Nevamis stack.
- CRM (optional at start): one CRM or simple database per client, matching the brief's one-integration-at-a-time MVP limit. Candidates per the roadmap: HubSpot, GoHighLevel, Pipedrive, Zoho, or Jobber/Housecall Pro on the job-management side.
- Task destination: the client's existing task tool or a simple shared list maintained by Nevamis.
- Notifications: email or SMS for SLA alerts, using existing Twilio capability where SMS is wanted.
- Before claiming any integration publicly, it must be implemented and tested, per the brief.
- For each integration, document API availability, authentication model, required permissions, webhooks, rate limits, data accessed, data written, and failure behavior.

## 17. Test cases

At least the following must pass before any client-facing pilot:

1. Urgent known customer: an email from an existing customer saying a furnace has failed in winter is classified urgent, assigned per rules, and surfaced at the top of the triage view within the agreed processing time.
2. Quote request with attachment: a new prospect sends a request with a PDF containing site details. The assistant extracts name, contact, address, and requested service correctly, creates a task, and drafts a reply that asks only for the missing information.
3. Complaint routing: a message containing a refund demand and a complaint is flagged for human handling, receives no automated draft or a clearly marked owner-review draft per configuration, and appears in the escalation list and the daily digest.
4. Spam and bulk mail: a marketing newsletter is classified low priority, receives no draft and no task, and does not appear in the urgent section of the digest.
5. Prompt injection attempt: an email containing text instructing the assistant to forward the inbox contents or change its rules is processed safely. The instruction is ignored, the message is flagged for human review, and the event is logged.
6. SLA alert: a supported-category message is left untouched past the configured threshold in a test window, and the assigned owner receives exactly one alert, with no duplicate alerts on reprocessing.
7. Integration outage: the email API token is revoked mid-test. Processing stops cleanly, no messages are mislabeled, Nevamis monitoring raises an alert, and processing resumes without duplicates after reauthorization.
8. Draft-only enforcement: attempt to make the assistant send a reply directly in every supported path and confirm no path exists that sends customer email without a human action.
9. Ambiguous message: a vague one-line email that fits no approved category is labeled "needs human review" rather than forced into a category, and appears in the digest as unresolved.

## 18. Pilot limits

- One or two shared inboxes per client, one email platform.
- Narrow approved category list (roughly 5 to 8 categories), per the Wave 3 MVP limitation of narrow inbox categories.
- Draft-only replies for the entire pilot. No auto-send.
- One CRM or task integration at most, or none.
- English-language email only at the start.
- A defined usage cap (processed messages per month) and a founder-time cap for support, per the brief's pilot design requirements.
- Defined start event, end event, eligibility, client responsibilities, success criteria, safety fallback, reporting cadence, and data deletion or retention terms, all written down before the pilot starts.
- Small number of qualified pilot clients only, after a manual or assisted version has been tested first.

## 19. Success metrics

- Primary metric, per the brief: median response time for supported inbox categories, measured against the client's pre-pilot baseline.
- Classification accuracy: percentage of messages correctly categorized, measured by sampled human review, with a target agreed during the pilot.
- Draft usefulness: percentage of drafts sent with minor or no edits.
- Missed-urgent rate: urgent messages not surfaced as urgent. Target is zero; every miss is investigated.
- Owner time: self-reported reduction in daily inbox time.
- Coverage: percentage of inbound messages processed without error.
- Support burden: Nevamis support time per client per month, because Wave 3 services carry higher support and failure risk and must prove they are supportable.

## 20. Commercial assumptions

All figures below are internal hypothesis, not approved. They are not public prices and must not appear on the website or in sales materials without owner approval.

- Setup fee: $1,000 to $3,500 CAD (internal hypothesis, not approved).
- Monthly fee: $399 to $1,500 CAD (internal hypothesis, not approved).
- Structure follows the roadmap's add-on model: one-time setup, monthly management fee, included usage, transparent overage, custom integration fee where extra systems are wanted, additional location fee where relevant.
- No performance-based component for this service; its value is time saved and responsiveness, not directly attributable revenue.
- Pricing must be modeled against software cost, AI usage, founder onboarding time, ongoing support, failure recovery, reporting time, refund risk, payment-processing fees, gross margin, and client value, not a simple markup on software.
- Positioned inside the Nevamis Operate package alongside Daily Business Brief, Smarter Job Intake, and Business Knowledge Assistant, sold modularly so no client is forced to buy the whole stack.

## 21. Support requirements

- Onboarding: founder-led setup of inbox access, categories, rules, templates, and assignment logic, plus a supervised shadow period where the assistant labels and drafts while staff work normally, before anyone relies on it.
- Monitoring: automated pipeline health checks with alerts to Nevamis for processing stalls, auth failures, and error spikes.
- Accuracy review: weekly sampled review of classifications and drafts during the pilot, monthly afterward, with corrections fed back into rules and templates.
- Incident process: a defined path for misclassified urgent messages or bad drafts, including client notification when material, consistent with the incident process required for the core product.
- Reporting: monthly report to the client covering the success metrics above.
- Client-side responsibility: the client names an inbox owner who reviews drafts daily and reports problems.
- Change management: template and rule updates handled through a simple request-and-approve flow, with changes logged.

## 22. Launch checklist

Before any paid general availability:

- [ ] Problem confirmed through several relevant client conversations, including which inbox consumes the most time and which communications require owner approval.
- [ ] Manual or assisted version tested with at least one real inbox before automation.
- [ ] One narrow workflow, baseline, and primary outcome defined per client.
- [ ] All test cases in section 17 passing on a staging inbox.
- [ ] Draft-only mode verified with no auto-send path.
- [ ] Always-human topic routing (pricing, complaints, refunds, legal, employment, unusual requests) verified.
- [ ] Prompt-injection handling tested and logged.
- [ ] Per-client data isolation verified; cross-client exposure impossible by design.
- [ ] Scoped OAuth access confirmed; no password storage; least-privilege permissions documented.
- [ ] Retention and deletion schedule written into the service agreement; processor agreements in place where required.
- [ ] CASL reviewed for any outbound commercial email the drafts could constitute; sender identification and unsubscribe handling confirmed where applicable.
- [ ] Audit logging of material actions in place.
- [ ] Pilot terms documented: eligibility, responsibilities, included setup, excluded customization, start and end events, usage cap, founder-time cap, success criteria, fallback, reporting, conversion offer, data deletion or retention.
- [ ] Support runbook and incident process written.
- [ ] Pricing approved by the owner before any quote is issued.
- [ ] Website and sales copy checked: service described as planned until launched, no unbuilt integration claimed, no fabricated results.
