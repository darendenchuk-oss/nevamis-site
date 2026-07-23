# Onboarding system (internal templates)

Reusable assets that keep founder hours inside the pilot/setup budget
(docs/pilot-unit-economics.md). Copy the checklist into each client record;
never store credentials or customer personal data in this repo.

## 1. Pre-discovery questionnaire (send before the call)
Business name · industry · service area · hours · inbound calls/week · current
call handling · booking calendar used · top 5 caller questions · services you
will NOT quote by phone · emergency definition + on-call destination · who
receives summaries (SMS/email) · who can authorize forwarding.

## 2. Discovery agenda (30–45 min)
1. Where calls come from and what gets missed (10)
2. Services, pricing boundaries, service area (10)
3. Booking rules + calendar walk-through (10)
4. Emergencies + transfer rules (5)
5. Pilot scope, timeline, responsibilities, next steps (10)

## 3. Configuration checklist
[ ] Greeting + tone approved · [ ] Business knowledge loaded · [ ] Qualification
questions approved · [ ] Service-area rule · [ ] Pricing boundaries (what the AI
may/may not quote) · [ ] Calendar connected + slot rules · [ ] Transfer
destinations verified by test call · [ ] Confirmation SMS copy approved ·
[ ] Owner summary format + destination · [ ] Fallbacks: unknown question,
no slots, transfer no-answer, provider outage · [ ] Recording/transcript
decision documented (client's legal responsibility acknowledged)

## 4. Test-call checklist (all must pass before client review)
[ ] Normal booking · [ ] Caller changes details mid-call · [ ] Caller
interrupts · [ ] Background noise · [ ] Unknown question → safe fallback ·
[ ] Urgent request → escalation path · [ ] Out-of-area caller · [ ] No
available slot · [ ] Silent/spam call → polite end · [ ] Summary accuracy
vs. transcript

## 5. Client approval checklist
[ ] Client heard the agent (live test call) · [ ] Approved customer-facing
statements · [ ] Approved booking + transfer behaviour · [ ] Scope + usage
limits restated · [ ] Written approval recorded (email OK)

## 6. Go-live checklist
[ ] Forwarding configured (client's carrier; star-codes documented for them) ·
[ ] Live test call from external number · [ ] Summary received by owner ·
[ ] Activation timestamp recorded (America/Edmonton) · [ ] Guarantee/pilot end
date communicated · [ ] Monitoring reminder scheduled (day 3–4 check)

## 7. Change-request process
Standard tuning (FAQ fix, hours, transfer contact, wording, one field change):
logged + applied + confirmed to client. Material change (new location,
language, calendar, CRM, redesigned flow, regulated use): written scope +
quote via change order BEFORE work; test + client acceptance before deploy.
Keep a change log: what/why/requested by/approved by/tested/deployed/previous
value/rollback.

## Industry intake templates (starting points, always reviewed per client)
- **Electrician:** emergency = no power / sparking / burning smell → transfer;
  panel/EV/reno quotes = book assessment; never quote panel work by phone.
- **HVAC/Plumbing:** emergency = no heat below 0°C / active leak / gas smell
  (gas smell → advise 911/utility line per client policy) → transfer; tune-ups
  and quotes → book.
- **Restoration:** capture incident type, water/fire/mould, spread, insurance
  status; all active incidents = urgent path.
- **Automotive/appointments:** services menu + duration per service; book into
  service-bay calendar; parts questions → message for parts desk.
