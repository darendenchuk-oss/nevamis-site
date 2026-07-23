# Prelaunch checklist — items needing Daren's confirmation

Updated for Phase 2 (2026-07-23). Everything not listed here is built, tested,
and live.

## Blocking decisions (Phase 2 checkpoint)

1. **Commercial model — pick A, B, or C** (docs/commercial-model-decision.md).
   A = paid setup + 7-day risk-free launch (recommended) · B = true free pilot
   · C = credited deposit. Until picked, the site keeps the previously
   approved offer copy, and the pilot/launch page is not built.

2. **Pricing approval** (pricing-config.js, currently `approved: false`;
   preview at nevamis.ca/pricing.html — unlinked + noindexed, draft-bannered):
   - After Hours: C$449/mo, C$500 setup, 250 min, C$1.10 overage
   - Growth: C$749/mo, C$1,000 setup, 600 min, C$0.90 overage
   - Scale: from C$1,249/mo, C$1,500 setup, 1,200 min, C$0.75 overage
   Approve, change numbers, or reject. Only after approval: flip
   `approved: true`, link Pricing in the nav, remove noindex, add the homepage
   pricing preview, and align FAQ/Terms.
   **Pricing-approval checklist:** [ ] amounts confirmed [ ] setup-fee-vs-hours
   sanity check (docs/pilot-unit-economics.md) [ ] model selected [ ] Terms
   updated [ ] Stripe products created to match [ ] old test products archived.

3. **Higgsfield media** — API still blocked by the trial
   (`only_website_usage_on_trial_is_available`, verified 2026-07-23). Either:
   (a) generate manually on higgsfield.ai now with the 1,200 website credits
   (prompts in docs/higgsfield-prompts.md), or (b) after tonight's trial
   conversion tell Claude "generate the hero media" (keyframes → your pick →
   animation). Integration is pre-wired: files dropped in assets/ auto-swap in.

## Standing items

4. **Offers on the live site** (free 7-day pilot / month-to-month / 30-day
   guarantee): carried from the approved site; superseded the moment you pick
   a commercial model in item 1.
5. **Analytics provider** (GA4 or Plausible): wiring in README; event layer inert.
6. **Legal review** of privacy/terms before serious scale; plus pilot/launch
   policy page once the model is chosen.
7. **og:image** once hero media exists (assets/og-card.jpg + tags).
8. **Founder video** (optional, real recording only): 30–60s; page is complete
   without it.
