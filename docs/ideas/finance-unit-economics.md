# Finance & unit economics — 60 improvements

> **SUPERSEDED 2026-08-09 — the commercial model this file was written against no longer exists.**
> Ideas below were authored while Nevamis sold the C$249 / C$449 / C$849 ladder (plans named
> After Hours, Growth and Scale), a Pay As You Go tier at C$49 + C$1.95/min, annual prepay, a
> setup fee with a founding-client waiver, and a 7-day live pilot — free at first, then C$150.
> Every one of those is retired. The current model is ONE recurring price per plan, charged the
> day the client subscribes and every month after: **Core C$250/month · Growth C$500/month · Pro
> C$1,000/month**, with 250 / 600 / 1,400 included minutes and C$1.10 / C$0.90 / C$0.75 overage,
> nothing charged beside it, and no pilot or trial at any price. `pricing-config.js` is the source
> of truth; docs/CLAIMS-LEDGER.md row CLM-18 is the approval.
>
> The ideas are kept rather than deleted: most are about how a price is *presented*, and that work
> survives the change. But no figure, plan name or offer quoted below may be copied onto a surface,
> and any idea whose whole premise is a setup fee, a pilot, PAYG or annual prepay is moot.


The 975 ideas that came before this file are all about getting a customer. None of them are
about whether the customer is worth having. Nevamis has a published price ladder
($249/$449/$849), an infra cost of roughly $30-130 per client per month, and a contribution
margin around 58-60% once founder time is counted — numbers that live in
`UNIT-ECONOMICS-MODEL.md` and nowhere the owner looks weekly. There is no cash forecast, no
collections process, no per-client profitability view, and no trigger that says "this account
is losing money". A pre-revenue business can survive bad marketing for a year; it cannot
survive selling below cost to its first ten clients and finding out in month eleven.

Ordering: know the numbers first, then protect cash, then price on real data, then the tax and
compliance mechanics that become expensive if left late.

---

1. `FINANCE-UNIT-ECONOMICS-001` **Put the real per-client monthly cost on one screen, per tenant.**
   Twilio number rental + per-minute, ElevenLabs conversation minutes, Cal.com seat, and a share
   of Turso/Vercel. The engine already stores connected minutes in `calls.durationSeconds`; it
   does not store what those minutes cost. Add a `unit_costs` table keyed by provider and
   effective date, compute `costCents` per call at intake, and surface a per-tenant monthly total
   on `/ops/revenue`. Without this, "58-60% contribution margin" is a spreadsheet belief.
   impact 5/5 · effort 3/5 · touches: src/db/schema.ts, domain/call-intake.ts, ops/revenue

2. `FINANCE-UNIT-ECONOMICS-002` **Alert when any client's minutes cost more than their plan margin.**
   A single After Hours client at $249 with 250 included minutes is underwater the moment
   ElevenLabs + Twilio for those minutes exceeds roughly $100. Compute it nightly in the autopilot
   pass and raise an escalation, the same mechanism that already texts about anomalies. The first
   heavy user will be discovered this way or by accident.
   impact 5/5 · effort 2/5 · touches: domain/autopilot.ts, domain/escalation.ts

3. `FINANCE-UNIT-ECONOMICS-003` **Write the 13-week cash forecast as a file, not a feeling.**
   Opening balance, committed outflows (Twilio, ElevenLabs, Vercel, Turso, domain, insurance once
   it exists), and the only inflow that matters: setup fees and monthly plans from signed clients.
   Update weekly. A solo founder's real failure mode is discovering a runway problem the month it
   arrives rather than the quarter before.
   impact 5/5 · effort 2/5 · touches: new docs/CASH-FORECAST.md

4. `FINANCE-UNIT-ECONOMICS-004` **Decide and write down the minimum viable client count.**
   At the published ladder, how many clients cover fixed costs plus a founder draw? Compute it
   once from real numbers and put it at the top of the playbook. It converts "get clients" into a
   finish line, which changes how outbound targets get set.
   impact 5/5 · effort 1/5 · touches: PLAYBOOK.md, UNIT-ECONOMICS-MODEL.md

5. `FINANCE-UNIT-ECONOMICS-005` **Charge the setup fee before the build, not after.**
   The pilot is free by design; the paid engagement should not be. Taking activation up front
   funds the infra the client is about to consume and filters tyre-kickers more honestly than any
   qualification question. Stripe is already wired for it.
   impact 5/5 · effort 2/5 · touches: domain/stripe-billing.ts, docs/pilot SOPs

