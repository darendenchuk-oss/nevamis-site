/* ============================================================
   WHAT THE CONTENT PAGES MAY CLAIM ABOUT THE FRONT DESK

   The nine generated pages, the /solutions.html hub and demo.html are where
   a buyer reads what the phone side of Nevamis does, line by line, against a
   competitor or a trade. A whole-site audit on 2026-10-03 found them claiming
   things the engine does not do: an account type "marked on the summary" (no
   such field), a hazard call "escalated the way you tell us" (there is no way
   to tell us), "a cap you choose" on overage (no client can), "answers in
   parallel" (client agents carry a daily call limit), "the same voice and
   model" (the demo line runs a different model), and a run of unmeasured
   absolutes ("every unanswered call", "usually", "won in the first hour").

   Each was fixed in scripts/content/pages.mjs, content-map.json or demo.html.
   This file is what keeps them fixed, and keeps the next sentence in the same
   SHAPE from arriving: every rule below is a kind of claim, not a quoted
   string, and each carries the engine fact that makes it false. It runs
   inside scripts/build-content.mjs, which refuses to write a page that breaks
   one, and CI runs build-content on every pull request through
   scripts/check-generator-drift.mjs. So a page with one of these claims in it
   cannot be built, and a hand edit that slips one in fails the drift check.

     node scripts/content/claim-rules.mjs
   0 = the rules pass their own examples and every page they own is clean
   1 = a rule failed its own example, or a page carries a claim below

   THE ENGINE FACTS (nevamis-engine, master d1d24287):
   - src/domain/client-notify.ts CallFacts: the text and the email a client
     gets carry who called, what they wanted, the callback number, urgency,
     the outcome and the next step the caller was told. Nothing else.
   - src/domain/agent-draft.ts: the agent confirms the callback number back
     once; a fire, a gas leak or a shock hazard gets "hang up and call 911"
     before anything else, whatever the business does; urgent work is what
     the client's own services text says it takes. A client agent has the
     end_call tool and nothing else, so nothing is handed to a person.
   - src/lib/elevenlabs-provision.ts: client agents run one model and carry a
     daily call limit; the demo line runs another model.
   - src/domain/usage-policy.ts has no production caller: past the included
     minutes every account keeps answering and bills each extra minute.

   SCOPE. Only the pages this builder owns, plus demo.html and content-map.json
   (served publicly at /content-map.json, and the source of every card title
   and blurb these pages render). A site-wide version of a rule belongs in
   scripts/lib/claims.mjs and check-consistency.js, which other work owns.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripJsComments, jsStringLiterals, renderedProse } from '../lib/rendered-text.mjs';

/* ---------- the rules ----------
   `re` is judged against the rendered text of a page (see renderedText), so
   a rule never fires on a code comment and always fires on a meta
   description or a JSON-LD description, which are the sentences a search
   result and an answer engine quote. `pages`, where present, limits a rule
   to the pages it is about. `unless`, where present, is judged against the
   sentence each match sits in (from the last full stop, question or
   exclamation mark before it to the next one after), and a sentence it
   matches is not a finding: it is how a rule says "only when the same
   sentence does not also say X". */
