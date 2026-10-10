/* ============================================================
   THE FREE-MONTH HOLD, WRITTEN ONLY WHILE THE OFFER CAN SHOW.

   pricing.html, how-you-start.html and book.html keep the gated free-month
   card's height while free-month.js asks the engine (a wrapper marked
   data-nv-free-month-hold), so a card that shows late pushes nothing a
   visitor is about to tap (funnel audit item 6, 2026-10-09). The price of
   that is the closed case: when the answer is no, the space is given back
   and everything under it moves up, 118 to 268px measured on those pages.

   So the mark is written by scripts/build-pages.mjs, and only while
   pricing-config.js foundingClient.active is true. The owner turns the
   switch off once the places are gone (scripts/verify-live-systems.mts in
   the engine says so the day the engine answers open:false), and from that
   build on nothing is held and nothing moves. While the switch is on and a
   place is open, the hold is what keeps the page still.

   The wrapper is matched exactly as the pages write it, so a page cannot
   grow a second spelling that this misses: tests/free-month-gate.spec.js
   and scripts/check-generator-drift.mjs both run this.
   ============================================================ */
const HOLD = /<div class="fm-hold"(?: data-nv-free-month-hold)?>/g;

/** foundingClient.active, read from the config object (true only when it is
    the boolean true, as free-month.js reads it). */
export function freeMonthActive(cfg) {
  return !!(cfg && cfg.foundingClient && cfg.foundingClient.active === true);
}

/** The page with every hold wrapper marked when `active`, unmarked when not. */
export function applyFreeMonthHold(html, active) {
  return html.replace(HOLD, active ? '<div class="fm-hold" data-nv-free-month-hold>' : '<div class="fm-hold">');
}
