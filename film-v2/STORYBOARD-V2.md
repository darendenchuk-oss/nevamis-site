# film-v2 — STORYBOARD + COMPREHENSION GATE

One continuous journey through the NEVAMIS system. The interface, signal
language, typography and environment share **one visual system from frame one**
— there is no cut from "CGI world" to "product demo world".

Journey: **RING → CONVERSATION → WHO/WHAT/URGENCY → RULES CHECK → LEAD CAPTURED
→ OWNER NOTIFIED → CLEAR NEXT MOVE → BUILDING NEXT → NEVAMIS.CA**

## Comprehension gate — every frame must pass all five

### 01 · Incoming urgent call — `01-incoming-call.png`
- **Understands in 5s:** a real call is arriving, right now, and it is urgent.
- **Evidence:** live mint waveform at cinematic scale; `● INCOMING CALL`; the caller's own words at 44px; `02:11 · TUESDAY` — the middle of the night.
- **Claim:** calls arrive when nobody is there to answer. *(No product claim.)*
- **State:** n/a — problem statement.
- **Without narration:** ✅ the timestamp does the work.

### 02 · Agent transcript — `02-agent-transcript.png`
- **Understands in 5s:** NEVAMIS picked up and asked a sensible question.
- **Evidence:** `● NEVAMIS ANSWERED`; waveform settles from tall/irregular to low/even; two-speaker transcript with the caller's line dimmed to 55% and the agent's at full.
- **Claim:** answers 24/7 on the existing line. **LIVE.**
- **Without narration:** ✅ speaker labels carry it.

### 03 · WHO / WHAT / URGENCY — `03-who-what-urgency.png`
- **Understands in 5s:** the call became structured information.
- **Evidence:** four labelled fields at 76px on an 82%-of-frame panel; `IMMEDIATE` in warm; `● CAPTURED FROM THE CALL`.
- **Claim:** captures who, what, urgency, next step. **LIVE — all four are real stored fields.**
- **Without narration:** ✅ this is the strongest silent frame in the film.

### 04 · Rules and price refusal — `04-rules-price-refused.png`
- **Understands in 5s:** the system is constrained, deliberately, and hands judgment back.
- **Evidence:** three stacked states — `RULES CHECKED` (mint), `PRICE NOT PROVIDED` (muted, deliberately *not* mint — it is not an achievement), `NEEDS YOU` (warm), each with a plain-English right-hand explanation.
- **Claim:** follows owner rules; will not quote. **LIVE, provable at `agent-draft.ts:143`.**
- **Without narration:** ✅ the colour grammar alone separates done / withheld / yours.

### 05 · Lead captured and texted — `05-lead-captured-texted.png`
- **Understands in 5s:** a complete lead exists and has already reached the owner.
- **Evidence:** full-height lead card; `LEAD CAPTURED`; a dotted signal path travelling *out* of the card to a mint dot under `TEXTED TO YOU · within seconds`. No person depicted.
- **Claim:** texts the owner a summary within seconds. **LIVE.**
- **Without narration:** ✅ direction of travel is the message.

### 06 · Live now vs building next — `06-live-now-building-next.png`
- **Understands in 5s:** one thing works today; four are coming, and they are honestly separated.
- **Evidence:** two panels. Left, mint: `● LIVE NOW` / Call answering / `WORKING TODAY`. Right, warm and dimmer with a hollow `◦` marker: `BUILDING NEXT` / four items at 82% opacity / `NOT AVAILABLE YET`.
- **Claim:** front desk live; follow-up, tracking, quote recovery, reporting planned. **CORRECTLY TIERED.**
- **Without narration:** ✅ two colours, two markers, two explicit status pills.

### 07 · Closing — `07-closing-wordmark.png`
- **Understands in 5s:** this is NEVAMIS, and there is somewhere to go.
- **Evidence:** the real arc-and-dot mark, flat; Bricolage wordmark; tagline; `NEVAMIS.CA` / `HEAR IT ANSWER`.
- **Without narration:** ✅.

### 08 · Vertical test — `08-vertical-test-9x16.png`
Re-composed for 9:16, **not cropped**: single-column card, type re-scaled, mark
and URL in the lower third, all copy clear of the bottom 300px where platform UI
sits. Proves the product stays legible in the vertical cut.

## Shot-to-time map
`01` 0:00–0:04 · `02` 0:04–0:12 · `03` 0:12–0:18 · `04` 0:18–0:24 ·
`05` 0:24–0:28 · `06` 0:28–0:36 · `07` 0:36–0:40

## Motion notes for Gate B
Transitions are **transformations, not cuts**: the waveform's bars become the
field rows of frame 03; the rules layer sweeps through the same card rather than
replacing it; the lead card's signal path leaves frame and returns as the
notification. Sonar rings persist across every shot at low opacity — the
continuity device that makes it one journey. All easing `cubic-bezier(.16,1,.3,1)`.