export const CLAIM_RULES = [
  { id: 'summary-field',
    re: /\b(?:marked|noted|recorded|flagged|logged) on (?:the|your|each) summary\b/i,
    why: 'the summary has no such field: client-notify.ts CallFacts carries who called, what they wanted, the callback number, urgency, the outcome and the next step. Say the answer is in the call recording in the portal' },
  { id: 'texted-window',
    re: /\b(?:window|slot)\b[^.;?!]{0,60}\btext(?:ed|s)? to you\b|\btext(?:ed|s)? (?:to )?you\b[^.;?!]{0,40}\b(?:window|slot)\b/i,
    why: 'no field carries a requested time into the text (client-notify.ts callSummarySms); the time is taken on the call and is in the portal' },
  { id: 'escalation',
    re: /\bescalat(?:e|es|ed|ing|ion|ions)\b|\bthe way you tell us\b/i,
    why: 'a client agent has end_call and nothing else, and its hazard rule is fixed (agent-draft.ts EMERGENCIES). Say what happens: it captures the urgent details and alerts your team, or takes a message and flags it' },
  { id: 'overage-cap',
    re: /\bcap (?:that )?you (?:choose|set|pick)\b|\b(?:choose|set|pick) (?:a|your(?: own)?) (?:cap|limit)\b/i,
    why: 'no client can choose a cap: usage-policy.ts has no production caller, and pricing.html says calls keep being answered past the included minutes' },
  { id: 'concurrency',
    re: /\bin parallel\b|\bwithout (?:a |any )?queue\b|\bnever (?:on hold|queued|busy)\b|\bunlimited (?:simultaneous|concurrent) calls\b/i,
    why: 'client agents are created with a daily call limit (elevenlabs-provision.ts call_limits) and concurrency per agent is neither set nor tested (FOUNDER_GLOSSARY #27)' },
  { id: 'instant-answer',
    re: /\b(?:answers?|answered|picks? up|picked up)\b[^.;?!]{0,30}\b(?:immediately|instantly|on the first ring)\b/i,
    why: 'with no-answer forwarding the owner\'s phone rings first, so Nevamis answers after those unanswered rings, as voicemail does' },
  { id: 'same-model',
    re: /\bsame\b[^.;?!]{0,30}\bmodel\b/i,
    why: 'the demo line and a client line share the voice and not the language model (elevenlabs-provision.ts against the demo agent snapshot); say "the same voice"' },
  { id: 'reads-details-back',
    re: /\brepeats?\b[^.;?!]{0,30}\bback\b|\breads?\b[^.;?!]{0,30}\bdetails back\b/i,
    why: 'the agent confirms the callback number back once and is told never to repeat itself (agent-draft.ts); say that, and that your team will confirm any time asked for' },
  { id: 'product-named-modes',
    re: /\bOverflow coverage\b|\bFull-time front line\b/i,
    why: 'these read as products pricing.html does not sell; they are the front desk\'s two forwarding modes (forwarding-codes.ts), and named as that' },
  { id: 'unmeasured-absolute',
    re: /\b(?:every|each|any) (?:unanswered|missed) call (?:is|means)\b|\busually\b|\bexactly the (?:kind|businesses|customers|leads)\b|\b(?:won|lost|decided) in the first (?:hour|minutes?)\b|\bworst possible\b|\bis a lost (?:caller|customer|job|call)\b|\bnot lost because of price\b|\bon every call\b|\bevery time\b|\bat every hour\b/i,
    why: 'nothing measured it (owner rule: no unproven claim). Hedge it to what is true, or drop it' },
  { id: 'books-or-hands-off',
    re: /\b(?:offering|offers?) (?:available |open )?slots\b|\bcalendar has openings\b|\bI can do (?:mon|tues|wednes|thurs|fri|satur|sun)day\b|\b(?:alerting|paging|calling) the on-call\b|\bbooks? (?:the|your|a|an) (?:job|appointment|assessment|visit|slot)\b/i,
    why: 'a client agent has no calendar and no booking tool, and nothing hands a call to a person (owner decision B1; agent-draft.ts BOOKING, elevenlabs-provision.ts end_call only). It takes the time the caller wants and your team confirms it' },
  { id: 'competitor-result',
    re: /\b(?:stop|stops|keep|keeps|prevent|prevents)\b[^.;?!]{0,40}\b(?:reaching|going to|calling|choosing) (?:your |a )?competitors?\b/i,
    why: 'no record shows an answered call keeps a caller from a competitor (owner rule: no unproven result)' },
  { id: 'competitor-assertion',
    re: /\bat a premium\b|\bdepends on their volume\b|\bvaries by operator\b|\banswering services? (?:use|uses|employ|employs|charge|charges|cost|costs|usually)\b/i,
    why: 'nothing in docs/CLAIMS-LEDGER.md sources a claim about what answering services do or charge; ask the buyer\'s question instead' },
  { id: 'banned-buyer-word',
    re: /\btrials?\b|\bpilots?\b|\bfree period\b|\bdiscount(?:s|ed)?\b/i,
    why: 'banned on every client and buyer surface, even in the negative (owner rule); say what is true, for example "no minimum term"' },
  /* The next three came from the review of PR #42 (2026-10-03): each was a
     sentence this leaf itself wrote, true for some clients and stated as if
     true for all. A hedge ("often", "can be") is what lets the sentence
     through, so the rule fires on the unhedged form only. */
  /* Each of the three was widened on 2026-10-03 (review of PR #42, polish
     leaf): as first written each caught its own example and missed the next
     wording of it. "by dialing" (the US spelling), "Your team confirms the
     time", "A person will confirm your appointment time" and "Asks the
     qualifying questions you approved" all passed, and the last is the very
     sentence that leaf's PR named as false. Each is now a MUST_FIRE line. */
  { id: 'dial-code-only',
    re: /(?<!\b(?:often|sometimes) )\bby diall?ing\b|\b(?:just|simply) diall?(?:ing)?\b/i,
    why: 'not every line has dial codes: a hosted business line usually sets forwarding in the provider\'s admin portal, and Shaw home phone in My Shaw (engine src/domain/forwarding-codes.ts); overflow is also three codes, not one. Say "often by dialling short codes, or in your provider\'s portal"' },
  { id: 'confirm-time-promise',
    re: /\b(?:team|office|someone|person|they|we)\b[^.;?!]{0,25}\bconfirms? (?:the|a|an|any|your|their)\b[^.;?!]{0,20}\b(?:times?|appointment|slot|window)\b/i,
    why: 'only a client with a booking link has the agent say a person will confirm the time; with none it takes a complete message and says the business will get back to them in general terms (engine src/domain/agent-draft.ts, BOOKING). Say "your team will get back to them"' },
  { id: 'question-builder',
    re: /\bwe set it up to ask\b|\bqualified the way you would\b|\basks? (?:the|your)(?: own)? (?:qualifying |screening )?questions\b|(?<!\bcan be )\basked\b[^.;?!]{0,40}\bwhen you approve\b/i,
    why: 'the client agent\'s prompt has no qualifying-questions field: it takes hours, services, area, the approved FAQ and a booking link, and captures name, callback number, job, location and urgency "in a question or two" (engine src/domain/agent-draft.ts, buildClientAgentPrompt). A trade question rides in only as approved text. Say what it asks, and that it "can be set up to ask" more' },
  /* THE TIME A CALLER ASKS FOR IS A REQUEST, NOT AN APPOINTMENT (audit
     PRICING-9, 2026-10-03). These pages said the agent "takes the job and
     the time the caller wants" in eight places, and the hub, demo.html and
     the trade pages said it with no word about who confirms. A buyer, and an
     answer engine quoting one sentence, reads "takes the job" as accepting a
     booking and "the time they want" as the time they get. A client agent
     books nothing: it has end_call and no calendar (engine agent-draft.ts
     BOOKING, elevenlabs-provision.ts), and how-you-start.html says "It does
     not book into your calendar. It takes the request and the times that
     suit; you confirm". The site's words for it, the same ones
     pricing.html's Product description and tests/live-buyer-truth.spec.js
     hold, are "captures the request and the times that suit", so three
     rules: no "take" with the job (or the time) as its object, never the
     time "they want", and any sentence that names the caller's times says
     in the same sentence that you confirm them. "Take down" is caught too:
     "takes the job down" reads the same way out of context, and "writes
     the job down" says the same thing without it. */
  { id: 'takes-the-job',
    re: /\bt(?:ake|akes|aking|aken|ook)\b(?: down)? (?:the|a|an|your|every|each) (?:jobs?|slot|booking|appointment|times?(?! to\b))\b|\bjobs? to take\b/i,
    why: 'reads as accepting a booking, and a client agent books nothing (agent-draft.ts BOOKING; end_call only). Say it writes the job down, or captures the request and the times that suit, and you confirm (audit PRICING-9)' },
  { id: 'caller-wants-time',
    re: /\b(?:times?|time window|window|slots?) (?:the caller|they|callers?) (?:wants?|asks? for|asked for|needs?|needed|would like)\b|\b(?:times?|slots?|window) wanted\b/i,
    why: '"the time they want" reads as the time they get, even beside "you confirm"; say "the times that suit them" (how-you-start.html; tests/live-buyer-truth.spec.js PRICING-9)' },
  { id: 'time-without-confirm',
    re: /\b(?:times?|time window|window|slots?) (?:that )?suits?\b|\b(?:times?|time window|window|slots?) (?:the caller|they|callers?) (?:wants?|asks? for|asked for|needs?|needed|would like)\b/i,
    unless: /\byou\b[^.?!]{0,40}\bconfirm|\bconfirmed by\b/i,
    why: 'names the times a caller asked for without saying you confirm them, so it reads as booked; say so in the same sentence ("for you to confirm", "and you confirm the slot") (audit PRICING-9)' },
  /* Page-scoped. On the after-hours page the owner's own phone rings first,
     so a speed counted from the caller's first ring is not what happens
     there; and the demo page's speed line was the one place the audit found
     the demo line sold on speed instead of on the call (MACHINE-25). */
  { id: 'speed-where-the-phone-rings-first',
    pages: ['after-hours-answering.html', 'demo.html'],
    re: /\b(?:in|within) (?:a few )?seconds\b/i,
    why: 'on this page the call reaches Nevamis only after the owner\'s phone has rung unanswered; say it answers when you do not pick up' },
];

