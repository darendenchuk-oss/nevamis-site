# Media manifest — nevamis.ca

| Asset | Purpose | Model | Duration | Target size | Poster | Used in | Fallback | Status |
|---|---|---|---|---|---|---|---|---|
| assets/hero-loop.mp4 | Hero cinematic loop (call→routed→booked) | Kling 3.0 / Seedance 2.0 (TBD at generation) | 9–12s | ≤3MB mobile / ≤4.5MB desktop | assets/hero-poster.webp | index hero (auto-swaps in via motion.js HEAD check) | signalScene canvas | **PENDING — Higgsfield API blocked: `only_website_usage_on_trial_is_available` (403), verified 2026-07-23. Unlocks when trial converts or via manual website generation.** |
| assets/hero-poster.webp | Instant hero paint | crop of selected keyframe | — | ≤120KB | — | index hero | — | PENDING (same gate) |
| assets/ind-electrical.mp4 (+poster) | Industry card loop | TBD | 4–6s | ≤1.5MB | webp | index #industries | current gradient art | PENDING (same gate) |
| assets/ind-hvac.mp4 (+poster) | Industry card loop | TBD | 4–6s | ≤1.5MB | webp | index #industries | gradient | PENDING (same gate) |
| assets/ind-restoration.mp4 (+poster) | Industry card loop | TBD | 4–6s | ≤1.5MB | webp | index #industries | gradient | PENDING (same gate) |
| assets/ind-auto.mp4 (+poster) | Industry card loop | TBD | 4–6s | ≤1.5MB | webp | index #industries | gradient | PENDING (same gate) |
| assets/og-card.jpg | Social share 1200×630 | crop of hero keyframe + code text | — | ≤150KB | — | all pages og:image | none (tags absent until asset exists) | PENDING |
| assets/call-0..5.mp3 | Demo call audio (6 turns, 28.7s) | ElevenLabs (Ava/Mark) | 28.7s total | 300KB total | — | index + demo call proof | transcript text | **LIVE** |
| assets/daren.jpg | Founder photo | real photo | — | 30KB | — | index #risk, about | alt text | **LIVE** |

Integration contract already shipped: motion.js probes `assets/hero-loop.mp4` with a
HEAD request; when the file exists it swaps in `<video muted playsinline loop
preload="metadata" poster>` with IO play/pause, chip sync to video time, and
reduced-motion/pause-toggle compliance. Dropping correctly named files into
`assets/` and pushing is the entire integration step for the hero.
