# Local Market & Partnerships — 55 improvements

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


Nevamis sells to Edmonton trades owners who verify vendors the same way their own customers verify them: they Google the name, look for a map pin, check who else in town uses it, and ask the guy at the supply counter. Right now the local surface is almost empty. `home.html` carries `geo.region CA-AB`, a `PostalAddress` with no street, an eyebrow that reads "Edmonton-built AI receptionists", and a `Service` node whose `areaServed` is `Canada` plus the single city `Edmonton` — and that is the whole local footprint. There is no Google Business Profile, no `sameAs` array, no citation anywhere, no association membership, no chamber listing, no partner page, no service-area list, and `PARTNER-CHANNEL.md` names three referral sources in one sentence with no costs, no contacts, and no tracker. Meanwhile the assets that would make all of this land already exist: a live demo line that *is* the pitch, `pricing-config.js` as a published price list, a free pilot with no card, `PRESS-BOILERPLATE.md` with pre-cleared copy, and an honest claims discipline that most local competitors cannot match. The 55 items below turn that into a local presence — profile and citations first (cheapest, compounds fastest), then the association, supply-house, chamber and partner channels that reach Edmonton trades owners in batches instead of one dial at a time, then the hyper-local content only an Alberta company can honestly write. Nothing here needs a client, a testimonial, a statistic, or a claim the business cannot support today. Ratings are impact (pipeline or revenue effect) over effort (solo-founder days).

---

## Google Business Profile

1. **LOCAL-MARKET-PARTNERSHIPS-001 — Lock the GBP primary category to "Telephone answering service" and write the reasoning down.** `ai-assistant/GBP-DECISION.md` says "pick the second" in passing but never commits, and primary category is the single strongest ranking input in the local pack. "Software company" puts Nevamis in a list of Edmonton dev shops; "Telephone answering service" puts it in the list a plumber actually searches and compares. Add the secondary categories in the same edit — "Business to business service", "Software company", "Answering service" — and record the final four in `GBP-DECISION.md` so the choice is not re-litigated later.
impact 5/5 · effort 1/5 · touches: ai-assistant/GBP-DECISION.md, Google Business Profile (owner action)

2. **LOCAL-MARKET-PARTNERSHIPS-002 — Define the service-area municipality list once, in one file, and use those exact names everywhere.** Write `docs/SERVICE-AREA.md` listing Edmonton, St. Albert, Sherwood Park (Strathcona County), Spruce Grove, Stony Plain, Leduc, Nisku, Beaumont, Fort Saskatchewan, Devon, Morinville and Acheson (Parkland County). Mirror that list into the GBP service areas, into the `Service` node's `areaServed` in `home.html` (which today lists only `Canada` and `Edmonton`), and into `scripts/build-schema.mjs` so it regenerates from one source. Every later idea — the local page, the citations, the chamber choice, the prospect list geography — reads from this file.
impact 4/5 · effort 2/5 · touches: docs/SERVICE-AREA.md (new), home.html, scripts/build-schema.mjs, GBP

3. **LOCAL-MARKET-PARTNERSHIPS-003 — Make the GBP phone number a separate Twilio number routed to the same agent, with (587) 413-0035 listed as the additional number.** Google permits a call-tracking number as primary when the main number is also on the profile, and the payoff is enormous: a prospect who taps "Call" on the map listing reaches the product itself, and you can tell in the call log that it came from the profile. Buy a 780 number in the Twilio console, point it at the same ElevenLabs agent, and label it `gbp-map` so profile-sourced calls are separable from `demo-line` calls forever. Without this, GBP calls and website calls are indistinguishable and the channel can never be evaluated.
impact 5/5 · effort 2/5 · touches: Twilio console, GBP, ai-assistant/outreach/prospect-tracker.csv

4. **LOCAL-MARKET-PARTNERSHIPS-004 — Tag the GBP website link with UTMs and make `site.js` remember the first touch.** Set the profile website field to `https://nevamis.ca/?utm_source=gbp&utm_medium=organic&utm_campaign=profile`. `nvSend()` in `site.js` already ships `location.search` as the `source` field, but only on the landing page — a GBP visitor who reads the homepage and then books on `book.html` currently reports `source: ""`, so the profile gets zero credit for every conversion it causes. Store the first-touch query string in `sessionStorage` on first load and attach it to every subsequent event.
impact 4/5 · effort 1/5 · touches: site.js (nvSend), GBP website field, nevamis-engine /api/events

5. **LOCAL-MARKET-PARTNERSHIPS-005 — Seed the GBP Q&A with eight questions lifted verbatim from the homepage FAQ.** Owner-posted questions and answers are explicitly permitted by Google, and the Q&A block is the second thing a cautious buyer reads after the reviews they will not find. Take eight of the fourteen `<details>` items in `home.html` — the AI disclosure one, "Can it answer only after hours or when we miss a call?", keeping your existing number, emergency handling, what it costs, and the pilot — and paste question and answer word-for-word so nothing on the profile can drift from `docs/CLAIMS-LEDGER.md`. Upvote your own answers is not needed; accuracy is the whole point.
impact 4/5 · effort 1/5 · touches: GBP Q&A, home.html FAQ, docs/CLAIMS-LEDGER.md

