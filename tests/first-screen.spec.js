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
     the keyboard  while the hero is in view (nv-above), the film's fixed
                   chrome is out of the tab order, not only transparent: Tab
                   from the hero's last link lands on a control a visitor can
                   see, never on a rail button, the film ending's two links or
                   the node card's close button, all of which sat at opacity 0
                   in the tab order until the polish round of 2026-11-09. Once
                   the stage reaches the top of the screen the rail is back in
                   the tab order.
     mid-film      (post-launch sweep F3, 2026-11-09) inside the film, Tab
                   from the hero's last link lands only on stops a visitor
                   can see, never on the ending's two links while the ending
                   is off; at the ending both are in the tab order, and a
                   pane card opened over the ending takes them out again.

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
   The keyboard tests, the same way (polish round, 2026-11-09), both
   viewports each time:
     nv-above rule without visibility:hidden   2 failed: "with the hero in
                           view, close "Book a call" is still in the tab order"
     #ncard rule dropped   2 failed: "with the hero in view, ncardClose "✕"
                           is still in the tab order"
   and green again restored (14 passed).
   The mid-film keyboard test (post-launch sweep F3, 2026-11-09), against
   main 0fb6589's build served from a checkout of that commit: 2 failed,
   "mid-film Tab 1 landed on a "Book a call" in #close, at opacity 0
   (#close)" at 390x844 and 1440x900; green on the branch that hides #close
   while it is not on. Then each mutation made to that branch's served
   index.html, both viewports each time, and restored:
     card-open selector dropped    2 failed: "with a pane card open the
                                   ending is transparent and its links are
                                   still in the tab order"
     :not(.on) selector dropped    2 failed: "mid-film Tab 1 landed on a
                                   "Book a call" in #close, at opacity 0"
     #close hidden even when on    2 failed: "at the ending, Book a call and
                                   Scan my website are in the tab order"
   and green again restored.

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

/* ---------- the keyboard ----------
   Motion only: that is the path on which the rail is laid out (nv-live) and
   the film ending is a fixed block at opacity 0. On the reduced-motion and
   no-WebGL path the ending is ordinary text in the document, and Tab landing
   on its Book a call there is right. */
const FILM_CHROME = '#paneNav, #close, #ncard, #labels, #hint, #nlabel';

for (const vp of VIEWPORTS.filter((v) => v.width !== 360)) {
  test(`${vp.name} ${vp.width}x${vp.height}, motion: Tab from the hero's last link skips the film's hidden chrome, and the rail is back once the film is on screen`, async ({ browser, baseURL }) => {
    test.setTimeout(150_000);
    const ctx = await browser.newContext({ baseURL, viewport: { width: vp.width, height: vp.height }, reducedMotion: 'no-preference' });
    await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
    const page = await ctx.newPage();
    try {
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForFunction(() => document.documentElement.classList.contains('nv-live'), null, { timeout: 60_000 });
      const at = await page.evaluate(() => {
        const de = document.documentElement;
        const hidden = [...document.querySelectorAll('#paneNav button, #close a, #ncardClose')].map((el) => ({
          what: `${el.closest('[id]').id} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)}"`,
          visibility: getComputedStyle(el).visibility,
        }));
        return { above: de.classList.contains('nv-above'), rail: document.querySelectorAll('#paneNav button').length, hidden };
      });
      expect(at.above, 'the page opens with the hero in view (nv-above)').toBe(true);
      expect(at.rail, 'the film draws its six-button rail').toBe(6);
      for (const h of at.hidden) expect(h.visibility, `with the hero in view, ${h.what} is still in the tab order`).toBe('hidden');

      /* Tab from the hero's last link, the way a keyboard visitor leaves it. */
      await page.evaluate(() => [...document.querySelectorAll('#found .hero-top a')].at(-1).focus());
      expect(await page.evaluate(() => document.activeElement.textContent.trim())).toBe('Scan my website');
      await page.keyboard.press('Tab');
      const next = await page.evaluate((sel) => {
        const el = document.activeElement;
        return { what: `${el.tagName.toLowerCase()} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40)}" in #${(el.closest('[id]') || {}).id}`,
          chrome: !!el.closest(sel), rail: !!el.closest('#paneNav'), body: el === document.body };
      }, FILM_CHROME);
      expect(next.body, 'Tab from the hero went nowhere').toBe(false);
      expect(next.rail, `Tab from the hero's last link landed on a hidden rail button: ${next.what}`).toBe(false);
      expect(next.chrome, `Tab from the hero's last link landed on the film's hidden chrome: ${next.what}`).toBe(false);
      /* The stop is something a visitor can see: a scroll-reveal block fades
         in once focus has scrolled it into view, on the page's animation
         clock, so it is waited for. */
      await expect.poll(() => page.evaluate(() => {
        const el = document.activeElement;
        let o = 1;
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
        return getComputedStyle(el).visibility === 'visible' && o > 0.9;
      }), { message: `the stop after the hero (${next.what}) never became visible`, timeout: SLOW }).toBe(true);

      /* Into the film: the stage at the top of the screen clears nv-above, and
         the rail is visible and focusable again. */
      await page.evaluate(() => {
        const sc = document.getElementById('scroll');
        const top = sc.getBoundingClientRect().top + scrollY;
        window.scrollTo(0, Math.round(top + 0.2 * (sc.offsetHeight - innerHeight)));
      });
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('nv-above')),
        { message: 'the film never cleared nv-above', timeout: SLOW }).toBe(false);
      const back = await page.evaluate(() => {
        const b = document.querySelector('#paneNav button');
        b.focus();
        return { visibility: getComputedStyle(b).visibility, focused: document.activeElement === b };
      });
      expect(back, 'in the film the rail is in the tab order again').toEqual({ visibility: 'visible', focused: true });
    } finally {
      await ctx.close();
    }
  });
}

