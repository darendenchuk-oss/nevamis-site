/* The in-browser voice call, on a page of its own.

   The ElevenLabs widget used to be injected into whichever page the visitor was
   on, from an unversioned unpkg URL: whatever npm marked "latest" ran inside
   nevamis.ca within minutes, next to the booking and callback forms. It is now
   a pinned copy served from this site (assets/vendor, verified against the npm
   registry's published integrity), and it only ever runs here, where the page's
   Content-Security-Policy allows what the widget needs (blob: worklets, the
   ElevenLabs websockets). Every other page keeps a policy that allows no
   third-party script at all. See scripts/build-csp.mjs.

   Upgrading the widget is a deliberate change: add the new file under
   assets/vendor, point WIDGET at it, and update config/critical-surface.json. */
(function () {
  "use strict";
  var AGENT_ID = "agent_9101ky43tys1fswstde818j7j8wt";
  var WIDGET = "/assets/vendor/elevenlabs-convai-widget-embed-0.18.2.js";
  var EVENTS_URL = "https://app.nevamis.ca/api/events";

  var btn = document.getElementById("talkStart");
  var fine = document.getElementById("talkFine");
  if (!btn) return;

  /* Framed inside another site, the start button could be clicked through a
     decoy and open a recorded call. Offer the page on its own instead. */
  if (window.top !== window.self) {
    var own = document.createElement("a");
    own.href = "/talk/";
    own.target = "_top";
    own.className = "pri";
    own.textContent = "Open this page on nevamis.ca";
    btn.replaceWith(own);
    return;
  }

  /* The same anonymous count site.js sends: event name, path, and only the
     referring site's origin (scheme and host, no path or query). The engine
     parses it with new URL() and stores the hostname alone; a bare hostname
     would not parse there and was stored as null. No identifier, nothing
     stored. */
  function track(name) {
    try {
      var ref = "";
      try {
        var o = document.referrer ? new URL(document.referrer).origin : "";
        ref = /^https?:\/\/[^\/?#]+$/.test(o) && o.length <= 260 ? o : "";
      } catch (e) { ref = ""; }
      var payload = JSON.stringify({ name: name, page: location.pathname, referrer: ref, source: "" });
      if (navigator.sendBeacon) navigator.sendBeacon(EVENTS_URL, payload);
    } catch (e) { /* analytics must never break the call */ }
  }

  var loading = false;
  btn.addEventListener("click", function () {
    if (loading || document.querySelector("elevenlabs-convai")) return;
    loading = true;
    track("browser_call_start");
    btn.disabled = true;
    btn.textContent = "Connecting…";

    var el = document.createElement("elevenlabs-convai");
    el.setAttribute("agent-id", AGENT_ID);
    el.setAttribute("default-expanded", "");
    document.body.appendChild(el);

    var s = document.createElement("script");
    s.src = WIDGET;
    s.async = true;
    s.onload = function () { btn.textContent = "Call panel is open"; };
    s.onerror = function () {
      /* Take the element and the failed script back out. The guard above
         returns while an <elevenlabs-convai> is in the page, so leaving it
         behind turned the re-enabled button into one that did nothing. */
      if (el.parentNode) el.parentNode.removeChild(el);
      if (s.parentNode) s.parentNode.removeChild(s);
      loading = false;
      btn.disabled = false;
      btn.textContent = "Start the voice call";
      if (fine) fine.textContent = "That did not load, and your network may be blocking it. Call the number below instead; it is the same assistant.";
    };
    document.head.appendChild(s);
  });
})();
