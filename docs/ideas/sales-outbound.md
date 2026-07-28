# Sales & Outbound — 70 improvements toward client #1

Nevamis already has more sales *documentation* than most funded startups: `ai-assistant/outreach/` holds a README daily loop, a 22-row `prospect-tracker.csv`, six objection cards, an ROI one-pager, a day-8 conversion script, a trades FAQ and a referral offer; `SEVEN-DAY-SALES-SCHEDULE.md`, `WEEKLY-RHYTHM.md`, `FOUNDER-SCORECARD.md` and `PARTNER-CHANNEL.md` sit one level up; the site has `pilot.html`, `demo.html` and `book.html` doing the pre-sell. What it does not have is a list long enough to survive one week of dialing (22 rows ≈ 1.1 days at the 20/day target), verified phone numbers (21 of 22 `phone_verify` cells are blank), owner names for the scripts that open with "Hey [name]", a confirmed referral offer (still marked DRAFT), a consent ledger that makes CASL auditable, or any first-party proof that Edmonton trades actually miss calls. The 70 items below fix those gaps and then push on the parts of the funnel that convert: the demo line as the whole pitch, the supply-house and partner channels that reach owners in batches, a disciplined follow-up cadence, and a close that ends with forwarding switched on rather than "let me think about it." Nothing here requires a client, a testimonial, a metric, or a claim that does not exist today.

---

1. **SALES-OUTBOUND-001 — Verify every phone number in the tracker before the next calling block.** `outreach/prospect-tracker.csv` has 22 rows and exactly one populated `phone_verify` cell (The Gentlemen Pros). Every dial currently costs a Google-Maps detour mid-block, which is why 20 dials takes 90 minutes instead of 45. Sit once for 30 minutes, open each listing, paste the number into `phone_verify`, and add a `phone_verified_date` column so stale numbers can be re-checked at 6 months.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv

2. **SALES-OUTBOUND-002 — Get the list to 120 qualified rows before Monday.** At the playbook's 20 dials/day the current 22 rows are gone by Tuesday lunch, and running out mid-week is the single most common reason a solo founder stops calling. Use the Fit B trades already named in `edmonton-trades-starter-list.md` (roofing, garage door, appliance repair, locksmith, overhead door) and extend geography to St. Albert, Sherwood Park, Leduc, Spruce Grove and Beaumont, which the current list ignores entirely. 120 rows = six days of dials in the bank.
impact 5/5 · effort 2/5 · touches: ai-assistant/outreach/prospect-tracker.csv, edmonton-trades-starter-list.md

3. **SALES-OUTBOUND-003 — Add an `owner_first_name` column and populate it while building rows.** The cold-call opener in `SALES_PITCH.md` starts "Hey [name]" but the tracker has no name field, so every call opens generically and sounds like a telemarketer. Owner names are usually on the Google listing, the website's About page, or the Yelp response signature — 15 seconds per row while you are already there. "Hey Carissa, is this Little Plumber Girl?" survives the first three seconds; "Hi, is this the owner?" does not.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv

4. **SALES-OUTBOUND-004 — Flag businesses that advertise 24/7 but are owner-operated.** Add a `claims_24_7` column and set it from the Google listing hours or website banner ("24/7 emergency service"). A two-truck shop promising round-the-clock service and sending you to voicemail at 8pm has publicly committed to the exact promise Nevamis keeps — that is the sharpest opening line available and it uses only what they published themselves. `24/7 Victory Plumbing And Heating` is already in the tracker as an obvious first test.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv

5. **SALES-OUTBOUND-005 — Run a logged after-hours answer test and turn it into first-party proof.** One evening, call 12 Edmonton plumbers/electricians at 18:40 as a homeowner with a real question, and log for each: answered live, voicemail, rang out, or answering service. That gives an honest, self-measured, citable line — "I called twelve Edmonton electricians after five last Tuesday; three answered" — with no invented statistic and no third-party source to defend. Store the raw log at `ai-assistant/outreach/AFTER-HOURS-TEST-2026-XX.md` with dates and times so it is auditable.
impact 5/5 · effort 2/5 · touches: new ai-assistant/outreach/AFTER-HOURS-TEST-*.md, cold-call opener

6. **SALES-OUTBOUND-006 — Make the mystery-shop a logged artefact, not a memory.** Script 9a opens with "I called you yesterday at 5:40 and got voicemail," which is only usable if it is true and specific. Record the shop attempt in the tracker `notes` as `shopped 2026-08-04 17:40, asked re: panel upgrade, voicemail` and set `last_touch_date`. It keeps the strongest opener honest and lets you reconstruct the conversation weeks later.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv, outreach/README.md daily loop

7. **SALES-OUTBOUND-007 — Add a `seasonal_trigger` column and dial to the season.** HVAC converts hardest in the first cold snap (mid-September to November in Edmonton), plumbing and restoration in spring melt and the first deep freeze, roofing after hail. Tag each row so the morning list build can be sorted by what is urgent this month rather than alphabetically. The same call lands completely differently when the owner is drowning.
impact 3/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv

