/* ============================================================
   THE FIRST MONTH FREE SHOWS ONLY WHILE A PLACE IS OPEN
   (v7, owner amendment #66, 2026-10-03; ENGINE-SPEC section 4, guard 3).

   The first month free is for the first `freeMonth.firstClients` businesses,
   given on a booked call. pricing.html says it in full in one place,
   #foundingBanner, directly under the heading since the funnel audit
   (2026-10-09), which ships hidden and empty; free-month.js fills it from
   pricing-config.js foundingClient. Before it asks, foundingClient.active
   must be true and foundingClient.spots must equal freeMonth.firstClients.
   Then GET https://app.nevamis.ca/api/free-month, waited on for eight
   seconds, must answer 200 with {"open": true, "cap": <the same number>};
   anything else fails closed (owner decision: once the places are taken or
   held, the offer is not said anywhere). These tests answer the engine
   route themselves, so no run asks production, and they hold:

     open      a 200 with {"open": true, "cap": <the same number>}: the banner
               shows the config's offer and note beside Book a call; under
               each Buy now, beside "Buy now charges your first month", a
               line gives the booked-call offer; the structured data says
               nothing about a free month;
     closed    open:false, a 503, a 500, a 404, an aborted request, a body
               that is not JSON, no answer inside eight seconds, a different
               cap, the owner's switch off, or places that do not equal the
               cap: hidden, and no visible text on the page says the month is
               free;
     held      the banner's space is held while the answer is on its way, so
               a late open answer moves the plans by nothing; how far content
               moves when the answer is closed is measured, and with the
               owner's switch off nothing is held, so nothing moves;
     no JS     with scripts off, nothing says it either;
     widths    at 1440 and 390 wide, open and closed, the page does not
               scroll sideways and logs no console error.

   Run it on its own port:
     NV_PORT=3377 npx playwright test tests/free-month-gate.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
function config(src = read('pricing-config.js')) {
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { timeout: 1000 });
  return sandbox.window.NV_PRICING;
}
const P = config();
const CAP = P.freeMonth.firstClients;
const ENDPOINT = 'https://app.nevamis.ca/api/free-month';

/* The engine's FREE_MONTH vocabulary (canonical.ts freePeriodMisstatements),
   and the referral reward, a different promise, taken out first. */
const FREE_MONTH = /(?<!\b(?:no|not\s+a|never\s+a|without\s+a)\s)(?:free\s+(?:first\s+)?months?|first\s+month\s+(?:is\s+|for\s+)?free|months?\s+free|month\s+on\s+us)/i;
const flat = (s) => s.replace(/\s+/g, ' ').trim();

/* Every other request to the engine origin (the page-view beacon) is
   answered with the 204 the real one gives, so nothing reaches production. */
async function engine(ctx, answer) {
  const asked = [];
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, async (r) => {
    const url = r.request().url();
    if (!url.startsWith(ENDPOINT)) return r.fulfill({ status: 204, body: '' });
    asked.push(url);
    return answer(r);
  });
  return asked;
}
const json = (status, body) => (r) => r.fulfill({
  status, contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});

/* What a buyer can read on the page: the rendered text, minus the referral
   card, whose reward is "a free month of your own plan". */
async function visibleFreeMonth(page) {
  const text = flat(await page.locator('body').innerText())
    .replace(P.referral.offer, ' ').replace(P.referral.trigger, ' ');
  const m = text.match(FREE_MONTH);
  return m ? text.slice(Math.max(0, m.index - 80), m.index + 80) : null;
}

async function settle(page, ms = 600) { await page.waitForTimeout(ms); }

