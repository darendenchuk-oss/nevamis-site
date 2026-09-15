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
    annual: window.NV_PRICING.plans.find((p) => p.id === 'growth').annual,
  }));

  /* Locale-formatted, since 2026-08-22: The Works' C$1,800 is the first
     four-digit monthly this page has rendered, and the page writes it with
     its separator. Deriving the expectation the same way keeps the test
     asserting "the config's number, as money" rather than a spelling. */
  await expect(page.locator('#planPrice')).toContainText('C$' + cfg.monthly.toLocaleString('en-CA'));
  await expect(page.locator('#planIncludes')).toContainText(String(cfg.minutes));

  /* The proposal is emailed to a named prospect, so this line is the one that
     gets forwarded to whoever signs the cheque. It must state ONE number.

     This assertion has now been inverted twice. It first demanded a struck-out
     setup fee, then demanded BOTH numbers ("First month C$500" AND "then
     C$500/month") on the argument that quoting one of two is worse than
     quoting both. That was right while the offer had two numbers. Since
     2026-08-09 it has one, so requiring the pair would have made this test a
     contract for the retired model: green on the old page, red on the correct
     one. It now requires the single-price sentence and fails on the pair
     coming back. */
  const monthly = page.locator('#planMonthly');
  await expect(monthly).toContainText(`C$${cfg.monthly.toLocaleString('en-CA')}/month`);
  await expect(monthly).toContainText('charged the day you start');
  await expect(monthly, 'the retired first-month framing must not return')
    .not.toContainText(/first month|from month two/i);

  /* What is NOT charged is the commitment, so it is asserted rather than left
     to prose. A proposal that loses this line loses the whole point of the
     2026-08-09 change on the one document a buyer keeps. */
  const terms = page.locator('#planTerms');
  /* "No setup fee" until 2026-08-15, when the evening directive introduced
     the one-time Launch & Implementation fee. Asserting the retired claim was
     worse than failing: satisfying it meant putting a sentence back on the
     one document a buyer keeps that the commercial model had deliberately
     retired. What must be disclosed now is the fee itself. */
  await expect(terms).toContainText(/Launch & Implementation/i);
  /* INVERTED 2026-08-22 (v4): a minimum term existed, three months on a plan
     alone and six with add-ons or The Works, so "no minimum term" flipped
     from a required disclosure to a retired sentence.

     INVERTED BACK 2026-09-08, on the owner directive that removed the minimum
     term from every plan and every add-on. The assertions are written the way
     round they are for a reason: this file has now been wrong in both
     directions, and each time it was the NEGATIVE assertion that pinned the
     page to a model the business had already left. So the negative here names
     the retired LENGTHS ("three-month start", "agreed up front") rather than
     the phrase "minimum", which the true sentence contains. */
  await expect(terms).toContainText(/no minimum term/i);
  await expect(terms).toContainText(/month to month/i);
  await expect(terms).toContainText(/locked for 12 months/i);
  await expect(terms).not.toContainText(/three-month/i);
  await expect(terms).not.toContainText(/agreed up front/i);
  await expect(terms).not.toContainText(/six months when any/i);
  /* 2026-09-12: the notice period is gone too, and it outlived the minimum
     term by four days precisely because nothing asserted on it. The positive
     names the promise a buyer is now being given; the negative names the
     number, because "notice" alone is a word the page is still entitled to
     use about price increases. */
  await expect(terms).toContainText(/cancel any time/i);
  await expect(terms).not.toContainText(/30 days notice/i);
  await expect(terms).not.toContainText(/thirty days/i);

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

  /* #pilotName was asserted here against NV_PRICING.pilot.name. The pilot
     record was deleted from pricing-config.js on 2026-08-09, so this line
     could only have been kept by keeping the retired offer alive. The feature
     list took its place as the second config-driven block on the page: it is
     rendered from plan.features, and a plan that quietly regrows an unbuilt
     entitlement shows up here first. */
  await expect(page.locator('#planFeatures li').first()).toBeVisible();
  const features = (await page.locator('#planFeatures').innerText()).toLowerCase();
  for (const unbuilt of ['booking calendar', 'crm', 'multi-location', 'multi-department']) {
    expect(features, `the proposal must not sell "${unbuilt}", which is not provisionable`)
      .not.toContain(unbuilt);
  }
});

/* Asserts WHICH plan each id resolves to, not merely that something rendered.
   The previous version checked only that the name was longer than three
   characters, which is how a legacy id silently resolving to the wrong plan
   would have passed - and "PRO" is exactly three characters, so the loose
   check was also about to start failing for the right answer. */
