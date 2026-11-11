/* ============================================================
   WRITES THE RETIRED PAGES AS REDIRECTS TO THE HOMEPAGE.

   Owner decision #81 (2026-11-10) cut nevamis.ca to the homepage, the
   booking page, the legal pages and the 404. Every other page that was ever
   published is listed under `redirects` in content-map.json, and this
   writes each one as the same tiny stub, so an old link, an old ad or a
   search result lands on the homepage instead of a dead end:

     - a refresh to / for every browser,
     - a one-line script for a browser that ignores the refresh,
     - a canonical that names the homepage and a noindex, so a search
       engine drops the old address rather than indexing a stub,
     - a visible sentence with a link, for a browser that does neither.

   It reads no query string and passes none on: a stub only ever sends a
   visitor to /, so a ?to= name on an old proposal link goes nowhere.

   Run: node scripts/build-content.mjs  (npm run build runs it, first)
   build-csp.mjs then writes each stub's Content-Security-Policy, which
   hashes the one inline script. Nothing else touches a stub.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'));

export const STUB = `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nevamis</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="https://nevamis.ca/">
<meta http-equiv="refresh" content="0; url=/">
<script>location.replace("/");</script>
</head>
<body style="background:#02080D;color:#F1F5F2;font-family:system-ui,sans-serif;padding:24px">
<p>This page has moved. Go to <a href="/" style="color:#9FF0CE">nevamis.ca</a>.</p>
</body>
</html>
`;

const kept = new Set(map.pages.map((p) => p.file));
const redirects = Array.isArray(map.redirects) ? map.redirects : [];
let bad = 0;
for (const file of redirects) {
  if (!/^[a-z0-9-]+\.html$/.test(file) || kept.has(file)) {
    console.error(`build-content: ${file} cannot be a redirect (a root .html file that is not also a kept page).`);
    bad++;
  }
}
if (bad) process.exit(1);

let written = 0;
for (const file of redirects) {
  const full = path.join(root, file);
  const before = fs.existsSync(full) ? fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n') : null;
  /* build-csp.mjs adds the policy after <meta charset>; a stub that already
     carries it, and is otherwise the stub, is left alone. */
  const bare = before && before.replace(/\n?<!-- generated:csp -->[\s\S]*?<!-- \/generated:csp -->/, '');
  if (bare === STUB) continue;
  fs.writeFileSync(full, STUB);
  written++;
}
console.log(`${redirects.length} redirect stub(s), ${written} written.`);
