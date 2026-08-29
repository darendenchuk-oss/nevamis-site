/* The cinematic stage stylesheet, inlined into the homepage.

   WHY THIS EXISTS AT ALL. assets/cinematic/cine-stage.css was linked from
   home.html's <head>. It was the page's ONLY external stylesheet: every other
   one is inlined by scripts/lib/inline-css.mjs, and that generator's own note
   says why in one sentence, "two linked stylesheets cost a round trip that was
   the whole of the remaining LCP budget on a phone".

   THE LINK WAS ON THE CRITICAL PATH, AND THE COMMENT ABOVE IT SAID IT WAS NOT.
   Measured on 127.0.0.1 against this worktree, Chromium 1440x900:
     baseline                                  first paint 128ms, LCP 128ms
     the same load, that ONE file delayed 2s   first paint 2128ms, LCP 2128ms
   A 1:1 transfer of the sequence stylesheet's latency onto the whole
   document's first pixel, on a page whose directive reads "paint copy and
   poster immediately, never block LCP on the sequence".

   WHY NOT JUST MAKE THE LINK NON-BLOCKING. media="print" onload="this.media"
   removes the block and buys a flash of unstyled stages instead: with every
   sequence pending, cine-stage.css is what gives a pending stage NO scroll
   length, so a late arrival would reflow the homepage by a viewport or more.
   Inlining removes the request entirely and costs about 2 KB gzipped.

   WHY NOT ADD IT TO THE SITE WIDE generated:css BLOCK. That block goes into
   all 22 pages. Only the homepage has stages, and 21 pages paying for stage
   layout is the cost this whole file exists to avoid.

   The region is generated. Edit assets/cinematic/cine-stage.css, then run
   `node scripts/build-cine-css.mjs` (npm run cine:css), which also re-promotes
   index.html. scripts/check-cinematic-home.mjs fails if the region drifts from
   its source, and fails if the <link> ever comes back. */
import { stripComments, squeeze } from './inline-css.mjs';

export const CINE_CSS_OPEN = '<!-- generated:cine-css -->';
export const CINE_CSS_CLOSE = '<!-- /generated:cine-css -->';

/** The <link> tag this replaced. Kept so a page that still has it is
    detectable by name rather than by a stylesheet mysteriously not applying. */
export const LINK_CINE = '<link rel="stylesheet" href="/assets/cinematic/cine-stage.css">';

const NOTE = `${CINE_CSS_OPEN}
<!-- GENERATED. Do not edit: run \`node scripts/build-cine-css.mjs\`.
     Source of truth is assets/cinematic/cine-stage.css, which is still the file
     you edit. This block is that file with its comments stripped.

     It was a <link> until 2026-08-28. Measured then: delaying that one request
     by 2s moved this page's first paint and its Largest Contentful Paint from
     128ms to 2128ms, because a linked stylesheet blocks rendering of the whole
     document and it was the only linked stylesheet left here. The directive for
     these stages says "paint copy and poster immediately, never block LCP on
     the sequence", so it cannot be a request. -->
<style>`;

/** @param {string} cineCss contents of assets/cinematic/cine-stage.css */
export function cineCssBlock(cineCss) {
  return `${NOTE}\n${squeeze(stripComments(cineCss))}\n</style>\n${CINE_CSS_CLOSE}`;
}

/**
 * Put `block` into `html`, whether or not the region already exists. Returns
 * null when there is no recognisable place for it, so a caller fails loudly
 * rather than writing a homepage with no stage layout at all.
 */
export function applyCineCss(html, block) {
  const open = html.indexOf(CINE_CSS_OPEN);
  if (open !== -1) {
    const close = html.indexOf(CINE_CSS_CLOSE, open);
    if (close === -1) return null;
    return html.slice(0, open) + block + html.slice(close + CINE_CSS_CLOSE.length);
  }
  if (html.includes(LINK_CINE)) return html.replace(LINK_CINE, block);
  return null;
}

/** The exact region as it appears in a document, or null. */
export function readCineCssRegion(html) {
  const open = html.indexOf(CINE_CSS_OPEN);
  if (open === -1) return null;
  const close = html.indexOf(CINE_CSS_CLOSE, open);
  if (close === -1) return null;
  return html.slice(open, close + CINE_CSS_CLOSE.length);
}
