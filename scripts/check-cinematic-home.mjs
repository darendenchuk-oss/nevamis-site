/* Does the homepage's cinematic wiring still say the same thing as the config?
   Run:  node scripts/check-cinematic-home.mjs      (npm run cine:home)

   WHY THIS FILE EXISTS
   Every other cinematic guard measures a fixture. tests/fixtures/cinematic-layout.html
   and tests/fixtures/cine-guard-subject.html are excellent and they are not the
   product: a home.html carrying none of this would leave all of them green. This
   guard is the one that looks at the page a visitor loads.

   WHAT IT REFUSES TO DO
   It does not restate the section allocation. Every number here is read from
   config/cinematic-sequences.json, which is the single place a sequence's span,
   scroll length and chapter list is written down. A guard that copied the
   allocation would agree with the page and disagree with the truth, which is
   this repository's most expensive recurring defect.

   HOW TO REBIND A SECTION TO A DIFFERENT SEQUENCE
   1. edit "sections" (and the chapters' "section") in config/cinematic-sequences.json
   2. move the <div class="cine-stage"> boundary in home.html so it wraps exactly
      those sections, and update its data-cine-sections and --cine-scroll-vh
   3. node scripts/promote.mjs
   Doing only one of those is what this guard exists to catch, and it names the
   half that is missing. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEQUENCE_IDS } from '../assets/cinematic/manifest.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const failures = [];
let assertions = 0;
const check = (cond, message) => { assertions += 1; if (!cond) failures.push(message); };
const oks = [];
const ok = (m) => oks.push(m);

const CONFIG = JSON.parse(read('config/cinematic-sequences.json'));

/* ── 1. the config itself ──────────────────────────────────────────────── */
const ids = CONFIG.sequences.map((s) => s.id);
check(ids.join(',') === SEQUENCE_IDS.join(','),
  `config/cinematic-sequences.json lists [${ids}] but manifest.js's canonical order is [${SEQUENCE_IDS.join(',')}]`);

const covered = CONFIG.sequences.flatMap((s) => s.sections);
check(covered.join(',') === '1,2,3,4,5,6,7',
  `the three sequences span [${covered}]. The directive keeps SEVEN sections and a sequence may span adjacent ones and may never merge, overlap or skip one.`);
for (const s of CONFIG.sequences) {
  const asc = s.sections.every((n, i) => i === 0 || n === s.sections[i - 1] + 1);
  check(asc, `'${s.id}' spans [${s.sections}], which is not a contiguous ascending run. A stage is one wrapper around consecutive sections; it cannot skip one.`);
  check(s.artwork === 'pending' || s.artwork === 'released',
    `'${s.id}' declares artwork ${JSON.stringify(s.artwork)}; it must be "pending" or "released".`);
  for (const c of s.chapters) {
    check(s.sections.includes(c.section),
      `'${s.id}' chapter '${c.id}' claims section ${c.section}, which its own sequence does not span.`);
  }
}
if (!failures.length) ok(`config: three sequences span sections ${covered.join(', ')} with no overlap`);

/* ── 2. the page ───────────────────────────────────────────────────────── */
/* Parsed by structure, not by a regex over the whole document: the wrapper's
   real extent is what matters, and a regex cannot tell whether a section is
   inside a wrapper or merely after it. */
function stagesIn(html, label) {
  const out = [];
  const openRe = /<div class="cine-stage"([\s\S]*?)>/g;
  let m;
  while ((m = openRe.exec(html)) !== null) {
    const attrs = m[1];
    const id = (/data-cine-stage="([^"]+)"/.exec(attrs) || [])[1];
    const closeMark = `</div><!-- /cine-stage ${id} -->`;
    const closeAt = html.indexOf(closeMark, m.index);
    if (closeAt === -1) {
      failures.push(`${label}: the stage '${id}' opens but has no "${closeMark}". The wrapper's extent cannot be established, so nothing about it can be measured.`);
      assertions += 1;
      continue;
    }
    const body = html.slice(openRe.lastIndex, closeAt);
    out.push({
      id,
      sections: (/data-cine-sections="([^"]+)"/.exec(attrs) || ['', ''])[1].trim().split(/\s+/).filter(Boolean).map(Number),
      state: (/data-cine-state="([^"]+)"/.exec(attrs) || [])[1],
      artwork: (/data-cine-artwork="([^"]+)"/.exec(attrs) || [])[1],
      scrollVh: Number((/--cine-scroll-vh:\s*(\d+)/.exec(attrs) || [])[1]),
      body,
      contains: [...body.matchAll(/<section [^>]*data-ia="(\d+)"/g)].map((x) => Number(x[1])),
      chapters: [...body.matchAll(/data-cine-chapter="([a-z-]+)"/g)].map((x) => x[1]),
    });
  }
  return out;
}

