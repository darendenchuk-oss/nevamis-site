/* ============================================================
   THE SCRIPTS START DOWNLOADING AT ONCE, AND THE AD LANDS ON THE CALENDAR
   (launch audit PERF-1 and PERF-2, 2026-11-09).

   PERF-1. Every page carries its Content-Security-Policy in a <meta>, which
   switches off Chrome's preload scanner, so a page fetched its scripts one
   after another. scripts/build-csp.mjs now writes a generated:preload region
   straight after the policy, one <link rel="preload" as="script"> per classic
   <script src> the page carries (scripts/lib/script-preloads.mjs). This file
   holds:
     the rule      on every published page the preloads are exactly the
                   page's own classic scripts, in document order, sitting
                   straight after the policy; no type="module" script and no
                   film script (assets/film/) is ever preloaded, and
                   talk/index.html carries none;
     the audit's   the homepage and book.html preload exactly the lists the
     lists         audit measured, less the film's three on the homepage:
                   preloaded, they jumped ahead of a first screen that
                   needs none of them (the measurements, including why
                   simulated LCP did not move, are in
                   scripts/lib/script-preloads.mjs).
                   Shown red on the previous homepage (052f7d7), which still
                   preloaded them: "index.html preloads a film script";
     no waste      in a real browser each preloaded script is fetched once,
                   is used (Chrome reports a preload nobody used), and the
                   policy blocks nothing.
   PERF-2. Every ad links to book.html#pick-a-time, and a browser jumps to a
   fragment only once the page has finished parsing: 5.3 s of the top of the
   page on a throttled phone, then a 2,854px jump. An inline script right
   after the calendar scrolls there as soon as it is parsed. Held here with a
   parser-blocking script at the end of the page delayed by four seconds: the
   calendar panel must be on screen while the page is still parsing, the
   browser's own jump afterwards must not move it again, and a visit with no
   fragment must not scroll at all.

   Every request to app.nevamis.ca is answered here (the beacons and the
   free-month question), and Cal.com is refused, so no run reaches
   production. Run it on its own port:
     NV_PORT=3231 npx playwright test tests/script-preload.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classicScripts, preloadRegion, NO_PRELOAD, NOT_PRELOADED } from '../scripts/lib/script-preloads.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
const PAGES = [...JSON.parse(read('content-map.json')).pages.map((p) => p.file), 'talk/index.html'];
const preloadsOf = (html) => [...html.matchAll(/<link rel="preload" href="([^"]+)" as="script"[^>]*>/g)].map((m) => m[1]);

async function offline(ctx) {
  await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
  await ctx.route(/cal\.com/, (r) => r.abort());
}

test('every page preloads exactly its own classic scripts, in order, straight after the policy', () => {
  /* The scanner's own examples: a tag a comment quotes and a tag an inline
     script builds are not scripts the page loads, and a module is not
     classic. */
  const sample = '<!-- <script src="quoted.js"></script> --><script>var s = "<script src=\\"built.js\\">";</script>'
    + '<script type="module" src="m.js"></script><script src="a.js" defer></script><script src="b.js"></script>';
  expect(classicScripts(sample).map((a) => a.src)).toEqual(['a.js', 'b.js']);
  /* The film's scripts are loaded, never preloaded, however the path is spelt. */
  const film = '<script src="/assets/film/film-1.js"></script><script src="assets/film/film-2.js"></script>'
    + '<script src="./assets/film/film-3.js"></script><script src="site.js" defer></script>';
  expect(classicScripts(film).length).toBe(4);
  expect(preloadsOf(preloadRegion('index.html', film))).toEqual(['site.js']);

  for (const f of PAGES) {
    const html = read(f);
    const links = preloadsOf(html);
    const modules = [...html.matchAll(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]);
    for (const m of modules) expect(links, `${f} preloads the module ${m}`).not.toContain(m);
    for (const l of links) expect(l, `${f} preloads a film script`).not.toMatch(NOT_PRELOADED);
    if (NO_PRELOAD.has(f)) {
      expect(links, `${f} carries script preloads`).toEqual([]);
      continue;
    }
    const srcs = [...new Set(classicScripts(html).map((a) => a.src.trim()))].filter((s) => !NOT_PRELOADED.test(s));
    expect(srcs.length, `${f} loads no classic script, so this proves nothing there`).toBeGreaterThan(0);
    expect(links, `${f}: its preloads are not its own classic scripts in order (run node scripts/build-csp.mjs)`).toEqual(srcs);
    expect(html, `${f}: the preloads do not sit straight after the policy`).toContain('<!-- /generated:csp -->\n<!-- generated:preload -->');
    expect(html.indexOf('<!-- /generated:preload -->'), `${f}: the preloads are not in the head`).toBeLessThan(html.search(/<\/head>/i));
  }
});

