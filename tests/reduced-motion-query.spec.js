/* No link can switch motion back on for a visitor who asked for less.
 *
 * assets/motion/tokens.js prefersReduced() used to return false for
 * ?motionDebug=1 before it read the visitor's setting, so the hero inspector
 * could scrub a running timeline. The inspector and the hero went in finding
 * T13 (2026-09-25); the override stayed behind with one effect left: a URL
 * carrying that flag ran the cursor, scroll and sonar motion for a visitor
 * whose OS or the site's own toggle said reduce. Every motion module asks
 * prefersReduced(), so asking it directly is asking all of them.
 */
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const query of ['', '?motionDebug=1']) {
  test(`reduced motion holds on pricing.html${query}`, async ({ page }) => {
    await page.goto('/pricing.html' + query);
    const reduced = await page.evaluate(async () => (await import('/assets/motion/tokens.js')).prefersReduced());
    expect(reduced, `prefersReduced() on pricing.html${query}`).toBe(true);
  });
}
