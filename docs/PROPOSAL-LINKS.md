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
| `plan` | `starter`, `growth`, or `pro` | defaults to `growth`. An id it does not recognise also falls back to `growth`, so a typo quotes the middle plan rather than failing visibly. |

Those ids are the ones in `pricing-config.js`. They are not what the plans are
called on the page: `starter` renders as **Core**, `growth` as **Growth**, and
`pro` as **Pro**.

## Examples

```
https://nevamis.ca/proposal.html?to=Cedarview+Electric&plan=growth
```

A small shop at the lower end of the volume range:
```
https://nevamis.ca/proposal.html?to=Bronco+Mechanical&plan=starter
```

Someone with the volume to justify the top tier:
```
https://nevamis.ca/proposal.html?to=Strathcona+Locksmiths&plan=pro
```

## Parameters that no longer do anything

Worth knowing, because old links and old habits both still exist.

| Parameter | What happens now |
|---|---|
| `founding=1` | Ignored. It waived a setup fee during a period when setup was free for everyone; there is no setup fee to waive. |
| `plan=pay-as-you-go` | **Do not send this.** The plan was retired on 2026-08-06 and removed on 2026-08-07. It is not recognised, so the link quotes **Growth at C$500/month** to someone you told about a low-volume option. |
| `plan=after-hours` | Still resolves, to `starter`. Links sent before 2026-08-06 keep working rather than silently quoting the wrong tier. |
| `plan=scale` | Still resolves, to `pro`. Same reason. |

## What they see

Their business name in the headline, the plan with its real monthly price, the
included minutes, the typical call range, the overage rate, the full feature
list for that plan, and six steps of what happens next. Then a button to book
the follow-up call and the demo number to hear it again.

Under the price it says one figure and what is not charged beside it: *no setup
fee, no activation fee, and no minimum term; cancel any time from your portal
and service runs to the end of the month you paid for.* There is no pilot, paid
or free, and no annual figure — an annual option exists in the config but is
switched off, because the approved model locks three monthly prices and
approves no annual price.

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
> One monthly price, nothing to set up, cancel any time.
> The demo line is (587) 413-0035 any time you want to hear it again.

Keep the link on its own line so it stays clickable in SMS.

Say nothing in the message that the page does not say. The prospect reads both,
and the one they will believe is whichever is worse for you.
