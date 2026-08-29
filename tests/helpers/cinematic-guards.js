/* Helpers for the seventeen cinematic guards.
   Suite: tests/cinematic-guards.spec.js
   Foundation helpers (sentinel, canvas metrics, pixel frame read): tests/helpers/cinematic.js

   THE TWO FAILURE SHAPES EVERYTHING HERE IS BUILT AGAINST

   1. A GUARD THAT COUNTS OCCURRENCES IN SOURCE answers "how often is this
      written", not "what can one render show". Moving a condition leaves the
      count green. So every assertion below that can be made against a live
      render is made against a live render: computed styles, hit tests, decoded
      canvas pixels, the network log, the focus order the browser actually
      produces. The three source-reading helpers here (subject/homepage IA
      mirror, generated-asset scan, module presence) read source because their
      subject IS a file on disk, and each says so where it is defined.

   2. A GUARD THAT COPIES THE FACT IT GUARDS expires green when the fact
      changes. So no expected price, plan name, readiness word or section count
      is typed in this file. Prices come from window.NV_PRICING, readiness from
      window.NV_ROADMAP cross-checked against availabilityWordFor() in
      scripts/lib/breadth.mjs, the IA from home.html itself, frame counts and
      urls from the manifest. Where a fact has only one home, the guard asserts
      the ANCHOR still exists and fails loudly when it moves, rather than
      silently passing on a fact that has gone. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { availabilityWordFor, AVAILABILITY_WORDS } from '../../scripts/lib/breadth.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The mounted subject.
 *
 * NV_CINE_MUTANT is the mutation-testing hook and it is deliberately an
 * environment variable rather than a default: a mutation run points one
 * collaborator at a byte copy of the shipped module under
 * /artifacts/cine-mutants/, e.g.
 *
 *   NV_CINE_MUTANT="stage=/artifacts/cine-mutants/scroll-stage.js"
 *
 * so the shipped file is never written to while other sessions are editing it.
 * assertBoundToShippedEngine() refuses any run that loaded an override unless
 * this variable is set, so a normal run cannot pass while measuring a mutant.
 */
export const MUTANT_QUERY = process.env.NV_CINE_MUTANT || '';
export const SUBJECT_URL = `/tests/fixtures/cine-guard-subject.html${MUTANT_QUERY ? `?${MUTANT_QUERY}` : ''}`;
export const HOMEPAGE_URL = '/home.html';
export const PLACEHOLDER_MANIFEST_URL = '/artifacts/cinematic-placeholders/manifest.json';

/** Frame, keyframe and poster urls are distinguishable by shape alone, so a
    request log can be classified without asking the engine what it fetched. */
export const isFrameRequest = (url) => /\/f\d{4}\.(png|avif|webp)$/.test(url);
export const isKeyframeRequest = (url) => /\/key-[a-z0-9-]+\.(png|avif|webp)$/.test(url);
export const isPosterRequest = (url) => /\/poster\.(png|avif|webp)$/.test(url);
export const isMobileFrame = (url) => /\/mobile\//.test(url);

/* ------------------------------------------------------------------ *
 * Module presence on disk. Reads the filesystem because the question is
 * literally "has the shipped module been written yet".
 * ------------------------------------------------------------------ */
export const CINE_MODULE_PATHS = Object.freeze({
  loader: 'assets/cinematic/sequence-loader.js',
  stage: 'assets/cinematic/scroll-stage.js',
  fallback: 'assets/cinematic/fallback.js',
  index: 'assets/cinematic/index.js',
});

export function shippedModules() {
  const out = {};
  for (const [name, rel] of Object.entries(CINE_MODULE_PATHS)) {
    out[name] = fs.existsSync(path.join(root, rel)) ? `/${rel}` : null;
  }
  return out;
}

/**
 * THE ANTI-STRAWMAN RULE. A test double that can quietly keep being measured
 * after the real module lands is this repository's signature defect wearing a
 * different hat. If a shipped module exists on disk, it MUST be the one the
 * subject page mounted.
 */
