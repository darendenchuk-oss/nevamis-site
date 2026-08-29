/* Cinematic scroll stages: the wiring, and nothing else.
   Contract: docs/cinematic/API-CONTRACT.md section 5.
   Guards:   scripts/check-cinematic-contract.mjs   (export surface)
             scripts/check-cinematic-home.mjs       (home.html against the config)
             tests/cinematic-guards.spec.js         (the seventeen)
             tests/cinematic-home.spec.js           (the real homepage)

   OWNERSHIP. This module owns wiring and never the other modules' internals.
   It builds no url (manifest.js), fetches nothing itself (sequence-loader.js),
   never touches a canvas (scroll-stage.js), and never writes hidden,
   aria-hidden or data-cine-state (fallback.js). What it does own is the ORDER,
   the decision about which stages are live at all, and the moment loading is
   allowed to start.

   FOUR THINGS RECONCILED HERE, each written down so the reason survives an edit.

   1. THE CONTRACT'S OWN STEP 3 AND STEP 4 CONTRADICT EACH OTHER.
      Step 4 orders createSequenceLoader BEFORE createFallbackLayer. Step 3
      says that under reduced motion "no loader is created and no frame is
      fetched", and the reduced motion decision must be taken by asking the
      fallback layer rather than by re-deriving the rule a fourth time.
      Both cannot hold. Step 3's rule is the load bearing one (a fetched frame
      is observable; a construction order is not), so the layer is built first
      and is handed a RESOLVER for the loader instead of the loader itself.
      fallback.js#degrade() therefore stays the single owner of loader
      teardown, which is the property step 4's ordering existed to protect.

   2. PRIMING IS LAZY, NOT EAGER.
      The contract's step 4 reads armWatchdog(loader.prime()) during mount.
      Done literally that primes all three sequences at page load and defeats
      the loader's whole offscreen silence design (docs/cinematic/LOADING.md
      section 1). prime() is called from an IntersectionObserver on approach.
      Until it is called nothing is in flight, so there is nothing for the
      watchdog to time out; the watchdog is armed at the same moment, which is
      the only moment a wait exists.

   3. DEGRADING MUST ALSO STOP THE STAGE.
      fallback.js hides the canvas and destroys the loader; it does not know a
      scroll stage exists. A stage left running over a hidden canvas keeps
      measuring and keeps asking a destroyed loader for frames. This module
      watches its own diagnostic stream for {type:'degraded'} and stops that
      stage. It is the only place that can, because it is the only place that
      holds both objects.

   4. A STAGE WITH NO APPROVED ARTWORK IS NOT A DEGRADED STAGE.
      It is a stage that does not exist yet. Approved sequences are gated, so
      config/cinematic-sequences.json declares artwork "pending" and home.html
      authors data-cine-artwork="pending" on those stages. A pending stage is
      skipped: no layer, no loader, no canvas, no manifest request, and the
      stylesheet gives it no scroll length, so it costs the page nothing.
      Reporting a pending stage as "degraded" would be this codebase's
      signature defect: a surface reporting a failure it never attempted. */

import { loadManifest, selectVariant } from './manifest.js';
import { createSequenceLoader } from './sequence-loader.js';
import { createScrollStage } from './scroll-stage.js';
import { createFallbackLayer } from './fallback.js';

const DEFAULT_MANIFEST_URL = '/assets/cinematic/manifest.json';

/* How early a sequence may start loading. Roughly half a phone viewport of
   warning: enough for the stride pass to land before the stage is on screen,
   not so early that a visitor who never reaches section 6 pays for it. */
const APPROACH_MARGIN = '400px 0px';

/* Resolve a collaborator, honouring a mutation override when the harness
   supplies one. The default path is the STATIC import above, so a normal page
   load performs no extra module request and Node can import this file with no
   side effects. Overrides only ever come from
   tests/fixtures/cine-guard-subject.html, which refuses any path outside
   /artifacts/cine-mutants/. */
async function resolve(overridePath, exportName, shipped) {
  if (!overridePath) return shipped;
  const mod = await import(overridePath);
  if (typeof mod[exportName] !== 'function') {
    throw new Error(`module override ${overridePath} does not export ${exportName}`);
  }
  return mod[exportName];
}

/** 'pending' or 'released'. Absent means released: a stage carrying a canvas
    and a poster is a stage with artwork. Anything else is announced. */
