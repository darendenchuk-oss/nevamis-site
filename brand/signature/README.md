# Nevamis animated email signature

The motion card, the production email markup and the pipeline that builds
both. One command rebuilds everything:

```
node brand/signature/build.mjs
```

---

## The motion concept

**"The line picks up."**

Four business domains — `COMMS`, `SALES`, `OPS`, `ADMIN` — arrive on separate
rails, each leaving at its own moment and travelling on its own speed curve.
Mid-flight they are visibly ragged, because that is what a business's inbound
actually looks like. They retime themselves and land on the Nevamis node
together. The arc above it illuminates left cap to right cap — the line
answering. Then one packet leaves, in the brand's action orange rather than
its signal green, and lands on a terminal that surges.

> disconnected → connected → intelligent → automated → action

**The rails are domains, not channels.** They used to read CALLS / FORMS /
TEXTS / TOOLS, which are four ways of contacting a company — so the card
argued, precisely and wrongly, that Nevamis is an answering service. Nevamis
is the layer a whole business runs on and the agent is one capability inside
COMMS. Naming the domains is what makes that legible at this size, and it
puts comms where it belongs: one rail of four, no wider than SALES. The
terminal reads `LIVE` rather than `LINE LIVE` for the same reason — LINE is
telephony, and this is a platform's status.

Four things arrive and one thing leaves. The automation is stated in the
arithmetic rather than in a caption.

This is not a new story invented for the signature. `styles.css` already
calls the dot the caller and the arc the line picking up; the node runs the
site header's own `onepulse` (1 → 1.5 → 1) on the house easing
`cubic-bezier(.2,.7,.2,1)`, and the geometry is the header mark's exact path
data. Nothing here is a second brand.

**The synchronisation is real, not decorative.** Each rail carries its own
easing — eager, steady, hesitant, laggard — blended into one shared curve as
it approaches, so the four do not merely arrive together, they arrive at the
same *speed*. The wobble that says "out of step" is damped by `(1-p)²`, which
is exactly zero at the node, so nothing has to be cleaned up afterwards.

**There is a field behind the rails.** The first cut was 87% flat
near-black with rails at 13–40% alpha, and it read quiet rather than
advanced — correct, but underpowered. The fix was not more movement, it was
more *system*: a constellation of downstream nodes and links that is simply
there at rest, so the still frame reads as an operating layer rather than an
empty stage. It earns its place in the motion too — when the node answers,
the decision **ripples outward through that field** at a finite speed,
reaching the far corners last. That is the claim the whole piece makes: this
does not stop at the phone. The field sits downstream of the router only;
scattered across the whole card, the nodes that landed inside the inbound
fan competed with the four rails and the convergence stopped reading as
convergence.

**One light pass crosses the header** as the arc answers, tinting the
wordmark toward the node's own mint and lifting the dim mono line beneath
it — the identity registering the event rather than sitting through it.

**Frame 0 is the finished composition.** The loop opens on 0.96s of
stillness, and every client that shows only the first frame of a GIF gets a
complete, resolved signature. The cycle ends back in that same state, which
is what closes the loop — `render.mjs` fails the build if the frame at
t=5.0s is not pixel-identical to the frame at t=0.

---

## Deliverables

| File | What it is |
|---|---|
| `nevamis-signature.gif` | **The signature.** 159.6 KB, 960×288 shown at 480×144 |
| `nevamis-signature.png` | Static fallback / first frame — the same resolved composition |
| `nevamis-signature-master.mp4` | High-quality master (x264 crf 14) for re-encoding |
| `nevamis-signature-master.webm` | High-quality master (VP9 crf 18) |
| `signature.html` | Production email markup — paste this |
| `signature.txt` | Plain-text signature |
| `scene.html` | The animation source. `render(t)`, pure function of time |
| `render.mjs` | Playwright frame-stepper + loop proof |
| `encode.py` | GIF encoder, palette engineering, verification |
| `preview.mjs` | Renders the real markup in seven client conditions |
| `build.mjs` | One-command build of all of the above |
| `metrics.json` | Every number below, measured rather than remembered |

## Measured

