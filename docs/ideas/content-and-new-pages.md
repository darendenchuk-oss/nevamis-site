# Content and New Pages: 70 improvements

> **SUPERSEDED 2026-08-09 — the commercial model this file was written against no longer exists.**
> Ideas below were authored while Nevamis sold the C$249 / C$449 / C$849 ladder (plans named
> After Hours, Growth and Scale), a Pay As You Go tier at C$49 + C$1.95/min, annual prepay, a
> setup fee with a founding-client waiver, and a 7-day live pilot — free at first, then C$150.
> Every one of those is retired, and the single-recurring-price model that replaced them on
> 2026-08-09 was itself superseded by v4 (2026-08-22) and then by v5 (owner
> directive 2026-08-24). The current model is a
> one-time Launch & Implementation fee to start, then a monthly price:
> **The Works** C$3,000 to start, then C$2,100/month (1,400 included minutes, C$0.75/min overage);
> **AI Front Desk** (recommended) C$1,500 to start, then C$1,000/month (1,400 included minutes, C$0.75/min overage);
> **Performance Partnership** (invite-only) from C$2,500 to start, then C$350/month plus 10% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities (250 included minutes, C$1.10/min overage).
> Sellable add-ons, each its own sale on its own three-month start:
> Missed-Call Recovery C$350/month, Quote-Chase Engine C$500/month, Get-Paid Autopilot C$500/month,
> Review Engine C$300/month — each with a one-time Launch & Implementation fee of its own
> (C$500, C$750, C$750, C$500).
> Terms: three months minimum on a plan alone, six with any add-on or The Works,
> then month to month on thirty days notice, with the price locked for twelve months.
> No pilot or trial at any price. `pricing-config.js` and the engine's
> `src/domain/canonical.ts` are the source of truth.
>
> The ideas are kept rather than deleted: most are about how a price is *presented*, and that work
> survives the change. But no figure, plan name or offer quoted below may be copied onto a surface,
> and any idea whose whole premise is a setup fee, a pilot, PAYG or annual prepay is moot.


