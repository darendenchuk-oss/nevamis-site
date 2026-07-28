#!/usr/bin/env node
/* Regenerates sitemap.xml with lastmod derived from each page's latest git
   commit date, so dates can never go stale by hand again (WEB-226).
   Run: node scripts/gen-sitemap.mjs   (writes sitemap.xml in place) */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/* Page set comes from content-map.json so a new page can never miss the
   sitemap: add the row there and it appears here, in the hub, and in the tests. */
const PAGES = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'))
  .pages
  .filter((p) => p.sitemap !== false && p.url)
  .sort((a, b) => Number(b.priority) - Number(a.priority))
  .map((p) => [p.file, 'https://nevamis.ca' + p.url, p.priority]);

function lastmod(file) {
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { cwd: root }).toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) return out;
  } catch { /* fall through */ }
  return new Date().toISOString().slice(0, 10);
}

const rows = PAGES.map(([file, loc, priority]) =>
  `  <url><loc>${loc}</loc><lastmod>${lastmod(file)}</lastmod><priority>${priority}</priority></url>`);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), xml);
console.log("sitemap.xml regenerated for " + PAGES.length + " pages (lastmod from git history)");
