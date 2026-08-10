// NEVAMIS brand type plates -> transparent PNGs for After Effects.
// Fonts are embedded as base64 data: URIs because setContent() runs on an
// about:blank origin, which Chromium blocks from fetching file:// subresources —
// that silently substituted a serif in the first pass.
import fs from 'node:fs'
import { chromium } from 'playwright'

const SITE = 'C:/Users/daren/nevamis-site'
const OUT = `${SITE}/film-v2/production/plates`
fs.mkdirSync(OUT, { recursive: true })
const B64 = JSON.parse(fs.readFileSync(`${SITE}/film-v2/production/fonts-b64.json`, 'utf8'))
const face = (fam, k, wght) =>
  `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${B64[k]}) format('woff2');font-weight:${wght};font-style:normal;font-display:block}`

const T = { em: '#2FBF8F', mint: '#9FF0CE', ink: '#EAF3EE', muted: '#8AA5A0', warm: '#F0B462' }

const CSS = `
${face('Bric', 'B', '200 800')}
${face('Atk', 'A', '400')}
${face('Mono', 'M', '300 500')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:transparent}
.b{font-family:'Bric';font-weight:700;font-variation-settings:'wght' 700,'opsz' 96;letter-spacing:-.018em;line-height:1.04;white-space:nowrap}
.m{font-family:'Mono';font-weight:400;font-variation-settings:'wght' 400;letter-spacing:.2em;text-transform:uppercase;white-space:nowrap}
.a{font-family:'Atk';font-weight:400;white-space:nowrap}`

const PLATES = [
  ['t-headline', `<div class="b" style="font-size:128px;color:${T.ink}">The job doesn\u2019t wait.</div>`],
  ['t-nevamis', `<div class="b" style="font-size:168px;letter-spacing:.045em;color:${T.ink}">NEVAMIS</div>`],
  ['t-tag', `<div class="a" style="font-size:42px;color:${T.muted}">Never miss the time that matters.</div>`],
  ['t-urgent', `<div class="m" style="font-size:30px;color:${T.mint}">URGENT SERVICE CALL</div>`],
  ['t-shopowner', `<div class="b" style="font-size:80px;color:${T.ink}">Shop owner</div>`],
  ['t-outage', `<div class="a" style="font-size:40px;color:${T.muted}">Partial power outage</div>`],
  ['t-nextstep', `<div class="m" style="font-size:26px;color:${T.muted}">NEXT STEP</div>`],
  ['t-callback', `<div class="b" style="font-size:56px;color:${T.ink}">Call back now</div>`],
  ['t-immediate', `<div class="m" style="font-size:28px;color:${T.warm}">IMMEDIATE</div>`],
  ['t-texted', `<div class="m" style="font-size:30px;color:${T.mint}">TEXTED TO YOU</div>`],
  ['t-incoming', `<div class="m" style="font-size:40px;color:${T.muted}">INCOMING</div>`],
  ['t-answered', `<div class="m" style="font-size:40px;color:${T.mint}">ANSWERED</div>`],
  ['t-qualified', `<div class="m" style="font-size:40px;color:${T.mint}">QUALIFIED</div>`],
  ['t-confirmed', `<div class="m" style="font-size:40px;color:${T.mint}">CONFIRMED</div>`],
]

const MARK = (s, col) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" fill="none">
<path d="M 15 38 A 17 17 0 0 1 49 38" stroke="${col}" stroke-width="8" stroke-linecap="round"/>
<circle cx="32" cy="48" r="6" fill="${T.mint}"/></svg>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 2600, height: 500 }, deviceScaleFactor: 2 })
let serifGuard = null

for (const [name, html] of PLATES) {
  await page.setContent(`<style>${CSS}</style><div id="w" style="display:inline-block;padding:16px 22px">${html}</div>`, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(220)
  // PROVE the face resolved — measure width against a forced-serif control.
  const check = await page.evaluate(() => {
    const el = document.querySelector('#w > div')
    const w1 = el.getBoundingClientRect().width
    const prev = el.style.fontFamily
    el.style.fontFamily = 'serif'
    const w2 = el.getBoundingClientRect().width
    el.style.fontFamily = prev
    return { w1, w2, family: getComputedStyle(el).fontFamily }
  })
  const distinct = Math.abs(check.w1 - check.w2) > 2
  if (!distinct && serifGuard === null) serifGuard = name
  await page.locator('#w').screenshot({ path: `${OUT}/${name}.png`, omitBackground: true })
  console.log(`${name.padEnd(14)} w=${check.w1.toFixed(0)} serif=${check.w2.toFixed(0)} ${distinct ? 'FONT OK' : '!! SERIF FALLBACK'}`)
}

await page.setContent(`<style>${CSS}</style><div id="w" style="display:inline-block">${MARK(600, T.em)}</div>`, { waitUntil: 'load' })
await page.waitForTimeout(150)
await page.locator('#w').screenshot({ path: `${OUT}/mark-emerald.png`, omitBackground: true })
await browser.close()
console.log(serifGuard ? `\n!! FAILED: ${serifGuard} fell back to serif` : '\nAll plates rendered with real brand fonts.')
