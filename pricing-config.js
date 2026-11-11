/* ============================================================
   NEVAMIS PRICING: the data every price on this site renders from.

   index.html, book.html, free-month.js and the build scripts read
   window.NV_PRICING. No page types a price; a page that needs one
   renders it from here. It carries the three Front Desk sizes, the
   free-month terms and the usage notes. Every figure mirrors
   nevamis-engine's canonical record, and the engine's consistency
   check fails when they differ.

   Developer notes (why each field is shaped the way it is, and the
   rules renderers must follow) are in docs/PRICING-CONFIG.md, which
   is not published. This file is served as it is written, so it
   carries data and short reading notes only.
   ============================================================ */
(function () {
  /* WHAT THE FRONT DESK INCLUDES, written once and spread into every size,
     because the front-desk capability does not differ by size. Every line is
     something the system does today, end to end, for a paying client.
     scripts/check-consistency.js guard 7k refuses the promises two earlier
     lines made; docs/PRICING-CONFIG.md says why. */
  var EVERY_PLAN = [
    "Answers your line around the clock, configured from your own hours, services, service area, prices and FAQs",
    "Asks the caller about the job, where it is and how urgent it is",
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
      note: "There is no minimum term. Every plan is month to month from the first month: cancel any time from your own portal, service running to the end of the month you already paid for, and your price locked for 12 months from signing."
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
    /* The badge on the size marked `recommended`. A recommendation, never a
       claim about what other businesses chose. */
    recommendedLabel: "RECOMMENDED",
    /* The heading and the one sentence over the three Front Desk sizes. */
    frontDeskSizes: {
      heading: "The AI Front Desk, in three sizes",
      note: "Same receptionist, answers 24/7. The three sizes differ only in the minutes included each month and the rate for each minute past them."
    },
    /* A size's figures as the one approved sentence, in plain text (a page
       that writes it into HTML escapes it): "<monthly> a month." It is what
       Buy now charges, so it never carries a first month free: that offer is
       made on a booked call, and the page says it only where free-month.js
       has confirmed a place is open. */
    startLine: function (pl) {
      return this.money(pl.monthly) + " a month.";
    },
    money: function (n) { return "C$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); },
    /* The AI Front Desk and every size of it (`tierOf`), smallest first, as
       the engine's frontDeskTiers() orders them. Every renderer that shows
       the sizes side by side reads this, so a size added here lands beside
       the others without a page deciding where. */
    frontDeskTiers: function () {
      var plans = this.plans || [];
      var anchors = plans.map(function (p) { return p.tierOf; }).filter(Boolean);
      return plans.filter(function (p) { return anchors.indexOf(p.id) >= 0 || anchors.indexOf(p.tierOf) >= 0; })
        .slice().sort(function (a, b) { return (a.includedMinutes - b.includedMinutes) || (a.monthly - b.monthly); });
    },
    /* The lines every size's `features` carries, in the first size's order,
       so a page can print them once and each card only what differs.
       Computed, not read off EVERY_PLAN, because "One business phone line" is
       on every size without being in it. */
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
    /* THE FIRST MONTH FREE FOR THE FIRST BUSINESSES, the one place its words
       live. `active` is the owner's switch and `spots` must equal
       freeMonth.firstClients. free-month.js shows them only inside an
       element marked data-nv-free-month, which ships hidden, and only after
       app.nevamis.ca/api/free-month answers that a place is open: when the
       places are gone, the engine says so and nothing on the site claims
       one. No other renderer, build step or machine-read file prints them.
       The cap is counted in businesses (owner decision #74, 2026-10-08):
       "our first 10 clients" was heard as clients Nevamis already has, and
       the engine's canonical firstClientsPhrase() now says businesses too. */
    foundingClient: {
      active: true,
      spots: 10,
      offer: "First month free for our first 10 businesses, given on a booked call.",
      note: "We take your card when you start and charge nothing until your second month begins; cancel in your portal before then and you pay nothing. We remind you a week before and a day before your first charge.",
      /* What the held space says when the offer is not shown: a closed
         answer, an error, or no answer within the wait. It is a line about
         the terms, true whatever the answer, so the space the card would
         have taken stays and nothing under it moves (launch audit PERF-5).
         It is never the offer, and scripts/check-consistency.js holds it to
         terms.minimumMonths and terms.cancellationNoticeDays. */
      closedLine: "No minimum term. Cancel any time in your portal."
    },
    annual: {
      active: false,
      monthsCharged: 10,
      offer: "",
      note: ""
    },
    /* What happens at the included-minutes limit, as the product does it:
       calls keep being answered and extra minutes bill at the size's rate.
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
    /* The three Front Desk sizes. `monthly` recurs. `launch` is the one-time
       fee field the engine compares, 0 on every size; there is deliberately
       no `setup` key. `freeMonths` mirrors canonical; it is never printed
       beside a price (see foundingClient). `tierOf` marks a smaller size of
       the AI Front Desk: the same receptionist, with fewer minutes.
       Keep the numeric fields directly after `id` and `name`: the engine's
       cross-repo parser reads the 400 characters after each `id: "..."`.
       Order is display order: every renderer walks this array in order, and
       the sizes are set side by side, smallest first. */
    plans: [
      {
        /* No callRange: a call estimate for a size is the owner's to
           approve, never a guess here. */
        id: "front-desk-starter", name: "Front Desk Starter",
        monthly: 250, launch: 0, freeMonths: 1, includedMinutes: 200,
        overage: 1.10, tierOf: "pro",
        selfServe: true,
        bestFor: "A lighter phone: the same receptionist as the AI Front Desk, answering 24/7, sized for fewer calls.",
        features: [
          "One business phone line"
        ].concat(EVERY_PLAN)
      },
      {
        id: "front-desk-plus", name: "Front Desk Plus",
        monthly: 500, launch: 0, freeMonths: 1, includedMinutes: 550,
        overage: 0.95, tierOf: "pro",
        selfServe: true,
        bestFor: "A busier phone that does not yet need the full allowance: the same receptionist, answering 24/7, with more minutes than Front Desk Starter.",
        features: [
          "One business phone line"
        ].concat(EVERY_PLAN)
      },
      {
        id: "pro", name: "AI Front Desk", recommended: true,
        monthly: 1000, launch: 0, freeMonths: 1, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        selfServe: true,
        bestFor: "The largest size: the same receptionist, answering 24/7, with the most minutes.",
        features: [
          "One business phone line"
        ].concat(EVERY_PLAN)
      }
    ]
  };
})();
