/* ============================================================
   THE REPOSITORY THAT HAD NO CI, AND THE WAYS IT COULD SILENTLY GO BACK

   Until 2026-08-28 this repository had no `.github` directory at all. Every
   guard in scripts/ ran only where somebody typed `npm run check`, and the
   cost is on the record: six dead CSS identifiers and a call-to-action
   pointing at a 404 reached the live site, and two public commercial
   contradictions sat there for days — each one catchable by a guard that
   already existed and that nothing automatic had run.

   .github/workflows/ci.yml now runs that chain remotely. These tests defend
   the two properties that would take it away again WITHOUT ANYTHING TURNING
   RED, which is the only failure mode that matters for a gate:

     A BASE-BRANCH FILTER   `branches:` under `pull_request` filters the BASE
                            branch. A pull request aimed at a feature branch
                            would then match no trigger and start no run: not
                            a failure, not a cancellation, no run. GitHub
                            reports such a pull request as mergeable,
                            mergeStateStatus CLEAN, and CLEAN renders green.
                            Recorded in the sibling engine repository on
                            2026-08-28: #207 and #208 both CLEAN with a check
                            rollup containing only Vercel, and `gh run list`
                            for their head branches returning nothing at all.

     A RENAMED JOB          GitHub publishes a check under the job id unless
                            the job declares a `name:`. Any branch-protection
                            rule matches that string literally, so a rename
                            does not error — it leaves the rule waiting for a
                            check that no longer exists.

   A rule written only as prose in the workflow header would be another
   comment. These read the properties out of the file.

   THE MUTATIONS THAT PROVE THIS FILE. Put `branches: [main]` back under
   `pull_request` and the base-branch cases go red by name. Rename the
   `verify` job, or give it a `name:`, and the job-name cases go red by name.
   Both were run before this was committed.
   ============================================================ */

import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const CI_PATH = '.github/workflows/ci.yml';
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const SRC = read(CI_PATH);

/* ---- A STRUCTURAL READ, NOT A GREP ----
   `branches:` appears in the `push` trigger too, and legitimately, so a
   whole-file grep for it would either miss the defect or forbid the correct
   line. The file is walked by indentation instead — YAML forbids tabs for
   indentation, so leading spaces are exact — and every assertion names the
   block it came from. No YAML parser is added for it: this repository has one
   devDependency and a guard is not worth a supply-chain entry. */
const LINES = SRC.split('\n')
  .map((raw, i) => ({ raw, no: i + 1 }))
  .filter(({ raw }) => raw.trim() !== '' && !raw.trim().startsWith('#'))
  .map(({ raw, no }) => ({ indent: raw.length - raw.trimStart().length, text: raw.trim(), no }));

/** The index of a mapping key at a given indent, searched inside a range. */
const keyIndex = (key, indent, from = 0, to = LINES.length) =>
  LINES.findIndex(
    (l, i) => i >= from && i < to && l.indent === indent && new RegExp(`^${key}\\s*:`).test(l.text),
  );

/** Everything nested under the key at `at`: the following lines indented
    deeper, stopping at the first line that is not. A missing key (`at` is -1,
    from keyIndex) yields nothing rather than throwing: the test that looks for
    that key reports its absence with a sentence a person can act on, and a
    TypeError raised here first would bury it under a stack trace from a helper.
    Found by mutation-testing this file — renaming the `verify` job produced one
    named failure and one "Cannot read properties of undefined". */
const blockAt = (at) => {
  if (at < 0 || at >= LINES.length) return [];
  const own = LINES[at].indent;
  const out = [];
  for (let i = at + 1; i < LINES.length && LINES[i].indent > own; i += 1) out.push(LINES[i]);
  return out;
};

/** Whatever follows the colon on the key's own line, for the inline forms
    (`pull_request: {branches: [main]}`), which nest nothing and would
    otherwise slip past a block walk entirely. */
const inlineAt = (at) => (at < 0 ? '' : LINES[at].text.replace(/^[^:]*:/, '').trim());

