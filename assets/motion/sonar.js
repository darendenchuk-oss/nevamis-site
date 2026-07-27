/* ============================================================
   NEVAMIS SONAR
   Every tap or click emits a sonar ring from the point of
   contact — the same visual language as the hero's incoming-call
   waves: a touch is a signal, and the site answers it.

   Works for mouse, touch and pen. A small pooled set of ring
   elements is reused so rapid taps never allocate. Interactive
   targets get a brighter, larger ping than the open page.
   Skipped entirely under reduced motion / the motion toggle.
   ============================================================ */

import { MOTION, prefersReduced } from './tokens.js';

const POOL = 8;

const CSS = `
.nv-sonar{position:fixed;top:0;left:0;z-index:9998;pointer-events:none;opacity:0;
  border-radius:50%;border:2px solid var(--mint,#9FF0CE);
  box-shadow:0 0 14px rgba(159,240,206,.5),inset 0 0 8px rgba(159,240,206,.25);
  will-change:transform,opacity}
`;

export function initSonar() {
  const gsap = window.gsap;
  if (!gsap || prefersReduced()) return null;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const rings = [];
  for (let i = 0; i < POOL; i++) {
    const r = document.createElement('div');
    r.className = 'nv-sonar';
    r.setAttribute('aria-hidden', 'true');
    document.body.appendChild(r);
    rings.push(r);
  }
  let next = 0;

  function ping(x, y, strong, delay, sizeScale) {
    const r = rings[next];
    next = (next + 1) % POOL;
    const size = (strong ? 72 : 52) * sizeScale;
    gsap.killTweensOf(r);
    gsap.set(r, {
      width: size, height: size,
      x: x - size / 2, y: y - size / 2,
      scale: 0.2, opacity: strong ? 0.85 : 0.55,
      borderWidth: strong ? 2.5 : 1.5,
    });
    gsap.to(r, {
      scale: 1, opacity: 0,
      duration: strong ? 0.75 : 0.6,
      delay,
      ease: 'power2.out',
    });
  }

  window.addEventListener('pointerdown', (e) => {
    if (document.documentElement.classList.contains('motion-off')) return;
    // never draw over the dev inspector
    if (e.target instanceof Element && e.target.closest('.nv-dbg')) return;
    const strong = !!(e.target instanceof Element &&
      e.target.closest('a, button, [role="button"], summary, input, select, textarea, label'));
    ping(e.clientX, e.clientY, strong, 0, 1);
    // the echo — same signature as the hero's triple call-waves
    ping(e.clientX, e.clientY, strong, 0.12, 1.45);
  }, { passive: true });

  return { ping };
}