test('open: the banner under the heading shows the config\'s offer and note beside Book a call, and the cards say it only beside what Buy now charges', async ({ browser }) => {
  const ctx = await browser.newContext();
  const asked = await engine(ctx, json(200, { open: true, cap: CAP }));
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  const banner = page.locator('#foundingBanner');
  await expect(banner).toBeVisible();
  await expect(page.locator('#foundingOffer')).toHaveText(P.foundingClient.offer);
  await expect(page.locator('#foundingNote')).toHaveText(P.foundingClient.note);
  await expect(banner.locator('a[href="/book.html#pick-a-time"]')).toHaveText(/Book a call/);
  expect(asked.length, 'free-month.js asked the engine once').toBe(1);
  /* Directly under the heading (funnel audit item 1): above the lede and
     every plan, so a phone visitor reads it on the first screen. */
  const hero = await page.evaluate(() => {
    const top = (sel) => document.querySelector(sel).getBoundingClientRect().top;
    return { h1: top('h1'), banner: top('#foundingBanner'), lede: top('.page-hero .lede'), plans: top('#plans') };
  });
  expect(hero.banner).toBeGreaterThan(hero.h1);
  expect(hero.banner).toBeLessThan(hero.lede);
  expect(hero.banner).toBeLessThan(hero.plans);
  /* A Buy now card says the month only in its booked-call line, and that
     line sits beside what Buy now charges: never the month as a property of
     the card. No structured data says it, even while it is shown. */
  for (const card of await page.locator('#plans .plan').all()) {
    const fm = card.locator('.buy-fm');
    const outside = flat(await card.evaluate((c) => {
      const x = c.cloneNode(true); x.querySelectorAll('.buy-fm').forEach((e) => e.remove()); return x.innerText;
    }));
    expect(outside).not.toMatch(FREE_MONTH);
    if (await card.locator('.buy a[href*="/signup?plan="]').count()) {
      await expect(card.locator('.buy-note')).toContainText('Buy now charges your first month the day you start.');
      await expect(fm).toBeVisible();
      await expect(fm.locator('[data-nv-free-month-offer]')).toHaveText(P.foundingClient.offer);
      await expect(fm.locator('a')).toHaveAttribute('href', '/book.html#pick-a-time');
      await expect(fm.locator('a')).toHaveAttribute('data-evt', /^plan_quote_click_[a-z0-9_]+$/);
    } else {
      await expect(fm).toHaveCount(0);
    }
  }
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  for (const block of ld) expect(block).not.toMatch(FREE_MONTH);
  await ctx.close();
});

const CLOSED = [
  ['the engine says no place is open', json(200, { open: false, cap: CAP })],
  ['the engine fails (503, as its error path answers)', json(503, { open: false })],
  ['any status but 200, even with open:true in the body', json(500, { open: true, cap: CAP })],
  ['the route is missing (404)', (r) => r.fulfill({ status: 404, body: 'not found' })],
  ['the request is aborted', (r) => r.abort('failed')],
  ['the engine names a different cap', json(200, { open: true, cap: CAP + 10 })],
  ['the answer is not JSON', (r) => r.fulfill({ status: 200, contentType: 'text/html', headers: { 'access-control-allow-origin': '*' }, body: '<html>open</html>' })],
  ['open is the string "true", not true', json(200, { open: 'true', cap: CAP })],
];
for (const [why, answer] of CLOSED) {
  test(`closed when ${why}: hidden, and no visible text says the month is free`, async ({ browser }) => {
    const ctx = await browser.newContext();
    const asked = await engine(ctx, answer);
    const page = await ctx.newPage();
    await page.goto('/pricing.html');
    await expect.poll(() => asked.length).toBe(1);
    await settle(page);
    await expect(page.locator('#foundingBanner')).toBeHidden();
    await expect(page.locator('.buy-fm').first()).toBeHidden();
    expect(await visibleFreeMonth(page)).toBeNull();
    await ctx.close();
  });
}

test('closed when the engine answers yes after the eight seconds have run out', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, async (r) => {
    await new Promise((res) => setTimeout(res, 9000));
    try { await json(200, { open: true, cap: CAP })(r); } catch { /* the page aborted it, which is the point */ }
  });
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  await page.waitForTimeout(9800);
  await expect(page.locator('#foundingBanner')).toBeHidden();
  expect(await visibleFreeMonth(page)).toBeNull();
  await ctx.close();
});

