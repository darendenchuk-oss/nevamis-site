/* Weight and accessibility pass over every published page. Read-only.
   Not a replacement for axe; it catches the structural things that are
   cheap to check statically and expensive to notice in production. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

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

/* PAGE WEIGHT IS MEASURED AS IT TRAVELS (2026-10-03, audit CHECK-RUNNER-10).

   The budget was 60 KB of UNCOMPRESSED html, and every one of the 24 pages
   failed it on every run: the shared stylesheet is inlined into each page
   (build-pages.mjs) so no page waits on a second request before it can
   paint, which alone puts a page near 60 KB on disk. A finding on every page
   is no finding, and it was skimmed past. It also measured the wrong thing:
   GitHub Pages gzips html, and serve.js does the same locally, so what a
   visitor downloads is the compressed size.

   So the budget is gzip bytes, the way the page is served:
     PAGE_BUDGET_KB  every page but the homepage. The heaviest today is
                     pricing.html at about 35 KB, so 40 KB catches a page
                     that grows by a sixth, not a target to grow into.
     HOME_BUDGET_KB  home.html and index.html, the film homepage, which
                     inlines its first-paint faces as data: URIs on purpose
                     (scripts/film/chrome-source.html says why). About 83 KB
                     today; tests/quality.spec.js budgets its whole first
                     load separately.
   The raw size is still printed beside it, for whoever works on the inlined
   stylesheet. */
const PAGE_BUDGET_KB = 40;
const HOME_BUDGET_KB = 100;
const gzKb = (p) => zlib.gzipSync(fs.readFileSync(p), { level: 9 }).length / 1024;

console.log("=".repeat(74));
console.log(` PAGE WEIGHT (html only, gzip as served; budget ${PAGE_BUDGET_KB} KB, homepage ${HOME_BUDGET_KB} KB)`);
console.log("=".repeat(74));
for (const f of pages) {
  const full = path.join(root, f);
  const raw = fs.statSync(full).size / 1024;
  const gz = gzKb(full);
  const budget = f === "home.html" || f === "index.html" ? HOME_BUDGET_KB : PAGE_BUDGET_KB;
  const flag = gz > budget ? " <- over budget" : "";
  console.log(`  ${f.padEnd(28)} ${gz.toFixed(1).padStart(7)} KB gz  (${raw.toFixed(1)} KB raw)${flag}`);
  if (gz > budget) add("MED", f, `${gz.toFixed(0)} KB of gzipped HTML before any asset loads (budget ${budget} KB)`);
}

console.log("\n" + "=".repeat(74));
console.log(" SHARED ASSETS");
console.log("=".repeat(74));
// "styles.css" was in this list until 2026-08-07. It was deleted (no page had
// linked it in months), and a permanent "MISSING" row is noise, not a signal.
for (const a of ["site.js", "motion.js", "pricing-config.js", "roadmap-config.js"]) {
  const p = path.join(root, a);
  if (!fs.existsSync(p)) { console.log(`  ${a.padEnd(22)} MISSING`); continue; }
  const kb = fs.statSync(p).size / 1024;
  console.log(`  ${a.padEnd(22)} ${kb.toFixed(1).padStart(7)} KB`);
}
const assetDir = path.join(root, "assets");
if (fs.existsSync(assetDir)) {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  /* Measured as served, like the pages: a text asset gzipped, a binary as it
     is. Still LOW and still listed, because a large file is worth knowing
     about even when it loads late (the ElevenLabs widget loads only when a
     visitor starts a web call, from talk/talk.js). */
  const TEXT = /\.(?:js|mjs|css|svg|json|txt|xml|html)$/i;
  const big = walk(assetDir).map((p) => ({ p: p.replace(root, ""), gz: TEXT.test(p),
    kb: TEXT.test(p) ? gzKb(p) : fs.statSync(p).size / 1024 }))
    .filter((x) => x.kb > 150).sort((a, b) => b.kb - a.kb);
  if (big.length) {
    console.log("\n  assets over 150 KB as served:");
    for (const b of big) { console.log(`    ${b.kb.toFixed(0).padStart(6)} KB${b.gz ? " gz" : "   "}  ${b.p}`); add("LOW", b.p, `${b.kb.toFixed(0)} KB asset as served`); }
  } else console.log("\n  no asset over 150 KB as served");
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

  /* form inputs without a label or aria-label.

     Two false positives fixed 2026-10-03 (audit CHECK-RUNNER-9): six MED
     findings on book.html and coming-soon.html, every one wrong.
     - An input INSIDE its <label> ("<label>Your name <input ...></label>")
       is labelled by that label's text; HTML has always allowed it, and the
       callback form is written that way. The label must carry text of its
       own: an empty wrapping label names nothing.
     - A honeypot that is BOTH aria-hidden="true" and tabindex="-1" is never
       exposed to assistive technology and never reached by keyboard, so
       there is no one for a label to serve. Either attribute alone is not
       enough: an aria-hidden input a keyboard can still reach is a real
       defect, and so is a focusable-by-script one a reader can see. */
  for (const m of body.matchAll(/<input\b([^>]*)>/g)) {
    const a = m[1];
    if (/type="(hidden|submit|button)"/.test(a)) continue;
    if (/aria-hidden="true"/.test(a) && /tabindex="-1"/.test(a)) continue;
    const id = (a.match(/id="([^"]+)"/) || [])[1];
    const before = body.slice(0, m.index);
    const open = before.lastIndexOf("<label");
    const wrapped = open > before.lastIndexOf("</label>")
      && before.slice(before.indexOf(">", open) + 1).replace(/<[^>]+>/g, "").trim().length > 0;
    const labelled = wrapped || /aria-label=|aria-labelledby=/.test(a) || (id && new RegExp(`<label[^>]*for="${id}"`).test(body));
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
