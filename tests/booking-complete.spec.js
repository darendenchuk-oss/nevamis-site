/* What the page says AFTER a booking succeeds.
 *
 * Cal.com owns the appointment confirmation: it confirms inside the iframe,
 * then emails an invite. Nevamis must not issue a second, competing
 * confirmation for a booking it does not own. But the page around the iframe
 * was frozen in the pre-booking state, and the block below the scheduler kept
 * asking "Not ready to pick a time?" of somebody who had just picked one.
 *
 * No booking is created to test this. The completion envelope was captured
 * from the live iframe and is already pinned by tests/interactions.spec.js;
 * these dispatch that same envelope, which is how the behaviour can be proven
 * without putting a fake prospect on the founder's real calendar.
 */
import { test, expect } from '@playwright/test';

/** The real Cal envelope: an OBJECT, not a JSON string. */
const calEvent = (type, data = {}) =>
  ({ originator: 'CAL', type, namespace: '', fullType: `CAL::${type}`, data });

async function fireBooking(page, origin = 'https://cal.com') {
  await page.evaluate(([o, ev]) => {
    window.dispatchEvent(new MessageEvent('message', { origin: o, data: ev }));
  }, [origin, calEvent('bookingSuccessful', { uid: 'test-uid' })]);
  await page.waitForTimeout(150);
}

test('before booking, the callback alternative is offered', async ({ page }) => {
  await page.goto('/book.html');
  const wrap = page.locator('#cbWrap');
  await expect(wrap).toBeVisible();
  await expect(wrap.locator('.cb-h')).toHaveText(/not ready to pick a time/i);
  await expect(page.locator('#cbForm')).toBeVisible();
});

test('after booking, the page stops asking whether you are not ready to pick a time', async ({ page }) => {
  await page.goto('/book.html');
  await expect(page.locator('#cbWrap .cb-h')).toHaveText(/not ready to pick a time/i);

  await fireBooking(page);

  const heading = page.locator('#cbWrap .cb-h');
  await expect(heading, 'the contradiction must be gone').not.toHaveText(/not ready to pick a time/i);
  await expect(heading).toHaveText(/on the calendar/i);
  await expect(page.locator('#cbForm'), 'the alternative is retired, not left half-live').toBeHidden();
  await expect(page.locator('#cbWrap')).toHaveAttribute('data-booked', 'true');
});

/* Cal already sends the confirmation and the calendar invite. A second one
   from Nevamis would be a competing record of an appointment Nevamis does not
   own, and if the two ever disagreed the visitor would believe the wrong one. */
test('Nevamis adds context and does not duplicate the provider confirmation', async ({ page }) => {
  await page.goto('/book.html');
  await fireBooking(page);
  const text = (await page.locator('#cbWrap').innerText()).toLowerCase();
  expect(text, 'says what Nevamis does next').toMatch(/nothing to prepare/);
  for (const claim of ['confirmation email', 'we have emailed', 'check your inbox', 'calendar invite']) {
    expect(text, `must not restate Cal's own confirmation: "${claim}"`).not.toContain(claim);
  }
});

/* The scheduler stays usable: Cal's own screen handles rescheduling, and
   hiding it would strand somebody who mis-picked a slot. */
test('the scheduler is left alone after a booking', async ({ page }) => {
  await page.goto('/book.html');
  await fireBooking(page);
  await expect(page.locator('#bkFrame')).toBeVisible();
});

/* Same trust boundary the analytics event has. A page that rewrites itself on
   any postMessage is a page anyone can rewrite. */
test('a forged origin cannot rewrite the page', async ({ page }) => {
  await page.goto('/book.html');
  await fireBooking(page, 'https://evil.example.com');
  await expect(page.locator('#cbWrap .cb-h')).toHaveText(/not ready to pick a time/i);
  await expect(page.locator('#cbForm')).toBeVisible();
});

test('ordinary iframe chatter is not a booking', async ({ page }) => {
  await page.goto('/book.html');
  await page.evaluate(([ev1, ev2]) => {
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://cal.com', data: ev1 }));
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://cal.com', data: ev2 }));
  }, [calEvent('navigatedToBooker'), calEvent('availabilityLoaded', { eventSlug: 'nevamis-intro' })]);
  await page.waitForTimeout(150);
  await expect(page.locator('#cbWrap .cb-h')).toHaveText(/not ready to pick a time/i);
});

/* If the visitor never saw the callback block, there is nothing to retire and
   nothing should be invented. */
test('a completed booking still reports exactly one event', async ({ page }) => {
  await page.goto('/book.html');
  await page.evaluate(() => {
    window.__seen = [];
    const orig = window.nvTrack;
    window.nvTrack = (n) => { window.__seen.push(n); if (orig) orig(n); };
  });
  await fireBooking(page);
  await fireBooking(page);
  const seen = await page.evaluate(() => window.__seen.filter((n) => n === 'booking_completed'));
  expect(seen, 'one booking, one event, however many messages arrive').toHaveLength(1);
});