/* ---------- each rule's own examples ----------
   MUST_FIRE is the audit's own quote for each rule plus the next way of
   saying it; MUST_PASS is the true sentence that replaced it. Loosening a
   pattern until a MUST_FIRE line passes, or tightening it until a MUST_PASS
   line fires, fails this file, so a rule cannot be quietly weakened or made
   so strict that someone deletes it. */
export const MUST_FIRE = [
  ['summary-field', 'Commercial vs residential: Asked on every call and marked on the summary, so you can handle each your own way.'],
  ['summary-field', 'Identified on the call and noted on your summary.'],
  ['texted-window', 'The window they need captured and texted to you, so you confirm the slot.'],
  ['texted-window', 'It texts you the slot they want.'],
  ['escalation', 'If a caller reports sparks, heat, or a burning smell, that call is escalated the way you tell us to escalate it.'],
  ['escalation', 'Escalates an emergency'],
  ['escalation', 'Escalates to you instead'],
  ['escalation', 'Urgent calls escalate'],
  ['escalation', 'Shut-off guidance from your approved script, then escalation.'],
  ['escalation', 'Handled the way you tell us.'],
  ['overage-cap', '1,400 minutes included on the AI Front Desk, then C$0.75 a minute, or a cap you choose'],
  ['overage-cap', 'Choose your own limit and it stops answering there.'],
  ['concurrency', 'Answers in parallel'],
  ['concurrency', 'this does that part without a queue, inside the minutes your plan includes.'],
  ['concurrency', 'Never on hold, never busy.'],
  ['instant-answer', 'Answers immediately'],
  ['instant-answer', 'It picks up on the first ring.'],
  ['same-model', 'Call (587) 413-0035 and hear the same voice and model your own line would run on.'],
  ['same-model', 'The demo line runs on the same voice and the same model your line would.'],
  ['reads-details-back', 'Repeats the details back to the caller'],
  ['reads-details-back', 'It reads the job details back to them.'],
  ['product-named-modes', 'Overflow coverage picks up only when you do not.'],
  ['product-named-modes', 'Full-time front line answers everything and flags the calls that genuinely need a person.'],
  ['unmeasured-absolute', 'Every unanswered call is a customer who is already dialling somebody else.'],
  ['unmeasured-absolute', 'By the time you play a message back the next morning, the caller has usually already reached somebody who picked up.'],
  ['unmeasured-absolute', 'Restoration work is won in the first hour.'],
  ['unmeasured-absolute', 'Your busiest calls arrive at the worst possible hour.'],
  ['unmeasured-absolute', 'A busy signal is a lost caller.'],
  ['unmeasured-absolute', 'The job is not lost because of price or quality.'],
  ['unmeasured-absolute', 'We read public pages and list businesses of exactly the kind you want more of.'],
  ['unmeasured-absolute', 'Hazard questions run on every call.'],
  ['unmeasured-absolute', 'Quoted exactly as you set it, every time.'],
  ['unmeasured-absolute', 'You set the line between the two, and it holds on every call at every hour.'],
  ['books-or-hands-off', 'I can do Tuesday at 10 AM or Thursday at 1 PM. Which works better?'],
  ['books-or-hands-off', 'Calendar has openings'],
  ['books-or-hands-off', 'Offering available slots'],
  ['books-or-hands-off', 'That qualifies as an emergency. I have your details and I am alerting the on-call technician now, flagged urgent.'],
  ['books-or-hands-off', 'Nevamis answers calmly and books the assessment.'],
  ['competitor-result', 'It also does not qualify anyone, take a job down, or stop a caller reaching your competitor.'],
  ['competitor-result', 'It keeps your callers from going to a competitor.'],
  ['competitor-assertion', 'Usually, at a premium'],
  ['competitor-assertion', 'Depends on their volume'],
  ['competitor-assertion', 'Live answering services use real people and charge per call or minute.'],
  ['banned-buyer-word', 'There is no trial and no minimum term.'],
  ['banned-buyer-word', 'No pilot, no free period, no discount.'],
  ['dial-code-only', 'You set the mode by dialling a short code on your phone, and we can walk you through it.'],
  ['dial-code-only', 'To switch it on, just dial *72 and your number.'],
  ['dial-code-only', 'You set it up by dialing a short code on your phone.'],
  ['dial-code-only', 'Simply dialing *72 switches it on.'],
  ['confirm-time-promise', 'It takes the job and any time they ask for, confirms their callback number, and tells them your team will confirm the time.'],
  ['confirm-time-promise', 'Yes, and says your team will confirm any time they asked for'],
  ['confirm-time-promise', "I've noted tomorrow between eight and ten, and someone from the office will confirm the exact time."],
  ['confirm-time-promise', 'Your team confirms the time.'],
  ['confirm-time-promise', 'A person will confirm your appointment time.'],
  ['question-builder', 'We set it up to ask what you would ask, such as what stopped working.'],
  ['question-builder', 'Qualified the way you would'],
  ['question-builder', 'Asks your qualifying questions'],
  ['question-builder', 'Asks the qualifying questions you approved'],
  ['question-builder', 'It asks the questions you approve on each call.'],
  /* PRICING-9: the audit's own quote, each place these pages said it, and
     the next way of saying it. */
  ['takes-the-job', 'A configured voice agent that answers a business phone line 24/7, qualifies the caller, takes the job and the time they want, and sends the owner a summary of every call within seconds.'],
  ['takes-the-job', 'On your line it takes the job and the time the caller wants, and you confirm the slot.'],
  ['takes-the-job', 'It takes the job and any time they ask for, confirms their callback number, and tells them your team will get back to them.'],
  ['takes-the-job', 'Nevamis picks up your existing line 24/7, qualifies the caller, takes the job details, and texts them to you.'],
  ['takes-the-job', 'Takes the job down in full'],
  ['takes-the-job', 'It also does not qualify anyone or take a job down.'],
  ['takes-the-job', 'If most are the same twenty questions and a job to take down, this does that part.'],
  ['takes-the-job', 'It takes the slot they asked for.'],
  ['caller-wants-time', 'Everything else is captured with the time the caller wants, for you to confirm.'],
  ['caller-wants-time', 'Name, number, the job, and the time window they want, ready for you to confirm.'],
  ['caller-wants-time', 'The window they need captured on the call and in your portal, so you confirm the slot.'],
  ['caller-wants-time', 'It takes the job and the time wanted for the owner to confirm.'],
  ['time-without-confirm', 'Taken down with the time they want, without interrupting anyone.'],
  ['time-without-confirm', 'Answers your line when you cannot, captures the job, the address and the times that suit the caller, and texts you the summary.'],
  ['time-without-confirm', 'It captures the request and the times that suit them. Then you confirm the slot.'],
  ['question-builder', 'Commercial vs residential . Asked when you approve the question, with the answer in the call recording in your portal.'],
  ['question-builder', 'Maintenance plans . Asked about when you approve the question.'],
  ['speed-where-the-phone-rings-first', 'Your number, your rules, answered in seconds.', 'after-hours-answering.html'],
  ['speed-where-the-phone-rings-first', 'It answers in seconds, any hour. Try to stump it.', 'demo.html'],
];

