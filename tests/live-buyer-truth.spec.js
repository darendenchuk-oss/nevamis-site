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
          Partnership's agreement-within-ranges exception.
     LEGAL-9     the terms note says the one-time fee is charged when the plan
          or add-on starts, because it covers an add-on added later.
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
const PAGES = ['how-you-start.html', 'pilot.html', 'pricing.html', 'book.html', 'proposal.html'];
const TRY_IT_PAGES = ['how-you-start.html', 'pilot.html'];

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

test('PRICING-8: how-you-start loads pricing-config.js and types no figure outside the two lines it rewrites', () => {
  const html = read('how-you-start.html');
  expect(html, 'how-you-start.html must load the config every price renders from').toMatch(/<script src="pricing-config\.js"><\/script>/);
  /* Take out the two sentences the script rewrites; nothing left may be a price. */
  const rest = html.replace(/<span id="hys(?:Recommended|Partnership)">[\s\S]*?<\/span>/g, ' ');
  const typed = [...visibleText(rest).matchAll(/C\$\s?[\d,]+/g)].map((m) => m[0]);
  expect(typed, `figures typed outside the rendered lines: ${typed.join(', ')}`).toEqual([]);
  expect(visibleText(html), 'the page still states the two figures, rendered').toMatch(/C\$[\d,]+/);
});

test('PRICING-8: how-you-start\'s no-script figures equal what the config renders', () => {
  const P = config();
  const html = read('how-you-start.html');
  const span = (id) => {
    const m = html.match(new RegExp(`<span id="${id}">([\\s\\S]*?)</span>`));
    return m && flat(decode(m[1]));
  };
  /* Derived the way the page derives it: the plan flagged recommended, and
     the one offered by invitation, found by their flags. */
  const rec = P.plans.find((p) => p.recommended);
  const inv = P.plans.find((p) => p.selfServe === false);
  expect(span('hysRecommended')).toBe(`On the ${rec.name}, the recommended plan, that is ${P.startLine(rec)}`);
  const line = P.startLine(inv);
  const banded = Array.isArray(inv.launchRange) || Array.isArray(inv.monthlyRange);
  expect(span('hysPartnership')).toBe(`On the ${inv.name}, offered by invitation, both are set in your agreement`
    + (banded ? ' within published ranges: ' : ': ') + line.charAt(0).toLowerCase() + line.slice(1));
});

