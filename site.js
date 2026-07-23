/* Nevamis AI shared site JS. No dependencies. */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motionOff = reduced || localStorage.getItem("nv-motion") === "off";
  if (motionOff) document.documentElement.classList.add("motion-off");

  /* ---------- analytics event layer (provider-neutral, inert until wired) ---------- */
  window.nvEvents = window.nvEvents || [];
  window.nvTrack = function (name, data) {
    window.nvEvents.push({ event: name, data: data || {}, t: Date.now() });
    if (window.gtag) { try { window.gtag("event", name, data || {}); } catch (e) {} }
    if (window.plausible) { try { window.plausible(name, { props: data || {} }); } catch (e) {} }
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-evt]");
    if (el) window.nvTrack(el.getAttribute("data-evt"));
  });

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
      localStorage.setItem("nv-motion", off ? "off" : "on");
      applyMotionLabel();
    });
  }
  function motionAllowed() { return !document.documentElement.classList.contains("motion-off"); }

  /* ---------- scroll reveals (content visible without JS via .no-js) ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !motionOff) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
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
      { s: "ANSWERED · FIRST RING", c: "Nevamis picks up in the business's own tone.", q: "“Prairie Mechanical, how can I help you tonight?”", agent: true },
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
      if ("IntersectionObserver" in window) {
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
    var durs = [2.4, 5.2, 10.8, 1.7, 6.3, 2.3];
    var totalDur = durs.reduce(function (a, b) { return a + b; }, 0);
    var audio = new Audio();
    var idx = -1, playing = false;
    var wctx = waveC ? waveC.getContext("2d") : null;
    function fmt(s) { s = Math.max(0, Math.round(s)); return "0:" + (s < 10 ? "0" : "") + s; }
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
      if (label) label.textContent = "Hear this call";
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
  if (psteps.length && "IntersectionObserver" in window && !motionOff) {
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
})();
