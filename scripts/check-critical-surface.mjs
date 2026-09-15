#!/usr/bin/env node
/* ============================================================
   THE FILES AND DESTINATIONS THAT CAN HURT CUSTOMERS IF THEY CHANGE

   One push to main changes nevamis.ca within minutes. Most changes are copy.
   A few are not:
   - ring.xml is the call routing Twilio fetches for the demo line and every
     phone number the engine provisions. A changed <Redirect> or an added
     <Dial> reroutes real customers' callers.
   - the vendored third-party code (GSAP, the ElevenLabs widget) runs inside
     the site. EVERY published file under assets/vendor/ is pinned by hash,
     so a vendor file that is new, changed or gone fails until the manifest
     says so.
   - a same-origin script runs with the page's full authority, and the
     Content-Security-Policy's script-src 'self' allows any of them. So every
     script a published page or first-party script loads (<script src>,
     <link rel=modulepreload>, import, or a ".js" path in script code) must
     be a published first-party script: site.js, motion.js,
     pricing-config.js, roadmap-config.js, assets/film/*.js,
     assets/motion/*.js, talk/talk.js, or an assets/vendor/ file pinned in
     the manifest. That list is FIRST_PARTY_SCRIPTS below; --update never
     extends it.
   - every phone number, email address and absolute URL in a published file
     decides where visitors, their calls, their bookings and their lead
     details go.

   config/critical-surface.json pins the exact hashes of those files and,
   per published file, every DESTINATION it names:
   - tel:, sms:, mailto:, callto:, sip: and facetime: links, as the full value
     (tel:+15874130035, mailto:Sales@nevamis.ca);
   - every North American phone number written out for people or for
     structured data ("(587) 413-0035", "+1 (587) 413-0035",
     "+1-587-413-0035", "587.413.0035", a JSON-LD "+15874130035"), as
     phone:+15874130035, and every plain-text email address, as
     email:sales@nevamis.ca (lower case). Pins are per file, not per copy: a
     page that shows the number three times pins it once, so a new number
     in any copy fails, and so does losing the last copy, but rewriting one
     copy into a shape these patterns do not read ("587 4130035") does not;
   - every absolute or protocol-relative URL (any letter case in the scheme,
     backslashes where a browser reads slashes, HTML character references
     decoded), as origin plus path for anything off nevamis.ca, which includes
     app.nevamis.ca's /api, /signup and /scan paths and Cal.com's account and
     event slug. Links within https://nevamis.ca are recorded as the origin.
   - every <meta http-equiv="refresh"> target, of any kind, parsed the way
     the HTML standard parses the content attribute: refresh:<origin and
     path> (same-site targets included), refresh:<scheme> for anything that
     is not http(s), and refresh:(reload) for a timer with no URL. A page
     that sends visitors elsewhere without a click is a decision, not copy.
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

const PUBLISHED = publishedFiles(root);
const PUBLISHED_SET = new Set(PUBLISHED);
const VENDOR = 'assets/vendor/';
/* The vendor part is the directory, not a hand-kept list: a list of four
   names let a fifth vendor file ship unpinned and unscanned. */
const PINNED = ['ring.xml', 'assets/ringback-tone.wav', ...PUBLISHED.filter((f) => f.startsWith(VENDOR)).sort()];
const FIRST_PARTY_SCRIPTS = [
  /^(site|motion|pricing-config|roadmap-config)\.js$/,
  /^assets\/film\/[^/]+\.js$/,
  /^assets\/motion\/[^/]+\.js$/,
  /^talk\/talk\.js$/,
];
const FIRST_PARTY_TEXT = 'site.js, motion.js, pricing-config.js, roadmap-config.js, assets/film/*.js, assets/motion/*.js, talk/talk.js';
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
  return PUBLISHED.filter((f) => SCANNED.test(f) && !f.startsWith(VENDOR));
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
/* Protocol-relative: two slashes right after a quote, "=", "(", "," or ";"
   (a meta refresh's "0; //host"), then something shaped like a host: a
   dotted name in any characters a browser accepts (underscores and
   non-ASCII included, since "//x_y.evil.example" and a host spelled with an
   e-acute both navigate), an IPv6 literal, or userinfo@. */
