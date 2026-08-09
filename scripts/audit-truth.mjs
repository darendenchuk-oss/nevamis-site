/* Cross-page truth and consistency checks that no existing guard covers.
   Every published page, not a hardcoded subset. Read-only.

   What it checks:
     1. Every price/number on every page against pricing-config.js
     2. Phone numbers: one demo line everywhere, no strays
     3. Email addresses: one contact address, no strays
     4. Claim words that assert traction Nevamis does not have
     5. Absolute internal links that hardcode the domain (break on preview)
     6. Pages missing from sitemap.xml that are indexable  */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const html = (f) => fs.readFileSync(path.join(root, f), "utf8");

const excluded = (() => {
  const cfg = fs.readFileSync(path.join(root, "_config.yml"), "utf8");
  const m = cfg.match(/exclude:\s*([\s\S]*?)(?:\n\w|$)/);
  return m ? m[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean) : [];
})();
const pages = fs.readdirSync(root).filter((f) => f.endsWith(".html"))
  .filter((f) => !excluded.some((e) => e === f || e === "/" + f)).sort();

/* pricing-config.js is a browser global (window.NV_PRICING = {...}). Read the
   figures out with a scan rather than executing the file: an audit script has
   no business running code just to learn a number, and eval-shaped helpers
   have a habit of later being pointed at input that is not ours. */
const cfgSrc = fs.readFileSync(path.join(root, "pricing-config.js"), "utf8");
const numbersFor = (key) =>
  [...cfgSrc.matchAll(new RegExp(`\\b${key}:\\s*(\\d+(?:\\.\\d+)?)`, "g"))].map((m) => Number(m[1]));

const approvedMonthly = new Set(numbersFor("monthly"));
const approvedAnnual = new Set(numbersFor("annual"));
/* `setup` was read here and required to be non-empty. On 2026-08-09 the key
   was deleted from pricing-config.js rather than zeroed, so this scan returned
   nothing and the WHOLE AUDITOR aborted on its first check with "could not
   read prices from pricing-config.js". It exited 0 while doing so, which is
   the worst combination available: a truth audit that had stopped auditing and
   still looked like it had run. Verified by running it.

   The abort now guards only the figure that must exist. There is one price per
   plan, so `monthly` being unreadable is the real "we cannot audit anything"
   condition. */
const approvedSetup = new Set();
if (!approvedMonthly.size) {
  console.error("could not read monthly prices from pricing-config.js; aborting rather than reporting false findings");
  process.exit(1);
}

/* Derived approvals: figures a page may legitimately state that are not
   literally in the config.

   This computed the pilot fee and the first-month amounts it was credited
   against, because otherwise the auditor reported the published C$150 fee as
   an unapproved price on every page that named it: nineteen of twenty-one
   findings were the fee being correct, and an audit that is nine parts noise
   gets skimmed along with the two real lines in it.

   The set is now EMPTY, and that is the correct state rather than an
   oversight. One price per plan, charged every month including the first,
   means no page has a second figure to derive, so nothing needs excusing. It
   is kept as an empty set rather than deleted so the next derived figure has
   somewhere to go, and so that C$150 and C$850 now fall through to being
   reported as unapproved prices wherever they appear. That is the intended
   direction: the numbers this block used to protect are the numbers it should
   now catch. */
const approvedDerived = new Set();

const findings = [];
const add = (sev, page, what) => findings.push({ sev, page, what });

const DEMO_PHONE = "587-413-0035";
const CONTACT_EMAIL = "sales@nevamis.ca";

