#!/usr/bin/env node
/* Consistency guard for the no-build static site.
   Run: node scripts/check-consistency.js   (exit 1 on any failure)
   Rules:
   1. Every content page shares one identical main-nav (ignoring aria-current).
   2. Every full-footer page shares one identical Site column.
   3. Legal pages (privacy, terms) and pricing use the base-row footer; 404 has none. Documented exceptions.
   4. Banned commercial phrases never appear in public HTML.
   5. No published surface OFFERS a retired commercial term (guard 7d). This
      replaced a canonical-naming rule for the 7-day pilot on 2026-08-09: with
      the pilot retired there is no correct way to name it, only a wrong one,
      so the rule went from "spell the offer this way" to "do not make it".
   6. No em dashes in page copy. Multiplication signs and arrows are allowed. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promoteHtml } from "./promote.mjs";
import { headCssBlock, readCssSources, CSS_OPEN, CSS_CLOSE, LINK_FONTS, LINK_SITE } from "./lib/inline-css.mjs";
import { applySelfCta } from "./lib/nav-cta.mjs";
/* DENIAL / ADDITIVE / RETIRED_OFFERS and the claim classifier moved to
   ./lib/claims.mjs on 2026-08-10, when a laundering defect in the classifier
   was fixed: a denial in ONE CLAUSE used to excuse every claim in the whole
   sentence, so "The C$150 pilot is retired, and Pro is C$850/month with 1,200
   minutes." passed on pricing.html with exit 0 and no output. The rule needed
   its own fixture table, and fixtures cannot import it from this file without
   running every filesystem guard below as a side effect. See that file for the
   scope rule; see scripts/check-claims-classifier.mjs for the fixtures. */
import { DENIAL, ADDITIVE, RETIRED_OFFERS, statesBanned, offendingClause } from "./lib/claims.mjs";
import { stripHtmlComments, stripJsComments, jsStringLiterals, renderedProse, clauses } from "./lib/rendered-text.mjs";
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

/* Walked rather than listed, so a script added to the calling kit tomorrow is
   covered without anyone remembering to add it here. Every truth gap found on
   this site so far has been a page missing from a hand-maintained array.

   HOISTED TO MODULE SCOPE 2026-08-10, and that move is half the fix for a real
   defect. This function already knew how to read config/elevenlabs/ recursively
   — guard 6b has swept it for banned phrases since it was written — but it was a
   local inside 6b's block, so no other rule could reach the directory. The
   result was a folder that was checked for one thing and unchecked for
   everything else, which reads as "covered" in a summary and is not. */
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
  /* The canonical-pilot-naming rule stood here until 2026-08-09. It required a
     page that said "free 7-day pilot" to also say "7-day live pilot", which
     was a rule about SPELLING an offer. The offer is retired, so spelling it
     correctly is no longer the goal and a page that passed this rule would now
     be a page selling something that does not exist. Guard 7d replaces it and
     is strictly stronger: it fails on the offer being made at all, under any
     name, while still letting a page deny it in words. */
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

  /* walk() is at module scope; see the note beside it for why it moved. */

  /* Judged per CLAUSE by the shared statesBanned(), and only where the clause
     is not itself FORBIDDING the phrase it contains. It was per SENTENCE until
     2026-08-10, which let one retirement clause excuse every other claim
     sharing its sentence. See scripts/lib/claims.mjs for the scope rule. */
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
      monthly, included-minute, and overage numbers. (The fallback may list
      fewer plans than the config; it must never disagree with it.)

      THE REQUIRED SHAPE IS ONE NUMBER, AND THIS RULE IS INVERTED FROM WHAT IT
      WAS. Read this before "fixing" a failure here.

      Until 2026-08-07 the rule wanted "C$250/month" beside "C$250 one-time
      setup", which is the wording that made a Core customer believe he owed
      C$500 on day one. It was then rewritten to REQUIRE the pair
      "first month C$250, then C$250/month" and to fail if either was missing,
      on the reasoning that quoting one of two numbers is worse than quoting
      both.

      That reasoning was right about a two-number offer and the offer is no
      longer two numbers. On 2026-08-09 the price became one figure charged the
      day they subscribe and every month after, so requiring the pair turned
      this guard into a contract for the retired model: it would have failed
      the correct page and passed a reverted one, which is the worst direction
      for a guard to point.

      So it now requires the single-price sentence, "Core — C$250/month", AND
      fails on the two-number framing reappearing in the fallback. Both halves
      matter: the first keeps the number honest, the second keeps the SHAPE
      honest, and nothing that only compares figures can see the shape. */
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
        const monthly = body.match(/C\$([\d,]+)\/month\b/i);
        const mins = body.match(/([\d,]+) included AI minutes/);
        const over = body.match(/C\$([\d.]+) per extra minute/);
        /* The retired two-number framing: an ambiguous pair with no stated
           rule joining it. The CURRENT model is also two numbers, and that is
           not a contradiction: the approved shape states the rule in words —
           "C$1,000 Launch & Implementation to start, then C$750 a month" —
           where "first month C$X" and "then C$Y/month" never did. */
        const twoNumber = /first month\s+C\$|then\s+C\$[\d,]+\s*\/\s*month/i;
        if (twoNumber.test(body)) err('pricing fallback "' + name + '": uses the retired first-month/then-per-month framing. '
          + 'State the approved shape instead: "C$' + plan.launch.toLocaleString("en-CA") + ' Launch & Implementation to start, then C$' + plan.monthly.toLocaleString("en-CA") + ' a month".');
        /* INVERTED TWICE, most recently 2026-08-15 (evening). The morning
           model required NO figure ("priced after your scan"); the evening
           directive published the OPERATE/GROW/PARTNERSHIP ladder with a
           one-time Launch & Implementation fee, so under publishedPricing the
           fallback must state BOTH halves of the offer: the monthly AND the
           launch figure. A crawler that reads only the fallback must see the
           whole price, because half a price is the August defect again. */
        if (cfg.publishedPricing) {
          if (!monthly || num(monthly[1]) !== plan.monthly) err('pricing fallback "' + name + '": monthly price differs from config (' + plan.monthly + '); expected "C$' + plan.monthly.toLocaleString("en-CA") + '/month"');
          const launch = body.match(/C\$([\d,]+)\s+Launch\s+(?:&|&amp;|and)\s+Implementation/i);
          if (!launch || num(launch[1]) !== plan.launch) err('pricing fallback "' + name + '": does not state the one-time Launch & Implementation fee from config ('
            + plan.launch + '); expected "C$' + plan.launch.toLocaleString("en-CA") + ' Launch &amp; Implementation to start".');
        } else {
          if (monthly) err('pricing fallback "' + name + '": still states C$' + monthly[1] + '/month. Pricing is unpublished; the fallback must carry no figure.');
          if (!/quoted per client|priced after your scan/i.test(body)) err('pricing fallback "' + name + '": does not say how the price is arrived at, so a reader with no JavaScript is told nothing about how it is priced.');
        }
        if (!mins || num(mins[1]) !== plan.includedMinutes) err('pricing fallback "' + name + '": included minutes differ from config (' + plan.includedMinutes + ")");
        if (!over || Number(over[1]) !== plan.overage) err('pricing fallback "' + name + '": overage differs from config (' + plan.overage + ")");
      }
      if (seen < 3) err("pricing fallback: expected at least 3 plans, found " + seen);
    }
  }
}

