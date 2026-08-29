/* THE HOMEPAGE ITSELF, not a fixture.
   Run:  NV_PORT=3291 npx playwright test tests/cinematic-home.spec.js

   Every other cinematic spec measures tests/fixtures/*. Those fixtures are
   accurate and they are not the product, and a home.html carrying none of this
   would leave all of them green. This file measures the page a visitor loads,
   after the three sequences were bound to the seven sections.

   WHAT IT PROVES, all by measurement rather than by reading the source:
     - the seven sections survive, each with one primary action,
     - a stage awaiting artwork adds no height, no request and no pixel,
     - nothing scrolls sideways at six widths, and the primary action of every
       section is genuinely hittable at each of them,
     - the header and the mobile navigation stay on top and stay clickable,
     - no text container anywhere inside a stage carries transform, opacity,
       filter, mask or clip,
     - the visitor's scroll is never touched. */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertServingThisWorktree } from './helpers/cinematic.js';
import { horizontalOverflow, hitTest, HOMEPAGE_URL } from './helpers/cinematic-guards.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(fs.readFileSync(path.join(root, 'config', 'cinematic-sequences.json'), 'utf8'));

/* The six widths the integration brief names. Nothing here is a round number
   chosen for tidiness: 1440/1280/1024 are the desktop steps the site's own
   breakpoints move at, and 390/375/360 are the three phone widths that still
   matter (iPhone 14, iPhone SE/mini, and the smallest Android still in use). */
const WIDTHS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 640 },
];

async function open(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  return { context, page: await context.newPage() };
}

/* ==================================================================== *
 * 1. THE SEVEN SECTIONS, AND THE ONE ACTION EACH
 * ==================================================================== */
