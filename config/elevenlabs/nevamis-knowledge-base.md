<!-- commercial-truth: CURRENT_CANONICAL — live agent material, stated to the canonical model of 2026-10-02, commercial model v7 (first month free and no Launch & Implementation fee on The Works, the AI Front Desk and any add-on bought on its own; the Performance Partnership at C$5,000 Launch & Implementation, then C$350 a month from the first month, and there is no free month on the Partnership; no minimum term and no notice period; Lead Generation by invitation); checked against src/domain/canonical.ts on every consistency run. -->
<!-- Revised 2026-10-02 for commercial model v7, in this repo copy only: the engine's scripts/update-demo-kb.mts has to produce the same edits before the comparison below passes, and nothing was pushed to the live agent. Revised 2026-09-23, and again the same day after review, to match the live document the engine script scripts/update-demo-kb.mts produces, edit for edit. This file is the repo source copy: the script compares against it (pass --repo-copy=<this file>) and never pastes it, and these two comments are repo-only metadata it strips before comparing. Editing this file changes nothing a caller hears: the ElevenLabs knowledge base is its own deploy surface and changes only when that script is run with --apply. -->
# Nevamis AI Knowledge Base

This document is the reference knowledge base for the Nevamis demo receptionist agent. Every section is self-contained. All prices are in Canadian dollars (CAD) plus applicable tax.

## What Nevamis is

Nevamis AI Inc. is a company based in Edmonton, Alberta, Canada, founded and run by Daren. Nevamis takes work off a service business owner's plate. It finds businesses of exactly the kind the owner wants more of, which is Lead Generation, offered by invitation, and a short call with Daren is where it starts; it follows up the quotes the owner already sent; and it answers their phone at any hour. The AI Front Desk is the part a caller can hear: it answers a business's real phone line in a natural voice, around the clock. Nevamis handles the setup end to end; the client touches nothing technical.

## Who Nevamis helps

Nevamis serves trades and local service businesses. The businesses Nevamis is built for include plumbers, electricians, HVAC companies, roofers, and other trades, along with clinics, dental offices, salons, spas, real estate and property management companies, restaurants, and local shops. The through-line is the same for all of them: never miss a customer call, capture every lead, and cut the cost of covering the phones. Trades businesses are the primary focus because after-hours emergency calls are where the most revenue is lost.

## What the AI Front Desk does

The AI Front Desk answers calls on the business's existing phone number through call forwarding, so customers keep dialling the exact same number and nothing changes for them. On each call it can:

- Answer instantly, at any hour, including evenings, weekends, and holidays, and handle more than one call at once.
- Answer the questions the business gets asked constantly: services, hours, service area, and other common questions, all tuned to that specific business.
- Qualify the caller by gathering what the job is, where it is, and how urgent it is.
- Take the job, the address and the time the caller wants, and tell the caller plainly that the business will confirm the time. It does not book into a calendar and does not send the caller a confirmation.
- Text and email the owner a summary of each call within seconds, so nothing gets lost.
- On an urgent call, capture the urgent details and alert the business's team. It does not transfer calls.

Each assistant is tuned to the specific business: its services, hours, service area and common questions.

## Coverage modes

Coverage follows the business's call forwarding, which the business switches with dial codes from its own phone:

- Overflow coverage: calls forward to the AI only when the line is busy, nobody picks up, or the phone is off, so a human answers when they can and the AI catches everything that would otherwise go to voicemail. This is also how evenings, weekends and holidays are covered: nobody is picking up then, so every call reaches the AI. Calls the team misses during the day reach it too.
- Full-time coverage: every call forwards to the AI, all day.

Forwarding has no timer and no business-hours setting. A business that wants the AI to take every call in the evening switches on all-calls forwarding when it closes and switches it off when it opens. All modes run on the business's existing number, and the business can change how forwarding is set up as its needs change.

## Qualification

The AI Front Desk qualifies callers before it takes the job down or flags a call as urgent. It gathers the caller's name, a callback number, what they need, and how urgent it is, and it confirms details back to the caller. Qualification rules are tuned per business during setup: for example, a plumbing company can have the AI ask about the type of job and location before it takes down the time the caller wants. The questions it asks and what it treats as urgent are set with the business during the build. There is no call routing: a business has one line and one call flow.

## Appointments and times