8. **SALES-OUTBOUND-008 — Open a restoration sub-segment as the highest-urgency wedge.** Water/fire restoration firms advertise 24/7 emergency response and are dispatched by insurers and property managers who will simply call the next vendor if nobody answers. Add 20 Edmonton restoration companies as trade=`restoration` and give them their own opening line about after-hours dispatch calls, not "missed leads." They are already named as a core vertical in the business brief but appear zero times in the tracker.
impact 4/5 · effort 2/5 · touches: ai-assistant/outreach/prospect-tracker.csv

9. **SALES-OUTBOUND-009 — Prioritise listings whose only call-to-action is a phone number.** On Google Maps, a business with no "Book online" action and no website contact form takes 100% of its intake by phone — which means 100% of its missed calls are lost jobs with no fallback. Add an `intake_channels` column (phone / form / booking link) and dial phone-only businesses first. It is a free, observable qualification signal that correlates directly with pain.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv

10. **SALES-OUTBOUND-010 — Write a disqualification rule that fires automatically.** `outreach/README.md` says skip anyone with live 24/7 answering, but nothing operationalises it once dialing starts. Rule: if a human answers within three rings on two separate attempts in different time blocks, set `do_not_contact_reason = "live reception confirmed 2x, <dates>"` and stop. Protecting the list from unqualified rows is what keeps the 100-dial target from becoming 100 wasted dials.
impact 3/5 · effort 1/5 · touches: ai-assistant/outreach/README.md, prospect-tracker.csv

11. **SALES-OUTBOUND-011 — Cut the opener to twelve seconds and print it above the desk.** The `SALES_PITCH.md` hook is three sentences long; on a cold trades call you have about one. Test this: "Daren from Nevamis here in Edmonton — quick one. Do you ever lose calls after five when you're on a job?" Everything else (who you are, what it is, the demo line) is earned by the answer, and printing one card removes the reading-while-talking stumble that kills the first three seconds.
impact 4/5 · effort 1/5 · touches: ai-assistant/SALES_PITCH.md, printed desk card

12. **SALES-OUTBOUND-012 — Add an `opening_used` column so opener testing is measurable.** Right now you cannot answer "which opening works" because nothing records it, yet `outreach/README.md`'s Friday review explicitly asks the question. Record a short code per dial (`A-missed`, `B-247`, `C-shopped`) and count demo-line calls generated per code at week's end. Fifty dials per variant is enough to see a real gap in a funnel this narrow.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv, Friday review in README.md

13. **SALES-OUTBOUND-013 — Record your own outbound calls and review three every Friday.** Alberta is a one-party-consent province, so recording a call you are on is lawful; use it on yourself only, never publish it, and never use a prospect's voice in marketing. Fifteen minutes of listening back will show you the two habits costing you conversations (talking over the pause, pitching before qualifying) faster than any book. Add "listened to 3 recordings" as a checkbox in the Friday block of `WEEKLY-RHYTHM.md`.
impact 4/5 · effort 1/5 · touches: ai-assistant/WEEKLY-RHYTHM.md, personal call recording

14. **SALES-OUTBOUND-014 — Rewrite the voicemail drop so it ends on the demo number, twice.** A voicemail that ends on "call me back" gets nothing; one that ends on "call 587-413-0035 and talk to it yourself" costs the prospect nothing and produces a tracked demo-line call. Say the number slowly, twice, and give a reason to dial it ("it's an AI answering — try to trip it up"). Store the exact 20-second wording in `outreach/` beside the objection cards so it is identical every time.
impact 4/5 · effort 1/5 · touches: new ai-assistant/outreach/VOICEMAIL-DROP.md

15. **SALES-OUTBOUND-015 — Script the gatekeeper and the spouse-answering-the-cell case.** Small trades numbers are often answered by a partner, an office admin, or a kid. Write three lines: who you are, why the owner specifically wants this, and a request for the best time rather than a transfer ("when's he actually between jobs — before seven?"). Log the answer in a `best_call_window` column so the second attempt is timed, not random.
impact 3/5 · effort 1/5 · touches: ai-assistant/outreach/OBJECTION-CARDS.md, prospect-tracker.csv

16. **SALES-OUTBOUND-016 — Answer "how did you get my number?" in one honest sentence, pre-written.** It comes up on cold calls and hesitating on it kills trust instantly. "Your number's on your Google listing — I'm calling businesses in Edmonton one at a time, no list bought, and if you'd rather I didn't call again just say so and you're off my list for good." Then actually honour it in `do_not_contact_reason` the same minute.
impact 3/5 · effort 1/5 · touches: ai-assistant/outreach/OBJECTION-CARDS.md

17. **SALES-OUTBOUND-017 — Add the missing "we're already booked out three weeks" objection card.** This is the most common real trades response and it is absent from all six cards in `OBJECTION-CARDS.md`. Honest rebuttal: "Then you're the shop that should care most — every call you can't take is a customer who now knows your competitor's name. This screens them, books the ones worth booking three weeks out, and tells the rest honestly instead of leaving them on voicemail." It reframes capacity from an objection into the qualification use case.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/OBJECTION-CARDS.md