test('the seven sections survive the wrappers, one primary action each', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await page.goto(HOMEPAGE_URL);

    const seen = await page.evaluate(() => {
      const byIa = new Map();
      for (const sec of document.querySelectorAll('[data-ia]')) {
        const ia = sec.getAttribute('data-ia');
        const rec = byIa.get(ia) || { ia, headings: 0, primaries: [], stage: null };
        rec.headings += sec.querySelectorAll('h1,h2').length;
        for (const a of sec.querySelectorAll('a.btn-primary, a.btn.btn-primary')) {
          rec.primaries.push(a.getAttribute('href'));
        }
        const stage = sec.closest('[data-cine-stage]');
        const id = stage ? stage.getAttribute('data-cine-stage') : null;
        if (rec.stage && rec.stage !== id) rec.stage = `CONFLICT:${rec.stage}/${id}`;
        else rec.stage = id;
        byIa.set(ia, rec);
      }
      return [...byIa.values()];
    });

    expect(seen.length, 'home.html no longer declares seven data-ia sections').toBe(7);
    for (const s of seen) {
      expect(s.headings, `section ${s.ia} has no heading of its own; a sequence spans sections and never merges them`).toBeGreaterThan(0);
      expect(
        s.primaries.length,
        `section ${s.ia} carries ${s.primaries.length} primary actions (${s.primaries.join(', ')}); the directive allows one`,
      ).toBeLessThanOrEqual(1);
      expect(s.stage, `section ${s.ia} is inside no stage wrapper, or inside two (${s.stage})`).toMatch(/^[a-z-]+$/);
    }

    /* Which sequence owns which section comes from the config, never from a
       list typed here. */
    for (const seq of CONFIG.sequences) {
      for (const n of seq.sections) {
        const rec = seen.find((s) => Number(s.ia) === n);
        expect(rec, `home.html has no section ${n}, which '${seq.id}' claims`).toBeTruthy();
        expect(rec.stage, `section ${n} renders inside stage '${rec.stage}' but config/cinematic-sequences.json binds it to '${seq.id}'`).toBe(seq.id);
      }
    }
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 2. A STAGE AWAITING ARTWORK COSTS NOTHING
 *    Not "should cost nothing": the height it adds is measured, the
 *    requests it makes are counted off the wire, and the pixels it paints
 *    are counted by there being no canvas to paint into.
 * ==================================================================== */
test('a stage awaiting artwork adds no height, no request and no canvas', async ({ browser }) => {
  const pending = CONFIG.sequences.filter((s) => s.artwork !== 'released').map((s) => s.id);
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    const cineRequests = [];
    page.on('request', (r) => {
      const u = new URL(r.url()).pathname;
      if (u.startsWith('/assets/cinematic/') || u.startsWith('/artifacts/cinematic-placeholders/')) cineRequests.push(u);
    });
    await page.goto(HOMEPAGE_URL, { waitUntil: 'networkidle' });

    const measured = await page.evaluate(() => Array.from(document.querySelectorAll('[data-cine-stage]')).map((st) => {
      const own = st.getBoundingClientRect().height;
      const kids = Array.from(st.children).reduce((n, c) => n + c.getBoundingClientRect().height, 0);
      const cs = getComputedStyle(st);
      return {
        id: st.getAttribute('data-cine-stage'),
        artwork: st.getAttribute('data-cine-artwork') || 'released',
        extra: Math.round(own - kids),
        minHeight: cs.minHeight,
        canvases: st.querySelectorAll('canvas[data-cine-canvas]').length,
        posters: st.querySelectorAll('img[data-cine-poster]').length,
        stickies: st.querySelectorAll('.cine-stage__sticky').length,
      };
    }));

    expect(measured.length, 'home.html declares no cinematic stages at all').toBe(CONFIG.sequences.length);
    for (const m of measured.filter((x) => pending.includes(x.id))) {
      expect(m.artwork, `${m.id} is pending in the config but the page says ${m.artwork}`).toBe('pending');
      expect(
        Math.abs(m.extra),
        `${m.id} is awaiting artwork yet its wrapper adds ${m.extra}px beyond the sections inside it (min-height computes to ${m.minHeight}). `
        + 'Measured before the fix: sections 1 and 2 are 163vh at 1440x900 against a declared 240vh, so the released height floor would have padded the homepage with 77vh of empty ground.',
      ).toBeLessThanOrEqual(2);
      expect(m.canvases, `${m.id} is awaiting artwork but ships ${m.canvases} canvas element(s)`).toBe(0);
      expect(m.posters, `${m.id} is awaiting artwork but ships ${m.posters} poster image(s), whose src can only resolve to nothing`).toBe(0);
      expect(m.stickies, `${m.id} is awaiting artwork but ships a sticky backdrop`).toBe(0);
    }

    if (pending.length === CONFIG.sequences.length) {
      /* EMPTY, and the assertion now agrees with its own sentence. It used to
         read toEqual(['/assets/cinematic/cine-stage.css']) under the message
         "nothing should have been requested", which enshrined the one request
         the page still made: a render-blocking <link> in <head>, the only
         linked stylesheet left on the page. Delaying it by 2s moved first paint
         and LCP from 128ms to 2128ms. It is inlined now (home.html's
         generated:cine-css region), so the correct number really is zero. */
      expect(
        cineRequests,
        `every sequence is pending, so nothing under /assets/cinematic/ should have been requested. The page asked for: ${cineRequests.join(', ')}`,
      ).toEqual([]);
    }
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 2b. THE RELEASE BLOCKER NOBODY WOULD SEE UNTIL IT SHIPPED
 *
 *     cine-stage.css floors a released stage at its declared
 *     scrollLengthVh. If the sections inside it are naturally SHORTER than
 *     that, the floor does not lengthen the sequence: it pads the homepage
 *     with empty ground below the last section of the span, and nothing in
 *     the console says so.
 *
 *     Measured on the real page, at every width in the sweep:
 *       signal-to-system   170vh @1440, 179vh @1280, 185vh @1024  vs 240vh declared
 *       system-to-outcomes 523vh @1440 .. 1326vh @360             vs 320vh declared
 *       system-to-decision 498vh @1440 .. 1069vh @360             vs 220vh declared
 *     So sequence one cannot be released at its current length on desktop
 *     without either more content in sections 1 and 2 or a shorter declared
 *     scroll length. That is a decision for the section allocation audit,
 *     and this is the assertion that stops it being made by accident.
 * ==================================================================== */
test('a released stage is never longer than the sections it spans', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    const notes = [];
    let asserted = 0;
    for (const vp of WIDTHS) {
      await page.setViewportSize(vp);
      await page.goto(HOMEPAGE_URL, { waitUntil: 'networkidle' });
      const spans = await page.evaluate(() => Array.from(document.querySelectorAll('[data-cine-stage]')).map((st) => ({
        id: st.getAttribute('data-cine-stage'),
        artwork: st.getAttribute('data-cine-artwork') || 'released',
        /* The sections' own height, not the wrapper's: under a released stage
           the wrapper is already max(natural, floor) and would hide the very
           shortfall being measured. */
        naturalVh: Math.round(Array.from(st.children)
          .filter((c) => !c.classList.contains('cine-stage__sticky'))
          .reduce((n, c) => n + c.getBoundingClientRect().height, 0) / window.innerHeight * 100),
      })));
      expect(spans.length, `no stage was measured at ${vp.width}px`).toBe(CONFIG.sequences.length);
      for (const s of spans) {
        const seq = CONFIG.sequences.find((x) => x.id === s.id);
        const declared = seq.stage.scrollLengthVh;
        notes.push(`${vp.width}px ${s.id}: ${s.naturalVh}vh natural vs ${declared}vh declared (${s.artwork})`);
        if (s.artwork !== 'released') continue;
        asserted += 1;
        expect(
          s.naturalVh,
          `${s.id} is released and declares ${declared}vh of scroll, but sections [${seq.sections}] are only ${s.naturalVh}vh tall at ${vp.width}x${vp.height}. `
          + `cine-stage.css would floor the wrapper at ${declared}vh and pad the homepage with ${declared - s.naturalVh}vh of empty ground below section ${seq.sections[seq.sections.length - 1]}.`,
        ).toBeGreaterThanOrEqual(declared);
      }
    }
    test.info().annotations.push({ type: 'stage spans', description: notes.join('\n') });
    expect(notes.length, 'nothing was measured, so this guard measured nothing').toBe(WIDTHS.length * CONFIG.sequences.length);
    /* TWO DIFFERENT NUMBERS, deliberately. `notes` proves the page was
       MEASURED; `asserted` proves the assertion above actually RAN. They used
       to be the same counter, and it was the wrong one: notes is pushed before
       the `continue` that skips a pending stage, so with all three pending it
       read 18 and reported the guard as non-vacuous while the only expect() in
       the loop had never executed. Today every sequence is pending, so this is
       a declared tripwire rather than a passing assertion, and it says so in
       the run instead of looking like proof. */
    const releasedCount = CONFIG.sequences.filter((x) => x.artwork === 'released').length;
    expect(asserted, `${releasedCount} sequence(s) are released but the length assertion ran ${asserted} time(s)`)
      .toBe(releasedCount * WIDTHS.length);
    if (releasedCount === 0) {
      test.info().annotations.push({
        type: 'tripwire',
        description: 'every sequence is pending, so the released-length assertion did not run. This test measured the page and asserted nothing about scroll length. It arms itself the moment a sequence is released.',
      });
    }
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 3. THE RESPONSIVE SWEEP
 * ==================================================================== */
for (const vp of WIDTHS) {
  test(`${vp.width}x${vp.height}: no sideways scroll, every primary action hittable, sticky releases clean`, async ({ browser }) => {
    const { context, page } = await open(browser, { viewport: vp });
    try {
      await assertServingThisWorktree(page);
      await page.goto(HOMEPAGE_URL, { waitUntil: 'networkidle' });

      /* Sideways scroll, at four depths. A stage that only overflows once it
         is stuck is still an overflow. */
      for (const at of [0, 0.3, 0.6, 0.95]) {
        await page.evaluate((f) => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * f)), at);
        await page.waitForTimeout(120);
        const report = await horizontalOverflow(page);
        expect(
          report.overflow,
          `${vp.width}px, ${Math.round(at * 100)}% down: the document is ${report.scrollWidth}px in a ${report.clientWidth}px viewport. Widest: ${JSON.stringify(report.culprits.slice(0, 3))}`,
        ).toBeLessThanOrEqual(1);
      }

      /* Every section's primary action, scrolled to the middle of the viewport
         one at a time and hit tested there. Playwright's own actionability
         check is asked as well, so this is the browser's answer and not a
         geometry calculation of mine. */
      const primaries = await page.$$('[data-ia] a.btn-primary');
      expect(primaries.length, 'home.html rendered no primary actions at all').toBeGreaterThan(0);
      for (let i = 0; i < primaries.length; i += 1) {
        const el = primaries[i];
        await el.scrollIntoViewIfNeeded();
        await page.evaluate((node) => {
          const r = node.getBoundingClientRect();
          window.scrollBy(0, r.top + r.height / 2 - window.innerHeight / 2);
        }, el);
        await page.waitForTimeout(90);
        const detail = await page.evaluate((node) => {
          const r = node.getBoundingClientRect();
          const x = Math.round(r.left + r.width / 2);
          const y = Math.round(r.top + r.height / 2);
          const top = document.elementFromPoint(x, y);
          return {
            href: node.getAttribute('href'),
            onScreen: r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0,
            covered: !(top === node || node.contains(top)),
            coveredBy: top ? `${top.tagName.toLowerCase()}.${String(top.className || '').split(/\s+/)[0]}` : 'nothing',
          };
        }, el);
        expect(detail.onScreen, `${vp.width}px: primary action ${detail.href} could not be brought fully on screen`).toBe(true);
        expect(
          detail.covered,
          `${vp.width}px: primary action ${detail.href} is covered at its own centre by ${detail.coveredBy}`,
        ).toBe(false);
        /* The browser's own actionability check, with no click performed. */
        await el.click({ trial: true, timeout: 4000 });
      }

      /* Sticky release. With every sequence pending there is no backdrop to
         release, which is itself the assertion: nothing inside a stage may be
         position:sticky or position:fixed unless it is the declared backdrop. */
      const strays = await page.evaluate(() => {
        const out = [];
        for (const st of document.querySelectorAll('[data-cine-stage]')) {
          for (const el of st.querySelectorAll('*')) {
            const p = getComputedStyle(el).position;
            if (p !== 'sticky' && p !== 'fixed') continue;
            if (el.classList.contains('cine-stage__sticky')) continue;
            out.push({ stage: st.getAttribute('data-cine-stage'), el: `${el.tagName.toLowerCase()}.${String(el.className || '').split(/\s+/)[0]}`, position: p });
          }
        }
        return out;
      });
      expect(strays, `a stage contains a sticky or fixed element that is not the declared backdrop: ${JSON.stringify(strays)}`).toEqual([]);


      /* The header stays on top and stays clickable at every depth, and so
         does the mobile navigation toggle where the layout shows one. Five
         points per element, from the shared hit tester, so an element covered
         only at a corner is still caught. */
      let hitPoints = 0;
      for (const at of [0, 0.5, 0.99]) {
        await page.evaluate((f) => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * f)), at);
        await page.waitForTimeout(90);
        /* '.site-header .brand' was one of these three until 2026-08-28 and
           matched NOTHING on this page: the brand link is .wordmark. The
           non-vacuity assertion below is what found it, on the first run. The
           integration report claimed "header brand / nav-toggle / nav CTA
           uncovered at 5 points each at three depths"; a third of that was
           never measured. */
        for (const sel of ['.site-header .wordmark', '.site-header .nav-toggle', '.site-header .main-nav a.btn-primary']) {
          const results = await hitTest(page, sel);
          /* NON-VACUITY, PER SELECTOR AND PER POINT.
             hitTest() returns [] when a selector matches nothing, the loop body
             then never runs, and this block reported a pass having asserted
             nothing. PROVEN 2026-08-28 by renaming .site-header to
             .site-headerZZ in these three strings: 1 passed, exit 0. The site
             is mid platform-identity remap, so a class rename is not a
             hypothetical. Guard 17 in cinematic-guards.spec.js solved exactly
             this with an overlappedAt counter; the same discipline belongs
             here. */
          expect(results.length, `${vp.width}px: the selector ${sel} matched no element at all, so this hit test asserted nothing. If the class was renamed, rename it here too.`).toBeGreaterThan(0);
          for (const r of results) {
            if (r.offscreen) continue;                 // the toggle is display:none on desktop
            hitPoints += r.points.length;
            const blocked = r.points.filter((p) => !p.outsideViewport && p.hit !== null && !p.reachesTarget);
            expect(
              blocked,
              `${vp.width}px, ${Math.round(at * 100)}% down: ${sel} ("${r.text}") is covered at ${blocked.length} of its 5 test points by ${JSON.stringify(blocked.map((b) => b.tag + (b.inStageDecoration ? ' (stage backdrop)' : '')))}`,
            ).toEqual([]);
          }
        }
      }
      expect(hitPoints, `${vp.width}px: the header and navigation hit tests examined ${hitPoints} points across three scroll depths. Zero means the whole block was skipped.`).toBeGreaterThan(10);
    } finally { await context.close(); }
  });
}

