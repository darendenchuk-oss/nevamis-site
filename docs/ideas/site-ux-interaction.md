# Site UX & Interaction — 65 improvements

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


Written after reading `home.html` (858 lines, 16 sections), `assets/motion/site.css`, `site.js`, `motion.js`, `assets/motion/{tokens,cursor,sonar,main,hero,aurora}.js`, `pricing-config.js`, and the secondary pages (`book`, `pilot`, `demo`, `pricing`, `404`). The motion system is genuinely good — pooled sonar rings, a guarded cursor with a watchdog, fail-open `try/catch` in both site.js and motion.js, `@media(hover:hover)` gating on card lifts, a real `prefers-reduced-motion` path. The gaps are not taste gaps, they are *thumb and first-30-seconds* gaps: on a phone the hero CTA sits below a 300px decorative SVG, anchor links land under the fixed 68px header, the audio player restarts instead of pausing, the ROI result is invisible while you type on mobile, the motion toggle exists on exactly two of twelve pages, and a desktop visitor who clicks "Call the live AI" gets a `tel:` link that does nothing. Every item below names the file and the exact change. Nothing here requires a claim the business cannot support — no testimonials, no counts, no invented proof. Ordered roughly hero → mobile → motion → components → forms → a11y → verification.

---

1. **SITE-UX-INTERACTION-001 — Put the hero CTA above the SVG stage on mobile.**
   In `home.html`'s inline `@media(max-width:900px)` block the hero order is `eyebrow(1) → h1(2) → stage(3) → lede(4) → cta(5) → proof(6) → hero-links(7)`, and `.stage` is `clamp(200px,34vh,300px)`. On a 667px iPhone SE that puts "Call the live AI" roughly 480–560px down — below the fold on the most important screen of the site. Change the mobile orders to `stage:6, lede:3, cta:4, proof:5` so the decorative arch sits *after* the CTA pair. This is a five-number edit with the largest single conversion effect on the list.
   impact 5/5 · effort 1/5 · touches: home.html hero `@media(max-width:900px)` block, then `scripts/promote.mjs`

2. **SITE-UX-INTERACTION-002 — Add `scroll-margin-top` so anchor links stop landing under the fixed header.**
   `.site-header` is `position:fixed; height:68px`, and `grep scroll-margin` across `assets/motion/site.css` and every `.html` returns nothing. Every `#how`, `#industries`, `#roi`, `#faq` jump — from the nav, the mobile `.hero-links`, the footer, and the 404 page — lands with the section heading hidden behind the header. Add `:target,[id]{scroll-margin-top:84px}` and `html{scroll-behavior:smooth}` inside a `@media(prefers-reduced-motion:no-preference)` guard.
   impact 4/5 · effort 1/5 · touches: assets/motion/site.css

3. **SITE-UX-INTERACTION-003 — Ship the motion toggle on all twelve pages, not two.**
   `grep -l motion-toggle-btn *.html` returns only `home.html` and `index.html`, where the button is absolutely positioned inside `.stage`. Meanwhile `assets/motion/main.js` boots the aurora, the custom cursor, sonar and magnetics on *every* page via `<script type="module" src="assets/motion/main.js">`. That is a WCAG 2.2.2 gap on pricing, pilot, demo, book, about, coming-soon and 404. Move the `.motion-toggle-btn` into the shared footer markup (next to `© 2026 Nevamis AI`) on all pages; `site.js` already finds it by class and persists `nv-motion`.
   impact 3/5 · effort 2/5 · touches: all 12 .html footers, assets/motion/site.css `.motion-toggle-btn` positioning

4. **SITE-UX-INTERACTION-004 — Make the mobile nav dismissible: Escape, outside tap, and scroll lock.**
   In `site.js` the nav toggle only responds to its own click and to clicks on `<a>` inside. There is no Escape handler, no outside-click close, and no `overflow:hidden` on `<body>` while `.main-nav.open` — so the page scrolls behind an open menu that is `position:absolute` under a fixed header, and the menu drifts away. Add a `keydown` Escape listener, a `pointerdown` outside-close, and toggle a `nav-open` class on `<html>` that sets `overflow:hidden`.
   impact 3/5 · effort 2/5 · touches: site.js mobile-nav block, assets/motion/site.css

5. **SITE-UX-INTERACTION-005 — Move focus into the mobile menu on open and return it on close.**
   Opening the menu leaves focus on `.nav-toggle`, so a keyboard or switch user must tab backwards through the wordmark to reach the links. On open, focus `.main-nav a:first-child`; on close, restore focus to the toggle. Pair it with a simple Tab wrap so focus cannot escape into the page behind the overlay.
   impact 2/5 · effort 2/5 · touches: site.js mobile-nav block