export const MUST_PASS = [
  'Can be asked when you approve the question, with the answer in the call recording in your portal, so you can handle each your own way.',
  'It asks about the job, where it is and how urgent it is, and it can be set up to ask what you would ask, such as what stopped working.',
  'Asks about the job, where it is, and how urgent',
  'The times that suit them are captured on the call and in your portal, so you confirm the slot.',
  'It writes down the job and the times that suit the caller, for you to confirm.',
  'Everything else is captured with the times that suit the caller, for you to confirm.',
  'It does not book into your calendar. It takes the request and the times that suit; you confirm',
  'Writes the job down in full',
  'When the call is urgent work you take, Nevamis captures the urgent details and alerts your team.',
  'Take the time to compare both.',
  'And the calls you cannot take.',
  'You switch it on with your provider, often by dialing a short code.',
  'If a caller describes a fire or a shock hazard, it tells them to hang up and call 9-1-1 before anything else.',
  'When the call is urgent work you take, Nevamis captures the urgent details and alerts your team, with the summary flagged urgent and sent straight to your phone.',
  'Captures the urgent details and alerts your team, by the rules you set',
  'Takes a message and flags it for you',
  '1,400 minutes included on the AI Front Desk, then C$0.75 a minute, and calls keep being answered',
  "You set the mode with your phone provider, often by dialling short codes on your phone, or in your provider's portal for a hosted business line, and we can walk you through it.",
  'You switch on forwarding with your phone provider, often by dialling a short code, and we can walk you through it.',
  'Call (587) 413-0035 and hear the same voice your own line would use.',
  'Yes, and says your team will get back to them',
  'It confirms their callback number and tells them your team will get back to them.',
  'The times that suit them are captured on the call and in your portal, and the assessment slot is confirmed by a person on your side.',
  'It asks about the job, where it is and how urgent it is.',
  'The AI Front Desk has two forwarding modes. Overflow sends it the calls you do not answer.',
  'With overflow forwarding, the front desk picks up only when you do not.',
  'An unanswered call can be a customer who rings the next name on the list.',
  'By the time you play a message back the next morning, the caller may already have reached somebody who picked up.',
  'A caller who hears a busy signal may not try again.',
  'We read public pages and list businesses of the kind you want more of.',
  'Quoted as you wrote it and never estimated.',
  'Voicemail is free and it is better than nothing. It also does not qualify anyone or write a job down, and a caller who hears the beep can just ring the next number.',
  'Does a call at 2 AM cost more?',
  'Is it per call or per minute, and is there a monthly minimum?',
  'A live answering service puts a person on your line, and people are good at things software is not.',
  'No minimum term. Here is exactly what is built and tested before your line is answered.',
  'Every answered call is in your portal with its summary and recording.',
  'Book a 15-min call',
  "I've noted tomorrow between eight and ten, and someone from the office will get back to you about it.",
  'Nevamis picks up in your business\'s tone, day or night, while you stay on the tools.',
  /* Not on the two scoped pages, so not a finding: the claims ledger keeps
     "It answers in seconds" (CLM-02) for the pages where it is true. */
  ['Answered in seconds', 'hvac.html'],
];

