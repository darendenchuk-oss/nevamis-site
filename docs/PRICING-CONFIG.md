# pricing-config.js: developer notes

`pricing-config.js` is served at nevamis.ca because `pricing.html`,
`proposal.html`, `site.js` and `scripts/build-schema.mjs` render from it. Anything
written in it, comments included, is readable by anyone who opens the file. So
the file carries data and short notes about how to read that data, and the
reasoning behind it lives here, in `docs/`, which `_config.yml` keeps off the
site.

`scripts/check-published-surface.mjs` enforces the split: a served file may not
carry a money figure, a revenue-share rate, or internal readiness or
"what we do not say" notes in a comment, and no served file may carry the
share rate as data (`shareBps`). Where a rule needs a figure, name the field
that holds it instead.

## Where the numbers come from

Every price, term and plan mirrors nevamis-engine's `src/domain/canonical.ts`.
The engine's `scripts/check-consistency.mjs` parses this file and fails when a
plan's `monthly` or `launch` differs from canonical, when a plan declares a
`setup` figure, or when the referral block drifts. Change canonical first, then
this file, in the same train.

The engine's parser reads each plan as the 400 characters after its
`id: "..."`, and it matches `monthly:` and `launch:` inside that window. Keep
those two keys close to the `id`; a long comment between them makes the parser
read nothing, and it then reports the wrong number of plans.

## The rules the data encodes

- **One source.** No page types a price. Pages render from `NV_PRICING`, and
  `scripts/check-consistency.js` fails where a page's static fallback text
  differs from this file.
- **`launch`, never `setup`.** The one-time Launch & Implementation fee is
  charged once, beside the first month, never instead of it. The approved
  sentence joins the two figures with "to start" and "then", never "plus", "+"
  or "and". The fee has one name; the older names for it are retired
  vocabulary, listed in the engine's canonical record, and may only be
  denied, never used. The engine treats the presence of a `setup` key as a
  defect.
- **No minimum term.** `terms.minimumMonths` is 0 (owner directive
  2026-09-08). Every sentence about the term is derived from that one number,
  so re-introducing a term is a one-figure change here. A shape that needs a
  second number is a new decision and a new field.
- **No notice period.** `terms.cancellationNoticeDays` is 0 (owner directive
  2026-09-12). The field is kept so every surface still derives its sentence
  from one number. Renderers must branch on the value and must never fall back
  to `|| 30`: that fallback is exactly what brings a retired notice back at
  zero. Use `== null` checks.
- **Price lock.** `terms.priceLockMonths` is the lock from signing.
- **`publishedPricing` and `sellable`** mirror `CANONICAL.pricing` in the
  engine. Flip both repositories together, or the cross-repo check fails,
  which is the point of it.
- **Enterprise is not a plan.** It has no universal monthly, and a record
  shaped like a priced plan gets rendered as one. `launchFrom` is a floor
  ("starting at"), never a price.
- **Plan order is display order.** Every renderer walks `plans` in order
  (the pricing cards, the homepage plans strip in `site.js`, the Offer list in
  `build-schema.mjs`). The Performance Partnership comes first because Lead
  Generation, which leads every surface, is an item on it; The Works follows
  as the anchor; the AI Front Desk is `recommended: true` and the checkout
  default.
- **Keys are stable, names moved.** `pro` is the AI Front Desk, `starter` is
  the Performance Partnership, `growth` is The Works. Stored subscriptions
  carry these keys, so a key never changes meaning while a subscription on it
  is live.
- **`selfServe: false`** marks an invitation-only plan (the Partnership). No
  surface may present it as the default, and checkout refuses it without an
  approval. `monthlyRange` is the published band its monthly sits in.
- **`recommendedLabel`** is a recommendation, never a claim about what other
  businesses chose. There are no clients yet to count.

## Add-ons

- Every automation is its own product and its own sale. `soldAlone: true`
  means a client may buy that module with nothing beside it.
- `sellable` is the outer gate. `sellable: false` means the machinery has not
  shipped end to end: the item may be described as coming, never sold, and no
  surface may give it a Buy control. It mirrors the engine's capability
  record for that item; this file cannot derive across repositories, so it
  mirrors today's answer, and the site may say less than the engine, never
  more.
- Lead Generation has no standalone pair (`monthly` and `launch` are 0 and
  `soldAlone` is false): it is offered by invitation on the Performance
  Partnership only. Bid and tender work is arranged by hand under the service
  agreement's named-approver rule and is not part of it anywhere.
- Search Rankings carries no price because nothing is built for it.
- A `partnership` block says what an item costs on the Performance
  Partnership. Items paid out of what they produce carry `launch: 0`,
  `monthly: 0` and `attributableTo`. `partnershipTerms(id)` mirrors the
  engine's `partnershipTerms()`: an add-on with no `partnership` block is
  charged its own pair there, so the unchanged items carry no second copy of
  their figures.
- **The share itself is not in this file.** The rate is set in each client's
  executed agreement and carried by the engine's canonical record. The only
  approved client-facing sentence is the one the engine's claim registry
  generates: "<item> on the Performance Partnership is paid by an agreed share
  of collected revenue directly attributable to <what>, subject to your
  agreement." A served file that carried the rate, even as unrendered data,
  would publish it to anyone who opened the file.

## What every plan includes

`EVERY_PLAN` is written once and spread into each plan's `features`, because
the front-desk capability does not differ by plan. Every line in it must be
something the system does today, end to end, for a paying client.
`sharedFeatures()` derives the lines every plan carries (it is computed, not
read off `EVERY_PLAN`, because "One business phone line" is on every plan
without being in `EVERY_PLAN`), so the pricing page prints them once and each
card prints only what differs. `features` itself stays whole because
`proposal.html` renders one plan's full list.

Two lines were corrected on 2026-09-24 and guard 7k in
`scripts/check-consistency.js` refuses them on every surface: there is no
client choice at the minutes limit (every account keeps answering and bills
extra minutes at the plan's rate; the engine's `usage-policy.ts` has no
production caller), and there is no portal Pulse page (it redirects to
`/portal/results`).

## Usage alerts

The alert line says "after you pass", never "at". The engine checks usage from
its daily run and sends only the highest threshold crossed since the last
check, so a client may get one message a day after crossing it rather than one
per threshold on the dot.

## Referral, founding client, annual

`referral` mirrors `CANONICAL.referral`; the referrer's free month is earned on
the referred business's first paid invoice, and the engine validates it.
`foundingClient` and `annual` are inactive records kept so a renderer that
reads them gets `active: false` rather than `undefined`.
