# Owner round-2 fixes on the film source + compose overrides.
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
s = open('scripts/film/source.html', encoding='utf-8').read()
n0 = len(s)
def rep(old, new, what):
    global s
    c = s.count(old)
    assert c == 1, f"{what}: {c} occurrences"
    s = s.replace(old, new)
    print("ok:", what)

# 1. Copy blocks dwell mid-frame: sticky inside per-beat holds.
rep(""".copy{position:absolute;left:50%;transform:translateX(-50%);width:min(88vw,640px);
  text-align:center;pointer-events:none;z-index:3;
  opacity:0;transition:opacity .6s ease;
}""",
""".chold{position:absolute;left:0;right:0;z-index:3;pointer-events:none}
#close-hold{z-index:5} /* the ending CTA outranks the ghosted pane labels */
.copy{position:sticky;position:-webkit-sticky;top:38vh;margin:0 auto;width:min(88vw,640px);
  text-align:center;pointer-events:none;
  opacity:0;transition:opacity .6s ease;
}""", "copy css sticky")

rep(".nv-rm .copy{position:static;transform:none;margin:8vh auto;width:min(88vw,640px);transition:none;pointer-events:auto}",
    ".nv-rm .copy{position:static;transform:none;margin:8vh auto;width:min(88vw,640px);transition:none;pointer-events:auto}\n.nv-rm .chold{position:static !important;height:auto !important}",
    "nv-rm chold")

rep("""var copyEls = [
  { el: document.getElementById('s1'), p0: 0.13, p1: 0.32, at: 0.20 },
  { el: document.getElementById('s2'), p0: 0.36, p1: 0.52, at: 0.43 },
  { el: document.getElementById('s3'), p0: 0.55, p1: 0.74, at: 0.63 },
  { el: document.getElementById('close'), p0: 0.90, p1: 1.01, at: 0.965 }
];""",
"""var copyEls = [
  { el: document.getElementById('s1'), p0: 0.13, p1: 0.32, at: 0.20 },
  { el: document.getElementById('s2'), p0: 0.36, p1: 0.52, at: 0.43 },
  { el: document.getElementById('s3'), p0: 0.55, p1: 0.74, at: 0.63 },
  { el: document.getElementById('close'), p0: 0.90, p1: 1.01, at: 0.965 }
];
/* owner note: story copy should HOLD mid-frame while its beat passes instead
   of flying by. Each block rides position:sticky inside a hold that spans its
   beat's scroll window (tops and heights set in layout()). */
copyEls.forEach(function(c){
  var hold = document.createElement('div');
  hold.className = 'chold';
  hold.id = c.el.id + '-hold';
  c.el.parentNode.insertBefore(hold, c.el);
  hold.appendChild(c.el);
  c.hold = hold;
});""", "copy holds")

rep("""    copyEls.forEach(function(c){
      if (c.el.id === 'close') {
        c.el.style.top = Math.round(spanH - vh + vh * (0.34 + 0.055 * PF)) + 'px'; /* inside the arch aperture: the calm zone (portrait: lower, clear of the crown) */
      } else {
        c.el.style.top = Math.round(c.at * (spanH - vh) + vh * 0.40) + 'px';
      }
    });""",
"""    copyEls.forEach(function(c){
      if (c.el.id === 'close') {
        /* park through the finale: pinned from the approach to the film's
           last pixel, seated inside the arch aperture (portrait: lower,
           clear of the crown) */
        var t0c = Math.round(0.88 * (spanH - vh));
        c.hold.style.top = t0c + 'px';
        c.hold.style.height = (spanH - t0c) + 'px';
        c.el.style.top = (34 + 5.5 * PF) + 'vh';
      } else {
        /* the hold spans the beat's whole window: the block dwells mid-frame
           for its readable life instead of crossing the viewport once */
        c.hold.style.top = Math.round(c.p0 * (spanH - vh)) + 'px';
        c.hold.style.height = Math.round((c.p1 - c.p0) * (spanH - vh) + vh * 0.72) + 'px';
        c.el.style.top = '38vh';
      }
    });""", "layout holds")

# 2. Ghosted pane labels must not swallow clicks (they sit above the ending
#    CTA in paint order; at 0.25 opacity they were still interactive).
rep("L.el.style.pointerEvents = L.o > 0.05 ? 'auto' : 'none'",
    "L.el.style.pointerEvents = L.o > 0.35 ? 'auto' : 'none' /* ghosted blocks are scenery, not targets */",
    "ghost labels inert")

# 3. No quality-tier steps during the finale: a pane-material or DPR swap in
#    front of the parked arch is the most visible pop the governor can make.
rep("""  if (GOV.pending >= 0 && !IW.on && !EXIT.on &&
      (Math.abs(target - cur) > 0.0004 || GIX.busy || LOOK.weight > 0.0005)) {""",
"""  if (GOV.pending >= 0 && !IW.on && !EXIT.on && cur < 0.85 &&
      (Math.abs(target - cur) > 0.0004 || GIX.busy || LOOK.weight > 0.0005)) {""",
    "governor finale gate")

open('scripts/film/source.html', 'w', encoding='utf-8', newline='').write(s)
print(f"source: {n0} -> {len(s)}")

# --- compose overrides: nv-below hysteresis + mobile callbar yields to the film ---
c = open('scripts/film/compose.py', encoding='utf-8').read()
old = """    'html.nv-below #labels,html.nv-below #paneNav,html.nv-below #hint,'
    'html.nv-below #nlabel{opacity:0 !important;pointer-events:none;'
    'transition:opacity .35s ease}\\n</style>')"""
new = """    'html.nv-below #labels,html.nv-below #paneNav,html.nv-below #hint,'
    'html.nv-below #nlabel{opacity:0 !important;pointer-events:none;'
    'transition:opacity .35s ease}\\n'
    'html:not(.nv-below) .callbar{display:none}\\n</style>')"""
assert c.count(old) == 1, "compose style block"
c = c.replace(old, new)

old2 = """  function below(){
    var lim = sc.offsetHeight - window.innerHeight * 0.65;
    document.documentElement.classList.toggle('nv-below', (window.scrollY || 0) > lim);
  }"""
new2 = """  function below(){
    var on = document.documentElement.classList.contains('nv-below');
    var lim = sc.offsetHeight - window.innerHeight * (on ? 1.05 : 0.65);
    document.documentElement.classList.toggle('nv-below', (window.scrollY || 0) > lim);
  }"""
assert c.count(old2) == 1, "compose hysteresis"
c = c.replace(old2, new2)
open('scripts/film/compose.py', 'w', encoding='utf-8', newline='').write(c)
print("compose updated")
