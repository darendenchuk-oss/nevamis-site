# Analytics & experimentation — 55 improvements

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


Nevamis already has more measurement machinery than most pre-revenue businesses: `nvTrack()` in `site.js`, a first-party beacon to `app.nevamis.ca/api/events`, a `site_events` table, `/ops/analytics`, and `/ops/weekly`. But reading the code end-to-end exposes a specific set of holes that matter far more than adding tools. `nvSend()` in site.js line 21 serialises only `{name, page, referrer, source}` — it silently **throws away the `data` argument**, so `roadmap_service_interest_clicked`'s `service` slug and every other property in `docs/analytics-events.md` never reaches the server. There is no session or visit identifier, so `/ops/analytics` can only show raw counts, never a conversion rate. The homepage's two biggest interactive assets — the 6-stage simulator in `motion.js` (~200 lines) and the 15-item FAQ — emit nothing at all. The server's `ALLOWED_NAMES` set in `src/app/api/events/route.ts` is a silent drop gate that already contains four dead names and is missing several the site emits. And a single phone number, `(587) 413-0035`, carries every channel, so call attribution is currently zero. The ideas below fix the pipeline first, then instrument the surfaces that answer real sales questions, then build the smallest dashboard and the smallest weekly number set a solo founder should actually look at. Experimentation ideas are deliberately conservative: at current traffic levels, honest sequential measurement and qualitative evidence beat a split test that will never reach significance, and several entries say so explicitly.

---

1. **ANALYTICS-EXPERIMENTATION-001 — Stop throwing away event properties in the beacon.** `nvSend(name)` in `site.js` (line 21) builds its payload from the `name` argument only; `window.nvTrack(name, data)` passes `data` into `window.nvEvents` and into gtag/plausible but never into `nvSend`. Change the signature to `nvSend(name, data)` and add a `props` key holding a JSON-stringified, 300-char-capped copy of `data`. Every documented property in `docs/analytics-events.md` — `service`, `module`, `on`, `services` — is currently invisible server-side, which means the "Which future service has demand?" question in that table cannot be answered today.
   impact 5/5 · effort 1/5 · touches: site.js (nvSend/nvTrack)

2. **ANALYTICS-EXPERIMENTATION-002 — Add a `props` column to `site_events` and accept it in the route.** `src/db/schema.ts` line 1085 defines `siteEvents` with no properties column, and `route.ts` never reads `body.props`. Add `props: text("props")`, extend the `ensureTable()` raw DDL string in `route.ts` (line 48) with `ALTER TABLE ... ADD COLUMN` guarded by a try/catch, and store a validated, key-allowlisted, 300-char-capped JSON blob. Enforce the allowlist server-side (`service`, `module`, `plan`, `scenario`, `question`, `variant`, `bucket`, `depth`) so the endpoint still cannot become a free-form write surface and the privacy claim on `privacy.html` line 98 stays literally true.
   impact 5/5 · effort 2/5 · touches: nevamis-engine/src/db/schema.ts, src/app/api/events/route.ts, drizzle/

3. **ANALYTICS-EXPERIMENTATION-003 — Buy three more Twilio numbers so calls have a source.** Every `tel:+15874130035` on the site (56 occurrences across 14 HTML files) shares one number with business cards, cold-call voicemail drops, and the truck decal. Provision three additional Canadian Twilio DIDs (~C$1.15/mo each) pointed at the same ElevenLabs agent: one used **only** in website CTAs, one printed on leave-behind cards, one recorded in cold-call voicemails. The number dialled becomes the channel, and for under C$4/month Daren learns whether the website or the doorstep produces demo calls — the single most important unknown pre-revenue.
   impact 5/5 · effort 2/5 · touches: Twilio console, ElevenLabs agent routing, all `tel:` links in *.html

4. **ANALYTICS-EXPERIMENTATION-004 — Define the funnel in one document before adding one more event.** Write `docs/funnel.md` with exactly six stages and the event that marks each: reach (`page_view` on `/`), interest (scroll past `#roi` or `#simulator`), proof consumed (`demo_audio_complete` or `sim_complete`), demo call (`demo_phone_click` → an actual inbound to the website-only Twilio number), booking intent (`booking_page_view`), booked (Cal.com confirmation). Everything not on that list is diagnostic, not a funnel stage. Without this, `/ops/analytics` stays a pile of counts and `/ops/weekly`'s `funnelOf()` helper has nothing coherent to assemble.
   impact 5/5 · effort 1/5 · touches: docs/funnel.md, nevamis-engine/src/app/ops/weekly/page.tsx

