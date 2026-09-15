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
   - every phone number, email address and absolute URL in a published file
     decides where visitors, their calls, their bookings and their lead
     details go.

   config/critical-surface.json pins the exact hashes of those files and,
   per published file, every DESTINATION it names:
   - tel:, sms:, mailto:, callto:, sip: and facetime: links, as the full value
     (tel:+15874130035, mailto:Sales@nevamis.ca);
   - every absolute or protocol-relative URL (any letter case in the scheme,
     backslashes where a browser reads slashes, HTML character references
     decoded), as origin plus path for anything off nevamis.ca, which includes
     app.nevamis.ca's /api, /signup and /scan paths and Cal.com's account and
     event slug. Links within https://nevamis.ca are recorded as the origin.
   A URL carrying a user name or password (https://cal.com@evil.example) or an
   IP-literal host is never pinnable: it fails even with --update.

   The check fails when a pinned file changes, when a destination appears or
   disappears, or when the manifest is missing or unreadable. It never writes
   the manifest unless told to. A deliberate change is one --update and a
   manifest diff a reviewer reads in the same commit. It is a tripwire for
   accidents and for a quietly swapped number or link; it is not a substitute
   for protecting the main branch.

     node scripts/check-critical-surface.mjs            check
     node scripts/check-critical-surface.mjs --update   rewrite the manifest
                                                        (only for a deliberate change)
   ============================================================ */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedFiles } from './lib/published-files.mjs';
import { decodeRefs } from './lib/char-refs.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(root, 'config', 'critical-surface.json');
const MANIFEST_REL = 'config/critical-surface.json';
const UPDATE = process.argv.includes('--update');
const SITE = 'https://nevamis.ca';

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
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return null;
  let buf = fs.readFileSync(full);
  if (TEXT.test(file)) buf = Buffer.from(buf.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/* ---------- destinations ----------
   Published text files. Vendor bundles are pinned by hash above instead;
   their internal URLs are the vendor's. */
const SCANNED = /\.(html?|xhtml|js|mjs|json|txt|xml|css|md|svg|webmanifest)$/i;
function scannedFiles() {
  return publishedFiles(root).filter((f) => SCANNED.test(f) && !f.startsWith('assets/vendor/'));
}

/* HTML attribute values are character-reference decoded by the browser, so
   href="https&#58;//evil.example" is a link to evil.example. decodeRefs lives
   in scripts/lib/char-refs.mjs, shared with the published-surface SVG screen. */

/* Every string inside a JSON file, decoded, so an escaped "https:\/\/" is read
   the way the consumer reads it. */
function jsonStrings(text) {
  const out = [];
  const walk = (v) => {
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.push(k); walk(x); }
  };
  try { walk(JSON.parse(text)); } catch { return null; }
  return out.join('\n');
}

/* Trailing punctuation belongs to the sentence or the code around a URL, and
   an unbalanced ")" to the markdown or the call it sits in. */
