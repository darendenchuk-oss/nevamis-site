/* One submission, one captured-lead event.
 *
 * roadmap_form_submitted sits in the `captured` funnel stage, whose own
 * description in src/domain/funnel.ts calls it "the only stage that is worth
 * money". It was on the submit button as a data-evt AND fired from the submit
 * handler, and site.js runs a delegated listener for every [data-evt] click,
 * so it was emitted twice per submission - and once more for every click that
 * reportValidity() rejected, which submits nothing at all.
 *
 * book.html's callback submit has carried the comment "a click is intent, not
 * a captured lead" since it shipped. This pins the same rule for the roadmap
 * form, which is the other side of the same idea.
 *
 * Every /api/interest POST is intercepted, so no lead is ever created.
 */
import { test, expect } from '@playwright/test';

async function watch(page) {
  await page.route('**/api/interest', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.route('**/api/events', (r) => r.abort());
  await page.route('**/api/mkt/events', (r) => r.abort());
  await page.evaluate(() => {
    window.__seen = [];
    const orig = window.nvTrack;
    window.nvTrack = (n, d) => { window.__seen.push(n); if (orig) orig(n, d); };
  });
}
const seen = (page, name) =>
  page.evaluate((n) => window.__seen.filter((x) => x === n).length, name);

async function fill(page) {
  await page.locator('#ifName').fill('Frontier Verify');
  await page.locator('#ifBiz').fill('Frontier Verify Co');
  await page.locator('#ifEmail').fill('frontier-verify@example.invalid');
  await page.locator('#ifIndustry').selectOption({ index: 1 });
  await page.locator('#ifResult').selectOption({ index: 1 });
  await page.locator('#ifConsent').check();
}

test('a completed roadmap submission reports exactly one captured lead', async ({ page }) => {
  await page.goto('/coming-soon.html');
  await watch(page);
  await fill(page);
  await page.locator('#interestForm button[type=submit]').click();
  await page.waitForTimeout(1200);
  expect(await seen(page, 'roadmap_form_submitted'),
    'twice means the only revenue-bearing funnel stage reads double').toBe(1);
});

/* The worse half: the button fired on CLICK, so a visitor who had not filled
   the form in was counted as a captured lead for pressing a button that
   refused to submit. */
test('a submission blocked by validation reports no captured lead', async ({ page }) => {
  await page.goto('/coming-soon.html');
  await watch(page);
  await page.locator('#ifName').fill('Frontier Verify');   // deliberately incomplete
  await page.locator('#interestForm button[type=submit]').click();
  await page.waitForTimeout(800);
  expect(await seen(page, 'roadmap_form_submitted'),
    'nothing was submitted, so nothing was captured').toBe(0);
});

test('the submit button carries no click-level event of its own', async ({ page }) => {
  await page.goto('/coming-soon.html');
  const evt = await page.locator('#interestForm button[type=submit]').getAttribute('data-evt');
  expect(evt, 'a captured-lead event must not be attached to a click').toBeNull();
});

/* The same rule, already deliberate on the other form. Pinned so the two
   cannot drift apart again. */
test('the callback submit likewise carries no click-level event', async ({ page }) => {
  await page.goto('/book.html');
  const evt = await page.locator('#cbSubmit').getAttribute('data-evt');
  expect(evt).toBeNull();
});
