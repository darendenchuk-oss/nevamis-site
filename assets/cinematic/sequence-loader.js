/* The cinematic frame loader: bytes in, decoded frames out, and nothing else.
   Contract: docs/cinematic/API-CONTRACT.md section 2
   Loading policy and the numbers behind it: docs/cinematic/LOADING.md
   Guard: scripts/check-cinematic-loader.mjs (npm run cine:loader)

   OWNERSHIP. This module owns WHEN bytes are fetched and WHICH decoded frames
   are resident. It never touches the DOM, the canvas, or scroll. It is the only
   module that calls fetch or creates an ImageBitmap. It builds no URL of its
   own: every URL comes from frameUrl() in manifest.js.

   THE THREE THINGS THAT MUST NOT BE ABLE TO FAIL SILENTLY
   1. It is INERT until prime() is called. Constructing a loader, and calling
      setFocus() a thousand times, issues zero network requests. That is the
      mechanism behind "a sequence offscreen makes no requests": the caller
      calls prime() when the stage approaches the viewport, and until then there
      is no code path here that can fetch. Not a policy, an absence.
   2. Two fetches for the same frame cannot overlap. startFetch() THROWS if an
      index is already loading, so a duplicated scheduling loop announces itself
      instead of quietly doubling the bytes.
   3. Nothing here rejects into the stage. A failed frame raises stats.failed,
      emits frame-failed, and leaves the previously decoded frame standing.
      prime() resolves even when every byte of it failed.

   Browser ES module, no side effects at import time: every browser dependency
   (fetch, the decoder, AbortController) is read at call time or injected, so
   the whole module unit tests in Node. */
import { frameUrl } from './manifest.js';

/** Default request ceiling. Six matches a browser's per-origin HTTP/1.1 limit,
    so a seventh would queue in the socket pool where we can no longer abort it. */
export const DEFAULT_MAX_CONCURRENT = 6;

/* Residency budget arithmetic, kept here so the one place it is decided is the
   one place it is documented.

   decodeWindow is a HARD cap on decoded frames held at once. The window is not
   the whole budget, because the stride[0] skeleton (frame 0, every stride[0]-th
   frame, and the final frame) has to survive a jump to anywhere in the
   sequence: that is what makes a scrubber usable before the sequence is fully
   loaded. So the budget splits:

     reserve      = min(anchorCount, floor(decodeWindow / 3))   skeleton's share
     windowRadius = max(1, floor((decodeWindow - reserve - 1) / 2))

   For the placeholder desktop sequence (96 frames, strides [16,4,1],
   decodeWindow 24): 7 anchors, reserve 7, radius 8, so a 17 frame rolling
   window plus 7 anchors is 24 decoded frames at the very most. Never 96. */
export function residencyBudget(frameCount, stride0, decodeWindow) {
  const anchorCount = anchorIndices(frameCount, stride0).size;
  const reserve = Math.min(anchorCount, Math.floor(decodeWindow / 3));
  const windowRadius = Math.max(1, Math.floor((decodeWindow - reserve - 1) / 2));
  return { anchorCount, reserve, windowRadius, windowSpan: windowRadius * 2 + 1 };
}

/** The coarse skeleton: index 0, every stride-th frame, and always the last
    frame, so scroll progress 1 has an anchor as well as progress 0. */
export function anchorIndices(frameCount, stride) {
  const out = new Set();
  for (let i = 0; i < frameCount; i += stride) out.add(i);
  out.add(frameCount - 1);
  return out;
}

const STATE_LOADING = 'loading';
const STATE_READY = 'ready';
const STATE_FAILED = 'failed';

/* Two evictions of the same index are enough to conclude the budget cannot hold
   it; a third fetch of it would be churn, not progress. Only applies outside the
   rolling window, so the frame the visitor is actually on is never given up on. */
const MAX_EVICTIONS_BEFORE_SKIP = 2;

const now = () => (typeof performance === 'object' && performance && typeof performance.now === 'function'
  ? performance.now()
  : Date.now());

const isAbortError = (err) => !!err && (err.name === 'AbortError' || err.code === 20 || err.__aborted === true);

