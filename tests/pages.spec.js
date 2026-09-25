/* ============================================================
   NEVAMIS SITE-WIDE SMOKE
   Every restyled page must load clean on the new design system:
   correct stylesheets, canonical header/footer, working nav,
   no console errors, no horizontal overflow, at desktop + phone.

   This file is the one Playwright spec CI runs (.github/workflows/verify.yml,
   step "phone width"), so everything in it has to pass on an untouched main
   and must not reach anything live. See OFFLINE below.
   ============================================================ */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('artifacts/motion-proof/pages');
const PAGES = [
  'pricing.html', 'how-you-start.html', 'pilot.html', 'demo.html', 'book.html', 'about.html',
  'coming-soon.html', 'privacy.html', 'terms.html', 'revenue-engine.html', '404.html',
  /* The solutions hub and the pages it links to. They are generated from one
     template (scripts/build-content.mjs), so an overflow in the template is an
     overflow on all of them, and until 2026-09-25 none was measured at all. */
  'solutions.html', 'electricians.html', 'hvac.html', 'plumbers.html', 'restoration.html',
  'after-hours-answering.html', 'missed-calls.html', 'vs-voicemail.html', 'vs-answering-service.html',
];

/* The phone the site is measured on: 375 wide, the narrowest iPhone still sold
   and supported (SE, 13 mini). A page that fits here fits the 390 to 430 of the
   rest; the reverse is not true. The engine's phone project uses the same size. */
const PHONE = { width: 375, height: 812 };

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

function watchErrors(page, sink) {
  page.on('console', (m) => { if (m.type() === 'error') sink.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => sink.push(`pageerror: ${e.message}`));
}

/* OFFLINE. site.js beacons page_view (and every click) to
   https://app.nevamis.ca/api/events, which writes a row into PRODUCTION's
   site_events table. A smoke test that runs on every pull request must not
   add fake visits to the owner's traffic numbers, so the engine origin is
   answered here with the 204 the real endpoint gives a preflight. Fulfilled,
   not aborted: an aborted request logs a console error, which the "loads
   clean" assertion below would then have to learn to ignore. */
async function offline(ctx) {
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
}

/* No unclipped element escapes the right edge. Anything inside an ancestor
   that clips or scrolls horizontally is fine: it cannot widen the page. */
function escapees(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('body *')).filter((el) => {
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
      const b = el.getBoundingClientRect();
      if (!(b.width > 0 && b.height > 0 && b.right > innerWidth + 1)) return false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const ox = getComputedStyle(a).overflowX;
        if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return false;
      }
      return true;
    }).slice(0, 4).map((el) => `${el.tagName}.${el.getAttribute('class') || el.id || ''}`));
}

/* THE PAGE ITSELF SCROLLS SIDEWAYS. The escapee walk above forgives anything
   inside a clipping ancestor, and body is overflow-x:clip, so it can pass while
   the document is still wider than the phone. This is the number a thumb
   actually feels. */
function sidewaysScroll(page) {
  return page.evaluate(() => document.scrollingElement.scrollWidth - innerWidth);
}

/* iPhone Safari zooms the whole page into any text field under 16px the moment
   it is tapped, and it stays zoomed after the keyboard closes. Computed style,
   not the stylesheet text: a page rule, an inline style or a later cascade
   layer can all undo the shared 16px in assets/motion/site.css, and only the
   browser knows which one won. Hidden controls are measured too (the callback
   form on book.html is hidden until it is asked for), because hidden is how
   every one of them starts. Checkboxes, radios, ranges and buttons never take
   a keyboard, so Safari never zooms into them. */
function smallTextControls(page) {
  return page.evaluate(() => {
    const NO_KEYBOARD = new Set(['hidden', 'checkbox', 'radio', 'range', 'button', 'submit',
      'reset', 'image', 'file', 'color']);
    return [...document.querySelectorAll('input, select, textarea')]
      .filter((el) => !(el.tagName === 'INPUT' && NO_KEYBOARD.has((el.getAttribute('type') || 'text').toLowerCase())))
      .map((el) => ({ el, px: parseFloat(getComputedStyle(el).fontSize) }))
      .filter(({ px }) => px < 16)
      .map(({ el, px }) => `${el.tagName.toLowerCase()}#${el.id || el.name || '?'} at ${px}px`);
  });
}

