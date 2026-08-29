/* The loading and decode layer guard.
   Run:  npm run cine:loader

   Everything here runs in Node against assets/cinematic/sequence-loader.js with
   fetch and the decoder injected, so each claim is a behaviour of the shipped
   module rather than a description of it. The browser half (real bytes, real
   ImageBitmaps, real variant selection by viewport) is tests/cinematic-loader.spec.js.

   IT MUST NOT BE ABLE TO PASS WHILE DOING NOTHING: it counts its assertions and
   exits 1 if it made none, and every scenario that claims "n requests happened"
   counts them on the fake fetch rather than reading a stat the module printed. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createSequenceLoader, residencyBudget, anchorIndices, DEFAULT_MAX_CONCURRENT,
} from '../assets/cinematic/sequence-loader.js';
import { VARIANT_NAMES } from '../assets/cinematic/manifest.js';
import { createFallbackLayer } from '../assets/cinematic/fallback.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const pending = [];
let assertions = 0;

const ok = () => { assertions += 1; };
const check = (condition, msg) => { if (condition) ok(); else failures.push(msg); };
function throwsSync(fn, msg) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  check(threw, msg);
}

// ── fixtures ────────────────────────────────────────────────────────────────

/** A variant shaped exactly like a manifest one, with explicit urls. */
function makeVariant({ frameCount = 96, strides = [16, 4, 1], decodeWindow = 24, tag = 'desktop' } = {}) {
  return {
    media: '(min-width: 768px)',
    orientation: 'landscape',
    width: 960,
    height: 540,
    frameCount,
    frames: Array.from({ length: frameCount }, (_, i) => `/fake/${tag}/f${String(i).padStart(4, '0')}.png`),
    strides,
    decodeWindow,
  };
}

const indexOfUrl = (url) => Number(String(url).match(/f(\d+)\.png$/)[1]);

class AbortSignalLike {
  constructor() { this.aborted = false; this._listeners = []; }
  addEventListener(_type, fn) { this._listeners.push(fn); }
  removeEventListener(_type, fn) { this._listeners = this._listeners.filter((f) => f !== fn); }
}
class FakeAbortController {
  constructor() { this.signal = new AbortSignalLike(); }
  abort() {
    if (this.signal.aborted) return;
    this.signal.aborted = true;
    for (const fn of this.signal._listeners.slice()) fn();
  }
}

/**
 * A fetch that records everything and can be told when to answer.
 * mode 'auto'   resolves on the next microtask
 * mode 'manual' resolves only when release(index) is called
 */
