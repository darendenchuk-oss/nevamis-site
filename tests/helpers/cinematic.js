/* Guard helpers for the cinematic scroll stages.
   Contract: docs/cinematic/API-CONTRACT.md   Frame code: docs/cinematic/FRAME-CODE.md

   THE RULE THESE HELPERS EXIST TO ENFORCE
   No guard asks the engine which frame it is on. Every index assertion is made
   by sampling pixels off the canvas and decoding the frame's own identity. An
   engine that reports index 42 while painting index 7, or while painting into a
   300x150 default backing store, fails here rather than passing.

   PORT
   Serve on NV_PORT=3291 for this branch. assertServingThisWorktree() is not
   optional politeness: it is the difference between measuring this application
   and measuring a stranger's server that happened to own the port. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { codeGeometry, decodeCells, coverSamplePoints, CELL_COUNT } from '../../scripts/lib/frame-code.mjs';
import { frameIndexForProgress } from '../../assets/cinematic/manifest.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const SENTINEL_PATH = '/config/cinematic-build-sentinel.json';
export const PLACEHOLDER_MANIFEST_PATH = '/artifacts/cinematic-placeholders/manifest.json';

export const localSentinel = () =>
  JSON.parse(fs.readFileSync(path.join(root, 'config', 'cinematic-build-sentinel.json'), 'utf8'));

export function localPlaceholderManifest() {
  const p = path.join(root, 'artifacts', 'cinematic-placeholders', 'manifest.json');
  if (!fs.existsSync(p)) {
    throw new Error('no placeholder manifest on disk. Run: npm run cine:frames');
  }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Prove the server under test is THIS worktree, before any measurement is
 * believed. Two independent facts, both required:
 *   1. the branch sentinel token,
 *   2. the generatedAt of the placeholder manifest matching the one on disk.
 * The second pins the run to the frames this checkout actually generated, not
 * merely to some checkout of the same branch.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function assertServingThisWorktree(page) {
  const expected = localSentinel();
  const res = await page.request.get(SENTINEL_PATH);
  if (!res.ok()) {
    throw new Error(`sentinel ${SENTINEL_PATH} returned ${res.status()}. The server on this port is not this worktree. Start yours with: NV_PORT=${expected.port} node serve.js`);
  }
  let served;
  try {
    served = JSON.parse(await res.text());
  } catch {
    throw new Error(`sentinel ${SENTINEL_PATH} did not return JSON. serve.js answers unknown paths with index.html, so this port is serving a checkout that has no cinematic sentinel. Start yours with: NV_PORT=${expected.port} node serve.js`);
  }
  if (served.token !== expected.token) {
    throw new Error(`sentinel token mismatch: served '${served.token}', this worktree is '${expected.token}'. Every measurement from this run would describe a different application.`);
  }
  const manifestRes = await page.request.get(PLACEHOLDER_MANIFEST_PATH);
  if (!manifestRes.ok()) {
    throw new Error(`${PLACEHOLDER_MANIFEST_PATH} returned ${manifestRes.status()}. Run: npm run cine:frames`);
  }
  const servedManifest = JSON.parse(await manifestRes.text());
  const localManifest = localPlaceholderManifest();
  if (servedManifest.generatedAt !== localManifest.generatedAt) {
    throw new Error(`the served placeholder manifest was generated at ${servedManifest.generatedAt}, this checkout's at ${localManifest.generatedAt}. The port is answering from a different directory.`);
  }
  return { token: served.token, generatedAt: servedManifest.generatedAt };
}

/**
 * Canvas geometry, read from the page, with the backing store checked.
 *
 * A canvas measured while display:none reports a zero CSS box, and a backing
 * store left at the 300x150 default draws the page at a ninth of its resolution
 * with nothing in the console. That has already happened in this repository.
 * This throws instead.
 */
export async function canvasMetrics(page, selector) {
  const m = await page.evaluate((sel) => {
    const c = document.querySelector(sel);
    if (!c) return { missing: true };
    const r = c.getBoundingClientRect();
    return {
      backingWidth: c.width,
      backingHeight: c.height,
      cssWidth: r.width,
      cssHeight: r.height,
      dpr: window.devicePixelRatio,
      display: getComputedStyle(c).display,
      visibility: getComputedStyle(c).visibility,
    };
  }, selector);
  if (m.missing) throw new Error(`canvasMetrics: no element matches ${selector}`);
  if (m.cssWidth < 1 || m.cssHeight < 1) {
    throw new Error(`canvasMetrics: ${selector} has a ${m.cssWidth}x${m.cssHeight} CSS box (display ${m.display}, visibility ${m.visibility}). Nothing measured against it means anything.`);
  }
  if (m.backingWidth === 300 && m.backingHeight === 150) {
    throw new Error(`canvasMetrics: ${selector} backing store is still the 300x150 default while its CSS box is ${Math.round(m.cssWidth)}x${Math.round(m.cssHeight)}. The stage sized itself against a zero or unmeasured box and is drawing at the wrong resolution.`);
  }
  const expectedW = m.cssWidth * Math.min(2, m.dpr);
  if (Math.abs(m.backingWidth - expectedW) > Math.max(2, expectedW * 0.02)) {
    throw new Error(`canvasMetrics: ${selector} backing store is ${m.backingWidth}px wide but its CSS box is ${m.cssWidth.toFixed(1)}px at dpr ${m.dpr} (expected about ${expectedW.toFixed(0)}px).`);
  }
  return m;
}

