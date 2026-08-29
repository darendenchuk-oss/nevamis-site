/* Every site guard, one command, one answer.
   Run:  npm run check

   There were four separate guards across two repositories, each with its own
   invocation, and the whole-site audit additionally needed a server started on
   port 3211 first and stopped afterwards. That is four things to remember in
   the right order for someone who does not write code, which in practice means
   they get run rarely, or partly, or not at all — and a guard nobody runs is
   the same as no guard.

   This runs all of them, starts and stops the server itself, and prints one
   verdict at the end. Every step still runs even if an earlier one fails, so a
   single run tells you everything that is wrong rather than only the first
   thing. */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT_PORT = 3211;
const results = [];

/* shell:true ONLY for things that need PATH resolution (npx). Passing an
   absolute path through a Windows shell splits it on the space in
   "C:\Program Files\nodejs\node.exe" and fails with "'C:\Program' is not
   recognized", which reads exactly like a broken guard rather than a broken
   invocation. Found by running this script. */
function run(label, cmd, args, opts = {}) {
  process.stdout.write(`\n── ${label} ${'─'.repeat(Math.max(0, 58 - label.length))}\n`);
  /* An absolute path (node itself) is spawned directly. Anything needing PATH
     resolution (npx) goes through a shell as ONE string with no args array:
     passing an args array alongside shell:true is deprecated in Node 22+ and
     prints a security warning, which is alarming noise on a command written
     for someone who does not read Node deprecations. */
  const res = path.isAbsolute(cmd)
    ? spawnSync(cmd, args, { cwd: root, stdio: 'inherit', ...opts })
    : spawnSync([cmd, ...args].join(' '), { cwd: root, stdio: 'inherit', shell: true, ...opts });
  const ok = res.status === 0;
  results.push({ label, ok, status: res.status });
  return ok;
}

