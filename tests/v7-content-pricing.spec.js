/* ============================================================
   THE CONTENT PAGES UNDER COMMERCIAL MODEL V7
   (owner amendments #66 and #67, 2026-10-03; leaf v7-site-content)

   What the nine generated pages, the hub and the hand pages this layer owns
   must do under v7, each judged where a buyer meets it:

     price      every figure on them is read from pricing-config.js: change a
                Front Desk size there and the trade line, the voicemail row
                and the answering-service row move with it (COMPARE-3,
                COMPARE-4, TRADES-7). Missed-Call Recovery's price says
                nothing about a free month (PRODUCT-9).
     free month the first month free for the first clients appears only
                inside the hidden element free-month.js controls, only after
                the engine says a place is open, beside the booked call and
                never the Buy now; with the gate closed, scripts off, or the
                owner's switch off at build time, nothing says it
                (COMPARE-2, PRODUCT-9, TRADES-7).
     names      the capability is "the front desk" on the hub, the demo
                title, the roadmap card and the Revenue Engine page, since
                "AI Front Desk" is the largest size's name (PRODUCT-11,
                PLATFORM-9).
     layout     at 1440 and 390 wide, gate open and closed, no page scrolls
                sideways and none logs a console error.

   The engine route is answered here, so no run asks production:
     NV_PORT=3391 npx playwright test tests/v7-content-pricing.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const config = (src = read('pricing-config.js')) => {
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { timeout: 1000 });
  return sandbox.window.NV_PRICING;
};
const P = config();
const CAP = P.freeMonth.firstClients;
const ENDPOINT = 'https://app.nevamis.ca/api/free-month';
const money = (n) => 'C$' + n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
const SIZES = P.frontDeskTiers();
const ENTRY = SIZES.filter((s) => s.selfServe !== false).sort((a, b) => a.monthly - b.monthly)[0];
const FREE_MONTH = /(?<!\b(?:no|not\s+a|never\s+a|without\s+a)\s)(?:free\s+(?:first\s+)?months?|first\s+month\s+(?:is\s+|for\s+)?free|months?\s+free|month\s+on\s+us)/i;
const flat = (s) => s.replace(/\s+/g, ' ').trim();

const TRADES = ['electricians.html', 'hvac.html', 'plumbers.html', 'restoration.html'];
const GATED = [...TRADES, 'missed-calls.html', 'vs-voicemail.html'];
const CHANGED = [...GATED, 'vs-answering-service.html', 'solutions.html', 'demo.html', 'revenue-engine.html', 'about.html', 'coming-soon.html'];

/* Every request to the engine origin but the free-month route (the page-view
   beacon) gets the 204 the real one gives. */
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
const OPEN = json(200, { open: true, cap: CAP });
const SHUT = json(200, { open: false, cap: CAP });

/* ---------- the free month, open and closed, on every page that prices ---------- */

for (const file of GATED) {
  test(`${file}: the first month free shows only when a place is open, beside the booked call`, async ({ browser }) => {
    const ctx = await browser.newContext();
    const asked = await engine(ctx, OPEN);
    const page = await ctx.newPage();
    await page.goto('/' + file);
    const gate = page.locator('[data-nv-free-month]');
    await expect(gate).toHaveCount(1);
    await expect(gate).toBeVisible();
    await expect(gate.locator('[data-nv-free-month-offer]')).toHaveText(P.foundingClient.offer);
    await expect(gate.locator('[data-nv-free-month-note]')).toHaveText(P.foundingClient.note);
    /* Tied to the booked call, the only way the month is given. */
    await expect(gate.locator('a')).toHaveAttribute('href', '/book.html');
    expect(asked.length).toBe(1);
    /* Nothing else on the page says it, even while it is shown. */
    const outside = flat(await page.locator('main').evaluate((m) => {
      const c = m.cloneNode(true);
      c.querySelectorAll('[data-nv-free-month]').forEach((g) => g.remove());
      return c.innerText;
    }));
    expect(outside).not.toMatch(FREE_MONTH);
    await ctx.close();
  });

  test(`${file}: with the places gone, a failed answer, or scripts off, nothing says the month is free`, async ({ browser }) => {
    for (const answer of [SHUT, json(503, { open: false }), (r) => r.abort('failed')]) {
      const ctx = await browser.newContext();
      const asked = await engine(ctx, answer);
      const page = await ctx.newPage();
      await page.goto('/' + file);
      await expect.poll(() => asked.length).toBe(1);
      await page.waitForTimeout(500);
      await expect(page.locator('[data-nv-free-month]')).toBeHidden();
      expect(flat(await page.locator('body').innerText())).not.toMatch(FREE_MONTH);
      await ctx.close();
    }
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    await engine(ctx, OPEN);
    const page = await ctx.newPage();
    await page.goto('/' + file);
    await expect(page.locator('[data-nv-free-month]')).toBeHidden();
    expect(flat(await page.locator('body').innerText())).not.toMatch(FREE_MONTH);
    await ctx.close();
  });
}

