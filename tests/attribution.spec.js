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
