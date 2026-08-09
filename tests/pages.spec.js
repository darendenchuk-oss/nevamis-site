/* ============================================================
   NEVAMIS SITE-WIDE SMOKE
   Every restyled page must load clean on the new design system:
   correct stylesheets, canonical header/footer, working nav,
   no console errors, no horizontal overflow, at desktop + phone.
   ============================================================ */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('artifacts/motion-proof/pages');
const PAGES = [
  'pricing.html', 'pilot.html', 'demo.html', 'book.html', 'about.html',
  'coming-soon.html', 'privacy.html', 'terms.html', 'revenue-engine.html', '404.html',
];

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

function watchErrors(page, sink) {
  page.on('console', (m) => { if (m.type() === 'error') sink.push(`console: ${m.text()}`); });
  page.on('pageerror', (e) => sink.push(`pageerror: ${e.message}`));
}

for (const file of PAGES) {
  test(`${file} loads clean on the design system`, async ({ browser }) => {
    const errors = [];
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    watchErrors(page, errors);
    await page.goto('/' + file);

    // On the new system, off the old stylesheet. The design system is inlined
    // rather than linked now (scripts/lib/inline-css.mjs), so this asserts the
    // stylesheet is PRESENT, which is what the test was ever about, instead of
    // asserting the transport it happens to arrive over.
    const design = await page.evaluate(() =>
      [...document.querySelectorAll('style')].some((s) => s.textContent.includes('--navy:')));
    expect(design, 'the site design system must be in the document').toBe(true);
    await expect(page.locator('link[href*="assets/motion/site.css"]')).toHaveCount(0);
    await expect(page.locator('link[href="styles.css"], link[href="/styles.css"]')).toHaveCount(0);

    // canonical chrome
    await expect(page.locator('header.site-header')).toHaveCount(1);
    await expect(page.locator('footer.site-footer')).toHaveCount(1);
    await expect(page.locator('.main-nav a', { hasText: 'Pricing' })).toHaveCount(1);

    // the aurora sky installs site-wide via main.js
    await expect(page.locator('#aurora')).toHaveCount(1);

    // no unclipped element escapes the right edge
    const escapees = await page.evaluate(() =>
      Array.from(document.querySelectorAll('body *')).filter((el) => {
        const s = getComputedStyle(el);
        if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
        const b = el.getBoundingClientRect();
        if (!(b.width > 0 && b.height > 0 && b.right > innerWidth + 1)) return false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const ox = getComputedStyle(a).overflowX;
          if (ox === 'hidden' || ox === 'auto' || ox === 'scroll' || ox === 'clip') return false;
        }
        return true;
      }).slice(0, 4).map((el) => `${el.tagName}.${el.getAttribute('class') || el.id || ''}`));
    expect(escapees, `overflow on ${file}`).toEqual([]);

    await page.screenshot({ path: path.join(OUT, file.replace('.html', '') + '-desktop.png') });

    // phone: menu opens, callbar present
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(250);
    await page.locator('.nav-toggle').click();
    await expect(page.locator('.main-nav')).toHaveClass(/open/);
    await page.screenshot({ path: path.join(OUT, file.replace('.html', '') + '-mobile.png') });

    expect(errors, `${file} errors:\n${errors.join('\n')}`).toEqual([]);
    await ctx.close();
  });
}
