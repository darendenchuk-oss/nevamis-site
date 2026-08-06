# Site audit: positioning Nevamis beyond one product

**Date:** 2026-08-05
**Scope:** nevamis.ca. Structural and positioning findings, plus what changed
this pass.

## The finding that shaped the work

**The multi-service story was already written, and filed as an absence.**

`index.html` already carried a section, `#beyond`, headed "The front desk is
where we start", naming Instant Lead Follow-Up, Automatic Lead Tracking and
Quote Recovery, each correctly labelled PLANNED. `coming-soon.html` already
carried a NOW / NEXT / FUTURE structure and an h1 reading "The front desk is
only the beginning."

Three things buried it:

1. `#beyond` sat 15th of 18 sections, after pricing and the risk reversal,
   immediately before the FAQ. A visitor decided what this company was long
   before reaching it.
2. The nav labelled the whole story "Coming soon", which reads as a gap in the
   product rather than a direction for the business. The page's own analytics
   event was already named `roadmap_front_desk_cta_clicked`, so the intent was
   there and the label had drifted from it.
3. The hero described a single product and nothing after it.

So this pass is elevation and framing. The honest version of "multi-faceted AI
integrator" is not a claim about a menu of services, because only the front
desk is real. It is a claim about the relationship: the first system is not
the last one. That is true today and provable.

## Changed this pass

| # | Change | Files |
|---|---|---|
| C1 | `#beyond` moved from 15th of 18 to immediately before pricing, so the expansion model is understood before the recurring fee is seen | home.html, index.html |
| C2 | Hero gained a subordinate line stating what happens after the front desk, deliberately smaller than the lede so the entry offer stays loudest | home.html, index.html |
| C3 | Nav label "Coming soon" became "Roadmap" across all 22 pages. URL, filename and sitemap entry unchanged, so no indexed URL or inbound link breaks | 22 files |
| C4 | `coming-soon.html` title became "Roadmap: the AI systems we are building next" | coming-soon.html |
| C5 | Banned phrase "most common" removed from the calling kit masterclass, an unsupported frequency claim that was failing the consistency guard | MASTERCLASS.md |

## Open findings, not fixed this pass

### O1. The nav is hand-copied into 22 pages

`_partials/nav.html` exists but nothing includes it. Every page carries its own
copy. The C3 rename had to touch 22 files, and a future rename will too.

This is the site's known failure mode: every truth gap previously found here
was a page missing from a hand-maintained list. A nav item added to some pages
and not others is invisible until a customer finds it.

**Recommendation:** either build the include at promote time, or add a guard
that fails when the 22 copies diverge. The second is cheaper and catches the
real risk.

### O2. Aphoristic cadence, six instances on the homepage

"Not an app. A configured system." / "Clear plans. No surprises." / "Cancel
anytime. No contracts." / "Seven live days on your after-hours line. No card."
and two more. Once is voice. Six is a tell.

I wrote a seventh into the hero this pass, caught it, and rewrote it. The
existing six are established converting copy on a live site about to receive
traffic from first sales calls, so rewriting them is a separate, deliberate
pass, not a side effect of this one.

### O3. `styles.css` is dead for the whole site

Only `brand/logo-gif.html` loads it. Every real page uses an inline `<style>`
block plus `assets/motion/site.css`. A `.lede` rule exists in both places with
different values, and the stylesheet's copy is the one that does nothing.

This cost real time this pass: a rule added to `styles.css` looked correct on
disk, matched a grep, and had no effect on the page. Probing computed style is
the only reliable check here.

**Recommendation:** delete `styles.css` or move `brand/logo-gif.html` onto the
real stylesheet, so there is one place to look.

### O4. Hero fold clearance is tight on a 640px phone

The mobile hero reorders with `display:contents` and explicit flex order
specifically because the stage once pushed "Call the live AI" below the fold.
The first version of the C2 line left **9 pixels** of clearance on a 360x640
viewport. Shortened, it now leaves 79.

**Anything added to the hero must be measured at 360x640 before it ships.**
Nine pixels is not a margin.

### O5. `home.html` and `index.html`

Not a defect. `home.html` is the staging source, `index.html` is its
promotion via `scripts/promote.mjs`, and the consistency guard verifies the
relationship using the same pure function the promoter uses, so the two cannot
drift apart unnoticed. This is well built.

Recorded because it is easy to mistake for duplication: I did, and briefly
tried to unpublish the source. Edits belong in `home.html`, followed by
`node scripts/promote.mjs`.

## Truth constraints that still bind

- Only `ai_front_desk` is a real capability. Everything in `#beyond` and on
  the roadmap page stays labelled PLANNED until it is not.
- No savings, ROI or margin claim is publishable. No provider-cost ledger
  exists, so any figure would be invented.
- `revenue-engine.html` is approval-blocked and stays that way.

## Verification

`npm run check`: consistency, site audit, Playwright, agent sync and agent
price drift all pass. Zero console errors. Hero hierarchy confirmed by
computed style at desktop (19px lede, 16px sub) and mobile flex order
confirmed at 375x812 and 360x640.