const at = (l) => `${CI_PATH}:${l.no} ${l.text}`;

const onAt = keyIndex('on', 0);
const jobsAt = keyIndex('jobs', 0);
const prAt = keyIndex('pull_request', 2, onAt + 1, jobsAt);
const pushAt = keyIndex('push', 2, onAt + 1, jobsAt);

test.describe('the CI workflow exists and its triggers still fire', () => {
  test('reads as a workflow at all, with the two blocks the rest of this file walks', () => {
    expect(onAt, `${CI_PATH} has no top-level \`on:\``).toBeGreaterThanOrEqual(0);
    expect(jobsAt, `${CI_PATH} has no top-level \`jobs:\``).toBeGreaterThanOrEqual(0);
  });

  test('still fires on pull requests at all', () => {
    expect(prAt, `${CI_PATH} no longer has a \`pull_request\` trigger. Deleting it and `
      + `restricting it produce the same outcome: pull requests with no \`verify\` run, `
      + `which GitHub reports as CLEAN and a reader sees as green.`).toBeGreaterThanOrEqual(0);
  });

  /* ---- THE ONE THIS FILE EXISTS FOR ---- */
  test('does NOT restrict pull requests by base branch, so a stacked pull request runs', () => {
    const restrictions = blockAt(prAt).filter((l) => /^branches(-ignore)?\s*:/.test(l.text));
    expect(
      restrictions.map(at),
      `The \`pull_request\` trigger is filtered by base branch. That filter is why engine `
        + `#207 and #208 never produced a run while GitHub reported them CLEAN. A stacked `
        + `pull request, one based on a feature branch rather than main, must be verified `
        + `like any other. Remove the filter.`,
    ).toEqual([]);
    const inline = inlineAt(prAt);
    expect(
      /branches/.test(inline),
      `The \`pull_request\` trigger carries an inline base-branch filter (${inline}).`,
    ).toBe(false);
  });

  /* The property stated as behaviour rather than as syntax: given the trigger
     as written, does a pull request based on a feature branch start a run? */
  test('starts a run for a base branch that is not main', () => {
    const filtered = blockAt(prAt).some((l) => /^branches(-ignore)?\s*:/.test(l.text))
      || /branches/.test(inlineAt(prAt));
    const runsFor = (base) => !filtered || base === 'main';
    expect(runsFor('rebuild/site-ia'), 'a stacked pull request would start no run').toBe(true);
    expect(runsFor('main'), 'a pull request onto main would start no run').toBe(true);
  });

  /* The deploy commit is verified too. GitHub Pages serves main directly, so
     a commit that reaches main is already public; a gate that only examined
     proposals would never look at the thing actually being served. */
  test('also runs on pushes to main, so the deployed commit is itself verified', () => {
    expect(pushAt, `${CI_PATH} no longer runs on \`push\`. main is what nevamis.ca serves.`)
      .toBeGreaterThanOrEqual(0);
    const branches = blockAt(pushAt).find((l) => /^branches\s*:/.test(l.text))?.text ?? inlineAt(pushAt);
    expect(branches, `the \`push\` trigger must still name main`).toMatch(/main/);
  });

  /* ---- DRAFTS ----
     They run today because there is no `types:` filter and no draft
     condition, which is easy to lose to a one-line "tidy-up". Work here is
     reviewed while still draft, so a gate that waits for ready-for-review
     arrives after the decision it was meant to inform. */
  test('does not exclude draft pull requests', () => {
    const types = blockAt(prAt).filter((l) => /^types\s*:/.test(l.text));
    if (types.length > 0) {
      expect(types[0].text, `\`types:\` under \`pull_request\` must still include opened and `
        + `synchronize, or drafts and follow-up pushes stop being verified`).toMatch(/opened/);
      expect(types[0].text).toMatch(/synchronize/);
    }
    const draftConditions = LINES.filter((l) => /^if\s*:.*draft/.test(l.text));
    expect(
      draftConditions.map(at),
      `a condition on \`draft\` skips the gate for exactly the pull requests this `
        + `repository reviews most`,
    ).toEqual([]);
  });

  /* ---- THE EVENT ITSELF ----
     `pull_request_target` would fix a stacked-PR symptom and open a
     supply-chain hole doing it: it runs in the context of the BASE
     repository, with its secrets and a write token, against head code the
     author controls. This repository is public and is served straight to
     nevamis.ca, so a fork's pull request is a realistic input. */
  test('uses pull_request, never pull_request_target', () => {
    const target = LINES.filter((l) => /^pull_request_target\s*:/.test(l.text));
    expect(
      target.map(at),
      `\`pull_request_target\` runs untrusted head code with this repository's secrets `
        + `and write token in scope. Use \`pull_request\`.`,
    ).toEqual([]);
  });
});