/* 16. THE TRANSFER PROMISE, AND EM DASHES IN THE STRINGS JAVASCRIPT RENDERS.

      llms.txt has said "there is no live transfer" since it was written. Ten
      rendered surfaces sold one anyway, and the two facts lived side by side
      for weeks because every guard in this file compares FIGURES. That is the
      standing lesson here: a retired price gets caught, a retired PROMISE does
      not, because nothing was watching the words. On 2026-08-27 a sweep
      removed the last nine, including two FAQ entries that contradicted each
      other inside the same FAQPage structured data. This is what stops the
      eleventh.

      WHAT THE AGENT ACTUALLY DOES on an urgent call: it captures the details
      and alerts the business. It does not put a caller through to a person.
      Emergency handling is the highest-stakes claim on this site, so the
      wording is guarded rather than trusted.

      SCOPE IS "WHAT A VISITOR READS", which is why it is not a file-wide
      grep. HTML minus its comments, plus the string literals in the JS that
      builds the DOM, minus THEIR comments (aurora.js embeds a shader and
      cursor.js a stylesheet, both with comments of their own). Bare
      identifier strings are skipped: motion.js legitimately carries
      `outcome: "transfer"` as an internal key, and a guard that fails on its
      own subject matter gets deleted. See scripts/lib/rendered-text.mjs.

      A DENIAL IS ALLOWED, AND THE ALLOWLIST IS A CONSTRUCTION, NOT A FILE
      LIST. The homepage FAQ has to be able to say "Live transfer to a person
      is not part of the service" -- that sentence is the correction, and a
      rule that fails it would fail the one place telling the truth. It is
      excused because of how it is BUILT (a negation attached to the claim in
      the same clause), so the next honest sentence somewhere else is excused
      too, and no page is exempt by name. Same reasoning as guard 7d and
      scripts/lib/claims.mjs.

      Also here, sharing the same machinery: em dashes in rendered JS strings.
      The per-page em-dash rule reads static HTML, so copy injected by
      site.js was invisible to it, and site.js was shipping one. */
{
  /* WHO a caller could be handed to. One vocabulary, shared by the patterns
     below, so a new way of naming the person on the other end is added once
     rather than in each rule that cares. */
  const PERSON = "(?:on-call\\s+(?:tech(?:nician)?|number|crew|team|person|line)"
    + "|person\\s+on\\s+call|technician|dispatcher|team\\s+member"
    + "|live\\s+(?:person|agent|operator)|human"
    + "|your\\s+(?:cell|mobile|phone|team|crew)|a\\s+person|the\\s+person)";
  const TRANSFER_PROMISE = [
    /\btransfer(?:s|red|ring)?\b/i,
    /\bpatch(?:es|ing)?\s+(?:you|them|the caller)\s+through\b/i,
    /\bput(?:s|ting)?\s+(?:you|them|the caller)\s+through\b/i,
    /\bconnect(?:s|ing)?\s+(?:you|them|the caller)\s+(?:to|with)\b/i,
    /\b(?:stay|hold)\s+on\s+the\s+line\b/i,
    /* ESCALATION WITHOUT THE WORD "TRANSFER". coming-soon.html said "the call
       escalates to the on-call tech" and no pattern above saw it: it promises
       the same thing in vocabulary the rule did not know. The distinction that
       makes this safe to guard is the DESTINATION, not the verb. Escalating is
       honest and this site says so nineteen times ("Urgent calls escalate",
       "escalate by your rules", "Active loss is escalated, not queued") -- none
       of which names a person to escalate TO. Requiring a person after "to" is
       what separates the promise from the process, and it fires on nothing in
       the current tree. */
    new RegExp("\\bescalat\\w*\\s+(?:straight\\s+)?to\\s+(?:the|your|a)?\\s*" + PERSON, "i"),
  ];
  /* Constructions that WITHDRAW the claim in the clause that makes it. The
     site's own correction is the first entry's job; the rest are the shapes
     an honest sentence about this takes. Deliberately narrow: "not" alone
     would excuse "we will not fail to transfer you". */
  const TRANSFER_DENIAL = [
    /\bis not part of the (?:service|product)\b/i,
    /\bthere is no\b/i, /\bthere are no\b/i,
    /\bnot built\b/i, /\bnot available\b/i, /\bnot offered\b/i,
    /\bno live transfer\b/i,
    /\b(?:does|do|will|can)\s+not\s+(?:transfer|connect|put|patch)\b/i,
    /\bnever\s+(?:transfer|connect|put|patch)/i,
    /\bwithout\s+(?:a\s+)?transfer\b/i,
    /\bretired\b/i, /\bno longer\b/i,
  ];
  const promises = (c) => TRANSFER_PROMISE.some((r) => r.test(c));
  const denies = (c) => TRANSFER_DENIAL.some((r) => r.test(c));

  /* pricing-config.js and roadmap-config.js are page surfaces, not data.
     Their string values are rendered into pricing.html and coming-soon.html
     by JavaScript at runtime, so the per-page HTML rules never saw them --
     which is exactly how nine em dashes reached visitors and had to be swept
     by hand on 2026-08-27. Guarded here so the sweep does not have to happen
     twice. Their COMMENTS are excluded like every other file's: the header of
     pricing-config.js is full of em dashes and is not copy. */
  const jsSurfaces = ["site.js", "motion.js", "pricing-config.js", "roadmap-config.js"];
  for (const d of ["assets/motion"]) {
    const abs = path.join(root, d);
    if (fs.existsSync(abs)) for (const f of fs.readdirSync(abs)) if (f.endsWith(".js")) jsSurfaces.push(d + "/" + f);
  }

  /* One list of {label, clause} for both rules, so the JS side can never be
     added to one and forgotten by the other. */
  const rendered = [];
  for (const p of contentPages) {
    const html = stripHtmlComments(fs.readFileSync(path.join(root, p), "utf8"));
    for (const c of clauses(html)) rendered.push({ label: p, clause: c, js: false });
  }
  for (const f of jsSurfaces) {
    const abs = path.join(root, f);
    if (!fs.existsSync(abs)) continue;
    for (const lit of jsStringLiterals(stripJsComments(fs.readFileSync(abs, "utf8")))) {
      const prose = renderedProse(lit);
      if (!prose) continue;
      for (const c of clauses(prose)) rendered.push({ label: f, clause: c, js: true });
    }
  }

  const seen = new Set();
  for (const { label, clause, js } of rendered) {
    if (promises(clause) && !denies(clause)) {
      const key = label + "::" + clause;
      if (seen.has(key)) continue;
      seen.add(key);
      err(label + ": promises to transfer or connect a caller to a person.\n      clause: \"" + clause.slice(0, 160) + "\"\n      "
        + "The agent does not do this. On an urgent call it captures the details and alerts "
        + "the business; llms.txt has said \"there is no live transfer\" since it was written. "
        + "Say what happens instead. A clause that DENIES the transfer is allowed, which is how "
        + "the homepage FAQ can carry \"Live transfer to a person is not part of the service\"; "
        + "extend TRANSFER_DENIAL rather than exempting a file.");
    }
    if (js && clause.includes("\u2014")) {
      err(label + ": a string this file renders into the page contains an em dash.\n      clause: \"" + clause.slice(0, 140) + "\"\n      "
        + "The site bans em dashes. The per-page rule above reads static HTML, so copy injected "
        + "by JavaScript is only covered here.");
    }
  }
}

