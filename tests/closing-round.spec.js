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

test('BPH-1: with WebGL unavailable, the copy blocks do not overlap and the scan button is not covered', async ({ playwright, baseURL }) => {
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
    const cta = page.locator('#close .cta');
    await cta.scrollIntoViewIfNeeded();
    const hit = await cta.evaluate((a) => {
      const b = a.getBoundingClientRect();
      const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return !!el && (el === a || a.contains(el));
    });
    expect(hit, '"Scan my business" takes the tap at its own centre').toBe(true);
    await ctx.close();
  } finally {
    await browser.close();
  }
});

/* ---------- BPH-2: the chapter rail's targets ---------- */

test('BPH-2: at 390 every chapter-rail button is at least 44x44, none overlap, and the rail clears the header', async ({ browser }) => {
  const ctx = await context(browser, PHONE);
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.classList.contains('nv-live'), null, { timeout: 30000 });
  const r = await page.evaluate(() => ({
    head: document.querySelector('.site-header').getBoundingClientRect().bottom,
    btns: [...document.querySelectorAll('#paneNav button')].map((b) => {
      const x = b.getBoundingClientRect();
      return { t: b.textContent.trim().slice(0, 12), left: x.left, right: x.right, top: x.top, bottom: x.bottom, w: x.width, h: x.height };
    }),
  }));
  expect(r.btns.length).toBe(6);
  r.btns.forEach((b, i) => {
    expect(b.w, `"${b.t}" is ${b.w}px wide`).toBeGreaterThanOrEqual(44);
    expect(b.h, `"${b.t}" is ${b.h}px tall`).toBeGreaterThanOrEqual(44);
    expect(b.left, `"${b.t}" runs off the left edge`).toBeGreaterThanOrEqual(0);
    expect(b.right, `"${b.t}" runs off the right edge`).toBeLessThanOrEqual(390);
    expect(b.top, `"${b.t}" sits under the header`).toBeGreaterThanOrEqual(r.head - 0.5);
    for (let j = i + 1; j < r.btns.length; j++) expect(overlap(b, r.btns[j]), `"${b.t}" overlaps "${r.btns[j].t}"`).toBe(false);
  });
  await ctx.close();
});

/* ---------- BPH-3: the header's two controls ---------- */

for (const url of ['/', '/pricing.html', '/book.html', '/404.html']) {
  test(`BPH-3: on ${url} at 390 the menu button is 44x44 and the wordmark 44 tall, in the same header`, async ({ browser }) => {
    const ctx = await context(browser, PHONE);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const box = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return { w: b.width, h: b.height, top: b.top, bottom: b.bottom }; };
      return { toggle: box('.site-header .nav-toggle'), mark: box('.site-header .wordmark'), head: box('.site-header .wrap') };
    });
    expect(r.toggle.w).toBeGreaterThanOrEqual(44);
    expect(r.toggle.h).toBeGreaterThanOrEqual(44);
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

test('BPH-4: on all nine breadcrumb pages at 390, each crumb link is at least 24 tall, none overlap, and the row does not grow', async ({ browser }) => {
  const ctx = await context(browser, PHONE);
  const page = await ctx.newPage();
  for (const p of CRUMB_PAGES) {
    await page.goto(`/${p}.html`, { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const row = document.querySelector('.crumb');
      if (!row) return null;
      const lh = parseFloat(getComputedStyle(row).lineHeight) || 18;
      return {
        rowH: row.getBoundingClientRect().height, lh,
        links: [...row.querySelectorAll('a')].map((a) => {
          const b = a.getBoundingClientRect();
          return { t: a.textContent.trim(), left: b.left, right: b.right, top: b.top, bottom: b.bottom, h: b.height };
        }),
      };
    });
    expect(r, `${p}: no breadcrumb`).not.toBeNull();
    expect(r.links.length, `${p}: the crumb has its links`).toBeGreaterThanOrEqual(1);
    for (const [i, l] of r.links.entries()) {
      expect(l.h, `${p}: "${l.t}" is ${l.h}px tall`).toBeGreaterThanOrEqual(24);
      for (const m of r.links.slice(i + 1)) expect(overlap(l, m), `${p}: "${l.t}" overlaps "${m.t}"`).toBe(false);
    }
    /* The padding is given back by a negative margin, so the row is still
       one line of 11px type and nothing under it has moved. */
    expect(r.rowH, `${p}: the crumb row grew to ${r.rowH}px`).toBeLessThanOrEqual(r.lh + 1);
  }
  await ctx.close();
});

/* ---------- BD-F2: a primary action in the first screen at 1024 ---------- */