test.describe("the check's published name", () => {
  const verifyAt = keyIndex('verify', 2, jobsAt + 1);

  /* GitHub publishes a job under its id unless the job declares a `name:`,
     and any branch-protection rule matches that published string literally.
     There is no ruleset on this repository yet, so nothing requires `verify`
     today — which is exactly why the name has to hold still. Whoever adds the
     rule will type this word, and a rename afterwards does not error: it
     leaves the rule waiting for a check that no longer exists. */
  test('is the job id `verify`, which branch protection matches by string', () => {
    expect(verifyAt, `${CI_PATH} no longer defines a job called \`verify\`. A branch `
      + `protection rule requiring the status check \`verify\` matches that string `
      + `literally, so renaming this job silently un-gates main.`).toBeGreaterThanOrEqual(0);
  });

  test('is not overridden by a `name:` on the job', () => {
    const own = blockAt(verifyAt).filter((l) => l.indent === LINES[verifyAt].indent + 2);
    expect(
      own.filter((l) => /^name\s*:/.test(l.text)).map(at),
      `A \`name:\` on the \`verify\` job replaces the published check name, so a branch `
        + `protection rule naming \`verify\` would stop matching it.`,
    ).toEqual([]);
  });
});

test.describe('superseded runs are cancelled, release evidence is not', () => {
  const concAt = keyIndex('concurrency', 0);

  test('declares a concurrency group keyed on the workflow and the ref', () => {
    expect(concAt, `${CI_PATH} has no top-level \`concurrency:\`, so a push during a run `
      + `leaves two runs answering about different commits`).toBeGreaterThanOrEqual(0);
    const group = blockAt(concAt).find((l) => /^group\s*:/.test(l.text))?.text ?? '';
    expect(group).toContain('github.workflow');
    expect(group).toContain('github.ref');
  });

  /* THE HALF THAT IS NOT OBVIOUS. `cancel-in-progress: true` would also
     cancel main's push runs, and a main run is the record that a commit now
     being served to the public passed. Cancelling it leaves that commit
     permanently un-evidenced, and a CANCELLED conclusion reads as a failure
     while proving nothing either way. */
  test('cancels pull-request runs only, never a push to main', () => {
    const cancel = blockAt(concAt).find((l) => /^cancel-in-progress\s*:/.test(l.text))?.text ?? '';
    expect(cancel, 'no `cancel-in-progress` key under `concurrency`').not.toBe('');
    expect(
      /^cancel-in-progress\s*:\s*true\s*$/.test(cancel),
      `\`cancel-in-progress: true\` cancels main's push runs too. A main run is the `
        + `evidence for a commit that is already public; a later merge must not delete `
        + `it. Condition the value on the event instead.`,
    ).toBe(false);
    expect(cancel, '`cancel-in-progress` must be decided by the event that started the run')
      .toContain('github.event_name');
    expect(cancel).toContain('pull_request');
  });
});

