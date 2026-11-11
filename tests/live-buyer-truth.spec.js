/* ============================================================
   THE BUYER PAGES TELL A BUYER THE TRUTH, IN THE OWNER'S WORDS
   (site-live-buyer, the whole-site audit of 2026-10-03, decision #69).

   The audit read every buyer page as a buyer and as a machine reads it
   (title, meta, og, JSON-LD) and found the same few defects in more than
   one place. Each test below holds a RULE across every surface this leaf
   owns, not the one sentence the audit quoted, so the next audit finds no
   sibling:

     PRICING-7, MACHINE-19, PILOT-1  no buyer page says "pilot", "trial",
          "free period" or "discount", not even to deny one: the owner's rule
          is the word, not the claim. how-you-start.html and pilot.html, the
          two pages that answer "can I try it first", do not say "free" either.
     PRICING-8   how-you-start.html renders every figure from
          pricing-config.js, and its no-script copy is held equal to what it
          renders.
     PRICING-9   no sentence, machine-read or not, says the agent takes the
          job or the time the caller wants, which reads as a booking, even
          beside "you confirm": it captures the request and the times that
          suit, as how-you-start.html says.
     PRICING-10  a refusal that a published plan makes (integrations, more
          than one location) is scoped to the published plans and names
          Enterprise, which sells exactly those.
     PRICING-14  pricing.html's add-on list renders from P.addOns, and its
          no-script copy is held equal to the render.
     WALK-LIVE-2 every add-on the config sells alone has its own Start link to
          its module-only signup, Missed-Call Recovery included.
     BOOK-2      every "only recurring charges" sentence names the
          Partnership's agreed share, and never a rate (ADR-015).
     BOOK-5      "published before you decide" never stands without the
          Partnership's agreement exception (v7: its figures are fixed, so
          the exception is that its share is set in the agreement, and the
          retired "within published ranges" is no longer required).
     LEGAL-9     the terms note states the term alone: since owner decision
          #83 it names no add-on, and it names no one-time fee and no free
          month.
     PROPOSAL-4  robots.txt lets crawlers read the proposal's noindex.
     MACHINE-24  one BreadcrumbList per page, the generated one.
     MACHINE-25  the indexable pages carry og:url (their canonical), og:type
          and og:site_name, and the pricing title does not narrow to one city.
     CHECK-RUNNER-7   every meta description is 160 characters or fewer.
     CHECK-RUNNER-10  every page, the proposal included, has a skip link to
          an element that exists.

   SCOPE is the files this leaf owns. The same rules have siblings in files
   other leaves own and fix in parallel (the homepage FAQ, content-map.json,
   terms.html, the generated content pages); widening this file to them
   would leave it red for work no commit here can do.

   The file-reading tests open no browser and reach no network; SITE_ROOT=<a
   checkout> points them at another tree, which is how they were shown red on
   site main as it was before this change. The browser tests answer the
   engine origin themselves (see OFFLINE), so no run writes a fake visit
   into production. Run it on its own port:
     NV_PORT=3371 npx playwright test tests/live-buyer-truth.spec.js
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

/* The pages this leaf owns, and the two that answer "can I try it first". */
/* The buyer pages since owner decision #81 (2026-11-10): the homepage and
   the booking page. How you start, the try-it page, pricing and the proposal
   redirect to the homepage. */
const PAGES = ['index.html', 'book.html'];
const TRY_IT_PAGES = [];

/* Words a buyer page never says, in any sense. "Autopilot" is a product
   name and is not the word "pilot", which \b keeps apart. */
const BANNED_WORDS = [/\bpilots?\b/i, /\btrials?\b/i, /\bfree periods?\b/i, /\bdiscount(?:s|ed)?\b/i];

function config() {
  const sandbox = { window: {} };
  vm.runInNewContext(read('pricing-config.js'), sandbox, { timeout: 1000 });
  return sandbox.window.NV_PRICING;
}

/* ---------- reading a page the way a buyer and a machine read it ---------- */

const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', middot: '·', rsaquo: '›',
  lsaquo: '‹', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', ndash: '–', mdash: '—' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
const flat = (s) => s.replace(/\s+/g, ' ').trim();

/* What the page SAYS with scripts off, one block at a time: comments,
   scripts (JSON-LD aside, it is read separately), styles and tags removed,
   and each list item, paragraph, term, heading or cell its own block, so a
   list item with no full stop never runs on into the next one. */
const BLOCK_END = /<\/(?:li|p|dt|dd|h[1-6]|div|section|td|th|ul|ol|main|header|footer|nav|figcaption)>|<br\s*\/?>/gi;
function visibleBlocks(html) {
  return decode(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(BLOCK_END, ' ')
    .replace(/<[^>]+>/g, ' '))
    .split(' ').map(flat).filter(Boolean);
}
const visibleText = (html) => visibleBlocks(html).join(' ');

