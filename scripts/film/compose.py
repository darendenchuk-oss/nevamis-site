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

# site.css gives body overflow-x:hidden, which makes body a SCROLL CONTAINER and
# silently unsticks the film's position:sticky stage (the canvas scrolled away
# with the page and the world went black past the first viewport). clip clips
# the same horizontal overflow without creating a scroll container.
# Also: once the visitor scrolls past the film span into the page sections, the
# film's fixed chrome (labels, rail, hint) yields instead of floating over them.
film_style = film_style.replace('</style>',
    '\nbody{overflow-x:clip}\n'
    'html.nv-below #labels,html.nv-below #paneNav,html.nv-below #hint,'
    'html.nv-below #nlabel{opacity:0 !important;pointer-events:none;'
    'transition:opacity .35s ease}\n</style>')

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
close = re.search(r'</section>\s*(?=<script)', film_body)
assert close, 'doc close not found before scripts'
# the old industries section rides along verbatim (other pages link /#industries;
# its classes are styled by the inlined site.css we keep, and site.js reveals it)
io_ = old.find('id="industries"')
ij = old.rfind('<section', 0, io_)
ik = old.find('</section>', io_) + len('</section>')
industries = old[ij:ik]
# ...and the ROI calculator section (missed-calls.html links /#roi; the logic
# lives in site.js, which this page includes)
ro_ = old.find('id="roi"')
rj = old.rfind('<section', 0, ro_)
rk = old.find('</section>', ro_) + len('</section>')
roi = old[rj:rk]
# ...and the FAQ section: build-schema.mjs derives the homepage FAQPage schema
# from the page's real <details> entries and refuses a page without them
fa_ = old.find('id="faq"')
fj = old.rfind('<section', 0, fa_)
fk = old.find('</section>', old.rfind('</details>')) + len('</section>')
faq = old[fj:fk]
assert faq.count('<details') >= 5, 'faq extraction lost entries'
film_body = (film_body[:close.end()] + industries + '\n' + roi + '\n' + faq
             + '\n</main>\n' + film_body[close.end():])

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

html_open = '<!doctype html>\n<html lang="en-CA" class="no-js">\n'
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
    var lim = sc.offsetHeight - window.innerHeight * 0.65;
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
assert 'app.nevamis.ca/scan' in out

open('home.html', 'w', encoding='utf-8', newline='').write(out)
print('composed home.html:', len(out), 'bytes')
