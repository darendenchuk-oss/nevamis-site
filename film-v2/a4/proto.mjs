// NEVAMIS Gate A4 — 8s motion-language prototype. 1920x1080 @30fps.
// Hero material: two curved planes converging on a signal point, built as real
// CSS-3D geometry (perspective, translateZ, rotateX/Y) — not blur-as-depth.
// The inversion is caused by the hero plane crossing the camera. Deterministic.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'

const SITE = 'C:/Users/daren/nevamis-site'
const OUT = `${SITE}/film-v2/a4`
const FR = `${OUT}/frames`
fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(`${OUT}/keys`, { recursive: true })
const FF = `${SITE}/assets/fonts`
const fu = (n) => 'file:///' + `${FF}/${n}`.replace(/\\/g, '/')
const T = { navy0: '#02080D', navy: '#0B1620', navy2: '#0D1C27', navy3: '#10222E',
  em: '#2FBF8F', mint: '#9FF0CE', ink: '#EAF3EE', muted: '#8AA5A0', warm: '#F0B462' }
const W = 1920, H = 1080, FPS = 30, DUR = 8.0

function bez(p1x, p1y, p2x, p2y, x) {
  let t = x
  for (let i = 0; i < 10; i++) {
    const ct = 3 * (1 - t) ** 2 * t * p1x + 3 * (1 - t) * t * t * p2x + t ** 3
    const d = 3 * (1 - t) ** 2 * p1x + 6 * (1 - t) * t * (p2x - p1x) + 3 * t * t * (1 - p2x)
    if (Math.abs(d) < 1e-6) break
    t = Math.max(0, Math.min(1, t - (ct - x) / d))
  }
  return 3 * (1 - t) ** 2 * t * p1y + 3 * (1 - t) * t * t * p2y + t ** 3
}
const E = (x) => bez(.16, 1, .3, 1, Math.max(0, Math.min(1, x)))
const R = (t, a, b) => E((t - a) / Math.max(1e-6, b - a))
const lerp = (a, b, u) => a + (b - a) * u
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// ONE CURVED PLANE — a swept surface, thin enough to bend light, wide enough to leave frame.
// `bow` bends it; the gradient is the light it redirects.
function plane(id, bow, hue, op, wpx, hpx) {
  const c = 520 * bow
  return `<svg width="${wpx}" height="${hpx}" viewBox="0 0 1600 900" preserveAspectRatio="none"
    style="display:block;overflow:visible">
    <defs>
      <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="0.75">
        <stop offset="0"   stop-color="${hue.a}" stop-opacity="${(op * .55).toFixed(3)}"/>
        <stop offset=".42" stop-color="${hue.b}" stop-opacity="${(op * .98).toFixed(3)}"/>
        <stop offset=".72" stop-color="${hue.c}" stop-opacity="${(op * .88).toFixed(3)}"/>
        <stop offset="1"   stop-color="${hue.a}" stop-opacity="${(op * .40).toFixed(3)}"/>
      </linearGradient>
      <linearGradient id="e${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="${hue.hi}" stop-opacity="0"/>
        <stop offset=".5" stop-color="${hue.hi}" stop-opacity="${(op * .9).toFixed(3)}"/>
        <stop offset="1" stop-color="${hue.hi}" stop-opacity="0"/></linearGradient>
    </defs>
    <path d="M -260 ${450 - c} C 320 ${180 - c * 1.5}, 1180 ${180 + c * .6}, 1860 ${430 + c}
             L 1860 ${640 + c} C 1180 ${400 + c * .6}, 320 ${400 - c * 1.5}, -260 ${660 - c} Z"
      fill="url(#g${id})"/>
    <path d="M -260 ${450 - c} C 320 ${180 - c * 1.5}, 1180 ${180 + c * .6}, 1860 ${430 + c}"
      fill="none" stroke="url(#e${id})" stroke-width="3"/>
  </svg>`
}

