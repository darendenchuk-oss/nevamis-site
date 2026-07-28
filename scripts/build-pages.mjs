/* ============================================================
   Injects the shared chrome into every page from _partials/, so
   the nav and footer are canonical by construction rather than by
   hand-copying (which is what let them drift).

   Run after touching _partials/ or adding a page:
     node scripts/build-pages.mjs

   It rewrites the <nav class="main-nav"> block, the <footer>, and
   the mobile callbar in place, then marks the current page's own
   nav and footer links with aria-current="page".

   Legal pages keep their reduced footer: see FOOTER_BASE_ONLY.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const NAV = read('_partials/nav.html').trim();
const FOOTER_FULL = read('_partials/footer.html').trim();

/** Privacy/terms/pricing historically ship the compact footer. */
const FOOTER_BASE_ONLY = new Set(['privacy.html', 'terms.html', 'pricing.html']);

/** Pages that receive the shared chrome. This used to skip 404.html on the
 *  grounds that it had no nav or footer, which stopped being true at some
 *  point without the comment noticing: it carried a hand-copied pair that
 *  drifted, losing the Solutions link and keeping the h1 -> h4 footer heading
 *  skip long after every other page was fixed. A page a real visitor lands on
 *  gets the canonical chrome like any other. */
const PAGES = JSON.parse(read('content-map.json')).pages
  .filter((p) => p.chrome !== false)
  .map((p) => p.file);

/** Mark the current page inside the primary nav only. Footer links stay
 *  byte-identical across pages so the consistency guard can compare them. */
function currentMark(html, file) {
  const href = file === 'index.html' ? '/' : '/' + file;
  const esc = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.replace(/<nav class="main-nav"[\s\S]*?<\/nav>/, (nav) =>
    nav.replace(
      new RegExp(`(<a[^>]*href="${esc}")([^>]*>)`, 'g'),
      (m, a, b) => (b.includes('aria-current') ? m : `${a} aria-current="page"${b}`)));
}

let changed = 0;
for (const file of PAGES) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) { console.warn(`skip ${file} (missing)`); continue; }
  const before = fs.readFileSync(full, 'utf8');
  let html = before;

  if (!/<nav class="main-nav"/.test(html)) {
    console.warn(`skip ${file}: no main-nav to replace`);
    continue;
  }
  html = html.replace(/<nav class="main-nav"[\s\S]*?<\/nav>/, () => NAV);

  const footerBlock = FOOTER_BASE_ONLY.has(file)
    ? baseFooterOf(FOOTER_FULL)
    : FOOTER_FULL;

  if (/<footer class="site-footer">/.test(html)) {
    const oldFooter = html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)[0];

    // Guard: page-specific ids must never live inside shared chrome, because
    // syncing the chrome would silently delete them (this bit pricing.html once).
    const orphaned = [...oldFooter.matchAll(/\sid="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((id) => !footerBlock.includes(`id="${id}"`));
    if (orphaned.length) {
      console.error(
        `\nERROR ${file}: footer contains page-specific id(s) [${orphaned.join(', ')}] ` +
        `that the shared footer does not define.\nMove them into the page body, ` +
        `then re-run. Refusing to overwrite and lose them.\n`);
      process.exitCode = 1;
      continue;
    }

    // replace footer plus any existing callbar that follows it
    html = html.replace(
      /<footer class="site-footer">[\s\S]*?<\/footer>(\s*<a class="callbar"[^>]*>[^<]*<\/a>)?/,
      () => footerBlock);
  }

  html = currentMark(html, file);

  if (html !== before) { fs.writeFileSync(full, html); changed++; console.log(`${file}: chrome synced`); }
  else console.log(`${file}: already current`);
}

/** The compact footer: drop the link columns, keep the base row and callbar. */
function baseFooterOf(fullFooter) {
  return fullFooter.replace(/<div class="cols">[\s\S]*?<\/div>\s*<div class="base">/, '<div class="base">');
}

console.log(`\n${changed} page(s) updated. Run scripts/check-consistency.js to verify.`);
