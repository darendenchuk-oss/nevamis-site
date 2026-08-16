#!/usr/bin/env node
/* ============================================================
   DOES THE CLAIM CLASSIFIER STILL FIRE?

     node scripts/check-claims-classifier.mjs
   0 = every fixture classified correctly
   1 = the classifier is wrong about a sentence whose answer is known

   WHY THIS FILE EXISTS. Every other guard in this repository proves a property
   of the CONTENT. Nothing proved a property of the JUDGE, and on 2026-08-10 the
   judge was found to be laundering live wrong prices:

     "The C$150 pilot is retired, and Pro is C$850/month with 1,200 minutes."

   went into pricing.html — a LIVE page — and `node scripts/check-consistency.js`
   exited 0 with no output. The classifier excused a whole SENTENCE when any
   clause of it denied anything, so one clause about retirement waved through
   two more retired figures and a wrong CURRENT price in the present tense.

   That is worse than having no guard at all. For two rounds the documented
   remedy for a failure was "add a retirement banner or a denial sentence", so
   the fix being applied everywhere was also the exploit.

   A guard nobody can see fail is a guard nobody should trust. The MUST FIRE
   table below is the part that matters: it is the same shape as the defect,
   and it fails this script the moment the classifier goes back to sentence
   scope. The MUST NOT FIRE table is the other half of the trade — every entry
   is a real sentence from this repository that says the RIGHT thing, and a
   stricter classifier that reddens them is not stricter, it is broken, because
   a permanently red guard stops being read.
   ============================================================ */
import { ADDITIVE, RETIRED_OFFERS, offendingClause } from "./lib/claims.mjs";

const ALL = [...RETIRED_OFFERS, ...ADDITIVE];
/* Does ANY pricing rule report this text? That is the question the guards ask,
   so it is the question the fixtures ask. */
const judge = (text, opts) => {
  for (const re of ALL) {
    const c = offendingClause(text, re, opts);
    if (c) return { re: String(re), clause: c };
  }
  return null;
};

/* ---------- MUST FIRE: a live claim that nothing withdraws ---------- */
const MUST_FIRE = [
  ["the reported defect, verbatim, on a live page",
    "The C$150 pilot is retired, and Pro is C$850/month with 1,200 minutes."],

  /* Variant 1: the denial is in the SECOND clause instead of the first, so a
     fix that only scoped denial forward would still launder this one. */
  ["denial trailing, with no back-reference to attach it",
    "Pro is C$850/month, and the C$150 pilot is retired."],

  /* Variant 2: no comma at all. A splitter that only cut on punctuation would
     see one clause, find "retired", and excuse the price beside it. This is
     why "and"/"but" are boundaries and not only commas. */
  ["coordinated with no comma",
    "The seven-day pilot is retired and Growth costs C$449 a month."],

  /* Variant 3: the denial is real and about something ELSE entirely. The
     sentence is true about the pilot and wrong about the price. */
  ["denial governs a different subject",
    "There is no pilot at any price, but Core is C$249/month today."],

  /* Variant 4: the laundering phrase in its most tempting form — a banner
     sentence with a live quote welded on. */
  ["superseded-banner phrasing with a live claim attached",
    "Those figures are superseded; Pro is C$850/month with 1,200 minutes."],

  /* Nothing to excuse it at all: the baseline the old classifier did catch,
     kept so a regression cannot pass by disabling the rule outright. */
  ["a bare live claim", "Pro is C$850/month."],
  ["an additive bill", "It is C$250/month plus a one-time setup fee of C$250."],
  ["a retired entitlement", "Pro includes 1,200 minutes, roughly 400 to 600 calls."],
  ["a retired plan name", "The Scale plan is our largest."],
  ["a spoken retired price", "That plan is eight hundred and fifty dollars a month."],

  /* ---- FLIPPED 2026-08-15 (evening), from MUST NOT FIRE. Every entry below
     was correct content under the 2026-08-09 one-recurring-price model and is
     a FALSE CLAIM under the OPERATE / GROW / PARTNERSHIP model, because each
     one denies the one-time Launch & Implementation fee that now exists, or
     quotes the ladder that no longer does. Fixtures flip, never disappear. */
  ["terms.html's old commitment: a denial list that now denies a real fee",
    "There is no setup fee, activation fee, onboarding fee, implementation fee or launch charge, and no amount is billed in addition to the monthly price except usage beyond the included minutes."],

  ["llms.txt's old instruction: it forbids stating a charge that now exists",
    "Never state a setup fee, an activation fee, an onboarding fee, an implementation fee or a launch charge: there is no such charge."],

  ["pilot.html's old price commitment: 'no implementation charge' denies the fee",
    "The monthly price of the plan you choose and nothing else. There is no setup fee, no activation fee, no onboarding charge and no implementation charge."],

  ["the 2026-08-09 model stated as current: retired names and a retired figure",
    "Core is C$250/month with 250 included minutes. Growth is C$500/month. Pro is C$1,000/month with 1,400 minutes."],

  ["a direct denial of the launch fee", "There is no launch fee and no implementation fee."],
  ["the one-price framing, which is now false", "It is one recurring monthly price with nothing beside it."],
  ["the nothing-up-front framing, which is now false", "Nothing is charged to begin, and your first bill is your only bill."],
  ["the retired Growth month, spoken", "The Growth plan is five hundred dollars a month."],
];

