/* NEVAMIS live scan film - take A: THE TERRAIN */
(function(){
'use strict';
var T = NV3.THREE;
var canvas = document.getElementById('c');
var scrollEl = document.getElementById('scroll');
var hint = document.getElementById('hint');
var copyEls = [
  { el: document.getElementById('s1'), p0: 0.13, p1: 0.32, at: 0.20 },
  { el: document.getElementById('s2'), p0: 0.36, p1: 0.52, at: 0.43 },
  { el: document.getElementById('s3'), p0: 0.55, p1: 0.74, at: 0.63 },
  { el: document.getElementById('close'), p0: 0.90, p1: 1.01, at: 0.965 }
];
/* owner note: story copy should HOLD mid-frame while its beat passes instead
   of flying by. Each block rides position:sticky inside a hold that spans its
   beat's scroll window (tops and heights set in layout()). */
copyEls.forEach(function(c){
  var hold = document.createElement('div');
  hold.className = 'chold';
  hold.id = c.el.id + '-hold';
  c.el.parentNode.insertBefore(hold, c.el);
  hold.appendChild(c.el);
  c.hold = hold;
});
var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('rm') === '1';

/* ---------- palette ---------- */
var MINT = new T.Color(0x9FF0CE);
var EMERALD = new T.Color(0x2FBF8F);
var WARM = new T.Color(0xF0B462);
var INKC = new T.Color(0xEAFBF3);
var BG = new T.Color(0x02080D);

/* ---------- helpers ---------- */
function clamp01(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }
function smooth(a, b, x){ x = clamp01((x - a) / (b - a)); return x * x * (3 - 2 * x); }
function lerp(a, b, t){ return a + (b - a) * t; }
function rng(seed){ return function(){ seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

/* ---------- renderer ---------- */
var renderer;
try {
  renderer = new T.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: 'high-performance' });
} catch (e) {
  document.body.classList.add('no3d');
  copyEls.forEach(function(c){ c.el.classList.add('on'); });
  return;
}
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = T.SRGBColorSpace;
/* The transmission pass renders only the OPAQUE list into its target, and this
   scene is almost entirely additive: the buffer the glass refracts holds the
   background and a couple of meshes. Full resolution costs two MSAA resolves and
   two mipmap chains per frame to blur something nearly empty. */
renderer.transmissionResolutionScale = 0.5;

var scene = new T.Scene();
scene.background = BG;
scene.fog = new T.FogExp2(0x02080D, 0.0042);

var camera = new T.PerspectiveCamera(45, 1, 0.1, 600);
/* ---------- aspect-conditional composition ----------
   One rig, parameterized by aspect. PF is 0 for the verified landscape
   composition and eases to 1 as the frame narrows past 3:4 toward phone
   portrait (~0.46). Everything portrait-specific is a constant blended by PF:
   camera fov, the camera curve's lateral sway and final station, and the pane
   stationing offsets. Recomputed by layout() on every resize / orientation
   change; at PF = 0 the maths reproduce the landscape numbers exactly. */
var PF = 0;
function portraitF(a){ var f = (0.75 - a) / (0.75 - 0.48); return f < 0 ? 0 : f > 1 ? 1 : f; }
function mixN(a, b, k){ return a + (b - a) * k; }

/* environment: procedural room, dimmed so the void stays black */
var pmrem = new T.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new NV3.RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
pmrem.dispose();

/* ---------- the network terrain ---------- */
var rand = rng(20260829);
var nodes = [];           // {pos, dist, glow, leak:-1|leakIndex}
var rings = [
  { r: 16, n: 7 }, { r: 34, n: 12 }, { r: 56, n: 17 },
  { r: 82, n: 23 }, { r: 112, n: 28 }, { r: 142, n: 30 }
];
rings.forEach(function(ring, ri){
  for (var i = 0; i < ring.n; i++) {
    var a = (i / ring.n) * Math.PI * 2 + rand() * 0.5;
    var r = ring.r * (0.86 + rand() * 0.3);
    var x = Math.cos(a) * r, z = Math.sin(a) * r;
    nodes.push({
      pos: new T.Vector3(x, 0.5 + rand() * 2.6, z),
      dist: Math.sqrt(x * x + z * z),
      glow: (function(g0){ return g0 < 0.16 ? 1.05 + g0 * 3.0 : 0.20 + (g0 - 0.16) * 0.54; })(rand()),
      ring: ri, leak: -1
    });
  }
});
var N = nodes.length;

/* unify: the dots ARE the line-work. The ground plane draws its fine grid every
   7 units, so every terrain node snaps to a grid intersection (deduped cell by
   cell, the core's cell kept empty) and settles into a thin band just above the
   floor. Node, edge and grid now share the same lattice and read as one
   connected system; dist is recomputed from the snapped spot so the pulse
   reveal still sweeps true radial distance. */
(function(){
  var taken = { '0,0': true };
  var walk = [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1],[2,0],[-2,0],[0,2],[0,-2]];
  nodes.forEach(function(nd){
    var bx = Math.round(nd.pos.x / 7), bz = Math.round(nd.pos.z / 7), gx = bx, gz = bz;
    for (var w = 0; w < walk.length; w++) {
      gx = bx + walk[w][0]; gz = bz + walk[w][1];
      if (!taken[gx + ',' + gz]) break;
    }
    taken[gx + ',' + gz] = true;
    nd.pos.x = gx * 7; nd.pos.z = gz * 7;
    nd.pos.y = 0.30 + (nd.pos.y - 0.5) * 0.28;
    nd.dist = Math.sqrt(nd.pos.x * nd.pos.x + nd.pos.z * nd.pos.z);
  });
})();

/* leaks: chosen where the spine passes (they hang off it on stems); populated below */
var LEAKS = [];

/* edges: nearest inward neighbour + a same-ring neighbour */
var edges = [];
function nearest(i, filter){
  var best = -1, bd = 1e9;
  for (var j = 0; j < N; j++) {
    if (j === i || !filter(j)) continue;
    var d = nodes[i].pos.distanceToSquared(nodes[j].pos);
    if (d < bd) { bd = d; best = j; }
  }
  return best;
}
for (var i = 0; i < N; i++) {
  var ri = nodes[i].ring;
  if (ri > 0) {
    var a = nearest(i, function(j){ return nodes[j].ring === ri - 1; });
    if (a >= 0) edges.push([i, a]);
  }
  var b = nearest(i, function(j){ return nodes[j].ring === ri && j > i; });
  if (b >= 0 && rand() > 0.25) edges.push([i, b]);
}

/* edge lines with reveal shader */
var SEG = 5;
var epos = [], edist = [];
edges.forEach(function(e){
  var A = nodes[e[0]].pos, B = nodes[e[1]].pos;
  for (var s = 0; s < SEG; s++) {
    var t0 = s / SEG, t1 = (s + 1) / SEG;
    [t0, t1].forEach(function(t){
      var x = lerp(A.x, B.x, t), y = lerp(A.y, B.y, t), z = lerp(A.z, B.z, t);
      epos.push(x, y, z);
      edist.push(Math.sqrt(x * x + z * z));
    });
  }
});
var egeo = new T.BufferGeometry();
egeo.setAttribute('position', new T.Float32BufferAttribute(epos, 3));
egeo.setAttribute('aDist', new T.Float32BufferAttribute(edist, 1));
var edgeMat = new T.ShaderMaterial({
  uniforms: {
    uPulse: { value: 0 },
    uFade: { value: 1 },
    uCol: { value: new T.Color(0x9FF0CE) },
    uWakeOn: { value: 0 },
    uWakeC: { value: new T.Vector3(0, 0, 0) },
    uWakeR: { value: 0 },
    uDrift: { value: 0 },
    uBreath: { value: 1 }
  },
  vertexShader: [
    'attribute float aDist; varying float vDist; varying float vFog; varying float vWake;',
    'uniform float uWakeOn; uniform vec3 uWakeC; uniform float uWakeR; uniform float uDrift;',
    'void main(){ vDist = aDist;',
    /* mid-film the nodes drift inward; the lines drift WITH them (one system, never a detach) */
    ' vec3 pos = vec3(position.x * (1.0 - uDrift), position.y, position.z * (1.0 - uDrift));',
    /* ignition: light-front factor, world distance from the orb (positions are world space) */
    ' vWake = mix(1.0, 1.0 - smoothstep(uWakeR - 42.0, uWakeR, distance(pos, uWakeC)), uWakeOn);',
    ' vec4 mv = modelViewMatrix * vec4(pos,1.0);',
    ' vFog = -mv.z;',
    ' gl_Position = projectionMatrix * mv; }'
  ].join('\n'),
  fragmentShader: [
    'uniform float uPulse; uniform float uFade; uniform vec3 uCol; uniform float uBreath;',
    'varying float vDist; varying float vFog; varying float vWake;',
    'void main(){',
    ' float lit = smoothstep(vDist - 1.0, vDist + 5.0, uPulse);',
    ' float front = exp(-abs(uPulse - vDist) * 0.16) * step(0.01, uPulse);',
    ' float b = 0.045 + lit * 0.30 + front * 1.5;',
    ' float fogF = exp(-vFog * 0.006);',
    ' gl_FragColor = vec4(uCol * b * uFade * fogF * vWake * uBreath, 1.0); }'
  ].join('\n'),
  blending: T.AdditiveBlending, transparent: true, depthWrite: false
});
var edgeLines = new T.LineSegments(egeo, edgeMat);
scene.add(edgeLines);

/* nodes as instanced spheres, per-instance colour set each frame */
var nodeGeo = new T.SphereGeometry(0.62, 10, 8); /* 352 -> 176 tris each, and
  these are opaque so the transmission pass draws all 117 a second time */
var nodeMat = new T.MeshBasicMaterial({ color: 0xffffff });
var nodeMesh = new T.InstancedMesh(nodeGeo, nodeMat, N);
var m4 = new T.Matrix4();
var cTmp = new T.Color();
for (var i = 0; i < N; i++) {
  var ns0 = 0.55 + nodes[i].glow * 0.42;
  m4.makeScale(ns0, ns0, ns0).setPosition(nodes[i].pos.x, nodes[i].pos.y, nodes[i].pos.z);
  nodeMesh.setMatrixAt(i, m4);
  nodeMesh.setColorAt(i, cTmp.setScalar(0.02));
}
scene.add(nodeMesh);

/* the old uniform dust is gone: THE GROUND FIELD (built after the dichroic kit,
   which it needs for the mint LUT and the spine curve) replaces it with design. */

/* ---------- the ground plane: pulse ring + fine-line grid + contact glow ---------- */
/* One additive plane carries every floor effect: the opening scan pulse ring,
   a barely-there fine-line grid (long lines run the corridor, cross lines
   fainter, all distance-faded and vignetted to black), a soft contact glow
   under the spine's course (tGlow, baked once the curve exists), the pointer
   ripple and the tap scan. Everything multiplies the ignition wake factor. */
var ringMat = new T.ShaderMaterial({
  uniforms: {
    uPulse: { value: 0 }, uAmp: { value: 0 }, uCol: { value: new T.Color(0x9FF0CE) },
    tGlow: { value: null },
    uQuiet: { value: 1 },
    uBreath: { value: 1 },
    uDrift: { value: 0 },
    uWakeOn: { value: 0 }, uWakeC: { value: new T.Vector3() }, uWakeR: { value: 0 },
    uRip: { value: new T.Vector3(0, 0, 9999) }, uRipA: { value: 0 },
    uTap: { value: new T.Vector3(0, 0, 9999) }, uTapR: { value: 0 }, uTapA: { value: 0 }
  },
  vertexShader: [
    'varying vec2 vXZ; varying float vFog;',
    'void main(){ vec4 w = modelMatrix * vec4(position,1.0); vXZ = w.xz;',
    ' vec4 mv = viewMatrix * w; vFog = -mv.z;',
    ' gl_Position = projectionMatrix * mv; }'
  ].join('\n'),
  fragmentShader: [
    'uniform float uPulse; uniform float uAmp; uniform vec3 uCol;',
    'uniform sampler2D tGlow; uniform float uQuiet; uniform float uDrift; uniform float uBreath;',
    'uniform float uWakeOn; uniform vec3 uWakeC; uniform float uWakeR;',
    'uniform vec3 uRip; uniform float uRipA;',
    'uniform vec3 uTap; uniform float uTapR; uniform float uTapA;',
    'varying vec2 vXZ; varying float vFog;',
    'void main(){ float d = length(vXZ);',
    /* the story beat: the opening scan pulse, unchanged */
    ' float ring = exp(-abs(d - uPulse) * 0.30);',
    ' float wake = exp(-max(0.0, uPulse - d) * 0.05) * step(d, uPulse) * 0.18;',
    ' float pulseB = (ring * 0.85 + wake * 0.7) * uAmp;',
    /* fine-line grid, analytic width so the lines soften with view depth */
    ' float lw = 0.10 + vFog * 0.0035;',
    ' float dxl = abs(fract(vXZ.x / 7.0 + 0.5) - 0.5) * 7.0;',
    ' float dzl = abs(fract(vXZ.y / 7.0 + 0.5) - 0.5) * 7.0;',
    ' float lineL = (1.0 - smoothstep(0.0, lw, dxl)) * (0.10 / lw);',
    ' float lineC = (1.0 - smoothstep(0.0, lw, dzl)) * (0.10 / lw) * 0.35;',
    ' float glow = texture2D(tGlow, (vXZ + vec2(210.0)) / 420.0).g;',
    /* the RED channel of the same bake holds a contact spot under every node;
       the lookup unscales the drift so the spot rides with its dot */
    ' float ng = texture2D(tGlow, (vXZ / (1.0 - uDrift * 0.999) + vec2(210.0)) / 420.0).r;',
    ' float vig = (1.0 - smoothstep(60.0, 165.0, d)) * (1.0 - smoothstep(30.0, 95.0, abs(vXZ.x)));',
    ' float distF = exp(-vFog * 0.007);',
    /* interaction: the pointer glow and the tap ring wake the lines they cross */
    ' float dR = distance(vXZ, uRip.xz);',
    ' float rip = exp(-dR * dR * 0.010) * uRipA;',
    ' float dT = distance(vXZ, uTap.xz);',
    ' float tring = exp(-abs(dT - uTapR) * 0.22) * uTapA;',
    ' float tw = exp(-max(0.0, uTapR - dT) * 0.09) * step(dT, uTapR) * uTapA;',
    ' float grid = (lineL + lineC) * ((0.35 + glow * 1.1) * uBreath + ng * 2.4) * vig * (1.0 + rip * 2.6 + tring * 2.2) * 0.07;',
    ' float contact = (glow * 0.10 * uBreath + ng * 0.16) * vig;',
    ' float ib = rip * 0.05 + tring * 0.16 + tw * 0.012;',
    ' float b = pulseB + (grid + contact + ib) * distF;',
    ' float wk = mix(1.0, 1.0 - smoothstep(uWakeR - 42.0, uWakeR, distance(vec3(vXZ.x, 0.0, vXZ.y), uWakeC)), uWakeOn);',
    ' gl_FragColor = vec4(uCol * b * wk * uQuiet, 1.0); }'
  ].join('\n'),
  blending: T.AdditiveBlending, transparent: true, depthWrite: false, side: T.DoubleSide
});
var ringMesh = new T.Mesh(new T.PlaneGeometry(420, 420), ringMat);
ringMesh.rotation.x = -Math.PI / 2;
ringMesh.position.y = 0.12;
scene.add(ringMesh);

/* ---------- THE SPINE: one curve runs the whole journey and IS the arch at its end ---------- */
/* Corridor points weave low over the terrain; the final third curls up and traces the
   NEVAMIS arch (semicircle r=26 centred y=19, z=0) so the logo is the spine's final shape.
   The mesh + drawn-by-progress material are built after the dichroic kit below. */
var spinePts = [
  new T.Vector3(0, 6, 208), new T.Vector3(7, 5, 168), new T.Vector3(-9, 5, 132),
  new T.Vector3(9, 5, 98), new T.Vector3(-11, 6, 66), new T.Vector3(6, 7, 38),
  new T.Vector3(0, 8, 16), new T.Vector3(-10, 10, 2), new T.Vector3(-20, 13, -2),
  new T.Vector3(-26, 16, 0)
];
(function(){
  for (var i = 0; i <= 12; i++) {
    var th = Math.PI - (i / 12) * Math.PI;
    spinePts.push(new T.Vector3(Math.cos(th) * 26, 19 + Math.sin(th) * 26, 0));
  }
  /* right-leg descender: the circle's tangent at th=0 is straight down, so a short
     C1 vertical overrun puts the 3-unit drawing-tip taper BELOW the baseline and the
     FULL-width stroke exactly AT it (y=19) at p=1 - matching the left leg, whose
     corridor entry likewise thins out below the baseline. Both legs now end at y=19. */
  spinePts.push(new T.Vector3(26, 17.4, 0));
  spinePts.push(new T.Vector3(26, 16.0, 0));
})();
var spineCurve = new T.CatmullRomCurve3(spinePts, false, 'centripetal', 0.5);
function spineFracNear(v){
  var best = 0, bd = 1e9;
  for (var s = 0; s <= 1600; s++) {
    var u = s / 1600, q = spineCurve.getPointAt(u);
    var dd = q.distanceToSquared(v);
    if (dd < bd) { bd = dd; best = u; }
  }
  return best;
}
var ARCH_T = spineFracNear(spinePts[10]);            /* arc-length fraction where the arch begins */
var ORB_T = spineFracNear(new T.Vector3(0, 8, 16));  /* where the orb leaves the spine for the dot */
var DOT_POS = new T.Vector3(0, 8.6, 0);              /* the mark's dot: 0.4R below the arch centre (SVG: cy 352 vs 300) */

/* leaks hang off the spine: the terrain node nearest each of three spine stations */
var LEAK_T = [0.52, 0.55, 0.63]; /* choreography, not camera: stations chosen so each dispatch AND its gold landing stay inside the steady p-driven frame for the whole window (max |NDC| ~0.6) */
LEAK_T.forEach(function(f, k){
  var sp = spineCurve.getPointAt(f);
  var best = -1, bd = 1e9;
  for (var i = 0; i < N; i++) {
    if (nodes[i].leak >= 0 || nodes[i].dist < 18) continue;
    var dd = nodes[i].pos.distanceToSquared(sp);
    if (dd < bd) { bd = dd; best = i; }
  }
  nodes[best].leak = k;
  LEAKS.push(best);
});
/* thin stems from the spine down to each leak, gold until handled (coloured per frame) */
/* the gold stem lines are retired (owner call): a leak is its gold DOT alone,
   igniting once the drawn head has passed its spine station and the camera is
   near (the `drawn` gate below). */

/* ---------- iridescent glass panes: interactive stations on the spine ---------- */
function glassMat(){
  return new T.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 1,
    thickness: 2.6,
    ior: 1.5,
    roughness: 0.06,
    metalness: 0,
    iridescence: 1,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [120, 560],
    envMapIntensity: 0.85,
    attenuationColor: new T.Color(0xBFF5DE),
    attenuationDistance: 30,
    /* FrontSide, not DoubleSide: these are closed boxes seen from outside, and a
       double-sided TRANSMISSIVE material costs a second draw, a second MSAA
       resolve and a second mipmap-chain rebuild of the refraction target on
       every frame the slab is in frustum. */
    side: T.FrontSide
  });
}