18. **SALES-OUTBOUND-018 — Add the "my wife/office manager answers the phone" objection card.** Second most common in owner-operated trades and also missing. Honest answer: "Great — then this isn't replacing her, it's covering the hours she isn't at the desk and the calls that come in while she's already on the line. She keeps every call she wants; the AI catches the ones that would've rung out." Never suggest replacing a family member's job — that objection turns hostile fast.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/OBJECTION-CARDS.md

19. **SALES-OUTBOUND-019 — Add the "I tried an answering service and it was terrible" card.** Trades owners who churned off Answering Service X are the warmest possible prospects and the hardest to re-open. Ask what specifically went wrong (message-taking only, offshore accents, per-minute surprise bills), then differentiate on the two things you can prove on the demo line: it books into the calendar, and you hear every recording. Log their answer verbatim — it is free product research.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/OBJECTION-CARDS.md

20. **SALES-OUTBOUND-020 — Write the CASL channel matrix as a one-page rule sheet.** The playbook, README and PARTNER-CHANNEL each state parts of the rule (cold calls fine, cold email not, no AI dialers under CRTC ADAD rules), but no single sheet lists channel × permitted / not permitted / condition. Include the CASL identification requirements every commercial email must carry (sender name, mailing address, phone, unsubscribe) — those apply to one-to-one sales email too, not just campaigns. One accidental cold blast is a five-figure risk against $0 MRR.
impact 5/5 · effort 2/5 · touches: new ai-assistant/outreach/CASL-CHANNEL-MATRIX.md

21. **SALES-OUTBOUND-021 — Add consent columns to the tracker so CASL is auditable, not remembered.** Three fields: `consent_basis` (implied-business-relationship / express / requested-info), `consent_date`, `consent_evidence` ("asked me to email the ROI sheet on the 12:40 call"). Without them, the answer to a complaint is your memory. With them, every email you send has a dated, one-line justification sitting next to the address.
impact 5/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv, CASL matrix

22. **SALES-OUTBOUND-022 — Set the three-dial rule with rotating time windows.** Dialing the same number at the same hour three times reaches the same voicemail three times. Rule: attempt 1 at 12:00–13:00, attempt 2 after 17:00 on a different weekday, attempt 3 at 07:30 (trades owners are in the truck early). After three, park for 90 days per the existing rule and write the dated reason.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/README.md daily loop

23. **SALES-OUTBOUND-023 — Make the demo agent capture which business is calling and text you the name.** Right now a prospect calls (587) 413-0035 and you get a lead alert without knowing which of yesterday's twenty voicemails just dialed. Have Ava ask "what's the name of your business?" early and include it in the SMS to Daren, so the tracker row can be matched and called back inside five minutes. Attribution turns the demo line from a nice touch into the top of a measurable funnel.
impact 5/5 · effort 3/5 · touches: ElevenLabs demo agent prompt, escalation SMS, prospect-tracker.csv `demo_line_call`

24. **SALES-OUTBOUND-024 — Adopt a five-minute callback rule on every demo-line call.** A prospect who just dialed your AI is at peak curiosity for about ten minutes. Give the demo-line alert a distinct notification sound on your phone, and treat it as an interrupt that outranks any block in `SEVEN-DAY-SALES-SCHEDULE.md` except a live client call. "You just called my AI — what did you think?" is the easiest conversation you will have all week.
impact 5/5 · effort 1/5 · touches: ai-assistant/SEVEN-DAY-SALES-SCHEDULE.md, phone notification setup

25. **SALES-OUTBOUND-025 — Do the three-way demo on the call instead of asking them to call later.** "Put me on speaker for thirty seconds" and dial (587) 413-0035 while they listen, or ask them to conference it. Deferring the demo to "when you get a minute" loses most of them; `SALES_PITCH.md` already says the demo IS the sale, so remove the delay between the pitch and the proof. Practice the mechanics on your own handset first so the fumbling does not become the demo.
impact 5/5 · effort 1/5 · touches: ai-assistant/SALES_PITCH.md section 3, call mechanics

26. **SALES-OUTBOUND-026 — Give them the stump list out loud, in their trade's language.** `demo.html` lists three challenges (book something awkward, change your mind mid-call, ask for a price it shouldn't give). Say those on the phone before they dial: "Ask it for a price on a panel upgrade — it should refuse and book an estimate instead. If it makes a number up, hang up on me." Inviting the failure test is what separates this from every AI pitch they have ignored.
impact 4/5 · effort 1/5 · touches: nevamis-site/demo.html copy, SALES_PITCH.md

27. **SALES-OUTBOUND-027 — Build a second demo persona for HVAC before furnace season.** The homepage proof call and `demo.html` transcript are both electrical (Cedarview Electric). A furnace-out call in November is a different script, different urgency, different price question — and the playbook already says the demo must match the vertical. One extra ElevenLabs agent config plus a swapped example-call block on the site makes the HVAC pitch land as hard as the electrical one.
impact 4/5 · effort 3/5 · touches: ElevenLabs agents, nevamis-site/demo.html, home.html proof section

