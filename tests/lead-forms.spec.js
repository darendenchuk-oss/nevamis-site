/* Every lead form must send the phone number it asks for.
 *
 * coming-soon.html has always had a "Phone (optional)" field and never sent it:
 * the value was folded into a note string only. /api/interest stores `phone`
 * and the owner's alert reads "NEVAMIS LEAD: ... <phone or email>. Call back
 * today." So every lead from this page told him to call back and then handed
 * him an email address. The page is linked from every other page and sits in
 * sitemap.xml.
 */
import { test, expect } from '@playwright/test';

/** Capture the JSON body a page posts to /api/interest, without letting it out. */
async function captureInterestPost(page, fill) {
  let captured = null;
  await page.route('**/api/interest', async (route) => {
    captured = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await fill();
  await expect.poll(() => captured, { timeout: 5000 }).not.toBeNull();
  return captured;
}

test('the coming-soon form sends the phone number it asks for', async ({ page }) => {
  await page.goto('/coming-soon.html');

  const body = await captureInterestPost(page, async () => {
    await page.fill('#ifName', 'Marion Webb');
    await page.fill('#ifBiz', 'Real Plumbing');
    await page.fill('#ifEmail', 'marion@realplumbing.ca');
    await page.fill('#ifPhone', '780-555-0142');
    await page.check('#ifConsent');
    await page.locator('form button[type=submit]').first().click();
  });

  expect(body.phone, 'the phone field must reach the API, not just the note').toBe('780-555-0142');
  expect(body.email).toBe('marion@realplumbing.ca');
  expect(body.name).toBe('Marion Webb');
});

test('the coming-soon form cannot be double-submitted while in flight', async ({ page }) => {
  await page.goto('/coming-soon.html');
  let posts = 0;
  await page.route('**/api/interest', async (route) => {
    posts++;
    // Slow, the way a bad connection is: this is the window that mattered.
    await new Promise((r) => setTimeout(r, 1200));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.fill('#ifName', 'Marion Webb');
  await page.fill('#ifBiz', 'Real Plumbing');
  await page.fill('#ifEmail', 'marion@realplumbing.ca');
  await page.check('#ifConsent');
  const submit = page.locator('form button[type=submit]').first();
  await submit.click();
  // The button must be disabled BEFORE the request resolves, not after.
  await expect(submit).toBeDisabled();
  await page.waitForTimeout(1600);
  expect(posts, 'one lead, one row').toBe(1);
});
