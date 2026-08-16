import { chromium } from 'playwright'
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-gl=angle'] })
const p = await b.newPage({ viewport: { width: 640, height: 360 } })
await p.setContent('<canvas id=c></canvas>')
const info = await p.evaluate(() => {
  const c = document.getElementById('c')
  const gl = c.getContext('webgl2') || c.getContext('webgl')
  if (!gl) return { ok:false }
  const d = gl.getExtension('WEBGL_debug_renderer_info')
  return { ok:true, ver: gl.getParameter(gl.VERSION),
    renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a',
    maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    floatLinear: !!gl.getExtension('OES_texture_float_linear'),
    colorBufFloat: !!gl.getExtension('EXT_color_buffer_float') }
})
console.log(JSON.stringify(info, null, 2))
await b.close()