6. **SITE-UX-INTERACTION-006 — Raise `.nav-toggle` to 44×44 and replace the `☰` glyph with inline SVG.**
   `assets/motion/site.css` sets `.nav-toggle{width:42px;height:42px}` — under the 44px minimum, and `site.js` swaps `textContent` between `☰` and `✕`, both of which render inconsistently (and sometimes as emoji) across Android system fonts. Use a 44px button containing a two-path inline SVG that CSS morphs to an X on `[aria-expanded="true"]`, and change `aria-label` from the static "Menu" to "Open menu" / "Close menu".
   impact 2/5 · effort 2/5 · touches: assets/motion/site.css, site.js, all 12 .html headers

7. **SITE-UX-INTERACTION-007 — Give the mobile call bar a second thumb target: Book.**
   `.callbar` is a single full-width `tel:` link on all 12 pages below 820px. An owner reading the FAQ at 9pm who is not ready to dial has no thumb-reachable next step. Split it into a two-up grid: `Call the AI · (587) 413-0035` (primary mint) and `Book 15 min` (ghost, `/book.html`, `data-evt="hero_book_call_click"`). Keep `env(safe-area-inset-bottom)`.
   impact 4/5 · effort 2/5 · touches: assets/motion/site.css `.callbar`, all 12 .html callbar anchors

8. **SITE-UX-INTERACTION-008 — Hide the call bar while the hero CTA is on screen.**
   On the homepage the fixed `.callbar` duplicates the hero's "Call the live AI" button, and together with the 68px fixed header eats ~128px of a 667px viewport in the exact moment the hero is trying to sell. Add an IntersectionObserver on `.hero .cta` that adds `.callbar--hidden` (translateY(100%)) while the hero CTA is visible and releases it after. Same pattern on `demo.html`, whose page-hero CTA is also the phone number.
   impact 3/5 · effort 2/5 · touches: site.js, assets/motion/site.css

9. **SITE-UX-INTERACTION-009 — Give the call bar a pressed state.**
   `.callbar` has no `:active` and no transition — on touch, where `:hover` never fires and sonar is disabled under reduced motion, tapping it produces zero feedback until the dialer opens (which on some Androids takes ~400ms). Add `.callbar:active{filter:brightness(.92);transform:translateY(1px)}` with a 90ms transition.
   impact 2/5 · effort 1/5 · touches: assets/motion/site.css

10. **SITE-UX-INTERACTION-010 — Add a universal `:active` press state to `.btn` and `.play`.**
    Searching `site.css` for `:active` returns nothing. Every button relies on `:hover` (desktop only) or the sonar ring (disabled under reduced motion and the motion toggle). Add `.btn:active,.play:active,.sim-controls button:active{transform:scale(.975)}` with `transition:transform .09s var(--e-out)`, so touch and reduced-motion users get confirmation their tap landed.
    impact 3/5 · effort 1/5 · touches: assets/motion/site.css

11. **SITE-UX-INTERACTION-011 — Gate `.btn:hover` and `.play:hover` behind `@media(hover:hover)`.**
    Card lifts are correctly wrapped in `@media(hover:hover)`, but `.btn-primary:hover`, `.btn-ghost:hover`, `.play:hover` and `.compare tbody tr:hover` are not. On iOS the hover state latches after a tap and stays until the next tap elsewhere, so the primary CTA sits in its "moved" gradient state indefinitely. Wrap all four in the same media query.
    impact 2/5 · effort 1/5 · touches: assets/motion/site.css

12. **SITE-UX-INTERACTION-012 — Make the desktop phone CTA copyable, because `tel:` does nothing on a laptop.**
    Six places link `tel:+15874130035`, including the hero primary CTA. A desktop visitor with no softphone gets an OS dialog they cancel, or silence — and the demo line *is* the product proof. On fine pointers, render the CTA as `Call the live AI · (587) 413-0035` with an adjacent copy-to-clipboard button that swaps to `Copied ✓` for 1.6s, plus a small line "on a laptop? copy it and dial from your cell." Track it as `demo_phone_copy`.
    impact 4/5 · effort 2/5 · touches: home.html hero + final CTA, demo.html, site.js

13. **SITE-UX-INTERACTION-013 — Give the audio player a real pause.**
    In `site.js` the play handler is `if (playing) { resetPlayer(); return; }` while the label reads "Pause". Pressing the button labelled Pause throws away the visitor's position in a 39-second call and returns to `0:00`. Store `audio.pause()` + the current `idx`, and resume from there; only `Replay` should reset. This is the single most-used control on the most persuasive section of the site.
    impact 4/5 · effort 2/5 · touches: site.js call-player block

