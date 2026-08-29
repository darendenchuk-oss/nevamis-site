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
      expect(
        cineRequests,
        `every sequence is pending, so nothing under /assets/cinematic/ should have been requested. The page asked for: ${cineRequests.join(', ')}`,
      ).toEqual(['/assets/cinematic/cine-stage.css']);
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
        expect(
          s.naturalVh,
          `${s.id} is released and declares ${declared}vh of scroll, but sections [${seq.sections}] are only ${s.naturalVh}vh tall at ${vp.width}x${vp.height}. `
          + `cine-stage.css would floor the wrapper at ${declared}vh and pad the homepage with ${declared - s.naturalVh}vh of empty ground below section ${seq.sections[seq.sections.length - 1]}.`,
        ).toBeGreaterThanOrEqual(declared);
      }
    }
    test.info().annotations.push({ type: 'stage spans', description: notes.join('\n') });
    expect(notes.length, 'nothing was measured, so this guard asserted nothing').toBe(WIDTHS.length * CONFIG.sequences.length);
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
      for (const at of [0, 0.5, 0.99]) {
        await page.evaluate((f) => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * f)), at);
        await page.waitForTimeout(90);
        for (const sel of ['.site-header .brand', '.site-header .nav-toggle', '.site-header .main-nav a.btn-primary']) {
          const results = await hitTest(page, sel);
          for (const r of results) {
            if (r.offscreen) continue;                 // the toggle is display:none on desktop
            const blocked = r.points.filter((p) => !p.outsideViewport && p.hit !== null && !p.reachesTarget);
            expect(
              blocked,
              `${vp.width}px, ${Math.round(at * 100)}% down: ${sel} ("${r.text}") is covered at ${blocked.length} of its 5 test points by ${JSON.stringify(blocked.map((b) => b.tag + (b.inStageDecoration ? ' (stage backdrop)' : '')))}`,
            ).toEqual([]);
          }
        }
      }
    } finally { await context.close(); }
  });
}

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
