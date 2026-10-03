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

test('PLATFORM-1: revenue-engine.html starts nothing; its action is the Roadmap interest path for it', () => {
  const html = read('revenue-engine.html');
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html.replace(/<!--[\s\S]*?-->/g, ' '))[1];
  const hrefs = [...main.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ href: m[1], text: m[2].replace(/<[^>]*>/g, '').trim() }));
  /* A booked call is how a by-invitation service starts (DC#54); the page for
     something not offered has no call to book about it. The site chrome's own
     Book a call sits outside <main> and is not this page's offer. */
  const book = hrefs.filter((a) => /\/book\.html/.test(a.href));
  expect(book, `revenue-engine.html main links to booking: ${JSON.stringify(book)}`).toEqual([]);
  const interest = hrefs.filter((a) => /^\/coming-soon\.html\?service=revenue-engine(?:#interest)?$/.test(a.href));
  expect(interest.length, 'the Revenue Engine page must send its reader to the Roadmap interest form for it').toBeGreaterThan(0);
  /* Its primary button IS that path. */
  const primary = [...main.matchAll(/<a class="btn btn-primary[^"]*"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  expect(primary.length).toBeGreaterThan(0);
  for (const h of primary) expect(h, 'every primary button on the Revenue Engine page').toMatch(/^\/coming-soon\.html\?service=revenue-engine/);
});

test('PLATFORM-2: every link into the Roadmap form names an entry the form can tick', () => {
  const R = roadmap();
  const tickable = new Set(R.services.filter((s) => ['planned', 'researching', 'paused'].includes(s.status)).map((s) => s.slug));
  const bad = [];
  for (const f of fs.readdirSync(root).filter((x) => x.endsWith('.html'))) {
    for (const m of read(f).replace(/<!--[\s\S]*?-->/g, ' ').matchAll(/href="\/coming-soon\.html\?service=([^"#&]+)/g)) {
      if (!tickable.has(m[1])) bad.push(`${f}: ?service=${m[1]} ticks nothing on the form`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('PLATFORM-2: the Revenue Engine page tells the Roadmap pricing story, not a per-business one', () => {
  const text = mainText(read('revenue-engine.html'));
  /* The Roadmap: "it gets a published price before anyone signs up for it". */
  expect(text).toMatch(/published price before anyone signs up/i);
  for (const re of [/\bscoped and confirmed in writing\b/i, /\bstanding offer\b/i, /\bper business\b/i, /\bno engagement\b/i]) {
    expect(text, `revenue-engine.html prices it per business: ${re}`).not.toMatch(re);
  }
});

/* ---------- PLATFORM-5: nothing runs, so nothing is measured today ---------- */

test('PLATFORM-5: the Revenue Engine page claims no present-tense delivery, reporting included', () => {
  const blocks = htmlBlocks(read('revenue-engine.html'));
  const PRESENT = /\b(?:we|nevamis)\s+(?:measure|report|track|tie|attribute|deliver|show|send)s?\b|\b(?:ties|tracks|reports|measures|attributes) (?:each|every|your)\b/i;
  const bad = blocks.filter((b) => PRESENT.test(b));
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- PLATFORM-3, PLATFORM-7: one status word, the pricing page's ---------- */

test('PLATFORM-3/7: every item pricing lists as coming is on the Roadmap, labelled COMING', () => {
  const R = roadmap();
  const labels = statusLabels();
  /* Both of pricing's places: the catalog blurb and the rendered page line. */
  const coming = new Set(pricing().addOns.filter((a) => /\bComing\b/.test(a.blurb || '')).map((a) => a.name));
  for (const m of read('pricing.html').matchAll(/<li>([^<&]+?) &middot; coming &middot;/g)) coming.add(m[1].trim());
  expect(coming.size, 'pricing lists nothing as coming: has its markup changed?').toBeGreaterThan(0);
  for (const name of coming) {
    const s = R.services.find((x) => x.name === name);
    expect(s, `${name} is coming on pricing and missing from the Roadmap that says it shows everything`).toBeTruthy();
    expect(labelOf(s, labels).toLowerCase(), `${name}: the Roadmap's word`).toBe('coming');
    expect(['available', 'private_pilot'], `${name} is coming, so not live and not by invitation`).not.toContain(s.status);
    expect(s.cta, `${name} has nothing to start`).toBeUndefined();
  }
});

/* llms.txt is what an answer engine quotes, so it carries the same word.
   Its "IN DEVELOPMENT OR BEING RESEARCHED" line named Customer Reactivation
   after pricing and the Roadmap both said coming. llms.txt is
   site-live-machine's file in this audit, so the item is PENDING under that
   leaf. The entry expires itself: the day llms.txt files it as coming, this
   test fails until the entry is deleted, so the exemption cannot outlive the fix. */
const LLMS_COMING_PENDING = { 'Customer Reactivation': 'site-live-machine' };

test('PLATFORM-3/7: llms.txt files every item pricing lists as coming as coming, not in development', () => {
  const coming = new Set(pricing().addOns.filter((a) => /\bComing\b/.test(a.blurb || '')).map((a) => a.name));
  for (const m of read('pricing.html').matchAll(/<li>([^<&]+?) &middot; coming &middot;/g)) coming.add(m[1].trim());
  expect(coming.size).toBeGreaterThan(0);
  const text = read('llms.txt').replace(/\r/g, '');
  const bullets = text.split(/\n(?=- )|\n\s*\n/).map((b) => b.replace(/\s+/g, ' ').trim());
  const dev = bullets.find((b) => /^- IN DEVELOPMENT\b/.test(b));
  expect(dev, 'llms.txt has no IN DEVELOPMENT line: has its markup changed?').toBeTruthy();
  const sentences = (b) => b.split(/(?<=\.)\s+/);
  const bad = [];
  for (const name of coming) {
    const misfiled = sentences(dev).some((x) => x.includes(name) && !/\bcoming\b/i.test(x));
    const saidComing = bullets.some((b) => sentences(b).some((x) => x.includes(name) && /\bcoming\b/i.test(x)));
    const wrong = misfiled || !saidComing;
    if (wrong && !LLMS_COMING_PENDING[name]) bad.push(`${name}: llms.txt ${misfiled ? 'files it as in development or being researched' : 'never calls it coming'}`);
    if (!wrong && LLMS_COMING_PENDING[name]) bad.push(`${name}: llms.txt now files it as coming, so delete its LLMS_COMING_PENDING entry`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('PLATFORM-3: the Revenue Engine page grid lists Search Rankings as coming', () => {
  const html = read('revenue-engine.html').replace(/<!--[\s\S]*?-->/g, ' ');
  expect(html).toMatch(/<span class="chip dev">Coming<\/span><h3>Search Rankings<\/h3>/);
});

/* ---------- PLATFORM-7, PLATFORM-8: an unbuilt entry says what it WOULD do ---------- */

test('PLATFORM-7/8: a Roadmap entry that is not live speaks in "would" and promises no result', () => {
  const bad = [];
  for (const s of roadmap().services) {
    if (s.status === 'available' || s.status === 'private_pilot') continue;
    const first = String(s.desc).split(/(?<=\.)\s/)[0];
    /* "Is being built to" only for work in development, which the Roadmap
       labels IN DEVELOPMENT; everything else would. */
    const ok = /\bwould\b/i.test(first) || (/^Is being built to\b/.test(first) && s.statusLabel === 'IN DEVELOPMENT');
    if (!ok) bad.push(`${s.name}: desc "${first}" says it does something`);
    if (s.outcome !== undefined && !/^Would\b/.test(s.outcome)) bad.push(`${s.name}: outcome "${s.outcome}" promises a result`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- PLATFORM-6: no quantity on who has it ---------- */

/* A count only matters where it says who HAS the service: "leads contact
   several companies" is a buyer's problem, not a client count. */
const HAS_IT = /\b(?:invitation|offered|onboarded|signed up|using|uses|use it|work(?:ing)? with|agreements?)\b/i;
const QUANTITY = /\b(?:a few|several|a handful of|a small number of|some|many|dozens of|hundreds of|\d+)\s+(?:of\s+(?:our|the)\s+)?(?:businesses|clients|companies|customers|trades|contractors)\b/i;

test('PLATFORM-6: the Roadmap and the pages that tell its story put no number on who has a service', () => {
  /* Pages owned by another leaf of this audit, and the sentence they still
     carry until it lands: scripts/film/sections.html (and so home.html and
     index.html), "offered by invitation, to a few businesses", is
     site-live-home's. how-you-start.html's "We take on a few businesses at a
     time" is capacity, not a count of clients, and is site-live-buyer's. */
  const files = ['roadmap-config.js', 'coming-soon.html', 'revenue-engine.html', 'about.html'];
  const bad = [];
  for (const f of files) {
    const blocks = f.endsWith('.js') ? jsStrings(read(f)) : htmlBlocks(read(f));
    for (const b of blocks) if (QUANTITY.test(b) && HAS_IT.test(b)) bad.push(`${f}: "${b.match(QUANTITY)[0]}" in "${b.slice(0, 140)}"`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- COMING-4: a price is promised for what can be bought ---------- */

test('COMING-4: no copy promises a published price for everything marked AVAILABLE NOW', () => {
  /* Automatic Lead Tracking is marked AVAILABLE NOW and has no price of its
     own: it runs off the front desk's calls. So the promise may be made about
     what can be bought, never about the label. */
  const labels = statusLabels();
  const live = labels.available;
  const re = new RegExp(`\\b${live}\\b[^.]*\\b(?:published |a )?price`, 'i');
  const bad = [];
  for (const [file, blocks] of surfaces()) for (const b of blocks) if (re.test(b)) bad.push(`${file}: "${b.slice(0, 160)}"`);
  expect(bad, bad.join('\n')).toEqual([]);
  /* And it is true that the label covers something unpriced, or this test
     guards nothing: an AVAILABLE NOW entry whose name pricing.html never says. */
  const priced = read('pricing.html');
  const unpriced = roadmap().services.filter((s) => s.status === 'available' && !priced.includes(s.name));
  expect(unpriced.length, 'every AVAILABLE NOW entry is now named on pricing.html: this rule can relax').toBeGreaterThan(0);
});

/* ---------- PLATFORM-4: About leads with the platform, in door order ---------- */

test('PLATFORM-4: about.html says Lead Generation, then quotes, then the front desk, before its history', () => {
  const text = mainText(read('about.html'));
  const at = (re) => { const m = re.exec(text); return m ? m.index : -1; };
  const lg = at(/\bLead Generation\b/);
  const quotes = at(/\bquotes?\b/i);
  const desk = at(/\bfront desk\b/i);
  const voicemail = at(/\bvoicemail\b/i);
  expect(lg, 'about.html never names Lead Generation').toBeGreaterThanOrEqual(0);
  expect(quotes, 'quotes come after Lead Generation').toBeGreaterThan(lg);
  expect(desk, 'the front desk comes after quotes').toBeGreaterThan(quotes);
  /* The voicemail story is how the company started: history, after the
     platform, never its opening line. */
  if (voicemail >= 0) expect(voicemail, 'the founding story comes after the platform').toBeGreaterThan(desk);
  expect(text).not.toMatch(/\bwe build the front desk that ends\b/i);
});

/* ---------- MACHINE-24, CHECK-RUNNER-7: one breadcrumb, a description that fits ---------- */

/* Pages another leaf of the same audit owns, with the defect it is fixing.
   Each entry is skipped here, not excused: its owner's brief carries it. */
const BREADCRUMB_PENDING = { 'book.html': 'site-live-buyer', 'how-you-start.html': 'site-live-buyer', 'demo.html': 'site-live-content' };
const DESCRIPTION_PENDING = {
  'home.html': 'site-live-home (scripts/film/chrome-source.html)', 'index.html': 'site-live-home (promote.mjs)',
  'how-you-start.html': 'site-live-buyer', 'pricing.html': 'site-live-buyer', 'terms.html': 'site-live-legal', 'demo.html': 'site-live-content',
};
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

test('COMING-2: the Roadmap a buyer meets runs Lead Generation, Quote Recovery, then the front desk', async ({ page }) => {
  await page.goto('/coming-soon.html');
  const names = await page.$$eval('.svc-grid .svc h3', (hs) => hs.map((h) => h.textContent.trim()));
  expect(names.slice(0, 3)).toEqual(['Lead Generation', 'Quote Recovery', 'AI Front Desk']);
  const now = await page.$$eval('#gridNow .svc h3', (hs) => hs.map((h) => h.textContent.trim()));
  expect(now.slice(0, 2), 'the LIVE TODAY shelf opens with Quote Recovery, then the front desk').toEqual(['Quote Recovery', 'AI Front Desk']);
});

test('PLATFORM-3/8: the rendered Roadmap carries Search Rankings as COMING and no empty outcome line', async ({ page }) => {
  await page.goto('/coming-soon.html');
  const card = (name) => page.locator('.svc', { has: page.locator('h3', { hasText: new RegExp(`^${name}$`) }) });
  await expect(card('Search Rankings').locator('.status')).toHaveText('COMING');
  await expect(card('Customer Reactivation').locator('.status')).toHaveText('COMING');
  await expect(card('Search Rankings').locator('button.interest')).toHaveCount(1);
  const empty = await page.$$eval('.svc .outcome', (ps) => ps.filter((p) => !p.textContent.trim()).length);
  expect(empty, 'an outcome paragraph with nothing in it').toBe(0);
  await expect(card('Growth System').locator('.outcome')).toHaveCount(0);
});

test('PLATFORM-1: the Revenue Engine page\'s link ticks the Revenue Engine on the Roadmap form', async ({ page }) => {
  await page.goto('/revenue-engine.html');
  const href = await page.locator('main a.btn-primary').first().getAttribute('href');
  await page.goto(href);
  await expect(page.locator('#svcChecks input[data-slug="revenue-engine"]')).toBeChecked();
  await expect(page.locator('#svcChecks input:checked')).toHaveCount(1);
  await page.goto('/coming-soon.html?service=seo-rankings#interest');
  await expect(page.locator('#svcChecks input[data-slug="seo-rankings"]')).toBeChecked();
});

test('PLATFORM-3: each Revenue Engine page interest link sends the service it is for', async ({ page }) => {
  /* site.js sends a bare [data-evt] name, so three links with one name could
     not be told apart. Each now carries data-svc, and its click sends the slug,
     exactly once. */
  await page.goto('/revenue-engine.html');
  await page.waitForFunction(() => typeof window.nvTrack === 'function');
  const links = await page.$$eval('main a[href^="/coming-soon.html?service="]', (as) => as.map((a) => ({
    slug: new URL(a.href).searchParams.get('service'), svc: a.getAttribute('data-svc'), evt: a.getAttribute('data-evt'),
  })));
  expect(links.length, 'the Revenue Engine page has its interest links').toBeGreaterThanOrEqual(3);
  for (const l of links) {
    expect(l.svc, `a link to ?service=${l.slug} names the same service`).toBe(l.slug);
    expect(l.evt, 'a bare data-evt would send a second, slug-less event').toBeNull();
  }
  const sent = await page.evaluate(() => {
    document.addEventListener('click', (e) => e.preventDefault());
    const out = [];
    for (const a of document.querySelectorAll('main a[href^="/coming-soon.html?service="]')) {
      const before = window.nvEvents.length;
      a.click();
      out.push(window.nvEvents.slice(before).map((e) => [e.event, e.data && e.data.service]));
    }
    return out;
  });
  expect(sent).toEqual(links.map((l) => [['roadmap_service_interest_clicked', l.slug]]));
  expect(sent.flat().map((e) => e[1])).toContain('seo-rankings');
});
