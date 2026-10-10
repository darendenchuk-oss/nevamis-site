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
  { page: 'how-you-start.html', id: 'hysFreeMonth', url: '/how-you-start.html' },
  { page: 'proposal.html', id: 'propFreeMonth', url: '/proposal.html?plan=quote_chase&to=Cedarview+Electric' },
];
const BUYER_PAGES = ['book.html', 'how-you-start.html', 'pilot.html', 'proposal.html'];

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

test('gate: book, how-you-start and the proposal each carry one hidden, empty free-month card, wired to its carrier', () => {
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

test('gate: no free-month words on the four pages outside the card, in the body, the meta, the og or the JSON-LD', () => {
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

test('PILOT-2: the try-it page says no free month, gated or not, and its first action is the booked call', () => {
  const html = read('pilot.html');
  expect(gatedElements(html), 'pilot.html carries no free-month card').toEqual([]);
  expect(html).not.toMatch(/free-month\.js/);
  const cta = html.match(/<div class="cta-row">([\s\S]*?)<\/div>/);
  expect(cta, 'pilot.html has its call-to-action row').toBeTruthy();
  const first = cta[1].match(/<a\b[^>]*href="([^"]+)"[^>]*>/);
  expect(first[1], 'the first action is the booked call').toBe('/book.html');
  expect(first[0]).toMatch(/\bbtn-primary\b/);
  /* It says what Buy now does, so nobody reads the page as an offer. */
  expect(flat(readable(html))).toMatch(/Buy now charges your first month/);
});

test('PRICING-3: "Can I try it before I commit?" is answered without the free month, and the card is not among the questions', () => {
  const html = read('how-you-start.html');
  const qa = html.match(/<dl class="qa[^"]*">([\s\S]*?)<\/dl>/);
  expect(qa, 'how-you-start.html has its questions').toBeTruthy();
  expect(qa[1], 'the card sits outside the questions').not.toMatch(/data-nv-free-month/);
  const tryIt = qa[1].match(/<dt>([^<]*try it[^<]*)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/i);
  expect(tryIt, 'the try-it question is still answered').toBeTruthy();
  expect(tryIt[2]).not.toMatch(/\bfree\b/i);
  expect(tryIt[2]).not.toMatch(/^\s*yes\b/i);
  expect(tryIt[2]).toMatch(/Buy now charges your first month/);
});

test('who: each card names the plans the config gives a free month, and leaves out the one it does not', () => {
  const given = P.plans.filter((p) => p.freeMonths > 0);
  const none = P.plans.filter((p) => !(p.freeMonths > 0));
  expect(none.map((p) => p.id), 'the Partnership carries no free month').toContain('starter');
  const modulesGiven = P.addOns.some((a) => a.sellable && a.soldAlone && a.freeMonths > 0);
  for (const [page, span] of [['book.html', 'bookFreeMonthWho'], ['how-you-start.html', 'hysFreeMonthWho']]) {
    const html = read(page);
    const card = gatedElements(html)[0].whole;
    const who = card.match(new RegExp(`<span id="${span}">([\\s\\S]*?)</span>`));
    expect(who, `${page}: #${span}`).toBeTruthy();
    const list = flat(decode(who[1]));
    for (const p of given) expect(list, `${page}: names ${p.name}`).toContain(p.name);
    for (const p of none) expect(list, `${page}: does not offer it on ${p.name}`).not.toContain(p.name);
    if (modulesGiven) expect(list, `${page}: names a module bought on its own`).toMatch(/\bmodule bought on its own\b/);
    for (const p of none) expect(flat(readable(card)), `${page}: says ${p.name} is not included`).toContain(`${p.name} is not included`);
  }
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

test('BOOK-3: no buyer page says every figure is published, and book.html names the share as recurring, its rate in the agreement', () => {
  const bad = [];
  for (const page of BUYER_PAGES) {
    const text = flat(readable(read(page)));
    const m = text.match(/\b(?:every|all|both)\s+(?:of\s+the\s+)?(?:figures?|prices?|numbers?)\s+(?:is|are)\s+published\b/i);
    if (m) bad.push(`${page}: "${text.slice(Math.max(0, m.index - 60), m.index + 80)}"`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
  /* The Partnership's share, named as what it is, now in its own "By
     invitation" disclosure (funnel audit item 7). */
  const invite = read('book.html').match(/<details class="bk-invite">([\s\S]*?)<\/details>/);
  expect(invite, 'book.html keeps the Partnership behind its By invitation disclosure').toBeTruthy();
  const sentence = flat(decode(readable(invite[1]))).split(/(?<=\.)\s+/).find((s) => /\bshare\b/.test(s) && /\brecur/.test(s));
  expect(sentence, 'the disclosure names the recurring share').toBeTruthy();
  expect(sentence).toMatch(/\bset in its agreement\b/);
  expect(sentence, 'never a rate').not.toMatch(/\d+(?:\.\d+)?\s*(?:%|per ?cent)/i);
});

/* FUNNEL AUDIT ITEM 7 (2026-10-09): above the calendar, book.html leads with
   missed calls, its cost card is one sentence that carries the floor, and
   the Partnership's fee is behind a disclosure, so no figure on the page
   reads above the floor. */
test('item 7: book.html leads with missed calls, the cost card is one sentence with the floor, and the invitation\'s fee is folded', () => {
  const html = read('book.html');
  const rowAt = html.indexOf('<h2>Three things, then you decide.</h2>');
  expect(rowAt, 'the "Three things" row is where it was').toBeGreaterThan(-1);
  const row = html.slice(rowAt, html.indexOf('</section>', rowAt));
  const heads = [...row.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]);
  expect(heads[0], 'the row leads with missed calls').toMatch(/\bcalls you miss\b/i);
  expect(heads.indexOf('Who you want more of'), 'Lead Generation is not first').toBeGreaterThan(0);
  const costs = html.match(/<h3>What it costs<\/h3><p>([\s\S]*?)<\/p>/);
  expect(costs, 'book.html keeps its What it costs card').toBeTruthy();
  const text = flat(decode(readable(costs[1])));
  expect(text.split(/(?<=\.)\s+/).filter(Boolean), 'one sentence').toHaveLength(1);
  expect(costs[1]).toMatch(/<span id="bookCostFrom">Plans start at C\$[\d,]+ a month, /);
  expect(text, 'the cost card names no invitation and no fee').not.toMatch(/Partnership|Launch & Implementation/);
  /* No figure on the page, before the scheduler, sits outside a disclosure
     and above the floor. */
  const before = readable(html.slice(0, html.indexOf('id="pick-a-time"')).replace(/<details class="bk-invite">[\s\S]*?<\/details>/, ' '));
  const figures = [...before.matchAll(/C\$\s?([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));
  const floor = Math.min(...P.plans.filter((p) => p.selfServe === true && p.monthly > 0 && !(p.launch > 0)).map((p) => p.monthly));
  expect(figures.length, 'the floor is above the calendar').toBeGreaterThan(0);
  for (const n of figures) expect(n, 'no figure above the calendar but the floor').toBe(floor);
});

test('analytics: the free-month card on how-you-start books under a name of its own on that page, never the hero\'s', () => {
  const html = read('how-you-start.html');
  const card = gatedElements(html).find((g) => /\bid="hysFreeMonth"/.test(g.whole));
  expect(card, 'how-you-start keeps #hysFreeMonth').toBeTruthy();
  const evts = [...card.whole.matchAll(/data-evt="([^"]+)"/g)].map((m) => m[1]);
  expect(evts, 'the card has one tracked Book a call').toHaveLength(1);
  const [evt] = evts;
  expect(evt, 'a click from the card is not counted as a click in the hero').not.toBe('hero_book_call_click');
  /* Allowlisted by the engine on master and on sell/v7-integration
     (src/app/api/events/route.ts): an unknown name is dropped silently. */
  expect(['pricing_book_call_click']).toContain(evt);
  const outside = html.slice(0, card.start) + html.slice(card.end);
  expect(outside.match(new RegExp('data-evt="' + evt + '"', 'g')), 'the name fires nowhere else on the page').toBeNull();
});

test('LEGAL-18: how-you-start calls the Partnership the one PUBLISHED plan with a fee, and names Enterprise\'s floor', () => {
  const text = flat(readable(read('how-you-start.html')));
  expect(text).not.toMatch(/\bthe one plan with a Launch & Implementation fee\b/);
  expect(text).toMatch(/\bthe one published plan with a Launch & Implementation fee\b/);
  expect(text).toContain(`${P.enterprise.name} is quoted per client, its Launch & Implementation starting at ${P.money(P.enterprise.launchFrom)}.`);
});

test('PROPOSAL-2: the proposal maps "starter" and "after-hours" to the Partnership on purpose, and resolves the sizes by their own ids', () => {
  const html = read('proposal.html');
  const legacy = html.match(/var LEGACY = (\{[^}]*\});/);
  expect(legacy, 'the legacy map is where it was').toBeTruthy();
  const map = JSON.parse(legacy[1]);
  expect(map['after-hours']).toBe('starter');
  expect(Object.values(map), 'no legacy id points at a Front Desk size').not.toContain('front-desk-starter');
  const partner = P.plans.find((p) => p.id === 'starter');
  expect(partner.selfServe, '"starter" is still the Partnership\'s key').toBe(false);
  for (const id of ['front-desk-starter', 'front-desk-plus']) expect(P.plans.some((p) => p.id === id), id).toBe(true);
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

test('pilot.html, open gate or not, never says the month is free', async ({ browser }) => {
  const ctx = await browser.newContext();
  const asked = await engine(ctx, OPEN);
  const page = await ctx.newPage();
  await page.goto('/pilot.html');
  await page.waitForTimeout(600);
  expect(asked, 'the try-it page never asks').toEqual([]);
  expect(await visibleFreeMonth(page)).toBeNull();
  expect(flat(await page.locator('main').innerText())).not.toMatch(/\bfree\b/i);
  await ctx.close();
});

test('PRICING-3: with the gate open, the try-it answer on how-you-start still says no free month', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, OPEN);
  const page = await ctx.newPage();
  await page.goto('/how-you-start.html');
  await expect(page.locator('#hysFreeMonth')).toBeVisible();
  const answer = page.locator('dl.qa dt:has-text("try it") + dd');
  await expect(answer).toHaveCount(1);
  expect(await answer.innerText()).not.toMatch(/\bfree\b/i);
  expect(await page.locator('dl.qa [data-nv-free-month]').count()).toBe(0);
  await ctx.close();
});

/* ---------- PROPOSAL-1: never beside a self-serve link ---------- */

const FDS = P.plans.find((p) => p.id === 'front-desk-starter');
const FDP = P.plans.find((p) => p.id === 'front-desk-plus');
const PARTNER = P.plans.find((p) => p.id === 'starter');
const cash = (n) => 'C$' + (Number.isInteger(n) ? n.toLocaleString('en-CA') : n.toFixed(2));

for (const [qs, why] of [
  ['?plan=pro', 'the recommended plan, with Start now'],
  ['?plan=front-desk-starter', 'Front Desk Starter, with Start now'],
  ['?plan=growth', 'The Works, with Start now'],
  ['?plan=starter', 'the Partnership, which has no free month'],
  ['?plan=bogus', 'a link that names nothing'],
  ['', 'a bare link'],
]) {
  test(`PROPOSAL-1: ${why} carries no free-month card, even with the gate open, and the engine is not asked`, async ({ browser }) => {
    const ctx = await browser.newContext();
    const asked = await engine(ctx, OPEN);
    const page = await ctx.newPage();
    await page.goto('/proposal.html' + qs);
    await page.waitForTimeout(600);
    expect(await page.locator('#propFreeMonth').count(), 'the card is taken out of the page').toBe(0);
    expect(asked, 'free-month.js found nothing to show, so it asked nothing').toEqual([]);
    expect(await visibleFreeMonth(page)).toBeNull();
    await ctx.close();
  });
}

test('PROPOSAL-1: a plan proposal with no Start now (checkout shut) keeps the card, which shows only while a place is open', async ({ browser }) => {
  for (const open of [true, false]) {
    const ctx = await browser.newContext();
    await withConfig(ctx, (s) => s.replace(/\bsellable: true,(\s*\/\* Whether a plan price)/, 'sellable: false,$1'));
    await engine(ctx, json(200, { open, cap: CAP }));
    const page = await ctx.newPage();
    await page.goto('/proposal.html?plan=front-desk-plus');
    await expect(page.locator('a[data-buy]')).toHaveCount(0);
    await page.waitForTimeout(500);
    if (open) await expect(page.locator('#propFreeMonth')).toBeVisible();
    else await expect(page.locator('#propFreeMonth')).toBeHidden();
    await ctx.close();
  }
});

test('PROPOSAL-1: a module proposal states its monthly alone and, printed, never carries the free month', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, OPEN);
  const page = await ctx.newPage();
  const qc = P.addOns.find((a) => a.id === 'quote_chase');
  await page.goto('/proposal.html?plan=quote_chase');
  await expect(page.locator('#planName')).toHaveText(qc.name.toUpperCase());
  /* Both cases (funnel audit item 3): a module carries a free month, so the
     line says what a reserved spot changes, and promises no spot. */
  await expect(page.locator('#planMonthly')).toHaveText(P.startLine(qc).replace(/\.$/, '') + ', charged the day you start and every month after.'
    + ' If a first-month-free spot has been reserved for your business, nothing is charged until your second month; the portal shows which before you pay.');
  await expect(page.locator('#planMonthly')).not.toContainText('Launch & Implementation');
  await expect(page.locator('#propFreeMonth')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#propFreeMonth')).toBeHidden();
  await ctx.close();
});

test('PROPOSAL-2: the Front Desk sizes render by their own ids, with minutes and overage, and buy themselves', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, json(200, { open: false, cap: CAP }));
  const page = await ctx.newPage();
  for (const [qs, pl] of [['front-desk-starter', FDS], ['front-desk-plus', FDP], ['front_desk_plus', FDP]]) {
    await page.goto('/proposal.html?plan=' + qs + '&to=Cedarview+Electric');
    await expect(page.locator('#planName'), qs).toHaveText(pl.name.toUpperCase());
    await expect(page.locator('#planPrice'), qs).toHaveText(cash(pl.monthly) + '/month');
    await expect(page.locator('#planIncludes'), qs).toHaveText(
      pl.includedMinutes.toLocaleString('en-CA') + ' included AI minutes per month' + (pl.callRange ? ', about ' + pl.callRange : '')
      + '. Additional minutes ' + cash(pl.overage) + ' each.');
    await expect(page.locator('#planIncludes'), qs).not.toContainText('undefined');
    await expect(page.locator('#planTerms'), qs).not.toContainText(/One-time|Launch & Implementation/);
    const buys = await page.locator('a[data-buy]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(buys.length, qs).toBeGreaterThan(0);
    for (const h of buys) expect(h, qs).toBe('https://app.nevamis.ca/signup?plan=' + pl.id);
    /* Never the Partnership's copy. */
    expect(await page.locator('main').innerText(), qs).not.toContain(PARTNER.name.toUpperCase());
  }
  await ctx.close();
});

test('PROPOSAL-2: ?plan=starter, after-hours and after_hours render the Partnership, its fee in one sentence with its share', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, json(200, { open: false, cap: CAP }));
  const page = await ctx.newPage();
  /* after_hours: underscores become hyphens BEFORE the legacy map is read,
     the same spelling rule as front_desk_plus. */
  for (const qs of ['starter', 'after-hours', 'after_hours']) {
    await page.goto('/proposal.html?plan=' + qs);
    await expect(page.locator('#planName'), qs).toHaveText(PARTNER.name.toUpperCase());
    const terms = flat(await page.locator('#planTerms').innerText());
    expect(terms, qs).toContain('One-time ' + P.launchPart(PARTNER) + ', ' + PARTNER.performanceNote + '.');
    expect(terms, qs).not.toMatch(/\.\s+plus\b/);
    expect(await page.locator('a[data-buy]').count(), `${qs}: the Partnership is agreed, not bought`).toBe(0);
    expect(await page.locator('main').innerText(), qs).not.toContain(FDS.name.toUpperCase());
  }
  await ctx.close();
});

/* ---------- every figure renders from the config ---------- */

const SPANS = {
  'how-you-start.html': ['hysTiers', 'hysWorks', 'hysPartnership', 'hysEnterprise'],
  'book.html': ['bookPartnership', 'bookFrom', 'bookCostFrom'],
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
  await expect(page.locator('#bookCostFrom')).not.toContainText('C$');
  await expect(page.locator('#bookCostFrom')).toContainText('On the call you see which plan or single automation fits');
  await ctx.close();
});

test('prices: a moved Front Desk Plus price, rate and Partnership fee reach how-you-start and book', async ({ browser }) => {
  const ctx = await browser.newContext();
  await engine(ctx, json(200, { open: false, cap: CAP }));
  await withConfig(ctx, (s) => s
    .replace(/(id: "front-desk-plus", name: "Front Desk Plus",\s*monthly: )\d+/, '$1555')
    .replace(/(includedMinutes: 550,\s*overage: )0\.95/, '$10.9')
    .replace(/(id: "starter", name: "Performance Partnership",\s*monthly: 350, launch: )\d+/, '$14321'));
  const page = await ctx.newPage();
  await page.goto('/how-you-start.html');
  await expect(page.locator('#hysTiers')).toContainText('Front Desk Plus, C$555 a month with 550 minutes, then C$0.90 for each extra minute');
  await expect(page.locator('#hysPartnership')).toContainText('C$4,321 Launch & Implementation to start');
  await page.goto('/book.html');
  await expect(page.locator('#bookPartnership')).toContainText('C$4,321 Launch & Implementation to start');
  await ctx.close();
});

/* ---------- G4: each changed page at 1440 and 390, gate open and closed ---------- */

const LOOK = [
  ['book', '/book.html'],
  ['how-you-start', '/how-you-start.html'],
  ['pilot', '/pilot.html'],
  ['proposal-module', '/proposal.html?plan=quote_chase&to=Cedarview+Electric'],
  ['proposal-front-desk-plus', '/proposal.html?plan=front-desk-plus&to=Cedarview+Electric'],
  ['proposal-partnership', '/proposal.html?plan=starter&to=Cedarview+Electric'],
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
