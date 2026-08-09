/* A primary button must never be an offer to reload the page you are on.

   The header CTA is shared chrome, so on /book.html it pointed at /book.html:
   a visitor already trying to book was offered, as the page's most prominent
   action, the page they were already reading. Nav ITEMS that self-link are
   ordinary and aria-current says so; a BUTTON is a promise of progress.

   Route-aware because the defect only exists on one page at a time and is
   invisible everywhere else, which is how it survived a link audit that found
   all 25 destinations healthy. Every destination answered. One of them was
   just the wrong destination. */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const PAGES = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content-map.json'), 'utf8'))
  .pages.map((p) => p.file).filter((f) => f !== 'home.html' && f !== '404.html' && f !== 'proposal.html');

test('no button offers the page it is already on', async ({ page }) => {
  const offenders = [];
  for (const file of PAGES) {
    const url = file === 'index.html' ? '/' : '/' + file;
    await page.goto(url);
    const bad = await page.evaluate((self) => {
      const out = [];
      for (const a of document.querySelectorAll('a.btn[href]')) {
        const cs = getComputedStyle(a);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const href = a.getAttribute('href');
        if (href === self || href === self.replace(/^\//, '') ||
            (self === '/' && (href === '/index.html' || href === '/'))) {
          out.push(`"${(a.textContent || '').trim().slice(0, 28)}" -> ${href}`);
        }
      }
      return out;
    }, url);
    for (const b of bad) offenders.push(`${url}: ${b}`);
  }
  expect(offenders, `buttons whose only effect is reloading:\n${offenders.join('\n')}`).toEqual([]);
});

test('the booking page header sends you to the scheduler instead', async ({ page }) => {
  await page.goto('/book.html');
  const cta = page.locator('.main-nav a.btn-primary');
  await expect(cta).toHaveAttribute('href', '#booking');
  await expect(cta, 'still announced as the current page for assistive tech')
    .toHaveAttribute('aria-current', 'page');
  /* Not booking intent any more: it is a scroll by someone already booking, and
     counting it would inflate that funnel stage with people who arrived. */
  await expect(cta).not.toHaveAttribute('data-evt', /.*/);
  /* And it has somewhere to land. */
  await expect(page.locator('#booking')).toHaveCount(1);
});