28. **SALES-OUTBOUND-028 — Pre-warm every booked discovery call with a demo-line nudge.** The evening before a scheduled call, send the (already-consented) prospect one line: "Before tomorrow, call 587-413-0035 and try to break it — that's the whole product." A prospect who has heard it arrives at the discovery call past the "does it work" question and straight to "what does it cost for me." Add it as a step in the follow-up block of `SEVEN-DAY-SALES-SCHEDULE.md`.
impact 4/5 · effort 1/5 · touches: ai-assistant/SEVEN-DAY-SALES-SCHEDULE.md follow-up block

29. **SALES-OUTBOUND-029 — Print 250 cards whose entire front is the demo number.** Not a business card with a logo and a title — a card that reads "Call this number. It's an AI receptionist. It'll book you an appointment." with (587) 413-0035 large, nevamis.ca small. It survives being shoved in a work-pant pocket and it converts on curiosity days later without you present. Cost is under $60 and it is the only physical asset the supply-house and job-site tactics need.
impact 4/5 · effort 1/5 · touches: print collateral, demo line

30. **SALES-OUTBOUND-030 — Put the demo number on your own vehicle.** A single rear-window decal reading "Missed calls cost jobs — call 587-413-0035" turns every drive through an industrial park into passive distribution to exactly the audience sitting in traffic beside you in a work van. Cheap, one-time, and it produces inbound demo-line calls you can attribute by asking. Only do this once idea 023 is in place so you know where the call came from.
impact 3/5 · effort 2/5 · touches: vehicle decal, demo line attribution

31. **SALES-OUTBOUND-031 — Work the supply-house counter at 6:30–8:00am.** Emco, Wolseley, Bartle & Gibson and Nedco counters are full of exactly your buyer, in person, before their day starts — a window the current schedule leaves completely empty. Do not pitch in the queue; buy a coffee, listen, and hand a card to anyone complaining about their morning. Two mornings a week costs nothing but the drive.
impact 4/5 · effort 2/5 · touches: ai-assistant/PARTNER-CHANNEL.md, SEVEN-DAY-SALES-SCHEDULE.md

32. **SALES-OUTBOUND-032 — Ask each branch manager for a countertop card holder and restock it weekly.** `PARTNER-CHANNEL.md` already says ask permission and never work around the manager; the missing piece is the physical ask. A $4 acrylic holder with the demo-number cards beside the pen cup gets seen by fifty contractors a week per branch. Offer the manager the same thing in reverse — you will send clients their way — so it is reciprocity, not a favour.
impact 4/5 · effort 2/5 · touches: ai-assistant/PARTNER-CHANNEL.md, print collateral

33. **SALES-OUTBOUND-033 — Write a job-site approach rule that respects the trade.** Interrupting a guy on a ladder is how you get remembered badly. Rule: only approach at the truck, only while they are loading or on a break, open with "you the owner or does he answer the phone?", and leave within 60 seconds with a card if the answer is no. Write the 60-second version into the outreach pack so it is repeatable instead of improvised.
impact 3/5 · effort 1/5 · touches: new ai-assistant/outreach/FIELD-APPROACH.md

34. **SALES-OUTBOUND-034 — Log van decals seen in the wild straight into the tracker.** Every Edmonton parking lot is a free prospect list of businesses too small to be on page one of Maps but big enough to have a wrapped van. Voice-memo the business name at the moment you see it, and add rows at the next list-build block with `source=field_sighting`. It also gives you an honest, memorable opener: "I saw your van at the Home Depot on Calgary Trail Tuesday."
impact 3/5 · effort 1/5 · touches: ai-assistant/outreach/prospect-tracker.csv `source`

35. **SALES-OUTBOUND-035 — Build the 10-minute association talk that PARTNER-CHANNEL.md promises.** Merit Contractors, the Edmonton Construction Association and local BNI chapters take short member talks; the doc names the tactic but no talk exists. Structure: 90 seconds on the after-hours answer test from idea 005, 3 minutes of the ROI one-pager math filled in live by a volunteer from the room, 3 minutes calling (587) 413-0035 on speaker, 2 minutes on the free pilot. Deliver it four times and it becomes the highest-leverage hour in the business.
impact 5/5 · effort 3/5 · touches: new ai-assistant/outreach/ASSOCIATION-TALK.md, PARTNER-CHANNEL.md

36. **SALES-OUTBOUND-036 — Visit four BNI chapters as a guest before committing to one.** Visitors can usually attend two meetings free, and each visit puts you in a room of 25 local business owners with a mandated 60-second intro slot. Use the twelve-second opener plus "call this number, it's an AI" as the 60 seconds. Only pay for membership in the chapter that actually has trades in the seats — a chapter of realtors and mortgage brokers is a different pitch entirely.
impact 4/5 · effort 3/5 · touches: PARTNER-CHANNEL.md, weekly schedule

