/* ============================================================
   Generates the content-layer pages (trades, situations, and
   comparisons) plus the /solutions.html hub, from content-map.json
   and scripts/content/pages.mjs.

   Run:  node scripts/build-content.mjs
   then: node scripts/build-pages.mjs && node scripts/build-schema.mjs

   Pages are written whole each time, so the copy in pages.mjs is the
   single source of truth and hand edits to the output get overwritten.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES, PROOF_BLOCK } from './content/pages.mjs';
import { headCssBlock, readCssSources } from './lib/inline-css.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'));
const NAV = fs.readFileSync(path.join(root, '_partials/nav.html'), 'utf8').trim();
const FOOTER = fs.readFileSync(path.join(root, '_partials/footer.html'), 'utf8').trim();
const SITE = map.site;

const byFile = Object.fromEntries(map.pages.map((p) => [p.file, p]));

/* The same block build-pages.mjs writes, from the same function. This file
   used to hardcode its own <link> tags, which is how a previous run would have
   silently deleted the font preloads on nine pages: two generators, two ideas
   of what a head contains. There is now one idea. */
const CSS_BLOCK = headCssBlock(readCssSources(fs, path, root));

function head({ title, ogTitle, description, canonical }) {
  return `<!doctype html>
<html lang="en-CA" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${ogTitle || title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Nevamis">
<meta property="og:locale" content="en_CA">
<meta property="og:image" content="${SITE}/assets/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/og-default.png">
<meta name="geo.region" content="CA-AB">
<meta name="geo.placename" content="Edmonton, Alberta">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<!-- Atkinson is the body face and the only one whose swap moves the page:
     blocking each family in turn on throttled mobile gave CLS 0.1290 without
     Bricolage, 0.1285 without Spline, and 0.0005 without Atkinson. Both
     weights are here because 400 and 700 race separately and the CTA label is
     bold.

     The media query is the point. Preloading and metric-matching solve the
     same problem on different devices, and each is dead weight on the other:

                          mobile LCP   mobile CLS   desktop LCP   desktop CLS
       no preload            2,144       0.0013         220         0.0998
       both, always          2,916       0.0011         164         0.0000
       both, >=900px         2,028       0.0013         152         0.0000

     On a phone nothing arrives before first paint, so swap fires whatever
     we do. Mobile CLS is ~0.001 with no preload at all, because the
     metric-matched fallbacks in fonts.css hold the layout. There the preload
     buys nothing and costs 34 KB of a 400 kbps pipe shared with the
     render-blocking stylesheet that gates the LCP text. On a desktop the font
     does beat first paint, so the preload is what keeps CLS at zero.
     Scoping it to wide viewports takes the best column of each. -->
<link rel="preload" href="assets/fonts/atkinson-hyperlegible-400-latin.woff2" media="(min-width: 900px)" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/atkinson-hyperlegible-700-latin.woff2" media="(min-width: 900px)" as="font" type="font/woff2" crossorigin>
${CSS_BLOCK}
<style>
  /* ---------- page layout only ----------
     Every colour, surface, type step, border, bullet, label and control on
     these nine pages comes from assets/motion/site.css, inlined above. What is
     left here is the geometry this template alone has, plus the corrections a
     generated page needs that the shared sheet does not make yet. Nothing
     below restates a token.

     What used to be here and is gone: the hero's own 58px/-.03em/19ch headline
     and its clamped 19px lede (both are shared steps now, --fs-hero and
     --fs-lede); the .crumb at 13px in body grey (the shared 11px mono label
     idiom replaces it); the .related card at radius 14 over a navy 180deg
     gradient with a hover lift (it is the one card now, radius 12, the glass
     fill and the lit top edge, and it does not move on hover); and the ghost
     button's painted plate and 4px ring. */

  /* The hero's h1 margin and the phone's full-width CTA row were both patched
     here, because the shared sheet zeroed the one and never made the other.
     Both are in assets/motion/site.css now (.page-hero h1 at 14px, and one
     phone rule covering .cta, .cta-row, .ctarow and .midcta), so these nine
     pages read the same two values as the other fourteen. */
  .page-hero .cta{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}

  /* THE HERO'S SUPPORTING PARAGRAPH. It had no rule anywhere, so it rendered
     at the body step in --ink across the full 1092px column: larger, brighter
     and four times wider than the lede it is supposed to support, and on a
     phone it was the loudest block on the first screen. It is a footnote to
     the hero, so it takes the fine-print colour at the card step. Its one
     inline link was invisible - a defaults to color:inherit and no
     underline - and now carries the site's prose-link idiom. */
  .page-hero .proof{font-size:var(--fs-card);line-height:var(--lh-body);
    color:var(--ink-4);max-width:66ch;margin-top:20px}
  .page-hero .proof a{color:var(--mint);text-decoration:underline;
    text-underline-offset:3px;text-decoration-color:rgba(159,240,206,.45)}
  .page-hero .proof a:hover{text-decoration-color:var(--mint)}

  /* The eyebrow inside a section head is guarded in site.css now: the lede
     rule carries :not(.eyebrow):not(.k):not(.doc-k), which is the same kind of
     guard the card rule already had. The copy that stood here is gone. */

  /* CARD COPY IS THE CARD STEP. A homepage card sets its body at 15px in
     --ink-2; the shared .proc, .stack and .pstep rules still carry the
     interior's 14.5px and 13.5px at --ink-3, and a trade page shows all three
     families within one screen of each other. One step here, and the shared
     correction is reported. */
  .proc p,.stack span,.pstep p,.related span{
    font-size:var(--fs-card);line-height:var(--lh-body);color:var(--ink-2)}
  .stack strong{font-size:var(--fs-h3);letter-spacing:var(--tr-h3)}

  /* THE RELATED STRIP. Grid only: the card itself is the shared one.
     Three across, except that a row of three leaves an orphan whenever a
     strip holds two or four - which on the hub is four of the five strips,
     so the page read as a column of ragged half-rows beside a homepage whose
     industry grid always fills. Two and four both balance at two across, and
     the wider column is what the hub's long blurbs want anyway. :has is the
     only way to count children in CSS; where it is unsupported the strip
     falls back to three across, which is exactly today's layout. */
  /* The same count, applied to the shared three-up. "More of the work you
     want" holds two cards on all four trade pages, so a third of that row was
     empty on every one of them. Scoped here because .proc is shared. */
  .proc:has(>div:nth-child(2):last-child){grid-template-columns:repeat(2,1fr)}
  /* The narrow override has to repeat the same :has selector. :has takes the
     specificity of its most specific argument, so .proc:has(>div) is (0,1,1)
     and loses to the (0,3,1) rule above it even inside a media query, and the
     two cards stayed side by side at 167px each on a phone. */
  @media(max-width:900px){
    .proc,.proc:has(>div:nth-child(2):last-child){grid-template-columns:1fr}
  }

  .related{display:grid;grid-template-columns:repeat(3,1fr);gap:var(--gap)}
  .related:has(>a:nth-child(2):last-child),
  .related:has(>a:nth-child(4):last-child){grid-template-columns:repeat(2,1fr)}
  @media(max-width:860px){
    .related,
    .related:has(>a:nth-child(2):last-child),
    .related:has(>a:nth-child(4):last-child){grid-template-columns:1fr}
  }
  .related span{display:block}

  /* The numbered steps are the one card family on these pages that carries no
     lit top edge, because .pstep::before is already spoken for by the numeral.
     Its crown goes on ::after instead, so a step card and the related card
     below it on the same page are the same object. The numeral itself joins
     the page's label vocabulary: the same emerald mono at the same tracking as
     every eyebrow above it, rather than mint at .12em. .pstep markup exists on
     one page of the site, so this is not a shared component in practice. */
  .pstep::after{content:"";position:absolute;left:12px;right:12px;top:0;height:1px;
    background:var(--glow-lit);opacity:.55}
  .pstep::before{color:var(--emerald);letter-spacing:var(--tr-label)}

  /* The numbered path. list-style:none was an inline attribute on the <ol>,
     which is the marker's only suppression: .pstep::before draws the numeral
     and the native marker would sit outside a list whose padding the universal
     reset already zeroed. */
  ol.path-steps{list-style:none}

  /* The comparison note under a table: a footnote, at the footnote colour and
     a reading measure rather than the full 1092px column. */
  .foot-note{color:var(--ink-4);line-height:var(--lh-snug);max-width:var(--measure-lede)}

  /* The tick and the cross vanished their own spacing. site.css writes each
     as a backslash hex escape followed by one space, and in CSS that single
     following whitespace terminates the escape and is eaten, so the value is
     the glyph alone: every verdict on both comparison pages rendered as one
     welded word. It read correctly before the shared rule moved to escapes.
     A margin cannot be eaten. Shared rule, reported. */
  td.yes::before,td.no::before{margin-right:.42em}
  /* At 360 the table's own min-content measured 331px inside a 318px wrapper,
     so the narrowest common phone got 13px of sideways scroll on the component
     that is the whole page's argument. One more step down of cell padding and
     type below 380 takes it to 318, which is exactly the room there is, and
     both tables fit at 360, 375 and 390. Measured on both, not derived. */
  @media(max-width:380px){
    table.compare{font-size:13px}
    table.compare th,table.compare td{padding:10px 5px}
    table.compare thead th{letter-spacing:.05em}
  }
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="site-header">
  <div class="wrap">
    <a class="wordmark" href="/">
      <svg width="24" height="24" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M 15 38 A 17 17 0 0 1 49 38" stroke="#2FBF8F" stroke-width="8" stroke-linecap="round"/>
        <circle cx="32" cy="48" r="6" fill="#9FF0CE"/>
      </svg>
      <span class="wm">Ne<span class="wm-v">v</span>amis</span></a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="mainNav" aria-label="Menu">☰</button>
    ${NAV}
  </div>
</header>
`;
}