/* ---------- what a visitor (and an answer engine) reads ---------- */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', mdash: '—', ndash: '–' };
const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);

/** The page as read: HTML comments, styles and executable scripts gone; the
 *  title, every meta content (description, og:*, twitter:*) and JSON-LD kept,
 *  each ended with a full stop so a rule cannot run from one into the next. */
export function renderedText(html) {
  return decode(String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script(?![^>]*application\/ld\+json)[\s\S]*?<\/script>/gi, ' ')
    .replace(/<meta\b[^>]*\bcontent="([^"]*)"[^>]*>/gi, ' $1 . ')
    /* Block ends, and a card's title, end a sentence: without this a card
       title and the blurb under it read as one clause. */
    .replace(/<\/(?:p|h[1-6]|li|td|th|title|strong|div)>/gi, ' . ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

const ruleApplies = (rule, file) => !rule.pages || !file || rule.pages.includes(file);

/** The sentence a match at [start, end) sits in. A semicolon does not end
 *  it: "the times that suit; you confirm" is one sentence (how-you-start.html). */
function sentenceAround(text, start, end) {
  const before = Math.max(text.lastIndexOf('.', start - 1), text.lastIndexOf('?', start - 1), text.lastIndexOf('!', start - 1));
  const after = text.slice(end).search(/[.?!]/);
  return text.slice(before + 1, after < 0 ? text.length : end + after);
}

/** Every rule a piece of text breaks, as [{ id, why, excerpt }]. A rule is
 *  reported once, at its first match its `unless` does not excuse. */
export function claimFindings(text, file) {
  const out = [];
  for (const rule of CLAIM_RULES) {
    if (!ruleApplies(rule, file)) continue;
    const every = new RegExp(rule.re.source, rule.re.flags.replace('g', '') + 'g');
    for (const m of text.matchAll(every)) {
      if (rule.unless && rule.unless.test(sentenceAround(text, m.index, m.index + m[0].length))) continue;
      out.push({ id: rule.id, why: rule.why, excerpt: text.slice(Math.max(0, m.index - 50), m.index + m[0].length + 50).trim() });
      break;
    }
  }
  return out;
}

/* ---------- structure: the parts a regex over prose cannot see ---------- */
const textOf = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const AI_LED = /^\s*(?:an?\s+)?AI\b/i;

/** Titles, the h1 and every card title do not lead with "AI"; the
 *  answering-service column only asks; one BreadcrumbList and one page node
 *  per page, the breadcrumb ending at the page the visible crumb names. */
export function structureFindings(file, html) {
  const out = [];
  const say = (id, why, excerpt) => out.push({ id, why, excerpt });

  /* 1. NEVER LEAD WITH AI (owner rule; decision #17). The compare pages'
        <title>, og:title, h1 and every card that linked to them said
        "AI Receptionist vs ..." until 2026-10-03 (COMPARE-9). */
  const titled = [
    ...[...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => ['<title>', m[1]]),
    ...[...html.matchAll(/<meta property="og:title" content="([^"]*)"/gi)].map((m) => ['og:title', m[1]]),
    ...[...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => ['<h1>', m[1]]),
    ...[...html.matchAll(/<a [^>]*><strong>([\s\S]*?)<\/strong>/gi)].map((m) => ['card title', m[1]]),
  ];
  for (const [where, raw] of titled) {
    const t = textOf(raw);
    if (AI_LED.test(t)) say('ai-led-title', `the ${where} leads with "AI"; lead with the outcome or the brand (owner rule; decision #17)`, t);
  }

  /* 1b. THE SNIPPET ENDS A SENTENCE. build-content falls back to the lede
        cut at 155 characters, and on 2026-10-03 that cut ended the
        after-hours page's search result at "answered when you do". A page
        whose description stops mid-sentence gets its own `description`. */
  for (const m of html.matchAll(/<meta (?:name="description"|property="og:description") content="([^"]*)"/gi)) {
    const d = decode(m[1]).trim();
    if (!/[.?!]$/.test(d)) say('cut-description', 'the description stops mid-sentence (the 155-character lede fallback); give the page its own description in pages.mjs', d);
    /* 1c. AND IT FITS (CHECK-RUNNER-7). A search result shows about 160
          characters of a description and cuts the rest, so a longer one
          ends mid-sentence where a buyer reads it anyway. */
    if (d.length > 160) say('long-description', `the description is ${d.length} characters; a search result cuts it at about 160 (audit CHECK-RUNNER-7)`, d);
  }

  /* 1d. A SHARED LINK NAMES ITS PAGE (MACHINE-25). og:url, og:type and
        og:site_name were missing on five pages on 2026-10-03, so a link
        shared from one carried no canonical address or site name. Every page
        here carries all three, and og:url is the page's own canonical. */
  const metaProp = (p) => (html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`, 'i')) || [])[1];
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/i) || [])[1];
  for (const p of ['og:url', 'og:type', 'og:site_name']) {
    if (!metaProp(p)) say('og-meta', `carries no ${p}; a shared link needs it (audit MACHINE-25)`, file);
  }
  if (metaProp('og:url') && canonical && metaProp('og:url') !== canonical) {
    say('og-meta', 'og:url is not the page\'s canonical address (audit MACHINE-25)', `${metaProp('og:url')} vs ${canonical}`);
  }

  /* 2. THE OTHER COLUMN ASKS (COMPARE-5). On a compare table whose middle
        column is a competitor rather than voicemail, every cell in that
        column is a question for the buyer to put to them. */
  for (const table of html.matchAll(/<table class="compare">([\s\S]*?)<\/table>/gi)) {
    const heads = [...table[1].matchAll(/<th scope="col">([\s\S]*?)<\/th>/gi)].map((m) => textOf(m[1]));
    if (!heads[1] || /^voicemail$/i.test(heads[1])) continue;
    for (const row of table[1].matchAll(/<tr><th scope="row">[\s\S]*?<\/th><td([^>]*)>([\s\S]*?)<\/td>/gi)) {
      const cell = textOf(row[2]);
      if (!/\?$/.test(cell) || !/class="ask"/.test(row[1])) {
        say('competitor-column-asserts', 'the competitor column states a fact nothing in docs/CLAIMS-LEDGER.md sources; make it the question a buyer should ask them (class "ask", ending in "?")', cell);
      }
    }
  }

  /* 3. ONE BREADCRUMB, ONE PAGE NODE (MACHINE-24). The nine generated pages
        carried no structured data until 2026-10-03, and demo.html carried
        two identical BreadcrumbLists (one by hand, one from
        build-schema.mjs). */
  const nodes = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch (e) { say('json-ld', `a JSON-LD block does not parse: ${e.message}`, m[1].slice(0, 80)); continue; }
    nodes.push(...(Array.isArray(parsed) ? parsed : [parsed]));
  }
  const crumbs = nodes.filter((n) => n?.['@type'] === 'BreadcrumbList');
  const pagesNodes = nodes.filter((n) => /^(?:WebPage|CollectionPage|AboutPage|ContactPage)$/.test(n?.['@type']));
  if (crumbs.length !== 1) say('breadcrumb-count', `carries ${crumbs.length} BreadcrumbList blocks; a page has exactly one, generated`, file);
  if (pagesNodes.length !== 1) say('webpage-count', `carries ${pagesNodes.length} WebPage nodes; a page has exactly one, generated`, file);
  const visible = html.match(/<p class="crumb">([\s\S]*?)<\/p>/);
  if (crumbs.length === 1 && visible) {
    const shown = textOf(visible[1]).split(' / ').map((s) => s.trim());
    const listed = (crumbs[0].itemListElement || []).map((i) => i.name);
    if (shown.join(' / ') !== listed.join(' / ')) {
      say('breadcrumb-mismatch', 'the BreadcrumbList does not name the trail a visitor sees', `${listed.join(' / ')} vs ${shown.join(' / ')}`);
    }
  }
  return out;
}

/* ---------- the published assets this layer owns ----------
   COMPLETENESS-4 and -7 (2026-10-03). The example-call recordings
   (assets/call-*.mp3) stayed public after demo.html stopped playing them on
   2026-09-19, because in them the agent books a job, which a client agent
   cannot do. The four industry photos stayed public after the trade cards
   dropped them, and assets/ringback.mp3 after ring.xml moved to
   ringback-tone.wav. Every one returned 200 at a stable URL with nothing on
   the site pointing at it. The rule: a file in these families is published
   only while something served refers to it. */
const OWNED_ASSET = (rel) => /^assets\/(?:call-\d+\.mp3|ringback\.mp3|industries\/[^/]+)$/.test(rel);
const TEXT_EXT = /\.(?:html|js|mjs|css|json|xml|txt|webmanifest|svg)$/i;

export function orphanAssetFindings(root) {
  const candidates = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${ent.name}`;
      if (ent.isDirectory()) { if (rel === 'assets/industries') walk(rel); continue; }
      if (OWNED_ASSET(rel)) candidates.push(rel);
    }
  };
  walk('assets');
  if (!candidates.length) return [];
  /* What could refer to one: every served text file at the top level and
     under assets/, read once. node_modules, docs and the test tree are not
     served. */
  const corpus = [];
  const read = (dir) => {
    for (const ent of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ent.name.startsWith('_') || ent.name === 'node_modules') continue;
      const rel = dir === '.' ? ent.name : `${dir}/${ent.name}`;
      if (ent.isDirectory()) { if (rel === 'assets' || rel.startsWith('assets/')) read(rel); continue; }
      if (TEXT_EXT.test(ent.name)) corpus.push(fs.readFileSync(path.join(root, rel), 'utf8'));
    }
  };
  read('.');
  const all = corpus.join('\n');
  return candidates
    .filter((rel) => !all.includes(rel) && !all.includes(rel.replace(/^assets\//, '')))
    .map((rel) => ({ id: 'orphan-asset', why: 'published at a stable URL and referred to by nothing served; delete it (git history keeps it) or reference it', excerpt: rel }));
}

/* ---------- content-map.json ----------
   Every string a reader of /content-map.json sees, not only the five keys a
   page renders: the file is served publicly (MACHINE-19 found the
   how-you-start blurb saying "trial" there), so a "query", a new key or the
   top-level comment is read as much as a blurb is. Only the addresses and
   the cluster names are skipped, which are identifiers, not copy. */
const IDENTIFIERS = new Set(['file', 'url', 'cluster', 'site', 'priority']);

export function contentMapFindings(map) {
  const out = [];
  const rows = [{ ...map, pages: undefined, file: 'top level' }, ...(map.pages || [])];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (IDENTIFIERS.has(key) || typeof row[key] !== 'string') continue;
      const where = `content-map.json (${row.file} ${key})`;
      for (const f of claimFindings(row[key])) out.push({ file: where, ...f });
      if (/title/i.test(key) && AI_LED.test(row[key])) out.push({ file: where, id: 'ai-led-title', why: 'a title leads with "AI" (owner rule; decision #17)', excerpt: row[key] });
    }
  }
  return out;
}

