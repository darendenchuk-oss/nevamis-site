/* ============================================================
   WHAT THE CONTENT PAGES MAY SAY ABOUT PRICE, THE SIZES AND THE FREE MONTH
   (commercial model v7, owner amendments #66 and #67, 2026-10-03)

   claim-rules.mjs, beside this file, holds these pages to what the front
   desk DOES. This file holds them to what it COSTS and what it is CALLED,
   under v7, because the staged v7 site (#41) got all three wrong on these
   pages and nothing would have refused it:

     - "Your first month is free on the AI Front Desk" and "its first month
       is free" were typed into the voicemail table and beside Missed-Call
       Recovery's price, for every visitor, forever. Under #66 the first
       month free is for the first freeMonth.firstClients businesses only,
       given on a booked call, and the site must stop saying it when the
       engine reports the last place taken (audit COMPARE-2, PRODUCT-9).
     - The voicemail row still said "a one-time Launch & Implementation fee
       to start", and no Front Desk size carries one since v7.
     - The answering-service cost row named one size of three, and the
       voicemail row none, so the cheapest answer was hidden (COMPARE-3,
       COMPARE-4); the trade pages printed no price and no way to buy
       (TRADES-7).
     - "The AI Front Desk" named the whole phone capability on the hub, the
       demo title, the roadmap card and the Revenue Engine page, and since
       #67 it is the name of the largest size (PRODUCT-11, PLATFORM-9).

   Every rule reads its figures and names from pricing-config.js, the same
   object pages.mjs prints from, so a repriced or renamed size moves the
   rule with it and nothing here can expire green. It runs inside
   scripts/build-content.mjs, which refuses to write a page that breaks one,
   and CI runs build-content on every pull request through
   check-generator-drift.mjs.

     node scripts/content/price-rules.mjs
   0 = the rules pass their own examples and every page they judge is clean
   1 = a rule failed its own example, or a page breaks a rule

   SCOPE. The pages build-content.mjs writes, the hand-written pages this
   layer owns (demo.html, revenue-engine.html, about.html, coming-soon.html),
   roadmap-config.js and content-map.json. The shared footer is cut out
   before judging: it is _partials/footer.html, which other work owns, and
   its own wording is that work's to change. Site-wide free-month placement
   is check-consistency.js guard 7u's; this file adds the two things 7u
   cannot see: the owner's switch at BUILD time, and content-map.json.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { stripJsComments, jsStringLiterals } from '../lib/rendered-text.mjs';

/* The engine's FREE_MONTH vocabulary (canonical.ts freePeriodMisstatements),
   the same pattern guard 7u and tests/free-month-gate.spec.js use. */
export const FREE_MONTH = /(?<!\b(?:no|not\s+a|never\s+a|without\s+a)\s)(?:free\s+(?:first\s+)?months?|first\s+month\s+(?:is\s+|for\s+)?free|months?\s+free|month\s+on\s+us)/i;
const REFERRAL = /\brefer(?:s|red|ral|rals|rer|ring)?\b|\bfree month of your own plan\b/i;
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&rsquo;/g, '\'').replace(/&middot;/g, '·');
/** What a reader and a crawler get from a page: no comments, styles or
    scripts (JSON-LD kept, it is quoted by answer engines), meta content kept,
    and the shared footer cut out. A block end ends a sentence. */
export function pageText(html) {
  return decode(String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<footer class="site-footer">[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, ' ')
    .replace(/<meta\b[^>]*\bcontent="([^"]*)"[^>]*>/gi, ' $1 . ')
    .replace(/<title>([\s\S]*?)<\/title>/gi, ' $1 . ')
    .replace(/<\/(?:p|h[1-6]|li|td|th|strong|div|summary)>/gi, ' . ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const sentences = (text) => String(text).split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
/** C$1,000 -> 1000, C$0.75 -> 0.75. */
const figuresIn = (text) => [...String(text).matchAll(/C\$\s?(\d[\d,]*(?:\.\d+)?)/g)].map((m) => ({ raw: m[0], n: Number(m[1].replace(/,/g, '')) }));
const money = (n) => 'C$' + n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });

/** Everything a rule needs from the config, derived once. */
export function facts(P) {
  const plans = P.plans || [];
  const sizes = typeof P.frontDeskTiers === 'function' ? P.frontDeskTiers() : [];
  const anchor = plans.find((p) => sizes.some((s) => s.tierOf === p.id));
  const entry = sizes.filter((s) => s.selfServe !== false).sort((a, b) => a.monthly - b.monthly)[0];
  const figures = new Set();
  for (const p of plans) for (const k of ['monthly', 'launch', 'overage']) if (p[k] > 0) figures.add(p[k]);
  for (const a of P.addOns || []) for (const k of ['monthly', 'launch', 'perCampaign']) if (a[k] > 0) figures.add(a[k]);
  if (P.enterprise && P.enterprise.launchFrom > 0) figures.add(P.enterprise.launchFrom);
  const fc = P.foundingClient || {};
  return {
    sizes, entry, figures,
    anchorName: anchor ? anchor.name : null,
    otherSizeNames: sizes.filter((s) => s !== anchor).map((s) => s.name),
    sizeWord: NUMBER_WORDS[sizes.length] || String(sizes.length),
    feeCarriers: [...plans.filter((p) => p.launch > 0).map((p) => p.name), ...(P.enterprise ? [P.enterprise.name] : [])],
    freeMonthLive: fc.active === true && Number(fc.spots) > 0,
  };
}

/* ---------- the rules, each over one page's text or markup ---------- */

/** Rules over rendered text. Each returns [{ id, why, excerpt }]. */
export function textFindings(text, F, file = '') {
  const out = [];
  const say = (id, why, excerpt) => out.push({ id, why, excerpt: String(excerpt).trim().slice(0, 200) });
  for (const s of sentences(text)) {
    /* A figure the config does not hold is typed, or retired. */
    for (const f of figuresIn(s)) {
      if (!F.figures.has(f.n)) say('figure-not-in-config', `${f.raw} is no figure pricing-config.js holds (a plan's monthly, fee or per-minute rate, a module's price, or Enterprise's floor): it was typed, or it is retired`, s);
    }
    /* Only the plans that carry a Launch & Implementation fee may be named
       beside one, and since v7 that is the Performance Partnership and
       Enterprise's floor. */
    if (/\bLaunch (?:&|and) Implementation\b/i.test(s) && !F.feeCarriers.some((n) => s.includes(n))) {
      say('launch-fee-unowned', `names a Launch & Implementation fee without the plan that carries one (${F.feeCarriers.join(', ')}); since v7 no Front Desk size, The Works or module has one`, s);
    }
    /* "AI Front Desk" is the largest size's name since #67. A sentence that
       says it and no other size is using it for the whole capability, which
       is "the front desk" (decision #17). */
    if (F.anchorName && new RegExp(`\\b${F.anchorName}\\b`).test(s) && !F.otherSizeNames.some((n) => s.includes(n))) {
      say('capability-named-as-a-size', `uses "${F.anchorName}", the name of one size since owner amendment #67, for the capability; call it "the front desk", or name the sizes together`, s);
    }
    /* "three sizes" must be the number the config sells. */
    for (const m of s.matchAll(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+) sizes\b/gi)) {
      if (m[1].toLowerCase() !== F.sizeWord) say('size-count', `says "${m[0]}" and pricing-config.js sells ${F.sizeWord}`, s);
    }
  }
  if (file !== 'terms.html' && file !== 'privacy.html') {
    for (const s of sentences(text)) {
      if (FREE_MONTH.test(s) && !REFERRAL.test(s)) say('free-month-ungated', 'says the month is free in text a visitor or crawler reads; the first month free is for the first clients only and is said only by free-month.js, inside a hidden data-nv-free-month element', s);
    }
  }
  return out;
}

