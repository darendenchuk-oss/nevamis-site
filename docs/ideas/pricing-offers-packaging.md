# Pricing, offers and packaging — 60 improvements

> **SUPERSEDED 2026-08-09 — the commercial model this file was written against no longer exists.**
> Ideas below were authored while Nevamis sold the C$249 / C$449 / C$849 ladder (plans named
> After Hours, Growth and Scale), a Pay As You Go tier at C$49 + C$1.95/min, annual prepay, a
> setup fee with a founding-client waiver, and a 7-day live pilot — free at first, then C$150.
> Every one of those is retired. The current model is ONE recurring price per plan, charged the
> day the client subscribes and every month after: **Core C$250/month · Growth C$500/month · Pro
> C$1,000/month**, with 250 / 600 / 1,400 included minutes and C$1.10 / C$0.90 / C$0.75 overage,
> nothing charged beside it, and no pilot or trial at any price. `pricing-config.js` is the source
> of truth; docs/CLAIMS-LEDGER.md row CLM-18 is the approval.
>
> The ideas are kept rather than deleted: most are about how a price is *presented*, and that work
> survives the change. But no figure, plan name or offer quoted below may be copied onto a surface,
> and any idea whose whole premise is a setup fee, a pilot, PAYG or annual prepay is moot.


The numbers this file was written against are gone. When it was authored, `pricing-config.js`
held After Hours C$249, Growth C$449, Scale from C$849, Pay As You Go C$49 + C$1.95/min, annual
at ten months for twelve, a free 7-day live pilot, and setup waived for the first five founding
clients; every one of those is retired (see the banner above). Nothing below changes a single
approved figure, and nothing below may be read as quoting one. What is broken is everything *around* those
numbers: `pricing.html` renders three plan cards and silently drops Pay As You Go and annual
prepay entirely — even though `home.html:1076–1088` renders both — so the page a buyer lands on
from search shows two-thirds of the commercial model. There is no first-month total anywhere,
no effective per-minute rate, no published crossover between tiers, no add-on rate card, no
pricing FAQ on the pricing page, no upgrade math in the engine's usage alerts, and the "MOST
COMMON" badge on the Growth card is a claim about client behaviour that zero clients can
support. The list runs from the pricing page's own gaps, through anchoring and comparison,
through the pilot-to-paid conversion, add-ons and upgrade triggers, guarantees, and finally
instrumentation and the bigger packaging bets. Every entry names a file. Nothing here needs a
testimonial, a client count, or a revenue figure that does not exist. Where an idea creates or
changes a public promise, `docs/CLAIMS-LEDGER.md` is the gate and a row is named. Where an idea
proposes a price point the owner has not approved, it is explicitly routed through the existing
`NV_PRICING.approved: false` draft-banner mechanism rather than shipped as fact.

---

1. **PRICING-OFFERS-PACKAGING-001 — Render Pay As You Go on the pricing page. It is missing entirely.**
   `pricing-config.js` defines a complete `payAsYouGo` object (C$49/mo + C$1.95/connected minute
   + C$250 setup, seven features, a `bestFor` and a `note`), and `home.html:1084–1088` renders it
   as `#paygLine`. `pricing.html`'s renderer (lines 277–299) loops only over `P.plans` and never
   touches `P.payAsYouGo`, so the page a buyer reaches from "ai receptionist pricing" shows three
   plans and hides the cheapest entry point. Add a fourth card below the grid — visually
   subordinate, not a fourth column — rendering `g.monthly`, `g.setup`, `g.perMinute`,
   `g.bestFor`, `g.note` and its seven features from config.
   impact 5/5 · effort 2/5 · touches: pricing.html (renderer block, lines 277–299), pricing-config.js (read only)

2. **PRICING-OFFERS-PACKAGING-002 — Render annual prepay on every plan card, with the dollar saving spelled out.**
   `P.annual` is active with `monthsCharged: 10` and each plan carries an `annual` value
   (2490 / 4490 / 8490), and `home.html:1076–1080` renders "or C$4,490/year — two months free".
   `pricing.html` never mentions annual at all. Add the same `.annual-line` treatment to each
   `.plan` card *plus* the arithmetic the homepage omits: "C$4,490/year — C$898 less than paying
   monthly (C$5,388)". Saving figures are 498 / 898 / 1,698 and should be computed at render
   time as `pl.monthly * 12 - pl.annual`, never hard-coded.
   impact 5/5 · effort 2/5 · touches: pricing.html renderer, assets/motion/site.css (`.annual-line` is already defined at line 409)

3. **PRICING-OFFERS-PACKAGING-003 — Extend the static pricing fallback and `check-consistency.js` to cover PAYG and annual.**
   `#plansFallback` in `pricing.html:150–164` is the crawler-visible, JS-failure-visible copy of
   the offer, and `scripts/check-consistency.js:49–83` mechanically validates its three plans
   against config. Both stop at the three plans, so if the PAYG card is added in JS only, a
   crawler or a failed script load sees a commercial model that does not match the one the
   business sells. Add a fourth fallback block for Pay As You Go and one line per plan for annual,
   then extend the checker with the same monthly/setup/perMinute/annual regex assertions it
   already runs on the plan rows.
   impact 4/5 · effort 2/5 · touches: pricing.html `#plansFallback`, scripts/check-consistency.js

4. **PRICING-OFFERS-PACKAGING-004 — Publish the three crossover points so nobody can be on the wrong plan.**
   The tier arithmetic is fully determined by the approved numbers and currently invisible: Pay As
   You Go stops being cheaper than After Hours at about **103 connected minutes/month**
   (49 + 1.95m = 249); After Hours with overage stops being cheaper than Growth at about **432
   minutes** (249 + 1.10 × (m − 250) = 449); Growth stops being cheaper than Scale at about
   **1,044 minutes** (449 + 0.90 × (m − 600) = 849). Add a small three-row "when to move up"
   block under the plan grid on `pricing.html`, computed from config so it can never drift. This
   is the single most trust-building thing a price page can do: it tells a buyer the moment your
   cheaper plan stops serving them, before they discover it on an invoice.
   impact 5/5 · effort 2/5 · touches: pricing.html (new block + helper function in the render IIFE)

