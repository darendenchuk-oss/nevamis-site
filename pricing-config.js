/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   APPROVED 2026-08-06, MODEL CLARIFIED 2026-08-07,
   SIMPLIFIED TO ONE RECURRING PRICE 2026-08-09.
   Do not duplicate these values in HTML — render from here.

   THE COMMERCIAL MODEL, IN ONE TABLE:

     Plan     price
     Core     C$250/month
     Growth   C$500/month
     Pro      C$1,000/month

   ONE PRICE PER PLAN, CHARGED THE DAY THEY SUBSCRIBE AND EVERY MONTH
   AFTER. There is no setup fee, activation fee, onboarding fee,
   implementation fee or launch charge. There is no pilot and no trial,
   paid or free. Month to month, cancel any time.

   The `setup` key is GONE, not zeroed. A zero would still have been a
   second number for a card to render and a buyer to wonder about, and
   nevamis-engine's checkPricing now treats the PRESENCE of a setup figure
   as the defect rather than checking its size — so a surface that keeps
   the field fails the cross-repo guard on purpose. The `pilot` record was
   removed on the same principle on 2026-08-09; see below.

   WHAT CHANGED AND WHY, because earlier versions of this header argued
   the opposite case and someone will find all of them:
     - 2026-07-31  setup fee waived — zero for everyone
     - 2026-08-06  setup fee returned; the build is real work on day one
                   and pricing it at zero taught the buyer it was worth zero
     - 2026-08-07  renamed to make it mean month one, because "C$250/month"
                   above "One-time setup: C$250" reads as C$500 on day one.
                   Right numbers, wrong sentence — the worst combination,
                   because nothing that compares numbers can see it
     - 2026-08-09  deleted. The rename fixed the record and left the OFFER
                   ambiguous: a buyer still had to hold two numbers and a
                   rule joining them. One number cannot be misread into two

     - Pro is C$1,000/month. It was C$1,000 then C$850 — the only split in
       the ladder, and it existed to price the build separately. With the
       build no longer priced separately, the second number had nothing
       left to mean. C$850 is retired, and listed as retired in the engine
       so a stale quote of it is visible to the guards.
     - THE PILOT IS RETIRED, and its record is DELETED rather than flagged
       inactive (2026-08-09). With no setup fee, C$250/month cancel-anytime
       beats C$150 for seven days on every axis a buyer cares about:
       cheaper per day, longer, and cancellable. A dominated option beside
       the real one is not a cheaper way in, it is a contradiction of the
       offer.

       Deleted rather than kept dormant for the reason written into the Pay
       As You Go note below: a dormant record is only as dormant as its
       laziest reader, and proposal.html once quoted C$49/month out of one.
       The pilot record had FIVE readers (pricing.html's banner, its card
       renderer, its JSON-LD, proposal.html's plan line and its pilot box),
       none of which checked a flag, because there was no flag to check.
       Removing the record makes every one of them a reference error at
       build time instead of a retired offer on a prospect's screen.

       If a retired offer ever needs to be RECOGNISED again (an old link,
       an old invoice, a settlement obligation already created), that
       belongs in the engine's retired-offer list that the guards read, not
       in a record on this file shaped like something for sale.
     - Prices are round. C$249 is a retail signal, and this is a
       managed professional service; the price should read like one.
     - Annual prepay is switched off, not deleted.
   ============================================================ */
(function () {
  /* WHAT EVERY PLAN INCLUDES, written once.

     One array, spread into all three plans, because the plans do not differ
     by capability and a per-plan copy of this list would let them look as
     though they did. The only honest differences are the metered ones:
     included minutes, the price of a minute past them, and how often we sit
     down with the call log. Those are the only per-plan entries below.

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
    "Invoices, plan changes and cancel-at-period-end you can do yourself, without asking us"
  ];

  window.NV_PRICING = {
    approved: true,
    currency: "CAD",
    lastUpdated: "2026-08-09",
    taxNote: "Prices in Canadian dollars, plus applicable GST/HST.",
    commercialModel: "V3-single-recurring-price",
    /* Whether a visitor may complete a purchase without talking to anyone.
       FALSE until the monthly price is collected at the right amount at
       checkout and the entitlements behind each price are re-approved
       against the list above. Publishing the price is honest; taking money
       under half-finished terms is not. The buy buttons read "Talk to us"
       while this is false, and the engine's checkout refuses independently:
       neither relies on the other. */
    sellable: false,
    /* The badge on the recommended plan. It read "MOST COMMON" on the pricing
       page, the homepage, the staging twin, and the proposal document sent to a
       named prospect. That is a statistic about a client base, and there are no
       clients: no plan has ever been the most common one.

       "RECOMMENDED" is an opinion, which is true and defensible, and it is what
       the live phone agent already says out loud ("Growth, the recommended
       plan"), so the site and the agent tell a caller the same thing.
       Versioned here so the four places that render it cannot drift apart. */
    recommendedLabel: "RECOMMENDED",
    /* The referral offer. Mirrors CANONICAL.referral in nevamis-engine, and the
       engine's consistency checker validates these values against it — so a
       number changed here and not there is caught rather than becoming the thing
       Nevamis is publicly held to.

       DECISION OF 2026-08-09: the referred business gets the NORMAL published
       price, and nothing else. `referredPilotDays: 14` is gone with the pilot
       it doubled. It was not replaced with a discount, a free week or a longer
       anything: inventing a substitute would have reintroduced a second way in
       on the same day the single way in was locked, which is the exact mistake
       the pilot itself was retired for. The published price is already the
       best terms anyone gets, and a referral that has to sweeten it is telling
       the referrer their friend would not have bought otherwise.

       The REFERRER's free month is untouched, because it is an obligation to
       an existing client rather than an inducement to a new one. It is earned
       on the referred business's first PAID invoice, not on their signup. That
       is stated on the page because a referral offer that hides its trigger is
       the kind of small print this company has spent the whole build
       removing. */
    referral: {
      referrerRewardMonths: 1,
      headline: "Know another business that misses calls?",
      offer: "They pay the same published price as everyone else, with nothing to negotiate. When they pay their first invoice, you get a free month of your own plan.",
      trigger: "The free month is earned when the business you referred pays their first invoice, and it comes off your next bill.",
      howTo: "Clients get their own link in the portal. Send it yourself: we never email somebody just because you named them."
    },
    /* Retired 2026-07-31 with the old zero setup fee. The offer was "setup fee
       waived for our first five founding clients". It stays retired under the
       single-price model: the monthly price is what the service costs, and a
       business that opens by discounting its own work has told the buyer what
       it thinks that work is worth. A new founding offer is a commercial
       decision for the owner, not something to fill this slot with. */
    foundingClient: {
      active: false,
      spots: 0,
      offer: "",
      note: ""
    },
    /* Suspended 2026-08-06. The mechanism is kept so it is not re-derived from
       memory later, but the approved model locks three monthly prices and
       approves no annual figure. Publishing C$2,500/year would be inventing a
       price nobody signed off, which is worse than publishing a wrong one:
       there is no correct value to check it against. */
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
       C$49/month and C$0 setup. A dormant record is only as dormant as the
       laziest reader of it, and there are no historic rows to protect — nothing
       has ever been sold. Removed rather than re-flagged. The pilot record
       followed it out on 2026-08-09 under the same precedent.

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
    /* `monthly` is the whole price. There is no second field, which is the
       strongest available guarantee that no surface can add two numbers
       together — the defect of 2026-08-07 is now unrepresentable rather than
       merely forbidden. */
    plans: [
      {
        id: "starter", name: "Core",
        monthly: 250, includedMinutes: 250,
        callRange: "80 to 125 typical calls", overage: 1.10,
        bestFor: "Small service businesses that mainly need evenings, weekends, and overflow covered.",
        features: [
          "One business phone line",
          "A call review each month, and tuning from what the calls actually show",
          "Email support"
        ].concat(EVERY_PLAN)
      },
      {
        id: "growth", name: "Growth", recommended: true,
        monthly: 500, includedMinutes: 600,
        callRange: "200 to 300 typical calls", overage: 0.90,
        bestFor: "Growing businesses putting a meaningful share of their inbound calls through it, not just the after-hours ones.",
        features: [
          "One business phone line",
          "Two call reviews each month, and tuning from what the calls actually show",
          "Priority email support"
        ].concat(EVERY_PLAN)
      },
      {
        id: "pro", name: "Pro",
        monthly: 1000, includedMinutes: 1400,
        callRange: "470 to 700 typical calls", overage: 0.75,
        bestFor: "High-volume businesses that would run past the Growth minutes every month, and want the lowest rate on the ones past them.",
        features: [
          "One business phone line",
          "Two call reviews each month, and tuning from what the calls actually show",
          "Priority email support",
          "Higher-volume usage priced with you before you commit to it"
        ].concat(EVERY_PLAN)
      }
    ]
  };
})();
