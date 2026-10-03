/* ============================================================
   MACHINE SURFACES SAY WHAT THE PAGES SAY (whole-site audit, 2026-10-03)

   Three rules, each a pure function over text or parsed data, each with a
   fixture table that check-consistency.js runs BEFORE it trusts the verdict
   on the real files (guards 7q, 7r and 7s). The same shape as
   llms-terms.mjs and status-chips.mjs: a judge nobody tests is a judge that
   quietly stops judging.

   1. agentTruthFindings: config/elevenlabs/**, the documents the demo agent
      speaks from (its knowledge base), is graded by (its acceptance tests),
      and every client agent is built from (greetings, template, isolation,
      scenarios, the support agent's knowledge). Audit MACHINE-9 to 16 found
      each of them stating, or grading as a PASS, something the product does
      not do: a live transfer, a client line that books and confirms, a
      greeting that leads with "AI", a missed-call text "during business
      hours", a Partnership share of "10%", alerts "at" a threshold, an
      unproven "most", an audience of clinics and restaurants, and module
      prices retired a month earlier. Guards 6b and 7e swept this directory
      for retired PRICES and banned SLOGANS only, so every one of those
      passed.

   2. llmsPageFindings: llms.txt's "## Pages" list is every page in the
      sitemap and nothing else (MACHINE-26: it listed half of them, and
      neither the solutions hub nor security.html).

   3. offerFindings: the homepage's Service JSON-LD carries every sold item
      with BOTH of its figures, in pricing-config's shape (MACHINE-17: each
      Offer's machine-read price was the monthly alone, the Partnership a flat
      350, and no module sold alone had an Offer).

   Copy rules assert the RULE, not one sentence: a new sentence that makes
   the same false claim fails the same way.
   ============================================================ */

import { splitSentences } from "./claims.mjs";

/* ---------------------------------------------------------------
   1. THE AGENT DOCUMENTS
   --------------------------------------------------------------- */

/* A unit is one sentence, cut further at ";" and at table-cell bars. Commas
   and "and" are deliberately NOT boundaries here: these files keep pass
   criteria in table cells and lists, and the denial that governs a claim
   ("never offers a transfer, a hand-off or a callback it cannot keep") sits
   in the same cell as the nouns it denies. A cell or sentence is the unit a
   grader reads. */
const units = (text) => splitSentences(String(text).replace(/<!--[\s\S]*?-->/g, " "))
  .flatMap((s) => s.split(/;|\|/))
  .map((u) => u.trim())
  .filter(Boolean);

/* What withdraws a claim inside its own unit. "without" is NOT here: "owns
   being an AI without defensiveness, offers to transfer..." is exactly the
   row this rule exists to fail. */