export async function assertBoundToShippedEngine(page) {
  const bus = await page.evaluate(() => ({
    engineSource: window.__cine && window.__cine.engineSource,
    sources: window.__cine && window.__cine.sources,
    overrides: window.__cine && window.__cine.overrides,
    error: window.__cine && window.__cine.error,
  }));
  if (bus.error) throw new Error(`the subject page failed to mount a cinematic engine: ${bus.error}`);

  /* THE MUTANT FENCE. An override is only ever legitimate inside a mutation
     run, and a mutation run announces itself in the environment. Without this
     a mislaid query string would let the whole suite pass while measuring a
     copy of the engine that nothing ships. */
  const overrides = bus.overrides && Object.keys(bus.overrides).length ? bus.overrides : null;
  if (overrides && !MUTANT_QUERY) {
    throw new Error(`the subject page loaded module overrides ${JSON.stringify(overrides)} but NV_CINE_MUTANT is not set. Nothing measured in this run describes the modules that ship.`);
  }
  if (overrides) {
    return { engineSource: bus.engineSource, sources: bus.sources, overrides, shipped: shippedModules() };
  }

  const shipped = shippedModules();
  const mounted = { ...(bus.sources || {}) };
  if (bus.engineSource === CINE_MODULE_PATHS.index || bus.engineSource === `/${CINE_MODULE_PATHS.index}`) {
    /* The shipped index owns its own wiring; every collaborator is shipped. */
    for (const key of Object.keys(CINE_MODULE_PATHS)) mounted[key] = shipped[key];
  }
  const missed = [];
  for (const [name, rel] of Object.entries(CINE_MODULE_PATHS)) {
    if (name === 'index') {
      if (shipped.index && bus.engineSource !== shipped.index) missed.push(`index (shipped at ${shipped.index}, mounted ${bus.engineSource})`);
      continue;
    }
    if (shipped[name] && mounted[name] !== shipped[name]) {
      missed.push(`${name} (shipped at ${shipped[name]}, mounted ${mounted[name] || 'reference'})`);
    }
  }
  if (missed.length) {
    throw new Error(
      `the guards measured a reference implementation while a shipped one exists: ${missed.join('; ')}.\n`
      + `  Every assertion in this run would describe tests/fixtures/cine-reference-engine.js rather than the module that ships.`,
    );
  }
  return { engineSource: bus.engineSource, sources: bus.sources, shipped };
}

/* ------------------------------------------------------------------ *
 * IA mirror. Reads two files on disk because the claim is about two
 * documents' structure, not about one render.
 * ------------------------------------------------------------------ */
const readLocal = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

/** Ordered data-ia values, in document order. */
export function iaSignature(html) {
  return Array.from(html.matchAll(/data-ia="(\d+)"/g)).map((m) => Number(m[1]));
}

/** Section number -> how many primary actions that section carries. */
function primaryActionsBySection(html, primaryPattern) {
  const marks = [];
  for (const m of html.matchAll(/data-ia="(\d+)"/g)) marks.push({ section: Number(m[1]), at: m.index });
  const counts = new Map();
  for (let i = 0; i < marks.length; i += 1) {
    const from = marks[i].at;
    const to = i + 1 < marks.length ? marks[i + 1].at : html.length;
    const slice = html.slice(from, to);
    const n = (slice.match(primaryPattern) || []).length;
    counts.set(marks[i].section, (counts.get(marks[i].section) || 0) + n);
  }
  return counts;
}

/**
 * The subject page may not drift into a shape the product does not have.
 * Compared: the ordered data-ia signature, and the "one primary action per
 * section" ceiling on both documents. Also proves the subject's stage spans
 * partition the homepage's sections without merging any of them.
 */
