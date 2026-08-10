// NEVAMIS Gate A3 — one parametric composition, sampled.
// scene(t) returns the whole frame. Styleframes are samples; the animatic is
// every frame. Nothing is a slide. Deterministic: no generation, no spend.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'

const SITE = 'C:/Users/daren/nevamis-site'
const OUT = `${SITE}/film-v2/a3`
const FR = `${OUT}/frames`
fs.mkdirSync(`${OUT}/styleframes`, { recursive: true }); fs.mkdirSync(FR, { recursive: true })
const FF = `${SITE}/assets/fonts`
const fu = (n) => 'file:///' + `${FF}/${n}`.replace(/\\/g, '/')

const T = { navy0: '#02080D', navy: '#0B1620', navy2: '#0D1C27', em: '#2FBF8F',
  mint: '#9FF0CE', ink: '#EAF3EE', muted: '#8AA5A0', warm: '#F0B462' }
const DUR = 37.6, FPS = 25

// site easing cubic-bezier(.16,1,.3,1)
function bez(p1x, p1y, p2x, p2y, x) {
  let t = x
  for (let i = 0; i < 8; i++) {
    const ct = 3 * (1 - t) ** 2 * t * p1x + 3 * (1 - t) * t * t * p2x + t ** 3
    const d = 3 * (1 - t) ** 2 * p1x + 6 * (1 - t) * t * (p2x - p1x) + 3 * t * t * (1 - p2x)
    if (Math.abs(d) < 1e-6) break
    t -= (ct - x) / d
    t = Math.max(0, Math.min(1, t))
  }
  return 3 * (1 - t) ** 2 * t * p1y + 3 * (1 - t) * t * t * p2y + t ** 3
}
const E = (x) => bez(.16, 1, .3, 1, Math.max(0, Math.min(1, x)))
// ramp: 0 before a, eased 0→1 across a..b, 1 after
const R = (t, a, b) => E((t - a) / Math.max(1e-6, b - a))
// window with fade in/out
const W = (t, a, b, fi = .5, fo = .5) => t < a ? 0 : t > b ? 0 : Math.min(R(t, a, a + fi), 1 - R(t, b - fo, b))

const MARK = (s, arc, dot, op = 1) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" fill="none" style="opacity:${op}">
<path d="M 15 38 A 17 17 0 0 1 49 38" stroke="${arc}" stroke-width="8" stroke-linecap="round"/>
<circle cx="32" cy="48" r="6" fill="${dot}"/></svg>`

// THE ONE OBJECT: a folded signal surface. Open early, converge into the mark's arc later.
// fold 0 = wide open ribbon-fold, 1 = collapsed onto the arc path.
function surface(cx, cy, scale, fold, hue, op) {
  const k = 1 - fold
  const spread = 300 * k + 60 * fold
  const lift = 150 * k
  const pts = []
  for (let i = 0; i <= 60; i++) {
    const u = i / 60
    const ang = Math.PI * (1 - u)                       // arc parameter
    const ax = Math.cos(ang) * 190, ay = -Math.sin(ang) * 190
    const fx = (u - .5) * 2 * spread
    const fy = Math.sin(u * Math.PI) ** 1.6 * -lift + Math.sin(u * 3.1 + 0.7) * 26 * k
    pts.push([fx * k + ax * fold, fy * k + ay * fold])
  }
  const w = (128 + 46 * Math.sin(1.1)) * k + 30 * fold
  const top = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${(cx + x * scale).toFixed(1)} ${(cy + (y - w / 2 - Math.sin(i / 60 * Math.PI) * 54 * k) * scale).toFixed(1)}`).join(' ')
  const bot = pts.slice().reverse().map(([x, y], i) => `L ${(cx + x * scale).toFixed(1)} ${(cy + (y + w / 2) * scale).toFixed(1)}`).join(' ')
  return `<defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stop-color="${hue.a}" stop-opacity=".92"/>
      <stop offset=".52" stop-color="${hue.b}" stop-opacity=".98"/>
      <stop offset="1" stop-color="${hue.c}" stop-opacity=".85"/></linearGradient>
    <filter id="sf" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${(16 * k + 1).toFixed(1)}"/></filter></defs>
    <path d="${top} ${bot} Z" fill="url(#sg)" opacity="${op}" filter="url(#sf)"/>
    <path d="${top} ${bot} Z" fill="url(#sg)" opacity="${(op * .55).toFixed(3)}"/>`
}

