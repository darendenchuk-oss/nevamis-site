// NEVAMIS film-v2 — deterministic styleframes.
// Zero generation: real repo fonts, real brand tokens, the real arc-and-dot mark.
// Renders 1920x1080 frames + one 1080x1920 vertical test via Chromium.
import fs from 'node:fs'
import { chromium } from 'playwright'

const SITE = 'C:/Users/daren/nevamis-site'
const OUT = `${SITE}/film-v2/styleframes`
fs.mkdirSync(OUT, { recursive: true })
const F = `${SITE}/assets/fonts`
const fu = (n) => 'file:///' + `${F}/${n}`.replace(/\\/g, '/')

// Tokens read from assets/motion/site.css — not invented.
const T = {
  navy0: '#02080D', navy: '#0B1620', navy2: '#0D1C27', navy3: '#10222E',
  em: '#2FBF8F', emDeep: '#0E5C4B', emMid: '#1E8E6D', mint: '#9FF0CE',
  ink: '#EAF3EE', muted: '#8AA5A0', warm: '#F0B462', warmDeep: '#8A6210',
}
const EASE = 'cubic-bezier(.16,1,.3,1)'

// The real mark, copied verbatim from index.html.
const MARK = (size, op = 1) => `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" style="opacity:${op}">
<path d="M 15 38 A 17 17 0 0 1 49 38" stroke="${T.em}" stroke-width="8" stroke-linecap="round"/>
<circle cx="32" cy="48" r="6" fill="${T.mint}"/></svg>`

