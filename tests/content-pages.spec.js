/* ============================================================
   NEVAMIS CONTENT LAYER PROOF
   Driven by content-map.json: adding a row there automatically
   adds it to this suite, so a thin or broken page cannot ship.
   ============================================================ */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const MAP = JSON.parse(fs.readFileSync('content-map.json', 'utf8'));
const CONTENT = MAP.pages.filter((p) => ['trade', 'situation', 'compare', 'hub'].includes(p.cluster));

test('the manifest actually produced pages', () => {
  expect(CONTENT.length, 'content layer should exist').toBeGreaterThanOrEqual(9);
  for (const p of CONTENT) {
    expect(fs.existsSync(p.file), `${p.file} listed in content-map.json but not built`).toBeTruthy();
  }
});

for (const page_ of CONTENT) {
  test(`${page_.file} is a real page, not a stub`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(page_.url);

    const info = await page.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content || '',
      canonical: document.querySelector('link[rel=canonical]')?.href || '',
      robots: document.querySelector('meta[name=robots]')?.content || '',
      h1: document.querySelectorAll('h1').length,
      h1text: document.querySelector('h1')?.textContent.trim() || '',
      h2s: document.querySelectorAll('h2').length,
      words: (document.querySelector('main')?.innerText || '').trim().split(/\s+/).length,
      internal: Array.from(document.querySelectorAll('main a[href^="/"]')).length,
      tel: document.querySelectorAll('a[href^="tel:"]').length,
      emDash: (document.body.innerText.match(/—/g) || []).length,
    }));

    expect(info.h1, 'exactly one h1').toBe(1);
    expect(info.h1text.length).toBeGreaterThan(10);
    expect(info.h2s, 'needs real section structure').toBeGreaterThanOrEqual(2);
    expect(info.title.length).toBeGreaterThan(15);
    expect(info.title.length).toBeLessThan(72);
    expect(info.desc.length).toBeGreaterThan(80);
    expect(info.desc.length).toBeLessThan(175);
    expect(info.canonical).toBe('https://nevamis.ca' + page_.url);
    expect(info.robots).toContain('index');
    expect(info.robots).not.toContain('noindex');
    expect(info.words, 'thin content is worse than no content').toBeGreaterThan(250);
    expect(info.internal, 'must link into the rest of the site').toBeGreaterThanOrEqual(2);
    expect(info.tel, 'every page offers the demo line').toBeGreaterThanOrEqual(1);
    expect(info.emDash, 'house style bans em dashes').toBe(0);
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('the hub links to every content page', async ({ page }) => {
  await page.goto('/solutions.html');
  const hrefs = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main a')).map((a) => a.getAttribute('href')));
  for (const p of CONTENT.filter((c) => c.cluster !== 'hub')) {
    expect(hrefs, `hub missing ${p.url}`).toContain(p.url);
  }
});

test('nav and footer are byte-identical across the content layer', async ({ page }) => {
  // Compare markup, not runtime state: the homepage hero animates its nav, so
  // GSAP leaves inline styles that say nothing about whether the chrome drifted.
  const norm = (s) => s
    .replace(/ aria-current="page"/g, '')
    .replace(/ style="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  let refNav = null, refFoot = null;

  for (const p of [{ url: '/' }, ...CONTENT]) {
    await page.goto(p.url);
    const got = await page.evaluate(() => ({
      nav: document.querySelector('nav.main-nav')?.outerHTML || '',
      foot: document.querySelector('footer.site-footer .cols')?.outerHTML || '',
    }));
    if (refNav === null) { refNav = norm(got.nav); refFoot = norm(got.foot); continue; }
    expect(norm(got.nav), `${p.url} nav drifted`).toBe(refNav);
    expect(norm(got.foot), `${p.url} footer drifted`).toBe(refFoot);
  }
});

test('no page claims the retired "first ring" wording', async ({ page }) => {
  for (const p of MAP.pages.filter((x) => x.url)) {
    await page.goto(p.url);
    const text = await page.evaluate(() => document.body.innerText.toLowerCase());
    expect(text, `${p.url} reintroduced a retired claim (CLM-02)`).not.toContain('first ring');
  }
});
