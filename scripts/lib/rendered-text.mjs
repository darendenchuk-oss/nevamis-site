/* ============================================================
   WHAT A VISITOR ACTUALLY READS.

   Two guards need the same distinction and neither can do it with a plain
   file-wide regex: a rule about copy that fires on a code comment is a rule
   that gets suppressed, and a rule that skips JavaScript misses every string
   the browser renders.

   This is the split. HTML minus its comments; JavaScript minus its comments,
   reduced to its string literals. Nothing here parses either language
   properly, and it does not need to: the question is only "would a visitor
   see this text", and for a hand-written static site the answer is a
   comment-stripped body plus the string literals the DOM is built from.

   KNOWN AND ACCEPTED LIMITS. `jsStringLiterals` returns identifier-ish
   strings too ("transfer" as an object key, "GET", a CSS selector), because
   distinguishing a rendered string from a key needs a real parser. Callers
   must therefore match on PROSE, not on bare words: a guard looking for the
   word "transfer" will find `outcome: "transfer"` and must be written to
   expect that. The alternative, dropping short strings, silently loses real
   copy like "Booked." and is worse.
   ============================================================ */

/** HTML with `<!-- ... -->` removed. Comments are replaced by a space rather
 *  than deleted so two words either side of one never fuse into a third. */
export const stripHtmlComments = (src) => src.replace(/<!--[\s\S]*?-->/g, " ");

/** JavaScript with block and line comments removed.
 *
 *  Written as a single left-to-right scan rather than a pair of regexes,
 *  because the regex version cannot tell a comment from the same characters
 *  inside a string: `"https://nevamis.ca"` and a regex literal containing a
 *  slash both look like line comments to it, and stripping them corrupts the
 *  very copy this file exists to expose. The scanner tracks which construct
 *  it is inside, which is the smallest thing that gets that right. */
export function stripJsComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  let state = "code";        // code | line | block | sq | dq | tpl
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (state === "code") {
      if (c === "/" && d === "/") { state = "line"; i += 2; out += " "; continue; }
      if (c === "/" && d === "*") { state = "block"; i += 2; out += " "; continue; }
      if (c === "'") { state = "sq"; }
      else if (c === '"') { state = "dq"; }
      else if (c === "`") { state = "tpl"; }
      out += c; i++; continue;
    }
    if (state === "line") {
      if (c === "\n") { state = "code"; out += c; }
      i++; continue;
    }
    if (state === "block") {
      if (c === "*" && d === "/") { state = "code"; i += 2; out += " "; continue; }
      if (c === "\n") out += c;   // keep line numbers usable
      i++; continue;
    }
    // inside a string of some kind
    if (c === "\\") { out += c + (d ?? ""); i += 2; continue; }
    if ((state === "sq" && c === "'") || (state === "dq" && c === '"') || (state === "tpl" && c === "`")) {
      state = "code";
    }
    out += c; i++;
  }
  return out;
}

/** Every string literal in already-comment-stripped JavaScript, unescaped
 *  enough to read. Order is source order, so a caller can report the first
 *  offender meaningfully. */
export function jsStringLiterals(strippedSrc) {
  const out = [];
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(strippedSrc)) !== null) {
    const raw = m[1] ?? m[2] ?? m[3];
    if (raw === undefined || raw === "") continue;
    out.push(raw.replace(/\\(['"`\\])/g, "$1"));
  }
  return out;
}

/** A string literal reduced to the part a person could actually read.
 *
 *  Two kinds of literal in this codebase are not copy at all:
 *
 *    identifiers   `outcome: "transfer"`, a CSS selector, an event name. No
 *                  whitespace, so no sentence, so nothing to judge. A rule
 *                  looking for a word will otherwise find the object key that
 *                  the rule itself is about.
 *    embedded code  assets/motion/aurora.js holds a GLSL shader and
 *                  cursor.js holds a stylesheet, both as template literals,
 *                  and both carry their own COMMENTS. Those comments are
 *                  exactly what "literals, not comments" excludes; they are
 *                  just one level further down. Stripped here rather than
 *                  allowlisting the two files, because the next embedded
 *                  stylesheet would not be on the allowlist.
 *
 *  `://` is protected so a URL inside copy is never mistaken for a comment.
 *  Returns "" for a literal with nothing readable left. */
export function renderedProse(literal) {
  if (!/\s/.test(literal)) return "";
  let s = literal.replace(/\/\*[\s\S]*?\*\//g, " ");
  s = s.replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
  return s.trim();
}

/** Rendered text cut into clauses, so a rule can judge one assertion at a
 *  time. Same reasoning as scripts/lib/claims.mjs: a denial governs its own
 *  clause, and judging whole paragraphs lets one honest sentence excuse a
 *  dishonest one beside it. Splits on sentence ends, newlines, and the
 *  separators this site's copy actually uses between independent claims. */
export const clauses = (text) =>
  String(text)
    .split(/(?<=[.!?])\s+|\n+|<\/?[a-z][^>]*>|;\s+/i)
    .map((c) => c.replace(/\s+/g, " ").trim())
    .filter(Boolean);
