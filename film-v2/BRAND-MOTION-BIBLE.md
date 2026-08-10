# film-v2 — BRAND & MOTION BIBLE

The website is the visual authority. Every value below was **read from
`assets/motion/site.css` and `index.html`**, not chosen.

## Palette — verified against the repo

| Token | Hex | Role in film |
|---|---|---|
| `--navy-0` | `#02080D` | The world. Deepest ground, end card |
| `--navy` | `#0B1620` | Environment falloff |
| `--navy-2` | `#0D1C27` | Panel top |
| `--navy-3` | `#10222E` | Raised surface |
| `--emerald` | `#2FBF8F` | The mark's arc; live signal, sonar |
| `--emerald-deep` | `#0E5C4B` | Depth under mint |
| `--mint` | `#9FF0CE` | **Confirmation only** — captured, checked, texted |
| `--ink` | `#EAF3EE` | Primary type |
| `--muted` | `#8AA5A0` | Labels, secondary |
| `--warm` | `#F0B462` | **Planned state and urgency only** |

Three tokens exist in the repo that the brief did not list and which the film
may use: `--emerald-mid #1E8E6D`, `--warm-deep #8A6210`, `--bad #E5837B`.
`--bad` is **not used** — nothing in this film is an error state.

**Mint means done. Warm means not yet, or needs a human.** Those two meanings
never swap, which is what lets the last shot be read without narration.

## Type
- **Bricolage Grotesque** (variable) — wordmark, values, display
- **Atkinson Hyperlegible** (400/700) — explanatory copy, transcript
- **Spline Sans Mono** (variable) — labels, states, timestamps, `.mono` at `letter-spacing:.16em`, uppercase

## The mark — verbatim, never redrawn
```svg
<path d="M 15 38 A 17 17 0 0 1 49 38" stroke="#2FBF8F" stroke-width="8" stroke-linecap="round"/>
<circle cx="32" cy="48" r="6" fill="#9FF0CE"/>
```
A sonar arc over a dot. Flat, never extruded, rotated, or made to glow as a 3D
object. **The arc's geometry is the film's environment language** — the
background sonar rings are the same arc at larger radii, which is why the world
and the logo belong to each other rather than merely coexisting.

## Motion
- Primary easing **`cubic-bezier(.16,1,.3,1)`** — confirmed in `site.css`
- Exit easing `cubic-bezier(.7,0,.84,0)` for elements leaving frame
- Maximum **2°** interface tilt · magnetic settle, never bounce
- Mint glow is a *signal*, never ambient decoration
- Reveals are precise: a value arrives, then rests. No perpetual motion
- One primary idea per shot; every frame holds hierarchy when paused

## Scale law (absolute)
- Primary panel occupies **60–90%** of usable frame — measured at 82% on frame 03
- No card as a thumbnail. Minimum label size **32px** at 1920×1080
- Legible at 1280×720 and in the purpose-built vertical composition

## Banned (carried from the brief, enforced in review)
Cream/beige · royal-blue cards · electric-blue CGI · violet planes · concrete
architecture · pits · floating glass slabs · ribbons · random glowing rectangles ·
crypto imagery · generated logos · generated UI text · thumbnail screenshots ·
empty frames with corner labels · faces · stock contractors · "NEVAMIS AI" ·
any pronunciation discussion in audience-facing material.
