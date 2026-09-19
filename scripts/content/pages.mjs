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
export const TRADE_HERO_PROOF = `      <p class="proof" style="margin-top:12px">The phone is one part of Nevamis. Lead Generation, offered by invitation, finds businesses of the kind you want more of. A person here reads public pages and builds the list, with the page each one came from, and you decide every one. Nobody on it is contacted by us. Quote Recovery follows up the quotes you already sent, with your name on each email and your approval before it goes.
        Or <a href="https://app.nevamis.ca/scan" data-evt="trade_scan_click">scan my website</a>: it reads only what is public on your own site, and any figure it gives is a modelled range, not a measurement.</p>
`;

/** Shared closing block: the honest proof we actually have.

    Until 2026-09-19 it said "The demo line runs the same agent your business
    would get". It does not: the demo line is Nevamis's own sales agent, which
    can set up a call with us, while a client's agent has no booking tool at
    all. They share the voice and the model, so that is the claim now (fix
    plan A6). */
export const PROOF_BLOCK = `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Judge it yourself</p>
      <h2>Do not take our word for it. Call it.</h2>
      <p>The fastest way to know whether this is good enough for your customers is to
        be a customer. The demo line runs on the same voice and the same model your line
        would. It answers for Nevamis, so it can set up a call with us. On your line it
        takes the job and the time the caller wants, and you confirm the slot.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-primary btn-lg" href="tel:+15874130035" data-evt="demo_phone_click">Hear it answer ${DEMO}</a>
      <a class="btn btn-ghost btn-lg" href="/book.html" data-evt="hero_book_call_click">Book a 15-min call</a>
    </div>
  </div>
</section>`;

const tradeBody = ({ trade, urgency, jobs, whenItRings, questions, afterHours }) => `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">The problem</p>
      <h2>${whenItRings}</h2>
      <p>You cannot answer a phone with your hands full. So the call goes to voicemail,
        and the person on the other end simply calls the next name on their list. The job
        is not lost because of price or quality. It is lost because nobody picked up.</p>
    </div>
    <div class="proc">
      <div class="reveal"><h3>Answered in seconds</h3><p>Nevamis picks up in your
        business's tone, day or night, while you stay on the tools.</p></div>
      <div class="reveal"><h3>Qualified the way you would</h3><p>${questions}</p></div>
      <div class="reveal"><h3>Written down, not lost</h3><p>It takes the job and the time
        they want, and tells them plainly that you will confirm it.</p></div>
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
        flags the summary rather than inventing an answer. You decide what gets escalated,
        what gets captured, and what waits until morning.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-ghost" href="/pilot.html" data-evt="trade_start_click">See how you start</a>
      <a class="btn btn-ghost" href="/pricing.html" data-evt="trade_pricing_click">Compare plans</a>
    </div>
  </div>
</section>`;