14. **SITE-UX-INTERACTION-014 — Preload the next clip so the eleven-file call stops stuttering.**
    The player sets `audio.src = lines[idx].getAttribute("data-audio")` only when the previous file `ended`, which means eleven cold fetches with a network round-trip gap between every line — on a phone on LTE the "conversation" turns into stop-start. Create a second `Audio` object, set its `src` and `preload="auto"` to `lines[idx+1]` as soon as line `idx` starts, and swap the objects on `ended`.
    impact 4/5 · effort 2/5 · touches: site.js call-player block

15. **SITE-UX-INTERACTION-015 — Add a loading state to the first press of Play.**
    Between the click and `call-0.mp3` decoding there is dead air with the label already reading "Pause". Set the label to `Connecting…` and add a `.play.loading` class (pulsing mint border) until the first `playing` event fires, then swap to the real label. It costs two lines and removes the "is it broken?" moment on the proof section.
    impact 3/5 · effort 1/5 · touches: site.js, assets/motion/site.css `.play`

16. **SITE-UX-INTERACTION-016 — Make each transcript line clickable to play from there.**
    `home.html` and `demo.html` each carry eleven `.line[data-audio]` divs. Owners skim to the interesting part — "I can have an electrician there tomorrow between eight and ten. The service call is $95" (`call-4.mp3`, 11.3s, the longest and most persuasive line). Make each `.line` a `<button>`-behaving element (`role="button"`, `tabindex="0"`, Enter/Space) that sets `idx` and starts there, with a `▸` affordance revealed on hover/focus.
    impact 3/5 · effort 3/5 · touches: home.html, demo.html, site.js, assets/motion/site.css `.line`

17. **SITE-UX-INTERACTION-017 — Auto-scroll the speaking line into view on mobile.**
    `.line.speaking` gets a mint left border and lightened text, but the eleven-line transcript is roughly 900px tall on a phone — by line 5 the highlight is off-screen and the sync (the whole point of the section) is invisible. Call `lines[idx].scrollIntoView({block:'center',behavior: reduced ? 'auto' : 'smooth'})` inside `playNext`, guarded so it only fires below 960px where `.call-grid` collapses to one column.
    impact 3/5 · effort 1/5 · touches: site.js call-player block

18. **SITE-UX-INTERACTION-018 — Make the waveform a seek bar instead of decoration.**
    `drawWave()` renders `Math.sin(i*1.7)`-derived bars — synthetic art, not the audio's real amplitude — and the canvas is `aria-hidden` and inert. Either (a) make it clickable: map click-x to a cumulative offset in the hardcoded `durs` array, jump to that line and seek within it; or (b) if seeking is not worth the effort, restyle it as an honest thin progress bar. Right now it looks like a control, so people click it and nothing happens.
    impact 3/5 · effort 3/5 · touches: site.js call-player block, assets/motion/site.css `#callWave`

19. **SITE-UX-INTERACTION-019 — Add a one-time attract pulse on the Play button.**
    The single strongest asset on the site is real ElevenLabs audio of a booked call, and it sits behind a button most scrollers will not notice. When `.call-proof` first enters view, add a `ring-once`-style animation to `#playBtn` (the keyframes already exist in `site.css` for `.final-cta .btn-primary`), fire once, respect `motion-off`, and never repeat in the session.
    impact 3/5 · effort 1/5 · touches: motion.js, assets/motion/site.css

20. **SITE-UX-INTERACTION-020 — Add a "can't play audio right now?" affordance.**
    A contractor viewing this in a truck cab, a shop, or a quiet office often cannot play sound. Above the transcript add one mono line: `Sound off? The full transcript is right here — the audio just reads it aloud.` plus a `Read it instead` button that highlights each line on a timer using the existing `durs` array, no audio. Same fire-and-forget FSM, zero new assets.
    impact 3/5 · effort 2/5 · touches: home.html, demo.html, site.js

21. **SITE-UX-INTERACTION-021 — Stop the simulator and the call audio from running at once.**
    `motion.js`'s simulator and `site.js`'s audio player are independent; scroll from the call proof into `#simulator` while audio is playing and two narratives compete. Have the simulator's `tick()` dispatch a `nv:simstart` event that pauses the player, and have `playBtn` dispatch `nv:audiostart` that calls `stop()` on the simulator.
    impact 2/5 · effort 2/5 · touches: site.js, motion.js

22. **SITE-UX-INTERACTION-022 — Scale simulator step timing to line length.**
    `motion.js` uses a flat `setTimeout(tick, 1250)` for every step, so "Tuesday at ten." and "Our furnace just died and it's minus twenty out. We've got a newborn in the house." each get 1.25s. The long lines are unreadable and the short ones drag. Use `Math.min(3200, 700 + say.length * 26)` and keep 1250 as the floor for stepless states like `checking_rules`.
    impact 3/5 · effort 1/5 · touches: motion.js SIM tick

