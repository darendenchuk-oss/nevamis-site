/* ============================================================
   EVERY HOMEPAGE SURFACE KEEPS THE WHOLE-SITE AUDIT'S RULES
   (polish-home, round 2 of the live website update, 2026-10-03, decision #69).

   The six live leaves ran in parallel, so each fixed only its own files and
   handed the homepage's siblings over. tests/home-door-order.spec.js holds
   the homepage's own story (the door order, "trial" in the visible copy,
   the calendar FAQ opening "No."). This file holds the CROSS-CUTTING rules
   the audit applied to every page, across every surface of the homepage a
   person or a machine reads, so a sibling sentence anywhere fails, not only
   the one the audit quoted:

     PRICING-9   no sentence says the agent takes the job, the time or the
                 slot, or the time the caller (or "they") wants: it reads as a
                 booking even beside "you confirm", and a client agent cannot
                 book. It takes down the request and the times that suit.
     MACHINE-19  no "pilot", "trial" or "free period", even to deny one; the
                 word "discount" only inside a sentence that denies what the
                 product does (the driver's ruling, 2026-10-03), so a FAQ
                 question, which answer engines quote alone, never carries it.
     MACHINE-24  at most one BreadcrumbList.
     MACHINE-25  og:url (the canonical), og:type, og:site_name and og:title
                 are present, the title does not narrow to one city, and no
                 surface makes an unmeasured speed claim ("within seconds",
                 "instantly", "first ring": the claims ledger retired the
                 instant-answer claim CLM-02). One sibling is pinned, not
                 fixed, because its source is another leaf's file: the
                 Organization/Product JSON-LD description that
                 scripts/build-schema.mjs writes ("texting and emailing the
                 owner each call's details within seconds"), polish-machine's
                 to measure or drop. The pin matches that one sentence only,
                 so a speed claim anywhere else still fails.
     CHECK-RUNNER-7  the meta description is 160 characters or fewer.

   The surfaces: what a visitor reads with scripts off, each FAQ question and
   answer, the title, every description/og/twitter meta, every string in the
   JSON-LD, and the search index's records for "/": their title (t), text (d)
   and page-body keywords (k), which build-search-index.mjs builds from this
   page, so a rule broken in a stale index fails here as well as in
   check-generator-drift. The film's cards carry no copy of their own:
   film-3.js reads every caption verbatim from the plain-DOM truth copy in the
   markup (source.html's pane docs), which the visible text above already
   reads.

   WHERE THIS RUNS: locally, as a proof spec (npx playwright test, or the
   command below), like tests/home-door-order.spec.js. The site's CI
   (.github/workflows/verify.yml, another leaf's file) runs only
   tests/pages.spec.js, so CI does not run this file: a regression merges
   green unless someone runs it. The tests open no browser and reach no
   network, so adding it to verify.yml is one word on that step.
   SITE_ROOT=<a checkout> points them at another tree, which is how they were
   shown red on the site train as it was before this change:
     SITE_ROOT=<checkout> NV_PORT=3373 npx playwright test tests/polish-home.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.SITE_ROOT
  ? path.resolve(process.env.SITE_ROOT)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

/* home.html is what compose.py writes and index.html is what nevamis.ca
   serves; a rule that holds on one and not the other is a missed promote. */
const PAGES = ['home.html', 'index.html'];

/* ---------- reading the page the way a visitor and a machine read it ---------- */

const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', middot: '·', rsaquo: '›',
  lsaquo: '‹', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', ndash: '–', mdash: '—' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
const flat = (s) => s.replace(/\s+/g, ' ').trim();

/* One block per list item, paragraph, heading, FAQ question and so on, so a
   list item with no full stop never runs on into the next one. */
const BLOCK_END = /<\/(?:li|p|dt|dd|h[1-6]|div|section|article|td|th|ul|ol|main|header|footer|nav|figcaption|summary|details|button)>|<br\s*\/?>/gi;
function visibleBlocks(html) {
  return decode(html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(BLOCK_END, '\u0001')
    .replace(/<[^>]+>/g, ' '))
    .split('\u0001').map(flat).filter(Boolean);
}

function jsonLd(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
    .flatMap((m) => [].concat(JSON.parse(m[1])));
}

