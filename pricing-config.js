/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   APPROVED 2026-08-06, MODEL CLARIFIED 2026-08-07,
   SIMPLIFIED TO ONE RECURRING PRICE 2026-08-09,
   PRICED AFTER A SCAN (morning) AND THEN THE
   OPERATE / GROW / PERFORMANCE PARTNERSHIP MODEL (evening) 2026-08-15.
   Do not duplicate these values in HTML — render from here.

   THE COMMERCIAL MODEL, IN ONE TABLE:

     Plan                     Launch & Implementation   Monthly      Performance
     Operate                  C$1,000 one-time          C$1,000      none
     Grow (recommended)       C$1,000 one-time          C$750        10% attributable collected revenue, 12 months
     Performance Partnership  C$2,000 one-time          C$250        15% attributable collected revenue, 12 months
       (invite / approval based — never the default, never self-serve)
     Enterprise               starting at C$5,000       custom       optional
       (quoted per client, from what a PULSE scan finds)

   THE ONE-TIME FEE IS BACK, AND IT HAS ONE NAME AND ONE MEANING.
   "Launch & Implementation" is a real one-time charge for the build:
   implementation, integrations, automation configuration, a PULSE baseline
   and go-live validation. It is charged once, at the start, BESIDE the first
   month — never instead of it. The approved sentence shape is
   "C$1,000 Launch & Implementation to start, then C$750 a month": the joins
   are "to start" and "then", never "plus", "+" or "and", because the additive
   framing is what made two right numbers read as one wrong bill in August.

   "Setup fee", "activation fee" and "onboarding fee" remain RETIRED
   VOCABULARY: they may be denied, never used as the name of this fee. And
   the launch fee itself must never be denied — "no implementation fee",
   "no launch charge", "one recurring monthly price" and "nothing charged to
   start" are all now FALSE and the guards refuse them.

   WHAT CHANGED AND WHY, because earlier versions of this header argued
   the opposite case and someone will find all of them:
     - 2026-07-31  setup fee waived — zero for everyone
     - 2026-08-06  setup fee returned; the build is real work on day one
     - 2026-08-07  renamed to mean month one; right numbers, wrong sentence
     - 2026-08-09  deleted. One recurring price, nothing beside it
     - 2026-08-15  (morning) prices unpublished: "priced after your scan"
     - 2026-08-15  (evening) the OPERATE / GROW / PERFORMANCE PARTNERSHIP
                   ladder, published, each with a one-time Launch &
                   Implementation fee. What is being bought changed under the
                   price: implementation, integrations, automation, a PULSE
                   baseline and revenue attribution, and a build that costs
                   real hours cannot honestly be priced at zero. The
                   scan-derived quote survives as the ENTERPRISE mechanism,
                   not as the default ladder.

   KEYS ARE STABLE AND NAMES MOVED. `pro` recurred at C$1,000 and Operate
   recurs at C$1,000; `starter` recurred at C$250 and Performance Partnership
   recurs at C$250; `growth` is the one true reprice (C$500 -> C$750), so
   C$500 is retired and the guards watch for it. Order is display order and
   the default: index 1 is Grow, the recommended plan.

   The `launch` key is the one-time fee. It is deliberately NOT called
   `setup`: nevamis-engine's checkPricing treats the PRESENCE of a `setup`
   figure as a defect, and the engine parser reads `launch` instead.
   ============================================================ */
