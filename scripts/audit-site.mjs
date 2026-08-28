/* ============================================================
   Whole-site audit. Crawls every public page in a real browser
   and reports everything a visitor, a crawler, or a screen reader
   would trip over. Read-only: it never edits, it only reports.

   Run:  node scripts/audit-site.mjs           (server must be up)
         node scripts/audit-site.mjs --json    (machine output)
   ============================================================ */

import { chromium } from '@playwright/test';
import fs from 'node:fs';

/* One machine holds several checkouts of this site, and 3211 is whichever one
   started first. Hardcoded, this audit silently crawled a DIFFERENT worktree:
   a page that exists only here came back as the homepage, because serve.js
   answers an unknown path with index.html, and the audit dutifully reported
   "duplicate title, same as /" and "orphan" about a page it had never seen.
   A finding produced against the wrong tree is worse than no finding.

   NV_PORT is the same variable playwright.config.js already uses to give a
   worktree its own server, so a lane sets it once and both tools follow. */
const PORT = Number(process.env.NV_PORT || 3211);
const BASE = `http://127.0.0.1:${PORT}`;
const MAP = JSON.parse(fs.readFileSync('content-map.json', 'utf8'));
const PAGES = MAP.pages.filter((p) => p.url);
const asJson = process.argv.includes('--json');

const findings = [];
const add = (sev, page, area, detail) => findings.push({ sev, page, area, detail });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

const seenTitles = new Map();
const seenDescs = new Map();
const allInternalLinks = new Set();
const linkedTo = new Set();
/* Filled during the crawl, read afterwards by the orphan pass, which runs
   outside the per-page loop and so cannot see each page's robots meta. */
const noindexPages = new Set();

