/* ============================================================
   NEVAMIS INTERACTION PROOF
   The ported components must actually work in the new skin:
   audio player, simulator, coverage tabs, ROI calculator, FAQ,
   pricing preview, capability rail, and the motion toggle.
   ============================================================ */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('artifacts/motion-proof');
const PLAIN = '/home.html';

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

function watchErrors(page, sink) {
  page.on('console', (m) => { if (m.type() === 'error') sink.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => sink.push(`pageerror: ${e.message}`));
}

test('pricing preview renders every plan from the single source of truth', async ({ page }) => {
  const errors = [];
  watchErrors(page, errors);
  await page.goto(PLAIN);

  /* Every assertion below reads the config. The previous version pinned
     "After Hours", "C$249", "C$449", "from C$849" and "two months free" into
     the test: five retired facts, four of them retired prices and one an
     annual offer that has been switched off since 2026-08-06. The plan names
     and the numbers had all moved on, so this test could only ever fail, and
     while it failed it was still the thing standing guard over the homepage's
     price cards. A test that hardcodes the answer stops being a guard the
     first time the answer legitimately changes. */
  const cfg = await page.evaluate(() => ({
    plans: window.NV_PRICING.plans.map((p) => ({
      name: p.name, monthly: p.monthly, setup: p.setup, minutes: p.includedMinutes,
    })),
    recommendedLabel: window.NV_PRICING.recommendedLabel,
    annualActive: !!(window.NV_PRICING.annual && window.NV_PRICING.annual.active),
    retired: [49, 197, 249, 397, 449, 499, 797, 849],
  }));

  const cards = page.locator('#pricePreview .price-card');
  await expect(cards).toHaveCount(cfg.plans.length);

  const grp = (n) => Number(n).toLocaleString('en-CA');
  for (const [i, plan] of cfg.plans.entries()) {
    const card = cards.nth(i);
    await expect(card).toContainText(plan.name);
    /* BOTH numbers, in the order a buyer meets them. Until 2026-08-07 this
       card read "C$250/month" over "setup C$250", which is the same two
       correct figures arranged so a reader totals them to C$500 on day one.
       Asserting the recurring price alone is what let that ship. */
    await expect(card, `${plan.name} must state what month one costs`)
      .toContainText(`First month C$${grp(plan.setup)}`);
    await expect(card, `${plan.name} must state what every month after costs`)
      .toContainText(`then C$${grp(plan.monthly)}/month`);
    await expect(card).toContainText(`${grp(plan.minutes)} AI minutes included`);
  }

  /* The badge used to say "MOST COMMON", a statistic about a client base that
     does not exist, and the old assertion pinned that exact wording in place.
     Asserting the CONFIGURED label instead proves the badge renders from the
     single source of truth without insisting on any particular claim. */
  expect(cfg.recommendedLabel, 'pricing-config must define recommendedLabel').toBeTruthy();
  const recIndex = cfg.plans.findIndex((p) => p.name === 'Growth');
  await expect(cards.nth(recIndex)).toContainText(cfg.recommendedLabel);

  /* Annual prepay is suspended. Advertising "two months free" against a yearly
     figure nobody approved is inventing a price, so the card must NOT carry it
     while the config says it is off. */
  if (!cfg.annualActive) {
    await expect(page.locator('#pricePreview')).not.toContainText('two months free');
  }

  /* Every retired price, in one sweep. C$49 was checked alone here, which is
     why C$249, C$449 and C$849 stayed on this page for as long as they did. */
  const body = await page.locator('body').innerText();
  for (const n of cfg.retired) {
    expect(body, `retired price C$${n} must not appear on the homepage`)
      .not.toMatch(new RegExp(`C\\$${n}\\b`));
  }
  await expect(page.locator('body')).not.toContainText('Pay As You Go');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('the call player plays through the transcript and lights the chips', async ({ page }) => {
  await page.goto(PLAIN);
  const play = page.locator('#playBtn');
  await play.scrollIntoViewIfNeeded();
  await play.click();

  // playing state + first line highlighted
  await expect(page.locator('#callCard')).toHaveClass(/playing/);
  await expect(page.locator('#playLabel')).toHaveText('Pause');
  // the duration in the label is the permission slip to press play
  await expect(page.locator('.line.speaking')).toHaveCount(1);

  // audio element advances lines on 'ended'; force-fire it rather than
  // waiting out real audio in CI. 11-line call: qualified at line 3,
  // booked at line 8.
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('nv:callline', { detail: { idx: 3 } }));
  });
  await expect(page.locator('[data-callchip="qualified"]')).toHaveClass(/lit/);
  await page.evaluate(() => {
    document.dispatchEvent(new CustomEvent('nv:callline', { detail: { idx: 8 } }));
  });
  await expect(page.locator('[data-callchip="booked"]')).toHaveClass(/lit/);

  await page.evaluate(() => { document.dispatchEvent(new CustomEvent('nv:callend')); });
  await expect(page.locator('[data-callchip="confirm"]')).toHaveClass(/lit/);
  await expect(page.locator('.summary-arrive')).toHaveClass(/in/);

  // stop works
  await play.click();
  await expect(page.locator('#playLabel')).toHaveText(/Hear a \d+-second call/);
  await page.screenshot({ path: path.join(OUT, 'section-call-proof.png') });
});