The AI Front Desk does not book into a calendar and does not confirm appointments, and a client's line sends the caller no confirmation text. When a caller wants a time, it takes the job, the address and the time they want, confirms those details back to the caller, and tells them the business will confirm the time. The owner gets the details by text and email within seconds and confirms the slot with the caller.

This demo line is different: it answers for Nevamis itself, so it can set up a call with Daren. A client's front desk does not book anything.

## Owner summaries

The owner does not have to listen to recordings to know what happened. After each call, the owner gets a summary by text and by email within seconds, with the caller's details, what they needed, and any callback request, so the owner can follow up quickly.

## Urgent calls and escalation

The AI Front Desk does not transfer calls. On an urgent call it captures the urgent details and alerts the business's team within seconds, following the rules the business set for what counts as urgent. When a caller wants a real person, the AI takes their name and number, and the owner gets a summary so a person can call back.

## Safe fallback behaviour

The AI only states things it knows. If a caller asks something outside its knowledge, the AI says so plainly, takes a message with the caller's name and number, and passes it to the owner rather than guessing. It never invents prices, policies, availability, or capabilities. If a caller wants out of the conversation, the AI ends the call politely and promptly. If the caller goes silent, the AI re-prompts once, then says a short goodbye and ends the call.

## Current integrations

Nevamis does not connect to any CRM, job-management, calendar or accounting software today, and there is no integration to offer. If someone asks about a specific tool (for example a particular CRM, field service platform, or scheduling app), never answer yes: say plainly that Nevamis does not connect to it today, then say what does happen. Every call becomes a lead the owner reads in their own portal and can export as a CSV, and the summary reaches the owner by text and email. This demo line books calls with Daren through Nevamis's own scheduling on Cal.com, which is Nevamis's own calendar and not an integration, and a client's line books nothing.

## Pricing

Nevamis publishes its pricing. All prices are in Canadian dollars plus applicable tax. There is no minimum term and no notice period: every plan and every automation add-on runs month to month from the first month. The client cancels the plan from their own client portal at any time and can cancel any automation add-on at any time too, with the service running to the end of the month they have already paid for, and the price is locked for twelve months from signing.

A business new to Nevamis gets its first month free on The Works, on the AI Front Desk, and on any automation add-on bought on its own, once per business. Your first month is free. We take your card when you start and charge nothing until your second month begins; cancel in your portal before then and you pay nothing. We remind you a week before and a day before your first charge. Minutes past your allowance during your free month are not billed. A module you add once you are paying is billed from its first month. No Launch & Implementation fee: you pay the monthly price and nothing else. Say it in the approved shape: for example, "your first month is free, then one thousand dollars a month". The public name is "first month free": never call it a free trial, never offer any other free period or a free month on a plan that has none, and never deny the first month free. Never call a Launch & Implementation fee a setup fee, an activation fee or an onboarding fee. There are three plans:

- The Works: first month free, then C$2,100 per month. No Launch & Implementation fee and no performance fee. The whole engine: the AI Front Desk plus every sellable automation add-on (missed-call text-back, quote follow-up, invoice reminders, review requests), priced under the sum of its parts. Includes 1,400 connected AI minutes per month, typically 470 to 700 calls. Overage is C$0.75 per minute.
- AI Front Desk (recommended): first month free, then C$1,000 per month. No Launch & Implementation fee and no performance fee. Includes 1,400 connected AI minutes per month, typically 470 to 700 calls. Overage is C$0.75 per minute. The front desk on its own; automation add-ons join one at a time, each month to month like the plan itself, with no Launch & Implementation fee, at its monthly: missed-call text-back at C$350 per month, quote follow-up at C$500 per month, invoice reminders at C$500 per month, review requests at C$300 per month. Bought on its own, an add-on's first month is free too; added once the client is paying, it is billed from its first month.
- Performance Partnership: offered by invitation and approval only. Never present it as the default choice, never as self-serve, and never as "the cheap plan". C$5,000 Launch & Implementation, then C$350 a month from the first month, plus an agreed share of collected revenue directly attributable to a business Nevamis found or a quote Nevamis recovered, set in your agreement before anything is charged. By invitation; there is no free month on the Partnership. Say it as "five thousand dollars Launch and Implementation, then three hundred and fifty dollars a month from the first month". The share is never a share of all revenue and never of profit, and the percentage, the attribution window and what counts as eligible revenue are all set in the client's agreement before anything is charged. Never state a percentage for it on this line. Includes 250 connected AI minutes per month, typically 80 to 125 calls. Overage is C$1.10 per minute. If a caller asks for it, describe it and route them to the strategy call; approval happens there, not on this line.

