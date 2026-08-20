/* ============================================================
   NEVAMIS SERVICE ROADMAP — SINGLE SOURCE OF TRUTH
   Statuses: available | private_pilot | planned | researching | paused
   Only the owner flips a service to "available". The Coming Soon page
   and homepage teaser render from this file. Companion internal docs:
   docs/nevamis-product-roadmap.md and docs/service-blueprints/.
   Last reviewed: 2026-07-23
   ============================================================ */
window.NV_ROADMAP = {
  lastUpdated: "2026-07-23",
  truthStatement: "These services are in development or planned. Availability, features, integrations, and pricing may change as we test them with real businesses.",
  highlights: ["instant-lead-follow-up", "automatic-lead-tracking", "quote-recovery"],
  pillars: [
    { id: "capture", name: "Capture", line: "Every opportunity answered" },
    { id: "convert", name: "Convert", line: "Follow-up that never forgets" },
    { id: "operate", name: "Operate", line: "Less office admin" },
    { id: "grow", name: "Grow", line: "Know what makes money" }
  ],
  services: [
    { slug: "ai-front-desk", name: "Front Desk", pillar: "capture", status: "available", stage: "now",
      desc: "Answers your line 24/7, qualifies the caller, takes the job and the time they want, and sends you the details. You confirm the slot.",
      outcome: "No more jobs lost to voicemail.", cta: "/pilot.html" },
    { slug: "pulse-scan", name: "PULSE Business Scan", pillar: "grow", status: "available", stage: "now",
      desc: "Looks at your business from the outside and tells you where the money is leaking, with what it is basing that on. Every figure is a range with a confidence level, and feeding it your real numbers sharpens all of them.",
      outcome: "You see the leaks before you pay to fix any of them.", cta: "https://app.nevamis.ca/scan" },
    { slug: "lead-generation", name: "Lead Generation", pillar: "grow", status: "available", stage: "now",
      desc: "Finds businesses that need what you do, works out which are worth calling, and brings you the ones that are, each with the reason it ranked where it did. Worked by a person, never by a robot dialling strangers.",
      outcome: "A call list worth working, instead of a cold directory.", cta: "/book.html" },
    /* AVAILABLE 2026-08-19, and the claims shrank to the shipped truth
       (mirror of canonical.ts): one text per missed call, ever, with the
       business's name on it and a working opt-out — not a retry sequence,
       not form responses. What ships is what is sold. */
    { slug: "instant-lead-follow-up", name: "Instant Lead Follow-Up", pillar: "convert", status: "available", stage: "now",
      desc: "A caller you missed gets one text back while the job is still winnable — during business hours, on your say-so, with your business name on it.",
      problem: "Leads contact several companies. The fastest response usually wins the job.",
      functions: ["Missed-call text back", "One text per missed call, ever", "Your identification and a working opt-out on every message", "Hands over the moment they reply or call back"],
      outcome: "Missed callers hear back before they ring the next company." },
    { slug: "automatic-lead-tracking", name: "Automatic Lead Tracking", pillar: "operate", status: "available", stage: "now",
      desc: "Calls, messages, forms, appointments, and follow-ups become organized customer records, so owners can see which opportunities need attention.",
      problem: "Leads live in texts, notebooks, and memory. Nobody can see what is pending.",
      functions: ["Contact creation and matching", "Lead-source capture", "Call summaries attached to records", "Stage and task tracking", "Stale-lead alerts"],
      outcome: "Cleaner records, fewer forgotten opportunities, real visibility." },
    /* AVAILABLE 2026-08-19, claims shrunk to the shipped truth: detection
       on the owner's own threshold plus ONE approved follow-up email per
       quiet quote — "reminder sequences" and "reply classification" are
       not built and are not claimed. */
    { slug: "quote-recovery", name: "Quote Recovery", pillar: "convert", status: "available", stage: "now",
      desc: "Quotes that go quiet past your threshold get spotted and followed up once, with your name on the email and your approval before it goes.",
      problem: "Quotes are sent and forgotten. Interested customers drift away.",
      functions: ["Quiet-quote detection on your threshold", "One approved follow-up email per quote", "Your identification on every message", "Recovered value reported against the quotes that came back"],
      outcome: "Recovered revenue that was already almost won." },
    { slug: "schedule-protection", name: "Schedule Protection", pillar: "convert", status: "planned", stage: "future",
      desc: "Reminders, approved rescheduling, and cancellation recovery that keep valuable appointment slots from going unused.",
      outcome: "Fewer no-shows, better utilization." },
    { slug: "daily-business-brief", name: "Your Daily Business Brief", pillar: "operate", status: "planned", stage: "future",
      desc: "Calls, bookings, open leads, follow-ups, and urgent issues condensed into one concise daily summary.",
      outcome: "Five minutes to know exactly where the business stands." },
    { slug: "review-referral-engine", name: "Review and Referral Engine", pillar: "grow", status: "planned", stage: "future",
      desc: "After a completed job, approved feedback requests route concerns privately and make it easy for happy customers to leave a review.",
      outcome: "More legitimate reviews, faster complaint awareness." },
    { slug: "customer-reactivation", name: "Customer Reactivation", pillar: "convert", status: "researching", stage: "future",
      desc: "Reconnect with eligible past customers when maintenance, seasonal work, or renewals may genuinely help them.",
      outcome: "Repeat business from relationships you already earned." },
    { slug: "web-messaging-concierge", name: "Web and Messaging Concierge", pillar: "capture", status: "researching", stage: "future",
      desc: "Website visitors and texters get the same fast, knowledgeable path to answers and booking that callers receive.",
      outcome: "More captured leads from people who never call." },
    { slug: "ai-inbox-assistant", name: "Inbox Assistant", pillar: "operate", status: "researching", stage: "future",
      desc: "Shared business email gets organized: urgent messages flagged, replies drafted for approval, tasks extracted, a clear digest produced.",
      outcome: "Less inbox time, nothing important buried." },
    { slug: "smarter-job-intake", name: "Smarter Job Intake", pillar: "capture", status: "researching", stage: "future",
      desc: "Qualified requests become structured job records with the right people alerted, using rules the business approves.",
      outcome: "Complete job information without repeated questions." },
    { slug: "business-knowledge-assistant", name: "Business Knowledge Assistant", pillar: "operate", status: "researching", stage: "future",
      desc: "Employees find approved procedures and company answers instantly instead of asking the same person again.",
      outcome: "Consistent answers, faster training." },
    { slug: "revenue-clarity", name: "Revenue Clarity", pillar: "grow", status: "researching", stage: "future",
      desc: "Lead sources, calls, quotes, completed work, and collected payments connected, so owners see what actually produces revenue.",
      outcome: "Spending decisions backed by real numbers." },
    { slug: "ai-growth-system", name: "Growth System", pillar: "grow", status: "researching", stage: "future",
      desc: "The long-term goal: conversion-focused web experiences, follow-up, reactivation, reviews, and attribution working as one connected growth system.",
      outcome: "One partner, one connected system, measurable growth." }
  ]
};