/**
 * Decode a blob off the main thread where the platform allows it.
 *
 * createImageBitmap decodes on a worker thread and yields an object the canvas
 * can draw without a further decode. Where it is missing, an HTMLImageElement
 * plus await img.decode() gets the same "decoded before it is drawn" guarantee;
 * what it does not get is off-thread decoding, which is a performance loss and
 * not a correctness one.
 */
async function defaultDecoder(blob) {
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob);
  if (typeof Image !== 'function' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('no image decoder is available: neither createImageBitmap nor HTMLImageElement');
  }
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } finally {
    URL.revokeObjectURL(url);
  }
  return img;
}

function closeImage(image) {
  if (image && typeof image.close === 'function') image.close();
}

function normaliseStrides(strides, frameCount) {
  if (!Array.isArray(strides) || strides.length === 0) {
    throw new TypeError(`sequence-loader: strides must be a non empty array, got ${JSON.stringify(strides)}`);
  }
  for (let i = 0; i < strides.length; i += 1) {
    if (!Number.isInteger(strides[i]) || strides[i] < 1) {
      throw new TypeError(`sequence-loader: stride ${JSON.stringify(strides[i])} is not a positive integer`);
    }
    if (i > 0 && strides[i] >= strides[i - 1]) {
      throw new TypeError(`sequence-loader: strides must strictly decrease, got ${JSON.stringify(strides)}`);
    }
  }
  if (strides[strides.length - 1] !== 1) {
    throw new TypeError(`sequence-loader: strides must end at 1 or the sequence can never complete, got ${JSON.stringify(strides)}`);
  }
  if (strides[0] >= frameCount) {
    throw new TypeError(`sequence-loader: stride ${strides[0]} is not coarser than the ${frameCount} frame sequence`);
  }
  return strides.slice();
}

/**
 * @param {object} variant a validated manifest variant
 * @param {object} [options]
 * @returns {object} SequenceLoader
 */
