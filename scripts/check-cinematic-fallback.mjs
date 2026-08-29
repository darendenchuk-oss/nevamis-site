/* The fallback and layout guard.  `npm run cine:fallback`
   Subjects: assets/cinematic/cine-stage.css
             assets/cinematic/fallback.js
             tests/fixtures/cinematic-layout.html

   WHAT THIS GUARD IS FOR. The browser spec (tests/cinematic-fallback.spec.js)
   proves the behaviour a visitor gets. This one proves the things a browser
   cannot show you until it is too late:

     - that the three reduced motion switch blocks are still identical, so the
       operating system preference alone keeps working after somebody edits one
       of them. The defect that already shipped in this project was a reduced
       motion block scoped to a class that is absent precisely when reduced
       motion is on. Here that is a parse and compare, not a hope.
     - that no rule in the stylesheet applies transform, opacity, filter, mask
       or clip to anything that can hold readable text. That is an absolute
       owner rule and it is checked against the parsed rules, not grepped.
     - that fallback.js still owns only what it is allowed to own: no fetch, no
       ImageBitmap, no canvas context, no scroll.
     - that every price on the layout fixture is re-derived from
       pricing-config.js rather than typed. A retired price that survives in
       markup is this repository's most repeated defect.

   It reads exit codes, not printed strings, and it fails if it asserted
   nothing. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_REL = 'assets/cinematic/cine-stage.css';
const JS_REL = 'assets/cinematic/fallback.js';
const FIXTURE_REL = 'tests/fixtures/cinematic-layout.html';

const failures = [];
let assertions = 0;
const check = (cond, msg) => { assertions += 1; if (!cond) failures.push(msg); };
const ok = (msg) => { assertions += 1; process.stdout.write(`  ok       ${msg}\n`); };

const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

// ── a very small CSS reader ─────────────────────────────────────────────────
/* Enough to answer "which declarations does this selector carry, and inside
   which at-rule". Deliberately not a full parser: it handles exactly the
   grammar this one stylesheet uses, and it throws rather than guessing if it
   meets something else. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function parseRules(css, atRule = null, out = []) {
  let i = 0;
  while (i < css.length) {
    const brace = css.indexOf('{', i);
    if (brace === -1) break;
    const prelude = css.slice(i, brace).trim();
    // find the matching close brace
    let depth = 1;
    let j = brace + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth += 1;
      else if (css[j] === '}') depth -= 1;
      j += 1;
    }
    if (depth !== 0) throw new Error(`unbalanced braces in ${CSS_REL} near "${prelude.slice(0, 60)}"`);
    const body = css.slice(brace + 1, j - 1);
    if (prelude.startsWith('@')) {
      parseRules(body, prelude, out);
    } else {
      out.push({
        selector: prelude.replace(/\s+/g, ' '),
        atRule,
        declarations: body
          .split(';')
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => {
            const c = d.indexOf(':');
            return { prop: d.slice(0, c).trim(), value: d.slice(c + 1).trim(), raw: d.replace(/\s+/g, ' ') };
          }),
      });
    }
    i = j;
  }
  return out;
}

const cssSource = read(CSS_REL);
const rules = parseRules(stripComments(cssSource));
check(rules.length > 10, `${CSS_REL}: parsed only ${rules.length} rules, which cannot be right`);

// ── 1. THE THREE REDUCED MOTION SWITCHES ────────────────────────────────────
/* The payload lives in custom properties so it is written once. What must be
   true is that three INDEPENDENT selectors set it, and that they set exactly
   the same thing. Each is sufficient alone:
     (a) @media (prefers-reduced-motion: reduce)   no class, no attribute, no JS
     (b) .motion-off .cine-stage                    the site's own toggle
     (c) .cine-stage[data-cine-state="reduced"]     fallback.js decided        */
const SWITCH_MARKER = '--cine-sticky-top';
const switches = rules.filter((r) => r.declarations.some((d) => d.prop === SWITCH_MARKER));

const osSwitch = switches.filter((r) => r.atRule && /prefers-reduced-motion\s*:\s*reduce/.test(r.atRule) && !/print/.test(r.atRule));
const classSwitch = switches.filter((r) => !r.atRule && r.selector.includes('.motion-off'));
const stateSwitch = switches.filter((r) => !r.atRule && /\[data-cine-state\s*=\s*"reduced"\]/.test(r.selector));
const printSwitch = switches.filter((r) => r.atRule && /print/.test(r.atRule));

