# nevamis.ca

Marketing site for Nevamis AI (Edmonton AI receptionist studio).
Plain HTML/CSS/JS, no build step, hosted on **GitHub Pages** with the custom
domain `nevamis.ca` (DNS at Porkbun).

## Structure

| File | Purpose |
|---|---|
| `index.html` | Home: hero + signal scene, call proof, how it works, coverage modes, industries, ROI calculator, process, offers, founder, FAQ, final CTA |
| `demo.html` | Live-demo page (call the AI, test scenarios, example call) |
| `book.html` | Strategy-call booking (links to Cal.com) |
| `about.html`, `privacy.html`, `terms.html`, `404.html` | Supporting pages |
| `assets/motion/site.css` | Design system (palette, components, responsive, reduced-motion). The old root `styles.css` was deleted on 2026-08-07: no page had linked it for months, so edits made there silently did nothing. |
| `assets/fonts/fonts.css` | Self-hosted faces. Bricolage Grotesque and Spline Sans Mono are single **variable** files declared over their full weight range (`200 800` / `300 700`); do not add per-weight files. |
| `site.js` | Nav, motion toggle, signal-scene canvas, call player, tabs, ROI calc, reveals, analytics layer |
| `assets/` | Call audio (call-0..5.mp3), founder photo |
| `docs/higgsfield-prompts.md` | Generative-asset production record + prompts |
| `serve.js` | Local preview: `node serve.js` → http://localhost:3211 |

## Editing

- **Phone number / email:** search-replace `(587) 413-0035`, `+15874130035`, `Sales@nevamis.ca` across the HTML files.
- **Booking link:** `book.html` → `https://cal.com/daren-qvlah4/nevamis-intro`. Change here if the Cal.com event moves.
- **Offers:** there is exactly one, and it is the price. One recurring figure per plan (pricing-config.js), no setup or activation charge, no pilot and no trial; the free 7-day pilot and the money-back guarantee are both retired. The copy lives in `index.html` section `#risk`, the FAQ, and `pilot.html` (kept at that URL on purpose, as the How You Start page). Confirm with docs/CLAIMS-LEDGER.md before changing anything public.
- **Demo transcript:** `index.html` + `demo.html` `.line` blocks must match the audio verbatim; regenerate text via speech-to-text if the audio changes.

## Deploy

```
git add -A && git commit -m "..." && git push
```
GitHub Pages redeploys `main` automatically (~1 min). HTTPS enforced.

## Analytics

`site.js` exposes `nvTrack(name, data)` and queues into `window.nvEvents`.
CTAs carry `data-evt` attributes (hero_book_call_click, demo_phone_click,
demo_audio_play, demo_audio_complete, booking_start, booking_page_view,
roi_calculator_complete). Nothing is sent anywhere until you add a provider:
- **GA4:** paste the gtag snippet into each page's `<head>`; events forward automatically.
- **Plausible:** add their script tag; events forward via `window.plausible`.

## Environment / integrations

The site itself needs no secrets. Related service config lives in
`C:\Users\daren\ai-assistant\.env` (Twilio, ElevenLabs, Cal.com, Stripe).
See `.env.example` for names only.

## Prelaunch

Open `PRELAUNCH.md` for the short list of items requiring the owner's
confirmation.

