/* The step from trade interest into how onboarding works.

   Three of the four conversion actions on the trade landing pages were
   instrumented and this one was not, so nobody could see whether a roofer who
   read a trade page went on to read how starting actually works. It was skipped
   on purpose while its destination was an offer under commercial review; that
   review has landed, and the destination is the How You Start page. It served
   from /pilot.html until 2026-09-19 and now lives at /how-you-start.html; the
   old URL stays behind as a short noindex page that points at it.

   ONE event name for four pages. The payload already carries {page}, so which
   trade produced the click is answerable without encoding the page a second
   time in the event vocabulary. */
import { test, expect } from '@playwright/test';

const TRADES = ['/electricians.html', '/plumbers.html', '/hvac.html', '/restoration.html'];

test('every trade page measures the step into How You Start', async ({ page }) => {
  for (const trade of TRADES) {
    await page.goto(trade);
    const cta = page.locator('main a.btn[href="/how-you-start.html"]');
    await expect(cta, `${trade} should offer the how-you-start path`).toHaveCount(1);
    await expect(cta, `${trade} must report that step`).toHaveAttribute('data-evt', 'trade_start_click');
  }
});

/* One name, deliberately. If this ever becomes four, the page dimension is
   being encoded twice and the vocabulary grows for nothing. */
test('the four trade pages share one event name rather than four', async ({ page }) => {
  const names = new Set();
  for (const trade of TRADES) {
    await page.goto(trade);
    names.add(await page.locator('main a.btn[href="/how-you-start.html"]').getAttribute('data-evt'));
  }
  expect([...names], `expected one shared name, got ${[...names].join(', ')}`).toEqual(['trade_start_click']);
});

test('a dead analytics endpoint never costs the how-you-start click', async ({ page }) => {
  await page.route('**/api/events', (r) => r.abort());
  await page.goto('/hvac.html');
  await page.locator('a[data-evt="trade_start_click"]').first().click();
  await page.waitForURL(/how-you-start\.html/, { timeout: 10_000 });
  expect(page.url(), 'navigation must survive a failed beacon').toContain('/how-you-start.html');
});

/* The destination is judged by what it renders, not by its filename. On
   2026-09-19 the URL caught up with the page; this still asserts the
   rendering, because that is the part a visitor reads. */
test('the destination is the How You Start page, whatever the URL is called', async ({ page }) => {
  await page.goto('/how-you-start.html');
  await expect(page).toHaveTitle(/How You Start/i);
  const h1 = (await page.locator('h1').first().textContent()) || '';
  expect(h1.trim().length, 'the destination must actually say something').toBeGreaterThan(10);
});