/* ---------- prices, read off the rendered pages ---------- */

test('the trade pages state the cheapest size, the same receptionist, and Buy now to the sizes', async ({ page }) => {
  for (const file of TRADES) {
    await page.goto('/' + file);
    const line = flat(await page.locator('p.start-line').innerText());
    expect(line).toContain(`from ${money(ENTRY.monthly)} a month with ${ENTRY.includedMinutes.toLocaleString('en-US')} minutes included`);
    expect(line).toContain('Same receptionist, answers 24/7');
    expect(line).toContain('GST/HST');
    const buy = page.locator('main a.btn', { hasText: /^Buy now$/ });
    await expect(buy).toHaveCount(1);
    await expect(buy).toHaveAttribute('href', '/pricing.html#plans');
    /* The free month is the booked call's, never the Buy now's. */
    expect(await buy.evaluate((a) => !!a.closest('[data-nv-free-month]'))).toBe(false);
  }
});

test('the voicemail row prices the cheapest size, and no Front Desk size is given a Launch & Implementation fee', async ({ page }) => {
  await page.goto('/vs-voicemail.html');
  const row = flat(await page.locator('tr', { has: page.locator('th', { hasText: 'Costs nothing' }) }).innerText());
  expect(row).toContain(`From ${money(ENTRY.monthly)} a month (${ENTRY.name}, ${ENTRY.includedMinutes.toLocaleString('en-US')} minutes included)`);
  const text = flat(await page.locator('main').innerText());
  expect(text).not.toMatch(/Launch (?:&|and) Implementation/i);
});

test('the answering-service cost row gives every size its minutes, monthly and rate', async ({ page }) => {
  await page.goto('/vs-answering-service.html');
  const row = flat(await page.locator('tr', { has: page.locator('th', { hasText: 'Cost as volume grows' }) }).innerText());
  for (const s of SIZES) {
    expect(row).toContain(`${s.name}: ${s.includedMinutes.toLocaleString('en-US')} minutes for ${money(s.monthly)} a month, then ${money(s.overage)} a minute`);
  }
  expect(row).toContain('same receptionist answers 24/7');
  expect(row).toMatch(/plan changes only if you change it/);
});

test('Missed-Call Recovery is priced from the config, with no free month beside it', async ({ page }) => {
  await page.context().route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await page.goto('/missed-calls.html');
  const card = page.locator('.proc > div', { has: page.locator('h3', { hasText: 'When you missed it anyway' }) });
  const visible = flat(await card.innerText());
  const mcr = P.addOns.find((a) => a.id === 'missed_call_recovery');
  expect(visible).toContain(`On its own it is ${money(mcr.monthly)} a month, plus applicable GST/HST.`);
  expect(visible).not.toMatch(FREE_MONTH);
});

/* ---------- the capability's name ---------- */

test('the capability is "the front desk" on the hub, the demo title, the roadmap card and the Revenue Engine page', async ({ page }) => {
  await page.goto('/solutions.html');
  const lede = page.locator('.page-hero .lede');
  await expect(lede).toContainText('The front desk answers the calls you cannot');
  await expect(lede.locator('a[href="/pricing.html#plans"]')).toHaveText('three sizes');
  expect(SIZES.length).toBe(3);
  await expect(page.locator('a[href="/missed-calls.html"]').first().locator('strong')).toHaveText('The front desk');
  await page.goto('/demo.html');
  await expect(page).toHaveTitle(/Hear the front desk answer/);
  await page.goto('/coming-soon.html');
  const card = page.locator('.svc', { has: page.locator('h3', { hasText: /^Front Desk$/ }) });
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('three sizes, the same receptionist in each');
  await page.goto('/revenue-engine.html');
  await expect(page.locator('.modes .card h3', { hasText: /^The front desk$/ })).toHaveCount(1);
  for (const f of ['solutions.html', 'demo.html', 'revenue-engine.html', 'coming-soon.html', 'about.html']) {
    await page.goto('/' + f);
    const main = flat(await page.locator('main').innerText()) + ' ' + await page.title();
    for (const m of main.matchAll(/[^.?!]*\bAI Front Desk\b[^.?!]*/g)) {
      expect(m[0], `${f}: "AI Front Desk" named alone, as the capability`).toMatch(/Front Desk Starter|Front Desk Plus/);
    }
  }
});

/* ---------- the figures move with the config ---------- */

/** Builds pages.mjs's PAGES against an edited pricing-config.js, in a copy
    of the two files under a temporary root, and returns them (or the error
    the builder threw). */
