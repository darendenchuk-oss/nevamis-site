/* Body content for the generated content pages, kept out of the builder so
   the copy is easy to read and edit. Every claim here must be supportable:
   the product genuinely does these things, and nothing invents a client,
   a statistic, or a result. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const DEMO = '(587)&nbsp;413-0035';

/* PRICES ARE READ, NEVER TYPED. pricing-config.js is the single source of
   truth for every figure (its own header says "do not duplicate these values
   in HTML, render from here"), and no guard compares a C$ figure on these nine
   pages with it: guards 7c and 7d catch retired figures and retired shapes,
   not a wrong current one. So the few figures these pages quote are read from
   the config the same way build-schema.mjs reads it, and the build refuses to
   run rather than print a figure it could not find. Added 2026-09-19 with the
   Missed-Call Recovery card and the answering-service cost row (fix plan A25,
   A27). */
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'pricing-config.js'), 'utf8'), cfgSandbox);
const NV = cfgSandbox.window.NV_PRICING || {};
const MISSED_CALL = (NV.addOns || []).find((a) => a.id === 'missed_call_recovery');
const FRONT_DESK = (NV.plans || []).find((p) => p.id === 'pro');
if (!MISSED_CALL || !MISSED_CALL.sellable || !(MISSED_CALL.launch > 0) || !(MISSED_CALL.monthly > 0)) {
  throw new Error('pages.mjs: pricing-config.js has no sellable missed_call_recovery add-on with a launch and a monthly; refusing to print its price.');
}
if (!FRONT_DESK || !(FRONT_DESK.includedMinutes > 0) || !(FRONT_DESK.overage > 0)) {
  throw new Error('pages.mjs: pricing-config.js has no "pro" plan with included minutes and an overage rate; refusing to print them.');
}
/** C$500, C$1,500, C$0.75: whole dollars bare, cents to two places. */
const cad = (n) => 'C$' + n.toLocaleString('en-US', {
  minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2,
});
const count = (n) => n.toLocaleString('en-US');

/** The platform paragraph that sits under the hero CTAs on the four trade
    pages. It lived only in the generated HTML until 2026-08-27, so any run of
    build-content.mjs deleted it from all four at once. Trailing blank line is
    part of the block: it is what the checked-in pages carry.

    Rewritten 2026-09-19 (fix plan A12). It said the scan "puts a range on what
    is leaking" from "your public footprint", and called the listed businesses
    "the customers worth calling". The scan reads only the business's own
    public website and every figure it gives is a modelled range, the leak
    framing was retired by DC#54, and Lead Generation lists businesses the
    owner decides on: nobody on the list is contacted by us. */
export const TRADE_HERO_PROOF = `      <p class="proof">The phone is one part of Nevamis. Lead Generation, offered by invitation, finds businesses of the kind you want more of. A person here reads public pages and builds the list, with the page each one came from, and you decide every one. Nobody on it is contacted by us. Quote Recovery follows up the quotes you already sent, with your name on each email and your approval before it goes.
        Or <a href="https://app.nevamis.ca/scan" data-evt="trade_scan_click">scan my website</a>: it reads only what is public on your own site, and any figure it gives is a modelled range, not a measurement.</p>
`;

/** Shared closing block: the honest proof we actually have.

    Until 2026-09-19 it said "The demo line runs the same agent your business
    would get". It does not: the demo line is Nevamis's own sales agent, which
    can set up a call with us, while a client's agent has no booking tool at
    all. They share the voice (fix plan A6). They do NOT share the language
    model: the demo line runs its own and a client's agent is created with
    another (engine src/lib/elevenlabs-provision.ts), so "the same voice and
    the same model", which this said until 2026-09-23, was false.

    "On your line it takes the job and the time the caller wants" until
    2026-10-03 (audit PRICING-9). "Takes the job" reads as accepting a
    booking and "the time they want" as the time they get, and a client
    agent books nothing. The words are how-you-start.html's: it captures the
    request and the times that suit, and you confirm. This block closes ten
    pages, and claim-rules.mjs (takes-the-job, caller-wants-time,
    time-without-confirm) holds every page here to the same words. */
