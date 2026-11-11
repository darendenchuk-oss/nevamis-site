/* ============================================================
   THE HOMEPAGE IS ONE MESSAGE, THE PRICE AND ONE BUTTON
   (owner decision #81, 2026-11-10).

   Replaces tests/home-door-order.spec.js, which held the page to the door
   order of decision #54 (Lead Generation first). The film stays; around it
   the page says what the agent does and nothing else, states the three
   Front Desk sizes exactly as pricing-config.js has them, and offers one
   action, Book a 15-minute call. Each rule below is the rule, so a sibling
   sentence anywhere on the page fails it too:

     message   one h1, the sentence of what the owner gets, the demo line
     price     the three sizes, smallest first, figures from the config,
               and the one line of terms
     one       every action a visitor can see books the call or dials the
               demo line, and each Book button sends its own event
     truth     no Lead Generation, no invitation, no pilot, trial or
               discount, no question builder, no booking, no em dash
     machine   the meta description, the Organization and the offers say
               the same, and publish no FAQ
     weight    the served homepage carries no source comments
     gate      the free month is said only while the engine has a place
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const P = (() => {
  const sandbox = { window: {} };
  vm.runInNewContext(read('pricing-config.js'), sandbox, { timeout: 1000 });
  return sandbox.window.NV_PRICING;
})();

/* Both homepages: home.html is what compose.py writes and index.html is what
   nevamis.ca serves. */
const PAGES = ['home.html', 'index.html'];

/* The page a visitor reads: <main> without the film's #doc section, which
   the film reads for its station cards and the page never shows. */
function shown(html) {
  const main = html.slice(html.indexOf('<main id="main">'), html.indexOf('</main>'));
  const doc = main.indexOf('<section id="doc"');
  return doc < 0 ? main : main.slice(0, doc);
}
const text = (markup) => markup
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ').trim();
const anchors = (markup) => [...markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map((m) => ({
  href: (/\bhref="([^"]*)"/.exec(m[1]) || [, ''])[1],
  evt: (/\bdata-evt="([^"]*)"/.exec(m[1]) || [, ''])[1],
  cls: (/\bclass="([^"]*)"/.exec(m[1]) || [, ''])[1],
  text: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
}));
const hero = (html) => {
  const a = html.indexOf('<section id="hero">');
  return a < 0 ? '' : html.slice(a, html.indexOf('</section>', a));
};

