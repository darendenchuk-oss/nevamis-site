/* ============================================================
   QUOTES, MISSED-CALL TEXTS AND A LINE NOBODY ANSWERS (wave 6 B11,
   w6-site-copy).

   The site told a buyer three things that were false:

     QC-14  that quotes are "recorded as jobs". The engine keeps quotes as
            quotes: a client adds them on the portal's Quotes page, one at a
            time or from a spreadsheet (nevamis-engine src/domain/quotes.ts,
            source "manual" or "csv_import"). Engine canonical.ts
            quote_recovery.needsFromYou says so since B10 (#410).
     O40    that a missed caller is texted "during business hours" and
            "while the job is still winnable". Missed-Call Recovery sends
            from 08:00 to 20:00 on the client's own clock, every day
            (missed-call-text.ts RECOVERY_HOURS, no weekday rule), and a text
            a person releases makes no promise about speed. B10's words are
            "between 8 a.m. and 8 p.m. your time, every day".
     O24.3  that a caller who reaches a line with no agent is told only to
            "try again later". Trades calls include gas and flooding, so the
            fallback gives the 9-1-1 advice.

   Copy is asserted as a RULE (no surface says quotes are jobs; no surface
   puts the missed-call text in business hours, at any other clock time, or
   on a speed promise), except where the wording IS the rule:
   missed-line.xml must say the engine's no-name sentence byte for byte,
   because the engine's own no-agent answer (nevamis-engine
   src/domain/missed-call-line.ts, missedCallLineTwiml, changed by A5b
   w6-no-agent-line) and this static fallback are the same caller's two
   paths to the same line.

   "Published" is read from _config.yml, the file that decides what GitHub
   Pages serves, plus the generator sources the homepage and the content
   pages are built from (their generated copies are published anyway, and a
   source that says it again would put it back on the next build).

   Nothing here opens a browser or reaches the network: every test reads
   files. Run it from this checkout, on its own port, e.g.
     NV_PORT=3291 npx playwright test tests/w6-site-copy-truth.spec.js
   SITE_ROOT=<a checkout> points it at another tree, which is how it was
   shown red on the site as it was before this change.
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

/* ---------- what is published ---------- */

/* _config.yml's exclude list: "  - docs/" is a directory, "  - README.md" a
   file. Everything else in the repository is served at nevamis.ca. */
function excludes() {
  const cfg = read('_config.yml').replace(/\r\n?/g, '\n');
  const block = cfg.slice(cfg.indexOf('exclude:'), cfg.indexOf('\ninclude:') < 0 ? undefined : cfg.indexOf('\ninclude:'));
  return [...block.matchAll(/^\s*-\s+(\S+)\s*$/gm)].map((m) => m[1]);
}

const TEXT = /\.(?:html|js|mjs|txt|xml|json|webmanifest)$/i;
/* The sources the published pages are generated from (compose.py and
   build-content.mjs), scanned although scripts/ itself is not served. */
const SOURCES = ['scripts/film/sections.html', 'scripts/film/source.html', 'scripts/content/pages.mjs'];

function publishedFiles() {
  const ex = excludes();
  const isExcluded = (rel) => ex.some((e) => (e.endsWith('/') ? rel.startsWith(e) : rel === e));
  const out = [];
  const walk = (dir) => {
    for (const d of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = dir ? `${dir}/${d.name}` : d.name;
      if (d.isDirectory()) {
        /* Jekyll skips dot-directories unless _config.yml includes them;
           node_modules and artifacts are local tooling, never committed.
           assets/vendor is third-party minified code, pinned by hash in
           config/critical-surface.json, and carries no copy of ours. */
        if ((d.name.startsWith('.') && d.name !== '.well-known') || ['node_modules', 'artifacts', '.git'].includes(d.name)) continue;
        if (rel === 'assets/vendor') continue;
        if (isExcluded(rel + '/')) continue;
        walk(rel);
      } else if (TEXT.test(d.name) && !isExcluded(rel)) {
        out.push(rel);
      }
    }
  };
  walk('');
  return [...out, ...SOURCES.filter((s) => fs.existsSync(path.join(root, s)))];
}

/* ---------- units of copy ----------

   A unit is a BLOCK a reader meets as one piece: a paragraph, a list item,
   a heading, one string of a script, one paragraph of llms.txt. Not a
   sentence, on purpose: "Missed-Call Recovery texts a caller you missed,
   once. It sends during business hours." says it across two sentences, and
   the missed-calls page says its hours in the sentence after the one that
   names the text. */

