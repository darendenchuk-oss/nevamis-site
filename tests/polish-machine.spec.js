/* ============================================================
   THE MACHINE SURFACES THIS LEAF OWNS TELL A MACHINE THE TRUTH
   (polish-machine, round 2 of the whole-site audit of 2026-10-03,
   decision #69).

   An answer engine reads llms.txt, a page's head (title, description, og
   and twitter tags) and its JSON-LD, and quotes them without the page
   around them. The audit found each rule below broken on some machine
   surface; the round-1 leaves fixed the pages they owned, and these tests
   hold the same RULES on the files this leaf owns, so the next audit finds
   no sibling:

     MACHINE-19      llms.txt and the head of privacy, security, terms and
                     404 never say "pilot", "trial", "free period" or
                     "discount", not even to deny one: the owner's rule is
                     the word, not the claim. llms.txt said "There is no
                     pilot, trial or evaluation period of any kind" and
                     "There is no pilot and no trial".
     PRICING-9       llms.txt never has the agent take the job or the time
                     the caller wants, which reads as a booking even beside
                     "a person confirms": it captures the request and the
                     times that suit the caller. llms.txt said both.
     MACHINE-24      every page in the sitemap but the homepage carries
                     exactly one BreadcrumbList and one page node, the ones
                     build-schema.mjs or build-content.mjs generates.
     MACHINE-25      each of this leaf's four pages carries og:url (its
                     canonical, where it has one), og:type and og:site_name.
     CHECK-RUNNER-7  each of their meta descriptions is 160 characters or
                     fewer.

   File reads only: no browser, no network. SITE_ROOT=<a checkout> points
   them at another tree, which is how they were shown red on the train
   before this change. Run alone:
     NV_PORT=3373 npx playwright test tests/polish-machine.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.SITE_ROOT
  ? path.resolve(process.env.SITE_ROOT)
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

/* The pages whose head this leaf owns. Their legal text is counsel's and is
   not read here: only what a machine reads off the head. */
const HEAD_PAGES = ['privacy.html', 'security.html', 'terms.html', '404.html'];

/* "Autopilot" is a product name and not the word "pilot": \b keeps them
   apart. */
const BANNED_WORDS = [/\bpilots?\b/i, /\btrials?\b/i, /\bfree periods?\b/i, /\bdiscount(?:s|ed)?\b/i];

const NAMED = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
const decode = (s) => s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
const flat = (s) => s.replace(/\s+/g, ' ').trim();

/* llms.txt as prose: one string, its "> " quote marks and hard wraps gone,
   cut into sentences. */
const llmsSentences = () => flat(read('llms.txt').replace(/^[ \t]*>[ \t]?/gm, ''))
  .split(/(?<=[.!?])\s+(?=[A-Z0-9(-])/);

function headStrings(html) {
  const out = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) out.push({ where: '<title>', text: decode(title[1]) });
  for (const m of html.matchAll(/<meta\s+(?:name|property)="([^"]+)"\s+content="([^"]*)"/gi)) {
    if (/^(?:description|og:|twitter:)/i.test(m[1])) out.push({ where: `<meta ${m[1]}>`, text: decode(m[2]) });
  }
  return out;
}
const meta = (html, key) => {
  const m = html.match(new RegExp(`<meta\\s+(?:name|property)="${key}"\\s+content="([^"]*)"`, 'i'));
  return m ? decode(m[1]) : null;
};
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
  .flatMap((m) => { const j = JSON.parse(m[1]); return Array.isArray(j) ? j : [j]; });

test('MACHINE-19: llms.txt and the four legal pages\' heads never say pilot, trial, free period or discount', () => {
  const bad = [];
  for (const s of llmsSentences()) {
    if (BANNED_WORDS.some((re) => re.test(s))) bad.push(`llms.txt: "${s.slice(0, 160)}"`);
  }
  for (const p of HEAD_PAGES) {
    const html = read(p);
    for (const { where, text } of headStrings(html)) {
      if (BANNED_WORDS.some((re) => re.test(text))) bad.push(`${p} ${where}: "${text.slice(0, 160)}"`);
    }
    for (const node of jsonLd(html)) {
      const text = JSON.stringify(node);
      for (const re of BANNED_WORDS) if (re.test(text)) bad.push(`${p} JSON-LD ${node['@type']}: ${re}`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('PRICING-9: llms.txt never has the agent take the job or the time the caller wants', () => {
  /* The same shape tests/live-buyer-truth.spec.js holds on the buyer pages. */
  const booking = /\btakes? (?:the job|the time|the slot)\b|\b(?:the )?times? (?:they|the caller) wants?\b/i;
  const bad = llmsSentences().filter((s) => booking.test(s));
  expect(bad, bad.join('\n')).toEqual([]);
  /* The true statement is still made: it does not book, and a person at the
     business confirms. */
  expect(llmsSentences().some((s) => /\bdoes NOT book into a calendar\b/.test(s) && /\bconfirms\b/.test(s))).toBe(true);
});

test('MACHINE-24: every sitemap page but the homepage carries one BreadcrumbList and one page node', () => {
  const PAGE_TYPES = new Set(['WebPage', 'AboutPage', 'ContactPage', 'CollectionPage']);
  const locs = [...read('sitemap.xml').matchAll(/<loc>https:\/\/nevamis\.ca\/([^<]*)<\/loc>/g)].map((m) => m[1]);
  expect(locs.length, 'sitemap.xml lists its pages').toBeGreaterThan(15);
  const bad = [];
  for (const loc of locs) {
    if (loc === '') continue; // the homepage: Organization, Service, FAQPage
    const nodes = jsonLd(read(loc));
    const crumbs = nodes.filter((n) => n['@type'] === 'BreadcrumbList').length;
    const pages = nodes.filter((n) => PAGE_TYPES.has(n['@type'])).length;
    if (crumbs !== 1) bad.push(`${loc}: ${crumbs} BreadcrumbList`);
    if (pages !== 1) bad.push(`${loc}: ${pages} page nodes`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('MACHINE-25 and CHECK-RUNNER-7: the four legal pages carry og:url, og:type and og:site_name, and a description of 160 characters or fewer', () => {
  const bad = [];
  for (const p of HEAD_PAGES) {
    const html = read(p);
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || `https://nevamis.ca/${p}`;
    if (meta(html, 'og:url') !== canonical) bad.push(`${p}: og:url is ${meta(html, 'og:url')}, not ${canonical}`);
    if (!meta(html, 'og:type')) bad.push(`${p}: no og:type`);
    if (meta(html, 'og:site_name') !== 'Nevamis') bad.push(`${p}: og:site_name is ${meta(html, 'og:site_name')}`);
    const d = meta(html, 'description');
    if (!d) bad.push(`${p}: no meta description`);
    else if (d.length > 160) bad.push(`${p}: meta description is ${d.length} characters`);
  }
  expect(bad, bad.join('\n')).toEqual([]);
});