6. `FINANCE-UNIT-ECONOMICS-006` **Track overage separately from plan revenue from day one.**
   `payments` records a lump. Overage is the variable that decides whether a plan is priced right,
   and merging it into monthly revenue hides that signal exactly when it matters most.
   impact 4/5 · effort 2/5 · touches: src/db/schema.ts, domain/billing.ts

7. `FINANCE-UNIT-ECONOMICS-007` **Model what one heavy client does to a $249 plan and set a hard cap.**
   250 included minutes with $1.10 overage is fine until a restoration company after a flood
   generates 900. Decide now whether the cap is automatic overage billing, a fallback, or a
   forced upgrade conversation, and write it into the terms rather than discovering it live.
   impact 5/5 · effort 2/5 · touches: terms.html, pricing-config.js, domain/billing.ts

8. `FINANCE-UNIT-ECONOMICS-008` **Separate GST/HST collected from revenue in every report.**
   Nevamis AI Inc. is registered (705729200 RT0001) and collected tax is not income. Showing a
   gross number that includes it makes the business look 5% healthier than it is and makes the
   remittance a surprise.
   impact 4/5 · effort 2/5 · touches: domain/billing.ts, ops/revenue

9. `FINANCE-UNIT-ECONOMICS-009` **Set aside GST/HST on receipt, not at filing.**
   A standing rule that the tax portion of every payment moves to a separate account the day it
   lands. Costs nothing, prevents the single most common small-business cash failure.
   impact 4/5 · effort 1/5 · touches: PLAYBOOK.md ops section

10. `FINANCE-UNIT-ECONOMICS-010` **Record the founder's hourly cost and put it in the margin.**
    Contribution margin of 58-60% "after founder time" is only meaningful if the rate is written
    down. Pick a number, put it in `UNIT-ECONOMICS-MODEL.md`, and use it consistently when
    deciding whether to automate something or keep doing it by hand.
    impact 4/5 · effort 1/5 · touches: UNIT-ECONOMICS-MODEL.md

11. `FINANCE-UNIT-ECONOMICS-011` **Compute the payback period on setup cost per client.**
    If a build costs eight founder hours plus provisioning, at what month does that client turn
    profitable? This number decides whether the founding-client setup waiver is generous or
    reckless.
    impact 4/5 · effort 2/5 · touches: UNIT-ECONOMICS-MODEL.md

12. `FINANCE-UNIT-ECONOMICS-012` **Price the founding-client waiver against its real cost.**
    Waiving $500-$1,250 of setup for the first five clients is $2,500-$6,250 of forgone cash at
    exactly the moment cash is scarcest. It may still be right — feedback and a review are worth
    something — but the trade should be stated in dollars, not vibes.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md, pilot.html

13. `FINANCE-UNIT-ECONOMICS-013` **Add a per-tenant profitability row to `/ops/revenue`.**
    Revenue minus attributed provider cost minus a flat support allocation. Sorted worst first,
    because the loss-maker is the row worth looking at.
    impact 4/5 · effort 3/5 · touches: ops/revenue, domain/portal-metrics.ts

14. `FINANCE-UNIT-ECONOMICS-014` **Instrument the pilot's true cost so "free" has a number.**
    60 minutes of ElevenLabs, a Twilio number for a week, plus founder build time. Knowing the
    pilot costs (say) $140 turns "how many pilots can I run at once" from a guess into arithmetic,
    and it is the input to any decision about advertising the pilot harder.
    impact 5/5 · effort 2/5 · touches: UNIT-ECONOMICS-MODEL.md, domain/pilot-watch.ts

15. `FINANCE-UNIT-ECONOMICS-015` **Set a monthly provider spend ceiling with an alert.**
    Twilio and ElevenLabs both bill on usage and both can run away during a bad week. A hard
    ceiling with a notification at 70% is the difference between a surprise and a decision.
    impact 4/5 · effort 2/5 · touches: domain/notify-budget.ts

16. `FINANCE-UNIT-ECONOMICS-016` **Reconcile Stripe payouts to recorded payments weekly.**
    The engine records a payment when the webhook fires. Stripe records what actually settled.
    Those drift through failed captures, disputes and refunds, and drift found at year end is
    expensive to unpick.
    impact 4/5 · effort 3/5 · touches: api/webhooks/stripe, domain/billing.ts

17. `FINANCE-UNIT-ECONOMICS-017` **Define the dunning ladder before the first failed card.**
    Retry schedule, the wording of each message, when service pauses, and when the account closes.
    Writing it under pressure with a real client mid-failure produces either a doormat or a
    scorched relationship.
    impact 4/5 · effort 2/5 · touches: docs, domain/billing.ts

