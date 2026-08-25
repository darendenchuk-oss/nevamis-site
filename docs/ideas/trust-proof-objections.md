# Trust, Proof, and Objections — 60 improvements

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


Nevamis has zero clients and therefore zero conventional social proof, but it is not short of *honest* proof: a live phone number a stranger can dial at 3am, a real ElevenLabs agent with a published guardrail prompt, eleven real AI voice files on the homepage, a genuinely free pilot with hard caps and a written day-eight rule, fully published pricing, a claims ledger, a GitHub Actions uptime tripwire, and a founder with a face and a name in Edmonton. The failure mode is not "no proof" — it is proof that is unlabelled, unverifiable, contradicted elsewhere, or hidden behind three clicks. This list starts with the contradictions currently live on the site (a retired claim is still in the hero, the live agent prompt disagrees with `pricing-config.js`, and `llms.txt` promises call recordings the site never mentions), then builds out the recorded-proof library, the objection-handling surfaces, and the mechanisms that will convert pilot one into publishable evidence the day it ends. Everything here is buildable with what exists today; nothing requires a client, a testimonial, or a number that has not been measured.

---

1. **TRUST-PROOF-OBJECTIONS-001 — Remove the retired "answers on the first ring" claim still live in the hero.** `docs/CLAIMS-LEDGER.md` row CLM-02 states this phrasing was replaced in five spots on 2026-07-26 because monitoring cannot support it, yet `home.html:394` and `index.html:395` still read "Live demo line: (587) 413-0035 · answers on the first ring." Change both to "answers in seconds", the approved wording, then update CLM-02's Verified date. A live claim the company's own ledger says was killed is the single worst trust artefact on the site.
   impact 5/5 · effort 1/5 · touches: home.html:394, index.html:395, docs/CLAIMS-LEDGER.md

2. **TRUST-PROOF-OBJECTIONS-002 — Add the retired claims to the mechanical banned list so they cannot come back.** `scripts/check-consistency.js` has a `banned` array (currently `30-day guarantee`, `free trial`, `risk-free launch`, `$397`, `limited spots remaining`, `join thousands`, `launching next month`). Add `/first ring/i`, `/money-?back/i`, `/guaranteed/i`, `/\b\d+% (uptime|of calls)/i`, and `/trusted by/i`. Idea 001 fixes today's regression; this stops the next one, and it is a five-line change to a script already in the workflow.
   impact 4/5 · effort 1/5 · touches: scripts/check-consistency.js

3. **TRUST-PROOF-OBJECTIONS-003 — Extend the consistency guard past HTML to `llms.txt` and the agent-prompt snapshot.** `check-consistency.js` only walks `contentPages` (ten .html files). Add `llms.txt` and `../nevamis-engine/docs/agent-prompts/demo.md` to the banned-phrase and pilot-naming sweep. The live demo agent's own prompt currently contains "it answers on the first ring at any hour" in its objection-handling block, which means a prospect calling the number hears a claim the website retired.
   impact 5/5 · effort 2/5 · touches: scripts/check-consistency.js, llms.txt, nevamis-engine/docs/agent-prompts/demo.md

4. **TRUST-PROOF-OBJECTIONS-004 — Correct the live demo agent's "first ring" objection line in ElevenLabs and re-snapshot.** The prompt snapshot at `nevamis-engine/docs/agent-prompts/demo.md` (sha256 d24f1934…) contains, under HANDLING OBJECTIONS: "It's just a robot." Own it warmly: it answers on the first ring at any hour. Owner-only edit in the ElevenLabs console to "it answers in seconds at any hour", then re-run the snapshot script so the file and the live agent agree again. The demo line is the primary proof asset; it must not be the thing that breaks the claim.
   impact 5/5 · effort 2/5 · touches: ElevenLabs agent_9101ky43tys1fswstde818j7j8wt, nevamis-engine/docs/agent-prompts/demo.md

5. **TRUST-PROOF-OBJECTIONS-005 — Reconcile the usage-alert thresholds between the agent and pricing-config.** `pricing-config.js` `usagePolicy.notes` says "Usage alerts at 50%, 75%, 90%, and 100% of included minutes"; the live agent prompt tells callers "Usage alerts at 75, 90, and 100 percent." A prospect who hears one number and reads another has just caught you being sloppy about billing, which is the worst category to be sloppy in. Pick 50/75/90/100 (the engine portal already implements it) and fix the agent prompt.
   impact 4/5 · effort 1/5 · touches: nevamis-engine/docs/agent-prompts/demo.md, pricing-config.js