const BLOCK = /<\/?(?:p|li|ul|ol|div|h[1-6]|br|td|th|tr|table|details|summary|section|article|header|footer|main|nav|aside|dt|dd|dl|blockquote|figcaption|figure|option|button|title|label|script|form|fieldset|legend|hr|Say|Response)\b[^>]*>/gi;
const ENTITIES = [[/&amp;/g, '&'], [/&middot;/g, '·'], [/&rsquo;|&#8217;/g, '’'], [/&lsquo;|&#8216;/g, '‘'],
  [/&nbsp;/g, ' '], [/&mdash;/g, '\u2014'], [/&ndash;/g, '\u2013'], [/&quot;/g, '"'], [/&#39;/g, "'"]];

/* "8 a.m." holds two full stops that are not sentence ends. They become
   "8 am", so a rule reads the time the way it reads "8 am" or "8 AM". */
const clock = (s) => s.replace(/\b([ap])\.\s?m\.(?=\s|$|[,;:)"'’])/gi, '$1m');

/* A script's string literals end units, so the next array entry or
   property is never read as the same block ("...opt-out", "Quote-Chase
   Engine: ..."). Comments are not copy and go; a "//" after a colon is a
   URL and stays. */
const cutLiterals = (js) => js.replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:"'`\\/\w])\/\/[^\n]*/g, '$1')
  .replace(/["'`]\s*[,;:\])}+]/g, '"<br>');

/* Blocks of a run of text in which markup may appear: whitespace and hard
   wraps collapsed first (the page sources wrap their prose, so a verb and
   its hours can sit on two lines), then block tags end a unit and inline
   tags are spaces. An inline script (JSON-LD included) is cut at its
   string literals as well. */
function blocksOfMarkup(s) {
  const text = s.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, open, body, close) => open + cutLiterals(body) + close)
    .replace(/\s+/g, ' ').replace(BLOCK, '\n').replace(/<[^>]+>/g, ' ');
  return clock(ENTITIES.reduce((t, [re, to]) => t.replace(re, to), text))
    .split('\n').map((u) => u.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/* A plain-text file (llms.txt) is hard-wrapped: a blank line or a list
   marker ("-", "*", "#", "3.") starts a new block, and a single line break
   is a space. It carries no markup, so nothing is stripped from it. */
function blocksOfText(t) {
  return t.replace(/\r\n?/g, '\n').split(/\n\s*\n|\n(?=\s*(?:[-*]|#+|\d+\.)\s)/)
    .map((u) => clock(u.replace(/\s+/g, ' ')).trim()).filter(Boolean);
}

/* search-index.json is data: each string value is its own unit of copy. */
function blocksOfJson(raw) {
  const out = [];
  const visit = (v) => {
    if (typeof v === 'string') out.push(...blocksOfMarkup(v));
    else if (Array.isArray(v)) v.forEach(visit);
    else if (v && typeof v === 'object') Object.values(v).forEach(visit);
  };
  visit(JSON.parse(raw));
  return out;
}

function unitsOf(rel) {
  const raw = read(rel);
  if (/\.json$|\.webmanifest$/i.test(rel)) return blocksOfJson(raw);
  if (/\.m?js$/i.test(rel)) return blocksOfMarkup(cutLiterals(raw));
  if (/\.txt$/i.test(rel)) return blocksOfText(raw);
  return blocksOfMarkup(raw);
}

let CACHE = null;
function everyUnit() {
  if (!CACHE) CACHE = publishedFiles().flatMap((f) => unitsOf(f).map((text) => ({ file: f, text })));
  return CACHE;
}
const report = (hits) => hits.map((h) => `${h.file}: "${h.text.slice(0, 200)}"`).join('\n');

/* ---------- the rules ---------- */

/* A sentence about quotes or estimates that calls them jobs. */
const ABOUT_QUOTES = /\b(?:quotes?|estimates?)\b/i;
const AS_JOBS = /\bas\s+(?:a\s+|new\s+|your\s+)?jobs?\b/i;

/* A sentence about the one text a missed caller gets. */
const MISSED_TEXT = /\b(?:text(?:s|ed)?\s+(?:[\w'’-]+\s+){0,3}?back|texts?\s+a\s+caller|one\s+text\b|missed[- ]call\s+text|text\s+per\s+missed\s+call|Missed-Call\s+Recovery)/i;
const BUSINESS_HOURS = /\b(?:during|in|within|inside)\s+(?:your\s+|normal\s+|regular\s+|the\s+|its\s+|their\s+)?(?:business|office|opening|working|shop)\s+hours\b/i;
const CLOCK_TIME = /\b(\d{1,2})(?::(\d\d))?\s*([ap]m)\b/gi;
/* Speed a released text cannot promise. "Still winnable" and "before they
   ring the next name" anywhere; seconds, minutes and "instantly" when the
   sentence is about the missed-call text (the owner's own call summary does
   arrive within seconds, and says so truthfully elsewhere). */
const SPEED_ANYWHERE = /\bstill\s+winnable\b|\bwhile\s+(?:the\s+)?job\s+is\s+still\b|\bbefore\s+they\s+(?:ring|call|try|phone)\s+(?:the\s+)?next\b/i;
const SPEED_OF_TEXT = /\b(?:instantly|immediately|right\s+away|in\s+seconds|within\s+(?:a\s+few\s+|\d+\s+)?(?:seconds?|minutes?))\b/i;

/* The engine's no-name sentence, missedCallLineTwiml's second branch after
   A5b (w6-no-agent-line). Identical by design, so it is written out here
   rather than composed. */
const NO_AGENT_SENTENCE = 'Sorry, nobody can take your call right now. If this is an emergency, hang up and call 9-1-1.';

/* ---------- the scan reaches what it must ---------- */

test('the scan reads every surface these rules are about', () => {
  const files = publishedFiles();
  for (const f of ['home.html', 'index.html', 'pricing.html', 'pricing-config.js', 'roadmap-config.js', 'llms.txt',
    'revenue-engine.html', 'coming-soon.html', 'missed-calls.html', 'search-index.json', ...SOURCES]) {
    expect(files, `${f} is published or a generator source, so it must be scanned`).toContain(f);
  }
  for (const f of files) expect(f, 'an excluded working file was scanned as published').not.toMatch(/^(?:docs|config|tests|creative|film-v2)\//);
  /* The homepage's FAQPage JSON-LD is copy too: search engines show it. */
  const ld = everyUnit().filter((u) => u.file === 'home.html' && /threshold you set without an answer/.test(u.text));
  expect(ld.length, 'the quiet-quote answer is read from both the FAQ and its JSON-LD').toBeGreaterThanOrEqual(2);
});

/* ---------- QC-14 ---------- */

test('QC-14: no published surface says quotes are recorded as jobs', () => {
  const hits = everyUnit().filter((u) => ABOUT_QUOTES.test(u.text) && AS_JOBS.test(u.text));
  expect(hits, report(hits)).toEqual([]);
});

test('QC-14: the homepage says where quotes come from: added on the Quotes page, or imported from a spreadsheet', () => {
  for (const f of ['home.html', 'index.html']) {
    const units = blocksOfMarkup(read(f));
    /* Get-Paid Autopilot's fine print opens with the same go-ahead; the
       Quote Recovery one is the block that names the Quote-Chase Engine. */
    const needs = units.filter((u) => /written go-ahead to email your own customers/i.test(u) && /Quote-Chase Engine/.test(u));
    expect(needs.length, `${f}: the Quote Recovery fine print`).toBeGreaterThan(0);
    for (const u of needs) expect(u, `${f}: what Quote Recovery needs names the Quotes page and a spreadsheet`).toMatch(/Quotes page[^.]*spreadsheet/i);
    const crm = units.filter((u) => /Quotes page of your Nevamis portal/i.test(u));
    expect(crm.length, `${f}: the CRM answer says quotes are added on the portal's Quotes page (FAQ and JSON-LD)`).toBeGreaterThanOrEqual(2);
  }
});

/* ---------- O40 ---------- */

test('O40: no published surface puts the missed-call text in business hours', () => {
  const hits = everyUnit().filter((u) => MISSED_TEXT.test(u.text) && BUSINESS_HOURS.test(u.text));
  expect(hits, report(hits)).toEqual([]);
});

/* Every surface this leaf reworded describes when the text goes out, so
   each must be seen stating the window; a rule that finds no window to
   judge proves nothing. */
const STATES_THE_WINDOW = ['pricing-config.js', 'pricing.html', 'home.html', 'index.html', 'roadmap-config.js',
  'revenue-engine.html', 'coming-soon.html', 'missed-calls.html', 'llms.txt',
  'scripts/film/source.html', 'scripts/content/pages.mjs'];

test('O40: a block about the missed-call text that names a time names 8 a.m. and 8 p.m., never another hour', () => {
  const wrong = [];
  const stated = new Set();
  for (const u of everyUnit()) {
    if (!MISSED_TEXT.test(u.text)) continue;
    const times = [...u.text.matchAll(CLOCK_TIME)].map((m) => `${Number(m[1])}${m[2] && m[2] !== '00' ? ':' + m[2] : ''} ${m[3].toLowerCase()}`);
    if (!times.length) continue;
    if (times.some((t) => t !== '8 am' && t !== '8 pm') || !times.includes('8 am') || !times.includes('8 pm')) wrong.push({ ...u, text: `[${times.join(', ')}] ${u.text}` });
    else if (/\bevery\s+day\b/i.test(u.text)) stated.add(u.file);
    else wrong.push({ ...u, text: `[8 am to 8 pm, but not "every day"] ${u.text}` });
  }
  expect(wrong, report(wrong)).toEqual([]);
  expect([...STATES_THE_WINDOW].filter((f) => !stated.has(f)), 'these surfaces describe the text and must state its window, every day').toEqual([]);
});

test('O40: nothing promises the missed-call text arrives in time to win the job', () => {
  const hits = everyUnit().filter((u) => SPEED_ANYWHERE.test(u.text) || (MISSED_TEXT.test(u.text) && SPEED_OF_TEXT.test(u.text)));
  expect(hits, report(hits)).toEqual([]);
});

test('O40: the add-on blurb states the window every day, and the static pricing list says the same sentence', () => {
  const sandbox = { window: {} };
  vm.runInNewContext(read('pricing-config.js'), sandbox);
  const mcr = sandbox.window.NV_PRICING.addOns.find((a) => a.id === 'missed_call_recovery');
  expect(mcr, 'pricing-config.js sells Missed-Call Recovery').toBeTruthy();
  expect(clock(mcr.blurb), 'the blurb states the window, every day').toMatch(/\b8 am and 8 pm\b[^.]*\bevery day\b/i);
  /* pricing.html's #addOnList is the no-JavaScript copy of the same list,
     "name · price · price sentence · description". Its description is the
     blurb, first letter lower-cased. */
  const list = read('pricing.html').match(/<ul id="addOnList"[\s\S]*?<\/ul>/);
  expect(list, 'pricing.html carries #addOnList').toBeTruthy();
  const li = [...list[0].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]).find((t) => t.startsWith('Missed-Call Recovery'));
  expect(li, 'the static list has a Missed-Call Recovery entry').toBeTruthy();
  /* Since 2026-10-03 (WALK-LIVE-2) a module sold alone ends its line with
     its own Start link; the description is the text before it. */
  const described = li.replace(/<a\b[\s\S]*?<\/a>/g, '').split('&middot;').pop().trim().replace(/&amp;/g, '&');
  expect(described).toBe(mcr.blurb.charAt(0).toLowerCase() + mcr.blurb.slice(1));
});

/* ---------- O24.3 ---------- */

test('O24.3: missed-line.xml says the engine\'s no-name sentence with the 9-1-1 advice, and still hangs up once', () => {
  const xml = read('missed-line.xml').replace(/\r\n?/g, '\n');
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n'), 'an XML declaration, then <Response>').toBe(true);
  const body = xml.slice(xml.indexOf('<Response>') + '<Response>'.length, xml.indexOf('</Response>'));
  /* Exactly three verbs, in this order: a one-second pause, one Say with
     the default voice (no attributes, like the engine's), one Hangup.
     Nothing hands the call on: no Redirect, Dial, Play, Gather, Record,
     Enqueue or message verb. */
  const verbs = [...body.matchAll(/<([A-Za-z]+)\b([^>]*)>/g)].map((m) => {
    const attrs = m[2].replace(/\/\s*$/, '').trim();
    return attrs ? `${m[1]} ${attrs}` : m[1];
  });
  expect(verbs).toEqual(['Pause length="1"', 'Say', 'Hangup']);
  expect(body.trim().endsWith('<Hangup/>'), 'the Hangup is last').toBe(true);
  const say = body.match(/<Say>([\s\S]*?)<\/Say>/);
  expect(say && say[1]).toBe(NO_AGENT_SENTENCE);
  expect(xml.trimEnd().endsWith('</Response>'), 'nothing after the Response').toBe(true);
});
