/* ============================================================
   THE SCRIPT PRELOADS A PAGE CARRIES, READ FROM ITS OWN SCRIPT TAGS.

   Every published page carries its Content-Security-Policy in a <meta>, and
   a meta policy switches off Chrome's preload scanner: with it, a page's
   scripts were fetched one after another, each only once the one before it
   had arrived and run (launch audit PERF-1, 2026-11-09). On a throttled
   phone the homepage's site.js arrived at about 8.1 s. So
   scripts/build-csp.mjs writes a generated:preload region straight after the
   policy, built here: one <link rel="preload" as="script"> per classic
   <script src> on the page, in document order, so the downloads start at
   once while the tags themselves stay exactly where they are.

   Pure and side-effect free, so build-csp.mjs and the tests that hold the
   committed pages to it read one rule (tests/script-preload.spec.js).

   Not preloaded, on purpose:
   - type="module" scripts. modulepreload for assets/motion/main.js and its
     five imports was measured and gave no median gain, and it slowed site.js
     by competing for the same bandwidth;
   - talk/index.html, whose widget is injected only when the visitor presses
     start;
   - the film's own scripts (assets/film/, on every page that carries them),
     about 255 KB compressed. Preloaded, they took the high priority a
     render-blocking script gets and were fetched ahead of everything else
     the first screen needs. Dropping them is a small win, not an LCP fix
     (Lighthouse 12, mobile, 2026-11-09, medians of 3): simulated TBT fell
     from 449 to 302 ms and the score rose from 0.62 to 0.66, but simulated
     LCP stayed at about 4.5 s against main's 2.9 s. That gap is the
     simulation counting the film's script build as blocking the hero's
     first paint; with real throttling the homepage LCP is about 1.1 s,
     ahead of main's 1.25 s. The first screen is the hero, plain HTML above
     the film that needs none of it, and the film's tags sit after </main>
     where the parser reaches them anyway;
   - anything a comment or an inline script merely mentions.
   ============================================================ */

export const PRELOAD_START = '<!-- generated:preload -->';
export const PRELOAD_END = '<!-- /generated:preload -->';
/* The region as build-csp.mjs writes it, with the newline before it. */
export const PRELOAD_REGION = /\n?<!-- generated:preload -->[\s\S]*?<!-- \/generated:preload -->/;
export const NO_PRELOAD = new Set(['talk/index.html']);
/* A script the page loads but no page preloads: the film's, wherever it is
   carried, with or without the leading slash. */
export const NOT_PRELOADED = /^(?:\.?\/)?assets\/film\//i;

const CLASSIC_TYPES = new Set(['', 'text/javascript', 'application/javascript']);
/* Attributes that decide how the browser fetches a script. A preload made
   without the same ones is a different request, and the browser downloads
   the script twice, so they are carried over as written. */
const FETCH_ATTRS = ['crossorigin', 'integrity', 'referrerpolicy'];

function attrsOf(s) {
  const a = {};
  for (const m of s.matchAll(/([^\s"'=<>`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
    const k = m[1].toLowerCase();
    if (!(k in a)) a[k] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return a;
}

/** The attributes of every classic <script src> the page loads, in document
    order. Read with a scanner rather than one regex: an HTML comment may
    quote a script tag (book.html's do), and an inline script may build one
    in a string, and neither is a script the page loads. */
export function classicScripts(html) {
  const out = [];
  const low = html.toLowerCase();
  let i = 0;
  while (i < html.length) {
    const c = low.indexOf('<!--', i);
    const s = low.indexOf('<script', i);
    if (s < 0) break;
    if (c >= 0 && c < s) {
      const e = html.indexOf('-->', c + 4);
      if (e < 0) break;
      i = e + 3;
      continue;
    }
    const gt = html.indexOf('>', s);
    if (gt < 0) break;
    const a = attrsOf(html.slice(s + '<script'.length, gt));
    const close = low.indexOf('</script', gt);
    i = close < 0 ? html.length : close + '</script'.length;
    if (typeof a.src !== 'string' || !a.src.trim()) continue;
    if (!CLASSIC_TYPES.has((a.type || '').trim().toLowerCase())) continue;
    if ('nomodule' in a) continue;
    out.push(a);
  }
  return out;
}

const escAttr = (v) => v.replace(/&(?![#a-z0-9]+;)/gi, '&amp;').replace(/"/g, '&quot;');

/** The generated:preload region for `file` (its repo path) built from its
    HTML, or '' when the page gets none. */
export function preloadRegion(file, html) {
  if (NO_PRELOAD.has(file)) return '';
  const seen = new Set();
  const links = [];
  for (const a of classicScripts(html)) {
    const src = a.src.trim();
    if (seen.has(src) || NOT_PRELOADED.test(src)) continue;
    seen.add(src);
    const extra = FETCH_ATTRS.filter((k) => k in a)
      .map((k) => (a[k] === '' ? ` ${k}` : ` ${k}="${escAttr(a[k])}"`)).join('');
    links.push(`<link rel="preload" href="${escAttr(src)}" as="script"${extra}>`);
  }
  if (!links.length) return '';
  return [PRELOAD_START, ...links, PRELOAD_END].join('\n');
}