6. **TRUST-PROOF-OBJECTIONS-006 — Fix the `llms.txt` overclaim that owners get "recordings and transcripts of every call".** The opening blockquote of `llms.txt` says Nevamis "sends the owner recordings and transcripts of every call", but every page of the site promises a *summary* (name, number, need, outcome), and `privacy.html` explicitly says the business decides its own recording settings. Rewrite to "sends the owner a written summary of every call, with recording and transcript settings decided with the business before launch." AI assistants quoting `llms.txt` will otherwise manufacture a promise you did not make.
   impact 4/5 · effort 1/5 · touches: llms.txt

7. **TRUST-PROOF-OBJECTIONS-007 — Resolve the GST/HST contradiction between the site and the pilot SOP.** `terms.html` and `llms.txt` publish GST/HST 705729200 RT0001 and every price says "plus applicable GST/HST", while `nevamis-engine/docs/pilot/pilot-sop.md` section 0 still instructs "not GST/HST registered — do not add GST to any quote." One of these will be quoted at a prospect on a live call. Update the SOP to the registered position, add a row to the claims ledger, and grep both repos for other tax statements.
   impact 4/5 · effort 1/5 · touches: nevamis-engine/docs/pilot/pilot-sop.md, docs/CLAIMS-LEDGER.md

8. **TRUST-PROOF-OBJECTIONS-008 — Stop `llms.txt` asserting the 12-month price lock while CLM-09 is unresolved.** `llms.txt` states "Prices locked 12 months from signup, month-to-month" as a flat key fact, but claims-ledger row CLM-09 has status REVIEW pending counsel sign-off. Either move CLM-09 to APPROVED with the terms.html wording as evidence, or soften `llms.txt` to match `terms.html` exactly. Never let the machine-readable surface be more confident than the ledger.
   impact 3/5 · effort 1/5 · touches: llms.txt, docs/CLAIMS-LEDGER.md

9. **TRUST-PROOF-OBJECTIONS-009 — Add a Playwright spec that asserts the claims ledger's REMOVED and REVISED rows are absent from every page.** `tests/` has four specs (motion, interactions, pages, seo). Add `tests/claims.spec.js` that loads each of the ten indexable pages and asserts the retired phrasings ("first ring", "50 to 70% of calls", "usually the same day", "30-day guarantee") return zero matches, plus asserts the `(fictional)` label is present on every Cedarview card. Regression protection for the one thing you cannot un-ship: a broken promise a prospect screenshotted.
   impact 4/5 · effort 2/5 · touches: tests/claims.spec.js, playwright.config.js

10. **TRUST-PROOF-OBJECTIONS-010 — Put a spoken two-second provenance pre-roll on the example-call audio.** `site.js` chains `assets/call-0.mp3` through `call-10.mp3` in `playNext()`. Generate `assets/call-intro.mp3` in a distinct voice saying "Example call. Fictional company. Real AI voices." and prepend it to the chain. The `(fictional)` label is visible on screen but vanishes the moment someone records their phone screen and forwards the audio to a partner, which is exactly how this clip will travel.
   impact 4/5 · effort 2/5 · touches: site.js (call player block ~line 170-235), assets/call-intro.mp3, home.html, index.html, demo.html

11. **TRUST-PROOF-OBJECTIONS-011 — Put the real proof directly beside the fictional one in the call-proof section.** On `home.html` the `.call-card` is labelled "Example call · Cedarview Electric (fictional)" and the CTA to actually call the live number sits in the *adjacent* `.owner-card` below the SMS mock. Add a one-line bridge under the call card's `.foot-note`: "That call was staged. This number is not: (587) 413-0035 answers right now, in the same voice." The honest label costs you credibility unless the real thing is immediately next to it.
   impact 4/5 · effort 1/5 · touches: home.html:577, index.html, demo.html

12. **TRUST-PROOF-OBJECTIONS-012 — Record and publish an unedited founder-cold-call clip as the first non-fictional proof asset.** Have Daren call (587) 413-0035 from a mobile at a stated time, record the whole thing including ringback and any awkwardness, and publish it as `assets/proof/cold-call-<date>.mp3` on `demo.html` labelled "Unedited. Called <date>, <time> MT, from a mobile. Nothing cut." This is the only clip on the site that is verifiably real, and the prospect can reproduce it in thirty seconds, which is what makes it believable.
   impact 5/5 · effort 2/5 · touches: assets/proof/, demo.html

13. **TRUST-PROOF-OBJECTIONS-013 — Publish the failure reel: a recording where the AI refuses to answer.** The live agent prompt already contains the rule "If a caller asks about a specific CRM or scheduling system you cannot verify, never say yes to be agreeable." Record a call that triggers it ("do you integrate with Jobber?") and publish it beside the success clip with the caption "We publish this one on purpose. It said it could not confirm, instead of guessing." Nothing sells an AI to a skeptical trades owner like evidence it knows when to shut up.
   impact 5/5 · effort 2/5 · touches: assets/proof/, demo.html, home.html FAQ

