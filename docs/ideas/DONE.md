# Completed ideas

`scripts/rank-ideas.mjs` reads this file and removes these ideas from the ranking.

Each row carries a **check**, and the ranker re-runs it every time. That is the point: a
hand-maintained "done" list is the exact pattern that let three abandoned mockups sit live
serving a retired claim, so this one is not trusted, it is verified. If a check fails the idea
has regressed, the ranker says so loudly, and the item comes back into the backlog.

Check syntax, evaluated against the repo root:

- `absent:<pattern>:<glob>` — the pattern must NOT appear in any matching file
- `present:<pattern>:<glob>` — the pattern MUST appear in at least one matching file

A row with `check: none` is taken on trust and is listed separately so the untrusted ones are
visible rather than mixed in.

| ID | Done | Evidence | Check |
|----|------|----------|-------|
| `TRUST-PROOF-OBJECTIONS-001` | 2026-07-26 | CLM-02 retired; scrubbed from every page, the agent prompt and llms.txt, and added to the banned list in check-consistency.js | `absent:first ring:*.html` |
| `PRICING-OFFERS-PACKAGING-001` | 2026-07-2x, VOIDED 2026-08-06 | **The idea is void, not done.** It was "render Pay As You Go on the pricing page", it was built, and then the plan itself was retired on 2026-08-06 and its record deleted from `pricing-config.js` on 2026-08-07. The card is gone and must stay gone. The old check `present:Pay As You Go:pricing.html` went on passing for four days after the removal, because the string it searched for now lives in the HTML comment that RECORDS the removal - a `present:` check satisfied by the note saying the thing is absent. Inverted to the invariant that is actually true, which `tests/interactions.spec.js` also asserts against the rendered page | `absent:>Pay As You Go<:pricing.html` |
| `AGENT-PRODUCT-QUALITY-001` | 2026-07-2x | Hard-coded -06:00 booking offset removed from the engine | `absent:-06:00:../nevamis-engine/src/**/*.ts` |
| `RISK-LEGAL-AND-CONTINUITY-034` | 2026-07-28 | nevamis-site and nevamis-engine both have remotes and are pushed | `none` |
| `LEAD-CAPTURE-BOOKING-001` | 2026-07-28 | Prefill no longer rewrites frame.src once the scheduler has been used; negative-tested in interactions.spec.js | `present:frameTouched:book.html` |
| `LEAD-CAPTURE-BOOKING-005` | 2026-07-28 | Interest endpoint ceiling raised from 10/hour to 120; it was rejecting the eleventh genuine lead | `absent:MAX_PER_HOUR = 10;:../nevamis-engine/src/app/api/interest/route.ts` |
| `LEAD-CAPTURE-BOOKING-017` | 2026-07-28 | Hero CTA carries the number like the callbar does, dropped below 430px rather than wrapping | `present:cta-num:home.html` |
| `LEAD-CAPTURE-BOOKING-024` | before 2026-07-28 | Already done when checked: the ROI output has a CTA with roi_book_click | `present:roi_book_click:home.html` |
| `LEAD-CAPTURE-BOOKING-036` | 2026-07-28 | enterkeyhint and inputmode on all 7 capture fields; honeypot deliberately excluded | `present:enterkeyhint:coming-soon.html` |

## Taken on trust (no automatic check)

These need a human to confirm. Keep this list short; a check is always better than a promise.

- `RISK-LEGAL-AND-CONTINUITY-034` — "push every repo to a remote" is true for the two repos that
  matter, but git remotes are not greppable from a static check and other repos may exist.
