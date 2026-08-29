/* The scroll stage engine, measured rather than asked.
   Run:  NV_PORT=3291 npx playwright test tests/cinematic-stage.spec.js

   NO ASSERTION HERE TRUSTS stage.frameIndex. Every index claim is read out of
   the canvas pixels with readCanvasFrame(), and every index it is compared
   against is recomputed from live page geometry with expectedFrameIndex(). An
   engine that reports 42 while painting 7, or that paints into a 300x150
   default backing store, fails here rather than shipping.

   assertServingThisWorktree() runs before any measurement in every test.
   Another agent is running its own suite on the default port; a spec that
   attaches to a stranger's server passes while describing a different
   application. */
import { test, expect } from '@playwright/test';
import {
  assertServingThisWorktree, canvasMetrics, readCanvasFrame,
  expectedFrameIndex, localPlaceholderManifest, variantOf,
} from './helpers/cinematic.js';

const HARNESS = '/tests/fixtures/cinematic-stage-harness.html';
const STAGE_A = '#stage-a';
const CANVAS_A = '#stage-a canvas[data-cine-canvas]';

const variantA = () => variantOf(localPlaceholderManifest(), 'signal-to-system', 'desktop');

async function openHarness(page, query = '') {
  await assertServingThisWorktree(page);
  await page.goto(HARNESS + query);
  await page.waitForFunction(() => window.__cine && (window.__cine.ready || window.__cine.error));
  const boot = await page.evaluate(() => ({
    error: window.__cine.error,
    drift: window.__cine.drift,
    variantName: window.__cine.variantName,
    frameCount: window.__cine.frameCountA,
  }));
  expect(boot.error, 'the harness failed to boot').toBeNull();
  expect(boot.drift, 'the fixture markup and the manifest disagree, so the page under test lies about itself').toEqual([]);
  return boot;
}

/** Scroll, then wait until the engine has painted the index the live geometry
 *  independently implies. Returns that expected index. */
async function scrollTo(page, y, frameCount) {
  await page.evaluate((to) => window.__cine.rawScrollTo(0, to), y);
  await page.waitForTimeout(60);
  const expectation = await expectedFrameIndex(page, STAGE_A, frameCount);
  await page.waitForFunction(
    (i) => window.__cine.stageA.paintedIndex === i,
    expectation.index,
    { timeout: 8000 },
  );
  return expectation.index;
}

/** Scroll offsets spanning the whole of stage A, from before it to past it. */
async function stageScrollPositions(page) {
  return page.evaluate(() => {
    const el = document.getElementById('stage-a');
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const range = r.height - window.innerHeight;
    return [0, 0.07, 0.2, 0.35, 0.5, 0.68, 0.85, 0.97, 1].map((p) => Math.round(top + range * p));
  });
}

test('the canvas is sized from its real box at the device pixel ratio, never the 300x150 default', async ({ page }) => {
  await openHarness(page);
  const metrics = await canvasMetrics(page, CANVAS_A);   // throws on zero box, on 300x150, on a mismatched store
  const sized = await page.evaluate(() => window.__cine.lastOf('sized'));
  expect(sized, 'the engine never emitted a sized diagnostic, so nothing proves it measured anything').not.toBeNull();
  expect(sized.backingWidth).toBe(metrics.backingWidth);
  expect(sized.backingHeight).toBe(metrics.backingHeight);
  expect(sized.dpr).toBeLessThanOrEqual(2);
  expect(Math.abs(sized.backingWidth - sized.cssWidth * sized.dpr)).toBeLessThanOrEqual(1);
});

test('scroll progress maps to the exact integer frame index, read off the pixels', async ({ page }) => {
  const boot = await openHarness(page);
  const variant = variantA();
  const positions = await stageScrollPositions(page);
  for (const y of positions) {
    const expected = await scrollTo(page, y, boot.frameCount);
    const read = await readCanvasFrame(page, CANVAS_A, variant);
    expect(read.sequenceId).toBe('signal-to-system');
    expect(read.frameIndex, `at scrollY ${y} the live geometry implies frame ${expected} but the canvas is painting ${read.frameIndex}`).toBe(expected);
  }
});

