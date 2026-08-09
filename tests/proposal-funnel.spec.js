/* The proposal is the highest-intent surface on the site: it is sent to a
   named prospect after a call, so its reader has already had the conversation.

   Its only commercial action used to sit at 86% of the page — measured on
   production, 1,331px below the fold at 390px and 805px at 1280px — so a
   prospect who had already decided still had to read to the end to find a way
   to say so. There is now an action beside the recommended plan, where the
   price has just been read: 53% at 390px, 57% at 1280px.

   The assertion is structural rather than a percentage, because a percentage
   moves whenever Main Apex rewrites a paragraph and would either drift into
   uselessness or fail for the wrong reason. "The section that states the price
   must also offer the way to act on it" stays true regardless of length. */
import { test, expect } from '@playwright/test';

test('the section that quotes the price also offers the way to act on it', async ({ page }) => {
  await page.goto('/proposal.html?plan=growth');
  const planSection = page.locator('section', { has: page.locator('.plan-box') }).first();
  await expect(planSection, 'the proposal must state a recommended plan').toHaveCount(1);
  const act = planSection.locator('a[href="/book.html"]');
  await expect(act, 'a decided prospect must be able to act at the price').toHaveCount(1);
  await expect(act).toHaveAttribute('data-evt', 'proposal_plan_book_click');
});

test('the closing action survives, and the two are told apart', async ({ page }) => {
  await page.goto('/proposal.html?plan=growth');
  const booking = page.locator('a[href="/book.html"]');
  await expect(booking, 'the end-of-document action is the natural close and stays')
    .toHaveCount(2);
  const evts = await booking.evaluateAll((els) => els.map((e) => e.getAttribute('data-evt')));
  expect(new Set(evts).size, `both booking actions report as "${evts.join('", "')}" and cannot be told apart`)
    .toBe(2);
});

test('a prospect meets an action without reading to the end', async ({ page }) => {
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/proposal.html?plan=growth');
    await page.waitForTimeout(500);
    const pos = await page.evaluate(() => {
      const ctas = [...document.querySelectorAll('a.btn')].filter((a) => a.getBoundingClientRect().height > 0);
      const ys = ctas.map((a) => Math.round(a.getBoundingClientRect().top + window.scrollY));
      return { first: Math.min(...ys), docH: document.documentElement.scrollHeight };
    });
    const pct = (pos.first / pos.docH) * 100;
    expect(pct, `at ${w}px the first action is ${pct.toFixed(0)}% down the document`).toBeLessThan(70);
  }
});
