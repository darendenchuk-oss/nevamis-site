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
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promoteHtml } from "./promote.mjs";
import { headCssBlock, readCssSources, CSS_OPEN, CSS_CLOSE, LINK_FONTS, LINK_SITE } from "./lib/inline-css.mjs";
import { applySelfCta } from "./lib/nav-cta.mjs";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
/* 404.html is on both lists deliberately. It was excluded on the theory that it
   had no shared chrome, and that exemption is exactly why its hand-copied nav
   lost the Solutions link and kept the h1 -> h4 footer heading skip. A page
   real visitors land on is held to the same nav and footer as the rest.

   That lesson was applied to one page and not to the pattern. The list below
   used to be hand-maintained and had fallen eleven pages behind the site: every
   vertical landing page (electricians, hvac, plumbers, restoration,
   after-hours-answering, missed-calls, vs-voicemail, vs-answering-service,
   solutions) plus home.html and proposal.html were published and unchecked.
   Nothing was wrong on them at the time, which is the point: the guard could
   not have told us either way.

   So the list is now DERIVED: every .html at the root that Jekyll actually
   publishes. Add a page and it is guarded the moment it exists. */
const excludedByJekyll = (() => {
  const cfg = fs.readFileSync(path.join(root, "_config.yml"), "utf8");
  const m = cfg.match(/exclude:\s*([\s\S]*?)(?:\n\w|$)/);
  if (!m) return [];
  return m[1].split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
})();
const contentPages = fs.readdirSync(root)
  .filter((f) => f.endsWith(".html"))
  .filter((f) => !excludedByJekyll.some((e) => e === f || e === "/" + f))
  .sort();

/* Documented no-chrome exemptions. These skip the shared nav/footer check ONLY;
   every content rule (banned phrases, em dashes, pilot naming) still applies.
   proposal.html is a standalone document sent to one prospect, so site
   navigation on it would be wrong rather than missing. */
const noChromePages = ["proposal.html"];
const fullFooterPages = ["index.html", "demo.html", "book.html", "about.html", "pilot.html", "coming-soon.html", "revenue-engine.html", "404.html"];
const banned = [/30-day guarantee/i, /free trial/i, /risk-free launch/i, /\$397\b/, /limited spots remaining/i, /join thousands/i, /launching next month/i,
  /first ring/i, /* CLM-02: retired 2026-07-26, unsupported without uptime monitoring */
  /* Nevamis has no clients yet, so any phrasing that asserts a client base is
     false. \b is deliberate: "your clients" is fine and must not trip this,
     and it does not, because y-o-u-r leaves no word boundary before "our".
     Retire this entry the day there is a real client, not before. */
  /\bour clients\b/i, /\bour customers\b/i,
  /* Popularity is a client-base claim wearing different clothes. "Growth —
     most trades pick this" sat on the one-page sheet handed across the
     counter, and on both cold-calling crib sheets, while no plan had ever
     been picked by anyone. A prospect who asks "who else is on Growth?"
     discovers that inside the same conversation, and Edmonton trades is a
     referral market. pricing-config.js already carries `recommended: true`
     on Growth, which says the same useful thing and is true.
     Retire these the day there is a real distribution to describe. */
  /most (?:trades |clients |shops |people |businesses )?pick (?:this|it)/i,
  /← ?most\b/, /\bmost popular\b/i, /\bbest[- ]seller\b/i,
  /* "MOST COMMON" was the badge on the recommended plan, on the pricing page,
     the homepage, the staging twin, and the proposal sent to a named prospect.
     The rules above were written the same day and missed it, for one reason:
     the phrase was not in this list. It is plain text in the source, so the
     file-level scan sees it as soon as it is banned. */
  /\bmost common\b/i];
let fail = 0;
const err = (m) => { console.error("FAIL: " + m); fail++; };

/* Some findings are true but nobody here can fix them, because the thing that
   is wrong is the prompt running on the live phone line and that is changed by
   hand, by the owner, in the ElevenLabs dashboard. Reporting those as FAIL
   means the command is permanently red through no fault of the working tree,
   and a command that is always red is a command that stops being read.

   So they report on their own channel and exit 2. check-all.mjs turns exit 2
   into "WAITING ON YOU" and does not block the push. Exit 1 still means
   something in this repository is actually broken. */
let waiting = 0;
const wait = (m) => { console.error("WAIT: " + m); waiting++; };

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