export const PROOF_BLOCK = `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Judge it yourself</p>
      <h2>Do not take our word for it. Call it.</h2>
      <p>The fastest way to know whether this is good enough for your customers is to
        be a customer. The demo line runs on the same voice your line
        would. It answers for Nevamis, so it can set up a call with us. On your line it
        captures the request and the times that suit the caller, and you confirm the slot.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-primary btn-lg" href="tel:+15874130035" data-evt="demo_phone_click">Hear it answer ${DEMO}</a>
      <a class="btn btn-ghost btn-lg" href="/book.html" data-evt="hero_book_call_click">Book a 15-min call</a>
    </div>
  </div>
</section>`;

/* The last section, "More of the work you want" (owner decision B2b,
   2026-09-19): the trade pages were phone-only while the homepage's industry
   cards promise Lead Generation and Quote Recovery behind each trade. Lead
   Generation always carries "by invitation" and no price, volume, guarantee,
   automation or contact claim. The pricing link carries no data-evt on
   purpose: trade_pricing_click already fires from "Compare plans" above, and
   one name from two placements on a page is what tests/analytics.spec.js
   refuses. hero_book_call_click is one of the three names that test lets fire
   from several placements.

   Two of its sentences were tightened on 2026-10-03 (review of PR #42).
   "Qualified the way you would" over "We set it up to ask what you would ask"
   read as a question builder. There is none: the client agent's prompt takes
   hours, services, area, the approved FAQ and a booking link, and tells it to
   capture the name, callback number, job, location and urgency "in a question
   or two" (engine src/domain/agent-draft.ts, buildClientAgentPrompt). A trade
   question can only ride in as approved text, so the copy says what it asks
   and that it CAN be set up to ask more. "Tells them your team will confirm
   the time" is said only by a client with a booking link; with none, the
   agent takes a complete message and says the business will get back to them
   in general terms. "Will get back to them" is true on both.

   "It takes the job and any time they ask for" opened "Written down, not
   lost" until the same day's polish pass (audit PRICING-9): the time with no
   word about who confirms it reads as booked. It now writes the job down,
   and the times that suit the caller are for you to confirm. */
const tradeBody = ({ trade, urgency, jobs, whenItRings, questions, afterHours }) => `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">The problem</p>
      <h2>${whenItRings}</h2>
      <p>You cannot answer a phone with your hands full, so the call goes to voicemail.
        A caller who reaches voicemail can ring the next name on their list before you have
        heard the message.</p>
    </div>
    <div class="proc">
      <div class="reveal"><h3>Answered in seconds</h3><p>Nevamis picks up in your
        business's tone, day or night, while you stay on the tools.</p></div>
      <div class="reveal"><h3>Asks what the job needs</h3><p>${questions}</p></div>
      <div class="reveal"><h3>Written down, not lost</h3><p>It writes down the job and the
        times that suit the caller, for you to confirm. It confirms their callback number and
        tells them your team will get back to them.</p></div>
    </div>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Built around ${trade}</p>
      <h2>It answers with your rules, not a generic script.</h2>
      <p>Before it takes a single call we agree on what it is allowed to say. Your service
        area, your hours, your job types, the prices you approve, and what counts as an
        emergency for your business.</p>
    </div>
    <div class="stack" aria-label="What we configure for ${trade}">
      ${jobs.map((j) => `<div class="layer"><strong>${j.t}</strong><span>${j.d}</span></div>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Urgency handled properly</p>
      <h2>${urgency}</h2>
      <p>${afterHours} For anything outside the rules you approved, it takes a message and
        flags it for you rather than inventing an answer. You decide what counts as urgent
        for your business, and everything else is taken down for the morning.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-ghost" href="/how-you-start.html" data-evt="trade_start_click">See how you start</a>
      <a class="btn btn-ghost" href="/pricing.html" data-evt="trade_pricing_click">Compare plans</a>
    </div>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Beyond the phone</p>
      <h2>More of the work you want.</h2>
    </div>
    <div class="proc">
      <div class="reveal"><h3>Lead Generation, by invitation</h3><p>We read public pages and
        list businesses of the kind you want more of, each with the page it came from.
        You decide every one, and nobody on it is contacted by us. Lead Generation is by
        invitation, and a short call is where it starts.</p>
        <p><a href="/book.html#pick-a-time" data-evt="hero_book_call_click">Book a call</a></p></div>
      <div class="reveal"><h3>Quote Recovery</h3><p>A quote you sent that goes quiet is followed
        up for you the day it goes stale, four days on and eleven days on, each email with your
        name on it and your approval before it goes. On the pricing page it is the Quote-Chase
        Engine.</p>
        <p><a href="/pricing.html">See what it costs</a></p></div>
    </div>
  </div>
