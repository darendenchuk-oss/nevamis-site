/* ============================================================
   NEVAMIS MOTION PROOF
   Static screenshots are not proof. This suite proves the hero
   actually animates in a real browser: a WebM recording of the
   live opening sequence, real-time frames (motion is genuinely
   running), deterministic seeked frames (each narrative state is
   correct), plus cursor, reduced-motion and responsive coverage.
   ============================================================ */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('artifacts/motion-proof');
const PAGE = '/home.html?motionDebug=1';   // forces motion so CI/headless never sees the reduced fallback
const PLAIN = '/home.html';

const notes = [];
function note(file, proves) { notes.push({ file, proves }); }

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

/** Fail the run on any console error or uncaught page exception. */
function watchErrors(page, sink) {
  page.on('console', (m) => { if (m.type() === 'error') sink.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => sink.push(`pageerror: ${e.message}`));
}

test('hero opening sequence records as WebM with no console errors', async ({ browser }) => {
  const errors = [];
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(OUT, '_video'), size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  watchErrors(page, errors);

  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL, null, { timeout: 10_000 });
  // let the full ~8s sequence plus a slice of idle play out in real time
  await page.waitForTimeout(10_000);

  await page.close();
  const video = page.video();
  const dest = path.join(OUT, 'hero-opening-sequence.webm');
  if (video) await video.saveAs(dest);
  await ctx.close();

  expect(errors, `console/page errors:\n${errors.join('\n')}`).toEqual([]);
  expect(fs.existsSync(dest)).toBeTruthy();
  note('hero-opening-sequence.webm', 'The full opening sequence playing in real time in a real browser — proves motion is genuinely running, not a still.');
});

test('real-time frames prove motion is progressing on its own', async ({ page }) => {
  const errors = [];
  watchErrors(page, errors);
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);

  const marks = [0.5, 1.5, 3.0, 5.0, 7.5];
  const seen = [];
  let last = 0;
  for (const m of marks) {
    await page.waitForTimeout(Math.max(0, m * 1000 - last));
    last = m * 1000;
    const t = await page.evaluate(() => window.__heroTL.time());
    seen.push(Number(t.toFixed(2)));
    const file = `realtime-${String(m).replace('.', 'p')}s.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    note(file, `Live (unpaused) capture at ~${m}s wall clock; timeline reported t=${t.toFixed(2)}s.`);
  }
  // the timeline must actually advance over wall-clock time
  expect(seen[seen.length - 1]).toBeGreaterThan(seen[0]);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('each narrative state renders correctly when seeked deterministically', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);

  const beats = await page.evaluate(() => (window.__heroBeats || []).map((b) => ({ key: b.key, label: b.label, time: b.time })));
  expect(beats.length, 'hero must expose its narrative beats').toBeGreaterThanOrEqual(5);

  for (const b of beats) {
    await page.evaluate((t) => { window.__heroTL.pause(Math.min(t, window.__heroTL.duration())); }, b.time);
    await page.waitForTimeout(120); // let the paused frame paint
    const file = `state-${b.key}.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    note(file, `Narrative state "${b.label}" seeked to t=${b.time}s.`);
  }
});

test('the motion inspector is dev-only and never ships in the normal view', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  await expect(page.locator('.nv-dbg'), 'debug UI must not appear in production view').toHaveCount(0);

  await page.goto(PAGE);
  await page.waitForFunction(() => !!window.__heroTL);
  await expect(page.locator('.nv-dbg')).toHaveCount(1);

  // the controls the brief asks for
  const panel = page.locator('.nv-dbg');
  await expect(panel.getByRole('button', { name: /pause|play/i }).first()).toBeVisible();
  await expect(panel.getByRole('button', { name: /restart/i })).toBeVisible();
  await expect(panel.locator('input[type=range]')).toHaveCount(1);
  await expect(panel.getByRole('button', { name: /simulate reduced motion/i })).toBeVisible();
  for (const s of ['0.25×', '0.5×', '1×']) {
    await expect(panel.getByRole('button', { name: s, exact: true })).toBeVisible();
  }
  const beatButtons = await panel.locator('.beats button').count();
  expect(beatButtons, 'a jump button per narrative beat').toBeGreaterThanOrEqual(5);

  await page.screenshot({ path: path.join(OUT, 'motion-inspector.png') });
  note('motion-inspector.png', 'The ?motionDebug=1 inspector: transport, scrubber, speeds, per-beat jumps and a reduced-motion simulation.');
});

