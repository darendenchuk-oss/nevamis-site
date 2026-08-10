/* ============================================================
   NEVAMIS HERO — the opening sequence
   One master timeline tells one story: a call arrives, Nevamis
   answers it, qualifies it, books it, and texts the details.
   Everything the viewer sees is a state of that story; nothing
   moves for decoration.

   Structure (times in seconds — see MOTION.beats). Retimed 2026-08-01
   to value-first: the film no longer gates the controls. Everything a
   visitor can ACT on is live by ~1.3s; the story plays beside it and
   keeps its payoff order. Re-choreographed 2026-08-01 to BLEND — one
   camera under everything, entrances that overlap instead of queueing,
   and handoffs where one element's death births the next. (Story-driven
   sky surges and a #dawn light layer were tried the same day and REMOVED:
   the owner read background brightness changes as flashing. Blending
   lives in geometry and timing here, never in background brightness.)
     0.00  the whole hero settles from one shared camera move as the
           veil clears
     0.50  "Every call," rises as a per-character curtain, overlapping
           the copy still settling beneath it
     0.62  the top streak dips toward the stage and DIES INTO the first
           call wave — one signal handed between two implementations
     0.78  both CTAs settle in — interactive from here on
     1.50  the mark's arch draws from both ends, tips carrying light
     2.55  the tips merge at the apex — flare, bloom, the mark is one
     2.75  CALL ANSWERED exhales into place (tracking settles)
     3.40  the story routes: ANSWER → QUALIFY → BOOK → TEXT (0.55s beats)
     5.70  the stage RECEDES (depth exit, never fighting the rising
           headline), "captured." lands with its underline, the CTAs
           pulse once
     6.55  end → living idle (breath, an occasional signal along the
           arch)

   Choreography rules this file follows, learned the hard way:
   - Nothing reacts before its stimulus arrives (waves land, THEN
     the node flinches; the arch answers the call, it never
     pre-empts it).
   - Two states of one element are never co-visible: every label
     handoff is sequential, with a clean gap between out and in.
   - One spring in the whole piece (the capture pop). Everything
     else enters and exits on restrained power curves.
   - Exits precede entrances at the resolve: the stage clears
     before the payoff word arrives, so it owns the frame.
   ============================================================ */

import { MOTION, prefersReduced, isFinePointer, onVisibility } from './tokens.js';

/** The four states the packet travels through, with real interface language.
    x = the packet's stop on the progress bar; labels sit at a fixed centre. */
const STEPS = [
  { label: 'ANSWER',  frag: 'caller intent',     x: 199 },
  { label: 'QUALIFY', frag: 'service type',      x: 273 },
  { label: 'BOOK',    frag: 'preferred time',    x: 347 },
  { label: 'TEXT',    frag: 'booking confirmed', x: 421 },
];

/* The routing rhythm. 0.42s per state left each label fully readable for
   ~80ms — it strobed. 0.55s keeps a genuine dwell (the 0.60 original read
   identically in side-by-side runs), and the handoff below is sequential:
   out is GONE 60ms before in begins, because two words superimposed at one
   coordinate read as a compositing bug. */
const STEP_GAP = 0.55;
const LABEL_IN = 0.2;
const LABEL_OUT = 0.15;
const LABEL_OUT_AT = 0.34;   // out runs 0.34–0.49; next enters at 0.55

/** Split a headline word into per-character spans, once. The h1 carries a
    static aria-label so screen readers keep reading a sentence, never a
    letter stream. Returns the char spans; on any surprise (empty word,
    re-run) it returns the word span itself so the timeline still works. */
function splitChars(wordEl) {
  if (!wordEl || wordEl.dataset.split === '1') {
    return wordEl ? Array.from(wordEl.querySelectorAll('.ch')) : [];
  }
  const text = wordEl.textContent;
  if (!text) return [wordEl];
  wordEl.dataset.split = '1';
  wordEl.textContent = '';
  const frag = document.createDocumentFragment();
  const chars = [];
  for (const c of text) {
    const s = document.createElement('span');
    s.className = 'ch';
    // A plain space collapses inside an inline-block run; keep the nbsp.
    s.textContent = c === ' ' ? ' ' : c;
    frag.appendChild(s);
    chars.push(s);
  }
  wordEl.appendChild(frag);
  return chars;
}

