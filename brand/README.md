# Brand marks

Generated, not hand-drawn. Re-render after any change to `logo-gif.html`:

```
node scripts/make-logo-gif.mjs
```

| File | Use |
|---|---|
| `nevamis-mark-256.gif` | Email signature, Slack, anywhere animation plays |
| `nevamis-mark-128.gif` | Small slots, or clients that ignore size attributes |
| `nevamis-mark-256.png` | Email PROFILE photos, Outlook signature editor, anything that strips animation |

The animation is the site header's own `onepulse` (styles.css:319), looped,
plus one ring leaving the dot. The colours are read from the same tokens the
site uses — if the brand changes in `styles.css`, this is wrong until it is
re-rendered.

Frames land in `brand/.frames/` and are safe to delete; the renderer rebuilds
them.

## Why it is built this way

Playwright steps the CSS clock frame by frame rather than screen-recording,
because a recording samples whenever the compositor feels like it and the loop
never closes — which shows up as a stutter every cycle. Frame-stepping gives a
closed loop: frame 60 is byte-identical to frame 1, and the test below proves
it rather than assuming it.

ffmpeg builds one palette across the whole clip and dithers with Bayer rather
than error diffusion. Error diffusion crawls between frames and turns a flat
near-black background into visible static.
