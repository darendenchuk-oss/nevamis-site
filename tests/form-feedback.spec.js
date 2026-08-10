/* Does the answer reach the person who cannot see it?
 *
 * #cbMsg had role=status and aria-live=polite and still could not be relied on
 * to announce, because it started [hidden] and say() wrote the text BEFORE
 * unhiding it. A live region inserted into the accessibility tree already
 * containing its message is not reliably read: several screen reader and
 * browser pairs announce only regions they were already watching. Every
 * attribute-level check passed, and a sighted visitor saw the panel, so
 * nothing looked wrong.
 *
 * #ifStatus on coming-soon.html has always done it correctly - permanently in
 * the DOM, mutated in place - which is the pattern #cbMsg now follows.
 *
 * Every /api/interest POST is intercepted, so no lead is ever created.
 */
import { test, expect } from '@playwright/test';

async function fillCallback(page) {
  await page.locator('#cbName').fill('Frontier Verify');
  await page.locator('#cbPhone').fill('5875550100');
  await page.locator('#cbEmail').fill('frontier-verify@example.invalid');
}

test('the live region is in the accessibility tree before there is anything to say', async ({ page }) => {
  await page.goto('/book.html');
  const s = await page.evaluate(() => {
    const m = document.querySelector('#cbMsg');
    const cs = getComputedStyle(m);
    return {
      exists: !!m,
      hidden: m.hidden,
      display: cs.display,
      role: m.getAttribute('role'),
      live: m.getAttribute('aria-live'),
      height: Math.round(m.getBoundingClientRect().height),
      text: (m.textContent || '').trim(),
    };
  });
  expect(s.exists).toBe(true);
  expect(s.role).toBe('status');
  expect(s.live).toBe('polite');
  /* The two that actually decide whether it is announced. */
  expect(s.hidden, 'a hidden region is not in the accessibility tree').toBe(false);
  expect(s.display, 'display:none removes it from the tree just as surely').not.toBe('none');
  /* And it must still cost nothing on the page while it is empty. */
  expect(s.text).toBe('');
  expect(s.height, 'an empty region must occupy no space').toBe(0);
});

test('a failure changes the text of the region rather than revealing it', async ({ page }) => {
  await page.goto('/book.html');
  await page.route('**/api/interest', (r) =>
    r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"boom"}' }));
  await fillCallback(page);
  await page.locator('#cbSubmit').click();
  await page.waitForTimeout(2500);

  const s = await page.evaluate(() => {
    const m = document.querySelector('#cbMsg');
    return { hidden: m.hidden, text: (m.textContent || '').trim(), cls: m.className };
  });
  expect(s.hidden, 'the region was already there; only its text moved').toBe(false);
  expect(s.text).toMatch(/did not send/i);
  expect(s.cls).toContain('bad');
});

/* Disabling the focused button drops focus to <body>, which lands a keyboard
   or screen-reader user at the top of the document exactly as the outcome
   arrives. */
test('focus comes back to the button after a failed submission', async ({ page }) => {
  await page.goto('/book.html');
  await page.route('**/api/interest', (r) =>
    r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
  await fillCallback(page);
  await page.locator('#cbSubmit').focus();
  await page.locator('#cbSubmit').click();
  await page.waitForTimeout(2500);
  const active = await page.evaluate(() => document.activeElement && document.activeElement.id);
  expect(active, 'focus must not be left on <body>').toBe('cbSubmit');
});

/* A timeout is not a failure. The engine commits the lead before it notifies
   anyone, so a request that outruns the client's patience may already have
   landed - and telling that visitor it did not send invites a second
   submission and a second owner alert. */
test('a timeout says it might have worked; a real failure does not', async ({ page }) => {
  await page.goto('/book.html');
  await page.route('**/api/interest', () => { /* never resolves */ });
  await fillCallback(page);
  await page.locator('#cbSubmit').click();
  await page.waitForTimeout(11000);

  const text = (await page.locator('#cbMsg').textContent()).trim();
  expect(text, 'we do not know that it failed, so we must not say so').not.toMatch(/did not send/i);
  expect(text).toMatch(/may already have reached us/i);
  expect(text, 'and still give a way to check').toMatch(/587|Sales@nevamis\.ca/);
  await expect(page.locator('#cbSubmit'), 'and let them act again').toBeEnabled();
});

test('a definite failure still says so plainly', async ({ page }) => {
  await page.goto('/book.html');
  await page.route('**/api/interest', (r) => r.abort());
  await fillCallback(page);
  await page.locator('#cbSubmit').click();
  await page.waitForTimeout(2500);
  const text = (await page.locator('#cbMsg').textContent()).trim();
  expect(text).toMatch(/did not send/i);
  expect(text).toMatch(/587/);
});

/* The pattern this was copied from, pinned so the two cannot diverge. */
test('the roadmap status region follows the same rule', async ({ page }) => {
  await page.goto('/coming-soon.html');
  const s = await page.evaluate(() => {
    const m = document.querySelector('#ifStatus');
    return { hidden: m.hidden, role: m.getAttribute('role'), display: getComputedStyle(m).display };
  });
  expect(s.hidden).toBe(false);
  expect(s.role).toBe('status');
  expect(s.display).not.toBe('none');
});
