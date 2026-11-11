/* ============================================================
   THE BOOKED CALL OFFERS THE FIRST MONTH FREE, AND NOTHING ELSE DOES
   (v7-site-booked: owner amendments #66 and #67, held for counsel under
   decision #69; audit findings BOOK-1, BOOK-3, PROPOSAL-1, PROPOSAL-2,
   PILOT-2, PRICING-3, PRICING-6, LEGAL-18).

   The first month free is for the first freeMonth.firstClients businesses,
   given through a booked call: a place is reserved for the business after
   the call, and checkout gives the month only to a business holding one.
   Buy now never carries it. Staged v7 (#41) typed it into book.html,
   how-you-start.html, pilot.html and proposal.html as a property of every
   plan, with no cap and nothing that could stop it at ten. Each test below
   holds a RULE across the four pages, read the way a buyer and a machine
   read them:

     gate      book.html, how-you-start.html and proposal.html say it only in
               one data-nv-free-month card, shipped hidden and empty, filled
               from foundingClient by free-month.js while the engine reports
               a place open; closed, failed or with scripts off, no visible
               text says the month is free. pilot.html never says it.
     who       the card names the plans the config gives a free month and
               leaves out the one it does not (the Partnership).
     proposal  the card stays only where no Start now sits beside it, so a
               self-serve link is never shown beside the month; it never
               prints; ?plan=starter is the Partnership on purpose, and the
               Front Desk sizes have their own ids.
     prices    every figure these pages carry renders from pricing-config.js,
               and the no-script copy equals the render.
     words     "every figure is published" never returns: the Partnership's
               share is a recurring charge whose rate is in its agreement.

   The engine origin is answered here (see engine()), so no run asks
   production or writes a page view into it. Run it on its own port:
     NV_PORT=3467 npx playwright test tests/v7-booked.spec.js
   Screenshots for the G4 look go to NV_SHOTS when it is set.
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadPricing } from '../scripts/lib/pricing-catalog.mjs';

const root = process.env.SITE_ROOT
  ? path.resolve(process.env.SITE_ROOT)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
function config(src = read('pricing-config.js')) {
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { timeout: 1000 });
  return sandbox.window.NV_PRICING;
}
const P = config();
const CAP = P.freeMonth.firstClients;
const ENDPOINT = 'https://app.nevamis.ca/api/free-month';

/* The engine's FREE_MONTH vocabulary (canonical.ts freePeriodMisstatements),
   as guard 7u and tests/free-month-gate.spec.js read it. */
const FREE_MONTH = /(?<!\b(?:no|not\s+a|never\s+a|without\s+a)\s)(?:free\s+(?:first\s+)?months?|first\s+month\s+(?:is\s+|for\s+)?free|months?\s+free|month\s+on\s+us)/i;
const NAMED = { amp: '&', nbsp: ' ', middot: '·', rsquo: '’', ndash: '–', mdash: '—', quot: '"', lt: '<', gt: '>' };
const decode = (s) => s.replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
const flat = (s) => s.replace(/\s+/g, ' ').trim();

/* The three pages that may carry the gated card, the id of each card, and
   the path a browser test opens to see it. A plan proposal always carries a
   Start now under v7 (every plan is self-serve or the Partnership), so the
   proposal's card is seen on a module's proposal. */
const GATED = [
  { page: 'book.html', id: 'bookFreeMonth', url: '/book.html' },
];
/* Since owner decision #81 (2026-11-10) the booking page is the one buyer
   page left: how-you-start, the try-it page and the proposal redirect to the
   homepage, and the homepage's own free-month line is held by
   tests/home-simple.spec.js. */