export function assertSubjectMirrorsHomepage() {
  const home = readLocal('home.html');
  const subject = readLocal('tests/fixtures/cine-guard-subject.html');
  const homeIa = iaSignature(home);
  const subjectIa = iaSignature(subject);
  const problems = [];

  const distinct = (a) => [...new Set(a)];
  if (distinct(homeIa).join(',') !== distinct(subjectIa).join(',')) {
    problems.push(`section signature: home.html is [${distinct(homeIa)}], the subject is [${distinct(subjectIa)}]`);
  }
  if (distinct(homeIa).length !== 7) {
    problems.push(`home.html declares ${distinct(homeIa).length} data-ia sections, not the seven the directive keeps`);
  }

  const homePrimaries = primaryActionsBySection(home, /class="btn btn-primary[^"]*"/g);
  const subjectPrimaries = primaryActionsBySection(subject, /\sdata-primary\b/g);
  for (const [section, n] of homePrimaries) {
    if (n > 1) problems.push(`home.html section ${section} carries ${n} primary actions; the directive allows one`);
  }
  for (const [section, n] of subjectPrimaries) {
    if (n > 1) problems.push(`the subject's section ${section} carries ${n} primary actions; the directive allows one`);
  }

  /* Stage spans must partition the sections, never merge them. */
  const spans = Array.from(subject.matchAll(/data-cine-stage="([^"]+)"[^>]*data-cine-sections="([^"]+)"/g))
    .map((m) => ({ id: m[1], sections: m[2].trim().split(/\s+/).map(Number) }));
  if (!spans.length) problems.push('the subject page declares no [data-cine-stage]');
  const covered = spans.flatMap((s) => s.sections);
  if (covered.join(',') !== distinct(subjectIa).join(',')) {
    problems.push(`stage spans cover [${covered}] but the subject's sections are [${distinct(subjectIa)}]`);
  }
  if (new Set(covered).size !== covered.length) {
    problems.push(`stage spans overlap: [${covered}]. A sequence may span adjacent sections and may never merge two.`);
  }

  /* SECOND ANCHOR: the integration reference. tests/fixtures/cinematic-layout.html
     states in its own header that it is "the exact markup home.html adopts". If
     the mounted subject's stage spans or reduced-motion chapter slots drift from
     it, the eight engine guards are measuring a DOM the product will not have. */
  const layoutPath = path.join(root, 'tests', 'fixtures', 'cinematic-layout.html');
  let layout = null;
  if (fs.existsSync(layoutPath)) {
    layout = fs.readFileSync(layoutPath, 'utf8');
    const spanOf = (html) => Array.from(html.matchAll(/data-cine-stage="([a-z-]+)"[^>]*\n?[^>]*data-cine-sections="([^"]+)"/g))
      .map((m) => `${m[1]}:${m[2].trim().split(/\s+/).join(',')}`);
    const chaptersOf = (html) => Array.from(html.matchAll(/data-cine-chapter="([a-z-]+)"/g)).map((m) => m[1]);
    const a = spanOf(subject).join(' | ');
    const b = spanOf(layout).join(' | ');
    if (a !== b) problems.push(`stage spans differ from the integration reference:\n      subject: ${a}\n      layout:  ${b}`);
    const ca = chaptersOf(subject).join(',');
    const cb = chaptersOf(layout).join(',');
    if (ca !== cb) problems.push(`reduced-motion chapter slots differ from the integration reference:\n      subject: [${ca}]\n      layout:  [${cb}]`);
  }

  if (problems.length) throw new Error(`subject mirror:\n  - ${problems.join('\n  - ')}`);
  return { homeIa, subjectIa, spans, comparedToLayout: layout !== null };
}

/* ------------------------------------------------------------------ *
 * In-page instrumentation. Installed BEFORE any page script, so it wraps
 * whatever the engine ends up being, and measures the engine from
 * outside rather than believing what it reports.
 * ------------------------------------------------------------------ */
