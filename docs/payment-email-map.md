<!-- commercial-truth: HISTORICAL_REFERENCE_ALLOWED. The payment and onboarding email map as designed on 2026-07-23 for the guarantee model of that week, with its setup invoice and guarantee refund; neither exists, and nothing here is an offer or an email a client receives. -->
> **Record of 2026-07-23. Not a description of today.** SUPERSEDED 2026-07-25 and again 2026-08-09, and every commercial model since has been superseded in turn, most recently by commercial model v7 (owner decision 2026-10-02). This map was designed for the guarantee-based model, which is retired, and so is the free-pilot model that replaced it: the setup invoice, the guarantee start and the guarantee refund below were never sent and never will be, and there is no founding-client waiver. The emails a client receives are sent by the engine, and what Nevamis sells is in pricing-config.js and the engine's src/domain/canonical.ts. This file is kept for history; do not copy wording, numbers, or Stripe product shapes from it.
# Payment + onboarding email map

Every email matches the selected commercial model (see
commercial-model-decision.md). Draft copy = short, plain, no em dashes; final
copy approved by owner. Sender: Sales@nevamis.ca (or billing@ when created).

| # | Email | Trigger | Purpose / key content |
|---|---|---|---|
| 1 | Service order for acceptance | order drafted | full commercial terms + acceptance link/reply |
| 2 | Setup invoice sent | order accepted | Stripe invoice link; "build starts on payment" |
| 3 | Setup payment confirmed | Stripe invoice paid | receipt + what happens next + info checklist |
| 4 | Onboarding begins | build started | timeline + what we need from you + discovery booking |
| 5 | Ready for your review | testing passed | how to review + approve |
| 6 | Subscription checkout ready | client approved | Stripe subscription link; activation follows payment |
| 7 | You're live + guarantee start | subscription active + activation recorded | exact activation timestamp, guarantee end date, how summaries arrive, support contact |
| 8 | Upcoming renewal | 3 days before renewal | amount + date + portal link |
| 9 | Usage 75% / 90% / 100% | usage thresholds | current minutes + chosen near-limit behaviour |
| 10 | Overage summary | period close w/ overage | minutes, rate, amount added to invoice |
| 11 | Payment failed | invoice.payment_failed | retry schedule + update-card link |
| 12 | Grace-period warning | grace ending | pause date + fallback behaviour |
| 13 | Service paused | pause applied | fallback active; how to restore |
| 14 | Cancellation scheduled | cancel requested | effective date; service to period end |
| 15 | Cancellation complete + offboarding | period end | data export window; forwarding removal; number ownership note |
| 16 | Refund issued | guarantee refund | amount + timeline |