const BUYER_PAGES = ['book.html'];
/* The element carrying data-nv-free-month, whole, by depth on its own tag. */
function gatedElements(html) {
  const out = [];
  const open = /<([a-z][a-z0-9]*)\b([^>]*\bdata-nv-free-month(?![-\w])[^>]*)>/gi;
  let m;
  while ((m = open.exec(html))) {
    const tag = m[1].toLowerCase();
    const tagRe = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
    tagRe.lastIndex = m.index + m[0].length;
    let depth = 1, end = html.length, t;
    while ((t = tagRe.exec(html))) {
      depth += t[1] ? -1 : 1;
      if (depth === 0) { end = t.index + t[0].length; break; }
    }
    out.push({ attrs: m[2], whole: html.slice(m.index, end), start: m.index, end });
  }
  return out;
}
const readable = (html) => decode(html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' '));

/* Every other request to the engine origin (the page-view beacon) gets the
   204 the real one gives, so nothing reaches production. */
async function engine(ctx, answer) {
  const asked = [];
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, async (r) => {
    const url = r.request().url();
    if (!url.startsWith(ENDPOINT)) return r.fulfill({ status: 204, body: '' });
    asked.push(url);
    return answer(r);
  });
  return asked;
}
const json = (status, body) => (r) => r.fulfill({
  status, contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*', 'cache-control': 'no-store' },
  body: JSON.stringify(body),
});
const OPEN = json(200, { open: true, cap: CAP });
const CLOSED = [
  ['no place is open', json(200, { open: false, cap: CAP })],
  ['the route does not exist yet (404)', (r) => r.fulfill({ status: 404, body: 'not found' })],
  ['the request fails', (r) => r.abort('failed')],
];
async function withConfig(ctx, edit) {
  const src = read('pricing-config.js');
  const moved = edit(src);
  expect(moved, 'the config edit applied').not.toBe(src);
  await ctx.route(/\/pricing-config\.js(?:\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: moved }));
}
async function visibleFreeMonth(page) {
  const text = flat(await page.locator('body').innerText());
  const m = text.match(FREE_MONTH);
  return m ? text.slice(Math.max(0, m.index - 80), m.index + 80) : null;
}

/* ============================================================
   FILE TESTS: no browser, no network
   ============================================================ */