/* ---------- liquid glass: scroll-phased undulation + interaction ripple ----------
   GPU-only: the vertex shader bends the slab (a pure function of local x,y so the
   box faces stay watertight) and the fragment shader bends the shading normal from
   the same analytic field, so matcap rims, iridescence and the refracted background
   shimmer with the swell. Phase is a function of scroll progress and pane index
   ONLY; the ripple envelope is driven by the interaction layer's settling frames.
   Raycasting still hits the undisplaced mesh: displacement is visual, amplitudes
   stay small enough that the hit slab remains honest. Centre is amplitude-capped
   so the etched title's backdrop stays calm and legible. */
var LQ_GLSL = [
  'uniform float uLqPhase; uniform float uLqAmp; uniform vec4 uLqRip;',
  'uniform vec4 uLqWake; uniform vec4 uLqWake2;',
  'uniform vec2 uLqSize; uniform float uLqZk;',
  'float lqWave(vec2 q, float ph){',
  ' return sin(q.x*6.3 + ph + sin(q.y*4.7 + ph*0.62)*1.35)*0.55',
  '      + sin(q.x*3.1 - q.y*5.9 - ph*0.81)*0.30',
  '      + sin((q.x+q.y)*9.4 + ph*1.27)*0.15; }',
  'float lqH(vec2 q){',
  /* title stability: the calm zone is now an ellipse that covers the whole etched
     block (numeral, title, rule), not just a small disc; the swell still owns the
     pane's edges so the glass keeps reading as liquid */
  ' float de = length((q - vec2(0.5)) * vec2(1.0, 1.8));',
  ' float cm = 0.32 + 0.68*smoothstep(0.30, 0.52, de);',
  ' float h = lqWave(q, uLqPhase) * uLqAmp * cm;',
  ' float rr = distance(q, uLqRip.xy);',
  ' float dr = rr - uLqRip.w;',
  ' h += cos(dr*22.0) * exp(-dr*dr*38.0) * exp(-rr*1.6) * uLqRip.z;',
  /* trailing wake: an eased source that follows the pointer across the surface,
     plus one further-lagged softer tap behind it; both attenuate over the etched
     block so the title never ghosts under the hand */
  ' float cw = mix(0.55, 1.0, smoothstep(0.26, 0.48, de));',
  ' float w1 = distance(q, uLqWake.xy);',
  ' h += cos(w1*24.0 - uLqWake.w) * exp(-w1*w1*26.0) * uLqWake.z * cw;',
  ' float w2 = distance(q, uLqWake2.xy);',
  ' h += cos(w2*19.0 - uLqWake.w + 1.7) * exp(-w2*w2*16.0) * uLqWake2.z * cw;',
  ' return clamp(h, -0.40, 0.40); }',
  'vec3 lqBend(vec3 n, vec3 tx, vec3 ty, vec2 q, float w, float k){',
  ' float e = 0.006; float h0 = lqH(q);',
  ' float dx = (lqH(q + vec2(e, 0.0)) - h0) / e;',
  ' float dy = (lqH(q + vec2(0.0, e)) - h0) / e;',
  ' return normalize(n - (tx*dx + ty*dy) * k * w); }'
].join('\n');
function makeLiquid(w, h){
  return {
    base: 0.26,
    phase: { value: 0 },
    amp: { value: 0.26 },
    rip: { value: new T.Vector4(0.5, 0.5, 0, 0) },
    wake: { value: new T.Vector4(0.5, 0.5, 0, 0) },
    wake2: { value: new T.Vector4(0.5, 0.5, 0, 0) },
    size: { value: new T.Vector2(w, h) },
    n: { value: 0.09 }
  };
}
function liquify(mat, lq){
  mat.customProgramCacheKey = function(){ return 'nvLiquidPane'; };
  mat.onBeforeCompile = function(sh){
    sh.uniforms.uLqPhase = lq.phase; sh.uniforms.uLqAmp = lq.amp;
    sh.uniforms.uLqRip = lq.rip; sh.uniforms.uLqSize = lq.size;
    sh.uniforms.uLqWake = lq.wake; sh.uniforms.uLqWake2 = lq.wake2;
    sh.uniforms.uLqZk = { value: 1 }; sh.uniforms.uLqN = lq.n;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + LQ_GLSL +
        '\nvarying vec2 vLqQ; varying float vLqW; varying vec3 vLqT; varying vec3 vLqB;')
      .replace('#include <begin_vertex>', [
        '#include <begin_vertex>',
        'vec2 lqQ = position.xy / uLqSize + 0.5;',
        'vLqQ = lqQ;',
        'vLqW = abs(normalize(normal).z);',
        'vLqT = normalize(normalMatrix * vec3(1.0, 0.0, 0.0));',
        'vLqB = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));',
        'transformed.z += lqH(lqQ) * uLqZk;'
      ].join('\n'));
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + LQ_GLSL +
        '\nuniform float uLqN; varying vec2 vLqQ; varying float vLqW; varying vec3 vLqT; varying vec3 vLqB;')
      .replace('#include <normal_fragment_begin>',
        '#include <normal_fragment_begin>\nnormal = lqBend(normal, vLqT, vLqB, vLqQ, vLqW, uLqN);');
  };
}
/* Six interactive stations mounted along the spine, one per NEVAMIS chapter.
   Ids match PANES.json; the interaction layer finds them at window.NV_SCENE.panes. */
var PANE_DEFS = [
  { id: 'scan',    title: 'The scan', f: 0.115, w: 17, h: 11, off: 11 },
  { id: 'capture', title: 'Capture',  f: 0.270, w: 18, h: 11.5 },
  { id: 'convert', title: 'Convert',  f: 0.430, w: 17, h: 11 },
  { id: 'operate', title: 'Operate',  f: 0.590, w: 18, h: 11.5, ns: 1.35 },
  { id: 'grow',    title: 'Grow',     f: 0.750, w: 17, h: 11, pos: [-12, 14.5, 42], ns: 1.9 },
  { id: 'plans',   title: 'Plans',    f: 0.895, w: 19, h: 12, pos: [18, 13, 12], ns: 2.9 }
];
var UPV = new T.Vector3(0, 1, 0);
var panes = [];
PANE_DEFS.forEach(function(d){
  var t = d.f * ARCH_T; /* stations live on the corridor, never on the arch */
  d.t = t;
  var pos;
  var pMat = glassMat();
  pMat.iridescence = 0.45; /* magenta stays a brief accent; the mint rim shells carry the edges */
  var lq = makeLiquid(d.w, d.h);
  liquify(pMat, lq);
  var mesh = new T.Mesh(new T.BoxGeometry(d.w, d.h, 0.9, 28, 20, 1), pMat);
  if (d.pos) {
    /* endgame gateposts: fixed stations that flank the final approach so a pane
       stays meaningfully in frame all the way through the arch settle */
    pos = new T.Vector3(d.pos[0], d.pos[1], d.pos[2]);
    mesh.position.copy(pos);
    /* angled ~15-20 degrees toward the corridor centre line, facing the approach;
       pitched a touch DOWN so the face reflects the dark floor of the environment,
       not its bright ceiling (an upward tilt here bloomed the whole slab white) */
    mesh.lookAt(0, pos.y - 7, pos.z + 55);
    pMat.envMapIntensity = 0.5;
    pMat.roughness = 0.12;
  } else {
    var sPos = spineCurve.getPointAt(t);
    var tan = spineCurve.getTangentAt(t);
    var side = new T.Vector3().crossVectors(tan, UPV).normalize();
    /* push outward from the centre line: the weave makes the sides alternate naturally */
    var sideSign = (sPos.x >= 0 ? 1 : -1) * (side.x >= 0 ? 1 : -1);
    pos = sPos.clone().addScaledVector(side, sideSign * (d.off || 14));
    pos.y += 6.0;
    mesh.position.copy(pos);
    /* angled back toward the approaching camera and slightly toward the corridor */
    mesh.lookAt(
      pos.x - tan.x * 40 - side.x * sideSign * 13,
      pos.y + 6,
      pos.z - tan.z * 40 - side.z * sideSign * 13
    );
  }
  scene.add(mesh);
  /* etched title IN the glass: canvas texture, mint, low intensity, additive; the
     object reads as an information surface even before the DOM label registers.
     Dimmed with camera proximity in apply() so bloom never blows it out. */
  var ec = document.createElement('canvas'); ec.width = 1024; ec.height = 512;
  var eg = ec.getContext('2d');
  eg.clearRect(0, 0, 1024, 512);
  eg.scale(2, 2); /* same layout, double the texel density: crisp at approach range */
  eg.textAlign = 'center';
  try { eg.letterSpacing = '12px'; } catch (er) {}
  eg.fillStyle = 'rgba(191,245,222,1.0)';
  /* late stations frame from much farther away (operate ~31u, grow ~47u,
     plans ~76u vs capture ~26u): at those distances the 34px numeral thins
     under mip minification and reads below 3:1 at its own framing. ns scales
     the glyph so its APPARENT size matches the earlier numeral standard at
     each pane's framing distance; the baseline stays anchored so it grows
     upward into empty texture and the title line never moves. A same-colour
     stroke thickens the strokes so minification keeps the luminance. */
  var nsc = d.ns || 1;
  eg.font = '700 ' + Math.round(34 * nsc) + 'px ui-monospace, Consolas, monospace';
  eg.fillText('0' + (PANE_DEFS.indexOf(d) + 1), 262, 84);
  if (nsc > 1) {
    eg.strokeStyle = 'rgba(191,245,222,1.0)';
    eg.lineWidth = 1.5 * nsc;
    eg.strokeText('0' + (PANE_DEFS.indexOf(d) + 1), 262, 84);
  }
  try { eg.letterSpacing = '7px'; } catch (er) {}
  eg.fillStyle = 'rgba(191,245,222,1.0)'; /* the numeral standard, now on the title */
  eg.font = '700 52px ui-monospace, Consolas, monospace';
  eg.fillText(d.title.toUpperCase(), 258, 150);
  eg.fillStyle = 'rgba(159,240,206,0.7)';
  eg.fillRect(176, 180, 160, 2);
  var etex = new T.CanvasTexture(ec);
  etex.colorSpace = T.SRGBColorSpace;
  etex.anisotropy = 8; /* the title stays sharp at the glancing approach angle */
  var etch = new T.Mesh(
    new T.PlaneGeometry(d.w * 0.88, d.w * 0.44),
    new T.MeshBasicMaterial({ map: etex, transparent: true, opacity: 0.34,
      blending: T.AdditiveBlending, depthWrite: false })
  );
  etch.position.set(0, 0, 0.95); /* clear of the liquid swell (face 0.45 + clamp 0.40) */
  mesh.add(etch);
  panes.push({ id: d.id, title: d.title, t: t, mesh: mesh, rim: null, etch: etch, anchor: pos.clone(),
    envBase: pMat.envMapIntensity, lq: lq });
});

/* ---------- BRAIN NODES: named parts of the brain, promoted from the terrain ----------
   Thirteen service items become named dots. Names, one-liners and availability
   are read verbatim from the plain-DOM truth copy (#doc), never retyped here,
   so the strings cannot drift from the truth files. Each item claims the free
   terrain node nearest its pillar's pane station (spread apart, never inside
   the core, and NEVER a leak: the gold leak stems keep their own role). */
