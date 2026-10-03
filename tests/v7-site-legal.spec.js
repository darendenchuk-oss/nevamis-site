/* ============================================================
   THE v7 LEGAL PAGES AND AGENT DOCUMENTS STATE THE FIRST-TEN MONTH AND THE
   THREE SIZES (owner amendments #66 and #67, 2026-10-03; held for counsel,
   decision #69; site leaf v7-site-legal).

   The first draft of v7 told the demo agent, and the test catalogue that
   grades it, to say yes, the first month is free, to any new business, and
   graded a Launch & Implementation fee on every plan. Neither file knew the
   two smaller Front Desk sizes or the email at the minutes limit. The Terms
   rules live in scripts/check-legal-truth.mjs, which CI runs; this spec holds
   the agent documents, which no CI guard reads for these rules, and looks at
   every page this leaf owns in a real browser:

     knowledge base  every sentence that says the first month is free carries
                     the cap ("first month free for our first N clients", N
                     from pricing-config.js, the phrase the engine's
                     kb-commercial-block.mts requires), it is offered on the
                     booked call while a spot remains and routed to the
                     strategy call, no sentence gives it to every new client,
                     and every Front Desk size is quoted with its own monthly,
                     minutes and rate, read from pricing-config.js;
                     the email at the limit names the next size and never
                     changes the plan;
     test catalogue  a P0 row fails any free month once the spots run out,
                     every row that grades the offer says it applies only
                     while spots are open, a row grades Buy now, every size
                     is graded, and so is the email at the limit;
     free-month      in the knowledge base and the support KB, the paragraph
     paragraphs      that describes the free month says "charged", never
                     "billed", and names no pilot or discount;
     support KB      every size with its monthly, and the free month only as
                     the booked-call offer;
     pages           terms, privacy, security, 404 and /talk/, at 1440 and 390
                     wide, with the engine's free-month route answered open
                     and closed: no sideways scroll, no console error, a
                     footer that names no single size, and Terms that read
                     the same either way (legal text is never gated).

   Run it on its own port:
     NV_PORT=3388 npx playwright test tests/v7-site-legal.spec.js
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
const N = P.freeMonth.firstClients;
const TIERS = P.frontDeskTiers();
/* The engine's own phrase (canonical.ts firstClientsPhrase()), built from the
   site's mirror of the same number. */
const CAP_PHRASE = `first month free for our first ${N} clients`;
/* The sentence test kb-commercial-block.mts and update-demo-kb.mts apply. */
const SAYS_FREE = /\bfirst month (?:is )?free\b|\bfree first month\b/i;
/* The engine's FREE_MONTH vocabulary, for the every-client rule. */
const FREE_MONTH = /(?<!\b(?:no|not\s+a|never\s+a|without\s+a)\s)(?:free\s+(?:first\s+)?months?|first\s+month\s+(?:is\s+|for\s+)?free|months?\s+free|month\s+on\s+us)/i;
const EVERY_CLIENT = /\b(?:every|all|any|each)\s+(?:(?:of\s+)?(?:our|the)\s+)?(?:new\s+)?(?:clients?|customers?|businesses|business|buyers?)\b/i;
const NEGATED = /\b(?:never|not|no)\b/i;

const doc = (rel) => read(rel).replace(/\r\n/g, '\n').replace(/<!--[\s\S]*?-->/g, ' ');
const sentences = (t) => t.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
const money = (n) => 'C$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: n % 1 ? 2 : 0 });

