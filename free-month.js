/* ============================================================
   THE FIRST MONTH FREE, SHOWN ONLY WHILE A PLACE IS OPEN.

   The first month free is for the first clients only, and it is given on a
   booked call, never by Buy now (owner amendment #66). A page says it only
   inside an element marked data-nv-free-month, which ships with the hidden
   attribute, and this script is the only thing that ever removes it. It
   does so when every one of these holds, and otherwise does nothing:

     - window.NV_PRICING.foundingClient.active is true (the owner's switch);
     - foundingClient.spots equals freeMonth.firstClients;
     - GET https://app.nevamis.ca/api/free-month answers 200 within three
       seconds with {"open": true, "cap": N}, N equal to those places.

   No script, a slow answer, an error, any other status, open false or a
   different cap all leave the element hidden: it fails closed, so when the
   last place is taken the page stops offering it without anyone editing a
   page. The request carries no cookie and no identifier, and its answer
   holds no count.

   The words come from foundingClient: an element marked
   data-nv-free-month-offer gets the offer and one marked
   data-nv-free-month-note gets the note. A page ships them empty.
   ============================================================ */
(function () {
  "use strict";
  var ENDPOINT = "https://app.nevamis.ca/api/free-month";
  var WAIT_MS = 3000;

  var gated = document.querySelectorAll("[data-nv-free-month]");
  if (!gated.length) return;
  var P = window.NV_PRICING;
  var fc = P && P.foundingClient;
  var fm = P && P.freeMonth;
  if (!fc || fc.active !== true || !fm) return;
  if (typeof fc.spots !== "number" || fc.spots <= 0 || fc.spots !== fm.firstClients) return;
  if (!fc.offer || typeof window.fetch !== "function") return;

  var settled = false;
  var ctrl = typeof window.AbortController === "function" ? new window.AbortController() : null;
  var timer = setTimeout(function () {
    settled = true;
    if (ctrl) ctrl.abort();
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
      if (body && body.open === true && body.cap === fc.spots) reveal();
    })
    .catch(function () {
      settled = true;
      clearTimeout(timer);
    });
})();
