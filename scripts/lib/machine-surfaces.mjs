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

/* What withdraws a claim anywhere in its own unit, used only by the
   greeting rules (their unit is one quoted greeting). "without" is NOT
   here: "owns being an AI without defensiveness" is no denial. */
const NEG = /\b(?:not|never|no|cannot|nothing|none|nor|neither|fail|fails|failure|forbids?|forbidden|retired|banned|false|isn't|doesn't|don't|won't|can't)\b/i;

/* What withdraws a claim for the claim rules (transfer, client-books,
   front-desk-books, missed-call-hours, audience). A negation word anywhere
   in the unit does NOT: "Offers to transfer the caller to Daren now and
   never argues" makes the claim and then denies something else. Only:
   - a denial right in FRONT of the claim word, within 40 characters and in
     the claim's own clause ("does not transfer calls", "no calendar to
     connect"; but "does not book appointments but sends callers
     confirmations" and "no calendar to connect, so the agent books the job"
     still make their second claim);
   - a denial as the claim's own object ("books nothing", "puts no call
     through");
   - a grader's verdict ON the claim (the catalogues grade a claim by naming
     it and calling it a FAIL or "a P0 failure", or say a guard fails the
     file if it comes back, or that the prompt forbids it), or a changelog
     line about an earlier version ("v1 told the operator to wire a
     calendar"). These are exact phrases on purpose: a stray "fail", "false"
     or "never" in a sales sentence excuses nothing.

   THE DENIAL AND THE VERDICT MUST GOVERN THE CLAIM, not merely share its
   unit (polish-machine review, 2026-10-03). Two leftovers of the old
   unit-wide excuse let ordinary sales phrasing through:
   - a denial in front of the claim crossed "and", a comma and a colon, so
     "Never argues and transfers the caller to Daren.", "It doesn't just
     answer, it transfers the caller to you.", "No voicemail, no waiting:
     the agent transfers the call." and "The front desk does not miss a call
     and books the job." all passed. A denial now stops at every clause
     edge: ".", ";", "|", ",", ":", "and" and the contrast and result words.
     The cost is deliberate and errs safe: "does not book, confirm or
     transfer" is read as denying only "book", so a true sentence is written
     with its own denial per claim ("does not book, does not confirm"),
     which is how every agent document already writes it. "or" and "nor"
     are not edges: "never says the job is booked or confirmed" denies both.
   - a negation that turns the claim positive is no denial: "not just",
     "not only", "doesn't just", and "don't forget", "never misses", "never
     fails to", "never skips" ("Don't forget to connect the client's
     calendar." passed).
   - the verdict counted anywhere in the unit, so a stray "retired" or "is a
     failure" excused every claim beside it ("Offers to transfer the caller
     to Daren, as the old voicemail is retired."). A verdict now counts only
     when it CLOSES the claim's own clause (the claim, then "... is a FAIL"
     or "... is an automatic failure" with no clause edge between), or when
     the claim is its OBJECT (the verdict, then the claim, inside one
     clause: "the prompt forbids a transfer", "guard 7q fails this file if a
     booking, a confirmation or a transfer comes back", "v1 graded a client
     agent on booking into a calendar"). A comma list stays one object, so
     the clause edges for a verdict are the sentence marks and a comma that
     opens a new clause (", and", ", so", ", as"), never a bare list comma.

   AND IT MUST GOVERN IT GRAMMATICALLY (polish-machine fix-up review,
   2026-10-03). Sharing the claim's clause was still not enough: "No more
   missed calls for salons.", "No contract needed for dental clinics.",
   "There is no doubt the front desk books the job.", "Callers never wait as
   the front desk books the job." and "Not a problem - it transfers callers
   to Daren." all passed, because the denial stood on a word of its own
   ("calls", "contract", "doubt", "wait", "problem") and only shared the
   claim's clause. A denial in front of the claim now withdraws it only when
   it governs it:
   - DIRECTLY: nothing but auxiliaries, determiners and a few adverbs and
     adjectives stand between them ("does not transfer", "there is no live
     transfer", "no calendar to connect");
   - through a VERB THAT TAKES THE CLAIM as its object or complement ("never
     says the job is booked", "does not send callers confirmations", "never
     offers a transfer", "is not built for salons"), up to the clause's edge
     or to a "for" after the verb's own object ("never offers a contract
     for salons" still serves salons); or
   - across "or"/"nor", which a negation distributes over ("never argues or
     transfers", "neither books nor confirms"): the words after the last
     "or" must govern the claim directly.
   Any other word between them is the denial's own object, and the claim
   stands. A dash, "as" and "since" are clause edges too.

   A verdict in front of the claim ends its object at a coordinated
   predicate: "It bans hold music and transfers the caller to Daren.",
   "The prompt forbids voicemail, requires a transfer to Daren." ("and" or
   a comma, then a verb in -s with its own object: "transfers the", "puts
   the", "requires a"). A bare list stays one object ("forbids holds and
   transfers.", "a booking, a confirmation or a transfer").

   A verdict that closes a NEGATED claim makes it required, not forbidden:
   "Failing to transfer the caller to Daren is a FAIL." and "Not
   transferring the caller is a FAIL." grade the transfer as the passing
   behaviour, so they are claims. And "or it is a FAIL" opens a clause of
   its own: "Must transfer the caller to Daren or it is a FAIL." (A bare
   "or" is not an edge after the claim: "books into a calendar, sends
   callers a confirmation or reminder, or puts a call through to a person
   is a P0 failure" is one subject with one verdict.) */
const DENIAL_WORD = /\b(?:no|never|not|cannot|nor|neither|none|nothing|isn't|doesn't|don't|won't|can't)\b(?!\s+(?:just|only|merely|simply|forget|forgets|forgetting|forgot|fail|fails|failing|failed|hesitate|hesitates|hesitating|hesitated|neglect|neglects|neglecting|skip|skips|skipping|miss|misses|missing|missed|omit|omits|omitting|stop|stops|stopping)\b)/gi;
const DENIAL_EDGE = /[.;|,:\u2013\u2014]|\s-\s|\b(?:and|but|yet|however|though|although|instead|while|whereas|so|then|because|as|since)\b/i;
const DENIAL_AFTER = /^\s+(?:nothing|none|no)\b/i;
/* Words that may stand between a denial and the claim it governs directly. */
const DENIAL_GAP = /^(?:is|are|was|were|be|been|being|am|do|does|did|will|would|can|could|should|shall|may|might|must|has|have|had|ever|even|yet|also|always|directly|itself|actually|really|currently|a|an|the|any|its|their|your|our|his|her|this|that|these|those|one|single|to|live|real|actual|direct|warm|automatic|phone|human)$/i;
/* Verbs whose object or complement is the claim: a denial on the verb
   denies what it says, offers, sends or is built for. */
const GOVERNING = "say tell offer promise describe state claim imply mention suggest announce pretend send give list present grade need use build make design mean sell market serve include perform attempt try set wire exist happen support handle work go agree confirm confuse mistake book transfer schedule connect put";
const IRREGULAR = "said told sent gave given built made designed meant sold went put set";
/* Every inflection of each verb: says, offered, offering, implies, ... */
const DENIAL_GOVERNS = new Set(IRREGULAR.split(" ").concat(GOVERNING.split(" ").flatMap((v) => {
  const e = v.endsWith("e") ? v.slice(0, -1) : v;
  const y = /[^aeiou]y$/.test(v) ? v.slice(0, -1) : null;
  return [v, `${v}s`, `${v}es`, `${e}ed`, `${e}ing`, `${v}ing`, ...(y ? [`${y}ies`, `${y}ied`] : [])];
})));
const governsDirectly = (words) => words.every((w) => DENIAL_GAP.test(w));

/** A denial word in front of the claim at `at`, within 40 characters, in
    the claim's own clause, that governs it (see above). */
function deniedBefore(u, at) {
  const head = u.slice(0, at);
  for (const d of head.matchAll(DENIAL_WORD)) {
    const between = head.slice(d.index + d[0].length);
    if (between.length > 40 || DENIAL_EDGE.test(between)) continue;
    const words = between.split(/[^\w'-]+/).filter(Boolean);
    const first = words.findIndex((w) => !DENIAL_GAP.test(w));
    if (first < 0) return true;
    /* The verb's object ends at "for": "is not built for salons" denies
       the audience, "never offers a contract for salons" does not. */
    const rest = words.slice(first + 1).map((w) => w.toLowerCase());
    const forAt = rest.indexOf("for");
    const objectEnds = forAt > 0 && !governsDirectly(rest.slice(0, forAt));
    if (DENIAL_GOVERNS.has(words[first].toLowerCase()) && !objectEnds) return true;
    const lower = words.map((w) => w.toLowerCase());
    const last = Math.max(lower.lastIndexOf("or"), lower.lastIndexOf("nor"));
    if (last >= 0 && governsDirectly(words.slice(last + 1))) return true;
  }
  return false;
}
/* A verdict in front of the claim that takes the claim as its object: a verb
   or a changelog line, whose object runs to the end of its clause. */
const VERDICT_BEFORE = /\bfails this file if\b|\b(?:forbids?|forbidding|bans?|banning)\b|\bv\d+\s+(?:of this \w+\s+)?(?:told|graded|carried|said|set|had|listed)\b|\bRows?\s+\d+(?:(?:,\s*|\s+and\s+)\d+)*\s+(?:told|graded|carried|said|set|had|listed)\b|\b(?:(?:is|are)\s+(?:an?\s+)?(?:[\w-]+\s+){0,2}failures?|is\s+a\s+FAIL),?\s+and\s+so\s+(?:is|are)\b/gi;
/* "retired", "banned" or "forbidden" as an adjective governs only the noun
   it stands on: "the retired booking tool", "a banned transfer promise".
   "The retired voicemail script says the receptionist books jobs" is a
   claim about the receptionist. */
const VERDICT_ADJ = /\b(?:retired|banned|forbidden)\s+(?:[\w-]+\s+)?$/i;
/* A verdict after the claim that closes the claim's clause. */
const VERDICT_AFTER = /\bFAIL\b|\b(?:is|are)\s+(?:an?\s+)?(?:[\w-]+\s+){0,2}failures?\b|\b(?:is|are|was|were)\s+(?:forbidden|banned|retired)\b|\bwhich\s+(?:[\w-]+\s+){0,3}(?:forbids|bans)\b|\bfails this file\b/;
/* Where a verdict's clause ends. A bare comma is a list, not an edge. */
const VERDICT_EDGE = /[.;|]|,\s*(?:and|but|so|as|because|since|while|whereas|then|yet|though|although)\b|\band\s+(?:it|they|we|you|he|she|the (?:agent|assistant|front desk|line|demo line))\b|\b(?:so|because|since|whereas|while)\b/i;
/* In front of the claim, a verdict's object also ends at a coordinated
   predicate: "and" or a comma, then a verb in -s that takes its own object
   ("and transfers the caller", ", requires a transfer"). */
const VERDICT_EDGE_BEFORE = new RegExp(`${VERDICT_EDGE.source}|(?:,|\\band)\\s+(?:also\\s+|then\\s+|instead\\s+)?(?!(?:a|an|the|any|its|this|that|no)\\b)[a-z]+s\\s+(?:the|a|an|any|them|you|him|her|it|its|their|your|callers?|calls?|people|anyone|someone|to|through|back)\\b`, "i");
/* After the claim a bare "as" opens a new clause too ("..., as the old
   voicemail is retired"); in front of it "as" belongs to a changelog's own
   object ("set false or banned answers as the pass: ..."). So does an "or"
   that opens a clause ("... or it is a FAIL"). */
const VERDICT_EDGE_AFTER = new RegExp(`${VERDICT_EDGE.source}|\\bas\\b|:|\\bor\\s+(?:else\\b|(?:it|this|that|the\\s+(?:run|test|row))\\s+(?:is|was|fails)\\b)`, "i");
/* A claim the clause negates in front ("failing to transfer"): a verdict
   closing it grades the claim as REQUIRED. */
const failedBefore = (head) => /\b(?:fail(?:s|ed|ing|ure)?|refus(?:e|es|ed|ing)|neglect(?:s|ed|ing)?|omit(?:s|ted|ting)?)\s+to\s+(?:[\w-]+\s+){0,1}$/i.test(head);

/** A verdict closing the claim's clause after it. */
function closedByVerdict(u, end) {
  const tail = u.slice(end);
  const edge = tail.search(VERDICT_EDGE_AFTER);
  return VERDICT_AFTER.test(edge < 0 ? tail : tail.slice(0, edge));
}
/** A verdict in front that governs the claim at `at` as its object. The
    edge is searched past the claim's start, because the coordinated
    predicate is often the claim itself ("and transfers the caller"); only
    an edge that begins before the claim ends the verdict's object. */
function judgedBefore(u, at) {
  const head = u.slice(0, at);
  if (VERDICT_ADJ.test(head)) return true;
  for (const v of head.matchAll(VERDICT_BEFORE)) {
    const from = v.index + v[0].length;
    const edge = u.slice(from, at + 60).search(VERDICT_EDGE_BEFORE);
    if (edge < 0 || edge >= at - from) return true;
  }
  return false;
}
/* A claim is withdrawn by a denial or a verdict that governs it, unless a
   verdict closes a negated claim: "Not transferring the caller is a FAIL"
   requires the transfer. */
const deniedAt = (u, at, end) => {
  const negated = deniedBefore(u, at) || failedBefore(u.slice(0, at));
  if (closedByVerdict(u, end)) return !negated;
  return negated || DENIAL_AFTER.test(u.slice(end)) || judgedBefore(u, at);
};
/* The excuse for a rule whose claim word is the match itself (no key), or
   is each `key` inside the match: every one must be denied or judged. */
const deniedClaim = (key) => (u, m) => {
  if (!key) return deniedAt(u, m.index, m.index + m[0].length);
  const at = [...m[0].matchAll(key)].map((k) => [m.index + k.index, m.index + k.index + k[0].length]);
  return at.length > 0 && at.every(([s, e]) => deniedAt(u, s, e));
};

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
   it is false, which the failure prints. Judged unit by unit, on EVERY match
   in the unit; a quoted caller question is not a claim, and a match is
   withdrawn only by its rule's excuse (a denial in front of the claim), or,
   for a rule with no excuse, by a NEG word anywhere in its unit. */
export const AGENT_RULES = [
  { id: "transfer", files: () => true,
    re: /\btransfer(?:s|red|ring)?\b|transfer_to_number|\bput(?:s|ting)?\s+(?:you|them|the caller|the call|a call|calls|callers?)\s+through\b|\bconnect(?:s|ing)?\s+(?:you|them|the caller)\s+(?:to|with)\b|\bon-call\s+(?:transfer|hand-?off|number)\b/i,
    excuse: deniedClaim(),
    why: "no Nevamis line puts a caller through to anyone: a client agent's one call control is end_call, and the demo prompt's ESCALATION section forbids a transfer (decision #40). Grade a callback through notify_owner instead" },
  { id: "client-books", files: isClientDraft, quotes: true,
    re: /\bbook(?:s|ed|ing)?\b|\bcalendars?\b|\bconfirmation text\b/i,
    excuse: deniedClaim(),
    why: "a client agent has no calendar and no booking tool: it takes the job and the time the caller wants, and the owner confirms the slot" },
  { id: "front-desk-books", files: isDemoLine,
    re: /\b(?:front desk|client'?s (?:line|agent|front desk)|receptionist)\b[^.;|]*\b(?:books?|booking|calendar|confirmations?|reminders?)\b|\b(?:books?|booking|calendar|confirmations?|reminders?)\b[^.;|,]{0,40}\b(?:front desk|client'?s (?:line|agent|front desk)|receptionist)\b/i,
    /* The claim is the booking word: each one in the match must be denied
       ("the AI Front Desk does not book appointments, does not send callers
       confirmations"). A booking word AFTER the subject is the subject's
       predicate however far it runs; one BEFORE it binds only inside one
       short clause ("reminders and confirmations come from the front
       desk"), so "this demo line books calls ..., and a client's line books
       nothing" is read as the client line's own claim. */
    excuse: deniedClaim(/\b(?:books?|booking|calendar|confirmations?|reminders?)\b/gi),
    why: "a client's front desk does not book into a calendar and sends callers no confirmation or reminder (knowledge base: 'does not book appointments, does not send callers confirmations')" },
  { id: "greeting-ai", files: (f) => /recording-notice-greetings\.md$/.test(f), lines: (l) => /^\s*"/.test(l), quotes: true,
    re: /\bAI\b/,
    why: "a greeting is given in the business's name and does not announce an AI; the agent says it is an AI the moment it is asked (llms.txt disclosure paragraph, canonical approvedGreeting)" },
  { id: "greeting-books", files: (f) => /recording-notice-greetings\.md$/.test(f), lines: (l) => /^\s*"/.test(l), quotes: true,
    re: /\bbook\b|\bschedul/i,
    why: "a greeting may not promise a booking: a client agent books nothing" },
  { id: "missed-call-hours", files: () => true,
    re: /(?:missed[- ]call|text-back|Missed-Call Recovery|Instant Lead Follow-Up|text back)[^.;|]*\bbusiness hours\b|\bbusiness hours\b[^.;|]*(?:missed[- ]call|text-back|text back)/i,
    excuse: deniedClaim(/\bbusiness hours\b/gi),
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
    excuse: deniedClaim(),
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
      const all = new RegExp(r.re.source, r.re.flags.includes("g") ? r.re.flags : r.re.flags + "g");
      const claimed = [...u.matchAll(all)].some((m) => !(r.excuse ? r.excuse(u, m) : NEG.test(u)));
      if (!claimed) continue;
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
    /* A false claim with an unrelated denial after it (fix-up review,
       2026-10-03): only a denial in front of the claim withdraws it. */
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Offers to transfer the caller to Daren now and never argues. | ok | P1 |"],
    ["nevamis-knowledge-base.md", "The front desk books the job straight into your calendar, so nothing is missed."],
    ["nevamis-knowledge-base.md", "Missed-Call Recovery texts back during business hours only, not overnight."],
    ["nevamis-knowledge-base.md", "We serve restaurants and dental clinics too, not only trades."],
    ["client-agent-isolation.md", "Connect the client's calendar so the agent can book, and never skip the recording notice."],
    ["nevamis-knowledge-base.md", "The AI Front Desk does not book appointments but sends callers confirmations."],
    ["vertical-plumbing-agent-template.md", "Book the job, and if no calendar is connected, take a message."],
    ["client-agent-isolation.md", "There is no calendar to connect, so the agent books the job itself."],
    ["plumbing-agent-test-scenarios.md", "| 24 | Routine booking happy path | \"Can you send someone out Thursday?\" | Collects details; books; confirms only after tool success. | ok | P0 | Sim |"],
    /* An unrelated denial IN FRONT of the claim, across "and", a comma or a
       colon, or a negation that makes the claim positive (polish-machine
       review, 2026-10-03). Each passed the judge before. */
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Never argues and transfers the caller to Daren. | ok | P1 |"],
    ["nevamis-knowledge-base.md", "It doesn't just answer, it transfers the caller to you."],
    ["nevamis-knowledge-base.md", "No hold music, it transfers you straight to Daren."],
    ["nevamis-knowledge-base.md", "No voicemail, no waiting: the agent transfers the call."],
    ["nevamis-knowledge-base.md", "Not just trades: dental clinics and salons too."],
    ["nevamis-knowledge-base.md", "We never miss a lead and serve dental clinics too."],
    ["nevamis-knowledge-base.md", "We serve not only plumbers but dental clinics too."],
    ["nevamis-knowledge-base.md", "The receptionist never sleeps and sends reminders."],
    ["nevamis-knowledge-base.md", "The front desk does not miss a call and books the job."],
    ["nevamis-knowledge-base.md", "The front desk never misses a booking."],
    ["client-agent-isolation.md", "Don't forget to connect the client's calendar."],
    /* A verdict that is not ON the claim: after it but in another clause,
       or in front of it and about something else. */
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Offers to transfer the caller to Daren, as the old voicemail is retired. | ok | P1 |"],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Voicemail is a failure, so the agent transfers callers to the owner. | ok | P1 |"],
    ["nevamis-knowledge-base.md", "The retired voicemail script says the receptionist books jobs."],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | The prompt forbids arguing and the agent transfers the caller. | ok | P1 |"],
    /* A verdict whose object ends at a coordinated predicate, a denial that
       stands on a word of its own, and a verdict that closes a NEGATED
       claim (polish-machine fix-up review, 2026-10-03). Each passed. */
    ["nevamis-knowledge-base.md", "It bans hold music and transfers the caller to Daren."],
    ["nevamis-knowledge-base.md", "Our policy forbids voicemail and puts the caller through to Daren."],
    ["nevamis-knowledge-base.md", "The prompt forbids voicemail and requires a transfer."],
    ["nevamis-knowledge-base.md", "The prompt forbids voicemail, requires a transfer to Daren."],
    ["nevamis-knowledge-base.md", "No more missed calls for salons."],
    ["nevamis-knowledge-base.md", "No contract needed for dental clinics."],
    ["nevamis-knowledge-base.md", "There is no wait for dental clinics."],
    ["nevamis-knowledge-base.md", "Never offers a contract for salons."],
    ["nevamis-knowledge-base.md", "There is no doubt the front desk books the job."],
    ["nevamis-knowledge-base.md", "Callers never wait as the front desk books the job."],
    ["nevamis-knowledge-base.md", "No caller waits since the agent transfers them."],
    ["nevamis-knowledge-base.md", "No voicemail - the agent transfers the call."],
    ["nevamis-knowledge-base.md", "Not a problem \u2014 it transfers callers to Daren."],
    ["nevamis-knowledge-base.md", "Not a problem \u2013 it transfers callers to Daren."],
    ["nevamis-knowledge-base.md", "Never hesitates to transfer the caller to Daren."],
    ["nevamis-knowledge-base.md", "Never hesitating to transfer the caller to Daren."],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Failing to transfer the caller to Daren is a FAIL. | ok | P1 |"],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Must transfer the caller to Daren or it is a FAIL. | ok | P1 |"],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Not transferring the caller to Daren is a FAIL. | ok | P1 |"],
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
    ["plumbing-agent-test-scenarios.md", "A client agent books nothing and puts no call through: it takes the job and the time wanted for the owner to confirm."],
    ["nevamis-agent-test-cases.md", "Any offer to put the caller through to a person is a FAIL."],
    ["plumbing-agent-test-scenarios.md", "In any scenario, telling a caller a job is booked or a time is confirmed is an automatic failure of that run."],
    /* The verdicts the catalogues really write, each ON its claim: a
       changelog whose object is a list, a guard that fails the file if a
       list comes back, a verdict closing a long claim, and "and so is". */
    ["nevamis-agent-test-cases.md", "Rows 4, 20, 24 and 25 graded the agent on offering and performing a live transfer, which its prompt forbids and the product does not have."],
    ["plumbing-agent-test-scenarios.md", "`scripts/check-consistency.js` guard 7q fails this file if a booking, a confirmation or a transfer comes back as passing behaviour."],
    ["plumbing-agent-test-scenarios.md", "- v2 (2026-10-03): v1 graded a client agent on booking into a calendar through a booking tool, on transferring calls and on a greeting that announced an AI, and a client agent does none of those."],
    ["nevamis-agent-test-cases.md", "In any scenario, saying or implying that a client's AI Front Desk books into a calendar, sends callers a confirmation or reminder, or puts a call through to a person is a P0 failure, and so is offering this caller a transfer: neither line transfers anyone."],
    ["vertical-plumbing-agent-template.md", "The retired booking tool is gone: there is no calendar to connect."],
    /* A denial per claim across a list, and "or" carrying one denial. */
    ["vertical-plumbing-agent-template.md", "You have no calendar: never say a time is available, never say the job is booked or confirmed, and never say a confirmation text is on its way."],
    /* A denial that governs its claim directly, through a verb that takes
       it, or across "or"; a verdict on a bare list. */
    ["nevamis-knowledge-base.md", "We do not serve salons."],
    ["nevamis-knowledge-base.md", "Nevamis is not built for dental clinics."],
    ["nevamis-knowledge-base.md", "There is no live transfer on this line."],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | Never argues or transfers the caller. | ok | P1 |"],
    ["nevamis-agent-test-cases.md", "| 24 | x | \"q\" | The prompt forbids holds and transfers. | ok | P1 |"],
    ["nevamis-knowledge-base.md", "A client's front desk does not book into a calendar and sends the caller no confirmation."],
    ["plumbing-agent-test-scenarios.md", "| 9 | x | \"q\" | Never agrees that the job is booked or the time confirmed. | ok | P0 | Sim |"],
    ["plumbing-agent-test-scenarios.md", "In any scenario, telling a caller a job is booked, or that they are being put through to someone, is an automatic failure of that run."],
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