/** Rules over a built page's markup. */
export function markupFindings(html, F, file, cluster) {
  const out = [];
  const say = (id, why, excerpt) => out.push({ id, why, excerpt: String(excerpt).trim().slice(0, 200) });
  const gated = /\bdata-nv-free-month(?![-\w])/.test(html);
  /* The owner's switch, at build time: with foundingClient off or out of
     places, no page carries the element at all, not even hidden. */
  if (gated && !F.freeMonthLive) say('free-month-switch-off', 'carries a data-nv-free-month element while pricing-config.js foundingClient is off or has no places; pages.mjs must not build one', file);
  if (gated) {
    const cfg = html.search(/<script src="pricing-config\.js"><\/script>/);
    const fm = html.search(/<script src="free-month\.js"(?: defer)?><\/script>/);
    if (cfg < 0 || fm < 0 || fm < cfg) say('free-month-unwired', 'carries a data-nv-free-month element but does not load pricing-config.js and then free-month.js, so it can never show', file);
  }
  const text = pageText(html);
  /* The trade pages say what the phone costs, from the cheapest size, and
     offer Buy now to the sizes (TRADES-7). */
  if (cluster === 'trade' && F.entry) {
    const want = `From ${money(F.entry.monthly)} a month on ${F.entry.name}, with ${F.entry.includedMinutes.toLocaleString('en-US')} minutes included`;
    if (!text.includes(want)) say('trade-start-line', `does not state the cheapest Front Desk size as "${want}" (pricing-config.js ${F.entry.id})`, file);
    if (!/<a class="btn btn-primary" href="\/pricing\.html#plans"[^>]*>Buy now<\/a>/.test(html)) say('trade-buy-now', 'has no Buy now to the Front Desk sizes on pricing.html', file);
  }
  /* The answering-service cost row names every size whole (COMPARE-3). */
  if (file === 'vs-answering-service.html') {
    const row = (html.match(/<tr><th scope="row">Cost as volume grows<\/th>[\s\S]*?<\/tr>/) || [''])[0];
    const rowText = pageText(row);
    for (const s of F.sizes) {
      for (const bit of [s.name, `${s.includedMinutes.toLocaleString('en-US')} minutes`, money(s.monthly), money(s.overage)]) {
        if (!rowText.includes(bit)) say('cost-row-sizes', `the "Cost as volume grows" row does not give ${s.name}'s ${bit}`, rowText || file);
      }
    }
  }
  /* The voicemail price row gives the cheapest size's figure (COMPARE-4). */
  if (file === 'vs-voicemail.html' && F.entry) {
    const row = (html.match(/<tr><th scope="row">Costs nothing<\/th>[\s\S]*?<\/tr>/) || [''])[0];
    if (!pageText(row).includes(`From ${money(F.entry.monthly)} a month (${F.entry.name}`)) say('voicemail-price-row', `the "Costs nothing" row does not give the cheapest size, ${F.entry.name} at ${money(F.entry.monthly)} a month`, pageText(row) || file);
  }
  return out;
}

/** pages.mjs and build-content.mjs type no figure and no free month: their
    prices come from the config, and the free month from free-month.js. */
export function sourceFindings(name, src) {
  const out = [];
  const lits = jsStringLiterals(stripJsComments(src)).join(' \n ');
  for (const m of lits.matchAll(/(?:C\$|\$)\s?\d[\d,]*(?:\.\d+)?/g)) out.push({ id: 'typed-price', why: `${name} types a figure; read it from pricing-config.js`, excerpt: m[0] });
  for (const s of sentences(lits)) if (FREE_MONTH.test(s) && !REFERRAL.test(s)) out.push({ id: 'typed-free-month', why: `${name} types a free month; it is foundingClient's words, written only by free-month.js`, excerpt: s });
  return out;
}

/** content-map.json is served at /content-map.json and feeds every card
    title and blurb: no string in it can be switched off, so none may carry
    the free month (TRADES-9 under #66), and none the capability as a size. */
export function mapFindings(map, F) {
  const out = [];
  const walk = (v, at) => {
    if (typeof v === 'string') {
      for (const f of textFindings(v, F, 'content-map.json')) out.push({ ...f, excerpt: `${at}: ${f.excerpt}` });
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, at ? `${at}.${k}` : k);
  };
  walk(map, '');
  return out;
}

/* ---------- the rules' own examples, run before they are trusted ---------- */