5. **ANALYTICS-EXPERIMENTATION-005 — Add a cookieless per-visit id so rates, not just counts, are computable.** Generate a random 16-char id in `sessionStorage` (`nv-visit`) in `site.js`, send it as `visit` on every beacon, and store it in a new `visit` column. `sessionStorage` dies with the tab, is not a cookie, is not persistent, and cannot be joined across sessions or devices — so the privacy copy on `privacy.html` ("no identifiers are stored") needs one honest edit to "a random tab-scoped visit tag that expires when you close the tab and is never linked to you." That edit buys the ability to say "38% of visits that played the call audio went on to view /book.html," which no count table can ever tell you.
   impact 5/5 · effort 3/5 · touches: site.js, schema.ts, route.ts, privacy.html

6. **ANALYTICS-EXPERIMENTATION-006 — Instrument the simulator; it is the largest untracked asset on the site.** `motion.js` runs a full FSM for `#simulator` — scenario buttons (`.sim-scenarios button`, line 311), play/pause (`[data-sim-play]`), step forward/back, and replay (line 333) — and fires zero events. Add `nvTrack("sim_scenario_selected", {scenario: slug})`, `sim_play`, and `sim_complete` (when `idx` reaches the last step). Knowing whether prospects pick the emergency-furnace scenario or the after-hours-quote scenario tells you which pain to lead with on a cold call, and `sim_play ÷ page_view` tells you whether a section costing hundreds of lines of JS earns its place.
   impact 5/5 · effort 2/5 · touches: motion.js (simulator FSM), route.ts ALLOWED_NAMES