test('custom cursor has multiple meaningful states on a fine-pointer desktop', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);

  await page.mouse.move(700, 500);
  await page.waitForTimeout(300);
  const cur = page.locator('.nv-cur');
  const halo = page.locator('.nv-halo');
  await expect(cur).toHaveCount(1);
  await expect(halo).toHaveCount(1);
  await expect(cur).not.toHaveCSS('opacity', '0');
  await page.screenshot({ path: path.join(OUT, 'cursor-default.png') });
  note('cursor-default.png', 'Custom cursor visible in its default state (mint node + trailing halo).');

  // hovering the primary CTA should form the arch in the halo
  const cta = page.locator('a.btn-primary').first();
  await cta.hover();
  await page.waitForTimeout(450);
  const archOpacity = await page.evaluate(() => {
    const a = document.querySelector('.nv-halo .nv-arch');
    return a ? Number(getComputedStyle(a).opacity) : -1;
  });
  expect(archOpacity, 'the Nevamis arch should form around a hovered control').toBeGreaterThan(0.5);
  await page.screenshot({ path: path.join(OUT, 'cursor-button-arch.png') });
  note('cursor-button-arch.png', 'Hovering a control: the halo wraps the button and the Nevamis arch forms around it.');

  // the cursor must never block clicks
  const blocks = await page.evaluate(() => {
    const c = document.querySelector('.nv-cur');
    return getComputedStyle(c).pointerEvents !== 'none';
  });
  expect(blocks, 'cursor elements must not intercept pointer events').toBeFalsy();
});

test('a parked halo returns to the pointer when scrolling moves the button away', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  await page.evaluate(() => { window.__heroTL.progress(1).pause(); });

  // hover the hero's primary CTA so the halo wraps it
  const cta = page.locator('a.btn-primary[data-cta]').first();
  const box = await cta.boundingBox();
  const px = box.x + box.width / 2, py = box.y + box.height / 2;
  await page.mouse.move(px, py);
  await page.waitForTimeout(450);
  const parkedW = await page.evaluate(() => document.querySelector('.nv-halo').getBoundingClientRect().width);
  expect(parkedW, 'halo should wrap the hovered button').toBeGreaterThan(100);

  // wheel-scroll far away WITHOUT moving the mouse — no hover events fire
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(900);

  const after = await page.evaluate(() => {
    const h = document.querySelector('.nv-halo').getBoundingClientRect();
    return { x: h.x + h.width / 2, y: h.y + h.height / 2, w: h.width };
  });
  // released from the (now off-point) button and home at the pointer
  expect(Math.abs(after.x - px), 'halo x should follow the pointer after scroll').toBeLessThan(80);
  expect(Math.abs(after.y - py), 'halo y should follow the pointer after scroll').toBeLessThan(80);
  expect(after.w, 'halo should no longer wrap the departed button').toBeLessThan(100);
});

test('reduced motion shows the finished hero immediately and stays still', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  watchErrors(page, errors);

  await page.goto(PLAIN);
  await page.waitForTimeout(600);

  // headline and CTAs must already be readable — not waiting on a timeline
  await expect(page.locator('h1')).toBeVisible();
  const cta = page.locator('a.btn-primary').first();
  await expect(cta).toBeVisible();

  // nothing should still be animating
  const stillMoving = await page.evaluate(() => {
    const g = window.gsap;
    return g ? g.globalTimeline.getChildren(true, true, true).filter((t) => t.isActive()).length : 0;
  });
  expect(stillMoving, 'reduced motion must not leave animations running').toBe(0);

  // and no custom cursor
  await expect(page.locator('.nv-cur')).toHaveCount(0);

  await page.screenshot({ path: path.join(OUT, 'reduced-motion.png') });
  note('reduced-motion.png', 'prefers-reduced-motion: the completed hero shown immediately, nothing animating, no custom cursor.');
  expect(errors, errors.join('\n')).toEqual([]);
  await ctx.close();
});

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '390x844', width: 390, height: 844 },
  // Short phones are where the fold actually bites. Testing only 390x844 hid a
  // real bug: the hero visual pushed both CTAs off-screen on an iPhone SE.
  { name: '375x667', width: 375, height: 667 },
  { name: '360x640', width: 360, height: 640 },
];