6. **LOCAL-MARKET-PARTNERSHIPS-006 — Publish the four plans as GBP Products, generated from `pricing-config.js`.** The Products panel renders name, price and a short description directly in the profile, so an owner comparing three answering services sees C$249 / C$449 / C$849 without ever clicking through. Write `scripts/gen-gbp-products.mjs` that reads `window.NV_PRICING` and prints a paste-ready block (name, price, description, `pricing.html` link), so a price change regenerates the profile copy instead of leaving a stale number on Google — the exact failure mode the "render, never duplicate" rule exists to prevent.
impact 3/5 · effort 2/5 · touches: pricing-config.js, scripts/gen-gbp-products.mjs (new), GBP Products

7. **LOCAL-MARKET-PARTNERSHIPS-007 — Run a monthly GBP post queue tied only to things that actually shipped.** GBP posts decay in ranking value after roughly a week, so a dead profile is worse than a quiet one. Keep `docs/GBP-POSTS.md` as a queue with a `posted_on` column, and draw each post from something true: a new industry page going live, the number of founding-client setup waivers left (five, per `pricing-config.js`), the fall cold-snap coverage note, a new FAQ answer. The rule that makes it survivable for a solo founder is that no post may invent news — if nothing shipped, the month gets the seasonal post.
impact 3/5 · effort 2/5 · touches: docs/GBP-POSTS.md (new), GBP posts

8. **LOCAL-MARKET-PARTNERSHIPS-008 — Fill the GBP photo set with honest assets and one 30-second phone video, and never a stock image.** Available today: `assets/daren.jpg`, the arc-and-dot logo, the OG image at `assets/og-default.png`, and a screenshot of a real transcript from the ElevenLabs console with the caller's details redacted. Add a 30-second vertical video of a phone dialing (587) 413-0035 with the AI answering audibly — that is the product, filmed, in one take. A stock photo of a headset call-centre is the single fastest way to lose an Edmonton trades buyer, because he has seen the same photo on four offshore answering-service sites.
impact 3/5 · effort 2/5 · touches: GBP photos, nevamis-site/assets/

9. **LOCAL-MARKET-PARTNERSHIPS-009 — Write the three review-response templates before the first review exists.** `GBP-DECISION.md` sets the review rules — never incentivized, never gated, respond to every one — but no copy exists, which means the first review gets answered late or defensively. Draft `docs/GBP-REVIEW-REPLIES.md` with a five-star reply (thank, name the specific thing, no marketing), a three-star reply (acknowledge, state what changed, offer a call), and a one-star reply (factual, non-arguing, one line inviting a direct call to Sales@nevamis.ca). Every future reader sees the responses, not just the reviews.
impact 3/5 · effort 1/5 · touches: docs/GBP-REVIEW-REPLIES.md (new), ai-assistant/GBP-DECISION.md

10. **LOCAL-MARKET-PARTNERSHIPS-010 — Decide GBP messaging deliberately, and switch it off if the honest answer is "I cannot reply in an hour".** Google surfaces a "Typically replies in…" badge on the profile; a company whose entire pitch is "we answer instantly" showing "replies in a day" does measurable damage. Either route GBP messages to a channel that is genuinely monitored, or disable messaging and let the Call button dominate — which also pushes prospects into the demo line, where the product sells itself. Record the choice in `GBP-DECISION.md` with the reason.
impact 3/5 · effort 1/5 · touches: GBP settings, ai-assistant/GBP-DECISION.md

---

## Citations, directories, and local entity consistency

11. **LOCAL-MARKET-PARTNERSHIPS-011 — Create `docs/NAP.md` as the canonical name/phone/area/hours string set, and copy from it for every listing.** Fix the exact forms once: legal name "Nevamis AI Inc.", display name "Nevamis AI", phone "(587) 413-0035", locality "Edmonton, Alberta, Canada", email "Sales@nevamis.ca", hours "Open 24 hours" (honest — the AI answers), timezone Mountain, GST/HST 705729200 RT0001. Inconsistent name/address/phone across directories is the most common cause of local-pack suppression, and it is entirely preventable by never typing the details twice.
impact 4/5 · effort 1/5 · touches: docs/NAP.md (new), all directory submissions

12. **LOCAL-MARKET-PARTNERSHIPS-012 — Claim Bing Places by importing the verified GBP.** Once GBP is verified the Bing import is roughly five minutes and copies categories, hours and photos wholesale. Bing feeds DuckDuckGo local results and Microsoft Copilot's local answers, and a trades owner researching on the shop's Windows desktop is not a rounding error in Alberta. Add the resulting URL to the `sameAs` list in idea 015.
impact 3/5 · effort 1/5 · touches: Bing Places (owner action), docs/NAP.md

13. **LOCAL-MARKET-PARTNERSHIPS-013 — Claim the Apple Business Connect listing so Apple Maps and Siri know the company exists.** Free, and it controls what appears when an iPhone user asks Siri for an answering service near Edmonton or taps a business card in Messages. The Showcase card should carry the demo number as the primary action, matching the GBP decision in idea 003. Most local competitors skip Apple entirely, which makes it unusually cheap ground.
impact 3/5 · effort 1/5 · touches: Apple Business Connect (owner action), docs/NAP.md