var brains = [];
var brainOf = {};
(function(){
  var order = ['scan', 'capture', 'convert', 'operate', 'grow'];
  var used = {};
  LEAKS.forEach(function(li){ used[li] = true; });
  order.forEach(function(pid){
    var pn = null;
    for (var i = 0; i < panes.length; i++) if (panes[i].id === pid) pn = panes[i];
    var art = document.getElementById('doc-' + pid);
    if (!pn || !art) return;
    var h3 = art.querySelector('h3');
    var pillar = h3 ? h3.textContent : pid;
    var svcs = art.querySelectorAll('.svc');
    for (var s = 0; s < svcs.length; s++) {
      var h4 = svcs[s].querySelector('h4');
      var chip = h4 ? h4.querySelector('.chip') : null;
      if (!h4) continue;
      var name = '';
      for (var cn = h4.firstChild; cn; cn = cn.nextSibling) {
        if (cn.nodeType === 3) name += cn.textContent;
      }
      name = name.replace(/\s+/g, ' ').replace(/^ +| +$/g, '');
      var desc = '';
      var ps = svcs[s].querySelectorAll('p');
      for (var q = 0; q < ps.length; q++) {
        if (!ps[q].className) { desc = ps[q].textContent; break; }
      }
      /* nearest free node to this pillar's pane station, kept apart from siblings */
      var best = -1, bd = 1e9;
      for (var j = 0; j < N; j++) {
        if (used[j] || nodes[j].dist < 15) continue;
        var ddx = nodes[j].pos.x - pn.anchor.x, ddz = nodes[j].pos.z - pn.anchor.z;
        var dd = ddx * ddx + ddz * ddz;
        var ok = true;
        for (var b2 = 0; b2 < brains.length; b2++) {
          if (nodes[brains[b2].ni].pos.distanceToSquared(nodes[j].pos) < 144) { ok = false; break; }
        }
        if (!ok) continue;
        if (dd < bd) { bd = dd; best = j; }
      }
      if (best < 0) continue;
      used[best] = true;
      nodes[best].brain = true;
      var br = {
        ni: best, pane: pid, pillar: pillar, name: name, desc: desc,
        avail: chip ? chip.textContent : '',
        availDev: chip ? chip.className.indexOf('dev') >= 0 : false,
        pos: nodes[best].pos, wpos: nodes[best].pos.clone(), boost: 0
      };
      brainOf[best] = br;
      brains.push(br);
    }
  });
  /* named dots stand a step larger than the crowd (matrices re-set here, once) */
  for (var k2 = 0; k2 < brains.length; k2++) {
    var nd2 = nodes[brains[k2].ni];
    var s2 = (0.55 + nd2.glow * 0.42) * 1.45;
    m4.makeScale(s2, s2, s2).setPosition(nd2.pos.x, nd2.pos.y, nd2.pos.z);
    nodeMesh.setMatrixAt(brains[k2].ni, m4);
  }
  if (brains.length) nodeMesh.instanceMatrix.needsUpdate = true;
})();
/* invisible, slightly generous hit targets: raycast-only, never rendered */
var brainHits = new T.InstancedMesh(
  new T.SphereGeometry(2.6, 8, 6), new T.MeshBasicMaterial(), Math.max(1, brains.length));
brainHits.visible = false;
(function(){
  var hm = new T.Matrix4();
  for (var i = 0; i < brains.length; i++) {
    hm.makeTranslation(brains[i].pos.x, brains[i].pos.y, brains[i].pos.z);
    brainHits.setMatrixAt(i, hm);
  }
  brainHits.count = brains.length;
  brainHits.instanceMatrix.needsUpdate = true;
})();
scene.add(brainHits);

/* ---------- the orb's live position (the brain; mesh built after the dichroic kit) ---------- */
/* The faceted glass icosahedron is gone: the hero is now ONE perfectly smooth sphere
   that rides the spine from p=0 and finishes as the mark's dot. It never fades. */
var orbPos = new T.Vector3(0, 7, 0);

/* ---------- dispatch signals ---------- */
function bez(A, C, B, t){
  var u = 1 - t;
  return new T.Vector3(
    u * u * A.x + 2 * u * t * C.x + t * t * B.x,
    u * u * A.y + 2 * u * t * C.y + t * t * B.y,
    u * u * A.z + 2 * u * t * C.z + t * t * B.z
  );
}
/* dispatch timing retired with the gold leak dots (owner call). */

/* ---------- steady flow, beat 5: the inflow swirl ----------
   Owner note (third take): random dots read as noise, named dots as clutter.
   The traffic is now one soft galaxy of fine particles spiralling into the
   orb: everything the business generates, drawn through the brain. Every
   position lives in the vertex shader as a pure function of scroll progress,
   so scrubbing replays exactly, idle costs nothing and the CPU never touches
   a particle. */
var FLOWN = 950;
var flowGeo = new T.BufferGeometry();
(function(){
  var pos = new Float32Array(FLOWN * 3); /* required attribute; real position is shader-made */
  var seed = new Float32Array(FLOWN * 4);
  for (var i = 0; i < FLOWN; i++) {
    seed[i * 4]     = rand();               /* phase along the spiral */
    seed[i * 4 + 1] = (Math.floor(rand() * 3) / 3) * Math.PI * 2 + rand() * 0.9; /* one of three arms, jittered */
    seed[i * 4 + 2] = 0.78 + rand() * 0.5;  /* radius scale (tight, keeps arms coherent) */
    seed[i * 4 + 3] = rand();               /* personal jitter */
  }
  flowGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
  flowGeo.setAttribute('aSeed', new T.BufferAttribute(seed, 4));
})();
var flowMat = new T.ShaderMaterial({
  uniforms: {
    uT: { value: 0 },    /* scroll-driven swirl clock */
    uAmp: { value: 0 },  /* beat envelope */
    uPx: { value: 900 }  /* drawing-buffer height, for point sizing */
  },
  vertexShader: [
    'attribute vec4 aSeed;',
    'uniform float uT; uniform float uAmp; uniform float uPx;',
    'varying float vA;',
    'void main(){',
    '  float u = fract(uT + aSeed.x);',
    '  float e = u * u * (3.0 - 2.0 * u);',
    '  float r = mix(34.0 * aSeed.z, 1.2, e);',
    '  float an = aSeed.y + u * 5.6 + aSeed.w * 0.25;',
    '  float y = 7.0 + sin(3.14159 * e) * (5.5 + aSeed.w * 4.5);',
    '  vec3 wp = vec3(cos(an) * r, y, sin(an) * r);',
    '  vA = smoothstep(0.0, 0.18, u) * (1.0 - smoothstep(0.82, 1.0, u));',
    '  vA *= uAmp * (0.35 + 0.65 * aSeed.w) * (0.75 + 0.5 * e);',
    '  vA *= smoothstep(10.5, 14.5, distance(wp, vec3(-12.0, 14.5, 42.0)))',
    '      * smoothstep(11.5, 15.5, distance(wp, vec3(18.0, 13.0, 12.0)));',
    '  vec4 mv = modelViewMatrix * vec4(wp, 1.0);',
    '  gl_PointSize = (0.11 + 0.12 * aSeed.w + 0.10 * e) * uPx / max(1.0, -mv.z);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n'),
  fragmentShader: [
    'varying float vA;',
    'void main(){',
    '  float d = length(gl_PointCoord - 0.5);',
    '  float a = smoothstep(0.5, 0.1, d) * vA;',
    '  gl_FragColor = vec4(vec3(0.62, 0.94, 0.81) * a, a);',
    '}'
  ].join('\n'),
  transparent: true, depthWrite: false, blending: T.AdditiveBlending
});
var flowMesh = new T.Points(flowGeo, flowMat);
flowMesh.frustumCulled = false;
/* five spiral light streams: thin tubes (the spine's own language) curling
   into the orb, each carrying a soft pulse of light travelling inward */
var flowGroup = new T.Group();
flowGroup.add(flowMesh);
var flowStreamMats = [];
(function(){
  for (var k = 0; k < 5; k++) {
    var a0 = (k / 5) * Math.PI * 2 + rand() * 0.7;
    var lift = 3.2 + rand() * 3.4;
    var turns = 6.0 + rand() * 2.5;
    var pts = [];
    for (var q = 0; q <= 9; q++) {
      var t = q / 9;
      var rr = 1.1 + 34 * Math.pow(1 - t, 1.18);
      var an = a0 + t * turns;
      pts.push(new T.Vector3(Math.cos(an) * rr, 7 + Math.sin(Math.PI * t) * lift, Math.sin(an) * rr));
    }
    var curve = new T.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    var mat = new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uAmp: { value: 0 }, uPh: { value: k / 5 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vPf; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalMatrix * normal; vV = -mv.xyz; vPf = smoothstep(10.5, 14.5, distance(position, vec3(-12.0, 14.5, 42.0))) * smoothstep(11.5, 15.5, distance(position, vec3(18.0, 13.0, 12.0))); gl_Position = projectionMatrix * mv; }',
      fragmentShader: [
        'varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vPf; uniform float uT; uniform float uAmp; uniform float uPh;',
        'void main(){',
        '  float endF = smoothstep(0.0, 0.10, vUv.x) * (1.0 - smoothstep(0.90, 1.0, vUv.x));',
        '  float d = fract(vUv.x - uT - uPh);',
        '  float comet = exp(-d * 16.0);',
        
        '  float soft = pow(max(0.0, dot(normalize(vN), normalize(vV))), 1.7);',
        '  float a = uAmp * endF * soft * (0.025 + 1.5 * comet) * vPf;',
        '  vec3 col = vec3(0.62, 0.94, 0.81) * (1.0 + 0.5 * exp(-d * 34.0));',
        '  gl_FragColor = vec4(col * a, a);',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false, blending: T.AdditiveBlending
    });
    flowStreamMats.push(mat);
    flowGroup.add(new T.Mesh(new T.TubeGeometry(curve, 140, 0.30, 7, false), mat));
  }
})();
flowGroup.visible = false;
scene.add(flowGroup);

