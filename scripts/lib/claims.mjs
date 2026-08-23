/* ============================================================
   COMMERCIAL-CLAIM CLASSIFICATION

   One definition of "does this text MAKE a retired claim, or DENY one", shared
   by every guard in check-consistency.js (6b, 7c, 7d, 7e, 7g).

   Extracted from check-consistency.js on 2026-08-10 while fixing a laundering
   defect in the classifier (see SCOPE below). Two reasons to move it rather
   than fix it in place: the rule is now big enough to need its own fixtures,
   and the fixtures have to be able to import it without running 1,400 lines of
   file-system guards as a side effect. scripts/check-claims-classifier.mjs is
   that fixture table, and it runs as part of `npm run check`.

   ============================================================
   SCOPE: A DENIAL GOVERNS ITS CLAUSE, NOT ITS SENTENCE

   THE DEFECT, found 2026-08-10 by a verifier and reproduced on pricing.html,
   a LIVE page. The classifier used to judge whole SENTENCES: a sentence was
   excused if a denial pattern matched anywhere in it. So

     "The C$150 pilot is retired, and Pro is C$850/month with 1,200 minutes."

   passed with exit 0 and no output. One clause about retirement excused three
   retired figures in the same sentence, one of them a wrong CURRENT price in
   the present tense. That is worse than having no guard: for two rounds the
   documented remedy for a failure here was to add a retirement banner or a
   denial sentence, and every document "fixed" that way had the rest of the
   sentence waved through unchecked.

   THE RULE NOW. A sentence is cut into clauses. Then:

     1. a clause that carries its own denial is excused;
     2. a clause that makes NO assertion of its own — a bare fragment, an
        enumeration item, a trailing qualifier — inherits a denial from
        anywhere in its sentence;
     3. a clause that DOES assert must carry its own denial, or it is judged.

   Rule 2 is what keeps the guard usable, and it is not a loophole, because a
   fragment cannot state a price on its own authority. It is the reason

     "Never state a setup, activation, onboarding, implementation or launch charge."   (llms.txt)
     "There is no pilot, paid or free, at C$150 or any other price."

   still pass: everything after the first comma is a list item hanging off the
   one denial at the front. Rule 3 is what catches the laundering, because
   "and Pro is C$850/month" has a subject and a verb and is making its own
   claim regardless of what the clause before it withdrew.
   ============================================================ */

/* A sentence that FORBIDS a phrase contains that phrase. Judging a whole file
   therefore fails the documents doing the most to prevent the thing being
   guarded: the live agent's prompt, whose retired-price line reads "never
   quote these ... and any free pilot or free trial", and the outreach README's
   "There is no free pilot and no free trial, both were retired." Two permanent
   red entries that were correct content, which is precisely how a checker
   stops being read.

   Same classification the engine's checkText uses (OFFER_DENIAL in
   src/domain/canonical.ts). Classified, not allowlisted: an allowlist of those
   two sentences leaves the third unguarded.

   Hoisted to module scope on 2026-08-09 so guard 7d can hold HTML pages to the
   same standard. A page that says "there is no pilot" has to be able to say
   the word, or the only page telling a visitor the truth is the one that
   fails. */