14. **LOCAL-MARKET-PARTNERSHIPS-014 — Audit YP.ca, Canada411 and Yelp Canada for auto-generated Nevamis entries before creating new ones.** Canadian aggregators scrape the federal corporate registry, so a listing with wrong or missing details may already exist and outrank a correct one. Search each for "Nevamis", claim what is there, correct it against `docs/NAP.md`, and only then create the free listings that are missing. A wrong citation you do not know about is worse than no citation.
impact 3/5 · effort 2/5 · touches: YP.ca, Canada411, Yelp Canada, docs/NAP.md

15. **LOCAL-MARKET-PARTNERSHIPS-015 — Point the Organization node's `sameAs` at local entity sources, not social vanity URLs.** `home.html`'s `#organization` node has no `sameAs` at all. When it gets one, prioritise the URLs that prove local existence — the GBP profile, the Corporations Canada record for Nevamis AI Inc., the chamber member-directory page, the association member page, Bing Places, Apple Maps — over a Twitter handle nobody checks. Add each URL only on the day it is verified live, and log it in `docs/CLAIMS-LEDGER.md`; an array of dead links is a negative entity signal.
impact 3/5 · effort 1/5 · touches: home.html, scripts/build-schema.mjs, docs/CLAIMS-LEDGER.md

16. **LOCAL-MARKET-PARTNERSHIPS-016 — Make a written go/no-go on BBB Edmonton accreditation with the real quote in hand.** An unaccredited BBB profile exists whether you want it or not once a business is visible, and older trades owners — a meaningful share of the ICP — still check it. Get the actual annual accreditation quote for a one-person Alberta corporation, write `docs/BBB-DECISION.md` with cost, what it buys, and the decision, and at minimum claim and complete the free profile. Deciding once beats revisiting it every quarter.
impact 2/5 · effort 1/5 · touches: docs/BBB-DECISION.md (new), BBB Edmonton

17. **LOCAL-MARKET-PARTNERSHIPS-017 — Get listed in the Edmonton Global and Edmonton Unlimited company directories.** Both are regional economic-development organisations with indexed `.ca` company listings, both are free to an Edmonton-headquartered company, and both are exactly the kind of source an AI answer cites when asked "what AI companies are based in Edmonton". Submit using the 50-word and 150-word blocks already cleared in `ai-assistant/PRESS-BOILERPLATE.md` so nothing new has to be written or approved.
impact 3/5 · effort 1/5 · touches: Edmonton Global, Edmonton Unlimited, ai-assistant/PRESS-BOILERPLATE.md

---

## Trade associations

18. **LOCAL-MARKET-PARTNERSHIPS-018 — Replace the one-sentence association list with a costed, ranked table.** `PARTNER-CHANNEL.md` names Merit Contractors, the Edmonton Construction Association and BNI in a single line with no dues, no contacts and no member counts — you cannot budget a sentence. Build `docs/ALBERTA-ASSOCIATIONS.md` with a row per body (Merit Contractors Association, Edmonton Construction Association, CHBA Edmonton Region, Electrical Contractors Association of Alberta, Mechanical Contractors Association of Alberta, HRAI Alberta, Alberta Roofing Contractors Association, RIA Canadian Council, AIA Canada Alberta) and columns for member trades, whether non-contractor associate membership is allowed, annual dues, whether the member directory is public and indexed, event calendar, and the executive director's name.
impact 4/5 · effort 2/5 · touches: docs/ALBERTA-ASSOCIATIONS.md (new), ai-assistant/PARTNER-CHANNEL.md

19. **LOCAL-MARKET-PARTNERSHIPS-019 — Join exactly one association this quarter, chosen by the member-directory test.** The decision rule that removes the guesswork: pick the association whose public member directory is indexed by Google and lists associate members with an outbound website link. That single membership then buys three things at once — a permanent local backlink from a `.ca`/`.org` domain, a browsable list of exactly your buyer, and standing to ask for a speaking slot. One membership, executed, beats three memberships neglected.
impact 4/5 · effort 2/5 · touches: docs/ALBERTA-ASSOCIATIONS.md, ai-assistant/PARTNER-CHANNEL.md

20. **LOCAL-MARKET-PARTNERSHIPS-020 — Mine the association member directories straight into the prospect tracker with `source=association`.** `prospect-tracker.csv` has 22 rows sourced almost entirely from Yelp, which skews toward consumer-facing shops. Association directories skew toward established owner-operated contractors who pay dues — better fit, better ability to pay C$449/mo. Add the rows with `source=association` so the Friday review can compare conversion by source instead of guessing which list is better.
impact 4/5 · effort 2/5 · touches: ai-assistant/outreach/prospect-tracker.csv

