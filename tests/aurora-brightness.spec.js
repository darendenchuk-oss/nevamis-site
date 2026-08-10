/* The sky may breathe when you scroll. It may not flare.
 *
 * Two channels answer scrolling and they stack: velocity, and a pulse when a
 * section enters (assets/motion/scroll.js). Measured on production, an
 * ordinary wheel scroll drove energy to 0.96 of 1, and clicking an in-page
 * anchor drove it to 0.96 and held it above 0.8 for 41 frames - the brightest,
 * longest surge on the page came from following a link. The shader spends
 * energy as `master = 0.70 + uEnergy * 0.55`, so the sky went from 0.70 gain
 * at rest to 1.23: 76% brighter for scrolling normally.
 *
 * Both bounds matter. A cap alone could be "satisfied" by switching the effect
 * off, so these also assert the sky still answers.
 */
import { test, expect } from '@playwright/test';

/** Mirrors SCROLL_CEIL in assets/motion/aurora.js. */
const CEILING = 0.45;

async function auroraReady(page) {
  await page.goto('/');
  await page.waitForTimeout(2500);
  return page.evaluate(() => !!(window.__aurora && typeof window.__aurora.energy === 'function'));
}

/** Peak energy observed across a gesture, sampled every frame. */
async function peakDuring(page, gesture) {
  await page.evaluate(() => {
    window.__peak = 0;
    const tick = () => {
      window.__peak = Math.max(window.__peak, window.__aurora.energy());
      window.__raf = requestAnimationFrame(tick);
    };
    tick();
  });
  await gesture();
  await page.waitForTimeout(800);
  return page.evaluate(() => { cancelAnimationFrame(window.__raf); return +window.__peak.toFixed(3); });
}

const GESTURES = [
  ['a normal wheel scroll', async (page) => {
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(60); }
  }],
  ['a fast flick', async (page) => {
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(30); }
  }],
  /* The worst case before the fix, and the least dramatic act: a link. */
  ['following an in-page anchor', async (page) => {
    await page.evaluate(() => { location.hash = '#roi'; });
    await page.waitForTimeout(900);
  }],
];

for (const [label, gesture] of GESTURES) {
  test(`${label} cannot flare the sky`, async ({ page }) => {
    test.skip(!(await auroraReady(page)), 'no live aurora in this environment');
    const peak = await peakDuring(page, () => gesture(page));
    expect(
      peak,
      `${label} drove aurora energy to ${peak}. Scroll-driven light is ceilinged at ${CEILING}; `
      + `above it the shader master gain passes 0.95 and the background reads as flashing.`,
    ).toBeLessThanOrEqual(CEILING + 0.01);
  });
}

/* The other half. A ceiling is trivially satisfiable by turning the effect
   off, and "the sky answers the visitor" is the whole point of it. */
test('the sky still answers a scroll', async ({ page }) => {
  test.skip(!(await auroraReady(page)), 'no live aurora in this environment');
  const rest = await page.evaluate(() => +window.__aurora.energy().toFixed(3));
  const peak = await peakDuring(page, async () => {
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 300); await page.waitForTimeout(60); }
  });
  expect(rest, 'a still page should be calm').toBeLessThan(0.15);
  expect(peak, 'a capped sky that never lifts is a disabled sky, not a fixed one').toBeGreaterThan(0.15);
});

/* It has to come back down, or the ceiling just becomes the new resting state. */
test('the sky settles once scrolling stops', async ({ page }) => {
  test.skip(!(await auroraReady(page)), 'no live aurora in this environment');
  await page.evaluate(() => { for (let i = 0; i < 5; i++) window.scrollBy(0, 600); });
  await page.waitForTimeout(2500);
  const settled = await page.evaluate(() => +window.__aurora.energy().toFixed(3));
  expect(settled, `energy settled at ${settled}; it should decay back toward calm`).toBeLessThan(0.15);
});
