# Cinematic scroll stage: API contract

Binding on every module under `assets/cinematic/`. Three agents implement
against this in parallel, so anything ambiguous here becomes a merge conflict
later. Where this document and `scripts/check-cinematic-contract.mjs` disagree,
**the guard wins** and the document is the bug: run `npm run cine:check`.

Everything is a browser ES module with **no side effects at import time**. The
guard imports each module in Node and fails it if touching `window` or
`document` at the top level throws. Every browser dependency arrives through the
options object so it can be replaced in a test.

---

## 0. Ownership, so the three branches do not collide

| module | owns | never touches |
| --- | --- | --- |
| `manifest.js` | what exists, which URL, which variant, progress to index | the DOM |
| `sequence-loader.js` | when bytes are fetched, which decoded frames are resident | the DOM, the canvas, scroll |
| `scroll-stage.js` | which index the visitor is on, and painting it | anything outside the `<canvas>` |
| `fallback.js` | what the visitor sees when the sequence is unavailable, and all DOM meaning | the canvas contents, the network |
| `index.js` | wiring the four together | any of their internals |

Hard rules, each enforced by a guard:

1. **Nobody but `manifest.js` constructs a URL.** `frameUrl(variant, i)` returns
   `variant.frames[i]` or throws. There is no pattern, no padding rule, no
   extension to get wrong.
2. **Nobody but `sequence-loader.js` calls `fetch` or creates an `ImageBitmap`.**
3. **Nobody but `scroll-stage.js` touches the `<canvas>` element.**
4. **Nobody but `fallback.js` sets `hidden`, `aria-hidden` or `data-cine-state`
   on the stage subtree.**
5. **No module applies `transform`, `opacity`, `filter`, `mask`, `clip` or
   fragmentation to any element containing readable text.** Motion lives inside
   the stage, and the stage contains no words.

---

## 1. `assets/cinematic/manifest.js` (already written, do not reimplement)

```js
export const SEQUENCE_IDS   // ['signal-to-system','system-to-outcomes','system-to-decision']
export const VARIANT_NAMES  // ['desktop','mobile']
export const FIT            // 'cover' - the only implemented fit
export class ManifestError extends Error { reason; context }

export function frameIndexForProgress(progress: number, frameCount: number): number
export function frameUrl(variant, index: number): string
export function selectVariant(sequence, { matchMedia? }): { name, variant }
export function keyframeForChapter(variant, chapterId: string): Keyframe
export function validateManifest(obj, { sourceUrl? }): Manifest   // throws ManifestError
export async function loadManifest(url, { fetchImpl?, signal? }): Promise<Manifest>
```

`frameIndexForProgress` is the **only** definition of the mapping:

```
progress = clamp((scrollY - stageTop) / (stageHeight - viewportHeight), 0, 1)
index    = clamp(Math.round(progress * (frameCount - 1)), 0, frameCount - 1)
```

`Math.round`, not `floor`, so progress 1 reaches the final frame and scrolling up
retraces exactly the integers scrolling down produced. Do not re-derive it, do
not add easing, do not add hysteresis. A second copy is a copy that can agree
with a bug.

Errors: every failure throws `ManifestError` with a `reason` code. Nothing here
repairs a bad manifest or returns a partially valid one.

---

## 2. `assets/cinematic/sequence-loader.js`

```js
export function createSequenceLoader(variant, options?): SequenceLoader
```

```js
options = {
  strides       = variant.strides,        // e.g. [16, 4, 1]
  decodeWindow  = variant.decodeWindow,   // max decoded frames resident
  maxConcurrent = 6,
  fetchImpl     = globalThis.fetch,
  decodeImage   = defaultDecoder,         // (Blob) => Promise<ImageBitmap|HTMLImageElement>
  onDiagnostic  = () => {},
}
```

```js
SequenceLoader = {
  get(index): Image | null           // SYNCHRONOUS. resident frame or null. never throws,
                                     // never fetches as a side effect of reading.
  nearest(index): { index, image } | null   // nearest resident frame, either direction
  setFocus(index): void              // declare where the visitor is. cheap and idempotent:
                                     // called every rAF tick.
  prime(): Promise<PrimeResult>      // start stride pass 1. resolves when the skeleton is
                                     // resident OR when it has settled as failed.
  pause(): void
  resume(): void
  destroy(): void
  get stats(): { resident, inFlight, failed, bytes, paused, generation }
}

PrimeResult = { ok: boolean, resident: number, requested: number, failed: number }
```

**Behaviour that is not negotiable**

- `get()` is synchronous and allocation free on the hot path. The stage calls it
  inside `requestAnimationFrame`.
- `setFocus(i)` re-centres the rolling window on `i`, **aborts in flight fetches
  now outside the window** (`AbortController`, one generation counter per focus
  change), and schedules the next stride pass. Fast scrolling must not leave
  hundreds of requests queued.
