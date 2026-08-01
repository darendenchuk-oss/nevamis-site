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
precision highp float;
uniform vec2  uRes;
uniform float uTime;    // seconds, slow
uniform float uFlow;    // scroll-signed accumulated drift
uniform float uEnergy;  // 0 calm .. 1 storm
uniform float uProg;    // page scroll progress 0..1

/* PRECISION IS NOT A DETAIL HERE. The old hash was
   fract(sin(dot(p, k)) * 43758.5453) under "precision mediump float", and
   that combination is the single biggest reason the sky looked grainy: at
   mediump, sin() of a large argument multiplied by 43758 discards most of
   the mantissa, so neighbouring pixels that should differ smoothly land on
   quantized buckets instead. The result is speckle that no amount of
   blurring downstream can remove. Hoskins' hash12 needs no sin and stays
   well-conditioned, and the file now asks for highp. */
float hash(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(hash(i),                 hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y);
}

/* Deliberately top-heavy. Aurora light is milky: almost all of its energy
   is in large soft structure, with only a whisper of fine detail. The old
   0.5 gain gave the third octave far too much say, which is grain by
   another name. 0.42 with a shorter lacunarity step keeps the octaves close
   together so they blend instead of stippling.

   Dividing by the summed amplitude normalizes to a true 0..1 rather than
   relying on a hand-tuned fudge factor, so the smoothstep windows below
   mean what they say. */
float fbm(vec2 p){
  float v = 0.0, a = 0.58, s = 0.0;
  mat2 R = mat2(0.796, -0.605, 0.605, 0.796);   // ~0.65 rad — decorrelates octaves
  for (int i = 0; i < 3; i++){
    v += a * vnoise(p);
    s += a;
    p = R * p * 1.94 + vec2(17.0, 9.2);
    a *= 0.42;
  }
  return v / s;
}

/* ONE CURTAIN.

   A real aurora is a ribbon, not a field of bars. Its centreline snakes
   left and right as it climbs, it pleats and folds along its length, and
   the light is never still: folds travel sideways, shimmer runs UP the
   filaments, and brightness surges climb the curtain like something moving
   through it.

   The previous build dissolved the ribbon into independent vertical
   columns. That killed the horizontal edge it was written to kill, but it
   also threw away the coherent structure that makes the thing read as an
   aurora at all — it looked like grass. The ribbon is back; it just runs
   up the sky instead of across it, so there is no edge to draw a line.

   Returns luminance only. Colour is by height, decided once in main(),
   which is both cheaper and more correct: the ramp is an atmospheric fact
   about altitude, not a property of any one curtain. */
