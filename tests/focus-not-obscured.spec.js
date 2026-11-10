/* ============================================================
   A FOCUSED CONTROL IS NEVER BEHIND THE BOOKING BAR (WCAG 2.2 SC 2.4.11
   Focus Not Obscured, post-launch sweep F1, 2026-11-09).

   At 820px wide or less every page carries the fixed "Book a 15-min call"
   bar along the bottom of the screen. When a control takes keyboard focus
   the browser scrolls only as far as the bottom edge of the screen, which
   is under the bar, so on the live site at 390x844 the homepage
   calculator's first field, the pricing page's "Request it" link and the
   footer's Pricing, Terms and Security links were each entirely behind it.
   assets/motion/site.css now keeps the bar's height clear at the foot of
   the scrolling box (scroll-padding-bottom), inlined into every page.

   Held here as the RULE, on the two pages where a phone buyer decides:
   Tab through every stop of the page at 390x844, and at each one, while
   the bar is showing, the focused control either ends at or above the
   bar's top edge, or is what the screen shows at its own centre. The bar
   itself, a control with no box, and a stop while the bar has stepped
   aside (the hero's own row on screen, a pane card open, the pricing
   chooser behind it) are not judged. Each Tab waits out the bar's .25s
   slide, so a bar half way in is never what is measured.

   Nothing here reaches anything live: the engine origin is answered
   locally, and only Tab is pressed.

   SHOWN RED BEFORE IT WAS TRUSTED (2026-11-09), run against main 0fb6589's
   build served from a checkout of that commit (NV_PORT at that server):
     /               failed, 5 stops behind the bar (bar top 790): stop 19
                     the calculator's "1000" field (#roiQuote) at y 798,
                     stop 35 the FAQ's "Can I keep my current phone
                     number?", and the footer's Pricing, Terms and Security
                     at y 800
     /pricing.html   failed, 4 stops: stop 24 "Request it: Get-Paid
                     Autopilot on its own" at y 800, and the footer's
                     Pricing, Terms and Security
   and both green on the branch that added the scroll padding. On that
   branch, the scroll-padding-bottom line deleted from the served index.html
   and pricing.html: both failed again on the same 9 stops; restored, green.

   Run with the site served from this checkout on its own port, e.g.
     NV_PORT=3412 npx playwright test tests/focus-not-obscured.spec.js
   ============================================================ */
import { test, expect } from '@playwright/test';

const VIEWPORT = { width: 390, height: 844 };
const MAX_STOPS = 400;

/** The stop focus is on, judged against the bar. Marks every stop it has
 *  seen, so the walk ends when Tab comes back round to one. */
function judgeStop() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return { none: true };
  const seen = el.hasAttribute('data-f1-seen');
  el.setAttribute('data-f1-seen', '');
  const r = el.getBoundingClientRect();
  const what = `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 50)}" in #${(el.closest('[id]') || {}).id || '(no id above it)'}`;
  const bar = document.querySelector('.callbar');
  const cs = bar && getComputedStyle(bar);
  const showing = !!bar && cs.display !== 'none' && cs.visibility === 'visible';
  if (seen) return { seen, what };
  if (!showing || el.closest('.callbar') || (r.width === 0 && r.height === 0)) return { judged: false, what };
  const b = bar.getBoundingClientRect();
  if (r.bottom <= b.top + 0.5) return { judged: true, ok: true, what };
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const hit = document.elementFromPoint(x, y);
  const ok = !!hit && (hit === el || el.contains(hit));
  return {
    judged: true, ok, what,
    rect: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`,
    barTop: Math.round(b.top),
    hit: hit ? `${hit.tagName.toLowerCase()}${hit.className && typeof hit.className === 'string' ? '.' + hit.className.trim().split(/\s+/).join('.') : ''}` : 'nothing',
  };
}

for (const url of ['/', '/pricing.html']) {
  test(`390x844 ${url}: no control that takes keyboard focus is behind the booking bar`, async ({ browser, baseURL }) => {
    test.setTimeout(600_000);
    const ctx = await browser.newContext({ baseURL, viewport: VIEWPORT, reducedMotion: 'no-preference' });
    await ctx.route(/^https:\/\/app\.nevamis\.ca\//, (r) => r.fulfill({ status: 204, body: '' }));
    const page = await ctx.newPage();
    try {
      await page.goto(url, { waitUntil: 'load' });
      /* The bar is part of the page under test: it must show at this width. */
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('.callbar')).display),
        'the booking bar shows at 390px').toBe('block');
      const bad = [];
      let judged = 0, stops = 0, empty = 0;
      for (let i = 0; i < MAX_STOPS; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(350);
        const s = await page.evaluate(judgeStop);
        if (s.none) { if (++empty > 2) break; continue; }
        if (s.seen) break;
        stops++;
        if (!s.judged) continue;
        judged++;
        if (!s.ok) bad.push(`stop ${stops}: ${s.what} at ${s.rect}, bar top ${s.barTop}, its centre shows ${s.hit}`);
      }
      test.info().annotations.push({ type: 'tab stops', description: `${stops} stops, ${judged} judged with the bar showing` });
      expect(stops, 'Tab walked the page').toBeGreaterThan(10);
      expect(judged, 'some stops were judged with the bar showing').toBeGreaterThan(5);
      expect(bad, `focused controls behind the booking bar at 390x844 on ${url}:\n${bad.join('\n')}`).toEqual([]);
    } finally {
      await ctx.close();
    }
  });
}