test('scrolling up retraces exactly the integers scrolling down produced', async ({ page }) => {
  const boot = await openHarness(page);
  const variant = variantA();
  const positions = await stageScrollPositions(page);

  const down = [];
  for (const y of positions) {
    await scrollTo(page, y, boot.frameCount);
    down.push((await readCanvasFrame(page, CANVAS_A, variant)).frameIndex);
  }
  const up = [];
  for (const y of [...positions].reverse()) {
    await scrollTo(page, y, boot.frameCount);
    up.push((await readCanvasFrame(page, CANVAS_A, variant)).frameIndex);
  }
  /* Not "decreasing": the SAME integers, in reverse. Any easing, hysteresis or
     smoothing has state that has to unwind, and would show up right here. */
  expect(up).toEqual([...down].reverse());
  expect(new Set(down).size, 'the sampled positions did not move the index at all').toBeGreaterThan(4);
});

test('the index clamps at both ends however far the page is scrolled past them', async ({ page }) => {
  const boot = await openHarness(page);
  const variant = variantA();
  const n = boot.frameCount;

  await scrollTo(page, 0, n);
  expect((await readCanvasFrame(page, CANVAS_A, variant)).frameIndex,
    'scrolled far above the stage, the engine is not clamped to frame 0').toBe(0);
  expect(await page.evaluate(() => window.__cine.stageA.progress)).toBe(0);

  const bottom = await page.evaluate(() => document.documentElement.scrollHeight);
  await scrollTo(page, bottom + 10000, n);
  expect((await readCanvasFrame(page, CANVAS_A, variant)).frameIndex,
    `scrolled far past the stage, the engine is not clamped to frame ${n - 1}`).toBe(n - 1);
  expect(await page.evaluate(() => window.__cine.stageA.progress)).toBe(1);
});

test('a visitor who is not scrolling costs no animation work at all', async ({ page }) => {
  const boot = await openHarness(page);
  const positions = await stageScrollPositions(page);
  await scrollTo(page, positions[4], boot.frameCount);

  const during = await page.evaluate(() => window.__cine.rafCalls);
  expect(during, 'the engine never requested an animation frame while scrolling').toBeGreaterThan(0);

  await page.waitForTimeout(400);          // past every internal wait budget
  const settled = await page.evaluate(() => window.__cine.rafCalls);
  await page.waitForTimeout(900);
  const idle = await page.evaluate(() => window.__cine.rafCalls);

  expect(idle - settled,
    `the engine requested ${idle - settled} animation frames across 900ms of a page nobody was scrolling. A self rescheduling render loop burns battery forever and is invisible.`).toBe(0);
  expect(await page.evaluate(() => window.__cine.stageA.running), 'and it did that by stopping, not by staying awake').toBe(true);
});

test('a scroll that does not change the frame index does not redraw', async ({ page }) => {
  const boot = await openHarness(page);
  const positions = await stageScrollPositions(page);
  await scrollTo(page, positions[4], boot.frameCount);
  await page.waitForTimeout(200);

  const before = await page.evaluate(() => ({ painted: window.__cine.countOf('painted'), raf: window.__cine.rafCalls }));
  /* One pixel: far too little to move a 96 frame sequence across a 240vh
     stage, so the tick must run and decide to do nothing. */
  await page.evaluate((y) => window.__cine.rawScrollTo(0, y + 1), positions[4]);
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ painted: window.__cine.countOf('painted'), raf: window.__cine.rafCalls }));

  expect(after.raf, 'the scroll did not even wake the engine, so this test proves nothing').toBeGreaterThan(before.raf);
  expect(after.painted - before.painted,
    'the engine redrew a frame index it was already showing').toBe(0);
});

test('the visitor\'s scroll is never touched: no wheel handler, no preventDefault, no programmatic scrolling', async ({ page }) => {
  await openHarness(page);
  const positions = await stageScrollPositions(page);
  await page.evaluate((y) => window.__cine.rawScrollTo(0, y), positions[3]);
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, 600);          // a real wheel gesture, not a synthetic event
  await page.waitForTimeout(300);

  const evidence = await page.evaluate(() => ({
    stageListeners: window.__cine.stageListeners,
    prevented: window.__cine.prevented,
    scrollWrites: window.__cine.scrollWrites,
  }));

  const types = evidence.stageListeners.map((l) => l.type);
  for (const forbidden of ['wheel', 'mousewheel', 'touchmove', 'touchstart', 'keydown']) {
    expect(types, `the engine registered a ${forbidden} handler; that is the shape of scroll hijacking`).not.toContain(forbidden);
  }
  const scrollListeners = evidence.stageListeners.filter((l) => l.type === 'scroll');
  expect(scrollListeners.length, 'the engine registered no scroll listener at all').toBeGreaterThan(0);
  for (const l of scrollListeners) {
    expect(l.passive, `the engine's scroll listener on ${l.target} is not registered { passive: true }, so the browser must wait for it before scrolling`).toBe(true);
  }
  expect(evidence.prevented, 'something called preventDefault while the visitor was scrolling').toEqual([]);
  expect(evidence.scrollWrites, 'the engine moved the page itself').toEqual([]);
});

