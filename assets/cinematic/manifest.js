/* The cinematic frame manifest: load, validate, and the two pieces of arithmetic
   every other module depends on.
   Schema and prose: docs/cinematic/frame-manifest.schema.json, docs/cinematic/API-CONTRACT.md

   THIS MODULE IS PART OF THE FOUNDATION. The loader, the stage and the fallback
   layer all import from it. None of them reimplements variant selection, URL
   resolution, or the progress to index mapping, because a second copy of that
   arithmetic is a copy that can agree with a bug.

   Browser ES module. Also imported directly by Node (package.json sets
   "type": "module"), so the guards validate with the same code the page runs. */

/** Canonical sequence ids, in ordinal order. Nothing else may hardcode this list. */
export const SEQUENCE_IDS = Object.freeze(['signal-to-system', 'system-to-outcomes', 'system-to-decision']);

/** Canonical variant names. Desktop and mobile are separate compositions, not crops. */
export const VARIANT_NAMES = Object.freeze(['desktop', 'mobile']);

/** The one legal fit. coverSamplePoints() in the guards assumes exactly this. */
export const FIT = 'cover';

export class ManifestError extends Error {
  constructor(reason, message, context) {
    super(`${reason}: ${message}`);
    this.name = 'ManifestError';
    this.reason = reason;
    this.context = context;
  }
}

/**
 * Scroll progress to an integer frame index. The single definition.
 *
 * Math.round, not floor: progress 1 must reach the final frame, and the mapping
 * must be symmetric so scrolling up retraces exactly the indices scrolling down
 * produced. Deterministic, no easing, no interpolation, no hysteresis.
 *
 * @param {number} progress 0..1 (values outside are clamped)
 * @param {number} frameCount
 * @returns {number} 0..frameCount-1
 */
export function frameIndexForProgress(progress, frameCount) {
  if (!Number.isInteger(frameCount) || frameCount < 1) {
    throw new ManifestError('bad-frame-count', `frameCount ${frameCount} is not a positive integer`);
  }
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.min(frameCount - 1, Math.max(0, Math.round(p * (frameCount - 1))));
}

/**
 * The ONLY way to turn a frame index into a URL.
 *
 * There is no pattern, no zero padding rule and no extension to get wrong,
 * because the manifest lists every frame URL explicitly. A renamed output
 * directory becomes a manifest that fails validation here, not a page that
 * quietly 404s every frame and shows a poster forever.
 */
export function frameUrl(variant, index) {
  if (!variant || !Array.isArray(variant.frames)) {
    throw new ManifestError('bad-variant', 'variant has no frames array');
  }
  if (!Number.isInteger(index) || index < 0 || index >= variant.frames.length) {
    throw new ManifestError('index-out-of-range', `frame ${index} is outside 0..${variant.frames.length - 1}`);
  }
  return variant.frames[index];
}

/**
 * Choose desktop or mobile by evaluating each variant's own media query.
 *
 * Throws when none or more than one matches. A silent default would be this
 * codebase's signature defect: the phone would quietly receive the landscape
 * sequence and every measurement of it would look fine.
 */
export function selectVariant(sequence, options = {}) {
  const mm = options.matchMedia
    || (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia.bind(window) : null);
  if (!mm) throw new ManifestError('no-match-media', 'matchMedia is unavailable and no override was passed');
  const matched = VARIANT_NAMES.filter((name) => {
    const v = sequence.variants[name];
    return v && mm(v.media).matches;
  });
  if (matched.length !== 1) {
    throw new ManifestError(
      'variant-selection',
      `${matched.length} variants match for '${sequence.id}' (${matched.join(', ') || 'none'}); the media queries must partition the viewport exactly`,
      { sequenceId: sequence.id },
    );
  }
  return { name: matched[0], variant: sequence.variants[matched[0]] };
}

/** Frames the reduced motion path shows for a chapter, resolved from the manifest. */
export function keyframeForChapter(variant, chapterId) {
  const k = (variant.reducedMotionKeyframes || []).find((x) => x.chapter === chapterId);
  if (!k) throw new ManifestError('missing-keyframe', `no reduced motion keyframe for chapter '${chapterId}'`);
  return k;
}

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isInt = (v) => Number.isInteger(v);

