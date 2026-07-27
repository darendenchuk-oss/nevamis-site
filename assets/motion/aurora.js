/* ============================================================
   NEVAMIS AURORA
   Northern lights behind the page, built to hold up against the
   real thing (reference: Fort Yukon, Alaska timelapse).

   The sky is a WebGL fragment shader: domain-warped fractal noise
   stretched vertically into silk-like ray curtains, with a sharp
   bright lower edge, tall soft falloff, folds, and a magenta
   fringe that appears with altitude — the physics-shaped look a
   2D canvas cannot fake. Rendered at reduced resolution and
   stretched by CSS; a lightweight 2D painter remains as the
   automatic fallback when WebGL is unavailable.

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

/* The curtain is integrated as stacked filament slices marching upward,
   each sheared a little more than the last — folds and bright vertical
   streaks emerge where slices bunch, exactly how a real curtain drapes. */
vec4 aurora(vec2 uv, float f){
  vec4 acc = vec4(0.0);

  // serpentine: the whole curtain squiggles up and down over time,
  // even when the visitor is not scrolling
  float wig = sin(uv.x * 3.1 + uTime * 0.50 + uFlow * 1.5) * 0.050
            + sin(uv.x * 1.3 - uTime * 0.31) * 0.040
            + sin(uTime * 0.23 + uv.x * 0.7) * 0.030;

  // vertical striation field, shared by every slice; the warp domain is
  // rotated off-axis so no noise lattice ever lines up with the screen
  vec2 wq = mat2(0.955, -0.296, 0.296, 0.955) * vec2(uv.x * 2.4 + f * 0.3, uv.y * 1.2 - f * 0.06);
  float warp = fbm(wq) * 2.0;
  float rays = fbm(vec2(uv.x * 15.0 + warp, uv.y * 0.38 - f * 0.14));
  rays = 0.28 + 0.72 * pow(smoothstep(0.22, 0.9, rays), 1.5);

  // Three anchor drapes, interpolated across all slices — the folds survive
  // at a fifth of the per-pixel noise cost of sampling every slice.
  float shear = 0.60 + uEnergy * 0.35;
  float bx = uv.x * 1.9 + f * 0.22 + uProg * 1.7;
  float s0 = fbm(vec2(bx,               f * 0.05));
  float s1 = fbm(vec2(bx + shear * 0.5, f * 0.05 + 0.03));
  float s2 = fbm(vec2(bx + shear,       f * 0.05 + 0.06));

  for (int i = 0; i < 18; i++){
    float layer = float(i) / 18.0;

    float shape = layer < 0.5
      ? mix(s0, s1, layer * 2.0)
      : mix(s1, s2, layer * 2.0 - 1.0);

    // rises from near the bottom of the sky to past the top of the frame —
    // the curtain owns the whole screen, like standing under it
    float yEdge = 0.16 + wig + shape * 0.42 + layer * (0.52 + uEnergy * 0.15);
    float d = uv.y - yEdge;
    // bright streaks are also the long ones — glow reaches higher where a ray is
    float glow = exp(-abs(d) * (30.0 - 12.0 * rays));

    // green core low, teal mid, a restrained violet crown — the real ramp
    vec3 cLow  = vec3(0.14, 0.98, 0.46);
    vec3 cMid  = vec3(0.13, 0.66, 0.56);
    vec3 cTop  = vec3(0.46, 0.22, 0.52);
    vec3 c = mix(cLow, cMid, smoothstep(0.05, 0.6, layer));
    c = mix(c, cTop, smoothstep(0.65, 1.0, layer));

    float w = (1.0 - layer * 0.38) * 0.17;
    acc.rgb += c * glow * w;
    acc.a   += glow * (1.0 - layer * 0.25) * 0.14;

    // the lowest slice gets a bright mint rim — the curtain's sharp edge
    if (i == 0){
      float rim = exp(-abs(d) * 60.0);
      acc.rgb += vec3(0.65, 0.97, 0.82) * rim * 0.5;
      acc.a   += rim * 0.28;
    }
  }

  acc *= rays;
  return acc;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;            // y up
  float f = uTime * 0.10 + uFlow;

  vec4 a = aurora(uv, f);
  // the faintest breath of horizon glow, so the void is not flat black
  float hg = exp(-abs(uv.y - 0.12) * 10.0) * 0.05;

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
    { baseY: 0.44, swoop: 22, len: 100, alpha: 0.34, speed: 0.55, xOff: 140, strip: makeStrip(false) },
    { baseY: 0.62, swoop: 30, len: 80, alpha: 0.8, speed: 1, xOff: 0, strip: makeStrip(true) },
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
          const bottom = baseY
            + Math.sin(u * 0.011 + ph * 0.42) * c.swoop
            + Math.sin(u * 0.027 - ph * 0.19) * c.swoop * 0.35
            + tilt * (x - W / 2);
          const clump = 0.5 + 0.5 * Math.sin(u * 0.09 + ph * 0.8) * Math.sin(u * 0.023 - ph * 0.33);
          const stria = 0.72 + 0.28 * Math.sin(u * 0.9 + ph * 1.2);
          const len = c.len * (0.45 + clump * 0.8) * (1 + energy * 0.5);
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
