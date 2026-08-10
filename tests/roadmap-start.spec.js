/* The roadmap's available product.

   coming-soon.html renders one card per service. The card marked AVAILABLE NOW
   renders "Start here"; every other card renders "Tell us this would help".
   They are the two branches of one `if` in the same render loop, and only the
   unavailable branch was ever counted, so the page could report demand for
   products that do not exist yet and could not report anyone choosing the one
   that does.

   Its own name rather than trade_start_click, which lands on the same page:
   that one answers "does trade interest lead to reading about onboarding",
   this one answers "does someone evaluating the whole roadmap pick what is
   already shipping". Same destination, different question. */
import { test, expect } from '@playwright/test';

const START = 'roadmap_service_start_clicked';

test('the available product reports being chosen', async ({ page }) => {
  await page.goto('/coming-soon.html');
  const cta = page.locator(`a[data-evt="${START}"]`);
  await expect(cta, 'the AVAILABLE NOW card should offer one start action').toHaveCount(1);
  await expect(cta).toHaveText(/Start here/i);
});

/* The pairing is the point: both branches of the same decision are counted, so
   "wanted something unavailable" and "took what exists" are comparable. */
test('both branches of the service card decision are measured', async ({ page }) => {
  await page.goto('/coming-soon.html');
  const started = await page.locator(`a[data-evt="${START}"]`).count();
  const interest = await page.locator('button.interest[data-svc]').count();
  expect(started, 'the available card must be counted').toBeGreaterThan(0);
  expect(interest, 'the unavailable cards must still be counted').toBeGreaterThan(0);
});

/* One click, one event. A card CTA that also matched a broader delegated
   handler would double-count, and a doubled numerator on the only stage that
   reports "they chose the real product" is worse than no number at all. */
test('choosing the available product emits exactly one event', async ({ page }) => {
  await page.goto('/coming-soon.html');
  await page.evaluate(() => {
    window.__seen = [];
    const orig = window.nvTrack;
    window.nvTrack = (n, d) => { window.__seen.push(n); if (orig) orig(n, d); };
  });
  // Navigation is not the subject here; the count is.
  await page.locator(`a[data-evt="${START}"]`).evaluate((el) => el.setAttribute('href', 'javascript:void 0'));
  await page.locator(`a[data-evt="${START}"]`).click();
  const seen = await page.evaluate(() => window.__seen);
  expect(seen.filter((n) => n === START), `emitted ${seen.join(', ')}`).toHaveLength(1);
});

test('a dead analytics endpoint never costs the roadmap start click', async ({ page }) => {
  await page.route('**/api/events', (r) => r.abort());
  await page.goto('/coming-soon.html');
  await page.locator(`a[data-evt="${START}"]`).click();
  await page.waitForURL(/pilot\.html/, { timeout: 10_000 });
  expect(page.url(), 'navigation must survive a failed beacon').toContain('/pilot.html');
});
