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

/* WAS "the booking page header sends you to the scheduler instead", which
   asserted the header's primary CTA pointed at #pick-a-time on book.html.
   That test described a header that no longer exists: on 2026-08-28 booking
   left the header entirely, because a solid mint "Book a call" pill riding a
   fixed header down all 8,884px was the brightest thing on the page and
   inverted the owner's ruling that the scan is the single primary action.

   The self-CTA rewrite it exercised is not deleted, only unemployed: the
   header's primary is now an external URL, so no page can be the page it
   points at. What replaces the test is the invariant that actually holds now,
   asserted on every page rather than on one. */
test('the header offers one primary action, and it is the scan, on every page', async ({ page }) => {
  for (const file of PAGES) {
    const url = file === 'index.html' ? '/' : '/' + file;
    await page.goto(url);
    const primaries = page.locator('.main-nav a.btn-primary');
    await expect(primaries, `${url}: the header must offer exactly one primary action`).toHaveCount(1);
    await expect(primaries.first(), `${url}: and it must be the scan`)
      .toHaveAttribute('href', 'https://app.nevamis.ca/scan');
  }
});

/* The header stops at four destinations plus one utility action. Counted
   rather than listed: the rule the owner gave is a BUDGET, and a list would
   pass while quietly growing past it under different labels. */
test('the header carries at most four destinations, plus login and the scan', async ({ page }) => {
  await page.goto('/');
  const shape = await page.evaluate(() => {
    const nav = document.querySelector('.main-nav');
    const links = [...nav.querySelectorAll('a')];
    return {
      destinations: links.filter((a) => !a.classList.contains('btn') && !a.classList.contains('nav-utility'))
        .map((a) => a.textContent.trim()),
      utility: links.filter((a) => a.classList.contains('nav-utility')).map((a) => a.textContent.trim()),
      buttons: links.filter((a) => a.classList.contains('btn')).map((a) => a.textContent.trim()),
    };
  });
  expect(shape.destinations.length,
    `four destinations at most, found: ${shape.destinations.join(', ')}`).toBeLessThanOrEqual(4);
  expect(shape.buttons.length, 'exactly one header button, the primary').toBe(1);
  expect(shape.utility, 'client login stays, as a utility action').toEqual(['Client login']);
  /* Booking and the phone were the two that inverted the hierarchy. */
  const all = [...shape.destinations, ...shape.buttons, ...shape.utility].join(' ').toLowerCase();
  expect(all, 'booking does not belong in the header').not.toContain('book a call');
  expect(all, 'the phone affordance does not belong in the header').not.toContain('hear it answer');
});

test('the booking page still offers its scheduler anchor', async ({ page }) => {
  await page.goto('/book.html');
  await expect(page.locator('#pick-a-time')).toHaveCount(1);
});

/* The assertion this file was missing. The test above used to be called "sends
   you to the scheduler" while only checking that the anchor RESOLVED, and it
   passed for weeks pointing at a section 2,185px above the scheduler. Existence
   is not arrival. Containment is: if the target contains the iframe, no future
   edit can leave the button resolving somewhere that merely shares the topic. */
test('the header CTA lands on the booking control, not near it', async ({ page }) => {
  await page.goto('/book.html');
  const contains = await page.evaluate(() => {
    const target = document.querySelector('#pick-a-time');
    const frame = document.querySelector('#bkFrame');
    return !!(target && frame && target.contains(frame));
  });
  expect(contains, '#pick-a-time must contain the scheduler iframe').toBe(true);
});

/* .site-header is position:fixed and this site sets scroll-margin nowhere, so
   an anchor with no offset drops its heading underneath the header.

   This performs the jump and measures the heading, rather than asserting that
   scroll-margin-top >= header height. That proxy passes today but it is not the
   property anyone cares about: in production the panel's own box lands 6px
   under the header while its heading sits 21px clear, because the panel has
   26px of padding. A proxy that is 26px out of step with the truth is a proxy
   that will one day be green while the heading is hidden. */
test('the scheduler anchor clears the fixed header', async ({ page }) => {
  await page.goto('/book.html');
  await page.evaluate(() => { location.hash = '#pick-a-time'; });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const h2 = document.querySelector('#pick-a-time h2');
    const hdr = document.querySelector('.site-header');
    return {
      headerFixed: getComputedStyle(hdr).position,
      headerBottom: Math.round(hdr.getBoundingClientRect().bottom),
      headingTop: Math.round(h2.getBoundingClientRect().top),
      headingText: h2.textContent.trim(),
    };
  });
  expect(r.headerFixed, 'premise of this test').toBe('fixed');
  expect(
    r.headingTop,
    `"${r.headingText}" lands at ${r.headingTop}px, under the header's ${r.headerBottom}px edge`,
  ).toBeGreaterThanOrEqual(r.headerBottom);
});