/* ---------- shared dichroic mint kit: procedural matcap + LUT GLSL ---------- */
/* Active Theory model: one matcap authors the palette; fresnel indexes a mint LUT. */
var matcapTex = (function(){
  var cv = document.createElement('canvas'); cv.width = cv.height = 256;
  var g = cv.getContext('2d');
  /* dark teal studio field */
  var vg = g.createLinearGradient(0, 0, 0, 256);
  vg.addColorStop(0, '#0B2C20'); vg.addColorStop(1, '#04120C');
  g.fillStyle = vg; g.fillRect(0, 0, 256, 256);
  /* broad mint highlight arc, upper-left */
  var hg = g.createRadialGradient(92, 74, 6, 92, 74, 150);
  hg.addColorStop(0, 'rgba(159,240,206,0.85)');
  hg.addColorStop(0.35, 'rgba(47,191,143,0.35)');
  hg.addColorStop(1, 'rgba(47,191,143,0)');
  g.fillStyle = hg; g.fillRect(0, 0, 256, 256);
  /* tight near-white hotspot */
  var sg = g.createRadialGradient(84, 62, 0, 84, 62, 26);
  sg.addColorStop(0, 'rgba(209,255,244,1)');
  sg.addColorStop(1, 'rgba(209,255,244,0)');
  g.fillStyle = sg; g.fillRect(0, 0, 256, 256);
  /* faint deep-mint counter-rim, lower-right */
  var rg = g.createRadialGradient(196, 208, 20, 196, 208, 110);
  rg.addColorStop(0, 'rgba(47,191,143,0.30)');
  rg.addColorStop(1, 'rgba(47,191,143,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
  var tx = new T.CanvasTexture(cv);
  tx.colorSpace = T.SRGBColorSpace;
  return tx;
})();
var LUT_GLSL = [
  /* 4-stop mint ramp: #0E4D3C -> #2FBF8F -> #9FF0CE -> #d1fff4 (gold deliberately absent) */
  'vec3 mintRamp(float t){',
  ' t = fract(t);',
  ' vec3 teal = vec3(0.055, 0.302, 0.235);',
  ' vec3 deep = vec3(0.184, 0.749, 0.561);',
  ' vec3 core = vec3(0.624, 0.941, 0.808);',
  ' vec3 ice  = vec3(0.820, 1.000, 0.956);',
  ' vec3 c = mix(teal, deep, smoothstep(0.0, 0.35, t));',
  ' c = mix(c, core, smoothstep(0.35, 0.7, t));',
  ' c = mix(c, ice,  smoothstep(0.7, 0.95, t));',
  ' return c; }',
  'float getFresnel(vec3 n, vec3 v, float power){',
  ' return 1.0 - pow(abs(dot(normalize(n), normalize(v))), power); }',
  'vec2 matcapUV(vec3 n, vec3 v){',
  ' vec3 x = normalize(vec3(v.z, 0.0, -v.x));',
  ' vec3 y = cross(v, x);',
  ' return vec2(dot(x, n), dot(y, n)) * 0.495 + 0.5; }',
  'vec2 rotUV(vec2 uv, float a){',
  ' uv -= 0.5; float c = cos(a), s = sin(a);',
  ' return vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y) + 0.5; }',
  'vec3 getRGB(sampler2D t, vec2 uv, float ang, float amt){',
  ' vec2 d = vec2(cos(ang), sin(ang)) * amt;',
  ' return vec3(texture2D(t, uv + d).r, texture2D(t, uv).g, texture2D(t, uv - d).b); }'
].join('\n');
var DICHROIC_VS = [
  'varying vec3 vN; varying vec3 vV;',
  'void main(){',
  ' vec4 w = modelMatrix * vec4(position, 1.0);',
  ' vN = normalize(mat3(modelMatrix) * normal);',
  ' vV = cameraPosition - w.xyz;',
  ' gl_Position = projectionMatrix * viewMatrix * w; }'
].join('\n');

/* ---------- THE GROUND FIELD: flow-aligned constellation dust ---------- */
/* Design, not scatter (Active Theory discipline: few hot, many faint, soft
   sprites). Three populations: filament streaks running parallel to the spine's
   course, clusters settled around the structure the scan reveals, and sparse
   air motes for the glass to refract. Density peaks in the corridor and falls
   to darkness at the edges. Sizes and brightness are tiered: a strict few hot
   motes, a middle band, a faint crowd. Shimmer is scroll-driven only, so the
   field is a still at rest. */
var FIELD = (window.innerWidth < 800) ? 1300 : 3400;
var fPos = new Float32Array(FIELD * 3);
var fSize = new Float32Array(FIELD);
var fSeed = new Float32Array(FIELD);
var fHot = new Float32Array(FIELD);
(function(){
  var fr = rng(90260829);
  var hotLeft = (window.innerWidth < 800) ? 9 : 14;
  var lat = new T.Vector3();
  for (var i = 0; i < FIELD; i++) {
    var roll = fr(), x, y, z;
    if (roll < 0.60) {
      /* filaments: a spine station, a lateral falloff, a jitter along the tangent */
      var u = fr() * ARCH_T;
      var sp = spineCurve.getPointAt(u);
      var tn = spineCurve.getTangentAt(u);
      lat.set(tn.z, 0, -tn.x).normalize();
      var sgn = fr() < 0.5 ? -1 : 1;
      var off = 4.5 + Math.pow(fr(), 1.7) * 30.0;
      var along = (fr() - 0.5) * 16.0;
      x = sp.x + lat.x * off * sgn + tn.x * along;
      z = sp.z + lat.z * off * sgn + tn.z * along;
      y = 0.15 + fr() * fr() * 1.9;
    } else if (roll < 0.83) {
      /* clusters: settled around the terrain nodes the scan wakes */
      var nd = nodes[Math.floor(fr() * N)];
      var a = fr() * Math.PI * 2, rr = Math.pow(fr(), 1.4) * 6.5;
      x = nd.pos.x + Math.cos(a) * rr;
      z = nd.pos.z + Math.sin(a) * rr;
      y = 0.15 + fr() * fr() * 2.4;
    } else {
      /* sparse air motes, fainter with height, for the glass to refract */
      var a2 = fr() * Math.PI * 2, r2 = 18 + Math.pow(fr(), 1.35) * 140;
      x = Math.cos(a2) * r2; z = Math.sin(a2) * r2;
      y = 3 + fr() * fr() * 38;
    }
    fPos[i * 3] = x; fPos[i * 3 + 1] = y; fPos[i * 3 + 2] = z;
    var tr = fr(), hot = 0;
    if (tr > 0.965 && hotLeft > 0 && y < 3) { hot = 1; hotLeft--; }
    else if (tr > 0.86) hot = 0.5;
    fSize[i] = hot === 1 ? 1.30 + fr() * 0.50 : hot === 0.5 ? 0.72 + fr() * 0.34 : 0.34 + fr() * 0.30;
    fSeed[i] = fr();
    fHot[i] = hot;
  }
})();
var fieldGeo = new T.BufferGeometry();
fieldGeo.setAttribute('position', new T.BufferAttribute(fPos, 3));
fieldGeo.setAttribute('aSize', new T.BufferAttribute(fSize, 1));
fieldGeo.setAttribute('aSeed', new T.BufferAttribute(fSeed, 1));
fieldGeo.setAttribute('aHot', new T.BufferAttribute(fHot, 1));
var fieldMat = new T.ShaderMaterial({
  uniforms: {
    uPx: { value: 500 },
    uPulse: { value: 0 },
    uP: { value: 0 },
    uQuiet: { value: 1 },
    uBreath: { value: 1 },
    uWakeOn: { value: 0 }, uWakeC: { value: new T.Vector3() }, uWakeR: { value: 0 },
    uRip: { value: new T.Vector3(0, 0, 9999) }, uRipA: { value: 0 },
    uTap: { value: new T.Vector3(0, 0, 9999) }, uTapR: { value: 0 }, uTapA: { value: 0 }
  },
  vertexShader: [
    'attribute float aSize; attribute float aSeed; attribute float aHot;',
    'uniform float uPx; uniform float uPulse; uniform float uP;',
    'uniform float uWakeOn; uniform vec3 uWakeC; uniform float uWakeR;',
    'uniform vec3 uRip; uniform float uRipA;',
    'uniform vec3 uTap; uniform float uTapR; uniform float uTapA;',
    'varying float vB; varying float vHot; varying float vSeed; varying float vFog;',
    'void main(){',
    ' vec3 pos = position;',
    ' float rr = length(pos.xz);',
    /* the opening scan pulse wakes the field as it crosses */
    ' float lit = smoothstep(rr - 2.0, rr + 6.0, uPulse);',
    ' float front = exp(-abs(uPulse - rr) * 0.14) * step(0.01, uPulse);',
    /* ground weighting: air motes ignore the interactions */
    ' float gnd = 1.0 - smoothstep(2.5, 6.0, pos.y);',
    ' float dR = distance(pos.xz, uRip.xz);',
    ' float rip = exp(-dR * dR * 0.012) * uRipA * gnd;',
    ' float dT = distance(pos.xz, uTap.xz);',
    ' float ringw = exp(-abs(dT - uTapR) * 0.16) * uTapA * gnd;',
    ' pos.y += rip * 1.6 + ringw * 0.9;',
    /* shimmer: a still at rest, alive under the hand and the scroll */
    ' float sh = 0.82 + 0.18 * sin(aSeed * 6.2831 + uP * 34.0);',
    ' float base = 0.07 + aHot * aHot * 0.78;',
    ' vB = base * sh * (0.30 + lit * 0.45) + front * 0.45 + rip * 2.2 + ringw * 1.7;',
    ' vB *= 1.0 - smoothstep(120.0, 175.0, rr);',
    ' vB *= mix(1.0, 1.0 - smoothstep(uWakeR - 42.0, uWakeR, distance(pos, uWakeC)), uWakeOn);',
    ' vHot = aHot + rip * 0.55 + ringw * 0.4;',
    ' vSeed = aSeed;',
    ' vec4 mv = modelViewMatrix * vec4(pos, 1.0);',
    ' vFog = -mv.z;',
    ' float dist = max(1.0, -mv.z);',
    /* near-fade: no giant blobs crossing the lens, and bloom stays tame */
    ' vB *= smoothstep(4.0, 16.0, dist);',
    ' gl_PointSize = min(aSize * (1.0 + rip * 0.45 + ringw * 0.3) * uPx / dist, 24.0);',
    ' gl_Position = projectionMatrix * mv; }'
  ].join('\n'),
  fragmentShader: [
    'uniform float uQuiet; uniform float uBreath;',
    'varying float vB; varying float vHot; varying float vSeed; varying float vFog;',
    LUT_GLSL,
    'void main(){',
    ' vec2 q = gl_PointCoord - 0.5;',
    ' float r2 = dot(q, q);',
    ' if (r2 > 0.25) discard;',
    /* soft core + soft halo, never a hard-edged point */
    ' float a = exp(-r2 * 14.0) + exp(-r2 * 4.0) * 0.35;',
    ' vec3 col = mintRamp(0.16 + vHot * 0.60 + vSeed * 0.10);',
    ' float fogF = exp(-vFog * 0.0055);',
    ' gl_FragColor = vec4(col * vB * a * fogF * uQuiet * uBreath, 1.0); }'
  ].join('\n'),
  blending: T.AdditiveBlending, transparent: true, depthWrite: false
});
var field = new T.Points(fieldGeo, fieldMat);
scene.add(field);

/* contact glow bake: the spine's course, projected onto the floor, as a soft mask */
ringMat.uniforms.tGlow.value = (function(){
  var cv = document.createElement('canvas'); cv.width = cv.height = 256;
  var g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  var pts = spineCurve.getSpacedPoints(140);
  g.lineCap = 'round'; g.lineJoin = 'round';
  [[34, 0.05], [18, 0.09], [8, 0.15]].forEach(function(pass){
    g.strokeStyle = 'rgba(0,255,0,' + pass[1] + ')';
    g.lineWidth = pass[0];
    g.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var X = (pts[i].x + 210) / 420 * 256, Y = (pts[i].z + 210) / 420 * 256;
      if (i === 0) g.moveTo(X, Y); else g.lineTo(X, Y);
    }
    g.stroke();
  });
  /* node contact spots live in the RED channel: the grid wakes where a dot
     sits on it and a soft pad of light ties each dot to the floor. Brain
     nodes press a little harder so the named dots read as anchors. */
  g.globalCompositeOperation = 'lighter';
  for (var ni2 = 0; ni2 < N; ni2++) {
    var NX = (nodes[ni2].pos.x + 210) / 420 * 256, NY = (nodes[ni2].pos.z + 210) / 420 * 256;
    var nrad = nodes[ni2].brain ? 5.5 : 3.2;
    var ngr = g.createRadialGradient(NX, NY, 0, NX, NY, nrad);
    ngr.addColorStop(0, 'rgba(255,0,0,' + (nodes[ni2].brain ? 0.85 : 0.50) + ')');
    ngr.addColorStop(1, 'rgba(255,0,0,0)');
    g.fillStyle = ngr;
    g.fillRect(NX - nrad, NY - nrad, nrad * 2, nrad * 2);
  }
  g.globalCompositeOperation = 'source-over';
  return new T.CanvasTexture(cv);
})();

/* ---------- the spine's body: a luminous ribbon drawn by scroll progress ---------- */
/* TubeGeometry uv.x is arc-length fraction along the curve. uHead reveals the ribbon
   (stroke-draw); three pulse waves ride the drawn length (driven by p, never wall time,
   so idle stays zero); past ARCH_T the tube fattens from r0.55 to ~1.5 and brightens:
   the spine's final segment IS the NEVAMIS arch. No opacity fades anywhere.
   COMET CONTRACT: the orb IS the drawing head. Pre-morph uHead == the orb's curve
   parameter, so the ribbon exists only where the orb has been. Near the head the tube
   swells (crisp vertex displacement, no alpha) to meet the sphere tangentially, and its
   shading blends into the orb's matcap LUT so the junction reads as one substance.
   From morph start (uTip -> 1) the head leaves the orb behind and the same zone
   becomes a finely tapered drawing tip that strokes the arch. */
var spineMat = new T.ShaderMaterial({
  uniforms: {
    uHead: { value: 0.06 },
    uP: { value: new T.Vector3(-1, -1, -1) },
    uPA: { value: new T.Vector3(0, 0, 0) },
    uArchT: { value: 0.86 },
    uArchGlow: { value: 0 },
    uDim: { value: 1 },
    tMatcap: { value: matcapTex },
    uTime: { value: 0 },
    uCameraY: { value: 0 },
    uOrbR: { value: 2.3 },
    uLen: { value: 335.0 },
    uTip: { value: 0 },
    uPark: { value: 0 },
    uWakeOn: { value: 0 },
    uWakeC: { value: new T.Vector3(0, 0, 0) },
    uWakeR: { value: 0 }
  },
  vertexShader: [
    'uniform float uArchT; uniform float uHead; uniform float uOrbR; uniform float uLen; uniform float uTip;',
    'uniform float uWakeOn; uniform vec3 uWakeC; uniform float uWakeR;',
    'varying float vT; varying vec3 vN; varying vec3 vV; varying float vFog; varying float vWake;',
    'void main(){ vT = uv.x;',
    ' float fat = smoothstep(uArchT - 0.012, uArchT, uv.x);',
    ' float baseR = 0.55 + fat * 0.855;',
    /* world-units distance behind the drawn head along the curve */
    ' float dW = max(0.0, uHead - uv.x) * uLen;',
    /* comet neck: swell from ribbon radius up to just inside the sphere (0.96R) over
       ~4.6R behind the head; nk*nk gives a tangential, facet-free flare */
    ' float nk = 1.0 - smoothstep(0.0, uOrbR * 4.6, dW);',
    ' float rNeck = mix(0.55, uOrbR * 0.96, nk * nk);',
    /* morph drawing tip: the stroke tapers to a point over its last 3 world units */
    ' float rTip = baseR * smoothstep(0.0, 3.0, dW);',
    ' float r = mix(max(rNeck, baseR), rTip, uTip);',
    ' vec3 p2 = position + normal * (r - 0.55);',
    ' vec4 w = modelMatrix * vec4(p2, 1.0);',
    /* ignition: light-front factor, world distance from the orb */
    ' vWake = mix(1.0, 1.0 - smoothstep(uWakeR - 42.0, uWakeR, distance(w.xyz, uWakeC)), uWakeOn);',
    ' vN = normalize(mat3(modelMatrix) * normal);',
    ' vV = cameraPosition - w.xyz;',
    ' vec4 mv = viewMatrix * w; vFog = -mv.z;',
    ' gl_Position = projectionMatrix * mv; }'
  ].join('\n'),
  fragmentShader: [
    'uniform float uHead; uniform vec3 uP; uniform vec3 uPA; uniform float uDim;',
    'uniform float uArchT; uniform float uArchGlow;',
    'uniform sampler2D tMatcap; uniform float uTime; uniform float uCameraY;',
    'uniform float uOrbR; uniform float uLen; uniform float uTip; uniform float uPark;',
    'varying float vT; varying vec3 vN; varying vec3 vV; varying float vFog; varying float vWake;',
    LUT_GLSL,
    'void main(){',
    ' if (vT > uHead) discard;',
    ' vec3 n = normalize(vN); vec3 v = normalize(vV);',
    ' float f = getFresnel(n, v, 1.4);',
    ' vec3 col = mintRamp(f * 2.2 + vT * 1.3);',
    ' float base = 0.10 + f * 0.35;',
    /* material continuity: within the neck (pre-morph only) shading blends toward the
       orb's exact matcap-LUT formula so there is no material boundary at the junction */
    ' float dW = max(0.0, uHead - vT) * uLen;',
    ' float m = (1.0 - smoothstep(0.0, uOrbR * 4.2, dW)) * (1.0 - uTip);',
    ' float front = exp(-(uHead - vT) * 90.0) * 0.85 * (1.0 - 0.8 * m);',
    ' front *= 1.0 - uPark * 0.90; /* parked: the head stops glowing into the right foot */',
    ' float pulses = exp(-abs(vT - uP.x) * 46.0) * uPA.x',
    '              + exp(-abs(vT - uP.y) * 46.0) * uPA.y',
    '              + exp(-abs(vT - uP.z) * 46.0) * uPA.z;',
    ' float arch = smoothstep(uArchT - 0.01, uArchT + 0.02, vT) * uArchGlow;',
    ' float edge = max(smoothstep(uHead, uHead - 0.012, vT), m);',
    ' float near = smoothstep(4.0, 13.0, length(vV));',
    ' float b = (base + front + pulses * 1.2 + arch * 1.5) * edge * near * uDim;',
    /* parked comet: once the stroke has settled, the head sits below the right
       baseline (y<19) and its glow blooms up that leg; damp the below-baseline
       emission on the arch side so both feet carry equal heat at p=1 */
    ' b *= 1.0 - uPark * smoothstep(uArchT, uArchT + 0.02, vT) * (1.0 - smoothstep(16.8, 22.0, cameraPosition.y - vV.y)) * 0.80;',
    /* the right leg's mintRamp phase (vT*1.3) sits in the bright ice band, so its core
       out-glows the left foot; measured K=0.35 over the final stretch matches the bands */
    ' b *= 1.0 - uPark * smoothstep(0.93, 0.985, vT) * 0.35;',
    ' float fogF = exp(-vFog * 0.005);',
    ' vec2 muv = rotUV(matcapUV(n, v), uCameraY * 0.2 - 1.5 - uTime * 0.2);',
    ' vec3 oc = vec3(0.012, 0.035, 0.026) + getRGB(tMatcap, muv, 0.2, 0.002) * 0.5;',
    ' float fo = getFresnel(n, v, 1.5 + sin(uTime * 0.1) * 0.3);',
    ' oc += mintRamp(fo * 3.0 + uCameraY * 0.02) * fo * 0.32;',
    ' oc = pow(oc * 1.5, vec3(1.8));',
    ' vec3 outc = mix(col * b * fogF, oc * uDim, m * m);',
    /* halo continuity: the orb rim shell's exact glow formula, faded with the neck
       blend, so the halo crosses the junction instead of stopping at the sphere */
    ' outc += mintRamp(fo * 3.0 + uCameraY * 0.02) * pow(fo, 2.2) * 0.27 * m * uDim;',
    ' gl_FragColor = vec4(outc * vWake, 1.0); }'
  ].join('\n'),
  blending: T.AdditiveBlending, transparent: true, depthWrite: false
});
spineMat.uniforms.uArchT.value = ARCH_T;
spineMat.uniforms.uLen.value = spineCurve.getLength();
var spineMesh = new T.Mesh(new T.TubeGeometry(spineCurve, 640, 0.55, 24, false) /* was 1280x96 = 245,760
  triangles, 58-64% of every frame, for a 0.55-unit-radius thread. 640 rings over
  ~335 units is one every half unit, which the neck swell still resolves. */, spineMat);
