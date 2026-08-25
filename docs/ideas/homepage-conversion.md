# Homepage conversion — 65 improvements

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


The homepage (`home.html` → promoted to `index.html`) is currently a 858-line, 17-section
document that reads like a product brochure written for someone with twenty minutes and a
laptop. The actual buyer is a 45-year-old Edmonton electrician standing beside a van with a
cracked phone screen and four minutes between jobs. He has one question — "will this cost me
money or make me money?" — and two things that could convince him: the sound of the AI taking
a real call, and the number that falls out of his own missed-call math. Everything below is
graded against that. The list is ordered loosely from above-the-fold decisions, through the
proof and calculator sections, through what to cut, to instrumentation and bigger bets. Every
item names the file and the section. Nothing here requires a testimonial, a client count, a
revenue figure, or a partner logo that does not exist. Where an idea touches a public claim,
`docs/CLAIMS-LEDGER.md` is referenced so the ledger stays the gate.

---

1. **HOMEPAGE-CONVERSION-001 — Fix the "first ring" claim regression before anything else.**
   `home.html:159` and `index.html:160` both read "answers on the first ring", but
   `docs/CLAIMS-LEDGER.md` CLM-02 records that exact phrase as REVISED and replaced across five
   spots on 2026-07-26 (commit 0774dd5) because there is no uptime monitoring behind it. It has
   crept back into the hero proof line. Change to "answers in seconds", and add a
   `scripts/check-consistency.js` rule for the literal string "first ring" so it cannot return.
   impact 4/5 · effort 1/5 · touches: home.html:159, index.html:160, scripts/check-consistency.js, docs/CLAIMS-LEDGER.md

2. **HOMEPAGE-CONVERSION-002 — Move the hero SVG below the CTA on mobile.**
   In the `home.html` inline `<style>` at the `@media(max-width:900px)` block, `.copy` becomes
   `display:contents` and `.stage` is given `order:3` — so on a phone the order is eyebrow, H1,
   a 200–300px decorative SVG, *then* the lede, *then* the buttons. On a 667px-tall iPhone SE
   the "Call the live AI" button lands roughly 560px down, below the fold. Change `.stage` to
   `order:6` (after `.proof`) so H1 → lede → both CTAs are visible without scrolling.
   impact 5/5 · effort 1/5 · touches: home.html inline style, @media(max-width:900px) `.stage`

3. **HOMEPAGE-CONVERSION-003 — Test the OG headline as the H1.**
   `home.html:10` already carries a sharper promise than the page itself:
   `og:title` = "Nevamis AI | Stop losing jobs to missed calls." while the H1 is the abstract
   "Every call, captured." A tradesperson parses loss faster than he parses abstraction. Run
   "Stop losing jobs to missed calls." as an H1 variant in `home.html`, keeping "Every call,
   captured." as the fallback, and measure with `hero_live_demo_call_click` +
   `hero_book_call_click` per variant.
   impact 4/5 · effort 2/5 · touches: home.html:148-151 (H1), :10 (og:title)

4. **HOMEPAGE-CONVERSION-004 — Put the price in the hero.**
   Price is objection number one for a solo trades owner and the homepage does not name a
   number until the pricing preview, roughly 12 screens down. Add a line under `.proof`:
   "Plans from C$249/month. Free 7-day pilot first." Render the 249 from
   `window.NV_PRICING.plans[0].monthly` rather than hardcoding, in the same DOMContentLoaded
   block that already builds `#pricePreview` (`home.html:822-856`).
   impact 4/5 · effort 2/5 · touches: home.html hero `.proof`, home.html:822-856, pricing-config.js

5. **HOMEPAGE-CONVERSION-005 — Add a "what happens when you call" reassurance triplet.**
   The hero asks a stranger to phone an unknown number, which is a bigger ask than clicking.
   Add three tiny mono lines directly under the hero CTA row: "It's the AI, not a salesperson ·
   Takes about 90 seconds · Nothing is sold to you." This removes the specific fear (getting
   pitched) that suppresses the highest-intent action on the page.
   impact 4/5 · effort 1/5 · touches: home.html:155-159 (`.cta` / `.proof`)

6. **HOMEPAGE-CONVERSION-006 — Show the phone number on the button, not beside it.**
   The hero primary reads "Call the live AI" with the number relegated to the `.proof` line
   below. On a phone the button *is* the dial action, so the label should be
   "Call the AI · (587) 413-0035". Same for the desktop header `.btn-ghost` at `home.html:134`,
   which currently says only "Call the AI" and gives a desktop visitor no number to write down.
   impact 3/5 · effort 1/5 · touches: home.html:134, :156

