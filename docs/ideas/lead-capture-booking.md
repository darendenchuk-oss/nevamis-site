# Lead capture & booking — 60 improvements

> **SUPERSEDED 2026-08-09 — the commercial model this file was written against no longer exists.**
> Ideas below were authored while Nevamis sold the C$249 / C$449 / C$849 ladder (plans named
> After Hours, Growth and Scale), a Pay As You Go tier at C$49 + C$1.95/min, annual prepay, a
> setup fee with a founding-client waiver, and a 7-day live pilot — free at first, then C$150.
> Every one of those is retired, and the single-recurring-price model that replaced them on
> 2026-08-09 was itself superseded by v4 (owner directive 2026-08-22). The current model is a
> one-time Launch & Implementation fee to start, then a monthly price:
> **The Works** C$2,500 to start, then C$1,800/month (1,400 included minutes, C$0.75/min overage);
> **AI Front Desk** (recommended) C$1,500 to start, then C$1,000/month (1,400 included minutes, C$0.75/min overage);
> **Performance Partnership** (invite-only) C$2,000 to start, then C$250/month plus 15% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities (250 included minutes, C$1.10/min overage).
> Sellable add-ons, each its own sale on its own three-month start:
> Missed-Call Recovery C$300/month, Quote-Chase Engine C$450/month, Get-Paid Autopilot C$450/month.
> Terms: three months minimum on a plan alone, six with any add-on or The Works,
> then month to month on thirty days notice, with the price locked for twelve months.
> No pilot or trial at any price. `pricing-config.js` and the engine's
> `src/domain/canonical.ts` are the source of truth.
>
> The ideas are kept rather than deleted: most are about how a price is *presented*, and that work
> survives the change. But no figure, plan name or offer quoted below may be copied onto a surface,
> and any idea whose whole premise is a setup fee, a pilot, PAYG or annual prepay is moot.


Right now nevamis.ca has exactly two ways to become a lead: click through to `book.html` and
survive a 720px Cal.com iframe, or dial (587) 413-0035 and hope you remember to follow up. A
third path, the `#interestForm` on `coming-soon.html`, posts real leads to
`https://app.nevamis.ca/api/interest` — but it is buried on the roadmap page and asks for a
business email before it has earned one. That is the whole funnel. There is no callback
request, no text-message option (for a buyer demographic that lives in SMS), no capture after
someone calls the demo line, no CTA attached to the ROI calculator's output, no lead magnet, no
reminder sequence, and — because the scheduler is a plain `<iframe>` rather than the Cal embed —
no way to even know a booking happened. The ideas below are ordered: booking-page mechanics
first, then the demo line as a measurable conversion, then low-commitment alternatives, form
design, qualification, no-show reduction, and finally lead magnets and exit intent. Every item
names the file and the element. Nothing here needs a testimonial, a client count, or a number
the business cannot stand behind.

---

1. **LEAD-CAPTURE-BOOKING-001 — Stop the prefill handler from reloading the scheduler mid-selection.**
   In `book.html`'s prefill IIFE, `apply()` reassigns `frame.src` whenever any of `bkName`,
   `bkBiz`, `bkEmail` fires `change`. If a visitor picks a time slot and *then* fills in their
   email (the natural order — the fields sit above the iframe but read as optional), the iframe
   reloads and their slot selection is destroyed. Guard it: only rewrite `frame.src` once, on the
   first `change` event, and never after the iframe has been interacted with. Better still, move
   the prefill row behind a "prefill my details" disclosure so it is opt-in.
   impact 5/5 · effort 1/5 · touches: book.html (prefill IIFE, `apply()`), #bkPrefill, #bkFrame

2. **LEAD-CAPTURE-BOOKING-002 — Swap the plain iframe for the Cal.com embed so bookings are measurable.**
   `book.html` embeds `https://cal.com/daren-qvlah4/nevamis-intro?hide_landing_page_details=1`
   as a raw `<iframe>`. That means `booking_start` (the external-link click) is the last event the
   funnel ever sees — a booked call and a bounced page look identical in the data. Load Cal's
   embed snippet and subscribe to `Cal("on", { action: "bookingSuccessful" })` to fire
   `window.nvTrack("booking_completed")`, plus `bookingFailed` for errors. Add `booking_completed`
   to `docs/analytics-events.md` with no props (no name/email — the dictionary forbids it).
   impact 5/5 · effort 2/5 · touches: book.html, site.js (nvTrack), docs/analytics-events.md

3. **LEAD-CAPTURE-BOOKING-003 — Capture the lead before the calendar, not inside it.**
   Today, if a visitor opens `book.html`, types their name and email into `#bkPrefill`, and then
   abandons the Cal iframe, Nevamis has nothing. Post those fields to
   `https://app.nevamis.ca/api/interest` on blur with `source: "book-abandon"`, so an abandoned
   booking is still a named lead worth one follow-up email. The endpoint already dedupes on email
   and accepts `{name, email, business, note, source, website}`, so this is a fetch call, not a
   backend change.
   impact 5/5 · effort 2/5 · touches: book.html prefill IIFE, engine src/app/api/interest/route.ts (no change needed)

