# Roadmap Owner Checklist

Owner decision dashboard for the 13 planned Nevamis services.
Last reviewed: 2026-07-23. Review after every batch of discovery calls.

How to read the blocks:

- Evidence: what proof exists that clients want this and will pay. Today the honest answer for every service is "none yet". Zero client interviews have happened, so nothing below is validated.
- Client demand: unknown until discovery interviews are done. See docs/client-discovery-plan.md.
- Dev effort, compliance risk, integration risk, support risk: L (low), M (medium), H (high). These are pre-build estimates, not measurements.
- Founder time: recurring owner time per client per month once live, plus setup burden.
- Est. monthly margin band: rough gross margin per client per month (MRR minus direct AI, telephony, and messaging costs). Unvalidated guesses until real pilots produce real numbers.
- Recommended next action is one of: Keep researching, Recruit pilot clients, Build MVP, Pause, Remove.

Decision rule applied throughout: with zero interviews completed, nothing earns "Build MVP" yet. Priorities 1 to 5 are adjacent to the live AI Front Desk and are worth testing with real prospects now. Priorities 6 to 13 stay in research until the first five produce signal.

---

## Priority 1: Instant Lead Follow-Up

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: M
- Founder time: low once configured; medium during setup (approved message templates per client)
- Est. monthly margin band: $150 to $400 per client
- Compliance risk: M (CASL consent, unsubscribe handling, stop rules for SMS and email)
- Integration risk: M (telephony, SMS provider, forms, CRM logging)
- Support risk: M (clients will blame the system for any lost lead)
- Recommended next action: Recruit pilot clients / validate in discovery calls

## Priority 2: Automatic Lead Tracking (CRM and Lead Pipeline Automation)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: M
- Founder time: medium (per-client CRM mapping and data hygiene expectations)
- Est. monthly margin band: $100 to $300 per client
- Compliance risk: L to M (customer data handling under PIPEDA; no outbound messaging)
- Integration risk: H (every client uses a different CRM, or none at all)
- Support risk: M (duplicate records and misfiled leads generate tickets)
- Recommended next action: Recruit pilot clients / validate in discovery calls

## Priority 3: Quote Recovery

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: M
- Founder time: medium (follow-up cadence approval, quote data access per client)
- Est. monthly margin band: $150 to $400 per client
- Compliance risk: M (CASL for reminders; hard guardrail that the system never invents prices, discounts, or terms)
- Integration risk: M to H (quoting tools vary widely; some quotes live in PDFs and email)
- Support risk: M
- Recommended next action: Recruit pilot clients / validate in discovery calls

## Priority 4: Schedule Protection (Appointment Reminders and Schedule Recovery)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: M
- Founder time: low to medium (calendar rules per client)
- Est. monthly margin band: $100 to $250 per client
- Compliance risk: L to M (transactional reminders are lower CASL risk than marketing)
- Integration risk: M (calendar and booking systems; two-way sync is the hard part)
- Support risk: M (a wrong reminder or double booking is highly visible)
- Recommended next action: Recruit pilot clients / validate in discovery calls

## Priority 5: Your Daily Business Brief

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: L to M (summarization is easy; trustworthy data collection is the work)
- Founder time: low
- Est. monthly margin band: $50 to $150 per client (likely an add-on, not standalone)
- Compliance risk: L (internal reporting; must separate facts from recommendations)
- Integration risk: M (only as good as the data sources connected)
- Support risk: L
- Recommended next action: Recruit pilot clients / validate in discovery calls

## Priority 6: Review and Referral Engine

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: M
- Founder time: medium (response policy approval per client)
- Est. monthly margin band: $100 to $250 per client
- Compliance risk: M (review platform policies, no fake reviews, no prohibited incentives, no suppression of legitimate negatives)
- Integration risk: M (job-completion trigger requires job data access)
- Support risk: M
- Recommended next action: Keep researching

## Priority 7: Customer Reactivation (Past-Customer Reactivation)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: M
- Founder time: medium (list eligibility review and campaign approval every time)
- Est. monthly margin band: $150 to $400 per client, possibly performance based later
- Compliance risk: H (CASL express and implied consent, legal basis per contact, suppression lists; the highest regulatory exposure on this roadmap)
- Integration risk: M (customer list quality varies badly)
- Support risk: M
- Recommended next action: Keep researching

