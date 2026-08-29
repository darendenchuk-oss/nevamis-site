/* Build a mutant copy of a shipped cinematic module, for mutation testing.
   Usage:
     node scripts/make-cine-mutant.mjs <module> "<find>" "<replace>"
     node scripts/make-cine-mutant.mjs --clean

   <module> is one of: sequence-loader | scroll-stage | fallback | index

   WHY A COPY AND NOT AN EDIT IN PLACE. Three sessions share this worktree and
   two of them were writing assets/cinematic/*.js while the guard suite ran; a
   mutation applied in place is a window in which another session's work can be
   restored away by mine. So the shipped file is READ, never written: the mutant
   lands in artifacts/cine-mutants/ (gitignored, Jekyll excluded) and the guard
   subject loads it only when NV_CINE_MUTANT names it.

   WHAT IT VERIFIES BEFORE IT WRITES, so a mutation cannot silently do nothing:
     - the module exists,
     - <find> occurs EXACTLY ONCE (zero occurrences, or several, is an error:
       "the mutation applied" is the one thing a mutation test may not assume),
     - the output differs from the input,
     - relative imports are rewritten to absolute /assets/cinematic/ paths, so
       the copy resolves the same collaborators the original does.
   Exit code is the answer. Nothing here prints "OK" on a path that did not run. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(root, 'artifacts', 'cine-mutants');
const MODULES = ['sequence-loader', 'scroll-stage', 'fallback', 'index'];

const die = (message) => { process.stderr.write(`make-cine-mutant: ${message}\n`); process.exit(1); };

const argv = process.argv.slice(2);

if (argv[0] === '--clean') {
  if (fs.existsSync(OUT_DIR)) fs.rmSync(OUT_DIR, { recursive: true, force: true });
  process.stdout.write(`removed ${path.relative(root, OUT_DIR)}\n`);
  process.exit(0);
}

const [name, find, replace] = argv;
if (!name || find === undefined || replace === undefined) {
  die('usage: make-cine-mutant.mjs <module> "<find>" "<replace>"   (or --clean)');
}
if (!MODULES.includes(name)) die(`unknown module '${name}'. One of: ${MODULES.join(', ')}`);

const sourcePath = path.join(root, 'assets', 'cinematic', `${name}.js`);
if (!fs.existsSync(sourcePath)) die(`assets/cinematic/${name}.js does not exist yet, so there is nothing to mutate`);

const original = fs.readFileSync(sourcePath, 'utf8');
const occurrences = original.split(find).length - 1;
if (occurrences === 0) {
  die(`the text to mutate does not occur in assets/cinematic/${name}.js:\n  ${JSON.stringify(find)}\n`
    + '  A mutation that changes nothing produces a passing run and a false conclusion.');
}
if (occurrences > 1) {
  die(`the text to mutate occurs ${occurrences} times in assets/cinematic/${name}.js. `
    + 'Give a longer, unique anchor so the mutation is exactly one edit.');
}

let mutated = original.replace(find, replace);
if (mutated === original) die('the replacement produced an identical file');

/* The copy lives in another directory, so its relative imports would resolve
   to siblings that are not there. Rewritten, not guessed: only ./x.js forms. */
mutated = mutated.replace(/from '\.\/([a-z0-9-]+\.js)'/g, "from '/assets/cinematic/$1'");

fs.mkdirSync(OUT_DIR, { recursive: true });
const outPath = path.join(OUT_DIR, `${name}.js`);
fs.writeFileSync(outPath, mutated);

const key = name === 'sequence-loader' ? 'loader' : name === 'scroll-stage' ? 'stage' : name;
process.stdout.write(
  `wrote ${path.relative(root, outPath)} (${mutated.length} bytes, 1 edit)\n`
  + `run the guards against it with:\n`
  + `  NV_PORT=3291 NV_CINE_MUTANT=${key} npx playwright test tests/cinematic-guards.spec.js\n`,
);
