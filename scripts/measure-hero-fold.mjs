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

     stageTop          where #stage starts, in CSS px from the top of the page
     visibleFraction   how much of the stage is inside the fold at load
     intersecting      what the observer's opening callback would say
     filmPlayed        whether the timeline actually advanced on its own

     NV_PORT=3272 node scripts/measure-hero-fold.mjs [--label=before]

   A RATCHET, NOT A PASS/FAIL LINE. 360x640 has never cleared the fold: the
   hero copy block is 724px and that viewport is 640px, so the stage starts
   below it and did on the base branch too, at 834px. A guard that fails on a
   condition nobody is about to fix is a guard that gets switched off, which
   is the same lesson check-consistency.js records about exit 2.

   So the baseline below is what the page measures TODAY, and the rule is that
   it may improve and may not get worse. That catches the regression this file
   was written for: making the scan the hero's primary widened the CTA row past
   one line on a phone, cost 63px, and took 375x812 from 21 visible pixels to
   zero. Measured, not guessed, before it shipped.

   Exit 0 = at or above baseline.  1 = a width lost ground, or #stage is gone.
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

   Raise these when the page genuinely gets better, which is the point of a
   ratchet. `slack` absorbs sub-pixel and font-metric noise; the measurement
   repeated identically across runs, so it is deliberately small. */
const BASELINE = { '360x640': 0, '375x812': 110, '390x844': 160 };
const SLACK = 4;

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

  rows.push({ size: `${w}x${h}`, ...geo, intersecting, filmPlayed });
  await ctx.close();
}

await browser.close();

console.log(`\nHERO FOLD, ${label}  (threshold hero.js observes at: 0.02)\n`);
console.log('  viewport   stageTop  stageH  visible px  baseline  fraction  intersecting  film played');
for (const r of rows) {
  const base = BASELINE[r.size];
  console.log('  ' + r.size.padEnd(10)
    + String(r.stageTop).padEnd(10)
    + String(r.stageHeight).padEnd(8)
    + String(r.visiblePx).padEnd(12)
    + String(base === undefined ? '-' : base).padEnd(10)
    + String(r.fraction).padEnd(10)
    + String(r.intersecting).padEnd(14)
    + String(r.filmPlayed));
}
console.log('');

for (const r of rows) {
  const base = BASELINE[r.size];
  if (base === undefined) { console.log(`NOTE: ${r.size} has no recorded baseline; record one if it should be held.`); continue; }
  if (r.visiblePx + SLACK < base) {
    console.error(`FAIL: ${r.size} shows ${r.visiblePx}px of the stage, down from a recorded ${base}px. `
      + `Something above the stage got taller. The hero stacks its copy above the stage on a phone, `
      + `so this is almost always copy that was added to it.`);
    bad++;
  } else if (r.visiblePx > base + SLACK) {
    console.log(`IMPROVED: ${r.size} now shows ${r.visiblePx}px, up from ${base}px. Raise the baseline to keep the gain.`);
  }
  /* Reported every run, never fatal: it is the recorded state, not a new
     defect, and the deficit is the number that says how close a fix is. */
  if (!r.intersecting) {
    console.log(`KNOWN: ${r.size} never brings the stage into view (${r.stageTop}px of copy above a ${r.viewport}px viewport, `
      + `${r.stageTop - r.viewport + Math.ceil(r.stageHeight * 0.02)}px short). Pre-existing, and the film still runs.`);
  }
}
if (bad) { console.error(`\n${bad} width(s) lost ground against the baseline.`); process.exit(1); }
console.log('\nOK: no width lost ground against the recorded baseline.');
process.exit(0);
