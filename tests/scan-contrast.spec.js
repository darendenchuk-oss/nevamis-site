/* Every "Scan my business" control has to be readable, measured in pixels.
 *
 * The station pill in #doc shipped with a mint fill and an emerald label: 11px
 * uppercase mono at 1.76:1, and 1.00:1 on hover (mint on mint). A selector from
 * the page below the film restyled the pill's TEXT as a transparent text link
 * and left its fill alone. Nothing caught it: the site contrast probe selected
 * a.btn only, the body-colour check never looked at a CTA, and the pill is
 * opaque, so no canvas was involved. On solutions.html the same label sits in a
 * ghost button over the animated aurora, where its border fell to 1.94:1.
 *
 * Measured the way hero-contrast.spec.js measures the lede, because a computed
 * style walk cannot see a WebGL canvas: hide the label, screenshot what is
 * actually behind it, decode, and compare against the label's own colour.
 *
 *   text      the label colour against EVERY background pixel inside the
 *             content box: 4.5:1 (3:1 only if the label is large text)
 *   boundary  the control's edge against the pixel just outside it: 3:1
 *             (WCAG 1.4.11), sampled along the straight edges
 *
 * Both at rest and on hover, over several frames where a canvas is behind it.
 * The film's slide-in card copy (#cardBody) is created only when a visitor
 * opens it, so it is not in the DOM this test enumerates; it inherits no #doc
 * rule and measured 12.53:1 when this was written.
 */
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
const SCAN = /scan my business/i;

/* Production safety: nothing here may reach the real app or the voice widget. */
async function contain(context) {
  await context.route('**/*', (route) => {
    const r = route.request();
    const u = r.url();
    if (/^https:\/\/app\.nevamis\.ca\//i.test(u)) return route.fulfill({ status: 204, body: '' });
    if (r.method() !== 'GET' && r.method() !== 'HEAD') return route.abort();
    if (/elevenlabs\.io/i.test(u)) return route.abort();
    return route.continue();
  });
}

/* Runs in a blank page: the site's CSP is img-src 'self', so a data: PNG
   cannot be decoded inside the page under test. */
const MEASURE = async ({ a, b, clip, box, pad, bw, text }) => {
  const load = async (b64) => {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return { w: img.width, h: img.height, d: g.getImageData(0, 0, img.width, img.height).data };
  };
  const A = await load(a), B = await load(b);
  const s = A.w / clip.width;
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (I, i) => 0.2126 * f(I.d[i]) + 0.7152 * f(I.d[i + 1]) + 0.0722 * f(I.d[i + 2]);
  const ratio = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  const at = (I, x, y) => { x = Math.floor(x); y = Math.floor(y); return (x < 0 || y < 0 || x >= I.w || y >= I.h) ? -1 : (y * I.w + x) * 4; };

  const x0 = (box.x - clip.x) * s, y0 = (box.y - clip.y) * s;
  const x1 = x0 + box.width * s, y1 = y0 + box.height * s;

  // text: label colour (alpha-composited) against every pixel behind it
  const ta = text[3] === undefined ? 1 : text[3];
  let textMin = Infinity;
  for (let y = Math.ceil(y0 + (pad.t + bw) * s); y < y1 - (pad.b + bw) * s; y++) {
    for (let x = Math.ceil(x0 + (pad.l + bw) * s); x < x1 - (pad.r + bw) * s; x++) {
      const i = at(B, x, y); if (i < 0) continue;
      const rgb = [0, 1, 2].map((k) => text[k] * ta + B.d[i + k] * (1 - ta));
      const lt = 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
      textMin = Math.min(textMin, ratio(lt, lum(B, i)));
    }
  }

  /* boundary: the most distinct pixel in the edge band against a pixel 2px
     beyond it. Boxes sit on fractional pixels, and the browser snaps a 1px
     border to either neighbour, so the band starts one pixel OUTSIDE the box
     edge on every side. Starting it at the box edge silently skipped the
     right and bottom borders (x1 - 1 floors to the pixel inside the border)
     and compared interior against exterior. */
  const band = Math.ceil(Math.max(bw, 1) * s) + Math.ceil(2 * s) + 1;
  const out = Math.ceil(2 * s);
  const step = Math.max(1, Math.round(s));
  const rad = Math.min(box.height / 2, box.width / 2) * s;   // pills: skip the rounded ends
  const edge = [];
  // (e0 = first band pixel, one outside the edge; d = inward direction)
  const sample = (ex, ey, dx, dy) => {
    const o = at(A, ex - dx * out, ey - dy * out); if (o < 0) return;
    let best = 1;
    for (let k = 0; k < band; k++) { const i = at(A, ex + dx * k, ey + dy * k); if (i >= 0) best = Math.max(best, ratio(lum(A, i), lum(A, o))); }
    edge.push(best);
  };
  const top = Math.floor(y0) - 1, bottom = Math.ceil(y1), left = Math.floor(x0) - 1, right = Math.ceil(x1);
  for (let x = x0 + rad; x <= x1 - rad; x += step) { sample(x, top, 0, 1); sample(x, bottom, 0, -1); }
  const cy = (y0 + y1) / 2;
  for (let dy = -2 * step; dy <= 2 * step; dy += step) { sample(left, cy + dy, 1, 0); sample(right, cy + dy, -1, 0); }
  edge.sort((m, n) => m - n);
  return { text: +textMin.toFixed(2), edge: edge.length ? +edge[0].toFixed(2) : null, edgeSamples: edge.length };
};

const readBox = (page, sel) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return {
    box: { x: r.x, y: r.y, width: r.width, height: r.height },
    color: cs.color, size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight),
    pad: { t: parseFloat(cs.paddingTop), r: parseFloat(cs.paddingRight), b: parseFloat(cs.paddingBottom), l: parseFloat(cs.paddingLeft) },
    bw: parseFloat(cs.borderTopWidth) || 0,
  };
}, sel);
const moved = (p, q) => Math.max(Math.abs(p.x - q.x), Math.abs(p.y - q.y), Math.abs(p.width - q.width), Math.abs(p.height - q.height)) > 0.5;