5. **PRICING-OFFERS-PACKAGING-005 — Put the effective cost per included minute on every card.**
   Divide `monthly` by `includedMinutes` and the ladder becomes obvious: After Hours C$1.00/min,
   Growth C$0.75/min, Scale C$0.71/min. Right now the cards show minutes and overage rates but
   force the buyer to do the division, and a buyer who does not do it reads C$449 as "C$200 more"
   rather than "25% cheaper per minute". Render it inside the existing `.usage` strip in
   `pricing.html:286` as `· C$0.75 per included minute`, computed, and note in the same line that
   overage always costs more than an included minute so upgrading beats overrunning.
   impact 4/5 · effort 1/5 · touches: pricing.html renderer line 286

6. **PRICING-OFFERS-PACKAGING-006 — Replace the "MOST COMMON" badge. With zero clients it is an unsupportable claim.**
   `pricing.html:282` renders `MOST COMMON` from `pl.recommended`, and that phrase asserts
   observed client behaviour across a client base that does not exist yet. Change the rendered
   string to `WHAT WE RECOMMEND` or `BEST FIT FOR MOST TRADES` (an opinion, which is honest) and
   add a `recommendedLabel` field to `pricing-config.js` so the wording is versioned. Add the
   phrase `most common` to the `banned` array in `scripts/check-consistency.js:18` alongside
   `limited spots remaining`, and log the change as a new CLAIMS-LEDGER row.
   impact 4/5 · effort 1/5 · touches: pricing.html, pricing-config.js, scripts/check-consistency.js, docs/CLAIMS-LEDGER.md

7. **PRICING-OFFERS-PACKAGING-007 — Show the first-month total, because that is the number that actually stops the sale.**
   A trades owner comparing C$449/mo to a C$59 app is not comparing the right thing — the real
   first cheque is C$449 + C$750 setup = C$1,199 plus GST, and hiding it until the invoice is how
   you lose a client in week one. Render a `First month: C$1,199 (setup + first month) · C$449
   every month after` line on each card, computed as `pl.setup + pl.monthly`, with a founding-client
   variant showing `C$449` when the waiver applies. Being the vendor who states the big number
   first is a differentiator against every AI reseller that buries it.
   impact 5/5 · effort 2/5 · touches: pricing.html renderer, home.html `#pricePreview` renderer (line 1074)

8. **PRICING-OFFERS-PACKAGING-008 — Make the recommender output money, not just a plan name.**
   The recommender at `pricing.html:301–320` estimates minutes at 2.5/call and returns "Growth ·
   C$449/month" with a reason, then stops. Extend `recommend()` to show three lines: monthly at
   the recommended plan, the cost of the *same volume* on the next plan down including overage,
   and the first-month total. At 700 estimated minutes that reads "Growth C$539 (incl. 100
   overage minutes) · After Hours would be C$744 · Pay As You Go would be C$1,414" — three
   numbers that close the plan choice without a call.
   impact 5/5 · effort 3/5 · touches: pricing.html `recommend()` function

9. **PRICING-OFFERS-PACKAGING-009 — Publish the annual cancel-and-refund promise. It is written and never shown.**
   `pricing-config.js:31` already says "cancel an annual plan and unused full months are
   refunded", which is the entire objection to prepaying C$4,490 to a company with no public
   client list — and it renders nowhere on any page. Put `P.annual.note` verbatim under the annual
   line on `pricing.html` and in the pricing FAQ, and mirror the same sentence into `terms.html`
   §cancellation (line 110 currently covers monthly only) so the legal text and the sales text
   agree. Then add a CLAIMS-LEDGER row, because it is a refund promise.
   impact 4/5 · effort 2/5 · touches: pricing.html, terms.html, docs/CLAIMS-LEDGER.md

10. **PRICING-OFFERS-PACKAGING-010 — Give `pricing.html` its own FAQ. It currently has zero `<details>` elements.**
    All fourteen FAQ items live on `home.html:977–987`, and only two touch money. A buyer who
    lands directly on `/pricing.html` from search gets no answers to the questions that page
    provokes: what a connected AI minute is, what happens if I go over, can I change plans
    mid-month, what is the setup fee actually for, do I pay GST, what if I cancel in month two,
    is the pilot really free, is there a contract. Write eight pricing-specific `<details>` blocks
    and add `FAQPage` JSON-LD scoped to them — a pricing FAQ is one of the highest-cited surfaces
    in AI answer engines for "how much does X cost".
    impact 4/5 · effort 2/5 · touches: pricing.html (new section + schema block)

11. **PRICING-OFFERS-PACKAGING-011 — Add a cost row to the comparison table using cited public list prices.**
    `home.html:844–863` compares Voicemail / DIY AI app / Nevamis on eight capability rows and
    never mentions price, which lets a buyer assume Nevamis is the expensive option without
    evidence. `docs/commercial-model-decision.md` already records public 2026 list prices (Rosie
    US$49, Goodcall US$59–79, Smith.ai US$95–292, human answering services US$235+). Add one row
    — "Typical monthly cost" — with those ranges, each labelled *published list price, USD, checked
    <date>*, and a footnote that the figures are from vendor websites and change. Citing a
    competitor's own public price is honest; implying you beat them on features is not, so keep
    the row purely numeric.
    impact 4/5 · effort 2/5 · touches: home.html comparison table, docs/CLAIMS-LEDGER.md (new row)

12. **PRICING-OFFERS-PACKAGING-012 — Sell the Canadian-dollar price as a feature, not a formatting choice.**
    Every credible competitor prices in USD, which means an Edmonton electrician pays FX plus a
    2.5% cross-border card fee on a bill that changes size every month. Add a short block under
    the plan grid on `pricing.html`: billed in Canadian dollars, no exchange rate, no cross-border
    card fee, a GST/HST receipt their bookkeeper can actually use, and Canadian support hours in
    Mountain time. This costs nothing, is verifiably true, and converts the single most common
    "why not the American one" objection.
    impact 4/5 · effort 1/5 · touches: pricing.html, home.html pricing preview