</section>`;

export const PAGES = {
  'electricians.html': {
    description: 'Panel upgrades, dead circuits and emergency calls answered on your existing line, qualified, and texted to you while your crew stays on the tools.',
    heroProof: TRADE_HERO_PROOF,
    h1: 'Your line answered while the crew is on the tools',
    lede: `Panel upgrades, dead circuits, and emergency calls answered while your crew is on the tools. Nevamis picks up your existing line 24/7, qualifies the caller, writes down the job details, and texts them to you.`,
    body: tradeBody({
      trade: 'electrical work',
      whenItRings: 'The phone rings when both your hands are in a panel.',
      questions: `It asks about the job, where it is and how urgent it is, and it can be set up to
        ask what you would ask, such as what stopped working,
        whether anything is sparking, heating, or smells like burning, whether the breaker has
        been reset, the service address, and when they can be home.`,
      urgency: 'A burning smell is not a next-Tuesday call.',
      /* Until 2026-10-03: "Hazard questions run on every call. If a caller
         reports sparks, heat, or a burning smell, that call is escalated the
         way you tell us to escalate it." There is no way to tell us: the
         client agent's prompt (engine src/domain/agent-draft.ts, EMERGENCIES)
         has a fixed LIFE SAFETY rule, told to say "hang up and call 911"
         before anything else on a fire or an electrical shock hazard no
         matter what the business does, and the only escalation after that is
         the summary marked URGENT and sent to the alert phone
         (client-notify.ts). What a client does set is what counts as urgent
         work, through the services it describes, so that is what this says
         (audit TRADES-2). */
      afterHours: `If a caller describes a fire or a shock hazard, it tells them to hang up
        and call 9-1-1 before anything else. When the call is urgent work you take, Nevamis
        captures the urgent details and alerts your team, with the summary flagged urgent and
        sent straight to your phone.`,
      jobs: [
        { t: 'Service and repair calls', d: 'Dead outlets, tripped circuits, flickering lights, panel faults.' },
        { t: 'Emergency triage', d: 'A fire or shock hazard gets the 9-1-1 advice first. Then the urgent details are captured and your team is alerted.' },
        { t: 'Quotes and upgrades', d: 'Panel upgrades and rewires captured as leads with the details you need.' },
        { t: 'Service-call pricing', d: 'Only the diagnostic or trip fee you approve, quoted as you wrote it and never estimated.' },
        { t: 'Service area', d: 'Out-of-area callers are told honestly instead of being taken on and cancelled later.' },
        { t: 'Permits and inspections', d: 'Common questions answered from your approved FAQ, not improvised.' },
      ],
    }),
  },

  'hvac.html': {
    description: 'No-heat calls answered around the clock on your own line, triaged by your emergency rules, and the summary sent to you within seconds.',
    heroProof: TRADE_HERO_PROOF,
    h1: 'The 11 PM no-heat call, answered',
    lede: `A furnace out at 11 PM in January does not wait for opening hours. Nevamis answers your line around the clock, triages the call, writes the job down, and sends you the summary.`,
    body: tradeBody({
      trade: 'heating and cooling',
      /* "Your busiest calls arrive at the worst possible hour" until
         2026-10-03: a measurement nobody made (audit TRADES-5). */
      whenItRings: 'A no-heat call does not wait for opening hours.',
      questions: `It asks about the job, where it is and how urgent it is, and it can be set up to
        ask what you would ask, such as whether there is heat at
        all, what the thermostat reads, the age and type of the system, whether anyone
        vulnerable is in the home, the address, and what times work for them.`,
      urgency: 'No heat with a newborn in the house is a different call.',
      afterHours: `You define what an emergency means for your business: a temperature
        threshold, no heat at all, or vulnerable occupants. Calls that meet it are handled as
        emergencies: Nevamis captures the urgent details and alerts your team. Everything else
        is captured with the times that suit the caller, for you to confirm.`,
      /* THE SUMMARY HAS NO ACCOUNT-TYPE FIELD. Two of these said "marked on
         the summary" (plan holders, and "Commercial vs residential: Asked on
         every call and marked on the summary") until 2026-10-03. The text and
         email a client gets (engine client-notify.ts, CallFacts) carry who
         called, what they wanted, the callback number, urgency, the outcome
         and the next step, and nothing else; the agent's data collection
         (agent-draft.ts DRAFT_DATA_COLLECTION) has no account-type, plan or
         property-manager field, and nothing makes a client's question get
         asked "on every call". What is true is that a question the client
         approves can be asked and its answer is in the call and its
         recording in the portal (audit TRADES-1). */
      jobs: [
        { t: 'No-heat and no-cool calls', d: 'Triaged by your emergency criteria, not a generic script.' },
        { t: 'Seasonal tune-ups', d: 'Written down with the times that suit them, for you to confirm.' },
        { t: 'Maintenance plans', d: 'Can be asked about when you approve the question, with the answer in the call recording in your portal.' },
        { t: 'Equipment questions', d: 'Answered from your approved FAQ, or taken as a message.' },
        { t: 'Diagnostic fee', d: 'Quoted as you wrote it and never estimated.' },
        { t: 'Commercial vs residential', d: 'Can be asked when you approve the question, with the answer in the call recording in your portal, so you can handle each your own way.' },
      ],
    }),
  },

  'plumbers.html': {
    description: 'Burst pipes, blocked drains and no hot water. Nevamis answers the calls you cannot, qualifies them, and gets the details to you within seconds.',
    heroProof: TRADE_HERO_PROOF,
    h1: 'Burst pipes and blocked drains, answered',
    lede: `Burst pipes, blocked drains, and no hot water. The calls that cannot wait are the ones you are least able to answer. Nevamis answers them, qualifies them, and gets the details to you.`,
    body: tradeBody({
      trade: 'plumbing',
      whenItRings: 'Water damage does not leave a voicemail and wait.',
      questions: `It asks about the job, where it is and how urgent it is, and it can be set up to
        ask what you would ask, such as whether water is actively
        running, whether they have found the shut-off, what is affected, how long it has been
        happening, the address, and access details.`,
      urgency: 'Active flooding gets treated as active flooding.',
      /* "Active water gets your emergency path immediately ... it holds on
         every call at every hour" until 2026-10-03: an "emergency path" the
         client does not configure and an absolute nobody measured. */
      afterHours: `When active water is urgent work you take, Nevamis captures the urgent
        details and alerts your team. Slow drains and fixture replacements are taken down
        normally. You set the line between the two when we set it up.`,
      jobs: [
        { t: 'Emergency leaks', d: 'Shut-off guidance only from your approved FAQ, then the urgent details captured and your team alerted.' },
        { t: 'Drains and blockages', d: 'Qualified and written up with the details your tech needs.' },
        { t: 'Hot water tanks', d: 'Age, type, and symptoms captured before anyone drives out.' },
        { t: 'Renovation quotes', d: 'Captured as leads rather than lost to voicemail.' },
        { t: 'Trip and diagnostic fees', d: 'Quoted as you approved them and never estimated.' },
        { t: 'Property managers', d: 'Can be asked who they manage for when you approve the question, with the answer in the call recording in your portal.' },
      ],
    }),
  },

  'restoration.html': {
    description: 'Flood, fire and damage calls answered calmly at any hour. Nevamis gathers the incident details, flags priority calls, and texts you the request.',
    heroProof: TRADE_HERO_PROOF,
    h1: 'The first hour of a loss, answered calmly',
    /* "books the assessment" until 2026-08-09. Nothing books: a tenant agent
       is provisioned with no booking tool and no calendar credential, so the
       assessment slot is confirmed by a person on your side. What is real is
       the capture and the speed it reaches you at, and that is what is sold. */
    lede: `Flood, fire, and damage calls arrive stressed and urgent, often at night. Nevamis answers calmly, gathers the incident details, flags the priority calls, and sends you the assessment request within seconds.`,
    body: tradeBody({
      trade: 'restoration and property services',
      whenItRings: 'The call comes in at the worst moment of someone\'s week.',
      questions: `It asks about the job, where it is and how urgent it is, and it can be set up to
        ask what you would ask, such as what happened, when it
        started, how much area is affected, whether the source is stopped, whether insurance is
        involved, and who is on site.`,
      urgency: 'Active loss is flagged urgent, not queued.',
      /* "Restoration work is won in the first hour." opened this until
         2026-10-03: stated as fact, measured by nobody (audit TRADES-5). */
      afterHours: `Calls that meet your emergency definition are handled as emergencies:
        Nevamis captures the urgent details and alerts your team, with the incident details
        already collected so nobody starts from nothing.`,
      /* "Fire and smoke: Handled with a calm, approved script" and
         "Assessment requests: The window they need captured and texted to
         you" until 2026-10-03. A live fire is not the owner's script: the
         agent's fixed LIFE SAFETY rule sends the caller to 9-1-1 first
         (engine agent-draft.ts). And no field carries a time window into the
         text (client-notify.ts callSummarySms): the time is taken on the
         call and is in the portal (audit TRADES-2, TRADES-3). */
      jobs: [
        { t: 'Water and flood loss', d: 'Source, spread, and timing captured while it matters.' },
        { t: 'Fire and smoke', d: 'A fire still burning gets the 9-1-1 advice first. After it is out, questions are answered from your approved FAQ, not improvised.' },
        { t: 'Insurance questions', d: 'Answered only within what you approve, otherwise taken as a message.' },
        { t: 'Emergency alerts', d: 'For the calls you count as urgent, Nevamis captures the urgent details and alerts your team.' },
        { t: 'Assessment requests', d: 'The times that suit them are captured on the call and in your portal, so you confirm the slot.' },
        { t: 'Property managers and adjusters', d: 'Can be asked when you approve the question, with the answer in the call recording in your portal.' },
      ],
    }),
  },

  /* Until 2026-09-26 this said forwarding sent calls to Nevamis "outside
     your business hours", that "during the day nothing is different",
     and offered "You choose the hours: ... any schedule" and "Calls
     forward automatically". Forwarding has no clock in it: the codes
     the portal hands a client (nevamis-engine forwarding-codes.ts and
     forwarding-setup.ts) are no-answer, busy and unreachable, or every
     call, switched only by the owner dialling them. So a daytime call
     the owner misses reaches Nevamis too, and "evenings only" means
     switching on all-calls forwarding at closing and off at opening.
     The page now says exactly that, and guard 7k's NO_MECHANISM in
     scripts/check-consistency.js refuses a schedule claim anywhere. */
  /* "Ask us for your provider's all-calls on and off codes" (review of PR
     #39, 2026-09-26): no client surface prints them yet. The portal's
     forwarding page builds the no-answer steps only, and the setup email's
     undo line gives the erase-all code first, which also removes no-answer
     forwarding. Told to "switch it off when you open", an owner using that
     code would lose daytime missed-call answering. When the engine shows
     allOn/allOff apart from eraseAll, this can point there instead. */
  'after-hours-answering.html': {
    h1: 'After-hours calls answered on your own number',
    /* "Your number, your rules, answered in seconds." until 2026-10-03, and
       the meta description is cut from this lede. On this page the owner's
       own phone rings first and a call reaches Nevamis only after it goes
       unanswered, so a speed counted from the caller's first ring is not
       what happens here (audit MACHINE-25). "a per-call answering service"
       stays: it names a kind of service, not what any provider charges. */
    lede: `Evenings, weekends, and holidays covered without hiring a night shift or paying a per-call answering service. Your number, your rules, answered when you do not pick up.`,
    /* Its own, because the lede is longer than the 155-character cut and the
       cut ended this page's search snippet at "answered when you do". */
    description: 'Evenings, weekends and holidays answered on your own number when nobody picks up, without a night shift. Your rules, and a summary of each call.',
    body: `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">How it works</p>
      <h2>You keep your number. Your phone still rings first.</h2>
      <p>Nothing about your phone setup changes permanently, and your number stays exactly as
        it is on every truck, card, and listing. You switch on forwarding with your phone
        provider, often by dialling a short code, and we can walk you through it. From then on a
        call you do not pick up, or one that comes in while your line
        is busy or your phone is off, goes to Nevamis. After hours, when nobody is picking up,
        that is every call. Forwarding follows whether you answer, not the clock, so a call you
        miss on a job during the day is answered too, and every call it answers counts toward
        your plan's included minutes. You can switch forwarding off from your own phone
        whenever you want.</p>
    </div>
    <ol class="path-steps" role="list">
      <li class="pstep"><h3>Your phone rings first</h3><p>A call goes to Nevamis only when you
        do not answer, your line is busy, or your phone is off. Evenings, weekends, and holidays
        are covered because nobody is there to pick up. A few providers only offer forwarding
        every call, and setup tells you before you switch it on.</p></li>
      <li class="pstep"><h3>Or send every call, when you choose</h3><p>If you would rather your
        phone stayed quiet at night, ask us for your provider's all-calls on and off codes, then
        dial one when you close and the other when you open. It changes only when you change
        it: there is no timer to set.</p></li>
      <li class="pstep"><h3>It answers in your name</h3><p>In your business's name and tone. If a
        caller asks whether they are talking to a person, it says plainly that it is an AI.</p></li>
      <li class="pstep"><h3>Urgent calls are flagged</h3><p>A caller in danger is told to
        call 9-1-1 first. For urgent work you take, Nevamis captures the urgent details and
        alerts your team.</p></li>
      <!-- "Routine calls get booked / into the slots your calendar genuinely
           has open" until 2026-08-09. No agent touches a calendar; the honest
           step is the structured lead and how fast it reaches you. -->
      <li class="pstep"><h3>Routine calls get captured</h3><p>Name, number, the job, and the
        times that suit them, ready for you to confirm.</p></li>
      <li class="pstep"><h3>You read it in the morning</h3><p>Each call it answers reaches you
        as a summary: who called, what they wanted, the callback number, how urgent it is, the
        outcome and what they were told.</p></li>
    </ol>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Why not just voicemail</p>
      <h2>Voicemail records the lost job. It does not save it.</h2>
      <p>By the time you play a message back the next morning, the caller may already have
        reached somebody who picked up. An after-hours call that gets answered, qualified, and
        captured is a job you can still go after. The same call sent to voicemail is a message
        you return later, if they are still waiting.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-ghost" href="/vs-voicemail.html" data-evt="situation_compare_click">Compare it to voicemail</a>
      <a class="btn btn-ghost" href="/vs-answering-service.html" data-evt="situation_compare_click">Compare it to an answering service</a>
    </div>
  </div>