async function pagesWith(edit) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-v7-content-'));
  fs.mkdirSync(path.join(tmp, 'scripts', 'content'), { recursive: true });
  fs.copyFileSync(path.join(root, 'scripts', 'content', 'pages.mjs'), path.join(tmp, 'scripts', 'content', 'pages.mjs'));
  const src = read('pricing-config.js');
  const moved = edit(src);
  expect(moved, 'the config edit applied').not.toBe(src);
  fs.writeFileSync(path.join(tmp, 'pricing-config.js'), moved);
  try {
    return await import(pathToFileURL(path.join(tmp, 'scripts', 'content', 'pages.mjs')).href + '?t=' + Date.now());
  } catch (e) {
    return { error: e };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
const body = (mod, file) => mod.PAGES[file].body;

test('a repriced Front Desk Starter moves the trade line, the voicemail row and the cost row', async () => {
  const mod = await pagesWith((s) => s.replace(/(id: "front-desk-starter", name: "Front Desk Starter",\s*monthly: )250(, launch: 0, freeMonths: 1, includedMinutes: )200/, '$1275$2210'));
  expect(mod.error).toBeUndefined();
  for (const f of TRADES) expect(body(mod, f)).toContain('from C$275 a month with 210 minutes included');
  expect(body(mod, 'vs-voicemail.html')).toContain('From C$275 a month (Front Desk Starter, 210 minutes included)');
  expect(body(mod, 'vs-answering-service.html')).toContain('Front Desk Starter: 210 minutes for C$275 a month');
  for (const f of Object.keys(mod.PAGES)) expect(body(mod, f)).not.toContain('C$250 a month');
});

test('with the owner\'s switch off, no page carries the gated element at all; on, the pricing pages do', async () => {
  const off = await pagesWith((s) => s.replace(/(foundingClient:\s*\{\s*active:\s*)true/, '$1false'));
  expect(off.error).toBeUndefined();
  for (const f of Object.keys(off.PAGES)) expect(body(off, f), f).not.toMatch(/data-nv-free-month/);
  const none = await pagesWith((s) => s.replace(/(foundingClient:\s*\{\s*active:\s*true,\s*spots:\s*)\d+/, '$10'));
  for (const f of Object.keys(none.PAGES)) expect(body(none, f), f).not.toMatch(/data-nv-free-month/);
  const on = await pagesWith((s) => s + '\n/* the committed switch, on */\n');
  expect(on.error).toBeUndefined();
  for (const f of GATED) expect(body(on, f), f).toMatch(/<(?:div|p) class="fm-gate" data-nv-free-month hidden>/);
  /* Shipped empty: the words are free-month.js's to write. */
  for (const f of Object.keys(on.PAGES)) expect(body(on, f), f).not.toMatch(/data-nv-free-month-(?:offer|note)>[^<]/);
});

test('the builder refuses a Front Desk size with a Launch & Implementation fee, or no sizes at all', async () => {
  const fee = await pagesWith((s) => s.replace(/(id: "front-desk-plus", name: "Front Desk Plus",\s*monthly: 500, launch: )0/, '$1500'));
  expect(String(fee.error)).toMatch(/Front Desk sizes/);
  const gone = await pagesWith((s) => s.replace(/tierOf: "pro",/g, ''));
  expect(String(gone.error)).toMatch(/Front Desk sizes/);
});

test('price-rules.mjs passes its own examples and the committed pages', () => {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', 'content', 'price-rules.mjs')], { cwd: root, encoding: 'utf8' });
  expect(r.status, r.stderr + r.stdout).toBe(0);
  expect(r.stdout).toMatch(/price rules OK/);
});

/* ---------- layout, open and closed ---------- */

for (const width of [1440, 390]) {
  for (const open of [true, false]) {
    test(`at ${width} wide with the gate ${open ? 'open' : 'closed'}: no changed page scrolls sideways or logs an error`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await engine(ctx, open ? OPEN : SHUT);
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(page.url() + ': ' + m.text()); });
      page.on('pageerror', (e) => errors.push(page.url() + ': ' + e.message));
      for (const file of CHANGED) {
        await page.goto('/' + file);
        await page.waitForLoadState('networkidle');
        if (GATED.includes(file)) {
          if (open) await expect(page.locator('[data-nv-free-month]')).toBeVisible();
          else await expect(page.locator('[data-nv-free-month]')).toBeHidden();
        }
        const sideways = await page.evaluate(() => document.scrollingElement.scrollWidth - document.documentElement.clientWidth);
        expect(sideways, `${file} scrolls sideways by ${sideways}px`).toBeLessThanOrEqual(0);
        if (process.env.NV_SHOTS) {
          fs.mkdirSync(process.env.NV_SHOTS, { recursive: true });
          await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')));
          await page.screenshot({ path: path.join(process.env.NV_SHOTS, `${file.replace('.html', '')}-${width}-${open ? 'open' : 'closed'}.png`), fullPage: true });
        }
      }
      expect(errors, errors.join('\n')).toEqual([]);
      await ctx.close();
    });
  }
}