4. **LEAD-CAPTURE-BOOKING-004 — Add a "request a callback" path on book.html for people who will not use a calendar.**
   A tradesperson at 6:40 AM in a truck will not scroll a Cal.com month grid. Under the scheduler
   panel in `book.html`, add a second panel: "Can't pick a time? Tell me when to call you." Three
   fields — name, mobile, and a `<select>` of "before 8am / lunchtime / after 6pm / weekend" —
   posting to `/api/interest` with `source: "callback-request"` and the window in `note`. This is
   the single biggest missing conversion path on the site.
   impact 5/5 · effort 3/5 · touches: book.html (new section), engine /api/interest

5. **LEAD-CAPTURE-BOOKING-005 — Raise the interest endpoint's rate limit before you drive traffic to it.**
   `src/app/api/interest/route.ts` sets `MAX_PER_HOUR = 10` counted **globally** across all
   submissions, not per IP. One bot burst — or, better, one successful outreach push — locks out
   every real lead for the rest of the hour, and they see the "that did not go through" fallback.
   Raise the global cap to 60/hour and add a per-email cooldown instead, or key the limit on a
   hashed IP. Do this before ideas 003 and 004 start routing traffic through it.
   impact 4/5 · effort 2/5 · touches: nevamis-engine src/app/api/interest/route.ts

6. **LEAD-CAPTURE-BOOKING-006 — Show the next three available slots on the page itself.**
   The `book.html` panel says "Pick a time that works" above a lazy-loaded iframe that takes a beat
   to render — dead air at the moment of highest intent. Pull Cal.com's availability for
   `nevamis-intro` into a JSON file via a small `scripts/fetch-slots.mjs` run daily, and render
   three chips — "Tomorrow 9:00 AM · Tomorrow 2:30 PM · Thu 8:00 AM" — that deep-link into the
   scheduler with the slot preselected. Seeing a real, near time makes booking feel like one click
   rather than a research task.
   impact 4/5 · effort 3/5 · touches: book.html, new scripts/fetch-slots.mjs, assets/slots.json

7. **LEAD-CAPTURE-BOOKING-007 — Give the booking iframe a proper loading and failure state.**
   `#bkFrame` is a 720px white rectangle until Cal.com responds; if Cal is blocked (ad blockers
   commonly block third-party schedulers) the visitor sees a blank white box and leaves. Add a
   skeleton behind the iframe and an `onload` timeout: if no `load` event within six seconds, swap
   in the callback-request panel from idea 004 and fire `nvTrack("booking_embed_failed")`. The
   "Open booking in a new tab" fallback link exists, but it sits below the fold of a 720px frame.
   impact 4/5 · effort 2/5 · touches: book.html #bkFrame, site.js

8. **LEAD-CAPTURE-BOOKING-008 — Cut the booking iframe height on mobile.**
   `#bkFrame` is hardcoded `height:720px`. On a 667px-tall iPhone SE the scheduler is taller than
   the viewport, so the "Open booking in a new tab" fallback, the phone number, and the
   `Sales@nevamis.ca` line below it are three full scrolls away. Add
   `@media(max-width:720px){#bkFrame{height:560px}}` to the page-specific `<style>` block, and
   move the fallback link *above* the iframe on mobile.
   impact 3/5 · effort 1/5 · touches: book.html inline `<style>`, #bkFrame

9. **LEAD-CAPTURE-BOOKING-009 — Name the meeting length on the button, everywhere.**
   Site-wide the primary CTA reads "Book a call" / "Book a strategy call" (`home.html:369, 391,
   904, 999`, `pricing.html:208`, plus `pilot.html` and `demo.html`). "A call" from a vendor reads
   as an open-ended sales trap. The `book.html` H1 already promises "Fifteen minutes" — put it on
   the button: "Book 15 minutes". Cheapest available reduction of perceived commitment, and it is
   already an honest claim (the Cal event `nevamis-intro` is 15 minutes).
   impact 4/5 · effort 1/5 · touches: home.html:369/391/904/999, pricing.html:208, pilot.html, demo.html, book.html header

10. **LEAD-CAPTURE-BOOKING-010 — Add an "or just send me the details" escape hatch under every Book CTA.**
    The final CTA block (`home.html:999-1000`) offers exactly two doors: book a call, or phone the
    AI. Both are synchronous and both are high-commitment. Add a third, quieter link — "Or have the
    details emailed to you" — opening the one-field email capture from idea 033. Some fraction of
    the owners reading at 10 PM want information, not a conversation, and today they have nowhere
    to go.
    impact 4/5 · effort 2/5 · touches: home.html final CTA, pricing.html:208-209, pilot.html midcta

11. **LEAD-CAPTURE-BOOKING-011 — Preserve UTM and referrer through the whole booking hop.**
    `book.html` passes `location.search` into Cal's `notes` field only if a visitor touches the
    prefill inputs, and truncates to 200 characters. Move attribution capture into `site.js`: store
    first-touch `utm_*` and `document.referrer` in `sessionStorage` on any page, then always append
    them to the Cal prefill and to any `/api/interest` post regardless of whether prefill was used.
    Without this you cannot tell whether a booked call came from a Google Business Profile, a cold
    email, or a truck decal.
    impact 4/5 · effort 2/5 · touches: site.js, book.html prefill IIFE, coming-soon.html form handler

