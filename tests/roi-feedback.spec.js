/* The calculator's contract: change an assumption, see what it did.

   Below 900px the grid collapses to one column and the estimate lands under
   the form, so on a phone the number moved while nobody could see it. Measured
   on production before the fix: the result panel was off-screen through all
   five edits at 390px and 768px, and four of five at 320px.

   The assertion is the CONTRACT, not geometry: after changing an input, the
   current estimate must be perceivable without leaving the input. Either
   presentation satisfies it - the compact bar on a phone, the full panel on a
   desktop - so this stays true if the layout is rethought again. */
import { test, expect } from '@playwright/test';

const WIDTHS = [[320, 844], [390, 844], [768, 800], [1280, 800]];

test('changing an assumption shows what it did, at every width', async ({ page }) => {
  for (const [w, h] of WIDTHS) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/home.html#roi');
    await page.waitForTimeout(1200);
    const inputs = page.locator('#roiForm input');
    const n = await inputs.count();
    expect(n, 'the calculator should have inputs').toBeGreaterThan(3);

    for (let i = 0; i < n; i++) {
      const el = inputs.nth(i);
      await el.scrollIntoViewIfNeeded();
      await el.fill(String(10 + i * 5));
      await el.dispatchEvent('input');
      const seen = await page.evaluate(() => {
        const visible = (el) => {
          if (!el) return false;
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          const r = el.getBoundingClientRect();
          return r.top < window.innerHeight && r.bottom > 0;
        };
        return visible(document.querySelector('.roi-mini')) || visible(document.querySelector('.roi-out'));
      });
      expect(seen, `at ${w}px, editing input ${i + 1} left the estimate off-screen`).toBe(true);
    }
  }
});

/* One calculator. The compact bar is a second PRESENTATION of the number
   site.js computes, never a second computation, so the two cannot drift. */
test('the compact estimate is the same number as the panel, never its own maths', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home.html#roi');
  await page.waitForTimeout(1200);
  for (const v of ['7', '22', '40']) {
    await page.fill('#roiMissed', v);
    await page.dispatchEvent('#roiMissed', 'input');
    // the panel figure counts up on first view; wait for it to settle
    await page.waitForTimeout(1200);
    const [mini, panel] = await page.evaluate(() => [
      document.getElementById('roiMini').textContent,
      document.getElementById('roiOpp').textContent,
    ]);
    expect(mini, `missed=${v}: compact "${mini}" vs panel "${panel}"`).toBe(panel);
  }
});

test('the compact bar is narrow-screen only, and silent to screen readers', async ({ page }) => {
  await page.goto('/home.html#roi');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(400);
  await expect(page.locator('.roi-mini')).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await expect(page.locator('.roi-mini')).toBeVisible();
  /* #roiLive already announces every change politely; the visible mirror must
     not make a screen reader say the same number twice. */
  await expect(page.locator('.roi-mini')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#roiLive')).toHaveAttribute('aria-live', 'polite');
});

/* body{overflow-x:hidden} made body a scroll container, so every sticky
   descendant pinned to a scrollport that never moves and did nothing at all.
   Measured: the bar's top tracked the page exactly (320, 20, -280, -580 across
   a 900px scroll) with hidden, and held at 86 with clip. Guarding the cause,
   because the symptom is silent - the stylesheet still says position:sticky. */
test('sticky positioning is not disabled by the page scroll container', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/home.html#roi');
  await page.waitForTimeout(1200);
  const overflowX = await page.evaluate(() => getComputedStyle(document.body).overflowX);
  expect(overflowX, 'body must clip rather than hide, or sticky dies silently').not.toBe('hidden');

  const base = await page.evaluate(() => window.scrollY);
  const tops = [];
  for (const d of [0, 300, 600]) {
    await page.evaluate((y) => window.scrollTo(0, y), base + d);
    await page.waitForTimeout(200);
    tops.push(await page.evaluate(() => Math.round(document.querySelector('.roi-mini').getBoundingClientRect().top)));
  }
  expect(tops[2], `bar tracked the page instead of pinning: ${tops.join(', ')}`).toBeGreaterThan(0);
});
