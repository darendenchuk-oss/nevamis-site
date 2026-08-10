# film-v2 — SKILL LEDGER

Phase Zero inventory. **A tool is listed as INVOKED only where a concrete
artifact or decision is named.** Everything else is explicitly excluded.

## Environment
- Node v24.18.0 · ffmpeg 8.1.2-full (libfreetype, libharfbuzz) · Playwright/Chromium 1.62.1 (project-scoped, `nevamis-engine` devDependencies)
- 115 personal skills in `~/.claude/skills`; 8 plugin marketplaces cached

## Invoked this run

| Tool | Source | Version | Contributes | Where used | Can spend / call out | Status |
|---|---|---|---|---|---|---|
| Playwright + Chromium | `@playwright/test` | 1.62.1 | Deterministic 1920×1080 / 1080×1920 rendering with the repo's real woff2 variable fonts | All 8 styleframes + contact sheet | No | **INVOKED** |
| ffmpeg / ffprobe | gyan.dev full build | 8.1.2 | Frame + media inspection | Verified frame dimensions | No | **INVOKED** |
| Pillow (Python) | system | — | Contact sheet composition, pixel measurement | `CONTACT-SHEET.png` | No | **INVOKED** |
| git | system | — | Archived V1 under `REJECTED-V1/` | Reset | No | **INVOKED** |
| Repo source (brand authority) | `nevamis-site` | working tree | Real tokens, real fonts, the real arc-and-dot mark | `BRAND-MOTION-BIBLE.md`, every frame | No | **INVOKED** |
| Engine source (claim authority) | `nevamis-engine` @ origin/master | — | Verified capability states | `CLAIM-AUDIT.md` | No | **INVOKED** |

## Present, reserved for Gate B (the animatic)

| Skill | Present? | Role at Gate B |
|---|---|---|
| `remotion-best-practices` | ✅ | Composition structure, deterministic timing |
| `remotion-create` | ✅ | Scaffold the `film-v2` Remotion project |
| `remotion-markup` | ✅ | Frame markup conventions |
| `remotion-render` | ✅ | Deterministic render + still export |
| `remotion-captions` | ✅ | Caption timing for the accessibility pass |
| `remotion-docs` | ✅ | API reference |
| `remotion-studio` | ❌ **NOT INSTALLED** | Would be the preview surface |
| `remotion-multimedia` | ❌ **NOT INSTALLED** | Audio/video embedding |
| `remotion-saas`, `remotion-interactivity` | ✅ present | **DELIBERATELY EXCLUDED** — the brief bans SaaS/unrelated Remotion skills |

**No `npx skills add remotion-dev/skills` was needed** — six of the eight
requested Remotion skills were already on disk. Two are genuinely missing.

## Requested but NOT installed — and why

| Package | Status | Reason |
|---|---|---|
| `smixs/visual-skills` | **NOT INSTALLED** | Installing requires a network fetch of third-party code. This run is under a hard "no external API calls until APPROVE GENERATION" freeze. Its value is generation-prompt guidance (Seedance, camera, lighting) — needed at **Gate C**, not Gate A, where every frame is deterministic. |
| `browser-use/video-use` | **NOT INSTALLED** | Same freeze. Its editing/QA discipline is needed at **Gate D**. Its own docs describe external providers I must not configure. |

**This is a reportable deviation, not an oversight.** Both are wanted; both need
you to lift the freeze (or say package installs are exempt from it). Neither
affects Gate A, because no generation prompt exists yet.

## Available, deliberately excluded
`ad-creative`, `design-dna`, `gstack-design-*`, `image`, `video`, `ponytail-review`,
`ab-testing` — none affected a Gate A artifact, so none are claimed.
Higgsfield MCP and the ElevenLabs API were **available and not called**.


---

# Gate A2 update

## visual-skills - INSTALLED and INVOKED
- **Source:** github.com/smixs/visual-skills - **commit `3c554715b5eb30f54de78fac3c0df4a7105e4955`** (2026-08-08)
- **Location:** `film-v2/vendor/visual-skills` (project-scoped, gitignored)
- **Licence: CC BY 4.0 - attribution MANDATORY.** Per its NOTICE: *Visual Skills -
  AI film director skills for Claude agents, Copyright (c) 2026 **Serge Shima**,
  https://github.com/smixs/visual-skills*. Reproduced in `GATE-A2.md`; must survive
  into any published derivative.
- **Honest scope note:** this package is primarily a *generative prompting* skill
  (Nano Banana / GPT Image / Seedance). Its prompt-writing routers were **not used**,
  because Gate A2 generates nothing. What was actually used:
  - `video/references/dramaturgy.md` - the **scene formula** (desire / obstacle /
    space geometry / controlled gaze) drove the one-focal-point-per-frame rule, and
    the **three-detail rule** (environmental pressure + micro-action + motif) is why
    frame 01 carries `2:11 AM - TUESDAY` as pressure rather than decoration.
  - `video/references/camera-lighting-vocabulary.md` - framing, light direction and
    quality; its **transition vocabulary** (motion relay, match cut, occlusion mask)
    is the basis of the 1-2-3-4-5-6-7 transformation plan in `GATE-A2.md`.
  - Its banned-word list ("cinematic", "epic", "stunning") applied as a review filter
    on my own frame descriptions.
- **Can it spend or call out?** No - it is documentation. The models it recommends
  would, and none were called.

## Remotion guidance
`remotion-best-practices`, `remotion-markup`, `remotion-render`, `remotion-create`,
`remotion-docs` read for Gate B structure. **`remotion-studio` and
`remotion-multimedia` remain genuinely NOT INSTALLED.**

## Still not installed
`browser-use/video-use` - needed at Gate D (editing and QA discipline), not Gate A2.
