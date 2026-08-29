/* The loading and decode layer, against a real browser and real bytes.
   Run:  NV_PORT=3291 npx playwright test tests/cinematic-loader.spec.js

   The policy is proved deterministically in Node by scripts/check-cinematic-loader.mjs
   with fetch injected. What can only be proved here is that the same module,
   loaded as a browser ES module, fetches real PNGs, decodes them with
   createImageBitmap, respects its window against real decoded images, and picks
   the MOBILE composition on a phone viewport rather than a cropped desktop one.

   assertServingThisWorktree() runs first in every test. Another agent is running
   its own suite on the default port; a spec that attaches to a stranger's server
   passes while measuring the wrong application. */
import { test, expect } from '@playwright/test';
import { assertServingThisWorktree, localPlaceholderManifest, variantOf } from './helpers/cinematic.js';

const HARNESS = '/tests/fixtures/cinematic-loader-harness.html';
const FRAME_RE = /\/artifacts\/cinematic-placeholders\/([a-z-]+)\/(desktop|mobile)\/f(\d{4})\.png$/;

/** Every frame request the page made, decomposed. The network is the evidence:
    it cannot be faked by a module reporting what it meant to do. */
function watchFrameRequests(page) {
  const seen = [];
  page.on('request', (req) => {
    const m = FRAME_RE.exec(new URL(req.url()).pathname);
    if (m) seen.push({ url: req.url(), sequence: m[1], variant: m[2], index: Number(m[3]) });
  });
  return seen;
}

async function openHarness(page) {
  await page.goto(HARNESS);
  await page.waitForFunction(() => window.__cine && (window.__cine.ready || window.__cine.error));
  const err = await page.evaluate(() => window.__cine.error);
  expect(err, 'the loader harness failed to boot').toBeNull();
}

test('an offscreen sequence makes no network requests until it approaches', async ({ page }) => {
  await assertServingThisWorktree(page);
  const requests = watchFrameRequests(page);
  await openHarness(page);

  // The first stage is at the top of the document, so it activates at once.
  await page.evaluate(() => window.__cine.awaitPrime('signal-to-system'));
  await page.evaluate(() => window.__cine.quiesce('signal-to-system'));

  const offscreen = requests.filter((r) => r.sequence === 'system-to-outcomes');
  expect(
    offscreen.map((r) => r.url),
    'the second sequence is 2400px down the page and was never primed, yet it fetched frames',
  ).toEqual([]);
  expect(await page.evaluate(() => window.__cine.info('system-to-outcomes').activated)).toBe(false);
  expect(await page.evaluate(() => window.__cine.stats('system-to-outcomes').requested)).toBe(0);
  expect(await page.evaluate(() => window.__cine.stats('system-to-outcomes').bytes)).toBe(0);

  // Bring it within the activation margin. Now, and only now, it loads.
  await page.evaluate(() => document.getElementById('stage-system-to-outcomes').scrollIntoView());
  await page.waitForFunction(() => window.__cine.info('system-to-outcomes').activated === true, null, { timeout: 5000 });
  await page.evaluate(() => window.__cine.awaitPrime('system-to-outcomes'));

  const nowLoaded = requests.filter((r) => r.sequence === 'system-to-outcomes');
  expect(nowLoaded.length, 'approaching the second sequence did not start loading it').toBeGreaterThan(0);
});

test('the skeleton pass buys a usable scrubber for a handful of real frames', async ({ page }) => {
  await assertServingThisWorktree(page);
  const requests = watchFrameRequests(page);
  await openHarness(page);

  const result = await page.evaluate(() => window.__cine.awaitPrime('signal-to-system'));
  expect(result.ok, 'prime() reported failure against real placeholder frames').toBe(true);

  const info = await page.evaluate(() => window.__cine.info('signal-to-system'));
  const snap = await page.evaluate(() => window.__cine.skeletonPass('signal-to-system'));
  const stride = info.stats.strides[0];
  const anchors = new Set();
  for (let i = 0; i < info.frameCount; i += stride) anchors.add(i);
  anchors.add(info.frameCount - 1);

  expect(snap, 'stride pass 1 never reported completing').not.toBeNull();
  expect(snap.requested, `stride pass 1 had requested ${snap.requested} of ${info.frameCount} frames`).toBe(anchors.size);
  expect(result.requested).toBe(anchors.size);

  /* Network evidence, not a counter the module keeps: the FIRST requests off
     the wire are exactly the skeleton indices, in no particular order. */
  const skeleton = requests.filter((r) => r.sequence === 'signal-to-system').slice(0, anchors.size);
  expect(new Set(skeleton.map((r) => r.index)), 'the first requests off the wire were not the stride skeleton')
    .toEqual(anchors);

  // The point of the skeleton: nothing is further than one stride from a frame.
  const worst = await page.evaluate(() => window.__cine.worstGap('signal-to-system'));
  expect(worst, 'a scroll position sits further than one stride from any decoded frame').toBeLessThanOrEqual(stride);

  expect(snap.bytes, `the skeleton cost ${snap.bytes} bytes`).toBeGreaterThan(0);
  expect(snap.bytes, `the skeleton cost ${snap.bytes} bytes; a usable scrubber must be tens of kilobytes, not the whole ${info.frameCount} frame sequence`).toBeLessThan(120000);
});