const HOST_LABEL = String.raw`[^\s"'${'`'}<>\\/@?#.;,()\[\]{}|^]+`;
const PROTOCOL_RELATIVE = new RegExp(String.raw`(?<=["'${'`'}=(,;]\s*)[\\/]{2}(?=(?:[^\s"'${'`'}<>\\/@]*@)?(?:(?:${HOST_LABEL}\.)+${HOST_LABEL}|\[[0-9A-Fa-f:.]+\]))([^\s"'${'`'}<>{}|^]+)`, 'g');

/* Displayed phone numbers (NANP): an optional +1, an area code with or
   without parentheses, then exchange and line, separated by a space, a dot,
   a hyphen, a non-breaking space (raw or &nbsp;) or a Unicode dash. Or the
   E.164 form "+1NXXNXXXXXX" outside a tel: link, which the tel: pin already
   records. Digits or dots on either side mean it is part of something
   longer (a version, a decimal, an id). */
const DASHES = String.fromCharCode(0xa0, 0x2010, 0x2011, 0x2012, 0x2013, 0x2014, 0x2015);
const SEP = String.raw`(?:[ .${DASHES}-]|&nbsp;)`;
const PHONE = new RegExp(String.raw`(?<![\w.+:/-])(?:(?:\+?1${SEP}?)?(?:\(\s*([2-9]\d{2})\s*\)${SEP}?|([2-9]\d{2})${SEP})([2-9]\d{2})${SEP}(\d{4})|\+1([2-9]\d{2})([2-9]\d{2})(\d{4}))(?![\w.-]?\d)`, 'g');
/* Plain-text email addresses. "icon@2x.png" is a file name, not an address. */
const EMAIL = /(?<![\w.%+-])[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9_%+-])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+([A-Za-z]{2,})(?![\w-])/g;
const FILE_EXTENSION = /^(png|jpe?g|gif|webp|avif|svg|ico|js|mjs|css|json|mp3|mp4|webm|wav|woff2?|ttf|otf|html?)$/i;

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
  for (const m of text.matchAll(PHONE)) {
    dests.add(`phone:+1${m[5] ? m[5] + m[6] + m[7] : (m[1] || m[2]) + m[3] + m[4]}`);
  }
  for (const m of text.matchAll(EMAIL)) {
    if (!FILE_EXTENSION.test(m[1])) dests.add(`email:${m[0].toLowerCase()}`);
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

/* <meta http-equiv="refresh" content="0; url=..."> navigates without a click.
   Its target is read the way the HTML standard reads the content attribute
   (time, optional ";" or ",", optional "url=", optional quotes), so
   "0; //evil.example", "0;URL='x'" and reversed attribute order all count. */
function refreshTargets(file, html) {
  const out = [];
  for (const m of html.matchAll(/<meta\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
    const a = attrsOf(m[1]);
    if ((a['http-equiv'] || '').toLowerCase() !== 'refresh') continue;
    let s = (a.content || '').replace(/^[\s\d.]*/, '').replace(/^[;,]/, '').trimStart();
    if (/^url/i.test(s)) { const rest = s.slice(3).trimStart(); if (rest.startsWith('=')) s = rest.slice(1).trimStart(); }
    if (/^["']/.test(s)) { const e = s.indexOf(s[0], 1); s = e < 0 ? s.slice(1) : s.slice(1, e); }
    s = s.trim();
    if (!s) { out.push({ dest: 'refresh:(reload)' }); continue; }
    let u;
    try { u = new URL(s, `${SITE}/${file}`); } catch { out.push({ error: `meta refresh to an unparseable URL ${s.slice(0, 80)}` }); continue; }
    if (u.username || u.password) out.push({ error: `meta refresh to a URL with a user name or password: ${s.slice(0, 80)}` });
    else if (ipLiteral(u.hostname)) out.push({ error: `meta refresh to an IP-literal host: ${s.slice(0, 80)}` });
    else out.push({ dest: `refresh:${/^https?:$/.test(u.protocol) ? `${u.protocol}//${u.host}${u.pathname}` : u.protocol}` });
  }
  return out;
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
    if (/\.(html?|xhtml)$/i.test(f)) {
      for (const r of refreshTargets(f, raw)) { if (r.error) errors.push(`${f}: ${r.error}`); else all.add(r.dest); }
    }
    for (const v of views) {
      const { dests, errors: errs } = destinationsIn(v);
      dests.forEach((d) => all.add(d));
      errs.forEach((e) => errors.push(`${f}: ${e}`));
    }
    if (all.size) byFile[f] = [...all].sort();
  }
  return { byFile, errors: [...new Set(errors)] };
}

/* ---------- same-origin scripts ----------
   Which scripts do published pages and first-party scripts load from
   nevamis.ca itself? Third-party script hosts are the CSP's and the
   destination pins' business; this is about a new file on our own origin. */
const BACKSLASH = String.fromCharCode(92);
/* A JS string literal as the engine reads it: \xHH, \u escapes, and "\/". */
function unescapeJs(s) {
  if (!s.includes(BACKSLASH)) return s;
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== BACKSLASH) { out += s[i]; continue; }
    const c = s[++i];
    if (c === 'x' && /^[0-9a-f]{2}$/i.test(s.slice(i + 1, i + 3))) { out += String.fromCharCode(parseInt(s.slice(i + 1, i + 3), 16)); i += 2; }
    else if (c === 'u' && s[i + 1] === '{') { const e = s.indexOf('}', i); out += String.fromCodePoint(parseInt(s.slice(i + 2, e), 16) || 0xfffd); i = e; }
    else if (c === 'u' && /^[0-9a-f]{4}$/i.test(s.slice(i + 1, i + 5))) { out += String.fromCharCode(parseInt(s.slice(i + 1, i + 5), 16)); i += 4; }
    else if (c !== undefined) out += c;
  }
  return out;
}
/* A static import or re-export at the start of a statement, or import(). A
   browser only loads a specifier that is a URL or starts with "/", "./" or
   "../"; anything else is skipped (and "from" in ordinary code is not one). */
const IMPORT_SPEC = /(?:^|[;{}\n])\s*(?:import\s*(?:[\w$*{},\s]+?\s*from\s*)?|export\s*[\w$*{},\s]*?\s*from\s*)(['"])([^'"\n]+)\1|\bimport\s*\(\s*(['"`])([^'"`\n]+)\3/g;
const LOADABLE_SPEC = /^(?:\.{0,2}\/|[a-z][a-z0-9+.-]*:)/i;
const JS_PATH = /(['"`])([^'"`\s<>]*?\.m?js(?:[?#][^'"`\s<>]*)?)\1/gi;
const ATTRS = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+)))?/g;
const attrsOf = (s) => Object.fromEntries([...s.matchAll(ATTRS)].map((m) => [m[1].toLowerCase(), decodeRefs(m[2] ?? m[3] ?? m[4] ?? '').trim()]));

/** Script references in one published file: { spec, bases, how }. */
function scriptRefs(file, text) {
  const refs = [];
  const url = `${SITE}/${file}`;
  const jsRefs = (code, fileBase, literalBases, how) => {
    const imports = new Set();
    for (const m of code.matchAll(IMPORT_SPEC)) {
      const spec = unescapeJs(m[2] ?? m[4]);
      if (spec.includes('${') || !LOADABLE_SPEC.test(spec)) continue;
      imports.add(m[2] ?? m[4]);
      refs.push({ spec, bases: [fileBase], how: `import in ${how}` });
    }
    for (const m of code.matchAll(JS_PATH)) {
      if (imports.has(m[2]) || m[2].includes('${')) continue;
      refs.push({ spec: unescapeJs(m[2]), bases: literalBases, how: `a ".js" string in ${how}` });
    }
  };
  if (/\.(html?|xhtml)$/i.test(file)) {
    for (const m of text.matchAll(/<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi)) {
      const a = attrsOf(m[1]);
      if ('src' in a) refs.push({ spec: a.src, bases: [url], how: '<script src>' });
      jsRefs(m[2], url, [url], 'an inline script');
    }
    for (const m of text.matchAll(/<link\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi)) {
      const a = attrsOf(m[1]);
      const rel = (a.rel || '').toLowerCase();
      if (a.href && (/modulepreload/.test(rel) || /\.m?js(?:[?#]|$)/i.test(a.href) || (/preload|prefetch/.test(rel) && /^(script|worker)$/i.test(a.as || '')))) {
        refs.push({ spec: a.href, bases: [url], how: `<link rel=${rel || '?'}>` });
      }
    }
  } else if (/\.m?js$/i.test(file) && !file.startsWith(VENDOR)) {
    /* A relative path in script code resolves against the page that runs it
       (every page is at the root or /talk/), an import against the file. */
    jsRefs(text, url, [url, `${SITE}/`, `${SITE}/talk/`], file);
  }
  return refs;
}

function scriptProblems(pinnedVendor) {
  const problems = [];
  let loads = 0;
  const verdict = (u) => {
    if (u.origin !== SITE) return null;
    let p;
    try { p = decodeURIComponent(u.pathname).replace(/^\/+/, ''); } catch { return { path: u.pathname, why: 'an undecodable path' }; }
    if (p.includes(BACKSLASH) || p.split('/').some((seg) => seg === '..' || seg === '.')) return { path: p, why: 'a path with dot segments or backslashes' };
    if (!PUBLISHED_SET.has(p)) return { path: p, why: 'not a published file' };
    if (p.startsWith(VENDOR)) return pinnedVendor.has(p) ? { path: p, ok: true } : { path: p, why: 'a vendor file that is not pinned in the manifest' };
    return FIRST_PARTY_SCRIPTS.some((r) => r.test(p)) ? { path: p, ok: true } : { path: p, why: 'not a first-party script path' };
  };
  for (const f of PUBLISHED) {
    if (!/\.(html?|xhtml|m?js)$/i.test(f)) continue;
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    for (const r of scriptRefs(f, text)) {
      const vs = r.bases.map((b) => { try { return verdict(new URL(r.spec, b)); } catch { return null; } }).filter(Boolean);
      if (!vs.length) continue;
      loads++;
      if (vs.some((v) => v.ok)) continue;
      problems.push(`${f}: ${r.how} loads /${vs[0].path}, ${vs[0].why}`);
    }
  }
  return { problems: [...new Set(problems)], loads };
}

/* ---------- run ---------- */
const current = {
  files: Object.fromEntries(PINNED.map((f) => [f, sha(f)])),
  ...(() => { const d = destinations(); return { destinations: d.byFile, unpinnable: d.errors }; })(),
};
const count = (byFile) => Object.values(byFile).reduce((n, l) => n + l.length, 0);
const missingPinned = PINNED.filter((f) => current.files[f] === null);

const SCRIPT_HELP = `A same-origin script runs with the page's full authority and script-src 'self' allows it. Allowed: ${FIRST_PARTY_TEXT}, and assets/vendor/ files pinned in ${MANIFEST_REL}. `
  + 'Load it from one of those paths, or vendor it under assets/vendor/ and pin it with --update so its hash shows in the manifest diff:\n  ';

if (UPDATE) {
  const scripts = scriptProblems(new Set(PINNED.filter((f) => f.startsWith(VENDOR))));
  if (current.unpinnable.length || missingPinned.length || scripts.problems.length) {
    console.error('Refusing to write the manifest. These cannot be pinned; fix them first:\n  '
      + [...missingPinned.map((f) => `${f}: missing`), ...current.unpinnable, ...scripts.problems.map((p) => `${p} (${FIRST_PARTY_TEXT} or assets/vendor/ only)`)].join('\n  '));
    process.exit(1);
  }
  /* Keep the existing order so a re-pin diff shows only what changed. */
  let order = [];
  try { order = Object.keys(JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).files || {}); } catch { order = []; }
  order = [...order.filter((f) => PINNED.includes(f)), ...PINNED.filter((f) => !order.includes(f))];
  const out = {
    _comment: 'Pinned by scripts/check-critical-surface.mjs. Changing ring.xml or any file under assets/vendor/, or adding, changing or removing a phone number, email address or URL in a published file, must update this file in the same commit. Regenerate with: node scripts/check-critical-surface.mjs --update, then review the diff.',
    files: Object.fromEntries(order.map((f) => [f, current.files[f]])),
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
  else if (!want.files[f]) errors.push(f.startsWith(VENDOR) ? `${f}: new vendor file, not pinned (every file under ${VENDOR} must be listed with its sha256)` : `${f}: not in the manifest`);
  else if (want.files[f] !== current.files[f]) errors.push(`${f}: content changed (pinned ${want.files[f].slice(0, 12)}, now ${current.files[f].slice(0, 12)})`);
}
for (const f of Object.keys(want.files)) {
  if (!PINNED.includes(f)) errors.push(`${f}: pinned in the manifest but no longer published (deleted, renamed or excluded)`);
}
const scripts = scriptProblems(new Set(Object.keys(want.files).filter((f) => f.startsWith(VENDOR))));
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
}
if (scripts.problems.length) {
  console.error('SAME-ORIGIN SCRIPT THAT IS NOT FIRST-PARTY. ' + SCRIPT_HELP + scripts.problems.join('\n  '));
  process.exitCode = 1;
}
if (!errors.length && !scripts.problems.length) {
  console.log(`Critical surface OK: ${PINNED.length} pinned files unchanged, ${count(current.destinations)} destinations in ${Object.keys(current.destinations).length} files match the manifest, ${scripts.loads} same-origin script loads all first-party.`);
}