14. **TRUST-PROOF-OBJECTIONS-014 — Record the interruption test as a clip, since `demo.html` already tells people to try it.** `demo.html` has a "Change your mind mid-call" card under "Three ways to push it" but offers no evidence it survives the test. Record a call where the caller gives an address, then changes it mid-sentence, then changes the time. Publish it under that exact card. Every instruction to "go test it yourself" converts better when paired with what a good result sounds like.
   impact 4/5 · effort 2/5 · touches: demo.html "Three ways to push it" section, assets/proof/

15. **TRUST-PROOF-OBJECTIONS-015 — Record the jobsite-noise call.** Trades owners' single most specific doubt is "my customers call from a truck with the radio on and a compressor running." Record a call to the demo line from a running vehicle or with jobsite audio playing at realistic volume, publish it, and label the conditions honestly. If it degrades, publish that too with the note about what conditions it handles well, which is more persuasive than a clean-room clip.
   impact 4/5 · effort 2/5 · touches: assets/proof/, demo.html

16. **TRUST-PROOF-OBJECTIONS-016 — Record the emergency-escalation call.** The pilot page promises "transfer to your on-call number, take a message, flag the summary urgent, or fall back to your voicemail" and the engine has `docs/ESCALATION-PLAYBOOK.md`. Record a caller saying "I smell gas" and publish what the agent does. Escalation is the objection with the most downside in the owner's head (someone gets hurt, they get sued) and it is currently answered only with prose.
   impact 5/5 · effort 3/5 · touches: assets/proof/, home.html FAQ, pilot.html qa block

17. **TRUST-PROOF-OBJECTIONS-017 — Record the "ask it for a price it was never given" call.** `demo.html` card three already says "Push for a price it has not been given. It should hold the line without making things up." Prove it. This is the anti-hallucination demonstration, and it is the objection that AI-skeptical owners cannot articulate but absolutely feel: "it'll promise my customers something I can't deliver."
   impact 5/5 · effort 2/5 · touches: demo.html, assets/proof/

18. **TRUST-PROOF-OBJECTIONS-018 — Build `assets/proof/manifest.json` and render every clip from it.** Once ideas 012 to 017 exist there will be six-plus audio assets scattered across pages. Define one manifest with `{id, file, title, recordedAt, conditions, unedited: true, caption}` and a small renderer in `site.js` that builds the player markup, so provenance metadata cannot drift from the file and new clips are one JSON entry. This is the compounding version of the proof library rather than six hand-pasted blocks.
   impact 4/5 · effort 3/5 · touches: assets/proof/manifest.json, site.js, assets/motion/site.css

19. **TRUST-PROOF-OBJECTIONS-019 — Ship a `/proof-library.html` page that is nothing but labelled recordings.** Ten to twelve clips, each with date, conditions, and an "unedited" flag, grouped as *It worked*, *It refused*, *It escalated*, *It struggled*. Link it from the homepage call-proof section and from every sales email. A page whose entire premise is "here are the recordings, including the bad ones" is a defensible position no competitor with fake testimonials can copy.
   impact 5/5 · effort 3/5 · touches: new proof-library.html, sitemap.xml, scripts/gen-sitemap.mjs, llms.txt

20. **TRUST-PROOF-OBJECTIONS-020 — Add a per-clip OG image so proof survives being forwarded.** Each proof clip needs `og:image` and a shareable anchor URL (`/proof-library.html#refused-integration`) so when an owner texts the link to a partner it renders as something other than a bare URL. Reuse the `assets/og-default.svg` template with the clip title burned in. Proof that cannot be forwarded does not compound.
   impact 3/5 · effort 3/5 · touches: proof-library.html, assets/og-*.svg, scripts/

21. **TRUST-PROOF-OBJECTIONS-021 — Replace the "will it sound robotic" FAQ text answer with an inline six-second listen button.** `home.html:975` currently answers "Call (587) 413-0035 and judge." A `<details>` that asks someone to leave the site is a weak close. Embed a six-second `assets/call-0.mp3` play button directly inside that FAQ answer so the doubt is resolved in the same second it is raised, then keep the phone number as the escalation.
   impact 4/5 · effort 2/5 · touches: home.html:975, index.html, site.js