function makeFetch({ mode = 'auto', bytes = 6500, failIndices = new Set(), failAll = false } = {}) {
  const calls = [];
  const concurrentPerIndex = new Map();
  const overlaps = [];
  const pending = new Map();
  let maxConcurrent = 0;
  let live = 0;

  const impl = (url, options = {}) => {
    const index = indexOfUrl(url);
    calls.push({ index, url, at: calls.length });
    const c = (concurrentPerIndex.get(index) || 0) + 1;
    concurrentPerIndex.set(index, c);
    if (c > 1) overlaps.push(index);
    live += 1;
    if (live > maxConcurrent) maxConcurrent = live;

    const done = () => { live -= 1; concurrentPerIndex.set(index, concurrentPerIndex.get(index) - 1); };

    return new Promise((resolve, reject) => {
      const signal = options.signal;
      const answer = () => {
        if (signal && signal.aborted) return;
        done();
        pending.delete(index);
        if (failAll || failIndices.has(index)) {
          resolve({ ok: false, status: 404, blob: async () => ({ size: 0 }) });
          return;
        }
        resolve({ ok: true, status: 200, blob: async () => ({ size: bytes }) });
      };
      if (signal) {
        signal.addEventListener('abort', () => {
          done();
          pending.delete(index);
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      }
      if (mode === 'auto') queueMicrotask(answer);
      else pending.set(index, answer);
    });
  };

  return {
    impl,
    calls,
    overlaps,
    get count() { return calls.length; },
    get maxConcurrent() { return maxConcurrent; },
    get liveCount() { return live; },
    indices: () => calls.map((c) => c.index),
    release(index) { const fn = pending.get(index); if (fn) fn(); },
    releaseAll() { for (const fn of [...pending.values()]) fn(); },
    pendingIndices: () => [...pending.keys()],
  };
}

function makeDecoder() {
  const made = [];
  const impl = async (blob) => {
    const img = { bytes: blob.size, closed: false, close() { this.closed = true; } };
    made.push(img);
    return img;
  };
  return { impl, made, closedCount: () => made.filter((i) => i.closed).length };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

/** Run the event loop until the loader stops making progress. */
async function drain(loader, maxTicks = 800) {
  let last = -1;
  let quiet = 0;
  for (let i = 0; i < maxTicks; i += 1) {
    await tick();
    const s = loader.stats;
    const fingerprint = s.requested * 1e6 + s.resident * 1e3 + s.failed;
    if (s.inFlight === 0 && fingerprint === last) {
      quiet += 1;
      if (quiet >= 3) return true;
    } else {
      quiet = 0;
    }
    last = fingerprint;
  }
  return false;
}

// ── 1. the residency budget is arithmetic, not a hope ───────────────────────
{
  const b = residencyBudget(96, 16, 24);
  check(b.anchorCount === 7, `residencyBudget: 96 frames at stride 16 has ${b.anchorCount} anchors, expected 7 (0,16,32,48,64,80,95)`);
  check(b.windowSpan + b.anchorCount <= 24,
    `residencyBudget: a ${b.windowSpan} frame window plus ${b.anchorCount} anchors exceeds the 24 frame cap`);
  check(anchorIndices(96, 16).has(95), 'anchorIndices omits the final frame, so scroll progress 1 has no skeleton frame');
  check(anchorIndices(96, 16).has(0), 'anchorIndices omits frame 0');
  check(DEFAULT_MAX_CONCURRENT === 6, `DEFAULT_MAX_CONCURRENT is ${DEFAULT_MAX_CONCURRENT}`);
}

// The same arithmetic against the real generated manifest, so a future variant
// with a tighter decodeWindow cannot quietly make the skeleton unevictable.
{
  const p = path.join(root, 'artifacts', 'cinematic-placeholders', 'manifest.json');
  if (!fs.existsSync(p)) {
    pending.push('no placeholder manifest on disk, so the budget was not checked against real variants. Run: npm run cine:frames');
  } else {
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const seq of m.sequences) {
      for (const name of VARIANT_NAMES) {
        const v = seq.variants[name];
        const b = residencyBudget(v.frameCount, v.strides[0], v.decodeWindow);
        check(b.windowSpan + b.anchorCount <= v.decodeWindow,
          `${seq.id}/${name}: window ${b.windowSpan} + anchors ${b.anchorCount} exceeds decodeWindow ${v.decodeWindow}, so the skeleton would be evicted in steady state`);
        check(b.anchorCount < v.frameCount / 4,
          `${seq.id}/${name}: ${b.anchorCount} anchors for ${v.frameCount} frames is not a coarse skeleton`);
      }
    }
  }
}

// ── 2. inert until prime(): an offscreen sequence costs nothing ─────────────
{
  const f = makeFetch();
  const d = makeDecoder();
  const loader = createSequenceLoader(makeVariant(), { fetchImpl: f.impl, decodeImage: d.impl, AbortControllerImpl: FakeAbortController });
  for (let i = 0; i < 1000; i += 1) loader.setFocus(i % 96);
  loader.resume();
  loader.pause();
  loader.resume();
  await drain(loader, 20);
  check(f.count === 0,
    `a loader that was never primed issued ${f.count} network request(s). An offscreen sequence must cost nothing.`);
  check(loader.get(0) === null, 'get() on an unprimed loader returned an image');
  check(loader.nearest(0) === null, 'nearest() on an unprimed loader returned a frame');
  check(loader.stats.bytes === 0, `an unprimed loader reports ${loader.stats.bytes} bytes downloaded`);
  loader.destroy();
}

// ── 3. stride pass 1: a usable scrubber for a handful of frames ─────────────
{
  const f = makeFetch({ bytes: 6500 });
  const d = makeDecoder();
  const variant = makeVariant();
  /* Snapshot the real cost at the instant the skeleton pass completes. Reading
     it after `await prime()` would measure a microtask later, by which time
     refinement requests have already started and the number means nothing. */
  let atPass = null;
  const loader = createSequenceLoader(variant, {
    fetchImpl: f.impl,
    decodeImage: d.impl,
    AbortControllerImpl: FakeAbortController,
    onDiagnostic: (e) => {
      if (e.type === 'pass-complete' && e.stride === 16 && !atPass) {
        atPass = { requests: f.count, bytes: loader.stats.bytes, resident: e.resident, total: e.total };
      }
    },
  });
  const result = await loader.prime();
  const anchors = anchorIndices(96, 16);

  check(result.ok === true, `prime() resolved ok:${result.ok} with every frame available`);
  check(result.requested === anchors.size,
    `prime() requested ${result.requested} frames for a ${anchors.size} frame skeleton`);
  check(!!atPass, 'no pass-complete diagnostic was emitted for stride 16');
  check(atPass && atPass.requests === anchors.size,
    `stride pass 1 had issued ${atPass && atPass.requests} requests across a 96 frame sequence; the skeleton is ${anchors.size} frames`);
  check(atPass && atPass.bytes === anchors.size * 6500,
    `stride pass 1 had downloaded ${atPass && atPass.bytes} bytes for a ${anchors.size} frame skeleton at 6500 bytes each; a usable scrubber must cost tens of kilobytes, not the whole sequence`);
  check(atPass && atPass.total === anchors.size, `pass-complete reported ${atPass && atPass.total} skeleton frames, expected ${anchors.size}`);

  // The point of the skeleton: every scroll position has something near it.
  let worst = 0;
  for (let i = 0; i < 96; i += 1) {
    const n = loader.nearest(i);
    if (!n) { worst = Infinity; break; }
    worst = Math.max(worst, Math.abs(n.index - i));
  }
  check(worst <= variant.strides[0],
    `after stride pass 1 the farthest any scroll position sits from a decoded frame is ${worst}, which is worse than stride ${variant.strides[0]}`);
  check(f.overlaps.length === 0, `${f.overlaps.length} frame(s) were fetched twice concurrently: ${[...new Set(f.overlaps)].join(', ')}`);
  loader.destroy();
}

// ── 4. the decode window is a hard cap under a full scrub ───────────────────
{
  const f = makeFetch();
  const d = makeDecoder();
  const variant = makeVariant();
  const loader = createSequenceLoader(variant, { fetchImpl: f.impl, decodeImage: d.impl, AbortControllerImpl: FakeAbortController });
  await loader.prime();

  let peak = 0;
  for (let i = 0; i < 96; i += 3) {
    loader.setFocus(i);
    await drain(loader, 60);
    peak = Math.max(peak, loader.stats.resident);
  }
  check(peak <= variant.decodeWindow,
    `resident decoded frames peaked at ${peak}, above the ${variant.decodeWindow} frame cap`);
  check(peak >= 8,
    `resident decoded frames only ever reached ${peak}; the loader is not filling its window and the scrubber will be coarse forever`);
  check(loader.stats.evicted > 0,
    'a full scrub of 96 frames evicted nothing, so the cap was never actually exercised');
  check(d.closedCount() === loader.stats.evicted,
    `${loader.stats.evicted} frames were evicted but ${d.closedCount()} bitmaps were close()d; an evicted ImageBitmap that is not closed keeps its decoded pixels alive`);
  check(f.overlaps.length === 0, `${f.overlaps.length} concurrent duplicate fetch(es) during a full scrub`);
  check(f.maxConcurrent <= DEFAULT_MAX_CONCURRENT,
    `${f.maxConcurrent} requests were in flight at once, above maxConcurrent ${DEFAULT_MAX_CONCURRENT}`);

  const residentNow = loader.stats.residentIndices;
  const anchors = anchorIndices(96, 16);
  const anchorsHeld = [...anchors].filter((a) => residentNow.includes(a)).length;
  check(anchorsHeld === anchors.size,
    `${anchorsHeld} of ${anchors.size} skeleton frames survived the scrub; the skeleton is what makes a jump to anywhere land on a frame`);
  loader.destroy();
  check(loader.stats.resident === 0, `destroy() left ${loader.stats.resident} decoded frames resident`);
  check(d.closedCount() === d.made.length, `destroy() left ${d.made.length - d.closedCount()} bitmaps open`);
}

// ── 5. fast scrolling aborts obsolete refinement fetches ───────────────────
{
  const f = makeFetch({ mode: 'manual' });
  const d = makeDecoder();
  const events = [];
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: f.impl, decodeImage: d.impl, AbortControllerImpl: FakeAbortController,
    onDiagnostic: (e) => events.push(e),
  });
  const skeleton = anchorIndices(96, 16);
  const primed = loader.prime();
  // Answer the skeleton only, and leave every refinement request hanging.
  let primeDone = false;
  primed.then(() => { primeDone = true; });
  for (let i = 0; i < 60 && !primeDone; i += 1) {
    for (const idx of f.pendingIndices()) if (skeleton.has(idx)) f.release(idx);
    await tick();
  }
  check(primeDone, 'prime() never settled while its skeleton requests were being answered');
  await primed;
  await tick();
  const hangingNear = f.pendingIndices().filter((i) => i < 20);
  check(hangingNear.length > 0, 'no refinement requests were in flight near the focus, so the abort path was never exercised');

  loader.setFocus(95);
  await tick();
  const aborted = events.filter((e) => e.type === 'aborted' && e.reason === 'scroll');
  check(aborted.length > 0, 'scrolling to the far end of the sequence aborted no obsolete refinement request');
  check(loader.stats.failed === 0,
    `${loader.stats.failed} frame(s) were counted as failed after an abort; an aborted fetch is not a failure and must stay refetchable`);
  check(events.every((e) => e.type !== 'frame-failed'), 'an aborted fetch emitted frame-failed');

  // And the abandoned frames are still reachable: scroll back and they load.
  loader.setFocus(0);
  await tick();
  f.releaseAll();
  await drain(loader, 200);
  const backNear = loader.get(4) || loader.get(8) || loader.get(0);
  check(!!backNear, 'after scrolling away and back, no frame near the start could be loaded again; aborted frames were blacklisted');
  loader.destroy();
}

