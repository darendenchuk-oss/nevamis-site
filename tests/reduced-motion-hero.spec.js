/* What a reduced-motion visitor is actually shown.
 *
 * prefers-reduced-motion asks for less MOVEMENT. It is not a request for less
 * information. This file was written for the pre-film hero (#story .step,
 * #status), which read it as both; that hero is gone, and from 2026-09 until
 * 2026-10-03 both of its tests failed on elements that no longer exist (audit
 * CHECK-RUNNER-5), which hid the real defect on the same path: the film's
 * reduced-motion branch showed its first line and then three blank spaces,
 * the last of them an invisible button (CHECK-RUNNER-3).
 *
 * Retargeted at the film homepage. A reduced-motion visitor gets the film as
 * one still frame and its story as plain text stacked under it (.nv-rm), so
 * this asserts what that visitor reads:
 *   - every story block and the ending are visible, in reading order, none
 *     on top of another
 *   - the ending offers Book a call first (decision #54) and both its actions
 *     take a tap
 *   - the page's one headline is whole
 *   - nothing is left animating
 */
import { test, expect } from '@playwright/test';

/* Set explicitly rather than through test.use: playwright.config.js pins
   reducedMotion:'no-preference' for the whole run, and emulateMedia before
   navigation is what the browser itself does - the preference has to be true
   at script-execution time, because the film reads matchMedia once on load. */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('the film reads as text: every block is visible, in order, and none overlaps another', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => document.documentElement.classList.contains('nv-rm')),
    'the film must have taken its reduced-motion path').toBe(true);

  const blocks = await page.evaluate(() => ['s1', 's2', 's3', 'close'].map((id) => {
    const el = document.getElementById(id);
    let o = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || '1');
    const b = el.getBoundingClientRect();
    return { id, opacity: o, top: b.top + scrollY, bottom: b.bottom + scrollY, text: el.textContent.replace(/\s+/g, ' ').trim() };
  }));
  for (const b of blocks) {
    expect(b.opacity, `#${b.id} ("${b.text.slice(0, 40)}") is not readable`).toBeGreaterThan(0.9);
    expect(b.text.length, `#${b.id} has words in it`).toBeGreaterThan(10);
  }
  for (let i = 1; i < blocks.length; i++) {
    expect(blocks[i].top, `#${blocks[i].id} starts above the end of #${blocks[i - 1].id}`).toBeGreaterThanOrEqual(blocks[i - 1].bottom - 0.5);
  }
});

test('the ending offers Book a call first, and both of its actions take a tap', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const acts = page.locator('#close a');
  expect(await acts.count()).toBe(2);
  expect((await acts.nth(0).textContent()).trim()).toBe('Book a call');
  expect((await acts.nth(1).textContent()).trim()).toBe('Scan my website');
  for (let i = 0; i < 2; i++) {
    const a = acts.nth(i);
    await a.scrollIntoViewIfNeeded();
    const hit = await a.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return !!at && (at === el || el.contains(at));
    });
    expect(hit, `"${(await a.textContent()).trim()}" takes the tap where it is drawn`).toBe(true);
  }
});

test('the headline is whole', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.locator('#found h1').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const h1 = document.querySelector('#found h1');
    const b = h1.getBoundingClientRect();
    let o = 1;
    for (let n = h1; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || '1');
    return { text: h1.textContent.trim(), opacity: o, clipped: h1.scrollWidth > h1.clientWidth + 1, inside: b.right <= document.documentElement.clientWidth };
  });
  expect(r).toEqual({ text: 'More of the customers you want.', opacity: 1, clipped: false, inside: true });
});

/* The reason the branch exists. If this ever fails, something is animating for
   a visitor who asked for stillness, and the fixes above are not worth having
   at that price. */
test('nothing is left running', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const running = await page.evaluate(() => document.getAnimations()
    .filter((a) => a.playState === 'running')
    .map((a) => (a.effect && a.effect.target ? (a.effect.target.id || a.effect.target.className || a.effect.target.tagName) : '?') + ' ' + (a.animationName || a.transitionProperty || '')));
  expect(running, `still animating: ${running.join(', ')}`).toEqual([]);
});
