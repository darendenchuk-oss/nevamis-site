/* ============================================================
   MACHINE SURFACES SAY WHAT THE PAGES SAY (site-live-machine, 2026-10-03).

   The whole-site audit of 2026-10-03 read what machines read: the JSON-LD
   offers, the sitemap, llms.txt, the share card, the agent documents in
   config/elevenlabs/, and the two auditors in scripts/. Each test here fails
   on main as it was (201599f) and passes on the fix, and names the finding
   it holds. Copy is asserted as a RULE through scripts/lib/
   machine-surfaces.mjs, the same judge check-consistency.js runs, so a new
   sentence making the same false claim fails the same way.

   Run with the site served from this checkout on its own port, e.g.
     NV_PORT=3291 npx playwright test tests/machine-surfaces.spec.js
   Nothing here reaches anything live.
   ============================================================ */
import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { agentTruthFindings, agentRequiredFindings, llmsPageFindings, offerFindings } from '../scripts/lib/machine-surfaces.mjs';
import { cardAlt, cardLines } from '../scripts/lib/og-card.mjs';
import { sitemapPages, pageHash, readSidecar, readSitemapLastmods } from '../scripts/lib/sitemap.mjs';

const ROOT = process.cwd();
const MAP = JSON.parse(fs.readFileSync('content-map.json', 'utf8'));
const NV = (() => { const w = {}; vm.runInNewContext(fs.readFileSync('pricing-config.js', 'utf8'), { window: w }); return w.NV_PRICING; })();
const servedPages = MAP.pages.filter((p) => p.url).map((p) => p.url);

const jsonLdIn = (page) => page.$$eval('script[type="application/ld+json"]', (ns) => ns.map((n) => n.textContent));

/* ---------- MACHINE-17: the offers carry both figures ---------- */

test('MACHINE-17: the homepage Service JSON-LD gives every plan and every module sold alone both figures', async ({ page }) => {
  await page.goto('/');
  const blocks = (await jsonLdIn(page)).map((t) => JSON.parse(t)).flat();
  const service = blocks.find((b) => b['@type'] === 'Service');
  expect(service, 'the homepage publishes a Service').toBeTruthy();
  expect(offerFindings(service, NV)).toEqual([]);
  /* The rule in plain terms, for whoever reads a red run: no parser can read
     "C$1,000" alone as the AI Front Desk's price, and Quote Recovery, door
     two, has an Offer of its own. */
  const fd = service.offers.find((o) => o.name === 'AI Front Desk');
  expect(fd.price).toBeUndefined();
  const qc = service.offers.find((o) => o.name === 'Quote-Chase Engine');
  expect(qc, 'Quote Recovery is sold alone and has its own Offer').toBeTruthy();
});

/* pricing.html renders its own Product JSON-LD at runtime, from the same
   config, in the shape this leaf retired on the homepage: the monthly as the
   only price, the Partnership flat, no module Offer. pricing.html belongs to
   the site-live-buyer leaf, so the fix is handed over there (PR body), and
   this test holds the gap open in plain sight: it is EXPECTED to fail until
   pricing.html adopts the homepage's shape, and the day it passes, Playwright
   reports it as an unexpected pass and this annotation comes out. */
test('MACHINE-17 sibling: pricing.html\'s runtime Product offers carry both figures (owned by site-live-buyer)', async ({ page }) => {
  test.fail(true, 'pricing.html is site-live-buyer\'s file; handed over in the site-live-machine PR');
  await page.goto('/pricing.html');
  const blocks = (await jsonLdIn(page)).map((t) => JSON.parse(t)).flat();
  const product = blocks.find((b) => b['@type'] === 'Product');
  expect(product, 'pricing.html publishes its Product').toBeTruthy();
  expect(offerFindings({ offers: product.offers.offers }, NV)).toEqual([]);
});

/* ---------- COMPLETENESS-8: the share card says what it shows ---------- */

test('COMPLETENESS-8: every page names its share card in og:image:alt and twitter:image:alt, in the card\'s own words', async ({ page }) => {
  const svg = fs.readFileSync('assets/og-default.svg', 'utf8');
  const alt = cardAlt(svg);
  expect(cardLines(svg)[0]).toBe('Nevamis');
  for (const url of servedPages) {
    await page.goto(url);
    const meta = await page.evaluate(() => ({
      og: document.querySelector('meta[property="og:image"]')?.content,
      ogAlt: [...document.querySelectorAll('meta[property="og:image:alt"]')].map((m) => m.content),
      tw: document.querySelector('meta[name="twitter:image"]')?.content,
      twAlt: [...document.querySelectorAll('meta[name="twitter:image:alt"]')].map((m) => m.content),
    }));
    if (meta.og) expect(meta.ogAlt, `${url} og:image:alt`).toEqual([alt]);
    if (meta.tw) expect(meta.twAlt, `${url} twitter:image:alt`).toEqual([alt]);
  }
});

