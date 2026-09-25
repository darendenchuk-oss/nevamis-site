#!/usr/bin/env node
/* ============================================================
   WHAT DOES NEVAMIS.CA ACTUALLY PUBLISH?

   GitHub Pages serves this repository through Jekyll with a DENY list:
   _config.yml says "everything not listed here is served verbatim". So every
   new top-level folder is public the moment it is committed, unless someone
   remembers to exclude it. That is how film-v2/ and the brand/ working files
   went live: an After Effects project, a cost plan with vendor balances,
   checkpoint notes with local machine paths, build scripts.

   This guard turns the deny list into an allow list after the fact. It works
   out the published set the way Jekyll does (scripts/lib/published-files.mjs)
   and fails on anything outside the intended surface below. Publishing
   something new is then a visible decision in the same change, not an
   accident.

     node scripts/check-published-surface.mjs     exit 0 clean, 1 unexpected
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedFiles } from './lib/published-files.mjs';
import { decodeRefs } from './lib/char-refs.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* The intended public surface. Root pages come from content-map.json, so a
   page registered there is allowed without touching this file. */
const PAGES = new Set(JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8')).pages.map((p) => p.file));
const ROOT_FILES = new Set([
  'CNAME', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png',
  'site.js', 'motion.js', 'pricing-config.js', 'roadmap-config.js',
  'search-index.json', 'content-map.json', 'llms.txt', 'sitemap.xml', 'robots.txt',
  'THIRD_PARTY_NOTICES.md',
  /* Twilio fetches this for every Nevamis phone number. It must stay published. */
  'ring.xml',
]);
/* assets/ holds what pages load: media, fonts, scripts, styles and data. No
   documents. An HTML page (or an SVG carrying script) served from assets/ would
   run on the nevamis.ca origin without the Content-Security-Policy every page
   gets from scripts/build-csp.mjs, because that policy travels inside the page. */
const ASSET_TYPES = /\.(png|gif|jpe?g|webp|avif|ico|mp4|webm|mp3|wav|ogg|m4a|woff2?|ttf|otf|js|css|json|svg)$/i;

/* An SVG opened directly is a document. A deny list of "script", "on..." and
   "javascript:" was beaten by href="java&#115;cript:...", by a newline inside
   the scheme, by <set> rewriting an href and by an external <use>. So asset
   SVGs are held to an ALLOW list instead, tested after character references
   are decoded and whitespace and control characters are removed (the URL
   parser ignores them inside a scheme):
   - only static SVG elements (shapes, text, gradients, filters, clip paths,
     masks, markers, <use>, <image>, <style>, non-href animation). No <a>, no
     <script>, no <foreignObject>, no <set>, nothing namespaced;
   - no event handler attribute, no namespace other than SVG and XLink, no
     xml:base;
   - no URL in any attribute or stylesheet except a #fragment inside the file:
     no javascript:, vbscript: or data: anywhere, no external href or url(),
     no @import;
   - no <!DOCTYPE> or <!ENTITY> (an entity can spell a URL the screen cannot
     see) and no processing instruction such as <?xml-stylesheet?>.
   Anything the tokenizer cannot read is refused rather than trusted. */
const SVG_ELEMENTS = new Set([
  'svg', 'g', 'defs', 'desc', 'title', 'metadata', 'symbol', 'use', 'switch', 'view',
  'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'path', 'image',
  'text', 'tspan', 'textPath',
  'linearGradient', 'radialGradient', 'stop', 'pattern', 'clipPath', 'mask', 'marker', 'style',
  'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feDropShadow', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence',
  'animate', 'animateTransform', 'animateMotion', 'mpath',
]);
const REFUSED_WHY = {
  a: 'an <a> link', script: 'a <script>', foreignObject: 'a <foreignObject> (it embeds HTML)',
  set: 'a <set> animation (it can rewrite a link)', iframe: 'an <iframe>', object: 'an <object>', embed: 'an <embed>',
};
const NAMESPACES = new Set(['http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xlink']);
const XML_ENTITIES = new Set(['amp', 'lt', 'gt', 'quot', 'apos']);
/* What the URL parser skips inside a scheme, plus every other space or
   invisible character, so "java\nscript:" and "java&#x09;script:" compare
   as "javascript:". */
const INVISIBLE = [[0x00, 0x20], [0x7f, 0xa0], [0xad, 0xad], [0x1680, 0x1680], [0x180e, 0x180e], [0x2000, 0x200f],
  [0x2028, 0x202f], [0x205f, 0x2064], [0x3000, 0x3000], [0xfeff, 0xfeff]];
const compact = (v) => [...v].filter((ch) => {
  const c = ch.codePointAt(0);
  return !INVISIBLE.some(([a, b]) => c >= a && c <= b);
}).join('').toLowerCase();

function urlProblems(value, where, say) {
  const c = compact(value);
  const scheme = c.match(/(javascript|vbscript|livescript|data):/);
  if (scheme) say(`a ${scheme[1]}: URL in ${where}`);
  if (c.includes('@import')) say(`an @import in ${where}`);
  for (const m of c.matchAll(/url\((['"]?)(.*?)\1\)/g)) {
    if (!m[2].startsWith('#')) say(`a url(${m[2].slice(0, 60)}) in ${where} that is not a #fragment inside the file`);
  }
  if (/expression\(|behavior:|-moz-binding/.test(c)) say(`a script-capable CSS construct in ${where}`);
}

function svgProblems(text) {
  const out = new Set();
  const say = (m) => out.add(m);
  const s = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).replace(/^\s*<\?xml\s(?:[^?]|\?(?!>))*\?>/, '');
  const TAG = /<([A-Za-z_][\w.:-]*)((?:\s+[^\s=/>"']+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/y;
  const END = /<\/([A-Za-z_][\w.:-]*)\s*>/y;
  const ATTR = /([^\s=/>"']+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  const stack = [];
  const styleText = (t) => { if (stack.at(-1) === 'style') urlProblems(decodeRefs(t), '<style>', say); };
  let i = 0;
  while (i < s.length) {
    const lt = s.indexOf('<', i);
    styleText(s.slice(i, lt < 0 ? s.length : lt));
    if (lt < 0) break;
    if (s.startsWith('<!--', lt)) {
      const e = s.indexOf('-->', lt + 4);
      if (e < 0) { say('an unterminated comment'); break; }
      i = e + 3; continue;
    }
    if (s.startsWith('<![CDATA[', lt)) {
      const e = s.indexOf(']]>', lt);
      if (e < 0) { say('an unterminated CDATA section'); break; }
      if (stack.at(-1) === 'style') urlProblems(s.slice(lt + 9, e), '<style>', say);
      i = e + 3; continue;
    }
    if (s.startsWith('<!', lt)) { say('a <!DOCTYPE> or <!ENTITY> declaration (an entity can spell out a URL)'); i = lt + 2; continue; }
    if (s.startsWith('<?', lt)) { say('a processing instruction such as <?xml-stylesheet?> (it can load a stylesheet or XSLT)'); i = lt + 2; continue; }
    END.lastIndex = lt;
    let m = END.exec(s);
    if (m) { stack.pop(); i = END.lastIndex; continue; }
    TAG.lastIndex = lt;
    m = TAG.exec(s);
    if (!m) { say(`markup the screen cannot read: ${JSON.stringify(s.slice(lt, lt + 40))}`); i = lt + 1; continue; }
    const name = m[1];
    if (name.includes(':')) say(`a namespaced element <${name}>`);
    else if (!SVG_ELEMENTS.has(name)) say(REFUSED_WHY[name] || `a <${name}> element, which is not on the asset SVG allow list`);
    for (const a of m[2].matchAll(ATTR)) {
      const attr = a[1];
      const raw = a[2] ?? a[3];
      const lower = attr.toLowerCase();
      const local = lower.replace(/^.*:/, '');
      const value = decodeRefs(raw);
      for (const e of raw.matchAll(/&([A-Za-z][\w.-]*);/g)) {
        if (!XML_ENTITIES.has(e[1])) say(`an entity reference &${e[1]}; in ${attr}, which XML only knows from a DTD`);
      }
      if (local.startsWith('on')) say(`an event handler attribute (${attr})`);
      if (lower === 'xmlns' || lower.startsWith('xmlns:')) {
        if (!NAMESPACES.has(value.trim())) say(`a namespace declaration for ${value.trim().slice(0, 60)} (only SVG and XLink are allowed)`);
      } else if (attr.includes(':') && !/^(xlink:[\w-]+|xml:(space|lang))$/i.test(attr)) {
        say(`a namespaced attribute ${attr}`);
      }
      urlProblems(value, `${name} ${attr}`, say);
      const c = compact(value);
      if ((local === 'href' || local === 'src') && c && !c.startsWith('#')) {
        say(`an ${attr} that leaves the file (${JSON.stringify(value.trim().slice(0, 60))}); only #fragment references are allowed`);
      }
      if (/^animate/.test(name) && local === 'attributename' && /^(xlink:)?href$/.test(c)) say(`an <${name}> that rewrites href`);
    }
    if (!m[3]) stack.push(name);
    i = TAG.lastIndex;
  }
  return [...out];
}
const unsafeSvg = [];
function assetOk(f) {
  if (!ASSET_TYPES.test(f)) return false;
  if (!/\.svg$/i.test(f)) return true;
  const why = svgProblems(fs.readFileSync(path.join(root, f), 'utf8'));
  if (why.length) unsafeSvg.push(`${f}: ${why.join('; ')}`);
  return !why.length;
}
/* Exactly the brand files something outside this repository loads. The email
   signature already sent embeds this URL; nothing else in brand/ is loaded by
   a page, the engine or a sent email. Adding one here is a deliberate choice. */
const BRAND = new Set(['brand/signature/nevamis-signature.gif']);
const DIRS = [
  { dir: 'assets/', ok: assetOk },
  { dir: 'talk/', ok: (f) => f === 'talk/index.html' || f === 'talk/talk.js' },
  { dir: '.well-known/', ok: (f) => f === '.well-known/security.txt' },
  { dir: 'brand/', ok: (f) => BRAND.has(f) },
];
/* Must stay reachable, or a phone line, the domain or the security contact breaks. */
const REQUIRED = ['ring.xml', 'CNAME', 'assets/ringback-tone.wav', '.well-known/security.txt', 'talk/index.html'];

const published = publishedFiles(root);
const set = new Set(published);

const unexpected = published.filter((f) => {
  if (!f.includes('/')) return !(PAGES.has(f) || ROOT_FILES.has(f));
  const d = DIRS.find((x) => f.startsWith(x.dir));
  return !d || !d.ok(f);
});
const missing = REQUIRED.filter((f) => !set.has(f));

/* THE SECURITY CONTACT MUST POINT AT THIS SITE.

   security.txt's Policy used to be github.com/.../blob/main/SECURITY.md. That
   is an address on someone else's domain, it names the repository, and it
   stops resolving the day the repository is made private, which leaves the one
   file a researcher is told to read pointing at a 404. Every URL in it must be
   on https://nevamis.ca/ and must be a file this site actually serves, so the
   policy it names can never be a page that was excluded, renamed or never
   committed. A mailto: Contact is not a URL here and is left alone. */
const securityTxtProblems = [];
{
  const file = path.join(root, '.well-known/security.txt');
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  for (const url of text.match(/https?:\/\/[^\s>]+/gi) || []) {
    const m = url.match(/^https:\/\/nevamis\.ca\/([^?#]*)/);
    if (!m) { securityTxtProblems.push(`${url} is not on https://nevamis.ca/`); continue; }
    const served = m[1] === '' || m[1].endsWith('/') ? m[1] + 'index.html' : m[1];
    if (!set.has(decodeURIComponent(served))) securityTxtProblems.push(`${url} names ${served}, which this site does not serve`);
  }
}

/* THE REPOSITORY'S OWN FRONT PAGE IS PUBLISHED TOO.

   README.md is excluded from nevamis.ca, but this repository is public and its
   README is what github.com shows, and that page is a top search result for
   the company's own name. By September 2026 it carried a retired commercial
   model in full: plan mechanics, what the price did and did not include, two
   retired offers by name and a note that they were retired. None of that is
   checked anywhere else, because every copy guard reads the pages.

   What the business sells, and on what terms, lives on the site and is checked
   there; the README links to it. So the rule is not "the README states the
   right price" but "the README states no commercial fact at all": a figure it
   does not carry cannot go stale. Each pattern is the SHAPE of such a fact, so a
   new wording of an old mistake still fails. */
const README_FORBIDDEN = [
  [/(?:C\$|CA\$|\$)\s?\d/i, 'a money figure'],
  [/\b(?:dollars?|bucks|CAD|USD)\b/i, 'a money figure in words'],
  [/\b\d{9}\s?R[TP]\s?\d{4}\b/i, 'a CRA business or tax account number'],
  [/\b(?:GST|HST|PST)\b/i, 'a sales tax registration or rate'],
  [/\b(?:set-?up|activation|onboarding|launch)[\s-]+(?:fee|charge)s?\b/i, 'a one-time fee'],
  [/\b(?:pilot|trial|free period|discount|money-back|guarantee)\b/i, 'an offer term'],
  [/\b(?:months?|weeks?|days?)\s+(?:free|at no (?:charge|cost)|on us)\b|\bfree\s+(?:months?|weeks?|days?)\b|\bfirst\s+(?:month|week)\b/i, 'a free period'],
  [/\b(?:minimum|fixed|initial)\s+(?:term|commitment|contract|period)\b|\b(?:\d+|one|two|three|four|six|nine|twelve|eighteen|twenty-four)[\s-](?:month|year)s?\b|\bper\s+(?:month|year)\b|\ba\s+(?:month|year)\b|\/(?:mo|month|yr|year)\b/i, 'a term or billing period'],
  [/\bretired\b/i, 'a note about what the business no longer offers or says'],
];
/* The rule checks itself on every run. Each MUST_CATCH line is a wording that
   once got past an earlier version of these patterns (or its obvious sibling);
   each MUST_PASS line is ordinary developer prose from this README that a
   too-greedy pattern would start failing. Loosening a pattern until one of
   these flips fails the check, not a later README. */
const README_MUST_CATCH = [
  'C$450 a month', 'CA$ 450', '$450', '450 dollars a month', 'four hundred and fifty dollars',
  '123456789 RT0001', 'GST included', 'plus HST',
  'no setup fee', 'no setup-fee', 'no set-up fee', 'an activation charge',
  'a 30-day pilot', 'try the trial', 'money-back guarantee',
  'first month free', 'two months free', 'free months for referrals',
  'minimum term of 3 months', 'a 12-month term', 'a three-month commitment', 'billed per month', 'from 450/mo',
  'the retired offer',
];
const README_MUST_PASS = [
  'Pages serves the `main` branch at nevamis.ca, and a commit on `main` is live within about a minute.',
  'Prices come from `pricing-config.js`. Where a page carries a figure as text,',
  'node serve.js 3222       # another port, or set NV_PORT',
  'You need Node 22 (what CI uses). Python 3 is needed only to rebuild the homepage.',
  '| every page in `content-map.json` | `node scripts/build-search-index.mjs` | `search-index.json` |',
];
const readmeSelfTest = [];
for (const s of README_MUST_CATCH) if (!README_FORBIDDEN.some(([re]) => re.test(s))) readmeSelfTest.push(`misses "${s}"`);
for (const s of README_MUST_PASS) {
  const hit = README_FORBIDDEN.find(([re]) => re.test(s));
  if (hit) readmeSelfTest.push(`wrongly flags "${s}" as ${hit[1]}`);
}
const readmeProblems = [];
{
  const file = path.join(root, 'README.md');
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  text.split(/\r?\n/).forEach((line, i) => {
    for (const [re, what] of README_FORBIDDEN) {
      const hit = line.match(re);
      if (hit) readmeProblems.push(`README.md:${i + 1} carries ${what} ("${hit[0]}")`);
    }
  });
}

if (missing.length) console.error('MUST BE PUBLISHED but is not (excluded, hidden or untracked):\n  ' + missing.join('\n  '));
if (unsafeSvg.length) console.error('ASSET SVG OUTSIDE THE ALLOW LIST. Opened directly it could run code or load something on the nevamis.ca origin. '
  + 'Asset SVGs may hold only static SVG elements and #fragment references: no links, script, event handlers, foreignObject, <set>, DTDs or processing instructions, '
  + 'and no javascript:, data: or external URL in any attribute or stylesheet. Remove what is listed, or re-export the file as plain SVG:\n  ' + unsafeSvg.join('\n  '));
if (unexpected.length) {
  const byTop = {};
  for (const f of unexpected) { const t = f.split('/')[0]; (byTop[t] = byTop[t] || []).push(f); }
  console.error(`PUBLISHED BUT NOT ALLOWED (${unexpected.length} files). Exclude them in _config.yml, or allow them in scripts/check-published-surface.mjs if they are meant to be public:`);
  for (const [t, files] of Object.entries(byTop)) console.error(`  ${t}: ${files.length} file(s), e.g. ${files.slice(0, 3).join(', ')}`);
}
if (securityTxtProblems.length) console.error('SECURITY.TXT POINTS OFF THIS SITE. Every URL in .well-known/security.txt must be a file served on https://nevamis.ca/ '
  + '(the Policy is security.html):\n  ' + securityTxtProblems.join('\n  '));
if (readmeProblems.length) console.error('README.MD STATES A COMMERCIAL FACT. This repository is public and its README is a search result for the company. '
  + 'Link to nevamis.ca/pricing.html or nevamis.ca/terms.html instead of stating it:\n  ' + readmeProblems.join('\n  '));
if (readmeSelfTest.length) console.error('THE README RULE FAILS ITS OWN EXAMPLES. Fix README_FORBIDDEN in scripts/check-published-surface.mjs so it catches every README_MUST_CATCH line and none of README_MUST_PASS:\n  '
  + readmeSelfTest.join('\n  '));
if (missing.length || unexpected.length || securityTxtProblems.length || readmeProblems.length || readmeSelfTest.length) process.exitCode = 1;
else console.log(`Published surface OK: ${published.length} files, all intended; security.txt points at nevamis.ca; README.md states no commercial fact.`);
