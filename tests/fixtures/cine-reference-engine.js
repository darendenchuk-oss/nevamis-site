/* A REFERENCE ENGINE, NOT THE ENGINE.
   ------------------------------------------------------------------------
   WHY THIS FILE EXISTS, AND WHY IT IS IN tests/ AND NOT IN assets/

   The seventeen guards in tests/cinematic-guards.spec.js have to measure a
   running sequence: an integer read out of canvas pixels, a paused loader, a
   canvas that refuses to intercept a pricing card. A guard that cannot run
   until the thing it guards is finished is a guard that gets written after the
   bug, which is the opposite of the point.

   So this module is a contract-faithful stand-in that lets every guard run,
   pass, and BE PROVED CAPABLE OF FAILING today. It is deliberately the second
   choice at every seam. mountCinematic() below resolves each collaborator with
   preferModule(): if assets/cinematic/<module>.js exists and exports the
   contract's factory, THAT is what runs and this file's version is never
   constructed. The moment the real scroll-stage, fallback layer and index land,
   the same guards bind to them with zero edits, and
   tests/helpers/cinematic-guards.js#assertBoundToShippedEngine() FAILS the run
   if a shipped module exists but was not the one measured.

   That last part is the whole design. A test double that can quietly keep being
   used after the real thing arrives is exactly this repository's signature
   defect wearing a different hat.

   WHAT IS DELIBERATELY SIMPLER HERE THAN IN THE CONTRACT
   The reference stage and fallback implement every rule a guard checks, and
   nothing else. They emit the contract's diagnostics, they honour the sizing,
   painting, visibility and reduced-motion rules, and they never touch a URL
   (manifest.js) or the network (sequence-loader.js). They do not implement the
   contract's full diagnostic vocabulary, and their internals are not the
   shipped design. Nothing in the guard suite reads their internals; the guards
   read pixels, network requests, computed styles and hit tests.

   OWNERSHIP, unchanged from the contract:
     manifest.js        which url, which variant, progress -> index
     sequence-loader.js when bytes are fetched, which frames are resident
     the stage          which index the visitor is on, and painting it
     the fallback layer what the visitor sees when the sequence is unavailable
   No function in this file applies transform, opacity, filter, mask, clip or
   fragmentation to any element containing readable text. */

import {
  frameIndexForProgress, selectVariant, loadManifest, keyframeForChapter,
} from '/assets/cinematic/manifest.js';

/** Resolve a collaborator from the shipped module, or fall back to this file's.
    Returns { fn, source } where source is the module path or 'reference'. */
async function preferModule(path, exportName, referenceFn) {
  try {
    const mod = await import(path);
    if (typeof mod[exportName] === 'function') return { fn: mod[exportName], source: path };
  } catch {
    /* not written yet: fall through to the reference implementation */
  }
  return { fn: referenceFn, source: 'reference' };
}

/* ========================================================================
   REFERENCE STAGE
   Owns which index the visitor is on, and painting it. Never anything
   outside the <canvas>.
   ======================================================================== */
