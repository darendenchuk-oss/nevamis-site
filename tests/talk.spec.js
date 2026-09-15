/* ============================================================
   THE IN-BROWSER VOICE CALL PAGE (/talk/)

   The widget script is served from this site, but it can still fail to load: a
   dropped connection, a proxy, a content blocker. The page then re-enables
   "Start the voice call", which invites a retry, so the retry has to happen.
   It used to leave the <elevenlabs-convai> element behind, and the click guard
   returned on that element, so the button looked live and did nothing.

   No request leaves the machine: every widget load is aborted (so no voice
   session can start), and the analytics beacon and anything third-party are
   aborted too.
   ============================================================ */
import { test, expect } from '@playwright/test';

test('after a failed widget load, Start really tries again', async ({ page }) => {
  let widgetLoads = 0;
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith('/assets/vendor/elevenlabs-convai-widget-embed')) {
      widgetLoads++;
      return route.abort('internetdisconnected');
    }
    const local = url.hostname === '127.0.0.1' || url.hostname === 'localhost';
    if (!local) return route.abort();
    return route.continue();
  });

  await page.goto('/talk/');
  const start = page.locator('#talkStart');
  await expect(start).toHaveText('Start the voice call');

  for (let attempt = 1; attempt <= 2; attempt++) {
    await start.click();
    await expect.poll(() => widgetLoads, { message: `attempt ${attempt} must request the widget` }).toBe(attempt);
    await expect(start).toBeEnabled();
    await expect(start).toHaveText('Start the voice call');
    await expect(page.locator('#talkFine')).toContainText('did not load');
    expect(await page.locator('elevenlabs-convai').count(), 'the failed element must be removed').toBe(0);
    expect(await page.locator('script[src*="elevenlabs-convai-widget-embed"]').count(), 'the failed script must be removed').toBe(0);
  }
});