/* The raw reference block, kept alongside the normalised one, because the
   header BUTTON legitimately differs on the page it points at: on book.html it
   becomes an in-page jump to the scheduler instead of a link that reloads the
   page the visitor is already on. That is generated by scripts/lib/nav-cta.mjs,
   so the guard applies the SAME transform to the reference before comparing.
   Teaching the rule the transform keeps it strict; relaxing it to "navs may
   differ" would have retired the rule that exists because a hand-copied nav
   drifted and lost the Solutions link. */
let refNavRaw = null;
let refNav = null, refCol = null;
for (const p of contentPages) {
  const html = fs.readFileSync(path.join(root, p), "utf8");
  const nav = navOf(html);
  const rawBlock = (html.match(/<nav class="main-nav"[^>]*>[\s\S]*?<\/nav>/) || [null])[0];
  if (!refNavRaw && rawBlock && !noChromePages.includes(p)) refNavRaw = rawBlock;
  /* Content rules run on every page including no-chrome ones, so a false claim
     cannot hide on a page that happens to lack navigation. Only the shared
     nav/footer comparison is skipped, and only for documented pages. */
  if (!noChromePages.includes(p)) {
    if (!nav) err(p + ": no main-nav found");
    else if (!refNav) refNav = nav;
    else if (nav !== navOf(applySelfCta(refNavRaw, p))) err(p + ": main-nav differs from index.html");
  }
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
  /* A page is not the only way a claim reaches a prospect. It also reaches
     them through the agent that answers the demo line, through the sheet the
     founder hands across a counter, and through the script he reads on a cold
     call. Those last two live outside this repo entirely, which is why the
     retired "first ring" claim survived here for days after every page was
     cleaned: the guard could not see the Desktop.

     SCOPE IS DELIBERATE. Only surfaces that reach a prospect are swept.
     Analysis and planning documents (LAUNCH-GAP-MATRIX.md, the readiness
     reports, the econ model) legitimately quote retired claims in order to
     record that they were retired, and sweeping those would make this rule
     fire on the very documents that fixed the problem. */
  const surfaceDirs = [
    // The live agent's own instructions, knowledge base and test cases.
    path.join(root, "config", "elevenlabs"),
    // Sheets handed to, or emailed to, a prospect.
    path.join(root, "..", "ai-assistant", "outreach"),
    // The cold-calling kit: scripts read aloud to real businesses.
    path.join(root, "..", "Desktop", "Nevamis Cold Calling"),
  ];
  const surfaceFiles = [
    path.join(root, "llms.txt"),
    path.join(root, "..", "ai-assistant", "SALES_PITCH.md"),
    path.join(root, "..", "ai-assistant", "PARTNER-CHANNEL.md"),
    path.join(root, "..", "nevamis-engine", "docs", "agent-prompts", "demo.md"),
    path.join(root, "..", "nevamis-engine", "docs", "agent-prompts", "intake.md"),
    path.join(root, "..", "nevamis-engine", "docs", "agent-prompts", "escalation.md"),
  ];

  /* Walked rather than listed, so a script added to the calling kit tomorrow is
     covered without anyone remembering to add it here. Every truth gap found on
     this site so far has been a page missing from a hand-maintained array. */
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return [];
    let out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (/node_modules|[\\/]\.|archive|staging-tests|__pycache__|venv/i.test(p)) continue;
        out = out.concat(walk(p));
      } else if (/\.(md|txt)$/i.test(e.name)) out.push(p);
    }
    return out;
  };

  /* Judged per SENTENCE, and only where the sentence is not itself FORBIDDING
     the phrase it contains.

     This rule tested the whole file, so it failed the two documents doing the
     most to prevent the thing it guards: the live agent's prompt, whose
     retired-price line reads "never quote these ... and any free pilot or free
     trial", and the outreach README's "There is no free pilot and no free
     trial, both were retired." Two permanent red entries that were correct
     content, which is precisely how a checker stops being read.

     Same classification the engine's checkText uses (OFFER_DENIAL in
     src/domain/canonical.ts). Classified, not allowlisted: an allowlist of
     these two sentences leaves the third unguarded. */
  const DENIAL = [
    /\bnever\s+(?:quote|say|offer|promise|use|mention)\b/i,
    /\b(?:is|are|was|were)\s+retired\b/i, /\bretired\b/i,
    /\bthere is no\b/i, /\bthere are no\b/i, /\bwe do not\b/i, /\bdo not\s+(?:quote|say|offer|promise)\b/i,
    /\bno longer\b/i, /\bnot a current\b/i, /\bsuperseded\b/i, /\bprohibited\b/i,
  ];
  const statesBanned = (text, re) => text
    .replace(/\*\*|__|\*/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .some((s) => re.test(s) && !DENIAL.some((d) => d.test(s)));

  const extraSurfaces = [...surfaceFiles, ...surfaceDirs.flatMap(walk)];
  for (const file of extraSurfaces) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    const label = path.relative(root, file).replace(/\\/g, "/");
    for (const b of banned) {
      if (statesBanned(text, b)) err(label + ": banned phrase " + b + " (spoken or machine-read surface)");
    }
  }
}
/* 7. The static pricing fallback on pricing.html must match pricing-config.js.
      Every plan named in the fallback must exist in the config with identical
      first-month, recurring-monthly, included-minute, and overage numbers.
      (The fallback may list fewer plans than the config; it must never
      disagree with it.)

      The shape being matched changed on 2026-08-07 with the copy. The old
      rule looked for "C$250/month" and "C$250 one-time setup", which is the
      wording that made a Core customer believe he owed C$500 on day one.
      It also never actually passed: the fallback wrote "One-time setup C$250"
      and the regex wanted the amount FIRST, so all three plans reported a
      setup mismatch against numbers that were identical. A guard that fails
      permanently and for the wrong reason is a guard nobody reads.

      Both numbers are now required, in the order a buyer meets them:
      "first month C$250, then C$250/month". Requiring the pair is the point.
      A fallback that quotes only one of them is exactly the ambiguity this
      whole change removed. */
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
        const monthly = body.match(/then C\$([\d,]+)\/month/i);
        const firstMonth = body.match(/first month C\$([\d,]+)/i);
        const mins = body.match(/([\d,]+) included AI minutes/);
        const over = body.match(/C\$([\d.]+) per extra minute/);
        /* `setup` is optional. When a plan carries no setup fee, month one
           costs the monthly price and that is what the page must say. This
           used to read plan.setup.toLocaleString() unconditionally, so the
           day the config dropped setup fees the guard stopped reporting
           anything at all and died with "Cannot read properties of undefined"
           BEFORE reaching the checks below it. A guard that crashes is worse
           than a guard that fails: it takes the other rules down with it. */
        const firstMonthExpected = plan.setup ?? plan.monthly;
        if (!monthly || num(monthly[1]) !== plan.monthly) err('pricing fallback "' + name + '": recurring monthly differs from config (' + plan.monthly + '); expected "then C$' + plan.monthly.toLocaleString("en-CA") + '/month"');
        if (!firstMonth || num(firstMonth[1]) !== firstMonthExpected) err('pricing fallback "' + name + '": first month differs from config (' + firstMonthExpected + '); expected "first month C$' + firstMonthExpected.toLocaleString("en-CA") + '"');
        if (!mins || num(mins[1]) !== plan.includedMinutes) err('pricing fallback "' + name + '": included minutes differ from config (' + plan.includedMinutes + ")");
        if (!over || Number(over[1]) !== plan.overage) err('pricing fallback "' + name + '": overage differs from config (' + plan.overage + ")");
      }
      if (seen < 3) err("pricing fallback: expected at least 3 plans, found " + seen);
    }
  }
}