test('the homepage and the ad landing preload what the audit measured', () => {
  for (const f of ['index.html', 'home.html']) {
    expect(preloadsOf(read(f)), f).toEqual(['pricing-config.js', 'free-month.js', 'site.js']);
    /* and still loads the film, after </main>, where it always was */
    expect(classicScripts(read(f)).map((a) => a.src).filter((s) => NOT_PRELOADED.test(s)), f)
      .toEqual(['/assets/film/film-1.js', '/assets/film/film-2.js', '/assets/film/film-3.js']);
  }
  expect(preloadsOf(read('book.html'))).toEqual(['pricing-config.js', 'free-month.js', 'assets/vendor/gsap.min.js',
    'assets/vendor/ScrollTrigger.min.js', 'site.js', 'motion.js']);
});

for (const url of ['/book.html', '/pricing.html', '/']) {
  test(`${url}: every preloaded script is fetched once and used, and the policy blocks nothing`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await offline(ctx);
    const page = await ctx.newPage();
    const fetched = new Map();
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname === '127.0.0.1' && /\.js$/.test(u.pathname)) fetched.set(u.pathname, (fetched.get(u.pathname) || 0) + 1);
    });
    const notes = [];
    page.on('console', (m) => notes.push(m.text()));
    await page.addInitScript(() => {
      window.__violations = [];
      document.addEventListener('securitypolicyviolation', (e) => window.__violations.push(e.violatedDirective + ' ' + e.blockedURI));
    });
    await page.goto(url, { waitUntil: 'load' });
    /* Chrome reports a preload nobody used three seconds after load. */
    await page.waitForTimeout(3600);
    const preloads = await page.$$eval('link[rel="preload"][as="script"]', (ls) => ls.map((l) => new URL(l.href).pathname));
    expect(preloads.length, `${url} carries no script preload`).toBeGreaterThan(0);
    for (const p of preloads) expect(fetched.get(p), `${url}: ${p} was fetched ${fetched.get(p) || 0} times`).toBe(1);
    const unused = notes.filter((t) => /preloaded using link preload but not used/i.test(t));
    expect(unused, `${url}: a preloaded script was never used`).toEqual([]);
    expect(await page.evaluate(() => window.__violations), `${url}: the policy blocked something`).toEqual([]);
    await ctx.close();
  });
}

/* A parser-blocking script near the end of book.html, held back so the page
   cannot finish parsing for four seconds. */
async function slowTail(ctx) {
  await ctx.route(/\/assets\/vendor\/gsap\.min\.js$/, async (r) => {
    await new Promise((res) => setTimeout(res, 4000));
    try { await r.continue(); } catch { /* the page went away first */ }
  });
}

test('book.html#pick-a-time shows the calendar panel while the page is still parsing, and stays there', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await offline(ctx);
  await slowTail(ctx);
  const page = await ctx.newPage();
  await page.goto('/book.html#pick-a-time', { waitUntil: 'commit' });
  /* On screen inside three seconds, which the held script makes impossible
     for the browser's own jump. */
  await page.waitForFunction(() => {
    const t = document.getElementById('pick-a-time');
    if (!t || window.scrollY < 200) return false;
    const r = t.getBoundingClientRect();
    return r.top >= -2 && r.top < window.innerHeight / 3;
  }, null, { timeout: 3000 });
  const early = await page.evaluate(() => ({ y: window.scrollY, state: document.readyState }));
  expect(early.state, 'the panel was reached only after parsing finished').toBe('loading');
  await page.waitForLoadState('load');
  await page.waitForTimeout(800);
  const late = await page.evaluate(() => ({ y: window.scrollY, top: document.getElementById('pick-a-time').getBoundingClientRect().top }));
  expect(Math.abs(late.y - early.y), `the page jumped again after parsing: ${early.y} -> ${late.y}`).toBeLessThanOrEqual(60);
  expect(late.top, 'the panel is not at the top of the screen after load').toBeLessThan(844 / 3);
  await ctx.close();
});

test('book.html with no fragment stays at the top while it parses', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await offline(ctx);
  await slowTail(ctx);
  const page = await ctx.newPage();
  await page.goto('/book.html', { waitUntil: 'commit' });
  await page.waitForFunction(() => !!document.getElementById('bkFrame'), null, { timeout: 3000 });
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await ctx.close();
});
