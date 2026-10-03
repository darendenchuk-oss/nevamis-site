/* ============================================================
   NEVAMIS SCROLL PROOF
   The scroll layer's one hard rule is that it may never leave
   content hidden: not after a full scroll-through, not when its
   library fails to load, not under reduced motion, not on a
   phone. Every test here is a way that rule could break.
   ============================================================ */

/* REPOINTED AT THE PAGES THAT LOAD THE SCROLL LAYER (2026-09-25, FP3).

   Seven of the eight tests here opened /home.html, and four of them waited
   on window.__heroTL, the timeline of the pre-film hero. The film homepage
   has neither that timeline nor the scroll layer (it never loads
   assets/motion/main.js), so those four timed out at 90 seconds on every run,
   and two more judged the layer's motion on a page it never touches. The layer
   itself is alive on the secondary pages, and that is where it is proved
   now. The ready signal is the one main.js really gives: its tap-ring pool,
   installed in the same synchronous pass that runs scroll.js, so once the
   rings exist the headings have been curtained or deliberately left alone.

   DELETED, because no published page carries what they tested:
     - the night band pinning on desktop (.nb-scene, nv-pin-night) and the
       night scenes in the scroll-through: no page renders a night band
     - the ROI count-up: the only ROI calculator is on the film homepage,
       which does not load scroll.js; tests/interactions.spec.js and
       tests/homepage-calculator.spec.js prove the calculator itself
     - the voice bars ([data-voice]): no page renders the motif
   scroll.js still carries the code for all three; this file comes back to
   them if a page does. */

import { test, expect } from '@playwright/test';

/* A long sales page that loads ScrollTrigger and has headings well below the
   fold, which is what the curtain is for. */
const LONG = '/revenue-engine.html';
/* The page a buyer is most likely to reach that loads the motion layer. */
const MOTION_PAGE = '/pricing.html';
const PLAIN = '/home.html';

/* site.js beacons page_view to the PRODUCTION engine; see tests/pages.spec.js.
   A route belongs to its context, so a context a test opens gets it too. */
const stubEngine = (ctx) => ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
test.beforeEach(async ({ context }) => { await stubEngine(context); });

/** main.js has run with motion allowed: its pooled tap rings exist. */
const motionLayerReady = (page) => expect(page.locator('.nv-sonar')).toHaveCount(8);

/** Scroll the whole page in steps, like a person, so every trigger fires. */
async function scrollThrough(page, step = 600, settle = 120) {
  await page.evaluate(async ({ step, settle }) => {
    const max = () => document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= max(); y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, settle));
    }
    window.scrollTo({ top: max(), behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 400));
  }, { step, settle });
}

/** Words the curtain translated and never brought back. */
const stuckWords = (page) => page.evaluate(() =>
  [...document.querySelectorAll('.mwi')].filter((el) => {
    const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/);
    return m && Math.abs(Number(m[1].split(',')[5])) > 1;
  }).map((el) => el.textContent));

test('a full scroll-through leaves no masked word behind (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(LONG);
  await motionLayerReady(page);

  const wrapped = await page.evaluate(() => document.querySelectorAll('h2[data-masked]').length);
  expect(wrapped, 'below-the-fold headings should be wrapped for the curtain effect').toBeGreaterThan(2);

  await scrollThrough(page);
  expect(await stuckWords(page), 'words still translated offstage after a full read').toEqual([]);
});

test('when ScrollTrigger never loads, headings are plain visible text', async ({ page }) => {
  await page.route('**/ScrollTrigger.min.js', (r) => r.abort());
  await page.goto(MOTION_PAGE);
  await motionLayerReady(page);

  const state = await page.evaluate(() => ({
    st: !!window.ScrollTrigger,
    wrapped: document.querySelectorAll('h2[data-masked]').length,
    hidden: [...document.querySelectorAll('main h2, section h2')].filter((h) => {
      const cs = getComputedStyle(h);
      return cs.visibility !== 'visible' || Number(cs.opacity) === 0;
    }).map((h) => h.textContent.trim()),
  }));
  expect(state.st, 'the library must actually be missing in this test').toBe(false);
  expect(state.wrapped, 'no wrapping may happen without the library').toBe(0);
  expect(state.hidden, 'headings must be plain readable text').toEqual([]);
});

