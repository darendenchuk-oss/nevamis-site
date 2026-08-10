# LEGAL REVIEW PACKAGE

For the qualified Alberta lawyer who reviews Nevamis's public terms,
privacy policy, and client service agreement (engine OWNER_ACTIONS A5).
Prepared 2026-07-27 by a drafting pass on the owner's instruction; nothing
here has had professional review yet. Documents in scope: terms.html
(version 2.0), privacy.html, docs/SERVICE-AGREEMENT-DRAFT-2026-07-27.md.

## What changed in the 2026-07-27 drafting pass, and why

1. Third-party services and availability (terms + agreement 7): names the
   provider stack, disclaims 100% uptime, sets "commercially reasonable
   efforts" and excludes provider outages from breach. Rationale: the
   product is a thin orchestration over carriers and AI providers; an
   uptime promise Nevamis cannot control would be reckless.
2. Acceptable use and suspension (terms + agreement 9): generalized from
   the demo-line rules; suspension is qualified by reasonable belief and
   notice-with-reasons.
3. Client responsibilities (terms + agreement 6): allocates caller notices,
   recording disclosure, and consent for the client's own line to the
   client, with Nevamis providing wording guidance. Rationale: PIPA/PIPEDA
   and recording-consent obligations attach to the business operating the
   line; Nevamis cannot discharge them for the client.
4. Limitation of liability (terms + agreement 8): mutual exclusion of
   indirect/consequential losses; cap = fees paid in prior 3 months,
   measured over any 12-month claim window; express carve-out for
   non-limitable liability including Alberta consumer-protection law.
5. Cancellation mechanics (terms + agreement 3): month to month, email
   cancellation, paid-through service, no fees, data return/deletion.
6. Governing law and venue (terms + agreement 11): Alberta law, Edmonton
   courts, good-faith resolution first, consumer-tribunal rights preserved.
7. Changes-with-notice (terms): version/date at top, 30 days email notice
   to active clients for material changes.
8. Severability and hierarchy (terms + agreement 12): signed agreement
   beats website terms.
9. Pilot terms consolidated (agreement Part A): free, no card, caps
   (60 min/30 calls), one revision, clock starts at go-live, downtime adds
   time back, day-eight decision, deletion on request.

## Open questions for counsel

1. Indemnity: the draft has NO client indemnity clause. Should there be a
   narrow one (client instructions/content causing third-party claims), and
   how should it be bounded for owner-operated small businesses?
2. Consumer protection: do Alberta's consumer-protection rules apply to any
   of our buyers (sole proprietors using personal numbers), and if so does
   the liability cap or cancellation section need adjustment?
3. Recording consent: is the allocation in item 3 sufficient, or should the
   agreement mandate specific IVR wording per province (one-party consent
   federally under PIPEDA vs client obligations under provincial law)?
4. Refund edges: pilot is free so no refund surface, but is a pro-rata
   refund required in any forced-termination scenario we initiate?
5. GST/HST presentation: terms show the registration number and
   tax-added-per-law wording; confirm invoice-level requirements are met by
   Stripe's invoice fields.
6. AI disclosure: calls open with an AI + recording disclosure; confirm the
   wording meets CRTC/PIPEDA expectations and any new AI-disclosure rules.
7. E-signature: is email acceptance sufficient for the order summary, or
   should we adopt a formal e-sign flow before client #1?
8. Privacy policy: retention wording is intentionally ranged ("reducing
   retention with our voice provider to a fixed maximum"); confirm this is
   acceptable or set the fixed periods now.

## Facts counsel can rely on (verified in the engine ledger)

- Nevamis AI Inc., federal incorporation reported by the owner; GST/HST
  registered (number on terms), Edmonton AB.
- Commercial model as of 2026-08-09: one recurring price per plan, charged the
  day the client subscribes and on that day every month after. Core C$250/month,
  Growth C$500/month, Pro C$1,000/month, CAD plus GST/HST. No setup, activation,
  onboarding, implementation or launch charge. No pilot and no trial, paid or
  free. No money-back guarantee. Month to month, cancel any time from the
  portal, service runs to the end of the month paid for. Superseding history,
  so counsel is not surprised by an older document on this disk: the
  $249/$449/$849 ladder, the Pay As You Go $49/month tier, annual prepay, the
  free 7-day pilot, its $150 paid replacement, the setup fee and the
  founding-client waiver are all retired and none may be offered.
- Stripe fully activated (live charges and payouts).
- Providers: Twilio, ElevenLabs, Cal.com, Stripe, Vercel, Turso, GitHub.
