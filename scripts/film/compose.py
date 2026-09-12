# Compose the film homepage: old head (SEO/schema/styles) + film + site chrome.
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Inputs are committed files, so the composed homepage is reproducible:
#   scripts/film/source.html        - the standalone film build (canonical)
#   scripts/film/chrome-source.html - the pre-film homepage, for the head metas,
#                                     header, footer, industries, ROI and FAQ
FILM = 'scripts/film/source.html'
old = open('scripts/film/chrome-source.html', encoding='utf-8').read()
film = open(FILM, encoding='utf-8').read()

# --- old head, complete ---
head_old = old[:old.find('</head>')]

# --- film style block (single <style> in film head) ---
fs = film.find('<style>')
fe = film.find('</style>') + len('</style>')
film_style = film[fs:fe]

# the intro cold-open must hide the site header too, and ignite it with the chrome
key = 'html.nv-intro #brand,html.nv-intro #hint,html.nv-intro #paneNav,html.nv-intro #labels,html.nv-intro #nlabel,html.nv-intro #ncard{opacity:0}'
assert key in film_style
film_style = film_style.replace(key,
    key + '\nhtml.nv-intro .site-header{opacity:0}\n'
    'html.nv-intro.nv-on .site-header{opacity:1;transition:opacity .9s ease .06s}')

# THE POSTER, AND WHY THE IGNITION NO LONGER BLINKS THE CHROME.
#
# The film's first composed frame is deferred to after the load event (see the
# film's own startFilm(); measured, it was a single 1,963 ms task and 94% of it
# was inside the GL driver). That leaves a gap this page never had, between the
# document painting and the canvas having anything in it, and two states carry
# the page across it:
#
#   nv-filmwait  Set on <html> in the markup, so it is in the very first paint,
#                and removed by the film on its first composed frame. #stage is
#                a plain var(--bg1) panel until then, so it borrows the radial
#                ground that no-WebGL visitors already get (.no3d #stage, film
#                source line ~72). Same box, same place: the canvas sits on top
#                of it at inset:0 and covers it the moment the film draws, so
#                there is no layout shift and nothing to un-shift. A visitor
#                with no JavaScript at all keeps it, which is correct: there is
#                no film for them either.
#   nv-late      The film deferred its first frame. The ignition cold-open hides
#                the chrome and fades it back in with the wake (nv-intro and
#                nv-on below), which was invisible when the first frame and the
#                first paint were the same moment, and would be a blink now that
#                the header and the scroll hint are on screen a second earlier.
#                Only those two are visible before the film draws: #brand is
#                dropped by this composer, and #paneNav, #labels, #nlabel and
#                #ncard are display:none until film-3 adds nv-live. So nv-late
#                pins exactly those two opaque and leaves every other ignition
#                rule, and every line of the film's own JavaScript (uiAwake()
#                reads nv-intro), exactly as it was.
FILM_START_CSS = (
    'html.nv-filmwait #stage{background:radial-gradient(ellipse at 50% 40%,#0A2A1F 0%,var(--bg1) 70%)}\n'
    'html.nv-late.nv-intro .site-header{opacity:1}\n'
    'html.nv-late.nv-intro #hint:not(.off){opacity:1}\n'
)

# site.css gives body overflow-x:hidden, which makes body a SCROLL CONTAINER and
# silently unsticks the film's position:sticky stage (the canvas scrolled away
# with the page and the world went black past the first viewport). clip clips
# the same horizontal overflow without creating a scroll container.
# Also: once the visitor scrolls past the film span into the page sections, the
# film's fixed chrome (labels, rail, hint) yields instead of floating over them.
SECTIONS_CSS = open('scripts/film/sections.css', encoding='utf-8').read()
film_style = film_style.replace('</style>',
    '\n' + SECTIONS_CSS + '\n'
    'body{overflow-x:clip}\n'
    'html.nv-below #labels,html.nv-below #paneNav,html.nv-below #hint,'
    'html.nv-below .copy,html.nv-below #nlabel{opacity:0 !important;pointer-events:none;'
    'transition:opacity .35s ease}\n'
    'html:not(.nv-below) .callbar{display:none}\n'
    '@media(max-width:900px){#scroll .copy{display:block}}\n'
    + FILM_START_CSS + '\n</style>')