12. **LEAD-CAPTURE-BOOKING-012 — Drop "apply" from the pilot page buttons.**
    `pilot.html` uses "Apply on a strategy call" twice. "Apply" adds friction to something that is
    already free, and "strategy call" is consultant-speak. Try "Start my free 7-day pilot" as the
    primary, with the existing sub-line ("The strategy call is the application") carrying the
    honest qualification message. The word "apply" earns scarcity credibility in that proof copy —
    keep it there, remove it from the button.
    impact 3/5 · effort 1/5 · touches: pilot.html hero cta-row, pilot.html midcta

13. **LEAD-CAPTURE-BOOKING-013 — Make the demo line a real conversion event, not a dead end.**
    `demo.html`'s only action is `tel:+15874130035`. Someone calls, is impressed, hangs up — and
    Nevamis has a Twilio log with a phone number, no name, no business, and no permission to follow
    up. Configure the ElevenLabs demo agent so that at the natural end of a demo call it asks
    "Want Daren to send you what this would look like for your business? What's your business
    called?" and writes the answer into the call summary. That turns every demo call into a
    qualified lead the founder can act on the same evening.
    impact 5/5 · effort 3/5 · touches: ElevenLabs agent prompt (docs/elevenlabs-agent-upgrade.md), demo.html copy

14. **LEAD-CAPTURE-BOOKING-014 — Let the demo AI book the strategy call directly.**
    The product's entire pitch is "it books the job." The demo line should prove that by booking
    its own sales meeting. Wire the demo agent to the same Cal.com `nevamis-intro` event via a
    booking tool, so a caller can say "yeah, set something up with Daren" and get a calendar invite
    before hanging up. This is the most persuasive demo available and it removes the entire web
    booking flow for phone-first buyers.
    impact 5/5 · effort 3/5 · touches: ElevenLabs agent tools, Cal.com nevamis-intro, demo.html copy

15. **LEAD-CAPTURE-BOOKING-015 — Add a "we just spoke" text-back on the demo line.**
    After a demo call ends, send one SMS from the demo number: "Thanks for testing the Nevamis AI.
    Here's the two-minute version of what it costs and how the free 7-day pilot works:
    nevamis.ca/pilot — Daren." One message, tied to a call the recipient initiated, with an
    opt-out. Check it against the CASL rules in `PLAYBOOK.md` and log the consent basis before
    shipping. This captures the majority who call and never click.
    impact 5/5 · effort 3/5 · touches: Twilio, nevamis-engine, PLAYBOOK.md CASL section, docs/analytics-events.md

16. **LEAD-CAPTURE-BOOKING-016 — Tell visitors what happens when they call, right at the CTA.**
    The hero asks a stranger to dial an unfamiliar number — a much larger ask than a click — and
    the unspoken fear is "a salesperson answers and I end up on a list." Under the `.cta-row` in
    `demo.html` and beside the `home.html` hero CTA, add three mono micro-lines: "It's the AI, not
    a person · About 90 seconds · Your number isn't used for marketing." Ship the third line only
    after verifying it against `privacy.html` and the demo agent's actual configuration.
    impact 4/5 · effort 1/5 · touches: demo.html `.proof`, home.html hero, privacy.html

17. **LEAD-CAPTURE-BOOKING-017 — Put the number in the hero button label.**
    `home.html:390` renders "Call the live AI" with the number relegated to the `.proof` line
    below, while the sticky `.callbar` at the bottom of every page already does it correctly
    ("Call our AI now · (587) 413-0035"). Match the hero to the callbar. On a phone, a visible
    number is itself the proof that a real line exists behind the claim.
    impact 3/5 · effort 1/5 · touches: home.html:390, demo.html hero cta-row

18. **LEAD-CAPTURE-BOOKING-018 — Make demo-call intent measurable on desktop.**
    `demo_phone_click` and `hero_live_demo_call_click` fire on a `tel:` click, but on desktop a
    `tel:` click usually does nothing visible — the visitor reads the number and dials from their
    cell, or gives up. On non-touch devices, have the phone CTA open a small card with the number
    in large type, a "copy number" button, and a "text me the number instead" field. Fire
    `demo_number_copied` and `demo_number_texted` so the desktop path stops being guesswork.
    impact 4/5 · effort 2/5 · touches: site.js, home.html hero, demo.html, docs/analytics-events.md

19. **LEAD-CAPTURE-BOOKING-019 — Add a post-call capture block on demo.html.**
    The page currently jumps from "Three ways to push it" straight to the recorded Cedarview
    example. Insert a block between them titled "Just called it? Two questions." with two fields
    (business name, email) and the prompt "Tell me what you tried to stump it with — I read every
    one." Post to `/api/interest` with `source: "demo-post-call"`. It converts the emotional peak
    (surprise that it worked) into a lead, and doubles as free product feedback.
    impact 4/5 · effort 2/5 · touches: demo.html (new section), engine /api/interest

