/* ============================================================
   NEVAMIS MOTION TOKENS
   One source of truth for duration, easing, stagger and spring.
   Every motion module reads from here so the whole site shares
   a single, tunable feel.
   ============================================================ */

export const MOTION = {
  // durations (seconds)
  dur: {
    instant: 0.12,   // interaction confirmation — must land under 100ms perceptually
    fast: 0.22,      // hover states, small reveals
    base: 0.4,       // standard entrance
    slow: 0.7,       // headline reveals
    story: 1.15,     // narrative beats (arch draw, packet travel)
    ambient: 2.2,    // idle breathing
  },

  // easings — named by intent, not by curve
  ease: {
    enter: 'power3.out',        // things arriving
    exit: 'power3.in',          // things leaving
    move: 'power2.inOut',       // travel between two states
    settle: 'back.out(1.7)',    // spring settle for CTAs
    overshoot: 'back.out(2.6)', // controlled scale overshoot (the dot)
    breathe: 'sine.inOut',      // ambient loops
    curtain: 'power4.out',      // masked type reveals
  },

  stagger: {
    tight: 0.06,   // nav items
    base: 0.09,    // CTA pair
  },

  // cursor follower spring (gsap.quickTo durations)
  cursor: {
    dot: 0.16,
    halo: 0.34,
    morph: 0.3,
  },

  // hero narrative beats — the single source of truth for the timeline AND
  // the debug panel's jump-to-state buttons. Times are seconds.
  // Each time is chosen to land in the MIDDLE of its state, so jumping to a
  // beat always shows that state fully rendered rather than mid-transition.
  beats: [
    { key: 'wake',    label: 'Wake + nav',      time: 0.35 },
    { key: 'detect',  label: 'Call detected',   time: 1.15 },
    { key: 'form',    label: 'Arch forms',      time: 2.10 },
    { key: 'answer',  label: 'Call answered',   time: 3.10 },
    { key: 'route',   label: 'Answer captured', time: 3.95 },
    { key: 'book',    label: 'Book → Text',     time: 5.15 },
    { key: 'resolve', label: 'Captured + CTAs', time: 7.00 },
    { key: 'idle',    label: 'Living idle',     time: 7.20 },
  ],
};

/** True when the visitor asked for less motion — via the OS setting, the
 *  site's own "pause motion" toggle (persisted by site.js as nv-motion),
 *  or `?reduce=1` for testing. */
export function prefersReduced() {
  const p = new URLSearchParams(location.search);
  if (p.get('reduce') === '1') return true;
  // motionDebug deliberately forces motion so the sequence can be inspected.
  if (p.get('motionDebug') === '1') return false;
  if (document.documentElement.classList.contains('motion-off')) return true;
  try { if (localStorage.getItem('nv-motion') === 'off') return true; } catch (e) { /* storage blocked */ }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Dev-only motion inspector flag. */
export function isDebug() {
  return new URLSearchParams(location.search).get('motionDebug') === '1';
}

/** Mouse/trackpad — not touch. Gates the custom cursor and hover-only flourishes. */
export function isFinePointer() {
  return window.matchMedia('(pointer: fine)').matches;
}

/** Respects the tab being hidden so we never burn CPU in a background tab. */
export function onVisibility(cb) {
  document.addEventListener('visibilitychange', () => cb(!document.hidden));
}
