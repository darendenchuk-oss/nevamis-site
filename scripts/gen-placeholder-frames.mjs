/* Procedural PLACEHOLDER frames for the three cinematic scroll sequences.
   Run:  npm run cine:frames        (add --clean to wipe the output directory first)

   WHY THESE EXIST
   No approved sequence frames exist and none may be generated: there is a hard
   owner gate on paid generation. The machinery and its guards still have to be
   built and proved now, so these stand in. They are scaffolding, not art.

   WHAT MAKES THEM USEFUL
   Every frame carries its own identity in its pixels (NVFC1, see
   scripts/lib/frame-code.mjs and docs/cinematic/FRAME-CODE.md). A guard scrolls
   the page, samples ten pixels off the canvas, and recovers the integer index of
   the frame that is ACTUALLY PAINTED. The engine is never asked what it drew.
   That is the whole point: a test that trusts the engine's own reported index
   would pass against an engine that paints nothing.

   OUTPUT lands in artifacts/cinematic-placeholders/, which is already gitignored
   and already Jekyll excluded, so nothing here is committed or published.

   This script verifies its own output before it exits. See selfTest() below. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEQUENCE_IDS, CODE_VERSION, CELL_COUNT,
  codeGeometry, encodeCells, symbolRgb, decodeCells,
  coverSamplePoints,
} from './lib/frame-code.mjs';
import { encodePng, decodePng, pixelAt } from './lib/png.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'artifacts', 'cinematic-placeholders');
const URL_BASE = '/artifacts/cinematic-placeholders';
const CONFIG = JSON.parse(fs.readFileSync(path.join(root, 'config', 'cinematic-sequences.json'), 'utf8'));

/* Placeholder frames are deliberately smaller than the production targets in
   config/cinematic-sequences.json. Aspect ratio is preserved so cover fit
   behaves identically; only the pixel budget is cut. The manifest records THESE
   dimensions, and the loader reads dimensions from the manifest, so nothing
   downstream has a production size baked in. */
const PLACEHOLDER_SIZE = {
  desktop: { width: 960, height: 540 },
  mobile: { width: 540, height: 960 },
};

/* Low end of the directive's per sequence targets. Enough to exercise a rolling
   window and a stride ladder without paying for frames nobody looks at. */
const FRAME_COUNT = {
  'signal-to-system': { desktop: 96, mobile: 64 },
  'system-to-outcomes': { desktop: 120, mobile: 72 },
  'system-to-decision': { desktop: 84, mobile: 56 },
};

/* Progressive loading ladder. Pass 1 lands every 16th frame so any scroll
   position has something within 16 of it; later passes fill in. Ends at 1. */
const STRIDES = [16, 4, 1];
/* Decoded frames held at once. A rolling window, not the whole sequence. */
const DECODE_WINDOW = 24;

// ── NEVAMIS palette, read from home.html's :root ────────────────────────────
const NAVY = [0x0b, 0x16, 0x20];
const NAVY_0 = [0x02, 0x08, 0x0d];
const NAVY_3 = [0x10, 0x22, 0x2e];
const EMERALD = [0x2f, 0xbf, 0x8f];
const EMERALD_MID = [0x1e, 0x8e, 0x6d];
const MINT = [0x9f, 0xf0, 0xce];
const WARM = [0xf0, 0xb4, 0x62];
const CHAPTER_TINT = [EMERALD, MINT, WARM, EMERALD_MID];

// ── raster helpers ──────────────────────────────────────────────────────────
function newImage(width, height) {
  return { width, height, data: new Uint8Array(width * height * 3) };
}
function fillRect(img, x, y, w, h, rgb) {
  const x0 = Math.max(0, Math.round(x));
  const y0 = Math.max(0, Math.round(y));
  const x1 = Math.min(img.width, Math.round(x + w));
  const y1 = Math.min(img.height, Math.round(y + h));
  for (let yy = y0; yy < y1; yy += 1) {
    let i = (yy * img.width + x0) * 3;
    for (let xx = x0; xx < x1; xx += 1) {
      img.data[i] = rgb[0]; img.data[i + 1] = rgb[1]; img.data[i + 2] = rgb[2];
      i += 3;
    }
  }
}
const lerpRgb = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