test('the engine writes nothing into the page except the canvas\'s own backing store size', async ({ page }) => {
  const boot = await openHarness(page);
  const positions = await stageScrollPositions(page);
  await scrollTo(page, positions[2], boot.frameCount);
  await scrollTo(page, positions[6], boot.frameCount);

  const mutations = await page.evaluate(() => window.__cine.mutations);
  const forbidden = mutations.filter((m) => !(m.isTheCanvas && m.kind === 'attributes' && ['width', 'height'].includes(m.attribute)));
  /* Setting canvas.width reflects to the width content attribute, so those two
     are the engine's legitimate footprint. Anything else - a class, a style, an
     inline height, hidden, aria-hidden, data-cine-state, an inserted node - is
     another module's territory and would collide at merge. */
  expect(forbidden, `the engine mutated the stage subtree: ${JSON.stringify(forbidden.slice(0, 5))}`).toEqual([]);
  expect(mutations.length, 'no mutation was observed at all, so the observer proves nothing').toBeGreaterThan(0);

  const marking = await page.evaluate(() => {
    const c = document.querySelector('#stage-a canvas[data-cine-canvas]');
    return { role: c.getAttribute('role'), ariaHidden: c.getAttribute('aria-hidden'), state: document.getElementById('stage-a').getAttribute('data-cine-state') };
  });
  expect(marking.role, 'the canvas is not marked presentational').toBe('presentation');
  expect(marking.ariaHidden).toBe('true');
  expect(marking.state, 'the engine changed data-cine-state, which fallback.js owns').toBe('poster');
  expect(await page.evaluate(() => window.__cine.countOf('aria-missing')),
    'the engine reported the canvas was unmarked, on markup that marks it').toBe(0);
});

test('the readable content over the stage is never under the canvas hit area', async ({ page }) => {
  await openHarness(page);
  const positions = await stageScrollPositions(page);
  await page.evaluate((y) => window.__cine.rawScrollTo(0, y), positions[2]);
  await page.waitForTimeout(150);

  const hits = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('#stage-a .cta, #stage-a h2')) {
      const r = el.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) continue;
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      out.push({ id: el.id || el.tagName, hit: at ? at.tagName.toLowerCase() : null, own: el.contains(at) || el === at });
    }
    return out;
  });
  expect(hits.length, 'no readable element was on screen, so nothing was hit tested').toBeGreaterThan(0);
  for (const h of hits) {
    expect(h.hit, `${h.id} is covered by the canvas`).not.toBe('canvas');
    expect(h.own, `${h.id} did not receive its own hit at its centre`).toBe(true);
  }
});

test('a canvas measured while display:none is deferred, never sized to the default, and recovers on its own', async ({ page }) => {
  const boot = await openHarness(page, '?hidecanvas=1');
  const positions = await stageScrollPositions(page);
  await page.evaluate((y) => window.__cine.rawScrollTo(0, y), positions[4]);
  await page.waitForTimeout(300);

  const deferred = await page.evaluate(() => window.__cine.lastOf('measure-deferred'));
  expect(deferred, 'a zero box canvas was sized without a word').not.toBeNull();
  expect(deferred.reason).toBe('zero-box');

  const backing = await page.evaluate(() => window.__cine.canvasBacking());
  expect(backing.cssWidth).toBe(0);
  expect({ w: backing.width, h: backing.height },
    'the engine wrote a backing store size derived from a zero box; that is how a page ends up drawing at a ninth of its resolution in silence').toEqual({ w: 300, h: 150 });
  expect(await page.evaluate(() => window.__cine.stageA.paintedIndex),
    'paintedIndex was set optimistically while nothing had been drawn').toBeNull();
  expect(await page.evaluate(() => window.__cine.countOf('painted'))).toBe(0);

  const refused = await canvasMetrics(page, CANVAS_A).then(() => null, (e) => e);
  expect(refused, 'canvasMetrics measured a display:none canvas instead of refusing it').not.toBeNull();

  // Now un-hide it, and touch nothing else. The engine must notice by itself.
  await page.evaluate(() => window.__cine.showCanvas());
  await page.waitForFunction(() => window.__cine.stageA.paintedIndex !== null, undefined, { timeout: 8000 });

  const metrics = await canvasMetrics(page, CANVAS_A);
  expect(metrics.backingWidth).not.toBe(300);
  const expected = await expectedFrameIndex(page, STAGE_A, boot.frameCount);
  await page.waitForFunction((i) => window.__cine.stageA.paintedIndex === i, expected.index, { timeout: 8000 });
  const read = await readCanvasFrame(page, CANVAS_A, variantA());
  expect(read.frameIndex, 'after recovering it painted the wrong frame').toBe(expected.index);
});