13. **PRICING-OFFERS-PACKAGING-013 — State the input-tax-credit point plainly next to the tax note.**
    `P.taxNote` renders "plus applicable GST/HST" (`pricing.html:274`), which reads to an owner as
    "it costs 5% more". For a GST-registered business it is the opposite: the GST is recoverable
    as an input tax credit, so the real cost of Growth is C$449, not C$471.45. Add one sentence
    after the tax note — "GST/HST is recoverable as an input tax credit for GST-registered
    businesses; talk to your bookkeeper" — and keep Nevamis's own registration number
    (705729200 RT0001) on `terms.html` only, per CLM-08.
    impact 3/5 · effort 1/5 · touches: pricing.html usage block, docs/CLAIMS-LEDGER.md

14. **PRICING-OFFERS-PACKAGING-014 — Build a buyer-entered staffing comparison, not a claimed one.**
    The strongest anchor for C$449 is what answering the phone actually costs, but publishing a
    wage figure would be an invented claim. Follow the pattern already proven in the ROI
    calculator (`home.html:766–815`, where CLM-13 forced the benchmark to become a buyer input):
    three fields — hourly rate you pay, hours per week you want covered, weeks off/sick per year —
    outputting an annual cost and the hours Nevamis covers that a person cannot (evenings,
    weekends, 2am, simultaneous calls). Every number is theirs, so nothing needs a source.
    impact 4/5 · effort 3/5 · touches: pricing.html (new calculator), site.js

15. **PRICING-OFFERS-PACKAGING-015 — Attach the setup fee to the build-stack list so it stops looking arbitrary.**
    `home.html:876–892` lists exactly what a build contains — business knowledge, call flow,
    qualification questions, business rules, calendar connection, confirmations, owner summaries,
    test scenarios, ongoing tuning — under the heading "What you are actually paying for". That is
    a setup-fee justification sitting in the wrong place. Move a condensed nine-item version onto
    `pricing.html` directly beneath the setup figures, titled "What the one-time setup fee buys",
    and link the homepage section to it. A fee with a visible bill of materials gets negotiated far
    less than a fee that appears as a bare number.
    impact 4/5 · effort 2/5 · touches: pricing.html, home.html `#build-stack`

16. **PRICING-OFFERS-PACKAGING-016 — Express the price per answered call as well as per minute.**
    Nobody counts minutes; everybody counts jobs. Each plan already carries a `callRange`
    ("80 to 125 typical calls" etc.), so the derived figure is available: After Hours is roughly
    C$2–3 per answered call, Growth roughly C$1.50–2.25, Scale roughly C$1.40–2.10. Render it as
    a secondary line on each card labelled *estimate, at your call length* and repeat the 2.5
    min/call assumption already disclosed in the recommender. "Two dollars a call" is the frame
    that survives being repeated to a business partner in a truck.
    impact 4/5 · effort 2/5 · touches: pricing.html renderer, pricing-config.js (optional `perCallEstimate` derivation)

17. **PRICING-OFFERS-PACKAGING-017 — Kill the ambiguity in "from C$849" with named drivers and a worked example.**
    `startingAt: true` renders "from C$849/month" and "C$1,250+" setup with no explanation, which
    invites a buyer to imagine the worst number. Add a short "what moves Scale above C$849" list
    to the Scale card — additional locations, additional call flows beyond the base, minutes above
    1,200, non-standard integrations — plus one fully worked example quote (three locations, two
    flows, 1,800 minutes) so the ceiling feels bounded. Ambiguous premium pricing loses more deals
    than high premium pricing does.
    impact 4/5 · effort 2/5 · touches: pricing.html, pricing-config.js (`scaleDrivers` array on the Scale plan)

18. **PRICING-OFFERS-PACKAGING-018 — Add Pay As You Go's honest disqualifier so it anchors instead of leaking.**
    Pay As You Go exists as a low-commitment entry point, and `src/domain/canonical.ts` explicitly
    documents it as "deliberately priced ABOVE the cheapest plan's effective per-minute rate so
    volume buyers are steered to a plan". Make that steering visible rather than accidental: on the
    PAYG card render the crossover from idea 004 — "above about 103 connected minutes a month,
    After Hours costs less" — and a worked line, "at 250 minutes Pay As You Go is C$536.50; After
    Hours is C$249". Telling a buyer when your own cheap option is the wrong one is the most
    efficient trust purchase available on a price page.
    impact 4/5 · effort 2/5 · touches: pricing.html PAYG card

19. **PRICING-OFFERS-PACKAGING-019 — Publish the "what you never pay for" list.**
    Every line item a receptionist or a per-seat SaaS carries and Nevamis does not is an
    unclaimed anchor: no per-seat charge, no per-user licence, no long-distance or per-SMS fee on
    top of the plan, no overtime or stat-holiday premium, no training time, no recruiting, no
    coverage gap when someone is sick, no minimum term. Put it as a compact seven-item list under
    the plan grid on `pricing.html`. Everything on it is a fact about the plan structure, so none
    of it needs evidence beyond the plans themselves.
    impact 3/5 · effort 1/5 · touches: pricing.html

20. **PRICING-OFFERS-PACKAGING-020 — Surface the 30-day price-increase notice from the terms page.**
    `terms.html:100` already commits to "at least 30 days written notice before a material price
    increase" — a genuine, unusual, contractually-stated protection that appears only inside a
    legal page nobody reads. Add it to `pricing.html` as a fourth risk-reversal bullet alongside
    month-to-month and cancel-anytime, quoting the terms wording exactly so the two surfaces can
    never diverge, and note the source page. Protections buried in terms convert nobody; the same
    words on the price page convert.
    impact 3/5 · effort 1/5 · touches: pricing.html, terms.html (cross-link)

