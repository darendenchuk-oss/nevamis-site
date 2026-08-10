# film-v2 — CLAIM AUDIT

Every audience-facing claim checked against `nevamis-engine` @ `origin/master`
and `creative/nevamis/truth-basis.md` (corrected 2026-08-10).

## Verified capability states
`ai_front_desk` **available** · `revenue_engine` `private_pilot` ·
`instant_lead_follow_up`, `automatic_lead_tracking`, `quote_recovery`,
`email_automation`, `payroll_ops` all **`coming_soon`**.
There is **no scheduling capability at any tier**.

## Claims made, and their status

| Claim | Where | Verdict | Evidence |
|---|---|---|---|
| Answers 24/7 on the existing number | 0:07 · frame 02 | ✅ LIVE | `ai_front_desk` = available |
| Qualifies the caller against owner rules | 0:12 · frames 02, 04 | ✅ LIVE | truth ceiling |
| Captures WHO / WHAT / URGENCY / NEXT STEP | 0:12 · frame 03 | ✅ LIVE — **all four are real fields** | `DRAFT_DATA_COLLECTION`: `contact_name`, `intent`/`service`, `urgency`, `next_step` |
| Texts the owner the details in seconds | 0:12, 0:24 · frame 05 | ✅ LIVE | truth ceiling |
| Will not quote a price | 0:18 · frame 04 | ✅ LIVE, provable | hard rule at `agent-draft.ts:143` |
| Important decisions return to a human | 0:18 · frame 04 | ✅ LIVE | escalation by owner rules |
| Lead captured → clear next move | 0:24 · frame 05 | ✅ LIVE | `next_step` is stored |
| Lead follow-up, tracking, quote recovery, owner reporting | 0:28 · frame 06 | ✅ CORRECTLY MARKED PLANNED | three are `coming_soon`; reporting's nearest capability is `private_pilot` |
| `NEVAMIS.CA` / "Hear it answer" | 0:36 · frame 07 | ✅ EXISTS | "Hear it answer" already ships in `index.html` |

**No address. No scheduling. No time window. No booking or confirmation. No
"NEVAMIS AI". No pronunciation content.** Frame 03 deliberately shows
`NEXT STEP`, not a time — the product stores no requested time window.

## ⚠ One item needs your decision

**The tagline "Never miss the time that matters."**

It does **not** trip `lintCopy` — that matcher is a literal substring test and
none of the eleven banned strings appear. But `marketing.ts:84` bans
**"never miss a call"** with the reason *"absolute claim; the agent answers
eligible forwarded calls, not all calls."* The tagline is the same rhetorical
shape, one step abstracted.

I have **not** changed it — it is your line and it is arguably about *time*,
not call coverage, which is a materially weaker claim. But it will be read as
"never miss", and the codebase already ruled that shape unsupportable.

Options: (1) ship as written, accepting the adjacency; (2) `"Never miss the
work that matters."` — moves it off call-coverage entirely; (3) `"The work
moves. You still decide."` — the previously locked line, already cleared.
**Recommendation: (2).** It keeps your cadence and the "never miss" energy while
making the object of the sentence something the product genuinely protects.

## Secondary notes
- **WHO shows a business name** ("Northline Workshop"). `contact_name` is *"Caller's name as given"* — a caller may give a business name, so this is legitimate, but the label reads as person-or-business. Acceptable; flagged for awareness.
- The in-call agent line *"Is anything sparking or unsafe?"* is **illustrative**. Before it is voiced at Gate D it must be confirmed against the live agent prompt, or softened to a question the prompt actually asks.
- Narration is tight against 40s (96 + 21 words). Measure at Gate B; do not pre-emptively cut copy.