23. **SITE-UX-INTERACTION-023 — Make the six stage pills clickable jump targets.**
    `.stage-pill` elements in `home.html` are inert `<span>`s that only reflect state, while the user is offered Back/Next buttons that require up to seven presses to reach "Report". Convert them to `<button>`s that set `idx` to the first step whose `STATE_STAGE` maps to that stage. The `STATE_STAGE` map in `motion.js` already contains everything needed.
    impact 3/5 · effort 2/5 · touches: home.html, motion.js, assets/motion/site.css `.stage-pill`

24. **SITE-UX-INTERACTION-024 — Fix the simulator Play button's state semantics.**
    `el.play.textContent` flips between "Play" and "Pause" with no `aria-pressed` and no icon, so screen-reader users get a label that changes under them with no role change, and sighted users have no glanceable state. Use `▶ Play` / `❚❚ Pause` with `aria-label` updated in the same place, and keep the visible text stable-width so the control row does not reflow every 1.25s.
    impact 2/5 · effort 1/5 · touches: home.html, motion.js

25. **SITE-UX-INTERACTION-025 — Do not autoplay when a scenario button merely receives focus-driven activation.**
    In `motion.js` every `.sim-scenarios button` click immediately sets `playing = true` and calls `tick()`. A keyboard user pressing Space on each of the three buttons to compare them starts and abandons three runs, and each one steals the `aria-live` region. Keep autoplay for pointer clicks, but for keyboard activation render step 0 and wait for an explicit Play.
    impact 2/5 · effort 2/5 · touches: motion.js

26. **SITE-UX-INTERACTION-026 — Add a completion card to the simulator.**
    When `idx` reaches the last step the FSM calls `stop()` and simply sits there on `complete`. That is the highest-comprehension moment in the section and it has no exit. Render a card in `.sim-outcome`: `That's the whole loop, in about 40 seconds. Hear the real thing: (587) 413-0035` with a `Book a strategy call` button, tracked as `sim_complete_cta_click`.
    impact 4/5 · effort 2/5 · touches: motion.js render(), home.html

27. **SITE-UX-INTERACTION-027 — Keep the newest simulator line visible.**
    `render()` rebuilds `el.log.innerHTML` from scratch each tick. On mobile, where `.sim-body` collapses to one column at 940px, the log grows downward and the newest line falls below the fold while the viewport stays put. After the rebuild, scroll the last `.sim-line` into view within its column (give `.sim-log` a `max-height:280px;overflow:auto` on mobile so the page itself does not jump).
    impact 3/5 · effort 2/5 · touches: motion.js, assets/motion/site.css `.sim-log`

28. **SITE-UX-INTERACTION-028 — Add keyboard control to the simulator and say so.**
    With focus inside `#sim`, bind Space to play/pause, ArrowRight/ArrowLeft to the existing `data-sim-fwd`/`data-sim-back` handlers, and `R` to replay. Add a mono hint line under `.sim-controls`: `Space to play · ← → to step`. This turns the six-stage explainer into something a curious prospect can actually drive.
    impact 2/5 · effort 2/5 · touches: motion.js, home.html

29. **SITE-UX-INTERACTION-029 — Make the ROI result visible while typing on mobile.**
    `.roi-out` is `position:sticky; top:86px` — correct on desktop, useless below 900px where `.roi-grid` collapses to one column and the entire results panel sits under a five-field form. The owner types their job value and sees nothing change. Below 900px, render a compact sticky bar pinned to `bottom: calc(60px + env(safe-area-inset-bottom))` (above the call bar) showing `Opportunity $X/mo · Recovered $Y/mo`, updated by the same `calc()`.
    impact 5/5 · effort 3/5 · touches: assets/motion/site.css `.roi-out`, home.html, site.js ROI block

30. **SITE-UX-INTERACTION-030 — Put a CTA inside the ROI result panel.**
    `.roi-out` ends with a disclaimer and a `visually-hidden` live region. A visitor who has just watched their own numbers produce a four-figure monthly gap has literally nowhere to go without scrolling. Add: `Book a strategy call` (primary) plus `Or call the AI and describe this yourself · (587) 413-0035`, with copy that stays honest — `We'll sanity-check these against your real call log on the call.` Track as `roi_cta_click`.
    impact 5/5 · effort 1/5 · touches: home.html `.roi-out`