test('COMPLETENESS-8: the card is set in the site\'s typefaces, names all three doors, and is exported at 1200x630', async () => {
  const svg = fs.readFileSync('assets/og-default.svg', 'utf8');
  const families = [...svg.matchAll(/font-family="([^"]+)"/g)].map((m) => m[1].split(',')[0].replace(/'/g, '').trim());
  for (const f of families) expect(['Bricolage Grotesque', 'Atkinson Hyperlegible', 'Spline Sans Mono']).toContain(f);
  const text = cardLines(svg).join(' ');
  /* A share of a call-answering page must not show a card that is only about
     Lead Generation: the card names the three doors, in door order. */
  expect(text.indexOf('Lead Generation')).toBeGreaterThanOrEqual(0);
  expect(text.indexOf('Lead Generation')).toBeLessThan(text.indexOf('Quote Recovery'));
  expect(text.indexOf('Quote Recovery')).toBeLessThan(text.indexOf('front desk'));
  const png = fs.readFileSync('assets/og-default.png');
  expect(png.readUInt32BE(16), 'width').toBe(1200);
  expect(png.readUInt32BE(20), 'height').toBe(630);
});

/* ---------- MACHINE-18: lastmod follows content ---------- */

test('MACHINE-18: every sitemap page matches the hash its lastmod was recorded for, and the build chain ends with gen-sitemap', async () => {
  const sidecar = readSidecar(ROOT);
  expect(sidecar, 'config/sitemap-hashes.json exists').toBeTruthy();
  const stated = readSitemapLastmods(fs.readFileSync('sitemap.xml', 'utf8').replace(/\r/g, ''));
  const pages = sitemapPages(ROOT);
  expect(pages.length).toBeGreaterThanOrEqual(20);
  for (const p of pages) {
    const rec = sidecar.pages[p.file];
    expect(rec, `${p.file} is recorded`).toBeTruthy();
    expect(rec.sha256, `${p.file} changed after its lastmod was recorded: run npm run build`).toBe(pageHash(ROOT, p.file));
    expect(stated.get(p.loc), `${p.file} lastmod in sitemap.xml`).toBe(rec.lastmod);
  }
  const build = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts.build;
  expect(build, 'npm run build is the publish chain').toBeTruthy();
  const steps = build.split('&&').map((s) => s.trim());
  expect(steps.at(-1)).toBe('node scripts/gen-sitemap.mjs');
  expect(steps.indexOf('node scripts/promote.mjs')).toBeLessThan(steps.indexOf('node scripts/build-search-index.mjs'));
  expect(steps[0]).toBe('python scripts/film/compose.py');
});

/* ---------- MACHINE-26 / COMPLETENESS-6: llms.txt and the search index ---------- */

test('MACHINE-26: llms.txt lists every sitemap page, one per line, and nothing else', async () => {
  const locs = sitemapPages(ROOT).map((p) => p.loc);
  expect(llmsPageFindings(fs.readFileSync('llms.txt', 'utf8'), locs)).toEqual([]);
  const llms = fs.readFileSync('llms.txt', 'utf8');
  expect(llms).toContain('https://nevamis.ca/solutions.html');
  expect(llms).toContain('https://nevamis.ca/security.html');
  /* PLATFORM-6's sibling: no quantity on Lead Generation. */
  expect(llms).not.toMatch(/\ba few businesses\b/i);
});

test('COMPLETENESS-6: no page loads the dead search module, and the index stays served for machines', async ({ page }) => {
  const fetched = [];
  page.on('request', (r) => { if (/search(?:\.js|-index\.json)/.test(r.url())) fetched.push(r.url()); });
  for (const url of ['/', '/pricing.html', '/missed-calls.html', '/about.html']) {
    await page.goto(url, { waitUntil: 'load' });
  }
  await page.waitForTimeout(500);
  expect(fetched).toEqual([]);
  expect(fs.existsSync('assets/motion/search.js')).toBe(false);
  expect(fs.readFileSync('assets/motion/main.js', 'utf8')).not.toMatch(/from ['"]\.\/search\.js['"]/);
  const res = await page.request.get('/search-index.json');
  expect(res.status()).toBe(200);
  expect(fs.readFileSync('llms.txt', 'utf8')).toContain('https://nevamis.ca/search-index.json');
});

/* ---------- MACHINE-9 to MACHINE-16: the agent documents ---------- */

test('MACHINE-9..16: every agent document states only what the product does, and the priced ones carry today\'s figures', async () => {
  const dir = 'config/elevenlabs';
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  expect(files.length).toBeGreaterThanOrEqual(8);
  const findings = files.flatMap((f) => {
    const t = fs.readFileSync(path.join(dir, f), 'utf8');
    return [...agentTruthFindings(`${dir}/${f}`, t), ...agentRequiredFindings(`${dir}/${f}`, t, NV)];
  });
  expect(findings).toEqual([]);
  /* The two facts the audit led with, read straight off the files. */
  const kb = fs.readFileSync(path.join(dir, 'nevamis-knowledge-base.md'), 'utf8');
  expect(kb).toContain('between 8 a.m. and 8 p.m. your time, every day');
  expect(kb).not.toMatch(/during business hours/i);
  const support = fs.readFileSync(path.join(dir, 'client-support-knowledge.md'), 'utf8');
  expect(support).not.toMatch(/\b\d+\s?%/);
});

/* ---------- CHECK-RUNNER-8 / 9 / 10: the auditors ---------- */

/* A throwaway site with one page, so each auditor can be run against a
   page written to trip exactly one rule. The auditor is copied in, not
   imported: it reads its root from its own location. */
function miniSite(script, pageHtml) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-audit-'));
  fs.mkdirSync(path.join(dir, 'scripts'));
  fs.copyFileSync(path.join(ROOT, 'scripts', script), path.join(dir, 'scripts', script));
  fs.copyFileSync(path.join(ROOT, 'pricing-config.js'), path.join(dir, 'pricing-config.js'));
  fs.writeFileSync(path.join(dir, '_config.yml'), 'exclude:\n  - scripts/\n');
  fs.writeFileSync(path.join(dir, 'sitemap.xml'), '<urlset><url><loc>https://nevamis.ca/a.html</loc></url></urlset>');
  fs.writeFileSync(path.join(dir, 'a.html'), pageHtml);
  const r = spawnSync(process.execPath, [path.join(dir, 'scripts', script)], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true, force: true });
  return r;
}
const page_ = (body) => `<!doctype html><html lang="en"><head><title>a</title></head><body><a class="skip" href="#m">Skip to content</a><h1>A</h1>${body}</body></html>`;