test('the decode window is a hard cap against real ImageBitmaps', async ({ page }) => {
  await assertServingThisWorktree(page);
  await openHarness(page);
  await page.evaluate(() => window.__cine.awaitPrime('signal-to-system'));

  const info = await page.evaluate(() => window.__cine.info('signal-to-system'));
  const { peak, stats } = await page.evaluate(() => window.__cine.scrub('signal-to-system', 6));

  expect(peak, `decoded frames peaked at ${peak} against a declared cap of ${info.stats.decodeWindow}`)
    .toBeLessThanOrEqual(info.stats.decodeWindow);
  expect(peak, `decoded frames never exceeded ${peak}; the window is not being filled and the scrubber stays coarse`).toBeGreaterThanOrEqual(8);
  expect(stats.evicted, 'a full scrub of the sequence evicted nothing, so the cap was never exercised').toBeGreaterThan(0);
  expect(stats.requested, 'a full scrub requested more frames than the sequence has, so frames are being refetched in a loop')
    .toBeLessThanOrEqual(info.frameCount + info.stats.decodeWindow);
  expect(stats.residentIndices.length).toBe(stats.resident);
});

test('a phone viewport gets the mobile composition, not a cropped desktop one', async ({ page }) => {
  await assertServingThisWorktree(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = watchFrameRequests(page);
  await openHarness(page);
  await page.evaluate(() => window.__cine.awaitPrime('signal-to-system'));

  const info = await page.evaluate(() => window.__cine.info('signal-to-system'));
  const mobile = variantOf(localPlaceholderManifest(), 'signal-to-system', 'mobile');
  const desktop = variantOf(localPlaceholderManifest(), 'signal-to-system', 'desktop');

  expect(info.variantName).toBe('mobile');
  expect(info.orientation).toBe('portrait');
  expect([info.width, info.height]).toEqual([mobile.width, mobile.height]);
  expect(info.frameCount, 'the phone was given the desktop frame count').toBe(mobile.frameCount);
  expect(info.frameCount).not.toBe(desktop.frameCount);

  const fetched = requests.filter((r) => r.sequence === 'signal-to-system');
  expect(fetched.length).toBeGreaterThan(0);
  expect(
    fetched.filter((r) => r.variant !== 'mobile').map((r) => r.url),
    'a phone viewport fetched desktop frames',
  ).toEqual([]);
});

test('a desktop viewport gets the desktop composition', async ({ page }) => {
  await assertServingThisWorktree(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const requests = watchFrameRequests(page);
  await openHarness(page);
  await page.evaluate(() => window.__cine.awaitPrime('signal-to-system'));

  const info = await page.evaluate(() => window.__cine.info('signal-to-system'));
  const desktop = variantOf(localPlaceholderManifest(), 'signal-to-system', 'desktop');
  expect(info.variantName).toBe('desktop');
  expect(info.frameCount).toBe(desktop.frameCount);

  const fetched = requests.filter((r) => r.sequence === 'signal-to-system');
  expect(fetched.length).toBeGreaterThan(0);
  expect(
    fetched.filter((r) => r.variant !== 'desktop').map((r) => r.url),
    'a desktop viewport fetched mobile frames',
  ).toEqual([]);
});

test('fast scrolling aborts obsolete requests instead of queueing them', async ({ page }) => {
  await assertServingThisWorktree(page);
  await openHarness(page);
  await page.evaluate(() => window.__cine.awaitPrime('signal-to-system'));

  const outcome = await page.evaluate(async () => {
    const api = window.__cine;
    // Jump end to end without waiting, the way a flung scroll arrives.
    for (const i of [0, 95, 4, 90, 12, 80, 40]) api.setFocus('signal-to-system', i);
    await api.quiesce('signal-to-system', 6000);
    const s = api.stats('signal-to-system');
    const events = api.diagnostics('signal-to-system');
    return {
      aborted: events.filter((e) => e.type === 'aborted' && e.reason === 'scroll').length,
      failed: s.failed,
      resident: s.resident,
      decodeWindow: s.decodeWindow,
      requested: s.requested,
      frameCount: s.frameCount,
    };
  });

  expect(outcome.aborted, 'seven end to end jumps aborted nothing; obsolete requests are being left to complete').toBeGreaterThan(0);
  expect(outcome.failed, 'aborted requests were counted as failures, which would blacklist every frame a fast scroll passed').toBe(0);
  expect(outcome.resident).toBeLessThanOrEqual(outcome.decodeWindow);
  expect(outcome.requested, 'a flung scroll queued more requests than the sequence has frames')
    .toBeLessThanOrEqual(outcome.frameCount * 2);
});