float curtain(vec2 uv, float t, float seed, float depth){
  float y = uv.y;

  /* Serpentine centreline: three octaves at different rates, so the folds
     travel and the pattern never visibly repeats. This is the slowest
     motion in the shader on purpose — the overall shape of an aurora
     drifts over tens of seconds while its filaments flicker.

     SHALLOWER AND MORE OFTEN than the first version. At amplitude 0.150 over
     a frequency of 1.9, the ribbon completes barely a third of a period
     across the frame — so it did not snake at all, it LEANED, one long
     diagonal sweep corner to corner. That is why the sky read as brushed
     swooshes: a curtain hangs, it does not slant across the whole sky.

     Only the FREQUENCIES moved. Amplitude governs how many pixels the
     centreline travels per second, and phones were reported as already right,
     so cutting amplitude would have slowed the one viewport that did not need
     slowing. Frequency changes the shape without touching the rate: the
     temporal term is untouched, so a given row sways exactly as far and as
     fast as before — it just belongs to a ribbon that undulates rather than
     one that slants. Desktop is calmed by the clock instead. */
  float cx = 0.5 + depth
    + sin(y * 2.5 + t * 0.40 + seed) * 0.140
    + sin(y * 4.3 - t * 0.29 + seed * 2.3) * 0.074
    + sin(y * 7.6 + t * 0.21 + seed * 4.1) * 0.034;

  /* Pleating: the ribbon breathes wider and narrower along its length.
     Narrowed from 0.105/0.045: five ribbons that wide overlapped into
     near-continuous cover, and a sky with no dark in it does not read as
     night. Real aurora is a bright ribbon surrounded by black. */
  float w = 0.086 + 0.036 * sin(y * 3.9 - t * 0.50 + seed * 1.7) + uEnergy * 0.026;

  float d = (uv.x - cx) / w;
  float band = exp(-d * d * 0.9);
  if (band < 0.004) return 0.0;   // outside this ribbon: skip the noise

  /* Filaments. The sample point climbs with time, so the shimmer runs up the
     curtain — the strongest single cue that this is an aurora and not a
     gradient.

     Sampled MOSTLY across the ribbon (d), but with a slice of screen-x mixed
     in. Pure d leans every striation along the fold, which is what made the
     sky read as brushed fabric; pure screen-x stands them up but smears the
     fold, which is why it was abandoned earlier. Real rays follow magnetic
     field lines, so they stand up the frame while still belonging to their
     fold — the blend is the only way to get both.

     Pushed to 0.45 and stretched further along y: fewer, longer, more upright
     filaments. Tight cross-frequency over a leaning ribbon was the streaky
     "brushed" texture; broad slow filaments standing up the frame is what a
     curtain looks like. */
  float rx = mix(d, (uv.x - 0.5) / w, 0.45);
  float ray = fbm(vec2(rx * 4.2 + seed * 9.0, y * 0.30 - t * 0.62));
  /* A wider window than 0.30/0.74. That narrow pair stretched the middle of
     the noise across the whole output range, multiplying every wobble into
     visible mottling — contrast-stretched noise IS the grain. Widening it
     and lifting the floor keeps the filaments legible but milky. */
  ray = 0.30 + 0.70 * smoothstep(0.18, 0.90, ray);

  // Surges travelling up the ribbon.
  float surge = 0.74 + 0.38 * sin(y * 3.0 - t * 1.15 + seed * 3.0);

  /* Reaches past the top of the frame: a curtain that stops short looks like
     a decal, and its end is another edge that can read as a line.

     The second term dims the lowest sliver. Without it every ribbon runs
     straight off the bottom at full brightness and they overlap into a pale
     haze along the floor — curtains hang above the horizon, they do not
     pool on it.

     Each ray also runs out at its OWN height, so the curtain ends in a torn
     comb rather than one uniform fade. A single shared ceiling is a soft
     horizontal edge, and this file exists to keep horizontal edges out. */
  float top = 1.28 + 0.40 * fbm(vec2(rx * 1.3 + seed * 3.7, 3.1));
  float fade = smoothstep(top, -0.25, y) * smoothstep(-0.10, 0.18, y);

  return band * ray * surge * fade;
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;            // y up
  float t = uTime * 0.55 + uFlow * 2.0;

  /* Five ribbons at different depths and rates. The parallax is what gives
     the sky depth; three left the frame visibly empty in the gaps, and one
     alone reads as a decal.

     Depths spread wider than before (-0.44 .. 0.56 rather than -0.36 .. 0.48)
     so the gaps between ribbons survive. Narrower ribbons at the old spacing
     just moved the overlap around; the sky needs actual black in it. */
  float l = curtain(uv, t,         0.0, -0.44) * 0.76
          + curtain(uv, t * 0.86,  2.7, -0.19) * 0.92
          + curtain(uv, t * 1.07,  5.3,  0.06) * 1.00
          + curtain(uv, t * 0.93,  8.1,  0.31) * 0.84
          + curtain(uv, t * 1.19, 11.4,  0.56) * 0.64;

  /* The emission ramp by altitude: 557.7nm oxygen green through the body,
     teal higher, a violet crown where the rays run out. */
  vec3 col = mix(vec3(0.16, 1.00, 0.50), vec3(0.18, 0.78, 0.70), smoothstep(0.34, 0.70, uv.y));
  col = mix(col, vec3(0.44, 0.30, 0.82), smoothstep(0.72, 1.10, uv.y));

  /* The nitrogen fringe, gated on BRIGHTNESS as well as height. As a
     function of height alone it painted a solid magenta bar edge to edge
     across the bottom of the frame — the ribbons are widest and brightest
     down there, so they overlap into continuous cover, and the result was
     the exact horizontal line this file exists to avoid. Gating on l puts
     the pink only where a curtain actually is, so the filaments break it up. */
  float fringe = smoothstep(0.40, 0.05, uv.y) * smoothstep(0.16, 0.55, l);
  col = mix(col, vec3(0.94, 0.28, 0.58), fringe * 0.72);

  // The faintest floor wash so the void is not flat black. A gradient, never
  // a band: a band peaks at one row, which is a horizontal line by another
  // name — the bug this file was rewritten to fix.
  float hg = smoothstep(0.45, 0.0, uv.y) * 0.035;

  /* Soft roll-off on LUMINANCE, not per channel. Per channel it compresses
     the bright green toward the weaker red and blue, so every bright fold
     drifted grey-white — the aurora looked like fog. Rolling off luminance
     and rescaling keeps the hue at the top end, which is where it matters. */
  float master = 0.70 + uEnergy * 0.55;
  vec3 mapped = col * (l * master) + vec3(0.05, 0.30, 0.24) * hg;
  float lum = dot(mapped, vec3(0.299, 0.587, 0.114));
  mapped *= lum > 0.0005 ? (lum / (1.0 + lum * 0.60) * 1.20) / lum : 0.0;

  /* Pull the chroma back up. Overlapping ribbons and the green-to-pink blend
     both trend grey, and the canvas then sits at 90% over a navy page, which
     mutes it further — the result read as sage, not aurora. Extrapolating
     away from luminance (a mix factor above 1) restores the bite.

     Eased from 1.35 to 1.22: extrapolating chroma amplifies the DIFFERENCES
     between channels, and noise is a difference between channels, so the old
     value was quietly boosting the grain along with the colour. */
  mapped = max(mix(vec3(lum), mapped, 1.22), 0.0);
  float alpha = 0.92 * (1.0 - exp(-(l * master + hg) * 1.5));
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
  let clock = 0;            // shader time, advanced at the viewport's own rate

  /* WHY DESKTOP NEEDED SLOWING DOWN.

     Every horizontal figure in the shader is a fraction of UV width: the
     centreline sways +/-0.15, so it travels 0.15 * viewport width pixels. At
     375px that is 56px; at 1440px it is 216px — the SAME shader, at nearly
     four times the pixel speed. Phones looked calm and desktops looked busy,
     which is exactly the report.

     Scaling the clock by viewport width fixes it at the source. The inverse
     square root, rather than a true 1/width, is a deliberate compromise:
     matching pixel speed exactly would run desktop at ~0.26 and the sky
     would read as frozen. This lands near half speed on a laptop while
     leaving phones untouched, since the reference width sits below any phone.

     Time is ACCUMULATED rather than derived from a start stamp, so a resize
     across breakpoints changes the rate without jumping the animation. */
  const SPEED_REF = 430;    // px; at or below this the rate is 1.0
  function speed() {
    return Math.min(1, Math.max(0.45, Math.sqrt(SPEED_REF / Math.max(innerWidth, 1))));
  }

  /* An inert handle for tooling, matching window.__heroTL in hero.js. The
     rate rule is the whole point of the change above, and a pixel-difference
     measurement cannot confirm it: gradient-based flow estimates saturate
     once the sky moves more than the local contrast scale, so a genuinely
     halved desktop still measured as barely changed. Reading the clock is the
     only unambiguous check, so the test suite gets to read it. */
  window.__aurora = {
    speed: () => speed(),
    clock: () => clock,
    ref: SPEED_REF,
  };

  function prog() {
    const range = document.documentElement.scrollHeight - innerHeight;
    return range > 0 ? window.scrollY / range : 0;
  }
  function paint(timeSec) { painter.paint(timeSec, flow, energy, prog()); }

  /* The scroll layer (scroll.js) nudges the sky when the visitor arrives at
     a landmark section, so entering the proof or the pricing reads as the
     page noticing. Additive into the same decaying energy the scroll
     velocity feeds, so it can never exceed the storm ceiling or fight the
     existing behaviour; it simply borrows it. */
  window.__auroraPulse = (amount) => {
    energy = Math.min(1, energy + Math.max(0, Math.min(0.5, Number(amount) || 0)));
  };

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

    /* Both clocks scale together. The idle term in `flow` is ambient drift and
       belongs to the same budget as uTime — slowing one and not the other just
       moves the busyness from the shimmer into the drift. */
    const s = speed();
    clock += dt * s;
    flow += dt * s * (0.10 + energy * 0.9) * (velSmooth < -40 ? -1 : 1);

    paint(clock);
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
        /* Still reduced — soft and organic, and cheap everywhere — but less
           so than 0.45/860. At that scale a 1440px window upscaled 2.2x, which
           smears each noise cell into a visible blotch; the softness stopped
           reading as haze and started reading as grain. The early-out in
           curtain() keeps the extra pixels affordable. */
        const w = Math.min(Math.round(innerWidth * 0.62), 1100);
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
   2D fallback: the same three snaking ribbons, painted as
   horizontal cross-sections stacked up each scanline. Not as
   silky as the shader, but the same shape and the same motion,
   which matters more than the texture does.
   ------------------------------------------------------------ */

function init2DFallback(canvas) {
  const W = 240, H = 160;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  /* The ribbon's cross-section: soft at the edges, bright in the core.
     Horizontal now, where the old painter's strip ran vertically — the
     ribbon is the thing being drawn, not the ray. */
  function makeSlice(rgb) {
    const s = document.createElement('canvas');
    s.width = 64; s.height = 1;
    const g = s.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0.00, `rgba(${rgb},0)`);
    gr.addColorStop(0.34, `rgba(${rgb},0.35)`);
    gr.addColorStop(0.50, `rgba(${rgb},1)`);
    gr.addColorStop(0.66, `rgba(${rgb},0.35)`);
    gr.addColorStop(1.00, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 1);
    return s;
  }

  // Colour by altitude, matching the shader's ramp.
  const LOW = makeSlice('229,61,133');
  const MID = makeSlice('41,255,128');
  const HIGH = makeSlice('112,77,209');

  const RIBBONS = [
    { seed: 0.0, depth: -0.30, rate: 1.00, alpha: 0.30 },
    { seed: 2.7, depth: 0.02, rate: 0.82, alpha: 0.38 },
    { seed: 5.3, depth: 0.33, rate: 1.14, alpha: 0.26 },
  ];

  return {
    resize() { /* fixed internal resolution */ },
    paint(t, flow, energy) {
      const base = t * 0.55 + flow * 2;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      RIBBONS.forEach((r) => {
        const ph = base * r.rate;
        for (let py = 0; py < H; py += 2) {
          const y = 1 - py / H;                 // shader-space y, 0 at the bottom
          const cx = 0.5 + r.depth
            + Math.sin(y * 1.9 + ph * 0.40 + r.seed) * 0.150
            + Math.sin(y * 3.4 - ph * 0.29 + r.seed * 2.3) * 0.080
            + Math.sin(y * 6.3 + ph * 0.21 + r.seed * 4.1) * 0.038;
          const w = (0.052 + 0.028 * Math.sin(y * 4.6 - ph * 0.55 + r.seed * 1.7) + energy * 0.02) * W * 5;
          const surge = 0.70 + 0.46 * Math.sin(y * 3.6 - ph * 1.25 + r.seed * 3);
          // stands in for the shader's noise filaments; enough to break the
          // ribbon up so it does not read as a painted stripe
          const shimmer = 0.68 + 0.32 * Math.sin(y * 26 - ph * 3.1 + r.seed * 7);
          const fade = Math.max(0, Math.min(1, 1.20 - y * 1.28));
          const a = r.alpha * surge * shimmer * fade * (0.75 + energy * 0.5);
          if (a < 0.02) continue;
          ctx.globalAlpha = Math.min(1, a);
          const slice = y < 0.26 ? LOW : y < 0.70 ? MID : HIGH;
          ctx.drawImage(slice, cx * W - w / 2, py, w, 2.2);
        }
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    },
  };
}