test('every sellable plan id renders, and legacy ids resolve to the right plan', async ({ page }) => {
  /* The expected NAME is read from the config, not typed. This test was written
     hours before the entry plan was renamed Starter -> Core, and it pinned
     'STARTER' as a literal — so the rename left a test asserting a plan name
     that no longer exists, which is the same defect the suite has caught in the
     product four times today. The id stays 'starter'; the id is not the name. */
  const nameOf = async (id) => (await page.evaluate((planId) =>
    window.NV_PRICING.plans.find((p) => p.id === planId).name, id)).toUpperCase();

  await page.goto('/proposal.html?plan=growth');
  const cases = [
    ['starter', await nameOf('starter')],
    ['growth', await nameOf('growth')],
    ['pro', await nameOf('pro')],
    ['after-hours', await nameOf('starter')],   // retired id for the cheapest plan
    ['scale', await nameOf('pro')],             // retired id for the dearest
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
    const monthly = await page.locator('#planMonthly').textContent();
    expect(monthly, `${id} must not quote a retired price`).not.toMatch(/C\$0\b|C\$49\b|C\$150\b|C\$850\b/);
    /* "no setup fee" used to be banned on this line, because in 2026-08-06's
       model claiming it was a fabrication. It is now the truth for every plan,
       and it lives on #planTerms rather than here. The thing worth catching is
       a retired FIGURE resolving out of an unknown id. */
    /* /front desk/i since 2026-08-22 (v4): the recommended fallback plan is
       the AI Front Desk. The point is unchanged - an unknown id falls back to
       a real, current plan and never a retired figure. */
    await expect(page.locator('#planName')).toContainText(/front desk/i);
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
  const plain = await page.locator('#planMonthly').textContent();

  await page.goto('/proposal.html?plan=growth&founding=1');
  const monthly = page.locator('#planMonthly');
  await expect(monthly, 'founding=1 must not change the amount').toHaveText(plain);
  expect(await monthly.locator('s').count()).toBe(0);   // no struck-through price
  await expect(monthly).not.toContainText('waived');
  /* The literal 750 ban is gone: it was a retired DISCOUNTED figure, and
     C$750 is now Grow's real monthly price - so this line and the config
     comparison eight lines below had come to contradict each other. The
     guard that matters is unchanged and stronger: same text as the URL
     without the parameter, nothing struck through, nothing "waived", and
     the amount equal to the configured price. */
  /* The real price is quoted, not discounted away. */
  const cfgMonthly = await page.evaluate(() =>
    window.NV_PRICING.plans.find((p) => p.id === 'growth').monthly);
  await expect(monthly).toContainText(`C$${cfgMonthly.toLocaleString('en-CA')}`);
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

/* The recipient filter exists so nobody can make a nevamis.ca proposal print a
   phrase, phone number or web address of their choosing. Its first version
   also refused real prospects: "24/7", "A/C" and "HVAC/R" failed on the slash,
   and every "(1991) Ltd" failed a four-digit rule, so about 2% of the ranked
   lead list silently got the generic proposal. Both directions are pinned. */
test('personalises for real trade names: slashes, years of incorporation, accents', async ({ page }) => {
  const names = [
    '24/7 Plumbing',
    'A/C Pros',
    'HVAC/R Services',
    'Smith & Sons (1991) Ltd',
    'Côte-Saint-Luc Électrique',
    'Londondale Heating & Air Conditioning (1991) Ltd',
    'Acclaimed! Heating, Cooling & Furnace Cleaning',
    'Legal Electric 1986 Ltd',
    "Roy's Roofing #2",
    'J.D. Irving Mechanical',
  ];
  for (const name of names) {
    await page.goto('/proposal.html?plan=growth&to=' + encodeURIComponent(name));
    await expect(page.locator('#preparedFor'), `"${name}" must be accepted`).toHaveText('Prepared for ' + name);
    await expect(page.locator('#headline')).toContainText(name);
    expect(await page.title()).toContain(name);
  }
});

test('refuses a web address, an email, a phone number or markup in place of a name', async ({ page }) => {
  await page.goto('/proposal.html?plan=growth');
  const generic = {
    preparedFor: await page.locator('#preparedFor').textContent(),
    headline: await page.locator('#headline').textContent(),
    title: await page.title(),
  };
  const refused = [
    'Call us at www.evil.com',
    'https://evil.example/pay',
    'Pay at evil-site.net today',
    'Acme Plumbing evil.example',
    'sales@evil.example',
    'Call 587-413-0035',
    'Acme (587) 413 0035',
    'Acme 5874130035',
    'Acme 1 587 413 0035',
    'Acme 24/7 587/413/0035',
    'Acme Plumbing" onmouseover="alert(1)',
    '<img src=x onerror=alert(1)>',
    '<script>document.title="x"</script>',
  ];
  for (const bad of refused) {
    await page.goto('/proposal.html?plan=growth&to=' + encodeURIComponent(bad));
    await expect(page.locator('#preparedFor'), `"${bad}" must be refused`).toHaveText(generic.preparedFor);
    await expect(page.locator('#headline')).toHaveText(generic.headline);
    expect(await page.title()).toBe(generic.title);
    expect(await page.locator('#preparedFor *, #headline img, #headline script').count()).toBe(0);
  }
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
  /* Asserted '7-day live pilot' until 2026-08-09: the scripts-off proposal had
     to name the offer, so retiring the offer would have failed this test and
     re-adding it would have been the fix. It now asserts the terms that
     replaced it, which is the sentence a prospect must still read when the
     config never loads. */
  expect(text).toContain('Launch & Implementation');
  expect(text).toContain('charged the day you start');
  expect(text).not.toMatch(/pilot|trial/i);
  expect(text).toContain('What happens next');
  expect(text).toContain('(587) 413-0035');
  expect(text.split(/\s+/).length).toBeGreaterThan(200);
  await ctx.close();
});
