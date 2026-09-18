/* The pane card must close from its own close button.
 *
 * Reported by the owner on 2026-09-18: open a station in the film and the card
 * cannot be closed. The card is a fixed panel from the top of the viewport, and
 * its close button sat 18px down, directly under the fixed 68px site header,
 * which stacks above the card (z-index 50 vs 7). Every click on the button hit
 * the header (on a phone, the menu toggle) instead. Escape still worked, which
 * is why nothing noticed; a pointer or touch visitor had no way out.
 *
 * The test clicks by coordinates, the way a person does, so anything stacked
 * over the button makes it fail. A locator click would report the interception
 * but a coordinate click proves what the visitor actually gets. */
import { test, expect } from '@playwright/test';

async function openScanPane(page) {
  await page.route('https://app.nevamis.ca/**', (r) => r.fulfill({ status: 204, body: '' }));
  await page.goto('/home.html?debug=1&nointro=1');
  await page.waitForFunction(() => window.NV_SCENE && window.__nv && window.__nv.dbg, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const d = window.__nv.dbg; window.scrollTo(0, 0.2 * (d.spanH - (d.vh || innerHeight))); });
  await page.waitForTimeout(1500);
  await page.locator('#paneNav button[data-pane="scan"]').click();
  await expect(page.locator('#card')).toHaveClass(/\bon\b/);
  await page.waitForTimeout(700); /* the slide-in transition */
}

async function closeButtonCentre(page) {
  return page.evaluate(() => {
    const b = document.getElementById('cardClose');
    const r = b.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { x, y, onTop: hit === b || b.contains(hit), hit: hit ? `${hit.tagName.toLowerCase()}${hit.id ? '#' + hit.id : ''}.${hit.className}` : 'null' };
  });
}

for (const profile of [
  { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  { name: 'phone', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
]) {
  test.describe(profile.name, () => {
    test.use(profile.use);

    test('the pane card closes from its own close button', async ({ page }) => {
      await openScanPane(page);
      const c = await closeButtonCentre(page);
      expect(c.onTop, `the close button is covered by ${c.hit}`).toBe(true);
      if (profile.name === 'phone') await page.touchscreen.tap(c.x, c.y);
      else await page.mouse.click(c.x, c.y);
      await expect(page.locator('#card')).not.toHaveClass(/\bon\b/);
    });

    test('the pane card sits below the site header', async ({ page }) => {
      await openScanPane(page);
      const g = await page.evaluate(() => ({
        header: document.querySelector('.site-header').getBoundingClientRect().bottom,
        card: document.getElementById('card').getBoundingClientRect().top,
        close: document.getElementById('cardClose').getBoundingClientRect().top,
      }));
      expect(g.close, 'the close button starts under the header').toBeGreaterThanOrEqual(g.header);
    });
  });
}