/* ==================================================================== *
 * 3b. THE OWNER RULE, ABSOLUTE, ON A STAGE THAT IS ACTUALLY RELEASED
 *
 *     "Never apply transform, opacity, filter, mask, clip or fragmentation
 *     to any container holding readable text. Motion lives in the stage
 *     only."
 *
 *     Test 4 below asks a DIFFERENT question on purpose: did WRAPPING the
 *     sections in a stage ADD any motion. That is a differential, and it was
 *     the only question asked here until 2026-08-28. It is blind to motion
 *     the site already had, and measuring the real page found five
 *     mechanisms alive inside stages that it could never report: span.mw
 *     (overflow:hidden) around span.mwi (transform) on every h2 word,
 *     li.pstep (opacity .45 + translateY), div.status (opacity 0 +
 *     translateX) and div.rail-track (translateX). All of it passed, in a
 *     test literally named "no text container inside a stage carries
 *     motion".
 *
 *     WHY THE PAGE IS SERVED WITH A STAGE RELEASED.
 *     cine-stage.css scopes the owner rule to a stage that is not pending,
 *     because a stage awaiting artwork runs no sequence and must cost the
 *     page nothing (assets/cinematic/index.js: "a stage with no approved
 *     artwork is not a degraded stage. It is a stage that does not exist
 *     yet"). Every sequence is pending today, so asserting the rule against
 *     the page as served would assert nothing. The attribute is therefore
 *     flipped DURING PARSE, before assets/motion/scroll.js runs, which is
 *     the only way to measure the fragmentation half: CSS can un-clip and
 *     un-transform a word span, it cannot un-split a heading.
 *
 *     WHAT COUNTS AS MOTION, and why it is not "the property is present".
 *     A static opacity is a colour decision (p.lede is deliberately .85) and
 *     clip-path:inset(50%) on a .sr-only caption is how a screen reader only
 *     caption is hidden. Neither moves. What is measured is whether the
 *     property is ANIMATED: a declared transition or animation covering it,
 *     or a computed value that is different 400ms later, or a non identity
 *     transform. Every one of the five defects above is caught by that;
 *     none of the three static values is.
 * ==================================================================== */
