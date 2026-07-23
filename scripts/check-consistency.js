#!/usr/bin/env node
/* Consistency guard for the no-build static site.
   Run: node scripts/check-consistency.js   (exit 1 on any failure)
   Rules:
   1. Every content page shares one identical main-nav (ignoring aria-current).
   2. Every full-footer page shares one identical Site column.
   3. Legal pages (privacy, terms) and pricing use the base-row footer; 404 has none. Documented exceptions.
   4. Banned commercial phrases never appear in public HTML.
   5. Canonical pilot naming: "7-day live pilot" (page copy) / "7-Day Pilot" (nav label).
   6. No em dashes in page copy. Multiplication signs and arrows are allowed. */
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const contentPages = ["index.html", "demo.html", "book.html", "about.html", "pricing.html", "pilot.html", "privacy.html", "terms.html", "coming-soon.html"];
const fullFooterPages = ["index.html", "demo.html", "book.html", "about.html", "pilot.html", "coming-soon.html"];
const banned = [/30-day guarantee/i, /free trial/i, /risk-free launch/i, /\$397\b/, /limited spots remaining/i, /join thousands/i, /launching next month/i];
let fail = 0;
const err = (m) => { console.error("FAIL: " + m); fail++; };

const navOf = (html) => {
  const m = html.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/);
  return m ? m[1].replace(/ aria-current="page"/g, "").replace(/\s+/g, " ").trim() : null;
};
const siteColOf = (html) => {
  const m = html.match(/<h4>Site<\/h4>([\s\S]*?)<\/div>/);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
};

let refNav = null, refCol = null;
for (const p of contentPages) {
  const html = fs.readFileSync(path.join(root, p), "utf8");
  const nav = navOf(html);
  if (!nav) { err(p + ": no main-nav found"); continue; }
  if (!refNav) refNav = nav;
  else if (nav !== refNav) err(p + ": main-nav differs from index.html");
  if (fullFooterPages.includes(p)) {
    const col = siteColOf(html);
    if (!col) { err(p + ": no footer Site column"); }
    else if (!refCol) refCol = col;
    else if (col !== refCol) err(p + ": footer Site column differs");
  }
  for (const b of banned) if (b.test(html)) err(p + ": banned phrase " + b);
  const emDashes = (html.match(/—/g) || []).length;
  if (emDashes > 0) err(p + ": contains " + emDashes + " em dash(es)");
  if (/free 7-day pilot/i.test(html) && !/7-day live pilot/i.test(html)) err(p + ": non-canonical pilot naming");
}
if (fail === 0) console.log("Consistency check passed: " + contentPages.length + " pages, one nav, one footer, no banned phrases.");
process.exit(fail === 0 ? 0 : 1);
