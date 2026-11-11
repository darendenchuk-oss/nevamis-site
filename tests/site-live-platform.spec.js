/* ============================================================
   ONE STORY FOR WHAT IS LIVE, WHAT IS COMING AND WHAT IS NOT OFFERED
   (site audit 2026-10-03, leaf site-live-platform, decision #69).

   The whole-site audit found the Roadmap, the Revenue Engine page and the
   About page telling different stories about the same products:

     PLATFORM-1/2  revenue-engine.html invited applications for "the first
                   builds" of a product the owner confirmed is not offered
                   (O50, decision #65), behind two "Apply to be considered"
                   buttons, while the Roadmap promised that anything not
                   ready gets a published price before anyone signs up.
     PLATFORM-3    Search Rankings, listed as coming on pricing.html, was
                   missing from a Roadmap that says it shows "everything at
                   its true status".
     PLATFORM-4    about.html led with the front desk, against the door
                   order: Lead Generation, then Quote Recovery, then the
                   front desk.
     PLATFORM-5    the Revenue Engine FAQ said "we measure and report the
                   results" of something that does not run.
     PLATFORM-6    "offered to a few businesses": a client count, for a
                   service no client has yet.
     PLATFORM-7/8  roadmap entries for unbuilt things spoke in the present
                   tense or promised "measurable growth"; Customer
                   Reactivation read BEING RESEARCHED against pricing's
                   "coming".
     COMING-2      the LIVE TODAY shelf opened with the front desk and put
                   Quote Recovery fifth.
     COMING-4      "Everything marked AVAILABLE NOW has a published price",
                   while Automatic Lead Tracking has none of its own.
     MACHINE-24    two BreadcrumbList blocks per page, one hand-written.
     CHECK-RUNNER-7 meta descriptions over 160 characters.

   The post-launch truth sweep (2026-11-09) added two:
     TRUTH-1       the homepage's Lead Generation fine print still said
                   "to a few businesses", because PLATFORM-6 did not read
                   the homepage. It reads it now.
     TRUTH-2       pricing, the homepage, How you start, the proposal and
                   llms.txt said the receptionist asks "the qualifying
                   questions you approved". There is no question builder.

   Each test asserts the RULE, not the sentence that broke it, so the next
   page that says the same thing fails too. Where a rule reaches a page
   another leaf of the same audit owns, that page is named in a PENDING list
   with its owner, so this file is green on its own branch and the list is
   the record of what the train still has to land.

   Most tests read files. The last group opens coming-soon.html in a browser,
   because the order and the labels a buyer meets are rendered by script.
   Run from this checkout on its own port:
     NV_PORT=3297 npx playwright test tests/site-live-platform.spec.js
   SITE_ROOT=<a checkout> points the file tests at another tree, which is how
   they were shown red on the site as it was before this change.
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

const roadmap = () => {
  const w = {};
  vm.runInNewContext(read('roadmap-config.js'), { window: w }, { timeout: 1000 });
  return w.NV_ROADMAP;
};
const pricing = () => {
  const w = {};
  vm.runInNewContext(read('pricing-config.js'), { window: w }, { timeout: 1000 });
  return w.NV_PRICING;
};
/* The label each status renders as, read out of coming-soon.html's renderer
   rather than typed here, the same way check-consistency.js guard 7o does. */
const statusLabels = () => {
  const m = /var\s+statusLabel\s*=\s*(\{[^}]*\})/.exec(read('coming-soon.html'));
  const out = {};
  for (const p of m[1].matchAll(/([a-z_]+)\s*:\s*"([^"]*)"/g)) out[p[1]] = p[2];
  return out;
};
const labelOf = (s, labels) => (s.status !== 'available' && s.statusLabel) || labels[s.status] || s.status;

/* ---------- what a reader reads ----------

   Comments are not copy: the edited pages keep, in comments, the sentences
   they replaced, so the next editor knows why. Everything else is: visible
   text, attribute text, and the JSON-LD an answer engine quotes. */
