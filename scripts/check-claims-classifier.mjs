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
import { ADDITIVE, RETIRED_OFFERS, UNBUILT_PROMISES, offendingClause } from "./lib/claims.mjs";

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

  /* Re-pointed 2026-08-25 (v5): the 2026-08-09 fixture leaned on C$500 as its
     retired figure, and v5 made C$500 a live add-on price — the sentence
     genuinely stopped being detectable by FIGURE, which is the classifier
     working, not failing. The dead-model-as-current shape is preserved on
     the era whose figures are retired today. */
  ["the 2026-08-22 v4 model stated as current: a retired figure as the live price",
    "The Works is C$1,800/month with 1,400 included minutes. C$2,500 Launch & Implementation to start, then C$1,800 a month."],

  ["a direct denial of the launch fee", "There is no launch fee and no implementation fee."],
  ["the one-price framing, which is now false", "It is one recurring monthly price with nothing beside it."],
  ["the nothing-up-front framing, which is now false", "Nothing is charged to begin, and your first bill is your only bill."],
  /* "five hundred dollars a month" is LIVE spoken copy under v5 (the two
     engines), so the spoken tripwire moved to the figure v5 retired. */
  ["the retired Works month, spoken", "The Works plan is eighteen hundred dollars a month."],

  /* A term that exists (2026-09-24). The first row is the homepage's Plans
     station, verbatim, which named no length and no penalty and so passed
     every rule above while the same page said "no minimum term". */
  ["the homepage Plans station, verbatim: a term the buyer is in",
    "The build takes days, not weeks: your line is answered inside the first week. The term is for the results window, which runs across a season of quotes and invoices."],
  ["a retired minimum, with its length", "Every plan has a minimum term of three months."],
  ["the retired minimum, as the call scripts said it", "It is a 6-month commitment, then month to month."],
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
    "The AI Front Desk is C$1,000/month with 1,400 included minutes. The Works is C$2,100/month. C$3,000 Launch & Implementation to start, then C$2,100 a month."],

  ["proposal.html: PLAN_TERMS, the sentence the whole model rests on",
    "One-time C$1,000 Launch & Implementation to start. Nothing else is billed beside the monthly except overage past your included minutes. No minimum term."],

  ["the invite-based plan, described without being offered as the default",
    "Performance Partnership is offered by invitation: C$2,500 Launch & Implementation to start, then C$350 a month, and 10% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities, subject to the agreement."],

  ["the fee's NAME defended without denying the fee",
    "The one-time charge is called Launch & Implementation; there is no setup fee, no activation fee and no onboarding fee by any name."],

  ["llms.txt: a retired tier recorded with its figure",
    "Pay As You Go ($49/mo) and annual prepay were retired on 2026-08-06."],

  ["llms.txt: history, with the denial trailing and pointing back",
    "Pro was $850/month before 2026-08-09; that figure is retired and must not be quoted."],

  ["llms.txt: the reprice recorded as history",
    "The Works was C$1,800/month until 2026-08-24; that figure is retired, and the plan is C$2,100/month now."],

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

  /* The sentences that state the absence of a term, which the 2026-09-24
     term patterns must never redden. */
  ["the homepage Plans station, as rewritten",
    "The build takes days, not weeks: your line is answered inside the first week. There is no minimum term: month to month from the first month, cancelled from your own portal at any time."],
  ["pricing-config.js terms note", "There is no minimum term. Every plan and every add-on, bought on its own or added later, is month to month from the first month: cancel any time from your own portal, service running to the end of the month you already paid for, and your price locked for 12 months from signing."],
  ["the retired minimum, recorded as retired", "The 3-month minimum term was retired on 2026-09-08 and is no longer offered."],
  ["a price lock is not a term", "Your price is locked for 12 months from signing."],
  /* The owner's decision with "the term" as its subject (2026-09-25): a
     sentence that says month to month states the decision, not a commitment. */
  ["the term, stated as month to month", "The term is month to month, and you can cancel from your portal at any time."],
  ["the term runs month-to-month", "The term runs month-to-month from the first month."],
  ["the term, stated as monthly", "The term is monthly: cancel from your own portal whenever you like."],
];

/* Quoted caller questions, judged only where the guard allows them (7e). The
   agent's acceptance criteria are markdown TABLES, so the question sits in a
   cell in the middle of a physical line rather than at the end of a sentence. */
