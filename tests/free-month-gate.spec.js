/* ============================================================
   THE FIRST MONTH FREE SHOWS ONLY WHILE A PLACE IS OPEN
   (v7, owner amendment #66, 2026-10-03; ENGINE-SPEC section 4, guard 3).

   The first month free is for the first `freeMonth.firstClients` businesses,
   given on a booked call. Since owner decision #81 (2026-11-10) retired the
   pricing page, book.html is where it is said in full, in #bookFreeMonth
   over the calendar, which ships hidden and empty; free-month.js fills it
   from pricing-config.js foundingClient (the homepage's one-line version is
   held by tests/home-simple.spec.js). Before it asks, foundingClient.active
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
               a late open answer moves the plans by nothing; a closed or
               failed answer keeps the space and says foundingClient.closedLine
               in it, so it moves nothing either (launch audit PERF-5); and
               with the owner's switch off nothing is held, so nothing moves;
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

test('open: the card over the calendar shows the config\'s offer and note, and the structured data says nothing of it', async ({ browser }) => {
  const ctx = await browser.newContext();
  const asked = await engine(ctx, json(200, { open: true, cap: CAP }));
  const page = await ctx.newPage();
  await page.goto('/book.html');
  const card = page.locator('#bookFreeMonth');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-nv-free-month-offer]')).toHaveText(P.foundingClient.offer);
  await expect(card.locator('[data-nv-free-month-note]')).toHaveText(P.foundingClient.note);
  expect(asked.length, 'free-month.js asked the engine once').toBe(1);
  /* Over the calendar it introduces, inside the scheduler panel. */
  const at = await page.evaluate(() => {
    const top = (sel) => document.querySelector(sel).getBoundingClientRect().top;
    return { panel: top('#pick-a-time'), card: top('#bookFreeMonth'), frame: top('#bkFrame') };
  });
  expect(at.card).toBeGreaterThan(at.panel);
  expect(at.card).toBeLessThan(at.frame);
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
    await page.goto('/book.html');
    await expect.poll(() => asked.length).toBe(1);
    await settle(page);
    await expect(page.locator('#bookFreeMonth')).toBeHidden();
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
  await page.goto('/book.html');
  await page.waitForTimeout(9800);
  await expect(page.locator('#bookFreeMonth')).toBeHidden();
  /* No answer in time keeps the space too, and says the closed line in it
     (PERF-5), which is never the offer: the line below proves that. */
  await expect(page.locator('[data-nv-free-month-closed]')).toHaveText(P.foundingClient.closedLine);
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
  await page.goto('/book.html');
  await page.waitForTimeout(6200);
  await expect(page.locator('#bookFreeMonth [data-nv-free-month-offer]')).toHaveText(P.foundingClient.offer);
  await ctx.close();
});

/* THE HOLD (funnel audit item 6; PR #62 review, item 2). While the answer
   is on its way the banner's space is held, so a late OPEN answer moves the
   plans by nothing. A CLOSED answer gives the space back, and that moves
   everything under it: measured here, per frame from first paint, not just
   that the space came back. The hold is written by build-pages.mjs only while
   foundingClient.active is true, so once the owner switches the offer off,
   nothing is held and nothing moves; while the switch is on, the only
   movement a closed answer may cause is the held height itself. */
/* The element directly under the hold on each page. Its distance from the
   hold's top edge is what the hold, the card and a closed answer can change;
   the page's own late layout (a font swap, book.html's prefill fold) moves
   both together and is not counted. */
const PAGES_HELD = { '/book.html': '#pick-a-time .sched-price' };
/* That distance on every frame from first paint to three seconds in, and the
   height the hold kept on the first frame. */
