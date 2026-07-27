# PUBLIC CLAIMS LEDGER

Every material claim on a public Nevamis surface gets a row here before it ships.
A claim with no evidence gets revised, removed, or blocked. Nothing on this list
may be changed on the site without updating the row, and any new public promise
needs a row plus owner approval first. `scripts/check-consistency.js` enforces
banned phrasings mechanically; this ledger is the human layer above it.

Statuses: APPROVED (live, evidence current) / REVISED (wording changed to match
evidence) / REMOVED (taken off public surfaces) / REVIEW (needs evidence or an
owner decision) / BLOCKED (needs professional review before it may return).

Created 2026-07-26 under the Expert Council directive (WEB-002).

| ID | Claim | Where | Status | Evidence and notes | Verified |
|---|---|---|---|---|---|
| CLM-01 | Answers 24/7, any hour | index hero, demo | APPROVED | Demo line is ElevenLabs-hosted, always on. No uptime monitor yet; add one before stronger availability wording (WEB-045, WEB-125). | 2026-07-26 |
| CLM-02 | "It answers in seconds" | index, demo, coming-soon | REVISED | Was "answers on the first ring" in 5 spots, unsupported by monitoring. Replaced 2026-07-26 (commit 0774dd5). Mechanically true via Twilio ringback then ElevenLabs pickup; owner test calls confirm. | 2026-07-26 |
| CLM-03 | Live demo number (587) 413-0035 | index, demo | APPROVED | Number owned, imported to ElevenLabs, assigned to the demo agent; owner-verified by real calls. | 2026-07-26 |
| CLM-04 | Plans $249 / $449 / $849 CAD with listed setup fees, minutes, overages | pricing-config.js renders all surfaces | APPROVED | Owner-approved 2026-07-23; config is the single source of truth. | 2026-07-26 |
| CLM-05 | Pay As You Go $49/mo tier and annual prepay (2 months free) | pricing-config.js | APPROVED | Owner approved in writing 2026-07-26 ("i approve anything you do", following the explicit PAYG/annual question). | 2026-07-26 |
| CLM-06 | Free 7-day live pilot, no card, nothing charges when it ends | index, pilot, pricing | APPROVED | Commercial Model B decision (docs/commercial-model-decision.md); playbook updated 2026-07-25. The retired money-back guarantee must not return. | 2026-07-26 |
| CLM-07 | Founding offer: setup waived for the first 5 who continue | index, pricing | APPROVED | Owner-approved. Do not show a live "spots remaining" count unless a real counter exists (WEB-085). | 2026-07-26 |
| CLM-08 | GST/HST registration number on terms | terms.html | APPROVED | Owner confirmed registration 2026-07-25 (engine commit cf6222d); number owner-supplied. Keep the digits off every other surface. | 2026-07-26 |
| CLM-09 | Month-to-month, cancel anytime, price locked 12 months | pricing, terms | REVIEW | Must match the actual client agreement wording once counsel reviews it (WEB-005, WEB-191). | 2026-07-26 |
| CLM-10 | Revenue Engine private pilot and 30% gross-profit terms | revenue-engine.html | REVIEW | Directive requires one reconciled status and professional review of performance-fee terms before these stay public (WEB-161 to WEB-172). | 2026-07-26 |
| CLM-11 | "Client login" goes to app.nevamis.ca | all page headers | APPROVED | Deployed on Vercel with SSL; login and signup verified working 2026-07-26. | 2026-07-26 |
| CLM-12 | Workspace linked "usually the same day" after signup | app signup page | REMOVED | Unverified service-level promise. Replaced 2026-07-26 with review-then-email wording (engine commit 9f7b2ca). | 2026-07-26 |
| CLM-13 | ROI benchmark "50 to 70% of calls are real opportunities" | index calculator | REMOVED | No credible source. Replaced 2026-07-26 with a buyer-entered assumption (WEB-013). | 2026-07-26 |
| CLM-14 | Prairie Mechanical and Cedarview Electric examples | index, demo | APPROVED | Audited 2026-07-27: Prairie Mechanical labeled at both surfaces; Cedarview call card now labeled Example call (fictional) at first exposure on index and demo (commit 384d060). | 2026-07-27 |
| CLM-15 | "Applications open" and similar availability language | pilot, coming-soon | REVIEW | Keep only where founder capacity genuinely exists (WEB-016). | 2026-07-26 |
| CLM-16 | Privacy and terms content (retention, subprocessors, fonts) | privacy.html, terms.html | BLOCKED | Needs qualified Canadian review before being presented as final (WEB-181, WEB-191). Keep language generic until then. | 2026-07-26 |