test('the simulator runs a scenario through all six stages', async ({ page }) => {
  await page.goto(PLAIN);
  const sim = page.locator('#sim');
  await sim.scrollIntoViewIfNeeded();

  await page.locator('#simWatch').click();
  await expect(page.locator('#simBody')).toBeVisible();

  // speed through: click forward until complete
  const fwd = page.locator('[data-sim-fwd]');
  for (let i = 0; i < 12; i++) await fwd.click();

  await expect(page.locator('[data-sim-state]')).toHaveText(/Complete/i);
  await expect(page.locator('.sim-out-card.on')).toHaveCount(3); // calendar, customer, summary for routine
  await expect(page.locator('.stage-pill.done, .stage-pill.active')).toHaveCount(6);
  await page.screenshot({ path: path.join(OUT, 'section-simulator.png') });

  // scenario switch restarts and plays
  await page.locator('[data-scen="emergency"]').click();
  await expect(page.locator('[data-scen="emergency"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.sim-log .sim-line').first()).toBeVisible();
});

test('coverage tabs switch with mouse and arrow keys', async ({ page }) => {
  await page.goto(PLAIN);
  const tabs = page.locator('.modes [role=tab]');
  await tabs.first().scrollIntoViewIfNeeded();

  await tabs.nth(1).click();
  await expect(page.locator('#panelOver')).toBeVisible();
  await expect(page.locator('#panelAfter')).toBeHidden();

  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#panelFull')).toBeVisible();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
});

test('the ROI calculator computes and shows break-even with a quote', async ({ page }) => {
  await page.goto(PLAIN);
  await page.locator('#roiMissed').scrollIntoViewIfNeeded();

  // defaults: 10 × 4.33 × .6 × 400 × .5 = 5196
  await expect(page.locator('#roiOpp')).toHaveText('$5,196');
  await expect(page.locator('#roiRec')).toHaveText('$2,598');

  await page.locator('#roiQuote').fill('449');
  await expect(page.locator('#roiBeRow')).toBeVisible();
  await expect(page.locator('#roiBe')).toContainText('booked jobs per month');
});

test('FAQ items open, close, and stay keyboard operable', async ({ page }) => {
  await page.goto(PLAIN);
  const first = page.locator('.faq details').first();
  await first.scrollIntoViewIfNeeded();

  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('p')).toBeVisible();

  await first.locator('summary').click();
  await expect(first).not.toHaveAttribute('open', '');

  // keyboard: focus + Enter opens
  await first.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('open', '');
  await page.screenshot({ path: path.join(OUT, 'section-faq.png') });
});

test('the capability rail becomes a marquee and pauses for reduced motion', async ({ page, browser }) => {
  await page.goto(PLAIN);
  await expect(page.locator('.rail-track')).toHaveCount(1);
  const anim = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.rail-track')).animationName);
  expect(anim).toBe('railScroll');

  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const p2 = await ctx.newPage();
  await p2.goto(PLAIN);
  // motion.js only builds the marquee when motion is allowed
  await expect(p2.locator('.rail-track')).toHaveCount(0);
  await expect(p2.locator('.trust-strip li').first()).toBeVisible();
  await ctx.close();
});