check(osSwitch.length === 1, `${CSS_REL}: expected exactly 1 reduced motion switch inside @media (prefers-reduced-motion: reduce) carrying ${SWITCH_MARKER}, found ${osSwitch.length}. Without it the operating system preference does nothing at all for a visitor with JavaScript off.`);
check(classSwitch.length === 1, `${CSS_REL}: expected exactly 1 .motion-off switch, found ${classSwitch.length}. The site's own motion toggle would not reach the stage.`);
check(stateSwitch.length === 1, `${CSS_REL}: expected exactly 1 [data-cine-state="reduced"] switch, found ${stateSwitch.length}. fallback.js could set the state and nothing would change.`);
check(printSwitch.length === 1, `${CSS_REL}: expected exactly 1 @media print switch, found ${printSwitch.length}.`);

/* THE EXACT DEFECT THAT ALREADY SHIPPED HERE: a reduced motion rule whose
   selector requires a class or an attribute that is absent precisely when
   reduced motion is on, so the rule can never match. */
for (const r of osSwitch) {
  check(!/\.motion-off/.test(r.selector),
    `${CSS_REL}: the @media (prefers-reduced-motion: reduce) switch is scoped to "${r.selector}", which requires the .motion-off class. That class is absent for a visitor whose operating system preference is set but who has never touched the site toggle, and absent for every visitor with JavaScript off. This rule could never match. That defect has already shipped in this project once.`);
  check(!/\[data-cine-state/.test(r.selector),
    `${CSS_REL}: the @media (prefers-reduced-motion: reduce) switch is scoped to "${r.selector}", which requires an attribute only JavaScript sets. With JavaScript off the rule can never match.`);
  check(!/\.no-js|\.js-on/.test(r.selector),
    `${CSS_REL}: the operating system reduced motion switch is scoped to a scripting-dependent class ("${r.selector}").`);
}

/* Identical, normalised. Property order may change; the set of declarations may
   not. A switch that drifts is a switch that produces a different layout
   depending on which of the three routes the visitor arrived by. */
const normalise = (rule) => rule.declarations
  .map((d) => `${d.prop}:${d.value.replace(/\s+/g, ' ')}`)
  .sort()
  .join('\n');

if (osSwitch.length && classSwitch.length && stateSwitch.length) {
  const a = normalise(osSwitch[0]);
  const b = normalise(classSwitch[0]);
  const c = normalise(stateSwitch[0]);
  check(a === b, `${CSS_REL}: the operating system switch and the .motion-off switch declare different things.\n--- @media ---\n${a}\n--- .motion-off ---\n${b}`);
  check(a === c, `${CSS_REL}: the operating system switch and the [data-cine-state="reduced"] switch declare different things.\n--- @media ---\n${a}\n--- state ---\n${c}`);
  if (a === b && a === c) ok(`the three reduced motion switches are declaration identical (${osSwitch[0].declarations.length} properties)`);
}

/* Every custom property the payload reads must be set by the switches, or the
   reduced path silently keeps a motion value. */
const consumed = new Set();
for (const r of rules) {
  for (const d of r.declarations) {
    for (const m of d.value.matchAll(/var\(\s*(--cine-[a-z-]+)/g)) consumed.add(m[1]);
  }
}
const switched = new Set(osSwitch.length ? osSwitch[0].declarations.map((d) => d.prop) : []);
const defaults = new Set(
  rules.filter((r) => !r.atRule && r.selector === '.cine-stage')
    .flatMap((r) => r.declarations.map((d) => d.prop)),
);
for (const prop of consumed) {
  if (prop === '--cine-scroll-vh') continue; // authored per stage in the HTML
  check(defaults.has(prop), `${CSS_REL}: ${prop} is read with var() but never given a default on .cine-stage. A missing default is an invisible fallback value.`);
  check(switched.has(prop), `${CSS_REL}: ${prop} is read with var() but the reduced motion switch never sets it, so the reduced path keeps its motion value.`);
}
if (consumed.size) ok(`all ${consumed.size} stage custom properties have a default and a reduced motion value`);

// min-height is switched separately (it is not a custom property); all three
// routes must still cancel the artificial scroll length.
const minHeightZero = rules.filter((r) => r.declarations.some((d) => d.prop === 'min-height' && d.value === '0'));
const mhOs = minHeightZero.some((r) => r.atRule && /prefers-reduced-motion/.test(r.atRule));
const mhClass = minHeightZero.some((r) => !r.atRule && r.selector.includes('.motion-off'));
const mhState = minHeightZero.some((r) => !r.atRule && /\[data-cine-state\s*=\s*"reduced"\]/.test(r.selector));
check(mhOs && mhClass && mhState, `${CSS_REL}: min-height:0 must be reachable by all three reduced motion routes (media ${mhOs}, class ${mhClass}, state ${mhState}); otherwise one route leaves an empty ${'`'}--cine-scroll-vh${'`'} tall gap below the last section.`);

// ── 2. THE HIT AREA ─────────────────────────────────────────────────────────
const stickyRules = rules.filter((r) => !r.atRule && r.selector === '.cine-stage__sticky');
check(stickyRules.some((r) => r.declarations.some((d) => d.prop === 'pointer-events' && d.value === 'none')),
  `${CSS_REL}: .cine-stage__sticky does not declare pointer-events:none. Pricing cards and calls to action would sit under the canvas hit area.`);
check(rules.some((r) => r.selector === '.cine-stage__sticky *' && r.declarations.some((d) => d.prop === 'pointer-events' && d.value === 'none')),
  `${CSS_REL}: a descendant of the backdrop can opt back into the hit area; .cine-stage__sticky * must also be pointer-events:none.`);
check(rules.some((r) => r.selector === '.cine-stage > :not(.cine-stage__sticky)' && r.declarations.some((d) => d.prop === 'z-index')),
  `${CSS_REL}: the rule that lifts every non-backdrop child above the canvas is missing or was narrowed to a list of class names, which a new section would not be on.`);

/* An ancestor with overflow other than visible silently kills position:sticky.
   The stage lays out, the canvas paints, and the art scrolls away with the
   copy, with nothing in the console. */
for (const r of rules) {
  if (!/(^|,)\s*\.cine-stage\s*$/.test(r.selector) && r.selector !== '.cine-stage') continue;
  for (const d of r.declarations) {
    check(!/^overflow/.test(d.prop),
      `${CSS_REL}: .cine-stage declares "${d.raw}". Any overflow other than visible on the sticky element's ancestor stops it sticking, silently.`);
  }
}

// ── 3. NO MOTION ON TEXT ────────────────────────────────────────────────────
/* Absolute owner rule: transform, opacity, filter, mask, clip and
   fragmentation never touch a container that can hold readable text. The
   backdrop and its two images hold no words; the .reveal rule REMOVES motion
   rather than adding it. Anything else is a failure. */
const MOTION_PROPS = /^(transform|translate|rotate|scale|opacity|filter|backdrop-filter|mask|mask-image|clip-path|clip|column-count|columns)$/;
const TEXT_FREE_SELECTOR = /\[data-cine-canvas\]|\[data-cine-poster\]|\.cine-stage__sticky|\.cine-chapter-art img/;
const REMOVERS = new Set(['none', '1', 'unset', 'initial', 'revert']);
for (const r of rules) {
  for (const d of r.declarations) {
    if (!MOTION_PROPS.test(d.prop)) continue;
    const value = d.value.replace(/\s*!important$/, '').trim();
    const textFree = TEXT_FREE_SELECTOR.test(r.selector);
    const removes = REMOVERS.has(value);
    check(textFree || removes,
      `${CSS_REL}: "${r.selector}" declares ${d.raw}. That selector can match an element containing readable text, and the value is not a removal. Motion lives in the stage only.`);
  }
}
ok('no rule applies motion to a selector that can hold readable text');

/* ── 3b. THE OWNER RULE AGAINST THE REST OF THE SITE, DERIVED ───────────────
   WHAT THIS REPLACED. There used to be one assertion here: that
   `.cine-stage .reveal` exists and is !important. .reveal is ONE of the six
   mechanisms the site animates readable text with, and measuring the real page
   on 2026-08-28 found five others alive inside stages: .mw (overflow:hidden)
   wrapping .mwi (transform) on every h2 word, li.pstep (opacity .45 +
   translateY), div.status (opacity 0 + translateX), .rail-track (translateX)
   and .stack .layer / .summary-arrive. The block titled "THE OWNER RULE,
   ENFORCED AGAINST THE REST OF THE SITE" enforced one sixth of it.

   THE LIST IS NOT TYPED HERE. It is read out of assets/motion/site.css: any
   selector that file itself neutralises under `html.motion-off`, under
   `html.no-js`, or inside its own @media (prefers-reduced-motion: reduce) block
   IS by the site's own convention an entrance animation on content, and every
   one of them must also be neutralised inside a released cinematic stage. Add a
   new entrance animation to the site with its usual motion-off partner and this
   guard demands the cinematic neutraliser in the same commit. A guard that
   copied today's six would have expired green.

   The rendered half, which catches a mechanism NOBODY enumerated, is
   tests/cinematic-home.spec.js: it reads getComputedStyle on every element with
   text inside a stage flipped to released and fails on any survivor. */
const SITE_CSS_REL = 'assets/motion/site.css';
const siteRules = parseRules(stripComments(read(SITE_CSS_REL)));

/** The leaf selector a site neutraliser is about: `html.motion-off .pstep`
    describes `.pstep`. Pseudo-classes and states are dropped, because the
    cinematic neutraliser has to cover the element in every state. */
function leafOf(sel) {
  return sel
    .replace(/^\s*html\.(motion-off|no-js)\s+/, '')
    .replace(/^\s*\.(motion-off|no-js)\s+/, '')
    .replace(/:(hover|focus|active|not\([^)]*\))/g, '')
    .replace(/\.(in|active|done)\b/g, '')
    .trim();
}

const siteNeutralised = new Set();
for (const r of siteRules) {
  const reduced = r.atRule && /prefers-reduced-motion\s*:\s*reduce/.test(r.atRule);
  for (const part of r.selector.split(',')) {
    const sel = part.trim();
    if (!sel) continue;
    const isMotionOff = /^html\.(motion-off|no-js)\b/.test(sel) || /^\.(motion-off|no-js)\b/.test(sel);
    if (!isMotionOff && !reduced) continue;
    const leaf = leafOf(sel);
    if (!leaf || leaf.startsWith('html') || !leaf.startsWith('.')) continue;
    siteNeutralised.add(leaf);
  }
}
check(siteNeutralised.size >= 4,
  `${SITE_CSS_REL}: only ${siteNeutralised.size} entrance animation(s) were derived from the site's own motion-off and reduced-motion rules. This guard cannot be measuring the site's motion system; do not relax it, find out why the parse changed.`);

/* What cine-stage.css actually neutralises, and under which stage scope. The
   scope matters: a neutraliser on `.cine-stage` unconditionally would cancel
   the site's whole reveal system on a page with no sequences at all, and
   index.js's own rule is that a stage awaiting artwork does not exist yet. */
const CINE_SCOPE = '.cine-stage:not([data-cine-artwork="pending"])';
const cineNeutralised = new Map();
for (const r of rules) {
  if (r.atRule) continue;
  const removes = r.declarations.filter((d) => MOTION_PROPS.test(d.prop) || d.prop === 'overflow' || d.prop === 'animation');
  if (!removes.length) continue;
  for (const part of r.selector.split(',')) {
    const sel = part.trim();
    if (!sel.startsWith(CINE_SCOPE)) continue;
    const leaf = sel.slice(CINE_SCOPE.length).trim();
    const props = cineNeutralised.get(leaf) || new Set();
    for (const d of removes) props.add(d.prop);
    cineNeutralised.set(leaf, props);
  }
}

/* The exemptions, read out of the stylesheet's own comments so a skip has to be
   argued in the file the rule lives in rather than in this guard. */
const EXEMPT_RE = new RegExp('cine-owner-exempt:\\s*([^\\r\\n]+?)\\s+--\\s+([^\\r\\n]+)', 'g');
const exemptions = [...cssSource.matchAll(EXEMPT_RE)]
  .map((m) => ({ selector: m[1].trim(), reason: m[2].trim() }));
check(exemptions.length > 0,
  `${CSS_REL}: no cine-owner-exempt entries at all. The owner rule's exemption list must live beside the rule; if it is genuinely empty, say so in a comment there.`);
for (const e of exemptions) {
  check(e.reason.length > 20,
    `${CSS_REL}: cine-owner-exempt "${e.selector}" gives the reason "${e.reason}", which is not an argument that the selector holds no readable text.`);
}
const isExempt = (leaf) => exemptions.some((e) => leaf === e.selector || leaf.includes(e.selector));

const uncovered = [...siteNeutralised].filter((leaf) => !cineNeutralised.has(leaf) && !isExempt(leaf));
check(uncovered.length === 0,
  `${CSS_REL}: assets/motion/site.css animates ${JSON.stringify(uncovered)} on readable content and neutralises it for reduced motion, but ${CSS_REL} does not neutralise it inside a released stage. "Never apply transform, opacity, filter, mask, clip or fragmentation to any container holding readable text" is absolute; add "${CINE_SCOPE} ${uncovered[0] || 'SELECTOR'}" to the owner rule block.`);

/* Every neutraliser must actually neutralise, and must win. site.css lives in
   a later stylesheet at equal specificity, and GSAP writes inline styles: only
   !important beats both. */
for (const [leaf, props] of cineNeutralised) {
  for (const r of rules) {
    if (r.atRule) continue;
    if (!r.selector.split(',').some((x) => x.trim() === `${CINE_SCOPE} ${leaf}`)) continue;
    for (const d of r.declarations) {
      check(/!important/.test(d.value),
        `${CSS_REL}: "${CINE_SCOPE} ${leaf}" declares ${d.raw} without !important. site.css declares the same property at equal specificity in a later stylesheet and GSAP writes it inline; without !important the neutraliser loses and nothing says so.`);
    }
  }
  void props;
}
check(cineNeutralised.has('.reveal'),
  `${CSS_REL}: the .reveal neutraliser inside a stage is missing. site.js animates opacity and transform on .reveal, which over a stage is motion applied to a container full of readable text.`);
check(cineNeutralised.has('.mw') && [...cineNeutralised.get('.mw')].includes('overflow'),
  `${CSS_REL}: .mw is not un-clipped inside a released stage. assets/motion/scroll.js wraps every heading word in a span with overflow:hidden, which is fragmentation and clip on a heading; a transform neutraliser alone leaves the clip.`);
ok(`the owner rule accounts for all ${siteNeutralised.size} entrance animations assets/motion/site.css declares: ${cineNeutralised.size} neutralised inside a released stage, ${exemptions.length} exempted with a written reason`);

/* And the fragmentation itself, which no stylesheet can undo. */
const scrollJs = read('assets/motion/scroll.js');
check(/\.cine-stage:not\(\[data-cine-artwork="pending"\]\)/.test(scrollJs),
  'assets/motion/scroll.js still splits headings into per-word spans inside a released cinematic stage. CSS can un-clip and un-transform those spans; it cannot un-split them, so the split has to be refused at the source.');

check(rules.some((r) => r.selector.includes('[hidden]') && r.selector.includes('data-cine-canvas')
  && r.declarations.some((d) => d.prop === 'display' && /none/.test(d.value) && /!important/.test(d.value))),
  `${CSS_REL}: nothing makes the canvas's own display rule lose to [hidden]. degrade() sets hidden on the canvas and the canvas would stay on screen while every diagnostic said it was gone.`);

// ── 4. fallback.js ownership and import purity ──────────────────────────────
const jsSource = read(JS_REL);
const BANNED = [
  [/\bfetch\s*\(/, 'calls fetch. Only sequence-loader.js may touch the network.'],
  [/createImageBitmap|new\s+ImageBitmap/, 'creates an ImageBitmap. Only sequence-loader.js may decode frames.'],
  [/\.getContext\s*\(/, 'gets a canvas context. Only scroll-stage.js may touch the canvas contents.'],
  [/\bwindow\.scrollY|\bscrollTo\s*\(|addEventListener\s*\(\s*['"]scroll['"]/, 'reads or writes scroll. Only scroll-stage.js owns scroll.'],
  [/\.style\.(transform|opacity|filter|clipPath|mask)\b/, 'sets a motion property inline, which can land on a text container.'],
];
for (const [re, why] of BANNED) {
  check(!re.test(jsSource), `${JS_REL} ${why}`);
}

const mod = await import(`file://${path.join(root, JS_REL).replace(/\\/g, '/')}`);
const exported = Object.keys(mod).filter((k) => k !== 'default');
check(exported.sort().join(',') === 'MODULE_URL,createFallbackLayer',
  `${JS_REL} exports ${JSON.stringify(exported)}; the contract's module surface is exactly ['createFallbackLayer','MODULE_URL'].`);
/* MODULE_URL is import.meta.url, not a path anyone typed. index.js reports it
   as handle.sources.fallback and the browser guards refuse a run whose
   collaborators are not the shipped files; a literal there was an assertion
   about a constant. */
check(typeof mod.MODULE_URL === 'string' && mod.MODULE_URL.endsWith('/fallback.js'),
  `${JS_REL}: MODULE_URL is ${JSON.stringify(mod.MODULE_URL)}; it must be this file's own import.meta.url.`);
ok(`${JS_REL} imported in Node with no window or document at the top level`);

/* A bad stage element must be refused with a real error rather than crashing on
   a global that does not exist in Node. */
let refused = null;
try { mod.createFallbackLayer(null, {}, {}); } catch (err) { refused = err; }
check(refused instanceof TypeError, `${JS_REL}: createFallbackLayer(null, ...) threw ${refused && refused.name}, expected a TypeError naming stageEl.`);

// ── 5. the layout fixture's DOM contract ────────────────────────────────────
/* The markup only. The fixture's own <script> mentions data-cine-stage inside
   querySelector templates, and a structural count that included those would be
   counting the harness rather than the page. */
const html = read(FIXTURE_REL).replace(/<script[\s\S]*?<\/script>/g, '');

const stageBlocks = [...html.matchAll(/data-cine-stage="([^"]+)"/g)].map((m) => m[1]);
check(stageBlocks.length === 3, `${FIXTURE_REL}: found ${stageBlocks.length} stages, expected 3.`);
const SEQ = JSON.parse(read('config/cinematic-sequences.json'));
for (const seq of SEQ.sequences) {
  check(stageBlocks.includes(seq.id), `${FIXTURE_REL}: no stage for '${seq.id}'.`);
  const block = html.match(new RegExp(`data-cine-stage="${seq.id}"[\\s\\S]*?data-cine-state="([^"]+)"`));
  check(block && block[1] === 'poster',
    `${FIXTURE_REL}: stage '${seq.id}' is served with data-cine-state="${block && block[1]}". It must be "poster" in the HTML so a visitor with no JavaScript already has a valid state and a visible frame.`);
  const sections = html.match(new RegExp(`data-cine-stage="${seq.id}"[\\s\\S]*?data-cine-sections="([^"]+)"`));
  check(sections && sections[1] === seq.sections.join(' '),
    `${FIXTURE_REL}: stage '${seq.id}' declares sections "${sections && sections[1]}", config/cinematic-sequences.json says "${seq.sections.join(' ')}".`);
  for (const chapter of seq.chapters) {
    check(html.includes(`data-cine-chapter="${chapter.id}"`),
      `${FIXTURE_REL}: no reduced motion artwork slot for chapter '${chapter.id}'. applyReducedMotion() would place nothing for it and the stage would fall back to the poster.`);
  }
}

/* Every data-ia section keeps its own heading and exactly one primary action.
   A sequence may span adjacent sections visually; it must never merge them. */
const iaSections = [...html.matchAll(/<section data-ia="(\d)"[\s\S]*?<\/section>/g)];
check(iaSections.length === 7, `${FIXTURE_REL}: found ${iaSections.length} data-ia sections, the homepage architecture is seven.`);
const seenIa = new Set();
for (const m of iaSections) {
  const ia = m[1];
  const body = m[0];
  check(!seenIa.has(ia), `${FIXTURE_REL}: data-ia="${ia}" appears more than once; two sections were merged.`);
  seenIa.add(ia);
  const headings = (body.match(/<h[12][\s>]/g) || []).length;
  check(headings === 1, `${FIXTURE_REL}: section ${ia} has ${headings} top level headings, expected exactly 1. A sequence spanning sections must never merge their semantic headings.`);
  const primary = (body.match(/data-primary-cta/g) || []).length;
  check(primary === 1, `${FIXTURE_REL}: section ${ia} has ${primary} primary actions, expected exactly 1.`);
}

check(/<canvas data-cine-canvas role="presentation" aria-hidden="true">/.test(html),
  `${FIXTURE_REL}: the canvas is not marked as decoration (role="presentation" aria-hidden="true"). No essential information may exist only in canvas pixels.`);
check((html.match(/class="cine-stage__sticky" aria-hidden="true"/g) || []).length === 3,
  `${FIXTURE_REL}: every .cine-stage__sticky must carry aria-hidden="true".`);
check(/<img data-cine-poster[^>]*alt=""/.test(html),
  `${FIXTURE_REL}: the poster must have an empty alt; its meaning is already written in the sections beside it.`);
check(!/spinner|loading\.\.\.|aria-busy="true"/i.test(html),
  `${FIXTURE_REL}: the served HTML contains a loading indicator. There must be nothing that can spin forever.`);

// ── 6. every price is derived, not typed ────────────────────────────────────
const priceGlobals = {};
// eslint-disable-next-line no-new-func
new Function('window', read('pricing-config.js'))(priceGlobals);
const PRICING = priceGlobals.NV_PRICING;
check(PRICING && Array.isArray(PRICING.plans), 'pricing-config.js did not define window.NV_PRICING.plans');

const money = (n) => `C$${n.toLocaleString('en-CA')}`;
function canonicalPrice(pathSpec) {
  const [kind, rest] = pathSpec.split(':');
  const [id, field] = rest.split('.');
  const list = kind === 'plan' ? PRICING.plans : kind === 'addOn' ? PRICING.addOns : null;
  if (!list) throw new Error(`unknown price kind '${kind}'`);
  const record = list.find((x) => x.id === id);
  if (!record) throw new Error(`pricing-config.js has no ${kind} '${id}'`);
  if (typeof record[field] !== 'number') throw new Error(`${kind} '${id}' has no numeric '${field}'`);
  return money(record[field]);
}

const priced = [...html.matchAll(/<span data-nv-price="([^"]+)">([^<]+)<\/span>/g)];
check(priced.length >= 4, `${FIXTURE_REL}: found ${priced.length} data-nv-price spans; the pricing cards are supposed to carry every number with its canonical path.`);
for (const [, spec, rendered] of priced) {
  let expected = null;
  try { expected = canonicalPrice(spec); } catch (err) { failures.push(`${FIXTURE_REL}: data-nv-price="${spec}" does not resolve: ${err.message}`); assertions += 1; continue; }
  check(rendered.trim() === expected,
    `${FIXTURE_REL}: data-nv-price="${spec}" renders "${rendered.trim()}" but pricing-config.js says "${expected}". A price literal that outlived its model is this repository's most repeated defect.`);
}

/* And nothing may carry a bare C$ amount without naming where it came from. */
const bareMoney = [...html.matchAll(/C\$[\d,]+/g)].length;
check(bareMoney === priced.length,
  `${FIXTURE_REL}: ${bareMoney} currency amounts appear but only ${priced.length} are inside a data-nv-price span. Every number must name its path in pricing-config.js.`);

// ── 7. copy rules ───────────────────────────────────────────────────────────
for (const rel of [CSS_REL, JS_REL, FIXTURE_REL]) {
  const src = read(rel);
  const em = src.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => l.includes('—'));
  check(em.length === 0, `${rel}: em dash on line(s) ${em.map(([n]) => n).join(', ')}. Em dashes are banned across this site.`);
}
const visibleText = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
check(!/\bNevamis\b/.test(visibleText), `${FIXTURE_REL}: "Nevamis" appears in visible copy; the brand is written NEVAMIS in brand contexts.`);
check(!/AI\s+NEVAMIS|NEVAMIS\s+AI\b/.test(visibleText), `${FIXTURE_REL}: "AI" is attached to the NEVAMIS name in visible copy.`);

// ── verdict ─────────────────────────────────────────────────────────────────
process.stdout.write('\n');
for (const f of failures) process.stderr.write(`  FAIL     ${f}\n`);
process.stdout.write(`\n${assertions} assertion(s) ran, ${failures.length} failed.\n`);

if (assertions === 0) {
  process.stderr.write('FAIL: this guard asserted nothing.\n');
  process.exitCode = 1;
} else if (failures.length) {
  process.exitCode = 1;
} else {
  process.stdout.write('cinematic fallback and layout contract: OK\n');
}