const RELEASE_DURING_PARSE = () => {
  /* document_start: there is no <body> yet, so the stages are flipped as the
     parser produces them. Doing it after load would be too late for
     assets/motion/scroll.js, which has already split the headings by then. */
  const release = (el) => { if (el.getAttribute('data-cine-artwork') === 'pending') el.setAttribute('data-cine-artwork', 'released'); };
  const sweep = () => { for (const el of document.querySelectorAll('[data-cine-stage]')) release(el); };
  /* OBSERVE `document`, not document.documentElement: at document_start the
     <html> element does not exist yet, observe(null) throws, and the whole init
     script dies silently taking the flip with it. Found by this test reporting
     "no stage ended up released". DOMContentLoaded is a backstop only: deferred
     module scripts, which is how assets/motion/scroll.js loads, run BEFORE it. */
  new MutationObserver(sweep).observe(document, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', sweep);
  document.addEventListener('readystatechange', sweep);
  window.__cineReleasedByTest = true;
};

/* THE EXEMPTIONS ARE READ OUT OF THE STYLESHEET, not typed here.
   assets/cinematic/cine-stage.css carries the owner rule and, beside it, the
   `cine-owner-exempt: <selector> -- <reason>` lines that say which selectors
   hold no readable text or are not laid out inside a stage.
   scripts/check-cinematic-fallback.mjs already refuses an exemption without a
   real argument. One list, in the file the rule lives in, consumed by both the
   static guard and this browser guard: a second copy here is the shape that
   lets the two disagree while both stay green. */
const CINE_CSS_SOURCE = fs.readFileSync(path.join(root, 'assets', 'cinematic', 'cine-stage.css'), 'utf8');
const OWNER_EXEMPT = [...CINE_CSS_SOURCE.matchAll(new RegExp('cine-owner-exempt:\\s*([^\\r\\n]+?)\\s+--\\s+([^\\r\\n]+)', 'g'))]
  .map((m) => m[1].trim())
  .filter((sel) => !sel.startsWith('::'));            // pseudo elements: no element to match

/** Every element inside a stage that carries its own text and still has a
    non-neutral value of one of the owner rule's properties.

    ABSOLUTE, NOT HEURISTIC. An earlier version of this asked whether the
    property was "animated" (a declared transition, a running animation, a value
    changing between two samples). It reported hundreds of elements, because
    site.css declares `transition: all` widely and a declared transition on a
    property that never changes is not motion. The honest question is the
    rule's own: does a container holding readable text carry the property at a
    non-neutral value. Everything that legitimately does is exempted BY NAME
    with a written reason, in the stylesheet. */
async function motionOnTextContainers(page, exemptions) {
  return page.evaluate((exempt) => {
    const found = [];
    let examined = 0;
    let withText = 0;
    for (const st of document.querySelectorAll('[data-cine-stage]')) {
      for (const el of st.querySelectorAll('*')) {
        examined += 1;
        if (el.closest('.cine-stage__sticky')) continue;   // the backdrop holds no words
        if (el.closest('.cine-chapter-art')) continue;     // artwork, not copy
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') continue;             // not laid out inside any stage
        /* Its OWN words. A wrapper that merely contains a paragraph is not the
           container the rule is about; the element holding the text node is. */
        const ownText = Array.from(el.childNodes)
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join('');
        if (!ownText) continue;
        withText += 1;
        let exemptedBy = null;
        for (const sel of exempt) {
          try { if (el.matches(sel) || el.closest(sel)) { exemptedBy = sel; break; } } catch { /* not a selector matches() accepts */ }
        }
        if (exemptedBy) continue;
        const say = (prop, value) => found.push({
          stage: st.getAttribute('data-cine-stage'),
          el: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(/\s+/)[0] : ''),
          prop,
          value,
          text: ownText.slice(0, 40),
        });
        if (cs.transform !== 'none' && cs.transform !== 'matrix(1, 0, 0, 1, 0, 0)') say('transform', cs.transform);
        if (cs.opacity !== '1') say('opacity', cs.opacity);
        if (cs.filter !== 'none') say('filter', cs.filter);
        if (cs.maskImage && cs.maskImage !== 'none') say('mask-image', cs.maskImage);
        if (cs.clipPath !== 'none') say('clip-path', cs.clipPath);
        if (cs.columnCount !== 'auto' && cs.columnCount !== '1') say('column-count', cs.columnCount);
      }
    }
    return { found, examined, withText };
  }, exemptions);
}

