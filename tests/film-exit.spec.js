/* ============================================================
   A SCAN LINK ANSWERS THE TAP AT ONCE UNLESS THE FILM IS THERE TO PLAY ITS
   EXIT (launch review of the hero, 2026-11-09).

   Every scan link on the homepage carries data-film-exit
   (tests/home-door-order.spec.js counts them), and the film takes a plain
   click on one over: it cancels the browser's navigation, plays a ~1.15s
   exit flourish on the canvas, then leaves. The flourish is drawn only while
   the stage is on screen, so a click anywhere else cancelled the navigation,
   started an exit no frame would ever play, and waited for the 1.6s safety
   timer. The links below the film had always done that; the hero's "Scan my
   website" put it on the first screen: 1,677 ms from tap to leaving at
   390x844 and 1,652 ms at 1440x900, zero frames drawn, which reads as a dead
   button and gets tapped again. scripts/film/source.html (exitCanPlay) now
   takes the click over only when the film has drawn, is being drawn, and
   fills at least half the viewport; otherwise the browser follows the href.

   Held here, as the RULE (time from the click to the scan request leaving
   the page), not the mechanism:
     hero, at load      390x844 and 1440x900: under 300 ms.
     hero, film near    1440x900, scrolled just far enough that the stage is
                        inside the film's 15% observer margin and has drawn,
                        but is still below the fold: under 300 ms. This is the
                        case "the film has drawn" alone would get wrong.
     below the film     #next's scan link: under 300 ms.
     the ending         #close's scan link, over the full-screen film: the
                        exit still plays (html.nv-exit at the click, the page
                        still there right after), and the page still leaves.
   The click is a raw mouse event at the link's centre (checked to be on top
   there), timed from just before it is sent, so Playwright's actionability
   waits are not in the number. Nothing here reaches anything live: the
   engine origin, scan page included, is answered locally.

   Run with the site served from this checkout on its own port, e.g.
     NV_PORT=3293 npx playwright test tests/film-exit.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';

const FAST_MS = 300;
const SCAN = /^https:\/\/app\.nevamis\.ca\/scan/;

/* One context per case: its own viewport, and the engine origin answered
   locally, with the moment the scan page is requested kept on Node's clock. */
async function open(browser, baseURL, viewport) {
  const ctx = await browser.newContext({ baseURL, viewport });
  const t = { request: 0 };
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => {
    if (SCAN.test(r.request().url())) {
      if (!t.request) t.request = Date.now();
      return r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>scan</title><p>scan</p>' });
    }
    return r.fulfill({ status: 204, body: '' });
  });
  const page = await ctx.newPage();
  /* ?debug=1 publishes the film's seam: window.__nv.exit exists once the film's
     script has run, and the link wiring is the last thing that script does, so
     a click after this is a click the film could take over. Without it a click
     before the wiring would leave at once and prove nothing. */
  await page.goto('/?debug=1', { waitUntil: 'load' });
  await page.waitForFunction(() => window.__nv && window.__nv.exit, null, { timeout: 30_000 });
  return { ctx, page, t };
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

/* Click, and the milliseconds until the scan page was requested. */
async function leaveTime(page, t, sel) {
  const at = await target(page, sel);
  t.request = 0;
  const t0 = Date.now();
  await page.mouse.click(at.x, at.y);
  await page.waitForURL(SCAN, { timeout: 5_000 });
  const ms = t.request - t0;
  test.info().annotations.push({ type: 'left the page after', description: `${ms} ms (${sel})` });
  return ms;
}

const HERO_SCAN = '#found .hero-scan a[data-evt="hero_scan_click"]';

for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`${vp.width}x${vp.height}: the hero's scan link leaves at once, at load`, async ({ browser, baseURL }) => {
    const { ctx, page, t } = await open(browser, baseURL, vp);
    try {
      const ms = await leaveTime(page, t, HERO_SCAN);
      expect(ms, `the hero's "Scan my website" took ${ms} ms to leave the page`).toBeLessThan(FAST_MS);
    } finally { await ctx.close(); }
  });
}

test('1440x900: the hero\'s scan link leaves at once when the film has drawn just below the fold', async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const { ctx, page, t } = await open(browser, baseURL, { width: 1440, height: 900 });
  try {
    /* Put the stage's top 60px below the fold: inside the observer's 15%
       margin, so the film counts itself on screen and draws, while none of it
       is visible. */
    const stageTop = await page.evaluate(() => {
      const st = document.getElementById('stage');
      const top = st.getBoundingClientRect().top + scrollY;
      window.scrollTo(0, Math.max(0, Math.round(top - innerHeight - 60)));
      return top;
    });
    expect(stageTop, 'the film starts below the first screen').toBeGreaterThan(900);
    await expect.poll(() => page.evaluate(() => window.__nv.renders),
      { message: 'the film never drew inside its observer margin', timeout: 90_000 }).toBeGreaterThan(0);
    /* and has finished drawing: the film owes two frames after its first, and
       a machine drawing it in software spends hundreds of ms on each, during
       which no click is handled at all. That wait is this machine's, not the
       page's, so it is let pass before the clock starts. */
    let last = -1;
    await expect.poll(async () => {
      const n = await page.evaluate(() => window.__nv.renders);
      const settled = n === last;
      last = n;
      return settled;
    }, { message: 'the film never stopped drawing', timeout: 60_000, intervals: [1_000] }).toBe(true);
    const below = await page.evaluate(() => document.getElementById('stage').getBoundingClientRect().top - innerHeight);
    expect(below, 'the stage is still entirely below the fold').toBeGreaterThan(0);
    const ms = await leaveTime(page, t, HERO_SCAN);
    expect(ms, `with the film drawn but out of sight, the hero's scan took ${ms} ms to leave the page`).toBeLessThan(FAST_MS);
  } finally { await ctx.close(); }
});

test('390x844: the scan link below the film leaves at once', async ({ browser, baseURL }) => {
  const { ctx, page, t } = await open(browser, baseURL, { width: 390, height: 844 });
  try {
    const sel = '#next a[data-evt="platform_scan_click"]';
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel);
    await page.waitForTimeout(400);
    const ms = await leaveTime(page, t, sel);
    expect(ms, `the scan link below the film took ${ms} ms to leave the page`).toBeLessThan(FAST_MS);
  } finally { await ctx.close(); }
});

test('1440x900: the ending\'s scan link, over the film, still plays the exit and still leaves', async ({ browser, baseURL }) => {
  test.setTimeout(150_000);
  const { ctx, page, t } = await open(browser, baseURL, { width: 1440, height: 900 });
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
    const sel = '#close a[data-evt="film_scan_click"]';
    await expect.poll(() => page.evaluate((s) => {
      let o = 1;
      for (let n = document.querySelector(s); n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      return o;
    }, sel), { message: 'the ending never faded in', timeout: 30_000 }).toBeGreaterThan(0.9);
    const at = await target(page, sel);
    t.request = 0;
    await page.mouse.click(at.x, at.y);
    const state = await page.evaluate(() => document.documentElement.classList.contains('nv-exit'))
      .catch(() => 'the page had already left');
    expect(state, 'the ending\'s scan link no longer plays the film\'s exit').toBe(true);
    await page.waitForURL(SCAN, { timeout: 5_000 });
    expect(t.request, 'the exit ended on the scan page').toBeGreaterThan(0);
  } finally { await ctx.close(); }
});
