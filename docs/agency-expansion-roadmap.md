# Agency expansion roadmap (internal; nothing here is publishable until live)

> **THE "Setup fee (draft)" AND "Monthly (draft)" COLUMNS ARE NOT NEVAMIS PRICING.**
> Noted 2026-08-10; restated for commercial model v7 on 2026-10-03. They are unapproved
> guesses for products that do not exist yet (CAPTURE+, CONVERT, OPERATE, GROW, OPTIMIZE,
> PARTNERSHIP) and no figure in them has been offered to anyone. The one row that IS live,
> CAPTURE, is the receptionist family, and what it sells today, with every figure of it, is in
> `pricing-config.js` and the engine's src/domain/canonical.ts: the Front Desk plans and The
> Works are each a monthly price alone, month to month from the first month, and only the
> Performance Partnership, by invitation, starts with a Launch & Implementation fee. There is
> no pilot. CAPTURE+ has since shipped as the Missed-Call Recovery module, so its draft figures
> below are history; its real price is in `pricing-config.js`. The C$249 in the OPERATE row is a draft monthly for a
> different product; it is NOT the retired C$249 receptionist tier, which is
> dead. Nothing in this table may be quoted to a prospect, and a setup fee for
> any of these pillars would need approving on its own before it could be.

Brand direction: "Nevamis builds AI growth systems for service businesses. The
front desk is where we start." Receptionist stays the flagship; the site's
architecture (nav, section structure, config files) already supports adding
pillar pages without rebranding.

| Pillar | Problem | First deliverable | Tools needed | Data needed | Compliance notes | Setup fee (draft) | Monthly (draft) | Measurement | Difficulty | Time to launch | Depends on | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CAPTURE (live flagship) | missed calls | AI receptionist | ElevenLabs, Twilio, Cal.com | business rules | call-recording notices | none on the Front Desk plans or The Works; the Partnership's Launch & Implementation fee is in pricing-config.js | per plan, in pricing-config.js | booked calls, summaries | — | live | — | **LIVE** |
| CAPTURE+ | missed texts | missed-call text-back | Twilio SMS | templates | CASL: existing-relationship messaging | C$250 | C$99 | callbacks recovered | low | weeks | receptionist client | **LIVE** as a module; draft figures superseded (see the banner) |
| CONVERT | leads go cold | follow-up + reminder sequences | Twilio/email provider | consent records | CASL consent + unsubscribe + sender ID | C$500 | C$199 | show rate, reply rate | med | 1–2 mo | CRM access | roadmap |
| OPERATE | admin drag | call/inbox summaries → CRM tasks | CRM API, email API | client CRM | data-minimization | C$500+ | C$249+ | tasks created, hours saved | med | 2 mo | integrations | roadmap |
| GROW | weak funnel | landing pages + attribution + review requests | analytics, review platforms | baseline metrics | review-solicitation rules | C$1000+ | C$399+ | attributed leads | med-high | 2–3 mo | tracking numbers | roadmap |
| OPTIMIZE | no feedback loop | call QA + funnel reporting + tuning | reporting stack | call outcomes | privacy in reporting | — | bundled | conversion lift | med | after GROW | data history | roadmap |
| PARTNERSHIP | wants outcomes | retainer + 7.5% attributed net-new revenue (first-transaction or 90-day window, capped) | full stack + attribution | CRM + payment data | **lawyer + accountant review REQUIRED before selling**; never % of total profit | custom | retainer + % | reconciled monthly attribution | high | 6+ mo | mature attribution | idea |

Rules: no empty service pages; a pillar gets a public page only when it has a
real deliverable, an approved price, and at least one satisfied use. Public
teaser allowed now: one honest "Built to grow with you" line (currently NOT on
the site; add only with owner approval).
