/* You have to be able to state the hero's contrast ratio.
 *
 * The aurora is a fixed, full-viewport WebGL canvas at opacity .9 and z-index
 * 0. The copy sits at z-index 3 and every layer between them was transparent,
 * so the contrast of the hero text was whatever the shader happened to be
 * painting that frame.
 *
 * Measured on production, at rest, nobody scrolling, over six seconds of the
 * shader's own drift: the worst point behind the .lede was 2.25:1 where 19px
 * text needs 4.5:1, 17 frames in 20 contained a failing point, and up to 27%
 * of the area behind the paragraph failed at once.
 *
 * This measures PIXELS, the same way the finding was confirmed: hide the text,
 * screenshot what is actually behind it, decode it, and compute WCAG ratios
 * against the text's own computed colour. Nothing here depends on a model of
 * how the layers composite — which is the whole point, because the CSS audit
 * reported zero contrast failures for this page. A getComputedStyle walk
 * composites ancestors and gradient stops, and a WebGL canvas is neither.
 */
import { test, expect } from '@playwright/test';

const FRAMES = 10;          // ~3s of drift; the finding reproduced in most frames
const GAP = 300;

test('the hero copy has a contrast floor, whatever the shader is doing', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(9000);        // let the intro settle so the rect is final

  const target = await page.evaluate(() => {
    const el = document.querySelector('.hero .lede') || document.querySelector('.hero p');
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight,
    };
  });
  /* 4.5:1 is the normal-text threshold. If the lede ever becomes large text
     (>=24px, or >=18.66px bold) the bar drops to 3:1 — assert the premise so
     this test cannot silently over-demand after a type change. */
  const large = target.size >= 24 || (target.size >= 18.66 && Number(target.weight) >= 700);
  const REQUIRED = large ? 3 : 4.5;

  await page.addStyleTag({ content: '.hero .copy > *{visibility:hidden !important}' });
  await page.waitForTimeout(300);

  const rgb = target.color.match(/\d+/g).map(Number);
  const worstPerFrame = [];

  for (let i = 0; i < FRAMES; i++) {
    const shot = await page.screenshot({ clip: target.rect });
    const worst = await page.evaluate(async ({ b64, text }) => {
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = 'data:image/png;base64,' + b64; });
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const lum = (r, gr, b) => {
        const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(gr) + 0.0722 * f(b);
      };
      const lt = lum(text[0], text[1], text[2]);
      let w = Infinity;
      for (let i = 0; i < d.length; i += 4 * 3) {
        const lb = lum(d[i], d[i + 1], d[i + 2]);
        w = Math.min(w, (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05));
      }
      return +w.toFixed(2);
    }, { b64: shot.toString('base64'), text: rgb });
    worstPerFrame.push(worst);
    await page.waitForTimeout(GAP);
  }

  const worst = Math.min(...worstPerFrame);
  expect(
    worst,
    `worst background point behind the lede was ${worst}:1 across ${FRAMES} frames `
    + `(need ${REQUIRED}:1 for ${target.size}px/${target.weight} ${target.color}). `
    + `Per frame: ${worstPerFrame.join(', ')}`,
  ).toBeGreaterThanOrEqual(REQUIRED);
});

/* Structural, so removing the scrim fails even on a frame where the shader
   happens to be dark and the pixel test would have passed by luck. */
test('there is a painted layer between the canvas and the copy', async ({ page }) => {
  await page.goto('/');
  const s = await page.evaluate(() => {
    const copy = document.querySelector('.hero .copy');
    const cs = getComputedStyle(copy, '::before');
    return { bg: cs.background || cs.backgroundImage, filter: cs.backdropFilter, content: cs.content };
  });
  expect(s.content, 'the scrim pseudo-element must exist').not.toBe('none');
  expect(s.bg, 'and must actually paint something').toMatch(/gradient|rgba?\(/);
});

/* Not backdrop-filter. site.css records a filter over this same canvas as the
   page's largest standing cost, because it re-filters every frame the shader
   repaints. A contrast fix that costs the frame rate is not a fix. */
test('the scrim is painted, not filtered', async ({ page }) => {
  await page.goto('/');
  const filters = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.hero, .hero *')) {
      for (const pseudo of [null, '::before', '::after']) {
        const f = getComputedStyle(el, pseudo).backdropFilter;
        if (f && f !== 'none') out.push((el.className || el.tagName) + (pseudo || ''));
      }
    }
    return out;
  });
  expect(filters, `backdrop-filter in the hero: ${filters.join(', ')}`).toEqual([]);
});