// ── 6. a failed frame never breaks the page ─────────────────────────────────
{
  const failing = new Set([16, 32]);
  const f = makeFetch({ failIndices: failing });
  const d = makeDecoder();
  const events = [];
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: f.impl, decodeImage: d.impl, AbortControllerImpl: FakeAbortController,
    onDiagnostic: (e) => events.push(e),
  });
  const result = await loader.prime();
  check(result.ok === true, `prime() resolved ok:false although only ${failing.size} of the skeleton failed`);
  check(result.failed === failing.size, `prime() reported ${result.failed} failures, expected ${failing.size}`);
  check(loader.get(16) === null, 'get() returned an image for a frame that failed to load');
  const near = loader.nearest(16);
  check(!!near && near.index !== 16,
    'nearest() had nothing to offer beside a failed frame, so the stage would have to clear the canvas');
  check(events.some((e) => e.type === 'frame-failed' && e.index === 16 && e.status === 404),
    'a 404 frame did not emit frame-failed with its status');
  loader.destroy();
}

// Every frame failing still resolves, with ok:false, and never rejects.
{
  const f = makeFetch({ failAll: true });
  const d = makeDecoder();
  const loader = createSequenceLoader(makeVariant(), { fetchImpl: f.impl, decodeImage: d.impl, AbortControllerImpl: FakeAbortController });
  let rejected = false;
  const result = await loader.prime().catch((e) => { rejected = true; return e; });
  check(rejected === false, 'prime() rejected when every frame failed; it must resolve so the caller can degrade');
  check(result.ok === false, `prime() resolved ok:${result.ok} with every frame failing`);
  check(loader.stats.failed >= result.requested, `stats.failed is ${loader.stats.failed} after ${result.requested} total failures`);
  loader.destroy();
}

