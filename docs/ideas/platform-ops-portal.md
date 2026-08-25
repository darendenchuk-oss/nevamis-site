# Platform, Ops App & Client Portal — 60 improvements

> **SUPERSEDED 2026-08-09 — the commercial model this file was written against no longer exists.**
> Ideas below were authored while Nevamis sold the C$249 / C$449 / C$849 ladder (plans named
> After Hours, Growth and Scale), a Pay As You Go tier at C$49 + C$1.95/min, annual prepay, a
> setup fee with a founding-client waiver, and a 7-day live pilot — free at first, then C$150.
> Every one of those is retired, and the single-recurring-price model that replaced them on
> 2026-08-09 was itself superseded by v4 (2026-08-22) and then by v5 (owner
> directive 2026-08-24). The current model is a
> one-time Launch & Implementation fee to start, then a monthly price:
> **The Works** C$3,000 to start, then C$2,100/month (1,400 included minutes, C$0.75/min overage);
> **AI Front Desk** (recommended) C$1,500 to start, then C$1,000/month (1,400 included minutes, C$0.75/min overage);
> **Performance Partnership** (invite-only) from C$2,500 to start, then C$350/month plus 10% of collected revenue directly attributable to qualified NEVAMIS-generated opportunities (250 included minutes, C$1.10/min overage).
> Sellable add-ons, each its own sale on its own three-month start:
> Missed-Call Recovery C$350/month, Quote-Chase Engine C$500/month, Get-Paid Autopilot C$500/month,
> Review Engine C$300/month — each with a one-time Launch & Implementation fee of its own
> (C$500, C$750, C$750, C$500).
> Terms: three months minimum on a plan alone, six with any add-on or The Works,
> then month to month on thirty days notice, with the price locked for twelve months.
> No pilot or trial at any price. `pricing-config.js` and the engine's
> `src/domain/canonical.ts` are the source of truth.
>
> The ideas are kept rather than deleted: most are about how a price is *presented*, and that work
> survives the change. But no figure, plan name or offer quoted below may be copied onto a surface,
> and any idea whose whole premise is a setup fee, a pilot, PAYG or annual prepay is moot.


Grounded in a full read of `C:/Users/daren/nevamis-engine` as it stands on 2026-07-27: the 19 `/ops` pages, the 4 `/portal` pages, `src/domain/{onboarding,onboarding-sops,queue,usage,portal-metrics,calls,escalation,agent-draft,email}.ts`, `src/components/usage-meter.tsx`, `src/lib/{mailer,portal,tenant,pii}.ts`, and `src/db/schema.ts`. The engine is genuinely well built — a live-computed action queue, a real readiness gate, drift detection, per-task SOPs, PII masking, a training gate, 253 tests. The gaps are not "more features"; they are (a) three places where live copy promises something the product does not have, (b) the free 7-day pilot — the actual sales wedge — has **no representation in the platform at all** (onboarding only exists after a signed, paid, closed-won deal), (c) almost every ops screen is scoped to one switched-to tenant, which quietly caps the founder at about one client's worth of attention, and (d) work that is recorded but never surfaced (usage alerts, `timeSpentMinutes`, decided account requests). These 60 are ordered roughly by theme, not priority; the impact-per-effort ranking is in the returned summary. Nothing here requires inventing a client, a number, or a testimonial.

---

## Honesty repairs — copy that currently outruns the product

1. `PLATFORM-OPS-PORTAL-001` **Build the client call log the portal already promises.** `src/app/portal/help/page.tsx` line 32 tells clients "every call's full recording and transcript are in your log", line 16 says "You can hear every recording in your call log", and `src/lib/mailer.ts` `agentReady` says "Your portal shows every call it handles, with recordings". There is no call log page in `/portal` — `PortalNav` in `portal-nav.tsx` has exactly four links (Overview, Performance, Business info, Help) and `calls`/`call_summaries` store no recording URL or transcript. Either ship `/portal/calls` (idea 2) or change all three copy blocks the same day; shipping a client onto a promise the portal cannot keep is the fastest way to lose the first one.
   impact 5/5 · effort 1/5 · touches: src/app/portal/help/page.tsx, src/lib/mailer.ts

2. `PLATFORM-OPS-PORTAL-002` **Ship `/portal/calls`: one row per call, newest first, with what happened.** Read `calls` joined to `call_summaries` for the portal tenant — date/time in Edmonton, caller name, intent, service, urgency, outcome (`booked` / `transferred` / `message` / `none`), and whether the booking was tool-confirmed. Add it to `PortalNav` as "Calls". This is the single artefact a trades owner will open every morning and the strongest retention surface the product can have; the data is already stored and already tenant-scoped.
   impact 5/5 · effort 3/5 · touches: new src/app/portal/calls/page.tsx, portal-nav.tsx, domain/portal-metrics.ts

