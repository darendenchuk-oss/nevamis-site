# Commercial model decision record

> **SUPERSEDED 2026-08-09 — this record is history, not the offer.** Model B
> below (a free 7-day live pilot plus a founding-client offer) was decided
> 2026-07-23 and is retired, along with the paid C$150 pilot that briefly
> replaced it, the founding waiver, the setup fee, Pay As You Go, annual prepay,
> and the C$249 / C$449 / C$849 ladder quoted further down. The current model is
> ONE recurring price per plan: Core C$250/month, Growth C$500/month, Pro
> C$1,000/month, with 250 / 600 / 1,400 included minutes and C$1.10 / C$0.90 /
> C$0.75 overage, charged the day the client subscribes and every month after,
> nothing charged beside it, no pilot and no trial. pricing-config.js is the
> source of truth; docs/CLAIMS-LEDGER.md row CLM-18 is the approval.
>
> Several other files in this repo used to point HERE for "the current model".
> They have been repointed at pricing-config.js, which is the only file a guard
> reads.

**Status: DECIDED 2026-07-23, SUPERSEDED 2026-08-09.** Owner delegated with the direction "do what you
think is best for a new company; our biggest issue is not having reviews by
real businesses."

## Selected: Model B — true free live pilot (+ founding-client offer)

**Why B over the brief-recommended A:** Model A (paid setup first) optimizes
for protecting founder hours and filtering tire-kickers — correct once demand
and proof exist. Nevamis's stated bottleneck is **zero social proof**. The
highest-value output of the first engagements is not revenue, it is verified
proof: pilot results reports, real call logs, reviews, and case-study
permission. Model B is the proof-generating machine, with cost controlled by
strict caps and qualification. Pilot time and usage are deliberately treated
as customer-acquisition cost (see docs/pilot-unit-economics.md).

## Pilot terms (public, one consistent name: "7-day live pilot")
- Qualified Canadian businesses, after a short strategy call (the call IS the application)
- 7 consecutive days, starting at live activation, timestamps in America/Edmonton
- 1 business, 1 line, 1 call flow, 1 booking calendar, after-hours/overflow coverage
- Up to 60 connected AI minutes or 30 connected calls, whichever first; pilot pauses/falls back at the cap
- One revision during the pilot
- **No card. No automatic billing. No charge.** Silence = pilot ends; continuing requires explicit plan acceptance
- One pilot per business/owner/line/similar use within 12 months
- Nevamis may decline uses it cannot safely support; high-risk/regulated uses need separate review

## No setup fee (retired the founding offer, 2026-07-31)
- **Setup is $0 on every plan, for everyone.** Nothing is charged before the
  receptionist is answering.
- This replaced the founding-client waiver rather than sitting alongside it: a
  waiver of a fee nobody is charged is not an offer.
- We may still *request* a review and case study from a happy client (never
  required, never conditioned on being positive), but nothing is given in
  exchange and nothing is conditional on it.
- Onboarding capacity is still ~5 concurrent founder-led builds. That is a real
  constraint on how fast we sell, not a scarcity claim to put on the site.
- Offer ends when 5 spots fill; counter maintained by owner, not faked

## Overlap cleanup
The previous "30-day guarantee" is retired: under Model B the free pilot IS the
risk reversal, and stacking two overlapping promises confuses terms (brief
rule: no overlapping seven-day promises / conflicting models). Month-to-month
+ cancel-anytime stays.

## Pricing (approved same date, competitor-grounded) — FIGURES RETIRED
See pricing-config.js. Market context (2026): DIY AI receptionists US$25–199/mo
(Rosie 49, Goodcall 59–79, AIRA 25); hybrid Smith.ai US$95–292; human services
US$235+. Nevamis prices as done-for-you service above DIY, below/near human
services. The ladder approved on this date was **After Hours C$249/mo · Growth
C$449/mo · Scale from C$849/mo**, overages 1.10/0.90/0.75 per minute; every one
of those figures and both of those plan names are retired. The current ladder is
Core C$250/month · Growth C$500/month · Pro C$1,000/month, same overage rates.
The point of difference that survives all of it: most competitors in that list
charge to set up, and Nevamis has no setup fee, no activation fee and no
onboarding fee at any tier.
