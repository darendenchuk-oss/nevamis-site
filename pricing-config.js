/* ============================================================
   NEVAMIS PRICING: the data every price on this site renders from.

   pricing.html, proposal.html, site.js and build-schema.mjs read
   window.NV_PRICING. No page types a price; a page that needs one
   renders it from here. Every figure mirrors nevamis-engine's
   canonical record, and the engine's consistency check fails when
   they differ.

   Developer notes (why each field is shaped the way it is, and the
   rules renderers must follow) are in docs/PRICING-CONFIG.md, which
   is not published. This file is served as it is written, so it
   carries data and short reading notes only.
   ============================================================ */
(function () {
  /* WHAT THE FRONT DESK INCLUDES, written once and spread into every plan,
     because the front-desk capability does not differ by plan. Every line is
     something the system does today, end to end, for a paying client.
     scripts/check-consistency.js guard 7k refuses the promises two earlier
     lines made; docs/PRICING-CONFIG.md says why. */
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
       Mirrors the engine's checkout gate; neither side relies on the other. */
    sellable: true,
    /* Whether a plan price may be shown. Mirrors CANONICAL.pricing.publishedPricing
       in nevamis-engine; flip both together or the cross-repo check fails. */
    publishedPricing: true,
    /* The contract term, mirroring CANONICAL.pricing.terms. Every sentence
       about the term is derived from these numbers, never typed. */
    terms: {
      minimumMonths: 0,
      /* Branch on the value; never fall back to `|| 30`. */
      cancellationNoticeDays: 0,
      priceLockMonths: 12,
      note: "There is no minimum term. Every plan and every add-on, bought on its own or added later, is month to month from the first month: cancel any time from your own portal, service running to the end of the month you already paid for, and your price locked for 12 months from signing. The one-time Launch & Implementation fee, charged once beside your first month, is the only commitment."
    },
    /* Enterprise is quoted per client, so it is not a plans[] entry.
       `launchFrom` is a floor ("starting at"), never a price. */
    enterprise: {
      name: "Enterprise",
      launchFrom: 5000,
      note: "Multi-location, custom integrations, custom data pipelines and advanced deployments are quoted per client, from what a scan of the business finds. The recurring amount and any performance component are quoted per client."
    },
    /* The badge on the plan marked `recommended`. A recommendation, never a
       claim about what other businesses chose. */
    recommendedLabel: "RECOMMENDED",
    /* The add-on catalog. Every automation is its own sale. `soldAlone: true`
       means it may be bought with nothing beside it; `sellable: false` means it
       may be described as coming and never sold, with no Buy control. */
    addOns: [
      {
        id: "missed_call_recovery", name: "Missed-Call Recovery",
        monthly: 350, launch: 500, sellable: true, soldAlone: true,
        blurb: "A caller you missed gets one text back, during business hours, with your name on it and a working opt-out."
      },
      /* `partnership` is what this item costs on the Performance Partnership.
         Bought on its own, or beside any other plan, it is its own pair above. */
      {
        id: "quote_chase", name: "Quote-Chase Engine",
        monthly: 500, launch: 750, sellable: true, soldAlone: true,
        partnership: { launch: 0, monthly: 0, attributableTo: "a quote Nevamis recovered" },
        blurb: "Every estimate that goes quiet gets followed up: the day it stales, day four, day eleven, each touch approved by you."
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
      /* Lead Generation is offered by invitation on the Performance Partnership
         only, so it has no standalone pair. `sellable` follows the engine's
         capability record for it, and the site may say less than the engine,
         never more. */
      {
        id: "lead_generation", name: "Lead Generation",
        monthly: 0, launch: 0, sellable: false, soldAlone: false,
        partnership: { launch: 0, monthly: 0, attributableTo: "a business Nevamis found" },
        blurb: "Businesses that fit what you do, found for you, with the page each one came from and what came of it. Offered by invitation, under your own agreement, and not yet sellable from a page."
      },
      /* Listed as coming. It carries no price and is never sold. */
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
    /* What an item costs on the Performance Partnership, derived as the
       engine's partnershipTerms() derives it: an add-on with no `partnership`
       block is charged its own pair there. Null for an id the catalog does
       not have, rather than a plausible-looking zero. */
    partnershipTerms: function (id) {
      var a = (this.addOns || []).filter(function (x) { return x.id === id; })[0];
      if (!a) return null;
      if (a.partnership) {
        return { launch: a.partnership.launch, monthly: a.partnership.monthly,
                 attributableTo: a.partnership.attributableTo };
      }
      return { launch: a.launch || 0, monthly: a.monthly || 0, attributableTo: null };
    },
    /* A plan's two figures as the one approved sentence, in plain text (a
       page that writes it into HTML escapes it), so a plan whose figures are
       a band cannot be printed as a flat price on one surface and a band on
       another: with `launchRange` the fee reads "From", and with
       `monthlyRange` the monthly reads as the default inside its published
       band. It is built from launchPart() and monthlyBand() below, and a page
       that sets the fee and the monthly on separate lines (proposal.html)
       uses those two parts instead of typing its own. */
    startLine: function (pl) {
      return this.launchPart(pl) + ", then " + this.money(pl.monthly) + " a month"
        + this.monthlyBand(pl) + ".";
    },
    /* The fee half of startLine(): "Launch & Implementation to start" after
       the `launch` figure, with "From" in front when the plan has
       `launchRange`. */
    launchPart: function (pl) {
      return (Array.isArray(pl.launchRange) ? "From " : "") + this.money(pl.launch)
        + " Launch & Implementation to start";
    },
    /* What follows the monthly figure of a plan with `monthlyRange`: that it
       is the default inside the band, and the band's two ends. Empty for a
       plan without one. */
    monthlyBand: function (pl) {
      return Array.isArray(pl.monthlyRange)
        ? " by default, inside a monthly band of " + this.money(pl.monthlyRange[0])
          + " to " + this.money(pl.monthlyRange[1])
        : "";
    },
    money: function (n) { return "C$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); },
    /* The lines every plan's `features` carries, in the first plan's order,
       so the pricing page prints them once and each card prints only what
       differs. Computed, not read off EVERY_PLAN, because "One business phone
       line" is on every plan without being in it. */
    sharedFeatures: function () {
      var plans = this.plans || [];
      if (!plans.length) return [];
      return plans[0].features.filter(function (f) {
        return plans.every(function (p) { return (p.features || []).indexOf(f) >= 0; });
      });
    },
    /* Mirrors CANONICAL.referral in nevamis-engine, which validates it. The
       referrer's free month is earned on the referred business's first paid
       invoice, not on their signup. */
    referral: {
      referrerRewardMonths: 1,
      headline: "Refer another business.",
      offer: "When they pay their first invoice, you get a free month of your own plan, applied as a credit to your next bill.",
      trigger: "The free month is earned when the business you referred pays their first invoice, and it comes off your next bill.",
      howTo: "Clients get their own link in the portal. Send it yourself: we never email somebody just because you named them."
    },
    /* Inactive records, kept so a renderer reads `active: false`. */
    foundingClient: {
      active: false,
      spots: 0,
      offer: "",
      note: ""
    },
    annual: {
      active: false,
      monthsCharged: 10,
      offer: "",
      note: ""
    },
    /* What happens at the included-minutes limit, as the product does it:
       calls keep being answered and extra minutes bill at the plan's rate.
       The alert line says "after you pass", never "at": the engine checks
       usage once a day and sends only the highest threshold crossed. */
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
       first month and never instead of it. There is deliberately no `setup`
       key. `performanceNote` is the approved wording for a plan's
       performance component, or null. `launchRange` and `monthlyRange`,
       where a plan has them, are the bands its figures are agreed within,
       and `launch` and `monthly` are then the defaults inside them; state
       such a plan through startLine(), never as a flat pair. Order is
       display order: every renderer walks this array in order. */
    plans: [
      {
        /* By invitation. `selfServe: false`: never presented as the default,
           and checkout refuses it without an approval. */
        id: "starter", name: "Performance Partnership",
        monthly: 350, monthlyRange: [250, 500], launch: 2500, launchRange: [2500, 10000], includedMinutes: 250,
        callRange: "80 to 125 typical calls", overage: 1.10,
        selfServe: false,
        performanceNote: "Lower fixed cost. Lead Generation, offered by invitation, and the Quote-Chase Engine are each paid on it by an agreed share of collected revenue directly attributable to a business Nevamis found or a quote Nevamis recovered, subject to your agreement. Its Launch & Implementation fee and its monthly, the share, the attribution window and what counts as eligible revenue are all set in your agreement before anything is charged.",
        /* Names the items that can be added on this plan. The figures live on
           the add-ons above and the share in the executed agreement. */
        bestFor: "A partnership we offer by invitation, where Nevamis takes on substantially more of the acquisition risk. It is the plan that carries the growth stack: Lead Generation, the Quote-Chase Engine, Missed-Call Recovery, Get-Paid Autopilot and Review Engine are each a separate item you choose, and each one changes what the plan costs. Not suitable for every business, and never the default.",
        features: [
          "One business phone line",
          /* The agreed-share sentence lives once, in performanceNote. */
          "The growth stack, each item added on its own: Lead Generation (offered by invitation) and the Quote-Chase Engine, paid on this plan's agreed-share terms, and Missed-Call Recovery, Get-Paid Autopilot and Review Engine, each with its own listed Launch & Implementation fee and monthly. Search Rankings is coming and is not sold."
        ].concat(EVERY_PLAN)
      },
      {
        id: "growth", name: "The Works",
        /* The bundle: every sellable automation included, as a flag so no
           renderer has to know which key means "the bundle". */
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