/* ---------------- the 8 seconds ---------------- */
function scene(t) {
  // ---- inversion driven by the hero plane crossing the camera ----
  const rush = R(t, 3.0, 3.95)                 // plane accelerates toward lens
  const cross = clamp((t - 3.62) / 0.30, 0, 1) // the moment it covers the frame
  const dark = cross                            // world polarity follows the crossing
  const post = R(t, 3.95, 4.6)                 // dark world settling

  // light half stays near-achromatic; full colour only arrives with the crossing
  const chroma = clamp((t - 3.55) / 0.5, 0, 1)
  const hueA = {
    a: chroma < .5 ? '#C9D8D2' : T.em, b: chroma < .5 ? '#A8BFB7' : T.em,
    c: chroma < .5 ? '#DCE7E2' : T.mint, hi: chroma < .5 ? '#FFFFFF' : T.mint,
  }
  const hueB = {
    a: chroma < .5 ? '#DDE7E3' : T.mint, b: chroma < .5 ? '#BCCFC8' : T.mint,
    c: chroma < .5 ? '#EEF4F1' : T.em, hi: '#FFFFFF',
  }
  const bg = dark > .5
    ? `radial-gradient(115% 95% at 62% 38%, ${T.navy} 0%, ${T.navy0} 62%)`
    : `radial-gradient(115% 95% at 40% 34%, #FFFFFF 0%, #F2F6F4 55%, #DFE9E4 100%)`

  // PLANE A — the hero. oblique, edges beyond frame, folds, then rushes the lens.
  const aZ = lerp(-40, 300, R(t, 0, 3.0)) + rush * 2100
  const aRY = lerp(-34, -12, R(t, 0, 2.6)) + rush * 16 - post * 15
  const aRX = lerp(16, -6, R(t, .4, 3.0)) - rush * 22 + post * 13
  const aScale = 1 + rush * 1.9
  const bowA = lerp(.30, -.16, R(t, .6, 2.9)) + post * (0.34 + 0.13 * Math.sin(t * 1.5))
  const aOp = (1 - post * .18)
  // after the crossing the same surface keeps travelling and becomes the mark's arc
  const resolve = R(t, 4.3, 5.6)

  // PLANE B — counter-plane, converges on the signal point
  const bZ = lerp(-330, -120, R(t, 0, 3.2)) + rush * 900
  const bRY = lerp(28, 8, R(t, .3, 3.2))
  const bRX = lerp(-13, 9, R(t, .3, 3.2))
  const bowB = lerp(-.22, .26, R(t, .8, 3.2)) - post * (0.30 + 0.10 * Math.sin(t * 1.15 + .6))
  const bOp = (0.72 + .18 * R(t, 0, 1.6)) * (1 - post * .34)

  // typography rides ON the geometry (same 3D space, same transform basis)
  const tw = (s, a, b, z, ry, rx, x, y, size, col, op2 = 1) => {
    const o = t < a ? 0 : Math.min(R(t, a, a + .55), 1 - R(t, b - .4, b))
    if (o <= .004) return ''
    const slide = (1 - E(clamp((t - a) / .8, 0, 1))) * 120
    return `<div style="position:absolute;left:${x}px;top:${y}px;transform-style:preserve-3d;
      transform:translateZ(${z}px) rotateY(${ry}deg) rotateX(${rx}deg) translateX(${slide.toFixed(1)}px);
      opacity:${(o * op2).toFixed(3)};font-family:'Bricolage',system-ui,sans-serif;font-weight:600;
      font-size:${size}px;letter-spacing:-.015em;color:${col};white-space:nowrap;line-height:1.02">${s}</div>`
  }

  // MOVEMENT: mark forms out of the travelling surface, off-centre, still moving
  const drift2 = R(t, 5.6, 8.0)
  const markX = lerp(1330, 430, resolve) - drift2 * 130
  const markY = lerp(210, 300, resolve) + drift2 * 46
  const markS = lerp(300, 1020, resolve) * (1 - drift2 * .16) * (1 + .02 * Math.sin(t * 2.6))
  const markOp = resolve * (1 - R(t, 7.6, 8.0) * .1)

  // the pulse — launched from the mark, still in flight when the test ends
  const pulseT = clamp((t - 6.05) / 1.6, 0, 1)
  const pulse = pulseT > 0 && pulseT < 1
    ? `<svg style="position:absolute;left:0;top:0" width="${W}" height="${H}">
        <path d="M ${markX + markS * .5} ${markY + markS * .5}
                 C ${lerp(markX, 1500, .5)} ${markY + 40}, 1350 ${640}, ${lerp(markX, 1560, pulseT).toFixed(0)} ${lerp(markY, 660, pulseT).toFixed(0)}"
          fill="none" stroke="${T.mint}" stroke-width="${(6 * (1 - pulseT * .4)).toFixed(1)}"
          stroke-linecap="round" opacity="${(.95 * (1 - pulseT * .25)).toFixed(3)}"/>
        <circle cx="${lerp(markX + markS * .5, 1560, pulseT).toFixed(0)}"
                cy="${lerp(markY + markS * .5, 660, pulseT).toFixed(0)}"
                r="${(14 + 10 * Math.sin(pulseT * 6)).toFixed(1)}" fill="${T.mint}"
                opacity="${(1 - pulseT * .2).toFixed(3)}"/></svg>` : ''

  // the product target — enters large, becomes the next focal point, unresolved at 8s
  const cardIn = R(t, 6.5, 8.0)
  const card = cardIn <= .002 ? '' : `
    <div style="position:absolute;right:${lerp(-1240, -60, cardIn).toFixed(0)}px;top:392px;width:1240px;
      transform:perspective(1700px) rotateY(${lerp(-26, -9, cardIn).toFixed(1)}deg);transform-origin:right center;
      opacity:${Math.min(1, cardIn * 1.5).toFixed(3)};
      background:linear-gradient(168deg,${T.navy3},${T.navy2} 52%,#091721);
      border:1px solid rgba(159,240,206,.22);border-radius:26px;padding:52px 60px;
      box-shadow:0 70px 170px -30px rgba(0,0,0,.9), inset 0 1px 0 rgba(234,243,238,.07)">
      <div style="font-family:'Mono',monospace;letter-spacing:.18em;font-size:30px;color:${T.mint}">URGENT SERVICE CALL</div>
      <div style="font-family:'Bricolage',sans-serif;font-weight:600;font-size:78px;color:${T.ink};margin-top:22px">Shop owner</div>
      <div style="font-family:'Atkinson',sans-serif;font-size:40px;color:${T.muted};margin-top:16px">Partial power outage</div>
    </div>`

  const light = dark < .5
  return `<div class="stage" style="width:${W}px;height:${H}px;background:${bg};perspective:1500px;perspective-origin:48% 44%">
    <div style="position:absolute;inset:0;transform-style:preserve-3d">
      <!-- counter plane -->
      <div style="position:absolute;left:-360px;top:${(190 + 40 * Math.sin(t * .7)).toFixed(0)}px;transform-style:preserve-3d;
        transform:translateZ(${bZ.toFixed(0)}px) rotateY(${bRY.toFixed(1)}deg) rotateX(${bRX.toFixed(1)}deg);
        filter:drop-shadow(0 60px 90px rgba(2,8,13,${light ? .10 : .55}))">
        ${plane('b', bowB, hueB, bOp, 2640, 1180)}</div>
      <!-- HERO plane: edges beyond frame, crosses the camera at 3.6-3.9s -->
      <div style="position:absolute;left:-420px;top:${(150 + 26 * Math.sin(t * .9 + 1)).toFixed(0)}px;transform-style:preserve-3d;
        transform:translateZ(${aZ.toFixed(0)}px) rotateY(${aRY.toFixed(1)}deg) rotateX(${aRX.toFixed(1)}deg) scale(${aScale.toFixed(3)});
        filter:drop-shadow(0 80px 120px rgba(2,8,13,${light ? .16 : .6}));opacity:${aOp.toFixed(3)}">
        ${plane('a', bowA, hueA, 1, 2760, 1240)}
        ${tw('THE JOB', 0.55, 3.5, 40, 0, 0, 700, 250, 132, light ? T.navy0 : T.ink)}
        ${tw("DOESN’T WAIT.", 1.75, 3.5, 40, 0, 0, 640, 400, 132, light ? T.navy0 : T.ink)}
      </div>
    </div>
    ${markOp > .004 ? `<div style="position:absolute;left:${markX.toFixed(0)}px;top:${markY.toFixed(0)}px;
      transform:rotate(${(lerp(-26, 0, resolve) + drift2 * -5).toFixed(1)}deg);opacity:${markOp.toFixed(3)}">
      <svg width="${markS.toFixed(0)}" height="${markS.toFixed(0)}" viewBox="0 0 64 64" fill="none">
        <path d="M 15 38 A 17 17 0 0 1 49 38" stroke="${T.em}" stroke-width="8" stroke-linecap="round"/>
        <circle cx="32" cy="48" r="6" fill="${T.mint}"/></svg></div>` : ''}
    ${pulse}${card}
    ${(() => { const o = t < 4.55 ? 0 : Math.min(R(t, 4.55, 5.1), 1 - R(t, 7.7, 8.0) * .35); return o <= .004 ? '' :
      `<div style="position:absolute;left:132px;top:${lerp(742, 676, R(t, 4.55, 5.4)).toFixed(0)}px;opacity:${o.toFixed(3)};
        font-family:'Bricolage',system-ui,sans-serif;font-weight:600;font-size:104px;color:${T.ink};letter-spacing:-.015em">NEVAMIS ANSWERS.</div>` })()}
  </div>`
}

const CSS = `
@font-face{font-family:'Bricolage';src:url('${fu('bricolage-grotesque-variable-latin.woff2')}') format('woff2');font-weight:200 800;font-display:block}
@font-face{font-family:'Atkinson';src:url('${fu('atkinson-hyperlegible-400-latin.woff2')}') format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Mono';src:url('${fu('spline-sans-mono-variable-latin.woff2')}') format('woff2');font-weight:300 500;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
body{background:${T.navy0};-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden}`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
const n = Math.round(DUR * FPS)
const t0 = Date.now()
for (let i = 0; i < n; i++) {
  const t = i / FPS
  await page.setContent(`<style>${CSS}</style>${scene(t)}`, { waitUntil: 'load' })
  if (i === 0) { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(420) }
  await page.screenshot({ path: `${FR}/f${String(i).padStart(4, '0')}.png` })
  if (i % 60 === 0) console.log(`  ${i}/${n}`)
}
for (const s of [0, 2, 4, 6, 8]) {
  const i = Math.min(n - 1, Math.round(s * FPS))
  fs.copyFileSync(`${FR}/f${String(i).padStart(4, '0')}.png`, `${OUT}/keys/A4-t${s}s.png`)
}
await browser.close()
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS),
  '-i', `${FR}/f%04d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16',
  '-movflags', '+faststart', `${OUT}/NEVAMIS-A4-prototype-8s.mp4`])
console.log(`\nrendered ${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