test('open when the engine answers after five seconds: inside the eight-second wait', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, async (r) => {
    await new Promise((res) => setTimeout(res, 5000));
    try { await json(200, { open: true, cap: CAP })(r); } catch { /* aborted */ }
  });
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  await page.waitForTimeout(6200);
  await expect(page.locator('#foundingOffer')).toHaveText(P.foundingClient.offer);
  await ctx.close();
});

/* THE HOLD (funnel audit item 6): while the answer is on its way the
   banner's space is held, so the plans under it do not move when it shows,
   and a closed answer gives the space back. */
for (const width of [390, 1440]) {
  test(`held at ${width} wide: a late open answer moves the plans by nothing, a closed one gives the space back`, async ({ browser }) => {
    for (const open of [true, false]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await engine(ctx, async (r) => {
        await new Promise((res) => setTimeout(res, 1500));
        try { await json(200, { open, cap: CAP })(r); } catch { /* aborted */ }
      });
      const page = await ctx.newPage();
      await page.goto('/pricing.html');
      await page.waitForTimeout(300);
      const before = await page.evaluate(() => document.querySelector('#plans').getBoundingClientRect().top + scrollY);
      await expect(page.locator('[data-nv-free-month-hold]')).toHaveCount(1);
      await page.waitForTimeout(2000);
      await expect(page.locator('[data-nv-free-month-hold]'), 'the hold is released').toHaveCount(0);
      const after = await page.evaluate(() => document.querySelector('#plans').getBoundingClientRect().top + scrollY);
      if (open) expect(Math.abs(after - before), `the plans moved ${after - before}px when the banner showed`).toBeLessThanOrEqual(2);
      else expect(after, 'a closed answer gives the held space back').toBeLessThan(before - 100);
      await ctx.close();
    }
  });
}

/* The owner's switch and the cap are read before anything is asked: with
   either wrong, the engine is never even asked, so it cannot answer yes. */
const SWITCHES = [
  ['the owner\'s switch is off', (s) => s.replace(/(foundingClient:\s*\{\s*active:\s*)true/, '$1false')],
  ['the places do not equal the cap', (s) => s.replace(/(foundingClient:\s*\{\s*active:\s*true,\s*spots:\s*)\d+/, '$1' + (CAP + 1))],
];
for (const [why, edit] of SWITCHES) {
  test(`closed, and the engine is not asked, when ${why}`, async ({ browser }) => {
    const src = read('pricing-config.js');
    const moved = edit(src);
    expect(moved, 'the config edit applied').not.toBe(src);
    const ctx = await browser.newContext();
    await ctx.route(/\/pricing-config\.js(?:\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: moved }));
    const asked = await engine(ctx, json(200, { open: true, cap: CAP }));
    const page = await ctx.newPage();
    await page.goto('/pricing.html');
    await settle(page, 1200);
    expect(asked, 'free-month.js asked the engine anyway').toEqual([]);
    await expect(page.locator('#foundingBanner')).toBeHidden();
    expect(await visibleFreeMonth(page)).toBeNull();
    await ctx.close();
  });
}

test('with scripts off, nothing on the page says the month is free, and no space is held for it', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  await engine(ctx, json(200, { open: true, cap: CAP }));
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  await expect(page.locator('#foundingBanner')).toBeHidden();
  expect(await page.locator('#foundingOffer').textContent()).toBe('');
  expect(await page.locator('.fm-hold').evaluate((el) => el.getBoundingClientRect().height), 'the noscript rule releases the hold').toBeLessThan(2);
  const text = flat(await page.locator('body').innerText()).replace(P.referral.offer, '').replace(P.referral.trigger, '');
  expect(text).not.toMatch(FREE_MONTH);
  await ctx.close();
});