async function probe(page, decoder, sel) {
  /* The film's ending pill is seated by the film every frame and the pointer
     drives a small parallax, so a box read and a screenshot can disagree by a
     few pixels: that measured the pill against itself (1.02:1). Only a capture
     whose box did not move from before the first screenshot to after the second
     is measured. */
  for (let attempt = 0; attempt < 12; attempt++) {
    const r = await probeOnce(page, decoder, sel);
    if (r) return r;
    await page.waitForTimeout(250);
  }
  throw new Error(`${sel} never held still long enough to measure`);
}

async function probeOnce(page, decoder, sel) {
  const t = await readBox(page, sel);
  const vp = page.viewportSize();
  const M = 12;
  /* The desktop pointer (assets/motion/cursor.js) draws its halo and arch AT
     the pointer, over whatever is under it. It belongs to the pointer, not the
     control, and would otherwise read as a mint stroke through the label. */
  await page.evaluate(() => document.querySelectorAll('.nv-cur, .nv-halo').forEach((n) => n.style.setProperty('visibility', 'hidden', 'important')));
  const cx0 = Math.max(0, Math.floor(t.box.x - M)), cy0 = Math.max(0, Math.floor(t.box.y - M));
  const clip = { x: cx0, y: cy0, width: Math.min(vp.width, Math.ceil(t.box.x + t.box.width + M)) - cx0, height: Math.min(vp.height, Math.ceil(t.box.y + t.box.height + M)) - cy0 };
  const a = await page.screenshot({ clip, animations: 'allow' });
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    for (const n of [el, ...el.querySelectorAll('*')]) { n.style.setProperty('color', 'transparent', 'important'); n.style.setProperty('text-shadow', 'none', 'important'); }
  }, sel);
  const b = await page.screenshot({ clip, animations: 'allow' });
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    for (const n of [el, ...el.querySelectorAll('*')]) { n.style.removeProperty('color'); n.style.removeProperty('text-shadow'); }
  }, sel);
  if (moved(t.box, (await readBox(page, sel)).box)) return null;
  const text = t.color.match(/[\d.]+/g).map(Number);
  const m = await decoder.evaluate(MEASURE, { a: a.toString('base64'), b: b.toString('base64'), clip, box: t.box, pad: t.pad, bw: t.bw, text });
  const large = t.size >= 24 || (t.size >= 18.66 && t.weight >= 700);
  return { ...m, needText: large ? 3 : 4.5, desc: `${t.size}px/${t.weight} ${t.color}, ${Math.round(t.box.width)}x${Math.round(t.box.height)}` };
}