test('a frame that is not resident keeps the last good frame on screen and never blanks the canvas', async ({ page }) => {
  const boot = await openHarness(page);
  const variant = variantA();
  const positions = await stageScrollPositions(page);

  await scrollTo(page, positions[3], boot.frameCount);
  const good = (await readCanvasFrame(page, CANVAS_A, variant)).frameIndex;

  // Withhold everything the loader could return from here on.
  await page.evaluate((n) => window.__cine.hold(Array.from({ length: n }, (_, i) => i)), boot.frameCount);
  await page.evaluate((y) => window.__cine.rawScrollTo(0, y), positions[6]);
  await page.waitForFunction(() => window.__cine.countOf('skipped') > 0, undefined, { timeout: 8000 });

  const still = await readCanvasFrame(page, CANVAS_A, variant);
  expect(still.frameIndex, 'the engine cleared or repainted the canvas when the frame was missing').toBe(good);
  expect(await page.evaluate(() => window.__cine.stageA.paintedIndex)).toBe(good);
  expect(await page.evaluate(() => window.__cine.stageA.frameIndex),
    'the engine did not even advance its intended index').not.toBe(good);

  // And the bounded wait stops: it does not poll forever behind a missing frame.
  await page.waitForFunction(() => window.__cine.countOf('wait-timeout') > 0, undefined, { timeout: 8000 });
  await page.waitForTimeout(400);
  const a = await page.evaluate(() => window.__cine.rafCalls);
  await page.waitForTimeout(700);
  const b = await page.evaluate(() => window.__cine.rafCalls);
  expect(b - a, 'the engine is still polling for a frame that never arrives').toBe(0);

  // Releasing the frames and nudging the page repaints correctly.
  await page.evaluate(() => window.__cine.release());
  const expected = await scrollTo(page, positions[7], boot.frameCount);
  expect((await readCanvasFrame(page, CANVAS_A, variant)).frameIndex).toBe(expected);
});

test('a stage started in a background tab is paused, not stranded', async ({ page }) => {
  const boot = await openHarness(page, '?starthidden=1');

  expect(await page.evaluate(() => window.__cine.rafCalls),
    'the engine scheduled rendering work in a tab that was never visible').toBe(0);
  expect(await page.evaluate(() => window.__cine.stageA.paintedIndex)).toBeNull();
  expect(await page.evaluate(() => window.__cine.loaderA.state.paused),
    'loading was left running in a background tab').toBe(true);
  const paused = await page.evaluate(() => window.__cine.lastOf('paused'));
  expect(paused, 'starting hidden was neither scheduled nor reported').not.toBeNull();
  expect(paused.reason).toBe('started-hidden');

  /* The tab comes forward. Nothing else happens: no scroll, no resize. If the
     engine only ever schedules from a pause it did not itself record, this is
     where the stage is stranded on its poster forever with nothing in the
     console. */
  await page.evaluate(() => window.__cine.setHidden(false));
  await page.waitForFunction(() => window.__cine.stageA.paintedIndex !== null, undefined, { timeout: 8000 });

  const expected = await expectedFrameIndex(page, STAGE_A, boot.frameCount);
  await page.waitForFunction((i) => window.__cine.stageA.paintedIndex === i, expected.index, { timeout: 8000 });
  expect((await readCanvasFrame(page, CANVAS_A, variantA())).frameIndex).toBe(expected.index);
});

