import { test, expect } from '@playwright/test';

/* THE HEADLINE IS TWO LINES, AND IT SAYS SO IN THE MARKUP.

   `tests/reduced-motion-hero.spec.js` already had "the headline is not cut
   off", and it passed for weeks while the hero rendered:

       Find the rev
       enue
       your busine
       ss is losing.

   It passed because it measured HORIZONTAL overflow, and text that wraps does
   not overflow — it just wraps, mid-word, and its own comment allowed the wrap
   points to vary. The failure looked like the thing the test was watching for
   and was invisible to it.

   The cause was two rules that were each reasonable alone. `.copy` capped the
   column at `36ch` — a reading measure, correct for the lede — which also held
   the display headline to 384.9px from 1100px all the way to 1920px, while its
   longest line needs 653.7px. And the reveal animation splits the headline into
   per-character `inline-block` spans, so the browser may break between ANY two
   letters; the `&nbsp;` joining the words could not help, because the breaks
   were never at the spaces.

   So this asserts the design intent directly: each `.w` is ONE phrase on ONE
   line, at every width a visitor might have. That is a property no amount of
   horizontal-overflow measurement implies. */

const VIEWPORTS = [
  { name: 'large desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'small laptop', width: 1280, height: 800 },
  { name: 'grid boundary', width: 1100, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'common phone', width: 390, height: 844 },
  { name: 'narrow phone', width: 320, height: 568 },
];

/** Distinct baselines the phrase's glyphs sit on. Two means it wrapped. */
const measure = () => {
  const h1 = document.querySelector('.hero h1');
  return [...h1.querySelectorAll('.line')].map((line) => {
    const w = line.querySelector('.w');
    const chars = [...line.querySelectorAll('.ch')];
    /* Per-character spans when the reveal has split the text, the phrase box
       otherwise — the check has to hold on both paths. */
    const parts = chars.length ? chars : [w];
    const tops = new Set(parts.map((el) => Math.round(el.getBoundingClientRect().top)));

    const range = document.createRange();
    range.selectNodeContents(w);
    const rects = [...range.getClientRects()];
    const lineBox = line.getBoundingClientRect();

    return {
      text: w.textContent.replace(/ /g, ' ').trim(),
      visualLines: tops.size,
      /* Positive means glyphs are being shaved by the reveal mask. */
      clippedBelowBy: rects.length
        ? +(Math.max(...rects.map((r) => r.bottom)) - lineBox.bottom).toFixed(2)
        : 0,
    };
  });
};

/* BOTH MOTION PATHS, because they are two different layouts.

   With reduced motion the headline is never split into .ch spans, and the
   unsplit run is about 8% WIDER than the split one: `.ch{margin-right:-.03em}`
   exists to make the two identical and does not quite manage it. Tuning the
   font size against the split width alone put 46px of overflow in front of
   exactly the visitors who asked for less motion, and this file passed the
   whole time because it only ever measured the animated path. */
for (const motion of /** @type {const} */ (['no-preference', 'reduce'])) {
test.describe(`motion: ${motion}`, () => {
  test.use({ reducedMotion: motion });

for (const vp of VIEWPORTS) {
  test(`the headline keeps each phrase on one line — ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    /* After the reveal has settled: mid-flight the words are legitimately
       masked, and measuring then would test the animation, not the layout. */
    await page.waitForTimeout(2400);

    const lines = await page.evaluate(measure);
    expect(lines.length, 'the hero headline should render its lines').toBeGreaterThan(0);

    for (const line of lines) {
      expect(
        line.visualLines,
        `"${line.text}" broke across ${line.visualLines} lines at ${vp.width}px — `
        + 'the words are split into per-character inline-blocks, so this breaks mid-word',
      ).toBe(1);

      expect(
        line.clippedBelowBy,
        `"${line.text}" has ${line.clippedBelowBy}px of glyph shaved off by the reveal mask at ${vp.width}px`,
      ).toBeLessThanOrEqual(0);
    }
  });
}

});
}

test('the headline never scrolls the page sideways', async ({ page }) => {
  /* nowrap on the phrases makes overflow the failure mode to watch instead of
     wrapping: if the font ever outgrows its column again, it will run off the
     side rather than break, and this is what notices. */
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
