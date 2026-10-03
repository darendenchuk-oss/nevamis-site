/* ============================================================
   ONE RULE ACROSS EVERY BUYER AND PLATFORM PAGE
   (polish-buyer-platform, round 2 of the whole-site audit of 2026-10-03,
   decision #69).

   Round 1 split these ten files between two leaves (site-live-buyer and
   site-live-platform), and each could hold a rule only over its own half.
   The audit's rules do not split that way: the Roadmap said "takes the job
   and the time they want" in the same week the pricing page stopped saying
   it, because only one of the two pages was under the guard. This file
   holds each rule over all ten at once, on every surface a reader or a
   machine meets: the visible text, the attributes, the JSON-LD, and every
   string a page's own script or a config can render.

     PRICING-9       the front desk captures the request and the times that
                     suit; nothing says it takes the job, takes it down, or
                     takes the time the caller wants, which reads as a
                     booking a client agent cannot make.
     MACHINE-19      no "pilot", "trial" or "free period", not even to deny
                     one; "discount" only inside a denial of offering one
                     (the driver's ruling: "it never ... offers a discount").
     MACHINE-24      at most one BreadcrumbList per page, and it is the
                     generated one; every indexable page has it.
     MACHINE-25      indexable pages carry og:url (their canonical), og:type
                     and og:site_name, and no title narrows the market to
                     one city: Nevamis sells Canada-wide from Edmonton.
     CHECK-RUNNER-7  every description a search result or a share card
                     shows is 160 characters or fewer.
     (site rule)     no em dash in anything rendered.
     polish-1        the add-on list on pricing.html prints a price only
                     while P.publishedPricing is on, the switch the plan
                     cards already obey.

   SCOPE is the ten files this leaf owns. The same rules reach files other
   polish leaves own and fix in parallel (the homepage sources, the content
   generator, llms.txt); a test here over those would be red for work no
   commit here can do.

   The file tests open no browser and reach no network; SITE_ROOT=<a
   checkout> points them at another tree, which is how they were shown red
   on the train as it was before this change. The browser tests answer the
   engine origin themselves, so no run writes a visit into production. Run
   it on its own port:
     NV_PORT=3373 npx playwright test tests/polish-buyer-platform.spec.js
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

const PAGES = ['pricing.html', 'how-you-start.html', 'pilot.html', 'proposal.html', 'book.html',
  'about.html', 'coming-soon.html', 'revenue-engine.html'];
const CONFIGS = ['pricing-config.js', 'roadmap-config.js'];

function config() {
  const sandbox = { window: {} };
  vm.runInNewContext(read('pricing-config.js'), sandbox, { timeout: 1000 });
  return sandbox.window.NV_PRICING;
}

/* ---------- reading a file the way a reader and a machine read it ---------- */

const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', middot: '·', rsaquo: '›',
  lsaquo: '‹', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', ndash: '–', mdash: '—' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
const flat = (s) => s.replace(/\s+/g, ' ').trim();

/* Every string literal a script carries, comments stripped first so a
   sentence a comment quotes (the replaced wording, kept for the next editor)
   is not counted as copy. Template literals are read too: the pages build
   markup with them. */
function scriptStrings(js) {
  const code = js.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1');
  return [...code.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`]*)`/g)]
    .map((m) => m[1] ?? m[2] ?? m[3]).filter((s) => /[a-z]{3,}\s+[a-z]{2,}/i.test(s));
}

const BLOCK = /<\/?(?:p|li|ul|ol|div|h[1-6]|br|td|th|tr|table|details|summary|section|header|footer|main|nav|title|label|button|option|form|dd|dt|figcaption)\b[^>]*>/gi;

/* Every surface of one file, each tagged with where it was read. */
function surfacesOf(file) {
  const out = [];
  const src = read(file);
  if (file.endsWith('.js')) {
    for (const s of scriptStrings(src)) out.push({ file, where: 'config string', text: s });
    return out;
  }
  const html = src.replace(/<!--[\s\S]*?-->/g, ' ');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/application\/ld\+json/.test(m[1])) {
      const walk = (v, at) => {
        if (typeof v === 'string') out.push({ file, where: `JSON-LD ${at}`, text: v });
        else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
        else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`);
      };
      walk(JSON.parse(m[2]), '');
    } else {
      for (const s of scriptStrings(m[2])) out.push({ file, where: 'script string', text: s });
    }
  }
  const body = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  for (const m of body.matchAll(/\b(?:content|alt|aria-label|title|placeholder)="([^"]{8,})"/g)) {
    out.push({ file, where: 'attribute', text: decode(m[1]) });
  }
  for (const part of body.split(BLOCK)) {
    const t = flat(decode(part.replace(/<[^>]*>/g, ' ')));
    if (t) out.push({ file, where: 'visible text', text: t });
  }
  return out;
}
const allSurfaces = () => [...PAGES, ...CONFIGS].flatMap(surfacesOf);
const sentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z(])/).map(flat).filter(Boolean);
const meta = (html, attr, key) => (html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)">`)) || [])[1];
const indexable = (html) => !/<meta name="robots" content="noindex/.test(html);