21. **LOCAL-MARKET-PARTNERSHIPS-021 — Ask for autumn speaking slots in June, because association agendas are set a quarter ahead.** HVAC and mechanical associations program their September–November member meetings before summer ends, and that window is exactly when an Edmonton HVAC owner is drowning in first-cold-snap calls and feels the problem. Email or call the executive directors at HRAI Alberta and MCA Alberta in June asking for ten minutes at the fall meeting; the ask costs one phone call and the slot is free. Missing the June window means waiting a full year for the same room.
impact 4/5 · effort 1/5 · touches: docs/ALBERTA-ASSOCIATIONS.md, ai-assistant/PARTNER-CHANNEL.md

22. **LOCAL-MARKET-PARTNERSHIPS-022 — Write one 600-word article for an association newsletter instead of buying an ad in it.** Merit, ECA and CHBA Edmonton newsletters all take member-contributed content, and members read articles while ignoring ads. Topic: what a missed call costs a two-truck shop, built only from the arithmetic already in `outreach/ROI-ONE-PAGER.md` and the founder's own logged after-hours answer test — no borrowed industry statistics, no vendor claims. The byline link is a genuine `.org` backlink and the article lands in the inbox of several hundred Alberta contractors.
impact 4/5 · effort 2/5 · touches: new ai-assistant/outreach/ASSOCIATION-ARTICLE.md, docs/ALBERTA-ASSOCIATIONS.md

23. **LOCAL-MARKET-PARTNERSHIPS-023 — Open the restoration channel through the dispatch angle, not the missed-leads angle.** Restoration firms advertise 24/7 emergency response and are dispatched by insurers, adjusters and property managers who move to the next vendor on the list within minutes. Add restoration bodies (RIA Canadian Council members, Alberta restoration contractors) to `docs/ALBERTA-ASSOCIATIONS.md` and write a restoration-specific opening line about after-hours dispatch calls from adjusters — it is a different, more urgent problem than a homeowner shopping around, and the site's `industries` section already carries restoration artwork at `assets/industries/restoration.webp` with no matching outreach.
impact 4/5 · effort 2/5 · touches: docs/ALBERTA-ASSOCIATIONS.md, ai-assistant/outreach/prospect-tracker.csv

24. **LOCAL-MARKET-PARTNERSHIPS-024 — Work the automotive vertical through service-advisor pain, via AMVIC-licensed independents and AIA Canada's Alberta network.** Independent Edmonton repair shops lose bookings when the single service advisor is under a hood or on the other line, which is a sharper and more concrete version of the trades pitch. Add the automotive bodies to the association table, and build 15 tracker rows of independent shops (not dealer groups, which already run BDC call centres). The homepage already advertises automotive at `assets/industries/automotive.webp` while the tracker contains zero automotive rows.
impact 3/5 · effort 2/5 · touches: docs/ALBERTA-ASSOCIATIONS.md, ai-assistant/outreach/prospect-tracker.csv

---

## Supply houses and the trade counter

25. **LOCAL-MARKET-PARTNERSHIPS-025 — Build `docs/SUPPLY-HOUSE-MAP.md` naming the actual Edmonton branches and their counter-rush hours.** `PARTNER-CHANNEL.md` ranks supplier counters second but names no branch, so the tactic has never been executable. List the Edmonton locations of Bartle & Gibson, EMCO, Wolseley, Andrew Sheret, Nedco, Gescan, Westburne, EECOL Electric, City Electric Supply, Guillevin, Master Group and Refrigerative Supply with address, branch manager name once known, permission status, and the 6:30–8:00 am counter rush when the room is full of exactly your buyer. Twelve branches is a month of one-stop-per-morning field work with zero ad spend.
impact 4/5 · effort 2/5 · touches: docs/SUPPLY-HOUSE-MAP.md (new), ai-assistant/PARTNER-CHANNEL.md

26. **LOCAL-MARKET-PARTNERSHIPS-026 — Script the branch-manager permission ask around one small, specific request.** Counter staff cannot approve anything and will resent being put on the spot, so the only viable path is the branch manager and the only ask that gets a yes is small: a single card holder on the counter, refilled by you. Script it in `SUPPLY-HOUSE-MAP.md`: introduce, show the card, hand him your phone with the demo line ringing, ask for the counter spot, offer to leave and come back. Track `permission: yes/no/pending` per branch and never work around a no — the trades world in Edmonton is small enough that it gets back to you.
impact 4/5 · effort 1/5 · touches: docs/SUPPLY-HOUSE-MAP.md, ai-assistant/PARTNER-CHANNEL.md

27. **LOCAL-MARKET-PARTNERSHIPS-027 — Print a counter card whose entire front is the phone number.** Spec: 3.5×2 inches, matte, navy `#0B1620` with mint `#9FF0CE`, one line of copy ("Call this number. An AI answers it. That's the whole demo."), the number at the largest size that fits, and a QR to `/counter.html` on the back with `?utm_source=counter&utm_medium=card`. Get quotes from two Edmonton print shops for 500 — this is a sub-$150 asset that works for a year. A card that explains the company fails; a card that dares the reader to call the number converts, because the product answers.
impact 4/5 · effort 2/5 · touches: new brand/counter-card artwork, assets/motion/site.css palette