/* ---------------- the composition as a function of time ---------------- */
function scene(t, W_, H_) {
  const vert = H_ > W_
  const cx = W_ / 2, cy = vert ? H_ * .40 : H_ * .46
  // polarity: 0 = light field, 1 = dark identity. One decisive inversion.
  const pol = R(t, 15.4, 16.1)
  const bg = pol < .5
    ? `radial-gradient(120% 100% at 50% 40%, #FFFFFF 0%, ${T.ink} 62%, #DCE8E2 100%)`
    : `radial-gradient(120% 100% at 50% 42%, ${T.navy} 0%, ${T.navy0} 66%)`
  const typeCol = pol < .5 ? T.navy0 : T.ink
  const subCol = pol < .5 ? '#48606B' : T.muted

  // MOVEMENT I — the surface opens, folds, redirects
  const enter = R(t, 0, 2.2)
  const fold = t < 12 ? 0 : R(t, 12, 15.4)                // converge into the arc
  const sScale = (vert ? .78 : 1) * (0.86 + .14 * enter) * (1 - .18 * fold)
  const sOp = enter * (1 - R(t, 15.0, 15.9) * .35)
  const drift = Math.sin(t * .42) * (1 - fold) * 14
  const hue = pol < .5 ? { a: T.em, b: T.mint, c: '#7FE3C0' } : { a: T.em, b: T.mint, c: T.em }

  // fragments — one at a time, never more than six words
  const FRAG = [['EVERY CALL', 2.0, 4.0], ['IS A MOMENT.', 4.2, 6.2], ['IT CAN BECOME', 6.6, 8.4],
    ['A CUSTOMER.', 8.5, 10.3], ['OR DISAPPEAR.', 10.6, 12.4]]
  const frags = FRAG.map(([s, a, b]) => {
    const o = W(t, a, b, .55, .55); if (o <= .001) return ''
    const y = (1 - E(Math.min(1, (t - a) / .8))) * 26
    return `<div style="position:absolute;left:0;right:0;top:${vert ? H_ * .66 : H_ * .735}px;text-align:center;
      opacity:${o.toFixed(3)};transform:translateY(${y.toFixed(1)}px)">
      <span style="font-family:'Bricolage',system-ui,sans-serif;font-weight:600;font-size:${vert ? 86 : 96}px;letter-spacing:-.01em;color:${typeCol}">${s}</span></div>`
  }).join('')

  // MOVEMENT II — mark, pulse, capability words, lead card
  const markOn = R(t, 14.6, 16.4)
  const markS = (vert ? 150 : 190) * (0.9 + .1 * markOn)
  const pulse = W(t, 16.4, 18.2, .35, 1.2)
  const rings = pulse > .01 ? Array.from({ length: 3 }, (_, i) => {
    const p = Math.min(1, Math.max(0, (t - 16.5 - i * .30) / 1.9))
    if (p <= 0 || p >= 1) return ''
    return `<circle cx="${cx}" cy="${cy}" r="${(markS * .5 + p * (vert ? 470 : 560)).toFixed(0)}" fill="none"
      stroke="${T.em}" stroke-width="${(2.4 * (1 - p)).toFixed(2)}" opacity="${(.5 * (1 - p)).toFixed(3)}"/>`
  }).join('') : ''

  const CAPS = [['ANSWERS', 17.6], ['QUALIFIES', 18.5], ['FOLLOWS YOUR RULES', 19.4], ['TEXTS YOU THE DETAILS', 20.3]]
  const capMorph = R(t, 21.6, 22.9)                        // words transform into the card
  const caps = CAPS.map(([s, a], i) => {
    const o = W(t, a, 23.0, .5, .001) * (1 - capMorph)
    if (o <= .001) return ''
    const baseY = (vert ? H_ * .62 : H_ * .70) + i * (vert ? 74 : 66)
    const ty = baseY - capMorph * (baseY - cy) * .55
    return `<div style="position:absolute;left:0;right:0;top:${ty.toFixed(0)}px;text-align:center;opacity:${o.toFixed(3)}">
      <span style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.2em;font-size:${vert ? 40 : 44}px;color:${T.mint}">${s}</span></div>`
  }).join('')

  // the lead card — real component, large, legible, present only long enough to prove it
  const cardIn = R(t, 22.4, 23.8), cardOut = R(t, 28.0, 29.6)
  const cardO = cardIn * (1 - cardOut)
  const cardScale = (0.94 + .06 * cardIn) * (1 - .12 * cardOut)
  const cardW = vert ? W_ - 120 : 1180
  const card = cardO <= .002 ? '' : `
  <div style="position:absolute;left:50%;top:${vert ? H_ * .40 : H_ * .40}px;
    transform:translate(-50%,-50%) scale(${cardScale.toFixed(3)}) translateY(${(cardOut * -60).toFixed(0)}px);
    width:${cardW}px;opacity:${cardO.toFixed(3)};
    background:linear-gradient(168deg,#10222E,${T.navy2} 52%,#091721);border:1px solid rgba(159,240,206,.18);
    border-radius:24px;padding:${vert ? '52px 46px' : '54px 62px'};
    box-shadow:0 60px 150px -30px rgba(0,0,0,.85), inset 0 1px 0 rgba(234,243,238,.06)">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:${vert ? 30 : 34}px">
      <span style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.18em;font-size:${vert ? 26 : 28}px;color:${T.mint}">URGENT SERVICE CALL</span>
      <span style="opacity:${W(t, 25.4, 29.0, .5, .6).toFixed(3)};font-family:'Mono',ui-monospace,monospace;letter-spacing:.16em;
        font-size:${vert ? 20 : 22}px;color:${T.warm};border:1px solid rgba(240,180,98,.4);border-radius:999px;padding:8px 16px">
        PRICE REQUESTED · OWNER DECISION</span></div>
    <div style="font-family:'Bricolage',system-ui,sans-serif;font-weight:600;font-size:${vert ? 62 : 72}px;color:${T.ink};line-height:1.06">Shop owner</div>
    <div style="font-family:'Atkinson',system-ui,sans-serif;font-size:${vert ? 36 : 40}px;color:${T.muted};margin-top:18px">Partial power outage</div>
    <div style="margin:${vert ? 28 : 32}px 0"><span style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.18em;font-size:${vert ? 24 : 26}px;
      color:${T.warm};border:1px solid rgba(240,180,98,.42);border-radius:999px;padding:12px 24px">IMMEDIATE</span></div>
    <div style="height:1px;background:rgba(159,240,206,.12);margin-bottom:${vert ? 24 : 28}px"></div>
    <div style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.16em;font-size:${vert ? 22 : 24}px;color:${T.muted}">NEXT STEP</div>
    <div style="font-family:'Bricolage',system-ui,sans-serif;font-weight:600;font-size:${vert ? 48 : 54}px;color:${T.ink};margin-top:10px">Call back now</div>
    <div style="margin-top:${vert ? 30 : 34}px;display:flex;gap:18px;flex-wrap:wrap;opacity:${W(t, 24.6, 29.2, .6, .6).toFixed(3)}">
      <span style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.16em;font-size:${vert ? 21 : 23}px;color:${T.mint};
        border:1px solid rgba(159,240,206,.4);border-radius:999px;padding:10px 20px">SUMMARY READY</span>
      <span style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.16em;font-size:${vert ? 21 : 23}px;color:${T.mint};
        border:1px solid rgba(159,240,206,.4);border-radius:999px;padding:10px 20px">TEXTED TO YOU</span></div>
  </div>`

  // MOVEMENT III — live now, then planned, emerging from the same pulse
  const liveO = W(t, 29.2, 34.0, .7, .6)
  const live = liveO <= .002 ? '' : `
    <div style="position:absolute;left:0;right:0;top:${vert ? H_ * .60 : H_ * .655}px;text-align:center;opacity:${liveO.toFixed(3)}">
      <div style="font-family:'Bricolage',system-ui,sans-serif;font-weight:600;font-size:${vert ? 62 : 68}px;color:${T.ink}">Call answering</div>
      <div style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.22em;font-size:${vert ? 28 : 30}px;color:${T.mint};margin-top:16px">LIVE NOW</div></div>`
  const PLAN = [['LEAD FOLLOW-UP', 30.6], ['AUTOMATIC TRACKING', 31.3], ['QUOTE RECOVERY', 32.0], ['OWNER REPORTING', 32.7]]
  const planned = PLAN.map(([s, a], i) => {
    const o = W(t, a, 34.0, .55, .7) * .5
    if (o <= .002) return ''
    const dx = (i % 2 ? 1 : -1) * (vert ? 0 : 300 + i * 60)
    const dy = vert ? 250 + i * 62 : 250 + (i % 2) * 60
    return `<div style="position:absolute;left:50%;top:${(cy + dy).toFixed(0)}px;transform:translateX(calc(-50% + ${dx}px));
      opacity:${o.toFixed(3)};text-align:center;white-space:nowrap">
      <div style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.18em;font-size:${vert ? 26 : 28}px;color:${T.ink}">${s}</div>
      <div style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.22em;font-size:${vert ? 19 : 20}px;color:${T.warm};margin-top:8px">PLANNED</div></div>`
  }).join('')

  // CLOSING — the resting state of the same motion
  const cl = R(t, 34.2, 35.6)
  const close = cl <= .002 ? '' : `
    <div style="position:absolute;left:0;right:0;top:${vert ? H_ * .52 : H_ * .555}px;text-align:center;opacity:${cl.toFixed(3)}">
      <div style="font-family:'Bricolage',system-ui,sans-serif;font-weight:700;font-size:${vert ? 96 : 140}px;letter-spacing:.055em;
        margin-left:.055em;color:${T.ink};line-height:1">NEVAMIS</div>
      <div style="font-family:'Atkinson',system-ui,sans-serif;font-size:${vert ? 30 : 34}px;color:${subCol};margin-top:${vert ? 26 : 30}px">Never miss the time that matters.</div>
      <div style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.13em;font-size:${vert ? 42 : 56}px;color:${T.ink};margin-top:${vert ? 50 : 62}px;
        opacity:${R(t, 35.0, 36.0).toFixed(3)}">NEVAMIS.CA</div>
      <div style="margin-top:${vert ? 26 : 32}px;opacity:${R(t, 35.4, 36.4).toFixed(3)}">
        <span style="font-family:'Mono',ui-monospace,monospace;letter-spacing:.18em;font-size:${vert ? 22 : 26}px;color:${T.mint};
          border:1px solid rgba(159,240,206,.45);border-radius:999px;padding:${vert ? '14px 30px' : '16px 36px'}">HEAR IT ANSWER</span></div>
    </div>`

  // the mark: present from the convergence to the end — one continuous object
  const markY = cy - (cl > 0 ? cl * (vert ? 250 : 210) : 0)
  const markBlock = markOn <= .002 ? '' : `
    <div style="position:absolute;left:50%;top:${markY.toFixed(0)}px;transform:translate(-50%,-50%) scale(${(1 - .12 * cardIn * (1 - cardOut)).toFixed(3)});
      opacity:${(markOn * (1 - .55 * cardIn * (1 - cardOut))).toFixed(3)}">${MARK(markS, T.em, T.mint)}</div>`

  return `<div class="stage" style="width:${W_}px;height:${H_}px;background:${bg}">
    <svg style="position:absolute;left:0;top:0" width="${W_}" height="${H_}">
      ${sOp > .004 ? `<g transform="translate(0 ${drift.toFixed(1)})">${surface(cx, cy, sScale, fold, hue, sOp * (1 - markOn * .9))}</g>` : ''}
      ${rings}
    </svg>
    ${markBlock}${frags}${caps}${card}${live}${planned}${close}
  </div>`
}

