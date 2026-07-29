/* ============================================================
   NEVAMIS AURORA
   Northern lights behind the page, built to hold up against the
   real thing (reference: Fort Yukon, Alaska timelapse).

   The sky is a WebGL fragment shader: domain-warped fractal noise
   drawn as vertical ray columns, each with its own reach, so the
   light ends in a ragged comb of bright feet and long soft tails
   climbing the page — the physics-shaped look a 2D canvas cannot
   fake. Deliberately NOT a horizontal curtain: one drape height
   shared across the width reads as a line ruled through the page.
   Rendered at reduced resolution and stretched by CSS; a
   lightweight 2D painter remains as the automatic fallback when
   WebGL is unavailable.

   The sky answers the visitor: scroll velocity feeds energy into
   brightness and ray height, and scroll direction sets the drift.
   Reduced motion / motion-off: one still frame, no loop.
   ============================================================ */

import { prefersReduced, onVisibility } from './tokens.js';

const FRAG = `
precision mediump float;
uniform vec2  uRes;
uniform float uTime;    // seconds, slow
uniform float uFlow;    // scroll-signed accumulated drift
uniform float uEnergy;  // 0 calm .. 1 storm
uniform float uProg;    // page scroll progress 0..1

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i),                 hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y);
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  mat2 R = mat2(0.796, -0.605, 0.605, 0.796);   // ~0.65 rad — decorrelates octaves
  for (int i = 0; i < 3; i++){
    v += a * vnoise(p);
    p = R * p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v * 1.14;   // renormalize the missing octave
}

/* The curtain stands in vertical columns. Every filament is its own ray with
   its own reach, so the light ends in a ragged comb of feet at different
   heights. The previous build shared one drape height across the whole
   width, which is what drew a hard horizontal line through the page —
   the giveaway was a flat alpha profile that jumped at a single row. */
vec4 aurora(vec2 uv, float f){
  vec4 acc = vec4(0.0);

  // Sway, not squirm: the curtain leans and drifts sideways over time
  // instead of rippling up and down.
  float sway = sin(uv.y * 2.7 + uTime * 0.44 + uFlow * 1.2) * 0.045
             + sin(uv.y * 1.1 - uTime * 0.27) * 0.034
             + sin(uTime * 0.19 + uv.y * 0.5) * 0.022;

  // Striation field: high frequency across x, slow along y, so every streak
  // runs top to bottom. The warp domain is rotated off-axis so no noise
  // lattice ever lines up with the screen.
  vec2 wq = mat2(0.955, -0.296, 0.296, 0.955) * vec2(uv.x * 2.4 + f * 0.30, uv.y * 1.2 - f * 0.06);
  float warp = fbm(wq) * 2.0;
  float rays = fbm(vec2((uv.x + sway) * 16.0 + warp, uv.y * 0.30 - f * 0.12));
  rays = 0.22 + 0.78 * pow(smoothstep(0.20, 0.90, rays), 1.5);

  // How far down each column reaches. Sampled at a HIGH x frequency (7.0,
  // where the old drape used 1.9) and interpolated across the slices, so
  // neighbouring columns end at unrelated heights and no shared edge can
  // form. Three anchors keep this at a fifth of the cost of sampling per
  // slice.
  float spread = 0.55 + uEnergy * 0.30;
  float bx = (uv.x + sway * 0.6) * 7.0 + f * 0.20 + uProg * 1.1;
  float s0 = fbm(vec2(bx,                f * 0.05));
  float s1 = fbm(vec2(bx + spread * 0.5, f * 0.05 + 0.03));
  float s2 = fbm(vec2(bx + spread,       f * 0.05 + 0.06));

  // Colour by height rather than by slice: green at the feet, teal through
  // the body, a restrained violet where the rays run off the top. Hoisted
  // out of the loop — with vertical columns it no longer varies per slice.
  vec3 c = mix(vec3(0.14, 0.98, 0.46), vec3(0.13, 0.66, 0.56), smoothstep(0.02, 0.50, uv.y));
  c = mix(c, vec3(0.46, 0.22, 0.52), smoothstep(0.58, 1.05, uv.y));

  for (int i = 0; i < 18; i++){
    float layer = float(i) / 18.0;

    float shape = layer < 0.5
      ? mix(s0, s1, layer * 2.0)
      : mix(s1, s2, layer * 2.0 - 1.0);

    // The foot of this filament. Bright rays are also the long ones, so the
    // reach is tied to the striation field as well as the drape — that is
    // what keeps the comb ragged at fine scale, not just wavy.
    float foot = 0.06 + shape * 0.34 + rays * 0.20 + layer * (0.20 + uEnergy * 0.12);
    float d = uv.y - foot;

    /* Sharp underneath the foot, tail climbing the page — bright rays reach
       further than dim ones. The tail is an order of magnitude wider than
       the old band's, so the weights below are cut to match: measured flat,
       the same slice count would otherwise sit ~2.5x brighter and wash out
       the text in front of it. */
    float glow = exp(-max(-d, 0.0) * 34.0) * exp(-max(d, 0.0) * (7.6 - 3.4 * rays));

    float w = (1.0 - layer * 0.38) * 0.105;
    acc.rgb += c * glow * w;
    acc.a   += glow * (1.0 - layer * 0.25) * 0.072;

    // the bright mint feet of the nearest columns
    if (i == 0){
      float rim = exp(-abs(d) * 46.0);
      acc.rgb += vec3(0.65, 0.97, 0.82) * rim * 0.42;
      acc.a   += rim * 0.24;
    }
  }

  acc *= rays;
  return acc;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;            // y up
  float f = uTime * 0.10 + uFlow;

  vec4 a = aurora(uv, f);
  // The faintest floor wash so the void is not flat black. A gradient, not
  // the old exp() band centred on y=0.12 — a band peaks at one row, which
  // is a horizontal line by another name.
  float hg = smoothstep(0.55, 0.0, uv.y) * 0.05;

  vec3 col  = a.rgb + vec3(0.05, 0.30, 0.24) * hg;
  float lum = a.a + hg;

  // soft filmic roll-off — bright folds glow, nothing plateaus or clips
  float master = 1.0 + uEnergy * 0.4;
  vec3 mapped  = col * master;
  mapped = mapped / (1.0 + mapped * 0.55) * 1.18;
  float alpha  = 0.93 * (1.0 - exp(-lum * master * 1.15));
  gl_FragColor = vec4(mapped, alpha);
}
`;