/* ---------- the rules' own examples, checked on every run ---------- */
export function selfTestFindings() {
  const out = [];
  for (const [id, sentence, file] of MUST_FIRE) {
    if (!CLAIM_RULES.some((r) => r.id === id)) { out.push(`MUST_FIRE names a rule that does not exist: ${id}`); continue; }
    if (!claimFindings(sentence, file).some((f) => f.id === id)) out.push(`rule ${id} no longer catches its own example: "${sentence}"`);
  }
  for (const entry of MUST_PASS) {
    const [sentence, file] = Array.isArray(entry) ? entry : [entry, 'electricians.html'];
    const hits = claimFindings(sentence, file);
    if (hits.length) out.push(`rule ${hits[0].id} fires on a true sentence: "${sentence}"`);
  }
  /* The structural rules, on the smallest page each one is about. */
  const OG = '<link rel="canonical" href="https://nevamis.ca/x.html"><meta property="og:type" content="website">'
    + '<meta property="og:url" content="https://nevamis.ca/x.html"><meta property="og:site_name" content="Nevamis">';
  const page = (title, h1, td, crumb = 2) => `<title>${title}</title><meta property="og:title" content="${title}">${OG}<h1>${h1}</h1>`
    + `<p class="crumb"><a href="/">Home</a> / X</p>`
    + `<script type="application/ld+json">${JSON.stringify([{ '@type': 'BreadcrumbList', itemListElement: [{ name: 'Home' }, { name: 'X' }] }, { '@type': 'WebPage' }].concat(crumb > 2 ? [{ '@type': 'BreadcrumbList', itemListElement: [] }] : []))}</script>`
    + `<table class="compare"><thead><tr><th scope="col">Ask about</th><th scope="col">Live answering service</th><th scope="col">Nevamis</th></tr></thead>`
    + `<tbody><tr><th scope="row">Cost</th>${td}<td class="yes">Yes</td></tr></tbody></table>`;
  const ids = (html) => structureFindings('x.html', html).map((f) => f.id);
  const clean = page('Nevamis vs Voicemail | Nevamis', 'Nevamis vs voicemail', '<td class="ask">Is it per call?</td>');
  if (ids(clean).length) out.push(`a structural rule fires on a clean page: ${ids(clean).join(', ')}`);
  if (!ids(page('AI Receptionist vs Voicemail | Nevamis', 'Nevamis vs voicemail', '<td class="ask">Is it per call?</td>')).includes('ai-led-title')) out.push('ai-led-title no longer catches an AI-led <title>');
  if (!ids(page('Nevamis vs Voicemail', 'AI receptionist vs voicemail', '<td class="ask">Is it per call?</td>')).includes('ai-led-title')) out.push('ai-led-title no longer catches an AI-led h1');
  if (!ids(page('Nevamis vs Voicemail', 'Nevamis vs voicemail', '<td class="part">Per call or per minute</td>')).includes('competitor-column-asserts')) out.push('competitor-column-asserts no longer catches an asserted cell');
  if (!ids(page('Nevamis vs Voicemail', 'Nevamis vs voicemail', '<td class="ask">Is it per call?</td>', 3)).includes('breadcrumb-count')) out.push('breadcrumb-count no longer catches a second BreadcrumbList');
  if (!ids(clean + '<meta name="description" content="Your number, your rules, answered when you do">').includes('cut-description')) out.push('cut-description no longer catches a description cut mid-sentence');
  /* content-map.json: a key no page renders is still read at /content-map.json. */
  const mapIds = (row) => contentMapFindings({ _comment: 'Source of the page set.', pages: [{ file: 'x.html', url: '/x.html', cluster: 'trade', ...row }] }).map((f) => f.id);
  if (mapIds({ blurb: 'Answered while you work.', query: 'answering service' }).length) out.push('contentMapFindings fires on a clean row');
  if (!mapIds({ query: 'answering service free trial' }).includes('banned-buyer-word')) out.push('contentMapFindings no longer reads a key no page renders (MACHINE-19)');
  if (!contentMapFindings({ _comment: 'No pilot here.', pages: [] }).some((f) => f.id === 'banned-buyer-word')) out.push('contentMapFindings no longer reads the top-level comment');
  if (!ids(clean + `<meta name="description" content="${'A sentence that runs on. '.repeat(7)}">`).includes('long-description')) out.push('long-description no longer catches a description over 160 characters');
  if (!ids(clean.replace('<meta property="og:site_name" content="Nevamis">', '')).includes('og-meta')) out.push('og-meta no longer catches a page with no og:site_name');
  if (!ids(clean.replace('content="https://nevamis.ca/x.html">', 'content="https://nevamis.ca/y.html">')).includes('og-meta')) out.push('og-meta no longer catches an og:url that is not the canonical');
  return out;
}

