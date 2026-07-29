/* ============================================================
   BUILD THE SITE SEARCH INDEX

   Reads every page in content-map.json and writes search-index.json: one
   record per page, plus one per <details> question, because "do I need a
   contract" is a real thing a visitor types and the answer lives inside an
   accordion nobody can Ctrl-F.

   The index is built from the pages themselves rather than hand-written, for
   the same reason the sitemap and the schema are: a hand-maintained list is a
   list that goes stale, and a search box that cannot find a page is worse
   than no search box at all.

   Run after adding a page or editing copy:
     node scripts/build-search-index.mjs
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'));

const strip = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&mdash;/g, '-').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const records = [];

for (const p of MAP.pages) {
  if (!p.url || p.sitemap === false) continue;
  const file = path.join(root, p.file);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');

  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.split('|')[0].trim() ?? p.file;
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] ?? '';
  const h1 = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] ?? '');
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => strip(m[1])).filter(Boolean);

  /* Body text is capped. The whole index is fetched by a phone on a job site,
     so it is a search aid, not a mirror of the site. */
  const main = strip((html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [])[1] ?? '').slice(0, 1200);

  records.push({
    t: title,
    u: p.url,
    d: desc,
    /* Everything matchable in one lowercased string: one .includes() at
       runtime beats scoring several fields on a mid-range phone. */
    k: [title, desc, h1, ...h2s, p.nav ?? '', p.blurb ?? '', main].join(' ').toLowerCase(),
  });

  // Each FAQ question becomes its own hit, deep-linked to the page.
  for (const m of html.matchAll(/<details[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)) {
    const q = strip(m[1]);
    const a = strip(m[2]);
    if (!q) continue;
    records.push({ t: q, u: p.url, d: a.slice(0, 160), k: `${q} ${a}`.toLowerCase(), q: 1 });
  }
}

const out = path.join(root, 'search-index.json');
fs.writeFileSync(out, JSON.stringify(records));
const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`search-index.json: ${records.length} records (${records.filter((r) => r.q).length} questions), ${kb}KB`);
if (fs.statSync(out).size > 120 * 1024) {
  console.error('FAIL: index over 120KB. Trim the body cap in this script.');
  process.exitCode = 1;
}
