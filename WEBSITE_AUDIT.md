# WEBSITE AUDIT

Dated audit of nevamis.ca against the Expert Council directive (2026-07-26).
Predecessor: docs/site-audit-2026-07-23.md (kept for history). Claims move to
docs/CLAIMS-LEDGER.md; this file tracks structural and technical findings.
Statuses: FIXED / STALE (directive claim disproven by newer evidence) / OPEN.

## Fixed this pass (2026-07-26, commits 0774dd5 and engine 9f7b2ca)

| # | Finding | Severity | Resolution |
|---|---|---|---|
| F1 | Reveal system could blank the whole site: site.js removed the no-js safety class then read localStorage unguarded; any throw left every .reveal at opacity 0 | CRITICAL | site.js and motion.js now guard storage/matchMedia/fetch, use callable feature checks, and wrap in fail-open try/catch that restores no-js. Proven with storage-blocked and forced-crash test pages: 0 hidden sections in every mode. Verified live. |
| F2 | "Answers on the first ring" (5 spots) unsupported by monitoring | HIGH | Reworded to "answers in seconds" (CLM-02). |
| F3 | ROI calculator carried an unsupported 50 to 70% benchmark | HIGH | Buyer-entered assumption now (CLM-13). |
| F4 | pricing.html fallback banner said "Not approved for publication" to non-JS readers | MED | Neutral wording. |
| F5 | app.nevamis.ca greeted clients as an "invite-only Nevamis Ops console" while offering public signup; no noindex; no legal links; unverified same-day promise | HIGH | Engine: neutral brand + per-area titles, dual-audience login copy, review-then-email signup copy, robots noindex on the app domain, Terms/Privacy links and agree line. |
| F6 (was O1) | Internal docs/ and config/ trees publicly served by GitHub Pages | HIGH | _config.yml Jekyll exclude list; verified live 2026-07-26: internal paths 404, ring.xml and pricing-config.js still 200. |
| F7 (was O2) | Stale guarantee-era docs contradicted Model B | MED | SUPERSEDED banners on all five docs plus README offer line fixed; also no longer public per F6. |
| F8 (was O3) | Pricing invisible to non-JS readers and failed-config loads | MED | Static fallback is real HTML removed only after successful render (both states browser-verified); check-consistency.js now fails on numeric drift between fallback and pricing-config.js. |
| F9 (was O11) | 404 page lacked recovery links | LOW | Live demo / Pricing / Pilot / Book links added. |
| F10 (was O5) | Coming-soon interest form was a mailto: with no lead record or attribution | MED | Engine POST /api/interest (CORS allowlist, honeypot, 10/hr rate limit, dedupe-by-email, 6 route tests) + form posts with modules/UTM attribution, mailto fallback kept. Live-verified 2026-07-27: preflight 204, created, then updated on repeat. |

Verified same day, recorded in engine docs/OWNER_ACTIONS.md: Stripe is FULLY
ACTIVATED (live charges and payouts). Twilio Trust Hub is still REJECTED
(owner resubmission required).

## Stale directive claims (do not act on these)

| # | Directive claim | Reality |
|---|---|---|
| S1 | GST/HST number is unverified and must be removed | Owner confirmed registration 2026-07-25 (engine commit cf6222d) and supplied the number. It stays (CLM-08). |
| S2 | Portal and console are local-only; CI reports 229 tests | app.nevamis.ca is deployed (Vercel, SSL). 253 tests; CI green since 2026-07-26. |

## Open items, dependency ordered

| # | Finding | Severity | WEB refs | Note |
|---|---|---|---|---|
| O4 | nvEvents analytics queue is inert; no delivery, no funnel measurement | MED | WEB-249 to WEB-253 | Needs an approved destination plus consent alignment before wiring. |
| O6 | Fonts load from Google; privacy page references that processing | MED | WEB-036, WEB-188 | Self-host and subset; update privacy wording with it. |
| O7 | Open Graph and Twitter share images incomplete; thin metadata on pricing/privacy/terms | MED | WEB-221, WEB-222 | Branded share images at correct dimensions; test previews. |
| O8 | Booking opens external Cal.com instead of an inline embed; no prequalification fields | MED | WEB-137 to WEB-148 | Embed with external fallback; add 3 to 5 qualifying fields. |
| O9 | GitHub Pages cannot set CSP or other security headers | LOW | WEB-243, WEB-244 | Evaluate a small edge layer only with cost and rollback documented. |
| O10 | Sitemap dates maintained by hand; no vertical landing pages | LOW | WEB-226, WEB-061 | Generate lastmod from deploys; vertical pages wait for sales evidence. |
| O12 | Fictional-example labeling not verified at first exposure on every surface | MED | WEB-015, WEB-047 | Audit each occurrence (CLM-14). |