function trimTail(v) {
  let s = v.replace(/[.,;:!?'"$\]]+$/, '');
  while (s.endsWith(')') && (s.match(/\(/g) || []).length < (s.match(/\)/g) || []).length) {
    s = s.slice(0, -1).replace(/[.,;:!?'"$\]]+$/, '');
  }
  return s;
}

const CONTACT = /(?<![A-Za-z0-9+.-])(tel|sms|mailto|callto|sips?|facetime-audio|facetime):([^\s"'`<>{}|\\]+)/gi;
/* A scheme with slashes (or backslashes) after it, or a bare "http:host.tld"
   (which a browser on an https page reads as an absolute http URL). */
const NET = /(?<![A-Za-z0-9+.-])(https?|wss?|ftp):([\\/]*)([^\s"'`<>{}|^]+)/gi;
/* Protocol-relative: two slashes right after a quote, "=", "(" or ",", then
   something shaped like a host (dotted name, IPv6 literal, or userinfo@). */
const PROTOCOL_RELATIVE = /(?<=["'`=(,]\s*)[\\/]{2}(?=(?:[^\s"'`<>\\/@]*@)?(?:(?:[A-Za-z0-9-]+\.)+[A-Za-z0-9-]+|\[[0-9A-Fa-f:.]+\]))([^\s"'`<>{}|^]+)/g;

function ipLiteral(host) {
  return host.startsWith('[') || /^\d+(\.\d+){3}$/.test(host);
}

/** One URL candidate -> { dest } or { error }. null when it is not a URL. */
function classifyUrl(candidate, hadSlashes) {
  let u;
  try { u = new URL(candidate, SITE + '/'); } catch {
    return hadSlashes ? { error: `unparseable URL ${candidate.slice(0, 80)}` } : null;
  }
  if (!hadSlashes && !/[.\[]/.test(u.hostname)) return null; /* "ws:gn" in minified code */
  if (u.username || u.password) return { error: `URL with a user name or password: ${candidate.slice(0, 80)}` };
  if (ipLiteral(u.hostname)) return { error: `URL with an IP-literal host: ${candidate.slice(0, 80)}` };
  if (u.origin === SITE) return { dest: SITE };
  return { dest: `${u.protocol}//${u.host}${u.pathname}` };
}

function destinationsIn(text) {
  const dests = new Set();
  const errors = new Set();
  const add = (r) => { if (!r) return; if (r.error) errors.add(r.error); else dests.add(r.dest); };
  for (const m of text.matchAll(CONTACT)) {
    const scheme = m[1].toLowerCase();
    const value = trimTail(m[2]);
    const isAddress = scheme === 'mailto' || scheme.startsWith('sip');
    if (isAddress ? !/@|^\?/.test(value) : !/\d/.test(value)) continue; /* "tel:" in a selector or regex */
    dests.add(`${scheme}:${value}`);
  }
  for (const m of text.matchAll(NET)) {
    const value = trimTail(m[3]);
    if (!value || value.startsWith('$')) continue; /* a template: `https://${host}` */
    add(classifyUrl(`${m[1]}:${m[2]}${value}`, m[2].length > 0));
  }
  for (const m of text.matchAll(PROTOCOL_RELATIVE)) {
    const value = trimTail(m[1]);
    if (value) add(classifyUrl(`//${value}`, true));
  }
  return { dests, errors };
}

function destinations() {
  const byFile = {};
  const errors = [];
  for (const f of scannedFiles()) {
    const raw = fs.readFileSync(path.join(root, f), 'utf8');
    const views = [raw];
    if (/\.(html?|xhtml|xml|svg)$/i.test(f)) views.push(decodeRefs(raw));
    if (/\.json$/i.test(f)) { const s = jsonStrings(raw); if (s !== null) views.push(s); }
    const all = new Set();
    for (const v of views) {
      const { dests, errors: errs } = destinationsIn(v);
      dests.forEach((d) => all.add(d));
      errs.forEach((e) => errors.push(`${f}: ${e}`));
    }
    if (all.size) byFile[f] = [...all].sort();
  }
  return { byFile, errors: [...new Set(errors)] };
}

/* ---------- run ---------- */
const current = {
  files: Object.fromEntries(PINNED.map((f) => [f, sha(f)])),
  ...(() => { const d = destinations(); return { destinations: d.byFile, unpinnable: d.errors }; })(),
};
const count = (byFile) => Object.values(byFile).reduce((n, l) => n + l.length, 0);
const missingPinned = PINNED.filter((f) => current.files[f] === null);

if (UPDATE) {
  if (current.unpinnable.length || missingPinned.length) {
    console.error('Refusing to write the manifest. These cannot be pinned; fix them first:\n  '
      + [...missingPinned.map((f) => `${f}: missing`), ...current.unpinnable].join('\n  '));
    process.exit(1);
  }
  const out = {
    _comment: 'Pinned by scripts/check-critical-surface.mjs. Changing ring.xml or vendored code, or adding, changing or removing a phone number, email address or URL in a published file, must update this file in the same commit. Regenerate with: node scripts/check-critical-surface.mjs --update, then review the diff.',
    files: current.files,
    destinations: current.destinations,
  };
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 2) + '\n');
  console.log(`critical-surface manifest written: ${PINNED.length} pinned files, ${count(current.destinations)} destinations in ${Object.keys(current.destinations).length} files. Review: git diff ${MANIFEST_REL}`);
  process.exit(0);
}

/* Check mode never creates or repairs the manifest. A deleted or broken
   manifest used to be rewritten from the current tree and pass, which turned
   the tripwire off for every later run. */
function fatal(msg) {
  console.error(`CRITICAL SURFACE CHECK CANNOT RUN: ${msg}\n  Restore ${MANIFEST_REL} from git. Only for a deliberate re-pin, run node scripts/check-critical-surface.mjs --update and review the diff.`);
  process.exit(1);
}
if (!fs.existsSync(MANIFEST)) fatal(`${MANIFEST_REL} is missing.`);
let want;
try { want = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (e) { fatal(`${MANIFEST_REL} is not valid JSON (${e.message}).`); }
const isMap = (v) => v && typeof v === 'object' && !Array.isArray(v);
if (!isMap(want) || !isMap(want.files) || !isMap(want.destinations)
  || !Object.values(want.destinations).every((l) => Array.isArray(l) && l.every((d) => typeof d === 'string'))) {
  fatal(`${MANIFEST_REL} does not have the expected shape ({ files: {...}, destinations: { file: [...] } }).`);
}

const errors = [];
for (const f of PINNED) {
  if (current.files[f] === null) errors.push(`${f}: missing from the checkout`);
  else if (!want.files[f]) errors.push(`${f}: not in the manifest`);
  else if (want.files[f] !== current.files[f]) errors.push(`${f}: content changed (pinned ${want.files[f].slice(0, 12)}, now ${current.files[f].slice(0, 12)})`);
}
for (const e of current.unpinnable) errors.push(`${e} (never allowed; remove it)`);
const files = new Set([...Object.keys(want.destinations), ...Object.keys(current.destinations)]);
for (const f of [...files].sort()) {
  const had = new Set(want.destinations[f] || []);
  const has = new Set(current.destinations[f] || []);
  for (const d of has) if (!had.has(d)) errors.push(`${f}: new destination ${d}`);
  for (const d of had) if (!has.has(d)) errors.push(`${f}: pinned destination ${d} is gone`);
}

if (errors.length) {
  console.error('CRITICAL SURFACE CHANGED. A call route, vendor file, phone number, email address or link destination differs from the manifest.\n'
    + 'If every line below is deliberate, run node scripts/check-critical-surface.mjs --update and commit the manifest diff with the change:\n  '
    + errors.join('\n  '));
  process.exitCode = 1;
} else {
  console.log(`Critical surface OK: ${PINNED.length} pinned files unchanged, ${count(current.destinations)} destinations in ${Object.keys(current.destinations).length} files match the manifest.`);
}
