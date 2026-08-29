/* The cinematic contract guard.
   Run:  npm run cine:check

   Three agents implement the loader, the stage and the fallback layer in
   parallel without talking to each other. This is the thing that notices when
   one of them renames an export, when the written schema and the runtime
   validator drift apart, or when the placeholder manifest points at files
   nobody wrote.

   IT MUST NOT BE ABLE TO PASS WHILE DOING NOTHING. It counts its assertions and
   fails if it made none. The schema/validator agreement is not checked by
   comparing two hand written lists: it deletes each key the schema marks
   required from a copy of the example manifest and requires the runtime
   validator to reject it. A key the schema demands and the validator ignores is
   therefore a failure, not a comment nobody reads. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEQUENCE_IDS, VARIANT_NAMES, FIT,
  validateManifest, frameIndexForProgress, frameUrl, selectVariant,
} from '../assets/cinematic/manifest.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const pending = [];
let assertions = 0;

const ok = (label) => { assertions += 1; void label; };
const fail = (msg) => { failures.push(msg); };
function check(condition, msg) { if (condition) ok(msg); else fail(msg); }
function throws(fn, msg) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  check(threw, msg);
}

const read = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));

// ── 1. sequence identity ────────────────────────────────────────────────────
const config = read('config/cinematic-sequences.json');
check(config.sequences.length === SEQUENCE_IDS.length,
  `config declares ${config.sequences.length} sequences, SEQUENCE_IDS has ${SEQUENCE_IDS.length}`);
for (const seq of config.sequences) {
  check(SEQUENCE_IDS[seq.ordinal] === seq.id,
    `config sequence ordinal ${seq.ordinal} is '${seq.id}' but SEQUENCE_IDS[${seq.ordinal}] is '${SEQUENCE_IDS[seq.ordinal]}'`);
  check(seq.stage.fit === FIT, `config sequence '${seq.id}' declares fit '${seq.stage.fit}', only '${FIT}' is implemented`);
  for (const c of seq.chapters) {
    check(seq.sections.includes(c.section),
      `config sequence '${seq.id}' chapter '${c.id}' claims section ${c.section}, which the sequence does not span`);
  }
  for (const v of VARIANT_NAMES) {
    const r = seq.frameCountRange[v];
    check(Array.isArray(r) && r.length === 2 && r[0] <= r[1],
      `config sequence '${seq.id}' has no usable ${v} frameCountRange`);
  }
  const dims = [config.variants.desktop.production, config.variants.mobile.production];
  check(dims[0].width !== dims[1].width || dims[0].height !== dims[1].height,
    'desktop and mobile production dimensions are identical; they are separate compositions, not a crop');
}

// ── 2. written schema and runtime validator agree ───────────────────────────
const schema = read('docs/cinematic/frame-manifest.schema.json');
const example = read('docs/cinematic/frame-manifest.example.json');

check(JSON.stringify(schema.$defs.sequence.properties.id.enum) === JSON.stringify([...SEQUENCE_IDS]),
  `schema sequence id enum ${JSON.stringify(schema.$defs.sequence.properties.id.enum)} does not match SEQUENCE_IDS ${JSON.stringify([...SEQUENCE_IDS])}`);
check(schema.$defs.sequence.properties.stage.properties.fit.const === FIT,
  `schema fit const is '${schema.$defs.sequence.properties.stage.properties.fit.const}', FIT is '${FIT}'`);
check(JSON.stringify(schema.$defs.sequence.properties.variants.required) === JSON.stringify([...VARIANT_NAMES]),
  'schema requires different variant names than VARIANT_NAMES');

try {
  validateManifest(clone(example), { sourceUrl: 'docs/cinematic/frame-manifest.example.json' });
  ok('example manifest validates');
} catch (err) {
  fail(`the example manifest does not validate: ${err.message}`);
}

for (const key of schema.required) {
  const m = clone(example);
  delete m[key];
  throws(() => validateManifest(m), `schema marks top level '${key}' required but validateManifest accepts a manifest without it`);
}
for (const key of schema.$defs.sequence.required) {
  const m = clone(example);
  delete m.sequences[0][key];
  throws(() => validateManifest(m), `schema marks sequence.'${key}' required but validateManifest accepts a sequence without it`);
}
for (const key of schema.$defs.variant.required) {
  for (const v of VARIANT_NAMES) {
    const m = clone(example);
    delete m.sequences[0].variants[v][key];
    throws(() => validateManifest(m), `schema marks variant.'${key}' required but validateManifest accepts a ${v} variant without it`);
  }
}

// A handful of rules the schema cannot express, asserted directly so a future
// loosening of the validator is caught here rather than in production.
{
  const m = clone(example);
  m.sequences[0].variants.desktop.frames.pop();
  throws(() => validateManifest(m), 'validateManifest accepts frames.length not equal to frameCount');
}
{
  const m = clone(example);
  m.sequences[0].variants.desktop.frames[2] = m.sequences[0].variants.desktop.frames[1];
  throws(() => validateManifest(m), 'validateManifest accepts a duplicated frame url');
}
{
  const m = clone(example);
  m.sequences[0].variants.desktop.strides = [8, 4, 2];
  throws(() => validateManifest(m), 'validateManifest accepts a stride ladder that never reaches 1');
}
{
  const m = clone(example);
  delete m.sequences[0].variants.mobile;
  throws(() => validateManifest(m), 'validateManifest accepts a sequence with no mobile variant');
}
{
  const m = clone(example);
  m.sequences[0].variants.desktop.reducedMotionKeyframes.pop();
  throws(() => validateManifest(m), 'validateManifest accepts fewer reduced motion keyframes than chapters');
}
{
  const m = clone(example);
  m.sequences[0].stage.fit = 'contain';
  throws(() => validateManifest(m), "validateManifest accepts a fit other than 'cover'");
}

// ── 3. url resolution and variant selection never guess ─────────────────────
{
  const v = example.sequences[0].variants.desktop;
  check(frameUrl(v, 0) === v.frames[0] && frameUrl(v, v.frameCount - 1) === v.frames[v.frameCount - 1],
    'frameUrl does not return the manifest entry');
  throws(() => frameUrl(v, v.frameCount), 'frameUrl invents a url past the end of the sequence');
  throws(() => frameUrl(v, -1), 'frameUrl invents a url before the start of the sequence');
}
{
  const seq = example.sequences[0];
  const pick = (matches) => selectVariant(seq, { matchMedia: (q) => ({ matches: matches(q) }) });
  check(pick((q) => q.includes('min-width')).name === 'desktop', 'selectVariant does not pick desktop for the desktop query');
  check(pick((q) => q.includes('max-width')).name === 'mobile', 'selectVariant does not pick mobile for the mobile query');
  throws(() => pick(() => false), 'selectVariant silently defaults when no variant matches');
  throws(() => pick(() => true), 'selectVariant silently picks one when both variants match');
}

// ── 4. the progress mapping ─────────────────────────────────────────────────
{
  const n = 97;
  check(frameIndexForProgress(0, n) === 0, 'progress 0 does not map to frame 0');
  check(frameIndexForProgress(1, n) === n - 1, `progress 1 does not map to frame ${n - 1}`);
  check(frameIndexForProgress(-5, n) === 0 && frameIndexForProgress(5, n) === n - 1,
    'the mapping does not clamp outside 0..1');
  let monotone = true;
  let last = -1;
  const forward = [];
  for (let i = 0; i <= 1000; i += 1) {
    const idx = frameIndexForProgress(i / 1000, n);
    if (idx < last) monotone = false;
    last = idx;
    forward.push(idx);
  }
  check(monotone, 'the mapping is not monotonic in progress');
  check(new Set(forward).size === n, `the mapping reaches ${new Set(forward).size} of ${n} frames across a full scroll`);
  let symmetric = true;
  for (let i = 0; i <= 1000; i += 1) {
    if (frameIndexForProgress((1000 - i) / 1000, n) !== forward[1000 - i]) symmetric = false;
  }
  check(symmetric, 'scrolling up does not retrace the indices scrolling down produced');
  throws(() => frameIndexForProgress(0.5, 0), 'the mapping accepts a frameCount of 0');
}

// ── 5. the generated placeholder manifest ───────────────────────────────────
const placeholderPath = path.join(root, 'artifacts', 'cinematic-placeholders', 'manifest.json');
if (!fs.existsSync(placeholderPath)) {
  pending.push('no placeholder manifest on disk. Run: npm run cine:frames');
} else {
  const pm = read('artifacts/cinematic-placeholders/manifest.json');
  try {
    validateManifest(clone(pm), { sourceUrl: placeholderPath });
    ok('placeholder manifest validates');
  } catch (err) {
    fail(`the generated placeholder manifest does not validate: ${err.message}`);
  }
  check(pm.kind === 'placeholder', `the generated manifest declares kind '${pm.kind}'`);
  check(pm.sequences.length === SEQUENCE_IDS.length, `the generated manifest has ${pm.sequences.length} sequences, expected ${SEQUENCE_IDS.length}`);
  let missing = 0;
  let listed = 0;
  for (const seq of pm.sequences) {
    const cfg = config.sequences.find((s) => s.id === seq.id);
    for (const name of VARIANT_NAMES) {
      const v = seq.variants[name];
      const range = cfg.frameCountRange[name];
      check(v.frameCount >= range[0] && v.frameCount <= range[1],
        `${seq.id}/${name} has ${v.frameCount} frames, outside the directive range ${range[0]}..${range[1]}`);
      for (const url of [...v.frames, v.poster.src, v.fallback.src, ...v.reducedMotionKeyframes.map((k) => k.src)]) {
        listed += 1;
        const abs = path.join(root, url.replace(/^\//, ''));
        if (!fs.existsSync(abs) || fs.statSync(abs).size === 0) { missing += 1; fail(`${seq.id}/${name} manifest lists ${url} but no file is there`); }
      }
    }
    const dtop = seq.variants.desktop;
    const mob = seq.variants.mobile;
    check(dtop.width !== mob.width || dtop.height !== mob.height,
      `${seq.id}: desktop and mobile share dimensions ${dtop.width}x${dtop.height}; mobile must be its own composition`);
    check(dtop.frameCount !== mob.frameCount,
      `${seq.id}: desktop and mobile declare the same frame count, which suggests one was derived from the other`);
  }
  if (missing === 0 && listed > 0) ok(`all ${listed} listed files exist`);
}

// ── 6. implementation module surface ────────────────────────────────────────
/* The contract, expressed as code. When an agent renames an export, this is the
   thing that says so, before three branches try to merge. */
