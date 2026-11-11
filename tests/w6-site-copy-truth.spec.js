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
import { fileURLToPath } from 'node:url';
import { loadPricing } from '../scripts/lib/pricing-catalog.mjs';

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
const SOURCES = ['scripts/film/sections.html', 'scripts/film/source.html'];

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
  /* The pricing, roadmap, Revenue Engine and missed-calls pages redirect to
     the homepage since owner decision #81 (2026-11-10), so roadmap-config.js,
     which only the roadmap page loaded, is no longer published. */
  for (const f of ['home.html', 'index.html', 'book.html', 'pricing-config.js', 'llms.txt',
    'search-index.json', ...SOURCES]) {
    expect(files, `${f} is published or a generator source, so it must be scanned`).toContain(f);
  }
  expect(files, 'roadmap-config.js is excluded in _config.yml: no published page loads it').not.toContain('roadmap-config.js');
  for (const f of files) expect(f, 'an excluded working file was scanned as published').not.toMatch(/^(?:docs|config|tests|creative|film-v2)\//);
  /* The homepage's JSON-LD is copy too: answer engines quote it. */
  const ld = everyUnit().filter((u) => u.file === 'home.html' && /texts and emails the owner those details within seconds/.test(u.text));
  expect(ld.length, 'the Service description is read from the JSON-LD').toBeGreaterThanOrEqual(1);
});

/* ---------- QC-14 ---------- */

test('QC-14: no published surface says quotes are recorded as jobs', () => {
  const hits = everyUnit().filter((u) => ABOUT_QUOTES.test(u.text) && AS_JOBS.test(u.text));
  expect(hits, report(hits)).toEqual([]);
});

/* ---------- O40 ---------- */

test('O40: no published surface puts the missed-call text in business hours', () => {
  const hits = everyUnit().filter((u) => MISSED_TEXT.test(u.text) && BUSINESS_HOURS.test(u.text));
  expect(hits, report(hits)).toEqual([]);
});

/* Every surface this leaf reworded describes when the text goes out, so
   each must be seen stating the window; a rule that finds no window to
   judge proves nothing. The homepage and the film's source said it in the
   film's station copy, which left the page with owner decision #81's
   follow-up (2026-11-10); the homepage no longer describes the text, and
   the rule above still judges it if it ever does again. roadmap-config.js
   said it too, and is no longer published. pricing-config.js said it in the
   Missed-Call Recovery blurb until owner decision #83 (2026-11-11) moved the
   add-on catalog to config/pricing-catalog.js, which is not served; the
   blurb is held to the window by the test after next. */
const STATES_THE_WINDOW = [];

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

test('O40: the add-on blurb states the window every day', () => {
  /* The catalog, since owner decision #83 (2026-11-11): the add-on is no
     longer on the served price file, and its blurb is what the agent
     documents are held to (guard 7q). */
  const mcr = (loadPricing(root, { catalog: true }).addOns || []).find((a) => a.id === 'missed_call_recovery');
  expect(mcr, 'the price data still prices Missed-Call Recovery').toBeTruthy();
  expect(clock(mcr.blurb), 'the blurb states the window, every day').toMatch(/\b8 am and 8 pm\b[^.]*\bevery day\b/i);
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

/* ---------- the demo line's busy fallback ----------

   fallback.xml is the demo line's Twilio voice fallback (owner-approved,
   polish round 2026-11-09): what a caller to (587) 413-0035 hears when
   ring.xml's hand-off fails, for instance while the line is busy, instead of
   an error tone. Its words are the owner's, so they are pinned byte for byte.
   The rest is the rule a fallback has to keep: a static file served as XML,
   one Say with the default voice and one Hangup, nothing that hands the call
   on, and nothing a search engine lists. Shown red with a <Redirect> added
   to fallback.xml ("Redirect" among the verbs), then restored. */
const BUSY_SENTENCE = 'Sorry, our line is busy right now. Please book a call with Daren at nevamis dot C A. Goodbye.';

test('fallback.xml tells a caller the demo line is busy, points them at a call with Daren, and hangs up once', () => {
  const xml = read('fallback.xml').replace(/\r\n?/g, '\n');
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n'), 'an XML declaration, then <Response>').toBe(true);
  const body = xml.slice(xml.indexOf('<Response>') + '<Response>'.length, xml.indexOf('</Response>'));
  const verbs = [...body.matchAll(/<([A-Za-z]+)\b([^>]*)>/g)].map((m) => {
    const attrs = m[2].replace(/\/\s*$/, '').trim();
    return attrs ? `${m[1]} ${attrs}` : m[1];
  });
  /* No Redirect, Dial, Play, Gather, Record, Enqueue or message verb: a
     fallback that hands the call on sends the caller wherever it names. */
  expect(verbs).toEqual(['Say', 'Hangup']);
  expect(body.trim().endsWith('<Hangup/>'), 'the Hangup is last').toBe(true);
  expect((body.match(/<Say>([\s\S]*?)<\/Say>/) || [])[1]).toBe(BUSY_SENTENCE);
  expect(xml.trimEnd().endsWith('</Response>'), 'nothing after the Response').toBe(true);
  /* Served, the way ring.xml is: GitHub Pages sends a published .xml as
     application/xml, which is what Twilio needs from a TwiML URL. */
  expect(publishedFiles(), 'fallback.xml is excluded from nevamis.ca').toContain('fallback.xml');
  expect(read('sitemap.xml'), 'the sitemap lists fallback.xml').not.toMatch(/fallback\.xml/);
  /* The search index carries page text, so it is searched for the file and
     for its sentence; "your line is busy" is ordinary call-forwarding copy. */
  const index = read('search-index.json').toLowerCase();
  expect(index, 'the search index lists fallback.xml').not.toContain('fallback.xml');
  expect(index, 'the search index carries the fallback\'s sentence').not.toContain(BUSY_SENTENCE.slice(0, 34).toLowerCase());
});
