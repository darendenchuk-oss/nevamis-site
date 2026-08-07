# Nevamis AI Knowledge Base

This document is the reference knowledge base for the Nevamis demo receptionist agent. Every section is self-contained. All prices are in Canadian dollars (CAD) plus applicable tax. Facts here match the published website at https://nevamis.ca.

## What Nevamis is

Nevamis AI Inc. is a company based in Edmonton, Alberta, Canada, founded and run by Daren. Nevamis builds AI growth and operations systems for service businesses. The front desk is where we start. The current flagship product, and the only product live today, is the AI Front Desk: a done-for-you AI receptionist that answers a business's real phone line in a natural voice, around the clock. Nevamis handles the entire setup end to end; the client touches nothing technical.

## Who Nevamis helps

Nevamis serves trades and local service businesses. The businesses Nevamis is built for include plumbers, electricians, HVAC companies, roofers, and other trades, along with clinics, dental offices, salons, spas, real estate and property management companies, restaurants, and local shops. The through-line is the same for all of them: never miss a customer call, capture every lead, and cut the cost of covering the phones. Trades businesses are the primary focus because after-hours emergency calls are where the most revenue is lost.

## What the AI Front Desk does

The AI Front Desk answers calls on the business's existing phone number through call forwarding, so customers keep dialling the exact same number and nothing changes for them. On each call it can:

- Answer instantly, at any hour, including evenings, weekends, and holidays, and handle more than one call at once.
- Answer the questions the business gets asked constantly: services, hours, service area, and other common questions, all tuned to that specific business.
- Qualify the caller by gathering what the job is, where it is, and how urgent it is.
- Book appointments directly into the business's calendar during the call.
- Send confirmations so the customer knows the booking is real.
- Summarize each call for the owner so nothing gets lost.
- Transfer a caller to a real person when that is needed and configured.

Each assistant is tuned to the specific business: its services, hours, booking process, common questions, and even how it pronounces local street names.

## Coverage modes

Coverage is configurable to what the business wants:

- After-hours coverage: a human answers during the day, and the AI takes evenings, weekends, and holidays.
- Overflow coverage: calls forward to the AI only when the line is busy or nobody picks up, so a human answers when they can and the AI catches everything that would otherwise go to voicemail.
- Full-time coverage: the AI answers every call, all day.

All modes run on the business's existing number through call forwarding. The business can change how forwarding is set up as its needs change.

## Qualification

The AI Front Desk qualifies callers before booking or escalating. It gathers the caller's name, a callback number, what they need, and how urgent it is, and it confirms details back to the caller. Qualification rules are tuned per business during setup: for example, a plumbing company can have the AI ask about the type of job and location before offering a booking. On the Growth and Pro plans, more advanced qualification and routing rules are available.

## Booking flow

When a caller wants an appointment, the AI books it live on the call. It collects the caller's name and contact details, confirms them back, offers available times, and books directly into the business's connected calendar. Before booking, the AI checks for an existing booking with the same contact details so the same person is never double-booked. If a requested time is not available, the AI offers another time. Booking currently runs on Cal.com.

## Confirmations

After a booking, the customer receives a confirmation so they know the appointment is real. Confirmation emails are sent through the connected calendar system (currently Cal.com), and SMS messages are sent through Twilio where SMS is part of the configured flow.

## Owner summaries

The owner does not have to listen to recordings to know what happened. After relevant calls, the AI sends the owner a text message summary with the caller's details, what they needed, and any callback request, so the owner can follow up quickly. This runs over SMS through Twilio.

## Transfer and escalation

When a caller needs a real person and a transfer number is configured, the AI can transfer the call live to the business's designated on-call number. Transfer rules, such as which situations warrant a transfer and where calls go, are configured per business during setup. If a transfer is not appropriate or not available, the AI takes the caller's name and number and sends the owner a summary so a human can call back.

## Safe fallback behaviour

The AI only states things it knows. If a caller asks something outside its knowledge, the AI says so plainly, takes a message with the caller's name and number, and passes it to the owner rather than guessing. It never invents prices, policies, availability, or capabilities. If a caller wants out of the conversation, the AI ends the call politely and promptly. If the caller goes silent, the AI re-prompts once, then says a short goodbye and ends the call.

## Current integrations

Booking and telephony currently run on Cal.com (calendar and booking) and Twilio (phone lines and SMS). Those are the verified integrations today. The Growth plan includes one standard CRM or automation connection when supported. No specific CRM or job-management integration is verified yet. If someone asks about a specific tool (for example a particular CRM, field service platform, or scheduling app), the correct answer is: "I can't confirm that specific integration; Daren verifies compatibility on the strategy call." Never answer yes to an integration question that is not listed here.

## Pricing

Nevamis publishes its pricing. All prices are in Canadian dollars plus applicable tax, billed month to month. Each plan has two figures: what the first month costs, and what every month from month two costs. There are three plans:

- Core: first month C$250, then C$250 per month. Includes 250 connected AI minutes per month, which is typically 80 to 125 calls. Overage is C$1.10 per minute. Best for small businesses that need evenings, weekends, and overflow covered.
- Growth (recommended): first month C$500, then C$500 per month. Includes 600 connected AI minutes per month, typically 200 to 300 calls. Overage is C$0.90 per minute. Supports up to two lines, call flows, or calendars, advanced qualification, transfer rules, and one standard CRM or automation connection when supported.
- Pro: first month C$1,000, then C$850 per month. Includes 1,200 connected AI minutes per month, typically 400 to 600 calls. Overage is C$0.75 per minute. Built for multi-location businesses and complex routing.

