# Nevamis Internal Product Roadmap

INTERNAL DOCUMENT. Not for publication.

All prices in this document are internal hypotheses in Canadian dollars. None are approved. None may be published, quoted to a prospect, or placed in a contract without explicit owner approval. Performance-based pricing additionally requires professional legal and accounting review before any client agreement.

This roadmap is operational, not aspirational. It covers the 13 planned services beyond the live AI Front Desk. Detailed per-service specifications live in the service blueprints referenced below.

Source of truth for business rules: PLAYBOOK.md. Related documents: `docs/integration-roadmap.md`, `docs/client-discovery-plan.md`, `docs/future-services-risk-register.md`, `docs/service-blueprints/`.

---

## 1. Service Portfolio Table

Status values are the controlled vocabulary from the brief (available, private_pilot, planned, researching, paused). Nothing below is `available`. Only the owner may change a status to `available`.

Founder time is the estimated hands-on founder time to onboard one client for that service, assuming the listed dependencies already exist. Pricing ranges are setup / monthly and are INTERNAL HYPOTHESES ONLY.

| Pri | Internal name | Public name | Pillar | Status | One-line reason for priority | Key dependencies | Difficulty | Founder time (per client) | Pricing hypothesis (INTERNAL, unapproved, CAD) | Blueprint |
|-----|---------------|-------------|--------|--------|------------------------------|------------------|------------|---------------------------|------------------------------------------------|-----------|
| 1 | Instant Lead Follow-Up | Instant Lead Follow-Up | Convert | planned | Directly extends the current call workflow with data Nevamis already captures, and speed-to-lead is the fastest visible win | SMS/email provider, CASL consent capture, approved templates, CRM or simple database, opt-out handling | Low | 4 to 8 hours | Setup $500 to $1,500 / Monthly $199 to $599 plus messaging usage | `docs/service-blueprints/instant-lead-follow-up.md` |
| 2 | CRM and Lead Pipeline Automation | Automatic Lead Tracking | Operate | planned | Call summaries already exist; turning them into clean CRM records unlocks every downstream service and attribution | One CRM integration (per client), call summaries, dedup rules, lead-source capture | Medium | 6 to 12 hours | Setup $750 to $2,500 / Monthly $299 to $999 | `docs/service-blueprints/automatic-lead-tracking.md` |
| 3 | Quote and Estimate Follow-Up | Quote Recovery | Convert | planned | Open quotes are the closest money to the door and results can be measured against accepted quotes | Quote-status data source (job software or CRM), approved reminder templates, written attribution method, human approval for pricing | Medium | 6 to 12 hours | Setup $750 to $2,000 / Monthly $299 to $999; optional performance component only with reliable attribution (INTERNAL) | `docs/service-blueprints/quote-recovery.md` |
| 4 | Appointment Reminders and Schedule Recovery | Schedule Protection | Convert | planned | Booking is already in the call flow; reminders and no-show recovery are standard, low-risk, and measurable | Calendar integration (one per client), messaging provider, rescheduling rules, waitlist rules | Low | 4 to 8 hours | Setup $500 to $1,500 / Monthly $199 to $599 plus messaging usage | `docs/service-blueprints/schedule-protection.md` |
| 5 | Daily Owner Brief | Your Daily Business Brief | Operate | planned | Mostly read-only aggregation of data services 1 to 4 already produce; highly demoable and owner-facing | Data feeds from calls, follow-ups, bookings, and quotes; reporting pipeline; fact vs recommendation separation | Medium | 4 to 8 hours | Setup $500 to $1,500 / Monthly $149 to $499 | `docs/service-blueprints/daily-business-brief.md` |
| 6 | Review and Referral Automation | Review and Referral Engine | Grow | planned | Universal demand and clear reputation value, but needs job-completion events from client systems | Job-completion trigger from CRM or job software, review platform links, private complaint routing, incentive-policy guardrails | Medium | 5 to 10 hours | Setup $500 to $1,500 / Monthly $199 to $499 plus messaging usage | `docs/service-blueprints/review-referral-engine.md` |
| 7 | Past-Customer Reactivation | Customer Reactivation | Convert | planned | Direct collected revenue from existing lists, but the highest consent risk of the Convert services, so it follows the safer ones | Eligible customer list with documented consent basis, suppression list enforcement, approved segments and templates | Medium | 6 to 12 hours | Setup $750 to $2,500 / Monthly $299 to $999 plus messaging usage | `docs/service-blueprints/customer-reactivation.md` |
| 8 | Website and Text Concierge | Web and Messaging Concierge | Capture | researching | Reuses the conversation engine on new channels, but needs a curated knowledge base and a new website surface | Approved per-client knowledge base, website chat widget, SMS channel, cross-channel context store, human handoff | High | 8 to 16 hours | Setup $1,000 to $3,500 / Monthly $399 to $1,499 plus usage | `docs/service-blueprints/web-messaging-concierge.md` |
| 9 | Unified AI Inbox | AI Inbox Assistant | Operate | researching | Real labour savings, but email is a new domain with sensitive content, so it starts draft-only in Wave 3 | Mailbox access (OAuth), classification rules, draft-only workflow, approval gates for pricing, complaints, refunds, legal, employment | High | 8 to 16 hours | Setup $1,000 to $3,500 / Monthly $399 to $1,500 | `docs/service-blueprints/ai-inbox-assistant.md` |
| 10 | Job Intake and Dispatch Support | Smarter Job Intake | Capture | researching | High operational value for dispatch-heavy trades, but deep integration and safety-critical routing raise failure risk | Job-management integration (Jobber, Housecall Pro, ServiceTitan class), explicit business rules, emergency escalation, human override | High | 12 to 24 hours | Setup $1,500 to $5,000 / Monthly $750 to $2,500 plus usage | `docs/service-blueprints/smarter-job-intake.md` |
| 11 | Internal Knowledge and SOP Assistant | Business Knowledge Assistant | Operate | researching | Valuable but soft-ROI; depends on clients having usable documents and needs strict permissions and citations | Document ingestion, role-based access, source citations, versioning, cross-client isolation | High | 12 to 24 hours | Setup $1,500 to $7,500 / Monthly $500 to $2,500 | `docs/service-blueprints/business-knowledge-assistant.md` |
| 12 | Revenue Attribution and Growth Reporting | Revenue Clarity | Grow | researching | The precondition for performance pricing; requires reconciling CRM, jobs, and collected payments, which is the hardest data problem here | CRM plus job plus payment reconciliation, written attribution rules, dispute process, months of operating data | High | 16 to 30 hours | Setup $1,500 to $5,000 / Monthly $500 to $2,000 | `docs/service-blueprints/revenue-clarity.md` |
| 13 | Website Conversion and Growth System | AI Growth System | Grow | researching | Explicitly a Future-stage bundle; it composes many other services and adds advertising cost and compliance risk | Mature services 1, 3, 6, 7, and 12; landing-page infrastructure; approved budgets and claims; reliable attribution | High | 30 hours plus, ongoing | Setup $2,500 to $10,000 / Monthly $1,500 to $5,000 plus advertising and usage | `docs/service-blueprints/ai-growth-system.md` |

