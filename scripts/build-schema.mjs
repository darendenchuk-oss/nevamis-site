/* ============================================================
   Generates structured data from the pages themselves, so schema
   can never drift from what a visitor actually reads.

   Run after editing page content:  node scripts/build-schema.mjs
   Then promote:                    node scripts/promote.mjs

   Everything it writes lives between the generated:schema markers,
   so re-running replaces cleanly and hand-written JSON-LD above is
   left alone.
   ============================================================ */

import fs from 'node:fs';
import vm from 'node:vm';

const SITE = 'https://nevamis.ca';

/* The plan table used to be a hand-typed array in this file. It drifted the
   moment prices changed, which is the whole failure mode this generator was
   written to prevent — it just moved the drift from the HTML into the tool
   that writes the HTML. Read the one source of truth instead. */
const cfgSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync('pricing-config.js', 'utf8'), cfgSandbox);
const NV = cfgSandbox.window.NV_PRICING;
if (!NV || !Array.isArray(NV.plans) || NV.plans.length === 0) {
  console.error('pricing-config.js did not yield NV_PRICING.plans — refusing to write schema from nothing.');
  process.exit(1);
}
const OPEN = '<!-- generated:schema -->';
const CLOSE = '<!-- /generated:schema -->';

const decode = (s) => s
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Pull the real FAQ out of the page so the markup always matches the copy.
 *
 *  Each <details> is isolated FIRST, then read. The previous single regex ran
 *  `<details…>\s*<summary>([\s\S]*?)</summary>\s*<p>` across the whole
 *  document, and home.html contains a <details> whose body is a list rather
 *  than a paragraph ("Prefer to read it? The full sequence as a list"). The
 *  `\s*<p>` requirement failed there, so the engine kept scanning and matched
 *  from that opening tag all the way to a LATER </summary> that was followed
 *  by a <p> — producing a single FAQ "question" 8,901 characters long that had
 *  swallowed most of the homepage.
 *
 *  Google rejects a question of that shape, and an invalid entry can discard
 *  the whole FAQPage block, so the homepage was publishing thirteen perfectly
 *  good questions inside markup that could not earn a rich result.
 *
 *  A <details> whose body is not a single paragraph is simply not a FAQ entry
 *  and is skipped, which is what should have happened all along.
 */
function faqFrom(html) {
  const out = [];
  for (const block of html.matchAll(/<details[^>]*>([\s\S]*?)<\/details>/g)) {
    const body = block[1];
    // Cannot cross its own closing tag, so it can never reach the next element.
    const summary = body.match(/^\s*<summary>((?:(?!<\/summary>)[\s\S])*)<\/summary>/);
    if (!summary) continue;
    const answer = body.slice(summary[0].length).match(/^\s*<p>([\s\S]*?)<\/p>/);
    if (!answer) continue;
    out.push({ q: decode(summary[1]), a: decode(answer[1]) });
  }
  return out;
}

/**
 * Pages whose Q&A must NOT be published as structured data yet.
 *
 * FAQPage markup is quoted verbatim by answer engines, so anything in it is
 * effectively a public assertion. A claim the ledger holds at REVIEW must
 * clear the ledger first and get marked up second, never the other way round.
 *
 * revenue-engine.html sat here under CLM-10. It was released 2026-07-28: the
 * page had contradicted itself, saying "no clients onboarded yet" in one
 * section and "in private pilot with a small number of clients" in the FAQ.
 * The FAQ was the false half and the half answer engines quote. It now matches
 * the true statement, and the 30% gross-profit terms are no longer on the
 * public page at all, so nothing under review is being amplified.
 *
 * Empty is the correct steady state. Add a file here only to withhold, and
 * only alongside a ledger entry explaining what is unresolved.
 */
const FAQ_ON_HOLD = new Set();

function block(objs) {
  return `${OPEN}\n<script type="application/ld+json">\n${JSON.stringify(objs, null, 2)}\n</script>\n${CLOSE}`;
}

