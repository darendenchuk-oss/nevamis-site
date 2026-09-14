/* ============================================================
   WHICH TRACKED FILES GITHUB PAGES ACTUALLY SERVES AT NEVAMIS.CA

   One answer, shared by check-published-surface.mjs (is anything public that
   should not be?) and check-critical-surface.mjs (where do the public files
   point?). Two copies of this rule would drift, and a guard reading the wrong
   set is green for the wrong reason.

   Jekyll's rule, as far as this repository uses it:
   - a path segment starting with ".", "_" or "#", or ending in "~", is not
     served, unless the path is under an `include:` entry;
   - an `exclude:` entry ending in "/" removes that directory; any other entry
     removes that exact path (and anything under it).
   Glob patterns in `exclude:` are NOT understood here. That fails closed: a
   file excluded only by a glob still counts as published, so the surface
   guard reports it instead of silently trusting it.

   _config.yml is read line by line. It is checked out with CRLF on Windows,
   and a regex built on `.` stops at the \r, which read the whole exclude list
   as empty on the first run of this guard.
   ============================================================ */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function jekyllLists(root) {
  const lists = {};
  let key = null;
  for (const raw of fs.readFileSync(path.join(root, '_config.yml'), 'utf8').split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(raw)) continue;
    const top = raw.match(/^([A-Za-z_][\w-]*):/);
    if (top) { key = top[1]; lists[key] = lists[key] || []; continue; }
    const item = raw.match(/^\s+-\s*(.+?)\s*$/);
    if (item && key) lists[key].push(item[1].replace(/\s+#.*$/, '').replace(/^["']|["']$/g, ''));
  }
  return { exclude: lists.exclude || [], include: lists.include || [] };
}

export function publishedFiles(root) {
  const { exclude, include } = jekyllLists(root);
  const under = (f, entry) => { const e = entry.replace(/\/$/, ''); return f === e || f.startsWith(e + '/'); };
  const included = (f) => include.some((inc) => under(f, inc));
  const excluded = (f) => exclude.some((e) => under(f, e));
  const hidden = (f) => !included(f) && f.split('/').some((seg) => /^[._#]/.test(seg) || seg.endsWith('~'));
  return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter(Boolean)
    .filter((f) => !excluded(f) && !hidden(f));
}