7. **HOMEPAGE-CONVERSION-007 — Delay the sticky call bar until the hero is gone.**
   `.callbar` (`assets/motion/site.css:460-466`) is `display:block` at ≤820px from page load, so
   on mobile it duplicates the hero call CTA that is already on screen and eats 60px of the
   first viewport. Add a `.callbar.show` class toggled by an IntersectionObserver on `.hero` in
   `site.js`, so the bar slides in only after the hero scrolls out.
   impact 3/5 · effort 2/5 · touches: assets/motion/site.css:460-466, site.js

8. **HOMEPAGE-CONVERSION-008 — Split the call bar into two actions.**
   Once the bar appears it offers exactly one path: dial. Split it 60/40 into
   "Call the AI · (587) 413-0035" and "Book 15 min", so a visitor who cannot make noise (in a
   customer's house, on a job site, in a truck with a passenger) still has a conversion path.
   Give the second half its own `data-evt="callbar_book_click"`.
   impact 4/5 · effort 2/5 · touches: home.html:805, assets/motion/site.css `.callbar`

9. **HOMEPAGE-CONVERSION-009 — Give every "book" CTA a distinct analytics event.**
   `data-evt="hero_book_call_click"` is currently used on the header nav button
   (`home.html:135`), the hero secondary (`:157`), the first-week mid-CTA (`:670`), and the
   final CTA (`:765`). Four very different intents collapse into one number, so Daren cannot
   tell whether people book from the hero or only after reading the whole page. Split into
   `hero_book_click`, `nav_book_click`, `firstweek_book_click`, `finalcta_book_click` and add
   the rows to `docs/analytics-events.md`.
   impact 4/5 · effort 1/5 · touches: home.html:135/157/670/765, docs/analytics-events.md

10. **HOMEPAGE-CONVERSION-010 — Standardize the booking CTA wording.**
    The same action is called "Book a call" (nav), "Book a 15-min call" (hero), "Book a strategy
    call" (first week, final CTA), and "Apply on a strategy call" (pilot.html:89). Four names
    make it feel like four different commitments. Pick one — "Book a 15-min call", because the
    duration is the objection-killer — and use it everywhere on the homepage.
    impact 3/5 · effort 1/5 · touches: home.html:135/157/670/765, book.html, pilot.html

11. **HOMEPAGE-CONVERSION-011 — Cut the simulator from the homepage.**
    `#simulator` (`home.html:362-434` plus the ~200-line FSM in `motion.js`) is the single
    largest block on the page and it demonstrates the *same* six steps that `#how` lists as text
    at `:444-451` and the `.sim-static` `<details>` restates as an ordered list at `:422-432`. It
    also sits immediately after the real audio proof, which is strictly more convincing. Move
    the whole section to `demo.html` and link to it from `#proof`. This is the biggest single
    scroll-length win available.
    impact 5/5 · effort 3/5 · touches: home.html:362-434, motion.js sim FSM, demo.html

12. **HOMEPAGE-CONVERSION-012 — Reorder the page around the money question.**
    Current order buries the ROI calculator at position 7 of 17. Proposed order: hero → capability
    strip → live call proof → ROI calculator → coverage modes → pricing preview → risk reversal +
    founder → comparison → how it works → industries → first week → FAQ → final CTA, with build
    stack and beyond collapsed (see 013, 015). Hear it, price it, de-risk it, then explain it.
    impact 5/5 · effort 3/5 · touches: home.html section order

13. **HOMEPAGE-CONVERSION-013 — Collapse the build-stack section into a disclosure.**
    `#build-stack` (`home.html:633-652`) is nine cards of implementation detail — "Business
    knowledge", "Call flow", "Qualification questions" — aimed at a buyer who is already sold and
    wants to justify the setup fee. Keep the content but wrap it in
    `<details><summary>What a Nevamis build actually includes (9 layers)</summary>` so it costs
    one line of scroll instead of a full screen.
    impact 3/5 · effort 1/5 · touches: home.html:633-652

14. **HOMEPAGE-CONVERSION-014 — Merge the two timeline sections.**
    `#process` ("Discovery / Build and test / Launch and tune", `:587-600`) and `#first-week`
    ("Day 1 Discovery / Day 2-3 Build / Day 4 Test / Day 5 Review / Day 6-7 Pilot", `:655-674`)
    tell the identical story at two resolutions, back to back. Delete `#process` and keep the
    day-numbered version, which is more concrete, moving the "You do not need to become an AI
    expert" paragraph from `:591-592` into the first-week section head.
    impact 3/5 · effort 2/5 · touches: home.html:587-600, :655-674

15. **HOMEPAGE-CONVERSION-015 — Demote the coming-soon teaser to a single line.**
    `#beyond` (`:714-731`) spends a full section on three PLANNED features that the visitor
    cannot buy, immediately before the FAQ. Replace with one sentence plus a text link in the
    footer area: "Lead follow-up, quote recovery, and owner reporting are in development — see
    what we're building." The dedicated `coming-soon.html` page already carries the detail.
    impact 3/5 · effort 1/5 · touches: home.html:714-731, coming-soon.html

16. **HOMEPAGE-CONVERSION-016 — Replace the capability rail with objection answers.**
    The `.trust-strip` list (`:259-270`) is six restatements of the lede — "24/7 call coverage",
    "Appointment and job booking" — occupying the highest-attention strip on the page after the
    hero. Swap for the three things that actually stop a sale: "Keep your existing number ·
    Free 7-day pilot, no card · Month to month, cancel anytime". Same markup, same marquee code
    in `motion.js:79-90`.
    impact 4/5 · effort 1/5 · touches: home.html:259-270

17. **HOMEPAGE-CONVERSION-017 — Put the call duration on the play button.**
    `#playLabel` reads "Hear this call" and the length only appears in the timer as "0:00 /
    0:39". Change the label to "Hear a real 39-second call" — the duration is the permission
    slip that makes someone press play between jobs. The `durs` array in `site.js:173` already
    sums to 38.6s, so keep the two in sync with a comment.
    impact 4/5 · effort 1/5 · touches: home.html:289-292, site.js:173

18. **HOMEPAGE-CONVERSION-018 — Preload the first audio clip.**
    `site.js:212-221` sets `audio.src` only on click, so the first tap on a Canadian LTE
    connection has a visible dead gap before Ava speaks — exactly the moment a skeptic decides
    the demo is broken. Add `<link rel="preload" as="audio" href="assets/call-0.mp3">` to the
    `home.html` head, or instantiate the `Audio` object with `call-0.mp3` and
    `preload="auto"` on first scroll into `#proof`.
    impact 3/5 · effort 1/5 · touches: home.html head, site.js:164-234

19. **HOMEPAGE-CONVERSION-019 — Concatenate the eleven clips into one file.**
    The player chains `assets/call-0.mp3` … `call-10.mp3` on the `ended` event
    (`site.js:223`), which inserts a network-dependent pause between every line and makes a
    fluent AI sound halting. Render a single `assets/call-full.mp3` plus a timestamp array for
    transcript highlighting; keep the individual files as the fallback if the combined fetch
    fails. This directly protects the strongest proof asset on the site.
    impact 4/5 · effort 3/5 · touches: assets/call-*.mp3, site.js:164-234

20. **HOMEPAGE-CONVERSION-020 — Collapse the transcript on mobile.**
    The eleven `.line` blocks (`home.html:294-337`) run roughly two and a half phone screens
    before the owner-summary card is reached. Show the first four lines and a
    "Show the rest of the call" toggle; auto-expand when playback starts so the highlight
    tracking in `site.js:203-221` still works.
    impact 4/5 · effort 2/5 · touches: home.html:294-337, site.js, assets/motion/site.css

21. **HOMEPAGE-CONVERSION-021 — Hoist the owner SMS card above the transcript on mobile.**
    `.owner-card` (`:345-356`) carries the single most persuasive artefact for an owner — the
    text message he would actually receive at 8:42 PM — but on a phone the `.call-grid` stacks
    it below the whole transcript. Add a mobile-only `order` so the SMS mock appears directly
    under the play button, with the transcript beneath it.
    impact 4/5 · effort 1/5 · touches: assets/motion/site.css `.call-grid`, home.html:281-357

22. **HOMEPAGE-CONVERSION-022 — Add a second worked example: the 11 PM furnace call.**
    The Cedarview electrical call is the only recorded example, and an HVAC owner has to
    translate. The Prairie Mechanical furnace scenario already exists as script in `site.js:108-114`
    and in the simulator data. Record it with the same ElevenLabs voices as
    `assets/hvac-0..n.mp3` and add a two-button toggle above the card ("Electrical · HVAC after
    hours"). Keeps the fictional-company labelling required by CLM-14.
    impact 4/5 · effort 3/5 · touches: home.html:281-344, site.js:164-234, assets/, docs/CLAIMS-LEDGER.md

23. **HOMEPAGE-CONVERSION-023 — Move the "now call it yourself" CTA to the top of the proof section.**
    The `.midcta` inside `.owner-card` (`:352-355`) is the best-placed CTA on the page — it fires
    at peak conviction — but it currently sits at the very bottom of a very tall section, so
    anyone who listens and then scrolls past the transcript never sees it. Duplicate it directly
    under the player row as well, with `data-evt="proof_call_click"`.
    impact 4/5 · effort 1/5 · touches: home.html:288-293, :352-355

24. **HOMEPAGE-CONVERSION-024 — Fire a return-state banner after a demo call.**
    `demo_phone_click` already fires on tap. Set a `sessionStorage` flag at the same moment and,
    when the visitor returns to the tab, reveal a slim bar under the header: "How did that call
    go? Book 15 minutes and we'll build that for your business." This is the highest-intent
    moment in the whole funnel and it is currently unhandled.
    impact 5/5 · effort 2/5 · touches: site.js:43-46, home.html

25. **HOMEPAGE-CONVERSION-025 — Prefill the ROI quote field from pricing-config.**
    `#roiQuote` (`home.html:560-563`) asks the visitor to enter a plan price he does not have
    yet, with the placeholder "Enter after your strategy call" — so the break-even row
    (`#roiBeRow`) almost never renders, and break-even is the most persuasive output the
    calculator has. Prefill with `NV_PRICING.plans[1].monthly` (Growth, 449) labelled
    "Growth plan — C$449/mo (change if you were quoted differently)".
    impact 5/5 · effort 1/5 · touches: home.html:560-563, site.js:271-309, pricing-config.js

26. **HOMEPAGE-CONVERSION-026 — Add trade presets to the calculator.**
    Four inputs with abstract defaults (10 / 60% / $400 / 50%) is four decisions before a
    number appears. Add a chip row above `#roiForm` — Electrical, HVAC/Plumbing, Restoration,
    Auto — that sets plausible starting values, labelled "Starting guesses. Change them to your
    own numbers." The disclaimer at `:579` already frames every figure as an estimate, so no new
    claim is made.
    impact 4/5 · effort 2/5 · touches: home.html:540-564, site.js:271-309

27. **HOMEPAGE-CONVERSION-027 — Make the ROI result sticky on mobile.**
    `.roi-out` is `position:sticky;top:86px` (`site.css:340`) but `.roi-grid` collapses to one
    column below 900px (`site.css:331`), so on a phone the numbers sit below the form and the
    visitor never sees them change as he types. Render a compact sticky result strip at the
    bottom of the viewport on mobile while `#roiForm` has focus.
    impact 4/5 · effort 2/5 · touches: assets/motion/site.css:330-348, site.js

28. **HOMEPAGE-CONVERSION-028 — Put a CTA inside the calculator result panel.**
    `.roi-out` ends with a disclaimer and nothing else. Add, immediately after `#roiRec`:
    "Want these numbers checked against your actual call log? Book 15 minutes." with
    `data-evt="roi_book_click"`. The visitor is holding a dollar figure he just produced
    himself; that is the moment to ask.
    impact 5/5 · effort 1/5 · touches: home.html:565-581

29. **HOMEPAGE-CONVERSION-029 — Add a plain-language break-even sentence.**
    `#roiBe` currently outputs "3 booked jobs per month". Follow it with a full sentence in body
    type: "At C$449/month, Nevamis pays for itself if it books 3 extra jobs a month." Owners
    reason in jobs, not dollars, and this converts the abstract math into a decision they can
    make in their head standing on a driveway.
    impact 4/5 · effort 1/5 · touches: home.html:575-578, site.js:293-299

30. **HOMEPAGE-CONVERSION-030 — Log a bucketed ROI result, not just completion.**
    `roi_calculator_complete` (`site.js:303`) fires once and carries nothing, so Daren learns
    that people used the tool but not what size of business used it. Add a
    `roi_value_bucket` event with a single bucketed property (`<1k`, `1-5k`, `5-15k`, `15k+`
    monthly opportunity). No PII, consistent with the prohibitions in `docs/analytics-events.md`,
    and it tells him which segment to prospect next week.
    impact 4/5 · effort 1/5 · touches: site.js:271-309, docs/analytics-events.md

31. **HOMEPAGE-CONVERSION-031 — Show the cost-per-recovered-booking line.**
    Add a third row to `.roi-out`: monthly plan price ÷ recovered bookings, rendered as
    "≈ C$X per booked job". Against a $95 service call or a $400 average ticket this is the
    cleanest possible framing of the offer, and it is arithmetic on numbers the visitor
    supplied, not a claim.
    impact 4/5 · effort 2/5 · touches: home.html:565-581, site.js:282-305

32. **HOMEPAGE-CONVERSION-032 — Give the comparison table a stacked mobile layout.**
    `table.compare` has `min-width:640px` inside an `overflow-x:auto` wrapper
    (`site.css:379-380`), so on a phone the eight-row comparison becomes a horizontal scroll that
    most visitors will never discover. Below 700px, render each row as a small card: the claim,
    then three labelled values. The comparison is one of the strongest sections and it is
    currently mobile-invisible.
    impact 4/5 · effort 2/5 · touches: assets/motion/site.css:378-391, home.html:609-625

33. **HOMEPAGE-CONVERSION-033 — Add a fourth comparison column: a part-time receptionist.**
    The table compares against voicemail and a DIY AI app, but the real mental comparison for a
    growing trades business is hiring someone. Add a "Part-time receptionist" column with honest
    entries — answers immediately: "During her shift"; 24/7: "No"; cost: link to a cited Alberta
    wage source rather than a made-up figure. Log the source row in `docs/CLAIMS-LEDGER.md`
    before it ships.
    impact 4/5 · effort 2/5 · touches: home.html:609-625, docs/CLAIMS-LEDGER.md

34. **HOMEPAGE-CONVERSION-034 — Move the pilot promise into the hero.**
    "7-day live pilot. No card. No automatic billing." is the single strongest risk reversal the
    business owns (CLM-06, APPROVED) and it currently appears for the first time at
    `home.html:702`, roughly thirteen sections down. Add it as a third line in the hero
    `.proof` block. Anyone who bounces from the fold currently never learns the trial is free.
    impact 5/5 · effort 1/5 · touches: home.html:155-159, :695-711

35. **HOMEPAGE-CONVERSION-035 — Move Daren's face up to the proof section.**
    The founder block (`:705-708`) is the antidote to "who is this company" for a solo,
    zero-client business, and it is currently the last thing before the coming-soon teaser.
    Place the photo and the "questions go to the person building your system" line directly
    beneath the owner SMS card in `#proof`, where the visitor has just been convinced the
    product works and is starting to wonder who is behind it.
    impact 4/5 · effort 2/5 · touches: home.html:345-356, :695-711

36. **HOMEPAGE-CONVERSION-036 — Surface the "ask the AI to have Daren call you back" path.**
    `book.html` mentions this at the bottom of the page, but it is the lowest-friction
    conversion on the whole site — no form, no calendar, no typing — and it never appears on the
    homepage. Add it to the hero reassurance triplet and to the final CTA: "Or call the AI and
    ask it to have Daren call you back."
    impact 4/5 · effort 1/5 · touches: home.html:155-159, :758-769, book.html

37. **HOMEPAGE-CONVERSION-037 — Add the four hardest objections inline under the final CTA.**
    The FAQ at `:734-755` holds fourteen answers, but a visitor who has scrolled to the final
    CTA and hesitated will not go hunting. Inline the four that block a decision — "Will callers
    know it's AI?", "Can I keep my number?", "Is the pilot really free?", "What does it cost?" —
    as one-line answers directly beneath the final CTA buttons.
    impact 4/5 · effort 2/5 · touches: home.html:758-769, :740-753

38. **HOMEPAGE-CONVERSION-038 — Reorder the FAQ by objection weight.**
    Current order opens with "Will callers know it is AI?" and "Will it sound robotic?", but
    buries "What does it cost?" at position 11 and "What if it is not a fit?" at 14 — the two
    questions that decide whether someone books. Lead with cost, pilot-is-free, keep-your-number,
    and not-a-fit; the voice-quality questions are already answered by the audio player above.
    impact 3/5 · effort 1/5 · touches: home.html:740-753

39. **HOMEPAGE-CONVERSION-039 — Add FAQPage JSON-LD.**
    `home.html:23-42` carries only Organization and WebSite schema. The fourteen `<details>` in
    `#faq` are already question/answer pairs; emitting `FAQPage` structured data makes them
    eligible for search and AI-answer surfaces where Edmonton owners are actually asking "can an
    AI answer my business phone". Zero new claims — it serializes text already on the page.
    impact 4/5 · effort 2/5 · touches: home.html:23-42, :734-755

40. **HOMEPAGE-CONVERSION-040 — Rewrite the `<title>` to lead with the job, not the brand.**
    "Nevamis AI | AI Receptionists for Canadian Businesses | Edmonton" spends the first 10
    characters on a brand nobody is searching for. Use "AI Receptionist for Edmonton Trades —
    Answers 24/7, Books the Job | Nevamis". Same for the meta description at `:7`, which should
    lead with the missed-call loss rather than the company name.
    impact 3/5 · effort 1/5 · touches: home.html:6-7

41. **HOMEPAGE-CONVERSION-041 — Bump card body copy to 16px.**
    `.ind-card p` is 14px (`site.css:327`), `.proc p` 14.5px (`:355`), `.week p` 13.5px (`:376`),
    `.stack span` 13.5px (`:367`). For the target reader — 45+, outdoors, bright screen, possibly
    reading glasses in the truck — these are below comfortable. Raise the card body scale to
    15.5–16px and let the sections get taller; a cut section (011, 013, 015) pays for the space.
    impact 3/5 · effort 1/5 · touches: assets/motion/site.css:319-376

42. **HOMEPAGE-CONVERSION-042 — Replace the internal jargon in section eyebrows.**
    "The signal path", "Behind the conversation", "Capability rail", "Coverage modes" are
    designer language. A tradesperson scanning eyebrow labels to find what he wants gets nothing
    from them. Use "What happens on a call", "Watch it work", "When it answers", "What it costs".
    Scannability for someone reading only the bold text is the whole point of an eyebrow.
    impact 3/5 · effort 1/5 · touches: home.html:365, :440, :459, :636, :658, :717

43. **HOMEPAGE-CONVERSION-043 — Cut the mobile hero link list from six to two.**
    `.hero-links` (`:160-167`) renders six navigation links directly below the hero CTA on
    mobile, competing with the two buttons at the exact moment of decision. Keep "Pricing" and
    "7-day pilot"; the rest are reachable from the hamburger and the footer.
    impact 3/5 · effort 1/5 · touches: home.html:160-167

44. **HOMEPAGE-CONVERSION-044 — Shorten the wake-overlay safety timeout.**
    `#wake` is a full-screen `var(--navy-0)` overlay and the failsafe in `home.html:811-814`
    waits 2500ms before clearing it if the motion system never boots. On a mid-range Android on
    LTE that is up to two and a half seconds of black screen. Drop to 1200ms and give `#wake`
    `opacity:0` with a CSS transition as the default state so a JS failure never blanks the page
    at all.
    impact 4/5 · effort 1/5 · touches: home.html:50, :807-815

45. **HOMEPAGE-CONVERSION-045 — Defer the WebGL aurora until after first interaction.**
    `assets/motion/aurora.js` is 13KB of WebGL that runs behind the hero, on top of GSAP,
    `MotionPathPlugin`, `hero.js` (16KB), and `cursor.js` — all before the visitor can read the
    headline. Load `aurora.js` and `cursor.js` on `requestIdleCallback` or first scroll, keeping
    only `hero.js` in the critical path. Every 100ms of mobile LCP is measurable bounce on a
    page whose whole job is a phone call.
    impact 4/5 · effort 2/5 · touches: assets/motion/main.js, home.html:817-821

46. **HOMEPAGE-CONVERSION-046 — Drop the custom cursor on the homepage.**
    `cursor.js` (10KB) only affects fine-pointer desktop users and adds nothing to a buyer who
    is deciding whether to phone a number. It is pure cost on the page where load time matters
    most. Keep it on `about.html` and the concept pages if the craft signal matters there.
    impact 2/5 · effort 1/5 · touches: assets/motion/main.js, assets/motion/cursor.js

47. **HOMEPAGE-CONVERSION-047 — Add a time-aware hero line.**
    Between 6 PM and 8 AM Edmonton time, render an extra `.proof` line: "It's 9:41 PM. Right
    now, calls to businesses like yours are going to voicemail." This is true, computed from the
    visitor's own clock, requires no data about anyone, and lands hardest on exactly the
    after-hours visitor the After Hours plan is built for.
    impact 4/5 · effort 2/5 · touches: home.html hero, site.js

48. **HOMEPAGE-CONVERSION-048 — Add trade-targeted URL parameters for outreach.**
    Sales is the bottleneck and every cold email, door hanger, or Facebook-group comment links to
    the homepage generically. Support `?trade=hvac|electrical|plumbing|restoration|auto`: swap
    the hero eyebrow to "Built for Edmonton HVAC companies", reorder `.ind-grid` so the matching
    card is first, and set the ROI presets. `site.js:26-28` already reads `location.search` for
    analytics, so the source is captured for free.
    impact 5/5 · effort 3/5 · touches: home.html hero + #industries, site.js

49. **HOMEPAGE-CONVERSION-049 — Add a named-source welcome line.**
    Extend the same parameter handling to `?src=doorhanger|coldemail|referral`, rendering a
    single acknowledgement line above the H1 ("You got our card — here's the demo line."). It
    costs nothing, closes the loop on offline outreach, and lets Daren measure which channel
    actually produces calls via the `source` field already sent in `nvSend`.
    impact 3/5 · effort 2/5 · touches: home.html hero, site.js:21-34

50. **HOMEPAGE-CONVERSION-050 — Instrument scroll depth by section.**
    Right now Daren cannot tell whether visitors quit at the simulator, the comparison table, or
    the FAQ, which makes every cut decision on this list a guess. Add one `section_reached`
    event per major section id, fired once, via the IntersectionObserver already constructed in
    `site.js:87-96`. Two weeks of this data settles items 011 through 015 empirically.
    impact 5/5 · effort 2/5 · touches: site.js:85-96, docs/analytics-events.md

51. **HOMEPAGE-CONVERSION-051 — Track audio completion rate as the proof KPI.**
    `demo_audio_play` and `demo_audio_complete` both exist (`site.js:213`, `:226`) but nothing
    reports the ratio. Add a mid-point event at line index 5 so the funnel reads
    play → half → complete. If half the people who press play quit before the booking line, the
    39-second call is too long and item 019 becomes urgent.
    impact 3/5 · effort 1/5 · touches: site.js:210-231, docs/analytics-events.md

52. **HOMEPAGE-CONVERSION-052 — Show the founding-client offer as a hero-adjacent badge.**
    CLM-07 approves "setup waived for the first five" but explicitly forbids a live
    "spots remaining" counter unless a real one exists. Render the compliant version — a static
    mint badge near the pricing preview and the hero reading "Founding client offer: setup fee
    waived — first five businesses" — which supplies genuine urgency without inventing a count.
    impact 4/5 · effort 1/5 · touches: home.html hero, :677-692, docs/CLAIMS-LEDGER.md

53. **HOMEPAGE-CONVERSION-053 — Strike through the setup fee on the pricing preview cards.**
    The card meta line built at `home.html:839-840` renders "setup C$500" as a flat cost with no
    context, which reads as a barrier. For as long as founding spots remain, render
    "setup C$500 — waived for founding clients" with the number struck. Same data source, far
    better framing, and it makes the offer concrete at the exact moment price is being evaluated.
    impact 4/5 · effort 1/5 · touches: home.html:822-856, pricing-config.js foundingClient

54. **HOMEPAGE-CONVERSION-054 — Add one differentiating line to each pricing preview card.**
    The cards currently show name, price, minutes, and setup — enough to compare on price alone,
    which is the worst possible axis. Render `plan.bestFor` (already in `pricing-config.js`)
    truncated to one line, so a visitor self-selects on fit: After Hours "mainly evenings and
    weekends", Growth "qualification, routing, and booking", Scale "multi-location".
    impact 3/5 · effort 1/5 · touches: home.html:822-856, pricing-config.js

55. **HOMEPAGE-CONVERSION-055 — Add a fourth "start here" card for the pilot.**
    Three price cards present three ways to spend money and zero ways to start free, even though
    the free pilot is the entire wedge. Add a bordered fourth card — "7-day live pilot · C$0 · no
    card" — linking to `pilot.html`, visually distinct from the paid three.
    impact 4/5 · effort 1/5 · touches: home.html:677-692, pilot.html

56. **HOMEPAGE-CONVERSION-056 — Embed the Cal.com scheduler at the bottom of the homepage.**
    `book.html` already hosts a working inline iframe
    (`https://cal.com/daren-qvlah4/nevamis-intro`). Every homepage "book" CTA currently costs a
    page load before a single time slot is visible. Embed the same iframe beneath the final CTA,
    lazy-loaded, so a convinced visitor books without leaving the page.
    impact 5/5 · effort 2/5 · touches: home.html:758-769, book.html

57. **HOMEPAGE-CONVERSION-057 — Trim the header nav from eight items to four.**
    `home.html:126-136` renders How it works, Pricing, 7-day pilot, Demo, Coming soon, About,
    Client login, plus two buttons. On desktop that is a crowded bar; on mobile it is a
    nine-item drawer. Keep Pricing, 7-day pilot, Demo, and the two buttons; move Coming soon,
    About, and Client login to the footer, which already lists all three.
    impact 3/5 · effort 1/5 · touches: home.html:126-136

58. **HOMEPAGE-CONVERSION-058 — Make the demo line the header's persistent desktop CTA.**
    `.site-header` is `position:fixed` (`site.css:47`) so its buttons are the only always-visible
    CTA on desktop, but the ghost "Call the AI" button loses visually to the primary
    "Book a call". Since the phone call is the higher-converting, lower-friction action, promote
    it: number visible, primary styling, with the booking button as the ghost.
    impact 3/5 · effort 1/5 · touches: home.html:134-135, assets/motion/site.css:86-98

59. **HOMEPAGE-CONVERSION-059 — Rewrite the final CTA headline as a decision, not a discovery.**
    "Find out what your missed calls are costing." duplicates the ROI section's job and asks for
    more curiosity from someone who has already read the entire page. Replace with the closing
    ask: "Ready to stop missing calls? Fifteen minutes, and you'll know if this fits." Keep the
    supporting paragraph at `:763` as-is — it already handles the no-pressure objection well.
    impact 3/5 · effort 1/5 · touches: home.html:762

60. **HOMEPAGE-CONVERSION-060 — Add a printable one-page summary link.**
    Trades owners forward decisions to a spouse, a partner, or an office manager who will not
    scroll a motion-heavy website. Add a small "Print this page" / one-page PDF link in the final
    CTA area covering: what it does, the three plans, the free pilot, and the demo number. This
    is reusable sales collateral that also serves cold outreach.
    impact 3/5 · effort 3/5 · touches: home.html:758-769, new print stylesheet in assets/motion/site.css

61. **HOMEPAGE-CONVERSION-061 — Add a print stylesheet.**
    Related but distinct from 060: nothing currently controls what happens when a visitor hits
    Cmd/Ctrl-P on a dark-navy page with a fixed header, a WebGL canvas, and a sticky call bar.
    A `@media print` block that forces light background, hides `.callbar`, `.site-header`,
    `#wake`, the aurora canvas, and the SVG stage, and expands every `<details>`, turns the
    homepage itself into leave-behind collateral for a $0 asset cost.
    impact 2/5 · effort 1/5 · touches: assets/motion/site.css

62. **HOMEPAGE-CONVERSION-062 — Add a no-phone-call fallback capture.**
    A visitor who wants the missed-call estimate but is not ready to book or call has no path at
    all today. Add a two-field inline form under the ROI results — business type and email — that
    posts to the engine and sends the one-page estimate. Single-purpose, requested-content
    consent under CASL, with the source and purpose stated at the field. Route to a new endpoint
    in `nevamis-engine` rather than any third-party form.
    impact 4/5 · effort 4/5 · touches: home.html:565-581, nevamis-engine API, docs/analytics-events.md

63. **HOMEPAGE-CONVERSION-063 — Use the staging twin as a real A/B harness.**
    `home.html` is a noindex twin of `index.html` promoted by `scripts/promote.mjs` — that is
    already half an experiment framework. Formalize it: keep a variant matrix in
    `docs/ideas/homepage-experiments.md`, run one change at a time (start with the H1 from item
    003), and read the result from the `hero_book_click` / `demo_phone_click` split from item
    009. With low traffic, judge on direction over four-week windows, not on significance theatre.
    impact 4/5 · effort 2/5 · touches: home.html, index.html, scripts/promote.mjs, docs/

64. **HOMEPAGE-CONVERSION-064 — Add a Playwright test that pins the above-the-fold contract.**
    The 37-test suite in `tests/` covers motion, pages, and a11y, but nothing asserts that the
    primary CTA is visible in a 375×667 viewport without scrolling — which is exactly the
    regression item 002 fixes and exactly what a future motion change will silently undo. Add an
    `interactions.spec.js` case asserting `boundingBox().y + height < 667` for the hero primary
    button, plus one asserting the string "first ring" appears nowhere in the DOM.
    impact 4/5 · effort 2/5 · touches: tests/interactions.spec.js, tests/pages.spec.js

65. **HOMEPAGE-CONVERSION-065 — Write the homepage's one-sentence job on the page itself.**
    Seventeen sections exist because no single sentence governs what the page is for. Add a
    comment block at the top of `home.html` stating the contract: "This page has one job — get an
    Edmonton trades owner to call (587) 413-0035 or book 15 minutes. Every section either moves
    that forward or comes off." Then audit each `<section>` against it once a quarter. This is
    the guardrail that keeps the over-building failure mode out of the highest-leverage page in
    the business.
    impact 4/5 · effort 1/5 · touches: home.html, docs/ideas/homepage-conversion.md