export function createSequenceLoader(variant, options = {}) {
  if (!variant || typeof variant !== 'object') {
    throw new TypeError('sequence-loader: variant is required; it comes from selectVariant()');
  }
  const frameCount = variant.frameCount;
  if (!Number.isInteger(frameCount) || frameCount < 2) {
    throw new TypeError(`sequence-loader: variant.frameCount is ${JSON.stringify(frameCount)}`);
  }
  if (!Array.isArray(variant.frames) || variant.frames.length !== frameCount) {
    throw new TypeError(`sequence-loader: variant lists ${variant.frames ? variant.frames.length : 0} urls for ${frameCount} frames; the manifest is the only source of urls`);
  }

  const strides = normaliseStrides(options.strides || variant.strides, frameCount);
  const decodeWindow = options.decodeWindow != null ? options.decodeWindow : variant.decodeWindow;
  if (!Number.isInteger(decodeWindow) || decodeWindow < 2) {
    throw new TypeError(`sequence-loader: decodeWindow is ${JSON.stringify(decodeWindow)}; a rolling window of at least 2 is required`);
  }
  if (decodeWindow >= frameCount && frameCount > 32) {
    throw new TypeError(`sequence-loader: decodeWindow ${decodeWindow} would hold the whole ${frameCount} frame sequence in memory`);
  }
  const maxConcurrent = options.maxConcurrent != null ? options.maxConcurrent : DEFAULT_MAX_CONCURRENT;
  if (!Number.isInteger(maxConcurrent) || maxConcurrent < 1) {
    throw new TypeError(`sequence-loader: maxConcurrent is ${JSON.stringify(maxConcurrent)}`);
  }
  const fetchImpl = options.fetchImpl
    || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('sequence-loader: fetch is unavailable and no fetchImpl was passed');
  }
  const decodeImage = options.decodeImage || defaultDecoder;
  const onDiagnostic = typeof options.onDiagnostic === 'function' ? options.onDiagnostic : null;
  const AbortCtor = options.AbortControllerImpl
    || (typeof AbortController === 'function' ? AbortController : null);

  const anchors = anchorIndices(frameCount, strides[0]);
  const { reserve, windowRadius } = residencyBudget(frameCount, strides[0], decodeWindow);

  /** index -> 'loading' | 'ready' | 'failed'. An absent entry means "fetchable".
      An aborted fetch DELETES its entry: fast scrolling must not permanently
      blacklist every frame it scrolled past. */
  const state = new Map();
  /** index -> { image, bytes }. Exactly the decoded frames in memory. */
  const resident = new Map();
  /** index -> { controller, generation } for requests currently in flight. */
  const inFlight = new Map();
  /** index -> how many times this frame has been decoded then evicted. */
  const evictions = new Map();
  /** `${generation}:${stride}` for refinement passes already reported. */
  const passesEmitted = new Set();

  let focus = 0;
  let generation = 0;
  let paused = false;
  let destroyed = false;
  let primeActive = false;
  let primeSettled = false;
  let primePromise = null;
  let resolvePrime = null;
  let anchorPassEmitted = false;

  let bytes = 0;
  let failedCount = 0;
  let requested = 0;
  let evictedTotal = 0;
  let abortedTotal = 0;
  let diagnosticErrors = 0;
  let pumps = 0;
  const primeStats = { requested: 0, failed: 0, ready: 0 };

  /* A diagnostics consumer that throws must not be able to break loading, and
     must not be able to do it invisibly either: the swallowed count is in stats. */
  function emit(event) {
    if (!onDiagnostic) return;
    try {
      onDiagnostic(event);
    } catch {
      diagnosticErrors += 1;
    }
  }

  const settled = (index) => {
    const s = state.get(index);
    return s === STATE_READY || s === STATE_FAILED;
  };

  function bounds() {
    const lo = Math.max(0, focus - windowRadius);
    const hi = Math.min(frameCount - 1, focus + windowRadius);
    return { lo, hi };
  }

  /* The next frame worth fetching, or -1.
     Priority: the global skeleton first (so any scroll position has something
     within strides[0] of it), then each refinement stride inside the rolling
     window, coarse to fine, nearest to the visitor first. */
  function nextTarget() {
    const { lo, hi } = bounds();
    let best = -1;
    let bestDistance = Infinity;

    for (const a of anchors) {
      if (state.has(a)) continue;
      if ((evictions.get(a) || 0) >= MAX_EVICTIONS_BEFORE_SKIP && (a < lo || a > hi)) continue;
      const d = Math.abs(a - focus);
      if (d < bestDistance) { bestDistance = d; best = a; }
    }
    if (best >= 0) return best;

    for (let si = 1; si < strides.length; si += 1) {
      const s = strides[si];
      best = -1;
      bestDistance = Infinity;
      for (let i = lo; i <= hi; i += 1) {
        if (i !== focus && i % s !== 0) continue;
        if (state.has(i)) continue;
        if ((evictions.get(i) || 0) >= MAX_EVICTIONS_BEFORE_SKIP) continue;
        const d = Math.abs(i - focus);
        if (d < bestDistance) { bestDistance = d; best = i; }
      }
      if (best >= 0) return best;
    }
    return -1;
  }

  /* Top up to maxConcurrent. Deliberately NOT a long lived loop: there is no
     interval, no recursion and no awaited while(), so "resume() started a second
     scheduling loop" is not a state this module can reach. Every entry point
     calls pump(); pump() starts requests only for indices not already loading,
     and startFetch() throws if that invariant is ever broken. */
  function pump() {
    if (!primeActive || paused || destroyed) return;
    pumps += 1;
    while (inFlight.size < maxConcurrent) {
      const index = nextTarget();
      if (index < 0) break;
      startFetch(index);
    }
  }

  function startFetch(index) {
    if (state.get(index) === STATE_LOADING) {
      throw new Error(`sequence-loader: overlapping fetch for frame ${index}. Two scheduling loops are running; that doubles the bytes and is exactly the failure this throw exists to make loud.`);
    }
    const controller = AbortCtor ? new AbortCtor() : null;
    const gen = generation;
    const startedAt = now();
    state.set(index, STATE_LOADING);
    inFlight.set(index, { controller, generation: gen });
    requested += 1;
    if (primeActive && !primeSettled && anchors.has(index)) primeStats.requested += 1;

    const url = frameUrl(variant, index);
    const request = (async () => {
      const res = await fetchImpl(url, {
        signal: controller ? controller.signal : undefined,
        cache: 'force-cache',
      });
      if (!res || !res.ok) {
        const err = new Error(`${url} returned ${res ? res.status : 'no response'}`);
        err.status = res ? res.status : undefined;
        throw err;
      }
      const blob = await res.blob();
      const image = await decodeImage(blob);
      return { image, bytes: (blob && blob.size) || 0 };
    })();

    request.then(
      (payload) => onSettled(index, payload, null, startedAt),
      (err) => onSettled(index, null, err, startedAt),
    );
  }

  function onSettled(index, payload, err, startedAt) {
    inFlight.delete(index);
    if (destroyed) { if (payload) closeImage(payload.image); return; }

    if (err) {
      if (isAbortError(err)) {
        /* Aborted, not failed. The frame goes back to fetchable and is not
           counted against the sequence; a visitor who scrolls fast past a frame
           must still be able to get it when they scroll back. */
        state.delete(index);
      } else {
        state.set(index, STATE_FAILED);
        failedCount += 1;
        if (primeActive && !primeSettled && anchors.has(index)) primeStats.failed += 1;
        emit({ type: 'frame-failed', index, status: err.status, error: String((err && err.message) || err) });
      }
    } else {
      state.set(index, STATE_READY);
      resident.set(index, payload);
      bytes += payload.bytes;
      if (primeActive && !primeSettled && anchors.has(index)) primeStats.ready += 1;
      emit({ type: 'frame-loaded', index, bytes: payload.bytes, ms: Math.round(now() - startedAt) });
      enforceWindow();
    }

    checkPasses();
    maybeSettlePrime();
    pump();
  }

  /* Evict decoded frames down to the hard cap. Order: outside the rolling window
     and not an anchor, then inside the window and not an anchor, then anchors,
     farthest from the visitor first within each class. The frame the visitor is
     on is never evicted. Every evicted ImageBitmap is close()d, because dropping
     the reference alone leaves the decoded pixels alive until GC decides. */
  function enforceWindow() {
    if (resident.size <= decodeWindow) return;
    const { lo, hi } = bounds();
    const rank = (i) => {
      const outside = i < lo || i > hi;
      const cls = anchors.has(i) ? 0 : (outside ? 2000000 : 1000000);
      return cls + Math.abs(i - focus);
    };
    const victims = [...resident.keys()].filter((i) => i !== focus).sort((a, b) => rank(b) - rank(a));
    let count = 0;
    while (resident.size > decodeWindow && victims.length) {
      const i = victims.shift();
      const rec = resident.get(i);
      resident.delete(i);
      state.delete(i);
      evictions.set(i, (evictions.get(i) || 0) + 1);
      closeImage(rec.image);
      count += 1;
    }
    if (count) {
      evictedTotal += count;
      emit({ type: 'window-evicted', count, resident: resident.size });
    }
  }

  function checkPasses() {
    if (!anchorPassEmitted) {
      let allSettled = true;
      for (const a of anchors) { if (!settled(a)) { allSettled = false; break; } }
      if (!allSettled) return;
      anchorPassEmitted = true;
      emit({ type: 'pass-complete', stride: strides[0], resident: resident.size, total: anchors.size });
    }
    const { lo, hi } = bounds();
    for (let si = 1; si < strides.length; si += 1) {
      const key = `${generation}:${strides[si]}`;
      if (passesEmitted.has(key)) continue;
      const s = strides[si];
      let total = 0;
      let done = 0;
      for (let i = lo; i <= hi; i += 1) {
        if (i !== focus && i % s !== 0) continue;
        total += 1;
        if (settled(i) || resident.has(i)) done += 1;
      }
      if (total === 0 || done < total) break;
      passesEmitted.add(key);
      emit({ type: 'pass-complete', stride: s, resident: resident.size, total });
    }
  }

  function abortInFlight(predicate, reason) {
    let count = 0;
    for (const [index, rec] of [...inFlight]) {
      if (!predicate(index)) continue;
      if (rec.controller) {
        try {
          rec.controller.abort();
        } catch {
          /* an AbortController that refuses to abort still must not stop the
             others being aborted; the request settles on its own either way */
        }
      }
      inFlight.delete(index);
      state.delete(index);
      count += 1;
    }
    if (count) {
      abortedTotal += count;
      emit({ type: 'aborted', count, reason });
    }
    return count;
  }

  function maybeSettlePrime() {
    if (!primeActive || primeSettled) return;
    for (const a of anchors) { if (!settled(a)) return; }
    settlePrime();
  }

  function settlePrime() {
    if (!primeActive || primeSettled) return;
    primeSettled = true;
    const result = {
      ok: primeStats.ready > 0,
      resident: resident.size,
      requested: primeStats.requested,
      failed: primeStats.failed,
    };
    resolvePrime(result);
  }

  return {
    /** Synchronous, allocation free, never throws, never fetches. The stage
        calls this inside requestAnimationFrame. */
    get(index) {
      const rec = resident.get(index);
      return rec ? rec.image : null;
    },

    /** The nearest decoded frame in either direction, or null. This is how the
        stage holds a last good frame instead of flashing a blank canvas. */
    nearest(index) {
      const direct = resident.get(index);
      if (direct) return { index, image: direct.image };
      let best = null;
      let bestDistance = Infinity;
      for (const [i, rec] of resident) {
        const d = Math.abs(i - index);
        if (d < bestDistance) { bestDistance = d; best = { index: i, image: rec.image }; }
      }
      return best;
    },

    /** Declare where the visitor is. Called every rAF tick, so the unchanged
        case returns before doing anything. A real move bumps the generation,
        aborts in flight requests that are now outside the window, and schedules
        the next refinement pass. */
    setFocus(index) {
      if (destroyed) return;
      if (!Number.isFinite(index)) return;
      const next = Math.min(frameCount - 1, Math.max(0, Math.round(index)));
      if (next === focus) return;
      focus = next;
      generation += 1;
      passesEmitted.clear();
      const { lo, hi } = bounds();
      abortInFlight((i) => (i < lo || i > hi) && !anchors.has(i), 'scroll');
      enforceWindow();
      checkPasses();
      pump();
    },

    /** Activate the loader and run stride pass 1 across the whole sequence.
        Before this call the loader issues no network requests at all, which is
        what lets a caller keep an offscreen sequence silent. Idempotent: a
        second call returns the same promise. Always settles. */
    prime() {
      if (primePromise) return primePromise;
      if (destroyed) return Promise.resolve({ ok: false, resident: 0, requested: 0, failed: 0 });
      primePromise = new Promise((resolve) => { resolvePrime = resolve; });
      primeActive = true;
      pump();
      maybeSettlePrime();
      return primePromise;
    },

    /** Stop all network and decode work. In flight requests are aborted and go
        back to fetchable. A prime() still in flight is settled here rather than
        left pending forever behind a hidden tab: "never a loader forever"
        applies to the promise as much as to the spinner. */
    pause() {
      if (destroyed || paused) return;
      paused = true;
      abortInFlight(() => true, 'pause');
      emit({ type: 'paused' });
      if (primeActive && !primeSettled) settlePrime();
    },

    /** Resume. The early return when not paused is what makes a second call a
        no op; there is no scheduling loop for it to duplicate either way. */
    resume() {
      if (destroyed || !paused) return;
      paused = false;
      emit({ type: 'resumed' });
      pump();
    },

    destroy() {
      if (destroyed) return;
      abortInFlight(() => true, 'destroy');
      destroyed = true;
      for (const rec of resident.values()) closeImage(rec.image);
      resident.clear();
      state.clear();
      evictions.clear();
      if (primeActive && !primeSettled) settlePrime();
    },

    /* The contract's six fields, plus the counters a guard needs to prove the
       caps are real rather than asserted. resident IS the decoded frame count. */
    get stats() {
      return {
        resident: resident.size,
        inFlight: inFlight.size,
        failed: failedCount,
        bytes,
        paused,
        generation,
        // observability beyond the contract, all read only
        requested,
        evicted: evictedTotal,
        aborted: abortedTotal,
        pumps,
        diagnosticErrors,
        primed: primeActive,
        primeSettled,
        focus,
        frameCount,
        decodeWindow,
        windowRadius,
        anchorReserve: reserve,
        anchorCount: anchors.size,
        strides: strides.slice(),
        residentIndices: [...resident.keys()].sort((a, b) => a - b),
      };
    },
  };
}
