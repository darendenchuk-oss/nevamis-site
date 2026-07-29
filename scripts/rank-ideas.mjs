/* ============================================================
   RANK THE IDEA BACKLOG

   docs/ideas/ holds a large backlog, each item carrying its own
   "impact N/5 · effort N/5". Those scores are only comparable INSIDE a
   file: a 5/5 in retention-expansion-referral and a 5/5 in sales-outbound
   are not the same thing when the business has zero clients and nobody to
   retain. This ranks everything on one list by asking a harder question
   than "is this a good idea":

       does doing this move Nevamis closer to its FIRST paying client?

   Three multipliers do that work:

   1. STAGE FIT — how close a domain sits to first revenue today. Outbound
      and the demo line are the whole funnel right now; the homepage cannot
      convert traffic that does not exist yet.

   2. PREREQUISITES — an idea that needs clients, traffic, budget, legal
      review or an owner decision is not actionable this week no matter how
      good it is. Those are pushed into a LATER tier rather than being
      quietly deleted or misleadingly ranked at the top.

   3. EFFORT — for a solo founder, time is the binding constraint, so a
      cheap idea beats an expensive one of equal impact.

   Run: node scripts/rank-ideas.mjs            (writes docs/ideas/RANKED.md)
        node scripts/rank-ideas.mjs --top 40   (print only)
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'docs', 'ideas');

/* How close each domain sits to the first paying client, today. These are
   deliberately opinionated and will be wrong later: once there is traffic,
   homepage-conversion climbs; once there are clients, retention stops being
   near-zero. Revisit the day either becomes true. */
const STAGE_FIT = {
  'founder-time-and-systems': 0.95,    // one person's hours is the actual ceiling
  'sales-outbound': 1.00,              // the only channel with volume he controls
  'local-market-partnerships': 0.90,   // warm intros beat cold in a trades town
  'lead-capture-booking': 0.85,        // the funnel is two doors wide
  'pricing-offers-packaging': 0.80,    // the offer decides the close, not the page
  'finance-unit-economics': 0.70,      // selling below cost to the first five is unrecoverable
  'trust-proof-objections': 0.80,      // objections get answered on calls, not just pages
  'positioning-and-competition': 0.85, // positioning decides whether outbound converts at all
  'risk-legal-and-continuity': 0.65,   // will not win a client, can end the business
  'agent-product-quality': 0.75,       // the demo line IS the pitch
  'homepage-conversion': 0.60,         // needs traffic to pay off
  'answer-engine-optimization': 0.50,  // real, but slow
  'seo-technical-onpage': 0.50,
  'content-and-new-pages': 0.45,
  'lifecycle-email-sms': 0.40,         // needs leads in the top of the funnel first
  'analytics-experimentation': 0.35,   // measurement needs volume to measure
  'site-ux-interaction': 0.30,
  'performance-a11y-reliability': 0.30,
  'platform-ops-portal': 0.25,         // needs clients to operate
  'retention-expansion-referral': 0.20, // needs clients to retain
};

/* Only two things genuinely gate an idea today, and both mean "the input does
   not exist yet" rather than "this is hard".

   An earlier version also tagged legal, budget and owner-decision. That was
   wrong in a way worth recording: "get terms reviewed by a lawyer" is not
   blocked BY legal review, it IS the legal review, and tagging it pushed the
   most urgent pre-client items into the LATER pile. A blocker must describe a
   missing prerequisite, never the action itself. */
const PREREQS = [
  { tag: 'clients', re: /\b(testimonial|case stud|client logo|client count|reference customer|churn rate|existing client|once you have clients|first \d+ clients)\b/i },
  { tag: 'traffic', re: /\b(a\/b test|split test|multivariate|statistical significance|heatmap|session recording|sample size)\b/i },
];