export function createReferenceScrollStage(stageEl, sequence, variant, loader, options = {}) {
  const canvas = options.canvas || stageEl.querySelector('canvas[data-cine-canvas]');
  if (!canvas) throw new Error(`reference stage: ${stageEl.dataset.cineStage} has no canvas[data-cine-canvas]`);
  const requestFrame = options.requestFrame || requestAnimationFrame.bind(window);
  const cancelFrame = options.cancelFrame || cancelAnimationFrame.bind(window);
  const maxDpr = options.maxDpr != null ? options.maxDpr : 2;
  const emit = options.onDiagnostic || (() => {});
  const onFatal = options.onFatal || (() => {});

  const ctx = canvas.getContext('2d');
  let rafId = null;
  let running = false;
  let sized = false;
  let paintedIndex = null;
  let lastProgress = 0;
  let fatalSent = false;

  /* progress = clamp((scrollY - stageTop) / (stageHeight - viewportHeight), 0, 1)
     Read from live geometry every tick; nothing is cached across a resize. */
  function progressNow() {
    const rect = stageEl.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const range = rect.height - window.innerHeight;
    if (range <= 0) return 0;
    const p = (window.scrollY - top) / range;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  /* IF EITHER CSS DIMENSION MEASURES 0, DO NOT SIZE THE CANVAS. A backing store
     left at the 300x150 default while the code reports success is the defect
     this whole phase exists to make impossible. */
  function measure() {
    const r = canvas.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) {
      sized = false;
      emit({ type: 'measure-deferred', reason: 'zero-box', cssWidth: r.width, cssHeight: r.height });
      return false;
    }
    const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr);
    const h = Math.round(r.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      paintedIndex = null; /* the store was replaced; nothing is on it now */
    }
    sized = true;
    emit({ type: 'sized', cssWidth: r.width, cssHeight: r.height, dpr, backingWidth: w, backingHeight: h });
    return true;
  }

  /* Centred cover, and only centred cover. coverSamplePoints() in the guard
     helper recomputes this maths independently; if the two disagree the guard
     reads garbage and throws rather than returning a number. */
  function draw(image) {
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / variant.width, ch / variant.height);
    const dw = variant.width * scale;
    const dh = variant.height * scale;
    ctx.drawImage(image, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function tick() {
    rafId = null;
    if (!running) return;
    /* Nothing runs while the page is hidden. Not a slow path, no path. */
    if (document.hidden) return;
    let wantMore = false;
    try {
      if (!sized && !measure()) return; /* retried on resize / intersection */
      lastProgress = progressNow();
      const index = frameIndexForProgress(lastProgress, variant.frameCount);
      loader.setFocus(index);
      if (index !== paintedIndex) {
        const image = loader.get(index);
        if (!image) {
          /* DO NOT CLEAR. The last good frame stays on the canvas. */
          emit({ type: 'skipped', reason: 'no-frame', index });
          wantMore = true;
        } else {
          draw(image);
          paintedIndex = index;
        }
      }
    } catch (error) {
      emit({ type: 'error', error });
      if (!fatalSent) { fatalSent = true; onFatal(error); }
      running = false; /* never retry into a loop that throws every frame */
      return;
    }
    if (wantMore) schedule();
  }

  /* ONE loop. schedule() is the only place rafId is set, and it is a no-op
     while a frame is already pending, so N scroll events in one frame produce
     one tick. */
  function schedule() {
    if (!running || rafId !== null) return;
    rafId = requestFrame(tick);
  }

  const onScroll = () => schedule();
  const onResize = () => { sized = false; schedule(); };
  const onVisibility = () => {
    if (document.hidden) {
      if (rafId !== null) { cancelFrame(rafId); rafId = null; }
      loader.pause();
      emit({ type: 'paused' });
    } else {
      loader.resume();
      emit({ type: 'resumed' });
      sized = false;
      schedule(); /* exactly one, no catch-up loop */
    }
  };

  return {
    start() {
      if (running) return; /* a second start() is a no-op */
      running = true;
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onResize, { passive: true });
      document.addEventListener('visibilitychange', onVisibility);
      measure();
      schedule();
    },
    stop() {
      running = false;
      if (rafId !== null) { cancelFrame(rafId); rafId = null; }
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
    destroy() { this.stop(); },
    measure,
    get progress() { return lastProgress; },
    get frameIndex() { return frameIndexForProgress(lastProgress, variant.frameCount); },
    get paintedIndex() { return paintedIndex; },
    get running() { return running; },
  };
}

/* ========================================================================
   REFERENCE FALLBACK LAYER
   Owns what the visitor sees when the sequence is unavailable, and ALL DOM
   meaning. The only thing that sets hidden / aria-hidden / data-cine-state.
   ======================================================================== */
