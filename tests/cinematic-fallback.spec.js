/* The fallback and layout proof.
   Run:  NV_PORT=3291 npx playwright test tests/cinematic-fallback.spec.js
   Never run two Playwright invocations at once in this workflow: this machine
   holds several checkouts and reuseExistingServer means whichever one owns the
   port gets measured. assertServingThisWorktree() is called first in every
   test for exactly that reason.

   WHAT IS BEING PROVED, in the owner's words:
     - reduced motion loads NO frame sequence and shows the static keyframe per
       chapter, with every word, price, capability, Demo block and call to
       action still there;
     - with no JavaScript the poster is visible, the narrative is readable, the
       pricing and the calls to action work, and nothing spins;
     - a broken sequence lands in the same place;
     - the sticky stage releases cleanly, the header stays usable, text stays
       selectable, and no pricing card or call to action sits under the canvas.

   Nothing here trusts a module's own report. Visibility is read from computed
   style, the hit area is read from elementFromPoint, and the canvas is read
   with the shared helpers that refuse a zero box or a default backing store. */
import { test, expect } from '@playwright/test';
import {
  assertServingThisWorktree, canvasMetrics, readCanvasFrame,
  localPlaceholderManifest, variantOf,
} from './helpers/cinematic.js';

const PAGE = '/tests/fixtures/cinematic-layout.html';
const SEQ = 'signal-to-system';
const STAGE = `[data-cine-stage="${SEQ}"]`;
const CANVAS = `${STAGE} canvas[data-cine-canvas]`;
const FRAME_RE = /\/artifacts\/cinematic-placeholders\/[a-z-]+\/(desktop|mobile)\/f\d{4}\.png$/;

/* page.emulateMedia, not test.use({ reducedMotion }).
   MEASURED, not assumed: playwright.config.js sets use.reducedMotion to
   'no-preference' at the project level and a describe level test.use() did NOT
   override it here. A probe printed matchMedia('(prefers-reduced-motion:
   reduce)').matches === false inside a describe that had asked for 'reduce',
   which would have made every reduced motion assertion below a measurement of
   the ordinary page. Every reduced motion test therefore re-asserts that the
   browser really is reporting the preference before it believes anything. */
async function openReduced(page, query = '') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  return open(page, query);
}

async function open(page, query = '') {
  await assertServingThisWorktree(page);
  const requestedFrames = [];
  page.on('request', (r) => { if (FRAME_RE.test(r.url())) requestedFrames.push(r.url()); });
  await page.goto(PAGE + query);
  await page.waitForFunction(() => window.__cine && (window.__cine.ready || window.__cine.error));
  const err = await page.evaluate(() => window.__cine.error);
  expect(err, 'the layout fixture failed to boot').toBeNull();
  return { requestedFrames };
}

const diagnostics = (page) => page.evaluate(() => window.__cine.diagnostics);
const stageState = (page, id = SEQ) =>
  page.getAttribute(`[data-cine-stage="${id}"]`, 'data-cine-state');

/* ══════════════════════════════════════════════════════════════════════════
   1. NO JAVASCRIPT
   The served bytes, before anything runs. This is the whole no-JS contract:
   nothing below is produced by script, so nothing below can fail to appear.
   ══════════════════════════════════════════════════════════════════════════ */
