/* ============================================================
   CONTENT SECURITY POLICY, delivered as a <meta> in every published page.

   GitHub Pages cannot send response headers, so the policy travels inside the
   page. A meta CSP is weaker than the header (browsers ignore frame-ancestors,
   report-uri and sandbox in it) but it still decides which scripts, styles,
   connections and frames a page may use, which is the part that turns a stray
   HTML injection or a swapped third-party file into a blocked request instead
   of code running on nevamis.ca.

   Every inline <script> is allowed by the sha256 of its exact text, computed
   here from the page as it will be served. Git stores these files with LF line
   endings while a Windows checkout has CRLF, and a hash of the CRLF text would
   never match what the browser receives, so the text is hashed LF-normalised.
   JSON-LD blocks are data, not script, and need no hash.

   This is the LAST page builder before promote.mjs, because every earlier one
   can change an inline script:
     python scripts/film/compose.py        (home.html)
     node scripts/build-content.mjs
     node scripts/build-pages.mjs
     node scripts/build-schema.mjs
     node scripts/build-search-index.mjs
     node scripts/build-csp.mjs            <- here
     node scripts/promote.mjs              (index.html from home.html)

   node scripts/build-csp.mjs --check  exits 1 when any page's policy is missing
   or stale, which is what happens when someone edits an inline script and does
   not rebuild: the browser would block that script on the live site.

   The voice-call page (talk/index.html) is the one deliberate exception: the
   ElevenLabs widget compiles audio worklets from blob: URLs, fetches one
   resampler worklet from jsDelivr, draws images from Google Cloud Storage and
   talks to ElevenLabs over websockets. Those allowances exist on that page only,
   so no other page can load third-party code even if something goes wrong.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

/* Tested before it shipped: injected into all 22 live pages in a real browser,
   with zero violations and every flow still working (the film, the Cal.com
   embed, the ROI calculator, pricing, demo audio, the dial dialog, beacons). */
const BASE = {
  'default-src': ["'none'"],
  'script-src': ["'self'"],
  'script-src-attr': ["'none'"],
  /* 'unsafe-inline' for styles only: about 180 style="" attributes and the film's
     injected <style> blocks depend on it, and CSS injection is low risk here. */
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'"],
  'font-src': ["'self'", 'data:'],
  'media-src': ["'self'"],
  'connect-src': ["'self'", 'https://app.nevamis.ca'],
  'frame-src': ["'none'"],
  'worker-src': ["'none'"],
  'manifest-src': ["'self'"],
  /* Every form on the site is sent by script with preventDefault. A native
     submission could only ever put a visitor's details into a URL. */
  'form-action': ["'none'"],
  'base-uri': ["'none'"],
  'object-src': ["'none'"],
  /* No upgrade-insecure-requests: every URL on the site is already https, and
     the directive also rewrites same-origin requests on http://127.0.0.1, so
     it would break the local server the test suite runs against. */
};

const TALK = {
  'script-src': ["'self'", 'blob:',
    'https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://storage.googleapis.com/eleven-public-cdn/'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'media-src': ["'self'", 'blob:', 'data:'],
  'connect-src': ["'self'", 'https://app.nevamis.ca',
    'https://api.elevenlabs.io', 'wss://api.elevenlabs.io', 'wss://livekit.rtc.elevenlabs.io',
    'https://*.elevenlabs.io', 'wss://*.elevenlabs.io'],
  'worker-src': ["'self'", 'blob:'],
};

const PAGES = [
  ...JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8')).pages.map((p) => p.file),
  'talk/index.html',
];

const START = '<!-- generated:csp -->';
const END = '<!-- /generated:csp -->';
const lf = (s) => s.replace(/\r\n/g, '\n');
const EXEC_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module']);

function inlineScriptHashes(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue;
    const t = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [, ''])[1].toLowerCase();
    if (!EXEC_TYPES.has(t)) continue;
    /* The LF text is what GitHub Pages serves. A Windows checkout served by
       serve.js sends the same script with CRLF, so that variant is allowed
       too; it is the same code, and without it every local test run would
       see the policy block the page's own scripts. */
    for (const body of new Set([m[2], m[2].replace(/\n/g, '\r\n')])) {
      const h = "'sha256-" + crypto.createHash('sha256').update(body, 'utf8').digest('base64') + "'";
      if (!out.includes(h)) out.push(h);
    }
  }
  return out;
}

/* Things a policy with script-src-attr 'none' would silently break, reported
   as build errors so they are fixed in the page instead of discovered live. */
function problems(html) {
  const found = [];
  const noScripts = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const handler = noScripts.match(/<[a-z][^>]*\son[a-z]+\s*=\s*["']/i);
  if (handler) found.push('inline event handler: ' + handler[0].slice(0, 80));
  if (/\b(?:href|src|action)\s*=\s*["']\s*javascript:/i.test(noScripts)) found.push('javascript: URL');
  return found;
}

function policyFor(file, html) {
  const p = JSON.parse(JSON.stringify(BASE));
  if (file === 'talk/index.html') Object.assign(p, TALK);
  if (/<iframe\b[^>]*\bsrc\s*=\s*["']https:\/\/cal\.com\//i.test(html)) p['frame-src'] = ['https://cal.com'];
  p['script-src'] = [...p['script-src'], ...inlineScriptHashes(html)];
  return Object.entries(p).map(([k, v]) => (v.length ? `${k} ${v.join(' ')}` : k)).join('; ');
}

function region(file, html) {
  return [
    START,
    `<meta http-equiv="Content-Security-Policy" content="${policyFor(file, html)}">`,
    /* The full URL (with a proposal's ?to= name, say) never goes to another site. */
    '<meta name="referrer" content="strict-origin-when-cross-origin">',
    END,
  ].join('\n');
}

let changed = 0, stale = 0, failed = 0;
for (const file of PAGES) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { console.error(`ERROR ${file}: listed but missing`); failed++; continue; }
  const raw = fs.readFileSync(full, 'utf8');
  const crlf = raw.includes('\r\n');
  const text = lf(raw);
  const without = text.replace(/\n?<!-- generated:csp -->[\s\S]*?<!-- \/generated:csp -->/, '');

  const bad = problems(without);
  if (bad.length) { console.error(`ERROR ${file}: ${bad.join('; ')}`); failed++; continue; }

  const block = region(file, without);
  let next;
  const charset = without.match(/<meta\s+charset=["']?utf-8["']?\s*\/?>/i);
  if (charset) next = without.replace(charset[0], charset[0] + '\n' + block);
  else if (/<head>/i.test(without)) next = without.replace(/<head>/i, (h) => h + '\n' + block);
  else { console.error(`ERROR ${file}: no <meta charset> or <head> to anchor the policy`); failed++; continue; }

  if (next === text) continue;
  if (CHECK) { console.error(`STALE ${file}: its Content-Security-Policy does not match its inline scripts. Run node scripts/build-csp.mjs`); stale++; continue; }
  fs.writeFileSync(full, crlf ? next.replace(/\n/g, '\r\n') : next);
  changed++;
  console.log(`${file}: policy written`);
}

if (failed) process.exitCode = 1;
if (CHECK) {
  if (stale) process.exitCode = 1;
  else if (!failed) console.log(`CSP check passed: ${PAGES.length} pages carry a current policy.`);
} else {
  console.log(`\n${changed} page(s) updated. Run node scripts/promote.mjs next.`);
}