export function createReferenceFallbackLayer(stageEl, sequence, variant, options = {}) {
  const primeTimeoutMs = options.primeTimeoutMs != null ? options.primeTimeoutMs : 6000;
  const matchMediaImpl = options.matchMedia || window.matchMedia.bind(window);
  const emit = options.onDiagnostic || (() => {});
  const canvas = stageEl.querySelector('canvas[data-cine-canvas]');
  const sticky = stageEl.querySelector('.cine-stage__sticky');
  let state = 'poster';
  let degraded = false;
  let watchdog = null;

  function setState(next) {
    state = next;
    stageEl.setAttribute('data-cine-state', next);
    emit({ type: 'state', state: next, sequence: sequence.id });
  }

  /* REDUCED MOTION IS DECIDED LIVE, and the media query is consulted FIRST and
     on its own. The defect this ordering exists to prevent already shipped
     here: a reduced-motion rule scoped to a class that is absent precisely when
     reduced motion is on. If the site's class is missing, the query still
     decides. */
  function motionIsOff() {
    try {
      if (matchMediaImpl('(prefers-reduced-motion: reduce)').matches) return true;
    } catch { /* matchMedia unavailable: fall through to the site's own signals */ }
    try {
      if (window.localStorage && window.localStorage.getItem('nv-motion') === 'off') return true;
    } catch { /* storage blocked */ }
    return document.documentElement.classList.contains('motion-off');
  }

  function applyReducedMotion() {
    if (degraded) return;
    /* Nothing scrubs. Each chapter shows its static keyframe, and the sticky
       stage stops being sticky so no dolly or large spatial transform remains.
       The rule that unsticks it is keyed on [data-cine-state="reduced"], an
       attribute THIS function sets, so it cannot be scoped to something absent
       when reduced motion is on. */
    if (canvas) { canvas.hidden = true; canvas.setAttribute('aria-hidden', 'true'); }
    /* One slot per chapter, authored into the served HTML inside that chapter's
       own section, exactly as assets/cinematic/cine-stage.css section 4
       describes. data-cine-keyframes is only set to "placed" when every chapter
       got an image, so a partial placement leaves the poster on screen rather
       than leaving a hole. */
    let placed = 0;
    for (const chapter of variant.chapters) {
      const slot = stageEl.querySelector(`[data-cine-chapter="${chapter.id}"]`);
      if (!slot) continue;
      if (!slot.querySelector('img[data-cine-keyframe]')) {
        const kf = keyframeForChapter(variant, chapter.id);
        const img = document.createElement('img');
        img.src = kf.src;
        img.alt = kf.alt;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.setAttribute('data-cine-keyframe', chapter.id);
        slot.appendChild(img);
      }
      placed += 1;
    }
    stageEl.setAttribute('data-cine-keyframes', placed === variant.chapters.length ? 'placed' : 'partial');
    setState('reduced');
  }

  function degrade(reason) {
    if (degraded) return; /* idempotent */
    degraded = true;
    if (watchdog !== null) { clearTimeout(watchdog); watchdog = null; }
    if (canvas) {
      canvas.hidden = true;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.pointerEvents = 'none';
    }
    if (sticky) sticky.style.pointerEvents = 'none';
    if (options.loaderRef && options.loaderRef.current) {
      try { options.loaderRef.current.destroy(); } catch { /* already gone */ }
    }
    emit({ type: 'degraded', reason, sequence: sequence.id });
    setState('degraded');
  }

  return {
    showPoster() { setState('poster'); },
    applyReducedMotion,
    degrade,
    /* "Never a loader forever" made mechanical: if prime() has not settled in
       primeTimeoutMs the layer degrades on its own, and a prime that settles
       with ok:false degrades immediately. */
    armWatchdog(primePromise) {
      watchdog = setTimeout(() => { watchdog = null; degrade('prime-timeout'); }, primeTimeoutMs);
      Promise.resolve(primePromise).then(
        (result) => {
          if (watchdog !== null) { clearTimeout(watchdog); watchdog = null; }
          if (result && result.ok === false) degrade('prime-failed');
          else if (!degraded && state === 'poster') setState('scrubbing');
        },
        () => {
          if (watchdog !== null) { clearTimeout(watchdog); watchdog = null; }
          degrade('prime-threw');
        },
      );
      return primePromise;
    },
    isDegraded() { return degraded; },
    /* The name the shipped fallback layer uses. index.js makes step 3's
       decision with the layer's own live computation rather than a fourth
       copy of it, and so does the reference mount below. */
    prefersReducedMotion: () => motionIsOff(),
    get state() { return state; },
  };
}

/* ========================================================================
   MOUNT
   Owns wiring, never their internals. The order below IS the LCP rule.
   ======================================================================== */
