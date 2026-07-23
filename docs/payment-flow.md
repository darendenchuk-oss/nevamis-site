# Payment flow — Nevamis (architecture, pre-implementation)

Status: **architecture doc.** The site is static (GitHub Pages, no server), so
billing runs on Stripe-hosted surfaces (Checkout, Payment Links, Invoices,
Customer Portal) plus founder-verified state. Nothing here is live until the
commercial model is selected (see commercial-model-decision.md) and prices are
approved (pricing-config.js `approved: true`).

> **SUPERSEDED 2026-07-23: the owner selected Model B (true free 7-day live
> pilot) — see docs/commercial-model-decision.md. The Model A flow below is
> retained as the documented alternative if pilot economics ever force a
> change. Under Model B, payment enters only at step 8 of the published pilot
> sequence: after the client explicitly chooses a plan, send the Stripe
> checkout for setup fee (waived for the first 5 founding clients) + first
> month; paid service and production onboarding start only after payment
> succeeds.**

## Documented alternative (A): paid setup + 7-day risk-free launch

Timing:
1. Strategy call → written service order (docs/service-order-template.md) → client accepts.
2. **Setup fee** paid via Stripe Invoice or one-time Payment Link. Build starts only after Stripe shows `paid` (verify in dashboard or via API; never from a success redirect).
3. Build → test → client approval.
4. **Subscription checkout** (Stripe product per plan; monthly price). Activation only after the subscription is `active`.
5. Production goes live; the 7-day guarantee window starts at the recorded activation timestamp (America/Edmonton).
6. Guarantee cancellation → refund first monthly fee via Stripe; setup fee remains earned after build began.

## Stripe objects

| Object | Purpose |
|---|---|
| Product "Nevamis After Hours" + price C$449/mo | plan subscription |
| Product "Nevamis Growth" + price C$749/mo | plan subscription |
| Product "Nevamis Scale" + price C$1249/mo (or custom) | plan subscription |
| One-time prices C$500 / C$1000 / C$1500 | setup fees |
| Metered or invoice-item overage (C$1.10/.90/.75 per min) | added to next invoice from founder-verified usage until automated metering exists |
| Customer Portal | invoices, payment method, cancel at period end |

Existing test-mode objects (from the earlier session): product `prod_Uw2OClwmoGPN0K`
with $300 setup / $397 monthly — **superseded by this plan structure; archive
them when the new prices are approved.**

## Client states
lead → qualified → scope_approved → awaiting_setup_payment → setup_paid →
onboarding → testing → awaiting_client_approval → awaiting_subscription_payment
→ active → guarantee_period → (past_due | cancel_at_period_end | cancelled) → offboarded

Tracked initially in a founder-maintained sheet/CRM; states must match Stripe
truth (invoice paid, subscription status) before advancing.

## Rules that must hold
- Card data only on Stripe-hosted pages.
- No paid onboarding before setup payment confirmed server-side (Stripe dashboard/API check counts; a browser redirect does not).
- No production call handling before the subscription is active.
- Failed renewal: Stripe Smart Retries + immediate notice; short grace; then pause AI service and route the line to the client's chosen fallback; restore on payment.
- Refunds/cancellations per published policy only; written confirmation each time.
- Test and live keys never mixed; keys live in ai-assistant/.env, never in this repo.

## Webhooks (when a backend exists later)
`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
`customer.subscription.updated/deleted` — signature-verified, idempotent by
event id, tolerant of out-of-order delivery. Until then: manual verification
in the Stripe dashboard is the required activation step (documented above).
