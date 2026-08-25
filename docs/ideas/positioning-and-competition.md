# Positioning & competition — 50 improvements

> **SUPERSEDED 2026-08-09 — the commercial model this file was written against no longer exists.**
> Ideas below were authored while Nevamis sold the C$249 / C$449 / C$849 ladder (plans named
> After Hours, Growth and Scale), a Pay As You Go tier at C$49 + C$1.95/min, annual prepay, a
> setup fee with a founding-client waiver, and a 7-day live pilot — free at first, then C$150.
> Every one of those is retired, and the single-recurring-price model that replaced them on
> 2026-08-09 was itself superseded by v4 (2026-08-22) and then by v5 (owner
> directive 2026-08-24). The current model is a
> one-time Launch & Implementation fee to start, then a monthly price:
> **The Works** C$3,000 to start, then C$2,100/month (1,400 included minutes, C$0.75/min overage);
> **AI Front Desk** (recommended) C$1,500 to start, then C$1,000/month (1,400 included minutes, C$0.75/min overage);
> **Performance Partnership** (invite-only) from C$2,500 to start, then C$350/month plus 10% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities (250 included minutes, C$1.10/min overage).
> Sellable add-ons, each its own sale on its own three-month start:
> Missed-Call Recovery C$350/month, Quote-Chase Engine C$500/month, Get-Paid Autopilot C$500/month,
> Review Engine C$300/month — each with a one-time Launch & Implementation fee of its own
> (C$500, C$750, C$750, C$500).
> Terms: three months minimum on a plan alone, six with any add-on or The Works,
> then month to month on thirty days notice, with the price locked for twelve months.
> No pilot or trial at any price. `pricing-config.js` and the engine's
> `src/domain/canonical.ts` are the source of truth.
>
> The ideas are kept rather than deleted: most are about how a price is *presented*, and that work
> survives the change. But no figure, plan name or offer quoted below may be copied onto a surface,
> and any idea whose whole premise is a setup fee, a pilot, PAYG or annual prepay is moot.


The site explains what Nevamis does clearly. It never explains why a buyer should choose it over
the four alternatives actually on the table: keep missing calls, hire a receptionist, use a
human answering service, or buy one of the AI receptionist products already selling into North
American trades. There are two comparison pages (`vs-voicemail.html`,
`vs-answering-service.html`) and both compare against doing nothing well. Neither names a
competitor, and there is no page for the buyer who is already evaluating another AI product.
Meanwhile the real differentiators — Edmonton-built, founder-delivered, honest about what is not
built yet, Canadian data and CASL posture — are stated in passing rather than owned.

Ordering: decide the position first, then defend it against each alternative, then the
category-level questions that decide whether this is a business or a service.

---

1. `POSITIONING-AND-COMPETITION-001` **Write the one-sentence position and use it everywhere.**
   Who it is for, what it replaces, and why it wins. Every page, the agent prompt, the proposal
   and the cold-call opener should be traceable to it. Without it, each surface improvises.
   impact 5/5 · effort 2/5 · touches: PLAYBOOK.md, all page heroes

2. `POSITIONING-AND-COMPETITION-002` **Name the four real alternatives explicitly in sales material.**
   Do nothing, hire, answering service, other AI. A buyer is choosing among them whether or not
   the seller acknowledges it, and refusing to name them makes the pitch feel evasive.
   impact 5/5 · effort 2/5 · touches: outreach scripts, proposal.html

3. `POSITIONING-AND-COMPETITION-003` **Build the honest comparison against other AI receptionists.**
   The two existing vs- pages compare against voicemail and human answering services. The buyer
   who has already seen an AI receptionist ad has no page. Write it factually, without naming
   competitors dishonestly, and concede what they do better.
   impact 5/5 · effort 3/5 · touches: new vs-other-ai.html, content-map.json

4. `POSITIONING-AND-COMPETITION-004` **Concede at least one thing a competitor does better.**
   A comparison page that wins every row is read as marketing and discounted entirely. One
   honest concession makes the other rows credible.
   impact 5/5 · effort 1/5 · touches: vs-*.html

5. `POSITIONING-AND-COMPETITION-005` **Own "Canadian data, Canadian rules" as a position, not a footnote.**
   PIPEDA and Alberta PIPA compliance, GST registration, CASL discipline. For an owner handing
   over their phone line, jurisdiction is a real purchase criterion and most competitors are
   American.
   impact 4/5 · effort 2/5 · touches: homepage, privacy.html, positioning

