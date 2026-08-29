# NVFC1: reading a painted frame index off the canvas

Implementation: `scripts/lib/frame-code.mjs`. Generator: `scripts/gen-placeholder-frames.mjs`.
Test side helper: `tests/helpers/cinematic.js`.

## Why

A guard that scrolls the page, asks the stage `stage.frameIndex`, and asserts on
the answer proves nothing. It passes against a stage that computes an index
correctly and paints nothing, against one that paints into a 300x150 default
backing store, and against one that draws the wrong sequence. All three of those
have real precedent in this repository.

So every **placeholder** frame carries its own identity in its pixels. Guards
recover the identity from the canvas and never consult the engine.

Production frames carry no code strip. Against a `kind: "production"` manifest
the decoder returns `{ ok: false, reason: 'no-code' }`, which is the honest
answer. It never invents an index.

## Where the strip sits

**Centred on the frame**, not in a corner.

The stage draws with a centred `cover` fit. Under a centred cover crop the one
point guaranteed to survive is the centre; a corner is the first thing lost when
the stage's aspect ratio differs from the frame's.

For a frame `W x H`:

```
cell = max(8, round(min(W, H) / 24))
strip is 10 cells wide, 1 cell tall
x0 = round((W - 10 * cell) / 2)
y0 = round((H - cell) / 2)
cell k is sampled at its centre: (x0 + k*cell + cell/2, y0 + cell/2)
```

The generator paints a black quiet zone of `cell / 4` around the strip and paints
the strip last, so no artwork can bleed into a cell centre under interpolation
and nothing can be drawn over it.

## The ten cells

| cell | meaning |
| --- | --- |
| 0 | START sentinel, magenta `#FF00FF` |
| 1 | sequence ordinal, base 4 (0 signal-to-system, 1 system-to-outcomes, 2 system-to-decision) |
| 2..7 | frame index, base 4, most significant digit first, so 0..4095 |
| 8 | checksum: `(ordinal + sum of index digits) mod 4` |
| 9 | END sentinel, cyan `#00FFFF` |

Digit colours: `0` red `#FF0000`, `1` green `#00FF00`, `2` blue `#0000FF`,
`3` white `#FFFFFF`.

The NEVAMIS palette is deliberately **not** used for the strip. Navy, emerald and
mint sit close together in RGB and would classify ambiguously after a downscale.
The six reference colours above are 255 apart at their closest, so a sample can
be classified with 127 of slack.

Classification is nearest reference by Euclidean RGB distance, with a hard
threshold: a sample further than `CLASSIFY_MAX_DISTANCE = 96` from every
reference is not a code cell. Because 96 is less than half the minimum pairwise
distance, "accepted" and "misread as the wrong colour" are mutually exclusive
outcomes.

## Decoding, end to end

1. Read the canvas backing store size from the page. `tests/helpers/cinematic.js`
   throws here if the box is zero, if the store is still 300x150, or if the store
   does not match the CSS box times `min(2, devicePixelRatio)`.
2. Compute the ten sample points with `coverSamplePoints(frameW, frameH,
   canvasW, canvasH)`. This applies the centred cover maths **independently**;
   it does not ask the stage where it drew.
3. `page.evaluate` one `getImageData(x, y, 1, 1)` per point.
4. `decodeCells(samples)` in Node.

Failure reasons, all named, never a fabricated number:

| reason | meaning |
| --- | --- |
| `no-code` | nothing near a code colour. A production frame, or the canvas is showing something else entirely. |
| `bad-start` / `bad-end` | a sentinel is wrong. Usually a different fit, a different scale, or an offset draw. |
| `checksum` | cells read, arithmetic disagrees. A partial or torn paint. |
| `bad-sequence` | an ordinal with no id. The wrong manifest is loaded. |
| `geometry` | wrong number of samples. |

## What this makes provable

- **Progress maps to the correct integer frame.** Scroll to a position, compute
  the expected index independently with `expectedFrameIndex()` (live geometry,
  shared mapping), read the painted index off the pixels, compare.
- **Upward scroll reverses directly.** Record the painted indices scrolling down,
  scroll back up through the same positions, assert the painted indices are the
  reverse sequence. Not "decreasing": the same integers.
- **The stage paints the sequence it claims.** The ordinal in cell 1 is checked
  against the sequence whose stage was scrolled.
- **The canvas is actually being drawn into.** A sized but never painted canvas
  samples fully transparent and throws before decode.

## Reading a frame by eye

Every placeholder frame also prints its own number, for example `AD 0042/0096`:
sequence letter (A, B, C), variant letter (D or M), frame index, frame count.
The moving emerald bar sweeps top to bottom across the sequence and the mint rail
on the left edge fills with progress, so a stuck frame is visible without tools.

## Mutation evidence

Both generators of truth here were mutation tested rather than assumed:

- Encoding `frameIndex - 1` while writing frames produced 70 self test failures
  and exit 1 from `scripts/gen-placeholder-frames.mjs`.
- Disabling the `frames.length === frameCount` rule in `validateManifest`
  produced `FAIL validateManifest accepts frames.length not equal to frameCount`
  and exit 1 from `scripts/check-cinematic-contract.mjs`.
