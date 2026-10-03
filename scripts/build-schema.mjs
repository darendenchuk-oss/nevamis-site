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
import { cardAlt, applyImageAlt } from './lib/og-card.mjs';

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
/* `setup: p.setup` was carried here and read by nothing. It survived the day
   the key was deleted from pricing-config.js only because it was dead: had any
   Offer used it, every plan would have published `"setup": undefined` to
   answer engines. */
/* `selfServe` is carried through because the Offer below has to say whether a
   plan can actually be bought. The Performance Partnership published
   `InStock` here while /pricing.html published `LimitedAvailability` for the
   same plan on the same site: two machine-read surfaces disagreeing about
   whether an invitation-only plan is purchasable, and the homepage was the
   one that was wrong. */

/* ---------------------------------------------------------------
   THE MACHINE-READABLE PRICE IS BOTH FIGURES (audit MACHINE-17, 2026-10-03)

   Until 2026-10-03 every Offer here carried `price` and one MONTH
   UnitPriceSpecification, and nothing else: "price": "1000" for the AI Front
   Desk. llms.txt says in as many words that a summary saying an AI Front
   Desk customer owes only C$1,000 to start is wrong, and the one field a
   parser reads first said exactly that. The Launch & Implementation fee was
   in the description prose, where no parser looks for a number. The
   Partnership published a flat "350" while its monthly is a band, and the
   modules sold on their own (Quote Recovery, door two, among them) had no
   Offer at all, so to a machine the only way in was a plan.

   So every sold item now carries a CompoundPriceSpecification with its two
   components, read from pricing-config.js and never typed:
     - "Launch & Implementation": the one-time component. The fee has ONE
       name on every surface, and it is deliberately not given schema.org's
       ActivationFee type: "activation fee" is a retired name for it
       (llms.txt), and a type is a name a machine reads out.
     - "Monthly": a Subscription component per MONTH.
   A figure the config gives as a band is published as a band, minPrice and
   maxPrice with no `price` beside them, because a single price next to a
   range is the flat figure again under another key. A fee that is a floor
   ("From C$2,500") publishes minPrice only: the top of its launchRange is
   printed on no page, and a number given to machines and hidden from people
   is worse than either.

   There is deliberately NO top-level Offer.price. An Offer with two
   components has no single price, and putting the monthly there would
   rebuild the defect for every parser that reads only that field.

   Guarded by offerFindings() in scripts/lib/machine-surfaces.mjs, which
   check-consistency.js runs over the block this writes into index.html. */
const money = (n) => String(n);

/** The two components of an item's price, from the item's own config fields.
    Works for a plan and for an add-on: both carry `launch` and `monthly`, and
    a plan may also carry `launchRange` and `monthlyRange`. */
function priceSpecFor(item) {
  const launch = Array.isArray(item.launchRange)
    ? { minPrice: money(item.launch),
        description: `From ${NV.money(item.launch)}, set in the client's agreement. Charged once, at the start, beside the first month.` }
    : { price: money(item.launch), description: 'Charged once, at the start, beside the first month. Never recurring.' };
  const monthly = Array.isArray(item.monthlyRange)
    ? { minPrice: money(item.monthlyRange[0]), maxPrice: money(item.monthlyRange[1]),
        description: `${NV.money(item.monthly)} a month${NV.monthlyBand(item)}, set in the client's agreement.` }
    : { price: money(item.monthly) };
  return {
    '@type': 'CompoundPriceSpecification',
    priceCurrency: 'CAD',
    /* The approved sentence, so a reader of the spec alone gets the joins
       ("to start", "then") and never a total. */
    description: NV.startLine(item),
    priceComponent: [
      { '@type': 'UnitPriceSpecification', name: 'Launch & Implementation', priceCurrency: 'CAD', ...launch },
      { '@type': 'UnitPriceSpecification', name: 'Monthly', priceComponentType: 'https://schema.org/Subscription',
        priceCurrency: 'CAD', unitCode: 'MON', unitText: 'MONTH', billingIncrement: 1, ...monthly },
    ],
  };
}

