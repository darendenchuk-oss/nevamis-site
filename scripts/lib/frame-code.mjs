/* NVFC1: the machine readable frame code carried by PLACEHOLDER cinematic frames.
   Full specification, including why it sits where it sits: docs/cinematic/FRAME-CODE.md

   WHY THIS EXISTS
   A guard that asks the scroll engine "which frame are you on?" and believes the
   answer proves nothing. The engine reporting index 42 while painting index 7,
   or painting nothing at all onto a 300x150 default backing store, is exactly
   this codebase's signature defect: a surface that reports success while doing
   nothing. So every placeholder frame carries its own identity in its pixels,
   and the guards read the identity back OFF THE CANVAS. The engine is never
   asked; it is measured.

   ONE SOURCE. The generator writes the code with encodeCells(); the tests read
   it with decodeCells(). Both call into this file. There is no second copy of
   the palette, the geometry, or the digit order to drift apart. */

/* Sequence identity and the progress mapping are NOT redefined here. They are
   imported from the module the page itself runs, so a guard and the site can
   never hold two versions of either. */
export { SEQUENCE_IDS, frameIndexForProgress } from '../../assets/cinematic/manifest.js';
import { SEQUENCE_IDS } from '../../assets/cinematic/manifest.js';

export const CODE_VERSION = 'NVFC1';

/* Ten cells: [START][seq][idx5][idx4][idx3][idx2][idx1][idx0][checksum][END] */
export const CELL_COUNT = 10;
export const INDEX_DIGITS = 6;          // base 4 -> 0..4095 addressable frames
export const INDEX_BASE = 4;
export const MAX_FRAME_INDEX = INDEX_BASE ** INDEX_DIGITS - 1;

/* Digit palette. Chosen so the closest pair of reference colours is 255 apart in
   RGB, which leaves 127 of slack for JPEG-free PNG scaling and canvas bilinear
   interpolation. Navy and mint (the site palette) are NOT usable here: they sit
   close together and would classify ambiguously after a downscale. */
export const DIGIT_RGB = [
  [255, 0, 0],      // 0 red
  [0, 255, 0],      // 1 green
  [0, 0, 255],      // 2 blue
  [255, 255, 255],  // 3 white
];
export const START_RGB = [255, 0, 255];  // magenta
export const END_RGB = [0, 255, 255];    // cyan

/* A sample further than this from EVERY reference colour is not a code cell.
   96 < 255/2, so a value inside the threshold can never be closer to the wrong
   reference than to the right one: accept and misread are mutually exclusive.
   Beyond it we report 'no-code', which is the honest answer for a real
   (non placeholder) frame rather than a fabricated index. */
export const CLASSIFY_MAX_DISTANCE = 96;

/** Cell edge length in SOURCE frame pixels. Never smaller than 8 so a heavy
 *  downscale still leaves several pixels to sample at the cell centre. */
export function cellSize(width, height) {
  return Math.max(8, Math.round(Math.min(width, height) / 24));
}

/**
 * Geometry of the code strip inside a source frame, in source pixel coordinates.
 *
 * The strip is centred on the frame, NOT tucked in a corner. Under the centred
 * `cover` fit the stage uses, the frame's centre point is the one point
 * guaranteed to survive any crop; a corner is the first thing lost.
 *
 * @returns {{cell:number,x0:number,y0:number,width:number,height:number,
 *            quiet:number,centres:Array<{x:number,y:number}>}}
 */
export function codeGeometry(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 64 || height < 64) {
    throw new Error(`codeGeometry: implausible frame size ${width}x${height}`);
  }
  const cell = cellSize(width, height);
  const stripW = cell * CELL_COUNT;
  const x0 = Math.round((width - stripW) / 2);
  const y0 = Math.round((height - cell) / 2);
  if (x0 < 0 || y0 < 0) throw new Error(`codeGeometry: strip ${stripW}px does not fit in ${width}x${height}`);
  const centres = [];
  for (let k = 0; k < CELL_COUNT; k += 1) {
    centres.push({ x: x0 + k * cell + cell / 2, y: y0 + cell / 2 });
  }
  return { cell, x0, y0, width: stripW, height: cell, quiet: Math.round(cell / 4), centres };
}

/** @returns {number[]} CELL_COUNT symbol ids: -1 = START, -2 = END, 0..3 = digit. */
export function encodeCells(sequenceOrdinal, frameIndex) {
  if (!Number.isInteger(sequenceOrdinal) || sequenceOrdinal < 0 || sequenceOrdinal >= INDEX_BASE) {
    throw new Error(`encodeCells: sequenceOrdinal ${sequenceOrdinal} outside 0..${INDEX_BASE - 1}`);
  }
  if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex > MAX_FRAME_INDEX) {
    throw new Error(`encodeCells: frameIndex ${frameIndex} outside 0..${MAX_FRAME_INDEX}`);
  }
  const digits = [];
  let rest = frameIndex;
  for (let d = INDEX_DIGITS - 1; d >= 0; d -= 1) {
    digits[d] = rest % INDEX_BASE;
    rest = Math.floor(rest / INDEX_BASE);
  }
  const checksum = (sequenceOrdinal + digits.reduce((a, b) => a + b, 0)) % INDEX_BASE;
  return [-1, sequenceOrdinal, ...digits, checksum, -2];
}

