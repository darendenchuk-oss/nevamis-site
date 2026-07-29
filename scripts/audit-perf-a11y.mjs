/* Weight and accessibility pass over every published page. Read-only.
   Not a replacement for axe; it catches the structural things that are
   cheap to check statically and expensive to notice in production. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const excluded = (() => {
  const cfg = fs.readFileSync(path.join(root, "_config.yml"), "utf8");
  const m = cfg.match(/exclude:\s*([\s\S]*?)(?:\n\w|$)/);
  return m ? m[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean) : [];
})();
const pages = fs.readdirSync(root).filter((f) => f.endsWith(".html"))
  .filter((f) => !excluded.some((e) => e === f || e === "/" + f)).sort();

const findings = [];
const add = (sev, page, what) => findings.push({ sev, page, what });

console.log("=".repeat(74));
console.log(" PAGE WEIGHT (html only, before assets)");
console.log("=".repeat(74));
for (const f of pages) {
  const kb = fs.statSync(path.join(root, f)).size / 1024;
  const flag = kb > 60 ? " <- heavy" : "";
  console.log(`  ${f.padEnd(28)} ${kb.toFixed(1).padStart(7)} KB${flag}`);
  if (kb > 60) add("MED", f, `${kb.toFixed(0)} KB of HTML on the wire before any asset loads`);
}

console.log("\n" + "=".repeat(74));
console.log(" SHARED ASSETS");
console.log("=".repeat(74));
for (const a of ["styles.css", "site.js", "motion.js", "pricing-config.js", "roadmap-config.js"]) {
  const p = path.join(root, a);
  if (!fs.existsSync(p)) { console.log(`  ${a.padEnd(22)} MISSING`); continue; }
  const kb = fs.statSync(p).size / 1024;
  console.log(`  ${a.padEnd(22)} ${kb.toFixed(1).padStart(7)} KB`);
}
const assetDir = path.join(root, "assets");
if (fs.existsSync(assetDir)) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const big = walk(assetDir).map((p) => ({ p: p.replace(root, ""), kb: fs.statSync(p).size / 1024 }))
    .filter((x) => x.kb > 150).sort((a, b) => b.kb - a.kb);
  if (big.length) {
    console.log("\n  assets over 150 KB:");
    for (const b of big) { console.log(`    ${b.kb.toFixed(0).padStart(6)} KB  ${b.p}`); add("LOW", b.p, `${b.kb.toFixed(0)} KB asset`); }
  } else console.log("\n  no asset over 150 KB");
}

console.log("\n" + "=".repeat(74));
console.log(" ACCESSIBILITY");
console.log("=".repeat(74));
for (const f of pages) {
  const html = fs.readFileSync(path.join(root, f), "utf8");
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");

  const imgs = [...body.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt=/.test(t));
  if (noAlt.length) add("MED", f, `${noAlt.length} <img> without alt`);

  /* buttons and links whose only content is an icon/svg have no accessible name */
  for (const m of body.matchAll(/<(button|a)\b([^>]*)>([\s\S]{0,180}?)<\/\1>/g)) {
    const attrs = m[2], inner = m[3];
    const hasLabel = /aria-label=|aria-labelledby=|title=/.test(attrs);
    const textual = inner.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").trim();
    if (!hasLabel && !textual && /<svg|<img/.test(inner)) {
      add("MED", f, `<${m[1]}> with only an icon and no accessible name`);
    }
  }

  /* heading order */
  const heads = [...body.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
  for (let i = 1; i < heads.length; i++) {
    if (heads[i] - heads[i - 1] > 1) { add("LOW", f, `heading jumps h${heads[i - 1]} -> h${heads[i]}`); break; }
  }
  if (heads.filter((h) => h === 1).length !== 1) add("MED", f, `${heads.filter((h) => h === 1).length} <h1> (want exactly 1)`);

  if (!/<a[^>]*class="[^"]*skip/i.test(html) && !/skip to (main|content)/i.test(html)) {
    add("LOW", f, "no skip-to-content link");
  }
  if (/<html(?![^>]*\blang=)/.test(html)) add("MED", f, "<html> missing lang");

  /* form inputs without a label or aria-label */
  for (const m of body.matchAll(/<input\b([^>]*)>/g)) {
    const a = m[1];
    if (/type="(hidden|submit|button)"/.test(a)) continue;
    const id = (a.match(/id="([^"]+)"/) || [])[1];
    const labelled = /aria-label=|aria-labelledby=/.test(a) || (id && new RegExp(`<label[^>]*for="${id}"`).test(body));
    if (!labelled) add("MED", f, `<input${id ? " #" + id : ""}> has no label`);
  }
}

const order = { HIGH: 0, MED: 1, LOW: 2 };
const uniq = [...new Map(findings.map((x) => [x.sev + x.page + x.what, x])).values()];
uniq.sort((a, b) => order[a.sev] - order[b.sev] || a.page.localeCompare(b.page));
console.log();
if (!uniq.length) console.log("  no findings");
for (const x of uniq) console.log(`  ${x.sev.padEnd(5)} ${x.page.padEnd(28)} ${x.what}`);
console.log(`\n${uniq.length} findings`);
