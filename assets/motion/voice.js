/* ============================================================
   NEVAMIS VOICE BARS
   The product is a voice on a phone line, so the site carries one
   small recurring motif: a five-bar speech meter that moves the
   way talking sounds. It appears where the page claims a voice is
   speaking (the hero's CALL ANSWERED status, the night band) and
   nowhere else, so the motif keeps meaning something.

   Purely decorative: every host element is aria-hidden. Bars are
   driven by transform only, at 8 steps per second, not per frame;
   an IntersectionObserver and the visibility API stop them the
   moment they cannot be seen. Reduced motion or the motion toggle
   renders the bars as a static, mid-height signature.
   ============================================================ */

import { prefersReduced, onVisibility } from './tokens.js';

const BAR_COUNT = 5;
const STEP_MS = 125;

/* A talking rhythm rather than white noise: mostly mid heights with
   occasional emphasis and dips, biased to the middle bars the way a
   voice's energy sits mid-band. Seeded walk, no Math.random storm. */
function nextHeights(prev) {
  const out = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const centre = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2); // 0 edge .. 1 middle
    const drift = (Math.random() - 0.5) * 0.55;
    const target = 0.25 + centre * 0.45 + drift;
    const eased = prev ? prev[i] + (target - prev[i]) * 0.6 : target;
    out.push(Math.max(0.14, Math.min(1, eased)));
  }
  return out;
}

export function initVoice() {
  const hosts = Array.from(document.querySelectorAll('[data-voice]'));
  if (hosts.length === 0) return null;

  const reduce = prefersReduced();
  const STATIC = [0.35, 0.7, 1, 0.55, 0.3];

  const units = hosts.map((host) => {
    host.classList.add('vb');
    // Idempotent: re-running init must not double the bars.
    if (!host.querySelector('i')) {
      for (let i = 0; i < BAR_COUNT; i++) host.appendChild(document.createElement('i'));
    }
    const bars = Array.from(host.querySelectorAll('i'));
    bars.forEach((b, i) => { b.style.transform = `scaleY(${STATIC[i]})`; });
    return { host, bars, visible: false, heights: STATIC.slice() };
  });

  // The static signature IS the reduced experience. Nothing runs.
  if (reduce) return { units, reduced: true };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const u = units.find((x) => x.host === e.target);
      if (u) u.visible = e.isIntersecting;
    }
  }, { threshold: 0.05 });
  units.forEach((u) => io.observe(u.host));

  let hidden = document.hidden;
  onVisibility((v) => { hidden = !v; });

  const timer = setInterval(() => {
    if (hidden) return;
    if (document.documentElement.classList.contains('motion-off')) return;
    for (const u of units) {
      if (!u.visible) continue;
      u.heights = nextHeights(u.heights);
      for (let i = 0; i < BAR_COUNT; i++) u.bars[i].style.transform = `scaleY(${u.heights[i].toFixed(3)})`;
    }
  }, STEP_MS);

  return {
    units,
    stop: () => { clearInterval(timer); io.disconnect(); },
  };
}
