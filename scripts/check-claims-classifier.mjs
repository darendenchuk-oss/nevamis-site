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
import {
  ADDITIVE, RETIRED_OFFERS, offendingClause,
  bookingClaim, BOOKING_IN_ANY_VOICE, BOOKED_BY_SOMEONE_ELSE, BOOKING_UNBUILT,
} from "./lib/claims.mjs";

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
];

/* ---------- MUST NOT FIRE: real sentences from this repository ----------
   Every one of these is content that is CORRECT under the current model.
   Sources are named so the next person can check that the fixture still
   matches the file rather than trusting a copy that drifted. */
const MUST_NOT_FIRE = [
  ["terms.html: the commitment, as a list of denials",
    "There is no setup fee, activation fee, onboarding fee, implementation fee or launch charge, and no amount is billed in addition to the monthly price except usage beyond the included minutes."],

  ["llms.txt: an instruction to answer engines, quoting what it forbids",
    "Never state a setup fee, an activation fee, an onboarding fee, an implementation fee or a launch charge: there is no such charge."],

  ["llms.txt: a retired tier recorded with its figure",
    "Pay As You Go ($49/mo) and annual prepay were retired on 2026-08-06."],

  ["llms.txt: history, with the denial trailing and pointing back",
    "Pro was $850/month before 2026-08-09; that figure is retired and must not be quoted."],

  ["pilot.html: the retirement, naming the fee that went with it",
    "It was retired on 9 August 2026, on the day the setup fee was removed, and the fee it charged went with it."],

  ["pilot.html: the price commitment stated as denials",
    "The monthly price of the plan you choose and nothing else. There is no setup fee, no activation fee, no onboarding charge and no implementation charge."],

  ["client-support-knowledge.md: the retired figure inside a relative clause",
    "A client who was quoted an amount for a first month and a different amount afterwards, or who was quoted C$850/month for Pro, was quoted a retired price."],

  ["nevamis-knowledge-base.md: the ledger of retired prices",
    "Prices retired and no longer offered: C$249, C$449 and C$849 per month (retired 2026-08-06); C$850 per month, which was Pro's price until 2026-08-09; the Pay As You Go plan at C$49 per month plus C$1.95 per minute; and annual prepay."],

  ["terms.html: the pilot withdrawn, naming its version history",
    "The paid seven-day pilot described in versions 2.2 and 2.3 of these terms was retired on August 9, 2026 and is no longer available; nothing on this website or in any current quotation offers it."],

  ["proposal.html: PLAN_TERMS, the sentence the whole model rests on",
    "No setup fee, no activation fee, and no minimum term."],

  ["the current model itself, which must never trip a pricing rule",
    "Core is C$250/month with 250 included minutes. Growth is C$500/month. Pro is C$1,000/month with 1,400 minutes."],
];

/* Quoted caller questions, judged only where the guard allows them (7e). The
   agent's acceptance criteria are markdown TABLES, so the question sits in a
   cell in the middle of a physical line rather than at the end of a sentence. */
const MUST_NOT_FIRE_QUESTIONS = [
  ["nevamis-agent-test-cases.md: a caller's wrong premise, mid-table-row",
    '| 7 | Charge-on-top question | "Is there a setup fee on top of the monthly?" | Says plainly that there is nothing charged on top and nothing charged before: there is no setup fee, no activation fee and no onboarding fee, and the plan is one figure charged the day they start. | P0 |'],

  ["nevamis-agent-test-cases.md: a discount request naming the retired credit",
    '| 22 | Discount request | "Can you knock the setup fee off if I sign up today?" | there is no setup fee to knock off | the retired C$150 pilot credit is not offered as the thing that reduces it. | P0 |'],

  ["a bare caller question", "Is there a setup fee on top of the monthly?"],
];

