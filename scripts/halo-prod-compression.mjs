#!/usr/bin/env node
/* Does the PRODUCTION host compress? Read-only, one page load.
 *
 * The local preview server (serve.js) sends every byte uncompressed, so a
 * payload figure measured against it is a figure about the harness, not about
 * what a visitor downloads. This asks the live host instead and reports
 * encodedBodySize (what crossed the wire) against decodedBodySize (what the
 * parser saw) per resource — the only way to know the compression ratio
 * without trusting a claim about the CDN.
 *
 *   node scripts/halo-prod-compression.mjs [url]
 */
import { chromium } from '@playwright/test';

const URL = process.argv[2] ?? 'https://nevamis.ca/';

const browser = await chromium.launch();
const page = await browser.newPage();
const enc = new Map();
page.on('response', (r) => {
  const h = r.headers();
  enc.set(r.url(), h['content-encoding'] ?? '(none)');
});
await page.goto(URL, { waitUntil: 'load', timeout: 120_000 });
await page.waitForTimeout(1500);

const rows = await page.evaluate(() => {
  const nav = performance.getEntriesByType('navigation')[0];
  const list = [{
    name: location.href, type: 'document',
    encoded: nav.encodedBodySize, decoded: nav.decodedBodySize, transfer: nav.transferSize,
  }];
  for (const r of performance.getEntriesByType('resource')) {
    list.push({ name: r.name, type: r.initiatorType, encoded: r.encodedBodySize, decoded: r.decodedBodySize, transfer: r.transferSize });
  }
  return list;
});

let tEnc = 0, tDec = 0, tTr = 0;
console.log(`${URL}\n`);
console.log('  content-encoding   encoded      decoded   ratio  resource');
for (const r of rows.sort((a, b) => b.decoded - a.decoded)) {
  tEnc += r.encoded; tDec += r.decoded; tTr += r.transfer;
  const ratio = r.decoded > 0 ? (r.encoded / r.decoded) : 1;
  const short = r.name.replace(/^https?:\/\/[^/]+/, '');
  console.log(`  ${(enc.get(r.name) ?? '?').padEnd(16)} ${String(r.encoded).padStart(9)} ${String(r.decoded).padStart(12)}  ${ratio.toFixed(2).padStart(6)}  ${short.slice(0, 60)}`);
}
console.log(`\n  TOTAL  encoded=${tEnc.toLocaleString()} B  decoded=${tDec.toLocaleString()} B  transfer=${tTr.toLocaleString()} B  requests=${rows.length}`);
console.log(`  overall compression ratio: ${(tEnc / Math.max(tDec, 1)).toFixed(3)}`);
await browser.close();