// A decoder that throws is a failure like any other, not an unhandled rejection.
{
  const f = makeFetch();
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: f.impl,
    decodeImage: async () => { throw new Error('corrupt png'); },
    AbortControllerImpl: FakeAbortController,
  });
  const result = await loader.prime();
  check(result.ok === false, 'a decoder that throws on every frame did not settle prime() as failed');
  check(loader.stats.resident === 0, 'a throwing decoder left frames marked resident');
  loader.destroy();
}

// ── 7. pause, resume, and the second scheduling loop that must not exist ────
{
  const f = makeFetch({ mode: 'manual' });
  const d = makeDecoder();
  const events = [];
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: f.impl, decodeImage: d.impl, AbortControllerImpl: FakeAbortController,
    onDiagnostic: (e) => events.push(e),
  });
  loader.prime();
  await tick();
  const inFlightBefore = loader.stats.inFlight;
  check(inFlightBefore > 0, 'prime() started no requests');

  loader.pause();
  check(loader.stats.inFlight === 0, `pause() left ${loader.stats.inFlight} request(s) in flight`);
  check(loader.stats.paused === true, 'pause() did not set stats.paused');
  const countAtPause = f.count;
  await tick();
  await tick();
  check(f.count === countAtPause, `${f.count - countAtPause} request(s) started while paused`);

  loader.resume();
  await tick();
  const afterFirstResume = f.count;
  loader.resume();
  loader.resume();
  await tick();
  check(f.count === afterFirstResume,
    `resume() called three times issued ${f.count - afterFirstResume} extra request(s); a duplicated scheduling loop is invisible until it doubles the request count`);
  check(f.overlaps.length === 0,
    `a repeated resume() produced ${f.overlaps.length} concurrent duplicate fetch(es) for frames ${[...new Set(f.overlaps)].join(', ')}`);
  check(events.filter((e) => e.type === 'paused').length === 1, 'paused was emitted more than once');
  check(events.filter((e) => e.type === 'resumed').length === 1, 'a no op resume() emitted resumed');
  loader.destroy();
}