const ENT = [[/&amp;/g, '&'], [/&middot;/g, '·'], [/&rsquo;|&#8217;/g, '’'], [/&nbsp;/g, ' '], [/&quot;/g, '"'], [/&#39;/g, "'"]];
const decode = (s) => ENT.reduce((t, [re, v]) => t.replace(re, v), s);
const BLOCK = /<\/?(?:p|li|ul|ol|div|h[1-6]|br|td|th|tr|table|details|summary|section|header|footer|main|nav|title|label|button|option|script|form)\b[^>]*>/gi;

/** An HTML file as the blocks a reader meets one at a time: comments gone,
 *  block tags ending a unit, inline tags dropped, JSON-LD strings each their
 *  own unit. */
function htmlBlocks(html) {
  const noComments = html.replace(/<!--[\s\S]*?-->/g, ' ');
  const out = [];
  for (const m of noComments.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const walk = (v) => (typeof v === 'string' ? out.push(v) : v && typeof v === 'object' && Object.values(v).forEach(walk));
    walk(JSON.parse(m[1]));
  }
  const body = noComments.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
  /* Attribute copy a reader meets: descriptions, alt text, labels. */
  for (const m of body.matchAll(/\b(?:content|alt|aria-label|title)="([^"]{12,})"/g)) out.push(decode(m[1]));
  for (const part of body.split(BLOCK)) {
    const t = decode(part.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (t) out.push(t);
  }
  return out;
}
/** Every string a config or script carries, which is what its page renders.
 *  Comments are stripped first, so a string quoted in a comment is not one. */
function jsStrings(js) {
  const code = js.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1');
  return [...code.matchAll(/"((?:[^"\\\n]|\\.)*)"/g)].map((m) => m[1]);
}
const mainText = (html) => {
  const m = /<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html);
  return htmlBlocks(m ? m[1] : html).join(' ');
};

/* The served text surfaces a buyer or an answer engine can read. Root pages,
   the configs they render from, llms.txt and the search index; and the
   sources the homepage and the content pages are generated from, because a
   claim in a source comes back on the next build. */
function surfaces() {
  const out = [];
  for (const f of fs.readdirSync(root)) {
    if (f.endsWith('.html')) out.push([f, htmlBlocks(read(f))]);
    else if (/^(?:roadmap-config|pricing-config|site)\.js$/.test(f)) out.push([f, jsStrings(read(f))]);
    else if (f === 'llms.txt') out.push([f, read(f).replace(/\r/g, '').split(/\n\s*\n|\n- /).map((b) => b.replace(/\s+/g, ' '))]);
    else if (f === 'search-index.json') {
      const blocks = [];
      const walk = (v) => (typeof v === 'string' ? blocks.push(v) : v && typeof v === 'object' && Object.values(v).forEach(walk));
      walk(JSON.parse(read(f)));
      out.push([f, blocks]);
    }
  }
  for (const s of ['scripts/film/sections.html', 'scripts/film/source.html']) {
    if (fs.existsSync(path.join(root, s))) out.push([s, htmlBlocks(read(s))]);
  }
  if (fs.existsSync(path.join(root, 'scripts/content/pages.mjs'))) out.push(['scripts/content/pages.mjs', jsStrings(read('scripts/content/pages.mjs'))]);
  return out;
}

/* ---------- PLATFORM-1, PLATFORM-2: the Revenue Engine is not offered ---------- */

/* An intake is an offer by invitation, whatever it is called: applying,
   being considered, being accepted, the first builds, a place in line. O50
   says the Revenue Engine is offered neither way. */
const INTAKE = [
  [/\b(?:apply|applying|applied|applications?|applicants?)\b/i, 'an application'],
  [/\bfirst (?:builds?|clients?|cohort)\b/i, 'a "first builds" intake'],
  [/\b(?:accepted|chosen|selected|considered) (?:on|for|by)\b/i, 'acceptance onto it'],
  [/\b(?:waitlist|wait list|early access|founding (?:client|member)s?)\b/i, 'a place in line'],
  [/\b(?:not yet generally available|limited availability|private development)\b/i, 'limited availability, which says it is offered to someone'],
];

test('PLATFORM-1: no served surface offers the Revenue Engine, by application or any other intake', () => {
  const bad = [];
  for (const [file, blocks] of surfaces()) {
    for (const b of blocks) {
      if (!/\bRevenue Engine\b/i.test(b)) continue;
      for (const [re, what] of INTAKE) if (re.test(b)) bad.push(`${file}: ${what}: "${b.slice(0, 160)}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- PLATFORM-5: nothing runs, so nothing is measured today ---------- */

/* ---------- PLATFORM-3, PLATFORM-7: one status word, the pricing page's ---------- */

/* llms.txt is what an answer engine quotes, so it carries the same word.
   Its "IN DEVELOPMENT OR BEING RESEARCHED" line named Customer Reactivation
   after pricing and the Roadmap both said coming. llms.txt was another
   leaf's file in this audit, so the item sat PENDING here until
   polish-machine filed it under llms.txt's COMING line (2026-10-03), and
   its entry is gone. An entry expires itself: the day llms.txt files a
   pending item as coming, this test fails until the entry is deleted, so
   an exemption cannot outlive its fix. Empty is the steady state. */
const LLMS_COMING_PENDING = {};

/* ---------- PLATFORM-7, PLATFORM-8: an unbuilt entry says what it WOULD do ---------- */

/* ---------- PLATFORM-6: no quantity on who has it ---------- */

/* A count only matters where it says who HAS the service: "leads contact
   several companies" is a buyer's problem, not a client count. */
const HAS_IT = /\b(?:invitation|offered|onboarded|signed up|using|uses|use it|work(?:ing)? with|agreements?)\b/i;
const QUANTITY = /\b(?:a few|several|a handful of|a small number of|some|many|dozens of|hundreds of|\d+)\s+(?:of\s+(?:our|the)\s+)?(?:businesses|clients|companies|customers|trades|contractors)\b/i;

test('PLATFORM-6: the Roadmap and the pages that tell its story put no number on who has a service', () => {
  /* The homepage is read too, as its source and as both built copies: its
     Lead Generation fine print said "offered by invitation, to a few
     businesses under their own agreement" until the post-launch truth sweep
     (TRUTH-1, 2026-11-09), while this test left it out as another leaf's.
     how-you-start.html's "We take on a few businesses at a time" is capacity,
     not a count of clients, and is not a sentence about who has a service.
     SHOWN RED BEFORE IT WAS TRUSTED (2026-11-09): with SITE_ROOT at main
     0fb6589 this test failed on scripts/film/sections.html, home.html and
     index.html, "a few businesses" in each, and passed on this branch. */
  /* The Roadmap, the Revenue Engine page and About redirect to the
     homepage since owner decision #81 (2026-11-10). */
  const files = ['roadmap-config.js', 'scripts/film/sections.html', 'scripts/film/source.html', 'home.html', 'index.html', 'book.html'];
  const bad = [];
  for (const f of files) {
    const blocks = f.endsWith('.js') ? jsStrings(read(f)) : htmlBlocks(read(f));
    for (const b of blocks) if (QUANTITY.test(b) && HAS_IT.test(b)) bad.push(`${f}: "${b.match(QUANTITY)[0]}" in "${b.slice(0, 140)}"`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- TRUTH-2: no question builder, on any served surface ---------- */

/* The client agent is built from hours, services, area, the approved FAQ and
   a booking link, and asks about the job, where it is and how urgent it is
   (engine canonical ai_front_desk, agent-draft.ts buildClientAgentPrompt).
   Nothing lets a client set the questions it asks. The rule that says so,
   question-builder in scripts/content/claim-rules.mjs, ran only over the
   pages that file builds, so pricing.html's "What every plan includes"
   (from pricing-config.js), the homepage, How you start, the proposal and
   llms.txt said the opposite while it was green (post-launch truth sweep,
   TRUTH-2, 2026-11-09). This runs the same rule, imported rather than
   restated, over every surface surfaces() reads. llms.txt's "> " quote
   marks are dropped first, so a sentence wrapped across them reads whole.
   SHOWN RED BEFORE IT WAS TRUSTED (2026-11-09): with SITE_ROOT at main
   0fb6589 it failed with 13 findings, two each in scripts/film/sections.html,
   home.html, index.html, proposal.html and llms.txt, and one each in
   pricing-config.js, pricing.html and how-you-start.html; green on this
   branch. */
test('TRUTH-2: no served surface says the owner sets or approves the questions the receptionist asks', async () => {
  const { claimFindings } = await import('../scripts/content/claim-rules.mjs');
  const bad = [];
  for (const [file, blocks] of surfaces()) {
    for (const raw of blocks) {
      const b = raw.replace(/(^|\s)>(?=\s)/g, ' ');
      for (const f of claimFindings(b, file)) if (f.id === 'question-builder') bad.push(`${file}: "${f.excerpt}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- COMING-4: a price is promised for what can be bought ---------- */

/* ---------- PLATFORM-4: About leads with the platform, in door order ---------- */

/* ---------- MACHINE-24, CHECK-RUNNER-7: one breadcrumb, a description that fits ---------- */

/* Pages another leaf of the same audit owns, with the defect it is fixing.
   Each entry is skipped here, not excused: its owner's brief carries it. */
const BREADCRUMB_PENDING = {};
const DESCRIPTION_PENDING = {};
const rootPages = () => fs.readdirSync(root).filter((f) => f.endsWith('.html'));

test('MACHINE-24: a page carries one BreadcrumbList, the generated one', () => {
  const bad = [];
  for (const f of rootPages()) {
    if (BREADCRUMB_PENDING[f]) continue;
    const html = read(f).replace(/<!--(?! \/?generated:schema)[\s\S]*?-->/g, ' ');
    const gen = /<!-- generated:schema -->([\s\S]*?)<!-- \/generated:schema -->/.exec(html);
    const outside = gen ? html.replace(gen[0], ' ') : html;
    const handWritten = (outside.match(/"@type"\s*:\s*"BreadcrumbList"/g) || []).length;
    const generated = gen ? (gen[1].match(/"@type"\s*:\s*"BreadcrumbList"/g) || []).length : 0;
    if (handWritten) bad.push(`${f}: ${handWritten} hand-written BreadcrumbList beside ${generated} generated`);
    if (generated > 1) bad.push(`${f}: ${generated} generated BreadcrumbLists`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('CHECK-RUNNER-7: every search description is 160 characters or fewer', () => {
  const bad = [];
  for (const f of rootPages()) {
    if (DESCRIPTION_PENDING[f]) continue;
    const html = read(f);
    for (const m of html.matchAll(/<meta (?:name="description"|property="og:description") content="([^"]*)"/g)) {
      const d = decode(m[1]);
      if (d.length > 160) bad.push(`${f}: ${d.length} characters: "${d}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- the rendered Roadmap ---------- */