- The stride ladder runs coarse to fine: pass 1 requests every `strides[0]`-th
  frame across the whole sequence, so any scroll position has something within
  `strides[0]` of it; later passes fill in, and only within the window.
- At most `decodeWindow` decoded frames are resident. Evicted `ImageBitmap`s are
  `close()`d. Never hold the whole sequence.
- `pause()` stops all network and decode work. `resume()` restarts it.
  **Calling `resume()` twice must not start a second scheduling loop**, and the
  loader's own tests must assert that, because a duplicated loop is invisible
  until it doubles the request count.
- A failed frame **never** rejects `prime()` and never throws into the stage. It
  raises `stats.failed`, emits `frame-failed`, and the stage keeps its last good
  frame. If every frame of pass 1 fails, `prime()` resolves `{ ok: false }` and
  the caller degrades.

**Diagnostics** (`onDiagnostic(event)`):

```
{ type:'frame-loaded',  index, bytes, ms }
{ type:'frame-failed',  index, status?, error? }
{ type:'pass-complete', stride, resident, total }
{ type:'aborted',       count, reason:'scroll'|'pause'|'destroy' }
{ type:'window-evicted',count, resident }
{ type:'paused' } | { type:'resumed' }
```

---

## 3. `assets/cinematic/scroll-stage.js`

```js
export function createScrollStage(stageEl, sequence, variant, loader, options?): ScrollStage
```

```js
options = {
  canvas        = stageEl.querySelector('canvas[data-cine-canvas]'),
  requestFrame  = requestAnimationFrame,
  cancelFrame   = cancelAnimationFrame,
  maxDpr        = 2,
  onDiagnostic  = () => {},
  onFatal       = () => {},   // called once, with an Error, before the loop stops
}
```

```js
ScrollStage = {
  start(): void       // idempotent. a second call while running is a no-op.
  stop(): void
  destroy(): void
  measure(): void     // recompute stage geometry and canvas backing store
  get progress(): number          // 0..1
  get frameIndex(): number        // the index it INTENDS to paint
  get paintedIndex(): number|null // the index it last actually drew. null until a real draw.
  get running(): boolean
}
```

**Scroll**

- One `passive: true` `scroll` listener that records `scrollY` and requests a
  frame. Nothing else.
- **No `preventDefault`, no `wheel` handler, no snapping, no smooth scroll
  dependency, no scroll position writing.** The visitor's scroll behaves exactly
  as they expect at all times.
- Progress and index come from `frameIndexForProgress`. Nothing else computes it.

**Sizing, and the trap this repository has already fallen into**

- Backing store = `getBoundingClientRect()` of the canvas times
  `min(maxDpr, devicePixelRatio)`.
- **If either CSS dimension measures 0, do not size the canvas.** Emit
  `{ type:'measure-deferred', reason:'zero-box' }` and retry on the next resize
  or intersection. A canvas sized while `display:none` returns zero width, and
  the backing store silently stays at the 300x150 default: the page then draws at
  a ninth of its resolution with nothing in the console.
- `paintedIndex` stays `null` until a frame has been drawn into a correctly sized
  store. It is never set optimistically.
- Emit `{ type:'sized', cssWidth, cssHeight, dpr, backingWidth, backingHeight }`
  on every successful size, so a guard can read what actually happened.

**Painting**

- Exactly `ctx.drawImage(image, dx, dy, dw, dh)` with a **centred cover** fit
  computed from `variant.width / variant.height` and the backing store size.
  No other fit. The guards' `coverSamplePoints()` assumes precisely this, so a
  different fit fails a test rather than shipping.
- If `loader.get(index)` returns null, **do not clear the canvas**. Keep the last
  good frame and emit `{ type:'skipped', reason:'no-frame', index }`. Never flash
  a blank canvas, never draw a partial frame.
- If the index has not changed, do not redraw.

**Visibility**

- On `visibilitychange` to hidden: `cancelFrame`, `loader.pause()`, emit
  `{ type:'paused' }`.
- On visible: `loader.resume()`, one `measure()`, then a single `requestFrame`.
  No catch up loop, no jump, and exactly one rAF loop alive at any moment.

**Errors**

- Any throw inside the tick is caught, emitted as `{ type:'error', error }`,
  passed to `onFatal(error)` once, and the loop stops. The stage never retries
  into a loop that throws every frame.

---

## 4. `assets/cinematic/fallback.js`

```js
export function createFallbackLayer(stageEl, sequence, variant, options?): FallbackLayer
```

```js
options = {
  primeTimeoutMs = 6000,
  matchMedia     = window.matchMedia,
  onDiagnostic   = () => {},
}
```

```js
FallbackLayer = {
  showPoster(): void          // the state on first paint, before any sequence work
  applyReducedMotion(): void  // static keyframe per chapter, no scrubbing
  degrade(reason: string): void   // permanent switch to the static path. idempotent.
  armWatchdog(primePromise): void // degrade('prime-timeout') if prime has not settled
  isDegraded(): boolean
  get state(): 'poster'|'scrubbing'|'reduced'|'degraded'
}
```