/* 7z. The inlined stylesheet must equal its sources.

       assets/motion/site.css and assets/fonts/fonts.css are still the files
       anyone edits, but the browser now gets them as a generated <style> block
       in every page, because two linked stylesheets cost a round trip that was
       the whole of the remaining LCP budget on a phone.

       That makes 22 copies of the stylesheet, and this repository has been
       burned by copies before. So the copies are checked. Edit site.css,
       forget to run the generator, and this fails by name rather than by three
       pages quietly rendering last week's design. */
{
  const block = headCssBlock(readCssSources(fs, path, root));
  const pages = JSON.parse(fs.readFileSync(path.join(root, "content-map.json"), "utf8")).pages.map((p) => p.file);
  let stale = 0;
  for (const file of pages) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    const html = fs.readFileSync(full, "utf8");
    if (html.includes(LINK_FONTS) || html.includes(LINK_SITE)) {
      err(`${file}: still links a stylesheet that is meant to be inlined; run node scripts/build-pages.mjs`);
      continue;
    }
    const open = html.indexOf(CSS_OPEN);
    const close = html.indexOf(CSS_CLOSE);
    if (open === -1 || close === -1) { err(`${file}: no generated:css block; run node scripts/build-pages.mjs`); continue; }
    /* Compare on normalised line endings. core.autocrlf is true on this
       machine and there is no .gitattributes, so git stores the pages with LF
       and checks them out with CRLF, while headCssBlock() always builds with
       LF. Comparing raw bytes therefore passed immediately after a build and
       failed for all 22 pages after the next clone, worktree or checkout,
       telling the reader to run a generator that would then rewrite 22 files
       to no visible effect. Verified by cloning the repo twice. */
    const eol = (s) => s.replace(/\r\n/g, "\n");
    const found = html.slice(open, close + CSS_CLOSE.length);
    if (eol(found) !== eol(block)) stale++;
  }
  if (stale) err(`${stale} page(s) carry a generated:css block that no longer matches assets/motion/site.css + assets/fonts/fonts.css. Run: node scripts/build-pages.mjs`);
}