test('the motion toggle freezes the hero on its finished frame and resumes', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);

  await page.locator('.motion-toggle-btn').click();
  await page.waitForTimeout(150);
  const off = await page.evaluate(() => ({
    cls: document.documentElement.classList.contains('motion-off'),
    heroPaused: window.__heroTL.paused(),
    h1Visible: getComputedStyle(document.querySelector('h1 .w')).visibility,
    ctaVisible: getComputedStyle(document.querySelector('[data-cta]')).visibility,
  }));
  expect(off.cls).toBe(true);
  expect(off.heroPaused).toBe(true);
  expect(off.h1Visible).toBe('visible');
  expect(off.ctaVisible).toBe('visible');

  await page.locator('.motion-toggle-btn').click();
  await page.waitForTimeout(150);
  const on = await page.evaluate(() => document.documentElement.classList.contains('motion-off'));
  expect(on).toBe(false);
});

test('the aurora flows with scroll and stands still under reduced motion', async ({ page, browser }) => {
  await page.goto(PLAIN);
  const aurora = page.locator('#aurora');
  await expect(aurora).toHaveCount(1);

  // the sky must be alive: two samples a moment apart differ
  const a = await page.evaluate(() => document.getElementById('aurora').toDataURL());
  await page.waitForTimeout(450);
  const b = await page.evaluate(() => document.getElementById('aurora').toDataURL());
  expect(a === b, 'aurora should drift over time').toBeFalsy();

  // scrolling injects energy — and never throws
  await page.evaluate(() => window.scrollTo({ top: 2400, behavior: 'instant' }));
  await page.waitForTimeout(250);
  const c = await page.evaluate(() => document.getElementById('aurora').toDataURL());
  expect(b === c, 'aurora should respond to scroll').toBeFalsy();

  // reduced motion: present but perfectly still
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const p2 = await ctx.newPage();
  await p2.goto(PLAIN);
  await expect(p2.locator('#aurora')).toHaveCount(1);
  const r1 = await p2.evaluate(() => document.getElementById('aurora').toDataURL());
  await p2.waitForTimeout(450);
  const r2 = await p2.evaluate(() => document.getElementById('aurora').toDataURL());
  expect(r1).toBe(r2);
  await ctx.close();
});

test('every tap emits a sonar ring, except under reduced motion', async ({ page, browser }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  await expect(page.locator('.nv-sonar')).toHaveCount(8); // pooled, idle

  // press on open page space → a ring becomes visible
  await page.mouse.move(700, 640);
  await page.mouse.down();
  const litDuringPress = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.nv-sonar'))
      .some((r) => Number(getComputedStyle(r).opacity) > 0.1));
  await page.mouse.up();
  expect(litDuringPress, 'a sonar ring should appear on press').toBe(true);

  // and it fades back out on its own
  await page.waitForTimeout(1100);
  const stillLit = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.nv-sonar'))
      .some((r) => Number(getComputedStyle(r).opacity) > 0.1));
  expect(stillLit, 'sonar rings must fade out').toBe(false);

  // reduced motion: the module never installs
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const p2 = await ctx.newPage();
  await p2.goto(PLAIN);
  await expect(p2.locator('.nv-sonar')).toHaveCount(0);
  await ctx.close();
});

test('funnel diagnostics fire without leaking anything personal', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => Array.isArray(window.nvEvents));

  // walk the page so section + depth events accumulate. Seven stops, not
  // four: the pinned night band added roughly two viewports of scroll range,
  // and a four-teleport walk across the longer page can land between
  // sections, which says nothing about whether events fire on a real
  // read-through. Depth milestones are unaffected either way.
  for (const pct of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1]) {
    await page.evaluate((p) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max * p, behavior: 'instant' });
    }, pct);
    await page.waitForTimeout(450);
  }

  const events = await page.evaluate(() => window.nvEvents.map((e) => e.event));
  expect(events.filter((e) => e.startsWith('section_reached_')).length,
    'section reach events should fire').toBeGreaterThanOrEqual(4);
  expect(events, 'depth milestones should fire').toContain('scroll_depth_50');
  expect(events).toContain('scroll_depth_100');

  // the taxonomy forbids personal data: names only, empty props
  const payloads = await page.evaluate(() => window.nvEvents.map((e) => JSON.stringify(e.data || {})));
  for (const p of payloads) expect(p).toBe('{}');
});