const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export function initAurora() {
  const reduce = prefersReduced();

  const canvas = document.createElement('canvas');
  canvas.id = 'aurora';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100svh;z-index:0;pointer-events:none;opacity:.9;';
  document.body.prepend(canvas);

  const gpu = initShader(canvas);
  const painter = gpu || init2DFallback(canvas);

  let flow = 0;             // drift — sign follows scroll direction
  let energy = 0;           // fed by scroll velocity
  let lastY = window.scrollY;
  let lastT = performance.now();
  let velSmooth = 0;
  let running = false;
  let rafId = 0;
  let t0 = performance.now();

  function prog() {
    const range = document.documentElement.scrollHeight - innerHeight;
    return range > 0 ? window.scrollY / range : 0;
  }
  function paint(timeSec) { painter.paint(timeSec, flow, energy, prog()); }

  if (reduce) {
    energy = 0.12;
    flow = 2.4;               // a flattering fixed pose
    painter.resize();
    paint(40);
    return { canvas, static: true };
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const dt = Math.min(50, now - lastT) / 1000;
    lastT = now;

    const y = window.scrollY;
    const vel = (y - lastY) / Math.max(dt, 0.001);   // px/s, signed
    lastY = y;
    velSmooth += (vel - velSmooth) * 0.08;

    energy += ((Math.min(Math.abs(velSmooth) / 2200, 1)) - energy) * 0.05;
    flow += dt * (0.10 + energy * 0.9) * (velSmooth < -40 ? -1 : 1);

    paint((now - t0) / 1000);
  }

  function start() {
    if (running) return;
    running = true;
    lastT = performance.now();
    lastY = window.scrollY;
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  painter.resize();
  window.addEventListener('resize', () => painter.resize());
  start();
  onVisibility((visible) => { visible && !halted() ? start() : stop(); });

  function halted() { return document.documentElement.classList.contains('motion-off'); }

  // the site-wide motion toggle also stills the sky
  const toggle = document.querySelector('.motion-toggle-btn');
  if (toggle) {
    toggle.addEventListener('click', () => {
      requestAnimationFrame(() => {
        if (halted()) { stop(); energy = 0.12; flow = 2.4; paint(40); }
        else start();
      });
    });
  }

  return { canvas, start, stop, mode: gpu ? 'webgl' : '2d' };
}

/* ------------------------------------------------------------ */

function initShader(canvas) {
  try {
    // preserveDrawingBuffer keeps toDataURL meaningful for the test harness;
    // at this resolution the cost is negligible.
    const gl = canvas.getContext('webgl', {
      alpha: true, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: true, preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    if (!gl) return null;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed');
      }
      return s;
    }
    const prg = gl.createProgram();
    gl.attachShader(prg, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prg, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prg);
    if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prg) || 'link failed');
    }
    gl.useProgram(prg);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prg, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prg, 'uRes'),
      time: gl.getUniformLocation(prg, 'uTime'),
      flow: gl.getUniformLocation(prg, 'uFlow'),
      energy: gl.getUniformLocation(prg, 'uEnergy'),
      prog: gl.getUniformLocation(prg, 'uProg'),
    };

    // premultiplied-alpha "over" so the navy page shows through calm sky
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    return {
      resize() {
        // reduced resolution reads soft and organic, and stays cheap everywhere
        const w = Math.min(Math.round(innerWidth * 0.45), 860);
        const h = Math.max(1, Math.round(w * (innerHeight / Math.max(innerWidth, 1))));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w; canvas.height = h;
        }
        gl.viewport(0, 0, w, h);
      },
      paint(t, flow, energy, prog) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(U.res, canvas.width, canvas.height);
        gl.uniform1f(U.time, t);
        gl.uniform1f(U.flow, flow);
        gl.uniform1f(U.energy, energy);
        gl.uniform1f(U.prog, prog);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  } catch (e) {
    console.warn('[aurora] WebGL unavailable, using 2D fallback:', e && e.message);
    return null;
  }
}

