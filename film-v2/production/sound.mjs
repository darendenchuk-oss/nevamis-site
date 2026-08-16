// NEVAMIS V2 — sound design. Synthesised stems (ffmpeg aevalsrc), mixed and muxed.
// Restrained electronic. Negative space dominant. No trailer boom, no riser spam.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const P = 'C:/Users/daren/nevamis-site/film-v2/production'
const S = `${P}/_snd`
fs.mkdirSync(S, { recursive: true })
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: ['ignore', 'ignore', 'pipe'] })
const mk = (n, expr, d) => { const p = `${S}/${n}.wav`; ff(['-f', 'lavfi', '-i', `aevalsrc=${expr}:d=${d}:s=48000`, '-ac', '2', p]); return p }

// ---- room tone: a cold, quiet space. felt, not heard.
ff(['-f', 'lavfi', '-i', 'anoisesrc=c=pink:a=0.06:d=10:r=48000',
  '-af', 'lowpass=f=300,highpass=f=40,volume=-31dB', '-ac', '2', `${S}/room.wav`])

// ---- a second, brighter air layer that only exists in the light/transformation half
ff(['-f', 'lavfi', '-i', 'anoisesrc=c=white:a=0.05:d=5:r=48000',
  '-af', 'highpass=f=2600,lowpass=f=9000,volume=-40dB,afade=t=in:st=0:d=1.2,afade=t=out:st=3.6:d=1.4', '-ac', '2', `${S}/air.wav`])

const CUES = [
  { f: `${S}/room.wav`, at: 0, g: 1.0, what: 'room tone bed, full 10s' },

  // 0.4 — the incoming. a low swell that arrives rather than hits.
  { f: mk('sub-arrive', `'0.20*sin(2*PI*(70*t-15*t*t))*exp(-1.3*t)'`, 2.6), at: 0.4, g: 1.0, what: 'sub arrival swell 70->40Hz' },
  // 1.1 — one distant metallic edge, the glass
  { f: mk('edge', `'0.05*sin(2*PI*2400*t)*exp(-9*t)+0.04*sin(2*PI*3170*t)*exp(-11*t)'`, 0.8), at: 1.1, g: 1.0, what: 'glass edge shimmer' },
  // 2.6 — thin high shimmer under the metadata
  { f: mk('meta-tick', `'0.045*sin(2*PI*5200*t)*exp(-16*t)+0.03*sin(2*PI*7400*t)*exp(-20*t)'`, 0.5), at: 2.62, g: 1.0, what: 'metadata tick' },

  // 4.0 — the rise. one, short, no cliche riser.
  { f: mk('rise', `'0.30*sin(2*PI*(55*t+70*t*t))*pow(t/0.9\,1.6)'`, 0.92), at: 3.96, g: 1.0, what: 'rise into transformation 55->180Hz' },
  { f: `${S}/air.wav`, at: 4.2, g: 1.0, what: 'air layer, transformation half' },

  // 4.7 — THE HIT. emerald arrival: sub impact + the two-note NEVAMIS motif.
  { f: mk('hit-sub', `'0.86*sin(2*PI*41*t)*exp(-2.2*t)+0.30*sin(2*PI*82*t)*exp(-3.0*t)'`, 2.2), at: 4.85, g: 1.0, what: 'emerald arrival sub impact 41Hz' },
  { f: mk('motif', `'0.34*sin(2*PI*147*t)*exp(-4.4*t)*lt(t\\,0.20)+0.34*sin(2*PI*196*(t-0.22))*exp(-3.0*(t-0.22))*gt(t\\,0.22)'`, 1.6), at: 4.87, g: 1.0, what: 'two-note motif 147->196Hz' },

  // 5.8 / 6.3 — the UI rows landing. small, dry, confident.
  { f: mk('confirm-a', `'0.10*sin(2*PI*294*t)*exp(-9*t)+0.06*sin(2*PI*441*t)*exp(-12*t)'`, 0.6), at: 5.82, g: 1.0, what: 'row 1 confirm' },
  { f: mk('confirm-b', `'0.09*sin(2*PI*330*t)*exp(-9*t)+0.05*sin(2*PI*494*t)*exp(-12*t)'`, 0.6), at: 6.34, g: 1.0, what: 'row 2 confirm' },

  // 7.9 — everything pulls away. one downward breath, then silence 8.2-8.9.
  { f: mk('collapse', `'0.17*sin(2*PI*(150-80*t)*t)*exp(-5.0*t)'`, 0.5), at: 7.88, g: 1.0, what: 'collapse breath, then silence' },

  // 9.3 — resolved. low, warm, final. deliberately NOT a boom.
  { f: mk('resolve', `'0.24*sin(2*PI*98*t)*exp(-1.5*t)+0.13*sin(2*PI*196*t)*exp(-2.2*t)'`, 2.0), at: 9.25, g: 1.0, what: 'final resolved note 98/196Hz' },
]

console.log('cue map:')
CUES.forEach((c) => console.log(`  ${String(c.at).padStart(5)}s  ${c.what}`))

// ---- mix
const args = ['-f', 'lavfi', '-t', '10', '-i', 'anullsrc=r=48000:cl=stereo']
CUES.forEach((c) => args.push('-i', c.f))
args.push('-filter_complex',
  `${CUES.map((c, i) => `[${i + 1}:a]adelay=${Math.round(c.at * 1000)}|${Math.round(c.at * 1000)},volume=${c.g}[x${i}]`).join(';')};` +
  `[0:a]${CUES.map((_, i) => `[x${i}]`).join('')}amix=inputs=${CUES.length + 1}:normalize=0:duration=first[m];` +
  `[m]alimiter=limit=0.92,loudnorm=I=-18:TP=-1.5:LRA=11,aresample=48000[out]`,
  '-map', '[out]', '-t', '10', `${S}/mix.wav`)
ff(args)

// ---- picture from the aerender PNG sequence, then mux
ff(['-i', `${P}/render/f.mp4`, '-i', `${S}/mix.wav`,
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-r', '30',
  '-c:a', 'aac', '-b:a', '256k', '-t', '10', '-movflags', '+faststart',
  `${P}/NEVAMIS-V2-PROOF-10s.mp4`])

const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json',
  '-show_format', '-show_streams', `${P}/NEVAMIS-V2-PROOF-10s.mp4`]).toString())
const v = probe.streams.find((s) => s.codec_type === 'video')
const a = probe.streams.find((s) => s.codec_type === 'audio')
console.log(`\nNEVAMIS-V2-PROOF-10s.mp4  ${(+probe.format.duration).toFixed(2)}s  ${v.width}x${v.height}  ` +
  `audio ${a ? a.codec_name + ' ' + a.sample_rate + 'Hz' : 'NONE'}  ${(probe.format.size / 1048576).toFixed(1)}MB`)