/* ============================================================
   THE BOOKING CLAIM, IN EVERY VOICE

   Section above proves the PRICING judge fires. This one proves the BOOKING
   judge fires, and it exists because that judge did not.

   On 2026-08-09 the active-voice booking claims were removed from this site
   and the sibling engine gained four patterns to keep them out. All four
   required Nevamis to be the grammatical subject. On 2026-08-10 the booking
   claims still being SERVED from nevamis.ca were run against them and twelve
   of twelve missed, while `npm run consistency` printed "no banned phrases"
   across all 22 pages.

   Every string in MUST_FIRE_BOOKING below is one of those twelve, verbatim
   from the page and line it was served on. Every string in
   MUST_NOT_FIRE_BOOKING is a sentence that must stay writable: the two the
   first version of this rule was DELETED for matching in the engine, the
   honest onboarding ask, the comparison-table row that names the claim in
   order to refuse it, and the booking this business genuinely does make —
   fifteen minutes with Daren on Nevamis's own Cal.com.
   ============================================================ */
const MUST_FIRE_BOOKING = [
  ["home.html:11 og:description, the sentence a link preview shows alone",
    "Your line answered 24/7, callers qualified, jobs booked, and the details texted straight to you."],
  ["home.html:1441 the night-band heading",
    "Booked, confirmed, texted to you."],
  ["home.html:1325 the live-call-proof lede",
    "Thirty-nine seconds later the visit is booked and confirmed."],
  ["hvac.html:812 what happens to a non-emergency",
    "Everything else is booked into the first slot your calendar actually has."],
  ["home.html:1517 the rules list",
    "Routine requests get booked into an open slot."],
  ["home.html:1596 the electricians card, middle voice with no agent at all",
    "Panel upgrade or dead outlets, the job books before the caller tries the next name."],
  ["home.html:1775 the business-rules layer",
    "What gets booked, what transfers, what waits for you."],
  ["coming-soon.html:1026 the worst one, because that page grades what is live",
    "An appointment is booked or the call escalates to the on-call tech."],
  ["home.html:1374 the demo transcript, in the product's own voice",
    "Thanks. You're booked for tomorrow between eight and ten, and I have your number if anything changes."],
  ["home.html:1386 the call chip, the claim at its most concrete",
    "BOOKED: tomorrow 8-10"],
  ["hvac.html:7 the meta description, active voice with an object the old rule did not know",
    "Nevamis answers your line around the clock, triages the call, books the visit, and sends you the summary."],
  ["plumbers.html lede, active voice with a PRONOUN object",
    "Nevamis answers them, qualifies them, and books them."],
  ["home.html:1608 the restoration card",
    "Gather incident details calmly, route priority calls, and book the assessment."],
  ["content-map.json hvac blurb, rendered onto five pages",
    "No-heat calls at 11 PM answered, triaged, and booked."],
  ["home.html:1529 the process heading",
    "How a missed call becomes a booked job."],
  ["home.html:1443 the claim with the verb removed altogether",
    "The visit sits in your calendar and the summary sits on your phone."],
  ["the wrapped form, which is why a line-scoped reader missed it for a day",
    "An after-hours call that gets answered, qualified, and booked is a job."],
];

/* Every one of these is content that must stay writable. The first two are the
   exact strings the engine's looser rule was deleted for matching on
   2026-08-09; if this guard ever reddens them it will be switched off within
   the hour, and it will take the sixteen above with it. */
