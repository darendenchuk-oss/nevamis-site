/* ============================================================
   THE FILM'S ENDING PLAYS ITS EXIT, THEN LEAVES (launch review of the hero,
   2026-11-09; re-pointed by owner decision #81, 2026-11-10).

   A link marked data-film-exit hands its click to the film, which plays a
   ~1.15s exit flourish on the canvas and then leaves, but only when the
   film can be seen drawing it (scripts/film/source.html, exitCanPlay).
   The scan links that also carried the hook left the page with decision
   #81, so the one such action a visitor meets is the film ending's Book a
   15-minute call, over the full-screen film: it must still play the exit
   (html.nv-exit at the click, the page still there right after) and still
   leave for the booking page. The click is a raw mouse event at the link's
   centre (checked to be on top there). Nothing here reaches anything live:
   the engine origin is answered locally.

   Run with the site served from this checkout on its own port, e.g.
     NV_PORT=3293 npx playwright test tests/film-exit.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';

const BOOK = /\/book\.html#pick-a-time$/;

/* ?debug=1 publishes the film's seam: window.__nv.exit exists once the film's
   script has run, and the link wiring is the last thing that script does, so
   a click after this is a click the film could take over. */
async function open(browser, baseURL, viewport) {
  const ctx = await browser.newContext({ baseURL, viewport });
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  const page = await ctx.newPage();
  await page.goto('/?debug=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__nv && window.__nv.exit, null, { timeout: 30_000 });
  return { ctx, page };
}

/* Where to click: the link's centre, which must be inside the viewport with
   nothing over it, or the raw click below would land on something else. */
async function target(page, sel) {
  const at = await page.evaluate((s) => {
    const a = document.querySelector(s);
    if (!a) return null;
    const b = a.getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      x, y,
      inView: b.top >= 0 && b.bottom <= innerHeight && b.width > 0,
      onTop: !!hit && (hit === a || a.contains(hit)),
      exitHook: a.hasAttribute('data-film-exit'),
    };
  }, sel);
  expect(at, `${sel} is on the page`).not.toBeNull();
  expect(at.exitHook, `${sel} carries data-film-exit, so the film could take it over`).toBe(true);
  expect(at.inView, `${sel} is inside the viewport`).toBe(true);
  expect(at.onTop, `${sel} takes the click at its own centre`).toBe(true);
  return at;
}

test('the only exit hook on the page is the film ending\'s Book a 15-minute call', async ({ browser, baseURL }) => {
  const { ctx, page } = await open(browser, baseURL, { width: 1440, height: 900 });
  try {
    const hooked = await page.evaluate(() => [...document.querySelectorAll('a[data-film-exit]')]
      .map((a) => [a.getAttribute('href'), a.getAttribute('data-evt'), a.textContent.trim()]));
    expect(hooked).toEqual([['/book.html#pick-a-time', 'film_book_click', 'Book a 15-minute call']]);
  } finally { await ctx.close(); }
});

test('1440x900: the ending\'s Book a 15-minute call, over the film, still plays the exit and still leaves', async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  const { ctx, page } = await open(browser, baseURL, { width: 1440, height: 900 });
  try {
    await page.evaluate(() => {
      const sc = document.getElementById('scroll');
      const top = sc.getBoundingClientRect().top + scrollY;
      window.scrollTo(0, Math.ceil(top + sc.offsetHeight - innerHeight));
    });
    await expect.poll(() => page.evaluate(() => document.getElementById('close').classList.contains('on')),
      { message: 'the film never reached its ending', timeout: 90_000 }).toBe(true);
    /* faded in on the page's animation clock, which a machine drawing the film
       in software advances slowly: waited for, not timed */
    const sel = '#close a[data-evt="film_book_click"]';
    await expect.poll(() => page.evaluate((s) => {
      let o = 1;
      for (let n = document.querySelector(s); n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      return o;
    }, sel), { message: 'the ending never faded in', timeout: 30_000 }).toBeGreaterThan(0.9);
    const at = await target(page, sel);
    await page.mouse.click(at.x, at.y);
    const state = await page.evaluate(() => document.documentElement.classList.contains('nv-exit'))
      .catch(() => 'the page had already left');
    expect(state, 'the ending\'s Book button no longer plays the film\'s exit').toBe(true);
    await page.waitForURL(BOOK, { timeout: 5_000 });
  } finally { await ctx.close(); }
});
