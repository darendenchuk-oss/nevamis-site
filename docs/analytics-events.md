# Analytics event dictionary — nevamis.ca

Events flow through `nvTrack(name, props)` in site.js into `window.nvEvents`
(inert queue) and forward automatically once GA4 or Plausible is wired (see
README). **Never** put names, emails, phone numbers, business names, free-text
input, or customer data in properties.

| Event | Trigger | Allowed props | Business question |
|---|---|---|---|
| demo_phone_click | any "Call the AI" / phone CTA | none | Does the live line drive interest? |
| hero_live_demo_call_click | hero phone CTA specifically | none | Hero vs nav CTA performance |
| hero_book_call_click | any Book-a-Call CTA | none | Primary conversion intent |
| callbar_book_click | mobile sticky bar (<=820px), "Book a 15-min call" to /book.html#pick-a-time; not on book.html, where the bar scrolls to the scheduler and sends nothing | none | Does a persistent booking bar start bookings on phones? |
| booking_page_view | book.html load | none | Funnel reach |
| booking_start | Cal.com link click | none | Booking starts |
| demo_audio_play / demo_audio_complete | example-call player | none | Does the proof get consumed? |
| roi_calculator_complete | the visitor's first edit of the homepage ROI calculator, once per page view (see the note below) | none | Calculator engagement |
| pricing_view_click | homepage pricing preview CTA | none | Pricing interest |
| coming_soon_page_view | coming-soon.html load | none | Roadmap page reach |
| roadmap_service_interest_clicked | "Tell us this would help" card button | service (slug) | Which future service has demand? |
| roadmap_module_activated | journey module toggle | module (slug), on (bool) | Which capability intrigues visitors? |
| roadmap_form_submitted | interest form submit | services (count only) | Roadmap lead volume |
| roadmap_front_desk_cta_clicked | Coming-Soon → Front Desk CTAs | none | Does the roadmap feed the live product? |

**Ordering, `callbar_book_click` (2026-09-15).** The engine allowlists event
names and silently drops the ones it does not know, so the name has to exist
there before the site that sends it goes live. This bar used to send
`demo_phone_click`, so shipping the two out of order loses the new count and
the old baseline at the same moment, with nothing failing anywhere.

**`roi_calculator_complete` counted page loads until 2026-09-25.** It was sent
from the calculator's recalculation, and that runs once on load with the
prefilled defaults, so every homepage view sent it whether or not anyone
touched the calculator. Rows before 2026-09-25 are page loads, not calculator
use, and must not be read as engagement (the engine funnel's "ran the
calculator" step included). From 2026-09-25 site.js sends it once, from a
one-shot `input` listener on `#roiForm`, after the visitor's first edit. The
name is unchanged because the engine allowlists event names.

## Funnel diagnostics (added 2026-07-27)

Answers "where do people quit?" and "does the demo line convert?" with names
only. No properties, no identifiers, nothing personal.

| Event | Trigger | Business question |
|---|---|---|
| section_reached_&lt;id&gt; | a `main section[id]` becomes 35% visible, once per visit | Which section is the last one people see? |
| scroll_depth_25 / _50 / _75 / _100 | page depth milestones, once each | How far down does the page actually get read? |
| post_call_prompt_shown | visitor returns to the tab 25s+ after tapping a phone CTA | How many people actually place the demo call? |
| post_call_book_click | the post-call prompt's booking CTA | Does hearing the AI convert to a booking? |
| roi_book_click | CTA inside the ROI results panel | Does the visitor's own number drive booking? |
| inline_scheduler_shown | homepage scheduler scrolled into view | Reach of the embedded booking option |

Reading them: `section_reached_*` counts falling off a cliff between two
sections is the signal to cut or rewrite whatever sits between them.
`post_call_prompt_shown` divided by `demo_phone_click` approximates how many
taps become real calls.

Prohibited everywhere: name, email, phone, business name, problem text,
customer information, form field contents.
