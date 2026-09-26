/* ============================================================
   WHAT A BUYER SEES IS TRUE, AND A THUMB CAN WORK IT (w5-site-truth).

   The final verification round of 2026-09-25 walked the live site in real
   browsers and found each defect below. Each test here fails on the site as
   it was and passes on the fix, and each names its finding id so a red run
   says which promise broke. Copy is asserted as a RULE (never a flat
   Partnership price, never a CRM connection outside Enterprise) except where
   the wording IS the rule: the agent's approved greeting is canonical.ts's
   approvedGreeting, verbatim.

   Run with the site served from this checkout on its own port, e.g.
     NV_PORT=3287 npx playwright test tests/site-truth.spec.js
   Nothing here reaches anything live: the engine origin and Cal.com are
   answered locally, and no form is submitted.
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

async function phone(browser, extra = {}) {
  const ctx = await browser.newContext({ ...PHONE, ...extra });
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await ctx.route(/^https:\/\/cal\.com\//, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>cal</title>' }));
  return ctx;
}

/* Text of a served page as a reader gets it: tags out, entities for the
   characters these rules care about decoded, whitespace collapsed. */
function textOf(file) {
  return fs.readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&rsquo;|&#8217;/g, '’').replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
}
/* The sentence around an index, so a rule can ask what the sentence says. */
function sentenceAt(text, i) {
  const start = text.lastIndexOf('. ', i) + 1;
  const end = text.indexOf('. ', i);
  return text.slice(start, end < 0 ? text.length : end);
}

/* ---------- BD-4: the Partnership is a band, never a flat price ---------- */

/* "C$2,500 Launch & Implementation to start, then C$350 a month" with no
   "from" in front of it is the flat price the card printed. */
const FLAT = /(?<!from )C\$2,500 Launch (?:&|and) Implementation to start, then C\$350 a month(?! by default)/i;

test('BD-4: the rendered Partnership card says "from C$2,500" and its monthly band, never a flat price', async ({ page }) => {
  await page.goto('/pricing.html');
  const card = page.locator('#plans .plan').first();
  await expect(card.locator('h3')).toHaveText(/Performance Partnership/);
  const t = (await card.innerText()).replace(/\s+/g, ' ');
  expect(t, 'the Launch & Implementation fee is a floor').toMatch(/from C\$2,500 Launch & Implementation/i);
  expect(t, 'the monthly band is on the card').toContain('C$250 to C$500');
  expect(t).not.toMatch(FLAT);
});

test('BD-4: no surface a crawler or an answer engine reads states the Partnership flat', () => {
  for (const f of ['pricing.html', 'index.html', 'home.html', 'llms.txt']) {
    const raw = fs.readFileSync(f, 'utf8').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
    expect(raw, `${f} states the Partnership as a flat price`).not.toMatch(FLAT);
  }
  const ld = fs.readFileSync('index.html', 'utf8').replace(/&amp;/g, '&');
  expect(ld, 'the homepage structured data carries the band').toMatch(/From C\$2,500 Launch & Implementation to start, then C\$350 a month by default, inside a monthly band of C\$250 to C\$500/);
});

/* The proposal is the one page that sets the fee and the monthly on separate
   lines, so it builds a banded plan from NV_PRICING.launchPart/monthlyBand
   rather than startLine. Rendered, for every banded plan in the config, the
   way a named prospect reads it. */