test('an unmarked canvas is reported rather than painted on quietly', async ({ page }) => {
  await openHarness(page, '?stripAria=1');
  const reported = await page.evaluate(() => window.__cine.lastOf('aria-missing'));
  expect(reported, 'the engine painted into a canvas with no presentational marking and said nothing').not.toBeNull();
  expect(reported.role).toBeNull();
  expect(reported.ariaHidden).toBeNull();

  const wrote = await page.evaluate(() => {
    const c = document.querySelector('#stage-a canvas[data-cine-canvas]');
    return { role: c.getAttribute('role'), ariaHidden: c.getAttribute('aria-hidden') };
  });
  /* Reporting, not repairing: the attributes belong to fallback.js, and a stage
     that quietly fixed them would hide the bug from the module that owns it. */
  expect(wrote).toEqual({ role: null, ariaHidden: null });
});

test('a stage with no scroll range says so instead of mapping against nothing', async ({ page }) => {
  await openHarness(page, '?nocss=1');
  await page.evaluate(() => window.__cine.rawScrollTo(0, 400));
  await page.waitForTimeout(300);

  const declaredVh = localPlaceholderManifest().sequences
    .find((s) => s.id === 'signal-to-system').stage.scrollLengthVh;
  const short = await page.evaluate(() => window.__cine.lastOf('stage-length-short'));
  expect(short, 'nothing reported that the rendered stage is far shorter than the manifest declares').not.toBeNull();
  expect(short.declaredVh, 'the engine reported a length it did not read from the manifest').toBe(declaredVh);
  expect(short.actualVh).toBeLessThan(declaredVh * 0.6);

  // It reports once, not once per animation frame.
  await page.evaluate(() => window.__cine.rawScrollTo(0, 900));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__cine.countOf('stage-length-short'))).toBe(1);

  /* Shrink the collapsed stage below the viewport and the mapping has no range
     at all. expectedFrameIndex() refuses to measure that, so the engine has to
     be the thing that says why. */
  const stageHeight = await page.evaluate(() => document.getElementById('stage-a').getBoundingClientRect().height);
  await page.setViewportSize({ width: 1440, height: Math.ceil(stageHeight) + 120 });
  await page.evaluate(() => window.__cine.rawScrollTo(0, 300));
  await page.waitForFunction(() => window.__cine.countOf('no-scroll-range') > 0, undefined, { timeout: 8000 });
  const noRange = await page.evaluate(() => window.__cine.lastOf('no-scroll-range'));
  expect(noRange.stageHeight).toBeLessThanOrEqual(noRange.viewport);
  expect(await page.evaluate(() => window.__cine.stageA.progress),
    'with no scroll range the engine invented a progress value').toBe(0);
});

test('a viewport height change mid scroll does not shift the mapping', async ({ page }) => {
  const boot = await openHarness(page);
  const variant = variantA();
  const positions = await stageScrollPositions(page);
  await scrollTo(page, positions[4], boot.frameCount);

  /* The iOS URL bar collapse in the only form a desktop runner can produce it:
     the viewport height changes while the scroll position does not. An engine
     that cached stageHeight or innerHeight keeps mapping against the old
     denominator and quietly paints the wrong frame from here on. */
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.waitForTimeout(300);

  const expected = await expectedFrameIndex(page, STAGE_A, boot.frameCount);
  await page.waitForFunction((i) => window.__cine.stageA.paintedIndex === i, expected.index, { timeout: 8000 });
  const read = await readCanvasFrame(page, CANVAS_A, variant);
  expect(read.frameIndex, 'after the viewport shrank the engine is painting against stale geometry').toBe(expected.index);

  await canvasMetrics(page, CANVAS_A);   // and the backing store followed the new box

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(300);
  const back = await expectedFrameIndex(page, STAGE_A, boot.frameCount);
  await page.waitForFunction((i) => window.__cine.stageA.paintedIndex === i, back.index, { timeout: 8000 });
  expect((await readCanvasFrame(page, CANVAS_A, variant)).frameIndex).toBe(back.index);
});

/* ── the animation callback count, asserted exactly ──────────────────────────
   These drive a second stage through a MANUAL animation clock, so "exactly one
   loop" is a number rather than a race. */