28. **LOCAL-MARKET-PARTNERSHIPS-028 — Build `/counter.html` as a 60-second mobile-only landing page for the QR scan.** The reader is standing at a parts counter holding a phone, so the page must be: what this is (two sentences), the demo number as a tap-to-call button, "free 7-day pilot, no card", one CTA to `book.html`, and nothing else — no hero motion, no simulator, no FAQ. Build it from `_partials/nav.html` and `_partials/footer.html` via `scripts/build-pages.mjs` so `scripts/check-consistency.js` stays green, add it to `scripts/gen-sitemap.mjs` at priority 0.4, and it becomes the honest attribution surface for every physical card, sign and handshake.
impact 4/5 · effort 2/5 · touches: counter.html (new), _partials/, scripts/build-pages.mjs, scripts/gen-sitemap.mjs

29. **LOCAL-MARKET-PARTNERSHIPS-029 — Offer one branch a Saturday-morning coffee-and-donuts counter day in exchange for standing beside the counter.** Suppliers already run vendor days for tool and fixture reps; the format is familiar and the cost is under $60. Two hours next to the counter on a Saturday puts you face to face with twenty to forty owner-operators who are already talking about their week, and the pitch is handing over a ringing phone. Ask for it only after the card holder has been in place a few weeks and the manager knows your face.
impact 4/5 · effort 2/5 · touches: docs/SUPPLY-HOUSE-MAP.md

30. **LOCAL-MARKET-PARTNERSHIPS-030 — Give the supply-house channel a written kill criterion before spending a month on it.** Define it now: if `/counter.html` records fewer than eight sessions and the `gbp-map`/counter-tagged Twilio line records zero calls in three weeks of cards being on counters, the channel is retired and the hours go back to dialing. Log the sessions from the `/api/events` beacon weekly in `docs/SUPPLY-HOUSE-MAP.md`. Physical channels feel productive because they involve leaving the house, which is exactly why a non-salesperson keeps doing them past the point of evidence.
impact 4/5 · effort 1/5 · touches: docs/SUPPLY-HOUSE-MAP.md, nevamis-engine /api/events, ai-assistant/WEEKLY-RHYTHM.md

---

## Chambers, business associations, and local institutions

31. **LOCAL-MARKET-PARTNERSHIPS-031 — Rank the suburban chambers above the Edmonton Chamber of Commerce and say why.** Trades in the Edmonton region cluster in Nisku, Acheson, Sherwood Park and the north-side industrial parks, not downtown. The Sherwood Park & District, Leduc Regional, Spruce Grove & District, St. Albert & District and Fort Saskatchewan chambers all have lower dues, higher trades density per member, smaller rooms where a newcomer actually gets talked to, and member directories that are usually public. Put the dues and member counts in `docs/ALBERTA-ASSOCIATIONS.md` alongside the trade bodies and pick one.
impact 4/5 · effort 2/5 · touches: docs/ALBERTA-ASSOCIATIONS.md

32. **LOCAL-MARKET-PARTNERSHIPS-032 — Mine the public chamber member directories for prospects before paying any dues.** Most Alberta chamber directories are browsable without membership and are already segmented by category — construction, HVAC, automotive, professional services. Pull the trades rows into `prospect-tracker.csv` with `source=chamber` and the bookkeeper/accountant/marketing rows into the partner tracker from idea 037. That single afternoon tells you which chamber is worth joining, using data instead of a brochure.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv, partner-tracker.csv

33. **LOCAL-MARKET-PARTNERSHIPS-033 — Offer chamber members a named intake link rather than inventing a new discount.** Pricing is canonical in `pricing-config.js` and the founding-client setup waiver is already the concession, so do not manufacture a chamber-only rate. Instead give each chamber a tracked link (`/pilot.html?utm_source=chamber&utm_medium=member&utm_campaign=<chamber>`) framed as "chamber members get first look at the remaining founding-client spots" — true, since only five exist. The chamber gets something to publish in its member-benefit list, and you get honest attribution per chamber.
impact 3/5 · effort 1/5 · touches: pilot.html, site.js UTM capture, pricing-config.js (no change)

34. **LOCAL-MARKET-PARTNERSHIPS-034 — Write down the decision to skip most BIAs, and the one exception.** Edmonton's business improvement areas — Old Strathcona, 124 Street, Alberta Avenue, Kingsway, Beverly, Chinatown, Downtown — are retail and hospitality dominated, which is not the ICP, and time spent there feels like local marketing while producing nothing. The exception worth an hour is an industrial-area association such as Northwest Industrial or the Acheson Business Association in Parkland County, where the membership is fabrication shops, contractors and fleets. Recording the "no" in `docs/ALBERTA-ASSOCIATIONS.md` stops the idea from resurfacing every month.
impact 2/5 · effort 1/5 · touches: docs/ALBERTA-ASSOCIATIONS.md

