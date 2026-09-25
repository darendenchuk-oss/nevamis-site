/* Nevamis shared site JS. No dependencies. */
(function () {
  "use strict";
  /* Content must never depend on this script succeeding. Storage and feature
     access are guarded, and any uncaught failure lands in the catch at the
     bottom, which restores the .no-js CSS state so every .reveal stays
     visible. Animation is progressive enhancement, never a gate. */
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  try {
  document.documentElement.classList.remove("no-js");
  var reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motionOff = reduced || safeGet("nv-motion") === "off";
  if (motionOff) document.documentElement.classList.add("motion-off");

  /* ---------- shown inside someone else's page ----------
     The reliable fix is the frame-ancestors header, and GitHub Pages cannot
     send headers (the directive is ignored in a meta policy). Without it any
     site can load nevamis.ca in an invisible frame over a decoy and steer a
     visitor's click onto a booking or a form. When this page is not the top
     window it is covered by one plain link that opens nevamis.ca on its own,
     so nothing underneath can be clicked. */
  if (window.top !== window.self) {
    var nvCover = function () {
      var a = document.createElement("a");
      a.href = location.pathname;
      a.target = "_top";
      a.textContent = "Open nevamis.ca";
      a.setAttribute("style", "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;"
        + "justify-content:center;background:#02080D;color:#9FF0CE;font:600 18px system-ui,sans-serif");
      document.body.appendChild(a);
    };
    if (document.body) nvCover(); else document.addEventListener("DOMContentLoaded", nvCover);
  }

  /* ---------- the attribution boundary ----------
     THE one place that decides which URL parameters may leave this browser.

     nevamis.ca/privacy promises that each count records "only the event name,
     the page path, the referring site's hostname, and campaign tags", and that
     "no identifiers are stored". Everything that reported a "source" used to
     satisfy that by accident, by copying location.search wholesale and trusting
     that every page only ever carried utm tags. proposal.html carries ?to=<the
     recipient's name>, so a personal name was reaching site_events.source, and
     ?customer_id=12345 or any future ?email= would have done the same.

     The rule is REBUILD, NEVER COPY. Nothing derived from the original query
     string is passed through: the allowed keys are read individually and a new
     string is assembled from them. That kills the whole bypass class rather
     than the one instance we found - ?%74%6f=Sneaky decodes to to=Sneaky and
     would defeat any filter that pattern-matched the raw string, but it cannot
     survive a rebuild, because "to" is simply never asked for.

     Keys are matched exactly, lower-case. URL parameters are case-sensitive by
     spec, the funnel intake below has always read them that way, and the engine
     reads exactly these names (src/domain/attribution.ts). So ?UTM_SOURCE=x is
     dropped: a mis-cased campaign link loses its tag, which is a real but small
     cost, and the alternative is a second matching rule that disagrees with
     every consumer. */
  var NV_ATTRIB_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term",
    "utm_content", "gclid", "msclkid", "fbclid"];

  /** Allowed campaign tags from the CURRENT url, as an object. */
  function nvAttribution() {
    var out = {};
    try {
      var q = new URLSearchParams(location.search);
      for (var i = 0; i < NV_ATTRIB_KEYS.length; i++) {
        var k = NV_ATTRIB_KEYS[i], v = q.get(k);
        if (v) out[k] = String(v).slice(0, 120);
      }
    } catch (e) { /* older browser: no tags rather than a broken page */ }
    return out;
  }

  /** The same tags as a query string, rebuilt and re-encoded from scratch.
   *  This is the ONLY value any payload may use to describe where a visit came
   *  from. Exposed on window because book.html and coming-soon.html post their
   *  own lead forms and must not reinvent this. */
  function nvAttributionQuery() {
    var o = nvAttribution(), parts = [];
    for (var i = 0; i < NV_ATTRIB_KEYS.length; i++) {
      var k = NV_ATTRIB_KEYS[i];
      if (o[k]) parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(o[k]));
    }
    return parts.join("&");
  }
  window.nvAttributionQuery = nvAttributionQuery;

  /** The same tags as a "?a=b&c=d" suffix, or "" when there are none.
   *  Lead forms post source as "<label><suffix>", which is the shape
   *  src/domain/attribution.ts parses: it finds the first "?" and reads the
   *  tags after it. Kept here so no page has to remember that contract. */
  window.nvSourceTags = function () {
    var q = nvAttributionQuery();
    return q ? "?" + q : "";
  };

  /** The referring site's ORIGIN (scheme and host), and nothing else.
   *  nevamis.ca/privacy promises "the referring site's hostname". Both beacons
   *  used to send document.referrer whole, which is a full URL: a referral from
   *  a CRM, a webmail link or a search results page carries its path and query
   *  string, and those can hold a record id, a mailbox or what someone searched
   *  for. Same rule as the attribution boundary above: rebuild, never copy.
   *
   *  The origin, not the bare hostname: both engine intake routes
   *  (/api/events and /api/mkt/events) run new URL(referrer).hostname and
   *  store null when that throws, and new URL("www.google.com") throws. A bare
   *  hostname was stored as null on every event from 2026-09-14. The origin
   *  carries no path, query or fragment, and the engine reduces it to the
   *  hostname before storing, so what is kept is still only the hostname.
   *  A referrer with no network origin (an app link) sends nothing. */
  function nvReferrerHost() {
    try {
      if (!document.referrer) return "";
      var o = new URL(document.referrer).origin;
      return /^https?:\/\/[^\/?#]+$/.test(o) && o.length <= 260 ? o : "";
    } catch (e) { return ""; }
  }

  /* ---------- analytics event layer (first-party, owner-approved 2026-07-27) ----------
     Events go to the Nevamis engine only: anonymous counts (event name, page,
     referrer host, utm), no cookies, no IPs stored. Sent as text/plain so the
     beacon stays a simple request (no CORS preflight). Never breaks the page. */
  var NV_EVENTS_URL = "https://app.nevamis.ca/api/events";
  function nvSend(name) {
    try {
      var payload = JSON.stringify({
        name: name,
        page: location.pathname,
        referrer: nvReferrerHost(),
        source: nvAttributionQuery().slice(0, 200)
      });
      if (navigator.sendBeacon) { navigator.sendBeacon(NV_EVENTS_URL, payload); return; }
      if (typeof window.fetch === "function") {
        fetch(NV_EVENTS_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: payload, keepalive: true }).catch(function () {});
      }
    } catch (e) { /* analytics must never break the page */ }
  }
  window.nvEvents = window.nvEvents || [];
  window.nvTrack = function (name, data) {
    window.nvEvents.push({ event: name, data: data || {}, t: Date.now() });
    nvSend(name);
    if (window.gtag) { try { window.gtag("event", name, data || {}); } catch (e) {} }
    if (window.plausible) { try { window.plausible(name, { props: data || {} }); } catch (e) {} }
  };
  nvSend("page_view");
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-evt]");
    if (el) window.nvTrack(el.getAttribute("data-evt"));
  });

  /* ---------- funnel intake (campaign attribution) ----------
     Sends the small set of funnel events to /api/mkt/events with the
     campaign tags PARSED into fields, so spend can be divided by
     campaign and cost per qualified demo call becomes computable.

     PRIVACY: nevamis.ca/privacy says this site "stores one preference
     in your browser" and that "no identifiers are stored". So this
     block deliberately:
       - stores NOTHING new client-side (no cookie, no sessionStorage)
       - sends NO visitor identifier
       - reads campaign tags from the CURRENT URL only
     Consequence, accepted on purpose: attribution is campaign-level and
     strongest on the landing hit. Persisting tags across a multi-page
     journey would require changing the published policy first.

     This block already did the right thing - it named its keys instead of
     copying the query string - which is why it never leaked. It now shares the
     one allowlist above rather than keeping a second copy that drifted: this
     list omitted fbclid, which the engine has always accepted, so a Facebook
     click id was parsed from lead forms and dropped from the funnel intake. */
  var NV_MKT_URL = "https://app.nevamis.ca/api/mkt/events";
  function nvParams() { return nvAttribution(); }
  function nvFunnel(name) {
    try {
      var p = nvParams();
      p.name = name;
      p.page = location.pathname;
      p.referrer = nvReferrerHost();
      var payload = JSON.stringify(p);
      if (navigator.sendBeacon) { navigator.sendBeacon(NV_MKT_URL, payload); return; }
      if (typeof window.fetch === "function") {
        fetch(NV_MKT_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: payload, keepalive: true }).catch(function () {});
      }
    } catch (e) { /* analytics must never break the page */ }
  }
  window.nvFunnel = nvFunnel;
  window.nvCampaignParams = nvParams;

  /* ---------- carry campaign tags across the journey, storing nothing ----------
     The tags were read from the CURRENT url only, so they survived exactly one
     page. Somebody arriving on an ad, reading the pricing page and then
     signing up looked identical to somebody who typed the address in, and the
     ad that produced a paying client was unattributable.

     A cookie would fix it and would also contradict a published legal page:
     privacy.html states that no identifiers are stored and names the two
     things this site keeps in a browser. So nothing is stored. Instead, at
     the moment a Nevamis link is CLICKED, whatever tags are in the current
     address are copied onto the destination. Each hop hands them to the next,
     so a five-page journey keeps them with no state anywhere.

     Decorated on click rather than written into the markup, so crawlers never
     see a tagged internal link and no duplicate URLs enter the index. */
  function nvSameProperty(url) {
    try {
      var h = new URL(url, location.href).hostname;
      return h === location.hostname || h === "nevamis.ca" || h === "www.nevamis.ca" || h === "app.nevamis.ca";
    } catch (e) { return false; }
  }
  document.addEventListener("click", function (e) {
    try {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      var href = a.getAttribute("href") || "";
      if (/^(tel:|mailto:|#|javascript:)/i.test(href)) return;
      if (!nvSameProperty(href)) return;

      var tags = nvParams();
      var keys = Object.keys(tags);
      if (!keys.length) return;

      var dest = new URL(href, location.href);
      // Never overwrite a tag the destination link set for itself.
      keys.forEach(function (k) { if (!dest.searchParams.has(k)) dest.searchParams.set(k, tags[k]); });
      a.setAttribute("href", dest.href);
    } catch (err) { /* attribution must never block a click */ }
  }, true);
  nvFunnel("landing_page_view");

  /* A tap on any phone link is intent to call the demo line: the
     primary conversion of the whole funnel. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="tel:"]');
    if (a) nvFunnel("demo_call_click");
  });

  /* ---------- section reach + scroll depth ----------
     Answers "where do people quit?" without any personal data: one fire-once
     event per major section, plus depth milestones. Names only, no properties. */
  (function () {
    if (typeof window.IntersectionObserver !== "function") return;
    var sections = document.querySelectorAll("main section[id]");
    if (!sections.length) return;
    var seen = {};
    var secIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        if (seen[id]) return;
        seen[id] = 1;
        window.nvTrack("section_reached_" + id.replace(/-/g, "_"));
        secIO.unobserve(en.target);
      });
    }, { threshold: 0.35 });
    sections.forEach(function (s) { secIO.observe(s); });

    var marks = [25, 50, 75, 100], hit = {};
    var onDepth = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      var pct = Math.round((window.scrollY / max) * 100);
      marks.forEach(function (m) {
        if (pct >= m && !hit[m]) { hit[m] = 1; window.nvTrack("scroll_depth_" + m); }
      });
      if (hit[100]) window.removeEventListener("scroll", onDepth);
    };
    window.addEventListener("scroll", onDepth, { passive: true });
  })();

  /* ---------- returning from a demo call ----------
     Tapping the phone CTA is the highest-intent action on the site and was
     previously unhandled. Flag it, and when the visitor comes back to the tab
     offer the obvious next step once. */
  (function () {
    var KEY = "nv-called";
    document.addEventListener("click", function (e) {
      var el = e.target.closest && e.target.closest('a[href^="tel:"]');
      if (el) { try { sessionStorage.setItem(KEY, String(Date.now())); } catch (err) {} }
    });

    function offer() {
      var at;
      try { at = Number(sessionStorage.getItem(KEY) || 0); } catch (err) { return; }
      if (!at) return;
      /* only if they were away long enough to have actually called */
      if (Date.now() - at < 25000) return;
      try { sessionStorage.removeItem(KEY); } catch (err) {}
      if (document.querySelector(".callback-bar")) return;

      var bar = document.createElement("div");
      bar.className = "callback-bar";
      bar.setAttribute("role", "region");
      bar.setAttribute("aria-label", "After your call");

      var msg = document.createElement("span");
      msg.textContent = "How did that call go? That was the same agent your customers would reach.";

      var cta = document.createElement("a");
      cta.className = "btn btn-primary";
      cta.href = "/book.html";
      cta.setAttribute("data-evt", "post_call_book_click");
      cta.textContent = "Build that for my business";

      var close = document.createElement("button");
      close.type = "button";
      close.className = "callback-close";
      close.setAttribute("aria-label", "Dismiss");
      close.textContent = "×";

      bar.appendChild(msg); bar.appendChild(cta); bar.appendChild(close);
      document.body.appendChild(bar);
      requestAnimationFrame(function () { bar.classList.add("in"); });
      window.nvTrack("post_call_prompt_shown");
      close.addEventListener("click", function () {
        bar.classList.remove("in");
        setTimeout(function () { bar.remove(); }, 300);
      });
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) offer(); });
    window.addEventListener("focus", offer);
  })();

  /* ---------- inline scheduler ----------
     Injected only when scrolled into view, so a third-party iframe never
     costs anything to visitors who do not reach the bottom of the page. */
  (function () {
    var host = document.querySelector("[data-book-src]");
    if (!host || typeof window.IntersectionObserver !== "function") return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.disconnect();
        var f = document.createElement("iframe");
        f.src = host.getAttribute("data-book-src");
        f.title = "Book a 15-minute intro call with Daren on the Cal.com scheduler";
        f.loading = "lazy";
        /* One declaration, in site.css, shared with book.html. This was
           inline: 680px, and background:#fff on a dark page. */
        f.className = "nv-cal-frame";
        host.appendChild(f);
        window.nvTrack("inline_scheduler_shown");
      });
    }, { rootMargin: "300px" });
    io.observe(host);
  })();

  /* ---------- mobile nav ---------- */
  var navBtn = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", String(open));
      navBtn.textContent = open ? "✕" : "☰";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        navBtn.setAttribute("aria-expanded", "false");
        navBtn.textContent = "☰";
      }
    });
  }

  /* ---------- same-page anchors ----------
     Nav and footer links use absolute "/#id" so they work from every page.
     On the homepage that would trigger a needless reload, so scroll instead. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/#"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    if (location.pathname !== "/" && !/\/index\.html$/.test(location.pathname)) return;
    var el = document.getElementById(a.getAttribute("href").slice(2));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    history.pushState(null, "", a.getAttribute("href"));
  });

  /* ---------- motion toggle (WCAG 2.2.2) ---------- */
  var mBtn = document.querySelector(".motion-toggle-btn");
  function applyMotionLabel() {
    if (!mBtn) return;
    var off = document.documentElement.classList.contains("motion-off");
    mBtn.textContent = off ? "play motion" : "pause motion";
    mBtn.setAttribute("aria-pressed", String(off));
  }
  if (mBtn) {
    if (reduced) mBtn.style.display = "none";
    applyMotionLabel();
    mBtn.addEventListener("click", function () {
      var off = document.documentElement.classList.toggle("motion-off");
      safeSet("nv-motion", off ? "off" : "on");
      applyMotionLabel();
    });
  }

  /* ---------- scroll reveals (content visible without JS via .no-js) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (typeof window.IntersectionObserver === "function" && !motionOff) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    /* Arm only what the visitor has not reached. Two things fall out of it:
       a block already on screen when this script finally arrives is never
       hidden (it is an entrance, and there is nothing to enter), and a block
       the visitor scrolled to while the script was still downloading does not
       vanish underneath them. */
    var fold = window.innerHeight || 0;
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < fold) return;
      el.classList.add("armed");
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- call player with waveform progress ---------- */
  var playBtn = document.getElementById("playBtn");
  var card = document.getElementById("callCard");
  if (playBtn && card) {
    var label = document.getElementById("playLabel");
    var timer = document.getElementById("callTimer");
    var waveC = document.getElementById("callWave");
    var lines = Array.prototype.slice.call(card.querySelectorAll(".line[data-audio]"));
    /* Measured durations (ffprobe, 2026-07-27) of the turns a page plays, in
       order: call-0..7, call-9, call-10. call-8 has no line on any page, so
       its 5.5s is not in this list: it shifted every later turn and added six
       seconds to a total nobody heard. */
    var durs = [3.9, 5.2, 3.2, 1.3, 11.3, 1.3, 2.2, 1.3, 1.0, 2.4];
    var totalDur = durs.reduce(function (a, b) { return a + b; }, 0);
    var audio = new Audio();
    var idx = -1, playing = false;
    var wctx = waveC ? waveC.getContext("2d") : null;
    function fmt(s) {
      s = Math.max(0, Math.round(s));
      var m = Math.floor(s / 60), r = s % 60;
      return m + ":" + (r < 10 ? "0" : "") + r;
    }
    function elapsed() {
      var e = 0; for (var i = 0; i < idx; i++) e += durs[i] || 0;
      return e + (audio.currentTime || 0);
    }
    function drawWave() {
      if (!wctx) return;
      var dpr2 = Math.min(window.devicePixelRatio || 1, 2);
      var cw = waveC.clientWidth, ch = 46;
      if (waveC.width !== cw * dpr2) { waveC.width = cw * dpr2; waveC.height = ch * dpr2; wctx.setTransform(dpr2, 0, 0, dpr2, 0, 0); }
      wctx.clearRect(0, 0, cw, ch);
      var n = Math.floor(cw / 5), progX = (elapsed() / totalDur) * cw;
      for (var i = 0; i < n; i++) {
        var x = i * 5;
        var h = 5 + Math.abs(Math.sin(i * 1.7) * 14 + Math.sin(i * 0.53) * 8);
        wctx.fillStyle = x < progX && playing ? "#0E8F6A" : "#D5DEDA";
        wctx.fillRect(x, 23 - h / 2, 3, h);
      }
      if (timer) timer.textContent = fmt(playing ? elapsed() : 0) + " / " + fmt(totalDur);
      if (playing) requestAnimationFrame(drawWave);
    }
    function clearHl() { lines.forEach(function (l) { l.classList.remove("speaking"); }); }
    function resetPlayer() {
      playing = false; idx = -1; audio.pause();
      card.classList.remove("playing"); clearHl();
      if (label) label.textContent = "Hear a 33-second call";
      drawWave();
    }
    function playNext() {
      idx += 1;
      if (idx >= lines.length) {
        window.nvTrack("demo_audio_complete");
        document.dispatchEvent(new CustomEvent("nv:callend"));
        resetPlayer(); return;
      }
      clearHl();
      lines[idx].classList.add("speaking");
      document.dispatchEvent(new CustomEvent("nv:callline", { detail: { idx: idx } }));
      audio.src = lines[idx].getAttribute("data-audio");
      audio.play().catch(resetPlayer);
    }
    audio.addEventListener("ended", playNext);
    playBtn.addEventListener("click", function () {
      if (playing) { resetPlayer(); return; }
      window.nvTrack("demo_audio_play");
      playing = true; idx = -1;
      card.classList.add("playing");
      if (label) label.textContent = "Pause";
      playNext(); drawWave();
    });
    drawWave();
    window.addEventListener("resize", drawWave);
  }

  /* ---------- desktop fallback for tel: links ----------
     A tel: link does nothing useful on a desktop: Windows/Chrome hands it
     to a protocol nothing is listening to and the visitor gets an empty
     window. That silently broke the most important call to action on the
     site for every desktop visitor. On a device that cannot place calls,
     show the number instead of handing off. Phones are untouched.
     Styles are injected here so this needs no HTML or CSS changes and
     therefore works on every page, including pages added later. */
  var canDial = typeof window.matchMedia === "function"
    && window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (!canDial) {
    var dlg = null;
    function buildDialpad() {
      var style = document.createElement("style");
      style.textContent =
        /* margin:auto is what centres a modal <dialog>; the site reset
           zeroes margins globally, which pinned it to the top-left. */
        ".nv-dial{margin:auto;border:1px solid var(--line,rgba(159,240,206,.14));background:var(--card,#0D1C27);color:var(--ink,#EAF3EE);"
        + "border-radius:18px;padding:28px 30px;max-width:390px;box-shadow:0 30px 80px -20px rgba(0,0,0,.7)}"
        + ".nv-dial::backdrop{background:rgba(2,8,13,.72)}"
        + ".nv-dial h2{margin:0 0 6px;font-size:20px}"
        + ".nv-dial p{margin:0 0 18px;color:var(--muted,#8AA5A0);font-size:14px;line-height:1.5}"
        + ".nv-dial-num{display:block;font-size:26px;letter-spacing:.5px;margin-bottom:16px;color:var(--mint,#9FF0CE);"
        + "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;user-select:all}"
        + ".nv-dial-fine{font-size:12px;line-height:1.5;color:var(--muted,#8AA5A0);margin:12px 0 0}"
        + ".nv-dial-or{display:block;margin:20px 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted,#8AA5A0)}"
        + ".nv-dial-row{display:flex;gap:10px;flex-wrap:wrap}"
        + ".nv-dial button[disabled]{opacity:.6;cursor:default}"
        + ".nv-dial button{font:inherit;cursor:pointer;border-radius:999px;padding:10px 18px;border:1px solid var(--line,rgba(159,240,206,.14));"
        + "background:transparent;color:var(--ink,#EAF3EE)}"
        + ".nv-dial a.pri{display:inline-block;text-decoration:none;border-radius:999px;padding:10px 18px;"
        + "background:var(--emerald,#2FBF8F);color:#04120C;font-weight:600}";
      document.head.appendChild(style);

      dlg = document.createElement("dialog");
      dlg.className = "nv-dial";
      dlg.setAttribute("aria-label", "Talk to the Nevamis front desk");
      dlg.innerHTML =
        '<h2>Talk to the front desk</h2>'
        + '<p>Speak to it in your browser, or dial it from a phone. Same assistant either way, so try to trip it up.</p>'
        + '<div class="nv-dial-row"><a class="pri" href="/talk/" target="_blank" rel="noopener">Start a voice call in your browser</a></div>'
        + '<p class="nv-dial-fine">Browser calls open on a page of their own and run through ElevenLabs, our voice provider. '
        + 'Your microphone is used only during the call, and the call is recorded, exactly like the phone line.</p>'
        + '<span class="nv-dial-or">or call from any phone</span>'
        + '<span class="nv-dial-num">(587) 413-0035</span>'
        + '<div class="nv-dial-row"><button type="button" data-copy>Copy number</button>'
        + '<button type="button" data-close>Close</button></div>';
      document.body.appendChild(dlg);

      dlg.addEventListener("click", function (ev) {
        var t = ev.target;
        if (!t.hasAttribute) return;
        if (t.hasAttribute("data-close")) { dlg.close(); return; }
        /* The browser call opens in its own tab; this dialog has done its job. */
        if (t.closest && t.closest("a.pri")) { dlg.close(); return; }
        if (t.hasAttribute("data-copy")) {
          var done = function () { t.textContent = "Copied"; setTimeout(function () { t.textContent = "Copy number"; }, 1800); };
          try {
            if (navigator.clipboard) navigator.clipboard.writeText("+1 587 413 0035").then(done, function () {});
          } catch (err) { /* the number is selectable either way */ }
        }
      });
    }

    /* The in-browser call lives on /talk/ now. It used to inject the
       ElevenLabs widget into THIS page from the unpkg CDN with no version
       and no integrity check, so whatever npm published as "latest" ran on
       every nevamis.ca page with the booking and callback forms beside it.
       /talk/ serves a pinned, verified copy under a policy of its own, and
       every other page allows no third-party script at all. */

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      try {
        if (!dlg) buildDialpad();
        dlg.showModal();
      } catch (err) {
        /* If <dialog> is unsupported, fall back to letting the link run
           rather than swallowing the click entirely. */
        window.location.href = a.getAttribute("href");
      }
    });
  }

  /* ---------- coverage mode tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".modes [role=tab]"));
  if (tabs.length) {
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
    function selectTab(i) {
      tabs.forEach(function (t, j) {
        t.setAttribute("aria-selected", String(i === j));
        t.tabIndex = i === j ? 0 : -1;
        if (panels[j]) panels[j].hidden = i !== j;
      });
      tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectTab(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") selectTab((i + 1) % tabs.length);
        if (e.key === "ArrowLeft") selectTab((i - 1 + tabs.length) % tabs.length);
      });
    });
  }

  /* ---------- signal path step highlight ---------- */
  var psteps = document.querySelectorAll(".pstep");
  if (psteps.length && typeof window.IntersectionObserver === "function" && !motionOff) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          psteps.forEach(function (p, i) {
            setTimeout(function () { p.classList.add("active"); }, i * 260);
          });
        }
      });
    }, { threshold: .3 }).observe(psteps[0]);
  } else { psteps.forEach(function (p) { p.classList.add("active"); }); }

  /* ---------- ROI calculator ---------- */
  var roiForm = document.getElementById("roiForm");
  if (roiForm) {
    var out = {
      opp: document.getElementById("roiOpp"),
      rec: document.getElementById("roiRec"),
      be: document.getElementById("roiBe"),
      beRow: document.getElementById("roiBeRow"),
      /* The narrow-screen compact estimate. A second PRESENTATION of the same
         number, never a second calculation: it is written from the oppValue
         computed below, in the same pass, so the two can never disagree. */
      mini: document.getElementById("roiMini")
    };
    var announced = document.getElementById("roiLive");
    function money(v) { return "$" + Math.round(v).toLocaleString("en-CA"); }
    function calc() {
      var missed = parseFloat(document.getElementById("roiMissed").value) || 0;
      var realPct = (parseFloat(document.getElementById("roiReal").value) || 0) / 100;
      var value = parseFloat(document.getElementById("roiValue").value) || 0;
      var close = (parseFloat(document.getElementById("roiClose").value) || 0) / 100;
      var quote = parseFloat(document.getElementById("roiQuote").value) || 0;
      var monthlyMissed = missed * 4.33;
      var oppValue = monthlyMissed * realPct * value * close;
      var recovered = oppValue * 0.5; /* conservative: capture half of what currently hits voicemail */
      if (out.opp) out.opp.textContent = money(oppValue);
      if (out.mini) out.mini.textContent = money(oppValue);
      if (out.rec) out.rec.textContent = money(recovered);
      if (out.beRow) {
        if (quote > 0) {
          out.beRow.hidden = false;
          /* WON jobs, so the close rate is not in it. This divided by
             value x close until 2026-09-24, which is the number of real
             inquiries you would have to answer, not the jobs you would have
             to win: at the defaults (the recommended plan's monthly, a job
             value of 400 and a 50% close rate) it said 5 won jobs where 3
             cover it. It understated the product,
             under a label and a hint that both say "won jobs". With no job
             value there is no break-even to state, so the row shows the dash
             it starts with rather than claiming 0 jobs cover the plan. */
          if (value > 0) {
            var jobs = Math.ceil(quote / value);
            out.be.textContent = jobs + (jobs === 1 ? " won job" : " won jobs") + " per month";
          } else out.be.textContent = "–";
        } else out.beRow.hidden = true;
      }
      if (announced) announced.textContent = "Estimated opportunity " + money(oppValue) + " per month, conservative recovery " + money(recovered) + ".";
      if (!roiForm.dataset.tracked && (missed > 0 && value > 0)) {
        roiForm.dataset.tracked = "1";
        window.nvTrack("roi_calculator_complete");
      }
    }
    /* The comparison figure is PREFILLED FROM pricing-config.js, not from the
       markup. The markup literal is only the no-JS fallback. This existed as a
       hardcoded value="449" and shipped a price retired 2026-08-06 to
       production, under a label that named it "the Growth plan": invisible to
       every guard, because none of them read input attributes and none of the
       pricing renderers touched this field. Reading it from the same record
       the price cards read means the two cannot disagree again. Runs BEFORE
       the first calc() so the break-even row is computed from the real
       figure. */
    var quoteEl = document.getElementById("roiQuote");
    var NVP = window.NV_PRICING;
    if (quoteEl && NVP && NVP.approved && Array.isArray(NVP.plans)) {
      var recPlan = NVP.plans.filter(function (pl) { return pl.recommended; })[0]
        || NVP.plans[0];
      if (recPlan && Number(recPlan.monthly) > 0) {
        quoteEl.value = String(Number(recPlan.monthly));
        var planLabel = document.getElementById("roiQuotePlan");
        if (planLabel && recPlan.name) planLabel.textContent = recPlan.name;
      }
    }

    roiForm.addEventListener("input", calc);
    roiForm.addEventListener("submit", function (e) { e.preventDefault(); calc(); });
    calc();
  }

  /* ---------- the homepage plans strip ----------
     Every figure here is rendered from window.NV_PRICING at runtime. No price
     is ever typed into the homepage HTML: a retired figure once shipped to
     production inside an input attribute because nothing that read
     pricing-config.js was looking at the markup. The sentence shape and the
     grouping helper are copied from pricing.html so the two pages cannot say
     the same number differently. A plan with selfServe:false shows no monthly
     and no percentage: it is offered by invitation, never as a price.
     Add-on rows are derived from the stations actually on the page, so an
     add-on the page does not describe can never be priced here. */
  var PS = document.getElementById("plansStrip");
  var NVP2 = window.NV_PRICING;
  if (PS && NVP2 && NVP2.approved && Array.isArray(NVP2.plans)) {
    var grp = function (n) { return Number(n).toLocaleString("en-CA"); };
    var sentence = function (x) {
      return "C$" + grp(x.launch) + " Launch & Implementation to start, then C$" + grp(x.monthly) + " a month";
    };
    var esc = function (s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    var html = '<div class="plan-row">';
    NVP2.plans.forEach(function (pl) {
      html += '<div class="card' + (pl.recommended ? " card-featured" : "") + '">';
      html += "<h3>" + esc(pl.name)
        + (pl.recommended && NVP2.recommendedLabel ? ' <span class="chip rec">' + esc(NVP2.recommendedLabel) + "</span>" : "")
        + "</h3>";
      if (pl.selfServe === false) {
        html += '<p class="price">By invitation.</p>';
        if (pl.performanceNote) html += "<p>" + esc(pl.performanceNote) + "</p>";
      } else {
        html += '<p class="price">' + esc(sentence(pl)) + ".</p>";
        if (pl.bestFor) html += "<p>" + esc(pl.bestFor) + "</p>";
        if (pl.performanceNote == null) html += "<p>No performance fee.</p>";
      }
      html += "</div>";
    });
    html += "</div>";
    if (NVP2.enterprise) {
      html += '<div class="card"><h3>' + esc(NVP2.enterprise.name) + "</h3>";
      if (NVP2.enterprise.launchFrom) {
        html += '<p class="price">Launch &amp; Implementation starting at C$'
          + grp(NVP2.enterprise.launchFrom) + ".</p>";
      }
      if (NVP2.enterprise.note) html += "<p>" + esc(NVP2.enterprise.note) + "</p>";
      html += "</div>";
    }
    var onPage = [].slice.call(document.querySelectorAll("#doc .svc[data-addon]"))
      .map(function (el) { return el.getAttribute("data-addon"); });
    var rows = (NVP2.addOns || []).filter(function (a) {
      return a.sellable && a.monthly && onPage.indexOf(a.id) >= 0;
    }).sort(function (a, b) {
      return (a.id === "quote_chase" ? -1 : 0) - (b.id === "quote_chase" ? -1 : 0);
    });
    if (rows.length) {
      html += '<div class="card"><ul class="node-list">';
      rows.forEach(function (a) {
        html += "<li>" + esc(a.name) + ": " + esc(sentence(a))
          + '<span class="tag mono">ADD-ON</span></li>';
      });
      /* "Every other add-on" is only true while one is left out. Since
         2026-09-24 the stations describe all four sold modules, so every
         priced add-on is already in this list, and the sentence would point
         a buyer at a pricing page for modules that do not exist. It follows
         the list instead of assuming it. */
      var leftOut = (NVP2.addOns || []).filter(function (a) {
        return a.sellable && a.monthly && onPage.indexOf(a.id) < 0;
      }).length;
      html += '</ul><p class="fine2">'
        + (leftOut ? "Every other add-on is on the " : "Every plan and add-on, side by side, is on the ")
        + '<a class="more" href="/pricing.html">pricing page</a>.</p></div>';
    }
    if (NVP2.terms && NVP2.terms.note) {
      html += '<p class="fine2">' + esc(NVP2.terms.note)
        + (NVP2.taxNote ? " " + esc(NVP2.taxNote) : "") + "</p>";
    }
    PS.innerHTML = html;

    /* The film's own PLANS station carried these four figures as typed HTML.
       They were invisible while .nv-live hid #doc, and went live the moment
       that section became the page's six stations. They matched the config on
       the day, which is exactly how a retired figure reached production once
       before: nothing was keeping them in sync. They render from the same
       record as the strip now, so there is one source and no drift. */
    [].slice.call(document.querySelectorAll("[data-plan-price]")).forEach(function (el) {
      var key = el.getAttribute("data-plan-price");
      if (key === "enterprise") {
        var ent = NVP2.enterprise;
        if (ent && ent.launchFrom) {
          el.textContent = "Launch & Implementation starting at C$" + grp(ent.launchFrom)
            + " or custom quoted; the recurring amount and any performance component are quoted per client.";
        }
        return;
      }
      var pl = NVP2.plans.filter(function (p) { return p.id === key; })[0];
      if (!pl) return;
      el.textContent = (pl.selfServe === false) ? "By invitation." : sentence(pl) + ".";
    });

    /* the wedge's own price line, same record, same sentence */
    var qr = document.getElementById("qrPrice");
    var qa = (NVP2.addOns || []).filter(function (a) {
      return a.id === "quote_chase" && a.sellable && a.monthly;
    })[0];
    if (qr && qa) qr.textContent = qa.name + ": " + sentence(qa) + ".";
  }
  } catch (err) {
    /* Fail open: restore the CSS safety state so all content is visible. */
    try { document.documentElement.classList.add("no-js"); } catch (e2) {}
    try {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    } catch (e3) {}
  }
})();
