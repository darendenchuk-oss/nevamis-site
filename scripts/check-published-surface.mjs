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
const MEDIA = /\.(png|gif|jpe?g|webp|svg|mp4|webm)$/i;
const DIRS = [
  { dir: 'assets/', ok: () => true },
  { dir: 'talk/', ok: (f) => f === 'talk/index.html' || f === 'talk/talk.js' },
  { dir: '.well-known/', ok: (f) => f === '.well-known/security.txt' },
  /* Only images: email signatures already sent embed
     https://nevamis.ca/brand/signature/nevamis-signature.gif. */
  { dir: 'brand/', ok: (f) => MEDIA.test(f) },
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
if (unexpected.length) {
  const byTop = {};
  for (const f of unexpected) { const t = f.split('/')[0]; (byTop[t] = byTop[t] || []).push(f); }
  console.error(`PUBLISHED BUT NOT ALLOWED (${unexpected.length} files). Exclude them in _config.yml, or allow them in scripts/check-published-surface.mjs if they are meant to be public:`);
  for (const [t, files] of Object.entries(byTop)) console.error(`  ${t}: ${files.length} file(s), e.g. ${files.slice(0, 3).join(', ')}`);
}
if (missing.length || unexpected.length) process.exitCode = 1;
else console.log(`Published surface OK: ${published.length} files, all intended.`);
