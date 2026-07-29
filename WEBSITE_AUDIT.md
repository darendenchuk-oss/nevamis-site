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
| F11 (was O6) | Fonts loaded from Google (privacy exposure, third-party dependency) | MED | Self-hosted woff2 (latin + latin-ext) on all 11 pages; privacy wording updated; browser-verified 0 Google requests. |
| F15 (was O10, partial) | Sitemap lastmod maintained by hand | LOW | scripts/gen-sitemap.mjs derives lastmod from git history. Vertical landing pages (WEB-061) still wait for sales evidence. |
| F14 (was O8, partial) | Booking was external-link only | MED | Inline Cal.com iframe embed with visible new-tab fallback and timezone note. Prequal prefill + UTM attribution passthrough added 2026-07-27 (Cal.com prefill params). Deeper CRM wiring (WEB-141) still queued. |
| F13 (was O7) | No OG/Twitter share images | MED | Branded 1200x630 og-default.png (SVG source committed) + og:image/twitter card tags on all 10 indexable pages. |
| F12 (was O12) | Cedarview Electric example call unlabeled at first exposure | MED | Card header now reads Example call with a fictional tag on index and demo; Prairie Mechanical was already labeled at both surfaces. |
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
| O9 | GitHub Pages cannot set CSP or other security headers | LOW | WEB-243, WEB-244 | EVALUATED 2026-07-27: stay on GitHub Pages for now. A Cloudflare free-tier proxy would add the headers at zero dollar cost but introduces a DNS and ownership dependency plus rollback complexity that a static brochure site does not justify pre-revenue (no auth, no forms posting to it, engine handles all sensitive surfaces with its own headers). Revisit at the first paying client. |


## Audit pass 2026-07-28 (full-site sweep)

Ran every existing guard, then audited what they structurally could not see.

### The finding that mattered

`scripts/check-consistency.js` hardcoded an eleven-page list while the site had
grown to twenty-two published pages. **Eleven pages were published and
unchecked**: every vertical landing page (electricians, hvac, plumbers,
restoration, after-hours-answering, missed-calls, vs-voicemail,
vs-answering-service, solutions) plus home.html and proposal.html.

The file already carried a comment explaining that exempting 404.html is
precisely why 404.html drifted. That lesson had been applied to one page rather
than to the pattern.

The page list is now **derived** from what Jekyll actually publishes, so a new
page is guarded the moment it exists. Documented no-chrome exemptions
(proposal.html) skip only the shared nav/footer comparison; every content rule
still applies to them.

Turning the guard on immediately caught 4 real bugs it had been blind to.

### Fixed

| # | Finding | Severity | Fix |
|---|---|---|---|
| A1 | check-consistency.js checked 11 of 22 published pages | HIGH | List derived from disk + _config.yml excludes |
| A2 | electricians/hvac/plumbers/restoration used non-canonical "free 7-day pilot" in a CTA | MED | Reworded to "7-day live pilot". These are the pages strangers land on from search, so the offer was named inconsistently at first contact |
| A3 | pricing/privacy/terms had og:image and a Twitter card but no og:title or og:description | MED | Added, mirroring each page's own title and description |
| A4 | 404.html had no meta description at all | MED | Added |
| A5 | 9 form inputs across book/coming-soon/revenue-engine had a placeholder but no accessible name (fails WCAG 3.3.2) | MED | aria-label on each; the coming-soon honeypot is aria-hidden and deliberately unnamed |

### Verified clean

- 19 pages crawled live: **0 non-200**, 0 broken assets, 0 failing external links
- 0 pricing drift, 0 stray phone numbers or emails, 0 unsupported traction claims
- Playwright: 55 passing before the changes

### Known and accepted

- `assets/vendor/three.module.js` is 1.28 MB but is referenced **only** by
  concept*.html, which `_config.yml` excludes from publishing (verified 404
  live). It is repo weight, not visitor weight.
- index.html and home.html are ~75 KB of HTML. That is the code-native hero, and
  it ships no framework, so the tradeoff is deliberate. Worth revisiting only if
  it shows up in real field data.
- proposal.html has no site nav by design: it is a document sent to one
  prospect, so navigation on it would be wrong rather than missing.

### New tooling

- `scripts/audit-unguarded.mjs` — measures guard coverage against every page
- `scripts/audit-links.mjs` — crawls the live site for 404s and broken assets
- `scripts/audit-truth.mjs` — prices, phones, emails and claims across all pages
- `scripts/audit-perf-a11y.mjs` — weight, headings, labels, alt text

All four are read-only and safe to run any time.

### Note for whoever runs these next

Four separate false-positive classes were hit and corrected while writing them:
a bare `/guarantee/` flags the honest disclaimer "not a guarantee"; nav
comparison must strip `aria-current="page"`; canonical and og:url are *supposed*
to be absolute; and 555-01xx phone numbers are the range reserved for fiction,
so their use in an example call is correct. If a rule here starts firing on
every page, suspect the rule before the site.