/**
 * Validate a parsed manifest. Throws ManifestError on the FIRST violation with a
 * reason code and enough context to fix it. Never returns a partially valid
 * object, and never repairs one: a manifest that is wrong must fail loudly at
 * load, not degrade into a page that scrubs the wrong sequence.
 *
 * @returns {object} the same object, frozen at the top level
 */
export function validateManifest(m, context = {}) {
  const where = context.sourceUrl ? ` (from ${context.sourceUrl})` : '';
  const bad = (reason, msg) => { throw new ManifestError(reason, msg + where, context); };

  if (!m || typeof m !== 'object') bad('not-an-object', 'manifest is not an object');
  if (m.schemaVersion !== 1) bad('schema-version', `schemaVersion is ${JSON.stringify(m.schemaVersion)}, expected 1`);
  if (m.kind !== 'placeholder' && m.kind !== 'production') bad('kind', `kind is ${JSON.stringify(m.kind)}, expected 'placeholder' or 'production'`);
  if (!Array.isArray(m.sequences) || m.sequences.length === 0) bad('sequences', 'sequences is empty or missing');

  const seenIds = new Set();
  for (const seq of m.sequences) {
    if (!isStr(seq.id)) bad('sequence-id', 'a sequence has no id');
    if (!SEQUENCE_IDS.includes(seq.id)) bad('sequence-id', `'${seq.id}' is not one of ${SEQUENCE_IDS.join(', ')}`);
    if (seenIds.has(seq.id)) bad('sequence-id', `'${seq.id}' appears more than once`);
    seenIds.add(seq.id);
    if (seq.ordinal !== SEQUENCE_IDS.indexOf(seq.id)) {
      bad('sequence-ordinal', `'${seq.id}' declares ordinal ${seq.ordinal}, canonical order says ${SEQUENCE_IDS.indexOf(seq.id)}`);
    }
    if (!isStr(seq.title)) bad('sequence-title', `'${seq.id}' has no title`);
    if (!Array.isArray(seq.sections) || seq.sections.length === 0) bad('sections', `'${seq.id}' spans no sections`);
    if (!seq.stage || seq.stage.fit !== FIT) bad('fit', `'${seq.id}' declares fit ${JSON.stringify(seq.stage && seq.stage.fit)}, only '${FIT}' is implemented`);
    if (!(seq.stage.scrollLengthVh > 100)) bad('scroll-length', `'${seq.id}' scrollLengthVh must exceed 100, got ${seq.stage.scrollLengthVh}`);
    if (!seq.variants || typeof seq.variants !== 'object') bad('variants', `'${seq.id}' has no variants`);

    for (const name of VARIANT_NAMES) {
      const v = seq.variants[name];
      const at = `'${seq.id}'.${name}`;
      if (!v) bad('variant-missing', `${at} is missing; desktop and mobile are both required and are separate compositions`);
      if (!isStr(v.media)) bad('variant-media', `${at} has no media query`);
      if (!isInt(v.width) || !isInt(v.height) || v.width < 64 || v.height < 64) bad('variant-size', `${at} has implausible dimensions ${v.width}x${v.height}`);
      if (!isInt(v.frameCount) || v.frameCount < 2) bad('frame-count', `${at} frameCount is ${v.frameCount}`);
      if (!Array.isArray(v.frames)) bad('frames', `${at} has no frames array`);
      if (v.frames.length !== v.frameCount) bad('frames-length', `${at} lists ${v.frames.length} frame urls but declares frameCount ${v.frameCount}`);
      if (!v.frames.every(isStr)) bad('frames-entry', `${at} has an empty or non string frame url`);
      if (new Set(v.frames).size !== v.frames.length) bad('frames-duplicate', `${at} lists the same frame url twice; a duplicate hides a generator that skipped a frame`);
      if (!v.poster || !isStr(v.poster.src) || typeof v.poster.alt !== 'string') bad('poster', `${at} has no poster src and alt`);
      if (!isInt(v.poster.frame) || v.poster.frame < 0 || v.poster.frame >= v.frameCount) bad('poster-frame', `${at} poster.frame ${v.poster.frame} is outside the sequence`);
      if (!v.fallback || !isStr(v.fallback.src) || typeof v.fallback.alt !== 'string') bad('fallback', `${at} has no fallback src and alt; a sequence with no fallback can only fail as a blank stage`);
      if (!Array.isArray(v.chapters) || v.chapters.length === 0) bad('chapters', `${at} has no chapters`);
      if (!Array.isArray(v.reducedMotionKeyframes) || v.reducedMotionKeyframes.length !== v.chapters.length) {
        bad('keyframes', `${at} has ${v.reducedMotionKeyframes ? v.reducedMotionKeyframes.length : 0} reduced motion keyframes for ${v.chapters.length} chapters; reduced motion shows one static keyframe per chapter`);
      }
      for (const c of v.chapters) {
        if (!isStr(c.id)) bad('chapter-id', `${at} has a chapter with no id`);
        if (!isInt(c.startFrame) || !isInt(c.endFrame) || c.startFrame > c.endFrame
          || c.startFrame < 0 || c.endFrame >= v.frameCount) {
          bad('chapter-range', `${at} chapter '${c.id}' range ${c.startFrame}..${c.endFrame} is not inside 0..${v.frameCount - 1}`);
        }
        if (!isInt(c.keyframe) || c.keyframe < c.startFrame || c.keyframe > c.endFrame) {
          bad('chapter-keyframe', `${at} chapter '${c.id}' keyframe ${c.keyframe} is outside its own range`);
        }
        if (!seq.sections.includes(c.section)) bad('chapter-section', `${at} chapter '${c.id}' claims section ${c.section}, which the sequence does not span`);
        if (!v.reducedMotionKeyframes.some((k) => k.chapter === c.id)) bad('keyframes', `${at} chapter '${c.id}' has no reduced motion keyframe`);
      }
      if (!Array.isArray(v.strides) || v.strides.length === 0) bad('strides', `${at} has no progressive loading strides`);
      if (!v.strides.every((s) => isInt(s) && s >= 1)) bad('strides', `${at} strides must be positive integers, got ${JSON.stringify(v.strides)}`);
      for (let i = 1; i < v.strides.length; i += 1) {
        if (v.strides[i] >= v.strides[i - 1]) bad('strides', `${at} strides must strictly decrease, got ${JSON.stringify(v.strides)}`);
      }
      if (v.strides[v.strides.length - 1] !== 1) bad('strides', `${at} strides must end at 1 or the sequence can never be complete, got ${JSON.stringify(v.strides)}`);
      if (!isInt(v.decodeWindow) || v.decodeWindow < 2) bad('decode-window', `${at} decodeWindow is ${v.decodeWindow}; a rolling window is required, not the whole sequence`);
      if (v.decodeWindow >= v.frameCount && v.frameCount > 32) bad('decode-window', `${at} decodeWindow ${v.decodeWindow} holds the whole ${v.frameCount} frame sequence in memory`);
    }
  }
  return Object.freeze(m);
}

/**
 * Fetch, parse and validate. Rejects with ManifestError; the caller degrades to
 * the fallback layer. It never resolves with an unvalidated object.
 */
export async function loadManifest(url, options = {}) {
  const doFetch = options.fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) throw new ManifestError('no-fetch', 'fetch is unavailable and no fetchImpl was passed');
  let res;
  try {
    res = await doFetch(url, { signal: options.signal, cache: 'force-cache' });
  } catch (err) {
    throw new ManifestError('network', `${url} could not be fetched: ${err && err.message}`, { url });
  }
  if (!res.ok) throw new ManifestError('http', `${url} returned ${res.status}`, { url, status: res.status });
  let parsed;
  try {
    parsed = await res.json();
  } catch (err) {
    throw new ManifestError('parse', `${url} is not valid JSON: ${err && err.message}`, { url });
  }
  return validateManifest(parsed, { sourceUrl: url });
}
