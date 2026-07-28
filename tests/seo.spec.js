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
  const types = schema.map((s) => s['@type']);

  expect(types).toContain('Organization');
  expect(types).toContain('WebSite');
  expect(types).toContain('Service');
  expect(types).toContain('FAQPage');

  const org = schema.find((s) => s['@type'] === 'Organization');
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

test('the staging twin stays out of the index', async ({ page }) => {
  await page.goto('/home.html');
  const robots = await page.evaluate(() =>
    document.querySelector('meta[name=robots]')?.content || '');
  expect(robots).toContain('noindex');
});
