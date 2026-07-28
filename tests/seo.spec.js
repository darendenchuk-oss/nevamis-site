/* ============================================================
   NEVAMIS SEO / STRUCTURED DATA PROOF
   Search engines and AI answer engines only see what is actually
   served, so these assert the real bytes: valid JSON-LD, resolved
   @id references, crawlable icons, and honest claims.
   ============================================================ */

import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  '/', '/pricing.html', '/pilot.html', '/demo.html', '/book.html',
  '/about.html', '/coming-soon.html', '/privacy.html', '/terms.html',
  '/revenue-engine.html',
];

/** Every JSON-LD block on the page, parsed. Throws on invalid JSON. */
async function schemaOf(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap((s) => {
        const parsed = JSON.parse(s.textContent);   // fails loudly if malformed
        return Array.isArray(parsed) ? parsed : [parsed];
      }));
}

test('every public page has valid JSON-LD, one h1, and complete metadata', async ({ page }) => {
  for (const path of PUBLIC_PAGES) {
    await page.goto(path);

    const meta = await page.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || '',
      canonical: document.querySelector('link[rel=canonical]')?.href || '',
      robots: document.querySelector('meta[name=robots]')?.content || '',
      h1s: document.querySelectorAll('h1').length,
      lang: document.documentElement.lang,
    }));

    expect(meta.title.length, `${path} title too short`).toBeGreaterThan(15);
    expect(meta.title.length, `${path} title too long for SERPs`).toBeLessThan(75);
    expect(meta.desc.length, `${path} description too short`).toBeGreaterThan(50);
    expect(meta.desc.length, `${path} description too long`).toBeLessThan(betterMax());
    expect(meta.canonical, `${path} missing canonical`).toContain('nevamis.ca');
    expect(meta.robots, `${path} must be indexable`).toContain('index');
    expect(meta.robots, `${path} must not be noindex`).not.toContain('noindex');
    expect(meta.h1s, `${path} needs exactly one h1`).toBe(1);
    expect(meta.lang).toBe('en-CA');

    // JSON-LD must parse on every page
    const schema = await schemaOf(page);
    expect(schema.length, `${path} has no structured data`).toBeGreaterThan(0);
  }
});

function betterMax() { return 185; }

test('homepage publishes Organization, Service, FAQ and resolvable @id links', async ({ page }) => {
  await page.goto('/');
  const schema = await schemaOf(page);
  // a node may declare several types (Organization is also a ProfessionalService)
  const types = schema.flatMap((s) => [].concat(s['@type']));

  expect(types).toContain('Organization');
  expect(types).toContain('WebSite');
  expect(types).toContain('Service');
  expect(types).toContain('FAQPage');

  const org = schema.find((s) => [].concat(s['@type']).includes('Organization'));
  expect(org['@id'], 'Organization needs an @id for other nodes to reference').toBeTruthy();
  expect(org.logo, 'Google reads Organization.logo for the brand icon').toContain('icon-512.png');
  expect(org.telephone).toContain('587');

  // the Service must point at a node that actually exists on the page
  const service = schema.find((s) => s['@type'] === 'Service');
  const ids = schema.map((s) => s['@id']).filter(Boolean);
  expect(ids, 'Service.provider must resolve').toContain(service.provider['@id']);
  expect(service.offers.length, 'all three plans should be listed').toBe(3);
  for (const o of service.offers) {
    expect(o.priceCurrency).toBe('CAD');
    expect(Number(o.price)).toBeGreaterThan(0);
  }

  // FAQ markup must mirror the visible FAQ, not a separate hand-written list
  const faq = schema.find((s) => s['@type'] === 'FAQPage');
  const visible = await page.locator('.faq details').count();
  expect(faq.mainEntity.length, 'FAQ schema must match the visible questions').toBe(visible);
  for (const q of faq.mainEntity) {
    expect(q.name.length).toBeGreaterThan(5);
    expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
  }
});

test('secondary pages carry breadcrumbs back to the homepage', async ({ page }) => {
  for (const path of PUBLIC_PAGES.filter((p) => p !== '/')) {
    await page.goto(path);
    const schema = await schemaOf(page);
    const crumb = schema.find((s) => s['@type'] === 'BreadcrumbList');
    expect(crumb, `${path} missing BreadcrumbList`).toBeTruthy();
    expect(crumb.itemListElement.length).toBe(2);
    expect(crumb.itemListElement[0].item).toBe('https://nevamis.ca/');
    expect(crumb.itemListElement[1].item).toContain(path.replace('/', ''));
  }
});

test('crawlable brand icons are linked as real files, never data URIs', async ({ page }) => {
  await page.goto('/');
  const icons = await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel*="icon"]'))
      .map((l) => l.getAttribute('href')));

  expect(icons.length).toBeGreaterThan(1);
  for (const href of icons) {
    // Google cannot index an embedded favicon — this is the bug that hid the logo
    expect(href.startsWith('data:'), 'favicons must be real files').toBeFalsy();
    const res = await page.request.get(href);
    expect(res.status(), `${href} should serve`).toBe(200);
  }
});

