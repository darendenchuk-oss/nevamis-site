/* ============================================================
   llms.txt STATES THE TERM IN WORDS, AND THE WORDS ARE CHECKED (G6-12)

   llms.txt is the file answer engines read, and it states the three terms a
   buyer asks about first: how long the price is locked, whether there is a
   minimum term, and whether cancelling needs notice. Guard 7j compared its
   prices with pricing-config.js and guard 7k looked for unbuilt promises;
   nothing read the term. Changing "locked for twelve months" to "locked for
   six" passed every check on 2026-09-26 (closing round, G6-12).

   The rule compares each statement with pricing-config.js `terms`, the
   site's mirror of CANONICAL.pricing.terms:
     lock     every "locked for N months" (or "N-month price lock") names
              terms.priceLockMonths, and at least one does;
     minimum  with minimumMonths 0 the file says "no minimum term" and states
              no minimum of any length; with a minimum it states that length
              and never "no minimum term";
     notice   with cancellationNoticeDays 0 the file says there is no
              cancellation notice and ties no number of days' notice to
              cancelling; with notice it states that number.
   A sentence that retires a term ("... is retired; never state one") is a
   denial and is not read as a statement of it: llms.txt names the retired
   three- and six-month starts precisely so a model will not repeat them.

   Pure functions over text: check-consistency.js feeds the file and runs the
   fixture table below before it trusts the verdict.
   ============================================================ */

const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, eighteen: 18, twenty: 20, "twenty-four": 24, thirty: 30,
  "thirty-six": 36, sixty: 60, ninety: 90 };
const N = "(\\d+|" + Object.keys(WORDS).sort((a, b) => b.length - a.length).join("|") + ")";
const num = (s) => (/^\d+$/.test(s) ? Number(s) : WORDS[s.toLowerCase()]);

/* A sentence that withdraws a term rather than stating it. */
const DENIAL = /\bretired\b|\bnever state\b|\bno longer\b|\bwas the rule\b/i;

const sentences = (text) => String(text).replace(/\s+/g, " ").split(/(?<=[.;!?])\s+/);

/** Every problem with llms.txt's term statements against `terms`, as strings. */
export function termFindings(text, terms) {
  const out = [];
  const flat = String(text).replace(/\s+/g, " ");
  const live = sentences(text).filter((s) => !DENIAL.test(s));
  const lockM = Number(terms.priceLockMonths);
  const minM = Number(terms.minimumMonths);
  const noticeD = Number(terms.cancellationNoticeDays);

  /* PRICE LOCK */
  const LOCK = [new RegExp("\\blocked (?:in )?for " + N + "[- ]months?\\b", "gi"),
    new RegExp("\\b" + N + "[- ]months? price lock\\b", "gi"),
    new RegExp("\\bprice lock (?:of|for) " + N + "[- ]months?\\b", "gi")];
  let locks = 0;
  for (const s of live) {
    for (const re of LOCK) {
      for (const m of s.matchAll(re)) {
        locks++;
        if (num(m[1]) !== lockM) out.push(`states the price is locked for ${m[1]} months; pricing-config.js terms.priceLockMonths is ${lockM}: "${s.trim()}"`);
      }
    }
  }
  if (!locks) out.push(`never states how long the price is locked; pricing-config.js terms.priceLockMonths is ${lockM}`);

  /* MINIMUM TERM */
  const MIN = [new RegExp("\\bminimum (?:term|commitment|contract)(?: of)? " + N + "[- ]months?\\b", "gi"),
    new RegExp("\\b" + N + "[- ]months? (?:minimum|start|commitment|contract|term|lock-in)\\b", "gi")];
  const saysNoMin = /\bno minimum (?:term|commitment)\b/i.test(flat);
  for (const s of live) {
    for (const re of MIN) {
      for (const m of s.matchAll(re)) {
        if (num(m[1]) !== minM) out.push(`states a ${m[1]}-month minimum; pricing-config.js terms.minimumMonths is ${minM}: "${s.trim()}"`);
      }
    }
  }
  if (minM === 0 && !saysNoMin) out.push('never says "no minimum term", and pricing-config.js terms.minimumMonths is 0');
  if (minM > 0 && saysNoMin) out.push(`says "no minimum term" while pricing-config.js terms.minimumMonths is ${minM}`);

  /* CANCELLATION NOTICE */
  const NOTICE = [new RegExp("\\bcancel\\w*[^.;]{0,40}?\\b" + N + "[- ]days?'?\\s+(?:written\\s+)?notice", "gi"),
    new RegExp("\\b" + N + "[- ]days?'?\\s+(?:written\\s+)?(?:cancellation\\s+)?notice\\s+(?:to|of|before)\\s+cancel", "gi"),
    new RegExp("\\bnotice period of " + N + "[- ]days?\\b", "gi"),
    new RegExp("\\b" + N + "[- ]days?'? (?:cancellation )?notice period\\b", "gi")];
  const saysNoNotice = /\bno (?:cancellation )?notice(?: period)?\b[^.]{0,40}\bcancel|\bno cancellation notice\b/i.test(flat);
  for (const s of live) {
    for (const re of NOTICE) {
      for (const m of s.matchAll(re)) {
        if (num(m[1]) !== noticeD) out.push(`ties ${m[1]} days' notice to cancelling; pricing-config.js terms.cancellationNoticeDays is ${noticeD}: "${s.trim()}"`);
      }
    }
  }
  if (noticeD === 0 && !saysNoNotice) out.push("never says there is no cancellation notice, and pricing-config.js terms.cancellationNoticeDays is 0");
  if (noticeD > 0 && saysNoNotice) out.push(`says there is no cancellation notice while pricing-config.js terms.cancellationNoticeDays is ${noticeD}`);
  return out;
}

/* The judge's own fixtures, run by check-consistency.js before the verdict
   on the real file is trusted. TERMS is today's shape, typed here because a
   fixture is a known answer; the real file is judged against the real
   config. */
const TERMS = { minimumMonths: 0, cancellationNoticeDays: 0, priceLockMonths: 12 };
const GOOD = "There is no minimum term on anything, and no cancellation notice period either. "
  + "The client cancels at any time from their own portal, with the price locked for twelve months from signing. "
  + "A three-month or six-month start was the rule between 2026-08-22 and 2026-09-08 and is retired; never state one. "
  + "Separately, existing clients get at least 30 days written notice before a material price increase: "
  + "that is notice Nevamis gives the client, not a condition on cancelling.";
export const TERM_FIXTURES = {
  terms: TERMS,
  mustPass: [["today's paragraph", GOOD]],
  mustFail: [
    ["the finding verbatim: locked for six", GOOD.replace("locked for twelve months", "locked for six months")],
    ["a lock in digits", GOOD.replace("locked for twelve months", "locked for 24 months")],
    ["no lock stated at all", GOOD.replace(", with the price locked for twelve months from signing", "")],
    ["a minimum term contradicting 'no minimum term'", GOOD + " Every plan has a minimum term of three months."],
    ["'no minimum term' removed", GOOD.replace("There is no minimum term on anything, and no", "There is no")],
    ["a live six-month start", GOOD + " Plans start with a six-month commitment."],
    ["notice tied to cancelling", GOOD + " Cancel on 30 days notice from the portal."],
    ["a notice period", GOOD + " There is a 30-day notice period to cancel."],
  ],
  mustFailWith: [
    ["a minimum the config does carry, denied by the file", GOOD, { minimumMonths: 3, cancellationNoticeDays: 0, priceLockMonths: 12 }],
  ],
};
