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
  /* The line that makes a Front Desk size a size of the AI Front Desk, on
     each of the three cards. */
  var SAME_DESK = "Automation add-ons available one at a time, each its own price and its own sale, on their own or beside this plan";

  window.NV_PRICING = {
    approved: true,
    currency: "CAD",
    /* Stamped again on the day this model is published (docs/PRICING-CONFIG.md,
       "Publishing v7"), together with freeMonth.effective. */
    lastUpdated: "2026-10-03",
    taxNote: "Prices in Canadian dollars, plus applicable GST/HST.",
    commercialModel: "V7-three-front-desk-sizes",
    /* Whether a visitor may complete a purchase without talking to anyone.
       Mirrors the engine's checkout gate; neither side relies on the other. */
    sellable: true,
    /* Whether a plan price may be shown. Mirrors CANONICAL.pricing.publishedPricing
       in nevamis-engine; flip both together or the cross-repo check fails. */
    publishedPricing: true,
    /* The contract term, mirroring CANONICAL.pricing.terms. Every sentence
       about the term is derived from these numbers, never typed. The note
       says nothing about a first month free: that is said only where
       free-month.js has confirmed a place is open (see foundingClient). */
    terms: {
      minimumMonths: 0,
      /* Branch on the value; never fall back to `|| 30`. */
      cancellationNoticeDays: 0,
      priceLockMonths: 12,
      note: "There is no minimum term. Every plan and every add-on, bought on its own or added later, is month to month from the first month: cancel any time from your own portal, service running to the end of the month you already paid for, and your price locked for 12 months from signing."
    },
    /* THE FREE MONTH'S TERMS, mirroring CANONICAL.pricing.freeMonth field by
       field (the engine's consistency check compares them). Terms only: no
       sentence here is rendered. The offer is given to the first
       `firstClients` businesses, on a booked call, and its words live in
       foundingClient below, shown only by free-month.js. */
    freeMonth: {
      months: 1,
      cardRequired: true,
      autoConverts: true,
      reminderDaysBefore: [7, 1],
      overageIncluded: true,
      newClientsOnly: true,
      firstClients: 10,
      grantedVia: "booked_call",
      /* The engine's canonical freeMonth.effective, kept equal to it; the
         publish step re-stamps both to the publish date together. */
      effective: "2026-10-02"
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
    /* The heading and the one sentence over the three Front Desk sizes. */
    frontDeskSizes: {
      heading: "The AI Front Desk, in three sizes",
      note: "Same receptionist, answers 24/7. The three sizes differ only in the minutes included each month and the rate for each minute past them."
    },
    /* The add-on catalog. Every automation is its own sale. `soldAlone: true`
       means it may be bought with nothing beside it; `sellable: false` means it
       may be described as coming and never sold, with no Buy control.
       `launch` is 0 on every module, and `freeMonths` mirrors canonical.
       ORDER IS DISPLAY ORDER, as it is for `plans`: pricing.html renders
       #addOnList by walking this array (PRICING-14, 2026-10-03), so the doors
       come first, Lead Generation then the Quote-Chase Engine (owner
       decision), then the modules sold alone, then what is coming. Every
       other reader finds an item by its id. */
    addOns: [
      /* Lead Generation is offered by invitation on the Performance Partnership
         only, so it has no standalone pair. `sellable` follows the engine's
         capability record for it, and the site may say less than the engine,
         never more. */
      {
        id: "lead_generation", name: "Lead Generation",
        monthly: 0, launch: 0, freeMonths: 0, sellable: false, soldAlone: false,
        partnership: { launch: 0, monthly: 0, attributableTo: "a business Nevamis found" },
        blurb: "Businesses that fit what you do, found for you, with the page each one came from and what came of it. You decide every row, and nobody on the list is contacted by us. Offered by invitation, under your own agreement, and not yet sellable from a page."
      },
      /* `partnership` is what this item costs on the Performance Partnership.
         Bought on its own, or beside any other plan, it is its own figure. */
      {
        id: "quote_chase", name: "Quote-Chase Engine",
        monthly: 500, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
        partnership: { launch: 0, monthly: 0, attributableTo: "a quote Nevamis recovered" },
        blurb: "Every estimate that goes quiet gets followed up: the day it stales, day four, day eleven, each touch approved by you."
      },
      {
        id: "missed_call_recovery", name: "Missed-Call Recovery",
        monthly: 350, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
        blurb: "A caller you missed gets one text back, between 8 a.m. and 8 p.m. your time, every day, with your name on it and a working opt-out."
      },
      {
        id: "get_paid", name: "Get-Paid Autopilot",
        monthly: 500, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
        blurb: "Overdue invoices get a gentle nudge, a firm one a week later, and at three weeks you get told instead, because past that point the judgment call belongs to a person."
      },
      {
        id: "review_engine", name: "Review Engine",
        monthly: 300, launch: 0, freeMonths: 1, sellable: true, soldAlone: true,
        blurb: "Post-job review requests by text, policy-safe: one ask per finished job, with your own review link, and every request released by a person."
      },
      /* Listed as coming. It carries no price and is never sold. */
      {
        id: "seo_rankings", name: "Search Rankings",
        monthly: 0, launch: 0, freeMonths: 0, sellable: false, soldAlone: false,
        blurb: "Better search rankings for the work you want more of. Not built yet."
      },
      {
        id: "reactivation", name: "Customer Reactivation",
        perCampaign: 2000, launch: 0, freeMonths: 0, sellable: false, soldAlone: false,
        blurb: "A win-back campaign over your own past-customer list, inside the consent rules. Not sellable until it ships end to end."
      }
    ],
    /* What an item costs on the Performance Partnership, derived as the
       engine's partnershipTerms() derives it: an add-on with no `partnership`
       block is charged its own figures there. Null for an id the catalog does
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
    /* A plan's or an add-on's figures as the one approved sentence, in plain
       text (a page that writes it into HTML escapes it):
         a Launch & Implementation fee:  "<fee> Launch & Implementation to
                                          start, then <monthly> a month,
                                          <performanceNote>."
         no fee:                         "<monthly> a month."
       It is what Buy now charges, so it never carries a first month free:
       that offer is made on a booked call, and the page says it only where
       free-month.js has confirmed a place is open. It is built from
       launchPart() and monthlyBand() below, and a page that sets the fee and
       the monthly on separate lines (proposal.html) uses those parts. */
    startLine: function (pl) {
      var lp = this.launchPart(pl);
      return (lp ? lp + ", then " : "") + this.money(pl.monthly) + " a month"
        + this.monthlyBand(pl) + (pl.performanceNote ? ", " + pl.performanceNote : "") + ".";
    },
    /* The fee half of startLine(): "<fee> Launch & Implementation to start",
       with "From" in front when the plan has `launchRange`. Empty for an item
       whose fee is 0: a zero fee is no figure, and it is never printed. */
    launchPart: function (pl) {
      if (!(pl.launch > 0)) return "";
      return (Array.isArray(pl.launchRange) ? "From " : "") + this.money(pl.launch)
        + " Launch & Implementation to start";
    },
    /* What follows the monthly figure of a plan with `monthlyRange`: that it
       is the default inside the band, and the band's two ends. Empty for a
       plan without one, which is every plan since the Partnership's figures
       were fixed. */
    monthlyBand: function (pl) {
      return Array.isArray(pl.monthlyRange)
        ? " by default, inside a monthly band of " + this.money(pl.monthlyRange[0])
          + " to " + this.money(pl.monthlyRange[1])
        : "";
    },
    /* The lowest and highest monthly a plan may be agreed at: its band where
       it has `monthlyRange`, otherwise its one published monthly at both
       ends. proposal.html honours an agreed ?quote= only inside these. */
    monthlyBounds: function (pl) {
      return Array.isArray(pl.monthlyRange) ? [pl.monthlyRange[0], pl.monthlyRange[1]] : [pl.monthly, pl.monthly];
    },
    money: function (n) { return "C$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); },
    /* The one plan that carries a Launch & Implementation fee, in one line
       for the pricing page's terms band, so the band can say where the fee
       is without typing it. Empty when no plan carries one. */
    partnerNote: function () {
      var self = this;
      var pl = (this.plans || []).filter(function (p) { return p.launch > 0; });
      if (pl.length !== 1) return pl.map(function (p) { return p.name + ": " + self.launchPart(p) + "."; }).join(" ");
      /* "Published plan", and Enterprise's floor said beside it: Enterprise
         is not a plans[] entry, but the same page quotes its Launch &
         Implementation from a floor, so "the one plan" alone reads as a
         contradiction. */
      var ent = this.enterprise && this.enterprise.launchFrom
        ? " " + this.enterprise.name + " is quoted per client, its Launch & Implementation starting at " + this.money(this.enterprise.launchFrom) + "."
        : "";
      return "The " + pl[0].name + " is the one published plan with a Launch & Implementation fee: " + this.launchPart(pl[0]) + "."
        + (pl[0].inviteNote ? " " + pl[0].inviteNote : "") + ent;
    },
    /* The AI Front Desk and every plan that is a size of it (`tierOf`),
       smallest first, as the engine's frontDeskTiers() orders them. Every
       renderer that shows the sizes side by side reads this, so a size added
       here lands beside the others without a page deciding where. */
    frontDeskTiers: function () {
      var plans = this.plans || [];
      var anchors = plans.map(function (p) { return p.tierOf; }).filter(Boolean);
      return plans.filter(function (p) { return anchors.indexOf(p.id) >= 0 || anchors.indexOf(p.tierOf) >= 0; })
        .slice().sort(function (a, b) { return (a.includedMinutes - b.includedMinutes) || (a.monthly - b.monthly); });
    },
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
    /* THE FIRST MONTH FREE FOR THE FIRST CLIENTS, the one place its words
       live. `active` is the owner's switch and `spots` must equal
       freeMonth.firstClients. free-month.js shows them only inside an
       element marked data-nv-free-month, which ships hidden, and only after
       app.nevamis.ca/api/free-month answers that a place is open: when the
       places are gone, the engine says so and nothing on the site claims
       one. No other renderer, build step or machine-read file prints them. */
    foundingClient: {
      active: true,
      spots: 10,
      offer: "First month free for our first 10 clients, given on a booked call.",
      note: "We take your card when you start and charge nothing until your second month begins; cancel in your portal before then and you pay nothing. We remind you a week before and a day before your first charge. Buy now starts your plan and charges your first month."
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
       usage once a day and sends only the highest threshold crossed. The
       last note is the email at the limit: it names the rate, and the next
       Front Desk size where there is one, and it never changes the plan. */
    usagePolicy: {
      minuteDef: "A connected AI minute starts when the AI answers a connected call and ends when the AI portion of the call ends.",
      notes: [
        "Failed calls that never connect are not counted.",
        "Wrong numbers or spam that reach the AI consume usage, because the system handled them.",
        "A text or email alert after you pass 50%, 75%, 90% or 100% of your included minutes, with your running total on your portal's billing page.",
        "Past your included minutes, calls keep being answered and each extra minute is billed at your plan's per-minute rate, shown on its card above.",
        "Once you pass all of your included minutes, the email alert names your plan's rate for each extra minute and, on a Front Desk size with a larger one above it, what the next size includes and costs. Your plan never changes unless you change it."
      ]
    },
    /* `monthly` recurs; `launch` is the one-time Launch & Implementation fee,
       charged once at the start, beside the first month and never instead of
       it, and it is 0 on every plan but the Performance Partnership. There
       is deliberately no `setup` key, and no band since the Partnership's
       figures were fixed. `freeMonths` mirrors canonical; it is never
       printed beside a price (see foundingClient). `performanceNote` is the
       approved clause for a plan's performance component, joined into
       startLine() after the monthly, or null. `inviteNote` is what an
       invitation-only plan says about being one. `tierOf` marks a smaller
       size of the AI Front Desk: the same receptionist, with fewer minutes.
       Keep the numeric fields directly after `id` and `name`: the engine's
       cross-repo parser reads the 400 characters after each `id: "..."`.
       Order is display order: every renderer walks this array in order, and
       the pricing page sets the sizes side by side, smallest first. */
    plans: [
      {
        /* By invitation. `selfServe: false`: never presented as the default,
           and checkout refuses it without an approval. */
        id: "starter", name: "Performance Partnership",
        monthly: 350, launch: 5000, freeMonths: 0, includedMinutes: 250,
        callRange: "80 to 125 typical calls", overage: 1.10,
        selfServe: false,
        performanceNote: "plus an agreed share of collected revenue directly attributable to a business Nevamis found or a quote Nevamis recovered, set in your agreement before anything is charged",
        inviteNote: "Offered by invitation and approval.",
        /* Names the items that can be added on this plan. The figures live on
           the add-ons above and the share in the executed agreement. */
        bestFor: "A partnership we offer by invitation, where Nevamis takes on substantially more of the acquisition risk. It is the plan that carries the growth stack: Lead Generation, the Quote-Chase Engine, Missed-Call Recovery, Get-Paid Autopilot and Review Engine are each a separate item you choose. Its Launch & Implementation fee and its monthly are fixed; what the items you choose change is the agreed share and the monthly of each item you add. Not suitable for every business, and never the default.",
        features: [
          "One business phone line",
          /* The agreed-share sentence lives once, in performanceNote. */
          "The growth stack, each item added on its own: Lead Generation (offered by invitation) and the Quote-Chase Engine, paid on this plan's agreed-share terms, and Missed-Call Recovery, Get-Paid Autopilot and Review Engine, each at its own listed monthly. Search Rankings is coming and is not sold."
        ].concat(EVERY_PLAN)
      },
      {
        id: "growth", name: "The Works",
        monthly: 2100, launch: 0, freeMonths: 1, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        /* The bundle: every sellable automation included, as a flag so no
           renderer has to know which key means "the bundle". */
        includesAutomations: true,
        selfServe: true,
        performanceNote: null,
        bestFor: "The whole engine: the AI Front Desk plus every sellable automation, priced under the sum of its parts.",
        features: [
          "Everything in the AI Front Desk",
          "Missed-Call Recovery: one text back to a caller you missed, between 8 a.m. and 8 p.m. your time, every day, with your name on it and a working opt-out",
          "Quote-Chase Engine: follow-up on every quiet estimate: day it stales, day 4, day 11, each touch approved by you",
          "Get-Paid Autopilot: overdue-invoice reminders, with the owner told at three weeks instead of a third email",
          "Review Engine: post-job review requests by text, one ask per finished job, with every request released by a person",
          "One business phone line"
        ].concat(EVERY_PLAN)
      },
      {
        /* A smaller size of the AI Front Desk. No callRange: a call estimate
           for a size is the owner's to approve, never a guess here. */
        id: "front-desk-starter", name: "Front Desk Starter",
        monthly: 250, launch: 0, freeMonths: 1, includedMinutes: 200,
        overage: 1.10, tierOf: "pro",
        selfServe: true,
        performanceNote: null,
        bestFor: "A lighter phone: the same receptionist as the AI Front Desk, answering 24/7, sized for fewer calls.",
        features: [
          "One business phone line",
          SAME_DESK
        ].concat(EVERY_PLAN)
      },
      {
        id: "front-desk-plus", name: "Front Desk Plus",
        monthly: 500, launch: 0, freeMonths: 1, includedMinutes: 550,
        overage: 0.95, tierOf: "pro",
        selfServe: true,
        performanceNote: null,
        bestFor: "A busier phone that does not yet need the full allowance: the same receptionist, answering 24/7, with more minutes than Front Desk Starter.",
        features: [
          "One business phone line",
          SAME_DESK
        ].concat(EVERY_PLAN)
      },
      {
        id: "pro", name: "AI Front Desk", recommended: true,
        monthly: 1000, launch: 0, freeMonths: 1, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        selfServe: true,
        performanceNote: null,
        bestFor: "The front desk on its own: it answers every call, and each automation is its own sale you can add whenever it earns its place.",
        features: [
          "One business phone line",
          SAME_DESK
        ].concat(EVERY_PLAN)
      }
    ]
  };
})();
