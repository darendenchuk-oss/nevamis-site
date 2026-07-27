# The Nevamis motion hero

Internal notes. This folder is excluded from the published site.

The staging page is **`home.html`**. It is marked `noindex` and nothing links to
it, so it is invisible to the public and to Google until you decide to promote it.
Your live homepage (`index.html`) is untouched.

---

## Watching it

Start the local preview from the `nevamis-site` folder:

```bash
node serve.js
```

Then open:

| URL | What you get |
| --- | --- |
| `http://localhost:3211/home.html` | The real page, exactly as a visitor sees it |
| `http://localhost:3211/home.html?motionDebug=1` | The same page plus the motion inspector |

### If the page looks frozen

Windows has an accessibility setting called **Animation effects**. When it is
off, the site deliberately shows the finished hero as a still image — that is
correct, respectful behaviour for anyone who gets motion sick, and it is a
requirement of the brief.

If your own machine has it off, you will never see the animation on the real
page. Two options:

1. Add `?motionDebug=1` to the URL — that forces motion on for inspection.
2. Turn animations back on: **Settings → Accessibility → Visual effects →
   Animation effects**.

Most visitors have animations on and will see the full sequence.

---

## What the animation is saying

The hero is not decoration. It tells the same story as the paragraph beside it,
so the product makes sense with the sound off:

| Time | What happens | What it means |
| --- | --- | --- |
| 0.0s | The page wakes from black, a signal crosses the top, the nav slides in | Something is switching on |
| 0.5s | A single node appears and call waves reach it | A call is coming in |
| 1.0s | The Nevamis arch draws itself around the node from both ends, a highlight riding it | Nevamis picks up |
| 2.2s | The node absorbs the signal, **CALL ANSWERED** appears, "Every call," reveals | The call is answered |
| 3.3s | ANSWER → QUALIFY → BOOK → TEXT, each with a real detail (caller intent, service type, preferred time, booking confirmed) | What actually happens to the call |
| 5.2s | The story folds back into the mark, "captured." lands, both buttons spring in | The job is captured |
| 6.3s+ | The mark breathes, a signal occasionally runs through it, it leans toward your cursor | The system is live |

After a pause, the story replays **inside the visual only**. The headline,
navigation and buttons never re-animate — they arrive once and stay.

---

## The motion inspector (`?motionDebug=1`)

A development panel, never shown on the normal page:

- play / pause / restart
- a scrubber and a live time readout
- 0.25× / 0.5× / 1× speed
- a jump button for every beat in the story
- a toggle that simulates reduced motion

Use it to check any single moment without waiting for it to come around.

---

## Proving it actually moves

Screenshots can't prove motion, so there is a real browser test suite.

```bash
npx playwright test
```

13 tests run against a real Chromium: they record the opening sequence to video,
capture live frames, check every narrative state, exercise the custom cursor,
verify reduced motion leaves nothing animating, check keyboard focus, and check
three screen sizes for overflow and button reachability.

Everything lands in **`artifacts/motion-proof/`**:

- `hero-opening-sequence.webm` — the whole thing playing in real time
- `contact-sheet.png` — that video as a grid of frames, easiest to skim
- `state-*.png` — each narrative beat
- `layout-*.png`, `story-*.png` — desktop, laptop and phone
- `REPORT.md` — what each file proves

These are local only; they are gitignored and never published.

---

## How it is built

Free and open-source, no subscriptions, no paid tools, nothing phoning home.

```
assets/vendor/     GSAP + ScrollTrigger + MotionPathPlugin (downloaded, local copies)
assets/motion/
  tokens.js        durations, easings, and the beat map — one place to tune feel
  hero.js          the opening sequence and the living idle
  cursor.js        the custom cursor
  debug.js         the inspector (only loads with ?motionDebug=1)
  main.js          wires it together
home.html          markup, styling, and the SVG that tells the story
```

The visual is inline SVG rather than WebGL. SVG keeps the logo geometry exact
and the small type razor-sharp at any screen size, and it costs a fraction of
the battery. WebGL was not used because it would not have made this particular
hero better — it would only have made it heavier.

The site stays plain HTML on GitHub Pages, so it still deploys with a single
`git push` and still costs nothing to host.

---

## Going live

When you approve it:

1. Remove the `noindex` line from `home.html`.
2. Replace `index.html` with it (keeping the existing SEO tags and structured data).
3. Push.

Not done yet — nothing here is public until you say so.