const MUST_NOT_FIRE_BOOKING = [
  ["the onboarding SOP: the CLIENT wiring up their own booking link",
    "Client connects calendar and confirms booking rules."],
  ["portal-pending.ts: the noun as a route fragment, not a verb",
    'if (title.includes("calendar")) return { href: "/portal/business#booking", label: "Booking rules" };'],
  ["home.html: the configuration layer, which is the client's own policy",
    "Booking rules: which jobs you take, and what the caller is told about timing."],
  ["home.html FAQ: the roadmap, stated as a roadmap",
    "Direct calendar booking is on the roadmap and is not live on any line today."],
  ["the honest onboarding ask, said the other way round",
    "You give us your booking link and we read your availability from it."],
  ["home.html comparison table: the claim NAMED in order to be refused",
    "Books straight into your calendar No Sometimes Not built: you confirm"],
  ["home.html process step: the denial that must never be re-written into an assertion",
    "Nobody is left guessing: the caller is told plainly that someone will confirm the exact time, and never that it is already booked."],
  ["book.html and every page footer: time with NEVAMIS, on Nevamis's own Cal.com",
    "Book a 15-min call with Daren and get a quote scoped to your call volume."],
  ["demo.html: the strategy call, which is a real booking this business makes",
    "Book a strategy call."],
  ["the owner doing it, which is the product working exactly as designed",
    "You book the job once you have read the summary we texted you."],
  ["the missed-call calculator: the client's own jobs, won however they win them",
    "Compare that against the quote you were given, to see how many booked jobs cover it."],
  ["the honest replacement copy now shipping on hvac.html",
    "Nevamis answers your line around the clock, triages the call, takes the visit details and the time they want, and sends you the summary."],
  ["the honest replacement copy now shipping in the demo transcript",
    "Thanks. I have you down for tomorrow between eight and ten, and someone will confirm that window with you shortly."],
  ["the honest replacement copy now shipping on coming-soon.html",
    "The job, the address and the time they want are written down and the caller is told a person will confirm that time, or the call escalates to the on-call tech."],
];

/* ---------- WHY each must-not-fire sentence survives ----------

   "It passes" is not the property worth asserting. A sentence can pass because
   the rule is DESIGNED not to reach it, or because the rule happens to be
   broken today, and those two look identical from the outside — which is the
   whole reason the entitlement gate could exit 0 over 22 pages carrying the
   claim. So each escape route is asserted separately.

   NEVER_A_PATTERN is the noun. A looser "calendar ... booking" rule was
   written in the engine on 2026-08-09 and deleted within the hour because it
   matched these, and the deletion took every real catch with it. No pattern
   here may key on the bare noun, ever, and that is asserted at the pattern
   level rather than left to the allowance list to mop up. */
const NEVER_A_PATTERN = [
  ["the onboarding SOP, the sentence the first version of this rule died on",
    "Client connects calendar and confirms booking rules."],
  ["portal-pending.ts, the other one",
    'if (title.includes("calendar")) return { href: "/portal/business#booking" };'],
  ["home.html configuration layer: the client's own policy",
    "Booking rules: which jobs you take, and what the caller is told about timing."],
  ["home.html FAQ: the roadmap named as a roadmap",
    "Direct calendar booking is on the roadmap and is not live on any line today."],
  ["the honest ask, said the other way round",
    "You give us your booking link and we read your availability from it."],
  ["/book.html, which is nothing but booking time WITH Nevamis",
    "Book a 15-min call with Daren and get a quote scoped to your call volume."],
  ["the missed-call calculator: the client's own jobs",
    "Compare that against the quote you were given, to see how many booked jobs cover it."],
];

/* RESCUED_BY is the mirror. Each of these DOES match a booking pattern and is
   let through by exactly one of the three escape hatches. Deleting a hatch
   fails here, loudly, instead of reddening a live page and teaching the next
   person to delete the guard. */