3. `PLATFORM-OPS-PORTAL-003` **Store `recordingUrl` and `transcriptUrl` on `calls` and render a play button.** ElevenLabs post-call webhooks carry the conversation id; `src/domain/call-intake.ts` deliberately drops the transcript summary but nothing captures a link back to the recording. Add two nullable columns in a new migration, populate them in `src/app/api/webhooks/elevenlabs/route.ts`, and expose them on `/portal/calls` and `/ops/agent`. Without this, "listen to the recording" in `FLAG_HELP` (ops/agent/page.tsx lines 27-33) means an operator leaving the app and hunting in the ElevenLabs dashboard.
   impact 5/5 · effort 3/5 · touches: src/db/schema.ts, drizzle migration, api/webhooks/elevenlabs/route.ts, ops/agent/page.tsx

4. `PLATFORM-OPS-PORTAL-004` **Kill the permanent "Test data" badge once a real tenant exists.** `src/app/ops/layout.tsx` lines 60 and 102 hardcode `<span className="nv-badge is-warn">Test data</span>` in both the sidebar and the mobile bar. `tenants.simulated` already exists and the portal uses it correctly. Drive the ops badge off `tenant.simulated` too, so the day the first real client is linked the badge disappears for them and stays on Cedarview — otherwise the founder trains himself to ignore a warning that will one day be wrong in the dangerous direction.
   impact 3/5 · effort 1/5 · touches: src/app/ops/layout.tsx

---

## The pilot — the wedge the platform does not model

5. `PLATFORM-OPS-PORTAL-005` **Add a pilot lifecycle object so a 7-day pilot is a first-class thing.** `winDeal` in `src/domain/onboarding.ts` refuses to create any project until `assertCloseableWon` passes (agreement signed AND activation paid-or-waived AND authorized contact). A free pilot has none of those, so today a pilot client has no tenant, no task list, no portal, and no path into `/ops/day8`. Add a `pilots` table (tenantId, businessName, contact, startedAt, endsAt = start+7d, forwardingConfirmedAt, outcome enum `converted|declined|expired`) and a `startPilot()` that creates the tenant + profile + a short pilot task plan without touching the deals gate.
   impact 5/5 · effort 4/5 · touches: src/db/schema.ts, new src/domain/pilot.ts, src/app/ops/onboarding

6. `PLATFORM-OPS-PORTAL-006` **Give the pilot its own 6-step task plan, separate from `taskPlanFor()`.** The current plan (onboarding.ts lines 57-73) is a paid-implementation plan: business profile → calendar → configure → internal tests → client sign-off → readiness gate. A pilot needs: capture business facts (call or form) → build draft agent → run the seven test calls → confirm carrier forwarding (`docs/pilot/carrier-forwarding-guide.md` already exists) → pilot live → day-8 review booked. Branch on a `plan` argument so both plans live in one place.
   impact 4/5 · effort 2/5 · touches: src/domain/onboarding.ts

7. `PLATFORM-OPS-PORTAL-007` **Put a live pilot countdown on `/ops` Today.** A pilot that quietly runs to day 9 is revenue lost and a broken promise (terms say it ends day 8, silence never converts). Add a stat tile and a card: "Cedarview pilot — day 5 of 7, review call not booked", pulsing red from day 6 if no day-8 review is on the calendar. Today currently shows Urgent / In queue / Leads / Latest fee, none of which capture the only deadline the business actually has.
   impact 5/5 · effort 2/5 · touches: src/app/ops/page.tsx, src/domain/pilot.ts

8. `PLATFORM-OPS-PORTAL-008` **Make `/ops/day8` produce a client-facing PDF-printable report, not just talking points.** The page already computes real counts and picks "the call to play them" honestly. Add a `?print=1` layout (white background, Nevamis mark, business name, the five counts, the best-call line, and a one-line honest caveat about approximate after-hours) so the founder walks into the review call with a leave-behind. Pair it with the existing `docs/pilot/day7-pilot-report-template.md` so the doc and the generated page stop diverging.
   impact 4/5 · effort 2/5 · touches: src/app/ops/day8/page.tsx, src/app/globals.css

9. `PLATFORM-OPS-PORTAL-009` **Add a "pilot outcome" decision button that writes the record.** At the end of a day-8 review the founder needs one click: Converted (→ which plan), Declined (→ reason from a fixed list: price, not enough calls, wants a human, timing, other), or Extended. Today there is nowhere to record it, so the reason the first five pilots failed will live only in memory. Show a rolling pilot→paid conversion count on `/ops/weekly` once there are three or more.
   impact 4/5 · effort 2/5 · touches: src/app/ops/day8/page.tsx, src/domain/pilot.ts, src/app/ops/weekly/page.tsx

