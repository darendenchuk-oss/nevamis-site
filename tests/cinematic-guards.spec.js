/* THE SEVENTEEN CINEMATIC GUARDS.
   Run: NV_PORT=3291 npx playwright test tests/cinematic-guards.spec.js
   Foundation helpers: tests/helpers/cinematic.js
   Guard helpers:      tests/helpers/cinematic-guards.js
   Subject:            tests/fixtures/cine-guard-subject.html (+ /home.html)

   WHAT THESE ARE FOR. They stand before the first approved frame exists,
   because a guard written after a false claim has shipped is a post mortem.

   THE THREE RULES EVERY GUARD HERE OBEYS

   1. NOTHING IS BELIEVED UNTIL THE SERVER IS PROVED. assertServingThisWorktree()
      runs before any measurement in every test. This machine holds several
      checkouts of this site and Playwright reuses whatever already owns the
      port; a run that measures a stranger's server passes while describing a
      different application, and that has already happened here.

   2. THE ENGINE IS NEVER ASKED WHAT IT PAINTED. Guards 2, 3, 4, 5 and 14 read
      the frame index out of the canvas pixels with the NVFC1 code. An engine
      that reports index 42 while painting index 7, or that paints into a
      300x150 backing store, fails here. stage.frameIndex is not consulted
      anywhere in this file.

   3. NO GUARD COPIES THE FACT IT GUARDS. Prices come from window.NV_PRICING,
      readiness words from availabilityWordFor() in the site's own breadth
      model, the information architecture from home.html, frame counts and urls
      from the manifest. Where a fact has exactly one home, the guard checks
      that the ANCHOR still exists and fails loudly when it moves. */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertServingThisWorktree, canvasMetrics, readCanvasFrame,
  localPlaceholderManifest, variantOf, expectedFrameIndex,
} from './helpers/cinematic.js';
import { frameIndexForProgress } from '../assets/cinematic/manifest.js';
import {
  SUBJECT_URL, HOMEPAGE_URL, openSubject, installProbe, assertBoundToShippedEngine,
  assertSubjectMirrorsHomepage, recordRequests, scrollToProgress, settle,
  drawsPerAnimationFrame, rafRunsPerAnimationFrame, probeState, hitTest, horizontalOverflow,
  readCanonicalPricing, readCanonicalRoadmap, canonicalAmountStrings,
  readinessSurfaces, servicesNamedInDevelopment, availabilityWordFor,
  AVAILABILITY_CLAIM_PATTERNS, walkFiles, localFile, isFrameRequest, isMobileFrame, MUTANT_KEYS,
} from './helpers/cinematic-guards.js';

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };
const manifest = localPlaceholderManifest();
const SEQUENCES = manifest.sequences.map((s) => s.id);
const stageSel = (id) => `[data-cine-stage="${id}"]`;
const canvasSel = (id) => `[data-cine-stage="${id}"] canvas[data-cine-canvas]`;

/** A context of our own, so viewport, reduced motion and JS can vary per guard
    without disturbing the project defaults the rest of the suite relies on. */
async function open(browser, options = {}) {
  const context = await browser.newContext({ viewport: DESKTOP, ...options });
  const page = await context.newPage();
  return { context, page };
}

/* ==================================================================== *
 * 0. BINDING. Not one of the seventeen: the thing that stops the other
 *    seventeen from being true about the wrong subject.
 * ==================================================================== */
test('0. the guards are bound to the shipped engine and to the homepage IA', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    const mirror = assertSubjectMirrorsHomepage();
    expect(mirror.spans.length, 'the subject declares no cinematic stages, so eight guards would measure nothing').toBe(3);

    await openSubject(page);
    const binding = await assertBoundToShippedEngine(page);
    /* Recorded in the report so a reader knows what was measured. A shipped
       module that exists and was not mounted has already thrown above. */
    test.info().annotations.push({ type: 'engine', description: `${binding.engineSource} :: ${JSON.stringify(binding.sources)}` });

    /* Non-vacuity: the subject must actually be running three sequences. */
    const live = await page.evaluate(() => Array.from(document.querySelectorAll('[data-cine-stage]'))
      .map((el) => ({ id: el.dataset.cineStage, state: el.getAttribute('data-cine-state') })));
    expect(live.map((s) => s.id).sort()).toEqual([...SEQUENCES].sort());
    for (const s of live) expect(['poster', 'scrubbing'], `${s.id} is ${s.state} before anything was asked of it`).toContain(s.state);
  } finally { await context.close(); }
});

/* The mutation hook is the one thing in this suite that can make every other
   guard describe code that nothing ships, so the fence around it is itself
   guarded. Pointing the subject at a mutant module without announcing a
   mutation run in the environment must be REFUSED, not measured. */
