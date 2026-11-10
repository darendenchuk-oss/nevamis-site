/* ============================================================
   THE HOMEPAGE SAYS THE v7 OFFER, AND ONLY WHERE IT CAN STOP SAYING IT
   (v7 site leaf v7-site-home, held for counsel under decision #69; owner
   amendments #66 and #67; audit findings HOME-2, HOME-3, HOME-4, HOME-6).

   Draft PR #41 wrote the homepage before #66 and #67: its plans heading,
   ledes and five FAQ answers promised a free first month to every new
   business, its "Can I try it before I commit?" answered "Yes. Your first
   month is free.", the FAQ said the Partnership was the one plan with a fee
   to start while the Enterprise card on the same page showed one, and no
   part of the homepage named the three Front Desk sizes. Every one of those
   sentences was copied into the FAQPage JSON-LD, which cannot be switched
   off when the tenth place is taken. The rules below hold the homepage to
   the corrected offer:

     HOME-2  no visible sentence says the month is free while the engine
             reports no place open (open:false, a 503, an aborted request);
             with a place open, every sentence that says it names the first
             N businesses (N = freeMonth.firstClients), the booked call, the
             plan carrying on as a paid monthly unless cancelled, and once
             per business; the FAQ's own lines also name the card at sign-up. No FAQ
             question asks whether a buyer can try it, and the FAQPage
             JSON-LD carries no free month at all.
     HOME-3  "Is there a fee to start?" names the Performance Partnership AND
             Enterprise as the plans with one.
     HOME-4  the film's Plans pane prices the three Front Desk sizes from
             pricing-config.js, under their own ids, smallest first, and the
             plans lede names them.
     HOME-6  the cancellation answer says "pay nothing" only conditionally,
             inside the gated paragraph that opens "If you".
     v6      no sentence on the homepage gives a fee-less plan a Launch &
             Implementation fee.

   Every figure and name is read from pricing-config.js. The engine route is
   answered here, so no run asks production.

   Run it on its own port:
     NV_PORT=3377 npx playwright test tests/v7-home-offer.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const P = (() => {
  const sandbox = { window: {} };
  vm.runInNewContext(read('pricing-config.js'), sandbox, { timeout: 1000 });
  return sandbox.window.NV_PRICING;
})();
const N = P.freeMonth.firstClients;
const ENDPOINT = 'https://app.nevamis.ca/api/free-month';

/* The engine's FREE_MONTH vocabulary (canonical.ts freePeriodMisstatements),
   the same expression guard 7u and tests/free-month-gate.spec.js use. */
const FREE_MONTH = /(?<!\b(?:no|not\s+a|never\s+a|without\s+a)\s)(?:free\s+(?:first\s+)?months?|first\s+month\s+(?:is\s+|for\s+)?free|months?\s+free|month\s+on\s+us)/i;
const flat = (s) => s.replace(/\s+/g, ' ').trim();
const sentences = (t) => flat(t).split(/(?<=[.!?])\s+/);

async function engine(ctx, answer) {
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => (r.request().url().startsWith(ENDPOINT) ? answer(r) : r.fulfill({ status: 204, body: '' })));
}
const json = (status, body) => (r) => r.fulfill({
  status, contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});
const OPEN = json(200, { open: true, cap: N });
const CLOSED_ANSWERS = {
  'open:false': json(200, { open: false, cap: N }),
  'a 503': json(503, { open: false }),
  'an aborted request': (r) => r.abort(),
};

/* Every FAQ answer opened, so innerText reads all of them, then the visible
   text of the page. */
async function readable(page) {
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  return flat(await page.locator('body').innerText());
}
async function load(browser, answer, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await engine(ctx, answer);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/home.html?rm=1');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  return { ctx, page, errors };
}

/* ---------- HOME-2: closed, nothing says it ---------- */

for (const [why, answer] of Object.entries(CLOSED_ANSWERS)) {
  test(`HOME-2: with ${why}, no visible sentence on the homepage says the month is free`, async ({ browser }) => {
    const { ctx, page } = await load(browser, answer);
    const text = await readable(page);
    const hit = sentences(text).filter((s) => FREE_MONTH.test(s));
    expect(hit, 'a free-month sentence a buyer can read after the places are gone').toEqual([]);
    for (const el of await page.locator('[data-nv-free-month]').all()) expect(await el.isHidden()).toBe(true);
    await ctx.close();
  });
}

