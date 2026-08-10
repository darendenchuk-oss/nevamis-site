/* The attribution boundary.
 *
 * nevamis.ca/privacy promises that each analytics count records "only the event
 * name, the page path, the referring site's hostname, and campaign tags", and
 * that "no identifiers are stored". That was true only by accident: every
 * reporter copied location.search wholesale and trusted that no page carried
 * anything personal. proposal.html carries ?to=<recipient name>, so a real
 * person's name was reaching site_events.source.
 *
 * These tests drive the REAL client path - load a page, intercept what the
 * browser actually posts - rather than unit-testing a helper. A sanitiser that
 * production does not call is not a fix.
 *
 * Every request is ABORTED, so running this suite never writes to the engine.
 */
import { test, expect } from '@playwright/test';

/** The only URL parameters allowed to leave the browser. Mirrors
 *  NV_ATTRIB_KEYS in site.js and the fields src/domain/attribution.ts reads. */
const ALLOWED = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term',
  'utm_content', 'gclid', 'msclkid', 'fbclid']);

const TELEMETRY = ['**/api/events', '**/api/mkt/events', '**/api/interest', '**/api/callback'];

/** Load `path`, capture every telemetry payload, send none of them. */
async function capture(page, path) {
  const seen = [];
  for (const pattern of TELEMETRY) {
    await page.route(pattern, (route) => {
      seen.push({ url: route.request().url(), body: route.request().postData() || '' });
      route.abort();
    });
  }
  await page.goto(path).catch(() => {});
  await page.waitForTimeout(1200);
  return seen;
}

/** Keys found in any `source` string across the captured payloads. */
function sourceKeys(seen) {
  const keys = [];
  for (const s of seen) {
    let o;
    try { o = JSON.parse(s.body); } catch { continue; }
    const src = String(o.source ?? '');
    if (!src) continue;
    const qs = src.includes('?') ? src.slice(src.indexOf('?') + 1) : src;
    for (const [k] of new URLSearchParams(qs)) keys.push(k);
  }
  return keys;
}

function sources(seen) {
  return seen.map((s) => { try { return String(JSON.parse(s.body).source ?? ''); } catch { return null; } })
    .filter((v) => v !== null);
}

/* ---- identifiers must not reach telemetry ---- */

/* Deliberately not a substring search for "to=". The baseline run proved that
   approach misses ?%74%6f= (percent-encoded "to") and ?To= (different case),
   both of which URLSearchParams resolves. The invariant is about the KEY SET,
   so it is asserted on the parsed keys. */
const LEAKY = [
  { what: 'a personal name', path: '/proposal.html?to=Test%20Person', forbid: ['Test Person', 'Test%20Person'] },
  { what: 'an email address', path: '/proposal.html?to=test%40example.com', forbid: ['test@example.com'] },
  { what: 'an unknown parameter', path: '/proposal.html?customer_id=12345', forbid: ['customer_id', '12345'] },
  { what: 'a percent-encoded key', path: '/proposal.html?%74%6f=Sneaky', forbid: ['Sneaky'] },
  { what: 'a double-encoded key', path: '/proposal.html?to=%2554%2565st', forbid: ['%54%65st'] },
  { what: 'an array-style key', path: '/proposal.html?to[]=A&to=B', forbid: ['to[]'] },
  { what: 'a differently-cased key', path: '/proposal.html?To=Person&UTM_SOURCE=Caps', forbid: ['Person', 'Caps'] },
];

for (const c of LEAKY) {
  test(`telemetry never carries ${c.what}`, async ({ page }) => {
    const seen = await capture(page, c.path);
    expect(seen.length, 'no telemetry captured, so this test proved nothing').toBeGreaterThan(0);

    for (const k of sourceKeys(seen)) {
      expect(ALLOWED.has(k), `key "${k}" reached telemetry and is not an approved campaign tag`).toBe(true);
    }
    for (const f of c.forbid) {
      for (const s of seen) {
        expect(s.body, `"${f}" reached ${s.url}`).not.toContain(f);
      }
    }
  });
}

/* ---- legitimate attribution must survive ---- */

test('approved campaign tags still reach analytics', async ({ page }) => {
  const seen = await capture(page, '/?utm_source=frontier-verify&utm_medium=cpc&utm_campaign=aug');
  const src = sources(seen).filter(Boolean);
  expect(src.length, 'campaign tags must still be reported').toBeGreaterThan(0);
  const q = new URLSearchParams(src[0]);
  expect(q.get('utm_source')).toBe('frontier-verify');
  expect(q.get('utm_medium')).toBe('cpc');
  expect(q.get('utm_campaign')).toBe('aug');
});

/* The marker every Frontier production check uses. If sanitising broke it,
   verification traffic would stop being identifiable and therefore stop being
   excludable from real reporting. */
test('the frontier-verify marker survives, so verification stays excludable', async ({ page }) => {
  const seen = await capture(page, '/book.html?utm_source=frontier-verify');
  const src = sources(seen).filter(Boolean);
  expect(src.some((s) => new URLSearchParams(s).get('utm_source') === 'frontier-verify')).toBe(true);
});

test('allowed tags survive alongside disallowed ones rather than all-or-nothing', async ({ page }) => {
  const seen = await capture(page,
    '/proposal.html?to=Test%20Person&utm_source=frontier-verify&customer_id=12345&utm_campaign=aug');
  const src = sources(seen).filter(Boolean);
  expect(src.length).toBeGreaterThan(0);
  const q = new URLSearchParams(src[0]);
  expect(q.get('utm_source')).toBe('frontier-verify');
  expect(q.get('utm_campaign')).toBe('aug');
  for (const s of seen) {
    expect(s.body).not.toContain('Test Person');
    expect(s.body).not.toContain('12345');
  }
});

/* ---- the fix must not have broken analytics ---- */

test('events still send, and their names are unchanged', async ({ page }) => {
  const seen = await capture(page, '/?utm_source=frontier-verify');
  const names = seen.map((s) => { try { return JSON.parse(s.body).name; } catch { return null; } }).filter(Boolean);
  expect(names, 'the page view must still be reported').toContain('page_view');
  /* Sanitising touched only `source`. A renamed event would silently detach
     from every funnel stage in src/domain/funnel.ts. */
  for (const n of names) expect(n).toMatch(/^[a-z0-9_]+$/);
});

/* Lead forms post source as "<label><?tags>", the shape attributionFrom parses.
   The label must survive sanitising, or every lead loses its origin page. */
test('lead-form source keeps its label and its parseable shape', async ({ page }) => {
  const seen = await capture(page, '/coming-soon.html?utm_campaign=aug&to=Test%20Person');
  const src = sources(seen).filter(Boolean);
  expect(src.length).toBeGreaterThan(0);
  for (const s of seen) expect(s.body).not.toContain('Test Person');
});