const MUST_NOT_FIRE_QUESTIONS = [
  ["nevamis-agent-test-cases.md: a caller's wrong premise, mid-table-row, with the inverted answer",
    '| 7 | Charge-on-top question | "Is there a setup fee on top of the monthly?" | Corrects the name and states the whole price in the approved shape: there is a one-time charge at the start and it is called Launch and Implementation, and on the AI Front Desk it is fifteen hundred dollars Launch and Implementation to start, then one thousand dollars a month. | P0 |'],

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

/* ---------- UNBUILT_PROMISES: features the product never had ----------

   Guard 7k's list (2026-09-24), judged by the same classifier and held to
   the same two tables. The must-fire rows are the sentences nevamis.ca
   actually published until that day; the must-not-fire rows are the true
   sentences written in their place and the demo line's refusal, which has to
   be able to name the thing it refuses. */
const judgeUnbuilt = (text, opts) => {
  for (const { re } of UNBUILT_PROMISES) {
    const c = offendingClause(text, re, opts);
    if (c) return { re: String(re), clause: c };
  }
  return null;
};
const UNBUILT_MUST_FIRE = [
  ["the pricing page usage note, verbatim",
    "Near the limit you choose: automatic overage, fallback answering, or a hard cap."],
  ["the plan feature line, verbatim",
    "Included minutes metered in the portal, with alerts at 50%, 75%, 90% and 100%, and your choice of overage, fallback answering or a hard cap"],
  ["the portal line on every plan card, verbatim",
    "A portal Pulse page that keeps your scans, and Results that label every number as measured or modelled"],
  /* The laundering shape again: a denial in one clause must not excuse a
     promise in the next. */
  ["a denial in one clause does not excuse a promise in the next",
    "There is no setup fee, and you can set a hard cap in your portal."],
  /* 2026-09-24, the homepage film: its closing line over the scan CTA. */
  ["the homepage closing line, verbatim", "One scan. Every leak, found and handled."],
  ["every leak, said as a verb", "NEVAMIS handles every leak the scan finds."],
];
const UNBUILT_MUST_NOT_FIRE = [
  ["the demo knowledge base's refusal (config/elevenlabs)",
    "Past the included minutes, extra minutes are billed at the plan's overage rate and calls keep being answered. There is no hard cap, no fallback-answering mode and no choice of what happens at the limit, so never offer one."],
  ["the demo prompt's instruction not to offer one",
    "Do not offer a hard cap, a fallback-answering mode, or a choice of what happens at the limit."],
  ["the usage note that replaced the promise",
    "Past your included minutes, calls keep being answered and each extra minute is billed at your plan's per-minute rate, shown on its card above."],
  ["the portal line that replaced the Pulse page",
    "A Results page in your portal that labels every number as measured, declared, estimated or not yet measured, and never adds an estimate to measured money"],
  ["the homepage closing line, as rewritten", "One scan shows where it leaks, and which leaks NEVAMIS handles."],
  ["the film's scan beat", "The scan finds where the money is leaking."],
];
for (const [name, text] of UNBUILT_MUST_FIRE) {
  if (!judgeUnbuilt(text)) {
    err(`MUST FIRE (unbuilt promise) but did not — ${name}\n      text:   "${text}"\n      `
      + `This sentence sold a feature nothing delivers. If guard 7k cannot see it, it can go back on the pricing page.`);
  }
}
for (const [name, text] of UNBUILT_MUST_NOT_FIRE) {
  const hit = judgeUnbuilt(text);
  if (hit) {
    err(`MUST NOT FIRE (unbuilt promise) but did — ${name}\n      text:   "${text}"\n      rule:   ${hit.re}\n      clause: "${hit.clause}"\n      `
      + `This sentence tells the truth about the product or refuses the feature. A guard that reddens it `
      + `teaches the next person to delete the refusal.`);
  }
}

if (fail) {
  console.error(`\n${fail} classifier fixture(s) wrong. The judge is broken, not the content.`);
  process.exit(1);
}
console.log(`Claim classifier OK: ${MUST_FIRE.length + MUST_FIRE_QUESTIONS.length + UNBUILT_MUST_FIRE.length} must-fire, `
  + `${MUST_NOT_FIRE.length + MUST_NOT_FIRE_QUESTIONS.length + UNBUILT_MUST_NOT_FIRE.length} must-not-fire fixtures classified correctly.`);
