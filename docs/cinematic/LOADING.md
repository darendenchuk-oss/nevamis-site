# The loading and decode layer

`assets/cinematic/sequence-loader.js`. Bytes in, decoded frames out. It never
touches the DOM, the canvas or scroll, and it is the only module in the
subsystem that calls `fetch` or creates an `ImageBitmap`.

Guards: `npm run cine:loader` (Node, fetch injected, 79 assertions) and
`tests/cinematic-loader.spec.js` (a real browser, real PNGs, real
`createImageBitmap`, 6 tests). Where this document and those guards disagree,
the guards win.

---

## 1. A visitor who never scrolls downloads nothing

The loader is **inert until `prime()`**. Constructing one, and calling
`setFocus()` a thousand times, issues zero network requests, because `pump()`
returns early unless `primeActive` is set and only `prime()` sets it
(`sequence-loader.js:271`).

That is not a policy statement, it is an absence: there is no code path from
construction to `fetch`. So "an offscreen sequence makes no network requests" is
decided by *when the caller calls `prime()`*, and nothing else can leak a
request in the meantime.

**What the mount step must do.** Create the loader for every stage up front, but
call `prime()` from an `IntersectionObserver` on the stage element with a
`rootMargin` of about `400px 0px`, so a sequence starts loading as it approaches
the viewport rather than when the page loads.
`tests/fixtures/cinematic-loader-harness.html:172` is the reference wiring, and
`tests/cinematic-loader.spec.js:37` measures it: with the second stage 2400px
down the page, the browser makes **zero** requests for its frames until it is
scrolled towards, and requests appear only after activation.

LCP is untouched because nothing here runs before it. The poster and the copy
come from the served HTML; the manifest is fetched lazily; the first frame byte
is requested after the first stage is on screen.

---

## 2. Progressive loading: what a usable scrubber actually costs

Stride pass 1 fetches the **skeleton**: frame 0, every `strides[0]`-th frame, and
always the final frame, across the whole sequence. Nothing else is requested
until every skeleton frame has settled (`sequence-loader.js:247`, the
coarse-to-fine boundary). That boundary is what makes the cost measurable: the
guard snapshots the counters inside the `pass-complete` diagnostic, not after
`await prime()`, because a microtask later the refinement requests have already
started and the number stops meaning anything.

Measured against the generated placeholder frames:

| sequence / variant | frames | skeleton | skeleton bytes | full sequence | share |
| --- | ---: | ---: | ---: | ---: | ---: |
| signal-to-system desktop | 96 | 7 | 28.6 KB | 392 KB | 7.3% |
| signal-to-system mobile | 64 | 5 | 24.7 KB | 317 KB | 7.8% |
| system-to-outcomes desktop | 120 | 9 | 36.9 KB | 492 KB | 7.5% |
| system-to-outcomes mobile | 72 | 6 | 29.4 KB | 352 KB | 8.3% |
| system-to-decision desktop | 84 | 7 | 28.6 KB | 344 KB | 8.3% |
| system-to-decision mobile | 56 | 5 | 24.5 KB | 274 KB | 8.9% |

Seven frames and 28.6 KB buy a scrubber that responds everywhere: the guard
walks all 96 indices and asserts the nearest decoded frame is never more than
`strides[0]` away. That is the same class of behaviour as the prototype's 6
frames and 39.5 KB.

Refinement then runs `strides[1]`, then `strides[2] = 1`, **inside the rolling
window only**, nearest to the visitor first. The far end of the sequence is
never filled in at full density unless the visitor goes there.

---

## 3. The rolling decode window is a hard cap, and here is the arithmetic

`decodeWindow` from the manifest (24 for every generated variant) is a hard
ceiling on decoded frames held at once. It is not the whole budget, because the
skeleton has to survive a jump to anywhere in the sequence. `residencyBudget()`
splits it:

```
anchorCount  = |{0, s, 2s, ..., frameCount-1}|
reserve      = min(anchorCount, floor(decodeWindow / 3))
windowRadius = max(1, floor((decodeWindow - reserve - 1) / 2))
```

For 96 frames at stride 16 with a window of 24: 7 anchors, reserve 7, radius 8,
so a 17 frame rolling window plus 7 anchors is 24 frames at the very most.
`check-cinematic-loader.mjs` asserts `windowSpan + anchorCount <= decodeWindow`
for **every variant in the generated manifest**, so a future sequence with a
tighter window cannot quietly start evicting its own skeleton.

Eviction order, farthest from the visitor first within each class: outside the
window and not an anchor, then inside the window and not an anchor, then
anchors. The frame the visitor is on is never evicted. Every evicted
`ImageBitmap` is `close()`d, because dropping the reference alone leaves the
decoded pixels alive until the collector decides otherwise.

`stats.resident` is the live decoded count and `stats.residentIndices` lists
them, so a test asserts the cap rather than trusting it. Disabling eviction
makes the count peak at **96**, the whole sequence, and both guards fail.

An index that has been decoded and evicted twice while outside the window is not
fetched a third time, which is the only thing standing between a small window
and a fetch/evict churn loop.

---

## 4. Decoding off the main thread

