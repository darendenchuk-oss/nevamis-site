/* ============================================================
   NEVAMIS CURSOR
   A compact mint node with a halo that trails behind it. The halo
   is not decoration: it reports what the pointer is over.
     · button  → halo wraps the control and the Nevamis arch forms above it
     · link    → halo collapses into a short signal underline
     · stage   → halo opens up; the visual stage pulls its points toward you
     · press   → node compresses once to confirm the interaction
   Desktop fine-pointer only. Off for touch and reduced motion.
   Never intercepts clicks (pointer-events: none throughout).
   ============================================================ */

import { MOTION, prefersReduced, isFinePointer } from './tokens.js';

const CSS = `
.nv-cur, .nv-halo{position:fixed;top:0;left:0;z-index:9999;pointer-events:none;
  will-change:transform;opacity:0;contain:layout style paint}
.nv-cur{width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;
  background:var(--mint,#9FF0CE);box-shadow:0 0 12px rgba(159,240,206,.95),0 0 3px rgba(4,18,12,.6)}
.nv-halo{width:38px;height:38px;margin:-19px 0 0 -19px;border-radius:999px;
  border:1px solid rgba(159,240,206,.38);background:rgba(159,240,206,.04)}
.nv-halo .nv-arch{position:absolute;inset:0;width:100%;height:100%;opacity:0;overflow:visible}
.nv-halo .nv-arch path{fill:none;stroke:var(--mint,#9FF0CE);stroke-width:2;stroke-linecap:round;
  filter:drop-shadow(0 0 5px rgba(47,191,143,.8))}
html.nv-cursor-ready,
html.nv-cursor-ready a,
html.nv-cursor-ready button,
html.nv-cursor-ready summary,
html.nv-cursor-ready [role="button"]{cursor:none}
/* Form fields keep the native I-beam/pointer — precision matters there. */
html.nv-cursor-ready input,
html.nv-cursor-ready textarea,
html.nv-cursor-ready select,
html.nv-cursor-ready label{cursor:auto}
`;