test('0b. a mutant module cannot be measured unless the run announces itself', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await openSubject(page, { url: '/tests/fixtures/cine-guard-subject.html?stage=/artifacts/cine-mutants/scroll-stage.js' });
    const thrown = await assertBoundToShippedEngine(page).then(() => null, (e) => e);
    if (MUTANT_KEYS.length) {
      /* Inside a declared mutation run the fence is open on purpose. */
      expect(thrown, 'NV_CINE_MUTANT is set, so an override is legitimate and must not be refused').toBeNull();
      return;
    }
    expect(thrown, 'the subject loaded a mutant module and the guards accepted it. Every other assertion in this run would describe a copy of the engine that nothing ships.').not.toBeNull();
    expect(String(thrown.message)).toMatch(/NV_CINE_MUTANT is not set/);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 1. COPY PAINTS WITHOUT JAVASCRIPT
 *    Measured in a context with JavaScript switched off, so "the copy is
 *    in the markup" is answered by what a browser renders rather than by
 *    counting sentences in a file. A stylesheet that hides the hero until
 *    a script adds a class still hides it here.
 * ==================================================================== */
test('1. copy paints without JavaScript', async ({ browser }) => {
  const { context, page } = await open(browser, { javaScriptEnabled: false });
  try {
    await assertServingThisWorktree(page);
    for (const url of [HOMEPAGE_URL, SUBJECT_URL]) {
      await page.goto(url);
      const seen = await page.evaluate(() => {
        /* MEASURED THROUGH THE ANCESTOR CHAIN, not on the element alone.
           The realistic way to hide copy until a script runs is a rule on a
           WRAPPER: .hero .copy{opacity:0} leaves the h1's own computed opacity
           at 1, so an element-only check reports the headline as visible while
           a reader sees nothing. Effective opacity is the product up the tree,
           and checkVisibility() is the browser's own answer to the same
           question including content-visibility and visibility inheritance. */
        const box = (el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          let effective = 1;
          let hiddenBy = null;
          for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
            const ncs = getComputedStyle(n);
            const o = Number(ncs.opacity);
            if (Number.isFinite(o)) effective *= o;
            if (hiddenBy === null && (o < 0.99 || ncs.visibility === 'hidden' || ncs.display === 'none' || ncs.contentVisibility === 'hidden')) {
              hiddenBy = `${n.tagName.toLowerCase()}${n.className ? `.${String(n.className).split(/\s+/)[0]}` : ''} (opacity ${ncs.opacity}, visibility ${ncs.visibility}, display ${ncs.display})`;
            }
          }
          return {
            text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
            display: cs.display,
            visibility: cs.visibility,
            opacity: effective,
            ownOpacity: Number(cs.opacity),
            hiddenBy,
            browserSaysVisible: typeof el.checkVisibility === 'function'
              ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })
              : null,
            width: Math.round(r.width),
            height: Math.round(r.height),
            transform: cs.transform,
            clipPath: cs.clipPath,
          };
        };
        const sections = Array.from(document.querySelectorAll('[data-ia]')).map((sec) => {
          const h = sec.querySelector('h1,h2');
          return {
            ia: sec.getAttribute('data-ia'),
            heading: h ? box(h) : null,
            words: (sec.textContent || '').trim().split(/\s+/).filter(Boolean).length,
            actions: Array.from(sec.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')).filter(Boolean).length,
          };
        });
        const stages = Array.from(document.querySelectorAll('[data-cine-stage]')).map((st) => ({
          id: st.getAttribute('data-cine-stage'),
          state: st.getAttribute('data-cine-state'),
          poster: !!st.querySelector('img[data-cine-poster][src]'),
          canvasHasText: !!(st.querySelector('canvas') || {}).textContent,
        }));
        return {
          sections,
          stages,
          loaderish: /\b(loading|please wait|initialising|initializing)\b/i.test(document.body.textContent || ''),
          chars: (document.body.textContent || '').replace(/\s+/g, ' ').trim().length,
        };
      });

      expect(seen.sections.length, `${url} rendered no data-ia sections with scripts off`).toBeGreaterThan(0);
      expect(new Set(seen.sections.map((s) => s.ia)).size, `${url} does not keep seven sections`).toBe(7);
      expect(seen.chars, `${url} rendered almost no text with scripts off`).toBeGreaterThan(1500);
      expect(seen.loaderish, `${url} shows a loading state to a visitor with no JavaScript. "Never a loader forever" is not a timeout, it is an absence.`).toBe(false);

      for (const s of seen.sections) {
        expect(s.heading, `${url} section ${s.ia} has no h1 or h2 with scripts off`).not.toBeNull();
        expect(s.heading.text.length, `${url} section ${s.ia} heading is empty`).toBeGreaterThan(3);
        expect(s.heading.display, `${url} section ${s.ia} heading is display:${s.heading.display} with scripts off`).not.toBe('none');
        expect(s.heading.visibility, `${url} section ${s.ia} heading is visibility:${s.heading.visibility} with scripts off`).toBe('visible');
        expect(
          s.heading.opacity,
          `${url} section ${s.ia} heading renders at effective opacity ${s.heading.opacity} with scripts off`
          + `${s.heading.hiddenBy ? `, hidden by ${s.heading.hiddenBy}` : ''}: the copy is waiting for a script that will never run`,
        ).toBeGreaterThan(0.99);
        expect(
          s.heading.browserSaysVisible,
          `${url} section ${s.ia} heading: the browser's own checkVisibility() says it is not visible with scripts off`
          + `${s.heading.hiddenBy ? ` (${s.heading.hiddenBy})` : ''}`,
        ).not.toBe(false);
        expect(s.heading.width * s.heading.height, `${url} section ${s.ia} heading has no painted box`).toBeGreaterThan(0);
        expect(s.words, `${url} section ${s.ia} carries ${s.words} words with scripts off`).toBeGreaterThan(10);
      }

      for (const st of seen.stages) {
        expect(st.state, `${url} stage ${st.id} starts at data-cine-state="${st.state}"; a no-JS visitor must get the poster`).toBe('poster');
        expect(st.poster, `${url} stage ${st.id} has no poster image in the served HTML`).toBe(true);
      }
    }

    /* Pricing must stay reachable with no script: the homepage renders its
       cards from canonical at runtime, so the fallback is the contract. */
    await page.goto(HOMEPAGE_URL);
    const fallback = await page.evaluate(() => {
      const noscripts = Array.from(document.querySelectorAll('noscript')).map((n) => n.textContent || '');
      return { hasPricingFallback: noscripts.some((t) => /pricing/i.test(t)) };
    });
    expect(fallback.hasPricingFallback, 'home.html renders its price cards from pricing-config.js at runtime and offers no <noscript> route to the pricing page').toBe(true);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 2, 3, 4. THE MAPPING, READ OUT OF THE PIXELS.
 * ==================================================================== */
test('2. scroll progress maps to the correct first, middle and last frame', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    for (const id of SEQUENCES) {
      const variant = variantOf(manifest, id, 'desktop');
      const sequence = manifest.sequences.find((s) => s.id === id);
      for (const progress of [0, 0.5, 1]) {
        await scrollToProgress(page, stageSel(id), progress);
        const expected = await expectedFrameIndex(page, stageSel(id), variant.frameCount);
        const metrics = await canvasMetrics(page, canvasSel(id));
        expect(metrics.backingWidth, `${id} canvas is ${metrics.backingWidth}x${metrics.backingHeight}`).toBeGreaterThan(300);
        const read = await readCanvasFrame(page, canvasSel(id), variant);
        expect(read.sequenceOrdinal, `${id} painted a frame from sequence ordinal ${read.sequenceOrdinal}`).toBe(sequence.ordinal);
        expect(
          read.frameIndex,
          `${id} at progress ${progress}: the live scroll position implies frame ${expected.index} `
          + `(measured progress ${expected.progress.toFixed(4)}) but the canvas is painting frame ${read.frameIndex}`,
        ).toBe(expected.index);
      }
      /* Non-vacuity: the three positions must not all be the same frame. */
      const first = frameIndexForProgress(0, variant.frameCount);
      const last = frameIndexForProgress(1, variant.frameCount);
      expect(last, `${id} maps progress 0 and 1 to the same frame`).toBeGreaterThan(first);
    }
  } finally { await context.close(); }
});

test('3. upward scrolling reverses the sequence, integer for integer', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    const id = SEQUENCES[0];
    const variant = variantOf(manifest, id, 'desktop');
    const stops = [0, 0.17, 0.33, 0.5, 0.68, 0.84, 1];

    const down = [];
    const wanted = [];
    for (const p of stops) {
      await scrollToProgress(page, stageSel(id), p);
      /* Recomputed from the live scroll position, not from the nominal stop:
         the scroll target is rounded to a whole pixel, so the position reached
         is never exactly the stop asked for. */
      wanted.push((await expectedFrameIndex(page, stageSel(id), variant.frameCount)).index);
      down.push((await readCanvasFrame(page, canvasSel(id), variant)).frameIndex);
    }
    const up = [];
    for (const p of [...stops].reverse()) {
      await scrollToProgress(page, stageSel(id), p);
      up.push((await readCanvasFrame(page, canvasSel(id), variant)).frameIndex);
    }

    /* Not "decreasing". The same integers, in reverse order. A mapping with
       hysteresis, easing or a floor/round mismatch passes a monotonicity check
       and fails this one. */
    expect(up, `downward traversal painted [${down}] and upward painted [${up}]`).toEqual([...down].reverse());
    /* And both directions agree with the mapping, not merely with each other: a
       stage that is consistently wrong in both directions passes a symmetry
       check on its own. */
    expect(down, `downward traversal painted [${down}] where the live scroll positions imply [${wanted}]`).toEqual(wanted);
    expect(new Set(down).size, 'every stop painted the same frame, so this proved nothing').toBeGreaterThan(3);
    expect(down[0]).toBeLessThan(down[down.length - 1]);
  } finally { await context.close(); }
});

