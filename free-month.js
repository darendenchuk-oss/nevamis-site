/* ============================================================
   THE FIRST MONTH FREE, SHOWN ONLY WHILE A PLACE IS OPEN.

   The first month free is for the first clients only, and it is given on a
   booked call, never by Buy now (owner amendment #66). A page says it only
   inside an element marked data-nv-free-month, which ships with the
   hidden attribute, and this script is the only thing that ever removes it.
   It does so when every one of these holds, and otherwise does nothing:

     - window.NV_PRICING.foundingClient.active is true (the owner's switch);
     - foundingClient.spots equals freeMonth.firstClients;
     - GET https://app.nevamis.ca/api/free-month answers 200 within eight
       seconds with {"open": true, "cap": N}, N equal to those places.

   No script, a slow answer, an error, any other status, open false or a
   different cap all leave the element hidden: it fails closed, so when the
   last place is taken the page stops offering it without anyone editing a
   page. The engine answers its own errors with 503 {"open": false} for the
   same reason, and the commercial model says the same: once the places are
   taken or held, the offer is not said anywhere. The request carries no
   cookie and no identifier, and its answer holds no count.

   WHY EIGHT SECONDS (funnel audit item 6, 2026-10-09). On throttled 4G the
   answer took 3.7 s in one run and 9.7 s in another, and the wait was three
   seconds, so an ad that promised the month often landed on a page that
   did not show it. The pages that carry the line now preconnect to
   app.nevamis.ca, and the wait is eight seconds. A late answer is still
   refused, never shown.

   RESERVED SPACE. An element marked data-nv-free-month-hold keeps the gated
   card's height while the answer is on its way, so a card that shows late
   pushes nothing a visitor is about to tap. scripts/build-pages.mjs writes
   the mark only while foundingClient.active is true, so a switched-off offer
   holds nothing at all. An open answer shows the card and removes the mark
   (the card is the height that was held). Every other way out KEEPS the
   space and writes foundingClient.closedLine into it, a line about the terms
   that is never the offer (launch audit PERF-5, 2026-11-09): giving the
   space back moved everything under it up by the held height, a layout
   shift of 0.19 measured on pricing.html on a phone with the engine slow,
   and the same jump would meet every visitor between the last place going
   and the rebuild with the switch off. With no closedLine configured the
   space is given back as before. With scripts off, a <noscript> rule on the
   page sets the hold to nothing.

   The words come from foundingClient: an element marked
   data-nv-free-month-offer gets the offer and one marked
   data-nv-free-month-note gets the note. A page ships them empty.
   ============================================================ */
(function () {
  "use strict";
  var ENDPOINT = "https://app.nevamis.ca/api/free-month";
  var WAIT_MS = 8000;

  var holds = document.querySelectorAll("[data-nv-free-month-hold]");
  /* Gives the reserved space back: once the card is showing, or when there
     is no line to keep the space with. */
  function release() {
    for (var i = 0; i < holds.length; i++) holds[i].removeAttribute("data-nv-free-month-hold");
  }

  var P = window.NV_PRICING;
  var fc = P && P.foundingClient;
  var fm = P && P.freeMonth;

  /* The offer is not shown: keep the space, and say the closed line in it.
     The line fills the held height (each page's .fm-closed rule), so the
     page does not move by a pixel whichever way the answer goes. */
  function closed() {
    var line = fc && typeof fc.closedLine === "string" ? fc.closedLine : "";
    if (!line || !holds.length) { release(); return; }
    for (var i = 0; i < holds.length; i++) {
      if (holds[i].querySelector("[data-nv-free-month-closed]")) continue;
      var p = document.createElement("p");
      p.className = "fm-closed";
      p.setAttribute("data-nv-free-month-closed", "");
      p.textContent = line;
      holds[i].appendChild(p);
    }
  }

  var gated = document.querySelectorAll("[data-nv-free-month]");
  if (!gated.length) { release(); return; }
  if (!fc || fc.active !== true || !fm) { closed(); return; }
  if (typeof fc.spots !== "number" || fc.spots <= 0 || fc.spots !== fm.firstClients) { closed(); return; }
  if (!fc.offer || typeof window.fetch !== "function") { closed(); return; }

  var settled = false;
  var ctrl = typeof window.AbortController === "function" ? new window.AbortController() : null;
  var timer = setTimeout(function () {
    settled = true;
    if (ctrl) ctrl.abort();
    closed();
  }, WAIT_MS);

  function fill(root, attr, text) {
    var els = root.querySelectorAll("[" + attr + "]");
    for (var i = 0; i < els.length; i++) els[i].textContent = text || "";
  }

  function reveal() {
    for (var i = 0; i < gated.length; i++) {
      fill(gated[i], "data-nv-free-month-offer", fc.offer);
      fill(gated[i], "data-nv-free-month-note", fc.note);
      gated[i].hidden = false;
    }
  }

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
      if (body && body.open === true && body.cap === fc.spots) { reveal(); release(); }
      else closed();
    })
    .catch(function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      closed();
    });
})();
