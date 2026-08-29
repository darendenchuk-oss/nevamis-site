# Cinematic scroll sequences: the foundation

Branch `rebuild/cinematic-stage`, worktree `C:\Users\daren\nvsite-cine`, cut from
`rebuild/site-ia` at `ebc869f3`.

**No approved sequence frames exist and none may be generated.** There is a hard
owner gate on paid generation. Everything here is built and proved against
procedurally generated placeholder frames, so that when approved sequences arrive
they drop in as data and nothing has to be rewritten.

## Read in this order

| file | what it settles |
| --- | --- |
| `API-CONTRACT.md` | the exact module surface three agents build against |
| `frame-manifest.schema.json` | the manifest format, as a schema |
| `frame-manifest.example.json` | a real, validating example with placeholder paths |
| `FRAME-CODE.md` | how a guard reads the painted frame index off the canvas |

## Commands

```
npm run cine:frames     # generate placeholder frames into artifacts/ (self testing)
npm run cine:frames -- --clean
npm run cine:check      # the contract guard
npm run cine:serve      # serve.js on port 3291, this branch's port
```

`npm run cine:frames` writes 512 PNGs, about 4 MB, into
`artifacts/cinematic-placeholders/`. That directory is gitignored and excluded
from the Pages build. It is scaffolding: regenerate it, never commit it.

## Files this foundation added

| file | role |
| --- | --- |
| `config/cinematic-sequences.json` | sequence identity, section spans, chapters, frame count ranges. One source of truth. |
| `config/cinematic-build-sentinel.json` | proof of which checkout a browser measurement measured |
| `assets/cinematic/manifest.js` | load, validate, variant selection, URL resolution, progress to index. Shipped, do not reimplement. |
| `scripts/lib/frame-code.mjs` | the NVFC1 codec |
| `scripts/lib/png.mjs` | dependency free PNG encode and decode |
| `scripts/gen-placeholder-frames.mjs` | the placeholder generator, with its own self test |
| `scripts/check-cinematic-contract.mjs` | the contract guard |
| `tests/helpers/cinematic.js` | Playwright side helpers every cinematic spec must use |

## Two hazards, both of which have already bitten this repository

**The port.** Playwright's `reuseExistingServer` means whichever checkout already
owns the port is the one that gets tested. Serve on `NV_PORT=3291` and call
`assertServingThisWorktree(page)` before believing any measurement. Never run two
Playwright invocations at once.

**Success reported for nothing done.** A canvas sized while `display:none`
returns zero width and silently keeps the 300x150 default backing store. A
reduced motion rule scoped to a class that is absent exactly when reduced motion
is on can never match. A guard that counts occurrences in source stays green when
a condition moves. Every guard here is written so those fail loudly, and the two
that decide truth were mutation tested rather than assumed: see the last section
of `FRAME-CODE.md`.

## Copy rules that apply to everything in this subsystem

Sentence case. `NEVAMIS` in caps in brand contexts. No em dashes anywhere. Never
"AI" attached to the NEVAMIS name. One primary action per section.
