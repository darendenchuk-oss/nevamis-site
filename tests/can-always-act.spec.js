/* A visitor must be able to act during the opening film.
 *
 * The hero's two CTAs are set to autoAlpha:0 and land at 6.45s, which measures
 * as ~6.6s before either is tappable. That is deliberate choreography and this
 * file does NOT try to change it. What it pins is the reason that timing is
 * survivable:
 *
 *   on a phone, the sticky .callbar carries tel:+15874130035 in plain CSS with
 *   no animation, so the primary action is live from first paint;
 *   on desktop, the navigation is clickable within a second.
 *
 * Both of those are currently incidental. If someone removes the call bar, or
 * folds the nav into the intro timeline, the site becomes six and a half
 * seconds of a film a trades owner cannot act on, and nothing would notice.
 */
import { test, expect } from '@playwright/test';

const PHONE = 'tel:+15874130035';

test.describe('a visitor can act before the intro finishes', () => {
  test('a phone visitor can dial from first paint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const bar = page.locator('.callbar');
    await expect(bar, 'the sticky call bar must exist on a phone').toHaveCount(1);
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('href', PHONE);

    // Visible AND in the viewport, not merely present in the DOM.
    const box = await bar.boundingBox();
    expect(box, 'the call bar must have a real box').not.toBeNull();
    expect(box.height, 'tall enough to tap').toBeGreaterThanOrEqual(44);
    expect(box.y, 'must be on screen, not below it').toBeLessThan(812);

    // And it must not be animated in: no opacity ramp, no transform offset.
    const style = await bar.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { opacity: +cs.opacity, visibility: cs.visibility };
    });
    expect(style.opacity).toBeGreaterThan(0.9);
    expect(style.visibility).toBe('visible');
  });

  test('a desktop visitor has working navigation within a second', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const clickableCount = await page.evaluate(async () => {
      const start = performance.now();
      await new Promise((res) => {
        const wait = () => (performance.now() - start >= 1000 ? res() : requestAnimationFrame(wait));
        wait();
      });
      return [...document.querySelectorAll('a[href], button')].filter((el) => {
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        return cs.visibility === 'visible' && +cs.opacity > 0.5 && cs.display !== 'none'
          && b.width > 0 && b.height > 0 && b.top < window.innerHeight && b.bottom > 0;
      }).length;
    });

    // Measured at 15 on 2026-07-31. The floor is deliberately well below that:
    // this asserts "the visitor is not stranded", not an exact nav design.
    expect(clickableCount, 'a desktop visitor must have somewhere to go within 1s').toBeGreaterThanOrEqual(6);
  });

  test('a dropped site.js still leaves the whole page readable', async ({ page }) => {
    /* .reveal is opacity:0 by default and html.no-js .reveal restores it.
       index.html used to drop the no-js class in an inline script during parse,
       whether or not site.js ever arrived — so one dropped request left all 47
       content blocks invisible across 22,000px: the call proof, the simulator,
       how it works, industries, the ROI calculator, pricing, the founder note
       and the final CTA. A hero floating over nothing.

       site.js removes the class itself as its first statement, and its catch
       puts it back, so the class already tracks "this script is working". */
    await page.route('**/site.js', (r) => r.abort());
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.reveal')];
      return {
        total: all.length,
        invisible: all.filter((e) => +getComputedStyle(e).opacity === 0).length,
        hasNoJs: document.documentElement.classList.contains('no-js'),
      };
    });

    expect(state.total, 'the page should have reveal blocks to protect').toBeGreaterThan(10);
    expect(state.invisible, 'every content block must stay readable without site.js').toBe(0);
    expect(state.hasNoJs, 'no-js must survive when site.js never ran').toBe(true);

    // And the phone number is still there, because the call bar is plain CSS.
    await expect(page.locator('.callbar')).toBeVisible();
  });

  test('reduced motion shows the finished hero at once', async ({ page }) => {
    // The accessibility path must never inherit the 6.6s wait. Measured at 7ms.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const ctas = page.locator('[data-cta]');
    await expect(ctas).toHaveCount(2);
    for (let i = 0; i < 2; i++) await expect(ctas.nth(i)).toBeVisible({ timeout: 2000 });
  });
});
