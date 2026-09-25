# The motion hero (retired)

Internal notes. This folder is excluded from the published site.

## What it was

Before the film homepage, `home.html` opened with an animated SVG hero: a call
arriving, the Nevamis arch drawing around it, ANSWER, QUALIFY, BOOK, TEXT, then
the mark settling into an idle loop. `assets/motion/hero.js` ran it, GSAP's
`MotionPathPlugin` moved the signal along the arch, and `assets/motion/debug.js`
was an inspector (`?motionDebug=1`) that scrubbed the hero's timeline.

## Why it is gone (2026-09-25, finding T13)

The film homepage replaced that hero (commit 47acb84 took the last `#mark` off
any page), and the homepage does not load `assets/motion/main.js` at all. But
every secondary page still loaded `main.js`, which imported `hero.js` and
registered the plugin, and each of those pages also carried a
`<script src="assets/vendor/MotionPathPlugin.min.js">` tag. `hero.js` returned
at once on a page without `#stage` and `#mark`, so every page view downloaded
about 20 KB gzipped to run one early return.

Deleted in the same change:

- `assets/motion/hero.js`, `assets/motion/debug.js`
- `assets/vendor/MotionPathPlugin.min.js`, its pin in
  `config/critical-surface.json`, and its `<script>` tag on every page (the
  generated content pages get their tail from `scripts/build-content.mjs`)
- the import, `registerPlugin`, `guard(initHero)` and the `hero.tl` debug hook
  in `assets/motion/main.js`

`scripts/check-published-surface.mjs` now fails when a file under
`assets/vendor/` is loaded by no published page, so an orphaned vendor script
cannot ship again unnoticed.

`tests/motion.spec.js`, which recorded the old hero and waited for
`window.__heroTL`, went too, with `isDebug()` and the `?motionDebug=1` override
in `assets/motion/tokens.js`: with no inspector left, that override only let a
link switch motion back on for a visitor who had asked for less.
`tests/reduced-motion-query.spec.js` holds that line.

## What `assets/motion/` does now

```
assets/vendor/     GSAP + ScrollTrigger (local copies)
assets/motion/
  tokens.js        durations, easings, reduced-motion and pointer checks
  main.js          wires the modules below; every init is guarded
  cursor.js        the custom cursor
  sonar.js, scroll.js, search.js, ...   the secondary-page flourishes
```

The site stays plain HTML on GitHub Pages and deploys with a single push.
