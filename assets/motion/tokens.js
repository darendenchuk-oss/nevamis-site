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

  /* Cursor follower (gsap.quickTo durations). The dot REPLACES the native
     cursor, and the hand knows where the mouse is — any visible easing on
     the dot reads as input lag, which the owner called out as cheap
     (2026-08-02: "doesn't follow properly"). 0.16 was ~50px of trail at
     ordinary mouse speed. The dot is now effectively instant; the halo
     alone carries the trailing weight, tight enough to feel magnetic
     rather than late. */
  cursor: {
    dot: 0.055,
    halo: 0.16,
    morph: 0.3,
  },

  // hero narrative beats — the single source of truth for the timeline AND
  // the debug panel's jump-to-state buttons. Times are seconds.
  // Each time is chosen to land in the MIDDLE of its state, so jumping to a
  // beat always shows that state fully rendered rather than mid-transition.
  //
  // These describe STAGE states and nothing else. Two of them used to name
  // things the film did to the page — "Wake + copy" for the veil lifting off
  // the document while the copy column faded in, and "CTAs live" for the
  // moment the buttons were finally handed back — and since 2026-08-27 the
  // film does neither: the copy and the CTAs are live at first paint and
  // never move. A jump-to-state label that names a state the timeline no
  // longer has is a debug panel lying about what it is showing, so both now
  // name what actually happens on the stage at that time. Keys and times are
  // unchanged; only the descriptions were wrong.
  beats: [
    { key: 'wake',    label: 'Stage opens',     time: 0.30 },
    { key: 'detect',  label: 'Call detected',   time: 1.20 },
    { key: 'act',     label: 'Signal lands',    time: 1.30 },
    { key: 'form',    label: 'Arch forms',      time: 2.05 },
    { key: 'answer',  label: 'Call answered',   time: 2.95 },
    { key: 'route',   label: 'Answer captured', time: 3.65 },
    { key: 'book',    label: 'Book → Text',     time: 4.80 },
    { key: 'resolve', label: 'Stage recedes',   time: 6.55 },
    { key: 'idle',    label: 'Living idle',     time: 6.60 },
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
