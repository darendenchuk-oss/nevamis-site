/* Conversion instrumentation.

   The engine drops any event name its allowlist does not know, silently, so
   the two repositories have to agree. That agreement is guarded on the engine
   side (tests/site-events.test.ts diffs the allowlist against this checkout).
   What THIS file guards is the site's half: that the surfaces worth measuring
   are measured, that a new name cannot quietly reuse an old one, and that
   nothing about tracking can cost a visitor their click. */
import { test, expect } from '@playwright/test';

const PLAIN = '/home.html';

/* Buttons that answer a commercial question. Deliberately not "every link":
   navigation, legal links and utility controls are excluded, because
   instrumenting them buys noise and a longer allowlist. The callback form is
   excluded too - it already fires callback_requested from its success handler,
   which counts captured leads rather than clicks, and a data-evt beside it
   would double count and fire on failed validation. */
const REQUIRED = [
  /* The simulator moved to /demo.html with the seven-section homepage
     rebuild: the homepage demonstration is now one static system map, and a
     thing that imitates live activity belongs on the page a visitor opened
     to be shown one. Same names, same buttons, new address. */
  { page: '/demo.html', sel: '#simWatch', evt: 'sim_watch_click' },
  { page: '/demo.html', sel: '#simStepMode', evt: 'sim_step_click' },
  { page: '/home.html', sel: 'a[href="/demo.html"][data-evt]', evt: 'compare_demo_click' },
  /* Was a[href="#roi"]: the calculator left the homepage for /roi.html. The
     event name is deliberately unchanged, so the funnel keeps reading. */
  { page: '/home.html', sel: 'a[href="/roi.html"][data-evt]', evt: 'dayone_roi_click' },
  { page: '/pricing.html', sel: 'a[href="/book.html"][data-evt="pricing_book_call_click"]', evt: 'pricing_book_call_click' },
  { page: '/pricing.html', sel: 'a[data-evt="pricing_demo_call_click"]', evt: 'pricing_demo_call_click' },
  { page: '/electricians.html', sel: 'a[data-evt="trade_pricing_click"]', evt: 'trade_pricing_click' },
  { page: '/missed-calls.html', sel: 'a[data-evt="situation_roi_click"]', evt: 'situation_roi_click' },
  { page: '/after-hours-answering.html', sel: 'a[data-evt="situation_compare_click"]', evt: 'situation_compare_click' },
  { page: '/about.html', sel: 'a[data-evt="about_demo_click"]', evt: 'about_demo_click' },
];

test('every designated conversion CTA carries its event', async ({ page }) => {
  const missing = [];
  for (const r of REQUIRED) {
    await page.goto(r.page);
    const el = page.locator(r.sel).first();
    if (!(await el.count())) { missing.push(`${r.page} ${r.sel} — element gone`); continue; }
    const got = await el.getAttribute('data-evt');
    if (got !== r.evt) missing.push(`${r.page} ${r.sel} — data-evt "${got}", expected "${r.evt}"`);
  }
  expect(missing, `conversion surfaces that stopped reporting:\n${missing.join('\n')}`).toEqual([]);
});

/* Three names predate placement-aware naming and fire from several places on
   one page: the header CTA, the hero CTA, a mid-page CTA and the closing CTA
   all send hero_book_call_click, so "which placement started the booking" is
   unanswerable from the data. They are also the vocabulary the engine's weekly
   dashboard and funnel model are written in, so splitting them is a
   coordinated change across both repositories rather than a site edit.
   Locked here as a baseline: the set may shrink, never grow. */
const LEGACY_COLLAPSED = new Set(['hero_book_call_click', 'demo_phone_click', 'client_login_click']);

test('no new event name collapses two placements on one page', async ({ page }) => {
  const offenders = [];
  for (const url of ['/home.html', '/pricing.html', '/demo.html', '/electricians.html', '/book.html']) {
    await page.goto(url);
    const groups = await page.evaluate(() => {
      const out = {};
      for (const el of document.querySelectorAll('[data-evt]')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const sec = el.closest('header, footer, nav, section, .callbar, .final-cta');
        const where = sec ? sec.tagName + (sec.id ? '#' + sec.id : '') +
          (typeof sec.className === 'string' && sec.className ? '.' + sec.className.trim().split(/\s+/)[0] : '') : '(none)';
        const k = el.getAttribute('data-evt');
        (out[k] ||= []).push(where + '::' + (el.textContent || '').trim().slice(0, 20));
      }
      return out;
    });
    for (const [evt, places] of Object.entries(groups)) {
      if (new Set(places).size > 1 && !LEGACY_COLLAPSED.has(evt)) {
        offenders.push(`${url} ${evt} fires from ${new Set(places).size} placements: ${[...new Set(places)].join(' | ')}`);
      }
    }
  }
  expect(offenders, `these would be indistinguishable in the funnel:\n${offenders.join('\n')}`).toEqual([]);
});

/* Analytics is a beacon and a try/catch, and it must stay that way: the click
   belongs to the visitor, not to the measurement. Proven with the endpoint
   failing, which is the state that matters. */
test('a dead analytics endpoint never costs a visitor their click', async ({ page }) => {
  await page.route('**/api/events', (r) => r.abort());
  await page.route('**/api/mkt/events', (r) => r.abort());
  await page.goto('/electricians.html');
  await page.locator('a[data-evt="trade_pricing_click"]').first().click();
  await page.waitForURL(/pricing\.html/, { timeout: 10_000 });
  expect(page.url(), 'navigation must survive a failed beacon').toContain('/pricing.html');
});

test('a tracked click records the event locally before navigating away', async ({ page }) => {
  await page.route('**/api/events', (r) => r.abort());
  await page.goto('/demo.html');
  await page.locator('#simWatch').scrollIntoViewIfNeeded();
  await page.locator('#simWatch').click();
  const names = await page.evaluate(() => (window.nvEvents || []).map((e) => e.event));
  expect(names, 'nvTrack should have recorded the simulator click').toContain('sim_watch_click');
});