export async function installProbe(page) {
  await page.addInitScript(() => {
    const W = window;
    const probe = { frame: 0, draws: [], drawCount: 0, hiddenDraws: 0 };
    W.__cineProbe = probe;

    /* Our own animation-frame counter. It is registered before any page script
       runs, so its callback is first in every frame's queue and every draw that
       happens later in the same frame carries the same frame number. That is
       what makes "two paints in one animation frame" detectable without asking
       the engine how many loops it is running. */
    const bump = () => { probe.frame += 1; W.requestAnimationFrame(bump); };
    W.requestAnimationFrame(bump);

    /* Fetches in flight, counted from outside the loader. settle() needs this:
       a stage that is waiting for bytes paints nothing, so "no draws for 250ms"
       is indistinguishable from "finished" unless the network is watched too.
       Reading it from the loader's own stats would be asking the engine whether
       the engine is done. */
    probe.fetchStarted = 0;
    probe.fetchInFlight = 0;
    const nativeFetch = W.fetch ? W.fetch.bind(W) : null;
    if (nativeFetch) {
      W.fetch = function fetchCounted(...args) {
        probe.fetchStarted += 1;
        probe.fetchInFlight += 1;
        const done = () => { probe.fetchInFlight -= 1; };
        let result;
        try {
          result = nativeFetch(...args);
        } catch (err) {
          done();
          throw err;
        }
        return Promise.resolve(result).then(
          (r) => { done(); return r; },
          (e) => { done(); throw e; },
        );
      };
    }

    let hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hidden ? 'hidden' : 'visible') });
    W.__setHidden = (value) => {
      hidden = !!value;
      document.dispatchEvent(new Event('visibilitychange'));
    };

    const original = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function drawImage(...args) {
      try {
        const canvas = this.canvas;
        if (canvas && canvas.hasAttribute && canvas.hasAttribute('data-cine-canvas')) {
          const host = canvas.closest('[data-cine-stage]');
          probe.drawCount += 1;
          if (hidden) probe.hiddenDraws += 1;
          probe.draws.push({
            frame: probe.frame,
            stage: host ? host.getAttribute('data-cine-stage') : null,
            hidden,
          });
          if (probe.draws.length > 5000) probe.draws.splice(0, 1000);
        }
      } catch { /* instrumentation must never break the page it measures */ }
      return original.apply(this, args);
    };
  });
}

/** Every network request the page made, classified. Recording starts now. */
export function recordRequests(page) {
  const log = [];
  const handler = (req) => log.push(req.url());
  page.on('request', handler);
  return {
    log,
    stop() { page.off('request', handler); },
    frames() { return log.filter(isFrameRequest); },
    keyframes() { return log.filter(isKeyframeRequest); },
    posters() { return log.filter(isPosterRequest); },
    since(mark) { return log.slice(mark); },
    mark() { return log.length; },
  };
}

export const probeState = (page) => page.evaluate(() => ({
  frame: window.__cineProbe.frame,
  drawCount: window.__cineProbe.drawCount,
  hiddenDraws: window.__cineProbe.hiddenDraws,
  fetchStarted: window.__cineProbe.fetchStarted,
  fetchInFlight: window.__cineProbe.fetchInFlight,
}));