</section>`,
  },

  /* "Overflow coverage" and "Full-time front line" were capitalised on this
     page until 2026-10-03, and read as two products. pricing.html sells
     neither: they are the two ways a client forwards to the one AI Front
     Desk (engine forwarding-codes.ts: no-answer, busy and unreachable
     together, or every call), so the page names them as that (audit
     PRODUCT-8). The busy card stays, because busy forwarding is real. */
  'missed-calls.html': {
    /* "Every unanswered call is a customer (who is already) dialling
       somebody else" in both lines until 2026-10-03. Wrong numbers, spam and
       callers who leave a message all make "every" false, and nothing
       measured it (audit PRODUCT-5). */
    description: 'An unanswered call can be a customer who rings the next name on the list. Work out what missed calls cost your business, and what catches each one.',
    h1: 'What missed calls actually cost you',
    lede: `An unanswered call can be a customer who rings the next name on the list. Here is how to work out what that is worth in your business, and what to do about it.`,
    body: `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Do the arithmetic</p>
      <h2>Use your own numbers, not an industry average.</h2>
      <p>The calculator on the home page asks for numbers you already know: how many calls you
        miss in a week, how many of those were real opportunities, what an average job is worth,
        and how often you close one. It starts from example figures, so replace them with your
        own. The formula is shown, and it assumes half of the calls that would have gone to
        voicemail are caught.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-primary" href="/#roi" data-evt="situation_roi_click">Open the missed-call calculator</a>
    </div>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Where the calls go</p>
      <h2>Where the calls go, and what catches each one.</h2>
      <p>The AI Front Desk has two forwarding modes. Overflow sends it the calls you do not
        answer, including when your line is busy or your phone is off. Full-time sends it every
        call. You set the mode with your phone provider, often by dialling short codes on your
        phone, or in your provider's portal for a hosted business line, and we can walk you
        through it.</p>
    </div>
    <div class="proc">
      <div class="reveal"><h3>After hours</h3><p>Nobody is picking up in the evenings or at
        weekends, so the same overflow forwarding that catches a call you miss on a job sends
        those calls to Nevamis.
        <a href="/after-hours-answering.html">How after-hours answering works</a>.</p></div>
      <div class="reveal"><h3>On the tools</h3><p>You cannot answer mid-job. With overflow
        forwarding, the front desk picks up only when you do not.</p></div>
      <div class="reveal"><h3>Already on a call</h3><p>A caller who hears a busy signal may not
        try again. With overflow forwarding, the front desk answers the next caller while you
        are already on the phone.</p></div>
      <div class="reveal"><h3>Nobody in the office</h3><p>Forward every call and the front desk
        answers all of them, flagging the ones that need a person.</p></div>
      <div class="reveal"><h3>When you missed it anyway</h3><p>${MISSED_CALL.name} texts a caller
        you missed, once, with your business name on it and a working opt-out, on your written
        go-ahead. It sends only between 8 a.m. and 8 p.m. your time, every day, and hands over
        the moment they reply. On its own it is
        ${cad(MISSED_CALL.launch)} Launch &amp; Implementation to start, then ${cad(MISSED_CALL.monthly)} a month,
        plus applicable GST/HST.</p></div>
    </div>
  </div>
