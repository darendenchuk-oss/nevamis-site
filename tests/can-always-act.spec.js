/* A visitor must be able to act during the opening film.
 *
 * Until 2026-08-01 the hero's CTAs landed at 6.45s as deliberate choreography,
 * survivable only because the call bar and nav were usable earlier. The
 * retime inverted that: the film no longer gates the controls, and this file
 * now PINS the new contract directly:
 *
 *   the hero's own CTAs are visible and tappable within 1.6s of the timeline
 *   starting, on desktop and on a phone, with motion fully on;
 *   on a phone, the sticky .callbar still carries tel:+15874130035 in plain
 *   CSS with no animation, so the primary action is live from first paint;
 *   on desktop, the navigation is clickable within a second.
 *
 * If someone re-gates the CTAs behind the film's payoff, the first test below
 * fails by name instead of nothing noticing.
 */
import { test, expect } from '@playwright/test';

const PHONE = 'tel:+15874130035';
/* The homepage's single primary action since the owner's 2026-08-28 ruling.
   PHONE is still here and still asserted: it moved off the hero button and
   onto the sticky call bar, which is the surface a phone visitor actually
   taps, and which the second test in this file proves is visible at first
   paint without any animation. */
const SCAN = 'https://app.nevamis.ca/scan';

test.describe('a visitor can act before the intro finishes', () => {
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 375, height: 812 }]) {
    test(`hero CTAs are interactive within 1.6s of the film starting (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.__heroTL, null, { timeout: 10_000 });

      /* Measured on the timeline's own clock, not wall time, so a slow CI
         machine cannot turn a choreography regression into a flake, and a
         fast one cannot hide it. The film's job is to have both CTAs fully
         visible before t=1.6s. */
      const at = await page.evaluate(() => new Promise((res) => {
        const ctas = [...document.querySelectorAll('[data-cta]')];
        const check = () => {
          const t = window.__heroTL.time();
          const ready = ctas.length >= 2 && ctas.every((el) => {
            const cs = getComputedStyle(el);
            return cs.visibility === 'visible' && Number(cs.opacity) > 0.9;
          });
          if (ready) return res(t);
          if (t > 5) return res(-t); // stop looping; report failure with the time
          requestAnimationFrame(check);
        };
        check();
      }));
      expect(at, `CTAs became fully visible at t=${Math.abs(at).toFixed(2)}s`).toBeGreaterThan(0);
      expect(at, 'the film must not re-gate its own CTAs').toBeLessThan(1.6);

      // And they are genuinely tappable, not merely painted.
      const primary = page.locator('a.btn-primary[data-cta]');
      await expect(primary).toBeVisible();
      const href = await primary.getAttribute('href');
      /* WAS PHONE. The owner ruled on 2026-08-28 that the scan is the
         homepage's single primary action, because it gives a prospect real
         evidence before asking for a sales conversation. What this test is
         about is unchanged: whatever the primary IS, it must be visible and
         genuinely tappable before the intro film finishes. The phone has not
         left the page and is still proven reachable at first paint by the
         sibling test below, which asserts the sticky call bar. */
      expect(href).toBe(SCAN);
    });
  }

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
    /* .reveal is visible by default and site.js hides only the blocks it is
       about to animate (see .reveal.armed); html.no-js .reveal is the second
       belt. It used to be opacity:0 by default, which is what made this
       failure possible in the first place.
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
