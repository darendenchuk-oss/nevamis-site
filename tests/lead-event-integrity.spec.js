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

/* The roadmap form this pinned left the site with owner decision #81
   (2026-11-10), so the rule is held on the one form left: the callback form
   on book.html, whose submit has carried "a click is intent, not a captured
   lead" since it shipped. callback_requested fires from its success handler
   only (tests/form-feedback.spec.js drives it). */
test('the callback submit likewise carries no click-level event', async ({ page }) => {
  await page.goto('/book.html');
  const evt = await page.locator('#cbSubmit').getAttribute('data-evt');
  expect(evt).toBeNull();
});