`createImageBitmap(blob)` where the platform has it, which decodes on a worker
thread and hands the canvas something it can draw with no further decode. Where
it is missing, an `HTMLImageElement` plus `await img.decode()` keeps the
"decoded before it is drawn" guarantee and loses only the off-thread part. The
decoder is injectable (`options.decodeImage`), which is how the Node guard runs
the real scheduling code with no browser at all.

---

## 5. Fast scrolling, and the difference between aborted and failed

`setFocus(i)` is called every rAF tick, so the unchanged case returns on the
first line. A real move bumps the generation, aborts in flight requests now
outside the window, and schedules the next refinement pass.

**Anchors are never aborted.** They are global and needed at every scroll
position, so an abort predicate that included them would throw away the safety
net a flung scroll depends on.

**An aborted fetch is not a failure.** It goes back to fetchable, is not counted
in `stats.failed`, and emits no `frame-failed`. Treating it as a failure would
permanently blacklist every frame a fast scroll passed, and the visitor scrolling
back up would find them gone forever. `check-cinematic-loader.mjs` scrolls away,
scrolls back, and asserts the abandoned frames load. Mutating the abort branch to
count as failure produces two FAILs and exit 1.

---

## 6. Failure never reaches the stage

- A 404, a network throw, or a decoder that throws marks that one index failed,
  raises `stats.failed`, and emits `frame-failed`. Nothing rejects.
- `prime()` **always resolves**, including when every byte of the skeleton
  failed, in which case it resolves `{ ok: false }` and the caller degrades.
  It also resolves on `pause()` and on `destroy()`, so a tab hidden mid-prime
  cannot leave the fallback watchdog as the only thing that ends the wait. The
  trade is deliberate and worth stating: a tab hidden in the first moments of
  prime, before any frame has arrived, settles `{ ok: false }` and degrades to
  the poster. Safe, visible, and never a spinner.
- `get(index)` is synchronous, allocation free, never throws, and never fetches
  as a side effect. `nearest(index)` is how the stage holds a last good frame:
  when a frame is missing the stage keeps painting the nearest decoded one
  instead of clearing the canvas.
- A diagnostics consumer that throws cannot break loading, and cannot do it
  invisibly either: `stats.diagnosticErrors` counts what was swallowed.

---

## 7. Two fetches for the same frame are impossible, loudly

`startFetch()` **throws** if an index is already loading
(`sequence-loader.js:282`). There is also no long lived scheduling loop to
duplicate: `pump()` is a synchronous top up to `maxConcurrent`, called from
`prime`, `resume`, `setFocus` and each settled request. `resume()` returns early
when it was not paused. Calling `resume()` three times issues zero extra
requests and emits `resumed` once, and the guard asserts both, because a
duplicated loop is invisible until it doubles the bytes.

---

## 8. Desktop and mobile are different sequences, and the network proves it

Variant choice is `selectVariant()` in `manifest.js`, which throws unless exactly
one media query matches. The loader simply loads what it was given, and the
evidence that the right thing was given is the network: at a 390x844 viewport
every frame request is under `/mobile/` and none under `/desktop/`, the variant
is 540x960 portrait, and its frame count is 64 rather than the desktop 96. A
crop of the desktop sequence would have 96 frames and landscape dimensions, so
it cannot pass by accident.

---

## 9. Diagnostics

```
{ type:'frame-loaded',   index, bytes, ms }
{ type:'frame-failed',   index, status?, error? }
{ type:'pass-complete',  stride, resident, total }
{ type:'aborted',        count, reason:'scroll'|'pause'|'destroy' }
{ type:'window-evicted', count, resident }
{ type:'paused' } | { type:'resumed' }
```

`stats` carries the contract's six fields (`resident`, `inFlight`, `failed`,
`bytes`, `paused`, `generation`) plus read only counters a guard needs to prove
the caps are real rather than asserted: `requested`, `evicted`, `aborted`,
`pumps`, `diagnosticErrors`, `primed`, `primeSettled`, `focus`, `frameCount`,
`decodeWindow`, `windowRadius`, `anchorReserve`, `anchorCount`, `strides`,
`residentIndices`. `bytes` is cumulative downloaded bytes, not resident bytes.

---

## 10. Evidence, from exit codes

```
node scripts/check-cinematic-loader.mjs   exit 0, 79 assertions, 0 pending
node scripts/check-cinematic-contract.mjs exit 0, 110 assertions
NV_PORT=3291 npx playwright test tests/cinematic-loader.spec.js   exit 0, 6 passed
node scripts/check-consistency.js         exit 0
```

Mutation tested, each restored afterwards and verified by md5:

| mutation | result |
| --- | --- |
| `pump()` ignores the prime gate | 4 FAILs, exit 1 ("a loader that was never primed issued 35 network requests") |
| evicted bitmaps are not `close()`d | 2 FAILs, exit 1 |
| an aborted fetch counts as a failure | 2 FAILs, exit 1 |
| the decode window cap is not enforced | 2 FAILs, exit 1 (resident peaks at 96) and the browser spec fails too |
| `resume()` loses its early return | 1 FAIL, exit 1 |
| the coarse-to-fine boundary is removed | 1 FAIL, exit 1 (12 requests in pass 1, not 7) |
| the harness activates eagerly instead of on approach | browser spec fails, exit 1 |