/* ---------- the whole check, as build-content.mjs and the CLI run it ---------- */

/** `pages` maps a file name to the HTML about to be written (or on disk).
 *  demo.html and content-map.json are read from disk: this layer owns their
 *  claims, and no other builder writes them. */
export function contentClaimFindings(root, pages) {
  const findings = [];
  for (const msg of selfTestFindings()) findings.push({ file: 'scripts/content/claim-rules.mjs', id: 'self-test', why: msg, excerpt: '' });
  const all = { ...pages };
  const demo = path.join(root, 'demo.html');
  if (fs.existsSync(demo)) all['demo.html'] = fs.readFileSync(demo, 'utf8');
  for (const [file, html] of Object.entries(all)) {
    for (const f of claimFindings(renderedText(html), file)) findings.push({ file, ...f });
    for (const f of structureFindings(file, html)) findings.push({ file, ...f });
  }
  /* motion.js loads on every page this layer writes, and the copy it builds
     is copy a visitor reads: its string literals, comments stripped, judged
     like a page (COMPLETENESS-5). */
  const motion = path.join(root, 'motion.js');
  if (fs.existsSync(motion)) {
    const prose = jsStringLiterals(stripJsComments(fs.readFileSync(motion, 'utf8'))).map(renderedProse).filter(Boolean).join(' . ');
    for (const f of claimFindings(prose, 'motion.js')) findings.push({ file: 'motion.js', ...f });
  }
  const map = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'));
  findings.push(...contentMapFindings(map));
  for (const f of orphanAssetFindings(root)) findings.push({ file: f.excerpt, ...f });
  return findings;
}

export function formatFindings(findings) {
  return findings.map((f) => `  ${f.file}: [${f.id}] ${f.why}${f.excerpt ? `\n      "${f.excerpt}"` : ''}`).join('\n');
}

/* ---------- CLI: judge the pages as committed ---------- */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const map = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'));
  const { PAGES } = await import('./pages.mjs');
  const pages = {};
  for (const file of [...Object.keys(PAGES), 'solutions.html']) {
    if (map.pages.some((p) => p.file === file)) pages[file] = fs.readFileSync(path.join(root, file), 'utf8');
  }
  const findings = contentClaimFindings(root, pages);
  if (findings.length) {
    console.error(`FAIL: ${findings.length} content claim finding(s):\n${formatFindings(findings)}`);
    process.exit(1);
  }
  console.log(`content claims OK: ${CLAIM_RULES.length} rules, ${MUST_FIRE.length} must-fire and ${MUST_PASS.length} must-pass examples, ${Object.keys(pages).length + 1} pages and content-map.json clean, no orphaned call, ringback or industry asset.`);
}