21. **PRICING-OFFERS-PACKAGING-021 — Make the day-8 pilot report end in a specific plan and a specific number.**
    `pilot.html:188` promises a results report of "calls handled, minutes used, what was booked",
    which is data, not an offer. The pilot cap is 60 minutes over 7 days, so real usage
    extrapolates directly: minutes used ÷ 7 × 30.4 gives a monthly estimate, which lands on a plan
    via the same thresholds the recommender uses. Build the report template to end with "you used
    41 minutes in seven days ≈ 178 minutes a month → After Hours, C$249, C$0 setup as a founding
    client — first payment C$249". This is the only place in the business where a price
    recommendation is backed by the buyer's own real call data, and it should never be improvised
    on a call.
    impact 5/5 · effort 3/5 · touches: new docs/pilot-results-report-template.md, pilot.html (describe the output), engine ops surface

22. **PRICING-OFFERS-PACKAGING-022 — Publish an honest reason the day-8 decision has a deadline.**
    `pilot.html` and `pricing-config.js` both correctly promise that silence never becomes a
    subscription — but with no deadline at all, "let me think about it" is free forever and pilots
    die of drift rather than rejection. The honest deadline already exists in operations: the built
    agent config, the forwarded line and the calendar connection are torn down when the pilot ends,
    so continuing later means rebuilding. Say exactly that: "your build stays live for 7 days after
    the pilot ends; after that continuing means a fresh build". Real operational consequence, zero
    manufactured urgency.
    impact 4/5 · effort 2/5 · touches: pilot.html Q&A block, pricing-config.js `pilot.dayEight`, docs/CLAIMS-LEDGER.md (CLM-06 amendment)

23. **PRICING-OFFERS-PACKAGING-023 — Add an owner-maintained `spotsRemaining` to the founding offer, with a mechanical guard.**
    `foundingClient.spots: 5` is a static number and CLM-07 explicitly forbids a live "spots
    remaining" count unless a real counter exists. Build the real counter the cheap way: a
    `spotsRemaining` integer in `pricing-config.js` that only the owner edits when a founding client
    signs, rendered as "3 of 5 founding spots left" on `pricing.html` and `pilot.html`, plus a
    `check-consistency.js` assertion that it is an integer ≤ `spots` and that the offer text never
    renders when it reaches 0. Honest scarcity beats no scarcity; fake scarcity is fatal in a trade
    community where everyone talks at the supply counter.
    impact 4/5 · effort 2/5 · touches: pricing-config.js, pricing.html, pilot.html, scripts/check-consistency.js, docs/CLAIMS-LEDGER.md CLM-07

24. **PRICING-OFFERS-PACKAGING-024 — Propose a 12-month price lock as the second half of the founding-client offer.**
    The founding offer currently trades a setup-fee waiver (C$500–1,250) for feedback and review
    permission. A 12-month price lock costs zero cash today, is trivially honourable, and answers
    the exact fear a buyer has about an early-stage vendor: "you will raise this on me once I
    depend on it". Add `foundingClient.priceLockMonths: 12` to config behind the existing
    `approved` gate, get explicit owner sign-off, then render it on `pricing.html`, `pilot.html`
    and the service order — and add a CLAIMS-LEDGER row, because it is a binding commitment.
    impact 4/5 · effort 2/5 · touches: pricing-config.js, pricing.html, pilot.html, docs/CLAIMS-LEDGER.md, docs/service-order-template.md

25. **PRICING-OFFERS-PACKAGING-025 — Give founding clients something non-monetary that a discount cannot buy.**
    Waiving setup makes the offer cheaper; it does not make it *special*, and the thing Nevamis
    actually needs is engaged clients who answer the phone when Daren calls with a question.
    Add two zero-cost items to the founding package: direct founder line for the first 90 days
    (already true in practice, per `home.html:952`), and first refusal on the Revenue Engine
    private pilot at founding-client pricing when it ships. Both cost nothing, both are honest, and
    both make the exchange feel like a partnership rather than a discount.
    impact 3/5 · effort 1/5 · touches: pricing-config.js `foundingClient.offer`, pilot.html founding-note block

26. **PRICING-OFFERS-PACKAGING-026 — Design a priced paid-pilot for the prospects the free pilot cannot take.**
    The free pilot is capacity-limited by founder-led onboarding (`commercial-model-decision.md`
    caps it at ~5 concurrent builds) and excludes high-risk or regulated uses, which means a
    qualified, willing buyer can arrive at exactly the wrong moment and get nothing but a waitlist.
    Define a paid alternative — setup fee paid up front, build starts within 72 hours, first month
    at the plan rate, refundable up to activation — as an explicit config entry and a one-paragraph
    section on `pilot.html` titled "If we are at capacity". This converts overflow demand into cash
    instead of a follow-up task.
    impact 4/5 · effort 3/5 · touches: pricing-config.js (new `paidBuild` object, `approved` gated), pilot.html, docs/commercial-model-decision.md

27. **PRICING-OFFERS-PACKAGING-027 — Turn the pilot's "not included" list into a priced add-on rate card.**
    `pilot.html:164–175` lists seven exclusions — multiple locations, CRM builds, outbound
    campaigns, payment collection, extra languages, unlimited volume, number porting — each
    labelled "quoted separately if needed", which means every one of them becomes an improvised
    number on a call. Publish rates for the four that recur (additional call flow, additional
    booking calendar, additional line/department, additional language) as a `addOns` array in
    `pricing-config.js`, rendered as a small table on `pricing.html`. Published add-on pricing
    turns an awkward mid-call negotiation into an upsell the buyer initiates.
    impact 4/5 · effort 3/5 · touches: pricing-config.js (new `addOns`, owner approval required), pricing.html, pilot.html

