/* Run Playwright against a port this worktree owns.
   Run:  node scripts/cine-playwright.mjs [playwright args...]

   WHY IT EXISTS. playwright.config.js defaults to 3211 with
   reuseExistingServer:true, so a bare `npx playwright test` attaches to
   whichever checkout on this machine already owns that port. The cinematic
   specs call assertServingThisWorktree() and turn that into a loud failure
   rather than a false pass, which is right and is also the wrong place to be
   solving it: the fix is not to run against a stranger's server in the first
   place.

   `NV_PORT=3291 npx playwright test ...` is not a portable npm script: on
   Windows npm scripts run through cmd.exe, where a VAR=value prefix is a
   syntax error rather than an assignment. This sets it in the environment and
   spawns, which works the same on both. NV_PORT already set is respected, so a
   caller who wants a specific port still gets it. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.NV_PORT || '3291';
const args = process.argv.slice(2);

const res = spawnSync(['npx', 'playwright', 'test', ...args].join(' '), {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NV_PORT: port },
});

process.exit(res.status === null ? 1 : res.status);