/** RGB triplet a cell must be painted, given its symbol id from encodeCells(). */
export function symbolRgb(symbol) {
  if (symbol === -1) return START_RGB;
  if (symbol === -2) return END_RGB;
  const rgb = DIGIT_RGB[symbol];
  if (!rgb) throw new Error(`symbolRgb: unknown symbol ${symbol}`);
  return rgb;
}

/** Nearest reference colour to a sampled pixel.
 *  @returns {{symbol:number|null,distance:number}} symbol null means 'no-code'. */
export function classifySample(rgb) {
  const refs = [[-1, START_RGB], [-2, END_RGB], ...DIGIT_RGB.map((c, i) => [i, c])];
  let best = null;
  let bestD = Infinity;
  for (const [symbol, ref] of refs) {
    const d = Math.hypot(rgb[0] - ref[0], rgb[1] - ref[1], rgb[2] - ref[2]);
    if (d < bestD) { bestD = d; best = symbol; }
  }
  return bestD > CLASSIFY_MAX_DISTANCE
    ? { symbol: null, distance: bestD }
    : { symbol: best, distance: bestD };
}

/**
 * Read a frame identity back out of CELL_COUNT sampled pixels.
 *
 * Never guesses. Every failure mode is named, and the samples are returned with
 * the failure so a red test says what the canvas actually held.
 *
 * @param {Array<[number,number,number]>} samples one RGB triplet per cell, in order
 * @returns {{ok:true,sequenceOrdinal:number,sequenceId:string,frameIndex:number,cells:number[],
 *            maxDistance:number}
 *          |{ok:false,reason:string,detail:string,samples:any[],cells:(number|null)[]}}
 */
export function decodeCells(samples) {
  const fail = (reason, detail, cells) => ({ ok: false, reason, detail, samples, cells: cells || [] });
  if (!Array.isArray(samples) || samples.length !== CELL_COUNT) {
    return fail('geometry', `expected ${CELL_COUNT} samples, got ${Array.isArray(samples) ? samples.length : typeof samples}`);
  }
  const classified = samples.map(classifySample);
  const cells = classified.map((c) => c.symbol);
  const maxDistance = Math.max(...classified.map((c) => c.distance));

  if (cells.every((c) => c === null)) {
    return fail('no-code', `no cell is within ${CLASSIFY_MAX_DISTANCE} of a code colour (nearest ${Math.min(...classified.map((c) => c.distance)).toFixed(1)}); this frame carries no NVFC1 strip`, cells);
  }
  if (cells[0] !== -1) return fail('bad-start', `cell 0 classified ${describe(cells[0])}, expected START`, cells);
  if (cells[CELL_COUNT - 1] !== -2) return fail('bad-end', `cell ${CELL_COUNT - 1} classified ${describe(cells[CELL_COUNT - 1])}, expected END`, cells);

  const payload = cells.slice(1, CELL_COUNT - 1);
  if (payload.some((c) => c === null || c < 0)) {
    return fail('bad-payload', `payload cells ${JSON.stringify(payload)} contain a sentinel or an unreadable cell`, cells);
  }
  const sequenceOrdinal = payload[0];
  const digits = payload.slice(1, 1 + INDEX_DIGITS);
  const checksum = payload[1 + INDEX_DIGITS];
  const expected = (sequenceOrdinal + digits.reduce((a, b) => a + b, 0)) % INDEX_BASE;
  if (checksum !== expected) {
    return fail('checksum', `checksum cell reads ${checksum}, payload implies ${expected}`, cells);
  }
  const frameIndex = digits.reduce((acc, d) => acc * INDEX_BASE + d, 0);
  const sequenceId = SEQUENCE_IDS[sequenceOrdinal] || null;
  if (!sequenceId) return fail('bad-sequence', `sequence ordinal ${sequenceOrdinal} has no id in SEQUENCE_IDS`, cells);
  return { ok: true, sequenceOrdinal, sequenceId, frameIndex, cells, maxDistance };
}

function describe(symbol) {
  if (symbol === -1) return 'START';
  if (symbol === -2) return 'END';
  if (symbol === null) return 'nothing (outside threshold)';
  return `digit ${symbol}`;
}

/**
 * Where the code strip lands after the stage draws the frame into the canvas
 * with a CENTRED COVER fit, expressed in canvas backing store pixels.
 *
 * Computed from the manifest's frame dimensions and the canvas's own reported
 * backing store size. It does NOT ask the engine where it drew. If the engine
 * used a different fit, or drew at the wrong scale, the samples land on artwork
 * and decodeCells() returns 'no-code' rather than a plausible wrong number.
 */
export function coverSamplePoints(frameWidth, frameHeight, canvasWidth, canvasHeight) {
  if (!(canvasWidth > 0) || !(canvasHeight > 0)) {
    throw new Error(`coverSamplePoints: canvas backing store is ${canvasWidth}x${canvasHeight}`);
  }
  const geo = codeGeometry(frameWidth, frameHeight);
  const scale = Math.max(canvasWidth / frameWidth, canvasHeight / frameHeight);
  const drawW = frameWidth * scale;
  const drawH = frameHeight * scale;
  const offX = (canvasWidth - drawW) / 2;
  const offY = (canvasHeight - drawH) / 2;
  return {
    scale,
    cellOnCanvas: geo.cell * scale,
    points: geo.centres.map((c) => ({
      x: Math.floor(offX + c.x * scale),
      y: Math.floor(offY + c.y * scale),
    })),
  };
}

