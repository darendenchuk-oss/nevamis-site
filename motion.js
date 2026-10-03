/* Nevamis Phase 2 motion system: header states, Living Signal, hero chips,
   capability rail, call-proof sync, sales reveals.
   No dependencies. Everything degrades: content is complete with no JS,
   reduced motion, or the motion toggle off. */
(function () {
  "use strict";
  /* Decorative motion only. Any failure here must leave content readable:
     the catch at the bottom force-reveals everything this file animates. */
  try {
  document.documentElement.classList.add("js");
  var reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    var a = document.querySelector('.main-nav a[href="/#' + id + '"], .main-nav a[href="#' + id + '"]');
    var s = document.getElementById(id);
    if (a && s) navLinks[id] = { a: a, s: s };
  });
  if (Object.keys(navLinks).length && typeof window.IntersectionObserver === "function") {
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
    if (typeof window.IntersectionObserver === "function" && motionOK()) {
      new IntersectionObserver(function (es, io) {
        es.forEach(function (e) { if (e.isIntersecting) { sp.classList.add("in"); io.disconnect(); } });
      }, { threshold: 0.2 }).observe(sec);
    } else sp.classList.add("in");
  });

  /* ---------- hero media: cinematic video when the asset exists, call theatre otherwise ---------- */
  var heroMedia = document.querySelector(".hero-media");
  if (heroMedia && typeof window.fetch === "function") {
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
        if (typeof window.IntersectionObserver === "function") {
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
    /* 11-line call: qualified once the hazard check lands (line 3), the
       preferred time captured and the details texted on the closing lines
       (8 and 9). The chip keys stay `booked`/`confirm` because they are
       internal identifiers the markup and the tests share; the LABELS a
       visitor reads say what actually happened, which is a request taken
       down and a summary sent to the business. */
    litChips(i >= 9 ? 3 : i >= 8 ? 2 : i >= 3 ? 1 : 0);
  });
  document.addEventListener("nv:callend", function () {
    litChips(3);
    if (summaryCard) summaryCard.classList.add("in");
  });
  if (summaryCard && typeof window.IntersectionObserver === "function" && motionOK()) {
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
    if (typeof window.IntersectionObserver === "function" && motionOK()) {
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
  if (finalCta && typeof window.IntersectionObserver === "function" && motionOK()) {
    new IntersectionObserver(function (es, io) {
      es.forEach(function (e) { if (e.isIntersecting) { finalCta.classList.add("ring-once"); io.disconnect(); } });
    }, { threshold: 0.6 }).observe(finalCta);
  }

  /* The SIMULATOR that ended this file (a finite-state player for three
     scripted calls, mounted on #sim) was deleted on 2026-10-03. No page has
     carried #sim since the homepage moved to the film, so it never ran, but
     it shipped on twenty pages and its scripts described a front desk that
     does not exist: "I can do Tuesday at 10 AM or Thursday at 1 PM", offered
     from a "Calendar has openings" rule, and "alerting the on-call
     technician now" with a transfer outcome. A client agent has no calendar
     and no hand-off (owner decision B1; engine agent-draft.ts), so markup
     put back for it would have shown both. Git history has it. */
  } catch (err) {
    /* Fail open: reveal everything this file would have animated. */
    try {
      document.querySelectorAll(".spine, .stack, .summary-arrive").forEach(function (el) { el.classList.add("in"); });
      document.querySelectorAll("[data-callchip]").forEach(function (el) { el.classList.add("lit"); });
    } catch (e2) {}
  }
})();
