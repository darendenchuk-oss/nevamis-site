/* ============================================================
   NEVAMIS HERO — the opening sequence

   THE RULE THIS FILE EXISTS UNDER (owner, 2026-08-27):

     The headline, the copy, the navigation and the CTAs must
     remain perfectly still and readable during every animation
     state. The animation may affect ONLY the dedicated visual
     area — the #stage SVG. No fragmentation, masks, clipping,
     filters, transforms or opacity changes are ever applied to
     the content container. If the animation fails, the static
     arch-and-dot mark must remain.

   That rule is not a preference about taste; it is the fix for a
   defect this file caused. The previous version opened by HIDING
   real content and animating it back:

     - the copy column set to autoAlpha 0
     - both CTAs (including the phone number) to autoAlpha 0 and
       yPercent 36
     - the header navigation likewise
     - the headline shredded into ~40 per-character spans pushed
       yPercent 118 below .line{overflow:hidden} masks
     - and a fixed, opaque, full-viewport veil (#wake, z-index
       200) over the ENTIRE document until the timeline's first
       tween faded it

   Every one of those states depended on a tween completing. A
   timeline is not a guarantee. Loaded into a background tab,
   requestAnimationFrame is throttled to nothing: measured, the
   page sat 9.7 seconds with the timeline playing but frozen at
   progress 0 — the whole document dark under the veil, the
   paragraph and both CTAs at visibility:hidden, every headline
   letter parked below its mask. Any stalled or slow frame mid-
   cycle stranded a partial set of letters (the char stagger was
   0.024s). The site-wide "pause motion" toggle appeared to
   "repair" the page, which is the clearest possible statement of
   what was wrong: the fix for the animation was to stop it.

   Two costs measured in this file's own comments went with it:
   LCP 5,020ms on 4x CPU + Slow 4G, of which 5,018ms was render
   delay, because the script hid a paragraph the browser had
   already painted and re-dated LCP to whenever the JavaScript
   landed; and CLS 0.1262 from that same hide-and-reshow moving
   the copy 12px. Both are gone by construction now: the content
   paints with the HTML and never moves again.

   WHAT IS ANIMATED, THEN. One surface: the #stage SVG, and the
   #status badge that sits inside it. One master timeline tells
   one story there — a call arrives, Nevamis answers it,
   qualifies it, books it, and texts the details — beside copy
   that was legible and clickable before the film started.

   Structure (times in seconds — see MOTION.beats):
     0.35  the stage's scrim comes up; the node comes into focus
     0.62  the first call wave closes on the node
     1.15  the node reacts ON CONTACT, then again to the echo
     1.50  the mark's arch draws from both ends, tips carrying
           light
     2.55  the tips merge at the apex — flare, bloom, and the two
           construction halves are swapped for the single
           continuous path
     2.75  CALL ANSWERED exhales into place (tracking settles)
     3.40  the story routes: ANSWER → QUALIFY → BOOK → TEXT
           (0.55s beats)
     5.70  the stage RECEDES (depth exit) and hands the frame
           back to the copy that has been there all along
     6.00  end → living idle (breath, an occasional signal along
           the arch, and the stage story replaying on its own)

   Choreography rules this file follows, learned the hard way:
   - Nothing outside #stage is ever a target. Not to hide it, not
     to reveal it, not to pulse it. If a tween's selector could
     match content, it does not belong here.
   - Nothing reacts before its stimulus arrives (waves land, THEN
     the node flinches; the arch answers the call, it never
     pre-empts it).
   - Two states of one element are never co-visible: every label
     handoff is sequential, with a clean gap between out and in.
   - One spring in the whole piece (the capture pop). Everything
     else enters and exits on restrained power curves.
   - The stage's resting frame — arch and dot — is painted by the
     MARKUP. Every element the film introduces ships at
     opacity="0" in home.html, and the resting mark is taken away
     only at the point the animated path is certainly running.
     Fail anywhere before that and the visitor keeps the mark.
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
  /* Every handle above is inside #stage. There is deliberately no lookup for
     the headline, the copy column, the CTAs, the navigation or the underline:
     this module has no business holding a reference to any of them. */

  const reduce = prefersReduced();

  /** The finished STAGE frame. Nothing here touches a single property outside
      #stage — that is the whole contract, and it is why this function is safe
      to call from anywhere, including a failure path. Used by reduced motion,
      by the late-start path, by the pause toggle, and as the timeline's end
      state. */
  function paintResolved() {
    // The resting mark is the SINGLE continuous path, never the two halves:
    // their round linecaps overlap at the apex into a doubled hot spot.
    gsap.set(archFull, { opacity: 1 });
    gsap.set([archL, archR], { opacity: 0 });
    if (scrim) gsap.set(scrim, { opacity: 1 });
    gsap.set(dot, { scale: 1, autoAlpha: 1 });
    gsap.set([story, status, packet, archHi, archTipL, archTipR, dotPulse], { opacity: 0 });
    gsap.set(waves, { opacity: 0 });
  }

  // ---------------------------------------------------------------
  // Reduced motion: show the finished hero at once. Nothing loops,
  // nothing is left running, no pointer effects are attached.
  //
  // FIRST, before any stage element is hidden. The order of the branches in
  // this function is load-bearing: every early return below happens while the
  // markup's own arch-and-dot frame is still painted, so a visitor who takes
  // one of them can never be left looking at an empty stage.
  // ---------------------------------------------------------------
  if (reduce) {
    paintResolved();

    /* The finished frame, WITH ITS LABELS ON — not a redrawn one.

       paintResolved is shared with the timeline's END state, where hiding the
       story is right: it has already played and it will replay. Under reduced
       motion it never plays at all, so the same call alone would leave the
       right half of the hero as an arc and a glowing ball with every label at
       opacity 0 — a spinner that never resolves, with nothing to say what it
       depicts. Reduced motion means remove the MOTION, not the content.

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
       spends six seconds arriving at.

       The honest cost: an animated visitor sees four beats, this visitor sees
       the outcome. That is a smaller gap than the one it replaces, which was
       an unlabelled arc and a glowing ball with nothing to say what either
       meant. */
    gsap.set([story, status], { opacity: 1 });
    stepEls.forEach((el, i) => gsap.set(el, { opacity: i === stepEls.length - 1 ? 1 : 0 }));
    segs.forEach((s) => gsap.set(s, { scaleX: 1, opacity: 1 }));

    /* A block used to sit here replacing the headline's non-breaking spaces
       with ordinary ones, because the animated path split the words into
       per-character spans and those breaks were the only thing letting the
       line re-wrap; the unsplit reduced path had none and overflowed by up to
       290px. Nothing is split any more and the markup carries ordinary spaces,
       so there is one headline width for everyone and nothing to repair. */

    window.__heroTL = gsap.timeline({ paused: true }); // inert handle for tooling
    window.__heroBeats = MOTION.beats;
    return { reduced: true };
  }

  // ---------------------------------------------------------------
  // TOO LATE TO BE AN INTRO.
  //
  // An intro is only an intro if it can start like one. This used to be a
  // performance guard with teeth — past the budget, the script would otherwise
  // arrive long after the browser had painted the hero and snatch the
  // paragraph back to replay it, which is what put LCP at 5,020ms and CLS at
  // 0.1262 on a throttled connection.
  //
  // It cannot do that any more: content is never hidden, so a late script has
  // nothing to take away and those numbers are structurally gone. What remains
  // is a smaller, still-real judgement about the STAGE. Six seconds of opening
  // film that begins a second and a half after the visitor started reading is
  // not an opening; it is a distraction beside copy they are already in the
  // middle of. Past the budget the stage simply shows its resolved frame.
  const INTRO_BUDGET_MS = 900;
  const elapsed = typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
  if (elapsed > INTRO_BUDGET_MS) {
    paintResolved();
    window.__heroTL = gsap.timeline({ paused: true });
    window.__heroBeats = MOTION.beats;
    return { lateStart: true, elapsed: Math.round(elapsed) };
  }

  // ---------------------------------------------------------------
  // Initial (pre-animation) state — STAGE ONLY
  //
  // Past every early return, so the animated path is certainly running. This
  // is the ONLY place the resting mark is allowed to be taken away: home.html
  // ships #archFull at opacity="1" precisely so that a failure anywhere above
  // leaves the official arch-and-dot painted. Nothing below may move up.
  //
  // It is a FUNCTION rather than a run of statements for one reason, below:
  // taking the mark away is only justified at the moment the film is about to
  // be watched, and a page that loads in a background tab is not that moment.
  // ---------------------------------------------------------------
  function armStage() {
    gsap.set(archFull, { opacity: 0 });
    // Hidden until their draw begins: a fully-offset round-cap path still
    // paints its zero-length cap — two stray 14px specks floating at the arch
    // bases through the whole opening beat.
    gsap.set([archL, archR], { opacity: 0 });
    // stroke-draw setup for the two arch halves
    [archL, archR].forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set(dot, { transformOrigin: '50% 50%', scale: 0.55, autoAlpha: 0 });
    gsap.set(dotPulse, { transformOrigin: '50% 50%', opacity: 0 });
    gsap.set(markG, { transformOrigin: '50% 55%' });
    gsap.set(waves, { opacity: 0 });
    gsap.set([story, status, packet, archHi, archTipL, archTipR], { opacity: 0 });
    gsap.set(stepEls, { opacity: 0 });
    gsap.set(segs, { transformOrigin: '0% 50%', scaleX: 0 });
  }

  /* A PAGE THAT OPENS IN A BACKGROUND TAB HAS NOT STARTED ITS FILM YET.

     requestAnimationFrame is throttled to nothing in a hidden tab, so a
     timeline started there does not advance — it just sits at progress 0 with
     the stage emptied out ready for an opening beat nobody is watching. That
     is the precise mechanism behind the reported defect, and while the damage
     is now confined to a decorative SVG, the answer is the same and it is
     free: do not empty the stage until someone is there to see it filled
     again. Until then the markup's arch-and-dot stands, which is the frame the
     owner requires whenever the film is not running. */
  const startHidden = document.hidden;
  if (!startHidden) armStage();

  const tl = gsap.timeline({ defaults: { ease: MOTION.ease.enter }, paused: startHidden });

  // --- 0.35–1.65 · the node comes into focus; the call closes on it ---
  // The film opens here, on the stage, with nothing to uncover first. There
  // used to be two tweens before this one — a full-viewport veil fading off,
  // and a streak flown across the top of the page into the first wave. Both
  // animated the document rather than the stage, and both are gone. The
  // handoff they set up is not missed: the signal simply begins as the wave.
  if (scrim) tl.to(scrim, { opacity: 1, duration: 0.55, ease: 'none' }, 0.35);
  tl.to(dot, { scale: 1, autoAlpha: 1, duration: 0.5, ease: MOTION.ease.enter }, 0.42);

  /* Two waves, not three (the third lingered across the arch draw), animated
     on the r ATTRIBUTE, not transform scale — scaling also scales stroke
     width, so the rings thinned to sub-pixel exactly as they approached the
     node. They accelerate INWARD (power2.in) and stay bright until just
     before contact, so the signal gains energy as it arrives instead of
     evaporating mid-air. */
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

  // --- 5.7–6.0 · clear the stage and hand the frame back ------------
  // The stage RECEDES — fades while stepping back a fraction — rather than
  // translating up: depth exits do not compete with anything, they hand the
  // frame over.
  //
  // What the ending points AT is the substance of this beat. The demo has
  // finished proving the claim, the stage clears, and what is left in the
  // frame is the headline and the pair of buttons — which have been there,
  // legible and clickable, since first paint. The film ends by directing
  // attention to the action. It does not deliver the action, and it never
  // touches it: there is deliberately no CTA pulse here. A 1.02 scale bump on
  // the phone-number button was the last content tween in this file, and
  // "only a small one" is how the whole defect was justified line by line.
  tl.to([story, status], { opacity: 0, scale: 0.97, transformOrigin: '50% 50%', duration: 0.3, ease: 'power2.in' }, 5.7)
    .set([story, status], { scale: 1 });

  tl.eventCallback('onComplete', startIdle);

  window.__heroTL = tl;
  window.__heroBeats = MOTION.beats;

  /* Held at the gate: the stage keeps its resting mark, and the film arms and
     runs from its first frame the moment the visitor actually arrives. This
     listener is registered BEFORE the general visibility handler further down
     so it wins the race to describe the first frame; that one then finds a
     timeline already playing and does nothing. */
  if (startHidden) {
    paintResolved();
    const armWhenWatched = () => {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', armWhenWatched);
      armStage();
      tl.restart();
    };
    document.addEventListener('visibilitychange', armWhenWatched);
  }

  /* A "press Tab to skip the intro" handler used to live here, because a
     keyboard user should never have to sit through an animation to reach a
     control. There is nothing left to skip: every control is in the tab order,
     visible and operable from first paint, and the only thing the timeline
     owns is a decorative SVG that is aria-hidden. */

  // ---------------------------------------------------------------
  // Living idle
  // ---------------------------------------------------------------
  let idle = null;
  let pingCall = null;
  let replayTl = null;
  let stageVisible = true;
  /* Has the stage EVER been on screen? You cannot scroll away from
     something you have not seen, and the skip below depends on the
     difference. */
  let stageHasBeenSeen = false;
  let motionHalted = false;

  // The site-wide "pause motion" toggle (site.js) calls these so the hero
  // freezes on its finished frame rather than mid-story. The contract is
  // unchanged: off means everything stops and the resolved STAGE is painted;
  // on means whatever was running resumes.
  window.__heroMotionOff = () => {
    motionHalted = true;
    tl.pause();
    if (idle) idle.pause();
    if (replayTl) replayTl.pause();
    paintResolved();
  };
  window.__heroMotionOn = () => {
    motionHalted = false;
    if (document.hidden) return;   // resume on return to the tab, not before
    resumeWhicheverWasRunning();
  };

  /** Play back whatever the state machine says should be moving. Used by both
      the toggle and the tab-visibility handler so the two cannot disagree. */
  function resumeWhicheverWasRunning() {
    if (tl.progress() < 1) { tl.play(); return; }
    if (!stageVisible) return;
    if (idle) idle.play();
    if (replayTl && replayTl.progress() > 0 && replayTl.progress() < 1) replayTl.play();
  }

  function startIdle() {
    if (idle) return;

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
   * and CTAs are untouched — as they are by every other tween in this file.
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
  // Pointer: depth parallax on the stage's own SVG
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
    if (stageVisible) stageHasBeenSeen = true;
    if (idle && !motionHalted) idle[stageVisible ? 'play' : 'pause']();
    if (replayTl && replayTl.isActive()) replayTl[stageVisible && !motionHalted ? 'play' : 'pause']();
    if (stageHasBeenSeen && !stageVisible && tl.progress() < 1 && !tl.paused()) {
      // The visitor scrolled past the stage mid-film. Nothing outside the
      // stage depends on this timeline any more, so pausing would be perfectly
      // safe — but there is no reason to keep a six-second film pending for a
      // visitor who has moved on. Finish it, so the stage is at its resting
      // mark whenever they scroll back.
      // suppressEvents=true: a skip jumps state, it must never fire the
      // callbacks it passes over.
      //
      // stageHasBeenSeen GUARDS THE WHOLE THING. An IntersectionObserver
      // always delivers one callback describing the CURRENT state, before
      // any scrolling has happened. On a 375x812 phone the stage starts at
      // y=857 - below a 812px fold - so that opening callback said "not
      // intersecting", this branch read it as "scrolled away", and the film
      // was skipped to its final frame before the visitor had touched
      // anything. The whole cinematic hero never played on the commonest
      // small phone, and it looked like correct behaviour because the
      // finished state is what the film ends on anyway.
      tl.progress(1, true);
    }
  }, { threshold: 0.02 });
  io.observe(stage);

  /* THE TAB. This used to pause the idle loop only, and let the MAIN timeline
     keep "playing" into a throttled requestAnimationFrame — which is the exact
     shape of the reported defect: a page opened in a background tab had a
     timeline that was running by every API measure and had advanced no frames,
     while the content it was holding hostage stayed hidden. Measured at 9.7s,
     progress 0.

     Pausing the main timeline is now both correct and safe, and it is safe for
     a structural reason rather than a lucky one: no property outside #stage
     depends on this timeline reaching any particular progress, so a paused
     film can never leave the page in a state a visitor cannot read or use. The
     worst case is a decorative SVG holding still. */
  onVisibility((visible) => {
    if (!visible) {
      tl.pause();
      if (idle) idle.pause();
      if (replayTl) replayTl.pause();
      return;
    }
    if (motionHalted) return;   // the explicit toggle outranks the tab
    resumeWhicheverWasRunning();
  });

  return { tl, startIdle };
}