test('exactly one animation callback is ever outstanding, across start, scroll bursts and repeated resumes', async ({ page }) => {
  await openHarness(page);
  await page.evaluate(() => window.__cine.startManual());

  const pending = () => page.evaluate(() => window.__cine.manual.pending());

  expect(await pending(), 'start() did not request a frame').toBe(1);

  await page.evaluate(() => window.__cine.stageB.start());   // idempotent
  await page.evaluate(() => window.__cine.stageB.start());
  expect(await pending(), 'a second start() opened a second render loop').toBe(1);

  /* Everything below runs inside single evaluates, synchronously. Between two
     round trips a resize or intersection observation can legitimately land and
     request a frame, which would make an exact count racy rather than wrong. */
  const drained = await page.evaluate(() => {
    const m = window.__cine.manual;
    return { ran: m.flush(), pending: m.pending() };
  });
  expect(drained.ran, 'more than one callback was outstanding at once').toBe(1);
  expect(drained.pending, 'the tick rescheduled itself, so the loop never stops').toBe(0);

  const burst = await page.evaluate(() => {
    const m = window.__cine.manual;
    m.flush();
    const before = m.requests;
    window.__cine.fireScroll(20);
    return { added: m.requests - before, pending: m.pending() };
  });
  expect(burst.added, '20 scroll notifications requested more than one animation frame').toBe(1);
  expect(burst.pending, '20 scroll notifications produced more than one outstanding callback').toBe(1);

  // hidden -> visible, four times over. This is the duplicate loop mutation.
  const cycle = await page.evaluate(() => {
    const m = window.__cine.manual;
    const out = [];
    for (let i = 0; i < 4; i += 1) {
      m.flush();
      window.__cine.setHidden(true);
      out.push({ i, phase: 'hidden', pending: m.pending() });
      window.__cine.fireScroll(5);
      out.push({ i, phase: 'scrolled-while-hidden', pending: m.pending() });
      window.__cine.setHidden(false);
      out.push({ i, phase: 'visible', pending: m.pending() });
      window.__cine.setHidden(false);
      out.push({ i, phase: 'visible-again', pending: m.pending() });
    }
    return out;
  });
  for (const step of cycle) {
    const expected = step.phase === 'hidden' || step.phase === 'scrolled-while-hidden' ? 0 : 1;
    expect(step.pending,
      `cycle ${step.i} at "${step.phase}" had ${step.pending} outstanding animation callbacks, expected ${expected}`).toBe(expected);
  }

  const diags = await page.evaluate(() => window.__cine.diagnostics.filter((d) => d.stage === 'B').map((d) => d.type));
  expect(diags.filter((t) => t === 'paused').length, 'pause was emitted for events that were not a real transition').toBe(4);
  expect(diags.filter((t) => t === 'resumed').length).toBe(4);

  const loader = await page.evaluate(() => ({ ...window.__cine.loaderB.state }));
  expect(loader.pauseCalls, 'the loader was paused a different number of times than the page was hidden').toBe(4);
  expect(loader.resumeCalls).toBe(4);
  expect(loader.paused).toBe(false);
  expect(await page.evaluate(() => window.__cine.fatalCalls)).toBe(0);
});

test('resuming re-derives the index from the live scroll position rather than catching up', async ({ page }) => {
  const boot = await openHarness(page);
  const variant = variantA();
  const positions = await stageScrollPositions(page);
  await scrollTo(page, positions[2], boot.frameCount);
  const before = (await readCanvasFrame(page, CANVAS_A, variant)).frameIndex;

  await page.evaluate(() => window.__cine.setHidden(true));
  expect(await page.evaluate(() => window.__cine.loaderA.state.paused), 'hiding the page did not pause the loader').toBe(true);

  const frozen = await page.evaluate(() => window.__cine.rafCalls);
  await page.evaluate((y) => window.__cine.rawScrollTo(0, y), positions[7]);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__cine.rafCalls) - frozen,
    'the engine kept rendering while the document was hidden').toBe(0);
  expect((await readCanvasFrame(page, CANVAS_A, variant)).frameIndex,
    'the canvas changed while the page was hidden').toBe(before);

  await page.evaluate(() => window.__cine.setHidden(false));
  const expected = await expectedFrameIndex(page, STAGE_A, boot.frameCount);
  await page.waitForFunction((i) => window.__cine.stageA.paintedIndex === i, expected.index, { timeout: 8000 });
  const after = (await readCanvasFrame(page, CANVAS_A, variant)).frameIndex;
  expect(after, 'on resume the engine did not land on the frame the current scroll position implies').toBe(expected.index);
  expect(after, 'on resume the engine replayed the frames it missed instead of jumping straight to the live position').not.toBe(before);
  expect(await page.evaluate(() => window.__cine.countOf('painted')),
    'the engine caught up frame by frame instead of painting once').toBeLessThan(12);
});
