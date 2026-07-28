# Sending a proposal after a call

When a prospect says "send me something", send them a link. It takes about ten
seconds to build and it arrives looking like you prepared it for them.

The page is `nevamis.ca/proposal.html`. It is `noindex` and not in the sitemap,
so it only exists for people you send it to.

## Build the link

```
https://nevamis.ca/proposal.html?to=BUSINESS+NAME&plan=PLAN&founding=1
```

| Part | What to put | Notes |
|---|---|---|
| `to` | the business name | spaces become `+` or `%20`. Optional; without it the page still reads fine. |
| `plan` | `after-hours`, `growth`, `scale`, or `pay-as-you-go` | defaults to `growth` |
| `founding` | `1` | only while founding spots remain. Shows the setup fee struck out and "waived as a founding client". |

## Examples

Growth plan, founding offer still on the table:
```
https://nevamis.ca/proposal.html?to=Cedarview+Electric&plan=growth&founding=1
```

After Hours for a small shop that only needs evenings:
```
https://nevamis.ca/proposal.html?to=Bronco+Mechanical&plan=after-hours
```

Someone with low or unpredictable volume:
```
https://nevamis.ca/proposal.html?to=Strathcona+Locksmiths&plan=pay-as-you-go
```

## What they see

Their business name in the headline, the plan with its real monthly price,
included minutes, typical call range, overage rate, setup fee (struck through
if founding), the annual option, the full feature list for that plan, the
pilot terms, and the five steps of what happens next. Then a button to book
the follow-up call and the demo number to hear it again.

## Two things worth knowing

**Every number comes from `pricing-config.js`.** The proposal cannot quote a
price that has not been approved, and when pricing changes, every link already
sent updates itself. That also means you cannot discount by editing the URL,
which is deliberate.

**It prints cleanly.** If someone wants a PDF, open the link and print to PDF:
the page switches to a white, ink-friendly layout and drops the buttons and
background. Good for anyone who wants to show a partner.

## In an email or text

> Hi Mike, good talking. Here is the summary of what we went through,
> including the free 7-day pilot: https://nevamis.ca/proposal.html?to=Cedarview+Electric&plan=growth&founding=1
> The demo line is (587) 413-0035 any time you want to hear it again.

Keep the link on its own line so it stays clickable in SMS.