37. **SALES-OUTBOUND-037 — Book a booth-free presence at an Edmonton home/renovation show.** Contractors exhibit; you walk the floor. Every booth is a qualified prospect standing still, and the exhibitor is by definition away from their phone all weekend — which is the pitch, verbatim. Go on the slowest hour of the last day when booth staff are bored and receptive, and lead with the demo number card.
impact 4/5 · effort 2/5 · touches: field tactics, print collateral

38. **SALES-OUTBOUND-038 — Build a 15-firm Edmonton bookkeeper/accountant list as a distinct channel.** `PARTNER-CHANNEL.md` ranks bookkeepers first but names no firms and provides no list. Search "bookkeeper for contractors Edmonton", capture firm, principal, phone, and add them to the tracker with `trade=partner_bookkeeper` so partner outreach shows up in the same funnel counts as direct dials. They hear "I can't hire a receptionist" at every year-end.
impact 4/5 · effort 2/5 · touches: ai-assistant/outreach/prospect-tracker.csv, PARTNER-CHANNEL.md

39. **SALES-OUTBOUND-039 — Add trade-adjacent vendors who already sell to your buyer.** Vehicle-wrap shops, uniform/workwear suppliers, fleet mechanics, tool repair depots and safety-training providers all have trades customer lists and no competing product. The pitch is the 60-second partner conversation already written in `PARTNER-CHANNEL.md`, plus genuine reciprocity — you will need a wrap shop and a fleet mechanic eventually anyway. Rank them below bookkeepers but above cold association work.
impact 3/5 · effort 2/5 · touches: ai-assistant/PARTNER-CHANNEL.md, prospect-tracker.csv

40. **SALES-OUTBOUND-040 — Keep a reciprocity ledger so partner relationships survive.** Add `ai-assistant/outreach/PARTNER-LEDGER.md` with one row per partner: what they sent you (dated), what you sent them (dated), last contact. A referral partnership dies the moment it becomes one-directional, and you will not remember who you owe once there are ten. Review it in the Friday block alongside the tracker sums.
impact 3/5 · effort 1/5 · touches: new ai-assistant/outreach/PARTNER-LEDGER.md, WEEKLY-RHYTHM.md

41. **SALES-OUTBOUND-041 — Get the referral offer out of DRAFT this week.** `REFERRAL-OFFER.md` is marked "DRAFT until Daren confirms", which means script 9e's "a month half price for both" cannot honestly be said on a call today — and the playbook mandates a referral ask in every conversation. Confirm or amend the mechanics (50% credit on one monthly fee, not setup, not overage, one credit per referred business), stamp it approved with a date, and remove the DRAFT banner. An unconfirmed offer is worse than no offer because it invites improvisation.
impact 5/5 · effort 1/5 · touches: ai-assistant/outreach/REFERRAL-OFFER.md

42. **SALES-OUTBOUND-042 — Make the referral ask specific instead of open-ended.** "Know anyone who'd want this?" produces nothing; "who's the plumber you call when you're double-booked?" produces a name and a phone number. Write three trade-specific prompts into `REFERRAL-OFFER.md` and use them at the end of every conversation regardless of outcome, including the ones that ended in no. A no who gives you a name is a better outcome than a maybe who gives you nothing.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/REFERRAL-OFFER.md

43. **SALES-OUTBOUND-043 — Produce a forwardable partner one-pager distinct from the ROI sheet.** `ROI-ONE-PAGER.md` is built for a buyer filling in their own numbers; a bookkeeper needs something different — what Nevamis does in three lines, who it suits, who it does not, the demo number, and the explicit note that the partner never quotes prices or makes promises. One page, PDF, emailable the moment a partner asks (which makes the email CASL-clean because they requested it).
impact 4/5 · effort 2/5 · touches: new ai-assistant/outreach/PARTNER-ONE-PAGER.md, PARTNER-CHANNEL.md

44. **SALES-OUTBOUND-044 — Write the post-call recap email template with the CASL identification block built in.** After any call where they asked for information, the email must carry your name, physical mailing address, phone, and an unsubscribe mechanism — that is a legal requirement, not a best practice, and it is easy to forget on a one-to-one send. Build the template once with the block in the signature, subject line "the numbers you asked about — Nevamis", and body: their own figures repeated back, the demo number, the pilot terms, one clear next step.
impact 5/5 · effort 2/5 · touches: new ai-assistant/outreach/EMAIL-TEMPLATES.md, CASL matrix

45. **SALES-OUTBOUND-045 — Write the pilot proposal email as a fixed template that renders the canonical terms.** Pilot terms live in `nevamis-site/pricing-config.js` (7 days, no card, 60 connected AI minutes or 30 calls, one line/flow/calendar, one revision, ends day eight). Copy them into the template verbatim once, and never retype them on a call — improvised terms are how a pilot becomes an argument. Include the go-live date, who sets forwarding, and what lands in their inbox each morning.
impact 5/5 · effort 2/5 · touches: EMAIL-TEMPLATES.md, nevamis-site/pricing-config.js

