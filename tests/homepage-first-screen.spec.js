import { test, expect } from '@playwright/test';

/* THE HOMEPAGE'S FIRST SCREEN, AND TWO HOMEPAGE NUMBERS A BUYER CHECKS.

   1. The first screen. Measured in a real browser on 2026-09-24: a phone's
      first screen was black, with a dim dot and the word SCROLL, for four
      seconds; the page's only h1 ("More of the customers you want.") was at
      8,247px of 26,422px, about ten phone screens down; and the first sentence
      a visitor could read was a pane label selling the scan. A buyer who did
      not scroll learned nothing about what Nevamis does and had nothing to
      press. The fix is #hero (scripts/film/sections.html, placed over the
      film's opening frame by compose.py). These tests hold what it promises:
      the h1 and the booking CTA are on screen, readable and pressable, in the
      first paint and still after the film's cold-open, with motion on, with
      reduced motion and with no JavaScript at all, at phone, laptop and
      landscape-phone sizes. check-consistency guard 7m holds the markup half
      in CI; this is the half only a browser can see.

   2. The calculator's break-even. It divided the plan by job value x close
      rate and called the answer "won jobs", which is the number of real
      inquiries to answer: 5 at the defaults where 3 won jobs cover the plan.
      Asserted as the RULE (the smallest whole number of jobs whose value
      covers the plan, whatever the close rate), not as a figure, because the
      plan price comes from pricing-config.js and will move.

   3. The plans strip's closing line. Since every sold module has a station,
      every priced add-on is in the strip, and "Every other add-on is on the
      pricing page" would send a buyer looking for modules that do not exist.

   Run with the site served from this checkout, e.g. NV_PORT=3847 npx
   playwright test tests/homepage-first-screen.spec.js. */

const SIZES = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'narrow phone', width: 320, height: 568 },
  { name: 'laptop', width: 1440, height: 900 },
  { name: 'short laptop', width: 1366, height: 768 },
  { name: 'landscape phone', width: 812, height: 375 },
];

/* Runs in the page. "Visible" means painted: no ancestor hides it or holds it
   below 0.9 opacity (the cold-open hides the header and the film chrome that
   way, so this is the check that would catch the hero joining them). "Hit"
   means the CTA is what a tap at its centre actually lands on, so nothing is
   painted over it. */
function readFirstScreen() {
  const painted = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.9) return false;
    }
    return true;
  };
  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top >= 0 && r.left >= 0
      && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
  };
  const h1s = [...document.querySelectorAll('h1')];
  const cta = document.querySelector('#hero a[href="/book.html"]');
  let hit = false;
  if (cta) {
    const r = cta.getBoundingClientRect();
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    hit = !!at && (at === cta || cta.contains(at));
  }
  const line = document.querySelector('#hero .hero-line');
  return {
    h1Count: h1s.length,
    h1Text: h1s[0] ? h1s[0].textContent.replace(/\s+/g, ' ').trim() : '',
    h1Painted: !!h1s[0] && painted(h1s[0]),
    h1InView: !!h1s[0] && inView(h1s[0]),
    ctaText: cta ? cta.textContent.trim() : '',
    ctaPainted: !!cta && painted(cta),
    ctaInView: !!cta && inView(cta),
    ctaHit: hit,
    lineText: line ? line.textContent.replace(/\s+/g, ' ').trim() : '',
    lineShown: !!line && getComputedStyle(line).display !== 'none',
    lineInView: !!line && inView(line),
  };
}

function expectFirstScreen(s, when) {
  expect(s.h1Count, `${when}: the page carries exactly one h1`).toBe(1);
  expect(s.h1Text, `${when}: the h1 is door one`).toBe('More of the customers you want.');
  expect(s.h1Painted, `${when}: the h1 is painted, not hidden or faded`).toBe(true);
  expect(s.h1InView, `${when}: the h1 is inside the first screen`).toBe(true);
  expect(s.ctaText, `${when}: the first screen carries the booking CTA`).toBe('Book a call');
  expect(s.ctaPainted, `${when}: the CTA is painted`).toBe(true);
  expect(s.ctaInView, `${when}: the CTA is inside the first screen`).toBe(true);
  expect(s.ctaHit, `${when}: a tap on the CTA lands on the CTA`).toBe(true);
  /* Lead Generation is door one and it is offered by invitation, so the line
     that offers it says so. A rule, not the wording. */
  expect(s.lineText, `${when}: the line offering Lead Generation says "by invitation"`).toMatch(/by invitation/i);
  if (s.lineShown) expect(s.lineInView, `${when}: the line is inside the first screen`).toBe(true);
}