/* 7h. THE ADD-ON CATALOG ON pricing.html IS A HAND-TYPED LIST.

      Guard 7 above validates the three PLANS against pricing-config.js and
      stops there, so the four sellable add-ons and their eight published
      figures sat in <ul id="addOnList"> as HTML literals that nothing
      compared to anything. Found 2026-08-27 during a truth review: the
      figures happened to be correct, which is the only reason this reads as
      a near miss rather than an incident. It is the repo's standing defect
      class -- a hand-maintained list drifts the first time the config moves
      and no guard notices.

      Every expectation below is DERIVED from window.NV_PRICING.addOns. No
      figure is written into this file: copying the literals here would only
      move the hand-maintained list into the checker, and the checker and the
      page would then drift together and both look green.

      Two directions, because an add-on can be wrong in two ways:
        sellable       must state its own monthly AND its own one-time launch
                       fee, matching the config exactly
        not sellable   must NOT state a monthly, must carry a coming/not-yet
                       marker, and must carry no Buy control. C$2,000 per
                       campaign is a quote, not a subscription, and a reader
                       who sees a price beside it reads it as purchasable. */
{
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });
  const cfg = w.NV_PRICING;
  if (!cfg || !Array.isArray(cfg.addOns)) err("pricing-config.js: NV_PRICING.addOns not found");
  else {
    const ph = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
    const listMatch = ph.match(/<ul id="addOnList"[\s\S]*?<\/ul>/);
    if (!listMatch) err('pricing.html: the <ul id="addOnList"> catalog is missing, so the add-on prices are unguarded');
    else {
      const items = listMatch[0].match(/<li>[\s\S]*?<\/li>/g) || [];
      /* Money as the page writes it: C$1,000 not C$1000. One helper, used for
         both the expectation and the error text, so a failure prints exactly
         the string the page is missing. */
      const money = (n) => "C$" + Number(n).toLocaleString("en-CA");
      for (const a of cfg.addOns) {
        const li = items.find((x) => x.includes(a.name));
        if (!li) {
          err('pricing.html #addOnList: add-on "' + a.name + '" is in pricing-config.js and not on the page. '
            + "Every add-on the config carries must be listed, sellable or not: one that is missing is one nobody can price.");
          continue;
        }
        const monthlyOnPage = li.match(/C\$([\d,]+)\/month\b/i);
        const launchOnPage = li.match(/C\$([\d,]+)\s+launch\b/i);
        const num = (x) => Number(String(x).replace(/,/g, ""));
        if (a.sellable) {
          if (!monthlyOnPage || num(monthlyOnPage[1]) !== a.monthly) {
            err('pricing.html #addOnList "' + a.name + '": monthly differs from pricing-config.js. '
              + 'expected "' + money(a.monthly) + '/month", page says "' + (monthlyOnPage ? monthlyOnPage[0] : "nothing") + '"');
          }
          if (!launchOnPage || num(launchOnPage[1]) !== a.launch) {
            err('pricing.html #addOnList "' + a.name + '": one-time launch fee differs from pricing-config.js. '
              + 'expected "' + money(a.launch) + ' launch", page says "' + (launchOnPage ? launchOnPage[0] : "nothing") + '"');
          }
        } else {
          /* A price is a price whatever unit follows it. The first version of
             this branch only knew "C$x/month", so "C$2,000 per campaign" --
             which is the exact shape reactivation is priced in inside
             pricing-config.js -- would have walked straight through the guard
             written to stop it. Any money figure beside a module that has not
             shipped reads as an offer to sell it, so all of them are caught. */
          const anyPrice = li.match(/C\$\s?[\d,]+(?:\.\d+)?\s*(?:\/\s*(?:month|mo|campaign|call|lead|job)\b|per\s+(?:month|campaign|call|lead|job|seat)\b|\bone[- ]time\b|\blaunch\b|\ba\s+month\b)?/i);
          if (anyPrice) {
            err('pricing.html #addOnList "' + a.name + '": states ' + anyPrice[0].trim() + ' while pricing-config.js marks it sellable: false. '
              + "A price beside an unshipped module is an offer to sell it, whatever unit follows the figure.");
          }
          if (!/\bcoming\b|\bnot sellable\b|\bnot yet\b/i.test(li)) {
            err('pricing.html #addOnList "' + a.name + '": pricing-config.js marks it sellable: false and the page does not say so. '
              + 'It needs a "coming" or "not sellable" marker a reader cannot miss.');
          }
          if (/signup\?plan=|data-evt="plan_buy_click"|>Buy now</i.test(li)) {
            err('pricing.html #addOnList "' + a.name + '": carries a Buy control while pricing-config.js marks it sellable: false.');
          }
        }
      }
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

       On 2026-08-08 the referral card, usage policy and proposal plan box were
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

  /* The pilot record was DELETED from pricing-config.js on 2026-08-09, so the
     three checks that stood here (pilotName, pilotTagline, pilotCaps on
     pricing.html, plus three more on proposal.html) had nothing left to
     compare against. They were not deleted with it: dropping six equality
     checks would have left the two pages with fewer guarded strings than
     before the offer was retired, which is how copy drifts back.

     They were re-pointed at the referral card, which is the block that
     survived the change, is still rendered from config at runtime, and is the
     one remaining place on the pricing page where a static copy of a config
     value can go stale without anything noticing. Same count of checks, same
     failure mode covered, aimed at live copy instead of dead copy. */
  if (!cfg || !cfg.referral || !cfg.usagePolicy) err("pricing-config.js: referral/usagePolicy missing, cannot check pre-rendered copy");
  else {
    const ph = fs.readFileSync(path.join(root, "pricing.html"), "utf8");
    eq("pricing.html", "referralHeadline", flat(textOf(ph, "referralHeadline")), cfg.referral.headline);
    eq("pricing.html", "referralOffer", flat(textOf(ph, "referralOffer")), cfg.referral.offer);
    eq("pricing.html", "referralTrigger", flat(textOf(ph, "referralTrigger")), cfg.referral.trigger);
    eq("pricing.html", "referralHowTo", flat(textOf(ph, "referralHowTo")), cfg.referral.howTo);
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
    /* The proposal is the document a named prospect keeps, so its price
       sentence is held to the exact shape of the approved model rather than
       just to the right figure. PLAN_TERMS is written out here on purpose: it
       is the only copy of the commitment that lives in a file a page cannot
       edit, and a proposal that quietly regrows a setup fee or a trial fails
       against it. If the commercial model changes, this line changes with the
       decision, not with the page. */
    /* REWRITTEN 2026-08-15 (evening) with the OPERATE/GROW/PARTNERSHIP model:
       the one-time Launch & Implementation fee is real and published, so the
       terms line now NAMES it and its default-plan amount instead of denying
       that anything is charged to start. "Setup fee" and "activation fee"
       remain retired names and are not used; the launch fee itself is never
       denied. REWRITTEN 2026-08-22 (v4): the figure is the AI Front Desk's
       launch fee because it is the default plan the static proposal renders;
       a minimum term exists, so "no minimum term" and "cancel any time" are
       themselves retired sentences this pin must never bless again. */
    const PLAN_TERMS = "One-time C$1,500 Launch & Implementation to start. Overage past your included minutes is the only other usage billing. Three-month minimum to start, six months when any automation add-on or The Works is included; the build takes days and you are live inside the first week, and the results show across the months after that. After the minimum: month to month, 30 days notice, cancellation from your portal, with service running to the end of the period you paid for. Your price is locked for 12 months.";
    /* INVERTED TWICE with the model, most recently 2026-08-15 (evening):
       published pricing is back, so the static line a prospect reads with
       scripts blocked states the default plan's monthly. A real quote from
       ?quote= still overrides it at render time. */
    eq("proposal.html", "planMonthly", flat(textOf(pr, "planMonthly")),
      cfg.publishedPricing
        ? money(dflt.monthly) + "/month, charged the day you start and every month after."
        : "Your monthly amount is quoted per client, then it is charged the day you start and every month after.");
    eq("proposal.html", "planTerms", flat(textOf(pr, "planTerms")), PLAN_TERMS);
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
  /* ADDITIVE is at module scope now, shared with guard 7e. */
  /* Comments are stripped first. The files that FIXED this defect are the ones
     that quote the retired sentence in order to explain why it is retired, and
     a rule that fires on its own explanation teaches the next person to delete
     the explanation. Only what a reader can see is checked.

     Judged per sentence since 2026-08-09 and per CLAUSE since 2026-08-10, for
     one specific reason: the current model's selling point is that there is NO
     setup fee, and this rule matched "setup fee" anywhere in the file, so the
     page stating the commitment failed the guard protecting it. Clause
     classification is the narrowest fix that keeps the detector able to fail:
     "One-time setup: C$250" is still caught, "No setup fee, no minimum term"
     is not. Sentence classification was too coarse in the other direction —
     see scripts/lib/claims.mjs for what it laundered.

     The remediation text changed with it. It used to end "Write 'First month
     C$X, then C$Y/month'", which was this guard telling anyone who tripped it
     to write the offer that has since been retired. A guard's error message is
     read at exactly the moment somebody is deciding what to write. */
  const visible = (s) => s
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
  const surfaces = [...contentPages.map((f) => path.join(root, f)), path.join(root, "llms.txt")];
  for (const file of surfaces) {
    if (!fs.existsSync(file)) continue;
    const text = visible(fs.readFileSync(file, "utf8"));
    const label = path.relative(root, file).replace(/\\/g, "/");
    for (const b of ADDITIVE) {
      const clause = offendingClause(text, b);
      if (clause) {
        err(`${label}: ${b} names the one-time charge with retired vocabulary or joins it additively.\n      clause: "${clause}"\n      `
          + `"Setup fee", "activation fee" and "onboarding fee" are retired names. The one-time charge is `
          + `called "Launch & Implementation", and it is joined to the monthly with the approved shape `
          + `"C$X Launch & Implementation to start, then C$Y a month" — never with "plus", "+" or "and". `
          + `A denial of a retired name ("no setup fee") is allowed; a denial of the launch fee is not.`);
      }
    }
  }
}

/* 7d. No published surface may OFFER a retired commercial term.

       Added 2026-08-09, replacing the canonical-pilot-naming rule at the top of
       this file. The pilot, the paid trial, the C$150 fee, the C$850 Pro price
       and the two-number "first month X, then Y" framing were all retired the
       same day. Between them they appeared on eleven pages, in llms.txt, in
       three JSON-LD blocks and in a proposal document, and the thing that let
       them spread was that no rule here could tell an OFFER from a MENTION.
       Rule 4's banned list cannot: it tests the whole file, so the one page
       that has to explain that there is no pilot would be the page that fails.

       So this is judged per CLAUSE, by the same DENIAL classification the
       cross-repo surfaces already use. "There is no pilot, paid or free"
       passes. "Start with the 7-day live pilot" does not. That asymmetry is
       the whole guard: it must stay possible to deny a retired offer in words,
       and impossible to make one.

       The unit was the SENTENCE until 2026-08-10, and that was too coarse in a
       way that pointed the wrong direction: "The C$150 pilot is retired, and
       Pro is C$850/month with 1,200 minutes." passed. One retirement clause
       excused two more retired figures and a wrong CURRENT price beside it.

       NOT a list of words to delete. If a failure here names a sentence that
       is genuinely refusing the offer, the fix is to add the refusal wording
       to DENIAL, never to drop the pattern. Dropping the pattern re-opens the
       claim for every page at once. */
{
  /* RETIRED_OFFERS is at module scope now, shared with guard 7e. */
  /* Comments and scripts are stripped before the text is read. The files that
     FIXED this defect are the ones that quote a retired sentence in order to
     explain why it is retired, and a rule that fires on its own explanation
     teaches the next person to delete the explanation. Only what a reader can
     see is checked. JSON-LD is deliberately NOT stripped: an answer engine
     reads it, so a retired offer inside a <script type="application/ld+json">
     block reaches a buyer exactly like body copy does. */
  const readable = (s) => s
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/&rsquo;/g, "'")
    .replace(/[ \t]+/g, " ");
  const surfaces = [...contentPages.map((f) => path.join(root, f)), path.join(root, "llms.txt")];
  for (const file of surfaces) {
    if (!fs.existsSync(file)) continue;
    const label = path.relative(root, file).replace(/\\/g, "/");
    const text = readable(fs.readFileSync(file, "utf8"));
    for (const b of RETIRED_OFFERS) {
      const clause = offendingClause(text, b);
      if (clause) {
        err(`${label}: states a retired commercial term ${b}.\n      clause: "${clause}"\n      The approved model is a one-time `
          + `Launch & Implementation fee to start, then the plan's monthly price, with nothing else billed `
          + `beside the monthly except overage. No pilot, no trial, and never a denial of the launch fee `
          + `("no implementation fee", "one recurring monthly price" and "nothing charged to start" are the `
          + `new false claims). A CLAUSE that denies a retired offer is allowed; extend DENIAL rather than `
          + `dropping the pattern. Note the scope: a denial in a NEIGHBOURING clause no longer excuses this one.`);
      }
    }
  }
}

/* 7e. config/elevenlabs/ IS A PRICING SURFACE, and until 2026-08-10 no rule
       here treated it as one.

       Guard 6b has swept that directory since it was written — but only against
       the `banned` list, which is about client-base claims and retired slogans
       and contains no price, no plan name and no offer. Guards 7c and 7d, the
       two rules that actually understand the commercial model, ran over
       `contentPages` plus llms.txt: a non-recursive readdir of root *.html. So
       the directory holding the live agent's knowledge base and its acceptance
       criteria was swept for the wrong thing, and reported as swept.

       WHAT IT COST. On 2026-08-09 the pilot, the C$150 fee, the C$850 Pro price
       and the two-number framing were retired everywhere a guard could see.
       nevamis-agent-test-cases.md kept all four as PASS CRITERIA: rows 5, 6, 6b,
       7, 8, 21 and 22 required the agent to quote "first month C$1,000 then
       C$850/month" and to sell the C$150 seven-day pilot. Row 5 contradicted
       itself in a single cell, demanding that no retired price be spoken while
       requiring C$850 be spoken. Those criteria would have FAILED an agent for
       behaving correctly and PASSED one that quoted prices nobody may be
       charged, and every guard in this file was green the whole time.

       The scope decision in 7c ("only this repo's published pages, because the
       cold-calling kit lives on somebody else's schedule") was right about the
       cross-repo surfaces and was silently applied to this one too. This
       directory is committed here, editable here, and fixable in the same commit
       as the failure — so it is held to the full standard, and a failure here is
       err() not wait().

       ONE LOCAL RELAXATION, and only here: a chunk ending in "?" is not judged.
       These files quote the CALLER verbatim ("Is there a setup fee on top of the
       monthly?", "Can you knock the setup fee off if I sign up today?"), and the
       wrong premise in a buyer's question is exactly what the agent is being
       tested on refusing. An interrogative cannot make an offer or charge
       anyone. It is scoped to this guard rather than added to DENIAL because
       DENIAL is shared with the page rules, where "Setup fee? C$500." would
       then split into a question that is excused and a fragment that matches
       nothing. Every real defect listed above was declarative and is still
       caught; verified by reverting the file and re-running. */
{
  const surfaceDir = path.join(root, "config", "elevenlabs");
  /* The shared classifier with its interrogative exemption switched on. It was
     a hand-copied near-duplicate of statesBanned() until 2026-08-10; the copy
     is what let the clause-scope fix have to be made twice, and the second copy
     is exactly the kind of thing this repository has been bitten by before.
     One definition, one flag. */
  const offersHere = (text, re) => offendingClause(text, re, { allowQuestions: true });

  const files = walk(surfaceDir);
  if (!files.length) {
    err("config/elevenlabs/ has no .md or .txt files. That directory holds the live agent's knowledge "
      + "base, prompt and acceptance criteria; an empty sweep means this guard is proving nothing.");
  }
  for (const file of files) {
    const label = path.relative(root, file).replace(/\\/g, "/");
    const text = fs.readFileSync(file, "utf8");
    for (const b of RETIRED_OFFERS) {
      const clause = offersHere(text, b);
      if (clause) {
        err(`${label}: a spoken-agent surface states a retired commercial term ${b} as live.\n      clause: "${clause}"\n      `
          + `The approved model is a one-time Launch & Implementation fee to start, then the plan's monthly `
          + `price, spoken with the approved joins ("to start", "then") and never as an addition. No pilot, `
          + `no trial, no retired figure, and never a denial of the launch fee. This file instructs or grades `
          + `the agent that answers the demo line, so a retired offer here reaches a prospect out loud. A `
          + `CLAUSE that denies a retired offer is allowed, and so is a quoted caller question; extend DENIAL `
          + `rather than dropping the pattern.`);
      }
    }
    for (const b of ADDITIVE) {
      const clause = offersHere(text, b);
      if (clause) {
        err(`${label}: a spoken-agent surface uses retired fee vocabulary or an additive join (${b}).\n      clause: "${clause}"\n      `
          + `"Setup fee", "activation fee" and "onboarding fee" are retired names. The one-time charge is `
          + `"Launch & Implementation", spoken as "one thousand dollars Launch and Implementation to start, `
          + `then seven hundred and fifty dollars a month" — never joined with "plus" or "on top".`);
      }
    }
  }
}

/* 7f. FORM DEFAULTS ARE PRICING COPY. Added 2026-08-10, after the homepage ROI
       calculator shipped `value="449"` to nevamis.ca under the label "Prefilled
       with the Growth plan" and stayed there through a full pricing sweep and
       every guard in this file.

       Why nothing saw it. Guard 7d is the rule that would have caught the
       figure, and its readable() does `.replace(/<[^>]+>/g, " ")` — it deletes
       tags to read body copy, and an input's default value lives INSIDE the
       tag it deletes. Guard 7c strips comments and reads sentences, so it sees
       nothing either. tests/interactions.spec.js has the retired list
       [49,150,197,249,397,449,499,797,849,850] but scopes it to
       `#pricePreview .price-card`, and the same spec file TYPES 449 into this
       very field, so a page-wide text scan would have been self-poisoned by
       the suite meant to protect it. Three mechanisms, all green, one wrong
       price in front of every visitor.

       So this reads attributes, which no other rule here does, and it reads
       them against pricing-config.js rather than against a list of numbers:
       a figure that is merely NOT retired is not the same as the right one.
       The C$449 default was wrong the day Growth became C$500, whether or not
       anybody had got round to adding 449 to a retired list.

       The runtime prefill in site.js is the real fix; this guard exists
       because the markup default is what a no-JS visitor sees, what an answer
       engine scrapes, and what the next person editing the form copies. */
{
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });
  const cfg = w.NV_PRICING;
  const plans = cfg && Array.isArray(cfg.plans) ? cfg.plans : [];
  const rec = plans.find((p) => p.recommended) || plans[0];
  const live = new Set(plans.map((p) => Number(p.monthly)));

  /* Every monthly figure this business has ever published and no longer
     charges. Kept as a literal list rather than derived, because the point of
     the rule is to recognise a number the config no longer mentions at all.
     500 joined 2026-08-15 (evening) and LEFT 2026-08-25: v5 prices the
     Quote-Chase and Get-Paid engines at C$500/mo, and a retired list holding
     a live amount fails every correct page (the engine's canonical made the
     same surgery, with the same reasoning, the same day). 450 joins (the v4
     engine monthly), 1800 joins (The Works' v4 month). 750 stays OUT of this
     field-level list although it is a retired monthly: it is the live launch
     fee on both engines, and this rule cannot tell a monthly field from a
     launch field — the monthly-marker regex in claims.mjs is where C$750
     "a month" is still caught.
     Mirrors tests/interactions.spec.js and scripts/lib/claims.mjs; a change
     here lands in all three or the drift the comment warns about is this. */
  const RETIRED_MONTHLY = [49, 150, 197, 249, 397, 449, 450, 499, 797, 849, 850, 1800];

  for (const f of contentPages) {
    const html = fs.readFileSync(path.join(root, f), "utf8");
    /* Comments first: this file's own explanation of the defect quotes
       value="449", and a rule that fails on its own post-mortem gets the
       post-mortem deleted. */
    const markup = html.replace(/<!--[\s\S]*?-->/g, " ");
    /* A field is only judged if its own <label> says it holds MONEY. Without
       this the rule fails pricing.html's plan recommender, whose "Calls a
       month you expect us to answer" defaults to 150 - a call count that
       happens to collide with a retired dollar figure. Standing rule: money
       that is not Nevamis pricing is not this sweep's business, and a number
       that is not money at all is even less so. The label is the right test
       because it is the same string that tells the VISITOR what the number
       means. */
    const labelFor = (id) => {
      const m = markup.match(new RegExp(`<label[^>]*\\bfor="${id}"[^>]*>([\\s\\S]*?)</label>`, "i"));
      return m ? m[1].replace(/<[^>]+>/g, " ") : "";
    };
    const isMoneyField = (id) => /\$|\bprice\b|\bplan\b|\bquote\b|\bfee\b|\bcost\b/i.test(labelFor(id));

    const inputRe = /<input\b[^>]*>/gi;
    let tag;
    while ((tag = inputRe.exec(markup)) !== null) {
      const vm2 = tag[0].match(/\bvalue="([\d,.]+)"/i);
      if (!vm2) continue;
      const n = Number(vm2[1].replace(/,/g, ""));
      if (!Number.isFinite(n)) continue;
      const idm = tag[0].match(/\bid="([^"]+)"/i);
      const id = idm ? idm[1] : "(no id)";
      if (!idm || !isMoneyField(id)) continue;
      if (RETIRED_MONTHLY.includes(n) && !live.has(n)) {
        err(`${f}: <input id="${id}"> defaults to ${n}, a retired monthly price. `
          + `A default is a published claim: it is what a visitor with JavaScript off sees, what an `
          + `answer engine scrapes, and what the next person editing this form copies. Set it from `
          + `pricing-config.js, not from a literal.`);
      }
    }

    /* The ROI comparison field specifically. It is the one input on the site
       whose value IS a plan price, and its label says which plan, so both
       halves are checked against the same record. */
    const quote = markup.match(/<input\b[^>]*\bid="roiQuote"[^>]*>/i);
    if (quote && rec) {
      const v = quote[0].match(/\bvalue="([\d,]+)"/i);
      const n = v ? Number(v[1].replace(/,/g, "")) : NaN;
      if (n !== Number(rec.monthly)) {
        err(`${f}: #roiQuote defaults to ${v ? v[1] : "nothing"}, but the recommended plan `
          + `(${rec.name}) is C$${Number(rec.monthly).toLocaleString("en-CA")}/month in pricing-config.js. `
          + `The field is labelled with the plan name, so a mismatch quotes a price nobody may be charged.`);
      }
      const named = markup.match(/<span id="roiQuotePlan">([^<]*)<\/span>/i);
      if (!named) {
        err(`${f}: #roiQuote's hint no longer names the plan through <span id="roiQuotePlan">. `
          + `That span is how site.js keeps the label and the figure reading from one record; without it `
          + `the plan name is a literal again and can drift from the price beside it.`);
      } else if (rec.name && named[1].trim() !== String(rec.name).trim()) {
        err(`${f}: #roiQuote is labelled "${named[1].trim()}" but the recommended plan in `
          + `pricing-config.js is "${rec.name}".`);
      }
    }
  }
}