</section>`,
  },

  'vs-voicemail.html': {
    description: 'Voicemail is free and better than nothing. It does not qualify anyone or write a job down. An honest comparison, including when voicemail wins.',
    heroProof: `      <p class="proof">This comparison is about the phone. The phone is one part of Nevamis. Nevamis also offers Lead Generation, by invitation, and Quote Recovery for the quotes you already sent, which tells you which quotes came back and what they were worth.</p>`,
    /* The h1 (and content-map.json's title, which is the <title>, og:title
       and every card that links here) led with "AI receptionist" until
       2026-10-03. The owner's rule is that a title never leads with AI, and
       the client agent itself is built not to announce it (audit COMPARE-9).
       The search phrase stays in content-map.json's "query". */
    h1: 'Nevamis vs voicemail',
    /* "...or stop a caller reaching your competitor" until 2026-10-03: a
       retention result no record shows (audit COMPARE-11). */
    lede: `Voicemail is free and it is better than nothing. It also does not qualify anyone or write a job down, and a caller who hears the beep can just ring the next number. Here is the honest comparison.`,
    /* Three rows changed on 2026-10-03, each to what the client agent's
       prompt (engine src/domain/agent-draft.ts) does:
       - "Answers immediately | No | Yes" is gone. With no-answer forwarding
         the owner's phone rings first and Nevamis answers after the same
         unanswered rings voicemail waits for, so it was no difference at
         all (COMPARE-10).
       - "Repeats the details back ... and says you will confirm the time":
         the prompt confirms the callback number back once, and only a
         client with a booking link has it say the team will confirm a time
         (COMPARE-6).
       - "Escalates an emergency | By your rules" read as a hand-off. Client
         agents have end_call and nothing else; what happens is the urgent
         details captured and the team alerted (COMPARE-8, decision #40). */
    body: `
