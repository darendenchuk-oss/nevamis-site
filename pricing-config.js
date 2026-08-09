/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   APPROVED 2026-08-06, MODEL CLARIFIED 2026-08-07
   (MASTER REVENUE SYSTEM V2, section 3).
   Do not duplicate these values in HTML — render from here.

   THE COMMERCIAL MODEL, IN ONE TABLE:

     Plan     price
     Core     C$250/month
     Growth   C$500/month
     Pro      C$1,000/month

   ONE PRICE PER PLAN, CHARGED THE DAY THEY SUBSCRIBE AND EVERY MONTH
   AFTER. There is no setup fee, activation fee, onboarding fee,
   implementation fee or launch charge, and no pilot.

   The `setup` key is GONE, not zeroed. A zero would still have been a
   second number for a card to render and a buyer to wonder about, and
   nevamis-engine's checkPricing now treats the PRESENCE of a setup figure
   as the defect rather than checking its size — so a surface that keeps
   the field fails the cross-repo guard on purpose.

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
     - The pilot is retired. With no setup fee, C$250/month cancel-anytime
       beats C$150 for seven days on every axis a buyer cares about:
       cheaper per day, longer, and cancellable. A dominated option beside
       the real one is not a cheaper way in, it is a contradiction of the
       offer — the same argument that removed C$49 Pay As You Go from
       beside a C$250 floor.
     - Prices are round. C$249 is a retail signal, and this is a
       managed professional service; the price should read like one.
     - Annual prepay is switched off, not deleted.
   ============================================================ */
window.NV_PRICING = {
  approved: true,
  currency: "CAD",
  lastUpdated: "2026-08-06",
  taxNote: "Prices in Canadian dollars, plus applicable GST/HST.",
  commercialModel: "V2-paid-pilot",
  /* Whether a visitor may complete a purchase without talking to anyone.
     FALSE until the first month is collected at the right amount at
     checkout, the C$150 pilot credit applies automatically, and the
     entitlements behind each price are re-approved against the new
     ladder. Publishing the price is honest; taking money under
     half-finished terms is not. The buy buttons read "Talk to us" while
     this is false, and the engine's checkout refuses independently:
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
  pilot: {
    name: "7-day live pilot",
    fee: 150,
    days: 7,
    /* Renamed from `creditedToSetup` on 2026-08-07. The credit lands on
       month one, not on a separate fee, and the old name is half the
       reason the pages described a charge that does not exist. */
    creditedToFirstMonth: true,
    tagline: "Seven live days on your real line. C$150, credited toward your first month if you continue.",
    caps: "One line, one call flow, one calendar. Up to 60 connected AI minutes or 30 calls, whichever comes first. One revision included.",
    start: "The seven days start when your pilot goes live, not when you apply.",
    dayEight: "On day eight the pilot ends unless you explicitly choose a plan. Silence never becomes a subscription.",
    credit: "If you continue, the full C$150 comes off your first month on the plan you choose. You are never charged twice for the same build."
  },
  /* The referral offer. Mirrors CANONICAL.referral in nevamis-engine, and the
     engine's consistency checker validates these values against it — so a
     number changed here and not there is caught rather than becoming the thing
     Nevamis is publicly held to.

     The referred business gets twice the pilot for the SAME fee. Discounting
     the fee instead would have reintroduced a nearly-free pilot through the
     side door on the same day the paid one was locked.

     The reward is earned on the referred business's first PAID invoice, not on
     their signup. That is stated on the page because a referral offer that
     hides its trigger is the kind of small print this company has spent the
     whole build removing. */
  referral: {
    referredPilotDays: 14,
    referrerRewardMonths: 1,
    headline: "Know another business that misses calls?",
    offer: "Their pilot runs 14 days instead of 7, for the same C$150. When they pay their first invoice, you get a free month of your own plan.",
    trigger: "The free month is earned when the business you referred pays their first invoice, and it comes off your next bill.",
    howTo: "Clients get their own link in the portal. Send it yourself — we never email somebody just because you named them."
  },
  /* Retired 2026-07-31 with the old zero setup fee. The offer was "setup fee
     waived for our first five founding clients". It stays retired under V2:
     the first month is priced for the build that happens inside it, and a
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
     memory later, but V2 locks three monthly prices and a pilot fee and
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
     has ever been sold. Removed rather than re-flagged.

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
        "One business phone line", "After-hours or missed-call overflow coverage",
        "One call flow", "One booking calendar",
        "Business FAQs and service-area rules", "Basic qualification",
        "Appointment and job booking", "Owner summaries by text and email after every call",
        "One monthly tuning review", "Standard email support"
      ]
    },
    {
      id: "growth", name: "Growth", recommended: true,
      monthly: 500, includedMinutes: 600,
      callRange: "200 to 300 typical calls", overage: 0.90,
      bestFor: "Growing businesses that want qualification, routing, and booking on a meaningful share of inbound calls.",
      features: [
        "Up to two lines, departments, or call flows",
        "After-hours, overflow, or full-time front-line coverage",
        "Up to two booking calendars", "Advanced qualification and intake",
        "Approved transfer and escalation rules",
        "Customer booking confirmations by text, opt-in, in your business name",
        "One standard CRM or automation connection when supported",
        "Two tuning reviews per month for the first 90 days", "Priority email support"
      ]
    },
    {
      id: "pro", name: "Pro",
      monthly: 1000, includedMinutes: 1200,
      callRange: "400 to 600 typical calls", overage: 0.75,
      bestFor: "Multi-location businesses and teams with higher volume or complex routing.",
      features: [
        "Multi-location, multi-department, or complex call handling",
        "Multiple calendars and routing rules",
        "Advanced workflows and approved integrations",
        "Custom reporting", "Priority tuning and support",
        "Higher-volume and custom usage available"
      ]
    }
  ]
};