test('PRICING-9: no sentence a machine or a buyer reads has the agent take the job or the time the caller wants, even beside "you confirm"', () => {
  const booking = /\btakes? (?:the job|the time|the slot)\b|\b(?:the )?times? (?:they|the caller) wants?\b/i;
  const bad = [];
  for (const s of surfaces()) {
    for (const sentence of sentences(s.text)) {
      if (booking.test(sentence)) bad.push(`${s.page} ${s.where}: "${sentence.slice(0, 200)}"`);
    }
  }
  /* The proposal writes its summary line from script too. */
  for (const lit of read('proposal.html').matchAll(/"([^"\n]{40,})"/g)) {
    for (const sentence of sentences(lit[1])) {
      if (booking.test(sentence)) bad.push(`proposal.html script: "${sentence.slice(0, 200)}"`);
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

test('BOOK-2: every "only recurring charges" sentence names the Partnership\'s agreed share, and never a rate', () => {
  const only = /\bonly (?:other )?(?:recurring )?charges?\b/i;
  const bad = [];
  let seen = 0;
  for (const s of surfaces()) {
    for (const sentence of sentences(s.text)) {
      if (!only.test(sentence)) continue;
      seen++;
      if (!/\bPerformance Partnership\b/.test(sentence) || !/\bagreed share\b/i.test(sentence)) {
        bad.push(`${s.page} ${s.where}: leaves out the Partnership's share: "${sentence.slice(0, 220)}"`);
      }
      if (/\d+(?:\.\d+)?\s*(?:%|per ?cent\b)/i.test(sentence)) bad.push(`${s.page} ${s.where}: publishes a rate: "${sentence.slice(0, 220)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
  expect(seen, 'the pages still state what recurs past the start').toBeGreaterThan(2);
});

test('BOOK-5: "published before you decide" never stands without the Partnership\'s agreement', () => {
  const bad = [];
  for (const s of surfaces()) {
    for (const sentence of sentences(s.text)) {
      if (/\bpublished before you (?:decide|commit)\b/i.test(sentence)
        && !(/\bPerformance Partnership\b/.test(sentence) && /\bagreement within published ranges\b/i.test(sentence))) {
        bad.push(`${s.page} ${s.where}: "${sentence.slice(0, 220)}"`);
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('LEGAL-9: the terms note charges the one-time fee when the plan or add-on starts, not beside the first month', () => {
  const note = config().terms.note;
  expect(note).toMatch(/\badd-on\b/);
  expect(note, 'an add-on added later is not charged "beside your first month"').not.toMatch(/\bbeside (?:your|the) first month\b/i);
  /* v7 (2026-10-03): only the Performance Partnership carries a fee, and
     its card and the terms band state it, so the term note names no fee at
     all. Where a note does name one, it is charged when the plan or add-on
     starts. And the note says nothing about a first month free: every
     renderer prints it to every buyer, and that offer is gated. */
  if (/Launch & Implementation/.test(note)) expect(note).toMatch(/\bcharged once when the plan or add-on starts\b/);
  expect(note).not.toMatch(/\bfree month\b|\bfirst month (?:is )?free\b|\bmonths? free\b/i);
  /* The pricing page's no-script copy says the same words. */
  const m = read('pricing.html').match(/<p id="termsNote"[^>]*>([\s\S]*?)<\/p>/);
  expect(m && flat(decode(m[1]))).toBe(note);
});

test('PROPOSAL-4: robots.txt lets crawlers fetch the proposal, so its noindex is read', () => {
  const robots = read('robots.txt');
  expect(robots).not.toMatch(/^\s*Disallow:\s*\/proposal\.html/im);
  expect(read('proposal.html')).toMatch(/<meta name="robots" content="noindex[^"]*">/);
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
  expect(read('pricing.html').match(/<title>([^<]*)<\/title>/)[1]).not.toMatch(/Edmonton/);
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

test('PRICING-14, WALK-LIVE-2: the no-script add-on list is the config, line for line, with a Start link on every module sold alone', () => {
  const P = config();
  const list = read('pricing.html').match(/<ul id="addOnList"[^>]*>([\s\S]*?)<\/ul>/);
  expect(list, 'pricing.html carries #addOnList').toBeTruthy();
  const items = [...list[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  expect(items.length, 'one line per add-on in the config').toBe(P.addOns.length);
  const selling = P.sellable && P.publishedPricing;
  P.addOns.forEach((a, i) => {
    /* The renderer's own rule: a figure only while prices are published,
       "quoted per client" for a sellable add-on while they are not. */
    const sellableNow = a.sellable === true && a.monthly > 0;
    const priced = sellableNow && !!P.publishedPricing;
    const parts = [a.name];
    /* The whole sentence only where it says more than the label (v7: a
       module's fee is 0, and the label is then the whole price). */
    if (priced) parts.push(P.money(a.monthly) + '/month', ...(P.launchPart(a) ? [P.startLine(a).replace(/\.$/, '')] : []));
    else if (sellableNow) parts.push('quoted per client');
    else parts.push(a.partnership ? 'on the Performance Partnership' : 'coming');
    parts.push(a.blurb.charAt(0).toLowerCase() + a.blurb.slice(1));
    const text = flat(decode(items[i].replace(/<a\b[\s\S]*?<\/a>/g, '')));
    expect(text, `line ${i + 1}, ${a.name}`).toBe(parts.join(' · '));
    const links = [...items[i].matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    if (priced && a.soldAlone === true && selling) {
      expect(links, `${a.name} is sold alone, so its line links to its own signup`)
        .toEqual([`https://app.nevamis.ca/signup?coverage=${a.id}`]);
    } else {
      expect(links, `${a.name} is not sold alone, so its line carries no Start link`).toEqual([]);
    }
  });
  /* The one the audit found unreachable. */
  expect(list[1]).toContain('href="https://app.nevamis.ca/signup?coverage=missed_call_recovery"');
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

test('PRICING-8: how-you-start renders a moved price from the config, and with the real one renders its own static copy', async ({ browser }) => {
  const ctx = await browser.newContext();
  await offline(ctx);
  const page = await ctx.newPage();
  await page.goto('/how-you-start.html');
  const html = read('how-you-start.html');
  for (const id of ['hysRecommended', 'hysPartnership']) {
    const fallback = flat(decode(html.match(new RegExp(`<span id="${id}">([\\s\\S]*?)</span>`))[1]));
    await expect(page.locator('#' + id), `#${id} renders exactly its no-script copy`).toHaveText(fallback);
  }
  /* Move the recommended plan's monthly; the page must follow it. */
  const ctx2 = await browser.newContext();
  await offline(ctx2);
  await withMovedConfig(ctx2, (s) => s.replace(/(id: "pro", name: "AI Front Desk", recommended: true,\s*monthly: )\d+/, '$11234'));
  const moved = await ctx2.newPage();
  await moved.goto('/how-you-start.html');
  await expect(moved.locator('#hysRecommended')).toContainText('then C$1,234 a month');
  await ctx.close(); await ctx2.close();
});

test('PRICING-14: pricing renders the add-on list from the config, and the render is the no-script copy', async ({ browser }) => {
  const ctx = await browser.newContext();
  await offline(ctx);
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  const list = read('pricing.html').match(/<ul id="addOnList"[^>]*>([\s\S]*?)<\/ul>/)[1];
  const fallback = [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => flat(decode(m[1].replace(/<[^>]+>/g, ''))));
  const rendered = (await page.locator('#addOnList > li').allTextContents()).map(flat);
  expect(rendered).toEqual(fallback);
  const hrefs = await page.locator('#addOnList a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toEqual([...list.matchAll(/href="([^"]+)"/g)].map((m) => m[1]));
  /* The rendered Start link reports which module was reached for. */
  await expect(page.locator('#addOnList a[href$="coverage=missed_call_recovery"]'))
    .toHaveAttribute('data-evt', 'plan_buy_click_missed_call_recovery');

  const ctx2 = await browser.newContext();
  await offline(ctx2);
  await withMovedConfig(ctx2, (s) => s.replace(/(id: "missed_call_recovery", name: "Missed-Call Recovery",\s*monthly: )\d+/, '$1999'));
  const moved = await ctx2.newPage();
  await moved.goto('/pricing.html');
  await expect(moved.locator('#addOnList > li', { hasText: 'Missed-Call Recovery' })).toContainText('C$999/month');
  await ctx.close(); await ctx2.close();
});

/* The page's heading and its meta answer the same question: you start on a
   plan or on one automation sold alone, so the heading does not drop one. */
test('PRICING-7: how-you-start\'s heading names both ways to start that its meta names', () => {
  const html = read('how-you-start.html');
  const h1 = flat(decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '')));
  const meta = html.match(/<meta name="description" content="([^"]*)"/)[1];
  expect(meta).toMatch(/\bsingle automation\b/);
  expect(h1).toMatch(/\bplan\b/);
  expect(h1).toMatch(/\bsingle automation\b/);
});

/* Each blurb is read after the item's status ("coming", or its price), so a
   coming item's blurb does not say "coming" again, and no blurb shouts. */
test('PRICING-14: an add-on line says "coming" once and shouts no word', () => {
  const bad = [];
  for (const a of config().addOns) {
    const priced = a.sellable === true && a.monthly > 0;
    if (!priced && !a.partnership && /\bcoming\b/i.test(a.blurb)) bad.push(`${a.id}: says "coming" twice`);
    const shout = (a.blurb || '').match(/\b(?!CRM\b|SMS\b|SEO\b)[A-Z]{2,}\b/);
    if (shout) bad.push(`${a.id}: "${shout[0]}" in capitals`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* The add-on list renders before the plan cards, in the same script, so a bad
   catalog entry must cost at most the list, never the cards a buyer pays from. */
test('PRICING-14: an add-on with no blurb still renders, and the plan cards still render', async ({ browser }) => {
  const ctx = await browser.newContext();
  await offline(ctx);
  await withMovedConfig(ctx, (s) => s.replace(/(id: "get_paid", name: "Get-Paid Autopilot",[\s\S]*?soldAlone: true),\s*blurb: "[^"]*"/, '$1'));
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  await expect(page.locator('#plansFallback')).toHaveCount(0);
  expect(await page.locator('#plans > *').count()).toBeGreaterThan(0);
  /* Rendered, not the static copy left in place: only the render writes the
     per-item event name, and only the static copy carries the missing blurb. */
  const row = page.locator('#addOnList > li', { hasText: 'Get-Paid Autopilot' });
  await expect(row).toContainText('C$500/month');
  await expect(row).not.toContainText('overdue invoices');
  await expect(row.locator('a')).toHaveAttribute('data-evt', 'plan_buy_click_get_paid');
  await ctx.close();
});

test('PRICING-14: an add-on entry that throws leaves the static list and still lets the plan cards render', async ({ browser }) => {
  const ctx = await browser.newContext();
  await offline(ctx);
  /* Appended after the config: the last entry throws the moment the
     renderer reads whether it is sellable. */
  await withMovedConfig(ctx, (s) => s + '\nwindow.NV_PRICING.addOns.push(Object.defineProperty({ id: "broken", name: "Broken" }, "sellable", { get: function () { throw new Error("bad entry"); } }));\n');
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  await expect(page.locator('#plansFallback')).toHaveCount(0);
  expect(await page.locator('#plans > *').count()).toBeGreaterThan(0);
  const list = read('pricing.html').match(/<ul id="addOnList"[^>]*>([\s\S]*?)<\/ul>/)[1];
  const fallback = [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => flat(decode(m[1].replace(/<[^>]+>/g, ''))));
  expect((await page.locator('#addOnList > li').allTextContents()).map(flat)).toEqual(fallback);
  await ctx.close();
});

test('PRICING-9: the Product structured data the pricing page writes does not read as a booking', async ({ browser }) => {
  const ctx = await browser.newContext();
  await offline(ctx);
  const page = await ctx.newPage();
  await page.goto('/pricing.html');
  const product = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((s) => { try { return JSON.parse(s.textContent); } catch { return null; } })
    .flat().find((x) => x && x['@type'] === 'Product'));
  expect(product, 'the page writes its Product node').toBeTruthy();
  expect(product.description).not.toMatch(/\btakes? (?:the job|the time)\b|\bthe time they want\b|\bbooks?\b|\bbooking\b|\bschedul/i);
  await ctx.close();
});

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