31. **SITE-UX-INTERACTION-031 — Show the substituted arithmetic, not just the formula.**
    `.disclaimer` states the formula in prose: `missed calls × 4.33 weeks × opportunity share × job value × close rate`. Render it with the visitor's own numbers filled in — `10 × 4.33 × 60% × $400 × 50% = $5,196/mo` — updating live. Showing the work is what makes an owner trust the number instead of dismissing it as a marketing widget, and it costs one extra line in `calc()`.
    impact 4/5 · effort 1/5 · touches: site.js ROI block, home.html

32. **SITE-UX-INTERACTION-032 — Prefill the plan field from `NV_PRICING` instead of deferring it.**
    `#roiQuote`'s placeholder reads `Enter after your strategy call` and `.hint` says pricing is scoped on the call — but `pricing-config.js` is already loaded on the page and the pricing is public. Default it to the Growth monthly (`P.plans[1].monthly`, C$449) with the hint `Growth plan shown — change it to whatever we quote you.` The break-even row then renders for everyone instead of staying `hidden` for almost every visitor.
    impact 4/5 · effort 1/5 · touches: home.html, site.js ROI block (read from `window.NV_PRICING`)

33. **SITE-UX-INTERACTION-033 — Clamp ROI inputs and stop the mouse wheel from changing them.**
    The `min`/`max` attributes on `#roiReal` and `#roiClose` are advisory only — typed values are parsed raw, so a stray `600` in the close-rate field produces an absurd six-figure "opportunity" that destroys the calculator's credibility. Clamp in `calc()`, show a soft hint (`capped at 100%`), and add `input[type=number]{ }` wheel-blocking via `addEventListener('wheel', e=>e.target.blur())` so scrolling the page over a focused field does not silently change the number.
    impact 3/5 · effort 1/5 · touches: site.js ROI block

34. **SITE-UX-INTERACTION-034 — Add `$` and `%` adornments and the right mobile keyboards.**
    `#roiValue` and `#roiQuote` are dollars, `#roiReal` and `#roiClose` are percents, and the units live only in the label text. Add absolutely-positioned adornments inside the `.roi-grid` fields, plus `enterkeyhint="done"` so the iOS keyboard offers a way out of the five-field stack.
    impact 2/5 · effort 2/5 · touches: home.html, assets/motion/site.css `.roi-grid`

35. **SITE-UX-INTERACTION-035 — Debounce the `aria-live` regions.**
    `#roiLive` in `site.js` and `#rcResult` in `pricing.html` are both `aria-live="polite"` and both rewrite on every `input` event — a screen-reader user typing "400" hears three full result announcements. Wrap both writes in a 700ms trailing debounce. Same fix, two files.
    impact 2/5 · effort 1/5 · touches: site.js, pricing.html

36. **SITE-UX-INTERACTION-036 — Add a copy-to-clipboard summary of the ROI result.**
    Owners forward things to a business partner or a spouse before deciding. A `Copy these numbers` button that puts a five-line plain-text block on the clipboard (`Missed calls/wk: 10 · Est. opportunity: $5,196/mo · Conservative recovery: $2,598/mo · nevamis.ca`) turns a page widget into something that travels into someone else's inbox. Track as `roi_copy_click`.
    impact 3/5 · effort 2/5 · touches: home.html, site.js ROI block

37. **SITE-UX-INTERACTION-037 — Add Home/End keys and panel focus to the coverage tabs.**
    `site.js` implements ArrowLeft/ArrowRight for `.modes [role=tab]` but not Home/End, and the `.mode-panel` elements have no `tabindex="-1"`, so tabbing forward from the selected tab jumps past the panel content entirely. Both are required by the ARIA tabs pattern and both are three-line fixes.
    impact 2/5 · effort 1/5 · touches: site.js coverage-tabs block, home.html

38. **SITE-UX-INTERACTION-038 — Stop the coverage tabs from stealing focus on mouse click.**
    `selectTab(i)` unconditionally calls `tabs[i].focus()`, including from the click handler. On a mouse click that forces a focus ring and, on mobile Safari, can scroll the tablist back into view mid-gesture. Only focus when the selection came from a keydown.
    impact 2/5 · effort 1/5 · touches: site.js coverage-tabs block

39. **SITE-UX-INTERACTION-039 — Make the comparison table an announced, keyboard-scrollable region with a swipe hint.**
    `.compare-wrap{overflow-x:auto}` wraps a `min-width:640px` table, so on any phone the "Nevamis" column — the entire point of the comparison — starts off-screen with no indication it exists. Add `role="region" aria-label="Comparison table, scrolls horizontally" tabindex="0"` (WCAG 2.1 scrollable-region requirement), a right-edge mask fade, and a mono `swipe →` hint that fades out on first scroll.
    impact 3/5 · effort 2/5 · touches: home.html, assets/motion/site.css `.compare-wrap`