for (const page of PAGES) {
  test(`message: ${page} says what the agent does, once, and gives the demo line`, () => {
    const html = read(page);
    expect((html.match(/<h1\b/g) || []).length).toBe(1);
    const h = hero(html);
    expect(h, 'the hero is the first thing in <main>').not.toBe('');
    expect(text((/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(h) || [])[1] || '')).toBe('We answer the calls you miss.');
    const t = text(h);
    expect(t).toContain("24/7, in your business's name, on your own number.");
    expect(t).toContain("You get the caller's name, number, the job, where it is and how urgent it is, by text and email within seconds.");
    expect(t).toContain('Call (587) 413-0035 and hear it answer.');
    const tel = anchors(h).filter((a) => a.href.startsWith('tel:'));
    expect(tel.map((a) => [a.href, a.evt])).toEqual([['tel:+15874130035', 'hero_live_demo_call_click']]);
  });

  test(`price: ${page} states the three Front Desk sizes from pricing-config.js, smallest first, and the terms`, () => {
    const h = hero(read(page));
    const list = (/<!-- generated:prices --><ul class="prices">([\s\S]*?)<\/ul><!-- \/generated:prices -->/.exec(h) || [])[1];
    expect(list, 'the generated price list is in the hero').toBeTruthy();
    const rows = [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1].replace(/<\/(?:b|span)>/g, ' | ')));
    const want = P.frontDeskTiers().map((t) => `${t.name} | ${P.money(t.monthly)} a month | ${t.includedMinutes.toLocaleString('en-CA')} minutes |`);
    expect(want.length).toBe(3);
    expect(rows).toEqual(want);
    expect(text(h)).toContain('Plus GST/HST. No setup fee. Month to month, cancel any time.');
    /* The film's Plans card shows the same generated list. */
    const plans = (/<article class="pane-doc" id="doc-plans">([\s\S]*?)<\/article>/.exec(read(page)) || [])[1] || '';
    expect(plans).toContain(`<ul class="prices">${list}</ul>`);
    expect(text(plans)).not.toMatch(/Partnership|The Works|Enterprise|Launch (?:&|and) Implementation/);
  });

  test(`one: every action ${page} shows books the 15-minute call or dials the demo line`, () => {
    const html = read(page);
    const acts = anchors(shown(html));
    expect(acts.length).toBeGreaterThan(0);
    for (const a of acts) expect(a.href, `${a.text} -> ${a.href}`).toMatch(/^(?:\/book\.html(?:#pick-a-time)?|tel:\+15874130035)$/);
    const books = acts.filter((a) => a.href.startsWith('/book.html'));
    for (const b of books) expect(b.text).toBe('Book a 15-minute call');
    expect(books.map((b) => b.evt).sort()).toEqual(['film_book_click', 'hero_book_call_click']);
    const nav = anchors((/<nav class="main-nav"[\s\S]*?<\/nav>/.exec(html) || [''])[0]);
    expect(nav.map((a) => [a.href, a.evt, a.text])).toEqual([['/book.html', 'nav_book_call_click', 'Book a 15-minute call']]);
    const bar = anchors((/<a class="callbar"[^>]*>[^<]*<\/a>/.exec(html) || [''])[0]);
    expect(bar.map((a) => [a.href, a.evt, a.text])).toEqual([['/book.html#pick-a-time', 'callbar_book_click', 'Book a 15-minute call']]);
    expect(html).not.toContain('class="nav-toggle"');
  });

  test(`truth: ${page} offers nothing but the answered call`, () => {
    const html = read(page);
    const t = text(html.slice(html.indexOf('<body')));
    for (const re of [/lead generation/i, /by invitation/i, /customers you want/i, /\bpilot\b/i, /\btrials?\b/i,
      /\bdiscount/i, /\bqualif/i, /Launch (?:&|and) Implementation/i, /\bbooks? (?:the )?jobs?\b/i, /questions you (?:approve|choose|set)/i, /—|&mdash;/]) {
      expect(t, `${re} on the served page`).not.toMatch(re);
    }
    /* No section of the old page is left: no offers, calculator, FAQ,
       industries, plans strip or closing section. */
    for (const id of ['found', 'recover', 'answer', 'industries', 'roi', 'plans', 'start', 'faq', 'next']) {
      expect(html, `#${id}`).not.toContain(`id="${id}"`);
    }
    expect(html).not.toMatch(/<details\b/);
  });

  test(`machine: ${page}'s description, Organization and offers say the same`, () => {
    const html = read(page);
    const desc = (/<meta name="description" content="([^"]*)">/.exec(html) || [])[1];
    expect(desc).toBeTruthy();
    expect(desc.length).toBeLessThanOrEqual(160);
    expect(desc).toMatch(/^We answer the calls you miss, 24\/7/);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => [].concat(JSON.parse(m[1])));
    const org = blocks.find((b) => b['@id'] === 'https://nevamis.ca/#organization');
    expect(org.email).toBe('Sales@nevamis.ca');
    expect(org.telephone).toBe('+1-587-413-0035');
    expect(JSON.stringify(org)).not.toMatch(/lead generation|invitation|qualif/i);
    const svc = blocks.find((b) => b['@type'] === 'Service');
    expect(svc.offers.map((o) => o.name)).toEqual(P.frontDeskTiers().map((t) => t.name));
    expect(JSON.stringify(svc)).not.toMatch(/lead generation|invitation|quote recovery/i);
    expect(blocks.some((b) => b['@type'] === 'FAQPage')).toBe(false);
  });

  test(`weight: ${page} serves no source comments, only the builders' generated markers`, () => {
    const html = read(page).replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const left = [...html.matchAll(/<!--[\s\S]*?-->/g)].map((m) => m[0])
      .filter((c) => !/^<!-- \/?generated:[a-z]+ -->$/.test(c) && !/^<!-- GENERATED\. Do not edit: run `node scripts\/build-pages\.mjs`\./.test(c));
    expect(left.length, `comments still served: ${left.slice(0, 3).map((c) => c.slice(0, 60)).join(' | ')}`).toBe(0);
    const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
    expect(css.match(/\/\*[\s\S]*?\*\//g) || [], 'CSS comments still served').toEqual([]);
  });
}

/* ---------- in the browser ---------- */

const ENDPOINT = 'https://app.nevamis.ca/api/free-month';
async function homeWith(browser, answer, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const errors = [];
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => (r.request().url().startsWith(ENDPOINT)
    ? answer(r) : r.fulfill({ status: 204, body: '' })));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?rm=1');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  return { ctx, page, errors };
}
const reply = (status, body) => (r) => r.fulfill({ status, contentType: 'application/json',
  headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });

test('gate: the hero says the first month free only while the engine has a place', async ({ browser }) => {
  const line = '#hero [data-nv-free-month]';
  {
    for (const width of [1440, 390]) {
      const { ctx, page, errors } = await homeWith(browser, reply(200, { open: true, cap: P.freeMonth.firstClients }), { width, height: 900 });
      await expect(page.locator(line)).toBeVisible();
      await expect(page.locator(line)).toHaveText(P.foundingClient.offer);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(errors).toEqual([]);
      await ctx.close();
    }
  }
  for (const answer of [reply(200, { open: false, cap: P.freeMonth.firstClients }), reply(503, { open: false }), (r) => r.abort()]) {
    const { ctx, page } = await homeWith(browser, answer);
    await expect(page.locator(line)).toBeHidden();
    expect(await page.locator('body').innerText()).not.toMatch(/month free|free month/i);
    await ctx.close();
  }
});

test('one: on a phone the call bar carries the Book button while the hero\'s is off screen, and nothing scrolls sideways', async ({ browser }) => {
  for (const width of [320, 390]) {
    const { ctx, page } = await homeWith(browser, reply(503, { open: false }), { width, height: 640 });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(sw).toBeLessThanOrEqual(width);
    await expect(page.locator('.main-nav')).toBeHidden();
    await page.locator('#hero .ctarow').scrollIntoViewIfNeeded();
    await expect(page.locator('#hero .ctarow .btn')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.locator('a.callbar')).toBeVisible();
    await ctx.close();
  }
});
