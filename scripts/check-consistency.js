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
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentPages = ["index.html", "demo.html", "book.html", "about.html", "pricing.html", "pilot.html", "privacy.html", "terms.html", "coming-soon.html", "revenue-engine.html"];
const fullFooterPages = ["index.html", "demo.html", "book.html", "about.html", "pilot.html", "coming-soon.html", "revenue-engine.html"];
const banned = [/30-day guarantee/i, /free trial/i, /risk-free launch/i, /\$397\b/, /limited spots remaining/i, /join thousands/i, /launching next month/i,
  /first ring/i, /* CLM-02: retired 2026-07-26, unsupported without uptime monitoring */
  /* Nevamis has no clients yet, so any phrasing that asserts a client base is
     false. \b is deliberate: "your clients" is fine and must not trip this,
     and it does not, because y-o-u-r leaves no word boundary before "our".
     Retire this entry the day there is a real client, not before. */
  /\bour clients\b/i, /\bour customers\b/i];
let fail = 0;
const err = (m) => { console.error("FAIL: " + m); fail++; };

const navOf = (html) => {
  const m = html.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/);
  return m ? m[1].replace(/ aria-current="page"/g, "").replace(/\s+/g, " ").trim() : null;
};
const siteColOf = (html) => {
  /* Footer headings are h2 with a .foot-h class: they are peers of the page's
     sections, and jumping h2 -> h4 broke screen-reader outline navigation. */
  const m = html.match(/<h2 class="foot-h">Site<\/h2>([\s\S]*?)<\/div>/);
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

/* 6b. Retired claims escape through non-HTML surfaces too. A prospect who calls
       the demo line hears the agent prompt, and an answer engine reads llms.txt,
       so both are held to the same banned list as the pages. The engine snapshot
       is checked only when that repo is present beside this one. */
{
  const extraSurfaces = [
    path.join(root, "llms.txt"),
    path.join(root, "..", "nevamis-engine", "docs", "agent-prompts", "demo.md"),
    path.join(root, "..", "nevamis-engine", "docs", "agent-prompts", "intake.md"),
    path.join(root, "..", "nevamis-engine", "docs", "agent-prompts", "escalation.md"),
  ];
  for (const file of extraSurfaces) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const label = path.relative(root, file).replace(/\\/g, "/");
    for (const b of banned) {
      if (b.test(text)) err(label + ": banned phrase " + b + " (spoken or machine-read surface)");
    }
  }
}
/* 7. The static pricing fallback on pricing.html must match pricing-config.js.
      Every plan named in the fallback must exist in the config with identical
      monthly, setup, included-minute, and overage numbers. (The fallback may
      list fewer plans than the config; it must never disagree with it.) */
{
  /* pricing-config.js is our own committed browser global (window.NV_PRICING = ...).
     Execute it in an isolated vm context, exactly as the browser would. */
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });
  const cfg = w.NV_PRICING;
  if (!cfg || !Array.isArray(cfg.plans)) err("pricing-config.js: NV_PRICING.plans not found");
  else {
    const ph = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
    const fbMatch = ph.match(/<div id="plansFallback"[\s\S]*?<\/div><\/div>/);
    if (!fbMatch) err("pricing.html: static #plansFallback block missing");
    else {
      const num = (s) => Number(String(s).replace(/,/g, ""));
      const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/g;
      let m, seen = 0;
      while ((m = re.exec(fbMatch[0])) !== null) {
        seen++;
        const name = m[1].split("&mdash;")[0].trim();
        const body = m[1] + " " + m[2];
        const plan = cfg.plans.find((p) => p.name === name);
        if (!plan) { err('pricing fallback: plan "' + name + '" not in pricing-config.js'); continue; }
        const monthly = body.match(/C\$([\d,]+)\/month/);
        const setup = body.match(/C\$([\d,]+) one-time setup/);
        const mins = body.match(/([\d,]+) included AI minutes/);
        const over = body.match(/C\$([\d.]+) per extra minute/);
        if (!monthly || num(monthly[1]) !== plan.monthly) err('pricing fallback "' + name + '": monthly differs from config (' + plan.monthly + ")");
        if (!setup || num(setup[1]) !== plan.setup) err('pricing fallback "' + name + '": setup differs from config (' + plan.setup + ")");
        if (!mins || num(mins[1]) !== plan.includedMinutes) err('pricing fallback "' + name + '": included minutes differ from config (' + plan.includedMinutes + ")");
        if (!over || Number(over[1]) !== plan.overage) err('pricing fallback "' + name + '": overage differs from config (' + plan.overage + ")");
      }
      if (seen < 3) err("pricing fallback: expected at least 3 plans, found " + seen);
    }
  }
}

