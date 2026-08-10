# Answer Engine Optimization — 60 improvements

> **SUPERSEDED 2026-08-09 — the commercial model this file was written against no longer exists.**
> Ideas below were authored while Nevamis sold the C$249 / C$449 / C$849 ladder (plans named
> After Hours, Growth and Scale), a Pay As You Go tier at C$49 + C$1.95/min, annual prepay, a
> setup fee with a founding-client waiver, and a 7-day live pilot — free at first, then C$150.
> Every one of those is retired. The current model is ONE recurring price per plan, charged the
> day the client subscribes and every month after: **Core C$250/month · Growth C$500/month · Pro
> C$1,000/month**, with 250 / 600 / 1,400 included minutes and C$1.10 / C$0.90 / C$0.75 overage,
> nothing charged beside it, and no pilot or trial at any price. `pricing-config.js` is the source
> of truth; docs/CLAIMS-LEDGER.md row CLM-18 is the approval.
>
> The ideas are kept rather than deleted: most are about how a price is *presented*, and that work
> survives the change. But no figure, plan name or offer quoted below may be copied onto a surface,
> and any idea whose whole premise is a setup fee, a pilot, PAYG or annual prepay is moot.


Nevamis today is ten static HTML pages with strong human copy and almost no machine-readable
answer surface. The only JSON-LD on the site is an `Organization` + `WebSite` pair in
`home.html` plus `BreadcrumbList` on six secondary pages — there is **zero** `FAQPage`,
`Product`, `Offer`, `Service`, `LocalBusiness`, `HowTo`, or `Person` markup anywhere, despite
14 real Q&As sitting in `<details>` on the homepage, 12 more on `coming-soon.html`, and a
fully-specified price list in `pricing-config.js`. `llms.txt` exists (1.5 KB) and is unusually
honest, but it lists only five of ten pages and has no full-text companion. `robots.txt` is
three lines with no explicit stance toward GPTBot, ClaudeBot, PerplexityBot, or
Google-Extended. There is not one question-shaped URL on the domain — every page is
bottom-funnel — so when an Edmonton contractor asks ChatGPT "how much does an AI receptionist
cost in Canada" there is nothing on nevamis.ca for the model to retrieve or cite. The ideas
below fix the machine layer first (cheap, days of work, compounding), then build the
question-shaped content and off-site entity grounding that actually gets a brand-new company
surfaced. Everything here is achievable without inventing a single client, statistic, or
testimonial — Nevamis's radical honesty (`docs/CLAIMS-LEDGER.md`, the "fictional" label on the
Cedarview call) is itself a citation asset, and several ideas below turn it into one.

---

