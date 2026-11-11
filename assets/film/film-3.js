/* NEVAMIS live scan film - the interaction layer: the glass and the floor answer the pointer */
(function(){
'use strict';
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('rm') === '1';
var S = window.NV_SCENE;
/* no WebGL or reduced motion: the story reads as plain text; nothing to wire */
if (!S || reduced) return;
document.documentElement.classList.add('nv-live');

/* NO MENU, NO LABELS, NO CARDS (owner decision #81, 2026-11-10: the
   homepage is one message, the price and one button). This layer used to
   carry a six-station menu, a "+ open" label on each pane, a label on each
   named dot and a card behind each of them, filled from a hidden #doc
   section that described other products. All of that is gone. What is left
   is what the film does under the hand: a pane brightens, tilts toward the
   camera and ripples under the pointer, and the floor ripples and answers a
   tap. Pressing a pane or a dot opens nothing (tests/home-simple.spec.js). */
var T = S.T, camera = S.camera, canvas = S.canvas;
var panes = S.panes;

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

/* aspect recomposition: on resize the scene layer restations the panes
   (layout() runs first; it registered earlier), so the tilt-easing base
   quaternions are refreshed from them, only for panes at rest, so a
   mid-hover resize cannot bake a tilt in. */
window.addEventListener('resize', function(){
  for (var ei = 0; ei < eases.length; ei++) {
    var eq = eases[ei];
    if (!eq.moved && eq.tilt < 0.001) eq.baseQ.copy(eq.pn.mesh.quaternion);
  }
});

/* ---------- state ---------- */
var hoverPane = null;
var holding = false;
function ensureAnim(){
  if (!holding) { holding = true; S.hold(); }
  S.requestRender();
}

/* the one persistent frame hook: eases the panes, releases at rest */
S.frameHooks.push(function(p, cam, dt){
  var busy = false;
  var k7 = Math.min(1, dt * 7), k5 = Math.min(1, dt * 5);
  for (var i = 0; i < eases.length; i++) {
    var e = eases[i], pn = e.pn;
    var want = pn === hoverPane ? 1 : 0;
    e.boost += (want - e.boost) * k7;
    if (Math.abs(want - e.boost) > 0.004) busy = true; else e.boost = want;
    pn.rim.material.uniforms.uBoost.value = e.boost * 0.55;
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
/* ground field: the ripple follows the hand, a tap runs a mini scan; panes keep
   raycast priority (any pane hover or hit wins and the ground stays quiet) */
var gPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
var gPt = new T.Vector3();
function groundAt(){
  if (ray.ray.intersectPlane(gPlane, gPt) && Math.abs(gPt.x) < 210 && Math.abs(gPt.z) < 210) return gPt;
  return null;
}
/* the touch path below only exists where Touch Events do. Handing a finger to
   it on an engine that reports pointerType 'touch' without ever firing
   touchmove would leave that finger with no hover, wake or ripple at all, so
   the handover is conditional on the replacement being there. */
var HAS_TOUCHMOVE = ('ontouchmove' in window);
canvas.addEventListener('pointermove', function(e){
  /* a finger is handled by the touch path below (coalesced to one raycast per
     frame); taking its pointermove too raycast every pane twice per move.
     Mouse and pen keep hover here. */
  if (e.pointerType === 'touch' && HAS_TOUCHMOVE) return;
  /* raycast priority, explicit: pane > ground */
  var pn = paneAt(e.clientX, e.clientY);
  if (pn !== hoverPane) {
    hoverPane = pn;
    if (pn) triggerRipple(pn);
    ensureAnim();
  }
  if (pn) paneWake(pn); /* continuous: every move keeps the surface answering */
  if (!pn && S.groundRipple) {
    var g = groundAt();
    if (g) S.groundRipple(g.x, g.z); else S.groundRippleEnd();
  } else if (S.groundRippleEnd) S.groundRippleEnd();
}, { passive: true });
canvas.addEventListener('pointerleave', function(){
  /* the pointer leaving the canvas (onto the site header or out of the
     window) must not leave a slab pinned at full boost and tilt, re-slerping
     toward the camera every frame, forever. The touch path clears it via
     touchRest(); this mirrors it. */
  if (hoverPane) { hoverPane = null; ensureAnim(); }
  if (S.groundRippleEnd) S.groundRippleEnd();
});
/* ---------- touch ----------
   A direct tap on a pane ripples it and a tap on the floor runs a mini scan,
   both through the click path below. Hover-only states never stick: the
   finger lifting (or the scroll taking the gesture, pointercancel) decays
   hover, wake and ground ripple back to idle-zero.
   Every listener is passive - native momentum scroll is never blocked. */
function touchRest(){
  if (hoverPane) { hoverPane = null; ensureAnim(); }
  if (S.groundRippleEnd) S.groundRippleEnd();
}
canvas.addEventListener('pointercancel', touchRest);
/* touchmove arrives several times per frame on a phone, and every event
   raycast six panes plus the ground. Keep the latest finger position and
   raycast it once, in the next animation frame. */
var touchX = 0, touchY = 0, touchRaf = 0;
canvas.addEventListener('touchmove', function(ev){
  var tp = ev.touches && ev.touches[0];
  if (!tp) return;
  touchX = tp.clientX; touchY = tp.clientY;
  if (!touchRaf) touchRaf = requestAnimationFrame(touchHover);
}, { passive: true });
function touchHover(){
  touchRaf = 0;
  var pn = paneAt(touchX, touchY);
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
}
canvas.addEventListener('touchend', function(){ setTimeout(touchRest, 90); }, { passive: true });
canvas.addEventListener('touchcancel', function(){
  /* a queued hover must not land after the rest and pin the slab */
  if (touchRaf) { cancelAnimationFrame(touchRaf); touchRaf = 0; }
  touchRest();
}, { passive: true });
canvas.addEventListener('click', function(e){
  /* raycast priority, explicit: pane > ground. A pane ripples; the floor runs a mini scan. */
  var pn = paneAt(e.clientX, e.clientY);
  if (pn) triggerRipple(pn);
  else if (S.groundTap) {
    var g = groundAt();
    if (g) S.groundTap(g.x, g.z);
  }
});

/* poke one frame now that the hook is live */
S.requestRender();
})();