scene.add(spineMesh);
/* Tail extension: the line continues off-frame past the opening camera, so the
   tube's open mouth (a dark circle at the bottom of the p=0 frame) is never
   visible. Deliberately a SEPARATE mesh: extending spineCurve itself would
   reparameterize every arc-length fraction (LEAK_T, comet timing, ARCH_T).
   uv.x is compressed into [0, 0.02] with 0 at the junction, so the
   drawn-by-progress shader treats it as the permanent tail: always drawn,
   no neck swell (dW stays large), pulse phase continuous across the joint. */
(function(){
  var tdir = spinePts[0].clone().sub(spinePts[1]).normalize();
  var tailCurve = new T.CatmullRomCurve3([
    spinePts[0].clone(),
    spinePts[0].clone().addScaledVector(tdir, 36),
    spinePts[0].clone().addScaledVector(tdir, 80).add(new T.Vector3(0, -3, 0))
  ], false, 'centripetal', 0.5);
  /* same radial count as the spine or the silhouette steps at the junction */
  var tg = new T.TubeGeometry(tailCurve, 24, 0.55, 24, false);
  var uv = tg.attributes.uv;
  for (var i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.02);
  uv.needsUpdate = true;
  scene.add(new T.Mesh(tg, spineMat));
})();
/* coarse spine samples for the per-frame camera-proximity check (fix: bloom blowout) */
var SPINE_SAMPLES = spineCurve.getSpacedPoints(140);

/* ---------- the orb: matcap + fresnel mint LUT + pow(1.8) crush (HomeLogoShader model) ---------- */
/* Opaque, always visible; SphereGeometry 96x64 so it is smooth at any distance. */
var markMat = new T.ShaderMaterial({
  uniforms: {
    tMatcap: { value: matcapTex },
    uTime: { value: 0 },
    uCameraY: { value: 0 },
    uVisible: { value: 1 },
    uHighlight: { value: 0 },
    uDim: { value: 1 }
  },
  vertexShader: DICHROIC_VS,
  fragmentShader: [
    'uniform sampler2D tMatcap;',
    'uniform float uTime; uniform float uCameraY;',
    'uniform float uVisible; uniform float uHighlight; uniform float uDim;',
    'varying vec3 vN; varying vec3 vV;',
    LUT_GLSL,
    'void main(){',
    ' vec3 n = normalize(vN); vec3 v = normalize(vV);',
    ' vec3 color = vec3(0.012, 0.035, 0.026);',
    ' vec2 muv = rotUV(matcapUV(n, v), uCameraY * 0.2 - 1.5 - uTime * 0.2);',
    ' color += getRGB(tMatcap, muv, 0.2, 0.002) * 0.5;',
    ' float f = getFresnel(n, v, 1.5 + sin(uTime * 0.1) * 0.3);',
    ' vec3 rim = mintRamp(f * 3.0 + uCameraY * 0.02);',
    ' color += rim * f * mix(0.8, 2.0, uHighlight) * uVisible * 0.4;',
    ' color = pow(color * mix(1.5, 2.5, uHighlight), vec3(1.8));',
    ' gl_FragColor = vec4(color * uDim, 1.0); }'
  ].join('\n')
});
/* one geometry, shared with the rim shell below: same sphere, half the memory,
   and the driver reuses the binding across the draws */
var ORB_GEO = new T.SphereGeometry(2.3, 64, 48);
var orb = new T.Mesh(ORB_GEO, markMat);
orb.position.copy(orbPos);
scene.add(orb);

/* ---------- rim shells: fresnel -> mint LUT, one material PER shell ---------- */
/* Per-instance so the interaction layer can brighten a single pane via uBoost (0..1). */
function makeRimMat(){
  return new T.ShaderMaterial({
    uniforms: {
      uFade: { value: 1 },
      uBoost: { value: 0 },
      uCameraY: { value: 0 }
    },
    vertexShader: DICHROIC_VS,
    fragmentShader: [
      'uniform float uFade; uniform float uBoost; uniform float uCameraY;',
      'varying vec3 vN; varying vec3 vV;',
      LUT_GLSL,
      'void main(){',
      ' vec3 n = normalize(vN); vec3 v = normalize(vV);',
      ' float f = getFresnel(n, v, 1.2);',
      ' vec3 rim = mintRamp(f * 3.0 + uCameraY * 0.02);',
      ' float b = pow(f, 2.2) * (1.0 + uBoost * 1.4);',
      ' gl_FragColor = vec4(rim * b * 1.5 * uFade, 1.0); }'
    ].join('\n'),
    blending: T.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
}
var orbRim = new T.Mesh(ORB_GEO, makeRimMat());
orbRim.scale.setScalar(1.07);
orbRim.material.uniforms.uFade.value = 0.18;
orb.add(orbRim);
function makePaneRimMat(lq){
  return new T.ShaderMaterial({
    uniforms: {
      uFade: { value: 1 },
      uBoost: { value: 0 },
      uCameraY: { value: 0 },
      uLqPhase: lq.phase, uLqAmp: lq.amp, uLqRip: lq.rip, uLqSize: lq.size,
      uLqWake: lq.wake, uLqWake2: lq.wake2,
      uLqZk: { value: 1 / 1.35 }, /* the shell's z scale re-amplifies: divide back out */
      uLqN: { value: 0.09 }
    },
    vertexShader: [
      LQ_GLSL,
      'varying vec3 vN; varying vec3 vV; varying vec2 vLqQ; varying float vLqW;',
      'varying vec3 vLqT; varying vec3 vLqB;',
      'void main(){',
      ' vec2 lqQ = position.xy / uLqSize + 0.5; vLqQ = lqQ;',
      ' vLqW = abs(normalize(normal).z);',
      ' vLqT = normalize(mat3(modelMatrix) * vec3(1.0, 0.0, 0.0));',
      ' vLqB = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));',
      ' vec3 p2 = position; p2.z += lqH(lqQ) * uLqZk;',
      ' vec4 w = modelMatrix * vec4(p2, 1.0);',
      ' vN = normalize(mat3(modelMatrix) * normal);',
      ' vV = cameraPosition - w.xyz;',
      ' gl_Position = projectionMatrix * viewMatrix * w; }'
    ].join('\n'),
    fragmentShader: [
      'uniform float uFade; uniform float uBoost; uniform float uCameraY; uniform float uLqN;',
      'varying vec3 vN; varying vec3 vV; varying vec2 vLqQ; varying float vLqW;',
      'varying vec3 vLqT; varying vec3 vLqB;',
      LUT_GLSL,
      LQ_GLSL,
      'void main(){',
      ' vec3 n = lqBend(normalize(vN), vLqT, vLqB, vLqQ, vLqW, uLqN); vec3 v = normalize(vV);',
      ' float f = getFresnel(n, v, 1.2);',
      ' vec3 rim = mintRamp(f * 3.0 + uCameraY * 0.02);',
      ' float b = pow(f, 2.2) * (1.0 + uBoost * 0.7);',
      ' gl_FragColor = vec4(rim * b * 1.5 * uFade, 1.0); }'
    ].join('\n'),
    blending: T.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
}
panes.forEach(function(pn){
  var rim = new T.Mesh(pn.mesh.geometry, makePaneRimMat(pn.lq));
  rim.position.copy(pn.mesh.position);
  rim.rotation.copy(pn.mesh.rotation);
  rim.scale.set(1.01, 1.01, 1.35); /* thin axis inflated well clear of the slab face */
  scene.add(rim);
  pn.rim = rim;
});

/* ---------- governor T3 fallback: matcap-LUT glass panes ----------
   The mark's own dichroic kit (matcap + fresnel mint LUT + pow(1.8) crush)
   stood up as a pane material: when the governor reaches tier 3 the slabs
   trade MeshPhysicalMaterial's transmission pass (the scene re-render it
   costs) for this shader. The liquid displacement, the bent shading normal,
   the wake/ripple envelopes, the rim shells and the etched titles all stay:
   the SAME lq uniform objects are wired in, so every per-pane channel keeps
   working across a swap in either direction. Built once at startup and
   warm-compiled so the mid-motion swap never hitches. */
function makeLutPaneMat(lq, envBase){
  var mat = new T.ShaderMaterial({
    uniforms: {
      tMatcap: { value: matcapTex },
      uEnvI: { value: envBase },
      uCameraY: { value: 0 },
      uLqPhase: lq.phase, uLqAmp: lq.amp, uLqRip: lq.rip, uLqSize: lq.size,
      uLqWake: lq.wake, uLqWake2: lq.wake2,
      uLqZk: { value: 1 },
      uLqN: lq.n
    },
    vertexShader: [
      LQ_GLSL,
      'varying vec3 vN; varying vec3 vV; varying vec2 vLqQ; varying float vLqW;',
      'varying vec3 vLqT; varying vec3 vLqB;',
      'void main(){',
      ' vec2 lqQ = position.xy / uLqSize + 0.5; vLqQ = lqQ;',
      ' vLqW = abs(normalize(normal).z);',
      ' vLqT = normalize(mat3(modelMatrix) * vec3(1.0, 0.0, 0.0));',
      ' vLqB = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));',
      ' vec3 p2 = position; p2.z += lqH(lqQ) * uLqZk;',
      ' vec4 w = modelMatrix * vec4(p2, 1.0);',
      ' vN = normalize(mat3(modelMatrix) * normal);',
      ' vV = cameraPosition - w.xyz;',
      ' gl_Position = projectionMatrix * viewMatrix * w; }'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tMatcap; uniform float uEnvI; uniform float uCameraY; uniform float uLqN;',
      'varying vec3 vN; varying vec3 vV; varying vec2 vLqQ; varying float vLqW;',
      'varying vec3 vLqT; varying vec3 vLqB;',
      LUT_GLSL,
      LQ_GLSL,
      'void main(){',
      ' vec3 n = lqBend(normalize(vN), vLqT, vLqB, vLqQ, vLqW, uLqN);',
      ' vec3 v = normalize(vV);',
      ' vec2 muv = rotUV(matcapUV(n, v), uCameraY * 0.2 - 1.5);',
      ' vec3 col = vec3(0.010, 0.030, 0.024) + getRGB(tMatcap, muv, 0.2, 0.002) * 0.40 * uEnvI;',
      ' float f = getFresnel(n, v, 1.4);',
      ' col += mintRamp(f * 2.6 + vLqQ.y * 0.25) * f * 0.30 * uEnvI;',
      ' col = pow(col * 1.5, vec3(1.8));',
      /* head-on the slab stays see-through-ish, grazing goes solid: the glass read */
      ' float a = clamp(0.30 + f * 0.55, 0.0, 0.9);',
      ' gl_FragColor = vec4(col, a); }'
    ].join('\n'),
    transparent: true, depthWrite: false, side: T.DoubleSide
  });
  /* apply() and finishIntro() drive envMapIntensity on whatever material the
     pane carries; on this one the property IS the uEnvI uniform */
  Object.defineProperty(mat, 'envMapIntensity', {
    get: function(){ return mat.uniforms.uEnvI.value; },
    set: function(x){ mat.uniforms.uEnvI.value = x; }
  });
  return mat;
}
panes.forEach(function(pn, gi){
  pn.matPhys = pn.mesh.material;
  pn.matLut = makeLutPaneMat(pn.lq, pn.envBase);
  pn.geoHi = pn.mesh.geometry;
  var gd = PANE_DEFS[gi];
  pn.geoLo = new T.BoxGeometry(gd.w, gd.h, 0.9, 14, 10, 1); /* T4: tessellation halved */
  /* raycast the low-poly twin, not the display slab: every pointer move walked
     2,432 triangles per pane on the main thread. Same box, same per-face UVs, so
     hits[0].uv (which places the ripple) is identical. */
  pn.mesh.raycast = (function(proxy){
    return function(raycaster, intersects){
      var shown = this.geometry;
      this.geometry = proxy;
      T.Mesh.prototype.raycast.call(this, raycaster, intersects);
      this.geometry = shown;
    };
  })(pn.geoLo);
});
/* warm-compile the fallback program now so the first T3 swap costs nothing */
panes.forEach(function(pn){ pn.mesh.material = pn.matLut; });
renderer.compile(scene, camera);
panes.forEach(function(pn){ pn.mesh.material = pn.matPhys; });

/* ---------- camera path ---------- */
/* a machine on rails: z strictly decreases the whole way (no orbits, no pull-backs);
   the S-drift is +/-6 units of lateral sway; the last quarter is a slow frontal
   push-in that settles at (0,23,63) facing the arch plane (z=0) head on. */
var CAM_PTS_L = [
  [0, 32, 242], [-2, 22, 206], [2, 16, 170], [-2, 13.5, 136], [1, 13, 110],
  [0, 14, 98], [0, 17, 92], [0, 20, 88], [0, 22, 85]
];
/* portrait constants: half the lateral sway (the spine stays central in the
   narrow frame) and a farther, higher final station so the whole mark fits the
   narrow frustum at the wider portrait fov. z still strictly decreases the
   whole way: rails, not orbits, in BOTH compositions. */
var CAM_PTS_P = [
  [0, 33, 244], [-1, 22, 207], [1, 16, 171], [-1, 13.5, 137], [0.5, 13, 126],
  [0, 15, 123], [0, 18, 122], [0, 21, 121], [0, 23, 120]
];
var camCurve = new T.CatmullRomCurve3(
  CAM_PTS_L.map(function(q){ return new T.Vector3(q[0], q[1], q[2]); }),
  false, 'catmullrom', 0.4);
/* pane restationing: the same construction maths as the build above, with the
   lateral offsets blended toward the corridor centre line by PF so every
   station stays meaningfully inside the narrow horizontal frustum. At PF = 0
   this reproduces the build-time landscape placement exactly. */
function restationPanes(){
  var lat = mixN(1, 0.55, PF), gx = mixN(1, 0.90, PF);
  for (var ri = 0; ri < panes.length; ri++) {
    var d = PANE_DEFS[ri], pn = panes[ri], pos;
    if (d.pos) {
      pos = new T.Vector3(d.pos[0] * gx, d.pos[1], d.pos[2]);
      pn.mesh.position.copy(pos);
      pn.mesh.lookAt(0, pos.y - 7, pos.z + 55);
    } else {
      var sPos = spineCurve.getPointAt(d.t);
      var tan = spineCurve.getTangentAt(d.t);
      var side = new T.Vector3().crossVectors(tan, UPV).normalize();
      var sideSign = (sPos.x >= 0 ? 1 : -1) * (side.x >= 0 ? 1 : -1);
      pos = sPos.clone().addScaledVector(side, sideSign * (d.off || 14) * lat);
      pos.y += 6.0;
      pn.mesh.position.copy(pos);
      pn.mesh.lookAt(
        pos.x - tan.x * 40 - side.x * sideSign * 13,
        pos.y + 6,
        pos.z - tan.z * 40 - side.z * sideSign * 13
      );
    }
    pn.anchor.copy(pos);
    if (pn.rim) {
      pn.rim.position.copy(pn.mesh.position);
      pn.rim.quaternion.copy(pn.mesh.quaternion);
    }
  }
}
function applyComposition(){
  camera.fov = mixN(45, 58, PF);
  for (var ci = 0; ci < camCurve.points.length; ci++) {
    var qa = CAM_PTS_L[ci], qb = CAM_PTS_P[ci];
    camCurve.points[ci].set(mixN(qa[0], qb[0], PF), mixN(qa[1], qb[1], PF), mixN(qa[2], qb[2], PF));
  }
  restationPanes();
}
var ARCH_TGT = new T.Vector3(0, 25, 0);

/* ---------- composer ---------- */
/* HalfFloat targets are the EffectComposer default in this three build (checked: rt type = HalfFloatType). */
/* An explicit multisampled target: EffectComposer otherwise builds samples:0
   buffers and the whole film renders with no antialiasing (the renderer's own
   antialias flag only covers the final fullscreen quad, which has no edges).
   HalfFloatType is EffectComposer's own default and must stay - the bloom's
   threshold-zero trick depends on the HDR buffer. EffectComposer clones this for
   its second buffer, and setSize/setPixelRatio preserve `samples`. */
var composer = new NV3.EffectComposer(renderer,
  new T.WebGLRenderTarget(1, 1, { type: T.HalfFloatType, samples: 4 }));
var renderPass = new NV3.RenderPass(scene, camera);
composer.addPass(renderPass);
/* Active Theory model: threshold ZERO - the crushed near-black scene is the threshold,
   and the bloom buffer is gamma-crushed pow(1.8) before the additive blend so grey haze
   dies while hot cores survive (their GlobalComposite re-shape). */
var bloom = new NV3.UnrealBloomPass(new T.Vector2(1, 1), 1.0, 0.85, 0.0);
bloom.compositeMaterial.fragmentShader = bloom.compositeMaterial.fragmentShader.replace(
  'float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );',
  'bloom = pow( bloom, vec3( 1.8 ) );\n\t\t\t\t\tfloat bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );'
);
bloom.compositeMaterial.needsUpdate = true;
composer.addPass(bloom);
/* their getNoise film grain, overlay-blended at 0.15: the anti-banding pass */
var grainPass = (function(){
  var mat = new T.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uWash: { value: 0 } },
    vertexShader: [
      'varying vec2 vUv;',
      'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float uTime; uniform float uWash;',
      'varying vec2 vUv;',
      'float getNoise(vec2 uv, float time){',
      ' float x = uv.x * uv.y * time * 1000.0;',
      ' x = mod(x, 13.0) * mod(x, 123.0);',
      ' return clamp(0.1 + mod(x, 0.01) * 100.0, 0.0, 1.0); }',
      'float blendOverlay(float b, float s){ return b < 0.5 ? 2.0*b*s : 1.0 - 2.0*(1.0-b)*(1.0-s); }',
      'void main(){',
      ' vec4 c = texture2D(tDiffuse, vUv);',
      ' float g = getNoise(vUv, uTime);',
      ' vec3 o = vec3(blendOverlay(c.r, g), blendOverlay(c.g, g), blendOverlay(c.b, g));',
      ' vec3 col = mix(c.rgb, o, 0.03);', /* was 0.15: a ~10x oversized dither that
        re-randomised every pixel every frame, which on a still scene is 100% of
        the visible churn. 0.03 still breaks up banding without the fizz. */
      /* exit wash: the composed frame grades toward the mint-white end of the
         LUT (the mintRamp core->ice stops), luminance-shaped so highlights
         wash first and the shadows follow: one smooth crescendo, no strobe */
      ' if (uWash > 0.001) {',
      '  float lum = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);',
      '  vec3 hotc = mix(vec3(0.624, 0.941, 0.808), vec3(0.820, 1.000, 0.956), clamp(lum * 0.6 + uWash * 0.5, 0.0, 1.0));',
      '  col = mix(col, hotc, uWash * (0.30 + 0.70 * lum));',
      '  col += hotc * (uWash * uWash * 0.55);',
      ' }',
      ' gl_FragColor = vec4(col, c.a); }'
    ].join('\n'),
    depthTest: false, depthWrite: false
  });
  var quadScene = new T.Scene();
  var quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quadScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), mat));
  return {
    enabled: true, needsSwap: true, clear: false, renderToScreen: false,
    material: mat,
    setSize: function(){},
    dispose: function(){},
    render: function(rdr, writeBuffer, readBuffer){
      mat.uniforms.tDiffuse.value = readBuffer.texture;
      rdr.setRenderTarget(this.renderToScreen ? null : writeBuffer);
      rdr.render(quadScene, quadCam);
    }
  };
})();
composer.addPass(grainPass);
composer.addPass(new NV3.OutputPass());