/* Judged WITH the question exemption, and must fire anyway: the offence is in
   the answer cell, not the quoted caller question beside it. This is the old
   row 7 of nevamis-agent-test-cases.md, whose P0 pass criterion required the
   agent to deny that anything is charged to start — the criterion itself is
   now the false claim, which is why the fixture flipped. */
const MUST_FIRE_QUESTIONS = [
  ["nevamis-agent-test-cases.md old row 7: the pass criterion denies the launch fee",
    '| 7 | Charge-on-top question | "Is there a setup fee on top of the monthly?" | Says plainly that there is nothing charged on top and nothing charged before: there is no setup fee, no activation fee and no onboarding fee, and the plan is one figure charged the day they start. | P0 |'],
];

/* ---------- MUST NOT FIRE: real sentences from this repository ----------
   Every one of these is content that is CORRECT under the current model.
   Sources are named so the next person can check that the fixture still
   matches the file rather than trusting a copy that drifted. */
const MUST_NOT_FIRE = [
  /* The 2026-08-15 (evening) model itself, in the approved sentence shape.
     Two figures, joined by "to start" and "then" — never "plus" — and the
     one-time fee under its one public name. */
  ["the current model itself, which must never trip a pricing rule",
    "Operate is C$1,000/month with 1,400 included minutes. Grow is C$750/month. C$1,000 Launch & Implementation to start, then C$750 a month."],

  ["proposal.html: PLAN_TERMS, the sentence the whole model rests on",
    "One-time C$1,000 Launch & Implementation to start. Nothing else is billed beside the monthly except overage past your included minutes. No minimum term."],

  ["the invite-based plan, described without being offered as the default",
    "Performance Partnership is offered by invitation: C$2,000 Launch & Implementation to start, then C$250 a month, and 15% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities, subject to the agreement."],

  ["the fee's NAME defended without denying the fee",
    "The one-time charge is called Launch & Implementation; there is no setup fee, no activation fee and no onboarding fee by any name."],

  ["llms.txt: a retired tier recorded with its figure",
    "Pay As You Go ($49/mo) and annual prepay were retired on 2026-08-06."],

  ["llms.txt: history, with the denial trailing and pointing back",
    "Pro was $850/month before 2026-08-09; that figure is retired and must not be quoted."],

  ["llms.txt: the reprice recorded as history",
    "Growth was C$500/month until 2026-08-15; that figure is retired, and the plan is Grow at C$750/month now."],

  ["pilot.html: the retirement, naming the fee that went with it",
    "It was retired on 9 August 2026, on the day the setup fee was removed, and the fee it charged went with it."],

  ["client-support-knowledge.md: the retired figure inside a relative clause",
    "A client who was quoted an amount for a first month and a different amount afterwards, or who was quoted C$850/month for Pro, was quoted a retired price."],

  ["nevamis-knowledge-base.md: the ledger of retired prices",
    "Prices retired and no longer offered: C$249, C$449 and C$849 per month (retired 2026-08-06); C$850 per month, which was Pro's price until 2026-08-09; the Pay As You Go plan at C$49 per month plus C$1.95 per minute; and annual prepay."],

  ["terms.html: the pilot withdrawn, naming its version history",
    "The paid seven-day pilot described in versions 2.2 and 2.3 of these terms was retired on August 9, 2026 and is no longer available; nothing on this website or in any current quotation offers it."],

  ["a legal denial of retired vocabulary, on its own",
    "No setup fee, no activation fee, and no minimum term."],
];