const FIXTURE_CONFIG = {
  plans: [
    { id: 'starter', name: 'Performance Partnership', monthly: 350, launch: 5000, overage: 1.1, includedMinutes: 250, selfServe: false },
    { id: 'growth', name: 'The Works', monthly: 2100, launch: 0, overage: 0.75, includedMinutes: 1400 },
    { id: 'front-desk-starter', name: 'Front Desk Starter', monthly: 250, launch: 0, overage: 1.1, includedMinutes: 200, tierOf: 'pro' },
    { id: 'front-desk-plus', name: 'Front Desk Plus', monthly: 500, launch: 0, overage: 0.95, includedMinutes: 550, tierOf: 'pro' },
    { id: 'pro', name: 'AI Front Desk', monthly: 1000, launch: 0, overage: 0.75, includedMinutes: 1400 },
  ],
  addOns: [{ id: 'missed_call_recovery', monthly: 350, launch: 0 }],
  enterprise: { name: 'Enterprise', launchFrom: 5000 },
  foundingClient: { active: false, spots: 0 },
  frontDeskTiers() {
    const anchors = this.plans.map((p) => p.tierOf).filter(Boolean);
    return this.plans.filter((p) => anchors.includes(p.id) || anchors.includes(p.tierOf)).sort((a, b) => a.includedMinutes - b.includedMinutes);
  },
};
export const MUST_FIRE = [
  ['free-month-ungated', 'Your first month is free on the AI Front Desk, then a monthly plan.'],
  ['free-month-ungated', 'Bought on its own, its first month is free, then it is C$350 a month.'],
  ['launch-fee-unowned', 'A one-time Launch & Implementation fee to start, then a monthly plan.'],
  ['figure-not-in-config', 'From C$275 a month with 200 minutes included.'],
  ['figure-not-in-config', 'C$1,500 Launch & Implementation to start on the Performance Partnership.'],
  ['capability-named-as-a-size', 'The AI Front Desk answers the calls you cannot.'],
  ['capability-named-as-a-size', 'Demo | Hear the AI Front Desk answer | Nevamis.'],
  ['size-count', 'The front desk comes in four sizes.'],
];
export const MUST_PASS = [
  'The front desk answers the calls you cannot, and it comes in three sizes.',
  'Front Desk Starter: 200 minutes for C$250 a month, then C$1.10 a minute; Front Desk Plus: 550 minutes for C$500 a month, then C$0.95 a minute; AI Front Desk: 1,400 minutes for C$1,000 a month, then C$0.75 a minute.',
  'The Performance Partnership is C$5,000 Launch & Implementation to start, then C$350 a month.',
  'Enterprise is quoted per client, its Launch & Implementation starting at C$5,000.',
  'When they pay their first invoice, you get a free month of your own plan.',
  'There is no free month on Buy now.',
  'From C$250 a month (Front Desk Starter, 200 minutes included).',
];

function selfTest() {
  const F = facts(FIXTURE_CONFIG);
  const bad = [];
  for (const [id, s] of MUST_FIRE) if (!textFindings(s, F).some((f) => f.id === id)) bad.push(`misses ${id}: "${s}"`);
  for (const s of MUST_PASS) { const f = textFindings(s, F); if (f.length) bad.push(`refuses (${f.map((x) => x.id).join(', ')}): "${s}"`); }
  /* The markup rules, on their own small pages. */
  const gatedPage = '<div data-nv-free-month hidden><span data-nv-free-month-offer></span></div><script src="pricing-config.js"></script>\n<script src="free-month.js" defer></script>';
  if (!markupFindings(gatedPage, F, 'x.html').some((f) => f.id === 'free-month-switch-off')) bad.push('misses a gated element built while the switch is off');
  if (markupFindings(gatedPage, { ...F, freeMonthLive: true }, 'x.html').length) bad.push('refuses a wired gated element while the switch is on');
  if (!markupFindings(gatedPage.replace(/<script src="free-month\.js" defer><\/script>/, ''), { ...F, freeMonthLive: true }, 'x.html').some((f) => f.id === 'free-month-unwired')) bad.push('misses a gated element with no free-month.js');
  const trade = '<p>From C$250 a month on Front Desk Starter, with 200 minutes included.</p><a class="btn btn-primary" href="/pricing.html#plans" data-evt="trade_pricing_click">Buy now</a>';
  if (markupFindings(trade, F, 't.html', 'trade').length) bad.push('refuses a trade page with its start line and Buy now');
  if (!markupFindings(trade.replace('C$250', 'C$300'), F, 't.html', 'trade').some((f) => f.id === 'trade-start-line')) bad.push('misses a trade page with the wrong start price');
  if (!markupFindings(trade.replace(/<a [\s\S]*<\/a>/, ''), F, 't.html', 'trade').some((f) => f.id === 'trade-buy-now')) bad.push('misses a trade page with no Buy now');
  const row = '<tr><th scope="row">Cost as volume grows</th><td class="ask">?</td><td class="part">1,400 minutes included on the AI Front Desk, then C$0.75 a minute</td></tr>';
  if (!markupFindings(row, F, 'vs-answering-service.html').some((f) => f.id === 'cost-row-sizes')) bad.push('misses a cost row with one size');
  const vm1 = '<tr><th scope="row">Costs nothing</th><td class="yes">Yes</td><td class="part">A monthly plan</td></tr>';
  if (!markupFindings(vm1, F, 'vs-voicemail.html').some((f) => f.id === 'voicemail-price-row')) bad.push('misses a voicemail row with no figure');
  if (!sourceFindings('x.mjs', "const a = `It is C$250 a month`;").some((f) => f.id === 'typed-price')) bad.push('misses a typed price in a source');
  if (sourceFindings('x.mjs', '/* C$250 in a comment */ const a = `${cad(x)} a month`;').length) bad.push('refuses a comment or a read figure');
  if (!sourceFindings('x.mjs', "const a = 'Your first month is free.';").some((f) => f.id === 'typed-free-month')) bad.push('misses a typed free month in a source');
  if (!mapFindings({ pages: [{ blurb: 'Can I try it? Your first month is free.' }] }, F).some((f) => f.id === 'free-month-ungated')) bad.push('misses a free month in content-map.json');
  return bad;
}

