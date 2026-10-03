#!/usr/bin/env node
/* ============================================================
   DOES THE PRIVACY PAGE DESCRIBE WHAT THE SITE ACTUALLY DOES?

     node scripts/check-legal-truth.mjs     exit 0 true, 1 a promise is broken

   privacy.html, terms.html and security.html are the pages a buyer is bound
   by and the pages a regulator reads. The whole-site audit of 2026-10-03 found
   them describing a smaller site than the one that ships (findings LEGAL-10
   to LEGAL-17, MACHINE-22, MACHINE-25, CHECK-RUNNER-7):

   - "It stores two small things in your browser, and neither ever leaves your
     device", while the browser call on /talk/ let the ElevenLabs widget
     fingerprint the device, store the result and send it to ElevenLabs;
   - "no requests to Google or any other font provider", while the /talk/
     policy allowed the widget's Google Fonts import;
   - a demo section that knew only the phone line;
   - "campaign tags" and "no identifiers are stored", while three ad click
     IDs were in the allowlist;
   - "page views and button clicks", while scroll depth was counted too;
   - two names for one product, one sentence twice, a date with no day;
   - Terms naming "the privacy policy" twice without linking it, both legal
     pages on a footer with no legal links, and the security page linked from
     nowhere.

   Every one of those was a sentence that had been true once and was not
   re-read when the code under it changed. So these rules do not compare the
   page to a frozen copy of itself; each one reads the CODE that makes the
   claim true or false and fails when the two disagree. A rule that only
   pinned today's wording would pass the day someone adds a fourth click ID or
   a second font host, which is the day it matters.

   Scope is the legal pages, plus the few site-wide facts those pages make
   promises about (every page's policy, every served script). It is pure
   file reads, like check-consistency.js, and runs in CI beside it.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publishedFiles } from './lib/published-files.mjs';
import { decodeRefs } from './lib/char-refs.mjs';
import { stripJsComments, jsStringLiterals, renderedProse } from './lib/rendered-text.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const problems = [];
const fail = (rule, msg) => problems.push(`[${rule}] ${msg}`);

/* The pages this guard holds to the legal-page rules. 404.html joins them for
   the share-card and description rules only: it is not legal text, but it is
   served for every dead link, so it previews more often than any of them. */
const LEGAL = ['privacy.html', 'terms.html', 'security.html'];
const META_PAGES = [...LEGAL, '404.html'];
const PUBLISHED = publishedFiles(root);
const HTML = PUBLISHED.filter((f) => /\.html?$/i.test(f));

/* ---------- reading a page the way a visitor does ---------- */
const MORE_REFS = { rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', nbsp: ' ',
  middot: '·', hellip: '…', ndash: '–', mdash: '—', copy: '©', rarr: '→' };
const decode = (s) => decodeRefs(s).replace(/&([a-z]+);/gi, (m, n) => MORE_REFS[n.toLowerCase()] ?? m);
const stripMarkup = (html) => html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');
const textOf = (html) => decode(stripMarkup(html).replace(/<[^>]+>/g, ' '))
  .replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const mainOf = (html) => (html.match(/<main\b[\s\S]*?<\/main>/i) || [''])[0];