test('BD-4: the proposal for a banded plan states the fee as a floor and the monthly band, never flat', async ({ page }) => {
  await page.goto('/pricing.html');
  const banded = await page.evaluate(() => window.NV_PRICING.plans
    .filter((p) => Array.isArray(p.monthlyRange) || Array.isArray(p.launchRange))
    .map((p) => ({ id: p.id, name: p.name, launchRange: p.launchRange, monthlyRange: p.monthlyRange,
      launch: p.launch, monthly: p.monthly })));
  expect(banded.length, 'no banded plan in pricing-config.js, so this rule checks nothing').toBeGreaterThan(0);
  const money = (n) => 'C$' + Number(n).toLocaleString('en-CA');
  for (const pl of banded) {
    await page.goto('/proposal.html?plan=' + encodeURIComponent(pl.id));
    await expect(page.locator('#planName')).toHaveText(pl.name.toUpperCase());
    const monthly = (await page.locator('#planMonthly').innerText()).replace(/\s+/g, ' ');
    const terms = (await page.locator('#planTerms').innerText()).replace(/\s+/g, ' ');
    if (pl.monthlyRange) {
      expect(monthly, `${pl.id}: the monthly is the default inside its band`)
        .toContain(money(pl.monthly) + '/month by default, inside a monthly band of '
          + money(pl.monthlyRange[0]) + ' to ' + money(pl.monthlyRange[1]));
    }
    if (pl.launchRange) {
      expect(terms, `${pl.id}: the Launch & Implementation fee is a floor`)
        .toContain('One-time from ' + money(pl.launch) + ' Launch & Implementation to start.');
    }
  }
});

/* ---------- BD-1: nothing connects to a CRM outside Enterprise ---------- */

test('BD-1: privacy and terms never say Nevamis connects your CRM or your own tools outside an Enterprise clause', () => {
  const CONNECT = /connect(?:s|ing|ed)?[^.]{0,60}(?:CRM|your own tools)/gi;
  for (const f of ['privacy.html', 'terms.html']) {
    const text = textOf(f);
    for (const m of text.matchAll(CONNECT)) {
      expect(sentenceAt(text, m.index), `${f}: "${m[0]}"`).toMatch(/Enterprise/);
    }
  }
  const terms = textOf('terms.html');
  for (const m of terms.matchAll(/\bintegrations?\b/gi)) {
    expect(sentenceAt(terms, m.index), 'terms.html: integrations are only ever an Enterprise agreement\'s').toMatch(/Enterprise/);
  }
});

/* ---------- BD-11: the product's sold name ---------- */

test('BD-11: the privacy page names Missed-Call Recovery, not a retired name', () => {
  const t = textOf('privacy.html');
  expect(t).not.toMatch(/Instant Lead Follow-Up/i);
  expect(t).toContain('For Missed-Call Recovery and the Review Engine');
});

/* ---------- BD-2: the example greeting is the approved one ---------- */

test('BD-2: the demo transcript opens with the approved greeting and names no persona', () => {
  const t = textOf('demo.html');
  /* canonical.ts approvedGreeting with {business} = Cedarview Electric. */
  expect(t).toContain("Hi, you've reached Cedarview Electric. This call may be recorded to help us handle your requests and improve services. How can we help you?");
  expect(t).not.toMatch(/\bAva\b/);
  expect(t).not.toMatch(/\bThis is [A-Z][a-z]+\b/);
});

/* ---------- BD-7: the book page promises what the scheduler offers ---------- */

test('BD-7: the book page promises video, points phone callers to the callback, and drops "optional prefill"', () => {
  const t = textOf('book.html');
  expect(t).not.toMatch(/video or phone/i);
  expect(t).not.toMatch(/whichever you prefer/i);
  const placeholders = [...fs.readFileSync('book.html', 'utf8').matchAll(/placeholder="([^"]*)"/g)].map((m) => m[1]);
  expect(placeholders.length).toBeGreaterThan(0);
  for (const p of placeholders) expect(p, 'a placeholder is what goes in the field, not a note about it').not.toMatch(/optional|prefill/i);
  expect(t).toMatch(/Prefer the phone\?/);
});

/* ---------- BD-9: the roadmap's true status ---------- */

test('BD-9: the roadmap lists the Review Engine as available, and the Revenue Engine carries one status', async ({ page }) => {
  await page.goto('/coming-soon.html');
  const now = page.locator('#gridNow .svc', { has: page.locator('h3', { hasText: /^Review Engine$/ }) });
  await expect(now).toHaveCount(1);
  await expect(now.locator('.status')).toHaveText('AVAILABLE NOW');
  const re = page.locator('.svc', { has: page.locator('h3', { hasText: /^Revenue Engine$/ }) });
  await expect(re).toHaveCount(1);
  /* Every status the page gives the Revenue Engine: its card chip, its
     journey button and the scenario's link. One string, in any case. */
  const said = [
    await re.locator('.status').innerText(),
    (await page.locator('.j-mod[data-mod="revenue"]').innerText()).match(/\(([^)]+)\)/)[1],
    await page.locator('.scenario a[href="/revenue-engine.html"]').innerText(),
  ].map((s) => s.trim().toLowerCase());
  expect(new Set(said), `the Revenue Engine is labelled ${said.join(' / ')}`).toEqual(new Set(['in development']));
  const body = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  expect(body).not.toMatch(/\bpilot\b/i);
});

