/* ============================================================
   DOES THE HERO STAGE STILL REACH THE FOLD?

   The mobile hero stacks the copy ABOVE the decorative stage, so every line
   of copy added to the hero pushes #stage further down. assets/motion/hero.js
   observes the stage at threshold 0.02: the stage has to be about 2% in view
   at load or the observer's opening callback reports "not intersecting".

   That opening callback used to skip the whole film to its final frame, and
   on a 375x812 phone the stage started at y=857 and the cinematic hero never
   played on the commonest small phone. It looked correct, because the frame
   it skipped to is the frame the film ends on. `stageHasBeenSeen` guards that
   branch now, so a below-fold stage no longer kills the film outright, but
   the visible consequence is unchanged: a visitor who never scrolls sees a
   still hero where the design intends a moving one.

   So this measures the thing directly rather than trusting a copy diff:

     stageTop     where #stage starts, in CSS px from the top of the page
     visible px   how much of the stage is inside the fold at load
     at load      what hero.js's observer would report before any scrolling
     on scroll    the same question after the stage is scrolled into view
     film end     the timeline's progress once it settles: 1 means it finished
     took         how long that took, polled rather than assumed
     arch         opacity of the resting mark, which must always be painted

     NV_PORT=3272 node scripts/measure-hero-fold.mjs [--label=before]

   A STAGE BELOW THE FOLD IS AN ACCEPTED STATE, NOT A DEFECT. Owner ruling,
   2026-08-28: "Do not sacrifice the mobile navigation to force decorative
   animation above the fold at 360x640." At that size the priority order is
   brand and usable navigation, then an understandable headline, then the
   primary action, then supporting copy, and the visual stage LAST. The stage
   may begin below the initial fold and activate when the visitor scrolls it
   into view.

   So do not "fix" 360x640 by hiding .hero-links or trimming navigation. That
   remedy was proposed by this lane and rejected by name. 360x640 not reaching
   the stage on load is recorded, expected, and correct.

   WHAT IS STILL A DEFECT, and what this file therefore checks:

     1. A width that CLEARS the fold losing ground. That is the regression this
        file was written for: making the scan the hero's primary widened the
        CTA row past one line, cost 63px, and took 375x812 from 21 visible
        pixels to zero. Measured before it shipped rather than after.

     2. The stage never activating AT ALL. Beginning below the fold is fine;
        never starting is not. So every width is additionally scrolled to the
        stage and asked whether the observer fires and the film runs, which is
        the thing the owner's ruling actually depends on being true.

   Exit 0 = no width lost ground and every stage activates on scroll.
   Exit 1 = a width lost ground, a stage failed to activate, or #stage is gone.
   ============================================================ */
import { chromium } from '@playwright/test';

const PORT = Number(process.env.NV_PORT || 3272);
const BASE = `http://127.0.0.1:${PORT}`;
const label = (process.argv.find((a) => a.startsWith('--label=')) || '--label=run').split('=')[1];

/* 375x812 is the case the hero.js comment records as the one that broke, and
   390x844 is the common modern phone. 360x640 is the floor the motion suite
   already tests layout at. */
const WIDTHS = [[360, 640], [375, 812], [390, 844]];

/* Measured on rebuild/site-ia, 2026-08-28, after the owner's CTA hierarchy
   landed. `visiblePx` is the number that matters; `stageTop` is recorded so a
   reader can see WHY it moved. For reference, the same page before that
   change: 360x640 stageTop 834 / 0px, 375x812 stageTop 791 / 21px,
   390x844 stageTop 772 / 72px. Every width improved.

   360x640 is 0 BY DESIGN, not by neglect. It is in the matrix because the
   ruling says to keep it there and because its scroll activation is checked
   below, not because the 0 is waiting to be turned into a number. Raise the
   others when the page genuinely gets better, which is the point of a ratchet.
   `SLACK` absorbs sub-pixel and font-metric noise; the measurement repeated
   identically across runs, so it is deliberately small. */
const BASELINE = { '360x640': 0, '375x812': 110, '390x844': 160 };
const SLACK = 4;

/* Widths where the stage beginning below the fold is the accepted outcome.
   Named rather than inferred from `BASELINE === 0`, so that a width which
   accidentally falls to zero is still reported as lost ground instead of
   quietly joining the accepted list. */
const BELOW_FOLD_IS_FINE = new Set(['360x640']);

const browser = await chromium.launch();
const rows = [];
let bad = 0;