for (const width of [1440, 390]) {
  for (const open of [true, false]) {
    test(`at ${width} wide with the gate ${open ? 'open' : 'closed'}: no sideways scroll, no console error`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await engine(ctx, json(200, { open, cap: CAP }));
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('/pricing.html');
      await page.waitForLoadState('networkidle');
      if (open) await expect(page.locator('#foundingBanner')).toBeVisible();
      else await expect(page.locator('#foundingBanner')).toBeHidden();
      const sideways = await page.evaluate(() => document.scrollingElement.scrollWidth - document.documentElement.clientWidth);
      expect(sideways, `scrolls sideways by ${sideways}px`).toBeLessThanOrEqual(0);
      if (process.env.NV_SHOTS) {
        fs.mkdirSync(process.env.NV_SHOTS, { recursive: true });
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')));
        await page.screenshot({ path: path.join(process.env.NV_SHOTS, `pricing-${width}-${open ? 'open' : 'closed'}.png`), fullPage: true });
      }
      expect(errors, errors.join('\n')).toEqual([]);
      await ctx.close();
    });
  }
}

/* The three Front Desk sizes, side by side, minutes first (owner amendment
   #67), each with Buy now to its own plan, and the minutes check recommending
   the lowest total for an estimate (funnel audit item 11). */
