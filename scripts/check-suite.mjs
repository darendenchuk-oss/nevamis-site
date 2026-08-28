#!/usr/bin/env node
/* ============================================================
   IS THE SUITE THAT JUST PASSED THE WHOLE SUITE?

   On 2026-08-09 this checkout sat four commits behind origin/main. Three spec
   files did not exist at that commit, so Playwright collected 15 files instead
   of 18 and reported "121 passed" - green, and eleven tests short of the real
   suite. Nothing was broken. Nothing said anything. The only symptom was a
   number that had to be remembered to look wrong.

   Two independent things can produce that, and they need separate limbs:

     COLLECTION DRIFT  a spec file exists but Playwright does not run it
                       (renamed out of testMatch, landed in testIgnore, added
                       but never tracked, or one bad import taking the run down)

     STALE CHECKOUT    the files themselves are old, so the sets agree with
                       each other and all three are wrong together

   The second is the one that bit, and the three-set comparison cannot see it:
   a stale checkout is internally consistent. It has to be asked of the remote.

   Deliberately NOT a pinned test count. The number must be free to grow; what
   must not be free is a file quietly dropping out of the run.

     node scripts/check-suite.mjs
   0 = collected set agrees and the checkout is current
   1 = something is wrong with the run
   2 = could not tell (offline, or no remote branch) - the house "waiting" code
   ============================================================ */
