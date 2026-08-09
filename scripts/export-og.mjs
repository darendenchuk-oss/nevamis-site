/* ============================================================
   Re-export assets/og-default.png from assets/og-default.svg.

     node scripts/export-og.mjs

   WHY THIS EXISTS. The SVG is the editable source and the PNG is what
   every social card, every link preview and every answer-engine card
   actually renders, because no major platform fetches an SVG for
   og:image. So the pair is a copy, and this repository has watched
   copies drift before: the SVG said one thing and the PNG kept showing
   the previous wordmark to everyone who pasted a link.

   Chromium rather than a raster library, because there is no image
   toolchain on this machine and Playwright is already a devDependency.
   deviceScaleFactor is 1 deliberately: 1200x630 is the size Open Graph
   wants, and a 2x export is a 4x file for pixels nobody sees.
   ============================================================ */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets', 'og-default.svg');
const OUT = path.join(root, 'assets', 'og-default.png');

const svg = fs.readFileSync(SRC, 'utf8');
const W = 1200, H = 630;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
/* setContent, not file://, so the SVG is laid out at exactly the card size
   with no scrollbar and no default body margin eating eight pixels of it. */
await page.setContent(
  `<style>html,body{margin:0;padding:0;background:#02080D}svg{display:block}</style>${svg}`,
  { waitUntil: 'load' });
await page.evaluateHandle('document.fonts.ready');
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();

const { size } = fs.statSync(OUT);
console.log(`assets/og-default.png rewritten from og-default.svg: ${W}x${H}, ${size} bytes`);
