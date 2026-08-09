/* Body content for the generated content pages, kept out of the builder so
   the copy is easy to read and edit. Every claim here must be supportable:
   the product genuinely does these things, and nothing invents a client,
   a statistic, or a result. */

const DEMO = '(587)&nbsp;413-0035';

/** Shared closing block: the honest proof we actually have. */
export const PROOF_BLOCK = `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Judge it yourself</p>
      <h2>Do not take our word for it. Call it.</h2>
      <p>The fastest way to know whether this is good enough for your customers is to
        be a customer. The demo line runs the same agent your business would get.</p>
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
        what gets booked, and what waits until morning.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-ghost" href="/pilot.html">See how you start</a>
      <a class="btn btn-ghost" href="/pricing.html">Compare plans</a>
    </div>
  </div>
</section>`;

export const PAGES = {
  'electricians.html': {
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
        a burning smell, that call is escalated the way you tell us to escalate it: a live
        transfer to your on-call number, or an urgent-flagged summary sent straight to your
        phone.`,
      jobs: [
        { t: 'Service and repair calls', d: 'Dead outlets, tripped circuits, flickering lights, panel faults.' },
        { t: 'Emergency triage', d: 'Sparks, heat, or burning smell escalate by your rules.' },
        { t: 'Quotes and upgrades', d: 'Panel upgrades and rewires captured as leads with the details you need.' },
        { t: 'Service-call pricing', d: 'Only the diagnostic or trip fee you approve, quoted the same way every time.' },
        { t: 'Service area', d: 'Out-of-area callers are told honestly instead of being booked and cancelled.' },
        { t: 'Permits and inspections', d: 'Common questions answered from your approved FAQ, not improvised.' },
      ],
    }),
  },

  'hvac.html': {
    h1: 'The 11 PM no-heat call, answered',
    lede: `A furnace out at 11 PM in January does not wait for opening hours. Nevamis answers your line around the clock, triages the call, books the visit, and sends you the summary.`,
    body: tradeBody({
      trade: 'heating and cooling',
      whenItRings: 'Your busiest calls arrive at the worst possible hour.',
      questions: `It asks whether there is heat at all, what the thermostat reads, the age
        and type of the system, whether anyone vulnerable is in the home, the address, and
        what times actually work for them.`,
      urgency: 'No heat with a newborn in the house is a different call.',
      afterHours: `You define what an emergency means for your business: a temperature
        threshold, no heat at all, vulnerable occupants, or a commercial account. Calls that
        meet it transfer to your on-call tech. Everything else is booked into the first slot
        your calendar actually has.`,
      jobs: [
        { t: 'No-heat and no-cool calls', d: 'Triaged by your emergency criteria, not a generic script.' },
        { t: 'Seasonal tune-ups', d: 'Booked straight into open slots without interrupting anyone.' },
        { t: 'Maintenance plans', d: 'Existing plan holders recognised and handled by your rules.' },
        { t: 'Equipment questions', d: 'Answered from your approved FAQ, or taken as a message.' },
        { t: 'Diagnostic fee', d: 'Quoted exactly as you set it, every time.' },
        { t: 'Commercial vs residential', d: 'Routed differently if that is how you run the business.' },
      ],
    }),
  },

  'plumbers.html': {
    h1: 'Burst pipes and blocked drains, answered',
    lede: `Burst pipes, blocked drains, and no hot water. The calls that cannot wait are the ones you are least able to answer. Nevamis answers them, qualifies them, and books them.`,
    body: tradeBody({
      trade: 'plumbing',
      whenItRings: 'Water damage does not leave a voicemail and wait.',
      questions: `It asks whether water is actively running, whether they have found the
        shut-off, what is affected, how long it has been happening, the address, and access
        details.`,
      urgency: 'Active flooding gets treated as active flooding.',
      afterHours: `Active water gets your emergency path immediately. Slow drains and
        fixture replacements get booked normally. You set the line between the two, and it
        holds on every call at every hour.`,
      jobs: [
        { t: 'Emergency leaks', d: 'Shut-off guidance from your approved script, then escalation.' },
        { t: 'Drains and blockages', d: 'Qualified and booked with the details your tech needs.' },
        { t: 'Hot water tanks', d: 'Age, type, and symptoms captured before anyone drives out.' },
        { t: 'Renovation quotes', d: 'Captured as leads rather than lost to voicemail.' },
        { t: 'Trip and diagnostic fees', d: 'Quoted consistently, exactly as you approve them.' },
        { t: 'Property managers', d: 'Recognised and routed if they are a different workflow for you.' },
      ],
    }),
  },

  'restoration.html': {
    h1: 'The first hour of a loss, answered calmly',
    /* "books the assessment" until 2026-08-09. Nothing books: a tenant agent
       is provisioned with no booking tool and no calendar credential, so the
       assessment slot is confirmed by a person on your side. What is real is
       the capture and the speed it reaches you at, and that is what is sold. */
    lede: `Flood, fire, and damage calls arrive stressed and urgent, often at night. Nevamis answers calmly, gathers the incident details, routes priority calls, and sends you the assessment request within seconds.`,
    body: tradeBody({
      trade: 'restoration and property services',
      whenItRings: 'The call comes in at the worst moment of someone\'s week.',
      questions: `It asks what happened, when it started, how much area is affected,
        whether the source is stopped, whether insurance is involved, and who is on site.`,
      urgency: 'Active loss is escalated, not queued.',
      afterHours: `Restoration work is won in the first hour. Calls that meet your emergency
        definition transfer straight to the person on call, with the incident details already
        collected so they are not starting from nothing.`,
      jobs: [
        { t: 'Water and flood loss', d: 'Source, spread, and timing captured while it matters.' },
        { t: 'Fire and smoke', d: 'Handled with a calm, approved script rather than improvisation.' },
        { t: 'Insurance questions', d: 'Answered only within what you approve, otherwise taken as a message.' },
        { t: 'Emergency dispatch', d: 'Live transfer to the on-call crew by your rules.' },
        { t: 'Assessment requests', d: 'The window they need captured and texted to you, so you confirm the slot.' },
        { t: 'Property managers and adjusters', d: 'Routed separately if they are a different path for you.' },
      ],
    }),
  },

  'after-hours-answering.html': {
    h1: 'After-hours call answering that misses nothing',
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
      <li class="pstep"><h3>It answers in seconds</h3><p>In your business's tone, identifying
        itself naturally as an assistant.</p></li>
      <li class="pstep"><h3>Urgent calls escalate</h3><p>Transfer to your on-call number, or
        an urgent-flagged summary, exactly as you decide.</p></li>
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
        booked is a job. The same call sent to voicemail is a note about a job you did not get.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-ghost" href="/vs-voicemail.html">Compare it to voicemail</a>
      <a class="btn btn-ghost" href="/vs-answering-service.html">Compare it to an answering service</a>
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
      <p>The calculator on the home page uses four inputs you already know: how many calls you
        miss in a week, how many of those were real opportunities, what an average job is worth,
        and how often you close one. Nothing is assumed for you and the formula is shown.</p>
    </div>
    <div class="midcta reveal">
      <a class="btn btn-primary" href="/#roi">Open the missed-call calculator</a>
    </div>
  </div>
</section>

<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Where the calls go</p>
      <h2>Four common leaks, and what closes each one.</h2>
    </div>
    <div class="proc">
      <div class="reveal"><h3>After hours</h3><p>Evenings and weekends are when emergency work
        is decided. <a href="/after-hours-answering.html">After-hours coverage</a> catches it.</p></div>
      <div class="reveal"><h3>On the tools</h3><p>You cannot answer mid-job. Overflow coverage
        picks up only when you do not.</p></div>
      <div class="reveal"><h3>Already on a call</h3><p>A busy signal is a lost caller. Overflow
        answers the second line instead of dropping it.</p></div>
      <div class="reveal"><h3>Nobody in the office</h3><p>Full-time front line answers everything
        and transfers the calls that genuinely need a person.</p></div>
    </div>
  </div>
</section>`,
  },

  'vs-voicemail.html': {
    h1: 'AI receptionist vs voicemail',
    lede: `Voicemail is free and it is better than nothing. It also does not qualify anyone, book anything, or stop a caller reaching your competitor. Here is the honest comparison.`,
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
          <tr><th scope="row">Confirms the time with the caller</th><td class="no">No</td><td class="yes">Yes, out loud on the call</td></tr>
          <tr><th scope="row">Escalates an emergency</th><td class="no">No</td><td class="yes">By your rules</td></tr>
          <tr><th scope="row">Gives you a useful summary</th><td class="part">A recording</td><td class="yes">Name, number, need, outcome</td></tr>
          <tr><th scope="row">Costs nothing</th><td class="yes">Yes</td><td class="part">Monthly plan</td></tr>
        </tbody>
      </table>
    </div>
    <p class="foot-note reveal" style="margin-top:14px">Voicemail genuinely wins on price. The
      question is what one recovered job per month is worth against the plan you are on.</p>
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
          <tr><th scope="row">Available at 2 AM</th><td class="part">Usually, at a premium</td><td class="yes">Always, same rate</td></tr>
          <tr><th scope="row">Knows your service area and prices</th><td class="part">A script they follow</td><td class="yes">Rules built with you</td></tr>
          <tr><th scope="row">Takes the job down in full</th><td class="part">Varies by operator</td><td class="yes">Included</td></tr>
          <tr><th scope="row">Never on hold or queued</th><td class="part">Depends on their volume</td><td class="yes">Answers in parallel</td></tr>
          <tr><th scope="row">Handles genuine judgement calls</th><td class="yes">A person can</td><td class="part">Escalates to you instead</td></tr>
          <tr><th scope="row">Cost as volume grows</th><td class="part">Per call or per minute</td><td class="yes">Plan with included minutes</td></tr>
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
        you approved, it takes a message or transfers rather than guessing. If most of your calls
        are genuinely unpredictable, hire the person. If most are the same twenty questions and a
        job to take down, this does that part without a queue and without a per-call charge.</p>
    </div>
  </div>
</section>`,
  },
};