/* ============================================================
   FILE TESTS: no browser, no network
   ============================================================ */

/* A booking, in the words the audit found and their siblings: the job (or
   the time, or the slot) taken, taken down, captured as "the job", or the
   time the caller "wants". What is true is the request and the times that
   suit, captured for the owner to confirm. */
const BOOKING = [
  /\btakes? (?:the job|the time|the slot|the booking)\b/i,
  /\b(?:job|jobs|it|time|times)\b[^.]{0,40}\btaken down\b|\btakes? (?:it|the job|them) down\b/i,
  /\bcaptures? the job\b/i,
  /\b(?:the )?times? (?:they|the caller|the customer|callers) wants?\b/i,
];

test('PRICING-9: no surface of any owned file has the front desk take the job or the time the caller wants', () => {
  const bad = [];
  for (const s of allSurfaces()) {
    for (const re of BOOKING) {
      const m = s.text.match(re);
      if (m) bad.push(`${s.file} ${s.where}: "${m[0]}" in "${s.text.slice(Math.max(0, m.index - 80), m.index + 80)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* The rule above would pass on a page that said nothing about the front
   desk. These are the sentences the hand-over named, so each still says
   what the front desk does, in the true words. */
test('PRICING-9: each surface the hand-over named still describes the front desk, as capturing the request', () => {
  const said = (file) => surfacesOf(file).map((s) => s.text).join(' ');
  for (const file of ['about.html', 'coming-soon.html', 'revenue-engine.html', 'roadmap-config.js', 'proposal.html']) {
    expect(said(file), `${file} says what the front desk captures`).toMatch(/\b(?:captures? the request|request captured)\b/i);
  }
});

test('MACHINE-19: no owned file says pilot, trial or free period, and "discount" only to deny offering one', () => {
  const bad = [];
  for (const s of allSurfaces()) {
    for (const sentence of sentences(s.text)) {
      const word = sentence.match(/\bpilots?\b|\btrials?\b|\bfree periods?\b/i);
      if (word) bad.push(`${s.file} ${s.where}: "${word[0]}" in "${sentence.slice(0, 200)}"`);
      const disc = sentence.match(/\bdiscount(?:s|ed)?\b/i);
      if (disc && !/\b(?:never|not|no|nor)\b[^.]*\bdiscount/i.test(sentence.slice(0, disc.index + disc[0].length))) {
        bad.push(`${s.file} ${s.where}: "${disc[0]}" outside a denial in "${sentence.slice(0, 200)}"`);
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('MACHINE-24: a page carries at most one BreadcrumbList, the generated one, and an indexable page carries it', () => {
  const bad = [];
  for (const p of PAGES) {
    const html = read(p).replace(/<!--(?! \/?generated:schema)[\s\S]*?-->/g, ' ');
    const gen = /<!-- generated:schema -->([\s\S]*?)<!-- \/generated:schema -->/.exec(html);
    const outside = gen ? html.replace(gen[0], ' ') : html;
    const hand = (outside.match(/"@type"\s*:\s*"BreadcrumbList"/g) || []).length;
    const generated = gen ? (gen[1].match(/"@type"\s*:\s*"BreadcrumbList"/g) || []).length : 0;
    if (hand) bad.push(`${p}: ${hand} hand-written BreadcrumbList`);
    if (generated > 1) bad.push(`${p}: ${generated} generated BreadcrumbLists`);
    if (indexable(html) && generated !== 1) bad.push(`${p}: indexable, but carries ${generated} generated BreadcrumbList`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* A title narrows the market when one of its parts is just a place, or
   sells "for" a place: "Pricing | Nevamis | Plans for Edmonton trades",
   "Book a call | Nevamis | Edmonton". A title that states a fact about the
   company ("Founded and run by Daren in Edmonton") is not a market. */
const NARROWS = /(?:^|\|)\s*(?:Edmonton|Alberta)(?:,\s*(?:AB|Alberta))?\s*(?:\||$)|\bfor (?:Edmonton|Alberta)(?:'s)? (?:trades|businesses|contractors)\b/i;

test('MACHINE-25: indexable pages carry og:url, og:type and og:site_name, and no title narrows to one city', () => {
  const bad = [];
  for (const p of PAGES) {
    const html = read(p);
    const titles = [
      ['<title>', (html.match(/<title>([^<]*)<\/title>/) || [])[1]],
      ['og:title', meta(html, 'property', 'og:title')],
      ['twitter:title', meta(html, 'name', 'twitter:title')],
      ...surfacesOf(p).filter((s) => /^JSON-LD .*\.name$/.test(s.where) && /\|/.test(s.text)).map((s) => [s.where, s.text]),
    ];
    for (const [where, t] of titles) if (t && NARROWS.test(decode(t))) bad.push(`${p} ${where}: "${decode(t)}"`);
    if (!indexable(html)) continue;
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
    if (meta(html, 'property', 'og:url') !== canonical) bad.push(`${p}: og:url ${meta(html, 'property', 'og:url')} is not its canonical ${canonical}`);
    if (meta(html, 'property', 'og:type') !== 'website') bad.push(`${p}: og:type is ${meta(html, 'property', 'og:type')}`);
    if (meta(html, 'property', 'og:site_name') !== 'Nevamis') bad.push(`${p}: og:site_name is ${meta(html, 'property', 'og:site_name')}`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('CHECK-RUNNER-7: every search and share description is 160 characters or fewer', () => {
  const bad = [];
  for (const p of PAGES) {
    const html = read(p);
    expect(meta(html, 'name', 'description'), `${p} has a meta description`).toBeTruthy();
    for (const [attr, key] of [['name', 'description'], ['property', 'og:description'], ['name', 'twitter:description']]) {
      const d = meta(html, attr, key);
      if (d && decode(d).length > 160) bad.push(`${p} ${key}: ${decode(d).length} characters: "${decode(d)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('no owned file renders an em dash', () => {
  const bad = allSurfaces().filter((s) => /\u2014/.test(s.text))
    .map((s) => `${s.file} ${s.where}: "${s.text.slice(0, 160)}"`);
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ============================================================
   BROWSER TESTS: the pages as they render, offline
   ============================================================ */

async function offline(ctx) {
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
}
async function withConfig(ctx, edit) {
  const src = read('pricing-config.js');
  const moved = edit(src);
  expect(moved, 'the config edit applied').not.toBe(src);
  await ctx.route(/\/pricing-config\.js(?:\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: moved }));
}

test('polish-1: with prices unpublished, the add-on list hides its figures and Start links, as the plan cards do', async ({ browser }) => {
  const P = config();
  expect(P.publishedPricing, 'the live config publishes prices; this test flips it').toBe(true);
  const sellableAlone = P.addOns.filter((a) => a.sellable === true && a.monthly > 0);
  expect(sellableAlone.length, 'the config sells at least one add-on').toBeGreaterThan(0);

  /* Published: the list prints each sellable add-on's monthly. */
  const live = await browser.newContext();
  await offline(live);
  const on = await live.newPage();
  await on.goto('/pricing.html');
  for (const a of sellableAlone) {
    await expect(on.locator('#addOnList > li', { hasText: a.name })).toContainText(P.money(a.monthly) + '/month');
  }

  /* Unpublished: no figure anywhere in the list or on the cards. */
  const ctx = await browser.newContext();
  await offline(ctx);
  await withConfig(ctx, (s) => s.replace(/publishedPricing:\s*true/, 'publishedPricing: false'));
  const off = await ctx.newPage();
  await off.goto('/pricing.html');
  await expect(off.locator('#plansFallback')).toHaveCount(0);
  const list = flat(await off.locator('#addOnList').innerText());
  expect(list, 'the add-on list prints no price while prices are unpublished').not.toMatch(/C\$\s?\d/);
  await expect(off.locator('#addOnList a.addon-start')).toHaveCount(0);
  for (const a of sellableAlone) {
    await expect(off.locator('#addOnList > li', { hasText: a.name })).toContainText('quoted per client');
  }
  /* The cards' price lines, the half of the switch that already held: what
     the list now matches. (Their overage rate is a separate line.) */
  const priceLines = (await off.locator('#plans .price').allInnerTexts()).map(flat);
  expect(priceLines.length, 'the cards rendered their price lines').toBeGreaterThan(0);
  for (const line of priceLines) expect(line, 'a plan card price line').not.toMatch(/C\$\s?\d/);
  await live.close(); await ctx.close();
});

/* G4: each owned page at 1440 and 390, with no sideways scroll and no
   console error. Screenshots go to NV_SHOTS when it is set. */
for (const width of [1440, 390]) {
  test(`every owned page loads clean at ${width} wide`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await offline(ctx);
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    for (const p of PAGES) {
      await page.goto('/' + p + (p === 'proposal.html' ? '?plan=pro&to=Example%20Plumbing' : ''));
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