test('CHECK-RUNNER-8: audit-truth approves every figure pricing-config publishes and support@, and exits non-zero on a HIGH', async () => {
  const published = page_(`<p>Quote-Chase Engine C$750 Launch &amp; Implementation to start, then C$500 a month. `
    + `From C$2,500 Launch &amp; Implementation to start, then C$350 a month by default, inside a monthly band of C$250 to C$500. `
    + `Enterprise from C$5,000. Email support at support@nevamis.ca or Sales@nevamis.ca.</p>`);
  const ok = miniSite('audit-truth.mjs', published);
  expect(ok.stdout).toContain('no findings');
  expect(ok.status).toBe(0);

  const retired = miniSite('audit-truth.mjs', page_('<p>The Works is C$1,800 a month.</p>'));
  expect(retired.stdout, 'a grouped figure is read whole').toMatch(/HIGH .*unapproved price \$1800/);
  expect(retired.status).toBe(1);
  const top = miniSite('audit-truth.mjs', page_('<p>Agreements go up to C$10,000 to start.</p>'));
  expect(top.status, 'the unprinted top of launchRange is not approved').toBe(1);
});

test('CHECK-RUNNER-9: audit-perf-a11y counts a wrapping <label> and a hidden, unfocusable honeypot as labelled, and nothing else', async () => {
  const good = miniSite('audit-perf-a11y.mjs', page_(
    '<form><label>Your name <input id="n" name="n"></label>'
    + '<input id="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">'
    + '<label>Website<input aria-hidden="true" id="hp2" tabindex="-1"></label>'
    + '<label><input type="checkbox" id="agree"> I <b>agree</b></label></form>'));
  expect(good.stdout).not.toMatch(/has no label/);
  const bad = miniSite('audit-perf-a11y.mjs', page_(
    '<form><input id="bare"><label></label><input id="afterEmpty">'
    + '<input id="hiddenButFocusable" aria-hidden="true"><label> <input id="emptyWrap"></label></form>'));
  for (const id of ['bare', 'afterEmpty', 'hiddenButFocusable', 'emptyWrap']) expect(bad.stdout).toContain(`#${id}> has no label`);
});

test('CHECK-RUNNER-10: page weight is budgeted as served (gzip), and no published page is over it', async () => {
  const r = spawnSync(process.execPath, ['scripts/audit-perf-a11y.mjs'], { encoding: 'utf8' });
  expect(r.stdout).toMatch(/gzip as served/);
  expect(r.stdout).not.toMatch(/over budget/);
  /* A page that really is heavy still fails: random text gzip cannot shrink below the budget. */
  const noise = crypto.randomBytes(60 * 1024).toString('base64');
  const heavy = miniSite('audit-perf-a11y.mjs', page_(`<p>${noise}</p>`));
  expect(heavy.stdout).toMatch(/a\.html .*over budget/);
});

/* ---------- CHECK-RUNNER-11: the dead ledger entry ---------- */

test('CHECK-RUNNER-11: the consistency check prints no dead BANNED_PENDING entry', async () => {
  const r = spawnSync(process.execPath, ['scripts/check-consistency.js'], { encoding: 'utf8' });
  expect(r.stdout + r.stderr).not.toMatch(/Delete its BANNED_PENDING entry/);
  expect(r.status, (r.stdout + r.stderr).split('\n').filter((l) => /^FAIL/.test(l)).join('\n')).toBe(0);
});
