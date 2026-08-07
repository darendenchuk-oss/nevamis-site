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

  /* The proposal is emailed to a named prospect, so this line is the one that
     gets forwarded to whoever signs the cheque. It must state BOTH numbers:
     what month one costs and what every month after it costs. It used to read
     "One-time setup C$500." underneath "C$500/month", which is two correct
     figures arranged into a bill for C$1,000 on signing. */
  const setup = page.locator('#planSetup');
  await expect(setup).toContainText(`First month C$${cfg.setup.toLocaleString('en-CA')}`);
  await expect(setup).toContainText(`then C$${cfg.monthly.toLocaleString('en-CA')}/month`);
  /* And it must not reintroduce the additive framing in any form. */
  await expect(setup).not.toContainText(/one-time setup|setup fee|plus setup/i);

  /* Annual prepay is suspended in the config, so the proposal must NOT quote a
     yearly figure. This assertion used to demand "pay ten months, get twelve"
     unconditionally: it required the page to publish a price nobody approved,
     and it had been failing since the offer was switched off. It now follows
     the config in both directions. */
  const planAnnual = page.locator('#planAnnual');
  const annualActive = await page.evaluate(() =>
    !!(window.NV_PRICING.annual && window.NV_PRICING.annual.active));
  if (annualActive) await expect(planAnnual).toContainText('pay ten months, get twelve');
  else await expect(planAnnual).toHaveText('');

  await expect(page.locator('#pilotName')).toHaveText(cfg.pilot);
  await expect(page.locator('#planFeatures li').first()).toBeVisible();
});

/* Asserts WHICH plan each id resolves to, not merely that something rendered.
   The previous version checked only that the name was longer than three
   characters, which is how a legacy id silently resolving to the wrong plan
   would have passed - and "PRO" is exactly three characters, so the loose
   check was also about to start failing for the right answer. */
test('every sellable plan id renders, and legacy ids resolve to the right plan', async ({ page }) => {
  const cases = [
    ['starter', 'STARTER'],
    ['growth', 'GROWTH'],
    ['pro', 'PRO'],
    ['after-hours', 'STARTER'],   // retired id for the cheapest plan
    ['scale', 'PRO'],             // retired id for the dearest
  ];
  for (const [id, expected] of cases) {
    await page.goto(`/proposal.html?plan=${id}`);
    await expect(page.locator('#planName'), `${id} must resolve to ${expected}`).toContainText(expected);
    await expect(page.locator('#planPrice')).toContainText('C$');
    await expect(page.locator('#planPrice')).toContainText('/month');
  }
});

/* This test previously asserted that ?plan=pay-as-you-go RENDERED — "every
   plan id renders, including pay as you go" — which is why nobody noticed that
   the branch serving it had no `active` check and went on quoting a prospect
   C$49/month with C$0 setup for a day after both were retired. A green test
   held a retired offer in place. It now asserts the opposite. */
test('a retired or unknown plan id never quotes a retired price', async ({ page }) => {
  for (const id of ['pay-as-you-go', 'payg', 'enterprise', 'nonsense']) {
    await page.goto(`/proposal.html?plan=${id}`);
    const price = await page.locator('#planPrice').textContent();
    expect(price, `${id} must not quote C$49`).not.toContain('49');
    const setup = await page.locator('#planSetup').textContent();
    expect(setup, `${id} must not claim a C$0 setup`).not.toMatch(/C\$0\b|no setup fee/i);
    await expect(page.locator('#planName')).toContainText(/growth/i);
  }
});

/* This test used to assert the opposite: that ?founding=1 struck through the
   C$750 setup fee and printed "waived". Then it was rewritten to demand the
   words "No setup fee." That was correct for the eight days in 2026 when the
   fee really was zero, and false from 2026-08-06 onward, so a test written to
   stop the page fabricating a discount ended up demanding one.

   The durable assertion is about what the parameter may DO, not what the line
   happens to say: an inert URL parameter must not change the amount, must not
   strike anything through, and must not print a discount nobody is given. So
   the line is compared against the same URL without the parameter. */
test('a leftover founding=1 in a URL cannot invent a discount', async ({ page }) => {
  await page.goto('/proposal.html?plan=growth');
  const plain = await page.locator('#planSetup').textContent();

  await page.goto('/proposal.html?plan=growth&founding=1');
  const setup = page.locator('#planSetup');
  await expect(setup, 'founding=1 must not change the amount').toHaveText(plain);
  expect(await setup.locator('s').count()).toBe(0);   // no struck-through price
  await expect(setup).not.toContainText('waived');
  await expect(setup).not.toContainText('750');
  /* The real fee is quoted, not discounted away. */
  const cfgSetup = await page.evaluate(() =>
    window.NV_PRICING.plans.find((p) => p.id === 'growth').setup);
  await expect(setup).toContainText(`C$${cfgSetup.toLocaleString('en-CA')}`);
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