/* 5x7 glyphs. Only the characters the readout uses. A human staring at a
   placeholder frame should be able to read its number without a decoder. */
const GLYPHS = {
  '0': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '11110', '10001', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  M: ['10001', '11011', '10101', '10001', '10001', '10001', '10001'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
function drawText(img, text, x, y, scale, rgb) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const glyph = GLYPHS[ch];
    if (!glyph) throw new Error(`drawText: no glyph for ${JSON.stringify(ch)}`);
    for (let ry = 0; ry < glyph.length; ry += 1) {
      for (let rx = 0; rx < glyph[ry].length; rx += 1) {
        if (glyph[ry][rx] === '1') fillRect(img, cx + rx * scale, y + ry * scale, scale, scale, rgb);
      }
    }
    cx += 6 * scale;
  }
}

/* The code strip. Painted LAST on every frame so no artwork can ever sit on top
   of it, surrounded by a black quiet zone so a downscale cannot blend a
   neighbouring colour into a cell centre. */
function drawFrameCode(img, sequenceOrdinal, frameIndex) {
  const geo = codeGeometry(img.width, img.height);
  fillRect(img, geo.x0 - geo.quiet, geo.y0 - geo.quiet,
    geo.width + geo.quiet * 2, geo.height + geo.quiet * 2, [0, 0, 0]);
  const cells = encodeCells(sequenceOrdinal, frameIndex);
  for (let k = 0; k < CELL_COUNT; k += 1) {
    fillRect(img, geo.x0 + k * geo.cell, geo.y0, geo.cell, geo.cell, symbolRgb(cells[k]));
  }
  return geo;
}

/**
 * One placeholder frame. Cheap on purpose: a gradient, three rectangles, a
 * numeric readout, and the code strip.
 */
function renderFrame({ width, height, sequence, variant, frameIndex, frameCount, chapters }) {
  const img = newImage(width, height);
  const p = frameCount > 1 ? frameIndex / (frameCount - 1) : 0;

  for (let y = 0; y < height; y += 1) {
    fillRect(img, 0, y, width, 1, lerpRgb(NAVY_0, NAVY_3, y / Math.max(1, height - 1)));
  }

  // Chapter band across the top: which chapter of the sequence this frame is in.
  const chapterIndex = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
  fillRect(img, 0, 0, width, Math.round(height * 0.06), CHAPTER_TINT[chapterIndex % CHAPTER_TINT.length]);

  // The moving element. Sweeps top to bottom across the sequence, so a human
  // flicking through the directory sees motion and a stuck frame is obvious.
  const barH = Math.max(4, Math.round(height * 0.035));
  const barY = Math.round((height - barH) * p);
  fillRect(img, 0, barY, width, barH, EMERALD);
  fillRect(img, 0, barY + barH, width, Math.max(1, Math.round(barH * 0.25)), NAVY);

  // Progress rail down the left edge.
  const railW = Math.max(6, Math.round(width * 0.014));
  fillRect(img, 0, 0, railW, height, NAVY);
  fillRect(img, 0, 0, railW, Math.round(height * p), MINT);

  const letter = 'ABC'[sequence.ordinal] || '0';
  const scale = Math.max(2, Math.round(Math.min(width, height) / 90));
  drawText(img, `${letter}${variant === 'desktop' ? 'D' : 'M'} ${pad4(frameIndex)}/${pad4(frameCount)}`,
    railW + scale * 4, Math.round(height * 0.06) + scale * 4, scale, MINT);

  drawFrameCode(img, sequence.ordinal, frameIndex);
  return img;
}