const PLANS = NV.plans.map((p) => ({
  name: p.name,
  selfServe: p.selfServe,
  spec: priceSpecFor(p),
  /* The whole offer, in the approved shape: an answer engine quotes this
     verbatim, so it carries the one-time Launch & Implementation fee with
     the rule joining it to the monthly, the performance sentence where the
     plan has one, and the invitation status where the plan is not
     self-serve. */
  /* NV.startLine, the sentence a plan's figures are stated in (see
     docs/PRICING-CONFIG.md for the surfaces that use it).
     This line typed its own pair and published the Partnership to answer
     engines as one flat price while its figures are a band (BD-4,
     2026-09-25). */
  desc: NV.startLine(p)
    + (p.performanceNote ? ` ${p.performanceNote}` : '')
    + (p.selfServe === false ? ' Offered by invitation and approval; never the default.' : '')
    /* Grouped, because it is read aloud and quoted verbatim: "1400 included
       AI minutes" is the one number on this line a person reads as a typo. */
    + ` ${p.includedMinutes.toLocaleString('en-CA')} included minutes. ${p.bestFor}`,
}));

/* Every module the config sells with nothing beside it gets its own Offer
   (MACHINE-17: Quote Recovery, door two, was invisible to machines). Read off
   the catalog's own flags and never listed by hand, so a module that becomes
   sellable appears on the next build and one that is not sold alone never
   does: Lead Generation is by invitation and has no pair of its own, and
   Search Rankings and Customer Reactivation are coming. Walked in the
   catalog's order, which is the order the pricing page lists them in. */
const MODULES = (NV.addOns || [])
  .filter((a) => a.sellable === true && a.soldAlone === true)
  .map((a) => {
    if (!(a.launch > 0) || !(a.monthly > 0)) {
      console.error(`pricing-config.js sells ${a.id} alone but gives it no launch and monthly pair; refusing to publish an Offer without its price.`);
      process.exit(1);
    }
    return {
      name: a.name,
      selfServe: true,
      spec: priceSpecFor(a),
      desc: `${NV.startLine(a)} Sold on its own, month to month, with no plan required. ${a.blurb}`,
    };
  });
if (!MODULES.length) {
  console.error('pricing-config.js sells no module on its own, which is not the catalog this was written for; refusing to drop every module Offer silently.');
  process.exit(1);
}

const offerOf = (p, category) => ({
  '@type': 'Offer',
  name: p.name,
  category,
  description: p.desc,
  priceCurrency: 'CAD',
  priceSpecification: p.spec,
  availability: p.selfServe === false
    ? 'https://schema.org/LimitedAvailability'
    : 'https://schema.org/InStock',
  url: `${SITE}/pricing.html`,
});

const service = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE}/#service`,
  /* The name said "Call Answering and Lead Capture Service" while the page it
     sits on leads with Lead Generation and Quote Recovery: the structured data
     described the third of three offers as the whole product. Owner ranking of
     2026-09-12: customers found first, quotes second, the phone third. */
  name: 'Lead Generation, Quote Recovery and call answering for Canadian trades',
  /* Answer engines quote serviceType verbatim, so it may only name things the
     service actually provisions. It said "appointment booking" while a
     provisioned agent has no calendar credential and no booking tool: the
     structured data was making a promise the phone line refuses to keep, on
     the one surface a prospect never gets to sanity-check. */
  serviceType: 'Lead Generation by invitation, quote follow-up, and 24/7 call answering with structured lead capture',
  /* "by invitation" is load-bearing, not decoration: check-consistency's
     readiness guard reads every JSON-LD description on this page and fails any
     that names a capability roadmap-config.js does not mark available without a
     word saying it is not here yet. lead-generation is private_pilot. */
  description:
    'Nevamis finds a trades or service business more of the customers it wants ' +
    '(Lead Generation, by invitation: a person reads public pages and builds the list, ' +
    'the owner decides every row, and nobody on it is contacted), follows up the quotes ' +
    'it already sent with the owner\'s approval, and answers its phone around the clock, ' +
    'texting and emailing the owner each call\'s details within seconds.',
  provider: { '@id': `${SITE}/#organization` },
  areaServed: [
    { '@type': 'Country', name: 'Canada' },
    { '@type': 'City', name: 'Edmonton', containedInPlace: { '@type': 'State', name: 'Alberta' } },
  ],
  audience: {
    '@type': 'BusinessAudience',
    name: 'Service businesses and trades: electrical, HVAC, plumbing, restoration, automotive',
  },
  offers: [
    ...PLANS.map((p) => offerOf(p, 'Plan')),
    ...MODULES.map((m) => offerOf(m, 'Module sold on its own')),
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Nevamis plans and modules',
    itemListElement: [
      ...PLANS.map((p) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: `${p.name} plan`, description: p.desc },
      })),
      ...MODULES.map((m) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: m.name, description: m.desc },
      })),
    ],
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
console.log(`home.html: Service (${PLANS.length} plans, ${MODULES.length} modules sold alone) + FAQPage (${faq.length} questions)`);