/** Resolve once the server answers, so the audit never races the listen(). */
async function waitForServer(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/* 0. Is the JUDGE sound? Runs BEFORE the content check on purpose. Every rule
      below asks whether the content is right; this asks whether the thing
      deciding that is right, and on 2026-08-10 it was not — a denial in one
      clause excused every claim sharing its sentence, so a live page could
      carry "The C$150 pilot is retired, and Pro is C$850/month with 1,200
      minutes." and exit 0 with no output. A green consistency run means
      nothing if the classifier producing it is laundering. */
run('claim classifier', process.execPath, ['scripts/check-claims-classifier.mjs']);

// 1. Consistency: pure file reads, fastest, catches the most.
run('consistency', process.execPath, ['scripts/check-consistency.js']);
/* Exit 2 means every finding was about the LIVE phone agent's prompt, which is
   edited by hand in the ElevenLabs dashboard and not in this repository. Real
   drift, worth reporting loudly, but not a reason to block a push. */
{
  const consistency = results.at(-1);
  if (consistency && consistency.status === 2) consistency.needsYou =
    'the live agent prompt contradicts pricing-config.js (scroll up for the WAIT lines). '
    + 'Apply the changes in nevamis-engine/docs/agent-prompts/PROPOSED-live-agent-changes.md, '
    + 'then update the demo.md snapshot to match what you actually saved.';
}

// 2. Whole-site audit: needs a real browser against a real server.
{
  process.stdout.write(`\n── site audit ${'─'.repeat(48)}\n`);
  const server = spawn(process.execPath, ['serve.js'], { cwd: root, stdio: 'ignore', detached: false });
  let ok = false;
  try {
    const up = await waitForServer(`http://127.0.0.1:${AUDIT_PORT}/`);
    if (!up) {
      console.error(`FAIL: the local server did not come up on ${AUDIT_PORT}`);
    } else {
      const res = spawnSync(process.execPath, ['scripts/audit-site.mjs'], {
        cwd: root, stdio: 'inherit',
      });
      ok = res.status === 0;
    }
  } finally {
    /* Always torn down, including when the audit throws. A leftover listener
       makes the NEXT run fail on a port already in use, which looks like a
       broken guard rather than a stale process. */
    server.kill();
  }
  results.push({ label: 'site audit', ok });
}

/* 2b. THE CINEMATIC STATIC GUARDS.

      CI-INVISIBLE UNTIL 2026-08-28. `grep -c cinematic scripts/check-all.mjs
      scripts/check-suite.mjs` returned 0 and 0: all four were reachable only by
      hand through `npm run cine:all`. So an edit to assets/cinematic/*.js or to
      home.html that broke the contract, the loading budget, the fallback
      stylesheet or the config-to-home binding passed `npm run check` cleanly,
      and the one guard that looks at the product page's cinematic wiring ran
      only when somebody remembered. This repository has been burned by
      CI-invisible guards before; it is written down in the memory file.

      They are fast, they are pure file reads and Node imports, and they go
      before Playwright because a contract failure explains a browser failure. */
run('cinematic contract', process.execPath, ['scripts/check-cinematic-contract.mjs']);
run('cinematic loader', process.execPath, ['scripts/check-cinematic-loader.mjs']);
run('cinematic fallback', process.execPath, ['scripts/check-cinematic-fallback.mjs']);
run('cinematic home', process.execPath, ['scripts/check-cinematic-home.mjs']);

/* 3. Is the suite about to run the WHOLE suite? Immediately before playwright,
      so a failure prints next to the test count it invalidates. This checkout
      once sat four commits behind origin/main: three spec files did not exist,
      15 of 18 were collected, and "121 passed" was reported. Nothing was
      broken and nothing said anything. */
run('suite collection', process.execPath, ['scripts/check-suite.mjs']);
{
  const suite = results.at(-1);
  if (suite && suite.status === 2) suite.needsYou =
    'could not verify this checkout is current - no network, no origin, or a detached HEAD. '
    + 'The tests below may be a smaller suite than you think. Run: git fetch && git status';
}

/* 4. Playwright: the slowest, so it goes last.

      THE PORT. playwright.config.js defaults to 3211 with reuseExistingServer,
      so a bare `npx playwright test` attaches to whichever checkout on this
      machine already owns that port and measures a different application while
      reporting a pass. This command is the one people run before pushing, so it
      gets a port of its own that nothing else defaults to, and it is passed
      through the environment exactly the way the config reads it. */
const CHECK_PORT = process.env.NV_PORT || '3271';
run('playwright', 'npx', ['playwright', 'test'], { env: { ...process.env, NV_PORT: CHECK_PORT } });

// 5. Agent sync + spoken-price drift, in the engine repo when it is present.
{
  const engine = path.join(root, '..', 'nevamis-engine');
  const { existsSync } = await import('node:fs');
  if (existsSync(engine)) {
    /* WHICH ENGINE ARE WE ASKING?

       These two checks judge the LIVE agent against a canonical they read out
       of whatever the sibling engine checkout happens to have on disk. On
       2026-08-18 that checkout sat on `apex/priced-after-a-scan` - a branch
       whose canonical says prices are NOT published, a commercial model that
       was superseded the same evening it was written. Both checks therefore
       read a live agent quoting the correct v3 prices and called it drift,
       and the printed instruction was to go and 'fix' a phone line that was
       already right.

       Following that would have edited a production agent to STOP quoting
       current prices. A judge on a superseded branch is worse than no judge,
       because it is confidently wrong in the direction of action - so this
       declines to render a verdict rather than render a false one. */
    const engineBranch = (() => {
      const r = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
        { cwd: engine, encoding: 'utf8' });
      return r.status === 0 ? String(r.stdout).trim() : null;
    })();
    const engineOnMaster = engineBranch === null || engineBranch === 'master';
    if (!engineOnMaster) {
      console.log(`
── agent checks ── NOT RUN: nevamis-engine is on '${engineBranch}', not master.`);
      console.log('   They compare the live agent against the canonical in that checkout, so a');
      console.log('   stale branch reports a correct agent as drifted.');
      console.log('   Fix: git -C ../nevamis-engine checkout master');
      results.push({ label: 'agent checks', ok: false, status: 0, needsYou:
        `nevamis-engine is checked out on '${engineBranch}', so neither agent check can be `
        + 'trusted in either direction. Put it on master and re-run before changing any agent.' });
    } else {
    run('agent sync', process.execPath, ['scripts/check-agent-sync.mjs'], { cwd: engine });
    /* Flagged as needing a decision rather than as a broken check. The live
       agent genuinely does not mention Pay As You Go, which is real drift and
       must keep reporting — but the fix is a change to the live prompt, and
       that prompt's own process says a change is drafted and approved by the
       owner before it reaches the phone line. A guard that reads FAIL for a
       thing only one person is allowed to fix trains that person to ignore the
       whole command. */
    const drift = results.at(-1);
    run('agent price drift', 'npx', ['tsx', 'scripts/kb-drift-check.mts'], { cwd: engine });
    const driftResult = results.at(-1);
    if (driftResult && !driftResult.ok) driftResult.needsYou =
      'the live agent is missing a published plan, and hardcodes a time zone offset that is wrong in winter. Both changes are written out in '
      + 'nevamis-engine/docs/agent-prompts/PROPOSED-live-agent-changes.md';
    void drift;
    }
  } else {
    console.log('\n── agent checks ── skipped: nevamis-engine is not beside this repo');
  }
}

const broken = results.filter((r) => !r.ok && !r.needsYou);
const waiting = results.filter((r) => !r.ok && r.needsYou);

console.log('\n' + '='.repeat(64));
for (const r of results) {
  console.log(`  ${r.ok ? 'pass' : r.needsYou ? 'WAIT' : 'FAIL'}  ${r.label}`);
}
console.log('='.repeat(64));

if (broken.length === 0) {
  console.log('Nothing is broken. Safe to push.');
} else {
  console.log(`${broken.length} check${broken.length === 1 ? '' : 's'} failed: ${broken.map((f) => f.label).join(', ')}`);
  console.log('Scroll up for the detail. Nothing was changed.');
}
for (const w of waiting) {
  console.log(`\nWAITING ON YOU — ${w.label}:\n  ${w.needsYou}`);
}
/* Only a genuinely broken check fails the command. A "waiting on you" item is
   reported loudly but does not block a push, because the thing it is waiting
   for is not in this repository. */
process.exitCode = broken.length === 0 ? 0 : 1;