/* ── 7b. A PAUSE IS NOT A FAILURE ───────────────────────────────────────────
   THE SEAM THIS SECTION EXISTS FOR, and what it used to miss.

   The old version of this block primed, paused, raced the promise against a
   50ms timer and asserted only `settled !== 'PENDING'`. That is a real
   property and it is half the property. The value it settles WITH is what the
   next module reads: fallback.js#armWatchdog treats result.ok === false as a
   total load failure and calls degrade(), degrade is terminal, and index.js
   then stops the stage. So the loader settled correctly, the layer degraded
   correctly, and the seam between two correct modules permanently killed a
   sequence on one tab switch. MEASURED 2026-08-28 in a browser: hide at 400ms,
   show at 800ms, and the stage the visitor was looking at came back
   data-cine-state="degraded" with the canvas hidden and zero network failures.

   So this asserts the SHAPE, and then crosses the seam and asserts the shipped
   fallback layer's actual reaction to that shape. A guard about pendingness
   alone would pass on the defect it was written to prevent. */

/** Release manual fetches until `promise` settles, or give up and report the
    fact rather than hanging the guard. */
async function settleUnder(f, loader, promise) {
  let done = false;
  const value = promise.then((v) => { done = true; return v; });
  for (let i = 0; i < 400 && !done; i += 1) {
    f.releaseAll();
    await tick();
  }
  return done ? value : Promise.race([value, Promise.resolve('PENDING')]);
}

/** The smallest element the shipped fallback layer will accept. No document
    and no window, deliberately: this is a Node process, and a layer that
    needed a real DOM to answer "did you degrade" would be answering about a
    different code path than the browser's. */
function stubStage(id = 'seam-stage') {
  const attrs = { 'data-cine-state': 'poster', 'data-cine-stage': id };
  return {
    ownerDocument: null,
    getAttribute: (k) => (k in attrs ? attrs[k] : null),
    setAttribute: (k, v) => { attrs[k] = String(v); },
    hasAttribute: (k) => k in attrs,
    querySelector: () => null,
    attrs,
  };
}