test('4. the frame index is clamped past both ends of the stage', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    for (const id of SEQUENCES) {
      const variant = variantOf(manifest, id, 'desktop');
      /* Deliberately outside [0,1]: scrollToProgress does not clamp, the
         engine's mapping must. */
      await scrollToProgress(page, stageSel(id), -0.6);
      const atStart = await readCanvasFrame(page, canvasSel(id), variant);
      expect(atStart.frameIndex, `${id} above the stage should hold frame 0, holds ${atStart.frameIndex}`).toBe(0);

      await scrollToProgress(page, stageSel(id), 1.6);
      const atEnd = await readCanvasFrame(page, canvasSel(id), variant);
      expect(atEnd.frameIndex, `${id} below the stage should hold frame ${variant.frameCount - 1}, holds ${atEnd.frameIndex}`).toBe(variant.frameCount - 1);
    }

    /* And at the document's own extremes, where a stage has no scroll left. */
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    const firstId = SEQUENCES[0];
    const firstVariant = variantOf(manifest, firstId, 'desktop');
    expect((await readCanvasFrame(page, canvasSel(firstId), firstVariant)).frameIndex).toBe(0);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await settle(page);
    const lastId = SEQUENCES[SEQUENCES.length - 1];
    const lastVariant = variantOf(manifest, lastId, 'desktop');
    expect((await readCanvasFrame(page, canvasSel(lastId), lastVariant)).frameIndex).toBe(lastVariant.frameCount - 1);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 5. A MISSING FRAME RETAINS THE LAST GOOD IMAGE
 *    A band of frames is failed at the network. The canvas must keep
 *    showing a real frame: never blank, never a partial clear, and never
 *    a whole sequence degraded because a few bytes did not arrive.
 * ==================================================================== */
test('5. a missing frame retains the last good image', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    const id = SEQUENCES[0];
    const variant = variantOf(manifest, id, 'desktop');
    const blockedFrom = Math.floor(variant.frameCount * 0.45);
    const blockedTo = Math.floor(variant.frameCount * 0.72);
    const blockedUrls = new Set(variant.frames.slice(blockedFrom, blockedTo + 1));

    await page.route('**/*', (route) => {
      const p = new URL(route.request().url()).pathname;
      if (blockedUrls.has(p)) return route.abort('failed');
      return route.continue();
    });

    await openSubject(page);
    await assertBoundToShippedEngine(page);

    const midProgress = ((blockedFrom + blockedTo) / 2) / (variant.frameCount - 1);
    await scrollToProgress(page, stageSel(id), 0.2);
    const before = await readCanvasFrame(page, canvasSel(id), variant);
    expect(before.frameIndex).toBeLessThan(blockedFrom);

    await scrollToProgress(page, stageSel(id), midProgress);
    /* readCanvasFrame throws on a fully transparent canvas, which is exactly
       what a stage that cleared before it had a frame would produce. */
    const during = await readCanvasFrame(page, canvasSel(id), variant);
    expect(
      during.frameIndex >= blockedFrom && during.frameIndex <= blockedTo,
      `frames ${blockedFrom}..${blockedTo} were failed at the network, yet the canvas is painting ${during.frameIndex} from that band`,
    ).toBe(false);
    expect(during.sequenceOrdinal, 'the retained image is not from this sequence').toBe(manifest.sequences.find((s) => s.id === id).ordinal);

    const state = await page.getAttribute(stageSel(id), 'data-cine-state');
    expect(state, `a band of failed frames degraded the whole sequence (state ${state}); a failed frame must never reject into the stage`).not.toBe('degraded');

    /* And it recovers: past the band, real frames paint again. */
    await scrollToProgress(page, stageSel(id), 0.95);
    const after = await readCanvasFrame(page, canvasSel(id), variant);
    expect(after.frameIndex).toBeGreaterThan(blockedTo);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 6. NO DUPLICATE RENDER LOOPS AFTER VISIBILITY CHANGES
 *    Measured from outside: drawImage on a [data-cine-canvas] is wrapped
 *    before any page script runs, and every draw is stamped with an
 *    animation-frame number produced by our own rAF chain. Two paints of
 *    one canvas inside one animation frame is a second loop, whatever the
 *    engine believes about itself.
 * ==================================================================== */
test('6. no duplicate render loops survive repeated visibility changes', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    const id = SEQUENCES[0];
    await scrollToProgress(page, stageSel(id), 0.1);

    /* THE BASELINE, taken before any visibility change. One rAF loop per live
       stage is legitimate and the number is not this guard's business; what is
       this guard's business is whether hiding and showing the tab makes it
       grow. Comparing against a typed-in expectation would be a guard that
       copies the fact it guards, and it would need editing the day a fourth
       sequence is added. */
    const baseMark = (await probeState(page)).frame;
    await page.evaluate(async () => {
      for (let i = 0; i < 40; i += 1) {
        window.scrollBy(0, 24);
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    await settle(page);
    const baseline = await rafRunsPerAnimationFrame(page, baseMark);
    expect(baseline.frames, 'the baseline scroll produced no animation frames to measure').toBeGreaterThan(10);
    expect(baseline.worst, 'the baseline scroll ran no page rAF callbacks at all, so there is no loop to count').toBeGreaterThan(0);

    for (let i = 0; i < 4; i += 1) {
      await page.evaluate(() => window.__setHidden(true));
      await page.waitForTimeout(120);
      await page.evaluate(() => window.__setHidden(false));
      await page.waitForTimeout(160);
    }

    const mark = (await probeState(page)).frame;
    /* A continuous scroll, so there is real painting to count. */
    await page.evaluate(async () => {
      for (let i = 0; i < 60; i += 1) {
        window.scrollBy(0, 24);
        await new Promise((r) => requestAnimationFrame(r));
      }
    });
    await settle(page);

    const after = await probeState(page);
    expect(after.drawCount, 'nothing was painted during the scroll, so this measured nothing').toBeGreaterThan(15);
    const dup = await drawsPerAnimationFrame(page, mark);
    expect(
      dup.worst,
      `a cinematic canvas was painted ${dup.worst} times inside one animation frame (${dup.worstKey}). `
      + 'After a visibility change exactly one rAF loop per stage may be alive.',
    ).toBeLessThanOrEqual(1);
    expect(dup.groups, 'no painted animation frames were recorded').toBeGreaterThan(5);

    /* The second signal, and the one that catches a loop which ticks without
       painting: the same scroll must not now run more rAF callbacks per frame
       than it did before the tab was hidden and shown four times. */
    const census = await rafRunsPerAnimationFrame(page, mark);
    expect(census.frames, 'the post-visibility scroll produced no animation frames to measure').toBeGreaterThan(10);
    expect(
      census.worst,
      `before the visibility changes the page ran at most ${baseline.worst} animation-frame callbacks per frame; `
      + `after four hide and show cycles it runs ${census.worst}. Resuming started a loop and left the old one running.`,
    ).toBeLessThanOrEqual(baseline.worst);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 7. REDUCED MOTION LOADS STATIC POSTERS RATHER THAN FULL SEQUENCES
 *    Three independent ways of asking for less motion, because the defect
 *    that already shipped here was a reduced-motion rule scoped to a class
 *    that is absent precisely when reduced motion is on.
 * ==================================================================== */
for (const scenario of [
  { name: 'the media query alone', options: { reducedMotion: 'reduce' }, init: null },
  { name: "the site's own nv-motion toggle", options: {}, init: () => { try { localStorage.setItem('nv-motion', 'off'); } catch { /* storage blocked */ } } },
  {
    name: 'the media query with the motion-off class deliberately absent',
    options: { reducedMotion: 'reduce' },
    init: () => {
      const strip = () => document.documentElement.classList.remove('motion-off');
      strip();
      new MutationObserver(strip).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    },
  },
]) {
  test(`7. reduced motion shows static keyframes and fetches no sequence: ${scenario.name}`, async ({ browser }) => {
    const { context, page } = await open(browser, scenario.options);
    try {
      await assertServingThisWorktree(page);
      if (scenario.init) await page.addInitScript(scenario.init);
      const requests = recordRequests(page);
      await openSubject(page);

      /* "No dolly" measured as behaviour: a backdrop that is still pinned holds
         its viewport position while the page scrolls under it. Measured before
         and after a real scroll, so a stage that only LOOKS unstuck in its
         computed style is still caught. */
      const pinned = await page.evaluate(async () => {
        const read = () => Array.from(document.querySelectorAll('[data-cine-stage]')).map((st) => {
          const sticky = st.querySelector('.cine-stage__sticky');
          const cs = sticky ? getComputedStyle(sticky) : null;
          return {
            id: st.getAttribute('data-cine-stage'),
            top: sticky ? sticky.getBoundingClientRect().top : null,
            display: cs ? cs.display : null,
          };
        });
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 120));
        const before = read();
        window.scrollTo(0, 700);
        await new Promise((r) => setTimeout(r, 160));
        const after = read();
        return before.map((b, i) => ({ id: b.id, display: b.display, moved: b.top === null || after[i].top === null ? null : Math.round(b.top - after[i].top) }));
      });

      const report = await page.evaluate(() => {
        const stages = Array.from(document.querySelectorAll('[data-cine-stage]')).map((st) => {
          const sticky = st.querySelector('.cine-stage__sticky');
          const stickyStyle = sticky ? getComputedStyle(sticky) : null;
          const keys = Array.from(st.querySelectorAll('img[data-cine-keyframe]'));
          const canvas = st.querySelector('canvas[data-cine-canvas]');
          return {
            id: st.getAttribute('data-cine-stage'),
            state: st.getAttribute('data-cine-state'),
            keyframeAttr: st.getAttribute('data-cine-keyframes'),
            stickyPosition: stickyStyle ? stickyStyle.position : null,
            stickyDisplay: stickyStyle ? stickyStyle.display : null,
            keyframes: keys.length,
            keyframeAlts: keys.map((k) => k.getAttribute('alt') || ''),
            canvasDisplay: canvas ? getComputedStyle(canvas).display : 'absent',
          };
        });
        return {
          stages,
          motionOffClass: document.documentElement.classList.contains('motion-off'),
          headings: Array.from(document.querySelectorAll('[data-ia] h1, [data-ia] h2')).length,
          priceCards: document.querySelectorAll('#pricePreview .price-card').length,
          capabilityCards: document.querySelectorAll('#breadth .cap-card').length,
          ctas: Array.from(document.querySelectorAll('[data-cta]')).map((a) => a.getAttribute('href')).filter(Boolean).length,
          demoLabels: Array.from(document.querySelectorAll('[data-demo-label]')).map((el) => el.textContent.trim()),
        };
      });
      requests.stop();

      const frames = requests.frames();
      expect(
        frames.length,
        `reduced motion fetched ${frames.length} sequence frames (first: ${frames[0]}). Nothing scrubs: each chapter shows its static keyframe.`,
      ).toBe(0);

      expect(report.stages.length).toBe(3);
      const chaptersOf = (id) => variantOf(manifest, id, 'desktop').chapters.length;
      for (const st of report.stages) {
        expect(st.state, `${st.id} is ${st.state} under reduced motion`).toBe('reduced');
        expect(
          st.keyframes,
          `${st.id} placed ${st.keyframes} static keyframes for ${chaptersOf(st.id)} chapters (data-cine-keyframes="${st.keyframeAttr}")`,
        ).toBe(chaptersOf(st.id));
        expect(st.keyframeAlts.every((a) => a.length > 0), `${st.id} has a keyframe with no alternative text`).toBe(true);
        expect(st.canvasDisplay, `${st.id} still renders its canvas (display:${st.canvasDisplay}) under reduced motion`).toBe('none');
        const pin = pinned.find((p) => p.id === st.id);
        expect(
          pin.display === 'none' || Math.abs(pin.moved) > 100,
          `${st.id} backdrop is still pinned under reduced motion: it held its viewport position across a 700px scroll (it shifted ${pin.moved}px, display ${pin.display}). The dolly must be gone.`,
        ).toBe(true);
      }

      /* Every word, price, capability, Demo and CTA stays put. */
      expect(report.headings, 'headings disappeared under reduced motion').toBeGreaterThanOrEqual(7);
      expect(report.priceCards, 'pricing vanished under reduced motion').toBeGreaterThan(0);
      expect(report.capabilityCards, 'the capability list vanished under reduced motion').toBeGreaterThan(0);
      expect(report.ctas, 'the calls to action vanished under reduced motion').toBeGreaterThan(3);
      expect(report.demoLabels.some((t) => /demo/i.test(t)), 'the Demo label vanished under reduced motion').toBe(true);

      if (scenario.name.includes('class deliberately absent')) {
        expect(
          report.motionOffClass,
          'the .motion-off class was present, so this scenario did not prove that the reduced-motion decision survives without it',
        ).toBe(false);
      }
    } finally { await context.close(); }
  });
}

/* ==================================================================== *
 * 8. HIDDEN TABS PAUSE WORK
 * ==================================================================== */
test('8. a hidden tab fetches nothing and paints nothing, and resumes without a jump', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    const requests = recordRequests(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    const id = SEQUENCES[0];
    const variant = variantOf(manifest, id, 'desktop');
    await scrollToProgress(page, stageSel(id), 0.15);

    const beforeFrames = requests.frames().length;
    const beforeProbe = await probeState(page);
    expect(beforeFrames, 'no frames were ever fetched, so pausing them proves nothing').toBeGreaterThan(0);

    await page.evaluate(() => window.__setHidden(true));
    await page.waitForTimeout(150);
    const framesAtHide = requests.frames().length;
    const drawsAtHide = (await probeState(page)).drawCount;

    /* Scroll hard while hidden. A stage that is still listening will try to
       paint, and a loader that is still running will try to fetch. */
    await page.evaluate(async () => {
      for (let i = 0; i < 40; i += 1) {
        window.scrollBy(0, 40);
        await new Promise((r) => setTimeout(r, 5));
      }
    });
    await page.waitForTimeout(900);

    const hidden = await probeState(page);
    expect(
      requests.frames().length - framesAtHide,
      `${requests.frames().length - framesAtHide} frame requests were issued while the page was hidden`,
    ).toBe(0);
    expect(hidden.hiddenDraws, `${hidden.hiddenDraws} canvas paints happened while the page was hidden`).toBe(0);
    expect(hidden.drawCount - drawsAtHide, 'the canvas was painted while the page was hidden').toBe(0);
    expect(hidden.frame, 'the probe stopped counting animation frames, so "no work happened" is unmeasured').toBeGreaterThan(beforeProbe.frame);

    /* Resuming: one loop, no catch-up burst, and the frame that matches where
       the visitor now is, not where they were when the tab hid. */
    const resumeMark = hidden.frame;
    await page.evaluate(() => window.__setHidden(false));
    await settle(page);
    const dup = await drawsPerAnimationFrame(page, resumeMark);
    expect(dup.worst, `resuming produced ${dup.worst} paints in one animation frame (${dup.worstKey})`).toBeLessThanOrEqual(1);

    const expectedNow = await expectedFrameIndex(page, stageSel(id), variant.frameCount);
    const read = await readCanvasFrame(page, canvasSel(id), variant);
    expect(read.frameIndex, `after resuming, the scroll position implies frame ${expectedNow.index} but the canvas shows ${read.frameIndex}`).toBe(expectedNow.index);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 9. PRICING DERIVES FROM CANONICAL CONFIGURATION
 *    Two halves. The cards must equal canonical, AND the served markup for
 *    the card container must contain no figures at all: a number that is
 *    not in the markup cannot be hand typed into it later.
 * ==================================================================== */
test('9. every price a reader sees derives from pricing-config.js', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    for (const url of [HOMEPAGE_URL, SUBJECT_URL]) {
      await page.goto(url);
      await page.waitForFunction(() => document.querySelectorAll('#pricePreview .price-card').length > 0, null, { timeout: 10_000 });
      const P = await readCanonicalPricing(page);
      const { strings } = canonicalAmountStrings(P);

      const cards = await page.evaluate(() => Array.from(document.querySelectorAll('#pricePreview .price-card'))
        .map((c) => c.textContent.replace(/\s+/g, ' ').trim()));
      expect(cards.length, `${url} rendered ${cards.length} price cards for ${P.plans.length} canonical plans`).toBe(P.plans.length);
      P.plans.forEach((plan, i) => {
        const monthly = `C$${Number(plan.monthly).toLocaleString('en-CA')}`;
        const launch = `C$${Number(plan.launch).toLocaleString('en-CA')}`;
        expect(cards[i], `${url} card ${i} does not carry ${plan.name}`).toContain(plan.name);
        expect(cards[i], `${url} card ${i} does not carry the canonical monthly ${monthly}`).toContain(monthly);
        expect(cards[i], `${url} card ${i} does not carry the canonical launch fee ${launch}`).toContain(launch);
      });

      /* The served markup for the container must be figure-free. */
      const raw = await (await page.request.get(url)).text();
      const at = raw.indexOf('id="pricePreview"');
      expect(at, `${url} has no #pricePreview container`).toBeGreaterThan(-1);
      const close = raw.indexOf('</div>', at);
      const region = raw.slice(at, close === -1 ? at + 800 : close);
      expect(/C\$\s?\d/.test(region), `${url} has a currency figure typed into the price-card markup: ${region.slice(0, 200)}`).toBe(false);

      /* And nothing visible anywhere may state an amount canonical does not know. */
      const amounts = await page.evaluate(() => {
        const text = document.body.innerText.replace(/\s+/g, ' ');
        return Array.from(new Set((text.match(/C\$\s?[\d,]+/g) || []).map((s) => s.replace(/\s/g, ''))));
      });
      const unknown = amounts.filter((a) => !strings.has(a));
      expect(unknown, `${url} shows currency amounts that pricing-config.js does not carry: ${unknown.join(', ')}`).toEqual([]);
      expect(amounts.length, `${url} shows no prices at all, so this checked nothing`).toBeGreaterThan(0);
    }
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 10. GENERATED ASSETS AND ANIMATION MARKUP CARRY NO PRICING LITERALS
 *     AND NO SOURCE-OF-TRUTH DATA
 *     Two subjects: the bytes on disk, and the stage's decoration layer in
 *     a live render. The second is what stops a price being written into
 *     the animation instead of into the page.
 * ==================================================================== */
test('10. generated assets and animation markup carry no pricing literals', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);

    /* --- bytes on disk --- */
    const generatedRoots = ['artifacts/cinematic-placeholders', 'assets/cinematic'];
    const files = generatedRoots.flatMap((rel) => walkFiles(localFile(rel)));
    expect(files.length, 'no generated cinematic assets were found, so this scanned nothing. Run: npm run cine:frames').toBeGreaterThan(50);

    const CURRENCY = /C\$\s?\d/;
    const HTML_SOURCE = /<(section|article|h[1-6]|button|form|input|table)\b/i;
    const offenders = [];
    let textScanned = 0;
    let binaryScanned = 0;
    for (const file of files) {
      const rel = path.relative(localFile('.'), file);
      const ext = path.extname(file).toLowerCase();
      if (['.json', '.js', '.mjs', '.txt', '.svg'].includes(ext)) {
        const body = fs.readFileSync(file, 'utf8');
        textScanned += 1;
        /* manifest.js documents the contract in comments; only the data and the
           code are scanned, never the prose that explains them. */
        const code = body.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
        if (CURRENCY.test(code)) offenders.push(`${rel}: currency literal`);
        if (HTML_SOURCE.test(code)) offenders.push(`${rel}: HTML source-of-truth markup`);
      } else {
        const buf = fs.readFileSync(file);
        binaryScanned += 1;
        /* PNG text chunks are the one place a generator can smuggle prose into
           an image without anybody looking at it. */
        const ascii = buf.toString('latin1');
        for (const kind of ['tEXt', 'iTXt', 'zTXt']) {
          let at = ascii.indexOf(kind);
          while (at !== -1) {
            const chunk = ascii.slice(at, at + 400);
            if (CURRENCY.test(chunk)) offenders.push(`${rel}: currency literal in a ${kind} chunk`);
            at = ascii.indexOf(kind, at + 1);
          }
        }
        if (CURRENCY.test(ascii)) offenders.push(`${rel}: currency literal in the file bytes`);
      }
    }
    expect(textScanned, 'no text assets were scanned').toBeGreaterThan(0);
    expect(binaryScanned, 'no frame images were scanned').toBeGreaterThan(50);
    expect(offenders, `generated cinematic assets carry pricing or page data:\n  ${offenders.join('\n  ')}`).toEqual([]);

    /* --- the live stage decoration layer --- */
    await openSubject(page);
    const P = await readCanonicalPricing(page);
    const decorated = await page.evaluate(() => {
      const out = [];
      for (const st of document.querySelectorAll('[data-cine-stage]')) {
        const parts = [];
        for (const attr of st.attributes) parts.push(`${attr.name}=${attr.value}`);
        for (const el of st.querySelectorAll('*')) {
          if (el.closest('section')) continue; /* real copy lives in the sections */
          parts.push(el.textContent || '');
          for (const attr of el.attributes) parts.push(`${attr.name}=${attr.value}`);
        }
        out.push({ id: st.getAttribute('data-cine-stage'), blob: parts.join(' | ') });
      }
      return out;
    });
    expect(decorated.length, 'the subject rendered no stages, so the decoration layer was not scanned').toBe(3);
    for (const stage of decorated) {
      expect(/C\$\s?\d/.test(stage.blob), `stage ${stage.id} has a currency literal in its animation layer: ${stage.blob.slice(0, 240)}`).toBe(false);
      for (const plan of P.plans) {
        expect(stage.blob.includes(String(plan.monthly)), `stage ${stage.id} has the canonical monthly ${plan.monthly} baked into its animation layer`).toBe(false);
        expect(stage.blob.includes(String(plan.launch)), `stage ${stage.id} has the canonical launch fee ${plan.launch} baked into its animation layer`).toBe(false);
      }
    }
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 11. DEMO REMAINS LABELLED
 *     Checked with scripts on AND off, because a label a script paints is
 *     a label a visitor can miss.
 * ==================================================================== */
for (const js of [true, false]) {
  test(`11. the demonstration stays labelled as one (JavaScript ${js ? 'on' : 'off'})`, async ({ browser }) => {
    const { context, page } = await open(browser, { javaScriptEnabled: js });
    try {
      await assertServingThisWorktree(page);
      for (const url of [HOMEPAGE_URL, SUBJECT_URL]) {
        await page.goto(url);
        const found = await page.evaluate(() => {
          /* EVERY section is examined, not one chosen by id or by the first
             mention of the word: a nav link reading "Demo" in section 1 must not
             answer for section 5, and a renamed id must not silently turn this
             guard off.

             THE LABEL HAS TO COME BEFORE THE THING IT LABELS. That is not
             pedantry, it is the whole requirement: a reader who meets a table of
             flows and only learns it was a demonstration in a paragraph
             underneath has already read it as evidence. Removing the section's
             "Demo" eyebrow from home.html left the trailing "Demonstration only."
             paragraph standing, and a position-blind version of this guard
             passed that mutation. */
          const ARTEFACT = 'table, dl, figure, iframe, video, .demo-panel, [data-demo-panel]';
          const out = [];
          for (const sec of document.querySelectorAll('[data-ia]')) {
            const artefact = sec.querySelector(ARTEFACT);
            const labels = [];
            for (const el of sec.querySelectorAll('p,span,caption,h2,h3,figcaption,[data-demo-label]')) {
              const t = (el.textContent || '').trim();
              if (!/^\s*demo(nstration)?\b/i.test(t)) continue;
              if (el.closest('.cine-stage__sticky')) continue; /* a word in the canvas layer is not a label */
              if (el.closest('nav')) continue;                 /* a nav link is navigation, not a label */
              const cs = getComputedStyle(el);
              const r = el.getBoundingClientRect();
              const precedes = artefact
                ? !!(el.compareDocumentPosition(artefact) & Node.DOCUMENT_POSITION_FOLLOWING)
                : true;
              labels.push({
                text: t.slice(0, 60),
                display: cs.display,
                visibility: cs.visibility,
                opacity: Number(cs.opacity),
                /* An sr-only caption is a 1x1 clipped box. It is a real label
                   for a screen reader and it is not a label a sighted reader
                   can see, so it may not answer this on its own. */
                area: Math.round(r.width * r.height),
                precedesArtefact: precedes,
              });
            }
            out.push({
              ia: sec.getAttribute('data-ia'),
              hasArtefact: !!artefact,
              artefactTag: artefact ? artefact.tagName.toLowerCase() : null,
              labels,
              disclaimer: /(example data|demonstration only|sanitized|sanitised|nothing live|not live|example wording)/i.test(sec.textContent || ''),
            });
          }
          return out;
        });

        const isVisible = (l) => l.display !== 'none' && l.visibility === 'visible' && l.opacity > 0.99 && l.area > 100;
        const labelled = found.filter((s) => s.labels.some(isVisible));
        const leading = found.filter((s) => s.labels.some((l) => isVisible(l) && l.precedesArtefact));
        const complete = leading.filter((s) => s.disclaimer);
        expect(
          labelled.length,
          `${url} carries no visible label beginning with "Demo" in any section. `
          + `Labels seen: ${JSON.stringify(found.flatMap((s) => s.labels))}`,
        ).toBeGreaterThan(0);
        expect(
          leading.length,
          `${url} labels a demonstration only AFTER the thing being demonstrated. `
          + `Sections with a demonstration artefact: ${JSON.stringify(found.filter((s) => s.hasArtefact).map((s) => ({ ia: s.ia, artefact: s.artefactTag, labels: s.labels })))}`,
        ).toBeGreaterThan(0);
        expect(
          complete.length,
          `${url} labels a demonstration (sections ${leading.map((s) => s.ia)}) but none of them also says the content is an example`,
        ).toBeGreaterThan(0);
      }
    } finally { await context.close(); }
  });
}

/* ==================================================================== *
 * 12. LEAD GENERATION CANNOT BE VISUALLY PROMOTED ABOVE CANONICAL
 *     MATURITY
 *
 *     THREE INDEPENDENT STATEMENTS, CROSS-CHECKED. Asking roadmap-config.js
 *     whether roadmap-config.js may call something available agrees with
 *     every edit to roadmap-config.js, including a wrong one. So the status,
 *     the page's own "what is live, and what is not" paragraph, and the
 *     footer's development sentence are compared against each other: a
 *     promotion in one place and not the others is a contradiction a reader
 *     could hit, and it is what fails here.
 * ==================================================================== */
test('12. no service is presented as available while another surface calls it in development', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);

    for (const url of [HOMEPAGE_URL, SUBJECT_URL]) {
      await page.goto(url);
      const { roadmap, prose } = await readinessSurfaces(page);
      const named = servicesNamedInDevelopment(roadmap, prose);
      expect(
        named.size,
        `${url}: the "what is live, and what is not" prose names no canonical service, so the cross-check has nothing to compare and would pass on anything`,
      ).toBeGreaterThan(0);

      const byName = new Map(roadmap.services.map((s) => [s.slug, s]));
      const contradictions = [];
      for (const slug of named) {
        const svc = byName.get(slug);
        if (svc.status === 'available') {
          contradictions.push(`${svc.name} (${slug}) is status "available" in roadmap-config.js while this page's own copy still says it is in development`);
        }
      }
      expect(contradictions, `${url}: readiness contradicts itself:\n  ${contradictions.join('\n  ')}`).toEqual([]);

      /* And nothing in the visible copy may attach an availability claim to a
         service canonical has not marked available. */
      /* SENTENCE WITHIN BLOCK, and both halves of that were paid for.
         A window of N characters over the flattened page text runs off the end
         of one card and into the next one's readiness word: "Lead Generation |
         In development | Instant Lead Follow-Up | Available today" read as an
         overclaim on Lead Generation when it is four correct labels in a row.
         Widening to the whole block then failed the honesty paragraph, where
         "The front desk works today" and "lead generation ... in development"
         are two sentences of one paragraph, each true.
         innerText's newlines are the browser's own idea of where a block ends;
         sentence boundaries inside it are where one claim ends. The card case
         ("Lead Generation" in a heading, "Available today" in its sibling) is
         deliberately not this check's job: the rendered-readiness comparison
         below holds every card's word against canonical directly. */
      const claimUnits = await page.evaluate(() => document.body.innerText
        .split(/\n+/)
        .flatMap((block) => block.replace(/\s+/g, ' ').trim().split(/(?<=[.!?:])\s+/))
        .map((s) => s.trim())
        .filter(Boolean));
      const overclaims = [];
      for (const svc of roadmap.services) {
        if (svc.status === 'available') continue;
        const name = String(svc.name || '');
        if (!name) continue;
        for (const unit of claimUnits) {
          if (!unit.toLowerCase().includes(name.toLowerCase())) continue;
          for (const pattern of AVAILABILITY_CLAIM_PATTERNS) {
            if (pattern.test(unit)) overclaims.push(`${name} (status ${svc.status}) in "${unit.slice(0, 120)}"`);
          }
        }
      }
      expect(overclaims, `${url}: a service is presented as available above its canonical maturity:\n  ${overclaims.join('\n  ')}`).toEqual([]);
    }

    /* On the subject, the rendered readiness word must be the site's own word
       for the canonical status, so the fixture cannot drift into its own
       vocabulary and neither can the page. */
    await openSubject(page);
    const roadmap = await readCanonicalRoadmap(page);
    const rendered = await page.evaluate(() => Array.from(document.querySelectorAll('[data-service]'))
      .map((c) => ({ slug: c.getAttribute('data-service'), word: (c.querySelector('[data-readiness]') || {}).textContent || '' })));
    expect(rendered.length, 'the subject rendered no capability cards, so readiness was not checked in a render').toBeGreaterThan(3);
    for (const card of rendered) {
      const svc = roadmap.services.find((s) => s.slug === card.slug);
      expect(svc, `the page renders a service '${card.slug}' that roadmap-config.js does not carry`).toBeTruthy();
      expect(
        card.word.trim(),
        `${card.slug} renders "${card.word.trim()}" for canonical status "${svc.status}"`,
      ).toBe(availabilityWordFor(svc.status));
    }

    /* A service name may not appear in the animation layer at all: a canvas
       cannot carry a readiness word a reader can check. */
    const inDecoration = await page.evaluate((names) => {
      const hits = [];
      for (const st of document.querySelectorAll('[data-cine-stage]')) {
        let blob = '';
        for (const el of st.querySelectorAll('*')) {
          if (el.closest('section')) continue;
          blob += ` ${el.textContent || ''}`;
          for (const attr of el.attributes) blob += ` ${attr.value}`;
        }
        for (const n of names) if (n && blob.toLowerCase().includes(n.toLowerCase())) hits.push(`${st.getAttribute('data-cine-stage')}: ${n}`);
      }
      return hits;
    }, roadmap.services.filter((s) => s.status !== 'available').map((s) => s.name));
    expect(inDecoration, `a service that is not available is named inside the animation layer, where no reader can check its status: ${inDecoration.join(', ')}`).toEqual([]);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 13. APPOINTMENT LANGUAGE PRESERVES BUSINESS CONFIRMATION
 *     The anchor is canonical: roadmap-config.js's front desk entry states
 *     that the owner confirms the slot. The guard asserts that anchor still
 *     exists (and fails loudly if it moved) and then holds every booking
 *     sentence a reader can see to it.
 * ==================================================================== */
test('13. every booking claim keeps the business in the loop', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    for (const url of [HOMEPAGE_URL, SUBJECT_URL]) {
      await page.goto(url);
      const roadmap = await readCanonicalRoadmap(page);

      /* THE ANCHOR. If canonical stops saying the business confirms, this fails
         here rather than silently loosening every sentence below. */
      const frontDesk = roadmap.services.find((s) => s.slug === 'ai-front-desk');
      expect(frontDesk, 'roadmap-config.js no longer carries the ai-front-desk service, which is the anchor for this rule').toBeTruthy();
      const anchorText = `${frontDesk.desc || ''} ${(frontDesk.functions || []).join(' ')}`;
      expect(
        /\bconfirm/i.test(anchorText),
        `roadmap-config.js's front desk entry no longer states that the business confirms the appointment. `
        + `The anchor this guard derives from has moved and the rule must be re-derived, not relaxed. Text: "${anchorText.slice(0, 200)}"`,
      ).toBe(true);

      /* Canonical knows of no available service that books a calendar itself. */
      const bookingIsLive = roadmap.services.some((s) => s.status === 'available'
        && /\b(books?|booking)\b[^.]{0,40}\bcalendar\b/i.test(`${s.desc || ''} ${(s.functions || []).join(' ')}`));
      expect(bookingIsLive, 'canonical now marks direct calendar booking available; this guard must be re-derived rather than left asserting the old shape').toBe(false);

      const sentences = await page.evaluate(() => {
        const blocks = Array.from(document.querySelectorAll('p, li, summary, td, th, h2, h3, dd'));
        const out = [];
        for (const b of blocks) {
          const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
          if (!t) continue;
          for (const s of t.split(/(?<=[.!?])\s+/)) if (s.trim()) out.push(s.trim());
        }
        return out;
      });
      expect(sentences.length, `${url} produced no sentences to check`).toBeGreaterThan(20);

      /* A CLAIM, NOT A MENTION. "custom booking flows genuinely take longer" is
         about scheduling and asserts nothing about who books; matching the noun
         alone made this guard fail on correct copy, which is how a guard gets
         loosened until it means nothing. What is matched is the system doing
         the booking: a booking verb with an object, an appointment being put
         into a state, or a claim that booking is a live capability. */
      const BOOKING_CLAIM = [
        /\b(books?|schedules?)\s+(the|your|a|an|it|them|you|in|into|directly|straight)\b/i,
        /\b(appointments?|slots?|jobs?|times?)\s+(are|is|get|gets)\s+(booked|scheduled|confirmed|set)\b/i,
        /\bbookings?\s+(is|are)\s+(live|available|included|supported)\b/i,
        /\b(books?|schedules?)\s+(it|the job|the work)?\s*(in|into)\s+(your|the)\s+calendar\b/i,
      ];
      const CONFIRM = /\b(confirm|confirms|confirmed|confirmation|you approve|your approval|on your say-so|sends? it to you|texts? it to you|so you can)\b/i;
      const DENIAL = /\b(not yet|does not|do not|cannot|can't|is not live|not live|no direct|in development|on the roadmap|will not|would)\b/i;

      const failures = [];
      sentences.forEach((s, i) => {
        if (s.split(/\s+/).length < 6) return; /* button labels are not claims */
        if (s.trim().endsWith('?')) return;    /* a question is not a claim */
        if (!BOOKING_CLAIM.some((p) => p.test(s))) return;
        const neighbourhood = `${s} ${sentences[i + 1] || ''}`;
        if (CONFIRM.test(neighbourhood) || DENIAL.test(neighbourhood)) return;
        failures.push(s);
      });
      expect(
        failures,
        `${url}: booking or appointment claims that neither name the business's confirmation nor deny the capability:\n  - ${failures.join('\n  - ')}`,
      ).toEqual([]);

      /* THE POSITIVE HALF, and the reason this guard is not vacuous. A page that
         describes taking an appointment time at all must somewhere state that
         the business confirms it. Deleting the confirmation sentence is the
         realistic regression, and a rule that only bans bad sentences would let
         it through by removing sentences rather than adding one. */
      const mentionsAppointments = sentences.some((s) => /\b(appointments?|slots?|the time the caller wants|books?|booking)\b/i.test(s));
      expect(
        mentionsAppointments,
        `${url} says nothing at all about appointments, slots or booking, so the rule above had nothing to hold. `
        + 'A page that stops describing the appointment path has not satisfied this requirement, it has stepped outside it, '
        + 'and that is a decision to make deliberately rather than to discover in a green run.',
      ).toBe(true);
      const confirms = sentences.filter((s) => CONFIRM.test(s) && /\b(slot|appointment|time|job|booking)\b/i.test(s));
      expect(
        confirms.length,
        `${url} describes taking appointment times but never says the business confirms them. `
        + `Canonical's anchor for this is roadmap-config.js's ai-front-desk entry: "${anchorText.slice(0, 120)}"`,
      ).toBeGreaterThan(0);

      /* And the strongest form is banned outright while canonical says it is
         not live: a sentence that has the system putting the job in the
         calendar itself, with no question mark and no denial anywhere near it. */
      const hard = sentences.filter((s, i) => /\bbooks?\b[^.]{0,40}\b(in|into)\b[^.]{0,25}\bcalendar\b/i.test(s)
        && !s.trim().endsWith('?')
        && !DENIAL.test(`${sentences[i - 1] || ''} ${s} ${sentences[i + 1] || ''}`));
      expect(hard, `${url}: a sentence claims direct calendar booking, which canonical does not mark available:\n  - ${hard.join('\n  - ')}`).toEqual([]);
    }
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 14. MOBILE SELECTS THE MOBILE SEQUENCE
 *     The portrait sequence is a purpose-built composition, not a crop, so
 *     "mobile got the desktop frames" is a visual defect a reader would see
 *     and no console would report.
 * ==================================================================== */
test('14. a phone viewport fetches and paints the portrait sequence', async ({ browser }) => {
  const { context, page } = await open(browser, { viewport: MOBILE, deviceScaleFactor: 2, isMobile: false });
  try {
    await assertServingThisWorktree(page);
    const requests = recordRequests(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    const id = SEQUENCES[0];
    const variant = variantOf(manifest, id, 'mobile');
    const desktopVariant = variantOf(manifest, id, 'desktop');
    expect(variant.width, 'the mobile variant is not portrait; the manifest describes a crop, not a composition').toBeLessThan(variant.height);
    expect(variant.frameCount, 'the two variants have the same frame count, which would make this guard unable to tell them apart').not.toBe(desktopVariant.frameCount);

    await scrollToProgress(page, stageSel(id), 0.5);
    const frames = requests.frames();
    expect(frames.length, 'no frames were fetched at all on the phone viewport').toBeGreaterThan(0);
    const landscape = frames.filter((u) => !isMobileFrame(u));
    expect(landscape, `a phone viewport fetched ${landscape.length} desktop frames: ${landscape.slice(0, 3).join(', ')}`).toEqual([]);

    /* And the pixels agree: decoded against the MOBILE geometry. */
    const expectedNow = await expectedFrameIndex(page, stageSel(id), variant.frameCount);
    const read = await readCanvasFrame(page, canvasSel(id), variant);
    expect(read.frameIndex, `phone stage should paint frame ${expectedNow.index}, paints ${read.frameIndex}`).toBe(expectedNow.index);
    expect(read.sequenceOrdinal).toBe(manifest.sequences.find((s) => s.id === id).ordinal);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 15. KEYBOARD NAVIGATION REMAINS COMPLETE THROUGH STICKY SECTIONS
 * ==================================================================== */
test('15. tabbing reaches every control through the sticky stages, in order, uncovered', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    const expectedOrder = await page.evaluate(() => {
      const sel = 'a[href], button, summary, input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])';
      const list = [];
      document.querySelectorAll(sel).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (r.width === 0 && r.height === 0) return;
        el.setAttribute('data-guard-focus', String(i));
        list.push(String(i));
      });
      return list;
    });
    expect(expectedOrder.length, 'the subject page has too few controls for this to prove anything').toBeGreaterThan(8);

    const reached = [];
    const covered = [];
    await page.evaluate(() => { window.scrollTo(0, 0); document.body.focus(); });
    for (let i = 0; i < expectedOrder.length + 6; i += 1) {
      await page.keyboard.press('Tab');
      const step = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const id = el.getAttribute('data-guard-focus');
        const r = el.getBoundingClientRect();
        const inViewport = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
        let hit = null;
        if (inViewport && r.width > 2 && r.height > 2) {
          const x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1);
          const y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
          const top = document.elementFromPoint(x, y);
          hit = top ? {
            reaches: top === el || el.contains(top) || top.contains(el),
            tag: top.tagName.toLowerCase(),
            inDecoration: !!top.closest('.cine-stage__sticky'),
          } : null;
        }
        return { id, inViewport, hit, text: (el.textContent || '').trim().slice(0, 40) };
      });
      if (!step) continue;
      if (step.id !== null && !reached.includes(step.id)) reached.push(step.id);
      if (step.hit && !step.hit.reaches && step.hit.inDecoration) {
        covered.push(`${step.text} is covered by the stage decoration (${step.hit.tag})`);
      }
      if (reached.length === expectedOrder.length) break;
    }

    const missed = expectedOrder.filter((id) => !reached.includes(id));
    expect(missed.length, `tabbing never reached ${missed.length} of ${expectedOrder.length} controls; a sticky stage is swallowing focus`).toBe(0);
    expect(reached, 'the tab order does not follow document order through the sticky stages').toEqual(expectedOrder);
    expect(covered, `focused controls sit underneath the canvas layer:\n  ${covered.join('\n  ')}`).toEqual([]);

    /* The homepage must not trap focus either. */
    await page.goto(HOMEPAGE_URL);
    const seenOnHome = new Set();
    let stuck = 0;
    let previous = null;
    for (let i = 0; i < 60; i += 1) {
      await page.keyboard.press('Tab');
      const key = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return 'none';
        return `${el.tagName}:${(el.getAttribute('href') || el.id || el.textContent || '').trim().slice(0, 40)}`;
      });
      if (key === previous) stuck += 1; else stuck = 0;
      previous = key;
      seenOnHome.add(key);
      expect(stuck, `focus stopped moving on home.html at ${key}`).toBeLessThan(3);
    }
    expect(seenOnHome.size, 'home.html moved focus through almost nothing in sixty presses').toBeGreaterThan(10);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 16. NO HORIZONTAL OVERFLOW
 * ==================================================================== */
test('16. nothing scrolls sideways at any width', async ({ browser }) => {
  for (const width of [360, 375, 768, 1024, 1440]) {
    const { context, page } = await open(browser, { viewport: { width, height: 800 } });
    try {
      await assertServingThisWorktree(page);
      for (const url of [HOMEPAGE_URL, SUBJECT_URL]) {
        await page.goto(url);
        if (url === SUBJECT_URL) await page.waitForFunction(() => window.__cine && window.__cine.ready, null, { timeout: 20_000 });
        /* Measured at the top and again mid-page, because a sticky stage that
           overflows only once it is stuck is still an overflow. */
        for (const at of [0, 0.35, 0.7]) {
          await page.evaluate((f) => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * f)), at);
          await page.waitForTimeout(120);
          const report = await horizontalOverflow(page);
          expect(
            report.overflow,
            `${url} at ${width}px, ${Math.round(at * 100)}% down: the document is ${report.scrollWidth}px wide in a ${report.clientWidth}px viewport. `
            + `Widest offenders: ${JSON.stringify(report.culprits.slice(0, 4))}`,
          ).toBeLessThanOrEqual(1);
        }
      }
    } finally { await context.close(); }
  }
});

/* ==================================================================== *
 * 17. NO CANVAS INTERCEPTS PRICING OR CTA CLICKS
 *     Three independent ways of asking, because a computed pointer-events
 *     value on the canvas answers a narrower question than "can the visitor
 *     click this": a wrapper, an overlay or a stacking context can
 *     intercept instead.
 * ==================================================================== */
test('17. the canvas never takes a click meant for a price or a call to action', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await openSubject(page);
    await assertBoundToShippedEngine(page);

    /* (a) the decoration layer declares itself untouchable */
    const layers = await page.evaluate(() => Array.from(document.querySelectorAll('[data-cine-stage]')).map((st) => {
      const sticky = st.querySelector('.cine-stage__sticky');
      const canvas = st.querySelector('canvas[data-cine-canvas]');
      const sr = sticky ? sticky.getBoundingClientRect() : null;
      const str = st.getBoundingClientRect();
      return {
        id: st.getAttribute('data-cine-stage'),
        stickyPointerEvents: sticky ? getComputedStyle(sticky).pointerEvents : null,
        canvasPointerEvents: canvas ? getComputedStyle(canvas).pointerEvents : null,
        canvasAriaHidden: canvas ? canvas.getAttribute('aria-hidden') : null,
        canvasRole: canvas ? canvas.getAttribute('role') : null,
        overflowsStage: sr ? Math.round(sr.bottom - str.bottom) : null,
      };
    }));
    expect(layers.length).toBe(3);
    for (const l of layers) {
      expect(l.stickyPointerEvents, `${l.id}: the sticky stage is pointer-events:${l.stickyPointerEvents}`).toBe('none');
      expect(l.canvasAriaHidden, `${l.id}: the canvas is not aria-hidden, so a screen reader is offered decoration`).toBe('true');
      expect(l.canvasRole, `${l.id}: the canvas has role ${l.canvasRole}`).toBe('presentation');
      expect(l.overflowsStage, `${l.id}: the sticky layer hangs ${l.overflowsStage}px past the bottom of its stage, over the content that follows`).toBeLessThanOrEqual(1);
    }

    /* (b) hit tests at every scroll position where the canvas is actually in
           front of the thing being tested, so a pass cannot come from the
           canvas being somewhere else. */
    const decisionStage = SEQUENCES[SEQUENCES.length - 1];
    /* NON-VACUITY. The hit tests below are skipped at a scroll position where
       the canvas is not in front of the cards, because a pass there would only
       say the canvas was somewhere else. That skip is also how this whole guard
       could go quietly green, so the number of positions where the canvas
       really was over a pricing card is counted and asserted. */
    let overlappedAt = 0;
    for (const progress of [0.15, 0.5, 0.85]) {
      await scrollToProgress(page, stageSel(decisionStage), progress);
      const overlap = await page.evaluate((sel) => {
        const canvas = document.querySelector(sel);
        const cr = canvas.getBoundingClientRect();
        const cards = Array.from(document.querySelectorAll('#pricePreview .price-card'));
        return cards.filter((c) => {
          const r = c.getBoundingClientRect();
          return r.bottom > cr.top && r.top < cr.bottom && r.right > cr.left && r.left < cr.right;
        }).length;
      }, canvasSel(decisionStage));
      if (!overlap) continue;
      overlappedAt += 1;
      for (const selector of ['#pricePreview .price-card', '[data-cta]']) {
        const results = await hitTest(page, selector);
        for (const r of results) {
          for (const point of r.points) {
            if (point.outsideViewport || point.hit === null) continue;
            expect(
              point.isCanvas || point.inStageDecoration,
              `"${r.text}" is covered by the cinematic layer (${point.tag}) at ${Math.round(progress * 100)}% through ${decisionStage}. `
              + 'Pricing cards never sit under the canvas hit area.',
            ).toBe(false);
          }
        }
      }
      /* (c) the browser's own actionability check: a trial click fails if
             anything intercepts the pointer. */
      const cards = page.locator('#pricePreview .price-card');
      const n = await cards.count();
      expect(n, 'no pricing cards were rendered, so nothing was hit tested').toBeGreaterThan(0);
      for (let i = 0; i < n; i += 1) {
        await cards.nth(i).click({ trial: true, timeout: 4000 });
      }
      const ctas = page.locator('[data-cta]');
      const m = await ctas.count();
      for (let i = 0; i < m; i += 1) {
        const cta = ctas.nth(i);
        if (!(await cta.isVisible())) continue;
        await cta.click({ trial: true, timeout: 4000 });
      }
    }
    expect(
      overlappedAt,
      'the canvas was never in front of a pricing card at any of the three scroll positions, so nothing was hit tested. '
      + 'This guard would report a pass about a canvas that happened to be somewhere else.',
    ).toBeGreaterThan(0);
  } finally { await context.close(); }
});