test('the post-call prompt appears only after a real call gap', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => Array.isArray(window.nvEvents));

  // returning immediately must NOT nag: too fast to have placed a call
  await page.evaluate(() => { sessionStorage.setItem('nv-called', String(Date.now())); });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(200);
  await expect(page.locator('.callback-bar')).toHaveCount(0);

  // returning after a plausible call does
  await page.evaluate(() => { sessionStorage.setItem('nv-called', String(Date.now() - 40000)); });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  const bar = page.locator('.callback-bar');
  await expect(bar).toHaveCount(1);
  await expect(bar.locator('a[data-evt="post_call_book_click"]')).toBeVisible();

  // dismissible, and it never returns in the same session
  await bar.locator('.callback-close').click();
  await page.waitForTimeout(400);
  await expect(page.locator('.callback-bar')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(200);
  await expect(page.locator('.callback-bar')).toHaveCount(0);
});

test('the homepage scheduler loads lazily and books without leaving the page', async ({ page }) => {
  await page.goto(PLAIN);
  // nothing costly before it is needed
  await expect(page.locator('#inlineBook iframe')).toHaveCount(0);

  await page.locator('#inlineBook').scrollIntoViewIfNeeded();
  const frame = page.locator('#inlineBook iframe');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', /cal\.com/);
  await expect(frame).toHaveAttribute('title', /Book a 15-minute intro call/);
});

test('footer, callbar and every section land without console errors', async ({ browser }) => {
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  watchErrors(page, errors);
  await page.goto(PLAIN);

  // all major sections exist
  for (const id of ['proof', 'simulator', 'how', 'solutions', 'industries', 'roi',
    'process', 'compare', 'build-stack', 'day-one', 'pricing-preview', 'risk', 'beyond', 'faq']) {
    await expect(page.locator('#' + id)).toHaveCount(1);
  }
  // mobile call bar visible at phone width
  await expect(page.locator('.callbar')).toBeVisible();
  // mobile menu opens
  await page.locator('.nav-toggle').click();
  await expect(page.locator('.main-nav')).toHaveClass(/open/);
  await expect(page.locator('.main-nav a', { hasText: 'Pricing' })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'section-footer-mobile.png') });
  expect(errors, errors.join('\n')).toEqual([]);
  await ctx.close();
});

/* Cal.com's booker follows the VISITOR's prefers-color-scheme, so anyone
   browsing in light mode got a white scheduler in the middle of this site's
   black page — on the one page whose job is to take a booking.

   Only the /embed endpoint honours theme=dark; the plain booking url ignores
   every spelling of it, which is why this was once filed as unfixable without
   the Cal.com account settings. Both halves are asserted, because the prefill
   rewrites src and dropping the parameter there would reload the scheduler
   light the moment a visitor typed their name. */
test('the scheduler is pinned to the site palette, not the visitor preference', async ({ page }) => {
  await page.goto('/book.html');
  const src = await page.locator('#bkFrame').getAttribute('src');
  expect(src, 'the booker must use /embed, the endpoint that honours theme').toContain('/embed');
  expect(src, 'and must ask for dark explicitly').toContain('theme=dark');

  await page.fill('#bkName', 'Marion Webb');
  await page.dispatchEvent('#bkName', 'change');
  await page.waitForTimeout(600);
  const after = await page.locator('#bkFrame').getAttribute('src');
  expect(after, 'prefill must keep the endpoint').toContain('/embed');
  expect(after, 'prefill must keep the theme').toContain('theme=dark');
  expect(after, 'prefill must still prefill').toContain('name=Marion');
});

/* The booking page's prefill fields sit ABOVE the scheduler and read as
   optional, so the natural order is to pick a time and then fill them in.
   Rewriting frame.src at that point reloads Cal.com and silently destroys the
   chosen slot, on the one page whose entire job is to capture a booking. */
test('filling the prefill fields never reloads a scheduler you have already used', async ({ page }) => {
  await page.goto('/book.html');
  const frame = page.locator('#bkFrame');
  await expect(frame).toBeVisible();

  // Before any interaction, prefill is welcome to rewrite the src.
  await page.fill('#bkName', 'Marion Webb');
  await page.dispatchEvent('#bkName', 'change');
  await page.waitForTimeout(600);
  const afterName = await frame.getAttribute('src');
  expect(afterName, 'prefill should still work before the frame is touched').toContain('name=Marion');

  // Now the visitor picks a slot: focus moves into the cross-origin iframe.
  await page.evaluate(() => {
    document.getElementById('bkFrame').focus();
    window.dispatchEvent(new Event('blur'));
  });

  // Anything typed afterwards must not cost them that slot.
  await page.fill('#bkEmail', 'marion@example.ca');
  await page.dispatchEvent('#bkEmail', 'change');
  await page.waitForTimeout(600);
  expect(await frame.getAttribute('src'), 'the scheduler must not reload after it has been used')
    .toBe(afterName);
});

