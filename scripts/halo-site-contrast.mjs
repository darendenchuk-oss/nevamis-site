#!/usr/bin/env node
/* Measures real contrast ratios for every interactive control on the site.
 *
 * Adapted from ../nevamis-halo/scripts/halo-contrast-check.mjs, which exists
 * because token strings lie: an estimate in that repo said "roughly 1.3:1" for
 * something that measures 1.41:1. Everything here is read from getComputedStyle
 * IN THE PAGE and flattened against the real ancestor backdrop.
 *
 * Two things this adds over the app version, both forced by this site:
 *
 *  1. EFFECTIVE BOUNDARY. #siteSearchInput has border-width:0 and a transparent
 *     background, so measured alone it is 1.00:1 — but a sighted visitor sees
 *     the boundary drawn by its .hs-wrap parent. WCAG 1.4.11 is about what the
 *     user can perceive, so the check walks up to 3 ancestors for a drawn
 *     border and reports both the control's own boundary and the effective one.
 *     A control passes on the effective boundary; a control whose own boundary
 *     is 1.00 is still flagged in the "own" column so the fix is not hidden.
 *
 *  2. STATES. default / hover / focus / filled / disabled / error, plus a
 *     forced-colors pass that only asks whether a real border-width survives —
 *     in forced-colors the OS palette replaces every colour, so a control whose
 *     boundary is a background tint or a box-shadow disappears entirely.
 *
 *   node scripts/halo-site-contrast.mjs
 *   node scripts/halo-site-contrast.mjs --pages /home.html,/pricing.html
 */
import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const BASE = process.env.NEV_BASE ?? 'http://127.0.0.1:3211';
const PAGES = arg('pages', '/home.html,/pricing.html,/demo.html,/proposal.html,/coming-soon.html,/pilot.html').split(',');
const SEL = 'input:not([type=hidden]), select, textarea, button, a.btn, .motion-toggle-btn, .btn-ghost, [role=combobox]';

