# Nevamis Site Audit — 2026-07-23

Repo: `C:\Users\daren\nevamis-site` · Source of truth: `pricing-config.js` (approved 2026-07-23, Model B — free 7-day live pilot, plans C$249/C$449/C$849, setups C$500/C$750/C$1250, founding-client offer with 5 spots / setup waived). `coming-soon.html` does not exist. Nav is fully static per page (`site.js` injects no links).

## Nav/footer consistency

**Header nav inconsistencies**
1. "7-Day Pilot" nav link exists only on pricing.html:52 — missing from index (:56), demo (:39), book (:39), about (:39), privacy (:22), terms (:22), and pilot.html's own nav (:46), so pilot.html never marks itself `aria-current="page"` (every other content page does).
2. privacy.html:23-24 and terms.html:23-24 navs are missing "Pricing" (7 links vs 8/9 elsewhere).
3. 404.html has no header/nav and no footer — dead-ends except homepage + tel CTAs.

**Footer inconsistencies**
4. "Pricing" missing from footers of demo.html (:154-160), book.html (:95-101), about.html (:93-99); index.html:570 has it (likely stale pre-pricing-page copies).
5. "7-Day Pilot" footer link exists only on pilot.html:156 — index, demo, book, about omit it.
6. pilot.html footer (:154-159) drops "Solutions" and "Industries" — the only full footer that does.
7. pricing.html footer (:137-142) has no "Site"/contact columns; pricing, privacy, terms use a minimal base-row footer (©, Privacy, Terms) vs 4 pages with full footers.

**Minor label/attribute drift**
8. Nav says "Demo", footer says "Live Demo"; nav/footer say "7-Day Pilot" while pilot.html's breadcrumb JSON-LD (:19) and title say "7-Day Live Pilot".
9. "Call the AI" analytics attr: `hero_live_demo_call_click` on index (:63), `demo_phone_click` on demo/book/about/pilot, no `data-evt` on pricing (:54-55), privacy, terms.

**Markup bug found in passing**
10. index.html:243 — `<section class="light" id="how" data-spine` is missing its closing `>`; the following `<div class="wrap">` parses as section attributes, breaking the "How It Works" section — the target of every `/#how` nav link.

## Commercial copy consistency

**30-day guarantee (retired):** zero occurrences in any customer-facing .html — HTML fully complies (`docs\commercial-model-decision.md:36` confirms retirement). One trace remains in internal docs: `PRELAUNCH.md:34` still references "free 7-day pilot / month-to-month / 30-day…".

Also clean in all customer-facing HTML: `free trial`, `Free 7-day pilot` (capital F), `risk-free launch`, `$397`, hardcoded `C$449`. Plan prices on pricing.html and the index pricing preview render from `window.NV_PRICING`.

**Findings**
| # | File:Line | Issue |
|---|---|---|
| 1 | index.html:535 | "Plans start at $249 per month plus a one-time setup fee" — hardcoded price; matches config today but violates the config's "render from here" rule and uses `$` not `C$`. Goes silently stale on any change. |
| 2 | pricing.html:197 | Hardcoded "included 250" minutes in recommender copy (thresholds `est > 220`/`est > 900` at :196/:195 also tuned to current allowances). |
| 3 | book.html:74 | "free pilot week" — non-canonical; config name is "7-day live pilot". |
| 4 | index.html:536 | "7-day pilot" drops "live" from canonical name (minor). |
| 5 | pricing.html:52, pilot.html:156 | Link label "7-Day Pilot" vs pilot page's "7-Day Live Pilot" — pick one form. |

**Stale internal docs (contradict Model B):** `PRELAUNCH.md:9` presents retired Model A ("paid setup + 7-day risk-free launch") as recommended; `docs\payment-flow.md:9` same heading, and :31 references old "$300 setup / $397 monthly" (line notes it is superseded).

**Verified consistent:** pilot terms in terms.html:41 (no card / 60 min / 30 calls / day-eight end) match `pilot.caps`/`dayEight`; index.html:507 risk-reversal matches config; pilot.html:132 founding-client copy matches `foundingClient.offer`; index.html:494 tax/billing line matches `taxNote`.

