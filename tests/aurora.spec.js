/* ============================================================
   NEVAMIS AURORA
   Two properties of the sky that are invisible when they break.

   1. THE SHADER ACTUALLY COMPILED. A GLSL error makes initAurora fall
      back to the 2D painter silently — the page still looks like an
      aurora, every other test still passes, and the thing you shipped
      is not the thing you wrote. This happened twice while tuning it,
      both times from an unterminated comment inside the shader string.
   2. THE MOTION RATE FOLLOWS THE VIEWPORT. Every horizontal figure in
      the shader is a fraction of UV width, so identical shader time is
      far more pixels per second on a wide screen. Phones were reported
      as calm and desktops as distracting, and the fix was to scale the
      clock. Phones must stay at full rate — that is the half nobody
      asked to change.

   The rate cannot be checked by diffing pixels: gradient flow estimates
   saturate once the sky moves past the local contrast scale, and a
   genuinely halved desktop measures as barely changed. So the clock is
   read directly through window.__aurora.
   ============================================================ */

import { test, expect } from '@playwright/test';

async function aurora(page) {
  await page.goto('/index.html', { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__aurora);
  return page;
}

/** Shader seconds elapsed per real second at the current viewport. */
async function clockRate(page) {
  return page.evaluate(async () => {
    const t0 = window.__aurora.clock(), w0 = performance.now();
    await new Promise((r) => setTimeout(r, 900));
    return (window.__aurora.clock() - t0) / ((performance.now() - w0) / 1000);
  });
}

test('the sky is the WebGL shader, not the silent 2D fallback', async ({ page }) => {
  const warnings = [];
  page.on('console', (m) => { if (/aurora/i.test(m.text())) warnings.push(m.text()); });
  await aurora(page);

  // The fallback painter uses a fixed 240x160 buffer; the shader sizes itself
  // from the viewport. Distinguishing them needs no internals.
  const canvas = await page.evaluate(() => {
    const c = document.getElementById('aurora');
    return { w: c.width, h: c.height };
  });
  expect(warnings.filter((w) => /fallback|unavailable/i.test(w))).toEqual([]);
  expect(canvas.w).not.toBe(240);
  expect(canvas.w).toBeGreaterThan(300);
});

test('a phone keeps the full motion rate it was tuned at', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await aurora(page);
  expect(await page.evaluate(() => window.__aurora.speed())).toBe(1);
  expect(await clockRate(page)).toBeGreaterThan(0.9);
});

test('a desktop runs calmer, but is never frozen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await aurora(page);
  const rate = await clockRate(page);
  expect(rate).toBeLessThan(0.7);     // the complaint: distracting on desktop
  // The clock advances by rAF dt (capped at 50ms), so under a starved CPU —
  // a full parallel suite on software GL — it legitimately runs below its
  // declared rate rather than jumping. The floor only exists to catch a
  // FROZEN background, so it sits well under the declared 0.55, not at it.
  expect(rate).toBeGreaterThan(0.2);
});

test('the rate falls as the viewport widens, and never below the floor', async ({ page }) => {
  await aurora(page);
  const rates = [];
  for (const width of [375, 768, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    rates.push(await page.evaluate(() => window.__aurora.speed()));
  }
  // monotonically non-increasing
  for (let i = 1; i < rates.length; i++) expect(rates[i]).toBeLessThanOrEqual(rates[i - 1]);
  expect(rates[0]).toBe(1);
  expect(Math.min(...rates)).toBeGreaterThanOrEqual(0.45);
});

test('reduced motion still gets a still frame, not a slow one', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'load' });
  const canvas = await page.evaluate(() => {
    const c = document.getElementById('aurora');
    return c ? { w: c.width, h: c.height } : null;
  });
  expect(canvas).not.toBeNull();
  // Painted once and left alone: no rAF loop means no clock advance.
  const advanced = await page.evaluate(async () => {
    if (!window.__aurora) return 0;           // static path returns before exposing
    const t0 = window.__aurora.clock();
    await new Promise((r) => setTimeout(r, 400));
    return window.__aurora.clock() - t0;
  });
  expect(advanced).toBe(0);
  await ctx.close();
});