35. **LOCAL-MARKET-PARTNERSHIPS-035 — Ask NAIT for a guest slot in a business-of-trades or entrepreneurship course, and meet the instructors.** NAIT trains a large share of Edmonton's tradespeople and its instructors have decades of relationships with the shop owners who hire their graduates — one instructor's introduction is worth thirty dials. A 20-minute guest talk on "the phone is the business" costs a morning, is genuinely useful to students, and the follow-up conversation with the instructor is the actual objective. Log the outcome in `docs/ALBERTA-ASSOCIATIONS.md` under a `institutions` section.
impact 3/5 · effort 2/5 · touches: docs/ALBERTA-ASSOCIATIONS.md

36. **LOCAL-MARKET-PARTNERSHIPS-036 — Register with Business Link and get on the Alberta Small Business Week (October) event lists.** Business Link is Alberta's free small-business support agency; registering costs nothing, puts Nevamis in front of advisors who talk to hundreds of new Alberta owners, and unlocks free event listings during BDC's Small Business Week in October. It is also a legitimate, free source of the local `.ca` presence that idea 015's `sameAs` array needs. Treat it as a citation-plus-advisor play, not a lead source.
impact 2/5 · effort 1/5 · touches: Business Link registration, docs/NAP.md, docs/CLAIMS-LEDGER.md

---

## Referral partnerships with adjacent vendors

37. **LOCAL-MARKET-PARTNERSHIPS-037 — Create `ai-assistant/outreach/partner-tracker.csv` so the partner channel is measurable from day one.** `PARTNER-CHANNEL.md` says every partner intro gets a row in the prospect tracker, but a partner is not a prospect and the columns do not fit. Mirror the tracker's discipline with partner-specific fields: `partner_name, type (bookkeeper|agency|msp|software|insurance|supplier), contact, first_touch_date, permission_to_email, materials_sent, intros_made, intros_converted, reciprocal_referrals_sent, notes`. Without `intros_converted` you will never know whether partners beat dialing, which is the only question the channel has to answer.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/partner-tracker.csv (new), ai-assistant/PARTNER-CHANNEL.md

38. **LOCAL-MARKET-PARTNERSHIPS-038 — Use the QuickBooks Find-a-ProAdvisor and Xero advisor directories as the free, pre-qualified Edmonton bookkeeper list.** `PARTNER-CHANNEL.md` ranks bookkeepers as the number-one referral source but offers only "search bookkeeper for contractors Edmonton" as a method. Both accounting-software directories filter by city and by industry specialisation, list firm name, phone and website, and are public — that is 30–60 named Edmonton firms in an hour, each of whom hears "I'm missing calls and can't afford a receptionist" at every year-end. Load them into the partner tracker as `type=bookkeeper`.
impact 5/5 · effort 1/5 · touches: ai-assistant/outreach/partner-tracker.csv

39. **LOCAL-MARKET-PARTNERSHIPS-039 — Give bookkeepers one forwardable email, not a PDF.** A bookkeeper will not open an attachment or hand out a card, but she will forward a short email to a client who just complained about the phone. Write it as three sentences plus the demo number and a link to `pilot.html`, addressed to the *client* not the bookkeeper, with a subject line she can send unedited. Keep it in `ai-assistant/outreach/PARTNER-FORWARDABLE.md`, and note in `PARTNER-CHANNEL.md` that CASL is satisfied because the bookkeeper — who has the relationship — sends it, not Nevamis.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/PARTNER-FORWARDABLE.md (new), ai-assistant/PARTNER-CHANNEL.md

40. **LOCAL-MARKET-PARTNERSHIPS-040 — Approach Edmonton marketing agencies that serve trades with the complement framing, not the competitor framing.** Agencies sell leads and then get blamed when leads do not convert; every unanswered after-hours call makes their ad spend look worse. The line is: "You generate the calls, we make sure someone picks up — and your client stops blaming your ads." Search Edmonton agencies whose portfolio pages show plumbing, HVAC and roofing clients, load them as `type=agency`, and be explicit that Nevamis will never sell lead generation, which is what makes the partnership safe for them.
impact 4/5 · effort 2/5 · touches: ai-assistant/outreach/partner-tracker.csv, ai-assistant/PARTNER-CHANNEL.md

41. **LOCAL-MARKET-PARTNERSHIPS-041 — Recruit Edmonton VoIP resellers and small IT shops, because they own the call-forwarding step.** Forwarding an existing business line is the one technical moment in onboarding that scares a non-technical owner, and it lives inside the phone system their IT guy or VoIP reseller already administers. The partnership writes itself: they configure the forward on their platform, Nevamis runs the agent, neither party sells the other's product. Add them as `type=msp` and treat the first successful joint onboarding as a template for `ONBOARDING-SOP.md`.
impact 4/5 · effort 2/5 · touches: ai-assistant/outreach/partner-tracker.csv, ai-assistant/ONBOARDING-SOP.md

42. **LOCAL-MARKET-PARTNERSHIPS-042 — Open a conversation with Jobber, which is headquartered in Edmonton and whose users are exactly the ICP.** Jobber is a home-service software company based in this city with a large Alberta trades user base and a public app marketplace, and "the Edmonton company that answers your phone and books into your Jobber calendar" is a story only a local can tell. Two tracks, in order: introduce yourself locally through the Edmonton tech community (Edmonton Unlimited, Startup TNT) rather than a cold partner-portal form, and separately scope what a real booking integration would cost against the existing Cal.com path documented in `docs/integration-roadmap.md`. Do the relationship first; the integration is a bigger bet that should wait for paying clients asking for it.
impact 4/5 · effort 3/5 · touches: docs/integration-roadmap.md, ai-assistant/outreach/partner-tracker.csv