/* ---------- ADAPTIVE QUALITY GOVERNOR ----------
   Owner directive: "its a bit laggy on my laptop, most people dont have super
   computers". A rolling frame-time monitor samples ONLY chained rendering
   frames (a frame whose predecessor also composed: render-on-demand wake-up
   frames, idle and the reduced-motion still are never samples, so idle-zero
   and the reduced path stay untouched and no timer ever ticks at rest).
   Decisions: when the p90 frame time over a 30-frame window exceeds ~19ms the
   governor steps DOWN one tier; after ~4s of continuously calm chained frames
   it steps UP at most once (a hysteresis latch: another up needs another down
   first, so it can never oscillate). Tier changes are applied only during
   motion (mid-scroll or a settling interaction), never while parked, so a
   step never pops in a still frame. The camera is never touched.
   The ladder is cumulative, cheapest visual loss first:
     T0 full: DPR cap 1.5 (1.25 small screens), full-res bloom, physical panes
     T1 DPR cap 1.25
     T2 bloom render targets at half resolution
     T3 panes swap physical transmission for the matcap-LUT glass (liquid,
        rims, etch and wake all stay; only the transmission pass goes)
     T4 DPR 1.0 + pane tessellation halved + ground-field sprite count down
   QA: ?tier=N pins a tier and disables adaptation; ?lag=N busy-waits N ms per
   composed frame; ?fps=1 gains a live tier field. */
var GOV = {
  applied: 0, pending: -1, forced: false,
  win: [], calmMs: 0, canUp: false, chain: false, hist: [],
  base: 17.5 /* the display's refresh interval, learned from the fastest frame seen */
};
(function(){
  var m = /^([0-4])$/.exec(new URLSearchParams(location.search).get('tier') || '');
  if (m) { GOV.forced = true; GOV.pending = +m[1]; }
})();
var LAGMS = (function(){ var m = /^(\d{1,3})$/.exec(new URLSearchParams(location.search).get('lag') || ''); return m ? +m[1] : 0; })();
function govDprCap(w){
  var base = (w < 800) ? 1.25 : 1.5;
  return GOV.applied >= 4 ? 1.0 : GOV.applied >= 1 ? Math.min(base, 1.25) : base;
}
function applyTier(n){
  if (n === GOV.applied) return;
  GOV.hist.push({ t: Math.round(performance.now()), from: GOV.applied, to: n });
  if (GOV.hist.length > 40) GOV.hist.shift();
  GOV.applied = n;
  /* panes: material (T3+) and tessellation (T4+). The rim shell shares the
     slab's geometry object so both swap together and stay aligned. */
  for (var gv = 0; gv < panes.length; gv++) {
    var gp = panes[gv];
    var gm = (n >= 3) ? gp.matLut : gp.matPhys;
    if (gp.mesh.material !== gm) {
      gm.envMapIntensity = gp.mesh.material.envMapIntensity; /* carry the intro/idle level over */
      gp.mesh.material = gm;
    }
    var gg = (n >= 4) ? gp.geoLo : gp.geoHi;
    if (gp.mesh.geometry !== gg) { gp.mesh.geometry = gg; gp.rim.geometry = gg; }
  }
  /* ground-field sprite count (T4+): drawRange, no rebuild */
  fieldGeo.setDrawRange(0, n >= 4 ? Math.floor(FIELD * 0.55) : Infinity);
  /* DPR: layout() re-derives the cap and resizes only if the ratio changed */
  layout();
  /* bloom render targets: half resolution from T2 up (layout covers resizes;
     this covers tier moves that leave the pixel ratio alone) */
  if (W > 0) {
    var bw = Math.round(W * PRC), bh = Math.round(H * PRC);
    if (n >= 2) { bw = Math.round(bw / 2); bh = Math.round(bh / 2); }
    bloom.setSize(bw, bh);
  }
}
function govFrame(dtMs){
  if (GOV.forced) {
    if (GOV.pending >= 0) { applyTier(GOV.pending); GOV.pending = -1; }
    return;
  }
  if (GOV.chain && !EXIT.on && !document.hidden) {
    GOV.win.push(dtMs);
    if (GOV.win.length > 30) GOV.win.shift();
    /* rAF is quantised to the display's refresh interval, so absolute millisecond
   thresholds below it can never be met: on a 60Hz panel every healthy frame is
   ~16.7ms and `dtMs <= 15` was never true. Learn the interval instead. */
    if (dtMs > 6 && dtMs < GOV.base) GOV.base = dtMs;
    var govUp = GOV.base * 1.12, govDown = GOV.base * 1.45;
    GOV.calmMs = dtMs <= govUp ? GOV.calmMs + dtMs : 0;
    if (GOV.win.length >= 30) {
      var srt = GOV.win.slice().sort(function(a, b){ return a - b; });
      var p90 = srt[27];
      /* A queued step must LAND before another is measured. This block used to
         read GOV.pending as "the current tier", so while the apply gate was shut
         it stacked: hovering a pane keeps the loop chaining (S.hold) but leaves
         the gate closed (scroll still, ground ripple ended by the pane hover,
         no card open), and each fresh window bumped pending again, 0->1->2->3->4
         with GOV.applied still 0. The next gate opening then applied FOUR tiers
         in a single frame against a stationary camera. Measured on an Arc 140V:
         160 pointer moves inside one pane, then one click -> hist [{from:0,to:4}].
         One step may be in flight at a time; the ladder still reaches T4, but
         only ever one visible increment at a time. */
      if (GOV.pending >= 0) { GOV.win.length = 0; GOV.calmMs = 0; }
      else {
        var curT = GOV.applied;
        if (p90 > govDown && curT < 4) {
          GOV.pending = curT + 1; GOV.win.length = 0; GOV.calmMs = 0; GOV.canUp = true;
        } else if (p90 < govUp && GOV.calmMs > 4000 && GOV.canUp && curT > 0) {
          GOV.pending = curT - 1; GOV.canUp = false; GOV.win.length = 0; GOV.calmMs = 0;
        }
      }
    }
  }
  /* apply only during motion, and never mid-ignition or mid-exit */
  if (GOV.pending >= 0 && !IW.on && !EXIT.on && cur < 0.85 &&
      (Math.abs(target - cur) > 0.0004 || GIX.busy || LOOK.weight > 0.0005)) {
    applyTier(GOV.pending); GOV.pending = -1;
    GOV.win.length = 0; GOV.calmMs = 0; /* the swap frame is not evidence about the next tier */
    /* the DPR/target resize just blanked the canvas backing store; govFrame runs
       AFTER the frame's present, so without this the blank canvas is what the
       visitor sees until the next rAF: one black flicker per tier step. Re-render
       in the same task so a blank frame is never presented. */
    composer.render();
  }
}

/* ---------- sizing / scroll span ---------- */
var W = 0, H = 0, PRC = 0, spanH = 0;
function layout(){
  var w = canvas.clientWidth || window.innerWidth;
  var h = canvas.clientHeight || window.innerHeight;
  if (document.hidden || w <= 0 || h <= 0) return; /* never size while hidden */
  var pfNow = portraitF(w / h);
  if (pfNow !== PF) { PF = pfNow; applyComposition(); } /* before copy stationing: #close depends on PF */
  var vh = Math.max(window.innerHeight, 500);      /* floor the scroll span */
  spanH = vh * 10;
  if (!reduced) {
    scrollEl.style.height = spanH + 'px';
    copyEls.forEach(function(c){
      if (c.el.id === 'close') {
        /* park through the finale: pinned from the approach to the film's
           last pixel, seated inside the arch aperture (portrait: lower,
           clear of the crown) */
        var t0c = Math.round(0.88 * (spanH - vh));
        c.hold.style.top = t0c + 'px';
        c.hold.style.height = (spanH - t0c) + 'px';
        c.el.style.top = (34 + 5.5 * PF) + 'vh';
      } else {
        /* the hold spans the beat's whole window: the block dwells mid-frame
           for its readable life instead of crossing the viewport once */
        c.hold.style.top = Math.round(c.p0 * (spanH - vh)) + 'px';
        c.hold.style.height = Math.round((c.p1 - c.p0) * (spanH - vh) + vh * 0.72) + 'px';
        c.el.style.top = '38vh';
      }
    });
  }
  var pr = Math.min(window.devicePixelRatio || 1, govDprCap(w));
  if (w === W && h === H && pr === PRC) return;
  W = w; H = h; PRC = pr;
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(pr);
  composer.setSize(w, h);
  if (GOV.applied >= 2) bloom.setSize(Math.round(w * pr / 2), Math.round(h * pr / 2));
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  fieldMat.uniforms.uPx.value = h * pr * 0.5;
}
if (GOV.forced && GOV.pending >= 0) { applyTier(GOV.pending); GOV.pending = -1; } /* ?tier=N pins before first sizing */
layout();

/* ---------- scroll + damping ---------- */
var target = 0, cur = 0;
var mx = 0, my = 0, smx = 0, smy = 0;
function readScroll(){
  var max = Math.max(1, spanH - window.innerHeight);
  target = clamp01((window.scrollY || 0) / max);
}

/* ---------- the film: everything derives from p ---------- */
var lastDrift = -1;
var lastTransit = -1;
var v3a = new T.Vector3(), v3b = new T.Vector3(), v3c = new T.Vector3();
/* while a card is open the scene is a backdrop: it eases toward quiet so the card
   and the wordmark stay legible; frames run continuously then (the card holds) */