import { execFileSync, execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let fail = 0, cannotTell = 0;
const err = (m) => { console.error("FAIL: " + m); fail++; };
const wait = (m) => { console.error("CANNOT VERIFY: " + m); cannotTell++; };

const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

/* ---------- limb 1: does Playwright run every spec that exists? ---------- */
let report;
/* Through a shell as one string, the way check-all.mjs spawns npx: on Windows
   npx is a .cmd and execFile cannot spawn it directly (ENOENT). Node 22+ warns
   about an args array alongside shell:true, so the command is pre-joined.
   A frozen literal with nothing interpolated: every other command in this file
   uses execFile with an argument array, and the one place a shell is needed is
   the one place there is no input to inject. */
const listCmd = "npx playwright test --list --reporter=json";
try {
  report = JSON.parse(execSync(listCmd,
    { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }));
} catch (e) {
  /* --list exits non-zero when a spec fails to LOAD, and still prints the
     report on stdout. That output is the diagnosis, so read it rather than
     reporting the exit code. */
  try { report = JSON.parse(String(e.stdout || "")); }
  catch { err(`playwright --list did not produce a report:\n       ${String(e.stderr || e.message).slice(0, 400)}`); }
}

if (report) {
  /* Errors FIRST. One bad import collapses `suites` to empty, and a naive set
     difference would then blame all nineteen files for one broken one. */
  const errors = report.errors ?? [];
  if (errors.length) {
    for (const e of errors.slice(0, 5)) {
      err(`a spec file could not be loaded, so the run would silently be smaller:\n       `
        + `${(e.location?.file ?? "?")}: ${String(e.message ?? "").split("\n")[0].slice(0, 200)}`);
    }
  } else {
    const collected = new Set();
    const walk = (suites) => {
      for (const s of suites ?? []) {
        for (const sp of s.specs ?? []) if (sp.file) collected.add(sp.file.replace(/\\/g, "/"));
        walk(s.suites);
      }
    };
    walk(report.suites);

    /* Enumerate from Playwright's OWN declared config rather than a second
       copy of the glob, or this guard drifts from the thing it guards. */
    const proj = (report.config?.projects ?? [])[0] ?? {};
    const testDir = proj.testDir ?? path.join(root, "tests");
    const patterns = [proj.testMatch ?? "**/*.spec.js"].flat()
      .filter((p) => typeof p === "string");
    const onDisk = new Set();
    for (const pattern of patterns) {
      for (const f of fs.globSync(pattern, { cwd: testDir })) onDisk.add(String(f).replace(/\\/g, "/"));
    }

    const tracked = new Set(
      git(["ls-files", "--", "tests"]).split("\n").filter(Boolean)
        .map((f) => f.replace(/^tests\//, ""))
        .filter((f) => [...onDisk].includes(f) || f.endsWith(".spec.js")));

    for (const f of onDisk) {
      if (!collected.has(f)) {
        err(`tests/${f} exists but Playwright does not collect it.\n`
          + `       It matches nothing in testMatch, or testIgnore excludes it. A suite that\n`
          + `       passes without it is not the suite you think passed.`);
      }
    }
    for (const f of tracked) {
      if (!onDisk.has(f)) {
        err(`tests/${f} is tracked by git but missing from this working tree.\n`
          + `       Usually a stale checkout: see below. Never run the suite from here.`);
      }
    }
    if (!fail) console.log(`suite: ${collected.size} spec file(s), all tracked and all collected.`);
  }
}

/* ---------- limb 1b: can the builders still reproduce the pages? ----------
   A different question from the two below, and it belongs here for the same
   reason they do: it is a way for a green run to be lying. scripts/
   build-content.mjs overwrites nine pages whole, and on 2026-08-27 the
   checked-in copies had drifted far enough that running the documented build
   command would have deleted live copy from all nine and reported success.
   Delegated rather than reimplemented: check-generator-drift.mjs owns the
   restore, and two copies of a routine that runs builders and then
   `git checkout --` is one copy too many. Its exit codes are this file's:
   0 clean, 1 drift, 2 cannot tell. */
try {
  const r = spawnSync(process.execPath, [path.join(root, "scripts", "check-generator-drift.mjs")],
    { cwd: root, encoding: "utf8" });
  const out = ((r.stdout || "") + (r.stderr || "")).trim();
  if (r.status === 0) { if (out) console.log(out); }
  else if (r.status === 2) wait("generator drift could not be checked.\n" + out);
  else err("the builders no longer reproduce the committed pages.\n" + out);
} catch (e) {
  wait(`could not run check-generator-drift.mjs (${String(e.message).split("\n")[0].slice(0, 120)}).`);
}

/* ---------- limb 2: are those files current? ---------- */
/* Compared against the CURRENT branch's own remote tip, not against main: on a
   feature branch, being behind main is normal and being behind your own pushed
   branch is not. That also keeps CI quiet on pull requests. */
try {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch === "HEAD") {
    wait("detached HEAD, so there is no branch to compare against a remote.");
  } else {
    let remoteLine = "";
    try {
      remoteLine = execFileSync("git", ["ls-remote", "origin", `refs/heads/${branch}`],
        { cwd: root, encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "pipe"] }).trim();
    } catch {
      wait(`could not reach origin, so this checkout's freshness is unknown. Run: git fetch`);
    }
    if (remoteLine) {
      const remoteSha = remoteLine.split(/\s+/)[0];
      let known = true;
      try { git(["cat-file", "-e", `${remoteSha}^{commit}`]); } catch { known = false; }
      if (!known) {
        /* NOT the shallow-clone case, which is the tempting reading. ls-remote
           downloads no objects, so a tip this checkout cannot resolve is a tip
           it has never fetched - which is exactly what "stale" means. Routing
           this to a soft warning would miss the failure the guard exists for. */
        err(`origin/${branch} is at ${remoteSha.slice(0, 8)}, which this checkout has never fetched.\n`
          + `       The working tree is behind, so files that exist upstream are missing here and\n`
          + `       the suite will quietly be smaller. Run: git fetch && git status`);
      } else {
        let ancestor = true;
        try { git(["merge-base", "--is-ancestor", remoteSha, "HEAD"]); } catch { ancestor = false; }
        if (!ancestor) {
          const behind = git(["rev-list", "--count", `HEAD..${remoteSha}`]);
          err(`this checkout is ${behind} commit(s) behind origin/${branch}.\n`
            + `       Spec files added upstream do not exist here, so a green run proves less than\n`
            + `       it appears to. Run: git pull --ff-only`);
        } else if (!fail) {
          console.log(`checkout: up to date with origin/${branch}.`);
        }
      }
    }
  }
} catch (e) {
  wait(`git is not usable here (${String(e.message).split("\n")[0].slice(0, 120)}).`);
}

if (fail === 0 && cannotTell === 0) console.log("Suite collection check passed.");
process.exit(fail > 0 ? 1 : cannotTell > 0 ? 2 : 0);