<section class="tight">
  <div class="wrap">
    <div class="compare-wrap reveal">
      <table class="compare">
        <thead><tr><th scope="col">On a call you miss</th><th scope="col">Voicemail</th><th scope="col">Nevamis</th></tr></thead>
        <tbody>
          <tr><th scope="row">Asks about the job, where it is, and how urgent</th><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><th scope="row">Writes the job down in full</th><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><th scope="row">Confirms the callback number</th><td class="no">No</td><td class="yes">Yes, and says your team will get back to them</td></tr>
          <tr><th scope="row">Flags an emergency to you</th><td class="no">No</td><td class="yes">Captures the urgent details and alerts your team, by the rules you set</td></tr>
          <tr><th scope="row">Gives you a useful summary</th><td class="part">A recording</td><td class="yes">Who called, what they wanted, the callback number, urgency, outcome and next step</td></tr>
          <tr><th scope="row">Costs nothing</th><td class="yes">Yes</td><td class="part">A one-time Launch &amp; Implementation fee to start, then a monthly plan</td></tr>
        </tbody>
      </table>
    </div>
    <p class="foot-note reveal">Voicemail genuinely wins on price. The
      question is what one recovered job a month is worth against a one-time
      Launch &amp; Implementation fee to start, then the monthly plan you would be on.</p>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">The honest version</p>
      <h2>When voicemail is the right answer.</h2>
      <p>If your phone rarely rings outside hours, if the calls you miss are mostly suppliers
        and spam, or if every job comes from repeat customers who will always leave a message,
        voicemail is fine and you should keep it. This is worth paying for when a missed call
        is a missed job.</p>
    </div>
  </div>
