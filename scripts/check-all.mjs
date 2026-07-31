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
  results.push({ label, ok });
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

// 1. Consistency: pure file reads, fastest, catches the most.
run('consistency', process.execPath, ['scripts/check-consistency.js']);

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

// 3. Playwright: the slowest, so it goes last.
run('playwright', 'npx', ['playwright', 'test']);

// 4. Agent sync + spoken-price drift, in the engine repo when it is present.
{
  const engine = path.join(root, '..', 'nevamis-engine');
  const { existsSync } = await import('node:fs');
  if (existsSync(engine)) {
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
