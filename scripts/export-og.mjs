/* ============================================================
   Re-export assets/og-default.png from scripts/og-default.svg.

     node scripts/export-og.mjs

   WHY THIS EXISTS. The SVG is the editable source and the PNG is what
   every social card, every link preview and every answer-engine card
   actually renders, because no major platform fetches an SVG for
   og:image. So the pair is a copy, and this repository has watched
   copies drift before: the SVG said one thing and the PNG kept showing
   the previous wordmark to everyone who pasted a link.

   WHY THE SVG LIVES HERE AND NOT IN assets/ (2026-10-03, audit
   COMPLETENESS-7). Everything in assets/ is served, and nothing a visitor
   loads names the SVG: it is a build input, read by this script and by
   scripts/lib/og-card.mjs. Served from assets/ it was a public file with no
   page behind it. scripts/ is excluded from the published site, and
   check-published-surface.mjs now fails any file in assets/ that no served
   page, script, stylesheet or XML file loads.

   Chromium rather than a raster library, because there is no image
   toolchain on this machine and Playwright is already a devDependency.
   deviceScaleFactor is 1 deliberately: 1200x630 is the size Open Graph
   wants, and a 2x export is a 4x file for pixels nobody sees.

   THE SITE'S OWN TYPEFACES (2026-10-03, audit COMPLETENESS-8). The card was
   set in Georgia and Courier New, so every shared link looked like a
   different company from the page it opened. It now names Bricolage
   Grotesque, Atkinson Hyperlegible and Spline Sans Mono, the three families
   the site serves. setContent gives the page no origin from which
   assets/fonts/*.woff2 could load, so the latin files are inlined below as
   data: URIs. And the export REFUSES rather than falls back: if a family the
   SVG names did not load, Chromium would quietly paint the next name in the
   font-family list, and the PNG every link preview shows would be in the
   wrong face with nothing saying so.

   The card's words are also its alt text: scripts/lib/og-card.mjs reads the
   SVG, and scripts/build-schema.mjs writes og:image:alt and
   twitter:image:alt into every page from it. After editing the SVG, run this
   script AND the build chain (npm run build), so the image and the text that
   describes it change together.
   ============================================================ */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'scripts', 'og-default.svg');
const OUT = path.join(root, 'assets', 'og-default.png');

const svg = fs.readFileSync(SRC, 'utf8');
const W = 1200, H = 630;

/* The latin subset of each family is enough: every glyph on the card is in
   it, and the check below proves the face is in use rather than assuming. */
const FACES = [
  { family: 'Bricolage Grotesque', weight: '200 800', file: 'bricolage-grotesque-variable-latin.woff2' },
  { family: 'Atkinson Hyperlegible', weight: '400', file: 'atkinson-hyperlegible-400-latin.woff2' },
  { family: 'Atkinson Hyperlegible', weight: '700', file: 'atkinson-hyperlegible-700-latin.woff2' },
  { family: 'Spline Sans Mono', weight: '300 700', file: 'spline-sans-mono-variable-latin.woff2' },
];
const faceCss = FACES.map((f) => {
  const b64 = fs.readFileSync(path.join(root, 'assets', 'fonts', f.file)).toString('base64');
  return `@font-face{font-family:'${f.family}';font-weight:${f.weight};src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
}).join('');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
/* setContent, not file://, so the SVG is laid out at exactly the card size
   with no scrollbar and no default body margin eating eight pixels of it. */
await page.setContent(
  `<style>${faceCss}html,body{margin:0;padding:0;background:#02080D}svg{display:block}</style>${svg}`,
  { waitUntil: 'load' });
/* Each family the SVG names first in a font-family list must be loaded and
   in use. document.fonts.ready resolves when loading settles, including when
   it settled on nothing, so it proves nothing on its own. */
const named = [...new Set([...svg.matchAll(/font-family="'([^']+)'/g)].map((m) => m[1]))];
const missing = await page.evaluate(async (families) => {
  await document.fonts.ready;
  const loaded = new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')));
  return families.filter((f) => !loaded.has(f));
}, named);
if (missing.length) {
  await browser.close();
  console.error(`refusing to export: the card names ${missing.join(', ')}, which did not load, so the PNG would be in a fallback face.`);
  process.exit(1);
}
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

const { size } = fs.statSync(OUT);
console.log(`assets/og-default.png rewritten from og-default.svg: ${W}x${H}, ${size} bytes`);