/* ---------- the keyboard, inside the film (post-launch sweep F3) ----------
   nv-above and nv-below take the film's chrome out of the tab order outside
   the film. Inside it the ending (#close) is a fixed block at opacity 0 until
   the film's last beat, and on 2026-11-09 the live site still let Tab reach
   its two links there: focus left on the hero, the page scrolled into the
   film, and Tab went to "Book a call" then "Scan my website", both at
   opacity 0, with no focus a visitor could see. A pane card open over the
   ending fades it to 0 the same way (body.card-open .copy.on). So: mid-film,
   the next stops after the hero's last link are all things a visitor can
   see (no stop, and nothing it sits inside, at computed opacity 0); at the
   ending the two links are in the tab order; with a card open over the
   ending they are not. */
const transparentChain = () => {
  const el = document.activeElement;
  const zero = [];
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    if (getComputedStyle(n).opacity === '0') zero.push(n.id ? `#${n.id}` : n.tagName.toLowerCase());
  }
  return {
    what: `${el.tagName.toLowerCase()} "${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}" in #${(el.closest('[id]') || {}).id}`,
    body: el === document.body,
    visibility: getComputedStyle(el).visibility,
    zero,
  };
};

for (const vp of VIEWPORTS.filter((v) => v.width !== 360)) {
  test(`${vp.name} ${vp.width}x${vp.height}, motion: mid-film Tab lands only on what can be seen, and the ending leaves the tab order under a card`, async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    const ctx = await browser.newContext({ baseURL, viewport: { width: vp.width, height: vp.height }, reducedMotion: 'no-preference' });
    await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
    const page = await ctx.newPage();
    try {
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForFunction(() => document.documentElement.classList.contains('nv-live'), null, { timeout: 60_000 });
      /* A fifth of the way into the film: the stage fills the screen, the
         ending is off. */
      await page.evaluate(() => {
        const sc = document.getElementById('scroll');
        const top = sc.getBoundingClientRect().top + scrollY;
        window.scrollTo(0, Math.round(top + 0.2 * (sc.offsetHeight - innerHeight)));
      });
      await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('nv-above')),
        { message: 'the film never cleared nv-above', timeout: SLOW }).toBe(false);
      expect(await page.evaluate(() => document.getElementById('close').classList.contains('on')),
        'mid-film, the ending is off').toBe(false);
      /* After the ignition. Where the stage starts within half a screen of
         the top (1440x900) the film opens with its ignition, which holds the
         rail at opacity 0 (html.nv-intro) until the wake brings it in, and
         the rail then fades up on the page's animation clock; that transient
         state is not what F3 is about, so it is waited out here. */
      await expect.poll(() => page.evaluate(() => !document.documentElement.classList.contains('nv-intro')
        && getComputedStyle(document.getElementById('paneNav')).opacity === '1'),
      { message: 'the film\'s ignition never finished, or the rail never faded in', timeout: 90_000 }).toBe(true);

      /* Focus stays where the visitor left it, on the hero's last link, while
         the page scrolls into the film; then Tab. */
      await page.evaluate(() => [...document.querySelectorAll('#found .hero-top a')].at(-1).focus({ preventScroll: true }));
      for (let i = 1; i <= 3; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
        const s = await page.evaluate(transparentChain);
        expect(s.body, `mid-film Tab ${i} went nowhere`).toBe(false);
        expect(s.zero, `mid-film Tab ${i} landed on ${s.what}, at opacity 0 (${s.zero.join(' in ')})`).toEqual([]);
        expect(s.visibility, `mid-film Tab ${i} landed on ${s.what}, which is not visible`).toBe('visible');
      }

      /* The ending: on, so both links are in the tab order... */
      await page.evaluate(() => {
        const sc = document.getElementById('scroll');
        const top = sc.getBoundingClientRect().top + scrollY;
        window.scrollTo(0, Math.ceil(top + sc.offsetHeight - innerHeight));
      });
      await expect.poll(() => page.evaluate(() => document.getElementById('close').classList.contains('on')),
        { message: 'the film never reached its ending', timeout: 90_000 }).toBe(true);
      const ending = () => page.evaluate(() => [...document.querySelectorAll('#close a')].map((a) => getComputedStyle(a).visibility));
      expect(await ending(), 'at the ending, Book a call and Scan my website are in the tab order').toEqual(['visible', 'visible']);
      /* ...and a pane card opened over it fades it out and takes it out. */
      await page.evaluate(() => window.NV_IX.open(document.querySelector('#paneNav button[data-pane]').getAttribute('data-pane')));
      await expect.poll(() => page.evaluate(() => document.body.classList.contains('card-open')),
        { message: 'the pane card never opened', timeout: SLOW }).toBe(true);
      await expect.poll(ending, { message: 'with a pane card open the ending is transparent and its links are still in the tab order', timeout: SLOW })
        .toEqual(['hidden', 'hidden']);
      await page.evaluate(() => window.NV_IX.close());
      await expect.poll(ending, { message: 'the card closed and the ending\'s links did not come back', timeout: SLOW })
        .toEqual(['visible', 'visible']);
    } finally {
      await ctx.close();
    }
  });
}
