#!/usr/bin/env node
/* Throttled-mobile critical-path measurement for the marketing homepage.
 *
 * Exists because the mobile problem on this site was diagnosed from a single
 * summary line ("LCP 4,960 ms, 680,948 B, byte-identical to desktop") with no
 * way to re-run it, and every optimisation after that has to be attributable
 * to a number. This script produces the whole critical path in one pass:
 * TTFB, FCP, LCP (with the identity of the LCP element), DCL, load, CLS, the
 * byte/request breakdown by asset class, long-task time, and the LCP
 * sub-phases (TTFB / load delay / load time / render delay).
 *
 * Ratios and phases are read FROM THE PAGE via PerformanceObserver, never
 * inferred from file sizes on disk: repository bytes are not runtime bytes,
 * especially once the server compresses.
 *
 *   node scripts/halo-mobile-perf.mjs                 # 5 runs, mobile
 *   node scripts/halo-mobile-perf.mjs --desktop       # desktop contrast
 *   node scripts/halo-mobile-perf.mjs --runs 3 --page /home.html
 *   NEV_DOWN=50000 NEV_LAT=400 NEV_CPU=4 node scripts/halo-mobile-perf.mjs
 *
 * Throttle constants are explicit and printed with every result, because
 * "Slow 4G" names different numbers in different Chrome versions.
 */
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const has = (name) => argv.includes('--' + name);

const DESKTOP = has('desktop');
const RUNS = Number(arg('runs', DESKTOP ? 3 : 5));
const PAGE = arg('page', '/home.html');
const BASE = process.env.NEV_BASE ?? 'http://127.0.0.1:3211';
const LABEL = arg('label', DESKTOP ? 'desktop' : 'mobile');
const OUT = arg('out', '');
const SHOT = arg('shot', '');

/* DevTools' own "Slow 4G"/"Fast 3G" constants have been renamed twice; these
   are stated as raw numbers so a result is reproducible without knowing which
   Chrome shipped which label. Defaults reproduce the recorded baseline
   (~47 KB/s effective, which is where its "680 KB ~= 13.6 s" figure comes from). */
const DOWN = Number(process.env.NEV_DOWN ?? 50000);   // bytes/sec
const UP = Number(process.env.NEV_UP ?? 50000);       // bytes/sec
const LAT = Number(process.env.NEV_LAT ?? 400);       // ms RTT
const CPU = Number(process.env.NEV_CPU ?? 4);         // x slowdown

