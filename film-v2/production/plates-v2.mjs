// NEVAMIS V2 cinematic plates — typography as environmental OBJECT, UI as raw material.
// Fonts embedded base64 (setContent is about:blank; file:// subresources are blocked).
import fs from 'node:fs'
import { chromium } from 'playwright'

const SITE = 'C:/Users/daren/nevamis-site'
const OUT = `${SITE}/film-v2/production/plates-v2`
fs.mkdirSync(OUT, { recursive: true })
const B64 = JSON.parse(fs.readFileSync(`${SITE}/film-v2/production/fonts-b64.json`, 'utf8'))
const face = (f, k, w) => `@font-face{font-family:'${f}';src:url(data:font/woff2;base64,${B64[k]}) format('woff2');font-weight:${w};font-display:block}`
const T = { em: '#2FBF8F', mint: '#9FF0CE', ink: '#EAF3EE', muted: '#8AA5A0', warm: '#F0B462', n2: '#0D1C27', n3: '#10222E' }

const CSS = `
${face('Bric', 'B', '200 800')}${face('Atk', 'A', '400')}${face('Mono', 'M', '300 500')}
*{margin:0;padding:0;box-sizing:border-box}html,body{background:transparent}
.b{font-family:'Bric';font-weight:700;font-variation-settings:'wght' 700,'opsz' 96;letter-spacing:-.03em;line-height:.86;white-space:nowrap}
.m{font-family:'Mono';font-weight:400;letter-spacing:.24em;text-transform:uppercase;white-space:nowrap}
.a{font-family:'Atk';font-weight:400}`

// A real portal-style row — cropped later, used as raw material, never as a whole card.
const uiRow = (label, value, accent) => `
<div style="width:1180px;padding:34px 44px;background:linear-gradient(168deg,${T.n3},${T.n2});
  border:1px solid rgba(159,240,206,.14);border-radius:20px;display:flex;align-items:center;
  justify-content:space-between;gap:40px">
  <div><div class="m" style="font-size:24px;color:${T.muted}">${label}</div>
  <div class="b" style="font-size:62px;color:${T.ink};letter-spacing:-.02em;margin-top:12px">${value}</div></div>
  ${accent ? `<div class="m" style="font-size:24px;color:${accent};border:1px solid ${accent}55;border-radius:999px;padding:12px 24px">${accent === T.warm ? 'IMMEDIATE' : 'CAPTURED'}</div>` : ''}
</div>`

const PLATES = [
  // environmental typography — huge, meant to be cropped by the frame
  ['huge-nevamis', `<div class="b" style="font-size:760px;letter-spacing:.02em;color:${T.ink}">NEVAMIS</div>`],
  ['huge-captured', `<div class="b" style="font-size:620px;color:${T.ink}">CAPTURED</div>`],
  ['huge-answered', `<div class="b" style="font-size:520px;color:${T.ink};opacity:.9">ANSWERED</div>`],
  ['huge-incoming', `<div class="b" style="font-size:460px;color:${T.muted};opacity:.55">INCOMING</div>`],
  // technical metadata — tiny, juxtaposed against the giants
  ['meta-stack', `<div style="display:flex;flex-direction:column;gap:16px">
     <div class="m" style="font-size:22px;color:${T.muted}">SESSION &nbsp;/&nbsp; INBOUND VOICE</div>
     <div class="m" style="font-size:22px;color:${T.muted}">QUALIFIED AGAINST OWNER RULES</div>
     <div class="m" style="font-size:22px;color:${T.mint}">SUMMARY READY</div></div>`],
  ['meta-outcome', `<div style="display:flex;flex-direction:column;gap:18px">
     <div class="m" style="font-size:26px;color:${T.mint}">TEXTED TO YOU</div>
     <div class="m" style="font-size:26px;color:${T.warm}">NEEDS YOU &nbsp;·&nbsp; PRICE</div></div>`],
  // UI as raw material
  ['ui-who', uiRow('WHO', 'Shop owner', null)],
  ['ui-what', uiRow('WHAT', 'Partial power outage', T.warm)],
  ['ui-next', uiRow('NEXT STEP', 'Call back now', T.em)],
  // payoff lockup
  ['lockup-tag', `<div class="a" style="font-size:46px;color:${T.muted};letter-spacing:.01em">Never miss the time that matters.</div>`],
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 7000, height: 1400 }, deviceScaleFactor: 1 })
for (const [n, html] of PLATES) {
  await page.setContent(`<style>${CSS}</style><div id="w" style="display:inline-block;padding:20px 26px">${html}</div>`, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200)
  await page.locator('#w').screenshot({ path: `${OUT}/${n}.png`, omitBackground: true })
  const bb = await page.locator('#w').boundingBox()
  console.log(`${n.padEnd(14)} ${Math.round(bb.width)}x${Math.round(bb.height)}`)
}

// The waveform as a luminous PHYSICAL form, not a UI widget — long, thin, perspective-tapered.
const wave = (col, n = 150, w = 2600, h = 420) => {
  let s = ''
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1)
    const env = Math.sin(u * Math.PI) ** 0.6
    const amp = env * (h * 0.42) * (0.35 + 0.65 * Math.abs(Math.sin(i * 1.9) * .6 + Math.sin(i * .37) * .5))
    const x = u * w, bw = 5 * (1 - u * .45)
    s += `<rect x="${x.toFixed(1)}" y="${(h / 2 - amp / 2).toFixed(1)}" width="${bw.toFixed(1)}" height="${amp.toFixed(1)}" rx="${(bw / 2).toFixed(1)}" fill="${col}" opacity="${(0.25 + 0.75 * env).toFixed(3)}"/>`
  }
  return `<svg width="${w}" height="${h}">${s}</svg>`
}
for (const [n, col] of [['wave-pale', '#C6D4CF'], ['wave-emerald', T.em]]) {
  await page.setContent(`<style>${CSS}</style><div id="w" style="display:inline-block">${wave(col)}</div>`, { waitUntil: 'load' })
  await page.waitForTimeout(120)
  await page.locator('#w').screenshot({ path: `${OUT}/${n}.png`, omitBackground: true })
  console.log(n)
}
const MARK = (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" fill="none">
<path d="M 15 38 A 17 17 0 0 1 49 38" stroke="${c}" stroke-width="8" stroke-linecap="round"/>
<circle cx="32" cy="48" r="6" fill="${T.mint}"/></svg>`
await page.setContent(`<style>${CSS}</style><div id="w" style="display:inline-block">${MARK(900, T.em)}</div>`, { waitUntil: 'load' })
await page.waitForTimeout(120)
await page.locator('#w').screenshot({ path: `${OUT}/mark.png`, omitBackground: true })
await browser.close()
console.log('\nV2 plates:', fs.readdirSync(OUT).length)
