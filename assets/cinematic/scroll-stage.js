/* The cinematic scroll stage: which frame index the visitor is on, and painting it.
   Contract: docs/cinematic/API-CONTRACT.md section 3. Guard: npm run cine:check.

   OWNERSHIP. This module touches the <canvas> and nothing else. It does not
   fetch, it does not decode, it does not build a URL, it does not set hidden /
   aria-hidden / data-cine-state, and it does not write a single style, class or
   attribute anywhere in the page. Everything it needs about layout it READS.
   tests/cinematic-stage.spec.js proves that with a MutationObserver over the
   whole stage subtree rather than by grepping this file.

   WHAT MAKES THE FAILURE MODES LOUD INSTEAD OF SILENT

   1. A canvas measured while display:none reports a 0x0 box. Sizing a backing
      store from it leaves the browser default 300x150 and the page then draws
      at a ninth of its resolution with nothing in the console. That already
      shipped in this repository. So: a zero box is NEVER sized, it emits
      { type:'measure-deferred', reason:'zero-box' }, paintedIndex stays null,
      and the stage retries on the next resize, resize-observation or
      intersection. `paintedIndex` is set only after a real drawImage into a
      store that was sized from a real box, never optimistically.

   2. Exactly one animation callback can be outstanding, because `tickPending`
      is a single boolean and `requestTick()` is the ONLY call site of
      requestFrame in this file. Two concurrent loops would need two concurrent
      `tickPending === true`, which is not reachable. Calling start() twice,
      resuming twice, or a resize during a pending tick all collapse to one.

   3. The tick does not reschedule itself. It is requested by scroll, resize and
      visibility, and by nothing else, so a visitor who is not scrolling costs
      zero animation work. The single exception is bounded: when the frame the
      visitor is on is not resident yet, the stage re-requests for at most
      FRAME_WAIT_MS and then goes idle holding the last good frame. The loader
      has no "frame arrived" callback in the contract, so a bounded wait is the
      only way to pick a late frame up, and an unbounded one would be a
      permanent 60fps poll.

   4. Nothing here re-derives the mapping. `frameIndexForProgress` from
      manifest.js is the single definition, so scrolling up retraces exactly the
      integers scrolling down produced. No easing, no hysteresis, no smoothing,
      and therefore no state that has to unwind when the direction reverses.

   5. Geometry is read live on every tick, never cached. That is what makes the
      iOS URL-bar collapse a non-event: when the viewport height changes
      mid-scroll, the very next tick computes progress from the new height
      instead of from a stale one. The stage CSS expresses its length in dvh so
      the numerator tracks the same viewport the denominator does.

   NO SCROLL HIJACKING. One passive scroll listener that records nothing but the
   need to re-derive. No wheel handler, no touchmove handler, no preventDefault,
   no snapping, no scrollTo/scrollBy/scrollIntoView, no smooth-scroll library. */

import { frameIndexForProgress, FIT } from './manifest.js';

/** Backing store never exceeds this multiple of the CSS box, whatever the device claims. */
const DEFAULT_MAX_DPR = 2;

/** How long the stage keeps asking for a frame that is not resident yet, before
 *  going idle on the last good one. Bounded on purpose: see note 3 above. */
const FRAME_WAIT_MS = 1200;

/** A stage shorter than this fraction of its declared scroll length is reported
 *  once. It is how "the stage CSS did not load" surfaces as a diagnostic rather
 *  than as a mapping that quietly compresses the whole sequence into a flick.
 *  One sided: content longer than declared is legitimate. */
const MIN_STAGE_LENGTH_RATIO = 0.6;

const isPositiveInt = (v) => Number.isInteger(v) && v > 0;

/**
 * @param {HTMLElement} stageEl   the .cine-stage element from the served HTML
 * @param {object} sequence       the manifest sequence record
 * @param {object} variant        the manifest variant record (desktop or mobile)
 * @param {object} loader         a SequenceLoader (see API-CONTRACT section 2)
 * @param {object} [options]
 * @returns {{start:Function,stop:Function,destroy:Function,measure:Function,
 *            progress:number,frameIndex:number,paintedIndex:number|null,running:boolean}}
 */
