#!/usr/bin/env node
/* ============================================================
   CAN THE BUILDERS STILL REPRODUCE THE PAGES THEY OWN?

   scripts/build-content.mjs writes nine pages WHOLE, from
   scripts/content/pages.mjs and content-map.json. build-pages.mjs rewrites the
   chrome in eighteen. build-schema.mjs rewrites structured data. promote.mjs
   writes index.html from home.html. Every one of them is a full overwrite of a
   file a person can also edit by hand, and nothing stopped the two from
   diverging.

   They did diverge. By 2026-08-27 the checked-in pages carried a hero
   paragraph, six <title> brand suffixes, three solutions-hub cards and a whole
   hub section that the builder had never heard of, so running the documented
   command would have deleted live copy from nine pages at once and printed
   "9 pages generated." The generator was reconciled that day. This guard is
   what keeps it reconciled: a proof that expires is not a proof.

     node scripts/check-generator-drift.mjs
   0 = regenerating reproduces the committed pages exactly, and the sitemap
       still matches the pages (see the note on gen-sitemap below)
   1 = drift: either a generated page was hand-edited, or the generator no
       longer produces what is committed, or a sitemap page changed without
       a regenerated sitemap
   2 = could not tell (no git, no builders)

   WHY IT REFUSES TO RUN ON A DIRTY TREE. This script runs real builders that
   overwrite real files, then restores them with `git checkout --`. That
   restore is only safe if the files were pristine to begin with, so the first
   thing it does is prove they are. An uncommitted change inside the generated
   set is therefore reported as a failure rather than worked around, which is
   also the correct answer: a modified generated file is either a hand edit
   (the defect) or an uncommitted build (commit it first).

   gen-sitemap.mjs is deliberately NOT run here. It does not stamp today's
   date on every page (an earlier version of this note said so; it never
   did): it keeps a page's recorded <lastmod> while the page is unchanged and
   picks a new one from git or the clock only when the content moved. Those
   dates are exactly what this checkout cannot know: CI clones shallow, so
   every file's last commit there is HEAD, and a squash merge rewrites the
   dates. So the sitemap is checked by CONTENT instead, below, with no git and
   no clock: config/sitemap-hashes.json records a sha256 of every sitemap page
   (carriage returns removed) and the lastmod that goes with it, and this
   guard fails when a page no longer matches its hash, when sitemap.xml gives
   a page a different lastmod from the sidecar, or when the two list different
   pages. The fix is always the same: node scripts/gen-sitemap.mjs, then
   commit sitemap.xml and the sidecar. Squash, merge and rebase merges carry
   both files through unchanged, so main stays green whichever is used.
   gen-sitemap has to run LAST, after compose.py and every builder in
   BUILDERS below, because it hashes the pages' final bytes. Run any earlier,
   it records pages that a later step then rewrites, and this check fails on
   exactly those pages.
   ============================================================ */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SIDECAR, SITEMAP, sitemapPages, pageHash, renderSitemap, readSitemapLastmods, readSidecar, isLastmod } from "./lib/sitemap.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0, cannotTell = 0;
const err = (m) => { console.error("FAIL: " + m); fail++; };
const wait = (m) => { console.error("CANNOT VERIFY: " + m); cannotTell++; };

const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/* THE GENERATED SET. Everything the five commands below can write, and nothing
   else. Deliberately broad on the HTML side: build-pages.mjs touches every
   chromed page and build-schema.mjs several more, so naming the nine
   build-content outputs alone would let drift in the other files through. A
   root-level .html a builder never touches simply never differs. */
const generatedFiles = () => {
  const html = fs.readdirSync(root).filter((f) => f.endsWith(".html"));
  /* assets/film/*.js are written by scripts/film/compose.py, which splits the
     film's inline scripts out of home.html. They are generated, so they belong
     here: on 2026-08-31 a round of film fixes was committed as home.html only,
     the regenerated film scripts stayed uncommitted, and the deploy shipped the
     new CSS against the OLD JavaScript. Nothing failed. Listing them means an
     uncommitted regeneration is reported as dirty instead of shipping half. */
  const film = fs.existsSync(path.join(root, "assets/film"))
    ? fs.readdirSync(path.join(root, "assets/film")).filter((f) => f.endsWith(".js")).map((f) => "assets/film/" + f)
    : [];
  return [...html, ...film, "search-index.json"].filter((f) => fs.existsSync(path.join(root, f)));
};

/* The documented chain, minus gen-sitemap. Order matters: build-content writes
   the pages, build-pages puts the chrome back into them, build-schema rewrites
   their structured data, build-csp hashes the inline scripts they all left
   behind, promote copies the finished home.html to index.html, and
   build-search-index reads the finished pages, index.html among them, so it
   comes after promote. (It used to sit before build-csp. On a committed tree
   that gives the same result, but a person following that order after a
   homepage edit indexed the OLD index.html, committed a stale
   search-index.json, and this guard failed on it in CI.) Running them out of
   order proves nothing. */