var QUIET = 0;
function apply(p){
  var qT = document.body.classList.contains('card-open') ? 1 : 0;
  QUIET += (qT - QUIET) * 0.08;
  if (Math.abs(qT - QUIET) < 0.01) QUIET = qT;
  /* pulse radius: beat 2 */
  var pulseR = smooth(0.10, 0.335, p) * 195;
  edgeMat.uniforms.uPulse.value = pulseR;
  ringMat.uniforms.uPulse.value = pulseR;
  ringMat.uniforms.uAmp.value = smooth(0.10, 0.14, p) * (1 - smooth(0.30, 0.36, p));
  if (IW.on) ringMat.uniforms.uAmp.value *= IW.g;
  fieldMat.uniforms.uPulse.value = pulseR;
  fieldMat.uniforms.uP.value = p;
  var calm = 1 - 0.55 * QUIET;
  fieldMat.uniforms.uQuiet.value = calm;
  ringMat.uniforms.uQuiet.value = calm;
  /* the dark breath: mid-journey (p ~0.30-0.60) the ground ambience alone
     (grid, edge lines, dust, the spine's floor glow) eases 14% darker, then
     eases back, so the eye gets a rest between the ignition and the arch
     crescendos. Story beats are untouched: the gold leak dots, the brain-node
     floor spots (the ng channel), the spine head, the opening pulse ring's
     amplitude and the interaction rings all keep their full level. */
  var breath = 1 - 0.14 * smooth(0.30, 0.35, p) * (1 - smooth(0.55, 0.60, p));
  edgeMat.uniforms.uBreath.value = breath;
  ringMat.uniforms.uBreath.value = breath;
  fieldMat.uniforms.uBreath.value = breath;

  /* the world never fades: the ending is a transformation, not a crossfade */
  var fade = 1;

  /* node drift inward, beat 3 */
  var drift = smooth(0.34, 0.50, p) * 0.10;

  /* node colours. orbT/head: the comet's drawn tip, used by the COMET block
     further below. */
  var orbT = 0.15 + (ORB_T - 0.15) * smooth(0.02, 0.70, p);
  var head = orbT + (1.0 - ORB_T) * smooth(0.865, 0.975, p);
  for (var i = 0; i < N; i++) {
    var nd = nodes[i];
    var wk = IW.on ? wakeAt(nd.pos) : 1;
    var lit = smooth(nd.dist - 2, nd.dist + 4, pulseR);
    var b = 0.022 + lit * nd.glow * 0.55 * fade;
    /* gold leak dots retired (owner call): every node renders by its role. */
    {
      var brc = brainOf[i];
      if (brc) {
        /* a named dot: a faint floor so it is findable, a swell under the hand */
        b = Math.max(b, 0.055 * smooth(nd.dist - 2, nd.dist + 4, pulseR)) * (1 + brc.boost * 2.6);
        cTmp.copy(MINT).lerp(INKC, brc.boost * 0.35).multiplyScalar(b);
      } else {
        cTmp.copy(MINT).multiplyScalar(b);
      }
    }
    if (wk < 1) cTmp.multiplyScalar(wk);
    nodeMesh.setColorAt(i, cTmp);
    if (drift > 0) {
      var nds = (0.55 + nd.glow * 0.42) * (nd.brain ? 1.45 : 1);
      m4.makeScale(nds, nds, nds).setPosition(nd.pos.x * (1 - drift), nd.pos.y, nd.pos.z * (1 - drift));
      nodeMesh.setMatrixAt(i, m4);
    }
  }
  nodeMesh.instanceColor.needsUpdate = true;
  if (drift > 0) nodeMesh.instanceMatrix.needsUpdate = true;
  /* the lines, the floor contact spots, the hit targets and the DOM label
     anchors all drift WITH the dots: the network moves as one body */
  edgeMat.uniforms.uDrift.value = drift;
  ringMat.uniforms.uDrift.value = drift;
  if (drift !== lastDrift) {
    lastDrift = drift;
    for (var bi = 0; bi < brains.length; bi++) {
      var bnd = nodes[brains[bi].ni];
      brains[bi].wpos.set(bnd.pos.x * (1 - drift), bnd.pos.y, bnd.pos.z * (1 - drift));
      m4.makeTranslation(brains[bi].wpos.x, brains[bi].wpos.y, brains[bi].wpos.z);
      brainHits.setMatrixAt(bi, m4);
    }
    if (brains.length) brainHits.instanceMatrix.needsUpdate = true;
  }

  /* COMET: the orb creates the path. Pre-morph the drawn head IS the orb's curve
     parameter (nothing is ever drawn ahead of the orb); from morph start (~0.865)
     the head leaves the parked orb behind and stroke-draws the curl + arch while
     the orb glides to the dot. orbT is eased to arrive at ORB_T by p=0.70 so the
     trail has passed every leak stem before its dispatch window opens. */
  /* orbT/head are computed above the node colour pass: the leak dots gate on head. */
  /* INTENTIONAL (the head-turn beat): through p ~0.88-0.905 the drawn head runs
     AHEAD of the curve point nearest the gliding orb. The comet contract is
     pre-morph only; from morph start (0.865) the orb has left the curve for the
     dot while the head stroke-draws the curl, and the camera's gaze is mid-swing
     toward the arch, so the stroke visibly leading the light for that beat is
     the choreography, not a regression. Trace harnesses must not flag it. */
  if (DEBUG && p < 0.865 && head > orbT + 1e-6) console.warn('nv comet regression: drawn head ahead of orb', p, head, orbT);
  spineMat.uniforms.uHead.value = head;
  spineMat.uniforms.uTip.value = smooth(0.865, 0.895, p);
  var pw1 = clamp01((p - 0.06) / 0.24), pw2 = clamp01((p - 0.38) / 0.20), pw3 = clamp01((p - 0.62) / 0.20);
  spineMat.uniforms.uP.value.set(head * pw1, head * pw2, head * pw3);
  spineMat.uniforms.uPA.value.set(Math.sin(pw1 * Math.PI), Math.sin(pw2 * Math.PI), Math.sin(pw3 * Math.PI));
  spineMat.uniforms.uArchGlow.value = smooth(0.88, 0.985, p);
  spineMat.uniforms.uPark.value = smooth(0.978, 0.998, p); /* the head is parked; cool its below-baseline spill */

  /* the orb rides the spine, then glides into the mark's dot position: continuous, never faded */
  v3a.copy(spineCurve.getPointAt(clamp01(orbT)));
  orbPos.copy(v3a).lerp(DOT_POS, smooth(0.86, 0.965, p));
  orb.position.copy(orbPos);
  var orbScale = (0.55 + 0.45 * smooth(0.05, 0.5, p)) * (1 + 1.087 * smooth(0.87, 0.975, p)); /* the orb becomes the DOT: r 2.3 -> 4.8 = (24/130)*R */
  orb.scale.setScalar(orbScale);
  spineMat.uniforms.uOrbR.value = 2.3 * orbScale;
  orb.rotation.y = p * 3.2;

  /* flow, beat 5 draw: the inflow swirl. Envelope and clock are the only
     CPU work; everything else happens in the vertex shader. */
  var flowAmp = smooth(0.70, 0.76, p) * (1 - smooth(0.83, 0.89, p));
  flowGroup.visible = flowAmp > 0.01;
  if (flowGroup.visible) {
    flowMat.uniforms.uT.value = p * 12.0;
    flowMat.uniforms.uAmp.value = flowAmp * 0.7;
    flowMat.uniforms.uPx.value = renderer.domElement.height;
    for (var fsi = 0; fsi < flowStreamMats.length; fsi++) {
      flowStreamMats[fsi].uniforms.uT.value = p * 7.0;
      flowStreamMats[fsi].uniforms.uAmp.value = flowAmp;
    }
  }

  /* the mark resolves: highlight ramps while the spine head draws the arch */
  markMat.uniforms.uHighlight.value = smooth(0.86, 0.98, p);
  markMat.uniforms.uCameraY.value = camera.position.y;
  spineMat.uniforms.uCameraY.value = camera.position.y; /* neck matcap continuity */

  /* pane stations persist: they are the interface, they never fade */
  for (var pi = 0; pi < panes.length; pi++) {
    panes[pi].rim.material.uniforms.uCameraY.value = camera.position.y;
  }
  orbRim.material.uniforms.uCameraY.value = camera.position.y;

  /* camera */
  camera.position.copy(camCurve.getPoint(p));
  /* hot-pass containment: a close flyby dims the source and reins bloom in, so the
     glow stays luminous but never washes; at range (>=14.6 units) nothing changes */
  var dSp2 = 1e9;
  for (var si = 0; si < SPINE_SAMPLES.length; si++) {
    var dq = camera.position.distanceToSquared(SPINE_SAMPLES[si]);
    if (dq < dSp2) dSp2 = dq;
  }
  var dSp = Math.sqrt(dSp2);
  var dOrb = camera.position.distanceTo(orbPos);
  spineMat.uniforms.uDim.value = (0.35 + 0.65 * smooth(6.5, 14.6, dSp)) * (1 - 0.4 * QUIET);
  markMat.uniforms.uDim.value = (0.28 + 0.72 * smooth(6.5, 14.6, dOrb)) * (1 - 0.55 * QUIET);
  orbRim.material.uniforms.uFade.value = 0.18 * (0.4 + 0.6 * smooth(6.5, 14.6, dOrb)) * (1 - 0.55 * QUIET);
  if (IW.on) {
    markMat.uniforms.uDim.value *= IW.orb;
    orbRim.material.uniforms.uFade.value *= IW.orb;
  }
  /* a close rim shell covers the whole slab face at grazing angles and blooms white:
     fade it with proximity; at range (>=24 units) it is untouched */
  var dPnMin = 1e9;
  for (var pj = 0; pj < panes.length; pj++) {
    var dPn = camera.position.distanceTo(panes[pj].mesh.position);
    if (dPn < dPnMin) dPnMin = dPn;
    panes[pj].lq.phase.value = p * 42.0 + pj * 2.399; /* liquid phase: f(scroll, station) and nothing else */
    panes[pj].rim.material.uniforms.uFade.value = 0.08 + 0.92 * smooth(14, 30, dPn);
    panes[pj].etch.material.opacity = 0.42 * (0.30 + 0.70 * smooth(7, 16, dPn)) * (1 - 0.5 * QUIET);
    if (IW.on) {
      var pwk = wakeAt(panes[pj].anchor);
      panes[pj].rim.material.uniforms.uFade.value *= pwk;
      panes[pj].etch.material.opacity *= pwk;
      panes[pj].mesh.material.envMapIntensity = panes[pj].envBase * pwk;
      /* below this the slab carries no light of its own, yet physical transmission
         still silhouettes it against the ground; hold it out until the front arrives */
      panes[pj].mesh.visible = pwk > 0.004;
    }
  }
  var proxHot = Math.max(
    1 - smooth(6.5, 14.6, Math.min(dSp, dOrb)),
    (1 - smooth(14, 26, dPnMin)) * 0.8
  );
  bloom.strength = (1.0 - 0.5 * proxHot) * (1 - 0.45 * QUIET);
  bloom.radius = 0.85 - 0.3 * proxHot;
  v3a.copy(camCurve.getPoint(Math.min(1, p + 0.11)));
  /* mid-band: the look eases toward the drawn head so the spine stays clearly in
     frame through p 0.20-0.40 (persistent spine); zero outside the band */
  var wHead = smooth(0.20, 0.26, p) * (1 - smooth(0.34, 0.40, p)) * 0.5;
  if (wHead > 0.001) {
    v3b.copy(spineCurve.getPointAt(Math.min(head, ARCH_T)));
    v3a.lerp(v3b, wHead);
  }
  var wOrb = smooth(0.24, 0.44, p) * (1 - smooth(0.82, 0.93, p)) * 0.40;
  var wArch = smooth(0.82, 0.93, p);
  v3a.lerp(orbPos, wOrb);
  v3a.lerp(ARCH_TGT, wArch);
  /* camera position and look-at are pure functions of p (plus mouse parallax). */
  /* interaction layer look override (see NV_SCENE.look) */
  if (LOOK.target && LOOK.weight > 0.0005) v3a.lerp(LOOK.target, LOOK.weight);
  /* mouse parallax */
  camera.lookAt(v3a);
  v3b.setFromMatrixColumn(camera.matrix, 0); /* right */
  v3c.setFromMatrixColumn(camera.matrix, 1); /* up */
  camera.position.addScaledVector(v3b, smx * 1.6).addScaledVector(v3c, -smy * 0.9);
  camera.lookAt(v3a);

  /* transit veil: on the final approach the camera sweeps the bright arch glow
     directly behind the ending block while it rides to its parked framing; a
     soft local ink pool (see #close::before) rises under the copy for just that
     stretch so the block never drops below ~3:1 in transit. It is fully gone by
     p ~0.985, so every parked-state legibility number is untouched. */
  var transitV = smooth(0.925, 0.945, p) * (1 - smooth(0.970, 0.985, p));
  if (Math.abs(transitV - lastTransit) > 0.01 || (transitV === 0) !== (lastTransit === 0)) {
    lastTransit = transitV;
    copyEls[3].el.style.setProperty('--nv-transit', transitV.toFixed(3));
  }
  /* copy visibility */
  copyEls.forEach(function(c){
    var on = p >= c.p0 && p <= c.p1;
    if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); }
  });
  if ((p > 0.03) !== hintOff) { hintOff = p > 0.03; hint.classList.toggle('off', hintOff); }
}
var hintOff = false;

/* ---------- render on demand ---------- */
var rafId = 0, lastT = 0;
var DEBUG = new URLSearchParams(location.search).get('debug') === '1';
if (DEBUG) window.__nv = { frames: [], renders: 0, panes: null };
/* self-serve FPS probe, ?fps=1 only: a tiny mono corner readout of live fps,
   damped p and total composed frames, so a real scroll session on real hardware
   produces GPU evidence without tooling. When the param is absent FPSU stays
   null: no element is created and the per-frame branch never runs a body.
   It renders only inside tick(), so idle-zero behaviour is untouched (the
   readout simply freezes at the last composed frame's numbers). */
var FPSU = null;
if (new URLSearchParams(location.search).get('fps') === '1') (function(){
  var el = document.createElement('div');
  el.id = 'fpsProbe';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = 'position:fixed;right:10px;bottom:8px;z-index:6;pointer-events:none;' +
    'font:10px/1.5 ui-monospace,Consolas,monospace;letter-spacing:.08em;color:#5f8f7c;' +
    'text-shadow:0 1px 2px rgba(2,8,13,.9);text-align:right;opacity:.8';
  el.textContent = 'fps --';
  document.body.appendChild(el);
  var fr = [], renders = 0, lastUi = 0;
  FPSU = function(t, p){
    renders++;
    fr.push(t);
    while (fr.length > 40) fr.shift();
    if (t - lastUi < 250) return;
    lastUi = t;
    var fps = fr.length > 4 ? Math.round(1000 * (fr.length - 1) / (fr[fr.length - 1] - fr[0])) : 0;
    el.textContent = 'fps ' + fps + '  p ' + p.toFixed(3) + '  frames ' + renders + '  tier ' + GOV.applied;
  };
})();
/* ======== INTERACTION SEAM (stable, non-debug; for the pane-interaction layer) ========
   window.NV_SCENE = {
     panes: [{ id, title, t, mesh, rim, anchor }]
       - the six glass stations; anchor is the Vector3 world point to project for DOM
         labels; rim.material.uniforms.uBoost.value (0..1) brightens ONE pane's rim.
     raycastTargets: the pane meshes, ready for a THREE.Raycaster.
     spineCurve, orb, camera, renderer, canvas, T (the THREE namespace).
     look: { target: Vector3|null, weight: 0..1 }
       - apply() lerps the camera look toward target by weight each frame; the
         interaction layer eases weight itself (damped) and holds renders meanwhile.
     progress(): the damped scroll progress 0..1 (read-only).
     hold() / release(): reference-counted; while held the render loop keeps running
       (for card open/close animation). Always release at rest so idle GPU returns to zero.
     requestRender(): poke a single frame.
     frameHooks: push fn(p, camera, dt) - runs after apply() before each composed frame
       (for projecting anchors to screen space). Pop your hook when idle. } */
var LOOK = { target: null, weight: 0 };
var HOLDS = 0;
window.NV_SCENE = {
  panes: panes,
  raycastTargets: panes.map(function(pn){ return pn.mesh; }),
  brains: brains,
  brainHits: brainHits,
  spineCurve: spineCurve,
  camCurve: camCurve,
  orb: orb,
  camera: camera,
  renderer: renderer,
  canvas: canvas,
  T: T,
  look: LOOK,
  progress: function(){ return cur; },
  hold: function(){ HOLDS++; requestRender(); },
  release: function(){ if (HOLDS > 0) HOLDS--; },
  requestRender: requestRender,
  groundRipple: groundRipple,
  groundRippleEnd: groundRippleEnd,
  groundTap: groundTap,
  frameHooks: []
};
if (DEBUG) window.__nv.panes = panes;
if (DEBUG) window.__nv.applyP = function(pp){ apply(pp); };
/* ---------- ignition intro: the scan begins ---------- */
/* One-shot on a fresh load: the orb wakes first as a single point of light, then
   its light spreads radially (world distance from the orb) down the spine's
   visible start, across the constellation and out to the panes, until the p=0
   composition is fully lit. Time is accumulated dt, so a hidden tab pauses and
   resumes without doubling. The reveal is a wake factor multiplied into the
   existing emissive/dim channels (uniform-driven in the spine and edge shaders,
   per-object on the CPU side); it is never an opacity fade on objects and never
   a DOM veil. The camera is untouched: apply() stays a pure function of p.
   When the intro ends every factor is exactly 1 and IW.on is false, so the
   settled frame is the untouched p=0 composition and needMore() lets the loop
   stop: idle-zero holds after settle. */