## Priority 8: Web and Messaging Concierge

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: H (multi-channel, shared context with the voice agent)
- Founder time: medium (knowledge base upkeep per client)
- Est. monthly margin band: $100 to $300 per client
- Compliance risk: M (accuracy of answers, consent for SMS threads)
- Integration risk: M (website embed, SMS, CRM sync)
- Support risk: H (real-time chat sets high response expectations)
- Recommended next action: Keep researching

## Priority 9: AI Inbox Assistant (Unified AI Inbox)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: H
- Founder time: medium
- Est. monthly margin band: $100 to $300 per client
- Compliance risk: M to H (privileged and sensitive email content; draft-only replies; approval required for pricing, complaints, refunds, legal, and employment topics)
- Integration risk: M (Gmail and Microsoft 365 APIs are stable but permission scopes are sensitive)
- Support risk: H (a misclassified urgent email is a serious failure)
- Recommended next action: Keep researching

## Priority 10: Smarter Job Intake (Job Intake and Dispatch Support)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: H
- Founder time: high (explicit business rules must be built with each client)
- Est. monthly margin band: $200 to $500 per client
- Compliance risk: M (no unsafe trade or emergency decisions by AI; human override and logging required)
- Integration risk: H (field service platforms like ServiceTitan and Jobber, or no system at all)
- Support risk: H (wrong dispatch priority has real-world consequences)
- Recommended next action: Keep researching

## Priority 11: Business Knowledge Assistant (Internal Knowledge and SOP Assistant)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: M to H (retrieval with citations, permissions, versioning)
- Founder time: medium (document onboarding per client)
- Est. monthly margin band: $100 to $250 per client
- Compliance risk: M (strict client data isolation; never present unsupported answers as certain)
- Integration risk: M (document sources are messy but low-stakes to connect)
- Support risk: M
- Recommended next action: Keep researching

## Priority 12: Revenue Clarity (Revenue Attribution and Growth Reporting)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: H
- Founder time: high (attribution definitions and dispute process per client)
- Est. monthly margin band: $200 to $500 per client
- Compliance risk: M (financial reporting accuracy; collected revenue only; defined attribution windows; dispute process required)
- Integration risk: H (payments, accounting, CRM, and telephony all have to reconcile)
- Support risk: H (owners will challenge numbers, especially if fees ever depend on them)
- Recommended next action: Keep researching

## Priority 13: AI Growth System (Website Conversion and Growth System)

- Evidence: none yet (pre-discovery)
- Client demand: unknown until interviews
- Dev effort: H (it is a bundle of most other services plus web and campaign work)
- Founder time: high
- Est. monthly margin band: $500 to $1,500 per client, but meaningless until the component services exist
- Compliance risk: H (no guaranteed lead volume, no fabricated case studies, no performance pricing until attribution is reliable)
- Integration risk: H
- Support risk: H
- Recommended next action: Keep researching (stays in the Future stage by design; do not pilot before Priorities 1 to 5 and 12 are proven)

---

## How the owner updates priorities without rewriting the website

The website never hardcodes service status. The Coming Soon page and the homepage teaser render from a single source of truth: roadmap-config.js at the repo root (window.NV_ROADMAP). To change what the public sees:

1. Edit this file first. Update the decision block for the service (evidence, demand, risks, recommended next action) and bump the "Last reviewed" date at the top. This keeps the reasoning on record.
2. Then edit roadmap-config.js and change only the flags:
   - status: available, private_pilot, planned, researching, or paused. Only the owner flips anything to available, and only after the launch gates in the roadmap prompt are met (approved copy, approved pricing, verified integrations, working purchase path, complete policies, support process).
   - stage: now, next, or future. Controls which roadmap band the card appears in.
   - highlights: the array of slugs featured as the top Next services. Reorder or swap slugs to change emphasis.
   - Card order: services render in array order within their stage, so moving an entry moves the card.
   - lastUpdated: set to the date of the change.
3. Commit and push. The site is static on GitHub Pages, so the push is the deploy. No HTML edits, no page rewrites.

To pause or remove a service: set its recommended action here, then set status to paused in roadmap-config.js (or delete its entry to remove it from the page entirely). The site will stop showing it without any other change.