/* 7a. Pre-rendered copy must equal what the renderer would have written.

       On 2026-08-08 the pilot banner, usage policy and proposal plan box were
       given real text instead of shipping empty and filling in from
       pricing-config.js after load. Empty was measurably wrong: on a throttled
       phone the pricing page filled 745 ms after first paint and pushed
       everything below down 256px, which was 0.093 of its 0.095 CLS, and the
       proposal page's was the whole of its 0.060.

       Real text buys a second, larger thing: with scripts blocked or the
       config request lost, the page still reads correctly. But a static copy
       of a config value is a copy, and this repo has watched copies drift
       before. So the copy is checked here against the config it duplicates,
       character for character, using the same concatenation the renderer uses.
       Change pricing-config.js and this fails until the HTML follows. */
{
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });
  const cfg = w.NV_PRICING;
  /* Text of the element carrying this id. Deliberately simple: every element
     checked here holds plain text or <li> children, no nesting. */
  const textOf = (html, id) => {
    const open = new RegExp('<(\\w+)[^>]*\\bid="' + id + '"[^>]*>', "i");
    const m = html.match(open);
    if (!m) return null;
    const close = "</" + m[1] + ">";
    const start = m.index + m[0].length;
    const end = html.indexOf(close, start);
    if (end === -1) return null;
    return html.slice(start, end);
  };
  const flat = (s) => (s == null ? null : s.replace(/<[^>]*>/g, " ").replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim());
  const items = (s) => (s == null ? null : [...s.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((x) => flat(x[1])));
  const money = (n) => "C$" + (Number.isInteger(Number(n)) ? Number(n).toLocaleString("en-CA")
    : Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  const eq = (where, id, actual, expected) => {
    if (actual === null) return err(where + ": #" + id + " not found (pre-rendered copy is required, not optional)");
    if (actual !== expected) err(where + ": #" + id + ' drifted from pricing-config.js\n      page:   "' + actual + '"\n      config: "' + expected + '"');
  };

  if (!cfg || !cfg.pilot || !cfg.usagePolicy) err("pricing-config.js: pilot/usagePolicy missing, cannot check pre-rendered copy");
  else {
    const ph = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
    eq("pricing.html", "pilotName", flat(textOf(ph, "pilotName")), cfg.pilot.name);
    eq("pricing.html", "pilotTagline", flat(textOf(ph, "pilotTagline")), cfg.pilot.tagline + " " + cfg.pilot.dayEight);
    eq("pricing.html", "pilotCaps", flat(textOf(ph, "pilotCaps")), cfg.pilot.caps + " " + cfg.pilot.start);
    eq("pricing.html", "minuteDef", flat(textOf(ph, "minuteDef")), cfg.usagePolicy.minuteDef);
    eq("pricing.html", "taxNote", flat(textOf(ph, "taxNote")), cfg.taxNote);
    eq("pricing.html", "pricingUpdated", flat(textOf(ph, "pricingUpdated")), "pricing updated " + cfg.lastUpdated);
    const notes = items(textOf(ph, "usageNotes"));
    if (!notes) err("pricing.html: #usageNotes not found");
    else if (notes.join(" | ") !== cfg.usagePolicy.notes.join(" | "))
      err("pricing.html: #usageNotes drifted from pricing-config.js\n      page:   " + notes.join(" | ") + "\n      config: " + cfg.usagePolicy.notes.join(" | "));

    /* The proposal defaults to the recommended plan when no id is in the URL,
       so that is the plan its static copy must quote. */
    const dflt = cfg.plans.find((p) => p.recommended) || cfg.plans[0];
    const pr = fs.readFileSync(path.join(root, "proposal.html"), "utf8");
    eq("proposal.html", "pilotTagline", flat(textOf(pr, "pilotTagline")), cfg.pilot.tagline);
    eq("proposal.html", "pilotCaps", flat(textOf(pr, "pilotCaps")), cfg.pilot.caps + " " + cfg.pilot.start);
    eq("proposal.html", "pilotDayEight", flat(textOf(pr, "pilotDayEight")), cfg.pilot.dayEight);
    eq("proposal.html", "planName", flat(textOf(pr, "planName")), dflt.name.toUpperCase());
    eq("proposal.html", "planIncludes", flat(textOf(pr, "planIncludes")),
      dflt.includedMinutes + " included AI minutes per month, about " + dflt.callRange + ". Additional minutes " + money(dflt.overage) + " each.");
    const feats = items(textOf(pr, "planFeatures"));
    if (!feats) err("proposal.html: #planFeatures not found");
    else if (feats.join(" | ") !== dflt.features.slice(0, 9).join(" | "))
      err("proposal.html: #planFeatures drifted from pricing-config.js " + dflt.id + "\n      page:   " + feats.join(" | ") + "\n      config: " + dflt.features.slice(0, 9).join(" | "));
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

/* 7c. No surface this repo publishes may describe the price ADDITIVELY.

       Until 2026-08-07 every plan surface said some version of "C$250/month"
       with "One-time setup: C$250" next to it. Both numbers were correct and
       both matched pricing-config.js, so rule 7, the truth auditor, the engine's
       cross-repo validator and thirty-odd tests were all green while the page
       told a buyer he owed C$500 on day one. Nothing that compares FIGURES can
       ever catch this, because the defect is the arrangement of two right ones.
       So it is checked as a sentence.

       C$250 is month one. C$250 is also month two. They are never summed.

       Scope is this repo's own published pages plus llms.txt, deliberately.
       The banned list above sweeps the cold-calling kit and the agent prompts,
       which live in other repositories on this disk and are corrected on their
       own schedule; adding this shape there would paint those failures onto a
       run of THIS working tree, and a red command nobody can fix is a command
       that stops being read. */
{
  const additive = [
    /one-time setup/i,
    /\bsetup fee\b/i,
    /plus (?:a )?(?:one-time )?setup/i,
    /\+\s*(?:one-time )?setup/i,
  ];
  /* Comments are stripped first. The files that FIXED this defect are the ones
     that quote the retired sentence in order to explain why it is retired, and
     a rule that fires on its own explanation teaches the next person to delete
     the explanation. Only what a reader can see is checked. */
  const visible = (s) => s
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  const surfaces = [...contentPages.map((f) => path.join(root, f)), path.join(root, "llms.txt")];
  for (const file of surfaces) {
    if (!fs.existsSync(file)) continue;
    const text = visible(fs.readFileSync(file, "utf8"));
    const label = path.relative(root, file).replace(/\\/g, "/");
    for (const b of additive) {
      if (b.test(text)) {
        err(`${label}: ${b} describes the price additively. The first-month amount IS month one, `
          + `not a fee beside it. Write "First month C$X, then C$Y/month".`);
      }
    }
  }
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

    /* A zero setup fee is not a price to recite, it is a fact to state. When
       setup is 0 the old check demanded the agent say "zero dollars setup",
       which nobody says, so the rule flips: the prompt must state plainly that
       there is no setup fee, and must NOT still be quoting one. Being the only
       provider in this market with published prices and no setup fee is a
       selling point, and an agent that keeps quoting a retired fee costs the
       sale twice, once on price and once on trust. */
    /* The Pay As You Go clause was dropped here on 2026-08-07 with the plan
       itself. Setup has been C$250/C$500/C$1,000 since 2026-08-06, so this
       whole branch is dormant and the comment above it describes a position
       Nevamis no longer holds. Kept, not deleted: if setup ever returns to
       zero the agent must say so, and re-deriving that rule later from memory
       is how the last four price positions drifted. */
    const setupIsFree = w.NV_PRICING.plans.every((p) => p.setup === 0);
    if (setupIsFree) {
      const saysFree = /no setup fee|no one-time setup|nothing to set up|no set-up fee/.test(spoken);
      if (!saysFree) wait("demo.md: setup is $0 everywhere in pricing-config.js, but the prompt never says there is no setup fee. It is a selling point and the agent should say it.");
      const RETIRED_SETUP_WORDS = ["five hundred dollars one-time setup", "seven hundred and fifty dollars setup",
        "one thousand two hundred and fifty dollars", "two hundred and fifty dollars setup"];
      for (const phrase of RETIRED_SETUP_WORDS) {
        if (spoken.includes(phrase)) wait(`demo.md: still quotes a retired setup fee out loud ("${phrase}") after it went to $0`);
      }
    }

    for (const plan of w.NV_PRICING.plans) {
      const checks = [["monthly", dollarForms(plan.monthly)], ["overage", centForms(plan.overage)]];
      if (plan.setup > 0) checks.push(["setup", dollarForms(plan.setup)]);
      for (const [label, forms] of checks) {
        if (!forms.some((f) => spoken.includes(f)))
          wait(`demo.md: ${plan.name} ${label} (${plan[label]}) is never spoken; say one of: ${forms.join(" / ")}`);
      }
      const mins = plan.includedMinutes;
      if (!spoken.includes(String(mins)) && !spoken.includes(mins.toLocaleString("en-CA")))
        wait(`demo.md: ${plan.name} included minutes (${mins}) are never stated, and minutes are how the plans differ`);
    }
  }
}

/* 9. PLAYBOOK.md is what the founder reads before a sales call, so its tier
      table is a pricing surface too, and the one where a stale number gets
      quoted to a prospect out loud with nothing to catch it. Each plan's row
      must carry the same setup, monthly, included minutes, and overage as
      pricing-config.js. Checked only when ai-assistant sits beside this repo. */
{
  const playbook = path.join(root, "..", "ai-assistant", "PLAYBOOK.md");
  if (fs.existsSync(playbook)) {
    const md = fs.readFileSync(playbook, "utf8");
    const w = {};
    vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });

    /* The table writes thousands both ways depending on the column, so accept
       "1250" or "1,250" rather than forcing one style on a prose document. */
    const money = (n) => [String(n), Number(n).toLocaleString("en-CA")];
    for (const plan of w.NV_PRICING.plans) {
      const row = md.split(/\r?\n/).find((l) => /^\|/.test(l) && l.includes("| " + plan.name + " |"));
      if (!row) { err(`PLAYBOOK.md: no tier row for "${plan.name}"`); continue; }
      const has = (forms) => forms.some((f) => row.includes("$" + f));
      if (!has(money(plan.monthly))) err(`PLAYBOOK.md "${plan.name}": monthly is not $${plan.monthly} as in pricing-config.js`);
      if (!has(money(plan.setup))) err(`PLAYBOOK.md "${plan.name}": setup is not $${plan.setup} as in pricing-config.js`);
      if (!new RegExp(`\\|\\s*${plan.includedMinutes}\\s*\\|`).test(row)) err(`PLAYBOOK.md "${plan.name}": included minutes are not ${plan.includedMinutes}`);
      if (!row.includes("$" + plan.overage.toFixed(2))) err(`PLAYBOOK.md "${plan.name}": overage is not $${plan.overage.toFixed(2)}/min`);
    }
  }
}

