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
        referrer: document.referrer || "",
        source: location.search ? location.search.slice(1, 200) : ""
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
     journey would require changing the published policy first. */
  var NV_MKT_URL = "https://app.nevamis.ca/api/mkt/events";
  function nvParams() {
    var out = {};
    try {
      var q = new URLSearchParams(location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "msclkid"]
        .forEach(function (k) { var v = q.get(k); if (v) out[k] = v.slice(0, 120); });
    } catch (e) { /* older browser: send without tags rather than break */ }
    return out;
  }
  function nvFunnel(name) {
    try {
      var p = nvParams();
      p.name = name;
      p.page = location.pathname;
      p.referrer = document.referrer || "";
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
        f.style.cssText = "width:100%;height:680px;border:0;border-radius:14px;background:#fff";
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
  function motionAllowed() { return !document.documentElement.classList.contains("motion-off"); }

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

  /* ---------- hero call theatre (replaces the retired signal graph) ---------- */
  var th = document.getElementById("theatre");
  if (th) {
    var thStatus = document.getElementById("thStatus");
    var thContext = document.getElementById("thContext");
    var thQuote = document.getElementById("thQuote");
    var thFacts = document.getElementById("thFacts");
    var thBook = document.getElementById("thBook");
    var thOwner = document.getElementById("thOwner");
    var thRail = Array.prototype.slice.call(document.querySelectorAll("#thRail li"));
    var TH = [
      { s: "INCOMING CALL · 11:42 PM", c: "The crew is on the tools. The business line rings.", q: null },
      { s: "ANSWERED IN SECONDS", c: "Nevamis picks up in the business's own tone.", q: "“Prairie Mechanical, how can I help you tonight?”", agent: true },
      { s: "LISTENING", c: "The caller explains. The facts are captured as they speak.", q: "“Our furnace just died and it’s minus twenty out.”" , facts: true },
      { s: "ACTION TAKEN", c: "Emergency rule passes. The on-call tech is locked in.", q: null, facts: true, book: true },
      { s: "CALL COMPLETE · BOOKED", c: "Work never stopped. The owner knows everything.", q: null, facts: true, book: true, owner: true }
    ];
    var thTimer = null, thIdx = -1, thRunning = false;
    function thCard(el, on) {
      if (!el) return;
      el.hidden = !on;
      requestAnimationFrame(function () { el.classList.toggle("on", on); });
    }
    function thApply(i) {
      var st = TH[i];
      th.setAttribute("data-state", String(i));
      thStatus.textContent = st.s;
      thContext.textContent = st.c;
      if (st.q) {
        thQuote.textContent = st.q;
        thQuote.classList.add("on");
        thQuote.classList.toggle("agent", !!st.agent);
      } else {
        thQuote.classList.remove("on");
      }
      thCard(thFacts, !!st.facts);
      thCard(thBook, !!st.book);
      thCard(thOwner, !!st.owner);
      thRail.forEach(function (li, j) {
        li.classList.toggle("on", j <= i);
        li.classList.toggle("warm", j === 3 && i >= 3);
      });
    }
    function thFinal() { thApply(TH.length - 1); }
    function thStep() {
      if (!thRunning) return;
      thIdx = (thIdx + 1) % TH.length;
      thApply(thIdx);
      thTimer = setTimeout(thStep, thIdx === TH.length - 1 ? 3400 : 2400);
    }
    function thStart() { if (!thRunning && motionAllowed() && !document.hidden) { thRunning = true; thStep(); } }
    function thStop() { thRunning = false; clearTimeout(thTimer); }
    if (motionOff) { thFinal(); }
    else {
      if (typeof window.IntersectionObserver === "function") {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? thStart() : thStop(); });
        }, { rootMargin: "60px" }).observe(th);
      } else thStart();
      document.addEventListener("visibilitychange", function () { document.hidden ? thStop() : thStart(); });
    }
    if (mBtn) mBtn.addEventListener("click", function () {
      if (motionAllowed()) { thIdx = -1; thStart(); } else { thStop(); thFinal(); }
    });
  }

  /* ---------- call player with waveform progress ---------- */
  var playBtn = document.getElementById("playBtn");
  var card = document.getElementById("callCard");
  if (playBtn && card) {
    var label = document.getElementById("playLabel");
    var timer = document.getElementById("callTimer");
    var waveC = document.getElementById("callWave");
    var lines = Array.prototype.slice.call(card.querySelectorAll(".line[data-audio]"));
    /* Measured durations of assets/call-0..10.mp3 (ffprobe, 2026-07-27). */
    var durs = [3.9, 5.2, 3.2, 1.3, 11.3, 1.3, 2.2, 1.3, 5.5, 1.0, 2.4];
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
      if (label) label.textContent = "Hear a 39-second call";
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
        + ".nv-dial button.pri{background:var(--emerald,#2FBF8F);color:#04120C;border-color:transparent;font-weight:600}";
      document.head.appendChild(style);

      dlg = document.createElement("dialog");
      dlg.className = "nv-dial";
      dlg.setAttribute("aria-label", "Talk to the Nevamis front desk");
      dlg.innerHTML =
        '<h2>Talk to the front desk</h2>'
        + '<p>Speak to it right here in your browser, or dial it from a phone. Same assistant either way &mdash; try to trip it up.</p>'
        + '<div class="nv-dial-row"><button type="button" class="pri" data-browser>Start a voice call here</button></div>'
        + '<p class="nv-dial-fine">Browser calls run through ElevenLabs, our voice provider, and load their software only when you press start. '
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
        if (t.hasAttribute("data-browser")) { startBrowserCall(t); return; }
        if (t.hasAttribute("data-copy")) {
          var done = function () { t.textContent = "Copied"; setTimeout(function () { t.textContent = "Copy number"; }, 1800); };
          try {
            if (navigator.clipboard) navigator.clipboard.writeText("+1 587 413 0035").then(done, function () {});
          } catch (err) { /* the number is selectable either way */ }
        }
      });
    }

    /* Third-party voice widget, loaded ON DEMAND only. Visitors who never
       ask for a browser call never fetch it, which keeps the page fast and
       keeps ElevenLabs out of the picture unless someone opts in. */
    var widgetLoading = false;
    function startBrowserCall(btn) {
      window.nvTrack && window.nvTrack("browser_call_start");
      if (document.querySelector("elevenlabs-convai")) { dlg.close(); return; }
      if (widgetLoading) return;
      widgetLoading = true;
      btn.textContent = "Connecting…";
      btn.disabled = true;

      var el = document.createElement("elevenlabs-convai");
      el.setAttribute("agent-id", "agent_9101ky43tys1fswstde818j7j8wt");
      el.setAttribute("default-expanded", "");
      document.body.appendChild(el);

      var s = document.createElement("script");
      s.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
      s.async = true;
      s.onload = function () { setTimeout(function () { if (dlg.open) dlg.close(); }, 400); };
      s.onerror = function () {
        widgetLoading = false;
        btn.disabled = false;
        btn.textContent = "Start a voice call here";
        var fine = dlg.querySelector(".nv-dial-fine");
        if (fine) fine.textContent = "That did not load — your network may be blocking it. Call the number below instead; it is the same assistant.";
      };
      document.head.appendChild(s);
    }

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
      beRow: document.getElementById("roiBeRow")
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
      if (out.rec) out.rec.textContent = money(recovered);
      if (out.beRow) {
        if (quote > 0) {
          out.beRow.hidden = false;
          var jobs = value * close > 0 ? Math.ceil(quote / (value * close)) : 0;
          out.be.textContent = jobs + (jobs === 1 ? " booked job" : " booked jobs") + " per month";
        } else out.beRow.hidden = true;
      }
      if (announced) announced.textContent = "Estimated opportunity " + money(oppValue) + " per month, conservative recovery " + money(recovered) + ".";
      if (!roiForm.dataset.tracked && (missed > 0 && value > 0)) {
        roiForm.dataset.tracked = "1";
        window.nvTrack("roi_calculator_complete");
      }
    }
    roiForm.addEventListener("input", calc);
    roiForm.addEventListener("submit", function (e) { e.preventDefault(); calc(); });
    calc();
  }
  } catch (err) {
    /* Fail open: restore the CSS safety state so all content is visible. */
    try { document.documentElement.classList.add("no-js"); } catch (e2) {}
    try {
      document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
    } catch (e3) {}
  }
})();