export const DENIAL = [
  /* "state", "charge", "describe" and "list" added 2026-08-10 with the widened
     ADDITIVE list. llms.txt already said "Never state a setup, activation,
     onboarding, implementation or launch charge" and the classifier did not
     recognise it as a denial, so the first surface to fail the new patterns
     was the surface instructing every answer engine not to make the claim. */
  /* "call" joined 2026-08-15 (evening): "never call the Launch &
     Implementation fee a setup fee" is the sentence that defends the fee's
     one name, and it has to be able to say the retired name it forbids. */
  /\bnever\s+(?:quote|say|offer|promise|use|mention|state|charge|describe|list|call)\b/i,
  /\b(?:is|are|was|were)\s+retired\b/i, /\bretired\b/i,
  /\bthere is no\b/i, /\bthere are no\b/i, /\bwe do not\b/i, /\bdo not\s+(?:quote|say|offer|promise)\b/i,
  /\bno longer\b/i, /\bnot a current\b/i, /\bsuperseded\b/i, /\bprohibited\b/i,
  /* Added with guard 7d. A page that answers "is there a trial?" with "no,
     and here is why" is the correct handling of a retired offer, and it needs
     to be able to name what it is refusing. */
  /\bwe don't\b/i, /\bno pilot\b/i, /\bno trial\b/i, /\bnot offered\b/i, /\bused to\b/i,
  /* "No setup fee" remains a legal DENIAL OF RETIRED VOCABULARY: "setup fee",
     "activation fee" and "onboarding fee" are retired NAMES, and a surface may
     still say the one-time fee is not called that. Before these entries
     existed, guard 7c failed the sentence stating the thing it exists to
     protect, and its remediation text told the writer to restore the
     two-number offer. */
  /\bno setup fee\b/i, /\bno activation fee\b/i, /\bno one-time setup\b/i,
  /\bnothing to set up\b/i, /\bno set-up fee\b/i, /\bno setup or activation\b/i,
  /\bno onboarding fee\b/i, /\bno onboarding charge\b/i,
  /* "no implementation fee", "no implementation charge" and "no launch
     (fee|charge)" were denials here until 2026-08-15 (evening). They are GONE
     from this allowlist and are now offences in RETIRED_OFFERS: the Launch &
     Implementation fee is a real, published, one-time charge, and denying it
     is the new false claim. Do not re-add them; see FALSE_DENIALS below. */
];

/* The two sentence-level pricing detectors, hoisted here on 2026-08-10 so that
   guards 7c, 7d and 7e share ONE definition of each.

   They were block-locals, and that is the mechanical reason this repository
   shipped a directory nobody price-checked. Extending the rules to
   config/elevenlabs/ meant either moving these lists or copying them, and a copy
   drifts from the original the first time a pattern is added to one of them.
   Add a pattern here and every surface gets it at once, which is the only
   arrangement that survives the next pricing change. */
export const ADDITIVE = [
  /one-time setup/i,
  /\bsetup fee\b/i,
  /plus (?:a )?(?:one-time )?setup/i,
  /\+\s*(?:one-time )?setup/i,
  /* Added 2026-08-10. The error string this guard PRINTS has named activation
     and onboarding charges since 7c was written, and not one of them was
     detectable: the list only knew the word "setup". A guard that tells you
     about forbidden charges and can only see one is worse than an honest
     guard that sees one, because the error text is what the next reader
     believes the coverage to be. */
  /\bactivation fee\b/i,
  /\bonboarding fee\b/i,
  /* /\bimplementation fee\b/, /\blaunch (?:fee|charge)\b/ and
     /\bone-time (?:fee|charge)\b/ were REMOVED 2026-08-15 (evening): they are
     now the CORRECT vocabulary. The published model carries a one-time
     "Launch & Implementation" fee, charged at the start beside the first
     month, and the approved sentence shape is "C$1,000 Launch &
     Implementation to start, then C$750 a month" — joined by "to start" and
     "then", never by "plus"/"+"/"and". The additive-join patterns above still
     stand, and "setup fee"/"activation fee"/"onboarding fee" remain retired
     NAMES for it. */
];

/* RETIRED_OFFERS carried only the two figures that were retired on 2026-08-09
   (C$150 and C$850) and none of the ladder retired on 2026-08-06. Everything
   below the first block was added 2026-08-10 after a check proved the guard
   passed green on "Core is C$249/month and Growth is C$449/month. Pro includes
   1,200 minutes, roughly 400 to 600 calls." going into the live agent's
   knowledge base.

   Three shapes are needed for each retired figure, not one:
     - written  ($849, C$849, 849/month)
     - SPOKEN   (eight hundred and forty-nine dollars) - config/elevenlabs/
       feeds a VOICE agent and its own prompt documents that prices are written
       as words on purpose, so the digit form alone guards nothing there
     - bare $ as well as C$ - /\bC\$\s?850\b/ let plain "$850" walk through,
       which is the exact form ai-assistant/SALES_PITCH.md uses. */
/* DENIALS OF THE LAUNCH FEE, added 2026-08-15 (evening). These are the
   inversion of the 2026-08-09 model: the one-time Launch & Implementation
   fee is real and published, so a surface that DENIES it — "no
   implementation fee", "no launch charge", "one recurring monthly price",
   "nothing charged to start" — is making the new false claim. Kept as their
   own list because offendingClause() refuses every excuse for them: the
   pattern IS a denial, so the denial allowlist would launder every
   occurrence, and it has no finite verb, so the fragment rule would launder
   the rest. Only a quoted caller question is excused, where the guard allows
   questions at all. The negative lookbehinds keep the fee's own NAME safe:
   "never call the Launch & Implementation fee a setup fee" must not fire. */