{
  const f = makeFetch({ mode: 'manual' });
  const loader = createSequenceLoader(makeVariant(), { fetchImpl: f.impl, decodeImage: makeDecoder().impl, AbortControllerImpl: FakeAbortController });
  const p = loader.prime();
  await tick();
  check(loader.stats.inFlight > 0, 'prime() had nothing in flight, so pausing it proves nothing');
  loader.pause();
  const settled = await Promise.race([p, new Promise((r) => setTimeout(() => r('PENDING'), 50))]);
  check(settled !== 'PENDING', 'prime() was still pending 50ms after pause(); a hidden tab would leave the caller waiting on the watchdog');
  check(settled !== 'PENDING' && settled.deferred === true,
    `pause() settled prime() with ${JSON.stringify(settled)}. It must carry deferred:true. Without it the value is indistinguishable from a total network failure, and fallback.js degrades a stage that failed at nothing.`);
  check(settled !== 'PENDING' && settled.reason === 'paused',
    `pause() settled prime() with reason ${JSON.stringify(settled && settled.reason)}, expected 'paused'.`);
  check(settled !== 'PENDING' && settled.failed === 0,
    `pause() reported ${settled && settled.failed} failed frame(s); nothing on the wire had failed.`);

  /* THE SEAM ITSELF. The shipped layer, the shipped settled value, and the
     question the browser actually asks. */
  const stage = stubStage();
  const events = [];
  const layer = createFallbackLayer(stage, { id: 'seam-stage' }, { chapters: [] }, {
    onDiagnostic: (e) => events.push(e.type),
    loader,
  });
  const verdict = await layer.armWatchdog(Promise.resolve(settled));
  check(verdict === 'prime-deferred',
    `the shipped fallback layer answered '${verdict}' for a paused prime; expected 'prime-deferred'.`);
  check(layer.isDegraded() === false,
    'the shipped fallback layer DEGRADED a stage because the loader was paused mid prime. degraded is terminal, so one tab switch during the first seconds of a sequence kills it permanently and returning to the tab restores nothing.');
  check(stage.attrs['data-cine-state'] !== 'degraded',
    `a paused prime left the stage at data-cine-state="${stage.attrs['data-cine-state']}".`);
  check(events.includes('prime-deferred') && !events.includes('degraded'),
    `a paused prime produced diagnostics ${JSON.stringify(events)}; expected prime-deferred and no degrade.`);
  layer.destroy();
  loader.destroy();
}

/* resume() re-opens the deferred wait, hands the new promise to
   onPrimeReopened, and finishes the anchor pass. "Resumes without jumping or
   starting a duplicate loop" is the directive's wording; a resume that came
   back with nothing watching its load would satisfy the letter of it. */
{
  const f = makeFetch({ mode: 'manual' });
  const reopened = [];
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: f.impl,
    decodeImage: makeDecoder().impl,
    AbortControllerImpl: FakeAbortController,
    onPrimeReopened: (promise) => reopened.push(promise),
  });
  loader.prime();
  await tick();
  loader.pause();
  const paused = await loader.prime();          // the deferred value, already settled
  check(paused.deferred === true, 'prime() after pause() did not report deferred');
  check(reopened.length === 0, 'onPrimeReopened fired before resume()');

  loader.resume();
  check(reopened.length === 1, `resume() re-opened ${reopened.length} prime waits, expected exactly 1. A stage coming back from a hidden tab with nothing watching its load is the failure this exists to stop.`);
  check(loader.stats.primeReopenings === 1, `stats.primeReopenings is ${loader.stats.primeReopenings}, expected 1`);
  const second = await settleUnder(f, loader, reopened[0]);
  check(second.deferred === false && second.ok === true,
    `the re-opened prime settled ${JSON.stringify(second)}; after a clean resume it must be a real completion, not another deferral.`);
  check(f.overlaps.length === 0,
    `pause/resume produced ${f.overlaps.length} overlapping fetch(es); the re-opened prime started a second scheduling loop.`);

  /* And a second resume() must not open a third wait. */
  loader.resume();
  check(reopened.length === 1, 'a no-op resume() re-opened another prime wait');
  loader.destroy();
}