28. **PRICING-OFFERS-PACKAGING-028 — Make the overage behaviour an explicit choice at signup, not a policy footnote.**
    `usagePolicy.notes` says "Near the limit you choose: automatic overage, fallback answering, or
    a hard cap" — a genuinely good promise that is never actually asked. Add it as a required
    radio choice in the engine's to-do onboarding (`src/app/start`, alongside the existing
    verification flow) and store it on the subscription, so `src/domain/usage.ts` `checkUsageAlerts`
    can act on it at 100% rather than just notify. "You choose what happens at the limit, before it
    happens" is a stronger anti-bill-shock promise than any overage rate.
    impact 4/5 · effort 3/5 · touches: nevamis-engine src/app/start, src/domain/usage.ts, src/db/schema.ts, pricing.html (describe the choice)

29. **PRICING-OFFERS-PACKAGING-029 — Rewrite the service order for Model B. It still contains a retired guarantee row.**
    `docs/service-order-template.md` carries a SUPERSEDED banner but its table still reads
    "Guarantee | first 7 live days: cancel → first monthly fee refunded; setup fee earned once
    build begins" — the exact promise `commercial-model-decision.md` retired to avoid stacking two
    overlapping seven-day offers. A superseded banner does not protect you when a founder under
    time pressure copies a table. Rewrite the template against Model B: pilot terms, chosen plan,
    setup fee (or founding waiver), included minutes, overage rate and the client's chosen
    at-limit behaviour, cancellation mechanics, price-increase notice, GST line.
    impact 4/5 · effort 2/5 · touches: docs/service-order-template.md, docs/payment-flow.md (same retired framing)

30. **PRICING-OFFERS-PACKAGING-030 — Generate the written quote from the config instead of typing it.**
    The service order asks a human to transcribe monthly fee, setup fee, included usage and overage
    rate for the chosen plan — four chances to send a wrong number to the one buyer you have.
    Build a tiny quote renderer (a page in the engine's ops app, or a `scripts/quote.mjs` in the
    site repo) that takes plan + founding-waiver + add-ons and emits the filled service order as
    markdown/PDF with a pricing-version stamp from `lastUpdated`. Under ten clients this feels like
    over-engineering; the first time a typo'd overage rate reaches a signed document it stops
    feeling that way.
    impact 3/5 · effort 3/5 · touches: nevamis-engine src/app/ops (new quote route) or nevamis-site/scripts/quote.mjs

31. **PRICING-OFFERS-PACKAGING-031 — Put the upgrade math inside the engine's usage alerts.**
    `src/domain/usage.ts` fires alerts at 50/75/90/100% and `components/usage-meter.tsx` renders
    bands labelled "Getting close" and "Nearly out" — accurate, and commercially inert. At the 90%
    and 100% thresholds the client should also see the comparison: "at your current pace you will
    use ~740 minutes. On After Hours that is C$788 this month. Growth covers 600 for C$449 and
    C$0.90 after — about C$662." Compute it from `CANONICAL.pricing.plans` so it can never
    contradict the site. This is the only fully automated upgrade trigger the business has, and it
    is currently switched off.
    impact 5/5 · effort 3/5 · touches: nevamis-engine src/domain/usage.ts, src/components/usage-meter.tsx, src/domain/canonical.ts

32. **PRICING-OFFERS-PACKAGING-032 — Publish the downgrade path as loudly as the upgrade path.**
    Nothing on any surface says what happens if a client's volume drops — which, in a trades
    business with a brutal seasonal curve, is the specific fear that stops an HVAC owner buying
    Growth in June. Publish a one-line rule on `pricing.html`: change plans in either direction with
    written notice before your renewal date, effective the next period, no fee, no re-setup charge.
    The revenue protected by making Growth safe to try exceeds the revenue protected by making it
    hard to leave.
    impact 4/5 · effort 1/5 · touches: pricing.html, terms.html §cancellation, docs/CLAIMS-LEDGER.md

33. **PRICING-OFFERS-PACKAGING-033 — Design a seasonal hold for Alberta trades and price it.**
    Landscaping, restoration, HVAC and paving in Edmonton have 3–5 dead months, and a client facing
    C$449 in a month with 20 calls will cancel rather than ask. A "winter hold" — number, agent
    config, calendar connection and knowledge base kept live at a reduced monthly with a low minute
    allowance, maximum consecutive months capped, no re-setup fee on return — converts an annual
    churn event into a paused subscription. Propose the rate to the owner, add it to config behind
    `approved`, and describe it on `pricing.html` under a trades-specific heading. No competitor
    priced for a US year-round market will offer this.
    impact 4/5 · effort 3/5 · touches: pricing-config.js (new `seasonalHold`, owner approval), pricing.html, nevamis-engine subscription states

34. **PRICING-OFFERS-PACKAGING-034 — Give Scale a published per-location rate.**
    "Multi-location" appears in the Scale `bestFor` and features with no unit price, so the
    business cannot quote a franchise or a two-shop operator without a custom exercise — and
    multi-location buyers are the highest-value inbound the site can attract. Add a per-additional-
    location monthly and setup figure to config (owner-approved), render it on the Scale card, and
    include a two-location and a four-location worked example. A quotable number is what turns a
    "call us" tier into a tier that sells itself.
    impact 4/5 · effort 3/5 · touches: pricing-config.js Scale plan, pricing.html

35. **PRICING-OFFERS-PACKAGING-035 — Evaluate one-month minute rollover as a retention perk, and decide it in writing.**
    Unused minutes currently evaporate at the period boundary, which quietly punishes exactly the
    seasonal clients most at risk of churning. One-month rollover, capped at 50% of the plan
    allowance and non-cumulative, costs very little (the marginal cost of an ElevenLabs/Twilio
    minute is far below the C$0.75–1.00 the plan charges) and removes the "I paid for minutes I
    didn't use" resentment that builds silently over a slow quarter. Write the decision up in
    `docs/commercial-model-decision.md` either way — a documented "no, and here is why" is worth as
    much as a yes.
    impact 3/5 · effort 3/5 · touches: docs/commercial-model-decision.md, pricing-config.js, nevamis-engine src/domain/usage.ts

