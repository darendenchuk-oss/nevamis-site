import { test, expect } from '@playwright/test';

/* THE HOMEPAGE CALCULATOR, THE PLANS STRIP AND THE FILM'S HIDDEN CTA.

   1. The calculator (site.js, the ROI-MATH block and calc()). Until
      2026-09-25 it took its fields as typed, so -10 missed calls rendered
      "$-5,196" and a 150% close rate was accepted; and its one break-even row
      showed the real inquiries you must answer under the name "won jobs" (5
      where 3 cover the plan at the defaults). It now clamps every input and
      shows two rows, each under its own name, with a "Not reachable" sentence
      where a zero used to be. Asserted as RULES, not figures, because the plan
      price comes from pricing-config.js and will move. check-consistency
      guard 7n runs the same arithmetic in CI; this is the half only a browser
      can see (the rendered rows).

   2. roi_calculator_complete. It was sent from inside calc(), which runs on
      load with the defaults, so every page view counted as calculator use.
      It is now sent once, on the visitor's first edit.

   3. The plans strip's closing line. Since every sold module has a station,
      every priced add-on is in the strip, and "Every other add-on is on the
      pricing page" would send a buyer looking for modules that do not exist.

   4. The film's closing CTA. #close is position:fixed for the whole film and
      only its opacity changes, and its button had pointer-events:auto, so
      until the finale an invisible "Scan my business" sat mid-screen and took
      the tap: reproduced on the live build 2026-09-25, a click at the middle
      of a 1366x768 screen five seconds in went to the scan app.

   Run with the site served from this checkout, e.g. NV_PORT=3847 npx
   playwright test tests/homepage-calculator.spec.js. */

const set = (page, id, v) => page.evaluate(([i, val]) => {
  const el = document.getElementById(i);
  el.value = String(val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, [id, v]);

const read = (page) => page.evaluate(() => {
  const t = (id) => document.getElementById(id).textContent.trim();
  return {
    opp: t('roiOpp'), rec: t('roiRec'), mini: t('roiMini'), live: t('roiLive'),
    won: t('roiBe'), inq: t('roiInq'),
    wonShown: !document.getElementById('roiBeRow').hidden,
    inqShown: !document.getElementById('roiInqRow').hidden,
    value: Number(document.getElementById('roiValue').value),
    close: Number(document.getElementById('roiClose').value) / 100,
    quote: Number(document.getElementById('roiQuote').value),
  };
});

const WON = /^(\d+) won jobs? per month$/;
const INQ = /^(\d+) real inquir(?:y|ies) per month$/;
const countIn = (s, re) => Number((s.match(re) || [])[1]);

test.describe('the homepage calculator', () => {
  test('two break-evens, each under its own name: won jobs ignore the close rate, inquiries do not', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'load' });
    const holds = (s) => {
      expect(s.wonShown && s.inqShown, 'both break-even rows show when there is a plan price').toBe(true);
      const won = countIn(s.won, WON);
      expect(won, `won jobs reads "${s.won}"`).toBeGreaterThan(0);
      expect(won * s.value, `${won} jobs at ${s.value} must cover ${s.quote}`).toBeGreaterThanOrEqual(s.quote);
      expect((won - 1) * s.value, `${won - 1} jobs at ${s.value} must not cover ${s.quote}`).toBeLessThan(s.quote);
      /* The inquiries row is the inquiries it takes to WIN the jobs in the
         row above at this close rate (BD-6, 2026-09-25): it said 5 beside 3
         won jobs at 50%, and 5 inquiries at 50% win 2.5 jobs. */
      const inq = countIn(s.inq, INQ);
      expect(inq, `inquiries reads "${s.inq}"`).toBeGreaterThan(0);
      expect(inq * s.close, `${inq} inquiries at ${s.close} must win the ${won} jobs above`).toBeGreaterThanOrEqual(won - 1e-9);
      expect((inq - 1) * s.close, `${inq - 1} inquiries must not already win ${won} jobs`).toBeLessThan(won - 1e-9);
      return { won, inq };
    };
    const d = holds(await read(page));
    await set(page, 'roiClose', 20);
    const c = holds(await read(page));
    expect(c.won, 'the close rate does not change how many WON jobs cover the plan').toBe(d.won);
    expect(c.inq, 'a lower close rate needs more real inquiries').toBeGreaterThan(d.inq);
    await set(page, 'roiValue', 250);
    holds(await read(page));
  });

  test('where a break-even cannot be reached it says so, never "0"', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'load' });
    await set(page, 'roiClose', 0);
    let s = await read(page);
    expect(s.inq).toBe('Not reachable at a 0% close rate');
    expect(countIn(s.won, WON), 'won jobs do not need a close rate').toBeGreaterThan(0);
    await set(page, 'roiValue', 0);
    s = await read(page);
    expect(s.won).toBe('Not reachable: enter an average job value');
    expect(s.inq).toBe('Not reachable: enter an average job value');
  });

  test('inputs are clamped: no negative dollars, no percentage above 100', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'load' });
    await set(page, 'roiMissed', -10);
    let s = await read(page);
    for (const k of ['opp', 'rec', 'mini']) expect(s[k], `${k} with -10 missed calls`).toBe('$0');
    expect(s.live, 'the announced line carries no negative figure').not.toMatch(/\$-/);
    await set(page, 'roiMissed', 10);
    await set(page, 'roiClose', 100);
    const at100 = await read(page);
    await set(page, 'roiClose', 150);
    const at150 = await read(page);
    expect(at150.opp, 'a 150% close rate counts as 100%').toBe(at100.opp);
    expect(at150.inq, 'a 150% close rate counts as 100%').toBe(at100.inq);
    await set(page, 'roiReal', 100);
    const r100 = await read(page);
    await set(page, 'roiReal', 400);
    expect((await read(page)).opp, 'a 400% opportunity share counts as 100%').toBe(r100.opp);
    await set(page, 'roiValue', -400);
    s = await read(page);
    expect(s.opp).toBe('$0');
    expect(s.won).toBe('Not reachable: enter an average job value');
  });

  test('the screen-reader line names both break-evens', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'load' });
    const s = await read(page);
    expect(s.live).toContain(s.won);
    expect(s.live).toContain(s.inq);
  });

  test('loading the page is not using the calculator: roi_calculator_complete waits for the first edit, then sends once', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(500);
    const sent = () => page.evaluate(() => (window.nvEvents || []).filter((e) => e.event === 'roi_calculator_complete').length);
    expect(await sent(), 'sent on page load, with nobody touching the calculator').toBe(0);
    await set(page, 'roiMissed', 12);
    expect(await sent(), 'the first edit sends it').toBe(1);
    await set(page, 'roiValue', 500);
    await set(page, 'roiClose', 40);
    expect(await sent(), 'later edits do not send it again').toBe(1);
  });
});