const MODULES = {
  'assets/cinematic/manifest.js': ['SEQUENCE_IDS', 'VARIANT_NAMES', 'FIT', 'ManifestError', 'frameIndexForProgress', 'frameUrl', 'selectVariant', 'keyframeForChapter', 'validateManifest', 'loadManifest'],
  // residencyBudget / anchorIndices / DEFAULT_MAX_CONCURRENT are the loading
  // policy's arithmetic, exported so scripts/check-cinematic-loader.mjs can
  // assert the caps directly rather than infer them from behaviour.
  'assets/cinematic/sequence-loader.js': ['createSequenceLoader', 'residencyBudget', 'anchorIndices', 'DEFAULT_MAX_CONCURRENT'],
  'assets/cinematic/scroll-stage.js': ['createScrollStage'],
  'assets/cinematic/fallback.js': ['createFallbackLayer'],
  'assets/cinematic/index.js': ['mountCinematic'],
};
for (const [rel, expected] of Object.entries(MODULES)) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) { pending.push(`${rel} is not written yet (expects: ${expected.join(', ')})`); continue; }
  let mod;
  try {
    mod = await import(`file://${abs.replace(/\\/g, '/')}`);
  } catch (err) {
    fail(`${rel} could not be imported in Node: ${err.message}. Modules must have no side effects at import time; touching window or document at the top level breaks every guard that wants to unit test them.`);
    continue;
  }
  for (const name of expected) {
    check(typeof mod[name] !== 'undefined', `${rel} does not export '${name}'`);
  }
  const extra = Object.keys(mod).filter((k) => !expected.includes(k) && k !== 'default');
  if (extra.length) pending.push(`${rel} exports beyond the contract: ${extra.join(', ')}. Add them to MODULES in this guard, or keep them private.`);
}

// ── verdict ─────────────────────────────────────────────────────────────────
process.stdout.write('\n');
for (const p of pending) process.stdout.write(`  PENDING  ${p}\n`);
for (const f of failures) process.stderr.write(`  FAIL     ${f}\n`);
process.stdout.write(`\n${assertions} assertion(s) ran, ${failures.length} failed, ${pending.length} pending.\n`);

if (assertions === 0) {
  process.stderr.write('FAIL: this guard asserted nothing. A guard that runs and checks nothing is worse than no guard.\n');
  process.exitCode = 1;
} else if (failures.length) {
  process.exitCode = 1;
} else {
  process.stdout.write('cinematic contract holds.\n');
  process.exitCode = 0;
}