/* ------------------------------------------------------------------ */
/* The demo knowledge base (repo copy).                               */
/* ------------------------------------------------------------------ */
test.describe('demo knowledge base: the first-ten month and the three sizes', () => {
  const kb = doc('config/elevenlabs/nevamis-knowledge-base.md');
  const block = kb.slice(kb.indexOf('Nevamis publishes its pricing.'), kb.indexOf('## Connected AI minutes, usage alerts, and overage'));

  test('every sentence that says the first month is free carries the cap', () => {
    const said = sentences(kb).filter((s) => SAYS_FREE.test(s));
    expect(said.length, 'the knowledge base states the offer at all').toBeGreaterThan(0);
    for (const s of said) expect(s.toLowerCase(), s).toContain(CAP_PHRASE);
  });

  test('the offer is given on the booked call, while a spot remains, and routed to the strategy call', () => {
    const offer = sentences(block).filter((s) => s.toLowerCase().includes(CAP_PHRASE));
    expect(offer.some((s) => /\bbooked call\b/i.test(s) && /\bwhile a spot remains\b/i.test(s)), offer.join('\n')).toBe(true);
    expect(offer.some((s) => /\bstrategy call\b/i.test(s)), 'a free-month sentence routes the caller to the strategy call').toBe(true);
    expect(sentences(block).some((s) => /\bBuy now\b/.test(s) && /\bcharged from its first month\b/i.test(s)),
      'Buy now is said to charge the first month').toBe(true);
    expect(sentences(block).some((s) => /\bnever offer it once the spots are gone\b/i.test(s)),
      'the agent is told never to offer it after the spots run out').toBe(true);
  });

  test('no sentence gives the free month to every new client', () => {
    for (const s of sentences(kb)) {
      if (FREE_MONTH.test(s) && EVERY_CLIENT.test(s)) expect(s, 'an every-client sentence must be a denial').toMatch(NEGATED);
    }
  });

  test('every plan is named in the pricing block, and every Front Desk size with its own figures', () => {
    for (const p of P.plans) expect(block, p.name).toContain(p.name);
    for (const t of TIERS) {
      const line = block.split('\n').find((l) => l.startsWith(`- ${t.name}`) || l.startsWith(`- ${t.name} (`));
      expect(line, `a bullet for ${t.name}`).toBeTruthy();
      expect(line).toContain(money(t.monthly));
      expect(line).toContain(`${t.includedMinutes.toLocaleString('en-CA')} connected AI minutes`);
      expect(line).toContain(`${money(t.overage)} per minute`);
    }
  });

  test('the email at the limit names the next size and never changes the plan', () => {
    const usage = kb.slice(kb.indexOf('## Connected AI minutes, usage alerts, and overage'), kb.indexOf('## How a business starts'));
    expect(usage).toMatch(/\bemail\b[^.]*\bnext size\b/i);
    expect(usage).toMatch(/\bthe plan never changes unless the client changes it\b/i);
    for (const t of TIERS) expect(usage, `${t.name}'s rate`).toContain(`${t.name} ${money(t.overage)} per minute`);
  });
});