/* 7g. docs/ AND creative/ ARE UNGUARDED, AND THAT IS WHERE THE SWEEPS WORK.

       Added 2026-08-10. `contentPages` is a non-recursive readdir of root
       *.html, so guards 7c and 7d see 22 pages and llms.txt and nothing else;
       7e added config/elevenlabs/. Every remaining .md in this repository -
       the claims ledger, the legal review package, the agent upgrade notes,
       the onboarding pack, the creative truth basis - was reachable by no
       pricing rule at all. That is precisely where the last two pricing
       sweeps did most of their editing, so the files that were "fixed" were
       the files nothing could check, and the next edit to any of them is
       ungated again.

       WHAT IS AND IS NOT REQUIRED. This repository is full of documents that
       must keep retired figures: the ledger records what was retired, the
       legal package lists the superseding history so counsel is not surprised
       by an older file, docs/ideas/* were authored against the C$249 ladder
       and are kept so the reasoning is traceable. Deleting those numbers
       would destroy the record. So the rule is not "no retired figure in
       docs/" - it is the repository's own existing convention, enforced:

         a file may state a retired figure IF it carries a dated banner near
         the top saying the model it was written against is superseded.

       A file with the banner is exempt entirely. A file without one is judged
       CLAUSE BY CLAUSE with the same DENIAL classifier the page rules
       use, so "there is no setup fee to charge" and "the C$150 pilot is
       retired" still pass in an unbannered file. What fails is a document
       with no banner making a plain present-tense claim, which is exactly the
       shape of every genuine miss the verifiers found. */
{
  /* A banner has to do TWO things to exempt a file, and both are checked,
     because either alone is the failure mode. Saying "retired" without naming
     what replaced it leaves the reader with a dead number and no live one -
     which is how a stale figure gets re-quoted from a file that technically
     disclaimed it. Naming the current model without marking the old one as
     over leaves two live-looking price lists in one document. Written as two
     regexes rather than one long alternation so a future banner phrasing only
     has to satisfy the two ideas, not match a sentence template. */
  const RETIRED_MARK = /\bretired\b|\bsuperseded\b|\bhistorical\b|\bkept (?:as|for) (?:one|history)\b|\bis history\b|\bno longer (?:exists|offered)\b|\bnot approved\b|\bnot for publication\b|\binternal hypothes/i;
  /* Anchors updated 2026-08-22 (v4): the current model is C$1,000/C$1,800
     monthlies with C$1,500/C$2,500 Launch & Implementation fees and priced
     add-ons. C$750 was an anchor and is now itself a retired figure, so it
     is gone — a banner that named it would exempt the very file still
     asserting it. */
  const CURRENT_MARK = /C\$\s?1,?800|C\$\s?1,?000|C\$\s?1,?500|C\$\s?2,?500|Launch (?:&|and) Implementation|pricing-config\.js|NOT NEVAMIS PRICING/i;
  const BANNER = { test: (h) => RETIRED_MARK.test(h) && CURRENT_MARK.test(h) };
  const roots = [walk(path.join(root, "docs")), walk(path.join(root, "creative"))].flat();
  const rootDocs = fs.readdirSync(root)
    .filter((f) => /\.(md|txt)$/i.test(f))
    .filter((f) => f !== "llms.txt")   /* already held to the page standard by 7c and 7d */
    .map((f) => path.join(root, f));
  for (const file of [...roots, ...rootDocs]) {
    const label = path.relative(root, file).replace(/\\/g, "/");
    const text = fs.readFileSync(file, "utf8");
    /* The banner window is the first 30 NON-EMPTY lines, not the first 30
       lines: a markdown title, a rule and two blank lines already spend four
       of them, and a banner pushed below the window by whitespace is still a
       banner a reader sees first. */
    const head = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 30).join("\n");
    if (BANNER.test(head)) continue;
    for (const b of [...RETIRED_OFFERS, ...ADDITIVE]) {
      const clause = offendingClause(text, b);
      if (clause) {
        err(`${label}: states a retired commercial term ${b} with no superseded banner.\n      clause: "${clause}"\n      `
          + `Either correct the clause to the current model (a one-time Launch & Implementation fee to `
          + `start, then the plan's monthly price, nothing else billed beside the monthly except overage, `
          + `no pilot at any price), or - if the file is a record of what USED to be true and the figure `
          + `must stay - add a dated banner in the first lines saying so, the way docs/ideas/*, `
          + `docs/payment-flow.md and PRELAUNCH.md already do. Do not delete the history.`);
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
        /* "two thousand AND five hundred" — the form the live agent actually
           speaks (and the engine's own spokenForms produces). Absent here,
           a correct prompt reads as never speaking the fee (2026-08-25). */
        if (rh && !rr) out.add(`${small(th)} thousand and ${small(rh)} hundred`);
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

    /* No setup fee is not a price to recite, it is a fact to state. The prompt
       must say plainly that there is nothing charged besides the monthly
       price, and must NOT still be quoting a retired fee. Being the only
       provider in this market with published prices and no setup fee is a
       selling point, and an agent that keeps quoting a retired fee costs the
       sale twice, once on price and once on trust.

       THIS DETECTOR NO LONGER SITS BEHIND A CONDITION. It used to run only
       when `plans.every(p => p.setup === 0)`, which was true in the world it
       was written for. On 2026-08-09 the `setup` key was deleted rather than
       zeroed, so that expression became false for every plan and the whole
       branch went silent: the one check that watches for a retired fee being
       spoken to a live prospect stopped running on the very day the fee was
       retired. A detector that switches itself off when the thing it detects
       becomes possible is worse than no detector, because the green run reads
       as proof.

       The retired-phrase list is EXTENDED, never trimmed. Every entry is
       something a prospect was told out loud at some point, and the prompt is
       edited by hand in a dashboard where nothing else can see it. */
    /* INVERTED 2026-08-15 (evening). This branch used to REQUIRE the prompt
       to say "no setup fee", and under the OPERATE/GROW/PARTNERSHIP model a
       one-time Launch & Implementation fee is real and published — so the
       prompt must NAME the fee instead, and a denial of it is the new wrong
       thing. `p.setup === undefined` still gates it: the presence of a
       `setup` key anywhere would be its own cross-repo failure. */
    const noSetupKey = w.NV_PRICING.plans.every((p) => p.setup === undefined);
    if (noSetupKey && w.NV_PRICING.publishedPricing) {
      const naysLaunch = /launch (?:and|&) implementation/.test(spoken);
      if (!naysLaunch) wait("demo.md: the one-time Launch & Implementation fee is never named. The agent must state it in the approved shape (\"one thousand dollars Launch and Implementation to start, then seven hundred and fifty dollars a month\"), never call it a setup, activation or onboarding fee, and never deny it.");
    }
    const RETIRED_SPOKEN = [
      "five hundred dollars one-time setup", "seven hundred and fifty dollars setup",
      "one thousand two hundred and fifty dollars", "two hundred and fifty dollars setup",
      "one-time setup", "setup fee", "activation fee",
      /* Retired 2026-08-09 with the pilot and the C$850 Pro price. */
      "seven-day pilot", "seven day pilot", "fourteen-day pilot", "seven live days",
      "one hundred and fifty dollars", "a hundred and fifty dollars",
      "eight hundred and fifty dollars", "eight fifty a month",
      "free trial", "trial period",
      /* Retired 2026-08-15 (evening): Growth's C$500 month, and the
         pre-directive plan names. */
      "five hundred dollars a month", "five hundred a month",
      "core plan", "growth plan", "pro plan",
      /* Retired 2026-08-22 (v4): Grow's C$750 month, and the v3 plan names.
         The agent says The Works, AI Front Desk and Performance Partnership
         now. */
      "seven hundred and fifty dollars a month", "seven hundred and fifty a month", "seven fifty a month",
      "operate plan", "grow plan",
      /* Denials of the launch fee, which are the new false claims. */
      "no implementation fee", "no launch fee", "no launch charge",
      "one recurring monthly price", "nothing charged to start",
    ];
    /* Classified per PARAGRAPH here, not per sentence as everywhere else, and
       the difference is deliberate. demo.md is hard-wrapped prose: its
       "never quote these" window and its dated change log both run to several
       lines, so statesBanned() sees the retired phrase on one physical line
       and the word retiring it on the next, and reports the document's own
       history as a live claim. It did exactly that on first run, against a
       file another repo had already corrected.
       A paragraph is also the right unit for what this rule detects, which is
       an INSTRUCTION to the agent rather than a sentence in a page. */
    const saysRetired = (re) => spoken
      .split(/\n\s*\n/)
      .some((para) => re.test(para) && !DENIAL.some((d) => d.test(para)));
    for (const phrase of RETIRED_SPOKEN) {
      if (saysRetired(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))) {
        wait(`demo.md: still says a retired commercial term out loud ("${phrase}"). One monthly price, nothing beside it, no pilot and no trial.`);
      }
    }

    for (const plan of w.NV_PRICING.plans) {
      /* `launch` joined 2026-08-15 (evening): the one-time Launch &
         Implementation fee is part of the published offer, so a prompt that
         never speaks it is quoting half a price. Same dollarForms tolerance
         as the monthly, because it is said the same way. */
      const checks = [["monthly", dollarForms(plan.monthly)], ["launch", dollarForms(plan.launch)], ["overage", centForms(plan.overage)]];
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
      must carry the same monthly, included minutes, and overage as
      pricing-config.js. Checked only when ai-assistant sits beside this repo.

      THE SETUP CHECK IS INVERTED, NOT REMOVED. It read
      `has(money(plan.setup))` and required the row to quote a setup figure.
      When the `setup` key was deleted on 2026-08-09 that produced
      `PLAYBOOK.md "Core": setup is not $undefined as in pricing-config.js` on
      all three rows: a guard demanding that the founder's crib sheet publish
      the string "$undefined", and the only way to make it pass was to put a
      setup fee back. It was encoding the retired model as a contract.

      What replaced it holds the same surface to the current model: the table
      must have no Setup column at all, and no row may carry a retired figure.
      A guard here still fails if the table drifts from the config; it now
      fails in the direction the decision went. */
{
  const playbook = path.join(root, "..", "ai-assistant", "PLAYBOOK.md");
  if (fs.existsSync(playbook)) {
    const md = fs.readFileSync(playbook, "utf8");
    const w = {};
    vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });

    /* The table writes thousands both ways depending on the column, so accept
       "1250" or "1,250" rather than forcing one style on a prose document. */
    const money = (n) => [String(n), Number(n).toLocaleString("en-CA")];
    /* Retired figures, checked per row rather than per file: the prose around
       the table legitimately records that $150 and $850 were retired, and a
       whole-file scan would fail the sentence doing that work. $500 joined
       2026-08-15 (evening) with Growth's reprice to Grow at $750. */
    /* $750 joined 2026-08-22 (v4) with Grow's retirement into The Works. */
    const RETIRED_FIGURES = ["$150", "$850", "$249", "$449", "$849", "$49", "$500", "$750"];
    for (const plan of w.NV_PRICING.plans) {
      const row = md.split(/\r?\n/).find((l) => /^\|/.test(l) && l.includes("| " + plan.name + " |"));
      if (!row) { err(`PLAYBOOK.md: no tier row for "${plan.name}"`); continue; }
      const has = (forms) => forms.some((f) => row.includes("$" + f));
      if (!has(money(plan.monthly))) err(`PLAYBOOK.md "${plan.name}": monthly is not $${plan.monthly} as in pricing-config.js`);
      /* The launch fee is part of the offer the founder quotes, so a row
         without it is a row that quotes half a price. */
      if (!has(money(plan.launch))) err(`PLAYBOOK.md "${plan.name}": the one-time Launch & Implementation fee is not $${plan.launch} as in pricing-config.js`);
      if (!new RegExp(`\\|\\s*${plan.includedMinutes}\\s*\\|`).test(row)) err(`PLAYBOOK.md "${plan.name}": included minutes are not ${plan.includedMinutes}`);
      if (!row.includes("$" + plan.overage.toFixed(2))) err(`PLAYBOOK.md "${plan.name}": overage is not $${plan.overage.toFixed(2)}/min`);
      for (const fig of RETIRED_FIGURES) {
        if (row.includes(fig)) err(`PLAYBOOK.md "${plan.name}": the tier row still quotes the retired figure ${fig}. `
          + `The plan is $${plan.launch} Launch & Implementation to start, then $${plan.monthly} a month.`);
      }
    }
    /* The columns themselves, not just their contents. INVERTED 2026-08-15
       (evening): the table must now CARRY a "Launch & Implementation" column,
       because the one-time fee is part of the offer and a founder reading a
       table without it quotes half a price — and it must still REFUSE a
       "Setup" column, because that is the retired name and the retired
       arrangement. */
    const tierHeader = md.split(/\r?\n/).find((l) => /^\|\s*Tier\s*\|/i.test(l));
    if (tierHeader && /\|\s*Setup\b/i.test(tierHeader)) {
      err("PLAYBOOK.md: the tier table has a Setup column. \"Setup\" is a retired name; the one-time charge is "
        + "\"Launch & Implementation\" and its column must say so, or the founder reads the retired offer off the page.");
    }
    if (tierHeader && !/\|\s*Launch (?:&|and) Implementation/i.test(tierHeader)) {
      err("PLAYBOOK.md: the tier table has no \"Launch & Implementation\" column. The one-time fee is part of the "
        + "published offer, and a table without it is how a founder quotes half a price to a prospect.");
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

/* ============================================================
   GUARD: the instructions for sending a proposal must send a real plan.

   docs/PROPOSAL-LINKS.md tells the founder what to paste into an email. It
   drifted badly: for a day after the offer changed it still documented a
   founding waiver, a struck-out setup fee and a free seven-day pilot, and its
   example email promised the pilot in writing. proposal.html was truthful
   throughout, so following the document meant sending a prospect a message the
   document then contradicted.

   Worse, one example told him to send ?plan=pay-as-you-go. That plan was
   removed, unknown ids fall back to the recommended one, and the link would
   have quoted Growth at C$500/month to somebody who had just been offered a
   low-volume option.

   Prose cannot be checked. The LINKS can: every proposal URL in the file must
   name a plan that pricing-config.js actually defines, and every plan that
   exists must appear in at least one of them, so a new tier cannot ship
   undocumented. Retired ids are named in the file as warnings rather than
   URLs, which is exactly why matching on full URLs is the right rule.
   ============================================================ */
{
  const docRel = "docs/PROPOSAL-LINKS.md";
  const docPath = path.join(root, docRel);
  if (!fs.existsSync(docPath)) err(`${docRel} is missing: the proposal send instructions are not optional`);
  else {
    const w = {};
    vm.runInNewContext(fs.readFileSync(path.join(root, "pricing-config.js"), "utf8"), { window: w }, { timeout: 1000 });
    const ids = new Set((w.NV_PRICING?.plans ?? []).map((p) => p.id));
    const doc = fs.readFileSync(docPath, "utf8");

    const urls = [...doc.matchAll(/proposal\.html\?[^\s)`"']*/g)].map((m) => m[0]);
    if (!urls.length) err(`${docRel}: no example proposal links found, so this guard proves nothing`);
    const used = new Set();
    for (const u of urls) {
      const plan = (u.match(/[?&]plan=([A-Za-z0-9_-]+)/) || [])[1];
      if (!plan) continue;
      /* The one placeholder, spelled exactly, matching the file's own
         BUSINESS+NAME convention in the same template line. Exempting it by
         name rather than by "looks like a placeholder" keeps the guard tight:
         ?plan=PAY-AS-YOU-GO would still fail, which is the point. */
      if (plan === "PLAN") continue;
      used.add(plan);
      if (!ids.has(plan)) {
        err(`${docRel}: an example link sends ?plan=${plan}, which pricing-config.js does not define.\n`
          + `       proposal.html falls back to the recommended plan for an unknown id, so this link\n`
          + `       quotes the wrong tier at the wrong price to a named prospect.\n`
          + `       Known ids: ${[...ids].join(", ")}`);
      }
    }
    for (const id of ids) {
      if (!used.has(id)) {
        err(`${docRel}: plan "${id}" exists in pricing-config.js but no example link sends it.\n`
          + `       A tier nobody knows how to send is a tier nobody sends.`);
      }
    }
  }
}

/* ============================================================
   GUARD: the published privacy promise, enforced by code shape.

   privacy.html tells visitors that each analytics count records "only the
   event name, the page path, the referring site's hostname, and campaign
   tags", and that "no identifiers are stored". For a long time that held only
   because no page happened to carry anything personal in its URL - and then
   proposal.html started carrying ?to=<recipient name>, and a real person's
   name began reaching site_events.source.

   Grepping for "to=" would be useless: the next identifier will be called
   something else, and ?%74%6f= and ?To= both defeat a substring search while
   URLSearchParams resolves them. So this guards the SHAPE instead.

   The rule: location.search may only be READ through URLSearchParams, or
   ASSIGNED to (which is navigation, not telemetry). It may never be
   interpolated into a string, because that is how a whole query string ends
   up inside a payload. Campaign tags reach telemetry through the one
   allowlist in site.js (NV_ATTRIB_KEYS), which rebuilds the string from named
   keys rather than copying it.

   Adding a key to that allowlist is a deliberate, reviewable act. Writing
   "+ location.search" is not, which is precisely why it is the thing banned.
   ============================================================ */
{
  const files = [
    ...contentPages,
    "site.js", "motion.js",
    ...fs.readdirSync(path.join(root, "assets/motion"))
      .filter((f) => f.endsWith(".js")).map((f) => "assets/motion/" + f),
  ];
  /* Read-only parse, and navigation. Everything else is a serialisation.
     Assignment is navigation: it sends the visitor somewhere and posts
     nothing, which is why the mailto fallback and the search box are fine. */
  const SAFE = [
    /new URLSearchParams\(\s*(?:window\.)?location\.search\s*\)/g,
    /(?:window\.)?location\.(?:search|href)\s*=[^=]/g,
  ];
  /* Comments are stripped first, or a file that EXPLAINS this rule trips it -
     which is exactly what site.js did on the first run. Blank the bodies
     rather than deleting them, so reported line numbers stay true. */
  const decomment = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + m.slice(p.length).replace(/./g, " "))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
  for (const rel of files) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    let src = decomment(fs.readFileSync(full, "utf8"));
    for (const re of SAFE) src = src.replace(re, (m) => m.replace(/./g, " "));
    const stray = [...src.matchAll(/location\.(search|href)\b/g)];
    for (const m of stray) {
      const line = src.slice(0, m.index).split("\n").length;
      const text = src.split("\n")[line - 1].trim().slice(0, 90);
      /* location.href resolving a relative URL is not telemetry. */
      if (/new URL\([^)]*location\.href/.test(text)) continue;
      err(`${rel}:${line}: ${m[0]} used outside URLSearchParams.\n`
        + `       ${text}\n`
        + `       Campaign tags must come from window.nvAttributionQuery() / window.nvSourceTags()\n`
        + `       (site.js NV_ATTRIB_KEYS). Interpolating the query string puts whatever a link\n`
        + `       carried - a name, an email, an id - into analytics, which privacy.html forbids.`);
    }
  }
}

if (fail === 0) console.log("Consistency check passed: " + contentPages.length + " pages, one nav, one footer, no banned phrases, pricing fallback matches config, spoken prices match config, playbook table matches config, motion modules parse, every internal link and anchor resolves, index.html matches promoted home.html, no raw query string reaches telemetry, every documented proposal link names a real plan.");
/* 1 = something here is broken. 2 = nothing here is broken but the live
   phone agent needs a change only the owner can make. 0 = clean. */
if (fail === 0 && waiting > 0) console.error(`
${waiting} item${waiting === 1 ? " needs" : "s need"} a change to the LIVE agent prompt, which only the owner can apply.`);
process.exit(fail > 0 ? 1 : waiting > 0 ? 2 : 0);
