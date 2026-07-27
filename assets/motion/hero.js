/* ============================================================
   NEVAMIS HERO — the opening sequence
   One master timeline tells one story: a call arrives, Nevamis
   answers it, qualifies it, books it, and texts the details.
   Everything the viewer sees is a state of that story; nothing
   moves for decoration.

   Structure (times in seconds, matching the motion brief):
     0.0  wake + top-edge signal + nav
     0.4  the node appears; incoming call waves reach it
     0.9  the mark's arch draws from both ends, highlight riding it
     1.8  captured: node compresses, CALL ANSWERED, "Every call,"
     2.8  the story routes: ANSWER → QUALIFY → BOOK → TEXT
     4.8  routing contracts back into the mark, "captured.", CTAs
     6.3  living idle: breath, occasional signal, pointer parallax
   ============================================================ */

import { MOTION, prefersReduced, isFinePointer, onVisibility } from './tokens.js';

/** The four states the packet travels through, with real interface language. */
const STEPS = [
  { label: 'ANSWER',  frag: 'caller intent',     x: 199 },
  { label: 'QUALIFY', frag: 'service type',      x: 273 },
  { label: 'BOOK',    frag: 'preferred time',    x: 347 },
  { label: 'TEXT',    frag: 'booking confirmed', x: 421 },
];

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
  const waves = $$('#waves .wave');
  const story = $('#story');
  const stepEls = $$('#story .step');
  const segs = $$('#progress .seg');
  const packet = $('#packet');
  const status = $('#status');
  const fieldPts = $$('#field .fp');

  // stroke-draw setup for the two arch halves
  [archL, archR].forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });

  const reduce = prefersReduced();

  /** The finished frame — used by reduced motion and as the timeline's end state. */
  function paintResolved() {
    gsap.set([archL, archR], { strokeDashoffset: 0 });
    gsap.set(dot, { scale: 1, opacity: 1 });
    gsap.set('h1 .w', { yPercent: 0 });
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
  gsap.set('[data-cta]', { yPercent: 120, autoAlpha: 0 });
  gsap.set('[data-nav]', { yPercent: 130, autoAlpha: 0 });
  gsap.set(dot, { transformOrigin: '50% 50%', scale: 0 });
  gsap.set(dotPulse, { transformOrigin: '50% 50%', opacity: 0 });
  gsap.set(markG, { transformOrigin: '50% 55%' });
  // '50% 50%' resolves to the circle's own centre (310,352). A px pair here
  // would be measured from the bounding box, not SVG user space, and would
  // collapse the waves toward the corner of the canvas instead of the node.
  gsap.set(waves, { opacity: 0, transformOrigin: '50% 50%' });
  gsap.set([story, status, packet, archHi, archTipL, archTipR], { opacity: 0 });
  gsap.set(stepEls, { opacity: 0 });
  gsap.set(segs, { transformOrigin: '0% 50%', scaleX: 0 });
  gsap.set(fieldPts, { opacity: 0 });

  const tl = gsap.timeline({ defaults: { ease: MOTION.ease.enter } });

  // --- 0.0–0.5 · wake, top-edge signal, navigation -----------------
  tl.to('#wake', { autoAlpha: 0, duration: 0.55, ease: MOTION.ease.move }, 0)
    .fromTo('#topsig', { opacity: 1, x: -240 },
      { x: () => window.innerWidth + 40, duration: 0.6, ease: MOTION.ease.move }, 0)
    // autoAlpha, not opacity: it parks off the right edge, and visibility:hidden
    // keeps it out of overflow calculations entirely
    .to('#topsig', { autoAlpha: 0, duration: 0.2 }, 0.5)
    .to('[data-nav]', { yPercent: 0, autoAlpha: 1, duration: 0.55, stagger: MOTION.stagger.tight }, 0.15);

  // --- 0.4–1.3 · the node appears; the call arrives ----------------
  tl.to(dot, { scale: 1, duration: 0.5, ease: MOTION.ease.overshoot }, 0.45);
  // One property, one owner. Overlapping opacity tweens at the same position
  // fight each other and the later one wins every tick, which quietly capped
  // these at a third of their intended brightness.
  waves.forEach((w, i) => {
    const at = 0.55 + i * 0.22;
    tl.fromTo(w, { opacity: 0, scale: 1.25 }, { opacity: 0.85, duration: 0.18, ease: 'none' }, at)
      .to(w, { scale: 0.06, duration: 0.62, ease: MOTION.ease.exit }, at)
      .to(w, { opacity: 0, duration: 0.44, ease: 'none' }, at + 0.18);
  });
  // the node reacts physically as the first signal lands
  tl.to(dot, { scale: 1.15, duration: 0.12, ease: MOTION.ease.enter }, 1.02)
    .to(dot, { scale: 1, duration: 0.22, ease: MOTION.ease.move }, 1.14);

  // --- 0.9–2.2 · the arch draws from both ends ---------------------
  // The arch grows from both ends at once, so a single highlight sweeping the
  // full arc would race ahead of the stroke through empty space. Instead each
  // tip carries its own highlight, on the same path, ease and timing as the
  // draw — so the light is always exactly where the arch is being made.
  tl.to([archL, archR], { strokeDashoffset: 0, duration: 1.15, ease: MOTION.ease.move }, 0.95)
    .set([archTipL, archTipR], { opacity: 1 }, 0.95)
    .to(archTipL, {
      duration: 1.15, ease: MOTION.ease.move,
      motionPath: { path: archL, align: archL, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
    }, 0.95)
    .to(archTipR, {
      duration: 1.15, ease: MOTION.ease.move,
      motionPath: { path: archR, align: archR, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
    }, 0.95)
    // they meet at the apex and merge away
    .to([archTipL, archTipR], { opacity: 0, duration: 0.22 }, 2.06);

  // --- 1.8–3.2 · captured -----------------------------------------
  tl.to(dot, { scale: 0.78, duration: 0.16, ease: MOTION.ease.exit }, 1.9)
    .to(dot, { scale: 1.08, duration: 0.22, ease: 'back.out(3)' }, 2.06)
    .to(dot, { scale: 1, duration: 0.2 }, 2.28)
    .fromTo(status, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 }, 2.15)
    .to('h1 .w[data-w="1"]', { yPercent: 0, duration: 0.7, ease: MOTION.ease.curtain }, 2.2);

  // --- 2.8–4.8 · the story routes ----------------------------------
  // One state is prominent at a time so it stays legible on a phone;
  // the segment bar carries the sequence so nothing is lost.
  tl.to(story, { opacity: 1, duration: 0.4 }, 2.85)
    .set(packet, { opacity: 1, attr: { cx: 310, cy: 352 } }, 2.95)
    .to(packet, { attr: { cx: STEPS[0].x, cy: 516 }, duration: 0.4, ease: MOTION.ease.move }, 2.95);

  STEPS.forEach((s, i) => {
    const at = 3.35 + i * 0.42;
    if (i > 0) {
      tl.to(packet, { attr: { cx: s.x }, duration: 0.42, ease: MOTION.ease.move }, at - 0.42);
    }
    tl.to(segs[i], { scaleX: 1, duration: 0.3, ease: MOTION.ease.enter }, at)
      .fromTo(stepEls[i], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.26 }, at);
    // hand off to the next state — tweened, never callback-driven, so that
    // scrubbing the timeline always shows the state that truly belongs to that time
    if (i < STEPS.length - 1) {
      tl.to(stepEls[i], { opacity: 0, y: -8, duration: 0.2, ease: MOTION.ease.exit }, at + 0.34);
    }
  });
  tl.to(packet, { opacity: 0, duration: 0.22 }, 5.02);

  // --- 4.8–6.3 · contract back into the mark, resolve --------------
  tl.to(story, { opacity: 0, y: -12, duration: 0.45, ease: MOTION.ease.exit }, 5.08)
    .set(story, { y: 0 })
    .to(status, { opacity: 0, duration: 0.35 }, 5.1)
    .to('h1 .w[data-w="2"]', { yPercent: 0, duration: 0.7, ease: MOTION.ease.curtain }, 5.15)
    .fromTo(dotPulse, { opacity: 0.9, scale: 1 },
      { opacity: 0, scale: 3.2, duration: 0.9, ease: MOTION.ease.enter }, 5.3)
    // fully settled by ~5.85s, inside the brief's 4.4–6.2 window
    .to('[data-cta]', { yPercent: 0, autoAlpha: 1, duration: 0.55, stagger: MOTION.stagger.base, ease: MOTION.ease.settle }, 5.2);

  // --- 6.3–8.0 · hand off to the living idle ----------------------
  // Kept on the master timeline so the debug scrubber covers the
  // full eight seconds the brief describes.
  tl.to(fieldPts, { opacity: 0.5, duration: 0.6, stagger: 0.03 }, 6.4)
    .to(markG, { scale: 1.008, duration: 0.8, ease: MOTION.ease.breathe }, 6.6)
    .to(markG, { scale: 1, duration: 0.8, ease: MOTION.ease.breathe }, 7.4);

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

    // a signal occasionally travels the arch
    const ping = () => {
      if (document.hidden || !stageVisible || motionHalted) { pingCall = gsap.delayedCall(4, ping); return; }
      gsap.timeline({ onComplete: () => { pingCall = gsap.delayedCall(5.5, ping); } })
        .set(archHi, { opacity: 1 })
        .to(archHi, {
          duration: 1.2, ease: 'power1.inOut',
          motionPath: { path: archFull, align: archFull, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
        })
        .to(archHi, { opacity: 0, duration: 0.2 }, '-=0.15');
    };
    pingCall = gsap.delayedCall(1.6, ping);

    replayTl = buildStageReplay();
    scheduleReplay(9);
  }

  function scheduleReplay(delay) {
    gsap.delayedCall(delay, () => {
      if (document.hidden || !stageVisible || motionHalted) { scheduleReplay(5); return; }
      replayTl.restart();
    });
  }

  /**
   * The story runs again, but inside the stage only. The headline, navigation
   * and CTAs are deliberately untouched — they arrived once and they stay.
   */
  function buildStageReplay() {
    const r = gsap.timeline({ paused: true, onComplete: () => scheduleReplay(9) });

    r.set(segs, { scaleX: 0 })
     .set(stepEls, { opacity: 0 })
     .set(story, { opacity: 1, y: 0 });

    waves.forEach((w, i) => {
      const at = i * 0.22;
      r.fromTo(w, { opacity: 0, scale: 1.25 }, { opacity: 0.85, duration: 0.18, ease: 'none' }, at)
       .to(w, { scale: 0.06, duration: 0.62, ease: MOTION.ease.exit }, at)
       .to(w, { opacity: 0, duration: 0.44, ease: 'none' }, at + 0.18);
    });

    r.to(dot, { scale: 0.82, duration: 0.14, ease: MOTION.ease.exit }, 0.62)
     .to(dot, { scale: 1, duration: 0.24, ease: 'back.out(3)' }, 0.76)
     .fromTo(status, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, 0.7)
     .set(packet, { opacity: 1, attr: { cx: 310, cy: 352 } }, 0.95)
     .to(packet, { attr: { cx: STEPS[0].x, cy: 516 }, duration: 0.4, ease: MOTION.ease.move }, 0.95);

    STEPS.forEach((s, i) => {
      const at = 1.35 + i * 0.42;
      if (i > 0) r.to(packet, { attr: { cx: s.x }, duration: 0.42, ease: MOTION.ease.move }, at - 0.42);
      r.to(segs[i], { scaleX: 1, duration: 0.3, ease: MOTION.ease.enter }, at)
       .fromTo(stepEls[i], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.26 }, at);
      if (i < STEPS.length - 1) {
        r.to(stepEls[i], { opacity: 0, y: -8, duration: 0.2, ease: MOTION.ease.exit }, at + 0.34);
      }
    });

    const end = 1.35 + 3 * 0.42 + 0.55;
    r.to(packet, { opacity: 0, duration: 0.2 }, end)
     .to([story, status], { opacity: 0, duration: 0.4 }, end + 0.1);

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
