/* Run the consistency rules against EVERY published page, not just the
   hardcoded eleven in check-consistency.js. Read-only: reports, changes
   nothing. The point is to measure what the existing guard cannot see. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

/* the guard's own lists, copied so drift between them is visible */
const guarded = ["index.html", "demo.html", "book.html", "about.html", "pricing.html",
  "pilot.html", "privacy.html", "terms.html", "coming-soon.html", "revenue-engine.html", "404.html"];

const excluded = (() => {
  try {
    const cfg = fs.readFileSync(path.join(root, "_config.yml"), "utf8");
    const m = cfg.match(/exclude:\s*([\s\S]*?)(?:\n\w|$)/);
    if (!m) return [];
    return m[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  } catch { return []; }
})();

const onDisk = fs.readdirSync(root).filter((f) => f.endsWith(".html")).sort();
const isExcluded = (f) => excluded.some((e) => e === f || e === "/" + f || f.startsWith(e.replace(/\/$/, "")));
const published = onDisk.filter((f) => !isExcluded(f));

console.log("=".repeat(70));
console.log(" COVERAGE");
console.log("=".repeat(70));
console.log(`html files on disk : ${onDisk.length}`);
console.log(`published (not excluded by _config.yml) : ${published.length}`);
console.log(`checked by check-consistency.js : ${guarded.length}`);
const unguarded = published.filter((f) => !guarded.includes(f));
console.log(`\nPUBLISHED BUT UNGUARDED (${unguarded.length}):`);
for (const f of unguarded) console.log("   " + f);

/* the same rules the guard applies, applied to everything */
/* Copied verbatim from check-consistency.js so this measures COVERAGE, not a
   different opinion. A bare /guarantee/ would flag "Estimate only, not a
   guarantee", which is the honest disclaimer you want, so it is deliberately
   the specific retired offer that is banned. */
const banned = [/30-day guarantee/i, /free trial/i, /risk-free launch/i, /\$397\b/,
  /limited spots remaining/i, /join thousands/i, /launching next month/i,
  /first ring/i, /\bour clients\b/i, /\bour customers\b/i];

/* aria-current="page" legitimately differs per page; the real guard strips it
   before comparing and so must this, or every page looks broken. */
const navOf = (h) => {
  const m = h.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/);
  return m ? m[1].replace(/ aria-current="page"/g, "").replace(/\s+/g, " ").trim() : null;
};
const refNav = navOf(fs.readFileSync(path.join(root, "index.html"), "utf8"));

const findings = [];
const add = (page, sev, what) => findings.push({ page, sev, what });

for (const f of published) {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  const body = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");

  for (const b of banned) if (b.test(body)) add(f, "HIGH", `banned phrase ${b}`);

  const em = (body.match(/—/g) || []).length;
  if (em > 0) add(f, "LOW", `${em} em dash(es) in copy (brief forbids them)`);

  const nav = navOf(html);
  if (nav === null) add(f, "MED", "no main-nav (orphaned from site navigation)");
  else if (nav !== refNav) add(f, "MED", "main-nav differs from index.html");

  if (!/<title>[^<]{10,}<\/title>/.test(html)) add(f, "HIGH", "missing or too-short <title>");
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) add(f, "MED", "missing or short meta description");
  if (!/rel="canonical"/.test(html) && f !== "404.html") add(f, "MED", "no canonical link");
  if (!/og:title/.test(html) && f !== "404.html") add(f, "LOW", "no og:title");
  if (!/og:image/.test(html) && f !== "404.html") add(f, "LOW", "no og:image");

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 === 0) add(f, "MED", "no <h1>");
  if (h1 > 1) add(f, "LOW", `${h1} <h1> elements (should be 1)`);

  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt=/.test(t));
  if (noAlt.length) add(f, "MED", `${noAlt.length} <img> without alt`);

  if (/<html(?![^>]*\blang=)/.test(html)) add(f, "MED", "<html> missing lang attribute");
}

console.log("\n" + "=".repeat(70));
console.log(" FINDINGS ON UNGUARDED PAGES");
console.log("=".repeat(70));
const order = { HIGH: 0, MED: 1, LOW: 2 };
const unguardedFindings = findings.filter((x) => unguarded.includes(x.page));
unguardedFindings.sort((a, b) => order[a.sev] - order[b.sev] || a.page.localeCompare(b.page));
if (!unguardedFindings.length) console.log("none");
for (const x of unguardedFindings) console.log(`  ${x.sev.padEnd(5)} ${x.page.padEnd(28)} ${x.what}`);

console.log("\n" + "=".repeat(70));
console.log(" FINDINGS ON GUARDED PAGES (guard should have caught these)");
console.log("=".repeat(70));
const guardedFindings = findings.filter((x) => guarded.includes(x.page));
guardedFindings.sort((a, b) => order[a.sev] - order[b.sev] || a.page.localeCompare(b.page));
if (!guardedFindings.length) console.log("none");
for (const x of guardedFindings) console.log(`  ${x.sev.padEnd(5)} ${x.page.padEnd(28)} ${x.what}`);

console.log(`\ntotal findings: ${findings.length}`);