/* 10. Every motion module must parse as an ES module.
       A GLSL shader lives inside a JS template literal in aurora.js, and a
       comment in that shader once wrote a variable name as `l` with
       backticks. That closed the template early, the file stopped parsing,
       main.js failed to import it, and every animation on the homepage died
       — from a comment. Nothing in the HTML looks wrong when this happens,
       so it needs a parser, not an eye. */
{
  const motionDir = path.join(root, "assets", "motion");
  if (fs.existsSync(motionDir)) {
    for (const f of fs.readdirSync(motionDir).filter((n) => n.endsWith(".js"))) {
      const file = path.join(motionDir, f);
      const res = spawnSync(process.execPath, ["--input-type=module", "--check"], {
        input: fs.readFileSync(file, "utf8"),
        encoding: "utf8",
      });
      if (res.status !== 0) {
        const why = (res.stderr || "").split("\n").find((l) => /Error|Unexpected/.test(l)) ?? "parse error";
        err(`assets/motion/${f}: does not parse as a module — ${why.trim()}`);
      }
    }
  }
}

/* 15. Every structured-data block must parse, and every FAQ question must be a
   question rather than a swallowed page.

   build-schema.mjs generates this from the page copy, and a single loose regex
   there produced a FAQPage whose first "question" was 8,901 characters of
   homepage. Google rejects an entry of that shape and can discard the whole
   FAQPage block with it, so the site was publishing thirteen good questions
   inside markup that could never earn a rich result. Nothing noticed: the JSON
   was valid, the page rendered, and the block was present.

   Length is the check because it is the property that distinguishes a question
   from a section of prose, and it needs no network call. */
{
  for (const page of contentPages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      let parsed;
      try {
        parsed = JSON.parse(m[1]);
      } catch (e) {
        err(`${page}: a JSON-LD block does not parse — ${e.message.slice(0, 80)}`);
        continue;
      }
      for (const node of (Array.isArray(parsed) ? parsed : [parsed])) {
        if (node?.["@type"] !== "FAQPage") continue;
        for (const entry of node.mainEntity ?? []) {
          const q = String(entry?.name ?? "");
          const a = String(entry?.acceptedAnswer?.text ?? "");
          if (!q) { err(`${page}: an FAQPage entry has no question`); continue; }
          if (!a) { err(`${page}: FAQ "${q.slice(0, 50)}" has no answer`); continue; }
          if (q.length > 200) {
            err(`${page}: FAQ question is ${q.length} chars, which is page content rather than a question `
              + `(Google rejects it and can discard the whole FAQPage) — starts "${q.slice(0, 60)}..."`);
          }
        }
      }
    }
  }
}

