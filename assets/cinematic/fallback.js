/* The fallback layer: what the visitor sees when the sequence is absent,
   refused, slow or broken, and the owner of every piece of DOM meaning in a
   cinematic stage.
   Contract: docs/cinematic/API-CONTRACT.md section 4.
   Styles:   assets/cinematic/cine-stage.css
   Guards:   scripts/check-cinematic-fallback.mjs, tests/cinematic-fallback.spec.js

   OWNERSHIP. This module is the ONLY thing that sets hidden, aria-hidden,
   data-cine-state or data-cine-keyframes in a stage subtree. It never calls
   fetch, never creates an ImageBitmap, never gets a 2d context, and never
   reads or writes a scroll position. It never applies transform, opacity,
   filter, mask or clip to anything that can contain readable text.

   NO SIDE EFFECTS AT IMPORT TIME. Nothing below touches window or document
   until createFallbackLayer runs, so the contract guard can import this file
   in Node. Every browser dependency arrives through options.

   THE DEFECT CLASS THIS MODULE IS WRITTEN AGAINST
   Reporting success while doing nothing. Three specific instances are refused
   here rather than hoped against:
     - applyReducedMotion() placing zero keyframes and still saying "reduced".
       It counts what it actually inserted, and only writes
       data-cine-keyframes="placed" when the count equals the chapter count.
       Anything less is announced and leaves the poster on screen.
     - a reduced motion decision captured once at load, so a visitor who turns
       the preference on mid page keeps scrubbing. It is recomputed at every
       decision point and watched live.
     - a watchdog that is armed with something that is not a promise and
       therefore never fires, leaving a page waiting forever. That is treated
       as an immediate failure, not as a quiet no-op. */

import { keyframeForChapter } from './manifest.js';

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const STATES = ['poster', 'scrubbing', 'reduced', 'degraded'];

/* site.js stores the visitor's own motion choice here and mirrors it onto the
   root element as .motion-off. Both are read: the class covers the normal case
   where site.js has run, the storage key covers the window before it has. */
const MOTION_KEY = 'nv-motion';
const MOTION_OFF_CLASS = 'motion-off';

/**
 * @param {Element} stageEl        the [data-cine-stage] element
 * @param {object}  sequence       the manifest sequence record
 * @param {object}  variant        the selected variant record
 * @param {object} [options]
 * @param {number} [options.primeTimeoutMs=6000]
 * @param {function} [options.matchMedia]     defaults to the stage's own window
 * @param {function} [options.onDiagnostic]
 * @param {object}  [options.loader]          destroyed on degrade, if given
 * @param {function}[options.onMotionPreferenceChange] called with the new boolean
 * @param {function}[options.setTimeout] @param {function}[options.clearTimeout]
 * @returns {object} FallbackLayer
 */
