/* ============================================================
   NEVAMIS SCROLL PROOF
   The scroll layer's one hard rule is that it may never leave
   content hidden: not after a full scroll-through, not when its
   library fails to load, not under reduced motion, not on a
   phone. Every test here is a way that rule could break.
   ============================================================ */

import { test, expect } from '@playwright/test';

const PLAIN = '/home.html';

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

test('a full scroll-through leaves no masked word and no scene hidden (desktop)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  await page.evaluate(() => { window.__heroTL.progress(1).pause(); });

  const wrapped = await page.evaluate(() => document.querySelectorAll('h2[data-masked]').length);
  expect(wrapped, 'headings should be wrapped for the curtain effect').toBeGreaterThan(8);

  await scrollThrough(page);

  const hidden = await page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('.mwi')) {
      const t = getComputedStyle(el).transform;
      // identity or none — anything still translated is a word stuck offstage
      if (t !== 'none') {
        const m = t.match(/matrix\(([^)]+)\)/);
        if (m && Math.abs(Number(m[1].split(',')[5])) > 1) bad.push(el.textContent);
      }
    }
    for (const s of document.querySelectorAll('.nb-scene')) {
      const cs = getComputedStyle(s);
      // In the pinned choreography earlier scenes legitimately end faded out;
      // what must never happen is ALL scenes hidden at rest.
      s.dataset.op = cs.opacity;
    }
    const sceneOps = [...document.querySelectorAll('.nb-scene')].map((s) => Number(s.dataset.op));
    return { stuckWords: bad, sceneOps };
  });

  expect(hidden.stuckWords, 'words still translated offstage after a full read').toEqual([]);
  expect(Math.max(...hidden.sceneOps), 'at least the final scene must be visible at rest').toBeGreaterThan(0.9);
});

test('the night band pins on desktop and never pins on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  const pinnedDesktop = await page.evaluate(() =>
    document.documentElement.classList.contains('nv-pin-night'));
  expect(pinnedDesktop, 'desktop should run the pinned scrub').toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500); // gsap.matchMedia reacts to the resize
  const pinnedPhone = await page.evaluate(() =>
    document.documentElement.classList.contains('nv-pin-night'));
  expect(pinnedPhone, 'phones get the stacked cards, never the pin').toBe(false);

  // and the stacked scenes are plainly visible content
  await page.evaluate(() => document.querySelector('.nb-scene').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(800);
  const firstScene = page.locator('.nb-scene').first();
  await expect(firstScene).toBeVisible();
});

test('when ScrollTrigger never loads, headings are plain visible text', async ({ page }) => {
  await page.route('**/ScrollTrigger.min.js', (r) => r.abort());
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);

  const state = await page.evaluate(() => ({
    st: !!window.ScrollTrigger,
    wrapped: document.querySelectorAll('h2[data-masked]').length,
    firstH2Visible: (() => {
      const h = document.querySelector('#proof h2');
      const cs = getComputedStyle(h);
      return cs.visibility === 'visible' && Number(cs.opacity) > 0;
    })(),
  }));
  expect(state.st, 'the library must actually be missing in this test').toBe(false);
  expect(state.wrapped, 'no wrapping may happen without the library').toBe(0);
  expect(state.firstH2Visible, 'headings must be plain readable text').toBe(true);
});

test('reduced motion gets the complete page with no scroll choreography at all', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(PLAIN);
  await page.waitForTimeout(800);

  const state = await page.evaluate(() => ({
    wrapped: document.querySelectorAll('h2[data-masked]').length,
    pinned: document.documentElement.classList.contains('nv-pin-night'),
    scenesVisible: [...document.querySelectorAll('.nb-scene')].every((s) =>
      Number(getComputedStyle(s).opacity) > 0.9),
  }));
  expect(state.wrapped, 'no heading surgery under reduced motion').toBe(0);
  expect(state.pinned, 'no pinning under reduced motion').toBe(false);
  expect(state.scenesVisible, 'every scene plainly visible').toBe(true);
  await ctx.close();
});

test('the ROI count-up ends on exactly the number the calculator computed', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  await page.evaluate(() => { window.__heroTL.progress(1).pause(); });

  // the value site.js computed from the default inputs, before any animation
  const before = await page.evaluate(() => document.getElementById('roiOpp').textContent);
  expect(before, 'the calculator must have produced a real figure').toMatch(/^\$[\d,]+$/);

  await page.evaluate(() => document.getElementById('roiOpp').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1600); // count-up runs 0.8s; give it double

  const after = await page.evaluate(() => document.getElementById('roiOpp').textContent);
  expect(after, 'animation must restore the exact computed figure').toBe(before);
});

test('voice bars hold still under reduced motion and with the toggle off', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(PLAIN);
  await page.waitForTimeout(600);

  const still = await page.evaluate(async () => {
    const bar = document.querySelector('[data-voice] i');
    if (!bar) return { present: false };
    const a = bar.style.transform;
    await new Promise((r) => setTimeout(r, 500));
    return { present: true, unchanged: bar.style.transform === a };
  });
  expect(still.present, 'the motif renders as a static signature').toBe(true);
  expect(still.unchanged, 'nothing may keep moving under reduced motion').toBe(true);
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
