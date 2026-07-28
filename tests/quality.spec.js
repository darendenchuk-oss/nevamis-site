/* ============================================================
   NEVAMIS QUALITY FLOOR
   Core Web Vitals proxies, payload budgets, and the accessibility
   checks that actually bite on a motion-heavy marketing site.
   These are floors, not aspirations: they fail when a change makes
   the site measurably worse for a real visitor.
   ============================================================ */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const MAP = JSON.parse(fs.readFileSync('content-map.json', 'utf8'));
const PUBLIC = MAP.pages.filter((p) => p.url && p.cluster !== 'system').map((p) => p.url);

test('the homepage paints its largest element quickly and does not shift', async ({ page }) => {
  await page.goto('/', { waitUntil: 'load' });

  const vitals = await page.evaluate(() => new Promise((resolve) => {
    let lcp = 0, cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      resolve({ lcp, cls, ttfb: nav.responseStart || 0, domReady: nav.domContentLoadedEventEnd || 0 });
    }, 3500);
  }));

  // Generous ceilings: these catch regressions, not micro-variance.
  expect(vitals.lcp, `LCP ${Math.round(vitals.lcp)}ms`).toBeLessThan(3000);
  expect(vitals.cls, `CLS ${vitals.cls.toFixed(3)} — reserved space for animated elements`).toBeLessThan(0.1);
  expect(vitals.domReady, `DOM ready ${Math.round(vitals.domReady)}ms`).toBeLessThan(3000);
});

test('the page weight stays within budget', async ({ page }) => {
  const bytes = { total: 0, script: 0, font: 0, image: 0, css: 0 };
  page.on('response', async (res) => {
    try {
      const h = res.headers();
      const len = Number(h['content-length'] || 0);
      if (!len) return;
      const type = h['content-type'] || '';
      bytes.total += len;
      if (type.includes('javascript')) bytes.script += len;
      else if (type.includes('font')) bytes.font += len;
      else if (type.includes('image')) bytes.image += len;
      else if (type.includes('css')) bytes.css += len;
    } catch { /* ignore */ }
  });

  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  const kb = (n) => Math.round(n / 1024);
  // The motion system is the point of this site, so the budget is generous —
  // but it is a budget, and audio/video must never load on first paint.
  expect(bytes.script, `JS ${kb(bytes.script)}KB`).toBeLessThan(400 * 1024);
  expect(bytes.total, `total ${kb(bytes.total)}KB above the fold`).toBeLessThan(1600 * 1024);
});

test('the example-call audio is never fetched until asked for', async ({ page }) => {
  const audio = [];
  page.on('request', (r) => { if (/\.mp3(\?|$)/.test(r.url())) audio.push(r.url()); });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  expect(audio, 'eleven mp3s must not download on page load').toEqual([]);
});

test('every page passes the accessibility floor', async ({ page }) => {
  for (const url of PUBLIC) {
    await page.goto(url);

    const a11y = await page.evaluate(() => {
      const problems = [];

      // images need alt text (decorative ones need an explicit empty alt)
      document.querySelectorAll('img').forEach((img) => {
        if (img.getAttribute('alt') === null) problems.push(`img without alt: ${img.src.split('/').pop()}`);
      });

      // every control needs an accessible name
      document.querySelectorAll('button, a, input, select, textarea').forEach((el) => {
        if (el.closest('[aria-hidden="true"]')) return;
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim()
          || el.getAttribute('title')
          || (el.labels && el.labels.length ? el.labels[0].textContent.trim() : '')
          || el.getAttribute('placeholder') || '';
        if (!name) problems.push(`${el.tagName.toLowerCase()} without an accessible name`);
      });

      // one main landmark, and headings that do not skip levels
      if (document.querySelectorAll('main').length !== 1) problems.push('needs exactly one <main>');
      const levels = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => Number(h.tagName[1]));
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) problems.push(`heading jumps h${levels[i - 1]} to h${levels[i]}`);
      }

      // the page must be usable with the keyboard
      if (!document.querySelector('a[href="#main"], a.skip')) problems.push('no skip link');

      return problems;
    });

    expect(a11y, `${url} accessibility`).toEqual([]);
  }
});

test('body text clears WCAG AA contrast on the dark theme', async ({ page }) => {
  await page.goto('/');

  const ratios = await page.evaluate(() => {
    const lum = (rgb) => {
      const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number).map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05);
    };
    const bg = 'rgb(11, 22, 32)';   // --navy, the page behind everything
    const out = {};
    for (const sel of ['.lede', '.section-head p', '.proof', '.faq details p', '.site-footer p']) {
      const el = document.querySelector(sel);
      if (el) out[sel] = Number(ratio(getComputedStyle(el).color, bg).toFixed(2));
    }
    return out;
  });

  for (const [sel, r] of Object.entries(ratios)) {
    expect(r, `${sel} contrast ${r}:1 against the navy background`).toBeGreaterThanOrEqual(4.5);
  }
});

test('tap targets on a phone are big enough to hit', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('/');
  await page.waitForFunction(() => !!window.__heroTL);
  await page.evaluate(() => { window.__heroTL.progress(1).pause(); });

  const small = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('a.btn, button.btn, .callbar, .play, .nav-toggle').forEach((el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      // WCAG 2.2 target size (minimum) is 24x24; 44 is the comfortable mark
      if (r.height < 40) bad.push(`${(el.className || el.tagName)}: ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return bad;
  });

  expect(small, 'primary controls should be at least 40px tall on a phone').toEqual([]);
  await ctx.close();
});
