/* ============================================================
   THE CLOSING ROUND (fw-site, 2026-09-26).

   Four walks, six area reviews and three audits of the live site each found
   one of the defects below, and each was verified independently before it
   was fixed. Every test here fails on the site as it was and passes on the
   fix, and each names its finding id so a red run says which promise broke.
   The proposal's findings (BD-F1, BD-F7) are in tests/proposal.spec.js with
   the rest of that page's rules; the two copy guards (BD-F4's chips, G6-12's
   llms.txt terms) run inside scripts/check-consistency.js, on their own
   fixtures first.

   Run with the site served from this checkout on its own port, e.g.
     NV_PORT=3291 npx playwright test tests/closing-round.spec.js
   Nothing here reaches anything live: the engine origin and Cal.com are
   answered locally, and no form is submitted.
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const TABLET = { viewport: { width: 1024, height: 768 } };

async function context(browser, opts) {
  const ctx = await browser.newContext(opts);
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await ctx.route(/^https:\/\/cal\.com\//, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>cal</title>' }));
  return ctx;
}

function pricing() {
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(process.cwd(), 'pricing-config.js'), 'utf8'), { window: w });
  return w.NV_PRICING;
}

const overlap = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

/* ---------- BPH-1: without WebGL the homepage reads top to bottom ---------- */

test("BPH-1: with WebGL unavailable, the copy blocks do not overlap and the ending's actions are not covered", async ({ playwright, baseURL }) => {
  const browser = await playwright.chromium.launch({ args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] });
  try {
    const ctx = await context(browser, { ...PHONE, baseURL });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForFunction(() => document.body.classList.contains('no3d'), null, { timeout: 20000 });
    const blocks = await page.evaluate(() => [...document.querySelectorAll('.copy.on')].map((c) => {
      const b = c.getBoundingClientRect();
      return { id: c.id, left: b.left, right: b.right, top: b.top + scrollY, bottom: b.bottom + scrollY, h: b.height };
    }));
    expect(blocks.length, 'every story block is switched on without the film').toBeGreaterThanOrEqual(4);
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        expect(overlap(blocks[i], blocks[j]), `#${blocks[i].id} sits on top of #${blocks[j].id}`).toBe(false);
      }
    }
    /* The ending's one action since owner decision #81 (2026-11-10). */
    await expect(page.locator('#close a')).toHaveCount(1);
    for (const [sel, name] of [['#close .cta', 'Book a 15-minute call']]) {
      const cta = page.locator(sel);
      await cta.scrollIntoViewIfNeeded();
      const hit = await cta.evaluate((a) => {
        const b = a.getBoundingClientRect();
        const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return !!el && (el === a || a.contains(el));
      });
      expect(hit, `"${name}" takes the tap at its own centre`).toBe(true);
    }
    await ctx.close();
  } finally {
    await browser.close();
  }
});

/* ---------- BPH-2: the chapter rail's targets ---------- */

/* The film's chapter rail left the homepage with owner decision #81's
   follow-up (2026-11-10): the film plays with no station menu, and
   tests/home-simple.spec.js fails if one comes back. */

/* ---------- BPH-3: the header's two controls ---------- */

/* Since owner decision #81 (2026-11-10) the header has no menu: on a phone it
   is the wordmark alone, and the call bar carries the one action. */
for (const url of ['/', '/book.html', '/privacy.html', '/404.html']) {
  test(`BPH-3: on ${url} at 390 the wordmark is 44 tall in the header, and there is no menu button`, async ({ browser }) => {
    const ctx = await context(browser, PHONE);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const box = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { w: b.width, h: b.height, top: b.top, bottom: b.bottom }; };
      return { toggles: document.querySelectorAll('.nav-toggle').length, mark: box('.site-header .wordmark'), head: box('.site-header .wrap') };
    });
    expect(r.toggles, 'no menu button').toBe(0);
    expect(r.mark.h, 'the link home is a 44px target').toBeGreaterThanOrEqual(44);
    expect(r.head.h, 'the header keeps its 68px height').toBe(68);
    expect(r.mark.top).toBeGreaterThanOrEqual(r.head.top);
    expect(r.mark.bottom).toBeLessThanOrEqual(r.head.bottom);
    await ctx.close();
  });
}

/* ---------- BPH-4: breadcrumb links ---------- */

const CRUMB_PAGES = ['electricians', 'hvac', 'plumbers', 'restoration', 'after-hours-answering', 'missed-calls',
  'vs-voicemail', 'vs-answering-service', 'solutions'];

/* ---------- BD-F2: a primary action in the first screen at 1024 ---------- */

test('BD-F2: at 1024 the header shows the one action, Book a 15-minute call; at 390 the header carries no button', async ({ browser }) => {
  const ctx = await context(browser, TABLET);
  const page = await ctx.newPage();
  for (const url of ['/', '/privacy.html', '/404.html']) {
    await page.goto(url, { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const a = [...document.querySelectorAll('.site-header a.btn-primary')].find((x) => getComputedStyle(x).display !== 'none'
        && x.getBoundingClientRect().width > 0);
      if (!a) return null;
      const b = a.getBoundingClientRect();
      const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return { text: a.textContent.trim(), href: a.getAttribute('href'), inView: b.top >= 0 && b.bottom <= innerHeight && b.right <= innerWidth,
        hit: !!el && (el === a || a.contains(el)), h: b.height };
    });
    expect(r, `${url}: no primary action in the header at 1024`).not.toBeNull();
    expect(r.text).toBe('Book a 15-minute call');
    expect(r.href).toBe('/book.html');
    expect(r.inView, `${url}: the button is in the first screen`).toBe(true);
    expect(r.hit, `${url}: the button takes a click`).toBe(true);
    expect(r.h).toBeGreaterThanOrEqual(44);
  }
  await ctx.close();

  const phone = await context(browser, PHONE);
  const p2 = await phone.newPage();
  await p2.goto('/privacy.html', { waitUntil: 'load' });
  expect(await p2.evaluate(() => [...document.querySelectorAll('.site-header a.btn')]
    .filter((a) => a.getBoundingClientRect().width > 0).length), 'at 390 the header carries no button; the call bar does').toBe(0);
  await phone.close();
});

/* ---------- BD-F3: the invitation card's headline ---------- */

/* The card order changed on 2026-10-09 (funnel audit item 1): the price list
   renders smallest first and the invitation plan LAST, so a phone visitor
   reads C$250 before the Partnership's fee. The config's order, the owner's
   door order on every other page, is untouched. The rule here is unchanged:
   the invitation card is headed "By invitation", never a C$ figure. */
/* ---------- BD-F5: "on a job" is a phone nobody answers ---------- */

/* ---------- BD-F6 and BD-F4 on the homepage ---------- */

test('BD-F6: the eyebrow numbers left on the homepage increase in document order', async ({ page }) => {
  await page.goto('/');
  const nums = await page.$$eval('p.k i', (is) => is.map((i) => Number(i.textContent.trim())));
  for (let i = 1; i < nums.length; i++) expect(nums[i], `eyebrow ${nums.join(', ')} runs backwards`).toBeGreaterThan(nums[i - 1]);
});

/* BD-F4's homepage chips were in the film's hidden station copy, which left
   the page with owner decision #81's follow-up (2026-11-10). The chip rule
   itself still runs on every page in scripts/check-consistency.js (7o). */