for (const [w, h] of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/home.html');
  /* Read the geometry BEFORE anything is allowed to scroll: this is the
     question "what does a visitor see at load", not "after a read-through". */
  const geo = await page.evaluate(() => {
    const s = document.getElementById('stage');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const vh = window.innerHeight;
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    return {
      stageTop: Math.round(r.top + window.scrollY),
      stageHeight: Math.round(r.height),
      viewport: vh,
      visiblePx: Math.round(visible),
      fraction: Number((visible / Math.max(1, r.height)).toFixed(4)),
    };
  });
  if (!geo) { console.error(`${w}x${h}: no #stage on the page at all`); bad++; await ctx.close(); continue; }

  /* What hero.js's own observer would report, asked the same way it asks. */
  const intersecting = await page.evaluate(() => new Promise((resolve) => {
    const io = new IntersectionObserver(([e]) => { io.disconnect(); resolve(e.isIntersecting); },
      { threshold: 0.02 });
    io.observe(document.getElementById('stage'));
  }));

  /* And whether the film actually ran, without touching the page. */
  let filmPlayed = null;
  try {
    await page.waitForFunction(() => !!window.__heroTL, { timeout: 5000 });
    const a = await page.evaluate(() => window.__heroTL.progress());
    await page.waitForTimeout(1400);
    const b = await page.evaluate(() => window.__heroTL.progress());
    filmPlayed = b > a || b >= 1;
  } catch { filmPlayed = 'no timeline'; }

  /* ACTIVATION ON SCROLL. The owner's ruling permits the stage to start below
     the fold precisely BECAUSE it activates when scrolled to, so that promise
     is the thing worth proving. Scroll the stage into view and ask hero.js's
     own observer, the same way it asks, plus whether the film reached its end
     rather than sitting frozen at the frame it started on. */
  const activation = await page.evaluate(async () => {
    const stage = document.getElementById('stage');
    stage.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 400));
    const seen = await new Promise((resolve) => {
      const io = new IntersectionObserver(([e]) => { io.disconnect(); resolve(e.isIntersecting); },
        { threshold: 0.02 });
      io.observe(stage);
    });
    /* POLL, do not sleep a guessed duration. A fixed 2.6s wait reported the
       film "stuck" at progress 0.77 at all three widths on the first run of
       this check, which was the check being wrong rather than the page: the
       opening film is about six seconds and it was simply mid-play. Waiting
       for the actual end also makes this robust to the film's length changing. */
    const t0 = performance.now();
    let progress = null;
    if (window.__heroTL) {
      while (performance.now() - t0 < 15000) {
        progress = window.__heroTL.progress();
        if (progress >= 1) break;
        await new Promise((r) => setTimeout(r, 150));
      }
      progress = Number(window.__heroTL.progress().toFixed(3));
    }
    return {
      seen,
      progress,
      finishedInMs: Math.round(performance.now() - t0),
      /* The resting mark must be painted whatever the timeline did. */
      arch: Number(getComputedStyle(document.getElementById('archFull')).opacity),
    };
  });

  rows.push({ size: `${w}x${h}`, ...geo, intersecting, filmPlayed, activation });
  await ctx.close();
}

await browser.close();

console.log(`\nHERO FOLD, ${label}  (threshold hero.js observes at: 0.02)\n`);
console.log('  viewport   stageTop  stageH  visible px  baseline  at load   on scroll  film end  took    arch');
for (const r of rows) {
  const base = BASELINE[r.size];
  console.log('  ' + r.size.padEnd(10)
    + String(r.stageTop).padEnd(10)
    + String(r.stageHeight).padEnd(8)
    + String(r.visiblePx).padEnd(12)
    + String(base === undefined ? '-' : base).padEnd(10)
    + String(r.intersecting).padEnd(10)
    + String(r.activation.seen).padEnd(11)
    + String(r.activation.progress).padEnd(10)
    + (r.activation.finishedInMs + 'ms').padEnd(8)
    + String(r.activation.arch));
}
console.log('');

for (const r of rows) {
  const base = BASELINE[r.size];

  /* 1. Lost ground at a width that clears the fold. */
  if (base === undefined) {
    console.log(`NOTE: ${r.size} has no recorded baseline; record one if it should be held.`);
  } else if (r.visiblePx + SLACK < base) {
    console.error(`FAIL: ${r.size} shows ${r.visiblePx}px of the stage at load, down from a recorded ${base}px. `
      + `Something above the stage got taller. The hero stacks its copy above the stage on a phone, `
      + `so this is almost always copy that was added to it.`);
    bad++;
  } else if (r.visiblePx > base + SLACK) {
    console.log(`IMPROVED: ${r.size} now shows ${r.visiblePx}px, up from ${base}px. Raise the baseline to keep the gain.`);
  }

  /* 2. The accepted state, stated as accepted so nobody engineers around it. */
  if (!r.intersecting) {
    const line = BELOW_FOLD_IS_FINE.has(r.size)
      ? `ACCEPTED: ${r.size} starts the stage below the fold (${r.stageTop}px of copy above a ${r.viewport}px viewport). `
        + `Owner ruling 2026-08-28: navigation and copy outrank the decorative stage at this size, and the stage `
        + `may begin below the fold and activate on scroll. Do NOT hide .hero-links to "fix" this.`
      : `FAIL: ${r.size} does not bring the stage into view at load, and is not on the accepted list.`;
    console[BELOW_FOLD_IS_FINE.has(r.size) ? 'log' : 'error'](line);
    if (!BELOW_FOLD_IS_FINE.has(r.size)) bad++;
  }

  /* 3. And the promise the acceptance rests on: it activates when scrolled to. */
  if (!r.activation.seen) {
    console.error(`FAIL: ${r.size} never registers the stage as visible even after scrolling it to the middle `
      + `of the viewport. Starting below the fold is allowed only because scrolling starts it.`);
    bad++;
  } else if (r.activation.progress !== null && r.activation.progress < 1) {
    console.error(`FAIL: ${r.size} scrolled the stage into view but the film sat at progress `
      + `${r.activation.progress} after ${r.activation.finishedInMs}ms instead of finishing. A stage that never plays is the defect the `
      + `below-the-fold allowance must not hide.`);
    bad++;
  }
  if (r.activation.arch < 0.99) {
    console.error(`FAIL: ${r.size} leaves the resting arch at opacity ${r.activation.arch}. `
      + `The mark is what the markup paints before any script runs and must survive every state.`);
    bad++;
  }
}
if (bad) { console.error(`\n${bad} problem(s).`); process.exit(1); }
console.log('\nOK: no width lost ground, and every stage activates on scroll with the film finishing.');
process.exit(0);