40. **SITE-UX-INTERACTION-040 — Pin the comparison table's first column on mobile.**
    Once you swipe to reach the Nevamis column, the row label ("Books the appointment") has scrolled off the left, so the three cells are meaningless. `position:sticky;left:0` on `.compare tbody th` and `.compare thead th:first-child` with the panel background behind it makes the table readable on a phone at essentially zero cost.
    impact 3/5 · effort 1/5 · touches: assets/motion/site.css `table.compare`

41. **SITE-UX-INTERACTION-041 — Give every FAQ item a stable id and deep-link support.**
    `home.html` has fourteen `<details>` in `#faq` with no ids. Add `id="faq-free-pilot"`, `id="faq-keep-my-number"` etc., and a small script that reads `location.hash`, sets `open` on the match, and scrolls it into view. Daren can then answer a DM with `nevamis.ca/#faq-free-pilot` instead of retyping the pilot terms — sales collateral extracted from content that already exists.
    impact 4/5 · effort 2/5 · touches: home.html, site.js

42. **SITE-UX-INTERACTION-042 — Add a hover/focus copy-link affordance to each FAQ summary.**
    Building on 041: a small mono `#` button revealed on `summary:hover`/`:focus-within` that copies the deep link and flashes `Link copied`. Same pattern on the six `.pstep` "signal path" cards, which are the second-most-quoted content in outreach.
    impact 2/5 · effort 2/5 · touches: home.html, site.js, assets/motion/site.css `.faq summary`

