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
  /* A fee of 0 is still published as a component of 0, with words saying
     there is none (v7, 2026-10-03: only the Partnership carries one). A
     parser that finds no component assumes nothing; one that finds 0 knows. */
  const launch = Array.isArray(item.launchRange)
    ? { minPrice: money(item.launch),
        description: `From ${NV.money(item.launch)}, set in the client's agreement. Charged once, at the start, beside the first month.` }
    : item.launch > 0
      ? { price: money(item.launch), description: 'Charged once, at the start, beside the first month. Never recurring.' }
      : { price: money(0), description: 'None: this item is priced as its monthly alone.' };
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

/* The homepage sells the three Front Desk sizes and nothing else (owner
   decision #81, 2026-11-10), so the structured data offers exactly those. */
const TIERS = typeof NV.frontDeskTiers === 'function' ? NV.frontDeskTiers() : [];
if (TIERS.length !== 3) {
  console.error('pricing-config.js did not yield three Front Desk sizes; refusing to write the homepage offers from that.');
  process.exit(1);
}
const PLANS = TIERS.map((p) => ({
  name: p.name,
  selfServe: p.selfServe,
  spec: priceSpecFor(p),
  /* The whole offer, in the approved shape: an answer engine quotes this
     verbatim, so it carries the plan's startLine() sentence (the Launch &
     Implementation fee and the performance clause where the plan has them)
     and the invitation status where the plan is not self-serve. It never
     carries the first month free (v7, owner amendment #66): that is given
     to the first clients on a booked call, and structured data cannot be
     switched off when the places run out. */
  /* NV.startLine, the sentence a plan's figures are stated in (see
     docs/PRICING-CONFIG.md for the surfaces that use it).
     This line typed its own pair and published the Partnership to answer
     engines as one flat price while its figures are a band (BD-4,
     2026-09-25). performanceNote is joined inside startLine since v7, so
     it is not appended a second time, and "never the default" is the
     Partnership's bestFor's, said once (audit MACHINE-27). */
  desc: NV.startLine(p)
    + (p.selfServe === false ? ` ${p.inviteNote || 'Offered by invitation and approval.'}` : '')
    /* Grouped, because it is read aloud and quoted verbatim: "1400 included
       AI minutes" is the one number on this line a person reads as a typo. */
    + ` ${p.includedMinutes.toLocaleString('en-CA')} included minutes. ${p.bestFor}`,
}));

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
  url: `${SITE}/`,
});

const service = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE}/#service`,
  /* Answer engines quote these verbatim, so they say what the agent does and
     nothing else: it answers the calls a business misses, on the business's
     own number through call forwarding, 24/7, asks what the caller needs,
     where and how urgent, takes their name and number, and texts and emails
     the owner within seconds. It books nothing. */
  name: 'Missed-call answering for Canadian trades',
  serviceType: "24/7 answering of missed calls, with the caller's details texted and emailed to the owner",
  description:
    "Nevamis answers the calls a trades or service business misses, 24/7, in the business's name, " +
    'on its own number through call forwarding. It asks the caller what they need, where it is and ' +
    'how urgent it is, takes their name and callback number, and texts and emails the owner those ' +
    'details within seconds.',
  provider: { '@id': `${SITE}/#organization` },
  areaServed: [
    { '@type': 'Country', name: 'Canada' },
    { '@type': 'City', name: 'Edmonton', containedInPlace: { '@type': 'State', name: 'Alberta' } },
  ],
  audience: {
    '@type': 'BusinessAudience',
    name: 'Service businesses and trades: electrical, HVAC, plumbing, restoration, automotive',
  },
  offers: PLANS.map((p) => offerOf(p, 'Plan')),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Nevamis Front Desk sizes',
    itemListElement: PLANS.map((p) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: `${p.name} plan`, description: p.desc },
    })),
  },
};

fs.writeFileSync('home.html', inject(home, [service]));
console.log(`home.html: Service (${PLANS.length} Front Desk sizes)`);

// ---------------------------------------------------------------
// Secondary pages: breadcrumb trail + a typed WebPage
// ---------------------------------------------------------------
const PAGES = [
  { file: 'book.html', name: 'Book a call', type: 'ContactPage' },
  { file: 'privacy.html', name: 'Privacy', type: 'WebPage' },
  { file: 'terms.html', name: 'Terms', type: 'WebPage' },
  /* The page /.well-known/security.txt names as its Policy. */
  { file: 'security.html', name: 'Security', type: 'WebPage' },
]

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