/* Priming a loader that is ALREADY paused (a page opened in a background tab:
   scroll-stage.start() pauses the loader before index.js primes it) settles
   immediately as deferred. It used to stay pending forever, because pump()
   returns at once while paused and nothing could ever settle it, and the
   fallback watchdog degraded the stage 6000ms later. */
{
  const f = makeFetch({ mode: 'manual' });
  const reopened = [];
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: f.impl,
    decodeImage: makeDecoder().impl,
    AbortControllerImpl: FakeAbortController,
    onPrimeReopened: (promise) => reopened.push(promise),
  });
  loader.pause();
  const settled = await Promise.race([loader.prime(), new Promise((r) => setTimeout(() => r('PENDING'), 50))]);
  check(settled !== 'PENDING',
    'prime() on an already-paused loader never settled. A page opened in a background tab primes into a paused loader, nothing is ever in flight, and only the 6000ms watchdog ends the wait, by degrading a stage that failed at nothing.');
  check(settled !== 'PENDING' && settled.deferred === true,
    `prime() on a paused loader settled ${JSON.stringify(settled)}; expected deferred:true`);
  check(f.count === 0, `prime() on a paused loader issued ${f.count} request(s)`);

  const stage = stubStage('hidden-tab');
  const layer = createFallbackLayer(stage, { id: 'hidden-tab' }, { chapters: [] }, { loader });
  const verdict = await layer.armWatchdog(Promise.resolve(settled));
  check(verdict === 'prime-deferred' && layer.isDegraded() === false,
    'the shipped fallback layer degraded a stage that was primed in a background tab');
  layer.destroy();

  loader.resume();
  check(reopened.length === 1, 'resuming a background tab did not re-open the prime wait');
  const done = await settleUnder(f, loader, reopened[0]);
  check(done.ok === true, `after becoming visible the re-opened prime settled ${JSON.stringify(done)}`);
  loader.destroy();
}

/* destroy() settles a live prime too, and that value must NOT degrade either:
   the stage is being disposed of, not failing. */
{
  const f = makeFetch({ mode: 'manual' });
  const loader = createSequenceLoader(makeVariant(), { fetchImpl: f.impl, decodeImage: makeDecoder().impl, AbortControllerImpl: FakeAbortController });
  const p = loader.prime();
  await tick();
  loader.destroy();
  const settled = await Promise.race([p, new Promise((r) => setTimeout(() => r('PENDING'), 50))]);
  check(settled !== 'PENDING', 'prime() was still pending 50ms after destroy()');
  check(settled !== 'PENDING' && settled.reason === 'destroyed',
    `destroy() settled prime() with reason ${JSON.stringify(settled && settled.reason)}, expected 'destroyed'`);
  const stage = stubStage('destroyed-stage');
  const layer = createFallbackLayer(stage, { id: 'destroyed-stage' }, { chapters: [] }, {});
  const verdict = await layer.armWatchdog(Promise.resolve(settled));
  check(verdict === 'prime-abandoned' && layer.isDegraded() === false,
    `tearing a loader down made the fallback layer answer '${verdict}' and degraded=${layer.isDegraded()}; a page being disposed of has not failed at anything`);
  layer.destroy();
}

/* AND THE OTHER DIRECTION, so 'deferred' cannot become a blanket excuse: a
   prime whose anchors genuinely all failed must STILL degrade. */
{
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: async () => ({ ok: false, status: 404 }),
    decodeImage: makeDecoder().impl,
    AbortControllerImpl: FakeAbortController,
  });
  const settled = await loader.prime();
  check(settled.ok === false && settled.deferred === false,
    `a prime whose every anchor 404ed settled ${JSON.stringify(settled)}; it is a real failure and must not be marked deferred`);
  const stage = stubStage('all-failed');
  const layer = createFallbackLayer(stage, { id: 'all-failed' }, { chapters: [] }, {});
  const verdict = await layer.armWatchdog(Promise.resolve(settled));
  check(verdict === 'prime-failed' && layer.isDegraded() === true,
    'a sequence whose every anchor frame 404ed did NOT degrade. The deferred branch has swallowed the real failure case.');
  layer.destroy();
  loader.destroy();
}

