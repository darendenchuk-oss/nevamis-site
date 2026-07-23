# Motion storyboard — Nevamis Phase 2

One motion language sitewide: **the Living Signal** (emerald pulse → routed →
booked orange → confirmed ripple). Every effect below names its purpose;
anything without a purpose was cut. All motion is transform/opacity, gated by
IntersectionObserver, disabled under `prefers-reduced-motion` and the site
motion toggle, and the page reads complete with zero JS.

| # | Section | Visitor question | Start → End | Trigger | Duration/Easing | Asset | Reduced-motion | Mobile | Perf cost | Conversion purpose |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Header | Where am I? | flat header → shadow+active-link on scroll; logo dot emits ONE pulse on load | scroll>hero; load | 300ms ease / 900ms one-shot | CSS | static header | same | trivial | orientation, polish |
| 2 | Hero copy | What is this? | eyebrow/H1/lede/CTAs rise in sequence (line-level, fast) | load | total <900ms, var(--ease) | CSS | all visible | same | trivial | offer readable immediately |
| 3 | Hero visual | Does it feel premium? | poster → Higgsfield loop (call→routed→booked) with HTML CALL/QUALIFIED/BOOKED state chips following video timing | load (poster first), IO pause offscreen | 9–12s loop | hero-loop.mp4 (**pending: trial gate**), poster; canvas = fallback | poster/canvas static | cropped safe, ≤3MB | video decode only while visible | the wow + explains product |
| 4 | Capability strip | What does it do? | static list → slow drifting signal rail w/ active dots | IO in view | 40s/linear, pause hover+focus | CSS | wrapped static | wrapped static | trivial | scannable capability recall |
| 5 | Living Signal spine | Is this one system? | vertical emerald path per section, draws in as each section enters; changes form (pulse→waveform→branch→cal-lock→SMS→data→value→booked) | IO per segment | 600ms per segment | inline SVG segments | fully drawn static | simplified vertical line | trivial | continuity: one directed experience |
| 6 | Call proof | Does it work? | waveform reacts to real audio; chips (QUALIFIED/BOOKED/CONFIRMATION) light at true clip boundaries; summary card slides in only on completion | user presses play | clip-synced (real boundaries) | existing call-0..5.mp3 | transcript static, chips visible | same | rAF while playing | proof, honest sync |
| 7 | Simulator "Watch Nevamis run the front desk" | What exactly happens on MY calls? | idle → FSM steps through scenario; branch highlight; chips extracted; rules gate; outcome | user selects scenario + play/step | ~14s per scenario, step-able, scrub-able | code-native (HTML/CSS/SVG) | static step list shown | vertical stack, shorter labels | rAF only while running | THE explainer/differentiator |
| 8 | Six-step path | How does it work? | one signal travels the 6 pstep cards, activating each | IO, scroll progress (no pinning) | ~260ms/step | CSS+JS | all active | vertical | trivial | process clarity |
| 9 | Coverage tabs | Which mode fits me? | crossfade+slide panel content, active-line indicator moves | tab click | 250ms | CSS | instant swap | same | trivial | keeps context between modes |
| 10 | Industry cards | Is this for my trade? | poster → 4–6s loop on hover/in-view active card | hover/IO (**pending: trial gate**) | 4–6s loops ≤1.5MB | ind-*.mp4 + posters; gradient = current fallback | posters only | posters only, lazy | video only near viewport | relevance + premium |
| 11 | ROI calc | What am I losing? | value tween on change; missed→booked mini-flow pulse | input | 350ms | CSS/JS | instant values | same | trivial | makes loss visceral |
| 12 | Comparison | Why not voicemail/DIY? | rows check in sequentially per column | IO | 80ms stagger | CSS | visible | same | trivial | frames the category |
| 13 | Build Stack | What am I paying for? | 9 layers assemble into one stack | IO | 120ms stagger | CSS | assembled | same | trivial | justifies setup fee + monthly |
| 14 | First week | How fast? | day markers activate along a timeline | IO | 150ms stagger | CSS | visible | vertical | trivial | urgency + credibility |
| 15 | Founder | Can I trust them? | single clean image reveal | IO | 500ms | photo | visible | same | trivial | trust, restraint |
| 16 | FAQ | Objections | height+chevron transition | click | 220ms | CSS | instant | same | trivial | speed of answers |
| 17 | Final CTA | Close | dormant grid → active glow; CTA ring pulse ONCE when in view | IO one-shot | 900ms | CSS (optional CTA loop **pending**) | static | same | trivial | the close |

Cut on purpose: page-transition overlays (adds delay for zero conversion gain
on a 6-page static site), tilt-on-cards (gimmick), letter-by-letter reveals
(brief forbids), constant loops in nav, scroll pinning (brief forbids).

Living Signal continuity map: hero pulse (3) → strip rail (4) → spine (5)
runs the left gutter on desktop / center-line on mobile through proof (6),
simulator (7), path (8) → ROI (11) value → pricing preview (when approved) →
final CTA (17) completes the loop as a booked customer.