10. `PLATFORM-OPS-PORTAL-010` **Surface the pilot's own teardown checklist as tasks, not a markdown file.** `docs/pilot/pilot-end-teardown-checklist.md` exists as prose. When a pilot is marked declined or expired, auto-create the teardown tasks (unforward the number, release the Twilio number if unused, archive the draft agent, export and send their call log, delete or retain per the data-retention doc). A forgotten forwarded number after a declined pilot is a live liability and a monthly cost.
   impact 4/5 · effort 2/5 · touches: src/domain/pilot.ts, docs/pilot/pilot-end-teardown-checklist.md

11. `PLATFORM-OPS-PORTAL-011` **Add a portal pilot banner with the real end date and what happens on day 8.** For a tenant in pilot, show at the top of `/portal`: "Your free pilot runs to Aug 4. No card on file, nothing bills automatically. On day 8 it ends unless you pick a plan — we'll walk through your call log together first." This is the terms promise rendered where the client actually is, and it removes the number-one unspoken pilot anxiety.
   impact 4/5 · effort 1/5 · touches: src/app/portal/page.tsx

---

## Running ten clients from one screen

12. `PLATFORM-OPS-PORTAL-012` **Make `/ops` Today cross-tenant, like the queue already is.** `src/app/ops/page.tsx` line 22 uses `activeTenant(user)` and computes `opsSummary`/`actionQueue` for that one tenant, while `ops/layout.tsx` line 42 computes the urgent dot across `["nevamis-internal", ...tenants]`. The result is a sidebar that says 3 urgent and a Today page showing 1. Switch Today to the same all-tenant list and group cards by client name.
   impact 5/5 · effort 2/5 · touches: src/app/ops/page.tsx

13. `PLATFORM-OPS-PORTAL-013` **Build `/ops/clients` — the roster page that does not exist.** The only way to see all clients today is the `<select>` in the sidebar (`ops/layout.tsx` lines 65-73). Build a table: client, status (`active`/`paused`/`offboarded`), stage, days since start, open queue items, minutes used this period, last call date, plan, MRR. This is the screen that tells the founder at a glance which of ten clients is drifting — and it is entirely computed from rows that already exist.
   impact 5/5 · effort 3/5 · touches: new src/app/ops/clients/page.tsx, ops/layout.tsx nav

14. `PLATFORM-OPS-PORTAL-014` **Add a cross-client onboarding board.** `/ops/onboarding` renders exactly one tenant's project (`projectForTenant(db, tenant.id)`). Add a second view — a column per stage (`welcome → kickoff → discovery → configuration → testing → training → launch → hypercare → stabilized`), one card per client — so you can see that three clients are stuck in `configuration` without eight tenant switches.
   impact 4/5 · effort 3/5 · touches: src/app/ops/onboarding/page.tsx

15. `PLATFORM-OPS-PORTAL-015` **Give operators a "My tasks" page across every client.** `onboarding_tasks.assignedToUserId` and `assignedToName` exist and `distributeTasksAction` fills them, but the only place an assignment shows is a `YOURS` badge inside one tenant's board. A remote operator in Manila should sign in and land on their own list, every client, oldest first, with the SOP dropdown attached — that is the difference between an operator who needs supervision and one who does not.
   impact 5/5 · effort 3/5 · touches: new src/app/ops/mine/page.tsx, src/domain/assignment.ts, ops/layout.tsx

16. `PLATFORM-OPS-PORTAL-016` **Show elapsed time and an age badge on every onboarding task.** Tasks carry `createdAt`/`updatedAt` but the board shows neither. Render "in todo 6 days" in muted text and turn it amber past the SOP's own `minutes` estimate × a slack factor, red past 5 business days. Right now a task can sit untouched forever without ever entering the action queue, because `onboardingBlockers()` only returns tasks with an explicit `blocker` string.
   impact 4/5 · effort 2/5 · touches: src/app/ops/onboarding/page.tsx, src/domain/onboarding.ts

17. `PLATFORM-OPS-PORTAL-017` **Add stale-task detection to the action queue.** Extend `actionQueue()` in `src/domain/queue.ts` with a `task_stale` kind: any Nevamis-owned task in `todo`/`in_progress` for more than 3 business days, severity 2, `href: /ops/onboarding`, recommended "Do it, block it with a reason, or reassign." The queue's design comment says it is "a view of reality" — reality includes work that stopped moving without anyone declaring it blocked.
   impact 4/5 · effort 2/5 · touches: src/domain/queue.ts

18. `PLATFORM-OPS-PORTAL-018` **Record `timeSpentMinutes` — the column already exists and is never written.** `onboarding_tasks.timeSpentMinutes` is declared in schema.ts line 740 and referenced nowhere else in `src/`. Add a small number input beside the evidence textarea on the Mark-done form, then show a per-client "hours to onboard" total on `/ops/clients`. Once three clients are live this is the only honest input to the question "can I afford to onboard the fourth", and it feeds `docs/UNIT-ECONOMICS-2026-07-27.md` with measured rather than assumed numbers.
   impact 4/5 · effort 2/5 · touches: src/app/ops/onboarding/page.tsx + actions.ts, src/app/ops/clients/page.tsx