Nevamis today is a ten-URL site (`sitemap.xml`) with one very strong homepage and no
content layer underneath it. There is no industry page, no use-case page, no comparison
page, no location page, no glossary, and no guide. That is the single largest addressable
gap between "we have a real product" and "Edmonton trades owners find us and book a call",
and it is content work rather than software work, which is exactly what the business needs
right now. The list below starts with the plumbing that makes a content layer survivable on
a no-build static site (`scripts/check-consistency.js` enforces byte-identical nav and
footer across every content page, so hand-copying twenty pages would be a maintenance
disaster), then works through industry, use-case, comparison, location, glossary, guide,
and trust assets. Every entry is written to be shippable without inventing a client, a
statistic, a logo, or a testimonial: where proof would normally go, we substitute the live
demo line, the published claims ledger, and the free pilot. Ratings are impact (revenue or
pipeline effect) over effort (a solo non-technical founder's day).

1. **CONTENT-AND-NEW-PAGES-001 — Build a partial injector before writing a single new page.**
   `scripts/check-consistency.js` requires the `<nav class="main-nav">` block and the footer
   Site column to be byte-identical across all ten content pages; adding twenty more pages by
   copy-paste guarantees drift and a red build. Create `_partials/head.html`, `_partials/nav.html`,
   `_partials/footer.html`, `_partials/scripts.html` plus `scripts/build-pages.mjs` that expands
   `<!--#include nav-->` markers in `src/*.html` into the committed root `*.html`. Do this first;
   every idea below gets roughly 4x cheaper once it exists.
   impact 5/5 · effort 2/5 · touches: scripts/build-pages.mjs (new), _partials/ (new), scripts/check-consistency.js

2. **CONTENT-AND-NEW-PAGES-002 — Create one content-page shell template derived from about.html.**
   `about.html` is the lightest full-footer page in the repo (134 lines) and already carries the
   correct head block, JSON-LD stub, `.about-hero`, `.tight` section, `.midcta`, and callbar.
   Save it as `_templates/content-page.html` with `{{TITLE}}`, `{{DESCRIPTION}}`, `{{CANONICAL}}`,
   `{{H1}}`, `{{BODY}}`, `{{RELATED}}` tokens so a new page is a fifteen-minute job, not a
   two-hour one. Include the `data-evt="hero_book_call_click"` and `demo_phone_click` CTA pair by
   default so every new page is instrumented on arrival.
   impact 5/5 · effort 1/5 · touches: _templates/content-page.html (new), about.html

3. **CONTENT-AND-NEW-PAGES-003 — Replace the hardcoded PAGES array in gen-sitemap.mjs with a manifest.**
   `scripts/gen-sitemap.mjs` has ten hardcoded `["file","url","priority"]` rows, so every new page
   silently misses the sitemap until someone remembers. Introduce `content-map.json` (slug, file,
   title, description, cluster, target query, priority, status) and have gen-sitemap read it. The
   same file then drives the hub page, the related-links block, `llms.txt`, and the Playwright
   page tests, so one row adds a page everywhere.
   impact 4/5 · effort 2/5 · touches: content-map.json (new), scripts/gen-sitemap.mjs, sitemap.xml

4. **CONTENT-AND-NEW-PAGES-004 — Add a manifest-driven page test spec so thin pages cannot ship.**
   `tests/pages.spec.js` currently only exercises the ten existing pages. Add
   `tests/content-pages.spec.js` that loops `content-map.json` and asserts: exactly one `<h1>`,
   title under 60 chars, description 120 to 158 chars, a canonical, a `BreadcrumbList`, at least
   350 words of body text, at least two internal links, and zero em dashes. That last check is
   already the house rule in `check-consistency.js` and this extends it to every new page
   automatically.
   impact 4/5 · effort 2/5 · touches: tests/content-pages.spec.js (new), content-map.json

5. **CONTENT-AND-NEW-PAGES-005 — Ship a /solutions.html hub so the nav never bloats.**
   The header nav already carries eight items plus two buttons and starts wrapping on mobile at
   880px (`.navitem` media query in home.html). Adding fifteen pages to the nav is not an option, so
   build one hub page with three labelled columns (By trade, By situation, Compared to) rendered
   from `content-map.json`, and add a single nav entry "Solutions" between "How it works" and
   "Pricing". The hub is also the crawl path that gets every child page indexed without relying on
   the sitemap alone.
   impact 4/5 · effort 2/5 · touches: solutions.html (new), _partials/nav.html, footer Site column

6. **CONTENT-AND-NEW-PAGES-006 — Add a breadcrumb component plus BreadcrumbList JSON-LD.**
   Every child page needs a visible "Home / Solutions / Electricians" trail and matching
   `BreadcrumbList` schema; Google renders breadcrumbs in place of the ugly URL and it materially
   helps deep pages look like part of a real site rather than doorway pages. Add a `.crumbs` rule
   to `assets/motion/site.css` (mono 11.5px, `var(--muted)`, mint on hover, matching the existing
   `.eyebrow` treatment) and emit the JSON-LD from the template.
   impact 3/5 · effort 1/5 · touches: assets/motion/site.css, _templates/content-page.html

7. **CONTENT-AND-NEW-PAGES-007 — Add a three-link "Related" block to the bottom of every new page.**
   Deep content pages die of orphan status. Render three related links from `content-map.json`
   cluster metadata above the final CTA on every child page, styled with the existing `.proc>div`
   card treatment so no new CSS is needed. Rule of thumb per page: one sibling in the same cluster,
   one cross-cluster page, and one money page (`/pricing.html` or `/pilot.html`).
   impact 3/5 · effort 1/5 · touches: _templates/content-page.html, content-map.json, assets/motion/site.css

8. **CONTENT-AND-NEW-PAGES-008 — Write a content quality gate into docs and enforce it in review.**
   Programmatic-looking pages get filtered, and a solo founder is tempted to spin thirty near
   identical pages. Write `docs/CONTENT-STANDARD.md` requiring every new page to have at least five
   genuinely unique elements: a trade-specific opening scenario, a trade-specific intake question
   list, a trade-specific objection, a trade-specific rules block, and either its own audio clip or
   its own FAQ triplet. Pages that cannot clear it stay unpublished rather than shipping thin.
   impact 4/5 · effort 1/5 · touches: docs/CONTENT-STANDARD.md (new)

9. **CONTENT-AND-NEW-PAGES-009 — Ship the electrician page: /answering-service-for-electricians.html.**
   Target query "electrician answering service" and "after hours answering service electrician".
   Outline: hook (panel dead at 8pm, the caller has three numbers and you are the second), the six
   intake questions an electrical call actually needs (service vs new install, panel amperage,
   breaker or no power, commercial or residential, permit involved, address and access), a "what it
   never guesses" block (it will not quote a panel upgrade), and the free pilot CTA. Reuse
   `assets/industries/electrical.webp` and the Cedarview Electric example call already on
   `home.html` and `demo.html`, keeping its "Example call (fictional)" label per CLM-14.
   impact 5/5 · effort 2/5 · touches: answering-service-for-electricians.html (new), assets/industries/electrical.webp

10. **CONTENT-AND-NEW-PAGES-010 — Ship the HVAC page: /answering-service-for-hvac.html.**
    Target "HVAC answering service" and "furnace repair after hours answering". Lead with the
    Edmonton specific: minus 30 at 11pm, no heat, a family with a baby, and every competitor's
    voicemail. Intake block: no heat vs no cool, furnace age and brand, thermostat reading, is
    anyone vulnerable in the home, is it a rental (landlord approval), and gas smell (immediate
    transfer rule, not a booking). The gas-smell escalation rule is the single most persuasive
    paragraph you can write for an HVAC owner because it proves the AI has a stop condition.
    impact 5/5 · effort 2/5 · touches: answering-service-for-hvac.html (new), assets/industries/hvac.webp

11. **CONTENT-AND-NEW-PAGES-011 — Split plumbing out of the HVAC card into /answering-service-for-plumbers.html.**
    The homepage `#industries` section currently merges "HVAC and plumbing" into one card, which is
    fine visually but wrong for search: "plumber answering service" is its own query with its own
    intent. Give plumbing its own page built around water-now urgency: is water actively running,
    do you know where the shut-off is (the AI can talk them through it before the truck arrives),
    sewer backup vs supply leak, one fixture or whole house, and basement finished or not. The
    shut-off coaching line is a genuine differentiator over voicemail and it costs nothing to
    configure.
    impact 5/5 · effort 2/5 · touches: answering-service-for-plumbers.html (new), home.html #industries card copy

12. **CONTENT-AND-NEW-PAGES-012 — Ship the restoration page: /answering-service-for-restoration.html.**
    Target "water damage answering service" and "restoration 24/7 call answering". Restoration is
    the strongest fit in the entire trade list because the calls are 24/7, high ticket, and
    insurance-driven, and the caller is upset. Outline: a calm-first script sample, insurance intake
    (carrier, claim number if any, adjuster contact), category of water, standing water yes/no,
    occupancy, and an explicit "the AI does not promise coverage or timelines" honesty block.
    impact 5/5 · effort 2/5 · touches: answering-service-for-restoration.html (new), assets/industries/restoration.webp

13. **CONTENT-AND-NEW-PAGES-013 — Ship the auto shop page: /answering-service-for-auto-repair.html.**
    Target "auto shop answering service" and "mechanic phone answering". The pitch is different from
    the trades: not emergencies but the forty repeat questions a service advisor answers per day
    while a customer stands at the counter. Outline: year/make/model capture, symptom in the
    caller's own words, drop-off vs wait, shuttle question, "do you do X brand", and booking into the
    bay calendar; plus the honest note that price quoting stays off unless the owner approves a
    fixed menu.
    impact 4/5 · effort 2/5 · touches: answering-service-for-auto-repair.html (new), assets/industries/automotive.webp

14. **CONTENT-AND-NEW-PAGES-014 — Ship /answering-service-for-garage-door-companies.html.**
    Garage door is an under-served, high-intent niche with genuine after-hours pain (car trapped
    inside, door stuck open in winter). Intake: door open or closed and stuck which way, is the car
    trapped, spring broken (audible bang), opener brand, door size, and whether the home is secure
    right now. The "door stuck open overnight in January" scenario is a two-sentence hook that
    writes itself and no competitor page in Alberta is targeting it.
    impact 4/5 · effort 2/5 · touches: answering-service-for-garage-door-companies.html (new)

15. **CONTENT-AND-NEW-PAGES-015 — Ship /answering-service-for-roofing-companies.html.**
    Roofing calls cluster hard around hail and wind events, which is exactly when a small crew
    cannot answer the phone. Outline the storm-surge angle: an event day can produce a month of
    calls in six hours, the AI takes all of them at once instead of one at a time, and it captures
    insurance claim status and roof age up front so the estimator's day is pre-sorted. Reference the
    real Alberta hail season (June to August) rather than generic weather language.
    impact 4/5 · effort 2/5 · touches: answering-service-for-roofing-companies.html (new)

16. **CONTENT-AND-NEW-PAGES-016 — Ship /answering-service-for-landscaping-and-snow-removal.html.**
    This is the most seasonal page on the site and the most Edmonton-specific: the phone melts
    during the first real snowfall and again in April. Outline: a snow-event mode where the AI takes
    fifty simultaneous calls and confirms route position instead of promising a time, commercial
    contract vs residential one-off triage, and the spring cleanup booking rush. Publish it in
    September so it has time to index before the first storm.
    impact 4/5 · effort 2/5 · touches: answering-service-for-landscaping-and-snow-removal.html (new)

17. **CONTENT-AND-NEW-PAGES-017 — Ship /answering-service-for-appliance-repair.html.**
    Appliance repair has the highest ratio of qualifying-question waste in the trades: brand, model,
    age, symptom, warranty, and whether the unit is even worth fixing. Build the page around a
    "questions answered before you pick up the phone" table, plus the model-number capture trick
    (the AI asks where the sticker is on that appliance type). Close with the honest note that the
    AI does not diagnose, it collects.
    impact 3/5 · effort 2/5 · touches: answering-service-for-appliance-repair.html (new)

18. **CONTENT-AND-NEW-PAGES-018 — Ship /answering-service-for-locksmiths.html.**
    Locksmith is a 24/7, entirely missed-call-driven business where the second-ranked provider wins
    by picking up. Outline: locked out of home/car/business, is anyone or any pet inside, address
    and safety, ID verification policy stated up front (the AI states the owner's policy, it does not
    invent one), and immediate transfer for genuine emergencies. Include the fraud-screening angle,
    which owners in this trade care about more than booking speed.
    impact 3/5 · effort 2/5 · touches: answering-service-for-locksmiths.html (new)

19. **CONTENT-AND-NEW-PAGES-019 — Ship /answering-service-for-towing-companies.html.**
    Towing is pure missed-call economics: every unanswered ring is a dispatch that went to another
    truck within sixty seconds. Outline: location capture including highway direction and nearest
    exit, vehicle drivable or not, all-wheel-drive (flatbed required), occupants safe, and insurance
    or motor-club billing. State clearly that the AI does not dispatch, it captures and alerts, so
    nobody expects routing logic that does not exist yet.
    impact 3/5 · effort 2/5 · touches: answering-service-for-towing-companies.html (new)

20. **CONTENT-AND-NEW-PAGES-020 — Ship /answering-service-for-renovation-contractors.html.**
    General contractors and renovators get long, unqualified calls that waste a whole afternoon, so
    the value here is filtering rather than speed. Build it around a budget-and-scope qualification
    block the owner approves in advance (project type, rough budget band, timeline, own the property,
    permit awareness), so the owner only calls back the callers worth an hour. Pair it with an
    honest line that the AI never quotes a renovation.
    impact 3/5 · effort 2/5 · touches: answering-service-for-renovation-contractors.html (new)

21. **CONTENT-AND-NEW-PAGES-021 — Record one real industry-specific example call per industry page.**
    The homepage's biggest proof asset is the eleven-clip Cedarview Electric audio in `assets/call-*.mp3`
    wired through `site.js`. Record the same treatment for four more scenarios on the live agent
    (no-heat HVAC, burst pipe, water damage intake, brake noise booking), export the clips as
    `assets/calls/<industry>-N.mp3`, and reuse the existing `.call-card` player markup. Each clip
    must carry the same "Example call (fictional)" label at first exposure that CLM-14 requires.
    impact 5/5 · effort 3/5 · touches: assets/calls/ (new), site.js player, industry pages, docs/CLAIMS-LEDGER.md

22. **CONTENT-AND-NEW-PAGES-022 — Publish the actual intake question sets as reusable content blocks.**
    Every industry page above needs an intake list, and those same lists are what you walk a
    prospect through on the strategy call. Write them once into `docs/intake-questions/<trade>.md`,
    render them into the pages, and reuse the same markdown as the discovery script in
    `docs/client-discovery-plan.md`. Content that doubles as sales collateral is the definition of
    compounding work for a solo founder.
    impact 4/5 · effort 2/5 · touches: docs/intake-questions/ (new), docs/client-discovery-plan.md, industry pages

23. **CONTENT-AND-NEW-PAGES-023 — Give each industry page three FAQs that no competitor page answers.**
    Generic FAQs ("will it sound robotic") already live on the homepage at lines 740 to 753 and
    repeating them wastes the page. Write three trade-specific ones instead per page, for example
    for HVAC: "What does it do if someone says they smell gas?", "Can it tell a no-heat call from a
    maintenance call?", "What happens if forty people call during a cold snap at once?". Mark them
    up as `FAQPage` JSON-LD, which is the highest-yield schema per minute of work available here.
    impact 4/5 · effort 2/5 · touches: industry pages, _templates/content-page.html

24. **CONTENT-AND-NEW-PAGES-024 — Ship /after-hours-call-answering.html as the flagship use-case page.**
    "After Hours" is a literal plan name in `pricing-config.js` at C$249 and there is no page that
    owns the phrase. Outline: what actually happens to a 9pm call today (voicemail, then the next
    listing), the coverage window options, the conditional-forwarding mechanics, what the owner wakes
    up to (a summary, not a voicemail), and the C$249 plan rendered from `window.NV_PRICING` rather
    than hardcoded. This page is the natural landing target for the entire evening-and-weekend
    keyword family.
    impact 5/5 · effort 2/5 · touches: after-hours-call-answering.html (new), pricing-config.js render

25. **CONTENT-AND-NEW-PAGES-025 — Ship /overflow-call-answering.html for the busy-line case.**
    The homepage `#solutions` tabs already carry After hours / Overflow / Full-time front line copy;
    promote the Overflow tab into a page rather than rewriting it. Add what the tab cannot fit: the
    two-ring rule, how a busy signal is handled versus a no-answer, what happens when the office
    person is on another line, and why a second human is 4x the cost of overflow coverage. Link the
    tab panel to the page so the homepage feeds it.
    impact 4/5 · effort 2/5 · touches: overflow-call-answering.html (new), home.html #panelOver

26. **CONTENT-AND-NEW-PAGES-026 — Ship /missed-call-recovery.html around the highest-intent phrase in the category.**
    "Missed call" is the language owners actually use and the site currently only says it in passing.
    Outline: the ninety-second window, the difference between a missed-call text-back and a missed
    call answered, what the AI does on the call that a text can never do (qualify, book, confirm),
    and an embedded compact version of the existing ROI calculator (`#roiForm` in home.html) so the
    page has an interactive hook. Fire the existing `roi_calculator_complete` event from it.
    impact 5/5 · effort 3/5 · touches: missed-call-recovery.html (new), site.js ROI module, home.html #roi

27. **CONTENT-AND-NEW-PAGES-027 — Ship /weekend-and-holiday-call-coverage.html.**
    Statutory holidays are a genuinely distinct buying trigger in the trades because everyone is
    closed and the calls do not stop. Outline: an Alberta stat-holiday list with the trades that
    still get emergency calls on each, holiday-specific greeting and pricing disclosure rules the
    owner approves, and the reality that the AI does not take a long weekend. Publish it in late
    November so it is indexed for the Christmas shutdown window.
    impact 3/5 · effort 2/5 · touches: weekend-and-holiday-call-coverage.html (new)

28. **CONTENT-AND-NEW-PAGES-028 — Ship /answering-service-for-owner-operators.html for the one-truck shop.**
    The single largest addressable segment in Edmonton is the owner who is the technician, the
    dispatcher, and the bookkeeper, and who physically cannot answer while under a truck or in an
    attic. Write the page in second person around that day: what happens to the three calls you miss
    between 10am and 2pm, what the summary text looks like when you climb down, and why the
    C$249 After Hours plan is often the right first step rather than Growth. This is also the most
    honest fit for a business with no clients yet: small, cheap, easy to prove.
    impact 5/5 · effort 2/5 · touches: answering-service-for-owner-operators.html (new)

29. **CONTENT-AND-NEW-PAGES-029 — Ship /seasonal-call-surge.html for peak-week capacity.**
    Every trade on this site has a week where call volume triples: first freeze, first thaw, first
    hail, first heat wave. Build the page around the concurrency argument, which is the one thing a
    human answering service structurally cannot match: the AI answers the fifth simultaneous call
    exactly as fast as the first. Be precise about the limits too (minutes are metered, see the
    `usagePolicy` block in pricing-config.js), so the page never overpromises unlimited capacity.
    impact 4/5 · effort 2/5 · touches: seasonal-call-surge.html (new), pricing-config.js usagePolicy

30. **CONTENT-AND-NEW-PAGES-030 — Ship /vacation-and-sick-day-coverage.html.**
    Owners do not take vacations because the phone does not stop, which is an emotional buying
    trigger rather than an economic one and it converts differently. Outline: a two-week coverage
    plan, what the AI escalates while you are away versus what it holds, the daily digest instead of
    forty interruptions, and the honest note that someone still has to run the jobs it books.
    Position the free pilot as literally "test it the week before you leave".
    impact 3/5 · effort 2/5 · touches: vacation-and-sick-day-coverage.html (new)

31. **CONTENT-AND-NEW-PAGES-031 — Ship /call-screening-and-spam-filtering.html.**
    Trades owners in Alberta get relentless SEO and merchant-services spam calls, and screening is a
    pain they feel daily even when they are not losing jobs. Outline honestly: the AI answers, states
    it is an AI, and applies the owner's rules, so sales calls end at the agent instead of on the
    owner's cell; but be explicit per `usagePolicy` that spam calls do consume AI minutes because the
    system handled them. That honesty note is exactly the kind of detail that earns trust on a first
    read.
    impact 3/5 · effort 2/5 · touches: call-screening-and-spam-filtering.html (new), pricing-config.js usagePolicy

32. **CONTENT-AND-NEW-PAGES-032 — Ship /ai-receptionist-vs-voicemail.html and give the homepage headline a home.**
    The homepage `#compare` section already carries the line "Voicemail records the lost job.
    Nevamis books it." and a comparison table; that argument deserves a page that can rank. Expand
    it into: the voicemail funnel (leave a message, wait, get called back, already booked elsewhere),
    what a voicemail costs when the caller does not leave one, and a rewrite of the owner's voicemail
    greeting for the day they switch. Link `#compare` to it as a "read the full comparison" line.
    impact 5/5 · effort 2/5 · touches: ai-receptionist-vs-voicemail.html (new), home.html #compare

33. **CONTENT-AND-NEW-PAGES-033 — Ship /ai-receptionist-vs-answering-service.html.**
    This is the highest commercial-intent comparison in the category because the buyer already has
    budget allocated. Compare on the axes a buyer actually feels: per-minute billing and the
    incentive it creates, script depth, whether the operator can book into your calendar, hold times
    at peak, and consistency at 3am. Cite only publicly published competitor pricing, with a "prices
    verified on <date>" line and a matching row in `docs/CLAIMS-LEDGER.md`.
    impact 5/5 · effort 3/5 · touches: ai-receptionist-vs-answering-service.html (new), docs/CLAIMS-LEDGER.md

34. **CONTENT-AND-NEW-PAGES-034 — Ship /ai-receptionist-vs-hiring-a-receptionist.html with sourced Alberta cost math.**
    Owners benchmark against a person, so the page must do the fully loaded arithmetic honestly:
    Alberta wage range (cite Alberta OCCinfo or Job Bank with the retrieval date), plus CPP, EI, WCB,
    vacation, statutory holidays, training, turnover, and the eight-hour coverage ceiling against
    C$1,000/mo for 1,400 minutes. Present it as a worked example with every input visible and editable
    rather than a single dramatic number. Add a row to the claims ledger for each cited source.
    impact 5/5 · effort 3/5 · touches: ai-receptionist-vs-hiring-a-receptionist.html (new), docs/CLAIMS-LEDGER.md

35. **CONTENT-AND-NEW-PAGES-035 — Ship /ai-receptionist-vs-missed-call-text-back.html.**
    Missed-call text-back apps are the cheapest competitor and the most common objection you will
    hear at C$249. Be genuinely fair: text-back is fast, cheap, and better than nothing, and it works
    when the caller is happy to type. Then draw the honest line: it cannot ask a follow-up question,
    it cannot book, and it does not work for the 11pm no-heat caller who wants a human voice, and
    close with "run both during the free pilot and compare".
    impact 4/5 · effort 2/5 · touches: ai-receptionist-vs-missed-call-text-back.html (new)

36. **CONTENT-AND-NEW-PAGES-036 — Ship /ai-receptionist-vs-building-it-yourself.html.**
    A minority of prospects will have seen a Vapi or Retell demo on YouTube and think they can build
    it in a weekend; this page converts them by agreeing with the premise and then listing the work.
    Cover honestly: telephony number provisioning and carrier config, prompt engineering against real
    call recordings, calendar integration and timezone handling, escalation rules, disclosure and
    recording compliance, and ongoing tuning. The homepage `#build-stack` section already says "Not
    an app. A configured system." so this page is its long form.
    impact 4/5 · effort 2/5 · touches: ai-receptionist-vs-building-it-yourself.html (new), home.html #build-stack

37. **CONTENT-AND-NEW-PAGES-037 — Ship /ai-receptionist-vs-forwarding-to-your-cell.html.**
    Forwarding to a cell is what almost every one-truck Edmonton shop actually does today, so this
    is the true status quo competitor and nobody writes about it. Outline: what happens when you
    answer on a roof with wind noise, the calls you decline because your hands are full, the
    unprofessional first impression, and the fact that the customer now has your personal number
    forever. Position conditional forwarding (answer when you can, AI catches the rest) as the fix
    rather than an all-or-nothing switch.
    impact 4/5 · effort 2/5 · touches: ai-receptionist-vs-forwarding-to-your-cell.html (new)

38. **CONTENT-AND-NEW-PAGES-038 — Ship /ai-receptionist-vs-phone-menu-ivr.html.**
    "Press 1 for service" is what larger shops installed a decade ago and everyone hates it,
    including the owners who bought it. Compare on the caller's experience: an IVR routes, an AI
    understands; an IVR needs the caller to know your department names, an AI just asks what broke.
    Include the honest limitation that a well-built IVR is deterministic and an AI is probabilistic,
    which is precisely why the escalation and never-guess rules exist.
    impact 3/5 · effort 2/5 · touches: ai-receptionist-vs-phone-menu-ivr.html (new)

39. **CONTENT-AND-NEW-PAGES-039 — Create docs/COMPARISON-SOURCES.md and a "verified on" line for every comparison claim.**
    Comparison pages are where an honest business most easily drifts into unverifiable claims, and
    `check-consistency.js` cannot catch a false statement about a competitor. Keep a table of every
    external number used, with the URL, the exact quoted figure, the retrieval date, and a screenshot
    filename; render the date on the page itself. Add a recurring quarterly task to re-verify, and a
    ledger row (CLM-17 onward) covering the comparison cluster as a whole.
    impact 4/5 · effort 1/5 · touches: docs/COMPARISON-SOURCES.md (new), docs/CLAIMS-LEDGER.md, comparison pages

40. **CONTENT-AND-NEW-PAGES-040 — Ship /edmonton-answering-service-alternatives.html as the category-capture page.**
    Owners search "Edmonton answering service" long before they search "AI receptionist", and that
    query is the top of the funnel for this entire business. Write a genuinely useful buyer's guide
    to the options available locally (traditional live answering, virtual receptionist, in-house
    hire, text-back app, AI receptionist), with an honest strengths-and-weaknesses paragraph each and
    Nevamis presented as one option among them. Earning the click on an unbiased comparison
    outperforms a self-serving one, and it is the only honest way to rank for a category term when
    you have no clients yet.
    impact 5/5 · effort 3/5 · touches: edmonton-answering-service-alternatives.html (new), docs/COMPARISON-SOURCES.md

41. **CONTENT-AND-NEW-PAGES-041 — Ship /edmonton-ai-receptionist.html as the flagship local page.**
    The homepage already carries `geo.region CA-AB` and an Edmonton `PostalAddress` in its JSON-LD,
    but no page owns the local query. Outline: built in Edmonton by a person you can call, local
    number and Mountain Time hours, the Edmonton-specific seasonal call patterns (first freeze,
    spring thaw, hail), Edmonton trade context (permits, service areas across the Anthony Henday),
    and a `LocalBusiness` or `ProfessionalService` JSON-LD with `areaServed` set honestly to a service
    area rather than a storefront address.
    impact 5/5 · effort 2/5 · touches: edmonton-ai-receptionist.html (new), schema JSON-LD

42. **CONTENT-AND-NEW-PAGES-042 — Ship /calgary-ai-receptionist.html with genuinely Calgary content.**
    Calgary is a second market you can serve on day one because the product is telephony, not
    trucks; the honesty requirement is that the page must never imply a Calgary office. Give it real
    local substance: Chinook wind swings driving HVAC call spikes, the different trade mix, and an
    explicit "we are Edmonton-based and serve Calgary remotely, here is exactly what that means for
    you" paragraph. That transparency paragraph is what separates this from doorway-page spam.
    impact 4/5 · effort 2/5 · touches: calgary-ai-receptionist.html (new)

43. **CONTENT-AND-NEW-PAGES-043 — Ship /red-deer-and-central-alberta-ai-receptionist.html.**
    Central Alberta trades are underserved by answering services and the drive-time economics make
    missed calls more expensive there, because a wasted trip costs an hour each way. Build the page
    around service-radius qualification: the AI asks the address first and applies the owner's
    radius rule before booking, so nobody drives to Ponoka for a job they do not take. That single
    feature is a stronger local hook than any generic "we serve Red Deer" copy.
    impact 3/5 · effort 2/5 · touches: red-deer-and-central-alberta-ai-receptionist.html (new)

44. **CONTENT-AND-NEW-PAGES-044 — Ship one Greater Edmonton communities page rather than five thin suburb pages.**
    St. Albert, Sherwood Park, Spruce Grove, Leduc, Stony Plain, and Fort Saskatchewan each have real
    search volume but not enough distinct substance for separate pages, and five near-duplicates is
    exactly the pattern that gets filtered. Write `/greater-edmonton-service-area.html` with a genuinely
    different paragraph per community (trade mix, commute realities, who serves them today) and one
    anchor per community so specific queries land on the relevant section. Revisit splitting only
    if a single community actually produces booked calls.
    impact 3/5 · effort 2/5 · touches: greater-edmonton-service-area.html (new), content-map.json

45. **CONTENT-AND-NEW-PAGES-045 — Ship /alberta-ai-receptionist.html as the province hub.**
    A province page gives the location cluster a parent, prevents the city pages from looking
    orphaned, and is the right place for provincial content that does not belong on a city page:
    Alberta PIPA versus federal PIPEDA, Alberta trade licensing context, and the two-market
    (Edmonton/Calgary) reality. Link it from `/solutions.html` and to every city page, and keep the
    city pages linking back up.
    impact 3/5 · effort 2/5 · touches: alberta-ai-receptionist.html (new), solutions.html

46. **CONTENT-AND-NEW-PAGES-046 — Ship /ai-receptionist-canada.html covering the honest national position.**
    `llms.txt` already says "Canadian businesses" and the Organization schema sets `areaServed` to
    Canada, so a national page is consistent rather than a stretch. Cover what is genuinely national:
    CASL, PIPEDA, Canadian dollar pricing with GST, Canadian phone numbers, time-zone handling for a
    Halifax or Vancouver client, and the honest statement that the founder works Mountain Time.
    Avoid any per-province page farm until there is a client in that province.
    impact 3/5 · effort 2/5 · touches: ai-receptionist-canada.html (new), llms.txt

47. **CONTENT-AND-NEW-PAGES-047 — Write a location-page policy that blocks the doorway-page failure mode.**
    The tempting move at month three is thirty city pages with the name swapped, which risks the whole
    domain. Add a rule to `docs/CONTENT-STANDARD.md`: no location page ships without a local phone
    number reference, a locally true seasonal or regulatory detail, an explicit remote-service
    disclosure, and at least 400 words of non-templated body. Ship location pages one at a time and
    only after the previous one has produced at least one inbound.
    impact 4/5 · effort 1/5 · touches: docs/CONTENT-STANDARD.md

48. **CONTENT-AND-NEW-PAGES-048 — Align the Edmonton page with a Google Business Profile as a service-area business.**
    A service-area GBP (no public address) is legitimate for this business and is the highest-leverage
    local asset available for zero dollars, but it needs on-site content that matches: identical
    business name, the same `(587) 413-0035` number, the same service-area list, and the same category
    language. Make `/edmonton-ai-receptionist.html` the GBP website link and mirror the profile's
    service list as a visible section. Do not create the profile until the page exists, or the listing
    points at a generic homepage.
    impact 4/5 · effort 2/5 · touches: edmonton-ai-receptionist.html, GBP (external)

49. **CONTENT-AND-NEW-PAGES-049 — Ship /glossary.html as a real hub, not a filler page.**
    Owners evaluating this category hit twenty unfamiliar terms and every one is a moment of doubt.
    Build a single-page glossary with anchor links and `DefinedTermSet` JSON-LD covering: AI
    receptionist, virtual receptionist, answering service, connected AI minute, call flow, intake,
    qualification, escalation, warm transfer, conditional call forwarding, IVR, barge-in, latency,
    call disclosure, and overage. One page beats fifteen thin term pages and is far more likely to be
    cited by an AI assistant.
    impact 4/5 · effort 2/5 · touches: glossary.html (new)

50. **CONTENT-AND-NEW-PAGES-050 — Make "connected AI minute" the glossary's flagship entry and link every price surface to it.**
    `pricing-config.js` defines it precisely ("starts when the AI answers a connected call and ends
    when the AI portion of the call ends") plus four usage notes including the honest spam-consumes-
    minutes point. Give it a full anchor section with a worked example (a 3 minute 20 second call on
    the 1,400-minute AI Front Desk plan), and link every occurrence of "minutes" on `/pricing.html` and the
    homepage pricing preview to `/glossary.html#connected-ai-minute`. Billing-unit confusion is a
    real deal-killer and this removes it for free.
    impact 4/5 · effort 1/5 · touches: glossary.html, pricing.html, home.html #pricing-preview

51. **CONTENT-AND-NEW-PAGES-051 — Write the definitional page: /what-is-an-ai-receptionist.html.**
    This is the top-of-funnel informational query for the entire category and it is the page most
    likely to be quoted by ChatGPT, Perplexity, and AI Overviews. Structure it for extraction: a
    40-word direct definition in the first paragraph, then how it works in five steps, what it can and
    cannot do, how it differs from a chatbot and from an answering service, and what it costs in
    Canada. Add it to `llms.txt` under Pages as the canonical explainer.
    impact 5/5 · effort 2/5 · touches: what-is-an-ai-receptionist.html (new), llms.txt

52. **CONTENT-AND-NEW-PAGES-052 — Write /how-to-set-up-conditional-call-forwarding.html for Canadian carriers.**
    This is the highest-utility page on the whole list: it is the exact thing a new client must do,
    it is genuinely hard to find, and it earns links from people who are not even prospects. Cover
    Telus, Rogers, Bell, Shaw/Rogers business, and Koodo with the star codes for busy-forward and
    no-answer-forward, how to test it, and how to switch it off from the handset. Frame it as
    carrier-published codes with a verification date rather than as guaranteed, and it doubles as the
    onboarding doc in `docs/onboarding/`.
    impact 5/5 · effort 3/5 · touches: how-to-set-up-conditional-call-forwarding.html (new), docs/onboarding/README.md

53. **CONTENT-AND-NEW-PAGES-053 — Write /call-recording-and-ai-disclosure-in-canada.html.**
    Every owner asks whether recording is legal and whether they have to tell callers, and `llms.txt`
    already states that AI disclosure and recording notice are mandatory for Nevamis, not optional.
    Explain Canada's one-party consent framework in plain language, what the Nevamis agent actually
    says at the top of a call, what the business remains responsible for, and where PIPEDA and Alberta
    PIPA apply. Mark it clearly as general information rather than legal advice, consistent with the
    BLOCKED status of CLM-16 in the claims ledger.
    impact 4/5 · effort 2/5 · touches: call-recording-and-ai-disclosure-in-canada.html (new), docs/CLAIMS-LEDGER.md

54. **CONTENT-AND-NEW-PAGES-054 — Write /casl-and-customer-texts.html covering the SMS confirmation question.**
    The product texts the customer a confirmation, so CASL is a real question an informed owner will
    raise and answering it pre-empts an objection at exactly the right moment. Explain implied consent
    from an inbound service call, transactional versus promotional messages, the unsubscribe
    requirement, and why Nevamis confirmations are transactional. Cross-link it from the confirmation
    step in the homepage `#how` process list.
    impact 3/5 · effort 2/5 · touches: casl-and-customer-texts.html (new), home.html #how

55. **CONTENT-AND-NEW-PAGES-055 — Write /keep-your-phone-number.html on forwarding versus porting.**
    "Do I lose my number?" is the number-one blocker on every discovery call and the homepage FAQ
    answers it in three sentences. Give it a full page: forwarding keeps your number and your carrier
    untouched, what a Nevamis number is for, why porting is not required, how to reverse it in sixty
    seconds, and what your customers see on caller ID. Link it from the FAQ answer at home.html line
    742 so the short answer feeds the long one.
    impact 4/5 · effort 1/5 · touches: keep-your-phone-number.html (new), home.html FAQ

56. **CONTENT-AND-NEW-PAGES-056 — Write /what-the-ai-will-never-say.html as the trust centrepiece.**
    Owners' deepest fear is not that the AI sounds robotic, it is that it will promise a price or a
    time it cannot keep and cost them a customer. Publish the actual guardrail categories: no quoting
    outside an approved fixed menu, no committing to arrival windows outside calendar rules, no
    diagnosing, no accepting payment, no answering questions outside the approved knowledge base, and
    the exact fallback phrasing it uses instead. This is content only an honest operator can write and
    it converts better than any feature list.
    impact 5/5 · effort 2/5 · touches: what-the-ai-will-never-say.html (new), docs/elevenlabs-agent-audit.md

57. **CONTENT-AND-NEW-PAGES-057 — Stand up /guides/ with a manifest-driven index and no CMS.**
    A blog on a static, no-build site needs a decision made once: flat `guides/*.html` files, an
    index rendered from `content-map.json`, no dates in URLs (so posts do not look stale), and a
    `BlogPosting` or `Article` JSON-LD per page. Commit to one guide per two weeks rather than a
    schedule you will abandon, and add `/guides/` to `sitemap.xml`, `llms.txt`, and the footer Site
    column. Publishing four strong guides beats twenty weak ones for a business with no domain
    authority.
    impact 4/5 · effort 2/5 · touches: guides/ (new), content-map.json, scripts/gen-sitemap.mjs, llms.txt

58. **CONTENT-AND-NEW-PAGES-058 — Publish the guide "What a missed call actually costs an Edmonton trades business".**
    CLM-13 in the claims ledger records that the "50 to 70% of calls are real opportunities"
    benchmark was removed for lack of a credible source; that removal is the honest foundation for
    this guide. Show the arithmetic with every input owner-supplied, walk through three worked
    examples at different ticket sizes, and be explicit about which numbers are assumptions. It is
    the intellectual backbone of the ROI calculator and the single best thing to send a prospect
    after a first conversation.
    impact 5/5 · effort 3/5 · touches: guides/cost-of-a-missed-call.html (new), home.html #roi, docs/CLAIMS-LEDGER.md

59. **CONTENT-AND-NEW-PAGES-059 — Publish the guide "The 12 questions your phone should ask before you call back".**
    This is a genuinely useful artefact whether or not the reader ever buys, which is what makes it
    shareable in trade Facebook groups where an ad would get deleted. Give the twelve questions, why
    each one saves a callback, and a printable version they can tape by the shop phone. End with a
    soft line: "or have it asked automatically, every time, at any hour" and a pilot link.
    impact 4/5 · effort 2/5 · touches: guides/twelve-intake-questions.html (new), docs/intake-questions/

60. **CONTENT-AND-NEW-PAGES-060 — Publish the guide "How to test an AI receptionist on your real line without risking a customer".**
    The free 7-day pilot is the wedge and the biggest unspoken objection is "what if it blows a real
    call in week one". Write the risk-controlled method: start after-hours only, keep forwarding
    conditional, set the escalation number to the owner's cell, review every call in the first 48
    hours, and the one-tap kill switch from the owner's own handset. This guide directly increases
    pilot starts, which is the current bottleneck metric.
    impact 5/5 · effort 2/5 · touches: guides/how-to-test-an-ai-receptionist.html (new), pilot.html

61. **CONTENT-AND-NEW-PAGES-061 — Publish the seasonal guide "Your furnace-season phone plan" in August.**
    Edmonton HVAC shops know exactly when the phone starts ringing and a guide that lands six weeks
    ahead of it is timely rather than opportunistic. Cover: staffing the surge, what to do with calls
    at 10pm, triage rules for no-heat versus maintenance, and a one-week setup timeline so they are
    live before the first cold snap. Reuse the "first week" day-by-day block from `home.html`
    (`#first-week`) as the timeline.
    impact 4/5 · effort 2/5 · touches: guides/furnace-season-phone-plan.html (new), home.html #first-week

62. **CONTENT-AND-NEW-PAGES-062 — Publish the seasonal guide "Spring thaw: the restoration call surge playbook".**
    March and April in Alberta produce concentrated water-damage volume, and restoration is the
    highest-ticket trade on the list, so this guide has the best revenue-per-reader on the whole
    content plan. Cover the intake sequence for a panicked caller, insurance-first questions, how to
    triage twelve simultaneous calls, and what a bad first ninety seconds costs on a $15,000 job.
    Publish in February so it is indexed before the thaw.
    impact 4/5 · effort 2/5 · touches: guides/spring-thaw-restoration-playbook.html (new)

63. **CONTENT-AND-NEW-PAGES-063 — Publish the guide "Hiring a receptionist in Alberta: the real fully loaded cost".**
    This is the standalone research piece behind comparison page 034, and it is link-worthy in a way
    that a comparison page is not, because it is useful to owners considering a hire for reasons
    unrelated to AI. Build a transparent cost model: wage band with a cited source and date, employer
    CPP and EI, WCB premium, vacation and stat pay, recruiting time, training ramp, turnover cost,
    and coverage hours per dollar. Publish the model itself, not just the conclusion.
    impact 4/5 · effort 3/5 · touches: guides/cost-of-hiring-a-receptionist-alberta.html (new), docs/COMPARISON-SOURCES.md

64. **CONTENT-AND-NEW-PAGES-064 — Publish the guide "Rewrite your voicemail greeting for the day the AI answers".**
    Small, immediately usable, and it earns the right to talk about the product: give five greeting
    scripts (fully covered, after-hours only, overflow, vacation, one-truck shop) that owners can
    copy verbatim today. Include the sentence that discloses AI answering when calls forward, so the
    reader gets the compliance detail for free. Short guides like this are the ones that actually get
    finished on a busy week.
    impact 3/5 · effort 1/5 · touches: guides/voicemail-greeting-scripts.html (new)

65. **CONTENT-AND-NEW-PAGES-065 — Publish the guide "How we build your agent: the actual discovery questionnaire".**
    Publishing the real discovery document from `docs/client-discovery-plan.md` is a strong trust
    move for a studio with no client logos, and it pre-qualifies prospects who arrive at the strategy
    call already prepared. Present the real questions grouped by section (services, hours, service
    area, calendar rules, escalation, what never to say), with a note on why each one exists. It also
    makes the strategy call shorter, which matters when the founder is the only salesperson.
    impact 4/5 · effort 2/5 · touches: guides/discovery-questionnaire.html (new), docs/client-discovery-plan.md

66. **CONTENT-AND-NEW-PAGES-066 — Publish the guide "How to judge an AI receptionist demo in ten minutes".**
    `demo.html` already tells visitors to try to stump the agent with three prompts; this is the full
    buyer's checklist and it works even for people evaluating a competitor. Give ten specific tests:
    interrupt it mid-sentence, change a detail halfway, ask for a price it should not have, give a
    fake address outside the service area, ask something off-topic, speak with background noise, and
    so on, with what a good answer sounds like for each. Anyone who runs this checklist on
    `(587) 413-0035` becomes a much warmer lead.
    impact 4/5 · effort 2/5 · touches: guides/how-to-judge-an-ai-demo.html (new), demo.html

67. **CONTENT-AND-NEW-PAGES-067 — Ship /proof.html: the honest answer to "who else uses this".**
    With zero clients, the worst move is silence and the second worst is manufactured social proof;
    the best is naming the gap and replacing it with something verifiable. Build the page around four
    things a prospect can check right now: call the live line themselves, listen to labelled example
    calls, read the published claims ledger, and run a free pilot on their own number. Add a plain
    sentence: "We are new. We have no client logos to show you yet, so here is everything you can
    verify instead."
    impact 5/5 · effort 2/5 · touches: proof.html (new), docs/CLAIMS-LEDGER.md

68. **CONTENT-AND-NEW-PAGES-068 — Publish the claims ledger as /claims.html.**
    `docs/CLAIMS-LEDGER.md` is already a rigorous public-claims register with statuses and evidence
    dates, and publishing it is a differentiator no competitor in this category will copy. Render the
    APPROVED and REVISED rows (omit internal WEB-xxx task references), lead with a paragraph
    explaining why it exists, and link it from `/proof.html`, `/about.html`, and the footer Legal
    column. Showing that you removed an unsupported statistic is stronger proof of integrity than any
    testimonial.
    impact 4/5 · effort 2/5 · touches: claims.html (new), docs/CLAIMS-LEDGER.md, footer Legal column

69. **CONTENT-AND-NEW-PAGES-069 — Ship /answers.html: 25 plain questions with extractable answers for AI search.**
    `llms.txt` already exists and is unusually well written, which means the AI-citation surface is
    half built. Add a companion page of 25 questions in owner language, each answered in 40 to 60
    words in a self-contained block with `FAQPage` markup, covering price, setup time, number
    keeping, disclosure, escalation, cancellation, and coverage. Reference it from `llms.txt` and
    keep every answer independently quotable so an assistant can lift one without context.
    impact 4/5 · effort 2/5 · touches: answers.html (new), llms.txt

70. **CONTENT-AND-NEW-PAGES-070 — Write the pilot-diary template now and publish the first one the week it happens.**
    The most valuable content asset this business will ever own is an honest week-by-week log of the
    first real pilot, and it can only be written in real time, so the template must exist before the
    client does. Create `_templates/pilot-diary.html` with the sections prepared: day zero setup, what
    broke, what the first real caller said, what was tuned, and the honest outcome, with an explicit
    client-permission checkbox in the onboarding doc. Nothing goes live without written consent, and
    the first entry replaces `/proof.html`'s placeholder as the strongest page on the site.
    impact 5/5 · effort 2/5 · touches: _templates/pilot-diary.html (new), docs/onboarding/README.md, proof.html