/* ---------- BP1: the homepage header turns solid ---------- */

test('BP1: on a phone the homepage header is solid once the page has scrolled', async ({ browser }) => {
  const ctx = await phone(browser);
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.evaluate((y) => window.scrollTo(0, y), Math.min(12000, H - 900));
  await page.waitForTimeout(900);
  const h = await page.evaluate(() => {
    const el = document.querySelector('.site-header');
    return { cls: el.className, bg: getComputedStyle(el).backgroundColor };
  });
  expect(h.cls).toMatch(/\bscrolled\b/);
  const alpha = Number((h.bg.match(/rgba?\(([^)]+)\)/)[1].split(',')[3] ?? '1'));
  expect(alpha, `header background ${h.bg}`).toBeGreaterThan(0.9);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.querySelector('.site-header').className)).not.toMatch(/\bscrolled\b/);
  await ctx.close();
});

/* ---------- BP2: the chooser's coverage lines ---------- */

test('BP2: each "Your coverage" line reads as one line, and each price appears once', async ({ browser }) => {
  const ctx = await phone(browser);
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  const leaks = page.locator('#leaks button');
  const read = () => page.evaluate(() => {
    const out = document.querySelector('.chooser-out');
    const lis = [...out.querySelectorAll('.node-list li')].map((li) => {
      const kids = [...li.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
      const strong = li.querySelector('strong');
      const lh = strong ? parseFloat(getComputedStyle(strong).lineHeight) || 24 : 0;
      return { kids: kids.length, text: li.textContent.trim(), name: strong ? strong.textContent : null,
        strongW: strong ? strong.getBoundingClientRect().width : null,
        strongLines: strong ? Math.round(strong.getBoundingClientRect().height / lh) : null };
    });
    return { lis, text: out.textContent.replace(/\s+/g, ' ') };
  });
  const check = (r) => {
    for (const li of r.lis) {
      expect(li.kids, `"${li.text}" is one text box`).toBe(1);
      expect(li.text[0], `"${li.text}" starts with a comma`).not.toBe(',');
      if (li.strongW === null) continue;
      /* The defect was the name squeezed into a 37px column three lines
         tall. A name sits on one line, and a long one is not narrow. */
      expect(li.strongLines, `the name in "${li.text}" wraps into a column`).toBeLessThanOrEqual(1);
      if (li.name.length >= 12) expect(li.strongW, `the name in "${li.text}" is a squeezed column`).toBeGreaterThan(80);
    }
    const prices = r.text.match(/C\$[\d,]+ Launch & Implementation to start, then C\$[\d,]+ a month/g) || [];
    expect(new Set(prices).size, `a price is stated twice: ${prices.join(' | ')}`).toBe(prices.length);
  };
  await leaks.nth(0).click();              /* the front desk alone */
  check(await read());
  await leaks.nth(2).click();              /* plus one automation */
  check(await read());
  for (let i = 1; i < 5; i++) if (i !== 2) await leaks.nth(i).click(); /* everything: the bundle */
  check(await read());
  await ctx.close();
});

/* ---------- BP3 and BD-8: the menu ---------- */

async function menuRows(page) {
  return page.evaluate(() => [...document.querySelectorAll('.main-nav.open a:not(.btn)')].map((a) => {
    const b = a.getBoundingClientRect();
    return { t: a.textContent.trim(), d: getComputedStyle(a).display, top: b.top, bottom: b.bottom, h: b.height };
  }));
}

for (const url of ['/', '/pricing.html']) {
  test(`BP3: every phone-menu link on ${url} is its own row at least 44px tall`, async ({ browser }) => {
    const ctx = await phone(browser);
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.locator('.nav-toggle').click();
    const rows = await menuRows(page);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    rows.forEach((r, i) => {
      expect(['block', 'flex'], `${r.t} is ${r.d}`).toContain(r.d);
      expect(r.h, `${r.t} is ${r.h}px tall`).toBeGreaterThanOrEqual(44);
      if (i) expect(r.top, `${r.t} overlaps ${rows[i - 1].t}`).toBeGreaterThanOrEqual(rows[i - 1].bottom - 0.5);
    });
    await ctx.close();
  });
}

for (const width of [900, 1024, 1080]) {
  test(`BD-8: at ${width}px Roadmap, About and Client login are reachable`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
    const page = await ctx.newPage();
    await page.goto('/pricing.html');
    const mins = page.locator('.main-nav a.nav-min');
    await expect(mins).toHaveCount(3);
    if (!(await mins.first().isVisible())) {
      await expect(page.locator('.nav-toggle'), 'the links are hidden, so the menu button must be there').toBeVisible();
      await page.locator('.nav-toggle').click();
    }
    for (const t of ['Roadmap', 'About', 'Client login']) {
      await expect(page.locator('.main-nav a.nav-min', { hasText: t })).toBeVisible();
    }
    await ctx.close();
  });
}

