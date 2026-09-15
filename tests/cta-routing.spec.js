/* A primary button must never be an offer to reload the page you are on.

   The header CTA is shared chrome, so on /book.html it pointed at /book.html:
   a visitor already trying to book was offered, as the page's most prominent
   action, the page they were already reading. Nav ITEMS that self-link are
   ordinary and aria-current says so; a BUTTON is a promise of progress.

   Route-aware because the defect only exists on one page at a time and is
   invisible everywhere else, which is how it survived a link audit that found
   all 25 destinations healthy. Every destination answered. One of them was
   just the wrong destination. */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PAGES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content-map.json'), 'utf8'))
  .pages.map((p) => p.file).filter((f) => f !== 'home.html' && f !== '404.html' && f !== 'proposal.html');

test('no button offers the page it is already on', async ({ page }) => {
  const offenders = [];
  for (const file of PAGES) {
    const url = file === 'index.html' ? '/' : '/' + file;
    await page.goto(url);
    const bad = await page.evaluate((self) => {
      const out = [];
      for (const a of document.querySelectorAll('a.btn[href]')) {
        const cs = getComputedStyle(a);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const href = a.getAttribute('href');
        if (href === self || href === self.replace(/^\//, '') ||
            (self === '/' && (href === '/index.html' || href === '/'))) {
          out.push(`"${(a.textContent || '').trim().slice(0, 28)}" -> ${href}`);
        }
      }
      return out;
    }, url);
    for (const b of bad) offenders.push(`${url}: ${b}`);
  }
  expect(offenders, `buttons whose only effect is reloading:\n${offenders.join('\n')}`).toEqual([]);
});

test('the booking page header sends you to the scheduler instead', async ({ page }) => {
  await page.goto('/book.html');
  const cta = page.locator('.main-nav a.btn-primary');
  await expect(cta).toHaveAttribute('href', '#pick-a-time');
  await expect(cta, 'still announced as the current page for assistive tech')
    .toHaveAttribute('aria-current', 'page');
  /* Not booking intent any more: it is a scroll by someone already booking, and
     counting it would inflate that funnel stage with people who arrived. */
  await expect(cta).not.toHaveAttribute('data-evt', /.*/);
  await expect(page.locator('#pick-a-time')).toHaveCount(1);
});

/* The assertion this file was missing. The test above used to be called "sends
   you to the scheduler" while only checking that the anchor RESOLVED, and it
   passed for weeks pointing at a section 2,185px above the scheduler. Existence
   is not arrival. Containment is: if the target contains the iframe, no future
   edit can leave the button resolving somewhere that merely shares the topic. */
test('the header CTA lands on the booking control, not near it', async ({ page }) => {
  await page.goto('/book.html');
  const contains = await page.evaluate(() => {
    const target = document.querySelector('#pick-a-time');
    const frame = document.querySelector('#bkFrame');
    return !!(target && frame && target.contains(frame));
  });
  expect(contains, '#pick-a-time must contain the scheduler iframe').toBe(true);
});

/* .site-header is position:fixed and this site sets scroll-margin nowhere, so
   an anchor with no offset drops its heading underneath the header.

   This performs the jump and measures the heading, rather than asserting that
   scroll-margin-top >= header height. That proxy passes today but it is not the
   property anyone cares about: in production the panel's own box lands 6px
   under the header while its heading sits 21px clear, because the panel has
   26px of padding. A proxy that is 26px out of step with the truth is a proxy
   that will one day be green while the heading is hidden. */
/* The phone sticky bar is shared chrome with the same self-link problem at the
   bottom of the screen: it books, so on book.html it would reload the booking
   page. There it scrolls to the scheduler and counts nothing
   (scripts/lib/nav-cta.mjs applySelfCallbar). */
async function containPhone(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.route('**/*', (r) => {
    const u = r.request().url();
    if (/^https:\/\/app\.nevamis\.ca\//i.test(u)) return r.fulfill({ status: 204, body: '' });
    if (r.request().method() !== 'GET' && r.request().method() !== 'HEAD') return r.abort();
    if (!/^http:\/\/127\.0\.0\.1:/.test(u)) return r.abort();   // no scheduler, no voice widget
    return r.continue();
  });
  return ctx;
}
const clearance = (page) => page.evaluate(() => {
  const h2 = document.querySelector('#pick-a-time h2');
  const hdr = document.querySelector('.site-header');
  return {
    hash: location.hash, path: location.pathname, vh: innerHeight,
    headerBottom: Math.round(hdr.getBoundingClientRect().bottom),
    headingTop: Math.round(h2.getBoundingClientRect().top),
    events: (window.nvEvents || []).map((e) => e.event),
  };
});

test('on the booking page the phone bar scrolls to the scheduler and counts nothing', async ({ browser }) => {
  const ctx = await containPhone(browser);
  const page = await ctx.newPage();
  await page.goto('/book.html');
  const bar = page.locator('a.callbar');
  await expect(bar).toHaveCount(1);
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('href', '#pick-a-time');
  await expect(bar, 'a scroll by someone already booking is not booking intent').not.toHaveAttribute('data-evt', /.*/);
  const before = (await clearance(page)).events.length;
  await bar.click();
  await page.waitForTimeout(900);
  const r = await clearance(page);
  expect(r.path).toBe('/book.html');
  expect(r.hash).toBe('#pick-a-time');
  expect(r.headingTop, `heading at ${r.headingTop}px, header edge ${r.headerBottom}px`).toBeGreaterThanOrEqual(r.headerBottom);
  expect(r.headingTop, 'and on screen').toBeLessThan(r.vh);
  const added = r.events.slice(before).filter((e) => /book|booking|scheduler|callbar/.test(e));
  expect(added, 'no booking event from the bar on the booking page').toEqual([]);
  await ctx.close();
});

test('from a content page the phone bar lands on the scheduler, clear of the header', async ({ browser }) => {
  const ctx = await containPhone(browser);
  const page = await ctx.newPage();
  await page.goto('/electricians.html');
  const bar = page.locator('a.callbar');
  await expect(bar).toHaveAttribute('data-evt', 'callbar_book_click');
  await Promise.all([page.waitForURL(/\/book\.html#pick-a-time$/), bar.click()]);
  await page.waitForTimeout(1200);
  const r = await clearance(page);
  expect(r.headingTop, `heading at ${r.headingTop}px, header edge ${r.headerBottom}px`).toBeGreaterThanOrEqual(r.headerBottom);
  expect(r.headingTop, 'and on screen').toBeLessThan(r.vh);
  await ctx.close();
});

test('the scheduler anchor clears the fixed header', async ({ page }) => {
  await page.goto('/book.html');
  await page.evaluate(() => { location.hash = '#pick-a-time'; });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const h2 = document.querySelector('#pick-a-time h2');
    const hdr = document.querySelector('.site-header');
    return {
      headerFixed: getComputedStyle(hdr).position,
      headerBottom: Math.round(hdr.getBoundingClientRect().bottom),
      headingTop: Math.round(h2.getBoundingClientRect().top),
      headingText: h2.textContent.trim(),
    };
  });
  expect(r.headerFixed, 'premise of this test').toBe('fixed');
  expect(
    r.headingTop,
    `"${r.headingText}" lands at ${r.headingTop}px, under the header's ${r.headerBottom}px edge`,
  ).toBeGreaterThanOrEqual(r.headerBottom);
});