20. **LEAD-CAPTURE-BOOKING-020 — Offer "hear it answer as your business" as the mid-commitment step.**
    Between "call a generic demo" and "book 15 minutes" there is a gap. Add a form on `demo.html`:
    business name, trade, and city, and Nevamis configures the demo agent's greeting for that
    business and texts back a number to call within one business day. It is manual work per lead,
    which is fine at zero clients and is exactly the kind of effort that closes the first five.
    Cap it visibly: "I build these by hand, so a few per week."
    impact 5/5 · effort 4/5 · touches: demo.html (new section), ElevenLabs agent config, manual ops runbook

21. **LEAD-CAPTURE-BOOKING-021 — Add an SMS CTA everywhere the phone CTA appears.**
    Trades owners text more than they email and far more than they fill in forms, and there is not
    one `sms:` link on the site. Add `sms:+15874130035?&body=Send%20me%20the%20pilot%20details` as
    a ghost button beside every `tel:` CTA (`home.html`, `demo.html`, `pricing.html`, `pilot.html`,
    `book.html`, and the `.callbar`). Label it "Text me instead". Zero-commitment, asynchronous,
    and the reply thread *is* the sales conversation.
    impact 5/5 · effort 2/5 · touches: home.html, demo.html, pricing.html, pilot.html, book.html, assets/motion/site.css (.callbar)

22. **LEAD-CAPTURE-BOOKING-022 — Replace the two competing hero CTAs with one "start here" chooser.**
    `home.html:390-391` puts "Call the live AI" and "Book a 15-min call" side by side at near-equal
    weight, asking a cold visitor to choose between two unfamiliar commitments. Replace with one
    primary — "See what it does" — opening a three-option card: *hear it now* (tel:), *have it call
    me* (callback, idea 004), *book 15 minutes* (book.html). One decision, then a smaller decision.
    Instrument each option so you finally learn which door Edmonton trades owners walk through.
    impact 4/5 · effort 3/5 · touches: home.html hero cta-row, site.js, docs/analytics-events.md

23. **LEAD-CAPTURE-BOOKING-023 — Make the sticky callbar switch action by page.**
    The `.callbar` is identical everywhere: "Call our AI now". On `pricing.html` and `pilot.html`,
    where the visitor has already accepted the product is interesting and is now evaluating money,
    the highest-value action is booking, not demoing. Have `site.js` rewrite the callbar label and
    href per path: demo-first on `/` and `/demo.html`, "Book 15 minutes · free 7-day pilot" on
    `/pricing.html`, `/pilot.html`, and `/coming-soon.html`.
    impact 4/5 · effort 1/5 · touches: site.js, assets/motion/site.css `.callbar`

24. **LEAD-CAPTURE-BOOKING-024 — Attach a CTA to the ROI calculator's output.**
    `home.html`'s `#roi` section computes a dollar figure into `#roiOpp`/`#roiRec` and then stops.
    The visitor has just watched their own missed-call math produce a number and there is nothing
    to click. Add a CTA inside `.roi-out`, below `.disclaimer`, with the number rendered into the
    label: "Book 15 minutes and I'll show you how much of that $X is recoverable." Fire
    `roi_cta_click` so you learn whether the calculator actually sells anything.
    impact 5/5 · effort 1/5 · touches: home.html `.roi-out`, site.js `calc()`, docs/analytics-events.md

25. **LEAD-CAPTURE-BOOKING-025 — Let people email themselves the ROI result.**
    `site.js`'s `calc()` already produces the full picture (opportunity, conservative recovery,
    break-even jobs). Add a single email field under the results: "Send me this breakdown." Post
    the five inputs plus the two outputs to `/api/interest` with `source: "roi-calculator"` and the
    numbers in `note`. This is the highest-quality lead the site can produce — a named owner who
    has already disclosed job value, close rate, and missed-call volume before the first call.
    impact 5/5 · effort 2/5 · touches: home.html #roi, site.js `calc()`, engine /api/interest

26. **LEAD-CAPTURE-BOOKING-026 — Fire an event when the ROI number crosses a threshold.**
    `roi_calculator_complete` fires once on any full input set, so a visitor idly poking the
    defaults and one who entered 25 missed calls at $1,400 a job are indistinguishable. Add
    `roi_high_value` when `oppValue` exceeds roughly $5,000/month. Combined with idea 025 it tells
    you which visitors to chase, and whether the current defaults (10 missed / 60% / $400 / 50%)
    are anywhere near real Edmonton trades numbers.
    impact 3/5 · effort 1/5 · touches: site.js `calc()`, docs/analytics-events.md

27. **LEAD-CAPTURE-BOOKING-027 — Turn the pilot eligibility prose into a self-check.**
    `pilot.html` buries eligibility in a `<dl class="qa">` — "legitimate businesses… authority to
    forward the business line… one pilot per business within 12 months." Convert it to four
    checkboxes above the CTA: "I can forward my business line", "I'm the owner or can authorise
    it", "We're in Alberta", "We're not in a regulated, medical, or dispatch category." All four
    checked unlocks a CTA reading "You're eligible — book 15 minutes." Qualification the prospect
    performs on himself converts better than qualification you perform on him.
    impact 4/5 · effort 2/5 · touches: pilot.html, site.js