for (const vp of VIEWPORTS) {
  test(`layout holds at ${vp.name}: CTAs usable, no horizontal overflow`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errors = [];
    watchErrors(page, errors);

    // the plain URL, so the dev inspector never obscures the real layout
    await page.goto(PLAIN);
    await page.waitForFunction(() => !!window.__heroTL);
    // jump to the resolved state so CTAs are present
    // NB: braces matter. GSAP methods return the timeline, and returning that
    // circular object graph to Playwright makes serialisation hang.
    await page.evaluate(() => { window.__heroTL.progress(1).pause(); });
    await page.waitForTimeout(250);

    const primary = page.locator('a.btn-primary').filter({ hasText: /Hear it answer/i }).first();
    // scope to the hero CTAs — the header also holds .btn-ghost, and on
    // mobile that one legitimately lives inside the closed menu
    const secondary = page.locator('a.btn-ghost[data-cta]').first();
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();

    // No horizontal overflow. scrollWidth alone is not enough — body has
    // overflow-x:hidden, which silently clips offenders. So also assert that no
    // visible element extends past the right edge.
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `horizontal overflow at ${vp.name}`).toBeLessThanOrEqual(1);

    const escapees = await page.evaluate((vw) =>
      Array.from(document.querySelectorAll('body *'))
        .filter((el) => {
          const s = getComputedStyle(el);
          if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
          const b = el.getBoundingClientRect();
          if (!(b.width > 0 && b.height > 0 && b.right > vw + 1)) return false;
          // An element clipped by a scroll/overflow ancestor (marquee track,
          // horizontally scrollable table) is by design wider than the
          // viewport — only unclipped elements are real overflow bugs.
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const ox = getComputedStyle(a).overflowX;
            if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return false;
          }
          return true;
        })
        .slice(0, 5)
        .map((el) => `${el.tagName}.${el.getAttribute('class') || el.id || ''} right=${Math.round(el.getBoundingClientRect().right)}`),
    vp.width);
    expect(escapees, `elements past the right edge at ${vp.name}`).toEqual([]);

    // The primary CTA must sit above the fold on EVERY supported size, phones
    // included. This is the conversion guarantee, not a desktop nicety.
    const box = await primary.boundingBox();
    expect(box.y + box.height, `primary CTA must sit above the fold at ${vp.name}`).toBeLessThan(vp.height);

    const file = `layout-${vp.name}.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    note(file, `Resolved hero at ${vp.name}: both CTAs visible and no horizontal overflow.`);

    // the storytelling beat must survive the shrink, not just the resolved frame.
    // 3.65 = the middle of the ANSWER dwell (see MOTION.beats "route").
    await page.evaluate(() => { window.__heroTL.pause(3.65); });
    await page.waitForTimeout(180);
    const storyFile = `story-${vp.name}.png`;
    await page.screenshot({ path: path.join(OUT, storyFile) });
    note(storyFile, `The ANSWER step of the routing story at ${vp.name} — checks the narrative stays legible as the stage shrinks.`);

    expect(errors, errors.join('\n')).toEqual([]);
    await ctx.close();
  });
}

test('scroll story renders at 0/25/50/75/100% with no overflow', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  await page.evaluate(() => { window.__heroTL.progress(1).pause(); });

  for (const pct of [0, 25, 50, 75, 100]) {
    await page.evaluate((p) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: (max * p) / 100, behavior: 'instant' });
    }, pct);
    await page.waitForTimeout(450);
    const file = `scroll-${String(pct).padStart(3, '0')}.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    note(file, `Page at ${pct}% scroll progress.`);
  }

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('the stage story replays, and the headline and CTAs never re-enter', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  // Fast-forward GSAP's clock so the idle handoff and the scheduled replay
  // arrive in test time rather than ~18 real seconds.
  await page.evaluate(() => { window.gsap.globalTimeline.timeScale(12); });
  await page.waitForFunction(() => window.__heroTL.progress() === 1, null, { timeout: 20_000 });

  const settled = await page.evaluate(() => ({
    word1: getComputedStyle(document.querySelector('h1 .w[data-w="1"]')).transform,
    word2: getComputedStyle(document.querySelector('h1 .w[data-w="2"]')).transform,
    cta: getComputedStyle(document.querySelector('[data-cta]')).opacity,
    nav: getComputedStyle(document.querySelector('[data-nav]')).opacity,
  }));

  // the story comes back on its own
  await page.waitForFunction(
    () => Number(getComputedStyle(document.getElementById('story')).opacity) > 0.5,
    null, { timeout: 30_000 });

  const duringReplay = await page.evaluate(() => ({
    word1: getComputedStyle(document.querySelector('h1 .w[data-w="1"]')).transform,
    word2: getComputedStyle(document.querySelector('h1 .w[data-w="2"]')).transform,
    cta: getComputedStyle(document.querySelector('[data-cta]')).opacity,
    nav: getComputedStyle(document.querySelector('[data-nav]')).opacity,
    storyVisible: Number(getComputedStyle(document.getElementById('story')).opacity),
  }));

  expect(duringReplay.storyVisible, 'the stage story should replay').toBeGreaterThan(0.5);
  expect(duringReplay.word1, 'headline must not re-animate').toBe(settled.word1);
  expect(duringReplay.word2, 'headline must not re-animate').toBe(settled.word2);
  expect(duringReplay.cta, 'CTAs must stay put').toBe(settled.cta);
  expect(duringReplay.nav, 'navigation must stay put').toBe(settled.nav);

  await page.evaluate(() => { window.gsap.globalTimeline.timeScale(1); });
});