/** The <h2> sections of a page's main content, as { heading, text }. */
const sectionsOf = (html) => stripMarkup(mainOf(html)).split(/(?=<h2\b)/i).slice(1).map((chunk) => ({
  heading: textOf((chunk.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i) || ['', ''])[1]),
  text: textOf(chunk),
}));
const sentencesOf = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/).map((s) => s.trim()).filter(Boolean);
const metaOf = (html, attr, name) => {
  const re = new RegExp(`<meta\\s+${attr}="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i');
  const m = html.match(re);
  return m ? decode(m[1]) : null;
};

const privacyHtml = read('privacy.html');
const privacyText = textOf(mainOf(privacyHtml));
const siteJs = read('site.js');

/* =====================================================================
   1. THE BROWSER CALL STORES NO IDENTIFIER (LEGAL-10)

   Left to itself the pinned ElevenLabs widget runs `userId ||= await FC()`,
   and FC() fingerprints the device with FingerprintJS, stores the result in
   localStorage and sends it to ElevenLabs. It skips all of that when the
   element carries a `user-id` attribute. So: talk.js must set one, it must be
   a fixed string (a random, timed or hashed value is an identifier again),
   and the widget talk.js actually loads must still honour the attribute. A
   widget upgrade that renames it fails here, which is the moment to re-read
   what the new version stores. talk.js itself may store nothing.
   ===================================================================== */
{
  const talk = read('talk/talk.js');
  const code = stripJsComments(talk);
  const set = code.match(/setAttribute\(\s*["']user-id["']\s*,\s*([^)]+?)\s*\)/);
  if (!set) {
    fail('browser-call-id', 'talk/talk.js does not give the widget a user-id attribute, so the widget fingerprints the visitor\'s device, '
      + 'stores the result in their browser and sends it to ElevenLabs. privacy.html says the opposite. Set a fixed user-id.');
  } else {
    let value = set[1];
    const ident = value.match(/^[A-Za-z_$][\w$]*$/);
    if (ident) {
      const decl = code.match(new RegExp(`(?:var|let|const)\\s+${ident[0]}\\s*=\\s*([^;\\n]+);`));
      value = decl ? decl[1].trim() : '';
    }
    if (!/^(["'])[\w.-]{3,64}\1$/.test(value)) {
      fail('browser-call-id', `talk/talk.js sets the widget's user-id to ${JSON.stringify(set[1])}, which is not one fixed string. `
        + 'Anything computed per visitor (random, a timestamp, a hash, a stored value) is an identifier sent to ElevenLabs, '
        + 'and privacy.html promises none. Use one constant for every browser call, or change the privacy page first.');
    }
  }
  if (/\b(?:localStorage|sessionStorage|indexedDB)\b|document\.cookie/.test(code)) {
    fail('browser-call-id', 'talk/talk.js touches browser storage. privacy.html says the site\'s own pages store two things, both in site.js.');
  }
  const widgetPath = (talk.match(/["'](\/assets\/vendor\/[^"']+\.js)["']/) || [])[1];
  if (!widgetPath || !fs.existsSync(path.join(root, widgetPath.slice(1)))) {
    fail('browser-call-id', `talk/talk.js loads ${widgetPath || 'no widget'}, which is not a file in this repository.`);
  } else {
    const w = read(widgetPath.slice(1));
    const readsAttr = /\(\s*`user-id`\s*\)|\(\s*["']user-id["']\s*\)/.test(w);
    const usesIt = /userId:\s*\w+\.value\s*\|\|\s*void 0/.test(w);
    const fallbackOnlyWhenEmpty = /userId\s*\|\|=\s*await\s+\w+\(\)/.test(w);
    if (!(readsAttr && usesIt && fallbackOnlyWhenEmpty)) {
      fail('browser-call-id', `${widgetPath} no longer reads a user-id attribute in the shape this guard verified for 0.18.2 `
        + '(Ey(`user-id`) -> userId:d.value||void 0, then userId||=await FC()). Re-read what this version stores and sends '
        + 'before trusting the fixed label in talk.js, and update privacy.html and this rule together.');
    }
  }
}

/* =====================================================================
   2. NO FONT PROVIDER, ON ANY PAGE (LEGAL-11)

   privacy.html says our pages, the browser call included, request no fonts
   from Google or any other font provider. That is true only while no served
   page's Content-Security-Policy lets a font or stylesheet in from another
   host: the widget's stylesheet @imports Google Fonts, and the /talk/ policy
   allowed it. The policy is what decides, so the policy is what is read.
   ===================================================================== */
if (/font provider/i.test(privacyText)) {
  for (const f of HTML) {
    const html = read(f);
    const csp = (html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/i) || [])[1];
    if (!csp) continue; // build-csp.mjs --check owns "every page has a policy"
    for (const dir of ['font-src', 'style-src']) {
      const m = csp.match(new RegExp(`(?:^|;)\\s*${dir}\\s+([^;]*)`));
      const hosts = m ? m[1].split(/\s+/).filter((s) => /^(?:https?:|wss?:|\*|\/\/)/i.test(s) || /\.[a-z]{2,}(?:\/|$)/i.test(s)) : [];
      if (hosts.length) fail('font-provider', `${f} allows ${dir} ${hosts.join(' ')}, but privacy.html says no page requests fonts `
        + 'from any font provider. Drop the host from scripts/build-csp.mjs, or change the privacy page in the same commit.');
    }
    if (/<link[^>]+href="https?:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net)/i.test(stripMarkup(html))) {
      fail('font-provider', `${f} links a hosted font service, but privacy.html says no page requests fonts from any font provider.`);
    }
  }
} else {
  fail('font-provider', 'privacy.html no longer says how fonts are served. Say it, so this rule has a promise to hold the pages to.');
}