/**
 * Read the frame index the canvas is ACTUALLY PAINTING, off its pixels.
 *
 * The sample points are computed here from the manifest's frame dimensions and
 * the canvas's own backing store size, assuming the centred cover fit the
 * contract mandates. The engine is not consulted. If it drew with a different
 * fit, at a different scale, or not at all, the samples land on artwork or on
 * nothing and this throws with the raw pixels rather than returning a number.
 *
 * @returns {{frameIndex:number, sequenceId:string, sequenceOrdinal:number, metrics:object}}
 */
export async function readCanvasFrame(page, selector, variant) {
  const metrics = await canvasMetrics(page, selector);
  const { points, scale, cellOnCanvas } = coverSamplePoints(
    variant.width, variant.height, metrics.backingWidth, metrics.backingHeight,
  );
  if (cellOnCanvas < 3) {
    throw new Error(`readCanvasFrame: a code cell is only ${cellOnCanvas.toFixed(1)}px on this canvas (scale ${scale.toFixed(3)}); the frame is drawn too small to read reliably.`);
  }
  const samples = await page.evaluate(({ sel, pts }) => {
    const c = document.querySelector(sel);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    return pts.map((p) => {
      if (p.x < 0 || p.y < 0 || p.x >= c.width || p.y >= c.height) return null;
      const d = ctx.getImageData(p.x, p.y, 1, 1).data;
      return [d[0], d[1], d[2], d[3]];
    });
  }, { sel: selector, pts: points });

  if (samples.length !== CELL_COUNT || samples.some((s) => s === null)) {
    throw new Error(`readCanvasFrame: ${samples.filter((s) => s === null).length} sample point(s) fell outside the ${metrics.backingWidth}x${metrics.backingHeight} backing store.`);
  }
  if (samples.every((s) => s[3] === 0)) {
    throw new Error(`readCanvasFrame: every sampled pixel is fully transparent. The canvas is sized but nothing has been drawn into it.`);
  }
  const res = decodeCells(samples.map((s) => [s[0], s[1], s[2]]));
  if (!res.ok) {
    throw new Error(
      `readCanvasFrame: ${res.reason} (${res.detail})\n`
      + `  canvas ${metrics.backingWidth}x${metrics.backingHeight}, frame ${variant.width}x${variant.height}, cover scale ${scale.toFixed(3)}\n`
      + `  sampled at ${JSON.stringify(points)}\n`
      + `  pixels ${JSON.stringify(samples)}\n`
      + `  If this manifest is 'production' there is no code strip and this is expected: index guards only apply to placeholder frames.`,
    );
  }
  return { ...res, metrics };
}

/**
 * What the frame index SHOULD be for the page's current scroll position,
 * computed from live geometry with the shared mapping. Independent of anything
 * the engine reports.
 */
export async function expectedFrameIndex(page, stageSelector, frameCount) {
  const geo = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { missing: true };
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    return { top, height: r.height, scrollY: window.scrollY, viewport: window.innerHeight };
  }, stageSelector);
  if (geo.missing) throw new Error(`expectedFrameIndex: no element matches ${stageSelector}`);
  const range = geo.height - geo.viewport;
  if (range <= 0) {
    throw new Error(`expectedFrameIndex: stage ${stageSelector} is ${geo.height}px tall in a ${geo.viewport}px viewport, so it has no scroll range and cannot drive a sequence.`);
  }
  const progress = (geo.scrollY - geo.top) / range;
  return { index: frameIndexForProgress(progress, frameCount), progress, geo };
}

/** Convenience: the placeholder manifest's variant record for a sequence. */
export function variantOf(manifest, sequenceId, variantName) {
  const seq = manifest.sequences.find((s) => s.id === sequenceId);
  if (!seq) throw new Error(`variantOf: manifest has no sequence '${sequenceId}'`);
  const v = seq.variants[variantName];
  if (!v) throw new Error(`variantOf: sequence '${sequenceId}' has no '${variantName}' variant`);
  return v;
}

/** The source-pixel geometry of the code strip, for debugging a failed read. */
export const sourceCodeGeometry = codeGeometry;