export function createFallbackLayer(stageEl, sequence, variant, options = {}) {
  if (!stageEl || typeof stageEl.querySelector !== 'function') {
    throw new TypeError('createFallbackLayer: stageEl must be an element');
  }
  if (!variant || !Array.isArray(variant.chapters)) {
    throw new TypeError('createFallbackLayer: variant must carry a chapters array');
  }

  const doc = stageEl.ownerDocument || null;
  const win = (doc && doc.defaultView) || null;
  const emit = typeof options.onDiagnostic === 'function' ? options.onDiagnostic : () => {};
  /* options.loader may be the loader OR a zero argument resolver returning it.
     RECONCILIATION, 2026-08-28. The contract orders createSequenceLoader before
     createFallbackLayer, but its step 3 also forbids creating a loader at all
     under reduced motion, and the reduced motion decision has to come from THIS
     layer rather than from a fourth copy of the rule. Both cannot hold with a
     loader passed by value. index.js therefore builds the layer first and hands
     it `() => entry.loader`, which keeps degrade() the single owner of loader
     teardown. Read at the moment of use, never captured: a value captured here
     would be null forever and degrade() would leave the loader fetching. */
  const loaderOption = options.loader || null;
  const loaderNow = () => {
    if (typeof loaderOption === 'function') {
      try { return loaderOption() || null; } catch { return null; }
    }
    return loaderOption;
  };
  const primeTimeoutMs = Number.isFinite(options.primeTimeoutMs) ? options.primeTimeoutMs : 6000;
  const setT = options.setTimeout || (win && win.setTimeout ? win.setTimeout.bind(win) : null);
  const clearT = options.clearTimeout || (win && win.clearTimeout ? win.clearTimeout.bind(win) : null);
  const matchMedia = options.matchMedia
    || (win && typeof win.matchMedia === 'function' ? win.matchMedia.bind(win) : null);

  const canvas = stageEl.querySelector('canvas[data-cine-canvas]');
  const poster = stageEl.querySelector('img[data-cine-poster]');
  const sticky = stageEl.querySelector('.cine-stage__sticky');

  let state = readState();
  let degraded = state === 'degraded';
  let timer = null;
  let watchdogArmed = false;
  const listeners = [];

  /* ── state ─────────────────────────────────────────────────────────────
     data-cine-state is authored into the served HTML as "poster" so a visitor
     with no JavaScript already has a valid state. If it is missing or is not
     one of the four, that is a defect in the markup and it is announced, not
     silently corrected into looking fine. */
  function readState() {
    const raw = stageEl.getAttribute('data-cine-state');
    if (!raw) {
      emit({ type: 'markup-defect', field: 'data-cine-state', detail: 'absent from the served HTML; a no-JavaScript visitor has no declared state', stage: idOf() });
      return 'poster';
    }
    if (!STATES.includes(raw)) {
      emit({ type: 'markup-defect', field: 'data-cine-state', detail: `served as '${raw}', which is not one of ${STATES.join('|')}`, stage: idOf() });
      return 'poster';
    }
    return raw;
  }

  function idOf() {
    return stageEl.getAttribute('data-cine-stage') || (sequence && sequence.id) || '(unnamed stage)';
  }

  /* degraded is terminal. Anything that tries to move off it is refused out
     loud, because a stage that quietly un-degrades is a stage that shows a
     dead canvas over live copy. */
  function setState(next) {
    if (!STATES.includes(next)) throw new RangeError(`setState: '${next}' is not one of ${STATES.join('|')}`);
    if (degraded && next !== 'degraded') {
      emit({ type: 'state-refused', from: state, to: next, reason: 'degraded is terminal', stage: idOf() });
      return false;
    }
    if (state === next) return true;
    const from = state;
    state = next;
    stageEl.setAttribute('data-cine-state', next);
    emit({ type: 'state', from, to: next, stage: idOf() });
    return true;
  }

  /* ── reduced motion, recomputed every time it is asked ─────────────────
     Three independent sources, matching what the CSS switches on and what
     site.js does. Never a boolean captured at load. */
  function reducedMotionNow() {
    let os = false;
    if (matchMedia) {
      try { os = !!matchMedia(REDUCED_QUERY).matches; } catch { os = false; }
    }
    let classOff = false;
    const root = doc && doc.documentElement;
    if (root && root.classList) classOff = root.classList.contains(MOTION_OFF_CLASS);
    let stored = false;
    try { stored = !!(win && win.localStorage && win.localStorage.getItem(MOTION_KEY) === 'off'); } catch { stored = false; }
    return os || classOff || stored;
  }

  /* Live, not once. The media query is listened to, and the root element's
     class attribute is observed, so the site's own toggle reaches the stage
     without a reload. */
  function watchMotionPreference() {
    let last = reducedMotionNow();
    const announce = () => {
      const now = reducedMotionNow();
      if (now === last) return;
      last = now;
      emit({ type: now ? 'motion-reduced' : 'motion-restored', stage: idOf() });
      if (now) {
        applyReducedMotion();
      } else {
        /* Coming back the other way cannot start a sequence that was never
           built: step 3 of mountCinematic creates no loader under reduced
           motion. Say so rather than implying motion resumed. */
        emit({ type: 'motion-restored-inert', stage: idOf(), detail: 'no sequence was loaded under reduced motion; a reload starts one' });
      }
      if (typeof options.onMotionPreferenceChange === 'function') options.onMotionPreferenceChange(now);
    };

    if (matchMedia) {
      try {
        const q = matchMedia(REDUCED_QUERY);
        if (typeof q.addEventListener === 'function') {
          q.addEventListener('change', announce);
          listeners.push(() => q.removeEventListener('change', announce));
        } else if (typeof q.addListener === 'function') {
          q.addListener(announce);
          listeners.push(() => q.removeListener(announce));
        }
      } catch { /* a matchMedia without change events still works, just not live */ }
    }
    const root = doc && doc.documentElement;
    const MO = win && win.MutationObserver;
    if (root && typeof MO === 'function') {
      const mo = new MO(announce);
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
      listeners.push(() => mo.disconnect());
    }
  }

  /* ── poster ────────────────────────────────────────────────────────────
     The state on first paint, and it costs no JavaScript: the <img> and
     data-cine-state="poster" are in the served HTML, so the largest
     contentful paint never waits on the sequence. Calling this is a check
     that the served markup actually holds, not a step that creates it. */
  function showPoster() {
    if (degraded) { emit({ type: 'poster-after-degrade', stage: idOf() }); return false; }
    if (!poster) {
      emit({ type: 'markup-defect', field: 'img[data-cine-poster]', detail: 'the stage has no poster image, so there is nothing to show when the sequence is unavailable', stage: idOf() });
      return false;
    }
    const src = poster.getAttribute('src');
    if (!src) {
      emit({ type: 'markup-defect', field: 'img[data-cine-poster]', detail: 'the poster image has no src', stage: idOf() });
      return false;
    }
    setState('poster');
    emit({ type: 'poster', src, stage: idOf() });
    return true;
  }

  /* ── reduced motion ────────────────────────────────────────────────────
     Nothing scrubs. Each chapter gets its own static keyframe, placed in that
     chapter's own section, beside its own heading and its own copy. Every
     word, price, capability, Demo block and call to action is left exactly
     where it was, because none of it was ever in the canvas. */
  function applyReducedMotion() {
    if (degraded) { emit({ type: 'reduced-after-degrade', stage: idOf() }); return { placed: 0, expected: 0 }; }
    setState('reduced');

    const expected = variant.chapters.length;
    const missing = [];
    let placed = 0;

    for (const chapter of variant.chapters) {
      let key;
      try {
        key = keyframeForChapter(variant, chapter.id);
      } catch (err) {
        missing.push({ chapter: chapter.id, reason: 'no-keyframe-in-manifest', detail: String(err && err.message) });
        continue;
      }
      const slot = findSlot(chapter.id);
      if (!slot) {
        missing.push({ chapter: chapter.id, reason: 'no-slot-in-markup' });
        continue;
      }
      if (placeKeyframe(slot, key, chapter)) placed += 1;
      else missing.push({ chapter: chapter.id, reason: 'insert-failed' });
    }

    /* The whole point. "placed" is written only when every chapter really has
       an image in the document; the stylesheet hides the static poster band on
       exactly that attribute, so a partial run leaves the poster visible
       instead of leaving a hole where the artwork should be. */
    if (placed === expected && expected > 0) {
      stageEl.setAttribute('data-cine-keyframes', 'placed');
    } else {
      stageEl.setAttribute('data-cine-keyframes', 'partial');
      emit({ type: 'reduced-incomplete', placed, expected, missing, stage: idOf() });
    }
    emit({ type: 'reduced', placed, expected, stage: idOf() });
    return { placed, expected, missing };
  }

  function findSlot(chapterId) {
    const sel = `[data-cine-chapter="${chapterId}"]`;
    return stageEl.querySelector(sel) || (doc ? doc.querySelector(sel) : null);
  }

  /* Idempotent: re running applyReducedMotion (the live preference watcher
     can) must not stack a second image in every slot. */
  function placeKeyframe(slot, key, chapter) {
    if (!doc) return false;
    const existing = slot.querySelector('img[data-cine-keyframe]');
    if (existing) {
      if (existing.getAttribute('src') === key.src) return true;
      existing.setAttribute('src', key.src);
      existing.setAttribute('alt', typeof key.alt === 'string' ? key.alt : '');
      return true;
    }
    const img = doc.createElement('img');
    img.setAttribute('data-cine-keyframe', chapter.id);
    img.setAttribute('src', key.src);
    /* The manifest's alt, verbatim. The keyframe illustrates a chapter whose
       meaning is already fully written in the section around it, so this is
       supplementary, never the only place the information exists. */
    img.setAttribute('alt', typeof key.alt === 'string' ? key.alt : '');
    img.setAttribute('decoding', 'async');
    img.setAttribute('loading', 'lazy');
    if (Number.isInteger(variant.width)) img.setAttribute('width', String(variant.width));
    if (Number.isInteger(variant.height)) img.setAttribute('height', String(variant.height));
    slot.appendChild(img);
    return !!slot.querySelector('img[data-cine-keyframe]');
  }

  /* ── degrade ───────────────────────────────────────────────────────────
     The permanent switch to the static path. Idempotent by contract, so index.js
     and the watchdog can both call it. */
  function degrade(reason) {
    if (degraded) {
      emit({ type: 'degrade-ignored', reason, stage: idOf() });
      return false;
    }
    degraded = true;
    state = 'degraded';
    stageEl.setAttribute('data-cine-state', 'degraded');

    let canvasHidden = false;
    if (canvas) {
      canvas.setAttribute('aria-hidden', 'true');
      canvas.setAttribute('hidden', '');
      canvasHidden = canvas.hasAttribute('hidden');
    }
    if (sticky) sticky.setAttribute('aria-hidden', 'true');

    let loaderDestroyed = false;
    const loader = loaderNow();
    if (loader && typeof loader.destroy === 'function') {
      try { loader.destroy(); loaderDestroyed = true; } catch (err) {
        emit({ type: 'loader-destroy-failed', reason, error: String(err && err.message), stage: idOf() });
      }
    }

    clearWatchdog();

    /* Reported, not assumed. A degrade that could not hide the canvas or could
       not find the poster is a different situation from a clean one, and the
       difference is visible in the diagnostics rather than only on screen. */
    const posterPresent = !!(poster && poster.getAttribute('src'));
    emit({
      type: 'degraded', reason, stage: idOf(),
      canvasHidden, loaderDestroyed, posterPresent,
      hadLoader: !!loader,
    });
    if (!posterPresent) {
      emit({ type: 'markup-defect', field: 'img[data-cine-poster]', detail: 'degraded with no poster to fall back to', stage: idOf() });
    }
    return true;
  }

  function clearWatchdog() {
    if (timer !== null && clearT) clearT(timer);
    timer = null;
  }

  /* ── the watchdog: "never a loader forever", mechanically ──────────────
     prime() resolves even on total failure, so under normal operation this
     timer is cleared. It exists for the cases where it does not resolve at
     all: a hung connection, a loader that threw before wiring its own
     promise, an index.js that passed the wrong thing. */
  function armWatchdog(primePromise) {
    if (degraded) {
      emit({ type: 'watchdog-skipped', reason: 'already degraded', stage: idOf() });
      return Promise.resolve('degraded');
    }
    if (!primePromise || typeof primePromise.then !== 'function') {
      /* Not a promise means nothing will ever settle this. Degrading now is
         the only outcome that cannot leave the page waiting. */
      emit({ type: 'watchdog-bad-argument', got: typeof primePromise, stage: idOf() });
      degrade('prime-not-a-promise');
      return Promise.resolve('bad-argument');
    }
    if (watchdogArmed) {
      emit({ type: 'watchdog-rearmed', stage: idOf() });
      clearWatchdog();
    }
    watchdogArmed = true;

    if (!setT) {
      /* No timer function at all: say so instead of pretending the page is
         protected. */
      emit({ type: 'watchdog-unavailable', detail: 'no setTimeout was available, so a hung prime cannot be caught', stage: idOf() });
    } else {
      timer = setT(() => {
        timer = null;
        emit({ type: 'watchdog-fired', afterMs: primeTimeoutMs, stage: idOf() });
        degrade('prime-timeout');
      }, primeTimeoutMs);
    }

    return primePromise.then(
      (result) => {
        clearWatchdog();
        if (result && result.ok === false) {
          emit({ type: 'prime-failed', result, stage: idOf() });
          degrade('prime-failed');
          return 'prime-failed';
        }
        emit({ type: 'prime-settled', result, stage: idOf() });
        return 'prime-settled';
      },
      (err) => {
        clearWatchdog();
        emit({ type: 'prime-rejected', error: String(err && err.message ? err.message : err), stage: idOf() });
        degrade('prime-rejected');
        return 'prime-rejected';
      },
    );
  }

  function destroy() {
    clearWatchdog();
    while (listeners.length) {
      const off = listeners.pop();
      try { off(); } catch { /* removing a listener twice is not a failure */ }
    }
  }

  watchMotionPreference();

  return {
    showPoster,
    applyReducedMotion,
    degrade,
    armWatchdog,
    destroy,
    isDegraded: () => degraded,
    /* Exposed so index.js can make step 3's decision with the same live
       computation the CSS switches on, instead of a fourth copy of it. */
    prefersReducedMotion: () => reducedMotionNow(),
    get state() { return state; },
    get elements() { return { canvas, poster, sticky }; },
  };
}