function auditPage(rel) {
  const html = read(rel);
  const stages = stagesIn(html, rel);

  check(stages.length === CONFIG.sequences.length,
    `${rel} declares ${stages.length} [data-cine-stage] wrappers; the config declares ${CONFIG.sequences.length}. Add or remove the wrapper, do not change this guard.`);
  check(stages.map((s) => s.id).join(',') === ids.join(','),
    `${rel} declares stages [${stages.map((s) => s.id)}] in that document order; the config declares [${ids}].`);

  /* Every data-ia section in the document must be inside exactly one wrapper.
     A section that fell outside one is the failure mode a wrapper boundary
     edit produces, and it looks completely normal in a browser. */
  const allIa = [...new Set([...html.matchAll(/<section [^>]*data-ia="(\d+)"/g)].map((m) => Number(m[1])))].sort((a, b) => a - b);
  check(allIa.join(',') === '1,2,3,4,5,6,7',
    `${rel} declares data-ia sections [${allIa}]; the directive keeps exactly seven.`);
  const wrapped = stages.flatMap((s) => [...new Set(s.contains)]).sort((a, b) => a - b);
  check(wrapped.join(',') === allIa.join(','),
    `${rel}: the stage wrappers physically contain sections [${wrapped}] but the page has [${allIa}]. A section outside every wrapper renders normally and silently loses its sequence.`);

  for (const seq of CONFIG.sequences) {
    const st = stages.find((s) => s.id === seq.id);
    if (!st) { check(false, `${rel} has no wrapper for '${seq.id}'`); continue; }

    check(st.sections.join(',') === seq.sections.join(','),
      `${rel}: '${seq.id}' declares data-cine-sections="${st.sections.join(' ')}" but config/cinematic-sequences.json says [${seq.sections}]. Edit the config first, then move the wrapper.`);

    const inside = [...new Set(st.contains)].sort((a, b) => a - b);
    check(inside.join(',') === seq.sections.join(','),
      `${rel}: the '${seq.id}' wrapper physically contains sections [${inside}] but claims [${seq.sections}]. The attribute and the boundary must be moved together.`);

    check(st.scrollVh === seq.stage.scrollLengthVh,
      `${rel}: '${seq.id}' authors --cine-scroll-vh:${st.scrollVh}; the config's stage.scrollLengthVh is ${seq.stage.scrollLengthVh}.`);

    check(st.state === 'poster',
      `${rel}: '${seq.id}' is served as data-cine-state="${st.state}". The served state must be "poster" so a visitor with no JavaScript has a valid one.`);

    check(st.artwork === seq.artwork,
      `${rel}: '${seq.id}' is served as data-cine-artwork="${st.artwork}" while the config declares "${seq.artwork}". These are the two halves of the release gate and both must be flipped together.`);

    /* The chapter slots: one per chapter, inside that chapter's own section. */
    const want = seq.chapters.map((c) => c.id);
    check(st.chapters.join(',') === want.join(','),
      `${rel}: '${seq.id}' carries reduced motion slots [${st.chapters}]; its chapters are [${want}]. Reduced motion shows one static keyframe per chapter, so a missing slot is a chapter with nothing to show.`);
    for (const c of seq.chapters) {
      /* The slot must sit inside the section it names, not merely inside the
         stage. Sliced per top level section, the same way the page nests. */
      const secRe = new RegExp(`<section [^>]*data-ia="${c.section}"[\\s\\S]*?\\n  </section>`, 'g');
      const bodies = st.body.match(secRe) || [];
      const home = bodies.filter((b) => b.includes(`data-cine-chapter="${c.id}"`));
      check(home.length === 1,
        `${rel}: the slot for chapter '${c.id}' appears in ${home.length} of the ${bodies.length} element(s) carrying data-ia="${c.section}". It must sit inside the section it illustrates, exactly once.`);
    }

    /* The release gate, structurally. */
    const hasCanvas = /canvas[^>]*data-cine-canvas/.test(st.body);
    const hasPoster = /<img[^>]*data-cine-poster/.test(st.body);
    const hasSticky = /class="cine-stage__sticky"/.test(st.body);
    if (seq.artwork === 'pending') {
      check(!hasCanvas && !hasPoster && !hasSticky,
        `${rel}: '${seq.id}' is pending but still carries a backdrop (canvas ${hasCanvas}, poster ${hasPoster}, sticky ${hasSticky}). A stage with no approved artwork must cost the page nothing: an empty sticky backdrop is a viewport of dead layout and a poster src that resolves to nothing is a broken image.`);
    } else {
      check(hasCanvas && hasPoster && hasSticky,
        `${rel}: '${seq.id}' is released but its served HTML has canvas ${hasCanvas}, poster ${hasPoster}, sticky ${hasSticky}. A released stage with no canvas paints nothing and reports nothing.`);
    }
  }

  /* The mount, and the gate in front of it. Read as source, because whether
     the engine is REQUESTED at all is the thing being asserted, and that is a
     property of the served bytes. */
  check(html.includes('<link rel="stylesheet" href="/assets/cinematic/cine-stage.css">'),
    `${rel} does not link /assets/cinematic/cine-stage.css. Every fallback, the hit area rule and the three reduced motion switches live in that file; without it the stages have no layout and no reduced motion path at all.`);

  const GATE = '[data-cine-stage]:not([data-cine-artwork="pending"])';
  check(html.includes(GATE),
    `${rel}: the mount is not gated on ${GATE}. Without that gate the five cinematic modules are fetched on every homepage load to discover there is nothing to run.`);
  check(/import\('\/assets\/cinematic\/index\.js'\)/.test(html),
    `${rel} never imports /assets/cinematic/index.js, so no stage is ever mounted.`);
  const gateAt = html.indexOf(GATE);
  const importAt = html.indexOf("import('/assets/cinematic/index.js')");
  check(gateAt !== -1 && importAt !== -1 && gateAt < importAt,
    `${rel}: the engine import is not behind the released-stage gate.`);

  const anyReleased = CONFIG.sequences.some((s) => s.artwork === 'released');
  if (!anyReleased) {
    ok(`${rel}: all three sequences are pending, so the gate is false and assets/cinematic/*.js is never requested`);
  }

  /* Copy rules, scoped to the markup this integration added. The site wide em
     dash rule is enforced elsewhere; this is the local half, so a stage comment
     cannot be the thing that breaks it. */
  for (const st of stages) {
    check(!st.body.includes('—') && !st.body.includes('–'),
      `${rel}: the '${st.id}' stage contains an em or en dash. The site bans them.`);
  }
  const stageMarkup = stages.map((s) => s.body).join('\n');
  const badBrand = [...stageMarkup.matchAll(/\bNevamis AI\b|\bAI Nevamis\b/g)].map((m) => m[0]);
  check(badBrand.length === 0,
    `${rel}: "AI" is attached to the NEVAMIS name inside a stage (${badBrand.join(', ')}).`);

  return stages;
}