export const FALSE_DENIALS = [
  /\bno (?:(?<!launch & )(?<!launch and )implementation|launch)[- ](?:fee|charge)s?\b/i,
  /\bno launch (?:&|and) implementation fee\b/i,
  /\b(?:no|never)\b[^.;:!?]{0,160}?\b(?:fee|charge)s?,[^.;:!?]{0,120}?\b(?:(?<!launch & )(?<!launch and )implementation|launch)[- ](?:fee|charge)s?\b/i,
  /\bone recurring (?:monthly )?price\b/i,
  /\bnothing (?:is )?charged (?:to (?:start|begin)|before|up ?front)\b/i,
  /\bnothing to pay (?:before|up ?front|to start|to begin)\b/i,
];

export const RETIRED_OFFERS = [
  /\b\d+[- ]day live pilot\b/i,
  /\b(?:7|seven)[- ]day pilot\b/i,
  /\b(?:14|fourteen)[- ]day pilot\b/i,
  /\bpilot fee\b/i,
  /\bpaid pilot\b/i,
  /\bfree pilot\b/i,
  /\bpilot (?:price|credit)\b/i,
  /\bC\$\s?150\b/,
  /\bC\$\s?850\b/,
  /\bfirst month\s+C\$/i,
  /\bthen\s+C\$[\d,]+\s*\/\s*month/i,
  /\bcredited toward your first month\b/i,
  /\bcomes off (?:that|your) first month\b/i,

  /* The retired ladder, written. Anchored to a currency mark or to a
     per-month phrase so that a bare "449" in a pixel value, a year or a
     phone number cannot trip it. 250/750/1000 are CURRENT monthlies and
     1000/2000/5000 are CURRENT launch fees, all absent by design; 850 keeps
     its C$-only entry above and gains the bare-$ form here. 500 joined
     2026-08-15 (evening): it was Growth's month from 2026-08-09 until the
     OPERATE/GROW/PARTNERSHIP ladder landed, and no surface may quote it. */
  /(?:C\$|\$)\s?(?:49|150|197|249|397|449|499|500|750|797|849|850)\b(?!\d)/,
  /\b(?:49|150|197|249|397|449|499|500|750|797|849|850)\s*(?:dollars?\s*)?(?:a|per|\/)\s*month\b/i,

  /* The retired ladder, spoken. This is the form that reaches a prospect's
     ear from config/elevenlabs/. "five hundred" joined with the written 500:
     the cold-calling kit spoke it ("five hundred a month"). "seven hundred
     and fifty" joined 2026-08-22 when v4 retired Grow's month.

     THE TENS LOOKBEHINDS joined the same day, for the same directive:
     "twenty-five hundred dollars" is the live Works launch fee said out
     loud, and without them the "five hundred" inside it reports as the
     retired figure — a live price failing as a dead one on the day it
     shipped. Same fix, same day, as the engine's SPOKEN_NOT_A_TAIL. */
  /(?<!twenty[- ])(?<!thirty[- ])(?<!forty[- ])(?<!fifty[- ])(?<!sixty[- ])(?<!seventy[- ])(?<!eighty[- ])(?<!ninety[- ])\b(?:forty[- ]nine|one hundred and fifty|two hundred and forty[- ]nine|three hundred and ninety[- ]seven|four hundred and forty[- ]nine|five hundred|seven hundred and fifty|eight hundred and forty[- ]nine|eight hundred and fifty)\s+dollars\b/i,
  /(?<!twenty[- ])(?<!thirty[- ])(?<!forty[- ])(?<!fifty[- ])(?<!sixty[- ])(?<!seventy[- ])(?<!eighty[- ])(?<!ninety[- ])\b(?:five hundred|seven hundred and fifty)\s+(?:dollars\s+)?a month\b/i,

  /* Retired entitlements. Pro was 1,200 minutes and "400 to 600 calls" until
     2026-08-09; both are now 1,400 and 470 to 700. A surface can carry the
     right price and the wrong allowance, and nothing above would see it. */
  /\b1[,.]?200\s+(?:AI\s+)?minutes\b/i,
  /\b400\s*(?:to|-|–|—)\s*600\s+calls\b/i,

  /* Retired plan names. "After Hours" and "Scale" became Core and Pro on
     2026-08-06; "Core", "Growth" and "Pro" became Performance Partnership,
     Grow and Operate on 2026-08-15 (evening). Deliberately requires the word
     plan or tier beside the name: this site sells after-hours answering, has
     a page called after-hours-answering.html, uses "grow"/"pro" as ordinary
     words, and "Growth" (retired) is word-bounded so the live name "Grow"
     never matches inside it. */
  /\b(?:After[- ]Hours|Scale)\s+(?:plan|tier)\b/i,
  /* Case-sensitive on purpose: "Core", "Growth" and "Pro" are retired NAMES,
     while "a growth plan for your business" is ordinary lowercase English and
     must not fire. */
  /\b(?:Core|Growth|Pro)\s+(?:plan|tier)\b/,
  /\bPay[- ]As[- ]You[- ]Go\b/i,

  /* DENIALS OF THE LAUNCH FEE, added 2026-08-15 (evening); the patterns live
     in FALSE_DENIALS below and are spread in here so every guard sweeps
     them. */
  ...FALSE_DENIALS,
];