/* Installed before any page script so nothing that paints early is missed. */
const PROBE = () => {
  window.__perf = { lcp: null, lcpEntry: null, cls: 0, longtasks: [], shifts: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__perf.lcp = e.startTime;
        window.__perf.lcpEntry = {
          startTime: e.startTime,
          size: e.size,
          url: e.url || '',
          loadTime: e.loadTime || 0,
          renderTime: e.renderTime || 0,
          tag: e.element ? e.element.tagName : '',
          id: e.element ? e.element.id : '',
          cls: e.element ? String(e.element.className).slice(0, 80) : '',
          text: e.element ? (e.element.textContent || '').trim().slice(0, 70) : '',
          selector: e.element ? (() => {
            let n = e.element, parts = [];
            while (n && parts.length < 4 && n.tagName) {
              parts.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') +
                (n.className && typeof n.className === 'string' && n.className.trim()
                  ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
              n = n.parentElement;
            }
            return parts.join(' > ');
          })() : '',
        };
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch { /* older engine: LCP simply reports null */ }
  window.__perf.shiftSources = [];
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__perf.cls += e.value;
        window.__perf.shifts++;
        for (const s of e.sources || []) {
          const n = s.node;
          window.__perf.shiftSources.push({
            at: Math.round(e.startTime), value: +e.value.toFixed(5),
            tag: (n && n.tagName) || '?', id: (n && n.id) || '',
            cls: n && typeof n.className === 'string' ? n.className.slice(0, 44) : '',
            from: s.previousRect ? `${Math.round(s.previousRect.y)},${Math.round(s.previousRect.height)}` : '',
            to: s.currentRect ? `${Math.round(s.currentRect.y)},${Math.round(s.currentRect.height)}` : '',
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch { /* no CLS on this engine */ }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__perf.longtasks.push({ start: e.startTime, dur: e.duration });
    }).observe({ type: 'longtask', buffered: true });
  } catch { /* no longtask support */ }
};

const COLLECT = () => {
  const nav = performance.getEntriesByType('navigation')[0] || {};
  const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime ?? null;
  const res = performance.getEntriesByType('resource').map((r) => ({
    name: r.name.replace(location.origin, ''),
    type: r.initiatorType,
    transfer: r.transferSize,
    encoded: r.encodedBodySize,
    decoded: r.decodedBodySize,
    start: +r.startTime.toFixed(1),
    end: +r.responseEnd.toFixed(1),
  }));
  return {
    ttfb: nav.responseStart ?? null,
    htmlEnd: nav.responseEnd ?? null,
    htmlTransfer: nav.transferSize ?? 0,
    htmlEncoded: nav.encodedBodySize ?? 0,
    domInteractive: nav.domInteractive ?? null,
    dcl: nav.domContentLoadedEventEnd ?? null,
    load: nav.loadEventEnd ?? null,
    fcp,
    lcp: window.__perf.lcp,
    lcpEntry: window.__perf.lcpEntry,
    cls: window.__perf.cls,
    shiftSources: window.__perf.shiftSources,
    longtasks: window.__perf.longtasks,
    res,
  };
};

const CLASSES = [
  ['font', (n) => /\.woff2?$/.test(n)],
  ['css', (n) => /\.css(\?|$)/.test(n)],
  ['script', (n) => /\.m?js(\?|$)/.test(n)],
  ['image', (n) => /\.(png|jpe?g|webp|svg|gif|ico|avif)(\?|$)/.test(n)],
  ['audio', (n) => /\.(mp3|wav|ogg|m4a)(\?|$)/.test(n)],
  ['json', (n) => /\.json(\?|$)/.test(n)],
];
const classify = (n) => (CLASSES.find(([, m]) => m(n)) || ['other'])[0];

const median = (a) => {
  const s = [...a].filter((x) => x != null).sort((x, y) => x - y);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const rng = (a) => {
  const s = [...a].filter((x) => x != null).sort((x, y) => x - y);
  return s.length ? [s[0], s[s.length - 1]] : [null, null];
};
const ms = (x) => (x == null ? '   n/a' : Math.round(x).toLocaleString());

const browser = await chromium.launch();
const runs = [];

for (let i = 0; i < RUNS; i++) {
  const ctx = await browser.newContext({
    ...(DESKTOP ? {} : devices['Pixel 5']),
    ...(DESKTOP ? { viewport: { width: 1440, height: 900 } } : {}),
    reducedMotion: 'no-preference',
    bypassCSP: true,
  });
  const page = await ctx.newPage();
  await page.addInitScript(PROBE);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, downloadThroughput: DOWN, uploadThroughput: UP, latency: LAT,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: DESKTOP ? 1 : CPU });

  await page.goto(BASE + PAGE, { waitUntil: 'load', timeout: 180_000 });
  await page.waitForTimeout(1200);   // let a late LCP candidate land
  const data = await page.evaluate(COLLECT);
  runs.push(data);

  if (SHOT && i === 0) {
    fs.mkdirSync(path.dirname(SHOT), { recursive: true });
    await page.waitForTimeout(2500);   // hero timeline settles
    await page.screenshot({ path: SHOT });
  }
  await ctx.close();
}
await browser.close();

/* ---- report ---- */
const pick = (k) => runs.map((r) => r[k]);
const hdr = `${LABEL}  ${PAGE}  runs=${RUNS}  cpu=${DESKTOP ? 1 : CPU}x  down=${DOWN} B/s  up=${UP} B/s  rtt=${LAT}ms`;
console.log('='.repeat(78));
console.log(hdr);
console.log('='.repeat(78));

const metrics = [['TTFB', 'ttfb'], ['FCP', 'fcp'], ['LCP', 'lcp'], ['DOMInteractive', 'domInteractive'], ['DCL', 'dcl'], ['load', 'load']];
for (const [label, key] of metrics) {
  const vals = pick(key);
  const [lo, hi] = rng(vals);
  console.log(`  ${label.padEnd(15)} median ${ms(median(vals)).padStart(8)} ms   [${ms(lo)} .. ${ms(hi)}]`);
}
const clsVals = pick('cls');
console.log(`  ${'CLS'.padEnd(15)} median ${(median(clsVals) ?? 0).toFixed(5).padStart(11)}   [${(rng(clsVals)[0] ?? 0).toFixed(5)} .. ${(rng(clsVals)[1] ?? 0).toFixed(5)}]`);

const lt = runs.map((r) => r.longtasks.reduce((s, t) => s + t.dur, 0));
console.log(`  ${'longtask total'.padEnd(15)} median ${ms(median(lt)).padStart(8)} ms   [${ms(rng(lt)[0])} .. ${ms(rng(lt)[1])}]`);

// LCP element (from the last run; stable across runs on a static page)
const e = runs[runs.length - 1].lcpEntry;
console.log('\n  LCP ELEMENT');
if (!e) console.log('    (none reported)');
else {
  console.log(`    ${e.selector}`);
  console.log(`    tag=${e.tag} id=${e.id || '-'} class=${e.cls || '-'} size=${e.size}px^2`);
  console.log(`    text: ${JSON.stringify(e.text)}`);
  console.log(`    url:  ${e.url || '(no resource — text node)'}`);
  console.log(`    loadTime=${Math.round(e.loadTime)}ms renderTime=${Math.round(e.renderTime)}ms startTime=${Math.round(e.startTime)}ms`);
}

// LCP phase split (Google's four phases)
const last = runs[runs.length - 1];
if (e) {
  const ttfb = median(pick('ttfb'));
  const loadDelay = e.url ? (() => {
    const r = last.res.find((x) => e.url.endsWith(x.name) || x.name.endsWith(e.url.split('/').pop()));
    return r ? r.start - ttfb : 0;
  })() : 0;
  const loadTime = e.url ? (() => {
    const r = last.res.find((x) => e.url.endsWith(x.name) || x.name.endsWith(e.url.split('/').pop()));
    return r ? r.end - r.start : 0;
  })() : 0;
  const renderDelay = median(pick('lcp')) - ttfb - loadDelay - loadTime;
  console.log('\n  LCP PHASES (median LCP)');
  console.log(`    TTFB              ${ms(ttfb).padStart(8)} ms`);
  console.log(`    resource delay    ${ms(loadDelay).padStart(8)} ms`);
  console.log(`    resource load     ${ms(loadTime).padStart(8)} ms`);
  console.log(`    element render    ${ms(renderDelay).padStart(8)} ms   <- everything blocking first paint of the element`);
}

/* Byte + request breakdown, medianed across runs so one flaky request cannot
   move the totals. Includes the HTML document, which resource timing omits. */
const perRun = runs.map((r) => {
  const acc = { html: { n: 1, t: r.htmlTransfer, e: r.htmlEncoded } };
  for (const x of r.res) {
    const c = classify(x.name);
    acc[c] ??= { n: 0, t: 0, e: 0 };
    acc[c].n++; acc[c].t += x.transfer; acc[c].e += x.encoded;
  }
  return acc;
});
const keys = [...new Set(perRun.flatMap((a) => Object.keys(a)))];
console.log('\n  PAYLOAD (transfer bytes on the wire, median of runs)');
let totT = 0, totN = 0;
const rows = keys.map((k) => {
  const t = median(perRun.map((a) => a[k]?.t ?? 0));
  const enc = median(perRun.map((a) => a[k]?.e ?? 0));
  const n = median(perRun.map((a) => a[k]?.n ?? 0));
  totT += t; totN += n;
  return { k, t, enc, n };
}).sort((a, b) => b.t - a.t);
for (const r of rows) {
  console.log(`    ${r.k.padEnd(8)} ${String(r.n).padStart(3)} req  ${r.t.toLocaleString().padStart(9)} B transfer  ${r.enc.toLocaleString().padStart(9)} B encoded`);
}
console.log(`    ${'TOTAL'.padEnd(8)} ${String(totN).padStart(3)} req  ${totT.toLocaleString().padStart(9)} B`);

console.log('\n  TOP 12 REQUESTS BY TRANSFER');
const byName = new Map();
for (const x of last.res) byName.set(x.name, x);
[...byName.values()].sort((a, b) => b.transfer - a.transfer).slice(0, 12)
  .forEach((x) => console.log(`    ${String(x.transfer).padStart(7)} B  ${String(Math.round(x.start)).padStart(6)}->${String(Math.round(x.end)).padStart(6)} ms  ${x.name}`));

if (has('waterfall')) {
  console.log('\n  WATERFALL (start order; * = finished before LCP)');
  const lcpT = median(pick('lcp')) ?? Infinity;
  [...byName.values()].sort((a, b) => a.start - b.start).forEach((x) =>
    console.log(`    ${x.end <= lcpT ? '*' : ' '} ${String(Math.round(x.start)).padStart(6)}->${String(Math.round(x.end)).padStart(6)} ms  ${String(x.transfer).padStart(7)} B  ${x.name}`));
}

if (has('shifts')) {
  console.log('\n  LAYOUT SHIFT SOURCES (last run)');
  for (const s of last.shiftSources.slice(0, 20)) {
    console.log(`    ${String(s.at).padStart(6)} ms  ${String(s.value).padStart(8)}  <${s.tag.toLowerCase()}${s.id ? '#' + s.id : ''}${s.cls ? '.' + s.cls.trim().split(/\s+/)[0] : ''}>  y,h ${s.from} -> ${s.to}`);
  }
}

if (OUT) {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    label: LABEL, page: PAGE, runs: RUNS, cpu: DESKTOP ? 1 : CPU, down: DOWN, up: UP, lat: LAT,
    median: Object.fromEntries(metrics.map(([, k]) => [k, median(pick(k))])),
    range: Object.fromEntries(metrics.map(([, k]) => [k, rng(pick(k))])),
    cls: median(clsVals), longtaskTotal: median(lt),
    lcpEntry: e, payload: rows, totalBytes: totT, totalRequests: totN,
    raw: runs.map((r) => ({ ttfb: r.ttfb, fcp: r.fcp, lcp: r.lcp, dcl: r.dcl, load: r.load, cls: r.cls })),
  }, null, 2));
  console.log(`\n  wrote ${OUT}`);
}