export const PAGES = {
  'electricians.html': {
    heroProof: TRADE_HERO_PROOF,
    h1: 'Your line answered while the crew is on the tools',
    lede: `Panel upgrades, dead circuits, and emergency calls answered while your crew is on the tools. Nevamis picks up your existing line 24/7, qualifies the caller, takes the job details, and texts them to you.`,
    body: tradeBody({
      trade: 'electrical work',
      whenItRings: 'The phone rings when both your hands are in a panel.',
      questions: `It asks what you would ask: what stopped working, whether anything is
        sparking, heating, or smells like burning, whether the breaker has been reset, the
        service address, and when they can be home.`,
      urgency: 'A burning smell is not a next-Tuesday call.',
      afterHours: `Hazard questions run on every call. If a caller reports sparks, heat, or
        a burning smell, that call is escalated the way you tell us to escalate it.
        Nevamis captures the urgent details and alerts your team, with the summary flagged
        urgent and sent straight to your phone.`,
      jobs: [
        { t: 'Service and repair calls', d: 'Dead outlets, tripped circuits, flickering lights, panel faults.' },
        { t: 'Emergency triage', d: 'Sparks, heat, or burning smell escalate by your rules.' },
        { t: 'Quotes and upgrades', d: 'Panel upgrades and rewires captured as leads with the details you need.' },
        { t: 'Service-call pricing', d: 'Only the diagnostic or trip fee you approve, quoted the same way every time.' },
        { t: 'Service area', d: 'Out-of-area callers are told honestly instead of being taken on and cancelled later.' },
        { t: 'Permits and inspections', d: 'Common questions answered from your approved FAQ, not improvised.' },
      ],
    }),
  },

  'hvac.html': {
    heroProof: TRADE_HERO_PROOF,
    h1: 'The 11 PM no-heat call, answered',
    lede: `A furnace out at 11 PM in January does not wait for opening hours. Nevamis answers your line around the clock, triages the call, takes the job down, and sends you the summary.`,
    body: tradeBody({
      trade: 'heating and cooling',
      whenItRings: 'Your busiest calls arrive at the worst possible hour.',
      questions: `It asks whether there is heat at all, what the thermostat reads, the age
        and type of the system, whether anyone vulnerable is in the home, the address, and
        what times actually work for them.`,
      urgency: 'No heat with a newborn in the house is a different call.',
      afterHours: `You define what an emergency means for your business: a temperature
        threshold, no heat at all, vulnerable occupants, or a commercial account. Calls that
        meet it are handled as emergencies: Nevamis captures the urgent details and alerts
        your team. Everything else is captured with the time the caller wants, for you to confirm.`,
      jobs: [
        { t: 'No-heat and no-cool calls', d: 'Triaged by your emergency criteria, not a generic script.' },
        { t: 'Seasonal tune-ups', d: 'Taken down with the time they want, without interrupting anyone.' },
        { t: 'Maintenance plans', d: 'Callers who say they hold a plan are asked the details you need, and it is marked on the summary.' },
        { t: 'Equipment questions', d: 'Answered from your approved FAQ, or taken as a message.' },
        { t: 'Diagnostic fee', d: 'Quoted exactly as you set it, every time.' },
        { t: 'Commercial vs residential', d: 'Asked on every call and marked on the summary, so you can handle each your own way.' },
      ],
    }),
  },

  'plumbers.html': {
    heroProof: TRADE_HERO_PROOF,
    h1: 'Burst pipes and blocked drains, answered',
    lede: `Burst pipes, blocked drains, and no hot water. The calls that cannot wait are the ones you are least able to answer. Nevamis answers them, qualifies them, and gets the details to you.`,
    body: tradeBody({
      trade: 'plumbing',
      whenItRings: 'Water damage does not leave a voicemail and wait.',
      questions: `It asks whether water is actively running, whether they have found the
        shut-off, what is affected, how long it has been happening, the address, and access
        details.`,
      urgency: 'Active flooding gets treated as active flooding.',
      afterHours: `Active water gets your emergency path immediately. Slow drains and
        fixture replacements are captured normally. You set the line between the two, and it
        holds on every call at every hour.`,
      jobs: [
        { t: 'Emergency leaks', d: 'Shut-off guidance from your approved script, then escalation.' },
        { t: 'Drains and blockages', d: 'Qualified and written up with the details your tech needs.' },
        { t: 'Hot water tanks', d: 'Age, type, and symptoms captured before anyone drives out.' },
        { t: 'Renovation quotes', d: 'Captured as leads rather than lost to voicemail.' },
        { t: 'Trip and diagnostic fees', d: 'Quoted consistently, exactly as you approve them.' },
        { t: 'Property managers', d: 'Asked who they manage for and marked on the summary, if they are a different workflow for you.' },
      ],
    }),
  },

  'restoration.html': {
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
      questions: `It asks what happened, when it started, how much area is affected,
        whether the source is stopped, whether insurance is involved, and who is on site.`,
      urgency: 'Active loss is escalated, not queued.',
      afterHours: `Restoration work is won in the first hour. Calls that meet your emergency
        definition are handled as emergencies: Nevamis captures the urgent details and alerts
        your team, with the incident details already collected so nobody starts from nothing.`,
      jobs: [
        { t: 'Water and flood loss', d: 'Source, spread, and timing captured while it matters.' },
        { t: 'Fire and smoke', d: 'Handled with a calm, approved script rather than improvisation.' },
        { t: 'Insurance questions', d: 'Answered only within what you approve, otherwise taken as a message.' },
        { t: 'Emergency alerts', d: 'Nevamis captures the urgent details and alerts your team, by your rules.' },
        { t: 'Assessment requests', d: 'The window they need captured and texted to you, so you confirm the slot.' },
        { t: 'Property managers and adjusters', d: 'Identified on the call and marked on the summary, if they are a different path for you.' },
      ],
    }),
  },

  'after-hours-answering.html': {
    h1: 'After-hours calls answered on your own number',
    lede: `Evenings, weekends, and holidays covered without hiring a night shift or paying a per-call answering service. Your number, your rules, answered in seconds.`,
    body: `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">How it works</p>
      <h2>You keep your number. Forwarding does the rest.</h2>
      <p>Nothing about your phone setup changes permanently. Call forwarding sends calls to
        Nevamis outside your business hours, and during the day nothing is different. You can
        switch it off from your own phone whenever you want.</p>
    </div>
    <ol class="path-steps" role="list" style="list-style:none;padding:0">
      <li class="pstep"><h3>You choose the hours</h3><p>Evenings only, weekends, holidays, or
        any schedule that matches how you actually work.</p></li>
      <li class="pstep"><h3>Calls forward automatically</h3><p>Your existing number stays
        exactly as it is on every truck, card, and listing.</p></li>
      <li class="pstep"><h3>It answers in seconds</h3><p>In your business's name and tone. If a
        caller asks whether they are talking to a person, it says plainly that it is an AI.</p></li>
      <li class="pstep"><h3>Urgent calls escalate</h3><p>Nevamis captures the urgent details
        and alerts your team, exactly as you decide.</p></li>
      <!-- "Routine calls get booked / into the slots your calendar genuinely
           has open" until 2026-08-09. No agent touches a calendar; the honest
           step is the structured lead and how fast it reaches you. -->
      <li class="pstep"><h3>Routine calls get captured</h3><p>Name, number, the job, and the
        time window they want, ready for you to confirm.</p></li>
      <li class="pstep"><h3>You read it in the morning</h3><p>Every call arrives as a summary
        with name, number, need, and outcome.</p></li>
    </ol>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Why not just voicemail</p>
      <h2>Voicemail records the lost job. It does not save it.</h2>
      <p>By the time you play a message back the next morning, the caller has usually already
        reached somebody who picked up. An after-hours call that gets answered, qualified, and
        captured is a job you can still win. The same call sent to voicemail is a note about a job you did not get.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-ghost" href="/vs-voicemail.html" data-evt="situation_compare_click">Compare it to voicemail</a>
      <a class="btn btn-ghost" href="/vs-answering-service.html" data-evt="situation_compare_click">Compare it to an answering service</a>
    </div>
  </div>
</section>`,
  },

  'missed-calls.html': {
    h1: 'What missed calls actually cost you',
    lede: `Every unanswered call is a customer who is already dialling somebody else. Here is how to work out what that is worth in your business, and what to do about it.`,
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
    </div>
    <div class="proc">
      <div class="reveal"><h3>After hours</h3><p>Evenings and weekends are when emergency work
        is decided. <a href="/after-hours-answering.html">After-hours coverage</a> catches it.</p></div>
      <div class="reveal"><h3>On the tools</h3><p>You cannot answer mid-job. Overflow coverage
        picks up only when you do not.</p></div>
      <div class="reveal"><h3>Already on a call</h3><p>A busy signal is a lost caller. Overflow
        coverage answers the next caller when you are already on the phone.</p></div>
      <div class="reveal"><h3>Nobody in the office</h3><p>Full-time front line answers everything
        and flags the calls that genuinely need a person.</p></div>
      <div class="reveal"><h3>When you missed it anyway</h3><p>${MISSED_CALL.name} texts a caller
        you missed, once, during business hours, with your business name on it and a working
        opt-out, on your written go-ahead. It hands over the moment they reply. On its own it is
        ${cad(MISSED_CALL.launch)} Launch &amp; Implementation to start, then ${cad(MISSED_CALL.monthly)} a month,
        plus applicable GST/HST.</p></div>
    </div>
  </div>
</section>`,
  },

  'vs-voicemail.html': {
    heroProof: `      <p class="proof" style="margin-top:12px">This comparison is about the phone. The phone is one part of Nevamis. Nevamis also offers Lead Generation, by invitation, and Quote Recovery for the quotes you already sent, which tells you which quotes came back and what they were worth.</p>`,
    h1: 'AI receptionist vs voicemail',
    lede: `Voicemail is free and it is better than nothing. It also does not qualify anyone, take a job down, or stop a caller reaching your competitor. Here is the honest comparison.`,
    body: `
<section class="tight">
  <div class="wrap">
    <div class="compare-wrap reveal">
      <table class="compare">
        <thead><tr><th scope="col">On every call</th><th scope="col">Voicemail</th><th scope="col">Nevamis</th></tr></thead>
        <tbody>
          <tr><th scope="row">Answers immediately</th><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><th scope="row">Asks your qualifying questions</th><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><th scope="row">Takes the job down in full</th><td class="no">No</td><td class="yes">Yes</td></tr>
          <tr><th scope="row">Repeats the details back to the caller</th><td class="no">No</td><td class="yes">Yes, and says you will confirm the time</td></tr>
          <tr><th scope="row">Escalates an emergency</th><td class="no">No</td><td class="yes">By your rules</td></tr>
          <tr><th scope="row">Gives you a useful summary</th><td class="part">A recording</td><td class="yes">Name, number, need, outcome</td></tr>
          <tr><th scope="row">Costs nothing</th><td class="yes">Yes</td><td class="part">A one-time Launch &amp; Implementation fee to start, then a monthly plan</td></tr>
        </tbody>
      </table>
    </div>
    <p class="foot-note reveal" style="margin-top:14px">Voicemail genuinely wins on price. The
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
    heroProof: `      <p class="proof" style="margin-top:12px">Both options above answer the phone. Nevamis also offers Lead Generation, by invitation, which finds businesses of the kind you want more of and leaves every one for you to decide. It also offers Quote Recovery for the quotes you already sent. Every answered call is in your portal with its summary and recording.</p>`,
    h1: 'AI receptionist vs a live answering service',
    /* "rather than book the job" until 2026-08-09: a comparison whose only
       force came from implying Nevamis books, which nothing does. The real
       difference is what comes back off the call, so that is the claim now. */
    lede: `Traditional answering services employ real people, and people are good at things software is not. They also cost per call or per minute, and what comes back is usually a name and a number rather than the detail you need to price the work.`,
    body: `
<section class="tight">
  <div class="wrap">
    <div class="compare-wrap reveal">
      <table class="compare">
        <thead><tr><th scope="col">On every call</th><th scope="col">Live answering service</th><th scope="col">Nevamis</th></tr></thead>
        <tbody>
          <tr><th scope="row">Available at 2 AM</th><td class="part">Usually, at a premium</td><td class="yes">Yes, at the same rate</td></tr>
          <tr><th scope="row">Knows your service area and prices</th><td class="part">A script they follow</td><td class="yes">Rules built with you</td></tr>
          <tr><th scope="row">Takes the job down in full</th><td class="part">Varies by operator</td><td class="yes">Included</td></tr>
          <tr><th scope="row">Never on hold or queued</th><td class="part">Depends on their volume</td><td class="yes">Answers in parallel</td></tr>
          <tr><th scope="row">Handles genuine judgement calls</th><td class="yes">A person can</td><td class="part">Escalates to you instead</td></tr>
          <tr><th scope="row">Cost as volume grows</th><td class="part">Per call or per minute</td><td class="part">${count(FRONT_DESK.includedMinutes)} minutes included on the ${FRONT_DESK.name}, then ${cad(FRONT_DESK.overage)} a minute, or a cap you choose</td></tr>
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
      <p>A trained human handles the unexpected better than any AI, and some businesses need
        that on every call. Nevamis is built to know its limits: for anything outside the rules
        you approved, it takes a message rather than guessing. If most of your calls
        are genuinely unpredictable, hire the person. If most are the same twenty questions and a
        job to take down, this does that part without a queue, inside the minutes your plan
        includes.</p>
    </div>
  </div>
</section>`,
  },
};