43. **LOCAL-MARKET-PARTNERSHIPS-043 — Find the Alberta implementation consultants for Housecall Pro, ServiceTitan and Method:CRM.** These consultants are paid to fix a trades business's operations and are already inside the workflow when the owner says "and we keep missing calls" — a warmer moment than any cold dial. They are findable through each vendor's partner or certified-consultant directory filtered to Canada. Offer plain reciprocity: they get a referral whenever a Nevamis prospect needs their software configured properly, which will happen.
impact 3/5 · effort 2/5 · touches: ai-assistant/outreach/partner-tracker.csv

44. **LOCAL-MARKET-PARTNERSHIPS-044 — Approach contractor insurance brokers and restoration adjusters as the highest-trust introduction in the market.** A commercial broker who writes contractor policies talks to every trades owner in his book annually and is trusted more than any vendor; restoration adjusters personally experience what happens when a contractor's after-hours line goes to voicemail. Neither sells anything competitive. Add both as `type=insurance`, approach by phone per the CASL posture in `PARTNER-CHANNEL.md`, and lead with the dispatch story from idea 023 rather than a pitch.
impact 3/5 · effort 2/5 · touches: ai-assistant/outreach/partner-tracker.csv, ai-assistant/PARTNER-CHANNEL.md

45. **LOCAL-MARKET-PARTNERSHIPS-045 — Build `/partners.html` so a partner has somewhere to send someone.** Today a bookkeeper who wants to help has only the homepage, which is written for a buyer mid-consideration. The partner page needs four things: what Nevamis does in two sentences, who it is for, the referral terms in plain language once idea 046 lands, and a form or email link for "I work with trades and want to refer someone." Generate it through `scripts/build-pages.mjs` with the shared `_partials/`, add it to `scripts/gen-sitemap.mjs` and to the footer Site column, and keep `scripts/check-consistency.js` green.
impact 3/5 · effort 2/5 · touches: partners.html (new), _partials/footer.html, scripts/build-pages.mjs, scripts/gen-sitemap.mjs

46. **LOCAL-MARKET-PARTNERSHIPS-046 — Take `REFERRAL-OFFER.md` out of DRAFT and write separate, honest partner terms.** The client referral offer (50% off one month for both sides) has sat as DRAFT since 2026-07-23, which means nobody can be offered anything on a call without improvising. Confirm the client terms, then add a distinct partner section: partners who are not clients get reciprocity and a public listing on `/partners.html`, never a per-lead payment — the no-kickback rule in `PARTNER-CHANNEL.md` exists because bookkeepers and brokers have professional obligations that cash referrals compromise. Two paragraphs, one owner decision, and the whole channel becomes speakable.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/REFERRAL-OFFER.md, ai-assistant/PARTNER-CHANNEL.md, partners.html

---

## Events and field presence

47. **LOCAL-MARKET-PARTNERSHIPS-047 — Build `docs/EVENTS-ALBERTA.md` as a dated twelve-month calendar with costs.** Rows for the Edmonton Home + Garden Show (March, Expo Centre), the Edmonton Renovation Show (January), the Fall Home Show (September), association golf tournaments (June), chamber luncheons (monthly), Alberta Small Business Week (October) and Startup TNT summits — each with date, cost to attend, cost to exhibit, and a column for whether *contractors exhibit there* versus whether *homeowners attend*. That last column is the whole point: Nevamis sells to the exhibitors, not the attendees.
impact 3/5 · effort 2/5 · touches: docs/EVENTS-ALBERTA.md (new)

48. **LOCAL-MARKET-PARTNERSHIPS-048 — Walk the Edmonton Home + Garden Show as a visitor with a pocket of counter cards, and never buy a booth.** A booth costs thousands and puts you in front of homeowners who will never buy; a day pass costs about twenty dollars and puts you in front of a hundred-plus Edmonton contractor exhibitors who are standing in a booth, under-occupied, with a phone in their pocket that is ringing unanswered while they stand there. That is the highest buyer-density-per-dollar day available in this city. Prepare by pulling exhibitor names into `prospect-tracker.csv` beforehand so the conversations are targeted.
impact 5/5 · effort 2/5 · touches: docs/EVENTS-ALBERTA.md, ai-assistant/outreach/prospect-tracker.csv

49. **LOCAL-MARKET-PARTNERSHIPS-049 — Define the same-week, CASL-clean post-event follow-up ritual before the first event.** Business cards collected at an event are the one situation where emailing is defensible — CASL treats an address disclosed directly to you, for a message relevant to the person's business role, as implied consent — but the argument only holds if you log where and when the card was handed over. Add `consent_basis` and `consent_source_event` columns to both trackers, and follow up within seven days with a two-line email referencing the actual conversation. An event with no follow-up ritual is a day spent, not a channel.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv, partner-tracker.csv, ai-assistant/PLAYBOOK.md