- **`showPoster()` is the starting state and costs no JavaScript.** The poster
  `<img>` and `data-cine-state="poster"` are in the served HTML. LCP never waits
  on the sequence and the canvas is never shown blank.
- `armWatchdog` is what makes "never a loader forever" mechanical rather than a
  promise: if `prime()` has not settled within `primeTimeoutMs`, the layer
  degrades on its own.
- `degrade(reason)` hides the canvas with `aria-hidden="true"`, removes it from
  the hit area, destroys the loader, leaves the poster visible, and emits
  `{ type:'degraded', reason }`. Every word, price, label, button and piece of
  product UI stays exactly where it was, because none of it was ever in the
  canvas.
- **Reduced motion is decided live**, by evaluating
  `matchMedia('(prefers-reduced-motion: reduce)')` at decision time and listening
  for changes, and additionally honouring the site's own `nv-motion` toggle and
  the `motion-off` class the way `site.js` does. It is not a boolean captured
  once at load, and no reduced motion rule may be scoped to a class that is
  absent precisely when reduced motion is on. Under reduced motion nothing
  scrubs: each chapter shows its static keyframe and the dolly and large spatial
  transforms are removed.

---

## 5. `assets/cinematic/index.js`

```js
export async function mountCinematic(options?): Promise<CinematicHandle>
```

```js
options = {
  manifestUrl = '/assets/cinematic/manifest.json',
  stages      = document.querySelectorAll('[data-cine-stage]'),
  onDiagnostic = () => {},
}

CinematicHandle = {
  stages: Map<sequenceId, { stage, loader, fallback }>,
  destroy(): void,
  state(): Record<sequenceId, string>,   // the data-cine-state of each stage
}
```

Order, which is the whole of the LCP rule:

1. Poster and copy are already painted from the served HTML. Nothing below
   blocks them.
2. `loadManifest()`. On any `ManifestError`: every stage degrades, and the
   function resolves. It does not reject and does not leave a spinner.
3. Reduced motion or motion off: `applyReducedMotion()` for every stage and
   stop. No loader is created and no frame is fetched.
4. Otherwise, per stage: `selectVariant`, `createSequenceLoader`,
   `createFallbackLayer`, `armWatchdog(loader.prime())`, `createScrollStage`,
   `stage.start()`.
5. Any stage that throws degrades on its own. One broken stage never takes the
   other two down.

---

## 6. DOM contract

The markup all three modules agree on. It is real HTML in the served page, not
built by script.

```html
<div class="cine-stage"
     data-cine-stage="signal-to-system"
     data-cine-sections="1 2"
     data-cine-state="poster">
  <div class="cine-stage__sticky" aria-hidden="true">
    <canvas data-cine-canvas role="presentation" aria-hidden="true"></canvas>
    <img data-cine-poster src="..." alt="" decoding="async" fetchpriority="high">
  </div>
  <!-- the real sections follow, layered beside or over the stage:
       their own headings, their own copy, their own prices, their own
       single primary action each. -->
</div>
```

- `data-cine-state` is exactly one of `poster`, `scrubbing`, `reduced`,
  `degraded`. It starts at `poster` in the served HTML, so a visitor with no
  JavaScript gets the poster, the full written narrative, working pricing and
  working calls to action.
- The canvas is decoration: `aria-hidden`, `role="presentation"`, no alt text
  meaning. **No essential information exists only in canvas pixels.**
- `.cine-stage__sticky` is `pointer-events: none`. Pricing cards, buttons and
  links must never sit under the canvas hit area, and a guard asserts that by
  hit testing each pricing card's centre.
- The seven `data-ia` sections keep their own semantic headings and their single
  primary action each. A sequence may span adjacent sections visually; it never
  merges them.
- Sticky stages release cleanly at their end and the canvas never overlaps the
  following content. Text stays selectable and zoomable.

---

## 7. What the guards will do to you

`tests/helpers/cinematic.js` provides, and every cinematic spec must use:

- `assertServingThisWorktree(page)` first, before any measurement is believed.
  It checks the branch sentinel token **and** that the served placeholder
  manifest's `generatedAt` matches this checkout's. Serve on `NV_PORT=3291`
  (`npm run cine:serve`). Another agent is running its own suite on the default
  port right now; a spec that attaches to a stranger's server passes while
  measuring the wrong application.
- `canvasMetrics(page, selector)`: throws on a zero CSS box, on a 300x150
  backing store, and on a backing store that does not match the CSS box times
  `min(2, dpr)`.
- `readCanvasFrame(page, selector, variant)`: returns the frame index **read out
  of the canvas pixels**. `stage.frameIndex` is never trusted by a guard.
- `expectedFrameIndex(page, stageSelector, frameCount)`: what the index should be
  for the live scroll position, computed independently.

Never run two Playwright invocations at once in this workflow.