/* ---------- HOME-2: open, every sentence carries its conditions ---------- */

test('HOME-2: with a place open, every free-month block names the first N, the booked call, conversion and once per business, and the FAQ lines name the card', async ({ browser }) => {
  const { ctx, page } = await load(browser, OPEN);
  await expect(page.locator('#freeMonthHome')).toBeVisible();
  const said = [];
  for (const el of await page.locator('[data-nv-free-month]').all()) {
    await el.evaluate((e) => { const d = e.closest('details'); if (d) d.open = true; });
    expect(await el.isVisible(), 'a gated element stayed hidden with a place open').toBe(true);
    said.push(flat(await el.innerText()));
  }
  expect(said.length, 'the plans card and the two FAQ lines').toBeGreaterThanOrEqual(3);
  /* Businesses only since owner decision #74 (2026-10-08): this accepted
     "clients" too, the noun a caller heard as clients Nevamis already has. */
  const firstN = new RegExp('\\bfirst ' + N + ' businesses\\b', 'i');
  for (const block of said) {
    expect(block, 'a gated block that does not say the month is free has no reason to be gated').toMatch(FREE_MONTH);
    expect(block, 'the cap').toMatch(firstN);
    expect(block, 'the booked call').toMatch(/\bbooked call\b/i);
    expect(block, 'once per business').toMatch(/\bonce per business\b/i);
    expect(block, 'it carries on as a paid monthly').toMatch(/carries on as a paid monthly unless you cancel/i);
    expect(block, 'never a trial').not.toMatch(/\btrial|\bpilot|no (?:credit )?card/i);
    expect(block, 'never every new client').not.toMatch(/\b(?:every|all|any) new (?:client|business|customer)/i);
  }
  const faq = await page.locator('#faq [data-nv-free-month]').allInnerTexts();
  expect(faq.length, 'the cost and cancellation answers each carry one').toBe(2);
  for (const f of faq) {
    expect(f, 'the card at sign-up').toMatch(/\bcard\b[^.]*\bsign-up\b|\bsign-up\b[^.]*\bcard\b/i);
  }
  /* Outside the gated elements, still nothing says it. */
  const outside = await page.evaluate(() => {
    const c = document.body.cloneNode(true);
    c.querySelectorAll('[data-nv-free-month], script, style').forEach((e) => e.remove());
    return c.textContent;
  });
  expect(sentences(outside).filter((s) => FREE_MONTH.test(s)), 'a free-month sentence outside a gated element').toEqual([]);
  await ctx.close();
});

/* ---------- HOME-2: structured data and the question itself ---------- */

test('HOME-2: the FAQPage JSON-LD carries no free month, and no FAQ question asks whether a buyer can try it', async () => {
  for (const f of ['home.html', 'index.html']) {
    const html = read(f);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const faqPage = blocks.flat().find((b) => b['@type'] === 'FAQPage') || blocks.flatMap((b) => b['@graph'] || []).find((b) => b['@type'] === 'FAQPage');
    expect(faqPage, f + ' publishes a FAQPage').toBeTruthy();
    for (const q of faqPage.mainEntity) {
      expect(q.name, f + ': a question that frames the offer as trying the product').not.toMatch(/\btry\b|\btrial\b/i);
      expect(q.acceptedAnswer.text, f + ': structured data says the month is free: ' + q.name).not.toMatch(FREE_MONTH);
    }
    for (const m of html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)) expect(m[1], f + ' FAQ question').not.toMatch(/\btry it\b|\btrial\b/i);
  }
});

/* ---------- HOME-3: both plans with a fee to start ---------- */

test('HOME-3: "Is there a fee to start?" names the Performance Partnership and Enterprise', async ({ page }) => {
  await page.goto('/home.html?rm=1');
  const d = page.locator('#faq details', { hasText: 'Is there a fee to start?' });
  await expect(d).toHaveCount(1);
  const a = flat(await d.locator('p').first().textContent());
  const partner = P.plans.find((p) => p.selfServe === false && p.launch > 0);
  expect(a).toContain(partner.name);
  expect(a).toContain(P.enterprise.name);
  expect(a, 'it must not call one of them the only one').not.toMatch(/\bthe one plan\b|\bthe only plan\b/i);
});