export function createScrollStage(stageEl, sequence, variant, loader, options = {}) {
  /* ── arguments, checked loudly at creation ──────────────────────────────
     Every one of these is a wiring mistake that would otherwise produce a
     stage that runs, reports success, and paints the wrong thing or nothing. */
  if (!stageEl || typeof stageEl.getBoundingClientRect !== 'function') {
    throw new TypeError('createScrollStage: stageEl is not an element');
  }
  const doc = stageEl.ownerDocument;
  const win = doc && doc.defaultView;
  if (!doc || !win) {
    throw new TypeError('createScrollStage: stageEl is not inside a document with a window; the stage takes its window from the element so it can be driven by a fake document in a test');
  }
  if (!sequence || typeof sequence.id !== 'string') {
    throw new TypeError('createScrollStage: sequence has no id');
  }
  if (!sequence.stage || sequence.stage.fit !== FIT) {
    throw new TypeError(`createScrollStage: sequence '${sequence.id}' declares fit ${JSON.stringify(sequence.stage && sequence.stage.fit)}; only '${FIT}' is implemented and the guards' sample point maths assumes it`);
  }
  const declaredStageId = stageEl.getAttribute('data-cine-stage');
  if (declaredStageId !== sequence.id) {
    throw new Error(`createScrollStage: the element carries data-cine-stage="${declaredStageId}" but was handed the '${sequence.id}' sequence. Painting one sequence into another stage's canvas looks entirely healthy from the outside.`);
  }
  if (!variant || !isPositiveInt(variant.width) || !isPositiveInt(variant.height)) {
    throw new TypeError(`createScrollStage: '${sequence.id}' variant has no usable width/height`);
  }
  if (!isPositiveInt(variant.frameCount) || variant.frameCount < 2) {
    throw new TypeError(`createScrollStage: '${sequence.id}' variant frameCount is ${variant.frameCount}`);
  }
  for (const method of ['get', 'setFocus', 'pause', 'resume']) {
    if (!loader || typeof loader[method] !== 'function') {
      throw new TypeError(`createScrollStage: the loader for '${sequence.id}' has no ${method}(). A stage that silently tolerates a half built loader paints a poster forever and calls it success.`);
    }
  }

  const canvas = options.canvas || stageEl.querySelector('canvas[data-cine-canvas]');
  if (!canvas || typeof canvas.getContext !== 'function') {
    throw new Error(`createScrollStage: '${sequence.id}' has no <canvas data-cine-canvas> to paint into`);
  }
  if (typeof stageEl.contains === 'function' && !stageEl.contains(canvas)) {
    throw new Error(`createScrollStage: the canvas handed to '${sequence.id}' is not inside its own stage element`);
  }

  const requestFrame = options.requestFrame
    || (typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame.bind(win) : null);
  const cancelFrame = options.cancelFrame
    || (typeof win.cancelAnimationFrame === 'function' ? win.cancelAnimationFrame.bind(win) : null);
  if (!requestFrame || !cancelFrame) {
    throw new TypeError('createScrollStage: no requestAnimationFrame/cancelAnimationFrame available and none supplied');
  }
  const maxDpr = Number.isFinite(options.maxDpr) && options.maxDpr > 0 ? options.maxDpr : DEFAULT_MAX_DPR;
  const onDiagnostic = typeof options.onDiagnostic === 'function' ? options.onDiagnostic : null;
  const onFatal = typeof options.onFatal === 'function' ? options.onFatal : null;

  /* ── state ─────────────────────────────────────────────────────────────── */
  let running = false;
  let destroyed = false;
  let listening = false;
  let tickPending = false;      // THE single-loop invariant. See note 2.
  let rafHandle = null;
  let ctx = null;
  let sizedOnce = false;        // a real box has been measured and the store sized from it
  let progress = 0;
  let frameIndex = 0;
  let paintedIndex = null;      // set ONLY by paint(), cleared by every resize
  let hiddenPaused = false;
  let fatalSent = false;
  let zeroBoxReported = false;
  let noRangeReported = false;
  let shortStageReported = false;
  let waitingFor = null;
  let waitingSince = 0;
  let waitReported = false;
  let observers = [];

  const now = () => (win.performance && typeof win.performance.now === 'function' ? win.performance.now() : Date.now());

  /* A throwing diagnostic sink is the caller's bug, not a stage failure, so it
     is swallowed here rather than routed into onFatal and stopping the loop. */
  function emit(event) {
    if (!onDiagnostic) return;
    try { onDiagnostic(event); } catch { /* the sink's problem, not the stage's */ }
  }

  /* The canvas is decoration. This module must not set the attributes that say
     so (fallback.js owns them), so it reports when the served HTML omitted
     them. Silence here would mean shipping a canvas that a screen reader walks
     into. */
  {
    const role = canvas.getAttribute('role');
    const ariaHidden = canvas.getAttribute('aria-hidden');
    if (role !== 'presentation' || ariaHidden !== 'true') {
      emit({
        type: 'aria-missing',
        sequenceId: sequence.id,
        role,
        ariaHidden,
        detail: 'the canvas must carry role="presentation" and aria-hidden="true" in the served HTML; the stage does not set them because fallback.js owns that subtree',
      });
    }
  }

  /* ── scheduling ────────────────────────────────────────────────────────── */

  function requestTick() {
    if (!running || destroyed || tickPending) return;
    if (doc.hidden) return;     // no animation work is scheduled while hidden at all
    tickPending = true;
    rafHandle = requestFrame(tick);
  }

  function cancelTick() {
    if (tickPending) {
      try { cancelFrame(rafHandle); } catch { /* a fake cancelFrame in a test may not care */ }
    }
    tickPending = false;
    rafHandle = null;
  }

  /* ── measurement ───────────────────────────────────────────────────────── */

  /**
   * Size the backing store from the canvas's own CSS box. Read only unless the
   * required size actually changed, so calling it every tick is cheap.
   * @returns {boolean} whether the canvas is usable for painting
   */
  function measure() {
    if (destroyed) return false;
    const r = canvas.getBoundingClientRect();
    const cssWidth = r.width;
    const cssHeight = r.height;

    if (!(cssWidth >= 1) || !(cssHeight >= 1)) {
      /* DO NOT touch canvas.width/height here. Assigning a size derived from a
         zero box is how the 300x150 default survives while everything reports
         success. */
      if (!zeroBoxReported) {
        zeroBoxReported = true;
        emit({ type: 'measure-deferred', reason: 'zero-box', sequenceId: sequence.id, cssWidth, cssHeight });
      }
      return false;   // not paintable, whether or not it once was
    }
    zeroBoxReported = false;

    const rawDpr = win.devicePixelRatio;
    const dpr = Math.min(maxDpr, Number.isFinite(rawDpr) && rawDpr > 0 ? rawDpr : 1);
    const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
    const backingHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (!sizedOnce || canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;     // assigning either dimension clears the bitmap
      canvas.height = backingHeight;
      paintedIndex = null;             // whatever was on it is gone; it must be repainted
      ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(`createScrollStage: '${sequence.id}' canvas has no 2d context`);
      sizedOnce = true;
      emit({ type: 'sized', sequenceId: sequence.id, cssWidth, cssHeight, dpr, backingWidth, backingHeight });
    }
    return true;
  }

  /**
   * Progress from live geometry. Never cached, so a viewport height that
   * changes mid-scroll (the iOS URL bar) is absorbed on the very next tick.
   * The arithmetic is the contract's, verbatim:
   *   progress = clamp((scrollY - stageTop) / (stageHeight - viewportHeight), 0, 1)
   */
  function readProgress() {
    const r = stageEl.getBoundingClientRect();
    const scrollY = win.scrollY;
    const viewport = win.innerHeight;
    const stageTop = r.top + scrollY;
    const range = r.height - viewport;

    /* The length check runs BEFORE the range check, because it is the one that
       explains the other: a stage with no scroll range is almost always a stage
       whose stylesheet did not load, and reporting only "no range" would send
       the reader looking at the manifest instead of at the CSS. */
    if (!shortStageReported && Number.isFinite(sequence.stage.scrollLengthVh) && viewport > 0) {
      const declared = (sequence.stage.scrollLengthVh / 100) * viewport;
      if (r.height < declared * MIN_STAGE_LENGTH_RATIO) {
        shortStageReported = true;
        emit({
          type: 'stage-length-short',
          sequenceId: sequence.id,
          declaredVh: sequence.stage.scrollLengthVh,
          actualVh: Math.round((r.height / viewport) * 100),
          detail: 'the rendered stage is far shorter than the manifest declares, which is what a missing stage stylesheet looks like from in here',
        });
      }
    }

    if (!(range > 0)) {
      if (!noRangeReported) {
        noRangeReported = true;
        emit({
          type: 'no-scroll-range',
          sequenceId: sequence.id,
          stageHeight: r.height,
          viewport,
          detail: 'the stage is not taller than the viewport, so it has no scroll range to map. Check that the stage stylesheet loaded.',
        });
      }
      return 0;
    }
    noRangeReported = false;

    const p = (scrollY - stageTop) / range;
    return Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  }

  /* ── painting ──────────────────────────────────────────────────────────── */

  /** Centred cover, and only centred cover. coverSamplePoints() in the guards
   *  recomputes this independently, so a different fit fails a test. */
  function paint(image, index) {
    const cw = canvas.width;
    const ch = canvas.height;
    const sw = variant.width;
    const sh = variant.height;
    const scale = Math.max(cw / sw, ch / sh);
    const dw = sw * scale;
    const dh = sh * scale;
    ctx.drawImage(image, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    paintedIndex = index;
    emit({ type: 'painted', sequenceId: sequence.id, index, backingWidth: cw, backingHeight: ch });
  }

  /* ── the tick ──────────────────────────────────────────────────────────── */

  function tick() {
    tickPending = false;
    rafHandle = null;
    if (!running || destroyed) return;
    try {
      const usable = measure();            // may resize, which clears paintedIndex
      progress = readProgress();
      frameIndex = frameIndexForProgress(progress, variant.frameCount);
      loader.setFocus(frameIndex);

      if (!usable) return;                 // measure-deferred was emitted; retry on resize
      if (paintedIndex === frameIndex) {   // nothing changed: no redraw, and go idle
        waitingFor = null;
        return;
      }

      const image = loader.get(frameIndex);
      if (!image) {
        /* Keep the last good frame. Never clear, never flash blank. */
        emit({ type: 'skipped', reason: 'no-frame', sequenceId: sequence.id, index: frameIndex });
        if (waitingFor !== frameIndex) {
          waitingFor = frameIndex;
          waitingSince = now();
          waitReported = false;
        }
        if (now() - waitingSince < FRAME_WAIT_MS) {
          requestTick();                   // bounded: see note 3 in the header
        } else if (!waitReported) {
          waitReported = true;
          emit({ type: 'wait-timeout', sequenceId: sequence.id, index: frameIndex, ms: FRAME_WAIT_MS });
        }
        return;
      }
      waitingFor = null;
      paint(image, frameIndex);
    } catch (err) {
      fatal(err);
    }
  }

  function fatal(err) {
    const error = err instanceof Error ? err : new Error(String(err));
    emit({ type: 'error', sequenceId: sequence.id, error });
    running = false;
    cancelTick();
    detach();
    if (!fatalSent) {
      fatalSent = true;
      if (onFatal) {
        try { onFatal(error); } catch { /* the caller's handler is not the stage's problem */ }
      }
    }
  }

  /* ── listeners. One passive scroll listener, and nothing that touches the
        visitor's scroll. ───────────────────────────────────────────────────── */

  const onScroll = () => requestTick();
  const onResize = () => requestTick();

  function onVisibility() {
    try {
      if (doc.hidden) {
        cancelTick();                  // all rendering work stops
        if (!hiddenPaused) {
          hiddenPaused = true;
          loader.pause();              // all loading work stops
          emit({ type: 'paused', sequenceId: sequence.id });
        }
        return;
      }
      if (!hiddenPaused) {
        /* Nothing to undo, but still ask for a frame. Returning here instead
           would be the one path that can strand a stage: nothing scheduled and
           nothing left to schedule it. */
        requestTick();
        return;
      }
      hiddenPaused = false;
      loader.resume();
      emit({ type: 'resumed', sequenceId: sequence.id });
      measure();                       // one measure
      requestTick();                   // and exactly one frame: no catch up, no jump
    } catch (err) {
      fatal(err);
    }
  }

  function attach() {
    if (listening) return;
    listening = true;
    win.addEventListener('scroll', onScroll, { passive: true });
    win.addEventListener('resize', onResize, { passive: true });
    win.addEventListener('orientationchange', onResize, { passive: true });
    doc.addEventListener('visibilitychange', onVisibility);
    const vv = win.visualViewport;
    if (vv && typeof vv.addEventListener === 'function') {
      /* The iOS URL bar changes innerHeight without always firing window resize. */
      vv.addEventListener('resize', onResize, { passive: true });
      vv.addEventListener('scroll', onScroll, { passive: true });
    }
    if (typeof win.ResizeObserver === 'function') {
      /* This is what un-defers a canvas that was measured while display:none:
         the box going 0x0 -> WxH is a resize observation. */
      const ro = new win.ResizeObserver(() => requestTick());
      ro.observe(canvas);
      ro.observe(stageEl);
      observers.push(ro);
    }
    if (typeof win.IntersectionObserver === 'function') {
      const io = new win.IntersectionObserver(() => requestTick(), { threshold: 0 });
      io.observe(stageEl);
      observers.push(io);
    }
  }

  function detach() {
    if (!listening) return;
    listening = false;
    win.removeEventListener('scroll', onScroll);
    win.removeEventListener('resize', onResize);
    win.removeEventListener('orientationchange', onResize);
    doc.removeEventListener('visibilitychange', onVisibility);
    const vv = win.visualViewport;
    if (vv && typeof vv.removeEventListener === 'function') {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onScroll);
    }
    for (const o of observers) {
      try { o.disconnect(); } catch { /* already gone */ }
    }
    observers = [];
  }

  /* ── public surface ────────────────────────────────────────────────────── */

  return Object.freeze({
    start() {
      if (destroyed) throw new Error(`createScrollStage: '${sequence.id}' start() after destroy()`);
      if (running) return;             // idempotent: a second start is a no-op
      running = true;
      attach();
      if (doc.hidden) {
        /* Mounting in a background tab (a prerender, a link opened behind the
           current one) is the PAUSED state, not a broken one. Without this the
           stage would schedule nothing now, and the later visibilitychange
           would find nothing to resume: a poster that never becomes a sequence,
           with no error anywhere. */
        hiddenPaused = true;
        loader.pause();
        emit({ type: 'paused', sequenceId: sequence.id, reason: 'started-hidden' });
        return;
      }
      requestTick();
    },
    stop() {
      if (!running) return;
      running = false;
      cancelTick();
      detach();
    },
    destroy() {
      if (destroyed) return;
      running = false;
      cancelTick();
      detach();
      destroyed = true;
      ctx = null;
    },
    measure() {
      const usable = measure();
      if (usable) requestTick();
      return undefined;
    },
    get progress() { return progress; },
    get frameIndex() { return frameIndex; },
    get paintedIndex() { return paintedIndex; },
    get running() { return running; },
  });
}
