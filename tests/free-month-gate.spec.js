/* ============================================================
   THE FIRST MONTH FREE SHOWS ONLY WHILE A PLACE IS OPEN
   (v7, owner amendment #66, 2026-10-03; ENGINE-SPEC section 4, guard 3).

   The first month free is for the first `freeMonth.firstClients` clients,
   given on a booked call. pricing.html says it in one place, #foundingBanner,
   which ships hidden and empty; free-month.js fills it from
   pricing-config.js foundingClient and shows it only when:
     - foundingClient.active is true and foundingClient.spots equals
       freeMonth.firstClients, and
     - GET https://app.nevamis.ca/api/free-month answers 200 within three
       seconds with {"open": true, "cap": <the same number>}.
   Anything else leaves it hidden: fail closed. These tests answer the engine
   route themselves, so no run asks production, and they hold:

     open      the banner shows, with the config's words, beside Book a call,
               and the Buy now cards and the page's structured data still say
               nothing about a free month;
     closed    open:false, a 503, a 404, an aborted request, a slow answer, a
               different cap, the owner's switch off, or places that do not
               equal the cap: the banner stays hidden and no visible text on
               the page says the month is free;
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

test('open: the banner shows the config\'s offer and note beside Book a call, and nowhere else says it', async ({ browser }) => {
  const ctx = await browser.newContext();
  const asked = await engine(ctx, json(200, { open: true, cap: CAP }));
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  const banner = page.locator('#foundingBanner');
  await expect(banner).toBeVisible();
  await expect(page.locator('#foundingOffer')).toHaveText(P.foundingClient.offer);
  await expect(page.locator('#foundingNote')).toHaveText(P.foundingClient.note);
  await expect(banner.locator('a[href="/book.html"]')).toHaveText(/Book a call/);
  expect(asked.length, 'free-month.js asked the engine once').toBe(1);
  /* The offer is the banner's alone: no Buy now card, no chooser total and
     no structured data says it, even while it is shown. */
  for (const t of await page.locator('#plans .plan').allInnerTexts()) expect(t).not.toMatch(FREE_MONTH);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  for (const block of ld) expect(block).not.toMatch(FREE_MONTH);
  await ctx.close();
});

const CLOSED = [
  ['the engine says no place is open', json(200, { open: false, cap: CAP })],
  ['the engine fails (503, as its error path answers)', json(503, { open: false })],
  ['any status but 200, even with open:true in the body', json(500, { open: true, cap: CAP })],
  ['the route does not exist yet (404, before v7 deploys)', (r) => r.fulfill({ status: 404, body: 'not found' })],
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
    expect(await visibleFreeMonth(page)).toBeNull();
    await ctx.close();
  });
}

test('closed when the engine answers yes after the three seconds have run out', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, async (r) => {
    await new Promise((res) => setTimeout(res, 3800));
    try { await json(200, { open: true, cap: CAP })(r); } catch { /* the page aborted it, which is the point */ }
  });
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  await page.waitForTimeout(4600);
  await expect(page.locator('#foundingBanner')).toBeHidden();
  expect(await visibleFreeMonth(page)).toBeNull();
  await ctx.close();
});

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

test('with scripts off, nothing on the page says the month is free', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  await engine(ctx, json(200, { open: true, cap: CAP }));
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  await expect(page.locator('#foundingBanner')).toBeHidden();
  expect(await page.locator('#foundingOffer').textContent()).toBe('');
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
   the smallest size that covers an estimate. */
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
  /* 150 calls of 2.5 minutes is 375 minutes: Front Desk Plus covers it and
     Front Desk Starter does not. */
  await expect(page.locator('#rcResult .pick')).toHaveText('Front Desk Plus · ' + P.startLine(tiers[1]).replace(/\.$/, ''));
  await page.fill('#rcVol', '60');
  await expect(page.locator('#rcResult .pick')).toHaveText('Front Desk Starter · ' + P.startLine(tiers[0]).replace(/\.$/, ''));
  /* The structured data's floor is the smallest self-serve monthly. */
  const product = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } })
    .flat().find((x) => x && x['@type'] === 'Product'));
  expect(product.offers.lowPrice).toBe(String(Math.min(...P.plans.filter((p) => p.selfServe !== false).map((p) => p.monthly))));
  expect(product.offers.lowPrice).toBe('250');
  await ctx.close();
});
