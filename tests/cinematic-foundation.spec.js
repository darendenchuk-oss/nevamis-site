/* Proves the FOUNDATION, not the engine, which does not exist yet.
   Run:  NV_PORT=3291 npx playwright test tests/cinematic-foundation.spec.js

   Three agents are about to build the loader, the stage and the fallback layer
   on top of tests/helpers/cinematic.js. If that helper is wrong, all three
   inherit a guard that passes against a broken engine. So it is measured here
   against a browser, with the negative cases exercised positively: a canvas that
   was never sized must be REFUSED, and a canvas with no frame code must decode
   as 'no-code' rather than as a number. */
import { test, expect } from '@playwright/test';
import {
  assertServingThisWorktree, canvasMetrics, readCanvasFrame,
  localPlaceholderManifest, variantOf,
} from './helpers/cinematic.js';
import { frameIndexForProgress } from '../assets/cinematic/manifest.js';

const HARNESS = '/tests/fixtures/cinematic-harness.html';
const STAGE = '#stage';

async function openHarness(page) {
  await assertServingThisWorktree(page);
  await page.goto(HARNESS);
  await page.waitForFunction(() => window.__harness && (window.__harness.ready || window.__harness.error));
  const err = await page.evaluate(() => window.__harness.error);
  expect(err, 'the harness failed to load and validate the placeholder manifest in a real browser').toBeNull();
  return page.evaluate(() => ({
    variantName: window.__harness.variantName,
    frameCount: window.__harness.variant.frameCount,
    generatedAt: window.__harness.manifestGeneratedAt,
  }));
}

test('the served manifest is this worktree\'s, and manifest.js validates it in a browser', async ({ page }) => {
  const sentinel = await assertServingThisWorktree(page);
  const info = await openHarness(page);
  expect(info.variantName).toBe('desktop'); // the project viewport is 1440x900
  expect(info.generatedAt).toBe(sentinel.generatedAt);
  expect(info.frameCount).toBe(variantOf(localPlaceholderManifest(), 'signal-to-system', 'desktop').frameCount);
});

test('the painted frame index is read back off the canvas, exactly', async ({ page }) => {
  const info = await openHarness(page);
  const variant = variantOf(localPlaceholderManifest(), 'signal-to-system', 'desktop');
  const n = info.frameCount;
  const indices = [0, 1, 7, Math.floor(n / 3), Math.floor(n / 2), n - 2, n - 1];
  for (const i of indices) {
    await page.evaluate((k) => window.__harness.draw(k), i);
    const read = await readCanvasFrame(page, STAGE, variant);
    expect(read.frameIndex, `painted frame ${i} but the canvas reads ${read.frameIndex}`).toBe(i);
    expect(read.sequenceId).toBe('signal-to-system');
  }
});

test('upward traversal retraces the same integers, in reverse', async ({ page }) => {
  const info = await openHarness(page);
  const variant = variantOf(localPlaceholderManifest(), 'signal-to-system', 'desktop');
  const n = info.frameCount;
  // Progress positions, not frame numbers: this is the mapping the stage will use.
  const progresses = [0, 0.12, 0.25, 0.4, 0.63, 0.8, 1];
  const expected = progresses.map((p) => frameIndexForProgress(p, n));

  const down = [];
  for (const p of progresses) {
    await page.evaluate((k) => window.__harness.draw(k), frameIndexForProgress(p, n));
    down.push((await readCanvasFrame(page, STAGE, variant)).frameIndex);
  }
  const up = [];
  for (const p of [...progresses].reverse()) {
    await page.evaluate((k) => window.__harness.draw(k), frameIndexForProgress(p, n));
    up.push((await readCanvasFrame(page, STAGE, variant)).frameIndex);
  }
  expect(down).toEqual(expected);
  expect(up).toEqual([...expected].reverse());
});

test('a canvas that was never sized is refused, not measured', async ({ page }) => {
  await openHarness(page);
  const info = await page.evaluate(() => window.__harness.sizeHidden());
  expect(info.sized, 'a display:none canvas reported a usable box, which the harness must not claim').toBe(false);
  const thrown = await canvasMetrics(page, '#hidden').then(() => null, (e) => e);
  expect(thrown, 'canvasMetrics measured a display:none canvas instead of refusing it').not.toBeNull();
  expect(String(thrown.message)).toMatch(/CSS box/);
});

test('a canvas with no frame code decodes as no-code, never as a number', async ({ page }) => {
  await openHarness(page);
  const variant = variantOf(localPlaceholderManifest(), 'signal-to-system', 'desktop');
  const sized = await page.evaluate(() => window.__harness.paintPlain());
  expect(sized.sized).toBe(true);
  expect(sized.backingWidth).not.toBe(300);
  const thrown = await readCanvasFrame(page, '#plain', variant).then((r) => r, (e) => e);
  expect(thrown instanceof Error, `a codeless canvas decoded as frame ${thrown && thrown.frameIndex}; the decoder invents indices`).toBe(true);
  expect(String(thrown.message)).toMatch(/no-code/);
});