22. **TRUST-PROOF-OBJECTIONS-022 — Publish exactly what the AI says when a caller demands a human.** The FAQ answers "Will callers know it is AI?" but never the harder follow-up: what happens when the caller says "get me a real person." Add a FAQ entry and a proof clip: the agent acknowledges, then transfers to the on-call number or takes a message per the owner's approved rule. The unstated fear is that the AI traps the customer in a loop, and that fear is worth more than any feature.
   impact 5/5 · effort 2/5 · touches: home.html FAQ, assets/proof/, nevamis-engine/docs/agent-prompts/demo.md

23. **TRUST-PROOF-OBJECTIONS-023 — Add the "what if it goes down" answer with the actual fallback chain.** No page currently says what happens if ElevenLabs, Twilio, or Nevamis fails mid-day. `nevamis-engine/docs/FAILURE-DRILLS.md` and `ESCALATION-PLAYBOOK.md` have the real answer. Publish it in plain words on `home.html` FAQ and `pilot.html`: if the AI cannot answer, the carrier forwarding rule falls back to your existing voicemail, and you can cancel forwarding from your own handset in ten seconds. Owners will forgive a failure mode they were told about.
   impact 5/5 · effort 2/5 · touches: home.html FAQ, pilot.html qa block

24. **TRUST-PROOF-OBJECTIONS-024 — Publish the carrier-forwarding undo codes as a public page, not a pilot-only doc.** `nevamis-engine/docs/pilot/carrier-forwarding-guide.md` contains the Telus/Rogers/Bell/Shaw forwarding and cancel codes. Ship a `/how-forwarding-works.html` with the exact `*72` / `#73`-style sequences for Alberta carriers. Handing a prospect the off-switch before they have switched anything on is the strongest possible signal that there is no lock-in, and it doubles as a genuinely useful SEO asset.
   impact 5/5 · effort 3/5 · touches: new how-forwarding-works.html, nevamis-engine/docs/pilot/carrier-forwarding-guide.md, sitemap.xml

25. **TRUST-PROOF-OBJECTIONS-025 — Answer "you have no clients yet" on the page instead of hoping nobody asks.** The site never acknowledges it. Add a FAQ entry: "How many businesses use this?" answered with "Nevamis is new. We publish no client counts because we have none to publish. What we do publish is a number you can call, recordings of it working and failing, and a pilot that costs nothing. The first five businesses get their setup fee waived because their feedback is worth more to us than their setup fee." Naming the weakness first removes its power.
   impact 5/5 · effort 1/5 · touches: home.html FAQ, index.html, about.html

26. **TRUST-PROOF-OBJECTIONS-026 — Replace the "no testimonials" gap with an explicit placeholder that explains itself.** Where a testimonial strip would normally sit (between `#risk` and `#beyond` on `home.html`), add a bordered panel: "This is where client quotes go. There are none yet, and we will not invent them. When pilot one finishes, its results go here, named or anonymous, good or bad." Buyers notice the absence anyway; the only choice is whether you control the story about it.
   impact 4/5 · effort 1/5 · touches: home.html between line 945 and 947, index.html, assets/motion/site.css

27. **TRUST-PROOF-OBJECTIONS-027 — Add the "what if you go out of business" continuity answer.** A solo founder selling infrastructure that sits in front of a business's phone line will be asked this. Answer it in the FAQ: your number was never ported, it is still yours; forwarding is cancelled from your own handset in ten seconds; the pilot never has your card; there is no annual contract you cannot exit. Concrete mechanics, not reassurance.
   impact 4/5 · effort 1/5 · touches: home.html FAQ, pilot.html, terms.html

28. **TRUST-PROOF-OBJECTIONS-028 — Publish the guardrail list from a single config so the site and the agent cannot diverge.** Create `guardrails-config.js` alongside `pricing-config.js` holding the agent's hard rules (never claims to be human, never invents prices, never confirms an unverified integration, never gives regulated advice, never books outside approved calendar rules, always discloses AI). Render it on the homepage and pilot page, and use the same file as the source for the ElevenLabs prompt block. The differentiator here is the sync mechanism: one edit, both surfaces.
   impact 5/5 · effort 3/5 · touches: new guardrails-config.js, home.html, pilot.html, nevamis-engine/docs/agent-prompts/demo.md

29. **TRUST-PROOF-OBJECTIONS-029 — Publish the change-control promise: no prompt change without owner approval, with version history.** `nevamis-engine/docs/AGENT-CHANGE-CONTROL.md` and the pilot SOP's "tuning via version only" rule already exist internally. State publicly: every change to what your AI says is versioned, dated, and approved by you before it goes live, and the version history is in your report. Trades owners have been burned by software that silently changed; this is a specific, checkable counter-promise.
   impact 4/5 · effort 2/5 · touches: home.html #build-stack section, pilot.html, nevamis-engine/docs/AGENT-CHANGE-CONTROL.md