</section>`,
  },

  'vs-answering-service.html': {
    /* THE OTHER COLUMN ASKS, IT DOES NOT ASSERT (2026-10-03, audit
       COMPARE-5). Until then the description said answering services "charge
       per call or minute", the lede that what comes back "is usually a name
       and a number", and the table's middle column said "Usually, at a
       premium", "A script they follow", "Varies by operator", "Depends on
       their volume" and "Per call or per minute". None of that has a source
       in docs/CLAIMS-LEDGER.md, and each is a generalisation about a whole
       category of competitor. Nevamis cannot know what any one service does,
       so the column is now the question a buyer should put to the service
       they are weighing, and the Nevamis column answers the same question
       for Nevamis. scripts/content/claim-rules.mjs refuses an assertion in
       that column. */
    description: 'The questions to ask a live answering service, and how Nevamis answers each one, including where a person still wins.',
    heroProof: `      <p class="proof">Both options above answer the phone. Nevamis also offers Lead Generation, by invitation, which finds businesses of the kind you want more of and leaves every one for you to decide. It also offers Quote Recovery for the quotes you already sent. Every answered call is in your portal with its summary and recording.</p>`,
    h1: 'Nevamis vs a live answering service',
    /* "rather than book the job" until 2026-08-09: a comparison whose only
       force came from implying Nevamis books, which nothing does. The real
       difference is what comes back off the call, so that is the claim now. */
    lede: `A live answering service puts a person on your line, and people are good at things software is not. Before you choose one, ask what each call costs and what comes back to you off it. Here is how Nevamis answers the same questions.`,
    /* Two Nevamis cells changed with it (2026-10-03):
       - "Never on hold or queued | Answers in parallel" is gone. Client
         agents are created with a daily call limit (engine
         elevenlabs-provision.ts call_limits) and concurrency per agent has
         not been set or tested; FOUNDER_GLOSSARY #27 says not to promise it
         (COMPARE-7). "without a queue" left the closing paragraph with it.
       - "Escalates to you instead" became what happens: a message, flagged
         (COMPARE-8). And the cost row lost ", or a cap you choose": no
         client can choose a cap (engine usage-policy.ts has no production
         caller), and pricing.html says calls keep being answered past the
         included minutes (COMPARE-1). */
    body: `