46. **SALES-OUTBOUND-046 — Standardise the daily pilot log email subject line.** During a live pilot the owner should get one email each morning with a subject that reads as a scoreboard: "Prairie Mechanical — 4 calls answered, 2 booked (Tue)". `CALL-LOG-SAMPLE.md` already defines the body; the subject is what gets opened on a phone at 6:50am between jobs. Seven of those in a row is the entire day-8 close, pre-delivered.
impact 4/5 · effort 1/5 · touches: ai-assistant/outreach/CALL-LOG-SAMPLE.md, pilot delivery

47. **SALES-OUTBOUND-047 — Write the SMS rule: never first, only after they text you.** SMS to a business is a commercial electronic message under CASL just like email, and a solo founder texting cold is a genuine legal exposure. Rule: you may text a prospect only after they have texted you or explicitly asked you to, the consent is logged per idea 021, and every text identifies you by name and business. Put it in the CASL matrix in bold — it is the rule most likely to get broken in a hurry.
impact 5/5 · effort 1/5 · touches: ai-assistant/outreach/CASL-CHANNEL-MATRIX.md

48. **SALES-OUTBOUND-048 — Define a named five-touch cadence with day offsets and stop rules.** Today the follow-up rule is "don't chase more than twice" in `SALES_PITCH.md` and "park after two voicemails" in the README — close, but not the same rule. Write one: T0 dial, T+1 morning callback, T+4 second dial in a different window, T+10 value touch (send the thing they asked for, if consented), T+21 break-up call, then park 90 days with a dated reason. One cadence, written down, beats three half-remembered ones.
impact 5/5 · effort 2/5 · touches: ai-assistant/outreach/README.md, SALES_PITCH.md section 9

49. **SALES-OUTBOUND-049 — Write the break-up call script.** The last touch converts more than any middle touch because it removes pressure: "I'm going to stop calling — you're clearly covered. If missed calls ever start costing you, the number's 587-413-0035 and it answers 24/7. Anything you'd want me to have done differently?" It ends the relationship cleanly, harvests a reason for the tracker, and occasionally reopens the deal on the spot.
impact 4/5 · effort 1/5 · touches: new/updated ai-assistant/outreach/ cadence doc

50. **SALES-OUTBOUND-050 — Make the 90-day park list resurface automatically.** `WEEKLY-RHYTHM.md` says "un-park rows whose 90 days expired" but nothing surfaces them, so it depends on scanning a growing CSV by eye. Add a `park_until` date column and sort by it in the Monday block, or filter the CSV in the ops leads view. Parked prospects who proved the problem once are the warmest cold list you will ever have.
impact 3/5 · effort 2/5 · touches: prospect-tracker.csv, WEEKLY-RHYTHM.md, nevamis-engine ops/leads

51. **SALES-OUTBOUND-051 — Reconcile the CSV tracker with the engine's ops/leads so there is one pipeline of record.** `nevamis-engine/src/app/ops/leads` and `ops/interest` already exist and the Monday rhythm asks you to triage website interest there, while dials live in a CSV — two systems, two truths, and no single funnel count. Decide one is canonical (the CSV until volume justifies otherwise), and either import website-interest rows into the CSV each Monday or import the CSV into ops/leads. The scorecard's funnel ratios are meaningless while the numerator and denominator live in different files.
impact 4/5 · effort 3/5 · touches: prospect-tracker.csv, nevamis-engine ops/leads, ops/interest

52. **SALES-OUTBOUND-052 — Define the six pipeline stages explicitly and use the same words everywhere.** The tracker has `status`, the scorecard counts "conversations reached / demo-line calls / pilots offered / pilots started / converted", and the engine has its own lead states. Write the six stages once (to_call → attempted → conversation → demo_called → pilot_offered → pilot_live → paid), with a one-line entry criterion each, and make the CSV `status` values match the scorecard rows exactly. Then Friday's numbers take two minutes instead of twenty and mean the same thing every week.
impact 4/5 · effort 2/5 · touches: prospect-tracker.csv, FOUNDER-SCORECARD.md, outreach/README.md

53. **SALES-OUTBOUND-053 — Enforce the "no row without a next_action" rule with a Wednesday audit.** The three follow-up columns exist and `WEEKLY-RHYTHM.md` already schedules a Wednesday pipeline-truth pass, but nothing checks it. Add a five-line script (or a spreadsheet filter) that lists every row with a blank `next_action` and a non-terminal `status`, and clear it to zero before the Wednesday block ends. Deals do not die from rejection; they die from drift.
impact 4/5 · effort 2/5 · touches: prospect-tracker.csv, nevamis-site/scripts/ (small node checker), WEEKLY-RHYTHM.md

54. **SALES-OUTBOUND-054 — Adopt a daily "three by three" discipline: three new rows, three callbacks, three cold dials before anything else.** The full 20-dial block collapses on a bad day, and a collapsed day becomes a collapsed week. A nine-action floor takes 25 minutes and guarantees the funnel never fully stops during a pilot build or a client emergency. Track it as a simple daily tick in the scorecard rather than as a separate system.
impact 4/5 · effort 1/5 · touches: ai-assistant/SEVEN-DAY-SALES-SCHEDULE.md, FOUNDER-SCORECARD.md