/* 7b. Rule 4 checked a hand-maintained list of ten content pages, and that is
       exactly how three abandoned redesign mockups sat live on nevamis.ca
       serving "answers on the first ring" long after CLM-02 retired it. The
       banned-phrase sweep is therefore derived from what actually gets
       published: every root .html file, minus whatever _config.yml excludes
       from the Jekyll build. Add a page and forget to register it, and it is
       still covered. */
{
  const cfg = fs.readFileSync(path.join(root, "_config.yml"), "utf8");
  const excluded = new Set(
    cfg.split(/\r?\n/)
      .map((l) => (l.match(/^\s*-\s+(\S+)\s*$/) || [])[1])
      .filter(Boolean)
      .map((e) => e.replace(/\/$/, ""))
  );
  const published = fs.readdirSync(root)
    .filter((f) => f.endsWith(".html") && !excluded.has(f));

  for (const f of published) {
    const html = fs.readFileSync(path.join(root, f), "utf8");
    for (const b of banned) {
      if (b.test(html)) err(`${f}: banned phrase ${b} on a PUBLISHED page (serves 200 to anyone with the URL; noindex does not stop people or answer engines)`);
    }
  }
  if (published.length < contentPages.length) err(`only ${published.length} published pages found; expected at least the ${contentPages.length} content pages`);
}

/* 8. The demo agent says prices out loud to real prospects, which makes its
      prompt a pricing surface exactly like pricing.html. It writes them as
      words ("two forty-nine a month") because a digit string gets read back as
      digits, and that is why rule 7 cannot catch a drift here: changing 249 in
      pricing-config.js leaves "two forty-nine" sitting in the prompt, correct
      looking and wrong. Checked only when the engine repo is beside this one. */
{
  const promptFile = path.join(root, "..", "nevamis-engine", "docs", "agent-prompts", "demo.md");
  if (fs.existsSync(promptFile)) {
    const spoken = fs.readFileSync(promptFile, "utf8").toLowerCase();
    const w = {};
    vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });

    const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
      "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const small = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""));

    /* Spoken English gives a price more than one correct reading: 1250 is
       "twelve fifty" on a phone call and "one thousand two hundred fifty" in a
       contract. Accept any of them, reject a number nobody would say. */
    const dollarForms = (n) => {
      const out = new Set();
      const h = Math.floor(n / 100), r = n % 100;
      if (n < 100) out.add(small(n));
      if (h > 0 && h < 100) {
        out.add(h === 1 && !r ? "one hundred" : `${small(h)} hundred${r ? " " + small(r) : ""}`);
        if (r) { out.add(`${small(h)} hundred and ${small(r)}`); out.add(`${small(h)} ${small(r)}`); }
      }
      if (n >= 1000) {
        const th = Math.floor(n / 1000), rem = n % 1000, rh = Math.floor(rem / 100), rr = rem % 100;
        let base = `${small(th)} thousand`;
        if (rh) base += ` ${small(rh)} hundred`;
        if (rr) { out.add(`${base} ${small(rr)}`); out.add(`${base} and ${small(rr)}`); } else out.add(base);
      }
      return [...out];
    };
    const centForms = (v) => {
      const cents = Math.round(v * 100), d = Math.floor(cents / 100), c = cents % 100;
      if (cents < 100) return [`${small(cents)} cents`];
      const out = new Set([`${small(d)} ${small(c)}`]);
      out.add(`${d === 1 ? "a" : small(d)} dollar${d === 1 ? "" : "s"}${c ? " " + small(c) : ""}`);
      return [...out];
    };

    for (const plan of w.NV_PRICING.plans) {
      for (const [label, forms] of [["monthly", dollarForms(plan.monthly)], ["setup", dollarForms(plan.setup)], ["overage", centForms(plan.overage)]]) {
        if (!forms.some((f) => spoken.includes(f)))
          err(`demo.md: ${plan.name} ${label} (${plan[label]}) is never spoken; say one of: ${forms.join(" / ")}`);
      }
      const mins = plan.includedMinutes;
      if (!spoken.includes(String(mins)) && !spoken.includes(mins.toLocaleString("en-CA")))
        err(`demo.md: ${plan.name} included minutes (${mins}) are never stated, and minutes are how the plans differ`);
    }
  }
}

if (fail === 0) console.log("Consistency check passed: " + contentPages.length + " pages, one nav, one footer, no banned phrases, pricing fallback matches config, spoken prices match config.");
process.exit(fail === 0 ? 0 : 1);
