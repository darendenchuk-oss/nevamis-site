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

  const cards = page.locator('#pricePreview .price-card');
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText('After Hours');
  await expect(cards.nth(0)).toContainText('C$249');
  await expect(cards.nth(1)).toContainText('Growth');
  await expect(cards.nth(1)).toContainText('C$449');
  await expect(cards.nth(1)).toContainText('MOST COMMON');
  await expect(cards.nth(2)).toContainText('from C$849');
  // annual + PAYG lines come from config, not hardcoded HTML
  await expect(cards.nth(1)).toContainText('two months free');
  await expect(page.locator('#paygLine')).toContainText('C$49');
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
  await expect(page.locator('#playLabel')).toHaveText('Hear this call');
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

test('footer, callbar and every section land without console errors', async ({ browser }) => {
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  watchErrors(page, errors);
  await page.goto(PLAIN);

  // all major sections exist
  for (const id of ['proof', 'simulator', 'how', 'solutions', 'industries', 'roi',
    'process', 'compare', 'build-stack', 'first-week', 'pricing-preview', 'risk', 'beyond', 'faq']) {
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
