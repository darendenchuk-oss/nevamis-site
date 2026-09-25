/* ============================================================
   THE COMMENTS A STRANGER CAN READ IN A SERVED FILE.

   Every file nevamis.ca serves is readable in full with view-source, and a
   comment is part of the file. rendered-text.mjs answers "what does a visitor
   SEE", so it throws comments away. This answers the opposite question for
   check-published-surface.mjs: what does a visitor who opens the source READ
   that the page itself never showed them.

   The finding that made it necessary (F149b, 2026-09-24): pricing-config.js
   is served because pricing.html renders from it, and its header comment
   carried the internal commercial model, including a figure the business
   deliberately does not say aloud, labelled as never to be said aloud. A
   buyer who reads that in view-source does not read it as a note to a
   developer; they read it as something being kept from them.

   What is returned, per file type:
     .js / .mjs   every block and line comment
     .css         every block comment
     .html        every <!-- --> comment, plus the comments inside each
                  inline <script> (not JSON-LD, which has none) and <style>
   Each comment comes back as { text, line } with the 1-based line it starts
   on, so a failure can point at it.

   THE SCANNER, AND WHY IT IS NOT A REGEX. A regex cannot tell a comment from
   the same characters inside a string ("https://nevamis.ca" looks like a line
   comment) or inside a regular-expression literal (/\/\*.../ looks like a
   block comment). It tracks which construct it is inside instead, and it
   recognises a regex literal the way a tokenizer does without a full parse:
   a "/" where an expression may start (after an operator, an opening
   bracket, a comma, a keyword such as return, or at the start of the file)
   opens a regex, anywhere else it is division. That heuristic is what lets
   the minified bundles in assets/film/ be scanned without inventing comments
   out of their code. It is not a JavaScript parser, and callers should
   match on PROSE, not on bare identifiers: the guard that uses this reads
   "prototype" only where it is not a property (`Array.prototype`), for
   exactly that reason.
   ============================================================ */

const REGEX_AFTER_KEYWORD = /(?:^|[^\w$.])(?:return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

/** Block and line comments of JavaScript source, in source order. */
export function jsComments(src) {
  const out = [];
  const n = src.length;
  let i = 0;
  let line = 1;
  /* The last significant (non-space, non-comment) code character seen, and
     the code text just before a "/", decide whether that "/" opens a regex. */
  let lastSig = "";
  let codeTail = "";
  const note = (ch) => { if (!/\s/.test(ch)) { lastSig = ch; } codeTail = (codeTail + ch).slice(-16); };
  const regexMayStart = () => lastSig === "" || /[(,=:[!&|?{};+\-*%<>~^]/.test(lastSig) || REGEX_AFTER_KEYWORD.test(codeTail.trimEnd());

  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "\n") { line++; note(c); i++; continue; }
    if (c === "/" && d === "/") {
      const start = line;
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? n : end;
      out.push({ text: src.slice(i + 2, stop), line: start });
      i = stop;
      continue;
    }
    if (c === "/" && d === "*") {
      const start = line;
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end;
      const body = src.slice(i + 2, stop);
      out.push({ text: body, line: start });
      line += (body.match(/\n/g) || []).length;
      i = end < 0 ? n : end + 2;
      codeTail += " ";
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      /* A string or template literal: skip it whole, counting its newlines.
         A template's ${...} is skipped with it; a comment written inside an
         interpolation is not read, which no file on this site does. */
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") { if (src[j + 1] === "\n") line++; j += 2; continue; }
        if (src[j] === "\n") { if (c !== "`") break; line++; }
        j++;
      }
      note(c);
      /* An unterminated quote stops at its newline, which the main loop then
         counts; a closed one resumes after its closing quote. */
      i = src[j] === c ? j + 1 : j;
      continue;
    }
    if (c === "/" && regexMayStart()) {
      /* A regex literal: up to the closing "/" that is neither escaped nor
         inside a [character class], then its flags. */
      let j = i + 1;
      let inClass = false;
      while (j < n && src[j] !== "\n") {
        const r = src[j];
        if (r === "\\") { j += 2; continue; }
        if (r === "[") inClass = true;
        else if (r === "]") inClass = false;
        else if (r === "/" && !inClass) break;
        j++;
      }
      if (src[j] === "/") j++;
      while (j < n && /[a-z]/i.test(src[j])) j++;
      note("/");
      lastSig = "x";
      i = j;
      continue;
    }
    note(c);
    i++;
  }
  return out;
}

/** Block comments of a stylesheet. CSS has no line comments. */
export function cssComments(src) {
  const out = [];
  const re = /\/\*([\s\S]*?)(?:\*\/|$)/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    out.push({ text: m[1], line: src.slice(0, m.index).split("\n").length });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

/** HTML comments, and the comments of every inline script and stylesheet. */
export function htmlComments(src) {
  const lineAt = (idx) => src.slice(0, idx).split("\n").length;
  const shift = (list, offset) => list.map((c) => ({ text: c.text, line: c.line + lineAt(offset) - 1 }));
  const out = [];
  for (const m of src.matchAll(/<!--([\s\S]*?)(?:-->|$)/g)) out.push({ text: m[1], line: lineAt(m.index) });
  const script = /<script\b(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/gi;
  for (const m of src.matchAll(script)) out.push(...shift(jsComments(m[1]), m.index + m[0].indexOf(m[1])));
  const style = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  for (const m of src.matchAll(style)) out.push(...shift(cssComments(m[1]), m.index + m[0].indexOf(m[1])));
  return out.sort((a, b) => a.line - b.line);
}

/** The comments of one served file, chosen by its extension; [] for a type
 *  that has no comment syntax (JSON, text, media). */
export function commentsOf(file, src) {
  if (/\.(?:m?js)$/i.test(file)) return jsComments(src);
  if (/\.css$/i.test(file)) return cssComments(src);
  if (/\.html?$/i.test(file)) return htmlComments(src);
  return [];
}