19. `PLATFORM-OPS-PORTAL-019` **Make the tenant switcher a keyboard-driven command palette.** The current switcher is a `<select>` plus a "Go" submit — two interactions plus a page reload, done dozens of times a day. Replace with a `Ctrl+K` overlay that fuzzy-matches client names and jumps straight to the same page for that client (`/ops/onboarding` for Cedarview stays `/ops/onboarding`). Small, but it is the single most-repeated action in the app.
   impact 3/5 · effort 3/5 · touches: src/app/ops/layout.tsx, new client component

20. `PLATFORM-OPS-PORTAL-020` **Persist the selected client per user, and show it in the page title.** `switchTenantAction` sets the active tenant, but the browser tab just says "Nevamis Ops" (metadata in `ops/layout.tsx` line 5) for every page and every client. With ten clients and several tabs open, the risk of doing Cedarview's work in Northgate's workspace is real. Render `{tenant.name} · Onboarding · Nevamis Ops`.
   impact 3/5 · effort 1/5 · touches: src/app/ops/layout.tsx, per-page generateMetadata

---

## Onboarding speed and reuse

21. `PLATFORM-OPS-PORTAL-021` **Ship per-trade business-profile starter templates.** `/portal/business` gives a client five empty textareas with generic placeholders. Add a "Start from a template" row — Electrical, HVAC, Plumbing, Restoration, Automotive — that pre-fills realistic *structure* (not facts): service lines with blank price ranges, an emergency definition stub, a "we do NOT do" line, five FAQ prompts. A trades owner filling a form at 9pm needs a shape to correct, not a blank page; this is the top of the funnel for `assembleDraft()`, which throws if hours/services/area are empty.
   impact 5/5 · effort 2/5 · touches: src/app/portal/business/page.tsx, new src/domain/trade-templates.ts

22. `PLATFORM-OPS-PORTAL-022` **Show the client a live "your AI will be able to answer this" preview as they type.** Below the Business info form, render the three or four caller questions their current text can already handle ("What are your hours?" ✓, "Do you do EV chargers?" ✓, "How much for a panel upgrade?" — needs a price). It converts an admin chore into a visible capability gain, and it directly raises the quality of the input `buildClientAgentPrompt()` receives.
   impact 4/5 · effort 3/5 · touches: src/app/portal/business/page.tsx

23. `PLATFORM-OPS-PORTAL-023` **Add a "copy setup from another client" action for same-trade onboarding.** When client six is an electrician and client two was an electrician, an operator should be able to clone the *structure* of the earlier profile and prompt (never the facts — those must be blanked and re-collected). Ship it as a staff-only button on `/ops/onboarding` that pre-fills `tenant_profiles` with section headers and the `we do NOT do` scaffold, with a mandatory review step before `generateAgentDraftAction` runs.
   impact 4/5 · effort 3/5 · touches: src/app/ops/onboarding/actions.ts, src/domain/agent-draft.ts

24. `PLATFORM-OPS-PORTAL-024` **Show the assembled draft prompt in-app before it is pushed to ElevenLabs.** `generateAgentDraftAction` currently creates the provider draft and returns a `?draft=` notice string. `assembleDraft()` already returns `{name, firstMessage, systemPrompt, tidied}` with no side effects — render that in a `<details>` with a diff of what Claude tidied versus the owner's raw notes, and require an explicit "Create draft in ElevenLabs" click. Reviewing a prompt before it exists provider-side is cheaper than deleting a bad draft after.
   impact 4/5 · effort 2/5 · touches: src/app/ops/onboarding/page.tsx + actions.ts

25. `PLATFORM-OPS-PORTAL-025` **Turn the seven test calls into a checklist with recorded results, not a prose SOP step.** `TASK_SOPS["Nevamis runs internal test calls against real scenarios"]` lists the seven scenarios in one step and asks the operator to paste a table into the evidence box. Render seven rows with PASS/FAIL radios and a notes field; store as JSON in `evidence`. It makes the test suite auditable, makes partial progress visible, and makes "six of seven passed" a queue item instead of a lost paragraph.
   impact 4/5 · effort 3/5 · touches: src/app/ops/onboarding/page.tsx, src/domain/onboarding-sops.ts

26. `PLATFORM-OPS-PORTAL-026` **Auto-fill the booking-verify step instead of asking for a pasted Cal.com id.** `/ops/agent` renders a text input labelled "Cal.com booking id" for every booked summary (agent/page.tsx lines 271-275). The ElevenLabs post-call payload contains the booking tool's result; capture the uid at ingest in `processCallWebhook` and make verification a single button. Manual id-pasting is exactly the kind of step that gets skipped at 11pm, and skipping it defeats the false-booking guard that is the product's best safety feature.
   impact 4/5 · effort 3/5 · touches: src/domain/calls.ts, api/webhooks/elevenlabs/route.ts, ops/agent/page.tsx