/* Every string a machine reads off the page without rendering it. */
function machineStrings(html) {
  const out = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) out.push({ where: '<title>', text: decode(title[1]) });
  for (const m of html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/gi)) {
    if (/^(?:description|og:|twitter:)/i.test(m[1])) out.push({ where: `<meta ${m[1]}>`, text: decode(m[2]) });
  }
  const walk = (v, at) => {
    if (typeof v === 'string') out.push({ where: `JSON-LD ${at}`, text: v });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${at}.${k}`);
  };
  jsonLd(html).forEach((node, i) => walk(node, `[${i}]`));
  return out;
}

/* The search index's records for the homepage, as answer engines and the
   site search read them. */
function indexStrings() {
  const idx = JSON.parse(read('search-index.json'));
  const records = Array.isArray(idx) ? idx : Object.values(idx).find(Array.isArray);
  /* t is the record's title, d its text and k the page-body keywords the
     site search matches on; each is a copy of homepage words, so each can
     carry a sibling. */
  return records.filter((r) => r.u === '/')
    .flatMap((r) => [['title', r.t], ['text', r.d], ['keywords', r.k]]
      .filter(([, text]) => typeof text === 'string' && text)
      .map(([field, text]) => ({ page: 'search-index.json', where: `/ ${field}`, text })));
}

function surfaces() {
  const out = [];
  for (const p of PAGES) {
    const html = read(p);
    for (const text of visibleBlocks(html)) out.push({ page: p, where: 'visible text', text });
    for (const s of machineStrings(html)) out.push({ page: p, ...s });
  }
  return [...out, ...indexStrings()];
}

const sentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z(])/).map(flat).filter(Boolean);

/* ============================================================ */

test('the surfaces are really read: both pages, their JSON-LD FAQ and the search index', () => {
  /* A reader that silently finds nothing would pass every rule below. */
  const all = surfaces();
  for (const p of PAGES) {
    expect(all.filter((s) => s.page === p && s.where === 'visible text').length, `${p} visible blocks`).toBeGreaterThan(100);
    expect(all.filter((s) => s.page === p && /\.acceptedAnswer\.text$/.test(s.where)).length, `${p} FAQPage answers`).toBeGreaterThan(5);
  }
  expect(all.filter((s) => s.page === 'search-index.json').length, 'search-index records for /').toBeGreaterThan(5);
  expect(all.filter((s) => s.where === '/ keywords').length, "the search index's page-body keywords for /").toBeGreaterThan(5);
  /* The film's pane docs are part of what is read. */
  expect(all.some((s) => s.page === 'index.html' && /^Answers your line 24\/7\b/.test(s.text)), "the film's Capture pane").toBe(true);
});

test('PRICING-9: no homepage sentence has the agent take the job, the time or the slot the caller wants, even beside "you confirm"', () => {
  const booking = /\btak(?:e|es|ing) (?:the job|the time|the slot|a booking)\b|\b(?:the )?times? (?:they|the caller|callers|customers?) wants?\b/i;
  const bad = [];
  for (const s of surfaces()) {
    for (const sentence of sentences(s.text)) {
      if (booking.test(sentence)) bad.push(`${s.page} ${s.where}: "${sentence.slice(0, 200)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('MACHINE-19: no homepage surface says pilot, trial or free period, and "discount" only inside a denial', () => {
  /* "Autopilot" is a product name and is not the word "pilot", which \b
     keeps apart. */
  const banned = [/\bpilots?\b/i, /\btrials?\b/i, /\bfree periods?\b/i];
  const denial = /\b(?:no|not|never|nor|without)\b|n't\b/i;
  const bad = [];
  for (const s of surfaces()) {
    for (const re of banned) {
      const m = s.text.match(re);
      if (m) bad.push(`${s.page} ${s.where}: "${m[0]}" in "${s.text.slice(Math.max(0, m.index - 60), m.index + 60)}"`);
    }
    for (const sentence of sentences(s.text)) {
      if (/\bdiscount(?:s|ed|ing)?\b/i.test(sentence) && !denial.test(sentence)) {
        bad.push(`${s.page} ${s.where}: "discount" outside a denial: "${sentence.slice(0, 200)}"`);
      }
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('MACHINE-25: no homepage surface claims a speed nobody measured (within seconds, instantly, first ring)', () => {
  const speed = /\b(?:in|within) (?:a few |mere |just )?(?:seconds?|moments?)\b|\binstant(?:ly)?\b|\bfirst ring\b|\bin real[- ]time\b/i;
  /* The one pinned sibling (see the header): its source is
     scripts/build-schema.mjs, polish-machine's file. Pinned by its whole
     clause, and only in the JSON-LD, so the same words in any other sentence
     or surface still fail. */
  const PINNED = /texting and emailing the owner each call's details within seconds\.?$/;
  const bad = [];
  for (const s of surfaces()) {
    for (const sentence of sentences(s.text)) {
      if (!speed.test(sentence)) continue;
      if (/^JSON-LD /.test(s.where) && PINNED.test(sentence)) continue;
      bad.push(`${s.page} ${s.where}: "${sentence.slice(0, 200)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

for (const page of PAGES) {
  test(`MACHINE-24, MACHINE-25, CHECK-RUNNER-7: ${page} carries its og identity, one breadcrumb at most and a description that fits`, () => {
    const html = read(page);
    const meta = (key) => {
      const m = new RegExp(`<meta\\s+(?:name|property)="${key.replace(/:/g, '\\:')}"\\s+content="([^"]*)"`, 'i').exec(html);
      return m && decode(m[1]);
    };
    const canonical = (/<link rel="canonical" href="([^"]+)"/.exec(html) || [])[1];
    expect(canonical, 'the canonical link').toBeTruthy();
    expect(meta('og:url'), 'og:url is the canonical').toBe(canonical);
    expect(meta('og:type'), 'og:type').toBeTruthy();
    expect(meta('og:site_name'), 'og:site_name').toBe('Nevamis');
    expect(meta('og:title'), 'og:title').toBeTruthy();
    const title = decode((/<title>([\s\S]*?)<\/title>/.exec(html) || [, ''])[1]);
    expect(title, 'the title does not narrow the business to one city').not.toMatch(/\b(?:Edmonton|Calgary|St\. Albert|Sherwood Park|Leduc|Spruce Grove)\b/);
    const description = meta('description');
    expect(description, 'the meta description').toBeTruthy();
    expect(description.length, description).toBeLessThanOrEqual(160);
    const crumbs = jsonLd(html).filter((n) => [].concat(n['@type']).includes('BreadcrumbList'));
    expect(crumbs.length, 'BreadcrumbList blocks').toBeLessThanOrEqual(1);
  });
}
