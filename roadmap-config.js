/* ============================================================
   NEVAMIS SERVICE ROADMAP — SINGLE SOURCE OF TRUTH
   Statuses: available | private_pilot | planned | researching | paused
   Only the owner flips a service to "available". The Roadmap page
   (coming-soon.html) renders from this file; nothing else does, whatever
   older comments say about a homepage teaser. Companion internal docs:
   docs/nevamis-product-roadmap.md and docs/service-blueprints/.
   Last reviewed: 2026-09-19
   ============================================================ */
window.NV_ROADMAP = {
  lastUpdated: "2026-09-19",
  /* "The rest are in development or planned" stopped being the whole truth on
     2026-09-08, when lead-generation became the first entry to carry
     private_pilot. A truth statement that does not describe every shelf under
     it is not one. Written against the LABEL and not against a count, so it
     stays true whether that shelf holds one entry or none. The label for
     private_pilot has been BY INVITATION since 2026-09-19 (it was PRIVATE
     TESTING), the same words every other surface uses for it. */
  truthStatement: "Services marked AVAILABLE NOW are live today, described exactly as narrowly as they work. Anything marked BY INVITATION is offered to a few businesses under their own agreement, and a short call is where it starts. The rest are planned or being researched, and their features and pricing may change before they are ready.",
  /* No `highlights` list since 2026-09-19: it named a homepage teaser that
     nothing renders, and a list nobody reads is still read as fact by the
     next editor. */
  pillars: [
    { id: "capture", name: "Capture", line: "Every opportunity answered" },
    { id: "convert", name: "Convert", line: "Follow-up that never forgets" },
    { id: "operate", name: "Operate", line: "Less office admin" },
    { id: "grow", name: "Grow", line: "Know what makes money" }
  ],
  services: [
    { slug: "ai-front-desk", name: "AI Front Desk", pillar: "capture", status: "available", stage: "now",
      desc: "Answers your line 24/7, qualifies the caller, takes the job and the time they want, and sends you the details. You confirm the slot.",
      outcome: "Calls you cannot take are answered instead of going to voicemail.", cta: "/how-you-start.html" },
    /* Described the way DC#54 (2026-09-18) requires: the public website only,
       and modelled ranges rather than measurements (engine scan/page.tsx).
       The leak promise that stood here is retired. ctaLabel names the path
       "Scan my website"; coming-soon.html falls back to "Start here". */
    { slug: "pulse-scan", name: "PULSE Business Scan", pillar: "grow", status: "available", stage: "now",
      desc: "Reads only what is public on your own website and shows what it found, quoted from your own pages. Where it puts a figure on something, that figure is a modelled range from public information and market benchmarks, not a measurement of your results. Adding your real numbers sharpens it.",
      outcome: "A free, plain read of your website before you talk to anyone.", cta: "https://app.nevamis.ca/scan", ctaLabel: "Scan my website" },
    /* ONE PATH since 2026-09-12, mirroring canonical.ts: the businesses that
       fit what the client does, found for them. TWO PATHS was the shape from
       2026-08-19 until the owner re-scoped the product: bid and tender work is
       a hand-arranged service under the service agreement (§1.1, §3), arranged
       separately and NOT part of what a client signs up for, so it is not
       described here or in anything derived from this entry. The engine made
       that a rule rather than a comment (src/domain/bid-claims.ts, BID-4), and
       this entry is the site's half of the same re-scope.

       WHY THE BID SENTENCES ARE GONE RATHER THAN SOFTENED. They carried the
       protections: the named approver signs off on that specific bid, the
       prices are the client's, Nevamis is not a party to the contract and does
       not do the work. Deleting the sentences is exactly the moment those
       protections are most likely to be lost, which is why the engine moved
       them into executable rules before the sentences came out. Nothing here
       may promise a job is won, and nothing here may schedule bid work as part
       of signing up.

       BY INVITATION since 2026-09-08, and not a step further. It said
       "available" from 2026-08-19 and every derived surface repeated it, which
       is why the owner directive of 2026-08-27 dropped it to "planned" and
       rewrote it as what it WILL do. Canonical moved on 2026-09-08: canonical.ts
       now carries availability "private_pilot" for lead_generation, which
       derives the public readiness "limited", so this entry follows it to
       "private_pilot". The site's own word for that status is BY INVITATION
       (PRIVATE TESTING until 2026-09-19), which coming-soon.html renders from
       the status key, and in copy it is "by invitation" too. The word "pilot"
       is not said to a client anywhere, because there is no pilot and no
       trial of anything.

       WHAT "private_pilot" MEANS HERE, and the fence every surface repeats:
       it is offered to a few businesses by invitation, under their own
       agreement, and delivered by hand. A person here assembles the list by
       reading public pages, and each row carries the page it came from. The
       client decides every row. Nothing on a list is contacted by Nevamis.
       No automated search has run for any client; each list is put together
       by hand (DC#55, 2026-09-19: the key is connected, but no workspace has
       the profile a sweep needs). No number of leads, no win
       rate, no amount, no client and no date may appear in this entry or in
       anything derived from it.

       The direction of travel is still the only one this file may take on its
       own: the site may say less than canonical, never more. Raising this
       above canonical is not a change that starts here. Stage is "next" and
       not "now": "now" is the shelf marked LIVE TODAY, and it is also the
       engine guard's definition of a public claim to be ready now.

       Its one action is Book a call (DC#54: "a short call is where it
       starts"). coming-soon.html renders a private_pilot entry's cta as
       that button, tracked as hero_book_call_click, never as a "Start here"
       start action, and keeps it out of the interest form. */
    { slug: "lead-generation", name: "Lead Generation", pillar: "grow", status: "private_pilot", stage: "next",
      desc: "Offered by invitation to a few businesses, under their own agreement, and done by hand. A person here reads public pages and builds you a list of the businesses that need what you do, with the page each row came from and the day it was read, so you can check any of it yourself. Each row is scored against what you told us you want, in words. You decide which rows are worth anything, nobody on the list is contacted by us, and what you tell us came of the ones you pursued is what your Results show.",
      outcome: "A call list you approved yourself, on businesses that fit the work you want.", ctaLabel: "Book a call", cta: "/book.html#pick-a-time" },
    /* AVAILABLE 2026-08-19, and the claims shrank to the shipped truth
       (mirror of canonical.ts): one text per missed call, ever, with the
       business's name on it and a working opt-out — not a retry sequence,
       not form responses. What ships is what is sold. Named Missed-Call
       Recovery since 2026-09-19, the name the pricing page sells it under;
       the slug stays the canonical capability key the engine gate reads. */
    { slug: "instant-lead-follow-up", name: "Missed-Call Recovery", pillar: "convert", status: "available", stage: "now",
      desc: "A caller you missed gets one text back while the job is still winnable: during business hours, on your say-so, with your business name on it.",
      problem: "Leads contact several companies. The fastest response usually wins the job.",
      functions: ["Missed-call text back", "One text per missed call, ever", "Your identification and a working opt-out on every message", "Hands over the moment they reply or call back"],
      outcome: "A missed caller hears from you while the job is still winnable.", cta: "/pricing.html" },
    { slug: "automatic-lead-tracking", name: "Automatic Lead Tracking", pillar: "operate", status: "available", stage: "now",
      desc: "Each call, text and form becomes a lead with its source and a status, so you can see what is sitting untouched and what each source is actually producing.",
      problem: "Leads live in texts, notebooks, and memory. Nobody can see what is pending.",
      functions: ["A lead for every call, text and form", "Lead-source capture", "Call summaries attached to each lead", "What is sitting untouched, shown plainly", "A count of what each source produces"],
      outcome: "Nothing goes cold in a notebook.", cta: "/how-you-start.html" },
    /* AVAILABLE 2026-08-19. Since the ladder shipped on 2026-08-22 it is
       detection on the owner's own threshold plus THREE approved follow-ups
       per quiet quote: the day it goes stale, four days on and eleven days
       on (canonical.ts quote_recovery; pricing-config.js says the same).
       "Reply classification" is not claimed, and neither is stopping on a
       reply: DC#37 left that mechanism an open verification item. */
    { slug: "quote-recovery", name: "Quote Recovery", pillar: "convert", status: "available", stage: "now",
      desc: "Quotes that go quiet past your threshold get followed up for you: the day they go stale, four days on and eleven days on, each email with your name on it and your approval before it goes. Sold as the Quote-Chase Engine.",
      problem: "Quotes are sent and forgotten. Interested customers drift away.",
      functions: ["Quiet-quote detection on your threshold", "Three approved follow-ups per quote: the day it goes stale, day four and day eleven", "Your identification on every message", "Recovered value reported against the quotes that came back"],
      outcome: "Recovered revenue that was already almost won.", cta: "/pricing.html" },
    /* AVAILABLE, and sold on the pricing page as the Get-Paid Autopilot
       add-on (canonical.ts get_paid). The slug is the engine's
       siteSlugFor("get_paid"), so the engine gate matches this row to the
       capability; its ROADMAP_UNLISTED.get_paid exemption can now go. */
    { slug: "get-paid", name: "Get-Paid Autopilot", pillar: "operate", status: "available", stage: "now",
      desc: "Overdue invoices get a gentle reminder with your approval, a firm one a week later, and at three weeks it stops emailing your customer and tells you instead.",
      functions: ["A gentle reminder when an invoice goes overdue, with your approval", "A firm reminder a week later if it stays unpaid", "At three weeks, the call comes back to you"],
      outcome: "Overdue invoices stop aging quietly.", cta: "/pricing.html" },
    /* FUTURE, trimmed by the owner on 2026-09-19 (fix plan r15 B7). Schedule
       Protection (it presumed appointment slots the front desk cannot book),
       Web and Messaging Concierge, Smarter Job Intake and Business Knowledge
       Assistant are gone: no canonical record backs any of them. The Daily
       Brief and the Growth System stay by the owner's decision. An entry says
       what it WOULD do unless there is canonical work behind it; only then may
       it say "Is being built to". The Daily Brief has no canonical record, so
       it says "Would" even though the owner kept it as planned; the Revenue
       Engine is canonical private_pilot work, so it may say it is being
       built. */
    { slug: "daily-business-brief", name: "Your Daily Business Brief", pillar: "operate", status: "planned", stage: "future",
      desc: "Would condense calls, open leads, follow-ups, and urgent issues into one concise daily summary.",
      outcome: "Five minutes to know exactly where the business stands." },
    /* No Review Engine row, deliberately and for now (2026-09-19). It is sold
       today and is inside The Works, so the "planned" row that stood here was
       false. An "available" row needs a review_engine capability in engine
       canonical first, or the engine gate fails HIGH (fix plan r15 B11). */
    { slug: "customer-reactivation", name: "Customer Reactivation", pillar: "convert", status: "researching", stage: "future",
      desc: "Reconnect with eligible past customers when maintenance, seasonal work, or renewals may genuinely help them.",
      outcome: "Repeat business from relationships you already earned." },
    { slug: "ai-inbox-assistant", name: "Inbox Assistant", pillar: "operate", status: "researching", stage: "future",
      desc: "Drafts the routine replies, flags the ones that actually need you, and never sends anything without you pressing send.",
      outcome: "Less inbox time, nothing important buried." },
    /* The Revenue Engine under its own name and the canonical slug since
       2026-09-19 (it was "Revenue Clarity"): ad attribution, which canonical
       carries as private_pilot. "planned" says less than that, which is
       allowed, and the engine gate logs it as a medium under-claim; it may
       never say "pilot". Not "now" and not "available": nothing is sold.

       No cta. It carried cta: "/revenue-engine.html", which the renderer
       ignores: coming-soon.html honours a cta only for an AVAILABLE entry
       (a "Start here" button) or a BY INVITATION one (a "Book a call"), and
       both of those mean there is something to start. A planned entry keeps
       the interest button instead, which is the only way this page measures
       who wants the Revenue Engine built. Dead config reads as a broken
       renderer to the next editor, so it is gone rather than honoured.
       /revenue-engine.html is left with one inbound link, at :1039 on that
       page; giving it more is a nav decision, not a roadmap card. */
    { slug: "revenue-engine", name: "Revenue Engine", pillar: "grow", status: "planned", stage: "future",
      desc: "Is being built to tie each lead back to where it came from, down to the campaign, and follow it to a paid job, so you can see what to spend more on and what to stop.",
      outcome: "Spending decisions backed by real numbers." },
    { slug: "ai-growth-system", name: "Growth System", pillar: "grow", status: "researching", stage: "future",
      desc: "The long-term goal: conversion-focused web experiences, follow-up, reactivation, reviews, and attribution working as one connected growth system.",
      outcome: "One partner, one connected system, measurable growth." }
  ]
};