test.describe('the job runs the real chain with the least authority it can', () => {
  /* Nothing here pushes, comments, publishes or deploys. The repository
     default is already read; this pins it so the workflow does not depend on
     a checkbox in another screen staying where it is. */
  test('pins `permissions: contents: read`', () => {
    const permAt = keyIndex('permissions', 0);
    expect(permAt, `${CI_PATH} does not pin \`permissions:\`, so GITHUB_TOKEN's scope is `
      + `whatever the repository setting happens to be`).toBeGreaterThanOrEqual(0);
    expect(blockAt(permAt).map((l) => l.text)).toContain('contents: read');
  });

  /* Asserted rather than described, because the description is the part that
     goes stale. This repository is PUBLIC and is served straight to
     nevamis.ca. If a step ever genuinely needs a secret it has to be guarded
     with `if: github.event.pull_request.head.repo.fork != true` so it SKIPS
     VISIBLY on a fork run instead of passing while doing nothing, and this
     test has to be taught the exception by name. Both are deliberate acts. */
  test('reads no `secrets.` value anywhere', () => {
    const uses = SRC.split('\n')
      .map((raw, i) => ({ raw, no: i + 1 }))
      .filter(({ raw }) => !raw.trim().startsWith('#') && /secrets\./.test(raw));
    expect(
      uses.map(({ raw, no }) => `${CI_PATH}:${no} ${raw.trim()}`),
      `A step now reads a repository secret. On a fork-originated pull request GitHub `
        + `supplies nothing for it, so the step either fails or, worse, succeeds while `
        + `doing nothing.`,
    ).toEqual([]);
  });

  /* THE CHAIN ITSELF, NOT A LIGHTER ONE. The workflow calls the composite so
     that a guard added to check-all.mjs gates from the moment it lands rather
     than waiting to be listed in YAML — a hand-maintained copy of the list is
     how a new check goes green by not being mentioned. Both halves of that
     arrangement are asserted here: the workflow must call it, and the script
     it resolves to must still be the composite. */
  test('runs `npm run check`, which package.json still points at check-all.mjs', () => {
    const invokes = LINES.filter((l) => /run:\s*npm run check\s*$/.test(l.text));
    expect(
      invokes.length,
      `${CI_PATH} no longer runs \`npm run check\`. Anything less than the composite is a `
        + `lighter chain than the one a person runs on their laptop, and the difference `
        + `is invisible from a green tick.`,
    ).toBeGreaterThan(0);
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.check, '`npm run check` must still be the whole-chain composite')
      .toContain('check-all.mjs');
  });
});

test.describe('the rule is written down where a person will meet it', () => {
  /* "An absent check is not a passing check." A gate is only half the fix;
     the other half is that a reader knows what a green page does and does not
     mean. The banner in ci.yml is the canonical wording. */
  const banner = /^#[ \t]*=+[ \t]*$\n^#[ \t]*([A-Z][A-Z0-9 ,'-]{10,})[ \t]*$\n^#[ \t]*=+[ \t]*$/m
    .exec(SRC)?.[1]?.trim();

  test('states the rule as a banner in the workflow itself', () => {
    expect(banner, `${CI_PATH} no longer carries a banner stating why an unrun check is `
      + `not a pass.`).toBeTruthy();
    expect(banner).toMatch(/ABSENT|UNRUN|NOT A PASSING/i);
  });

  /* The second sentence, which is the one that does the work when somebody is
     looking at an actual pull request page. */
  test('explains what GitHub means by CLEAN, since that is what a reader sees', () => {
    /* Read as flattened prose: the sentence spans several comment lines and
       must be free to re-wrap without this going red for a line break. */
    const prose = SRC.split('\n').map((l) => l.replace(/^\s*#\s?/, '')).join(' ')
      .replace(/\s+/g, ' ');
    expect(
      prose,
      `${CI_PATH} must still say what mergeStateStatus CLEAN actually means: only that `
        + `nothing reported failure. A check that never ran reports nothing, and that `
        + `sentence is the whole reason a reader should look at the check list rather `
        + `than the merge colour.`,
    ).toMatch(/CLEAN means only that NOTHING REPORTED FAILURE/i);
  });
});
