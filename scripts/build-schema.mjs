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

const SITE = 'https://nevamis.ca';
const OPEN = '<!-- generated:schema -->';
const CLOSE = '<!-- /generated:schema -->';

const decode = (s) => s
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** Pull the real FAQ out of the page so the markup always matches the copy. */
function faqFrom(html) {
  const out = [];
  const re = /<details>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/g;
  let m;
  while ((m = re.exec(html))) {
    out.push({ q: decode(m[1]), a: decode(m[2]) });
  }
  return out;
}

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

const PLANS = [
  { name: 'After Hours', price: 249, desc: '250 included AI minutes. Evenings, weekends, and overflow coverage on one line.' },
  { name: 'Growth', price: 449, desc: '600 included AI minutes. Up to two lines or call flows with qualification, routing, and booking.' },
  { name: 'Scale', price: 849, desc: '1200 included AI minutes. Multi-location and higher-volume call handling.' },
];

const service = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE}/#service`,
  name: 'AI Receptionist',
  serviceType: 'AI phone answering, call qualification, and appointment booking',
  description:
    'A done-for-you AI receptionist that answers a business phone line 24/7, qualifies the caller, ' +
    'books the job into the calendar, texts the customer a confirmation, and sends the owner a summary. ' +
    'Configured around each business\'s own hours, service area, job types, and approved rules.',
  provider: { '@id': `${SITE}/#organization` },
  areaServed: [
    { '@type': 'Country', name: 'Canada' },
    { '@type': 'City', name: 'Edmonton', containedInPlace: { '@type': 'State', name: 'Alberta' } },
  ],
  audience: {
    '@type': 'BusinessAudience',
    name: 'Service businesses and trades — electrical, HVAC, plumbing, restoration, automotive',
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
      isPartOf: { '@type': 'WebSite', name: 'Nevamis AI', url: `${SITE}/` },
      about: { '@id': `${SITE}/#service` },
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en-CA',
    },
  ];

  fs.writeFileSync(p.file, inject(html, json));
  console.log(`${p.file}: BreadcrumbList + ${p.type}`);
}

console.log('\nRun `node scripts/promote.mjs` to copy home.html into index.html.');