const homeStages = auditPage('home.html');

/* ── 3. the promoted page ──────────────────────────────────────────────── */
/* index.html is generated from home.html. A homepage wired in staging and never
   promoted is a change nobody sees, and "M index.html" on Windows is usually a
   line ending artifact rather than evidence either way. Comparing the stage
   markup itself is evidence. */
if (fs.existsSync(path.join(root, 'index.html'))) {
  const liveStages = stagesIn(read('index.html'), 'index.html');
  const sig = (list) => list.map((s) => `${s.id}:${s.sections.join(',')}:${s.artwork}:${s.scrollVh}:${s.chapters.join('+')}`).join(' | ');
  check(sig(liveStages) === sig(homeStages),
    `index.html's cinematic wiring does not match home.html's.\n      home.html:  ${sig(homeStages)}\n      index.html: ${sig(liveStages)}\n      Run: node scripts/promote.mjs`);
}

/* ── verdict ───────────────────────────────────────────────────────────── */
for (const m of oks) process.stdout.write(`  ok       ${m}\n`);
for (const f of failures) process.stderr.write(`  FAIL     ${f}\n`);
process.stdout.write(`\n${assertions} assertion(s) ran, ${failures.length} failed.\n`);
if (assertions === 0) {
  process.stderr.write('This guard asserted nothing, which is not a pass.\n');
  process.exit(2);
}
process.exit(failures.length ? 1 : 0);
