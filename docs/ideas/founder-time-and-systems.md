# Founder time & systems — 60 improvements

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


Every other file in this directory assumes the work gets done. This one is about the only
resource that actually limits Nevamis: one person's hours. The playbook says the bottleneck is
sales, not software, and yet the software is where a technically-assisted founder naturally
spends the day, because building is comfortable and calling strangers is not. Founder-led
onboarding is also a stated capacity cap on the site, which means founder time is simultaneously
the growth constraint, the delivery constraint, and the thing no dashboard measures.

Ordering: protect selling time first, then make the repeatable things repeatable, then decide
what gets delegated, and last the personal-sustainability items that founders skip and regret.

---

1. `FOUNDER-TIME-AND-SYSTEMS-001` **Block calling hours in the calendar and defend them.**
   Trades owners answer the phone early and late. Two fixed blocks a day, in the calendar as
   busy, before anything else is scheduled. Everything in this repo can wait an hour; a prospect
   at 7:10am cannot.
   impact 5/5 · effort 1/5 · touches: calendar, PLAYBOOK.md

2. `FOUNDER-TIME-AND-SYSTEMS-002` **Do the uncomfortable task first, every day.**
   The failure mode of a founder who can build is a week of satisfying commits and zero
   conversations. Name the first task the night before and make it a call.
   impact 5/5 · effort 1/5 · touches: PLAYBOOK.md

3. `FOUNDER-TIME-AND-SYSTEMS-003` **Track hours by category for two weeks, then look.**
   Build, sell, deliver, admin. Two weeks of honest tallying usually shows a ratio that
   contradicts the stated strategy, and no amount of planning substitutes for seeing it.
   impact 5/5 · effort 1/5 · touches: ops process

4. `FOUNDER-TIME-AND-SYSTEMS-004` **Set a weekly minimum of conversations, not tasks.**
   Ten owners spoken to beats forty commits when the diagnosis is a sales bottleneck. Track the
   count where it is visible daily.
   impact 5/5 · effort 1/5 · touches: PLAYBOOK.md, ops/page.tsx

5. `FOUNDER-TIME-AND-SYSTEMS-005` **Write the client build as a checklist and follow it exactly.**
   The onboarding autopilot covers much of it. The parts that are still manual need a literal
   list, because the first five builds are where the SOP is discovered and it will not be
   remembered accurately afterwards.
   impact 5/5 · effort 2/5 · touches: docs/onboarding SOPs

6. `FOUNDER-TIME-AND-SYSTEMS-006` **Time-box every build and record the overrun.**
   The gap between estimate and actual is the single most useful number for pricing and for
   deciding what to automate next.
   impact 4/5 · effort 1/5 · touches: ops process

7. `FOUNDER-TIME-AND-SYSTEMS-007` **Keep one inbox rule: nothing sits unread past the day.**
   With no clients, every inbound is potentially the first one. This stops being possible later,
   which is exactly why it should be the habit now.
   impact 4/5 · effort 1/5 · touches: process

8. `FOUNDER-TIME-AND-SYSTEMS-008` **Put the demo line's own missed-call handling on the founder's phone.**
   Nevamis sells never missing a call. A prospect who calls the demo line, likes it, and then
   cannot reach a human is the sharpest possible irony and the most expensive.
   impact 5/5 · effort 1/5 · touches: ring.xml, Twilio config

9. `FOUNDER-TIME-AND-SYSTEMS-009` **Batch all engineering into named days.**
   Context switching between a sales call and a schema migration costs both. Two build days,
   three selling days, decided in advance.
   impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

10. `FOUNDER-TIME-AND-SYSTEMS-010` **Write the daily shutdown ritual.**
    Tomorrow's first task named, follow-ups logged, nothing left in short-term memory. Solo
    founders lose more to forgotten threads than to bad decisions.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

11. `FOUNDER-TIME-AND-SYSTEMS-011` **Keep a single source of truth for what to do next.**
    Ideas live in this directory, tasks live in the ops queue, and intentions live in the
    playbook. Three lists means no list. Pick the ops queue and feed the others into it.
    impact 5/5 · effort 2/5 · touches: ops/queue, docs/ideas

12. `FOUNDER-TIME-AND-SYSTEMS-012` **Make the ops home screen answer "what do I do right now".**
    Not metrics. One prioritised action. A dashboard that requires interpretation gets opened
    less each week until it is not opened at all.
    impact 5/5 · effort 3/5 · touches: ops/page.tsx, domain/queue.ts

