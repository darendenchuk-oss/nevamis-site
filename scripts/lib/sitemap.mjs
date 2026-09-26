/* ============================================================
   THE SITEMAP'S PAGE SET, CONTENT HASHES AND XML, IN ONE PLACE

   Two callers: scripts/gen-sitemap.mjs writes sitemap.xml and
   config/sitemap-hashes.json, and scripts/check-generator-drift.mjs proves the
   two still describe the pages on disk. If each kept its own copy of the page
   list, the hash or the XML layout, the writer and the guard could drift apart
   and both stay green while the sitemap went stale, which is how every
   <lastmod> came to read 2026-09-19 while pages changed on 09-20 and 09-23.

   Nothing here uses git or the clock. That is the point of the design: the
   guard has to give the same answer in a shallow CI checkout, after a squash
   merge, and on any day, so it compares CONTENT, never dates. Dates are
   chosen once, by gen-sitemap, and then only carried.
   ============================================================ */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/* Not published: _config.yml excludes config/. */
export const SIDECAR = 'config/sitemap-hashes.json';
export const SITEMAP = 'sitemap.xml';

/* Page set comes from content-map.json so a new page can never miss the
   sitemap: add the row there and it appears here, in the hub, and in the
   tests. Highest priority first, as the file has always been ordered. */
export function sitemapPages(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'))
    .pages
    .filter((p) => p.sitemap !== false && p.url)
    .sort((a, b) => Number(b.priority) - Number(a.priority))
    .map((p) => ({ file: p.file, loc: 'https://nevamis.ca' + p.url, priority: p.priority }));
}

/* sha256 of the file's bytes with every \r removed. core.autocrlf is true on
   the Windows checkouts and unset in CI, so the same commit is CRLF in one and
   LF in the other. A line-ending difference is not a content change and must
   not move a date or fail the guard. */
export function pageHash(root, file) {
  const buf = fs.readFileSync(path.join(root, file));
  return crypto.createHash('sha256').update(buf.filter((b) => b !== 0x0d)).digest('hex');
}

/* A real calendar date in the one form gen-sitemap writes. The writer keeps a
   recorded lastmod only when this holds, and the guard fails when it does not,
   so a hand-edited "garbage" or 2026-13-45 is both caught and repaired by a
   rerun. */
export function isLastmod(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function renderSitemap(rows) {
  const lines = rows.map((r) =>
    `  <url><loc>${r.loc}</loc><lastmod>${r.lastmod}</lastmod><priority>${r.priority}</priority></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`;
}

/* loc -> lastmod as sitemap.xml states it. Tolerates CRLF. */
export function readSitemapLastmods(xml) {
  const out = new Map();
  for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/g)) out.set(m[1].trim(), m[2].trim());
  return out;
}

export function readSidecar(root) {
  const full = path.join(root, SIDECAR);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}