# --- film body inner ---
b = film.find('<body>') + len('<body>')
be = film.rfind('</body>')
film_body = film[b:be]

# drop the film's own wordmark (the site header carries the brand)
mbrand = re.search(r'<div id="brand"[^>]*>.*?</div>\s*', film_body, re.S)
assert mbrand and len(mbrand.group(0)) < 200, 'brand div not where expected'
film_body = film_body[:mbrand.start()] + film_body[mbrand.end():]

# wrap the plain-DOM section as <main id="main"> so the skip link keeps working
assert film_body.count('<section id="doc"') == 1
film_body = film_body.replace('<section id="doc"', '<main id="main"><div id="how"></div><section id="doc"', 1)
# the six stations are a grid, so the run of .pane-doc articles needs one parent
_a = film_body.find('<article class="pane-doc"')
_z = film_body.rfind('</article>') + len('</article>')
assert 0 < _a < _z, 'pane-doc articles not found'
film_body = film_body[:_a] + '<div class="stations">' + film_body[_a:_z] + '</div>' + film_body[_z:]
close = re.search(r'</section>\s*(?=<script)', film_body)
assert close, 'doc close not found before scripts'
# The page below the film is authored in scripts/film/sections.html. It carries
# one <!--DOC--> marker: everything before it precedes the film's own #doc (which
# IS the six-station section, no longer hidden), everything after follows it.
SECTIONS = open('scripts/film/sections.html', encoding='utf-8').read()
assert SECTIONS.count('<!--DOC-->') == 1, 'sections.html needs exactly one <!--DOC--> marker'
sec_top, sec_bottom = SECTIONS.split('<!--DOC-->')
assert sec_bottom.count('<details') == 15, 'the FAQ must carry 15 entries'
assert 'id="roiForm"' in sec_bottom and 'id="roiQuotePlan"' in sec_bottom, 'the calculator hooks must survive'
# ORDER MATTERS: close.end() is an offset into the CURRENT film_body, so the
# offset splice has to happen before any insertion that shifts it. Doing the
# sec_top replace first moved everything right by len(sec_top) and dropped
# sec_bottom inside #doc, which parsed as the FAQ nested in the stations wrap
# and still satisfied every count-based assert below.
film_body = (film_body[:close.end()] + '\n' + sec_bottom
             + '\n</main>\n' + film_body[close.end():])
film_body = film_body.replace('<main id="main">', '<main id="main">' + sec_top, 1)

# --- site chrome from the old page ---
def block(s, start_pat, end_pat):
    i = s.find(start_pat); j = s.find(end_pat, i) + len(end_pat)
    assert i >= 0 and j > i, start_pat
    return s[i:j]

header = block(old, '<header class="site-header">', '</header>')
footer = block(old, '<footer class="site-footer">', '</footer>')
skip = '<a class="skip" href="#main">Skip to content</a>'
assert skip in old

# pricing-config + the inline priceRange schema patch (verbatim, incl. comment)
i = old.find('<script src="pricing-config.js">')
j = old.find('</script>', old.find('<script>', i)) + len('</script>')
pricing_scripts = old[i:j]

# THE FILM SCRIPT TAGS BELOW DO NOT MOVE, AND THAT IS DELIBERATE.
# The film is built by the parser exactly as before; only its first composed
# frame waits (the film's startFilm()). Moving the BUILD off the parser changes
# what the film RENDERS. Measured at a pinned governor tier with everything else
# held equal: injecting the three scripts, or giving them defer, or giving them
# async, all leave 20% of pixels differing by more than 8/255 and visibly drain
# the pane glass of its environment lighting, because the PMREM environment map
# built from RoomEnvironment comes out darker when it is generated after the
# document has been laid out than when it is generated during parsing. Scene
# graph, materials, envMapIntensity, camera, pixel ratio and PMREM inputs are
# identical in both, and replacing the environment map in both makes the two
# frames agree again. Deferring only the first FRAME leaves it identical (0.002%
# of pixels over 8/255, which is film grain). Re-run that comparison before
# moving these tags.
html_open = '<!doctype html>\n<html lang="en-CA" class="no-js nv-filmwait">\n'
assert old.startswith('<!doctype html>')
head_rest = head_old[head_old.find('<head>'):]  # <head>...metas...styles...