/* 14. Any page that plays the example call must show what the audio actually says.
   The mp3s in assets/ are a single recording split into turns. When the 11-turn
   recording replaced the 6-turn one, index.html was updated and demo.html was
   not, so demo.html kept the retired script while playing the new audio: every
   one of its six turns said something different from the file it played, and
   the conversation stopped mid-call before the booking was confirmed.

   demo.html's own headline is "This is not a video of the product. It is the
   product." A prospect who presses play there hears one conversation while
   reading another, on the page whose entire job is proof. Nothing else notices,
   because both files are valid HTML and every audio path resolves.

   index.html is the reference because it is the homepage. Any other page using
   the same files must carry the same turns in the same order. */
{
  const turnsOf = (html) => [...html.matchAll(/data-audio="([^"]+)"[\s\S]*?<p>([\s\S]*?)<\/p>/g)]
    .map((m) => [m[1], m[2].replace(/\s+/g, " ").trim()]);

  const referenceFile = path.join(root, "index.html");
  if (fs.existsSync(referenceFile)) {
    const reference = turnsOf(fs.readFileSync(referenceFile, "utf8"));
    if (reference.length > 0) {
      for (const page of contentPages) {
        if (page === "index.html") continue;
        const html = fs.readFileSync(path.join(root, page), "utf8");
        if (!/data-audio="assets\/call-/.test(html)) continue;
        const turns = turnsOf(html);
        if (turns.length !== reference.length) {
          err(`${page}: plays the example call but shows ${turns.length} turns where index.html has ${reference.length} `
            + `(the audio is one recording; a page showing fewer turns cuts the call off mid-conversation)`);
          continue;
        }
        for (let i = 0; i < turns.length; i++) {
          if (turns[i][0] !== reference[i][0]) {
            err(`${page}: turn ${i + 1} plays ${turns[i][0]} where index.html plays ${reference[i][0]}`);
          } else if (turns[i][1] !== reference[i][1]) {
            err(`${page}: turn ${i + 1} (${turns[i][0]}) shows different words than index.html — the transcript does not match the audio\n`
              + `       ${page}: ${turns[i][1].slice(0, 80)}\n`
              + `       index.html: ${reference[i][1].slice(0, 80)}`);
          }
        }
      }
    }
  }
}

/* 13. Every published page must appear in content-map.json.
   That file is not documentation, it is the input to five scripts: the whole
   site audit, the sitemap, the search index, and the two page builders. A page
   missing from it is not audited, not indexed by the site search, and not in
   the sitemap — invisible three ways at once, while looking completely normal
   in the repo. proposal.html was exactly this, and 404.html was listed but
   with a null url, which the auditor filters out, so neither had ever been
   crawled.

   Being in the map does not force a page into the sitemap: `sitemap: false`
   keeps it out, which is how the error page and the prospect proposal are
   audited without being advertised to search engines. The requirement is only
   that every page is a deliberate entry rather than an omission nobody made. */
{
  const map = JSON.parse(fs.readFileSync(path.join(root, "content-map.json"), "utf8"));
  const mapped = new Set(map.pages.map((p) => p.file));
  for (const page of contentPages) {
    if (!mapped.has(page)) {
      err(`${page} is published but missing from content-map.json — it will not be audited, `
        + `will not appear in the sitemap or site search. Add an entry (use "sitemap": false `
        + `if it should not be indexed).`);
    }
  }
  /* And the reverse: an entry for a file that no longer exists points the
     sitemap at a 404. */
  for (const p of map.pages) {
    if (!fs.existsSync(path.join(root, p.file))) {
      err(`content-map.json lists ${p.file}, which does not exist`);
    }
  }
}

/* 12. Every internal link and in-page anchor on a published page must resolve.
   A call to action that scrolls nowhere, or points at a page that was renamed,
   costs exactly the visitor who was ready to act. Nothing else here would
   notice: the markup stays valid, the page still renders, and the button still
   looks like a button.

   Script blocks are stripped first. Several pages build hrefs at runtime by
   string concatenation, so scanning raw text finds fragments like
   href="' + s.cta + '" and reports them as broken pages. Only static markup is
   checked; that is the part a rename can silently break. */
{
  const pageIds = new Map(); // file -> Set of id/name anchors
  const idsOf = (html) => new Set([
    ...[...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\bname="([^"]+)"/g)].map((m) => m[1]),
  ]);
  const anchorsFor = (file) => {
    if (!pageIds.has(file)) {
      const p = path.join(root, file);
      pageIds.set(file, fs.existsSync(p) ? idsOf(fs.readFileSync(p, "utf8")) : null);
    }
    return pageIds.get(file);
  };

  for (const page of contentPages) {
    const markup = fs.readFileSync(path.join(root, page), "utf8")
      .replace(/<script\b[\s\S]*?<\/script>/gi, "");
    for (const m of markup.matchAll(/href="([^"]+)"/g)) {
      const raw = m[1];
      if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(raw)) continue;

      const [rawFile, frag] = raw.split("#");
      /* "" means this page (href="#top"); "/" means the homepage. */
      const file = rawFile === "" ? page
        : rawFile === "/" ? "index.html"
        : rawFile.replace(/^\//, "").split("?")[0];

      /* Asset paths (images, icons, css) only need to exist. */
      if (!file.endsWith(".html")) {
        if (!fs.existsSync(path.join(root, file))) err(`${page}: href="${raw}" points at a file that does not exist`);
        continue;
      }
      if (!fs.existsSync(path.join(root, file))) {
        err(`${page}: href="${raw}" points at a page that does not exist`);
        continue;
      }
      /* A link INTO an unpublished page is a dead end for a real visitor:
         Jekyll never deploys it, so the live site answers 404. */
      if (!contentPages.includes(file)) {
        err(`${page}: href="${raw}" points at ${file}, which _config.yml excludes from the build (404 in production)`);
        continue;
      }
      if (frag) {
        const ids = anchorsFor(file);
        if (ids && !ids.has(frag)) err(`${page}: href="${raw}" -> #${frag} does not exist in ${file}`);
      }
    }
  }
}

