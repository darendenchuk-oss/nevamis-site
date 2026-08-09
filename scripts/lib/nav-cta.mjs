/* The one place that knows the header CTA changes on the page it points at.

   Shared by the generator that performs the rewrite and the guard that has to
   recognise it. Without that, rule 1 ("every page shares one identical
   main-nav") reads a deliberate, generated difference as drift — and the honest
   fix is to teach the guard the transform, not to stop comparing navs. */

/** Page -> the in-page target its header button should use instead of a link
 *  to itself. A page absent from this map keeps the plain self-link: better
 *  that than inventing a destination. */
export const SELF_CTA_TARGET = { 'book.html': '#booking' };

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Apply the self-CTA rewrite for one page.
 *
 * Matches on the `btn` class so ordinary nav ITEMS that link to the current
 * page are untouched: those are normal and aria-current already announces
 * them. A BUTTON is a promise of progress, and offering the page you are
 * already on is not progress.
 *
 * The data-evt is dropped with the href, because the event means booking
 * intent and a scroll by someone already on the booking page is not intent.
 *
 * @param {string} navHtml the <nav> block
 * @param {string} file    e.g. 'book.html'
 * @returns {string}
 */
export function applySelfCta(navHtml, file) {
  const anchor = SELF_CTA_TARGET[file];
  if (!anchor) return navHtml;
  const self = file === 'index.html' ? '/' : '/' + file;
  let out = navHtml.replace(
    new RegExp(`(<a[^>]*class="[^"]*\\bbtn\\b[^"]*"[^>]*href=")${esc(self)}(")`, 'g'),
    (m, a, b) => a + anchor + b);
  out = out.replace(
    new RegExp(`(<a[^>]*href="${esc(anchor)}"[^>]*?) data-evt="[^"]*"`, 'g'),
    (m, a) => a);
  return out;
}