36. **PRICING-OFFERS-PACKAGING-036 — Nail down how a referral credit is actually applied before anyone promises one.**
    The referral offer is still DRAFT in the sales collateral, and the unresolved part is
    mechanical, not motivational: which fee it discounts, when it lands, and what happens if the
    referred business churns. Decide and document — credit applies to one monthly fee only, never
    setup and never overage; issued after the referred business's first successful payment; one
    credit per referred business; not stackable with the founding-client waiver — then implement it
    as a Stripe coupon restricted to the subscription price. Ambiguous credits become disputes with
    the first client you cannot afford to lose.
    impact 4/5 · effort 2/5 · touches: pricing-config.js (new `referral` object), nevamis-engine src/domain/stripe-billing.ts, docs/CLAIMS-LEDGER.md

37. **PRICING-OFFERS-PACKAGING-037 — Build the annual prepay so it can actually be accepted.**
    Annual is approved, published on the homepage and covered by CLM-05, but there is no Stripe
    object behind it: `docs/payment-flow.md` lists only monthly subscription prices and one-time
    setup prices, and its figures (C$449/C$749/C$1249, C$500/C$1000/C$1500) are stale against the
    approved table. Create the three annual prices (2490 / 4490 / 8490) as one-time invoices with a
    12-month service term rather than recurring subscriptions, encode the pro-rata refund rule from
    `annual.note`, and refresh the whole Stripe object table in the doc to the approved numbers. An
    offer a buyer cannot say yes to on the call is not an offer.
    impact 4/5 · effort 3/5 · touches: docs/payment-flow.md, Stripe catalog, nevamis-engine src/domain/stripe-billing.ts

38. **PRICING-OFFERS-PACKAGING-038 — Propose a quarterly prepay rung between monthly and annual.**
    The commitment ladder jumps from C$449 to C$4,490 with nothing between, and a first-time buyer
    at a nine-month-old company will not clear that gap. A quarterly option — three months paid up
    front at a modest discount — gives a hesitant buyer a way to show commitment and gives Nevamis
    a cash cushion that a monthly plan cannot. Draft the rate, put it in `pricing-config.js` with
    `approved: false` so the existing `#draftBanner` fires (`pricing.html:98`, wired at line 261),
    and get owner sign-off before it renders as fact.
    impact 3/5 · effort 2/5 · touches: pricing-config.js, pricing.html draft-banner path

39. **PRICING-OFFERS-PACKAGING-039 — Offer the setup fee in two payments instead of discounting it.**
    C$750 up front is the single largest number in the Growth offer and the founding waiver can only
    be used five times before the objection returns permanently. Splitting setup across two invoices
    — half on build start, half at activation — preserves the full price, costs nothing but a second
    Stripe invoice, and removes a cash-flow objection that has nothing to do with whether the buyer
    values the product. Add it as a documented sales option in the service order and the payment
    flow rather than a public price-page line, so it stays a concession you grant rather than a
    default everyone takes.
    impact 4/5 · effort 2/5 · touches: docs/payment-flow.md, docs/service-order-template.md

40. **PRICING-OFFERS-PACKAGING-040 — Work out setup-fee credit-back as the alternative to waiving it.**
    Waiving setup gives away C$500–1,250 of real onboarding labour permanently. Crediting it back —
    setup charged normally, then returned as monthly credits over the first three or six months of
    continuous service — protects the same cash if the client churns early while feeling nearly as
    good at signature. Model both against `docs/pilot-unit-economics.md` (which already has the
    payback formula and blank assumptions waiting) and write the comparison into
    `commercial-model-decision.md` so the sixth-through-twentieth clients get a considered offer
    rather than an ad-hoc extension of the founding five.
    impact 4/5 · effort 3/5 · touches: docs/pilot-unit-economics.md, docs/commercial-model-decision.md

41. **PRICING-OFFERS-PACKAGING-041 — Pre-commit early front-desk clients to protected pricing on the Revenue Engine.**
    `coming-soon.html` and `revenue-engine.html` list a dozen planned services with no commercial
    terms, so early clients have no reason to care about the roadmap and no reason to wait for you
    instead of buying a point solution. A written commitment — front-desk clients active before a
    given date get the launch price of any new service for their first 12 months, with no obligation
    to buy — makes the roadmap a retention asset today at zero present cost. It also gives the
    day-8 close a second, non-price reason to say yes.
    impact 3/5 · effort 2/5 · touches: coming-soon.html, revenue-engine.html, pricing-config.js (new `earlyClientProtection`), docs/CLAIMS-LEDGER.md

42. **PRICING-OFFERS-PACKAGING-042 — Write the discount rules down before the first negotiation, not after.**
    A solo founder with zero clients and a live prospect will improvise, and every improvised
    concession becomes a precedent the next client hears about. Write a one-page deal-desk rule
    sheet: setup may be waived only under the founding-five count; the monthly plan price is never
    discounted; annual prepay and the payment split are the two approved concessions; a case-study
    or review is never a condition of any discount (CLM-07's exchange is feedback and *permission
    to ask*, not a guaranteed positive review). Keep it in the site repo next to
    `commercial-model-decision.md` where the rest of the commercial reasoning lives.
    impact 4/5 · effort 1/5 · touches: new docs/deal-desk-rules.md, docs/commercial-model-decision.md

43. **PRICING-OFFERS-PACKAGING-043 — Promote number ownership from an FAQ answer to a headline guarantee.**
    The deepest fear in buying a phone product is being trapped, and the answer already exists
    buried in FAQ #3 on `home.html:975`: your number stays yours, forwarding is a setting you
    control, you can switch it off from your own phone at any time. Lift it into the risk-reversal
    block at `home.html:934–939` and onto `pricing.html` as a named guarantee — "You keep your
    number. Forwarding is your setting, and you can turn it off from your own phone in under a
    minute" — because a buyer who knows the exit is thirty seconds away commits far faster.
    impact 4/5 · effort 1/5 · touches: home.html `#risk` block, pricing.html