<section class="tight">
  <div class="wrap">
    <div class="compare-wrap reveal">
      <table class="compare">
        <thead><tr><th scope="col">Ask about</th><th scope="col">Ask the answering service</th><th scope="col">Nevamis</th></tr></thead>
        <tbody>
          <tr><th scope="row">A call at 2 AM</th><td class="ask">Does a call at 2 AM cost more?</td><td class="yes">Answered at the same rate</td></tr>
          <tr><th scope="row">Your service area and prices</th><td class="ask">Do they work from your price list, or a general script?</td><td class="yes">Rules built with you</td></tr>
          <tr><th scope="row">What comes back to you</th><td class="ask">What do you get after each call?</td><td class="yes">Who called, what they wanted, the callback number, urgency, outcome and next step</td></tr>
          <tr><th scope="row">A genuine judgement call</th><td class="ask">Can the person on the line make a judgement call for you?</td><td class="part">Takes a message and flags it for you</td></tr>
          <tr><th scope="row">Cost as volume grows</th><td class="ask">Is it per call or per minute, and is there a monthly minimum?</td><td class="part">${count(FRONT_DESK.includedMinutes)} minutes included on the ${FRONT_DESK.name}, then ${cad(FRONT_DESK.overage)} a minute, and calls keep being answered</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">The honest version</p>
      <h2>Where a person still wins.</h2>
      <p>A trained person handles the unexpected better than software does, and some businesses
        need that all the time. Nevamis is built to know its limits: for anything outside the rules
        you approved, it takes a message rather than guessing. If most of your calls
        are genuinely unpredictable, hire the person. If most are the same twenty questions and a
        job to write down, this does that part, inside the minutes your plan includes.</p>
    </div>
  </div>
</section>`,
  },
};