/* ---------- BP9: the open menu owns the screen ---------- */

test('BP9: a swipe does not scroll the page behind the open menu, and Escape closes it', async ({ browser }) => {
  const ctx = await phone(browser);
  const page = await ctx.newPage();
  await page.goto('/pricing.html', { waitUntil: 'load' });
  await page.locator('.nav-toggle').tap();
  await expect(page.locator('.main-nav')).toHaveClass(/open/);
  const cdp = await ctx.newCDPSession(page);
  const swipe = async (x, y0, y1) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 10; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + (y1 - y0) * i / 10 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(600);
  };
  const s0 = await page.evaluate(() => scrollY);
  await swipe(200, 300, 100);   /* on the menu */
  await swipe(200, 780, 300);   /* on the page below it */
  expect(await page.evaluate(() => scrollY), 'the page scrolled behind the open menu').toBe(s0);
  await page.keyboard.press('Escape');
  await expect(page.locator('.main-nav')).not.toHaveClass(/open/);
  await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('nav-toggle')),
    'focus goes back to the menu button').toBe(true);
  /* and the page scrolls again */
  await swipe(200, 700, 300);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(s0);
  await ctx.close();
});

test('BP9: a link tap closes the menu and unlocks the page', async ({ browser }) => {
  const ctx = await phone(browser);
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'load' });
  await page.locator('.nav-toggle').click();
  await expect(page.locator('html')).toHaveClass(/nav-locked/);
  await page.locator('.main-nav a[href="/#how"]').click();
  await expect(page.locator('.main-nav')).not.toHaveClass(/open/);
  await expect(page.locator('html')).not.toHaveClass(/nav-locked/);
  await ctx.close();
});

/* ---------- BP4: tap targets ---------- */

test('BP4: the named phone tap targets are at least 44px tall, and footer links never overlap', async ({ browser }) => {
  const ctx = await phone(browser);
  const page = await ctx.newPage();
  const tall = async (sel, what) => {
    const boxes = await page.evaluate((s) => [...document.querySelectorAll(s)]
      .filter((el) => getComputedStyle(el).display !== 'none')
      .map((el) => ({ t: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), h: el.getBoundingClientRect().height })), sel);
    expect(boxes.length, `${what}: nothing matched ${sel}`).toBeGreaterThan(0);
    for (const b of boxes) expect(b.h, `${what}: "${b.t}" is ${b.h}px tall`).toBeGreaterThanOrEqual(44);
  };
  await page.goto('/', { waitUntil: 'load' });
  await tall('#paneNav button', 'the homepage chapter numerals');
  await tall('main a.more', 'the homepage text CTAs');
  await tall('.site-footer .cols a', 'the footer links');
  const foot = await page.evaluate(() => [...document.querySelectorAll('.site-footer .cols > div')].map((col) =>
    [...col.querySelectorAll('a')].map((a) => { const b = a.getBoundingClientRect(); return { t: a.textContent.trim(), top: b.top, bottom: b.bottom }; })));
  for (const col of foot) {
    col.forEach((r, i) => { if (i) expect(r.top, `${r.t} overlaps ${col[i - 1].t}`).toBeGreaterThanOrEqual(col[i - 1].bottom - 0.5); });
  }
  await page.goto('/revenue-engine.html', { waitUntil: 'load' });
  await tall('main a.more', 'the revenue page card links');
  await ctx.close();
});