## Live site state

- All 8 pages return 200 (`/`, demo, book, about, pricing, pilot, privacy, terms), as do motion.js, site.js, pricing-config.js. robots.txt allows all; sitemap.xml lists all 8 URLs, lastmod 2026-07-23.
- Homepage: `signalScene` (the **rejected** hero canvas) IS live in production; `sim`, "7-day live pilot", "Founding clients", "pricing-preview" all present.
- **Pricing is JS-only:** "249" appears nowhere in pricing.html static HTML — an inline script builds `"C$" + pl.monthly` from `pricing-config.js`. Browsers show C$249/month; curl/no-JS crawlers see no prices at all.
- pricing.html contains a hidden `id="draftBanner"` div ("DRAFT PRICING PREVIEW · Not approved for publication…", `hidden` attr set, JS/config-controlled).

## ElevenLabs agent current state

Agent: "Nevamis Demo Receptionist" (`agent_9101ky43tys1fswstde818j7j8wt`), phone +1 587 413 0035 (only workspace number). Backup: `C:\Users\daren\ai-assistant\elevenlabs\agent-backup-2026-07-23.json` (26,531 bytes).

- LLM gemini-2.5-flash @ temp 0.0; voice Will Shank (eleven_flash_v2, stability 0.4, sim 0.8); turn_timeout 7s, silence hangup 20s, max call 600s, 300 calls/day.
- Tools: end_call, transfer_to_number, plus 3 webhooks — notify_owner (Twilio SMS to Daren), book_meeting (cal.com 15-min intro), check_booking (dupe check by email before booking).
- Safety evaluation active, agent not blocked; recording on, unlimited retention, no PII redaction.
- Prompt (8,512 chars) covers identity disclosure, tone, product, ROI framing, pricing posture, objections, booking flow, hard prohibitions (never invent pricing/savings/clients/capabilities, never guarantee results).

**Pricing/pilot knowledge gap vs published website:**
- Prompt's PRICING section instructs deflection: pricing "depends on call volume", Daren scopes it on a call, "a fraction of a salaried receptionist" — **zero dollar figures anywhere** (no 249/449/849).
- **No pilot section at all** — zero mentions of "pilot", "trial", "7-day", or "seven".
- The website publishes C$249/C$449/C$849 tiers and a free 7-day live pilot. A caller who saw the site and asks the agent to confirm prices or pilot terms gets a deflection that contradicts the public pricing page. The NEVER rule ("never invent pricing") makes the agent actively refuse the published figures.

## Prioritized fix list

1. **index.html:243** — add the missing `>` on the `<section id="how">` tag (broken markup on the homepage's most-linked section).
2. **Agent prompt** — add the C$249/C$449/C$849 tiers and a 7-day live pilot section (sourced from pricing-config.js) so the agent confirms rather than contradicts the public pricing page; keep the scoping-call posture for edge cases.
3. **Homepage hero** — remove or replace the rejected `signalScene` canvas currently live in production.
4. **Nav** — add "7-Day Pilot" to all page navs (including pilot.html itself, with `aria-current`); add "Pricing" to privacy/terms navs.
5. **Footers** — add "Pricing" to demo/book/about; add "7-Day Pilot" to index/demo/book/about; restore "Solutions"/"Industries" on pilot.html; decide whether pricing.html gets the full footer.
6. **Hardcoded values** — render index.html:535 price line and pricing.html:197 minutes figure from `window.NV_PRICING`; fix `$249` → `C$` style.
7. **JS-only pricing** — add a static/noscript fallback (or build-time injection) so crawlers and no-JS visitors see prices.
8. **Naming** — standardize on one pilot name ("7-day live pilot" per config): fix book.html:74 "free pilot week", index.html:536, and "7-Day Pilot" link labels.
9. **404.html** — add standard header/nav and footer.
10. **Analytics** — unify "Call the AI" `data-evt` across pages; add it to pricing/privacy/terms.
11. **Internal docs** — update `PRELAUNCH.md` (incl. the remaining 30-day reference at :34) and `docs\payment-flow.md` to Model B.