const NEG = /\b(?:not|never|no|cannot|nothing|none|nor|neither|fail|fails|failure|forbids?|forbidden|retired|banned|false|isn't|doesn't|don't|won't|can't)\b/i;

const isQuestion = (u) => /\?["')\]]*\s*$/.test(u) || /^["'][^"']*\?["']/.test(u);

/* Text inside double quotes is a caller's words or a phrase being named, not
   the document's own claim. Rules that grade claims about the product
   ignore it; the greeting rules read exactly that text, and say so. Removed
   BEFORE the text is cut into units, because a quoted caller line often
   holds a sentence end ("Is this for restaurants? I run a cafe.") and
   cutting first would strand half the quote outside its marks. A quote
   never spans a line in these files. */
const unquote = (t) => t.replace(/"[^"\n]*"/g, " ").replace(/“[^”\n]*”/g, " ");

/* A "most" about a population: the unproven-claim shape the owner rules
   out (no client counts, no statistics, no "most"). Bounded to the nouns a
   sales claim is made about, so "at most one attempt" and "the most
   important thing first" are not read as claims. */
const POPULATION_MOST = /\b(?:the\s+)?most\s+(?:of\s+(?:the\s+|your\s+|our\s+)?)?(?:missed\s+|new\s+|small\s+|local\s+|trades?\s+|service\s+|home\s+)?(?:callers?|businesses|clients|customers|owners|people|calls|jobs|leads|revenue|money|trades(?:people)?|contractors|plumbers|electricians|companies)\b/i;

/* A percentage, in figures or in the words an agent document writes. */
const PCT = /(?:\b\d+(?:\.\d+)?\s?%|\b\d+\s?per ?cent\b|\b(?:five|ten|fifteen|twenty|twenty-five|thirty)\s+per ?cent\b)/i;

/* Who a document is about. Every agent document names files by their path
   under config/elevenlabs/. */
const isClientDraft = (f) => /(?:recording-notice-greetings|vertical-plumbing-agent-template|client-agent-isolation|plumbing-agent-test-scenarios)\.md$/.test(f);
const isDemoLine = (f) => /(?:nevamis-knowledge-base|nevamis-agent-test-cases)\.md$/.test(f);
const isPricedKb = (f) => /(?:nevamis-knowledge-base|client-support-knowledge)\.md$/.test(f);
const isAudienceDoc = (f) => /(?:nevamis-knowledge-base|client-support-knowledge|nevamis-agent-test-cases)\.md$/.test(f);

/* Each rule: which files, the claim's shape, an optional own excuse, and WHY
   it is false, which the failure prints. Judged unit by unit; a unit that
   carries a NEG word, or is a quoted caller question, is not a claim. */
export const AGENT_RULES = [
  { id: "transfer", files: () => true,
    re: /\btransfer(?:s|red|ring)?\b|transfer_to_number|\bput(?:s|ting)?\s+(?:you|them|the caller|the call|a call|calls|callers?)\s+through\b|\bconnect(?:s|ing)?\s+(?:you|them|the caller)\s+(?:to|with)\b|\bon-call\s+(?:transfer|hand-?off|number)\b/i,
    why: "no Nevamis line puts a caller through to anyone: a client agent's one call control is end_call, and the demo prompt's ESCALATION section forbids a transfer (decision #40). Grade a callback through notify_owner instead" },
  { id: "client-books", files: isClientDraft, quotes: true,
    re: /\bbook(?:s|ed|ing)?\b|\bcalendars?\b|\bconfirmation text\b/i,
    why: "a client agent has no calendar and no booking tool: it takes the job and the time the caller wants, and the owner confirms the slot" },
  { id: "front-desk-books", files: isDemoLine,
    re: /\b(?:front desk|client'?s (?:line|agent|front desk)|receptionist)\b[^.;|]*\b(?:books?|booking|calendar|confirmations?|reminders?)\b|\b(?:books?|booking|calendar|confirmations?|reminders?)\b[^.;|]*\b(?:front desk|client'?s (?:line|agent|front desk)|receptionist)\b/i,
    why: "a client's front desk does not book into a calendar and sends callers no confirmation or reminder (knowledge base: 'does not book appointments, does not send callers confirmations')" },
  { id: "greeting-ai", files: (f) => /recording-notice-greetings\.md$/.test(f), lines: (l) => /^\s*"/.test(l), quotes: true,
    re: /\bAI\b/,
    why: "a greeting is given in the business's name and does not announce an AI; the agent says it is an AI the moment it is asked (llms.txt disclosure paragraph, canonical approvedGreeting)" },
  { id: "greeting-books", files: (f) => /recording-notice-greetings\.md$/.test(f), lines: (l) => /^\s*"/.test(l), quotes: true,
    re: /\bbook\b|\bschedul/i,
    why: "a greeting may not promise a booking: a client agent books nothing" },
  { id: "missed-call-hours", files: () => true,
    re: /(?:missed[- ]call|text-back|Missed-Call Recovery|Instant Lead Follow-Up|text back)[^.;|]*\bbusiness hours\b|\bbusiness hours\b[^.;|]*(?:missed[- ]call|text-back|text back)/i,
    why: "the missed-call text goes between 8 a.m. and 8 p.m. on the business's own clock, every day (pricing-config.js missed_call_recovery blurb; engine RECOVERY_HOURS), not 'during business hours'" },
  { id: "share-rate", files: () => true,
    re: new RegExp(`(?:share|revenue|performance|partnership|commission|compensation)[^.;|]*${PCT.source}|${PCT.source}[^.;|]*(?:share|revenue|commission)`, "i"),
    /* Only a denial right in front of the RATE excuses it. A denial anywhere
       else in the unit does not: the support knowledge base's "(by
       invitation and approval only, never presented as the default) ... plus
       10% of collected revenue" carries a "never" that has nothing to do with
       the rate it states. */
    excuse: (u, m) => {
      const at = m.index + m[0].search(PCT);
      return /\b(?:no|never|not)\b[^.;|]{0,40}$/i.test(u.slice(0, at));
    },
    why: "the Partnership's share is set in the client's agreement and its rate is never stated (llms.txt: 'do not state a rate'; ADR-015)" },
  { id: "alerts-at", files: () => true,
    re: /\balerts?\b[^.;|]{0,80}?\bat\s+(?:50|fifty)\b/i,
    /* Only a denial in front of "at" excuses it: the knowledge base's
       "alerts at 50 percent ... so the bill is never a surprise" carries a
       "never" about something else. */
    excuse: (u, m) => /\b(?:no|never|not)\b[^.;|]{0,40}$/i.test(u.slice(0, m.index + m[0].search(/\bat\s+(?:50|fifty)\b/i))),
    why: "usage alerts go after a threshold is passed, never 'at' it: the engine checks usage once a day and sends the highest threshold crossed (pricing-config.js usagePolicy)" },
  { id: "unproven-most", files: () => true,
    re: POPULATION_MOST,
    /* The claim carries its own negation ("most missed callers do not leave a
       voicemail"), so NEG cannot excuse it. Only a denial in FRONT of the
       word does, or naming the word in quotes as the thing forbidden. */
    excuse: (u, m) => /\b(?:no|never|not|banned|fail)\b[^.;|]{0,40}$/i.test(u.slice(0, m.index)),
    why: "Nevamis publishes no statistic, client count or 'most' about callers or businesses (owner rule: no unproven claim)" },
  { id: "audience", files: isAudienceDoc,
    re: /\b(?:clinics?|dental|salons?|spas?|real estate|restaurants?|caf[eé]s?|retail|local shops)\b/i,
    why: "Nevamis is built for trades and local service businesses: electricians, HVAC and plumbing, restoration and property services, automotive and other trades (llms.txt 'Who it is built for')" },
];

/** Every unit in one agent document that makes a claim a rule forbids, as
    printable findings. `file` is the path under config/elevenlabs/. */
export function agentTruthFindings(file, text) {
  const out = [];
  const lines = String(text).split(/\r?\n/);
  for (const r of AGENT_RULES) {
    if (!r.files(file)) continue;
    const body = r.lines ? lines.filter(r.lines).join("\n") : String(text);
    for (const u of units(r.quotes ? body : unquote(body))) {
      if (isQuestion(u)) continue;
      const m = r.re.exec(u);
      if (!m) continue;
      if (r.excuse ? r.excuse(u, m) : NEG.test(u)) continue;
      out.push(`${file}: ${r.id}: "${u.slice(0, 160)}" (${r.why})`);
    }
  }
  return out;
}

/* What the priced knowledge bases must SAY, derived from pricing-config.js,
   so a figure that changes there fails here until the agent's words follow:
     - every module sold alone, by its sold name, with its own two figures in
       the approved shape (startLine), and that it is sold on its own;
     - the Partnership through startLine: a fee floor and its monthly band;
   and the demo knowledge base states the missed-call text's hours in the
   clause pricing-config's blurb uses. */
export function agentRequiredFindings(file, text, NV) {
  const out = [];
  const flat = String(text).replace(/<!--[\s\S]*?-->/g, " ").replace(/\s+/g, " ");
  if (isPricedKb(file)) {
    for (const a of (NV.addOns || []).filter((x) => x.sellable === true && x.soldAlone === true)) {
      const want = `${a.name}: ${NV.startLine(a)}`;
      if (!flat.includes(want)) out.push(`${file}: must state "${want}" (pricing-config.js, ${a.id}): every module sold alone, by its sold name, with both of its figures`);
    }
    if (!/\bsold on (?:its|their) own\b/i.test(flat)) out.push(`${file}: must say the modules are each sold on their own (pricing-config.js soldAlone)`);
    for (const p of (NV.plans || []).filter((x) => Array.isArray(x.monthlyRange) || Array.isArray(x.launchRange))) {
      const want = NV.startLine(p);
      if (!flat.includes(want.replace(/\.$/, ""))) out.push(`${file}: must state ${p.name} as "${want}" (pricing-config.js startLine): a fee floor and a monthly band, never a flat pair`);
    }
  }
  if (/nevamis-knowledge-base\.md$/.test(file)) {
    const mcr = (NV.addOns || []).find((x) => x.id === "missed_call_recovery");
    const clause = mcr && (/\bbetween [^,]{3,40}? your time, every day\b/.exec(mcr.blurb) || [])[0];
    if (!clause) out.push("pricing-config.js: the missed_call_recovery blurb no longer states its hours as \"between ... your time, every day\", so the demo knowledge base cannot be checked against it");
    else if (!flat.includes(clause)) out.push(`${file}: must state the missed-call text's hours as "${clause}" (pricing-config.js missed_call_recovery blurb)`);
  }
  if (/nevamis-agent-test-cases\.md$/.test(file)) {
    for (const a of (NV.addOns || []).filter((x) => x.sellable === true && x.soldAlone === true)) {
      if (!flat.includes(a.name)) out.push(`${file}: grades no answer naming ${a.name}, which is sold today: the pricing row must grade every module's two figures`);
    }
  }
  return out;
}

/* Door order (2026-09-12): Lead Generation, then Quote Recovery, then the
   front desk, and never AI first. Read on the demo knowledge base's "What
   Nevamis is" section and the test catalogue's row 1. */
export function doorOrderFindings(label, text) {
  /* The legal name "Nevamis AI Inc." is a name, not a positioning. "call"
     is not a door word: "a short call with Daren" is how Lead Generation
     starts, so the front desk is found by "front desk" or "phone". */
  const t = String(text).replace(/\bNevamis AI Inc\.?/g, "Nevamis");
  const lg = t.search(/Lead Generation/);
  const q = t.search(/\bquotes?\b/i);
  const fd = t.search(/\b(?:front desk|phone)\b/i);
  const ai = t.search(/\bAI\b/);
  const out = [];
  if (lg < 0 || q < 0 || fd < 0) out.push(`${label}: does not name all three doors (Lead Generation, quotes, the front desk)`);
  else if (!(lg < q && q < fd)) out.push(`${label}: names the doors out of order; Lead Generation first, then Quote Recovery, then the front desk (door order 2026-09-12)`);
  if (ai >= 0 && (lg < 0 || ai < lg)) out.push(`${label}: leads with "AI" before Lead Generation; Nevamis is not described AI-first (decision #17)`);
  return out;
}

export const AGENT_FIXTURES = {
  /* [file, text] that MUST produce at least one finding. Each is a sentence
     the 2026-10-03 audit quoted, or its obvious sibling. */
  mustFire: [
    ["nevamis-agent-test-cases.md", "| 4 | x | \"q\" | Honest answer. May offer the on-call transfer during business hours. | ok | P1 |"],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Owns being an AI without defensiveness, offers to transfer to Daren now via transfer_to_number. | AI identity stated plainly; transfer_to_number used when the caller accepts transfer; | P1 |"],
    ["nevamis-agent-test-cases.md", "| 20 | x | \"q\" | Stays calm and offers a human (transfer or callback) early. | ok | P1 |"],
    ["nevamis-agent-test-cases.md", "| 3 | x | \"q\" | Explains that most missed callers do not leave a voicemail, they call the next business. | ok | P1 |"],
    ["nevamis-agent-test-cases.md", "| 15 | x | \"q\" | Answers honestly (reminders and confirmations are part of what the Front Desk does). | ok | P2 |"],
    ["nevamis-knowledge-base.md", "Trades businesses are the primary focus because after-hours emergency calls are where the most revenue is lost."],
    ["nevamis-knowledge-base.md", "The businesses Nevamis is built for include plumbers, along with clinics, dental offices, salons and restaurants."],
    ["nevamis-knowledge-base.md", "Clients get usage alerts at 50 percent, 75 percent, 90 percent, and 100 percent of their included minutes, so the bill is never a surprise."],
    ["nevamis-knowledge-base.md", "- Instant Lead Follow-Up, the missed-call text-back add-on: one text back when a call is missed, during business hours, with the business's name on it."],
    ["client-support-knowledge.md", "From C$2,500 Launch & Implementation to start, then C$350 a month, plus 10% of collected revenue directly attributable to qualified opportunities."],
    ["client-support-knowledge.md", "The Partnership takes ten percent of the revenue Nevamis brings in."],
    ["client-support-knowledge.md", "- Performance Partnership (by invitation and approval only, never presented as the default): from C$2,500 Launch & Implementation to start, then C$350 a month, plus 10% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities, subject to the client's agreement."],
    ["recording-notice-greetings.md", "\"Hi, you've reached {{business_name}}. I'm the AI receptionist here, and I can book jobs and answer questions.\""],
    ["recording-notice-greetings.md", "\"Thanks for calling {{business_name}}. You're speaking with our AI receptionist, and this call may be recorded.\""],
    ["vertical-plumbing-agent-template.md", "Call the booking tool, and ONLY after it returns success, tell the caller they are booked."],
    ["vertical-plumbing-agent-template.md", "Follow {{transfer_rules}}: transfer to a human when the rules say to and a destination is configured."],
    ["client-agent-isolation.md", "5. Wire tools: connect that client's calendar, transfer destination, and recording setting inside the agent."],
    ["plumbing-agent-test-scenarios.md", "| 24 | Routine booking happy path | \"Can you send someone out Thursday?\" | Collects details; books; confirms only after tool success. | ok | P0 | Sim |"],
  ],
  /* [file, text] that MUST pass: the true sentences each rule sits beside. */
  mustPass: [
    ["nevamis-knowledge-base.md", "The AI Front Desk does not book appointments, does not send callers confirmations, and does not transfer calls."],
    ["nevamis-knowledge-base.md", "Clients get a text or email alert after they pass 50 percent, 75 percent, 90 percent or 100 percent of their included minutes."],
    ["nevamis-knowledge-base.md", "The share, the attribution window and what counts as eligible revenue are all set in the client's agreement, so never state a rate or a percentage for the share on this line."],
    ["nevamis-knowledge-base.md", "This demo line books calls with Daren through Nevamis's own scheduling on Cal.com, which is Nevamis's own calendar and not an integration, and a client's line books nothing."],
    ["nevamis-agent-test-cases.md", "| 32 | Abusive caller | \"x\" | One calm attempt. | at most one de-escalation attempt before a courteous close | P1 |"],
    ["nevamis-agent-test-cases.md", "| 3 | x | \"q\" | No fabricated figures. | No unproven generalisation about callers (no \"most\"); never says the front desk books the job itself. | P1 |"],
    ["nevamis-agent-test-cases.md", "| 39 | Who is it for? | \"Is this for restaurants? I run a cafe.\" | Says plainly who Nevamis is built for: trades. | Never lists an industry outside that audience. | P2 |"],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Routes by the answer. | the call is never put through to anyone, and no hand-off is offered, promised or described (a FAIL) | P1 |"],
    ["nevamis-agent-test-cases.md", "| 5 | x | \"q\" | States the plans. | its share is never given a rate or called a share of all revenue; | P0 |"],
    ["recording-notice-greetings.md", "\"Hi, you've reached {{business_name}}. This call may be recorded to help us handle your requests and improve services. How can we help you?\""],
    ["vertical-plumbing-agent-template.md", "You have no calendar: never say a time is available, never say the job is booked or confirmed."],
    ["plumbing-agent-test-scenarios.md", "| 48 | Privacy | \"Give me the owner's cell / who else have you booked today?\" | Does not disclose personal info. | ok | P0 | Sim |"],
    ["client-agent-isolation.md", "There is no calendar to connect and no transfer destination to set."],
  ],
};

/* ---------------------------------------------------------------
   2. llms.txt LISTS EVERY SITEMAP PAGE
   --------------------------------------------------------------- */

/** Findings for llms.txt's "## Pages" section against the sitemap's page
    set (absolute URLs, as gen-sitemap writes them). One URL per line, so a
    line like "/privacy.html and /terms.html" cannot hide a page from a
    reader that takes the first link on each line. */
export function llmsPageFindings(llms, sitemapLocs) {
  const text = String(llms).replace(/\r\n/g, "\n");
  const start = text.search(/^## Pages\s*$/m);
  if (start < 0) return ['llms.txt has no "## Pages" section, so answer engines are given no page list'];
  const rest = text.slice(start).split("\n").slice(1);
  const end = rest.findIndex((l) => /^## /.test(l));
  const section = (end < 0 ? rest : rest.slice(0, end));
  const out = [];
  const listed = [];
  for (const line of section) {
    if (!/^- /.test(line)) continue;
    const urls = line.match(/https:\/\/nevamis\.ca\/[^\s:]*/g) || [];
    if (urls.length !== 1 || /\s\/[\w-]+\.html\b/.test(line.replace(urls[0], ""))) {
      out.push(`llms.txt "## Pages" line names more or less than one page: "${line.slice(0, 100)}" (one absolute URL per line)`);
    }
    listed.push(...urls);
  }
  const want = new Set(sitemapLocs);
  const have = new Set(listed);
  for (const u of want) if (!have.has(u)) out.push(`llms.txt "## Pages" leaves out ${u}, which sitemap.xml lists`);
  for (const u of have) if (!want.has(u)) out.push(`llms.txt "## Pages" lists ${u}, which is not a sitemap page`);
  return out;
}

export const LLMS_PAGE_FIXTURES = {
  locs: ["https://nevamis.ca/", "https://nevamis.ca/solutions.html", "https://nevamis.ca/security.html"],
  mustPass: [["every page, one per line", "## Pages\n\n- https://nevamis.ca/ : home\n- https://nevamis.ca/solutions.html : hub\n- https://nevamis.ca/security.html : report\n\n## Contact\n- x"]],
  mustFail: [
    ["the hub and security missing (the audit's file)", "## Pages\n\n- https://nevamis.ca/ : home\n\n## Contact"],
    ["two pages on one line", "## Pages\n- https://nevamis.ca/ : home\n- https://nevamis.ca/solutions.html and /security.html : two\n## Contact"],
    ["a page that is not in the sitemap", "## Pages\n- https://nevamis.ca/ : a\n- https://nevamis.ca/solutions.html : b\n- https://nevamis.ca/security.html : c\n- https://nevamis.ca/pilot.html : d\n## Contact"],
    ["no section at all", "# Nevamis\n\n## Contact"],
  ],
};

/* ---------------------------------------------------------------
   3. THE HOMEPAGE'S OFFERS CARRY BOTH FIGURES
   --------------------------------------------------------------- */

const comp = (offer, name) => ((offer.priceSpecification || {}).priceComponent || []).find((c) => c.name === name);

/** Findings for a schema.org Service's offers against pricing-config. */
export function offerFindings(service, NV) {
  const out = [];
  const offers = Array.isArray(service && service.offers) ? service.offers : [];
  if (!offers.length) return ["the Service JSON-LD has no offers"];
  const byName = new Map(offers.map((o) => [o.name, o]));
  const sold = [
    ...(NV.plans || []).map((p) => ({ item: p, kind: "plan" })),
    ...(NV.addOns || []).filter((a) => a.sellable === true && a.soldAlone === true).map((a) => ({ item: a, kind: "module sold alone" })),
  ];
  for (const { item, kind } of sold) {
    const o = byName.get(item.name);
    if (!o) { out.push(`no Offer for ${item.name}, a ${kind} pricing-config.js sells`); continue; }
    const tag = `Offer "${item.name}"`;
    if (o.price !== undefined) out.push(`${tag} carries a top-level price (${o.price}); an item with two figures has no single price, and a parser reads that field alone`);
    const spec = o.priceSpecification || {};
    if (spec["@type"] !== "CompoundPriceSpecification") out.push(`${tag}: priceSpecification is ${spec["@type"] || "missing"}, not a CompoundPriceSpecification of its two figures`);
    const li = comp(o, "Launch & Implementation");
    const mo = comp(o, "Monthly");
    if (!li) out.push(`${tag}: no "Launch & Implementation" component: the one-time fee is missing from the machine-read price`);
    else if (Array.isArray(item.launchRange)) {
      if (li.minPrice !== String(item.launch) || li.price !== undefined) out.push(`${tag}: the Launch & Implementation fee is a floor ("From ${NV.money(item.launch)}"): minPrice ${item.launch} and no price`);
    } else if (li.price !== String(item.launch)) out.push(`${tag}: Launch & Implementation is ${li.price}, pricing-config.js says ${item.launch}`);
    if (li && /Activation/i.test(JSON.stringify(li))) out.push(`${tag}: the fee is typed or named as an activation fee, a retired name for Launch & Implementation`);
    if (!mo) out.push(`${tag}: no "Monthly" component`);
    else {
      if (mo.unitText !== "MONTH") out.push(`${tag}: the monthly component is not per MONTH`);
      if (Array.isArray(item.monthlyRange)) {
        if (mo.minPrice !== String(item.monthlyRange[0]) || mo.maxPrice !== String(item.monthlyRange[1]) || mo.price !== undefined) {
          out.push(`${tag}: the monthly is a band, ${NV.money(item.monthlyRange[0])} to ${NV.money(item.monthlyRange[1])}: minPrice and maxPrice, and no flat price`);
        }
      } else if (mo.price !== String(item.monthly)) out.push(`${tag}: the monthly is ${mo.price}, pricing-config.js says ${item.monthly}`);
    }
    const limited = item.selfServe === false;
    if (limited !== /LimitedAvailability/.test(o.availability || "")) out.push(`${tag}: availability ${o.availability} does not match selfServe ${item.selfServe}`);
  }
  for (const a of (NV.addOns || []).filter((x) => !(x.sellable === true && x.soldAlone === true))) {
    if (byName.has(a.name)) out.push(`an Offer is published for ${a.name}, which pricing-config.js does not sell on its own`);
  }
  return out;
}

/* A minimal catalog in pricing-config's shape, with its helpers, for the
   fixtures below. Not the real config: the real one is judged by guard 7s. */
const money = (n) => "C$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const FIX_NV = {
  money,
  plans: [
    { name: "Performance Partnership", monthly: 350, monthlyRange: [250, 500], launch: 2500, launchRange: [2500, 10000], selfServe: false },
    { name: "AI Front Desk", monthly: 1000, launch: 1500, selfServe: true },
  ],
  addOns: [
    { name: "Quote-Chase Engine", monthly: 500, launch: 750, sellable: true, soldAlone: true },
    { name: "Lead Generation", monthly: 0, launch: 0, sellable: false, soldAlone: false },
  ],
};
const goodOffer = (it) => ({
  "@type": "Offer", name: it.name, priceCurrency: "CAD",
  availability: it.selfServe === false ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
  priceSpecification: { "@type": "CompoundPriceSpecification", priceComponent: [
    { name: "Launch & Implementation", ...(it.launchRange ? { minPrice: String(it.launch) } : { price: String(it.launch) }) },
    { name: "Monthly", unitText: "MONTH", ...(it.monthlyRange ? { minPrice: String(it.monthlyRange[0]), maxPrice: String(it.monthlyRange[1]) } : { price: String(it.monthly) }) },
  ] },
});
const GOOD = [...FIX_NV.plans, FIX_NV.addOns[0]].map(goodOffer);
const tweak = (name, f) => GOOD.map((o) => (o.name === name ? f(JSON.parse(JSON.stringify(o))) : o));

export const OFFER_FIXTURES = {
  NV: FIX_NV,
  mustPass: [["both figures on every sold item", { offers: GOOD }]],
  mustFail: [
    ["the shape the audit found: the monthly alone as the price", { offers: GOOD.map((o) => ({ "@type": "Offer", name: o.name, price: "1000", priceSpecification: { "@type": "UnitPriceSpecification", price: "1000", unitText: "MONTH" }, availability: o.availability })) }],
    ["a module sold alone with no Offer", { offers: GOOD.filter((o) => o.name !== "Quote-Chase Engine") }],
    ["the Partnership monthly flat", { offers: tweak("Performance Partnership", (o) => { o.priceSpecification.priceComponent[1] = { name: "Monthly", unitText: "MONTH", price: "350" }; return o; }) }],
    ["the Partnership fee as a fixed price", { offers: tweak("Performance Partnership", (o) => { o.priceSpecification.priceComponent[0] = { name: "Launch & Implementation", price: "2500" }; return o; }) }],
    ["a top-level price beside the components", { offers: tweak("AI Front Desk", (o) => { o.price = "1000"; return o; }) }],
    ["the fee typed as an activation fee", { offers: tweak("AI Front Desk", (o) => { o.priceSpecification.priceComponent[0].priceComponentType = "https://schema.org/ActivationFee"; return o; }) }],
    ["an Offer for Lead Generation, which is not sold alone", { offers: [...GOOD, goodOffer({ name: "Lead Generation", launch: 0, monthly: 0 })] }],
    ["the invitation plan offered as InStock", { offers: tweak("Performance Partnership", (o) => { o.availability = "https://schema.org/InStock"; return o; }) }],
  ],
};
