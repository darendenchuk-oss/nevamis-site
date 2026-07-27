#!/usr/bin/env node
/* Regenerates sitemap.xml with lastmod derived from each page's latest git
   commit date, so dates can never go stale by hand again (WEB-226).
   Run: node scripts/gen-sitemap.mjs   (writes sitemap.xml in place) */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

/* Page -> priority. Order here is the order in the file. */
const PAGES = [
  ["index.html", "https://nevamis.ca/", "1.0"],
  ["demo.html", "https://nevamis.ca/demo.html", "0.9"],
  ["book.html", "https://nevamis.ca/book.html", "0.9"],
  ["pricing.html", "https://nevamis.ca/pricing.html", "0.8"],
  ["pilot.html", "https://nevamis.ca/pilot.html", "0.8"],
  ["coming-soon.html", "https://nevamis.ca/coming-soon.html", "0.6"],
  ["revenue-engine.html", "https://nevamis.ca/revenue-engine.html", "0.7"],
  ["about.html", "https://nevamis.ca/about.html", "0.6"],
  ["privacy.html", "https://nevamis.ca/privacy.html", "0.2"],
  ["terms.html", "https://nevamis.ca/terms.html", "0.2"],
];

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
