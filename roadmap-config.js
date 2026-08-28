/* ============================================================
   NEVAMIS SERVICE ROADMAP — SINGLE SOURCE OF TRUTH
   Statuses: available | private_pilot | planned | researching | paused
   Only the owner flips a service to "available". The Coming Soon page
   and homepage teaser render from this file. Companion internal docs:
   docs/nevamis-product-roadmap.md and docs/service-blueprints/.
   Last reviewed: 2026-08-27
   ============================================================ */
window.NV_ROADMAP = {
  lastUpdated: "2026-08-27",
  truthStatement: "Services marked AVAILABLE NOW are live today, described exactly as narrowly as they work. The rest are in development or planned, and their availability, features, integrations and pricing may change as we test them with real businesses.",
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
    /* TWO PATHS since 2026-08-19, mirroring canonical.ts: finding the
       client's own paying customers, AND finding jobs and tenders Nevamis
       bids on. The bid half is gated by the service agreement (§1.1, §3)
       and the gate is part of the sentence, not a footnote: the client's
       named approver signs off on that specific bid, the prices are the
       client's, Nevamis is not a party to the contract that results and does
       not do the work. Nothing here may promise a job is won.

       NOT AVAILABLE, owner directive 2026-08-27. This entry said "available"
       from 2026-08-19 and every derived surface repeated it: the homepage
       loop, the trade pages, the solutions hub, revenue-engine.html and the
       "lead generation works today" line on this page's own final call to
       action. Nothing has run for a client, and the bid half still has no
       code anywhere. The description below is written as what it WILL do,
       and no surface may label it live until it is.

       This deliberately UNDER-claims against canonical.ts, which still
       carries availability "available" for lead_generation. That direction
       is the safe one and the only one this file may take on its own: the
       site may say less than canonical, never more. Raising it back is an
       owner decision made in canonical first. */
    { slug: "lead-generation", name: "Lead Generation", pillar: "grow", status: "planned", stage: "future",
      desc: "Two things, and neither of them is running for a client yet. It is being built to find the customers who need what you do and rank them with the reason each one ranked where it did, worked by a person and never by a robot dialling strangers. And to find jobs and tenders you could win: we would prepare the bid at your prices, submit nothing until the person you name signs off on that specific bid, and hand you the job if it lands. The contract would be yours and you would do the work.",
      outcome: "A call list worth working, and bids going in on work you would not have seen." },
    /* AVAILABLE 2026-08-19, and the claims shrank to the shipped truth
       (mirror of canonical.ts): one text per missed call, ever, with the
       business's name on it and a working opt-out — not a retry sequence,
       not form responses. What ships is what is sold. */
    { slug: "instant-lead-follow-up", name: "Instant Lead Follow-Up", pillar: "convert", status: "available", stage: "now",
      desc: "A caller you missed gets one text back while the job is still winnable: during business hours, on your say-so, with your business name on it.",
      problem: "Leads contact several companies. The fastest response usually wins the job.",
      functions: ["Missed-call text back", "One text per missed call, ever", "Your identification and a working opt-out on every message", "Hands over the moment they reply or call back"],
      outcome: "Missed callers hear back before they ring the next company.", cta: "/pricing.html" },
    { slug: "automatic-lead-tracking", name: "Automatic Lead Tracking", pillar: "operate", status: "available", stage: "now",
      desc: "Calls, messages, forms, appointments, and follow-ups become organized customer records, so owners can see which opportunities need attention.",
      problem: "Leads live in texts, notebooks, and memory. Nobody can see what is pending.",
      functions: ["Contact creation and matching", "Lead-source capture", "Call summaries attached to records", "Stage and task tracking", "Stale-lead alerts"],
      outcome: "Cleaner records, fewer forgotten opportunities, real visibility.", cta: "/pilot.html" },
    /* AVAILABLE 2026-08-19, claims shrunk to the shipped truth: detection
       on the owner's own threshold plus ONE approved follow-up email per
       quiet quote — "reminder sequences" and "reply classification" are
       not built and are not claimed. */
    { slug: "quote-recovery", name: "Quote Recovery", pillar: "convert", status: "available", stage: "now",
      desc: "Quotes that go quiet past your threshold get spotted and followed up once, with your name on the email and your approval before it goes.",
      problem: "Quotes are sent and forgotten. Interested customers drift away.",
      functions: ["Quiet-quote detection on your threshold", "One approved follow-up email per quote", "Your identification on every message", "Recovered value reported against the quotes that came back"],
      outcome: "Recovered revenue that was already almost won.", cta: "/pricing.html" },
    { slug: "schedule-protection", name: "Schedule Protection", pillar: "convert", status: "planned", stage: "future",
      desc: "Reminders, approved rescheduling, and cancellation recovery that keep valuable appointment slots from going unused.",
      outcome: "Fewer no-shows, better utilization." },
    { slug: "daily-business-brief", name: "Your Daily Business Brief", pillar: "operate", status: "planned", stage: "future",
      desc: "Calls, bookings, open leads, follow-ups, and urgent issues condensed into one concise daily summary.",
      outcome: "Five minutes to know exactly where the business stands." },
    /* NOT flipped to available, deliberately. pricing-config.js carries
       review_engine with sellable: true and the pricing page sells it, so this
       entry under-claims against the add-on catalog. Promoting it here is a NEW
       public availability claim on an indexed page, which is an owner decision
       and was not one of the four this branch was authorised to make. Left as
       the owner last set it; raising it is a separate call. */
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