/* What this measures, and what it deliberately does not.

   It used to start sampling the instant window.__heroTL existed — the busiest
   moment of the page's life, with site.js, motion.js, the module graph, the
   fonts and the aurora canvas all still landing — and then sample 420 frames,
   about seven seconds, well past the opening sequence into steady state. It
   failed on six frames over 50ms in that window.

   So it was measuring load contention and the machine's scheduler at least as
   much as the animation, and it showed: on this machine it failed roughly one
   run in three, at the same rate on an untouched tree as on a changed one. A
   guard that cries wolf a third of the time is one engineers learn to re-run
   rather than read, which is worse than no guard.

   It now waits for the page to go quiet, REPLAYS the opening sequence, and
   measures only that. Same intent — catch a filter or a layout thrash creeping
   into the hero — with the load noise removed instead of the threshold raised.

   The criterion is median-first because a median cannot be moved by one GC
   pause, and the long-frame budget is a RATIO so it does not depend on how many
   frames the sample happens to contain. */
test('the opening sequence holds a smooth frame rate', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);

  // Warm-up: let load settle. Quiet means 20 consecutive frames under 20ms,
  // or 4s elapsed, whichever comes first - a slow machine still gets measured,
  // it just gets measured on the animation rather than on its own startup.
  await page.evaluate(() => new Promise((res) => {
    const started = performance.now();
    let calm = 0, last = performance.now();
    (function tick() {
      const now = performance.now();
      calm = now - last < 20 ? calm + 1 : 0;
      last = now;
      if (calm >= 20 || now - started > 4000) res(null);
      else requestAnimationFrame(tick);
    })();
  }));

  const stats = await page.evaluate(() => new Promise((res) => {
    const deltas = [];
    window.__heroTL.restart();
    let last = performance.now();
    const started = last;
    (function tick() {
      const now = performance.now();
      deltas.push(now - last); last = now;
      // Measure the replay itself, not the calm after it.
      if (now - started < 2500) requestAnimationFrame(tick);
      else {
        const sorted = [...deltas].sort((a, b) => a - b);
        const pct = (q) => sorted[Math.floor(sorted.length * q)];
        res({
          frames: deltas.length,
          median: pct(0.5),
          p90: pct(0.9),
          longRatio: deltas.filter((d) => d > 50).length / deltas.length,
        });
      }
    })();
  }));

  expect(stats.frames, 'too few frames sampled to say anything').toBeGreaterThan(40);
  expect(stats.median, `median frame ${stats.median.toFixed(1)}ms during the hero replay`)
    .toBeLessThan(24);
  expect(stats.longRatio, `${(stats.longRatio * 100).toFixed(1)}% of frames over 50ms`)
    .toBeLessThan(0.12);
});

test('scrolling away mid-intro finishes the hero instead of freezing the wake veil', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  // a real visitor: lands and immediately scrolls into the page
  await page.evaluate(() => window.scrollTo({ top: 2600, behavior: 'instant' }));
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => ({
    wakeOpacity: Number(getComputedStyle(document.getElementById('wake')).opacity),
    wakeVisibility: getComputedStyle(document.getElementById('wake')).visibility,
    heroDone: window.__heroTL.progress() === 1,
    h1Visible: getComputedStyle(document.querySelector('h1 .w')).visibility,
  }));
  expect(state.wakeOpacity, 'the wake overlay must never freeze mid-fade').toBeLessThan(0.05);
  expect(state.heroDone, 'scrolling away skips the intro').toBe(true);
  expect(state.h1Visible).toBe('visible');
});

