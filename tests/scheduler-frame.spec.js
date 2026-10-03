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

test('the booking page frame clears a six-row month', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto('/book.html');
  const h = await page.locator('#bkFrame').evaluate((el) => el.getBoundingClientRect().height);
  expect(h, `${h}px leaves the last week of the month below the frame`).toBeGreaterThanOrEqual(NEEDED);
});

/* The homepage embed is gone. The film homepage has no inline scheduler: its
   Book a call buttons go to book.html, whose frame is the one measured above.
   Two tests here loaded '/' and waited for [data-book-src] and
   iframe.nv-cal-frame, which the homepage no longer has, and timed out on
   every run from 2026-09 until 2026-10-03 (audit CHECK-RUNNER-5), so the
   suite's red verdict hid any real regression. They are removed, not
   retargeted: with one scheduler there is nothing left to disagree with.
   The guard below that the homepage stays that way is what keeps the one
   declaration true. */
test("the homepage carries no second scheduler, so book.html's frame is the only one", async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });
  expect(await page.locator('[data-book-src], iframe.nv-cal-frame').count(),
    'an inline scheduler on the homepage is a second height to keep in step').toBe(0);
  const books = await page.locator('main a[href^="/book.html"]').count();
  expect(books, 'the homepage still sends visitors to the booking page').toBeGreaterThan(0);
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
