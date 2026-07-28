# Analytics event dictionary — nevamis.ca

Events flow through `nvTrack(name, props)` in site.js into `window.nvEvents`
(inert queue) and forward automatically once GA4 or Plausible is wired (see
README). **Never** put names, emails, phone numbers, business names, free-text
input, or customer data in properties.

| Event | Trigger | Allowed props | Business question |
|---|---|---|---|
| demo_phone_click | any "Call the AI" / callbar / phone CTA | none | Does the live line drive interest? |
| hero_live_demo_call_click | hero phone CTA specifically | none | Hero vs nav CTA performance |
| hero_book_call_click | any Book-a-Call CTA | none | Primary conversion intent |
| booking_page_view | book.html load | none | Funnel reach |
| booking_start | Cal.com link click | none | Booking starts |
| demo_audio_play / demo_audio_complete | example-call player | none | Does the proof get consumed? |
| roi_calculator_complete | first full ROI input set | none | Calculator engagement |
| pricing_view_click | homepage pricing preview CTA | none | Pricing interest |
| coming_soon_page_view | coming-soon.html load | none | Roadmap page reach |
| roadmap_service_interest_clicked | "Tell us this would help" card button | service (slug) | Which future service has demand? |
| roadmap_module_activated | journey module toggle | module (slug), on (bool) | Which capability intrigues visitors? |
| roadmap_form_submitted | interest form submit | services (count only) | Roadmap lead volume |
| roadmap_front_desk_cta_clicked | Coming-Soon → Front Desk CTAs | none | Does the roadmap feed the live product? |

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