test.describe('the homepage plans strip', () => {
  test('the plans strip prices every station module and does not send the buyer looking for others', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'load' });
    const s = await page.evaluate(() => {
      const sold = (window.NV_PRICING.addOns || []).filter((a) => a.sellable && a.monthly);
      const onPage = [...document.querySelectorAll('#doc .svc[data-addon]')].map((el) => el.getAttribute('data-addon'));
      const strip = document.getElementById('plansStrip');
      const rows = [...strip.querySelectorAll('.node-list li')].map((li) => li.textContent);
      const last = [...strip.querySelectorAll('.card .fine2')].map((p) => p.textContent).join(' ');
      return {
        missing: sold.filter((a) => onPage.indexOf(a.id) < 0).map((a) => a.id),
        unpriced: sold.filter((a) => onPage.indexOf(a.id) >= 0 && !rows.some((r) => r.indexOf(a.name) === 0)).map((a) => a.id),
        last,
      };
    });
    expect(s.missing, 'a sold module with no station on the homepage').toEqual([]);
    expect(s.unpriced, 'a station module the plans strip does not price').toEqual([]);
    expect(s.last, 'no "every other add-on" when there is no other add-on').not.toMatch(/every other add-on/i);
  });
});

test.describe('the film closing CTA', () => {
  for (const vp of [{ width: 1366, height: 768 }, { width: 375, height: 812 }]) {
    test(`while its block is hidden the "Scan my business" button takes no taps (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize(vp);
      await page.goto('/index.html', { waitUntil: 'load' });
      await page.waitForTimeout(5000);
      const s = await page.evaluate(() => {
        const block = document.querySelector('#close');
        const a = block.querySelector('.cta');
        const r = a.getBoundingClientRect();
        const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { on: block.classList.contains('on'), opacity: Number(getComputedStyle(block).opacity), hit: !!at && (at === a || a.contains(at)) };
      });
      expect(s.on, 'the test must run before the finale').toBe(false);
      expect(s.opacity, 'the block is not on screen').toBeLessThan(0.05);
      expect(s.hit, 'a tap at the hidden button lands on it and navigates to the scan').toBe(false);
    });
  }
});
