# Higgsfield production record — Nevamis AI

## Status (2026-07-23)

**No assets generated yet.** The connected account is on a Plus **trial**, which
restricts generation to the Higgsfield website (API returns
`only_website_usage_on_trial_is_available`). API-visible balance: 10 base
credits; website balance during trial: 1,200 credits (website-only).

Two ways to produce the assets:
1. **Now, manually:** log into higgsfield.ai and run the prompts below (uses the
   1,200 website credits).
2. **After the trial converts** to paid Plus: tell Claude "generate the
   Higgsfield hero assets" and they will be produced through the API
   (preflighted costs: kling3_0_turbo 5s ≈ 7.5 credits/take, nano_banana
   still ≈ 1 credit/take).

Until then the hero uses the code-native signal-scene canvas (see `site.js`),
which is also the permanent reduced-motion and no-video fallback.

## 1. Hero cinematic loop (8–12 s, 16:9, model: Kling 3.0 or Seedance 2.0)

> Premium macro commercial cinematography of an abstract communications system
> in deep navy and near-black glass, one emerald voice signal enters frame,
> becomes a controlled waveform, travels through precise routing nodes,
> resolves into a single warm calendar booking light, then emits a clean
> confirmation pulse, restrained volumetric light, realistic optical depth,
> subtle film grain, luxury enterprise technology advertising, calm and
> precise, high contrast with protected negative space for website copy on the
> left, no text, no logos, no people, no robots, no interface elements.

Selection bar: no unstable geometry, no random text, no flicker, clean loop
point, calm camera. Generate 2–3 takes, keep the best.

Integration plan: MP4 (H.264, target ≤ 4 MB desktop) + WebM if available +
poster frame as WebP. `muted playsinline loop autoplay preload="metadata"`,
paused off-viewport and under reduced motion / motion toggle; the canvas scene
remains the fallback.

## 2. Industry stills (3–4, shared grade, 3:2, model: nano_banana or Seedream)

Shared style suffix for all:
> …cinematic editorial photography, deep navy ambient night scene with a single
> emerald signal-light accent, restrained, premium, subtle film grain,
> consistent 35mm lens look, no visible faces, no brand marks, no text,
> correct trade PPE.

Subjects:
- Electrician finishing panel work in a garage at dusk, phone glowing unanswered on the workbench.
- HVAC tech at a rooftop unit at night, city bokeh behind.
- Restoration crew van outside a house at night, warm doorway light.
- Service-counter scene, calm, one warm booked-slot light motif.

If hands/faces/trade details come out unreliable, replace with high-end
abstract service environments instead of publishing bad imagery.

## 3. Social share card (1200×630)

Crop the best hero keyframe; add wordmark and copy in code or an editor.
Never generate text inside the image.

## Asset destinations

- `assets/hero-loop.mp4` / `assets/hero-loop.webm` / `assets/hero-poster.webp`
- `assets/ind-electrical.webp`, `assets/ind-hvac.webp`, `assets/ind-restoration.webp`, `assets/ind-auto.webp`
- `assets/og-card.jpg` (then update `og:image` tags on all pages)

Record final model, seed/settings, and chosen take per asset in this file when
generated.