/** Draws grouped by (stage, animation frame). More than one is a second loop. */
export async function drawsPerAnimationFrame(page, sinceFrame = 0) {
  return page.evaluate((from) => {
    const counts = new Map();
    for (const d of window.__cineProbe.draws) {
      if (d.frame < from) continue;
      const key = `${d.stage}@${d.frame}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    let worst = 0;
    let worstKey = null;
    for (const [key, n] of counts) if (n > worst) { worst = n; worstKey = key; }
    return { worst, worstKey, groups: counts.size };
  }, sinceFrame);
}

/* ------------------------------------------------------------------ *
 * Opening the subject
 * ------------------------------------------------------------------ */
export async function openSubject(page, { url = SUBJECT_URL, waitForMount = true } = {}) {
  await installProbe(page);
  await page.goto(url);
  if (waitForMount) {
    await page.waitForFunction(() => window.__cine && window.__cine.ready, null, { timeout: 20_000 });
  }
  return page.evaluate(() => ({
    engineSource: window.__cine.engineSource,
    sources: window.__cine.sources,
    error: window.__cine.error,
  }));
}

/**
 * Put the page at a given progress through a stage, then wait for painting to
 * go quiet. Quiescence is measured from the drawImage probe, not from anything
 * the engine says, so a stage that settles on the WRONG frame is read at that
 * wrong frame rather than being waited into agreement.
 */
export async function scrollToProgress(page, stageSelector, progress) {
  /* CONVERGE, do not scroll once. A late image, a font swap or a sticky release
     can move the stage's top after the first scrollTo, which leaves the stage
     painting the frame implied by the OLD geometry while the guard computes the
     expected index from the new one. That reads as an off-by-one in the engine
     and is not one. Scrolling until the target stops moving removes the
     ambiguity without ever waiting the engine into agreement: the final read is
     still whatever the canvas has on it. */
  let target = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await page.evaluate(({ sel, p }) => {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`scrollToProgress: no element matches ${sel}`);
      const rect = el.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const range = rect.height - window.innerHeight;
      if (range <= 0) throw new Error(`scrollToProgress: ${sel} is ${rect.height}px tall in a ${window.innerHeight}px viewport and has no scroll range`);
      /* Deliberately past the ends for p<0 or p>1, to exercise clamping. */
      const want = Math.round(top + p * range);
      window.scrollTo(0, want);
      return { want, at: window.scrollY };
    }, { sel: stageSelector, p: progress });
    await page.waitForTimeout(60);
    if (target !== null && result.want === target) break;
    target = result.want;
  }
  await settle(page);
  /* One last nudge so the stage re-reads geometry that settled during loading,
     then let it go quiet again. A stage that only listens to scroll would
     otherwise hold a frame chosen from geometry that no longer exists. */
  await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  await settle(page);
}

/**
 * Wait until the cinematic canvases have stopped being painted AND no frame
 * fetch is still in flight.
 *
 * Both halves are load bearing. A stage waiting for bytes paints nothing, so
 * draw quiescence alone cannot tell "settled on the right frame" from "still
 * holding the last good frame while the right one is downloading" — and a guard
 * that reads the canvas in that gap reports an off-by-one the engine did not
 * commit. Neither signal is taken from the engine: one is a wrapped drawImage,
 * the other a wrapped fetch, both installed before any page script ran.
 *
 * This never waits the engine into agreement: it waits for work to STOP, and
 * whatever is on the canvas at that moment is what the guard reads.
 */
export async function settle(page, quietMs = 250, timeoutMs = 8000) {
  const started = Date.now();
  let last = null;
  let lastChange = Date.now();
  for (;;) {
    const now = await page.evaluate(() => ({
      draws: window.__cineProbe.drawCount,
      started: window.__cineProbe.fetchStarted,
      inFlight: window.__cineProbe.fetchInFlight,
    }));
    const key = `${now.draws}:${now.started}`;
    if (last !== key) { last = key; lastChange = Date.now(); }
    const quiet = Date.now() - lastChange >= quietMs && now.inFlight <= 0;
    if (quiet) return now.draws;
    if (Date.now() - started > timeoutMs) return now.draws;
    await page.waitForTimeout(50);
  }
}

/* ------------------------------------------------------------------ *
 * Hit testing and layout
 * ------------------------------------------------------------------ */
/**
 * For every element matching `selector`, hit test its centre and four inset
 * corners with document.elementFromPoint and report what the browser says is
 * on top. This is the only honest way to answer "can the visitor click this":
 * a computed pointer-events value on the canvas answers a different question,
 * because a wrapper, an overlay or a stacking context can intercept instead.
 */
export async function hitTest(page, selector) {
  return page.evaluate((sel) => {
    const inset = 6;
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) { out.push({ text: (el.textContent || '').trim().slice(0, 60), offscreen: true, points: [] }); continue; }
      const points = [
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.left + inset, r.top + inset],
        [r.right - inset, r.top + inset],
        [r.left + inset, r.bottom - inset],
        [r.right - inset, r.bottom - inset],
      ];
      const results = points.map(([x, y]) => {
        if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return { outsideViewport: true };
        const hit = document.elementFromPoint(x, y);
        if (!hit) return { hit: null };
        return {
          tag: hit.tagName.toLowerCase(),
          isCanvas: hit.tagName.toLowerCase() === 'canvas',
          inStageDecoration: !!hit.closest('.cine-stage__sticky'),
          reachesTarget: hit === el || el.contains(hit) || hit.contains(el),
          hitText: (hit.textContent || '').trim().slice(0, 40),
        };
      });
      out.push({ text: (el.textContent || '').trim().slice(0, 60), points: results });
    }
    return out;
  }, selector);
}

/** Documents that scroll sideways, and the widest element responsible. */
export async function horizontalOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const culprits = [];
    if (overflow > 0) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.right > doc.clientWidth + 1 || r.left < -1) {
          culprits.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && String(el.className).slice(0, 60)) || '',
            left: Math.round(r.left), right: Math.round(r.right),
          });
        }
        if (culprits.length >= 8) break;
      }
    }
    return { overflow, clientWidth: doc.clientWidth, scrollWidth: doc.scrollWidth, culprits };
  });
}

/* ------------------------------------------------------------------ *
 * Canonical readers. NOTHING in this file states a price, a plan name
 * or a readiness word: they are read from the config the page itself
 * renders from.
 * ------------------------------------------------------------------ */
export async function readCanonicalPricing(page) {
  const P = await page.evaluate(() => (window.NV_PRICING ? JSON.parse(JSON.stringify(window.NV_PRICING)) : null));
  if (!P) throw new Error('window.NV_PRICING is absent on this page. pricing-config.js is the single source of truth and nothing derived from it can be checked without it.');
  if (!Array.isArray(P.plans) || !P.plans.length) throw new Error('NV_PRICING.plans is empty; the canonical anchor guard 9 derives from has moved.');
  return P;
}

/**
 * roadmap-config.js, read from the file rather than from the page.
 *
 * home.html does NOT load roadmap-config.js: its breadth block is pre-rendered
 * at build time by scripts/build-breadth.mjs. Reading canonical from the page
 * would therefore make guard 12 quietly untestable on the one page it matters
 * most on, so the file is evaluated here instead. It is a browser script that
 * assigns window.NV_ROADMAP and nothing else.
 */
let roadmapCache = null;
export function localRoadmap() {
  if (roadmapCache) return roadmapCache;
  const source = fs.readFileSync(path.join(root, 'roadmap-config.js'), 'utf8');
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', source)(sandbox.window);
  const R = sandbox.window.NV_ROADMAP;
  if (!R || !Array.isArray(R.services) || !R.services.length) {
    throw new Error('roadmap-config.js did not produce window.NV_ROADMAP.services. The canonical anchor guard 12 derives from has moved.');
  }
  roadmapCache = R;
  return R;
}

/** Prefer the page's own copy when it has one, so a page that ships a stale
    roadmap is caught; otherwise fall back to the file the build reads. */
export async function readCanonicalRoadmap(page) {
  const fromPage = await page.evaluate(() => (window.NV_ROADMAP ? JSON.parse(JSON.stringify(window.NV_ROADMAP)) : null));
  const onDisk = localRoadmap();
  if (!fromPage) return onDisk;
  if (fromPage.services.length !== onDisk.services.length) {
    throw new Error(`the page carries ${fromPage.services.length} roadmap services and roadmap-config.js on disk carries ${onDisk.services.length}. The page is rendering a stale copy of canonical.`);
  }
  return fromPage;
}

/**
 * Every C$ amount canonical knows about, as the strings a reader would see.
 *
 * The whole config is walked rather than a named list of fields, because a
 * named list is a hand-maintained list: add `enterprise.from` to pricing-config
 * and a field-by-field reader would start reporting the new published amount as
 * an unknown literal on the page it is published on. Any number canonical
 * carries is a number canonical may publish.
 */
export function canonicalAmountStrings(P) {
  const numbers = new Set();
  const seen = new Set();
  (function walk(node) {
    if (node === null || node === undefined) return;
    if (typeof node === 'number') { if (Number.isFinite(node)) numbers.add(node); return; }
    if (typeof node === 'string') {
      /* Amounts canonical states inside its own prose count too. */
      for (const m of node.matchAll(/C\$\s?([\d,]+)/g)) {
        const n = Number(m[1].replace(/,/g, ''));
        if (Number.isFinite(n)) numbers.add(n);
      }
      return;
    }
    if (typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    for (const value of Array.isArray(node) ? node : Object.values(node)) walk(value);
  })(P);
  const strings = new Set();
  for (const n of numbers) {
    strings.add(`C$${n.toLocaleString('en-CA')}`);
    strings.add(`C$${n}`);
  }
  return { numbers, strings };
}

/* ------------------------------------------------------------------ *
 * Readiness. The vocabulary is imported from the site's own model rather
 * than typed here, so a change to the site's words fails the fixture
 * instead of drifting past it.
 * ------------------------------------------------------------------ */
export { availabilityWordFor, AVAILABILITY_WORDS };

/** Words that assert a capability is usable NOW, in any casing. */
export const AVAILABILITY_CLAIM_PATTERNS = Object.freeze([
  /\bavailable\s+(today|now)\b/i,
  /\blive\s+(today|now)\b/i,
  /\bworks?\s+today\b/i,
  /\brunning\s+today\b/i,
  /\bavailable\s+for\s+clients\b/i,
]);

/**
 * The three independent statements of what is ready, cross-checked.
 *
 * WHY THREE AND NOT ONE. roadmap-config.js is where a status is set, so a
 * guard that only asks roadmap-config whether a service may be called available
 * agrees with every edit to roadmap-config, including a wrong one. Two other
 * surfaces state the same fact and are maintained by hand for readers: the
 * page's own "what is live, and what is not" paragraph, and the footer's
 * development sentence. Promoting a service in one place and not the others is
 * a contradiction a reader could hit, and it is what this returns.
 */
export async function readinessSurfaces(page) {
  const roadmap = await readCanonicalRoadmap(page);
  const prose = await page.evaluate(() => {
    const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
    /* The honesty paragraph is found by its heading, not by an id, so it is
       found on any page that carries one. */
    let honesty = document.getElementById('honesty');
    if (!honesty) {
      for (const h of document.querySelectorAll('h2,h3')) {
        if (/what is live,? and what is not/i.test(h.textContent || '')) {
          let n = h.nextElementSibling;
          while (n && n.tagName !== 'P') n = n.nextElementSibling;
          honesty = n;
          break;
        }
      }
    }
    let footer = document.getElementById('footerTruth');
    if (!footer) {
      for (const p of document.querySelectorAll('footer p')) {
        if (/in development/i.test(p.textContent || '')) { footer = p; break; }
      }
    }
    return { honesty: text(honesty), footer: text(footer) };
  });
  if (!prose.honesty) {
    throw new Error('no "what is live, and what is not" paragraph found on this page. That paragraph is one of the three independent anchors guard 12 cross-checks; without it the guard would be reduced to agreeing with roadmap-config.js about roadmap-config.js.');
  }
  return { roadmap, prose };
}

/** Services the prose declares to be in development, matched to canonical slugs. */
export function servicesNamedInDevelopment(roadmap, prose) {
  /* SENTENCE SCOPED, DELIBERATELY. A fixed window of characters after the name
     reaches across a full stop and picks up the NEXT sentence's verdict. The
     footer's "a round-the-clock front desk are how it acts today. Lead
     generation is in development." made a windowed reader report the front desk
     as in development, which contradicted canonical and failed this guard on
     copy that was correct. A claim belongs to the sentence that makes it. */
  const blob = `${prose.honesty || ''} ${prose.footer || ''}`;
  const sentences = blob.split(/(?<=[.!?])\s+/).map((t) => t.toLowerCase());
  const DEV = /\b(in development|not (yet )?live|on the roadmap|not running for a client|not built)\b/;
  const named = new Set();
  for (const sentence of sentences) {
    if (!DEV.test(sentence)) continue;
    for (const svc of roadmap.services) {
      const name = String(svc.name || '').toLowerCase();
      if (name && sentence.includes(name)) named.add(svc.slug);
    }
  }
  return named;
}

/* ------------------------------------------------------------------ *
 * Generated-asset scan (guard 10). Reads bytes on disk because the claim
 * is about files, not about a render.
 * ------------------------------------------------------------------ */
export function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

export const REPO_ROOT = root;
export const localFile = (rel) => path.join(root, rel);
