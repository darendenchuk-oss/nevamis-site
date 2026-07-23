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

  /* ---------- signal scene: call becomes booking (code-native hero art) ---------- */
  var scene = document.getElementById("signalScene");
  if (scene && scene.getContext) {
    var ctx = scene.getContext("2d");
    var W = 640, H = 400, dpr = Math.min(window.devicePixelRatio || 1, 2);
    scene.width = W * dpr; scene.height = H * dpr;
    ctx.scale(dpr, dpr);
    var nodes = [
      { x: 70,  y: 300 }, { x: 180, y: 240 }, { x: 300, y: 280 },
      { x: 400, y: 200 }, { x: 500, y: 240 }
    ];
    var calx = 520, caly = 90, calw = 84, calh = 96;
    var t0 = performance.now(), running = false;
    function drawStatic(prog, pulse) {
      ctx.clearRect(0, 0, W, H);
      /* routing grid dots */
      ctx.fillStyle = "rgba(241,245,242,.05)";
      for (var gx = 20; gx < W; gx += 40) for (var gy = 20; gy < H; gy += 40) ctx.fillRect(gx, gy, 2, 2);
      /* path */
      ctx.strokeStyle = "rgba(56,230,162,.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (var i = 1; i < nodes.length; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(calx + calw / 2, caly + calh + 8);
      ctx.stroke();
      /* nodes */
      nodes.forEach(function (n) {
        ctx.fillStyle = "rgba(2,8,13,.9)";
        ctx.strokeStyle = "rgba(56,230,162,.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, 7, 0, 7); ctx.fill(); ctx.stroke();
      });
      /* calendar block */
      ctx.strokeStyle = "rgba(241,245,242,.35)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(calx, caly, calw, calh);
      for (var r = 1; r < 4; r++) {
        ctx.beginPath(); ctx.moveTo(calx, caly + r * (calh / 4)); ctx.lineTo(calx + calw, caly + r * (calh / 4)); ctx.stroke();
      }
      /* booked cell glow */
      var glow = prog >= 1 ? (0.55 + 0.45 * Math.sin(pulse * 2.2)) : Math.max(0, (prog - .82) / .18);
      if (glow > 0) {
        ctx.fillStyle = "rgba(255,122,61," + (0.55 * glow) + ")";
        ctx.fillRect(calx + 2, caly + calh / 4 + 2, calw - 4, calh / 4 - 4);
        ctx.shadowColor = "rgba(255,122,61,.9)"; ctx.shadowBlur = 18 * glow;
        ctx.fillRect(calx + 2, caly + calh / 4 + 2, calw - 4, calh / 4 - 4);
        ctx.shadowBlur = 0;
      }
      /* travelling signal */
      if (prog < 1) {
        var segs = nodes.concat([{ x: calx + calw / 2, y: caly + calh + 8 }]);
        var total = segs.length - 1, f = prog * total, si = Math.min(Math.floor(f), total - 1), sf = f - si;
        var ax = segs[si].x + (segs[si + 1].x - segs[si].x) * sf;
        var ay = segs[si].y + (segs[si + 1].y - segs[si].y) * sf;
        ctx.fillStyle = "rgba(56,230,162,1)";
        ctx.shadowColor = "rgba(56,230,162,.95)"; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(ax, ay, 5.5, 0, 7); ctx.fill();
        ctx.shadowBlur = 0;
        /* trailing waveform ticks near the dot */
        ctx.strokeStyle = "rgba(56,230,162,.5)";
        for (var w = 1; w <= 4; w++) {
          var wx = ax - w * 10, wh = 6 + Math.sin(prog * 40 + w) * 5;
          ctx.beginPath(); ctx.moveTo(wx, ay - wh); ctx.lineTo(wx, ay + wh); ctx.stroke();
        }
      }
      /* confirmation ring after booking */
      if (prog >= 1) {
        var ring = (pulse % 2.4) / 2.4;
        ctx.strokeStyle = "rgba(56,230,162," + (0.6 * (1 - ring)) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(calx + calw / 2, caly + calh / 2 + calh / 8, 16 + ring * 42, 0, 7); ctx.stroke();
      }
    }
    function loop(now) {
      if (!running) return;
      var t = (now - t0) / 1000;
      var cycle = t % 9;                       /* 9 s story loop */
      var prog = Math.min(cycle / 5.2, 1);     /* signal travels ~5 s, then booked state holds */
      drawStatic(prog, cycle);
      requestAnimationFrame(loop);
    }
    function startScene() { if (!running && motionAllowed() && !document.hidden) { running = true; requestAnimationFrame(loop); } }
    function stopScene() { running = false; }
    if (motionOff) { drawStatic(1, 1.1); }
    else {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? startScene() : stopScene(); });
        }, { rootMargin: "60px" }).observe(scene);
      } else startScene();
      document.addEventListener("visibilitychange", function () { document.hidden ? stopScene() : startScene(); });
    }
    if (mBtn) mBtn.addEventListener("click", function () { motionAllowed() ? startScene() : (stopScene(), drawStatic(1, 1.1)); });
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
      if (idx >= lines.length) { window.nvTrack("demo_audio_complete"); resetPlayer(); return; }
      clearHl();
      lines[idx].classList.add("speaking");
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