async function travel(browser, url, sel, { width, answer, config, html }) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.route(/cal\.com/, (r) => r.abort());
  if (config) await ctx.route(/\/pricing-config\.js(?:\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: config }));
  if (html) await ctx.route(new RegExp(url.replace('.', '\\.') + '$'), (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
  await engine(ctx, async (r) => {
    await new Promise((res) => setTimeout(res, 1500));
    try { await answer(r); } catch { /* aborted */ }
  });
  const page = await ctx.newPage();
  await page.addInitScript((s) => {
    window.__ys = []; window.__held = null;
    const tick = () => {
      const el = document.querySelector(s), h = document.querySelector('.fm-hold');
      if (el && h) {
        if (window.__held === null) window.__held = parseFloat(getComputedStyle(h).minHeight) || 0;
        window.__ys.push(el.getBoundingClientRect().top - h.getBoundingClientRect().top);
      }
      if (window.__ys.length < 400) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, sel);
  await page.goto(url);
  await page.waitForTimeout(3000);
  const ys = await page.evaluate(() => window.__ys);
  const held = await page.evaluate(() => window.__held || 0);
  /* What the held space says once the answer is in, and whether it still
     fits the space it was given. */
  const closed = await page.evaluate(() => {
    const el = document.querySelector('[data-nv-free-month-closed]'), h = document.querySelector('.fm-hold');
    if (!el || !h) return null;
    const e = el.getBoundingClientRect(), b = h.getBoundingClientRect();
    return { text: el.textContent, inside: e.top >= b.top - 1 && e.bottom <= b.bottom + 1 && e.height > 0 };
  });
  await ctx.close();
  return { moved: Math.round(ys[ys.length - 1] - ys[0]), most: Math.round(Math.max(...ys) - Math.min(...ys)), held, closed };
}

for (const width of [390, 1440]) {
  test(`held at ${width} wide: a late open answer moves what is under the card by nothing`, async ({ browser }) => {
    for (const [url, sel] of Object.entries(PAGES_HELD)) {
      const r = await travel(browser, url, sel, { width, answer: json(200, { open: true, cap: CAP }) });
      expect(Math.abs(r.most), `${url}: moved ${r.most}px when the card showed`).toBeLessThanOrEqual(2);
    }
  });

  test(`closed at ${width} wide with the owner's switch off: nothing is held, and nothing under the card moves`, async ({ browser }) => {
    const config = read('pricing-config.js').replace(/(foundingClient:\s*\{\s*active:\s*)true/, '$1false');
    const { applyFreeMonthHold } = await import('../scripts/lib/free-month-hold.mjs');
    for (const [url, sel] of Object.entries(PAGES_HELD)) {
      /* The page as build-pages.mjs writes it with the switch off. */
      const html = applyFreeMonthHold(read(url.slice(1)), false);
      expect(html, `${url}: built with the switch off, it carries no hold`).not.toMatch(/data-nv-free-month-hold>/);
      const r = await travel(browser, url, sel, { width, answer: json(200, { open: false, cap: CAP }), config, html });
      expect(r.held, `${url}: no space held`).toBe(0);
      expect(Math.abs(r.most), `${url}: content under the card moved ${r.most}px`).toBeLessThanOrEqual(2);
    }
  });

  /* Until launch audit PERF-5 (2026-11-09) a closed answer gave the held
     space back, and everything under it moved up by the held height: a
     layout shift of 0.19 on pricing.html on a phone with the engine slow, and
     on book.html the calendar pulled up under a finger. Now the space stays
     and says foundingClient.closedLine, a line about the terms, whichever
     way the answer goes: a closed answer and a failed one alike. */
  test(`closed at ${width} wide with the switch on: the space stays, says the closed line, and nothing under it moves`, async ({ browser }) => {
    expect(P.foundingClient.closedLine, 'pricing-config.js foundingClient.closedLine').toBeTruthy();
    for (const [url, sel] of Object.entries(PAGES_HELD)) {
      for (const [why, answer] of [['open:false', json(200, { open: false, cap: CAP })], ['a 503', json(503, { open: false })]]) {
        const r = await travel(browser, url, sel, { width, answer });
        console.log(`closed (${why}), switch on, ${width}: ${url} content under the card moved ${r.most}px at most, hold ${r.held}px`);
        expect(r.held, `${url} (${why}): the card's space is held while the switch is on`).toBeGreaterThan(0);
        expect(Math.abs(r.most), `${url} (${why}): content under the card moved ${r.most}px on a closed answer`).toBeLessThanOrEqual(2);
        expect(r.closed && r.closed.text, `${url} (${why}): the held space says foundingClient.closedLine`).toBe(P.foundingClient.closedLine);
        expect(r.closed.inside, `${url} (${why}): the closed line fits inside the held space`).toBe(true);
      }
    }
  });
}

/* The hold in the committed pages follows the switch: build-pages.mjs writes
   it only while foundingClient.active is true, and a page carries it then. */
test('the committed pages carry the hold exactly when the owner\'s switch is on', async () => {
  const { applyFreeMonthHold, freeMonthActive } = await import('../scripts/lib/free-month-hold.mjs');
  const active = freeMonthActive(P);
  for (const url of Object.keys(PAGES_HELD)) {
    const html = read(url.slice(1));
    expect(applyFreeMonthHold(html, active), `${url} is not what build-pages.mjs writes for active=${active}`).toBe(html);
    expect(/data-nv-free-month-hold>/.test(html), `${url}: hold present = switch on`).toBe(active);
  }
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
    await page.goto('/book.html');
    await settle(page, 1200);
    expect(asked, 'free-month.js asked the engine anyway').toEqual([]);
    await expect(page.locator('#bookFreeMonth')).toBeHidden();
    expect(await visibleFreeMonth(page)).toBeNull();
    await ctx.close();
  });
}

test('with scripts off, nothing on the page says the month is free, and no space is held for it', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  await engine(ctx, json(200, { open: true, cap: CAP }));
  const page = await ctx.newPage();
  await page.goto('/book.html');
  await expect(page.locator('#bookFreeMonth')).toBeHidden();
  expect(await page.locator('#bookFreeMonth [data-nv-free-month-offer]').textContent()).toBe('');
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
      await page.goto('/book.html');
      await page.waitForLoadState('networkidle');
      if (open) await expect(page.locator('#bookFreeMonth')).toBeVisible();
      else await expect(page.locator('#bookFreeMonth')).toBeHidden();
      const sideways = await page.evaluate(() => document.scrollingElement.scrollWidth - document.documentElement.clientWidth);
      expect(sideways, `scrolls sideways by ${sideways}px`).toBeLessThanOrEqual(0);
      if (process.env.NV_SHOTS) {
        fs.mkdirSync(process.env.NV_SHOTS, { recursive: true });
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')));
        await page.screenshot({ path: path.join(process.env.NV_SHOTS, `book-${width}-${open ? 'open' : 'closed'}.png`), fullPage: true });
      }
      expect(errors, errors.join('\n')).toEqual([]);
      await ctx.close();
    });
  }
}