test('the three Front Desk sizes sit side by side under one heading, minutes first, each with its own Buy now', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await engine(ctx, json(200, { open: false, cap: CAP }));
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  const tiers = P.frontDeskTiers();
  expect(tiers.map((t) => t.id)).toEqual(['front-desk-starter', 'front-desk-plus', 'pro']);
  await expect(page.locator('.sizes-head h3')).toHaveText(P.frontDeskSizes.heading);
  await expect(page.locator('.sizes-head p')).toContainText('Same receptionist, answers 24/7');
  const cards = page.locator('#plans .plan.size');
  await expect(cards).toHaveCount(3);
  const tops = [];
  for (let i = 0; i < 3; i++) {
    const card = cards.nth(i);
    await expect(card.locator('h3')).toHaveText(tiers[i].name);
    await expect(card.locator('.mins')).toContainText(tiers[i].includedMinutes.toLocaleString('en-CA'));
    await expect(card.locator('.buy a')).toHaveAttribute('href', 'https://app.nevamis.ca/signup?plan=' + tiers[i].id);
    await expect(card.locator('.buy a')).toHaveText(/Buy now/);
    /* The price line is the whole price: no fee, so no second line that
       repeats it, and nothing on the card about a free month. */
    await expect(card.locator('.price')).toHaveText(P.money(tiers[i].monthly) + '/month');
    await expect(card.locator('.setup')).toHaveCount(0);
    expect(await card.innerText()).not.toMatch(FREE_MONTH);
    tops.push((await card.boundingBox()).y);
  }
  expect(new Set(tops.map(Math.round)).size, 'the three sizes share one row at 1440').toBe(1);
  /* THE LOWEST TOTAL (funnel audit item 11). 150 calls of 2.5 minutes is
     375 minutes: Front Desk Starter with 175 extra minutes at C$1.10 is
     C$442.50, less than Front Desk Plus at C$500, so Starter is the pick,
     and the Why line names the extra minutes, the total, and where Plus
     takes over (200 + 250 / 1.10, rounded up: 428 minutes). */
  const pick = page.locator('#rcResult .pick');
  const why = page.locator('#rcResult p');
  const total = (p, est) => p.monthly + Math.max(0, est - p.includedMinutes) * p.overage;
  const cheapest = (est) => P.plans.filter((p) => p.selfServe !== false)
    .sort((a, b) => (total(a, est) - total(b, est)) || (b.includedMinutes - a.includedMinutes))[0];
  expect(cheapest(375).id).toBe('front-desk-starter');
  await expect(pick).toHaveText('Front Desk Starter · ' + P.startLine(tiers[0]).replace(/\.$/, ''));
  await expect(why).toContainText('375 estimated AI minutes a month is 175 past the 200 included on Front Desk Starter. At C$1.10 each that comes to about C$442.50 a month, the lowest total for these minutes.');
  await expect(why).toContainText('Front Desk Plus covers these minutes for C$500 a month, so it costs more here; it becomes the cheaper of the two past about 428 minutes a month.');
  /* 240 calls is 600 minutes: Front Desk Plus (C$547.50 with 50 extra
     minutes) beats Starter (C$690 with 400), and overage is why. */
  await page.fill('#rcVol', '240');
  expect(cheapest(600).id).toBe('front-desk-plus');
  await expect(pick).toHaveText('Front Desk Plus · ' + P.startLine(tiers[1]).replace(/\.$/, ''));
  await expect(why).toContainText('A bigger plan is cheaper here because of overage: Front Desk Starter is C$250 a month, but with 400 extra minutes at C$1.10 each it would come to about C$690.00.');
  /* 400 calls is 1,000 minutes: Plus with 450 extra minutes (C$927.50) still
     costs less than the AI Front Desk's C$1,000, so the pick is Plus. */
  await page.fill('#rcVol', '400');
  expect(cheapest(1000).id).toBe('front-desk-plus');
  await expect(pick).toHaveText('Front Desk Plus · ' + P.startLine(tiers[1]).replace(/\.$/, ''));
  await expect(why).toContainText('about C$927.50 a month, the lowest total');
  /* 480 calls is 1,200 minutes: the AI Front Desk covers it for less than
     Plus with 650 extra minutes (C$1,117.50); The Works carries the same
     minutes and is named as a choice about automations. */
  await page.fill('#rcVol', '480');
  expect(cheapest(1200).id).toBe('pro');
  await expect(pick).toHaveText('AI Front Desk · ' + P.startLine(tiers[2]).replace(/\.$/, ''));
  await expect(why).toContainText('fit inside the 1,400 included on AI Front Desk');
  await expect(why).toContainText('A bigger plan is cheaper here because of overage: Front Desk Plus');
  await expect(why).toContainText('The Works carries the same minutes and adds automations');
  /* 60 calls is 150 minutes: Starter covers it, and nothing is explained. */
  await page.fill('#rcVol', '60');
  await expect(pick).toHaveText('Front Desk Starter · ' + P.startLine(tiers[0]).replace(/\.$/, ''));
  await expect(why).not.toContainText('cheaper');
  /* SMALLEST FIRST, THE INVITATION LAST (funnel audit item 1): the rendered
     cards, and the no-script fallback in the same order. */
  const names = await page.locator('#plans .plan h3').allTextContents();
  const invited = P.plans.filter((p) => p.selfServe === false).map((p) => p.name);
  expect(names).toEqual([...tiers.map((t) => t.name), 'The Works', ...invited]);
  const monthlies = names.slice(0, -invited.length).map((n) => P.plans.find((p) => p.name === n).monthly);
  expect(monthlies, 'everything a business can buy, cheapest first').toEqual([...monthlies].sort((a, b) => a - b));
  await expect(page.locator('#plans .plan').last().locator('.price')).toHaveText('By invitation');
  const fallback = fs.readFileSync(path.join(root, 'pricing.html'), 'utf8').match(/<div id="plansFallback">([\s\S]*?)<\/div><\/div>/)[1];
  const fbNames = [...fallback.matchAll(/<h3>([^&<]+?)\s*&middot;/g)].map((m) => m[1].trim());
  expect(fbNames, 'the no-script fallback lists the plans in the rendered order').toEqual(names);
  /* The structured data's floor is the smallest self-serve monthly. */
  const product = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } })
    .flat().find((x) => x && x['@type'] === 'Product'));
  expect(product.offers.lowPrice).toBe(String(Math.min(...P.plans.filter((p) => p.selfServe !== false).map((p) => p.monthly))));
  expect(product.offers.lowPrice).toBe('250');
  await ctx.close();
});