6. `POSITIONING-AND-COMPETITION-006` **Own "the founder builds it" while it is still true.**
   It is a genuine differentiator at this size and an honest one. It also has an expiry date, so
   use it now and plan what replaces it.
   impact 4/5 · effort 1/5 · touches: about.html, pilot.html

7. `POSITIONING-AND-COMPETITION-007` **Make honesty itself the position.**
   The site labels what is not built, refuses invented statistics, and says when a claim is under
   review. In a category full of overpromising that is a differentiator, but only if it is stated
   rather than merely practised.
   impact 5/5 · effort 2/5 · touches: about.html, coming-soon.html

8. `POSITIONING-AND-COMPETITION-008` **Research what the three nearest competitors actually charge.**
   Pricing set without knowing the comparison set is a guess. This is an afternoon of work and it
   informs every quote.
   impact 5/5 · effort 2/5 · touches: PLAYBOOK.md, pricing

9. `POSITIONING-AND-COMPETITION-009` **Call a competitor's demo line and take notes.**
   The fastest possible product research. What they ask, how they handle interruption, how they
   close. It is also the honest way to know whether the Nevamis agent is actually better.
   impact 5/5 · effort 1/5 · touches: PLAYBOOK.md

10. `POSITIONING-AND-COMPETITION-010` **Write down where Nevamis loses and accept it.**
    Enterprise features, integrations breadth, brand recognition. Knowing the losing ground stops
    time being wasted defending it and clarifies which buyer to target.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

11. `POSITIONING-AND-COMPETITION-011` **Pick one trade and become the obvious choice there first.**
    HVAC or electrical. Depth in one vertical produces referrals, vocabulary and case material
    faster than breadth across six.
    impact 5/5 · effort 2/5 · touches: PLAYBOOK.md, solutions.html

12. `POSITIONING-AND-COMPETITION-012` **Make the trade pages sound like the trade, not like a template.**
    hvac.html already does this well ("a furnace out at 11 PM in January"). Audit the others
    against that bar; any page that reads as find-and-replace undermines the specificity claim.
    impact 4/5 · effort 2/5 · touches: electricians, plumbers, restoration

13. `POSITIONING-AND-COMPETITION-013` **Answer "why not just use my cell phone" directly.**
    The most common real alternative for a solo trade is answering it themselves. The honest
    answer involves being under a sink, on a roof, or asleep.
    impact 5/5 · effort 1/5 · touches: trade pages, objection handling

14. `POSITIONING-AND-COMPETITION-014` **Answer "my customers want to talk to a human" head on.**
    It is the strongest objection in the category and it deserves a real answer: the alternative
    is not a human, it is voicemail.
    impact 5/5 · effort 1/5 · touches: trust-proof pages, agent prompt

15. `POSITIONING-AND-COMPETITION-015` **Answer "what if it says something wrong" with the actual mechanism.**
    Approved rules, no invention outside them, escalation paths, and a quality queue. The
    machinery exists; the objection page does not describe it.
    impact 5/5 · effort 2/5 · touches: trust-proof-objections content

16. `POSITIONING-AND-COMPETITION-016` **Publish the agent's guardrails as a feature.**
    "It will not quote a price you have not approved" is a selling point to a business owner who
    has been burned by a junior on the phone.
    impact 4/5 · effort 2/5 · touches: new content section

17. `POSITIONING-AND-COMPETITION-017` **Compare against a human receptionist on total cost, honestly.**
    Include what a receptionist does that the AI does not. A comparison that pretends they are
    equivalent insults a buyer who has employed one.
    impact 4/5 · effort 2/5 · touches: vs-answering-service.html

18. `POSITIONING-AND-COMPETITION-018` **Stop competing on price and start competing on the pilot.**
    Seven live days on the real line with no card is a stronger differentiator than any number,
    and it is already built.
    impact 5/5 · effort 1/5 · touches: positioning, outreach

19. `POSITIONING-AND-COMPETITION-019` **Make the demo number the centre of the pitch, everywhere.**
    Almost no competitor lets a stranger phone the product before speaking to sales. That is the
    single most differentiating asset Nevamis has and it should be in the first line of every
    channel.
    impact 5/5 · effort 1/5 · touches: all surfaces