const CSS = `
@font-face{font-family:'Bricolage';src:url('${fu('bricolage-grotesque-variable-latin.woff2')}') format('woff2');font-weight:200 800;font-display:block}
@font-face{font-family:'Atkinson';src:url('${fu('atkinson-hyperlegible-400-latin.woff2')}') format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Mono';src:url('${fu('spline-sans-mono-variable-latin.woff2')}') format('woff2');font-weight:300 500;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
body{background:${T.navy0};-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden}`

const KEYS = [['A3-01-moment', 5.0], ['A3-02-disappear', 11.2], ['A3-03-mark-inversion', 16.9],
  ['A3-04-capabilities', 20.6], ['A3-05-lead-card', 26.0], ['A3-06-live-planned', 32.4], ['A3-07-close', 36.6]]

const mode = process.argv[2] || 'styleframes'
const browser = await chromium.launch()

async function shootSeq(w, h, dir, label) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  fs.mkdirSync(dir, { recursive: true })
  const n = Math.round(DUR * FPS)
  for (let i = 0; i < n; i++) {
    const t = i / FPS
    await page.setContent(`<style>${CSS}</style>${scene(t, w, h)}`, { waitUntil: 'load' })
    if (i === 0) await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(260)
    await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png` })
    if (i % 100 === 0) console.log(`  ${label} ${i}/${n}`)
  }
  await page.close()
  return n
}

if (mode === 'styleframes') {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  for (const [name, t] of KEYS) {
    await page.setContent(`<style>${CSS}</style>${scene(t, 1920, 1080)}`, { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(260)
    await page.screenshot({ path: `${OUT}/styleframes/${name}.png` })
    console.log(`${name} @ ${t}s`)
  }
  await page.close()
  const v = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  await v.setContent(`<style>${CSS}</style>${scene(26.0, 1080, 1920)}`, { waitUntil: 'load' })
  await v.evaluate(() => document.fonts.ready); await v.waitForTimeout(260)
  await v.screenshot({ path: `${OUT}/styleframes/A3-08-vertical.png` })
  console.log('A3-08-vertical @ 26.0s')
  // review frames every 4s
  const r = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  fs.mkdirSync(`${OUT}/review`, { recursive: true })
  for (let t = 0; t <= DUR; t += 4) {
    await r.setContent(`<style>${CSS}</style>${scene(t, 1920, 1080)}`, { waitUntil: 'load' })
    await r.evaluate(() => document.fonts.ready); await r.waitForTimeout(200)
    await r.screenshot({ path: `${OUT}/review/t${String(t).padStart(4, '0')}.png` })
  }
  console.log('review frames every 4s')
} else {
  const n = await shootSeq(1920, 1080, `${FR}/h`, '16:9')
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS),
    '-i', `${FR}/h/f%04d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17',
    '-movflags', '+faststart', `${OUT}/NEVAMIS-A3-animatic-16x9.mp4`])
  await shootSeq(1080, 1920, `${FR}/v`, '9:16')
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', String(FPS),
    '-i', `${FR}/v/f%04d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18',
    '-movflags', '+faststart', `${OUT}/NEVAMIS-A3-animatic-9x16.mp4`])
  console.log(`animatics rendered, ${n} frames each`)
}
await browser.close()
