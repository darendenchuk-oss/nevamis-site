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

Prohibited everywhere: name, email, phone, business name, problem text,
customer information, form field contents.