var IW = { on: false, e: 0, rate: 1, orb: 0, g: 0, r: 0, ui: false, c: new T.Vector3() };
var WAKE_FEATHER = 42, WAKE_SPAN = 300, INTRO_SECS = 1.9;
function wakeAt(pos){
  if (!IW.on) return 1;
  var dx = pos.x - IW.c.x, dy = pos.y - IW.c.y, dz = pos.z - IW.c.z;
  return 1 - smooth(IW.r - WAKE_FEATHER, IW.r, Math.sqrt(dx * dx + dy * dy + dz * dz));
}
function setWakeUniforms(){
  var on = IW.on ? 1 : 0;
  var wms = [edgeMat, spineMat, fieldMat, ringMat];
  for (var wi = 0; wi < wms.length; wi++) {
    wms[wi].uniforms.uWakeOn.value = on;
    if (IW.on) {
      wms[wi].uniforms.uWakeC.value.copy(IW.c);
      wms[wi].uniforms.uWakeR.value = IW.r;
    }
  }
}
function finishIntro(instant){
  IW.on = false;
  setWakeUniforms();
  for (var fi = 0; fi < panes.length; fi++) {
    panes[fi].mesh.material.envMapIntensity = panes[fi].envBase;
    panes[fi].mesh.visible = true;
  }
  var de = document.documentElement;
  if (instant) {
    de.classList.remove('nv-intro');
    de.classList.remove('nv-on');
  } else {
    de.classList.add('nv-on');
    setTimeout(function(){ de.classList.remove('nv-intro'); de.classList.remove('nv-on'); }, 1300);
  }
}
function stepIntro(dt){
  if (!IW.on) return;
  IW.e += (dt / INTRO_SECS) * IW.rate;
  if (IW.e >= 1) { finishIntro(false); return; }
  IW.orb = smooth(0.0, 0.26, IW.e);  /* the orb ignites inside the first ~0.5s */
  IW.g = smooth(0.16, 1.0, IW.e);    /* then the light front leaves it */
  IW.r = IW.g * WAKE_SPAN;
  IW.c.copy(orb.position);           /* the light source is the orb itself */
  if (!IW.ui && IW.e > 0.52) { IW.ui = true; document.documentElement.classList.add('nv-on'); }
  setWakeUniforms();
}
if (DEBUG) { window.__nv.intro = IW; window.__nv.introFinish = finishIntro; }
/* ---------- ground interaction: pointer ripple + tap scan ----------
   Local events only, never a full-field light-up. Frames run only while an
   envelope is settling (GIX.busy); at rest every uniform is zero again and
   needMore() lets the loop stop: idle-zero holds after every touch. */
var GIX = { rp: new T.Vector3(0, 0, 9999), rpT: new T.Vector3(0, 0, 9999), rA: 0, rT: 0,
            tapP: new T.Vector3(0, 0, 9999), tapT: -1, tmr: 0, busy: false };
var TAP_SECS = 1.5, TAP_SPAN = 72;
function groundRipple(x, z){
  GIX.rpT.set(x, 0, z);
  if (GIX.rp.z > 9000) GIX.rp.copy(GIX.rpT);
  GIX.rT = 1;
  clearTimeout(GIX.tmr);
  GIX.tmr = setTimeout(function(){ GIX.rT = 0; requestRender(); }, 950);
  requestRender();
}
function groundRippleEnd(){
  clearTimeout(GIX.tmr);
  if (GIX.rT === 0 && GIX.rA === 0) return;
  GIX.rT = 0;
  requestRender();
}
function groundTap(x, z){
  if (EXIT.on) return; /* the exit ring owns the tap channels while it plays */
  GIX.tapP.set(x, 0, z);
  GIX.tapT = 0; /* a second tap replaces the first */
  requestRender();
}
function stepGround(dt){
  GIX.rA += (GIX.rT - GIX.rA) * Math.min(1, dt * 5);
  if (Math.abs(GIX.rT - GIX.rA) < 0.004) GIX.rA = GIX.rT;
  GIX.rp.lerp(GIX.rpT, Math.min(1, dt * 8));
  var tapA = 0, tapR = 0;
  if (GIX.tapT >= 0) {
    GIX.tapT += dt / TAP_SECS;
    if (GIX.tapT >= 1) GIX.tapT = -1;
    else {
      tapR = (1 - (1 - GIX.tapT) * (1 - GIX.tapT)) * TAP_SPAN;
      tapA = Math.sin(Math.min(1, GIX.tapT * 1.12) * Math.PI);
    }
  }
  GIX.busy = GIX.tapT >= 0 || Math.abs(GIX.rT - GIX.rA) > 0.004 ||
             (GIX.rA > 0.004 && GIX.rp.distanceToSquared(GIX.rpT) > 0.05);
  var gms = [fieldMat, ringMat];
  for (var gi = 0; gi < 2; gi++) {
    gms[gi].uniforms.uRip.value.copy(GIX.rp);
    gms[gi].uniforms.uRipA.value = GIX.rA;
    gms[gi].uniforms.uTap.value.copy(GIX.tapP);
    gms[gi].uniforms.uTapR.value = tapR;
    gms[gi].uniforms.uTapA.value = tapA;
  }
}
if (DEBUG) window.__nv.gix = GIX;
if (DEBUG) { window.__nv.gov = GOV; window.__nv.bloomPass = bloom; window.__nv.setLag = function(x){ LAGMS = x | 0; }; }
/* ---------- exit transition: the CTA's final scan pulse ----------
   One plain unmodified left-click (or plain keyboard Enter, which arrives as
   the same click) on a "Scan my business" link plays a ~1.15s exit flourish
   and then navigates to the link's real href:
     - the mark's dot flares first, and one last scan ring erupts from its
       base and sweeps outward through the ground grid and the dust field
       (the existing tap-ring shader channels, driven directly),
     - every edge and the bloom ramp toward hot mint; the flare deliberately
       exceeds normal luminance at the very end (it is an exit wash) but it
       RAMPS on one smooth crescendo, never a strobe,
     - the camera dollies gently forward along its own axis, through toward
       the arch, driven ONLY by this click's accumulated-dt clock, never by
       scene events (precedent: the pane-card look ease),
     - the composed frame washes toward the mint-white end of the LUT
       (uWash in the grain pass).
   Link honesty: the anchor keeps its real href at all times; modified
   clicks, middle clicks, right clicks and anything opening a new tab are
   never intercepted; a ~1.6s safety timeout navigates even if rendering
   stalls (hidden tab included), and a throw during start-up falls through
   to immediate navigation. Scroll is NOT preventDefault-ed during the
   window: apply(p) still runs and the overrides simply win until the page
   leaves - the one moment ignoring scroll is acceptable, because the page
   is exiting. The transition can only start from a real click on a CTA,
   so the trace harness's programmatic scrolls can never trigger it, and
   the dispatch choreography is untouched. */
var EXIT = { on: false, done: false, e: 0, href: '', safety: 0 };
var EXIT_SECS = 1.15;
function exitGo(){
  if (EXIT.done) return;
  EXIT.done = true;
  clearTimeout(EXIT.safety);
  location.href = EXIT.href;
}
function startExit(href){
  if (EXIT.on || EXIT.done) return;
  EXIT.href = href;
  EXIT.safety = setTimeout(exitGo, 1600); /* never strand the visitor */
  try {
    EXIT.on = true;
    EXIT.e = 0;
    /* the exit's final scan ring drives the SAME uTap/uTapR/uTapA channels as the
       interactive ground tap (stepExit runs after stepGround, so the exit wins).
       Zero any in-flight tap here, explicitly: from this moment the channels
       belong to the exit ring, and a tap mid-flourish must not fight it (see the
       matching guard in groundTap). */
    GIX.tapT = -1;
    document.documentElement.classList.add('nv-exit');
    requestRender(); /* hidden tab: no frames run, the safety timeout still navigates */
  } catch (err) {
    exitGo();
  }
}
function stepExit(dt){
  if (!EXIT.on || EXIT.done) return;
  EXIT.e += dt / EXIT_SECS; /* the click's own clock: accumulated dt only */
  var e = Math.min(1, EXIT.e);
  var out = 1 - (1 - e) * (1 - e) * (1 - e); /* easeOutCubic: the ring */
  var io = e * e * (3 - 2 * e);              /* smoothstep: camera + flare */
  var flare = io * io * io;                  /* late crescendo: the wash owns only the final act */
  /* the final scan ring: erupts from the mark's base, sweeps the world */
  var xms = [fieldMat, ringMat];
  for (var xi = 0; xi < 2; xi++) {
    xms[xi].uniforms.uTap.value.set(0, 0, 0);
    xms[xi].uniforms.uTapR.value = out * 215.0;
    xms[xi].uniforms.uTapA.value = Math.min(1, e * 5.0) * (1.0 + flare * 0.8);
  }
  /* everything flares toward hot mint (ramped, never a strobe) */
  edgeMat.uniforms.uFade.value = 1 + flare * 1.9;
  markMat.uniforms.uDim.value *= 1 + Math.sin(Math.min(1, e * 2.2) * Math.PI) * 0.55 + flare * 0.5; /* the dot pops first, breathes, then rejoins the final flare */
  bloom.strength += flare * 1.8; /* the exit wash may exceed normal luminance: it ramps */
  grainPass.material.uniforms.uWash.value = Math.pow(smooth(0.35, 1.0, e), 1.5) * 0.93;
  /* gentle push through/toward the arch: a pure dolly along the camera's own axis */
  camera.getWorldDirection(v3b);
  camera.position.addScaledVector(v3b, io * 24.0);
  if (e >= 1) exitGo();
}
if (DEBUG) window.__nv.exit = EXIT;
function needMore(){
  return EXIT.on || IW.on || HOLDS > 0 || GIX.busy || Math.abs(target - cur) > 0.00004 ||
         Math.abs(mx - smx) > 0.004 || Math.abs(my - smy) > 0.004;
}
function tick(t){
  rafId = 0;
  var dt = Math.min(0.05, Math.max(0.001, (t - lastT) / 1000));
  if (!(dt > 0)) dt = 0.016;
  lastT = t;
  if (LAGMS > 0) { var lagE = performance.now() + LAGMS; while (performance.now() < lagE) {} } /* ?lag=N QA throttle */
  /* chase with lerp AND a hard per-frame ceiling.
     Their ScrollController.LERP = 0.1 per frame at 60Hz, made framerate-independent. */
  var d = (target - cur) * (1 - Math.pow(0.9, dt * 60));
  var cap = dt * 0.34;
  if (d > cap) d = cap; else if (d < -cap) d = -cap;
  cur += d;
  if (Math.abs(target - cur) <= 0.00004) cur = target;
  cur = clamp01(cur);
  smx += (mx - smx) * Math.min(1, dt * 4);
  smy += (my - smy) * Math.min(1, dt * 4);
  /* an exponential never arrives, and needMore() keeps the entire film rendering
     until it does. Snap at the threshold needMore() tests so the chase ends in a
     frame instead of trailing the cursor for a second and a half. */
  if (Math.abs(mx - smx) < 0.004) smx = mx;
  if (Math.abs(my - smy) < 0.004) smy = my;
  markMat.uniforms.uTime.value = t * 0.001;
  spineMat.uniforms.uTime.value = t * 0.001; /* neck matcap continuity (sampled only while rendering: idle stays zero) */
  grainPass.material.uniforms.uTime.value = 1.0 + (t % 100000) * 0.001;
  stepIntro(dt);
  stepGround(dt);
  apply(cur);
  var fhs = window.NV_SCENE.frameHooks;
  for (var fh = 0; fh < fhs.length; fh++) { try { fhs[fh](cur, camera, dt); } catch (e) {} }
  stepExit(dt); /* exit overrides ride on top of the pure-p frame */
  composer.render();
  if (FPSU) FPSU(t, cur);
  if (DEBUG) {
    window.__nv.dbg = { cur: cur, target: target, dt: dt, spanH: spanH, cam: [camera.position.x, camera.position.y, camera.position.z], curveAt: (function(pp){var v=camCurve.getPoint(pp);return [v.x,v.y,v.z]})(clamp01(cur)) };
    window.__nv.renders++;
    window.__nv.frames.push(t);
    if (window.__nv.frames.length > 400) window.__nv.frames.splice(0, 100);
  }
  govFrame(dt * 1000);
  if (needMore()) { GOV.chain = true; rafId = requestAnimationFrame(tick); }
  else { GOV.chain = false; }
}
function requestRender(){
  if (reduced || rafId || document.hidden) return;
  lastT = performance.now();
  rafId = requestAnimationFrame(tick);
}

if (reduced) {
  /* the scroll region collapses: content starts immediately, no dead span */
  document.documentElement.classList.add('nv-rm');
  /* one static composed frame at the hero pulse moment, no loop */
  layout();
  readScroll();
  grainPass.material.uniforms.uTime.value = 7.3; /* intentional still film grain */
  apply(0.26);
  composer.render();
  copyEls.forEach(function(c){ c.el.classList.add('on'); });
} else {
  window.addEventListener('scroll', function(){
    readScroll();
    if (IW.on) {
      if (target > 0.05 && IW.e < 0.15) { finishIntro(true); } /* restored mid-journey scroll: skip */
      else if (IW.rate < 3.2) IW.rate = 3.2; /* the user is moving: run the wake out quickly, never block */
    }
    requestRender();
  }, { passive: true });
  window.addEventListener('mousemove', function(e){
    /* with a card open the camera is already under the look override and the
       pointer is on the card, not the world: parallax there is invisible motion
       that re-chains the render loop on every mouse event. */
    if (document.body.classList.contains('card-open')) return;
    mx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    my = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
    requestRender();
  }, { passive: true });
  window.addEventListener('resize', function(){ layout(); readScroll(); requestRender(); });
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    } else {
      layout(); requestRender();
    }
  });
  readScroll();
  cur = target;
  if (target <= 0.02 && !(DEBUG && new URLSearchParams(location.search).get('nointro') === '1')) {
    IW.on = true; /* reload mid-journey (target beyond ~2%) never sees the intro */
    document.documentElement.classList.add('nv-intro');
    if (DEBUG && new URLSearchParams(location.search).get('introhold') === '1') IW.rate = 0; /* measurement: freeze the first composed frame */
  }
  requestRender();
}

/* wire every "Scan my business" link: the ending CTA and the doc fallbacks
   all get the same exit flourish (see the exit transition block above) */
(function(){
  var scanLinks = Array.prototype.slice.call(document.querySelectorAll('a')).filter(function(a){
    return /scan my business/i.test(a.textContent || '');
  });
  scanLinks.forEach(function(a){
    a.addEventListener('click', function(ev){
      /* plain unmodified left activation only; anything that opens a new tab
         or a menu keeps the browser's own link behaviour (href is real and
         untouched). Plain keyboard Enter arrives as this same click event
         (button 0, no modifiers) and plays the same transition. */
      if (ev.defaultPrevented) return;
      if (ev.button !== 0 || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.altKey) return;
      if (reduced) return; /* reduced motion: native navigation, immediately, no transition */
      ev.preventDefault();
      try { startExit(a.href); } catch (err) { location.href = a.href; }
    });
  });
})();
})();