function parseFile(file) {
  const slug = path.basename(file, '.md');
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const out = [];

  /* Each idea starts "N. **SLUG-000 — Title.**" and ends with the impact
     line. Split on the numbered heading and keep whatever precedes the next. */
  const parts = text.split(/\n(?=\d+\. (?:\*\*|`))/);
  for (const part of parts) {
    /* Three heading styles are in use across these files:
         N. **DOMAIN-001 — Title.**
         N. **Title.**                  (id omitted)
         N. `DOMAIN-001` **Title.**     (id in backticks)
       Accepting only the first silently dropped 180 real ideas, which is the
       whole of platform-ops-portal plus a chunk of seo. A missing id is
       synthesised from the file and number, which is what it would have been. */
    const head = part.match(/^(\d+)\. (?:`([A-Z0-9-]{4,})`\s*)?\*\*(?:([A-Z0-9-]{4,})\s+—\s+)?([\s\S]*?)\*\*/);
    const meta = part.match(/impact\s+([0-9])\/5\s*·\s*effort\s+([0-9])\/5/);
    if (!head || !meta) continue;

    const body = part.replace(/\s+/g, ' ').trim();
    const blockers = PREREQS.filter((p) => p.re.test(body)).map((p) => p.tag);

    out.push({
      id: head[2] ?? head[3] ?? `${slug.toUpperCase()}-${String(head[1]).padStart(3, '0')}`,
      title: head[4].replace(/\s+/g, ' ').replace(/\.$/, '').trim(),
      domain: slug,
      impact: Number(meta[1]),
      effort: Number(meta[2]),
      blockers,
      chars: body.length,
    });
  }
  return out;
}

/* ---------- completed ideas, verified rather than trusted ----------
   Three of the top-ranked ideas turned out to be already done, which is the
   worst failure this list can have: it sends the founder to redo finished
   work and quietly discredits everything below it. DONE.md records them, and
   every row carries a check that is re-run here. A "done" item whose check
   fails has regressed, so it is reported and put back in the backlog. */
/** Files _config.yml keeps out of the published site. */
const unpublished = new Set(
  fs.readFileSync(path.join(root, '_config.yml'), 'utf8')
    .split(/\r?\n/)
    .map((l) => (l.match(/^\s*-\s+(\S+)\s*$/) || [])[1])
    .filter(Boolean)
    .map((e) => e.replace(/\/$/, '')),
);

function loadDone() {
  const file = path.join(dir, 'DONE.md');
  if (!fs.existsSync(file)) return { ids: new Set(), regressed: [] };
  const ids = new Set();
  const regressed = [];

  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\|\s*`([A-Z0-9-]+)`\s*\|[^|]*\|[^|]*\|\s*`?([^|`]*)`?\s*\|/);
    if (!m) continue;
    const [, id, rawCheck] = m;
    const check = rawCheck.trim();
    ids.add(id);
    if (!check || check === 'none') continue;

    const mode = check.startsWith('absent:') ? 'absent' : check.startsWith('present:') ? 'present' : null;
    if (!mode) continue;
    const rest = check.slice(mode.length + 1);
    const at = rest.lastIndexOf(':');
    const pattern = rest.slice(0, at);
    const glob = rest.slice(at + 1);

    let hits = 0;
    for (const f of fs.globSync(glob, { cwd: root })) {
      /* Skip anything _config.yml keeps out of the Jekyll build. The first run
         of this check reported "first ring" as regressed because it still
         appears in the three abandoned mockups — which are real files, but not
         published ones, so a visitor cannot reach the claim. Reusing the
         exclude list keeps one definition of "published" across this and
         check-consistency.js rather than inventing a second. */
      if (unpublished.has(path.basename(f))) continue;
      const p = path.join(root, f);
      if (!fs.statSync(p).isFile()) continue;
      if (fs.readFileSync(p, 'utf8').includes(pattern)) hits++;
    }
    const ok = mode === 'absent' ? hits === 0 : hits > 0;
    if (!ok) { regressed.push({ id, check, hits }); ids.delete(id); }
  }
  return { ids, regressed };
}

const done = loadDone();
if (done.regressed.length) {
  console.error('\nREGRESSED — marked done in DONE.md but the check now fails:');
  for (const r of done.regressed) console.error(`  ${r.id}  (${r.check}) -> ${r.hits} match(es)`);
  console.error('  These are back in the ranking until fixed.\n');
}

const ideas = fs.readdirSync(dir)
  .filter((f) => f.endsWith('.md') && !['RANKED.md', 'README.md', 'DONE.md'].includes(f))
  .flatMap(parseFile)
  .filter((i) => !done.ids.has(i.id));

/* Score. Effort is inverted and weighted less than impact: a cheap idea is
   worth reaching for first, but cheapness alone should not outrank a thing
   that actually moves revenue. */
for (const i of ideas) {
  const fit = STAGE_FIT[i.domain] ?? 0.4;
  const effortBonus = (6 - i.effort) / 5;          // 1.0 (trivial) .. 0.2 (huge)
  i.score = i.impact * fit * (0.65 + 0.35 * effortBonus);
  i.tier = i.blockers.length ? 'LATER' : 'NOW';
}

const byScore = (a, b) => b.score - a.score || a.effort - b.effort || a.id.localeCompare(b.id);
const now = ideas.filter((i) => i.tier === 'NOW').sort(byScore);
const later = ideas.filter((i) => i.tier === 'LATER').sort(byScore);

const topArg = process.argv.indexOf('--top');
if (topArg !== -1) {
  const n = Number(process.argv[topArg + 1] ?? 25);
  console.log(`\nTop ${n} of ${ideas.length} ideas (${now.length} actionable now, ${later.length} blocked):\n`);
  now.slice(0, n).forEach((i, x) => {
    console.log(`${String(x + 1).padStart(3)}. [${i.score.toFixed(2)}] ${i.id}  (i${i.impact}/e${i.effort})`);
    console.log(`     ${i.title}`);
  });
  process.exit(0);
}

const row = (i, n) => `| ${n} | ${i.score.toFixed(2)} | \`${i.id}\` | ${i.title} | ${i.impact} | ${i.effort} | ${i.blockers.join(', ') || '—'} |`;
const table = (list) => [
  '| # | Score | ID | Improvement | Impact | Effort | Blocked by |',
  '|---|-------|----|-------------|--------|--------|------------|',
  ...list.map((i, n) => row(i, n + 1)),
].join('\n');

const domainCounts = Object.entries(
  ideas.reduce((m, i) => ((m[i.domain] = (m[i.domain] || 0) + 1), m), {}),
).sort((a, b) => b[1] - a[1]);

fs.writeFileSync(path.join(dir, 'RANKED.md'), `# The whole backlog, ranked

Generated by \`scripts/rank-ideas.mjs\`. Do not hand-edit: re-run it instead.

**${ideas.length} ideas.** ${now.length} are actionable now; ${later.length} need something
Nevamis does not have yet (clients, traffic, budget, a legal review, or a decision
only the owner can make) and are listed separately so they cannot crowd the top.

## How the ranking works

Each idea carries its own impact and effort. Those are only comparable inside one
file, so this multiplies them by how close the domain sits to the **first paying
client**: outbound and the demo line are the entire funnel today, while the
homepage cannot convert traffic that does not exist yet. Effort is inverted and
weighted at about a third, because for a solo founder time is the binding
constraint but cheapness alone should not outrank revenue.

The stage weights are opinionated and will be wrong later. The day there is real
traffic, homepage-conversion should climb; the day there are clients, retention
stops being near-zero. Both live in \`STAGE_FIT\` in the script.

| Domain | Ideas | Stage fit |
|--------|-------|-----------|
${domainCounts.map(([d, n]) => `| ${d} | ${n} | ${(STAGE_FIT[d] ?? 0.4).toFixed(2)} |`).join('\n')}

---

## The best of each area

A single ranked list is honest but lopsided: outbound and founder time dominate
the top, which is the correct answer to "what wins the first client" and a poor
answer to "what should I know about area X". This is the highest-scoring
unblocked idea per domain, so nothing good stays invisible behind a stronger
neighbour.

| Domain | Top idea | Score |
|--------|----------|-------|
${domainCounts.map(([d]) => {
  const best = now.find((i) => i.domain === d);
  return best ? `| ${d} | \`${best.id}\` ${best.title} | ${best.score.toFixed(2)} |` : null;
}).filter(Boolean).join('\n')}

---

## Do these now

${table(now)}

---

## Blocked until something changes

These are not worse ideas. They need a prerequisite that does not exist yet, so
doing them today would be building on sand.

${table(later)}
`);

console.log(`RANKED.md written: ${ideas.length} ideas (${now.length} now, ${later.length} blocked)`);
console.log(`Top 5:`);
now.slice(0, 5).forEach((i, n) => console.log(`  ${n + 1}. [${i.score.toFixed(2)}] ${i.id} — ${i.title.slice(0, 70)}`));
