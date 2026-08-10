# film-v2 — COST PLAN

## Spent this run
**Zero.** No Higgsfield credits, no ElevenLabs characters, no external API calls,
no live-site change. Higgsfield balance unchanged at **959.04**.

Every Gate A artifact is deterministic: Chromium + the repo's own fonts, tokens
and mark; ffmpeg and Pillow for inspection.

## Projected, by gate

| Gate | Work | Higgsfield | ElevenLabs | Notes |
|---|---|---|---|---|
| **A** (this run) | Ledger, bible, script, storyboard, 8 styleframes, audits | **0** | **0** | complete |
| **B** | Zero-generation Remotion animatic; temp narration | **0** | ~1.5k chars *(temp scratch VO only)* | Needs `APPROVE GENERATION` for even scratch VO — say if TTS is exempt |
| **B′** | Blind voice audition, 3 roles × ~6 candidates × final lines | 0 | ~12–15k chars | Chosen on performance, not popularity |
| **C** | One generated motion test **only if still needed** | ~54 (1 × 1080p) | 0 | May be **0** — see below |
| **D** | Master production + final VO | 0–162 (max 2–3 textless environment elements) | ~6k chars | Higgsfield never generates UI, text, numbers, logos or claims |
| **E** | Cutdowns (40/30/15/6s + 9:16) + site integration | **0** | 0 | Built from master parts |

**Ceiling: ~216 Higgsfield credits**, against 959.04 available — and the honest
expectation is lower. Every styleframe here was achieved deterministically, so
the case for *any* generation is now weaker than when V1 assumed twelve CGI
shots. **Generation must justify itself against a deterministic alternative,
per shot.**

## Cost-control rules
1. `get_cost: true` before every submission. **It returns per-image, not per-batch** — verified the hard way in V1.
2. A workspace must be explicitly selected or submissions fail while credits appear available.
3. Stills before video, always. V1's still-first pass rejected 12 of 16 candidates for 2 credits each instead of 54.
4. Decline preset recommendations that would override a locked look.
