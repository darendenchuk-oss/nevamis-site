/* ============================================================
   NEVAMIS SERVICE ROADMAP — SINGLE SOURCE OF TRUTH
   Statuses: available | private_pilot | planned | researching | paused
   An entry that is not available may carry `statusLabel`, the words its
   card shows instead of its status's own label; the renderer refuses it on
   an available entry, so it can say less than the status, never more.
   Only the owner flips a service to "available". The Roadmap page
   (coming-soon.html) renders from this file; nothing else does, whatever
   older comments say about a homepage teaser. Companion internal docs:
   docs/nevamis-product-roadmap.md and docs/service-blueprints/.
   Last reviewed: 2026-10-03
   ============================================================ */
window.NV_ROADMAP = {
  lastUpdated: "2026-10-03",
  /* "The rest are in development or planned" stopped being the whole truth on
     2026-09-08, when lead-generation became the first entry to carry
     private_pilot. A truth statement that does not describe every shelf under
     it is not one. Written against the LABEL and not against a count, so it
     stays true whether that shelf holds one entry or none. The label for
     private_pilot has been BY INVITATION since 2026-09-19 (it was PRIVATE
     TESTING), the same words every other surface uses for it.

     NO QUANTITY, since 2026-10-03 (site audit PLATFORM-6). It said BY
     INVITATION was "offered to a few businesses", which reads as a count of
     businesses that already have it, and no client has it yet (decision #54:
     by invitation, with no volume or count claim). The same words were in
     the Lead Generation card below. tests/site-live-platform.spec.js fails
     any string in this file, or on the pages that carry its story, that puts
     a quantity on who has it. "Coming" joined the list of labels it names
     the same day, with Search Rankings and Customer Reactivation. */
  truthStatement: "Services marked AVAILABLE NOW are live today, described exactly as narrowly as they work. Anything marked BY INVITATION is offered under its own agreement, and a short call is where it starts. The rest are coming, in development, planned or being researched, and their features and pricing may change before they are ready.",
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
    /* DOOR ORDER (owner, 2026-09-12): Lead Generation first, Quote Recovery
       second, the front desk third, and then everything else. coming-soon.html
       renders each shelf in this array's order, so the array IS the order a
       buyer meets: Lead Generation heads the BY INVITATION shelf, and Quote
       Recovery opens NOW, LIVE TODAY directly ahead of the front desk. Until
       2026-10-03 the front desk opened that shelf and Quote Recovery came
       fifth (site audit COMING-2). tests/site-live-platform.spec.js reads
       the rendered page, not this comment. */
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
       it is offered by invitation, under the business's own agreement, and
       delivered by hand. No quantity: "a few businesses" stood here and in
       the desc until 2026-10-03 and read as a client count (PLATFORM-6). A person here assembles the list by
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
      desc: "Offered by invitation, under your own agreement, and done by hand. A person here reads public pages and builds you a list of the businesses that need what you do, with the page each row came from and the day it was read, so you can check any of it yourself. Each row is scored against what you told us you want, in words. You decide which rows are worth anything, nobody on the list is contacted by us, and what you tell us came of the ones you pursued is what your Results show.",
      outcome: "A call list you approved yourself, on businesses that fit the work you want.", ctaLabel: "Book a call", cta: "/book.html#pick-a-time" },
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
    /* "AI Front Desk" until v7. Since owner amendment #67 that is the name
       of the largest of three sizes (Front Desk Starter, Front Desk Plus,
       AI Front Desk), so the capability is the front desk (decision #17),
       and the card says once that it comes in sizes with the same
       receptionist (audit PLATFORM-9). The slug stays: it is the canonical
       capability key the engine's readiness gate reads. No price and no
       first month free here: the sizes' prices are on the pricing page, and
       the free month is said only behind the gate free-month.js controls. */
    { slug: "ai-front-desk", name: "Front Desk", pillar: "capture", status: "available", stage: "now",
      desc: "Answers your line 24/7, qualifies the caller, captures the request and the times that suit them, and sends you the details. You confirm the slot. It comes in three sizes, the same receptionist in each, differing only in the minutes included and the rate for each minute past them.",
      outcome: "Calls you cannot take are answered instead of going to voicemail.", cta: "/how-you-start.html" },
    /* Described the way DC#54 (2026-09-18) requires: the public website only,
       and modelled ranges rather than measurements (engine scan/page.tsx).
       The leak promise that stood here is retired. ctaLabel names the path
       "Scan my website"; coming-soon.html falls back to "Start here". */
    { slug: "pulse-scan", name: "PULSE Business Scan", pillar: "grow", status: "available", stage: "now",
      desc: "Reads only what is public on your own website and shows what it found, quoted from your own pages. Where it puts a figure on something, that figure is a modelled range from public information and market benchmarks, not a measurement of your results. Adding your real numbers sharpens it.",
      outcome: "A free, plain read of your website before you talk to anyone.", cta: "https://app.nevamis.ca/scan", ctaLabel: "Scan my website" },
    /* AVAILABLE 2026-08-19, and the claims shrank to the shipped truth
       (mirror of canonical.ts): one text per missed call, ever, with the
       business's name on it and a working opt-out — not a retry sequence,
       not form responses. What ships is what is sold. Named Missed-Call
       Recovery since 2026-09-19, the name the pricing page sells it under;
       the slug stays the canonical capability key the engine gate reads. */
    { slug: "instant-lead-follow-up", name: "Missed-Call Recovery", pillar: "convert", status: "available", stage: "now",
      desc: "A caller you missed gets one text back, between 8 a.m. and 8 p.m. your time, every day, on your say-so and with your business name on it.",
      problem: "Leads contact several companies. The fastest response usually wins the job.",
      functions: ["Missed-call text back", "One text per missed call, ever", "Your identification and a working opt-out on every message", "Hands over the moment they reply or call back"],
      outcome: "A missed caller hears from you by text, with your business name on it.", cta: "/pricing.html" },
    { slug: "automatic-lead-tracking", name: "Automatic Lead Tracking", pillar: "operate", status: "available", stage: "now",
      desc: "Each call, text and form becomes a lead with its source and a status, so you can see what is sitting untouched and what each source is actually producing.",
      problem: "Leads live in texts, notebooks, and memory. Nobody can see what is pending.",
      functions: ["A lead for every call, text and form", "Lead-source capture", "Call summaries attached to each lead", "What is sitting untouched, shown plainly", "A count of what each source produces"],
      outcome: "Nothing goes cold in a notebook.", cta: "/how-you-start.html" },
    /* AVAILABLE, and sold on the pricing page as the Get-Paid Autopilot
       add-on (canonical.ts get_paid). The slug is the engine's
       siteSlugFor("get_paid"), so the engine gate matches this row to the
       capability; its ROADMAP_UNLISTED.get_paid exemption can now go. */
    { slug: "get-paid", name: "Get-Paid Autopilot", pillar: "operate", status: "available", stage: "now",
      desc: "Overdue invoices get a gentle reminder with your approval, a firm one a week later, and at three weeks it stops emailing your customer and tells you instead.",
      functions: ["A gentle reminder when an invoice goes overdue, with your approval", "A firm reminder a week later if it stays unpaid", "At three weeks, the call comes back to you"],
      outcome: "Overdue invoices stop aging quietly.", cta: "/pricing.html" },
    /* AVAILABLE, on the row the engine gate reads by siteSlugFor("review_engine").
       Sold as an add-on and inside The Works since 2026-08-24, and missing
       from this list until 2026-09-25 (BD-9) while the page above it said
       "everything at its true status". The copy is canonical.ts's capability
       record for review_engine: its summary as desc, its `does` lines as
       functions. The one that says it never picks who to ask is the one
       buyers ask about by name, so it stays. */
    { slug: "review-engine", name: "Review Engine", pillar: "grow", status: "available", stage: "now",
      desc: "One text after a finished job, asking your customer for a review on your own link.",
      functions: ["Asks your customer for a review once after their job is finished, by text", "Sends them to your own Google review link, so the review lands on your listing", "Asks every finished job the same way: it never picks who to ask based on how the job seemed to go", "Waits for a person to release each request before it sends", "Sends during daytime hours only, and stops on STOP"],
      outcome: "Every finished job is asked the same way, on your own review link.", cta: "/pricing.html" },
    /* FUTURE, trimmed by the owner on 2026-09-19 (fix plan r15 B7). Schedule
       Protection (it presumed appointment slots the front desk cannot book),
       Web and Messaging Concierge, Smarter Job Intake and Business Knowledge
       Assistant are gone: no canonical record backs any of them. The Daily
       Brief and the Growth System stay by the owner's decision.

       THE WORDING RULE, for every entry below. Nothing on this shelf is built
       to sell, so an entry says what it WOULD do, and so does its outcome,
       if it has one. Only canonical work in development may say "Is being
       built to", which today is the Revenue Engine alone (canonical carries
       it as revenue_engine, and the site says less than canonical's
       private_pilot). The Daily Brief has no canonical capability. Search
       Rankings and Customer Reactivation are canonical modules
       (seo_rankings, reactivation) that canonical lets the site describe as
       coming, with nothing built behind either, and the Inbox Assistant is
       canonical coming_soon, so all four say "Would". An outcome in the
       present tense on an unbuilt entry is a results promise: the Growth
       System promised "measurable growth" for something only being
       researched, and the Daily Brief, the Inbox Assistant, Customer
       Reactivation and the Revenue Engine each promised a present-tense
       result until 2026-10-03 (site audit PLATFORM-7 and PLATFORM-8).
       tests/site-live-platform.spec.js holds every entry that is not
       available or by invitation to the rule, not these six by name.

       THE SAME STATUS WORD AS PRICING. Search Rankings and Customer
       Reactivation are the two items pricing-config.js lists as "Coming"
       (canonical modules seo_rankings and reactivation, which canonical
       says "may be described as coming" and may not be sold or charged).
       Their cards read COMING through statusLabel, the word the
       pricing page uses, so a buyer reading both pages meets one status.
       Search Rankings was missing from this list entirely until 2026-10-03
       (PLATFORM-3) while the page above it said "everything at its true
       status"; the spec fails any item pricing lists as coming that this
       list does not carry under that word. The status key under both is
       "planned", because the engine gate reads a closed vocabulary.

       EVERY OTHER SURFACE TAKES ITS STATUS FROM HERE. A chip for one of these
       entries on the homepage or revenue-engine.html reads the label
       coming-soon.html shows for its status (or its statusLabel), and
       scripts/check-consistency.js guard 7o fails the day one does not. */
    { slug: "seo-rankings", name: "Search Rankings", pillar: "grow", status: "planned", stage: "future", statusLabel: "COMING",
      desc: "Would help your business show up in search for the work you want more of. Nothing is built for it yet, so it has no price.",
      outcome: "Would bring you more of that work from people already searching for it." },
    { slug: "customer-reactivation", name: "Customer Reactivation", pillar: "convert", status: "planned", stage: "future", statusLabel: "COMING",
      desc: "Would reconnect with eligible past customers on your own list, inside the consent rules, when maintenance, seasonal work or a renewal may genuinely help them. Not offered until it works end to end.",
      outcome: "Would bring back repeat work from customers you already earned." },
    /* The Revenue Engine under its own name and the canonical slug since
       2026-09-19 (it was "Revenue Clarity"): ad attribution, which canonical
       carries as private_pilot. "planned" says less than that, which is
       allowed, and the engine gate logs it as a medium under-claim; it may
       never say "pilot". Not "now" and not "available": nothing is sold.
       Its card reads IN DEVELOPMENT (statusLabel), the words
       revenue-engine.html and the rest of the Roadmap page use for it: the
       card said PLANNED two screens above a module button and a link that
       both said "in development" (BD-9, 2026-09-25). The status key stays
       "planned" because the engine gate reads a closed vocabulary.

       NOT OFFERED, by invitation or otherwise (O50, decision #65,
       2026-09-26). revenue-engine.html invited applications for "the first
       builds" behind an Apply button until 2026-10-03 (site audit
       PLATFORM-1), which contradicted this card. That page's call to action
       is now this card's own interest path,
       /coming-soon.html?service=revenue-engine, which ticks this entry on
       the form below.

       No cta. It carried cta: "/revenue-engine.html", which the renderer
       ignores: coming-soon.html honours a cta only for an AVAILABLE entry
       (a "Start here" button) or a BY INVITATION one (a "Book a call"), and
       both of those mean there is something to start. A planned entry keeps
       the interest button instead, which is the only way this page measures
       who wants the Revenue Engine built. Dead config reads as a broken
       renderer to the next editor, so it is gone rather than honoured. */
    { slug: "revenue-engine", name: "Revenue Engine", pillar: "grow", status: "planned", stage: "future", statusLabel: "IN DEVELOPMENT",
      desc: "Is being built to tie each lead back to where it came from, down to the campaign, and follow it to a paid job, so you can see what to spend more on and what to stop.",
      outcome: "Would back your spending decisions with real numbers from your own jobs." },
    { slug: "daily-business-brief", name: "Your Daily Business Brief", pillar: "operate", status: "planned", stage: "future",
      desc: "Would condense calls, open leads, follow-ups, and urgent issues into one concise daily summary.",
      outcome: "Would show where the business stands in one short read." },
    /* The Inbox Assistant said "Drafts", in the present tense, until
       2026-09-26 (BD-F4). */
    { slug: "ai-inbox-assistant", name: "Inbox Assistant", pillar: "operate", status: "researching", stage: "future",
      desc: "Would draft the routine replies, flag the ones that actually need you, and never send anything without you pressing send.",
      outcome: "Would mean less time in the inbox, with nothing important buried." },
    /* No outcome at all (PLATFORM-8): "One partner, one connected system,
       measurable growth" promised a result for an idea, and a "Would"
       version could add nothing honest to the desc. coming-soon.html renders
       no outcome line for an entry without one. */
    { slug: "ai-growth-system", name: "Growth System", pillar: "grow", status: "researching", stage: "future",
      desc: "The long-term idea, being researched: whether web pages, follow-up, reactivation, reviews and attribution would work better as one connected system." }
  ]
};