Notes on the table:

- Pillar assignments follow the public four-pillar grouping: Capture (AI Front Desk, Web and Messaging Concierge, Smarter Job Intake), Convert (Instant Lead Follow-Up, Quote Recovery, Schedule Protection, Customer Reactivation), Operate (Automatic Lead Tracking, Daily Business Brief, AI Inbox Assistant, Business Knowledge Assistant), Grow (Review and Referral Engine, Revenue Clarity, AI Growth System).
- Status logic: Wave 1 and Wave 2 services (priorities 1 to 7) are `planned` because they extend proven workflows. Wave 3 and Wave 4 services (priorities 8 to 13) are `researching` because they need discovery interviews, deeper integrations, or operating history before commitment.
- The AI Front Desk itself is `available` and is not in this table; it is the Wave 0 stabilization target.

---

## 2. Prioritization Scoring

### Rubric (from the brief, 100 points)

| Criterion | Max points |
|-----------|------------|
| Adjacency to the current receptionist product | 20 |
| Measurable revenue or cost impact | 20 |
| Reusability across service businesses | 15 |
| Ease of implementation | 10 |
| Availability of required data | 10 |
| Low compliance and operational risk | 10 |
| Recurring revenue potential | 10 |
| Ability to demonstrate quickly | 5 |

The brief instructs: do not manipulate the score to justify a preferred idea, and change the recommended order only if repository evidence, actual client interviews, or verified technical constraints justify it. The scores below were assigned honestly per the assumptions documented after the table. The resulting order matches the recommended ranking; no interview or technical evidence currently exists that would justify reordering.

### Scored table

