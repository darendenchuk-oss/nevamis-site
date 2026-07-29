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
| `PRICING-OFFERS-PACKAGING-001` | 2026-07-2x | Pay As You Go renders on the pricing page from pricing-config.js | `present:Pay As You Go:pricing.html` |
| `AGENT-PRODUCT-QUALITY-001` | 2026-07-2x | Hard-coded -06:00 booking offset removed from the engine | `absent:-06:00:../nevamis-engine/src/**/*.ts` |
| `RISK-LEGAL-AND-CONTINUITY-034` | 2026-07-28 | nevamis-site and nevamis-engine both have remotes and are pushed | `none` |

## Taken on trust (no automatic check)

These need a human to confirm. Keep this list short; a check is always better than a promise.

- `RISK-LEGAL-AND-CONTINUITY-034` — "push every repo to a remote" is true for the two repos that
  matter, but git remotes are not greppable from a static check and other repos may exist.
