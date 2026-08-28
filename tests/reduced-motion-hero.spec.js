/* What a reduced-motion visitor is actually shown.
 *
 * prefers-reduced-motion asks for less MOVEMENT. It is not a request for less
 * information, and the hero was reading it as both.
 *
 * Two defects, one path. paintResolved() is shared between the timeline's end
 * state — where hiding the story is right, because it has played and will
 * replay — and the reduced branch, where it never plays at all. And the masked
 * headline lines are joined with non-breaking spaces so the intro can reveal
 * each as one unit, which leaves them with no break opportunity; the animated
 * path splits them into 32 per-character spans and those breaks are what let
 * the line re-wrap.
 *
 * So a reduced-motion visitor got an unlabelled arc and a glowing ball, under
 * a headline clipped by up to 290px. Both were invisible to every existing
 * check, because nothing asserted what this visitor sees.
 */
import { test, expect } from '@playwright/test';

/* Set explicitly rather than through test.use: playwright.config.js pins
   reducedMotion:'no-preference' for the whole run, and emulateMedia before
   navigation is what the browser itself does - the preference has to be true
   at script-execution time, because the hero reads matchMedia once on load. */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('the hero says what it is, instead of looking like a spinner', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);

  const seen = await page.evaluate(() => {
    /* Effective opacity: a visible node inside a faded group is not visible. */
    const eff = (el) => {
      let n = el, o = 1;
      while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity || '1'); n = n.parentElement; }
      return o;
    };
    const steps = [...document.querySelectorAll('#story .step')];
    return {
      status: eff(document.querySelector('#status')),
      statusText: (document.querySelector('#status').textContent || '').trim(),
      labelled: steps.filter((s) => eff(s) > 0.5).map((s) => s.textContent.replace(/\s+/g, ' ').trim()),
      segments: [...document.querySelectorAll('#progress .seg')].filter((s) => eff(s) > 0.5).length,
    };
  });

  expect(seen.status, 'the CALL ANSWERED badge must be readable').toBeGreaterThan(0.9);
  expect(seen.statusText).toMatch(/call answered/i);
  /* Exactly one: the four step groups are drawn on top of each other at one
     baseline, so more than one visible means they are overlapping. */
  expect(seen.labelled, `visible step labels: ${JSON.stringify(seen.labelled)}`).toHaveLength(1);
  expect(seen.labelled[0]).toMatch(/booking confirmed/i);
  expect(seen.segments, 'a finished call shows a finished progress track').toBe(4);
});

test('the headline is not cut off', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);

  const r = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const box = h1.getBoundingClientRect();
    const words = [...h1.querySelectorAll('.w')];
    return {
      overflowBy: Math.max(0, ...words.map((w) => Math.round(w.getBoundingClientRect().right - box.right))),
      rendered: words.map((w) => w.textContent.trim()).join(' '),
      announced: h1.textContent.trim(),
    };
  });

  expect(r.overflowBy, `the headline runs ${r.overflowBy}px past its column and is clipped`).toBeLessThanOrEqual(2);
  /* The rendered phrases must add up to the whole sentence. This compared them
     against the h1's aria-label until 2026-08-27, when the label was removed:
     it existed only because the animated path shredded the words into
     per-character spans, and keeping it beside unhidden real text would have
     had a screen reader announce the headline twice. The sentence a visitor
     reads and the sentence assistive tech is handed are now the same string by
     construction, so this compares the phrases to it directly. */
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  expect(norm(r.rendered)).toBe(norm(r.announced));
});

/* The reason the branch exists. If this ever fails, something is animating for
   a visitor who asked for stillness, and the fixes above are not worth having
   at that price. */
test('nothing is left running', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  const running = await page.evaluate(() => document.getAnimations().length);
  expect(running).toBe(0);
});