| Pri | Service (internal name) | Adjacency /20 | Revenue impact /20 | Reusability /15 | Ease /10 | Data avail. /10 | Low risk /10 | Recurring /10 | Quick demo /5 | Total /100 |
|-----|-------------------------|---------------|--------------------|------------------|----------|-----------------|--------------|----------------|----------------|------------|
| 1 | Instant Lead Follow-Up | 19 | 17 | 14 | 8 | 9 | 7 | 8 | 5 | 87 |
| 2 | CRM and Lead Pipeline Automation | 17 | 14 | 13 | 7 | 8 | 9 | 8 | 4 | 80 |
| 3 | Quote and Estimate Follow-Up | 15 | 18 | 12 | 7 | 6 | 7 | 8 | 4 | 77 |
| 4 | Appointment Reminders and Schedule Recovery | 16 | 14 | 12 | 8 | 8 | 6 | 7 | 5 | 76 |
| 5 | Daily Owner Brief | 15 | 11 | 13 | 8 | 7 | 9 | 6 | 5 | 74 |
| 6 | Review and Referral Automation | 12 | 13 | 13 | 7 | 6 | 6 | 7 | 4 | 68 |
| 7 | Past-Customer Reactivation | 10 | 16 | 12 | 7 | 5 | 4 | 8 | 4 | 66 |
| 8 | Website and Text Concierge | 13 | 11 | 12 | 4 | 7 | 6 | 8 | 4 | 65 |
| 9 | Unified AI Inbox | 8 | 11 | 12 | 5 | 6 | 5 | 8 | 3 | 58 |
| 10 | Job Intake and Dispatch Support | 11 | 12 | 9 | 3 | 5 | 4 | 8 | 2 | 54 |
| 11 | Internal Knowledge and SOP Assistant | 6 | 9 | 11 | 4 | 4 | 6 | 8 | 3 | 51 |
| 12 | Revenue Attribution and Growth Reporting | 9 | 13 | 10 | 2 | 3 | 5 | 7 | 1 | 50 |
| 13 | Website Conversion and Growth System | 5 | 14 | 8 | 1 | 3 | 3 | 8 | 1 | 43 |

### Documented scoring assumptions

- Adjacency: scored highest where the service consumes data the Front Desk already produces (caller identity, intent, summaries, bookings). Instant Lead Follow-Up and Automatic Lead Tracking score high for this reason. Email (9), internal knowledge (11), and advertising (13) are new domains and score low.
- Revenue impact: scored highest where collected dollars can be tied to the service with a written method. Quote Recovery (18) and Customer Reactivation (16) touch near-term money. Daily Owner Brief and Business Knowledge Assistant save time rather than produce attributable revenue, so they score lower despite being valuable.
- Reusability: every service business gets leads and appointments, so Convert services score 12 to 14. Dispatch support (9) applies mainly to field-service trades. The Growth System (8) requires per-client customization.
- Ease: scored assuming one CRM, one calendar, approved templates, and no autonomous negotiation, per the Wave 1 MVP limits. Anything needing reconciliation across payment systems (12) or a bundle of other services (13) scores 1 to 2.
- Data availability: scored on what Nevamis can access today. Call and form data exists now. Quote status, job completion, customer lists, mailboxes, documents, and payment records all require client systems that vary in quality; consent documentation for reactivation lists is assumed to be poor until proven otherwise.
- Low risk: CASL exposure lowers every outbound-messaging score; Customer Reactivation (4) is the riskiest Convert service because it messages people with no recent inquiry. Safety-critical routing lowers Job Intake (4). Advertising claims and performance fees lower the Growth System (3). Read-only internal services (Automatic Lead Tracking, Daily Owner Brief) score 9.
- Recurring revenue: nearly all services are monthly subscriptions, so scores cluster at 7 or 8; the Daily Owner Brief scores 6 because its hypothesized price band is the lowest.
- Quick demo: scored on whether a convincing demonstration fits in one sales call. Follow-up texts and a sample owner brief demo in minutes; attribution (12) and growth programs (13) need months of data and score 1.
- These scores are pre-validation estimates. They must be revisited after the client-discovery interviews defined in `docs/client-discovery-plan.md`. Interview evidence outranks these estimates.

---

## 3. Build Waves

### Wave 0: Stabilize the Core

Goal: make the AI Front Desk reliable, measurable, supportable, and profitable.

Requirements before expanding:

- Defined onboarding process
- Test-call checklist
- Safe fallbacks
- Call summary
- Booking verification
- Usage measurement
- Client approval
- Incident process
- Monthly reporting
- Repeatable industry templates
- Clear pricing

Rule: do not expand aggressively until the core can be delivered consistently.

### Wave 1: Capture and Follow-Up

Build: missed-call text back, instant form response, basic approved SMS and email follow-up, CRM record creation, appointment confirmation, daily owner brief. (Services 1, 2, 4 confirmation portion, 5.)

Why first:

- Directly extends the current call workflow
- Uses information Nevamis already captures
- Produces fast, visible value
- Can be sold as add-ons
- Reduces lost opportunities

MVP limitations:

- One CRM or simple database
- One calendar
- Approved templates
- Limited follow-up sequence
- Human escalation
- No autonomous negotiation
- Clear opt-out handling

### Wave 2: Conversion and Retention

Build: Quote Recovery, no-show recovery, review requests, referral requests, customer reactivation, pipeline reporting. (Services 3, 4 recovery portion, 6, 7, plus pipeline reporting on top of 2.)

