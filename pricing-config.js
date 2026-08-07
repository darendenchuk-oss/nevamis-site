/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   APPROVED 2026-08-06, MODEL CLARIFIED 2026-08-07
   (MASTER REVENUE SYSTEM V2, section 3).
   Do not duplicate these values in HTML — render from here.

   THE COMMERCIAL MODEL, IN ONE TABLE:

     Plan     first month     then, from month two
     Core  C$250           C$250/month
     Growth   C$500           C$500/month
     Pro      C$1,000         C$850/month

   `setup` IS THE FIRST MONTH. It is not a fee charged ON TOP of month
   one, and every surface that renders it must say so. This is the exact
   defect fixed on 2026-08-07: the cards read "C$250/month" with
   "One-time setup: C$250" beneath, which a buyer reads as C$500 due on
   day one. The number was right and the sentence was wrong, which is the
   worst combination, because nothing that compares numbers can see it.

   The key is still named `setup` rather than `activationPrice` for one
   reason: nevamis-engine/scripts/check-consistency.mjs parses this file
   with a literal /setup:\s*(\d+)/ and maps it onto canonical's
   `activationPrice`. Renaming it here would make that cross-repo guard
   read NaN and start reporting drift that does not exist. The engine's
   own domain record uses the correct name; see canonical.ts.

   WHAT CHANGED AND WHY, because earlier versions of this header argued
   the opposite case and someone will find all of them:
     - A first-month amount returned (C$250 / C$500 / C$1,000).
       Configuration, knowledge, testing and go-live are real work on day
       one, and pricing them at zero taught the buyer they were worth zero.
     - The pilot is paid (C$150), credited in full against the FIRST
       MONTH on conversion. A free trial makes the buyer's decision cheap
       and the seller's work free.
     - Prices are round. C$249 is a retail signal, and this is a
       managed professional service; the price should read like one.
     - Annual prepay is switched off, not deleted. Pay As You Go WAS switched
       off rather than deleted, and that turned out not to be enough: see the
       note on its removal below.
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
  /* Read every plan below as: `setup` is what month ONE costs, `monthly` is
     what every month from TWO onward costs. They are the same number on
     Core and Growth and deliberately different on Pro, which is why one
     field could never carry both and why no surface may add them together. */
  plans: [
    {
      id: "starter", name: "Core",
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
