#!/usr/bin/env node
/* ============================================================
   PRE-RENDER SECTION 4'S BREADTH BLOCK INTO home.html.

     node scripts/build-breadth.mjs        write it
     node scripts/build-breadth.mjs --check  print it, write nothing

   Then: node scripts/promote.mjs, to carry it into index.html.

   WHY PRE-RENDERED AND NOT DRAWN AT RUNTIME. This block is the site's answer
   to "what does this company actually do", which is the question an answer
   engine is most likely to ask and the one a visitor with scripts blocked is
   least able to wait for. /coming-soon.html builds its cards from the same
   data after load, which is fine for a page somebody chose to browse and is
   not fine for the homepage. Same reasoning as guards 7a and 7i.

   THE SEAM. Everything this script knows about the product comes from ONE
   object handed to breadthModel(). Today that object is window.NV_ROADMAP out
   of roadmap-config.js; when the generated public-safe manifest exists, the
   ten lines under `read the source` below are the whole of the change, and
   nothing about scripts/lib/breadth.mjs, the markup, or rule 7k moves with it.

   RUNNING THIS IS OPTIONAL, which is unusual for a builder and is deliberate:
   rule 7k rebuilds the same model and fails if home.html disagrees with it, so
   the page is verified whether or not anyone remembers this command. The
   builder exists so that following the config is a keystroke rather than a
   careful hand-edit of sixteen sentences.
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { breadthModel, renderBreadth } from "./lib/breadth.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
export const OPEN = "<!-- generated:breadth -->";
export const CLOSE = "<!-- /generated:breadth -->";

/* ---------- read the source ---------- */
/* THIS IS THE SWAP POINT. Replace these four lines with a read of the
   generated manifest and nothing else in the breadth pipeline changes. */
export function loadBreadthSource() {
  const w = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, "roadmap-config.js"), "utf8"), { window: w }, { timeout: 1000 });
  return w.NV_ROADMAP;
}

/* IMPORTABLE, and the body below runs only when this file is invoked as a
   command. check-consistency.js imports loadBreadthSource, OPEN and CLOSE from
   here so the guard reads the SAME source through the SAME loader and looks
   for the SAME markers as the writer. Two copies of any of the three would let
   the builder and the guard drift apart and both look green, which is the
   defect promote.mjs and rule 11 already solved this way: one function, two
   callers. */
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const model = breadthModel(loadBreadthSource());
  if (model.problems.length) {
    for (const p of model.problems) console.error("FAIL: " + p);
    console.error("\nRefusing to render a breadth block from a source that does not describe itself.");
    process.exit(1);
  }

  const block = renderBreadth(model);
  if (process.argv.includes("--check")) {
    console.log(block);
    process.exit(0);
  }

  const file = path.join(root, "home.html");
  const html = fs.readFileSync(file, "utf8");
  const open = html.indexOf(OPEN);
  const close = html.indexOf(CLOSE);
  if (open === -1 || close === -1 || close < open) {
    console.error(`FAIL: home.html has no ${OPEN} ... ${CLOSE} region to write into.`);
    process.exit(1);
  }

  /* Line endings are taken from the file rather than assumed. core.autocrlf is
     true on this machine, and a builder that writes LF into a CRLF file makes
     every subsequent diff unreadable and every byte comparison fail for a
     reason that has nothing to do with content. Same lesson as guard 7z. */
  const eol = html.includes("\r\n") ? "\r\n" : "\n";
  const body = block.split("\n").join(eol);
  const next = html.slice(0, open + OPEN.length) + eol + body + eol + "      " + html.slice(close);

  const shown = model.pillars.reduce((n, p) => n + p.tasks.length, 0);
  const more = model.pillars.reduce((n, p) => n + p.more, 0);
  if (next === html) {
    console.log(`breadth block already current: ${model.pillars.length} pillars, ${shown} tasks shown, ${more} counted as more.`);
  } else {
    fs.writeFileSync(file, next);
    console.log(`home.html breadth block written: ${model.pillars.length} pillars, ${shown} tasks shown, ${more} counted as more.`);
    console.log("Run node scripts/promote.mjs to carry it into index.html.");
  }
}
