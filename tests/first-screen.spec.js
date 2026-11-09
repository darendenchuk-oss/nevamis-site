/* ============================================================
   THE FIRST SCREEN READS BEFORE THE FILM DRAWS (launch audit HERO-1,
   2026-11-09).

   Until this change the homepage's first screen on a 390px phone was the
   film's opening frame: a wordmark, a menu, six numerals and "SCROLL". The
   first sentence sat about 987px down, the first button about 7,400px down
   and the h1 about 8,440px down, and the booking bar was switched off for
   the whole film. Decision #51's mobile rule says the opposite: brand and
   navigation, headline, primary action, supporting copy, then the visual
   stage, at 360x640. The hero (#found) now sits above the film in plain
   HTML, and this file holds what that buys, as the RULE rather than the
   wording (the h1's words are pinned by tests/hero-headline-fits.spec.js):

     first frame   at 360x640, 390x844 and 1440x900, with motion, with
                   reduced motion, with WebGL unavailable and with JavaScript
                   off, the h1, the sub under it and a Book a call at least
                   44px tall are inside the first viewport at full opacity,
                   while <html> still carries nv-filmwait. In the JavaScript
                   modes the film's own script (film-2.js) is held back by
                   the test until the measurement is taken, so "before the
                   film draws" is a fact of the run, not a race against it:
                   the parser is stopped at that script, the hero above it is
                   already laid out, and nothing of the film has run.
     no waiting    no part of the first screen is a scroll-reveal block or
                   carries a running animation: a .reveal on the hero is the
                   "words wait for motion" defect this change removes.
     still there   after the film's scripts and site.js have run, the same
                   three are still in the first viewport, still opaque, and
                   Book a call still takes the tap at its own centre (the
                   film's fixed chrome, the rail, the labels and the hint,
                   must not float over it).
     the bar       on a phone the sticky booking bar is hidden while the
                   hero's own action row is on screen, so Book a call never
                   shows twice, and it is there once the row has scrolled
                   away: through the film too, which is what owner item O14
                   asked for. Back at the top it steps aside again.
     the film      the film still plays to its ending below the hero: scrolled
                   to the end of its span, #close turns on and its Book a call
                   takes the tap.

   SHOWN RED BEFORE IT WAS TRUSTED (2026-11-09), each mutation made to the
   served homepage (index.html) of the commit that introduced this file, three
   tests each (390x844 motion, 360x640 no JavaScript, 1440x900 reduced
   motion), then restored:
     hero deleted          3 failed: "first frame: the hero's h1 is missing"
     .reveal re-added      3 failed: "the h1 sits inside a .reveal block, so
                           it waits for motion"
     film back on top      3 failed: "the h1 is not inside the first viewport
                           (top 2891, bottom 2997)" at 390x844
     bar rule dropped      2 failed, 1 passed: "the bar must not double the
                           hero's own Book a call" on both phones; at 1440 the
                           bar is display:none whatever this rule says
   and the whole file green again afterwards (12 passed).

   Run with the site served from this checkout on its own port, e.g.
     NV_PORT=3293 npx playwright test tests/first-screen.spec.js
   Nothing here reaches anything live: the engine origin is answered locally.
   ============================================================ */
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'small phone', width: 360, height: 640 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
const MODES = ['motion', 'reduced motion', 'no WebGL', 'no JavaScript'];
/* The bar slides on the page's animation clock, which a loaded machine drawing
   the film in software advances only every few seconds: waited for, not timed. */
const SLOW = 20_000;

/* Everything the first screen is judged on, measured in the page. The sub is
   the paragraph that follows the h1, whatever it says. */
