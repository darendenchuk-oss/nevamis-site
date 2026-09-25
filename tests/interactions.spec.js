/* ============================================================
   NEVAMIS INTERACTION PROOF
   The components a visitor can work must actually work: the
   homepage plans strip, ROI calculator, FAQ, funnel events and
   post-call prompt; the tap rings on the pages that load the
   motion layer; and the booking page's scheduler and callback
   form.
   ============================================================ */

/* REPOINTED AT THE PAGES THAT SHIP (2026-09-25, FP3).

   This file was written for the pre-film homepage and half of it still
   drove that page. Two tests waited on window.__heroTL, the timeline of a
   hero the film homepage does not have, so they timed out at 90 seconds on
   every run; eight more looked for components that have left the published
   site. On the day this was repointed, 10 of its 20 tests failed on main,
   and a file that is always red hides the next real break the same way a
   file that is never run does. Each case is now in one of two states:

   REPOINTED at the page that really carries the behaviour:
     - the plans preview    -> the homepage's #plansStrip, which site.js
                               renders from NV_PRICING (was #pricePreview)
     - the tap sonar        -> a secondary page; the pooled rings ARE the
                               ready signal (was a wait on __heroTL)
     - sections and callbar -> the film homepage's own sections, read from
                               scripts/film/sections.html, and its callbar
                               rule (hidden while the film owns the screen)

   DELETED, because nothing on the published site carries them. Each one
   comes back with its component, from this file's history:
     - the six-stage simulator and its empty-state hint (#sim): not on the
       film homepage or any other page
     - the coverage tabs (.modes, #panelOver): not on any page
     - the capability rail marquee (.rail-track): motion.js builds it from
       .trust-strip, and no page has a .trust-strip element
     - the aurora (#aurora): deleted 2026-09-20, see assets/motion/main.js
     - the inline homepage scheduler (#inlineBook): the scheduler lives on
       /book.html, and the tests at the bottom of this file cover it there
     - the motion toggle freezing the hero: the <button class="motion-toggle-btn">
       was part of the pre-film hero and no page renders one now. site.js and
       main.js still wire it if it exists; the test comes back with the button */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('artifacts/motion-proof');
const PLAIN = '/home.html';
/* A secondary page that loads the motion layer (assets/motion/main.js), which
   the film homepage deliberately does not. pricing.html is the page a buyer
   is most likely to reach, so it is the one worth proving. */
const MOTION_PAGE = '/pricing.html';

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

/* site.js beacons page_view to the PRODUCTION engine; see tests/pages.spec.js.
   A local test run must never write a visit into the live event log. Every
   context a test opens for itself (a phone, reduced motion) gets the same
   stub, because a route belongs to the context it was set on. */
const stubEngine = (ctx) => ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
test.beforeEach(async ({ context }) => { await stubEngine(context); });