test('robots.txt, sitemap and llms.txt agree with the real page set', async ({ page }) => {
  const robots = await (await page.request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://nevamis.ca/sitemap.xml');

  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.length).toBeGreaterThanOrEqual(10);
  // the staging twin must never be advertised
  expect(locs.join(' ')).not.toContain('home.html');
  for (const path of PUBLIC_PAGES) {
    const expected = 'https://nevamis.ca' + (path === '/' ? '/' : path);
    expect(locs, `sitemap missing ${expected}`).toContain(expected);
  }

  const llms = await (await page.request.get('/llms.txt')).text();
  expect(llms).toContain('(587) 413-0035');
  // AI engines must not be handed claims the business cannot support
  expect(llms.toLowerCase()).toContain('no client counts');
});

test('pricing publishes a parseable price table for answer engines', async ({ page }) => {
  await page.goto('/pricing.html');
  const schema = await schemaOf(page);
  const product = schema.find((s) => s['@type'] === 'Product');
  expect(product, 'pricing needs Product/Offer markup').toBeTruthy();

  const agg = product.offers;
  expect(agg['@type']).toBe('AggregateOffer');
  expect(agg.priceCurrency).toBe('CAD');
  expect(Number(agg.offerCount)).toBeGreaterThanOrEqual(4);   // 3 plans + PAYG

  // prices must match the config, never a hardcoded copy
  const cfg = await page.evaluate(() => ({
    plans: window.NV_PRICING.plans.map((p) => ({ name: p.name, monthly: p.monthly })),
    payg: window.NV_PRICING.payAsYouGo.monthly,
  }));
  for (const plan of cfg.plans) {
    const offer = agg.offers.find((o) => o.name === plan.name);
    expect(offer, `offer missing for ${plan.name}`).toBeTruthy();
    expect(offer.price).toBe(String(plan.monthly));
  }
  expect(Number(agg.lowPrice)).toBe(cfg.payg);
});

test('every page with real Q&A publishes it, except claims under review', async ({ page }) => {
  // coming-soon carries 12 genuine questions and honest forward-looking answers
  await page.goto('/coming-soon.html');
  let schema = await schemaOf(page);
  const faq = schema.find((s) => s['@type'] === 'FAQPage');
  expect(faq, 'coming-soon Q&A should be answerable').toBeTruthy();
  expect(faq.mainEntity.length).toBeGreaterThanOrEqual(10);
  // the status answer must survive extraction out of context
  const answers = faq.mainEntity.map((q) => q.acceptedAnswer.text).join(' ').toLowerCase();
  expect(answers).toContain('only the ai front desk is available today');

  // revenue-engine sells something that does not exist yet, so its Q&A is the
  // most quotable place on the site to accidentally claim traction. It is now
  // published, which means the guard has to bite on the wording rather than on
  // the presence of the block: an answer engine repeating this must tell the
  // reader the product is unbuilt and unbought.
  await page.goto('/revenue-engine.html');
  schema = await schemaOf(page);
  const reFaq = schema.find((s) => s['@type'] === 'FAQPage');
  expect(reFaq, 'revenue-engine Q&A should be answerable').toBeTruthy();
  const reAnswers = reFaq.mainEntity.map((q) => q.acceptedAnswer.text).join(' ').toLowerCase();
  expect(reAnswers, 'the unbuilt status must survive extraction out of context')
    .toContain('no clients onboarded yet');
  // any phrasing that implies the pilot already has customers
  for (const lie of ['with a small number of clients', 'our clients', 'existing clients', 'current clients']) {
    expect(reAnswers, `structured data must not imply clients that do not exist: "${lie}"`).not.toContain(lie);
  }
});

test('the organization is typed and priced for local answer results', async ({ page }) => {
  await page.goto('/');
  const schema = await schemaOf(page);
  const org = schema.find((s) => String(s['@type']).includes('Organization'));
  expect(String(org['@type'])).toContain('ProfessionalService');
  expect(org.priceRange).toMatch(/C\$/);
  expect(org.areaServed.length, 'name the towns actually served').toBeGreaterThan(3);
  expect(org.knowsAbout.join(' ')).toContain('AI receptionist');
});

test('answer engines are welcomed, and the proposal page is not', async ({ page }) => {
  const robots = await (await page.request.get('/robots.txt')).text();
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot']) {
    expect(robots, `${bot} should have an explicit stance`).toContain(bot);
  }
  // the per-prospect proposal is private in every crawler's section
  const blocks = robots.split(/\n(?=User-agent:)/);
  for (const b of blocks.filter((x) => x.trim())) {
    expect(b, `a crawler block fails to exclude the proposal:\n${b}`).toContain('Disallow: /proposal.html');
  }
});

test('the staging twin stays out of the index', async ({ page }) => {
  await page.goto('/home.html');
  const robots = await page.evaluate(() =>
    document.querySelector('meta[name=robots]')?.content || '');
  expect(robots).toContain('noindex');
});
