/* ============================================================
   THE FIRST MONTH FREE, SHOWN ONLY WHILE A PLACE MAY BE OPEN.

   The first month free is for the first clients only, and it is given on a
   booked call, never by Buy now (owner amendment #66). A page says it only
   inside an element marked data-nv-free-month, which ships with the
   hidden attribute, and this script is the only thing that ever removes it.
   Before it asks anything, every one of these must hold, or it does nothing:

     - window.NV_PRICING.foundingClient.active is true (the owner's switch);
     - foundingClient.spots equals freeMonth.firstClients.

   Then it asks GET https://app.nevamis.ca/api/free-month, waits up to eight
   seconds, and the answer decides one of three things:

     open     a 200 with {"open": true, "cap": N}, N equal to those places:
              the element shows the offer and the note.
     closed   a 200 the engine meant (valid JSON) that is anything else:
              open false, a different cap, open as a string. The element
              stays hidden, so when the last place is taken the page stops
              offering it without anyone editing a page.
     unknown  no answer inside the wait, a network error, any status but
              200, or a body that is not JSON. The engine could not say, so
              the page says the offer AS AN OFFER and never as an open place:
              the offer, then foundingClient.unconfirmed ("We confirm on the
              call whether a place is still open."). That sentence is true
              whatever the count is, which is the whole test for a default.
              A cached config without `unconfirmed` keeps the element hidden,
              as every unknown answer did before (funnel audit, 2026-10-09).

   WHY THE WAIT IS EIGHT SECONDS AND THE UNKNOWN ANSWER IS NOT SILENCE (funnel
   audit item 6, 2026-10-09). On throttled 4G the answer took 3.7 s in one run
   and 9.7 s in another, and the wait was three seconds: an ad that promised
   the first month free landed on a booking page that never said it. Eight
   seconds covers the slow run with the preconnect the pages now carry, and
   the unknown answer still tells the visitor what the ad told them, in words
   that claim no place.

   RESERVED SPACE. An element marked data-nv-free-month-hold keeps the gated
   card's height (each page sets it in its own CSS) so a card that shows late
   pushes nothing a visitor is about to tap. This script removes the mark on
   every way out, whatever the answer, so a closed answer or a switched-off
   offer gives the space back. With scripts off, a <noscript> rule on the page
   sets the hold to nothing.

   The request carries no cookie and no identifier, and its answer holds no
   count. The words come from foundingClient: an element marked
   data-nv-free-month-offer gets the offer and one marked
   data-nv-free-month-note gets the note. A page ships them empty.
   ============================================================ */
(function () {
  "use strict";
  var ENDPOINT = "https://app.nevamis.ca/api/free-month";
  var WAIT_MS = 8000;

  var holds = document.querySelectorAll("[data-nv-free-month-hold]");
  /* Gives the reserved space back. Called on every way out of this script,
     including the early ones, so nothing is held for an answer never asked. */
  function release() {
    for (var i = 0; i < holds.length; i++) holds[i].removeAttribute("data-nv-free-month-hold");
  }

  var gated = document.querySelectorAll("[data-nv-free-month]");
  if (!gated.length) { release(); return; }
  var P = window.NV_PRICING;
  var fc = P && P.foundingClient;
  var fm = P && P.freeMonth;
  if (!fc || fc.active !== true || !fm) { release(); return; }
  if (typeof fc.spots !== "number" || fc.spots <= 0 || fc.spots !== fm.firstClients) { release(); return; }
  if (!fc.offer || typeof window.fetch !== "function") { release(); return; }

  var settled = false;
  var ctrl = typeof window.AbortController === "function" ? new window.AbortController() : null;

  function fill(root, attr, text) {
    var els = root.querySelectorAll("[" + attr + "]");
    for (var i = 0; i < els.length; i++) els[i].textContent = text || "";
  }

  /* `offer` is foundingClient.offer when the engine said a place is open, and
     the offer followed by foundingClient.unconfirmed when it could not say. */
  function reveal(offer) {
    for (var i = 0; i < gated.length; i++) {
      fill(gated[i], "data-nv-free-month-offer", offer);
      fill(gated[i], "data-nv-free-month-note", fc.note);
      gated[i].hidden = false;
    }
    release();
  }

  /* The engine could not answer. Never "a place is open": the offer and the
     sentence that says the call confirms it. */
  function unknown() {
    if (settled) return;
    settled = true;
    if (typeof fc.unconfirmed === "string" && fc.unconfirmed) reveal(fc.offer + " " + fc.unconfirmed);
    else release();
  }

  var timer = setTimeout(function () {
    if (ctrl) ctrl.abort();
    unknown();
  }, WAIT_MS);

  var init = { method: "GET", credentials: "omit", mode: "cors" };
  if (ctrl) init.signal = ctrl.signal;
  window.fetch(ENDPOINT, init)
    .then(function (r) {
      if (r.status !== 200) throw new Error("status " + r.status);
      return r.json();
    })
    .then(function (body) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      /* A 200 the engine meant: open with the same cap, or closed. A
         different cap is the config and the engine disagreeing, and that
         fails closed, as an open answer under it would offer a month the
         engine is not counting. */
      if (body && body.open === true && body.cap === fc.spots) reveal(fc.offer);
      else release();
    })
    .catch(function () {
      clearTimeout(timer);
      unknown();
    });
})();