export function initCursor() {
  const gsap = window.gsap;
  if (!gsap || !isFinePointer() || prefersReduced()) return null;

  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const dot = el('div', 'nv-cur');
  const halo = el('div', 'nv-halo');
  halo.innerHTML =
    '<svg class="nv-arch" viewBox="0 0 100 60" aria-hidden="true">' +
    '<path d="M 8 46 A 42 42 0 0 1 92 46"/></svg>';
  document.body.append(dot, halo);

  // quickTo gives us a real spring feel without a manual rAF loop.
  const dx = gsap.quickTo(dot, 'x', { duration: MOTION.cursor.dot, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: MOTION.cursor.dot, ease: 'power3' });
  const hx = gsap.quickTo(halo, 'x', { duration: MOTION.cursor.halo, ease: 'power3' });
  const hy = gsap.quickTo(halo, 'y', { duration: MOTION.cursor.halo, ease: 'power3' });

  let shown = false;
  let mode = 'default';
  let target = null;
  let lastX = -1, lastY = -1;   // last pointer position, for scroll-time hit-testing

  const arch = halo.querySelector('.nv-arch');

  function show() {
    if (shown) return;
    shown = true;
    document.documentElement.classList.add('nv-cursor-ready'); // hide native cursor only now
    gsap.to([dot, halo], { opacity: 1, duration: MOTION.dur.fast, overwrite: 'auto' });
  }
  function hide() {
    shown = false;
    document.documentElement.classList.remove('nv-cursor-ready');
    gsap.to([dot, halo], { opacity: 0, duration: MOTION.dur.fast, overwrite: 'auto' });
  }

  // Watchdog: the native cursor is only ever hidden while the custom one is
  // genuinely visible. If any future tween kills the dot's opacity, this
  // restores it within a few pointer events instead of stranding the user
  // with no cursor at all.
  let guardTick = 0;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    lastX = e.clientX; lastY = e.clientY;
    show();
    dx(e.clientX); dy(e.clientY);
    // When wrapping a control the halo parks on the control, not the pointer.
    if (mode !== 'button' && mode !== 'link') { hx(e.clientX); hy(e.clientY); }
    if (++guardTick % 40 === 0 && shown && mode !== 'form') {
      if (Number(gsap.getProperty(dot, 'opacity')) < 0.3 && !gsap.isTweening(dot)) {
        gsap.set([dot, halo], { opacity: 1 });
      }
    }
    // Layout can shift under a parked halo without any scroll event
    // (class toggles, content reveals) — re-measure while wrapping.
    if (guardTick % 6 === 0 && (mode === 'button' || mode === 'link') && target) resync();
  }, { passive: true });

  document.addEventListener('pointerleave', hide);
  window.addEventListener('blur', hide);

  // press confirmation
  window.addEventListener('pointerdown', () => {
    gsap.to(dot, { scale: 0.55, duration: MOTION.dur.instant, ease: MOTION.ease.exit });
  }, { passive: true });
  window.addEventListener('pointerup', () => {
    gsap.to(dot, { scale: 1, duration: MOTION.dur.fast, ease: MOTION.ease.settle });
  }, { passive: true });

  // ---- state machine driven by what is under the pointer ----
  const BTN = 'a.btn, button, [role="button"]';
  const LNK = 'a:not(.btn)';

  function setMode(next, node) {
    if (next === mode && node === target) return;
    const prev = mode;
    mode = next; target = node;

    // Leaving a form field: re-assert full presence no matter which mode
    // comes next (button/link branches return early below).
    if (prev === 'form' && next !== 'form' && shown) {
      gsap.to([dot, halo], { opacity: 1, duration: MOTION.dur.fast, overwrite: 'auto' });
    }

    if (next === 'button' && node) {
      const r = node.getBoundingClientRect();
      gsap.to(halo, {
        width: r.width + 16, height: r.height + 16,
        x: r.left + r.width / 2, y: r.top + r.height / 2,
        margin: 0, xPercent: -50, yPercent: -50,
        borderRadius: 999, borderColor: 'rgba(159,240,206,.55)',
        backgroundColor: 'rgba(159,240,206,.07)',
        duration: MOTION.cursor.morph, ease: MOTION.ease.enter, overwrite: 'auto',
      });
      // the mark forms around the control
      gsap.fromTo(arch, { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: MOTION.dur.fast, ease: MOTION.ease.enter, overwrite: 'auto' });
      gsap.to(dot, { scale: 0.6, duration: MOTION.dur.fast, overwrite: 'auto' });
      return;
    }

    if (next === 'link' && node) {
      const r = node.getBoundingClientRect();
      gsap.to(halo, {
        width: Math.min(r.width, 120), height: 2,
        x: r.left + Math.min(r.width, 120) / 2, y: r.bottom + 3,
        margin: 0, xPercent: -50, yPercent: -50,
        borderRadius: 2, borderColor: 'transparent',
        backgroundColor: 'rgba(159,240,206,.85)',
        duration: MOTION.cursor.morph, ease: MOTION.ease.enter, overwrite: 'auto',
      });
      gsap.to(arch, { opacity: 0, duration: MOTION.dur.fast, overwrite: 'auto' });
      return;
    }

    if (next === 'form') {
      // Native I-beam takes over; the custom cursor steps back to a ghost.
      gsap.to(dot, { opacity: 0.25, scale: 0.7, duration: MOTION.dur.fast, overwrite: 'auto' });
      gsap.to(halo, { opacity: 0, duration: MOTION.dur.fast, overwrite: 'auto' });
      gsap.to(arch, { opacity: 0, duration: MOTION.dur.fast, overwrite: 'auto' });
      if (lastX >= 0) { hx(lastX); hy(lastY); }
      return;
    }
    // default / stage
    const big = next === 'stage';
    gsap.to(halo, {
      width: big ? 64 : 38, height: big ? 64 : 38,
      margin: 0, xPercent: -50, yPercent: -50,
      borderRadius: 999,
      borderColor: big ? 'rgba(159,240,206,.5)' : 'rgba(159,240,206,.38)',
      backgroundColor: big ? 'rgba(159,240,206,.06)' : 'rgba(159,240,206,.04)',
      duration: MOTION.cursor.morph, ease: MOTION.ease.enter, overwrite: 'auto',
    });
    gsap.to(arch, { opacity: 0, duration: MOTION.dur.fast, overwrite: 'auto' });
    gsap.to(dot, { scale: 1, duration: MOTION.dur.fast, overwrite: 'auto' });
    // Releasing a parked halo during scroll: position is normally driven only
    // by pointermove, and pure scrolling produces none — so send the halo
    // home to the pointer explicitly or it floats where the control was.
    if (prev === 'button' || prev === 'link') {
      if (lastX >= 0) { hx(lastX); hy(lastY); }
    }
  }

  function classify(t) {
    if (!(t instanceof Element)) return { kind: 'default', node: null };
    if (t.closest('input, textarea, select, label')) return { kind: 'form', node: null };
    const btn = t.closest(BTN);
    if (btn) return { kind: 'button', node: btn };
    const lnk = t.closest(LNK);
    if (lnk) return { kind: 'link', node: lnk };
    if (t.closest('#stage') || t.closest('summary')) return { kind: 'stage', node: null };
    return { kind: 'default', node: null };
  }

  document.addEventListener('pointerover', (e) => {
    const c = classify(e.target);
    setMode(c.kind, c.node);
  }, { passive: true });

  // Scrolling moves the page under a stationary mouse and the browser fires no
  // hover events for that. Re-hit-test at the pointer's last position so the
  // halo releases a control that slid away and returns to the cursor, or
  // re-parks precisely on the control's new location if it is still under it.
  const resync = () => {
    if (!shown || lastX < 0) return;
    const under = document.elementFromPoint(lastX, lastY);
    const c = under ? classify(under) : { kind: 'default', node: null };
    if (c.kind === mode && c.node === target) {
      // same control, new position — force a re-park
      if ((mode === 'button' || mode === 'link') && target) { const m = mode, n = target; mode = ''; setMode(m, n); }
      return;
    }
    setMode(c.kind, c.node);
  };
  // capture phase: scroll events don't bubble, and this must also catch
  // scrolling inside overflow containers (tables, the transcript, menus)
  document.addEventListener('scroll', resync, { capture: true, passive: true });
  window.addEventListener('resize', resync);

  return { setMode, hide };
}

function el(tag, cls) {
  const n = document.createElement(tag);
  n.className = cls;
  n.setAttribute('aria-hidden', 'true');
  return n;
}