// prime() twice returns the same promise and does not re-request the skeleton.
{
  const f = makeFetch();
  const loader = createSequenceLoader(makeVariant(), { fetchImpl: f.impl, decodeImage: makeDecoder().impl, AbortControllerImpl: FakeAbortController });
  const a = loader.prime();
  const b = loader.prime();
  check(a === b, 'prime() returned a different promise on the second call');
  await a;
  const afterFirst = f.count;
  await loader.prime();
  check(f.count === afterFirst, `a third prime() issued ${f.count - afterFirst} extra request(s)`);
  loader.destroy();
}

// ── 8. diagnostics are complete, and a throwing consumer cannot break loading ─
{
  const f = makeFetch();
  const seen = new Set();
  const loader = createSequenceLoader(makeVariant(), {
    fetchImpl: f.impl,
    decodeImage: makeDecoder().impl,
    AbortControllerImpl: FakeAbortController,
    onDiagnostic: (e) => { seen.add(e.type); throw new Error('a consumer that throws'); },
  });
  await loader.prime();
  loader.setFocus(48);
  await drain(loader, 120);
  check(seen.has('frame-loaded'), 'no frame-loaded diagnostic was emitted');
  check(seen.has('pass-complete'), 'no pass-complete diagnostic was emitted');
  check(loader.stats.resident > 0, 'a throwing diagnostics consumer stopped frames being loaded');
  check(loader.stats.diagnosticErrors > 0, 'a throwing diagnostics consumer was swallowed without being counted');
  loader.destroy();
}

// ── 9. construction refuses what it cannot honour ──────────────────────────
{
  throwsSync(() => createSequenceLoader(null), 'createSequenceLoader accepted a null variant');
  throwsSync(() => createSequenceLoader(makeVariant({ strides: [8, 4, 2] }), { fetchImpl: () => {} }),
    'createSequenceLoader accepted a stride ladder that never reaches 1');
  throwsSync(() => createSequenceLoader(makeVariant({ strides: [4, 16, 1] }), { fetchImpl: () => {} }),
    'createSequenceLoader accepted strides that do not strictly decrease');
  throwsSync(() => createSequenceLoader(makeVariant({ decodeWindow: 1 }), { fetchImpl: () => {} }),
    'createSequenceLoader accepted a decodeWindow of 1');
  throwsSync(() => createSequenceLoader(makeVariant({ decodeWindow: 200 }), { fetchImpl: () => {} }),
    'createSequenceLoader accepted a decodeWindow that holds the whole sequence');
  {
    const v = makeVariant();
    v.frames.pop();
    throwsSync(() => createSequenceLoader(v, { fetchImpl: () => {} }),
      'createSequenceLoader accepted a variant whose frames array is shorter than frameCount');
  }
}

// A fetch that throws outright (offline, DNS, CORS) is tolerated like a 404:
// prime() still resolves, and the rest of the skeleton still loads.
{
  const l = createSequenceLoader(makeVariant(), {
    fetchImpl: async (url) => {
      if (indexOfUrl(url) === 0) throw new TypeError('Failed to fetch');
      return { ok: true, status: 200, blob: async () => ({ size: 1 }) };
    },
    decodeImage: makeDecoder().impl,
    AbortControllerImpl: FakeAbortController,
  });
  let rejected = false;
  const r = await l.prime().catch(() => { rejected = true; return null; });
  check(rejected === false, 'a fetch that threw outright rejected prime()');
  check(r && r.ok === true && r.failed === 1,
    `a single hard fetch error produced ${r && JSON.stringify(r)}; the other skeleton frames must still load`);
  check(l.get(0) === null && l.get(16) !== null, 'the frame whose fetch threw was not isolated from the rest');
  l.destroy();
}

// ── verdict ─────────────────────────────────────────────────────────────────
process.stdout.write('\n');
for (const p of pending) process.stdout.write(`  PENDING  ${p}\n`);
for (const f of failures) process.stderr.write(`  FAIL     ${f}\n`);
process.stdout.write(`\n${assertions} assertion(s) ran, ${failures.length} failed, ${pending.length} pending.\n`);

if (assertions === 0) {
  process.stderr.write('FAIL: this guard asserted nothing.\n');
  process.exitCode = 1;
} else if (failures.length) {
  process.exitCode = 1;
} else {
  process.stdout.write('cinematic loading layer holds.\n');
  process.exitCode = 0;
}