test('gate: book.html carries one hidden, empty free-month card, wired to its carrier', () => {
  for (const { page, id } of GATED) {
    const html = read(page);
    const cards = gatedElements(html);
    expect(cards.length, `${page}: exactly one data-nv-free-month card`).toBe(1);
    const [card] = cards;
    expect(card.attrs, `${page}: the card is #${id}`).toMatch(new RegExp(`\\bid="${id}"`));
    expect(card.attrs, `${page}: the card ships hidden`).toMatch(/\shidden(?:[\s=>]|$)/);
    const slots = [...card.whole.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bdata-nv-free-month-(offer|note)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
    expect(slots.map((s) => s[2]).sort(), `${page}: one offer slot and one note slot`).toEqual(['note', 'offer']);
    for (const s of slots) expect(s[3].replace(/<[^>]*>/g, '').trim(), `${page}: the ${s[2]} slot ships empty`).toBe('');
    /* The carrier, then the one renderer that may fill the card. */
    const cfgAt = html.indexOf('<script src="pricing-config.js"></script>');
    const fmAt = html.search(/<script src="free-month\.js"(?: defer)?><\/script>/);
    expect(cfgAt, `${page} loads pricing-config.js`).toBeGreaterThan(-1);
    expect(fmAt, `${page} loads free-month.js after pricing-config.js`).toBeGreaterThan(cfgAt);
  }
});

test('gate: no free-month words on book.html outside the card, in the body, the meta, the og or the JSON-LD', () => {
  const bad = [];
  for (const page of BUYER_PAGES) {
    let html = read(page);
    for (const c of gatedElements(html).reverse()) html = html.slice(0, c.start) + ' ' + html.slice(c.end);
    const body = readable(html);
    const m = body.match(FREE_MONTH);
    if (m) bad.push(`${page} body: "${flat(body.slice(Math.max(0, m.index - 60), m.index + 60))}"`);
    for (const meta of html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/gi)) {
      if (FREE_MONTH.test(decode(meta[2]))) bad.push(`${page} <meta ${meta[1]}>: "${meta[2]}"`);
    }
    for (const ld of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
      if (FREE_MONTH.test(ld[1])) bad.push(`${page} JSON-LD`);
    }
    /* A string an inline script renders is a sentence on the page too. */
    for (const s of html.matchAll(/<script\b(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)) {
      const code = s[1].replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
      for (const lit of code.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)) if (FREE_MONTH.test(lit[1])) bad.push(`${page} script: "${lit[1]}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* Since owner decision #81 the site sells the three Front Desk sizes and
   nothing else, so the card names those three, each one a plan the config
   gives a free month, and no plan it does not. */
test('who: the card names the three Front Desk sizes, each given a free month by the config', () => {
  const sizes = P.frontDeskTiers();
  expect(sizes.length).toBe(3);
  const card = gatedElements(read('book.html'))[0].whole;
  const who = card.match(/<span id="bookFreeMonthWho">([^<]*)<[/]span>/);
  expect(who, 'book.html: #bookFreeMonthWho').toBeTruthy();
  const list = flat(decode(who[1]));
  for (const s of sizes) {
    expect(list, 'names ' + s.name).toContain(s.name);
    expect(s.freeMonths, s.name + ' carries a free month in the config').toBeGreaterThan(0);
  }
  /* Every other plan Nevamis has priced, the ones owner decision #83
     (2026-11-11) took off the served file included: they are in
     config/pricing-catalog.js, so the card is held to name none of them. */
  const others = loadPricing(root, { catalog: true }).plans.filter((x) => !sizes.some((t) => t.id === x.id));
  expect(others.length, 'the catalog still prices the plans #83 hid, so this rule judges them').toBeGreaterThan(0);
  for (const p of others) expect(list, 'names only the sizes, not ' + p.name).not.toContain(p.name);
});

test('BOOK-1: book.html says the place is reserved for the business on this call', () => {
  const card = gatedElements(read('book.html'))[0].whole;
  expect(flat(readable(card))).toMatch(/\breserve one for your business on this call\b/);
});

/* Owner QC of PR #60 (2026-10-08): two lines over the calendar, the rest
   behind Full terms. The second line is typed, so each of its clauses is held
   to the config field that makes it true, and the full note stays in the card. */
test('BOOK-1: the short line under the offer states only what freeMonth and terms say, and the full terms stay in the card', () => {
  const card = gatedElements(read('book.html'))[0].whole;
  const short = card.match(/<p id="bookFreeMonthShort"[^>]*>([\s\S]*?)<\/p>/);
  expect(short, 'book.html keeps #bookFreeMonthShort').toBeTruthy();
  const line = flat(decode(short[1]));
  expect(line).toBe('Card at sign-up, nothing charged until your second month, cancel any time from your portal.');
  expect(P.freeMonth.cardRequired, '"Card at sign-up"').toBe(true);
  expect(P.freeMonth.months, '"until your second month"').toBe(1);
  expect(P.freeMonth.overageIncluded, '"nothing charged": overage in the free month is included').toBe(true);
  expect(P.terms.minimumMonths, '"cancel any time"').toBe(0);
  expect(P.terms.cancellationNoticeDays, '"cancel any time"').toBe(0);
  const terms = card.match(/<details class="fm-terms">\s*<summary>Full terms<\/summary>([\s\S]*?)<\/details>/);
  expect(terms, 'the rest sits behind a native Full terms disclosure').toBeTruthy();
  expect(terms[1]).toMatch(/data-nv-free-month-note/);
  expect(terms[1]).toMatch(/id="bookFreeMonthWho"/);
});

test('BOOK-3: book.html never says every figure is published, and offers no Partnership, Lead Generation or invitation', () => {
  const bad = [];
  for (const page of BUYER_PAGES) {
    const text = flat(readable(read(page)));
    const m = text.match(/\b(?:every|all|both)\s+(?:of\s+the\s+)?(?:figures?|prices?|numbers?)\s+(?:is|are)\s+published\b/i);
    if (m) bad.push(`${page}: "${text.slice(Math.max(0, m.index - 60), m.index + 80)}"`);
    for (const re of [/Partnership/, /Lead Generation/i, /by invitation/i, /who you want more of/i]) {
      const hit = text.match(re);
      if (hit) bad.push(`${page}: says "${text.slice(Math.max(0, hit.index - 40), hit.index + 60)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* OWNER DECISION #81 (2026-11-10): the page the ads land on is a short
   headline, three short lines on what happens on the 15-minute call, and the
   calendar. Nothing before the calendar carries a figure; the floor is said
   once, inside the scheduler panel. */
test('decision #81: book.html is a headline, three lines on the call, and the calendar', () => {
  const html = read('book.html');
  const main = html.slice(html.indexOf('<main id="main">'), html.indexOf('</main>'));
  expect((main.match(/<h1\b/g) || []).length).toBe(1);
  expect(flat(readable((/<h1>([\s\S]*?)<\/h1>/.exec(main) || [])[1] || ''))).toBe('Book a 15-minute call.');
  const lines = [...((/<ul class="bk-call">([\s\S]*?)<\/ul>/.exec(main) || [])[1] || '').matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => flat(readable(m[1])));
  expect(lines).toEqual([
    'Tell Daren about the calls you miss.',
    'Hear what the agent does and what it costs.',
    'No pressure. If it is not a fit, he will say so.',
  ]);
  /* Two sections: the headline, then the calendar. */
  expect((main.match(/<section\b/g) || []).length).toBe(2);
  const before = readable(main.slice(0, main.indexOf('id="pick-a-time"')));
  expect(before.match(/C\$\s?\d/), 'no figure above the calendar').toBeNull();
  for (const id of ['bkFrame', 'bkNewTab', 'bookFreeMonth', 'bookFrom', 'cbWrap']) expect(main, `#${id} stays`).toContain(`id="${id}"`);
});

/* ============================================================
   BROWSER TESTS: the pages as they render, offline
   ============================================================ */

for (const { page: file, id, url } of GATED) {
  test(`gate open: ${file} shows #${id} with foundingClient's words`, async ({ browser }) => {
    const ctx = await browser.newContext();
    const asked = await engine(ctx, OPEN);
    const page = await ctx.newPage();
    await page.goto(url);
    const card = page.locator('#' + id);
    await expect(card).toBeVisible();
    await expect(card.locator('[data-nv-free-month-offer]')).toHaveText(P.foundingClient.offer);
    await expect(card.locator('[data-nv-free-month-note]')).toHaveText(P.foundingClient.note);
    expect(asked.length, 'free-month.js asked the engine once').toBe(1);
    /* The offer carries the cap and the booked call, from the config. */
    await expect(card).toContainText(`first ${CAP} businesses`);
    /* Counted in businesses, never clients (owner decision #74). */
    await expect(card).not.toContainText(`first ${CAP} clients`);
    await expect(card).toContainText('booked call');
    await ctx.close();
  });

  for (const [why, answer] of CLOSED) {
    test(`gate closed when ${why}: ${file} says nothing of a free month`, async ({ browser }) => {
      const ctx = await browser.newContext();
      const asked = await engine(ctx, answer);
      const page = await ctx.newPage();
      await page.goto(url);
      await expect.poll(() => asked.length).toBe(1);
      await page.waitForTimeout(500);
      await expect(page.locator('#' + id)).toBeHidden();
      expect(await visibleFreeMonth(page)).toBeNull();
      await ctx.close();
    });
  }

  test(`gate: with scripts off, ${file} says nothing of a free month`, async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    await engine(ctx, OPEN);
    const page = await ctx.newPage();
    await page.goto(url);
    await expect(page.locator('#' + id)).toBeHidden();
    expect(await visibleFreeMonth(page)).toBeNull();
    await ctx.close();
  });

  test(`gate: the owner's switch off keeps ${file} silent without asking the engine`, async ({ browser }) => {
    const ctx = await browser.newContext();
    await withConfig(ctx, (s) => s.replace(/(foundingClient:\s*\{\s*active:\s*)true/, '$1false'));
    const asked = await engine(ctx, OPEN);
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForTimeout(800);
    expect(asked).toEqual([]);
    await expect(page.locator('#' + id)).toBeHidden();
    expect(await visibleFreeMonth(page)).toBeNull();
    await ctx.close();
  });
}

/* ---------- every figure renders from the config ---------- */

const SPANS = {
  'book.html': ['bookFrom'],
};
for (const [file, ids] of Object.entries(SPANS)) {
  test(`prices: ${file} renders its figures from the config, and its no-script copy is the render`, async ({ browser }) => {
    const html = read(file);
    const ctx = await browser.newContext();
    await engine(ctx, json(200, { open: false, cap: CAP }));
    const page = await ctx.newPage();
    await page.goto('/' + file);
    for (const id of ids) {
      const fallback = flat(decode(html.match(new RegExp(`<span id="${id}">([\\s\\S]*?)</span>`))[1]));
      await expect(page.locator('#' + id), `#${id} renders exactly its no-script copy`).toHaveText(fallback);
    }
    /* Nothing outside the rendered spans is a price. */
    const rest = html.replace(new RegExp(`<span id="(?:${ids.join('|')})">[\\s\\S]*?</span>`, 'g'), ' ');
    const typed = [...readable(rest).matchAll(/C\$\s?[\d,.]+/g)].map((m) => m[0]);
    expect(typed, `${file}: figures typed outside the rendered lines`).toEqual([]);
    await ctx.close();
  });
}

/* PR #62 review, item 4: with prices unpublished, book.html leaves no typed
   floor figure on the page, as pricing.html does with its lede. */
test('prices: with pricing unpublished, book.html carries no floor figure', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, json(200, { open: false, cap: CAP }));
  await withConfig(ctx, (s) => s.replace(/publishedPricing: true/, 'publishedPricing: false'));
  const page = await ctx.newPage();
  await page.goto('/book.html');
  await expect(page.locator('#bookFrom')).toHaveText('');
  expect(await page.locator('main').innerText()).not.toMatch(/C\$\s?\d/);
  await ctx.close();
});

test('prices: a moved Front Desk Starter price and minutes reach the floor line on book.html', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, json(200, { open: false, cap: CAP }));
  await withConfig(ctx, (s) => s
    .replace(/(id: "front-desk-starter", name: "Front Desk Starter",\s*monthly: )\d+(, launch: 0, freeMonths: 1, includedMinutes: )\d+/, '$1275$2210'));
  const page = await ctx.newPage();
  await page.goto('/book.html');
  await expect(page.locator('#bookFrom')).toHaveText('Plans start at C$275 a month plus GST/HST (Front Desk Starter, 210 minutes).');
  await ctx.close();
});

/* ---------- G4: each changed page at 1440 and 390, gate open and closed ---------- */

const LOOK = [
  ['book', '/book.html'],
];
for (const width of [1440, 390]) {
  for (const open of [true, false]) {
    test(`look: every changed page at ${width} wide, gate ${open ? 'open' : 'closed'}: no sideways scroll, no console error`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      await engine(ctx, json(200, { open, cap: CAP }));
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      for (const [name, url] of LOOK) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        const sideways = await page.evaluate(() => document.scrollingElement.scrollWidth - document.documentElement.clientWidth);
        expect(sideways, `${name} at ${width}: scrolls sideways by ${sideways}px`).toBeLessThanOrEqual(0);
        if (process.env.NV_SHOTS) {
          fs.mkdirSync(process.env.NV_SHOTS, { recursive: true });
          await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')));
          await page.screenshot({ path: path.join(process.env.NV_SHOTS, `${name}-${width}-${open ? 'open' : 'closed'}.png`), fullPage: true });
        }
      }
      expect(errors, errors.join('\n')).toEqual([]);
      await ctx.close();
    });
  }
}
