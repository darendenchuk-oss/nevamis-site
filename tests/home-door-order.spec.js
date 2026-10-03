/* ============================================================
   THE HOMEPAGE FOLLOWS THE DOOR ORDER (site-live-home, 2026-10-03).

   Decision #54 (2026-09-18): Lead Generation leads the film and the hero,
   Book a call is the one filled action, and the scan stays as a quiet
   secondary called "Scan my website", described for what it is. The
   whole-site audit of 2026-10-03 found the homepage still telling the scan's
   story (HOME-7), the closing section reversing the buttons (HOME-8), the
   old label kept only because the film matched on it (HOME-11), and a run of
   copy that said more than is true. Each rule below is the RULE, so a
   sibling sentence anywhere on the page fails it too, not only the sentence
   the audit quoted:

     door        in the film's ending, the hero (#found) and the close
                 (#next), the first action is a filled Book a call to
                 /book.html and the scan comes after it, never filled, and
                 is called "Scan my website"
     label       nothing on the page says "Scan my business", and the film
                 script does not select links by any label
     events      the header pill, the hero, the film ending and the close
                 each send their own Book a call event
     copy        no "trial"; no quote "recorded" or "captured"; the
                 calendar FAQ answers "No."; the Lead Generation fine print
                 makes no payment claim; the scan's retired promises are gone;
                 the industries lede does not promise reporting
     machine     the Organization's sales contact is Sales@, the phone is
                 the demo line, knowsAbout leads with Lead Generation and
                 nothing "AI"; the meta
                 description is 160 characters or fewer and says "by
                 invitation"
     grow        the Grow pane lists Search Rankings as not built, with no
                 price and no action
     weight      the served homepage carries no source comments

   The file-reading tests run against SITE_ROOT when it is set, which is how
   each was shown red on the site as it was before this change:
     SITE_ROOT=<a main checkout> NV_PORT=3297 npx playwright test tests/home-door-order.spec.js
   The browser tests always use the served checkout.
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.SITE_ROOT
  ? path.resolve(process.env.SITE_ROOT)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

/* Both homepages: home.html is what compose.py writes and index.html is what
   nevamis.ca serves. A rule that holds on one and not the other is a missed
   promote. */
const PAGES = ['home.html', 'index.html'];

/* What a visitor can read: the body without comments, scripts or styles,
   tags turned into breaks, entities that matter decoded. */
function visibleText(html) {
  const body = html.slice(html.indexOf('<body'));
  return body
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ');
}
const sentences = (text) => text.split(/(?<=[.!?])\s+/);

/* The section (or the film's ending block) by id, as markup. */
function block(html, id) {
  const open = new RegExp(`<section[^>]*\\bid="${id}"[^>]*>`).exec(html);
  if (!open) return null;
  const end = html.indexOf('</section>', open.index);
  return html.slice(open.index, end);
}
const anchors = (markup) => [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
  attrs: m[1],
  cls: (/\bclass="([^"]*)"/.exec(m[1]) || [, ''])[1],
  href: (/\bhref="([^"]*)"/.exec(m[1]) || [, ''])[1],
  evt: (/\bdata-evt="([^"]*)"/.exec(m[1]) || [, ''])[1],
  text: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
}));
const isScan = (a) => /app\.nevamis\.ca\/scan/.test(a.href);
const isBook = (a) => /^\/book\.html/.test(a.href);

/* ---------- door ---------- */