20. `POSITIONING-AND-COMPETITION-020` **Name the category deliberately.**
    "AI receptionist" is searched; "AI front desk" is owned. Decide which is the primary term and
    which is the synonym, and be consistent across SEO, ads and speech.
    impact 4/5 · effort 2/5 · touches: site copy, SEO

21. `POSITIONING-AND-COMPETITION-021` **Decide whether Nevamis is a product or a service, out loud.**
    Currently it is a done-for-you service with a product underneath. That answer determines
    pricing, scaling, hiring, and whether founder-led delivery is a feature or a bottleneck.
    impact 5/5 · effort 2/5 · touches: PLAYBOOK.md

22. `POSITIONING-AND-COMPETITION-022` **Write the moat honestly, including that there may not be one yet.**
    The technology is licensable by anyone. The defensibility, if it exists, is local trust,
    vertical depth and switching cost once the number is theirs.
    impact 4/5 · effort 2/5 · touches: PLAYBOOK.md

23. `POSITIONING-AND-COMPETITION-023` **Make switching cost a deliberate design goal, ethically.**
    Owning the configuration, the call history and the tuning is legitimate stickiness. Holding
    the phone number hostage is not, and the difference should be written down.
    impact 4/5 · effort 2/5 · touches: terms.html, PLAYBOOK.md

24. `POSITIONING-AND-COMPETITION-024` **Publish the data-portability promise as a differentiator.**
    "Your number and your call data leave with you" turns an objection into a reason to trust.
    impact 4/5 · effort 2/5 · touches: terms.html, positioning

25. `POSITIONING-AND-COMPETITION-025` **Position against the fear of looking cheap.**
    A trades owner worries an AI makes their business seem small. The counter is that a phone that
    always gets answered makes them seem bigger.
    impact 4/5 · effort 1/5 · touches: objection handling

26. `POSITIONING-AND-COMPETITION-026` **Let the buyer choose how human the agent sounds.**
    Some owners want it to say it is an AI immediately; some want warmth first. Making that a
    configured choice is both a feature and a trust signal.
    impact 4/5 · effort 3/5 · touches: agent config, onboarding

27. `POSITIONING-AND-COMPETITION-027` **Never hide that it is an AI, and make that the position.**
    The demo agent already discloses immediately. Competitors who blur it will eventually generate
    a scandal; being on record early is worth more than the calls it costs.
    impact 5/5 · effort 1/5 · touches: agent prompts, positioning

28. `POSITIONING-AND-COMPETITION-028` **Target the buyer who has already tried and abandoned an AI tool.**
    They are pre-educated, they know the failure modes, and they will respond to specificity that
    a cold buyer cannot evaluate.
    impact 4/5 · effort 2/5 · touches: outreach segmentation

29. `POSITIONING-AND-COMPETITION-029` **Write the "why Edmonton" story properly.**
    Local presence is a real advantage in trades. It supports in-person meetings, local references
    eventually, and a shared understanding of a January no-heat call.
    impact 4/5 · effort 1/5 · touches: about.html

30. `POSITIONING-AND-COMPETITION-030` **Decide the stance on serving outside Alberta.**
    Taking a client in Ontario changes tax, support hours and the local-presence claim. Better
    decided than drifted into.
    impact 3/5 · effort 1/5 · touches: PLAYBOOK.md

31. `POSITIONING-AND-COMPETITION-031` **Keep a competitor watch file, updated monthly.**
    Pricing changes, new features, new entrants. Fifteen minutes a month prevents being surprised
    by a category shift.
    impact 3/5 · effort 1/5 · touches: docs

32. `POSITIONING-AND-COMPETITION-032` **Track which competitors appear in AI answers for the category.**
    Answer engines are becoming the discovery surface. Knowing who gets cited for "AI receptionist
    Edmonton" is the AEO scoreboard.
    impact 4/5 · effort 2/5 · touches: AEO work

33. `POSITIONING-AND-COMPETITION-033` **Write positioning for the spouse or office manager.**
    In small trades the decision is frequently joint, and the second reader is often the one doing
    the phones today.
    impact 4/5 · effort 2/5 · touches: content

34. `POSITIONING-AND-COMPETITION-034` **Make the proposal comparative, not just descriptive.**
    A quote next to the cost of the status quo converts better than a quote alone, and the ROI
    inputs are the prospect's own numbers.
    impact 4/5 · effort 2/5 · touches: proposal.html

35. `POSITIONING-AND-COMPETITION-035` **Describe what happens on a bad call, publicly.**
    Every AI receptionist will mishandle something. Publishing the recovery path before it happens
    converts an eventual failure from a scandal into a demonstrated process.
    impact 5/5 · effort 2/5 · touches: trust content

