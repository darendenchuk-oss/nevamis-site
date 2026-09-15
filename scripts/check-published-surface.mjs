#!/usr/bin/env node
/* ============================================================
   WHAT DOES NEVAMIS.CA ACTUALLY PUBLISH?

   GitHub Pages serves this repository through Jekyll with a DENY list:
   _config.yml says "everything not listed here is served verbatim". So every
   new top-level folder is public the moment it is committed, unless someone
   remembers to exclude it. That is how film-v2/ and the brand/ working files
   went live: an After Effects project, a cost plan with vendor balances,
   checkpoint notes with local machine paths, build scripts.

   This guard turns the deny list into an allow list after the fact. It works
   out the published set the way Jekyll does (scripts/lib/published-files.mjs)
   and fails on anything outside the intended surface below. Publishing
   something new is then a visible decision in the same change, not an
   accident.

     node scripts/check-published-surface.mjs     exit 0 clean, 1 unexpected
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedFiles } from './lib/published-files.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* The intended public surface. Root pages come from content-map.json, so a
   page registered there is allowed without touching this file. */
const PAGES = new Set(JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8')).pages.map((p) => p.file));
const ROOT_FILES = new Set([
  'CNAME', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'site.js', 'motion.js', 'pricing-config.js', 'roadmap-config.js',
  'search-index.json', 'content-map.json', 'llms.txt', 'sitemap.xml', 'robots.txt',
  'THIRD_PARTY_NOTICES.md',
  /* Twilio fetches this for every Nevamis phone number. It must stay published. */
  'ring.xml',
]);
/* assets/ holds what pages load: media, fonts, scripts, styles and data. No
   documents. An HTML page (or an SVG carrying script) served from assets/ would
   run on the nevamis.ca origin without the Content-Security-Policy every page
   gets from scripts/build-csp.mjs, because that policy travels inside the page. */
const ASSET_TYPES = /\.(png|gif|jpe?g|webp|avif|ico|mp4|webm|mp3|wav|ogg|m4a|woff2?|ttf|otf|js|css|json|svg)$/i;
/* An SVG opened directly is a document. One with no script, no event handler
   attribute, no foreignObject and no javascript: URL cannot run anything. */
function svgProblem(f) {
  const t = fs.readFileSync(path.join(root, f), 'utf8');
  if (/<(?:[\w-]+:)?script\b/i.test(t)) return 'a <script>';
  if (/\son[a-z]+\s*=/i.test(t)) return 'an event handler attribute';
  if (/<(?:[\w-]+:)?foreignObject\b/i.test(t)) return 'a <foreignObject>';
  if (/javascript\s*:/i.test(t)) return 'a javascript: URL';
  return '';
}
const unsafeSvg = [];
function assetOk(f) {
  if (!ASSET_TYPES.test(f)) return false;
  if (!/\.svg$/i.test(f)) return true;
  const why = svgProblem(f);
  if (why) unsafeSvg.push(`${f} contains ${why}`);
  return !why;
}
/* Exactly the brand files something outside this repository loads. The email
   signature already sent embeds this URL; nothing else in brand/ is loaded by
   a page, the engine or a sent email. Adding one here is a deliberate choice. */
const BRAND = new Set(['brand/signature/nevamis-signature.gif']);
const DIRS = [
  { dir: 'assets/', ok: assetOk },
  { dir: 'talk/', ok: (f) => f === 'talk/index.html' || f === 'talk/talk.js' },
  { dir: '.well-known/', ok: (f) => f === '.well-known/security.txt' },
  { dir: 'brand/', ok: (f) => BRAND.has(f) },
];
/* Must stay reachable, or a phone line, the domain or the security contact breaks. */
const REQUIRED = ['ring.xml', 'CNAME', 'assets/ringback-tone.wav', '.well-known/security.txt', 'talk/index.html'];

const published = publishedFiles(root);
const set = new Set(published);

const unexpected = published.filter((f) => {
  if (!f.includes('/')) return !(PAGES.has(f) || ROOT_FILES.has(f));
  const d = DIRS.find((x) => f.startsWith(x.dir));
  return !d || !d.ok(f);
});
const missing = REQUIRED.filter((f) => !set.has(f));

if (missing.length) console.error('MUST BE PUBLISHED but is not (excluded, hidden or untracked):\n  ' + missing.join('\n  '));
if (unsafeSvg.length) console.error('SVG THAT CAN RUN CODE on the nevamis.ca origin. Remove the script, handler, foreignObject or javascript: URL:\n  ' + unsafeSvg.join('\n  '));
if (unexpected.length) {
  const byTop = {};
  for (const f of unexpected) { const t = f.split('/')[0]; (byTop[t] = byTop[t] || []).push(f); }
  console.error(`PUBLISHED BUT NOT ALLOWED (${unexpected.length} files). Exclude them in _config.yml, or allow them in scripts/check-published-surface.mjs if they are meant to be public:`);
  for (const [t, files] of Object.entries(byTop)) console.error(`  ${t}: ${files.length} file(s), e.g. ${files.slice(0, 3).join(', ')}`);
}
if (missing.length || unexpected.length) process.exitCode = 1;
else console.log(`Published surface OK: ${published.length} files, all intended.`);
