#!/usr/bin/env node
/* ============================================================
   THE FILES AND DESTINATIONS THAT CAN HURT CUSTOMERS IF THEY CHANGE

   One push to main changes nevamis.ca within minutes. Most changes are copy.
   A few are not:
   - ring.xml is the call routing Twilio fetches for the demo line and every
     phone number the engine provisions. A changed <Redirect> or an added
     <Dial> reroutes real customers' callers.
   - the vendored third-party code (GSAP, the ElevenLabs widget) runs inside
     the site.
   - every absolute URL in a published page decides where visitors, their
     bookings and their lead details go.

   config/critical-surface.json pins the exact hashes of those files and the
   list of outside hosts the published pages may point at. This check fails
   when either changes, so a change to call routing, vendor code or a lead or
   booking destination has to update the manifest in the same commit, where a
   reviewer sees it. It is a tripwire for accidents and for a quietly swapped
   link; it is not a substitute for protecting the main branch.

     node scripts/check-critical-surface.mjs            check (exit 1 when the
                                                        manifest is missing or unreadable;
                                                        it is never recreated here)
     node scripts/check-critical-surface.mjs --update   rewrite the manifest
                                                        (only for a deliberate change)
   ============================================================ */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedFiles } from './lib/published-files.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(root, 'config', 'critical-surface.json');
const UPDATE = process.argv.includes('--update');

const PINNED = [
  'ring.xml',
  'assets/ringback-tone.wav',
  'assets/vendor/gsap.min.js',
  'assets/vendor/ScrollTrigger.min.js',
  'assets/vendor/MotionPathPlugin.min.js',
  'assets/vendor/elevenlabs-convai-widget-embed-0.18.2.js',
];
const TEXT = /\.(xml|js|mjs|html|json|txt|md|css)$/i;

/* Hash what git stores (LF), not a Windows checkout's CRLF copy. */
function sha(file) {
  let buf = fs.readFileSync(path.join(root, file));
  if (TEXT.test(file)) buf = Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/* Outside hosts referenced by the published pages and first-party scripts.
   Vendor bundles are pinned by hash above instead; their internal URLs are the
   vendor's. The scan covers attributes and script strings alike. */
function published() {
  return publishedFiles(root)
    .filter((f) => /\.(html|js|json|txt|xml)$/i.test(f) && !f.startsWith('assets/vendor/'));
}
function hosts() {
  const found = new Map();
  for (const f of published()) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    for (const m of text.matchAll(/\b(?:https?|wss?):\/\/([a-z0-9.-]+\.[a-z]{2,})(?=[:/"'`\s)?#<\\]|$)/gi)) {
      const h = m[1].toLowerCase();
      if (!found.has(h)) found.set(h, new Set());
      found.get(h).add(f);
    }
  }
  return found;
}

const current = { files: Object.fromEntries(PINNED.map((f) => [f, sha(f)])), hosts: [...hosts().keys()].sort() };

if (UPDATE) {
  const out = {
    _comment: 'Pinned by scripts/check-critical-surface.mjs. Changing ring.xml, vendored code, or adding an outside host a published page points at must update this file in the same commit. Regenerate with: node scripts/check-critical-surface.mjs --update',
    ...current,
  };
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 2) + '\n');
  console.log(`critical-surface manifest written: ${PINNED.length} pinned files, ${current.hosts.length} hosts.`);
  process.exit(0);
}

/* Check mode never creates or repairs the manifest. A deleted or broken
   manifest used to be rewritten from the current tree and pass, which turned
   the tripwire off for every later run. */
function fatal(msg) {
  console.error(`CRITICAL SURFACE CHECK CANNOT RUN: ${msg}\n  Restore config/critical-surface.json from git. Only for a deliberate re-pin, run node scripts/check-critical-surface.mjs --update and review the diff.`);
  process.exit(1);
}
if (!fs.existsSync(MANIFEST)) fatal('config/critical-surface.json is missing.');
let want;
try { want = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) { fatal(`config/critical-surface.json is not valid JSON (${e.message}).`); }
if (!want || typeof want !== 'object' || !want.files || typeof want.files !== 'object' || !Array.isArray(want.hosts)) {
  fatal('config/critical-surface.json does not have the expected shape ({ files: {...}, hosts: [...] }).');
}
const errors = [];
for (const f of PINNED) {
  if (!want.files[f]) errors.push(`${f}: not in the manifest`);
  else if (want.files[f] !== current.files[f]) errors.push(`${f}: content changed (pinned ${want.files[f].slice(0, 12)}, now ${current.files[f].slice(0, 12)})`);
}
const allowed = new Set(want.hosts);
const seen = hosts();
for (const [h, files] of seen) if (!allowed.has(h)) errors.push(`new outside host ${h} in ${[...files].slice(0, 3).join(', ')}`);

if (errors.length) {
  console.error('CRITICAL SURFACE CHANGED. If this is deliberate, run node scripts/check-critical-surface.mjs --update and commit the manifest with the change:\n  ' + errors.join('\n  '));
  process.exitCode = 1;
} else {
  console.log(`Critical surface OK: ${PINNED.length} pinned files unchanged, ${seen.size} outside hosts all allowed.`);
}
