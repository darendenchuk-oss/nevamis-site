/* ============================================================
   NEVAMIS PROPOSAL PROOF
   The proposal is sent to real prospects, so it must always quote
   the approved price list, never leak into search, and never
   execute anything a URL puts into it.
   ============================================================ */

import { test, expect } from '@playwright/test';

test('quotes the approved price list, never hardcoded numbers', async ({ page }) => {
  await page.goto('/proposal.html?plan=growth');

  const cfg = await page.evaluate(() => ({
    monthly: window.NV_PRICING.plans.find((p) => p.id === 'growth').monthly,
    minutes: window.NV_PRICING.plans.find((p) => p.id === 'growth').includedMinutes,
    setup: window.NV_PRICING.plans.find((p) => p.id === 'growth').setup,
    annual: window.NV_PRICING.plans.find((p) => p.id === 'growth').annual,
    pilot: window.NV_PRICING.pilot.name,
  }));

  await expect(page.locator('#planPrice')).toContainText(`C$${cfg.monthly}`);
  await expect(page.locator('#planIncludes')).toContainText(String(cfg.minutes));
  await expect(page.locator('#planSetup')).toContainText(`C$${cfg.setup}`);
  await expect(page.locator('#planAnnual')).toContainText('pay ten months, get twelve');
  await expect(page.locator('#pilotName')).toHaveText(cfg.pilot);
  await expect(page.locator('#planFeatures li').first()).toBeVisible();
});

test('every plan id renders, including pay as you go', async ({ page }) => {
  for (const id of ['after-hours', 'growth', 'scale', 'pay-as-you-go']) {
    await page.goto(`/proposal.html?plan=${id}`);
    const name = await page.locator('#planName').textContent();
    expect(name.length, `${id} should name a plan`).toBeGreaterThan(3);
    await expect(page.locator('#planPrice')).toContainText('C$');
    await expect(page.locator('#planPrice')).toContainText('/month');
  }
});

test('the founding-client flag strikes the setup fee rather than hiding it', async ({ page }) => {
  await page.goto('/proposal.html?plan=growth&founding=1');
  await expect(page.locator('#planSetup s')).toBeVisible();          // original still shown
  await expect(page.locator('#planSetup b')).toContainText('waived');
  await expect(page.locator('#planSetup')).toContainText('C$750');
});

test('personalises from the URL without ever executing it', async ({ page }) => {
  const evil = '<img src=x onerror=alert(1)>Acme Plumbing';
  await page.goto('/proposal.html?to=' + encodeURIComponent(evil) + '&plan=scale');

  // the business name appears as literal text
  await expect(page.locator('#preparedFor')).toContainText('Acme Plumbing');
  // and no element was ever created from it
  expect(await page.locator('#preparedFor img').count()).toBe(0);
  expect(await page.locator('#headline img').count()).toBe(0);
  const html = await page.locator('#preparedFor').innerHTML();
  expect(html).not.toContain('<img');
});

test('is a private sales artefact: noindex and out of the sitemap', async ({ page }) => {
  await page.goto('/proposal.html');
  const robots = await page.evaluate(() =>
    document.querySelector('meta[name=robots]')?.content || '');
  expect(robots).toContain('noindex');

  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('proposal.html');
});

test('still reads as a complete proposal with no parameters and no JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/proposal.html');

  const text = await page.locator('main').innerText();
  expect(text).toContain('7-day live pilot');
  expect(text).toContain('What happens next');
  expect(text).toContain('(587) 413-0035');
  expect(text.split(/\s+/).length).toBeGreaterThan(200);
  await ctx.close();
});
