#!/usr/bin/env node
/* Regenerates sitemap.xml and its sidecar, config/sitemap-hashes.json.
   Run: node scripts/gen-sitemap.mjs   (writes both in place; commit both)

   RUN IT LAST, after every writer of a page: python scripts/film/compose.py
   (for a homepage edit), then build-content, build-pages, build-schema,
   build-csp, promote and build-search-index (the order
   check-generator-drift.mjs runs them in). This script records a hash of each
   page's bytes as they are at that moment. Run before build-csp or promote,
   it records half-built pages, gives pages that end up unchanged today's
   date, and CI fails on every page a later step rewrote. Then commit the
   pages together with sitemap.xml and the sidecar.

   On a merge or rebase conflict in sitemap.xml or the sidecar, do not merge
   the lines by hand. Finish resolving the pages, run this script, and commit
   what it writes. It rewrites sitemap.xml whole, and a sidecar that still
   holds conflict markers counts as no sidecar (every page takes its git
   date); if you took one side of the sidecar instead, pages whose bytes match
   a recorded hash keep their date and the rest get a fresh one.

   A <lastmod> is the date the change was committed (or regenerated) on its
   branch, not the date it went live: squash, rebase and merge commits carry
   the sidecar through unchanged. A branch that sits for a week advertises
   the week-old date once merged. That is the price of a check that needs no
   git history, and it errs early, never late.

   A <lastmod> should move when, and only when, the page's content moves.
   Until 2026-09-24 this script stamped each page's latest git commit date
   (WEB-226), which is right on the day it runs and wrong the moment a page
   changes without a rerun: every URL said 2026-09-19 while eight pages had
   changed on 09-20 and eleven on 09-23. Nothing noticed, because nothing could
   check a date without git, and CI checks out a shallow clone in which every
   file's last commit is HEAD.

   So the sidecar records, per sitemap page, the sha256 of its bytes (with \r
   removed) and the lastmod that goes with those bytes. Per page, on each run:
   - stored hash equals the current hash: keep the stored lastmod, whatever
     git or the calendar says, so a rerun never invents a change;
   - otherwise the content moved, so pick a new date: the file's own commit
     date when it has no uncommitted change (the edit is in HEAD, so that
     commit is when it happened), else today (the edit is being committed
     now), and record the new hash.
   With no sidecar at all, every page takes the second branch, which is the
   old git-date behaviour.

   scripts/check-generator-drift.mjs recomputes the hashes, with no git and no
   clock, and fails when a page no longer matches its recorded hash or when
   sitemap.xml and the sidecar disagree. Squash, merge and rebase merges all
   carry the sidecar through unchanged, so main stays green whichever is used. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SIDECAR, SITEMAP, sitemapPages, pageHash, renderSitemap, readSidecar, isLastmod } from './lib/sitemap.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/* The author's calendar date, not UTC: an evening run in Canada must not
   stamp tomorrow. */
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* "Clean" means tracked and identical to HEAD, staged or not. `git diff HEAD`
   rather than `git status --porcelain`: core.autocrlf is true here and every
   builder writes LF, so porcelain lists a freshly rebuilt page as modified
   even when its content is byte-for-byte HEAD's (check-generator-drift.mjs
   explains the same trap). git diff compares the normalised blobs. */
function clean(file) {
  try {
    git(['ls-files', '--error-unmatch', '--', file]);
    git(['diff', '--quiet', 'HEAD', '--', file]);
    return true;
  } catch { return false; }
}

function commitDate(file) {
  try {
    const out = git(['log', '-1', '--format=%cs', '--', file]).trim();
    if (isLastmod(out)) return out;
  } catch { /* fall through */ }
  return null;
}

/* A sidecar that does not parse (conflict markers from a merge, say) is
   treated as no sidecar: every page takes its git date, as on the first run. */
let stored = {};
try {
  const sc = readSidecar(root);
  if (sc && sc.pages && typeof sc.pages === 'object' && !Array.isArray(sc.pages)) stored = sc.pages;
} catch (e) {
  console.warn(`${SIDECAR} did not parse (${String(e.message).split('\n')[0].slice(0, 120)}); every page takes its git date.`);
}
const pages = {};
const moved = [];
const rows = sitemapPages(root).map(({ file, loc, priority }) => {
  const sha256 = pageHash(root, file);
  const prev = stored[file];
  let lastmod;
  if (prev && prev.sha256 === sha256 && isLastmod(prev.lastmod)) {
    lastmod = prev.lastmod;
  } else {
    lastmod = (clean(file) && commitDate(file)) || today();
    moved.push(`${file} ${prev ? prev.lastmod + ' -> ' : ''}${lastmod}`);
  }
  pages[file] = { sha256, lastmod };
  return { loc, lastmod, priority };
});

fs.writeFileSync(path.join(root, SITEMAP), renderSitemap(rows));
fs.writeFileSync(path.join(root, SIDECAR), JSON.stringify({
  _comment: 'Written by scripts/gen-sitemap.mjs; do not edit by hand. Per sitemap page: sha256 of the file with \\r removed, and the <lastmod> sitemap.xml gives it. '
    + 'scripts/check-generator-drift.mjs fails when a page no longer matches its hash. Fix: node scripts/gen-sitemap.mjs, then commit sitemap.xml and this file.',
  pages,
}, null, 2) + '\n');
console.log(`sitemap.xml regenerated for ${rows.length} pages. `
  + (moved.length ? `New lastmod for ${moved.length}: ${moved.join(', ')}` : 'No page changed, so no lastmod moved.'));