// ---------------------------------------------------------------
// Secondary pages: breadcrumb trail + a typed WebPage
// ---------------------------------------------------------------
const PAGES = [
  { file: 'pricing.html', name: 'Pricing', type: 'WebPage' },
  /* Was '7-Day Live Pilot' at /pilot.html. The breadcrumb stopped naming the
     retired offer on 2026-08-09 and the page itself left that URL on
     2026-09-19, because the filename was the last place the word still showed
     to a reader. /pilot.html is still served, as a noindex holding page that
     answers "can I try it first" and points here, and it is deliberately NOT
     in this list: a page that asks not to be indexed has no use for a
     breadcrumb trail. */
  { file: 'how-you-start.html', name: 'How you start', type: 'WebPage' },
  { file: 'demo.html', name: 'Demo', type: 'WebPage' },
  { file: 'book.html', name: 'Book a call', type: 'ContactPage' },
  { file: 'about.html', name: 'About', type: 'AboutPage' },
  { file: 'coming-soon.html', name: 'Roadmap', type: 'WebPage' },
  { file: 'revenue-engine.html', name: 'Revenue Engine', type: 'WebPage' },
  { file: 'privacy.html', name: 'Privacy', type: 'WebPage' },
  { file: 'terms.html', name: 'Terms', type: 'WebPage' },
  /* The page /.well-known/security.txt names as its Policy. That line pointed
     at SECURITY.md on github.com until 2026-09-24, which is not a nevamis.ca
     address and stops resolving the day the repository goes private. */
  { file: 'security.html', name: 'Security', type: 'WebPage' },
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

// ---------------------------------------------------------------
// Every page: the share image says what is in it
// ---------------------------------------------------------------
/* og:image:alt and twitter:image:alt on every page in content-map.json that
   publishes the share card (audit COMPLETENESS-8: none did). The text is the
   card's own words, read from scripts/og-default.svg by scripts/lib/
   og-card.mjs, so it cannot describe a card that is no longer there.
   index.html is skipped because promote.mjs writes it from home.html, which
   is in the set. Last in this file, so it sees the heads written above. */
const ALT = cardAlt(fs.readFileSync('scripts/og-default.svg', 'utf8'));
if (ALT.length < 20) {
  console.error(`scripts/og-default.svg yielded the alt "${ALT}", which cannot be the card; refusing to write it into every page.`);
  process.exit(1);
}
let altPages = 0;
for (const p of JSON.parse(fs.readFileSync('content-map.json', 'utf8')).pages) {
  if (p.file === 'index.html' || !fs.existsSync(p.file)) continue;
  const html = fs.readFileSync(p.file, 'utf8');
  const out = applyImageAlt(html, ALT);
  if (out !== html) fs.writeFileSync(p.file, out);
  if (out.includes('property="og:image:alt"')) altPages++;
}
console.log(`share-image alt on ${altPages} page(s): "${ALT}"`);

console.log('\nRun `node scripts/promote.mjs` to copy home.html into index.html.');