/* ---------- the whole check ---------- */

const HAND_PAGES = ['demo.html', 'revenue-engine.html', 'about.html', 'coming-soon.html'];

/** `pages` maps a file name to the HTML about to be written. `P` is the
 *  pricing config pages.mjs printed from. */
export function priceFindings(root, pages, P) {
  const F = facts(P);
  const findings = [];
  for (const msg of selfTest()) findings.push({ file: 'scripts/content/price-rules.mjs', id: 'self-test', why: msg, excerpt: '' });
  const map = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'));
  const cluster = Object.fromEntries(map.pages.map((p) => [p.file, p.cluster]));
  for (const [file, html] of Object.entries(pages)) {
    for (const f of textFindings(pageText(html), F, file)) findings.push({ file, ...f });
    for (const f of markupFindings(html, F, file, cluster[file])) findings.push({ file, ...f });
  }
  /* The hand-written pages this layer owns: named right, and no figure. */
  for (const file of HAND_PAGES) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    /* Their structured data is build-schema.mjs's, written after this runs
       from the <title> and the FAQ judged here, so it is judged in its
       source rather than as the copy it was last built from. */
    const html = fs.readFileSync(full, 'utf8').replace(/<!-- generated:schema -->[\s\S]*?<!-- \/generated:schema -->/g, ' ');
    for (const f of textFindings(pageText(html), F, file)) {
      if (f.id === 'figure-not-in-config') continue; /* revenue-engine's calculator reads C$0 before input */
      findings.push({ file, ...f });
    }
  }
  /* roadmap-config.js renders the Roadmap's cards: its strings, read. */
  const roadmap = path.join(root, 'roadmap-config.js');
  if (fs.existsSync(roadmap)) {
    const lits = jsStringLiterals(stripJsComments(fs.readFileSync(roadmap, 'utf8')));
    for (const lit of lits) for (const f of textFindings(lit, F, 'roadmap-config.js')) findings.push({ file: 'roadmap-config.js', ...f });
  }
  for (const f of mapFindings(map, F)) findings.push({ file: 'content-map.json', ...f });
  for (const name of ['scripts/content/pages.mjs', 'scripts/build-content.mjs']) {
    const full = path.join(root, name);
    if (fs.existsSync(full)) for (const f of sourceFindings(name, fs.readFileSync(full, 'utf8'))) findings.push({ file: name, ...f });
  }
  return findings;
}

/* ---------- CLI: judge the pages as committed ---------- */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'pricing-config.js'), 'utf8'), sandbox, { timeout: 1000 });
  const { PAGES } = await import('./pages.mjs');
  const pages = {};
  for (const file of [...Object.keys(PAGES), 'solutions.html']) pages[file] = fs.readFileSync(path.join(root, file), 'utf8');
  const findings = priceFindings(root, pages, sandbox.window.NV_PRICING);
  if (findings.length) {
    console.error(`FAIL: ${findings.length} price finding(s):\n` + findings.map((f) => `  ${f.file}: [${f.id}] ${f.why}${f.excerpt ? `\n      "${f.excerpt}"` : ''}`).join('\n'));
    process.exit(1);
  }
  console.log(`price rules OK: ${MUST_FIRE.length} must-fire and ${MUST_PASS.length} must-pass examples, ${Object.keys(pages).length} built pages, ${HAND_PAGES.length} hand pages, roadmap-config.js, content-map.json and the two sources clean.`);
}