30. **TRUST-PROOF-OBJECTIONS-030 — Publish the named stack as borrowed credibility, since it is already public in `llms.txt`.** The homepage `#build-stack` section describes layers abstractly ("Business knowledge", "Call flow") but never names ElevenLabs, Twilio, or Cal.com, which `llms.txt` already discloses. Add a single honest line: "Voice by ElevenLabs, telephony by Twilio, booking by Cal.com. The configuration and the tuning are ours." A skeptical owner who googles those names finds three real companies, which is proof you did not build a toy.
   impact 4/5 · effort 1/5 · touches: home.html #build-stack, index.html

31. **TRUST-PROOF-OBJECTIONS-031 — Surface the uptime tripwire honestly rather than leaving it invisible.** `nevamis-engine/docs/UPTIME-MONITORING-DECISION.md` documents a 15-minute GitHub Actions probe of the health endpoint, the site, and the demo-number-to-agent assignment, and explicitly says it is "a tripwire, not an SLA." Publish a `/status.html` that says exactly that, with the last successful probe timestamp written by the workflow. Do not publish a percentage. A modest, correctly-caveated status page beats a bold uptime claim you cannot defend.
   impact 4/5 · effort 3/5 · touches: new status.html, nevamis-engine/.github/workflows/uptime.yml

32. **TRUST-PROOF-OBJECTIONS-032 — Complete the UptimeRobot owner action so the 24/7 claim has independent evidence.** CLM-01 ("Answers 24/7") is APPROVED on the reasoning that ElevenLabs is always-on, with the note "no uptime monitor yet; add one before stronger availability wording." Ten minutes of owner time creating a free UptimeRobot account with phone-call alerting converts the site's most-repeated claim from assertion to evidence, and unblocks "independently monitored" wording after thirty clean days.
   impact 4/5 · effort 1/5 · touches: owner action, docs/CLAIMS-LEDGER.md CLM-01

33. **TRUST-PROOF-OBJECTIONS-033 — Put the demo-line data notice on `demo.html`, above the call button.** `privacy.html` says "Demo-line audio and transcripts are used to run and improve the demo" and that retention is being reduced, but a caller pressing the big green CTA on `demo.html` never sees this. Add one line under the `(587) 413-0035` button: "Demo calls are recorded so we can improve the agent. Ask us to delete yours any time: Sales@nevamis.ca." Asking a privacy-conscious owner to test a phone system without telling them it records is the wrong first impression.
   impact 4/5 · effort 1/5 · touches: demo.html hero, home.html call-proof midcta

34. **TRUST-PROOF-OBJECTIONS-034 — Clarify that the demo agent is Nevamis's own receptionist, not a client's.** The live agent's first message is "Thank you for calling, this is Nevamis AI" and its prompt says it can speak to pricing and the pilot, but `demo.html` frames the call as "It is the product, on a phone number, right now" without saying that what a *client's* agent knows is different. Add: "This one is configured for our business. Yours is configured for yours: your services, your prices, your rules." Prevents the perfectly reasonable inference "so it only knows generic stuff."
   impact 3/5 · effort 1/5 · touches: demo.html hero copy

35. **TRUST-PROOF-OBJECTIONS-035 — Add a scripted three-line stump test with what a good answer looks like.** `demo.html` has three abstract "ways to push it" cards. Give the exact words to say: "Book me Thursday at 7am, actually make that Friday afternoon", "How much for a panel upgrade?", "I smell gas." Under each, one sentence on the correct behaviour. Removing the improvisation burden materially raises the share of prospects who actually place the test call.
   impact 4/5 · effort 1/5 · touches: demo.html "Three ways to push it"

36. **TRUST-PROOF-OBJECTIONS-036 — Add a post-call feedback capture so demo calls produce a lead and a signal.** Today `demo_phone_click` fires in `site.js` but nothing tells you what happened on the call or who called. Add a short `/demo-followup` block on `demo.html`: "Just called it? Tell us in one line how it did," with an optional email. It creates a warm inbound path from a prospect who has already engaged, and it accumulates the honest objection list that should drive the FAQ.
   impact 4/5 · effort 3/5 · touches: demo.html, site.js, nevamis-engine/src/app/api/interest

37. **TRUST-PROOF-OBJECTIONS-037 — Instrument objection engagement so the FAQ gets edited by evidence.** `site.js` tracks `demo_audio_play`, `demo_audio_complete`, and `roi_calculator_complete` but nothing about the fourteen `<details>` FAQ entries. Add a delegated `toggle` listener sending `faq_open` with the question text. Within a month you will know which three objections actually matter to Edmonton trades owners, and can promote those above the fold instead of guessing.
   impact 4/5 · effort 2/5 · touches: site.js, home.html #faq, docs/analytics-events.md