18. `FINANCE-UNIT-ECONOMICS-018` **Never suspend a phone line without warning the owner by voice.**
    An AI receptionist going dark over a billing failure means missed jobs for a real business.
    The escalation must be a call or text to the owner first, whatever the payment status.
    impact 5/5 · effort 2/5 · touches: domain/billing.ts, domain/escalation.ts

19. `FINANCE-UNIT-ECONOMICS-019` **Decide the refund policy and publish it.**
    Terms currently commit to notice before price increases but say nothing about refunds mid-month.
    Deciding once beats deciding per-argument.
    impact 3/5 · effort 1/5 · touches: terms.html

20. `FINANCE-UNIT-ECONOMICS-020` **Track annual-prepay cash separately from monthly.**
    The ladder offers ten months charged for twelve. That is a discount funded by cash today, and
    mixing it into MRR overstates recurring revenue by exactly the amount that will not recur.
    impact 4/5 · effort 2/5 · touches: domain/billing.ts, ops/revenue

21. `FINANCE-UNIT-ECONOMICS-021` **Report MRR with the annual portion normalised.**
    An annual client at $2,490 is $249/month of MRR, not $2,490 in one month. The playbook says
    MRR only; the reporting should enforce it.
    impact 4/5 · effort 2/5 · touches: domain/portal-metrics.ts, ops/revenue

22. `FINANCE-UNIT-ECONOMICS-022` **Add a "months of runway" figure to the ops home screen.**
    One number, updated from the cash forecast. The most important metric for a pre-revenue
    business should not require opening a spreadsheet.
    impact 4/5 · effort 2/5 · touches: ops/page.tsx

23. `FINANCE-UNIT-ECONOMICS-023` **Log every business expense against a category from the first one.**
    Retrofitting a year of mixed personal and business spending is a weekend of misery and an
    audit risk. A simple categorised sheet from day one costs minutes.
    impact 4/5 · effort 1/5 · touches: ops process

24. `FINANCE-UNIT-ECONOMICS-024` **Keep business and personal banking strictly separate.**
    Already flagged in the playbook as a to-do. It is a corporate-veil issue as much as a
    bookkeeping one, and it gets harder to unwind every month it is deferred.
    impact 5/5 · effort 2/5 · touches: PLAYBOOK.md incorporation section

25. `FINANCE-UNIT-ECONOMICS-025` **Decide the price-increase mechanism before the first client.**
    Terms promise 30 days written notice. Decide what triggers an increase (provider cost, scope,
    inflation) so the first one is a policy rather than an apology.
    impact 3/5 · effort 1/5 · touches: terms.html, PLAYBOOK.md

26. `FINANCE-UNIT-ECONOMICS-026` **Model the Scale plan's "from" honestly.**
    "From $849" with "setup from $1,250" needs a defensible upper bound and a rule for where in
    the range a given client lands, or every Scale quote becomes an improvisation.
    impact 4/5 · effort 2/5 · touches: pricing-config.js, PLAYBOOK.md

27. `FINANCE-UNIT-ECONOMICS-027` **Put a floor under custom work.**
    Multi-location routing and integrations eat founder days. A minimum engagement size stops the
    highest-effort clients being the lowest-margin ones.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

28. `FINANCE-UNIT-ECONOMICS-028` **Cost the Revenue Engine before publishing any price for it.**
    It is in private development with no published price, which is currently the honest position.
    The ad-account model means client budget flows near Nevamis; the cost and the liability of
    that need modelling before a number exists.
    impact 4/5 · effort 3/5 · touches: UNIT-ECONOMICS-MODEL.md, revenue-engine.html

29. `FINANCE-UNIT-ECONOMICS-029` **Never take custody of client ad budget.**
    revenue-engine.html already says the client owns and funds the account. Keep it that way: the
    moment money passes through Nevamis it becomes a trust, tax and insurance problem
    disproportionate to the revenue.
    impact 5/5 · effort 1/5 · touches: revenue-engine.html, terms.html

30. `FINANCE-UNIT-ECONOMICS-030` **Write the bad-debt rule.**
    At what age does an unpaid invoice stop being chased and get written off? Founders chase too
    long, and the hours cost more than the invoice.
    impact 3/5 · effort 1/5 · touches: PLAYBOOK.md

