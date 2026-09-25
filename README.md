# nevamis.ca

This repository is the source of [nevamis.ca](https://nevamis.ca), the website
of Nevamis AI Inc., a company in Edmonton, Alberta that helps Canadian trades
and service businesses win more of the work they want.

What Nevamis offers, what it costs and the terms it is sold on are published on
the site, and only there:

- Services: [nevamis.ca](https://nevamis.ca) and [nevamis.ca/solutions.html](https://nevamis.ca/solutions.html)
- Pricing: [nevamis.ca/pricing.html](https://nevamis.ca/pricing.html)
- Terms and privacy: [nevamis.ca/terms.html](https://nevamis.ca/terms.html), [nevamis.ca/privacy.html](https://nevamis.ca/privacy.html)
- Contact: [Sales@nevamis.ca](mailto:Sales@nevamis.ca), or book a call at [nevamis.ca/book.html](https://nevamis.ca/book.html)

The client app at app.nevamis.ca is a separate codebase and is not in this
repository.

## How the site is made

Plain HTML, CSS and JavaScript. There is no framework and no bundler: GitHub
Pages serves the `main` branch at nevamis.ca, and a commit on `main` is live
within about a minute.

Some files are written by scripts rather than by hand. Edit the source, run the
builder, and commit what it writes; `scripts/check-generator-drift.mjs` fails
when a generated file no longer matches what its builder produces.

| Source you edit | Builder | What it writes |
|---|---|---|
| `scripts/film/source.html`, `scripts/film/sections.html`, `scripts/film/sections.css`, `scripts/film/chrome-source.html` | `python scripts/film/compose.py` | `home.html` (the homepage, noindex) and `assets/film/*.js` |
| `scripts/content/pages.mjs`, `content-map.json` | `node scripts/build-content.mjs` | the trade, situation and comparison pages, and `solutions.html` |
| `_partials/nav.html`, `_partials/footer.html`, `assets/motion/site.css`, `assets/fonts/fonts.css` | `node scripts/build-pages.mjs` | the shared header and footer, and the inlined stylesheet, on every page |
| page titles and descriptions | `node scripts/build-schema.mjs` | structured data (JSON-LD) |
| every page in `content-map.json` | `node scripts/build-search-index.mjs` | `search-index.json` |
| every inline script | `node scripts/build-csp.mjs` | each page's Content-Security-Policy |
| `home.html` | `node scripts/promote.mjs` | `index.html`, the indexable homepage |
| `content-map.json` and git history | `node scripts/gen-sitemap.mjs` | `sitemap.xml` |

Run the builders in the order listed; each later one reads what the earlier
ones wrote. Never edit `index.html` or `search-index.json` by hand.

`content-map.json` is the list of public pages. Adding a page means adding a
row there, which puts it in the sitemap, the search index and the checks.

Prices come from `pricing-config.js`. Where a page carries a figure as text,
`scripts/check-consistency.js` fails if it differs from that file.

## Run it locally

You need Node 22 (what CI uses). Python 3 is needed only to rebuild the
homepage.

```
node serve.js            # http://localhost:3211
node serve.js 3222       # another port, or set NV_PORT
```

`serve.js` compresses text responses the way GitHub Pages does, so what you
measure locally is close to production.

## Checks

The `verify` workflow (`.github/workflows/verify.yml`) runs these on every pull
request and every push to `main`. Each exits non-zero on failure, and each can
be run on its own:

```
node scripts/check-claims-classifier.mjs   # the copy checker's own rules still hold
node scripts/check-consistency.js          # copy, prices, contact details and generated blocks agree across pages
node scripts/build-csp.mjs --check         # every page's security policy matches its inline scripts
node scripts/check-published-surface.mjs   # nothing is served that should not be
node scripts/check-critical-surface.mjs    # call routing, vendored code, phone numbers, emails and outbound links are unchanged unless pinned
node scripts/check-generator-drift.mjs     # generated files reproduce from their builders
```

`npm run check` runs all of the above plus a whole-site browser audit and the
Playwright tests. The browser tests need the dev dependency installed once:

```
npm install
npx playwright install chromium
```

Changing a phone number, email address or outside link in a published file
means re-pinning it in the same commit:
`node scripts/check-critical-surface.mjs --update`, then review the diff.

## What is published

Jekyll on GitHub Pages serves everything in this repository except what
`_config.yml` excludes: working documents, scripts, tests and tooling are
excluded there. `scripts/check-published-surface.mjs` turns that into an
allow list, so publishing a new file or folder is a deliberate change to the
check rather than an accident.

## Changing the site

1. Branch from `main`.
2. Edit the source files, run the builders your change touches, and run the
   checks above.
3. Open a pull request against `main`. Merge when `verify` is green; Pages
   publishes the merge.

## Security

Please report security problems privately, as described at
[nevamis.ca/security.html](https://nevamis.ca/security.html) (also in
[SECURITY.md](SECURITY.md)). The machine-readable contact is
[/.well-known/security.txt](https://nevamis.ca/.well-known/security.txt).

## Licence

This repository has no open-source licence, so no right to reuse its contents
is granted. Third-party components keep their own licences, listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