/* =====================================================================
   3. THE DEMO SECTION COVERS THE BROWSER CALL (LEGAL-11)

   /talk/ is served and the dial dialog on every page links it. A browser call
   sends microphone audio to ElevenLabs and is recorded, and the privacy page
   has to say so where it describes the demo, not only in the fine print of
   the call page itself.

   The fixed user-id (section 1) stops the widget fingerprinting the device
   and storing an ID for it. It does not make the visitor anonymous: a browser
   call is a live connection to ElevenLabs, so ElevenLabs receives the
   visitor's IP address, as do the hosts that serve the widget's images and
   audio component. So the section must name the IP address, and it may never
   promise the call "does not identify" the visitor or the device, which no
   network connection can promise.
   ===================================================================== */
if (PUBLISHED.includes('talk/index.html')) {
  const demo = sectionsOf(privacyHtml).find((s) => /\bdemo\b/i.test(s.heading));
  if (!demo) fail('demo-section', 'privacy.html has no section about the demo, but nevamis.ca/talk/ runs a recorded browser call.');
  else {
    if (!/\bbrowser\b/i.test(demo.heading)) fail('demo-section', `privacy.html's demo section is headed "${demo.heading}", which covers the phone line only. Name the browser call in the heading.`);
    for (const [re, what] of [[/\bbrowser\b/i, 'the browser call'], [/\bmicrophone\b/i, 'the microphone'],
      [/\bElevenLabs\b/, 'ElevenLabs, which receives the audio'], [/\brecorded\b/i, 'that the call is recorded']]) {
      if (!re.test(demo.text)) fail('demo-section', `privacy.html's demo section does not mention ${what}.`);
    }
    if (!/\bIP address/i.test(demo.text)) {
      fail('demo-section', 'privacy.html\'s demo section does not say that ElevenLabs receives the caller\'s IP address. '
        + 'A browser call is a live connection to ElevenLabs; the fixed label stops fingerprinting, not that.');
    }
    const overclaim = demo.text.match(/\b(?:does not|doesn't|never|cannot|won't|will not)\s+(?:\w+\s+){0,2}identify\b[^.]*/i)
      || demo.text.match(/\banonymous(?:ly)?\b[^.]*/i);
    if (overclaim) {
      fail('demo-section', `privacy.html's demo section says "${overclaim[0].trim()}". ElevenLabs receives the caller's IP address, `
        + 'so say what the fixed label guarantees (no fingerprint, no stored ID), not that the call identifies no one.');
    }
  }
}

/* =====================================================================
   4. CLICK IDS ARE NAMED WHILE ANY IS COLLECTED (LEGAL-12)

   NV_ATTRIB_KEYS in site.js is the one list of URL parameters that may leave
   a visitor's browser. Anything in it that is not a utm_ tag is an ad
   platform's click ID, unique per click. While one is collected the privacy
   page must name click IDs and must not promise that no identifiers are
   stored. Read from the list, so a fourth click ID needs no edit here.
   ===================================================================== */
{
  const list = siteJs.match(/var NV_ATTRIB_KEYS\s*=\s*\[([^\]]*)\]/);
  if (!list) fail('click-ids', 'site.js has no NV_ATTRIB_KEYS list; this rule cannot see what campaign data leaves the browser.');
  else {
    const keys = [...list[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]);
    const clickIds = keys.filter((k) => !/^utm_/.test(k));
    if (clickIds.length) {
      if (!/click ID/i.test(privacyText)) fail('click-ids', `site.js sends ${clickIds.join(', ')}, which are ad click IDs, and privacy.html does not name click IDs.`);
      const promise = privacyText.match(/no identifiers? (?:are|is|will be) (?:stored|kept|collected)/i);
      if (promise) fail('click-ids', `privacy.html says "${promise[0]}" while site.js collects ${clickIds.join(', ')}.`);
    }
  }
}