/* CAVEAT worth knowing before writing plain text for a swept surface: this
   splits on any newline as well as on sentence ends, so a hard-wrapped
   sentence in a .txt or .md file is two sentences to this function. Put the
   retired phrase and the word retiring it on the SAME physical line. The
   split is deliberately that eager: bullet lists in these files often have no
   terminating punctuation, and merging them would let one denial excuse every
   claim in the list. */
export const splitSentences = (text) => text
  .replace(/\*\*|__|\*/g, "")
  .split(/(?<=[.!?])\s+|\n+/);

/* ---------- clause boundaries ----------

   THE TWO SPLITS THAT LOOK OBVIOUS AND ARE WRONG, both verified against the
   real corpus before this list was settled:

     a bare comma  would cut "C$1,000" and "1,200 minutes" in half, and
                   /\b1[,.]?200\s+minutes\b/ is a RETIRED_OFFERS pattern. The
                   fix that made the guard stricter would have made it blind to
                   a retired entitlement. Hence `,(?!\d)`.

     a bare " and " would cut "eight hundred and fifty dollars" into "eight
                   hundred" and "fifty dollars". EVERY spoken retired price in
                   RETIRED_OFFERS is of the form "<n> hundred and <n>", and
                   config/elevenlabs/ is the surface that writes prices as
                   words on purpose. Splitting there would have silently
                   disarmed the voice agent's entire price guard. Hence the
                   negative lookbehind for a number scale word.

   " or " is deliberately NOT a boundary. In this corpus "or" joins nouns
   inside one predicate — "no setup or activation fee", "no pilot, paid or
   free", "implementation or launch charge" — so cutting there strands the
   noun from the denial that governs it. "and"/"but" join assertions; "or"
   joins alternatives.

   "|" is a boundary because config/elevenlabs/*.md keeps its acceptance
   criteria in markdown TABLES, where each cell is an independent statement and
   the row is one physical line. Without it, row 7 of nevamis-agent-test-cases.md
   welded a quoted caller question ("Is there a setup fee on top of the
   monthly?") to the answer three cells away. */
const CLAUSE_SPLIT =
  /;|\||,(?!\d)|(?<!\b(?:hundred|thousand|million))\s+(?:and|but|yet|while|whereas|however|although|though)\s+/i;

export const splitClauses = (sentence) =>
  sentence.split(CLAUSE_SPLIT).map((c) => (c || "").trim()).filter(Boolean);

/* Does this clause make a claim on its own authority, or is it a fragment
   hanging off the clause before it?

   A finite verb is the test, because that is what turns a noun phrase into an
   assertion. "and Pro is C$850/month" asserts. "activation", "or a launch
   charge", "at C$150 or any other price" do not — they cannot state a price
   without borrowing the verb from the clause that governs them, and that
   clause is the one carrying the denial.

   EVERY WORD HERE IS UNAMBIGUOUSLY A VERB, and the omissions cost real
   findings before they were made. The first draft included charge/cost/bill/
   list/quote/start/run/pay/add, which are all nouns in this corpus:

     "implementation fee or launch charge"  (terms.html)   read "charge" as a verb
     "the Pay As You Go plan at C$49"       (knowledge base) read "Pay" as a verb

   Both are denied list items, and both were reported as live claims. A noun
   misread as a verb turns a fragment into an assertion, and an assertion has
   to carry its own denial — so the price of a loose list here is a false
   positive on exactly the sentences that do the denying. */
