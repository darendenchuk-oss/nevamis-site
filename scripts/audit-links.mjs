/* Crawl the LIVE site: every internal link and every referenced asset.
   Finds 404s, broken assets, and mixed content. Read-only.
   Usage: node scripts/audit-links.mjs [origin]   default https://nevamis.ca */
const ORIGIN = (process.argv[2] || "https://nevamis.ca").replace(/\/$/, "");

const seen = new Set();
const results = [];
const assets = new Map();      // url -> Set(referrers)
const externals = new Map();

const norm = (u) => u.split("#")[0].replace(/\/$/, "") || "/";

async function head(url) {
  try {
    let r = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (r.status === 405 || r.status === 501) r = await fetch(url, { method: "GET", redirect: "follow" });
    return { status: r.status, type: r.headers.get("content-type") || "" };
  } catch (e) { return { status: 0, type: "", error: String(e).slice(0, 60) }; }
}

async function crawl(pathname, referrer) {
  const key = norm(pathname);
  if (seen.has(key)) return;
  seen.add(key);

  const url = ORIGIN + (pathname.startsWith("/") ? pathname : "/" + pathname);
  let res, html = "";
  try {
    res = await fetch(url, { redirect: "follow" });
    html = res.headers.get("content-type")?.includes("html") ? await res.text() : "";
  } catch (e) {
    results.push({ url, status: 0, referrer, note: String(e).slice(0, 60) });
    return;
  }
  results.push({ url, status: res.status, referrer, finalUrl: res.url !== url ? res.url : undefined });
  if (!html) return;

  /* Strip script and style first. Inline JS builds URLs by concatenation
     (href="' + x + '") and a naive scan treats those fragments as real
     links, producing 404s that do not exist on the site. */
  const markup = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  for (const m of markup.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")
        || raw.startsWith("javascript:") || raw.startsWith("data:")) continue;

    if (raw.startsWith("http://")) {
      results.push({ url: raw, status: -1, referrer: url, note: "INSECURE http:// link" });
      continue;
    }
    if (raw.startsWith("https://")) {
      if (raw.startsWith(ORIGIN)) { await crawl(raw.slice(ORIGIN.length) || "/", url); }
      else { if (!externals.has(raw)) externals.set(raw, new Set()); externals.get(raw).add(url); }
      continue;
    }
    const abs = raw.startsWith("/") ? raw : "/" + raw.replace(/^\.\//, "");
    if (/\.(html?)$/i.test(abs) || !/\.[a-z0-9]{2,5}$/i.test(abs)) await crawl(abs, url);
    else { if (!assets.has(abs)) assets.set(abs, new Set()); assets.get(abs).add(url); }
  }
}

console.log(`crawling ${ORIGIN} ...\n`);
await crawl("/", "(root)");

console.log("=".repeat(70));
console.log(" PAGES");
console.log("=".repeat(70));
const bad = results.filter((r) => r.status !== 200);
for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
  const flag = r.status === 200 ? "  " : "!!";
  console.log(`${flag} ${String(r.status).padEnd(4)} ${r.url.replace(ORIGIN, "")}${r.note ? "   " + r.note : ""}${r.finalUrl ? "   -> " + r.finalUrl : ""}`);
}
console.log(`\n${results.length} pages, ${bad.length} not 200`);

console.log("\n" + "=".repeat(70));
console.log(" ASSETS");
console.log("=".repeat(70));
let assetBad = 0;
for (const [a, refs] of [...assets].sort()) {
  const r = await head(ORIGIN + a);
  if (r.status !== 200) { assetBad++; console.log(`!! ${String(r.status).padEnd(4)} ${a}   referenced by: ${[...refs].map((u) => u.replace(ORIGIN, "") || "/").join(", ")}`); }
}
console.log(`${assets.size} assets checked, ${assetBad} broken`);

console.log("\n" + "=".repeat(70));
console.log(" EXTERNAL LINKS");
console.log("=".repeat(70));
let extBad = 0;
for (const [u, refs] of [...externals].sort()) {
  const r = await head(u);
  const ok = r.status >= 200 && r.status < 400;
  if (!ok) { extBad++; console.log(`!! ${String(r.status).padEnd(4)} ${u}   from: ${[...refs].map((x) => x.replace(ORIGIN, "") || "/").join(", ")}`); }
}
console.log(`${externals.size} external links checked, ${extBad} failing`);