Why second:

- Adds revenue after initial lead capture
- Can be measured against accepted quotes, completed jobs, and bookings
- Expands lifetime value

MVP limitations:

- Approved customer segments
- Approved message templates
- One job-management or CRM integration at a time
- Human approval for pricing and complaints
- No unsupported attribution claims

### Wave 3: Operations

Build: Unified AI Inbox, Job Intake, Dispatch Support, Business Knowledge Assistant, expanded owner reporting. (Services 9, 10, 11; the Web and Messaging Concierge, service 8, is a Wave 3 candidate since it shares the conversation engine, but it is not explicitly assigned to a wave in the brief and should be scheduled on discovery evidence.)

Why third:

- Saves internal labour
- Increases client dependence on Nevamis
- Requires stronger access controls and deeper integration
- Has higher support and failure risk

MVP limitations:

- Draft-only email replies
- Narrow inbox categories
- Rule-based dispatch support
- Source-cited knowledge answers
- Human override
- Complete activity logs

### Wave 4: Growth and Performance

Build: revenue attribution, landing pages, website conversion work, campaign follow-up, lead-source reporting, growth experiments, performance-based commercial models. (Services 12 and 13.)

Why last:

- Performance pricing requires reliable attribution
- Advertising and lead generation introduce higher cost and compliance risk
- Nevamis needs operating history before making broader growth promises

Do not sell performance pricing until all of the following are true:

- Lead sources can be identified
- Appointments can be linked
- Completed work can be reconciled
- Collected revenue can be verified
- Refunds and cancellations can be accounted for
- Attribution rules are written
- Disputes can be resolved from records

---

## 4. Internal Packages

Internal packaging only. Do not publish package prices without owner approval. Allow modular adoption; do not force a small business to purchase the entire future stack.

### Package 1: Nevamis Front Desk (current flagship)

- AI receptionist
- Qualification
- Booking
- Transfer or escalation
- Call summary
- Coverage configuration

### Package 2: Nevamis Convert (add-ons)

- Instant Lead Follow-Up
- Automatic Lead Tracking
- Quote Recovery
- Schedule Protection
- Customer Reactivation

### Package 3: Nevamis Operate (add-ons)

- Daily Business Brief
- AI Inbox Assistant
- Smarter Job Intake
- Business Knowledge Assistant

### Package 4: Nevamis Grow (add-ons)

- Review and Referral Engine
- Revenue Clarity
- Website Conversion
- Campaign and reactivation systems

Possible add-on fee structure (hypothesis, unapproved): one-time setup fee, monthly management fee, included usage, transparent overage, custom integration fee, additional location fee, and an optional performance component only when attribution is reliable.

Pricing method rule: do not price solely by adding a markup to software. Price the implemented outcome, risk, customization, support, and ongoing management. For each service, model software cost, AI usage, telephony or messaging usage, founder onboarding time, ongoing support, failure recovery, reporting time, refund risk, payment-processing fees, gross margin, and client value.

---

## 5. Performance-Based Pricing Rules

Status: hypothesis only. No performance-priced agreement may be offered or signed without professional legal and accounting review and owner approval. Do not advertise any profit-share figure publicly, including on the Coming Soon page.

### Starting hypothesis (internal, unapproved)

- Base monthly retainer appropriate to scope
- Plus 7.5 percent of collected, attributable net-new revenue (test range 5 to 10 percent)
- Limited attribution window, defined in writing before the agreement starts
- Optional monthly cap on the performance component during the first test

### Preconditions (all required before selling any performance component)

The Wave 4 attribution checklist above must be fully satisfied: identifiable lead sources, linked appointments, reconciled completed work, verified collected revenue, accounting for refunds and cancellations, written attribution rules, and a dispute process resolvable from records. Revenue Clarity (service 12) is the delivery mechanism for these preconditions.

### Higher share of verified incremental gross profit

May be considered only when all of the following hold:

- Nevamis charges a low or waived retainer
- Nevamis controls most of the acquisition and follow-up journey
- Direct job costs are documented
- Attribution is reliable
- Refunds and chargebacks are reconciled
- The agreement receives professional legal and accounting review

### Never take a share of

- Unrelated company revenue
- Existing pipeline
- Taxes
- Refunds
- Chargebacks
- Pass-through expenses
- Revenue outside the agreed attribution window

Only collected revenue counts. Quoted, invoiced, or promised revenue never counts toward a performance fee.

---

## Document control

- Owner approval required for: any price, any package publication, any status change to `available`, any performance-pricing offer.
- Review trigger: completion of client-discovery interviews (`docs/client-discovery-plan.md`), or any verified technical constraint that changes a score in Section 2.
- Related risk tracking: `docs/future-services-risk-register.md`.