const pad4 = (n) => String(n).padStart(4, '0');

// ── manifest assembly ───────────────────────────────────────────────────────
function chapterRanges(chapters, frameCount) {
  return chapters.map((c, i) => {
    const startFrame = Math.round((i / chapters.length) * (frameCount - 1));
    const endFrame = Math.round(((i + 1) / chapters.length) * (frameCount - 1));
    return {
      id: c.id,
      label: c.label,
      section: c.section,
      startFrame,
      endFrame: Math.max(startFrame, endFrame),
      keyframe: Math.round((startFrame + Math.max(startFrame, endFrame)) / 2),
    };
  });
}

function main() {
  const clean = process.argv.includes('--clean');
  if (clean && fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const written = [];
  const manifest = {
    schemaVersion: 1,
    kind: 'placeholder',
    codeVersion: CODE_VERSION,
    generatedBy: 'scripts/gen-placeholder-frames.mjs',
    generatedAt: new Date().toISOString(),
    note: 'PLACEHOLDER frames. Procedurally generated, never approved, never published. Each frame carries an NVFC1 code strip at its centre so guards can read the painted frame index back off the canvas.',
    sequences: [],
  };

  for (const seq of CONFIG.sequences) {
    if (SEQUENCE_IDS[seq.ordinal] !== seq.id) {
      throw new Error(`config/cinematic-sequences.json: ordinal ${seq.ordinal} is '${seq.id}' but SEQUENCE_IDS says '${SEQUENCE_IDS[seq.ordinal]}'`);
    }
    const seqOut = { id: seq.id, ordinal: seq.ordinal, title: seq.title, sections: seq.sections, stage: seq.stage, variants: {} };

    for (const variant of ['desktop', 'mobile']) {
      const { width, height } = PLACEHOLDER_SIZE[variant];
      const frameCount = FRAME_COUNT[seq.id][variant];
      const range = seq.frameCountRange[variant];
      if (frameCount < range[0] || frameCount > range[1]) {
        throw new Error(`${seq.id}/${variant}: ${frameCount} frames is outside the directive range ${range[0]}..${range[1]}`);
      }
      const dir = path.join(OUT_DIR, seq.id, variant);
      fs.mkdirSync(dir, { recursive: true });

      const chapters = chapterRanges(seq.chapters, frameCount);
      const frames = [];
      let bytesTotal = 0;
      for (let i = 0; i < frameCount; i += 1) {
        const img = renderFrame({ width, height, sequence: seq, variant, frameIndex: i, frameCount, chapters: seq.chapters });
        const png = encodePng(img, { level: 6 });
        const file = `f${pad4(i)}.png`;
        fs.writeFileSync(path.join(dir, file), png);
        bytesTotal += png.length;
        frames.push(`${URL_BASE}/${seq.id}/${variant}/${file}`);
        written.push({ seq, variant, frameIndex: i, frameCount, width, height, abs: path.join(dir, file) });
      }

      // Poster: a real frame of the sequence, carrying its own code, so a guard
      // can prove the poster is painted rather than assume a blank canvas is one.
      const posterFrame = chapters[0].keyframe;
      copyFrame(dir, posterFrame, 'poster.png');
      const keyframes = chapters.map((c) => {
        const name = `key-${c.id}.png`;
        copyFrame(dir, c.keyframe, name);
        return { chapter: c.id, section: c.section, frame: c.keyframe, src: `${URL_BASE}/${seq.id}/${variant}/${name}`, alt: `${seq.title}: ${c.label}` };
      });

      seqOut.variants[variant] = {
        media: CONFIG.variants[variant].media,
        orientation: CONFIG.variants[variant].orientation,
        width,
        height,
        frameCount,
        frames,
        poster: { src: `${URL_BASE}/${seq.id}/${variant}/poster.png`, frame: posterFrame, alt: `${seq.title}: ${seq.chapters[0].label}` },
        reducedMotionKeyframes: keyframes,
        fallback: { src: `${URL_BASE}/${seq.id}/${variant}/poster.png`, alt: `${seq.title}: ${seq.chapters[0].label}` },
        chapters,
        strides: STRIDES,
        decodeWindow: DECODE_WINDOW,
        bytesTotal,
      };
      process.stdout.write(`  ${seq.id}/${variant}: ${frameCount} frames, ${width}x${height}, ${(bytesTotal / 1024 / 1024).toFixed(2)} MB\n`);
    }
    manifest.sequences.push(seqOut);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`\nmanifest: ${path.join(OUT_DIR, 'manifest.json')}\n`);
  return { manifest, written };
}

function copyFrame(dir, frameIndex, name) {
  fs.copyFileSync(path.join(dir, `f${pad4(frameIndex)}.png`), path.join(dir, name));
}

// ── self test ───────────────────────────────────────────────────────────────
/* Bilinear cover resample, the operation drawImage performs when it fits a frame
   into a canvas of a different size. Running the decode through it here proves
   the code strip survives the real transform rather than only surviving a
   pixel perfect read. */
function resampleCover(img, outW, outH) {
  const scale = Math.max(outW / img.width, outH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const offX = (outW - drawW) / 2;
  const offY = (outH - drawH) / 2;
  const out = newImage(outW, outH);
  for (let y = 0; y < outH; y += 1) {
    const sy = Math.min(img.height - 1, Math.max(0, (y - offY) / scale));
    const y0 = Math.floor(sy); const y1 = Math.min(img.height - 1, y0 + 1); const fy = sy - y0;
    for (let x = 0; x < outW; x += 1) {
      const sx = Math.min(img.width - 1, Math.max(0, (x - offX) / scale));
      const x0 = Math.floor(sx); const x1 = Math.min(img.width - 1, x0 + 1); const fx = sx - x0;
      const o = (y * outW + x) * 3;
      for (let c = 0; c < 3; c += 1) {
        const a = img.data[(y0 * img.width + x0) * 3 + c];
        const b = img.data[(y0 * img.width + x1) * 3 + c];
        const d = img.data[(y1 * img.width + x0) * 3 + c];
        const e = img.data[(y1 * img.width + x1) * 3 + c];
        out.data[o + c] = Math.round((a * (1 - fx) + b * fx) * (1 - fy) + (d * (1 - fx) + e * fx) * fy);
      }
    }
  }
  return out;
}

function selfTest({ manifest, written }) {
  const failures = [];
  let checked = 0;

  // 1. Every URL the manifest lists must exist on disk with real bytes. The
  //    loader is contractually forbidden from constructing a URL, so a manifest
  //    that names a file nobody wrote is a 404 at runtime with no fallback path.
  for (const seq of manifest.sequences) {
    for (const [variant, v] of Object.entries(seq.variants)) {
      const urls = [...v.frames, v.poster.src, v.fallback.src, ...v.reducedMotionKeyframes.map((k) => k.src)];
      if (v.frames.length !== v.frameCount) {
        failures.push(`${seq.id}/${variant}: frames[] has ${v.frames.length} entries but frameCount is ${v.frameCount}`);
      }
      for (const url of urls) {
        const abs = path.join(root, url.replace(/^\//, ''));
        const st = fs.existsSync(abs) ? fs.statSync(abs) : null;
        if (!st || st.size === 0) failures.push(`${seq.id}/${variant}: manifest lists ${url} but ${st ? 'it is empty' : 'no such file'}`);
        else checked += 1;
      }
    }
  }

  // 2. A sample of written frames must decode to the index they were written as,
  //    read straight out of the PNG.
  const sample = [];
  for (const seq of manifest.sequences) {
    for (const variant of ['desktop', 'mobile']) {
      const group = written.filter((w) => w.seq.id === seq.id && w.variant === variant);
      const n = group.length;
      for (const i of [0, 1, Math.floor(n / 3), Math.floor(n / 2), n - 2, n - 1]) {
        if (group[i]) sample.push(group[i]);
      }
    }
  }
  for (const w of sample) {
    const img = decodePng(fs.readFileSync(w.abs));
    const geo = codeGeometry(img.width, img.height);
    const res = decodeCells(geo.centres.map((c) => pixelAt(img, c.x, c.y)));
    if (!res.ok) failures.push(`${path.relative(root, w.abs)}: decode failed (${res.reason}: ${res.detail})`);
    else if (res.frameIndex !== w.frameIndex) failures.push(`${path.relative(root, w.abs)}: decoded frame ${res.frameIndex}, written as ${w.frameIndex}`);
    else if (res.sequenceId !== w.seq.id) failures.push(`${path.relative(root, w.abs)}: decoded sequence '${res.sequenceId}', written as '${w.seq.id}'`);
    else checked += 1;
  }

  // 3. The same frames must still decode AFTER a bilinear cover resample into a
  //    canvas of a different size and a different aspect ratio, sampled through
  //    coverSamplePoints. This is the browser guard's exact operation.
  const canvases = [[1440, 810], [800, 450], [1200, 900], [420, 780]];
  for (const w of sample.slice(0, 12)) {
    const img = decodePng(fs.readFileSync(w.abs));
    for (const [cw, ch] of canvases) {
      const resampled = resampleCover(img, cw, ch);
      const { points } = coverSamplePoints(img.width, img.height, cw, ch);
      let res;
      try {
        res = decodeCells(points.map((pt) => pixelAt(resampled, pt.x, pt.y)));
      } catch (err) {
        failures.push(`${path.relative(root, w.abs)} at ${cw}x${ch}: ${err.message}`);
        continue;
      }
      if (!res.ok) failures.push(`${path.relative(root, w.abs)} at ${cw}x${ch}: decode failed (${res.reason}: ${res.detail})`);
      else if (res.frameIndex !== w.frameIndex) failures.push(`${path.relative(root, w.abs)} at ${cw}x${ch}: decoded ${res.frameIndex}, expected ${w.frameIndex}`);
      else checked += 1;
    }
  }

  // 4. A frame with NO code strip must report 'no-code', not a number. Without
  //    this the decoder is free to invent an index for a production frame and
  //    every downstream guard would be reading fiction.
  {
    const blank = newImage(960, 540);
    fillRect(blank, 0, 0, 960, 540, NAVY);
    const geo = codeGeometry(960, 540);
    const res = decodeCells(geo.centres.map((c) => pixelAt(blank, c.x, c.y)));
    if (res.ok) failures.push(`a frame with no code strip decoded as frame ${res.frameIndex}; the decoder invents indices`);
    else if (res.reason !== 'no-code') failures.push(`a frame with no code strip failed as '${res.reason}', expected 'no-code'`);
    else checked += 1;
  }

  return { failures, checked };
}

// ── run ─────────────────────────────────────────────────────────────────────
process.stdout.write('generating placeholder cinematic frames\n\n');
const result = main();
process.stdout.write('\nself test\n');
const { failures, checked } = selfTest(result);
if (failures.length) {
  for (const f of failures) process.stderr.write(`  FAIL ${f}\n`);
  process.stderr.write(`\n${failures.length} failure(s) after ${checked} passing assertion(s). Frames on disk are NOT trustworthy.\n`);
  process.exitCode = 1;
} else if (checked === 0) {
  // A self test that asserted nothing is the failure this repo keeps producing.
  process.stderr.write('\nFAIL: the self test made zero assertions.\n');
  process.exitCode = 1;
} else {
  process.stdout.write(`  ${checked} assertions passed (existence, exact decode, decode after cover resample at four canvas sizes, and no-code detection).\n`);
}