# film scripts become external files: the page-copy guards scan rendered HTML
# clauses, and a minified three.js bundle inline would feed code to prose rules.
# assets/film/ is added to check-consistency's auto-scanned JS surfaces, so the
# scripts' prose-looking string literals still get the em-dash/claims treatment.
import os
os.makedirs('assets/film', exist_ok=True)
scripts = re.findall(r'<script>(.*?)</script>', film_body, re.S)
assert len(scripts) == 3, f"expected 3 film scripts, got {len(scripts)}"
tags = []
for n, sc in enumerate(scripts, 1):
    fn = f'assets/film/film-{n}.js'
    open(fn, 'w', encoding='utf-8', newline='').write(sc)
    tags.append(f'<script src="/{fn}"></script>')
film_body = re.sub(r'<script>.*?</script>', lambda m: '', film_body, flags=re.S)
tags.append("""<script>
(function(){
  var sc = document.getElementById('scroll');
  function below(){
    var on = document.documentElement.classList.contains('nv-below');
    var lim = sc.offsetHeight - window.innerHeight * (on ? 1.05 : 0.65);
    document.documentElement.classList.toggle('nv-below', (window.scrollY || 0) > lim);
  }
  addEventListener('scroll', below, { passive: true });
  addEventListener('resize', below);
  below();
})();
</script>""")
film_body = film_body.rstrip() + '\n' + '\n'.join(tags) + '\n'

out = (html_open
  + head_rest
  + film_style + '\n</head>\n<body>\n'
  + skip + '\n\n'
  + header + '\n'
  + film_body.strip() + '\n'
  + footer + '\n'
  + pricing_scripts + '\n'
  + '<script src="site.js" defer></script>\n'
  + '</body>\n</html>\n')

# sanity: staging robots line present (promote.mjs requires it), one <style> from
# old head kept, film canvases/scripts present, footer legal links present
assert '<meta name="robots" content="noindex, nofollow">' in out
assert out.count('<header class="site-header">') == 1
assert out.count('<footer class="site-footer">') == 1
assert '/privacy.html' in out and '/terms.html' in out
assert 'id="paneNav"' in out and 'id="doc"' in out
assert 'id="how"' in out and 'id="industries"' in out
assert out.count('<h1') == 1, 'the page needs exactly one h1'
assert out.count('<details') == 15, 'the FAQ must publish 15 entries'
assert 'id="plansStrip"' in out and 'id="qrPrice"' in out, 'runtime price targets missing'
for _e in ['compare_demo_click', 'dayone_roi_click', 'roi_book_click', 'hero_scan_click']:
    assert _e in out, 'conversion surface missing: ' + _e
assert '—' not in out[out.find('<body'):], 'em dash in page copy'
# No money is typed into this page. Every figure renders from pricing-config.js
# at runtime, so a retired price cannot survive here the way one did before.
import re as _re
_typed = _re.findall(r'C\$[\d,]+', out[out.find('<body'):])
assert not _typed, 'typed price literal in the page body: ' + ', '.join(_typed[:4])
# structural, not just present: every below-film section must follow #doc's close,
# and </main> must follow the last of them. A count-only check passed happily while
# the whole page below the film was nested inside #doc.
_docend = out.find('</section>', out.find('id="doc-nodes"'))
for _id in ['id="industries"', 'id="roi"', 'id="plans"', 'id="start"', 'id="faq"', 'id="next"']:
    assert out.find(_id) > _docend, _id + ' is not a sibling of #doc'
assert out.find('</main>') > out.find('id="next"'), '</main> closes before the last section'
assert out.find('id="recover"') < out.find('<section id="doc"'), 'the wedge must lead'
assert 'app.nevamis.ca/scan' in out

open('home.html', 'w', encoding='utf-8', newline='').write(out)
print('composed home.html:', len(out), 'bytes')