for (const page of PAGES) {
  test(`door: ${page} leads every action row with a filled Book a call, and the scan follows as "Scan my website"`, () => {
    const html = read(page);
    const rows = { close: 'the film ending', found: 'the hero', next: 'the closing section' };
    const bad = [];
    for (const [id, where] of Object.entries(rows)) {
      const b = block(html, id);
      if (!b) { bad.push(`${where} (#${id}) is missing`); continue; }
      const acts = anchors(b).filter((a) => isScan(a) || isBook(a));
      const book = acts.findIndex(isBook), scan = acts.findIndex(isScan);
      if (book < 0) { bad.push(`${where} offers no Book a call`); continue; }
      if (book !== 0) bad.push(`${where}: the first action is "${acts[0].text}", not Book a call`);
      const filled = (a) => /\bbtn-primary\b/.test(a.cls) || (id === 'close' && /(^|\s)cta(\s|$)/.test(a.cls));
      if (!filled(acts[book])) bad.push(`${where}: Book a call is not the filled button (class "${acts[book].cls}")`);
      if (!/^Book a call$/.test(acts[book].text)) bad.push(`${where}: the booking action reads "${acts[book].text}"`);
      if (scan >= 0) {
        if (filled(acts[scan])) bad.push(`${where}: the scan is a filled button (class "${acts[scan].cls}")`);
        if (acts[scan].text !== 'Scan my website') bad.push(`${where}: the scan reads "${acts[scan].text}"`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test(`door: ${page} tells the #54 story in the film and leaves the scan's retired promises off the page`, () => {
    const html = read(page);
    const t = visibleText(html);
    for (const line of ['Who would you want more of this year?', 'You decide every one. Nobody on it is contacted by us.',
      'Tell us who you want more of.', 'Lead Generation is by invitation, and a short call is where it starts.']) {
      expect(t, `the film's #54 line "${line}"`).toContain(line);
    }
    /* #54 names the three promises that leave the homepage; the regexes take
       their siblings too ("where the money is leaking", "each leak"). */
    for (const re of [/\bleak(?:s|ing)?\b/i, /\bevery engagement starts with\b/i]) {
      const hit = sentences(t).find((s) => re.test(s));
      expect(hit, `a retired scan promise is back: "${hit}"`).toBeUndefined();
    }
  });
}

/* ---------- label ---------- */

for (const page of PAGES) {
  test(`label: ${page} never says "Scan my business", and every scan action carries the exit hook`, () => {
    const html = read(page);
    expect(visibleText(html), 'the old label').not.toMatch(/scan my business/i);
    const scans = anchors(html.slice(html.indexOf('<body'))).filter(isScan);
    expect(scans.length, 'the scan is still offered').toBeGreaterThanOrEqual(4);
    for (const a of scans) {
      expect(a.text, `a scan link reads "${a.text}"`).toBe('Scan my website');
      expect(a.attrs, `"${a.text}" (${a.evt}) lost the film's exit flourish`).toMatch(/\bdata-film-exit\b/);
    }
  });
}

test('label: the film wires its exit flourish by data-film-exit, not by any button text', () => {
  const js = read('assets/film/film-2.js');
  expect(js, 'the wiring must select by the attribute').toContain("querySelectorAll('a[data-film-exit]')");
  /* Any regex test against a link's text is the defect, whatever it spells. */
  expect(js).not.toMatch(/\.test\(\s*a\.textContent/);
});

/* ---------- events ---------- */

for (const page of PAGES) {
  test(`events: on ${page} the header, hero, film ending and close each send their own Book a call event`, () => {
    const html = read(page);
    const nav = /<nav class="main-nav"[\s\S]*?<\/nav>/.exec(html);
    expect(nav, 'the header nav').not.toBeNull();
    const evtOf = (markup) => (anchors(markup).find(isBook) || {}).evt;
    const got = {
      header: evtOf(nav[0]),
      hero: evtOf(block(html, 'found') || ''),
      film: evtOf(block(html, 'close') || ''),
      close: evtOf(block(html, 'next') || ''),
    };
    /* The names are the engine's (src/app/api/events/route.ts ALLOWED_NAMES);
       a name it does not know is dropped silently, so they are pinned. */
    expect(got).toEqual({ header: 'nav_book_call_click', hero: 'hero_book_call_click', film: 'film_book_click', close: 'closing_book_call_click' });
    const scans = Object.fromEntries(['found', 'close', 'next'].map((id) => [id, (anchors(block(html, id) || '').find(isScan) || {}).evt]));
    expect(scans).toEqual({ found: 'hero_scan_click', close: 'film_scan_click', next: 'platform_scan_click' });
  });
}

test('events: every page header sends nav_book_call_click from its Book a call pill, never the hero\'s name', () => {
  const map = JSON.parse(read('content-map.json'));
  const bad = [];
  for (const p of map.pages) {
    if (!p.file || !fs.existsSync(path.join(root, p.file))) continue;
    const nav = /<nav class="main-nav"[\s\S]*?<\/nav>/.exec(read(p.file));
    if (!nav) continue;
    for (const a of anchors(nav[0]).filter(isBook)) if (a.evt !== 'nav_book_call_click') bad.push(`${p.file}: header pill sends "${a.evt}"`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

/* ---------- copy ---------- */

for (const page of PAGES) {
  test(`copy: ${page} says what is true about quotes, trials, the calendar and Lead Generation`, () => {
    const html = read(page);
    const t = visibleText(html);
    const bad = [];
    /* The owner rule bans the word on buyer surfaces, a denial included. */
    for (const s of sentences(t)) if (/\btrials?\b/i.test(s)) bad.push(`"trial": ${s}`);
    /* A call is a quote REQUEST; a sent quote is followed up only once it is
       added on the Quotes page. No quote or estimate is recorded or captured. */
    for (const s of sentences(t)) {
      if (/\b(quotes?|estimates?)\b/i.test(s) && /\b(recorded|captured)\b/i.test(s)) bad.push(`quote recorded/captured: ${s}`);
    }
    /* Client agents cannot book: the answer is "No.", with nothing that
       suggests it is coming. */
    const cal = /<summary>Can it book directly into my calendar\?<\/summary><p>([\s\S]*?)<\/p>/.exec(html);
    if (!cal) bad.push('the calendar FAQ is missing');
    else {
      if (!/^No\./.test(cal[1])) bad.push(`the calendar answer opens "${cal[1].slice(0, 40)}"`);
      if (/\b(not yet|yet|coming|soon|today)\b/i.test(cal[1])) bad.push(`the calendar answer hints at later: "${cal[1]}"`);
    }
    /* #54: Lead Generation carries "by invitation" and no price, payment,
       volume or guarantee claim. The hero's fine print is where one stood. */
    const found = visibleText(block(html, 'found') || '');
    for (const re of [/\bpaid\b/i, /\bshare of\b/i, /\$|\bC\$/, /\bPerformance Partnership\b/, /\bguarantee/i]) {
      if (re.test(found)) bad.push(`the Lead Generation hero makes a payment or guarantee claim (${re})`);
    }
    /* The industries lede promises only what the trade pages show, and none
       of them reports anything. */
    const ind = visibleText(block(html, 'industries') || '');
    if (/\breport(ed|s|ing)?\b/i.test(ind)) bad.push('the industries section promises reporting the trade pages do not show');
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

/* ---------- machine-read ---------- */

for (const page of PAGES) {
  test(`machine: ${page}'s Organization names Sales@ for sales and the phone as the demo line, and knowsAbout does not lead with AI`, () => {
    const html = read(page);
    const nodes = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .flatMap((m) => [].concat(JSON.parse(m[1])));
    const org = nodes.find((n) => [].concat(n['@type']).includes('Organization'));
    expect(org, 'the Organization node').toBeTruthy();
    const points = [].concat(org.contactPoint || []);
    const sales = points.filter((c) => /sales/i.test(c.contactType || ''));
    expect(sales.length, 'a sales contact point').toBeGreaterThan(0);
    for (const c of sales) {
      expect(c.telephone, 'the sales contact is not the demo line').toBeUndefined();
      expect(c.email).toBe('Sales@nevamis.ca');
    }
    for (const c of points.filter((x) => x.telephone)) expect(c.contactType, `${c.telephone} is labelled`).toMatch(/demo/i);
    /* knowsAbout follows the door order and leads with nothing AI: the owner
       rule is that Nevamis never leads with "AI". "AI receptionist" stays, last,
       as the search term people type (tests/seo.spec.js pins it). */
    const k = org.knowsAbout || [];
    expect(k[0], 'Lead Generation leads').toMatch(/^lead generation/i);
    expect(k.slice(0, 3).filter((x) => /\bAI\b/.test(x)), 'nothing AI among the first three').toEqual([]);
  });

  test(`machine: ${page}'s meta description is 160 characters or fewer and carries "by invitation"`, () => {
    const d = /<meta name="description" content="([^"]*)">/.exec(read(page));
    expect(d).not.toBeNull();
    const text = d[1].replace(/&amp;/g, '&');
    expect(text.length, text).toBeLessThanOrEqual(160);
    expect(text).toMatch(/by invitation/i);
  });
}

/* ---------- grow ---------- */

test('grow: the Grow pane lists Search Rankings as not built, with no price and no action', () => {
  const html = read('index.html');
  const grow = /<article class="pane-doc" id="doc-grow">([\s\S]*?)<\/article>/.exec(html);
  expect(grow, 'the Grow pane').not.toBeNull();
  const svc = [...grow[1].matchAll(/<div class="svc"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => m[1]).find((s) => /Search Rankings/.test(s));
  expect(svc, 'Search Rankings in the Grow pane').toBeTruthy();
  expect(svc, 'it carries a status chip, and not an available one').toMatch(/<span class="chip dev">[^<]+<\/span>/);
  expect(svc).not.toMatch(/\$|C\$|<a\b|data-addon/);
  expect(svc, 'no canonical capability backs it, so it says what it WOULD do').toMatch(/\bWould\b/);
});

/* ---------- weight ---------- */

for (const page of PAGES) {
  test(`weight: ${page} serves no source comments, only the builders' generated markers`, () => {
    const html = read(page).replace(/<script\b[\s\S]*?<\/script>/gi, '');
    /* Allowed: the builders' region markers, and the one note build-pages
       writes into every page's inlined stylesheet region (scripts/lib/
       inline-css.mjs), which is the builder's to keep or drop, not this
       page's. Everything else came from a source file. */
    const left = [...html.matchAll(/<!--[\s\S]*?-->/g)].map((m) => m[0])
      .filter((c) => !/^<!-- \/?generated:[a-z]+ -->$/.test(c) && !/^<!-- GENERATED\. Do not edit: run `node scripts\/build-pages\.mjs`\./.test(c));
    expect(left.length, `comments still served: ${left.slice(0, 3).map((c) => c.slice(0, 60)).join(' | ')}`).toBe(0);
    const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
    expect(css.match(/\/\*[\s\S]*?\*\//g) || [], 'CSS comments still served').toEqual([]);
  });
}

/* ---------- in the browser ---------- */

test('header: on the homepage the Book a call pill\'s glow is not clipped to a rectangle', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const r = await page.evaluate(() => {
    const a = document.querySelector('.site-header a.btn-primary[href^="/book.html"]');
    const cs = getComputedStyle(a);
    let clip = null;
    for (let n = a.parentElement; n && n !== document.body; n = n.parentElement) {
      const o = getComputedStyle(n);
      if (o.overflow !== 'visible' || o.overflowX !== 'visible' || o.overflowY !== 'visible') {
        const nb = n.getBoundingClientRect(), ab = a.getBoundingClientRect();
        /* A clipping ancestor only matters if it hugs the button: one with
           room around it lets the glow out, as the header does. */
        if (nb.left > ab.left - 20 || nb.right < ab.right + 20 || nb.top > ab.top - 20 || nb.bottom < ab.bottom + 20) {
          clip = (n.className || n.tagName) + ' ' + o.overflow; break;
        }
      }
    }
    return { glow: cs.boxShadow, clip };
  });
  expect(r.glow, 'the premise: the pill has a glow to clip').not.toBe('none');
  expect(r.clip, 'an ancestor clips the glow to the pill\'s own box').toBeNull();
});

test('film ending: Book a call is the filled action and the scan link sits under it, readable and tappable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/home.html?debug=1&nointro=1');
  await page.waitForFunction(() => window.__nv && window.__nv.dbg, null, { timeout: 60_000 });
  await page.evaluate(() => { const d = window.__nv.dbg; window.scrollTo(0, Math.ceil(d.spanH - d.vh)); });
  await expect.poll(() => page.evaluate(() => document.getElementById('close').classList.contains('on')), { timeout: 60_000 }).toBe(true);
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const hit = (a) => { const b = a.getBoundingClientRect(); const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!el && (el === a || a.contains(el)); };
    const book = document.querySelector('#close a.cta'), scan = document.querySelector('#close a.cta-q');
    return { book: book.textContent.trim(), bookHref: book.getAttribute('href'), bookHit: hit(book),
      scan: scan.textContent.trim(), scanHit: hit(scan), below: scan.getBoundingClientRect().top >= book.getBoundingClientRect().bottom };
  });
  expect(r).toEqual({ book: 'Book a call', bookHref: '/book.html#pick-a-time', bookHit: true, scan: 'Scan my website', scanHit: true, below: true });
});
