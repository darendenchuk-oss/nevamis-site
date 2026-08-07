/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   APPROVED 2026-08-06 (MASTER REVENUE SYSTEM V2, section 3).
   Commercial model: paid pilot + monthly plan + one-time setup fee.
   Do not duplicate these values in HTML — render from here.

   WHAT CHANGED AND WHY, because the previous version of this header
   argued the opposite case and someone will find both:
     - Setup fees returned (C$250 / C$500 / C$1,000). Configuration,
       knowledge, testing and go-live are real work on day one, and
       pricing them at zero taught the buyer they were worth zero.
     - The pilot is paid (C$150), credited in full against the setup
       fee on conversion. A free trial makes the buyer's decision
       cheap and the seller's work free.
     - Prices are round. C$249 is a retail signal, and this is a
       managed professional service; the price should read like one.
     - Pay As You Go and annual prepay are switched off, not deleted.
       A C$49 entry point beside a C$250 floor is not a cheaper
       option, it is a contradiction of the offer.
   ============================================================ */
window.NV_PRICING = {
  approved: true,
  currency: "CAD",
  lastUpdated: "2026-08-06",
  taxNote: "Prices in Canadian dollars, plus applicable GST/HST.",
  commercialModel: "V2-paid-pilot",
  /* Whether a visitor may complete a purchase without talking to anyone.
     FALSE until the setup fee is collected at checkout, the C$150 pilot
     credit applies automatically, and the entitlements behind each price
     are re-approved against the new ladder. Publishing the price is
     honest; taking money under half-finished terms is not. The buy
     buttons read "Talk to us" while this is false, and the engine's
     checkout refuses independently — neither relies on the other. */
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
    creditedToSetup: true,
    tagline: "Seven live days on your real line. C$150, credited toward your setup fee if you continue.",
    caps: "One line, one call flow, one calendar. Up to 60 connected AI minutes or 30 calls, whichever comes first. One revision included.",
    start: "The seven days start when your pilot goes live, not when you apply.",
    dayEight: "On day eight the pilot ends unless you explicitly choose a plan. Silence never becomes a subscription.",
    credit: "If you continue, the full C$150 comes off the one-time setup fee on the plan you choose. You are never charged twice for the same build."
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
     the setup fee is the price of the build, and a business that opens by
     discounting its own work has told the buyer what it thinks that work is
     worth. A new founding offer is a commercial decision for the owner, not
     something to fill this slot with. */
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
  /* Retired 2026-08-06. Kept as a record because the engine still recognises
     the key on historic rows; `active: false` means no surface offers it. */
  payAsYouGo: {
    active: false,
    id: "pay-as-you-go", name: "Pay As You Go",
    monthly: 49, setup: 0, perMinute: 1.95,
    bestFor: "",
    note: "Retired 2026-08-06. Not offered.",
    features: []
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
  plans: [
    {
      id: "starter", name: "Starter",
      monthly: 250, setup: 250, includedMinutes: 250,
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
      monthly: 500, setup: 500, includedMinutes: 600,
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
      monthly: 850, setup: 1000, includedMinutes: 1200,
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