/* ------------------------------------------------------------
   2D fallback: the strip-ray painter. Not as silky as the
   shader, but honest, cheap, and better than nothing.
   ------------------------------------------------------------ */

function init2DFallback(canvas) {
  const W = 240, H = 160;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  function makeStrip(withMagenta) {
    const s = document.createElement('canvas');
    s.width = 1; s.height = 256;
    const g = s.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0.00, 'rgba(214,82,150,0)');
    gr.addColorStop(0.18, withMagenta ? 'rgba(214,82,150,0.15)' : 'rgba(47,191,143,0.05)');
    gr.addColorStop(0.38, withMagenta ? 'rgba(186,96,166,0.22)' : 'rgba(47,191,143,0.13)');
    gr.addColorStop(0.62, 'rgba(47,191,143,0.36)');
    gr.addColorStop(0.90, 'rgba(96,235,152,0.7)');
    gr.addColorStop(0.975, 'rgba(196,255,220,0.9)');
    gr.addColorStop(1.00, 'rgba(120,240,180,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 1, 256);
    return s;
  }

  const CURTAINS = [
    { baseY: 0.52, swoop: 30, len: 108, alpha: 0.34, speed: 0.55, xOff: 140, strip: makeStrip(false) },
    { baseY: 0.74, swoop: 38, len: 92, alpha: 0.8, speed: 1, xOff: 0, strip: makeStrip(true) },
  ];

  return {
    resize() { /* fixed internal resolution */ },
    paint(t, flow, energy, prog) {
      const phase = t * 0.45 + flow;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const tilt = Math.sin(phase * 0.11 + prog * Math.PI) * 0.13;

      CURTAINS.forEach((c, ci) => {
        const ph = phase * c.speed;
        const baseY = H * c.baseY + Math.sin(prog * Math.PI * 2 + ci * 2.3) * 10;
        for (let x = 0; x < W; x += 2) {
          const u = x + c.xOff;
          /* Per-column foot height. The high-frequency `comb` term dominates
             the slow swoop on purpose: strips that all end on one smooth
             curve read as a horizontal band, which is the exact look the
             shader above was rewritten to get rid of. */
          const comb = Math.sin(u * 0.37 + ph * 0.7) * Math.sin(u * 0.14 - ph * 0.31);
          const bottom = baseY
            + comb * c.swoop
            + Math.sin(u * 0.011 + ph * 0.42) * c.swoop * 0.30
            + tilt * (x - W / 2) * 0.4;
          const clump = 0.5 + 0.5 * Math.sin(u * 0.09 + ph * 0.8) * Math.sin(u * 0.023 - ph * 0.33);
          const stria = 0.72 + 0.28 * Math.sin(u * 0.9 + ph * 1.2);
          // reach varies per column too, so the tops stay ragged as well
          const len = c.len * (0.35 + clump * 0.95 + Math.abs(comb) * 0.4) * (1 + energy * 0.5);
          const a = c.alpha * (0.3 + clump * 0.7) * stria * (0.75 + energy * 0.45);
          if (a < 0.02) continue;
          ctx.globalAlpha = Math.min(1, a);
          ctx.drawImage(c.strip, x, bottom - len, 2.2, len);
        }
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}