const BUILDERS = [
  "build-content.mjs",
  "build-pages.mjs",
  "build-schema.mjs",
  "build-csp.mjs",
  "promote.mjs",
  "build-search-index.mjs",
];

const files = generatedFiles();
let restoreNeeded = false;
/* NEVER process.exit() inside the try below: Node tears the process down
   immediately and the finally that restores the tree does not run. Every early
   exit sets this instead, and the single exit sits after the restore. */
let aborted = false;

/* ---------- the sitemap still describes the pages on disk ----------
   First, and read-only: it needs neither git nor a clean tree, only the files.
   See the header for why this compares content and never dates. */
const REGEN = `run node scripts/gen-sitemap.mjs, then commit ${SITEMAP} and ${SIDECAR}`;
try {
  /* A sidecar that does not parse is a committed defect (a bad hand merge,
     say), not an unknown: FAIL, exit 1, with the same fix as everything else
     here. Only a failure to read the page set itself stays CANNOT VERIFY. */
  let sidecar = null, unreadable = null;
  try { sidecar = readSidecar(root); }
  catch (e) { unreadable = String(e.message).split("\n")[0].slice(0, 140); }
  const pages = sitemapPages(root);
  if (unreadable) {
    err(`${SIDECAR} is not valid JSON (${unreadable}), so no page's <lastmod> can be checked.\n       To fix: ${REGEN}.`);
  } else if (!sidecar || !sidecar.pages) {
    err(`${SIDECAR} is missing or records no pages, so no page's <lastmod> can be checked.\n       To fix: ${REGEN}.`);
  } else {
    const recorded = sidecar.pages;
    const inSet = new Set(pages.map((p) => p.file));
    const stale = pages.filter((p) => recorded[p.file] && recorded[p.file].sha256 !== pageHash(root, p.file));
    const unrecorded = pages.filter((p) => !recorded[p.file]).map((p) => p.file);
    const extra = Object.keys(recorded).filter((f) => !inSet.has(f));
    const xmlPath = path.join(root, SITEMAP);
    const xml = fs.existsSync(xmlPath) ? fs.readFileSync(xmlPath, "utf8").replace(/\r/g, "") : "";
    const stated = readSitemapLastmods(xml);
    const locs = new Set(pages.map((p) => p.loc));
    const wrongDate = pages.filter((p) => recorded[p.file] && stated.has(p.loc) && stated.get(p.loc) !== recorded[p.file].lastmod);
    const notInXml = pages.filter((p) => !stated.has(p.loc)).map((p) => p.file);
    const notAPage = [...stated.keys()].filter((loc) => !locs.has(loc));
    /* The two files agreeing is not enough if they agree on something that
       is not a date. gen-sitemap only ever writes YYYY-MM-DD, so anything else
       came from a hand edit; isLastmod() is the same test it uses to decide
       whether a recorded date may be kept, so rerunning it repairs these. */
    const notADate = pages.filter((p) => recorded[p.file] && !isLastmod(recorded[p.file].lastmod));

    if (notADate.length) {
      err(`${SIDECAR} records a <lastmod> that is not a calendar date (YYYY-MM-DD):\n`
        + notADate.map((p) => `         ${p.file}: ${JSON.stringify(recorded[p.file].lastmod)}`).join("\n")
        + `\n       To fix: ${REGEN}.`);
    }
    if (stale.length) {
      err(`${stale.length} sitemap page(s) changed after ${SIDECAR} recorded them, so their <lastmod> is stale:\n`
        + stale.map((p) => `         ${p.file} (sitemap.xml still says ${recorded[p.file].lastmod})`).join("\n")
        + `\n       To fix: ${REGEN}.`);
    }
    if (unrecorded.length || extra.length) {
      err(`${SIDECAR} and content-map.json disagree about which pages are in the sitemap.`
        + (unrecorded.length ? `\n         a sitemap page with no recorded hash: ${unrecorded.join(", ")}` : "")
        + (extra.length ? `\n         recorded, but no longer a sitemap page: ${extra.join(", ")}` : "")
        + `\n       To fix: ${REGEN}.`);
    }
    if (wrongDate.length) {
      err(`sitemap.xml and ${SIDECAR} disagree about <lastmod>:\n`
        + wrongDate.map((p) => `         ${p.file}: sitemap.xml says ${stated.get(p.loc)}, ${SIDECAR} says ${recorded[p.file].lastmod}`).join("\n")
        + `\n       To fix: ${REGEN}.`);
    }
    if (notInXml.length || notAPage.length) {
      err(`sitemap.xml and ${SIDECAR} list different pages.`
        + (notInXml.length ? `\n         missing from sitemap.xml: ${notInXml.join(", ")}` : "")
        + (notAPage.length ? `\n         in sitemap.xml but not a sitemap page: ${notAPage.join(", ")}` : "")
        + `\n       To fix: ${REGEN}.`);
    }
    /* Anything the checks above cannot name (order, priority, markup) still
       fails: the file must be exactly what gen-sitemap writes from the sidecar. */
    if (!notADate.length && !stale.length && !unrecorded.length && !extra.length && !wrongDate.length && !notInXml.length && !notAPage.length) {
      const want = renderSitemap(pages.map((p) => ({ loc: p.loc, lastmod: recorded[p.file].lastmod, priority: p.priority })));
      if (xml !== want) err(`sitemap.xml is not what gen-sitemap writes from ${SIDECAR} (order, priority or markup differs).\n       To fix: ${REGEN}.`);
      else console.log(`sitemap: ${pages.length} page(s) match their recorded hashes, and every <lastmod> matches ${SIDECAR}.`);
    }
  }
} catch (e) {
  wait(`the sitemap check could not complete (${String(e.message).split("\n")[0].slice(0, 140)}).`);
}