27. `PLATFORM-OPS-PORTAL-027` **Add a "forwarding confirmed" gate task with a test-call proof.** The riskiest moment in the whole flow is the client changing their carrier forwarding. Add a required task whose done-condition is "a real call to the client's published number reached the AI and appears in the call log", verified by looking for a `calls` row after `forwardingRequestedAt`. `docs/pilot/carrier-forwarding-guide.md` supplies the operator steps; the platform should supply the proof.
   impact 5/5 · effort 3/5 · touches: src/domain/onboarding.ts, src/app/ops/onboarding/page.tsx

28. `PLATFORM-OPS-PORTAL-028` **Send the onboarding emails that are already written.** `src/lib/mailer.ts` defines `workspaceLinked` and `agentReady` and the header comment says they are "wired at the send sites now so activation needs zero code changes" — but `NEVAMIS_EMAIL_MODE` defaults to `off`, so nothing has ever left. Complete the SPF/DKIM/DMARC steps in the file's own activation checklist, set the three env vars, and send one test. A client who verifies their email and then hears nothing until a human remembers is the leakiest part of the funnel.
   impact 5/5 · effort 2/5 · touches: env config, docs/EMAIL-DNS-AUDIT.md, src/lib/mailer.ts

29. `PLATFORM-OPS-PORTAL-029` **Add a third email template: "your business info needs three more things".** The most common stall is a half-filled `/portal/business`. `getTenantProfile` already computes which of the five sections are empty (`business/page.tsx` lines 27-28). Send a nudge naming exactly the missing sections, at 48h and again at 5 days, once and only once each, transactional (not marketing — CASL-safe because it is service delivery to a customer).
   impact 4/5 · effort 2/5 · touches: src/lib/mailer.ts, src/domain/automation.ts

30. `PLATFORM-OPS-PORTAL-030` **Add a client-side onboarding progress bar with the actual next step.** `/portal` shows nine stage badges and one "Up next:" line derived from `readiness.blockers`. Replace the badge row with "3 of 6 steps done" plus a single prominent next action and an honest "usually 2-3 business days from here" only if that is measurable from prior clients. The stage vocabulary (`discovery`, `hypercare`, `stabilized`) is internal jargon a trades owner will not parse.
   impact 3/5 · effort 2/5 · touches: src/app/portal/page.tsx

---

## Usage, billing and money clarity

31. `PLATFORM-OPS-PORTAL-031` **Put usage alerts into the action queue — they are recorded and shown nowhere.** `openUsageAlerts()` exists in `src/domain/usage.ts` lines 194-205 and is imported by nothing; `queue.ts` builds items from leads, statements, disputed lines, dead letters, quality reviews, onboarding blockers and escalations, but never usage. A client crossing 90% of their included minutes is a same-day commercial conversation (upgrade, or an overage they did not expect). Add a `usage_threshold` kind, severity 2 at 90 and 1 at 100.
   impact 5/5 · effort 1/5 · touches: src/domain/queue.ts, src/domain/usage.ts

32. `PLATFORM-OPS-PORTAL-032` **Stop depending on a page view to record usage alerts.** `checkUsageAlerts` is only called from `/portal/performance` and `/ops/billing` render paths. If nobody opens either page, no threshold is ever recorded and no alert can fire. Call it from a daily job (idea 52) across every active-subscription tenant so the record exists whether or not anyone looked.
   impact 4/5 · effort 2/5 · touches: src/domain/usage.ts, scripts/, cron

33. `PLATFORM-OPS-PORTAL-033` **Show the client their plan, price and renewal date in the portal.** The portal has no billing surface at all — a client cannot see what plan they are on, what it costs, or when it renews, while `/ops/billing` shows all of it to staff. Add a small card on `/portal/performance` beside the usage meter: plan name, C$X/mo, next renewal date, "month to month, email us to change". Trust in a recurring bill comes from it being visible, not from it being quiet.
   impact 4/5 · effort 2/5 · touches: src/app/portal/performance/page.tsx, src/domain/billing.ts