test('keyboard users reach every control with a visible focus ring', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);
  await page.evaluate(() => { window.__heroTL.progress(1).pause(); });

  // the skip link must come first
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement?.className || '');
  expect(first, 'first tab stop should be the skip link').toContain('skip');

  const reached = [];
  for (let i = 0; i < 18; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const s = getComputedStyle(el);
      // A control inside an overflow:hidden reveal mask draws its focus ring as
      // an inset shadow instead of an outline, so accept either.
      const hasOutline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
      const hasInsetRing = /inset/.test(s.boxShadow) && s.boxShadow !== 'none';
      return {
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28),
        focusIndicator: hasOutline ? 'outline' : hasInsetRing ? 'inset-ring' : 'NONE',
      };
    });
    if (info) reached.push(info);
  }

  const labels = reached.map((r) => r.text).join(' | ');
  expect(labels, 'the primary CTA must be keyboard reachable').toContain('Hear it answer');
  expect(labels, 'the secondary CTA must be keyboard reachable').toContain('Book a 15-min call');

  for (const r of reached) {
    expect(r.focusIndicator, `no visible focus ring on "${r.text}"`).not.toBe('NONE');
  }

  await page.screenshot({ path: path.join(OUT, 'focus-ring.png') });
  note('focus-ring.png', 'Keyboard focus walking the header and hero controls, each with a visible mint focus ring.');
});

test('decorative visuals are hidden from assistive tech', async ({ page }) => {
  await page.goto(PLAIN);
  await page.waitForFunction(() => !!window.__heroTL);

  const a11y = await page.evaluate(() => ({
    svgHidden: document.getElementById('mark')?.getAttribute('aria-hidden'),
    statusHidden: document.getElementById('status')?.getAttribute('aria-hidden'),
    wakeHidden: document.getElementById('wake')?.getAttribute('aria-hidden'),
    h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
    /* The authored sentence, before hero.js takes it apart. */
    h1Label: document.querySelector('h1')?.getAttribute('aria-label')?.replace(/\s+/g, ' ').trim(),
    /* The story the animation tells must also exist as real text.
       'books' was one of these words until 2026-08-09, and it was pinning a
       claim the product cannot keep: provisioned agents get end_call and no
       booking tool, so the prompt makes them say a person will confirm the
       time. The assertion was right about the principle and wrong about the
       verb — a test can hold false copy in place just as firmly as true. */
    lede: (document.querySelector('.lede')?.textContent || '').replace(/\s+/g, ' ').trim(),
  }));

  expect(a11y.svgHidden, 'the narrative SVG is decorative and must be hidden from AT').toBe('true');
  expect(a11y.statusHidden).toBe('true');
  expect(a11y.wakeHidden).toBe('true');
  /* THE TWO MUST BE THE SAME SENTENCE. That is what this always meant - "the
     words the curtain animates are also the words a screen reader is handed"
     - and a literal was simply how completeness got enforced, since a
     substring match would pass with half the headline missing.

     Comparing the split DOM text against the authored aria-label enforces it
     directly and cannot be broken by writing new copy: the headline changed
     with the Revenue OS repositioning and this failed on the wording while
     the accessibility property it guards was never in question. A test that
     fails for copy is a test that gets edited on autopilot, and this one
     sits beside three assertions worth reading carefully. */
  expect(a11y.h1Label, 'the split headline needs an aria-label').toBeTruthy();
  expect(a11y.h1Label.length, 'the label must be the whole sentence').toBeGreaterThan(20);
  expect(a11y.h1).toBe(a11y.h1Label);
  // meaning must not live only in the animation
  /* THE PROPERTY, NOT THE WORDS. This listed three verbs the lede had to
     contain. 'books' was a fourth until 2026-08-09, removed because it
     pinned a claim the product cannot keep - and the remaining three broke
     the same way when the Revenue OS repositioning rewrote the sentence.
     Twice now a green test has been holding particular copy in place while
     claiming to guard a principle.

     The principle is that the story the animation tells also exists as real
     text: a lede that is present, substantial, and saying something the
     headline does not. That is checkable without owning the wording. */
  expect(a11y.lede, 'the hero needs a lede in text, not only in motion').toBeTruthy();
  expect(a11y.lede.length, 'the lede must carry real substance').toBeGreaterThan(80);
  expect(a11y.lede).not.toBe(a11y.h1);
});

test.afterAll(async () => {
  const lines = [
    '# Nevamis hero — motion proof',
    '',
    'Generated by `npx playwright test`. Every file below was produced from a real',
    'Chromium session against the live local site, not from a mockup.',
    '',
    '| artifact | what it proves |',
    '| --- | --- |',
    ...notes.map((n) => `| \`${n.file}\` | ${n.proves} |`),
    '',
    '## How to read the WebM',
    '',
    '`hero-opening-sequence.webm` is the primary evidence: it is a continuous recording of',
    'the page loading and animating on its own with no scripted seeking. If the hero were',
    'static, this video would show a still frame for its whole duration.',
    '',
  ];
  fs.writeFileSync(path.join(OUT, 'REPORT.md'), lines.join('\n'), 'utf8');
});