31. `FINANCE-UNIT-ECONOMICS-031` **Quote in CAD only, and say so everywhere.**
    Already done on the site. Extend the rule to proposals and the agent prompt so a US-adjacent
    prospect never assumes USD and disputes the first invoice.
    impact 3/5 · effort 1/5 · touches: proposal.html, agent prompts

32. `FINANCE-UNIT-ECONOMICS-032` **Add payment terms to the proposal template.**
    Due on receipt, method, late handling. A proposal without terms invites a negotiation after
    the work is agreed, which is the worst time to have it.
    impact 4/5 · effort 1/5 · touches: proposal.html

33. `FINANCE-UNIT-ECONOMICS-033` **Record why each deal was won or lost, in one field.**
    Price, timing, trust, competitor, no decision. Twenty of these tell you more about pricing
    than any market research, and the field costs nothing to add now.
    impact 4/5 · effort 1/5 · touches: src/db/schema.ts leads, ops/leads

34. `FINANCE-UNIT-ECONOMICS-034` **Compute cost per lead by channel once there is any spend.**
    Attribution is already campaign-level by design. Dividing spend by leads per channel is the
    only way the first ad dollar gets spent twice as well as the last.
    impact 4/5 · effort 2/5 · touches: domain/marketing-attribution.ts

35. `FINANCE-UNIT-ECONOMICS-035` **Set the maximum acceptable cost to acquire a client.**
    Derived from contribution margin and expected lifetime, not from what feels affordable. It is
    the number that makes every channel decision objective.
    impact 4/5 · effort 2/5 · touches: UNIT-ECONOMICS-MODEL.md

36. `FINANCE-UNIT-ECONOMICS-036` **Estimate lifetime honestly, and label it an estimate.**
    With zero clients there is no churn data. Use a conservative assumption, write that it is an
    assumption, and revisit it after the fifth client rather than treating a guess as a fact.
    impact 3/5 · effort 1/5 · touches: UNIT-ECONOMICS-MODEL.md

37. `FINANCE-UNIT-ECONOMICS-037` **Track founder hours per client build.**
    A timer and a note is enough. It is the input to pricing, to the automation-versus-manual
    decision, and eventually to what a first hire is worth.
    impact 4/5 · effort 1/5 · touches: ops process

38. `FINANCE-UNIT-ECONOMICS-038` **Decide the point at which support becomes billable.**
    Included tuning reviews are in the plans. Everything else needs a boundary, or the highest-
    touch client silently becomes the least profitable.
    impact 4/5 · effort 1/5 · touches: pricing.html, terms.html

39. `FINANCE-UNIT-ECONOMICS-039` **Add a simple invoice record the client can see in the portal.**
    Trades owners keep paper. A downloadable invoice history reduces support email and looks like
    a real company.
    impact 3/5 · effort 3/5 · touches: portal, domain/billing.ts

40. `FINANCE-UNIT-ECONOMICS-040` **Reconcile provider invoices against recorded usage monthly.**
    Twilio and ElevenLabs both bill in their own units. Catching a mismatch in month one is a
    conversation; catching it in month twelve is a write-off.
    impact 3/5 · effort 2/5 · touches: ops process

41. `FINANCE-UNIT-ECONOMICS-041` **Keep a named emergency float.**
    One month of provider costs, untouched. An AI receptionist that stops answering because a card
    declined is a reputational event, not a cash event.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

42. `FINANCE-UNIT-ECONOMICS-042` **Decide what happens to a client's data and number if Nevamis stops.**
    A wind-down clause is a trust asset during a sale, not just a legal formality: the buyer of an
    AI receptionist is handing over their phone line.
    impact 4/5 · effort 2/5 · touches: terms.html

43. `FINANCE-UNIT-ECONOMICS-043` **Model the second-line and multi-location upsell.**
    The Growth and Scale tiers already imply it. Knowing the margin on an added line tells you
    whether expansion or acquisition is the cheaper next dollar.
    impact 3/5 · effort 2/5 · touches: UNIT-ECONOMICS-MODEL.md

44. `FINANCE-UNIT-ECONOMICS-044` **Put the break-even minute count on the pricing page's internal notes.**
    Not public. The person quoting needs to know at what usage a plan stops making money, in the
    same file as the prices.
    impact 3/5 · effort 1/5 · touches: pricing-config.js comments

45. `FINANCE-UNIT-ECONOMICS-045` **Charge for number porting rather than absorbing it.**
    Porting is excluded from the pilot already. It carries carrier fees and real founder time, and
    it is the moment a client is most committed, which makes it the easiest thing to charge for.
    impact 3/5 · effort 1/5 · touches: pricing.html, pilot.html