try {
  git(["rev-parse", "--git-dir"]);
} catch {
  wait("git is not usable here, so a regeneration cannot be compared against anything.");
  process.exit(fail > 0 ? 1 : 2);
}

for (const b of BUILDERS) {
  if (!fs.existsSync(path.join(root, "scripts", b))) {
    wait(`scripts/${b} is missing, so the chain cannot be run.`);
    process.exit(fail > 0 ? 1 : 2);
  }
}

try {
  /* ---------- precondition: the generated set is pristine ----------
     `git diff` and not `git status --porcelain`, deliberately. core.autocrlf
     is true in this repo and every builder writes LF, so immediately after a
     manual build the working tree differs from the index in line endings ONLY
     and porcelain reports all 22 pages as modified. That is not a hand edit
     and refusing on it would make this guard cry wolf after the exact command
     it is here to protect. git diff compares the normalised blobs, which is
     also what the drift comparison below uses, so both halves of this script
     agree about what "changed" means. Staged changes are asked for separately
     because git diff alone does not see them. */
  const dirty = [...new Set([
    ...git(["diff", "--name-only", "--", ...files]).split("\n"),
    ...git(["diff", "--cached", "--name-only", "--", ...files]).split("\n"),
  ])].map((l) => l.trim()).filter(Boolean);
  if (dirty.length) {
    err("these generated files have uncommitted changes, so regeneration cannot be\n"
      + "       checked and restoring them would destroy the edit:\n"
      + dirty.map((d) => "         " + d).join("\n") + "\n"
      + "       A generated page with a hand edit in it is the defect this guard exists for.\n"
      + "       Move the change into scripts/content/pages.mjs, content-map.json or\n"
      + "       scripts/build-content.mjs, rebuild, and commit. If it IS a build, commit it.");
    aborted = true;
  }

  /* ---------- run the chain ---------- */
  if (!aborted) restoreNeeded = true;
  for (const b of BUILDERS) {
    if (aborted) break;
    try {
      execFileSync(process.execPath, [path.join(root, "scripts", b)],
        { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      err(`scripts/${b} exited non-zero: ${String(e.message).split("\n")[0].slice(0, 160)}`);
      aborted = true;
    }
  }

  /* ---------- did anything move? ---------- */
  const drifted = aborted ? [] : git(["diff", "--name-only", "--", ...files])
    .split("\n").map((l) => l.trim()).filter(Boolean);
  if (drifted.length) {
    err("regenerating does not reproduce the committed pages. These differ:\n"
      + drifted.map((d) => "         " + d).join("\n") + "\n"
      + "       Either the file was hand-edited after it was generated, or the generator\n"
      + "       changed. Fix it at the SOURCE (scripts/content/pages.mjs, content-map.json,\n"
      + "       scripts/build-content.mjs), rebuild, and commit, so the next run of a\n"
      + "       documented build command cannot delete anything.");
  } else if (!aborted) {
    console.log(`generator drift: none. ${files.length} generated file(s) reproduce exactly.`);
  }
} catch (e) {
  wait(`the drift check could not complete (${String(e.message).split("\n")[0].slice(0, 140)}).`);
} finally {
  /* ALWAYS, including after a throw or an err() above. The set was proven
     pristine before the builders ran, so this can only ever undo what they
     just wrote. Scoped to the enumerated list: never `git checkout -- .`. */
  if (restoreNeeded) {
    try { git(["checkout", "--", ...files]); }
    catch (e) {
      console.error("FAIL: could not restore the generated files after the check ("
        + String(e.message).split("\n")[0].slice(0, 140) + ").\n"
        + "       Run: git checkout -- " + files.join(" "));
      fail++;
    }
  }
}

process.exit(fail > 0 ? 1 : cannotTell > 0 ? 2 : 0);