38. **TRUST-PROOF-OBJECTIONS-038 — Maintain `docs/OBJECTION-LOG.md` from real sales calls and fold it into the FAQ monthly.** After every strategy call, log the objection verbatim, the answer given, and whether it landed. Once a month, promote any objection seen three or more times into `home.html`'s FAQ using the owner's own words. The current fourteen questions are well-written guesses; this converts them into a record of what real prospects said, which is a compounding asset that costs two minutes per call.
   impact 5/5 · effort 1/5 · touches: docs/OBJECTION-LOG.md, home.html #faq

39. **TRUST-PROOF-OBJECTIONS-039 — Add the "I already have an answering service" objection, which the comparison table ignores.** The `#compare` table on `home.html:844` benchmarks against Voicemail and "DIY AI app" but not against the incumbent most Edmonton trades actually pay for. Add a fourth column or a dedicated FAQ: an answering service takes a message and charges per minute for a human who does not know your prices, your calendar, or your service area. Compare honestly on booking, cost, and 3am coverage, without inventing competitor pricing.
   impact 5/5 · effort 2/5 · touches: home.html:844 compare table, index.html

40. **TRUST-PROOF-OBJECTIONS-040 — Add the "my wife/office manager already answers the phone" objection with a non-insulting answer.** This is the most common real objection in owner-operated trades and there is no answer anywhere on the site. Frame Nevamis as coverage for the hours she does not work and the calls that arrive while she is on another line, not as a replacement for a family member. Getting this answer wrong loses the deal in one sentence, so it should be written down and identical on the page and in the agent prompt.
   impact 5/5 · effort 1/5 · touches: home.html FAQ, nevamis-engine/docs/agent-prompts/demo.md

41. **TRUST-PROOF-OBJECTIONS-041 — Add the "my customers are older and will hate a robot" objection.** Answer honestly rather than defensively: some callers will dislike it, which is why the agent says what it is in the first sentence, offers a human transfer, and can be configured to answer only after hours when the alternative is voicemail rather than a person. Adding the honest downside is what makes the rest of the answer credible.
   impact 4/5 · effort 1/5 · touches: home.html FAQ, index.html

42. **TRUST-PROOF-OBJECTIONS-042 — Add the "what if it books a job we cannot do" objection.** Owners fear a truck driving to a job the AI should have declined. The answer already exists in the product (service-area rules, approved job types, calendar rules, escalation) but is never stated as an answer to this fear. Write it as a FAQ entry and cross-link to the `#build-stack` "Business rules" layer, which currently reads as a feature rather than as a safeguard.
   impact 4/5 · effort 1/5 · touches: home.html FAQ, home.html #build-stack

43. **TRUST-PROOF-OBJECTIONS-043 — Add the liability objection and link it to the actual clause.** "Who is responsible if it says the wrong thing to my customer?" is unanswered on the site, while `terms.html` v2.0 has a liability cap and `nevamis-engine/docs/legal/ai-limitations-and-emergency-exclusions.md` and `client-responsibility-matrix.md` exist. Write a plain-language FAQ answer that points to the specific terms section, notes the approved-answers rule means the agent only says what you signed off, and does not overpromise. Note CLM-16 is still BLOCKED, so this must not add new legal language beyond what terms already say.
   impact 4/5 · effort 2/5 · touches: home.html FAQ, terms.html

44. **TRUST-PROOF-OBJECTIONS-044 — Rewrite the `#risk` section to state what the buyer actually risks.** `home.html:929` is headed "Try it without risk" and lists three benefits. A trades owner reads "no risk" as marketing. Replace with an honest ledger: what it costs you is roughly two hours (a 30 to 45 minute discovery call, an information review, an approval session, per `pilot.html`), plus setting one forwarding code you can undo in ten seconds. What it cannot cost you is money, because there is no card. Quantified honesty beats the word "risk-free", which is already on the banned list.
   impact 5/5 · effort 2/5 · touches: home.html:929-945, index.html

45. **TRUST-PROOF-OBJECTIONS-045 — Publish a redacted sample of the Day-7 pilot report so buyers see the artefact before they commit.** `nevamis-engine/docs/pilot/day7-pilot-report-template.md` is a genuinely good document: verified activity with named sources (Twilio, ElevenLabs, Calendar, transcripts), a "what failed and what we corrected" section, and an estimate built from the owner's own numbers labelled as an estimate. Publish it filled with clearly-fictional data as `/what-you-get-on-day-7.html`. The "what failed" section alone is a stronger trust signal than any testimonial.
   impact 5/5 · effort 3/5 · touches: new what-you-get-on-day-7.html, nevamis-engine/docs/pilot/day7-pilot-report-template.md, sitemap.xml

