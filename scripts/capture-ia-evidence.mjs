/* ============================================================
   EVIDENCE FOR THE SEVEN-SECTION HOMEPAGE

   Writes artifacts/site-ia/: full-page shots of the homepage at desktop and
   phone, one shot per band, the two pages the homepage handed work to, the
   reduced-motion homepage, and a keyboard focus-order record.

   Run against a preview server you already own:
     NV_PORT=3272 node scripts/capture-ia-evidence.mjs

   Deliberately a script rather than a spec file: it produces artifacts, it
   asserts nothing, and a thing that asserts nothing does not belong in the
   suite that check-suite.mjs counts.
   ============================================================ */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.NV_PORT || 3272);
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.resolve('artifacts/site-ia');
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

/* The seven bands, by the data-ia attribute the markup carries. Section 7 is
   two DOM sections (the FAQ and the closing action) because the owner's
   seventh item is "reduced FAQ and final action"; both are shot together. */
const BANDS = [
  ['1-hero', '[data-ia="1"]'],
  ['2-leaks', '#leaks'],
  ['3-system', '#how'],
  ['4-capabilities', '#capabilities'],
  ['5-demo', '#demo'],
  ['6-process-pricing-trust', '#process'],
  ['7a-faq', '#faq'],
  ['7b-final-action', '.final-cta'],
];

/* Settle the hero film rather than racing it, so a shot is never of a
   half-drawn stage. Falls through after a second if the timeline never
   appears, which is the no-JS / motion-off case and is also worth a shot. */
async function settle(page) {
  try {
    await page.waitForFunction(() => !!window.__heroTL, { timeout: 4000 });
    await page.evaluate(() => window.__heroTL.progress(1).pause());
  } catch { /* no film on this page */ }
  await page.evaluate(async () => {
    const max = () => document.documentElement.scrollHeight - innerHeight;
    for (let y = 0; y <= max(); y += 500) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 500));
  });
}

/* --only=a,b recaptures just the artifacts whose names contain one of those
   substrings. A change that touches one band should not reshoot twenty-five
   files and leave the reviewer diffing screenshots that did not change. */
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7)
  .split(',').map((s) => s.trim()).filter(Boolean);
const wanted = (name) => !only.length || only.some((f) => name.includes(f));

const written = [], skipped = [];
async function shoot(page, name, locator) {
  if (!wanted(name)) { skipped.push(name); return; }
  const file = path.join(OUT, name + '.png');
  if (locator) await locator.screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: true });
  written.push(name + '.png');
  console.log('wrote', name + '.png');
}

const browser = await chromium.launch();

/* ---------- the homepage, both widths, whole page and band by band ---------- */
for (const [label, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(BASE + '/home.html');
  await settle(page);
  await shoot(page, `home-${label}-full`);
  for (const [name, sel] of BANDS) {
    const el = page.locator(sel).first();
    if (!(await el.count())) { console.warn('missing band', sel); continue; }
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(450);
    await shoot(page, `home-${label}-section-${name}`, el);
  }
  await ctx.close();
}

/* ---------- the two pages the homepage handed work to ---------- */
for (const [file, name] of [['/roi.html', 'roi'], ['/demo.html', 'demo']]) {
  for (const [label, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
    if (!wanted(`${name}-${label}-full`)) continue;
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    await page.goto(BASE + file);
    await settle(page);
    await shoot(page, `${name}-${label}-full`);
    await ctx.close();
  }
}

/* ---------- reduced motion, which is a different page, not a still one ---------- */
for (const [label, viewport] of [['desktop', DESKTOP], ['mobile', MOBILE]]) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/home.html');
  await page.waitForTimeout(1200);
  await shoot(page, `home-${label}-reduced-motion-full`);
  await ctx.close();
}

/* ---------- keyboard focus order ----------
   Tab from the top of the document and write down where focus lands, in
   order, with the band each stop belongs to. A reader can check the order is
   the reading order without driving a browser. */
const ctx = await browser.newContext({ viewport: DESKTOP });
const page = await ctx.newPage();
await page.goto(BASE + '/home.html');
await settle(page);
await page.evaluate(() => document.body.focus());
const stops = [];
for (let i = 0; i < 70; i++) {
  await page.keyboard.press('Tab');
  const stop = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const band = el.closest('[data-ia]');
    const chrome = el.closest('header, footer, .callbar');
    const label = (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 58);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      where: band ? 'section ' + band.getAttribute('data-ia') : chrome ? chrome.tagName.toLowerCase() + (chrome.className ? '.' + String(chrome.className).split(/\s+/)[0] : '') : '(document)',
      label: label || '(no text)',
      /* The focus ring has to be somewhere a person can see. */
      onScreen: r.top < window.innerHeight && r.bottom > 0 && r.width > 0,
    };
  });
  if (!stop) break;
  stops.push(stop);
}
if (wanted('focus-order')) fs.writeFileSync(path.join(OUT, 'focus-order.md'),
  '# Keyboard focus order, homepage, 1280x800\n\n'
  + 'Tabbed from the top of the document. `on screen` is whether the focused\n'
  + 'element was inside the viewport when it took focus, which is the thing a\n'
  + 'focus ring is useless without.\n\n'
  + '| # | where | element | accessible text | on screen |\n|---|---|---|---|---|\n'
  + stops.map((s, i) => `| ${i + 1} | ${s.where} | ${s.tag} | ${s.label.replace(/\|/g, '\\|')} | ${s.onScreen ? 'yes' : 'NO'} |`).join('\n')
  + '\n');
if (wanted('focus-order')) { written.push('focus-order.md'); console.log('wrote focus-order.md,', stops.length, 'stops'); }
await ctx.close();

await browser.close();
console.log('\n' + written.length + ' artifact(s) written to artifacts/site-ia/'
  + (skipped.length ? `, ${skipped.length} left as they were` : ''));