test('BD-F2: at 1024 about, pricing and a trade page show a primary "Book a call" in the header; at 390 the header is unchanged', async ({ browser }) => {
  const ctx = await context(browser, TABLET);
  const page = await ctx.newPage();
  for (const url of ['/about.html', '/pricing.html', '/electricians.html']) {
    await page.goto(url, { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const a = [...document.querySelectorAll('.site-header a.btn-primary')].find((x) => getComputedStyle(x).display !== 'none'
        && x.getBoundingClientRect().width > 0);
      if (!a) return null;
      const b = a.getBoundingClientRect();
      const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      const t = document.querySelector('.site-header .nav-toggle').getBoundingClientRect();
      return { text: a.textContent.trim(), href: a.getAttribute('href'), inView: b.top >= 0 && b.bottom <= innerHeight && b.right <= innerWidth,
        hit: !!el && (el === a || a.contains(el)), rightOfToggle: b.left >= t.right, toggleShown: t.width > 0, h: b.height };
    });
    expect(r, `${url}: no primary action in the header at 1024`).not.toBeNull();
    expect(r.text).toMatch(/Book a call/);
    expect(r.inView, `${url}: the button is in the first screen`).toBe(true);
    expect(r.hit, `${url}: the button takes a click`).toBe(true);
    expect(r.toggleShown, `${url}: the menu button is still there`).toBe(true);
    expect(r.rightOfToggle, `${url}: the button sits before the menu button`).toBe(false);
    expect(r.h).toBeGreaterThanOrEqual(44);
  }
  /* The menu still opens to the whole list, the button included. */
  await page.locator('.site-header .nav-toggle').click();
  await expect(page.locator('.main-nav.open a[href="/about.html"]')).toBeVisible();
  await expect(page.locator('.main-nav.open a.btn-primary')).toBeVisible();
  await ctx.close();

  const phone = await context(browser, PHONE);
  const p2 = await phone.newPage();
  await p2.goto('/about.html', { waitUntil: 'load' });
  expect(await p2.evaluate(() => [...document.querySelectorAll('.site-header a.btn')]
    .filter((a) => a.getBoundingClientRect().width > 0).length), 'at 390 the header carries no button; the call bar does').toBe(0);
  await phone.close();
});

/* ---------- BD-F3: the invitation card's headline ---------- */

test('BD-F3: the first pricing card is headed "By invitation", not a C$ figure, and the card order is unchanged', async ({ page }) => {
  const P = pricing();
  await page.goto('/pricing.html');
  await page.waitForSelector('#plans .plan');
  const names = await page.$$eval('#plans .plan h3', (hs) => hs.map((h) => h.textContent.trim()));
  expect(names, 'the card order is the config order (an owner decision)').toEqual(P.plans.map((p) => p.name));
  const first = P.plans[0];
  expect(first.selfServe, 'the first card is the invitation plan this rule is about').toBe(false);
  const biggest = await page.locator('#plans .plan').first().evaluate((card) => {
    let best = null;
    for (const el of card.querySelectorAll('*')) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!own) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (!best || size > best.size) best = { size, text: own };
    }
    return best;
  });
  expect(biggest.text, 'the largest type on the card').toBe('By invitation');
  expect(biggest.text).not.toMatch(/C\$/);
  const t = (await page.locator('#plans .plan').first().innerText()).replace(/\s+/g, ' ');
  const cash = (n) => 'C$' + n.toLocaleString('en-CA');
  expect(t, 'the band is still on the card').toContain(cash(first.monthlyRange[0]) + ' to ' + cash(first.monthlyRange[1]));
  /* The buyable plans keep their monthly as the headline. */
  for (const [i, pl] of P.plans.entries()) {
    if (pl.selfServe === false) continue;
    await expect(page.locator('#plans .plan').nth(i).locator('.price')).toContainText(cash(pl.monthly));
  }
});

/* ---------- BD-F5: "on a job" is a phone nobody answers ---------- */

test('BD-F5: ticking only "People ring while I am on a job" recommends the AI Front Desk', async ({ page }) => {
  const P = pricing();
  const desk = P.plans.find((p) => p.id === 'pro');
  await page.goto('/pricing.html');
  await page.locator('#leaks button', { hasText: 'People ring while I am on a job' }).click();
  const out = page.locator('#chooserResult');
  await expect(out).toContainText(desk.name);
  await expect(out).not.toContainText('Missed-Call Recovery');
  expect(await out.locator('a.btn-primary').getAttribute('href')).toBe('https://app.nevamis.ca/signup?plan=pro');
});

/* ---------- BD-F6 and BD-F4 on the homepage ---------- */

test('BD-F6: the eyebrow numbers left on the homepage increase in document order', async ({ page }) => {
  await page.goto('/');
  const nums = await page.$$eval('p.k i', (is) => is.filter((i) => !i.closest('#paneNav')).map((i) => Number(i.textContent.trim())));
  for (let i = 1; i < nums.length; i++) expect(nums[i], `eyebrow ${nums.join(', ')} runs backwards`).toBeGreaterThan(nums[i - 1]);
});

test('BD-F4: the Review Engine carries "Available today", and the Brief and the Inbox Assistant carry their roadmap status', async ({ page }) => {
  await page.goto('/');
  const chip = (name) => page.locator('#doc .svc h4', { hasText: name }).locator('.chip');
  await expect(chip('Review Engine')).toHaveText('Available today');
  await expect(chip('Your Daily Business Brief')).toHaveText('Planned');
  await expect(chip('Inbox Assistant')).toHaveText('Being researched');
  await page.goto('/revenue-engine.html');
  await expect(page.locator('.card', { hasText: 'Inbox Assistant' }).locator('.chip')).toHaveText('Being researched');
});