const ASSERTS = /\b(?:is|are|isn'?t|aren'?t|was|were|wasn'?t|weren'?t|be|been|being|has|have|had|includes?|remains?|becomes?|will|would|shall|should|can|could|may|might|must)\b/i;

/* The words that are a verb or a noun depending on where they stand, which is
   most of the words a price sentence actually uses: costs, charges, starts,
   runs, bills, pays. Leaving them out of ASSERTS let a real claim through —

     "The seven-day pilot is retired and Growth costs C$449 a month."

   — and putting them in ASSERTS produced the two false positives above, where
   "charge" and "Pay" are nouns. Neither list can settle it, because the word
   is genuinely ambiguous; only its POSITION settles it.

   So these are accepted only when the verb is what INTRODUCES the figure: the
   text between the verb and the matched claim must be nothing but a hedge.
   "Growth costs C$449" qualifies. "the Pay As You Go plan at C$49" does not,
   because "plan at" stands between "Pay" and the figure, and a verb that is
   not introducing the number is not the verb claiming it. */
const ASSERTS_INTRODUCING =
  /\b(?:costs?|charges?|bills?|pays?|runs?|starts?|begins?|goes?|comes?|priced|quoted|listed|set)\b(?:\s+(?:at|to|from|for|about|around|only|just|now|currently|still|up|back|you|us|them|a|an|the))*\s*$/i;

/* A subordinate clause modifies the thing beside it; it does not assert on its
   own authority even when it contains a verb. "A client ... who was quoted
   C$850/month for Pro, was quoted a retired price" (client-support-knowledge.md)
   puts the retired figure inside a relative clause hanging off the SUBJECT,
   while the denial is the main predicate several clauses later. Judged as an
   independent assertion it is a live C$850 quote; judged as what it is, it is
   part of the sentence withdrawing that price.

   A clause that OPENS with its finite verb is the same case for a different
   reason: it has no subject, so it is the second predicate of the clause
   before it and shares that subject. The sibling engine repo produced the
   proof — "the qualifier is recorded against its obligation and will be
   credited at activation settlement" splits after "and", and the tail was read
   as a fresh claim because it contains "will", in a sentence that had already
   said the pilot "was retired on 2026-08-09 and is no longer sold to anybody". */
const SUBORDINATE =
  /^(?:and|but|or|nor)?\s*(?:who|whom|whose|which|that|will|would|shall|should|can|could|may|might|must|is|are|was|were|has|have|had|does|do|did|be|been|being)\b/i;

/* A denial that arrives AFTER the claim it withdraws, attached by a pointer
   back to it. "as is the C$850 Pro price", "which is retired", "both of which
   are superseded" are denials of the clause before them, not fresh claims, so
   their denial reaches back exactly one clause. llms.txt's "Pro was $850/month
   before 2026-08-09; that figure is retired" is the shape in this repository.

   Kept to explicit back-references. A general "a later denial excuses an
   earlier clause" rule is the laundering defect again wearing the other shoe:
   it would re-excuse "Pro is C$850/month, and the pilot is retired." */
const POINTS_BACK = /^(?:and|but|or|nor)?\s*(?:as|nor|neither|so|which|that|these|those|both|all|it|they)\b/i;

/* Is the claim asserted, or merely named? True only when a finite verb stands
   BEFORE an occurrence of the pattern in the same clause.

   English puts the predicate before its complement, so a verb after the phrase
   is not the verb stating it. "on the day the setup fee was removed" names the
   fee and then says it was removed; "and Pro is C$850/month" says Pro IS the
   figure. Position is what separates them, and it separates them without
   needing a list of every way to say "removed". */
const assertsClaim = (clause, re) => {
  const scan = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (let m = scan.exec(clause); m; m = scan.exec(clause)) {
    const head = clause.slice(0, m.index);
    if (ASSERTS.test(head) || ASSERTS_INTRODUCING.test(head)) return true;
    if (m.index === scan.lastIndex) scan.lastIndex++;   /* zero-width guard */
  }
  return false;
};