const MEASURE = (sel) => {
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  const parse = (s) => (String(s).match(/[\d.]+/g) ?? []).map(Number);
  const over = (fg, bgRgb) => {
    const f = parse(fg);
    if (f.length < 3) return bgRgb;
    const a = f.length > 3 ? f[3] : 1;
    return [0, 1, 2].map((i) => Math.round(a * f[i] + (1 - a) * bgRgb[i]));
  };
  const backdrop = (el) => {
    let n = el.parentElement;
    while (n) {
      const p = parse(getComputedStyle(n).backgroundColor);
      if (p.length >= 3 && (p.length < 4 || p[3] > 0.95)) return p.slice(0, 3);
      n = n.parentElement;
    }
    const b = parse(getComputedStyle(document.body).backgroundColor);
    return b.length >= 3 ? b.slice(0, 3) : [0, 0, 0];
  };
  /* A visible boundary can be a border, an inset box-shadow, or a fill that
     differs enough from the page. Only border and fill are colour-measurable
     here; an outline is reported separately because it exists only on focus. */
  const boundaryOf = (el, bd) => {
    const cs = getComputedStyle(el);
    const bw = Math.max(parseFloat(cs.borderTopWidth) || 0, parseFloat(cs.borderLeftWidth) || 0);
    const border = bw > 0 ? +ratio(over(cs.borderTopColor, bd), bd).toFixed(2) : 1;
    const fill = +ratio(over(cs.backgroundColor, bd), bd).toFixed(2);
    return { border, fill, bw: +bw.toFixed(2), best: Math.max(border, fill) };
  };

  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll(sel)) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;

    const bd = backdrop(el);
    const own = boundaryOf(el, bd);

    // Effective boundary: this control, or the nearest ancestor within 3 that draws one.
    let eff = own, effFrom = 'self', n = el.parentElement, hops = 0;
    while (n && hops < 3 && eff.best < 3) {
      const b = boundaryOf(n, backdrop(n));
      if (b.bw > 0 && b.border > eff.best) { eff = b; effFrom = n.tagName.toLowerCase() + (n.className ? '.' + String(n.className).trim().split(/\s+/)[0] : ''); }
      n = n.parentElement; hops++;
    }

    const fillRgb = over(cs.backgroundColor, bd);
    const id = el.id ? '#' + el.id : '';
    const cls = String(el.className || '').trim().split(/\s+/).slice(0, 2).join('.');
    const key = `${el.tagName}${id}.${cls}|${cs.borderTopColor}|${cs.backgroundColor}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      name: (el.tagName.toLowerCase() + id + (cls ? '.' + cls : '')).slice(0, 40),
      fontSize: parseFloat(cs.fontSize),
      ownBorder: own.border, ownFill: own.fill, ownBw: own.bw,
      eff: +eff.best.toFixed(2), effFrom,
      text: +ratio(over(cs.color, fillRgb), fillRgb).toFixed(2),
      outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0
        ? +ratio(over(cs.outlineColor, bd), bd).toFixed(2) : null,
    });
  }
  return out;
};

const STATES = ['default', 'hover', 'focus', 'filled', 'disabled', 'error'];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();

let failures = 0, checked = 0;
const failing = [];

for (const route of PAGES) {
  await page.emulateMedia({ forcedColors: null });
  const resp = await page.goto(BASE + route, { waitUntil: 'load', timeout: 60_000 }).catch(() => null);
  if (!resp) { console.log(`\n=== ${route} === (unreachable)`); continue; }
  await page.waitForTimeout(400);
  console.log(`\n=== ${route} ===`);
  console.log('  state     control                                   ownBd  ownFill   eff   from');

  for (const state of STATES) {
    // Put the page into the state, then measure everything at once.
    await page.evaluate(({ sel, state }) => {
      for (const el of document.querySelectorAll(sel)) {
        el.disabled = false;
        el.removeAttribute('aria-invalid');
        el.classList.remove('is-error', 'error', 'invalid');
        if (state === 'filled' && 'value' in el && el.type !== 'submit' && el.type !== 'button') {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = el.type === 'number' ? '12' : 'abc';
        }
        if (state === 'disabled' && 'disabled' in el) el.disabled = true;
        if (state === 'error') { el.setAttribute('aria-invalid', 'true'); el.classList.add('is-error'); }
      }
    }, { sel: SEL, state });

    if (state === 'hover' || state === 'focus') {
      const first = page.locator(SEL).first();
      try {
        if (state === 'hover') await first.hover({ timeout: 3000 });
        else await first.focus({ timeout: 3000 });
      } catch { /* nothing focusable here */ }
    }

    const rows = await page.evaluate(MEASURE, SEL);
    for (const r of rows) {
      checked++;
      const need = 3;
      const bad = r.eff < need && state !== 'disabled';   // 1.4.11 exempts inactive controls
      if (bad) { failures++; failing.push(`${route} ${state} ${r.name} eff=${r.eff}`); }
      const flag = bad ? 'FAIL' : ' ok ';
      console.log(`  ${flag} ${state.padEnd(9)} ${r.name.padEnd(40)} ${String(r.ownBorder).padStart(5)} ${String(r.ownFill).padStart(7)} ${String(r.eff).padStart(6)}   ${r.effFrom}`);
    }
  }

  // forced-colors: the only question is whether a real border survives.
  await page.emulateMedia({ forcedColors: 'active' });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(300);
  const fc = await page.evaluate((sel) => {
    const out = [];
    for (const el of document.querySelectorAll(sel)) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      let bw = Math.max(parseFloat(cs.borderTopWidth) || 0, parseFloat(cs.borderLeftWidth) || 0);
      let from = 'self', n = el.parentElement, hops = 0;
      while (n && hops < 3 && bw === 0) {
        const p = getComputedStyle(n);
        const b = Math.max(parseFloat(p.borderTopWidth) || 0, parseFloat(p.borderLeftWidth) || 0);
        if (b > 0 && p.borderTopStyle !== 'none') { bw = b; from = n.tagName.toLowerCase() + '.' + String(n.className).trim().split(/\s+/)[0]; }
        n = n.parentElement; hops++;
      }
      out.push({ name: (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')).slice(0, 40), bw, from, style: cs.borderTopStyle });
    }
    return out;
  }, SEL);
  const seenFc = new Set();
  for (const r of fc) {
    if (seenFc.has(r.name)) continue;
    seenFc.add(r.name);
    const bad = r.bw === 0 || r.style === 'none';
    if (bad) { failures++; failing.push(`${route} forced-colors ${r.name} no border`); }
    console.log(`  ${bad ? 'FAIL' : ' ok '} ${'forced'.padEnd(9)} ${r.name.padEnd(40)} border-width=${r.bw}px style=${r.style} from=${r.from}`);
  }
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'}: ${failures} failing measurement(s) across ${checked} checks`);
if (failing.length) {
  console.log('\nfailing:');
  const counts = new Map();
  for (const f of failing) counts.set(f.split(' ').slice(2).join(' '), (counts.get(f.split(' ').slice(2).join(' ')) ?? 0) + 1);
  [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).forEach(([k, v]) => console.log(`  x${v}  ${k}`));
}
await browser.close();
process.exit(failures === 0 ? 0 : 1);
