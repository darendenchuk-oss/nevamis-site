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
if (missing.length || unexpected.length) process.exitCode = 1;
else console.log(`Published surface OK: ${published.length} files, all intended.`);