43. **SITE-UX-INTERACTION-043 — Group the fourteen FAQ items under three subheads.**
    Fourteen undifferentiated accordions is a wall. The existing questions already cluster: *Will it sound right?* (robotic, callers know it's AI, unusual question, multiple languages), *How does it fit my setup?* (keep my number, after hours only, calendar, transfers, setup time, call review), *What does it cost and what's the risk?* (cost, free pilot, privacy, not a fit). Add three `.eyebrow mono` subheads and reorder. Pure information architecture, zero new copy.
    impact 3/5 · effort 1/5 · touches: home.html `#faq`

44. **SITE-UX-INTERACTION-044 — Add an "Expand all" control to the FAQ.**
    Some owners want to read everything; fourteen individual clicks is a tax. One `<button>` above the list that toggles `open` on all `#faq details`, label swapping between `Expand all` / `Collapse all`, `aria-pressed` reflecting state. Also makes the FAQ Ctrl+F-able, which matters for people evaluating on a laptop.
    impact 2/5 · effort 1/5 · touches: home.html, site.js

45. **SITE-UX-INTERACTION-045 — Add a dark loading skeleton to the Cal.com iframe.**
    `book.html` embeds a `loading="lazy"` iframe with `height:720px;background:#fff` — on a slow connection the booking page, the single highest-intent page on the site, is a blank white 720px rectangle in a dark layout. Render a skeleton (mono `Loading available times…` plus three shimmering row placeholders) behind the iframe, hidden on its `load` event.
    impact 4/5 · effort 2/5 · touches: book.html

46. **SITE-UX-INTERACTION-046 — Add an iframe-failure fallback after 8 seconds.**
    Ad blockers, corporate networks and strict privacy settings block third-party scheduler iframes routinely. If `load` has not fired after 8s, replace the skeleton with: `The scheduler didn't load. Open booking in a new tab, email Sales@nevamis.ca, or call (587) 413-0035 and ask the AI to have Daren call you back.` The fallback links already exist below the iframe — this just surfaces them when they are actually needed. Track as `booking_iframe_failed`.
    impact 4/5 · effort 2/5 · touches: book.html

47. **SITE-UX-INTERACTION-047 — Stop the prefill fields from re-mounting the scheduler mid-booking.**
    `book.html`'s prefill script sets `frame.src = url` 400ms after any `change` on `#bkName`/`#bkBiz`/`#bkEmail`. If a visitor picks a Thursday slot and *then* types their business name, the iframe reloads and their selection is gone. Only apply prefill before the iframe has been interacted with — or better, replace the auto-apply with an explicit `Prefill and open scheduler` button.
    impact 3/5 · effort 2/5 · touches: book.html prefill script

48. **SITE-UX-INTERACTION-048 — Give the prefill inputs real labels and a reason to exist.**
    The three fields are placeholder-only (`Your name (optional prefill)`, `Business name`, `Email`) with no `<label>` and no `aria-label`, so the accessible name vanishes the moment text is typed, and no one is told why they should fill them. Add visually-hidden labels plus one visible line: `Optional — fills in the next screen so you don't type it twice.`
    impact 3/5 · effort 1/5 · touches: book.html

49. **SITE-UX-INTERACTION-049 — Fix the nested-scroll trap on mobile booking.**
    The iframe is a fixed `height:720px` inside a scrolling page, so on a phone the visitor must scroll *inside* a 720px window inside a scrolling document to reach the time slots — the classic double-scroll trap. Below 820px, either set the iframe to `min-height:100svh` or replace it entirely with a full-width `Open the scheduler` button using the existing `cal.com` link.
    impact 3/5 · effort 2/5 · touches: book.html, assets/motion/site.css

50. **SITE-UX-INTERACTION-050 — Keep the native I-beam over body text.**
    `cursor.js` injects `html.nv-cursor-ready{cursor:none}`, which removes the cursor over every paragraph, list item and table cell on the page. Form fields are correctly exempted, but reading (and selecting the phone number to copy) with no cursor at all is disorienting on a long page. Extend the exemption list to `p, li, td, h1, h2, h3, .sms, .line p` so text keeps its I-beam while controls keep the custom node.
    impact 3/5 · effort 1/5 · touches: assets/motion/cursor.js CSS block

51. **SITE-UX-INTERACTION-051 — Add a `tel:` cursor mode — the site's best signature moment.**
    `classify()` in `cursor.js` handles button / link / form / stage. Add a fifth: `a[href^="tel:"]` → the halo becomes a ring with a small pulsing centre dot (the exact language of the hero's `#dotPulse`), plus a mono `CALL` caption. The whole design system is built around a call being answered; the pointer should say so when it lands on the demo number.
    impact 3/5 · effort 2/5 · touches: assets/motion/cursor.js

52. **SITE-UX-INTERACTION-052 — Reserve the triple-wave sonar for the money buttons.**
    `sonar.js` currently emits the same two-ring echo for every `a, button, [role=button], summary, input, select, textarea, label` — including scroll-flicks on labels. Make the double-wave signature exclusive to `.btn-primary`, `.play` and `a[href^="tel:"]`, give ordinary links a single quiet ring, and suppress the ping entirely when `pointerdown` is followed by a drag (text selection) or lands on a scrollbar.
    impact 2/5 · effort 2/5 · touches: assets/motion/sonar.js

53. **SITE-UX-INTERACTION-053 — Emit a sonar ring on keyboard activation.**
    `sonar.js` binds only `pointerdown`, so a keyboard user pressing Enter on "Book a strategy call" gets no confirmation at all while every mouse user gets a ring. Add a `keydown` listener for Enter/Space on the focused element and ping at the centre of `document.activeElement.getBoundingClientRect()`.
    impact 2/5 · effort 1/5 · touches: assets/motion/sonar.js

54. **SITE-UX-INTERACTION-054 — Cap the magnetic pull at 4px and exempt small controls.**
    `main.js` `initMagnetics` moves `a.btn, button.btn, .play` up to 8px toward the pointer. On the compact `.btn` (`padding:12px 20px`) that is a meaningful fraction of the target, and a user aiming at the edge of "Book a call" can watch it slide out from under the cursor. Drop `MAX` to 4, and skip elements narrower than 140px.
    impact 2/5 · effort 1/5 · touches: assets/motion/main.js

55. **SITE-UX-INTERACTION-055 — Scope `will-change:transform` off the base `.btn` rule.**
    `site.css` puts `will-change:transform` on every `.btn`; the homepage has well over twenty, so the browser promotes twenty-plus permanent compositor layers, which on a mid-range Android costs memory and can make scrolling the long homepage judder. Move it to `.btn:hover,.btn:focus-visible` only — the magnetic tween is the only thing that needs it and it is fine-pointer-gated anyway.
    impact 3/5 · effort 1/5 · touches: assets/motion/site.css `.btn`

56. **SITE-UX-INTERACTION-056 — Gate the WebGL aurora on device capability, not just reduced motion.**
    `aurora.js` only checks `prefersReduced()` before running a per-frame WebGL shader at `innerWidth*0.45`. The target audience opens this on whatever phone is in the truck. Add a capability gate — `navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4` falls back to the existing static path — and stop the rAF loop when the aurora canvas is out of view, not only when the tab is hidden.
    impact 3/5 · effort 2/5 · touches: assets/motion/aurora.js

57. **SITE-UX-INTERACTION-057 — Narrow the blunt reduced-motion override.**
    `@media(prefers-reduced-motion:reduce){*{transition-duration:.01ms!important}}` also kills the things that *help* — the focus-ring transition, hover colour changes, the FAQ `+` rotation that signals open state, and `.tagchip` lighting. Reduced motion means no vestibular movement, not no feedback. Replace the blanket rule with targeted `transform`/`animation` suppression and keep colour and opacity transitions at their normal speed.
    impact 3/5 · effort 2/5 · touches: assets/motion/site.css reduced-motion block

58. **SITE-UX-INTERACTION-058 — Slow the capability rail and pause it on focus.**
    `.rail-track` scrolls six capability statements at `36s linear infinite` and only pauses on `:hover`. It is one of the first things below the hero and it is genuinely hard to read while moving. Slow it to ~60s, add `:focus-within` to the pause selector, and reduce the visual weight so it reads as ambient rather than as content competing with the hero.
    impact 2/5 · effort 1/5 · touches: assets/motion/site.css `.rail-track`

59. **SITE-UX-INTERACTION-059 — Replace `.visually-hidden{left:-9999px}` with the clip-path pattern.**
    The current rule physically moves content 9999px off-canvas. It works for the two `aria-live` regions today, but the moment it wraps anything focusable (the labels proposed in 048, a skip target) the browser scrolls to the phantom location. Use the standard `clip-path:inset(50%);width:1px;height:1px;overflow:hidden` recipe plus a `:focus-within` reveal.
    impact 2/5 · effort 1/5 · touches: assets/motion/site.css

60. **SITE-UX-INTERACTION-060 — Raise the small-text floor to 13.5px.**
    `site.css` ships `.foot-note` 12.5px, `.disclaimer` 12px, `.sim-elapsed` 11px, `.tagchip` 10.5px, `.stage-pill` 10.5px, `.site-footer .base` 13px. The buyer is a 40–60 year old trades owner reading on a phone in variable light. Lift body-adjacent small text to a 13.5px floor and keep sub-12px strictly for mono labels that are decorative, not informational.
    impact 3/5 · effort 1/5 · touches: assets/motion/site.css

61. **SITE-UX-INTERACTION-061 — Lift the unlit chip contrast.**
    `.tagchip{opacity:.55;color:var(--muted)}` on `--navy-2` renders roughly 2.6:1 — the "QUALIFIED / BOOKED / CONFIRMATION SENT" chips are effectively unreadable until `.lit` is applied, and they are the section's summary of what the AI achieved. Raise the resting opacity to .75 and darken the resting border rather than fading the text, preserving the lit/unlit contrast without dropping below 4.5:1.
    impact 2/5 · effort 1/5 · touches: assets/motion/site.css `.tagchip`, `.sim-out-card`

62. **SITE-UX-INTERACTION-062 — Make phone links readable by screen readers.**
    Every `tel:+15874130035` link renders as `(587) 413-0035`, which VoiceOver reads as "five hundred eighty-seven, four hundred thirteen…". Add `aria-label="Call the Nevamis demo line, 5 8 7. 4 1 3. 0 0 3 5."` to the six phone links across `home.html`, `demo.html`, `book.html`, `404.html`, the footer and the call bar.
    impact 2/5 · effort 1/5 · touches: all 12 .html files

63. **SITE-UX-INTERACTION-063 — Add "jump to" chips below the hero to tame a sixteen-section homepage.**
    The homepage runs hero → rail → call proof → simulator → signal path → coverage → industries → ROI → process → comparison → build stack → first week → pricing → risk → coming soon → FAQ → final CTA. A skimmer who wants price or proof has no map. Add a single row of four mono chips directly under the hero proof line — `Hear a real call · What it costs · The 7-day pilot · Questions` — linking to `#proof`, `#pricing-preview`, `/pilot.html`, `#faq`. Pairs with 002's `scroll-margin-top`.
    impact 4/5 · effort 1/5 · touches: home.html

64. **SITE-UX-INTERACTION-064 — Trim the mobile hero to one decision.**
    Below 900px the hero shows two CTA buttons, a proof line with a third phone link, and a six-item `.hero-links` nav — nine tappable choices before the first scroll, on top of the header menu and the call bar. Cut `.hero-links` to three (`How it works`, `Pricing`, `7-day pilot`) or drop it entirely now that 063 provides the map; the full nav is one tap away in the header.
    impact 3/5 · effort 1/5 · touches: home.html

65. **SITE-UX-INTERACTION-065 — Lock these behaviours into the Playwright suite.**
    `tests/{interactions,motion,pages}.spec.js` already cover 37 cases. As each item above lands, add the matching assertion: at 390×844 the hero CTA is above the fold and above `#stage`; Escape closes `.main-nav`; the call bar is hidden while `.hero .cta` intersects; pressing Pause then Play resumes rather than restarting; `#roiRec` is visible while `#roiValue` is focused on mobile; a `#faq-free-pilot` hash opens that `<details>`. Without these, the fixes silently regress on the next redesign pass — the promote-to-`index.html` workflow makes that easy to miss.
    impact 3/5 · effort 2/5 · touches: tests/interactions.spec.js, tests/pages.spec.js