46. **TRUST-PROOF-OBJECTIONS-046 — Publish the pilot agreement itself, not just a description of it.** `pilot.html` describes the terms in prose; `nevamis-engine/docs/legal/pilot-agreement.md` is the real document. Once counsel review clears (CLM-16), link a plain PDF or HTML copy from the pilot page. Letting a prospect read the entire agreement before the strategy call removes the "what am I signing" hesitation and makes the call about fit rather than fine print.
   impact 4/5 · effort 2/5 · touches: pilot.html, nevamis-engine/docs/legal/pilot-agreement.md

47. **TRUST-PROOF-OBJECTIONS-047 — Add the proof-consent step to the pilot intake form so evidence is publishable by default.** `nevamis-engine/docs/pilot/pilot-intake-form.md` gathers configuration data. Add an explicit, separately-optional consent block: permission to publish (a) an anonymized results card, (b) one redacted call recording, (c) a named quote, each opt-in individually, each revocable. Ask on day one when goodwill is highest, not on day eight when you are also asking for money. Without this, pilot one produces zero publishable proof.
   impact 5/5 · effort 1/5 · touches: nevamis-engine/docs/pilot/pilot-intake-form.md, nevamis-engine/docs/pilot/pilot-sop.md

48. **TRUST-PROOF-OBJECTIONS-048 — Build the anonymized pilot-results card template now, so it ships the day pilot one ends.** A fixed component: industry, city, coverage mode, days live, calls handled, bookings made, one verbatim owner sentence, and a "verified from Twilio and calendar logs" provenance line. Build it as an empty rendered component driven by a `proof/results.json` that starts as an empty array, so the homepage placeholder from idea 026 automatically becomes real evidence with one commit.
   impact 5/5 · effort 3/5 · touches: new proof/results.json, home.html, assets/motion/site.css, site.js

49. **TRUST-PROOF-OBJECTIONS-049 — Write the review request script and the exact moment it is used.** The founding offer promises "permission to ask for an honest review" and the pilot SOP is explicit that the setup waiver is never gated on a positive review. Write the ninety-second script into `nevamis-engine/docs/pilot/pilot-end-teardown-checklist.md`: what is asked, when (after the decision, not before), and the sentence that makes clear a negative review still gets the waiver. An unscripted ask either does not happen or applies pressure that violates the stated rule.
   impact 4/5 · effort 1/5 · touches: nevamis-engine/docs/pilot/pilot-end-teardown-checklist.md

50. **TRUST-PROOF-OBJECTIONS-050 — Create the Google Business Profile before pilot one ends so the first review has somewhere to land.** Reviews requested with no destination die. Set up the service-area profile for Edmonton, verify it, and put the review link in the teardown checklist. This is also the highest-leverage trust surface for a local trades buyer, who will search "Nevamis AI Edmonton" after the call and currently finds no third-party presence at all.
   impact 5/5 · effort 2/5 · touches: Google Business Profile (owner action), nevamis-engine/docs/pilot/pilot-end-teardown-checklist.md

51. **TRUST-PROOF-OBJECTIONS-051 — Offer a reference call from pilot one to prospect two, and say so on the site once it is true.** Add a single line to the risk section, gated behind the reference actually existing: "Want to talk to a business already running this? Ask on the call." Do not add it before it is true. Build the tracking row now (`docs/OBJECTION-LOG.md` or a references file) so the moment consent exists, the line goes live and the ledger gets a row.
   impact 4/5 · effort 1/5 · touches: home.html #risk, docs/CLAIMS-LEDGER.md

52. **TRUST-PROOF-OBJECTIONS-052 — Add a fit-and-disqualification promise, and honour it.** `pilot.html` lists eligibility criteria defensively ("Legitimate businesses… in an industry we can safely support"). Reframe it as a commitment on `book.html`: "If Nevamis is not right for your call volume, we will tell you on the call and not sell you a pilot. Under roughly ten missed calls a month, the math usually does not work." Telling a prospect not to buy is the fastest credibility purchase available to a founder with no client list, and it protects you from a bad first pilot.
   impact 5/5 · effort 1/5 · touches: book.html, pilot.html

53. **TRUST-PROOF-OBJECTIONS-053 — Make the ROI calculator visibly a tool rather than a claim.** `home.html:767` collects missed calls, percent real, job value, and close rate, and CLM-13 already removed the fabricated 50-70% benchmark in favour of a buyer-entered assumption. Go further: print the arithmetic under the result ("10 × 60% × $400 × 50% = $1,200/month") and add "These are your numbers, not ours. We have published no benchmark because we do not have one yet." A calculator that shows its work cannot be accused of rigging it.
   impact 4/5 · effort 2/5 · touches: home.html #roi, site.js roi block (~line 280-310)