function artworkStateOf(el, emit) {
  const raw = el.getAttribute('data-cine-artwork');
  const id = el.getAttribute('data-cine-stage') || '(unnamed stage)';
  const declared = raw === null ? 'released' : raw;
  if (declared !== 'pending' && declared !== 'released') {
    emit({
      type: 'markup-defect',
      field: 'data-cine-artwork',
      detail: `served as ${JSON.stringify(raw)}, which is not 'pending' or 'released'`,
      stage: id,
    });
    return 'released';
  }
  /* Structure and intent must agree. Either half being wrong on its own is a
     silent failure: a "released" stage with no canvas paints nothing and says
     nothing, and a "pending" stage that still carries a backdrop pays a
     viewport of layout for artwork that does not exist. */
  const hasCanvas = !!el.querySelector('canvas[data-cine-canvas]');
  const hasPoster = !!el.querySelector('img[data-cine-poster]');
  if (declared === 'released' && !(hasCanvas && hasPoster)) {
    emit({
      type: 'markup-conflict', stage: id, declared, hasCanvas, hasPoster,
      detail: 'declared released but the served HTML has no canvas and poster to run against',
    });
  }
  if (declared === 'pending' && (hasCanvas || hasPoster)) {
    emit({
      type: 'markup-conflict', stage: id, declared, hasCanvas, hasPoster,
      detail: 'declared pending but the served HTML still carries the backdrop, which costs layout for artwork that does not exist',
    });
  }
  return declared;
}

/**
 * @param {object} [options]
 * @param {string}   [options.manifestUrl='/assets/cinematic/manifest.json']
 * @param {Iterable<Element>} [options.stages] defaults to [data-cine-stage]
 * @param {function} [options.onDiagnostic]
 * @param {object}   [options.moduleOverrides] mutation test seam only
 * @returns {Promise<{stages:Map, destroy:function, state:function}>}
 */