/* ---------- BP5: a jump clears the header ---------- */

test('BP5: "What every plan includes" lands its heading below the fixed header', async ({ browser }) => {
  const ctx = await phone(browser);
  const page = await ctx.newPage();
  await page.goto('/pricing.html', { waitUntil: 'load' });
  const link = page.locator('a[href="#everyPlanCard"]').first();
  await link.scrollIntoViewIfNeeded();
  await link.tap();
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    top: document.getElementById('everyPlanCard').getBoundingClientRect().top,
    head: document.querySelector('.site-header').getBoundingClientRect().height,
  }));
  expect(r.top, `the heading sits at ${r.top}px under a ${r.head}px header`).toBeGreaterThanOrEqual(r.head);
  await ctx.close();
});

/* ---------- BP6: the call bar and the scheduler ---------- */

test('BP6: on the book page the call bar steps aside while the scheduler is on screen', async ({ browser }) => {
  const ctx = await phone(browser);
  const page = await ctx.newPage();
  await page.goto('/book.html', { waitUntil: 'load' });
  const bar = page.locator('a.callbar');
  const shown = () => bar.evaluate((el) => getComputedStyle(el).visibility === 'visible'
    && el.getBoundingClientRect().top < innerHeight);
  await page.waitForTimeout(400);
  expect(await shown(), 'at the top of the page the bar is there').toBe(true);
  await page.evaluate(() => document.getElementById('bkFrame').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(800);
  expect(await shown(), 'over the scheduler the bar is out of the way').toBe(false);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  expect(await shown(), 'back at the top it returns').toBe(true);
  await ctx.close();
});

/* ---------- below the film, its hidden ending CTA takes no taps ----------
   Found while proving BP5: the film's #close stays .on after the visitor
   scrolls past the film, faded to nothing, and its "Scan my business" link
   kept pointer-events:auto, so the button that scrolled under the middle of
   the screen was unclickable and a tap there opened the scan app. */

test('below the film, the button in the middle of the screen is the one a tap reaches', async ({ browser }) => {
  test.setTimeout(120_000);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  const page = await ctx.newPage();
  await page.goto('/home.html?debug=1&nointro=1');
  await page.waitForFunction(() => window.__nv && window.__nv.dbg, null, { timeout: 60_000 });
  /* play the film to its end, where #close turns on */
  await page.evaluate(() => { const d = window.__nv.dbg; window.scrollTo(0, Math.ceil(d.spanH - d.vh)); });
  await expect.poll(() => page.evaluate(() => { const d = window.__nv.dbg; return d.target > 0.999 && Math.abs(d.cur - d.target) < 0.002; }),
    { timeout: 60_000 }).toBe(true);
  await expect(page.locator('#close')).toHaveClass(/\bon\b/);
  /* then scroll on, below it, and put every link below the film at the centre in turn */
  const hits = await page.evaluate(async () => {
    const film = document.getElementById('close').closest('[id]');
    const out = [];
    let tested = 0;
    const links = [...document.querySelectorAll('main a.btn')].filter((a) => !a.closest('#close') && a.offsetParent);
    for (const a of links) {
      a.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 120));
      if (!document.documentElement.classList.contains('nv-below')) continue;
      const b = a.getBoundingClientRect();
      if (b.top < 0 || b.bottom > innerHeight) continue;
      const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      tested += 1;
      if (top && top.closest('#close')) out.push(a.textContent.trim().replace(/\s+/g, ' '));
    }
    return { out, tested, film: !!film };
  });
  /* Without this an empty page, or one where nv-below never turns on, would
     measure nothing and pass. */
  expect(hits.tested, 'no button below the film was measured with the film scrolled past').toBeGreaterThan(0);
  expect(hits.out, 'buttons below the film whose centre the hidden film CTA takes').toEqual([]);
  await ctx.close();
});