/* Every string a machine reads off the page without rendering it. */
function machineStrings(html) {
  const out = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) out.push({ where: '<title>', text: decode(title[1]) });
  for (const m of html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/gi)) {
    if (/^(?:description|og:|twitter:)/i.test(m[1])) out.push({ where: `<meta ${m[1]}>`, text: decode(m[2]) });
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    const walk = (v, at) => {
      if (typeof v === 'string') out.push({ where: `JSON-LD ${at}`, text: v });
      else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`);
    };
    try { walk(JSON.parse(m[1]), ''); } catch { out.push({ where: 'JSON-LD (unparseable)', text: m[1] }); }
  }
  return out;
}

/* Sentences, for rules that are about one sentence saying two things. */
const sentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z(])/).map(flat).filter(Boolean);

/* Every surface of every page: the visible text and each machine string. */
function surfaces() {
  const out = [];
  for (const p of PAGES) {
    const html = read(p);
    for (const text of visibleBlocks(html)) out.push({ page: p, where: 'visible text', text });
    for (const s of machineStrings(html)) out.push({ page: p, ...s });
  }
  return out;
}

/* ============================================================
   FILE TESTS: no browser, no network
   ============================================================ */

test('PRICING-7, MACHINE-19, PILOT-1: no buyer page says pilot, trial, free period or discount, even to deny one', () => {
  const hits = [];
  for (const s of surfaces()) {
    const rules = TRY_IT_PAGES.includes(s.page) ? [...BANNED_WORDS, /\bfree\b/i] : BANNED_WORDS;
    for (const re of rules) {
      const m = s.text.match(re);
      if (m) hits.push(`${s.page} ${s.where}: "${m[0]}" in "${s.text.slice(Math.max(0, m.index - 60), m.index + 60)}"`);
    }
  }
  expect(hits, hits.join('\n')).toEqual([]);
});

/* The sentences how-you-start's script rewrites from the config. Since v7
   (owner amendment #67, v7-site-booked) they are the three Front Desk sizes,
   The Works, the Partnership and Enterprise's floor; the recommended plan's
   own sentence is one of the sizes now. */
const HYS_SPANS = ['hysTiers', 'hysWorks', 'hysPartnership', 'hysEnterprise'];

test('PRICING-9: no sentence a machine or a buyer reads has the agent take the job or the time the caller wants, even beside "you confirm"', () => {
  const booking = /\btakes? (?:the job|the time|the slot)\b|\b(?:the )?times? (?:they|the caller) wants?\b/i;
  const bad = [];
  for (const s of surfaces()) {
    for (const sentence of sentences(s.text)) {
      if (booking.test(sentence)) bad.push(`${s.page} ${s.where}: "${sentence.slice(0, 200)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('PRICING-10: a refusal only a published plan makes is scoped to the published plans and names Enterprise', () => {
  const planLimit = /\bdoes not (?:connect|handle|integrate)\b[^.]*\b(?:CRM|integrations?|automation tool|locations?|departments?|more than one number)\b/i;
  const bad = [];
  for (const p of PAGES) {
    const html = read(p);
    /* One block (a list item, a paragraph) is one refusal, read on its own,
       as copy travels: the scope and the Enterprise exception belong to the
       refusal they qualify, not to a heading above it. */
    for (const unit of visibleBlocks(html)) {
      if (planLimit.test(unit) && !(/\bpublished plans?\b/i.test(unit) && /\bEnterprise\b/.test(unit))) {
        bad.push(`${p}: "${unit.slice(0, 200)}"`);
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('BOOK-5: "published before you decide" never stands without the Partnership\'s agreement', () => {
  const bad = [];
  for (const s of surfaces()) {
    for (const sentence of sentences(s.text)) {
      if (/\bpublished before you (?:decide|commit)\b/i.test(sentence)
        && !(/\bPerformance Partnership\b/.test(sentence) && /\b(?:set in (?:your|its) agreement|agreement within published ranges)\b/i.test(sentence))) {
        bad.push(`${s.page} ${s.where}: "${sentence.slice(0, 220)}"`);
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('LEGAL-9: the terms note states the term alone: no add-on, no one-time fee, no free month', () => {
  const note = config().terms.note;
  expect(note).toMatch(/\bno minimum term\b/i);
  /* Owner decision #83 (2026-11-11): the price file nevamis.ca serves sells
     only the three Front Desk sizes, so its term note covers plans and names
     no add-on (until #83 it said "every plan and every add-on, bought on its
     own or added later"). */
  expect(note, 'the served note names no add-on (#83)').not.toMatch(/\badd-?ons?\b/i);
  expect(note, 'nothing is charged "beside your first month"').not.toMatch(/\bbeside (?:your|the) first month\b/i);
  /* No size carries a one-time fee, so the note names none. And it says
     nothing about a first month free: every renderer prints it to every
     buyer, and that offer is gated. */
  expect(note).not.toMatch(/\bLaunch (?:&|and) Implementation\b/i);
  expect(note).not.toMatch(/\bfree month\b|\bfirst month (?:is )?free\b|\bmonths? free\b/i);
});

test('MACHINE-24: each page carries one BreadcrumbList, the generated one', () => {
  for (const p of PAGES) {
    const html = read(p);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
    const crumbs = blocks.filter((b) => /"@type"\s*:\s*"BreadcrumbList"/.test(b[1]));
    expect(crumbs.length, `${p} BreadcrumbList blocks`).toBeLessThanOrEqual(1);
    for (const c of crumbs) {
      const before = html.slice(0, c.index);
      expect(before.lastIndexOf('<!-- generated:schema -->') > before.lastIndexOf('<!-- /generated:schema -->'),
        `${p}: its BreadcrumbList is hand-written, outside the generated:schema block`).toBe(true);
    }
  }
});

test('MACHINE-25: indexable pages carry og:url, og:type and og:site_name, and the pricing title is not one city\'s', () => {
  const meta = (html, prop) => (html.match(new RegExp(`<meta property="${prop}" content="([^"]*)">`)) || [])[1];
  for (const p of PAGES) {
    const html = read(p);
    if (/<meta name="robots" content="noindex/.test(html)) continue;
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
    expect(meta(html, 'og:url'), `${p} og:url`).toBe(canonical);
    expect(meta(html, 'og:type'), `${p} og:type`).toBe('website');
    expect(meta(html, 'og:site_name'), `${p} og:site_name`).toBe('Nevamis');
  }
});

test('CHECK-RUNNER-7: every meta description is 160 characters or fewer', () => {
  for (const p of PAGES) {
    const m = read(p).match(/<meta name="description" content="([^"]*)">/);
    expect(m, `${p} has a meta description`).toBeTruthy();
    expect(decode(m[1]).length, `${p}: "${decode(m[1])}"`).toBeLessThanOrEqual(160);
  }
});

test('CHECK-RUNNER-10: every page, the proposal included, has a skip link to an element that exists', () => {
  for (const p of PAGES) {
    const html = read(p);
    const skip = html.match(/<a class="skip" href="#([\w-]+)">/);
    expect(skip, `${p} has a skip link`).toBeTruthy();
    expect(html, `${p}: the skip link's target #${skip[1]} exists`).toMatch(new RegExp(`\\bid="${skip[1]}"`));
  }
});

/* ============================================================
   BROWSER TESTS: the pages as they render, offline
   ============================================================ */

/* OFFLINE. site.js beacons every page view to https://app.nevamis.ca, which
   writes a row in production. That origin is answered here with the 204 the
   real endpoint gives, fulfilled rather than aborted so it logs no error. */
async function offline(ctx) {
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
}

/* A config with one figure moved, served in place of the real one: a page
   that renders from the config shows the moved figure, and a page that types
   its own does not. */
async function withMovedConfig(ctx, edit) {
  const src = read('pricing-config.js');
  const moved = edit(src);
  expect(moved, 'the config edit applied').not.toBe(src);
  await ctx.route(/\/pricing-config\.js(?:\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: moved }));
}

/* The page's heading and its meta answer the same question: you start on a
   plan or on one automation sold alone, so the heading does not drop one. */
/* Each blurb is read after the item's status ("coming", or its price), so a
   coming item's blurb does not say "coming" again, and no blurb shouts. */
/* The add-on list renders before the plan cards, in the same script, so a bad
   catalog entry must cost at most the list, never the cards a buyer pays from. */
test('PRICING-7: rendered with scripts, no buyer page says pilot, trial, free period or discount', async ({ browser }) => {
  const ctx = await browser.newContext();
  await offline(ctx);
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto('/' + p);
    const text = flat(await page.locator('body').innerText());
    const rules = TRY_IT_PAGES.includes(p) ? [...BANNED_WORDS, /\bfree\b/i] : BANNED_WORDS;
    for (const re of rules) expect(text, `${p} says ${re}`).not.toMatch(re);
  }
  await ctx.close();
});

/* G4: each changed page at 1440 and 390, with no sideways scroll and no
   console error. Screenshots go to NV_SHOTS when it is set. */
for (const width of [1440, 390]) {
  test(`every buyer page loads clean at ${width} wide`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await offline(ctx);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    for (const p of PAGES) {
      await page.goto('/' + p);
      await page.waitForLoadState('networkidle');
      const sideways = await page.evaluate(() => document.scrollingElement.scrollWidth - document.documentElement.clientWidth);
      expect(sideways, `${p} at ${width}: scrolls sideways by ${sideways}px`).toBeLessThanOrEqual(0);
      if (process.env.NV_SHOTS) {
        fs.mkdirSync(process.env.NV_SHOTS, { recursive: true });
        await page.evaluate(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')));
        await page.screenshot({ path: path.join(process.env.NV_SHOTS, `${p.replace('.html', '')}-${width}.png`), fullPage: true });
      }
    }
    expect(errors, errors.join('\n')).toEqual([]);
    await ctx.close();
  });
}

/* FUNNEL AUDIT ITEM 10 (2026-10-09). A module on its own is not bought from
   a page: the engine's signup records the request ("we set it up with you
   under your agreement") and /portal/activate says it is "not bought on
   this page, and we will be in touch". So no module control may promise a
   purchase: it says "Request it", in the no-script list and the render. */
/* FUNNEL AUDIT ITEM 1: the pricing lede opens with the floor, rendered from
   the config, and its no-script copy is the render. */