1. **Ship `FAQPage` JSON-LD for the 14 homepage questions.**
   `home.html` lines 734–760 already contain 14 `<details>` blocks with owner-grade answers
   ("Will callers know it is AI?", "Can I keep my current phone number?", "Is the 7-day live
   pilot actually free?"). Emit a single `FAQPage` graph in the existing `<script
   type="application/ld+json">` array at line 23–42, with `mainEntity` as `Question` /
   `acceptedAnswer` / `Answer` objects whose `text` matches the visible `<p>` verbatim. This is
   the single highest-leverage AEO change on the site: it converts prose LLMs must infer from
   into structured pairs Google AI Overviews and Perplexity ingest directly.
   impact 5/5 · effort 2/5 · touches: home.html (then `node scripts/promote.mjs`)

2. **Add `FAQPage` to the four other pages that already have `<details>` blocks.**
   `coming-soon.html` (12 questions, lines 282–293), `revenue-engine.html` ("Straight answers",
   line 201), `pilot.html`, and `demo.html` all carry real Q&A that is invisible to answer
   engines. Add a `FAQPage` node to each page's existing JSON-LD block alongside the
   `BreadcrumbList` — same `@graph`, no new `<script>` tag. Keep the coming-soon answers
   flagged as forward-looking in the answer text itself so nothing reads as a live capability.
   impact 4/5 · effort 2/5 · touches: coming-soon.html, revenue-engine.html, pilot.html, demo.html

3. **Generate `Product` + `Offer` JSON-LD on `pricing.html` from `pricing-config.js`.**
   `pricing.html` has no JSON-LD at all — not even the `BreadcrumbList` every other secondary
   page has. Extend the inline IIFE at the bottom of the file (the one that already reads
   `window.NV_PRICING`) to build and inject an `ItemList` of three `Product` nodes with
   `Offer` (`price: 249/449/849`, `priceCurrency: "CAD"`, `availability`), plus the
   `payAsYouGo` node. Rendering from the config keeps the "never duplicate prices" rule intact
   while giving LLMs a parseable price table.
   impact 5/5 · effort 2/5 · touches: pricing.html, pricing-config.js

4. **Upgrade the bare `Organization` node to `ProfessionalService`.**
   `home.html` line 27 declares a generic `Organization` with no `priceRange`, no
   `foundingDate`, no `founder`, no `sameAs`, no `openingHoursSpecification`. Change `@type` to
   `["Organization","ProfessionalService"]` and add `priceRange: "C$249–C$849/mo"`,
   `foundingDate`, `founder` (Person: Daren), `currenciesAccepted: "CAD"`, and a 24/7
   `openingHoursSpecification` (defensible — CLM-01 in the claims ledger approves 24/7). This
   is the entity spine every answer engine keys off.
   impact 5/5 · effort 2/5 · touches: home.html, and the same block copied to about.html

5. **Add an explicit AI-crawler allow block to `robots.txt`.**
   The current file is `User-agent: * / Allow: / / Sitemap:`. Permissive by default is not the
   same as a positive signal, and `Google-Extended` specifically governs whether your content
   can ground AI Overviews. Add named `Allow: /` stanzas for `GPTBot`, `OAI-SearchBot`,
   `ChatGPT-User`, `ClaudeBot`, `anthropic-ai`, `Claude-User`, `PerplexityBot`,
   `Perplexity-User`, `Google-Extended`, `Applebot-Extended`, `Bingbot`, `meta-externalagent`,
   and `CCBot`, and add a `# llms.txt: https://nevamis.ca/llms.txt` comment line.
   impact 4/5 · effort 1/5 · touches: robots.txt

6. **Disallow AI crawlers on `app.nevamis.ca` before they index synthetic dashboard numbers.**
   The engine app ships a client portal and performance dashboard whose numbers are today
   entirely synthetic/demo. If GPTBot crawls a public route there, a model can attribute fake
   metrics to Nevamis — the exact failure the claims ledger exists to prevent. Add a
   `public/robots.txt` in `C:/Users/daren/nevamis-engine` with `Disallow: /` for all agents
   except the login route, and confirm `app.nevamis.ca/robots.txt` returns it on Vercel.
   impact 4/5 · effort 1/5 · touches: nevamis-engine/public/robots.txt

7. **Expand `llms.txt` to cover all ten indexable pages with one-line intents.**
   It currently lists five URLs and omits `about.html`, `book.html`, `coming-soon.html`,
   `revenue-engine.html`, and `404.html`. Add each with a purpose gloss ("`/book.html`: the
   15-minute strategy call booking page — this is the conversion action"), and add a
   `## Do not attribute` section that names the specific things Nevamis has never published
   (client counts, uptime percentages, response-time SLAs, case studies).
   impact 4/5 · effort 1/5 · touches: llms.txt

8. **Publish `/llms-full.txt` — the whole site as clean plain text.**
   Write `scripts/gen-llms-full.mjs` (mirror the existing `gen-sitemap.mjs` pattern) that
   strips tags from the ten indexable pages, renders the plan table from `pricing-config.js`,
   and concatenates with `# ---- /pricing.html ----` separators. Link it from `llms.txt` and
   `robots.txt`. Regenerate it in the same breath as `promote.mjs` so it never drifts.
   impact 4/5 · effort 3/5 · touches: scripts/gen-llms-full.mjs, llms-full.txt, llms.txt

9. **Add a reusable `.answer` capsule component to `site.css` and place one at the top of every page.**
   Answer engines extract 40–70 word self-contained paragraphs far more reliably than they
   extract narrative copy. Define `.answer{border-left:2px solid var(--mint);padding-left:16px;
   font-size:17px;max-width:62ch}` in `assets/motion/site.css`, then put one directly under the
   `<h1>` on each page: on `pricing.html`, "Nevamis AI receptionist plans start at C$249/month
   (After Hours, 250 AI minutes) and go to C$849/month (Scale, 1,200 minutes), in Canadian
   dollars plus GST, month to month, with a one-time setup fee of C$500–C$1,250."
   impact 5/5 · effort 2/5 · touches: assets/motion/site.css + all 10 page templates

10. **Build `/what-is-an-ai-receptionist.html` as the definitional anchor page.**
    No page on the domain defines the category. Write ~900 words: a 55-word definition capsule,
    "how it differs from an answering service, an IVR phone tree, and voicemail", "what it can
    and cannot do", and a 6-item FAQ, all with `FAQPage` + `DefinedTerm` schema. Definitional
    pages are the highest-frequency retrieval target for a category term with no incumbent
    Canadian authority.
    impact 5/5 · effort 3/5 · touches: new page, sitemap.xml, llms.txt, footer nav

11. **Build `/ai-receptionist-vs-answering-service.html`.**
    This is the comparison an Edmonton contractor actually runs in ChatGPT, and it is the
    comparison Nevamis wins honestly: per-minute human answering services in Canada typically
    quote per-minute rates you can cite from their own public pages, while Nevamis publishes a
    fixed monthly plan. Use a real `<table>` with `<th scope="col">`, cite each competitor's
    own published pricing page with a dated `<cite>`, and never claim quality superiority —
    only structural differences (24/7 without shift coverage, fixed cost, books directly).
    impact 5/5 · effort 3/5 · touches: new page, sitemap.xml, llms.txt

12. **Extract the existing homepage comparison table into `/ai-receptionist-vs-voicemail.html`.**
    `home.html` `#compare` ("Voicemail records the lost job. Nevamis books it.") is good
    content trapped inside a 51 KB page where it competes with 15 other sections for
    extraction. Lift it into its own page with the table intact, add `FAQPage` for
    "Is voicemail costing me jobs?" and "What percentage of callers leave a voicemail?" (answer
    honestly: "we do not publish a figure — here is how to measure it on your own line").
    impact 4/5 · effort 2/5 · touches: new page, home.html (link to it), sitemap.xml

13. **Write `/ai-receptionist-cost-canada.html` — the price-intent page.**
    "How much does an AI receptionist cost" is a top-of-list AI query and `pricing.html` is
    titled "Pricing | Nevamis AI", which is invisible to that phrasing. Build a page that
    answers the general question first (what drives cost: minutes, lines, integrations, setup),
    then renders the Nevamis numbers from `pricing-config.js`, then explains connected-minute
    billing using `usagePolicy.minuteDef` verbatim. Title it "How much does an AI receptionist
    cost in Canada? (2026 pricing)".
    impact 5/5 · effort 3/5 · touches: new page, pricing-config.js, sitemap.xml

14. **Write `/ai-call-disclosure-canada.html` — the compliance answer nobody else has published.**
    Nevamis already mandates AI disclosure and call-recording notice (`llms.txt` says it is
    "mandatory, not optional"). Turn that into a cited resource page covering PIPEDA, Alberta
    PIPA, the CRTC's rules on automated calling, and one-party-consent recording — with inline
    `<cite>` links to the actual government pages. This is the kind of well-sourced, low-
    competition page that Perplexity cites and that positions Nevamis as the careful vendor.
    Add a "this is not legal advice" line and route it through the claims ledger.
    impact 5/5 · effort 4/5 · touches: new page, docs/CLAIMS-LEDGER.md, sitemap.xml

15. **Add `HowTo` schema to the `#how` six-step section.**
    `home.html` lines 445–450 are already a perfect six-step sequence ("Call comes in" →
    "Answered in your tone" → "Caller qualified" → "Job booked" → "Customer confirmed" → "You
    get the summary"). Wrap them in `HowTo` with six `HowToStep` nodes carrying `name` and
    `text` from the existing `<h3>`/`<p>`. Zero copy change, pure markup.
    impact 3/5 · effort 1/5 · touches: home.html

16. **Add the missing `BreadcrumbList` to `pricing.html`.**
    Six of ten pages have it; the most commercially important secondary page does not. Copy the
    two-item pattern from `pilot.html` line 17 with `name: "Pricing"` and
    `item: "https://nevamis.ca/pricing.html"`. Trivial, but breadcrumbs are how answer engines
    reconstruct site hierarchy when deciding which page is canonical for a topic.
    impact 3/5 · effort 1/5 · touches: pricing.html

17. **Publish a canonical answer bank at `docs/ANSWER-BANK.md` and render from it.**
    Right now the same answer ("is the pilot really free?") is written slightly differently on
    `home.html`, `pilot.html`, and `pricing.html`. Inconsistency across a domain measurably
    reduces LLM confidence in citing any version. Write one canonical ≤55-word answer per
    question, and make `scripts/check-consistency.js` fail the build when a page's visible
    answer drifts from its bank entry.
    impact 4/5 · effort 3/5 · touches: docs/ANSWER-BANK.md, scripts/check-consistency.js

18. **Create the Google Business Profile as a service-area business for Edmonton.**
    Nevamis has `geo.region: CA-AB` meta and an address-less `PostalAddress` in schema but no
    GBP, which is the primary local entity source for Google AI Overviews and Gemini. Register
    as a service-area business (no storefront), service area = Edmonton + Sherwood Park + St.
    Albert + Leduc + Spruce Grove, category "Telephone answering service", phone
    (587) 413-0035, website nevamis.ca. Match the NAP string character-for-character to the
    footer.
    impact 5/5 · effort 2/5 · touches: off-site (Google), then `sameAs` in home.html schema

19. **Create the LinkedIn company page and founder profile, then wire `sameAs`.**
    The `Organization` node has no `sameAs` array at all, so there is nothing tying "Nevamis
    AI" to any corroborating profile — for a company with no press, `sameAs` is the entire
    entity graph. Create the company page, connect Daren's personal profile as founder, then
    add `"sameAs": ["<linkedin-company>", "<gbp-url>", "<linkedin-founder>"]` to home.html and
    about.html.
    impact 5/5 · effort 2/5 · touches: off-site (LinkedIn), home.html, about.html

20. **Add a `Person` node for Daren with `worksFor` and put an author byline on about.html.**
    `about.html` already has a founder card with a photo and "A real Edmonton founder."
    Formalize it: `{"@type":"Person","name":"Daren","jobTitle":"Founder","worksFor":
    {"@id":"https://nevamis.ca/#org"},"image":"https://nevamis.ca/assets/daren.jpg"}`. Give the
    Organization node an `@id` so everything can reference it. Named-author signals materially
    affect whether models treat a page as first-party expertise.
    impact 4/5 · effort 2/5 · touches: about.html, home.html

21. **Publish `/honesty.html` — the public version of the claims ledger.**
    `docs/CLAIMS-LEDGER.md` is excluded from the build by `_config.yml`. A public page titled
    "What we will not claim" — no client counts, no uptime percentages, no case studies, the
    Cedarview call is fictional and labelled, prices come from one config file — is genuinely
    unusual, highly quotable, and gives answer engines an explicit instruction about how to
    describe Nevamis. Link it from the footer and from `llms.txt`.
    impact 4/5 · effort 2/5 · touches: new page, llms.txt, footer of all 10 pages

22. **Build four trade-specific pages using the existing `assets/industries/*.webp` images.**
    `home.html` `#industries` already has four blocks (Electricians, HVAC and plumbing,
    Restoration, Automotive) and four hero images sitting unused at full size. Expand each into
    `/ai-receptionist-electricians.html` etc. with trade-specific call scenarios, the questions
    that trade's AI would ask, and a trade-flavoured version of the Cedarview transcript. Each
    gets `FAQPage` + a 55-word answer capsule.
    impact 4/5 · effort 4/5 · touches: 4 new pages, assets/industries/, sitemap.xml

23. **Build `/ai-receptionist-edmonton.html` with named service-area municipalities.**
    The site says "Edmonton" in meta tags but has no page targeting local intent. Write a page
    naming Edmonton, Sherwood Park, St. Albert, Leduc, Spruce Grove, Beaumont, Fort
    Saskatchewan, Stony Plain, and Devon, with Alberta-specific context (after-hours furnace
    calls in January, Alberta PIPA, GST at 5% with no PST). Add `areaServed` as an `ItemList`
    of `City` nodes in the page's schema.
    impact 4/5 · effort 3/5 · touches: new page, sitemap.xml, schema areaServed

24. **Make the static pricing fallback permanent instead of removing it on render.**
    `pricing.html` line ~103 comments that `#plansFallback` is "Removed by the renderer only
    after a successful render." Crawlers that execute JS see the rendered cards; crawlers that
    do not see the fallback — but the two are different DOM, which risks inconsistent
    extraction. Instead, keep the fallback in the DOM permanently as `<div hidden
    data-static-prices>` (still readable in raw HTML, invisible to users) rather than deleting
    it, so raw-HTML fetchers like GPTBot always get the same numbers.
    impact 4/5 · effort 2/5 · touches: pricing.html

25. **Add a static text fallback for the JS-injected simulator and coverage tabs.**
    `#simulator`'s conversation is built by `motion.js` at runtime and `#solutions`' two
    non-active tabpanels carry the `hidden` attribute. A raw-HTML fetch sees an empty simulator
    and one of three coverage modes. Add a visually-hidden `<div class="visually-hidden">`
    containing the full six-stage script and all three coverage descriptions as plain prose, so
    the page's raw HTML tells the whole story.
    impact 4/5 · effort 3/5 · touches: home.html, motion.js

26. **Publish `/example-call.html` — the Cedarview transcript as a standalone indexable page.**
    The 11-line transcript in `home.html` lines 300–340 is the single most concrete, most
    quotable thing on the site, buried at 5,000 words deep. Give it its own page: full
    transcript with speaker labels, the SMS summary, the "Illustrative call, fictional company.
    Real AI voices." label repeated at the top, plus `AudioObject` schema pointing at
    `assets/call-*.mp3` with `transcript` fields.
    impact 4/5 · effort 2/5 · touches: new page, home.html link, sitemap.xml

27. **Add `dateModified` and a visible "Last reviewed" line to every page.**
    No page carries a date in schema or on screen. Answer engines discount undated content and
    prefer recently-verified sources. Add `"dateModified"` to each page's JSON-LD and a small
    mono line in the footer ("Reviewed 2026-07-27") — `pricing.html` already does a version of
    this with `#pricingUpdated`; generalize it. Wire it into `scripts/promote.mjs` so it stamps
    automatically.
    impact 4/5 · effort 2/5 · touches: all 10 pages, scripts/promote.mjs

28. **Publish `/changelog.html` with dated, honest entries.**
    A public changelog ("2026-07-27 — Terms v2.0: liability cap and Alberta governing law
    added", "2026-07-23 — Pricing set at $249/$449/$849") creates a freshness signal, gives
    models dated facts to anchor on, and reinforces the coming-soon/live boundary. Source
    entries from git log and the claims ledger. Mark it `<article>` with `datePublished` per
    entry.
    impact 3/5 · effort 2/5 · touches: new page, sitemap.xml

29. **Add `DefinedTermSet` glossary at `/glossary.html`.**
    Nevamis uses precise terms nobody else defines the same way: "connected AI minute" (defined
    exactly in `pricing-config.js` `usagePolicy.minuteDef`), "call flow", "overflow coverage",
    "conditional forwarding", "escalation rule", "warm transfer", "controlled pilot". Publish
    12–15 terms with `DefinedTerm` schema. Glossary entries are disproportionately retrieved
    when a model needs to explain a term mid-answer, and each one carries your framing.
    impact 3/5 · effort 2/5 · touches: new page, pricing-config.js as source

30. **Rewrite page `<title>` tags into question or specifier form where it does not hurt humans.**
    `pricing.html` is titled "Pricing | Nevamis AI" — six words, zero query surface. Make it
    "AI Receptionist Pricing in Canada | C$249–C$849/mo | Nevamis AI". `about.html` is fine.
    `revenue-engine.html` should say "in private pilot" in the title so no model reads it as
    shipping. Titles are the strongest single retrieval signal after H1.
    impact 4/5 · effort 1/5 · touches: pricing.html, revenue-engine.html, coming-soon.html

31. **Add question-form `<h3>` subheads inside long homepage sections.**
    The homepage H2s are excellent marketing copy ("Voicemail records the lost job. Nevamis
    books it.") but carry no query language. Without touching the H2s, add a question-form
    `<h3>` beneath each — "What happens to a call after hours?" under `#solutions`, "How long
    does setup take?" under `#first-week`, "What does an AI receptionist cost?" under
    `#pricing-preview` — each followed by a 50-word answer capsule.
    impact 4/5 · effort 2/5 · touches: home.html

32. **Give every FAQ `<details>` a stable `id` and publish a jump index.**
    Answer engines increasingly cite fragment URLs. Add `id="faq-will-callers-know-its-ai"`
    etc. to each of the 14 `<details>` on the homepage and 12 on coming-soon, and add a compact
    linked index above the accordion. Costs nothing and makes every answer independently
    addressable.
    impact 3/5 · effort 2/5 · touches: home.html, coming-soon.html

33. **State the ROI calculator's math in prose with a worked example.**
    `#roi` is four number inputs and a JS result — completely opaque to any crawler and
    unciteable. Beneath the calculator add: "The math: missed calls per month × share that are
    real opportunities × average job value × close rate = revenue at risk. A shop missing 10
    calls a month, where 6 are real, at $400 average and a 50% close rate, is leaving $1,200 a
    month on the table." Label every input as the buyer's own assumption (CLM-13 removed the
    fabricated benchmark — do not reintroduce one).
    impact 4/5 · effort 1/5 · touches: home.html

34. **Add `Service` + `hasOfferCatalog` schema describing what the AI receptionist actually does.**
    `Product` (idea 3) covers price; `Service` covers capability. Emit a `Service` node with
    `serviceType: "AI receptionist / telephone answering"`, `provider` referencing the org
    `@id`, and `hasOfferCatalog` listing the concrete capabilities already claimed on-site:
    24/7 answering, caller qualification, calendar booking, SMS confirmation, owner summary,
    live transfer, after-hours/overflow/full-time modes.
    impact 4/5 · effort 2/5 · touches: home.html

35. **Publish an honest, cited competitor comparison page — public pricing only.**
    Build `/alternatives.html` comparing Nevamis to the AI-receptionist products a Canadian
    trades owner will actually be shown by ChatGPT, using only each vendor's own published
    pricing page, quoted in its stated currency with the retrieval date, and a note that USD
    pricing plus exchange and cross-border support is a real cost difference. No quality claims,
    no screenshots, no logos. Add a row for "Canadian company, CAD billing, GST registered" —
    a fact, not a boast.
    impact 4/5 · effort 4/5 · touches: new page, docs/CLAIMS-LEDGER.md

36. **Classify AI-assistant referrers in the events pipeline.**
    `site.js` line 26 already sends `referrer: document.referrer`. In the engine's
    `/api/events` handler, bucket referrer hosts into an `ai_referrer` dimension:
    `chatgpt.com`, `chat.openai.com`, `perplexity.ai`, `claude.ai`, `copilot.microsoft.com`,
    `gemini.google.com`, `you.com`. Without this you cannot tell whether any AEO work is
    landing — and AI referrals convert differently enough to be worth isolating.
    impact 4/5 · effort 2/5 · touches: nevamis-engine `/api/events`, site.js

37. **Stand up a monthly AI-citation prompt battery and log it.**
    Write `docs/AEO-PROMPT-BATTERY.md` with 25 fixed prompts ("best AI receptionist for
    Edmonton HVAC", "how much does an AI phone answering service cost in Canada", "AI
    receptionist vs answering service", "is Nevamis AI legit"), run them monthly against
    ChatGPT, Perplexity, Claude, and Google AI Overviews, and record verbatim whether Nevamis is
    mentioned, cited, or misdescribed. This is the only measurement loop that matters here, and
    a misdescription found early is worth more than a mention.
    impact 4/5 · effort 2/5 · touches: docs/AEO-PROMPT-BATTERY.md

38. **Add `speakable` markup to the answer capsules.**
    Once idea 9 ships, add `"speakable": {"@type":"SpeakableSpecification","cssSelector":
    [".answer","h1"]}` to each page's `WebPage` node. It is a small, cheap signal that
    explicitly nominates which sentences are the extractable answer — useful beyond voice, as a
    hint about content hierarchy.
    impact 2/5 · effort 1/5 · touches: all page JSON-LD

39. **Register on the AI-tool and SaaS directories LLMs actually retrieve.**
    Perplexity and ChatGPT search lean heavily on aggregator pages. Submit Nevamis to G2,
    Capterra, GetApp, AlternativeTo, SaaSHub, There's An AI For That, and Futurepedia with an
    identical 55-word description and identical NAP. Do not solicit reviews yet — there are no
    clients. The listing itself is a corroborating entity record.
    impact 4/5 · effort 3/5 · touches: off-site, then `sameAs`

40. **List on Canadian and Edmonton-local business directories.**
    Alberta-specific corroboration is what separates "an AI company" from "an Edmonton AI
    company" in a local AI answer: Yellow Pages Canada, Canada411, Edmonton Chamber of
    Commerce, Alberta Business Directory, Clutch (Edmonton), and the Government of Canada
    business registry entry for Nevamis AI Inc. Identical NAP each time.
    impact 3/5 · effort 3/5 · touches: off-site

41. **Define a canonical NAP string in one file and enforce it.**
    The footer, `llms.txt`, and schema each spell the address slightly differently ("Edmonton,
    Alberta, Canada" vs `addressLocality`/`addressRegion`). Add a `nap` block to a small
    `config/entity.js` (name, legal name, phone in E.164 and display form, email, city, region,
    country, GST note) and have `scripts/check-consistency.js` assert every surface matches.
    Entity resolution across sources is exactly what a new brand fails at.
    impact 3/5 · effort 2/5 · touches: config/entity.js, scripts/check-consistency.js

42. **Answer real questions in the communities LLMs index, under a real name.**
    r/HVAC, r/electricians, r/smallbusinessCanada, and the Edmonton trades Facebook groups are
    heavily retrieved by Perplexity and ChatGPT search. Write genuinely useful long-form answers
    about missed-call economics and AI disclosure law — signed as Daren, founder of Nevamis,
    disclosed every time, and useful even if nobody clicks. One good answer indexed beats ten
    promotional ones removed.
    impact 4/5 · effort 3/5 · touches: off-site

43. **Publish the AI receptionist buyer's checklist as an ungated HTML page.**
    Not a gated PDF — a `/buyers-checklist.html` with 20 numbered questions to ask any vendor
    ("Does the AI disclose itself? Who owns the recordings? What happens on day 8 of the
    trial? Is the price in CAD? What is a billable minute?"). Ungated HTML gets retrieved and
    cited; a PDF behind an email form does not. Nevamis answers all 20 honestly on the same
    page, which is the entire sales argument.
    impact 5/5 · effort 3/5 · touches: new page, sitemap.xml, llms.txt

44. **Add `ImageObject` schema and descriptive alt text to the four industry photos.**
    `assets/industries/*.webp` are decorative today. Give each an `ImageObject` node with
    `caption` and `contentUrl`, and replace generic alt with descriptive text ("An electrician's
    van outside an Edmonton home — the kind of call Nevamis answers after hours"). Multimodal
    retrieval is real, and image captions are text an answer engine will read.
    impact 2/5 · effort 1/5 · touches: home.html, assets/industries/

45. **Publish `/how-it-works.html` as a standalone `HowTo` page.**
    `#how` is an anchor on a 51 KB homepage, so "how does an AI receptionist work" has no
    dedicated URL to rank or cite. Give the six steps their own page with the `HowTo` schema
    from idea 15, the signal-path diagram described in prose, and a link into `pilot.html`.
    Update the header nav to point at the page rather than the fragment.
    impact 4/5 · effort 2/5 · touches: new page, header nav on all 10 pages

46. **Give the comparison table real `<table>` semantics.**
    Verify `#compare` uses `<table>` with `<thead>`, `<th scope="col">` for the column heads
    (Voicemail / Answering service / Nevamis) and `<th scope="row">` for each criterion. Tables
    with proper scoping are parsed into structured rows by LLM ingestion pipelines; div-grids
    styled to look like tables are flattened into unusable text.
    impact 3/5 · effort 2/5 · touches: home.html, assets/motion/site.css

47. **Add explicit "not yet available" statements in machine-readable form.**
    `coming-soon.html` and `revenue-engine.html` describe seven services with `PLANNED` chips
    that are purely visual. A model reading the raw HTML sees "Instant Lead Follow-Up" adjacent
    to live capabilities. Add a visible prose sentence in each block ("Not available today.
    Planned; no launch date committed.") and a `## Not available` list in `llms.txt` naming all
    seven by name.
    impact 4/5 · effort 1/5 · touches: coming-soon.html, revenue-engine.html, llms.txt

48. **Add `QAPage` schema to `demo.html`'s "Three ways to push it" section.**
    That section is genuinely useful ("book a job, change details mid-call, ask hard
    questions") and maps to the query "can I test an AI receptionist before buying". Mark it up
    as `QAPage` with the question "How can I test an AI receptionist myself?" and the three
    approaches as the accepted answer, with the demo number in the answer text.
    impact 3/5 · effort 1/5 · touches: demo.html

49. **Write `/faq.html` — one consolidated, indexable FAQ hub.**
    The site's 30+ real Q&As are split across five pages. A single hub, grouped into Product /
    Pricing / Pilot / Privacy and legal / Setup, with full `FAQPage` markup and per-question
    fragment ids, gives answer engines one dense, unambiguous retrieval target instead of five
    partial ones. Keep the per-page accordions; the hub is additive and cross-links to them.
    impact 4/5 · effort 3/5 · touches: new page, sitemap.xml, llms.txt

50. **Cite primary sources inline wherever any external fact appears.**
    Content that cites is content that gets cited — retrieval systems weight outbound
    attribution as a credibility signal. Anywhere the site references Canadian law, telecom
    rules, or a competitor's price, wrap it in `<cite>` with a dated link to the primary source
    and no `nofollow`. Establish the rule in `docs/CLAIMS-LEDGER.md` so future copy inherits it.
    impact 3/5 · effort 2/5 · touches: all content pages, docs/CLAIMS-LEDGER.md

51. **Add every new page to `sitemap.xml` automatically.**
    `scripts/gen-sitemap.mjs` exists but the sitemap is a hand-maintained 10-URL list with
    identical `lastmod` dates. Make the script glob the repo's indexable `.html` files, read
    each file's real git mtime for `lastmod`, exclude `home.html`/`concept*.html`/`404.html`,
    and run it from `promote.mjs`. Otherwise idea 10–13's pages will silently never get
    submitted.
    impact 3/5 · effort 2/5 · touches: scripts/gen-sitemap.mjs, scripts/promote.mjs

52. **Publish a first-party dataset once the first pilots run — and say so now.**
    The one thing no competitor can copy is Nevamis's own call data. Create
    `/missed-call-data.html` today with the methodology published and the results section
    stating plainly "no data yet — the first pilots begin [date]; this page will be updated
    with real numbers and the sample size." Original data is the strongest citation magnet
    there is, and publishing the empty methodology first is honest and builds the URL's age.
    impact 4/5 · effort 3/5 · touches: new page, docs/

53. **Add `Question`-shaped internal anchor text.**
    Internal links currently read "pricing page" and "pilot page". Change them to descriptive
    phrases that mirror queries: "see what an AI receptionist costs in Canada", "how the free
    7-day pilot works, in plain language". Anchor text is one of the signals used to infer what
    a target page answers, and it is a five-minute find-and-replace across ten files.
    impact 3/5 · effort 1/5 · touches: all 10 pages

54. **Add an `OfferShippingDetails`-equivalent honesty node: `Offer.eligibleRegion` = Canada.**
    Models routinely surface vendors to users in the wrong country. Set `eligibleRegion:
    {"@type":"Country","name":"Canada"}` and `priceCurrency: "CAD"` on every `Offer`, and put
    "Canadian businesses only — we bill in CAD and are GST registered" in the pricing answer
    capsule. This both prevents wasted foreign inbound and sharpens the entity's geographic
    definition.
    impact 3/5 · effort 1/5 · touches: pricing.html, home.html

55. **Give the 7-day pilot its own `Offer` node with the day-eight mechanics in the text.**
    "Is the free trial actually free" is a high-intent, high-anxiety query, and Nevamis's
    answer is unusually strong (no card, hard caps, auto-ends). Emit an `Offer` with `price: 0`,
    `priceCurrency: "CAD"`, and a `description` carrying `pricing-config.js`'s `pilot.dayEight`
    string verbatim: "On day eight the pilot simply ends unless you explicitly choose a plan.
    Silence never becomes a subscription."
    impact 4/5 · effort 1/5 · touches: pilot.html, pricing-config.js

56. **Publish `/for-answering-services.html` and `/for-agencies.html` only if honest — otherwise skip and document why.**
    Before building audience-expansion pages, check `docs/agency-expansion-roadmap.md` against
    reality: with zero clients, an agency/partner page is a claim Nevamis cannot support and
    dilutes the trades-first entity definition every model is currently learning. Record the
    decision in the claims ledger as a deliberate "not yet" so it does not get rebuilt on a
    whim. Entity focus beats entity breadth for a new brand.
    impact 3/5 · effort 1/5 · touches: docs/CLAIMS-LEDGER.md (decision record)

57. **Reduce homepage extraction competition by splitting the 51 KB page.**
    `home.html` is 51,501 bytes with 16 sections; retrieval chunkers will slice it into pieces
    where the pricing chunk has no company context and the FAQ chunk has no product context.
    Once ideas 10, 12, 26, and 45 have moved content into dedicated pages, trim the homepage
    sections to short summaries plus a link, targeting roughly 30 KB. Fewer, denser, clearly-
    scoped pages outperform one omnibus page in every retrieval system.
    impact 4/5 · effort 4/5 · touches: home.html, new pages

58. **Add an `@id`-linked JSON-LD `@graph` instead of independent nodes.**
    Every page currently emits standalone objects with no cross-references, so a parser cannot
    tell that the `Organization` on `about.html` is the same entity as the one on `home.html`.
    Convert to `{"@context":"https://schema.org","@graph":[...]}` with stable ids
    (`https://nevamis.ca/#org`, `#website`, `#daren`, `#service`) and have every page's
    `WebPage` node reference `publisher: {"@id":"https://nevamis.ca/#org"}`.
    impact 4/5 · effort 3/5 · touches: all 10 pages

59. **Add a Playwright test that fails the build on invalid or missing JSON-LD.**
    There are already 37 tests in `tests/`. Add `tests/schema.spec.js` that visits every
    indexable page, parses every `application/ld+json` block, asserts it is valid JSON,
    asserts required nodes exist per page (FAQPage on home/coming-soon, Offer on pricing,
    BreadcrumbList on secondaries), and asserts prices in schema match `pricing-config.js`.
    Structured data silently rotting is the default outcome without this.
    impact 4/5 · effort 2/5 · touches: tests/schema.spec.js, playwright.config.js

60. **Submit the sitemap to Bing Webmaster Tools and enable IndexNow.**
    Google Search Console is verified but Bing is not — and Bing's index is what powers
    ChatGPT search and Copilot, which is a substantial share of the answer-engine surface.
    Verify the domain in Bing Webmaster Tools, submit `sitemap.xml`, and drop an IndexNow key
    file at the site root so every `promote.mjs` run can ping the new pages from ideas 10–13
    for near-immediate indexing.
    impact 5/5 · effort 1/5 · touches: off-site (Bing), site root IndexNow key, scripts/promote.mjs
