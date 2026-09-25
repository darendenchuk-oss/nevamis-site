/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   APPROVED 2026-08-06, MODEL CLARIFIED 2026-08-07,
   SIMPLIFIED TO ONE RECURRING PRICE 2026-08-09,
   PRICED AFTER A SCAN (morning) AND THEN THE
   OPERATE / GROW / PERFORMANCE PARTNERSHIP MODEL (evening) 2026-08-15,
   THE ADD-ON MODEL (v4) 2026-08-22, THE V5 REPRICE 2026-08-24,
   THE PARTNERSHIP GROWTH STACK (v6) 2026-09-12.
   Do not duplicate these values in HTML — render from here.

   THE COMMERCIAL MODEL, IN ONE TABLE (v5, owner directive 2026-08-24):

     Plan                     Launch & Implementation   Monthly                 Performance
     The Works (the bundle)   C$3,000 one-time          C$2,100                 none
     AI Front Desk (start)    C$1,500 one-time          C$1,000                 none
     Performance Partnership  from C$2,500 one-time     C$350 (band C$250-500)  10% attributable collected revenue, 12 months, NEVER spoken on a call
       (invite / approval based — never the default, never self-serve)
     Enterprise               starting at C$5,000       custom                  optional
       (quoted per client, from what a PULSE scan finds)

     Add-ons (each its own sale, bought on its own or beside a plan, each
     with its own one-time Launch & Implementation fee since v5):
       Missed-Call Recovery   C$500 L&I, C$350/month    sellable today
       Quote-Chase Engine     C$750 L&I, C$500/month    sellable today
       Get-Paid Autopilot     C$750 L&I, C$500/month    sellable today
       Review Engine          C$500 L&I, C$300/month    sellable since 2026-08-24 (end-to-end drill, docs/verification/REVIEW-ENGINE-E2E.md)
       Lead Generation        no monthly, no launch fee  NOT sellable (offered by invitation)
       Search Rankings        no price at all            NOT sellable (nothing is built for it)
       Customer Reactivation  C$2,000/campaign          NOT yet sellable (prototype)

   WHAT V6 CHANGED AND WHY (2026-09-12, owner decision, mirrored from
   nevamis-engine CANONICAL.pricing.addOns via PR #265 inside train #276).
   The Performance Partnership is now the plan that carries a GROWTH STACK:
   every item in it is still its own sale, and each one changes what the plan
   costs. Two of them are paid out of the revenue they produce instead of out
   of a monthly, which is the only genuinely new commercial shape here:

     Lead Generation on the Partnership      no launch fee, no monthly, an
                                             agreed share of collected revenue
                                             directly attributable to a
                                             business Nevamis found
     Quote-Chase Engine on the Partnership   no launch fee, no monthly, an
                                             agreed share of collected revenue
                                             directly attributable to a quote
                                             Nevamis recovered
     Missed-Call Recovery, Get-Paid
     Autopilot, Review Engine                their own pair, unchanged
     Search Rankings                         listed as coming, never sold

   THE SHARE IS NEVER WRITTEN AS A PERCENTAGE in anything a stranger reads.
   `shareBps` exists here because the engine carries it and a mirror that
   dropped it would be a mirror of a different model; it is a RATE THE
   EXECUTED AGREEMENT CARRIES, not a number to render. The approved sentence,
   and the only one any surface may use, is the one the engine's claim
   registry generates: "<item> on the Performance Partnership is paid by an
   agreed share of collected revenue directly attributable to <what>, subject
   to your agreement." Nothing here may render `shareBps` into copy.

   THE PARTNERSHIP BLOCK IS DERIVED, NOT RESTATED, for the three items whose
   price does not change on the Partnership. `partnershipTerms(id)` below
   returns a block for EVERY add-on, and an add-on that declares no
   `partnership` of its own gets its own pair back with no share. That is an
   exact mirror of the engine's partnershipTerms(), and it is deliberate: a
   second copy of C$500/C$350 sitting under a `partnership` key is the stale
   figure this file exists to make impossible.

   LEAD GENERATION IS NOT SELLABLE HERE, and it is the found-customer product
   only. The engine re-scoped it on 2026-09-12: what a client signs up for is
   the list of businesses found for them. Bid and tender work is arranged by
   hand under the service agreement's named-approver rule and is not part of
   the sign-up, so it is not described as part of this item anywhere. Its
   status stays private testing, offered by invitation, and `sellable: false`
   keeps it off every Buy control until the engine's capability record says
   ready.

   SEARCH RANKINGS HAS NO PRICE because nothing is built for it. It is listed
   so a reader can see what the stack will hold; it may be described as
   coming, and it may never be sold or charged.

   WHAT V5 CHANGED AND WHY (2026-08-24). The Works and Performance
   Partnership repriced up (C$1,800->C$2,100/mo, C$250->C$350/mo default in
   a published C$250-500 band); every add-on gained its own one-time Launch
   & Implementation fee, which forced C$500 off the retired-monthly-price
   list since two engines now legitimately bill C$500/month; Performance
   Partnership's rate dropped 15%->10% and is now never spoken as a number
   on a call — only "the agreed share of attributable collected revenue,
   subject to your agreement." Review Engine flipped from prototype to
   sellable on exercised end-to-end evidence, not assertion.

   WHAT V4 CHANGED AND WHY (2026-08-22, superseded by v5 above but the
   structural change still stands). Every automation is its own product with
   its own price, sold on its own evidence, instead of bundled invisibly into
   a tier's monthly. Grow (C$750 + 10%) left the ladder: its key `growth` now
   sells THE WORKS, the everything bundle, priced under the sum of its parts
   and carrying no performance fee. C$750 joined the retired prices; "Grow"
   and "Operate" joined the retired names. The reprice was made at zero live
   subscriptions, which is the one moment a key can change meaning without a
   stored amount misreading. Performance pricing survives only on the
   invite-only Partnership.

   THERE IS NO MINIMUM TERM (owner directive 2026-09-08). This REVERSES the
   2026-08-22 v4 rule of a three-month start on the AI Front Desk and six
   months with any add-on or The Works. Every plan and every add-on, alone or
   added, is month to month from the first month, cancelled by the client from
   the client's own portal, with the price locked for 12 months from signing.
   "Month to month" and "cancel any time from your portal" are therefore TRUE
   again and no longer retired vocabulary; any sentence stating a three-month
   or six-month start, a minimum term, or months "agreed up front" is now
   FALSE and must not be written. The one-time Launch & Implementation fee,
   charged once beside the first month, is the only commitment, and its
   amounts are unchanged. Prices are unchanged.

   AND THERE IS NO NOTICE PERIOD EITHER (owner directive 2026-09-12). Four
   days after the minimum term came off every surface, the sign-up pages were
   still reading "30 days notice" - the same defect in a smaller shape, a
   commitment a buyer meets in the copy rather than in the decision.
   `cancellationNoticeDays` is now 0: a client cancels at any time from their
   own portal and keeps the month already paid for, and nothing renews after
   that. Any sentence making "30 days notice", "thirty days' notice" or "on
   notice" a condition of cancelling is FALSE and must not be written, and
   "cancel any time" is now literally true rather than nearly true. The
   twelve-month price lock, the one-time fee and every price are unchanged.
   The price-increase notice in terms.html is a DIFFERENT promise - notice
   Nevamis gives the client before raising a price - and it stays.

   THE ONE-TIME FEE still has one name and one meaning. "Launch &
   Implementation" is charged once, at the start, BESIDE the first month —
   never instead of it. The approved sentence shape is "C$1,500 Launch &
   Implementation to start, then C$1,000 a month": the joins are "to start"
   and "then", never "plus", "+" or "and". "Setup fee", "activation fee" and
   "onboarding fee" remain RETIRED VOCABULARY: they may be denied, never used
   as the name of this fee. And the launch fee itself must never be denied.

   KEYS ARE STABLE AND NAMES MOVED, AGAIN. `pro` recurred at C$1,000 and the
   AI Front Desk recurs at C$1,000, unchanged by v5; `starter` is Performance
   Partnership, moved by v5 from a fixed C$250 to a C$350 default inside a
   published C$250-500 band; `growth` is The Works, moved C$750->C$1,800 by
   v4 then C$1,800->C$2,100 by v5. Order is display order: index 0 is The
   Works (the anchor a reader sees first), index 1 is the AI Front Desk —
   the recommended start and the checkout default.

   The `launch` key is the one-time fee. It is deliberately NOT called
   `setup`: nevamis-engine's checkPricing treats the PRESENCE of a `setup`
   figure as a defect, and the engine parser reads `launch` instead.
   ============================================================ */
(function () {
  /* WHAT THE FRONT DESK INCLUDES, written once.

     One array, spread into the plans, because the front-desk capability does
     not differ by plan and a per-plan copy of this list would let it look as
     though it did. The honest differences are the metered ones, the
     commercial ones (the Launch & Implementation fee), and — since v4 —
     WHICH AUTOMATIONS ARE IN: none on the AI Front Desk (they are add-ons),
     all of the sellable ones on The Works.

     Every line here is something the system does today, end to end, for a
     paying client. That is the bar.

     TWO LINES HERE FAILED THAT BAR, and both were fixed on 2026-09-24.

     The minutes line ended "and your choice of overage, fallback answering
     or a hard cap". No client chooses anything at the limit: nevamis-engine's
     src/domain/usage-policy.ts models the three behaviours and has no
     production caller, no setting and no portal screen, and every account
     does the same thing (calls keep being answered, extra minutes bill at
     the plan's per-minute rate). The demo line already refused the choice in
     so many words while this page sold it, so a buyer who picked a plan for
     the hard cap would have been billed overage. The line now says what
     happens. The alerts go by text or email (client-notify.ts
     notifyClientOfUsage), and the running total is on the portal's billing
     page; the alerts are not "in the portal".

     The portal line promised "a portal Pulse page that keeps your scans".
     The client Pulse page was cut on 2026-09-19 and /portal/pulse redirects
     to /portal/results, which shows one modelled opportunity and no scan
     history. The line now describes the Results page as it is.

     scripts/check-consistency.js guard 7k refuses both promises on every
     rendered surface, so neither can come back through another page. */
  var EVERY_PLAN = [
    "Answers your line around the clock, configured from your own hours, services, service area, prices and FAQs",
    "Asks the qualifying questions you approved, in your words",
    "Captures the caller's name, callback number, what they want, the service, how urgent it is, how the call ended and what happens next, as one structured lead",
    "Texts and emails you that summary within seconds of the call ending, and records honestly whether each one was delivered",
    "Every call recorded and playable in your portal, with CSV export of the lead record",
    "Automatic quality review of any call where a caller used emergency language, or the agent claimed a booking it could not confirm",
    "Scripted test callers run against your live agent before a phone number is ever pointed at it",
    "Call forwarding proven by placing a real call to your line, not assumed",
    "Included minutes metered on your portal's billing page, with a text or email alert after you pass 50%, 75%, 90% or 100%, and calls still answered past the allowance, each extra minute billed at your plan's per-minute rate",
    "A PULSE scan of your public website, with every money figure a modelled range and a confidence level rather than a measurement, and sharper as you connect your own numbers",
    "A Results page in your portal that labels every number as measured, declared, estimated or not yet measured, and never adds an estimate to measured money",
    "Invoices, plan changes and cancellation handled yourself in the portal",
    "Email support at support@nevamis.ca"
  ];

  window.NV_PRICING = {
    approved: true,
    currency: "CAD",
    lastUpdated: "2026-09-12",
    taxNote: "Prices in Canadian dollars, plus applicable GST/HST.",
    commercialModel: "V6-growth-stack",
    /* Whether a visitor may complete a purchase without talking to anyone.
       TRUE since 2026-08-16, on the owner's explicit authorization. The
       engine's checkout gate opened the same day with the same authorization
       recorded on it; neither side relies on the other. */
    sellable: true,
    /* WHETHER A PLAN PRICE MAY BE SHOWN TO A STRANGER. TRUE since the
       2026-08-15 evening directive, carried through v4. Mirrors
       CANONICAL.pricing.publishedPricing in nevamis-engine, and the engine's
       checkPricing enforces it across this repo. Flip both together or the
       cross-repo check fails, which is the point of it. */
    publishedPricing: true,
    /* THE CONTRACT TERM. Mirrors CANONICAL.pricing.terms in nevamis-engine.
       Stated here because a term a buyer discovers at the agreement is a term
       that was hidden, and the same is true of its absence: a buyer should be
       able to read that nothing is locked before the button, not after it.

       ONE FIELD, NOT TWO, matching CANONICAL.pricing.terms exactly since the
       2026-09-08 owner directive. v4 carried `minimumMonthsCore` and
       `minimumMonthsWithAddOns`, and the PAIR is what let a stale "6" sit in
       a mirror after the "3" beside it had already been corrected: two
       numbers for one decision means a surface can be half right and read as
       whole. `minimumMonths` is zero, which is what makes "no minimum term"
       derivable on every surface instead of typed on each one. Re-introducing
       a term is deliberately a one-figure change here: set it above zero and
       every sentence and guard follows. A shape that needs a SECOND number
       again is a new field and a new decision, not an edit to this one. */
    terms: {
      minimumMonths: 0,
      /* ZERO since the owner directive of 2026-09-12, mirroring
         CANONICAL.pricing.terms.cancellationNoticeDays in the engine. The
         field is KEPT rather than deleted so every surface still derives its
         sentence from one number: re-introducing a notice period stays a
         one-figure change here, where deleting the field would have scattered
         "at any time" as typed copy across a dozen pages instead. Renderers
         must branch on the value and never fall back to `|| 30`, because that
         fallback is precisely what resurrects the retired notice at zero. */
      cancellationNoticeDays: 0,
      priceLockMonths: 12,
      note: "There is no minimum term. Every plan and every add-on, bought on its own or added later, is month to month from the first month: cancel any time from your own portal, service running to the end of the month you already paid for, and your price locked for 12 months from signing. The one-time Launch & Implementation fee, charged once beside your first month, is the only commitment."
    },
    /* ENTERPRISE, deliberately NOT a plans[] entry: it has no universal
       monthly price, and a record shaped like a priced plan gets rendered as
       one by the laziest reader (the Pay As You Go lesson). An Enterprise
       quote is built per client, from what a PULSE scan finds. `launchFrom`
       is a floor ("starting at"), never a price. */
    enterprise: {
      name: "Enterprise",
      launchFrom: 5000,
      note: "Multi-location, custom integrations, custom data pipelines and advanced deployments are quoted per client, from what a scan of the business finds. The recurring amount and any performance component are quoted per client."
    },
    /* The badge on the recommended plan. It moved to the AI Front Desk on
       2026-08-22: The Works is the anchor a reader prices the ladder against,
       and the Front Desk is the recommended start and the checkout default,
       which reads the same record. It is a recommendation, never a claim about
       what other businesses chose: there are no clients yet to count. */
    recommendedLabel: "RECOMMENDED",
    /* THE ADD-ON CATALOG, v4, with the 2026-09-08 directives applied: every
       automation is its own product and its own sale. `soldAlone: true` means
       a client may buy that module by itself, with nothing else beside it; it
       may also sit beside a plan, and every one of them is month to month from
       the first month like everything else. Mirrors the `soldAlone` field on
       CANONICAL.pricing.addOns in nevamis-engine, and `sellable` is still the
       outer gate: a module that is not sellable is not sold in any
       arrangement. `sellable: false` marks a module whose machinery has not
       shipped end-to-end yet: it may be described as coming, never sold, and no
       surface may render it with a Buy control. Every figure below is v5's
       (owner directive 2026-08-24), the same day the two engines' monthly
       came off the retired-price list; the v4 note that explained a lower
       figure for them here went stale then and is gone. */
    addOns: [
      {
        id: "missed_call_recovery", name: "Missed-Call Recovery",
        monthly: 350, launch: 500, sellable: true, soldAlone: true,
        blurb: "A caller you missed gets one text back, during business hours, with your name on it and a working opt-out, before they ring the next name on Google."
      },
      /* ON THE PARTNERSHIP this one is paid out of what it recovers rather
         than out of a monthly (owner decision 2026-09-12). Its standalone
         pair is untouched: bought on its own, or added to any other plan, it
         is still C$750 to start, then C$500 a month. `shareBps` mirrors
         CANONICAL.pricing.addOns[].partnership.shareBps in nevamis-engine and
         is never rendered: see the header note on the approved sentence. */
      {
        id: "quote_chase", name: "Quote-Chase Engine",
        monthly: 500, launch: 750, sellable: true, soldAlone: true,
        partnership: { launch: 0, monthly: 0, shareBps: 1000, attributableTo: "a quote Nevamis recovered" },
        blurb: "Every estimate that goes quiet gets followed up: the day it stales, day four, day eleven, each touch approved by you, stopping the moment the customer replies."
      },
      {
        id: "get_paid", name: "Get-Paid Autopilot",
        monthly: 500, launch: 750, sellable: true, soldAlone: true,
        blurb: "Overdue invoices get a gentle nudge, a firm one a week later, and at three weeks YOU get told instead, because past that point the judgment call belongs to a person."
      },
      {
        id: "review_engine", name: "Review Engine",
        monthly: 300, launch: 500, sellable: true, soldAlone: true,
        blurb: "Post-job review requests by text, policy-safe: one ask per finished job, with your own review link, and every request released by a person."
      },
      /* ---------- the v6 growth stack (owner decision 2026-09-12) ----------

         LEAD GENERATION is a catalog item so the surfaces that offer it read a
         record instead of a sentence somebody typed. It is paid the way the
         owner described it: nothing monthly, an agreed share of what it
         actually produced. There is no standalone pair, which is why `monthly`
         and `launch` are zero and `soldAlone` is false: a module offered alone
         at zero would be an arrangement this business does not have.

         `sellable: false` FOLLOWS THE ENGINE'S CAPABILITY RECORD, which reads
         private_pilot today (offered by invitation, live gate 5 of 7
         evidenced: canonical workflow, configuration, persisted outcomes,
         client interface and operator remediation; proven execution and
         customer zero are still open, and each needs a real production run). The engine derives its lifecycle from
         that record rather than typing it; this file cannot derive across
         repositories, so it mirrors today's answer and carries this note. The
         day the capability's own branch evidences the gate, this flips with it
         and roadmap-config.js flips with it, and neither may lead the other:
         the site may say less than the engine, never more.

         THE FOUND-CUSTOMER PRODUCT ONLY. Bid and tender work left the sold
         record on 2026-09-12; it is arranged by hand under the service
         agreement's named-approver rule, and no copy derived from this entry
         may schedule it as part of signing up. */
      {
        id: "lead_generation", name: "Lead Generation",
        monthly: 0, launch: 0, sellable: false, soldAlone: false,
        partnership: { launch: 0, monthly: 0, shareBps: 1000, attributableTo: "a business Nevamis found" },
        blurb: "Businesses that fit what you do, found for you, with the page each one came from and what came of it. Offered by invitation, under your own agreement, and not yet sellable from a page."
      },
      /* SEARCH RANKINGS is listed because it is part of the stack the owner
         named, and a stack item nobody can see is a stack item nobody asks
         for. NOTHING IS BUILT FOR IT: no workflow, no capability record, no
         provider. It is listed as coming, it carries no price, and it may not
         be sold or charged. It gets a price the day something exists to charge
         for. */
      {
        id: "seo_rankings", name: "Search Rankings",
        monthly: 0, launch: 0, sellable: false, soldAlone: false,
        blurb: "Better search rankings for the work you want more of. Coming, and not built yet."
      },
      {
        id: "reactivation", name: "Customer Reactivation",
        perCampaign: 2000, sellable: false, soldAlone: false,
        blurb: "A win-back campaign over your own past-customer list, inside the consent rules. Coming, and not sellable until it ships end to end."
      }
    ],
    /* WHAT AN ITEM COSTS ON THE PERFORMANCE PARTNERSHIP, derived exactly as
       nevamis-engine's partnershipTerms() derives it. An add-on that declares
       no `partnership` block of its own is charged its own pair there and
       takes no share, so the three items whose price does not change carry no
       second copy of their figures. Returns null for an id the catalog does
       not have, so a renderer asking about a module that was removed gets
       nothing rather than a plausible-looking zero.

       `shareBps` comes back on the block because it is what the record holds.
       It must never be rendered: the approved client-facing sentence carries
       `attributableTo` and the words "an agreed share", never a number. */
    partnershipTerms: function (id) {
      var a = (this.addOns || []).filter(function (x) { return x.id === id; })[0];
      if (!a) return null;
      if (a.partnership) {
        return { launch: a.partnership.launch, monthly: a.partnership.monthly,
                 shareBps: a.partnership.shareBps, attributableTo: a.partnership.attributableTo };
      }
      return { launch: a.launch || 0, monthly: a.monthly || 0, shareBps: 0, attributableTo: null };
    },
    /* WHAT EVERY PLAN INCLUDES, derived rather than listed a second time
       (2026-09-24, W6). The pricing page printed the same fourteen lines on
       all three cards, so a buyer comparing plans read the list three times
       and could not see the two or three lines that actually differ. The
       page now prints this list once and each card only what is left.

       It is the lines EVERY plan's `features` carries, in the first plan's
       order, computed rather than read off EVERY_PLAN: "One business phone
       line" is on every plan without being in EVERY_PLAN, and a line added
       to one plan's own list must stay on that plan's card, which a
       name-based split would get wrong the first time the lists move.
       `features` itself is untouched, because proposal.html renders one
       plan's whole list and needs it whole. */
    sharedFeatures: function () {
      var plans = this.plans || [];
      if (!plans.length) return [];
      return plans[0].features.filter(function (f) {
        return plans.every(function (p) { return (p.features || []).indexOf(f) >= 0; });
      });
    },
    /* The referral offer. Mirrors CANONICAL.referral in nevamis-engine, and the
       engine's consistency checker validates these values against it. The
       REFERRER's free month is earned on the referred business's first PAID
       invoice, not on their signup. */
    referral: {
      referrerRewardMonths: 1,
      headline: "Refer another business.",
      offer: "When they pay their first invoice, you get a free month of your own plan, applied as a credit to your next bill.",
      trigger: "The free month is earned when the business you referred pays their first invoice, and it comes off your next bill.",
      howTo: "Clients get their own link in the portal. Send it yourself: we never email somebody just because you named them."
    },
    /* Retired 2026-07-31, still retired under v4. */
    foundingClient: {
      active: false,
      spots: 0,
      offer: "",
      note: ""
    },
    /* Suspended 2026-08-06; no annual figure is approved and none is invented
       here. */
    annual: {
      active: false,
      monthsCharged: 10,
      offer: "",
      note: ""
    },
    /* WHAT HAPPENS AT THE LIMIT, stated as the product does it. The last note
       read "Near the limit you choose: automatic overage, fallback answering,
       or a hard cap." until 2026-09-24, and there is no such choice: see the
       note on EVERY_PLAN above. Every account keeps answering and bills the
       extra minutes at the plan's own rate, the same sentence the demo line
       gives a caller. The per-minute figures are on each plan card, rendered
       from `overage` below, so none is typed here. If the choice is ever
       built, it is re-published here in the same change that wires it, and
       guard 7k has to be told in the same commit.

       THE ALERT LINE says "after you pass", never "at". The engine checks
       usage from its daily run (checkAndNotifyUsage, called only by
       /api/autopilot/daily), and when several thresholds were crossed since
       the last check it sends only the highest one. So a busy client may
       get one message at 90% a day after crossing it, not four on the dot;
       "an alert at 50%, 75%, 90% and 100%" promised the four. */
    usagePolicy: {
      minuteDef: "A connected AI minute starts when the AI answers a connected call and ends when the AI portion of the call ends.",
      notes: [
        "Failed calls that never connect are not counted.",
        "Wrong numbers or spam that reach the AI consume usage, because the system handled them.",
        "A text or email alert after you pass 50%, 75%, 90% or 100% of your included minutes, with your running total on your portal's billing page.",
        "Past your included minutes, calls keep being answered and each extra minute is billed at your plan's per-minute rate, shown on its card above."
      ]
    },
    /* `monthly` recurs; `launch` is charged once, at the start, beside the
       first month — never instead of it. There is deliberately no `setup`
       key. `performanceNote` is the approved customer wording for the
       performance component, or null where the plan has none. `selfServe:
       false` marks an invite/approval-based plan that no surface may present
       as the default choice.

       ORDER IS DISPLAY ORDER, and it changed on 2026-09-12 on the owner's
       instruction to lead every surface with Lead Generation. Lead Generation
       has no plan of its own: it is an item on the Performance Partnership, so
       the Partnership is the card that has to come first for the lead offer to
       be the first thing a reader meets. The Works follows as the anchor a
       reader prices the ladder against, then the AI Front Desk, which is still
       `recommended: true` and still the checkout default. Nothing about what
       is recommended moved; only what is read first. Every renderer walks this
       array in order (pricing.html's cards, the homepage plans strip in
       site.js, build-schema.mjs's Offer list), so this is the one place the
       order is decided. */
    plans: [
      {
        /* INVITE / APPROVAL BASED. `selfServe: false` is what keeps the
           lowest published monthly (the default inside the band below) from
           being read as "the cheap tier": Nevamis carries acquisition risk
           here and chooses when to offer it. Described, never presented as
           the default, and checkout refuses to sell it without an
           approval. */
        id: "starter", name: "Performance Partnership",
        monthly: 350, monthlyRange: [250, 500], launch: 2500, includedMinutes: 250,
        callRange: "80 to 125 typical calls", overage: 1.10,
        selfServe: false,
        performanceNote: "Lower fixed cost. Lead Generation, offered by invitation, and the Quote-Chase Engine are each paid on it by an agreed share of collected revenue directly attributable to a business Nevamis found or a quote Nevamis recovered, subject to your agreement. The monthly, the share, the attribution window and what counts as eligible revenue are all set in your agreement before anything is charged.",
        /* NAMES THE GROWTH STACK, v6. The stack is what the Partnership is
           now: a plan whose price is changed by the items chosen on it, two of
           them paid out of the revenue they produce. No figure and no
           percentage appears in this sentence, because the pairs live on the
           add-ons above and the share lives in the executed agreement. */
        bestFor: "A partnership we offer by invitation, where Nevamis takes on substantially more of the acquisition risk. It is the plan that carries the growth stack: Lead Generation, the Quote-Chase Engine, Missed-Call Recovery, Get-Paid Autopilot and Review Engine are each a separate item you choose, and each one changes what the plan costs. Not suitable for every business, and never the default.",
        features: [
          "One business phone line",
          /* Shortened 2026-09-24 (W6): this line restated, word for word, the
             two agreed-share sentences the plan's performanceNote already
             carries on the same card and in the proposal, which made the
             Partnership card the longest thing on the page. It now names
             the items and points at the plan's own terms, and the approved
             share sentence lives once, in performanceNote. */
          "The growth stack, each item added on its own: Lead Generation (offered by invitation) and the Quote-Chase Engine, paid on this plan's agreed-share terms, and Missed-Call Recovery, Get-Paid Autopilot and Review Engine, each with its own listed Launch & Implementation fee and monthly. Search Rankings is coming and is not sold."
        ].concat(EVERY_PLAN)
      },
      {
        id: "growth", name: "The Works",
        /* The bundle carries every sellable automation, stated as a flag so
           no renderer has to know which key means "the bundle". Under v4 it
           marked the LONGER agreed start; no plan has a term now (2026-09-08),
           and nothing reads it. */
        includesAutomations: true,
        monthly: 2100, launch: 3000, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        selfServe: true,
        performanceNote: null,
        bestFor: "The whole engine: the AI Front Desk plus every sellable automation, priced under the sum of its parts.",
        features: [
          "Everything in the AI Front Desk",
          "Missed-Call Recovery: one text back to a caller you missed, during business hours, with your name on it and a working opt-out",
          "Quote-Chase Engine: follow-up on every quiet estimate: day it stales, day 4, day 11, each touch approved by you",
          "Get-Paid Autopilot: overdue-invoice reminders, with the owner told at three weeks instead of a third email",
          "Review Engine: post-job review requests by text, one ask per finished job, with every request released by a person",
          "One business phone line"
        ].concat(EVERY_PLAN)
      },
      {
        id: "pro", name: "AI Front Desk", recommended: true,
        monthly: 1000, launch: 1500, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        selfServe: true,
        performanceNote: null,
        bestFor: "The front desk on its own: it answers every call, and each automation is its own sale you can add whenever it earns its place.",
        features: [
          "One business phone line",
          "Automation add-ons available one at a time, each its own price and its own sale, on their own or beside this plan"
        ].concat(EVERY_PLAN)
      }
    ]
  };
})();