// Sonar arcs — the site's own signal language, used as the environment.
const SONAR = (cx, cy, n = 5, base = 260, step = 190, op = 0.5) =>
  Array.from({ length: n }, (_, i) => {
    const r = base + i * step
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${T.em}"
      stroke-width="${1.6 - i * 0.2}" opacity="${(op * (1 - i / n)).toFixed(3)}"/>`
  }).join('')

const CSS = `
@font-face{font-family:'Bricolage';src:url('${fu('bricolage-grotesque-variable-latin.woff2')}') format('woff2');font-weight:200 800;font-display:block}
@font-face{font-family:'Atkinson';src:url('${fu('atkinson-hyperlegible-400-latin.woff2')}') format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Atkinson';src:url('${fu('atkinson-hyperlegible-700-latin.woff2')}') format('woff2');font-weight:700;font-display:block}
@font-face{font-family:'Mono';src:url('${fu('spline-sans-mono-variable-latin.woff2')}') format('woff2');font-weight:300 500;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
body{background:${T.navy0};color:${T.ink};font-family:'Atkinson',sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden;background:
  radial-gradient(120% 90% at 50% 8%, ${T.navy} 0%, ${T.navy0} 68%)}
.bg{position:absolute;inset:0}
.mono{font-family:'Mono',monospace;text-transform:uppercase;letter-spacing:.16em;font-weight:400}
.bric{font-family:'Bricolage',sans-serif}
/* panel: the product, large in frame */
.panel{position:absolute;background:linear-gradient(180deg, ${T.navy2}, #0b1a24);
  border:1px solid rgba(159,240,206,.14);border-radius:20px;
  box-shadow:0 40px 120px rgba(0,0,0,.55), inset 0 1px 0 rgba(234,243,238,.05)}
.lbl{font-size:26px;color:${T.muted}}
.val{font-family:'Bricolage',sans-serif;font-weight:600;color:${T.ink}}
.pill{display:inline-flex;align-items:center;gap:14px;padding:14px 26px;border-radius:999px;
  font-size:28px;border:1px solid}
.pill-mint{color:${T.mint};border-color:rgba(159,240,206,.42);background:rgba(47,191,143,.10)}
.pill-warm{color:${T.warm};border-color:rgba(240,180,98,.40);background:rgba(240,180,98,.09)}
.pill-mute{color:${T.muted};border-color:rgba(138,165,160,.30);background:rgba(138,165,160,.06)}
.dot{width:14px;height:14px;border-radius:50%;background:currentColor;
  box-shadow:0 0 18px 2px currentColor}
.caption{position:absolute;left:96px;bottom:78px;font-size:34px;letter-spacing:.2em;color:${T.mint};
  text-shadow:0 0 30px rgba(47,191,143,.35)}
.tsline{display:flex;gap:26px;align-items:flex-start;margin-bottom:34px}
.who{flex:0 0 190px;text-align:right;font-size:26px;padding-top:12px}
.said{font-size:44px;line-height:1.35;font-weight:400}
.grid4{display:grid;grid-template-columns:1fr 1fr;gap:44px 64px}
`

// ---------- frames ----------
const F1 = () => `<div class="bg">
  <svg width="1920" height="1080">${SONAR(960, 560, 6, 220, 210, 0.55)}</svg></div>
  <!-- live waveform, mint, arc geometry -->
  <div style="position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center">
    <svg width="1500" height="260" viewBox="0 0 1500 260">
      ${Array.from({ length: 60 }, (_, i) => {
        const x = 30 + i * 24.4
        const env = Math.sin((i / 59) * Math.PI)
        const h = 18 + env * (110 + 46 * Math.sin(i * 1.7))
        return `<rect x="${x.toFixed(1)}" y="${(130 - h / 2).toFixed(1)}" width="9" height="${h.toFixed(1)}"
          rx="4.5" fill="${T.mint}" opacity="${(0.35 + 0.6 * env).toFixed(2)}"/>`
      }).join('')}
    </svg></div>
  <div style="position:absolute;left:0;right:0;top:212px;text-align:center"
       class="mono" style2=""><span class="mono" style="font-size:32px;color:${T.em}">● &nbsp;INCOMING CALL</span></div>
  <div class="panel" style="left:300px;right:300px;top:640px;padding:56px 64px">
    <div class="tsline"><div class="who mono" style="color:${T.muted}">CALLER</div>
      <div class="said">“Hi, we lost power at our shop.<br>We need someone today.”</div></div>
  </div>
  <div class="caption mono">after hours &nbsp;·&nbsp; TUESDAY</div>`

const F2 = () => `<div class="bg"><svg width="1920" height="1080">${SONAR(960, 520, 5, 260, 200, 0.4)}</svg></div>
  <div style="position:absolute;left:0;right:0;top:150px;text-align:center">
    <span class="mono" style="font-size:30px;color:${T.mint}">● &nbsp;NEVAMIS ANSWERED</span></div>
  <div style="position:absolute;left:0;right:0;top:230px;display:flex;justify-content:center">
    <svg width="1400" height="130" viewBox="0 0 1400 130">
      ${Array.from({ length: 56 }, (_, i) => {
        const h = 14 + 30 * Math.abs(Math.sin(i * 0.9))
        return `<rect x="${25 + i * 24.5}" y="${65 - h / 2}" width="8" height="${h.toFixed(1)}" rx="4"
          fill="${T.em}" opacity=".75"/>`
      }).join('')}
    </svg></div>
  <div class="panel" style="left:230px;right:230px;top:420px;padding:64px 72px">
    <div class="tsline"><div class="who mono" style="color:${T.muted}">CALLER</div>
      <div class="said" style="opacity:.55">“Hi, we lost power at our shop. We need someone today.”</div></div>
    <div class="tsline" style="margin-bottom:0"><div class="who mono" style="color:${T.mint}">NEVAMIS</div>
      <div class="said" style="color:${T.ink}">“I can help. Is anything sparking or unsafe?”</div></div>
  </div>
  <div class="caption mono">ANSWERED 24/7</div>`

const F3 = () => `<div class="bg"><svg width="1920" height="1080">${SONAR(960, 540, 4, 300, 220, 0.3)}</svg></div>
  <div class="panel" style="left:170px;right:170px;top:150px;bottom:190px;padding:74px 86px">
    <div class="mono" style="font-size:30px;color:${T.mint};margin-bottom:56px">● &nbsp;CAPTURED FROM THE CALL</div>
    <div class="grid4">
      <div><div class="lbl mono">WHO</div><div class="val" style="font-size:76px;margin-top:14px">Shop owner</div></div>
      <div><div class="lbl mono">WHAT</div><div class="val" style="font-size:76px;margin-top:14px">Partial partial power outage</div></div>
      <div><div class="lbl mono">URGENCY</div><div style="margin-top:20px"><span class="pill pill-warm mono"><i class="dot"></i>IMMEDIATE</span></div></div>
      <div><div class="lbl mono">NEXT STEP</div><div class="val" style="font-size:76px;margin-top:14px">Call back now</div></div>
    </div>
  </div>
  <div class="caption mono">WHO &nbsp;·&nbsp; WHAT &nbsp;·&nbsp; URGENCY</div>`

const F4 = () => `<div class="bg"><svg width="1920" height="1080">${SONAR(960, 540, 4, 320, 230, 0.26)}</svg></div>
  <div class="panel" style="left:170px;right:170px;top:170px;bottom:210px;padding:74px 86px">
    <div class="mono" style="font-size:30px;color:${T.em};margin-bottom:50px">● &nbsp;YOUR RULES</div>
    <div style="display:flex;flex-direction:column;gap:38px">
      <div style="display:flex;align-items:center;gap:30px">
        <span class="pill pill-mint mono"><i class="dot"></i>RULES CHECKED</span>
        <span style="font-size:36px;color:${T.muted}">Hours, service area, and what you do</span></div>
      <div style="height:1px;background:rgba(159,240,206,.10)"></div>
      <div style="display:flex;align-items:center;gap:30px">
        <span class="pill pill-mute mono">PRICE NOT PROVIDED</span>
        <span style="font-size:36px;color:${T.muted}">The caller asked what it would cost</span></div>
      <div style="height:1px;background:rgba(159,240,206,.10)"></div>
      <div style="display:flex;align-items:center;gap:30px">
        <span class="pill pill-warm mono"><i class="dot"></i>NEEDS YOU</span>
        <span style="font-size:36px;color:${T.ink}">Quoting is a decision you make</span></div>
    </div>
  </div>
  <div class="caption mono">IT DOES NOT INVENT A PRICE</div>`

const F5 = () => `<div class="bg"><svg width="1920" height="1080">${SONAR(1500, 300, 5, 200, 180, 0.4)}</svg></div>
  <div class="panel" style="left:150px;width:1180px;top:170px;bottom:200px;padding:66px 74px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:46px">
      <span class="mono" style="font-size:30px;color:${T.mint}">● &nbsp;LEAD CAPTURED</span>
      <span class="mono" style="font-size:26px;color:${T.muted}">SUMMARY READY · RECORDING AVAILABLE</span></div>
    <div class="val" style="font-size:82px">Shop owner</div>
    <div style="font-size:42px;color:${T.muted};margin-top:22px">Partial partial power outage — half the shop has no power</div>
    <div style="margin:44px 0"><span class="pill pill-warm mono"><i class="dot"></i>IMMEDIATE</span></div>
    <div style="height:1px;background:rgba(159,240,206,.10);margin-bottom:40px"></div>
    <div class="lbl mono">NEXT STEP</div>
    <div class="val" style="font-size:60px;margin-top:14px">Call back now</div>
  </div>
  <div style="position:absolute;right:150px;top:390px;width:470px;text-align:center">
    <div style="font-size:34px;color:${T.mint};letter-spacing:.16em" class="mono">TEXTED TO YOU</div>
    <svg width="470" height="130" style="margin-top:26px">
      <path d="M 10 65 H 440" stroke="${T.em}" stroke-width="3" stroke-dasharray="2 16" stroke-linecap="round" opacity=".85"/>
      <circle cx="440" cy="65" r="11" fill="${T.mint}"/></svg>
    <div style="font-size:30px;color:${T.muted};margin-top:8px">within seconds</div>
  </div>`

const F6 = () => `<div class="bg"><svg width="1920" height="1080">${SONAR(560, 540, 5, 240, 200, 0.42)}</svg></div>
  <div class="panel" style="left:120px;width:780px;top:190px;bottom:230px;padding:60px 62px">
    <div class="mono" style="font-size:30px;color:${T.mint};margin-bottom:44px">● &nbsp;LIVE NOW</div>
    <div class="val" style="font-size:64px;line-height:1.25">Call answering</div>
    <div style="font-size:34px;color:${T.muted};margin-top:26px">Answered 24/7 on your own number, qualified against your rules, and texted to you.</div>
    <div style="margin-top:auto;position:absolute;left:62px;bottom:56px">
      <span class="pill pill-mint mono"><i class="dot"></i>WORKING TODAY</span></div>
  </div>
  <div class="panel" style="right:120px;width:780px;top:190px;bottom:230px;padding:60px 62px;
       border-color:rgba(240,180,98,.22)">
    <div class="mono" style="font-size:30px;color:${T.warm};margin-bottom:44px">◦ &nbsp;BUILDING NEXT</div>
    ${['Lead follow-up', 'Automatic tracking', 'Quote recovery', 'Owner reporting']
      .map((x) => `<div style="font-size:46px;color:${T.ink};opacity:.82;margin-bottom:26px">${x}</div>`).join('')}
    <div style="position:absolute;left:62px;bottom:56px">
      <span class="pill pill-warm mono">NOT AVAILABLE YET</span></div>
  </div>
  <div class="caption mono" style="left:0;right:0;text-align:center;color:${T.muted}">ONE CONNECTED SYSTEM</div>`

const CLOSE = (w, h) => `<div class="bg"><svg width="${w}" height="${h}">${SONAR(w / 2, h * 0.42, 6, 200, 170, 0.34)}</svg></div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
    ${MARK(w > h ? 150 : 130)}
    <div class="bric" style="font-weight:700;font-size:${w > h ? 132 : 96}px;letter-spacing:.16em;margin:${w > h ? 52 : 40}px 0 0 .16em">NEVAMIS</div>
    <div style="font-size:${w > h ? 40 : 32}px;color:${T.mint};margin-top:34px;letter-spacing:.02em">Never miss the time that matters.</div>
    <div style="margin-top:${w > h ? 74 : 58}px;display:flex;flex-direction:column;align-items:center;gap:18px">
      <div class="mono" style="font-size:${w > h ? 44 : 36}px;color:${T.ink};letter-spacing:.2em">NEVAMIS.CA</div>
      <div class="mono" style="font-size:${w > h ? 28 : 24}px;color:${T.muted};letter-spacing:.18em">HEAR IT ANSWER</div>
    </div>
  </div>`

// 9:16 test — re-composed for vertical, not cropped.
const VERT = () => `<div class="bg"><svg width="1080" height="1920">${SONAR(540, 700, 5, 240, 210, 0.4)}</svg></div>
  <div style="position:absolute;left:0;right:0;top:210px;text-align:center">
    <span class="mono" style="font-size:34px;color:${T.mint}">● &nbsp;LEAD CAPTURED</span></div>
  <div class="panel" style="left:70px;right:70px;top:320px;padding:64px 58px">
    <div class="val" style="font-size:76px;line-height:1.15">Shop owner</div>
    <div style="font-size:40px;color:${T.muted};margin-top:26px">Partial partial power outage</div>
    <div style="margin:44px 0"><span class="pill pill-warm mono"><i class="dot"></i>IMMEDIATE</span></div>
    <div style="height:1px;background:rgba(159,240,206,.10);margin-bottom:38px"></div>
    <div class="lbl mono" style="font-size:30px">NEXT STEP</div>
    <div class="val" style="font-size:62px;margin-top:16px">Call back now</div>
  </div>
  <div style="position:absolute;left:0;right:0;top:1170px;text-align:center">
    <span class="mono" style="font-size:34px;color:${T.mint};letter-spacing:.18em">TEXTED TO YOU</span>
    <div style="font-size:32px;color:${T.muted};margin-top:14px">within seconds</div></div>
  <div style="position:absolute;left:0;right:0;bottom:300px;display:flex;flex-direction:column;align-items:center">
    ${MARK(96)}
    <div class="bric" style="font-weight:700;font-size:76px;letter-spacing:.16em;margin:32px 0 0 .16em">NEVAMIS</div>
    <div class="mono" style="font-size:32px;color:${T.ink};letter-spacing:.2em;margin-top:26px">NEVAMIS.CA</div></div>`

const FRAMES = [
  ['01-incoming-call', F1, 1920, 1080],
  ['02-agent-transcript', F2, 1920, 1080],
  ['03-who-what-urgency', F3, 1920, 1080],
  ['04-rules-price-refused', F4, 1920, 1080],
  ['05-lead-captured-texted', F5, 1920, 1080],
  ['06-live-now-building-next', F6, 1920, 1080],
  ['07-closing-wordmark', (w, h) => CLOSE(1920, 1080), 1920, 1080],
  ['08-vertical-test-9x16', VERT, 1080, 1920],
]

const browser = await chromium.launch()
for (const [name, fn, w, h] of FRAMES) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await page.setContent(`<style>${CSS}</style><div class="stage" style="width:${w}px;height:${h}px">${fn(w, h)}</div>`,
    { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await page.close()
  console.log(`${name}  ${w}x${h}`)
}
await browser.close()
console.log(`\n${FRAMES.length} frames -> ${OUT}`)