/* =====================================================================
   5. WHAT IS COUNTED IS WHAT THE PAGE SAYS IS COUNTED (LEGAL-15)

   Each family of event site.js sends maps to the words the privacy page has
   to use for it. A new family with no row here is not caught, which is the
   accepted limit: the list is short and lives next to the rule it serves.
   ===================================================================== */
{
  const code = stripJsComments(siteJs);
  /* Only the sentence that says what is counted can make the promise. The
     word "scroll" elsewhere on the page (the booking calendar loads when you
     scroll to it) says nothing about counting, and an earlier version of this
     rule, which read the whole page, passed on it. */
  const counting = sentencesOf(privacyText).filter((s) => /\bwe count\b/i.test(s)).join(' ');
  if (!counting) fail('counting', 'privacy.html no longer has a sentence saying what "we count", so this rule has nothing to hold to the code.');
  const FAMILIES = [
    [/nvTrack\(\s*["'](?:scroll_depth_|section_reached_)/, /\bscroll/i, 'how far down a page a visitor scrolls (scroll_depth_*, section_reached_*)'],
    [/data-evt/, /button clicks/i, 'button clicks (data-evt)'],
    [/landing_page_view|nvSend\(/, /page views/i, 'page views'],
  ];
  for (const [sent, said, what] of FAMILIES) {
    if (counting && sent.test(code) && !said.test(counting)) fail('counting', `site.js counts ${what}, and privacy.html's sentence about what we count does not say so.`);
  }
}

/* =====================================================================
   6. THE PRIVACY PAGE IS DATED TO THE DAY (LEGAL-17)
   ===================================================================== */
{
  const MONTH = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
  if (!new RegExp(`Last updated:? ${MONTH} \\d{1,2}, \\d{4}`).test(privacyText)) {
    fail('dated', 'privacy.html\'s "Last updated" line is not a full date (Month D, YYYY). A month alone cannot say which version a reader saw.');
  }
}

/* =====================================================================
   7. NO SENTENCE TWICE ON A LEGAL PAGE (LEGAL-17)

   "It is written to be read, not to hide things" opened the privacy page and
   was repeated two paragraphs later. On a legal page a repeated sentence is
   either padding or, worse, two copies that will be edited apart.
   ===================================================================== */
/* Whole sentences, compared without case or punctuation. Terms deliberately
   restates one CLAUSE (month to month from the first month) in its billing
   and its cancellation sections, each time inside a different sentence, so
   clause-level matching would flag the one repetition that is on purpose.
   Each <h2> is its own block, so a heading never glues onto a sentence. */
const blocksOf = (f) => stripMarkup(mainOf(read(f))).split(/<\/?(?:h[1-6]|p|li|dd|dt)\b[^>]*>/i).map(textOf).filter(Boolean);
const wordsOf = (s) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
for (const f of LEGAL) {
  const seen = new Set();
  for (const s of blocksOf(f).flatMap(sentencesOf)) {
    const key = wordsOf(s);
    if (key.split(' ').length < 5) continue;
    if (seen.has(key)) fail('repeated', `${f} says "${s}" twice.`);
    seen.add(key);
  }
}

/* The privacy page's duplicate was not a whole sentence: "It is written to be
   read, not to hide things" and "This page is written to be read, not to hide
   things, and it is not legal advice" differ in their first words. So on the
   privacy and security pages, which have no change history quoting their own
   body, the same run of eight words may not appear in two paragraphs. (Terms
   is exempt: its change history restates the terms it changed, on purpose.)

   DELIBERATE lists the one repetition that is waiting on someone else. Both
   client-data paragraphs on the privacy page defer retention to "the written
   agreement", which a self-serve client never signs (LEGAL-13); counsel is
   rewriting both. When that text changes the entry stops matching, and this
   rule fails until the entry is deleted, so it cannot outlive its reason. */
const SHINGLE = 8;
const DELIBERATE = [
  { file: 'privacy.html', run: 'are kept and how to get them back or have them deleted',
    why: 'LEGAL-13: retention for account data is deferred to the written agreement twice, held for counsel' },
];
for (const f of LEGAL.filter((x) => x !== 'terms.html')) {
  const allowed = DELIBERATE.filter((d) => d.file === f);
  const first = new Map();
  const repeated = new Set();
  blocksOf(f).forEach((b, bi) => {
    const w = wordsOf(b).split(' ');
    for (let i = 0; i + SHINGLE <= w.length; i++) {
      const run = w.slice(i, i + SHINGLE).join(' ');
      if (first.has(run) && first.get(run) !== bi) repeated.add(run);
      else if (!first.has(run)) first.set(run, bi);
    }
  });
  const used = new Set();
  for (const run of repeated) {
    const d = allowed.find((a) => wordsOf(a.run).includes(run));
    if (d) { used.add(d); continue; }
    fail('repeated', `${f} repeats "${run}" in two paragraphs. Say it once.`);
  }
  for (const d of allowed) if (!used.has(d)) {
    fail('repeated', `${f} no longer repeats "${d.run}" (${d.why}). Delete its DELIBERATE entry in scripts/check-legal-truth.mjs.`);
  }
}

/* =====================================================================
   8. ONE NAME FOR THE QUOTE PRODUCT ON THE LEGAL PAGES (LEGAL-17)

   Terms and pricing sell the add-on under its pricing-config.js name; the
   homepage calls the capability "Quote Recovery". On a legal page the sold
   name is the one that binds, so the capability name may appear only as a
   gloss on it: "<sold name> (Quote Recovery)". The footer is outside <main>
   and speaks the homepage's language on every page, which is fine.
   ===================================================================== */
{
  const sold = (read('pricing-config.js').match(/id:\s*"quote_chase",\s*name:\s*"([^"]+)"/) || [])[1];
  if (!sold) fail('product-name', 'pricing-config.js has no quote_chase add-on name to hold the legal pages to.');
  else {
    for (const f of LEGAL) {
      const t = textOf(mainOf(read(f))).split(`${sold} (Quote Recovery)`).join('');
      if (/Quote Recovery/.test(t)) fail('product-name', `${f} calls the quote add-on "Quote Recovery" on its own. Call it the ${sold}, or "${sold} (Quote Recovery)".`);
    }
  }
}

/* =====================================================================
   9. "THE PRIVACY POLICY" IS A LINK, WHEREVER IT IS NAMED (LEGAL-16)

   Site-wide: any page that refers a reader to the privacy policy links it.
   Terms did so twice in plain text, on the page a buyer is bound by.
   ===================================================================== */
for (const f of HTML.filter((x) => x !== 'privacy.html')) {
  const body = stripMarkup((read(f).match(/<body\b[\s\S]*<\/body>/i) || [''])[0])
    .replace(/<a\b[^>]*href="(?:https:\/\/nevamis\.ca)?\/privacy\.html[^"]*"[^>]*>[\s\S]*?<\/a>/gi, ' ');
  const hit = textOf(body).match(/.{0,50}\bprivacy policy\b.{0,20}/i);
  if (hit) fail('privacy-link', `${f} names the privacy policy without linking /privacy.html: "...${hit[0].trim()}..."`);
}

/* =====================================================================
   10. NO OFFER WORD IN A LEGAL PAGE'S HEADINGS (LEGAL-14)

   The owner rule keeps "pilot", "trial", "free period" and "discount" off
   every buyer surface. Terms still has to record, in its body, that the old
   pilot is retired; a heading made of the banned words is not that record,
   it is a signpost to an offer that does not exist.
   ===================================================================== */
for (const f of LEGAL) {
  for (const h of mainOf(read(f)).matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const t = textOf(h[2]);
    if (/\b(?:pilots?|trials?|free periods?|discounts?)\b/i.test(t)) fail('offer-words', `${f} has the heading "${t}".`);
  }
}

/* =====================================================================
   11. THE LEGAL PAGES CARRY THE WHOLE FOOTER, AND IT LINKS ALL THREE (LEGAL-16)
   ===================================================================== */
{
  const LEGAL_LINKS = LEGAL.map((f) => `/${f}`);
  const legalColOf = (html) => {
    const m = html.match(/<h2 class="foot-h">Legal<\/h2>([\s\S]*?)<\/div>/);
    return m ? [...m[1].matchAll(/href="([^"]+)"/g)].map((x) => x[1]) : null;
  };
  const partial = legalColOf(read('_partials/footer.html'));
  if (!partial) fail('footer', '_partials/footer.html has no Legal column.');
  else for (const l of LEGAL_LINKS) if (!partial.includes(l)) fail('footer', `_partials/footer.html's Legal column does not link ${l}.`);

  const base = (read('scripts/build-pages.mjs').match(/const FOOTER_BASE_ONLY = new Set\(\[([^\]]*)\]\)/) || [])[1];
  if (base === undefined) fail('footer', 'scripts/build-pages.mjs no longer declares FOOTER_BASE_ONLY where this rule can read it.');
  else for (const f of LEGAL) if (base.includes(`'${f}'`) || base.includes(`"${f}"`)) {
    fail('footer', `scripts/build-pages.mjs gives ${f} the compact footer, which has no legal links.`);
  }
  /* The whole footer, not only its Legal column: check-consistency.js
     compares the Site column on the marketing pages and has never looked at
     these three, so a legal page could keep the links and lose the contact
     details beside them without anything noticing. */
  const footerOf = (html) => ((html.match(/<footer class="site-footer">[\s\S]*?<\/footer>/) || [''])[0]).replace(/\s+/g, ' ').trim();
  const fullFooter = footerOf(read('_partials/footer.html'));
  for (const f of LEGAL) {
    const html = read(f);
    const col = legalColOf(html);
    if (!col) fail('footer', `${f} has no footer Legal column. Run node scripts/build-pages.mjs.`);
    else if (partial && col.join(' ') !== partial.join(' ')) fail('footer', `${f}'s footer Legal column differs from _partials/footer.html. Run node scripts/build-pages.mjs.`);
    else if (footerOf(html) !== fullFooter) fail('footer', `${f}'s footer differs from _partials/footer.html. Run node scripts/build-pages.mjs.`);
  }
}

/* =====================================================================
   12. SHARE CARDS AND SEARCH SNIPPETS (MACHINE-25, CHECK-RUNNER-7)

   A legal page pasted into a message previews like any other page: og:type,
   og:url and og:site_name present, og:url the page's own canonical address.
   Its meta description fits a search result (160 characters, measured after
   character references are decoded, which is what a search engine shows).
   ===================================================================== */
for (const f of META_PAGES) {
  const html = read(f);
  for (const p of ['og:type', 'og:url', 'og:site_name']) if (!metaOf(html, 'property', p)) fail('share-card', `${f} has no ${p}.`);
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || `https://nevamis.ca/${f}`;
  const ogUrl = metaOf(html, 'property', 'og:url');
  if (ogUrl && ogUrl !== canonical) fail('share-card', `${f} has og:url ${ogUrl}, but its address is ${canonical}.`);
  const site = metaOf(html, 'property', 'og:site_name');
  if (site && site !== 'Nevamis') fail('share-card', `${f} has og:site_name "${site}"; the site is "Nevamis".`);
  const desc = metaOf(html, 'name', 'description');
  if (!desc) fail('snippet', `${f} has no meta description.`);
  else if (desc.length > 160) fail('snippet', `${f}'s meta description is ${desc.length} characters; a search result cuts it after about 160.`);
}

/* =====================================================================
   13. THE DEMO IS NOT "THE SAME AGENT" A CLIENT'S CUSTOMERS REACH (MACHINE-22)

   The demo line answers for Nevamis and can set up a call with Daren; a
   client's front desk books nothing and ends the call. What they share is the
   voice. Read across every served page's text and every served script's
   string literals, because the sentence that said otherwise was built by
   site.js at runtime and no page-text rule could see it.
   ===================================================================== */
{
  const SAME_AGENT = /\bsame (?:agent|assistant|AI|receptionist|front desk)\b[^.]{0,60}\b(?:your|their|a client'?s|the client'?s) (?:own )?(?:customers|callers|clients)\b/i;
  for (const f of PUBLISHED) {
    if (f.startsWith('assets/vendor/')) continue;
    let texts = [];
    if (/\.html?$/i.test(f)) texts = [textOf(read(f))];
    else if (/\.m?js$/i.test(f)) texts = jsStringLiterals(stripJsComments(read(f))).map(renderedProse).filter(Boolean);
    for (const t of texts) {
      const hit = t.replace(/[‘’]/g, "'").match(SAME_AGENT);
      if (hit) fail('same-agent', `${f} says "${hit[0]}". The demo answers for Nevamis and can book a call with Daren; a client's front desk cannot. They share the voice, not the agent.`);
    }
  }
}

if (problems.length) {
  console.error(`LEGAL PAGES DO NOT MATCH WHAT THE SITE DOES (${problems.length}):\n  ` + problems.join('\n  '));
  process.exitCode = 1;
} else {
  console.log('Legal truth OK: the privacy page matches the browser call, the fonts, the click IDs and what is counted; '
    + 'the legal pages are dated, linked, footed and previewable; no page calls the demo a client\'s own agent.');
}