/* A calendar is a commitment, and before this the only alternatives on
   book.html were the phone and an email address. An owner unwilling to do
   either left no trace at all. */
test('the callback form captures a lead, and never strands the visitor when it cannot', async ({ page }) => {
  let posted = null;
  await page.route('**/api/interest', (r) => {
    posted = JSON.parse(r.request().postData() || '{}');
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/book.html');

  // Hidden until the script runs: the endpoint needs a cross-origin POST, so
  // without JS a form here would be a dead end while the phone number works.
  await expect(page.locator('#cbForm')).toBeVisible();

  // An empty submit must say what is wrong rather than silently doing nothing.
  await page.click('#cbSubmit');
  await expect(page.locator('#cbMsg')).toBeVisible();
  await expect(page.locator('#cbName')).toHaveAttribute('aria-invalid', 'true');

  await page.fill('#cbName', 'Ray Molina');
  await page.fill('#cbPhone', '(587) 555-0143');
  await page.fill('#cbEmail', 'ray@raysheating.ca');
  await page.click('#cbSubmit');

  await expect(page.locator('#cbMsg.ok')).toBeVisible();
  expect(posted.source, 'the lead must be attributable to this page').toContain('book-callback');
  expect(posted.phone, 'the number is the whole point of a callback').toBe('(587) 555-0143');
  expect(await page.inputValue('#cbName'), 'a submitted form should clear').toBe('');
});

test('a failed callback submission offers the number instead of a dead end', async ({ page }) => {
  await page.route('**/api/interest', (r) => r.abort());
  await page.goto('/book.html');
  await page.fill('#cbName', 'Ray');
  await page.fill('#cbPhone', '5875550143');
  await page.fill('#cbEmail', 'r@x.ca');
  await page.click('#cbSubmit');

  await expect(page.locator('#cbMsg.bad')).toContainText('(587) 413-0035');
  // Re-enabled, or they cannot try again.
  await expect(page.locator('#cbSubmit')).toBeEnabled();
  await expect(page.locator('#cbSubmit')).toHaveText('Ask Daren to call me');
});

/* booking_start fired on the outbound click and nothing fired afterwards, so a
   completed booking and a bounce were identical in the data. Cal.com stays a
   plain iframe: no third-party script on this origin, no page-weight cost. */
test('a completed Cal.com booking is measured, and only from Cal.com', async ({ page }) => {
  await page.goto('/book.html');
  const seen = await page.evaluate(() => {
    const got = [];
    const orig = window.nvTrack;
    window.nvTrack = (n) => { got.push(n); if (orig) orig(n); };
    const fire = (origin, data) => window.dispatchEvent(new MessageEvent('message', { origin, data }));

    /* The real envelope, captured from the live iframe on 2026-07-29. Note it
       arrives as an OBJECT, not a JSON string: an earlier version of this test
       only exercised the string path, which is the one that never happens. */
    const cal = (type, data = {}) => ({ originator: 'CAL', type, namespace: '', fullType: `CAL::${type}`, data });

    fire('https://evil.example.com', cal('bookingSuccessful'));
    const afterForged = got.length;

    // Ordinary chatter the iframe emits on load must not count as a booking.
    fire('https://cal.com', cal('navigatedToBooker'));
    fire('https://cal.com', cal('availabilityLoaded', { eventId: 6424219, eventSlug: 'nevamis-intro' }));
    const afterChatter = got.length;

    fire('https://cal.com', cal('bookingSuccessful', { uid: 'abc' }));
    fire('https://cal.com', cal('bookingSuccessful', { uid: 'abc' }));
    return { afterForged, afterChatter, booked: got.filter((n) => n === 'booking_completed').length };
  });
  expect(seen.afterForged, 'a forged origin must not be able to fake a booking').toBe(0);
  expect(seen.afterChatter, 'load-time messages are not bookings').toBe(0);
  expect(seen.booked, 'one booking, one event, however many messages arrive').toBe(1);
});