function measureFirstScreen() {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const found = document.getElementById('found');
  const h1 = found && found.querySelector('h1');
  const sub = h1 && h1.nextElementSibling;
  const book = found && found.querySelector('a[href^="/book.html"]');
  const one = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    let opacity = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) opacity *= +getComputedStyle(n).opacity;
    const cs = getComputedStyle(el);
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    /* Any animation or transition running on the element or on anything it
       sits inside is the first screen waiting for motion. */
    const animating = (document.getAnimations ? document.getAnimations() : [])
      .filter((a) => a.playState === 'running' && a.effect && a.effect.target
        && a.effect.target.nodeType === 1 && a.effect.target.contains(el))
      .map((a) => (a.effect.target.id || a.effect.target.className || a.effect.target.tagName) + ' ' + (a.transitionProperty || a.animationName || ''));
    return {
      text: el.textContent.replace(/\s+/g, ' ').trim(),
      top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height),
      opacity: Math.round(opacity * 1000) / 1000,
      visible: cs.visibility === 'visible' && cs.display !== 'none' && b.width > 0 && b.height > 0,
      inView: b.top >= 0 && b.bottom <= vh && b.left >= 0 && b.right <= vw,
      onTop: !!hit && (hit === el || el.contains(hit)),
      reveal: !!el.closest('.reveal'),
      animating,
    };
  };
  return {
    filmwait: document.documentElement.classList.contains('nv-filmwait'),
    h1: one(h1), sub: one(sub), book: one(book),
  };
}

function expectReadable(m, where) {
  for (const key of ['h1', 'sub', 'book']) {
    const e = m[key];
    expect(e, `${where}: the hero's ${key} is missing`).not.toBeNull();
    expect(e.visible, `${where}: the ${key} is not rendered`).toBe(true);
    expect(e.opacity, `${where}: the ${key} ("${e.text.slice(0, 40)}") is at opacity ${e.opacity}`).toBe(1);
    expect(e.inView, `${where}: the ${key} ("${e.text.slice(0, 40)}") is not inside the first viewport (top ${e.top}, bottom ${e.bottom})`).toBe(true);
    expect(e.reveal, `${where}: the ${key} sits inside a .reveal block, so it waits for motion`).toBe(false);
    expect(e.animating, `${where}: the ${key} is animating`).toEqual([]);
  }
  expect(m.h1.text.length, `${where}: the h1 has words in it`).toBeGreaterThan(10);
  expect(m.sub.text.length, `${where}: the sub has words in it`).toBeGreaterThan(20);
  expect(m.book.text, `${where}: the hero's booking action`).toBe('Book a call');
  expect(m.book.height, `${where}: Book a call is ${m.book.height}px tall`).toBeGreaterThanOrEqual(44);
}

