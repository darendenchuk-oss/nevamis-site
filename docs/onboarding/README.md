> SUPERSEDED 2026-07-25, AND AGAIN 2026-08-09. The guarantee-based commercial model described below is retired, and so is the Model B free-pilot model this banner used to name as current. The current model is ONE recurring price per plan, charged the day the client subscribes and every month after: Core C$250/month, Growth C$500/month, Pro C$1,000/month, with no setup, activation or onboarding charge, and no pilot or trial at any price. pricing-config.js is the source of truth. This file is kept for history; do not copy wording or numbers from it.
# Onboarding system (internal templates)

Reusable assets that keep founder hours inside the pilot/setup budget
(docs/pilot-unit-economics.md). Copy the checklist into each client record;
never store credentials or customer personal data in this repo.

## 1. Pre-discovery questionnaire (send before the call)
Business name Â· industry Â· service area Â· hours Â· inbound calls/week Â· current
call handling Â· booking calendar used Â· top 5 caller questions Â· services you
will NOT quote by phone Â· emergency definition + on-call destination Â· who
receives summaries (SMS/email) Â· who can authorize forwarding.

## 2. Discovery agenda (30â€“45 min)
1. Where calls come from and what gets missed (10)
2. Services, pricing boundaries, service area (10)
3. Booking rules + calendar walk-through (10)
4. Emergencies + transfer rules (5)
5. Pilot scope, timeline, responsibilities, next steps (10)

## 3. Configuration checklist
[ ] Greeting + tone approved Â· [ ] Business knowledge loaded Â· [ ] Qualification
questions approved Â· [ ] Service-area rule Â· [ ] Pricing boundaries (what the AI
may/may not quote) Â· [ ] Calendar connected + slot rules Â· [ ] Transfer
destinations verified by test call Â· [ ] Confirmation SMS copy approved Â·
[ ] Owner summary format + destination Â· [ ] Fallbacks: unknown question,
no slots, transfer no-answer, provider outage Â· [ ] Recording/transcript
decision documented (client's legal responsibility acknowledged)

## 4. Test-call checklist (all must pass before client review)
[ ] Normal booking Â· [ ] Caller changes details mid-call Â· [ ] Caller
interrupts Â· [ ] Background noise Â· [ ] Unknown question â†’ safe fallback Â·
[ ] Urgent request â†’ escalation path Â· [ ] Out-of-area caller Â· [ ] No
available slot Â· [ ] Silent/spam call â†’ polite end Â· [ ] Summary accuracy
vs. transcript

## 5. Client approval checklist
[ ] Client heard the agent (live test call) Â· [ ] Approved customer-facing
statements Â· [ ] Approved booking + transfer behaviour Â· [ ] Scope + usage
limits restated Â· [ ] Written approval recorded (email OK)

## 6. Go-live checklist
[ ] Forwarding configured (client's carrier; star-codes documented for them) Â·
[ ] Live test call from external number Â· [ ] Summary received by owner Â·
[ ] Activation timestamp recorded (America/Edmonton) Â· [ ] Guarantee/pilot end
date communicated Â· [ ] Monitoring reminder scheduled (day 3â€“4 check)

## 7. Change-request process
Standard tuning (FAQ fix, hours, transfer contact, wording, one field change):
logged + applied + confirmed to client. Material change (new location,
language, calendar, CRM, redesigned flow, regulated use): written scope +
quote via change order BEFORE work; test + client acceptance before deploy.
Keep a change log: what/why/requested by/approved by/tested/deployed/previous
value/rollback.

## Industry intake templates (starting points, always reviewed per client)
- **Electrician:** emergency = no power / sparking / burning smell â†’ transfer;
  panel/EV/reno quotes = book assessment; never quote panel work by phone.
- **HVAC/Plumbing:** emergency = no heat below 0Â°C / active leak / gas smell
  (gas smell â†’ advise 911/utility line per client policy) â†’ transfer; tune-ups
  and quotes â†’ book.
- **Restoration:** capture incident type, water/fire/mould, spread, insurance
  status; all active incidents = urgent path.
- **Automotive/appointments:** services menu + duration per service; book into
  service-bay calendar; parts questions â†’ message for parts desk.

