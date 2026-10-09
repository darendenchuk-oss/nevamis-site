/* Campaign attribution must survive a multi-page journey WITHOUT storing
   anything, because nevamis.ca/privacy states that no identifiers are stored
   and names the only two things this site keeps in a browser. The storage
   assertions below are load-bearing: they are the published policy, tested.
*/
import { test, expect } from '@playwright/test';

test('campaign tags survive a multi-page journey without storing anything', async ({ page }) => {
  // Land as if from a Google ad
  await page.goto('/index.html?utm_source=google&utm_medium=cpc&utm_campaign=plumbers-aug&gclid=CjTEST');
  await page.waitForFunction(() => typeof window.nvCampaignParams === 'function');

  const captured = await page.evaluate(() => window.nvCampaignParams());
  expect(captured.utm_source).toBe('google');
  expect(captured.gclid).toBe('CjTEST');

  // Nothing may be persisted: the privacy page promises no identifiers stored.
  const stored = await page.evaluate(() => ({
    cookies: document.cookie,
    ls: Object.keys(localStorage),
    ss: Object.keys(sessionStorage),
  }));
  expect(stored.cookies, 'no cookies may be set').toBe('');
  expect(stored.ls.filter((k) => /utm|gclid|campaign/i.test(k)), 'no campaign key in localStorage').toEqual([]);
  expect(stored.ss.filter((k) => /utm|gclid|campaign/i.test(k)), 'no campaign key in sessionStorage').toEqual([]);

  // Clicking an internal link must carry the tags to the next page
  const href = await page.evaluate(() => {
    const a = document.querySelector('a[href*="pricing"]');
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return a.getAttribute('href');
  });
  expect(href, 'the tags should be copied onto the destination').toContain('utm_source=google');
  expect(href).toContain('gclid=CjTEST');
});

test('an untagged visit leaves links exactly as authored', async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForFunction(() => typeof window.nvCampaignParams === 'function');
  const link = page.locator('a[href$="pricing.html"], a[href*="/pricing"]').first();
  const before = await link.getAttribute('href');
  await link.evaluate((a) => a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  expect(await link.getAttribute('href'), 'no tags, no rewrite').toBe(before);
});