for (const f of pages) {
  const raw = html(f);
  const body = raw.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  const text = body.replace(/<[^>]+>/g, " ");

  /* 1. dollar figures that look like plan pricing but are not approved */
  for (const m of text.matchAll(/\$\s?(\d{2,4})\b(?!\s?(?:k|,\d))/g)) {
    const n = Number(m[1]);
    if (n < 40) continue;                      // small numbers are job values / examples
    if (approvedMonthly.has(n) || approvedSetup.has(n) || approvedAnnual.has(n) || approvedDerived.has(n)) continue;
    const ctx = text.slice(Math.max(0, m.index - 90), m.index + 60).replace(/\s+/g, " ").trim();
    // Buyer-entered assumptions, job-value illustrations, and the fictional
    // trade prices spoken inside example call transcripts are not our pricing.
    if (/average|job|per job|value|example|assum|typical|ticket|revenue|worth|salary|receptionist/i.test(ctx)) continue;
    if (/service (call|visit)|comes off|applied to|goes toward|per your price sheet|quoted/i.test(ctx)) continue;
    add("HIGH", f, `unapproved price $${n}  ...${ctx}...`);
  }

  /* 2. phone numbers */
  for (const m of text.matchAll(/\b(?:\+?1[-.\s]?)?\(?(780|587|825|800|888|877)\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g)) {
    const digits = m[0].replace(/\D/g, "").slice(-10);
    const demo = DEMO_PHONE.replace(/\D/g, "");
    // 555-0100..555-0199 is reserved for fiction; using it in an example call
    // is the correct thing to do, not a stray real number.
    if (/^\d{3}55501\d{2}$/.test(digits)) continue;
    if (digits !== demo) add("HIGH", f, `unexpected phone number ${m[0]} (demo line is ${DEMO_PHONE})`);
  }

  /* 3. email addresses */
  for (const m of text.matchAll(/[\w.+-]+@[\w.-]+\.\w{2,}/g)) {
    if (m[0].toLowerCase() !== CONTACT_EMAIL) add("MED", f, `unexpected email ${m[0]}`);
  }
  for (const m of raw.matchAll(/mailto:([^"'?]+)/g)) {
    if (m[1].toLowerCase() !== CONTACT_EMAIL) add("MED", f, `mailto to ${m[1]}`);
  }

  /* 4. traction claims Nevamis cannot support */
  const claims = [
    /\btrusted by\b/i, /\bthousands of\b/i, /\bhundreds of\b/i, /\bindustry[- ]leading\b/i,
    /\b\d+\+? (?:happy )?(?:clients|customers|businesses) (?:trust|use|rely)/i,
    /\bproven results\b/i, /\baward[- ]winning\b/i, /\b#1\b/,
  ];
  for (const c of claims) {
    const m = text.match(c);
    if (m) add("HIGH", f, `unsupported traction claim: "${m[0]}"`);
  }

  /* 5. hardcoded absolute internal links in ANCHORS only. canonical, og:url
     and twitter:image must be absolute, so scanning all href/src attributes
     flags correct metadata on every page and buries any real finding. */
  for (const m of body.matchAll(/<a\b[^>]*href="https:\/\/nevamis\.ca(\/[^"]*)"/g)) {
    add("LOW", f, `anchor uses absolute internal link ${m[1]} (relative is portable)`);
  }
}

/* 6. sitemap coverage */
const sm = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const f of pages) {
  const raw = html(f);
  if (/name="robots"[^>]*noindex/i.test(raw)) continue;
  if (f === "404.html") continue;
  const slug = f === "index.html" ? "/" : "/" + f;
  if (!sm.includes(slug)) add("MED", f, `indexable but missing from sitemap.xml (${slug})`);
}

const order = { HIGH: 0, MED: 1, LOW: 2 };
findings.sort((a, b) => order[a.sev] - order[b.sev] || a.page.localeCompare(b.page));
console.log("=".repeat(72));
console.log(` TRUTH + CONSISTENCY  -  ${pages.length} published pages`);
console.log("=".repeat(72));
if (!findings.length) console.log("no findings");
for (const x of findings) console.log(`${x.sev.padEnd(5)} ${x.page.padEnd(26)} ${x.what}`);
console.log(`\n${findings.length} findings`);