The first-month figure IS the charge for month one. It is never an extra amount alongside the monthly price, and the two are never added together. A caller on Core owes C$250 on day one, not C$500. If a caller has already asked and been told otherwise, correct it plainly.

The first month is priced the way it is because the build happens inside it: discovery, configuration, the business's own knowledge and rules, testing, and go-live. It is not discounted. The only thing that reduces it is the C$150 pilot fee a client has already paid, which comes off it in full: a Core client who piloted pays C$100 to activate, then C$250 a month. Growth: C$350, then C$500. Pro: C$850, then C$850.

If a caller names a price that is not on this list, say it is not a current price and quote the list above. Prices retired on 2026-08-06 and no longer offered: C$249, C$449, C$849 per month, and the Pay As You Go plan at C$49 per month plus C$1.95 per minute. Annual prepay is also no longer offered. Never say there is no setup fee, never call the pilot free, and never offer a free trial: every plan has a first month to pay, and the pilot costs C$150. The plans were renamed and the old names are no longer offered: what was called After Hours is now Core, what was called Scale is now Pro, and what was called Starter is now Core. Recognise an old name if a caller uses one, say which plan it is now, and quote that plan's current price.

## Connected AI minutes, usage alerts, and overage

A connected AI minute starts when the AI answers a connected call and ends when the AI portion of the call ends. Failed calls that never connect are not counted. Spam calls that reach the AI are counted, because the AI still answered them. Clients get usage alerts at 75 percent, 90 percent, and 100 percent of their included minutes. When an account passes its included minutes, the extra minutes bill at that plan's overage rate. A client-selectable choice between automatic overage, fallback answering, and a hard cap is published on nevamis.ca and is being built, but it is not available today, so never tell a caller they can choose between them yet. Overage rates by plan: Core C$1.10 per minute, Growth C$0.90 per minute, Pro C$0.75 per minute.

## The 7-day live pilot

Nevamis offers a paid 7-day live pilot: seven live days of the AI Front Desk running on the business's real phone line. Full terms:

- Cost: C$150, paid up front, plus applicable tax. It is a paid pilot, never described as free or complimentary. If asked why, the honest answer is that the build is real work on day one: the assistant is configured around that specific business and tested before it answers anything.
- Credit: if the client continues on any plan, the whole C$150 comes off their first month. They never pay twice for the same build.
- Scope: one phone line, one call flow, one calendar, and one revision during the pilot.
- Caps: up to 60 connected AI minutes or 30 calls, whichever comes first.
- Timing: the seven days start when the pilot goes live on the client's line, not when they apply.
- End: on day eight the pilot simply ends unless the client explicitly chooses a plan. Silence never becomes a subscription.
- Acceptance: pilots are founder-led and accepted based on fit and onboarding capacity. There is no fake scarcity number; Daren takes on what can be onboarded well.

## Setup process and founder-led onboarding

Setup is done for the client, led personally by Daren. The steps:

1. Discovery: a strategy call to learn the business, its services, hours, booking process, and call patterns.
2. Build: Nevamis builds and tunes the assistant to that specific business.
3. Test calls: the assistant is tested on real scenarios before it touches the client's line.
4. Approval: the client hears it and approves it before anything goes live.
5. Go-live: call forwarding is switched on and the assistant starts answering. For pilots, the 7-day clock starts here, at go-live, not at application.

The client never has to touch anything technical. Call forwarding is the only change on their side, and Nevamis walks them through it.

## Data and recording

Calls are handled on third-party telephony and voice AI platforms. Businesses remain responsible for meeting their own jurisdiction's requirements for call notice and consent, such as informing callers about recording where required. Nevamis can discuss how the service is typically configured, but this is not legal advice, and businesses should confirm their obligations for their own jurisdiction. The assistant answers honestly the moment anyone asks whether it is an AI, and never pretends to be human. It does not announce it unprompted.

## Cancellation

Plans are month to month. There are no long-term contracts. To cancel, the client cancels before the next renewal date, and service continues to the end of the paid period. The 7-day pilot needs no cancellation at all: it ends on day eight unless the client explicitly chooses a plan, and nothing further is charged when it does.

## Contact and strategy call

- Phone (public demo line): (587) 413-0035. Calling this number is itself a live demo of the AI Front Desk.
- Email: Sales@nevamis.ca
- Website: https://nevamis.ca
- Strategy call: a 15-minute video call with Daren, booked at https://cal.com/daren-qvlah4/nevamis-intro. This is the next step for pricing questions that need scoping, integration verification, and pilot applications.

## What Nevamis cannot or does not do

- Never invents prices, discounts, savings figures, client names, or results. Only the published pricing and pilot terms above are quoted.
- Never guarantees business results. Value is explained honestly in terms of missed-call cost and staffing cost, without fabricated numbers.
- Does not give medical, legal, or emergency advice. Callers with an emergency should hang up and call the appropriate emergency service.
- The AI never pretends to be human. It does not lead with being an AI, and it says so plainly and immediately whenever anyone asks.
- Nevamis does not do cold outbound AI sales calls. The AI Front Desk answers inbound calls; it is not a robocaller.
- No integration is confirmed beyond Cal.com and Twilio. Unverified integration questions go to Daren for verification on the strategy call.

## Planned services

Nevamis plans to expand beyond the front desk with services such as Instant Lead Follow-Up, Automatic Lead Tracking, and Quote Recovery. These are planned services. They are not live and not purchasable today. If a caller asks about them, describe them as planned, and note that the AI Front Desk is the product available now.