13. `FOUNDER-TIME-AND-SYSTEMS-013` **Delete the tasks that have been deferred five times.**
    A backlog item nobody has done in a month is a decision that has already been made
    implicitly. Closing it honestly frees more attention than doing it would.
    impact 3/5 · effort 1/5 · touches: ops/queue

14. `FOUNDER-TIME-AND-SYSTEMS-014` **Record every SOP the first time it is performed, not the second.**
    The first time is when the details are conscious. By the second they are invisible, which is
    why most founder documentation is subtly wrong.
    impact 4/5 · effort 2/5 · touches: docs

15. `FOUNDER-TIME-AND-SYSTEMS-015` **Turn the day-8 review call into a script that survives repetition.**
    It already exists as DAY8-REVIEW-SCRIPT.md. Use it verbatim for the first five, then edit it
    from evidence rather than instinct.
    impact 4/5 · effort 1/5 · touches: outreach/DAY8-REVIEW-SCRIPT.md

16. `FOUNDER-TIME-AND-SYSTEMS-016` **Decide what a VA does before hiring one.**
    List the tasks by name and by hours. "Help with admin" produces a expensive apprentice; a
    list produces leverage in week one.
    impact 4/5 · effort 2/5 · touches: PLAYBOOK.md

17. `FOUNDER-TIME-AND-SYSTEMS-017` **Make the ops console usable by someone who is not the founder.**
    The a11y labels landed; the harder gap is that most screens assume context only Daren has.
    Every action needs a sentence saying what it does and what it cannot undo.
    impact 4/5 · effort 3/5 · touches: ops/*

18. `FOUNDER-TIME-AND-SYSTEMS-018` **Write down which decisions must stay with the founder.**
    Pricing, claims, anything a client hears as a promise. Everything else can be delegated the
    day there is anyone to delegate to, and knowing the line in advance makes that fast.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

19. `FOUNDER-TIME-AND-SYSTEMS-019` **Automate only after doing it manually five times.**
    Automating a process that is still changing produces code that has to be unpicked. Five
    repetitions is enough to know the shape.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

20. `FOUNDER-TIME-AND-SYSTEMS-020` **Keep a "did not build" list.**
    Everything considered and declined, with the reason. It stops the same idea being
    re-evaluated from scratch every six weeks.
    impact 3/5 · effort 1/5 · touches: docs

21. `FOUNDER-TIME-AND-SYSTEMS-021` **Put a hard stop on the working day.**
    Not for balance alone: decisions made after twelve hours are the ones that get reverted, and
    reverting costs more than stopping.
    impact 4/5 · effort 1/5 · touches: process

22. `FOUNDER-TIME-AND-SYSTEMS-022` **Schedule the weekly review as an appointment.**
    Numbers, pipeline, what shipped, what slipped. Thirty minutes. A business run without one
    drifts toward whatever was most recently interesting.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md, ops/weekly

23. `FOUNDER-TIME-AND-SYSTEMS-023` **Use the existing /ops/weekly screen or delete it.**
    An unused internal screen is a maintenance cost pretending to be an asset.
    impact 3/5 · effort 1/5 · touches: ops/weekly

24. `FOUNDER-TIME-AND-SYSTEMS-024` **Set one metric for the quarter and put it on the wall.**
    Clients, not commits. Everything that does not move it is a candidate for deletion.
    impact 5/5 · effort 1/5 · touches: PLAYBOOK.md

25. `FOUNDER-TIME-AND-SYSTEMS-025` **Cap work-in-progress at one feature.**
    Parallel half-finished work is the main way solo output disappears without a trace.
    impact 4/5 · effort 1/5 · touches: process

26. `FOUNDER-TIME-AND-SYSTEMS-026` **Keep a decision log with dates.**
    Why the pilot is seven days, why prices are what they are, why the escalation line was
    retired. Six months on, the reasoning is gone and the decision gets relitigated.
    impact 4/5 · effort 1/5 · touches: docs

27. `FOUNDER-TIME-AND-SYSTEMS-027` **Re-read the claims ledger before writing any public copy.**
    Already the rule. Make it a literal step in the copy checklist so it survives a busy week.
    impact 5/5 · effort 1/5 · touches: docs/CLAIMS-LEDGER.md

28. `FOUNDER-TIME-AND-SYSTEMS-028` **Run the four guard scripts before every deploy.**
    Site consistency, Playwright, site audit, agent sync. They exist; the risk is that a rushed
    push skips them exactly when a rushed push is most likely to break something.
    impact 5/5 · effort 1/5 · touches: scripts/*, process

29. `FOUNDER-TIME-AND-SYSTEMS-029` **Add a pre-push hook that runs the consistency check.**
    Make the safe path the default path rather than the disciplined one.
    impact 4/5 · effort 2/5 · touches: .git/hooks, package.json

30. `FOUNDER-TIME-AND-SYSTEMS-030` **Stop using `git add -A` in a repo two sessions touch.**
    It silently commits other in-flight work under the wrong message. Stage explicit paths.
    impact 4/5 · effort 1/5 · touches: process

31. `FOUNDER-TIME-AND-SYSTEMS-031` **Keep one working branch per session when parallel work happens.**
    Two agents on one branch will collide. Branches make the collision visible at merge instead of
    invisible at commit.
    impact 4/5 · effort 2/5 · touches: process

32. `FOUNDER-TIME-AND-SYSTEMS-032` **Write the "what I would tell a new hire on day one" document.**
    It is the fastest way to discover what is undocumented, and it is most accurate now, while
    everything is still fresh and small.
    impact 4/5 · effort 2/5 · touches: docs

33. `FOUNDER-TIME-AND-SYSTEMS-033` **Record a screen capture of one full client build.**
    Faster than writing it, and the eventual VA or contractor learns from it in an hour.
    impact 4/5 · effort 2/5 · touches: docs

34. `FOUNDER-TIME-AND-SYSTEMS-034` **Keep a list of the five questions prospects actually ask.**
    Updated after every call. It is the highest-signal input to the site, the agent prompt, and
    the FAQ, and it costs one line per call.
    impact 5/5 · effort 1/5 · touches: PLAYBOOK.md, agent prompts

35. `FOUNDER-TIME-AND-SYSTEMS-035` **Review call recordings of your own sales calls, not just the agent's.**
    The agent gets a quality queue. The founder's calls get nothing, and that is where the deals
    are lost.
    impact 5/5 · effort 2/5 · touches: process

36. `FOUNDER-TIME-AND-SYSTEMS-036` **Prepare the three objections you handle worst.**
    Price, trust in AI, and "my customers want a human". Written answers, said out loud until
    they are natural.
    impact 5/5 · effort 2/5 · touches: outreach scripts

37. `FOUNDER-TIME-AND-SYSTEMS-037` **Keep a same-day follow-up rule after every conversation.**
    Recap email, next step, calendar hold. The follow-up is where most solo pipelines leak, and
    it is entirely within one person's control.
    impact 5/5 · effort 1/5 · touches: process, outreach templates

38. `FOUNDER-TIME-AND-SYSTEMS-038` **Use the engine's own automation for founder follow-ups.**
    Dogfooding is both a time saver and the most honest possible product test.
    impact 4/5 · effort 3/5 · touches: domain/automation.ts

39. `FOUNDER-TIME-AND-SYSTEMS-039` **Put every commitment made on a call into the queue before the next call.**
    Memory between back-to-back conversations is the least reliable system in the business.
    impact 5/5 · effort 1/5 · touches: ops/queue

40. `FOUNDER-TIME-AND-SYSTEMS-040` **Set a rule for when to stop customising a build.**
    Trades owners will keep adding rules. A defined scope boundary protects the margin and the
    launch date.
    impact 4/5 · effort 1/5 · touches: onboarding SOPs

41. `FOUNDER-TIME-AND-SYSTEMS-041` **Keep the first five clients geographically close.**
    In-person beats video for trust in trades, and the founder learns faster standing in a shop
    than reading a survey.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

42. `FOUNDER-TIME-AND-SYSTEMS-042` **Say no to the client who wants something outside the model.**
    The first revenue is the most tempting and the most dangerous. One bespoke client can absorb
    a quarter.
    impact 5/5 · effort 1/5 · touches: PLAYBOOK.md

43. `FOUNDER-TIME-AND-SYSTEMS-043` **Keep a running note of what the product cannot do.**
    It makes sales honest, it makes the roadmap real, and it prevents the agent being sold into a
    situation it will fail in.
    impact 5/5 · effort 1/5 · touches: coming-soon.html, docs

44. `FOUNDER-TIME-AND-SYSTEMS-044` **Test the whole funnel as a stranger once a month.**
    Find the site, read it, call the line, book a call, sign up. Every month. It is the only way
    to see what a prospect sees.
    impact 5/5 · effort 2/5 · touches: process

45. `FOUNDER-TIME-AND-SYSTEMS-045` **Keep the phone number visible on the founder's own devices.**
    Answering the demo line personally when the AI hands off is the highest-converting thing
    available, and it only works if the handoff reaches a phone that is in a pocket.
    impact 4/5 · effort 1/5 · touches: Twilio config

46. `FOUNDER-TIME-AND-SYSTEMS-046` **Batch admin into one weekly session.**
    Banking, receipts, filings. Admin expands to fill any gap it is allowed into.
    impact 3/5 · effort 1/5 · touches: process

47. `FOUNDER-TIME-AND-SYSTEMS-047` **Automate the weekly numbers into an email to yourself.**
    Pulled, not pushed, means eventually not looked at.
    impact 3/5 · effort 2/5 · touches: api/autopilot/daily, domain/weekly.ts

48. `FOUNDER-TIME-AND-SYSTEMS-048` **Keep a two-week rolling plan, not a quarterly one.**
    Pre-revenue plans past a fortnight are fiction, and writing fiction takes time that could be
    spent finding out.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

49. `FOUNDER-TIME-AND-SYSTEMS-049` **Name the single riskiest assumption each fortnight and test it.**
    Currently it is probably "trades owners in Edmonton will pay $249/month for this". Everything
    else is downstream of that answer.
    impact 5/5 · effort 1/5 · touches: PLAYBOOK.md

50. `FOUNDER-TIME-AND-SYSTEMS-050` **Stop polishing the site while the pipeline is empty.**
    The site is measurably good. Another point of polish converts nobody if nobody arrives, and it
    is the most comfortable possible way to avoid selling.
    impact 5/5 · effort 1/5 · touches: PLAYBOOK.md

51. `FOUNDER-TIME-AND-SYSTEMS-051` **Set an explicit budget for AI-assisted build time.**
    The build capacity is unusually high for one person, which makes over-building the specific
    risk rather than under-building.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

52. `FOUNDER-TIME-AND-SYSTEMS-052` **Keep a personal energy log alongside the hours log.**
    Which work drains and which restores. It matters more for a solo founder than for a team,
    because there is nobody to cover a bad fortnight.
    impact 3/5 · effort 1/5 · touches: process

53. `FOUNDER-TIME-AND-SYSTEMS-053` **Arrange one peer to report to weekly.**
    Not a mentor, not a coach. Someone who asks how many conversations happened. External
    accountability outperforms internal discipline in every solo context.
    impact 4/5 · effort 1/5 · touches: process

54. `FOUNDER-TIME-AND-SYSTEMS-054` **Take one full day off a week, in the calendar.**
    A twelve-month runway needs twelve months of decisions, and the quality of those decisions is
    the actual asset.
    impact 4/5 · effort 1/5 · touches: process

55. `FOUNDER-TIME-AND-SYSTEMS-055` **Write down what "working" would look like in ninety days.**
    Specific enough to be falsifiable. It converts a year of effort into a series of checkable
    bets.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

56. `FOUNDER-TIME-AND-SYSTEMS-056` **Keep the playbook current or stop calling it the source of truth.**
    A stale canonical document is worse than none, because it is trusted.
    impact 4/5 · effort 1/5 · touches: PLAYBOOK.md

57. `FOUNDER-TIME-AND-SYSTEMS-057` **Put the four guard commands in the README where they are seen.**
    Discoverability is the difference between a safety net and a script nobody remembers exists.
    impact 3/5 · effort 1/5 · touches: README.md

58. `FOUNDER-TIME-AND-SYSTEMS-058` **Keep a "first client" checklist ready before there is one.**
    Contract, invoice, number, build slot, welcome email. The first yes should be met with
    execution, not scrambling.
    impact 5/5 · effort 2/5 · touches: docs

59. `FOUNDER-TIME-AND-SYSTEMS-059` **Rehearse the first client's first day.**
    Walk it end to end with a fictional business. Every gap found in rehearsal is one not found
    in front of a paying customer.
    impact 5/5 · effort 2/5 · touches: process

60. `FOUNDER-TIME-AND-SYSTEMS-060` **Decide in advance how many pilots can run at once.**
    The site says founder-led onboarding caps concurrent builds. Put a number on it, and stop
    selling past it rather than discovering the ceiling by breaking a promise.
    impact 5/5 · effort 1/5 · touches: PLAYBOOK.md, pilot.html