44. **PRICING-OFFERS-PACKAGING-044 — State the three cancellation facts as a single named commitment.**
    "Month to month" and "cancel anytime" appear across the site, but the three specifics a
    suspicious buyer wants are scattered or absent: no cancellation fee, no notice period beyond
    the renewal date, and no automatic price increase (the 30-day notice from idea 020). Group them
    as a three-line "Leaving is easy on purpose" block on `pricing.html`, worded identically to
    `terms.html:110` so the sales copy and the contract cannot drift. Naming the commitment makes
    it memorable; scattering it makes it invisible.
    impact 3/5 · effort 1/5 · touches: pricing.html, terms.html

45. **PRICING-OFFERS-PACKAGING-045 — Publish what happens if Nevamis cannot build what was promised.**
    `pilot.html` covers every way the *client* can walk away and nothing about the case where the
    build genuinely does not work — an incompatible calendar, a call flow too complex for the
    approved scope, a phone system that will not forward conditionally. Write the position plainly:
    if we cannot deliver the agreed scope, the setup fee is returned in full and the subscription
    never starts. Being the vendor who publishes their own failure case is disproportionately
    persuasive to a trades owner who has been burned by a website company.
    impact 4/5 · effort 2/5 · touches: pilot.html, terms.html, docs/CLAIMS-LEDGER.md (new row, refund promise)

46. **PRICING-OFFERS-PACKAGING-046 — Turn the overage policy into a no-surprise-bill guarantee.**
    All the parts already exist and none are framed as a promise: alerts at 50/75/90/100%
    (`usagePolicy.notes`), the client's chosen behaviour at the limit (idea 028), and per-period
    rounding rather than per-call rounding (documented in `src/domain/usage.ts`, and genuinely more
    generous than rounding every 40-second call up to a minute). Assemble them into one named
    guarantee on `pricing.html`: "You will never get an overage charge you did not choose." Then
    hold the engine to it — `checkUsageAlerts` must respect the stored preference at 100%, not just
    notify.
    impact 4/5 · effort 2/5 · touches: pricing.html, nevamis-engine src/domain/usage.ts, docs/CLAIMS-LEDGER.md

47. **PRICING-OFFERS-PACKAGING-047 — Define "standard" versus "priority" support in hours instead of adjectives.**
    After Hours includes "Standard email support" and Growth "Priority email support"
    (`pricing-config.js:66, 81`), a C$200/month difference described entirely by one adjective. Pick
    honest, achievable definitions a solo founder can meet every time — say, next business day
    versus same business day, Mountain time, business days — and render them on the cards. CLM-12
    already records a service-level promise being REMOVED for being unverifiable, so set targets
    that are conservative enough to keep, and add a ledger row when they ship.
    impact 3/5 · effort 2/5 · touches: pricing-config.js, pricing.html, docs/CLAIMS-LEDGER.md

48. **PRICING-OFFERS-PACKAGING-048 — Spell out what a "tuning review" is, since it is the real difference between tiers.**
    After Hours gets "One monthly tuning review"; Growth gets "Two tuning reviews per month for the
    first 90 days" — the phrase carries a large share of the price gap and is defined nowhere. Write
    a four-line definition: what you send (a call sample), what happens (rules, questions and
    escalation adjusted), what you get back (a written change note), and how long it takes. Add it
    to `pricing.html` beside the plan grid and to the pricing FAQ. A vague included service is
    valued at zero by the buyer and still costs the founder real hours.
    impact 4/5 · effort 2/5 · touches: pricing.html, pricing-config.js feature strings

49. **PRICING-OFFERS-PACKAGING-049 — Make data portability part of the offer, not just the privacy policy.**
    The engine already ships `src/app/api/export/calls` and `src/app/api/export/invoices`, which
    means "you can take your call history and your invoices with you" is a shipped capability, not a
    promise. Say so on `pricing.html` under the cancellation block. For a buyer weighing a young
    vendor, "if this company disappears I keep my data" removes a real risk at the cost of one
    sentence about code that already exists.
    impact 3/5 · effort 1/5 · touches: pricing.html, privacy.html cross-reference

50. **PRICING-OFFERS-PACKAGING-050 — Show the pricing version as a trust signal rather than a footer artifact.**
    `pricing.html:262` renders "pricing updated 2026-07-23" into the footer base row where nobody
    reads it, and the `approved: false` draft-banner mechanism (line 261) is invisible when
    everything is approved. Move the version stamp to the top of the plan grid as "These are the
    live prices as of 23 July 2026. Your written quote locks them." Versioned, dated pricing is
    rare enough in this category to read as competence, and it makes the eventual price change a
    documented event rather than a discovered one.
    impact 2/5 · effort 1/5 · touches: pricing.html

51. **PRICING-OFFERS-PACKAGING-051 — Instrument the pricing page. Right now it emits almost nothing.**
    `site.js` beacons `data-evt` clicks to `app.nevamis.ca/api/events`, and `pricing.html` carries
    exactly one meaningful pricing event (`pricing_view_click` lives on the *homepage*). With single-
    digit traffic, the qualitative signal is what matters: fire `pricing_plan_reveal` with the plan
    id when a card scrolls into view, `pricing_recommender_result` with the recommended plan and
    bucketed estimated minutes, `pricing_annual_view`, and `pricing_book_click` carrying the plan.
    Twenty sessions of that data tells you which tier people actually consider before you spend a
    month guessing.
    impact 4/5 · effort 2/5 · touches: pricing.html, site.js, docs/analytics-events.md

52. **PRICING-OFFERS-PACKAGING-052 — Carry the chosen plan through to the booking page.**
    The recommender produces a plan and then dumps the buyer onto `/book.html` where the Cal.com
    iframe knows nothing about it, so the strategy call restarts the pricing conversation from zero.
    `book.html` already has a working prefill mechanism (`#bkPrefill` rewriting the Cal.com URL with
    prefill params), so add `?plan=growth&mins=700` to the CTA in the recommender result, read it in
    `book.html`, and pass it into the Cal.com notes field. Daren then opens the call already knowing
    the number they were looking at.
    impact 4/5 · effort 2/5 · touches: pricing.html recommender CTA, book.html prefill script

