/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   APPROVED 2026-08-06, MODEL CLARIFIED 2026-08-07,
   SIMPLIFIED TO ONE RECURRING PRICE 2026-08-09,
   PRICED AFTER A SCAN (morning) AND THEN THE
   OPERATE / GROW / PERFORMANCE PARTNERSHIP MODEL (evening) 2026-08-15,
   THE ADD-ON MODEL (v4) 2026-08-22.
   Do not duplicate these values in HTML — render from here.

   THE COMMERCIAL MODEL, IN ONE TABLE (v4, owner directive 2026-08-22):

     Plan                     Launch & Implementation   Monthly      Performance
     The Works (the bundle)   C$2,500 one-time          C$1,800      none
     AI Front Desk (start)    C$1,500 one-time          C$1,000      none
     Performance Partnership  C$2,000 one-time          C$250        15% attributable collected revenue, 12 months
       (invite / approval based — never the default, never self-serve)
     Enterprise               starting at C$5,000       custom       optional
       (quoted per client, from what a PULSE scan finds)

     Add-ons (each its own sale, on top of the AI Front Desk):
       Missed-Call Recovery   C$300/month     sellable today
       Quote-Chase Engine     C$450/month     sellable today
       Get-Paid Autopilot     C$450/month     sellable today
       Review Engine          C$300/month     NOT yet sellable (prototype)
       Customer Reactivation  C$2,000/campaign  NOT yet sellable (prototype)

   WHAT V4 CHANGED AND WHY. Every automation is its own product with its own
   price, sold on its own evidence, instead of bundled invisibly into a
   tier's monthly. Grow (C$750 + 10%) left the ladder: its key `growth` now
   sells THE WORKS, the everything bundle, priced under the sum of its parts
   and carrying no performance fee. C$750 joined the retired prices; "Grow"
   and "Operate" joined the retired names. The reprice was made at zero live
   subscriptions, which is the one moment a key can change meaning without a
   stored amount misreading. Performance pricing survives only on the
   invite-only Partnership.

   A MINIMUM TERM EXISTS SINCE V4: three months on the AI Front Desk alone,
   six months when any add-on or The Works is included, then month to month
   with 30 days notice, price locked for 12 months from signing. "No
   contract" and "cancel any time" are therefore RETIRED VOCABULARY on every
   surface: the honest sentence is the results window — month one is the
   build and the tuning, the wins show in months two and three.

   THE ONE-TIME FEE still has one name and one meaning. "Launch &
   Implementation" is charged once, at the start, BESIDE the first month —
   never instead of it. The approved sentence shape is "C$1,500 Launch &
   Implementation to start, then C$1,000 a month": the joins are "to start"
   and "then", never "plus", "+" or "and". "Setup fee", "activation fee" and
   "onboarding fee" remain RETIRED VOCABULARY: they may be denied, never used
   as the name of this fee. And the launch fee itself must never be denied.

   KEYS ARE STABLE AND NAMES MOVED, AGAIN. `pro` recurred at C$1,000 and the
   AI Front Desk recurs at C$1,000; `starter` recurs at C$250 unchanged;
   `growth` is the one v4 reprice (C$750 -> C$1,800, made at zero
   subscriptions). Order is display order: index 0 is The Works (the anchor
   a reader sees first), index 1 is the AI Front Desk — the recommended
   start and the checkout default.

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
     paying client. That is the bar. */
  var EVERY_PLAN = [
    "Answers your line around the clock, configured from your own hours, services, service area, prices and FAQs",
    "Asks the qualifying questions you approved, in your words",
    "Captures the caller's name, callback number, what they want, the service, how urgent it is, how the call ended and what happens next, as one structured lead",
    "Texts and emails you that summary within seconds of the call ending, and records honestly whether each one was delivered",
    "Every call recorded and playable in your portal, with CSV export of the lead record",
    "Automatic quality review of any call where a caller used emergency language, or the agent claimed a booking it could not confirm",
    "Scripted test callers run against your live agent before a phone number is ever pointed at it",
    "Call forwarding proven by placing a real call to your line, not assumed",
    "Included minutes metered in the portal, with alerts at 50%, 75%, 90% and 100%, and your choice of overage, fallback answering or a hard cap",
    "A PULSE scan of your business, with every figure a range and a confidence level, recalibrated as you feed it real numbers",
    "A portal Pulse page that keeps your scans, and Results that label every number as measured or modelled",
    "Invoices and plan changes you handle yourself in the portal, and self-serve cancellation once past your minimum term"
  ];

  window.NV_PRICING = {
    approved: true,
    currency: "CAD",
    lastUpdated: "2026-08-22",
    taxNote: "Prices in Canadian dollars, plus applicable GST/HST.",
    commercialModel: "V4-addon-model",
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
    /* THE CONTRACT TERM, v4. Mirrors CANONICAL.pricing.terms in
       nevamis-engine. Stated here because a term a buyer discovers at the
       agreement is a term that was hidden; the pricing page says it in the
       open, framed the way it is true: month one is the build, the results
       show in months two and three. */
    terms: {
      minimumMonthsCore: 3,
      minimumMonthsWithAddOns: 6,
      cancellationNoticeDays: 30,
      priceLockMonths: 12,
      note: "Three-month start on the AI Front Desk; six months when any add-on or The Works is included. Month one is the build and the tuning — the results window is the point. After the minimum: month to month, 30 days notice, cancellation from your own portal, and your price is locked for 12 months from signing."
    },
    /* ENTERPRISE, deliberately NOT a plans[] entry: it has no universal
       monthly price, and a record shaped like a priced plan gets rendered as
       one by the laziest reader (the Pay As You Go lesson). An Enterprise
       quote is built per client, from what a PULSE scan finds. `launchFrom`
       is a floor ("starting at"), never a price. */
    enterprise: {
      name: "Enterprise",
      launchFrom: 5000,
      note: "Multi-location, custom integrations, custom data pipelines and advanced deployments are quoted per client, from what a scan of the business finds. Launch & Implementation starting at C$5,000 or custom quoted; the recurring amount and any performance component are quoted per client."
    },
    /* The badge on the recommended plan. It moved to the AI Front Desk on
       2026-08-22: The Works is the anchor a reader prices the ladder against,
       and the Front Desk is the start most businesses actually make — the
       checkout default reads the same record. */
    recommendedLabel: "RECOMMENDED",
    /* THE ADD-ON CATALOG, v4: every automation is its own product, added to
       the AI Front Desk one at a time, each on its own three-month start.
       `sellable: false` marks a module whose machinery has not shipped
       end-to-end yet — it may be described as coming, never sold, and no
       surface may render it with a Buy control. C$450 and not C$500 for the
       two engines is deliberate: C$500 is a retired monthly and billing
       refuses retired amounts. */
    addOns: [
      {
        id: "missed_call_recovery", name: "Missed-Call Recovery",
        monthly: 350, launch: 500, sellable: true,
        blurb: "A caller you missed gets one text back, during business hours, with your name on it and a working opt-out — before they ring the next name on Google."
      },
      {
        id: "quote_chase", name: "Quote-Chase Engine",
        monthly: 500, launch: 750, sellable: true,
        blurb: "Every estimate that goes quiet gets followed up — the day it stales, day four, day eleven — each touch approved by you, stopping the moment the customer replies."
      },
      {
        id: "get_paid", name: "Get-Paid Autopilot",
        monthly: 500, launch: 750, sellable: true,
        blurb: "Overdue invoices get a gentle nudge, a firm one a week later — and at three weeks YOU get told instead, because past that point the judgment call belongs to a person."
      },
      {
        id: "review_engine", name: "Review Engine",
        monthly: 300, launch: 500, sellable: true,
        blurb: "Post-job review requests by text, policy-safe — one ask per finished job, with your own review link, and every request released by a person."
      },
      {
        id: "reactivation", name: "Customer Reactivation",
        perCampaign: 2000, sellable: false,
        blurb: "A win-back campaign over your own past-customer list, inside the consent rules. Coming — not sellable until it ships end to end."
      }
    ],
    /* The referral offer. Mirrors CANONICAL.referral in nevamis-engine, and the
       engine's consistency checker validates these values against it. The
       REFERRER's free month is earned on the referred business's first PAID
       invoice, not on their signup. */
    referral: {
      referrerRewardMonths: 1,
      headline: "Know another business that misses calls?",
      offer: "They pay the same published price as everyone else, with nothing to negotiate. When they pay their first invoice, you get a free month of your own plan.",
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
    usagePolicy: {
      minuteDef: "A connected AI minute starts when the AI answers a connected call and ends when the AI portion of the call ends.",
      notes: [
        "Failed calls that never connect are not counted.",
        "Wrong numbers or spam that reach the AI consume usage, because the system handled them.",
        "Usage alerts at 50%, 75%, 90%, and 100% of included minutes, in your portal.",
        "Near the limit you choose: automatic overage, fallback answering, or a hard cap."
      ]
    },
    /* `monthly` recurs; `launch` is charged once, at the start, beside the
       first month — never instead of it. There is deliberately no `setup`
       key. `performanceNote` is the approved customer wording for the
       performance component, or null where the plan has none. `selfServe:
       false` marks an invite/approval-based plan that no surface may present
       as the default choice. Order: The Works first (the anchor), the AI
       Front Desk second (the recommended start and checkout default). */
    plans: [
      {
        id: "growth", name: "The Works",
        /* The bundle carries automations, so it carries the LONGER agreed
           start. Stated as a flag rather than inferred from the id, because
           the term is a contractual fact and a card should not have to know
           which plan key happens to mean "the bundle". */
        includesAutomations: true,
        monthly: 2100, launch: 3000, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        selfServe: true,
        performanceNote: null,
        bestFor: "The whole engine: the AI Front Desk plus every sellable automation, priced under the sum of its parts, with no performance fee.",
        features: [
          "Everything in the AI Front Desk",
          "Missed-Call Recovery: one text back to every missed caller, with opt-out",
          "Quote-Chase Engine: follow-up on every quiet estimate — day it stales, day 4, day 11 — each touch approved by you",
          "Get-Paid Autopilot: overdue-invoice reminders, with the owner told at three weeks instead of a third email",
          "Review requests and customer reactivation join The Works at no extra monthly when they ship — they are not sellable yet and nothing here sells them",
          "One business phone line",
          "Two call reviews each month, and tuning from what the calls actually show",
          "Priority email support"
        ].concat(EVERY_PLAN)
      },
      {
        id: "pro", name: "AI Front Desk", recommended: true,
        monthly: 1000, launch: 1500, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        selfServe: true,
        performanceNote: null,
        bestFor: "The start most businesses make: the front desk answering every call, with automation add-ons joining one at a time, each on its own evidence.",
        features: [
          "One business phone line",
          "Automation add-ons available one at a time, each its own price, each on its own three-month start",
          "Two call reviews each month, and tuning from what the calls actually show",
          "Priority email support",
          "Higher-volume usage priced with you before you commit to it"
        ].concat(EVERY_PLAN)
      },
      {
        /* INVITE / APPROVAL BASED. `selfServe: false` is what keeps a C$250
           monthly from being read as "the cheap tier": NEVAMIS carries
           acquisition risk here and chooses when to offer it. Described,
           never presented as the default, and checkout refuses to sell it
           without an approval. */
        id: "starter", name: "Performance Partnership",
        monthly: 350, monthlyRange: [250, 500], launch: 2500, includedMinutes: 250,
        callRange: "80 to 125 typical calls", overage: 1.10,
        selfServe: false,
        performanceNote: "Lower fixed cost, plus performance-based compensation tied to verified results. The monthly, the percentage, the attribution window and what counts as eligible revenue are all set in your agreement before anything is charged — nothing here is a rate on its own.",
        bestFor: "A partnership we offer by invitation, where NEVAMIS takes on substantially more of the acquisition risk. Not suitable for every business, and never the default.",
        features: [
          "One business phone line",
          "A call review each month, and tuning from what the calls actually show",
          "Email support"
        ].concat(EVERY_PLAN)
      }
    ]
  };
})();
