/* ============================================================
   CHARACTER REFERENCES, DECODED THE WAY A BROWSER READS THEM

   One copy, shared by check-critical-surface.mjs (where do published files
   point?) and check-published-surface.mjs (can an asset SVG run or load
   anything?). Attribute values are character-reference decoded before a
   browser uses them, so href="java&#115;cript:" is a javascript: URL and
   href="https&#58;//evil.example" is a link to evil.example. A guard that
   tests the raw text sees neither.
   ============================================================ */
const NAMED = { amp: '&', colon: ':', sol: '/', bsol: '\\', period: '.', commat: '@', quot: '"', apos: "'", lt: '<', gt: '>', num: '#', quest: '?', tab: '\t', newline: '\n' };

function safeChar(code, fallback) {
  try { return code > 0 && code < 0x110000 ? String.fromCodePoint(code) : fallback; } catch { return fallback; }
}

export function decodeRefs(text) {
  return text
    .replace(/&#x([0-9a-f]+);?/gi, (m, h) => safeChar(parseInt(h, 16), m))
    .replace(/&#(\d+);?/g, (m, d) => safeChar(parseInt(d, 10), m))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m);
}