34. `PLATFORM-OPS-PORTAL-034` **Give the client a downloadable monthly call log and invoice.** `/api/export/calls?month=` and `/api/export/invoices?month=` already exist and are linked from `/ops/agent` and `/ops/billing` — both staff-only. Expose the tenant-scoped version in the portal so a client can hand their bookkeeper a CSV without emailing the founder. Reuse `src/lib/csv.ts` and gate on `portalTenantFor`.
   impact 3/5 · effort 2/5 · touches: src/app/api/export/*, src/app/portal/performance/page.tsx

35. `PLATFORM-OPS-PORTAL-035` **Add an overage forecast line to the usage meter.** `UsageMeter` shows minutes used, remaining, and estimated overage only once already over. At day 12 of a 30-day period with 62% used, the honest and useful sentence is "at this pace you'll finish around 155% of your included minutes — about C$X in overage." Compute it from `secondsUsed`, `period.start` and `period.end`, and label it explicitly as a projection so it never reads as a recorded number.
   impact 4/5 · effort 2/5 · touches: src/components/usage-meter.tsx, src/domain/usage.ts

36. `PLATFORM-OPS-PORTAL-036` **Handle the Pay As You Go plan in `planAllowance()`.** `planAllowance` returns `null` for any plan not in canonical pricing with `includedMinutes`, and the comment names pay-as-you-go explicitly. A PAYG client therefore sees "no active plan to meter" from `UsageMeter` despite being billed C$1.95 per connected minute — the plan where per-minute visibility matters most. Render a PAYG variant: minutes used this period × rate = running charge.
   impact 4/5 · effort 2/5 · touches: src/domain/usage.ts, src/components/usage-meter.tsx

37. `PLATFORM-OPS-PORTAL-037` **Show the annual-prepay position for clients on the 10-months-for-12 deal.** Canonical pricing offers 2490/4490/8490 annual. A prepaid client's `subscriptions.monthlyCents` view in `/ops/billing` will read as a monthly figure and misstate the relationship. Add a `billingInterval` field and render "Annual prepay, paid to 2027-03-14 (7 months remaining)" in both ops and portal so renewals are never a surprise on either side.
   impact 3/5 · effort 2/5 · touches: src/db/schema.ts, src/domain/billing.ts, ops/billing + portal

38. `PLATFORM-OPS-PORTAL-038` **Add a GST line to the invoice export and the billing view.** The business is GST/HST registered (705729200 RT0001) and Alberta GST is 5%. `billing_invoices.amountCents` is a single figure with no tax split, and `/api/export/invoices` feeds bookkeeping and GST filing per its own link text on `/ops/billing`. Store subtotal, GST and total separately before the first real invoice, not after.
   impact 4/5 · effort 3/5 · touches: src/db/schema.ts, src/domain/billing.ts, api/export/invoices

39. `PLATFORM-OPS-PORTAL-039` **Make `/ops/revenue` honest about being empty rather than seeded.** With zero paying clients, the revenue page renders demo statements. Add a top banner that reads the `tenants.simulated` flag and says plainly "Cedarview Electric is a demo workspace — every figure below is synthetic." The founder knows; anyone he ever screen-shares this with does not, and an unlabelled demo number is the easiest accidental lie to tell.
   impact 4/5 · effort 1/5 · touches: src/app/ops/revenue/page.tsx

40. `PLATFORM-OPS-PORTAL-040` **Add a monthly close checklist screen driven by `docs/MONTHLY-CLOSE.md`.** That doc exists as prose. Render it as a dated checklist per month (export invoices, reconcile Stripe, file GST if quarter-end, verify usage totals, back up the DB) with checkmarks stored in the DB so a missed month is visible. Solo founders miss finance admin, and the app is where he already is.
   impact 3/5 · effort 3/5 · touches: new src/app/ops/close/page.tsx, docs/MONTHLY-CLOSE.md

---

## Call review tooling

41. `PLATFORM-OPS-PORTAL-041` **Give every call a permalink and a detail page.** `/ops/agent` renders `summaries.slice(0,10)` with no ids in the URL, no pagination and no filters, hardcoded to `tenantId = "nevamis-internal"`. Build `/ops/calls/[id]`: full summary fields, quality flags with their `FLAG_HELP` text, the linked lead, booking-verify state, and a resolve form. An escalation or a client email needs a link to a specific call, and there is no way to produce one today.
   impact 4/5 · effort 3/5 · touches: new src/app/ops/calls/[id]/page.tsx, ops/agent/page.tsx

42. `PLATFORM-OPS-PORTAL-042` **Make the AI Front Desk page per-tenant instead of hardcoded.** `AGENT_REF` is a module constant (`ops/agent/page.tsx` line 16) and every query filters on `INTERNAL = "nevamis-internal"`. With two clients this page is structurally wrong: each client has their own agent, own drift baseline, own quality queue. Move the agent ref onto the tenant (or a `tenant_agents` table) and drive the page off `activeTenant`. This is the single biggest blocker to client number two.
   impact 5/5 · effort 4/5 · touches: src/db/schema.ts, src/app/ops/agent/page.tsx + actions.ts, src/lib/elevenlabs.ts

43. `PLATFORM-OPS-PORTAL-043` **Add filters and paging to the call list: flagged only, emergencies, unconfirmed bookings, date range.** Ten clients at even 5 calls a day is 50 rows daily against a hardcoded `limit(10)`. The useful default view is "everything that needs a human", not "the last ten of everything".
   impact 4/5 · effort 2/5 · touches: src/app/ops/agent/page.tsx or new /ops/calls

44. `PLATFORM-OPS-PORTAL-044` **Compute a weekly agent scorecard from real flags.** Per client, per week: calls answered, % with a confirmed booking, % flagged, flag breakdown, average duration. All of it derives from `calls` + `call_summaries` rows that already exist. This is what turns "the agent seems fine" into a number the founder can act on and, later, show a client — and it must render "not enough calls yet" rather than a misleading percentage below a floor of about 20 calls.
   impact 4/5 · effort 3/5 · touches: new src/domain/agent-scorecard.ts, src/app/ops/weekly/page.tsx

45. `PLATFORM-OPS-PORTAL-045` **Alert on the silence case: an active client with zero calls in 48 hours.** Every existing signal fires on something happening. The worst failure — forwarding dropped, number misconfigured, agent down — produces no rows at all and therefore no queue item. Add a `no_calls` queue kind for any tenant whose project status is `launched` and whose last `calls.startedAt` is older than 48h, severity 1, recommended "Call their published number yourself right now."
   impact 5/5 · effort 2/5 · touches: src/domain/queue.ts

46. `PLATFORM-OPS-PORTAL-046` **Let the client flag a call from their own log.** On `/portal/calls`, one button per row: "Something's wrong with this call." It writes an escalation with `category: agent_issue`, `source: app`, and a link to the call — feeding the existing escalation machinery including the owner SMS. Clients notice agent problems before any dashboard does, and today their only channel is composing an email.
   impact 4/5 · effort 2/5 · touches: src/app/portal/calls, src/domain/escalation.ts

47. `PLATFORM-OPS-PORTAL-047` **Add a "false booking" resolution workflow, not just a flag.** `booking_claimed_without_tool_confirmation` opens a high-severity review with good explanatory text, but resolving it is a free-text note. Make the resolution a structured choice — booking existed / booked manually after callback / customer lost — so the rate of each becomes measurable. If "customer lost" ever appears twice, that is a product-stopping signal that deserves to be countable.
   impact 3/5 · effort 2/5 · touches: src/app/ops/agent/actions.ts, src/db/schema.ts

---

## Escalation inbox

48. `PLATFORM-OPS-PORTAL-048` **Add an SLA breach escalation into the action queue.** `/ops/escalations` renders an age badge past 24h and 72h, and `SUPPORT-SLA.md` commits to "owner acts same day" for high and "immediately" for critical — but nothing pushes an aging escalation anywhere the founder will see it. Add a queue item at 12h for critical and 24h for high so the SLA is enforced by the system that recorded the promise.
   impact 4/5 · effort 1/5 · touches: src/domain/queue.ts

49. `PLATFORM-OPS-PORTAL-049` **Let the owner decide an escalation by SMS reply.** `escalations.smsStatus` shows the owner is already texted via `ownerSmsAvailable()`. Add a Twilio inbound webhook that maps a reply of `OK <id-prefix>` to `decideEscalationAction(approved)` and `NO <id-prefix> <note>` to rejected. A one-person business that can clear a critical escalation from a truck at a job site is meaningfully faster than one that cannot.
   impact 4/5 · effort 4/5 · touches: new api/webhooks/twilio/route.ts, src/domain/escalation.ts

50. `PLATFORM-OPS-PORTAL-050` **Show operators the resolved escalations they raised, with the reasoning.** `listEscalations` scopes operators to their own, and a rejected escalation carries `ownerNote`. Surface a "what the owner decided and why" digest on the operator's landing page — it is the cheapest training loop available, and it stops the same escalation being raised a fourth time.
   impact 3/5 · effort 2/5 · touches: src/app/ops/escalations/page.tsx, new /ops/mine

51. `PLATFORM-OPS-PORTAL-051` **Add a saved-decisions library so repeat escalations resolve themselves.** After the same category+pattern is decided three times the same way, the proposed-resolution block should show "you decided this before — here is what you said" above the AI/playbook steps. `resolutionJson` and `ownerNote` already store everything needed. This is how one person absorbs ten clients' worth of judgement calls.
   impact 4/5 · effort 3/5 · touches: src/domain/escalation.ts, src/app/ops/escalations/page.tsx

---

## Automation, reliability and the ten-client ceiling

52. `PLATFORM-OPS-PORTAL-052` **Run a real daily job instead of relying on page loads.** Several correctness-relevant computations only happen when a human opens a page: `checkUsageAlerts`, the interest-request 7-day count, drift capture (a manual button on `/ops/agent`). Add a single authenticated cron endpoint (`POST /api/cron/daily` with a shared secret, or Vercel Cron) that runs usage checks, drift capture, stale-task scan and the no-calls check, and writes a run record so a silent failure is visible.
   impact 5/5 · effort 3/5 · touches: new src/app/api/cron/daily/route.ts, vercel.json, src/domain/automation.ts

53. `PLATFORM-OPS-PORTAL-053` **Send the founder one morning digest SMS or email.** One message at 7am Edmonton: urgent count, pilots by day number, any client with zero calls in 48h, any usage over 90%, escalations older than the SLA. `src/lib/weekly.ts` and `/ops/weekly` already compute most of this; the missing piece is delivery. The goal is that not opening the app for a day is safe.
   impact 5/5 · effort 3/5 · touches: src/lib/mailer.ts or twilio.ts, api/cron/daily

54. `PLATFORM-OPS-PORTAL-054` **Add an uptime check on the one thing that matters: can the number be reached.** `docs/UPTIME-MONITORING-DECISION.md` exists; `/ops/integrations` probes ElevenLabs, Cal.com and Stripe credentials live, which proves keys work, not that a caller gets answered. Schedule a synthetic call (or at minimum a Twilio number-status check) and record the result, so "our line was down for six hours" is something the founder learns before the client does.
   impact 5/5 · effort 4/5 · touches: src/lib/provider-health.ts, api/cron, src/app/ops/integrations/page.tsx

55. `PLATFORM-OPS-PORTAL-055` **Automate the database backup that is currently a script somebody has to remember.** `scripts/db-backup.mts` and `src/db/backup.ts` exist and `backups/` holds a single file from 2026-07-27. Wire it to the daily cron with off-box storage and show "last backup: 14h ago" on `/ops/webhooks` or a status strip. One SQLite/Turso loss with real client call history is an unrecoverable business event.
   impact 4/5 · effort 3/5 · touches: scripts/db-backup.mts, api/cron/daily, ops status surface

56. `PLATFORM-OPS-PORTAL-056` **Make webhook failure loud instead of a page you have to visit.** `/ops/webhooks` is the receipt inbox and is genuinely useful — but only if opened. Add a queue item when an unprocessed or unverified webhook is older than 30 minutes, and when zero webhooks arrived in 24h for a launched client. The page's own help text says "if a call ended and no receipt appears here, the webhook never arrived" — encode that sentence as a check.
   impact 4/5 · effort 2/5 · touches: src/domain/queue.ts, src/app/ops/webhooks/page.tsx

57. `PLATFORM-OPS-PORTAL-057` **Add a client pause / offboard flow that matches the SOP.** `tenants.status` supports `paused` and `offboarded` and `docs/OFFBOARDING-SOP.md` exists, but no UI sets either. Add a staff action that pauses billing, marks the tenant, freezes the portal to a read-only "your service is paused" state, and creates the teardown tasks. Doing this by hand across Stripe, Twilio, ElevenLabs and the DB is exactly where a solo operator makes an expensive mistake.
   impact 4/5 · effort 3/5 · touches: src/domain/admin.ts, src/app/ops/clients, src/app/portal/layout.tsx

58. `PLATFORM-OPS-PORTAL-058` **Add a data-export-on-request button per client.** `docs/DATA-RETENTION.md` and the privacy policy commit to returning or deleting a client's data on request "well within PIPA's 45 days". Make it one staff action that produces a zip of that tenant's calls, summaries, leads and profile, plus a recorded audit event. A promise that requires bespoke engineering to honour is a promise that gets honoured late.
   impact 3/5 · effort 3/5 · touches: src/app/ops/clients, src/lib/csv.ts, src/domain/admin.ts

59. `PLATFORM-OPS-PORTAL-059` **Wire the "request a change to my agent" loop into the portal.** `/portal/business` tells clients to change their info "and tell us" — an unstructured email that lands in a personal inbox and bypasses every queue in this app. Detect a saved profile change on a launched tenant, create a Nevamis task ("Re-configure and re-test agent for <client>: hours changed"), and show the client "we've received your change — we re-test before it goes live on calls," which matches the deliberately-unpromised timing in `SUPPORT-SLA.md`.
   impact 5/5 · effort 3/5 · touches: src/app/portal/business/actions.ts, src/domain/onboarding.ts, src/domain/queue.ts

60. `PLATFORM-OPS-PORTAL-060` **Version `tenant_profiles` so an agent change is always traceable to what changed.** The table has one row per tenant with `updatedAt`/`updatedByName` and no history, so when an agent starts quoting a wrong price there is no way to see what the profile said last week. Add a `tenant_profile_versions` append-only table written on every save, and show a diff on the ops side. Given that `buildClientAgentPrompt()` is generated verbatim from this text, it is the product's actual source of truth and deserves the same change control the agent manifests already get.
   impact 4/5 · effort 3/5 · touches: src/db/schema.ts, src/domain/profile.ts, src/app/ops/onboarding/page.tsx