50. **LOCAL-MARKET-PARTNERSHIPS-050 — Spend sponsorship money only where it buys a measurable action, not a sign.** A golf-hole sign at a Merit or ECA tournament produces nothing measurable; sponsoring the coffee cart or the scorecard with "Call (587) 413-0035 — an AI answers, try to break it" and a tracked number produces scans and calls you can count. Write the rule into `docs/EVENTS-ALBERTA.md`: no sponsorship is approved without a countable action and a pre-declared threshold. This is the single easiest place for a founder with no clients to waste four figures.
impact 3/5 · effort 1/5 · touches: docs/EVENTS-ALBERTA.md

---

## Hyper-local content and site changes

51. **LOCAL-MARKET-PARTNERSHIPS-051 — Add a visible "Where we work" module to the homepage listing the municipalities by name.** The page says "Edmonton-built" once in the hero eyebrow and then never names another place, so a Sherwood Park HVAC owner has no signal that this applies to him. Add a compact section near `#industries` in `home.html` rendering the list from `docs/SERVICE-AREA.md` — Edmonton, St. Albert, Sherwood Park, Spruce Grove, Stony Plain, Leduc, Nisku, Beaumont, Fort Saskatchewan, Devon, Morinville, Acheson — with an honest closing line that the AI works anywhere in Canada and these are simply where the founder can drive out. Then run `node scripts/build-schema.mjs` and `node scripts/promote.mjs`.
impact 4/5 · effort 2/5 · touches: home.html, docs/SERVICE-AREA.md, scripts/build-schema.mjs, scripts/promote.mjs

52. **LOCAL-MARKET-PARTNERSHIPS-052 — Say plainly that clients get a local 780/587/825 number, and add it to the FAQ.** A Calgary or Toronto area code on a caller ID is an instant trust penalty in Edmonton, and callers do notice. The stack already runs on Twilio, so local numbers are trivial — but nothing on the site says so, and it is a concrete differentiator against offshore and US answering services. Add a `<details>` item to the 14-item FAQ in `home.html` ("Will the number be local?") and one line to the coverage copy; `scripts/build-schema.mjs` will pick the new Q&A into the FAQPage markup automatically.
impact 4/5 · effort 1/5 · touches: home.html FAQ, scripts/build-schema.mjs, llms.txt

53. **LOCAL-MARKET-PARTNERSHIPS-053 — Publish `/alberta-call-recording.html` explaining call-recording consent under Alberta's PIPA.** Alberta private-sector organisations fall under the province's own Personal Information Protection Act rather than PIPEDA, and every US-built AI receptionist competitor is silent on this — while an Alberta contractor's first question about recorded calls is exactly whether he is allowed to. Write it factually from the disclosure practice Nevamis already runs (every caller is told it is an AI and that calls are recorded), link it from `privacy.html` and the FAQ, and mark it as general information reviewed against `docs/LEGAL-REVIEW-PACKAGE.md`, not legal advice. This is a genuinely useful page only a local company would write, and associations and bookkeepers will link to it.
impact 4/5 · effort 3/5 · touches: alberta-call-recording.html (new), privacy.html, docs/LEGAL-REVIEW-PACKAGE.md, scripts/gen-sitemap.mjs

54. **LOCAL-MARKET-PARTNERSHIPS-054 — Turn the founder's own after-hours answer test into a dated, municipality-tagged public page.** The outbound plan already calls for calling a set of Edmonton trades after 5pm and logging who answered; publish that raw log — date, time, trade, municipality, outcome (live / voicemail / rang out / answering service) — with the methodology and sample size stated plainly and no business names. It is first-party, auditable, locally specific and citable, which is exactly what the site currently lacks and what `docs/CLAIMS-LEDGER.md` was built to protect. Repeat it quarterly and the page becomes a small local dataset nobody else has.
impact 4/5 · effort 3/5 · touches: new after-hours-study page, docs/CLAIMS-LEDGER.md, ai-assistant/outreach/, scripts/gen-sitemap.mjs

55. **LOCAL-MARKET-PARTNERSHIPS-055 — Publish an Edmonton trades resource hub that links out generously and asks for nothing.** One page listing the things an Edmonton trades owner actually needs — the associations from `docs/ALBERTA-ASSOCIATIONS.md`, the supply houses from `docs/SUPPLY-HOUSE-MAP.md`, City of Edmonton business licensing, Alberta Apprenticeship and Industry Training, the regional chambers, WCB Alberta — with a one-line description each and no gate, no form, no pitch beyond the footer. Outbound links to `.org` and `.ca` institutions is how a new site earns reciprocal links without asking, and it gives every partner and association conversation a concrete reason to link back. Build it through `_partials/` and `scripts/build-pages.mjs`, and set a calendar reminder to re-check the links every six months so it never rots.
impact 3/5 · effort 3/5 · touches: edmonton-trades-resources.html (new), docs/ALBERTA-ASSOCIATIONS.md, docs/SUPPLY-HOUSE-MAP.md, scripts/build-pages.mjs, scripts/gen-sitemap.mjs