28. **LEAD-CAPTURE-BOOKING-028 — Ask the one question that predicts fit, and only that one.**
    Before the calendar on `book.html`, ask a single `<select>`: "About how many calls do you miss
    in a week?" with buckets (0-3 / 4-10 / 11-25 / 25+). Two seconds to answer, it feeds the Cal
    `notes` field so the founder walks in knowing the shape of the deal, and a "0-3" answer lets
    you route gently to Pay As You Go rather than burning a 15-minute slot. Render any price shown
    from `window.NV_PRICING`, never hardcoded.
    impact 4/5 · effort 2/5 · touches: book.html, pricing-config.js

29. **LEAD-CAPTURE-BOOKING-029 — Add a trade selector that changes the booking page's proof line.**
    A `<select>` of electrical / HVAC / plumbing / restoration / automotive / other above the
    scheduler, swapping one sentence describing what the AI handles for that trade ("After-hours
    no-heat calls get triaged and the on-call tech is booked" for HVAC). Reuse the copy that
    already exists in the industries section of `home.html`. It also writes the trade into the Cal
    `notes` so the founder can prep. This is capability description, not proof — no invented claims.
    impact 3/5 · effort 2/5 · touches: book.html, home.html industries copy

30. **LEAD-CAPTURE-BOOKING-030 — Publish what to bring to the call, not just what it covers.**
    `book.html` has a good three-card agenda ("Your call patterns / What Nevamis would handle /
    Your quote") but says nothing about what the visitor needs on hand. Add a short list: "Have a
    rough sense of your weekly call volume, your average job value, and who answers after 5pm."
    People who cannot answer those self-select out, which is good, and people who can arrive ready,
    which shortens the path to a quote and a pilot.
    impact 3/5 · effort 1/5 · touches: book.html `.proc` section

31. **LEAD-CAPTURE-BOOKING-031 — Cut the "Business name" field from the book.html prefill row.**
    `#bkPrefill` asks for name, business, and email before the calendar. Cal.com asks for name and
    email again in its own form, so the prefill row's only unique contribution is the business
    name — and three empty boxes stacked above a scheduler read as a wall. Reduce to name plus
    email (which genuinely save typing) and collect business name inside Cal's own booking
    questions, where it is asked once, in context.
    impact 4/5 · effort 1/5 · touches: book.html #bkPrefill, Cal.com nevamis-intro booking questions

32. **LEAD-CAPTURE-BOOKING-032 — Cut the coming-soon interest form to four fields plus consent.**
    `#interestForm` on `coming-soon.html` asks for name, business, business email, phone, industry,
    "result that matters most", a multi-checkbox service list, a free-text problem field, and a
    consent box. That is a nine-field commitment on a page about features that do not exist yet.
    Keep name, email, business, and the service checkboxes. Make industry, phone, result, and
    problem progressive — revealed after a successful first submit ("Two more questions and I'll
    tailor what I send you"). The endpoint already accepts partial `note` content.
    impact 4/5 · effort 2/5 · touches: coming-soon.html #interestForm and its submit handler

33. **LEAD-CAPTURE-BOOKING-033 — Build one reusable one-field email capture component.**
    Several ideas here (010, 025, 054, 058) need the same thing: an email box, a button, a consent
    micro-line, a POST to `/api/interest`, and a success state. Build it once in `site.js` as
    `nvCapture(el, {source, note})` driven by a `data-nv-capture="roi"` attribute, styled with the
    existing `.panel` and `.btn-primary` classes in `assets/motion/site.css`. One implementation,
    one place to fix, one consistent consent line that satisfies CASL.
    impact 4/5 · effort 2/5 · touches: site.js, assets/motion/site.css

34. **LEAD-CAPTURE-BOOKING-034 — Make the interest form's failure fallback less alarming.**
    On a fetch failure the handler writes "That did not go through." A visitor who just typed nine
    fields is being told the effort was wasted before being asked to redo it in an email client.
    Rewrite as: "Saved — but the direct send didn't go through, so here are your answers in an
    email, one click to send." Also stash the payload in `sessionStorage` so a refresh restores the
    form instead of clearing it.
    impact 3/5 · effort 1/5 · touches: coming-soon.html submit handler (`ifStatus`)

35. **LEAD-CAPTURE-BOOKING-035 — Replace the required consent checkbox with a stated-purpose line.**
    `#ifConsent` is a required checkbox reading "I agree Nevamis may contact me about the services
    I selected." A required checkbox is friction that adds little over express consent given by the
    act of submitting when the purpose is stated at the point of submission. Consider a sentence
    under the button instead: "Submitting means I can email you about Nevamis. One email, no list,
    unsubscribe in one click." Verify against the CASL rules in `PLAYBOOK.md` and record the
    decision in `docs/CLAIMS-LEDGER.md` — do not ship a consent change unreviewed.
    impact 3/5 · effort 2/5 · touches: coming-soon.html #ifConsent, PLAYBOOK.md, docs/CLAIMS-LEDGER.md

36. **LEAD-CAPTURE-BOOKING-036 — Add `enterkeyhint` and correct `inputmode` to every capture field.**
    The `#roiForm` inputs carry `inputmode="numeric"` (good), but `#bkPrefill` and `#interestForm`
    fields have neither `inputmode` nor `enterkeyhint`. On a phone that means the wrong keyboard on
    email and tel fields and an ambiguous return key. Add `inputmode="email"` and
    `enterkeyhint="next"` on email fields, `inputmode="tel"` on `#ifPhone`, and
    `enterkeyhint="send"` on the last field before each submit. Two minutes of work against the
    primary device of the entire target market.
    impact 3/5 · effort 1/5 · touches: book.html #bkPrefill, coming-soon.html #interestForm

37. **LEAD-CAPTURE-BOOKING-037 — Put the honeypot on every new capture.**
    `#ifWebsite` in `coming-soon.html` is a `tabindex="-1"` honeypot the interest endpoint honours
    (it returns a fake success and stores nothing). Every new capture from ideas 003, 004, 019, and
    025 must carry the same field, or the spam defence is bypassed and the global rate limit from
    idea 005 gets consumed by bots instead of buyers. Bake it into `nvCapture()` so it cannot be
    forgotten.
    impact 3/5 · effort 1/5 · touches: site.js nvCapture, engine src/app/api/interest/route.ts

38. **LEAD-CAPTURE-BOOKING-038 — Return a visible reference after any submission.**
    The interest form's success message is warm but ends there. Echo back a short reference derived
    from the created row's id ("NEV-4K2P"), plus "If you don't hear back in one business day, email
    Sales@nevamis.ca and quote that." It costs nothing, it makes a static-site form feel like a
    system rather than a mailto, and it gives the founder a lookup key when someone follows up by
    phone.
    impact 3/5 · effort 2/5 · touches: engine src/app/api/interest/route.ts response, coming-soon.html handler

39. **LEAD-CAPTURE-BOOKING-039 — Track form starts, not just form submits.**
    `roadmap_form_submitted` is the only form event that exists, so an 80% abandonment rate and a
    0% start rate are indistinguishable in the data. Fire `form_start` on first focus of any
    capture field and `form_abandon` on `visibilitychange`/`beforeunload` when a form was started
    but not submitted, with a `form` prop naming the form slug only — never contents, per the
    prohibited list in `docs/analytics-events.md`.
    impact 4/5 · effort 2/5 · touches: site.js, docs/analytics-events.md

40. **LEAD-CAPTURE-BOOKING-040 — Disqualify loudly and helpfully on the pricing page.**
    `pricing.html` presents four options with no guidance beyond each plan's `bestFor` string. A
    one-person operation taking three calls a week who books a strategy call and then hears $449/mo
    wastes both parties' time. Render a "This probably isn't for you if…" block from
    `pricing-config.js`: fewer than roughly five inbound calls a week, no business line to forward,
    or a receptionist already answering every call. Honest disqualification builds more trust than
    any badge, and it protects the founder's scarce calendar.
    impact 4/5 · effort 2/5 · touches: pricing.html, pricing-config.js

41. **LEAD-CAPTURE-BOOKING-041 — Give each plan its own CTA that carries the plan into the booking.**
    `pricing.html` ends with one shared "Book a strategy call" at line 208. Put a CTA on each plan
    card linking to `/book.html?plan=growth`; have `book.html` read the param and show "You're
    looking at Growth" with the price rendered from `window.NV_PRICING`, then pass it into Cal's
    `notes`. The founder opens the call already knowing which price the prospect self-selected,
    which is most of a discovery conversation done for free.
    impact 4/5 · effort 2/5 · touches: pricing.html plan cards, book.html, pricing-config.js

42. **LEAD-CAPTURE-BOOKING-042 — Add a "not ready yet — remind me" option with a date.**
    Plenty of trades owners are interested in February and buying in April, before the busy season.
    Today they leave and are gone. Add a small control on `pilot.html` and `pricing.html`: email
    plus a `<select>` of "in 1 month / in 3 months / before next busy season", posting to
    `/api/interest` with `source: "remind-me"` and the timing in `note`. That is a warm pipeline
    built out of people who would otherwise have been a bounce.
    impact 4/5 · effort 2/5 · touches: pilot.html, pricing.html, engine /api/interest

43. **LEAD-CAPTURE-BOOKING-043 — Ask what happens after 5pm today as the qualifying question.**
    The sharpest predictor of fit is the current arrangement. Add one question to the booking flow:
    "Right now, after 5pm, calls go to… voicemail / my cell / an answering service / nobody."
    "Answering service" is a displacement sale with a known monthly cost to beat; "voicemail" is
    the core pitch; "my cell" is the burnout pitch. Write the answer into the Cal `notes` so the
    founder opens with the right frame instead of discovering it in minute six.
    impact 4/5 · effort 1/5 · touches: book.html, Cal.com booking questions

44. **LEAD-CAPTURE-BOOKING-044 — Publish a pilot readiness checklist as a linkable page.**
    `pilot.html`'s "What do you need from me?" answer buries the real prerequisites in a `<dd>`.
    Break them out into `/pilot-checklist.html`: business hours, service area, top five FAQs, the
    on-call escalation number, a Cal.com-compatible calendar, and the ability to set call
    forwarding with your carrier. Link it from the booking confirmation. It reduces build friction
    for the founder and is exactly the kind of concrete page a skeptical owner uses to decide you
    know what you are doing.
    impact 4/5 · effort 2/5 · touches: new pilot-checklist.html, pilot.html, scripts/gen-sitemap.mjs, sitemap.xml

45. **LEAD-CAPTURE-BOOKING-045 — Trim the offered slots and let scarcity be honest.**
    A Cal.com calendar showing wide-open availability for three weeks signals a business with no
    clients. Restrict `nevamis-intro` availability to a limited set of real windows — for example
    7:30-9:00 AM and 4:30-6:30 PM, Monday to Thursday — which also happen to be the hours a working
    tradesperson can actually take a call. That is honest scarcity: those genuinely are the good
    windows. Add a four-hour minimum booking notice so nobody books a slot ten minutes out.
    impact 4/5 · effort 1/5 · touches: Cal.com nevamis-intro event settings

46. **LEAD-CAPTURE-BOOKING-046 — Make phone the default meeting medium, not video.**
    `book.html` promises "a calendar invite with a video link." A 52-year-old plumber does not want
    to be on camera in his truck. Set the Cal event's default location to "Phone call — I call you"
    with a required phone-number question, and offer video as the alternative. Fewer no-shows,
    fewer "how do I join this" texts, and it quietly matches the product: this is a phone company.
    impact 4/5 · effort 1/5 · touches: Cal.com nevamis-intro location settings, book.html copy line

47. **LEAD-CAPTURE-BOOKING-047 — Send an SMS reminder one hour before every booked call.**
    Cal.com supports SMS workflows; enable one on `nevamis-intro` firing 60 minutes prior:
    "Nevamis call in an hour — Daren will ring you on this number. Reply R to move it, C to cancel."
    An hour is the right window for a trade whose day shifts constantly, and an explicit reschedule
    path converts a would-be no-show into a rebooking rather than a ghost.
    impact 5/5 · effort 1/5 · touches: Cal.com workflows (nevamis-intro)

48. **LEAD-CAPTURE-BOOKING-048 — Make the confirmation email give them homework.**
    The Cal confirmation currently just confirms. Make it work: "Before we talk, do one thing —
    call (587) 413-0035 and try to stump the AI. Two minutes. It'll make our call twice as useful."
    A prospect who has heard the product before the meeting arrives half-sold, and the ones who do
    it are markedly more likely to show up, because they have already invested effort.
    impact 5/5 · effort 1/5 · touches: Cal.com nevamis-intro confirmation email template

49. **LEAD-CAPTURE-BOOKING-049 — Make cancellations rebook rather than vanish.**
    Cal's default cancellation page is a dead end. Set the `nevamis-intro` cancellation redirect to
    `/book.html?rebook=1` and have `book.html` detect the param and lead with "No problem — pick a
    better time," plus the "just email me the details instead" alternative from idea 010. A
    cancellation is a warmer signal than a bounce and should never terminate the relationship.
    impact 4/5 · effort 1/5 · touches: Cal.com redirect settings, book.html

50. **LEAD-CAPTURE-BOOKING-050 — Add a post-booking thank-you page you control.**
    With the Cal embed in place (idea 002), redirect to `/booked.html` on success. That page can do
    what a Cal confirmation screen cannot: restate the 15-minute promise, link the pilot checklist
    (idea 044), invite the demo call (idea 048), give the founder's direct line, and fire
    `booking_completed` reliably. It is also the only honest conversion destination for measuring
    any future campaign.
    impact 4/5 · effort 2/5 · touches: new booked.html, book.html, robots.txt, scripts/gen-sitemap.mjs

51. **LEAD-CAPTURE-BOOKING-051 — Have the AI itself chase the no-shows.**
    When a booked call is missed, let the Nevamis agent place the follow-up: "Hi, this is the
    Nevamis AI — Daren had you down for 4:30, want me to find another time?" It is a reschedule
    mechanism and simultaneously the most convincing product demonstration available, because the
    prospect experiences outbound AI booking on himself. Confirm the outbound rules and consent
    basis against `PLAYBOOK.md` first; a missed booked meeting is an existing business
    relationship, but document the reasoning.
    impact 4/5 · effort 3/5 · touches: ElevenLabs outbound, Cal.com webhook, PLAYBOOK.md

52. **LEAD-CAPTURE-BOOKING-052 — Wire Cal.com booking webhooks into the engine.**
    The engine already exposes `src/app/api/webhooks` and has a `leads` table with attribution
    (`src/db/schema.ts:141`). Point Cal.com's `BOOKING_CREATED`, `BOOKING_CANCELLED`, and
    `BOOKING_RESCHEDULED` webhooks at it so every booked strategy call becomes a real lead row with
    source attribution rather than living only in a Google Calendar. That is the foundation for
    ever knowing cost-per-booked-call, and it costs one route handler.
    impact 4/5 · effort 3/5 · touches: nevamis-engine src/app/api/webhooks, src/db/schema.ts (leads), Cal.com webhooks

53. **LEAD-CAPTURE-BOOKING-053 — Build the one lead magnet this business is uniquely able to make.**
    Not an ebook: a recording of what the prospect's own after-hours line does today. Offer "The
    After-Hours Audit" — the visitor enters their business number, Nevamis calls it after 6 PM as a
    normal customer would, captures what happens (voicemail greeting, rings out, answering-service
    script), and emails back a one-page teardown with the missed-call math from the ROI formula
    already filled in. Genuinely valuable, impossible to fake, and it puts the founder in
    conversation with a business whose problem he has just documented. Get the consent language and
    Alberta recording rules reviewed before launch.
    impact 5/5 · effort 4/5 · touches: new landing page, engine job, Twilio, PLAYBOOK.md, privacy.html

54. **LEAD-CAPTURE-BOOKING-054 — Ship a downloadable after-hours call script.**
    A one-page PDF: the exact eight questions a receptionist should ask on an after-hours no-heat
    or no-power call, the escalation rule, and the confirmation-text template. Useful whether or
    not they buy — which is what gets it downloaded and shared inside trades Facebook groups. Gate
    it behind email only, host at `/resources/after-hours-script.pdf`, and capture through
    `nvCapture()` with `source: "lead-magnet-script"`.
    impact 4/5 · effort 3/5 · touches: new resource page, assets/, site.js nvCapture, sitemap.xml

55. **LEAD-CAPTURE-BOOKING-055 — Turn the ROI calculator into a standalone, linkable page.**
    `#roi` is buried mid-scroll on `home.html`. Lift it to `/missed-call-calculator.html` with its
    own title, description, canonical, and schema via `scripts/build-schema.mjs`. It becomes a link
    you can drop into a cold email, a Facebook group reply, or a Google Business Profile post
    without asking anyone to read a homepage — and it is a legitimate SEO asset for "missed call
    cost calculator" queries. Keep the homepage instance; both render the same markup.
    impact 4/5 · effort 3/5 · touches: new missed-call-calculator.html, home.html #roi, scripts/build-schema.mjs, scripts/gen-sitemap.mjs

56. **LEAD-CAPTURE-BOOKING-056 — Add a tasteful exit-intent on pricing.html and pilot.html only.**
    Not a homepage popup. On the two pages where a visitor is deciding about money, trigger once
    per visitor (`localStorage`, guarded like the existing `safeGet`/`safeSet` in `site.js`) on
    desktop mouse-exit toward the browser chrome, and never on mobile: a small `.panel` card, no
    overlay dimming, one line — "Before you go: the 7-day pilot costs nothing and there's no card"
    — plus the email capture and a visible close. Respect `prefers-reduced-motion` and make Escape
    close it.
    impact 4/5 · effort 3/5 · touches: site.js, pricing.html, pilot.html, assets/motion/site.css

57. **LEAD-CAPTURE-BOOKING-057 — Add a scroll-depth CTA switch instead of a homepage popup.**
    Gentler than exit intent and better suited to `home.html`: once a visitor scrolls past `#roi`
    (they have now heard the proof audio, watched the simulator, and run their own numbers), swap
    the sticky `.callbar` into a two-action variant — "Call the AI" *and* "Book 15 minutes" —
    instead of the single demo action. Reuse the IntersectionObserver pattern already in `site.js`
    for `.pstep`. No new UI surface, no modal.
    impact 3/5 · effort 2/5 · touches: site.js, assets/motion/site.css `.callbar`, home.html

58. **LEAD-CAPTURE-BOOKING-058 — Put a capture on 404.html.**
    `404.html` is 102 lines of navigation. Anyone landing there from a stale link or a mistyped
    business-card URL is high-intent and currently gets a signpost. Add the demo number in large
    type, a one-field "what were you looking for?" capture, and the booking CTA. Cheap, and the
    free-text answers tell you which URLs people expect to exist.
    impact 2/5 · effort 1/5 · touches: 404.html, site.js nvCapture

59. **LEAD-CAPTURE-BOOKING-059 — Add a "text this page to my phone" desktop-to-phone bridge.**
    A visitor researching on a laptop at the kitchen table needs the number on the device he will
    actually dial with. Add a small control beside the `home.html` hero CTA that takes a mobile
    number and sends one message containing the demo line and the pilot link. It is a genuine
    convenience, it captures a mobile number with an obvious stated purpose, and it bridges the
    biggest device gap in this funnel. Log the consent basis per CASL.
    impact 4/5 · effort 3/5 · touches: home.html hero, nevamis-engine (Twilio send), PLAYBOOK.md

60. **LEAD-CAPTURE-BOOKING-060 — Extend the Playwright suite to cover the capture paths.**
    `tests/interactions.spec.js` covers the audio player, the coverage tabs, and the calculator,
    but nothing in `tests/` asserts that the booking iframe loads, that the prefill does not
    clobber a slot selection (idea 001), that the honeypot is present on every capture, or that
    each form has a labelled, keyboard-reachable submit. Add `tests/capture.spec.js` with one test
    per capture surface. Lead capture is the only revenue path on this site; it deserves the test
    discipline the hero animation already has.
    impact 4/5 · effort 2/5 · touches: tests/capture.spec.js, playwright.config.js