export function initHero() {
  const gsap = window.gsap;
  if (!gsap) return null;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const stage = $('#stage');
  const svg = $('#mark');
  if (!stage || !svg) return null;

  const markG = $('#markGroup');
  const archL = $('#archL');
  const archR = $('#archR');
  const archFull = $('#archFull');
  const archHi = $('#archHi');
  const archTipL = $('#archTipL');
  const archTipR = $('#archTipR');
  const dot = $('#dot');
  const dotPulse = $('#dotPulse');
  const scrim = $('#scrimC');
  const waves = $$('#waves .wave');
  const story = $('#story');
  const stepEls = $$('#story .step');
  const segs = $$('#progress .seg');
  const packet = $('#packet');
  const status = $('#status');
  // The copy column takes part in the choreography rather than being
  // uncovered by the veil: a fully-rendered paragraph under an empty
  // headline slot reads as a loading glitch, not a sequence.
  const copyEls = $$('.hero .eyebrow, .hero .lede, .hero .proof, .hero .hero-search');
  // The whole hero shares one camera (see ACT 1). Optional: older cached
  // markup simply skips it.
  const wrap = $('.hero .wrap');

  // stroke-draw setup for the two arch halves
  [archL, archR].forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });

  const reduce = prefersReduced();
  const underline = $('.hero-underline');

  /** The finished frame — used by reduced motion and as the timeline's end state. */
  function paintResolved() {
    // The resting mark is the SINGLE continuous path, never the two halves:
    // their round linecaps overlap at the apex into a doubled hot spot.
    gsap.set(archFull, { opacity: 1 });
    gsap.set([archL, archR], { opacity: 0 });
    if (scrim) gsap.set(scrim, { opacity: 1 });
    gsap.set(dot, { scale: 1, autoAlpha: 1 });
    // Both granularities: .w for the un-split reduced path, .ch after a split.
    gsap.set('h1 .w', { yPercent: 0 });
    if (document.querySelector('h1 .ch')) gsap.set('h1 .ch', { yPercent: 0 });
    if (underline) gsap.set(underline, { scaleX: 1 });
    gsap.set(copyEls, { autoAlpha: 1, y: 0 });
    gsap.set(['[data-cta]', '[data-nav]'], { yPercent: 0, autoAlpha: 1, scale: 1 });
    gsap.set('#wake', { autoAlpha: 0 });
    if (wrap) gsap.set(wrap, { scale: 1, y: 0, clearProps: 'transform' });
    gsap.set([story, status, packet, archHi, archTipL, archTipR, dotPulse], { opacity: 0 });
    gsap.set(waves, { opacity: 0 });
  }

  // ---------------------------------------------------------------
  // Reduced motion: show the finished hero at once. Nothing loops,
  // nothing is left running, no pointer effects are attached.
  // ---------------------------------------------------------------
  if (reduce) {
    paintResolved();

    /* paintResolved is shared with the timeline's END state, where hiding the
       story is right: it has already played and it will replay. Under reduced
       motion it never plays at all, so the same call left the right half of the
       hero as an arc and a glowing ball with every label at opacity 0 — a
       spinner that never resolves, with nothing to say what it depicts.

       Reduced motion means remove the MOTION, not the content. Animated
       visitors see four steps over time; this shows the same four at once, so
       the preference costs nothing but the movement.

       The four .step groups are drawn on top of each other at x=310, y=452 —
       the animation reveals one at a time — so they have to be spread before
       they can all be read. Spacing and origin are derived from the markup's
       own geometry rather than typed in twice: STEP_GAP is the label-to-frag
       distance the SVG already uses, and the stack is centred on the row the
       single step used to occupy.

       #progress goes with them. Four segments exist to say which of four steps
       you are on; when all four are named and visible it is answering a
       question nobody is asking. */
    /* The finished frame, with its labels on — not a redrawn one.

       Showing all four steps at once was the first attempt and it is the wrong
       shape for this artwork. The four .step groups are drawn on top of each
       other at one baseline, so they have to be spread to be read, and there
       is not room: measured, spreading them below the resting dot overlapped
       by 1px on desktop even when the spacing was derived from getBBox, and
       ran past the bottom of the SVG on mobile. Forcing four rows into a
       square that holds one is how a fix becomes a second defect.

       So the reduced view is the story's LAST beat, in the position the
       artwork already gives it: the arc closed, the dot at rest, "CALL
       ANSWERED", "TEXT / booking confirmed", and all four progress segments
       filled. That is a completed call, which is exactly what the animation
       spends nine seconds arriving at.

       The honest cost: an animated visitor sees four beats, this visitor sees
       the outcome. That is a smaller gap than the one it replaces, which was
       an unlabelled arc and a glowing ball with nothing to say what either
       meant. */
    gsap.set([story, status], { opacity: 1 });
    stepEls.forEach((el, i) => gsap.set(el, { opacity: i === stepEls.length - 1 ? 1 : 0 }));
    segs.forEach((s) => gsap.set(s, { scaleX: 1, opacity: 1 }));

    /* Let the headline wrap. Found by looking at a screenshot of the fix
       above, which is the only reason it was found at all.

       Each masked line is one .w joined with NON-BREAKING spaces, so the
       intro can reveal it as a single unit. That leaves the line with no
       break opportunity anywhere in it. The animated path splits the words
       into 32 per-character spans, and those breaks are what let the line
       re-wrap; reduced motion never splits, so the line stays one 663px
       object inside a 385px .line mask with overflow:hidden.

       Measured on the homepage: the headline overflowed by 290px at 1440,
       288px at 1280 and 167px at 1024, so "Never miss the time that matters."
       was read as "Never miss / the time tha". Mobile was unaffected, which
       is why it survived: the column is narrow enough that the break lands
       before the clip.

       Ordinary spaces restore the break opportunities the split would have
       provided. The h1 keeps its aria-label either way, so this was never a
       screen-reader problem — only a sighted one, for the visitors who asked
       for less motion. */
    $$('h1 .w').forEach((w) => { w.textContent = w.textContent.replace(/ /g, ' '); });

    window.__heroTL = gsap.timeline({ paused: true }); // inert handle for tooling
    window.__heroBeats = MOTION.beats;
    return { reduced: true };
  }

  // ---------------------------------------------------------------
  // TOO LATE TO BE AN INTRO.
  //
  // The hero copy is NOT hidden by CSS — it paints with the HTML, and this
  // file then hides it (autoAlpha 0, below) to play it back in. On a fast
  // connection that is invisible and the sequence works. On a slow one it is
  // the single worst thing on the page: the browser paints the paragraph,
  // this script arrives much later, hides content the visitor is already
  // reading, and shows it again — which re-dates Largest Contentful Paint to
  // whenever the JavaScript landed.
  //
  // Measured on the homepage, 4x CPU + Slow 4G, LCP element P.lede:
  //   LCP 5,020 ms, of which 5,018 ms is render delay (TTFB is 2 ms).
  //   CLS 0.1262, from the same hide-and-reshow moving the copy 12px.
  // Desktop, unthrottled, is 388 ms. The difference is not the animation's
  // cost; it is 290 KB of script arriving before the animation may begin.
  //
  // So the intro is only an intro if it can start like one. Past the budget
  // the finished frame is painted and nothing is taken away from someone who
  // is already reading it. This is not a degraded experience — it is the same
  // resolved composition reduced-motion visitors get, and it is strictly
  // better than snatching the paragraph back to replay it.
  const INTRO_BUDGET_MS = 900;
  const elapsed = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
  if (elapsed > INTRO_BUDGET_MS) {
    paintResolved();
    window.__heroTL = gsap.timeline({ paused: true });
    window.__heroBeats = MOTION.beats;
    return { lateStart: true, elapsed: Math.round(elapsed) };
  }

  // ---------------------------------------------------------------
  // Initial (pre-animation) state
  // ---------------------------------------------------------------
  // Per-character curtains. Split only on the animated path, so the reduced
  // path and any no-JS render keep the intact words. The h1 carries a static
  // aria-label in the markup, so assistive tech reads the sentence either way.
  const chars1 = splitChars(document.querySelector('h1 .w[data-w="1"]'));
  const chars2 = splitChars(document.querySelector('h1 .w[data-w="2"]'));
  gsap.set([...chars1, ...chars2], { yPercent: 118, display: 'inline-block', willChange: 'transform' });
  if (underline) gsap.set(underline, { scaleX: 0, transformOrigin: '0% 50%' });
  // autoAlpha, not opacity: it also sets visibility:hidden, so these controls
  // stay out of the tab order until they are actually on screen. A focusable
  // but invisible "Hear it answer" would otherwise dial a number the
  // keyboard user cannot see.
  // Short travel (36/56, not 120/130): buttons should settle into place,
  // not launch across it.
  gsap.set('[data-cta]', { yPercent: 36, autoAlpha: 0 });
  gsap.set('[data-nav]', { yPercent: 56, autoAlpha: 0 });
  gsap.set(copyEls, { autoAlpha: 0, y: 12 });
  gsap.set(dot, { transformOrigin: '50% 50%', scale: 0.55, autoAlpha: 0 });
  gsap.set(dotPulse, { transformOrigin: '50% 50%', opacity: 0 });
  gsap.set(markG, { transformOrigin: '50% 55%' });
  // Hidden until their draw begins: a fully-offset round-cap path still
  // paints its zero-length cap — two stray 14px specks floating at the arch
  // bases through the whole opening beat.
  gsap.set([archL, archR], { opacity: 0 });
  gsap.set(waves, { opacity: 0 });
  gsap.set([story, status, packet, archHi, archTipL, archTipR], { opacity: 0 });
  gsap.set(stepEls, { opacity: 0 });
  gsap.set(segs, { transformOrigin: '0% 50%', scaleX: 0 });

  const tl = gsap.timeline({ defaults: { ease: MOTION.ease.enter } });

  // --- ACT 1 · 0.0–1.3 · everything actable arrives first ------------
  // The veil is an exit: leave fast, land soft. Chrome starts once the veil
  // is mostly gone, so none of its motion is performed behind black. The
  // whole copy column, the headline's first word and BOTH CTAs are in and
  // interactive by ~1.3s; the film has not even reached its apex yet.
  //
  // BLENDED, not sequenced: the whole hero — copy AND stage — settles from
  // a single 1.2% scale as the veil clears, so every element rides one
  // shared camera move and arrives belonging to the same world. One
  // transform on one wrapper; it costs nothing.
  // (A #dawn light layer and story-driven sky surges shipped here on
  // 2026-08-01 and were removed the next day: the owner read background
  // brightness changes as flashing. Blend with geometry and timing, never
  // with the background's brightness.)
  tl.to('#wake', { autoAlpha: 0, duration: 0.45, ease: 'power2.inOut' }, 0);
  if (wrap) {
    tl.fromTo(wrap, { scale: 0.988, y: 14, transformOrigin: '50% 42%' },
      { scale: 1, y: 0, duration: 1.15, ease: 'power3.out', clearProps: 'transform' }, 0);
  }
  // The streak is no longer a comet crossing an unrelated sky: it dips
  // toward the stage and dies exactly where and when the first call wave is
  // born (0.62 below) — the signal ARRIVES, the waves carry it the rest of
  // the way. One perceived object handed between two implementations.
  tl.fromTo('#topsig', { opacity: 1, x: -240, y: 0 },
      { x: () => window.innerWidth * 0.58, y: 30, duration: 0.52, ease: 'power1.in' }, 0.1)
    .to('#topsig', { autoAlpha: 0, duration: 0.14 }, 0.5)
    .to('[data-nav]', { yPercent: 0, autoAlpha: 1, duration: 0.4, stagger: 0.04 }, 0.15)
    .to(copyEls, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.055 }, 0.22)
    // "Every call," rises one character at a time behind the line mask —
    // slightly longer and looser than before, so the wave of characters
    // overlaps the copy still settling beneath it instead of starting a
    // fresh, separate event.
    .to(chars1, { yPercent: 0, duration: 0.65, stagger: 0.024, ease: MOTION.ease.curtain }, 0.5)
    // The SECOND line follows the first as one cascading gesture, not as a
    // payoff withheld until the film ends.
    //
    // It used to release at 5.8s. For 5.8 seconds the page therefore read
    // "Every call," — a sentence broken off at a comma. That does not scan as
    // suspense; it scans as a rendering fault, and it withholds the one clause
    // that says what the company does. Comprehension is not a reward for
    // watching the film.
    //
    // Offset 0.16s behind line 1 (not simultaneous): a two-line curtain reads
    // as one movement when the second line trails the first by roughly one
    // stagger step, and as a stutter when they start together. Full sentence
    // legible at ~1.53s against a 294ms interactive page.
    .to(chars2, { yPercent: 0, duration: 0.65, stagger: 0.024, ease: MOTION.ease.curtain }, 0.66)
    // CTAs settle — they do not bounce, and they do not wait for the film.
    .to('[data-cta]', { yPercent: 0, autoAlpha: 1, duration: 0.45, stagger: MOTION.stagger.base, ease: MOTION.ease.enter }, 0.78);

  // The underline is the headline's typographic finish, so it belongs to the
  // headline's gesture — drawn as line 2 settles, not six seconds later.
  if (underline) tl.to(underline, { scaleX: 1, duration: 0.4, ease: MOTION.ease.enter }, 1.1);

  // --- 0.35–1.65 · the node comes into focus; the call closes on it ---
  if (scrim) tl.to(scrim, { opacity: 1, duration: 0.55, ease: 'none' }, 0.35);
  tl.to(dot, { scale: 1, autoAlpha: 1, duration: 0.5, ease: MOTION.ease.enter }, 0.42);

  /* Two waves, not three (the third lingered across the arch draw), animated
     on the r ATTRIBUTE, not transform scale — scaling also scales stroke
     width, so the rings thinned to sub-pixel exactly as they approached the
     node. They accelerate INWARD (power2.in) and stay bright until just
     before contact, so the signal gains energy as it arrives instead of
     evaporating mid-air. */
  // 0.62, not 0.65: wave one is born on the same beat the streak dies (see
  // ACT 1), which is the handoff that makes them read as one signal.
  const WAVE_AT = [0.62, 0.95];
  const WAVE_TRAVEL = 0.5;
  WAVE_AT.forEach((at, i) => {
    const w = waves[i];
    tl.fromTo(w, { attr: { r: 178 } }, { attr: { r: 30 }, duration: WAVE_TRAVEL, ease: 'power2.in' }, at)
      .fromTo(w, { opacity: 0 }, { opacity: 0.75, duration: 0.12, ease: 'none' }, at)
      .to(w, { opacity: 0, duration: 0.14, ease: 'none' }, at + WAVE_TRAVEL - 0.12);
  });
  // The node reacts ON CONTACT — never before. First landing gets the real
  // flinch, the second a smaller echo: every stimulus gets a response.
  tl.to(dot, { scale: 1.14, duration: 0.12, ease: 'power2.out' }, 1.15)
    .to(dot, { scale: 1, duration: 0.2, ease: MOTION.ease.move }, 1.27)
    .to(dot, { scale: 1.07, duration: 0.12, ease: 'power2.out' }, 1.45)
    .to(dot, { scale: 1, duration: 0.2, ease: MOTION.ease.move }, 1.57);

  // --- 1.5–2.55 · the arch draws from both ends, answering the call ---
  // The arch grows from both ends at once, so a single highlight sweeping the
  // full arc would race ahead of the stroke through empty space. Instead each
  // tip carries its own highlight, on the same path, ease and timing as the
  // draw — so the light is always exactly where the arch is being made.
  tl.set([archL, archR], { opacity: 1 }, 1.5)
    .to([archL, archR], { strokeDashoffset: 0, duration: 1.05, ease: MOTION.ease.move }, 1.5)
    .to([archTipL, archTipR], { opacity: 1, duration: 0.15, ease: 'none' }, 1.5)
    .to(archTipL, {
      duration: 1.05, ease: MOTION.ease.move,
      motionPath: { path: archL, align: archL, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
    }, 1.5)
    .to(archTipR, {
      duration: 1.05, ease: MOTION.ease.move,
      motionPath: { path: archR, align: archR, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
    }, 1.5);

  // --- 2.7–3.3 · the apex: completion is an EVENT ------------------
  // The tips flare as they merge (they used to start dying 40ms before they
  // landed), a bloom expands from the meeting point, and one frame later the
  // two construction halves are swapped for the single continuous path —
  // the halves' overlapping round caps doubled into a permanent hot spot at
  // 12 o'clock. The flare covers the swap.
  // The bloom expands via the r ATTRIBUTE, not transform scale: GSAP caches
  // the transform origin from the element's original bbox (cy=352), so
  // scaling it after moving it to the apex pushed the ring off into space.
  tl.to([archTipL, archTipR], { scale: 1.9, opacity: 0, transformOrigin: '50% 50%', duration: 0.26, ease: 'power2.out' }, 2.55)
    .set(dotPulse, { attr: { cy: 170 } }, 2.55)
    .fromTo(dotPulse, { opacity: 0.8, attr: { r: 10 } },
      { opacity: 0, attr: { r: 64 }, duration: 0.5, ease: 'power2.out' }, 2.55)
    .set(archFull, { opacity: 1 }, 2.57)
    .set([archL, archR], { opacity: 0 }, 2.57);

  // The node reacts to the completed mark — cause at the apex, effect at the
  // node, one beat later. This is the piece's single spring.
  tl.to(dot, { scale: 0.82, duration: 0.14, ease: 'power2.in' }, 2.62)
    .to(dot, { scale: 1.06, duration: 0.24, ease: 'back.out(1.8)' }, 2.76)
    .to(dot, { scale: 1, duration: 0.16 }, 3.0)
    // The status line exhales into place: tracking settles from wide to its
    // resting width as it fades in — type arriving as a breath, not a stamp.
    .fromTo(status, { opacity: 0, y: 8, letterSpacing: '0.34em' },
      { opacity: 1, y: 0, letterSpacing: '0.18em', duration: 0.4 }, 2.75);

  // --- 3.0–5.6 · the story routes ----------------------------------
  // One state is prominent at a time so it stays legible on a phone; the
  // segment bar carries the sequence so nothing is lost. Labels hand off on
  // the packet's own axis (left to right), so the words and the progress
  // bar describe one mechanism, not two.
  tl.to(story, { opacity: 1, duration: 0.35 }, 3.0)
    .set(packet, { opacity: 1, attr: { cx: 310, cy: 352 } }, 3.1)
    .to(packet, { attr: { cx: STEPS[0].x, cy: 516 }, duration: 0.32, ease: MOTION.ease.move }, 3.1);

  const STEP0 = 3.4;
  STEPS.forEach((s, i) => {
    const at = STEP0 + i * STEP_GAP;
    if (i > 0) {
      // the packet moves BETWEEN dwells and arrives exactly on the beat
      tl.to(packet, { attr: { cx: s.x }, duration: 0.25, ease: MOTION.ease.move }, at - 0.25);
    }
    tl.to(segs[i], { scaleX: 1, duration: 0.3, ease: MOTION.ease.enter }, at)
      .fromTo(stepEls[i], { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: LABEL_IN, ease: 'power2.out' }, at);
    // Sequential, never simultaneous: out is complete 60ms before in begins.
    // Tweened, never callback-driven, so scrubbing shows the true state.
    if (i < STEPS.length - 1) {
      tl.to(stepEls[i], { opacity: 0, x: -14, duration: LABEL_OUT, ease: 'power2.in' }, at + LABEL_OUT_AT);
    }
  });
  // TEXT — "booking confirmed", the payoff state — holds a full beat.
  tl.to(packet, { opacity: 0, duration: 0.2 }, 5.5);

  // --- 5.7–6.5 · clear the stage and hand the frame back ------------
  // Exits first, together, on one ease. The stage RECEDES — fades while
  // stepping back a fraction — rather than translating up: a y:-10 exit used
  // to run head-on into "captured." rising from below, two opposed verticals
  // in one frame. Depth exits do not compete; they hand the frame over.
  //
  // What the ending now points AT changed, and this is the substance of the
  // re-choreography rather than a moved timestamp. The film used to end by
  // completing the sentence, which meant the sentence was the reward for
  // watching. The headline now lands at ~1.5s, so the ending has one job
  // instead: the demo has finished proving the claim, the stage clears, and
  // the only lit thing left in the frame is the pair of buttons that were
  // already live at 1.2s. The film ends by directing attention to the action,
  // not by delivering comprehension.
  tl.to([story, status], { opacity: 0, scale: 0.97, transformOrigin: '50% 50%', duration: 0.3, ease: 'power2.in' }, 5.7)
    .set([story, status], { scale: 1 });
  tl.to('[data-cta]', { scale: 1.02, duration: 0.16, ease: 'power2.out', stagger: 0.05 }, 6.05)
    .to('[data-cta]', { scale: 1, duration: 0.3, ease: MOTION.ease.move, stagger: 0.05 }, 6.21);

  tl.eventCallback('onComplete', startIdle);

  window.__heroTL = tl;
  window.__heroBeats = MOTION.beats;

  // A keyboard user should never have to sit through an animation to reach a
  // control. The first Tab snaps the sequence to its finished state.
  const skipOnTab = (e) => {
    if (e.key !== 'Tab') return;
    window.removeEventListener('keydown', skipOnTab);
    if (tl.progress() < 1) tl.progress(1, true);
  };
  window.addEventListener('keydown', skipOnTab);

  // ---------------------------------------------------------------
  // Living idle
  // ---------------------------------------------------------------
  let idle = null;
  let pingCall = null;
  let replayTl = null;
  let stageVisible = true;
  let motionHalted = false;

  // The site-wide "pause motion" toggle (site.js) calls these so the hero
  // freezes on its finished frame rather than mid-story.
  window.__heroMotionOff = () => {
    motionHalted = true;
    tl.pause();
    if (idle) idle.pause();
    if (replayTl) replayTl.pause();
    paintResolved();
  };
  window.__heroMotionOn = () => {
    motionHalted = false;
    if (tl.progress() < 1) tl.play();
    else if (idle) idle.play();
  };

  function startIdle() {
    if (idle) return;
    // The intro is over: the per-character layers have earned their keep.
    // Left in place, ~24 tiny composited layers sit in GPU memory for the
    // whole visit doing nothing — will-change is a promise about the near
    // future, and the future of these spans is "never moves again".
    gsap.set([...chars1, ...chars2], { clearProps: 'willChange' });

    idle = gsap.timeline({ repeat: -1 });
    idle.to(markG, { scale: 1.01, duration: MOTION.dur.ambient, ease: MOTION.ease.breathe })
        .to(markG, { scale: 1, duration: MOTION.dur.ambient, ease: MOTION.ease.breathe });

    // A signal occasionally travels the arch — occasional, not metronomic:
    // a fixed 5.5s cadence taught the eye the loop within a minute.
    const ping = () => {
      if (document.hidden || !stageVisible || motionHalted) { pingCall = gsap.delayedCall(4, ping); return; }
      gsap.timeline({ onComplete: () => { pingCall = gsap.delayedCall(gsap.utils.random(9, 14), ping); } })
        .set(archHi, { opacity: 1 })
        .to(archHi, {
          duration: 1.2, ease: 'power1.inOut',
          motionPath: { path: archFull, align: archFull, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
        })
        .to(archHi, { opacity: 0, duration: 0.2 }, '-=0.15');
    };
    pingCall = gsap.delayedCall(1.2, ping);

    replayTl = buildStageReplay();
    // The first replay waits well clear of the intro, and reruns are spaced
    // so the idle reads as alive, not looping — a pitch that replays every
    // nine seconds forever is a screensaver.
    scheduleReplay(14);
  }

  function scheduleReplay(delay) {
    gsap.delayedCall(delay, () => {
      if (document.hidden || !stageVisible || motionHalted) { scheduleReplay(6); return; }
      replayTl.restart();
    });
  }

  /**
   * The story runs again, but inside the stage only. The headline, navigation
   * and CTAs are deliberately untouched — they arrived once and they stay.
   * Same physics as the intro: waves land, the node reacts, labels hand off
   * sequentially on the packet's axis.
   */
  function buildStageReplay() {
    const r = gsap.timeline({ paused: true, onComplete: () => scheduleReplay(24) });

    r.set(segs, { scaleX: 0 })
     .set(stepEls, { opacity: 0, x: 0 })
     .set(story, { opacity: 1, y: 0 });

    [0, 0.3].forEach((at, i) => {
      const w = waves[i];
      r.fromTo(w, { attr: { r: 178 } }, { attr: { r: 30 }, duration: WAVE_TRAVEL, ease: 'power2.in' }, at)
       .fromTo(w, { opacity: 0 }, { opacity: 0.75, duration: 0.12, ease: 'none' }, at)
       .to(w, { opacity: 0, duration: 0.14, ease: 'none' }, at + WAVE_TRAVEL - 0.12);
    });

    r.to(dot, { scale: 1.12, duration: 0.12, ease: 'power2.out' }, 0.5)
     .to(dot, { scale: 1, duration: 0.22, ease: MOTION.ease.move }, 0.62)
     .fromTo(status, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, 0.7)
     .set(packet, { opacity: 1, attr: { cx: 310, cy: 352 } }, 0.95)
     .to(packet, { attr: { cx: STEPS[0].x, cy: 516 }, duration: 0.32, ease: MOTION.ease.move }, 0.95);

    STEPS.forEach((s, i) => {
      const at = 1.35 + i * STEP_GAP;
      if (i > 0) r.to(packet, { attr: { cx: s.x }, duration: 0.25, ease: MOTION.ease.move }, at - 0.25);
      r.to(segs[i], { scaleX: 1, duration: 0.3, ease: MOTION.ease.enter }, at)
       .fromTo(stepEls[i], { opacity: 0, x: 14 }, { opacity: 1, x: 0, duration: LABEL_IN, ease: 'power2.out' }, at);
      if (i < STEPS.length - 1) {
        r.to(stepEls[i], { opacity: 0, x: -14, duration: LABEL_OUT, ease: 'power2.in' }, at + LABEL_OUT_AT);
      }
    });

    const end = 1.35 + 3 * STEP_GAP + 0.6;
    r.to(packet, { opacity: 0, duration: 0.2 }, end)
     .to([story, status], { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, end + 0.15)
     .set([story, status], { y: 0 });

    return r;
  }

  // ---------------------------------------------------------------
  // Pointer: depth parallax + signal points bending toward the cursor
  // ---------------------------------------------------------------
  if (isFinePointer()) {
    const px = gsap.quickTo(svg, 'x', { duration: 0.6, ease: 'power2' });
    const py = gsap.quickTo(svg, 'y', { duration: 0.6, ease: 'power2' });

    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      px(nx * 18); py(ny * 14);
    }, { passive: true });

    stage.addEventListener('pointerleave', () => { px(0); py(0); });
  }

  // ---------------------------------------------------------------
  // Never burn CPU off-screen or in a background tab
  // ---------------------------------------------------------------
  const io = new IntersectionObserver(([entry]) => {
    stageVisible = entry.isIntersecting;
    if (idle) idle[stageVisible ? 'play' : 'pause']();
    if (replayTl && replayTl.isActive()) replayTl[stageVisible ? 'play' : 'pause']();
    if (!stageVisible && tl.progress() < 1 && !tl.paused()) {
      // The visitor scrolled away mid-intro. Never pause here: pausing would
      // freeze the wake overlay mid-fade and leave a dark veil over the page.
      // Scrolling past the hero means "skip the intro" — finish instantly.
      // suppressEvents=true: a skip jumps state, it must never fire the
      // callbacks it passes over.
      tl.progress(1, true);
    }
  }, { threshold: 0.02 });
  io.observe(stage);

  onVisibility((visible) => {
    if (idle) idle[visible ? 'play' : 'pause']();
  });

  return { tl, startIdle };
}
