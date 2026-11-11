# Compose the film homepage: old head (SEO/schema/styles) + film + site chrome.
import re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Inputs are committed files, so the composed homepage is reproducible:
#   scripts/film/source.html        - the standalone film build (canonical)
#   scripts/film/chrome-source.html - the head metas, header and footer
#   scripts/film/sections.html      - the hero above the film
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
#
# THE SAME CHROME YIELDS ABOVE THE FILM (launch audit HERO-1, 2026-11-09). The
# hero (#found) sits above the film now, and the film's fixed chrome is laid out
# for a stage pinned at the top of the screen: the pane labels are projected
# into viewport coordinates, the rail floats at the left or under the header,
# and the "Scroll" hint sits at the bottom edge. Over the hero they would float
# across the headline and its buttons, and the labels would sit up to a screen
# away from the panes they name while the stage is still scrolling up into
# place. So nv-above (set in the markup, so the very first paint has it, and
# cleared by the script below once the stage reaches the top of the screen)
# hides them the way nv-below does. The story blocks are hidden too, except on
# the reduced-motion and no-WebGL path (nv-rm), where they are ordinary text in
# the document and must never be hidden (tests/can-always-act.spec.js).
#
# HIDDEN MEANS OUT OF THE TAB ORDER TOO (polish round, 2026-11-09). Opacity and
# pointer-events hide the chrome from the eye and the mouse, not the keyboard:
# Tab from the hero's last link went to the film ending's Book a call and scan
# link, then the six rail buttons, then the node card's close button, nine
# stops a sighted keyboard user could not see, all at opacity 0, before the
# next real link. So the same rules also set visibility:hidden, which takes an
# element out of the tab order without moving anything, and the visibility
# change waits for the fade (0s linear .35s) so the chrome still fades out
# rather than vanishing; coming back, it is visible at once and fades in. The
# node card (#ncard) sits at opacity 0 whenever it is closed, film or no film,
# so it is hidden the same way whenever it is not open. Geometry is unchanged,
# so every measurement of the rail (tests/closing-round.spec.js) still holds.
# tests/first-screen.spec.js presses Tab from the hero and fails on any stop
# that cannot be seen.
#
# THE BOOKING BAR. It used to be display:none for the whole film
# ("html:not(.nv-below) .callbar"), which left a phone with no tappable action
# for about 7,400px. It now steps aside only while the hero's own action row is
# on screen (nv-herocta, set in the markup and kept by an IntersectionObserver
# below), so the two never show the same Book a call twice, and it is there
# everywhere else, through the film included. It hides the way the book page's
# bar steps aside for its scheduler (.callbar-off in site.css), and it also
# steps aside while a pane card is open, whose foot it would otherwise cover.
# With the bar up through the film, a phone's "Scroll" hint rides above it.
SECTIONS_CSS = open('scripts/film/sections.css', encoding='utf-8').read()
film_style = film_style.replace('</style>',
    '\n' + SECTIONS_CSS + '\n'
    'body{overflow-x:clip}\n'
    'html.nv-below #labels,html.nv-below #paneNav,html.nv-below #hint,'
    'html.nv-below .copy,html.nv-below #nlabel{opacity:0 !important;pointer-events:none;'
    'visibility:hidden;transition:opacity .35s ease,visibility 0s linear .35s}\n'
    'html.nv-above #labels,html.nv-above #paneNav,html.nv-above #hint,'
    'html.nv-above:not(.nv-rm) .copy,html.nv-above #nlabel{opacity:0 !important;pointer-events:none;'
    'visibility:hidden;transition:opacity .35s ease,visibility 0s linear .35s}\n'
    '#ncard:not(.on){visibility:hidden;transition:opacity .28s ease,visibility 0s linear .28s}\n'
    'html.nv-herocta .callbar,body.card-open .callbar{transform:translateY(110%);visibility:hidden;'
    'transition:transform var(--t-base) var(--e-out),visibility 0s linear var(--t-base)}\n'
    '@media(max-width:820px){#hint{bottom:calc(76px + env(safe-area-inset-bottom))}}\n'
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

# <main id="main"> opens above the film, with the hero in it, so the skip link
# lands on the page's first screen. The film's #doc stays in the document,
# because the film reads its station cards and named dots from it, and
# sections.css keeps it from showing as a section of the page.
assert film_body.count('<section id="doc"') == 1
assert film_body.count('<div id="scroll">') == 1, 'the film span not where expected'
# the six stations are a grid, so the run of .pane-doc articles needs one parent
_a = film_body.find('<article class="pane-doc"')
_z = film_body.rfind('</article>') + len('</article>')
assert 0 < _a < _z, 'pane-doc articles not found'
film_body = film_body[:_a] + '<div class="stations">' + film_body[_a:_z] + '</div>' + film_body[_z:]
close = re.search(r'</section>\s*(?=<script)', film_body)
assert close, 'doc close not found before scripts'
# The page around the film is authored in scripts/film/sections.html: the hero,
# then one <!--FILM--> marker, then nothing (owner decision #81, 2026-11-10:
# one message, the price, one button).
SECTIONS = open('scripts/film/sections.html', encoding='utf-8').read()
assert SECTIONS.count('<!--FILM-->') == 1, 'sections.html needs exactly one <!--FILM--> marker'
sec_hero, sec_rest = SECTIONS.split('<!--FILM-->')
assert not sec_rest.strip(), 'nothing follows the film marker in sections.html'
assert 'id="hero"' in sec_hero and '<h1' in sec_hero, 'the hero (#hero and the one h1) goes above the film'
film_body = film_body[:close.end()] + '\n</main>\n' + film_body[close.end():]
film_body = film_body.replace('<div id="scroll">', '<main id="main">' + sec_hero + '\n<div id="scroll">', 1)

# --- site chrome from the old page ---
def block(s, start_pat, end_pat):
    i = s.find(start_pat); j = s.find(end_pat, i) + len(end_pat)
    assert i >= 0 and j > i, start_pat
    return s[i:j]

header = block(old, '<header class="site-header">', '</header>')
footer = block(old, '<footer class="site-footer">', '</footer>')
skip = '<a class="skip" href="#main">Skip to content</a>'
assert skip in old

# pricing-config.js, which free-month.js reads, and free-month.js itself
i = old.find('<script src="pricing-config.js">')
j = old.find('<script src="free-month.js" defer></script>', i) + len('<script src="free-month.js" defer></script>')
assert 0 <= i < j, 'the pricing-config and free-month tags are not where expected'
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
# nv-above and nv-herocta are in the markup for the same reason nv-filmwait is:
# so the first paint, before any script has run, already hides the film's fixed
# chrome over the hero and keeps the booking bar from doubling the hero's own
# Book a call. With no JavaScript at all they stay, which is correct: there is
# no film to scroll through, and the bar was hidden for that visitor before too.
html_open = '<!doctype html>\n<html lang="en-CA" class="no-js nv-filmwait nv-above nv-herocta">\n'
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
# The film span starts below the hero now, so every position is measured from
# the span's own top rather than from the top of the page (the film's readScroll
# does the same with its SPAN_TOP). nv-above holds until the stage reaches the
# top of the screen, which is where the film's fixed chrome is laid out for.
# nv-herocta holds while the hero's action row is on screen; without
# IntersectionObserver the bar simply shows, which is the safe side.
tags.append("""<script>
(function(){
  var de = document.documentElement;
  var sc = document.getElementById('scroll');
  function where(){
    var y = window.scrollY || 0;
    var top = sc.getBoundingClientRect().top + y;
    var on = de.classList.contains('nv-below');
    var lim = top + sc.offsetHeight - window.innerHeight * (on ? 1.05 : 0.65);
    de.classList.toggle('nv-below', y > lim);
    de.classList.toggle('nv-above', y < top - 1);
  }
  addEventListener('scroll', where, { passive: true });
  addEventListener('resize', where);
  where();
  var row = document.querySelector('#hero .ctarow');
  if (!row || !window.IntersectionObserver) { de.classList.remove('nv-herocta'); return; }
  new IntersectionObserver(function(es){
    de.classList.toggle('nv-herocta', es[es.length - 1].isIntersecting);
  }).observe(row);
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
assert out.count('<h1') == 1, 'the page needs exactly one h1'
assert '<!-- generated:prices --><!-- /generated:prices -->' in out, 'the hero price region is missing'
assert 'data-evt="hero_book_call_click"' in out and 'data-evt="hero_live_demo_call_click"' in out, \
    'the hero must carry the Book button and the demo line, each with its own event'
assert '—' not in out[out.find('<body'):], 'em dash in page copy'
# No money is typed into this page. scripts/build-pages.mjs writes the three
# Front Desk sizes from pricing-config.js into the generated:prices regions.
import re as _re
_typed = _re.findall(r'C\$[\d,]+', out[out.find('<body'):])
assert not _typed, 'typed price literal in the page body: ' + ', '.join(_typed[:4])
for _gone in ['Lead Generation', 'by invitation', 'By invitation']:
    assert _gone not in out[out.find('<body'):], 'retired offer in the page body: ' + _gone
_found = out.find('id="hero"')
_scroll = out.find('<div id="scroll">')
_main = out.find('<main id="main">')
assert 0 < _main < _found < out.find('<h1') < _scroll, 'the hero (#hero and the h1) must open <main>, above the film'
assert out.find('</main>') > out.find('id="doc-nodes"'), '</main> closes before the film documentation'
_hero = out[_found:out.find('</section>', _found)]
assert not re.search(r'class="[^"]*\breveal\b', _hero), 'a .reveal on the first screen makes the hero wait for motion'

# THE SERVED PAGE CARRIES NO SOURCE COMMENTS (audit CHECK-RUNNER-6, 2026-10-03).
# The three source files are written the way this codebase writes everything,
# with long comments saying WHY, and every one of them used to ship: about 30 KB
# of the composed page, one byte in seven, was HTML comments and CSS comments
# that a visitor downloads and parses and never sees, on the page that already
# sits nearest its load budget. They stay in the sources, which is where a person
# reads them; the page gets the markup. Kept: the generated:* markers, because
# build-pages, build-schema and build-csp find their regions by them. Not
# touched: anything inside <script>, because a JavaScript string or a JSON-LD
# value can hold "/*" or "<!--" and this is not a JavaScript parser.
_MARKER = re.compile(r'<!-- /?generated:[a-z]+ -->')

def _strip_css_comments(css):
    # A small scanner rather than a regex, so a "/*" inside a quoted string or a
    # url() payload survives (the same rule scripts/lib/inline-css.mjs follows).
    o, i, n, q = [], 0, len(css), None
    while i < n:
        c = css[i]
        if q:
            o.append(c)
            if c == '\\' and i + 1 < n:
                o.append(css[i + 1]); i += 2; continue
            if c == q: q = None
            i += 1; continue
        if c in '"\'':
            q = c; o.append(c); i += 1; continue
        if css.startswith('/*', i):
            j = css.find('*/', i + 2)
            assert j >= 0, 'unterminated CSS comment'
            i = j + 2; continue
        o.append(c); i += 1
    return ''.join(o)

def _strip_served_comments(html):
    o, i, low = [], 0, html.lower()
    while True:
        nxt = [(k, low.find(t, i)) for k, t in (('c', '<!--'), ('s', '<script'), ('y', '<style'))]
        nxt = [(k, p) for k, p in nxt if p >= 0]
        if not nxt:
            o.append(html[i:]); break
        k, p = min(nxt, key=lambda kp: kp[1])
        o.append(html[i:p])
        if k == 'c':
            e = html.find('-->', p)
            assert e >= 0, 'unterminated HTML comment'
            e += 3
            if _MARKER.fullmatch(html[p:e]): o.append(html[p:e])
            i = e
        elif k == 's':
            e = low.find('</script>', p)
            assert e >= 0, 'unterminated <script>'
            e += len('</script>')
            o.append(html[p:e]); i = e
        else:
            gt = html.find('>', p) + 1
            e = low.find('</style>', gt)
            assert gt > 0 and e >= 0, 'unterminated <style>'
            o.append(html[p:gt] + _strip_css_comments(html[gt:e]) + '</style>')
            i = e + len('</style>')
    return ''.join(o)

_before = len(out.encode('utf-8'))
out = _strip_served_comments(out)
# Lines a comment used to fill are left blank; collapse runs of them.
out = re.sub(r'\n[ \t]*(?:\n[ \t]*)+\n', '\n\n', out)
assert '<!--' not in re.sub(r'<script\b.*?</script>', '', out, flags=re.S | re.I).replace(
    '<!-- generated:schema -->', '').replace('<!-- /generated:schema -->', '').replace(
    '<!-- generated:css -->', '').replace('<!-- /generated:css -->', '').replace(
    '<!-- generated:csp -->', '').replace('<!-- /generated:csp -->', '').replace(
    '<!-- generated:prices -->', '').replace('<!-- /generated:prices -->', ''), 'a served comment survived'
for _m in ('generated:schema', 'generated:css'):
    assert out.count('<!-- ' + _m + ' -->') == 1 and out.count('<!-- /' + _m + ' -->') == 1, _m + ' marker lost'

open('home.html', 'w', encoding='utf-8', newline='').write(out)
print('comments stripped:', _before - len(out.encode('utf-8')), 'bytes')
print('composed home.html:', len(out), 'bytes')
