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
  /* Owner decision #81 (2026-11-10): the site is the homepage, the booking
     page and the legal pages, and every action books the 15-minute call or
     dials the demo line. Each Book button keeps its own name, allowlisted by
     the engine before the site sent it: the header pill, the hero, the film
     ending and the phone bar. The demo line in the hero keeps its own too. */
  { page: '/home.html', sel: '#hero a[href^="/book.html"][data-evt]', evt: 'hero_book_call_click' },
  { page: '/home.html', sel: '#hero a[href^="tel:"][data-evt]', evt: 'hero_live_demo_call_click' },
  { page: '/home.html', sel: '.site-header a.btn-primary[href^="/book.html"][data-evt]', evt: 'nav_book_call_click' },
  { page: '/home.html', sel: '#close a[href^="/book.html"][data-evt]', evt: 'film_book_click' },
  /* The phone sticky bar books (owner decision 2026-09-15), under its own
     name on every page but the booking page itself. */
  { page: '/home.html', sel: 'a.callbar[data-evt]', evt: 'callbar_book_click' },
  { page: '/privacy.html', sel: 'a.callbar[data-evt]', evt: 'callbar_book_click' },
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
  for (const url of ['/home.html', '/book.html', '/privacy.html']) {
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
  await page.goto(PLAIN);
  await page.locator('#hero a[data-evt="hero_book_call_click"]').first().click();
  await page.waitForURL(/book\.html/, { timeout: 10_000 });
  expect(page.url(), 'navigation must survive a failed beacon').toContain('/book.html');
});

test('a tracked click records the event locally before navigating away', async ({ page }) => {
  await page.route('**/api/events', (r) => r.abort());
  await page.goto(PLAIN);
  /* the demo line: on a desktop site.js opens its dial pad rather than
     leaving the page, so the assertion is about nvTrack recording locally,
     not about the destination. */
  await page.locator('#hero a[data-evt="hero_live_demo_call_click"]').first().click();
  const names = await page.evaluate(() => (window.nvEvents || []).map((e) => e.event));
  expect(names, 'nvTrack should have recorded the click').toContain('hero_live_demo_call_click');
});

/* NOTHING IS COUNTED AS REACHED BEFORE THE VISITOR SCROLLS (launch audit
   HERO-1, 2026-11-09). The hero is the first screen, on screen for everyone
   at load, and the film's story blocks (section.copy) are position:fixed at
   mid-screen, so an observer would see them all "reached" the moment the
   page loads, and the engine counts every section_reached_* towards "Looked
   at the offer" (src/domain/funnel.ts). site.js leaves both out. Since owner
   decision #81 the homepage has no other section a visitor can scroll to, so
   no section_reached_* may fire at all, scrolled or not. The control that
   keeps that honest is scroll depth, counted by the same block of site.js: a
   broken block would also report nothing, so scrolling to the end must still
   be counted. */
test('the homepage counts no section as reached, and still counts how far the visitor scrolled', async ({ page }) => {
  await page.route('**/api/events', (r) => r.abort());
  await page.route('**/api/mkt/events', (r) => r.abort());
  for (const vp of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const at = `${vp.width}x${vp.height}`;
    await page.setViewportSize(vp);
    await page.goto(PLAIN, { waitUntil: 'load' });
    await page.waitForFunction(() => Array.isArray(window.nvEvents));
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => scrollY), `${at}: the page has not been scrolled`).toBe(0);
    const names = await page.evaluate(() => (window.nvEvents || []).map((e) => e.event));
    expect(names.filter((n) => n.startsWith('section_reached_')), `${at}: a section was counted as reached before the visitor scrolled`).toEqual([]);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => page.evaluate(() => (window.nvEvents || []).map((e) => e.event)),
    { message: 'the visitor scrolled to the end and it was never counted', timeout: 10_000 })
    .toContain('scroll_depth_100');
  const names = await page.evaluate(() => (window.nvEvents || []).map((e) => e.event));
  expect(names.filter((n) => n.startsWith('section_reached_'))).toEqual([]);
});
