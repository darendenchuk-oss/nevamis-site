/* ============================================================
   NEVAMIS HERO — the opening sequence
   One master timeline tells one story: a call arrives, Nevamis
   answers it, qualifies it, books it, and texts the details.
   Everything the viewer sees is a state of that story; nothing
   moves for decoration.

   Structure (times in seconds — see MOTION.beats):
     0.00  wake veil clears; nav and the copy column rise
     0.50  the node comes into focus behind a soft scrim
     0.70  two call waves close on the node; it reacts on CONTACT
     1.55  the mark's arch draws from both ends, tips carrying light
     2.70  the tips merge at the apex — flare, bloom, the mark is one
     2.90  CALL ANSWERED · "Every call,"
     3.75  the story routes: ANSWER → QUALIFY → BOOK → TEXT (0.6s beats)
     6.15  the stage clears, THEN "captured." lands, THEN the CTAs
     7.25  end → living idle (breath, an occasional signal)

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
   ~80ms — it strobed. 0.60s gives every state a genuine dwell, and the
   handoff below is sequential: out is GONE 60ms before in begins, because
   two words superimposed at one coordinate read as a compositing bug. */
const STEP_GAP = 0.6;
const LABEL_IN = 0.22;
const LABEL_OUT = 0.16;
const LABEL_OUT_AT = 0.38;   // out runs 0.38–0.54; next enters at 0.60

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
  const fieldPts = $$('#field .fp');
  // The copy column takes part in the choreography rather than being
  // uncovered by the veil: a fully-rendered paragraph under an empty
  // headline slot reads as a loading glitch, not a sequence.
  const copyEls = $$('.hero .eyebrow, .hero .lede, .hero .proof, .hero .hero-search');

  // stroke-draw setup for the two arch halves
  [archL, archR].forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });

  const reduce = prefersReduced();

  /** The finished frame — used by reduced motion and as the timeline's end state. */
  function paintResolved() {
    // The resting mark is the SINGLE continuous path, never the two halves:
    // their round linecaps overlap at the apex into a doubled hot spot.
    gsap.set(archFull, { opacity: 1 });
    gsap.set([archL, archR], { opacity: 0 });
    if (scrim) gsap.set(scrim, { opacity: 1 });
    gsap.set(dot, { scale: 1, autoAlpha: 1 });
    gsap.set('h1 .w', { yPercent: 0 });
    gsap.set(copyEls, { autoAlpha: 1, y: 0 });
    gsap.set(['[data-cta]', '[data-nav]'], { yPercent: 0, autoAlpha: 1 });
    gsap.set('#wake', { autoAlpha: 0 });
    gsap.set([story, status, packet, archHi, archTipL, archTipR, dotPulse], { opacity: 0 });
    gsap.set(waves, { opacity: 0 });
  }

  // ---------------------------------------------------------------
  // Reduced motion: show the finished hero at once. Nothing loops,
  // nothing is left running, no pointer effects are attached.
  // ---------------------------------------------------------------
  if (reduce) {
    paintResolved();
    window.__heroTL = gsap.timeline({ paused: true }); // inert handle for tooling
    window.__heroBeats = MOTION.beats;
    return { reduced: true };
  }

  // ---------------------------------------------------------------
  // Initial (pre-animation) state
  // ---------------------------------------------------------------
  gsap.set('h1 .w', { yPercent: 115 });
  // autoAlpha, not opacity: it also sets visibility:hidden, so these controls
  // stay out of the tab order until they are actually on screen. A focusable
  // but invisible "Call the live AI" would otherwise dial a number the
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
  gsap.set(fieldPts, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: MOTION.ease.enter } });

  // --- 0.0–1.1 · wake; chrome and copy rise before the story starts ---
  // The veil is an exit: leave fast, land soft. Chrome starts once the veil
  // is mostly gone, so none of its motion is performed behind black.
  tl.to('#wake', { autoAlpha: 0, duration: 0.4, ease: 'power2.out' }, 0)
    .fromTo('#topsig', { opacity: 1, x: -240 },
      { x: () => window.innerWidth + 40, duration: 0.6, ease: MOTION.ease.move }, 0.18)
    .to('#topsig', { autoAlpha: 0, duration: 0.2 }, 0.62)
    .to('[data-nav]', { yPercent: 0, autoAlpha: 1, duration: 0.45, stagger: 0.04 }, 0.3)
    .to(copyEls, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.07 }, 0.35);

  // --- 0.45–1.7 · the node comes into focus; the call closes on it ---
  if (scrim) tl.to(scrim, { opacity: 1, duration: 0.6, ease: 'none' }, 0.45);
  tl.to(dot, { scale: 1, autoAlpha: 1, duration: 0.55, ease: MOTION.ease.enter }, 0.5);

  /* Two waves, not three (the third lingered across the arch draw), animated
     on the r ATTRIBUTE, not transform scale — scaling also scales stroke
     width, so the rings thinned to sub-pixel exactly as they approached the
     node. They accelerate INWARD (power2.in) and stay bright until just
     before contact, so the signal gains energy as it arrives instead of
     evaporating mid-air. */
  const WAVE_AT = [0.7, 1.0];
  const WAVE_TRAVEL = 0.5;
  WAVE_AT.forEach((at, i) => {
    const w = waves[i];
    tl.fromTo(w, { attr: { r: 178 } }, { attr: { r: 30 }, duration: WAVE_TRAVEL, ease: 'power2.in' }, at)
      .fromTo(w, { opacity: 0 }, { opacity: 0.75, duration: 0.12, ease: 'none' }, at)
      .to(w, { opacity: 0, duration: 0.14, ease: 'none' }, at + WAVE_TRAVEL - 0.12);
  });
  // The node reacts ON CONTACT — never before. First landing gets the real
  // flinch, the second a smaller echo: every stimulus gets a response.
  tl.to(dot, { scale: 1.14, duration: 0.12, ease: 'power2.out' }, 1.2)
    .to(dot, { scale: 1, duration: 0.2, ease: MOTION.ease.move }, 1.32)
    .to(dot, { scale: 1.07, duration: 0.12, ease: 'power2.out' }, 1.5)
    .to(dot, { scale: 1, duration: 0.2, ease: MOTION.ease.move }, 1.62);

  // --- 1.55–2.7 · the arch draws from both ends, answering the call ---
  // The arch grows from both ends at once, so a single highlight sweeping the
  // full arc would race ahead of the stroke through empty space. Instead each
  // tip carries its own highlight, on the same path, ease and timing as the
  // draw — so the light is always exactly where the arch is being made.
  tl.set([archL, archR], { opacity: 1 }, 1.55)
    .to([archL, archR], { strokeDashoffset: 0, duration: 1.15, ease: MOTION.ease.move }, 1.55)
    .to([archTipL, archTipR], { opacity: 1, duration: 0.15, ease: 'none' }, 1.55)
    .to(archTipL, {
      duration: 1.15, ease: MOTION.ease.move,
      motionPath: { path: archL, align: archL, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
    }, 1.55)
    .to(archTipR, {
      duration: 1.15, ease: MOTION.ease.move,
      motionPath: { path: archR, align: archR, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
    }, 1.55);

  // --- 2.7–3.3 · the apex: completion is an EVENT ------------------
  // The tips flare as they merge (they used to start dying 40ms before they
  // landed), a bloom expands from the meeting point, and one frame later the
  // two construction halves are swapped for the single continuous path —
  // the halves' overlapping round caps doubled into a permanent hot spot at
  // 12 o'clock. The flare covers the swap.
  // The bloom expands via the r ATTRIBUTE, not transform scale: GSAP caches
  // the transform origin from the element's original bbox (cy=352), so
  // scaling it after moving it to the apex pushed the ring off into space.
  tl.to([archTipL, archTipR], { scale: 1.9, opacity: 0, transformOrigin: '50% 50%', duration: 0.28, ease: 'power2.out' }, 2.7)
    .set(dotPulse, { attr: { cy: 170 } }, 2.7)
    .fromTo(dotPulse, { opacity: 0.8, attr: { r: 10 } },
      { opacity: 0, attr: { r: 64 }, duration: 0.5, ease: 'power2.out' }, 2.7)
    .set(archFull, { opacity: 1 }, 2.72)
    .set([archL, archR], { opacity: 0 }, 2.72);

  // The node reacts to the completed mark — cause at the apex, effect at the
  // node, one beat later. This is the piece's single spring.
  tl.to(dot, { scale: 0.82, duration: 0.14, ease: 'power2.in' }, 2.78)
    .to(dot, { scale: 1.06, duration: 0.24, ease: 'back.out(1.8)' }, 2.92)
    .to(dot, { scale: 1, duration: 0.16 }, 3.16)
    .fromTo(status, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, 2.9)
    .to('h1 .w[data-w="1"]', { yPercent: 0, duration: 0.7, ease: MOTION.ease.curtain }, 2.95);

  // --- 3.3–6.1 · the story routes ----------------------------------
  // One state is prominent at a time so it stays legible on a phone; the
  // segment bar carries the sequence so nothing is lost. Labels hand off on
  // the packet's own axis (left to right), so the words and the progress
  // bar describe one mechanism, not two.
  tl.to(story, { opacity: 1, duration: 0.35 }, 3.3)
    .set(packet, { opacity: 1, attr: { cx: 310, cy: 352 } }, 3.4)
    .to(packet, { attr: { cx: STEPS[0].x, cy: 516 }, duration: 0.32, ease: MOTION.ease.move }, 3.4);

  const STEP0 = 3.75;
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
  tl.to(packet, { opacity: 0, duration: 0.2 }, 6.05);

  // --- 6.15–7.25 · clear the stage, THEN land the payoff -----------
  // Exits first, together, on one ease; the headline rises into an already
  // clearing frame instead of fighting the routing UI for attention.
  tl.to([story, status], { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, 6.15)
    .set([story, status], { y: 0 })
    .to('h1 .w[data-w="2"]', { yPercent: 0, duration: 0.7, ease: MOTION.ease.curtain }, 6.3)
    // CTAs settle — they do not bounce. power3.out, short travel.
    .to('[data-cta]', { yPercent: 0, autoAlpha: 1, duration: 0.5, stagger: MOTION.stagger.base, ease: MOTION.ease.enter }, 6.45)
    .to(fieldPts, { opacity: 0.3, duration: 0.5, stagger: 0.02 }, 6.55);

  tl.eventCallback('onComplete', startIdle);

  window.__heroTL = tl;
  window.__heroBeats = MOTION.beats;

  // A keyboard user should never have to sit through an animation to reach a
  // control. The first Tab snaps the sequence to its finished state.
  const skipOnTab = (e) => {
    if (e.key !== 'Tab') return;
    window.removeEventListener('keydown', skipOnTab);
    if (tl.progress() < 1) tl.progress(1);
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
    const pts = fieldPts.map((p) => ({
      el: p,
      hx: gsap.quickTo(p, 'x', { duration: 0.5, ease: 'power2' }),
      hy: gsap.quickTo(p, 'y', { duration: 0.5, ease: 'power2' }),
      cx: Number(p.getAttribute('cx')),
      cy: Number(p.getAttribute('cy')),
    }));

    stage.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = stage.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      px(nx * 18); py(ny * 14);

      // attract nearby points, in viewBox space
      const m = svg.getScreenCTM();
      if (!m) return;
      const inv = m.inverse();
      const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(inv);
      for (const p of pts) {
        const dx = pt.x - p.cx, dy = pt.y - p.cy;
        const d = Math.hypot(dx, dy);
        const pull = d < 200 ? (1 - d / 200) * 26 : 0;
        p.hx((dx / (d || 1)) * pull);
        p.hy((dy / (d || 1)) * pull);
      }
    }, { passive: true });

    stage.addEventListener('pointerleave', () => {
      px(0); py(0);
      for (const p of pts) { p.hx(0); p.hy(0); }
    });
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
      tl.progress(1);
    }
  }, { threshold: 0.02 });
  io.observe(stage);

  onVisibility((visible) => {
    if (idle) idle[visible ? 'play' : 'pause']();
  });

  return { tl, startIdle };
}