for (const p of PAGES) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const failed = [];
  page.on('requestfailed', (r) => failed.push(`${r.url()} (${r.failure()?.errorText})`));

  const res = await page.goto(BASE + p.url, { waitUntil: 'load' });
  if (!res || res.status() >= 400) { add('high', p.url, 'http', `status ${res?.status()}`); await page.close(); continue; }
  await page.waitForTimeout(900);

  const d = await page.evaluate(() => {
    const txt = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const abs = (h) => { try { return new URL(h, location.href).href; } catch { return null; } };
    return {
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || '',
      canonical: document.querySelector('link[rel=canonical]')?.href || '',
      robots: document.querySelector('meta[name=robots]')?.content || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
      h1: [...document.querySelectorAll('h1')].map(txt),
      words: (document.querySelector('main')?.innerText || document.body.innerText || '').trim().split(/\s+/).length,
      internal: [...document.querySelectorAll('a[href]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && !/^(https?:|mailto:|tel:|#)/.test(h))
        .map((h) => abs(h)).filter(Boolean),
      external: [...document.querySelectorAll('a[href^="http"]')]
        .map((a) => a.href).filter((h) => !h.includes('nevamis.ca') && !h.includes('127.0.0.1')),
      tels: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')),
      mailtos: [...document.querySelectorAll('a[href^="mailto:"]')].map((a) => a.getAttribute('href')),
      vagueLinks: [...document.querySelectorAll('a')].map(txt)
        .filter((t) => /^(click here|here|read more|learn more|more|link)$/i.test(t)),
      imgsNoDims: [...document.querySelectorAll('img')]
        .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
        .map((i) => i.getAttribute('src')),
      tinyText: [...document.querySelectorAll('main p, main li, main span, footer p')]
        .filter((el) => { const s = parseFloat(getComputedStyle(el).fontSize); return s > 0 && s < 11; })
        .slice(0, 3).map((el) => `${el.tagName}: ${parseFloat(getComputedStyle(el).fontSize)}px`),
      hasCta: !!document.querySelector('a[href^="tel:"], a[href*="book.html"]'),
      staleCss: !!document.querySelector('link[href*="styles.css"]'),
      lang: document.documentElement.lang,
      viewport: !!document.querySelector('meta[name=viewport]'),
    };
  });

  // --- metadata ---
  if (!d.title) add('high', p.url, 'meta', 'no title');
  if (d.title.length > 70) add('med', p.url, 'meta', `title ${d.title.length} chars (SERP truncates ~60)`);
  if (!d.desc) add('high', p.url, 'meta', 'no meta description');
  else if (d.desc.length < 70) add('med', p.url, 'meta', `description only ${d.desc.length} chars`);
  else if (d.desc.length > 165) add('low', p.url, 'meta', `description ${d.desc.length} chars (may truncate)`);
  /* Search-facing rules apply only to pages a search engine is invited to.
     404.html and proposal.html are both noindex — one is an error page, the
     other a document sent to a single prospect — so "no canonical", "thin",
     and "orphan" are not defects there, they are the design. Read from the
     page rather than content-map.json, because the page is what a crawler
     actually sees. Sharing rules (og:image) deliberately still apply: a
     noindex page can still be pasted into an email or a text, and a proposal
     link that previews blank costs credibility with the one prospect who
     opens it. */
  const noindex = /noindex/i.test(d.robots);
  if (noindex) noindexPages.add(p.url);
  if (!d.canonical && !noindex) add('high', p.url, 'meta', 'no canonical');
  if (!d.ogImage) add('med', p.url, 'social', 'no og:image (link previews will be blank)');
  if (d.lang !== 'en-CA') add('low', p.url, 'meta', `lang="${d.lang}"`);
  if (!d.viewport) add('high', p.url, 'meta', 'no viewport meta');

  if (seenTitles.has(d.title)) add('med', p.url, 'meta', `duplicate title, same as ${seenTitles.get(d.title)}`);
  else seenTitles.set(d.title, p.url);
  if (d.desc && seenDescs.has(d.desc)) add('med', p.url, 'meta', `duplicate description, same as ${seenDescs.get(d.desc)}`);
  else if (d.desc) seenDescs.set(d.desc, p.url);

  // --- structure ---
  if (d.h1.length !== 1) add('high', p.url, 'structure', `${d.h1.length} h1 elements`);
  if (d.words < 200 && p.cluster !== 'legal' && !noindex) add('med', p.url, 'content', `thin: ~${d.words} words`);
  if (!d.hasCta && p.cluster !== 'legal') add('med', p.url, 'conversion', 'no phone or booking CTA');
  if (d.staleCss) add('high', p.url, 'build', 'still links the retired styles.css');

  // --- links ---
  for (const t of d.tels) if (t !== 'tel:+15874130035') add('high', p.url, 'links', `wrong phone: ${t}`);
  for (const m of d.mailtos) if (!/sales@nevamis\.ca/i.test(m)) add('med', p.url, 'links', `unexpected mailto: ${m}`);
  for (const v of d.vagueLinks) add('low', p.url, 'a11y', `vague link text: "${v}"`);
  for (const i of d.imgsNoDims) add('med', p.url, 'perf', `img without width/height (layout shift): ${i}`);
  for (const t of d.tinyText) add('low', p.url, 'a11y', `text under 11px — ${t}`);

  d.internal.forEach((u) => { allInternalLinks.add(u); linkedTo.add(new URL(u).pathname); });

  for (const e of errors) add('high', p.url, 'js', e.slice(0, 140));
  for (const f of failed) add('high', p.url, 'network', f.slice(0, 140));

  await page.close();
}

// --- internal links must resolve ---
const checker = await ctx.newPage();
for (const url of allInternalLinks) {
  const r = await checker.request.get(url).catch(() => null);
  if (!r || r.status() >= 400) add('high', 'site', 'links', `broken internal link: ${new URL(url).pathname} (${r?.status() || 'no response'})`);
}

// --- orphans: reachable pages nobody links to ---
for (const p of PAGES) {
  /* Orphan detection asks 'can a visitor or crawler reach this by following
     links'. A 404 is reached by mistyping a URL and a proposal by being sent
     one, so neither is orphaned in any sense that costs anything. */
  if (p.cluster === 'legal' || p.url === '/' || noindexPages.has(p.url)) continue;
  if (!linkedTo.has(p.url)) add('med', p.url, 'seo', 'orphan: no internal page links here');
}
await checker.close();
await browser.close();

// --- report ---
const order = { high: 0, med: 1, low: 2 };
findings.sort((a, b) => order[a.sev] - order[b.sev] || a.page.localeCompare(b.page));

if (asJson) {
  console.log(JSON.stringify(findings, null, 2));
} else {
  const counts = findings.reduce((m, f) => (m[f.sev] = (m[f.sev] || 0) + 1, m), {});
  console.log(`\nAUDIT: ${PAGES.length} pages · ${findings.length} findings ` +
    `(${counts.high || 0} high, ${counts.med || 0} med, ${counts.low || 0} low)\n`);
  let last = '';
  for (const f of findings) {
    if (f.sev !== last) { console.log(`--- ${f.sev.toUpperCase()} ---`); last = f.sev; }
    console.log(`  [${f.area}] ${f.page}: ${f.detail}`);
  }
  if (!findings.length) console.log('  Nothing found.');
  console.log('');
}
process.exit(0);