/* ---------- HOME-4: the three sizes, from the config ---------- */

test('HOME-4: the Plans pane prices the three Front Desk sizes from pricing-config.js, smallest first, and the lede names them', async ({ page }) => {
  await page.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await page.goto('/home.html?rm=1');
  await page.waitForFunction(() => document.getElementById('plansStrip')?.innerHTML.length > 0);
  const sizes = P.frontDeskTiers();
  expect(sizes.length, 'the config carries the three sizes').toBe(3);
  const keyed = await page.$$eval('#doc-plans [data-plan-price]', (els) => els.map((e) => ({
    key: e.getAttribute('data-plan-price'),
    name: e.closest('.svc').querySelector('h4').firstChild.textContent.trim(),
    price: e.textContent.trim(),
  })));
  const sizeRows = keyed.filter((k) => sizes.some((s) => s.id === k.key));
  expect(sizeRows.map((r) => r.key), 'the sizes, under their own ids, smallest first').toEqual(sizes.map((s) => s.id));
  for (const s of sizes) {
    const row = sizeRows.find((r) => r.key === s.id);
    expect(row.name).toBe(s.name);
    expect(row.price, s.name + ' is priced from its own record').toBe(P.startLine(s));
  }
  /* "starter" is the Partnership's key: a slot keyed so is the Partnership. */
  for (const k of keyed.filter((x) => x.key === 'starter')) expect(k.name).toBe(P.plans.find((p) => p.id === 'starter').name);
  const lede = flat(await page.locator('#plans .lede').textContent());
  for (const s of sizes) expect(lede, 'the plans lede names ' + s.name).toContain(s.name);
  expect(lede).toMatch(/same receptionist, answering 24\/7/);
});

/* ---------- HOME-6: pay nothing only for a free month ---------- */

test('HOME-6: the cancellation answer says "pay nothing" only in the gated line that opens "If you"', async ({ page }) => {
  await page.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await page.goto('/home.html?rm=1');
  const d = page.locator('#faq details', { hasText: 'What if it is not a fit?' });
  const first = flat(await d.locator('p').first().textContent());
  expect(first, 'the answer every buyer reads').not.toMatch(/pay nothing|free month|first month free/i);
  const gated = d.locator('p[data-nv-free-month]');
  await expect(gated).toHaveCount(1);
  expect(await gated.getAttribute('hidden')).not.toBeNull();
  expect(flat(await gated.textContent())).toMatch(/^If you\b[^.]*\bfirst month free\b[^.]*\bpay nothing\b/);
});

/* ---------- v6: no fee-less plan given a Launch & Implementation fee ---------- */

test('v6: no homepage sentence gives the Front Desk sizes, The Works or an add-on a Launch & Implementation fee', async ({ page }) => {
  await page.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await page.goto('/home.html?rm=1');
  await page.waitForFunction(() => document.getElementById('plansStrip')?.innerHTML.length > 0);
  const text = await readable(page);
  const feeless = [...P.plans.filter((p) => !(p.launch > 0)).map((p) => p.name), 'add-on', 'every plan', 'Every plan'];
  const bad = sentences(text).filter((s) => /Launch (?:&|and) Implementation/i.test(s)
    && feeless.some((n) => s.includes(n))
    /* Only "charged on none of them" excuses it. A looser excuse ("no",
       "alone") let the v6 lede through on its "no minimum term" clause. */
    && !/\bnone\b/i.test(s));
  expect(bad, 'a sentence that charges a fee-less plan a Launch & Implementation fee').toEqual([]);
  expect(text, 'the v6 heading').not.toMatch(/One fee to start/i);
});

/* ---------- G4: both widths, both answers ---------- */

for (const width of [1440, 390]) {
  for (const [label, answer] of [['open', OPEN], ['closed', CLOSED_ANSWERS['open:false']]]) {
    test(`at ${width} wide with the gate ${label}: no sideways scroll and no console error`, async ({ browser }) => {
      const { ctx, page, errors } = await load(browser, answer, { width, height: 900 });
      await readable(page);
      const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      expect(sw, 'the page scrolls sideways').toBeLessThanOrEqual(cw);
      if (label === 'open') {
        const box = await page.locator('#freeMonthHome').boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(cw + 0.5);
      }
      expect(errors).toEqual([]);
      await ctx.close();
    });
  }
}
