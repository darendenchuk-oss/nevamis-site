/* A visitor must be able to act during the opening film.
 *
 * Until 2026-08-01 the hero's CTAs landed at 6.45s as deliberate choreography,
 * survivable only because the call bar and nav were usable earlier. The
 * retime inverted that: the film no longer gates the controls, and this file
 * now PINS the new contract directly:
 *
 *   the site header's booking action is visible and tappable the moment the
 *   document is ready, on desktop and on a phone, with motion fully on, while
 *   the film's ignition still owns the screen;
 *   on a phone, the sticky .callbar reaches booking (/book.html#pick-a-time)
 *   in plain CSS with no animation, so a next step is live from first paint
 *   on every content page (the film homepage hides the bar until the film
 *   ends, by design: scripts/film/compose.py);
 *   on desktop, the navigation is clickable within a second.
 *
 * If someone re-gates the header behind the film's ignition, the first test
 * below fails by name instead of nothing noticing.
 *
 * REPOINTED 2026-09-25. The first and last tests here were written for the
 * pre-film homepage: they waited on window.__heroTL and counted [data-cta]
 * elements, and the film homepage has neither, so they failed on every run
 * and proved nothing about the page that ships. The film's contract is the one
 * scripts/film/compose.py writes down for nv-late: the ignition cold-open used
 * to fade the chrome in with the wake, and now that the first composed frame
 * is deferred past load, the header is pinned visible from the first paint.
 * That is what they measure now. Measured at DOMContentLoaded, not against a
 * stopwatch: the old 1.6s ran on the film's own clock precisely so that a
 * slow CI machine could not turn a choreography regression into a flake, and
 * "already usable when the document is ready" keeps that property.
 */
import { test, expect } from '@playwright/test';

/* site.js beacons page_view to the PRODUCTION engine; see tests/pages.spec.js. */
test.beforeEach(async ({ context }) => {
  await context.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
});

/* Is this element painted, opaque, on screen and the thing a tap at its centre
   would actually land on? Opacity is read up the whole ancestor chain, because
   the ignition hides the HEADER, not the link inside it. */
function tappable(locator) {
  return locator.evaluate((el) => {
    let op = 1;
    for (let a = el; a; a = a.parentElement) op *= +getComputedStyle(a).opacity;
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return {
      opacity: Math.round(op * 100) / 100,
      visible: cs.visibility === 'visible' && cs.display !== 'none' && b.width > 0 && b.height > 0,
      onScreen: b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth,
      onTop: !!hit && (hit === el || el.contains(hit)),
      stillIgniting: document.documentElement.classList.contains('nv-intro'),
    };
  });
}