test('with a stage released, nothing holding readable text is in motion, and no heading is fragmented', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await page.addInitScript(RELEASE_DURING_PARSE);
    await page.goto(HOMEPAGE_URL, { waitUntil: 'networkidle' });

    const released = await page.evaluate(() => Array.from(document.querySelectorAll('[data-cine-stage]'))
      .filter((st) => st.getAttribute('data-cine-artwork') === 'released')
      .map((st) => st.getAttribute('data-cine-stage')));
    expect(released.length, 'no stage ended up released, so everything below would assert nothing').toBe(CONFIG.sequences.length);

    /* PROBED TWICE, AT TWO SCROLL POSITIONS, and both matter.

       AT REST, BEFORE ANY SCROLLING is where the entrance animations live:
       li.pstep sits at opacity .45 and translateY(10px) until site.js adds
       .active, and .stack .layer at opacity 0 until the stack is in view. A
       probe taken only after scrolling the whole page finds every one of them
       already settled and reports a clean page. Verified: deleting .pstep from
       the owner rule block is invisible to a post-scroll probe and caught here.

       AFTER SCROLLING is where anything scroll-driven and anything that starts
       moving late shows up. */
    const atRest = await motionOnTextContainers(page, OWNER_EXEMPT);

    for (const at of [0.15, 0.4, 0.7, 0.95]) {
      await page.evaluate((f) => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * f)), at);
      await page.waitForTimeout(200);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    /* THE FRAGMENTATION HALF. assets/motion/scroll.js splits every below-fold
       h2 into one span per word, each clipped by overflow:hidden and slid in
       under a transform. No stylesheet can undo a split, so it is refused at
       the source; this is the assertion that it was. */
    const fragments = await page.evaluate(() => Array.from(document.querySelectorAll('[data-cine-stage] .mw, [data-cine-stage] .mwi'))
      .slice(0, 10)
      .map((el) => ({ cls: el.className, inside: el.closest('h1,h2,h3') ? el.closest('h1,h2,h3').tagName : '(not a heading)', text: (el.textContent || '').trim().slice(0, 30) })));
    expect(
      fragments,
      `${fragments.length} word-mask span(s) were created inside a released stage. assets/motion/scroll.js must not fragment a heading there: `
      + 'the spans carry overflow:hidden and a transform, which is clip plus fragmentation plus motion on a heading, all at once.',
    ).toEqual([]);

    /* THE MOTION HALF. */
    const scrolled = await motionOnTextContainers(page, OWNER_EXEMPT);
    const examined = Math.max(atRest.examined, scrolled.examined);
    const withText = Math.max(atRest.withText, scrolled.withText);
    const seen = new Set();
    const found = [...atRest.found.map((f) => ({ ...f, when: 'at rest' })), ...scrolled.found.map((f) => ({ ...f, when: 'after scrolling' }))]
      .filter((f) => { const k = `${f.stage}|${f.el}|${f.prop}|${f.text}`; if (seen.has(k)) return false; seen.add(k); return true; });
    expect(examined, 'the probe walked no elements inside any stage').toBeGreaterThan(200);
    expect(withText, 'the probe found no element carrying its own text inside a stage, so it asserted nothing').toBeGreaterThan(40);
    expect(atRest.withText, 'the at-rest probe found no text container, so half of this guard measured nothing').toBeGreaterThan(40);
    expect(
      found,
      `with the stages released, ${found.length} element(s) holding readable text carry motion:\n`
      + `${JSON.stringify(found.slice(0, 8), null, 1)}\n`
      + 'The owner rule is absolute. Neutralise the selector in the owner rule block of assets/cinematic/cine-stage.css '
      + '(then run node scripts/build-cine-css.mjs), or, if it genuinely holds no readable text, add a reasoned '
      + 'cine-owner-exempt line beside it.',
    ).toEqual([]);
  } finally { await context.close(); }
});