54. **TRUST-PROOF-OBJECTIONS-054 — Replace the founder photo with a sixty-second unscripted founder video.** `home.html:940` and `about.html:127` both use `assets/daren.jpg` with the line "A real Edmonton founder." For a solo operator with no client list, the founder *is* the trust asset, and a static headshot underuses it. One take, phone camera, no script: who you are, why you built it, what it does not do yet. Host it locally as a small MP4 with a poster frame so it costs nothing and loads fast.
   impact 5/5 · effort 2/5 · touches: home.html:939-942, about.html:126-129, assets/

55. **TRUST-PROOF-OBJECTIONS-055 — Put verifiable corporate identity on the site.** `nevamis-engine/docs/pilot/pilot-sop.md` records "Nevamis AI Inc., federal corp 1703910-7, Edmonton AB" and `terms.html` carries the GST/HST number. A corporation number is checkable in the federal registry in ten seconds. Add it to the footer or `about.html` alongside the legal name. Anonymous AI vendors are the category prospects are afraid of; a searchable registration is the cheapest possible separation from them.
   impact 4/5 · effort 1/5 · touches: about.html, terms.html, footer partial in all pages

56. **TRUST-PROOF-OBJECTIONS-056 — Publish the subprocessor list instead of the vague "trusted service providers".** `privacy.html` currently says data may be processed by "trusted service providers… in the United States and other countries" without naming any, while `llms.txt` already names the stack and `nevamis-engine/docs/EXTERNAL-SYSTEMS-REGISTER.md` has the full list. Name them: ElevenLabs, Twilio, Cal.com, Vercel, Turso, and what each one touches. Vagueness in a privacy policy reads as concealment to exactly the careful buyer you want.
   impact 4/5 · effort 2/5 · touches: privacy.html, nevamis-engine/docs/EXTERNAL-SYSTEMS-REGISTER.md

57. **TRUST-PROOF-OBJECTIONS-057 — Publish the support commitment you can actually keep.** `nevamis-engine/docs/SUPPORT-SLA.md` exists internally; the site promises only "Standard email support" and "Priority email support" on plan cards, which means nothing. State a real, deliberately conservative window (for example: business-day email response, and a named escalation path for a line that is not answering) and put it in the claims ledger with the SLA doc as evidence. An unambitious promise you always hit beats an aggressive one you sometimes miss.
   impact 4/5 · effort 2/5 · touches: pricing.html, home.html #build-stack, docs/CLAIMS-LEDGER.md, nevamis-engine/docs/SUPPORT-SLA.md

58. **TRUST-PROOF-OBJECTIONS-058 — Publish the exit path, because "no lock-in" is only credible with mechanics.** `nevamis-engine/docs/OFFBOARDING-SOP.md` describes teardown. Add a short public section on `pricing.html` or `terms.html`: cancel effective next renewal, forwarding cancelled from your handset, your number was never ported and needs nothing done to it, your call summaries exported on request within X days. Owners evaluate how hard it is to leave before they evaluate the product.
   impact 4/5 · effort 2/5 · touches: pricing.html, terms.html, nevamis-engine/docs/OFFBOARDING-SOP.md

59. **TRUST-PROOF-OBJECTIONS-059 — Add a "last verified" line to the claims-bearing pages, driven by the ledger.** `docs/CLAIMS-LEDGER.md` carries a Verified date per claim but no visitor ever sees it. Print a small footer line on `pricing.html`, `pilot.html`, and `demo.html`: "Pricing and pilot terms last verified 2026-07-27." It is a small signal with an outsized effect on a page full of numbers, and it creates an internal forcing function to actually re-verify.
   impact 3/5 · effort 2/5 · touches: pricing.html, pilot.html, demo.html, docs/CLAIMS-LEDGER.md, scripts/check-consistency.js

60. **TRUST-PROOF-OBJECTIONS-060 — Write and rehearse the "it broke on a client's line" incident script before it is needed.** `nevamis-engine/docs/CRISIS-COMMS-TEMPLATES.md` and `INCIDENT-RESPONSE.md` exist; what does not exist is the founder's spoken thirty-second version for the phone call to the owner within the hour. Draft it, rehearse it, and add the promise to `pilot.html`: if something goes wrong on your line, you hear it from Daren first, with what happened and what changed. The single largest trust event in this business's future is its first failure, and the response is the entire proof.
   impact 5/5 · effort 1/5 · touches: nevamis-engine/docs/CRISIS-COMMS-TEMPLATES.md, pilot.html
