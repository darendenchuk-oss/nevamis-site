/* Nevamis Phase 2 motion system: header states, Living Signal, hero chips,
   capability rail, call-proof sync, simulator FSM, sales reveals.
   No dependencies. Everything degrades: content is complete with no JS,
   reduced motion, or the motion toggle off. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function motionOK() { return !reduced && !document.documentElement.classList.contains("motion-off"); }

  /* ---------- header: scrolled state + one-shot logo pulse + active section ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    var dot = header.querySelector(".wordmark circle");
    if (dot && motionOK()) dot.classList.add("pulse-dot");
  }
  var sectionIds = ["how", "solutions", "industries"];
  var navLinks = {};
  sectionIds.forEach(function (id) {
    var a = document.querySelector('.main-nav a[href="/#' + id + '"]');
    var s = document.getElementById(id);
    if (a && s) navLinks[id] = { a: a, s: s };
  });
  if (Object.keys(navLinks).length && "IntersectionObserver" in window) {
    var secIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var id = e.target.id;
        if (navLinks[id]) navLinks[id].a.classList.toggle("active-section", e.isIntersecting);
      });
    }, { rootMargin: "-30% 0px -55% 0px" });
    sectionIds.forEach(function (id) { if (navLinks[id]) secIO.observe(navLinks[id].s); });
  }

  /* ---------- living signal spine ---------- */
  document.querySelectorAll("[data-spine]").forEach(function (sec) {
    var sp = document.createElement("div");
    sp.className = "spine"; sp.setAttribute("aria-hidden", "true");
    sp.innerHTML = "<i></i>";
    sec.prepend(sp);
    if ("IntersectionObserver" in window && motionOK()) {
      new IntersectionObserver(function (es, io) {
        es.forEach(function (e) { if (e.isIntersecting) { sp.classList.add("in"); io.disconnect(); } });
      }, { threshold: 0.2 }).observe(sec);
    } else sp.classList.add("in");
  });

  /* ---------- hero media: cinematic video when the asset exists, call theatre otherwise ---------- */
  var heroMedia = document.querySelector(".hero-media");
  if (heroMedia) {
    fetch("assets/hero-loop.mp4", { method: "HEAD" }).then(function (r) {
      if (!r.ok) throw 0;
      var v = document.createElement("video");
      v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", "");
      v.preload = "metadata";
      v.poster = "assets/hero-poster.webp";
      v.src = "assets/hero-loop.mp4";
      v.setAttribute("aria-hidden", "true");
      var theatre = document.getElementById("theatre");
      if (theatre) theatre.style.display = "none";
      heroMedia.prepend(v);
      if (motionOK()) {
        v.play().catch(function () {});
        if ("IntersectionObserver" in window) {
          new IntersectionObserver(function (es) {
            es.forEach(function (e) { e.isIntersecting && motionOK() ? v.play().catch(function(){}) : v.pause(); });
          }).observe(v);
        }
      }
      document.addEventListener("visibilitychange", function () { if (document.hidden) v.pause(); });
    }).catch(function () { /* no video asset yet: the call theatre carries the hero */ });
  }

  /* ---------- capability rail ---------- */
  var strip = document.querySelector(".trust-strip .wrap");
  var stripList = strip && strip.querySelector("ul");
  if (strip && stripList && motionOK() && window.innerWidth > 820) {
    var items = stripList.innerHTML;
    var track = document.createElement("div");
    track.className = "rail-track";
    track.innerHTML = "<ul style='display:flex;gap:26px;list-style:none;padding:0;margin:0'>" + items + "</ul>" +
                      "<ul aria-hidden='true' style='display:flex;gap:26px;list-style:none;padding:0;margin:0'>" + items + "</ul>";
    stripList.replaceWith(track);
  }

  /* ---------- call proof: chip sync + summary arrival ---------- */
  var proofChips = {
    qualified: document.querySelector('[data-callchip="qualified"]'),
    booked: document.querySelector('[data-callchip="booked"]'),
    confirm: document.querySelector('[data-callchip="confirm"]')
  };
  var summaryCard = document.querySelector(".summary-arrive");
  function litChips(state) {
    if (proofChips.qualified) proofChips.qualified.classList.toggle("lit", state >= 1);
    if (proofChips.booked) proofChips.booked.classList.toggle("lit", state >= 2);
    if (proofChips.confirm) proofChips.confirm.classList.toggle("lit", state >= 3);
  }
  if (!motionOK()) { litChips(3); if (summaryCard) summaryCard.classList.add("in"); }
  document.addEventListener("nv:callline", function (e) {
    var i = e.detail.idx;
    litChips(i >= 4 ? 3 : i >= 3 ? 2 : i >= 2 ? 1 : 0);
  });
  document.addEventListener("nv:callend", function () {
    litChips(3);
    if (summaryCard) summaryCard.classList.add("in");
  });
  if (summaryCard && "IntersectionObserver" in window && motionOK()) {
    /* if the visitor never plays audio, still reveal the summary on scroll-by */
    new IntersectionObserver(function (es, io) {
      es.forEach(function (e) {
        if (e.isIntersecting) setTimeout(function () { summaryCard.classList.add("in"); litChips(3); }, 1600);
        io.disconnect();
      });
    }, { threshold: 0.4 }).observe(summaryCard);
  }

  /* ---------- build stack / week reveals ---------- */
  document.querySelectorAll(".stack").forEach(function (st) {
    var layers = st.querySelectorAll(".layer");
    layers.forEach(function (l, i) { l.style.transitionDelay = (i * 0.12) + "s"; });
    if ("IntersectionObserver" in window && motionOK()) {
      new IntersectionObserver(function (es, io) {
        es.forEach(function (e) { if (e.isIntersecting) { st.classList.add("in"); io.disconnect(); } });
      }, { threshold: 0.2 }).observe(st);
    } else st.classList.add("in");
  });

  /* ---------- ROI value tick ---------- */
  var roiForm = document.getElementById("roiForm");
  if (roiForm) {
    roiForm.addEventListener("input", function () {
      if (!motionOK()) return;
      document.querySelectorAll(".roi-out .big").forEach(function (b) {
        b.classList.add("tick");
        setTimeout(function () { b.classList.remove("tick"); }, 220);
      });
    });
  }

  /* ---------- final CTA one-shot ring ---------- */
  var finalCta = document.querySelector(".final-cta .btn-primary");
  if (finalCta && "IntersectionObserver" in window && motionOK()) {
    new IntersectionObserver(function (es, io) {
      es.forEach(function (e) { if (e.isIntersecting) { finalCta.classList.add("ring-once"); io.disconnect(); } });
    }, { threshold: 0.6 }).observe(finalCta);
  }

  /* ================= SIMULATOR: finite-state scenario player ================= */
  var sim = document.getElementById("sim");
  if (!sim) return;
  var SCEN = {
    emergency: {
      label: "After-hours emergency",
      steps: [
        { st: "ringing", say: null, note: "Incoming call · 11:42 PM", rules: [], chips: [] },
        { st: "answered", who: "Nevamis", say: "Prairie Mechanical, how can I help you tonight?", rules: [], chips: [] },
        { st: "listening", who: "Caller", say: "Our furnace just died and it's minus twenty out. We've got a newborn in the house.", rules: [], chips: [] },
        { st: "extracting", who: null, say: null, chips: ["Service: furnace failure", "Urgency: emergency", "Occupants: infant"], rules: [] },
        { st: "checking_rules", chips: [], rules: [["Service offered", "pass"], ["Inside service area", "pass"], ["Emergency criteria met", "urgent"], ["On-call tech available", "urgent"]] },
        { st: "escalated", who: "Nevamis", say: "That qualifies as an emergency. I'm connecting you to our on-call technician right now. Stay on the line.", outcome: "transfer" },
        { st: "summarizing", outcome: "summary", sum: "URGENT · Furnace failure, -20°C, infant on site. Transferred to on-call at 11:44 PM. Caller: Dana R., 587-555-0119." },
        { st: "complete" }
      ]
    },
    routine: {
      label: "Routine appointment",
      steps: [
        { st: "ringing", note: "Incoming call · 2:15 PM", rules: [], chips: [] },
        { st: "answered", who: "Nevamis", say: "Prairie Mechanical, how can I help you?", rules: [], chips: [] },
        { st: "listening", who: "Caller", say: "I'd like to book our annual furnace tune-up sometime next week.", rules: [], chips: [] },
        { st: "extracting", chips: ["Service: maintenance", "Urgency: routine", "Timing: next week"], rules: [] },
        { st: "checking_rules", rules: [["Service offered", "pass"], ["Inside service area", "pass"], ["Emergency criteria met", "block"], ["Calendar has openings", "pass"]] },
        { st: "selecting_slot", who: "Nevamis", say: "I can do Tuesday at 10 AM or Thursday at 1 PM. Which works better?", chips: [] },
        { st: "booked", who: "Caller", say: "Tuesday at ten.", outcome: "booked" },
        { st: "confirming", who: "Nevamis", say: "Booked. You'll get a text confirmation in a moment.", outcome: "confirm" },
        { st: "summarizing", outcome: "summary", sum: "Booked: furnace tune-up, Tue 10:00 AM. Caller: Sam T., 780-555-0163. New customer." },
        { st: "complete" }
      ]
    },
    unusual: {
      label: "Unusual request",
      steps: [
        { st: "ringing", note: "Incoming call · 4:03 PM", rules: [], chips: [] },
        { st: "answered", who: "Nevamis", say: "Prairie Mechanical, how can I help you?", rules: [], chips: [] },
        { st: "listening", who: "Caller", say: "If I convert to a heat pump, exactly how much will my utility bill drop over five years?", rules: [], chips: [] },
        { st: "extracting", chips: ["Topic: heat pump conversion", "Request: multi-year cost projection"], rules: [] },
        { st: "checking_rules", rules: [["Topic in approved knowledge", "amber"], ["Allowed to quote projections", "block"], ["Fallback configured", "pass"]] },
        { st: "fallback", who: "Nevamis", say: "That deserves a real answer from our senior tech rather than a guess from me. Can I book you a free assessment, or have him call you back?", outcome: "message" },
        { st: "summarizing", outcome: "summary", sum: "Message: heat pump conversion inquiry, wants 5-year cost comparison. Prefers callback after 5 PM. Caller: Alex M., 825-555-0147." },
        { st: "complete" }
      ]
    }
  };
  var STATE_LABEL = {
    ringing: "Ringing", answered: "Answered", listening: "Listening", extracting: "Extracting details",
    checking_rules: "Checking your business rules", selecting_slot: "Offering available slots",
    booked: "Booked", confirming: "Confirmation sent", summarizing: "Owner summary sent",
    complete: "Complete", escalated: "Urgent transfer", fallback: "Safe fallback"
  };
  var STAGES = ["Answer", "Understand", "Check rules", "Take action", "Confirm", "Report"];
  var STATE_STAGE = {
    ringing: 0, answered: 0, listening: 1, extracting: 1, checking_rules: 2,
    selecting_slot: 3, booked: 3, escalated: 3, fallback: 3, confirming: 4,
    summarizing: 5, complete: 5
  };
  var cur = "routine", idx = -1, timer = null, playing = false, lastStage = -1;
  var el = {
    log: sim.querySelector(".sim-log"), chips: sim.querySelector(".sim-chips"),
    rules: sim.querySelector(".sim-rules"), outcome: sim.querySelector(".sim-outcome"),
    state: sim.querySelector("[data-sim-state]"), progress: sim.querySelector(".sim-progress i"),
    elapsed: sim.querySelector(".sim-elapsed"), live: sim.querySelector("[data-sim-live]"),
    play: sim.querySelector("[data-sim-play]"),
    rail: Array.prototype.slice.call(sim.querySelectorAll(".stage-pill")),
    idle: document.getElementById("simIdle"), body: document.getElementById("simBody"),
    watch: document.getElementById("simWatch"), stepMode: document.getElementById("simStepMode"),
    backLabel: sim.querySelector("[data-back-label]"), fwdLabel: sim.querySelector("[data-fwd-label]")
  };
  function showBody() {
    if (el.idle) el.idle.hidden = true;
    if (el.body) el.body.hidden = false;
  }
  function stageOf(i) {
    var steps = scen ? scen().steps : null;
    if (!steps || i < 0) return -1;
    return STATE_STAGE[steps[Math.min(i, steps.length - 1)].st] || 0;
  }
  function scen() { return SCEN[cur]; }
  /* SAFETY INVARIANT: everything rendered below via innerHTML comes from the
     hardcoded SCEN constants in this file. Never interpolate user input,
     URL params, or fetched data into these templates without sanitizing. */
  function render() {
    var steps = scen().steps;
    /* conversation log */
    var logHtml = "";
    for (var i = 0; i <= idx && i < steps.length; i++) {
      var s = steps[i];
      if (s.say) logHtml += '<div class="sim-line on"><span class="who">' + (s.who || "") + "</span>" + s.say + "</div>";
      else if (s.note) logHtml += '<div class="sim-line on"><span class="who">SYSTEM</span>' + s.note + "</div>";
    }
    el.log.innerHTML = logHtml || '<div class="sim-line">Press play to start the scenario.</div>';
    /* chips (accumulate) */
    var chipsHtml = "";
    for (var c = 0; c <= idx && c < steps.length; c++) {
      (steps[c].chips || []).forEach(function (ch) {
        var amber = /Topic|Request/.test(ch);
        chipsHtml += '<span class="sim-chip on' + (amber ? " amber" : "") + '">' + ch + "</span>";
      });
    }
    el.chips.innerHTML = chipsHtml;
    /* rules (latest rule-bearing step) */
    var rulesHtml = "";
    for (var r = 0; r <= idx && r < steps.length; r++) {
      if ((steps[r].rules || []).length) {
        rulesHtml = steps[r].rules.map(function (ru) {
          return '<div class="sim-rule ' + ru[1] + '">' + ru[0] + "</div>";
        }).join("");
      }
    }
    el.rules.innerHTML = rulesHtml || '<div class="sim-rule">Rules you approve before launch appear here.</div>';
    /* outcomes */
    var out = { booked: false, confirm: false, transfer: false, message: false, sum: null };
    for (var o = 0; o <= idx && o < steps.length; o++) {
      var st = steps[o];
      if (st.outcome === "booked") out.booked = true;
      if (st.outcome === "confirm") out.confirm = true;
      if (st.outcome === "transfer") out.transfer = true;
      if (st.outcome === "message") out.message = true;
      if (st.sum) out.sum = st.sum;
    }
    el.outcome.innerHTML =
      '<div class="sim-out-card' + (out.booked ? " on" : "") + '"><span class="mono">CALENDAR</span>' + (out.booked ? "Tue 10:00 AM locked in" : "No booking yet") + "</div>" +
      '<div class="sim-out-card' + (out.transfer ? " on warm" : "") + '"><span class="mono">TRANSFER</span>' + (out.transfer ? "Live transfer to on-call tech" : "Not needed") + "</div>" +
      '<div class="sim-out-card' + (out.confirm || out.message ? " on" : "") + '"><span class="mono">CUSTOMER</span>' + (out.confirm ? "SMS confirmation sent" : out.message ? "Callback promised" : "Waiting") + "</div>" +
      '<div class="sim-out-card' + (out.sum ? " on" : "") + '"><span class="mono">OWNER SUMMARY</span>' + (out.sum || "Arrives when the call completes") + "</div>";
    /* state, stage rail, progress, elapsed */
    var label = idx < 0 ? "Idle" : (STATE_LABEL[steps[Math.min(idx, steps.length - 1)].st] || "");
    el.state.textContent = label;
    var stg = stageOf(idx);
    el.rail.forEach(function (p, j) {
      p.classList.toggle("active", j === stg);
      p.classList.toggle("done", j < stg);
    });
    if (el.live && stg !== lastStage) {
      el.live.textContent = stg < 0 ? "" : "Stage " + (stg + 1) + " of 6: " + STAGES[stg];
      lastStage = stg;
    }
    if (el.backLabel) el.backLabel.textContent = stg > 0 ? STAGES[Math.max(stageOf(idx - 1), 0)] : "Back";
    if (el.fwdLabel) {
      var nextStg = idx >= steps.length - 1 ? null : stageOf(idx + 1);
      el.fwdLabel.textContent = nextStg === null ? "Done" : "Next: " + STAGES[nextStg];
    }
    var frac = steps.length > 1 ? Math.max(idx, 0) / (steps.length - 1) : 0;
    el.progress.style.transform = "scaleX(" + frac + ")";
    var secs = Math.round(Math.max(idx, 0) * 3.5);
    el.elapsed.textContent = "0:" + (secs < 10 ? "0" : "") + secs + " elapsed";
  }
  function stop() { playing = false; clearTimeout(timer); el.play.textContent = "Play"; }
  function tick() {
    if (!playing) return;
    if (idx >= scen().steps.length - 1) { stop(); return; }
    idx += 1; render();
    timer = setTimeout(tick, 1250);
  }
  sim.querySelectorAll(".sim-scenarios button").forEach(function (b) {
    b.addEventListener("click", function () {
      sim.querySelectorAll(".sim-scenarios button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      cur = b.getAttribute("data-scen"); stop(); idx = -1; showBody(); render();
      playing = true; el.play.textContent = "Pause"; tick();
    });
  });
  if (el.watch) el.watch.addEventListener("click", function () {
    showBody(); idx = -1; render();
    playing = true; el.play.textContent = "Pause"; tick();
  });
  if (el.stepMode) el.stepMode.addEventListener("click", function () {
    showBody(); stop(); idx = 0; render();
  });
  el.play.addEventListener("click", function () {
    if (playing) { stop(); return; }
    if (idx >= scen().steps.length - 1) idx = -1;
    playing = true; el.play.textContent = "Pause"; tick();
  });
  sim.querySelector("[data-sim-back]").addEventListener("click", function () { stop(); idx = Math.max(-1, idx - 1); render(); });
  sim.querySelector("[data-sim-fwd]").addEventListener("click", function () { stop(); idx = Math.min(scen().steps.length - 1, idx + 1); render(); });
  sim.querySelector("[data-sim-replay]").addEventListener("click", function () { stop(); idx = -1; render(); playing = true; el.play.textContent = "Pause"; tick(); });
  render();
})();
