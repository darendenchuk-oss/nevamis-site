/* ============================================================
   DOES ANY FIXED ELEMENT COVER A CONTROL, AT REST?

   Found by review on 2026-08-28: at 360x640 the fixed .callbar (top 586,
   height 54, z-index 60) overlapped the hero's secondary CTA by 33px, which
   is 67% of the button, BEFORE any scrolling. Not present at 375 or 390, so a
   spot check at one width would have missed it, and the width it appeared at
   is the one the owner singled out.

   A fixed bottom bar is allowed to exist. It is not allowed to sit on top of
   something a visitor is meant to press.

   HIT TESTING, NOT RECTANGLE INTERSECTION. The first version of this compared
   bounding boxes and duly reported every control at every width as covered,
   because #aurora is a fixed full-viewport canvas: geometrically it is over
   everything and it catches no pointer at all. A detector that fires on the
   decorative background is a detector nobody reads. elementFromPoint asks the
   only question that matters: if a finger lands in the middle of this control,
   does the control get it?

     NV_PORT=3272 node scripts/measure-mobile-obstruction.mjs

   Exit 0 = nothing in the way at any width.  1 = something is.
   ============================================================ */
import { chromium } from '@playwright/test';

const PORT = Number(process.env.NV_PORT || 3211);
const BASE = `http://127.0.0.1:${PORT}`;
const WIDTHS = [[360, 640], [375, 812], [390, 844], [768, 1024], [1024, 768], [1440, 900]];

const browser = await chromium.launch();
let bad = 0;
console.log('\nviewport    callbarTop  secondaryCTA  overlap  overflowX  blocked / sub-24px');

for (const [w, h] of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/home.html');
  await page.waitForTimeout(900);

  const r = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && cs.visibility !== 'hidden';
    };
    const bar = document.querySelector('.callbar');
    const sec = document.querySelector('.hero a.btn-ghost[data-cta]');
    const br = vis(bar) ? bar.getBoundingClientRect() : null;
    const sr = sec ? sec.getBoundingClientRect() : null;
    const overlap = (br && sr)
      ? Math.max(0, Math.min(br.bottom, sr.bottom) - Math.max(br.top, sr.top)) : 0;

    /* Every control that is on screen at rest, asked whether it would receive
       a tap at its own centre. */
    const blocked = [];
    for (const ctl of document.querySelectorAll('a.btn, button.btn, .hero a[href], .callbar')) {
      if (!vis(ctl)) continue;
      const cr = ctl.getBoundingClientRect();
      if (cr.height === 0 || cr.top > innerHeight || cr.bottom < 0) continue;
      const cx = Math.round(cr.left + cr.width / 2);
      const cy = Math.round(cr.top + cr.height / 2);
      if (cy < 1 || cy > innerHeight - 1 || cx < 1 || cx > innerWidth - 1) continue;
      const hit = document.elementFromPoint(cx, cy);
      if (!hit) continue;
      if (hit === ctl || ctl.contains(hit) || hit.contains(ctl)) continue;

      /* COVERED BY SOMETHING THAT DOES THE SAME THING IS NOT A LOSS OF
         FUNCTION. At 360x640 the demo-line phone number in the hero's proof
         paragraph sits under the call bar, and the call bar is a tel: link to
         that same number: a tap there dials exactly what the covered link
         would have dialled. A fixed bottom bar inherently owns the last 54px
         of the viewport at every scroll position, so some text will always
         pass beneath it; what must never happen is a DIFFERENT action, or no
         action, replacing the one the visitor aimed at. Deliberately narrow:
         it compares resolved hrefs, so a bar covering a different destination
         is still reported. */
      const hitLink = hit.closest('a[href]');
      if (hitLink && ctl.tagName === 'A' && hitLink.href === ctl.href) continue;

      const owner = hit.closest('[class]');
      blocked.push(`"${(ctl.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24)}" blocked by `
        + `.${owner ? String(owner.className).split(/\s+/)[0] : hit.tagName}`);
    }

    /* WCAG 2.5.8 exempts a target "in a sentence or its size is otherwise
       constrained by the line-height of non-target text". An inline link inside
       a paragraph is exactly that exception, so it is excluded rather than
       reported: padding one to 24px would space out the sentence it lives in. */
    const inlineInProse = (e) => {
      if (getComputedStyle(e).display !== 'inline') return false;
      const p = e.parentElement;
      return !!p && /^(P|LI|SPAN|DD|DT|FIGCAPTION)$/.test(p.tagName)
        && (p.textContent || '').trim().length > (e.textContent || '').trim().length + 12;
    };
    const small = [...document.querySelectorAll('a[href], button')].filter((e) => {
      if (!vis(e)) return false;
      const b = e.getBoundingClientRect();
      if (!(b.width > 0 && b.height > 0 && b.height < 24)) return false;
      if (e.closest('footer')) return false;
      return !inlineInProse(e);
    }).map((e) => `${(e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 22) || e.tagName}:`
      + `${Math.round(e.getBoundingClientRect().height)}px`);

    return {
      bar: br ? Math.round(br.top) : null,
      sec: sr ? `${Math.round(sr.top)}-${Math.round(sr.bottom)}` : null,
      overlap: Math.round(overlap),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      blocked: [...new Set(blocked)],
      small: [...new Set(small)],
    };
  });

  const notes = [...r.blocked, ...r.small];
  console.log(`${(w + 'x' + h).padEnd(12)}${String(r.bar).padEnd(12)}${String(r.sec).padEnd(14)}`
    + `${String(r.overlap).padEnd(9)}${String(r.overflowX).padEnd(11)}${notes.length ? notes.join(' | ') : 'none'}`);

  if (r.overlap > 0) { console.error(`   FAIL: the call bar covers the hero's secondary CTA by ${r.overlap}px`); bad++; }
  if (r.blocked.length) { console.error('   FAIL: ' + r.blocked.join(' | ')); bad++; }
  if (r.overflowX > 1) { console.error(`   FAIL: ${r.overflowX}px of horizontal overflow`); bad++; }
  if (r.small.length) { console.error(`   FAIL: below the 24px target minimum: ${r.small.join(', ')}`); bad++; }
  await ctx.close();
}

await browser.close();
if (bad) { console.error(`\n${bad} problem(s).`); process.exit(1); }
console.log('\nOK: nothing covers a control, no overflow, no target under 24px.');
process.exit(0);