/** Insert or replace the generated block, just before </head>. */
function inject(html, json) {
  const b = block(json);
  if (html.includes(OPEN)) {
    return html.replace(new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}`), b);
  }
  return html.replace('</head>', `${b}\n</head>`);
}

// ---------------------------------------------------------------
// Homepage: the service itself, its plans, and the FAQ
// ---------------------------------------------------------------
const home = fs.readFileSync('home.html', 'utf8');
const faq = faqFrom(home);
if (faq.length < 5) {
  console.error(`Only found ${faq.length} FAQ entries — refusing to write a thin FAQPage.`);
  process.exit(1);
}

/* Derived, never typed. `desc` states the included minutes and the plan's own
   "best for" line, both of which already live in the config. */
const PLANS = NV.plans.map((p) => ({
  name: p.name,
  price: p.monthly,
  setup: p.setup,
  desc: `${p.includedMinutes} included AI minutes. ${p.bestFor}`,
}));

const service = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE}/#service`,
  name: 'Call Answering and Booking Service',
  serviceType: 'AI phone answering, call qualification, and appointment booking',
  description:
    'A done-for-you service that answers a business phone line 24/7, qualifies the caller, ' +
    'books the job into the calendar, confirms the time with the caller, and texts the owner a summary. ' +
    'Configured around each business\'s own hours, service area, job types, and approved rules.',
  provider: { '@id': `${SITE}/#organization` },
  areaServed: [
    { '@type': 'Country', name: 'Canada' },
    { '@type': 'City', name: 'Edmonton', containedInPlace: { '@type': 'State', name: 'Alberta' } },
  ],
  audience: {
    '@type': 'BusinessAudience',
    name: 'Service businesses and trades: electrical, HVAC, plumbing, restoration, automotive',
  },
  offers: PLANS.map((p) => ({
    '@type': 'Offer',
    name: p.name,
    description: p.desc,
    price: String(p.price),
    priceCurrency: 'CAD',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: String(p.price),
      priceCurrency: 'CAD',
      unitText: 'MONTH',
      billingIncrement: 1,
    },
    availability: 'https://schema.org/InStock',
    url: `${SITE}/pricing.html`,
  })),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Nevamis plans',
    itemListElement: PLANS.map((p) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: `${p.name} plan`, description: p.desc },
    })),
  },
};

const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE}/#faq`,
  mainEntity: faq.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

fs.writeFileSync('home.html', inject(home, [service, faqPage]));
console.log(`home.html: Service + FAQPage (${faq.length} questions)`);

// ---------------------------------------------------------------
// Secondary pages: breadcrumb trail + a typed WebPage
// ---------------------------------------------------------------
const PAGES = [
  { file: 'pricing.html', name: 'Pricing', type: 'WebPage' },
  { file: 'pilot.html', name: '7-Day Live Pilot', type: 'WebPage' },
  { file: 'demo.html', name: 'Live Demo', type: 'WebPage' },
  { file: 'book.html', name: 'Book a Strategy Call', type: 'ContactPage' },
  { file: 'about.html', name: 'About', type: 'AboutPage' },
  { file: 'coming-soon.html', name: 'Coming Soon', type: 'WebPage' },
  { file: 'revenue-engine.html', name: 'Revenue Engine', type: 'WebPage' },
  { file: 'privacy.html', name: 'Privacy', type: 'WebPage' },
  { file: 'terms.html', name: 'Terms', type: 'WebPage' },
];

for (const p of PAGES) {
  if (!fs.existsSync(p.file)) { console.warn(`skip ${p.file} (missing)`); continue; }
  let html = fs.readFileSync(p.file, 'utf8');
  const url = `${SITE}/${p.file}`;
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || p.name;
  const desc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || '';

  const json = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: p.name, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': p.type,
      '@id': url,
      url,
      name: title,
      description: desc,
      isPartOf: { '@type': 'WebSite', name: 'Nevamis', url: `${SITE}/` },
      about: { '@id': `${SITE}/#service` },
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en-CA',
    },
  ];

  // Any page carrying real Q&A gets it published as answerable pairs. Answer
  // engines quote these directly, so the source copy has to stand alone out of
  // context — which is exactly how the visible answers are already written.
  const pageFaq = FAQ_ON_HOLD.has(p.file) ? [] : faqFrom(html);
  if (FAQ_ON_HOLD.has(p.file)) {
    console.warn(`  note: ${p.file} FAQ withheld from structured data (claims under review)`);
  }
  if (pageFaq.length >= 3) {
    json.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      mainEntity: pageFaq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  fs.writeFileSync(p.file, inject(html, json));
  console.log(`${p.file}: BreadcrumbList + ${p.type}${pageFaq.length >= 3 ? ` + FAQPage (${pageFaq.length})` : ''}`);
}

console.log('\nRun `node scripts/promote.mjs` to copy home.html into index.html.');