export async function mountCinematic(options = {}) {
  const manifestUrl = options.manifestUrl || DEFAULT_MANIFEST_URL;
  const stageEls = Array.from(
    options.stages || (typeof document !== 'undefined' ? document.querySelectorAll('[data-cine-stage]') : []),
  );
  const report = typeof options.onDiagnostic === 'function' ? options.onDiagnostic : () => {};

  const stages = new Map();
  const observers = [];
  let destroyed = false;

  /* Every diagnostic passes through here, so degrade() can reach the stage
     object fallback.js has no way to know about. The consumer is called first
     and its throw is contained: a page that logs diagnostics badly must not be
     able to stop the stage being stopped. */
  const emit = (d) => {
    try {
      report(d);
    } catch (err) {
      try {
        report({ type: 'diagnostic-consumer-threw', error: String(err && err.message ? err.message : err) });
      } catch { /* nothing left to try */ }
    }
    if (d && d.type === 'degraded' && d.stage) {
      const entry = stages.get(d.stage);
      if (entry && entry.stage && entry.stage.running) {
        entry.stage.stop();
        try {
          report({ type: 'stage-stopped', stage: d.stage, reason: d.reason });
        } catch { /* as above */ }
      }
    }
  };

  const overrides = options.moduleOverrides || {};
  const createLoader = await resolve(overrides.loader, 'createSequenceLoader', createSequenceLoader);
  const createStage = await resolve(overrides.stage, 'createScrollStage', createScrollStage);
  const createFallback = await resolve(overrides.fallback, 'createFallbackLayer', createFallbackLayer);

  /* Which module actually answered each seam. Reported rather than assumed:
     tests/helpers/cinematic-guards.js#assertBoundToShippedEngine() reads this
     and fails a run whose collaborators are not the shipped ones. Without it
     the guard has to take on faith that a mounted index.js used its own static
     imports, which is precisely the kind of faith this project keeps paying
     for. */
  const sources = {
    manifest: '/assets/cinematic/manifest.js',
    loader: overrides.loader || '/assets/cinematic/sequence-loader.js',
    stage: overrides.stage || '/assets/cinematic/scroll-stage.js',
    fallback: overrides.fallback || '/assets/cinematic/fallback.js',
    index: '/assets/cinematic/index.js',
  };

  const handle = {
    stages,
    sources,
    destroy() {
      destroyed = true;
      while (observers.length) {
        const o = observers.pop();
        try { o.disconnect(); } catch { /* already gone */ }
      }
      for (const entry of stages.values()) {
        if (entry.stage) { try { entry.stage.destroy(); } catch { /* teardown is best effort */ } }
        if (entry.loader) { try { entry.loader.destroy(); } catch { /* teardown is best effort */ } }
        if (entry.fallback && typeof entry.fallback.destroy === 'function') {
          try { entry.fallback.destroy(); } catch { /* teardown is best effort */ }
        }
      }
    },
    state() {
      const out = {};
      for (const [id, entry] of stages) {
        out[id] = {
          artwork: entry.artwork,
          state: entry.fallback ? entry.fallback.state : 'awaiting-artwork',
          paintedIndex: entry.stage ? entry.stage.paintedIndex : null,
          running: !!(entry.stage && entry.stage.running),
          primed: !!entry.primed,
        };
      }
      return out;
    },
  };

  /* Start loading when the stage comes within a viewport of the fold, once.
     Without IntersectionObserver there is nothing to observe with, so priming
     immediately is the honest fallback: the alternative is a stage that never
     loads and never says why. */
  function armApproach(el, onApproach) {
    const win = (el.ownerDocument && el.ownerDocument.defaultView) || null;
    if (!win || typeof win.IntersectionObserver !== 'function') {
      emit({
        type: 'approach-unavailable',
        stage: el.getAttribute('data-cine-stage'),
        detail: 'no IntersectionObserver; priming immediately rather than never',
      });
      onApproach();
      return;
    }
    const io = new win.IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const i = observers.indexOf(io);
      if (i >= 0) observers.splice(i, 1);
      onApproach();
    }, { rootMargin: APPROACH_MARGIN });
    observers.push(io);
    io.observe(el);
  }

  /* STEP 1. The poster and every word are already painted from the served
     HTML. Nothing below this line blocks them. */

  const live = [];
  for (const el of stageEls) {
    const id = el.getAttribute('data-cine-stage');
    const artwork = artworkStateOf(el, emit);
    if (artwork === 'pending') {
      /* Not a failure and not a degrade: there is nothing to run. */
      stages.set(id, { stage: null, loader: null, fallback: null, artwork });
      emit({
        type: 'awaiting-artwork', stage: id,
        detail: 'no approved sequence exists for this stage yet, so nothing was mounted and no request was made',
      });
      continue;
    }
    live.push({ el, id, artwork });
  }

  /* No live stage means no reason to ask for a manifest. Fetching one that
     will 404 in order to degrade three stages that were never going to run is
     work the visitor pays for and learns nothing from. */
  if (!live.length) {
    emit({ type: 'mounted', live: 0, pending: stages.size, manifestRequested: false });
    return handle;
  }

  /* STEP 2. The manifest. Any ManifestError degrades every live stage and
     RESOLVES. It never rejects and it never leaves a wait running. */
  let manifest;
  try {
    manifest = await loadManifest(manifestUrl);
  } catch (error) {
    for (const { el, id, artwork } of live) {
      let layer = null;
      try {
        layer = createFallback(el, { id }, { chapters: [] }, { onDiagnostic: emit });
        layer.degrade('manifest-error');
      } catch (err) {
        emit({ type: 'error', stage: id, error: String(err && err.message ? err.message : err) });
      }
      stages.set(id, { stage: null, loader: null, fallback: layer, artwork });
    }
    emit({
      type: 'manifest-error', url: manifestUrl,
      error: String(error && error.message ? error.message : error),
    });
    return handle;
  }

  for (const { el, id, artwork } of live) {
    /* STEP 5, stated first because it wraps everything: one broken stage
       degrades on its own and never takes the other two down. */
    try {
      const sequence = manifest.sequences.find((s) => s.id === id);
      if (!sequence) throw new Error(`the manifest has no sequence '${id}'`);
      const { variant } = selectVariant(sequence);

      /* The loader is created below, on the reduced motion branch's far side.
         The layer is given a resolver so degrade() can still destroy whatever
         exists at the moment it fires. See note 1 in the header. */
      const entry = {
        stage: null, loader: null, fallback: null, artwork, primed: false, variant, sequence,
      };
      stages.set(id, entry);

      const fallback = createFallback(el, sequence, variant, {
        onDiagnostic: emit,
        loader: () => entry.loader,
      });
      entry.fallback = fallback;

      /* STEP 3. Reduced motion, decided by the layer, not by a fourth copy of
         the rule. Nothing scrubs, no loader is created, no frame is fetched. */
      const decide = fallback.prefersReducedMotion;
      if (typeof decide !== 'function') {
        throw new Error('the fallback layer exposes no prefersReducedMotion(), so reduced motion cannot be decided without re-deriving the rule');
      }
      if (decide.call(fallback)) {
        fallback.applyReducedMotion();
        continue;
      }

      /* STEP 4. Loader, stage, and the approach that starts loading. */
      const loader = createLoader(variant, { onDiagnostic: emit });
      entry.loader = loader;

      const stage = createStage(el, sequence, variant, loader, {
        onDiagnostic: emit,
        onFatal: () => fallback.degrade('stage-fatal'),
      });
      entry.stage = stage;
      stage.start();

      armApproach(el, () => {
        if (destroyed || fallback.isDegraded()) return;
        entry.primed = true;
        emit({ type: 'approach', stage: id });
        fallback.armWatchdog(loader.prime());
      });
    } catch (error) {
      const prior = stages.get(id) || {};
      let layer = prior.fallback || null;
      try {
        if (!layer) layer = createFallback(el, { id }, { chapters: [] }, { onDiagnostic: emit });
        layer.degrade('stage-error');
      } catch (err) {
        emit({ type: 'error', stage: id, error: String(err && err.message ? err.message : err) });
      }
      stages.set(id, {
        stage: prior.stage || null, loader: prior.loader || null, fallback: layer, artwork,
      });
      emit({ type: 'stage-error', stage: id, error: String(error && error.message ? error.message : error) });
    }
  }

  emit({ type: 'mounted', live: live.length, pending: stages.size - live.length, manifestRequested: true });
  return handle;
}