test.describe('with no JavaScript at all', () => {
  test.use({ javaScriptEnabled: false });

  test('the served HTML is already the finished page', async ({ page }) => {
    await assertServingThisWorktree(page);
    const res = await page.request.get(PAGE);
    expect(res.ok()).toBe(true);
    const html = await res.text();

    // Poster visible, in the markup, with a real file behind it.
    const posters = [...html.matchAll(/<img data-cine-poster src="([^"]+)"/g)].map((m) => m[1]);
    expect(posters.length, 'every stage must serve its own poster').toBe(3);
    for (const src of posters) {
      const img = await page.request.get(src);
      expect(img.ok(), `${src} is referenced by the served HTML and does not exist`).toBe(true);
      expect(Number(img.headers()['content-length'] || 0)).toBeGreaterThan(1000);
    }

    // Every stage declares the poster state in the markup, not from script.
    expect((html.match(/data-cine-state="poster"/g) || []).length).toBe(3);

    // The complete written narrative: seven sections, seven headings.
    expect((html.match(/<section data-ia="\d"/g) || []).length).toBe(7);

    // Pricing and calls to action are real HTML.
    expect(html).toContain('C$1,000');
    expect(html).toContain('C$2,100');
    expect((html.match(/data-pricing-card/g) || []).length).toBe(3);
    expect((html.match(/data-primary-cta/g) || []).length).toBe(7);
    expect(html).toContain('href="/book.html"');
    expect(html).toContain('href="/pricing.html"');

    // Nothing that can spin forever. There is no loader to leave running.
    expect(html).not.toMatch(/aria-busy="true"|class="[^"]*spinner|Loading\.\.\./i);
  });

  test('the page renders and the links are hittable with scripting disabled', async ({ page }) => {
    await assertServingThisWorktree(page);
    await page.goto(PAGE);
    // The probe readout still says "no script": proof scripting really is off.
    await expect(page.locator('#probe-readout')).toHaveText('no script');
    await expect(page.locator(`${STAGE} img[data-cine-poster]`)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-pricing-card]')).toHaveCount(3);
    for (const sel of ['[data-primary-cta]', '[data-plan-cta]']) {
      const n = await page.locator(sel).count();
      expect(n).toBeGreaterThan(0);
      for (let i = 0; i < n; i += 1) {
        await expect(page.locator(sel).nth(i)).toBeVisible();
        expect(await page.locator(sel).nth(i).getAttribute('href')).toBeTruthy();
      }
    }
    // The seven headings are all still present and readable.
    await expect(page.locator('section[data-ia] h1, section[data-ia] h2')).toHaveCount(7);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. REDUCED MOTION
   ══════════════════════════════════════════════════════════════════════════ */
test.describe('reduced motion', () => {
  /* THE ONE THAT MATTERS. The defect that already shipped in this project was a
     reduced motion block scoped to a class that is absent precisely when
     reduced motion is on. So this test runs with the class absent AND the
     attribute absent (mount=0 means fallback.js never sets data-cine-state),
     and asserts the layout changed anyway. If the media query rule were scoped
     to .motion-off or to [data-cine-state="reduced"], nothing would change and
     this fails. */
  test('the operating system preference alone changes the layout, with no class and no attribute', async ({ page }) => {
    await openReduced(page, '?mount=0');

    const facts = await page.evaluate((sel) => {
      const stage = document.querySelector(sel);
      const sticky = stage.querySelector('.cine-stage__sticky');
      const canvas = stage.querySelector('canvas[data-cine-canvas]');
      const poster = stage.querySelector('img[data-cine-poster]');
      const art = stage.querySelector('.cine-chapter-art');
      const cs = getComputedStyle(sticky);
      return {
        rootClass: document.documentElement.className,
        stageState: stage.getAttribute('data-cine-state'),
        keyframesAttr: stage.getAttribute('data-cine-keyframes'),
        matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        stickyTop: cs.top,
        /* The pull lives on the element AFTER the backdrop, not on the
           backdrop. Reading the sticky's own margin here would be an
           assertion that is true no matter what the switch did. */
        pullOnNextSibling: getComputedStyle(sticky.nextElementSibling).marginTop,
        stickyHeight: cs.height,
        canvasDisplay: getComputedStyle(canvas).display,
        posterPosition: getComputedStyle(poster).position,
        artDisplay: getComputedStyle(art).display,
        viewport: window.innerHeight,
      };
    }, STAGE);

    // The two things that would have made a class-scoped rule pass by accident.
    expect(facts.rootClass, 'the .motion-off class must be absent for this proof to mean anything').not.toContain('motion-off');
    expect(facts.stageState, 'nothing may have set the reduced state; the media query alone is under test').toBe('poster');
    expect(facts.keyframesAttr).toBeNull();
    expect(facts.matches, 'the browser is not actually reporting the reduced motion preference').toBe(true);

    // And the payload nonetheless applied.
    expect(facts.canvasDisplay, 'the canvas is still displayed, so the reduced motion switch never fired').toBe('none');
    expect(facts.stickyTop, 'the backdrop is still pinned to the top of the viewport').toBe('auto');
    expect(facts.pullOnNextSibling, 'the first section is still pulled up over a backdrop that is no longer pinned').toBe('0px');
    expect(Math.round(parseFloat(facts.stickyHeight))).toBeLessThan(facts.viewport);
    expect(facts.posterPosition, 'the poster is still absolutely positioned inside a pinned backdrop').toBe('static');
    expect(facts.artDisplay, 'the chapter artwork slots did not open, so reduced motion would show no artwork at all').toBe('block');
  });

  test('no frame of any sequence is fetched', async ({ page }) => {
    const { requestedFrames } = await openReduced(page);
    await page.waitForTimeout(400);
    expect(requestedFrames, `reduced motion fetched ${requestedFrames.length} sequence frames`).toEqual([]);
  });

  test('every chapter gets its own static keyframe, and the count is proved', async ({ page }) => {
    await openReduced(page);
    const manifest = localPlaceholderManifest();

    for (const seq of manifest.sequences) {
      const v = variantOf(manifest, seq.id, 'desktop');
      expect(await stageState(page, seq.id)).toBe('reduced');

      /* The keyframes are loading="lazy", so an offscreen one legitimately has
         naturalWidth 0. Bring each into view and decode it before judging it,
         otherwise this test would report "the image did not load" about the
         browser doing exactly what it was asked to do. */
      await page.evaluate(async (id) => {
        const imgs = [...document.querySelectorAll(`[data-cine-stage="${id}"] img[data-cine-keyframe]`)];
        for (const img of imgs) {
          img.scrollIntoView({ block: 'center' });
          img.loading = 'eager';
          await img.decode().catch(() => {});
        }
      }, seq.id);

      const placed = await page.evaluate((id) => {
        const stage = document.querySelector(`[data-cine-stage="${id}"]`);
        return [...stage.querySelectorAll('img[data-cine-keyframe]')].map((img) => ({
          chapter: img.getAttribute('data-cine-keyframe'),
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt'),
          natural: img.naturalWidth,
          display: getComputedStyle(img).display,
          parentDisplay: getComputedStyle(img.parentElement).display,
        }));
      }, seq.id);

      expect(placed.map((p) => p.chapter), `${seq.id}: one keyframe per chapter`)
        .toEqual(v.chapters.map((c) => c.id));
      for (const p of placed) {
        const expected = v.reducedMotionKeyframes.find((k) => k.chapter === p.chapter);
        expect(p.src).toBe(expected.src);
        expect(p.alt).toBe(expected.alt);
        expect(p.natural, `${seq.id}/${p.chapter}: the keyframe image did not load`).toBeGreaterThan(0);
        expect(p.parentDisplay, 'the artwork slot is still display:none, so the keyframe is in the DOM and invisible').toBe('block');
      }
      /* The attribute is written only when the count matched, and the poster
         band is hidden on exactly that attribute. That coupling is what makes
         a partial placement leave the poster on screen instead of leaving a
         hole, so it is measured rather than assumed. */
      expect(await page.getAttribute(`[data-cine-stage="${seq.id}"]`, 'data-cine-keyframes')).toBe('placed');
      const band = await page.evaluate((id) => {
        const stage = document.querySelector(`[data-cine-stage="${id}"]`);
        const before = getComputedStyle(stage.querySelector('.cine-stage__sticky')).display;
        stage.setAttribute('data-cine-keyframes', 'partial');
        const after = getComputedStyle(stage.querySelector('.cine-stage__sticky')).display;
        stage.setAttribute('data-cine-keyframes', 'placed');
        return { whenPlaced: before, whenPartial: after };
      }, seq.id);
      expect(band.whenPlaced, 'the poster band is still shown next to a complete set of keyframes').toBe('none');
      expect(band.whenPartial, 'an incomplete placement would leave a hole where the artwork should be').not.toBe('none');
    }

    const diags = await diagnostics(page);
    expect(diags.filter((d) => d.type === 'reduced-incomplete'), 'a keyframe placement was incomplete').toEqual([]);
    expect(diags.filter((d) => d.type === 'markup-defect'), 'the fixture markup is not honouring the DOM contract').toEqual([]);
  });

  test('all copy, pricing, capability, Demo and call to action content survives', async ({ page }) => {
    await openReduced(page);
    await expect(page.locator('section[data-ia] h1, section[data-ia] h2')).toHaveCount(7);
    await expect(page.locator('[data-pricing-card]')).toHaveCount(3);
    await expect(page.locator('[data-primary-cta]')).toHaveCount(7);
    await expect(page.locator('.caplist li')).toHaveCount(4);
    await expect(page.locator('#demo .demo-panel dt')).toHaveCount(3);
    for (const text of ['C$1,000', 'C$2,100', 'C$350']) {
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
    for (let i = 0; i < 7; i += 1) {
      await expect(page.locator('[data-primary-cta]').nth(i)).toBeVisible();
    }
  });

  test('nothing is left pinned: the stage adds no artificial scroll length', async ({ page }) => {
    await openReduced(page);
    const minHeight = await page.evaluate((sel) => getComputedStyle(document.querySelector(sel)).minHeight, STAGE);
    expect(minHeight, 'the reduced path still reserves a viewport multiple of empty scroll').toBe('0px');
  });
});

/* The site's own toggle, with the operating system preference NOT set. Proves
   switch (b) independently of switch (a). */
test('the site motion-off class alone applies the reduced payload', async ({ page }) => {
  await assertServingThisWorktree(page);
  await page.goto(PAGE + '?mount=0');
  await page.waitForFunction(() => window.__cine && (window.__cine.ready || window.__cine.error));
  /* Added after load, which is what site.js does when the visitor presses the
     motion toggle. The switch has to be live, not read once at parse time. */
  await page.evaluate(() => document.documentElement.classList.add('motion-off'));
  const facts = await page.evaluate((sel) => {
    const stage = document.querySelector(sel);
    return {
      hasClass: document.documentElement.classList.contains('motion-off'),
      reduceMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      state: stage.getAttribute('data-cine-state'),
      canvasDisplay: getComputedStyle(stage.querySelector('canvas[data-cine-canvas]')).display,
      stickyTop: getComputedStyle(stage.querySelector('.cine-stage__sticky')).top,
    };
  }, STAGE);
  expect(facts.hasClass).toBe(true);
  expect(facts.reduceMatches, 'this test must not be measuring the media query').toBe(false);
  expect(facts.state).toBe('poster');
  expect(facts.canvasDisplay).toBe('none');
  expect(facts.stickyTop).toBe('auto');
});

/* ══════════════════════════════════════════════════════════════════════════
   3. SEQUENCE FAILURE. Never a loader forever.
   ══════════════════════════════════════════════════════════════════════════ */
test.describe('when the sequence never arrives', () => {
  test('a prime that never settles degrades on its own, and the page is intact', async ({ page }) => {
    const started = Date.now();
    await open(page, '?prime=hang&timeout=250');
    await page.waitForFunction(
      () => document.querySelector('[data-cine-stage]').getAttribute('data-cine-state') === 'degraded',
      undefined, { timeout: 5000 },
    );
    const elapsed = Date.now() - started;
    expect(elapsed, 'the watchdog took far longer than the timeout it was given').toBeLessThan(5000);

    const diags = await diagnostics(page);
    expect(diags.some((d) => d.type === 'watchdog-fired')).toBe(true);
    const degraded = diags.filter((d) => d.type === 'degraded');
    expect(degraded.length).toBe(3);
    for (const d of degraded) {
      expect(d.reason).toBe('prime-timeout');
      expect(d.canvasHidden, 'degrade() reported success without hiding the canvas').toBe(true);
      expect(d.loaderDestroyed, 'degrade() did not destroy the loader').toBe(true);
      expect(d.posterPresent).toBe(true);
    }

    // Read from the browser, not from the diagnostic.
    const shown = await page.evaluate((sel) => {
      const stage = document.querySelector(sel);
      const canvas = stage.querySelector('canvas[data-cine-canvas]');
      const poster = stage.querySelector('img[data-cine-poster]');
      return {
        canvasDisplay: getComputedStyle(canvas).display,
        canvasHiddenAttr: canvas.hasAttribute('hidden'),
        canvasAria: canvas.getAttribute('aria-hidden'),
        posterVisible: poster.getBoundingClientRect().width > 100,
        posterOpacity: getComputedStyle(poster).opacity,
      };
    }, STAGE);
    expect(shown.canvasDisplay, 'the canvas display rule beat [hidden] and the canvas is still on screen').toBe('none');
    expect(shown.canvasHiddenAttr).toBe(true);
    expect(shown.canvasAria).toBe('true');
    expect(shown.posterVisible).toBe(true);
    expect(shown.posterOpacity).toBe('1');

    // The page itself is untouched.
    await expect(page.locator('[data-primary-cta]')).toHaveCount(7);
    await expect(page.locator('[data-pricing-card]')).toHaveCount(3);
  });

  test('a prime that resolves not-ok, a prime that rejects, and a non promise all degrade', async ({ page }) => {
    for (const [mode, reason] of [['fail', 'prime-failed'], ['reject', 'prime-rejected'], ['notapromise', 'prime-not-a-promise']]) {
      await open(page, `?prime=${mode}&timeout=4000`);
      await page.waitForFunction(
        () => document.querySelector('[data-cine-stage]').getAttribute('data-cine-state') === 'degraded',
        undefined, { timeout: 4000 },
      );
      const diags = await diagnostics(page);
      const degraded = diags.filter((d) => d.type === 'degraded');
      expect(degraded.length, `prime=${mode}: expected all three stages to degrade`).toBe(3);
      expect(degraded[0].reason, `prime=${mode}`).toBe(reason);
      await expect(page.locator('[data-primary-cta]')).toHaveCount(7);
    }
  });

  test('degrade is idempotent and terminal', async ({ page }) => {
    await open(page, '?prime=hang&timeout=200');
    await page.waitForFunction(() => window.__cine.layers['signal-to-system'].isDegraded());
    const after = await page.evaluate((id) => {
      const layer = window.__cine.layers[id];
      const second = layer.degrade('called-again');
      const tried = layer.showPoster();
      const reduced = layer.applyReducedMotion();
      return {
        second, tried, reducedPlaced: reduced.placed,
        state: layer.state,
        attr: document.querySelector(`[data-cine-stage="${id}"]`).getAttribute('data-cine-state'),
      };
    }, SEQ);
    expect(after.second, 'a second degrade() reported that it did work').toBe(false);
    expect(after.tried, 'showPoster() moved the stage off degraded').toBe(false);
    expect(after.reducedPlaced).toBe(0);
    expect(after.state).toBe('degraded');
    expect(after.attr).toBe('degraded');
    const diags = await diagnostics(page);
    expect(diags.filter((d) => d.type === 'degrade-ignored').length).toBeGreaterThan(0);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. LAYOUT BEHAVIOUR
   ══════════════════════════════════════════════════════════════════════════ */
test.describe('layout', () => {
  test('the seven section architecture survives, and no sequence merges two sections', async ({ page }) => {
    await open(page);
    const ia = await page.evaluate(() => [...document.querySelectorAll('section[data-ia]')].map((s) => ({
      ia: s.getAttribute('data-ia'),
      headings: s.querySelectorAll('h1,h2').length,
      primary: s.querySelectorAll('[data-primary-cta]').length,
      stage: s.closest('[data-cine-stage]').getAttribute('data-cine-stage'),
    })));
    expect(ia.map((s) => s.ia)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    for (const s of ia) {
      expect(s.headings, `section ${s.ia} must keep exactly one heading of its own`).toBe(1);
      expect(s.primary, `section ${s.ia} must have exactly one primary action`).toBe(1);
    }
    expect(ia.filter((s) => s.stage === 'signal-to-system').map((s) => s.ia)).toEqual(['1', '2']);
    expect(ia.filter((s) => s.stage === 'system-to-outcomes').map((s) => s.ia)).toEqual(['3', '4', '5']);
    expect(ia.filter((s) => s.stage === 'system-to-decision').map((s) => s.ia)).toEqual(['6', '7']);
  });

  test('the backdrop actually sticks, and releases cleanly without overlapping what follows', async ({ page }) => {
    await open(page);
    const geo = await page.evaluate((sel) => {
      const stage = document.querySelector(sel);
      const r = stage.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height, viewport: window.innerHeight };
    }, STAGE);
    expect(geo.height, 'the stage is not taller than the viewport, so it has no scroll range at all')
      .toBeGreaterThan(geo.viewport);

    // Pinned through the middle of the stage.
    for (const frac of [0.15, 0.4, 0.7]) {
      const y = geo.top + (geo.height - geo.viewport) * frac;
      await page.evaluate((to) => window.scrollTo(0, to), y);
      const top = await page.evaluate((sel) =>
        document.querySelector(`${sel} .cine-stage__sticky`).getBoundingClientRect().top, STAGE);
      expect(Math.abs(top), `the backdrop is not pinned at ${frac} of the stage (top ${top}). An ancestor with overflow other than visible kills position:sticky silently.`)
        .toBeLessThan(2);
    }

    // Released at the end: the backdrop never reaches past the stage, so it can
    // never cover the section that follows.
    await page.evaluate((to) => window.scrollTo(0, to), geo.top + geo.height + 10);
    const release = await page.evaluate((sel) => {
      const stage = document.querySelector(sel);
      const sticky = stage.querySelector('.cine-stage__sticky');
      const next = stage.nextElementSibling;
      return {
        stickyBottom: sticky.getBoundingClientRect().bottom + window.scrollY,
        stageBottom: stage.getBoundingClientRect().bottom + window.scrollY,
        nextTop: next ? next.getBoundingClientRect().top + window.scrollY : Infinity,
      };
    }, STAGE);
    expect(release.stickyBottom, 'the backdrop overruns its stage').toBeLessThanOrEqual(release.stageBottom + 1);
    expect(release.stickyBottom, 'the backdrop overlaps the content after the stage').toBeLessThanOrEqual(release.nextTop + 1);
  });

  test('no pricing card and no call to action sits under the canvas hit area', async ({ page }) => {
    await open(page);

    /* Every target individually, scrolled to the middle of the viewport, which
       is the worst case: that is where a pinned backdrop is at full height
       behind the content. Then a sweep down the whole document so the release
       boundaries are covered too. Counted, so a selector that matches nothing
       cannot pass as "no failures found". */
    /* MEASURED GAP, recorded so it is not re-opened: deleting pointer-events
       from .cine-stage__sticky did NOT fail the elementFromPoint sweep below,
       because the z-index lift already keeps the sections above the backdrop.
       The sweep proves the outcome; this proves the rule that is the defence in
       depth behind it, read out of the live cascade rather than the source. */
    const pe = await page.evaluate((sel) => {
      const q = (x) => getComputedStyle(document.querySelector(`${sel} ${x}`)).pointerEvents;
      return { sticky: q('.cine-stage__sticky'), canvas: q('canvas[data-cine-canvas]'), poster: q('img[data-cine-poster]') };
    }, STAGE);
    expect(pe.sticky, 'the backdrop can receive a click, a tap or a selection drag').toBe('none');
    expect(pe.canvas, 'the canvas can receive a click').toBe('none');
    expect(pe.poster, 'the poster can receive a click').toBe('none');

    const total = await page.evaluate(() =>
      document.querySelectorAll('[data-pricing-card],[data-primary-cta],[data-plan-cta]').length);
    expect(total, 'the hit test found no pricing cards and no calls to action to test').toBe(3 + 7 + 3);

    const report = [];
    for (let i = 0; i < total; i += 1) {
      report.push(await page.evaluate((k) => {
        const el = document.querySelectorAll('[data-pricing-card],[data-primary-cta],[data-plan-cta]')[k];
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        const r = el.getBoundingClientRect();
        const cy = r.top + r.height / 2;
        const header = document.querySelector('.site-header').getBoundingClientRect();
        if (cy < header.bottom) return { what: el.textContent.trim().slice(0, 44), underHeader: true, reached: true, hitIsCanvas: false, hitInSticky: false };
        const hit = document.elementFromPoint(r.left + r.width / 2, cy);
        return {
          what: el.textContent.trim().slice(0, 44),
          reached: !!(hit && (el === hit || el.contains(hit) || hit.contains(el))),
          hitTag: hit ? hit.tagName.toLowerCase() : null,
          hitIsCanvas: !!(hit && hit.hasAttribute && hit.hasAttribute('data-cine-canvas')),
          hitInSticky: !!(hit && hit.closest && hit.closest('.cine-stage__sticky')),
        };
      }, i));
    }
    expect(report.length).toBe(total);
    for (const h of report) {
      expect(h.hitIsCanvas, `the canvas is over "${h.what}"`).toBe(false);
      expect(h.hitInSticky, `the sticky backdrop is over "${h.what}"`).toBe(false);
      expect(h.reached, `"${h.what}" is covered by <${h.hitTag}>`).toBe(true);
    }

    for (const frac of [0, 0.25, 0.5, 0.75, 0.98]) {
      await page.evaluate((f) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(max * f));
      }, frac);
      const hits = await page.evaluate(() => {
        const out = [];
        const header = document.querySelector('.site-header').getBoundingClientRect();
        for (const el of document.querySelectorAll('[data-pricing-card],[data-primary-cta],[data-plan-cta]')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue;
          /* The fixed site header covers the top strip of the viewport at every
             scroll position, by design and independently of any stage. A target
             that happens to sit under it is not evidence about the canvas. */
          if (cy < header.bottom + 1) continue;
          const hit = document.elementFromPoint(cx, cy);
          out.push({
            what: el.textContent.trim().slice(0, 44),
            reached: !!(hit && (el === hit || el.contains(hit) || hit.contains(el))),
            hitTag: hit ? hit.tagName.toLowerCase() : null,
            inSticky: !!(hit && hit.closest && hit.closest('.cine-stage__sticky')),
          });
        }
        return out;
      });
      for (const h of hits) {
        expect(h.inSticky, `at scroll ${frac} the backdrop is over "${h.what}"`).toBe(false);
        expect(h.reached, `at scroll ${frac} "${h.what}" is covered by <${h.hitTag}>`).toBe(true);
      }
    }
  });

  test('the header and the mobile navigation stay usable at every scroll position', async ({ page }) => {
    await open(page);
    for (const frac of [0, 0.3, 0.6, 0.95]) {
      await page.evaluate((f) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.round(max * f));
      }, frac);
      const hit = await page.evaluate(() => {
        const cta = document.querySelector('[data-header-cta]');
        const r = cta.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { reached: cta === el || cta.contains(el), inStage: !!(el && el.closest && el.closest('[data-cine-stage]')) };
      });
      expect(hit.reached, `the header call to action is covered at scroll ${frac}`).toBe(true);
      expect(hit.inStage, `a stage element is painting over the fixed header at scroll ${frac}`).toBe(false);
    }
    // And the mobile control, at a phone width.
    await page.setViewportSize({ width: 390, height: 780 });
    await page.evaluate(() => window.scrollTo(0, 1200));
    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeVisible();
    /* And the phone gets the portrait composition, not a crop of the landscape
       one: the <source media> in the served HTML has to actually take. */
    await page.reload();
    await page.waitForFunction(() => window.__cine && window.__cine.ready);
    const posterSrc = await page.evaluate((sel) =>
      document.querySelector(`${sel} img[data-cine-poster]`).currentSrc, STAGE);
    expect(posterSrc, 'the phone is being served the desktop poster').toContain('/mobile/poster.png');
    expect(await page.evaluate(() => window.__cine.variantName)).toBe('mobile');

    await page.evaluate(() => window.scrollTo(0, 1200));
    const reached = await page.evaluate(() => {
      const b = document.querySelector('.nav-toggle');
      const r = b.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return b === el || b.contains(el);
    });
    expect(reached, 'the mobile navigation control is covered by the stage').toBe(true);
  });

  test('text over the stage stays selectable, and reveals carry no motion', async ({ page }) => {
    await open(page);
    const facts = await page.evaluate(() => {
      const p = document.querySelector('section[data-ia="2"] p.reveal');
      const range = document.createRange();
      range.selectNodeContents(p);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const reveal = document.querySelector('.cine-stage .reveal');
      const rcs = getComputedStyle(reveal);
      return {
        selected: String(sel.toString()).trim().length,
        userSelect: getComputedStyle(p).userSelect || getComputedStyle(p).webkitUserSelect,
        revealOpacity: rcs.opacity,
        revealTransform: rcs.transform,
        revealFilter: rcs.filter,
        sectionTransform: getComputedStyle(p.closest('section')).transform,
        sectionOpacity: getComputedStyle(p.closest('section')).opacity,
      };
    });
    expect(facts.selected, 'text over the stage could not be selected').toBeGreaterThan(20);
    expect(facts.userSelect).not.toBe('none');
    // The absolute owner rule, measured on the elements that hold the words.
    expect(facts.revealOpacity, 'a container of readable text is at reduced opacity').toBe('1');
    expect(facts.revealTransform, 'a container of readable text carries a transform').toBe('none');
    expect(facts.revealFilter).toBe('none');
    expect(facts.sectionTransform).toBe('none');
    expect(facts.sectionOpacity).toBe('1');
  });

  test('the stylesheet hands the canvas a real box, and a frame drawn into it reads back', async ({ page }) => {
    await open(page);
    const sized = await page.evaluate((id) => window.__cine.sizeCanvas(id), SEQ);
    expect(sized.sized, `the stylesheet gave the canvas a ${sized.cssWidth}x${sized.cssHeight} box (${sized.reason})`).toBe(true);
    expect(sized.backingWidth).not.toBe(300);

    // The shared guard refuses a zero box, a 300x150 store, and a mismatch.
    const m = await canvasMetrics(page, CANVAS);
    expect(m.cssHeight, 'the pinned backdrop is not a full viewport tall').toBeGreaterThan(600);

    const variant = variantOf(localPlaceholderManifest(), SEQ, 'desktop');
    for (const index of [0, 37, variant.frameCount - 1]) {
      await page.evaluate(([id, i]) => window.__cine.paint(id, i), [SEQ, index]);
      const read = await readCanvasFrame(page, CANVAS, variant);
      expect(read.frameIndex, `painted ${index}, the canvas reads ${read.frameIndex}`).toBe(index);
      expect(read.sequenceId).toBe(SEQ);
    }
  });
});
