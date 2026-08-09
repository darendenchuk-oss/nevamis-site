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

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'content-map.json'), 'utf8'));
const NAV = fs.readFileSync(path.join(root, '_partials/nav.html'), 'utf8').trim();
const FOOTER = fs.readFileSync(path.join(root, '_partials/footer.html'), 'utf8').trim();
const SITE = map.site;

const byFile = Object.fromEntries(map.pages.map((p) => [p.file, p]));

function head({ title, description, canonical }) {
  return `<!doctype html>
<html lang="en-CA" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${title}">
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
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="assets/motion/site.css">
<style>
  .page-hero{position:relative;padding:150px 0 60px;overflow:hidden}
  .page-hero h1{font-size:clamp(34px,5vw,58px);font-weight:700;letter-spacing:-.03em;
    line-height:1.04;margin:18px 0 0;max-width:19ch}
  .page-hero .lede{color:var(--muted);font-size:clamp(16px,1.6vw,19px);margin-top:18px;
    max-width:56ch;line-height:1.55}
  .page-hero .cta{display:flex;gap:14px;flex-wrap:wrap;margin-top:28px}
  .crumb{font-size:13px;color:var(--muted);margin-bottom:6px}
  .crumb a{color:var(--muted)}
  .crumb a:hover{color:var(--mint)}
  .related{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  @media(max-width:860px){.related{grid-template-columns:1fr}}
  .related a{display:block;padding:18px 20px;border:1px solid var(--line);border-radius:14px;
    background:linear-gradient(180deg,var(--navy-2),#0C1A25);transition:border-color .25s,transform .25s}
  .related a:hover{border-color:rgba(159,240,206,.32);transform:translateY(-2px)}
  .related strong{display:block;font-family:"Bricolage Grotesque",sans-serif;margin-bottom:5px}
  .related span{color:var(--muted);font-size:13.5px}
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

  const title = `${meta.title} | Nevamis`;
  const description = content.lede.replace(/\s+/g, ' ').trim().slice(0, 155);

  const html =
    head({ title, description, canonical: `${SITE}${meta.url}` }) +
    `
<main id="main">
  <section class="page-hero">
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="wrap">
      <p class="crumb"><a href="/">Home</a> / <a href="/solutions.html">Solutions</a> / ${meta.nav}</p>
      <span class="eyebrow"><span class="dot" aria-hidden="true"></span>${meta.cluster === 'compare' ? 'Honest comparison' : meta.cluster === 'trade' ? 'Built for your trade' : 'How it works'}</span>
      <h1>${content.h1}</h1>
      <p class="lede">${content.lede}</p>
      <div class="cta">
        <a class="btn btn-primary btn-lg" href="tel:+15874130035" data-evt="demo_phone_click">Call the live AI &nbsp;›</a>
        <a class="btn btn-ghost btn-lg" href="/book.html" data-evt="hero_book_call_click">Book a 15-min call</a>
      </div>
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
  { key: 'trade', label: 'By trade', blurb: 'Built around how your trade actually takes calls.' },
  { key: 'situation', label: 'By situation', blurb: 'The moment you are losing calls, and what closes it.' },
  { key: 'compare', label: 'Compared to', blurb: 'Honest comparisons, including where the alternative wins.' },
];

const hubMeta = byFile['solutions.html'];
const hubDesc = 'AI receptionist solutions by trade, by situation, and compared to voicemail and answering services. Every page from Nevamis in one place.';

const hubHtml =
  head({ title: `${hubMeta.title} | Nevamis`, description: hubDesc, canonical: `${SITE}/solutions.html` }) +
  `
<main id="main">
  <section class="page-hero">
    <div class="grid-lines" aria-hidden="true"></div>
    <div class="wrap">
      <p class="crumb"><a href="/">Home</a> / Solutions</p>
      <span class="eyebrow"><span class="dot" aria-hidden="true"></span>Everything in one place</span>
      <h1>Find the version of this that matches your business.</h1>
      <p class="lede">The product is the same on every page: an AI receptionist that answers your
        existing line, qualifies the caller, takes the job details, and sends you the summary. These pages
        just start from where you are.</p>
      <div class="cta">
        <a class="btn btn-primary btn-lg" href="tel:+15874130035" data-evt="demo_phone_click">Call the live AI &nbsp;›</a>
        <a class="btn btn-ghost btn-lg" href="/book.html" data-evt="hero_book_call_click">Book a 15-min call</a>
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
          .map((p) => `<a href="${p.url}"><strong>${p.title || p.nav}</strong><span>${p.blurb}</span></a>`).join('\n        ')}
      </div>
    </div>
  </section>`).join('\n')}
${PROOF_BLOCK}
</main>
` + tail();

fs.writeFileSync(path.join(root, 'solutions.html'), hubHtml);
console.log('solutions.html: built (hub)');

console.log(`\n${built + 1} pages generated. Now run:\n  node scripts/build-pages.mjs\n  node scripts/build-schema.mjs\n  node scripts/gen-sitemap.mjs\n  node scripts/promote.mjs`);
