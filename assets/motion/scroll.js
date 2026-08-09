/* ============================================================
   NEVAMIS SCROLL — the page answers scrolling
   ScrollTrigger layer over the IO-based .reveal baseline. The
   baseline (site.js + CSS transitions) stays untouched and is the
   guaranteed experience; everything here is enhancement on top:

     1. section headings rise word-by-word behind line masks
     2. the night-call band pins and scrubs on desktop
     3. the ROI figures count up to their real values on arrival
     4. the aurora gets a small pulse at landmark sections
     5. the hero stage eases upward as it hands the page over

   Contract, same as every motion module: content is complete with
   no JS, with reduced motion, and with the motion toggle off. All
   hidden states are applied HERE, never in CSS, so a failure
   anywhere leaves plain readable text. A 4s sweep double-checks
   that nothing above the fold is still waiting on a trigger that
   never fired.
   ============================================================ */

import { MOTION, prefersReduced, isFinePointer } from './tokens.js';

export function initScroll() {
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  if (!gsap || !ST) return null;
  // The reduced experience is the CSS/IO baseline, already complete.
  if (prefersReduced()) return null;

  gsap.registerPlugin(ST);

  const mm = gsap.matchMedia();
  const wrapped = [];   // mask inners, for the safety sweep and teardown

  // ---------------------------------------------------------------
  // 1 · Heading curtains: every section h2 rises word-by-word.
  //     Word-level, not characters: whole words stay whole tokens
  //     for assistive tech, so no aria surgery is needed.
  // ---------------------------------------------------------------
  /* A heading that is ALREADY ON SCREEN when this file arrives is left alone.
     The curtain is an entrance, and there is nothing to enter if the reader is
     already looking at the words.

     This file is the last thing to load on a phone: about 4.8s at 4x CPU on
     Slow 4G, while the page itself now paints at roughly 830ms. Masking an
     h2 at that point took a heading the visitor had been reading for four
     seconds, snapped it offstage, and slid it back in. It also made that
     heading's paint time 4,976ms, and on plumbers.html and restoration.html
     the h2 is marginally larger than the lede, so it became the Largest
     Contentful Paint: 4,932ms and 4,960ms measured, against pages that were
     otherwise complete before one second.

     Below the fold nothing changes, which is every heading the effect was
     ever designed for. */
  const fold = window.innerHeight || 0;
  const heads = gsap.utils.toArray('main h2, section h2').filter((h) => {
    if (h.closest('.hero') || h.dataset.masked || h.children.length !== 0 || !h.textContent.trim()) return false;
    return h.getBoundingClientRect().top >= fold;
  });

  for (const h of heads) {
    const words = h.textContent.trim().split(/\s+/);
    h.dataset.masked = '1';
    h.textContent = '';
    const inners = [];
    words.forEach((w, i) => {
      const mask = document.createElement('span');
      mask.className = 'mw';
      const inner = document.createElement('span');
      inner.className = 'mwi';
      inner.textContent = w;
      mask.appendChild(inner);
      h.appendChild(mask);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
      inners.push(inner);
    });
    wrapped.push(...inners);
    gsap.set(inners, { yPercent: 112 });
    gsap.to(inners, {
      yPercent: 0,
      duration: 0.55,
      stagger: 0.045,
      ease: MOTION.ease.curtain,
      scrollTrigger: { trigger: h, start: 'top 86%', once: true },
      onComplete: () => gsap.set(inners, { clearProps: 'will-change' }),
    });
  }

  // ---------------------------------------------------------------
  // 2 · The night-call band: pinned and scroll-scrubbed on desktop,
  //     the plain stacked .reveal cards everywhere else. The pinned
  //     variant exists only while html.nv-pin-night is set, so CSS
  //     alone can never hide a scene.
  // ---------------------------------------------------------------
  const band = document.querySelector('[data-night]');
  if (band) {
    mm.add('(min-width: 900px)', () => {
      const scenes = gsap.utils.toArray('[data-night] .nb-scene');
      const railFill = band.querySelector('.nb-rail i');
      if (scenes.length < 2) return;

      document.documentElement.classList.add('nv-pin-night');
      // In pin mode the scenes stack; the first starts visible.
      /* yPercent:-50 does the vertical centring the CSS cannot: GSAP owns
         the whole transform once it writes one, so the -50% must live here. */
      gsap.set(scenes, { autoAlpha: 0, y: 26, yPercent: -50 });
      gsap.set(scenes[0], { autoAlpha: 1, y: 0 });
      const chips = scenes.map((s) => gsap.utils.toArray(s.querySelectorAll('.nb-chip')));
      chips.forEach((c) => c.length && gsap.set(c, { autoAlpha: 0, y: 8 }));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: band,
          start: 'top top',
          end: '+=190%',
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
        },
        defaults: { ease: 'none' },
      });

      if (railFill) {
        gsap.set(railFill, { scaleY: 0, transformOrigin: '50% 0%' });
        tl.to(railFill, { scaleY: 1, duration: 3 }, 0);
      }
      scenes.forEach((s, i) => {
        if (i === 0) {
          if (chips[0].length) tl.to(chips[0], { autoAlpha: 1, y: 0, duration: 0.18, stagger: 0.06 }, 0.1);
          tl.to(s, { autoAlpha: 0, y: -22, duration: 0.35 }, 0.65);
          return;
        }
        const at = 0.65 + (i - 1) * 1.0;
        tl.to(s, { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.15);
        if (chips[i].length) tl.to(chips[i], { autoAlpha: 1, y: 0, duration: 0.2, stagger: 0.08 }, at + 0.35);
        if (i < scenes.length - 1) tl.to(s, { autoAlpha: 0, y: -22, duration: 0.35 }, at + 1.0);
      });

      return () => {
        document.documentElement.classList.remove('nv-pin-night');
        gsap.set(scenes, { clearProps: 'all' });
        chips.forEach((c) => c.length && gsap.set(c, { clearProps: 'all' }));
      };
    });
  }

  // ---------------------------------------------------------------
  // 3 · ROI figures count up to the value already on screen. The
  //     final frame is EXACTLY the text site.js computed; the tween
  //     only approaches it, so the calculator stays the only source
  //     of numbers and nothing here can invent one.
  // ---------------------------------------------------------------
  for (const id of ['roiOpp', 'roiRec']) {
    const el = document.getElementById(id);
    if (!el) continue;
    ST.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        const final = el.textContent;
        const n = Number((final.match(/[\d,]+/) || [''])[0].replace(/,/g, ''));
        if (!Number.isFinite(n) || n <= 0) return;
        const state = { v: n * 0.3 };
        gsap.to(state, {
          v: n,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => { el.textContent = '$' + Math.round(state.v).toLocaleString('en-CA'); },
          onComplete: () => { el.textContent = final; },
        });
      },
    });
  }

  // ---------------------------------------------------------------
  // 4 · Landmark pulses into the aurora.
  // ---------------------------------------------------------------
  for (const sel of ['#proof', '[data-night]', '#roi', '#pricing-preview']) {
    const el = document.querySelector(sel);
    if (!el) continue;
    ST.create({
      trigger: el,
      start: 'top 70%',
      once: true,
      onEnter: () => { if (window.__auroraPulse) window.__auroraPulse(0.22); },
    });
  }

  // ---------------------------------------------------------------
  // 5 · The hero stage hands the page over: as the visitor scrolls
  //     out of the hero, the stage eases up a touch faster than the
  //     page. Small (30px) and desktop-only: parallax is exactly the
  //     class of motion the vestibular guidance warns about, so this
  //     stays a whisper rather than a ride.
  // ---------------------------------------------------------------
  if (isFinePointer()) {
    const stageSvg = document.querySelector('.hero .stage');
    if (stageSvg) {
      mm.add('(min-width: 900px)', () => {
        const t = gsap.to(stageSvg, {
          y: -30,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'bottom 90%', end: 'bottom 30%', scrub: true },
        });
        return () => { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); gsap.set(stageSvg, { clearProps: 'y' }); };
      });
    }
  }

  // ---------------------------------------------------------------
  // Safety sweep: if any masked word above the fold is still hidden
  // 4s in (a trigger that never fired, a refresh mid-load), show it.
  // Nothing on this page is ever allowed to stay invisible.
  // ---------------------------------------------------------------
  const sweep = setTimeout(() => {
    for (const el of wrapped) {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && Math.abs(gsap.getProperty(el, 'yPercent')) > 1) {
        gsap.to(el, { yPercent: 0, duration: 0.4, ease: MOTION.ease.enter });
      }
    }
    ST.refresh();
  }, 4000);

  // ---------------------------------------------------------------
  // The site-wide motion toggle. Off: kill every trigger and land
  // every element on its finished frame. Back on: the baseline IO
  // reveals still run; the scroll flourishes return on next load.
  // ---------------------------------------------------------------
  const off = () => {
    clearTimeout(sweep);
    mm.revert();
    ST.getAll().forEach((t) => t.kill());
    gsap.set(wrapped, { yPercent: 0, clearProps: 'will-change' });
    document.querySelectorAll('[data-night] .nb-scene, [data-night] .nb-chip').forEach((el) => {
      gsap.set(el, { clearProps: 'all' });
    });
  };
  window.__scrollMotionOff = off;

  return { off };
}