const isQuestion = (s) => /\?["')\]]*\s*$/.test(s.trim());

/* The offending CLAUSE, or null when the text does not make the claim.

   Returns the clause rather than a boolean so a failure can quote the words
   that failed. Before this, a failure named a file and a regex and left the
   reader to find the sentence; on a 400-line knowledge base that is the
   difference between a fixable report and an ignored one. */
export function offendingClause(text, re, { allowQuestions = false } = {}) {
  /* A launch-fee denial is judged with NO excuses. The pattern IS a denial,
     so the denial allowlist would launder every occurrence; the pattern has
     no finite verb ("no implementation fee"), so the fragment rule would
     launder the rest. Only a quoted caller question is excused, where the
     guard allows questions at all. */
  const falseDenial = FALSE_DENIALS.includes(re);

  for (const sentence of splitSentences(text)) {
    if (!re.test(sentence)) continue;
    /* Scoped to the caller rather than added to DENIAL: these files quote the
       CALLER verbatim ("Is there a setup fee on top of the monthly?"), and the
       wrong premise in a buyer's question is exactly what the agent is being
       tested on refusing. An interrogative cannot make an offer or charge
       anyone. In DENIAL it would instead split "Setup fee? C$500." into a
       question that is excused and a fragment that matches nothing. */
    if (allowQuestions && isQuestion(sentence)) continue;
    if (falseDenial) {
      /* Still reported clause-first so the failure quotes the words, and a
         quoted caller question is still excused cell-by-cell in the guards
         that allow questions (a table row is one "sentence" to the splitter,
         and the question mark sits mid-line). */
      const cs = splitClauses(sentence);
      const hit = cs.find((c) => re.test(c) && !(allowQuestions && isQuestion(c)));
      if (hit) return hit.trim();
      if (!cs.some((c) => re.test(c))) return sentence.trim(); /* straddle */
      continue; /* every matching clause was an allowed caller question */
    }

    const clauses = splitClauses(sentence);
    const denies = clauses.map((c) => DENIAL.some((d) => d.test(c)));
    /* A DENIAL pattern can straddle a boundary too. None in DENIAL does today
       ("no setup or activation" survives because "or" is not a boundary), but
       the day somebody adds one that spans a comma, the sentence would stop
       counting as a denial at all and every fragment in it would be reported.
       Cutting the text up must not be able to destroy the denial.

       This widens ONLY the fragment and straddle limbs, never the limb that
       judges an asserting clause — so it cannot re-open the laundering: "Pro
       is C$850/month" still has to carry its own denial. */
    const sentenceDenies = denies.some(Boolean) || DENIAL.some((d) => d.test(sentence));

    for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      if (!re.test(clause)) continue;

      /* 1. The clause withdraws the thing it names. Always allowed: this is
            the whole reason the classifier exists rather than a word ban. */
      if (denies[i]) continue;
      /* A quoted question, cell by cell, for the same reason as above. */
      if (allowQuestions && isQuestion(clause)) continue;

      /* 2. The clause makes no claim of its own — a list item, a trailing
            qualifier, a relative clause modifying something else — so it
            borrows the predicate of the sentence it sits in, and the sentence
            withdrew the claim. A fragment cannot state a price on its own
            authority, which is why this is scope and not a loophole. */
      const fragment = !assertsClaim(clause, re) || SUBORDINATE.test(clause);
      if (fragment && sentenceDenies) continue;

      /* 3. The denial trails the claim and points back at it. */
      if (denies[i + 1] && POINTS_BACK.test(clauses[i + 1])) continue;

      /* Otherwise: this clause asserts a retired claim and nothing withdraws
         it. THIS is the case that used to be laundered by a denial sitting in
         a different clause of the same sentence. */
      return clause;
    }

    /* The pattern matched the sentence but no single clause: it straddles a
       boundary the splitter introduced. Judge it whole rather than losing it,
       so cutting the sentence up can never make the guard weaker than it was
       before the cut existed. */
    if (!clauses.some((c) => re.test(c)) && !sentenceDenies) return sentence.trim();
  }
  return null;
}

export const statesBanned = (text, re, opts) => offendingClause(text, re, opts) !== null;
