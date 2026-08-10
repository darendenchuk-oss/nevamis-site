/* The scheduler frame has to be tall enough to show the month.
 *
 * Cal.com posts no dimension events, so the height is ours to declare — and it
 * was declared twice. book.html carried 940px (1120px narrow) and site.js
 * hardcoded 680px for the homepage embed, with background:#fff on a dark page.
 * Nobody re-measured either.
 *
 * Measured inside the live iframe at six widths, taking the bottom of the last
 * day cell of a six-row month (scratchpad script kept out of the repo; the
 * numbers are recorded here because they are what the floor below means):
 *
 *            needs (book / homepage)    had
 *   390px        683 / 683              1120 / 680   homepage clipped 3px
 *   768px        925 / 969               940 / 680   homepage clipped 289px
 *  1024px+       951 / 1015              940 / 680   BOTH clipped, 11 / 335
 *
 * So above 768px the page that exists to take bookings showed August 1st to
 * 8th and nothing else.
 *
 * These tests do NOT drive cal.com. A suite that loads a third party on every
 * run buys a little coverage and a lot of flakiness. They pin the two things
 * that actually failed: the surfaces disagreeing, and the declared height
 * dropping below what a six-row month needs.
 */
import { test, expect } from '@playwright/test';

/** The worst requirement measured across both surfaces, at 1024px and wider. */
const NEEDED = 1015;

const WIDE = { width: 1280, height: 900 };
const NARROW = { width: 390, height: 844 };

/** The homepage embed is injected by site.js when its host scrolls into view. */
async function homepageFrame(page) {
  await page.goto('/');
  await page.evaluate(() => {
    const h = document.querySelector('[data-book-src]');
    if (h) h.scrollIntoView();
  });
  await page.waitForSelector('iframe.nv-cal-frame', { timeout: 15000 });
  return page.locator('iframe.nv-cal-frame');
}

test('the booking page frame clears a six-row month', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/book.html');
  const h = await page.locator('#bkFrame').evaluate((el) => el.getBoundingClientRect().height);
  expect(h, `${h}px leaves the last week of the month below the frame`).toBeGreaterThanOrEqual(NEEDED);
});

test('the homepage scheduler frame clears a six-row month', async ({ page }) => {
  await page.setViewportSize(WIDE);
  const frame = await homepageFrame(page);
  const h = await frame.evaluate((el) => el.getBoundingClientRect().height);
  expect(h, `${h}px shows the first week and hides the rest, at the conversion moment`)
    .toBeGreaterThanOrEqual(NEEDED);
});

test('both schedulers are the same height, because they are the same thing', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/book.html');
  const a = await page.locator('#bkFrame').evaluate((el) => el.getBoundingClientRect().height);
  const frame = await homepageFrame(page);
  const b = await frame.evaluate((el) => el.getBoundingClientRect().height);
  expect(b, `book.html declares ${a}px and the homepage declares ${b}px — two constants again`).toBe(a);
});

test('the narrow layout is still tall enough', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto('/book.html');
  const h = await page.locator('#bkFrame').evaluate((el) => el.getBoundingClientRect().height);
  /* Narrow stacks the booker, so it needs MORE room, not less. */
  expect(h).toBeGreaterThanOrEqual(NEEDED);
});

/* One declaration. The drift is the actual defect here — the heights were only
   wrong because there were two of them and nobody re-measured the second. */
test('neither page carries its own scheduler height', async ({ page }) => {
  await page.goto('/book.html');
  const inlineHeight = await page.locator('#bkFrame').getAttribute('style');
  expect(inlineHeight, 'an inline height overrides the shared rule and is how this drifted')
    .toBeNull();
  const cls = await page.locator('#bkFrame').getAttribute('class');
  expect(cls).toContain('nv-cal-frame');
});

/* Cal paints white in a light-preference browser and dark in a dark one. The
   frame's own background only shows before it paints, and a white flash on a
   dark page is the one outcome worth ruling out. The theme INSIDE the frame is
   a Cal account setting and is not reachable from this repository. */
test('the frame does not flash white before the scheduler paints', async ({ page }) => {
  await page.goto('/book.html');
  const bg = await page.locator('#bkFrame').evaluate((el) => getComputedStyle(el).backgroundColor);
  const [r, g, b] = bg.match(/\d+/g).map(Number);
  const light = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  expect(light, `frame background ${bg} is bright enough to flash on a dark page`).toBeLessThan(0.5);
});
