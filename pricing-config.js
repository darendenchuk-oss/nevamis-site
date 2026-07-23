/* ============================================================
   NEVAMIS PRICING — SINGLE SOURCE OF TRUTH
   approved:false = DRAFT. The pricing page renders a draft banner
   and stays noindexed/unlinked until the owner flips approval AFTER
   confirming every number. Do not duplicate these values in HTML.
   ============================================================ */
window.NV_PRICING = {
  approved: false,
  currency: "CAD",
  lastUpdated: "2026-07-23",
  taxNote: "Prices in Canadian dollars plus applicable tax.",
  commercialModel: null, /* set to "A" | "B" | "C" after owner selection */
  usagePolicy: {
    minuteDef: "A connected AI minute starts when the AI answers a connected call and ends when the AI portion of the call ends.",
    notes: [
      "Failed calls that never connect are not counted.",
      "Wrong numbers or spam that reach the AI consume usage, because the system handled them.",
      "Usage alerts at 75%, 90%, and 100% of included minutes.",
      "Near the limit you choose: automatic overage, fallback answering, or a hard cap."
    ]
  },
  plans: [
    {
      id: "after-hours", name: "After Hours",
      monthly: 449, setup: 500, includedMinutes: 250,
      callRange: "80 to 125 typical calls", overage: 1.10,
      bestFor: "Small service businesses that mainly need evenings, weekends, and overflow covered.",
      features: [
        "One business phone line", "After-hours or missed-call overflow coverage",
        "One call flow", "One booking calendar",
        "Business FAQs and service-area rules", "Basic qualification",
        "Appointment and job booking", "SMS or email confirmations and owner summaries",
        "One monthly tuning review", "Standard email support"
      ]
    },
    {
      id: "growth", name: "Growth", recommended: true,
      monthly: 749, setup: 1000, includedMinutes: 600,
      callRange: "200 to 300 typical calls", overage: 0.90,
      bestFor: "Growing businesses that want qualification, routing, and booking on a meaningful share of inbound calls.",
      features: [
        "Up to two lines, departments, or call flows",
        "After-hours, overflow, or full-time front-line coverage",
        "Up to two booking calendars", "Advanced qualification and intake",
        "Approved transfer and escalation rules",
        "Custom confirmation and owner-summary workflows",
        "One standard CRM or automation connection when supported",
        "Two tuning reviews per month for the first 90 days", "Priority email support"
      ]
    },
    {
      id: "scale", name: "Scale", startingAt: true,
      monthly: 1249, setup: 1500, includedMinutes: 1200,
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