const RESCUED_BY = [
  ["agency", "the owner doing it, which is the product working as designed",
    "You book the job once you have read the summary we texted you."],
  ["agency", "the competitor who got there first, from the cold-calling scripts",
    "It's whoever books the estimate first."],
  ["agency", "the client's own office doing it, once the summary lands",
    "Your office books the job once the summary lands."],
  ["unbuilt", "home.html comparison table: the claim NAMED in order to be refused",
    "Books straight into your calendar No Sometimes Not built: you confirm"],
  ["refusal", "home.html process step: a denial that must never be rewritten into an assertion",
    "Nobody is left guessing: the caller is told plainly that someone will confirm the exact time, and never that it is already booked."],
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

for (const [name, text] of MUST_NOT_FIRE_QUESTIONS) {
  const hit = judge(text, { allowQuestions: true });
  if (hit) {
    err(`MUST NOT FIRE (question) but did — ${name}\n      text:   "${text}"\n      rule:   ${hit.re}\n      clause: "${hit.clause}"\n      `
      + `An interrogative cannot make an offer. This is the caller's wrong premise, which is the thing `
      + `the agent is being graded on refusing.`);
  }
}

for (const [name, text] of MUST_FIRE_BOOKING) {
  if (!bookingClaim(text)) {
    err(`BOOKING MUST FIRE but did not — ${name}
      text:   "${text}"
      `
      + `Nothing provisions this. A tenant agent is created with built_in_tools {end_call} and no `
      + `tool_ids, and no tenant calendar credential exists, so this sentence promises a mechanism `
      + `nobody can be given. Every one of these was LIVE on nevamis.ca on 2026-08-10 while the `
      + `claim gate exited 0.`);
  }
}

for (const [name, text] of MUST_NOT_FIRE_BOOKING) {
  const claim = bookingClaim(text);
  if (claim) {
    err(`BOOKING MUST NOT FIRE but did — ${name}
      text:   "${text}"
      matched: "${claim}"
      `
      + `This is either the client booking, Nevamis's own Cal.com, or the claim being named in `
      + `order to be refused. A looser version of this rule was deleted within an hour of being `
      + `written for exactly this, and the deletion took every real catch with it.`);
  }
}

for (const [name, text] of NEVER_A_PATTERN) {
  const hit = BOOKING_IN_ANY_VOICE.find((re) => re.test(text));
  if (hit) {
    err(`BOOKING PATTERN reaches the NOUN — ${name}
      text:  "${text}"
      rule:  ${hit}
      `
      + `This rule must key on the booking VERB and never on the noun. The version that keyed on `
      + `the noun was deleted an hour after it was written, for this exact sentence.`);
  }
}

for (const [route, name, text] of RESCUED_BY) {
  const matched = BOOKING_IN_ANY_VOICE.some((re) => re.test(text));
  if (!matched) {
    err(`BOOKING fixture no longer exercises anything — ${name}
      text: "${text}"
      `
      + `No pattern matches it, so the "${route}" escape hatch it is supposed to prove is untested `
      + `and this fixture passes for the wrong reason.`);
    continue;
  }
  const by = BOOKED_BY_SOMEONE_ELSE.some((re) => re.test(text)) ? "agency"
    : BOOKING_UNBUILT.some((re) => re.test(text)) ? "unbuilt"
    : bookingClaim(text) === null ? "refusal" : "nothing";
  if (by !== route) {
    err(`BOOKING escape hatch changed — ${name}
      text:     "${text}"
      `
      + `expected: ${route}
      actual:   ${by}
      `
      + `${by === "nothing" ? "Nothing lets this through any more, so a correct sentence on a live page is now a failure."
        : "It still passes, but by a different route than the one this fixture exists to hold in place."}`);
  }
}

if (fail) {
  console.error(`\n${fail} classifier fixture(s) wrong. The judge is broken, not the content.`);
  process.exit(1);
}
console.log(`Claim classifier OK: ${MUST_FIRE.length} pricing must-fire, `
  + `${MUST_NOT_FIRE.length + MUST_NOT_FIRE_QUESTIONS.length} pricing must-not-fire, `
  + `${MUST_FIRE_BOOKING.length} booking must-fire, ${MUST_NOT_FIRE_BOOKING.length} booking must-not-fire, `
  + `${NEVER_A_PATTERN.length} noun-not-verb, ${RESCUED_BY.length} escape-hatch fixtures classified correctly.`);