/* ------------------------------------------------------------------ */
/* The acceptance catalogue the demo agent is graded by.              */
/* ------------------------------------------------------------------ */
test.describe('agent test catalogue: grades the first-ten month and the sizes', () => {
  const rows = doc('config/elevenlabs/nevamis-agent-test-cases.md').split('\n').filter((l) => /^\| \d+[a-z]? \|/.test(l))
    .map((l) => { const c = l.split('|').map((x) => x.trim()); return { id: c[1], scenario: c[2], caller: c[3], expected: c[4], pass: c[5], priority: c[6] }; });

  test('a P0 row fails any free month once the spots run out', () => {
    const closed = rows.filter((r) => /\bspots? (?:run out|closed|are gone)\b/i.test(r.scenario + ' ' + r.caller));
    expect(closed.length, 'a row for the spots-closed state').toBeGreaterThan(0);
    for (const r of closed) {
      expect(r.priority).toBe('P0');
      expect(r.pass).toMatch(/\bfree month offered, promised\b[^|]*\bFAIL\b/i);
    }
  });

  test('the open-spots row states the cap and the booked call, and routes to the strategy call', () => {
    const open = rows.filter((r) => /\bspots? open\b/i.test(r.scenario));
    expect(open.length).toBeGreaterThan(0);
    for (const r of open) {
      expect(r.expected.toLowerCase()).toContain(CAP_PHRASE);
      expect(r.expected).toMatch(/\bbooked call\b/i);
      expect(r.expected).toMatch(/\bstrategy call\b/i);
      expect(r.pass).toMatch(/\bnever promises\b/i);
      expect(r.priority).toBe('P0');
    }
  });

  /* A row that grades the agent on stating the offer would fail a correct
     agent built with --spots=closed, where row 6d fails any free month. So
     every such row says it applies while spots are open. */
  test('every row that grades the offer applies only while spots are open', () => {
    const stating = rows.filter((r) => r.expected.toLowerCase().includes(CAP_PHRASE));
    expect(stating.length).toBeGreaterThan(0);
    for (const r of stating) expect(r.scenario, `row ${r.id} grades the offer`).toMatch(/\bspots? open\b/i);
  });

  test('Buy now is graded: it never gives the free month', () => {
    expect(rows.some((r) => /\bBuy now charges the first month\b/i.test(r.expected) && /\bNever says Buy now gives the free month\b/i.test(r.pass))).toBe(true);
  });

  test('every Front Desk size is graded with its minutes, and the email at the limit is graded', () => {
    const all = rows.map((r) => r.expected + ' ' + r.pass).join(' ');
    for (const t of TIERS) {
      expect(all, t.name).toContain(t.name);
      expect(all, `${t.name}'s minutes`).toContain(`${t.includedMinutes.toLocaleString('en-CA')}`);
    }
    expect(rows.some((r) => /\bNever says Nevamis moves the client to a bigger size or changes the plan automatically\b/.test(r.pass))).toBe(true);
  });

  test('no row passes an agent that gives the free month to every new client', () => {
    for (const r of rows) {
      for (const s of sentences(r.expected)) {
        if (FREE_MONTH.test(s) && EVERY_CLIENT.test(s)) expect(s).toMatch(NEGATED);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* The client support knowledge base.                                 */
/* ------------------------------------------------------------------ */
/* The free-month paragraph in each agent document says what is charged, the
   word the Terms use: nothing invoices minutes past the allowance (owner item
   O41), and "billed" says something does. It names no retired offer word
   either, not even to deny one: "pilot" and "discount" are kept off what the
   agent may say. */
test('agent documents: the free-month paragraph says charged, never billed, and names no pilot or discount', () => {
  for (const rel of ['config/elevenlabs/nevamis-knowledge-base.md', 'config/elevenlabs/client-support-knowledge.md']) {
    const paras = doc(rel).split(/\n\s*\n/).filter((p) => SAYS_FREE.test(p));
    expect(paras.length, `${rel} describes the free month`).toBeGreaterThan(0);
    for (const p of paras) {
      const hit = p.match(/\b(?:billed|invoiced|pilots?|discounts?)\b/i);
      expect(hit && p.slice(Math.max(0, hit.index - 80), hit.index + 40), `${rel}: the free-month paragraph`).toBeNull();
    }
  }
});

test('client support knowledge: every size at its monthly, and the free month only as the booked-call offer', () => {
  const t = doc('config/elevenlabs/client-support-knowledge.md');
  for (const tier of TIERS) {
    const line = t.split('\n').find((l) => l.startsWith(`- ${tier.name}`));
    expect(line, tier.name).toBeTruthy();
    expect(line).toContain(money(tier.monthly));
    expect(line).toContain(`overage ${money(tier.overage)}/minute`);
  }
  const said = sentences(t).filter((s) => FREE_MONTH.test(s));
  expect(said.some((s) => /\bbooked call\b/i.test(s) && new RegExp(`\\bfirst ${N} clients\\b`).test(s))).toBe(true);
  for (const s of said) if (EVERY_CLIENT.test(s)) expect(s).toMatch(NEGATED);
});

/* ------------------------------------------------------------------ */
/* The pages, in a browser.                                           */
/* ------------------------------------------------------------------ */
const ENDPOINT = 'https://app.nevamis.ca/api/free-month';
const PAGES = ['/terms.html', '/privacy.html', '/security.html', '/404.html', '/talk/'];
const STATES = [
  ['open', { open: true, cap: N }],
  ['closed', { open: false, cap: N }],
];

async function visit(browser, url, width, answer) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  /* Every request to the engine origin is answered here, so no run reaches
     production: the free-month route with the state under test, anything
     else (the page-view beacon) with the 204 the real one gives. */
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => (r.request().url().startsWith(ENDPOINT)
    ? r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(answer) })
    : r.fulfill({ status: 204, body: '' })));
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  return { ctx, page, errors };
}

for (const url of PAGES) {
  for (const width of [1440, 390]) {
    for (const [state, answer] of STATES) {
      test(`${url} at ${width}, free month ${state}: no sideways scroll, no console error, a footer that names no size`, async ({ browser }) => {
        const { ctx, page, errors } = await visit(browser, url, width, answer);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over, 'horizontal overflow in px').toBeLessThanOrEqual(0);
        expect(errors, errors.join('\n')).toEqual([]);
        const foot = page.locator('footer.site-footer');
        if (await foot.count()) {
          const text = await foot.innerText();
          for (const t of TIERS) expect(text, `the footer names ${t.name}`).not.toContain(t.name);
          expect(text).toMatch(/\bthe front desk answers the calls you cannot\b/);
        }
        await ctx.close();
      });
    }
  }
}

test('terms read the same with the free month open and closed, and state the cap, the sizes and Buy now', async ({ browser }) => {
  const texts = [];
  for (const [, answer] of STATES) {
    const { ctx, page } = await visit(browser, '/terms.html', 1440, answer);
    texts.push((await page.locator('main').innerText()).replace(/\s+/g, ' '));
    await ctx.close();
  }
  expect(texts[0]).toBe(texts[1]);
  expect(texts[0]).toMatch(new RegExp(`\\bfirst ${N} businesses we give it to, on a booked call\\b`));
  for (const t of TIERS) expect(texts[0]).toContain(t.name);
  expect(texts[0]).toMatch(/\bBuy now is charged from the day the subscription starts\b|\bbought with Buy now on the website is charged from its first month\b/);
  expect(texts[0]).not.toMatch(/\btrial\b/i);
});