function watchErrors(page, sink) {
  page.on('console', (m) => { if (m.type() === 'error') sink.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => sink.push(`pageerror: ${e.message}`));
}

test('the homepage plans strip renders every plan from the single source of truth', async ({ page }) => {
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
     first time the answer legitimately changes.

     REPOINTED 2026-09-25 (FP3): the cards it read, #pricePreview .price-card,
     left with the pre-film homepage. The film homepage prices its plans in
     #plansStrip, rendered by site.js from the same NV_PRICING, so that is
     where the same rules are proved now. */
  const cfg = await page.evaluate(() => {
    const P = window.NV_PRICING;
    /* Every figure the config charges anywhere: a plan's, an add-on's, or the
       Enterprise floor. A number on the retired list below that the config
       charges again today is not retired, and sweeping for it would fail the
       correct page (C$750 was a retired monthly and is an add-on launch fee
       now). */
    const charged = new Set();
    for (const x of [...P.plans, ...(P.addOns || [])]) {
      for (const k of ['monthly', 'launch']) if (x[k]) charged.add(Number(x[k]));
    }
    if (P.enterprise && P.enterprise.launchFrom) charged.add(Number(P.enterprise.launchFrom));
    return {
      plans: P.plans.map((p) => ({
        name: p.name, monthly: p.monthly, launch: p.launch,
        recommended: !!p.recommended, selfServe: p.selfServe !== false,
      })),
      recommendedLabel: P.recommendedLabel,
      annualActive: !!(P.annual && P.annual.active),
      charged: [...charged],
      /* 150 and 850 joined the list on 2026-08-09 with the paid pilot and the
         old Pro price. The list only ever grows: every entry is a number a
         real page published, and the reason C$249, C$449 and C$849 lingered is
         that the sweep once checked C$49 alone. */
      retired: [49, 150, 197, 249, 397, 449, 450, 499, 750, 797, 849, 850, 1800],
    };
  });

  const cards = page.locator('#plansStrip .plan-row .card');
  await expect(cards).toHaveCount(cfg.plans.length);

  const grp = (n) => Number(n).toLocaleString('en-CA');
  const figures = (s) => [...s.matchAll(/C\$([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));
  for (const [i, plan] of cfg.plans.entries()) {
    const card = cards.nth(i);
    await expect(card).toContainText(plan.name);
    const text = await card.innerText();
    if (!plan.selfServe) {
      /* A plan offered by invitation is never shown as a price: a figure
         beside it reads as something a visitor can buy. */
      await expect(card, `${plan.name} is by invitation`).toContainText(/by invitation/i);
      expect(figures(text), `${plan.name} is by invitation and must carry no price`).toEqual([]);
      continue;
    }
    /* Its own two figures, and nothing else. This pair of assertions was
       inverted twice while the model changed underneath it (monthly alone,
       then setup plus monthly, then one price). What survived every version
       is the rule: the card states what this plan charges and puts no other
       figure beside it for a reader to add up. */
    await expect(card, `${plan.name} must state its monthly price`).toContainText(`C$${grp(plan.monthly)} a month`);
    await expect(card, `${plan.name} must state its launch fee`).toContainText(`C$${grp(plan.launch)}`);
    expect(figures(text).filter((n) => n !== plan.monthly && n !== plan.launch),
      `${plan.name} carries a figure the config does not charge for it`).toEqual([]);
  }

  /* The badge used to say "MOST COMMON", a statistic about a client base that
     does not exist. Asserting the CONFIGURED label proves the badge renders
     from the single source of truth without insisting on any claim, and the
     card is found by the FLAG, not by a plan name that can be renamed. */
  expect(cfg.recommendedLabel, 'pricing-config must define recommendedLabel').toBeTruthy();
  const recIndex = cfg.plans.findIndex((p) => p.recommended);
  expect(recIndex, 'a plan must be marked recommended').toBeGreaterThanOrEqual(0);
  await expect(cards.nth(recIndex)).toContainText(cfg.recommendedLabel);

  /* Annual prepay is suspended. Advertising "two months free" against a yearly
     figure nobody approved is inventing a price. */
  if (!cfg.annualActive) {
    await expect(page.locator('#plansStrip')).not.toContainText('two months free');
  }

  /* Every retired price, in one sweep over the whole page. */
  const body = await page.locator('body').innerText();
  for (const n of cfg.retired.filter((x) => !cfg.charged.includes(x))) {
    expect(body, `retired price C$${n} must not appear on the homepage`)
      .not.toMatch(new RegExp(`C\\$${grp(n)}(?!,?\\d)`));
  }
  await expect(page.locator('body')).not.toContainText('Pay As You Go');
  expect(errors, errors.join('\n')).toEqual([]);
});

/* THE CALL PLAYER IS GONE, AND THIS TEST NO LONGER PRETENDS OTHERWISE.
   2026-09-19, owner decision B1(b).

   What it used to do: press #playBtn on /home.html, then force-fire
   nv:callline and nv:callend to light [data-callchip] and reveal
   .summary-arrive. Every one of those hooks has left the published site. The
   film homepage has carried no player since it shipped, so the test had been
   failing on live main for weeks against a page that never had the control;
   the chips and the arriving summary card survive only in
   scripts/film/chrome-source.html, which nothing renders; and B1(b) removed
   the play control, the waveform and the timer from demo.html, because the
   recording offers a slot and then confirms it, which the front desk cannot
   do. Driving a control that does not exist is not coverage, and a red test
   nobody can make green is worse than no test: it hides the next real break.

   What is kept, because it still applies: the demo transcript is the corrected
   call and reads as one, and no half-wired remnant of the player is left on
   either page. A button labelled with a duration that plays nothing would be a
   worse defect than the one B1(b) fixed, and site.js still contains the player,
   guarded by `if (playBtn && card)`.

   WHAT BRINGS THE OLD ASSERTIONS BACK: B1(a), the re-recording, in the
   approved voice with the approved greeting and a script that takes the time
   the caller wants instead of confirming one. When demo.html gets #playBtn,
   data-audio lines and the chips back, restore the block from this file's
   history (it was the body of this test) and point it at /demo.html rather
   than at the homepage. */
test('the demo transcript is the corrected call, with no half-wired player left behind', async ({ page }) => {
  await page.goto('/demo.html');
  const card = page.locator('#callCard');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();

  // the eleven turns are all there and readable, audio or no audio
  await expect(card.locator('.line')).toHaveCount(11);
  await expect(card.locator('.line p').first()).toBeVisible();

  /* The correction itself: the agent takes the time the caller asked for and
     hands the confirmation to the office. The two retired lines are asserted
     against by name, because they are what the deleted recording said. */
  await expect(card).toContainText('someone from the office will confirm');
  await expect(card).not.toContainText(/you'?re booked/i);
  await expect(card).not.toContainText(/we'?ll see you tomorrow/i);

  /* Nothing left that invites a press. Each of these is a piece of the player:
     the button, its label, the waveform, the timer, the per-line audio the
     player reads, and the highlight it paints. */
  for (const url of ['/demo.html', PLAIN]) {
    await page.goto(url);
    for (const sel of ['#playBtn', '#playLabel', '#callWave', '#callTimer', '[data-audio]', '.line.speaking']) {
      await expect(page.locator(sel), `${url} still carries ${sel} from the retired call player`).toHaveCount(0);
    }
  }

  await page.goto('/demo.html');
  await card.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, 'section-call-proof.png') });
});

test('the ROI calculator computes and shows break-even with a quote', async ({ page }) => {
  await page.goto(PLAIN);
  await page.locator('#roiMissed').scrollIntoViewIfNeeded();

  // defaults: 10 × 4.33 × .6 × 400 × .5 = 5196
  await expect(page.locator('#roiOpp')).toHaveText('$5,196');
  await expect(page.locator('#roiRec')).toHaveText('$2,598');

  /* The default is PREFILLED FROM pricing-config.js by site.js, so assert it
     against the config rather than against a literal. The markup carried
     value="449" - a price retired 2026-08-06 - into production, and this test
     could not have noticed, because it opened by TYPING 449 into the field.
     A suite that types a retired figure onto the page it is guarding poisons
     any page-wide scan for that figure, so the typed value is now 675: a
     number this business has never charged, which is the point of it. */
  const growth = await page.evaluate(() =>
    (window.NV_PRICING.plans.find((p) => p.recommended) || window.NV_PRICING.plans[0]).monthly);
  await expect(page.locator('#roiQuote')).toHaveValue(String(growth));
  const recName = await page.evaluate(() =>
    (window.NV_PRICING.plans.find((p) => p.recommended) || window.NV_PRICING.plans[0]).name);
  await expect(page.locator('#roiQuotePlan')).toHaveText(recName);

  await page.locator('#roiQuote').fill('675');
  await expect(page.locator('#roiBeRow')).toBeVisible();
  await expect(page.locator('#roiBe')).toContainText('won jobs per month');
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

/* REPOINTED 2026-09-25 (FP3): it waited on window.__heroTL on the film
   homepage, which never loads the motion layer, so it timed out on every
   run. The rings are installed by assets/motion/sonar.js on the pages that
   load main.js, and the pool of eight is itself the ready signal. */
test('every tap emits a sonar ring, except under reduced motion', async ({ page, browser }) => {
  await page.goto(MOTION_PAGE);
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
  await stubEngine(ctx);
  const p2 = await ctx.newPage();
  await p2.goto(MOTION_PAGE, { waitUntil: 'load' });
  /* Absence needs a moment to mean anything: give main.js the time it takes
     to install the pool on the page above before counting none. */
  await p2.waitForTimeout(800);
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

test('footer, callbar and every section land without console errors', async ({ browser }) => {
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await stubEngine(ctx);
  const page = await ctx.newPage();
  watchErrors(page, errors);
  await page.goto(PLAIN);

  /* Every section the composer puts below the film, read from its source
     rather than typed here. The list this replaced (2026-09-25, FP3) named
     fourteen sections of the pre-film homepage, and twelve of them had been
     gone for weeks: a hand-kept list of what a page contains is stale the
     first time the page changes. The film's own #doc and the <main> that
     scripts/film/compose.py wraps around it are the two it adds itself. */
  const src = fs.readFileSync(new URL('../scripts/film/sections.html', import.meta.url), 'utf8');
  const ids = [...src.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map((m) => m[1]);
  expect(ids.length, 'scripts/film/sections.html should define the sections below the film').toBeGreaterThan(4);
  for (const id of [...ids, 'doc', 'main']) {
    await expect(page.locator('#' + id), `#${id} is authored but not on the homepage`).toHaveCount(1);
  }

  /* The phone call bar: hidden while the film owns the screen, by design
     (scripts/film/compose.py, "html:not(.nv-below) .callbar"), and there to
     tap once the visitor is into the page below it. */
  await expect(page.locator('.callbar')).toBeHidden();
  await page.locator('#faq').scrollIntoViewIfNeeded();
  await expect(page.locator('.callbar')).toBeVisible();
  await expect(page.locator('.callbar')).toHaveAttribute('href', /\/book\.html/);

  // mobile menu opens
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('.nav-toggle').click();
  await expect(page.locator('.main-nav')).toHaveClass(/open/);
  await expect(page.locator('.main-nav a', { hasText: 'Pricing' })).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'section-footer-mobile.png') });
  expect(errors, errors.join('\n')).toEqual([]);
  await ctx.close();
});

/* Cal.com's /embed route must never be used here, and this is the scar tissue.

   The booker follows the VISITOR's prefers-color-scheme, so a light-mode
   visitor sees a white scheduler inside this black page. /embed?theme=dark
   fixes that — it really does, measured both ways — and it was shipped, and it
   took the scheduler off the page entirely.

   /embed is built to be driven by Cal's embed SDK. It renders itself
   visibility:hidden, opacity:0 and waits for the parent frame to talk to it.
   This page loads no SDK by design, so nothing ever answered. Measured inside
   a real iframe:

     booking url          body visible, opacity 1, 900px tall
     /embed?theme=dark    body HIDDEN,  opacity 0, 569px tall

   It looked correct when opened directly in a tab, which is how it passed
   review. Directly is not how it is used.

   A white scheduler is a blemish. An invisible one is a lost booking, so the
   theme problem stays open (registry B1-THEME) rather than being traded for
   this. */
test('the scheduler is never pointed at the SDK-only /embed endpoint', async ({ page }) => {
  await page.goto('/book.html');
  const src = await page.locator('#bkFrame').getAttribute('src');
  expect(src, 'the booker must load a real booking page').toContain('cal.com/daren-qvlah4/nevamis-intro');
  expect(src, '/embed stays hidden without the embed SDK this page does not load')
    .not.toContain('/embed');

  await page.fill('#bkName', 'Marion Webb');
  await page.dispatchEvent('#bkName', 'change');
  await page.waitForTimeout(600);
  const after = await page.locator('#bkFrame').getAttribute('src');
  expect(after, 'prefill must not switch endpoints either').not.toContain('/embed');
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
  await page.fill('#cbEmail', 'ray@example.ca');
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
