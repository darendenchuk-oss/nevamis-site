/* ============================================================
   SITE SEARCH

   A combobox in the hero. Three constraints shaped it:

   1. The index must not cost first paint. quality.spec.js budgets JS and
      asserts the example-call audio is never fetched until asked for; the
      same rule applies here, so search-index.json is fetched on the first
      real interaction and never before.

   2. It must work on a keyboard. This is the ARIA combobox pattern:
      aria-expanded on the input, a listbox of options, aria-activedescendant
      following the arrow keys, Enter to open, Escape to close. A dropdown
      that only responds to a mouse is a dropdown half the site's audience
      cannot use.

   3. It must not fight the hero animation. The panel is absolutely
      positioned and the hero timeline never touches these nodes.

   Matching is a plain substring over a prebuilt lowercase field, ranked by
   where the hit lands. At fifty records that is instant and correct;
   anything cleverer would be a library nobody needs.
   ============================================================ */

/** Wire the hero combobox. Safe to call on pages without a search box. */
export function initSearch() {
  const form = document.getElementById('siteSearch');
  if (!form) return;
  const input = form.querySelector('input[type="search"]');
  const panel = document.getElementById('searchResults');
  if (!input || !panel) return;

  let index = null;
  let loading = null;
  let active = -1;
  let items = [];

  /* One fetch, on the first sign of intent. Focus counts, because a visitor
     who clicks the box is about to type. */
  function load() {
    if (index || loading) return loading ?? Promise.resolve();
    loading = fetch('/search-index.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { index = data; })
      .catch(() => { index = []; });
    return loading;
  }
  input.addEventListener('focus', load, { once: true });

  function search(q) {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2 || !index) return [];
    const out = [];
    for (const r of index) {
      const at = r.k.indexOf(needle);
      if (at === -1) continue;
      /* A hit in the title is worth more than one buried in body copy, and an
         FAQ question that starts with the words the visitor typed is usually
         exactly what they meant. */
      const inTitle = r.t.toLowerCase().indexOf(needle);
      const score = inTitle === 0 ? 0 : inTitle > 0 ? 1 : 2 + Math.min(at / 400, 1);
      out.push({ r, score });
    }
    return out.sort((a, b) => a.score - b.score).slice(0, 8).map((x) => x.r);
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* The index is first-party, generated from our own pages, so this is belt
     and braces rather than a live threat. But it is the one field that goes
     into an href, and escaping quotes alone would still permit a javascript:
     URL if the file were ever tampered with. Same-origin paths only. */
  const safeUrl = (u) => (typeof u === 'string' && /^\/[^/\\]/.test(u) ? u : '/');

  /* Show where the match landed, so a body-copy hit does not look arbitrary.
     Everything is escaped before the <mark> goes in. */
  function highlight(text, needle) {
    const at = text.toLowerCase().indexOf(needle);
    if (at === -1) return esc(text.slice(0, 110));
    const from = Math.max(0, at - 30);
    const slice = text.slice(from, from + 120);
    const rel = at - from;
    return (from > 0 ? '…' : '')
      + esc(slice.slice(0, rel))
      + '<mark>' + esc(slice.slice(rel, rel + needle.length)) + '</mark>'
      + esc(slice.slice(rel + needle.length));
  }

  function close() {
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }

  function render(q) {
    const hits = search(q);
    items = hits;
    active = -1;
    input.removeAttribute('aria-activedescendant');

    if (!q.trim() || q.trim().length < 2) return close();

    if (hits.length === 0) {
      panel.innerHTML = '<p class="sr-empty">Nothing matched. Try “pricing”, “pilot”, or “how does it work”.</p>';
      panel.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      return;
    }

    const needle = q.trim().toLowerCase();
    panel.innerHTML = '<ul role="listbox" id="searchListbox" aria-label="Search results">'
      + hits.map((r, i) => `<li role="option" id="sr-${i}" aria-selected="false">`
        + `<a href="${esc(safeUrl(r.u))}" tabindex="-1">`
        + `<span class="sr-t">${esc(r.t)}${r.q ? '<span class="sr-tag">question</span>' : ''}</span>`
        + `<span class="sr-d">${highlight(r.d || r.t, needle)}</span>`
        + '</a></li>').join('')
      + '</ul>';
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function move(step) {
    if (panel.hidden || items.length === 0) return;
    const opts = panel.querySelectorAll('[role="option"]');
    if (active >= 0) opts[active]?.setAttribute('aria-selected', 'false');
    active = (active + step + opts.length) % opts.length;
    const el = opts[active];
    el.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', el.id);
    el.scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', () => { load().then(() => render(input.value)); });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Escape') { close(); input.blur(); }
    else if (e.key === 'Enter') {
      const chosen = active >= 0 ? items[active] : items[0];
      if (chosen) { e.preventDefault(); window.location.href = safeUrl(chosen.u); }
    }
  });

  form.addEventListener('submit', (e) => {
    /* No results page exists on a static site, so submitting means "take me
       to the best match" rather than reloading with a dead query string. */
    e.preventDefault();
    const chosen = active >= 0 ? items[active] : items[0];
    if (chosen) window.location.href = safeUrl(chosen.u);
  });

  document.addEventListener('click', (e) => { if (!form.contains(e.target) && !panel.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return;
    e.preventDefault();
    input.focus();
  });
}