export async function mountCinematic(options = {}) {
  const manifestUrl = options.manifestUrl || '/assets/cinematic/manifest.json';
  const stageEls = Array.from(options.stages || document.querySelectorAll('[data-cine-stage]'));
  const emit = options.onDiagnostic || (() => {});

  /* A mutation test replaces exactly one collaborator with a byte copy of the
     shipped module carrying one changed line, served from /artifacts/cine-mutants/.
     The subject page validates the path and the guard helper refuses any run
     that loaded one unless NV_CINE_MUTANT is set. Nothing here writes to
     assets/cinematic: three sessions share this worktree. */
  const over = options.moduleOverrides || {};
  const loaderPick = await preferModule(over.loader || '/assets/cinematic/sequence-loader.js', 'createSequenceLoader', null);
  const stagePick = await preferModule(over.stage || '/assets/cinematic/scroll-stage.js', 'createScrollStage', createReferenceScrollStage);
  const fallbackPick = await preferModule(over.fallback || '/assets/cinematic/fallback.js', 'createFallbackLayer', createReferenceFallbackLayer);
  const sources = { loader: loaderPick.source, stage: stagePick.source, fallback: fallbackPick.source };
  if (typeof loaderPick.fn !== 'function') {
    throw new Error('mountCinematic: assets/cinematic/sequence-loader.js does not export createSequenceLoader, and there is no reference loader. Only that module may fetch.');
  }

  const stages = new Map();
  const handle = { stages, sources, destroy() {}, state() {} };

  /* 1. poster and copy are already painted from the served HTML. Nothing below
        this line blocks them. */
  let manifest;
  try {
    manifest = await loadManifest(manifestUrl);
  } catch (error) {
    /* 2. ON ANY ManifestError every stage degrades and this RESOLVES. It does
          not reject and it does not leave a spinner. */
    for (const el of stageEls) {
      const layer = fallbackPick.fn(el, { id: el.dataset.cineStage }, { chapters: [] }, { onDiagnostic: emit });
      layer.degrade('manifest-error');
      stages.set(el.dataset.cineStage, { stage: null, loader: null, fallback: layer });
    }
    emit({ type: 'manifest-error', error: String(error && error.message ? error.message : error) });
    return handle;
  }

  for (const el of stageEls) {
    const id = el.dataset.cineStage;
    /* 5. any stage that throws degrades on its own; one broken stage never
          takes the other two down. */
    try {
      const sequence = manifest.sequences.find((s) => s.id === id);
      if (!sequence) throw new Error(`manifest has no sequence '${id}'`);
      const { variant } = selectVariant(sequence);
      const loaderRef = { current: null };
      const fallback = fallbackPick.fn(el, sequence, variant, { onDiagnostic: emit, loaderRef });

      /* 3. reduced motion or motion off -> static keyframes and stop. No loader
            is created and NO FRAME IS FETCHED. */
      /* THE DECISION IS THE LAYER'S, NOT A COPY OF IT. Asking the fallback
         layer is what keeps this in step with the CSS switches; re-deriving it
         here would be the fourth statement of the same rule and the one that
         drifts. A layer that exposes neither name is a contract failure and is
         reported as one rather than defaulted past. */
      const decide = fallback.prefersReducedMotion || fallback.motionIsOff;
      if (typeof decide !== 'function') {
        throw new Error('the fallback layer exposes neither prefersReducedMotion() nor motionIsOff(), so reduced motion cannot be decided without re-deriving the rule');
      }
      if (decide.call(fallback)) {
        fallback.applyReducedMotion();
        stages.set(id, { stage: null, loader: null, fallback });
        continue;
      }

      const loader = loaderPick.fn(variant, { onDiagnostic: emit });
      loaderRef.current = loader;
      fallback.armWatchdog(loader.prime());
      const stage = stagePick.fn(el, sequence, variant, loader, {
        onDiagnostic: emit,
        onFatal: () => fallback.degrade('stage-fatal'),
      });
      stage.start();
      stages.set(id, { stage, loader, fallback, variant, sequence });
    } catch (error) {
      const layer = fallbackPick.fn(el, { id }, { chapters: [] }, { onDiagnostic: emit });
      layer.degrade('stage-error');
      stages.set(id, { stage: null, loader: null, fallback: layer });
      emit({ type: 'stage-error', sequence: id, error: String(error && error.message ? error.message : error) });
    }
  }

  handle.destroy = () => {
    for (const entry of stages.values()) {
      if (entry.stage) entry.stage.destroy();
      if (entry.loader) entry.loader.destroy();
    }
  };
  handle.state = () => {
    const out = {};
    for (const [id, entry] of stages) {
      out[id] = {
        state: entry.fallback.state,
        paintedIndex: entry.stage ? entry.stage.paintedIndex : null,
        running: entry.stage ? entry.stage.running : false,
      };
    }
    return out;
  };
  return handle;
}