Enterprise work, for larger or unusual deployments, is quoted per client, and Daren scopes it on the strategy call: Launch & Implementation starting at C$5,000 or custom quoted, recurring custom, performance optional. There is no universal Enterprise monthly price, so never state one. What an Enterprise quote covers is Daren's to scope on that call, so never promise an integration, a second phone line or another location.

The performance fee exists only on Performance Partnership. It is never "a percent of all revenue" and never profit-based. It applies only to collected revenue directly attributable to qualified opportunities Nevamis generated, as defined and governed by the client's executed agreement, which is also where its percentage is set. The Works and the AI Front Desk carry no performance fee at all.

On the Performance Partnership, the C$5,000 Launch & Implementation fee covers the build: discovery, configuration, the business's own knowledge and rules, a baseline of the business, testing, and go-live validation. It is charged once, at the start, and never again. On The Works, the AI Front Desk and the add-ons the same build is done with no Launch & Implementation fee. The monthly price is not discounted, and a founding-client arrangement is not offered publicly, so never offer one on this line.

If a caller names a price that is not on this list, say it is not a current price and quote the list above. Prices retired and no longer offered: C$249, C$449 and C$849 per month (retired 2026-08-06); C$850 per month, which was Pro's price until 2026-08-09; C$750, which was Grow's monthly price until 2026-08-22; the Launch & Implementation fees retired on 2026-10-02, which were C$1,500 on the AI Front Desk, C$3,000 on The Works, C$500 on missed-call text-back and review requests and C$750 on quote follow-up and invoice reminders; the Performance Partnership's band, retired on 2026-10-02, of C$2,500 to C$10,000 to start and C$250 to C$500 a month; C$1,800, which was The Works' monthly price until 2026-08-24; C$450, which was the quote follow-up and invoice reminders monthly price until 2026-08-24; the Pay As You Go plan at C$49 per month plus C$1.95 per minute; and annual prepay. The C$150 seven-day live pilot is retired too, with its fee and the credit it used to earn against a first month: there is no pilot of any kind now, so never offer one or price one, and never say anything comes off a first month. The first month free above is not a pilot and not a discount off a paid month. The plans were renamed on 2026-08-22 and the old names are no longer offered: what was called Operate (earlier Pro, earlier Scale) is now the AI Front Desk, what was called Grow (earlier Growth) was replaced by The Works, the everything bundle, and what was called Core (earlier After Hours, and Starter before that) is now the invitation-based Performance Partnership. Recognise an old name if a caller uses one, say which plan it is now, and quote that plan's current figures in the approved shape.

## Connected AI minutes, usage alerts, and overage

A connected AI minute starts when the AI answers a connected call and ends when the AI portion of the call ends. Failed calls that never connect are not counted. Spam calls that reach the AI are counted, because the AI still answered them. Clients get usage alerts at 50 percent, 75 percent, 90 percent, and 100 percent of their included minutes, so the bill is never a surprise. Past the included minutes, extra minutes are billed at the plan's overage rate and calls keep being answered. There is no hard cap, no fallback-answering mode and no choice of what happens at the limit, so never offer one. If a caller says they read that they can choose what happens at the limit, say plainly that no such choice is available today, then say what does happen. Overage rates by plan: The Works C$0.75 per minute, the AI Front Desk C$0.75 per minute, Performance Partnership C$1.10 per minute.

## How a business starts

On The Works, the AI Front Desk or an add-on bought on its own, nothing is charged in the first month: the card is taken at sign-up and the monthly is charged from the day the second month begins. On the Performance Partnership, the C$5,000 Launch & Implementation fee is charged at the start and the monthly from the first month. Beyond the monthly, the only other charges are overage past the included minutes, any automation add-ons the client chooses at their published prices, and on the Performance Partnership the agreed share of attributable collected revenue; no amount appears later that was not stated at the start. The plan is month to month and can be cancelled any time before the next renewal, so continuing is a decision the client makes every month rather than once. Before their number is attached, the assistant is built around their own hours, services, service area and rules, tested against their real call scenarios, and approved by them.

## Setup process and founder-led onboarding

Setup is done for the client, led personally by Daren. The steps:

1. Discovery: a strategy call to learn the business, its services, hours, booking process, and call patterns.
2. Build: Nevamis builds and tunes the assistant to that specific business.
3. Test calls: the assistant is tested on real scenarios before it touches the client's line.
4. Approval: the client hears it and approves it before anything goes live.
5. Go-live: call forwarding is switched on and the assistant starts answering. Go-live happens only after the client has approved the assistant.

The client never has to touch anything technical. Call forwarding is the only change on their side, and Nevamis walks them through it.

## Data and recording

Calls are handled on third-party telephony and voice AI platforms. Businesses remain responsible for meeting their own jurisdiction's requirements for call notice and consent, such as informing callers about recording where required. Nevamis can discuss how the service is typically configured, but this is not legal advice, and businesses should confirm their obligations for their own jurisdiction. The assistant answers honestly the moment anyone asks whether it is an AI, and never pretends to be human. It does not announce it unprompted.

## Cancellation

Plans carry no minimum term and no notice period: every plan and every automation add-on is month to month from the first month. The client cancels the plan from their own client portal at any time, with nothing to arrange by phone, and can cancel any automation add-on at any time too; service continues to the end of the month already paid for. In the free first month, cancelling before the second month begins means the client pays nothing. On the Performance Partnership, the C$5,000 Launch & Implementation fee was charged once at the start and is never billed again.

## Contact and strategy call

- Phone (public demo line): (587) 413-0035. It speaks in the same voice a client's line uses. This line answers for Nevamis itself, which is why it can set up a call with Daren; a client's front desk takes the job and the time the caller wants for the owner to confirm.
- Email: Sales@nevamis.ca
- Website: https://nevamis.ca
- Strategy call: a 15-minute video call with Daren, booked at https://cal.com/daren-qvlah4/nevamis-intro. This is where Lead Generation starts, since it is offered by invitation, and it is the next step for an Enterprise quote or for anyone who wants to talk it through with a person before signing up.

## What Nevamis cannot or does not do

- Never invents prices, discounts, savings figures, client names, or results. Only the published pricing above is quoted.
- Never guarantees business results. Value is explained honestly in terms of missed-call cost and staffing cost, without fabricated numbers.
- Does not give medical, legal, or emergency advice. Callers with an emergency should hang up and call the appropriate emergency service.
- The AI never pretends to be human. It does not lead with being an AI, and it says so plainly and immediately whenever anyone asks.
- Nevamis does not do cold outbound AI sales calls. The AI Front Desk answers inbound calls; it is not a robocaller.
- Nevamis does not connect to any CRM, calendar, job-management or accounting software, and never says yes to an integration question.
- The AI Front Desk does not book appointments, does not send callers confirmations, and does not transfer calls.

## What is live today, and what is not

Lead Generation is offered by invitation: Nevamis reads public pages and lists businesses of exactly the kind the owner wants more of, each with the page it came from, and the owner decides every one. Nobody on the list is contacted by Nevamis. Lead Generation is by invitation and a short call with Daren is where it starts, so never quote a price, a number of leads or a result for it, and never describe it as automatic.

Available today, each described exactly as narrowly as it works and never promised as anything more:

- The PULSE Business Scan: it reads only what is public on a business's own website and shows what it found, quoted from those pages, and any figure it gives is a modelled range from public information and market benchmarks rather than a measurement of the business's results. A business can run it from the Nevamis website.
- The AI Front Desk, described above.
- Instant Lead Follow-Up, the missed-call text-back add-on: one text back when a call is missed, during business hours, with the business's name on it and a working opt-out.
- Automatic Lead Tracking: each call, text and form becomes a lead with its source and a status. It runs off the calls the front desk already answers.
- Quote Recovery, the quote follow-up add-on: a follow-up on a quote that went quiet, the day it goes stale, four days on and eleven days on, each one approved by the owner. Those three approved follow-ups are its whole sequence, and nothing beyond them is promised.
- Get-Paid Autopilot, the invoice reminders add-on: a gentle reminder when an invoice goes overdue, a firm one seven days later, and at twenty-one days it stops emailing the customer and tells the owner instead, each email approved by the owner.
- The Review Engine, the review requests add-on: one review request by text per finished job, on the business's own review link, every request released by a person.

Beyond Lead Generation, which is by invitation, and the list above, everything else Nevamis describes, such as the Revenue Engine's ad attribution and an inbox assistant, is in development or planned: describe it that way if asked, and never as something to buy today.
