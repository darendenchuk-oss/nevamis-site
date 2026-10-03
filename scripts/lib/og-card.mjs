/* ============================================================
   THE SOCIAL CARD'S WORDS, READ OFF THE CARD ITSELF

   Every page publishes one share image, assets/og-default.png, exported from
   assets/og-default.svg by scripts/export-og.mjs. Until 2026-10-03 no page
   said what was in it: no og:image:alt and no twitter:image:alt anywhere, so a
   screen reader on a link preview, and an answer engine that reads the alt
   instead of the pixels, got nothing (audit COMPLETENESS-8).

   The alt is the card's own text, joined in reading order. It is DERIVED from
   the SVG rather than typed beside it, because a typed alt is a copy, and this
   repository has watched copies of this exact card drift before (export-og's
   header: the SVG said one thing and the PNG kept the old wordmark). Change a
   line on the card and the alt follows on the next build; scripts/
   build-schema.mjs writes it into every page head, and the drift guard fails
   a page whose alt no longer matches.

   Two callers: build-schema.mjs (writes the tags) and the machine-surfaces
   spec (checks every served page carries exactly this text).
   ============================================================ */

/* Character references the card uses, decoded so the alt reads as the image
   does. Closed list: a reference outside it is left as written rather than
   guessed at, and the spec would show it. */
const REFS = { '&amp;': '&', '&#183;': '·', '&middot;': '·', '&#39;': "'", '&quot;': '"', '&lt;': '<', '&gt;': '>' };

/** The visible lines of the card, top to bottom, as plain text. Each <text>
    element is one line; a <tspan> inside one (the green "v" of the wordmark)
    is part of the same word, so tags are removed without adding a space. */
export function cardLines(svg) {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&#?\w+;/g, (r) => REFS[r] ?? r).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/** The alt text for the card. Lines are joined as sentences, and the middle
    dot the card uses as a visual separator becomes a comma: read aloud, "·"
    is announced as "dot" or skipped, and neither is what the card says. */
export function cardAlt(svg) {
  return cardLines(svg)
    .map((l) => l.replace(/\s*·\s*/g, ', ').replace(/[.]$/, ''))
    .join('. ') + '.';
}

/* The two tags that carry an image on a page, and the alt tag that must
   follow each. Open Graph uses `property`, Twitter uses `name`. */
export const IMAGE_TAGS = [
  { image: /<meta property="og:image" content="[^"]*">/, alt: 'og:image:alt', attr: 'property' },
  { image: /<meta name="twitter:image" content="[^"]*">/, alt: 'twitter:image:alt', attr: 'name' },
];

const escAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** The page with each image tag followed directly by its alt tag, carrying
    `alt`. Idempotent: an existing alt tag anywhere in the page is removed
    first, then one is written straight after its image tag, so a rerun
    changes nothing and a stale alt cannot survive beside a fresh one. A page
    with no image tag is returned unchanged. */
export function applyImageAlt(html, alt) {
  let out = html;
  for (const t of IMAGE_TAGS) {
    const tag = `<meta ${t.attr}="${t.alt}" content="${escAttr(alt)}">`;
    out = out.replace(new RegExp(`[ \\t]*<meta ${t.attr}="${t.alt}" content="[^"]*">\\r?\\n?`, 'g'), '');
    out = out.replace(t.image, (m) => {
      /* Keep the page's own line ending and indentation after the new tag. */
      const nl = /\r\n/.test(out) ? '\r\n' : '\n';
      return `${m}${nl}${tag}`;
    });
  }
  return out;
}