36. `POSITIONING-AND-COMPETITION-036` **Do not claim uptime the business does not monitor.**
    CLM-02 was retired for exactly this. Any availability claim needs monitoring behind it first.
    impact 5/5 · effort 1/5 · touches: CLAIMS-LEDGER.md, all copy

37. `POSITIONING-AND-COMPETITION-037` **Build the monitoring, then make the claim.**
    Uptime and answer-latency monitoring on the demo line would convert a retired claim into a
    supportable one, which is a genuine competitive asset.
    impact 4/5 · effort 3/5 · touches: monitoring, CLAIMS-LEDGER.md

38. `POSITIONING-AND-COMPETITION-038` **Position the 7-day pilot against the industry's 14-day free trial.**
    Shorter, staffed, on a real line, with a results review. It is a stronger offer and the
    comparison makes that legible.
    impact 4/5 · effort 1/5 · touches: pilot.html

39. `POSITIONING-AND-COMPETITION-039` **Use the fact that there is no self-serve signup as a feature.**
    Every agent is built and reviewed by a person. In a category where self-serve means a generic
    bot, this is the difference, not a limitation.
    impact 4/5 · effort 1/5 · touches: positioning, pilot.html

40. `POSITIONING-AND-COMPETITION-040` **Decide what Nevamis will never do.**
    Outbound cold-calling on behalf of clients, for instance, or medical triage. A published
    no-list is a trust asset and a scope defence.
    impact 4/5 · effort 1/5 · touches: terms.html, PLAYBOOK.md

41. `POSITIONING-AND-COMPETITION-041` **Test the pitch on someone in the trade before scaling it.**
    Five conversations will kill more bad positioning than five weeks of writing.
    impact 5/5 · effort 1/5 · touches: process

42. `POSITIONING-AND-COMPETITION-042` **Use the prospect's own words in the copy.**
    "Nobody picked up" beats "call abandonment". The vocabulary comes from calls, not from
    thinking.
    impact 5/5 · effort 2/5 · touches: all copy

43. `POSITIONING-AND-COMPETITION-043` **Kill any claim that a competitor could copy verbatim.**
    "24/7", "never miss a call", "AI-powered". If it works equally well on a competitor's site it
    is not positioning, it is category description.
    impact 4/5 · effort 2/5 · touches: site copy audit

44. `POSITIONING-AND-COMPETITION-044` **Give the demo line a signature moment.**
    Something a prospect repeats to a friend. Right now it is competent; competence is not
    memorable and word of mouth is the cheapest channel available.
    impact 4/5 · effort 3/5 · touches: agent prompt

45. `POSITIONING-AND-COMPETITION-045` **Decide whether to publish the agent prompt.**
    Radical transparency about how the agent is instructed would be genuinely unusual and would
    make the honesty position concrete. It also gives competitors a template. Decide deliberately.
    impact 3/5 · effort 2/5 · touches: PLAYBOOK.md

46. `POSITIONING-AND-COMPETITION-046` **Watch for the platform risk in the positioning.**
    ElevenLabs, Twilio and Cal.com all sit under the product. If any moves into this market
    directly the position must already be something they cannot copy.
    impact 4/5 · effort 2/5 · touches: PLAYBOOK.md

47. `POSITIONING-AND-COMPETITION-047` **Do not position on the technology.**
    Model names and vendors date fast and mean nothing to a plumber. Position on the outcome and
    the accountability.
    impact 4/5 · effort 1/5 · touches: site copy

48. `POSITIONING-AND-COMPETITION-048` **Make "we answer the phone ourselves" a proof point.**
    A company selling call handling that answers its own line personally is evidence. One that
    does not is a joke waiting to be made.
    impact 4/5 · effort 1/5 · touches: process, positioning

49. `POSITIONING-AND-COMPETITION-049` **Revisit the position after five clients, with their words.**
    The reason clients actually buy is rarely the reason the founder thought they would, and five
    is enough to see the pattern.
    impact 5/5 · effort 1/5 · touches: PLAYBOOK.md

50. `POSITIONING-AND-COMPETITION-050` **Keep the comparison pages honest as competitors change.**
    A vs- page that goes stale becomes a liability the day a prospect notices. Date them and
    review quarterly.
    impact 3/5 · effort 1/5 · touches: vs-*.html
