/* Promote the staging homepage (home.html, noindex) to the live one
   (index.html, indexable + Google site verification). Run after any
   home.html change has been verified:  node scripts/promote.mjs

   The transform is exported as a pure function because the consistency
   guard has to answer "is index.html actually the promotion of the current
   home.html?" — and if it reimplemented these two edits, the guard and the
   promoter could drift apart and both look green while shipping a stale
   homepage. One function, two callers. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROBOTS_STAGING = /<meta name="robots" content="noindex, nofollow">[^\n]*/;
const VERIFICATION = '<meta name="google-site-verification" content="vr6MDC3FTU0lnUvYzz7101_yCm6X10oStXyrIo66Arw">';
const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1">';

/* Pure: staging HTML in, live HTML out. Returns { ok:false, error } rather
   than exiting, so the guard can report a problem without killing itself. */
export function promoteHtml(staging) {
  if (!ROBOTS_STAGING.test(staging)) {
    return { ok: false, error: 'home.html is missing its staging robots line' };
  }
  let s = staging.replace(ROBOTS_STAGING, '<meta name="robots" content="index, follow">');
  if (!s.includes('google-site-verification')) {
    s = s.replace(VIEWPORT, VIEWPORT + '\n' + VERIFICATION);
  }
  return { ok: true, html: s };
}

/* Repo root, not the caller's cwd. This script used to read the bare path
   'home.html', so running it from anywhere but the repo root read the wrong
   file or none at all — a silent no-promote on a site whose whole publish
   step is this script. */
export const siteRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const res = promoteHtml(fs.readFileSync(path.join(siteRoot, 'home.html'), 'utf8'));
  if (!res.ok) {
    console.error(res.error + ' — refusing to promote.');
    process.exit(1);
  }
  fs.writeFileSync(path.join(siteRoot, 'index.html'), res.html);
  console.log('index.html promoted:',
    'robots ok:', /content="index, follow"/.test(res.html),
    '| verification ok:', res.html.includes('google-site-verification'));
}