(function () {
  /* WHAT EVERY PLAN INCLUDES, written once.

     One array, spread into all three plans, because the plans do not differ
     by capability and a per-plan copy of this list would let them look as
     though they did. The honest differences are the metered ones (included
     minutes, the price of a minute past them, review cadence) and, since
     2026-08-15, the commercial ones: the Launch & Implementation fee and the
     performance component. Those are the only per-plan entries below.

     Every line here is something the system does today, end to end, for a
     paying client. That is the bar, and it excluded several lines that were
     on this page until 2026-08-09: booking into a calendar (the agents are
     given end_call and no tenant calendar credential exists), any CRM, ads
     or automation connection (the operations page lists them as NOT BUILT),
     multi-location, multi-department, call routing and more than one number
     per tenant, transcripts in the portal, customer-facing confirmation
     texts, and outbound of any kind. Selling those was selling a roadmap as
     an entitlement. What replaced them is not smaller, it is just true. */
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
    "Invoices, plan changes and cancel-at-period-end you can do yourself, without asking us"
  ];

  window.NV_PRICING = {
    approved: true,
    currency: "CAD",
    lastUpdated: "2026-08-15",
    taxNote: "Prices in Canadian dollars, plus applicable GST/HST.",
    commercialModel: "V4-launch-and-implementation",
    /* Whether a visitor may complete a purchase without talking to anyone.

       TRUE since 2026-08-16, on the owner's explicit authorization, which
       supersedes the rehearsal requirement that had held it FALSE since
       2026-08-10. The prior condition — the whole new-customer path
       rehearsed end to end at the new amounts before anyone pays — was not
       met; the owner chose to open anyway, and the first paying customer
       runs the sequence with the ops queue watching. The engine's checkout
       gate opened the same day with the same authorization recorded on it;
       neither side relies on the other, which is still the point. */
    sellable: true,
    /* WHETHER A PLAN PRICE MAY BE SHOWN TO A STRANGER.

       TRUE again since the 2026-08-15 EVENING directive. It was false for
       roughly twelve hours that same day ("priced after a scan", the
       morning's decision); the evening directive replaced the default ladder
       with the OPERATE / GROW / PERFORMANCE PARTNERSHIP model and made those
       prices publishable. Scan-derived per-client quoting survives on the
       `enterprise` record below, where it belongs.

       Mirrors CANONICAL.pricing.publishedPricing in nevamis-engine, and the
       engine's checkPricing enforces it across this repo. Flip both together
       or the cross-repo check fails, which is the point of it. */
    publishedPricing: true,
    /* ENTERPRISE, deliberately NOT a plans[] entry: it has no universal
       monthly price, and a record shaped like a priced plan gets rendered as
       one by the laziest reader (the Pay As You Go lesson). This is where the
       2026-08-15 morning's "priced after your scan" model survives: an
       Enterprise quote is built per client, from what a PULSE scan finds.
       `launchFrom` is a floor ("starting at"), never a price. */
    enterprise: {
      name: "Enterprise",
      launchFrom: 5000,
      note: "Multi-location, custom integrations, custom data pipelines and advanced deployments are quoted per client, from what a scan of the business finds. Launch & Implementation starting at C$5,000 or custom quoted; the recurring amount and any performance component are quoted per client."
    },
    /* The badge on the recommended plan. "RECOMMENDED" is an opinion, which
       is true and defensible. It moved to Grow on 2026-08-15: Grow is the
       plan the wider product story actually sells, and the checkout default
       reads the same record. Versioned here so the places that render it
       cannot drift apart. */
    recommendedLabel: "RECOMMENDED",
    /* The referral offer. Mirrors CANONICAL.referral in nevamis-engine, and the
       engine's consistency checker validates these values against it — so a
       number changed here and not there is caught rather than becoming the thing
       Nevamis is publicly held to.

       DECISION OF 2026-08-09, unchanged by the 2026-08-15 model: the referred
       business gets the published offer, and nothing else. The REFERRER's free
       month is an obligation to an existing client rather than an inducement to
       a new one. It is earned on the referred business's first PAID invoice,
       not on their signup. That is stated on the page because a referral offer
       that hides its trigger is the kind of small print this company has spent
       the whole build removing. */
    referral: {
      referrerRewardMonths: 1,
      headline: "Know another business that misses calls?",
      offer: "They pay the same published price as everyone else, with nothing to negotiate. When they pay their first invoice, you get a free month of your own plan.",
      trigger: "The free month is earned when the business you referred pays their first invoice, and it comes off your next bill.",
      howTo: "Clients get their own link in the portal. Send it yourself: we never email somebody just because you named them."
    },
    /* Retired 2026-07-31. The offer was a founding-client waiver of the old
       zero-era setup fee. It stays retired under the 2026-08-15 model: the
       Launch & Implementation fee is priced work, and a business that opens
       by discounting its own work has told the buyer what it thinks that work
       is worth. A new founding offer is a commercial decision for the owner,
       not something to fill this slot with. */
    foundingClient: {
      active: false,
      spots: 0,
      offer: "",
      note: ""
    },
    /* Suspended 2026-08-06. The mechanism is kept so it is not re-derived from
       memory later, but the approved model publishes monthly prices and a
       one-time Launch & Implementation fee and approves no annual figure.
       Publishing an annual price would be inventing a number nobody signed
       off, which is worse than publishing a wrong one: there is no correct
       value to check it against. */
    annual: {
      active: false,
      monthsCharged: 10,
      offer: "",
      note: ""
    },
    /* Pay As You Go was retired 2026-08-06 and REMOVED 2026-08-07.

       It was kept for a day as an inert record on the theory that `active:false`
       meant no surface could offer it. That was true of every surface but one:
       proposal.html read the record with no `active` check at all, so
       ?plan=pay-as-you-go still built a prospect-facing proposal quoting
       C$49/month. A dormant record is only as dormant as the laziest reader of
       it. Removed rather than re-flagged. The pilot record followed it out on
       2026-08-09 under the same precedent.

       If a retired price ever needs to be RECOGNISED again (an old link, an old
       invoice), that belongs in a retired-price list the guards read, not in a
       record shaped like an offer. */
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
       key: the engine's checkPricing refuses the field name, because `setup`
       was caught meaning two things at once in August and the word is
       retired. `performanceNote` is the approved customer wording for the
       performance component, or null where the plan has none — it is never
       "a percent of all revenue" and never profit-based. It also states the
       TERM, added 2026-08-17: the engine's canonical has carried
       performanceFee.feeDurationMonths since the commercial model landed and
       no surface anywhere read it, so a buyer could learn the rate on this
       page and had no way to learn how long they pay it. A rate without a
       term is not a price. `selfServe: false`
       marks an invite/approval-based plan that no surface may present as the
       default choice. */
    plans: [
      {
        id: "pro", name: "Operate",
        monthly: 1000, launch: 1000, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        selfServe: true,
        performanceNote: null,
        bestFor: "Businesses that want NEVAMIS to run the operational side: the front desk, lead capture, intake and reporting, with no performance fee and no revenue share.",
        features: [
          "One business phone line",
          "Two call reviews each month, and tuning from what the calls actually show",
          "Priority email support",
          "Higher-volume usage priced with you before you commit to it"
        ].concat(EVERY_PLAN)
      },
      {
        id: "growth", name: "Grow", recommended: true,
        monthly: 750, launch: 1000, includedMinutes: 600,
        callRange: "200 to 300 typical calls", overage: 0.90,
        selfServe: true,
        performanceNote: "Plus 10% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities, charged for 12 months from that customer's first attributable collected revenue, subject to your agreement.",
        bestFor: "Businesses where NEVAMIS actively helps create and recover revenue: capture, follow-up, recovery and attribution, not just answering.",
        features: [
          "One business phone line",
          "Two call reviews each month, and tuning from what the calls actually show",
          "Priority email support"
        ].concat(EVERY_PLAN)
      },
      {
        /* INVITE / APPROVAL BASED. `selfServe: false` is what keeps a C$250
           monthly from being read as "the cheap tier": NEVAMIS carries
           acquisition risk here and chooses when to offer it. Described,
           never presented as the default, and checkout refuses to sell it
           without an approval. */
        id: "starter", name: "Performance Partnership",
        monthly: 250, launch: 2000, includedMinutes: 250,
        callRange: "80 to 125 typical calls", overage: 1.10,
        selfServe: false,
        performanceNote: "Plus 15% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities, charged for 12 months from that customer's first attributable collected revenue, subject to your agreement.",
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