| | |
|---|---|
| GIF file size | **159.6 KB** |
| Source dimensions | 960 × 288 (2× retina) |
| Display dimensions | 480 × 144 |
| Frames in file | 89 (from 125 rendered) |
| Frame rate | 25 fps (40 ms — a whole number of centiseconds) |
| Loop duration | 5.00 s, loops forever |
| Palette | 256 colours, median-cut with 55 brand entries reserved |
| Dithering | none |
| Longest held frame | 0.96 s |
| Colour error vs source | mean 1.55, p99.9 10.4 |
| Signature footprint | 516 × ~223 px (card 480 × 144 + two text lines) |

---

## Install in Gmail

**Deploy the image first.** `signature.html` points at
`https://nevamis.ca/brand/signature/nevamis-signature.gif`. That URL does not
exist until this directory is committed and pushed — `brand/` is not in
`_config.yml`'s exclude list, so GitHub Pages serves it. Until then the
signature will show a broken image in every client.

```bash
git add brand/signature && git commit -m "Animated email signature" && git push
```

Then confirm the asset is live before pasting anything:

```bash
curl -sI https://nevamis.ca/brand/signature/nevamis-signature.gif | head -1
```

**Then:**

1. Open `signature.html` in a browser.
2. Select the rendered signature — everything from the card to the phone
   number — and copy it. (Copying the *rendered* page, not the HTML source,
   is what preserves the table and the inline styles through Gmail's editor.)
3. Gmail → Settings → See all settings → General → Signature → Create new.
4. Paste. Gmail keeps the image, the layout and all three links.
5. Set it for both **New emails** and **On reply/forward**, then Save Changes.

Gmail strips `<style>` blocks from signatures, which is why every rule here
is inline and why the card carries its own background colour rather than
relying on a `prefers-color-scheme` media query.

---

## Behaviour by client

| Condition | Result |
|---|---|
| Gmail desktop + mobile | Animates, all three links live |
| Apple Mail light + dark | Identical to light — the card sets its own background |
| Gmail dark mode | Identical — explicit `bgcolor` is honoured |
| Outlook (frame 1 only) | Shows the resolved composition; nothing is mid-transition |
| Images blocked | Alt text "Nevamis" in frost, plus every line of real text |
| 320–430 px phones | Card scales down, no horizontal scroll, CTA stays tappable |

Everything readable, clickable or searchable — name, role, site, address,
phone — is real text. The image only ever carried the brand and the motion.

---

## Rebuilding

`build.mjs` refuses to produce a file that is wrong, rather than producing
one and hoping somebody notices. It fails on:

- a loop that does not close (frame at t=total ≠ frame at t=0)
- a frame rate that is not a whole number of centiseconds
- any frame written with a 0 ms delay
- a GIF that does not loop forever
- quantisation error above mean 3.0 / p99.9 16
- **any phone-shaped string that is not the public Ava line**

That last one is an allowlist, not a search for the private number, and
deliberately so: this repository is public, and a check that hunts for a
secret has to write the secret down inside the repository doing the
hunting. Asserting instead that every phone-shaped string *is*
`+1 587 413 0035` stores nothing and rejects strictly more.

### Things that were wrong on the way here, so they stay documented

- **Pillow's `duration` is milliseconds, not centiseconds.** Passing
  centiseconds wrote every frame with a 0 delay; the GIF played at the
  viewer's minimum rather than at 25 fps. `verify()` now reads the file back.
- **MAXCOVERAGE quantisation starved the dense near-blacks**, rendering the
  grid olive and, at 64 colours, the muted-green outbound rail *blue*.
  MEDIANCUT splits by population instead.
- **Population alone still got the brand wrong.** The action packet is the
  only orange in the piece and rounds to nothing by area, so pure median-cut
  rendered `#FF7A3D` as a dull tan. The vocabulary is now reserved first;
  the packet's brightest pixels are byte-exact `(255,122,61)`.
- **An opaque canvas gets LCD subpixel text antialiasing** — red and blue
  fringes on a card containing neither. `alpha:true` on the 2D context is
  what turns it off; Chromium's `--disable-lcd-text` does not reach canvas.
- **Floyd–Steinberg dithering cost 797 KB against 92 KB.** Error diffusion
  changes noise in pixels that did not move and destroys frame differencing.
- **`<img width>` sets an intrinsic width a table cannot shrink below**,
  which pushed the card off any screen under 516 px until it became
  `width:100%; max-width:480px`.