53. **PRICING-OFFERS-PACKAGING-053 — Validate `pricing-config.js` against the engine's `CANONICAL` in CI.**
    There are now two sources of truth for the same prices — `nevamis-site/pricing-config.js` and
    `nevamis-engine/src/domain/canonical.ts`, whose comment optimistically says "Prices mirror
    nevamis-site/pricing-config.js". Nothing enforces that, and the mirror already has more fields
    than the site config (`annualMonthsCharged`, `payAsYouGo.note`, `frontDeskPilot` caps). Add a
    test in the engine that loads the site's config file and asserts every plan's monthly, annual,
    setup, includedMinutes and overage match `CANONICAL.pricing`, alongside the 253 existing vitest
    tests. Two divergent price lists is the failure mode that ends in a refund.
    impact 4/5 · effort 2/5 · touches: nevamis-engine tests/, src/domain/canonical.ts, nevamis-site/pricing-config.js

54. **PRICING-OFFERS-PACKAGING-054 — Rename the plans after what they do, not how big they are.**
    "After Hours" describes a job; "Growth" and "Scale" describe the buyer's ambition, which is
    SaaS-speak an electrician did not ask for. Names that map to coverage — After Hours, Front Line,
    Multi-Line — make the ladder self-explanatory and turn the tier choice into an operational
    question ("do I want it answering while I'm on a roof?") instead of an ego question. The change
    is a `name` field in config plus the JSON-LD `Offer` names in `home.html:143–190`; run it past
    the owner first, since `docs/CLAIMS-LEDGER.md` CLM-04 pins the current names.
    impact 3/5 · effort 2/5 · touches: pricing-config.js, home.html JSON-LD offers, nevamis-engine canonical.ts, docs/CLAIMS-LEDGER.md

55. **PRICING-OFFERS-PACKAGING-055 — Lead the plan grid with Growth, not with After Hours.**
    `pricing.html` renders `P.plans` in array order, so the buyer meets C$249 first and every
    subsequent number reads as an increase. Rendering Growth first — visually larger, flanked by
    After Hours and Scale — makes C$249 read as a saving and C$849 as a step up, without changing a
    single figure. Change the render order (not the config order, which other consumers depend on)
    and A/B it against the current layout using the `pricing_plan_reveal` events from idea 051.
    impact 3/5 · effort 1/5 · touches: pricing.html renderer, assets/motion/site.css `.plans` grid

56. **PRICING-OFFERS-PACKAGING-056 — Answer "why is this more than the C$59 app" in one honest paragraph on the price page.**
    Every buyer who does thirty seconds of research finds a self-serve AI receptionist for a tenth
    of the price, and the site's answer to that is currently spread across a comparison table and a
    build-stack section on the homepage. Put it on `pricing.html` where the objection actually
    fires, in the buyer's own terms: the cheap app is software you configure and support; Nevamis is
    a built and maintained system where somebody else writes your call flow, tests it against your
    real scenarios and fixes it when your business changes. Then name the honest counter-case —
    if you enjoy configuring software and your call flow is simple, buy the app.
    impact 4/5 · effort 1/5 · touches: pricing.html

57. **PRICING-OFFERS-PACKAGING-057 — Publish a pricing changelog page.**
    `pricing-config.js` carries `lastUpdated` and `docs/commercial-model-decision.md` records the
    reasoning behind every commercial choice, but a prospect has no way to see that prices have been
    stable and that a retired guarantee was retired deliberately. A short `/pricing-changelog.html`
    — dated entries, what changed, why — is cheap, compounds as an SEO and AI-citation asset for
    "nevamis pricing" queries, and pre-answers the "will you raise this on me" objection with
    evidence instead of a promise. Add it to `sitemap.xml` and link it from the version stamp in
    idea 050.
    impact 3/5 · effort 2/5 · touches: new pricing-changelog.html, sitemap.xml, llms.txt

58. **PRICING-OFFERS-PACKAGING-058 — Package the same plans by trade, with the trade's own arithmetic.**
    An HVAC owner in November and a restoration contractor at 2am have identical plans but entirely
    different math — one is a seasonal volume spike, the other is a small number of very high-value
    emergency calls where a single captured job pays for a year. Build two trade pages (or two
    sections in `assets/industries/`) that present the *same* config-rendered plans with a preset
    ROI scenario and a recommended tier for that trade. Packaging is presentation, not new SKUs, so
    this creates high-intent SEO surface without touching a single approved number.
    impact 4/5 · effort 3/5 · touches: new hvac/restoration pages, pricing-config.js (read only), sitemap.xml

59. **PRICING-OFFERS-PACKAGING-059 — Publish a one-page printable price sheet for the supply counter.**
    The outbound plan leans on physical presence — branch counters, association talks, trade
    events — and there is currently nothing to hand over that carries the actual numbers. Build a
    print stylesheet or a generated PDF from `pricing-config.js`: three plans, PAYG, first-month
    total, the pilot terms, the demo number, and the founding-client line. Generated from config,
    it can never carry a stale price the way a designed-once PDF inevitably does, and reprinting
    after a price change costs nothing.
    impact 3/5 · effort 2/5 · touches: new scripts/price-sheet.mjs or a `@media print` block in pricing.html

60. **PRICING-OFFERS-PACKAGING-060 — Fill in `pilot-unit-economics.md` after the first pilot and let it decide the offer.**
    The doc is a complete, well-built formula sheet with every assumption blank: founder hourly
    value, hours per pilot, platform cost, conversion rate, max acceptable CAC, minimum conversion
    rate before pausing free pilots. Until those are filled with real numbers, every offer decision
    above — waive versus credit-back setup, free versus paid pilot, how many founding spots, whether
    rollover is affordable — is being made on instinct. Fill it from pilot number one, and set the
    two decision thresholds in advance so the answer to "should I keep giving pilots away" is a
    number that already exists rather than a mood on a bad week.
    impact 5/5 · effort 2/5 · touches: docs/pilot-unit-economics.md, docs/commercial-model-decision.md