test('reduced motion gets the complete page with no scroll choreography at all', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await stubEngine(ctx);
  const page = await ctx.newPage();
  await page.goto(LONG, { waitUntil: 'load' });
  /* Nothing installs under reduced motion, so there is no ready signal to
     wait on; this is the time the motion layer takes above, and then some. */
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => ({
    rings: document.querySelectorAll('.nv-sonar').length,
    wrapped: document.querySelectorAll('h2[data-masked]').length,
    pinned: document.documentElement.classList.contains('nv-pin-night'),
    h2s: document.querySelectorAll('main h2, section h2').length,
    hidden: [...document.querySelectorAll('main h2, section h2')].filter((h) =>
      Number(getComputedStyle(h).opacity) < 0.9).map((h) => h.textContent.trim()),
  }));
  expect(state.rings, 'the motion layer must not install under reduced motion').toBe(0);
  expect(state.wrapped, 'no heading surgery under reduced motion').toBe(0);
  expect(state.pinned, 'no pinning under reduced motion').toBe(false);
  expect(state.h2s, 'the page under test must have headings to judge').toBeGreaterThan(2);
  expect(state.hidden, 'every heading plainly visible').toEqual([]);
  await ctx.close();
});

test('view transitions ship guarded: reduced motion disables navigation animation', async ({ page }) => {
  await page.goto(PLAIN);
  // site.css is inlined into the document now, so read it from there rather
  // than fetching a URL that no longer exists. Every assertion below is
  // unchanged: this reads the same CSS from the place it now lives.
  const css = await page.evaluate(() =>
    [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n'));
  expect(css, 'cross-document view transitions must be declared').toContain('@view-transition');
  const reduceBlock = css.slice(css.indexOf('prefers-reduced-motion:reduce'));
  expect(reduceBlock, 'reduce must switch navigation transitions off')
    .toContain('@view-transition{navigation:none}');
  expect(css, 'the motion toggle must suppress the animation')
    .toContain('html.motion-off::view-transition-old(root)');
});

test('secondary pages get the heading curtains too, and finish visible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  /* A heading already on screen is no longer curtained: there is nothing to
     enter when the reader is looking at the words, and on a phone this file
     arrives about four seconds after the page paints, so masking one took a
     heading the visitor had been reading and snapped it offstage.
     pricing.html is the case that proves it — it has exactly one curtainable
     h2 inside the first screen of a 900px viewport. That heading read
     "7-day live pilot" when this test was written; the offer was retired on
     2026-08-09 and it now reads "One price. Nothing beside it." The test
     finds the heading by position rather than by text, so it did not break,
     which is exactly how a comment ends up quoting a price nobody may be
     charged. */
  await page.goto('/pricing.html');
  await page.waitForTimeout(700);
  const firstScreen = await page.evaluate(() => {
    const h = [...document.querySelectorAll('main h2, section h2')]
      .find((el) => el.getBoundingClientRect().top < window.innerHeight);
    return h ? { masked: h.hasAttribute('data-masked'), visible: +getComputedStyle(h).opacity > 0 } : null;
  });
  expect(firstScreen, 'pricing.html should have a heading in the first screen').toBeTruthy();
  expect(firstScreen.masked, 'a heading already on screen must never be curtained').toBe(false);
  expect(firstScreen.visible, 'a first-screen heading must be visible without waiting for motion').toBe(true);

  /* And the curtain still runs where it belongs: below the fold, on a
     secondary page. coming-soon.html loads ScrollTrigger and has headings
     further down. */
  await page.goto('/coming-soon.html');
  await page.waitForTimeout(700);
  const wrapped = await page.evaluate(() => document.querySelectorAll('h2[data-masked]').length);
  expect(wrapped, 'the scroll layer must run beyond the homepage').toBeGreaterThan(0);

  await scrollThrough(page, 700, 90);
  const stuck = await page.evaluate(() =>
    [...document.querySelectorAll('.mwi')].filter((el) => {
      const t = getComputedStyle(el).transform;
      const m = t.match(/matrix\(([^)]+)\)/);
      return m && Math.abs(Number(m[1].split(',')[5])) > 1;
    }).length);
  expect(stuck, 'no word left offstage on coming-soon').toBe(0);
});