test.describe('a visitor can act before the intro finishes', () => {
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 375, height: 812 }]) {
    test(`the header's booking action is tappable while the film ignites (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

      /* Desktop books straight from the header; a phone has the menu button,
         and booking is one tap inside it. Either way it is the header's own
         control, so what is being proven is that the film does not hide it. */
      const action = vp.name === 'desktop'
        ? page.locator('.main-nav a.btn-primary[href="/book.html"]')
        : page.locator('.nav-toggle');
      await expect(action).toHaveCount(1);

      const state = await tappable(action);
      expect(state.stillIgniting,
        'the ignition should still be running at DOMContentLoaded, or this proves nothing about it').toBe(true);
      expect(state.visible, 'the header action must be rendered').toBe(true);
      expect(state.opacity, 'the film must not fade the header out during its ignition').toBeGreaterThan(0.9);
      expect(state.onScreen, 'and it must be in the first viewport').toBe(true);
      expect(state.onTop, 'nothing may sit on top of it').toBe(true);

      // And genuinely usable, not merely painted: it leads to booking.
      if (vp.name === 'phone') {
        await action.click();
        await expect(page.locator('.main-nav')).toHaveClass(/open/);
        await expect(page.locator('.main-nav a.btn-primary[href="/book.html"]')).toBeVisible();
      }
    });
  }

  /* The bar dialled the demo line until 2026-09-15, when the owner made it the
     phone's booking action. A content page, not /index.html: the film homepage
     hides the bar until the film ends (compose.py), so the homepage cannot
     prove first paint. The demo line stays in the nav drawer, the page heroes
     and the footer number. */
  test('a phone visitor can reach booking from first paint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/electricians.html', { waitUntil: 'domcontentloaded' });

    const bar = page.locator('.callbar');
    await expect(bar, 'the sticky booking bar must exist on a phone').toHaveCount(1);
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('href', '/book.html#pick-a-time');

    // Visible AND in the viewport, not merely present in the DOM.
    const box = await bar.boundingBox();
    expect(box, 'the call bar must have a real box').not.toBeNull();
    expect(box.height, 'tall enough to tap').toBeGreaterThanOrEqual(44);
    expect(box.y, 'must be on screen, not below it').toBeLessThan(812);

    // And it must not be animated in: no opacity ramp, no transform offset.
    const style = await bar.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { opacity: +cs.opacity, visibility: cs.visibility };
    });
    expect(style.opacity).toBeGreaterThan(0.9);
    expect(style.visibility).toBe('visible');
  });

  /* The homepage cannot prove first paint, so the test above moved to a content
     page. This one holds the homepage's half of the same contract, which that
     move would otherwise have dropped: the film owns the screen first and the
     bar is hidden under it (compose.py), and the moment the visitor is past the
     film it is the same booking bar as everywhere else. */
  test('the homepage bar hides under the film and books below it', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const bar = page.locator('a.callbar');
    await expect(bar, 'the homepage carries exactly one sticky bar').toHaveCount(1);
    await expect(bar, 'hidden while the film owns the screen').toBeHidden();

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('nv-below')),
      { message: 'the page never reported itself past the film', timeout: 30_000 }).toBe(true);

    await expect(bar, 'and present once the film is behind you').toBeVisible();
    await expect(bar).toHaveAttribute('href', '/book.html#pick-a-time');
    await expect(bar).toHaveAttribute('data-evt', 'callbar_book_click');
  });

  test('a desktop visitor has working navigation within a second', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const clickableCount = await page.evaluate(async () => {
      const start = performance.now();
      await new Promise((res) => {
        const wait = () => (performance.now() - start >= 1000 ? res() : requestAnimationFrame(wait));
        wait();
      });
      return [...document.querySelectorAll('a[href], button')].filter((el) => {
        const cs = getComputedStyle(el);
        const b = el.getBoundingClientRect();
        return cs.visibility === 'visible' && +cs.opacity > 0.5 && cs.display !== 'none'
          && b.width > 0 && b.height > 0 && b.top < window.innerHeight && b.bottom > 0;
      }).length;
    });

    // Measured at 15 on 2026-07-31. The floor is deliberately well below that:
    // this asserts "the visitor is not stranded", not an exact nav design.
    expect(clickableCount, 'a desktop visitor must have somewhere to go within 1s').toBeGreaterThanOrEqual(6);
  });

  test('a dropped site.js still leaves the whole page readable', async ({ page }) => {
    /* .reveal is visible by default and site.js hides only the blocks it is
       about to animate (see .reveal.armed); html.no-js .reveal is the second
       belt. It used to be opacity:0 by default, which is what made this
       failure possible in the first place.
       index.html used to drop the no-js class in an inline script during parse,
       whether or not site.js ever arrived — so one dropped request left all 47
       content blocks invisible across 22,000px: the call proof, the simulator,
       how it works, industries, the ROI calculator, pricing, the founder note
       and the final CTA. A hero floating over nothing.

       site.js removes the class itself as its first statement, and its catch
       puts it back, so the class already tracks "this script is working". */
    await page.route('**/site.js', (r) => r.abort());
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const state = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.reveal')];
      return {
        total: all.length,
        invisible: all.filter((e) => +getComputedStyle(e).opacity === 0).length,
        hasNoJs: document.documentElement.classList.contains('no-js'),
      };
    });

    expect(state.total, 'the page should have reveal blocks to protect').toBeGreaterThan(10);
    expect(state.invisible, 'every content block must stay readable without site.js').toBe(0);
    expect(state.hasNoJs, 'no-js must survive when site.js never ran').toBe(true);

    /* And the booking bar is still there, because it is plain CSS. Checked on a
       content page with site.js still blocked: the film homepage hides the bar
       until the film ends, by design, so its top cannot show it. */
    await page.goto('/electricians.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.callbar')).toBeVisible();
    await expect(page.locator('.callbar')).toHaveAttribute('href', '/book.html#pick-a-time');
  });

  test('reduced motion shows the header at once', async ({ page }) => {
    /* The accessibility path must never inherit the film's wait. There is no
       ignition for these visitors at all: the film adds nv-rm instead of
       nv-intro, so the header is never faded in the first place. */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    expect(await page.evaluate(() => document.documentElement.classList.contains('nv-rm')),
      'the film must have taken its reduced-motion path').toBe(true);
    const toggle = await tappable(page.locator('.nav-toggle'));
    expect(toggle.visible).toBe(true);
    expect(toggle.opacity, 'the header is not faded for a reduced-motion visitor').toBeGreaterThan(0.9);
    expect(toggle.onTop, 'nothing may sit on top of it').toBe(true);
  });

  /* KNOWN DEFECT, found 2026-09-25 while repointing the test above, and pinned
     here as an expected failure so that it cannot be forgotten: the day it is
     fixed this test starts passing, Playwright reports that as a failure, and
     whoever fixed it deletes the test.fail line.

     The film's reduced-motion branch (assets/film/film-2.js, composed from
     scripts/film/source.html) adds "on" to every copy block and then calls
     apply(0.26) for its one still frame. apply()'s copy-visibility loop turns
     "on" back off for every block whose scroll window does not contain 0.26,
     so a reduced-motion visitor sees the first line and then three empty
     spaces where "NEVAMIS works out what to do", "Then handles them" and the
     closing "Scan my business" should be. The link is still there at opacity 0
     and pointer-events:auto: an invisible button. */
  test('reduced motion shows every film copy block, including the closing call to action', async ({ page }) => {
    test.fail(true, 'known defect: apply(0.26) re-hides the copy on the reduced-motion path');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const hidden = await page.evaluate(() => ['s1', 's2', 's3', 'close']
      .filter((id) => +getComputedStyle(document.getElementById(id)).opacity < 0.9));
    expect(hidden, 'film copy blocks a reduced-motion visitor cannot see').toEqual([]);
    await expect(page.locator('#close a.cta')).toHaveAttribute('href', 'https://app.nevamis.ca/scan');
  });
});
