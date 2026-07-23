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
| `styles.css` | Design system (palette, components, responsive, reduced-motion) |
| `site.js` | Nav, motion toggle, signal-scene canvas, call player, tabs, ROI calc, reveals, analytics layer |
| `assets/` | Call audio (call-0..5.mp3), founder photo |
| `docs/higgsfield-prompts.md` | Generative-asset production record + prompts |
| `serve.js` | Local preview: `node serve.js` → http://localhost:3211 |

## Editing

- **Phone number / email:** search-replace `(587) 413-0035`, `+15874130035`, `Sales@nevamis.ca` across the HTML files.
- **Booking link:** `book.html` → `https://cal.com/daren-qvlah4/nevamis-intro`. Change here if the Cal.com event moves.
- **Offers (pilot/guarantee):** `index.html` section `#risk` and the FAQ. Confirm before changing publicly (see PRELAUNCH.md).
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