55. **SALES-OUTBOUND-055 — Put a hard clock on the discovery call and publish the agenda in the first 20 seconds.** `book.html` promises fifteen minutes and three things; the call itself has no written minute-by-minute structure the way `DAY8-REVIEW-SCRIPT.md` does. Write it: 0–2 agenda + permission, 2–7 the four discovery questions, 7–10 their ROI math out loud, 10–13 pilot offer and terms, 13–15 book the build slot. Founders who ramble past fifteen minutes teach the prospect that their time is not respected.
impact 5/5 · effort 2/5 · touches: new ai-assistant/outreach/DISCOVERY-SCRIPT.md, nevamis-site/book.html

56. **SALES-OUTBOUND-056 — Add three pre-call questions to the book.html prefill so discovery starts warm.** `book.html` already has a `#bkPrefill` block rewriting the Cal.com URL with prefill params. Add three optional fields — trade, roughly how many calls a week go unanswered, and what a typical job is worth — so you walk into the call already holding the numbers the ROI math needs. Keep them optional so they never block a booking.
impact 4/5 · effort 2/5 · touches: nevamis-site/book.html (#bkPrefill), Cal.com booking questions

57. **SALES-OUTBOUND-057 — Make the prospect say their own ROI numbers out loud and then email them back.** `ROI-ONE-PAGER.md` is built around three blanks the owner fills in (job value, calls missed, close rate). Numbers the prospect speaks are numbers they defend; numbers you present are numbers they argue with. On the call, write their three figures down, read the monthly total back, and — if they asked for it — email exactly those figures with the estimate label intact.
impact 5/5 · effort 1/5 · touches: ai-assistant/outreach/ROI-ONE-PAGER.md, discovery script

58. **SALES-OUTBOUND-058 — Disqualify out loud using the "who should NOT buy this" answer.** `VERTICAL-FAQ-TRADES.md` item 7 already says a shop answering live all day or taking two calls a week should not buy. Saying that unprompted on the discovery call is the single most trust-building move available to a founder with zero clients, and it saves you from a month-two churn. It also makes the yes that follows structurally stronger, because you gave them a real exit.
impact 5/5 · effort 1/5 · touches: ai-assistant/outreach/VERTICAL-FAQ-TRADES.md, discovery script

59. **SALES-OUTBOUND-059 — Collect the full intake during the discovery call, not after it.** Phase B of `PLAYBOOK.md` lists the intake fields (hours, services, price ranges, service area, FAQs, booking method, transfer number, emergency definition, forbidden topics) but the "send them a form" step is where deals stall for a week. Ask them live, type as they talk, and confirm by email. Same-day build is a competitive advantage no national answering service can match.
impact 5/5 · effort 2/5 · touches: nevamis-engine ops/onboarding, PLAYBOOK.md phase B/D

60. **SALES-OUTBOUND-060 — Book the go-live slot on the discovery call while you are still on it.** Not "I'll send you some times" — a specific 45-minute window in the next 72 hours, in their calendar, with what they need to have ready (carrier login or the phone, the calendar they use, the after-hours number). An unbooked pilot has a much lower survival rate than a booked one, and the booking is the real close.
impact 5/5 · effort 1/5 · touches: discovery script, Cal.com

61. **SALES-OUTBOUND-061 — Build the Alberta carrier call-forwarding cheat sheet before the first pilot.** `PLAYBOOK.md` phase D assumes "we provide exact star-codes per carrier" but no such sheet exists in either repo. Write one page covering Telus, Rogers, Bell, Shaw/Rogers business, Koodo, Fido and Virgin: conditional-forward-on-no-answer code, forward-on-busy code, cancel code, and the note about ring count. Fumbling forwarding on the go-live call is the most preventable way to lose a pilot in its first hour.
impact 5/5 · effort 2/5 · touches: new ai-assistant/outreach/CARRIER-FORWARDING-CODES.md, PLAYBOOK.md phase D

62. **SALES-OUTBOUND-062 — Make the pilot agreement a one-page sign-on-the-call document.** `nevamis-site/docs/SERVICE-AGREEMENT-DRAFT-2026-07-27.md` and `service-order-template.md` exist but are built for the paid relationship. The pilot needs its own single page: the caps from `pricing-config.js`, recording and AI-disclosure consent, who owns the call data, day-eight termination, and no payment obligation. Signing something small on the call converts intent into commitment without introducing a payment step.
impact 4/5 · effort 3/5 · touches: nevamis-site/docs/SERVICE-AGREEMENT-DRAFT-*.md, pricing-config.js

63. **SALES-OUTBOUND-063 — Use the founding-five scarcity honestly, with a real count you maintain.** `pricing-config.js` sets `foundingClient.spots: 5` and the honest reason (founder-led onboarding caps concurrent builds). Say the actual number remaining on every close and keep it accurate in the config — if it is still five in December, say five. Fake scarcity is the fastest way to become the AI vendor they warn each other about at the supply counter.
impact 4/5 · effort 1/5 · touches: nevamis-site/pricing-config.js, pilot.html founding note, close script

64. **SALES-OUTBOUND-064 — Prepare the day-8 call the day before with a printed one-page results sheet.** `DAY8-REVIEW-SCRIPT.md` says bring the call-log CSV export; a raw CSV is the wrong artefact for a decision. Build a one-page summary: calls answered (after-hours vs business hours), calendar-confirmed bookings only, messages that became work, minutes used against the 60-minute cap, and the single best call queued to play. Their own week on one page is the close; the script's job is only to stay out of its way.
impact 5/5 · effort 2/5 · touches: ai-assistant/outreach/DAY8-REVIEW-SCRIPT.md, nevamis-engine ops/day8

65. **SALES-OUTBOUND-065 — Ask for annual prepay at the moment of conversion, not later.** `pricing-config.js` already defines it: ten months charged, twelve covered ($2,490 / $4,490 / $8,490). For a business with $0 in the bank, one annual Growth prepay is $4,490 of cash and a client who cannot casually churn in month two. Offer it as the second option after the monthly price, framed as their choice, never as a condition of the founding-client waiver.
impact 4/5 · effort 1/5 · touches: DAY8-REVIEW-SCRIPT.md section 3, pricing-config.js

66. **SALES-OUTBOUND-066 — Keep a verbatim loss log and read it monthly.** `DAY8-REVIEW-SCRIPT.md` already asks "what would have made this a yes?" for pilot losses; extend it to every stage — voicemail-only prospects, discovery no-shows, pilot declines. One file, one line per loss, their exact words, dated. Ten entries will tell you whether the problem is the list, the opener, the demo, or the price, and that is the only way a solo founder debugs a funnel with no volume.
impact 4/5 · effort 1/5 · touches: new ai-assistant/outreach/LOSS-LOG.md, DAY8-REVIEW-SCRIPT.md

67. **SALES-OUTBOUND-067 — Fill the scorecard daily in five lines instead of weekly in twenty minutes.** `FOUNDER-SCORECARD.md` is a Friday exercise, which means Friday reconstructs the week from memory and the blanks that "mean I didn't track it" get filled with guesses. Keep a five-field daily tally (dials, conversations, demo-line calls, pilots offered, referral asks) at the bottom of the tracker or on paper, and let Friday just sum it. Accurate small numbers beat impressive remembered ones.
impact 4/5 · effort 1/5 · touches: ai-assistant/FOUNDER-SCORECARD.md, WEEKLY-RHYTHM.md

68. **SALES-OUTBOUND-068 — Write the ratio-diagnosis rule so the Friday review produces one decision.** The scorecard collects five conversion ratios but says nothing about what each one means when it is low. Rule sheet: dial→conversation low = wrong times or wrong list; conversation→demo-call low = the opener or the ask; demo-call→pilot-offered low = you are not offering; pilot-offered→started low = friction in forwarding or scheduling; started→paid low = the product or the wrong buyer. Friday should end with exactly one thing to change next week, named.
impact 4/5 · effort 1/5 · touches: ai-assistant/FOUNDER-SCORECARD.md section 2

69. **SALES-OUTBOUND-069 — Start every calling day by calling your own demo line.** A dead or degraded demo line makes every dial that day worthless, and `SEVEN-DAY-SALES-SCHEDULE.md` already flags this as the week's P0. Sixty seconds: does it answer on the first ring, does it disclose AI and recording, does it book, does the summary SMS arrive. Log a one-character pass/fail in the daily tally so an outage is visible the same morning it happens.
impact 5/5 · effort 1/5 · touches: SEVEN-DAY-SALES-SCHEDULE.md daily shape, demo line

70. **SALES-OUTBOUND-070 — Reserve one weekly slot for a single new-channel experiment with a written kill criterion.** Dials, supply houses, partners, associations and field sightings are five channels and you cannot run all of them well. Pick one per week, define in advance what success looks like ("two demo-line calls attributable to the supply-house cards in three weeks"), and kill or keep on that number. Otherwise the channel that gets kept is the one that felt most comfortable, which for a non-salesperson is never the phone.
impact 4/5 · effort 1/5 · touches: ai-assistant/WEEKLY-RHYTHM.md, PARTNER-CHANNEL.md

---

*Written 2026-07-27. Grounded in `ai-assistant/PLAYBOOK.md`, `SALES_PITCH.md`, `SEVEN-DAY-SALES-SCHEDULE.md`, `WEEKLY-RHYTHM.md`, `FOUNDER-SCORECARD.md`, `PARTNER-CHANNEL.md`, the full `ai-assistant/outreach/` pack, `nevamis-site/pricing-config.js`, `pilot.html`, `demo.html`, `book.html`, and the engine's `ops/leads`, `ops/interest`, `ops/day8` surfaces. No idea here requires a client, a testimonial, a metric, or a claim Nevamis cannot support today.*
