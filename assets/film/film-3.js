/* NEVAMIS live scan film - the interaction layer: hover, cards, labels, keyboard */
(function(){
'use strict';
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('rm') === '1';
var S = window.NV_SCENE;
/* no WebGL or reduced motion: the plain #doc page below the film stays visible; nothing to wire */
if (!S || reduced) return;
document.documentElement.classList.add('nv-live');

var T = S.T, camera = S.camera, canvas = S.canvas;
var panes = S.panes;
var card = document.getElementById('card');
var brains = S.brains || [];
var brainHits = S.brainHits || null;
var nlabel = document.getElementById('nlabel');
var nlabelK = document.getElementById('nlabelK');
var nlabelN = document.getElementById('nlabelN');
var ncard = document.getElementById('ncard');
var ncardBody = document.getElementById('ncardBody');
var ncardClose = document.getElementById('ncardClose');
var cardBody = document.getElementById('cardBody');
var cardClose = document.getElementById('cardClose');
var nav = document.getElementById('paneNav');
var labelWrap = document.getElementById('labels');
var byId = {};
panes.forEach(function(pn){ byId[pn.id] = pn; });

function sm01(x){ x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

/* ---------- per-pane ease state (hover boost + tilt toward camera) ---------- */
var tmpObj = new T.Object3D();
var eases = panes.map(function(pn){
  return { pn: pn, boost: 0, tilt: 0, baseQ: pn.mesh.quaternion.clone(), moved: false,
           ripT: -1, ripU: 0.5, ripV: 0.5,
           wTU: 0.5, wTV: 0.5, wU: 0.5, wV: 0.5, wU2: 0.5, wV2: 0.5, wAmp: 0, wPh: 0 };
});
/* liquid ripple: hover entry or tap sends a ring outward across THAT pane's surface
   from the pointer's hit point; the envelope runs ~1s of settling frames then the
   surface freezes again (idle-zero holds). */
var lastHitUv = { x: 0.5, y: 0.5 };
function easeOf(pn){ for (var i = 0; i < eases.length; i++) if (eases[i].pn === pn) return eases[i]; return null; }
function triggerRipple(pn){
  var e = easeOf(pn);
  if (!e || !pn.lq) return;
  e.ripT = 0; e.ripU = lastHitUv.x; e.ripV = lastHitUv.y;
  ensureAnim();
}
/* continuous wake: as the cursor MOVES across a pane the surface keeps answering.
   Each pointermove re-aims the wake source at the hit uv and feeds it energy from
   the pointer's uv speed; the frame hook eases the source toward the aim, runs a
   second lagged tap as the trail, and decays it all back to zero (idle-zero). */
function paneWake(pn){
  var e = easeOf(pn);
  if (!e || !pn.lq) return;
  if (e.wAmp <= 0.002) { e.wU = lastHitUv.x; e.wV = lastHitUv.y; e.wU2 = e.wU; e.wV2 = e.wV; }
  var wdx = lastHitUv.x - e.wTU, wdy = lastHitUv.y - e.wTV;
  e.wTU = lastHitUv.x; e.wTV = lastHitUv.y;
  e.wAmp = Math.min(1, e.wAmp + Math.min(0.5, Math.sqrt(wdx * wdx + wdy * wdy) * 9.0));
  ensureAnim();
}

/* ---------- each pane's best viewing progress, sampled from the camera path ----------
   Facing-aware: only p where the pane sits AHEAD of the camera at a viewable distance
   counts, scored by distance and centredness; spine order is enforced so the nav
   buttons always travel forward station by station. */
function computeViewPs(){
panes.forEach(function(pn, idx){ pn.viewP = 0.10 + idx * 0.15; /* fallback */ });
if (S.camCurve) {
  var vD = new T.Vector3(), vA = new T.Vector3();
  var lastP = 0.015;
  /* narrow frames: the landscape 0.45 gaze test admits stations far outside the
     portrait horizontal frustum; gate the anchor into ~92% of the half-fov */
  var narrow = camera.aspect < 0.75;
  var cosH = Math.cos(Math.min(Math.PI / 2, Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect) * 0.92));
  panes.forEach(function(pn){
    var best = -1, bs = 1e9;
    for (var i = 8; i <= 232; i++) {
      var p = i / 240;
      if (p <= lastP) continue;
      var cp = S.camCurve.getPoint(p);
      var lp = S.camCurve.getPoint(Math.min(1, p + 0.07));
      vD.set(lp.x - cp.x, lp.y - cp.y, lp.z - cp.z).normalize();
      vA.set(pn.anchor.x - cp.x, pn.anchor.y - cp.y, pn.anchor.z - cp.z);
      var d = vA.length();
      if (d < 14 || d > 95) continue;
      vA.multiplyScalar(1 / d);
      var dot = vA.dot(vD);
      if (dot < 0.45) continue;
      if (narrow) {
        /* test against the REAL gaze base (apply() looks 0.11 ahead), horizontally */
        var lp2 = S.camCurve.getPoint(Math.min(1, p + 0.11));
        var fx = lp2.x - cp.x, fz = lp2.z - cp.z;
        var fl = Math.hypot(fx, fz), al = Math.hypot(vA.x, vA.z);
        if (fl > 1e-4 && al > 1e-4 && (fx * vA.x + fz * vA.z) / (fl * al) < cosH) continue;
      }
      var score = d * (2 - dot);
      if (score < bs) { bs = score; best = p; }
    }
    if (best >= 0) pn.viewP = Math.min(0.94, Math.max(0.02, best - 0.02));
    else pn.viewP = Math.min(0.94, lastP + 0.05);
    lastP = pn.viewP;
  });
}
}
computeViewPs();
/* aspect recomposition: on resize the scene layer restations the panes and
   reshapes the camera curve (layout() runs first; it registered earlier).
   Refresh everything this layer derived from them: the tilt-easing base
   quaternions (only for panes at rest, so a mid-hover resize cannot bake a
   tilt in) and the per-pane best-view scroll positions the nav rail uses. */
window.addEventListener('resize', function(){
  for (var ei = 0; ei < eases.length; ei++) {
    var eq = eases[ei];
    if (!eq.moved && eq.tilt < 0.001) eq.baseQ.copy(eq.pn.mesh.quaternion);
  }
  computeViewPs();
});

/* ---------- always-legible labels projected at each pane ---------- */
var labelEls = {};
labelWrap.querySelectorAll('.plabel').forEach(function(el){ labelEls[el.getAttribute('data-pane')] = el; });
/* the block's "+ open" affordance is real: clicking a label opens its pane's card */
labelWrap.addEventListener('click', function(e){
  var b = e.target.closest ? e.target.closest('.plabel') : null;
  if (!b) return;
  var pn = byId[b.getAttribute('data-pane')];
  if (pn) openCard(pn);
});
var copyNodes = Array.prototype.slice.call(document.querySelectorAll('.copy'));
var vProj = new T.Vector3(), vDir = new T.Vector3(), vTo = new T.Vector3();
var lblOrder = [];
/* the fixed section nav on the left: labels must never sit on it (cached; resize refreshes) */
var navRect = null, navYield = false;
function refreshNavRect(){ navRect = nav ? nav.getBoundingClientRect() : null; }
refreshNavRect();
window.addEventListener('resize', refreshNavRect);
function updateLabels(){
  if (!navRect || !navRect.width) refreshNavRect();
  camera.getWorldDirection(vDir);
  /* Gate on the sentence's PAINTED opacity, not its class. The class flips in one
   frame but the sentence cross-fades over 600ms, so a class-gated suppression
   snapped every label ~16x in brightness at each beat boundary. */
  var copyRect = null, copyA = 0;
  for (var i = 0; i < copyNodes.length; i++) {
    var ca = parseFloat(getComputedStyle(copyNodes[i]).opacity) || 0;
    if (ca > 0.01) { copyA = ca; copyRect = copyNodes[i].getBoundingClientRect(); break; }
  }
  var cardUp = document.body.classList.contains('card-open');
  /* the rail yields while a story beat passes under it (the portrait top row
     crosses the copy column as a beat scrolls out; desktop rects never meet) */
  var nh = !!(navRect && navRect.width > 0 && copyRect &&
    navRect.left < copyRect.right && navRect.right > copyRect.left &&
    navRect.top < copyRect.bottom && navRect.bottom > copyRect.top);
  if (nh !== navYield) {
    navYield = nh;
    nav.style.opacity = nh ? '0.1' : '';
    nav.style.pointerEvents = nh ? 'none' : '';
  }
  lblOrder.length = 0;
  for (var i = 0; i < panes.length; i++) {
    var pn = panes[i], el = labelEls[pn.id];
    if (!el) continue;
    vTo.copy(pn.anchor).sub(camera.position);
    var dist = vTo.length();
    var o = 0, x = 0, y = 0;
    if (vTo.dot(vDir) > 0) {
      vProj.copy(pn.anchor).project(camera);
      x = (vProj.x * 0.5 + 0.5) * window.innerWidth;
      y = (-vProj.y * 0.5 + 0.5) * window.innerHeight + 30;
      var edge = (1 - sm01((Math.abs(vProj.x) - 0.78) / 0.18)) *
                 (1 - sm01((Math.abs(vProj.y) - 0.74) / 0.2));
      var near = sm01((dist - 6) / 7);
      var far = 1 - sm01((dist - 88) / 38);
      o = edge * near * far * 0.95;
      if (cardUp) o *= 0.12;
    }
    lblOrder.push({ el: el, o: o, x: x, y: y, dist: dist });
  }
  /* collision: the nearest pane's block wins; farther overlapping blocks fade out */
  lblOrder.sort(function(a, b){ return a.dist - b.dist; });
  /* focus: one detailed block at a time. The etched titles already name every
     pane in-glass, so the nearest visible block reads at full strength and the
     rest ghost - the opening frame otherwise carries two competing info blocks. */
  var focused = false;
  for (var fi = 0; fi < lblOrder.length; fi++) {
    if (lblOrder[fi].o > 0.02) { if (focused) lblOrder[fi].o *= 0.25; focused = true; }
  }
  var kept = [];
  for (var i = 0; i < lblOrder.length; i++) {
    var L = lblOrder[i];
    if (L.o > 0.02) {
      if (!L.el._w) { L.el._w = L.el.offsetWidth || 232; L.el._h = L.el.offsetHeight || 66; }
      var x0 = L.x - L.el._w * 0.5, x1 = L.x + L.el._w * 0.5, y0 = L.y, y1 = L.y + L.el._h;
      /* never leave the frame: clamp into the viewport (narrow screens) */
      var clampR = window.innerWidth - 8;
      if (x0 < 8) { var csl = 8 - x0; L.x += csl; x0 += csl; x1 += csl; }
      else if (x1 > clampR) { var csr = x1 - clampR; L.x -= csr; x0 -= csr; x1 -= csr; }
      /* never sit on the section nav rail: shift right of it (the info must stay legible) */
      if (navRect && y0 < navRect.bottom + 8 && y1 > navRect.top - 8 &&
          x0 < navRect.right + 14 && x1 > navRect.left - 14) {
        var nshift = (navRect.right + 14) - x0;
        L.x += nshift; x0 += nshift; x1 += nshift;
      }
      /* never sit on a story copy beat: exact rect test against the visible copy */
      if (copyRect && x0 < copyRect.right + 12 && x1 > copyRect.left - 12 &&
          y0 < copyRect.bottom + 12 && y1 > copyRect.top - 12) L.o *= (1 - 0.94 * copyA);
      for (var j = 0; j < kept.length; j++) {
        var K = kept[j];
        if (x0 < K.x1 + 16 && x1 > K.x0 - 16 && y0 < K.y1 + 12 && y1 > K.y0 - 12) { L.o *= 0.05; break; }
      }
      if (L.o > 0.02) kept.push({ x0: x0, x1: x1, y0: y0, y1: y1 });
    }
    if (L.o < 0.02) L.o = 0;
    L.el.style.opacity = L.o.toFixed(3);
    L.el.style.pointerEvents = L.o > 0.35 ? 'auto' : 'none' /* ghosted blocks are scenery, not targets */;
    if (L.o > 0) {
      L.el.style.transform = 'translate3d(' + (L.x - L.el._w * 0.5).toFixed(1) + 'px,' + L.y.toFixed(1) + 'px,0)';
    }
  }
}

/* ---------- look easing (the camera turns to face the open pane) ---------- */
var lookVec = new T.Vector3(), vRight = new T.Vector3(), vGoal = new T.Vector3();
var lookW = 0, lookWT = 0;

/* ---------- state ---------- */
var hoverPane = null, openPane = null;
var hoverBrain = null, openBrain = null;
var prevNFocus = null, nScrollAt = 0;
/* cold open: node labels and cards must never appear before their wake */
function uiAwake(){ return !document.documentElement.classList.contains('nv-intro'); }
var holding = false;
function ensureAnim(){
  if (!holding) { holding = true; S.hold(); }
  S.requestRender();
}

/* the one persistent frame hook: eases everything, projects labels, releases at rest */
S.frameHooks.push(function(p, cam, dt){
  var busy = false;
  var k7 = Math.min(1, dt * 7), k5 = Math.min(1, dt * 5), k3 = Math.min(1, dt * 3.2);
  for (var i = 0; i < eases.length; i++) {
    var e = eases[i], pn = e.pn;
    var want = (pn === hoverPane || pn === openPane) ? 1 : 0;
    e.boost += (want - e.boost) * k7;
    if (Math.abs(want - e.boost) > 0.004) busy = true; else e.boost = want;
    pn.rim.material.uniforms.uBoost.value = e.boost * (pn === openPane ? 0.75 : 0.55);
    if (pn.lq) {
      pn.lq.amp.value = pn.lq.base * (1 + 0.55 * e.boost); /* hover: the swell deepens */
      if (e.ripT >= 0) {
        e.ripT += dt / 1.05;
        if (e.ripT >= 1) { e.ripT = -1; pn.lq.rip.value.z = 0; }
        else {
          var rq = 1 - (1 - e.ripT) * (1 - e.ripT);
          pn.lq.rip.value.set(e.ripU, e.ripV,
            Math.sin(Math.min(1, e.ripT * 1.15) * Math.PI) * 0.16, rq * 0.85);
          busy = true;
        }
      }
      /* the trailing wake settles on its own; renders run only while it lives */
      if (e.wAmp > 0) {
        var kwA = Math.min(1, dt * 11), kwB = Math.min(1, dt * 4.5);
        e.wU += (e.wTU - e.wU) * kwA; e.wV += (e.wTV - e.wV) * kwA;
        e.wU2 += (e.wU - e.wU2) * kwB; e.wV2 += (e.wV - e.wV2) * kwB;
        e.wPh += dt * 10.0;
        e.wAmp *= Math.exp(-dt * 3.6);
        if (e.wAmp < 0.02) { /* 0.02*0.11 = 0.0022 of wake: visually zero, and it
                                stops holding the render loop ~1.5s sooner */
          e.wAmp = 0;
          pn.lq.wake.value.z = 0; pn.lq.wake2.value.z = 0;
        } else {
          pn.lq.wake.value.set(e.wU, e.wV, e.wAmp * 0.11, e.wPh);
          pn.lq.wake2.value.set(e.wU2, e.wV2, e.wAmp * 0.065, 0);
          busy = true;
        }
      }
    }
    e.tilt += (want - e.tilt) * k5;
    if (Math.abs(want - e.tilt) > 0.004) busy = true; else e.tilt = want;
    if (e.tilt > 0.001) {
      tmpObj.position.copy(pn.mesh.position);
      tmpObj.lookAt(cam.position);
      pn.mesh.quaternion.copy(e.baseQ).slerp(tmpObj.quaternion, e.tilt * 0.16);
      pn.rim.quaternion.copy(pn.mesh.quaternion);
      e.moved = true;
    } else if (e.moved) {
      pn.mesh.quaternion.copy(e.baseQ);
      pn.rim.quaternion.copy(pn.mesh.quaternion);
      e.moved = false;
    }
  }
  /* look target chases the open pane; weight eases in and out (both damped, no snaps) */
  if (openPane) {
    /* aim the pane at the centre of the strip the card leaves uncovered */
    vRight.setFromMatrixColumn(cam.matrix, 0);
    var lkShift = cam.position.distanceTo(openPane.anchor) *
                  Math.tan(cam.fov * Math.PI / 360) * cam.aspect *
                  (cardW / Math.max(1, window.innerWidth)) * 0.5;
    vGoal.copy(openPane.anchor).addScaledVector(vRight, lkShift);
    lookVec.lerp(vGoal, k3);
    if (lookVec.distanceToSquared(vGoal) > 0.02) busy = true;
  }
  lookW += (lookWT - lookW) * k3;
  if (Math.abs(lookWT - lookW) > 0.002) busy = true; else lookW = lookWT;
  if (lookW > 0.0005) { S.look.target = lookVec; S.look.weight = lookW; }
  else { S.look.target = null; S.look.weight = 0; }
  /* brain nodes: the dot brightens under the hand and while its card is open */
  for (var bi = 0; bi < brains.length; bi++) {
    var brE = brains[bi];
    var bw = (brE === hoverBrain || brE === openBrain) ? 1 : 0;
    brE.boost += (bw - brE.boost) * k7;
    if (Math.abs(bw - brE.boost) > 0.004) busy = true; else brE.boost = bw;
  }
  updateLabels();
  updateNodeUi();
  if (busy) { if (!holding) { holding = true; S.hold(); } }
  else if (holding) { holding = false; S.release(); }
});

/* ---------- raycast: only on pointer move / click, never per frame ---------- */
var ray = new T.Raycaster(), ptr = new T.Vector2();
function paneAt(cx, cy){
  ptr.x = (cx / window.innerWidth) * 2 - 1;
  ptr.y = -(cy / window.innerHeight) * 2 + 1;
  ray.setFromCamera(ptr, camera);
  var hits = ray.intersectObjects(S.raycastTargets, false);
  if (!hits.length) return null;
  if (hits[0].uv) { lastHitUv.x = hits[0].uv.x; lastHitUv.y = hits[0].uv.y; }
  for (var i = 0; i < panes.length; i++) if (panes[i].mesh === hits[0].object) return panes[i];
  return null;
}
/* named brain nodes: raycast the invisible hit spheres. Priority is the
   caller's and is explicit everywhere: pane > node > ground. */
function brainAt(){
  if (!brainHits || !brains.length) return null;
  var hits = ray.intersectObject(brainHits, false);
  if (!hits.length || hits[0].instanceId == null) return null;
  return brains[hits[0].instanceId] || null;
}
/* ground field: the ripple follows the hand, a tap runs a mini scan; panes keep
   raycast priority (any pane hover or hit wins and the ground stays quiet) */
var gPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
var gPt = new T.Vector3();
function groundAt(){
  if (ray.ray.intersectPlane(gPlane, gPt) && Math.abs(gPt.x) < 210 && Math.abs(gPt.z) < 210) return gPt;
  return null;
}
canvas.addEventListener('pointermove', function(e){
  /* raycast priority, explicit: pane > node > ground */
  var pn = paneAt(e.clientX, e.clientY);
  var br = (!pn && uiAwake()) ? brainAt() : null;
  if (pn !== hoverPane) {
    hoverPane = pn;
    if (pn) triggerRipple(pn);
    ensureAnim();
  }
  if (pn) paneWake(pn); /* continuous: every move keeps the surface answering */
  if (br !== hoverBrain) { hoverBrain = br; ensureAnim(); }
  canvas.style.cursor = (pn || br) ? 'pointer' : '';
  if (!pn && !br && S.groundRipple) {
    var g = groundAt();
    if (g) S.groundRipple(g.x, g.z); else S.groundRippleEnd();
  } else if (S.groundRippleEnd) S.groundRippleEnd();
}, { passive: true });
canvas.addEventListener('pointerleave', function(){
  /* hoverPane was missing here: the pointer leaving the canvas (onto the site
     header, an open card, or out of the window) left the slab pinned at full
     boost and tilt, re-slerping toward the camera every frame, forever. The
     touch path already cleared both via touchRest(); this mirrors it. */
  if (hoverPane) { hoverPane = null; ensureAnim(); }
  if (hoverBrain) { hoverBrain = null; ensureAnim(); }
  if (S.groundRippleEnd) S.groundRippleEnd();
});
/* ---------- touch ----------
   Convention (stated): a direct tap on a pane or a named brain node opens its
   card via the click path below - there is no two-tap label step, because every
   string the hover label carries is the card's first line anyway. Hover-only
   states never stick: the finger lifting (or the scroll taking the gesture,
   pointercancel) decays hover, wake and ground ripple back to idle-zero.
   Every listener is passive - native momentum scroll is never blocked. */
function touchRest(){
  if (hoverPane) { hoverPane = null; ensureAnim(); }
  if (hoverBrain) { hoverBrain = null; ensureAnim(); }
  if (S.groundRippleEnd) S.groundRippleEnd();
}
canvas.addEventListener('pointercancel', touchRest);
canvas.addEventListener('touchmove', function(ev){
  var tp = ev.touches && ev.touches[0];
  if (!tp) return;
  var pn = paneAt(tp.clientX, tp.clientY);
  if (pn) {
    if (pn !== hoverPane) { hoverPane = pn; triggerRipple(pn); ensureAnim(); }
    paneWake(pn); /* the continuous glass wake follows the finger */
    if (S.groundRippleEnd) S.groundRippleEnd();
  } else {
    if (hoverPane) { hoverPane = null; ensureAnim(); }
    if (S.groundRipple) {
      var g = groundAt();
      if (g) S.groundRipple(g.x, g.z); else if (S.groundRippleEnd) S.groundRippleEnd();
    }
  }
}, { passive: true });
canvas.addEventListener('touchend', function(){ setTimeout(touchRest, 90); }, { passive: true });
canvas.addEventListener('touchcancel', touchRest, { passive: true });
canvas.addEventListener('click', function(e){
  /* raycast priority, explicit: pane > node > ground */
  var pn = paneAt(e.clientX, e.clientY);
  var br = (!pn && uiAwake()) ? brainAt() : null;
  if (pn) { triggerRipple(pn); openCard(pn); }
  else if (br) { openNodeCard(br); }
  else if (openBrain) closeNodeCard();
  else if (openPane) closeCard();
  else if (S.groundTap) {
    var g = groundAt();
    if (g) S.groundTap(g.x, g.z);
  }
});

/* ---------- the node card: which part of the brain, and what it does ----------
   Same family as the pane card, compact, world-anchored. The strings are the
   registry's, which the scene read verbatim from the plain-DOM truth copy. */
function openNodeCard(br){
  if (openBrain === br) return;
  if (!openBrain && !openPane) prevNFocus = document.activeElement;
  openBrain = br;
  ncardBody.innerHTML = '';
  var k = document.createElement('p'); k.className = 'kick'; k.textContent = br.pillar;
  var t4 = document.createElement('h4'); t4.textContent = br.name;
  if (br.avail) {
    t4.appendChild(document.createTextNode(' '));
    var ch = document.createElement('span');
    ch.className = 'chip ' + (br.availDev ? 'dev' : 'av');
    ch.textContent = br.avail;
    t4.appendChild(ch);
  }
  var d4 = document.createElement('p'); d4.className = 'nd'; d4.textContent = br.desc;
  ncardBody.appendChild(k); ncardBody.appendChild(t4); ncardBody.appendChild(d4);
  ncard.setAttribute('aria-label', br.name);
  ncard._h = 0; /* re-measure for the new content */
  nScrollAt = window.scrollY || 0;
  ncard.classList.add('on');
  ensureAnim();
  ncard.focus({ preventScroll: true });
}
function closeNodeCard(){
  if (!openBrain) return;
  openBrain = null;
  ncard.classList.remove('on');
  ensureAnim();
  if (prevNFocus && prevNFocus.focus && document.contains(prevNFocus)) prevNFocus.focus({ preventScroll: true });
  prevNFocus = null;
}
ncardClose.addEventListener('click', closeNodeCard);
/* the node UI rides its dot: label under the hover, card beside the open node */
var vNP = new T.Vector3();
function updateNodeUi(){
  var br = (hoverBrain && hoverBrain !== openBrain && uiAwake()) ? hoverBrain : null;
  var lo = 0;
  if (br) {
    camera.getWorldDirection(vDir);
    vTo.copy(br.wpos).sub(camera.position);
    var dist = vTo.length();
    if (vTo.dot(vDir) > 0 && dist < 150) {
      vNP.copy(br.wpos).project(camera);
      var x = (vNP.x * 0.5 + 0.5) * window.innerWidth;
      var y = (-vNP.y * 0.5 + 0.5) * window.innerHeight;
      if (nlabel._n !== br) {
        nlabel._n = br;
        nlabelK.textContent = br.pillar;
        nlabelN.textContent = br.name;
        nlabel._w = nlabel.offsetWidth || 200;
      }
      var lx = Math.max(8, Math.min(window.innerWidth - (nlabel._w || 200) - 8, x - (nlabel._w || 200) * 0.5));
      nlabel.style.transform = 'translate3d(' + lx.toFixed(1) + 'px,' + (y + 16).toFixed(1) + 'px,0)';
      lo = 1;
    }
  }
  nlabel.style.opacity = lo ? '1' : '0';
  if (openBrain) {
    camera.getWorldDirection(vDir);
    vTo.copy(openBrain.wpos).sub(camera.position);
    if (vTo.dot(vDir) <= 0) { closeNodeCard(); return; }
    vNP.copy(openBrain.wpos).project(camera);
    var cx = (vNP.x * 0.5 + 0.5) * window.innerWidth;
    var cy = (-vNP.y * 0.5 + 0.5) * window.innerHeight;
    if (!ncard._w) ncard._w = ncard.offsetWidth || 300;
    if (!ncard._h) ncard._h = ncard.offsetHeight || 150;
    var px = cx + 20;
    if (px + ncard._w > window.innerWidth - 10) px = cx - 20 - ncard._w;
    px = Math.max(10, Math.min(window.innerWidth - ncard._w - 10, px));
    var py = Math.max(10, Math.min(window.innerHeight - ncard._h - 10, cy - ncard._h * 0.5));
    ncard.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0)';
  }
}

/* ---------- the card ---------- */
var prevFocus = null, scrollYAtOpen = 0, progScroll = false;
/* card.offsetWidth was read inside the per-frame hook, forcing a synchronous
   layout on every frame a card was open. It changes only on resize. */
var cardW = 0;
function navBtn(id){ return nav.querySelector('button[data-pane="' + id + '"]'); }
function openCard(pn){
  if (openPane === pn) return;
  closeNodeCard();
  if (openPane) { var b0 = navBtn(openPane.id); if (b0) b0.setAttribute('aria-expanded', 'false'); }
  var first = !openPane;
  openPane = pn;
  var src = document.getElementById('doc-' + pn.id);
  cardBody.innerHTML = src ? src.innerHTML : '';
  card.setAttribute('aria-label', pn.title);
  if (first) { lookVec.copy(pn.anchor); prevFocus = document.activeElement; } else { var nb0 = navBtn(pn.id); if (nb0) prevFocus = nb0; }
  lookWT = 0.9;
  scrollYAtOpen = window.scrollY || 0;
  card.classList.add('on');
  document.body.classList.add('card-open');
  cardW = card.offsetWidth || 0;
  var b = navBtn(pn.id); if (b) b.setAttribute('aria-expanded', 'true');
  ensureAnim();
  card.focus({ preventScroll: true });
}
function closeCard(){
  if (!openPane) return;
  var b = navBtn(openPane.id); if (b) b.setAttribute('aria-expanded', 'false');
  openPane = null;
  lookWT = 0;
  card.classList.remove('on');
  document.body.classList.remove('card-open');
  ensureAnim();
  if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true });
  prevFocus = null;
}
cardClose.addEventListener('click', closeCard);
/* the cached card width is layout, so it is only ever stale after a resize */
window.addEventListener('resize', function(){ if (openPane) cardW = card.offsetWidth || 0; });
document.addEventListener('keydown', function(e){
  if (e.key !== 'Escape') return;
  if (openBrain) { closeNodeCard(); return; }
  if (openPane) closeCard();
});
/* native scroll is never hijacked; a real scroll simply closes the card first */
window.addEventListener('scroll', function(){
  if (progScroll) { progScroll = false; scrollYAtOpen = window.scrollY || 0; return; }
  if (openPane && Math.abs((window.scrollY || 0) - scrollYAtOpen) > 48) closeCard();
  if (openBrain && Math.abs((window.scrollY || 0) - nScrollAt) > 48) closeNodeCard();
}, { passive: true });

/* keyboard path: six real buttons, spine order; travel there, then the same card */
nav.addEventListener('click', function(e){
  var b = e.target.closest ? e.target.closest('button[data-pane]') : null;
  if (!b) return;
  var pn = byId[b.getAttribute('data-pane')];
  if (!pn) return;
  if (openPane === pn) { closeCard(); return; }
  var scrollDiv = document.getElementById('scroll');
  var max = Math.max(1, scrollDiv.offsetHeight - window.innerHeight);
  progScroll = true;
  window.scrollTo(0, Math.round(pn.viewP * max));
  openCard(pn);
});

/* labels must exist from the very first frame: poke one now that the hook is live */
S.requestRender();

/* debug / future-agent seam */
window.NV_IX = {
  open: function(id){ if (byId[id]) openCard(byId[id]); },
  close: closeCard,
  brains: brains,
  openNode: function(i){ if (brains[i]) openNodeCard(brains[i]); },
  closeNode: closeNodeCard,
  hoverNode: function(i){ hoverBrain = brains[i] || null; ensureAnim(); },
  state: function(){ return { hover: hoverPane && hoverPane.id, open: openPane && openPane.id, lookW: lookW, holding: holding }; }
};
})();