for (const vp of VIEWPORTS) {
  for (const mode of MODES) {
    test(`${vp.name} ${vp.width}x${vp.height}, ${mode}: the hero reads in the first frame, the bar does not double it, and the film still ends`, async ({ browser, playwright, baseURL }) => {
      test.setTimeout(150_000);
      const js = mode !== 'no JavaScript';
      /* WebGL unavailable is a browser switch, so that mode gets a browser of
         its own (as tests/closing-round.spec.js does for BPH-1). */
      const own = mode === 'no WebGL'
        ? await playwright.chromium.launch({ args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] })
        : null;
      try {
        const ctx = await (own || browser).newContext({
          baseURL,
          viewport: { width: vp.width, height: vp.height },
          reducedMotion: mode === 'reduced motion' ? 'reduce' : 'no-preference',
          javaScriptEnabled: js,
        });
        await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
        let release = () => {};
        if (js) {
          const gate = new Promise((r) => { release = r; });
          await ctx.route('**/assets/film/film-2.js', async (route) => { await gate; await route.continue(); });
        }
        const page = await ctx.newPage();

        /* ---- the first frame ---- */
        await page.goto('/', { waitUntil: js ? 'commit' : 'load' });
        /* The first film script's tag comes after </main>: once the parser has
           reached it, the whole page above the film's scripts is in the
           document, wherever the hero is or is not. */
        await page.waitForSelector('script[src="/assets/film/film-1.js"]', { state: 'attached' });
        if (js) {
          /* The browser has painted the page as it stands: the film's script
             has not arrived, so whatever is on screen got there without it. */
          await page.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0);
        }
        const first = await page.evaluate(measureFirstScreen);
        expect(first.filmwait, 'the film has not drawn, so <html> still carries nv-filmwait').toBe(true);
        expectReadable(first, 'first frame');

        /* ---- after every script has run ---- */
        release();
        await page.waitForLoadState('load');
        await page.waitForTimeout(1200);
        const settled = await page.evaluate(measureFirstScreen);
        expectReadable(settled, 'after load');
        expect(settled.book.onTop, 'after load: something sits on top of the hero\'s Book a call').toBe(true);
        if (mode === 'reduced motion' || mode === 'no WebGL') {
          expect(await page.evaluate(() => document.documentElement.classList.contains('nv-rm')),
            'the film took its static path').toBe(true);
        }

        /* ---- the bar ---- */
        const bar = page.locator('a.callbar');
        await expect(bar, 'the homepage carries exactly one sticky bar').toHaveCount(1);
        await expect(bar, 'the bar must not double the hero\'s own Book a call').toBeHidden();
        if (js && vp.width <= 820) {
          /* Past the hero's action row, into the top of the film. */
          await page.evaluate(() => {
            const row = document.querySelector('#found .ctarow');
            window.scrollTo(0, row.getBoundingClientRect().bottom + scrollY + 40);
          });
          await expect(bar, 'once the hero\'s action row has scrolled away, the bar is there').toBeVisible({ timeout: SLOW });
          await expect(bar).toHaveAttribute('href', '/book.html#pick-a-time');
          const into = await page.evaluate(() => {
            const sc = document.getElementById('scroll');
            const top = sc.getBoundingClientRect().top + scrollY;
            window.scrollTo(0, top + Math.round(innerHeight * 1.5));
            return top;
          });
          expect(into, 'the film starts below the hero').toBeGreaterThan(vp.height * 0.5);
          await expect(bar, 'and through the film').toBeVisible({ timeout: SLOW });
          await page.evaluate(() => window.scrollTo(0, 0));
          await expect(bar, 'back at the hero it steps aside again').toBeHidden({ timeout: SLOW });
        }

        /* ---- the film still reaches its ending ---- */
        if (js) {
          if (mode === 'motion') {
            await page.evaluate(() => {
              const sc = document.getElementById('scroll');
              const top = sc.getBoundingClientRect().top + scrollY;
              window.scrollTo(0, Math.ceil(top + sc.offsetHeight - innerHeight));
            });
            await expect.poll(() => page.evaluate(() => document.getElementById('close').classList.contains('on')),
              { message: 'the film never reached its ending', timeout: 60_000 }).toBe(true);
            /* The block fades in over .6s on the page's animation clock, which
               only advances when a frame is presented: on a loaded machine
               rendering the film in software that can be seconds, so the fade
               is waited for rather than timed (a fixed 900ms failed once in a
               run that took 6.8 minutes instead of 48 seconds). */
            await expect.poll(() => page.evaluate(() => {
              let o = 1;
              for (let n = document.querySelector('#close a.cta'); n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
              return o;
            }), { message: 'the ending never faded in', timeout: 30_000 }).toBeGreaterThan(0.9);
          } else {
            await page.locator('#close a.cta').scrollIntoViewIfNeeded();
            await page.waitForTimeout(300);
          }
          const end = await page.evaluate(() => {
            const a = document.querySelector('#close a.cta');
            const b = a.getBoundingClientRect();
            let o = 1;
            for (let n = a; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
            const at = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
            return { text: a.textContent.trim(), href: a.getAttribute('href'), opacity: o, hit: !!at && (at === a || a.contains(at)) };
          });
          expect(end.text).toBe('Book a call');
          expect(end.href).toBe('/book.html#pick-a-time');
          expect(end.opacity, 'the ending\'s Book a call is on screen').toBeGreaterThan(0.9);
          expect(end.hit, 'the ending\'s Book a call takes the tap at its own centre').toBe(true);
        }
        await ctx.close();
      } finally {
        if (own) await own.close();
      }
    });
  }
}