for (const file of PAGES) {
  test(`${file} loads clean on the design system`, async ({ browser }) => {
    const errors = [];
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await offline(ctx);
    const page = await ctx.newPage();
    watchErrors(page, errors);
    await page.goto('/' + file);

    // On the new system, off the old stylesheet. The design system is inlined
    // rather than linked now (scripts/lib/inline-css.mjs), so this asserts the
    // stylesheet is PRESENT, which is what the test was ever about, instead of
    // asserting the transport it happens to arrive over.
    const design = await page.evaluate(() =>
      [...document.querySelectorAll('style')].some((s) => s.textContent.includes('--navy:')));
    expect(design, 'the site design system must be in the document').toBe(true);
    await expect(page.locator('link[href*="assets/motion/site.css"]')).toHaveCount(0);
    await expect(page.locator('link[href="styles.css"], link[href="/styles.css"]')).toHaveCount(0);

    // canonical chrome
    await expect(page.locator('header.site-header')).toHaveCount(1);
    await expect(page.locator('footer.site-footer')).toHaveCount(1);
    await expect(page.locator('.main-nav a', { hasText: 'Pricing' })).toHaveCount(1);

    /* The aurora canvas assertion was here. It is deleted with the shader
       (assets/motion/aurora.js): the ground is one flat #02080D on every page
       now, and the only <canvas> left on the site is the film's, on /. */
    await expect(page.locator('canvas')).toHaveCount(0);

    expect(await escapees(page), `overflow on ${file} at desktop width`).toEqual([]);

    await page.screenshot({ path: path.join(OUT, file.replace('.html', '') + '-desktop.png') });

    /* PHONE. The overflow checks used to run at 1440 only, and the phone half
       of this test only opened the menu, so a page could scroll sideways on
       every phone that visited while this file reported it clean. Both checks
       now run again at phone width, before the menu is opened (an open drawer
       is a different page state). */
    await page.setViewportSize(PHONE);
    await page.waitForTimeout(250);
    expect(await escapees(page), `overflow on ${file} at phone width`).toEqual([]);
    expect(await sidewaysScroll(page), `${file} scrolls sideways on a phone by this many px`).toBeLessThanOrEqual(0);
    expect(await smallTextControls(page), `${file}: text fields under 16px make iPhone Safari zoom on tap`).toEqual([]);

    // phone: menu opens, callbar present
    await page.locator('.nav-toggle').click();
    await expect(page.locator('.main-nav')).toHaveClass(/open/);
    await page.screenshot({ path: path.join(OUT, file.replace('.html', '') + '-mobile.png') });

    expect(errors, `${file} errors:\n${errors.join('\n')}`).toEqual([]);
    await ctx.close();
  });
}

/* The film homepage is not in the loop above: it is the one page with a
   <canvas>, and its header is hidden under the film's cold open. Its phone
   contract is the same, though, and it carries the calculator, so it gets the
   same two measurements on its own. */
test('the film homepage fits a phone and its calculator does not zoom', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: PHONE });
  await offline(ctx);
  const page = await ctx.newPage();
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#roiMissed').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  expect(await page.locator('#roiMissed').count(), 'the calculator must be on the homepage to be measured').toBe(1);
  expect(await escapees(page), 'overflow on the homepage at phone width').toEqual([]);
  expect(await sidewaysScroll(page), 'the homepage scrolls sideways on a phone by this many px').toBeLessThanOrEqual(0);
  expect(await smallTextControls(page), 'homepage text fields under 16px make iPhone Safari zoom on tap').toEqual([]);
  await ctx.close();
});

/* An event pushed straight into window.nvEvents is never sent anywhere: that
   array is a local record, and only nvTrack() in site.js both records AND
   beacons. book.html did exactly this with booking_page_view until 2026-09-25,
   so the funnel had a "reach" event that had counted nothing since the day it
   was written. Every page is read from disk, not only the ones loaded above. */
test('no page records an analytics event that is never sent', () => {
  const pages = fs.readdirSync('.').filter((f) => f.endsWith('.html'));
  expect(pages.length, 'the site root must be the working directory').toBeGreaterThan(10);
  const offenders = pages.filter((f) => /nvEvents\s*\.\s*push\s*\(/.test(fs.readFileSync(f, 'utf8')));
  expect(offenders, 'use window.nvTrack(name), which sends; a bare nvEvents.push counts nothing').toEqual([]);
});
