/* A visitor must be able to act during the opening film.
 *
 * Until 2026-08-01 the hero's CTAs landed at 6.45s as deliberate choreography,
 * survivable only because the call bar and nav were usable earlier. The
 * retime inverted that: the film no longer gates the controls, and this file
 * now PINS the new contract directly:
 *
 *   the site header's booking action is visible and tappable while the
 *   film's ignition still owns the screen, on desktop and on a phone, with
 *   motion fully on;
 *   on a phone, the sticky .callbar reaches booking (/book.html#pick-a-time)
 *   in plain CSS with no animation, so a next step is live from first paint
 *   on every content page (the homepage hides the bar only while its own
 *   hero action row is on screen, since 2026-11-09: scripts/film/compose.py);
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
 * That is what they measure now.
 *
 * Not against a stopwatch, and not at a moment picked by timing either. The
 * ignition only hides the header until it is half run, and on a fast machine
 * that is over before a test can look, so a first draft that sampled at
 * DOMContentLoaded passed with the pin deleted. The film has a measurement
 * switch for exactly this, ?debug=1&introhold=1, which freezes the ignition on
 * its first composed frame (film-2.js, IW.rate = 0). Frozen there, the header
 * is in the worst state the ignition can put it in, for as long as the test
 * likes, on any machine. The old 1.6s ran on the film's own clock for the same
 * reason: so a slow CI machine could not turn a regression into a flake.
 *
 * SINCE THE HERO MOVED ABOVE THE FILM (launch audit HERO-1, 2026-11-09) the
 * homepage does not play the ignition at all: the stage starts below the fold,
 * so the film opens on its settled frame. The ignition is still reachable (any
 * page whose stage starts at the top), and introhold=1 still forces it on and
 * freezes it wherever the stage is, so the first test below keeps holding the
 * nv-late pin. The bar test further down holds the hero's half of the new
 * contract: hidden while the hero's own Book a call is on screen, there
 * everywhere else, the film included.
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
      stillIgniting: document.documentElement.classList.contains('nv-intro')
        && !document.documentElement.classList.contains('nv-on'),
    };
  });
}

test.describe('a visitor can act before the intro finishes', () => {
  for (const vp of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'phone', width: 375, height: 812 }]) {
    test(`the header's booking action is tappable while the film ignites (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/index.html?debug=1&introhold=1', { waitUntil: 'load' });
      /* Held, the ignition never reaches the halfway mark that adds nv-on and
         fades the header in on its own, so whatever is visible now is visible
         because the page keeps it visible. Give the deferred first frame time
         to compose, since that is when the hold takes effect. */
      await page.waitForTimeout(1500);

      /* Desktop books straight from the header. A phone has no menu since
         owner decision #81: its header is the wordmark, and the booking action
         on its first screen is the hero's own Book a 15-minute call (the bar
         steps aside for it). Either way, what is being proven is that the
         film does not hide it. */
      const action = vp.name === 'desktop'
        ? page.locator('.main-nav a.btn-primary[href="/book.html"]')
        : page.locator('#hero .ctarow a.btn-primary[href="/book.html"]');
      await expect(action).toHaveCount(1);

      const state = await tappable(action);
      expect(state.stillIgniting,
        'the ignition must still be held before its halfway mark, or this proves nothing about it').toBe(true);
      expect(state.visible, 'the header action must be rendered').toBe(true);
      expect(state.opacity, 'the film must not fade the header out during its ignition').toBeGreaterThan(0.9);
      expect(state.onScreen, 'and it must be in the first viewport').toBe(true);
      expect(state.onTop, 'nothing may sit on top of it').toBe(true);

      // And genuinely usable, not merely painted: it leads to booking.
      await expect(action).toHaveText('Book a 15-minute call');
    });
  }

  /* The bar dialled the demo line until 2026-09-15, when the owner made it the
     phone's booking action. A content page, not /index.html: the homepage
     hides the bar while its own hero Book a call is on screen (compose.py), so
     the homepage cannot prove the bar at first paint; its hero proves the
     action instead (tests/first-screen.spec.js). The demo line stays in the
     nav drawer, the page heroes and the footer number. */
  test('a phone visitor can reach booking from first paint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/privacy.html', { waitUntil: 'domcontentloaded' });

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

  /* The homepage cannot prove the bar at first paint, so the test above moved
     to a content page. This one holds the homepage's half of the contract.
     REWRITTEN 2026-11-09 (launch audit HERO-1 and HERO-2). It used to pin "the
     bar is hidden while the film owns the screen": the film was the first
     screen, and a phone had no tappable action for about 7,400px. The hero
     (#found) is the first screen now, with its own Book a call, and the new
     rule is the bar steps aside ONLY while that action row is on screen, so
     the page never shows Book a call twice, and it is there everywhere else:
     through the whole film, and below it. */
  test("the homepage bar steps aside for the hero's own Book a call and books everywhere else", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

    const bar = page.locator('a.callbar');
    await expect(bar, 'the homepage carries exactly one sticky bar').toHaveCount(1);
    await expect(page.locator('#hero .ctarow a[href^="/book.html"]'),
      "the premise: the hero's own Book a call is on the first screen").toBeInViewport();
    await expect(bar, "hidden while the hero's own Book a call is on screen").toBeHidden();

    /* Into the film, a screen and a half below where its span starts: the
       film owns the screen here, and the bar is there all the same. */
    await page.evaluate(() => {
      const sc = document.getElementById('scroll');
      window.scrollTo(0, sc.getBoundingClientRect().top + scrollY + innerHeight * 1.5);
    });
    await expect(page.locator('#hero .ctarow'), 'the premise: the hero is behind you').not.toBeInViewport();
    await expect(bar, 'present through the film').toBeVisible();
    await expect(bar).toHaveAttribute('href', '/book.html#pick-a-time');
    await expect(bar).toHaveAttribute('data-evt', 'callbar_book_click');

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('nv-below')),
      { message: 'the page never reported itself past the film', timeout: 30_000 }).toBe(true);
    await expect(bar, 'and below it').toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(bar, 'back at the hero, it steps aside again').toBeHidden();
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

    // Since owner decision #81 the first screen offers one action, booking,
    // in the header and the hero, and the demo line: the wordmark, the two
    // Book buttons and the number are the four this asserts.
    expect(clickableCount, 'a desktop visitor must have somewhere to go within 1s').toBeGreaterThanOrEqual(4);
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

    /* The hero carries no .reveal at all (it paints in the first frame), so
       what must stay readable is the hero itself, and any reveal block left. */
    expect(state.invisible, 'every content block must stay readable without site.js').toBe(0);
    for (const sel of ['#hero h1', '#hero .prices', '#hero .ctarow a']) {
      await expect(page.locator(sel), `${sel} without site.js`).toBeVisible();
    }
    expect(state.hasNoJs, 'no-js must survive when site.js never ran').toBe(true);

    /* And the booking bar is still there, because it is plain CSS. Checked on a
       content page with site.js still blocked: the homepage hides the bar
       while its own hero Book a call is on screen, so its top cannot show it. */
    await page.goto('/privacy.html', { waitUntil: 'domcontentloaded' });
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
    const mark = await tappable(page.locator('.site-header .wordmark'));
    expect(mark.visible).toBe(true);
    expect(mark.opacity, 'the header is not faded for a reduced-motion visitor').toBeGreaterThan(0.9);
    expect(mark.onTop, 'nothing may sit on top of it').toBe(true);
  });

  /* FOUND 2026-09-25 AND HELD AS AN EXPECTED FAILURE UNTIL 2026-10-03 (audit
     CHECK-RUNNER-3). The film's reduced-motion branch (assets/film/film-2.js,
     composed from scripts/film/source.html) adds "on" to every copy block and
     then calls apply(0.26) for its one still frame, and apply()'s
     copy-visibility loop turned "on" back off for every block whose scroll
     window does not contain 0.26. A reduced-motion visitor saw the first line
     and three empty spaces, the last of them the film's ending, whose button
     stayed tappable at opacity 0: an invisible button. apply() now leaves the
     blocks alone on that path, and this is an ordinary test again. */
  test('reduced motion shows every film copy block, including the closing call to action', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const hidden = await page.evaluate(() => ['s1', 's2', 's3', 'close']
      .filter((id) => +getComputedStyle(document.getElementById(id)).opacity < 0.9));
    expect(hidden, 'film copy blocks a reduced-motion visitor cannot see').toEqual([]);
    /* The ending's one action is on screen and takes the tap where it is
       drawn: Book a 15-minute call (owner decision #81). */
    await expect(page.locator('#close a')).toHaveCount(1);
    for (const sel of ['#close a.cta']) {
      const a = page.locator(sel);
      await a.scrollIntoViewIfNeeded();
      const ok = await a.evaluate((el) => {
        const b = el.getBoundingClientRect();
        const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return +getComputedStyle(el).opacity > 0.9 && !!at && (at === el || el.contains(at));
      });
      expect(ok, `${sel} is visible and takes its own tap`).toBe(true);
    }
    await expect(page.locator('#close a.cta')).toHaveAttribute('href', '/book.html#pick-a-time');
  });
});