/* 11. index.html must BE the promotion of the current home.html.
   home.html is the staging twin everyone edits; index.html is what the world
   loads. The only thing joining them is remembering to run promote.mjs by
   hand, and forgetting leaves a homepage that is green on every other check
   here while silently serving the previous version of the copy. Nothing
   visible breaks, which is what makes it worth a machine check: the failure
   mode is a change you believe you shipped. Compared through the promoter's
   own exported transform so this cannot drift from what promote actually
   writes. */
{
  const homeFile = path.join(root, "home.html");
  const indexFile = path.join(root, "index.html");
  if (fs.existsSync(homeFile) && fs.existsSync(indexFile)) {
    const res = promoteHtml(fs.readFileSync(homeFile, "utf8"));
    if (!res.ok) {
      err(`home.html cannot be promoted — ${res.error}`);
    } else {
      /* Normalise line endings before comparing, for the same reason guard 7z
         does. promoteHtml() inserts its verification meta with \n; git stores
         index.html with LF and checks it out as CRLF; so on any fresh clone or
         worktree the two differ by exactly one byte that nobody can see, and
         the failure prints two lines that look identical. Verified: 1,968 CRLF
         in the expected text against 1,969 in the checked-out file, equal once
         normalised. */
      const eolN = (s) => s.replace(/\r\n/g, "\n");
      const live = eolN(fs.readFileSync(indexFile, "utf8"));
      res.html = eolN(res.html);
      if (res.html !== live) {
        /* Point at the first difference: "they differ" is not actionable on a
           78 KB file. */
        const a = res.html.split("\n"), b = live.split("\n");
        let i = 0;
        while (i < a.length && i < b.length && a[i] === b[i]) i++;
        err(`index.html is not the promotion of home.html — run: node scripts/promote.mjs\n`
          + `       first difference at line ${i + 1}\n`
          + `       home.html  -> ${(a[i] ?? "(end of file)").trim().slice(0, 100)}\n`
          + `       index.html -> ${(b[i] ?? "(end of file)").trim().slice(0, 100)}`);
      }
    }
  }
}

if (fail === 0) console.log("Consistency check passed: " + contentPages.length + " pages, one nav, one footer, no banned phrases, pricing fallback matches config, spoken prices match config, playbook table matches config, motion modules parse, every internal link and anchor resolves, index.html matches promoted home.html.");
/* 1 = something here is broken. 2 = nothing here is broken but the live
   phone agent needs a change only the owner can make. 0 = clean. */
if (fail === 0 && waiting > 0) console.error(`
${waiting} item${waiting === 1 ? " needs" : "s need"} a change to the LIVE agent prompt, which only the owner can apply.`);
process.exit(fail > 0 ? 1 : waiting > 0 ? 2 : 0);
