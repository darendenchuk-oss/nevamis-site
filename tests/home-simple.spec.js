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
               each with its rate per extra minute (terms.html says the
               rates are stated here), and the one line of terms
     one       every action a visitor can see books the call or dials the
               demo line, and each Book button sends its own event
     truth     no Lead Generation, no invitation, no pilot, trial or
               discount, no question builder, no booking, no em dash, and
               none of the other products the film's stations described
     film      the film plays with no station menu, no pane or dot labels,
               no station or node card and no scan link: nothing on the
               page names or opens anything but the answered call
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

/* The page a visitor reads: all of <main>, which holds nothing hidden. */
const shown = (html) => html.slice(html.indexOf('<main id="main">'), html.indexOf('</main>'));
/* What the film's station menu, labels and cards were made of. None of it is
   on the page since decision #81's follow-up: the film plays without them. */
const FILM_MENU = ['paneNav', 'labels', 'nlabel', 'card', 'cardBody', 'ncard', 'ncardBody', 'doc'];
/* The products the station cards described. The homepage sells the answered
   call and names nothing else. */
const OTHER_PRODUCTS = [/\bPULSE\b/, /Quote Recovery/i, /Quote-Chase/i, /Missed-Call Recovery/i, /Automatic Lead Tracking/i,
  /Get-Paid Autopilot/i, /Daily (?:Business )?Brief/i, /Inbox Assistant/i, /Revenue Engine/i, /Review Engine/i, /Search Rankings/i];
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

  test(`price: ${page} states the three Front Desk sizes from pricing-config.js, smallest first, each with its extra-minute rate, and the terms`, () => {
    const html = read(page);
    const h = hero(html);
    const list = (/<!-- generated:prices --><ul class="prices">([\s\S]*?)<\/ul><!-- \/generated:prices -->/.exec(h) || [])[1];
    expect(list, 'the generated price list is in the hero').toBeTruthy();
    const rows = [...list.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => text(m[1].replace(/<\/(?:b|span)>/g, ' | ')));
    /* The rate is the config's overage, in cents: terms.html says each
       size's rate for a minute past its allowance is stated here. */
    const want = P.frontDeskTiers().map((t) => `${t.name} | ${P.money(t.monthly)} a month | ${t.includedMinutes.toLocaleString('en-CA')} minutes | `
      + `C$${t.overage.toFixed(2)} per extra minute |`);
    expect(want.length).toBe(3);
    for (const t of P.frontDeskTiers()) expect(typeof t.overage, `${t.name} has an overage in pricing-config.js`).toBe('number');
    expect(rows).toEqual(want);
    expect(text(h)).toContain('Plus GST/HST. No setup fee. Month to month, cancel any time.');
    /* One price list on the page, the hero's. */
    expect(html.split('<!-- generated:prices -->').length - 1).toBe(1);
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
      /\bdiscount/i, /\bqualif/i, /Launch (?:&|and) Implementation/i, /\bbooks? (?:the )?jobs?\b/i, /questions you (?:approve|choose|set)/i, /\u2014|&mdash;/,
      /rules you approve/i, ...OTHER_PRODUCTS]) {
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

  /* Until this rule the film carried a six-station menu (01 The scan to 06
     Plans), a "+ open" label on each pane and a label on each named dot, and
     pressing any of them opened a card filled from a hidden #doc section that
     described ten other products and linked to the scan. */
  test(`film: ${page} carries no station menu, label, card or scan link, and no hidden station text`, () => {
    const html = read(page);
    for (const id of FILM_MENU) expect(html, `#${id}`).not.toContain(`id="${id}"`);
    expect(html).not.toMatch(/class="(?:pane-doc|plabel|doc-sub|node-list)\b/);
    expect(html).not.toMatch(/data-pane=/);
    expect(html).not.toMatch(/\+ open|\+ what it does/);
    expect(html).not.toContain('app.nevamis.ca/scan');
    expect(html).not.toMatch(/\bScan my (?:website|business)\b/i);
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

test('price: the hero shows each size\'s rate per extra minute, as pricing-config.js has it, at 1440 and 390', async ({ browser }) => {
  for (const width of [1440, 390]) {
    const { ctx, page } = await homeWith(browser, reply(503, { open: false }), { width, height: width > 400 ? 900 : 844 });
    const rows = page.locator('#hero .prices li');
    const tiers = P.frontDeskTiers();
    await expect(rows).toHaveCount(tiers.length);
    for (let i = 0; i < tiers.length; i++) {
      await expect(rows.nth(i)).toBeVisible();
      await expect(rows.nth(i)).toContainText(tiers[i].name);
      await expect(rows.nth(i)).toContainText(`C$${tiers[i].overage.toFixed(2)} per extra minute`);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await ctx.close();
  }
});

/* With motion, inside the film: nothing of the old station menu is in the
   document, and pressing the panes and the floor opens nothing. */
test('film: with motion the film plays at 1440x900 and 390x844 with no station menu, label or card to show', async ({ browser }) => {
  test.setTimeout(240_000);
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'no-preference' });
    await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    try {
      await page.goto('/', { waitUntil: 'load' });
      await page.waitForFunction(() => document.documentElement.classList.contains('nv-live'), null, { timeout: 90_000 });
      const menu = FILM_MENU.map((id) => '#' + id).concat(['.pane-doc', '.plabel', '[data-pane]', '[role="dialog"]']).join(', ');
      for (const at of [0.2, 0.5, 0.8]) {
        await page.evaluate((at) => {
          const sc = document.getElementById('scroll');
          const top = sc.getBoundingClientRect().top + scrollY;
          window.scrollTo(0, Math.round(top + at * (sc.offsetHeight - innerHeight)));
        }, at);
        await expect.poll(() => page.evaluate(() => ['nv-above', 'nv-below'].filter((c) => document.documentElement.classList.contains(c))),
          { message: `the film never took the screen at ${at}`, timeout: 30_000 }).toEqual([]);
        expect(await page.locator(menu).count(), `film chrome in the document at ${at} of the film (${vp.width}x${vp.height})`).toBe(0);
        for (const [fx, fy] of [[0.5, 0.5], [0.3, 0.4], [0.7, 0.4], [0.5, 0.65]]) {
          await page.mouse.click(Math.round(vp.width * fx), Math.round(vp.height * fy));
        }
        await page.waitForTimeout(400);
        expect(await page.evaluate(() => document.body.classList.contains('card-open')), 'a press on the film opened a card').toBe(false);
        expect(await page.locator(menu).count(), 'a press on the film added a menu, label or card').toBe(0);
        expect(await page.locator('a[href*="app.nevamis.ca/scan"]').count()).toBe(0);
      }
      /* The film still plays to its ending and its one action. */
      await page.evaluate(() => {
        const sc = document.getElementById('scroll');
        const top = sc.getBoundingClientRect().top + scrollY;
        window.scrollTo(0, Math.ceil(top + sc.offsetHeight - innerHeight));
      });
      await expect.poll(() => page.evaluate(() => document.getElementById('close').classList.contains('on')),
        { message: 'the film never reached its ending', timeout: 90_000 }).toBe(true);
      await expect(page.locator('#close a')).toHaveText('Book a 15-minute call');
      expect(errors).toEqual([]);
    } finally {
      await ctx.close();
    }
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
