# Sending a proposal after a call

When a prospect says "send me something", send them a link. It takes about ten
seconds to build and it arrives looking like you prepared it for them.

The page is `nevamis.ca/proposal.html`. It is `noindex` and not in the sitemap,
so it only exists for people you send it to.

> **This file describes what the page actually renders.** It fell a long way
> behind once: it went on documenting a founding waiver, a struck-out setup fee
> and a free seven-day pilot for a day after all three were retired, and its
> example email promised the pilot in writing. The page itself was truthful the
> whole time, so anyone following these instructions sent an email that the
> document then contradicted. If you change what the proposal offers, change
> this file in the same breath.

## Build the link

```
https://nevamis.ca/proposal.html?to=BUSINESS+NAME&plan=PLAN
```

| Part | What to put | Notes |
|---|---|---|
| `to` | the business name | spaces become `+` or `%20`. Optional; without it the page still reads fine. |
| `plan` | `starter`, `growth` or `pro`, or a module sold on its own: `quote_chase`, `get_paid`, `review_engine` or `missed_call_recovery` | defaults to `pro`, the recommended plan, when there is no `plan` at all. An id it does not recognise shows **NO PLAN NAMED** and no price, never a substitute plan: check the link before you send it. |
| `quote` | an agreed monthly figure, digits only | optional, and only for the Performance Partnership, whose monthly is agreed inside its published band. A figure inside that band replaces the published monthly on the page; anything outside it is ignored and the published monthly is shown. The Works and the AI Front Desk have one price each, so a `quote` on them is ignored unless it is that price. A quoted proposal has no **Start now** button, because checkout charges the published price, not the agreed one. |

Those ids are the ones in `pricing-config.js`. They are not what the plans are
called on the page: `starter` renders as **Performance Partnership**, `growth`
as **The Works**, and `pro` as **AI Front Desk**. A module id renders that
module under its own name (`quote_chase` is the **Quote-Chase Engine**), with
its own Launch & Implementation fee and monthly from `pricing-config.js`, its
description from the same file, and **Book the next call** as the only action:
checkout has no live price for a module on its own yet, so a module is started
after a call. Only modules marked sellable and sold on their own work here;
Lead Generation, Search Rankings and Customer Reactivation show
**NO PLAN NAMED**.

## Examples

```
https://nevamis.ca/proposal.html?to=Cedarview+Electric&plan=growth
```

The Performance Partnership, offered by invitation only (this one has no
**Start now** button; it is agreed, not bought):
```
https://nevamis.ca/proposal.html?to=Bronco+Mechanical&plan=starter
```

The front desk on its own, the recommended plan:
```
https://nevamis.ca/proposal.html?to=Strathcona+Locksmiths&plan=pro
```

One automation on its own, for a business that only wants its quiet quotes
followed up:
```
https://nevamis.ca/proposal.html?to=Mill+Creek+Roofing&plan=quote_chase
```

## Parameters that no longer do anything

Worth knowing, because old links and old habits both still exist.

| Parameter | What happens now |
|---|---|
| `founding=1` | Ignored. It waived a setup fee during a period when setup was free for everyone. It does not waive or change the Launch & Implementation fee; the page quotes the real amount. |
| `plan=pay-as-you-go` | **Do not send this.** The plan was retired on 2026-08-06 and removed on 2026-08-07. It is not recognised, so the page shows **NO PLAN NAMED** and no price. |
| `plan=after-hours` | Still resolves, to `starter`. Links sent before 2026-08-06 keep working rather than silently quoting the wrong tier. |
| `plan=scale` | Still resolves, to `pro`. Same reason. |

## What they see

Their business name in the headline, the plan with its real monthly price, the
included minutes, the typical call range, the overage rate, the full feature
list for that plan, and six steps of what happens next.

Two buttons sit under the price and again at the end. For The Works and the AI
Front Desk the first is **Start now**, which opens signup and checkout for that
exact plan at the published price, and the second is **Book the next call**.
The Performance Partnership, a module, a proposal with a `quote`, a link that
names no plan, or any time checkout is switched off in `pricing-config.js`,
shows **Book the next call** alone, because checkout could not charge what the
page states. The demo number to hear it
again is at the end either way.

Under the price it states the monthly, the one-time Launch & Implementation fee
charged once to start, and the terms: *no minimum term, month to month from the
first month, cancel any time from your own portal, service runs to the end of
the month you already paid for, and your price is locked for 12 months.* It
quotes no annual figure: an annual option exists in the config but is switched
off.

## Two things worth knowing

**Every number comes from `pricing-config.js`.** The proposal cannot quote a
price that has not been approved, and when pricing changes, every link already
sent updates itself. That also means you cannot discount by editing the URL,
which is deliberate.

**It prints cleanly.** If someone wants a PDF, open the link and print to PDF:
the page switches to a white, ink-friendly layout and drops the buttons and
background. Good for anyone who wants to show a partner.

## In an email or text

> Hi Mike, good talking. Here is the summary of what we went through:
> https://nevamis.ca/proposal.html?to=Cedarview+Electric&plan=growth
> A one-time Launch & Implementation fee to start, then one monthly price, no minimum term, cancel any time.
> You can start from that page when you are ready, or we can talk it through first.
> The demo line is (587) 413-0035 any time you want to hear it again.

Keep the link on its own line so it stays clickable in SMS.

Say nothing in the message that the page does not say. The prospect reads both,
and the one they will believe is whichever is worse for you.