46. `FINANCE-UNIT-ECONOMICS-046` **Write the pause policy.**
    Seasonal trades go quiet. A defined pause at a reduced rate keeps the number and the
    relationship instead of forcing a cancel-and-resell.
    impact 4/5 · effort 2/5 · touches: terms.html, domain/billing.ts

47. `FINANCE-UNIT-ECONOMICS-047` **Distinguish involuntary churn from voluntary in reporting.**
    A failed card and a dissatisfied client are different problems with different fixes, and
    counting them together hides both.
    impact 3/5 · effort 2/5 · touches: domain/billing.ts, ops/revenue

48. `FINANCE-UNIT-ECONOMICS-048` **Keep a running list of every recurring business subscription.**
    Solo founders accumulate tools. A monthly list with a "still used?" column is the cheapest
    cost control there is.
    impact 3/5 · effort 1/5 · touches: docs

49. `FINANCE-UNIT-ECONOMICS-049` **Decide whether the demo line is a marketing cost or a product cost.**
    It runs 24/7 on real minutes with no revenue attached. Naming it a marketing cost makes it
    budgetable instead of a mystery line item.
    impact 3/5 · effort 1/5 · touches: UNIT-ECONOMICS-MODEL.md

50. `FINANCE-UNIT-ECONOMICS-050` **Cap the demo line's monthly minutes.**
    It is a public phone number on the internet. A spend ceiling with a graceful fallback protects
    against both a viral week and a malicious one.
    impact 4/5 · effort 2/5 · touches: domain/notify-budget.ts, ElevenLabs config

51. `FINANCE-UNIT-ECONOMICS-051` **Record the cost of each abandoned experiment.**
    Not to feel bad about it. To notice when the same category of experiment keeps failing.
    impact 2/5 · effort 1/5 · touches: docs

52. `FINANCE-UNIT-ECONOMICS-052` **Set a rule for when to buy a tool versus build it.**
    A non-technical founder with an AI pair-programmer has an unusual build-versus-buy curve, and
    an explicit rule stops both over-building and subscription creep.
    impact 3/5 · effort 1/5 · touches: PLAYBOOK.md

53. `FINANCE-UNIT-ECONOMICS-053` **Quantify what one missed founder follow-up costs.**
    If a qualified lead is worth the contribution margin of a year of service, a dropped callback
    is a four-figure mistake. Making that number explicit changes behaviour more than a reminder.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

54. `FINANCE-UNIT-ECONOMICS-054` **Build the one-page monthly close checklist.**
    Reconcile Stripe, reconcile providers, set aside tax, update the forecast, update MRR. Thirty
    minutes on the first of the month, done the same way every time.
    impact 4/5 · effort 1/5 · touches: new docs/MONTHLY-CLOSE.md

55. `FINANCE-UNIT-ECONOMICS-055` **Keep the pricing config the only place a number lives.**
    Already true across the site, the agent's speech and the playbook. Extend it to the proposal
    and any future invoice template so a price change stays a one-file change.
    impact 4/5 · effort 2/5 · touches: pricing-config.js, proposal.html

56. `FINANCE-UNIT-ECONOMICS-056` **Test the whole payment path with a real card before the first client.**
    Checkout, webhook, recorded payment, receipt, portal reflection. A payment failure on client
    one is a trust event that no apology fully repairs.
    impact 5/5 · effort 2/5 · touches: api/webhooks/stripe, domain/billing.ts

57. `FINANCE-UNIT-ECONOMICS-057` **Decide the deposit rule for Scale builds.**
    A multi-location build can absorb a week. Partial payment before work protects against the
    most expensive kind of ghosting.
    impact 3/5 · effort 1/5 · touches: PLAYBOOK.md, proposal.html

58. `FINANCE-UNIT-ECONOMICS-058` **Add a plain-language "what you will be charged" block to the proposal.**
    Setup, first month, when each lands, what happens at renewal. Surprise is the most common
    reason a signed deal unwinds in week one.
    impact 4/5 · effort 1/5 · touches: proposal.html

59. `FINANCE-UNIT-ECONOMICS-059` **Review pricing after client five, on a date already in the calendar.**
    Not "when it feels wrong". A scheduled review with real usage data is how the ladder stops
    being a guess made before any client existed.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

60. `FINANCE-UNIT-ECONOMICS-060` **Write down what would make you stop.**
    A pre-committed condition — months of runway, or clients by a date — decided while calm.
    Founders without one tend to spend the last dollar rather than the second-to-last.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md
