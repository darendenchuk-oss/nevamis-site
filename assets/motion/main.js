/* ============================================================
   NEVAMIS MOTION — entry point
   Loads after the vendored GSAP scripts and after site.js (which
   owns the motion-off class + nv-motion preference). Wires the
   hero, cursor, magnetic buttons, card tilt, and the glue that
   lets the site-wide "pause motion" toggle stop the GSAP layer.
   Every init is guarded: a failure must never hide content.
   ============================================================ */

import { isDebug, prefersReduced, isFinePointer } from './tokens.js';
import { initHero } from './hero.js';
import { initCursor } from './cursor.js';
import { initAurora } from './aurora.js';
import { initSonar } from './sonar.js';
import { initSearch } from './search.js';
import { initScroll } from './scroll.js';
import { initVoice } from './voice.js';

const gsap = window.gsap;

/* Search is wayfinding, not motion, so it is wired before the gsap check and
   outside it: if the animation library fails to load, a visitor looking for
   the pricing page should still be able to find it. */
guard(initSearch);

if (gsap) {
  // Plugins are optional per page: only ever register what actually loaded.
  if (window.MotionPathPlugin) gsap.registerPlugin(window.MotionPathPlugin);
  gsap.ticker.lagSmoothing(500, 33);

  guard(initAurora);
  guard(initSonar);
  const hero = guard(initHero);
  const cursor = guard(initCursor);
  guard(initScroll);
  guard(initVoice);
  guard(initMagnetics);
  guard(initTilt);
  guard(initCardGlow);
  guard(() => initMotionToggle(cursor));

  if (isDebug() && hero && hero.tl) {
    import('./debug.js').then((m) => m.initDebug(hero.tl)).catch(() => {});
  }
}

/** Run an init; on failure log and leave the page fully readable. */
function guard(fn) {
  try { return fn(); } catch (err) {
    console.error('[motion]', err);
    try {
      /* The hero no longer hides anything here to begin with: since
         2026-08-27 it animates the #stage SVG and nothing else, so a thrown
         initHero cannot cost a visitor the headline, the copy or a CTA. This
         stays for the modules that still mask their own targets (scroll.js
         and .mwi), and it keeps nav/CTAs in the list because "failure means
         show everything" is cheaper to keep true than to keep accurate.

         Two entries went with the rewrite: `h1 .ch`, the per-character spans
         nothing creates any more, and a lookup that force-hid the #wake veil,
         which no longer exists. */
      gsap.set('[data-nav], [data-cta], h1 .w, .mwi', { clearProps: 'all', autoAlpha: 1, yPercent: 0 });
    } catch (e2) { /* leave CSS defaults */ }
    return null;
  }
}

/* ------------------------------------------------------------
   Cards carry a faint mint glow that tracks the pointer. CSS
   paints it from --mx/--my; this only feeds the numbers, so the
   effect costs two custom properties per move and no layout.
   ------------------------------------------------------------ */
function initCardGlow() {
  if (!isFinePointer() || prefersReduced()) return;
  const hosts = document.querySelectorAll('[data-tilt], .mode, .nb-scene, .plan, .call-card');
  hosts.forEach((el) => {
    el.classList.add('glowable');
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (document.documentElement.classList.contains('motion-off')) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
    }, { passive: true });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    });
  });
}

/* ------------------------------------------------------------
   Buttons lean toward the pointer (max 8px) and settle back.
   ------------------------------------------------------------ */
function initMagnetics() {
  if (!isFinePointer() || prefersReduced()) return;
  const MAX = 8;

  document.querySelectorAll('a.btn, button.btn, .play').forEach((btn) => {
    const x = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3' });
    const y = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3' });

    btn.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (document.documentElement.classList.contains('motion-off')) return;
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      x(Math.max(-1, Math.min(1, dx)) * MAX);
      y(Math.max(-1, Math.min(1, dy)) * MAX);
    }, { passive: true });

    btn.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ------------------------------------------------------------
   Cards tilt toward the pointer — capped at 2 degrees.
   ------------------------------------------------------------ */
function initTilt() {
  if (!isFinePointer() || prefersReduced()) return;
  const MAX_DEG = 2;

  document.querySelectorAll('[data-tilt]').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power2' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power2' });
    gsap.set(card, { transformPerspective: 700 });

    card.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (document.documentElement.classList.contains('motion-off')) return;
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      ry(nx * MAX_DEG * 2);
      rx(-ny * MAX_DEG * 2);
    }, { passive: true });

    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* ------------------------------------------------------------
   The site-wide "pause motion" button (owned by site.js) also
   halts the GSAP layer: hero freezes on its finished frame,
   the custom cursor steps aside, and everything resumes cleanly.
   ------------------------------------------------------------ */
function initMotionToggle(cursor) {
  const btn = document.querySelector('.motion-toggle-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // site.js toggles the class in its own listener; read the result after it ran.
    requestAnimationFrame(() => {
      const off = document.documentElement.classList.contains('motion-off');
      if (off) {
        if (window.__heroMotionOff) window.__heroMotionOff();
        if (window.__scrollMotionOff) window.__scrollMotionOff();
        if (cursor && cursor.hide) cursor.hide();
        document.documentElement.classList.remove('nv-cursor-ready');
      } else if (window.__heroMotionOn) {
        window.__heroMotionOn();
        // The scroll flourishes rebuild on the next page load; the IO-based
        // .reveal baseline covers the rest of this visit.
      }
    });
  });
}
