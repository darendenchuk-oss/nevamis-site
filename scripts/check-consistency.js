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
const contentPages = ["index.html", "demo.html", "book.html", "about.html", "pricing.html", "pilot.html", "privacy.html", "terms.html", "coming-soon.html", "revenue-engine.html"];
const fullFooterPages = ["index.html", "demo.html", "book.html", "about.html", "pilot.html", "coming-soon.html", "revenue-engine.html"];
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
/* 7. The static pricing fallback on pricing.html must match pricing-config.js.
      Every plan named in the fallback must exist in the config with identical
      monthly, setup, included-minute, and overage numbers. (The fallback may
      list fewer plans than the config; it must never disagree with it.) */
{
  /* pricing-config.js is our own committed browser global (window.NV_PRICING = ...).
     Execute it in an isolated vm context, exactly as the browser would. */
  const vm = require("node:vm");
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

if (fail === 0) console.log("Consistency check passed: " + contentPages.length + " pages, one nav, one footer, no banned phrases, pricing fallback matches config.");
process.exit(fail === 0 ? 0 : 1);
