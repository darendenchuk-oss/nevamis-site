/* Which plan did the prospect reach for?

   All three pricing CTAs emitted plan_quote_click, so the question the pricing
   page exists to answer had no answer in the data - and the ladder had just
   changed, which is exactly when it is worth most.

   Each card now reports its own tier, keyed on the plan's stable id. Not its
   display name: the entry plan is shown as "Core" and its id is still
   `starter`, because the label was renamed and the identity was not.

   The engine allows these as a bounded family (plan_quote_click_<id>) whose
   names are SUFFIXES of the old one, so funnel.ts counts tiers and pre-cutover
   history in the same stage without changing, and nothing double-fires. */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function plans() {
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'pricing-config.js'), 'utf8'), { window: w });
  return w.NV_PRICING.plans;
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

  const expected = plans();
  expect(cards.length, 'the pricing page should render the configured plans').toBe(expected.length);

  for (const pl of expected) {
    const card = cards.find((c) => c.name === pl.name);
    expect(card, `no card rendered for ${pl.name}`).toBeTruthy();
    expect(card.evt, `${pl.name} must report as its stable id "${pl.id}", not its label`)
      .toBe('plan_quote_click_' + pl.id);
    expect(card.href, `${pl.name} must still lead to booking`).toContain('/book.html');
  }

  const names = cards.map((c) => c.evt);
  expect(new Set(names).size, `tiers are indistinguishable: ${names.join(', ')}`).toBe(cards.length);
});

test('the tier names stay inside the family the engine allows', async ({ page }) => {
  await page.goto('/pricing.html');
  await page.waitForTimeout(800);
  const evts = await page.evaluate(() =>
    [...document.querySelectorAll('#plans .plan .buy a')].map((a) => a.getAttribute('data-evt')));
  /* Mirrors PLAN_QUOTE_CLICK in the engine's events route. A name outside this
     shape is dropped silently, which looks exactly like nobody clicking. */
  for (const e of evts) expect(e, `${e} is outside the allowed family`).toMatch(/^plan_quote_click_[a-z0-9_]{1,24}$/);
});

test('one click sends one plan event, and the click still navigates', async ({ page }) => {
  const sent = [];
  await page.route('**/api/events', async (r) => {
    try { sent.push(JSON.parse(r.request().postData() || '{}').name); } catch { /* ignore */ }
    await r.abort(); // analytics must never be load-bearing for the click
  });
  await page.goto('/pricing.html');
  await page.waitForTimeout(800);
  const cta = page.locator('#plans .plan .buy a').first();
  const evt = await cta.getAttribute('data-evt');
  sent.length = 0;
  await cta.scrollIntoViewIfNeeded();
  await cta.click();
  await page.waitForURL(/book\.html/, { timeout: 10_000 });
  expect(page.url(), 'a dead analytics endpoint must not cost the visitor the click').toContain('/book.html');

  const planEvents = sent.filter((n) => n && n.startsWith('plan_quote_click'));
  expect(planEvents, `expected exactly one plan event, got ${JSON.stringify(planEvents)}`).toEqual([evt]);
});