function tail() {
  return `
${FOOTER}

<script>document.documentElement.classList.remove('no-js');</script>
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/MotionPathPlugin.min.js"></script>
<script src="site.js" defer></script>
<script src="motion.js" defer></script>
<script type="module" src="assets/motion/main.js"></script>
</body>
</html>
`;
}

/** Three sibling pages for internal linking, preferring the same cluster. */
function relatedFor(file) {
  const me = byFile[file];
  const pool = map.pages.filter((p) => p.file !== file && p.url && p.cluster !== 'legal' && p.cluster !== 'system');
  const same = pool.filter((p) => p.cluster === me.cluster);
  const other = pool.filter((p) => p.cluster !== me.cluster && ['hub', 'situation', 'compare', 'trade'].includes(p.cluster));
  const picks = [...same, ...other].slice(0, 3);
  return `
<section class="tight">
  <div class="wrap">
    <div class="section-head reveal">
      <p class="eyebrow mono">Keep reading</p>
      <h2>Related pages</h2>
    </div>
    <div class="related reveal">
      ${picks.map((p) => `<a href="${p.url}"><strong>${p.title || p.nav}</strong><span>${p.blurb}</span></a>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

let built = 0;
for (const [file, content] of Object.entries(PAGES)) {
  const meta = byFile[file];
  if (!meta) { console.warn(`skip ${file}: not in content-map.json`); continue; }

  /* The brand half of the title is per page. Six pages shipped
     "| The AI Front Desk by Nevamis" (restoration without the "The"), and
     the 2026-08-27 reconciliation preserved them through `titleBrand`
     because a reconciliation is not the place to change an indexed string.
     The owner changed them on purpose on 2026-09-19 (fix plan B2a): the
     front desk is one part of Nevamis, so every content page is now
     "| Nevamis". `titleBrand` is still honoured if a row sets one. */
  const title = `${meta.title} | ${meta.titleBrand || 'Nevamis'}`;
  /* A page's own description when it has one. The lede cut at 155 characters
     stopped mid-word on seven pages, and that cut is the sentence under the
     search result (fix plan A31). The cut stays as the fallback. */
  const description = content.description || content.lede.replace(/\s+/g, ' ').trim().slice(0, 155);

  const html =
    head({ title, ogTitle: `${meta.title} | Nevamis`, description, canonical: `${SITE}${meta.url}` }) +
    `
<main id="main">
  <section class="page-hero">
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="wrap">
      <p class="crumb"><a href="/">Home</a> / <a href="/solutions.html">Solutions</a> / ${meta.nav}</p>
      <span class="eyebrow mono"><span class="dot" aria-hidden="true"></span>${meta.cluster === 'compare' ? 'Honest comparison' : meta.cluster === 'trade' ? 'Built for your trade' : 'How it works'}</span>
      <h1>${content.h1}</h1>
      <p class="lede">${content.lede}</p>
      <div class="cta">
        <a class="btn btn-primary btn-lg" href="tel:+15874130035" data-evt="demo_phone_click">Hear it answer &nbsp;›</a>
        <a class="btn btn-ghost btn-lg" href="/book.html" data-evt="hero_book_call_click">Book a 15-min call</a>
      </div>${content.heroProof ? '\n' + content.heroProof : ''}
    </div>
  </section>
${content.body}
${PROOF_BLOCK}
${relatedFor(file)}
</main>
` + tail();

  fs.writeFileSync(path.join(root, file), html);
  built++;
  console.log(`${file}: built (${description.length}-char description)`);
}

// ---------------------------------------------------------------
// The hub: every content page in one crawlable, human-usable place
// ---------------------------------------------------------------
const CLUSTERS = [
  { key: 'trade', label: 'By trade', blurb: 'The platform, tuned to how your trade actually works.' },
  { key: 'situation', label: 'By situation', blurb: 'The moments you lose revenue, and what closes each one.' },
  { key: 'compare', label: 'Compared to', blurb: 'Honest comparisons, including where the alternative wins.' },
];

const hubMeta = byFile['solutions.html'];
const hubDesc = 'Lead Generation by invitation, Quote Recovery and the AI Front Desk, by trade, by situation, and compared to voicemail and answering services.';

const hubHtml =
  head({ title: `${hubMeta.title} | Nevamis`, description: hubDesc, canonical: `${SITE}/solutions.html` }) +
  `
<main id="main">
  <section class="page-hero">
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="wrap">
      <p class="crumb"><a href="/">Home</a> / Solutions</p>
      <span class="eyebrow mono"><span class="dot" aria-hidden="true"></span>Everything in one place</span>
      <h1>Find the part of Nevamis that fits your business.</h1>
      <p class="lede">Nevamis does three things. Lead Generation, offered by invitation, finds businesses of the kind you want more of. Quote Recovery follows up the quotes you already sent. The AI Front Desk answers the calls you cannot. The pages by trade and by situation below start at the phone.</p>
      <div class="cta">
        <a class="btn btn-primary btn-lg" href="tel:+15874130035" data-evt="demo_phone_click">Hear it answer &nbsp;›</a>
        <a class="btn btn-ghost btn-lg" href="https://app.nevamis.ca/scan" data-evt="solutions_hero_scan_click">Scan my website</a>
      </div>
    </div>
  </section>
  <!-- Ranked by what each is worth to the business, not by what was built
       first: creating revenue outranks recovering it, recovering outranks
       answering, and the free scan is the way in for anyone unsure which of
       the three they need. The owner made that ranking explicit on
       2026-09-12, so the three sold things are all named here in it: Lead
       Generation, Quote Recovery, the AI Front Desk. The front-desk row
       carries no data-evt on purpose. Event names are an allowlist shared
       with the engine (src/app/api/events/route.ts) and a name that is not on
       it is dropped in silence, so an untracked link is honest where an
       invented name would be invisible and a reused one would collapse two
       destinations into one funnel row. Wording is bounded by canonical: lead generation
       is finding and scoring the businesses that fit the client's work, done
       by a person. Bid and tender work left the sold record on 2026-09-12
       (owner re-scope, mirrored in roadmap-config.js and enforced engine-side
       by src/domain/bid-claims.ts BID-4): it is arranged by hand under the
       service agreement's named-approver rule and is not part of signing up,
       so it is not described here. Nothing here
       promises automated follow-up, because nothing performs it, and nothing
       here promises a job is won. Offered by invitation since 2026-09-08
       (canonical availability private_pilot, roadmap-config.js private_pilot),
       which is a narrower claim than available and must read as one: a few
       businesses, their own agreement, the list built by hand from public
       pages, and nobody on it contacted. Never the word "pilot". -->
  <section class="tight">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow mono">By outcome</p>
        <h2>Start from what it does to your revenue.</h2>
      </div>
      <div class="related reveal">
        <a href="/book.html" data-evt="solutions_leadgen_click"><strong>Lead Generation (by invitation)</strong><span>Offered by invitation, under your own agreement, and put together by hand. A person here reads public pages and builds you a list of the businesses that fit the work you want, with the page each row came from and the day it was read. You decide every row, and nobody on the list is contacted by us.</span></a>
        <a href="/pricing.html" data-evt="solutions_recovery_click"><strong>Quote Recovery</strong><span>The quotes you sent and never heard back about, followed up for you: the day a quote goes quiet, again four days on, and again eleven days on. Each email carries your name and needs your approval before it goes. On the pricing page it is the Quote-Chase Engine.</span></a>
        <a href="/missed-calls.html"><strong>The AI Front Desk</strong><span>Answers your line when you cannot, takes the job, the address and the time the caller wants, and texts you the summary. Start with what a missed call costs you.</span></a>
        <a href="https://app.nevamis.ca/scan" data-evt="solutions_scan_click"><strong>Scan my website</strong><span>PULSE reads only what is public on your own website and quotes what it found. Where it puts a figure on something, the figure is a modelled range, not a measurement. No email required.</span></a>
      </div>
    </div>
  </section>
${CLUSTERS.map((c) => `
  <section class="tight">
    <div class="wrap">
      <div class="section-head reveal">
        <p class="eyebrow mono">${c.label}</p>
        <h2>${c.blurb}</h2>
      </div>
      <div class="related reveal">
        ${map.pages.filter((p) => p.cluster === c.key)
          /* hubTitle/hubBlurb where the hub says it differently from the
             related-links strip; falls back to the strip copy otherwise. */
          .map((p) => `<a href="${p.url}"><strong>${p.hubTitle || p.title || p.nav}</strong><span>${p.hubBlurb || p.blurb}</span></a>`).join('\n        ')}
      </div>
    </div>
  </section>`).join('\n')}
${PROOF_BLOCK}
</main>
` + tail();

fs.writeFileSync(path.join(root, 'solutions.html'), hubHtml);
console.log('solutions.html: built (hub)');

console.log(`\n${built + 1} pages generated. Now run:\n  node scripts/build-pages.mjs\n  node scripts/build-schema.mjs\n  node scripts/gen-sitemap.mjs\n  node scripts/promote.mjs`);
