/* ============================================================
   NEVAMIS MOTION — entry point
   Loads after the vendored GSAP scripts and after site.js (which
   owns the motion-off class + nv-motion preference). Wires the
   cursor, magnetic buttons, card tilt, and the glue that lets the
   site-wide "pause motion" toggle stop the GSAP layer. Every init
   is guarded: a failure must never hide content.

   NO HERO HERE ANY MORE (2026-09-25). This module used to import
   ./hero.js and register GSAP's MotionPathPlugin for it. hero.js
   animated the #stage and #mark SVGs of the pre-film homepage and
   returned at once on any page without them; no page that loads
   this module has had #mark since the film homepage shipped
   (47acb84), and the homepage itself does not load this module.
   So every secondary page downloaded the hero and the plugin,
   about 20 KB gzipped, to run one early return. Both files, the
   plugin's <script> tag on every page, the ?motionDebug=1
   inspector that only ever drove the hero's timeline, and the
   override in tokens.js that let that flag switch motion back on
   for a reduced-motion visitor are deleted.
   scripts/check-published-surface.mjs now fails on a vendored
   file no page loads, so an orphan cannot ship again unnoticed.
   ============================================================ */

import { prefersReduced, isFinePointer } from './tokens.js';
import { initCursor } from './cursor.js';
import { initSonar } from './sonar.js';
import { initScroll } from './scroll.js';
import { initVoice } from './voice.js';

const gsap = window.gsap;

/* NO SITE SEARCH HERE ANY MORE (2026-10-03, audit COMPLETENESS-6). This
   module wired a search combobox, ./search.js, that looked for #siteSearch,
   and no page has carried #siteSearch since the film homepage replaced the
   old hero. So every secondary page downloaded a module whose first line
   returned, and its dormant empty state still told visitors to search for
   "pilot", a page that answers there is no pilot and asks not to be
   indexed. The module and this call are deleted. /search-index.json stays:
   it is generated from every public page and is listed in llms.txt for the
   machines that read the site, which are now its only audience. */

if (gsap) {
  gsap.ticker.lagSmoothing(500, 33);

  /* THE AURORA IS GONE (2026-09-20). ./aurora.js drew a fixed, full-viewport
     WebGL sky of blue, green and pink rays on every page that loads this
     module - which is every page except the homepage, the one page the owner
     is happy with. A moving sky on twenty pages and none on the twenty-first
     is two websites, so it is deleted rather than retuned to emerald: 26,909
     bytes, one module request, 30 paints a second at rest over 498,294 px at
     1440, and the 2D fallback path, all of it. It also takes three contrast
     workarounds with it - the hero scrim, the page-hero ghost button's dark
     plate, and the reason the header deferred its backdrop-filter. */
  guard(initSonar);
  const cursor = guard(initCursor);
  guard(initScroll);
  guard(initVoice);
  guard(initMagnetics);
  guard(initTilt);
  guard(initCardGlow);
  guard(() => initMotionToggle(cursor));
}

/** Run an init; on failure log and leave the page fully readable. */
function guard(fn) {
  try { return fn(); } catch (err) {
    console.error('[motion]', err);
    try {
      /* For the modules that mask their own targets (scroll.js and .mwi).
         It keeps nav/CTAs in the list because "failure means show
         everything" is cheaper to keep true than to keep accurate. */
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
   halts the GSAP layer: the scroll flourishes stop, the custom
   cursor steps aside, and everything resumes cleanly.
   ------------------------------------------------------------ */
function initMotionToggle(cursor) {
  const btn = document.querySelector('.motion-toggle-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // site.js toggles the class in its own listener; read the result after it ran.
    requestAnimationFrame(() => {
      const off = document.documentElement.classList.contains('motion-off');
      if (off) {
        if (window.__scrollMotionOff) window.__scrollMotionOff();
        if (cursor && cursor.hide) cursor.hide();
        document.documentElement.classList.remove('nv-cursor-ready');
      }
      // Turning motion back on: the scroll flourishes rebuild on the next
      // page load; the IO-based .reveal baseline covers the rest of this visit.
    });
  });
}
