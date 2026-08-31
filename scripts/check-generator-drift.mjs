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
   0 = regenerating reproduces the committed pages exactly
   1 = drift: either a generated page was hand-edited, or the generator no
       longer produces what is committed
   2 = could not tell (no git, no builders)

   WHY IT REFUSES TO RUN ON A DIRTY TREE. This script runs real builders that
   overwrite real files, then restores them with `git checkout --`. That
   restore is only safe if the files were pristine to begin with, so the first
   thing it does is prove they are. An uncommitted change inside the generated
   set is therefore reported as a failure rather than worked around, which is
   also the correct answer: a modified generated file is either a hand edit
   (the defect) or an uncommitted build (commit it first).

   gen-sitemap.mjs is deliberately NOT run here. It stamps <lastmod> with
   today's date, so including it would make this guard fail every day after the
   last commit, for a reason that has nothing to do with drift.
   ============================================================ */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
   their structured data, and promote copies the finished home.html to
   index.html. Running them out of order proves nothing. */
const BUILDERS = [
  "build-content.mjs",
  "build-pages.mjs",
  "build-schema.mjs",
  "build-search-index.mjs",
  "promote.mjs",
];

const files = generatedFiles();
let restoreNeeded = false;
/* NEVER process.exit() inside the try below: Node tears the process down
   immediately and the finally that restores the tree does not run. Every early
   exit sets this instead, and the single exit sits after the restore. */
let aborted = false;

try {
  git(["rev-parse", "--git-dir"]);
} catch {
  wait("git is not usable here, so a regeneration cannot be compared against anything.");
  process.exit(2);
}

for (const b of BUILDERS) {
  if (!fs.existsSync(path.join(root, "scripts", b))) {
    wait(`scripts/${b} is missing, so the chain cannot be run.`);
    process.exit(2);
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
