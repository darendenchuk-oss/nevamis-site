/* Turn the two render-blocking stylesheets into one inline <style> block.

   Shared by the page generator and the performance harness so an experiment
   and the thing that ships cannot diverge: whatever the harness measured is
   produced by this function, and so is whatever build-pages.mjs writes.

   Two things have to be right or the output is silently wrong:

   1. fonts.css carries ten RELATIVE url() references. It lives in
      assets/fonts/, so `url(atkinson-...woff2)` resolves against that
      directory. Inlined into a document at the site root the same text
      resolves against the ROOT, and every font 404s while the page still
      looks almost correct because the metric-matched fallbacks cover it.
      They are rewritten here. site.css has no url() at all, so it is copied
      verbatim.

   2. Order. fonts.css then site.css then the page's own <style>, which is the
      order the <link> tags had. Anything else changes the cascade. */

const FONT_DIR = "assets/fonts/";

/** Strip comments without touching strings or url() payloads. A regex over
 *  the whole file would eat any `/*` that appears inside a quoted string. */
export function stripComments(css) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < css.length) {
    const c = css[i];
    const n = css[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") { out += css[i + 1] ?? ""; i += 2; continue; }
      if (c === quote) quote = null;
      i++;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; out += c; i++; continue; }
    if (c === "/" && n === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end === -1 ? css.length : end + 2;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** Collapse runs of whitespace left behind by comment removal. Deliberately
 *  conservative: it does not touch whitespace inside strings, and it does not
 *  try to be a minifier. The win here is the prose, not the spaces. */
export function squeeze(css) {
  return css
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l, idx, all) => !(l === "" && all[idx - 1] === ""))
    .join("\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** fonts.css url() are relative to assets/fonts/; inlined they must not be. */
export function rewriteFontUrls(css) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
    if (/^(https?:|data:|\/|assets\/)/i.test(u)) return m;
    return `url(${q}${FONT_DIR}${u}${q})`;
  });
}

/**
 * @param {{fontsCss: string, siteCss: string, strip?: boolean}} o
 * @returns {string} the contents for a single <style> element
 */
export function buildInlineCss({ fontsCss, siteCss, strip = true }) {
  let fonts = rewriteFontUrls(fontsCss);
  let site = siteCss;
  if (strip) {
    fonts = squeeze(stripComments(fonts));
    site = squeeze(stripComments(site));
  }
  return fonts + "\n" + site;
}

/* ------------------------------------------------------------------ */
/* The canonical head region                                           */
/* ------------------------------------------------------------------ */

export const CSS_OPEN = "<!-- generated:css -->";
export const CSS_CLOSE = "<!-- /generated:css -->";

/** The two <link> tags this replaced. Kept so the one-time migration can find
 *  them, and so a page that somehow still has them is detectable. */
export const LINK_FONTS = '<link rel="stylesheet" href="assets/fonts/fonts.css">';
export const LINK_SITE = '<link rel="stylesheet" href="assets/motion/site.css">';

const NOTE = `${CSS_OPEN}
<!-- GENERATED. Do not edit: run \`node scripts/build-pages.mjs\`.
     Source of truth is assets/fonts/fonts.css + assets/motion/site.css, which
     are still the files you edit. This block is those two files, comments
     stripped, inlined.

     Why inline rather than linked. The LCP element on every page is TEXT, and
     text cannot paint until the render-blocking stylesheet chain resolves, so
     LCP was exactly equal to FCP on every page measured. Two linked
     stylesheets means the browser reads the HTML, discovers them, and spends a
     second round trip before it may paint anything at all. On a 400 kbps link
     that round trip was the entire remaining budget: pricing 2,552 ms, demo
     2,664 ms, pilot 2,504 ms in production against a 2,500 ms target.

     Inlining removes the round trip, and it is also SMALLER. The comments in
     those two files are excellent and are nearly half their compressed weight
     (15,601 bytes gzipped with prose, 8,251 without). Stripping them for the
     copy the browser gets, while the source keeps every word, means first
     visit transfers about 8 KB LESS than before across one request instead of
     two.

     The cost, stated plainly: site.css is no longer a separately cached file,
     so a visitor reading three pages transfers it three times, about 9 KB more
     across that session. First impressions are worth more than the third page
     of a session, and the guard in check-consistency.js keeps this block equal
     to its sources so it cannot drift. -->
<style>`;

/** The full region, ready to substitute into a document head. */
export function headCssBlock({ fontsCss, siteCss }) {
  return `${NOTE}\n${buildInlineCss({ fontsCss, siteCss, strip: true })}\n</style>\n${CSS_CLOSE}`;
}

/**
 * Put `block` into `html`, whether or not the region already exists.
 * Returns null when the document has no recognisable place for it, so callers
 * can fail loudly rather than write a page with no styles at all.
 */
export function applyHeadCss(html, block) {
  const open = html.indexOf(CSS_OPEN);
  if (open !== -1) {
    const close = html.indexOf(CSS_CLOSE, open);
    if (close === -1) return null;
    return html.slice(0, open) + block + html.slice(close + CSS_CLOSE.length);
  }
  if (html.includes(LINK_FONTS)) {
    return html.replace(LINK_FONTS, block).replace(LINK_SITE + "\n", "").replace(LINK_SITE, "");
  }
  return null;
}

/** Read the two sources from a checkout root. */
export function readCssSources(fs, path, root) {
  return {
    fontsCss: fs.readFileSync(path.join(root, "assets/fonts/fonts.css"), "utf8"),
    siteCss: fs.readFileSync(path.join(root, "assets/motion/site.css"), "utf8"),
  };
}