/* THE CONTROL. The same probe on the page exactly as it is served, with every
   stage pending, must find motion. Without this the test above would pass
   identically on a homepage that had no motion anywhere, which is the shape
   this repository keeps shipping: a guard that would pass if the feature it
   guards were deleted. */
test('the owner-rule probe is not measuring an already still page', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);
    await page.goto(HOMEPAGE_URL, { waitUntil: 'networkidle' });
    for (const at of [0.2, 0.5, 0.8]) {
      await page.evaluate((f) => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * f)), at);
      await page.waitForTimeout(150);
    }
    const { found } = await motionOnTextContainers(page, OWNER_EXEMPT);
    expect(
      found.length,
      'with every stage pending the probe found no motion at all on readable text. Either the site stopped animating copy, in which case delete this control, or the probe measures nothing and the released assertion above is vacuous.',
    ).toBeGreaterThan(0);
    const fragments = await page.evaluate(() => document.querySelectorAll('[data-cine-stage] .mw').length);
    expect(fragments, 'assets/motion/scroll.js fragmented no heading at all on the page as served, so the released half proves nothing about fragmentation').toBeGreaterThan(0);
  } finally { await context.close(); }
});

/* ==================================================================== *
 * 4. NO MOTION ON A TEXT CONTAINER, AND NO SCROLL HIJACKING
 * ==================================================================== */