test.describe('the homepage opens on its headline and one CTA', () => {
  for (const vp of SIZES) {
    test(`first paint and after the cold-open (${vp.name} ${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
      expectFirstScreen(await page.evaluate(readFirstScreen), 'first paint');

      /* The film's cold-open (html.nv-intro) hides the header and the film
         chrome and brings them back with the wake. The headline must not be
         part of that, before, during or after. */
      await page.waitForTimeout(5000);
      expectFirstScreen(await page.evaluate(readFirstScreen), 'after the cold-open');
    });
  }

  test('reduced motion shows the same first screen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    expectFirstScreen(await page.evaluate(readFirstScreen), 'reduced motion');
  });

  test('with no JavaScript at all the first screen is still there', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 }, baseURL });
    const page = await ctx.newPage();
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    /* evaluate() runs even with page scripts disabled */
    expectFirstScreen(await page.evaluate(readFirstScreen), 'no JavaScript');
    await ctx.close();
  });

  /* A ghosted label (the film draws the farther ones at about 0.2) is still
     words laid over the headline, so any label that is painted at all counts.
     1366x768 because that is where one lands on it: measured without the film
     treating #hero as a copy beat, the Capture label sat on the headline at
     1024, 1180, 1280 and 1366 wide, and at none of the wider sizes. */
  test('no film label sits on the headline block (laptop)', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(7000);
    const clash = await page.evaluate(() => {
      const hero = document.querySelector('#hero .hero-in').getBoundingClientRect();
      return [...document.querySelectorAll('#labels .plabel')].filter((el) => {
        if (Number(getComputedStyle(el).opacity) <= 0.02) return false;
        const r = el.getBoundingClientRect();
        return r.left < hero.right && r.right > hero.left && r.top < hero.bottom && r.bottom > hero.top;
      }).map((el) => el.getAttribute('data-pane'));
    });
    expect(clash, 'a pane label is drawn over the headline').toEqual([]);
  });
});

test.describe('the homepage calculator and plans strip', () => {
  test('break-even counts WON jobs: the fewest jobs whose value covers the plan, whatever the close rate', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'load' });
    const read = () => page.evaluate(() => ({
      be: document.getElementById('roiBe').textContent.trim(),
      value: Number(document.getElementById('roiValue').value),
      quote: Number(document.getElementById('roiQuote').value),
    }));
    const set = (id, v) => page.evaluate(([i, val]) => {
      const el = document.getElementById(i);
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, [id, v]);
    const jobsIn = (s) => Number((s.match(/^(\d+) won jobs? per month$/) || [])[1]);

    const holds = (s) => {
      const n = jobsIn(s.be);
      expect(n, `break-even reads "${s.be}"`).toBeGreaterThan(0);
      expect(n * s.value, `${n} jobs at ${s.value} must cover ${s.quote}`).toBeGreaterThanOrEqual(s.quote);
      expect((n - 1) * s.value, `${n - 1} jobs at ${s.value} must not cover ${s.quote}`).toBeLessThan(s.quote);
      return n;
    };

    const atDefaults = holds(await read());
    await set('roiClose', 20);
    expect(holds(await read()), 'the close rate does not change how many WON jobs cover the plan').toBe(atDefaults);
    await set('roiValue', 250);
    holds(await read());
    /* no job value, no break-even: never "0 won jobs" */
    await set('roiValue', 0);
    const none = (await read()).be;
    expect(none, 'with no job value there is no break-even to state').not.toMatch(/\d/);
  });

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
