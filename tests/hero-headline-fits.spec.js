import { test, expect } from '@playwright/test';

/* THE HOMEPAGE HEADLINE FITS, WORD BY WORD, AT EVERY WIDTH.

   This file was written for the pre-film hero (`.hero h1 .line .w`), whose
   reveal split the headline into per-character inline-blocks, so the browser
   could break between any two letters and once rendered "your busine / ss is
   losing." That hero is gone: the homepage is the film, and its one h1 is
   Lead Generation's "More of the customers you want." in #found, below it.
   From 2026-09 until 2026-10-03 every test here failed on a null
   `.hero h1` (audit CHECK-RUNNER-5), so the suite's red verdict hid any real
   homepage regression behind fourteen known failures.

   Retargeted, not deleted, because the property still matters and nothing
   else asserts it: the h1 is the page's one headline, it is set in display
   type with negative tracking, and a word broken across two lines or a line
   running off a phone is exactly the defect this file existed for. So it
   asserts, on the real h1, on both motion paths:
     - no word is split across lines (every word's text sits on one baseline)
     - no line of it runs past its own column or the viewport
     - the page never scrolls sideways */

const VIEWPORTS = [
  { name: 'large desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'small laptop', width: 1280, height: 800 },
  { name: 'grid boundary', width: 1100, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'common phone', width: 390, height: 844 },
  { name: 'narrow phone', width: 320, height: 568 },
];

/** Each word of the h1, with how many line boxes its glyphs fall on and how
 *  far its right edge runs past the h1's own box and past the viewport. */
const measure = () => {
  const h1 = document.querySelector('#found h1');
  if (!h1) return null;
  const box = h1.getBoundingClientRect();
  const out = [];
  const walk = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    for (const m of n.textContent.matchAll(/\S+/g)) {
      const r = document.createRange();
      r.setStart(n, m.index);
      r.setEnd(n, m.index + m[0].length);
      const rects = [...r.getClientRects()].filter((x) => x.width > 0);
      out.push({
        word: m[0],
        lines: new Set(rects.map((x) => Math.round(x.top))).size,
        pastBox: Math.round(Math.max(0, ...rects.map((x) => x.right - box.right))),
        pastViewport: Math.round(Math.max(0, ...rects.map((x) => x.right - document.documentElement.clientWidth))),
      });
    }
  }
  return { text: h1.textContent.trim(), words: out };
};

for (const motion of /** @type {const} */ (['no-preference', 'reduce'])) {
  test.describe(`motion: ${motion}`, () => {
    test.use({ reducedMotion: motion });

    for (const vp of VIEWPORTS) {
      test(`the headline keeps each word whole and inside the page (${vp.name}, ${vp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/');
        await page.evaluate(() => document.fonts.ready);
        await page.locator('#found h1').scrollIntoViewIfNeeded();
        /* After the section's reveal has settled. */
        await page.waitForTimeout(900);

        const m = await page.evaluate(measure);
        expect(m, 'the homepage has its h1 in #found').not.toBeNull();
        expect(m.text).toBe('More of the customers you want.');
        expect(m.words.length).toBeGreaterThan(3);
        for (const w of m.words) {
          expect(w.lines, `"${w.word}" broke across ${w.lines} lines at ${vp.width}px`).toBe(1);
          expect(w.pastBox, `"${w.word}" runs ${w.pastBox}px past the headline's column at ${vp.width}px`).toBeLessThanOrEqual(1);
          expect(w.pastViewport, `"${w.word}" runs ${w.pastViewport}px off the screen at ${vp.width}px`).toBeLessThanOrEqual(0);
        }
      });
    }
  });
}

test('the homepage never scrolls the page sideways', async ({ page }) => {
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `the page scrolls ${overflow}px sideways at ${vp.width}px`).toBeLessThanOrEqual(0);
  }
});