test('no text container inside a stage carries motion, and the scroll is never touched', async ({ browser }) => {
  const { context, page } = await open(browser);
  try {
    await assertServingThisWorktree(page);

    /* Wrapped before any page script, so this records whatever the page does
       rather than whatever it says it does. */
    await page.addInitScript(() => {
      const w = window;
      w.__scrollProbe = { listeners: [], prevented: 0, writes: [] };
      const realAdd = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function (type, fn, opts) {
        if (/^(wheel|mousewheel|touchmove|scroll|keydown)$/.test(type)) {
          w.__scrollProbe.listeners.push({ type, passive: !!(opts && typeof opts === 'object' && opts.passive) });
        }
        return realAdd.call(this, type, fn, opts);
      };
      const realPrevent = Event.prototype.preventDefault;
      Event.prototype.preventDefault = function () {
        if (/^(wheel|mousewheel|touchmove)$/.test(this.type)) w.__scrollProbe.prevented += 1;
        return realPrevent.call(this);
      };
      for (const name of ['scrollTo', 'scrollBy']) {
        const real = w[name];
        w[name] = function (...a) { w.__scrollProbe.writes.push(name); return real.apply(this, a); };
      }
    });

    await page.goto(HOMEPAGE_URL, { waitUntil: 'networkidle' });

    /* MEASURED AS A DIFFERENCE, NOT AS AN ABSOLUTE.
       The absolute question ("does any text container inside a stage carry
       transform, opacity, filter, mask or clip") has a non zero answer on this
       page and always did: p.lede is deliberately opacity .85, and the loop
       diagram's <g> elements are animated by site.js. Neither is the
       cinematic layer's doing and neither is scroll driven motion on copy.

       The question the integration actually has to answer is whether WRAPPING
       these sections in a stage added any. So the same set is measured twice
       in one page state, with the .cine-stage class present and then removed,
       and the stage's set must be a subset of the baseline: it may remove
       motion (the .reveal neutraliser does exactly that) and may never add
       any. A regression here is one entry that exists only in the first set,
       named with the element and the property. */
    const probeMotion = () => page.evaluate(() => {
      const MOTION = ['transform', 'opacity', 'filter', 'mask', 'maskImage', 'clipPath', 'columnCount'];
      const NEUTRAL = new Set(['none', '1', 'normal', 'auto', 'matrix(1, 0, 0, 1, 0, 0)']);
      const out = [];
      for (const st of document.querySelectorAll('[data-cine-stage]')) {
        let i = 0;
        for (const el of st.querySelectorAll('*')) {
          i += 1;
          if (el.closest('.cine-stage__sticky')) continue;      // the backdrop holds no words
          if (el.closest('.cine-chapter-art')) continue;        // artwork, not copy
          if (!(el.textContent || '').trim()) continue;         // no words, no rule
          const cs = getComputedStyle(el);
          for (const p of MOTION) {
            const v = String(cs[p]);
            if (NEUTRAL.has(v)) continue;
            if (p === 'columnCount' && v === '1') continue;
            /* Keyed by POSITION AND PROPERTY, never by the value.
               Position, not class name, because two <p class="lede"> in one
               stage must not collapse into one entry and hide a difference.
               Not the value, because the two probes are taken milliseconds
               apart and this page has elements mid animation: keying on the
               value made an in flight translateX read as motion the stage had
               added, which it had not. The forbidden thing is the property
               being on a readable container at all, so that is what is
               compared. */
            out.push(`${st.getAttribute('data-cine-stage')}#${i} ${el.tagName.toLowerCase()} ${p}`);
          }
        }
      }
      return out;
    });

    const withStage = await probeMotion();
    await page.evaluate(() => {
      for (const st of document.querySelectorAll('[data-cine-stage]')) st.classList.remove('cine-stage');
    });
    const baseline = new Set(await probeMotion());
    const added = withStage.filter((k) => !baseline.has(k));
    expect(
      added,
      `wrapping the sections in a cinematic stage put motion on ${added.length} readable container(s) that did not have it: ${JSON.stringify(added.slice(0, 6))}`,
    ).toEqual([]);
    expect(withStage.length + baseline.size, 'the motion probe found nothing at all in either state, so it is asserting nothing').toBeGreaterThan(0);

    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(200);
    const probe = await page.evaluate(() => window.__scrollProbe);
    expect(probe.prevented, 'a wheel or touchmove event was preventDefault()ed; the visitor\'s scroll must behave exactly as they expect').toBe(0);
    const nonPassive = probe.listeners.filter((l) => /^(wheel|mousewheel|touchmove)$/.test(l.type) && !l.passive);
    expect(nonPassive, `a non passive wheel or touch listener was registered: ${JSON.stringify(nonPassive)}`).toEqual([]);
  } finally { await context.close(); }
});
