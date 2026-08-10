// NEVAMIS film-v2 Gate A2 — "signal becoming structure".
// Deterministic. Real repo tokens, fonts and mark. Three depth planes per frame,
// asymmetric framing, directional mint light, sonar only when it performs a job.
// Camera/lighting/dramaturgy vocabulary: visual-skills @3c55471 (CC BY 4.0, Serge Shima).
import fs from 'node:fs'
import { chromium } from 'playwright'

const SITE = 'C:/Users/daren/nevamis-site'
const OUT = `${SITE}/film-v2/styleframes-a2`
fs.mkdirSync(OUT, { recursive: true })
const FF = `${SITE}/assets/fonts`
const fu = (n) => 'file:///' + `${FF}/${n}`.replace(/\\/g, '/')

const T = { navy0: '#02080D', navy: '#0B1620', navy2: '#0D1C27', navy3: '#10222E',
  em: '#2FBF8F', emDeep: '#0E5C4B', emMid: '#1E8E6D', mint: '#9FF0CE',
  ink: '#EAF3EE', muted: '#8AA5A0', warm: '#F0B462', warmDeep: '#8A6210' }

const MARK = (s, arc = T.em, dot = T.mint) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" fill="none">
<path d="M 15 38 A 17 17 0 0 1 49 38" stroke="${arc}" stroke-width="8" stroke-linecap="round"/>
<circle cx="32" cy="48" r="6" fill="${dot}"/></svg>`

// A sonar burst that PERFORMS a job — always anchored to a capture/delivery point.
const SONAR = (cx, cy, n, r0, step, op, col = T.em) => Array.from({ length: n }, (_, i) =>
  `<circle cx="${cx}" cy="${cy}" r="${r0 + i * step}" fill="none" stroke="${col}"
   stroke-width="${(2.2 - i * 0.34).toFixed(2)}" opacity="${(op * (1 - i / (n + 0.6))).toFixed(3)}"/>`).join('')

// Waveform in PERSPECTIVE — bars shrink and dim toward the vanishing point.
const WAVE = ({ x0, y0, n, dx, dyPer, hMax, col, op0, op1, wob = 1.7, w0 = 11, taper = 0.55 }) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const x = x0 + dx * i
    const y = y0 + dyPer * i
    const sc = 1 - taper * t
    const h = (hMax * sc) * (0.30 + 0.70 * Math.abs(Math.sin(i * wob) * 0.6 + Math.sin(i * 0.41) * 0.5))
    const w = Math.max(2.4, w0 * sc)
    const op = (op0 + (op1 - op0) * t).toFixed(3)
    return `<rect x="${x.toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"
      rx="${(w / 2).toFixed(1)}" fill="${col}" opacity="${op}"/>`
  }).join('')

const CSS = `
@font-face{font-family:'Bricolage';src:url('${fu('bricolage-grotesque-variable-latin.woff2')}') format('woff2');font-weight:200 800;font-display:block}
@font-face{font-family:'Atkinson';src:url('${fu('atkinson-hyperlegible-400-latin.woff2')}') format('woff2');font-weight:400;font-display:block}
@font-face{font-family:'Atkinson';src:url('${fu('atkinson-hyperlegible-700-latin.woff2')}') format('woff2');font-weight:700;font-display:block}
@font-face{font-family:'Mono';src:url('${fu('spline-sans-mono-variable-latin.woff2')}') format('woff2');font-weight:300 500;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
body{background:${T.navy0};color:${T.ink};font-family:'Atkinson',sans-serif;-webkit-font-smoothing:antialiased}
.stage{position:relative;overflow:hidden;perspective:2400px;perspective-origin:50% 46%}
.mono{font-family:'Mono',monospace;text-transform:uppercase;letter-spacing:.16em;font-weight:400}
.bric{font-family:'Bricolage',sans-serif}
.card{background:linear-gradient(168deg, ${T.navy3} 0%, ${T.navy2} 46%, #091721 100%);
  border:1px solid rgba(159,240,206,.16);border-radius:22px;
  box-shadow:0 60px 150px -30px rgba(0,0,0,.85), 0 8px 30px rgba(0,0,0,.5), inset 0 1px 0 rgba(234,243,238,.06)}
.bg-far{position:absolute;inset:0;filter:blur(2.5px);opacity:.5}   /* background plane */
.mid{position:absolute}                                            /* midground */
.fg{position:absolute;filter:blur(3.5px)}                          /* foreground, crossing frame */
.pill{display:inline-flex;align-items:center;gap:13px;padding:13px 26px;border-radius:999px;font-size:27px;border:1px solid}
.p-mint{color:${T.mint};border-color:rgba(159,240,206,.44);background:rgba(47,191,143,.11)}
.p-warm{color:${T.warm};border-color:rgba(240,180,98,.42);background:rgba(240,180,98,.10)}
.p-mute{color:${T.muted};border-color:rgba(138,165,160,.28);background:rgba(138,165,160,.05)}
.dot{width:12px;height:12px;border-radius:50%;background:currentColor;box-shadow:0 0 16px 2px currentColor}
.val{font-family:'Bricolage',sans-serif;font-weight:600;color:${T.ink}}
.lbl{font-size:25px;color:${T.muted}}
.hi{color:${T.mint};border-bottom:3px solid rgba(159,240,206,.55);padding-bottom:3px}
/* directional illumination from a named source */
.glow{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}
`

/* ---------- FRAME 1 — the call enters. Reads L→R. Vanishing point right-of-centre. ---------- */
const F1 = () => `
<div class="glow" style="left:1010px;top:300px;width:620px;height:520px;background:rgba(47,191,143,.16)"></div>
<svg class="bg-far" width="1920" height="1080">${SONAR(1235, 505, 3, 120, 105, .30)}</svg>
<!-- BACKGROUND: destination arc, deep in frame -->
<div class="mid" style="left:1160px;top:430px;opacity:.95">${MARK(150)}</div>
<div class="mid mono" style="left:1122px;top:600px;font-size:24px;color:${T.em};letter-spacing:.22em">DETECTING</div>
<!-- MIDGROUND: the signal, entering from beyond the left edge in perspective -->
<svg class="mid" style="left:0;top:0" width="1920" height="1080">
  ${WAVE({ x0: -70, y0: 690, n: 46, dx: 27.5, dyPer: -3.9, hMax: 300, col: T.muted, op0: .18, op1: .30 })}
  ${WAVE({ x0: -70, y0: 690, n: 46, dx: 27.5, dyPer: -3.9, hMax: 300, col: T.em, op0: 0, op1: .95, taper: .55, wob: 1.7 })}
  <path d="M -40 700 C 420 660, 830 600, 1190 512" stroke="${T.em}" stroke-width="1.4" fill="none" opacity=".30"/>
</svg>
<!-- FOREGROUND: cropped bars crossing the frame edge -->
<svg class="fg" style="left:-60px;top:520px" width="640" height="560">
  ${WAVE({ x0: 10, y0: 280, n: 7, dx: 76, dyPer: -8, hMax: 470, col: T.em, op0: .30, op1: .12, taper: .1, w0: 26 })}
</svg>
<!-- caller transcript: developing live caption, lower right, NOT a big centred box -->
<div class="mid" style="left:1090px;top:742px;width:700px">
  <div class="mono" style="font-size:22px;color:${T.muted};letter-spacing:.2em;margin-bottom:16px">CALLER</div>
  <div style="font-size:40px;line-height:1.34;color:${T.ink}">“Hi, I own a shop. Half our power<br>
    <span style="opacity:.5">just went out, and we need someone today.</span><span style="color:${T.mint}">▌</span></div>
</div>
<div class="mono" style="position:absolute;left:96px;top:96px;font-size:23px;color:${T.muted};letter-spacing:.22em">
  AFTER HOURS</div>`

/* ---------- FRAME 2 — two signals meet at the capture point. Camera closer. ---------- */
const F2 = () => `
<div class="glow" style="left:700px;top:250px;width:640px;height:560px;background:rgba(47,191,143,.20)"></div>
<svg class="bg-far" width="1920" height="1080">${SONAR(960, 470, 4, 130, 96, .40)}</svg>
<!-- caller signal: receding, muted, from the left -->
<svg class="mid" style="left:0;top:0" width="1920" height="1080">
  ${WAVE({ x0: -50, y0: 640, n: 30, dx: 30, dyPer: -5.2, hMax: 210, col: T.muted, op0: .30, op1: .13, taper: .7 })}
  <!-- NEVAMIS response: cleaner, mint, from the right -->
  ${WAVE({ x0: 1960, y0: 610, n: 30, dx: -31, dyPer: -4.4, hMax: 150, col: T.mint, op0: .90, op1: .30, taper: .62, wob: .55 })}
</svg>
<div class="mid" style="left:882px;top:400px">${MARK(156)}</div>
<!-- ANSWERED 24/7 attached to the capture point -->
<div class="mid" style="left:806px;top:576px;text-align:center;width:308px">
  <span class="pill p-mint mono" style="font-size:25px"><i class="dot"></i>ANSWERED 24/7</span></div>
<!-- transcript on two separate spatial planes -->
<div class="mid" style="left:118px;top:772px;width:640px;transform:rotateY(11deg) scale(.93);opacity:.42">
  <div class="mono" style="font-size:21px;color:${T.muted};letter-spacing:.2em;margin-bottom:12px">CALLER</div>
  <div style="font-size:33px;line-height:1.3">“…half our power just went out.”</div></div>
<div class="mid" style="right:118px;top:742px;width:740px;text-align:right;transform:rotateY(-7deg)">
  <div class="mono" style="font-size:22px;color:${T.mint};letter-spacing:.2em;margin-bottom:14px">NEVAMIS</div>
  <div style="font-size:42px;line-height:1.32;color:${T.ink}">“I can help. Is anything<br>sparking or unsafe?”</div></div>`

/* ---------- FRAME 3 — transformation caught mid-flight. Source left, structure right. ---------- */
const F3 = () => {
  const rows = [
    ['WHO', 'Shop owner', 0, 0, 1.00, 1],
    ['WHAT', 'Partial power outage', 52, 196, .965, .93],
    ['URGENCY', 'Immediate', 104, 392, .93, .84],
    ['NEXT STEP', 'Call back now', 156, 588, .895, .74],
  ]
  return `
<div class="glow" style="left:1080px;top:180px;width:700px;height:700px;background:rgba(47,191,143,.11)"></div>
<!-- BACKGROUND: source transcript, receding left -->
<div class="mid" style="left:96px;top:210px;width:660px;transform:rotateY(15deg);transform-origin:left center">
  <div class="mono" style="font-size:22px;color:${T.muted};letter-spacing:.2em;margin-bottom:26px">FROM THE CALL</div>
  <div style="font-size:37px;line-height:1.62;color:${T.muted}">
    “Hi, I own a <span class="hi">shop</span>.<br>
    Half our <span class="hi">power</span> just went out,<br>
    and we need someone <span class="hi">today</span>.”</div>
</div>
<!-- MIDGROUND: signal paths carrying phrases into structure -->
<svg class="mid" style="left:0;top:0" width="1920" height="1080">
  ${[[300, 300], [352, 400], [404, 560], [456, 690]].map(([y, ys], i) =>
    `<path d="M 700 ${ys} C 850 ${ys}, 900 ${300 + i * 128}, 1024 ${300 + i * 128}"
      stroke="${T.em}" stroke-width="${2.4 - i * .3}" fill="none" opacity="${(.85 - i * .16).toFixed(2)}"
      stroke-dasharray="1 13" stroke-linecap="round"/>
     <circle cx="1024" cy="${300 + i * 128}" r="${5 - i * .5}" fill="${T.mint}" opacity="${(.95 - i * .18).toFixed(2)}"/>`).join('')}
</svg>
<!-- FOREGROUND→BACK: structured fields on staggered depth planes -->
${rows.map(([l, v, dx, dy, sc, op]) => `
<div class="mid card" style="left:${1080 + dx}px;top:${226 + dy}px;width:${700}px;padding:30px 40px;
  transform:rotateY(-13deg) scale(${sc});transform-origin:left center;opacity:${op}">
  <div class="lbl mono" style="font-size:23px">${l}</div>
  <div class="val" style="font-size:${l === 'WHO' ? 58 : 54}px;margin-top:8px">${v}</div></div>`).join('')}
<div class="mono" style="position:absolute;left:96px;top:96px;font-size:23px;color:${T.mint};letter-spacing:.22em">
  ● &nbsp;UNDERSTANDING THE CALL</div>`
}

/* ---------- FRAME 4 — the rule boundary. Campaign image. ---------- */
const F4 = () => `
<div class="glow" style="left:250px;top:420px;width:520px;height:420px;background:rgba(47,191,143,.13)"></div>
<div class="glow" style="left:1230px;top:560px;width:560px;height:480px;background:rgba(240,180,98,.15)"></div>
<svg class="bg-far" width="1920" height="1080">${SONAR(960, 430, 3, 150, 120, .26)}</svg>
<!-- the rule boundary: a vertical plane the signal must cross -->
<svg class="mid" style="left:0;top:0" width="1920" height="1080">
  <defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${T.em}" stop-opacity="0"/><stop offset=".22" stop-color="${T.em}" stop-opacity=".55"/>
    <stop offset=".78" stop-color="${T.em}" stop-opacity=".55"/><stop offset="1" stop-color="${T.em}" stop-opacity="0"/>
  </linearGradient></defs>
  <rect x="946" y="120" width="3" height="840" fill="url(#rb)"/>
  <rect x="900" y="120" width="96" height="840" fill="${T.em}" opacity=".045"/>
  <!-- safe information passes straight through, mint -->
  <path d="M 150 400 H 1780" stroke="${T.mint}" stroke-width="3" opacity=".92" stroke-dasharray="1 14" stroke-linecap="round"/>
  <circle cx="1780" cy="400" r="8" fill="${T.mint}"/>
  <!-- the price request travels in, STOPS at the boundary, branches warm -->
  <path d="M 150 700 H 946" stroke="${T.warm}" stroke-width="4" opacity=".95" stroke-dasharray="1 14" stroke-linecap="round"/>
  <path d="M 946 700 C 1120 700, 1180 830, 1400 830" stroke="${T.warm}" stroke-width="4" fill="none" opacity=".95"/>
  <circle cx="1400" cy="830" r="9" fill="${T.warm}"/>
  <!-- the stop mark -->
  <rect x="936" y="656" width="22" height="88" rx="11" fill="${T.warm}" opacity=".95"/>
</svg>
<div class="mid mono" style="left:150px;top:346px;font-size:24px;color:${T.mint};letter-spacing:.2em">JOB DETAILS</div>
<div class="mid mono" style="left:150px;top:646px;font-size:24px;color:${T.warm};letter-spacing:.2em">PRICE REQUESTED</div>
<div class="mid" style="left:150px;top:684px;width:700px">
  <div style="font-size:44px;color:${T.ink};margin-top:12px">“What would it cost?”</div></div>
<div class="mid mono" style="left:876px;top:170px;font-size:25px;color:${T.em};letter-spacing:.24em">RULE</div>
<div class="mid" style="left:1430px;top:770px;width:400px">
  <span class="pill p-warm mono"><i class="dot"></i>OWNER APPROVAL REQUIRED</span>
  <div class="mono" style="font-size:34px;color:${T.warm};margin-top:26px;letter-spacing:.2em">NEEDS YOU</div></div>
<div class="mid bric" style="left:150px;bottom:104px;font-size:44px;font-weight:600;color:${T.ink};letter-spacing:.01em">
  Your rules. Your decision.</div>`

/* ---------- FRAME 5 — HERO. Lead card foreground at angle, history behind, delivery right. ---------- */
const F5 = () => `
<div class="glow" style="left:1180px;top:150px;width:700px;height:640px;background:rgba(47,191,143,.20)"></div>
<!-- BACKGROUND: where it came from — receding transcript + fields -->
<div class="bg-far" style="left:70px;top:120px;width:820px;transform:rotateY(17deg);transform-origin:left center;opacity:.30">
  <div style="font-size:32px;line-height:1.7;color:${T.muted}">“Hi, I own a shop.<br>Half our power just went out,<br>and we need someone today.”</div>
</div>
<svg class="bg-far" width="1920" height="1080" style="opacity:.28">
  ${[250, 330, 410].map((y, i) => `<rect x="120" y="${y + 300}" width="620" height="2" fill="${T.em}" opacity="${.5 - i * .12}"/>`).join('')}
</svg>
<!-- MIDGROUND→FOREGROUND: the lead card, angled, large, fully legible -->
<div class="mid card" style="left:118px;top:214px;width:1030px;padding:56px 64px;
  transform:rotateY(-9deg) rotateX(1.6deg);transform-origin:right center">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:38px">
    <span class="pill p-mint mono" style="font-size:24px"><i class="dot"></i>LEAD CAPTURED</span></div>
  <div class="val" style="font-size:74px;line-height:1.06">Urgent service call</div>
  <div style="font-size:38px;color:${T.muted};margin-top:20px">Shop owner · partial power outage</div>
  <div style="margin:34px 0"><span class="pill p-warm mono"><i class="dot"></i>IMMEDIATE</span></div>
  <div style="height:1px;background:rgba(159,240,206,.11);margin-bottom:30px"></div>
  <div class="lbl mono" style="font-size:22px">NEXT STEP</div>
  <div class="val" style="font-size:52px;margin-top:10px">Call back now</div>
  <div class="mono" style="font-size:21px;color:${T.muted};margin-top:34px;letter-spacing:.16em">
    SUMMARY READY &nbsp;·&nbsp; RECORDING AVAILABLE</div>
</div>
<!-- concentrated delivery signal into a real message preview -->
<svg class="mid" style="left:0;top:0" width="1920" height="1080">
  <path d="M 1150 560 C 1260 560, 1300 470, 1452 470" stroke="${T.mint}" stroke-width="5" fill="none" opacity=".95"/>
  ${SONAR(1452, 470, 4, 58, 62, .60, T.mint)}
</svg>
<div class="mid card" style="left:1330px;top:530px;width:500px;padding:32px 34px;border-color:rgba(159,240,206,.30)">
  <div class="mono" style="font-size:20px;color:${T.mint};letter-spacing:.2em;margin-bottom:16px">TEXTED TO YOU</div>
  <div class="mono" style="font-size:22px;color:${T.ink};letter-spacing:.12em;margin-bottom:12px">URGENT SERVICE CALL</div>
  <div style="font-size:27px;line-height:1.45;color:${T.ink}">Partial power outage. Call back now.</div>
</div>
<div class="mid bric" style="left:118px;bottom:88px;font-size:46px;font-weight:600;color:${T.ink}">
  The call you couldn’t answer. <span style="color:${T.mint}">Captured.</span></div>`

/* ---------- FRAME 6 — one directional operating path, live → under construction ---------- */
const F6 = () => {
  const planned = ['Lead follow-up', 'Automatic tracking', 'Quote recovery', 'Owner reporting']
  return `
<div class="glow" style="left:70px;top:330px;width:560px;height:470px;background:rgba(47,191,143,.19)"></div>
<div class="glow" style="left:1180px;top:420px;width:660px;height:520px;background:rgba(240,180,98,.10)"></div>
<!-- the spine: one path, live section solid, future sections dashed and dimming -->
<svg class="mid" style="left:0;top:0" width="1920" height="1080">
  <path d="M 470 540 H 900" stroke="${T.mint}" stroke-width="6" opacity=".95" stroke-linecap="round"/>
  ${SONAR(900, 540, 3, 40, 40, .5, T.em)}
  <path d="M 900 540 H 1180" stroke="${T.warm}" stroke-width="4" opacity=".55" stroke-dasharray="2 14" stroke-linecap="round"/>
  ${planned.map((_, i) => {
    const y = 300 + i * 168
    return `<path d="M 1180 540 C 1250 540, 1270 ${y + 34}, 1352 ${y + 34}"
      stroke="${T.warm}" stroke-width="${2.6 - i * .25}" fill="none" opacity="${(.46 - i * .07).toFixed(2)}"
      stroke-dasharray="2 13" stroke-linecap="round"/>`
  }).join('')}
</svg>
<!-- LIVE, left, foreground -->
<div class="mid card" style="left:96px;top:352px;width:400px;padding:44px 42px;transform:rotateY(6deg)">
  <div class="mono" style="font-size:23px;color:${T.mint};letter-spacing:.2em;margin-bottom:26px">● &nbsp;LIVE NOW</div>
  <div class="val" style="font-size:50px;line-height:1.12">Call<br>answering</div>
  <div style="font-size:26px;color:${T.muted};margin-top:26px;line-height:1.55">
    Answers on your number<br>Qualifies against your rules<br>Texts the details to you</div>
</div>
<div class="mid mono" style="left:830px;top:600px;font-size:21px;color:${T.em};letter-spacing:.2em">NEVAMIS</div>
<!-- PLANNED, right, successive stages, each visibly fed by the spine -->
<div class="mid mono" style="left:1352px;top:214px;font-size:23px;color:${T.warm};letter-spacing:.2em">BUILDING NEXT</div>
${planned.map((p, i) => `
<div class="mid card" style="left:1352px;top:${272 + i * 168}px;width:470px;padding:24px 32px;
  border-color:rgba(240,180,98,.${22 - i * 3});opacity:${(1 - i * .11).toFixed(2)};transform:scale(${(1 - i * .018).toFixed(3)});transform-origin:left center">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:20px">
    <div style="font-size:34px;color:${T.ink};opacity:.9">${p}</div>
    <span class="mono" style="font-size:19px;color:${T.warm};letter-spacing:.18em;border:1px solid rgba(240,180,98,.35);
      border-radius:999px;padding:7px 16px">PLANNED</span></div></div>`).join('')}
<div class="mid bric" style="left:96px;bottom:96px;font-size:44px;font-weight:600;color:${T.ink}">
  The front desk is where we start.</div>`
}

/* ---------- FRAME 7 — the close ---------- */
const F7 = () => `
<div class="glow" style="left:660px;top:250px;width:600px;height:520px;background:rgba(47,191,143,.11)"></div>
<!-- one restrained confirmation wave, cropped -->
<svg class="mid" style="left:0;top:0" width="1920" height="1080" style2="">
  <path d="M 420 372 A 540 540 0 0 1 1500 372" fill="none" stroke="${T.em}" stroke-width="1.6" opacity=".22"/>
</svg>
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
  ${MARK(112)}
  <div class="bric" style="font-weight:700;font-size:150px;letter-spacing:.055em;margin:74px 0 0 .055em;line-height:1">NEVAMIS</div>
  <div style="font-size:34px;color:${T.muted};margin-top:34px;letter-spacing:.03em">Never miss the time that matters.</div>
  <div class="mono" style="font-size:60px;color:${T.ink};letter-spacing:.13em;margin-top:78px">NEVAMIS.CA</div>
  <div style="margin-top:38px"><span class="pill p-mint mono" style="font-size:26px;padding:18px 38px">
    <i class="dot"></i>HEAR IT ANSWER</span></div>
</div>`

/* ---------- FRAME 8 — native vertical, three depth zones ---------- */
const F8 = () => `
<div class="glow" style="left:120px;top:250px;width:840px;height:620px;background:rgba(47,191,143,.15)"></div>
<!-- TOP ZONE: hook, inside the upper safe area -->
<div style="position:absolute;left:70px;right:70px;top:250px">
  <svg width="940" height="180">
    ${WAVE({ x0: -20, y0: 92, n: 26, dx: 38, dyPer: 0, hMax: 150, col: T.em, op0: .22, op1: .92, taper: .18, w0: 13 })}
  </svg>
  <div class="bric" style="font-size:62px;font-weight:600;line-height:1.16;margin-top:34px;color:${T.ink}">
    The call you couldn’t answer.<br><span style="color:${T.mint}">Captured.</span></div>
</div>
<!-- MIDDLE ZONE: the lead card, 88% of width -->
<div class="card" style="position:absolute;left:64px;width:952px;top:706px;padding:52px 48px">
  <span class="pill p-mint mono" style="font-size:23px"><i class="dot"></i>LEAD CAPTURED</span>
  <div class="val" style="font-size:70px;line-height:1.08;margin-top:34px">Urgent<br>service call</div>
  <div style="font-size:34px;color:${T.muted};margin-top:20px">Shop owner · partial power outage</div>
  <div style="margin:30px 0"><span class="pill p-warm mono"><i class="dot"></i>IMMEDIATE</span></div>
  <div style="height:1px;background:rgba(159,240,206,.11);margin-bottom:26px"></div>
  <div class="lbl mono" style="font-size:22px">NEXT STEP</div>
  <div class="val" style="font-size:52px;margin-top:10px">Call back now</div>
</div>
<!-- BOTTOM ZONE: delivery + brand + CTA, clear of the bottom 340px control strip -->
<svg style="position:absolute;left:0;top:1340px" width="1080" height="150">
  <path d="M 540 20 V 96" stroke="${T.mint}" stroke-width="4" opacity=".9" stroke-dasharray="2 12" stroke-linecap="round"/>
  ${SONAR(540, 108, 3, 30, 34, .55, T.mint)}
</svg>
<div style="position:absolute;left:0;right:0;top:1492px;text-align:center">
  <span class="mono" style="font-size:30px;color:${T.mint};letter-spacing:.2em">TEXTED TO YOU</span></div>
<div style="position:absolute;left:0;right:0;top:1582px;display:flex;flex-direction:column;align-items:center">
  ${MARK(76)}
  <div class="bric" style="font-weight:700;font-size:74px;letter-spacing:.07em;margin:26px 0 0 .07em">NEVAMIS</div>
  <div class="mono" style="font-size:38px;color:${T.ink};letter-spacing:.14em;margin-top:24px">NEVAMIS.CA</div>
  <div style="margin-top:24px"><span class="pill p-mint mono" style="font-size:23px"><i class="dot"></i>HEAR IT ANSWER</span></div>
</div>`

const FRAMES = [
  ['A2-01-call-enters', F1, 1920, 1080], ['A2-02-nevamis-answers', F2, 1920, 1080],
  ['A2-03-becomes-information', F3, 1920, 1080], ['A2-04-rule-boundary', F4, 1920, 1080],
  ['A2-05-hero-captured', F5, 1920, 1080], ['A2-06-operating-path', F6, 1920, 1080],
  ['A2-07-close', F7, 1920, 1080], ['A2-08-vertical', F8, 1080, 1920],
]
const browser = await chromium.launch()
for (const [name, fn, w, h] of FRAMES) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  await page.setContent(`<style>${CSS}</style><div class="stage" style="width:${w}px;height:${h}px;
    background:radial-gradient(128% 96% at ${w > h ? '62% 34%' : '50% 26%'}, ${T.navy} 0%, ${T.navy0} 64%)">${fn()}</div>`,
    { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await page.close()
  console.log(`${name} ${w}x${h}`)
}
// poster crop from the hero
const poster = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
await poster.setContent(`<style>${CSS}</style><div class="stage" style="width:1080px;height:1350px;
  background:radial-gradient(128% 96% at 52% 30%, ${T.navy} 0%, ${T.navy0} 64%)">
  <div class="glow" style="left:520px;top:180px;width:620px;height:560px;background:rgba(47,191,143,.20)"></div>
  <div class="card" style="position:absolute;left:70px;width:800px;top:250px;padding:48px 46px;transform:rotateY(-7deg);transform-origin:right center">
    <span class="pill p-mint mono" style="font-size:22px"><i class="dot"></i>LEAD CAPTURED</span>
    <div class="val" style="font-size:64px;line-height:1.08;margin-top:30px">Urgent<br>service call</div>
    <div style="font-size:32px;color:${T.muted};margin-top:18px">Shop owner · partial power outage</div>
    <div style="margin:28px 0"><span class="pill p-warm mono"><i class="dot"></i>IMMEDIATE</span></div>
    <div style="height:1px;background:rgba(159,240,206,.11);margin-bottom:24px"></div>
    <div class="lbl mono" style="font-size:21px">NEXT STEP</div>
    <div class="val" style="font-size:46px;margin-top:8px">Call back now</div></div>
  <svg style="position:absolute;left:0;top:0" width="1080" height="1350">
    <path d="M 872 560 C 930 560, 940 500, 1000 500" stroke="${T.mint}" stroke-width="4" fill="none" opacity=".9"/>
    ${SONAR(1000, 500, 3, 40, 44, .55, T.mint)}</svg>
  <div class="bric" style="position:absolute;left:70px;right:70px;top:880px;font-size:60px;font-weight:600;line-height:1.16">
    The call you couldn’t answer.<br><span style="color:${T.mint}">Captured.</span></div>
  <div style="position:absolute;left:70px;bottom:96px;display:flex;align-items:center;gap:26px">
    ${MARK(62)}<div class="bric" style="font-weight:700;font-size:52px;letter-spacing:.07em">NEVAMIS</div>
    <div class="mono" style="font-size:28px;color:${T.muted};letter-spacing:.14em;margin-left:14px">NEVAMIS.CA</div></div>
</div>`, { waitUntil: 'load' })
await poster.evaluate(() => document.fonts.ready)
await poster.screenshot({ path: `${OUT}/A2-09-poster-4x5.png` })
await browser.close()
console.log('A2-09-poster-4x5 1080x1350')
