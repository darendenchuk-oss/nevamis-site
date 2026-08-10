/* Can a keyboard user see where they are?
 *
 * WCAG 1.4.11 asks 3:1 of a focus indicator against what sits beside it. These
 * fields turn off the 2px mint outline that :focus-visible would otherwise
 * draw, so the ring is the ONLY indicator, and it was
 * rgba(47,191,143,.18) - which flattens to rgb(17,52,52) over the rgb(11,22,32)
 * behind it and measures 1.37:1. Visible if you knew to look for it.
 *
 * This COMPUTES the ratio rather than asserting a colour string. The number
 * depends on what is painted behind the field, which no stylesheet knows, and
 * an assertion on the literal would pass for a value that is still invisible.
 *
 * Two things this test had to learn the hard way, both of which produced a
 * false result first:
 *   - box-shadow is transitioned over 0.2s on some of these fields, so reading
 *     the computed style in the same tick as focus() returns the START of the
 *     transition: rgba(0,0,0,0) 0 0 0 0, which reads exactly like "no ring".
 *   - a button filled by a linear-gradient reports backgroundColor
 *     transparent, so a boundary check that only looks at backgroundColor
 *     calls every primary button unbounded.
 */
import { test, expect } from '@playwright/test';

const CONTROLS = [
  ['/book.html', '#cbName', 'callback form'],
  ['/book.html', '#bkName', 'scheduler prefill'],
  ['/coming-soon.html', '#ifName', 'interest form'],
  ['/', '#roiMissed', 'homepage calculator'],
  ['/pricing.html', '.rc input', 'plan fit calculator'],
];

/** Contrast of the settled focus indicator against the surface behind it. */
async function focusRatio(page, selector) {
  await page.locator(selector).first().focus();
  await page.waitForTimeout(600);          // let the 0.2s transition finish
  return page.evaluate((sel) => {
    const parse = (x) => {
      const m = String(x).match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const q = m[1].split(',').map(parseFloat);
      return { r: q[0], g: q[1], b: q[2], a: q.length > 3 ? q[3] : 1 };
    };
    const over = (f, bg) => ({
      r: f.r * f.a + bg.r * (1 - f.a),
      g: f.g * f.a + bg.g * (1 - f.a),
      b: f.b * f.a + bg.b * (1 - f.a),
    });
    const lum = (c) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const ratio = (a, b) => {
      const l1 = lum(a), l2 = lum(b);
      return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
    };
    const el = document.querySelector(sel);
    /* The first OPAQUE background behind it: a translucent ring over a
       translucent panel is not the colour either one names. */
    let n = el.parentElement, bg = null;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a === 1) { bg = c; break; }
      n = n.parentElement;
    }
    bg = bg || { r: 9, g: 18, b: 26 };
    const cs = getComputedStyle(el);
    const outlined = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
    const ring = parse(cs.boxShadow);
    return {
      outlined,
      shadow: cs.boxShadow,
      ratio: ring ? ratio(over(ring, bg), bg) : 0,
      focused: el.matches(':focus'),
    };
  }, selector);
}

for (const [url, selector, label] of CONTROLS) {
  test(`the focus indicator on the ${label} is visible`, async ({ page }) => {
    await page.goto(url);
    const r = await focusRatio(page, selector);
    expect(r.focused, 'the probe must actually have focused something').toBe(true);
    /* Either indicator is acceptable; what is not acceptable is neither. */
    if (!r.outlined) {
      expect(
        r.ratio,
        `${label}: the ring is the only indicator and measures ${r.ratio}:1 against the surface `
        + `behind it. WCAG 1.4.11 asks 3:1. Computed shadow: ${r.shadow}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
}

/* The rule that makes the ring load-bearing. If someone restores the outline
   this test should be revisited rather than silently kept - two rings is a
   design decision, not an accessibility win. */
test('these fields suppress the global outline, which is why the ring must carry it', async ({ page }) => {
  await page.goto('/book.html');
  const outline = await page.evaluate(() => {
    const el = document.querySelector('#cbName');
    el.focus();
    return getComputedStyle(el).outlineStyle;
  });
  expect(outline, 'if this ever stops being none, the ring is no longer the only indicator').toBe('none');
});

/* A boundary is still required when the field is NOT focused: 1.4.11 covers
   the control itself, not only its focus state. */
test('an unfocused field still has a visible boundary', async ({ page }) => {
  await page.goto('/book.html');
  const r = await page.evaluate(() => {
    const parse = (x) => {
      const m = String(x).match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const q = m[1].split(',').map(parseFloat);
      return { r: q[0], g: q[1], b: q[2], a: q.length > 3 ? q[3] : 1 };
    };
    const over = (f, bg) => ({
      r: f.r * f.a + bg.r * (1 - f.a),
      g: f.g * f.a + bg.g * (1 - f.a),
      b: f.b * f.a + bg.b * (1 - f.a),
    });
    const lum = (c) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const el = document.querySelector('#cbName');
    let n = el.parentElement, bg = null;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a === 1) { bg = c; break; }
      n = n.parentElement;
    }
    bg = bg || { r: 9, g: 18, b: 26 };
    const b = over(parse(getComputedStyle(el).borderTopColor), bg);
    const l1 = lum(b), l2 = lum(bg);
    return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
  });
  expect(r, `the resting border measures ${r}:1 against the panel behind it`).toBeGreaterThanOrEqual(3);
});
