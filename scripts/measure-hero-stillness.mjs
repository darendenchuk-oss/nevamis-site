/* ============================================================
   DOES ANY HERO CONTENT MOVE, EVER?

   The owner's inviolable rule: content is never animated, masked, clipped,
   transformed or opacity-faded. Motion belongs to #stage and nowhere else.
   motion.spec.js samples that at discrete states; this samples it CONTINUOUSLY
   on every animation frame for five seconds, which is the only way to catch a
   transient that starts and ends between two sampled states.

   Records, per element: peak movement in px from its first observed box, the
   minimum opacity seen, and any transform other than none.

     NV_PORT=3272 node scripts/measure-hero-stillness.mjs

   Exit 0 = nothing moved.  1 = something did.
   ============================================================ */
import { chromium } from '@playwright/test';

const PORT = Number(process.env.NV_PORT || 3211);
const BASE = `http://127.0.0.1:${PORT}`;
const TARGETS = {
  'h1': '.hero h1',
  'lede': '.hero .lede',
  'eyebrow': '.hero .eyebrow',
  'primary CTA': '.hero a.btn-primary[data-cta]',
  'secondary CTA': '.hero a.btn-ghost[data-cta]',
  '.copy': '.hero .copy',
  'proof': '.hero .proof',
};

const browser = await chromium.launch();
let bad = 0;
for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(BASE + '/home.html', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async (sel) => {
    const first = {}, peak = {}, minOp = {}, transforms = {};
    let frames = 0, t0 = performance.now(), firstAt = null;
    await new Promise((resolve) => {
      const tick = () => {
        frames++;
        if (firstAt === null) firstAt = Math.round(performance.now() - t0);
        for (const [name, s] of Object.entries(sel)) {
          const el = document.querySelector(s);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const box = [r.left + scrollX, r.top + scrollY];
          if (!first[name]) { first[name] = box; peak[name] = 0; minOp[name] = 1; transforms[name] = new Set(); }
          peak[name] = Math.max(peak[name], Math.hypot(box[0] - first[name][0], box[1] - first[name][1]));
          minOp[name] = Math.min(minOp[name], Number(cs.opacity));
          transforms[name].add(cs.transform);
        }
        if (performance.now() - t0 < 5000) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
    const out = {};
    for (const k of Object.keys(first)) {
      out[k] = { move: Number(peak[k].toFixed(2)), minOpacity: Number(minOp[k].toFixed(3)),
        transforms: [...transforms[k]] };
    }
    return { frames, firstAt, out };
  }, TARGETS);

  console.log(`\n${label} ${viewport.width}x${viewport.height} — ${result.frames} frames over 5s, first sample at t=${result.firstAt}ms`);
  console.log('  element         movement  min opacity  transforms');
  for (const [name, r] of Object.entries(result.out)) {
    const tf = r.transforms.filter((t) => t !== 'none');
    console.log(`  ${name.padEnd(16)}${(r.move.toFixed(2) + 'px').padEnd(10)}${String(r.minOpacity).padEnd(13)}${tf.length ? tf.join(' , ') : 'none'}`);
    if (r.move > 0.5) { console.error(`   FAIL: ${name} moved ${r.move}px. Hero content never moves.`); bad++; }
    if (r.minOpacity < 0.99) { console.error(`   FAIL: ${name} dipped to opacity ${r.minOpacity}. Hero content is never faded.`); bad++; }
    if (tf.length) { console.error(`   FAIL: ${name} carried a transform (${tf.join(', ')}). Hero content is never transformed.`); bad++; }
  }
  await ctx.close();
}
await browser.close();
if (bad) { console.error(`\n${bad} violation(s) of the hero stabilization.`); process.exit(1); }
console.log('\nOK: no hero content moved, faded or transformed on any frame.');
process.exit(0);