async function effectiveOpacity(page, sel) {
  return page.evaluate((sel) => {
    let o = 1;
    for (let n = document.querySelector(sel); n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  }, sel);
}

async function settle(page, sel) {
  await expect.poll(() => effectiveOpacity(page, sel), { message: `${sel} never finished revealing`, timeout: 15_000 }).toBeGreaterThan(0.999);
  await page.waitForTimeout(400);
}

/* Measure one control at rest (several frames) and on hover. Returns failures. */
async function check(page, decoder, sel, label, frames) {
  const bad = [];
  const run = async (state) => {
    const r = await probe(page, decoder, sel);
    if (r.text < r.needText) bad.push(`${label} ${state}: label ${r.text}:1 (need ${r.needText}:1) [${r.desc}]`);
    if (r.edgeSamples === 0) bad.push(`${label} ${state}: no boundary samples [${r.desc}]`);
    else if (r.edge < 3) bad.push(`${label} ${state}: boundary ${r.edge}:1 against the pixels outside (need 3:1) [${r.desc}]`);
  };
  for (let f = 0; f < frames; f++) { await run('rest f' + f); await page.waitForTimeout(350); }
  const c = await page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, sel);
  await page.mouse.move(c.x, c.y);
  await page.waitForTimeout(450);
  expect(await page.evaluate((sel) => document.querySelector(sel).matches(':hover'), sel), `${label} premise: the hover state is applied`).toBe(true);
  for (let f = 0; f < Math.max(1, frames - 1); f++) { await run('hover f' + f); await page.waitForTimeout(350); }
  await page.mouse.move(1, 1);
  await page.waitForTimeout(350);
  return bad;
}

async function tagScanLinks(page) {
  return page.evaluate((src) => {
    const re = new RegExp(src, 'i');
    return [...document.querySelectorAll('a')].filter((a) => re.test(a.textContent || '')).map((a, i) => {
      a.setAttribute('data-scan-probe', String(i));
      return { sel: `[data-scan-probe="${i}"]`, inClose: !!a.closest('#close'), where: `${(a.closest('[id]') || {}).id || '?'} a.${String(a.className).trim().split(/\s+/).join('.')}` };
    });
  }, SCAN.source);
}

for (const vp of VIEWPORTS) {
  test(`every "Scan my business" on the homepage is readable (${vp.name})`, async ({ browser }) => {
    test.setTimeout(240_000);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await contain(context);
    const decoder = await context.newPage();
    const page = await context.newPage();
    await page.goto('/home.html?debug=1&nointro=1');
    await page.waitForFunction(() => window.__nv && window.__nv.dbg, null, { timeout: 60_000 });

    const links = await tagScanLinks(page);
    /* The film's ending pill, the Lead Generation ghost, the station pill and the
       closing primary. Fewer means a placement was removed or renamed, and the
       exit flourish in the film also keys on this exact text. */
    expect(links.length, `scan links found: ${links.map((l) => l.where).join(', ')}`).toBeGreaterThanOrEqual(4);

    const failures = [];
    for (const l of links) {
      if (l.inClose) {
        // the film settled at its end, where the ending copy and pill are parked
        await page.evaluate(() => { const d = window.__nv.dbg; window.scrollTo(0, Math.ceil(d.spanH - d.vh)); });
        await expect.poll(() => page.evaluate(() => { const d = window.__nv.dbg; return d.target > 0.999 && Math.abs(d.cur - d.target) < 0.002; }),
          { message: 'the film never settled at its end', timeout: 60_000 }).toBe(true);
      } else {
        await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'center' }), l.sel);
      }
      await settle(page, l.sel);
      failures.push(...await check(page, decoder, l.sel, l.where, l.inClose ? 3 : 2));
    }
    expect(failures, `unreadable "Scan my business" controls at ${vp.width}x${vp.height}:\n${failures.join('\n')}`).toEqual([]);
    await context.close();
  });

  test(`"Scan my business" over the aurora on solutions.html is readable (${vp.name})`, async ({ browser }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await contain(context);
    const decoder = await context.newPage();
    const page = await context.newPage();
    await page.goto('/solutions.html');
    const links = await tagScanLinks(page);
    expect(links.length, 'the hub hero offers the scan').toBeGreaterThanOrEqual(1);
    const failures = [];
    for (const l of links) {
      await page.evaluate((sel) => { const e = document.querySelector(sel); if (e.getBoundingClientRect().bottom > innerHeight) e.scrollIntoView({ block: 'center' }); }, l.sel);
      await settle(page, l.sel);
      await page.waitForTimeout(1500);   // let the aurora reach its resting drift
      failures.push(...await check(page, decoder, l.sel, l.where, 5));
    }
    expect(failures, `unreadable "Scan my business" controls at ${vp.width}x${vp.height}:\n${failures.join('\n')}`).toEqual([]);
    await context.close();
  });
}