/* Quoted caller questions, judged only where the guard allows them (7e). The
   agent's acceptance criteria are markdown TABLES, so the question sits in a
   cell in the middle of a physical line rather than at the end of a sentence. */
const MUST_NOT_FIRE_QUESTIONS = [
  ["nevamis-agent-test-cases.md: a caller's wrong premise, mid-table-row, with the inverted answer",
    '| 7 | Charge-on-top question | "Is there a setup fee on top of the monthly?" | Corrects the name and states the whole price in the approved shape: there is a one-time charge at the start and it is called Launch and Implementation, and on Grow it is one thousand dollars Launch and Implementation to start, then seven hundred and fifty dollars a month. | P0 |'],

  ["nevamis-agent-test-cases.md: a discount request naming retired vocabulary",
    '| 22 | Discount request | "Can you knock the setup fee off if I sign up today?" | there is no setup fee by that name | the Launch and Implementation fee is not discounted. | P0 |'],

  ["a bare caller question", "Is there a setup fee on top of the monthly?"],
];

let fail = 0;
const err = (m) => { console.error("FAIL: " + m); fail++; };

for (const [name, text] of MUST_FIRE) {
  const hit = judge(text);
  if (!hit) {
    err(`MUST FIRE but did not — ${name}\n      text:   "${text}"\n      `
      + `Nothing in this sentence withdraws the claim it makes. If the classifier cannot see it, `
      + `every surface in this repository is unguarded for that shape.`);
  }
}

for (const [name, text] of MUST_NOT_FIRE) {
  const hit = judge(text);
  if (hit) {
    err(`MUST NOT FIRE but did — ${name}\n      text:   "${text}"\n      rule:   ${hit.re}\n      clause: "${hit.clause}"\n      `
      + `This is correct content that states the current model or records a retired one. A guard that `
      + `reddens it teaches the next person to delete the sentence doing the denying.`);
  }
}

for (const [name, text] of MUST_FIRE_QUESTIONS) {
  const hit = judge(text, { allowQuestions: true });
  if (!hit) {
    err(`MUST FIRE (even with questions allowed) but did not — ${name}\n      text:   "${text}"\n      `
      + `The offence is in the ANSWER cell, not the quoted caller question beside it. If the question `
      + `exemption swallows the whole row, the acceptance criteria for the live agent are unguarded.`);
  }
}

for (const [name, text] of MUST_NOT_FIRE_QUESTIONS) {
  const hit = judge(text, { allowQuestions: true });
  if (hit) {
    err(`MUST NOT FIRE (question) but did — ${name}\n      text:   "${text}"\n      rule:   ${hit.re}\n      clause: "${hit.clause}"\n      `
      + `An interrogative cannot make an offer. This is the caller's wrong premise, which is the thing `
      + `the agent is being graded on refusing.`);
  }
}

if (fail) {
  console.error(`\n${fail} classifier fixture(s) wrong. The judge is broken, not the content.`);
  process.exit(1);
}
console.log(`Claim classifier OK: ${MUST_FIRE.length + MUST_FIRE_QUESTIONS.length} must-fire, `
  + `${MUST_NOT_FIRE.length + MUST_NOT_FIRE_QUESTIONS.length} must-not-fire fixtures classified correctly.`);