7. **ANALYTICS-EXPERIMENTATION-007 — Track which FAQ questions get opened.** `home.html` has 15 `<details>` elements in `#faq` and none are instrumented. Add a single delegated listener in `site.js` that fires `nvTrack("faq_open", {question: <slug from a new data-q attribute>})` on the `toggle` event when `open` is true, deduped per visit. The ranked list of opened questions is a free, continuously-updating objection survey — if "What happens if the AI gets it wrong?" is opened three times more than any other, that objection belongs in the hero, in the cold-call script, and in the pilot one-pager.
   impact 5/5 · effort 2/5 · touches: home.html (#faq details), site.js, docs/analytics-events.md

8. **ANALYTICS-EXPERIMENTATION-008 — Persist UTM parameters across the session instead of only on the landing page.** `nvSend` reads `location.search` fresh on every event, so a visitor who lands on `/?utm_source=facebook` and then clicks through to `/book.html` produces a `booking_page_view` with an empty `source`. Capture the first-seen query string into `sessionStorage` (`nv-src`) on first load and always send that value. Right now every conversion event on the site is attributed to "(direct)" unless the visitor happened to convert on the landing page — which makes the "Referrer hosts" table in `/ops/analytics` structurally misleading.
   impact 5/5 · effort 2/5 · touches: site.js (nvSend)

9. **ANALYTICS-EXPERIMENTATION-009 — Parse UTMs into named fields rather than storing a raw query string.** `route.ts` line 75 stores `body.source` as an opaque 200-char slice of the query string, so `/ops/analytics` groups `utm_source=fb&utm_campaign=jan` separately from `utm_campaign=jan&utm_source=fb`. Parse client-side into `{src, med, cmp}` (source/medium/campaign only, each 40 chars, allowlisted charset) and store three columns. Grouping by campaign becomes a one-line SQL change instead of a string-matching exercise.
   impact 4/5 · effort 2/5 · touches: site.js, schema.ts, route.ts, ops/analytics/page.tsx

10. **ANALYTICS-EXPERIMENTATION-010 — Make the `ALLOWED_NAMES` gate loud instead of silent.** `route.ts` line 70 returns `{ok: true}` for unknown names and stores nothing — so adding an event to `site.js` and forgetting the server allowlist produces zero data and zero error, forever. Add an `unknown_event_names` counter row (name only, capped at 50 distinct) or log the rejected name to the existing audit trail, and surface a "Rejected event names" panel on `/ops/analytics`. This trap will bite on the very first new event added.
   impact 4/5 · effort 2/5 · touches: nevamis-engine/src/app/api/events/route.ts, ops/analytics/page.tsx

11. **ANALYTICS-EXPERIMENTATION-011 — Reconcile the allowlist with what the site actually emits.** `ALLOWED_NAMES` contains four names nothing sends (`booking_prefill_used` is sent, but `pricing_view`, `plan_selected`, `demo_audio_started`, `demo_audio_completed` are not) and omits three the site does send (`hero_live_demo_call_click`, `pricing_view_click`, `roadmap_service_interest_clicked`, `roadmap_front_desk_cta_clicked`). Every hero-CTA click and every roadmap-interest click is being dropped on the floor right now. Grep `data-evt=` across `*.html` plus `nvTrack(` across `site.js`/`motion.js`, and make that the allowlist.
   impact 5/5 · effort 1/5 · touches: nevamis-engine/src/app/api/events/route.ts, docs/analytics-events.md

12. **ANALYTICS-EXPERIMENTATION-012 — Add a CI check that the allowlist and the site stay in sync.** Write `scripts/check-events.mjs` that extracts every `data-evt="..."` value and every `nvTrack("...")` literal from the site repo, compares against a committed `docs/event-allowlist.json`, and exits non-zero on drift. Wire it into `scripts/check-consistency.js`, which already runs as a pre-deploy gate. The same JSON file is then imported by the engine route so there is exactly one source of truth for event names across two repos.
   impact 4/5 · effort 2/5 · touches: nevamis-site/scripts/check-events.mjs, check-consistency.js, engine route.ts

13. **ANALYTICS-EXPERIMENTATION-013 — Fix the rate-limit query that reads up to 3,000 rows per event.** `route.ts` lines 86-88 do `db.select({id}).from(siteEvents).where(gt(createdAt, hourAgo))` and count the array length in JS. On Turso that is a network round-trip returning thousands of rows for every single page view. Replace with `db.select({n: sql<number>\`count(*)\`})`. At any real traffic level this is the difference between a free-tier analytics endpoint and a bill.
   impact 4/5 · effort 1/5 · touches: nevamis-engine/src/app/api/events/route.ts

14. **ANALYTICS-EXPERIMENTATION-014 — Dedupe `booking_prefill_used`, which currently fires up to three times per visitor.** The `apply()` function in `book.html` (line 224) calls `nvTrack("booking_prefill_used")` on every debounced `change` across `bkName`, `bkBiz`, and `bkEmail`. Copy the `roiForm.dataset.tracked` guard pattern from `site.js` line 301 so it fires once. Inflated conversion-step counts are worse than no counts, because they make the booking funnel look healthier than it is.
   impact 3/5 · effort 1/5 · touches: book.html (prefill script)

15. **ANALYTICS-EXPERIMENTATION-015 — Filter bot traffic before it pollutes the baseline.** GitHub Pages sites attract steady crawler traffic and `page_view` fires unconditionally on every load. Add a client-side guard in `site.js` that skips the beacon when `navigator.webdriver` is true, and a server-side guard in `route.ts` that requires the `Origin` header to be in `ALLOWED_ORIGINS` (today an unknown origin still gets stored, because `corsHeaders()` only affects response headers). With ~0 real traffic, ten crawler hits look like a good day.
   impact 4/5 · effort 2/5 · touches: site.js, nevamis-engine/src/app/api/events/route.ts

16. **ANALYTICS-EXPERIMENTATION-016 — Track scroll depth in four milestones as a privacy-safe replay substitute.** Session replay tools record everything a visitor types, which is incompatible with the promise on `privacy.html`. Instead, fire `scroll_depth` with `{depth: 25|50|75|100}` once each per visit using the existing `IntersectionObserver` pattern from `site.js` line 87 on four invisible sentinel divs. On a 1,093-line homepage, knowing that the median visit dies at 35% — just past the call-proof section and before the simulator — is more actionable than any heatmap.
   impact 4/5 · effort 2/5 · touches: home.html (sentinels), site.js, route.ts allowlist

17. **ANALYTICS-EXPERIMENTATION-017 — Track section reach by name, not just percentage.** Percentages move whenever the page length changes. Attach an `IntersectionObserver` to the fourteen `id`-bearing `<section>` elements in `home.html` (`#proof`, `#simulator`, `#how`, `#solutions`, `#industries`, `#roi`, `#process`, `#compare`, `#build-stack`, `#first-week`, `#pricing-preview`, `#risk`, `#beyond`, `#faq`) and fire `section_view` with `{section: id}` once per visit at 50% visibility. That produces a stable drop-off curve that survives copy edits and directly answers "which section is where people leave?"
   impact 5/5 · effort 2/5 · touches: site.js, route.ts allowlist, ops/analytics/page.tsx

18. **ANALYTICS-EXPERIMENTATION-018 — Send bucketed ROI calculator inputs, the richest sales intel on the site.** `site.js` line 303 fires `roi_calculator_complete` with no data, discarding the four numbers a prospect just typed: missed calls per week, reachable percentage, average job value, close rate. Send them bucketed (`missed: "1-3"|"4-9"|"10+"`, `value: "<500"|"500-1500"|"1500+"`) so nothing is individually identifying. If Edmonton trades owners consistently enter a C$1,800 average job value, the entire pricing conversation and the ROI copy on `home.html` should be rebuilt around that number.
   impact 5/5 · effort 2/5 · touches: site.js (ROI calc), home.html #roi, route.ts

19. **ANALYTICS-EXPERIMENTATION-019 — Instrument the coverage mode tabs.** `site.js` line 237 wires `.modes [role=tab]` with full keyboard support and no tracking. Fire `coverage_mode_selected` with `{mode: <panel id>}` on click only (not on arrow-key navigation, which is scanning rather than intent). Whether prospects click "After hours only" or "All calls" is the difference between leading a sales call with a C$249 plan or a C$449 plan.
   impact 4/5 · effort 1/5 · touches: site.js (coverage tabs), home.html #solutions

20. **ANALYTICS-EXPERIMENTATION-020 — Instrument the industry cards.** `#industries` in `home.html` renders four trade images from `assets/industries/` (electrical, HVAC, restoration, automotive) with no interaction tracking. Add `data-evt="industry_click"` plus a `data-industry` slug to each card. Which trade prospects self-select into should drive which trade Daren cold-calls next week, and it is free to collect.
   impact 4/5 · effort 1/5 · touches: home.html #industries, site.js, route.ts

21. **ANALYTICS-EXPERIMENTATION-021 — Separate `demo_phone_click` by page and placement.** Every `tel:` CTA shares one event name across 14 files, and the server stores `page` but not placement, so a nav-bar tap and a final-CTA tap are indistinguishable within a page. Add `data-place="nav|hero|mid|footer|final"` to each `tel:` anchor and pass it as a prop. Mobile is where phone CTAs convert, and knowing that all the taps come from the sticky nav rather than the hero would change the hero.
   impact 4/5 · effort 2/5 · touches: all *.html `tel:` anchors, site.js delegated click handler

22. **ANALYTICS-EXPERIMENTATION-022 — Log every demo-line call as the pre-revenue dataset it is.** The ElevenLabs webhook at `nevamis-engine/src/app/api/webhooks/elevenlabs/route.ts` already lands unmatched calls under `tenantId: "nevamis-internal"`. Build `/ops/demo-calls` listing every inbound to (587) 413-0035 with duration, transcript, and the `callSummaries` intent/objection fields. With zero clients, the questions prospects actually ask the AI are the only real customer-research corpus that exists — and it is already being collected and never read.
   impact 5/5 · effort 3/5 · touches: nevamis-engine/src/app/ops/demo-calls/, webhooks/elevenlabs/route.ts

23. **ANALYTICS-EXPERIMENTATION-023 — Measure demo-call quality, not just volume.** For each demo-line call, compute three numbers from existing `calls` and `callSummaries` columns: duration (under 20 s means someone hung up on the greeting), whether `appointmentOutcome` was reached, and the `confidence` field. A demo line producing many 12-second calls has a greeting problem, not a traffic problem — and that is diagnosable today without any new instrumentation.
   impact 4/5 · effort 2/5 · touches: nevamis-engine ops/demo-calls, src/db/schema.ts (calls, callSummaries)

24. **ANALYTICS-EXPERIMENTATION-024 — Rebuild `/ops/analytics` around the funnel instead of four count tables.** The page currently renders `CountTable` four times (by day, by event, top pages, referrer hosts) with no rates. Add a top row showing the six funnel stages from IDEA-004 as absolute counts plus stage-to-stage conversion percentages, computed over the visit id from IDEA-005. Counts answer "did anything happen"; rates answer "where do I fix the site."
   impact 5/5 · effort 3/5 · touches: nevamis-engine/src/app/ops/analytics/page.tsx

25. **ANALYTICS-EXPERIMENTATION-025 — Add week-over-week deltas to `/ops/analytics`.** `/ops/weekly` already has a `delta(a, b)` helper comparing 7-day windows; `/ops/analytics` has none, so a 14-day count gives no sense of direction. Reuse that helper for each funnel stage and each top page. A single number with no trend beside it is a number a founder learns to ignore.
   impact 4/5 · effort 2/5 · touches: nevamis-engine/src/app/ops/analytics/page.tsx, ops/weekly/page.tsx

26. **ANALYTICS-EXPERIMENTATION-026 — Write down the five numbers Daren looks at on Monday and delete the rest.** Add a "The five" card at the top of `/ops/weekly`: (1) demo-line calls this week, (2) booked intro calls, (3) cold outreach conversations held, (4) pilots running, (5) paying clients. Everything else on that page becomes a collapsed "Detail" section. With zero clients, the risk is not too little data — it is a founder spending Monday morning reading a dashboard instead of dialling.
   impact 5/5 · effort 2/5 · touches: nevamis-engine/src/app/ops/weekly/page.tsx

27. **ANALYTICS-EXPERIMENTATION-027 — Track outbound sales activity in the same place as site analytics.** Nothing in either repo records how many trades owners Daren actually contacted this week, which is the input variable that dominates every output metric pre-revenue. Add a one-field form on `/ops/weekly` writing to a new `outreachLog` table (`day`, `channel: call|door|email|referral`, `count`, optional note). Ten seconds a day makes "conversations per booked call" computable, which is the only conversion rate that matters until there are clients.
   impact 5/5 · effort 3/5 · touches: nevamis-engine/src/db/schema.ts, src/app/ops/weekly/page.tsx

28. **ANALYTICS-EXPERIMENTATION-028 — Instrument the pricing page plan cards.** `pricing.html` (324 lines) carries only `demo_phone_click`, `client_login_click`, and one `hero_book_call_click`. Add `data-evt="plan_cta_click"` with `data-plan="after-hours|growth|scale|payg|annual"` on each plan's CTA, rendering the slug from `pricing-config.js` so it cannot drift from the canonical pricing. The allowlist already reserves a `plan_selected` name that nothing emits — this is what it was meant for.
   impact 5/5 · effort 2/5 · touches: pricing.html, pricing-config.js, site.js, route.ts

29. **ANALYTICS-EXPERIMENTATION-029 — Measure the pilot page as its own funnel.** `pilot.html` is the wedge offer, yet it fires the same three generic events as every other page. Add `pilot_page_view`, `pilot_faq_open`, and `pilot_apply_click` (on both "Apply on a strategy call" CTAs at lines 133 and 201, with `data-place` to distinguish top from bottom). If the bottom CTA outperforms the top one, the page is too long above the fold; if neither fires, the offer framing is the problem, not the traffic.
   impact 4/5 · effort 2/5 · touches: pilot.html, site.js, route.ts

30. **ANALYTICS-EXPERIMENTATION-030 — Close the Cal.com loop so `booking_start` maps to a real booking.** `book.html` fires `booking_start` on the fallback link click, but the primary path is the `#bkFrame` iframe, which produces no event at all when someone actually books. Add the Cal.com embed script's `bookingSuccessful` callback (or, simpler, set the Cal.com redirect-on-booking URL to `nevamis.ca/book.html?booked=1` and fire `booking_confirmed` when that param is present). Without this, the last and most important step of the funnel is measured by checking a calendar by hand.
   impact 5/5 · effort 2/5 · touches: book.html, Cal.com event-type settings, route.ts

31. **ANALYTICS-EXPERIMENTATION-031 — Ask "how did you hear about us?" once, in the Cal.com booking form.** Site analytics cannot see a prospect who saw a truck decal, googled "nevamis", and booked. Add a required single-select question to the `nevamis-intro` Cal.com event type with five options (Google, referral, saw the number somewhere, cold call from Daren, other). One field, zero code, and it catches exactly the attribution that first-party web analytics structurally cannot.
   impact 5/5 · effort 1/5 · touches: Cal.com event type `daren-qvlah4/nevamis-intro`

32. **ANALYTICS-EXPERIMENTATION-032 — Detect rage clicks without recording anything.** Add a small listener in `site.js` that counts clicks landing within 30 px in under 800 ms; on the third, fire `rage_click` with `{section: <nearest section id>}`. No coordinates, no text, no replay — just the section name. On a site with a custom cursor, sonar click rings, and a WebGL aurora, non-interactive decorative elements that look clickable are a real and invisible risk.
   impact 3/5 · effort 2/5 · touches: site.js, assets/motion/cursor.js, assets/motion/sonar.js

33. **ANALYTICS-EXPERIMENTATION-033 — Detect dead clicks on the hero stage.** The `#stage` SVG in `home.html` (line ~405) is a large, animated, visually dominant element marked `aria-hidden` with no click handler. Fire `dead_click` with `{el: "hero-stage"}` when it is clicked. If a meaningful share of visitors click the hero animation expecting it to play or expand, that is a one-line fix (make it trigger the call-proof player) worth more than any copy change.
   impact 3/5 · effort 1/5 · touches: home.html #stage, site.js

34. **ANALYTICS-EXPERIMENTATION-034 — Measure how far into the example call people listen.** `site.js` fires `demo_audio_play` and `demo_audio_complete` but nothing between, across 11 clips totalling ~38 s. Fire `demo_audio_progress` with `{line: idx}` at lines 3, 6, and 9 inside `playNext()`. The real ElevenLabs audio is the strongest honest proof asset on the site; knowing that most listeners bail at line 4 (the 11.3-second clip) would justify re-cutting that clip.
   impact 4/5 · effort 1/5 · touches: site.js (call player, `durs` array), route.ts

35. **ANALYTICS-EXPERIMENTATION-035 — Instrument the comparison table.** `#compare` in `home.html` is a dense competitive table (vs. voicemail, vs. answering service, vs. hiring). Track a `compare_view` section reach plus row-hover-to-read dwell over 2 s per row via `IntersectionObserver` on row groups. Whichever alternative prospects study longest is the competitor Daren is actually being compared against on sales calls — and today he is guessing.
   impact 3/5 · effort 2/5 · touches: home.html #compare, site.js

36. **ANALYTICS-EXPERIMENTATION-036 — Log the 404 path so broken inbound links surface.** `404.html` fires `page_view` with `location.pathname` — which is `/404.html` on GitHub Pages, not the URL the visitor actually requested. Read the real path from the browser's address bar (`location.href` is preserved on GH Pages 404s) and send it as a `requested` prop, truncated and allowlisted to path characters. Directory submissions, printed cards, and old links all produce 404s that are currently invisible.
   impact 3/5 · effort 1/5 · touches: 404.html, site.js, route.ts

37. **ANALYTICS-EXPERIMENTATION-037 — Build the smallest possible A/B mechanism for a static site, and gate it behind a traffic threshold.** Add a 12-line inline script in `<head>` that assigns `sessionStorage["nv-ab"]` to "a" or "b" via `Math.random()`, sets `data-ab` on `<html>`, and passes it as a `variant` prop on every event; variants are then pure CSS in `assets/motion/site.css` (`[data-ab="b"] .hero h1 { ... }`). Critically, write into `docs/experiments.md` that no test may be called before 200 conversions per arm — at the current traffic level that is months, so the mechanism exists for later and is not used to justify a decision today.
   impact 4/5 · effort 3/5 · touches: home.html/index.html head, assets/motion/site.css, docs/experiments.md

38. **ANALYTICS-EXPERIMENTATION-038 — Use sequential before/after measurement instead of split tests, and record it properly.** With single-digit daily sessions, a split test halves an already-inadequate sample. Instead, adopt a change log: `docs/change-log.md` with one line per site change (date, what changed, which metric it should move, the 14-day-before baseline). `/ops/analytics` gets a "Site changes" overlay marking those dates on the by-day chart. This is honest, costs nothing, and prevents the classic failure of changing five things and learning nothing.
   impact 5/5 · effort 2/5 · touches: docs/change-log.md, nevamis-engine/src/app/ops/analytics/page.tsx

39. **ANALYTICS-EXPERIMENTATION-039 — Run the highest-value test where the sample actually exists: the AI's greeting.** The demo line and cold outreach generate far more decisions per week than the website does. Alternate the ElevenLabs agent's opening line weekly between two phrasings (a straight "Prairie Mechanical, how can I help?" versus one naming Nevamis) and compare the under-20-second hang-up rate from IDEA-023. Same experimental rigour, applied to the surface with real volume.
   impact 4/5 · effort 2/5 · touches: ElevenLabs agent config, nevamis-engine calls/callSummaries, docs/experiments.md

40. **ANALYTICS-EXPERIMENTATION-040 — Test cold-call opener and voicemail script with a tally, not a tool.** The outreach log from IDEA-027 gains an `opener` field with two committed variants stored in `docs/experiments.md`. Fifty dials per variant is achievable in two weeks and produces a decision; fifty website sessions produces noise. Naming this explicitly in the experiments doc keeps effort pointed at the actual bottleneck.
   impact 5/5 · effort 2/5 · touches: docs/experiments.md, nevamis-engine outreachLog

41. **ANALYTICS-EXPERIMENTATION-041 — Add a `/ops/analytics` empty state that tells the truth about statistical power.** When 14-day event volume is under ~500, render a banner: "Not enough traffic to draw conclusions. Treat these as directional." This prevents the most expensive analytics mistake a solo founder makes — reading a 3-versus-1 difference as a signal and rebuilding a page because of it.
   impact 4/5 · effort 1/5 · touches: nevamis-engine/src/app/ops/analytics/page.tsx

42. **ANALYTICS-EXPERIMENTATION-042 — Separate the founder's own traffic from real visitors.** Daren loads nevamis.ca constantly while editing, and every load writes a `page_view`. Add a `?nv=dev` query flag that sets `sessionStorage["nv-optout"]`, checked by `nvSend` before it beacons, plus a persistent `localStorage` opt-out set from `/ops`. At current volumes, self-traffic is likely the majority of the dataset.
   impact 5/5 · effort 1/5 · touches: site.js (nvSend), nevamis-engine ops page

43. **ANALYTICS-EXPERIMENTATION-043 — Backfill a clean baseline before changing anything else.** Once IDEAs 011, 015, and 042 land, mark the date in `docs/change-log.md` and treat all prior `site_events` rows as unreliable (they mix bot traffic, self-traffic, and dropped event names). Add a `since` constant in `/ops/analytics` defaulting to that date. Comparing against a contaminated baseline is worse than having none.
   impact 4/5 · effort 1/5 · touches: nevamis-engine/src/app/ops/analytics/page.tsx, docs/change-log.md

44. **ANALYTICS-EXPERIMENTATION-044 — Add Playwright tests that assert events fire.** The repo has 37 tests across `tests/interactions.spec.js` and friends, none of which check instrumentation. Add `tests/analytics.spec.js` that stubs `navigator.sendBeacon`, exercises the hero CTAs, the audio player, the coverage tabs, the ROI form, and the simulator, and asserts the expected event names landed in `window.nvEvents`. Tracking silently breaking during a refactor is the normal failure mode, and it is undetectable without this.
   impact 4/5 · effort 2/5 · touches: nevamis-site/tests/analytics.spec.js, playwright.config.js

45. **ANALYTICS-EXPERIMENTATION-045 — Add a `?nv=debug` overlay that prints events as they fire.** `assets/motion/debug.js` (143 lines) already establishes the pattern for a debug surface. Extend it to render a fixed-position list of the last 20 entries in `window.nvEvents` with name and props. Verifying instrumentation by hand currently requires opening DevTools and reading the network tab; this makes it a five-second visual check on a phone.
   impact 3/5 · effort 2/5 · touches: assets/motion/debug.js, site.js

46. **ANALYTICS-EXPERIMENTATION-046 — Export events to CSV from `/ops` so analysis is not trapped in the app.** `nevamis-engine/src/app/api/export/` already exists for other entities. Add a `site_events` export with a date range. Daren will want to sort, pivot, and eyeball this data in a spreadsheet; building every possible view into the dashboard is over-building of exactly the kind the playbook warns against.
   impact 3/5 · effort 1/5 · touches: nevamis-engine/src/app/api/export/

47. **ANALYTICS-EXPERIMENTATION-047 — Record a daily rollup so the raw table can be pruned.** Add `siteEventsDaily` (`day`, `name`, `count`, `page`) written by a small job that folds rows older than 90 days and deletes the originals. Turso free-tier row limits are real, and this also makes the "By day" query on `/ops/analytics` a small scan instead of a growing one. Retention policy is also a claim worth being able to state on `privacy.html`.
   impact 3/5 · effort 3/5 · touches: nevamis-engine/src/db/schema.ts, scripts/, privacy.html

48. **ANALYTICS-EXPERIMENTATION-048 — Track the coming-soon interest form as a funnel, not a single submit event.** `coming-soon.html` (481 lines) fires `roadmap_form_submitted` only on success, so abandonment is invisible. Add `roadmap_form_start` on first field focus and `roadmap_form_abandon` on `beforeunload` when started-but-not-submitted, sending the field index reached (never contents). If 80% start and 10% finish, the form is too long — a diagnosis the current single event cannot produce.
   impact 4/5 · effort 2/5 · touches: coming-soon.html, site.js, route.ts

49. **ANALYTICS-EXPERIMENTATION-049 — Join Google Search Console query data to on-site behaviour manually, once a month.** GSC is already verified. Export the top 20 queries and landing pages to `docs/search-queries-YYYY-MM.md` and note beside each whether that landing page shows above- or below-median section-reach depth. Search intent plus on-site drop-off together tell you whether a page is attracting the wrong visitors or losing the right ones — neither number says that alone.
   impact 4/5 · effort 2/5 · touches: Google Search Console, docs/, ops/analytics

50. **ANALYTICS-EXPERIMENTATION-050 — Measure `llms.txt` and AI-crawler interest separately.** `llms.txt` (3.5 KB) exists but its fetches are invisible to a JS beacon, since crawlers do not execute `site.js`. Check GitHub Pages traffic insights or add a Cloudflare-free proxy for server-side hits, and record monthly counts of `llms.txt`, `sitemap.xml`, and `robots.txt` fetches in `docs/change-log.md`. Growing AI-crawler interest is a leading indicator for AI-assistant citations and is currently entirely unmeasured.
   impact 3/5 · effort 3/5 · touches: llms.txt, robots.txt, docs/

51. **ANALYTICS-EXPERIMENTATION-051 — Instrument the revenue-engine page's "coming soon" demand signal.** `revenue-engine.html` (311 lines) describes an unbuilt product and carries only generic CTAs. Add `re_section_view` per section and `re_waitlist_click` on the interest CTA. Which unbuilt capability generates the most interest is the single best input to the build roadmap — and it is free demand research that does not require building anything.
   impact 4/5 · effort 2/5 · touches: revenue-engine.html, site.js, route.ts

52. **ANALYTICS-EXPERIMENTATION-052 — Report device split so mobile problems become visible.** Nothing currently distinguishes phone from desktop, yet trades owners browse from a truck and the site ships a WebGL aurora, GSAP, and a custom cursor. Send a coarse `dev: "m"|"d"` bucket derived from `matchMedia("(max-width: 760px)")` — a viewport bucket, not a user-agent string, so no fingerprinting surface is added. Segment the funnel by it on `/ops/analytics`.
   impact 4/5 · effort 2/5 · touches: site.js, schema.ts, ops/analytics/page.tsx

53. **ANALYTICS-EXPERIMENTATION-053 — Report the motion-off rate.** `site.js` line 14 already computes `motionOff` from `prefers-reduced-motion` plus the `nv-motion` localStorage preference, and the site's entire visual identity rests on motion. Send it as a boolean prop on `page_view`. If a meaningful share of visitors are seeing the static fallback, the static fallback deserves as much design attention as the animated version — and right now nobody knows the number.
   impact 3/5 · effort 1/5 · touches: site.js, ops/analytics/page.tsx

54. **ANALYTICS-EXPERIMENTATION-054 — Update `docs/analytics-events.md` into a real tracking plan and keep it enforced.** The current table lists 13 events, several of which are not in the server allowlist and one of which (`roadmap_module_activated`) sends props that are discarded. Restructure it with columns for event name, trigger, allowed props, server-allowlisted (yes/no), funnel stage, and the decision the event informs — and delete any event that fails the last column. An event that informs no decision is a maintenance cost.
   impact 4/5 · effort 2/5 · touches: docs/analytics-events.md, engine route.ts ALLOWED_NAMES

55. **ANALYTICS-EXPERIMENTATION-055 — Write the one-page measurement charter that says what Nevamis will not measure.** Add `docs/measurement-charter.md` stating: no third-party analytics, no cookies, no session replay, no cross-site identifiers, no IP storage, retention capped at 90 days raw, and every event property allowlisted server-side. That document is a genuine sales asset — Canadian trades owners handing their customer phone line to an AI will ask about data handling, and PIPEDA-conscious answers are easier when the constraint is written down first rather than reverse-engineered from code.
   impact 4/5 · effort 1/5 · touches: docs/measurement-charter.md, privacy.html, sales collateral