test('tel: and external links are never rewritten', async ({ page }) => {
  await page.goto('/index.html?utm_source=google');
  await page.waitForFunction(() => typeof window.nvCampaignParams === 'function');
  const tel = page.locator('a[href^="tel:"]').first();
  const before = await tel.getAttribute('href');
  await tel.evaluate((a) => a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  expect(await tel.getAttribute('href'), 'a phone link must stay dialable').toBe(before);
});

/* ============================================================
   FUNNEL AUDIT ITEM 12 (2026-10-09): the campaign reaches the booking.

   The tags reached Cal.com only inside the prefill notes, and only when a
   visitor opened the optional fold and typed, and the new-tab link and every
   "Book a call" link to /book.html dropped the scheduler's anchor. These run
   offline: the engine origin answers 204 and cal.com is never loaded (the
   frame's first request is captured and refused), so no run writes a page
   view to production or asks a third party for anything.
   ============================================================ */
async function offlineWithCal(page) {
  const cal = [];
  await page.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await page.route(/^https:\/\/(?:app\.)?cal\.com\//, (r) => { cal.push(r.request().url()); return r.abort(); });
  return cal;
}

test('a tagged visit hands its utm tags, and never a click ID, to the scheduler on its first load and to the new-tab link', async ({ page }) => {
  const cal = await offlineWithCal(page);
  await page.goto('/book.html?utm_source=meta&utm_medium=paid&utm_campaign=oct%2017&fbclid=CLICK123&to=Marion+Webb#pick-a-time');
  await expect.poll(() => cal.length).toBeGreaterThan(0);
  const first = new URL(cal[0]);
  expect(first.pathname).toBe('/daren-qvlah4/nevamis-intro');
  for (const [k, v] of [['utm_source', 'meta'], ['utm_medium', 'paid'], ['utm_campaign', 'oct 17']]) {
    expect(first.searchParams.get(k), `${k} as Cal's own UTM field`).toBe(v);
    expect(first.searchParams.get(`metadata[${k}]`), `${k} as booking metadata`).toBe(v);
  }
  /* A click ID is unique to one ad click, and a name is a person. */
  expect(cal[0]).not.toContain('CLICK123');
  expect(cal[0]).not.toContain('fbclid');
  expect(cal[0]).not.toContain('Marion');
  /* The frame loaded once, already tagged: nothing reloaded it. */
  await page.waitForTimeout(500);
  expect(cal.filter((u) => /\/nevamis-intro/.test(u)).length, 'one load of the scheduler').toBe(1);
  const tab = new URL(await page.locator('#bkNewTab').getAttribute('href'));
  expect(tab.searchParams.get('utm_campaign')).toBe('oct 17');
  expect(tab.searchParams.get('metadata[utm_source]')).toBe('meta');
  expect(tab.href).not.toContain('CLICK123');
  /* Prefilling keeps them. */
  await page.locator('#bkPrefillWrap summary').click();
  await page.fill('#bkName', 'Pat Lee');
  await page.dispatchEvent('#bkName', 'change');
  await page.waitForTimeout(600);
  const after = new URL(await page.locator('#bkFrame').getAttribute('src'));
  expect(after.searchParams.get('name')).toBe('Pat Lee');
  expect(after.searchParams.get('utm_source'), 'a prefill never strips the campaign').toBe('meta');
});

test('an untagged visit leaves the scheduler and the new-tab link exactly as authored', async ({ page }) => {
  const cal = await offlineWithCal(page);
  await page.goto('/book.html');
  await expect(page.locator('#bkFrame')).toHaveAttribute('src', 'https://cal.com/daren-qvlah4/nevamis-intro?hide_landing_page_details=1');
  await expect(page.locator('#bkNewTab')).toHaveAttribute('href', 'https://cal.com/daren-qvlah4/nevamis-intro');
  expect(cal.every((u) => !/utm_|metadata/.test(u))).toBe(true);
});

test('every link to the booking page lands at the scheduler, tagged or not, and a link with its own anchor keeps it', async ({ page }) => {
  await offlineWithCal(page);
  /* site.js rewrites the link in the capture phase; the link's own listener
     then cancels the navigation, so the page stays put to be read again. */
  const click = (sel) => page.evaluate((s) => {
    const a = document.querySelector(s);
    a.addEventListener('click', (e) => e.preventDefault(), { once: true });
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return a.getAttribute('href');
  }, sel);
  await page.goto('/pricing.html');
  await page.waitForFunction(() => typeof window.nvCampaignParams === 'function');
  expect(await click('.main-nav a[href^="/book.html"]')).toMatch(/\/book\.html#pick-a-time$/);
  await page.goto('/how-you-start.html?utm_source=google&utm_campaign=plumbers&gclid=G1');
  await page.waitForFunction(() => typeof window.nvCampaignParams === 'function');
  const hero = new URL(await click('.cta-row a[href^="/book.html"]'));
  expect(hero.pathname).toBe('/book.html');
  expect(hero.hash).toBe('#pick-a-time');
  expect(hero.searchParams.get('utm_source')).toBe('google');
  expect(hero.searchParams.get('gclid'), 'site links carry the whole allowlist, click IDs included, as before').toBe('G1');
  /* Middle click opens a tab without a click event, and still carries both. */
  await page.goto('/how-you-start.html?utm_source=google');
  await page.waitForFunction(() => typeof window.nvCampaignParams === 'function');
  const aux = await page.evaluate(() => {
    const a = document.querySelector('.midcta a[href^="/book.html"]');
    a.dispatchEvent(new MouseEvent('auxclick', { bubbles: true, cancelable: true, button: 1 }));
    return a.getAttribute('href');
  });
  expect(aux).toMatch(/\/book\.html\?utm_source=google#pick-a-time$/);
  /* An anchor the link chose for itself is never replaced. */
  await page.goto('/pricing.html');
  await page.waitForFunction(() => typeof window.nvCampaignParams === 'function');
  const own = await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = '/book.html#booking'; a.textContent = 'x';
    document.body.appendChild(a);
    a.addEventListener('click', (e) => e.preventDefault());
    a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return a.getAttribute('href');
  });
  expect(own).toMatch(/\/book\.html#booking$/);
});
