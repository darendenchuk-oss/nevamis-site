/* Which plan did the prospect reach for?

   All three pricing CTAs once emitted a single plan_quote_click, so the
   question the pricing page exists to answer had no answer in the data. Each
   card reports its own tier now, keyed on the plan's stable id — not its
   display name: the entry plan was shown as "Core" while its id stayed
   `starter`, because the label was renamed and the identity was not.

   THE CTA IS NOT ALWAYS THE SAME BUTTON, and that is what these tests got
   wrong until 2026-08-17. When they were written checkout was shut, so every
   card rendered "Talk to us" -> /book.html -> plan_quote_click_<id>, and the
   tests hard-coded all three of those. Opening `sellable` on 2026-08-16 gave
   every sellable card a "Buy now" -> the signup app -> plan_buy_click instead.
   The site then reported the same flat name for all three tiers, which is the
   original defect returning on the higher-intent click, and these tests failed
   for a reason that read like a naming quibble.

   So they assert the INVARIANT rather than one era's buttons: whatever CTA a
   card renders, it carries that card's tier, in a family the engine allows,
   and the click still navigates. Both families are suffixes of their bare
   parent, so funnel.ts counts each in its own stage with no change to FUNNEL
   and pre-cutover history stays comparable. */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function config() {
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'pricing-config.js'), 'utf8'), { window: w });
  return w.NV_PRICING;
}

/* Mirrors PLAN_QUOTE_CLICK and PLAN_BUY_CLICK in the engine's events route. A
   name outside both shapes is dropped silently, which looks exactly like
   nobody clicking. */
const ALLOWED = /^plan_(quote|buy)_click_[a-z0-9_]{1,24}$/;

/** Which CTA this plan should render, from the same three conditions pricing.html
    branches on. A quoted "from C$X" plan keeps the strategy call whatever the
    gate says, because sending it to a checkout that charges exactly C$X would
    contradict the price above the button. An invite/approval-only plan
    (selfServe: false) keeps the strategy call too — until 2026-08-26 this
    fixture mirrored pricing.html's own bug (the condition it copied never
    checked selfServe), so it asserted a "Buy now" button was correct for
    Performance Partnership and passed while confirming the defect instead
    of catching it. */
function expectedCta(P, pl) {
  return (!P.sellable || pl.startingAt || pl.selfServe === false)
    ? { evt: 'plan_quote_click_' + pl.id, href: '/book.html' }
    : { evt: 'plan_buy_click_' + pl.id, href: '/signup?plan=' + pl.id };
}

test('every plan card reports its own tier, keyed on the plan id', async ({ page }) => {
  await page.goto('/pricing.html');
  await page.waitForTimeout(800);
  const cards = await page.evaluate(() =>
    [...document.querySelectorAll('#plans .plan')].map((el) => ({
      name: (el.querySelector('h3')?.textContent || '').trim(),
      evt: el.querySelector('.buy a')?.getAttribute('data-evt') || null,
      href: el.querySelector('.buy a')?.getAttribute('href') || null,
    })));

  const P = config();
  expect(cards.length, 'the pricing page should render the configured plans').toBe(P.plans.length);

  for (const pl of P.plans) {
    const card = cards.find((c) => c.name === pl.name);
    expect(card, `no card rendered for ${pl.name}`).toBeTruthy();
    const want = expectedCta(P, pl);
    expect(card.evt, `${pl.name} must report as its stable id "${pl.id}", not its label`)
      .toBe(want.evt);
    expect(card.href, `${pl.name} must lead to ${want.href}`).toContain(want.href);
  }

  const names = cards.map((c) => c.evt);
  expect(new Set(names).size, `tiers are indistinguishable: ${names.join(', ')}`).toBe(cards.length);
});

test('the tier names stay inside the families the engine allows', async ({ page }) => {
  await page.goto('/pricing.html');
  await page.waitForTimeout(800);
  const evts = await page.evaluate(() =>
    [...document.querySelectorAll('#plans .plan .buy a')].map((a) => a.getAttribute('data-evt')));
  expect(evts.length, 'no CTAs found to check').toBeGreaterThan(0);
  for (const e of evts) expect(e, `${e} is outside the allowed families`).toMatch(ALLOWED);
});

test('one click sends one plan event, and the click still navigates', async ({ page }) => {
  const sent = [];
  /* ORDER MATTERS: Playwright matches routes in REVERSE registration order, so
     the broad stub goes on first and the specific one last. Both live on
     app.nevamis.ca — the site posts its analytics to the same host the buy CTA
     navigates to — so registering them the other way round let the stub
     swallow every beacon and the test reported "no plan event" for a page that
     was sending one correctly. */
  await page.route('**://app.nevamis.ca/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stub signup</title>' }));
  await page.route('**/api/events', async (r) => {
    try { sent.push(JSON.parse(r.request().postData() || '{}').name); } catch { /* ignore */ }
    await r.abort(); // analytics must never be load-bearing for the click
  });

  await page.goto('/pricing.html');
  await page.waitForTimeout(800);
  const cta = page.locator('#plans .plan .buy a').first();
  const evt = await cta.getAttribute('data-evt');
  const href = await cta.getAttribute('href');
  expect(evt, 'the first CTA must carry an event').toBeTruthy();

  sent.length = 0;
  await cta.scrollIntoViewIfNeeded();
  await cta.click();

  /* Whichever destination this era's CTA has — the point is that a dead
     analytics endpoint does not cost the visitor the click. */
  const target = href.startsWith('http') ? new URL(href).pathname : href.split('?')[0];
  await page.waitForURL((u) => u.pathname.includes(target.split('?')[0]), { timeout: 10_000 });
  expect(page.url(), 'a dead analytics endpoint must not cost the visitor the click')
    .toContain(target.split('?')[0]);

  const planEvents = sent.filter((n) => n && n.startsWith('plan_'));
  expect(planEvents, `expected exactly one plan event, got ${JSON.stringify(planEvents)}`).toEqual([evt]);
});
